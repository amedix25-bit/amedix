// Password-recovery helpers shared by the request page, the reset page and the
// login page.
//
// What the app can and cannot control:
//  - the reset email itself is sent by the platform's auth service, not by app
//    code, so this module never claims an email was delivered — only that the
//    request was accepted;
//  - the resend cooldown below is the app's own, so a user cannot burn the
//    platform's shared per-IP auth allowance with rapid repeats;
//  - nothing here ever stores a reset token or a password.

// The one place to change the resend window. Kept short on purpose: the backend
// rate limit (shared per IP across registration, OTP, login and reset) is the
// real guard, and this cooldown only stops accidental double-taps.
export const RESEND_COOLDOWN_SECONDS = 60;

const EMAIL_KEY = "amedix_reset_email";
const REQUESTS_KEY = "amedix_reset_requests";

function safeSession() {
  try {
    return window.sessionStorage;
  } catch (error) {
    return null;
  }
}

function normalise(email) {
  return String(email || "").trim().toLowerCase();
}

// Requests are tracked per address, so asking for a second address is never
// blocked by the first one's cooldown.
function readRequests() {
  const store = safeSession();
  if (!store) return {};
  try {
    const parsed = JSON.parse(store.getItem(REQUESTS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

// The reset page needs the address to prove the new password actually works.
// sessionStorage keeps it in this tab only, and it is cleared on use.
export function rememberResetEmail(email) {
  const store = safeSession();
  if (!store || !email) return;
  store.setItem(EMAIL_KEY, String(email).trim().toLowerCase());
}

export function lastResetEmail() {
  const store = safeSession();
  return store ? store.getItem(EMAIL_KEY) || "" : "";
}

export function forgetResetEmail() {
  safeSession()?.removeItem(EMAIL_KEY);
}

export function markRequested(email) {
  const store = safeSession();
  if (!store) return;
  const requests = readRequests();
  requests[normalise(email)] = Date.now();
  store.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

// Seconds left before another request for THIS address may be sent.
//
// Always derived from the stored timestamp rather than counted down in memory:
// a background or mobile tab throttles timers, and a decremented counter would
// then stay stuck and leave the resend button disabled long after the window.
export function cooldownRemaining(email, now = Date.now()) {
  const at = Number(readRequests()[normalise(email)] || 0);
  if (!at) return 0;
  const left = Math.ceil((at + RESEND_COOLDOWN_SECONDS * 1000 - now) / 1000);
  return left > 0 ? left : 0;
}

// Turns a request failure into a plain, non-revealing message. The wording is
// identical whether or not the address belongs to an account, so this page can
// never be used to discover who has an AMedix account.
export function describeRequestError(error) {
  const status = error?.response?.status;
  const raw = String(
    error?.response?.data?.message || error?.response?.data?.error || error?.message || ""
  );
  const rateLimited = status === 429 || /rate|too many|limit/i.test(raw);
  if (rateLimited) {
    return {
      kind: "rate_limited",
      message:
        "Too many reset requests have been made from this connection. Please wait a few minutes, then try again.",
    };
  }
  if (!status || status >= 500) {
    return {
      kind: "unreachable",
      message: "We could not reach the server. Check your connection and try again.",
    };
  }
  return {
    kind: "rejected",
    message: "The request could not be processed. Please try again in a moment.",
  };
}

// The platform rejects a token that is unknown, already used or expired with
// the same message — which is correct: it must not say which.
export function isTokenError(error) {
  const raw = String(
    error?.response?.data?.message || error?.response?.data?.error || error?.message || ""
  );
  return /invalid or expired|expired|invalid.*token|token.*invalid/i.test(raw);
}

export function isCredentialError(error) {
  const raw = String(
    error?.response?.data?.message || error?.response?.data?.error || error?.message || ""
  );
  return /invalid.*(password|credential)|incorrect.*password|wrong password/i.test(raw);
}

// A reset link may carry the token under more than one name depending on how
// the mailer builds it; a hash fragment is also accepted, since fragments are
// never sent to the server and are a safe place for a one-time token.
export function readResetToken(searchParams) {
  const fromQuery =
    searchParams?.get("token") ||
    searchParams?.get("reset_token") ||
    searchParams?.get("resetToken") ||
    "";
  if (fromQuery) return fromQuery.trim();

  const hash = String(window.location.hash || "");
  const match = hash.match(/token=([^&]+)/);
  return match ? decodeURIComponent(match[1]).trim() : "";
}