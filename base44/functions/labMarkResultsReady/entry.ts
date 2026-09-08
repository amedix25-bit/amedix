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
    if (visit.status !== "results_uploaded" || !visit.result_file_url) {
      return Response.json({ error: "Upload the results report first." }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    await base44.asServiceRole.entities.LabPatientVisit.update(visit.id, {
      status: "patient_notified",
      results_ready_at: nowIso,
    });

    await base44.asServiceRole.entities.PatientLabResult.create({
      patient_id: visit.patient_id,
      patient_cin: visit.patient_cin,
      patient_name: visit.patient_name,
      test_type: visit.requested_tests || "Laboratory tests",
      test_date: visit.request_date || today,
      lab_name: visit.lab_name || tech.laboratory_name,
      file_url: visit.result_file_url,
      file_name: visit.result_file_name,
      submitted_date: nowIso,
      submitted_by_name: `${tech.laboratory_name} — ${tech.full_name}`,
    });

    await base44.asServiceRole.entities.LabRequest.update(visit.lab_request_id, {
      status: "results",
      result_file_url: visit.result_file_url,
      result: "Laboratory report uploaded and available to the patient.",
      date_completed: today,
    });

    await base44.asServiceRole.entities.PatientNotification.create({
      patient_id: visit.patient_id,
      type: "lab_results",
      title: "Laboratory Results Available",
      message: "Your laboratory results are now available.",
      target: "mylabresults",
      related_id: visit.lab_request_id,
      event_date: today,
    });

    await base44.asServiceRole.entities.LabNotification.create({
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      type: 'request_completed',
      title: 'Laboratory Request Completed',
      message: `Results for ${visit.request_ref || "a lab request"} (${visit.patient_name}) are ready — the patient has been notified.`,
      patient_id: visit.patient_id,
      patient_name: visit.patient_name,
      patient_cin: visit.patient_cin,
      lab_request_id: visit.lab_request_id,
      request_ref: visit.request_ref || null,
      result_file_url: visit.result_file_url,
      target: 'result',
      is_read: false,
    });

    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "results_ready",
      details: "Results marked ready and made available to the patient",
      patient_cin: visit.patient_cin,
      visit_id: visit.id,
    });
    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "patient_notified",
      details: "Patient notified: your laboratory results are now available.",
      patient_cin: visit.patient_cin,
      visit_id: visit.id,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}