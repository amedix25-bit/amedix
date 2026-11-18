import React from "react";
import { Badge } from "@/components/ui/badge";
import { Section, Provenance, Empty, formatStamp } from "./EmergencySummaryUi";

// Documented vaccinations, prioritised for emergency relevance (tetanus first).
// Documented and patient-reported entries stay visibly separate.
export default function EmergencyImmunizationSection({ data = {}, section }) {
  const items = data.items || [];
  return (
    <Section title="Immunization history" status={items.length ? "documented" : "not_documented"} meta={`${items.length} recorded`}>
      {items.length === 0 && <Empty>No immunization documented in AMedix. An absent record does not mean the patient is unvaccinated.</Empty>}
      {items.map((v, i) => (
        <div key={`${v.name}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 py-1.5 last:border-0">
          <span className="text-sm font-medium" dir="auto">
            {v.name}
            {v.doses ? <span className="text-muted-foreground"> · {v.doses}</span> : null}
          </span>
          <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {v.date ? <span>{formatStamp(v.date)}</span> : <span>date not documented</span>}
            <Badge variant="outline" className={v.verification === "patient_reported" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}>
              {v.verification === "patient_reported" ? "Patient reported" : "Documented"}
            </Badge>
          </span>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">{data.note}</p>
      <Provenance item={{ fhir: data.fhir }} />
    </Section>
  );
}