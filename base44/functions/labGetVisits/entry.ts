import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, unauthorized } from "../../shared/labTechnicianAuth.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
    if (!tech) return unauthorized();

    const visits = await base44.asServiceRole.entities.LabPatientVisit.filter(
      { technician_id: tech.id },
      "-created_date",
      200
    );
    return Response.json({
      visits: visits.map((v) => ({
        id: v.id,
        patient_name: v.patient_name,
        patient_cin: v.patient_cin,
        request_ref: v.request_ref,
        request_date: v.request_date,
        requested_tests: v.requested_tests,
        identification_method: v.identification_method,
        status: v.status,
        result_file_url: v.result_file_url,
        result_file_name: v.result_file_name,
        results_uploaded_at: v.results_uploaded_at,
        results_ready_at: v.results_ready_at,
        created_date: v.created_date,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}