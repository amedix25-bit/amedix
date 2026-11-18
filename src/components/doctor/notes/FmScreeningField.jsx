import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, ShieldCheck, Syringe } from "lucide-react";
import { buildFmScreeningItems, buildFmImmunizationItems, screeningContextFromNote } from "@/lib/fmScreening";
import { fmReference } from "@/lib/fmReferences";
import { asObject, ageFromDob } from "@/lib/fmFieldKit";

const asObjectSafe = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

const DECISIONS = [
  "Addressed today",
  "Already up to date",
  "Booked",
  "Declined by patient",
  "Not indicated — reason documented",
];

// Preventive care for this patient: the services that are APPLICABLE by age, sex and
// documented risk conditions, with the issuing body and grade. AMedix does not know
// what was done elsewhere, so an item is never marked overdue — the clinician records
// what happened at this visit, and the choice is stored with the note.
export default function FmScreeningField({ value, onChange, values, patientId }) {
  const state = asObjectSafe(value);
  const decisions = asObjectSafe(state.decisions);
  const [patient, setPatient] = useState({ age: null, sex: "", unavailable: false });
  const [loading, setLoading] = useState(Boolean(patientId));

  useEffect(() => {
    let cancelled = false;
    if (!patientId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const profile = await base44.entities.PatientProfile.get(patientId);
        if (cancelled) return;
        const sex = profile?.gender === "female" ? "Female" : profile?.gender === "male" ? "Male" : "";
        setPatient({ age: ageFromDob(profile?.date_of_birth), sex, unavailable: false });
      } catch {
        if (!cancelled) setPatient({ age: null, sex: "", unavailable: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const context = useMemo(() => screeningContextFromNote(values || {}), [values]);
  const screenings = useMemo(() => buildFmScreeningItems({ age: patient.age, sex: patient.sex, context }), [patient, context]);
  const immunizations = useMemo(() => buildFmImmunizationItems({ age: patient.age, sex: patient.sex, context }), [patient, context]);

  const setDecision = (key, status) => {
    const next = {
      ...state,
      age: patient.age,
      sex: patient.sex,
      recorded_datetime: new Date().toISOString(),
      decisions: { ...decisions, [key]: { status, datetime: new Date().toISOString() } },
    };
    onChange(next);
  };

  const row = (item) => {
    const ref = fmReference(item.source);
    const decision = asObjectSafe(decisions[item.key]);
    return (
      <div key={item.key} className="rounded-md border border-border bg-card p-2 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium leading-snug">{item.label}</p>
            <p className="text-[10px] text-muted-foreground leading-snug">
              {ref ? ref.issuing_organization : item.source} · {item.grade}
              {item.riskCondition ? ` · ${item.riskCondition}` : ""}
            </p>
          </div>
          <Select value={decision.status || undefined} onValueChange={(v) => setDecision(item.key, v)}>
            <SelectTrigger className="h-7 w-full text-[11px] sm:w-[190px] sm:shrink-0">
              <SelectValue placeholder="Record decision" />
            </SelectTrigger>
            <SelectContent>
              {DECISIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">{item.detail}</p>
        {ref?.source_url && (
          <a
            href={ref.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Recommendation source
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2">
        <ShieldCheck className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-snug">
          These are the services that apply to this patient by {patient.age === null ? "age (not available)" : `age ${patient.age}`}
          {patient.sex ? ` and sex (${patient.sex.toLowerCase()})` : ""} and the risk factors documented in this note. Nothing
          is marked overdue, because AMedix cannot see what was done elsewhere; record what happened at this visit. The
          national programme of the country of practice takes precedence where one exists.
        </p>
      </div>

      {loading && <p className="text-[11px] text-muted-foreground">Reading the patient record…</p>}

      {!loading && patient.age === null && (
        <p className="text-[11px] text-warning">
          {patient.unavailable
            ? "The patient's record could not be read, so no age-dependent screening item is offered — an unknown age is not an indication."
            : "The patient's date of birth is not recorded, so no age-dependent screening item is offered — an unknown age is not an indication."}
        </p>
      )}

      {screenings.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Preventive screening</p>
          {screenings.map(row)}
        </div>
      )}

      {immunizations.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Syringe className="h-3 w-3" /> Immunizations
          </p>
          {immunizations.map(row)}
        </div>
      )}

      {Object.keys(decisions).length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          {Object.keys(decisions).length} decision{Object.keys(decisions).length === 1 ? "" : "s"} recorded with this note.
        </p>
      )}
    </div>
  );
}