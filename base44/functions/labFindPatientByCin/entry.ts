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

    let patient = null;
    if (cin.startsWith("LR-")) {
      // Scanned/entered request barcode — resolve the patient through the authorized lab request
      const requests = await base44.asServiceRole.entities.LabRequest.filter({ request_id: cin });
      const req = requests.find((r) => r.authorized_by_patient === true && r.lab_id === tech.laboratory_id);
      if (!req) {
        return Response.json({
          found: false,
          message: "No authorized request found for your laboratory with that reference.",
        });
      }
      const profiles = await base44.asServiceRole.entities.PatientProfile.filter({ id: req.patient_id });
      if (profiles.length === 0) {
        return Response.json({ found: false, message: "No patient found for that request." });
      }
      patient = profiles[0];
    } else {
      const profiles = await base44.asServiceRole.entities.PatientProfile.filter({ cin });
      if (profiles.length === 0) {
        return Response.json({ found: false, message: "No patient found with that CIN." });
      }
      patient = profiles[0];
    }

    const requests = await base44.asServiceRole.entities.LabRequest.filter({ patient_id: patient.id });
    const labRequests = requests.filter(
      (r) =>
        r.authorized_by_patient === true &&
        r.lab_id === tech.laboratory_id &&
        ["authorized", "pending"].includes(r.status)
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