import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  claimJob, runJob, recoverIfStale, publicJobView, isStale, JOB,
} from '../../shared/verificationPipeline.ts';
import { DOCUMENTS } from '../../shared/documentNumberVerification.ts';
import { maskDocumentNumber } from '../../shared/documentRetention.ts';

// Step 2 of identity verification — the worker.
//
// Reads the stored document, runs the recognisers within one bounded budget and
// records the decision. It can be called again at any time for the same job
// (a retry, a resumed session, a recovery after a dead worker) without the
// document being uploaded again. It also accepts a corrected number for a
// document whose number did not match, so a typo never costs a re-upload.
const MASKED_EXPECTED_FIELDS = ['national_id_number', 'license_number', 'personal_card_number', 'passport_number'];

export default async function (req: any) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) || {};
    const verificationId = typeof body.verification_id === 'string' ? body.verification_id : '';
    if (!verificationId) return Response.json({ error: 'verification_id is required' }, { status: 400 });

    let record: any = await base44.asServiceRole.entities.IdentityVerification
      .get(verificationId)
      .catch((e: any) => (e?.status === 404 ? null : Promise.reject(e)));
    if (!record) return Response.json({ error: 'Verification not found' }, { status: 404 });
    if (record.user_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!record.file_uri) {
      return Response.json({
        error: 'This verification has no stored document. Submit the document again.',
        needs_upload: true,
      }, { status: 409 });
    }

    // A corrected number re-opens the same stored document — never a new upload.
    const corrected = typeof body.expected_number === 'string' ? body.expected_number.trim() : '';
    if (corrected) {
      if (corrected.length > 100) return Response.json({ error: 'Invalid number' }, { status: 400 });
      const numberField = DOCUMENTS[record.document_type]?.numberField;
      const patch: Record<string, any> = {
        expected_number: corrected,
        status: 'pending',
        job_status: JOB.UPLOADED,
        reason: '',
        review_reason: '',
        last_error: '',
        next_retry_datetime: '',
        attempts: 0,
        review_history: [
          ...(Array.isArray(record.review_history) ? record.review_history.slice(-60) : []),
          {
            datetime: new Date().toISOString(),
            action: 'number_corrected',
            actor_name: user.full_name || user.email || '',
            actor_role: 'user',
            detail: 'entered number corrected · stored document re-checked without a new upload',
          },
        ],
      };
      if (numberField && MASKED_EXPECTED_FIELDS.includes(numberField)) {
        patch[`expected_${numberField}`] = maskDocumentNumber(corrected);
      }
      record = await base44.asServiceRole.entities.IdentityVerification.update(record.id, patch);
    }

    const recovered = await recoverIfStale(base44, record);
    if (recovered?.job_status === JOB.PROCESSING && !isStale(recovered)) {
      return Response.json({ ...publicJobView(recovered), busy: true, message: 'This document is already being checked.' });
    }
    if (recovered && ![JOB.UPLOADED, JOB.FAILED].includes(recovered.job_status)) {
      return Response.json({ ...publicJobView(recovered), busy: false });
    }

    const claimed = await claimJob(base44, recovered || record);
    if (!claimed) {
      const current: any = await base44.asServiceRole.entities.IdentityVerification
        .get(verificationId)
        .catch((e: any) => (e?.status === 404 ? null : Promise.reject(e)));
      return Response.json({ ...publicJobView(current), busy: false });
    }

    const finished = await runJob(base44, claimed);
    return Response.json({ ...publicJobView(finished || claimed), busy: false });
  } catch (error: any) {
    console.error(`[verification] process failed: ${error?.message || 'unknown'}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}