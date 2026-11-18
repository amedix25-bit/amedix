import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { accessState } from "../../shared/patientAccess.ts";

// The doctor's "My Assigned Patients" list. A patient appears here only when a
// hospital receptionist selected THIS doctor as the treating doctor at an
// active check-in — the doctor never has to search for the patient again or
// request access manually. Each row carries the live access status, so a
// revoked or expired authorization is visible and the record stays blocked.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const sr = base44.asServiceRole;
    const doctors = await sr.entities.DoctorProfile.filter({ user_id: user.id });
    const doctor = (doctors || [])[0];
    if (!doctor) return Response.json({ error: "Doctor profile not found." }, { status: 403 });

    const page = await sr.entities.HospitalCheckIn.filter(
      { assigned_doctor_id: doctor.id, status: "active" },
      { sort: "-checkin_datetime", limit: 100 }
    );
    const checkins = page.items || page || [];

    const patientIds = [...new Set(checkins.map((c) => c.patient_id).filter(Boolean))];
    const requestIds = [...new Set(checkins.map((c) => c.access_request_id).filter(Boolean))];

    const [patientRows, requestRows] = await Promise.all([
      patientIds.length ? sr.entities.PatientProfile.filter({ id: { $in: patientIds } }) : Promise.resolve([]),
      requestIds.length ? sr.entities.AccessRequest.filter({ id: { $in: requestIds } }) : Promise.resolve([]),
    ]);
    const patientsById = Object.fromEntries((patientRows || []).map((p) => [p.id, p]));
    const requestsById = Object.fromEntries((requestRows || []).map((r) => [r.id, r]));

    const assigned = checkins.map((c) => {
      const patient = patientsById[c.patient_id] || null;
      const request = c.access_request_id ? requestsById[c.access_request_id] || null : null;
      return {
        checkin_id: c.id,
        encounter_ref: c.encounter_ref || "",
        patient_id: c.patient_id,
        patient_name: c.patient_name || (patient && patient.full_name) || "",
        patient_cin: c.patient_cin || (patient && patient.cin) || "",
        date_of_birth: c.patient_dob || (patient && patient.date_of_birth) || "",
        gender: c.patient_gender || (patient && patient.gender) || "",
        hospital_name: c.hospital_name || "",
        checkin_datetime: c.checkin_datetime || "",
        access_status: accessState(request),
        access_granted_datetime: (request && request.granted_datetime) || c.access_granted_datetime || "",
        access_expires_datetime: (request && request.expires_datetime) || c.access_expires_datetime || "",
        access_request_id: c.access_request_id || "",
        access_scope: (request && request.access_scope) || "",
      };
    });

    return Response.json({ doctor_name: doctor.full_name || "", assigned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}