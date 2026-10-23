import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { canonicalStage, isOverdue, LEGACY_STAGE_MAP } from "../../shared/radiologyWorkflow.ts";
import { authorizedFacilities } from "../../shared/radiologyMembership.ts";

// Radiology Department worklist + dashboard counts. Authorized callers:
// the facility's radiology department (hospital administrator with the
// department enabled) sees the FULL department worklist; a radiologist of
// the same facility sees the unassigned pool plus the studies assigned to
// them (for claiming). Every count is derived from the database — never
// fabricated.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const [hospitalProfiles, radiologistProfiles] = await Promise.all([
      base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id }),
      base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id }),
    ]);
    const hospital = hospitalProfiles[0] || null;
    const radiologist = radiologistProfiles[0] || null;

    let scope: Record<string, any>;
    let mode: string;
    if (hospital && hospital.radiology_department_enabled) {
      scope = { routed_hospital_user_id: user.id };
      mode = "department";
    } else if (radiologist && radiologist.status === "active") {
      const auth = await authorizedFacilities(base44, radiologist);
      if (auth.names.length === 0) {
        return Response.json(
          { error: "You are not associated with any facility's radiology department yet." },
          { status: 403 }
        );
      }
      scope = { routed_hospital: { $in: auth.names } };
      mode = "radiologist";
    } else {
      return Response.json(
        { error: "Only this facility's radiology department staff or its radiologists can view this worklist." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};

    // ===== Filters =====
    const filters: any[] = [scope];
    if (payload.status) {
      const canonical = String(payload.status);
      const legacyKeys = Object.entries(LEGACY_STAGE_MAP).filter(([, v]) => v === canonical).map(([k]) => k);
      filters.push({ workflow_status: { $in: [canonical, ...legacyKeys] } });
    }
    if (payload.priority === "Urgent/Emergency") {
      filters.push({ priority: { $in: ["Urgent", "Emergency"] } });
    } else if (payload.priority) {
      filters.push({ priority: String(payload.priority) });
    }
    if (payload.modality) filters.push({ scan_type: String(payload.modality) });
    if (payload.doctor) filters.push({ doctor_name: String(payload.doctor) });
    if (payload.assigned === "assigned") filters.push({ assigned_radiologist_user_id: { $ne: null } });
    if (payload.assigned === "unassigned") filters.push({ assigned_radiologist_user_id: null });
    if (payload.date_from || payload.date_to) {
      const range: Record<string, any> = {};
      if (payload.date_from) range.$gte = `${payload.date_from}T00:00:00.000Z`;
      if (payload.date_to) range.$lte = `${payload.date_to}T23:59:59.999Z`;
      filters.push({ request_datetime: range });
    }
    const term = String(payload.search || "").trim();
    if (term) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = { $regex: escaped, $options: "i" };
      filters.push({ $or: [{ patient_name: rx }, { patient_cin: rx }, { request_id: rx }] });
    }
    if (mode === "radiologist") {
      // A radiologist sees the unassigned pool and their own assigned studies.
      filters.push({ $or: [{ assigned_radiologist_user_id: user.id }, { assigned_radiologist_user_id: null }] });
    }

    const query = filters.length === 1 ? filters[0] : { $and: filters };

    const LIMIT = 500;
    const page = await base44.asServiceRole.entities.ImagingRequest.filter(query, { sort: "-request_datetime", limit: LIMIT });
    let rows = page.items.map((r: any) => ({
      id: r.id,
      request_id: r.request_id,
      patient_id: r.patient_id,
      patient_name: r.patient_name,
      patient_cin: r.patient_cin,
      doctor_name: r.doctor_name,
      doctor_specialization: r.doctor_specialization,
      doctor_hospital: r.doctor_hospital,
      routed_hospital: r.routed_hospital || r.doctor_hospital,
      scan_type: r.scan_type,
      examination: r.examination,
      priority: r.priority || "Routine",
      request_datetime: r.request_datetime,
      scheduled_datetime: r.scheduled_datetime || null,
      workflow_status: r.workflow_status || "requested",
      stage: canonicalStage(r.workflow_status),
      assigned_radiologist_user_id: r.assigned_radiologist_user_id || null,
      assigned_radiologist_name: r.assigned_radiologist_name || null,
      images_count: (r.image_file_urls || []).length,
      has_report: !!(r.report || r.report_file_url),
      is_critical: !!r.is_critical,
      clarification_request: r.clarification_request || null,
      clarification_response: r.clarification_response || null,
      updated_datetime: r.updated_datetime || r.request_datetime,
      is_overdue: isOverdue(r),
      second_opinion_requested: (() => {
        const last = [...(r.status_history || [])].reverse()
          .find((h: any) => ["second_opinion_requested", "unassigned", "reassigned", "work_released"].includes(h.action));
        return !!last && last.action === "second_opinion_requested";
      })(),
    }));
    if (payload.overdue) rows = rows.filter((r: any) => r.is_overdue);

    // ===== Dashboard counts (independent of the filters) =====
    const stageValues = ["requested", "under_review", "clarification_required", "accepted", "scheduled",
      "in_progress", "performed", "examination_completed", "images_awaiting_transfer", "ready_for_reporting",
      "interpretation", "reporting_in_progress", "final_report", "released", "cancelled"];
    const countResults = await Promise.all(stageValues.map((v) =>
      base44.asServiceRole.entities.ImagingRequest.count({ ...scope, workflow_status: v })
    ));
    const raw: Record<string, number> = {};
    stageValues.forEach((v, i) => { raw[v] = countResults[i]; });

    const counts: Record<string, number> = {
      new_requests: raw.requested,
      awaiting_review: raw.under_review + raw.clarification_required,
      accepted: raw.accepted,
      scheduled_examinations: raw.scheduled,
      in_progress: raw.in_progress,
      examination_completed: raw.examination_completed + raw.performed,
      images_awaiting_transfer: raw.images_awaiting_transfer,
      ready_for_reporting: raw.ready_for_reporting,
      reports_in_progress: raw.interpretation + raw.reporting_in_progress,
      awaiting_finalization: raw.ready_for_reporting + raw.interpretation + raw.reporting_in_progress,
      completed_reports: raw.final_report + raw.released,
      cancelled: raw.cancelled,
    };

    const [totalAll, urgent, emergency, openItems] = await Promise.all([
      base44.asServiceRole.entities.ImagingRequest.count(scope),
      base44.asServiceRole.entities.ImagingRequest.count({ ...scope, priority: "Urgent" }),
      base44.asServiceRole.entities.ImagingRequest.count({ ...scope, priority: "Emergency" }),
      base44.asServiceRole.entities.ImagingRequest.filter(
        { ...scope, workflow_status: { $nin: ["final_report", "released", "cancelled"] } },
        "-request_datetime",
        1000
      ),
    ]);
    counts.total = totalAll;
    counts.urgent_emergency = urgent + emergency;
    counts.overdue = openItems.filter((r: any) => isOverdue(r)).length;

    return Response.json({ mode, counts, worklist: rows, has_more: page.items.length >= LIMIT });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}