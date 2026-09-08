import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, writeAudit, unauthorized } from "../../shared/labTechnicianAuth.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
    if (!tech) return unauthorized();

    const labRequestId = String(body.lab_request_id || "");
    const method = body.identification_method === "qr" ? "qr" : "cin";
    if (!labRequestId) return Response.json({ error: "Missing laboratory request." }, { status: 400 });

    const reqs = await base44.asServiceRole.entities.LabRequest.filter({ id: labRequestId });
    if (reqs.length === 0) return Response.json({ error: "Laboratory request not found." }, { status: 404 });
    const labReq = reqs[0];

    if (!labReq.authorized_by_patient || labReq.lab_id !== tech.laboratory_id) {
      return Response.json({ error: "The patient has not authorized your laboratory to access this request." }, { status: 403 });
    }
    if (labReq.status !== "authorized") {
      return Response.json({ error: "This request is already being processed." }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.LabPatientVisit.filter({ lab_request_id: labReq.id });
    if (existing.length > 0) {
      return Response.json({ error: "This request is already checked in." }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.PatientProfile.filter({ id: labReq.patient_id });
    const patient = profiles[0] || {};

    await base44.asServiceRole.entities.LabPatientVisit.create({
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      lab_name: tech.laboratory_name,
      technician_id: tech.id,
      technician_name: tech.full_name,
      lab_request_id: labReq.id,
      request_ref: labReq.request_id || "",
      patient_id: labReq.patient_id,
      patient_cin: labReq.patient_cin || patient.cin || "",
      patient_name: labReq.patient_name || patient.full_name || "",
      request_date: labReq.date_requested || "",
      requested_tests: (labReq.tests || []).map((t) => t.name).join(", "),
      identification_method: method,
      status: "testing_pending",
    });

    await base44.asServiceRole.entities.LabRequest.update(labReq.id, { status: "pending" });

    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "patient_checked_in",
      details: `Request ${labReq.request_id || ""} accessed and patient added to work queue (${method === "qr" ? "QR" : "CIN"})`,
      patient_cin: labReq.patient_cin || patient.cin || "",
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}