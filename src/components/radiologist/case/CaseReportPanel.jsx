import React from "react";
import { BadgeCheck, FileSignature, History } from "lucide-react";
import ReportingWorkspace from "@/components/radiologist/review/ReportingWorkspace";
import { caseReportState, formatDateTime } from "@/lib/radiologistWorklist";

// Right panel — the structured report and its lifecycle. The lifecycle shown
// here is derived from the records that actually exist: saved drafts, a
// submitted preliminary report, the signed versions and any amendment.
export default function CaseReportPanel({ study, user, radiologistProfile, reportVersions, draftReports, onChanged }) {
  const state = caseReportState(study, reportVersions, draftReports);
  const signed = state.version || null;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground/70">Report status</p>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${state.chip}`}>{state.label}</span>
        </div>
        <ol className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {["Draft", "Preliminary", "Signature", "Final"].map((step, i) => {
            const reached = ["draft", "in_progress", "awaiting_signature", "finalized", "released", "amended"].indexOf(state.key) >= [1, 2, 2, 4][i];
            return (
              <li key={step} className={`flex-1 text-center rounded px-1 py-1 ${reached ? "bg-primary/10 text-primary font-semibold" : "bg-muted/60"}`}>
                {step}
              </li>
            );
          })}
        </ol>
        {signed ? (
          <div className="rounded-lg bg-emerald-500/10 p-2 text-[11px] text-emerald-800 space-y-0.5">
            <p className="flex items-center gap-1 font-semibold">
              <BadgeCheck className="w-3.5 h-3.5" />
              {signed.is_amendment ? `Amended version ${signed.version}` : `Signed by ${signed.signed_by_name || "radiologist"}`}
            </p>
            <p className="flex items-center gap-1 text-emerald-700/90">
              <History className="w-3 h-3" /> {formatDateTime(signed.signed_datetime)} · version {signed.version}
            </p>
            {signed.is_amendment && signed.amendment_reason && (
              <p className="text-emerald-700/90">Reason: {signed.amendment_reason}</p>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground flex items-start gap-1">
            <FileSignature className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Signing requires your active radiologist account; the signature, author and timestamp are recorded on an
            immutable report version.
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Reporting radiologist: <span className="font-medium text-foreground">{radiologistProfile?.full_name || user?.full_name || "—"}</span>
        </p>
      </div>

      <ReportingWorkspace
        study={study}
        user={user}
        radiologistProfile={radiologistProfile}
        reportVersions={reportVersions}
        onChanged={onChanged}
      />
    </div>
  );
}