import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { canonicalStage, isOverdue } from "../../shared/radiologyWorkflow.ts";
import { authorizedFacilities } from "../../shared/radiologyMembership.ts";

// Radiologist worklist + dashboard counts. ONE database query for every study
// this radiologist may access:
//   1. studies the PATIENT authorized them for (per-request authorization),
//   2. studies ASSIGNED to them by the facility's radiology department,
//   3. the unassigned pool of their own facility (claimable when ready).
// Views, filters and dashboard card counts are derived server-side from this
// authorized set — no imaging records are duplicated anywhere.
const REPORTABLE = ["ready_for_reporting", "performed", "examination_completed"];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    const draftsPage = await base44.asServiceRole.entities.ReportDraft.filter(
      { radiologist_user_id: user.id },
      { limit: 500 }
    );
    const draftByRequest: Map<string, any> = new Map(draftsPage.items.map((d: any) => [d.request_id, d]));

    // Critical findings awaiting clinician acknowledgment (Phase 6)
    let criticalAwaitingIds: Set<string> = new Set();
    if (all.length) {
      const logsPage = await base44.asServiceRole.entities.CriticalFindingLog.filter(
        { imaging_request_id: { $in: all.map((r: any) => r.id) } },
        { limit: 500 }
      );
      criticalAwaitingIds = new Set(
        logsPage.items
          .filter((l: any) => ["notified", "delivered", "escalated"].includes(l.status))
          .map((l: any) => l.imaging_request_id)
      );
    }

    const rows = all.map((r: any) => {
      const stage = canonicalStage(r.workflow_status);
      const assigned = r.assigned_radiologist_user_id || null;
      const isMine = assigned === user.id;
      const ownership = ["final_report", "released"].includes(stage)
        ? "finalized"
        : isMine ? "mine" : assigned ? "other" : "unassigned";
      return {
        id: r.id,
        request_id: r.request_id,
        patient_id: r.patient_id,
        patient_cin: r.patient_cin,
        patient_name: r.patient_name,
        doctor_name: r.doctor_name,
        doctor_hospital: r.doctor_hospital || "",
        routed_hospital: r.routed_hospital || r.doctor_hospital || "",
        scan_type: r.scan_type,
        examination: r.examination,
        body_part: r.body_part || "",
        priority: r.priority || "Routine",
        request_datetime: r.request_datetime,
        scheduled_datetime: r.scheduled_datetime || null,
        performed_datetime: r.performed_datetime || null,
        finalized_datetime: r.final_report_datetime || null,
        released_datetime: r.released_datetime || null,
        workflow_status: r.workflow_status || "requested",
        stage,
        ownership,
        assigned_radiologist_name: r.assigned_radiologist_name || null,
        reporting_since: stage === "reporting_in_progress" ? (r.reporting_datetime || null) : null,
        images_count: (r.image_file_urls || []).length,
        image_notes: r.image_notes || "",
        has_report: !!(r.report || r.report_file_url),
        is_critical: !!r.is_critical,
        is_overdue: isOverdue(r),
        authorized_by_patient: (r.authorized_radiologist_user_ids || []).includes(user.id),
        has_draft: draftByRequest.has(r.id),
        updated_datetime: r.updated_datetime || r.request_datetime,
      };
    });

    // ===== Dashboard views =====
    const open = (r: any) => !["final_report", "released", "cancelled"].includes(r.stage);
    const views: Record<string, (r: any) => boolean> = {
      available: (r) => r.ownership === "unassigned" && REPORTABLE.includes(r.stage),
      mine: (r) => r.ownership === "mine",
      in_progress: (r) => r.stage === "reporting_in_progress" && r.ownership === "mine",
      drafts: (r) => r.has_draft && !["released", "cancelled"].includes(r.stage),
      awaiting_signature: (r) => r.stage === "final_report" && r.ownership !== "other",
      completed: (r) => ["final_report", "released"].includes(r.stage),
      urgent: (r) => ["Urgent", "Emergency"].includes(r.priority) && open(r),
      overdue: (r) => r.is_overdue,
      critical: (r) => criticalAwaitingIds.has(r.id),
    };
    const counts: Record<string, number> = {};
    for (const [view, predicate] of Object.entries(views)) counts[view] = rows.filter(predicate).length;
    const today = new Date().toISOString().slice(0, 10);
    counts.completed_today = rows.filter((r: any) =>
      ["final_report", "released"].includes(r.stage) &&
      String(r.finalized_datetime || r.released_datetime || "").slice(0, 10) === today
    ).length;
    counts.critical_awaiting = rows.filter((r: any) => criticalAwaitingIds.has(r.id)).length;

    // ===== View selection + filters =====
    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const view = String(payload.view || "mine");
    const predicate = views[view] || views.mine;
    let filtered = rows.filter(predicate);

    if (payload.modality) filtered = filtered.filter((r: any) => r.scan_type === String(payload.modality));
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
    if (payload.date_from || payload.date_to) {
      const from = payload.date_from ? `${payload.date_from}T00:00:00.000Z` : null;
      const to = payload.date_to ? `${payload.date_to}T23:59:59.999Z` : null;
      filtered = filtered.filter((r: any) => {
        const t = r.request_datetime ? new Date(r.request_datetime).getTime() : 0;
        return (!from || t >= new Date(from).getTime()) && (!to || t <= new Date(to).getTime());
      });
    }
    if (payload.reporting_status === "not_started") {
      filtered = filtered.filter((r: any) =>
        ["ready_for_reporting", "performed", "examination_completed", "images_awaiting_transfer"].includes(r.stage));
    } else if (payload.reporting_status === "in_progress") {
      filtered = filtered.filter((r: any) => ["reporting_in_progress", "interpretation"].includes(r.stage));
    } else if (payload.reporting_status === "finalized") {
      filtered = filtered.filter((r: any) => ["final_report", "released"].includes(r.stage));
    }
    if (payload.completed_today) {
      filtered = filtered.filter((r: any) =>
        ["final_report", "released"].includes(r.stage) &&
        String(r.finalized_datetime || r.released_datetime || "").slice(0, 10) === today);
    }
    if (payload.search) {
      const term = String(payload.search).trim();
      const rx = new RegExp(escapeRegExp(term), "i");
      filtered = filtered.filter((r: any) =>
        rx.test(r.patient_name || "") || rx.test(r.patient_cin || "") || rx.test(r.request_id || ""));
    }

    const facilities = [...new Set(rows.map((r: any) => r.routed_hospital).filter(Boolean))];

    return Response.json({
      mode: "radiologist",
      counts,
      worklist: filtered,
      facilities,
      total_accessible: rows.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}