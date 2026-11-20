// AMedix identity-verification job pipeline.
//
// THE invariant this module exists to guarantee: the submitted document is
// saved to private storage BEFORE any processing starts, and a processing
// failure never destroys it. A job therefore always survives a closed tab, a
// dropped connection, a crashed worker or a slow model, and can always be
// resumed or handed to an administrator without asking the user to upload the
// document again.
//
// Lifecycle
//   uploaded ──▶ processing ──▶ approved | rejected | manual_review
//                     │
//                     └──▶ processing_failed ──(retry)──▶ processing
//
// A worker claims a job by writing a random token; it may only record a result
// while its token is still the one on the record, so two concurrent workers can
// never both decide the same document. A job left in `processing` past the
// stale window is moved to `manual_review` by any later status read, so nothing
// can sit in processing forever.

import { prepareInMemoryDocument } from './documentInMemoryPages.ts';
import { recogniseDocument, OCR_ENGINE_VERSION, type Side } from './documentOcrEngine.ts';
import { maskDocumentNumber, retainedFields, scrubAutoCheck } from './documentRetention.ts';
import { NUMBER_PROFILES } from './documentOcrProfiles.ts';
import {
  DOCUMENTS, PROFILE_DOCUMENTS, FIELD_LABELS, documentNumberLabel,
} from './documentNumberVerification.ts';
import { sniffFileType, MIME_BY_KIND, READABLE_KINDS, MAX_DOCUMENT_BYTES, type FileKind } from './documentFileTypes.ts';
import { bytesToBase64 } from './inlineVision.ts';

export const JOB = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  FAILED: 'processing_failed',
  MANUAL_REVIEW: 'manual_review',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const OPEN_STATUSES = [JOB.UPLOADED, JOB.PROCESSING, JOB.FAILED, JOB.MANUAL_REVIEW, JOB.PENDING_APPROVAL];
const STALE_MS = 6 * 60 * 1000;
const MAX_ATTEMPTS = 2;

// Only these expected fields exist on the record, and every one is stored
// masked — the full value is never written next to a document reference.
const MASKED_EXPECTED_FIELDS = ['national_id_number', 'license_number', 'personal_card_number', 'passport_number'];

function nowIso() {
  return new Date().toISOString();
}

function jobReference() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  const random = crypto.getRandomValues(new Uint8Array(4));
  for (let i = 0; i < 4; i += 1) suffix += alphabet[random[i] % alphabet.length];
  return `VRF-${stamp}-${suffix}`;
}

function pushHistory(record: any, entry: { action: string; actor_name?: string; actor_role?: string; detail?: string }) {
  const history = Array.isArray(record?.review_history) ? record.review_history.slice(-60) : [];
  history.push({ datetime: nowIso(), ...entry });
  return history;
}

export function isStale(record: any): boolean {
  if (!record || record.job_status !== JOB.PROCESSING) return false;
  const started = Date.parse(record.job_started_datetime || '');
  if (!Number.isFinite(started)) return true;
  return Date.now() - started > STALE_MS;
}

export async function signedDocumentUrl(base44: any, fileUri: string, ttlSeconds = 600): Promise<string> {
  if (!fileUri) return '';
  try {
    const result: any = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: Math.max(60, Math.min(3600, ttlSeconds)),
    });
    return result?.signed_url || '';
  } catch {
    return '';
  }
}

async function downloadDocument(base44: any, fileUri: string): Promise<{ bytes: Uint8Array; url: string }> {
  const url = await signedDocumentUrl(base44, fileUri, 900);
  if (!url) throw new Error('storage_unavailable');
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`storage_http_${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length) throw new Error('storage_empty');
  if (bytes.length > MAX_DOCUMENT_BYTES) throw new Error('document_too_large');
  return { bytes, url };
}

function expectedFields(expected: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const field of MASKED_EXPECTED_FIELDS) {
    const value = expected?.[field];
    if (typeof value === 'string' && value.trim()) out[`expected_${field}`] = maskDocumentNumber(value);
  }
  return out;
}

export type SubmitInput = {
  userId: string;
  profileType: 'patient' | 'doctor';
  documentType: string;
  expected: Record<string, string>;
  file: { uri: string; name?: string; mime?: string; size?: number; pageCount?: number };
  source: string;
};

/**
 * Creates (or returns) the job for a document that is already in private
 * storage. Re-submitting the same document with the same number returns the
 * existing open job, so a retry or a double-tap can never open a second job.
 */
export async function createJob(base44: any, input: SubmitInput) {
  const spec = DOCUMENTS[input.documentType];
  const profile = NUMBER_PROFILES[input.documentType];
  const required = PROFILE_DOCUMENTS[input.profileType]?.[input.documentType];
  if (!spec || !profile || !required) throw new Error('invalid_document_type');

  const numberField = spec.numberField;
  const enteredNumber = String(input.expected?.[numberField] || '').trim();
  if (!enteredNumber) throw new Error('missing_expected_number');

  const idempotencyKey = `${input.userId}|${input.documentType}|${input.file.uri}|${enteredNumber}`.slice(0, 240);

  const existing = await base44.asServiceRole.entities.IdentityVerification.filter(
    { user_id: input.userId, idempotency_key: idempotencyKey, job_status: { $in: OPEN_STATUSES } },
    { sort: '-created_date', limit: 1 }
  );
  const open = (existing?.items || [])[0];
  if (open) return { record: open, created: false };

  const submittedAt = nowIso();
  const record = await base44.asServiceRole.entities.IdentityVerification.create({
    user_id: input.userId,
    profile_type: input.profileType,
    document_type: input.documentType,
    source: ['camera', 'gallery', 'pdf'].includes(input.source) ? input.source : 'gallery',
    job_id: jobReference(),
    job_status: JOB.UPLOADED,
    status: 'pending',
    decision_source: 'automatic',
    attempts: 0,
    max_attempts: MAX_ATTEMPTS,
    idempotency_key: idempotencyKey,
    file_uri: input.file.uri,
    file_name: String(input.file.name || '').slice(0, 200),
    file_mime: String(input.file.mime || '').slice(0, 100),
    file_size: Number(input.file.size) || 0,
    page_count: Number(input.file.pageCount) || 1,
    expected_number: enteredNumber,
    ...expectedFields(input.expected),
    ...retainedFields(),
    attempted_datetime: submittedAt,
    engine: OCR_ENGINE_VERSION,
    auto_check: null,
    review_reason: '',
    review_history: [{
      datetime: submittedAt,
      action: 'submitted',
      actor_name: 'AMedix verification pipeline',
      actor_role: 'user',
      detail: `${spec.label} received · stored privately · job queued`,
    }],
    document_access_log: [],
  });

  return { record, created: true };
}

/**
 * Atomically takes ownership of a job. Returns null when another worker holds
 * it, the job is closed, or the claim lost a race.
 */
export async function claimJob(base44: any, record: any) {
  if (!record) return null;
  if (isStale(record)) return null;
  if (![JOB.UPLOADED, JOB.FAILED].includes(record.job_status)) return null;
  if ((record.attempts || 0) >= (record.max_attempts || MAX_ATTEMPTS)) return null;

  const token = crypto.randomUUID();
  const startedAt = nowIso();
  await base44.asServiceRole.entities.IdentityVerification.updateMany(
    { id: record.id, job_status: record.job_status },
    { $set: { job_status: JOB.PROCESSING, processing_token: token, job_started_datetime: startedAt, last_error: '' } }
  );

  const fresh: any = await base44.asServiceRole.entities.IdentityVerification
    .get(record.id)
    .catch((e: any) => (e?.status === 404 ? null : Promise.reject(e)));
  if (!fresh || fresh.processing_token !== token) return null;

  await base44.asServiceRole.entities.IdentityVerification.update(fresh.id, {
    attempts: (fresh.attempts || 0) + 1,
    review_history: pushHistory(fresh, {
      action: 'processing_started',
      actor_name: 'AMedix automated document verification',
      actor_role: 'system',
      detail: `attempt ${(fresh.attempts || 0) + 1} of ${fresh.max_attempts || MAX_ATTEMPTS}`,
    }),
  });

  return { ...fresh, attempts: (fresh.attempts || 0) + 1 };
}

async function finish(base44: any, claimed: any, patch: Record<string, any>, historyEntry: any) {
  const current: any = await base44.asServiceRole.entities.IdentityVerification
    .get(claimed.id)
    .catch((e: any) => (e?.status === 404 ? null : Promise.reject(e)));
  // Only the worker that still holds the token may write the decision.
  if (!current || current.processing_token !== claimed.processing_token) return null;

  const updated = await base44.asServiceRole.entities.IdentityVerification.update(claimed.id, {
    ...patch,
    job_completed_datetime: nowIso(),
    review_history: pushHistory(current, historyEntry),
  });
  return updated;
}

async function moveToManualReview(base44: any, claimed: any, code: string, message: string) {
  return finish(base44, claimed, {
    job_status: JOB.MANUAL_REVIEW,
    status: 'pending',
    reason: code,
    review_reason: message,
    last_error: code,
    next_retry_datetime: '',
  }, {
    action: 'manual_review',
    actor_name: 'AMedix automated document verification',
    actor_role: 'system',
    detail: `${code} · document preserved for administrator review`,
  });
}

async function recordFailure(base44: any, claimed: any, code: string) {
  const attempts = claimed.attempts || 1;
  const max = claimed.max_attempts || MAX_ATTEMPTS;
  const exhausted = attempts >= max;
  const message = 'The document was received and is safe, but checking it was interrupted. Nothing needs to be uploaded again.';
  return finish(base44, claimed, {
    job_status: exhausted ? JOB.MANUAL_REVIEW : JOB.FAILED,
    status: 'pending',
    reason: code,
    last_error: code,
    review_reason: exhausted
      ? 'Your document is stored and queued for AMedix review. You will not need to upload it again.'
      : message,
    next_retry_datetime: exhausted ? '' : new Date(Date.now() + 60 * 1000).toISOString(),
  }, {
    action: 'processing_failed',
    actor_name: 'AMedix automated document verification',
    actor_role: 'system',
    detail: `${code} · attempt ${attempts}/${max}${exhausted ? ' · handed to administrator review' : ' · retryable'}`,
  });
}

function unreadableMessage(label: string, qualityIssue: string) {
  return qualityIssue
    ? `We could not read the ${label.toLowerCase()}. ${qualityIssue} It is saved, and an AMedix reviewer will check it.`
    : `We could not read the ${label.toLowerCase()} automatically. Your document is saved and an AMedix reviewer will check it — you do not need to upload it again.`;
}

/**
 * Runs one processing attempt for a claimed job. The document is read from
 * private storage; a failure at any step leaves it untouched.
 */
export async function runJob(base44: any, claimed: any) {
  const documentType = claimed.document_type;
  const profile = NUMBER_PROFILES[documentType];
  const spec = DOCUMENTS[documentType];
  const label = profile?.numberLabel || 'document number';

  let loaded: { bytes: Uint8Array; url: string };
  try {
    loaded = await downloadDocument(base44, claimed.file_uri);
  } catch (err: any) {
    const code = String(err?.message || 'storage_unavailable');
    console.error(`[verification] ${claimed.job_id} document_unavailable ${code}`);
    return recordFailure(base44, claimed, code === 'storage_unavailable' ? 'storage_unavailable' : code);
  }

  const kind: FileKind = sniffFileType(loaded.bytes);
  if (!READABLE_KINDS.includes(kind) && kind !== 'heic') {
    console.error(`[verification] ${claimed.job_id} unsupported_format`);
    return moveToManualReview(
      base44, claimed, 'unsupported_format',
      'This file type could not be processed automatically. Your document is saved and an AMedix reviewer will check it.'
    );
  }
  if (kind === 'heic') {
    return moveToManualReview(
      base44, claimed, 'unsupported_format',
      'This HEIC photo could not be processed automatically. Your document is saved and an AMedix reviewer will check it.'
    );
  }

  const detectedMime = MIME_BY_KIND[kind];
  let sides: Side[] = [];
  let analysis: any = null;
  let pdfFallback: { url: string } | null = null;

  // A large PDF is not turned into pixels here: base64-ing tens of megabytes
  // only to hunt for embedded JPEGs is slow and pointless when the PDF itself
  // can be read natively. Small PDFs still take the cheaper pixel path.
  const tooLargeForPixels = kind === 'pdf' && loaded.bytes.length > 12 * 1024 * 1024;

  try {
    const prepared = tooLargeForPixels
      ? { reason: 'undecodable' as const, sides: [] as Side[], analysis: null }
      : await prepareInMemoryDocument([{ mime: detectedMime, base64: bytesToBase64(loaded.bytes) }]);
    if (prepared.reason === '' && prepared.sides.length) {
      sides = prepared.sides;
      analysis = prepared.analysis;
    } else if (prepared.reason === 'blank') {
      return moveToManualReview(
        base44, claimed, 'blank_page',
        'The page came through empty. Your document is saved and an AMedix reviewer will check it.'
      );
    } else if (kind === 'pdf') {
      // No extractable page pixels (CCITT / JBIG2 / JPX scans). The PDF itself
      // is read instead of declaring the document unopenable.
      pdfFallback = { url: loaded.url };
    } else {
      return moveToManualReview(
        base44, claimed, 'document_unreadable',
        'This image could not be decoded. Your document is saved and an AMedix reviewer will check it.'
      );
    }
  } catch (err: any) {
    if (kind === 'pdf') pdfFallback = { url: loaded.url };
    else return recordFailure(base44, claimed, 'decode_failed');
  }

  const bandHint = analysis && analysis.bands?.length
    ? `Independent pixel analysis of this image found lines of printed text at: ${analysis.bands
      .slice(0, 4)
      .map((b: any) => `y ${Math.round(b.y0 * 100)}%-${Math.round(b.y1 * 100)}%`)
      .join('; ')}. Detected skew ${analysis.skew}°. Check those areas, but do not assume the number is only there.`
    : '';

  let diagnosis;
  try {
    diagnosis = await recogniseDocument(base44, {
      documentType,
      expectedNumber: String(claimed.expected_number || ''),
      sides,
      pdf: pdfFallback,
      bandHint,
    });
  } catch (err: any) {
    console.error(`[verification] ${claimed.job_id} engine_threw ${err?.message || 'unknown'}`);
    return recordFailure(base44, claimed, 'engine_unreachable');
  }

  const quality = analysis?.quality || null;
  const qualityIssue = !quality
    ? ''
    : quality.sharpness < 40
      ? 'The photograph looks blurred.'
      : quality.glare_fraction > 0.08
        ? 'Glare or reflection is covering part of the document.'
        : quality.contrast < 70
          ? 'The lighting is too flat or too dark.'
          : Math.min(quality.pixel_width, quality.pixel_height) < 700
            ? 'The photograph is small.'
            : '';

  const submittedAt = nowIso();

  // ---- nothing answered: a technical failure, never a rejected document ----
  if (diagnosis.technical) {
    console.error(`[verification] ${claimed.job_id} engine_unreachable ${diagnosis.passErrors.join(',')}`);
    return recordFailure(base44, claimed, 'engine_unreachable');
  }

  const autoCheck = scrubAutoCheck({
    outcome: diagnosis.outcome,
    checked_datetime: submittedAt,
    engine: OCR_ENGINE_VERSION,
    number_field: spec.numberField,
    number_label: label,
    entered_number: String(claimed.expected_number || ''),
    read_number: diagnosis.rawReading || '',
    sides_read: sides.map((side) => side.side),
    checks: (PROFILE_DOCUMENTS[claimed.profile_type]?.[documentType] || []).map((key: string) => ({
      field: key,
      label: FIELD_LABELS[key] || key,
      decisive: key === spec.numberField,
      matched: key === spec.numberField && diagnosis.outcome === 'match',
      entered: key === spec.numberField ? String(claimed.expected_number || '') : '',
      read: key === spec.numberField ? diagnosis.rawReading : '',
    })),
    readings: diagnosis.readings.map((r) => ({
      pass: r.pass, engine: r.engine, source: r.source,
      confidence: Math.round(r.confidence), well_formed: r.validFormat,
    })),
    agreement: diagnosis.agreement
      ? { supporters: diagnosis.agreement.supporters, engines: diagnosis.agreement.engines }
      : null,
    note: diagnosis.notes,
  });

  const shared = {
    auto_check: autoCheck,
    engine: OCR_ENGINE_VERSION,
    pages_read: sides.length || (pdfFallback ? 1 : 0),
    detected_format: kind,
    file_mime: detectedMime,
    last_error: '',
    next_retry_datetime: '',
    job_completed_datetime: submittedAt,
  };

  if (diagnosis.outcome === 'match') {
    return finish(base44, claimed, {
      ...shared,
      status: 'verified',
      job_status: JOB.APPROVED,
      verification_outcome: 'match',
      auto_verified: true,
      decision_source: 'automatic',
      reason: '',
      review_reason: '',
      verified_datetime: submittedAt,
    }, {
      action: 'auto_verified',
      actor_name: 'AMedix automated document verification',
      actor_role: 'system',
      detail: `${documentNumberLabel(documentType)} matched · confidence ${diagnosis.confidence.overall}`,
    });
  }

  if (diagnosis.outcome === 'mismatch') {
    return finish(base44, claimed, {
      ...shared,
      status: 'rejected',
      job_status: JOB.REJECTED,
      verification_outcome: 'mismatch',
      auto_verified: false,
      decision_source: 'automatic',
      reason: 'mismatch',
      review_reason: `The ${label.toLowerCase()} printed on the document does not match the number you entered. Correct the number, or submit the correct document.`,
    }, {
      action: 'auto_rejected',
      actor_name: 'AMedix automated document verification',
      actor_role: 'system',
      detail: `mismatch${diagnosis.nearMiss ? ' · near miss' : ''} · confidence ${diagnosis.confidence.overall}`,
    });
  }

  // ---- readable but no agreement: a human decides, the document is kept ----
  return moveToManualReview(
    base44, claimed, 'unreadable',
    unreadableMessage(label, qualityIssue)
  );
}

/**
 * Moves a job abandoned by a dead worker to manual review. Called on every
 * status read, so no job can stay in `processing` indefinitely.
 */
export async function recoverIfStale(base44: any, record: any) {
  if (!isStale(record)) return record;
  const current: any = await base44.asServiceRole.entities.IdentityVerification
    .get(record.id)
    .catch((e: any) => (e?.status === 404 ? null : Promise.reject(e)));
  if (!current || !isStale(current)) return current || record;
  const updated = await base44.asServiceRole.entities.IdentityVerification.update(current.id, {
    job_status: JOB.MANUAL_REVIEW,
    status: 'pending',
    reason: 'processing_interrupted',
    last_error: 'processing_interrupted',
    review_reason: 'Checking this document was interrupted. Your document is saved and queued for AMedix review — you do not need to upload it again.',
    review_history: pushHistory(current, {
      action: 'manual_review',
      actor_name: 'AMedix verification recovery',
      actor_role: 'system',
      detail: 'processing exceeded its window and was recovered',
    }),
  });
  return updated;
}

export function publicJobView(record: any) {
  if (!record) return null;
  const check = record.auto_check || {};
  const resumable = [JOB.UPLOADED, JOB.FAILED, JOB.MANUAL_REVIEW].includes(record.job_status);
  return {
    verification_id: record.id,
    job_id: record.job_id || '',
    profile_type: record.profile_type,
    document_type: record.document_type,
    job_status: record.job_status || (record.status === 'verified' ? JOB.APPROVED : record.status),
    status: record.status,
    decision_source: record.decision_source || 'legacy',
    document_retained: record.document_retained !== false && !!record.file_uri,
    page_count: record.page_count || 0,
    detected_format: record.detected_format || '',
    attempts: record.attempts || 0,
    max_attempts: record.max_attempts || MAX_ATTEMPTS,
    submitted_datetime: record.attempted_datetime || record.created_date || '',
    verified_datetime: record.verified_datetime || '',
    message: record.review_reason || (record.status === 'pending' ? check.note || '' : ''),
    entered_number: check.entered_number || '',
    read_number: check.read_number || '',
    auto_check: record.auto_check || null,
    can_resume: resumable && !!record.file_uri,
    can_retry: resumable && !!record.file_uri,
    can_replace: !resumable || record.job_status === JOB.MANUAL_REVIEW,
    last_error: record.last_error || '',
  };
}

export async function adminDecide(base44: any, record: any, action: 'approve' | 'reject', notes: string, admin: any) {
  const approved = action === 'approve';
  const datetime = nowIso();
  const updated = await base44.asServiceRole.entities.IdentityVerification.update(record.id, {
    status: approved ? 'verified' : 'rejected',
    job_status: approved ? JOB.APPROVED : JOB.REJECTED,
    decision_source: 'administrator',
    auto_verified: false,
    verification_outcome: approved ? record.verification_outcome || 'unreadable' : 'mismatch',
    review_notes: String(notes || '').slice(0, 1000),
    reviewed_by_user_id: admin.id,
    reviewed_by_name: admin.full_name || admin.email || '',
    reviewed_datetime: datetime,
    verified_datetime: approved ? datetime : record.verified_datetime || '',
    review_reason: approved
      ? 'An AMedix reviewer checked this document and approved it.'
      : 'An AMedix reviewer checked this document and could not accept it.',
    review_history: pushHistory(record, {
      action: approved ? 'approved' : 'rejected',
      actor_name: admin.full_name || admin.email || 'AMedix administrator',
      actor_role: 'administrator',
      detail: String(notes || '').slice(0, 400) || (approved ? 'document approved' : 'document rejected'),
    }),
  });
  return updated;
}

export { OPEN_STATUSES, MAX_ATTEMPTS, STALE_MS };