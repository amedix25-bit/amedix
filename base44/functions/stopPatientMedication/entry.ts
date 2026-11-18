import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { gateBlocked } from "../../shared/hospitalAuth.ts";
import { findClinicalCheckIn } from "../../shared/patientAccess.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { createPatientNotification } from "../../shared/patientNotifications.ts";
import { todayStr } from "../../shared/pharmacyPrescription.ts";

// Medication reconciliation — a doctor records that the patient reports no
// longer taking a medication. The medication record is never deleted: it is
// marked inactive with the date and documented reason, so the longitudinal
// history stays traceable. Gated on the patient's active check-in like every
// other clinical write.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const medicationId = String(body?.medication_id || '').trim();
    const reason = String(body?.reason || '').trim();
    if (!medicationId || !reason) {
      return Response.json({ error: 'Medication and reason are required.' }, { status: 400 });
    }

    const docs = await base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id }, { limit: 1 });
    const doctor = (docs.items || docs)[0];
    if (!doctor) return Response.json({ error: 'Doctor profile not found.' }, { status: 403 });

    let meds = [];
    try {
      meds = await base44.asServiceRole.entities.Medication.filter({ id: medicationId }, { limit: 1 });
    } catch (e) { meds = []; }
    const med = (meds.items || meds)[0];
    if (!med) return Response.json({ error: 'Medication record not found.' }, { status: 404 });

    const { checkin } = await findClinicalCheckIn(base44, doctor, med.patient_id);
    if (!checkin) return gateBlocked();

    const today = todayStr();
    const updated = await base44.asServiceRole.entities.Medication.update(medicationId, {
      is_active: false,
      stopped_date: med.stopped_date || today,
      stop_reason: reason,
    });

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: 'doctor',
      action: 'reconciled_medication',
      action_label: 'recorded that the patient no longer takes a medication',
      patient_id: med.patient_id,
      patient_cin: med.patient_cin || '',
      patient_name: med.patient_name || '',
      hospital: doctor.hospital || '',
    });

    if (med.patient_user_id) {
      await createPatientNotification(base44.asServiceRole, {
        patient_id: med.patient_id,
        type: 'medication_update',
        title: 'Medication List Updated',
        message: `${doctor.full_name || 'Your doctor'} recorded that you no longer take ${med.name} during reconciliation. Open Medications to review your list.`,
        target: 'medications',
        related_id: medicationId,
      });
    }

    return Response.json({ medication: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}