// The four verification states shown everywhere an identity document appears.
// A submission is Pending Review until an AMedix administrator approves or
// rejects it — the app never verifies an account by itself.
export const VERIFICATION_STATES = {
  none: {
    key: "none",
    label: "Not Submitted",
    description: "No document has been submitted yet.",
    box: "border-border bg-muted/50",
    text: "text-foreground",
    dot: "bg-muted-foreground",
  },
  pending: {
    key: "pending",
    label: "Pending Review",
    description: "Your document was received and is waiting for AMedix administration to review it.",
    box: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  verified: {
    key: "verified",
    label: "Approved",
    description: "Your identity document was reviewed and approved.",
    box: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  rejected: {
    key: "rejected",
    label: "Rejected",
    description: "Your document was not accepted. Please submit a new one.",
    box: "border-destructive/30 bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
};

export function verificationState(status) {
  if (status === "verified") return VERIFICATION_STATES.verified;
  if (status === "pending") return VERIFICATION_STATES.pending;
  if (status === "rejected" || status === "failed") return VERIFICATION_STATES.rejected;
  return VERIFICATION_STATES.none;
}

// A submission counts as complete for registration purposes while it is
// pending review or approved — it is never treated as approved.
export const isSubmitted = (status) => status === "pending" || status === "verified";