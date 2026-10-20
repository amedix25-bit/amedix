import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { findActiveCheckIn, gateBlocked } from "../../shared/hospitalAuth.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { historyEntry } from "../../shared/radiologyWorkflow.ts";

// Imaging request creation with the mandatory check-in gate AND department
// routing: the request is routed to the RADIOLOGY DEPARTMENT of the doctor's
// facility (the hospital administrator whose facility has a configured
// radiology department) — never to an individual radiologist. Duplicate
// submissions of the same study for the same patient are refused.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.patient_id || !payload.doctor_id) {
      return Response.json({ error: "Patient and doctor are required." }, { status: 400 });
    }

    const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ id: String(payload.doctor_id) });
    if (doctors.length === 0 || doctors[0].user_id !== user.id) {
      return Response.json({ error: "Doctor profile not found." }, { status: 403 });
    }
    const doctor = doctors[0];

    const checkin = await findActiveCheckIn(base44, payload.patient_id, doctor.hospital);
    if (!checkin) return gateBlocked();

    // ===== Department routing =====
    const hospitalName = String(doctor.hospital || "").trim();
    if (!hospitalName) {
      return Response.json(
        { error: "Your active hospital is not set — join a hospital before requesting imaging." },
        { status: 422 }
      );
    }
    const facilities = await base44.asServiceRole.entities.HospitalProfile.filter({
      hospital_name: hospitalName,
      status: "active",
    });
    const facility = facilities[0];
    if (!facility) {
      return Response.json(
        { error: `No facility account was found for "${hospitalName}" — the imaging request cannot be routed.` },
        { status: 422 }
      );
    }
    if (!facility.radiology_department_enabled) {
      return Response.json(
        { error: `"${facility.hospital_name}" has no configured Radiology Department to receive imaging requests. Ask the facility administrator to enable its radiology department, or route the request to another facility.` },
        { status: 422 }
      );
    }

    // ===== Duplicate submission prevention =====
    const recent = await base44.asServiceRole.entities.ImagingRequest.filter({
      patient_id: String(payload.patient_id),
      doctor_id: String(payload.doctor_id),
      scan_type: payload.scan_type,
      examination: payload.examination,
    }, "-request_datetime", 20);
    const dayMs = 24 * 3600 * 1000;
    const duplicate = recent.find((r) => {
      if (!r.request_datetime) return false;
      if (["cancelled", "released", "final_report"].includes(r.workflow_status)) return false;
      return Date.now() - new Date(r.request_datetime).getTime() < dayMs;
    });
    if (duplicate) {
      return Response.json(
        { error: `An identical active request (${duplicate.request_id}) was already submitted for this patient within the last 24 hours.`, duplicate_id: duplicate.id },
        { status: 409 }
      );
    }

    // Written with the service role — doctors cannot create imaging requests
    // directly through the client API (Row Level Security blocks it).
    // doctor_user_id is stamped server-side (never trusted from the client) so
    // the requesting doctor can see and manage the requests they sent.
    const nowIso = new Date().toISOString();
    // Timestamps are stamped server-side (never trusted from the client) so
    // duplicate prevention, SLA/overdue tracking and history always work.
    const imaging_request = await base44.asServiceRole.entities.ImagingRequest.create({
      ...payload,
      request_datetime: payload.request_datetime || nowIso,
      request_time: payload.request_time || nowIso.slice(11, 16),
      date_requested: payload.date_requested || nowIso.slice(0, 10),
      doctor_user_id: user.id,
      workflow_status: "requested",
      status: "requested",
      routed_hospital_user_id: facility.user_id,
      routed_hospital: facility.hospital_name,
      updated_datetime: nowIso,
      status_history: historyEntry({}, "create", "", "requested", doctor.full_name, "doctor",
        `Routed to the Radiology Department of ${facility.hospital_name}`),
    });

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: "doctor",
      action: "requested_imaging",
      action_label: "requested an imaging study",
      patient_id: String(payload.patient_id),
      patient_cin: payload.patient_cin || "",
      patient_name: payload.patient_name || "",
      hospital: doctor.hospital || "",
    });

    return Response.json({
      imaging_request,
      checkin_id: checkin.id,
      routed_hospital: facility.hospital_name,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}