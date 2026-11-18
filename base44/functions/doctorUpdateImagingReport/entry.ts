import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { gateBlocked } from "../../shared/hospitalAuth.ts";
import { findClinicalCheckIn } from "../../shared/patientAccess.ts";

// Doctor-side imaging report updates (text report, attached report file,
// completing the request). Modifying clinical information requires an ACTIVE
// check-in for the patient at the doctor's hospital — enforced here on the
// backend, and direct entity updates are blocked by Row Level Security.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const requestId = String((body && body.imaging_request_id) || "");
    if (!requestId) {
      return Response.json({ error: "Imaging request is required." }, { status: 400 });
    }

    const requests = await base44.asServiceRole.entities.ImagingRequest.filter({ id: requestId });
    if (requests.length === 0) {
      return Response.json({ error: "Imaging request not found." }, { status: 404 });
    }
    const request = requests[0];

    const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ id: String(request.doctor_id) });
    if (doctors.length === 0 || doctors[0].user_id !== user.id) {
      return Response.json({ error: "Not authorized to update this imaging request." }, { status: 403 });
    }

    const { checkin } = await findClinicalCheckIn(base44, doctors[0], request.patient_id);
    if (!checkin) return gateBlocked();

    const update = {};
    if (Object.prototype.hasOwnProperty.call(body, "report")) {
      update.report = String(body.report || "");
      update.status = "completed";
      update.date_completed = new Date().toISOString().slice(0, 10);
    }
    if (Object.prototype.hasOwnProperty.call(body, "report_file_url")) {
      update.report_file_url = String(body.report_file_url || "");
    }
    if (Object.keys(update).length === 0) {
      return Response.json({ error: "Nothing to update." }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.ImagingRequest.update(requestId, update);
    return Response.json({ imaging_request: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}