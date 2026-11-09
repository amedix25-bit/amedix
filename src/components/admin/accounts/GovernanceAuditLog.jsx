import React from "react";

const ACTION_STYLE = {
  verification_approved: "text-success",
  messaging_allowed: "text-success",
  account_reactivated: "text-success",
  verification_rejected: "text-critical",
  account_suspended: "text-warning",
  account_blocked: "text-critical",
  test_account_removed: "text-critical",
  security_rejection: "text-critical",
  messaging_blocked: "text-warning",
};

// The administrator-only, append-only trail of verification decisions, account
// removals, messaging-permission changes and backend security rejections.
export default function GovernanceAuditLog({ entries = [] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center text-xs text-muted-foreground">
        No governance events recorded yet.
      </p>
    );
  }
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {entries.map((entry) => (
        <div key={entry.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5">
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${ACTION_STYLE[entry.action] || "text-foreground"}`}>
              {entry.action_label || entry.action}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {[entry.account_name || entry.email, entry.detail].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <p>{entry.actor_name || "System"}{entry.actor_role ? ` · ${entry.actor_role}` : ""}</p>
            <p>{new Date(entry.datetime).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}