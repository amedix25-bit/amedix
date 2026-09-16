import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Imaging Worklist for the authorized radiologist — every imaging request the
// PATIENT authorized THIS radiologist for (per-request authorization), with
// its radiology workflow stage (Request → Scheduled → Performed →
// Interpretation → Final Report → Released). The radiologist never sees
// requests — or any other patient information — they are not authorized to
// access.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id });
    const radiologist = profiles[0];
    if (!radiologist) {
      return Response.json({ error: "Only radiologists can view the imaging worklist." }, { status: 403 });
    }

    const requests = await base44.asServiceRole.entities.ImagingRequest.filter(
      { authorized_radiologist_user_ids: user.id },
      "-request_datetime",
      200
    );

    const worklist = requests.map((r) => ({
      id: r.id,
      request_id: r.request_id,
      patient_id: r.patient_id,
      patient_cin: r.patient_cin,
      patient_name: r.patient_name,
      doctor_name: r.doctor_name,
      doctor_hospital: r.doctor_hospital,
      scan_type: r.scan_type,
      examination: r.examination,
      clinical_indication: r.clinical_indication,
      working_diagnosis: r.working_diagnosis,
      priority: r.priority,
      request_datetime: r.request_datetime,
      encounter_id: r.encounter_id,
      workflow_status: r.workflow_status || "requested",
      is_critical: r.is_critical || false,
      has_report: !!(r.report || r.report_file_url),
    }));

    return Response.json({ worklist });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}