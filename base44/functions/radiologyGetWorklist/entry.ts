import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { canonicalStage, isOverdue, reportingLockReason } from "../../shared/radiologyWorkflow.ts";
import { authorizedFacilities } from "../../shared/radiologyMembership.ts";

// Radiologist worklist + summary counts. ONE query for every study this
// radiologist may access:
//   1. studies the PATIENT authorized them for (per-request authorization),
//   2. studies ASSIGNED to them by the facility's radiology department,
//   3. the shared pool of their own authorized facilities.
// The worklist is therefore shared among the authorized radiologists of a
// facility — one department queue, never a private copy per radiologist.
// Categories, summary cards and filters are all derived server-side from that
// authorized set; no imaging record is duplicated anywhere.
const REPORTABLE = ["ready_for_reporting", "performed", "examination_completed"];
const SIGNED = ["final_report", "released"];
// Stages at which imaging should already be attached to the request.
const IMAGING_STAGES = [
  "examination_completed", "performed", "images_awaiting_transfer",
  "ready_for_reporting", "reporting_in_progress", "interpretation", "awaiting_signature",
  "final_report", "released",
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function studyDate(r: any): string {
  return r.performed_datetime || r.scheduled_datetime || r.request_datetime || r.requested_date || "";
}

// Study matching status — is the received study tied to a verified DICOM
// study and/or to images held in AMedix? Never inferred from wishful data:
// an absent identifier is reported as absent.
function studyMatch(r: any, stage: string, imageCount: number): string {
  const hasUid = !!String(r.study_instance_uid || "").trim();
  if (hasUid) return "matched";
  if (imageCount > 0) return "images_only";
  if (IMAGING_STAGES.includes(stage)) return "unmatched";
  return "awaiting";
}

// Reporting status — derived from the signed versions and the drafts that
// actually exist, so the worklist never shows a report state the records do
// not support.
function reportingStatus(stage: string, latestVersion: any, draft: any): string {
  if (SIGNED.includes(stage)) {
    if (latestVersion && latestVersion.is_amendment) return "amended";
    return stage === "released" ? "released" : "finalized";
  }
  if (stage === "awaiting_signature") return "awaiting_signature";
  if (draft && draft.status === "preliminary" && !SIGNED.includes(stage)) return "awaiting_signature";
  if (draft) return "draft";
  if (stage === "reporting_in_progress" || stage === "interpretation") return "in_progress";
  return "not_started";
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id });
    const radiologist = profiles[0];
    if (!radiologist || radiologist.status !== "active") {
      return Response.json({ error: "Only active radiologists can view this worklist." }, { status: 403 });
    }
    const auth = await authorizedFacilities(base44, radiologist);

    const page = await base44.asServiceRole.entities.ImagingRequest.filter(
      {
        $or: [
          { authorized_radiologist_user_ids: user.id },
          { assigned_radiologist_user_id: user.id },
          ...(auth.names.length ? [{ routed_hospital: { $in: auth.names } }] : []),
        ],
      },
      { sort: "-request_datetime", limit: 500 }
    );
    const all = page.items;
    const ids = all.map((r: any) => r.id);

    const [draftsPage, versionsPage, logsPage] = ids.length
      ? await Promise.all([
          base44.asServiceRole.entities.ReportDraft.filter({ request_id: { $in: ids } }, { limit: 500 }),
          base44.asServiceRole.entities.RadiologyReportVersion.filter({ imaging_request_id: { $in: ids } }, { sort: "-version", limit: 500 }),
          base44.asServiceRole.entities.CriticalFindingLog.filter({ imaging_request_id: { $in: ids } }, { limit: 500 }),
        ])
      : [{ items: [] as any[] }, { items: [] as any[] }, { items: [] as any[] }];

    // Latest draft per request (any radiologist of the department), and the
    // latest signed version per request.
    const draftByRequest: Map<string, any> = new Map();
    for (const d of draftsPage.items as any[]) {
      const current = draftByRequest.get(d.request_id);
      if (!current || String(d.updated_datetime || "") > String(current.updated_datetime || "")) {
        draftByRequest.set(d.request_id, d);
      }
    }
    const versionByRequest: Map<string, any> = new Map();
    for (const v of versionsPage.items as any[]) {
      const current = versionByRequest.get(v.imaging_request_id);
      if (!current || Number(v.version) > Number(current.version)) {
        versionByRequest.set(v.imaging_request_id, v);
      }
    }
    const criticalAwaitingIds: Set<string> = new Set(
      (logsPage.items as any[])
        .filter((l: any) => ["notified", "delivered", "escalated"].includes(l.status))
        .map((l: any) => l.imaging_request_id)
    );

    const rows = all.map((r: any) => {
      const stage = canonicalStage(r.workflow_status);
      const assigned = r.assigned_radiologist_user_id || null;
      const isMine = assigned === user.id;
      const ownership = SIGNED.includes(stage)
        ? "finalized"
        : isMine ? "mine" : assigned ? "other" : "unassigned";
      const imageCount = (r.image_file_urls || []).length;
      const draft = draftByRequest.get(r.id) || null;
      const latestVersion = versionByRequest.get(r.id) || null;
      return {
        id: r.id,
        request_id: r.request_id,
        pdf_url: r.pdf_url || "",
        // Why the reporting workspace is locked for this study (null = open).
        reporting_lock_reason: reportingLockReason(r),
        patient_id: r.patient_id,
        patient_cin: r.patient_cin,
        patient_name: r.patient_name,
        doctor_name: r.doctor_name,
        ordering_doctor: r.doctor_name || "",
        doctor_specialization: r.doctor_specialization || "",
        doctor_hospital: r.doctor_hospital || "",
        routed_hospital: r.routed_hospital || r.doctor_hospital || "",
        department: r.doctor_specialization || "Radiology",
        scan_type: r.scan_type,
        modality: r.scan_type || "Other",
        examination: r.examination,
        body_part: r.body_part || "",
        priority: r.priority || "Routine",
        clinical_indication: r.clinical_indication || "",
        request_datetime: r.request_datetime,
        study_date: studyDate(r),
        scheduled_datetime: r.scheduled_datetime || null,
        performed_datetime: r.performed_datetime || null,
        finalized_datetime: r.final_report_datetime || null,
        released_datetime: r.released_datetime || null,
        workflow_status: r.workflow_status || "requested",
        stage,
        ownership,
        study_instance_uid: r.study_instance_uid || "",
        accession_number: r.accession_number || "",
        study_match: studyMatch(r, stage, imageCount),
        report_status: reportingStatus(stage, latestVersion, draft),
        report_version: latestVersion ? latestVersion.version : null,
        report_amended: !!(latestVersion && latestVersion.is_amendment),
        signed_by_name: latestVersion ? latestVersion.signed_by_name || "" : "",
        signed_datetime: latestVersion ? latestVersion.signed_datetime || "" : "",
        draft_status: draft ? draft.status || "draft" : null,
        draft_radiologist_name: draft ? draft.radiologist_name || "" : "",
        draft_updated_datetime: draft ? draft.updated_datetime || "" : "",
        assigned_radiologist_name: r.assigned_radiologist_name || null,
        assigned_datetime: r.assigned_datetime || null,
        reporting_since: stage === "reporting_in_progress" || stage === "interpretation" ? (r.reporting_datetime || null) : null,
        images_count: imageCount,
        image_notes: r.image_notes || "",
        has_report: !!(r.report || r.report_file_url),
        is_critical: !!r.is_critical,
        is_overdue: isOverdue(r),
        authorized_by_patient: (r.authorized_radiologist_user_ids || []).includes(user.id),
        has_draft: !!draft,
        has_preliminary: !!(draft && draft.status === "preliminary"),
        updated_datetime: r.updated_datetime || r.request_datetime,
      };
    });

    // ===== Categories — the worklist the department shares =====
    const open = (r: any) => !["final_report", "released", "cancelled"].includes(r.stage);
    const categories: Record<string, (r: any) => boolean> = {
      all: (r) => r.stage !== "cancelled",
      new_requests: (r) => ["requested", "under_review", "clarification_required", "accepted"].includes(r.stage),
      awaiting_imaging: (r) => ["scheduled", "in_progress", "examination_completed", "performed", "images_awaiting_transfer"].includes(r.stage),
      ready_for_interpretation: (r) => REPORTABLE.includes(r.stage) && r.stage !== "examination_completed",
      in_progress: (r) => ["reporting_in_progress", "interpretation"].includes(r.stage),
      awaiting_signature: (r) =>
        r.stage === "awaiting_signature" || (r.has_preliminary && !SIGNED.includes(r.stage) && r.stage !== "cancelled"),
      completed: (r) => SIGNED.includes(r.stage),
      unmatched: (r) => r.stage !== "cancelled" && ["unmatched", "images_only"].includes(r.study_match),
    };

    // Legacy views kept for the dashboard cards and the imaging viewer tab.
    const views: Record<string, (r: any) => boolean> = {
      available: (r) => r.ownership === "unassigned" && REPORTABLE.includes(r.stage),
      mine: (r) => r.ownership === "mine",
      in_progress_view: (r) => open(r) && ["reporting_in_progress", "interpretation"].includes(r.stage),
      drafts: (r) => r.has_draft && !SIGNED.includes(r.stage) && r.stage !== "cancelled",
      awaiting_signature_view: (r) => r.stage === "awaiting_signature" || (r.has_preliminary && !SIGNED.includes(r.stage)),
      completed_view: (r) => SIGNED.includes(r.stage),
      urgent: (r) => ["Urgent", "Emergency"].includes(r.priority) && open(r),
      overdue: (r) => r.is_overdue,
      critical: (r) => criticalAwaitingIds.has(r.id),
    };

    const counts: Record<string, number> = {};
    for (const [key, predicate] of Object.entries(categories)) counts[key] = rows.filter(predicate).length;
    for (const [key, predicate] of Object.entries(views)) counts[key] = rows.filter(predicate).length;
    counts.in_progress = counts.in_progress_view;
    counts.completed = counts.completed_view;
    counts.awaiting_signature = counts.awaiting_signature_view;
    delete counts.in_progress_view;
    delete counts.completed_view;
    delete counts.awaiting_signature_view;

    const today = new Date().toISOString().slice(0, 10);
    const criticalAwaiting = rows.filter((r: any) => criticalAwaitingIds.has(r.id)).length;
    counts.completed_today = rows.filter((r: any) =>
      SIGNED.includes(r.stage) && String(r.finalized_datetime || r.released_datetime || "").slice(0, 10) === today
    ).length;
    counts.critical_awaiting = criticalAwaiting;
    counts.urgent_critical = rows.filter((r: any) =>
      (["Urgent", "Emergency"].includes(r.priority) && open(r)) || criticalAwaitingIds.has(r.id)
    ).length;

    const summary = {
      new_requests: counts.new_requests,
      images_ready: counts.ready_for_interpretation,
      reporting: counts.in_progress,
      awaiting_signature: counts.awaiting_signature,
      completed: counts.completed,
      urgent_critical: counts.urgent_critical,
      unmatched: counts.unmatched,
    };

    // ===== Selection + filters =====
    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const category = String(payload.category || "");
    const legacyView = String(payload.view || "");
    const predicate = category
      ? (categories[category] || categories.all)
      : (views[legacyView] || views.mine);
    let filtered = rows.filter(predicate);

    if (payload.modality) filtered = filtered.filter((r: any) => r.modality === String(payload.modality));
    if (payload.priority === "Urgent/Emergency") {
      filtered = filtered.filter((r: any) => ["Urgent", "Emergency"].includes(r.priority));
    } else if (payload.priority) {
      filtered = filtered.filter((r: any) => r.priority === String(payload.priority));
    }
    if (payload.facility) {
      filtered = filtered.filter((r: any) =>
        String(r.routed_hospital || "").toLowerCase() === String(payload.facility).toLowerCase());
    }
    if (payload.body_region) {
      const rx = new RegExp(escapeRegExp(String(payload.body_region)), "i");
      filtered = filtered.filter((r: any) => rx.test(r.body_part || "") || rx.test(r.examination || ""));
    }
    if (payload.ordering_doctor) {
      const rx = new RegExp(escapeRegExp(String(payload.ordering_doctor)), "i");
      filtered = filtered.filter((r: any) => rx.test(r.ordering_doctor || ""));
    }
    if (payload.date_from || payload.date_to) {
      const from = payload.date_from ? new Date(`${payload.date_from}T00:00:00`).getTime() : null;
      const to = payload.date_to ? new Date(`${payload.date_to}T23:59:59.999`).getTime() : null;
      filtered = filtered.filter((r: any) => {
        if (!r.study_date) return !from && !to;
        const t = new Date(r.study_date).getTime();
        return (!from || t >= from) && (!to || t <= to);
      });
    }
    if (payload.reporting_status) {
      const wanted = String(payload.reporting_status);
      filtered = filtered.filter((r: any) => {
        if (wanted === "not_started") return r.report_status === "not_started";
        if (wanted === "in_progress") return ["in_progress", "draft"].includes(r.report_status);
        if (wanted === "awaiting_signature") return r.report_status === "awaiting_signature";
        if (wanted === "finalized") return ["finalized", "released", "amended"].includes(r.report_status);
        return r.report_status === wanted;
      });
    }
    if (payload.completed_today) {
      filtered = filtered.filter((r: any) =>
        SIGNED.includes(r.stage) &&
        String(r.finalized_datetime || r.released_datetime || "").slice(0, 10) === today);
    }
    if (payload.search) {
      const rx = new RegExp(escapeRegExp(String(payload.search).trim()), "i");
      filtered = filtered.filter((r: any) =>
        rx.test(r.patient_name || "") || rx.test(r.patient_cin || "") || rx.test(r.request_id || ""));
    }

    filtered.sort((a: any, b: any) => String(b.study_date || "").localeCompare(String(a.study_date || "")));

    const uniq = (values: any[]) => [...new Set(values.filter(Boolean))].sort();

    return Response.json({
      mode: "radiologist",
      counts,
      summary,
      worklist: filtered,
      facilities: uniq(rows.map((r: any) => r.routed_hospital)),
      modalities: uniq(rows.map((r: any) => r.modality)),
      body_regions: uniq(rows.map((r: any) => r.body_part)),
      ordering_doctors: uniq(rows.map((r: any) => r.ordering_doctor)),
      total_accessible: rows.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}