import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, writeAudit, unauthorized } from "../../shared/labTechnicianAuth.ts";

// Resolves a Laboratory Request scanned from the QR code printed on the Lab
// Request PDF. The QR contains ONLY the unique request reference (LR-...) —
// never any patient data. The technician must be logged in with a valid
// session, and their laboratory must be the one the patient explicitly
// authorized for this request. Scanning never creates or duplicates a request:
// it only opens the existing request linked to that QR code.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
    if (!tech) return unauthorized();

    const ref = String(body.request_ref || "").trim().toUpperCase();
    if (!ref.startsWith("LR-")) {
      return Response.json({ error: "Invalid or unavailable laboratory request." }, { status: 404 });
    }

    const requests = await base44.asServiceRole.entities.LabRequest.filter({ request_id: ref });
    const labReq = requests[0];
    if (!labReq) {
      return Response.json({ error: "Invalid or unavailable laboratory request." }, { status: 404 });
    }

    if (labReq.authorized_by_patient !== true || labReq.lab_id !== tech.laboratory_id) {
      return Response.json(
        { error: "Access Denied \u2014 You are not authorized to view this laboratory request." },
        { status: 403 }
      );
    }

    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "patient_identified",
      details: `Request ${labReq.request_id} identified by QR code scan`,
      patient_cin: labReq.patient_cin,
    });

    return Response.json({
      request: {
        id: labReq.id,
        request_ref: labReq.request_id,
        date_requested: labReq.date_requested,
        created_date: labReq.created_date || null,
        status: labReq.status,
        patient_name: labReq.patient_name,
        patient_cin: labReq.patient_cin,
        patient_dob: labReq.patient_dob || null,
        patient_gender: labReq.patient_gender || null,
        patient_blood_type: labReq.patient_blood_type || null,
        doctor_name: labReq.doctor_name || null,
        doctor_specialization: labReq.doctor_specialization || null,
        doctor_hospital: labReq.doctor_hospital || null,
        tests: labReq.tests || [],
        indication: labReq.indication || null,
        clinical_info: labReq.clinical_info || null,
        instructions: labReq.instructions || null,
        pdf_url: labReq.pdf_url || null,
        result_file_url: labReq.result_file_url || null,
        result_file_name: labReq.result_file_name || null,
        date_completed: labReq.date_completed || null,
        authorization_datetime: labReq.authorization_datetime || null,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}