import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { clean, objectOr, rows } from '../../shared/registrationShared.ts';

// Server-side progress of a patient registration. The onboarding form saves
// here as the patient moves through the steps, and reads it back on return, so
// closing the browser, losing the connection, switching device or coming back
// days later never costs the answers already given.
//
// Everything is keyed on the signed-in account: a draft can only be read or
// written by the account that owns it, and the identity document reference is
// validated against that account before it is stored.

const MAX_PAYLOAD_CHARS = 250000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const service = base44.asServiceRole;
    const store = service.entities.PatientRegistrationDraft;
    const body = (await req.json().catch(() => ({}))) || {};
    const action = String(body.action || 'resume');

    const existing = rows(await store.filter({ user_id: user.id }))[0] || null;

    if (action === 'resume') {
      if (!existing) return Response.json({ state: 'none', step: 0, saved: null });
      return Response.json({
        state: existing.status || 'incomplete',
        step: Number.isInteger(existing.step) ? existing.step : 0,
        saved: {
          form: objectOr(existing.form),
          medical: objectOr(existing.medical),
          lifestyle: objectOr(existing.lifestyle),
          gynae: objectOr(existing.gynae),
          allergy_record: clean(existing.allergy_record, 40),
          none_flags: objectOr(existing.none_flags),
          photo_uri: clean(existing.photo_uri, 500),
          identity_verification_id: clean(existing.identity_verification_id, 100),
          last_saved_datetime: existing.last_saved_datetime || '',
        },
      });
    }

    if (action === 'complete') {
      if (existing) {
        await store.update(existing.id, {
          status: 'completed',
          last_saved_datetime: new Date().toISOString(),
        });
      }
      await service.entities.RegistrationEvent
        .create({ kind: 'registration_completed', datetime: new Date().toISOString() })
        .catch(() => null);
      return Response.json({ ok: true });
    }

    if (action !== 'save') return Response.json({ error: 'Unknown action.' }, { status: 400 });

    // A closed registration is never reopened by a late autosave.
    if (existing && existing.status === 'completed') {
      return Response.json({ ok: true, state: 'completed' });
    }

    const step = Number.isInteger(body.step) ? Math.min(Math.max(body.step, 0), 3) : 0;
    const form = objectOr(body.form);
    const medical = objectOr(body.medical);
    const lifestyle = objectOr(body.lifestyle);
    const gynae = objectOr(body.gynae);
    const noneFlags = objectOr(body.none_flags);
    const allergyRecord = clean(body.allergy_record, 40);
    const photoUri = clean(body.photo_uri, 500);

    // An identity document is only accepted when it belongs to this account.
    let verificationId = '';
    const submittedId = clean(body.identity_verification_id, 100);
    if (submittedId) {
      const record = await service.entities.IdentityVerification.get(submittedId).catch(() => null);
      if (record && record.user_id === user.id) verificationId = record.id;
    }

    const payload = { step, form, medical, lifestyle, gynae, allergy_record: allergyRecord, none_flags: noneFlags };
    if (JSON.stringify(payload).length > MAX_PAYLOAD_CHARS) {
      return Response.json(
        { error: 'This registration is too large to save. Please review the entries you added.' },
        { status: 413 }
      );
    }

    const data = {
      user_id: user.id,
      email: clean(user.email, 254).toLowerCase(),
      status: 'incomplete',
      step,
      form,
      medical,
      lifestyle,
      gynae,
      allergy_record: allergyRecord,
      none_flags: noneFlags,
      photo_uri: photoUri,
      identity_verification_id: verificationId,
      last_saved_datetime: new Date().toISOString(),
    };

    const saved = existing ? await store.update(existing.id, data) : await store.create(data);
    return Response.json({ ok: true, draft_id: saved.id, step, state: 'incomplete' });
  } catch (error) {
    // A failed save must never interrupt the form; the browser retries.
    return Response.json({ error: 'Progress could not be saved right now.' }, { status: 500 });
  }
}