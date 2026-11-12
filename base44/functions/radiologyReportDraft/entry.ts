import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { canonicalStage, reportingLockReason, historyEntry } from "../../shared/radiologyWorkflow.ts";
import { authorizedFacilities, isAuthorizedForFacility } from "../../shared/radiologyMembership.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

const SECTION_LABELS = {
  indication: "Clinical Indication",
  examination_performed: "Examination Performed",
  technique: "Technique",
  comparison: "Comparison",
  findings: "Findings",
  impressions: "Impression",
  recommendations: "Recommendations",
  critical_findings: "Critical Findings",
};

// The interpretation as plain text — stored on the study so the signed report
// and the awaiting-signature state always describe the same content.
function composeReport(sections = {}) {
  return Object.entries(SECTION_LABELS)
    .filter(([key]) => String(sections[key] || "").trim())
    .map(([key, label]) => `${label}:\n${String(sections[key]).trim()}`)
    .join("\n\n");
}

// Persistent draft reports for the Radiologist Portal. The draft lives on its
// own ReportDraft record keyed to the imaging request — the underlying imaging
// record is never duplicated. One draft per radiologist per study.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const requestId = String(payload.request_id || "").trim();
    if (!requestId) return Response.json({ error: "Select the imaging request." }, { status: 400 });

    const profiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id });
    const radiologist = profiles[0];
    if (!radiologist || radiologist.status !== "active") {
      return Response.json({ error: "Only active radiologists can save report drafts." }, { status: 403 });
    }

    const found = await base44.asServiceRole.entities.ImagingRequest.filter({ id: requestId });
    const request = found[0];
    if (!request) return Response.json({ error: "Imaging request not found." }, { status: 404 });

    const authorized =
      (request.authorized_radiologist_user_ids || []).includes(user.id) ||
      request.assigned_radiologist_user_id === user.id ||
      isAuthorizedForFacility(
        await authorizedFacilities(base44, radiologist),
        request.routed_hospital_user_id,
        request.routed_hospital
      );
    if (!authorized) {
      return Response.json({ error: "This study is not available for you." }, { status: 403 });
    }

    const stage = canonicalStage(request.workflow_status);
    if (["released", "cancelled"].includes(stage)) {
      return Response.json({ error: "This study is closed — drafts are no longer editable." }, { status: 400 });
    }

    // Reporting stays locked until the examination is completed and the images
    // are received and verified — the reason is returned so the radiologist
    // sees exactly what is missing.
    if (payload.action !== "delete") {
      const lockReason = reportingLockReason(request);
      if (lockReason) return Response.json({ error: lockReason }, { status: 400 });
    }

    // One reporting radiologist per study — the claim holder is the only one
    // who may write the report. Every other radiologist may still view it.
    if (payload.action !== "delete" &&
        request.assigned_radiologist_user_id &&
        request.assigned_radiologist_user_id !== user.id) {
      return Response.json({
        error: `This study is being reported by ${request.assigned_radiologist_name || "another radiologist"}. You can view the study and its status, but the report can only be edited by the assigned radiologist.`,
      }, { status: 409 });
    }



    const now = new Date().toISOString();
    const draftData: Record<string, any> = {
      request_id: request.id,
      request_ref: request.request_id || "",
      radiologist_user_id: user.id,
      radiologist_name: radiologist.full_name,
      sections: payload.sections && typeof payload.sections === "object" ? payload.sections : {},
      updated_datetime: now,
    };

    // Report lifecycle: a plain save keeps whatever state the draft is in, so
    // autosave never silently downgrades a submitted preliminary report. The
    // radiologist explicitly submits a preliminary report, which is what makes
    // the case wait for electronic signature.
    if (payload.status === "preliminary" || payload.status === "draft") {
      draftData.status = payload.status;
      if (payload.status === "preliminary") {
        draftData.preliminary_datetime = now;
        draftData.preliminary_by_name = radiologist.full_name;
      }
    }

    if (payload.action === "delete") {
      const existing = await base44.asServiceRole.entities.ReportDraft.filter({
        request_id: request.id,
        radiologist_user_id: user.id,
      });
      if (existing.length) {
        await base44.asServiceRole.entities.ReportDraft.delete(existing[0].id);
      }
      return Response.json({ ok: true, deleted: true });
    }

    const existing = await base44.asServiceRole.entities.ReportDraft.filter({
      request_id: request.id,
      radiologist_user_id: user.id,
    });
    let draft;
    if (existing.length) {
      draft = await base44.asServiceRole.entities.ReportDraft.update(existing[0].id, draftData);
    } else {
      draft = await base44.asServiceRole.entities.ReportDraft.create(draftData);
    }

    // Automatic status transitions on the study itself:
    //   Ready for Reporting → Reporting in Progress (first save by the
    //   assigned radiologist), then → Awaiting Signature when the
    //   interpretation is submitted for signature.
    if (payload.action !== "delete") {
      const currentStage = canonicalStage(request.workflow_status);
      const mine = request.assigned_radiologist_user_id === user.id;
      if (mine && payload.status === "preliminary" &&
          ["ready_for_reporting", "performed", "examination_completed", "reporting_in_progress", "interpretation"].includes(currentStage)) {
        await base44.asServiceRole.entities.ImagingRequest.update(request.id, {
          workflow_status: "awaiting_signature",
          reporting_datetime: request.reporting_datetime || now,
          report: composeReport(draftData.sections),
          updated_datetime: now,
          status_history: historyEntry(
            request, "submit_for_signature", String(request.workflow_status), "awaiting_signature",
            radiologist.full_name, "radiologist", "Interpretation submitted — awaiting electronic signature"
          ),
        });
        try {
          await logClinicalAudit(base44, {
            actor_user_id: user.id,
            actor_name: radiologist.full_name,
            actor_role: "radiologist",
            action: "radiology_report_awaiting_signature",
            action_label: "submitted the interpretation for signature",
            patient_id: request.patient_id,
            patient_cin: request.patient_cin,
            patient_name: request.patient_name,
            encounter_id: request.encounter_id || "",
            document_id: request.request_id,
            hospital: request.routed_hospital || request.doctor_hospital || "",
          });
        } catch (e) { /* audit never blocks the save */ }
      } else if (mine && ["ready_for_reporting", "performed", "examination_completed"].includes(currentStage)) {
        await base44.asServiceRole.entities.ImagingRequest.update(request.id, {
          workflow_status: "reporting_in_progress",
          reporting_datetime: now,
          updated_datetime: now,
          status_history: historyEntry(
            request, "start_reporting", String(request.workflow_status), "reporting_in_progress",
            radiologist.full_name, "radiologist", "Started reporting this study"
          ),
        });
      }
    }

    return Response.json({ ok: true, draft });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}