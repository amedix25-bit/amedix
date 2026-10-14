import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createPatientNotification } from "../../shared/patientNotifications.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { parseQty, unitWord, totalDispensedOf, findInventoryItems, isItemDispensable } from "../../shared/pharmacyPrescription.ts";

// The pharmacist fills a prescription: records the medication and quantity
// actually dispensed. Supports partial dispensing (dispensing less than the
// authorized quantity, with the remainder filled later) and refills (each
// fill after the original quantity is fully dispensed consumes one
// authorized refill). Stock is decreased for walk-in fills; a reservation
// already held the full quantity. Duplicate transactions are prevented by
// remaining-quantity and refill validation. The patient, the prescribing
// doctor and the pharmacy are all notified, and the transaction is recorded
// in the dispensing history and the clinical audit log.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const pharmacyProfiles = await base44.asServiceRole.entities.PharmacyProfile.filter({ user_id: user.id });
    if (pharmacyProfiles.length === 0) {
      return Response.json({ error: 'Pharmacy profile not found.' }, { status: 403 });
    }
    const pharmacy = pharmacyProfiles[0];

    const body = await req.json().catch(() => ({}));
    const prescriptionId = String(body?.prescription_id || '');
    const pharmacistName = String(body?.pharmacist_name || user.full_name || 'Pharmacist');
    if (!prescriptionId) {
      return Response.json({ error: 'Missing prescription.' }, { status: 400 });
    }

    let prescription;
    try {
      prescription = await base44.asServiceRole.entities.Prescription.get(prescriptionId);
    } catch (e) {
      return Response.json({ error: 'Prescription not found.' }, { status: 404 });
    }
    if (prescription.authorized_pharmacy_user_id !== user.id) {
      return Response.json({ error: 'This prescription is not authorized to your pharmacy.' }, { status: 403 });
    }
    if (!['authorized', 'reserved', 'dispensed'].includes(prescription.status)) {
      return Response.json({ error: 'This prescription cannot be dispensed in its current status.' }, { status: 400 });
    }

    // Authorized quantity and how much has already been dispensed across
    // previous fill transactions.
    const authorizedQty = parseQty(prescription.quantity);
    const unit = unitWord(prescription.quantity);
    const priorEvents = prescription.dispensing_events || [];
    const totalDispensed = totalDispensedOf(prescription);
    // Each consumed refill re-opens the full authorized quantity.
    const capacity = authorizedQty > 0 ? authorizedQty * (1 + (prescription.refills_used || 0)) : 0;
    let remaining = capacity > 0 ? Math.max(0, capacity - totalDispensed) : 0;

    // Refill control: a fill that starts after the original authorized
    // quantity was fully dispensed consumes one authorized refill — the
    // refill re-opens the full original quantity for dispensing.
    let consumedRefill = false;
    let available = remaining;
    if (authorizedQty > 0 && remaining <= 0) {
      consumedRefill = true;
      if ((prescription.refills_used || 0) >= (prescription.refills_authorized || 0)) {
        return Response.json({ error: 'No authorized refills remaining on this prescription.' }, { status: 400 });
      }
      available = authorizedQty;
    }

    // Requested quantity for this fill: the pharmacist can dispense less
    // (partial dispensing) or the full available amount.
    let dispenseQty = body?.dispensed_quantity === undefined || body?.dispensed_quantity === null || body?.dispensed_quantity === ''
      ? available
      : parseQty(body.dispensed_quantity);
    if (dispenseQty <= 0) {
      return Response.json({ error: 'Enter the quantity actually dispensed.' }, { status: 400 });
    }

    if (authorizedQty > 0 && dispenseQty > available) {
      return Response.json(
        { error: `Only ${available} ${unit} of the authorized quantity remain — dispense ${available} or less (partial dispensing is allowed).` },
        { status: 400 }
      );
    }
    if (authorizedQty <= 0 && prescription.status === 'dispensed' && (prescription.dispensed_datetime || prescription.dispensed_quantity)) {
      // No numeric quantity on the prescription: every fill beyond the first
      // is treated as a refill.
      consumedRefill = true;
      if ((prescription.refills_used || 0) >= (prescription.refills_authorized || 0)) {
        return Response.json({ error: 'No authorized refills remaining on this prescription.' }, { status: 400 });
      }
    }

    // Stock control: a reservation already held the full authorized quantity on
    // its batch; a walk-in fill consumes the batch that expires soonest
    // (first-expiry-first-out). Expired, quarantined or recalled stock is
    // never dispensed.
    let batchNumber = '';
    if (prescription.status !== 'reserved') {
      const all = await findInventoryItems(base44, pharmacy, prescription);
      const item = all.find(isItemDispensable);
      if (!item) {
        if (all.length === 0) {
          return Response.json({ error: 'This medication is not in your inventory list. Add it under Inventory first.' }, { status: 400 });
        }
        return Response.json({ error: 'Matching stock is quarantined, expired or recalled and cannot be dispensed. Dispose of the affected batches under Inventory.' }, { status: 400 });
      }
      if (item.quantity_in_stock < dispenseQty) {
        return Response.json({ error: `Not enough dispensable stock — only ${item.quantity_in_stock} ${unit} available.` }, { status: 400 });
      }
      await base44.asServiceRole.entities.PharmacyInventory.update(item.id, {
        quantity_in_stock: Math.max(0, item.quantity_in_stock - dispenseQty),
        updated_datetime: new Date().toISOString(),
      });
      batchNumber = item.batch_number || '';
    } else {
      // Reservation: verify the reserved batch is still safe to dispense.
      let reservedItem = null;
      if (prescription.reserved_inventory_id) {
        try {
          reservedItem = await base44.asServiceRole.entities.PharmacyInventory.get(prescription.reserved_inventory_id);
        } catch (e) { reservedItem = null; }
      }
      if (reservedItem) {
        if (!isItemDispensable(reservedItem)) {
          return Response.json({ error: 'The reserved batch is quarantined or expired and cannot be dispensed. Reject this prescription (the stock is returned) and reserve again from safe stock.' }, { status: 400 });
        }
        batchNumber = reservedItem.batch_number || '';
      }
    }

    const now = new Date();
    remaining = authorizedQty > 0 ? Math.max(0, available - dispenseQty) : 0;
    const medLabel = `${prescription.medication_name}${prescription.strength ? ` ${prescription.strength}` : ''}`;
    const quantityLabel = `${dispenseQty} ${unit}`;

    const event = {
      datetime: now.toISOString(),
      quantity: quantityLabel,
      quantity_number: dispenseQty,
      batch_number: batchNumber,
      pharmacist_name: pharmacistName,
      pharmacy_name: pharmacy.pharmacy_name,
      remaining_after: remaining,
      consumed_refill: consumedRefill,
    };

    const update = {
      dispensed_datetime: now.toISOString(),
      dispensed_by_name: pharmacistName,
      dispensed_pharmacy_name: pharmacy.pharmacy_name,
      dispensed_batch_number: batchNumber,
      dispensed_quantity: quantityLabel,
      total_dispensed_quantity: `${totalDispensed + dispenseQty} ${unit}`,
      status: 'dispensed',
      dispensing_events: [...priorEvents, event],
    };
    if (consumedRefill) {
      update.refills_used = (prescription.refills_used || 0) + 1;
    }
    await base44.asServiceRole.entities.Prescription.update(prescription.id, update);

    // The dispensed medication is added automatically to the patient's
    // Medication section on the first fill, linked to the prescription.
    // Later partial fills and refills do not create a duplicate.
    const medicationRoutes = new Set([
      'oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'inhalation', 'rectal', 'other',
    ]);
    let medicationAdded = false;
    const existingMeds = await base44.asServiceRole.entities.Medication.filter({ prescription_id: prescription.id });
    if ((existingMeds.items || existingMeds).length === 0) {
      try {
        await base44.asServiceRole.entities.Medication.create({
        patient_id: prescription.patient_id,
        patient_user_id: prescription.patient_user_id || '',
        patient_cin: prescription.patient_cin || '',
        patient_name: prescription.patient_name || '',
        prescription_id: prescription.id,
        name: prescription.medication_name,
        active_ingredient: prescription.active_ingredient || '',
        dose: prescription.dosage || '',
        frequency: prescription.frequency || '',
        route: medicationRoutes.has(prescription.route) ? prescription.route : 'other',
        duration: prescription.duration || '',
        special_instructions: prescription.special_instructions || '',
        doctor_notes: prescription.special_instructions || '',
        source: 'doctor_prescribed',
        start_date: now.toISOString().slice(0, 10),
        is_active: true,
      });
        medicationAdded = true;
      } catch (e) {
        console.error('Failed to sync the dispensed medication to the patient record:', e);
      }
    }

    const fillNote = remaining > 0
      ? ` Partial fill — ${remaining} ${unit} remain to be dispensed.`
      : '';

    await base44.asServiceRole.entities.PharmacyNotification.create({
      pharmacy_id: pharmacy.id,
      pharmacy_user_id: user.id,
      type: 'dispensed',
      title: 'Medication Dispensed',
      message: `${quantityLabel} of ${medLabel} dispensed to ${prescription.patient_name}.${fillNote}`,
      patient_id: prescription.patient_id,
      patient_name: prescription.patient_name,
      patient_cin: prescription.patient_cin,
      prescription_id: prescription.id,
      prescription_ref: prescription.prescription_id || null,
      target: 'prescriptions',
      is_read: false,
    });

    await createPatientNotification(base44.asServiceRole, {
      patient_id: prescription.patient_id,
      type: 'medication_update',
      title: remaining > 0 ? 'Medication Partially Dispensed' : 'Medication Dispensed',
      message:
        `${pharmacy.pharmacy_name} dispensed ${quantityLabel} of ${medLabel}.${fillNote}` +
        (remaining === 0 ? ` You can now start your treatment as instructed by ${prescription.doctor_name || 'your doctor'}. The medication was added to your Medication list.` : ''),
      target: 'prescriptions',
      related_id: prescription.id,
    });

    if (prescription.doctor_user_id) {
      await base44.asServiceRole.entities.DoctorNotification.create({
        doctor_user_id: prescription.doctor_user_id,
        doctor_id: prescription.doctor_id || '',
        type: 'prescription_dispensed',
        title: remaining > 0 ? 'Prescription Partially Dispensed' : 'Prescription Dispensed',
        message:
          `${pharmacy.pharmacy_name} dispensed ${quantityLabel} of ${medLabel} for ${prescription.patient_name}.${fillNote}` +
          ` (Ref ${prescription.prescription_id || ''})`,
        patient_id: prescription.patient_id,
        patient_name: prescription.patient_name,
        patient_cin: prescription.patient_cin,
        related_id: prescription.id,
        target: 'find_patient',
        datetime: now.toISOString(),
        is_read: false,
      });
    }

    await logClinicalAudit(base44.asServiceRole, {
      actor_user_id: user.id,
      actor_name: pharmacistName,
      actor_role: 'pharmacy',
      action: 'dispensed_prescription',
      action_label: `dispensed ${quantityLabel} of ${medLabel}`,
      patient_id: prescription.patient_id,
      patient_cin: prescription.patient_cin,
      patient_name: prescription.patient_name,
      document_id: prescription.prescription_id || '',
    });

    return Response.json({
      dispensed_datetime: now.toISOString(),
      remaining,
      consumed_refill: consumedRefill,
      medication_added: medicationAdded,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}