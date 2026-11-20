// The verification states shown wherever an identity document appears.
//
// The state is driven by the job lifecycle, not by a single "did the upload
// work" flag: a document that is saved but not yet checked, one whose worker was
// interrupted, and one waiting for an administrator are all distinct, and none
// of them ever asks the user to upload the document again.
export const VERIFICATION_STATES = {
  none: {
    key: "none",
    label: "Not Verified",
    description: "No document has been submitted yet.",
    box: "border-border bg-muted/50",
    text: "text-foreground",
    dot: "bg-muted-foreground",
  },
  uploaded: {
    key: "processing",
    label: "Saved",
    description: "Your document is saved. Checking starts automatically.",
    box: "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  processing: {
    key: "processing",
    label: "Checking",
    description: "The document number is being read. You can leave this page — the check continues.",
    box: "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  processing_failed: {
    key: "retry",
    label: "Check Interrupted",
    description: "Checking was interrupted. Your document is safe — try again without uploading it.",
    box: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  manual_review: {
    key: "review",
    label: "Under Review",
    description: "An AMedix reviewer is checking this document. Nothing else is needed from you.",
    box: "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  pending_approval: {
    key: "review",
    label: "Awaiting Approval",
    description: "The document was accepted and the account activation is being completed.",
    box: "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  approved: {
    key: "verified",
    label: "Verified",
    description: "The number printed on the document matches the number you entered.",
    box: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  verified: {
    key: "verified",
    label: "Verified",
    description: "The number printed on the document matches the number you entered.",
    box: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  rejected: {
    key: "rejected",
    label: "Numbers Do Not Match",
    description: "The number printed on the document does not match the number you entered.",
    box: "border-destructive/30 bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  // Legacy states kept so older records still render correctly.
  pending: {
    key: "review",
    label: "Submitted",
    description: "This submission is waiting for a decision.",
    box: "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  failed: {
    key: "review",
    label: "Could Not Be Read",
    description: "The number could not be read from this document.",
    box: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};

export function verificationState(result) {
  const status = typeof result === "string" ? result : result?.job_status || result?.status;
  if (!status) return VERIFICATION_STATES.none;
  if (VERIFICATION_STATES[status]) return VERIFICATION_STATES[status];
  return VERIFICATION_STATES.none;
}

// A verification counts for registration only when the document number was
// matched — automatically, or by the administrator who reviewed it. A pending
// review, a mismatch or an unreadable document never counts.
export const isSubmitted = (result) => {
  if (!result) return false;
  if (typeof result === "string") return result === "verified" || result === "approved";
  if (result.status === "verified") return true;
  if (result.job_status === "approved") return true;
  return result.status === "pending" && result.auto_check?.outcome === "match";
};

export const isVerified = isSubmitted;

export const isInReview = (result) =>
  !!result && ["manual_review", "pending_approval", "processing", "uploaded", "processing_failed"].includes(result.job_status);