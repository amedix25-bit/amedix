import React from "react";

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
// clinical description, assessment and treatment/management plan.
export default function DiagnosisCard({ diagnosis }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
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
        <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">Diagnosis</span>
      </div>
      <div className="space-y-3">
        <Field label="Clinical Description" value={diagnosis.description} />
        <Field label="Assessment" value={diagnosis.assessment} />
        <Field label="Treatment / Management Plan" value={diagnosis.treatment_plan} />
      </div>
    </div>
  );
}