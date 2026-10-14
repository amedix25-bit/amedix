import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Records the patient's explicit authorization allowing one pharmacy to
// dispense a prescription. Only the patient who owns the prescription can
// authorize, and only after an explicit confirm — the pharmacy receives
// nothing until this succeeds.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { prescription_id, pharmacy_id } = body || {};
    if (!prescription_id || !pharmacy_id) {
      return Response.json({ error: 'Missing prescription or pharmacy.' }, { status: 400 });
    }

    const profiles = await base44.entities.PatientProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: 'Patient profile not found.' }, { status: 403 });
    }

    let prescription;
    try {
      prescription = await base44.asServiceRole.entities.Prescription.get(prescription_id);
    } catch (e) {
      return Response.json({ error: 'Prescription not found.' }, { status: 404 });
    }
    if (prescription.patient_id !== profiles[0].id) {
      return Response.json({ error: 'You are not the owner of this prescription.' }, { status: 403 });
    }
    if (prescription.authorized_pharmacy_id) {
      return Response.json({ error: 'This prescription has already been authorized.' }, { status: 400 });
    }
    if (prescription.status !== 'issued') {
      return Response.json({ error: 'Only prescriptions awaiting authorization can be authorized.' }, { status: 400 });
    }

    let pharmacy;
    try {
      pharmacy = await base44.asServiceRole.entities.PharmacyProfile.get(pharmacy_id);
    } catch (e) {
      return Response.json({ error: 'Pharmacy not found.' }, { status: 404 });
    }
    if (pharmacy.status !== 'active') {
      return Response.json({ error: 'This pharmacy is not currently accepting prescriptions.' }, { status: 400 });
    }

    const authorizationDatetime = new Date().toISOString();
    await base44.asServiceRole.entities.Prescription.update(prescription.id, {
      authorized_pharmacy_id: pharmacy.id,
      authorized_pharmacy_user_id: pharmacy.user_id || '',
      authorized_pharmacy_name: pharmacy.pharmacy_name,
      authorized_pharmacy_number: pharmacy.pharmacy_number || '',
      authorized_pharmacy_address: pharmacy.address || '',
      authorization_datetime: authorizationDatetime,
      status: 'authorized',
    });

    await base44.asServiceRole.entities.PharmacyNotification.create({
      pharmacy_id: pharmacy.id,
      pharmacy_user_id: pharmacy.user_id || '',
      type: 'new_authorized',
      title: 'New Authorized Prescription',
      message: `Patient ${prescription.patient_name} with CIN ${prescription.patient_cin} authorized your pharmacy to dispense ${prescription.medication_name}${prescription.strength ? ` ${prescription.strength}` : ''} (${prescription.prescription_id || prescription.id}).`,
      patient_id: prescription.patient_id,
      patient_name: prescription.patient_name,
      patient_cin: prescription.patient_cin,
      prescription_id: prescription.id,
      prescription_ref: prescription.prescription_id || null,
      target: 'prescriptions',
      is_read: false,
    });

    return Response.json({
      pharmacy_name: pharmacy.pharmacy_name,
      pharmacy_number: pharmacy.pharmacy_number || '',
      address: pharmacy.address || '',
      authorization_datetime: authorizationDatetime,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}