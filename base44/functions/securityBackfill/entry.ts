import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// One-time maintenance function (administrator only).
// Backfills the Row Level Security anchor fields that were added with the
// security audit: patient_user_id on AccessRequest, AccessAuditLog,
// PatientLabResult and PatientNotification (derived from the patient's
// PatientProfile), and laboratory_user_id on LabTechnician (derived from the
// LaboratoryProfile). It only ADDS the derived field to records where it is
// missing — it never changes or removes any existing value, and it is
// idempotent, so it can be run repeatedly.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const sr = base44.asServiceRole;

    const loadAll = async (entity) => {
      const out = [];
      let cursor;
      do {
        const page = await entity.list({ limit: 200, cursor });
        out.push(...(page.items || []));
        cursor = page.next_cursor;
      } while (cursor);
      return out;
    };

    const report = {};

    const profiles = await loadAll(sr.entities.PatientProfile);
    const byProfileId = new Map(profiles.map((p) => [p.id, p.user_id]));

    for (const name of ['AccessRequest', 'AccessAuditLog', 'PatientLabResult', 'PatientNotification', 'MedicalHistoryEntry', 'MedicalCondition', 'SurgicalHistory', 'FamilyHistory', 'Allergy', 'MedicalDocument', 'ClinicalNote', 'Diagnosis', 'ClinicalDocument', 'Encounter', 'Consent', 'Medication', 'PatientExamination']) {
      const records = await loadAll(sr.entities[name]);
      let updated = 0;
      let already_set = 0;
      let no_profile = 0;
      for (const rec of records) {
        if (rec.patient_user_id) {
          already_set++;
          continue;
        }
        const uid = byProfileId.get(rec.patient_id);
        if (!uid) {
          no_profile++;
          continue;
        }
        await sr.entities[name].update(rec.id, { patient_user_id: uid });
        updated++;
      }
      report[name] = { updated, already_set, no_profile };
    }

    const labProfiles = await loadAll(sr.entities.LaboratoryProfile);
    const byLabId = new Map(labProfiles.map((p) => [p.id, p.user_id]));
    const techs = await loadAll(sr.entities.LabTechnician);
    let techUpdated = 0;
    let techAlready = 0;
    let techNoLab = 0;
    for (const t of techs) {
      if (t.laboratory_user_id) {
        techAlready++;
        continue;
      }
      const uid = byLabId.get(t.laboratory_id);
      if (!uid) {
        techNoLab++;
        continue;
      }
      await sr.entities.LabTechnician.update(t.id, { laboratory_user_id: uid });
      techUpdated++;
    }
    report.LabTechnician = { updated: techUpdated, already_set: techAlready, no_lab: techNoLab };

    return Response.json({ ok: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}