import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { canonicalStage, isOverdue } from "../../shared/radiologyWorkflow.ts";

// Radiology Department operational analytics — database-derived only:
// volumes, turnaround medians and workload distribution for a date range.
// Turnaround is split into EXAMINATION turnaround (request → examination
// completed) and REPORTING turnaround (images available → report finalized);
// raw counts alone are never used as a performance measure — every workload
// figure carries modality and priority context.
function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
function hours(ms: number | null): number | null {
  return ms === null ? null : Math.round((ms / 3600000) * 10) / 10;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const hospitalProfiles = await base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id });
    const hospital = hospitalProfiles[0];
    if (!hospital || !hospital.radiology_department_enabled) {
      return Response.json({ error: "Only a radiology department can view its analytics." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const to = String(payload.date_to || new Date().toISOString().slice(0, 10));
    const from = String(payload.date_from ||
      new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));

    const scope = {
      routed_hospital_user_id: user.id,
      request_datetime: { $gte: `${from}T00:00:00.000Z`, $lte: `${to}T23:59:59.999Z` },
    };

    // Cursor loop — never load the full dataset at once.
    let all: any[] = [];
    let cursor: string | undefined = undefined;
    do {
      const page = await base44.asServiceRole.entities.ImagingRequest.filter(scope, { sort: "-request_datetime", limit: 500, cursor });
      all = all.concat(page.items);
      cursor = page.has_more ? page.next_cursor : undefined;
    } while (cursor && all.length < 5000);

    const inRange = (v: string | null | undefined) => !!v && v >= `${from}T00:00:00.000Z` && v <= `${to}T23:59:59.999Z`;

    const examTurnaround = all
      .filter((r) => r.request_datetime && inRange(r.performed_datetime))
      .map((r) => new Date(r.performed_datetime).getTime() - new Date(r.request_datetime).getTime());
    const reportTurnaround = all
      .filter((r) => inRange(r.final_report_datetime))
      .map((r) => {
        const imagesAt = r.images_received_datetime || r.performed_datetime || r.request_datetime;
        return new Date(r.final_report_datetime).getTime() - new Date(imagesAt).getTime();
      });

    const byModality: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byRadiologist: Record<string, { assigned: number; finalized: number; hours_to_finalize: number[] }> = {};
    const byPriority: Record<string, number> = {};
    for (const r of all) {
      byModality[r.scan_type] = (byModality[r.scan_type] || 0) + 1;
      const stage = canonicalStage(r.workflow_status);
      byStatus[stage] = (byStatus[stage] || 0) + 1;
      byPriority[r.priority || "Routine"] = (byPriority[r.priority || "Routine"] || 0) + 1;
      const radName = r.assigned_radiologist_name;
      if (radName) {
        if (!byRadiologist[radName]) byRadiologist[radName] = { assigned: 0, finalized: 0, hours_to_finalize: [] };
        byRadiologist[radName].assigned += 1;
        if (inRange(r.final_report_datetime)) {
          byRadiologist[radName].finalized += 1;
          const readyAt = r.ready_datetime || r.images_received_datetime || r.performed_datetime;
          if (readyAt) {
            byRadiologist[radName].hours_to_finalize.push(
              (new Date(r.final_report_datetime).getTime() - new Date(readyAt).getTime()) / 3600000
            );
          }
        }
      }
    }

    // Current open pool (regardless of range) — where the department stands now.
    const open = await base44.asServiceRole.entities.ImagingRequest.filter(
      { routed_hospital_user_id: user.id, workflow_status: { $nin: ["final_report", "released", "cancelled"] } },
      "-request_datetime",
      1000
    );

    const radiologistLoad = Object.entries(byRadiologist).map(([name, v]) => ({
      radiologist: name,
      assigned: v.assigned,
      finalized: v.finalized,
      median_hours_to_finalize: hours(median(v.hours_to_finalize)),
    })).sort((a, b) => b.assigned - a.assigned);

    return Response.json({
      date_from: from,
      date_to: to,
      requests_received: all.length,
      examinations_completed: examTurnaround.length,
      reports_finalized: reportTurnaround.length,
      awaiting_interpretation: open.filter((r) => ["ready_for_reporting", "reporting_in_progress"].includes(canonicalStage(r.workflow_status))).length,
      overdue_studies: open.filter((r) => isOverdue(r)).length,
      median_hours_request_to_examination: hours(median(examTurnaround)),
      median_hours_images_to_report: hours(median(reportTurnaround)),
      workload_by_modality: byModality,
      workload_by_reporting_status: byStatus,
      workload_by_priority: byPriority,
      workload_by_radiologist: radiologistLoad,
      workload_context: "Counts combine studies of every modality, complexity and priority — compare radiologists by the mix they were given (modality and priority breakdowns above), never by raw counts alone.",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}