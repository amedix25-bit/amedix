import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, unauthorized } from "../../shared/labTechnicianAuth.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
    if (!tech) return unauthorized();

    const name = String(body.name || "").trim();
    if (name.length < 2) {
      return Response.json({ matches: [], message: "Enter at least 2 characters of the patient's name." });
    }

    const requests = await base44.asServiceRole.entities.LabRequest.filter(
      { lab_id: tech.laboratory_id },
      "-authorization_datetime",
      100
    );

    // Only patients who explicitly authorized this laboratory are ever visible to the technician.
    const open = requests.filter(
      (r) => r.authorized_by_patient === true && ["authorized", "pending"].includes(r.status)
    );

    const needle = name.toLowerCase();
    const byPatient = new Map();
    open.forEach((r) => {
      if (!(r.patient_name || "").toLowerCase().includes(needle)) return;
      if (!byPatient.has(r.patient_id)) {
        byPatient.set(r.patient_id, {
          patient_id: r.patient_id,
          patient_name: r.patient_name,
          patient_cin: r.patient_cin,
          requests: [],
        });
      }
      byPatient.get(r.patient_id).requests.push({
        id: r.id,
        request_ref: r.request_id,
        date_requested: r.date_requested,
        created_date: r.created_date || null,
        status: r.status,
        tests: (r.tests || []).map((t) => t.name),
        pdf_url: r.pdf_url || null,
      });
    });

    return Response.json({ matches: [...byPatient.values()] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}