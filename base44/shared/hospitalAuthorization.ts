// Hospital administrative authorization — the single gate that stands between a
// registered hospital account and its AMedix Hospital Code.
//
// Rules enforced here and by the functions that import this module:
//  * a new hospital account is ALWAYS created in pending_approval state;
//  * a Hospital Code can only be created after AMedix administration approved
//    the institution AND issued an authorization code that the hospital
//    activated successfully;
//  * authorization codes are single-use, expiring, hospital-bound and stored
//    only as a salted SHA-256 hash;
//  * activation attempts are rate limited server-side;
//  * every state change is appended to the record's audit trail.
import { hashPassword, randomSalt } from "./labTechnicianAuth.ts";

export { randomSalt };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no 0/O/1/I
export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
export const DEFAULT_EXPIRY_DAYS = 7;

export function randomCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function generateAuthorizationCode() {
  const segments = [randomCode().slice(0, 4), randomCode().slice(0, 4), randomCode().slice(0, 4)];
  return `AMX-AUTH-${segments.join("-")}`;
}

export function registrationReference() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `HREG-${stamp}-${randomCode().slice(0, 4)}`;
}

export function normalizeCode(input) {
  return String(input || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function maskCode(code) {
  const clean = normalizeCode(code);
  return `AMX-AUTH-••••-${clean.slice(-4)}`;
}

export async function hashAuthorizationCode(code, salt) {
  return hashPassword(normalizeCode(code), salt);
}

export async function loadAuthorization(base44, hospitalProfileId) {
  if (!hospitalProfileId) return null;
  const rows = await base44.asServiceRole.entities.HospitalAuthorization.filter({
    hospital_profile_id: hospitalProfileId,
  });
  return rows[0] || null;
}

export async function loadAuthorizationById(base44, id) {
  if (!id) return null;
  const rows = await base44.asServiceRole.entities.HospitalAuthorization.filter({ id });
  return rows[0] || null;
}

// Expiry is derived, never stored as a status, so a lapsed code can never look valid.
export function codeState(auth) {
  if (!auth) return "none";
  // Consumed / withdrawn codes are states of their own, even once the hash is gone.
  if (auth.code_status === "used") return "used";
  if (auth.code_status === "revoked") return "revoked";
  if (!auth.authorization_code_hash) return "none";
  if (auth.code_expiry_datetime && new Date(auth.code_expiry_datetime).getTime() <= Date.now()) return "expired";
  return "issued";
}

export function isLocked(auth) {
  return !!auth?.locked_until && new Date(auth.locked_until).getTime() > Date.now();
}

export function attemptsRemaining(auth) {
  if (isLocked(auth)) return 0;
  return Math.max(0, MAX_ATTEMPTS - (auth?.failed_attempts || 0));
}

// The ONLY definition of "this hospital may operate". Used by Hospital Code
// creation, by doctor affiliation and by the portal gate — one rule, one place.
export function isActivated(auth) {
  return !!auth && auth.status === "approved" && auth.code_status === "used" && !!auth.activated_datetime;
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

export function withAudit(auth, entry) {
  return [...(auth?.audit || []), entry];
}

// Everything a hospital (or the admin dashboard) may see. The code hash and
// salt never leave the server.
export function publicAuthorization(auth, { includeAdminOnly = false } = {}) {
  if (!auth) return null;
  const base = {
    id: auth.id,
    hospital_profile_id: auth.hospital_profile_id,
    request_reference: auth.request_reference || "",
    hospital_name: auth.hospital_name,
    location: auth.location || "",
    contact_phone: auth.contact_phone || "",
    contact_email: auth.contact_email || "",
    photo_url: auth.photo_url || "",
    license_file_name: auth.license_file_name || "",
    status: auth.status,
    submitted_datetime: auth.submitted_datetime || "",
    decision_datetime: auth.decision_datetime || "",
    reviewed_by_name: auth.reviewed_by_name || "",
    rejection_reason: auth.rejection_reason || "",
    code_status: codeState(auth),
    code_preview: auth.authorization_code_preview || "",
    code_version: auth.code_version || 0,
    code_issued_datetime: auth.code_issued_datetime || "",
    code_issued_by_name: auth.code_issued_by_name || "",
    code_expiry_datetime: auth.code_expiry_datetime || "",
    code_used_datetime: auth.code_used_datetime || "",
    code_revoked_datetime: auth.code_revoked_datetime || "",
    code_revoke_reason: auth.code_revoke_reason || "",
    code_history: auth.code_history || [],
    activated_datetime: auth.activated_datetime || "",
    is_activated: isActivated(auth),
    is_locked: isLocked(auth),
    locked_until: auth.locked_until || "",
    attempts_remaining: attemptsRemaining(auth),
    audit: auth.audit || [],
  };
  if (includeAdminOnly) {
    base.hospital_user_id = auth.hospital_user_id;
    base.license_file_uri = auth.license_file_uri || "";
    base.additional_documents = auth.additional_documents || [];
    base.admin_notes = auth.admin_notes || "";
    base.last_attempt_datetime = auth.last_attempt_datetime || "";
    base.failed_attempts = auth.failed_attempts || 0;
  }
  return base;
}

// Emails the AMedix administration (app administrators). Never throws — a mail
// failure must not undo an authorization decision that already committed.
export async function notifyAdministration(base44, { subject, body }) {
  try {
    const users = await base44.asServiceRole.entities.User.list();
    const recipients = [...new Set((users || []).filter((u) => u.role === "admin" && u.email).map((u) => u.email))].slice(0, 10);
    if (recipients.length === 0) return;
    await Promise.allSettled(
      recipients.map((to) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to,
          subject,
          body: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#17324D;line-height:1.6">${body}</div>`,
          category: "transactional",
        })
      )
    );
  } catch (err) {
    /* notification only — the authorization record is the source of truth */
  }
}

export async function notifyHospital(base44, to, { subject, body }) {
  if (!to) return;
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject,
      body: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#17324D;line-height:1.6">${body}</div>`,
      category: "transactional",
    });
  } catch (err) {
    /* notification only */
  }
}

export function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}