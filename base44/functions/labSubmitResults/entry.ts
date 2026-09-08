import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, writeAudit, unauthorized } from "../../shared/labTechnicianAuth.ts";

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

    const requestId = String(body.lab_request_id || "");
    const paymentAmount = String(body.payment_amount || "").trim().slice(0, 30);
    const paymentMethod = String(body.payment_method || "").trim().slice(0, 50);
    const fileB64 = String(body.file_b64 || "");
    const fileName = String(body.file_name || "").slice(0, 150);
    const fileType = String(body.file_type || "application/pdf").slice(0, 100);

    if (!requestId) return Response.json({ error: "Select the laboratory request." }, { status: 400 });
    if (!fileB64 || !fileName) return Response.json({ error: "A results PDF is required." }, { status: 400 });
    if (fileB64.length > MAX_BASE64_LENGTH) {
      return Response.json({ error: "File is too large. Maximum size is 3 MB." }, { status: 400 });
    }
    if (!paymentAmount) return Response.json({ error: "Enter the payment amount collected." }, { status: 400 });
    if (!paymentMethod) return Response.json({ error: "Select or enter the payment method." }, { status: 400 });

    // The request — and only this request — defines the patient. Nothing client-supplied
    // can move the results or payment onto another patient.
    const found = await base44.asServiceRole.entities.LabRequest.filter({ id: requestId });
    const labRequest = found.find((r) => r.lab_id === tech.laboratory_id && r.authorized_by_patient === true);
    if (!labRequest) return Response.json({ error: "Request not found for your laboratory." }, { status: 404 });
    if (!["authorized", "pending"].includes(labRequest.status)) {
      return Response.json({ error: "This request already has submitted results." }, { status: 400 });
    }

    const file = new File([base64ToBytes(fileB64)], fileName, { type: fileType });
    const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    // Associate results + payment with the exact request, and mark it completed
    await base44.asServiceRole.entities.LabRequest.update(labRequest.id, {
      status: "results",
      result_file_url: up.file_url,
      result_file_name: fileName,
      result: "Laboratory report uploaded and available to the patient.",
      date_completed: today,
      payment_amount: paymentAmount,
      payment_method: paymentMethod,
      payment_datetime: nowIso,
      result_submitted_by_name: tech.full_name,
    });

    // Keep any in-progress visit for this request in sync
    const visits = await base44.asServiceRole.entities.LabPatientVisit.filter({ lab_request_id: labRequest.id });
    for (const v of visits) {
      if (v.laboratory_id !== tech.laboratory_id) continue;
      await base44.asServiceRole.entities.LabPatientVisit.update(v.id, {
        status: "patient_notified",
        result_file_url: up.file_url,
        result_file_name: fileName,
        results_uploaded_at: nowIso,
        results_ready_at: nowIso,
      });
    }

    // Secure patient access — results appear in the patient's My Lab Results section
    await base44.asServiceRole.entities.PatientLabResult.create({
      patient_id: labRequest.patient_id,
      patient_cin: labRequest.patient_cin,
      patient_name: labRequest.patient_name,
      test_type: (labRequest.tests || []).map((t) => t.name).join(", ") || "Laboratory tests",
      test_date: labRequest.date_requested || today,
      lab_name: labRequest.lab_name || tech.laboratory_name,
      file_url: up.file_url,
      file_name: fileName,
      submitted_date: nowIso,
      submitted_by_name: `${tech.laboratory_name} — ${tech.full_name}`,
    });

    await base44.asServiceRole.entities.PatientNotification.create({
      patient_id: labRequest.patient_id,
      type: "lab_results",
      title: "Laboratory Results Available",
      message: "Your laboratory results are now available.",
      target: "mylabresults",
      related_id: labRequest.id,
      event_date: today,
    });

    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "results_uploaded",
      details: `Results and payment submitted for ${labRequest.request_id} — amount: ${paymentAmount}, method: ${paymentMethod}`,
      patient_cin: labRequest.patient_cin,
    });
    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "patient_notified",
      details: "Patient notified: your laboratory results are now available.",
      patient_cin: labRequest.patient_cin,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}