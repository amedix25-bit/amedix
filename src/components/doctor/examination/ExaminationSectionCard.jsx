import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { computeSectionStatus, SECTION_STATUS_LABELS } from "@/lib/examinations";
import ExaminationField from "./ExaminationField";

export const SECTION_STATUS_STYLES = {
  not_documented: "bg-muted text-muted-foreground",
  not_assessed: "bg-slate-100 text-slate-600",
  normal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  abnormal: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  partially_completed: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export const SectionStatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
      SECTION_STATUS_STYLES[status] || SECTION_STATUS_STYLES.not_documented
    }`}
  >
    {SECTION_STATUS_LABELS[status]}
  </span>
);

const StatusChip = ({ active, tone, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
      active
        ? tone === "normal"
          ? "bg-emerald-600 text-white border-emerald-600"
          : tone === "muted"
            ? "bg-slate-600 text-white border-slate-600"
            : "bg-red-600 text-white border-red-600"
        : "bg-card text-muted-foreground border-border hover:bg-accent"
    }`}
  >
    {children}
  </button>
);

// One collapsible examination section card, driven entirely by its config spec.
// mode "normal_abnormal": Normal collapses the body; Abnormal reveals
// abnormalFields + a free-text findings box. mode "free": fields always show.
export default function ExaminationSectionCard({ spec, data, onChange, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const status = computeSectionStatus(spec, data);
  const d = data || { status: "", values: {}, notes: "" };

  const setStatus = (s) => {
    onChange({ ...d, status: d.status === s ? "" : s });
    if (s === "abnormal" && !open) setOpen(true);
  };

  const setValue = (fieldKey, v) => onChange({ ...d, values: { ...d.values, [fieldKey]: v } });
  const setNotes = (notes) => onChange({ ...d, notes });

  const bodyHidden =
    spec.mode === "normal_abnormal" && (status === "normal" || status === "not_assessed");
  const showFields = open && !bodyHidden;
  const showAbnormalFields = showFields && status === "abnormal" && (spec.abnormalFields || []).length > 0;
  const showNotes =
    showFields &&
    (spec.mode === "free"
      ? Boolean(spec.notesLabel)
      : status === "abnormal" && Boolean(spec.notesLabel));

  const allFields = [...(spec.fields || []), ...(status === "abnormal" ? spec.abnormalFields || [] : [])];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 p-3 sm:p-4">
        <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          <span className="font-medium text-sm truncate">{spec.title}</span>
        </button>
        {spec.mode === "normal_abnormal" ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusChip active={d.status === "normal"} tone="normal" onClick={() => setStatus("normal")}>
              Normal
            </StatusChip>
            <StatusChip active={d.status === "abnormal"} tone="abnormal" onClick={() => setStatus("abnormal")}>
              Abnormal
            </StatusChip>
            <StatusChip active={d.status === "not_assessed"} tone="muted" onClick={() => setStatus("not_assessed")}>
              Not assessed
            </StatusChip>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusChip active={d.status === "normal"} tone="normal" onClick={() => setStatus("normal")}>
              Mark Normal
            </StatusChip>
            <StatusChip active={d.status === "not_assessed"} tone="muted" onClick={() => setStatus("not_assessed")}>
              Not assessed
            </StatusChip>
          </div>
        )}
        <div className="shrink-0">
          <SectionStatusBadge status={status} />
        </div>
      </div>

      {bodyHidden && open && (
        <div className="px-4 pb-4 text-xs text-muted-foreground">
          {status === "not_assessed" ? (
            <>
              Documented as <span className="font-medium">Not Assessed</span> — this section is not recorded as
              normal. Select Abnormal to document findings.
            </>
          ) : (
            <>
              Documented as <span className="font-medium text-emerald-600">Normal</span>. Select Abnormal to add
              findings.
            </>
          )}
        </div>
      )}

      {showFields && (
        <div className="px-3 sm:px-4 pb-4 space-y-4 border-t border-border pt-4">
          {(spec.fields || []).length === 0 && status !== "abnormal" && (
            <p className="text-xs text-muted-foreground">Select Abnormal to document findings.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            {allFields.map((f) => (
              <ExaminationField
                key={f.key}
                field={f}
                value={d.values?.[f.key]}
                onChange={(v) => setValue(f.key, v)}
              />
            ))}
          </div>
          {showAbnormalFields && (spec.abnormalFields || []).length > 0 && status === "abnormal" && (
            <p className="text-[11px] text-muted-foreground -mt-2">Detailed findings for abnormal result</p>
          )}
          {showNotes && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {spec.notesLabel || "Findings"}
              </label>
              <Textarea
                className="text-xs min-h-16"
                placeholder="Free-text clinical findings…"
                value={d.notes || ""}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}