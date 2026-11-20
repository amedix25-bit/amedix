import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  adminDecide, signedDocumentUrl, publicJobView, recoverIfStale, JOB,
} from '../../shared/verificationPipeline.ts';

// Manual review of identity documents — administrators only.
//
// Everything the automated engine could not decide lands here with its document
// intact. The document is opened through a short-lived signed link minted on the
// server for this call, and every opening is written to the record's own access
// log, so a reviewer's look at a passport is itself auditable.
export default async function (req: any) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = (await req.json().catch(() => ({}))) || {};
    const action = String(body.action || 'list');

    if (action === 'list') {
      const wanted = Array.isArray(body.statuses) && body.statuses.length
        ? body.statuses
        : [JOB.MANUAL_REVIEW, JOB.FAILED, JOB.PENDING_APPROVAL];
      const page = await base44.asServiceRole.entities.IdentityVerification.filter(
        { job_status: { $in: wanted } },
        { sort: '-created_date', limit: 50 }
      );
      const rows = (page?.items || []).map((row: any) => recoverIfStale(base44, row));
      const resolved = (await Promise.all(rows)).filter(Boolean);

      const userIds = [...new Set(resolved.map((row: any) => row.user_id).filter(Boolean))];
      let names: Record<string, string> = {};
      if (userIds.length) {
        try {
          const users = await base44.asServiceRole.entities.User.filter({ id: { $in: userIds } });
          names = Object.fromEntries((users || []).map((u: any) => [u.id, u.full_name || u.email || '']));
        } catch {
          names = {};
        }
      }

      return Response.json({
        items: resolved.map((row: any) => ({
          ...publicJobView(row),
          user_name: names[row.user_id] || '',
          review_notes: row.review_notes || '',
          reviewed_by_name: row.reviewed_by_name || '',
          last_error: row.last_error || '',
          reason: row.reason || '',
        })),
        counts: {
          manual_review: resolved.filter((r: any) => r.job_status === JOB.MANUAL_REVIEW).length,
          processing_failed: resolved.filter((r: any) => r.job_status === JOB.FAILED).length,
          pending_approval: resolved.filter((r: any) => r.job_status === JOB.PENDING_APPROVAL).length,
        },
      });
    }

    const verificationId = typeof body.verification_id === 'string' ? body.verification_id : '';
    if (!verificationId) return Response.json({ error: 'verification_id is required' }, { status: 400 });
    const record: any = await base44.asServiceRole.entities.IdentityVerification
      .get(verificationId)
      .catch((e: any) => (e?.status === 404 ? null : Promise.reject(e)));
    if (!record) return Response.json({ error: 'Verification not found' }, { status: 404 });

    if (action === 'document') {
      if (!record.file_uri) {
        return Response.json({ error: 'No document is stored for this verification.' }, { status: 409 });
      }
      const url = await signedDocumentUrl(base44, record.file_uri, 600);
      if (!url) return Response.json({ error: 'The document could not be opened right now.' }, { status: 502 });

      const log = Array.isArray(record.document_access_log) ? record.document_access_log.slice(-50) : [];
      log.push({
        datetime: new Date().toISOString(),
        actor_user_id: user.id,
        actor_name: user.full_name || user.email || '',
        actor_role: 'administrator',
        side: 'document',
      });
      await base44.asServiceRole.entities.IdentityVerification.update(record.id, {
        document_access_log: log,
        review_history: [
          ...(Array.isArray(record.review_history) ? record.review_history.slice(-60) : []),
          {
            datetime: new Date().toISOString(),
            action: 'document_viewed',
            actor_name: user.full_name || user.email || '',
            actor_role: 'administrator',
            detail: 'document opened for manual review',
          },
        ],
      });
      return Response.json({ signed_url: url, file_name: record.file_name || '', mime: record.file_mime || '' });
    }

    if (action === 'decide') {
      if (body.decision !== 'approve' && body.decision !== 'reject') {
        return Response.json({ error: 'decision must be approve or reject' }, { status: 400 });
      }
      const updated = await adminDecide(base44, record, body.decision, String(body.notes || ''), user);
      return Response.json({ job: publicJobView(updated) });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error(`[verification] admin review failed: ${error?.message || 'unknown'}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}