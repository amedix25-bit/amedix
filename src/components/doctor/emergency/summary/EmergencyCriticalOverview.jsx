import React from "react";
import { AlertTriangle, Pill, ShieldAlert, Stethoscope, Siren } from "lucide-react";
import { Section, StatusChip, Provenance, Empty } from "./EmergencySummaryUi";

const LEVEL_TONE = {
  critical: "border-red-300 bg-red-50 text-red-900",
  high: "border-amber-300 bg-amber-50 text-amber-900",
  medium: "border-border bg-muted text-foreground",
  info: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

// The first screen the treating doctor sees: identity risks in seconds, without
// scrolling. Allergy status is always stated explicitly — an empty list is never
// presented as "no known allergies".
export default function EmergencyCriticalOverview({ critical = {}, allergies = {} }) {
  const warnings = critical.warnings || [];
  return (
    <div className="space-y-3">
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((w, i) => (
            <div key={`${w.text}-${i}`} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${LEVEL_TONE[w.level] || LEVEL_TONE.medium}`}>
              {w.level === "critical" ? <Siren className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span className="min-w-0 break-words" dir="auto">{w.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Section
          title="Allergies and intolerances"
          status={allergies.status}
          meta={`${(allergies.items || []).length} entr${(allergies.items || []).length === 1 ? "y" : "ies"}`}
          tone="border-red-200"
        >
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-red-700">
            <ShieldAlert className="h-3.5 w-3.5" /> Critical safety information
          </div>
          {(allergies.confirmed || []).length === 0 && allergies.status === "no_known_allergies" && (
            <Empty>No known allergies — explicitly assessed and documented.</Empty>
          )}
          {(critical.allergies || []).map((a) => (
            <div key={a.id} className="rounded-lg border border-red-200 bg-red-50/70 p-2">
              <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold text-red-900">
                <span dir="auto">{a.allergen}</span>
                <span className="text-[11px] font-normal uppercase tracking-wide">{a.severity || "severity not documented"}</span>
              </p>
              <p className="text-xs text-red-900/90" dir="auto">
                {[a.type, a.reaction, a.treatment_required ? `treated with ${a.treatment_required}` : ""].filter(Boolean).join(" · ") || "Reaction not documented"}
              </p>
              <Provenance item={a} />
            </div>
          ))}
          {(critical.intolerances || []).length > 0 && (
            <div className="pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Intolerances / adverse reactions</p>
              {(critical.intolerances || []).map((a) => (
                <div key={a.id} className="border-b border-border/60 py-1.5 last:border-0">
                  <p className="text-sm font-medium" dir="auto">{a.allergen}</p>
                  <p className="text-xs text-muted-foreground" dir="auto">{a.reaction || "Reaction not documented"}</p>
                  <Provenance item={a} />
                </div>
              ))}
            </div>
          )}
          {allergies.status === "unknown" && <Empty>Allergy status not established — assess the patient directly.</Empty>}
          {allergies.status === "unable_to_obtain" && <Empty>Patient unable to provide allergy information and no reliable source is available.</Empty>}
        </Section>

        <Section title="High-risk medications" status={critical.high_risk_medications && critical.high_risk_medications.length ? "documented" : "not_documented"}>
          {(critical.high_risk_medications || []).length === 0 ? (
            <Empty>No high-risk medication recorded as current.</Empty>
          ) : (
            (critical.high_risk_medications || []).map((m) => (
              <div key={m.id} className="border-b border-border/60 py-1.5 last:border-0">
                <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-medium">
                  <span dir="auto">{m.name}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                    <Pill className="h-3 w-3" /> {m.high_risk}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{[m.dose, m.route, m.frequency, m.indication].filter(Boolean).join(" · ") || "Dose not documented"}</p>
                <Provenance item={m} />
              </div>
            ))
          )}
        </Section>

        <Section title="Active medical problems" status={(critical.active_problems || []).length ? "documented" : "not_documented"}>
          {(critical.active_problems || []).length === 0 ? (
            <Empty>No active problem documented in AMedix.</Empty>
          ) : (
            (critical.active_problems || []).map((c) => (
              <div key={c.id} className="border-b border-border/60 py-1.5 last:border-0">
                <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-medium">
                  <span dir="auto">{c.name}</span>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.status.replace(/_/g, " ")}</span>
                </p>
                {c.details ? <p className="text-xs text-muted-foreground" dir="auto">{c.details}</p> : null}
                <Provenance item={c} />
              </div>
            ))
          )}
        </Section>

        <Section title="Blood group and emergency contact">
          <div className="flex items-start gap-2 text-sm">
            <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p>
                <span className="font-medium">{critical.blood_group || "Blood group not documented"}</span>
                <span className="ml-2 inline-flex align-middle">
                  <StatusChip status={critical.blood_group ? (critical.blood_group_verified ? "documented" : "unverified") : "not_documented"} />
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {critical.blood_group_verified
                  ? "Documented by an AMedix laboratory result — confirm with the hospital blood bank before transfusion."
                  : "For clinical reference only; verify before any transfusion."}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Emergency contact</p>
            {critical.emergency_contact ? (
              <p className="text-sm">
                <span className="font-medium" dir="auto">{critical.emergency_contact.name}</span>
                {critical.emergency_contact.relationship ? ` · ${critical.emergency_contact.relationship}` : ""}
                {critical.emergency_contact.phone ? ` · ${critical.emergency_contact.phone}` : ""}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Not documented</p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}