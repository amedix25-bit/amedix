import React from "react";
import { ShieldAlert } from "lucide-react";

// Shown wherever messaging is closed to the signed-in account. The reasons are
// the exact blockers returned by the server — never re-worded in the browser.
export default function MessagingLocked({ eligibility, title = "Secure messaging is closed for this account" }) {
  const blockers = eligibility?.blockers || [];
  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="space-y-2">
          <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            AMedix messaging is available only to verified, approved and active accounts.
          </p>
          {blockers.length > 0 && (
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-muted-foreground">
            Your existing records are unaffected. Contact AMedix administration if you believe this is an error.
          </p>
        </div>
      </div>
    </div>
  );
}