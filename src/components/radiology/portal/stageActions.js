// Stage actions offered by the Radiology Portal worklist. They reuse the ONE
// radiology workflow chain (radiologyUpdateWorkflowStatus) so the department,
// the radiologist portal and the referring doctor never see conflicting
// statuses.
export const NEXT_ACTIONS = {
  requested: [
    { action: "review", label: "Move to review" },
    { action: "accept", label: "Accept" },
    { action: "schedule", label: "Schedule" },
  ],
  under_review: [
    { action: "accept", label: "Accept" },
    { action: "schedule", label: "Schedule" },
    { action: "request_clarification", label: "Request clarification", variant: "outline" },
  ],
  clarification_required: [{ action: "accept", label: "Accept" }],
  accepted: [{ action: "schedule", label: "Schedule" }],
  scheduled: [{ action: "start_examination", label: "Start examination" }],
  in_progress: [{ action: "complete_examination", label: "Examination completed" }],
  examination_completed: [{ action: "images_received", label: "Images received" }],
  images_awaiting_transfer: [{ action: "images_received", label: "Images received" }],
  ready_for_reporting: [{ action: "start_reporting", label: "Start reporting", radiologistOnly: true }],
  reporting_in_progress: [],
  final_report: [{ action: "release", label: "Release to patient record", administratorOnly: true }],
  released: [],
  cancelled: [],
};

export function actionsForStage(stage, role) {
  const list = NEXT_ACTIONS[stage] || [];
  return list.filter((a) => {
    if (a.radiologistOnly && role !== "radiologist") return false;
    if (a.administratorOnly && role !== "administrator") return false;
    return true;
  });
}