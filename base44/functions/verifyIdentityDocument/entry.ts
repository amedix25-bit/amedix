import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  DOCUMENTS, PROFILE_DOCUMENTS, TWO_SIDED, FIELD_LABELS,
  advisoryMatches, documentNumberLabel,
} from '../../shared/documentNumberVerification.ts';
import { maskDocumentNumber, scrubAutoCheck, retentionFields } from '../../shared/documentRetention.ts';
import { NUMBER_PROFILES, validateFormat } from '../../shared/documentOcrProfiles.ts';
import { recogniseDocument, OCR_ENGINE_VERSION } from '../../shared/documentOcrEngine.ts';
import { prepareInMemoryDocument } from '../../shared/documentInMemoryPages.ts';
import { readDocumentWithVision } from '../../shared/inlineVision.ts';

// AMedix automated document-number verification — NO STORAGE AT ALL.
//
// The document is never uploaded. The browser sends its pages as base64 inside
// this request; the pages are decoded, measured, rectified and read entirely in
// the function's memory and released when it returns. There is nothing to delete
// afterwards because nothing is ever created:
//   • no UploadPrivateFile / UploadPublicFile call
//   • no signed URL, no storage reference
//   • no temporary file, cache entry or log line carrying document bytes
//   • no copy kept for a later pass — every pass reads from memory
//
// Several independent recognisers read the camera original and the rectified
// render of the same page. A number is accepted only when the readings agree on
// the complete value; that value is then compared with the number the user typed:
//   MATCH      → verified, registration continues
//   MISMATCH   → refused, with both numbers shown so the user can correct it
//   UNREADABLE → refused, and the user is asked for a clearer photo or PDF
//
// What the record keeps is the decision: status, document category, timestamp,
// masked numbers, the confidence breakdown, which recognisers answered, and the
// record's own id.

// ~9 MB of decoded document: enough for a good phone scan or a small PDF, small
// enough that the check stays a request and never becomes a transfer.
const MAX_TOTAL_BASE64_CHARS = 12_000_000;
const MAX_PAGES = 3;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'application/pdf']);

export default async function (req: any) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) || {};
    const { profile_type, document_type, expected = {}, pages = [] } = body;

    const requiredFields = PROFILE_DOCUMENTS[profile_type]?.[document_type];
    const spec = DOCUMENTS[document_type];
    const profile = NUMBER_PROFILES[document_type];
    if (!requiredFields || !spec || !profile) {
      return Response.json({ error: 'Invalid verification method' }, { status: 400 });
    }

    if (!Array.isArray(pages) || pages.length === 0 || pages.length > MAX_PAGES) {
      return Response.json({ error: 'The document pages were not received. Choose the document again and retry.' }, { status: 400 });
    }
    let totalChars = 0;
    for (const page of pages) {
      if (!page || typeof page.base64 !== 'string' || !page.base64) {
        return Response.json({ error: 'The document pages were not received. Choose the document again and retry.' }, { status: 400 });
      }
      if (!ALLOWED_MIME.has(page.mime)) {
        return Response.json({ error: 'Only a photo (JPG/PNG) or a PDF can be checked.' }, { status: 400 });
      }
      totalChars += page.base64.length;
    }
    if (totalChars > MAX_TOTAL_BASE64_CHARS) {
      return Response.json(
        { error: 'This document is too large to check in one pass. Photograph the pages instead of uploading a large PDF.' },
        { status: 413 }
      );
    }

    for (const key of requiredFields) {
      const value = expected?.[key];
      const max = key === 'full_name' ? 200 : 100;
      if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
        return Response.json({ error: 'Missing required information' }, { status: 400 });
      }
    }

    if (TWO_SIDED.includes(document_type) && pages.length < 2 && pages[0].mime !== 'application/pdf') {
      return Response.json(
        { error: 'This document has two sides — include the front and the back, or one PDF containing both sides' },
        { status: 400 }
      );
    }

    const submittedAt = new Date().toISOString();
    const numberField = spec.numberField;
    const enteredNumber = String(expected[numberField] || '');
    const source = ['camera', 'gallery', 'pdf'].includes(body.source) ? body.source : 'gallery';

    const refusal = async (reason: string, message: string) => {
      const record = await base44.asServiceRole.entities.IdentityVerification.create({
        user_id: user.id,
        profile_type,
        document_type,
        source,
        attempted_datetime: submittedAt,
        ...retentionFields(submittedAt),
        status: 'failed',
        verification_outcome: 'unreadable',
        auto_verified: false,
        engine: OCR_ENGINE_VERSION,
        reason,
        review_reason: message,
        auto_check: scrubAutoCheck({
          outcome: 'unreadable',
          checked_datetime: submittedAt,
          engine: OCR_ENGINE_VERSION,
          number_field: numberField,
          number_label: profile.numberLabel,
          entered_number: enteredNumber,
          read_number: '',
          sides_read: [],
          note: message,
        }),
        review_history: [{
          datetime: submittedAt,
          action: 'auto_rejected',
          actor_name: 'AMedix automated document verification',
          actor_role: 'system',
          detail: `${profile.label} · ${reason} · read in memory, nothing stored`,
        }],
      });
      return Response.json({
        status: 'failed',
        outcome: 'unreadable',
        verification_id: record.id,
        message,
        blank_page: reason === 'blank_page',
      });
    };

    // ---- decode, measure and rectify — all in memory ----------------------
    const prepared = await prepareInMemoryDocument(pages);
    if (prepared.reason === 'undecodable') {
      return refusal(
        'document_unreadable',
        'This file could not be opened. Photograph the document with the camera, or upload a PDF that contains the page.'
      );
    }
    if (prepared.reason === 'blank') {
      return refusal(
        'blank_page',
        'The uploaded page came through empty. Photograph the document again with the whole page in frame, or upload a PDF that contains the page.'
      );
    }

    const analysis = prepared.analysis;
    const sides = prepared.sides;
    const bandHint = analysis && analysis.bands.length
      ? `Independent pixel analysis of this image found lines of printed text at: ${analysis.bands
          .slice(0, 4)
          .map((b: any) => `y ${Math.round(b.y0 * 100)}%-${Math.round(b.y1 * 100)}%, x ${Math.round(b.x0 * 100)}%-${Math.round(b.x1 * 100)}%`)
          .join('; ')}. Detected skew ${analysis.skew}°. Check those areas, but do not assume the number is only there.`
      : '';

    // ---- multi-pass recognition, every pass fed from memory ----------------
    const diagnosis = await recogniseDocument(base44, { documentType: document_type, expectedNumber: enteredNumber, sides, bandHint });

    // ---- advisory values (audit only, never decisive) ---------------------
    let advisory: Record<string, string> = {};
    const advisoryFields = requiredFields.filter((key: string) => key !== numberField);
    if (advisoryFields.length && sides.length) {
      try {
        const data: any = await readDocumentWithVision(base44, {
          model: 'gemini_3_1_pro',
          prompt: [
            `Read this ${profile.label.toLowerCase()} and return the requested fields exactly as printed.`,
            `Fields: ${advisoryFields.map((key: string) => `${key} (${(spec as any).extract[key]})`).join('; ')}.`,
            'Transcribe what you see; leave a field empty when it is not printed or not legible.',
            'Reply with JSON only, using exactly those keys.',
          ].join('\n'),
          images: [sides[0].original],
          timeoutMs: 30000,
        });
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

    const quality = analysis ? analysis.quality : null;
    const qualityIssue = !quality
      ? ''
      : quality.sharpness < 40
        ? 'The photograph looks blurred — hold the phone steady and make sure the number is in focus.'
        : quality.glare_fraction > 0.08
          ? 'Glare or reflection is covering part of the document — move away from direct light.'
          : quality.contrast < 70
            ? 'The lighting is too flat or too dark — photograph the document in even daylight.'
            : Math.min(quality.pixel_width, quality.pixel_height) < 700
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
      source,
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
      // Only masked numbers, counts and the decision — never a full number,
      // never a reading, never a byte of the document.
      auto_check: scrubAutoCheck({
        outcome: diagnosis.outcome,
        checked_datetime: submittedAt,
        engine: OCR_ENGINE_VERSION,
        number_field: numberField,
        number_label: profile.numberLabel,
        entered_number: enteredNumber,
        read_number: diagnosis.rawReading || '',
        sides_read: sides.map((side) => side.side),
        checks: checks.map((c: any) => ({
          field: c.field, label: c.label, decisive: c.decisive, matched: c.matched,
          entered: maskDocumentNumber(c.entered), read: maskDocumentNumber(c.read),
        })),
        // Which recognisers answered, from which rendition, and how strongly —
        // no number text, no image, nothing that could carry the document.
        readings: diagnosis.readings.map((r) => ({
          pass: r.pass, engine: r.engine, source: r.source, confidence: Math.round(r.confidence), well_formed: r.validFormat,
        })),
        agreement: diagnosis.agreement ? { supporters: diagnosis.agreement.supporters, engines: diagnosis.agreement.engines } : null,
        note: message,
      }),
      review_history: [
        {
          datetime: submittedAt,
          action: diagnosis.outcome === 'match' ? 'auto_verified' : 'auto_rejected',
          actor_name: 'AMedix automated document verification',
          actor_role: 'system',
          detail: `${profile.label} · ${profile.numberLabel} · ${diagnosis.outcome} · confidence ${diagnosis.confidence.overall} · read in memory, nothing stored`,
        },
      ],
    });

    return Response.json({
      status,
      outcome: diagnosis.outcome,
      verification_id: record.id,
      submitted_datetime: submittedAt,
      document_retained: false,
      document_stored: false,
      document_type,
      number_label: documentNumberLabel(document_type),
      entered_number: enteredNumber,
      read_number: diagnosis.rawReading || '',
      checks,
      message,
      confidence: diagnosis.confidence,
      quality,
      pages_decoded: analysis ? analysis.pages_decoded : 0,
      passes: diagnosis.readings.map((r) => `${r.pass}:${r.engine}:${r.source}:${Math.round(r.confidence)}`),
      format_valid: validateFormat(diagnosis.rawReading, profile).ok,
      near_miss: diagnosis.nearMiss,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}