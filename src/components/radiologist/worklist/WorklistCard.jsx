import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileText, Hand, Loader2 } from "lucide-react";
import { ResolvedFileButton } from "@/components/radiology/ResolvedFile";
import { STAGE_LABELS, STAGE_CHIP } from "@/lib/radiologyWorkflow";
import { formatDate, formatDateTime, reportStatus, studyMatch } from "@/lib/radiologistWorklist";
import RadiAntRequestLink from "@/components/radiologist/imaging/RadiAntRequestLink";

const OWNERSHIP = {
  mine: { label: "Yours", chip: "bg-blue-500/15 text-blue-700" },
  other: { label: "Other radiologist", chip: "bg-purple-500/15 text-purple-700" },
  finalized: { label: "Finalized", chip: "bg-emerald-500/15 text-emerald-700" },
  unassigned: { label: "Unassigned", chip: "bg-amber-500/15 text-amber-700" },
};

const PRIORITY_CHIP = {
  Emergency: "bg-red-500 text-white",
  Urgent: "bg-red-500/10 text-red-700",
};

const Field = ({ label, children }) => (
  <div className="min-w-0">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="text-xs break-words">{children}</div>
  </div>
);

// One worklist study as a stacked card — the same information as the table
// row, reorganised for phones and tablets so nothing needs horizontal swiping.
export default function WorklistCard({ row: r, claiming, onOpen, onClaim }) {
  const owner = OWNERSHIP[r.ownership] || OWNERSHIP.unassigned;
  const match = studyMatch(r.study_match);
  const report = reportStatus(r.report_status);
  const claimable =
    r.ownership === "unassigned" &&
    ["ready_for_reporting", "performed", "examination_completed"].includes(r.stage);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <button type="button" onClick={() => onOpen(r.id)} className="w-full text-left min-w-0">
        <p className="font-semibold leading-tight flex items-start gap-1.5">
          <span className="min-w-0 break-words">{r.patient_name}</span>
          {r.is_critical && <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />}
        </p>
        <p className="font-mono text-xs text-muted-foreground mt-0.5 break-all">{r.patient_cin}</p>
      </button>

      <div className="flex flex-wrap gap-1">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${owner.chip}`}>
          {r.ownership === "other" && r.assigned_radiologist_name
            ? `Dr. ${r.assigned_radiologist_name}`
            : owner.label}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STAGE_CHIP[r.stage] || "bg-secondary"}`}>
          {STAGE_LABELS[r.stage]}
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            PRIORITY_CHIP[r.priority] || "bg-secondary text-muted-foreground"
          }`}
        >
          {r.priority}
        </span>
        {r.is_overdue && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-700">Overdue</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Examination">
          {r.examination}
          {r.body_part && <span className="text-muted-foreground"> · {r.body_part}</span>}
        </Field>
        <Field label="Modality">{r.modality}</Field>
        <Field label="Study date">
          {formatDate(r.study_date)}
          <span className="text-muted-foreground"> · {r.images_count} image file(s)</span>
        </Field>
        <Field label="Ordering doctor">
          {r.ordering_doctor || "—"}
          <span className="text-muted-foreground"> · {r.routed_hospital || "—"}</span>
        </Field>
        <Field label="Study matching">
          <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${match.chip}`}>
            {match.label}
          </span>
        </Field>
        <Field label="Reporting status">
          <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${report.chip}`}>
            {report.label}
          </span>
          {r.report_version ? (
            <span className="block text-[11px] text-muted-foreground mt-1">
              v{r.report_version} · {r.signed_by_name || ""}
              {r.signed_datetime ? ` · ${formatDateTime(r.signed_datetime)}` : ""}
            </span>
          ) : r.draft_radiologist_name ? (
            <span className="block text-[11px] text-muted-foreground mt-1">Dr. {r.draft_radiologist_name}</span>
          ) : null}
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" variant="outline" className="h-8" onClick={() => onOpen(r.id)}>
          Open Case
        </Button>
        {claimable && (
          <Button size="sm" className="h-8" disabled={claiming === r.id} onClick={() => onClaim(r)}>
            {claiming === r.id ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Hand className="w-3.5 h-3.5 mr-1" />
            )}
            Take Case
          </Button>
        )}
        <ResolvedFileButton
          requestId={r.id}
          fileRef={r.pdf_url}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent disabled:opacity-40"
        >
          <FileText className="w-4 h-4 shrink-0" />
          View PDF
        </ResolvedFileButton>
        <RadiAntRequestLink requestId={r.id} requestRef={r.request_id} />
      </div>
    </div>
  );
}