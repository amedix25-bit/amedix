import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Pharmacy counter lookup. The pharmacist scans the patient's CIN QR code (or
// types the CIN) and the backend resolves the patient, returning their basic
// identity and the prescriptions authorized to THIS pharmacy — nothing else
// from the patient's record is exposed.
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
    const cin = String(body?.cin || '').trim();
    if (!cin) {
      return Response.json({ error: 'Patient CIN is required.' }, { status: 400 });
    }

    const patientProfiles = await base44.asServiceRole.entities.PatientProfile.filter({ cin });
    if (patientProfiles.length === 0) {
      return Response.json({ error: 'No patient found with this CIN.' }, { status: 404 });
    }
    const patient = patientProfiles[0];

    const page = await base44.asServiceRole.entities.Prescription.filter(
      { patient_id: patient.id, authorized_pharmacy_user_id: user.id },
      { sort: '-created_date', limit: 50 }
    );
    const prescriptions = (page.items || page).map((p) => ({
      id: p.id,
      prescription_id: p.prescription_id || '',
      medication_name: p.medication_name,
      active_ingredient: p.active_ingredient || '',
      strength: p.strength || '',
      dosage: p.dosage || '',
      route: p.route || '',
      frequency: p.frequency || '',
      duration: p.duration || '',
      quantity: p.quantity || '',
      refills_authorized: p.refills_authorized || 0,
      refills_used: p.refills_used || 0,
      special_instructions: p.special_instructions || '',
      doctor_name: p.doctor_name || '',
      date_prescribed: p.date_prescribed || '',
      status: p.status,
      reservation_code: p.reservation_code || '',
      dispensed_datetime: p.dispensed_datetime || '',
      dispensed_by_name: p.dispensed_by_name || '',
    }));

    return Response.json({
      patient: {
        id: patient.id,
        cin: patient.cin,
        full_name: patient.full_name,
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || '',
      },
      prescriptions,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}