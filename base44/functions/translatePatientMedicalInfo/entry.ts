import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Doctor Portal display rule: when a doctor opens a patient (My Patients),
// any patient-entered medical information written in Arabic is translated
// into clear, professional, medically accurate English for display.
// The patient's original data is NEVER modified — translations are stored
// separately in the MedicalTranslation cache entity and returned as a
// display map keyed "<entity>|<record_id>|<field>".
// Medication NAMES are never translated (patients enter them in English);
// only patient-entered descriptive fields are handled.

const ARABIC_RE = /[\u0600-\u06FF]/;
const MAX_TEXTS_PER_CALL = 60;

const TRANSLATABLE_FIELDS = {
  MedicalCondition: ["name", "details"],
  SurgicalHistory: [
    "surgery_type",
    "reason",
    "complications",
    "outcome",
    "hospitalization_duration",
    "anesthesia_history",
    "anesthesia_complications",
    "other_procedures",
    "implants_devices",
    "transfusion_count",
    "transfusion_type",
    "transfusion_amount",
    "transfusion_reason",
    "transfusion_timing",
    "transfusion_reactions",
  ],
  Allergy: ["allergen", "reaction"],
  // Medication names are deliberately excluded — they must stay in English.
  Medication: ["dose", "frequency", "duration", "max_frequency", "patient_notes", "reason"],
  PatientProfile: ["allergies", "substance_use", "pregnancy_history", "gestational_age"],
};

function collect(records, entity, out) {
  const fields = TRANSLATABLE_FIELDS[entity];
  for (const rec of records) {
    for (const field of fields) {
      const value = rec[field];
      if (typeof value === "string" && value.trim() && ARABIC_RE.test(value)) {
        out.push({ entity, id: rec.id, field, text: value });
      }
    }
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const patientId = body?.patient_id;
    if (!patientId || typeof patientId !== 'string') {
      return Response.json({ error: 'patient_id is required' }, { status: 400 });
    }

    const [profile, conditions, surgeries, allergies, medications] = await Promise.all([
      base44.entities.PatientProfile.get(patientId).catch(() => null),
      base44.entities.MedicalCondition.filter({ patient_id: patientId }),
      base44.entities.SurgicalHistory.filter({ patient_id: patientId }),
      base44.entities.Allergy.filter({ patient_id: patientId }),
      base44.entities.Medication.filter({ patient_id: patientId }),
    ]);

    const items = [];
    if (profile) collect([profile], 'PatientProfile', items);
    collect(conditions, 'MedicalCondition', items);
    collect(surgeries, 'SurgicalHistory', items);
    collect(allergies, 'Allergy', items);
    collect(medications, 'Medication', items);

    if (items.length === 0) return Response.json({ translations: {} });

    // Previously translated Arabic texts — avoids an LLM call on every open.
    const cached = await base44.entities.MedicalTranslation
      .filter({ patient_id: patientId })
      .catch(() => []);
    const cacheBySource = new Map();
    for (const c of cached) {
      if (c.source_text && c.translated_text) cacheBySource.set(c.source_text, c.translated_text);
    }

    // Collect unique untranslated Arabic texts (bounded per call).
    const pending = [];
    const seen = new Set();
    for (const item of items) {
      if (cacheBySource.has(item.text)) continue;
      const key = item.text.trim();
      if (seen.has(key)) continue;
      seen.add(key);
      if (pending.length < MAX_TEXTS_PER_CALL) pending.push(item.text);
    }

    if (pending.length > 0) {
      try {
        const numbered = pending.map((text, i) => `${i + 1}. ${text}`).join('\n');
        const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt:
            'You are a medical terminology translator inside a clinical records system. ' +
            'A patient entered the following medical information in Arabic. ' +
            'For each numbered item, produce the clear, professional, medically accurate ENGLISH version that the patient\u2019s physician should see.\n\n' +
            'Rules:\n' +
            '- Identify the medical MEANING and use the correct standard medical terminology \u2014 never a literal word-for-word translation. Examples: "\u0627\u0644\u0633\u0643\u0631\u064a" \u2192 "Diabetes Mellitus"; "\u0636\u063a\u0637 \u0627\u0644\u062f\u0645" \u2192 "Hypertension"; "\u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u0632\u0627\u064a\u062f\u0629" \u2192 "Appendectomy"; "\u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u0645\u0631\u0627\u0631\u0629" \u2192 "Cholecystectomy".\n' +
            '- Preserve all dates, numbers, durations and dosages exactly.\n' +
            '- Keep any English words already present as they are.\n' +
            '- Clinical, professional tone; concise but complete.\n\n' +
            'Items:\n' + numbered + '\n\n' +
            'Return a JSON object with a "translations" property: an array of English translations, ' +
            'in the same order as the numbered items (array index 0 = item 1).',
          response_json_schema: {
            type: 'object',
            properties: {
              translations: { type: 'array', items: { type: 'string' } },
            },
            required: ['translations'],
          },
        });

        let translations = (llm && typeof llm === 'object' && llm.translations) || [];
        if (typeof translations === 'string') {
          try {
            translations = JSON.parse(translations);
          } catch (parseError) {
            translations = [];
          }
        }
        if (!Array.isArray(translations)) translations = [];
        const newCache = [];
        for (let i = 0; i < pending.length; i++) {
          const translated = translations[i];
          if (typeof translated === 'string' && translated.trim()) {
            cacheBySource.set(pending[i], translated);
            newCache.push({
              patient_id: patientId,
              direction: 'patient_to_doctor',
              source_text: pending[i],
              translated_text: translated,
              created_datetime: new Date().toISOString(),
            });
          }
        }
        if (newCache.length > 0) {
          await base44.entities.MedicalTranslation.bulkCreate(newCache).catch(() => null);
        }
      } catch (llmError) {
        // A failed translation never blocks the doctor — cached translations
        // are still returned, and the original data is untouched.
        console.error('Translation LLM call failed:', llmError.message);
      }
    }

    const result = {};
    for (const item of items) {
      const translated = cacheBySource.get(item.text);
      if (translated) result[`${item.entity}|${item.id}|${item.field}`] = translated;
    }
    return Response.json({ translations: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}