import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { todayStr } from "../../shared/pharmacyPrescription.ts";
import { medicationHistoryStatus } from "../../shared/medicationSafety.ts";

// Longitudinal medication history — the doctor-facing reconciliation view.
// Unifies three sources into one traceable history:
//   - Prescriptions (every status, never deleted) with their dispensing events
//   - Medication records (doctor-prescribed and patient-reported entries)
//   - Adherence data (dose logs and patient feedback)
// Also flags duplicate treatments (two current entries with the same active
// ingredient) and computes adherence statistics for the last 30 days.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const patientId = String(body?.patient_id || '').trim();
    if (!patientId) return Response.json({ error: 'patient_id is required.' }, { status: 400 });

    // Doctors (and administrators) only.
    if (user.role !== 'admin') {
      const docs = await base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id }, { limit: 1 });
      if ((docs.items || docs).length === 0) {
        return Response.json({ error: 'Only doctors can review medication history.' }, { status: 403 });
      }
    }

    const [rxPage, medPage, dosePage, feedbackPage] = await Promise.all([
      base44.asServiceRole.entities.Prescription.filter({ patient_id: patientId }, { sort: '-created_date', limit: 200 }),
      base44.asServiceRole.entities.Medication.filter({ patient_id: patientId }, { sort: '-created_date', limit: 200 }),
      base44.asServiceRole.entities.MedicationDoseLog.filter({ patient_id: patientId }, { sort: '-reported_datetime', limit: 300 }),
      base44.asServiceRole.entities.MedicationFeedback.filter({ patient_id: patientId }, { sort: '-reported_datetime', limit: 100 }),
    ]);
    const prescriptions = rxPage.items || rxPage;
    const medications = medPage.items || medPage;
    const doseLogs = dosePage.items || dosePage;
    const feedback = feedbackPage.items || feedbackPage;

    const today = todayStr();
    for (const rx of prescriptions) {
      rx.history_status = medicationHistoryStatus(rx, today);
    }
    for (const m of medications) {
      m.history_status = m.is_active === false ? 'discontinued' : 'active';
    }

    // Duplicate-therapy detection: two or more CURRENT entries (active
    // medications or in-flight prescriptions) with the same active ingredient
    // — or, when ingredients are unknown, the same medication name.
    const current = new Map();
    const bucketOf = (key, entry) => {
      if (!current.has(key)) current.set(key, []);
      current.get(key).push(entry);
    };
    for (const rx of prescriptions) {
      if (!['pending_dispensing', 'partially_dispensed', 'fully_dispensed'].includes(rx.history_status)) continue;
      const key = String(rx.active_ingredient || rx.medication_name || '').toLowerCase().trim();
      if (key) bucketOf(key, { kind: 'prescription', id: rx.id, label: `${rx.medication_name}${rx.strength ? ` ${rx.strength}` : ''}`, prescribed_by: rx.doctor_name || '' });
    }
    for (const m of medications) {
      if (m.history_status !== 'active') continue;
      const key = String(m.active_ingredient || m.name || '').toLowerCase().trim();
      if (key) bucketOf(key, { kind: 'medication', id: m.id, label: m.name, reported_by: m.source === 'patient_reported' ? 'patient' : 'doctor' });
    }
    const duplicate_groups = [];
    for (const [key, entries] of current) {
      if (entries.length > 1) duplicate_groups.push({ key, entries });
    }

    // Adherence statistics — the last 30 days of patient-reported doses.
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentDoses = doseLogs.filter((d) => (d.reported_datetime || '') >= cutoff);
    const taken = recentDoses.filter((d) => d.status === 'taken').length;
    const missed = recentDoses.filter((d) => d.status === 'missed').length;
    const skipped = recentDoses.filter((d) => d.status === 'skipped').length;
    const adherence = {
      taken, missed, skipped,
      total: recentDoses.length,
      rate: recentDoses.length > 0 ? Math.round((taken / recentDoses.length) * 100) : null,
    };

    return Response.json({
      prescriptions,
      medications,
      dose_logs: doseLogs.slice(0, 100),
      feedback,
      duplicate_groups,
      adherence,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}