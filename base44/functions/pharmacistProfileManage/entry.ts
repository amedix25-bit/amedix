import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  verifyPharmacistSession, touchPharmacistActivity, pharmacistUnauthorized,
  hashPassword, randomSalt,
} from "../../shared/pharmacyStaffAuth.ts";

// The pharmacist's own profile settings:
//   prefs → the pharmacist's notification preferences (their own choices)
//   change_password → requires the current password; the new password is
//     salted and hashed before it is stored. Sensitive account details and
//     permissions stay with the pharmacy administrator.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const pharmacist = await verifyPharmacistSession(base44, body?.pharmacist_id, body?.pharmacist_session_token);
    if (!pharmacist) return pharmacistUnauthorized();
    const action = String(body?.action || '');

    if (action === 'prefs') {
      const prefs = body?.prefs && typeof body.prefs === 'object' ? body.prefs : null;
      if (!prefs) return Response.json({ error: 'Notification preferences are required.' }, { status: 400 });
      const clean = {};
      for (const key of ['prescriptions', 'inventory', 'recalls', 'expiry']) {
        clean[key] = !!prefs[key];
      }
      await base44.asServiceRole.entities.Pharmacist.update(pharmacist.id, { notification_prefs: clean });
      return Response.json({ ok: true, notification_prefs: clean });
    }

    if (action === 'change_password') {
      const current = String(body?.current_password || '');
      const next = String(body?.new_password || '');
      if (next.length < 6) {
        return Response.json({ error: 'The new password must be at least 6 characters.' }, { status: 400 });
      }
      const currentHash = await hashPassword(current, pharmacist.salt);
      if (currentHash !== pharmacist.password_hash) {
        return Response.json({ error: 'The current password is incorrect.' }, { status: 400 });
      }
      const salt = randomSalt();
      const hash = await hashPassword(next, salt);
      await base44.asServiceRole.entities.Pharmacist.update(pharmacist.id, { password_hash: hash, salt });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}