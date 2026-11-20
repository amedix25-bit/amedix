import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { fingerprint, normalizeEmail, rows } from '../../shared/registrationShared.ts';

// Answers one question for the registration page: which state is this email in?
// The answer is a coarse state code and nothing else — no name, no role, no CIN,
// no saved answers — so the page can offer the right way forward without ever
// turning "email already exists" into a dead end.
//
//   new                  no account for this email
//   unverified           the account exists but the email was never confirmed
//   incomplete           confirmed, but the registration was never finished
//   pending_verification submitted and awaiting identity / administrative review
//   active               the account is usable — sign in
//   rejected             reviewed and not approved
//   blocked              the account is disabled
//   rate_limited         too many lookups from this address or overall
//
// The lookup is bounded per email and overall, and every call is recorded in
// RegistrationEvent, so the endpoint cannot be used to enumerate accounts at
// will.

const PER_EMAIL_PER_HOUR = 10;
const GLOBAL_PER_HOUR = 3000;

// Addresses are normally stored lowercase, but a record written before that was
// guaranteed may keep the case it was typed in. The exact match is tried first
// and a case-insensitive match only as a fallback, so a mixed-case address is
// never reported as a brand-new registration.
async function findUserByEmail(service, email) {
  const exact = rows(await service.entities.User.filter({ email }));
  if (exact.length > 0) return exact[0];
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const loose = rows(
    await service.entities.User.filter({ email: { $regex: `^${escaped}$`, $options: 'i' } })
  );
  return loose[0] || null;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = (await req.json().catch(() => ({}))) || {};
    const email = normalizeEmail(body?.email);
    // An address that cannot be valid is simply a new registration: nothing
    // about any stored account is revealed by a malformed address.
    if (!email) return Response.json({ state: 'new' });

    const service = base44.asServiceRole;
    const events = service.entities.RegistrationEvent;
    const hash = await fingerprint(email);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [forEmail, overall] = await Promise.all([
      events.count({ kind: 'state_lookup', destination_hash: hash, created_date: { $gte: hourAgo } }),
      events.count({ kind: 'state_lookup', created_date: { $gte: hourAgo } }),
    ]);
    if (forEmail >= PER_EMAIL_PER_HOUR || overall >= GLOBAL_PER_HOUR) {
      return Response.json({ state: 'rate_limited' });
    }
    await events
      .create({ kind: 'state_lookup', destination_hash: hash, datetime: new Date().toISOString() })
      .catch(() => null);

    const user = await findUserByEmail(service, email);
    if (!user) return Response.json({ state: 'new' });
    if (user.disabled) return Response.json({ state: 'blocked' });
    if (user.is_verified === false) return Response.json({ state: 'unverified' });

    // Confirmed account — decide from the registration artefacts, never from
    // anything the browser sent.
    const [patients, doctorProfiles, doctorDrafts, laboratories, hospitals, pharmacies, radiologists] =
      await Promise.all([
        service.entities.PatientProfile.filter({ user_id: user.id }),
        service.entities.DoctorProfile.filter({ user_id: user.id }),
        service.entities.DoctorRegistrationDraft.filter({ user_id: user.id }),
        service.entities.LaboratoryProfile.filter({ user_id: user.id }),
        service.entities.HospitalProfile.filter({ user_id: user.id }),
        service.entities.PharmacyProfile.filter({ user_id: user.id }),
        service.entities.RadiologistProfile.filter({ user_id: user.id }),
      ]);

    if (rows(patients).length > 0) return Response.json({ state: 'active' });
    if ([laboratories, hospitals, pharmacies, radiologists].some((list) => rows(list).length > 0)) {
      return Response.json({ state: 'active' });
    }

    const doctor = rows(doctorProfiles)[0];
    if (doctor) return Response.json({ state: doctor.is_verified ? 'active' : 'pending_verification' });

    const draft = rows(doctorDrafts)[0];
    if (draft) {
      if (draft.status === 'rejected') return Response.json({ state: 'rejected' });
      if (draft.status === 'pending_verification') return Response.json({ state: 'pending_verification' });
      if (draft.status === 'active') return Response.json({ state: 'active' });
    }

    // Confirmed, but no portal profile yet: the registration was started and
    // left unfinished. That is a resume, not a new account.
    return Response.json({ state: 'incomplete' });
  } catch (error) {
    // Never let an internal failure look like a decision about the account.
    return Response.json({ state: 'unknown' });
  }
}