import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, writeAudit, unauthorized } from "../../shared/labTechnicianAuth.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Result verification — records the responsible laboratory professional,
// date/time and verification status, then releases the verified result to the
// patient. The original released result is never modified. Both the laboratory
// audit log and the clinical Audit Log record the action.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
    if (!tech) return unauthorized();

    const requestId = String(body.lab_request_id || "");
    if (!requestId) return Response.json({ error: "Select the laboratory request." }, { status: 400 });

    const found = await base44.asServiceRole.entities.LabRequest.filter({ id: requestId });
    const labRequest = found.find((r) => r.lab_id === tech.laboratory_id && r.authorized_by_patient === true);
    if (!labRequest) return Response.json({ error: "Request not found for your laboratory." }, { status: 404 });
    if (labRequest.status !== "results") {
      return Response.json({ error: "Results must be submitted before verification." }, { status: 400 });
    }

    if (labRequest.result_verified) {
      return Response.json({
        ok: true,
        already_verified: true,
        verified_by_name: labRequest.verified_by_name,
        verified_datetime: labRequest.verified_datetime,
      });
    }

    const nowIso = new Date().toISOString();
    await base44.asServiceRole.entities.LabRequest.update(labRequest.id, {
      result_verified: true,
      verified_by_name: tech.full_name,
      verified_datetime: nowIso,
      released_datetime: nowIso,
    });

    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "result_verified_released",
      details: `Results for ${labRequest.request_id} verified and released by ${tech.full_name}`,
      patient_cin: labRequest.patient_cin,
    });

    await logClinicalAudit(base44, {
      actor_user_id: tech.created_by_id,
      actor_name: tech.full_name,
      actor_role: "laboratory",
      action: "verified_lab_result",
      action_label: "verified and released a laboratory result",
      patient_id: labRequest.patient_id,
      patient_cin: labRequest.patient_cin,
      patient_name: labRequest.patient_name,
      document_id: labRequest.request_id,
      hospital: labRequest.lab_name,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}