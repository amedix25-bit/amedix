// Neurology — clinical review and deployment gate.
//
// The neurology decision-support layer is not clinically approved until qualified
// reviewers have recorded their decision. This module holds the review domains, the
// decision states and the gate that answers one question: may these decision-support
// features be used in clinical care yet?
//
// The gate is deliberately strict and never infers approval:
//   · each domain needs a recorded decision that is not "changes requested";
//   · the Neurology review must carry an explicit confirmation from the Head of
//     Neurology;
//   · a missing record is a blocker, never a pass.
// A gate state is a statement about RECORDED reviews only — it never states that the
// content is correct, and it never replaces the institution's own approval process.

export const NEURO_REVIEW_SPECIALTY = "neurology";

export const NEURO_APPROVAL_DOMAINS = [
  {
    key: "neurology",
    label: "Neurology specialist review",
    detail:
      "A qualified Neurology specialist, or the Head of Neurology, reviews the documentation structure, the safety thresholds, the emergency and escalation pathways and the medication rules.",
    headEligible: true,
  },
  {
    key: "emergency_medicine",
    label: "Emergency Medicine review",
    detail:
      "A qualified Emergency Medicine specialist reviews the emergency recognition, time-critical pathways and escalation records for use in the emergency setting.",
    headEligible: false,
  },
];

export const NEURO_APPROVAL_DOMAIN_MAP = NEURO_APPROVAL_DOMAINS.reduce((acc, d) => ({ ...acc, [d.key]: d }), {});

export const NEURO_REVIEW_STATUSES = [
  { value: "approved", label: "Approved", approved: true },
  { value: "approved_with_comments", label: "Approved with comments", approved: true },
  { value: "changes_requested", label: "Changes requested", approved: false },
  { value: "pending_review", label: "Pending review", approved: false },
];

export const NEURO_REVIEW_STATUS_MAP = NEURO_REVIEW_STATUSES.reduce((acc, s) => ({ ...acc, [s.value]: s }), {});

export const NEURO_DEPLOYMENT_GATE_NOTE =
  "These neurology decision-support features remain NOT APPROVED FOR CLINICAL DEPLOYMENT until a Neurology specialist (including the Head of Neurology) and an Emergency Medicine specialist each record an approving decision. Until then the records are documentation and advisory tools only and must not be relied on as a validated clinical decision-support system.";

const stamp = (review) => review.decision_datetime || review.updated_date || review.created_date || "";

const latestByDomain = (reviews) => {
  const out = {};
  (Array.isArray(reviews) ? reviews : []).forEach((r) => {
    if (!r || typeof r !== "object") return;
    const domain = String(r.domain || "").trim();
    if (!NEURO_APPROVAL_DOMAIN_MAP[domain]) return;
    if (!out[domain] || stamp(r) > stamp(out[domain])) out[domain] = r;
  });
  return out;
};

// The gate. `reviews` is whatever the register returned; anything unrecognised is
// ignored rather than counted as approval.
export const neurologyApprovalState = (reviews) => {
  const latest = latestByDomain(reviews);
  const domains = NEURO_APPROVAL_DOMAINS.map((d) => {
    const review = latest[d.key] || null;
    const status = review ? NEURO_REVIEW_STATUS_MAP[review.status] || null : null;
    return {
      ...d,
      review,
      status,
      approved: Boolean(status && status.approved),
      reviewer_name: review ? String(review.reviewer_name || "") : "",
      reviewer_title: review ? String(review.reviewer_title || "") : "",
      decision_datetime: review ? String(review.decision_datetime || "") : "",
      comments: review && Array.isArray(review.comments) ? review.comments : [],
      head_confirmed: Boolean(review && review.head_confirmed),
    };
  });

  const blockers = [];
  domains.forEach((d) => {
    if (!d.review) blockers.push(`${d.label}: no decision has been recorded.`);
    else if (d.status && d.status.value === "changes_requested")
      blockers.push(`${d.label}: changes were requested and have not been resolved.`);
    else if (!d.approved) blockers.push(`${d.label}: the recorded decision does not approve the content.`);
  });

  const neurology = domains.find((d) => d.key === "neurology");
  if (neurology && neurology.review && neurology.approved && !neurology.head_confirmed) {
    blockers.push(
      "Head of Neurology confirmation has not been recorded — the Neurology approval must state that the reviewer holds that authority."
    );
  }

  return {
    domains,
    blockers,
    canDeploy: blockers.length === 0,
    reviewed: domains.filter((d) => d.review).length,
  };
};

export const neurologyGateLabel = (state) =>
  state && state.canDeploy
    ? "Approved by the recorded specialist reviews"
    : "Not approved for clinical deployment — specialist sign-off outstanding";