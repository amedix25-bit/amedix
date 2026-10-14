import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { createPatientNotification } from "../../shared/patientNotifications.ts";

// The prescriber's decision on a pharmacy substitution request. On approval
// the prescription's dispensed product is updated and the substitution is
// recorded permanently (original, replacement, reason, approver, timestamp) —
// the history is never overwritten silently. On rejection the proposal is
// cleared and the pharmacy is told. Only the prescribing doctor decides.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const prescriptionId = String(body?.prescription_id || '').trim();
    const decision = String(body?.decision || '').trim();
    const note = String(body?.note || '').trim();
    if (!prescriptionId || !['approve', 'reject'].includes(decision)) {
      return Response.json({ error: 'Prescription and a decision of approve or reject are required.' }, { status: 400 });
    }

    const docs = await base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id }, { limit: 1 });
    const doctor = (docs.items || docs)[0];
    if (!doctor) return Response.json({ error: 'Doctor profile not found.' }, { status: 403 });

    let rxs = [];
    try {
      rxs = await base44.asServiceRole.entities.Prescription.filter({ id: prescriptionId }, { limit: 1 });
    } catch (e) { rxs = []; }
    const rx = (rxs.items || rxs)[0];
    if (!rx) return Response.json({ error: 'Prescription not found.' }, { status: 404 });
    if (rx.doctor_user_id !== user.id) {
      return Response.json({ error: 'Only the prescribing doctor can decide on this substitution.' }, { status: 403 });
    }
    const pending = rx.pending_substitution;
    if (!pending || !pending.medication_name) {
      return Response.json({ error: 'No substitution is awaiting a decision on this prescription.' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    if (decision === 'approve') {
      const historyEntry = {
        original_medication_name: rx.medication_name,
        original_strength: rx.strength || '',
        replacement_medication_name: pending.medication_name,
        replacement_strength: pending.strength || '',
        reason: pending.reason || '',
        approved_by_name: doctor.full_name,
        approved_datetime: nowIso,
        pharmacy_name: pending.requested_by_pharmacy || '',
      };
      const history = [...(rx.substitution_history || []), historyEntry];
      await base44.asServiceRole.entities.Prescription.update(rx.id, {
        medication_name: pending.medication_name,
        ...(pending.strength ? { strength: pending.strength } : {}),
        substitution_history: history,
        pending_substitution: null,
      });

      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: doctor.full_name,
        actor_role: 'doctor',
        action: 'approved_medication_substitution',
        action_label: 'approved a pharmacy substitution',
        patient_id: rx.patient_id,
        patient_cin: rx.patient_cin || '',
        patient_name: rx.patient_name || '',
      });

      if (rx.patient_user_id) {
        await createPatientNotification(base44.asServiceRole, {
          patient_id: rx.patient_id,
          type: 'medication_update',
          title: 'Prescription Updated',
          message: `${doctor.full_name || 'Your doctor'} approved a substitution: ${pending.medication_name}${pending.strength ? ` ${pending.strength}` : ''} replaces ${rx.medication_name}${rx.strength ? ` ${rx.strength}` : ''} at ${pending.requested_by_pharmacy || 'the pharmacy'}.`,
          target: 'prescriptions',
          related_id: rx.id,
        });
      }
      if (rx.authorized_pharmacy_user_id) {
        await base44.asServiceRole.entities.PharmacyNotification.create({
          pharmacy_id: rx.authorized_pharmacy_id,
          pharmacy_user_id: rx.authorized_pharmacy_user_id,
          type: 'other',
          title: 'Substitution Approved',
          message: `${doctor.full_name || 'The prescriber'} approved dispensing ${pending.medication_name}${pending.strength ? ` ${pending.strength}` : ''} for ${rx.patient_name}. You can now fill the prescription with the approved product.`,
          target: 'prescriptions',
          prescription_id: rx.id,
          prescription_ref: rx.prescription_id || '',
          is_read: false,
        });
      }
      return Response.json({ ok: true, decision: 'approved', substitution: historyEntry });
    }

    // Rejected — the original prescription stands unchanged.
    await base44.asServiceRole.entities.Prescription.update(rx.id, { pending_substitution: null });
    if (rx.authorized_pharmacy_user_id) {
      await base44.asServiceRole.entities.PharmacyNotification.create({
        pharmacy_id: rx.authorized_pharmacy_id,
        pharmacy_user_id: rx.authorized_pharmacy_user_id,
        type: 'other',
        title: 'Substitution Declined',
        message: `${doctor.full_name || 'The prescriber'} declined the substitution of ${rx.medication_name}${rx.strength ? ` ${rx.strength}` : ''} for ${rx.patient_name}.${note ? ` Note: ${note}` : ''} The original prescription stands — please dispense it as prescribed or reject it if unavailable.`,
        target: 'prescriptions',
        prescription_id: rx.id,
        prescription_ref: rx.prescription_id || '',
        is_read: false,
      });
    }
    return Response.json({ ok: true, decision: 'rejected' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}