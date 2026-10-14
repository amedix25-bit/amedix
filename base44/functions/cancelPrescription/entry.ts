import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createPatientNotification } from "../../shared/patientNotifications.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { restoreReservedStock } from "../../shared/pharmacyPrescription.ts";

// The prescribing doctor cancels a prescription that has not been dispensed
// (mistake, changed treatment plan, ...). Any stock still held by a
// reservation at the pharmacy is returned to inventory, the prescription is
// voided, and the patient — and the authorized pharmacy, when there is one —
// are notified. The cancellation is recorded in the clinical audit log.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const doctorProfiles = await base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id });
    if (doctorProfiles.length === 0) {
      return Response.json({ error: 'Doctor profile not found.' }, { status: 403 });
    }
    const doctor = doctorProfiles[0];

    const body = await req.json().catch(() => ({}));
    const prescriptionId = String(body?.prescription_id || '');
    const reason = String(body?.reason || '').trim();
    if (!prescriptionId) {
      return Response.json({ error: 'Missing prescription.' }, { status: 400 });
    }

    let prescription;
    try {
      prescription = await base44.asServiceRole.entities.Prescription.get(prescriptionId);
    } catch (e) {
      return Response.json({ error: 'Prescription not found.' }, { status: 404 });
    }
    if (prescription.doctor_user_id !== user.id) {
      return Response.json({ error: 'Only the prescribing doctor can cancel this prescription.' }, { status: 403 });
    }
    if (!['issued', 'authorized', 'reserved'].includes(prescription.status)) {
      return Response.json({ error: 'Only prescriptions that have not been dispensed can be cancelled.' }, { status: 400 });
    }

    // Release any stock the pharmacy is holding for this prescription.
    if (prescription.status === 'reserved') {
      const pharmacyProfiles = prescription.authorized_pharmacy_user_id
        ? await base44.asServiceRole.entities.PharmacyProfile.filter({ user_id: prescription.authorized_pharmacy_user_id })
        : [];
      if (pharmacyProfiles.length > 0) {
        await restoreReservedStock(base44, pharmacyProfiles[0], prescription);
      }
    }

    const now = new Date();
    await base44.asServiceRole.entities.Prescription.update(prescription.id, {
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_by_name: doctor.full_name,
      cancelled_by_role: 'doctor',
      cancelled_datetime: now.toISOString(),
    });

    const medLabel = `${prescription.medication_name}${prescription.strength ? ` ${prescription.strength}` : ''}`;

    await createPatientNotification(base44.asServiceRole, {
      patient_id: prescription.patient_id,
      type: 'medication_update',
      title: 'Prescription Cancelled',
      message:
        `${doctor.full_name} cancelled the prescription for ${medLabel}` +
        (reason ? `: ${reason}.` : '.'),
      target: 'prescriptions',
      related_id: prescription.id,
    });

    if (prescription.authorized_pharmacy_user_id) {
      await base44.asServiceRole.entities.PharmacyNotification.create({
        pharmacy_id: prescription.authorized_pharmacy_id || '',
        pharmacy_user_id: prescription.authorized_pharmacy_user_id,
        type: 'other',
        title: 'Prescription Cancelled by Doctor',
        message: `${doctor.full_name} cancelled prescription ${prescription.prescription_id || ''} (${medLabel}) for ${prescription.patient_name}${reason ? `: ${reason}` : ''}. It can no longer be dispensed.`,
        patient_id: prescription.patient_id,
        patient_name: prescription.patient_name,
        patient_cin: prescription.patient_cin,
        prescription_id: prescription.id,
        prescription_ref: prescription.prescription_id || null,
        target: 'prescriptions',
        is_read: false,
      });
    }

    await logClinicalAudit(base44.asServiceRole, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: 'doctor',
      action: 'cancelled_prescription',
      action_label: `cancelled prescription${reason ? ` (${reason})` : ''}`,
      patient_id: prescription.patient_id,
      patient_cin: prescription.patient_cin,
      patient_name: prescription.patient_name,
      document_id: prescription.prescription_id || '',
    });

    return Response.json({ cancelled_datetime: now.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}