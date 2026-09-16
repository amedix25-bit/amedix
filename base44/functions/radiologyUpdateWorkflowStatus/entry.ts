import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Radiology workflow transitions — Request → Scheduled → Performed →
// Interpretation → Final Report → Released — plus the Critical Finding
// notification. Only a radiologist the PATIENT authorized for THIS SPECIFIC
// request can act on it, and every transition is timestamped and recorded in
// the Audit Log. Releasing the report completes the request; nothing is ever
// deleted or overwritten.
const NEXT_STEPS: Record<string, { from: string; to: string; field: string; label: string }> = {
  schedule: { from: "requested", to: "scheduled", field: "scheduled_datetime", label: "scheduled the imaging" },
  perform: { from: "scheduled", to: "performed", field: "performed_datetime", label: "marked the imaging performed" },
  start_interpretation: { from: "performed", to: "interpretation", field: "interpretation_datetime", label: "started interpretation" },
  finalize_report: { from: "interpretation", to: "final_report", field: "final_report_datetime", label: "finalized the final radiology report" },
  release: { from: "final_report", to: "released", field: "released_datetime", label: "released the radiology report to the patient record" },
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    const requestId = String(payload.request_id || "");
    const action = String(payload.action || "");
    if (!requestId) return Response.json({ error: "Select the imaging request." }, { status: 400 });

    const profiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id });
    const radiologist = profiles[0];
    if (!radiologist) return Response.json({ error: "Only radiologists can update the imaging workflow." }, { status: 403 });

    const found = await base44.asServiceRole.entities.ImagingRequest.filter({ id: requestId });
    const request = found.find((r) => (r.authorized_radiologist_user_ids || []).includes(user.id));
    if (!request) return Response.json({ error: "Imaging request not found or not authorized for you." }, { status: 404 });

    const nowIso = new Date().toISOString();

    // ===== Critical Finding Notification =====
    if (action === "flag_critical") {
      if (request.is_critical) return Response.json({ ok: true, already_flagged: true });
      await base44.asServiceRole.entities.ImagingRequest.update(request.id, {
        is_critical: true,
        critical_notified_datetime: nowIso,
      });
      let doctorUserId: string | null = null;
      try {
        const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ id: request.doctor_id });
        doctorUserId = doctors[0]?.user_id || null;
      } catch (e) {
        doctorUserId = null;
      }
      if (doctorUserId) {
        await base44.asServiceRole.entities.DoctorNotification.create({
          doctor_user_id: doctorUserId,
          doctor_id: request.doctor_id,
          type: "critical_finding",
          title: "CRITICAL Imaging Finding",
          message: `Critical finding on ${request.request_id} (${request.scan_type} — ${request.examination}) for ${request.patient_name}. Please review urgently.`,
          patient_id: request.patient_id,
          patient_name: request.patient_name,
          patient_cin: request.patient_cin,
          imaging_request_id: request.id,
          request_ref: request.request_id,
          scan_type: request.scan_type,
          examination: request.examination,
          target: "find_patient",
          datetime: nowIso,
          is_read: false,
        });
      }
      await base44.asServiceRole.entities.PatientNotification.create({
        patient_id: request.patient_id,
        type: "imaging_critical",
        title: "Important Imaging Result",
        message: "An important finding was identified on your imaging. Your doctor has been notified — please contact your doctor.",
        target: "imaging",
        related_id: request.id,
        event_date: nowIso.slice(0, 10),
      });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: radiologist.full_name,
        actor_role: "radiologist",
        action: "critical_finding_notified",
        action_label: "notified a critical imaging finding",
        patient_id: request.patient_id,
        patient_cin: request.patient_cin,
        patient_name: request.patient_name,
        encounter_id: request.encounter_id,
        document_id: request.request_id,
        hospital: request.doctor_hospital,
      });
      return Response.json({ ok: true });
    }

    // ===== Forward workflow transitions =====
    const step = NEXT_STEPS[action];
    if (!step) return Response.json({ error: "Unknown workflow action." }, { status: 400 });
    const current = request.workflow_status || "requested";
    if (current !== step.from) {
      return Response.json(
        { error: `This request is at the "${current}" stage — that action is not available now.` },
        { status: 400 }
      );
    }
    if (action === "finalize_report" && !request.report && !request.report_file_url) {
      return Response.json({ error: "Submit the radiology report before finalizing it." }, { status: 400 });
    }

    const update: Record<string, any> = { workflow_status: step.to, [step.field]: nowIso };
    if (action === "release") {
      update.status = "completed";
      update.date_completed = nowIso.slice(0, 10);
    }
    await base44.asServiceRole.entities.ImagingRequest.update(request.id, update);

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: radiologist.full_name,
      actor_role: "radiologist",
      action: `imaging_${action}`,
      action_label: step.label,
      patient_id: request.patient_id,
      patient_cin: request.patient_cin,
      patient_name: request.patient_name,
      encounter_id: request.encounter_id,
      document_id: request.request_id,
      hospital: request.doctor_hospital,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}