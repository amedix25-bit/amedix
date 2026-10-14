import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// AMedix medical dictation — secure backend for the Doctor Portal dictation
// feature. Transcribes the doctor's recorded speech with the platform's
// multilingual recognizer (Arabic, English, or both mixed interchangeably,
// including English medical terminology pronounced with an Arabic accent),
// then applies specialty-aware, context-aware medical terminology correction
// with the built-in LLM. The recording stays in private storage and reaches
// the recognizer only through a short-lived signed URL. Clinically
// significant terms (medications, doses, allergies, diagnoses, treatment
// instructions) are NEVER changed silently — they come back as flagged
// suggestions the doctor must accept manually before the text is inserted.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const audioUri = typeof body.audio_uri === 'string' ? body.audio_uri : '';
    const typedText = typeof body.text === 'string' ? body.text : '';
    const language = ['ar', 'en', 'mixed'].includes(body.language) ? body.language : 'mixed';
    const specialty = String(body.specialty || 'General').slice(0, 80);
    const fieldContext = String(body.field_context || 'clinical documentation').slice(0, 120);

    let transcript = typedText.trim();
    if (!transcript) {
      if (!audioUri) return Response.json({ error: 'No dictation audio provided.' }, { status: 400 });
      if (!/^[\w\-\/:.]+$/.test(audioUri)) return Response.json({ error: 'Invalid audio reference.' }, { status: 400 });
      // The private recording is only exposed to the recognizer through a
      // short-lived signed URL issued here on the server.
      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: audioUri,
        expires_in: 300,
      });
      transcript = String(
        await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: signed.signed_url })
      ).trim();
      if (!transcript) {
        return Response.json({ error: 'No speech was detected in the recording. Please try again.' }, { status: 422 });
      }
    }

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the AMedix medical dictation corrector, an expert medical scribe. A doctor dictated clinical text and a multilingual speech recognizer transcribed it. Produce the final clinical wording the doctor actually meant, adapted to their specialty, without inventing or silently changing clinically significant information.

TRANSCRIPT (may be Arabic, English, or Arabic and English freely mixed / code-switched; English medical terms may be spelled phonetically as they sound when pronounced with an Arabic accent):
"""
${transcript}
"""

DOCTOR'S SPECIALTY: ${specialty}
FIELD BEING DICTATED INTO: ${fieldContext}
PREFERRED LANGUAGE MODE: ${language} (ar = Arabic dictation, en = English dictation, mixed = Arabic/English exactly as spoken)

RULES:
1. corrected_text keeps the language(s) the doctor actually spoke — NEVER translate wholesale. Fix spelling, spacing and punctuation, remove filler words and repetitions, and produce clean, natural clinical wording in the same language.
2. Correct English medical terminology that was misrecognized or spelled phonetically (Arabic-accented pronunciation), choosing the most likely intended medical term based on the specialty and the field context. Examples of the error class to fix: "bradie cardia" -> "bradycardia"; "amoxy silin" -> "Amoxicillin"; "mayo cardial infarction" -> "myocardial infarction"; "sablingual" -> "sublingual"; "pneumonia" misheard as "new monia"; anatomical terms like "apendics" -> "appendix"; "sickling" in a hematology context -> "sickle cell".
3. CLASSIFY every meaningful correction as one of: medication, dose, allergy, diagnosis, instruction (clinically significant) — or anatomy, procedure, investigation, wording (lower risk).
4. Clinically significant terms (medication names, doses, routes, frequencies, allergies, diagnoses, laboratory values, treatment instructions): NEVER change them silently. Keep exactly what was transcribed in corrected_text and return a correction entry with flagged=true and your best alternative as "suggestion" for the doctor to accept manually. Mark confidence as "medium" or "low".
5. Lower-risk terms (anatomical terms, procedure names, investigation names, generic wording): apply the correction in corrected_text, and also return a correction entry — flagged=false with confidence "high" when you are sure it was applied, flagged=true with confidence "medium"/"low" when you are not fully sure (then keep the transcribed version in corrected_text as in rule 4).
6. If a word is unintelligible, keep it in corrected_text unchanged and flag it (flagged=true, suggestion equal to the same text) so the doctor verifies it.
7. NEVER add clinical content the doctor did not say. NEVER remove or alter numbers, doses or negations (e.g. "no chest pain"). NEVER output a medication, dose or diagnosis you invented from context.
8. Keep Arabic text in Arabic and any named medication in its standard Latin spelling even inside Arabic sentences (that is normal clinical practice, not translation).
9. Return corrected_text and the full corrections list. An empty corrections list is valid when the transcript is already clean.`,
      response_json_schema: {
        type: 'object',
        properties: {
          corrected_text: { type: 'string' },
          corrections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                original: { type: 'string' },
                suggestion: { type: 'string' },
                term_type: {
                  type: 'string',
                  enum: ['medication', 'dose', 'allergy', 'diagnosis', 'instruction', 'anatomy', 'procedure', 'investigation', 'wording', 'other'],
                },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                flagged: { type: 'boolean' },
              },
              required: ['original', 'suggestion', 'term_type', 'flagged'],
            },
          },
        },
        required: ['corrected_text', 'corrections'],
      },
    });

    const corrected =
      llm && typeof llm.corrected_text === 'string' && llm.corrected_text.trim()
        ? llm.corrected_text
        : transcript;
    const corrections = Array.isArray(llm && llm.corrections) ? llm.corrections.slice(0, 50) : [];
    return Response.json({ transcript, corrected_text: corrected, corrections });
  } catch (error) {
    return Response.json({ error: error.message || 'Dictation failed.' }, { status: 500 });
  }
}