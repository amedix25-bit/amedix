import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { createPatientNotification } from "../../shared/patientNotifications.ts";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// The pharmacy dispenses the medication to the patient. Walk-in dispensing
// (without a reservation) checks and decreases stock directly; a dispense
// after a reservation does not decrease stock again because the reservation
// already held it. Every dispense is timestamped and the patient is notified.
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

    // Refill control: the first dispense is the original fill; every further
    // dispense consumes one authorized refill.
    const alreadyDispensed = prescription.dispensed_datetime && prescription.status === 'dispensed';
    if (alreadyDispensed) {
      if ((prescription.refills_used || 0) >= (prescription.refills_authorized || 0)) {
        return Response.json({ error: 'No authorized refills remaining on this prescription.' }, { status: 400 });
      }
    }

    // Stock control: a reservation already held stock, a direct dispense
    // decreases it now.
    if (prescription.status !== 'reserved') {
      const requestedQty = parseFloat(String(prescription.quantity || '').replace(/[^0-9.]/g, '')) || 0;
      const inventoryPage = await base44.asServiceRole.entities.PharmacyInventory.filter(
        {
          pharmacy_id: pharmacy.id,
          medication_name: { $regex: `^${escapeRegex(prescription.medication_name)}$`, $options: 'i' },
        },
        { limit: 50 }
      );
      const items = (inventoryPage.items || inventoryPage).filter(
        (i) => !prescription.strength || !i.strength || String(i.strength).toLowerCase() === String(prescription.strength).toLowerCase()
      );
      const item = items[0];
      if (!item) {
        return Response.json({ error: 'This medication is not in your inventory list. Add it under Inventory first.' }, { status: 400 });
      }
      if (requestedQty > 0 && item.quantity_in_stock < requestedQty) {
        return Response.json({ error: `Not enough stock — only ${item.quantity_in_stock} unit(s) available.` }, { status: 400 });
      }
      await base44.asServiceRole.entities.PharmacyInventory.update(item.id, {
        quantity_in_stock: Math.max(0, item.quantity_in_stock - requestedQty),
        updated_datetime: new Date().toISOString(),
      });
    }

    const now = new Date();
    const update = {
      dispensed_datetime: now.toISOString(),
      dispensed_by_name: pharmacistName,
      dispensed_pharmacy_name: pharmacy.pharmacy_name,
      dispensed_quantity: prescription.quantity || '',
      status: 'dispensed',
    };
    if (alreadyDispensed) {
      update.refills_used = (prescription.refills_used || 0) + 1;
    }
    await base44.asServiceRole.entities.Prescription.update(prescription.id, update);

    await base44.asServiceRole.entities.PharmacyNotification.create({
      pharmacy_id: pharmacy.id,
      pharmacy_user_id: user.id,
      type: 'dispensed',
      title: 'Medication Dispensed',
      message: `${prescription.medication_name}${prescription.strength ? ` ${prescription.strength}` : ''} dispensed to ${prescription.patient_name}.`,
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
      title: 'Medication Dispensed',
      message:
        `${pharmacy.pharmacy_name} dispensed ${prescription.medication_name}${prescription.strength ? ` ${prescription.strength}` : ''}.` +
        ` You can now start your treatment as instructed by ${prescription.doctor_name || 'your doctor'}.`,
      target: 'prescriptions',
      related_id: prescription.id,
    });

    return Response.json({ dispensed_datetime: now.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}