import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Send, CheckCircle2, Loader2 } from "lucide-react";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";

export const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-50 text-blue-700",
  viewed: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
};

export const URGENCY_STYLES = {
  Routine: "bg-emerald-50 text-emerald-700",
  Urgent: "bg-amber-50 text-amber-700",
  Emergency: "bg-red-50 text-red-700",
};

export default function ReferralLetterCard({ referral, doctorName, onUpdated }) {
  const [showAudit, setShowAudit] = useState(false);
  const [busy, setBusy] = useState(false);

  const changeStatus = async (status, action) => {
    setBusy(true);
    try {
      await base44.entities.ReferralLetter.update(referral.id, {
        status,
        audit_trail: [
          ...(referral.audit_trail || []),
          {
            action,
            by_name: doctorName,
            by_role: "doctor",
            datetime: new Date().toISOString(),
          },
        ],
      });
      onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">{referral.referral_number}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${URGENCY_STYLES[referral.urgency] || ""}`}>
              {referral.urgency}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[referral.status] || ""}`}>
              {referral.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            To: {referral.receiving_doctor}
            {referral.receiving_specialty ? ` — ${referral.receiving_specialty}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {referral.referral_date} · {referral.working_diagnosis || referral.reason_for_referral || ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {referral.pdf_url && (
            <ClinicalFileButton
              kind="referral_letter"
              id={referral.id}
              fileRef={referral.pdf_url}
              className="text-sm text-primary hover:underline"
            >
              View PDF
            </ClinicalFileButton>
          )}
          {referral.status === "draft" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => changeStatus("sent", "sent")}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
              Mark as Sent
            </Button>
          )}
          {referral.status !== "completed" && referral.status !== "draft" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => changeStatus("completed", "completed")}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
              Mark as Completed
            </Button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAudit(!showAudit)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3"
      >
        {showAudit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Audit trail ({(referral.audit_trail || []).length})
      </button>
      {showAudit && (
        <div className="mt-2 rounded-lg bg-muted/60 p-3 space-y-1.5">
          {(referral.audit_trail || []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No activity recorded.</p>
          ) : (
            [...(referral.audit_trail || [])].reverse().map((entry, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                <span className="font-medium capitalize text-foreground">{entry.action}</span> by {entry.by_name || entry.by_role || "user"} —{" "}
                {new Date(entry.datetime).toLocaleString()}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
}