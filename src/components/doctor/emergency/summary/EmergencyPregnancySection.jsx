import React from "react";
import { Section, StatusChip, formatStamp } from "./EmergencySummaryUi";

// Pregnancy is never inferred from a missing record: the shown status is the
// one the patient's AMedix record actually carries.
export default function EmergencyPregnancySection({ data = {} }) {
  if (data.status === "not_applicable") {
    return (
      <Section title="Women's health and pregnancy" status="not_applicable">
        <p className="text-sm text-muted-foreground">Not applicable for this patient's recorded sex.</p>
      </Section>
    );
  }
  const rows = [
    ["Gestational age", data.gestational_age],
    ["Estimated due date", data.estimated_due_date],
    ["Last menstrual period", data.last_menstrual_period],
    ["Obstetric history", data.obstetric_summary],
    ["Previous ectopic pregnancy", data.previous_ectopic ? "Yes — documented" : ""],
    ["Pregnancy complications", data.complications],
    ["Current contraception", data.contraception],
  ].filter(([, v]) => String(v || "").trim());

  return (
    <Section title="Women's health and pregnancy" status={data.status} meta={data.status_confirmed_at ? `Status recorded ${formatStamp(data.status_confirmed_at)}` : ""}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        Pregnancy status: <StatusChip status={data.status} />
      </div>
      {data.status === "unknown" && (
        <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
          Pregnancy status is unknown — do not assume the patient is not pregnant.
        </p>
      )}
      {data.status === "not_assessed" && (
        <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
          Pregnancy has not been assessed in AMedix — assess before investigations or drug selection.
        </p>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No further pregnancy or obstetric detail documented.</p>
      ) : (
        <div className="space-y-1">
          {rows.map(([label, value]) => (
            <p key={label} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 py-1 text-sm last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="min-w-0 break-words font-medium" dir="auto">{value}</span>
            </p>
          ))}
        </div>
      )}
    </Section>
  );
}