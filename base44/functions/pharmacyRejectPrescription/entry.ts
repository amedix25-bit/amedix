import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createPatientNotification } from "../../shared/patientNotifications.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { restoreReservedStock } from "../../shared/pharmacyPrescription.ts";
import { resolvePharmacyActor } from "../../shared/pharmacyStaffAuth.ts";

// The pharmacy rejects a prescription it cannot fill (e.g. the medication is
// unavailable). Any stock still held by a reservation is returned to
// inventory, the prescription is cancelled, and the patient and the
// prescribing doctor are notified so the prescription can be re-issued
// elsewhere. The rejection is recorded in the clinical audit log.
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

    const prescriptionId = String(body?.prescription_id || '');
    const reason = String(body?.reason || '').trim() || 'Medication unavailable at this pharmacy';
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
    if (!['authorized', 'reserved'].includes(prescription.status)) {
      return Response.json({ error: 'Only prescriptions awaiting dispensing can be rejected.' }, { status: 400 });
    }

    // Return any stock still held by a reservation (the full quantity minus
    // what was already dispensed in partial fills).
    await restoreReservedStock(base44, pharmacy, prescription);

    const now = new Date();
    await base44.asServiceRole.entities.Prescription.update(prescription.id, {
      status: 'cancelled',
      rejected_reason: reason,
      rejected_by_name: pharmacistName,
      rejected_by_pharmacy_name: pharmacy.pharmacy_name,
      rejected_datetime: now.toISOString(),
    });

    const medLabel = `${prescription.medication_name}${prescription.strength ? ` ${prescription.strength}` : ''}`;

    await base44.asServiceRole.entities.PharmacyNotification.create({
      pharmacy_id: pharmacy.id,
      pharmacy_user_id: user.id,
      type: 'other',
      title: 'Prescription Rejected',
      message: `Rejected prescription ${prescription.prescription_id || ''} for ${prescription.patient_name} (${medLabel}): ${reason}`,
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
      title: 'Prescription Not Filled',
      message:
        `${pharmacy.pharmacy_name} could not fill ${medLabel}: ${reason}.` +
        ` You can authorize another pharmacy from your Prescriptions page, or contact ${prescription.doctor_name || 'your doctor'}.`,
      target: 'prescriptions',
      related_id: prescription.id,
    });

    if (prescription.doctor_user_id) {
      await base44.asServiceRole.entities.DoctorNotification.create({
        doctor_user_id: prescription.doctor_user_id,
        doctor_id: prescription.doctor_id || '',
        type: 'prescription_rejected',
        title: 'Prescription Rejected by Pharmacy',
        message:
          `${pharmacy.pharmacy_name} could not fill ${medLabel} for ${prescription.patient_name}: ${reason}.` +
          ` (Ref ${prescription.prescription_id || ''}) — follow up or re-issue if needed.`,
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
      action: 'rejected_prescription',
      action_label: `rejected prescription (${reason})`,
      patient_id: prescription.patient_id,
      patient_cin: prescription.patient_cin,
      patient_name: prescription.patient_name,
      document_id: prescription.prescription_id || '',
    });

    return Response.json({ rejected_datetime: now.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}