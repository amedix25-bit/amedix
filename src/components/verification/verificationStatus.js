// The verification states shown wherever an identity document appears.
//
// A document is verified by the AMedix automated engine alone: the number
// printed on the document is read and compared with the number the user
// entered. There is no review queue and no human decision.
export const VERIFICATION_STATES = {
  none: {
    key: "none",
    label: "Not Verified",
    description: "No document number has been verified yet.",
    box: "border-border bg-muted/50",
    text: "text-foreground",
    dot: "bg-muted-foreground",
  },
  // Legacy records submitted before the automated engine existed.
  pending: {
    key: "pending",
    label: "Submit Again",
    description: "This document was submitted under the previous process. Submit it once more to have its number verified automatically.",
    box: "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400",
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
  unreadable: {
    key: "unreadable",
    label: "Could Not Be Read",
    description: "The number could not be read from this document. Upload a clearer photograph or a PDF.",
    box: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};

export function verificationState(status, autoCheck) {
  // A legacy submission whose own automated run already matched the number is
  // verified — the match itself is the verification, not the old queue.
  if (status === "pending" && autoCheck && autoCheck.outcome === "match") return VERIFICATION_STATES.verified;
  if (status === "verified") return VERIFICATION_STATES.verified;
  if (status === "pending") return VERIFICATION_STATES.pending;
  if (status === "rejected") return VERIFICATION_STATES.rejected;
  if (status === "failed") return VERIFICATION_STATES.unreadable;
  return VERIFICATION_STATES.none;
}

// A verification counts for registration only when the document number was
// matched. A mismatch, an unreadable document or a missing number never counts.
export const isSubmitted = (result) => {
  if (!result) return false;
  if (typeof result === "string") return result === "verified";
  if (result.status === "verified") return true;
  return result.status === "pending" && result.auto_check?.outcome === "match";
};

export const isVerified = isSubmitted;