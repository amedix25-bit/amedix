// Display configuration for the Radiologist worklist and imaging case — one
// shared vocabulary so the worklist, the case screen and the reports never
// describe the same record differently.

export const CATEGORIES = [
  { key: "all", label: "All Cases" },
  { key: "new_requests", label: "New Requests" },
  { key: "awaiting_imaging", label: "Awaiting Imaging" },
  { key: "ready_for_interpretation", label: "Ready for Interpretation" },
  { key: "in_progress", label: "In Progress" },
  { key: "awaiting_signature", label: "Awaiting Signature" },
  { key: "completed", label: "Completed" },
  { key: "unmatched", label: "Unmatched Studies" },
];

export const SUMMARY_CARDS = [
  { key: "new_requests", label: "New Requests", target: "new_requests" },
  { key: "images_ready", label: "Ready for Reporting", target: "ready_for_interpretation" },
  { key: "reporting", label: "Reporting in Progress", target: "in_progress" },
  { key: "awaiting_signature", label: "Awaiting Signature", target: "awaiting_signature" },
  { key: "completed", label: "Completed Reports", target: "completed" },
  { key: "urgent_critical", label: "Urgent / Critical", target: "urgent" },
];

export const REPORT_STATUS = {
  not_started: { label: "Not started", chip: "bg-secondary text-muted-foreground" },
  in_progress: { label: "Reporting in progress", chip: "bg-blue-500/15 text-blue-700" },
  draft: { label: "Draft saved", chip: "bg-amber-500/15 text-amber-700" },
  awaiting_signature: { label: "Awaiting signature", chip: "bg-indigo-500/15 text-indigo-700" },
  finalized: { label: "Signed & finalized", chip: "bg-emerald-500/15 text-emerald-700" },
  amended: { label: "Amended", chip: "bg-purple-500/15 text-purple-700" },
  released: { label: "Released", chip: "bg-emerald-500/15 text-emerald-700" },
};

export const STUDY_MATCH = {
  matched: { label: "Matched", chip: "bg-emerald-500/15 text-emerald-700" },
  images_only: { label: "Images only", chip: "bg-amber-500/15 text-amber-700" },
  unmatched: { label: "Unmatched", chip: "bg-red-500/10 text-red-700" },
  awaiting: { label: "Awaiting imaging", chip: "bg-secondary text-muted-foreground" },
};

export const REPORTING_FILTER_OPTIONS = [
  ["not_started", "Not started"],
  ["in_progress", "In progress / draft"],
  ["awaiting_signature", "Awaiting signature"],
  ["finalized", "Signed / finalized"],
  ["amended", "Amended"],
];

export function reportStatus(status) {
  return REPORT_STATUS[status] || REPORT_STATUS.not_started;
}

export function studyMatch(match) {
  return STUDY_MATCH[match] || STUDY_MATCH.awaiting;
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d) ? "—" : d.toLocaleString();
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d) ? "—" : d.toLocaleDateString();
}

export function ageFrom(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d)) return "";
  return `${Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))} yrs`;
}

// Report lifecycle of one case, derived from the signed versions and the
// drafts that exist — never assumed.
export function caseReportState(request, reportVersions, draftReports) {
  const signed = ["final_report", "released"].includes(request?.stage);
  const latest = (reportVersions || [])[0] || null;
  const drafts = draftReports || [];
  const preliminary = drafts.find((d) => d.status === "preliminary") || null;
  const latestDraft = drafts
    .slice()
    .sort((a, b) => String(b.updated_datetime || "").localeCompare(String(a.updated_datetime || "")))[0] || null;

  if (signed && latest?.is_amendment) return { key: "amended", ...REPORT_STATUS.amended, version: latest };
  if (signed) return { key: request.stage === "released" ? "released" : "finalized", ...(request.stage === "released" ? REPORT_STATUS.released : REPORT_STATUS.finalized), version: latest };
  if (preliminary) return { key: "awaiting_signature", ...REPORT_STATUS.awaiting_signature, preliminary };
  if (latestDraft) return { key: "draft", ...REPORT_STATUS.draft, draft: latestDraft };
  if (["reporting_in_progress", "interpretation"].includes(request?.stage)) {
    return { key: "in_progress", ...REPORT_STATUS.in_progress };
  }
  return { key: "not_started", ...REPORT_STATUS.not_started };
}