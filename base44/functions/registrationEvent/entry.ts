import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { fingerprint, normalizeEmail } from '../../shared/registrationShared.ts';

// Records one step of the registration funnel for the PLATFORM email code
// (sign-up confirmation and its resends), which the app cannot observe from the
// server. The browser reports it, so the kinds are a fixed allow-list and the
// address is fingerprinted server-side — the log can count delivery per
// destination without ever holding the address.
//
// With code_requested → code_verified and no code_resent in between, the
// first-attempt delivery rate is measurable directly.

const ALLOWED = new Set(['code_requested', 'code_resent', 'code_verified', 'code_rejected']);
const PER_EMAIL_PER_HOUR = 40;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = (await req.json().catch(() => ({}))) || {};
    const kind = String(body?.kind || '');
    if (!ALLOWED.has(kind)) return Response.json({ ok: false }, { status: 400 });

    const email = normalizeEmail(body?.email);
    if (!email) return Response.json({ ok: false }, { status: 400 });

    const store = base44.asServiceRole.entities.RegistrationEvent;
    const hash = await fingerprint(email);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await store.count({ kind, destination_hash: hash, created_date: { $gte: hourAgo } });
    if (recent >= PER_EMAIL_PER_HOUR) return Response.json({ ok: false, limited: true });

    // Only a short machine label is accepted — never free text.
    const detail = String(body?.detail || '').replace(/[^\w:.-]/g, '').slice(0, 40);

    await store.create({
      kind,
      channel: 'email',
      purpose: 'signup',
      destination_hash: hash,
      detail,
      datetime: new Date().toISOString(),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false });
  }
}