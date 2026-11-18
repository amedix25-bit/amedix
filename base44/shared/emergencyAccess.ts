// AMedix Emergency QR access — ONE server-side security core for both pathways.
//
// Pathway A (patient Emergency QR): only a doctor whose verified specialty is
// Emergency Medicine or Trauma Surgery may proceed.
// Pathway B (hospital Emergency Department QR): ANY verified doctor with an
// active account and a verified medical licence proceeds immediately — no
// hospital, department or administrator approval is ever part of the flow.
//
// Nothing in this module trusts the browser. Every decision is taken here from
// records read with the service role: the QR credential, the doctor's profile
// and account standing, the medical licence, the session's own binding to one
// exact patient, and the session's expiry.
import { isVerificationExempt } from "./documentNumberVerification.ts";
import { generateClinicalRef } from "./clinicalAudit.ts";
import { partitionOwnedRecords } from "./patientOwnership.ts";
import { loadAccountSnapshot, evaluateSnapshot } from "./verifiedAccounts.ts";

// ── Policy constants ────────────────────────────────────────────────────────
export const HOSPITAL_QR_ROTATION_SECONDS = 120;
export const HOSPITAL_SESSION_MINUTES = 20;
export const PATIENT_ACCESS_MINUTES = 15;
export const PATIENT_QR_VALID_DAYS = 365;
export const EMERGENCY_DEPARTMENT = "Emergency Department";
export const EMERGENCY_SPECIALTIES = ["emergency medicine", "trauma surgery"];
export const SCAN_WINDOW_MINUTES = 10;
export const MAX_SCANS_PER_WINDOW = 12;
export const SUSPICIOUS_WINDOW_MINUTES = 60;
export const SUSPICIOUS_DISTINCT_PATIENTS = 5;

export const EMERGENCY_REASONS = [
  "Life-threatening emergency",
  "Trauma or major injury",
  "Cardiac or respiratory emergency",
  "Neurological emergency",
  "Severe allergic reaction / anaphylaxis",
  "Altered consciousness or unresponsive patient",
  "Severe bleeding",
  "Obstetric emergency",
  "Paediatric emergency",
  "Other emergency",
];

// The signing key lives only in this backend module — it is never delivered to
// a browser, so a QR token cannot be minted or altered from the client.
const KEY_MATERIAL = "amedix-emergency-qr-v1";
const TICKET_KEY_MATERIAL = "amedix-emergency-ticket-v1";

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
}

async function sign(message: string, material: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(material),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return b64url(new Uint8Array(sig));
}

async function pack(payload: any, material: string, prefix: string): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${prefix}.${body}.${await sign(body, material)}`;
}

async function unpack(token: string, material: string, prefix: string): Promise<any | null> {
  if (typeof token !== "string") return null;
  const parts = String(token).trim().split(".");
  if (parts.length !== 3 || parts[0] !== prefix) return null;
  const [, body, signature] = parts;
  if (!body || !signature) return null;
  if ((await sign(body, material)) !== signature) return null;
  try {
    const payload = JSON.parse(fromB64url(body));
    if (!payload || typeof payload !== "object") return null;
    if (!payload.e || Number(payload.e) < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// A QR value is `amedix1.<payload>.<hmac>`: the payload names the credential
// and, for a hospital token, the rotation window. Signed with the backend key.
export async function signQrToken(payload: any): Promise<string> {
  return pack(payload, KEY_MATERIAL, "amedix1");
}

export async function readQrToken(token: string): Promise<any | null> {
  return unpack(token, KEY_MATERIAL, "amedix1");
}

// The scan ticket is issued by the server after a patient QR was validated; it
// is what the emergency-access step must present, so the browser can never
// substitute a different patient or doctor into that step.
export async function signScanTicket(payload: any): Promise<string> {
  return pack(payload, TICKET_KEY_MATERIAL, "amedixt1");
}

export async function readScanTicket(ticket: string): Promise<any | null> {
  return unpack(ticket, TICKET_KEY_MATERIAL, "amedixt1");
}

export async function tokenFingerprint(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(token)));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// `filter(query, {sort, limit})` returns a page object; `filter(query)`
// returns an array. One normaliser keeps every caller honest.
export function pageRows(result: any): any[] {
  if (Array.isArray(result)) return result;
  return (result && result.items) || [];
}

export function hospitalWindow(now = Date.now()) {
  const index = Math.floor(now / (HOSPITAL_QR_ROTATION_SECONDS * 1000));
  return { index: String(index), ends: (index + 1) * HOSPITAL_QR_ROTATION_SECONDS * 1000 };
}

export function addMinutes(minutes: number, from = Date.now()): string {
  return new Date(from + minutes * 60000).toISOString();
}

export function newEmergencySessionRef(): string {
  return generateClinicalRef("EMG");
}

// ── Doctor eligibility ──────────────────────────────────────────────────────
export function emergencySpecialtyOf(specialties: any): string {
  const list = (Array.isArray(specialties) ? specialties : [specialties]).filter(Boolean);
  const hit = list.find((s) => EMERGENCY_SPECIALTIES.includes(String(s).trim().toLowerCase()));
  return hit ? String(hit).trim() : "";
}

// One evaluation for both pathways: the account must be a real, verified,
// active doctor account with a verified medical licence. Specialty is checked
// separately, and only by Pathway A.
export async function evaluateEmergencyDoctor(base44: any, userId: string) {
  const snapshot = await loadAccountSnapshot(base44, userId);
  const evaluation = evaluateSnapshot(snapshot);
  const doctor = snapshot.doctor;
  if (!doctor) return { ok: false, reason: "This account is not an AMedix doctor account." };

  if ((evaluation as any).status !== "active") {
    return { ok: false, reason: "This doctor account is not active and in good standing." };
  }
  if (!(evaluation as any).verified) {
    return {
      ok: false,
      reason: (evaluation as any).reason || "The doctor's professional verification is not complete.",
    };
  }
  if (!(evaluation as any).eligible) {
    return { ok: false, reason: (evaluation as any).reason || "This doctor account is not eligible." };
  }

  const licence = String(doctor.license_number || "").trim();
  const exempt = isVerificationExempt((snapshot.user && snapshot.user.email) || (evaluation as any).email);
  if (!licence && !exempt) {
    return { ok: false, reason: "A verified, active medical license is required for emergency access." };
  }

  const specialties = [doctor.specialization, ...(doctor.specialties || [])].filter(Boolean);
  return {
    ok: true,
    doctor,
    user: snapshot.user,
    specialties,
    licence: licence || "verification exempt",
    // Pathway A is governed by the doctor's ACTIVE specialty only. The
    // `specialties` list is the account's history of previously chosen
    // specialties, so it can never grant emergency privileges.
    emergencySpecialty: emergencySpecialtyOf(doctor.specialization),
    primarySpecialty: doctor.specialization || specialties[0] || "",
  };
}

// ── Audit (immutable, server-written) ───────────────────────────────────────
export async function writeEmergencyAudit(base44: any, entry: any) {
  const sr = base44.asServiceRole || base44;
  try {
    return await sr.entities.EmergencyAuditLog.create({
      pathway: "",
      qr_kind: "",
      qr_credential_id: "",
      qr_identifier: "",
      qr_token_fingerprint: "",
      doctor_user_id: "",
      doctor_id: "",
      doctor_name: "",
      doctor_license: "",
      doctor_specialty: "",
      hospital_id: "",
      hospital_user_id: "",
      hospital_name: "",
      department: "",
      patient_id: "",
      patient_cin: "",
      patient_name: "",
      authorization_result: "",
      denial_reason: "",
      emergency_reason: "",
      justification: "",
      data_categories: [],
      session_id: "",
      session_ref: "",
      session_start: "",
      session_expires: "",
      notification_status: "",
      suspicious: false,
      detail: "",
      ...entry,
      datetime: new Date().toISOString(),
    });
  } catch (err) {
    // An audit failure must never stop emergency care; it is surfaced in logs.
    console.error("Emergency audit write failed", err);
    return null;
  }
}

// ── Hospital notification (in-app alert, never an approval gate) ────────────
export async function attemptAlertDelivery(base44: any, alert: any) {
  const sr = base44.asServiceRole || base44;
  const attempts = Number(alert.delivery_attempts || 0) + 1;
  const now = new Date().toISOString();
  try {
    const rows = await sr.entities.EmergencyAlert.filter({ id: alert.id });
    if (!rows || rows.length === 0) throw new Error("Alert could not be read back from the hospital portal.");
    const updated = await sr.entities.EmergencyAlert.update(alert.id, {
      delivery_status: "delivered",
      delivered_datetime: now,
      delivery_attempts: attempts,
      last_attempt_datetime: now,
      last_error: "",
    });
    return { ok: true, alert: updated };
  } catch (err) {
    const message = String((err && (err as any).message) || err).slice(0, 300);
    try {
      await sr.entities.EmergencyAlert.update(alert.id, {
        delivery_status: "failed",
        delivery_attempts: attempts,
        last_attempt_datetime: now,
        last_error: message,
      });
    } catch (e) {
      /* the alert record itself already carries the failure in last_error */
    }
    return { ok: false, alert: { ...alert, delivery_status: "failed", last_error: message }, error: message };
  }
}

export async function createEmergencyAlert(base44: any, params: any) {
  const sr = base44.asServiceRole || base44;
  let alert = null;
  try {
    alert = await sr.entities.EmergencyAlert.create({
      hospital_id: params.hospital_id || "",
      hospital_user_id: params.hospital_user_id || "",
      hospital_name: params.hospital_name || "",
      department: EMERGENCY_DEPARTMENT,
      session_id: params.session_id || "",
      session_ref: params.session_ref || "",
      doctor_user_id: params.doctor_user_id || "",
      doctor_id: params.doctor_id || "",
      doctor_name: params.doctor_name || "",
      doctor_license: params.doctor_license || "",
      doctor_specialty: params.doctor_specialty || "",
      scanned_datetime: params.scanned_datetime || new Date().toISOString(),
      authorization_status: "granted",
      session_expires: params.session_expires || "",
      patient_access_initiated: false,
      patient_access_count: 0,
      delivery_status: "pending",
      delivery_attempts: 0,
    });
  } catch (err) {
    return {
      alert: null,
      delivery_status: "failed",
      error: String((err && (err as any).message) || err).slice(0, 300),
    };
  }
  const result = await attemptAlertDelivery(base44, alert);
  return {
    alert: result.alert,
    delivery_status: result.ok ? "delivered" : "failed",
    error: result.error || "",
  };
}

// ── Abuse detection (flags, never delays) ───────────────────────────────────
export async function scanRateState(base44: any, doctorUserId: string) {
  const sr = base44.asServiceRole || base44;
  const from = new Date(Date.now() - SCAN_WINDOW_MINUTES * 60000).toISOString();
  try {
    const rows = pageRows(
      await sr.entities.EmergencyAuditLog.filter(
        { doctor_user_id: doctorUserId, datetime: { $gte: from } },
        { limit: 300 }
      )
    );
    const scans = rows.filter((r: any) =>
      ["patient_qr_scan", "hospital_qr_scan"].includes(r.event_type)
    ).length;
    return { limited: scans >= MAX_SCANS_PER_WINDOW, scans };
  } catch (e) {
    return { limited: false, scans: 0 };
  }
}

export async function distinctPatientPattern(base44: any, doctorUserId: string, patientId: string) {
  const sr = base44.asServiceRole || base44;
  const from = new Date(Date.now() - SUSPICIOUS_WINDOW_MINUTES * 60000).toISOString();
  try {
    const rows = pageRows(
      await sr.entities.EmergencyAuditLog.filter(
        { doctor_user_id: doctorUserId, event_type: "access_granted", datetime: { $gte: from } },
        { limit: 200 }
      )
    );
    const ids = new Set(rows.map((r: any) => r.patient_id).filter(Boolean));
    ids.add(patientId);
    return { flagged: ids.size >= SUSPICIOUS_DISTINCT_PATIENTS, distinctPatients: ids.size };
  } catch (e) {
    return { flagged: false, distinctPatients: 1 };
  }
}

// ── Session validity ────────────────────────────────────────────────────────
export function sessionLive(session: any, field = "session_expires") {
  if (!session) return false;
  if (session.status !== "active") return false;
  const end = new Date(session[field] || 0).getTime();
  return Number.isFinite(end) && end > Date.now();
}

export function accessLive(session: any) {
  if (!sessionLive(session, "access_expires")) return false;
  return session.access_status === "granted" && !!session.patient_id;
}

// ── Minimum necessary emergency bundle ─────────────────────────────────────
// Only the categories approved for emergency access are read. Documents, image
// archives, private notes and historical encounters are never queried here.
// Every row must resolve to this exact patient, or it is refused.
export async function buildEmergencyBundle(base44: any, patient: any) {
  const sr = base44.asServiceRole || base44;
  const pull = async (entity: string, sort: string, limit: number) => {
    try {
      return pageRows(await sr.entities[entity].filter({ patient_id: patient.id }, sort, limit));
    } catch (e) {
      return [];
    }
  };

  const [allergiesRaw, medicationsRaw, conditionsRaw, surgeriesRaw, labsRaw, requestsRaw] =
    await Promise.all([
      pull("Allergy", "-created_date", 200),
      pull("Medication", "-created_date", 300),
      pull("MedicalCondition", "-created_date", 300),
      pull("SurgicalHistory", "-created_date", 200),
      pull("PatientLabResult", "-test_date", 100),
      pull("LabRequest", "-created_date", 100),
    ]);

  const own = (rows: any[]) => partitionOwnedRecords(patient, rows || []).owned || [];

  const allergies = own(allergiesRaw).slice(0, 40).map((a: any) => ({
    allergen: a.allergen || "",
    type: a.allergy_type || "",
    severity: a.severity || "",
    reaction: a.reaction || "",
    entry_type: a.entry_type || "confirmed_allergy",
    source: a.source || "",
  }));

  const medications = own(medicationsRaw)
    .filter((m: any) => m.is_active !== false && m.current_status !== "stopped")
    .slice(0, 60)
    .map((m: any) => ({
      name: m.name || "",
      dose: m.dose || "",
      frequency: m.frequency || "",
      route: m.route || "",
      reason: m.reason || "",
      started: m.start_date || "",
    }));

  const conditions = own(conditionsRaw).slice(0, 40).map((c: any) => ({
    name: c.name || "",
    status: c.current_status || "",
    category: c.category || "",
    since: c.date || "",
    details: String(c.details || "").slice(0, 240),
  }));

  const surgeries = own(surgeriesRaw).slice(0, 20).map((s: any) => ({
    procedure: s.surgery_type || "",
    date: s.surgery_date || "",
    reason: s.reason || "",
  }));

  const labResults = own(labsRaw).slice(0, 10).map((l: any) => ({
    test: l.test_type || "",
    date: l.test_date || "",
    laboratory: l.lab_name || "",
  }));

  const labReports = own(requestsRaw)
    .filter((r: any) => r.result && (r.result_verified === true || !!r.released_datetime))
    .slice(0, 6)
    .map((r: any) => ({
      tests: (r.tests || []).map((t: any) => t.name).filter(Boolean).join(", "),
      date: r.released_datetime || r.date_completed || r.date_requested || "",
      summary: String(r.result || "").slice(0, 600),
    }));

  const allergiesSevere = allergies.filter((a: any) => a.severity === "severe");

  const alerts = [];
  if (allergiesSevere.length) {
    alerts.push(
      `Severe allergy: ${allergiesSevere.map((a: any) => a.allergen).filter(Boolean).join(", ")}`
    );
  }
  if (allergies.length && !allergiesSevere.length) {
    alerts.push(`${allergies.length} recorded allergy(ies) — confirm before prescribing`);
  }
  const bloodType = String(patient.blood_type || "").trim();
  if (bloodType && bloodType !== "Unknown") alerts.push(`Blood group ${bloodType}`);
  const activeConditions = conditions.filter((c: any) => c.status === "active").length;
  if (activeConditions) alerts.push(`${activeConditions} active medical condition(s)`);

  return {
    patient: {
      id: patient.id,
      name: patient.full_name || "",
      cin: patient.cin || "",
      date_of_birth: patient.date_of_birth || "",
      gender: patient.gender || "",
      blood_type: bloodType || "Unknown",
      nationality: patient.nationality || "",
    },
    allergies,
    medications,
    conditions,
    surgeries,
    lab_results: labResults,
    lab_reports: labReports,
    alerts,
    categories: [
      allergies.length ? "Critical allergies" : "",
      medications.length ? "Current medications" : "",
      conditions.length ? "Major medical conditions" : "",
      surgeries.length ? "Surgical history" : "",
      labResults.length || labReports.length ? "Recent investigations" : "",
      bloodType && bloodType !== "Unknown" ? "Blood group" : "",
    ].filter(Boolean),
    access_policy:
      "Minimum necessary emergency information only. Documents, imaging archives, private notes and historical encounters are not included.",
  };
}

// Patient notification about an emergency access event. Its real delivery
// status is returned and stored — it is never reported as sent when it was not.
export async function notifyPatientOfEmergencyAccess(base44: any, params: any) {
  const sr = base44.asServiceRole || base44;
  try {
    await sr.entities.PatientNotification.create({
      patient_id: params.patient_id,
      patient_user_id: params.patient_user_id || "",
      type: "other",
      title: "Emergency access to your medical record",
      message: `${params.doctor_name} (${params.doctor_specialty || "verified doctor"}) opened your emergency medical summary${
        params.hospital_name ? ` at ${params.hospital_name}` : ""
      } on ${params.when_label}. Reason given: ${params.reason}. This is not a permanent permission and expires shortly.`,
      is_read: false,
      target: "overview",
    });
    return { status: "delivered", error: "" };
  } catch (err) {
    return { status: "failed", error: String((err && (err as any).message) || err).slice(0, 300) };
  }
}