// Shared by the auth pages (Login, Register, and any page that resumes a flow
// after sign-in, e.g. the MCP OAuth consent page). Keep the redirect
// validation in one place — it is security-sensitive and easy to drift.

// Resolve ?returnTo= to a safe same-origin path, else "/home" (the
// authenticated role-selection / onboarding page — never "/" which is the
// public Welcome story page shown before anyone signs in). Login passes null
// as its fallback so only an explicit, valid returnTo overrides portal routing.
//
// The same-origin check alone is not enough: a value like /.//evil.com or
// /\evil.com parses same-origin but normalizes to a protocol-relative
// //evil.com when assigned to location.href — an open redirect. So require the
// resolved path to be exactly one leading slash (no "//" prefix, no backslash).
export function safeReturnTo(fallback = "/home") {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("returnTo") || params.get("from_url");
  if (!raw) return fallback;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    // Only access_token/clear_access_token are still URL-read by app-params.js, but the
    // whole bootstrap set stays stripped: one going back to a URL read must not silently
    // become injectable again. Normal app-flow params (e.g. the OAuth consent ctx) are kept.
    for (const p of ["access_token", "clear_access_token", "app_id", "app_base_url", "functions_version", "from_url"]) {
      url.searchParams.delete(p);
    }
    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
    return path;
  } catch {
    return fallback;
  }
}

// Generic entry/onboarding pages are not a completed sign-in destination.
// Resolve the account's authorized portal instead; keep real deep links intact.
export function safeLoginReturnTo() {
  const path = safeReturnTo(null);
  if (!path) return null;
  const pathname = new URL(path, window.location.origin).pathname.replace(/\/+$/, "").toLowerCase() || "/";
  const entryPages = ["/", "/home", "/landing", "/login", "/register", "/forgot-password", "/reset-password"];
  return entryPages.includes(pathname) ? null : path;
}