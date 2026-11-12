// AMedix patient phone sessions.
//
// A verified phone number earns an opaque session token. The token is stored
// only as a SHA-256 fingerprint, expires, and is revoked on sign-out. Every
// patient request is answered from the session's own record — the browser never
// names a patient id, so a patient can only ever reach their own record.

const CIN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const PATIENT_SESSION_HOURS = 12;
export const REGISTRATION_TOKEN_MINUTES = 20;

export function newSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function tokenFingerprint(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(token || '')));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// The forms a Libyan mobile number is commonly stored in, so an existing
// patient record is found rather than duplicated.
export function phoneVariants(phone) {
  const local = phone.slice(3);
  return Array.from(new Set([phone, `+${phone}`, `0${local}`, local]));
}

function randomGroup() {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => CIN_CHARS[b % CIN_CHARS.length])
    .join('');
}

// Same format and guarantee as the patient registration flow: random, never
// derived from personal data, checked for uniqueness before it is used.
export async function generateUniqueCin(serviceRole) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const cin = `${randomGroup()}-${randomGroup()}-${randomGroup()}`;
    const page = await serviceRole.entities.PatientProfile.filter({ cin }, { limit: 1 });
    if (!page?.items?.length) return cin;
  }
  throw new Error('A unique CIN could not be generated.');
}

export async function findSession(serviceRole, token) {
  const cleaned = String(token || '').trim();
  if (!/^[0-9a-f]{64}$/.test(cleaned)) return null;
  const fingerprint = await tokenFingerprint(cleaned);
  const { items } = await serviceRole.entities.PatientSession.filter({ token_fingerprint: fingerprint }, { limit: 1 });
  const session = items?.[0] || null;
  if (!session) return null;
  if (new Date(session.expires_datetime).getTime() < Date.now()) return null;
  return session;
}

export function sessionExpiry(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}