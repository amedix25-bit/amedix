import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Medication safety checker — runs BEFORE a doctor issues a prescription.
// It compares the proposed medication against the patient's available medical
// record: documented drug allergies, the allergy summary on the patient
// profile, current active medications (duplicate-therapy check) and recorded
// conditions.
//
// Safety design:
//   - HARD RULES (deterministic, from verified record data) decide blocks:
//     a proposed medication or active ingredient matching a documented drug
//     allergy blocks the prescription when the allergy is severe; moderate
//     and mild allergy matches are critical/high warnings requiring
//     acknowledgment.
//   - DUPLICATE THERAPY: the same medication or active ingredient already
//     active on the patient's record raises a critical warning requiring
//     acknowledgment.
//   - INTERACTION / CONTRAINDICATION REVIEW: an LLM pass reviews the proposed
//     medication against the record and returns advisory notes. These are
//     always marked ai_assisted — they support clinical review and are NEVER
//     the sole basis for a safety decision and can never block a
//     prescription.
//   - Every alert distinguishes the data source it was found from: verified
//     (doctor-prescribed / profile data) or patient_reported.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const patientId = String(body?.patient_id || '');
    const medicationName = String(body?.medication_name || '').trim();
    const activeIngredient = String(body?.active_ingredient || '').trim().toLowerCase();
    if (!patientId || !medicationName) {
      return Response.json({ error: 'Patient and medication name are required.' }, { status: 400 });
    }

    // The caller must be the prescribing doctor.
    const doctorId = String(body?.doctor_id || '');
    let doctor = null;
    try {
      const page = await base44.asServiceRole.entities.DoctorProfile.filter({ id: doctorId }, { limit: 1 });
      doctor = (page.items || page)[0] || null;
    } catch (e) { doctor = null; }
    if (!doctor || doctor.user_id !== user.id) {
      return Response.json({ error: 'Doctor profile not found.' }, { status: 403 });
    }

    // Load the patient's safety-relevant record.
    let profile = null;
    try {
      const profiles = await base44.asServiceRole.entities.PatientProfile.filter({ id: patientId }, { limit: 1 });
      profile = (profiles.items || profiles)[0] || null;
    } catch (e) { profile = null; }
    if (!profile) return Response.json({ error: 'Patient profile not found.' }, { status: 404 });

    let allergies = [];
    let activeMeds = [];
    try {
      const a = await base44.asServiceRole.entities.Allergy.filter({ patient_id: patientId }, { limit: 100 });
      allergies = a.items || a;
    } catch (e) { allergies = []; }
    try {
      const m = await base44.asServiceRole.entities.Medication.filter({ patient_id: patientId, is_active: true }, { limit: 100 });
      activeMeds = m.items || m;
    } catch (e) { activeMeds = []; }
    let adverseReactions = [];
    try {
      const f = await base44.asServiceRole.entities.MedicationFeedback.filter(
        { patient_id: patientId, category: 'side_effect' }, { limit: 100 }
      );
      adverseReactions = f.items || f;
    } catch (e) { adverseReactions = []; }

    const norm = (s) => String(s || '').toLowerCase().trim();
    const termMatches = (proposed, recorded) => {
      const p = norm(proposed);
      const r = norm(recorded);
      if (!p || !r) return false;
      if (p === r) return true;
      const words = p.split(/[^a-z0-9]+/).filter(Boolean);
      if (words.some((w) => w.length > 3 && (r === w || new RegExp(`\\b${w}\\b`).test(r)))) return true;
      const rWords = r.split(/[^a-z0-9]+/).filter(Boolean);
      return rWords.some((w) => w.length > 3 && new RegExp(`\\b${w}\\b`).test(p));
    };

    const alerts = [];
    const proposed = [medicationName, activeIngredient].filter(Boolean);

    // 1. Allergy conflicts (deterministic).
    for (const allergy of allergies) {
      const hit = proposed.some((t) => termMatches(t, allergy.allergen));
      if (!hit) continue;
      const blocked = allergy.severity === 'severe';
      alerts.push({
        type: 'allergy_conflict',
        severity: blocked ? 'critical' : 'high',
        blocked,
        ai_assisted: false,
        title: `Documented allergy: ${allergy.allergen}`,
        explanation: `The patient has a documented ${allergy.severity || 'unspecified'} ${allergy_type_label(allergy.allergy_type)} allergy to ${allergy.allergen}${allergy.reaction ? ` (reaction: ${allergy.reaction})` : ''}. The proposed medication matches this allergen.`,
        guidance: blocked
          ? 'Prescription blocked by the safety rules. Choose an alternative medication or formally review the allergy record with the patient.'
          : 'Review the allergy record and the patient\u2019s reaction history before issuing. Acknowledgment required to proceed.',
        source: 'verified',
      });
    }

    // Allergy summary on the profile (free text, comma separated).
    const summaryAllergens = String(profile.allergies || '')
      .split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    for (const allergen of summaryAllergens) {
      const hit = proposed.some((t) => termMatches(t, allergen));
      if (!hit) continue;
      const alreadyAlerted = alerts.some((a) => a.type === 'allergy_conflict' && termMatches(allergen, a.title));
      if (alreadyAlerted) continue;
      alerts.push({
        type: 'allergy_conflict',
        severity: 'high',
        blocked: false,
        ai_assisted: false,
        title: `Allergy summary lists: ${allergen}`,
        explanation: `The patient's allergy summary lists "${allergen}", which matches the proposed medication. The summary is profile-level information and may need a detailed allergy record.`,
        guidance: 'Confirm against the patient\u2019s detailed allergy records before issuing. Acknowledgment required to proceed.',
        source: 'verified',
      });
    }

    // 2. Duplicate therapy (deterministic).
    for (const med of activeMeds) {
      const nameHit = proposed.some((t) => termMatches(t, med.name));
      const ingredientHit = med.active_ingredient ? proposed.some((t) => termMatches(t, med.active_ingredient)) : false;
      if (!nameHit && !ingredientHit) continue;
      const sameDrug = nameHit;
      alerts.push({
        type: 'duplicate_therapy',
        severity: 'critical',
        blocked: false,
        ai_assisted: false,
        title: sameDrug ? `Duplicate therapy: ${med.name} is already active` : `Same active ingredient: ${med.active_ingredient} is already active (${med.name})`,
        explanation: `The patient already takes ${med.name}${med.active_ingredient ? ` (${med.active_ingredient})` : ''}${med.dose ? ` ${med.dose}` : ''}${med.frequency ? `, ${med.frequency}` : ''}. Issuing the proposed medication would duplicate the therapy and risk overdose.`,
        guidance: 'Stop or adjust the existing medication first, or document a justified clinical decision to proceed.',
        source: med.source || 'patient_reported',
      });
    }

    // 2b. Recorded adverse drug reactions (patient-reported, advisory).
    for (const fb of adverseReactions) {
      const hit = proposed.some((t) => termMatches(t, fb.medication_name));
      if (!hit) continue;
      const severe = fb.severity === 'severe';
      alerts.push({
        type: 'adverse_reaction',
        severity: severe ? 'high' : 'moderate',
        blocked: false,
        ai_assisted: false,
        title: `Patient-reported reaction to ${fb.medication_name}`,
        explanation: `The patient previously reported a ${fb.severity || 'unspecified'} side effect while taking ${fb.medication_name}${fb.details ? `: "${fb.details}"` : ''}. The proposed medication matches it.`,
        guidance: severe
          ? 'Review the reported reaction with the patient before issuing; consider an alternative. Acknowledgment required to proceed.'
          : 'Review the reported reaction with the patient before issuing.',
        source: 'patient_reported',
      });
    }

    // 3. Interaction / contraindication review (AI-assisted, advisory only).
    let ai_error = '';
    if (activeMeds.length > 0 || allergies.length > 0) {
      try {
        const medLines = activeMeds.map((m) =>
          `- ${m.name}${m.active_ingredient ? ` (${m.active_ingredient})` : ''}${m.dose ? ` ${m.dose}` : ''}${m.frequency ? `, ${m.frequency}` : ''} [${m.source === 'doctor_prescribed' ? 'verified, doctor-prescribed' : 'patient-reported'}]`
        ).join('\n');
        const allergyLines = allergies.map((a) =>
          `- ${a.allergen} (${a.severity || 'unspecified'} ${a.allergy_type || 'allergy'}${a.reaction ? `, reaction: ${a.reaction}` : ''})`
        ).join('\n');
        const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt:
            `You are a clinical pharmacy decision-support assistant reviewing a proposed prescription for drug-drug interactions and contraindications.\n\n` +
            `Proposed medication: ${medicationName}${activeIngredient ? ` (active ingredient: ${activeIngredient})` : ''}\n\n` +
            `Patient's current active medications:\n${medLines || 'None'}\n\n` +
            `Documented allergies:\n${allergyLines || 'None'}\n\n` +
            `Identify clinically relevant drug-drug interactions, duplicate pharmacologic classes, and contraindications between the PROPOSED medication and the CURRENT medications. Ignore the allergy matches — they are already checked by deterministic rules.\n` +
            `Only report interactions that are clinically meaningful and well established. For each, give severity, a short explanation of the mechanism/risk, and practical guidance for the prescribing doctor.\n` +
            `If there is nothing clinically meaningful, return an empty alerts list. Do not invent interactions.`,
          response_json_schema: {
            type: 'object',
            properties: {
              alerts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    severity: { type: 'string', enum: ['critical', 'high', 'moderate', 'low'] },
                    title: { type: 'string' },
                    explanation: { type: 'string' },
                    guidance: { type: 'string' },
                  },
                  required: ['severity', 'title', 'explanation', 'guidance'],
                },
              },
            },
            required: ['alerts'],
          },
        });
        const llmAlerts = (llm && llm.alerts) || [];
        for (const a of llmAlerts) {
          alerts.push({
            type: 'interaction_review',
            severity: ['critical', 'high', 'moderate', 'low'].includes(a.severity) ? a.severity : 'moderate',
            blocked: false,
            ai_assisted: true,
            title: a.title,
            explanation: a.explanation,
            guidance: a.guidance,
            source: 'verified',
          });
        }
      } catch (e) {
        ai_error = 'Interaction review is temporarily unavailable — only the deterministic allergy and duplicate-therapy checks were applied.';
      }
    }

    const order = { critical: 0, high: 1, moderate: 2, low: 3 };
    alerts.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));

    return Response.json({
      alerts,
      blocked: alerts.some((a) => a.blocked),
      has_critical: alerts.some((a) => a.severity === 'critical' || a.severity === 'high'),
      checked_against: {
        allergies: allergies.length,
        active_medications: activeMeds.length,
        adverse_reactions: adverseReactions.length,
        active_medications_list: activeMeds.map((m) => ({ name: m.name, source: m.source || 'patient_reported' })),
      },
      ai_error,
      limitations:
        'Checks cover only what is recorded in AMedix: documented allergy records, the allergy summary, active medication entries and patient-reported reactions. A clear result does not mean the medication is safe — missing or unrecorded information is not checked. The interaction review is AI-assisted and advisory only; it never decides safety on its own.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function allergy_type_label(t) {
  return t === 'drug' ? 'drug' : t === 'food' ? 'food' : t === 'environmental' ? 'environmental' : 'other';
}