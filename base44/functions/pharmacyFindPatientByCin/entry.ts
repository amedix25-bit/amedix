import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { resolvePharmacyActor } from "../../shared/pharmacyStaffAuth.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Pharmacy counter lookup. The pharmacist scans the patient's CIN QR code (or
// types the CIN) and the backend resolves the patient, returning their basic
// identity and the prescriptions authorized to THIS pharmacy — nothing else
// from the patient's record is exposed.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const user = await resolvePharmacyActor(base44, body);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const pharmacyProfiles = await base44.asServiceRole.entities.PharmacyProfile.filter({ user_id: user.id });
    if (pharmacyProfiles.length === 0) {
      return Response.json({ error: 'Pharmacy profile not found.' }, { status: 403 });
    }
    const pharmacy = pharmacyProfiles[0];

    const cin = String(body?.cin || '').trim();
    if (!cin) {
      return Response.json({ error: 'Patient CIN is required.' }, { status: 400 });
    }

    const patientProfiles = await base44.asServiceRole.entities.PatientProfile.filter({ cin });
    if (patientProfiles.length === 0) {
      // Audit trail — failed lookups are recorded too, without exposing any
      // information about who does or does not exist.
      await logClinicalAudit(base44.asServiceRole, {
        actor_user_id: user.id,
        actor_name: user.full_name || 'Pharmacy',
        actor_role: 'pharmacy',
        action: 'pharmacy_patient_lookup_denied',
        action_label: 'patient lookup failed — no patient found with this CIN',
        patient_id: '',
        patient_cin: cin,
        patient_name: '',
        document_id: '',
      });
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
      dispensing_events: (p.dispensing_events || []).map((ev) => ({
        datetime: ev.datetime || '',
        quantity: ev.quantity || '',
        quantity_number: ev.quantity_number ?? null,
        batch_number: ev.batch_number || '',
        pharmacist_name: ev.pharmacist_name || '',
        pharmacy_name: ev.pharmacy_name || '',
        remaining_after: ev.remaining_after ?? null,
        consumed_refill: !!ev.consumed_refill,
        payment_amount: typeof ev.payment_amount === 'number' ? ev.payment_amount : null,
        payment_method: ev.payment_method || '',
      })),
    }));

    // Audit trail — every counter lookup of a patient record is recorded,
    // even when nothing beyond the authorized prescriptions is shown.
    await logClinicalAudit(base44.asServiceRole, {
      actor_user_id: user.id,
      actor_name: user.full_name || 'Pharmacy',
      actor_role: 'pharmacy',
      action: 'pharmacy_patient_lookup',
      action_label: 'identified patient at the pharmacy counter by CIN',
      patient_id: patient.id,
      patient_cin: patient.cin,
      patient_name: patient.full_name,
      document_id: '',
    });

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