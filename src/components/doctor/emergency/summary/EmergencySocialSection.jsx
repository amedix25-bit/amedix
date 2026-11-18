import React from "react";
import { Section, Empty } from "./EmergencySummaryUi";

const ROWS = [
  ["Smoking / tobacco", "smoking", "tobacco_details"],
  ["Alcohol use", "alcohol"],
  ["Recreational substance use", "substance_use"],
  ["Living situation", "living_situation", "living_details"],
  ["Mobility and function", "mobility"],
  ["Occupation", "occupation", "occupational_exposure"],
];

export default function EmergencySocialSection({ data = {}, section }) {
  const rows = ROWS.map(([label, key, extra]) => {
    const value = data[key];
    const extraValue = extra ? data[extra] : "";
    return { label, value: [value, extraValue].filter(Boolean).join(" · ") };
  });
  const documented = rows.filter((r) => r.value);
  const missing = rows.filter((r) => !r.value);

  return (
    <Section title="Substance use and social information" status={documented.length ? "documented" : "not_documented"} meta={`${documented.length} recorded`}>
      {documented.length === 0 && <Empty>No substance use or social information documented in AMedix.</Empty>}
      {documented.map((r) => (
        <p key={r.label} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 py-1.5 text-sm last:border-0">
          <span className="text-muted-foreground">{r.label}</span>
          <span className="min-w-0 break-words font-medium" dir="auto">{r.value.replace(/_/g, " ")}</span>
        </p>
      ))}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {missing.map((r) => (
          <span key={r.label} className="rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {r.label}: not documented
          </span>
        ))}
        <span className="rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Cognitive impairment: not documented</span>
        <span className="rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Caregiver / equipment dependence: not documented</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Shown only where it changes emergency assessment or discharge planning · FHIR Observation/SocialHistory
      </p>
    </Section>
  );
}