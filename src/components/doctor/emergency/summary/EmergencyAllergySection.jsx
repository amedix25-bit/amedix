import React from "react";
import { Section, StatusChip, Provenance, Empty } from "./EmergencySummaryUi";

const GROUP_LABEL = {
  drug: "Medication allergies",
  food: "Food allergies",
  latex: "Latex allergy",
  contrast: "Contrast media reactions",
  environmental: "Environmental allergies",
  other: "Other documented allergies",
};

// Every allergy and intolerance the patient's record holds, grouped by type and
// kept separate from reported side effects. The status line is always shown so
// an empty list can never be mistaken for "no known allergies".
export default function EmergencyAllergySection({ data = {}, section }) {
  const items = data.items || [];
  const groups = Object.keys(GROUP_LABEL)
    .map((key) => ({ key, label: GROUP_LABEL[key], rows: items.filter((a) => a.entry_type !== "reported_side_effect" && a.type === key) }))
    .filter((g) => g.rows.length);

  return (
    <Section title="Allergies and intolerances" status={data.status} meta={section?.last_updated ? `Last recorded ${section.last_updated}` : ""} defaultOpen>
      <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-800">
        Critical safety information
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        Status: <StatusChip status={data.status} />
        {data.status === "no_known_allergies" ? <span>Explicitly assessed and documented as no known allergies.</span> : null}
        {data.status === "unknown" ? <span>Allergy status not established in the record.</span> : null}
        {data.status === "unable_to_obtain" ? <span>Patient cannot provide information and no reliable source is available.</span> : null}
      </div>

      {groups.length === 0 && <Empty>No confirmed allergy documented{data.status === "no_known_allergies" ? " — the patient was assessed as having none" : ""}.</Empty>}

      {groups.map((g) => (
        <div key={g.key}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</p>
          {g.rows.map((a) => (
            <div key={a.id} className="border-b border-border/60 py-2 last:border-0">
              <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-medium">
                <span dir="auto">{a.allergen}</span>
                <span className="text-[11px] uppercase tracking-wide text-red-800">{a.severity || "severity not documented"}</span>
              </p>
              <p className="text-xs text-muted-foreground" dir="auto">
                {[a.reaction, a.treatment_required ? `Treatment: ${a.treatment_required}` : ""].filter(Boolean).join(" · ") || "Reaction not documented"}
              </p>
              <Provenance item={a} />
            </div>
          ))}
        </div>
      ))}

      {(data.intolerances || []).length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Medication intolerances / reported side effects</p>
          {(data.intolerances || []).map((a) => (
            <div key={a.id} className="border-b border-border/60 py-2 last:border-0">
              <p className="text-sm font-medium" dir="auto">{a.allergen}</p>
              <p className="text-xs text-muted-foreground" dir="auto">{a.reaction || "Not documented"}</p>
              <Provenance item={a} />
            </div>
          ))}
        </div>
      )}

      {(data.serious_adverse_reactions || []).length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-800">Serious adverse drug reactions</p>
          {(data.serious_adverse_reactions || []).map((a) => (
            <p key={a.id} className="text-sm" dir="auto">
              {a.allergen} — {a.reaction || "reaction not documented"}
            </p>
          ))}
        </div>
      )}
      <Provenance item={{ fhir: "AllergyIntolerance" }} />
    </Section>
  );
}