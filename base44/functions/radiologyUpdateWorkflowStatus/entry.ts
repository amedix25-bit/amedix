import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { TRANSITIONS, applyTransition, setAssignment, historyEntry, canonicalStage } from "../../shared/radiologyWorkflow.ts";
import { authorizedFacilities, isAuthorizedForFacility } from "../../shared/radiologyMembership.ts";
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

    // ===== Study ownership — claim / release work / second-opinion request =====
    // The study always belongs to the department workflow; assignment only
    // records who is actively working on it. One radiologist at a time.
    if (["claim_study", "release_work", "request_second_opinion"].includes(rawAction)) {
      const radProfiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id });
      const radiologist = radProfiles[0];
      if (!radiologist || radiologist.status !== "active") {
        return Response.json({ error: "Only active radiologists can perform this action." }, { status: 403 });
      }
      const authorizedByPatient = (request.authorized_radiologist_user_ids || []).includes(user.id);
      const isAssignedToMe = request.assigned_radiologist_user_id === user.id;
      const auth = await authorizedFacilities(base44, radiologist);
      const isFacilityRadiologist = isAuthorizedForFacility(
        auth, request.routed_hospital_user_id, request.routed_hospital
      );
      const stage = canonicalStage(request.workflow_status);

      if (rawAction === "claim_study") {
        if (!authorizedByPatient && !isFacilityRadiologist) {
          return Response.json({ error: "This study is not available for you to claim." }, { status: 403 });
        }
        if (request.assigned_radiologist_user_id) {
          return Response.json({
            error: request.assigned_radiologist_user_id === user.id
              ? "This study is already assigned to you."
              : "This study was just claimed by another radiologist.",
          }, { status: 409 });
        }
        if (!["ready_for_reporting", "performed", "examination_completed"].includes(stage)) {
          return Response.json({ error: "This study is not ready for reporting yet." }, { status: 400 });
        }
        const updated = await setAssignment(base44, request, {
          action: "claimed",
          radiologist_user_id: user.id,
          radiologist_name: radiologist.full_name,
          by_name: radiologist.full_name,
          reason: String(payload.reason || "Claimed from the Radiologist Portal"),
        });
        return Response.json({ ok: true, imaging_request: updated });
      }

      if (rawAction === "release_work") {
        if (!isAssignedToMe) {
          return Response.json({ error: "This study is not assigned to you." }, { status: 403 });
        }
        const unassigned = await setAssignment(base44, request, {
          action: "unassigned",
          by_name: radiologist.full_name,
          reason: String(payload.reason || "Released back to the department pool"),
        });
        if (["reporting_in_progress", "interpretation"].includes(stage)) {
          const history = Array.isArray(unassigned.status_history) ? [...unassigned.status_history] : [];
          history.push({
            action: "work_released",
            from: "reporting_in_progress",
            to: "ready_for_reporting",
            by_name: radiologist.full_name,
            by_role: "radiologist",
            datetime: new Date().toISOString(),
            note: String(payload.reason || "Released back to the department pool"),
          });
          await base44.asServiceRole.entities.ImagingRequest.update(request.id, {
            workflow_status: "ready_for_reporting",
            updated_datetime: new Date().toISOString(),
            status_history: history,
          });
        }
        return Response.json({ ok: true });
      }

      // request_second_opinion — a controlled request routed to the
      // department, which decides on reassignment or collaboration.
      if (!authorizedByPatient && !isAssignedToMe) {
        return Response.json({ error: "Only a radiologist working on this study can request a second opinion." }, { status: 403 });
      }
      if (["final_report", "released", "cancelled"].includes(stage)) {
        return Response.json({ error: "This study is already closed." }, { status: 400 });
      }
      const note = String(payload.note || "").trim();
      if (!note) return Response.json({ error: "Describe why you are requesting a second opinion." }, { status: 400 });
      await base44.asServiceRole.entities.ImagingRequest.update(request.id, {
        status_history: historyEntry(request, "second_opinion_requested", stage, stage, radiologist.full_name, "radiologist", note),
        updated_datetime: new Date().toISOString(),
      });
      return Response.json({ ok: true });
    }

    // ===== Amend a finalized report (Phase 5.4) =====
    // A finalized report is NEVER silently overwritten: the amendment is a
    // documented correction, linked to the original signed version.
    if (rawAction === "amend_report") {
      const radProfiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id });
      const radiologist = radProfiles[0];
      if (!radiologist || radiologist.status !== "active") {
        return Response.json({ error: "Only active radiologists can amend reports." }, { status: 403 });
      }
      const authorizedByPatient = (request.authorized_radiologist_user_ids || []).includes(user.id);
      if (!authorizedByPatient && request.assigned_radiologist_user_id !== user.id) {
        return Response.json({ error: "Only a radiologist working on this study can amend the report." }, { status: 403 });
      }
      const stage = canonicalStage(request.workflow_status);
      if (!["final_report", "released"].includes(stage)) {
        return Response.json({ error: "Only a finalized report can be amended." }, { status: 400 });
      }
      const reportText = String(payload.report || "").trim();
      if (!reportText) return Response.json({ error: "The amended report text is required." }, { status: 400 });
      const reason = String(payload.amendment_reason || "").trim();
      if (!reason) return Response.json({ error: "Document the reason for the amendment." }, { status: 400 });

      const nowIso = new Date().toISOString();
      const versions = await base44.asServiceRole.entities.RadiologyReportVersion.filter(
        { imaging_request_id: request.id }, { sort: "-version", limit: 1 });
      const latest = versions.items[0] || null;
      const newVersion = latest ? latest.version + 1 : 2;

      const update: Record<string, any> = {
        report: reportText,
        updated_datetime: nowIso,
        status_history: (() => {
          const h = Array.isArray(request.status_history) ? [...request.status_history] : [];
          h.push({
            action: "report_amended",
            from: stage,
            to: stage,
            by_name: radiologist.full_name,
            by_role: "radiologist",
            datetime: nowIso,
            note: reason,
          });
          return h;
        })(),
      };
      if (String(payload.report_pdf_url || "").trim()) update.report_file_url = String(payload.report_pdf_url).trim();
      await base44.asServiceRole.entities.ImagingRequest.update(request.id, update);
      await base44.asServiceRole.entities.RadiologyReportVersion.create({
        imaging_request_id: request.id,
        request_ref: request.request_id || "",
        patient_id: request.patient_id,
        patient_user_id: request.patient_user_id || "",
        patient_cin: request.patient_cin || "",
        patient_name: request.patient_name || "",
        doctor_user_id: request.doctor_user_id || "",
        radiologist_user_id: user.id,
        radiologist_name: radiologist.full_name,
        version: newVersion,
        report_text: reportText,
        report_pdf_url: String(payload.report_pdf_url || ""),
        sections: payload.sections && typeof payload.sections === "object" ? payload.sections : {},
        is_amendment: true,
        amendment_reason: reason,
        original_version_id: latest ? latest.id : "",
        signed_datetime: nowIso,
        signed_by_name: radiologist.full_name,
      });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: radiologist.full_name,
        actor_role: "radiologist",
        action: "radiology_report_amended",
        action_label: `amended radiology report to version ${newVersion}`,
        patient_id: request.patient_id,
        patient_cin: request.patient_cin,
        patient_name: request.patient_name,
        encounter_id: request.encounter_id,
        document_id: request.request_id,
        hospital: request.routed_hospital || request.doctor_hospital,
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

    // Claim-first — a study is taken from the shared unclaimed queue (or
    // assigned by the department) before any radiologist reports on it.
    if (transition.actor === "radiologist" && transition.require_assignment &&
        request.assigned_radiologist_user_id !== user.id) {
      return Response.json(
        { error: "Take this case from the unclaimed queue before reporting on it." },
        { status: 409 }
      );
    }

    const updated = await applyTransition(base44, request, action, {
      name: user.full_name || (isDepartment ? "Radiology Department" : request.doctor_name || ""),
      role: transition.actor,
      userId: user.id,
      payload,
    });

    // Report integrity (Phase 5.3) — every finalized report is preserved as
    // an immutable signed version record carrying the study association, the
    // reporting radiologist identity, the sign-off date and time and the
    // report version. Duplicate finalization is impossible (the transition
    // only runs from ready_for_reporting / reporting_in_progress).
    if (action === "finalize_report") {
      try {
        const versions = await base44.asServiceRole.entities.RadiologyReportVersion.filter(
          { imaging_request_id: request.id }, { sort: "-version", limit: 1 });
        const nextVersion = ((versions.items[0] && versions.items[0].version) || 0) + 1;
        await base44.asServiceRole.entities.RadiologyReportVersion.create({
          imaging_request_id: request.id,
          request_ref: request.request_id || "",
          patient_id: request.patient_id,
          patient_user_id: request.patient_user_id || "",
          patient_cin: request.patient_cin || "",
          patient_name: request.patient_name || "",
          doctor_user_id: request.doctor_user_id || "",
          radiologist_user_id: user.id,
          radiologist_name: radiologist ? radiologist.full_name : "",
          version: nextVersion,
          report_text: String(payload.report || request.report || ""),
          report_pdf_url: String(payload.report_pdf_url || ""),
          sections: payload.sections && typeof payload.sections === "object" ? payload.sections : {},
          is_amendment: false,
          original_version_id: "",
          signed_datetime: new Date().toISOString(),
          signed_by_name: radiologist ? radiologist.full_name : "",
        });
      } catch (err) {
        console.error("Report version recording failed:", err);
      }
    }

    return Response.json({ ok: true, imaging_request: updated });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}