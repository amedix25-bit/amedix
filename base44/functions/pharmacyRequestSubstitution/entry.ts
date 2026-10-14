import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { remainingOf, parseQty, isItemDispensable } from "../../shared/pharmacyPrescription.ts";

// Substitution request — the pharmacist proposes an equivalent product (same
// active ingredient and same strength, a different brand or generic) when the
// prescribed medication is unavailable. The proposal awaits the prescriber's
// decision in AMedix; the original prescription is unchanged while it is
// pending, and the replacement can never be dispensed until the doctor
// approves. AMedix never proposes a clinically different drug.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const prescriptionId = String(body?.prescription_id || '').trim();
    const inventoryId = String(body?.inventory_id || '').trim();
    const reason = String(body?.reason || '').trim();
    if (!prescriptionId || !inventoryId || !reason) {
      return Response.json({ error: 'Prescription, proposed stock item and reason are required.' }, { status: 400 });
    }

    // The requesting pharmacy must be the prescription's authorized pharmacy.
    let profiles = [];
    try {
      profiles = await base44.asServiceRole.entities.PharmacyProfile.filter({ user_id: user.id }, { limit: 1 });
    } catch (e) { profiles = []; }
    const pharmacy = (profiles.items || profiles)[0];
    if (!pharmacy || pharmacy.status !== 'active') {
      return Response.json({ error: 'Pharmacy profile not found or not active.' }, { status: 403 });
    }

    let rxs = [];
    try {
      rxs = await base44.asServiceRole.entities.Prescription.filter({ id: prescriptionId }, { limit: 1 });
    } catch (e) { rxs = []; }
    const rx = (rxs.items || rxs)[0];
    if (!rx) return Response.json({ error: 'Prescription not found.' }, { status: 404 });
    if (rx.authorized_pharmacy_user_id !== user.id) {
      return Response.json({ error: 'This prescription is not authorized to your pharmacy.' }, { status: 403 });
    }
    if (!['authorized', 'dispensed'].includes(rx.status)) {
      return Response.json({ error: 'Substitutions can be requested while the prescription is awaiting reservation or partially dispensed.' }, { status: 400 });
    }
    if (remainingOf(rx) <= 0 && (rx.refills_authorized || 0) <= (rx.refills_used || 0)) {
      return Response.json({ error: 'Nothing remains to dispense on this prescription.' }, { status: 400 });
    }
    if (rx.pending_substitution && rx.pending_substitution.medication_name) {
      return Response.json({ error: 'A substitution is already awaiting the prescriber for this prescription.' }, { status: 409 });
    }

    // The proposed product: the pharmacy's own dispensable stock.
    let items = [];
    try {
      items = await base44.asServiceRole.entities.PharmacyInventory.filter({ id: inventoryId }, { limit: 1 });
    } catch (e) { items = []; }
    const item = (items.items || items)[0];
    if (!item || item.pharmacy_id !== pharmacy.id) {
      return Response.json({ error: 'Proposed stock item not found in your inventory.' }, { status: 404 });
    }
    if (!isItemDispensable(item)) {
      return Response.json({ error: 'The proposed batch is quarantined or expired and cannot be proposed.' }, { status: 400 });
    }
    if (item.quantity_in_stock <= 0) {
      return Response.json({ error: 'The proposed batch has no stock.' }, { status: 400 });
    }

    // Clinical equivalence: same active ingredient, same strength, and a
    // genuinely different product name. A clinically different drug is never
    // accepted — no automatic replacement on availability or price alone.
    const norm = (v) => String(v || '').toLowerCase().trim();
    const rxIngredient = norm(rx.active_ingredient);
    const itemIngredient = norm(item.active_ingredient);
    if (!rxIngredient || !itemIngredient || rxIngredient !== itemIngredient) {
      return Response.json({ error: 'The proposed product must contain the same active ingredient as the prescription.' }, { status: 400 });
    }
    if (rx.strength && item.strength && norm(rx.strength) !== norm(item.strength)) {
      return Response.json({ error: 'The proposed product must be the same strength as the prescription.' }, { status: 400 });
    }
    if (norm(item.medication_name) === norm(rx.medication_name)) {
      return Response.json({ error: 'The proposed product is the same medication — use Fill Prescription for the prescribed product.' }, { status: 400 });
    }

    const pending = {
      medication_name: item.medication_name,
      strength: item.strength || '',
      dosage_form: item.dosage_form || '',
      batch_number: item.batch_number || '',
      inventory_id: item.id,
      quantity_in_stock: item.quantity_in_stock,
      reason,
      requested_by_pharmacy: pharmacy.pharmacy_name,
      requested_by_name: String(body?.requested_by_name || '').trim(),
      requested_datetime: new Date().toISOString(),
    };
    await base44.asServiceRole.entities.Prescription.update(rx.id, { pending_substitution: pending });

    // The prescriber decides through AMedix.
    await base44.asServiceRole.entities.DoctorNotification.create({
      doctor_user_id: rx.doctor_user_id,
      doctor_id: rx.doctor_id || '',
      type: 'substitution_request',
      title: 'Substitution Approval Requested',
      message: `${pharmacy.pharmacy_name} proposes ${item.medication_name}${item.strength ? ` ${item.strength}` : ''} instead of ${rx.medication_name}${rx.strength ? ` ${rx.strength}` : ''} for ${rx.patient_name} — ${reason}. Review it in the patient's Prescriptions.`,
      patient_id: rx.patient_id,
      patient_name: rx.patient_name,
      patient_cin: rx.patient_cin || '',
      related_id: rx.id,
      target: 'find_patient',
      datetime: new Date().toISOString(),
      is_read: false,
    });

    await base44.asServiceRole.entities.PharmacyNotification.create({
      pharmacy_id: pharmacy.id,
      pharmacy_user_id: user.id,
      type: 'other',
      title: 'Substitution Sent for Approval',
      message: `${item.medication_name}${item.strength ? ` ${item.strength}` : ''} proposed to ${rx.doctor_name || 'the prescriber'} for ${rx.patient_name}. The prescription is unchanged until the doctor approves.`,
      target: 'prescriptions',
      prescription_id: rx.id,
      prescription_ref: rx.prescription_id || '',
      is_read: false,
    });

    return Response.json({ ok: true, pending_substitution: pending });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}