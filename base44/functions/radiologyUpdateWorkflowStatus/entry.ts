import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { TRANSITIONS, applyTransition } from "../../shared/radiologyWorkflow.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Radiology workflow transitions — the shared one-workflow chain
// (requested → under_review → accepted/clarification → scheduled →
// in_progress → examination_completed → images → ready_for_reporting →
// reporting_in_progress → final_report → released, cancel from any active
// stage). Callers allowed here: the patient-authorized radiologist, the
// assigned radiologist, the facility's radiology department, or the
// requesting doctor (clarification response only).
const ALIASES: Record<string, string> = {
  perform: "complete_examination",
  start_interpretation: "start_reporting",
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    const requestId = String(payload.request_id || "");
    const rawAction = String(payload.action || "");
    if (!requestId) return Response.json({ error: "Select the imaging request." }, { status: 400 });

    const found = await base44.asServiceRole.entities.ImagingRequest.filter({ id: requestId });
    const request = found[0];
    if (!request) return Response.json({ error: "Imaging request not found." }, { status: 404 });

    // ===== Critical Finding Notification =====
    if (rawAction === "flag_critical") {
      const radProfiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id });
      const radiologist = radProfiles[0];
      if (!radiologist) return Response.json({ error: "Only radiologists can flag critical findings." }, { status: 403 });
      if (!(request.authorized_radiologist_user_ids || []).includes(user.id) && request.assigned_radiologist_user_id !== user.id) {
        return Response.json({ error: "Imaging request not authorized for you." }, { status: 403 });
      }
      if (request.is_critical) return Response.json({ ok: true, already_flagged: true });
      const nowIso = new Date().toISOString();
      await base44.asServiceRole.entities.ImagingRequest.update(request.id, {
        is_critical: true,
        critical_notified_datetime: nowIso,
      });
      if (request.doctor_user_id) {
        await base44.asServiceRole.entities.DoctorNotification.create({
          doctor_user_id: request.doctor_user_id,
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

    const action = ALIASES[rawAction] || rawAction;
    const transition = TRANSITIONS[action];
    if (!transition) return Response.json({ error: "Unknown workflow action." }, { status: 400 });

    // ===== Resolve acting roles =====
    const [radProfiles, hospitalProfiles] = await Promise.all([
      base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id }),
      base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id }),
    ]);
    const radiologist = radProfiles[0] || null;
    const hospital = hospitalProfiles[0] || null;

    const isAuthorizedRadiologist = !!radiologist && (
      (request.authorized_radiologist_user_ids || []).includes(user.id) ||
      request.assigned_radiologist_user_id === user.id
    );
    const isDepartment = !!hospital && !!hospital.radiology_department_enabled && request.routed_hospital_user_id === user.id;
    const isRequestingDoctor = request.doctor_user_id === user.id;

    const allowed =
      (transition.actor === "department" && isDepartment) ||
      (transition.actor === "radiologist" && isAuthorizedRadiologist) ||
      (transition.actor === "doctor" && isRequestingDoctor);
    if (!allowed) {
      return Response.json({ error: "You are not allowed to perform this action on this request." }, { status: 403 });
    }

    // Never two radiologists independently reporting the same study.
    if (transition.actor === "radiologist" &&
        request.assigned_radiologist_user_id &&
        request.assigned_radiologist_user_id !== user.id) {
      return Response.json(
        { error: "This study is assigned to another radiologist — ask the department to reassign it." },
        { status: 409 }
      );
    }

    const updated = await applyTransition(base44, request, action, {
      name: user.full_name || (isDepartment ? "Radiology Department" : request.doctor_name || ""),
      role: transition.actor,
      userId: user.id,
      payload,
    });

    return Response.json({ ok: true, imaging_request: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}