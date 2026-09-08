import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, unauthorized } from "../../shared/labTechnicianAuth.ts";

// The authorized patient view shared by the Lab Portal (logged-in lab user) and the
// Lab Technician Portal (technician session). If the patient has not explicitly
// authorized this laboratory, NOTHING identifiable is returned (403).
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const patientId = String(body.patient_id || "");
    if (!patientId) return Response.json({ error: "Missing patient." }, { status: 400 });

    let laboratoryId;
    if (body.technician_id) {
      const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
      if (!tech) return unauthorized();
      laboratoryId = tech.laboratory_id;
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
      const labs = await base44.entities.LaboratoryProfile.filter({ user_id: user.id });
      if (labs.length === 0) {
        return Response.json({ error: "Laboratory profile not found." }, { status: 403 });
      }
      laboratoryId = labs[0].id;
    }

    const requests = await base44.asServiceRole.entities.LabRequest.filter(
      { lab_id: laboratoryId },
      "-created_date",
      200
    );

    // The patient is only visible if they explicitly authorized this laboratory.
    const authorized = requests.filter(
      (r) => r.authorized_by_patient === true && r.patient_id === patientId
    );
    if (authorized.length === 0) {
      return Response.json(
        { error: "The patient has not authorized your laboratory to access their information." },
        { status: 403 }
      );
    }

    const latest = authorized[0];
    const patient = {
      patient_name: latest.patient_name,
      patient_cin: latest.patient_cin,
      patient_dob: latest.patient_dob || null,
      patient_gender: latest.patient_gender || null,
      patient_blood_type: latest.patient_blood_type || null,
    };

    const mappedRequests = authorized.map((r) => ({
      id: r.id,
      request_ref: r.request_id,
      date_requested: r.date_requested,
      created_date: r.created_date || null,
      status: r.status,
      doctor_name: r.doctor_name || null,
      tests: (r.tests || []).map((t) => t.name),
      pdf_url: r.pdf_url || null,
      result_file_url: r.result_file_url || null,
      result_file_name: r.result_file_name || null,
      date_completed: r.date_completed || null,
      payment_amount: r.payment_amount || null,
      payment_method: r.payment_method || null,
      result_submitted_by_name: r.result_submitted_by_name || null,
      authorization_datetime: r.authorization_datetime || null,
    }));

    const visits = (await base44.asServiceRole.entities.LabPatientVisit.filter(
      { patient_id: patientId },
      "-created_date",
      50
    ))
      .filter((v) => v.laboratory_id === laboratoryId)
      .map((v) => ({
        id: v.id,
        request_ref: v.request_ref,
        request_date: v.request_date,
        status: v.status,
        result_file_url: v.result_file_url || null,
        results_ready_at: v.results_ready_at || null,
      }));

    return Response.json({ patient, requests: mappedRequests, visits });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}