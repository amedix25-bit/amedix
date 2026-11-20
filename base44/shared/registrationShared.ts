// Small helpers shared by the registration-state and patient-registration
// endpoints. Kept in one place so the two functions can never drift apart on
// how a row list, an email or a fingerprint is produced.

export const rows = (value) =>
  Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];

export const clean = (value, max) => String(value ?? '').trim().slice(0, max);

export const objectOr = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export function normalizeEmail(input) {
  const value = clean(input, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? value : null;
}

// SHA-256 fingerprint, used so the delivery log can count per destination
// without holding the address itself.
export async function fingerprint(value) {
  const data = new TextEncoder().encode(String(value || ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}