import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldX, ShieldAlert, PauseCircle, PlayCircle, Trash2, Loader2 } from "lucide-react";

const TYPE_LABEL = {
  doctor: "Doctor",
  hospital: "Hospital",
  patient: "Patient",
  admin: "Administrator",
  none: "No clinical profile",
};

// One account in the governance list, with exactly the controls an AMedix
// administrator may apply. Every button calls the server, which re-checks the
// administrator's role and records the change in the audit trail.
export default function AccountActionRow({ account, busy, onAct }) {
  const isBusy = busy === account.user_id;
  const canVerify = account.account_type === "doctor" || account.account_type === "patient";
  const isTest = account.classification === "test_account" || account.classification === "suspected_test";

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{account.display_name || account.email || "Unnamed account"}</p>
            <Badge variant="outline">{TYPE_LABEL[account.account_type] || account.account_type}</Badge>
            {account.eligible ? (
              <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
                <ShieldCheck className="h-3 w-3" /> Eligible
              </Badge>
            ) : (
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                Not eligible
              </Badge>
            )}
            {account.status !== "active" && (
              <Badge variant="outline" className="border-critical/30 bg-critical/10 text-critical">
                {account.status}
              </Badge>
            )}
            {isTest && (
              <Badge variant="outline" className="border-critical/30 bg-critical/10 text-critical">
                {account.classification === "test_account" ? "Test account" : "Suspected test"}
              </Badge>
            )}
            {account.review_state === "flagged" && !isTest && (
              <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
                Flagged
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {[account.email, account.specialty, account.hospital, account.cin && `CIN ${account.cin}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {account.reason && <p className="mt-1 text-[11px] text-muted-foreground">{account.reason}</p>}
          {account.test_evidence?.length > 0 && (
            <p className="mt-1 text-[11px] text-critical">Identified by: {account.test_evidence.join("; ")}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {canVerify && account.verification_status !== "verified" && (
            <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onAct(account, "setVerification", { verification_status: "verified" })}>
              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />} Approve
            </Button>
          )}
          {canVerify && account.verification_status !== "rejected" && (
            <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onAct(account, "setVerification", { verification_status: "rejected" })}>
              <ShieldX className="h-3.5 w-3.5" /> Reject
            </Button>
          )}
          {account.status === "active" ? (
            <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onAct(account, "setStatus", { status: "suspended" })}>
              <PauseCircle className="h-3.5 w-3.5" /> Suspend
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onAct(account, "setStatus", { status: "active" })}>
              <PlayCircle className="h-3.5 w-3.5" /> Reactivate
            </Button>
          )}
          {!isTest && (
            <Button size="sm" variant="ghost" disabled={isBusy} onClick={() => onAct(account, "classify", { classification: "suspected_test" })}>
              <ShieldAlert className="h-3.5 w-3.5" /> Flag
            </Button>
          )}
          {isTest && (
            <Button size="sm" variant="ghost" disabled={isBusy} onClick={() => onAct(account, "classify", { classification: "legitimate" })}>
              Clear
            </Button>
          )}
          {isTest && (
            <Button size="sm" variant="destructive" disabled={isBusy} onClick={() => onAct(account, "removeTestAccount")}>
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}