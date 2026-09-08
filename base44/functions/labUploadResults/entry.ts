import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, getVisitForTechnician, writeAudit, unauthorized } from "../../shared/labTechnicianAuth.ts";

const MAX_BASE64_LENGTH = 4500000; // ~3.3 MB file

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
    if (!tech) return unauthorized();

    const visit = await getVisitForTechnician(base44, tech, body.visit_id);
    if (!visit) return Response.json({ error: "Visit not found." }, { status: 404 });
    if (visit.status !== "tests_completed") {
      return Response.json(
        { error: "Mark the tests as completed before uploading results." },
        { status: 400 }
      );
    }

    const fileB64 = String(body.file_b64 || "");
    const fileName = String(body.file_name || "").slice(0, 150);
    const fileType = String(body.file_type || "application/octet-stream").slice(0, 100);
    if (!fileB64 || !fileName) return Response.json({ error: "A report file is required." }, { status: 400 });
    if (fileB64.length > MAX_BASE64_LENGTH) {
      return Response.json({ error: "File is too large. Maximum size is 3 MB." }, { status: 400 });
    }

    const file = new File([base64ToBytes(fileB64)], fileName, { type: fileType });
    const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const fileUrl = up.file_url;
    const nowIso = new Date().toISOString();

    await base44.asServiceRole.entities.LabPatientVisit.update(visit.id, {
      status: "results_uploaded",
      result_file_url: fileUrl,
      result_file_name: fileName,
      results_uploaded_at: nowIso,
    });

    await base44.asServiceRole.entities.LabNotification.create({
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      type: 'results_uploaded',
      title: 'Laboratory Results Uploaded',
      message: `Results report uploaded for ${visit.request_ref || "a lab request"} (${visit.patient_name}).`,
      patient_id: visit.patient_id,
      patient_name: visit.patient_name,
      patient_cin: visit.patient_cin,
      lab_request_id: visit.lab_request_id,
      request_ref: visit.request_ref || null,
      result_file_url: fileUrl,
      target: 'result',
      is_read: false,
    });

    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "results_uploaded",
      details: `Report uploaded: ${fileName}`,
      patient_cin: visit.patient_cin,
      visit_id: visit.id,
    });

    return Response.json({ ok: true, file_url: fileUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}