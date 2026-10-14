import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createPatientNotification } from "../../shared/patientNotifications.ts";
import { findInventoryItems, isItemDispensable } from "../../shared/pharmacyPrescription.ts";

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(length) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// The pharmacy confirms a reservation for a prescription the patient has
// authorized to it. Stock is held by decreasing the matching inventory item,
// and the patient is notified so they know where to collect.
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
    const pharmacistName = String(body?.pharmacist_name || user.full_name || 'Pharmacy');
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
    if (prescription.status !== 'authorized') {
      return Response.json({ error: 'Only authorized prescriptions that are not yet reserved can be reserved.' }, { status: 400 });
    }

    // Hold stock on the batch that expires soonest (first-expiry-first-out).
    // Quarantined, expired or recalled batches are never reserved.
    const requestedQty = parseFloat(String(prescription.quantity || '').replace(/[^0-9.]/g, '')) || 0;
    const all = await findInventoryItems(base44, pharmacy, prescription);
    const item = all.find(isItemDispensable);
    if (!item) {
      if (all.length === 0) {
        return Response.json({ error: 'This medication is not in your inventory list. Add it under Inventory first.' }, { status: 400 });
      }
      return Response.json({ error: 'Matching stock is quarantined, expired or recalled and cannot be reserved. Dispose of the affected batches under Inventory.' }, { status: 400 });
    }
    if (requestedQty > 0 && item.quantity_in_stock < requestedQty) {
      return Response.json({ error: `Not enough dispensable stock — only ${item.quantity_in_stock} unit(s) available.` }, { status: 400 });
    }
    await base44.asServiceRole.entities.PharmacyInventory.update(item.id, {
      quantity_in_stock: Math.max(0, item.quantity_in_stock - requestedQty),
      updated_datetime: new Date().toISOString(),
    });

    const now = new Date();
    const reservation_code = `RES-${randomSuffix(6)}`;
    await base44.asServiceRole.entities.Prescription.update(prescription.id, {
      reservation_code,
      reserved_inventory_id: item.id,
      reserved_datetime: now.toISOString(),
      reserved_by_name: pharmacistName,
      status: 'reserved',
    });

    await base44.asServiceRole.entities.PharmacyNotification.create({
      pharmacy_id: pharmacy.id,
      pharmacy_user_id: user.id,
      type: 'reservation_confirmed',
      title: 'Reservation Confirmed',
      message: `Reservation ${reservation_code} confirmed for ${prescription.patient_name} (${prescription.medication_name}${prescription.strength ? ` ${prescription.strength}` : ''}).`,
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
      title: 'Prescription Reserved',
      message:
        `${pharmacy.pharmacy_name} reserved ${prescription.medication_name}${prescription.strength ? ` ${prescription.strength}` : ''} for you.` +
        ` Reservation code: ${reservation_code}.`,
      target: 'prescriptions',
      related_id: prescription.id,
    });

    return Response.json({ reservation_code, reserved_datetime: now.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}