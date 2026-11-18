import React from "react";
import { Section, Provenance, Empty, formatStamp } from "./EmergencySummaryUi";

const GROUPS = [
  { key: "current", label: "Currently prescribed", empty: "No current prescription recorded." },
  { key: "patient_reported", label: "Patient-reported medications", empty: "" },
  { key: "over_the_counter", label: "Over-the-counter", empty: "" },
  { key: "supplements", label: "Supplements and herbal products", empty: "" },
  { key: "recently_stopped", label: "Recently discontinued (last 90 days)", empty: "" },
  { key: "historical", label: "Historical medications", empty: "" },
];

export default function EmergencyMedicationSection({ data = {}, section }) {
  const groups = GROUPS.filter((g) => (data[g.key] || []).length);
  return (
    <Section
      title="Medication summary"
      status={data.status}
      meta={`${(data.current || []).length} current`}
    >
      {groups.length === 0 && <Empty>No medication documented in AMedix.</Empty>}
      {groups.map((g) => (
        <div key={g.key}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</p>
          {(data[g.key] || []).map((m) => (
            <div key={m.id} className="border-b border-border/60 py-1.5 last:border-0">
              <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm font-medium">
                <span dir="auto">
                  {m.name}
                  {m.ingredient && m.ingredient.toLowerCase() !== m.name.toLowerCase() ? <span className="text-muted-foreground"> ({m.ingredient})</span> : null}
                </span>
                {m.high_risk ? <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">{m.high_risk}</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {[m.dose, m.route, m.frequency, m.prn ? "as needed" : "", m.indication].filter(Boolean).join(" · ") || "Dose not documented"}
                {m.status ? ` · ${String(m.status).replace(/_/g, " ")}` : ""}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {[m.started ? `Started ${formatStamp(m.started)}` : "", m.ended ? `Stopped ${formatStamp(m.ended)}` : "", m.prescribed_by ? `Prescribed by ${m.prescribed_by}` : "", m.stop_reason].filter(Boolean).join(" · ")}
              </p>
              <Provenance item={m} />
            </div>
          ))}
        </div>
      ))}

      <div className="rounded-lg border border-border bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground">
        <p>
          Last medication reconciliation: <span className="font-medium text-foreground">{data.last_reconciled_at ? formatStamp(data.last_reconciled_at) : "not recorded"}</span>
          {data.last_reconciled_source ? ` · ${data.last_reconciled_source}` : ""}
        </p>
        <p className="mt-0.5">{data.note}</p>
      </div>
      <Provenance item={{ fhir: data.fhir }} />
    </Section>
  );
}