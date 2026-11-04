import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { canonicalStage } from "../../shared/radiologyWorkflow.ts";
import { authorizedFacilities, isAuthorizedForFacility } from "../../shared/radiologyMembership.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Authorized clinical context for the radiologist's study review screen —
// the minimum authorized information for interpretation, never the entire
// patient record. Access is granted only to the assigned radiologist, a
// radiologist the patient authorized for this request, or an active
// radiologist of the same facility's claimable pool.
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
      return Response.json({ error: "Only active radiologists can review studies." }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const found = await svc.entities.ImagingRequest.filter({ id: requestId });
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
      return Response.json({ error: "You are not authorized to view this study." }, { status: 403 });
    }

    // Audit trail — every study access is recorded (Phase 9 auditability).
    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: radiologist.full_name,
      actor_role: "radiologist",
      action: "radiology_study_accessed",
      action_label: "opened a radiology study for review",
      patient_id: request.patient_id,
      patient_cin: request.patient_cin,
      patient_name: request.patient_name,
      encounter_id: request.encounter_id,
      document_id: request.request_id,
      hospital: request.routed_hospital || request.doctor_hospital,
    });

    const stage = canonicalStage(request.workflow_status);
    const safeRequest = {
      id: request.id,
      request_id: request.request_id,
      patient_id: request.patient_id,
      patient_cin: request.patient_cin,
      patient_name: request.patient_name,
      doctor_name: request.doctor_name,
      doctor_specialization: request.doctor_specialization || "",
      doctor_hospital: request.doctor_hospital || "",
      routed_hospital: request.routed_hospital || request.doctor_hospital || "",
      scan_type: request.scan_type,
      examination: request.examination,
      body_part: request.body_part || "",
      clinical_indication: request.clinical_indication || "",
      working_diagnosis: request.working_diagnosis || "",
      priority: request.priority || "Routine",
      requested_date: request.requested_date || "",
      request_datetime: request.request_datetime || "",
      scheduled_datetime: request.scheduled_datetime || null,
      performed_datetime: request.performed_datetime || null,
      images_received_datetime: request.images_received_datetime || null,
      reporting_datetime: request.reporting_datetime || null,
      final_report_datetime: request.final_report_datetime || null,
      released_datetime: request.released_datetime || null,
      encounter_id: request.encounter_id || "",
      workflow_status: request.workflow_status || "requested",
      stage,
      contrast: request.contrast || "",
      contrast_allergy: request.contrast_allergy || "",
      previous_contrast_reaction: request.previous_contrast_reaction || "",
      mri_metal_implant: request.mri_metal_implant || "",
      mri_pacemaker: request.mri_pacemaker || "",
      mri_other_device: request.mri_other_device || "",
      mri_metallic_foreign_body: request.mri_metallic_foreign_body || "",
      mri_other_concern: request.mri_other_concern || "",
      preparation_notes: request.preparation_notes || "",
      image_file_urls: request.image_file_urls || [],
      image_notes: request.image_notes || "",
      study_instance_uid: request.study_instance_uid || "",
      accession_number: request.accession_number || "",
      report: request.report || "",
      report_file_url: request.report_file_url || "",
      pdf_url: request.pdf_url || "",
      is_critical: !!request.is_critical,
      assigned_radiologist_user_id: request.assigned_radiologist_user_id || null,
      assigned_radiologist_name: request.assigned_radiologist_name || null,
      assigned_datetime: request.assigned_datetime || null,
      assignment_history: request.assignment_history || [],
      authorized_by_patient: (request.authorized_radiologist_user_ids || []).includes(user.id),
    };

    const [patientPage, conditionsPage, priorRequestsPage, priorResultsPage, versionsPage, commLogsPage] =
      await Promise.all([
        svc.entities.PatientProfile.filter({ id: request.patient_id }, { limit: 1 }),
        svc.entities.MedicalCondition.filter({ patient_id: request.patient_id }, { limit: 100 }),
        svc.entities.ImagingRequest.filter({ patient_id: request.patient_id }, { sort: "-request_datetime", limit: 100 }),
        svc.entities.ImagingResult.filter({ patient_id: request.patient_id }, { sort: "-created_datetime", limit: 100 }),
        svc.entities.RadiologyReportVersion.filter({ imaging_request_id: request.id }, { sort: "-version", limit: 50 }),
        svc.entities.CriticalFindingLog.filter({ imaging_request_id: request.id }, { limit: 100 }),
      ]);
    const patient = patientPage.items[0] || null;

    // Matched imaging studies and their series — only the studies that are
    // actually linked to THIS request (by request id or by the verified Study
    // Instance UID). Nothing is inferred: an unmatched request returns none.
    const studyPage = await svc.entities.ImagingStudy.filter(
      request.study_instance_uid
        ? { $or: [{ imaging_request_id: request.id }, { study_instance_uid: request.study_instance_uid }] }
        : { imaging_request_id: request.id },
      { limit: 5 }
    );
    const matchedStudies = studyPage.items || [];
    const seriesPage = matchedStudies.length
      ? await svc.entities.ImagingSeries.filter(
          { study_id: { $in: matchedStudies.map((s: any) => s.id) } },
          { sort: "series_number", limit: 200 }
        )
      : { items: [] as any[] };

    // Report lifecycle state for this study — drafts (including a preliminary
    // report awaiting signature) across the facility's radiologists.
    const draftsPage = await svc.entities.ReportDraft.filter({ request_id: request.id }, { limit: 50 });

    const prior = priorRequestsPage.items
      .filter((p: any) => p.id !== request.id && ["final_report", "released"].includes(canonicalStage(p.workflow_status)))
      .slice(0, 10)
      .map((p: any) => ({
        id: p.id,
        request_id: p.request_id,
        scan_type: p.scan_type,
        examination: p.examination,
        body_region: p.body_part || "",
        facility: p.routed_hospital || p.doctor_hospital || "",
        stage: canonicalStage(p.workflow_status),
        finalized_datetime: p.final_report_datetime || p.released_datetime || p.date_completed || null,
        report: p.report || "",
        report_file_url: p.report_file_url || "",
        images: p.image_file_urls || [],
      }));

    const priorResults = priorResultsPage.items.slice(0, 10).map((r: any) => ({
      id: r.id,
      scan_type: r.scan_type,
      examination: r.examination,
      date_completed: r.date_completed || "",
      radiologist_name: r.radiologist_name || "",
      report_pdf_url: r.report_pdf_url || "",
    }));

    return Response.json({
      request: safeRequest,
      patient: patient ? {
        full_name: patient.full_name || request.patient_name,
        full_name_ar: patient.full_name_ar || "",
        cin: patient.cin || request.patient_cin,
        date_of_birth: patient.date_of_birth || "",
        gender: patient.gender || "",
        blood_type: patient.blood_type || "",
        allergies: patient.allergies || "",
      } : null,
      conditions: conditionsPage.items.map((c: any) => ({
        name: c.name || "",
        name_ar: c.name_ar || "",
        category: c.category || "",
        date: c.date || "",
        details: c.details || "",
      })),
      prior_studies: prior,
      prior_results: priorResults,
      report_versions: versionsPage.items.map((v: any) => ({
        id: v.id,
        version: v.version,
        report_text: v.report_text || "",
        report_pdf_url: v.report_pdf_url || "",
        signed_datetime: v.signed_datetime || "",
        signed_by_name: v.signed_by_name || "",
        radiologist_name: v.radiologist_name || "",
        is_amendment: !!v.is_amendment,
        amendment_reason: v.amendment_reason || "",
      })),
      imaging_studies: matchedStudies.map((s: any) => ({
        id: s.id,
        study_instance_uid: s.study_instance_uid || "",
        accession_number: s.accession_number || "",
        modality: s.modality || "",
        study_date: s.study_date || "",
        study_description: s.study_description || "",
        series_count: s.series_count || 0,
        image_count: s.image_count || 0,
        status: s.status || "",
        identity_check: s.identity_check || "",
        series: seriesPage.items
          .filter((x: any) => x.study_id === s.id)
          .map((x: any) => ({
            series_instance_uid: x.series_instance_uid || "",
            series_number: x.series_number ?? null,
            modality: x.modality || "",
            description: x.series_description || "",
            body_part: x.body_part || "",
            image_count: x.sop_instance_count || 0,
          })),
      })),
      draft_reports: draftsPage.items.map((d: any) => ({
        id: d.id,
        radiologist_user_id: d.radiologist_user_id || "",
        radiologist_name: d.radiologist_name || "",
        status: d.status || "draft",
        preliminary_datetime: d.preliminary_datetime || "",
        preliminary_by_name: d.preliminary_by_name || "",
        updated_datetime: d.updated_datetime || "",
      })),
      critical_communications: commLogsPage.items.map((l: any) => ({
        id: l.id,
        finding_summary: l.finding_summary || "",
        recipient_name: l.recipient_name || "",
        notification_method: l.notification_method || "",
        notified_datetime: l.notified_datetime || "",
        delivered_datetime: l.delivered_datetime || "",
        acknowledged_datetime: l.acknowledged_datetime || "",
        acknowledged_by_name: l.acknowledged_by_name || "",
        escalation_level: l.escalation_level || 0,
        escalation_deadline: l.escalation_deadline || "",
        status: l.status || "",
        communication_notes: l.communication_notes || "",
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}