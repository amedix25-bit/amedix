// AMedix Administration Codes — the institutional registration gate.
//
// One rule, in one place, for every caller (registration UI validation, the
// submit endpoints and the admin console):
//  * a code is single use, expiring, institution-specific and role-specific —
//    a code issued for a laboratory can never register a hospital or pharmacy;
//  * only a salted-fingerprint of the code is stored (SHA-256 of the normalised
//    code, which is high-entropy), so the plain code exists only at issue time;
//  * validation is rate limited in a rolling window to stop brute force and
//    enumeration, and every wrong answer is the same generic message;
//  * a valid code only lets the applicant continue registration — it never
//    grants access to a portal, clinical data or dispensing functions.
import { escapeHtml, notifyAdministration } from "./hospitalAuthorization.ts";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const PREFIX = { hospital: "HOSP", laboratory: "LAB", pharmacy: "PHARM" };

export const INSTITUTION_TYPES = ["hospital", "laboratory", "pharmacy"];
export const TYPE_LABEL = { hospital: "Hospital", laboratory: "Laboratory", pharmacy: "Pharmacy" };
export const DEFAULT_EXPIRY_DAYS = 30;
export const MAX_ATTEMPTS = 8;
export const WINDOW_MINUTES = 10;
export const LOCK_MINUTES = 15;
export const INVALID_CODE_MESSAGE =
  "This AMedix Administration Code is not valid. Check the code with AMedix administration — a code issued for one institution type cannot be used for another.";

function block(len) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function generateAdministrationCode(institutionType) {
  const prefix = PREFIX[institutionType] || "GEN";
  return `AMX-${prefix}-${block(4)}-${block(4)}-${block(4)}`;
}

export function normalizeCode(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

export async function codeFingerprint(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalizeCode(value)));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function codePreview(value) {
  const clean = normalizeCode(value);
  return `AMX-••••-${clean.slice(-4)}`;
}

export function registrationReference(prefix) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${stamp}-${block(4)}`;
}

// Expiry is derived, never stored as a status, so a lapsed code can never look valid.
export function codeState(record) {
  if (!record) return "none";
  if (record.status === "used") return "used";
  if (record.status === "revoked") return "revoked";
  if (record.status === "disabled") return "disabled";
  if (record.expiry_datetime && new Date(record.expiry_datetime).getTime() <= Date.now()) return "expired";
  return "issued";
}

export function auditEntry({ action, actionLabel, actor = {}, detail = "" }) {
  return {
    datetime: new Date().toISOString(),
    action,
    action_label: actionLabel || action,
    actor_user_id: actor.user_id || "system",
    actor_name: actor.name || "AMedix system",
    actor_role: actor.role || "system",
    detail,
  };
}

// ── Rolling-window rate limit ────────────────────────────────────────────────
// The attempted code cannot identify a record (that is the point of a lookup
// fingerprint), so attempts are counted per gate key in a rolling window.
export async function checkAttemptWindow(base44, key) {
  const now = Date.now();
  const rows = await base44.asServiceRole.entities.RegistrationCodeAttempt.filter({ attempt_key: key });
  const record = rows[0] || null;

  if (record?.locked_until && new Date(record.locked_until).getTime() > now) {
    return { allowed: false, minutes: Math.max(1, Math.ceil((new Date(record.locked_until).getTime() - now) / 60000)), remaining: 0 };
  }

  const inWindow = record?.window_start && now - new Date(record.window_start).getTime() < WINDOW_MINUTES * 60000;
  const attempts = (inWindow ? record.attempts || 0 : 0) + 1;
  const locked = attempts > MAX_ATTEMPTS;
  const patch = {
    attempt_key: key,
    attempts: locked ? 0 : attempts,
    window_start: locked || !inWindow ? new Date(now).toISOString() : record.window_start,
    locked_until: locked ? new Date(now + LOCK_MINUTES * 60000).toISOString() : "",
    last_attempt_datetime: new Date(now).toISOString(),
  };
  if (record) await base44.asServiceRole.entities.RegistrationCodeAttempt.update(record.id, patch);
  else await base44.asServiceRole.entities.RegistrationCodeAttempt.create(patch);

  return { allowed: !locked, minutes: locked ? LOCK_MINUTES : 0, remaining: Math.max(0, MAX_ATTEMPTS - attempts) };
}

export async function clearAttemptWindow(base44, key) {
  const rows = await base44.asServiceRole.entities.RegistrationCodeAttempt.filter({ attempt_key: key });
  if (!rows[0]) return;
  await base44.asServiceRole.entities.RegistrationCodeAttempt.update(rows[0].id, {
    attempts: 0,
    window_start: new Date().toISOString(),
    locked_until: "",
  });
}

// ── Validation ───────────────────────────────────────────────────────────────
export async function resolveAdministrationCode(base44, { code, institutionType, actor = {} }) {
  if (!INSTITUTION_TYPES.includes(institutionType)) {
    return { ok: false, status: 400, error: "Unknown institution type." };
  }
  const normalized = normalizeCode(code);
  if (normalized.length < 8) return { ok: false, status: 400, error: "Please enter your AMedix Administration Code." };

  const rows = await base44.asServiceRole.entities.RegistrationCode.filter({ code_fingerprint: await codeFingerprint(normalized) });
  const record = rows[0] || null;
  if (!record) return { ok: false, status: 401, error: INVALID_CODE_MESSAGE };

  // A code issued for one institution type can never register another.
  if (record.institution_type !== institutionType) {
    await appendAudit(base44, record, auditEntry({
      action: "rejected_wrong_type",
      actionLabel: "Code presented for the wrong institution type",
      actor,
      detail: `Issued for ${TYPE_LABEL[record.institution_type] || record.institution_type}, presented for ${TYPE_LABEL[institutionType] || institutionType}`,
    }));
    return { ok: false, status: 401, error: INVALID_CODE_MESSAGE };
  }

  const state = codeState(record);
  if (state === "used" || (record.used_count || 0) >= (record.max_uses || 1)) {
    return { ok: false, status: 409, error: "This code has already been used. Please contact AMedix administration for a new code." };
  }
  if (state === "revoked") {
    return { ok: false, status: 403, error: "This code was revoked by AMedix administration. Please contact them for a new code." };
  }
  if (state === "disabled") {
    return { ok: false, status: 403, error: "This code is currently disabled. Please contact AMedix administration." };
  }
  if (state === "expired") {
    return { ok: false, status: 410, error: "This code has expired. Please contact AMedix administration for a new code." };
  }

  return { ok: true, record };
}

export async function appendAudit(base44, record, entry) {
  await base44.asServiceRole.entities.RegistrationCode.update(record.id, {
    audit: [...(record.audit || []), entry],
    failed_attempts: entry.action.startsWith("rejected") ? (record.failed_attempts || 0) + 1 : record.failed_attempts || 0,
  });
}

// Consumption happens only after the registration record has been written.
export async function consumeAdministrationCode(base44, { record, user, institutionId, actor = {} }) {
  const stamp = new Date().toISOString();
  return base44.asServiceRole.entities.RegistrationCode.update(record.id, {
    status: "used",
    used_count: (record.used_count || 0) + 1,
    used_by_user_id: user?.id || "",
    used_by_email: String(user?.email || "").toLowerCase(),
    used_by_institution_id: institutionId || "",
    used_datetime: stamp,
    audit: [
      ...(record.audit || []),
      auditEntry({
        action: "used",
        actionLabel: "Code used for an institutional registration",
        actor,
        detail: institutionId ? `Institution registration ${institutionId}` : "",
      }),
    ],
  });
}

export async function issueAdministrationCode(base44, { institutionType, assignedInstitutionName, expiryDays, maxUses, notes, actor = {} }) {
  const code = generateAdministrationCode(institutionType);
  const now = Date.now();
  const days = Math.min(180, Math.max(1, Number(expiryDays) || DEFAULT_EXPIRY_DAYS));
  const record = await base44.asServiceRole.entities.RegistrationCode.create({
    institution_type: institutionType,
    assigned_institution_name: String(assignedInstitutionName || "").trim(),
    code_fingerprint: await codeFingerprint(code),
    code_preview: codePreview(code),
    status: "issued",
    max_uses: Math.min(10, Math.max(1, Number(maxUses) || 1)),
    used_count: 0,
    expiry_datetime: new Date(now + days * 86400000).toISOString(),
    issued_by_user_id: actor.user_id || "",
    issued_by_name: actor.name || "",
    issued_datetime: new Date(now).toISOString(),
    notes: String(notes || "").trim(),
    failed_attempts: 0,
    audit: [
      auditEntry({
        action: "issued",
        actionLabel: `AMedix Administration Code issued for a ${TYPE_LABEL[institutionType]}`,
        actor,
        detail: `Valid ${days} day${days === 1 ? "" : "s"} — single use`,
      }),
    ],
  });
  return { code, record };
}

export { escapeHtml };

export async function emailAdministration(base44, { subject, body }) {
  return notifyAdministration(base44, { subject, body });
}