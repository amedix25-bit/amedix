// Shared radiology workflow display config — ONE status chain behind the
// doctor's request tracking, the Radiology Department Portal and the
// Radiologist Portal. Legacy values map onto the current chain.
export const STAGE_LABELS = {
  requested: "Submitted",
  under_review: "Under Departmental Review",
  clarification_required: "Clarification Required",
  accepted: "Accepted",
  scheduled: "Scheduled",
  in_progress: "Examination In Progress",
  performed: "Examination Completed",
  examination_completed: "Examination Completed",
  images_awaiting_transfer: "Images Awaiting Transfer",
  ready_for_reporting: "Ready for Reporting",
  interpretation: "Reporting In Progress",
  reporting_in_progress: "Reporting In Progress",
  awaiting_signature: "Awaiting Signature",
  final_report: "Signed and Completed",
  released: "Released",
  cancelled: "Cancelled",
};

export const STAGE_CHIP = {
  requested: "bg-secondary text-secondary-foreground",
  under_review: "bg-blue-500/15 text-blue-600",
  clarification_required: "bg-orange-500/15 text-orange-600",
  accepted: "bg-sky-500/15 text-sky-600",
  scheduled: "bg-blue-500/15 text-blue-600",
  in_progress: "bg-blue-500/15 text-blue-600",
  performed: "bg-blue-500/15 text-blue-600",
  examination_completed: "bg-blue-500/15 text-blue-600",
  images_awaiting_transfer: "bg-amber-500/15 text-amber-600",
  ready_for_reporting: "bg-purple-500/15 text-purple-600",
  interpretation: "bg-purple-500/15 text-purple-600",
  reporting_in_progress: "bg-purple-500/15 text-purple-600",
  awaiting_signature: "bg-indigo-500/15 text-indigo-700",
  final_report: "bg-emerald-500/15 text-emerald-600",
  released: "bg-emerald-500/15 text-emerald-600",
  cancelled: "bg-red-500/10 text-red-600",
};

const LEGACY = { performed: "examination_completed", interpretation: "reporting_in_progress" };
export const canonicalStage = (s) => LEGACY[s] || s || "requested";

export function slaHours(priority) {
  if (priority === "Emergency") return 2;
  if (priority === "Urgent") return 24;
  return 168;
}

export function isOverdue(r) {
  const stage = canonicalStage(r.workflow_status);
  if (["ready_for_reporting", "reporting_in_progress", "awaiting_signature", "final_report", "released", "cancelled"].includes(stage)) return false;
  if (!r.request_datetime) return false;
  const deadline = new Date(r.request_datetime).getTime() + slaHours(r.priority) * 3600 * 1000;
  return Date.now() > deadline;
}

// Stages in display order (canonical).
export const STAGE_ORDER = [
  "requested", "under_review", "clarification_required", "accepted", "scheduled",
  "in_progress", "examination_completed", "images_awaiting_transfer",
  "ready_for_reporting", "reporting_in_progress", "awaiting_signature",
  "final_report", "released", "cancelled",
];

// Why the reporting workspace is locked for a study — null when it is open.
// Mirrors the server rule so the workspace always explains the lock in place.
export const REPORTABLE_STAGES = [
  "ready_for_reporting", "performed", "examination_completed",
  "reporting_in_progress", "interpretation", "awaiting_signature",
];

export function reportingLockReason(request) {
  const stage = canonicalStage(request?.workflow_status || request?.stage);
  if (["final_report", "released", "cancelled"].includes(stage)) return null;
  const images = (request?.image_file_urls || []).filter(Boolean).length;
  if (!REPORTABLE_STAGES.includes(stage)) {
    return images
      ? "The study images were received, but the examination is not yet verified as completed. Reporting unlocks automatically at that point."
      : "The examination has not been completed and no study images have been received. Reporting unlocks automatically once the examination is completed and the images are received and verified.";
  }
  if (!images) {
    return "The examination is completed but no study images are attached to this request. Reporting stays locked until the images are received and verified — the department can import the study, or the facility can connect its PACS/DICOM source.";
  }
  return null;
}

export function formatStageTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}