// Shared hospital-portal auth + the check-in security gate. The crypto
// helpers are shared with the lab technician system (single implementation).
import { hashPassword, randomToken, randomSalt } from "./labTechnicianAuth.ts";

export { hashPassword, randomToken, randomSalt };

// Verifies a receptionist session — the receptionist record must be active and
// the session token must match the one issued at login.
export async function verifyReceptionistSession(base44, receptionistId, sessionToken) {
  if (!receptionistId || !sessionToken) return null;
  try {
    const recs = await base44.asServiceRole.entities.HospitalReceptionist.filter({ id: receptionistId });
    if (recs.length === 0) return null;
    const rec = recs[0];
    if (!rec.is_active || rec.session_token !== sessionToken) return null;
    return rec;
  } catch (err) {
    return null;
  }
}

// Keeps the online/offline status fresh — called on every receptionist action.
export async function touchReceptionistActivity(base44, receptionistId) {
  try {
    await base44.asServiceRole.entities.HospitalReceptionist.update(receptionistId, {
      last_active_datetime: new Date().toISOString(),
    });
  } catch (err) {
    /* non-fatal — activity tracking only */
  }
}

export function unauthorized() {
  return Response.json({ error: "Invalid or expired receptionist session. Please log in again." }, { status: 401 });
}

export function normalizeHospitalName(name) {
  return String(name || "").trim().toLowerCase();
}

// THE check-in security gate. Clinical actions (clinical notes, lab requests,
// imaging requests) must pass this server-side check: the patient must have
// an ACTIVE check-in at the doctor's hospital. It is verified here
// independently of the frontend — UI state, URLs or crafted requests cannot
// bypass it.
export async function findActiveCheckIn(base44, patientId, doctorHospital) {
  if (!patientId || !doctorHospital) return null;
  try {
    const checkins = await base44.asServiceRole.entities.HospitalCheckIn.filter({ patient_id: patientId, status: "active" });
    if (checkins.length === 0) return null;
    return checkins.find((c) => normalizeHospitalName(c.hospital_name) === normalizeHospitalName(doctorHospital)) || null;
  } catch (err) {
    return null;
  }
}

export function gateBlocked() {
  return Response.json(
    { error: "Patient is not checked in at your hospital. Clinical functions stay locked until the hospital reception checks the patient in." },
    { status: 403 }
  );
}