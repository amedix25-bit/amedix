import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { publicJobView, recoverIfStale, OPEN_STATUSES } from '../../shared/verificationPipeline.ts';

// Step 3 of identity verification — status.
//
// Used to poll a running job and, more importantly, to resume one from a new
// session: a document that was saved stays a job, so returning later never
// means uploading it again. Every read also repairs a job whose worker died.
export default async function (req: any) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) || {};
    const verificationId = typeof body.verification_id === 'string' ? body.verification_id : '';

    if (verificationId) {
      const record: any = await base44.asServiceRole.entities.IdentityVerification
        .get(verificationId)
        .catch((e: any) => (e?.status === 404 ? null : Promise.reject(e)));
      if (!record) return Response.json({ error: 'Verification not found' }, { status: 404 });
      if (record.user_id !== user.id && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const recovered = await recoverIfStale(base44, record);
      return Response.json({ job: publicJobView(recovered || record) });
    }

    const query: Record<string, any> = { user_id: user.id };
    if (typeof body.document_type === 'string' && body.document_type) query.document_type = body.document_type;
    if (body.profile_type === 'patient' || body.profile_type === 'doctor') query.profile_type = body.profile_type;

    const page = await base44.asServiceRole.entities.IdentityVerification.filter(query, { sort: '-created_date', limit: 10 });
    const rows = page?.items || [];
    const repaired = [];
    for (const row of rows) {
      repaired.push(await recoverIfStale(base44, row));
    }

    const open = repaired.find((row: any) => row && OPEN_STATUSES.includes(row.job_status));
    const latest = repaired.find(Boolean) || null;
    return Response.json({
      job: publicJobView(open || latest),
      open_job: !!open,
      jobs: repaired.filter(Boolean).map(publicJobView),
    });
  } catch (error: any) {
    console.error(`[verification] status failed: ${error?.message || 'unknown'}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}