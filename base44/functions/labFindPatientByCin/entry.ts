import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, writeAudit, unauthorized } from "../../shared/labTechnicianAuth.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
    if (!tech) return unauthorized();

    const cin = String(body.cin || "").trim().toUpperCase();
    const method = body.method === "qr" ? "qr" : "cin";
    if (!cin) return Response.json({ found: false, message: "Enter the patient's CIN." }, { status: 400 });

    const profiles = await base44.asServiceRole.entities.PatientProfile.filter({ cin });
    if (profiles.length === 0) {
      return Response.json({ found: false, message: "No patient found with that CIN." });
    }
    const patient = profiles[0];

    const requests = await base44.asServiceRole.entities.LabRequest.filter({ patient_id: patient.id });
    const labName = (tech.laboratory_name || "").trim().toLowerCase();
    const labRequests = requests.filter(
      (r) =>
        (r.lab_name || "").trim().toLowerCase() === labName &&
        ["requested", "pending"].includes(r.status)
    );

    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "patient_identified",
      details: `Patient identified by ${method === "qr" ? "QR code" : "CIN"}`,
      patient_cin: patient.cin,
    });

    return Response.json({
      found: true,
      patient: { full_name: patient.full_name, cin: patient.cin },
      requests: labRequests.map((r) => ({
        id: r.id,
        request_ref: r.request_id,
        date_requested: r.date_requested,
        status: r.status,
        tests: (r.tests || []).map((t) => t.name),
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}