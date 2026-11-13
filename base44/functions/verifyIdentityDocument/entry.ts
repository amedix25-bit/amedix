import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  DOCUMENTS, PROFILE_DOCUMENTS, TWO_SIDED, FIELD_LABELS,
  normalizeDocumentNumber, advisoryMatches, documentNumberLabel,
} from '../../shared/documentNumberVerification.ts';
import { maskDocumentNumber, scrubAutoCheck, retentionFields } from '../../shared/documentRetention.ts';
import { NUMBER_PROFILES, validateFormat } from '../../shared/documentOcrProfiles.ts';
import { recogniseDocument, OCR_ENGINE_VERSION, type Side } from '../../shared/documentOcrEngine.ts';
import { createRenderToken } from '../../shared/documentRenderToken.ts';
import { decodeImage, isPng, assessQuality, detectBands, estimateSkew } from '../../shared/documentImageOps.ts';

// AMedix automated document-number verification (multi-pass engine).
//
// The document is read by several independent recognisers over the camera
// original and a server-rectified render of the same page. The number is only
// accepted when the readings agree on the complete value; agreement is then
// compared with the number the user entered:
//   MATCH      → verified, registration continues
//   MISMATCH   → refused, with both numbers shown so the user can correct it
//   UNREADABLE → refused, and the user is asked for a clearer photo or PDF
//
// An unreadable document is never reported as a mismatch, and a near-miss
// number is never silently accepted.
//
// ZERO RETENTION: the document and every rectified render exist only in memory
// for the length of this request. The record carries the decision, the document
// type, the time, the masked numbers, the confidence breakdown and this record's
// own id — no file, no storage reference, no unmasked number.

const str = (v: any, max = 200) => (typeof v === 'string' && v.length <= max ? v : '');
const APP_ORIGIN = 'https://amedix.base44.app';

export default async function (req: any) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) || {};
    const {
      profile_type, document_type, file_uri, file_name,
      file_uri_back = '', expected = {},
    } = body;

    const requiredFields = PROFILE_DOCUMENTS[profile_type]?.[document_type];
    const spec = DOCUMENTS[document_type];
    const profile = NUMBER_PROFILES[document_type];
    if (!requiredFields || !spec || !profile) {
      return Response.json({ error: 'Invalid verification method' }, { status: 400 });
    }
    if (typeof file_uri !== 'string' || file_uri.length === 0 || file_uri.length > 500) {
      return Response.json({ error: 'Invalid file' }, { status: 400 });
    }
    if (typeof file_uri_back !== 'string' || file_uri_back.length > 500) {
      return Response.json({ error: 'Invalid file' }, { status: 400 });
    }
    for (const key of requiredFields) {
      const value = expected?.[key];
      const max = key === 'full_name' ? 200 : 100;
      if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
        return Response.json({ error: 'Missing required information' }, { status: 400 });
      }
    }

    const frontIsPdf = typeof file_name === 'string' && file_name.toLowerCase().endsWith('.pdf');
    if (TWO_SIDED.includes(document_type) && !file_uri_back && !frontIsPdf) {
      return Response.json(
        { error: 'This document has two sides — submit the front and the back, or one PDF containing both sides' },
        { status: 400 }
      );
    }

    const submittedAt = new Date().toISOString();
    const numberField = spec.numberField;
    const enteredNumber = String(expected[numberField] || '');

    // Short-lived signed links: the reader and the rectifier use them, nothing
    // else does, and they expire in minutes.
    const signSide = async (uri: string, side: 'front' | 'back'): Promise<Side> => {
      const signed: any = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 300 });
      const url = signed.signed_url;
      const enhancedToken = await createRenderToken(url, 'enhanced');
      const binaryToken = await createRenderToken(url, 'binary');
      return {
        side,
        url,
        enhancedUrl: `${APP_ORIGIN}/functions/documentRender?t=${encodeURIComponent(enhancedToken)}`,
        binaryUrl: `${APP_ORIGIN}/functions/documentRender?t=${encodeURIComponent(binaryToken)}`,
      };
    };

    const sides: Side[] = [];
    const tried: string[] = [];
    try {
      sides.push(await signSide(file_uri, 'front'));
      tried.push('front');
    } catch {
      tried.push('front_failed');
    }
    if (file_uri_back) {
      try {
        sides.push(await signSide(file_uri_back, 'back'));
        tried.push('back');
      } catch {
        tried.push('back_failed');
      }
    }

    // ---- server-side pixel analysis (no derivative is stored) --------------
    let analysis: { quality: any; bands: any[]; skew: number } | null = null;
    try {
      const front = sides[0];
      const res = await fetch(front.url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const bytes = new Uint8Array(await res.arrayBuffer());
        const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
        if (isPng(bytes) || isJpeg) {
          const raster = await decodeImage(bytes);
          analysis = { quality: assessQuality(raster), bands: detectBands(raster), skew: estimateSkew(raster) };
        }
      }
    } catch {
      analysis = null;
    }

    const bandHint = analysis && analysis.bands.length
      ? `Independent pixel analysis of this image found lines of printed text at: ${analysis.bands
          .slice(0, 4)
          .map((b: any) => `y ${Math.round(b.y0 * 100)}%-${Math.round(b.y1 * 100)}%, x ${Math.round(b.x0 * 100)}%-${Math.round(b.x1 * 100)}%`)
          .join('; ')}. Detected skew ${analysis.skew}°. Check those areas, but do not assume the number is only there.`
      : '';

    // ---- multi-pass recognition -------------------------------------------
    const diagnosis = sides.length
      ? await recogniseDocument(base44, { documentType: document_type, expectedNumber: enteredNumber, sides, bandHint })
      : { outcome: 'unreadable' as const, rawReading: '', normalizedReading: '', expectedNormalized: '', readings: [], agreement: null, confidence: { overall: 0, readability: 0, detection: 0, character: 0, matching: 0 }, nearMiss: false, characterDistance: 0, notes: 'document could not be opened' };

    // ---- advisory values (audit only, never decisive) ---------------------
    let advisory: Record<string, string> = {};
    const advisoryFields = requiredFields.filter((key: string) => key !== numberField);
    if (advisoryFields.length && sides.length) {
      try {
        const properties: Record<string, any> = {};
        advisoryFields.forEach((key: string) => {
          properties[key] = { type: 'string', description: (spec as any).extract[key] };
        });
        const res: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Read this ${profile.label.toLowerCase()} and return the requested fields exactly as printed. Transcribe what you see; leave a field empty when it is not printed or not legible.`,
          file_urls: [sides[0].url],
          model: 'gemini_3_flash',
          response_json_schema: { type: 'object', properties, required: [] },
        });
        const data = typeof res === 'string' ? JSON.parse(res) : res;
        if (data && typeof data === 'object') {
          advisoryFields.forEach((key: string) => {
            if (typeof data[key] === 'string') advisory[key] = data[key];
          });
        }
      } catch {
        advisory = {};
      }
    }

    const checks = requiredFields.map((key: string) => {
      const decisive = key === numberField;
      const read = decisive ? diagnosis.rawReading : (advisory[key] || '');
      const matched = decisive
        ? diagnosis.outcome === 'match'
        : read.trim() !== '' && advisoryMatches(key, advisory, String(expected[key]));
      return {
        field: key,
        label: FIELD_LABELS[key] || key,
        entered: String(expected[key] || ''),
        read,
        matched,
        decisive,
      };
    });

    const status = diagnosis.outcome === 'match' ? 'verified' : diagnosis.outcome === 'mismatch' ? 'rejected' : 'failed';

    const qualityIssue = !analysis
      ? ''
      : analysis.quality.sharpness < 40
        ? 'The photograph looks blurred — hold the phone steady and make sure the number is in focus.'
        : analysis.quality.glare_fraction > 0.08
          ? 'Glare or reflection is covering part of the document — move away from direct light.'
          : analysis.quality.contrast < 70
            ? 'The lighting is too flat or too dark — photograph the document in even daylight.'
            : Math.min(analysis.quality.pixel_width, analysis.quality.pixel_height) < 700
              ? 'The photograph is small — fill the frame with the document so the number is sharp.'
              : '';

    const unreadableMessage = qualityIssue
      ? `We could not read the ${profile.numberLabel.toLowerCase()}. ${qualityIssue}`
      : `We could not read the ${profile.numberLabel.toLowerCase()} reliably from this document. Upload a clearer photograph or a PDF and try again.`;

    const message = diagnosis.outcome === 'match'
      ? `${profile.numberLabel} matched — the document number was verified automatically.`
      : diagnosis.outcome === 'mismatch'
        ? `The ${profile.numberLabel.toLowerCase()} printed on the document does not match the number you entered. Upload a corrected document or correct the number, then try again.`
        : unreadableMessage;

    const expectedRecord: Record<string, string> = {};
    requiredFields.forEach((key: string) => {
      expectedRecord[`expected_${key}`] = maskDocumentNumber(typeof expected[key] === 'string' ? expected[key] : '');
    });

    const record = await base44.asServiceRole.entities.IdentityVerification.create({
      user_id: user.id,
      profile_type,
      document_type,
      source: ['camera', 'gallery', 'pdf'].includes(body.source) ? body.source : 'gallery',
      attempted_datetime: submittedAt,
      ...expectedRecord,
      ...retentionFields(submittedAt),
      status,
      verification_outcome: diagnosis.outcome,
      auto_verified: diagnosis.outcome === 'match',
      engine: OCR_ENGINE_VERSION,
      reason: diagnosis.outcome === 'match' ? '' : diagnosis.outcome,
      review_reason: diagnosis.outcome === 'match' ? '' : message,
      verified_datetime: diagnosis.outcome === 'match' ? submittedAt : '',
      // Only masked numbers and counts are written — never a reading, never a
      // complete number, never anything else the document said.
      auto_check: scrubAutoCheck({
        outcome: diagnosis.outcome,
        checked_datetime: submittedAt,
        engine: OCR_ENGINE_VERSION,
        number_field: numberField,
        number_label: profile.numberLabel,
        entered_number: enteredNumber,
        read_number: diagnosis.rawReading || '',
        sides_read: tried,
        checks: checks.map((c: any) => ({
          field: c.field, label: c.label, decisive: c.decisive, matched: c.matched,
          entered: maskDocumentNumber(c.entered), read: maskDocumentNumber(c.read),
        })),
        confidence: diagnosis.confidence,
        passes: diagnosis.readings.map((r) => ({
          pass: r.pass, engine: r.engine, source: r.source, side: r.side,
          readable: r.readable, valid_format: r.validFormat, confidence: Math.round(r.confidence),
        })),
        agreement: diagnosis.agreement
          ? { supporters: diagnosis.agreement.supporters, engines: diagnosis.agreement.engines, confidence: Math.round(diagnosis.agreement.confidence) }
          : null,
        near_miss: diagnosis.nearMiss,
        character_distance: diagnosis.characterDistance,
        image_quality: analysis ? analysis.quality : null,
        text_bands: analysis ? analysis.bands.length : 0,
        skew_degrees: analysis ? analysis.skew : null,
        note: message,
      }),
      review_history: [
        {
          datetime: submittedAt,
          action: diagnosis.outcome === 'match' ? 'auto_verified' : 'auto_rejected',
          actor_name: 'AMedix automated document verification',
          actor_role: 'system',
          detail: `${profile.label} · ${profile.numberLabel} · ${diagnosis.outcome} · confidence ${diagnosis.confidence.overall}`,
        },
      ],
    });

    return Response.json({
      status,
      outcome: diagnosis.outcome,
      verification_id: record.id,
      submitted_datetime: submittedAt,
      document_retained: false,
      document_type,
      number_label: documentNumberLabel(document_type),
      entered_number: enteredNumber,
      read_number: diagnosis.rawReading || '',
      checks,
      message,
      confidence: diagnosis.confidence,
      quality: analysis ? analysis.quality : null,
      passes: diagnosis.readings.map((r) => `${r.pass}:${r.engine}:${r.source}:${Math.round(r.confidence)}`),
      format_valid: validateFormat(diagnosis.rawReading, profile).ok,
      near_miss: diagnosis.nearMiss,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}