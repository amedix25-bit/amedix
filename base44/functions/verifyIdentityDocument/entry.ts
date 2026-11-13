import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  DOCUMENTS, PROFILE_DOCUMENTS, TWO_SIDED, ENGINE_VERSION, OUTCOME, FIELD_LABELS,
  normalizeDocumentNumber, evaluateDocumentNumber, advisoryMatches, documentNumberLabel,
} from '../../shared/documentNumberVerification.ts';

// AMedix automated document-number verification.
//
// The uploaded document is read inside this function and the number printed on
// it is compared with the number the user entered during registration. The
// result is decided here, immediately:
//   MATCH      → the verification is marked successful and registration continues
//   MISMATCH   → refused, with the numbers that were compared, so the user can
//                upload a corrected document
//   UNREADABLE → refused, and the user is asked for a clearer photo or PDF
//
// Nothing is queued for an administrator. No record is ever created as pending
// review, and no human or institution takes part in the decision.
//
// The decision means one thing only: the number on the document equals the
// number entered. It is not a claim that the document was genuinely issued.

const str = (v, max = 200) => (typeof v === 'string' && v.length <= max ? v : '');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) || {};
    const {
      profile_type, document_type, file_uri, file_name,
      file_uri_back = '', file_name_back = '', expected = {},
    } = body;

    const requiredFields = PROFILE_DOCUMENTS[profile_type]?.[document_type];
    const spec = DOCUMENTS[document_type];
    if (!requiredFields || !spec) {
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

    // The document never leaves private storage: a short-lived signed link is
    // issued just long enough for the reader, then discarded.
    const readFrom = async (uri) => {
      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 300 });
      const properties = {};
      Object.entries(spec.extract).forEach(([key, description]) => {
        properties[key] = { type: 'string', description };
      });
      const res = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
        file_url: signed.signed_url,
        json_schema: {
          type: 'object',
          properties,
          // The number is what matters; other values are collected when the
          // document shows them but are never required to read the number.
          required: [numberField],
        },
      });
      if (res.status !== 'success' || !res.output) return null;
      const out = Array.isArray(res.output) ? res.output[0] : res.output;
      return out && typeof out === 'object' ? out : null;
    };

    let readValues = {};
    const tried = [];
    try {
      const front = await readFrom(file_uri);
      tried.push('front');
      if (front) readValues = { ...front };
    } catch (err) {
      tried.push('front_failed');
    }
    // A two-sided document may print its number on the back.
    if (!normalizeDocumentNumber(readValues[numberField]) && file_uri_back) {
      try {
        const back = await readFrom(file_uri_back);
        tried.push('back');
        if (back) readValues = { ...readValues, ...back };
      } catch (err) {
        tried.push('back_failed');
      }
    }

    const compared = evaluateDocumentNumber(enteredNumber, readValues[numberField]);

    const checks = requiredFields.map((key) => {
      const read = readValues[key] === undefined || readValues[key] === null ? '' : String(readValues[key]);
      const decisive = key === numberField;
      const matched = decisive
        ? compared.outcome === OUTCOME.match
        : read.trim() !== '' && advisoryMatches(key, readValues, String(expected[key]));
      return { field: key, label: FIELD_LABELS[key] || key, entered: String(expected[key] || ''), read, matched, decisive };
    });

    const status = compared.outcome === OUTCOME.match
      ? 'verified'
      : compared.outcome === OUTCOME.mismatch
        ? 'rejected'
        : 'failed';

    const message = compared.outcome === OUTCOME.match
      ? `${spec.numberLabel} matched — the document number was verified automatically.`
      : compared.outcome === OUTCOME.mismatch
        ? `The ${spec.numberLabel.toLowerCase()} printed on the document does not match the number you entered. Upload a corrected document or correct the number, then try again.`
        : `We could not read the ${spec.numberLabel.toLowerCase()} from this document. Upload a clearer photograph or a PDF and try again.`;

    const readRecord = {};
    const extractedRecord = {};
    requiredFields.forEach((key) => {
      const value = readValues[key] === undefined || readValues[key] === null ? '' : String(readValues[key]);
      readRecord[key] = value;
      extractedRecord[`extracted_${key}`] = value;
    });

    const expectedRecord = {};
    requiredFields.forEach((key) => {
      expectedRecord[`expected_${key}`] = typeof expected[key] === 'string' ? expected[key] : '';
    });

    const record = await base44.asServiceRole.entities.IdentityVerification.create({
      user_id: user.id,
      profile_type,
      document_type,
      file_uri,
      file_name: str(file_name),
      file_mime: str(body.file_mime, 100),
      file_size: typeof body.file_size === 'number' && body.file_size >= 0 ? body.file_size : 0,
      page_count: typeof body.page_count === 'number' && body.page_count > 0 && body.page_count <= 20 ? Math.round(body.page_count) : 1,
      source: ['camera', 'gallery', 'pdf'].includes(body.source) ? body.source : 'gallery',
      original_file_uri: str(body.original_file_uri, 500),
      original_file_name: str(body.original_file_name),
      file_uri_back,
      file_name_back: str(file_name_back),
      attempted_datetime: submittedAt,
      ...expectedRecord,
      ...extractedRecord,
      status,
      verification_outcome: compared.outcome,
      auto_verified: compared.outcome === OUTCOME.match,
      engine: ENGINE_VERSION,
      reason: compared.outcome === OUTCOME.match ? '' : compared.outcome,
      // No administrator is involved: the reason text is what the user is shown.
      review_reason: compared.outcome === OUTCOME.match ? '' : message,
      verified_datetime: compared.outcome === OUTCOME.match ? submittedAt : '',
      auto_check: {
        outcome: compared.outcome,
        checked_datetime: submittedAt,
        engine: ENGINE_VERSION,
        number_field: numberField,
        number_label: spec.numberLabel,
        entered_number: enteredNumber,
        read_number: readRecord[numberField] || '',
        normalized_entered: compared.expected,
        normalized_read: compared.read,
        sides_read: tried,
        checks,
        note: message,
      },
      // Automated audit trail — the outcome, the document type and the time.
      review_history: [
        {
          datetime: submittedAt,
          action: compared.outcome === OUTCOME.match ? 'auto_verified' : 'auto_rejected',
          actor_name: 'AMedix automated document verification',
          actor_role: 'system',
          detail: `${spec.label} · ${spec.numberLabel} · ${compared.outcome}`,
        },
      ],
    });

    return Response.json({
      status,
      outcome: compared.outcome,
      verification_id: record.id,
      submitted_datetime: submittedAt,
      document_type,
      number_label: documentNumberLabel(document_type),
      entered_number: enteredNumber,
      read_number: readRecord[numberField] || '',
      checks,
      message,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}