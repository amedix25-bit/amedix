import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, writeAudit, unauthorized } from "../../shared/labTechnicianAuth.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

const MAX_BASE64_LENGTH = 4500000; // ~3.3 MB file

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Corrected results NEVER overwrite the original released result — the
// original result and file stay intact, a corrected PDF is attached with the
// responsible professional, reason and timestamp, and the complete history is
// preserved in both audit logs. The patient is notified of the correction.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
    if (!tech) return unauthorized();

    const requestId = String(body.lab_request_id || "");
    const correctionReason = String(body.correction_reason || "").trim().slice(0, 500);
    const fileB64 = String(body.file_b64 || "");
    const fileName = String(body.file_name || "").slice(0, 150);
    const fileType = String(body.file_type || "application/pdf").slice(0, 100);

    if (!requestId) return Response.json({ error: "Select the laboratory request." }, { status: 400 });
    if (!correctionReason) return Response.json({ error: "Enter the reason for the corrected result." }, { status: 400 });
    if (!fileB64 || !fileName) return Response.json({ error: "A corrected results PDF is required." }, { status: 400 });
    if (fileB64.length > MAX_BASE64_LENGTH) {
      return Response.json({ error: "File is too large. Maximum size is 3 MB." }, { status: 400 });
    }

    const found = await base44.asServiceRole.entities.LabRequest.filter({ id: requestId });
    const labRequest = found.find((r) => r.lab_id === tech.laboratory_id && r.authorized_by_patient === true);
    if (!labRequest) return Response.json({ error: "Request not found for your laboratory." }, { status: 404 });
    if (labRequest.status !== "results") {
      return Response.json({ error: "Results must be released before a correction can be issued." }, { status: 400 });
    }

    const file = new File([base64ToBytes(fileB64)], fileName, { type: fileType });
    const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const nowIso = new Date().toISOString();

    // The original result / result_file_url are deliberately left untouched.
    await base44.asServiceRole.entities.LabRequest.update(labRequest.id, {
      corrected_result_file_url: up.file_url,
      corrected_result_file_name: fileName,
      correction_reason: correctionReason,
      corrected_by_name: tech.full_name,
      corrected_datetime: nowIso,
    });

    await base44.asServiceRole.entities.PatientNotification.create({
      patient_id: labRequest.patient_id,
      type: "lab_results",
      title: "Corrected Laboratory Results Available",
      message: "A corrected version of your laboratory results is now available. The original result is preserved in your record.",
      target: "mylabresults",
      related_id: labRequest.id,
      event_date: nowIso.slice(0, 10),
    });

    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "result_corrected",
      details: `Corrected results issued for ${labRequest.request_id} by ${tech.full_name} — reason: ${correctionReason}. Original result preserved.`,
      patient_cin: labRequest.patient_cin,
    });

    await logClinicalAudit(base44, {
      actor_user_id: tech.created_by_id,
      actor_name: tech.full_name,
      actor_role: "laboratory",
      action: "corrected_lab_result",
      action_label: "issued a corrected laboratory result (original preserved)",
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