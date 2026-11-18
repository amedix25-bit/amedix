import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { verifyReceptionistSession, touchReceptionistActivity, unauthorized } from "../../shared/hospitalAuth.ts";
import {
  verifyTreatingDoctor,
  grantEncounterAccess,
  revokeAccess,
  accessLive,
} from "../../shared/patientAccess.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Changing the treating doctor of an ACTIVE visit.
//
// The receptionist must explicitly confirm the change. The backend re-verifies
// the session, the active visit at that hospital and the new doctor, grants the
// new doctor the visit authorization, and revokes the PREVIOUS doctor's
// visit-based authorization (a patient-approved authorization of their own is
// never touched). The visit keeps a full assignment history — nothing clinical
// is deleted or rewritten.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const rec = await verifyReceptionistSession(base44, body.receptionist_id, body.session_token);
    if (!rec) return unauthorized();

    const sr = base44.asServiceRole;
    const patientId = String(body.patient_id || "");
    const doctorId = String(body.doctor_id || "");
    if (!patientId || !doctorId) {
      return Response.json({ error: "Patient and treating doctor are required." }, { status: 400 });
    }
    if (body.confirm !== true) {
      return Response.json({ error: "Confirm the change of treating doctor." }, { status: 400 });
    }

    const checkins = await sr.entities.HospitalCheckIn.filter({
      patient_id: patientId,
      hospital_id: rec.hospital_id,
      status: "active",
    });
    const checkin = (checkins || [])[0];
    if (!checkin) {
      return Response.json({ error: "This patient is not checked in at your hospital." }, { status: 404 });
    }
    if (checkin.assigned_doctor_id === doctorId) {
      return Response.json({ error: "This doctor is already the assigned treating doctor for this visit." }, { status: 400 });
    }

    const verified = await verifyTreatingDoctor(base44, rec.hospital_id, doctorId);
    if (!verified.ok) return Response.json({ error: verified.reason }, { status: 403 });
    const doctor = verified.doctor;

    const patients = await sr.entities.PatientProfile.filter({ id: patientId });
    if (patients.length === 0) return Response.json({ error: "Patient not found." }, { status: 404 });
    const patient = patients[0];

    const hospitals = await sr.entities.HospitalProfile.filter({ id: rec.hospital_id });
    const hospital = hospitals[0];
    if (!hospital) return Response.json({ error: "Hospital not found." }, { status: 404 });

    const previousDoctorId = checkin.assigned_doctor_id || "";
    const previousDoctorName = checkin.assigned_doctor_name || "";

    // End the previous doctor's VISIT-based authorization only.
    let previousRevoked = false;
    if (checkin.access_request_id) {
      const rows = await sr.entities.AccessRequest.filter({ id: checkin.access_request_id });
      const previous = (rows || [])[0];
      if (previous && previous.source === "hospital_checkin" && accessLive(previous)) {
        await revokeAccess(base44, {
          request: previous,
          reason: `Treating doctor reassigned to Dr. ${doctor.full_name || ""} by hospital reception.`,
          byName: rec.full_name || "",
          byRole: "hospital_receptionist",
        });
        previousRevoked = true;
      }
    }

    const now = new Date().toISOString();
    const grant = await grantEncounterAccess(base44, {
      patient,
      doctor,
      hospital,
      receptionist: rec,
      checkinId: checkin.id,
      encounterRef: checkin.encounter_ref || "",
      title: verified.title || "",
    });
    const access = grant.request;

    const history = Array.isArray(checkin.assignment_history) ? [...checkin.assignment_history] : [];
    history.push({
      action: "reassigned",
      doctor_id: doctor.id,
      doctor_name: doctor.full_name || "",
      by_name: rec.full_name || "",
      by_role: "hospital_receptionist",
      reason: previousDoctorName
        ? `Reassigned from Dr. ${previousDoctorName}${previousRevoked ? " (previous access revoked)" : ""}.`
        : "Treating doctor assigned.",
      datetime: now,
    });

    const updated = await sr.entities.HospitalCheckIn.update(checkin.id, {
      assigned_doctor_id: doctor.id,
      assigned_doctor_user_id: doctor.user_id || "",
      assigned_doctor_name: doctor.full_name || "",
      assigned_doctor_specialty: doctor.specialization || "",
      assigned_doctor_title: verified.title || "",
      access_request_id: access.id,
      access_status: "granted",
      access_granted_datetime: access.granted_datetime || now,
      access_expires_datetime: access.expires_datetime || "",
      access_revoked_datetime: "",
      access_revoked_by: "",
      access_revoke_reason: "",
      assignment_history: history,
    });

    await logClinicalAudit(sr, {
      actor_user_id: "",
      actor_name: rec.full_name || "",
      actor_role: "hospital_receptionist",
      action: "treating_doctor_reassigned",
      action_label: `changed the treating doctor${previousDoctorName ? ` from Dr. ${previousDoctorName}` : ""} to Dr. ${doctor.full_name || ""} (${checkin.encounter_ref || checkin.id})`,
      patient_id: patient.id,
      patient_user_id: patient.user_id || "",
      patient_cin: patient.cin || "",
      patient_name: patient.full_name || "",
      encounter_id: checkin.id,
      hospital: hospital.hospital_name || "",
    });

    try {
      await sr.entities.DoctorNotification.create({
        doctor_user_id: doctor.user_id || "",
        doctor_id: doctor.id,
        type: "patient_access_granted",
        title: "Patient Assigned to You",
        message: `${patient.full_name || "A patient"} was assigned to you at ${hospital.hospital_name || "your hospital"}. You can open their record now.`,
        patient_id: patient.id,
        patient_name: patient.full_name || "",
        patient_cin: patient.cin || "",
        related_id: access.id,
        is_read: false,
        datetime: now,
      });
    } catch (e) {
      /* notification only */
    }

    await touchReceptionistActivity(base44, rec.id);

    return Response.json({
      status: "reassigned",
      checkin: updated,
      doctor_name: doctor.full_name || "",
      previous_doctor_name: previousDoctorName,
      previous_access_revoked: previousRevoked,
      message: `Treating doctor changed. Access granted to Dr. ${doctor.full_name || ""}.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}