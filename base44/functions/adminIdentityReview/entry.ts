import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Administrative review of submitted identity documents.
//
// Only an AMedix administrator may use this endpoint. Every action is checked
// server-side: a submission is PENDING until an administrator approves or
// rejects it, and the private document can only be opened through a
// short-lived signed link issued here — after the administrator check and with
// the access written into the record's own audit trail.

const DECISION_STATUS = { approve: 'verified', reject: 'rejected' };

const userName = (u) => (u && (u.full_name || u.email)) || '';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'list');

    if (action === 'list') {
      const requested = String(body?.status || 'pending');
      const query = ['pending', 'verified', 'rejected'].includes(requested)
        ? { status: requested }
        : { status: { $in: ['pending', 'rejected', 'failed'] } };

      const page = await base44.asServiceRole.entities.IdentityVerification.filter(query, {
        sort: '-created_date',
        limit: 60,
      });
      const records = Array.isArray(page) ? page : page.items || [];

      const userIds = [...new Set(records.map((r) => r.user_id).filter(Boolean))].slice(0, 60);
      const byId = new Map();
      for (let i = 0; i < userIds.length; i += 20) {
        const batch = await Promise.allSettled(
          userIds.slice(i, i + 20).map((id) => base44.asServiceRole.entities.User.get(id))
        );
        batch.forEach((res) => {
          if (res.status === 'fulfilled' && res.value) byId.set(res.value.id, res.value);
        });
      }

      return Response.json({
        items: records.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          user_name: userName(byId.get(r.user_id)),
          user_email: (byId.get(r.user_id) || {}).email || '',
          profile_type: r.profile_type,
          document_type: r.document_type,
          status: r.status,
          reason: r.reason || '',
          review_reason: r.review_reason || '',
          review_notes: r.review_notes || '',
          reviewed_by_name: r.reviewed_by_name || '',
          reviewed_datetime: r.reviewed_datetime || '',
          submitted_datetime: r.attempted_datetime || r.created_date || '',
          auto_check: r.auto_check || null,
          file_name: r.file_name || '',
          page_count: r.page_count || 0,
          source: r.source || '',
          has_back: !!r.file_uri_back,
          review_history: r.review_history || [],
        })),
      });
    }

    if (action === 'document') {
      const id = String(body?.id || '');
      if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
      const record = await base44.asServiceRole.entities.IdentityVerification.get(id)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!record) return Response.json({ error: 'Not found' }, { status: 404 });

      const uri = body?.side === 'back' ? record.file_uri_back : record.file_uri;
      if (!uri) return Response.json({ error: 'No document for that side' }, { status: 400 });

      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 300 });

      const now = new Date().toISOString();
      const history = Array.isArray(record.review_history) ? record.review_history : [];
      const accessLog = Array.isArray(record.document_access_log) ? record.document_access_log : [];
      await base44.asServiceRole.entities.IdentityVerification.update(id, {
        review_history: [
          ...history,
          { datetime: now, action: 'document_viewed', actor_name: userName(user), actor_role: 'admin', detail: `Document opened (${body?.side === 'back' ? 'back' : 'front'})` },
        ],
        document_access_log: [
          ...accessLog.slice(-40),
          { datetime: now, actor_user_id: user.id, actor_name: userName(user), side: body?.side === 'back' ? 'back' : 'front' },
        ],
      });

      return Response.json({ signed_url: signed.signed_url, file_name: record.file_name || '', expires_in: 300 });
    }

    if (action === 'decide') {
      const id = String(body?.id || '');
      const decision = String(body?.decision || '');
      const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
      const nextStatus = DECISION_STATUS[decision];
      if (!id || !nextStatus) return Response.json({ error: 'Invalid decision' }, { status: 400 });
      if (decision === 'reject' && reason.length < 5) {
        return Response.json({ error: 'A reason is required when rejecting a document' }, { status: 400 });
      }

      const record = await base44.asServiceRole.entities.IdentityVerification.get(id)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!record) return Response.json({ error: 'Not found' }, { status: 404 });
      if (record.status === 'verified' && decision === 'approve') {
        return Response.json({ status: record.status, already_decided: true });
      }

      const now = new Date().toISOString();
      const history = Array.isArray(record.review_history) ? record.review_history : [];
      await base44.asServiceRole.entities.IdentityVerification.update(id, {
        status: nextStatus,
        review_reason: decision === 'reject' ? reason : '',
        review_notes: typeof body?.notes === 'string' ? body.notes.slice(0, 1000) : record.review_notes || '',
        reviewed_by_user_id: user.id,
        reviewed_by_name: userName(user),
        reviewed_datetime: now,
        verified_datetime: decision === 'approve' ? now : '',
        review_history: [
          ...history,
          {
            datetime: now,
            action: decision === 'approve' ? 'approved' : 'rejected',
            actor_name: userName(user),
            actor_role: 'admin',
            detail: decision === 'reject' ? reason : 'Document approved',
          },
        ],
      });

      return Response.json({ status: nextStatus, reviewed_datetime: now });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}