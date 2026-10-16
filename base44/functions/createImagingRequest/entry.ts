import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findActiveCheckIn, gateBlocked } from "../../shared/hospitalAuth.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Imaging request creation with the mandatory check-in gate. The backend
// independently verifies that an active check-in exists for this patient at
// the doctor's hospital BEFORE the request is created.
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

    // Written with the service role — doctors cannot create imaging requests
    // directly through the client API (Row Level Security blocks it).
    // doctor_user_id is stamped server-side (never trusted from the client) so
    // the requesting doctor can see and manage the requests they sent.
    const imaging_request = await base44.asServiceRole.entities.ImagingRequest.create({
      ...payload,
      doctor_user_id: user.id,
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

    return Response.json({ imaging_request, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}