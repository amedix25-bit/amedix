import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createJob, claimJob, runJob, publicJobView } from '../../shared/verificationPipeline.ts';
import { DOCUMENTS, PROFILE_DOCUMENTS, documentNumberLabel } from '../../shared/documentNumberVerification.ts';
import { MAX_DOCUMENT_BYTES } from '../../shared/documentFileTypes.ts';

// Legacy entry point, kept so an already-open tab cannot break mid-registration.
//
// It no longer accepts the document inside the request: the document must be in
// private storage first, which is what makes a failed check recoverable. It
// creates the job, runs one attempt and answers in the old shape.
export default async function (req: any) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) || {};
    const { profile_type, document_type, expected = {}, file_uri, source } = body;

    if (Array.isArray(body.pages) && !file_uri) {
      return Response.json({
        error: 'This form is out of date. Reload the page and submit the document again — your document will then be saved before it is checked.',
        needs_upload: true,
      }, { status: 409 });
    }
    if (!DOCUMENTS[document_type] || !PROFILE_DOCUMENTS[profile_type]?.[document_type]) {
      return Response.json({ error: 'Invalid verification method' }, { status: 400 });
    }
    if (typeof file_uri !== 'string' || !file_uri || file_uri.length > 500) {
      return Response.json({ error: 'The document was not uploaded. Choose the document again.' }, { status: 400 });
    }
    for (const key of PROFILE_DOCUMENTS[profile_type][document_type]) {
      const value = expected?.[key];
      const max = key === 'full_name' ? 200 : 100;
      if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
        return Response.json({ error: 'Missing required information' }, { status: 400 });
      }
    }

    const { record } = await createJob(base44, {
      userId: user.id,
      profileType: profile_type,
      documentType: document_type,
      expected,
      file: { uri: file_uri, size: Number(body.file_size) || 0 },
      source,
    });
    if (Number(body.file_size) > MAX_DOCUMENT_BYTES) {
      return Response.json({ error: 'This document is larger than 30 MB.' }, { status: 413 });
    }

    const claimed = await claimJob(base44, record);
    const finished = claimed ? await runJob(base44, claimed) : record;
    const view = publicJobView(finished || record);

    return Response.json({
      status: view.status,
      outcome: view.auto_check?.outcome || '',
      verification_id: view.verification_id,
      job_id: view.job_id,
      job_status: view.job_status,
      submitted_datetime: view.submitted_datetime,
      document_retained: view.document_retained,
      document_stored: view.document_retained,
      document_type,
      number_label: documentNumberLabel(document_type),
      entered_number: view.entered_number,
      read_number: view.read_number,
      checks: view.auto_check?.checks || [],
      message: view.message,
      auto_check: view.auto_check,
    });
  } catch (error: any) {
    console.error(`[verification] legacy entry failed: ${error?.message || 'unknown'}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}