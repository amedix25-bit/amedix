import React from "react";
import { Section, Provenance, Empty } from "./EmergencySummaryUi";

// Structured problem list: active and clinically significant first, resolved
// history kept separate. Family history that could change emergency assessment
// (premature cardiac disease, sudden death, inherited bleeding/clotting) is
// marked and sorted to the top.
export default function EmergencyProblemSection({ data = {}, section }) {
  const active = data.active || [];
  const family = data.family_history || [];
  return (
    <Section title="Active problems and medical history" status={active.length ? "documented" : "not_documented"} meta={`${active.length} active`}>
      {active.length === 0 && (data.resolved || []).length === 0 && <Empty>No medical problem documented in AMedix.</Empty>}
      {(data.active || []).map((c) => (
        <div key={c.id} className="border-b border-border/60 py-1.5 last:border-0">
          <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-medium">
            <span dir="auto">
              {c.name}
              {c.name_ar ? <span className="text-muted-foreground" dir="rtl"> · {c.name_ar}</span> : null}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-emerald-800">{String(c.status).replace(/_/g, " ")}</span>
          </p>
          {c.details ? <p className="text-xs text-muted-foreground" dir="auto">{c.details}</p> : null}
          <p className="text-[11px] text-muted-foreground">
            {[c.since ? `Since ${c.since}` : "Diagnosis date not documented", c.treating_facility].filter(Boolean).join(" · ")}
          </p>
          <Provenance item={c} />
        </div>
      ))}

      {(data.resolved || []).length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Resolved / historical conditions</p>
          {(data.resolved || []).map((c) => (
            <p key={c.id} className="border-b border-border/60 py-1 text-sm last:border-0" dir="auto">
              {c.name}
              {c.since ? <span className="text-xs text-muted-foreground"> · {c.since}</span> : null}
            </p>
          ))}
        </div>
      )}

      {family.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Family history</p>
          {family.map((f) => (
            <div key={f.id} className="border-b border-border/60 py-1.5 last:border-0">
              <p className="text-sm" dir="auto">
                <span className="font-medium">{f.condition}</span>
                <span className="text-muted-foreground"> · {f.relation}</span>
                {f.age_at_diagnosis ? <span className="text-xs text-muted-foreground"> · age {f.age_at_diagnosis}</span> : null}
                {f.emergency_relevant ? <span className="ml-1 rounded border border-amber-300 bg-amber-50 px-1 text-[10px] font-semibold uppercase text-amber-800">Emergency relevant</span> : null}
              </p>
              {f.notes ? <p className="text-xs text-muted-foreground" dir="auto">{f.notes}</p> : null}
              <Provenance item={f} />
            </div>
          ))}
        </div>
      )}
      <Provenance item={{ fhir: "Condition / FamilyMemberHistory" }} />
    </Section>
  );
}