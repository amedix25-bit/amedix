// AMedix multi-pass document recognition engine (job pipeline).
//
// One reading is never trusted. A document is read by independent recognisers
// over two different pictures of the same page (the camera original and a
// server-rectified render), and a number is accepted only when the readings
// agree on the complete value, character for character.
//
// Three things changed with the job pipeline:
//   1. The model ids come from the platform's current catalog. The previous
//      engine asked for `gemini_3_1_pro`, which the gateway no longer serves —
//      half the passes silently returned nothing, so valid documents were
//      reported as unreadable.
//   2. Every pass is bounded by ONE overall budget instead of one minute each.
//      A slow model can no longer push the request past the platform limit and
//      kill the whole verification with no record written.
//   3. A scanned PDF that cannot be turned into page pixels is read as a PDF
//      (native document input) instead of being declared unopenable.
//
// Nothing here writes a document anywhere: bytes are held in the worker's
// memory and released when the job finishes.

import {
  NUMBER_PROFILES, normalizeNumber, validateFormat, readMrzTd3, characterDistance,
  type NumberProfile,
} from './documentOcrProfiles.ts';
import { readDocumentWithVisionResult, type InlineImage } from './inlineVision.ts';
import { readPdfDocument } from './verificationPdfRead.ts';

export const OCR_ENGINE_VERSION = 'amedix_document_number_v4_job';

// Current platform vision models. Two independent vendors must agree before a
// number is trusted, so one provider drifting or degrading cannot verify or
// reject a document on its own.
export const MODEL_PRIMARY = 'gemini_3_8_flash';
export const MODEL_SECONDARY = 'claude-sonnet-5';
export const MODEL_TERTIARY = 'gpt_6_sol';

export type Side = { side: 'front' | 'back'; original: InlineImage; enhanced: InlineImage };

export type Reading = {
  pass: string;
  engine: string;
  source: 'original' | 'enhanced' | 'binary' | 'mrz' | 'pdf';
  side: 'front' | 'back';
  raw: string;
  normalized: string;
  confidence: number;
  readable: boolean;
  validFormat: boolean;
  note: string;
};

export type Diagnosis = {
  outcome: 'match' | 'mismatch' | 'unreadable';
  rawReading: string;
  normalizedReading: string;
  expectedNormalized: string;
  readings: Reading[];
  agreement: { value: string; supporters: number; engines: number; confidence: number } | null;
  confidence: { overall: number; readability: number; detection: number; character: number; matching: number };
  nearMiss: boolean;
  characterDistance: number;
  notes: string;
  /** True when no recogniser answered at all — a technical failure, not an unreadable document. */
  technical: boolean;
  passErrors: string[];
};

const PASS_TIMEOUT_MS = 25000;
export const DEFAULT_BUDGET_MS = 95000;
const MAX_BUDGET_MS = 140000;

const NUMBER_SCHEMA_HINT = 'Reply with JSON only, in exactly this shape: {"number": string, "all_numbers": string[], "script": string, "confidence": number, "readable": boolean, "notes": string}';

function bandHint(bands: { y0: number; y1: number; x0: number; x1: number; heightPct: number }[]): string {
  if (!bands || !bands.length) return '';
  const described = bands
    .slice(0, 4)
    .map((b) => `y ${Math.round(b.y0 * 100)}%-${Math.round(b.y1 * 100)}%, x ${Math.round(b.x0 * 100)}%-${Math.round(b.x1 * 100)}% (text height about ${b.heightPct.toFixed(1)}% of the page)`)
    .join('; ');
  return `Independent pixel analysis found lines of small printed text here: ${described}. Check each of those areas for the number, but do not assume the number is only there.`;
}

function basePrompt(profile: NumberProfile, hint: string, extra: string): string {
  return [
    `You are reading an official ${profile.label.toLowerCase()} for an identity verification system.`,
    `Find the ${profile.numberLabel.toLowerCase()} printed on this document.`,
    '',
    `Where it is normally printed: ${profile.regions.join('; ')}.`,
    `Numbers that are NOT the ${profile.numberLabel.toLowerCase()} and must never be returned as it: ${profile.distractors.join('; ')}.`,
    profile.mrz
      ? 'This document type usually carries a machine-readable zone: if two lines of 44 characters appear at the bottom, the first 9 characters of the second line are the document number.'
      : '',
    'Digits may be printed as Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) or as Western numerals (0123456789); transcribe what you see, converting Arabic-Indic digits to 0-9.',
    'Transcribe every character exactly. Do not guess a character you cannot see: if a digit is smudged, folded, cut off or obscured, treat the number as unreadable rather than completing it from context.',
    'Pay particular attention to shapes that look alike: 0 and O, 1 and I, 5 and S, 8 and B, 2 and Z, 6 and G, 9 and g. Decide each from the actual stroke shape at full zoom.',
    hint,
    extra,
    '',
    'Return the number with no spaces, hyphens or slashes. Confidence below 85 means you are guessing — report it honestly.',
  ].filter(Boolean).join('\n');
}

async function visionPass(
  base44: any,
  params: { pass: string; model: string; image: InlineImage; source: Reading['source']; side: 'front' | 'back'; prompt: string; profile: NumberProfile },
  timeoutMs: number
): Promise<{ reading: Reading | null; error: string }> {
  const result = await readDocumentWithVisionResult(base44, {
    model: params.model,
    prompt: `${params.prompt}\n\n${NUMBER_SCHEMA_HINT}`,
    images: [params.image],
    timeoutMs,
  });
  if (!result.data || typeof result.data !== 'object') return { reading: null, error: result.error || 'no_reply' };

  const data = result.data;
  const raw = typeof data.number === 'string' ? data.number : '';
  const reading: Reading = {
    pass: params.pass,
    engine: params.model,
    source: params.source,
    side: params.side,
    raw,
    normalized: normalizeNumber(raw, params.profile),
    confidence: Math.max(0, Math.min(100, Number(data.confidence) || 0)),
    readable: data.readable !== false,
    validFormat: validateFormat(raw, params.profile).ok,
    note: [data.notes, Array.isArray(data.all_numbers) ? `other numbers: ${data.all_numbers.slice(0, 6).join(', ')}` : ''].filter(Boolean).join(' · '),
  };
  return { reading, error: '' };
}

function pdfPrompt(profile: NumberProfile, hint: string): string {
  return [
    basePrompt(profile, hint, 'The document is a PDF that may contain several pages, possibly scanned. Inspect every page, including any page that carries a second side or a machine-readable zone.'),
    'Set pages_scanned to the number of pages you inspected.',
  ].join('\n');
}

// Reads the stored PDF itself — the path that rescues scanned PDFs whose pages
// are CCITT/JBIG2/JPX compressed and therefore have no extractable JPEG.
async function pdfReadings(
  base44: any,
  url: string,
  profile: NumberProfile,
  hint: string,
  timeoutMs: number
): Promise<{ readings: Reading[]; errors: string[] }> {
  const readings: Reading[] = [];
  const errors: string[] = [];
  const models = ['automatic', MODEL_TERTIARY];
  const settled = await Promise.allSettled(
    models.map((model) => readPdfDocument(base44, { url, prompt: pdfPrompt(profile, hint), model, timeoutMs }))
  );
  settled.forEach((entry, index) => {
    const label = `pdf_${index === 0 ? 'a' : 'b'}`;
    if (entry.status !== 'fulfilled') { errors.push(`${label}:rejected`); return; }
    const { data, error } = entry.value;
    if (!data || typeof data !== 'object') { errors.push(`${label}:${error || 'no_reply'}`); return; }
    const raw = typeof data.number === 'string' ? data.number : '';
    readings.push({
      pass: label.toUpperCase(),
      engine: models[index],
      source: 'pdf',
      side: index === 0 ? 'front' : 'back',
      raw,
      normalized: normalizeNumber(raw, profile),
      confidence: Math.max(0, Math.min(100, Number(data.confidence) || (raw ? 75 : 0))),
      readable: data.readable !== false,
      validFormat: validateFormat(raw, profile).ok,
      note: `PDF read · pages ${Number(data.pages_scanned) || '—'}${data.notes ? ` · ${data.notes}` : ''}`,
    });
  });
  return { readings, errors };
}

function groupReadings(readings: Reading[]) {
  const groups = new Map<string, { raw: string; supporters: number; engines: Set<string>; confidence: number }>();
  for (const reading of readings) {
    if (!reading.normalized) continue;
    const existing = groups.get(reading.normalized);
    if (existing) {
      existing.supporters += 1;
      existing.engines.add(reading.engine);
      existing.confidence = Math.max(existing.confidence, reading.confidence);
    } else {
      groups.set(reading.normalized, {
        raw: reading.raw, supporters: 1, engines: new Set([reading.engine]), confidence: reading.confidence,
      });
    }
  }
  return groups;
}

function decide(
  readings: Reading[],
  expectedNormalized: string,
  profile: NumberProfile,
  passErrors: string[]
): Diagnosis {
  const usable = readings.filter((r) => r.normalized && r.validFormat);
  const groups = groupReadings(readings);

  let best: { value: string; supporters: number; engines: number; confidence: number; raw: string } | null = null;
  for (const [value, group] of groups) {
    const candidate = { value, supporters: group.supporters, engines: group.engines.size, confidence: group.confidence, raw: group.raw };
    if (!best) { best = candidate; continue; }
    const better = candidate.engines > best.engines
      || (candidate.engines === best.engines && candidate.supporters > best.supporters)
      || (candidate.engines === best.engines && candidate.supporters === best.supporters && candidate.confidence > best.confidence);
    if (better) best = candidate;
  }

  // A machine-readable zone reading is validated by its own check digits, so it
  // outranks consensus: it is the one reading that proves itself.
  const mrzReading = readings.find((r) => r.source === 'mrz' && r.normalized);
  if (mrzReading) {
    const group = groups.get(mrzReading.normalized);
    best = {
      value: mrzReading.normalized,
      supporters: group?.supporters || 1,
      engines: group?.engines.size || 1,
      confidence: 99,
      raw: mrzReading.raw,
    };
  }

  const totalReadings = readings.length;
  const detection = totalReadings ? usable.length / totalReadings : 0;
  const readability = totalReadings ? readings.filter((r) => r.readable || r.normalized).length / totalReadings : 0;
  const character = best ? best.confidence / 100 : 0;

  const bestFormatValid = !!best && usable.some((r) => r.normalized === best!.value);
  const enoughEvidence = !!mrzReading || (!!best && (
    (best.engines >= 2 && best.supporters >= 2 && best.confidence >= 70)
    || (best.supporters >= 3 && best.confidence >= 85)
    || (best.supporters >= 2 && best.confidence >= 85 && bestFormatValid)
  ));

  const matching = enoughEvidence && best ? (best.value === expectedNormalized ? 1 : 0) : 0;
  const overall = Math.round(
    0.3 * readability * 100 + 0.2 * detection * 100 + 0.3 * character * 100 + 0.2 * (enoughEvidence ? 100 : 0)
  );

  const outcome: Diagnosis['outcome'] = !enoughEvidence || !best
    ? 'unreadable'
    : best.value === expectedNormalized
      ? 'match'
      : 'mismatch';

  const distance = best && expectedNormalized ? characterDistance(best.value, expectedNormalized) : 0;
  const nearMiss = outcome === 'mismatch' && distance > 0 && distance <= 2;

  const notes = outcome === 'match'
    ? `Agreed by ${best!.engines} independent recogniser(s) across ${best!.supporters} reading(s).`
    : outcome === 'mismatch'
      ? `The clearest reading is ${best!.engines} recogniser(s) strong; it differs from the entered number${nearMiss ? ' by a small number of characters' : ''}.`
      : 'Readings did not agree on a complete number.';

  return {
    outcome,
    rawReading: best ? best.raw : '',
    normalizedReading: best ? best.value : '',
    expectedNormalized,
    readings,
    agreement: best ? { value: best.value, supporters: best.supporters, engines: best.engines, confidence: best.confidence } : null,
    confidence: {
      overall,
      readability: Math.round(readability * 100),
      detection: Math.round(detection * 100),
      character: Math.round(character * 100),
      matching: Math.round(matching * 100),
    },
    nearMiss,
    characterDistance: distance,
    notes,
    technical: totalReadings === 0,
    passErrors,
  };
}

export async function recogniseDocument(
  base44: any,
  params: {
    documentType: string;
    expectedNumber: string;
    sides: Side[];
    pdf?: { url: string } | null;
    bandHint?: string;
    budgetMs?: number;
  }
): Promise<Diagnosis> {
  const profile = NUMBER_PROFILES[params.documentType];
  const expectedNormalized = normalizeNumber(params.expectedNumber, profile);
  const hint = params.bandHint || bandHint([]) || '';
  const budget = Math.min(MAX_BUDGET_MS, Math.max(20000, params.budgetMs || DEFAULT_BUDGET_MS));
  const startedAt = Date.now();
  const remaining = () => budget - (Date.now() - startedAt);

  const readings: Reading[] = [];
  const passErrors: string[] = [];

  const sides = (params.sides || []).slice(0, 2);
  if (sides.length) {
    type Spec = { pass: string; model: string; image: InlineImage; source: Reading['source']; side: 'front' | 'back'; prompt: string };
    const specs: Spec[] = [];
    for (const side of sides) {
      specs.push({
        pass: side.side === 'front' ? 'A' : 'A2',
        model: MODEL_PRIMARY,
        image: side.original,
        source: 'original',
        side: side.side,
        prompt: basePrompt(profile, hint, 'Extract the number structurally, and list every other number on the document.'),
      });
      specs.push({
        pass: side.side === 'front' ? 'B' : 'B2',
        model: MODEL_SECONDARY,
        image: side.enhanced,
        source: 'enhanced',
        side: side.side,
        prompt: basePrompt(profile, hint, 'Work character by character, digit by digit, from the printed field itself. State each character you are unsure of rather than choosing one.'),
      });
    }

    const perPass = Math.max(8000, Math.min(PASS_TIMEOUT_MS, remaining() - 4000));
    // At most four passes, one batch: the worker's outbound budget is six.
    const settled = await Promise.allSettled(specs.map((spec) => visionPass(base44, { ...spec, profile }, perPass)));
    settled.forEach((entry, index) => {
      const label = specs[index].pass;
      if (entry.status !== 'fulfilled') { passErrors.push(`${label}:rejected`); return; }
      if (entry.value.reading) readings.push(entry.value.reading);
      else passErrors.push(`${label}:${entry.value.error}`);
    });

    // A third, independent pipeline runs only when the first two did not already
    // agree — it costs a call, so it is not spent on a settled reading.
    const needsMore = decide(readings, expectedNormalized, profile, []).outcome === 'unreadable';
    if (needsMore && remaining() > 12000) {
      const third = await Promise.allSettled(
        sides.map((side) => visionPass(base44, {
          pass: 'C', model: MODEL_TERTIARY, image: side.original, source: 'original',
          side: side.side, prompt: basePrompt(profile, hint, 'Transcribe the document line by line first, then take the number from your transcription.'),
          profile,
        }, Math.min(PASS_TIMEOUT_MS, remaining() - 4000)))
      );
      third.forEach((entry, index) => {
        if (entry.status !== 'fulfilled') { passErrors.push(`C${index || ''}:rejected`); return; }
        if (entry.value.reading) readings.push(entry.value.reading);
        else passErrors.push(`C${index || ''}:${entry.value.error}`);
      });
    }
  }

  // Machine-readable zone: a check-digit-validated reading outranks a plain one.
  let mrzNumber = '';
  if (profile.mrz) {
    for (const reading of readings) {
      const mrz = readMrzTd3(reading.raw);
      if (mrz && mrz.valid) {
        mrzNumber = mrz.number;
        readings.push({
          pass: 'MRZ', engine: 'mrz_check_digits', source: 'mrz', side: reading.side,
          raw: mrz.number, normalized: normalizeNumber(mrz.number, profile), confidence: 99,
          readable: true, validFormat: validateFormat(mrz.number, profile).ok,
          note: `TD3 check digits verified (${mrz.checks.join(', ')})`,
        });
        break;
      }
    }
  }

  const mrzConfirms = !!mrzNumber && readings.some((r) => r.normalized === normalizeNumber(mrzNumber, profile) && r.source === 'mrz');
  const afterMrz = decide(readings, expectedNormalized, profile, passErrors);
  const settled = mrzConfirms || afterMrz.outcome !== 'unreadable';

  // Last resort: read the stored PDF itself. This is the path that rescues
  // scanned and multi-page PDFs whose pages are not plain JPEGs.
  if (!settled && params.pdf?.url && remaining() > 15000) {
    const pdf = await pdfReadings(base44, params.pdf.url, profile, hint, Math.min(50000, remaining() - 3000));
    readings.push(...pdf.readings);
    passErrors.push(...pdf.errors);
  }

  const diagnosis = decide(readings, expectedNormalized, profile, passErrors);
  if (diagnosis.outcome === 'unreadable' && !diagnosis.technical) {
    diagnosis.notes = `${diagnosis.notes} ${profile.numberLabel} was visible but no two recognisers agreed.`;
  }
  return diagnosis;
}