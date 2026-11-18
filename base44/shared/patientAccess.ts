// ONE patient-access rule for the hospital check-in authorization.
//
// A receptionist checking a patient in selects the treating doctor, and that
// authorized action creates a patient-specific authorization for that doctor
// ONLY — the patient never has to approve it on their phone. The rules here are
// the single source of truth for that authorization:
//
//   · it covers one patient, one doctor, one hospital and one visit encounter;
//   · it is live only while its status is approved AND its period has not run out;
//   · it ends when the visit ends, when the treating doctor is reassigned, or
//     when the patient removes it — never silently extended;
//   · the doctor must be an ACTIVE, VERIFIED doctor at THAT hospital — the
//     receptionist's dropdown is never trusted as proof of authorization.
//
// Every server-side read of a patient's record resolves access through
// `findLiveAccess`, so a revoked or expired authorization refuses immediately.
import { logClinicalAudit } from "./clinicalAudit.ts";
import { buildEligibilityIndex } from "./verifiedAccounts.ts";

// Absolute ceiling of a check-in authorization. The visit ends the access much
// earlier (check-out), so this only stops a forgotten open visit granting for
// ever.
export const CHECKIN_ACCESS_DAYS = 30;

const svc = (base44: any) => base44.asServiceRole || base44;

// A request is live only when it is approved and inside its period.
export function accessLive(request: any, now = Date.now()) {
  if (!request) return false;
  if (request.status !== "approved") return false;
  const expires = request.expires_datetime ? new Date(request.expires_datetime).getTime() : 0;
  return !expires || expires > now;
}

// The status shown to the patient, the receptionist and the doctor.
export function accessState(request: any, now = Date.now()) {
  if (!request) return "none";
  if (request.status === "revoked") return "revoked";
  if (request.status === "suspended") return "suspended";
  if (request.status === "declined") return "declined";
  if (request.status === "pending") return "pending";
  return accessLive(request, now) ? "granted" : "expired";
}

export function accessExpiryFromNow(days = CHECKIN_ACCESS_DAYS) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

// The live approved authorization for exactly this doctor and this patient.
export async function findLiveAccess(base44: any, doctorId: string, patientId: string) {
  if (!doctorId || !patientId) return null;
  const sr = svc(base44);
  const rows = await sr.entities.AccessRequest.filter({
    doctor_id: String(doctorId),
    patient_id: String(patientId),
    status: "approved",
  });
  return (rows || []).find((r: any) => accessLive(r)) || null;
}

// ── Doctor eligibility at one hospital ──────────────────────────────────────
// Only an active association with THIS hospital AND an active, verified doctor
// account can be selected as the treating doctor.
export async function eligibleHospitalDoctors(base44: any, hospitalId: string) {
  if (!hospitalId) return [];
  const sr = svc(base44);
  const links = await sr.entities.HospitalDoctor.filter({ hospital_id: String(hospitalId), status: "active" });
  if (!links || links.length === 0) return [];

  const index = await buildEligibilityIndex(base44);
  const doctorIds = links.map((l: any) => l.doctor_id).filter(Boolean);

  let titles: Record<string, string> = {};
  try {
    const pros = await sr.entities.DoctorProfessionalProfile.filter({ doctor_id: { $in: doctorIds } });
    titles = Object.fromEntries((pros || []).map((p: any) => [p.doctor_id, p.professional_title || ""]));
  } catch (e) {
    /* professional title is presentation only */
  }

  const out: any[] = [];
  for (const link of links) {
    const doctor = (index.doctors || []).find((d: any) => d.id === link.doctor_id);
    if (!doctor) continue;
    const evaluation = index.evaluations.get(doctor.user_id);
    if (!evaluation || evaluation.account_type !== "doctor" || !evaluation.eligible) continue;
    out.push({
      doctor_id: doctor.id,
      doctor_user_id: doctor.user_id || link.doctor_user_id || "",
      full_name: doctor.full_name || link.doctor_name || "",
      specialization: doctor.specialization || link.specialization || "",
      professional_title: titles[doctor.id] || "",
      photo_url: doctor.photo_url || link.doctor_photo_url || "",
    });
  }
  return out.sort((a, b) => String(a.full_name).localeCompare(String(b.full_name)));
}

// Re-verifies ONE selected doctor against the hospital — the server's own check,
// independent of whatever the dropdown offered.
export async function verifyTreatingDoctor(base44: any, hospitalId: string, doctorId: string) {
  const sr = svc(base44);
  if (!hospitalId || !doctorId) return { ok: false, reason: "Select a treating doctor." };

  const links = await sr.entities.HospitalDoctor.filter({
    hospital_id: String(hospitalId),
    doctor_id: String(doctorId),
    status: "active",
  });
  const link = (links || [])[0];
  if (!link) {
    return { ok: false, reason: "This doctor is not an active doctor at your hospital, so access cannot be granted." };
  }

  const doctors = await sr.entities.DoctorProfile.filter({ id: String(doctorId) });
  const doctor = (doctors || [])[0];
  if (!doctor) return { ok: false, reason: "The selected doctor could not be verified." };

  const index = await buildEligibilityIndex(base44);
  const evaluation = index.evaluations.get(doctor.user_id);
  if (!evaluation || evaluation.account_type !== "doctor" || !evaluation.eligible) {
    return {
      ok: false,
      reason: evaluation && evaluation.reason
        ? `This doctor cannot be assigned: ${evaluation.reason}`
        : "This doctor account is not active and verified, so access cannot be granted.",
    };
  }

  let title = "";
  try {
    const pros = await sr.entities.DoctorProfessionalProfile.filter({ doctor_id: doctor.id });
    title = (pros && pros[0] && pros[0].professional_title) || "";
  } catch (e) {
    /* presentation only */
  }

  return { ok: true, doctor, link, title, evaluation };
}

// ── Grant / revoke ──────────────────────────────────────────────────────────
// Creates the patient-specific authorization for the selected treating doctor.
// An already-live authorization for the same doctor is reused, never duplicated.
export async function grantEncounterAccess(
  base44: any,
  opts: {
    patient: any;
    doctor: any;
    hospital: any;
    receptionist: any;
    checkinId: string;
    encounterRef: string;
    title?: string;
  }
) {
  const sr = svc(base44);
  const { patient, doctor, hospital, receptionist, checkinId, encounterRef } = opts;
  const now = new Date();

  const existing = await findLiveAccess(sr, doctor.id, patient.id);
  if (existing) return { request: existing, created: false };

  const request = await sr.entities.AccessRequest.create({
    patient_id: patient.id,
    patient_user_id: patient.user_id || "",
    doctor_id: doctor.id,
    doctor_user_id: doctor.user_id || "",
    patient_cin: patient.cin || "",
    patient_name: patient.full_name || "",
    doctor_name: doctor.full_name || "",
    doctor_specialization: doctor.specialization || "",
    doctor_hospital: hospital.hospital_name || "",
    status: "approved",
    source: "hospital_checkin",
    hospital_id: hospital.id,
    hospital_name: hospital.hospital_name || "",
    checkin_id: checkinId || "",
    encounter_ref: encounterRef || "",
    access_scope: `This patient only, for the visit encounter at ${hospital.hospital_name || "the hospital"}. It does not cover other doctors, other patients or other encounters.`,
    granted_by_name: (receptionist && receptionist.full_name) || "",
    granted_by_role: "hospital_receptionist",
    granted_datetime: now.toISOString(),
    date_requested: now.toISOString().slice(0, 10),
    date_responded: now.toISOString().slice(0, 10),
    expires_datetime: accessExpiryFromNow(),
  });

  return { request, created: true };
}

// Ends one authorization immediately and records it in the patient's access log
// and the clinical audit trail. Never touches any other doctor's access.
export async function revokeAccess(
  base44: any,
  opts: { request: any; reason: string; byName: string; byRole: string }
) {
  const sr = svc(base44);
  const { request, reason, byName, byRole } = opts;
  const now = new Date().toISOString();

  const updated = await sr.entities.AccessRequest.update(request.id, {
    status: "revoked",
    revoked_datetime: now,
    revoked_by: byRole || byName || "",
    revoke_reason: reason || "",
  });

  try {
    await sr.entities.AccessAuditLog.create({
      patient_id: request.patient_id,
      patient_user_id: request.patient_user_id || "",
      doctor_id: request.doctor_id,
      doctor_name: request.doctor_name || "",
      action: "access_revoked",
      datetime: now,
    });
  } catch (e) {
    /* the audit below is the authoritative record */
  }

  await logClinicalAudit(sr, {
    actor_user_id: "",
    actor_name: byName || byRole || "",
    actor_role: byRole || "system",
    action: "access_revoked",
    action_label: `access revoked for Dr. ${request.doctor_name || ""} — ${reason || "no reason recorded"}`,
    patient_id: request.patient_id,
    patient_user_id: request.patient_user_id || "",
    patient_cin: request.patient_cin || "",
    patient_name: request.patient_name || "",
    encounter_id: request.checkin_id || "",
    hospital: request.hospital_name || request.doctor_hospital || "",
  });

  return updated;
}

// Marks the visit's access record as ended (check-out, reassignment) without
// deleting anything — history stays readable.
export async function closeCheckInAccess(
  base44: any,
  opts: { checkin: any; status: "expired" | "revoked"; byName: string; byRole: string; reason: string; action: string }
) {
  const sr = svc(base44);
  const { checkin, status, byName, byRole, reason, action } = opts;
  const now = new Date().toISOString();
  const history = Array.isArray(checkin.assignment_history) ? [...checkin.assignment_history] : [];
  history.push({
    action,
    doctor_id: checkin.assigned_doctor_id || "",
    doctor_name: checkin.assigned_doctor_name || "",
    by_name: byName || "",
    by_role: byRole || "",
    reason: reason || "",
    datetime: now,
  });

  return await sr.entities.HospitalCheckIn.update(checkin.id, {
    access_status: status,
    access_revoked_datetime: now,
    access_revoked_by: byRole || "",
    access_revoke_reason: reason || "",
    assignment_history: history,
  });
}