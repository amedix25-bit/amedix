// QA harness for the hospital administrative authorization system.
// Verifies the pure security logic that decides whether a hospital may ever
// create its AMedix Hospital Code.
import {
  generateAuthorizationCode,
  hashAuthorizationCode,
  maskCode,
  normalizeCode,
  codeState,
  isActivated,
  isLocked,
  attemptsRemaining,
  publicAuthorization,
  auditEntry,
  withAudit,
  MAX_ATTEMPTS,
} from "../base44/shared/hospitalAuthorization.ts";

let pass = 0;
const failures = [];
const ok = (name, cond, detail = "") => {
  if (cond) pass++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
};

const base = {
  id: "auth1",
  hospital_profile_id: "hp1",
  hospital_user_id: "u1",
  hospital_name: "Test Hospital",
  status: "approved",
  authorization_code_hash: "abc",
  authorization_code_salt: "salt",
  authorization_code_preview: "AMX-AUTH-••••-9F3K",
  code_status: "issued",
  code_expiry_datetime: new Date(Date.now() + 86400000).toISOString(),
};

// ---- code generation -------------------------------------------------------
const codes = Array.from({ length: 500 }, () => generateAuthorizationCode());
ok("code matches AMX-AUTH-XXXX-XXXX-XXXX", /^AMX-AUTH-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(codes[0]), codes[0]);
ok("code alphabet excludes ambiguous characters", codes.every((c) => !/[01IO]/.test(c.slice(9))));
ok("codes are unique", new Set(codes).size === codes.length);
ok("code is 12 random characters of entropy", codes[0].replace("AMX-AUTH-", "").replace(/-/g, "").length === 12);

// ---- masking / normalisation ----------------------------------------------
ok("mask hides all but the last four characters", maskCode("AMX-AUTH-7K2M-4P9X-2QW8") === "AMX-AUTH-••••-2QW8");
ok("normalisation trims, upper-cases and removes spaces", normalizeCode("  amx-auth-7k2m 4p9x-2qw8 ") === "AMX-AUTH-7K2M4P9X-2QW8");

// ---- hashing ---------------------------------------------------------------
const code = "AMX-AUTH-7K2M-4P9X-2QW8";
const h1 = await hashAuthorizationCode(code, "salt-a");
const h2 = await hashAuthorizationCode(code, "salt-a");
const h3 = await hashAuthorizationCode(code, "salt-b");
const h4 = await hashAuthorizationCode("AMX-AUTH-AAAA-BBBB-CCCC", "salt-a");
ok("hash is stable for the same code and salt", h1 === h2);
ok("hash changes with the salt", h1 !== h3);
ok("hash changes with the code", h1 !== h4);
ok("hash never contains the plain code", !h1.includes("7K2M"));
ok("hash is a 64-char sha-256 digest", /^[0-9a-f]{64}$/.test(h1));

// ---- derived code state ----------------------------------------------------
ok("no hash means no code", codeState({ code_status: "none" }) === "none");
ok("outstanding unexpired code reads as issued", codeState(base) === "issued");
ok("used code stays used even with a future expiry", codeState({ ...base, code_status: "used" }) === "used");
ok("revoked code reads as revoked", codeState({ ...base, code_status: "revoked" }) === "revoked");
ok(
  "lapsed code reads as expired, never as issued",
  codeState({ ...base, code_expiry_datetime: new Date(Date.now() - 1000).toISOString() }) === "expired"
);
ok("missing expiry never silently authorizes", codeState({ ...base, code_expiry_datetime: "" }) === "issued");

// ---- activation gate -------------------------------------------------------
const activated = { ...base, code_status: "used", activated_datetime: new Date().toISOString() };
ok("approved + used + activated is activated", isActivated(activated) === true);
ok("pending hospital is not activated", isActivated({ ...activated, status: "pending" }) === false);
ok("rejected hospital is not activated", isActivated({ ...activated, status: "rejected" }) === false);
ok("approved but code unused is not activated", isActivated(base) === false);
ok("used without activation timestamp is not activated", isActivated({ ...base, code_status: "used" }) === false);
ok("missing record is not activated", isActivated(null) === false);

// ---- rate limiting ---------------------------------------------------------
ok("fresh record allows the full attempt budget", attemptsRemaining({ failed_attempts: 0 }) === MAX_ATTEMPTS);
ok("attempts remaining decreases", attemptsRemaining({ failed_attempts: 4 }) === 1);
ok("attempts remaining never goes negative", attemptsRemaining({ failed_attempts: 9 }) === 0);
const locked = { failed_attempts: 0, locked_until: new Date(Date.now() + 600000).toISOString() };
ok("lock is active inside the window", isLocked(locked) === true);
ok("locked record reports zero attempts", attemptsRemaining(locked) === 0);
ok("expired lock is no longer active", isLocked({ ...locked, locked_until: new Date(Date.now() - 1000).toISOString() }) === false);

// ---- what the browser may see ---------------------------------------------
const hospitalView = publicAuthorization(activated);
ok("public view omits the code hash", !("authorization_code_hash" in hospitalView));
ok("public view omits the salt", !("authorization_code_salt" in hospitalView));
ok("public view omits admin-only fields", !("admin_notes" in hospitalView) && !("license_file_uri" in hospitalView));
ok("public view exposes activation state", hospitalView.is_activated === true);
const adminView = publicAuthorization({ ...activated, admin_notes: "checked", license_file_uri: "private://x" }, { includeAdminOnly: true });
ok("admin view includes review fields", adminView.admin_notes === "checked" && adminView.license_file_uri === "private://x");
ok("admin view still omits the hash", !("authorization_code_hash" in adminView));

// ---- audit trail -----------------------------------------------------------
const entry = auditEntry({ action: "approved", actionLabel: "Institution approved", actor: { user_id: "a1", name: "Admin", role: "admin" } });
ok("audit entry carries action, actor and timestamp", entry.action === "approved" && entry.actor_name === "Admin" && !!entry.datetime);
const trail = withAudit({ audit: [entry] }, auditEntry({ action: "code_issued" }));
ok("audit trail is append-only and ordered", trail.length === 2 && trail[0].action === "approved" && trail[1].action === "code_issued");

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED:`);
  failures.forEach((f) => console.error("  ✗ " + f));
  console.log(`\n${pass} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`All ${pass} hospital authorization checks passed.`);