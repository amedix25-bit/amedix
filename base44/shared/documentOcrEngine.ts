// AMedix multi-pass document recognition engine.
//
// One reading is never trusted. Every verification attempt runs several
// independent recognisers over two different pictures of the same document
// (the camera original and a server-rectified render), then decides only when
// the readings agree. A number is never accepted because it looks similar:
// agreement must be on the complete number, character for character.
//
//   PASS A  original document      · vision engine 1 (structured extraction)
//   PASS B  original document      · vision engine 2 (transcription first)
//   PASS C  rectified render       · vision engine 1 (character by character,
//                                    guided by the text bands found in the pixels)
//   PASS D  rectified render       · vision engine 2 (zone / MRZ focused)
//   PASS E  binarised render       · independent extraction pipeline (fallback)
//
// Zero retention: the render URLs are signed, expire in minutes and are rebuilt
// in memory on every read. Nothing about the document is written to storage.

import {
  NUMBER_PROFILES, normalizeNumber, validateFormat, readMrzTd3, characterDistance,
  type NumberProfile,
} from './documentOcrProfiles.ts';

export const OCR_ENGINE_VERSION = 'amedix_document_number_v2_multipass';

export type Side = { side: 'front' | 'back'; url: string; enhancedUrl: string; binaryUrl: string };

export type Reading = {
  pass: string;
  engine: string;
  source: 'original' | 'enhanced' | 'binary' | 'mrz';
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
};

const PASS_TIMEOUT_MS = 30000;

const NUMBER_SCHEMA = {
  type: 'object',
  properties: {
    number: { type: 'string', description: 'The identification number exactly as printed on the document, every character, without spaces or separators. Empty string if it truly cannot be read.' },
    all_numbers: { type: 'array', items: { type: 'string' }, description: 'Every other number printed on the document (dates, serials, codes), transcribed exactly.' },
    script: { type: 'string', description: 'latin, arabic or mixed' },
    confidence: { type: 'number', description: 'How certain the reading of the identification number is, 0 to 100' },
    readable: { type: 'boolean', description: 'Whether the identification number is legible at all in this image' },
    notes: { type: 'string', description: 'Anything that blocks reading: blur, glare, crop, angle, obscured digits' },
  },
  required: ['number', 'confidence', 'readable'],
};

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
    `Return the number with no spaces, hyphens or slashes. Confidence below 85 means you are guessing — report it honestly.`,
  ].filter(Boolean).join('\n');
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label}_timeout`)), PASS_TIMEOUT_MS)),
  ]);
}

async function visionPass(
  base44: any,
  params: { pass: string; model: string; engine: string; url: string; source: Reading['source']; side: 'front' | 'back'; prompt: string }
): Promise<Reading | null> {
  try {
    const result: any = await withTimeout(
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: params.prompt,
        file_urls: [params.url],
        model: params.model,
        response_json_schema: NUMBER_SCHEMA,
      }),
      params.pass
    );
    const data = typeof result === 'string' ? JSON.parse(result) : result;
    if (!data || typeof data !== 'object') return null;
    return {
      pass: params.pass,
      engine: params.engine,
      source: params.source,
      side: params.side,
      raw: typeof data.number === 'string' ? data.number : '',
      normalized: '',
      confidence: Math.max(0, Math.min(100, Number(data.confidence) || 0)),
      readable: data.readable !== false,
      validFormat: true,
      note: [data.notes, Array.isArray(data.all_numbers) ? `other numbers: ${data.all_numbers.slice(0, 6).join(', ')}` : ''].filter(Boolean).join(' · '),
    };
  } catch {
    return null;
  }
}

async function extractorPass(
  base44: any,
  params: { url: string; side: 'front' | 'back'; profile: NumberProfile }
): Promise<Reading | null> {
  try {
    const res: any = await withTimeout(
      base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
        file_url: params.url,
        json_schema: {
          type: 'object',
          properties: {
            number: { type: 'string', description: `The ${params.profile.numberLabel} exactly as printed, no spaces or separators; empty when it cannot be read` },
            readable: { type: 'boolean', description: 'Whether the number is legible' },
          },
          required: ['number'],
        },
      }),
      'pass_e'
    );
    if (res.status !== 'success' || !res.output) return null;
    const out = Array.isArray(res.output) ? res.output[0] : res.output;
    if (!out || typeof out !== 'object') return null;
    return {
      pass: 'E',
      engine: 'amedix_extractor',
      source: 'binary',
      side: params.side,
      raw: typeof (out as any).number === 'string' ? (out as any).number : '',
      normalized: '',
      confidence: 70,
      readable: (out as any).readable !== false,
      validFormat: true,
      note: 'independent extraction pipeline',
    };
  } catch {
    return null;
  }
}

export async function recogniseDocument(
  base44: any,
  params: { documentType: string; expectedNumber: string; sides: Side[]; bandHint?: string }
): Promise<Diagnosis> {
  const profile = NUMBER_PROFILES[params.documentType];
  const expectedNormalized = normalizeNumber(params.expectedNumber, profile);
  const hint = params.bandHint || '';
  const readings: Reading[] = [];

  const tasks: Promise<Reading | null>[] = [];
  for (const side of params.sides) {
    tasks.push(
      visionPass(base44, {
        pass: 'A', model: 'gemini_3_1_pro', engine: 'gemini_3_1_pro', url: side.url, source: 'original', side: side.side,
        prompt: basePrompt(profile, hint, 'Extract the number structurally, and list every other number on the document.'),
      }),
      visionPass(base44, {
        pass: 'B', model: 'claude-sonnet-5', engine: 'claude-sonnet-5', url: side.url, source: 'original', side: side.side,
        prompt: basePrompt(profile, hint, 'Transcribe the document line by line first, then take the number from your transcription.'),
      }),
      visionPass(base44, {
        pass: 'C', model: 'gemini_3_1_pro', engine: 'gemini_3_1_pro', url: side.enhancedUrl, source: 'enhanced', side: side.side,
        prompt: basePrompt(profile, hint, 'This copy has been rectified by the server: straightened, shadow-flattened, contrast-equalised and upscaled. Read the number character by character, digit by digit, and state each character you are unsure of.'),
      }),
      visionPass(base44, {
        pass: 'D', model: 'claude-sonnet-5', engine: 'claude-sonnet-5', url: side.enhancedUrl, source: 'enhanced', side: side.side,
        prompt: basePrompt(profile, hint, profile.mrz
          ? 'Read the machine-readable zone at the bottom character by character, including any fill characters, and take the document number from it. If the zone is unreadable, read the printed number field instead.'
          : 'Focus on each numeric field in turn, decide which one is the identification number, and transcribe it character by character.'),
      })
    );
  }

  const settled = await Promise.allSettled(tasks);
  for (const entry of settled) {
    if (entry.status === 'fulfilled' && entry.value) readings.push(entry.value);
  }

  // Machine-readable zone: a check-digit-validated reading outranks a plain one.
  let mrzNumber = '';
  for (const reading of readings) {
    if (!profile.mrz) break;
    const mrz = readMrzTd3(reading.raw);
    if (mrz && mrz.valid) {
      mrzNumber = mrz.number;
      readings.push({
        pass: 'MRZ', engine: 'mrz_check_digits', source: 'mrz', side: reading.side,
        raw: mrz.number, normalized: '', confidence: 99, readable: true, validFormat: true,
        note: `TD3 check digits verified (${mrz.checks.join(', ')})`,
      });
      break;
    }
  }

  for (const reading of readings) {
    reading.normalized = normalizeNumber(reading.raw, profile);
    reading.validFormat = validateFormat(reading.raw, profile).ok;
  }

  // The independent extraction pipeline runs only when the vision passes have
  // not already produced a clear agreement — it costs a second pipeline.
  const usable = readings.filter((r) => r.normalized && r.validFormat);
  const quickGroups = new Map<string, number>();
  usable.forEach((r) => quickGroups.set(r.normalized, (quickGroups.get(r.normalized) || 0) + 1));
  const clearAgreement = [...quickGroups.values()].some((n) => n >= 2);
  if (!clearAgreement) {
    const extra = await Promise.allSettled(
      params.sides.map((side) => extractorPass(base44, { url: side.binaryUrl, side: side.side, profile }))
    );
    for (const entry of extra) {
      if (entry.status === 'fulfilled' && entry.value) {
        const reading = entry.value;
        reading.normalized = normalizeNumber(reading.raw, profile);
        reading.validFormat = validateFormat(reading.raw, profile).ok;
        readings.push(reading);
      }
    }
  }

  // ---- consensus ----------------------------------------------------------
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

  let best: { value: string; supporters: number; engines: number; confidence: number; raw: string } | null = null;
  for (const [value, group] of groups) {
    const candidate = { value, supporters: group.supporters, engines: group.engines.size, confidence: group.confidence, raw: group.raw };
    if (!best) { best = candidate; continue; }
    const better = candidate.engines > best.engines
      || (candidate.engines === best.engines && candidate.supporters > best.supporters)
      || (candidate.engines === best.engines && candidate.supporters === best.supporters && candidate.confidence > best.confidence);
    if (better) best = candidate;
  }

  const totalReadings = readings.length;
  const detection = totalReadings ? usable.length / totalReadings : 0;
  const readability = totalReadings
    ? readings.filter((r) => r.readable || r.normalized).length / totalReadings
    : 0;
  const character = best ? best.confidence / 100 : 0;

  // A reading is only trusted when independent recognisers agree on the whole
  // number, or when a single reading is exceptionally certain AND the document
  // carries a check-digit-validated zone.
  const mrzConfirms = !!mrzNumber && !!best && best.value === normalizeNumber(mrzNumber, profile);
  const enoughEvidence = !!best && (
    (best.engines >= 2 && best.supporters >= 2 && best.confidence >= 70)
    || (best.supporters >= 3 && best.confidence >= 85)
    || mrzConfirms
    || (best.engines >= 1 && best.confidence >= 97 && best.value.length >= 6 && usable.length >= 2 && best.supporters >= 2)
  );

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
  };
}