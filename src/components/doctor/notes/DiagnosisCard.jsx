import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

function formatSeen(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return String(dt);
  return `${d.toLocaleDateString()} — ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

// Displays a saved diagnosis: name, type, date/time, authoring physician,
// clinical description, assessment and treatment/management plan. Collapsed by
// default like the clinical note cards; the parent can keep a single entry open
// at a time by passing `open` + `onToggle`.
export default function DiagnosisCard({ diagnosis, open, onToggle, defaultOpen = false }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const expanded = open === undefined ? internalOpen : open;
  const toggle = () => (open === undefined ? setInternalOpen((v) => !v) : onToggle && onToggle());

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
      <button
        type="button"
        onClick={toggle}
        className={`w-full flex flex-wrap items-start justify-between gap-2 text-left ${expanded ? "mb-3" : ""}`}
      >
        <div className="min-w-0 flex items-start gap-2">
          <ChevronDown
            className={`w-4 h-4 mt-0.5 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          <div className="min-w-0">
            <p className="font-medium flex flex-wrap items-center gap-2">
              {diagnosis.diagnosis_name}
              <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {diagnosis.diagnosis_type}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatSeen(diagnosis.created_datetime)} · By {diagnosis.doctor_name || "—"}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-primary uppercase tracking-wide shrink-0">Diagnosis</span>
      </button>
      <div className={`space-y-3 ${expanded ? "" : "hidden"}`}>
        <Field label="Clinical Description" value={diagnosis.description} />
        <Field label="Assessment" value={diagnosis.assessment} />
        <Field label="Treatment / Management Plan" value={diagnosis.treatment_plan} />
      </div>
    </div>
  );
}