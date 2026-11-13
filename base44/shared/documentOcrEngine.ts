// AMedix multi-pass document recognition engine.
//
// One reading is never trusted. Every verification attempt runs several
// independent recognisers over two different pictures of the same document
// (the camera original and a server-rectified render), then decides only when
// the readings agree. A number is never accepted because it looks similar:
// agreement must be on the complete number, character for character.
//
//   PASS A  document · vision engine 1 (structured extraction)
//   PASS B  document · vision engine 2 (transcription first)
//   PASS C  document · vision engine 1 (character by character, guided by the
//            lines of text located by the server-side pixel analysis)
//   PASS D  document · vision engine 2 (zone / MRZ focused)
//   PASS E  document · independent extraction pipeline (fallback, only when
//            the vision passes produced no agreement)
//
// Every pass reads the document itself. The rectified copy is produced in
// memory and given to the passes that benefit from it (C and D): both renditions
// travel inline as base64 inside the request, so there is no URL a model could
// fail to open and no server-side render to store.
//
// Zero retention: the document never leaves memory. Nothing is written to
// storage, a temporary file, a cache or a log; only the decision is recorded.

import {
  NUMBER_PROFILES, normalizeNumber, validateFormat, readMrzTd3, characterDistance,
  type NumberProfile,
} from './documentOcrProfiles.ts';
import { readDocumentWithVision, type InlineImage } from './inlineVision.ts';

export const OCR_ENGINE_VERSION = 'amedix_document_number_v3_inmemory';

// One submitted page, prepared twice in memory: as the camera original
// (grayscale, size-capped) and as the rectified, contrast-corrected render. Both
// are base64 held in the request — never a file, never a URL.
export type Side = { side: 'front' | 'back'; original: InlineImage; enhanced: InlineImage };

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

// A pass reads an inline image and reasons about small print; a slow model must
// not be mistaken for an unreadable document, so the budget is generous and the
// request is aborted only when the model genuinely overruns.
const PASS_TIMEOUT_MS = 60000;

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
  params: { pass: string; model: string; engine: string; image: InlineImage; source: Reading['source']; side: 'front' | 'back'; prompt: string }
): Promise<Reading | null> {
  try {
    const data: any = await withTimeout(
      readDocumentWithVision(base44, {
        model: params.model,
        prompt: `${params.prompt}\n\nReply with JSON only, in exactly this shape: {"number": string, "all_numbers": string[], "script": string, "confidence": number, "readable": boolean, "notes": string}`,
        images: [params.image],
        timeoutMs: PASS_TIMEOUT_MS - 5000,
      }),
      params.pass
    );
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
  params: { image: InlineImage; side: 'front' | 'back'; profile: NumberProfile }
): Promise<Reading | null> {
  try {
    const out: any = await withTimeout(
      readDocumentWithVision(base44, {
        model: 'gpt_6_sol',
        prompt: [
          `Transcribe the ${params.profile.numberLabel.toLowerCase()} printed on this document, character by character, exactly as printed.`,
          `Where it is normally printed: ${params.profile.regions.join('; ')}.`,
          `Numbers that are not it: ${params.profile.distractors.join('; ')}.`,
          'Digits may be printed as Arabic-Indic numerals; convert them to 0-9. Do not complete a character you cannot see.',
          'Reply with JSON only: {"number": string, "readable": boolean}',
        ].join('\n'),
        images: [params.image],
        timeoutMs: PASS_TIMEOUT_MS - 5000,
      }),
      'pass_e'
    );
    if (!out || typeof out !== 'object') return null;
    return {
      pass: 'E',
      engine: 'amedix_inmemory_transcription',
      source: 'original',
      side: params.side,
      raw: typeof out.number === 'string' ? out.number : '',
      normalized: '',
      confidence: 70,
      readable: out.readable !== false,
      validFormat: true,
      note: 'independent in-memory transcription pass',
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

  type Spec = { pass: string; model: string; engine: string; image: InlineImage; source: Reading['source']; side: 'front' | 'back'; prompt: string };
  const specs: Spec[] = [];
  for (const side of params.sides) {
    const renditions: { image: InlineImage; source: Reading['source'] }[] = [
      { image: side.original, source: 'original' },
      { image: side.enhanced, source: 'enhanced' },
    ];
    for (const rendition of renditions) {
      specs.push({
        pass: rendition.source === 'original' ? 'A' : 'C',
        model: 'gemini_3_1_pro',
        engine: 'gemini_3_1_pro',
        image: rendition.image,
        source: rendition.source,
        side: side.side,
        prompt: basePrompt(profile, hint, rendition.source === 'original'
          ? 'Extract the number structurally, and list every other number on the document.'
          : 'Work character by character, digit by digit, from the printed field itself. State each character you are unsure of rather than choosing one.'),
      });
      specs.push({
        pass: rendition.source === 'original' ? 'B' : 'D',
        model: 'claude-sonnet-5',
        engine: 'claude-sonnet-5',
        image: rendition.image,
        source: rendition.source,
        side: side.side,
        prompt: basePrompt(profile, hint, rendition.source === 'original'
          ? 'Transcribe the document line by line first, then take the number from your transcription.'
          : profile.mrz
            ? 'Read the machine-readable zone at the bottom character by character, including any fill characters, and take the document number from it. If the zone is unreadable, read the printed number field instead.'
            : 'Focus on each numeric field in turn, decide which one is the identification number, and transcribe it character by character.'),
      });
    }
  }

  // Batches of four keep the worker's concurrent outbound connections in budget.
  for (let i = 0; i < specs.length; i += 4) {
    const settled = await Promise.allSettled(specs.slice(i, i + 4).map((spec) => visionPass(base44, spec)));
    for (const entry of settled) {
      if (entry.status === 'fulfilled' && entry.value) readings.push(entry.value);
    }
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

  // The independent extraction pipeline runs when the vision passes have not
  // already produced enough evidence to decide — it costs a second pipeline, so
  // it is skipped only when the readings already agree convincingly.
  const usable = readings.filter((r) => r.normalized && r.validFormat);
  const quickGroups = new Map<string, { supporters: number; engines: Set<string>; confidence: number }>();
  for (const reading of usable) {
    const group = quickGroups.get(reading.normalized);
    if (group) {
      group.supporters += 1;
      group.engines.add(reading.engine);
      group.confidence = Math.max(group.confidence, reading.confidence);
    } else {
      quickGroups.set(reading.normalized, { supporters: 1, engines: new Set([reading.engine]), confidence: reading.confidence });
    }
  }
  // Two independent renditions of the same page agreeing on the complete number
  // at high confidence is evidence in its own right: the camera original and the
  // rectified render are different pictures, and a misreading rarely survives both.
  const clearAgreement = [...quickGroups.values()].some(
    (g) => (g.engines.size >= 2 && g.supporters >= 2 && g.confidence >= 70) || (g.supporters >= 2 && g.confidence >= 85)
  );
  if (!clearAgreement) {
    const extra = await Promise.allSettled(
      params.sides.map((side) => extractorPass(base44, { image: side.original, side: side.side, profile }))
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

  // A reading is trusted when independent recognisers agree on the whole number,
  // when several readings agree, or when two separate renditions of the same page
  // — the camera original and the rectified render — agree on the complete,
  // well-formed number at high confidence. A single unconfirmed reading is never
  // enough, however certain it claims to be.
  const mrzConfirms = !!mrzNumber && !!best && best.value === normalizeNumber(mrzNumber, profile);
  const bestFormatValid = !!best && usable.some((r) => r.normalized === best!.value);
  const enoughEvidence = !!best && (
    (best.engines >= 2 && best.supporters >= 2 && best.confidence >= 70)
    || (best.supporters >= 3 && best.confidence >= 85)
    || (best.supporters >= 2 && best.confidence >= 85 && bestFormatValid)
    || mrzConfirms
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