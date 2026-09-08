import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, getVisitForTechnician, writeAudit, unauthorized } from "../../shared/labTechnicianAuth.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
    if (!tech) return unauthorized();

    const visit = await getVisitForTechnician(base44, tech, body.visit_id);
    if (!visit) return Response.json({ error: "Visit not found." }, { status: 404 });

    const action = String(body.action || "");
    if (action !== "tests_completed") {
      return Response.json({ error: "Unsupported action." }, { status: 400 });
    }
    if (visit.status !== "testing_pending") {
      return Response.json({ error: "Tests can only be marked completed while testing is pending." }, { status: 400 });
    }

    await base44.asServiceRole.entities.LabPatientVisit.update(visit.id, { status: "tests_completed" });

    await base44.asServiceRole.entities.LabNotification.create({
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      type: 'request_updated',
      title: 'Request Update',
      message: `Tests for ${visit.request_ref || "a lab request"} (${visit.patient_name}) were completed by ${tech.full_name}.`,
      patient_id: visit.patient_id,
      patient_name: visit.patient_name,
      patient_cin: visit.patient_cin,
      lab_request_id: visit.lab_request_id,
      request_ref: visit.request_ref || null,
      target: 'patient_profile',
      is_read: false,
    });

    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "tests_completed",
      details: "Requested tests completed — waiting for results",
      patient_cin: visit.patient_cin,
      visit_id: visit.id,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}