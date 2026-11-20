import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createJob, publicJobView } from '../../shared/verificationPipeline.ts';
import { DOCUMENTS, PROFILE_DOCUMENTS } from '../../shared/documentNumberVerification.ts';
import { MAX_DOCUMENT_BYTES } from '../../shared/documentFileTypes.ts';

// Step 1 of identity verification.
//
// The document has ALREADY been uploaded to private storage by the browser
// (UploadPrivateFile), so this call only records the job and returns at once.
// It never carries the document and never waits for recognition: the user gets
// a durable job reference immediately, and processing happens in its own
// request that can be retried without the document being uploaded again.
export default async function (req: any) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) || {};
    const { profile_type, document_type, expected = {}, file = {}, source } = body;

    if (profile_type !== 'patient' && profile_type !== 'doctor') {
      return Response.json({ error: 'Invalid profile type' }, { status: 400 });
    }
    if (!DOCUMENTS[document_type] || !PROFILE_DOCUMENTS[profile_type]?.[document_type]) {
      return Response.json({ error: 'Invalid verification method' }, { status: 400 });
    }
    for (const key of PROFILE_DOCUMENTS[profile_type][document_type]) {
      const value = expected?.[key];
      const max = key === 'full_name' ? 200 : 100;
      if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
        return Response.json({ error: 'Missing required information' }, { status: 400 });
      }
    }

    const uri = typeof file?.uri === 'string' ? file.uri.trim() : '';
    if (!uri || uri.length > 500) {
      return Response.json({ error: 'The document was not uploaded. Choose the document again.' }, { status: 400 });
    }
    const size = Number(file?.size) || 0;
    if (size > MAX_DOCUMENT_BYTES) {
      return Response.json({ error: 'This document is larger than 30 MB.' }, { status: 413 });
    }

    const { record, created } = await createJob(base44, {
      userId: user.id,
      profileType: profile_type,
      documentType: document_type,
      expected,
      file: {
        uri,
        name: file.name,
        mime: file.mime,
        size,
        pageCount: file.page_count,
      },
      source,
    });

    const view = publicJobView(record);
    return Response.json({
      ...view,
      created,
      message: created
        ? 'Your document is saved. Checking it now.'
        : 'This document is already saved on an open check — continuing that one.',
    });
  } catch (error: any) {
    console.error(`[verification] submit failed: ${error?.message || 'unknown'}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}