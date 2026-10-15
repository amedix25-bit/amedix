import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// AMedix display translation — doctor-entered content shown in the Patient Portal.
// Doctor-facing clinical text is stored in English (dictation is translated to
// English before insertion). When a patient uses the Arabic Patient Portal,
// doctor-entered free text (instructions, indications, diagnoses, test names,
// ...) is translated into clear, patient-friendly Arabic for display only.
// The original records are NEVER modified — translations are cached separately
// in the MedicalTranslation entity with direction: doctor_to_patient.

const MAX_TEXTS_PER_CALL = 60;
const MAX_TEXT_LENGTH = 2000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const patientId = typeof body?.patient_id === 'string' ? body.patient_id : '';
    const texts = Array.isArray(body?.texts)
      ? body.texts
          .filter((t) => typeof t === 'string' && t.trim() && t.length <= MAX_TEXT_LENGTH)
          .slice(0, MAX_TEXTS_PER_CALL)
      : [];
    if (texts.length === 0) return Response.json({ translations: {} });

    // Previously translated texts for this patient — avoids an LLM call on every open.
    const cacheBySource = new Map();
    if (patientId) {
      const cached = await base44.entities.MedicalTranslation
        .filter({ patient_id: patientId, direction: 'doctor_to_patient' })
        .catch(() => []);
      for (const c of cached) {
        if (c.source_text && c.translated_text) cacheBySource.set(c.source_text, c.translated_text);
      }
    }

    const pending = texts.filter((t) => !cacheBySource.has(t));

    if (pending.length > 0) {
      try {
        const numbered = pending.map((text, i) => `${i + 1}. ${text}`).join('\n');
        const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt:
            'You are a medical terminology translator inside a clinical records system. ' +
            'A patient who reads Arabic is viewing clinical information their doctor wrote in English. ' +
            'For each numbered item, produce the clear, natural ARABIC version the patient should see.\n\n' +
            'Rules:\n' +
            '- Use everyday, patient-friendly Arabic while keeping the medical meaning exact. Use the standard Arabic medical term for diseases and findings (e.g. "Diabetes Mellitus" -> "داء السكري"; "Hypertension" -> "ارتفاع ضغط الدم"; "HbA1c" -> "السكر التراكمي").\n' +
            '- Keep brand medication names in their Latin spelling (e.g. Panadol stays Panadol); generic drug names may be translated to their known Arabic name when one is standard.\n' +
            '- Preserve all numbers, doses, durations, frequencies and negations exactly.\n' +
            '- Keep any Arabic words already present as they are.\n' +
            '- Concise and complete; no explanations, no numbering in the output.\n\n' +
            'Items:\n' + numbered + '\n\n' +
            'Return a JSON object with a "translations" property: an array of Arabic translations, ' +
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
            if (patientId) {
              newCache.push({
                patient_id: patientId,
                direction: 'doctor_to_patient',
                source_text: pending[i],
                translated_text: translated,
                created_datetime: new Date().toISOString(),
              });
            }
          }
        }
        if (newCache.length > 0) {
          await base44.entities.MedicalTranslation.bulkCreate(newCache).catch(() => null);
        }
      } catch (llmError) {
        // A failed translation never blocks the patient — the original text
        // is shown instead and the records stay untouched.
        console.error('Translation LLM call failed:', llmError?.message);
      }
    }

    const result = {};
    for (const t of texts) {
      const translated = cacheBySource.get(t);
      if (translated) result[t] = translated;
    }
    return Response.json({ translations: result });
  } catch (error) {
    return Response.json({ error: error.message || 'Translation failed.' }, { status: 500 });
  }
}