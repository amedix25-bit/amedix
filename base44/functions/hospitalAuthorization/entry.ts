import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  MAX_ATTEMPTS,
  LOCK_MINUTES,
  auditEntry,
  codeState,
  hashAuthorizationCode,
  isActivated,
  isLocked,
  loadAuthorization,
  normalizeCode,
  notifyAdministration,
  publicAuthorization,
  withAudit,
} from "../../shared/hospitalAuthorization.ts";

// Hospital side of administrative authorization.
//   action: "status"   — the hospital's own approval / activation state (never the code hash)
//   action: "activate" — validates the issued authorization code server-side and, only on
//                        success, unlocks Hospital Code creation for this institution.
// The authorization record is service-role only on write, so this function is the one
// path that can ever move a hospital from pending to activated.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status');

    const profiles = await base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: 'Hospital profile not found.' }, { status: 403 });
    }
    const profile = profiles[0];
    const auth = await loadAuthorization(base44, profile.id);

    if (action === 'status') {
      return Response.json({
        hospital_name: profile.hospital_name,
        profile_status: profile.status || '',
        hospital_code: profile.hospital_code || '',
        is_activated: isActivated(auth),
        authorization: publicAuthorization(auth),
      });
    }

    if (action !== 'activate') {
      return Response.json({ error: 'Unknown action.' }, { status: 400 });
    }

    if (!auth) {
      return Response.json({ error: 'No authorization request was found for this hospital.' }, { status: 404 });
    }
    if (isActivated(auth)) {
      return Response.json({
        activated: true,
        already_activated: true,
        authorization: publicAuthorization(auth),
      });
    }

    const now = Date.now();
    const actor = { user_id: user.id, name: user.full_name || profile.hospital_name, role: 'hospital' };

    if (auth.status === 'rejected') {
      return Response.json(
        { error: auth.rejection_reason ? `This registration was not approved: ${auth.rejection_reason}` : 'This registration was not approved by AMedix administration.' },
        { status: 403 }
      );
    }
    if (auth.status !== 'approved') {
      return Response.json(
        { error: 'This hospital is still pending administrative approval. An authorization code cannot be used before approval.' },
        { status: 403 }
      );
    }

    const state = codeState(auth);
    if (state === 'none') {
      return Response.json({ error: 'No authorization code has been issued yet. AMedix administration issues it after approval.' }, { status: 409 });
    }
    if (state === 'revoked') {
      return Response.json({ error: 'This authorization code was revoked. Please contact AMedix administration for a new code.' }, { status: 403 });
    }
    if (state === 'expired') {
      return Response.json({ error: 'This authorization code has expired. Please contact AMedix administration to have a new one issued.' }, { status: 410 });
    }
    if (isLocked(auth)) {
      const minutes = Math.max(1, Math.ceil((new Date(auth.locked_until).getTime() - now) / 60000));
      return Response.json(
        { error: `Too many incorrect attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`, locked_until: auth.locked_until },
        { status: 429 }
      );
    }

    const submitted = normalizeCode(body.code);
    if (!submitted) {
      return Response.json({ error: 'Please enter your AMedix authorization code.' }, { status: 400 });
    }

    const provided = await hashAuthorizationCode(submitted, auth.authorization_code_salt || '');
    if (provided !== auth.authorization_code_hash) {
      const attempts = (auth.failed_attempts || 0) + 1;
      const lock = attempts >= MAX_ATTEMPTS;
      const lockedUntil = lock ? new Date(now + LOCK_MINUTES * 60000).toISOString() : '';
      const failed = await base44.asServiceRole.entities.HospitalAuthorization.update(auth.id, {
        failed_attempts: lock ? 0 : attempts,
        locked_until: lockedUntil,
        last_attempt_datetime: new Date(now).toISOString(),
        audit: withAudit(auth, {
          ...auditEntry({
            action: lock ? 'activation_locked' : 'activation_failed',
            actionLabel: lock ? 'Activation locked after repeated incorrect codes' : 'Incorrect authorization code entered',
            actor,
            detail: `Attempt ${attempts} of ${MAX_ATTEMPTS}`,
          }),
        }),
      });
      return Response.json(
        {
          error: lock
            ? `Too many incorrect attempts. Activation is locked for ${LOCK_MINUTES} minutes.`
            : `Incorrect authorization code. ${Math.max(0, MAX_ATTEMPTS - attempts)} attempt${MAX_ATTEMPTS - attempts === 1 ? '' : 's'} remaining.`,
          attempts_remaining: lock ? 0 : Math.max(0, MAX_ATTEMPTS - attempts),
          authorization: publicAuthorization(failed),
        },
        { status: 401 }
      );
    }

    const stamp = new Date(now).toISOString();
    const activated = await base44.asServiceRole.entities.HospitalAuthorization.update(auth.id, {
      code_status: 'used',
      code_used_datetime: stamp,
      activated_datetime: stamp,
      failed_attempts: 0,
      locked_until: '',
      last_attempt_datetime: stamp,
      code_history: [
        ...(auth.code_history || []),
        { action: 'used', preview: auth.authorization_code_preview || '', datetime: stamp, by_name: user.full_name || profile.hospital_name, note: 'Authorization code activated by the hospital' },
      ],
      audit: withAudit(
        auth,
        auditEntry({
          action: 'activated',
          actionLabel: 'Institution activated with its authorization code',
          actor,
          detail: `Code ${auth.authorization_code_preview || ''} consumed — single use`,
        })
      ),
    });

    await base44.asServiceRole.entities.HospitalProfile.update(profile.id, { status: 'active' });

    await notifyAdministration(base44, {
      subject: `Hospital activated — ${profile.hospital_name}`,
      body: `<p><strong>${profile.hospital_name}</strong> activated its authorization code and may now generate its AMedix Hospital Code.</p>
        <p><strong>Reference:</strong> ${auth.request_reference || '—'}<br/><strong>Activated:</strong> ${stamp}<br/><strong>Code:</strong> ${auth.authorization_code_preview || '—'}</p>`,
    });

    return Response.json({ activated: true, authorization: publicAuthorization(activated) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}