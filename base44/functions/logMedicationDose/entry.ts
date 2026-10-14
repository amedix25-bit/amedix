import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { todayStr } from "../../shared/pharmacyPrescription.ts";
import { missedDoseGuidance } from "../../shared/medicationSafety.ts";

// Patient-reported dose logging for the optional adherence system. The patient
// records a dose as taken, missed or skipped. This is ALWAYS a
// patient-reported record — pharmacy dispensing events are stored separately
// on the prescription and the two are never conflated. A missed dose returns
// medication-specific guidance that never recommends an extra dose.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const medicationId = String(body?.medication_id || '').trim();
    const status = String(body?.status || '').trim();
    if (!medicationId || !['taken', 'missed', 'skipped'].includes(status)) {
      return Response.json({ error: 'Medication and a status of taken, missed or skipped are required.' }, { status: 400 });
    }

    let meds = [];
    try {
      meds = await base44.asServiceRole.entities.Medication.filter({ id: medicationId }, { limit: 1 });
    } catch (e) { meds = []; }
    const med = (meds.items || meds)[0];
    if (!med) return Response.json({ error: 'Medication record not found.' }, { status: 404 });
    if (med.patient_user_id !== user.id) {
      return Response.json({ error: 'You can only log doses for your own medications.' }, { status: 403 });
    }

    const doseDate = String(body?.dose_date || '').trim() || todayStr();
    const scheduledTime = String(body?.scheduled_time || '').trim();
    const now = new Date().toISOString();

    let guidance = null;
    if (status === 'missed') {
      const g = missedDoseGuidance(med.name, med.active_ingredient || '');
      guidance = g.guidance;
    }

    const log = await base44.asServiceRole.entities.MedicationDoseLog.create({
      patient_id: med.patient_id,
      patient_user_id: user.id,
      medication_id: medicationId,
      prescription_id: med.prescription_id || String(body?.prescription_id || '').trim(),
      medication_name: med.name,
      dose_date: doseDate,
      scheduled_time: scheduledTime,
      status,
      notes: String(body?.notes || '').trim(),
      guidance: guidance || '',
      reported_datetime: now,
    });

    return Response.json({ log, guidance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}