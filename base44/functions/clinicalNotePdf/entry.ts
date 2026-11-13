import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Stored clinical note documents.
//
// Every clinical note keeps its own official AMedix document. The document is
// rendered from the saved note (the same sheet as the laboratory and imaging
// request forms) and stored privately; this function is the only way in or out.
//
// Actions:
//   count   admin — how many notes exist, how many already have their document
//   pending admin — the next page of notes still without a stored document
//   attach  admin — records the uploaded document against its note
//   link    the note's own doctor or an admin — short-lived signed link to it
const BATCH = 20;

const pageItems = (result) => (Array.isArray(result) ? result : result?.items || []);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const isAdmin = user.role === 'admin';

    if (action === 'count') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const [notes, documents] = await Promise.all([
        base44.asServiceRole.entities.ClinicalNote.count(),
        base44.asServiceRole.entities.ClinicalNotePdf.count(),
      ]);
      return Response.json({ notes, saved: documents, remaining: Math.max(0, notes - documents) });
    }

    if (action === 'pending') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const cursor = typeof body.cursor === 'string' && body.cursor ? body.cursor : undefined;
      const page = await base44.asServiceRole.entities.ClinicalNote.filter(
        {},
        cursor ? { sort: '-created_date', limit: BATCH, cursor } : { sort: '-created_date', limit: BATCH }
      );
      const notes = pageItems(page);
      const ids = notes.map((n) => n.id);
      const stored = ids.length
        ? pageItems(await base44.asServiceRole.entities.ClinicalNotePdf.filter({ note_id: { $in: ids } }, { limit: BATCH * 2 }))
        : [];
      const done = new Set(stored.map((d) => d.note_id));
      const items = notes.filter((n) => !done.has(n.id));
      const next = Array.isArray(page) ? null : page?.next_cursor;
      const more = Array.isArray(page) ? false : Boolean(page?.has_more);
      return Response.json({ notes: items, next_cursor: next, has_more: more });
    }

    if (action === 'attach') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const noteId = String(body.note_id || '');
      const fileUri = String(body.file_uri || '');
      const fileName = String(body.file_name || '');
      if (!noteId || !fileUri) return Response.json({ error: 'note_id and file_uri are required' }, { status: 400 });

      const note = await base44.asServiceRole.entities.ClinicalNote.get(noteId).catch((e) =>
        e.status === 404 ? null : Promise.reject(e)
      );
      if (!note) return Response.json({ error: 'Note not found' }, { status: 404 });

      const existing = pageItems(await base44.asServiceRole.entities.ClinicalNotePdf.filter({ note_id: noteId }, { limit: 1 }));
      if (existing.length) return Response.json({ ok: true, skipped: true });

      await base44.asServiceRole.entities.ClinicalNotePdf.create({
        note_id: noteId,
        note_reference: note.note_reference || '',
        note_date: note.date || '',
        patient_id: note.patient_id || '',
        patient_name: note.patient_name || '',
        patient_cin: note.patient_cin || '',
        doctor_id: note.doctor_id || '',
        doctor_user_id: note.created_by_id || '',
        doctor_name: note.signed_by_name || note.doctor_name || '',
        pdf_file_uri: fileUri,
        pdf_file_name: fileName,
        pdf_generated_datetime: new Date().toISOString(),
      });
      return Response.json({ ok: true });
    }

    if (action === 'link') {
      const noteId = String(body.note_id || '');
      if (!noteId) return Response.json({ error: 'note_id is required' }, { status: 400 });

      // Read through the caller's own scope, so only a doctor who may read the
      // note (theirs) — or an administrator — can reach its document.
      const note = await base44.entities.ClinicalNote.get(noteId).catch((e) =>
        e.status === 404 ? null : Promise.reject(e)
      );
      if (!note) return Response.json({ url: null });

      const stored = pageItems(await base44.asServiceRole.entities.ClinicalNotePdf.filter({ note_id: noteId }, { limit: 1 }));
      if (!stored.length) return Response.json({ url: null });

      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: stored[0].pdf_file_uri,
        expires_in: 600,
      });
      return Response.json({ url: signed.signed_url || signed.url || null, file_name: stored[0].pdf_file_name || '' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}