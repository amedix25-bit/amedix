import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, unauthorized } from "../../shared/labTechnicianAuth.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
    if (!tech) return unauthorized();

    // Optionally mark a request as opened (only if it was authorized to this technician's laboratory)
    if (body.mark_opened_id) {
      const matches = await base44.asServiceRole.entities.LabRequest.filter({ id: body.mark_opened_id });
      const target = matches.find((r) => r.lab_id === tech.laboratory_id && r.authorized_by_patient === true);
      if (target && !target.lab_opened_at) {
        await base44.asServiceRole.entities.LabRequest.update(target.id, {
          lab_opened_at: new Date().toISOString(),
        });
      }
    }

    // New authorized requests sent to this laboratory — the patient's identity is only
    // included when the patient has explicitly authorized this laboratory.
    const requests = await base44.asServiceRole.entities.LabRequest.filter(
      { lab_id: tech.laboratory_id },
      "-authorization_datetime",
      100
    );

    const notifications = requests
      .filter((r) => r.status === "authorized" && r.authorized_by_patient === true)
      .map((r) => ({
        id: r.id,
        request_ref: r.request_id,
        patient_name: r.patient_name || null,
        patient_cin: r.patient_cin || null,
        date_requested: r.date_requested,
        tests: (r.tests || []).map((t) => t.name),
        pdf_url: r.pdf_url || null,
        opened: Boolean(r.lab_opened_at),
      }));

    return Response.json({ notifications });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}