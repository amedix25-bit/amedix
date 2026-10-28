import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  akiStaging,
  albuminuriaCategoryFor,
  ckdCga,
  ckdRiskCategory,
  classifyKidneySyndrome,
  egfrCkdEpi2021,
  gfrCategoryFor,
  kfre4,
  KFRE_4VAR,
  CKD_EPI_2021,
  AKI_DEFINITION,
  CHRONICITY_MARKERS,
  MG_G_PER_MG_MMOL,
} from "@/lib/renalKdigo";
import { AlertTriangle, Calculator, Info } from "lucide-react";

// Structured KDIGO kidney-function documentation.
//
// The clinician documents the raw facts — dated creatinines, the timed urine
// output, the UACR, the chronicity markers, the cause. Everything shown below
// is then CALCULATED from those facts by @/lib/renalKdigo and labelled as
// calculated. A missing input never produces a category: the panel names what
// is missing, so no CKD stage, albuminuria category, AKI stage or kidney
// failure risk is ever inferred from incomplete data.

const F = ({ label, children, hint }) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
    {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-medium text-foreground text-right">{value || "—"}</span>
  </div>
);

const Note = ({ children, tone = "muted" }) => (
  <p
    className={
      tone === "warn"
        ? "text-[11px] text-amber-700 flex items-start gap-1"
        : "text-[11px] text-muted-foreground flex items-start gap-1"
    }
  >
    {tone === "warn" ? <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> : <Info className="h-3 w-3 mt-0.5 shrink-0" />}
    <span>{children}</span>
  </p>
);

const Card = ({ title, children }) => (
  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
      <Calculator className="h-3.5 w-3.5 text-primary" /> {title}
    </p>
    {children}
  </div>
);

export default function KdigoRenalField({ value, onChange }) {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const set = (key, val) => onChange({ ...v, [key]: val });
  const markers = Array.isArray(v.chronicity) ? v.chronicity : [];
  const toggleMarker = (key) =>
    set("chronicity", markers.includes(key) ? markers.filter((k) => k !== key) : [...markers, key]);

  const documentedEgfr = v.egfr === "" || v.egfr === undefined ? null : Number(v.egfr);
  const calcEgfr = egfrCkdEpi2021({ creatinineUmol: v.current_creatinine, age: v.age, sex: v.sex });
  const egfrUsed = Number.isFinite(documentedEgfr) && documentedEgfr > 0 ? documentedEgfr : calcEgfr.value;
  const egfrSource = Number.isFinite(documentedEgfr) && documentedEgfr > 0 ? "documented by the laboratory" : "calculated (CKD-EPI 2021)";

  const cga = ckdCga({
    egfr: egfrUsed,
    uacrMgMmol: v.uacr,
    markers,
    durationDocumented: v.duration,
    cause: v.cause,
  });

  const aki = akiStaging({
    baselineCreatinineUmol: v.baseline_creatinine,
    currentCreatinineUmol: v.current_creatinine,
    baselineHours: v.baseline_hours,
    urineOutputMl: v.urine_output_ml,
    urineHours: v.urine_hours,
    weightKg: v.weight_kg,
    rrtInitiated: v.rrt_initiated === "Yes",
  });

  const syndrome = classifyKidneySyndrome({
    akiStage: aki.stage,
    ckdEstablished: cga.established,
    chronicityDocumented: markers.length > 0,
  });

  const aCategory = albuminuriaCategoryFor(v.uacr);
  const kfre = kfre4({ age: v.age, sex: v.sex, egfr: egfrUsed, uacrMgMmol: v.uacr });
  const risk = cga.g && aCategory ? ckdRiskCategory(cga.g.key, aCategory.key) : null;

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <div>
        <p className="text-sm font-semibold text-foreground">KDIGO Kidney Function Assessment</p>
        <p className="text-[11px] text-muted-foreground">
          Documented values only. Categories, the AKI stage and the kidney failure risk are calculated from what is entered
          here — nothing is assumed, and nothing is staged without its required evidence.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <F label="Age for the equation (years)">
          <Input type="number" value={v.age ?? ""} onChange={(e) => set("age", e.target.value)} />
        </F>
        <F label="Sex (equation term)">
          <Select value={v.sex || undefined} onValueChange={(x) => set("sex", x)}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </F>
        <F label="eGFR reported by the laboratory" hint="Leave empty to use the calculated value only.">
          <Input type="number" step="1" value={v.egfr ?? ""} onChange={(e) => set("egfr", e.target.value)} />
        </F>
        <F label="Current serum creatinine (µmol/L)">
          <Input type="number" step="0.1" value={v.current_creatinine ?? ""} onChange={(e) => set("current_creatinine", e.target.value)} />
        </F>
        <F label="Date of current creatinine">
          <Input type="date" value={v.current_date ?? ""} onChange={(e) => set("current_date", e.target.value)} />
        </F>
        <F label="UACR (mg/mmol)" hint={`mg/g = mg/mmol × ${MG_G_PER_MG_MMOL}`}>
          <Input type="number" step="0.1" value={v.uacr ?? ""} onChange={(e) => set("uacr", e.target.value)} />
        </F>
        <F label="Baseline serum creatinine (µmol/L)" hint="The documented pre-illness value and its source — never a population estimate.">
          <Input type="number" step="0.1" value={v.baseline_creatinine ?? ""} onChange={(e) => set("baseline_creatinine", e.target.value)} />
        </F>
        <F label="Date of baseline creatinine">
          <Input type="date" value={v.baseline_date ?? ""} onChange={(e) => set("baseline_date", e.target.value)} />
        </F>
        <F label="Interval from baseline to current (hours)">
          <Input type="number" step="1" value={v.baseline_hours ?? ""} onChange={(e) => set("baseline_hours", e.target.value)} />
        </F>
        <F label="Timed urine output (mL)">
          <Input type="number" step="1" value={v.urine_output_ml ?? ""} onChange={(e) => set("urine_output_ml", e.target.value)} />
        </F>
        <F label="Duration of that collection (hours)">
          <Input type="number" step="1" value={v.urine_hours ?? ""} onChange={(e) => set("urine_hours", e.target.value)} />
        </F>
        <F label="Body weight for indexing (kg)">
          <Input type="number" step="0.1" value={v.weight_kg ?? ""} onChange={(e) => set("weight_kg", e.target.value)} />
        </F>
        <F label="Kidney replacement therapy started for this episode">
          <Select value={v.rrt_initiated || undefined} onValueChange={(x) => set("rrt_initiated", x)}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </F>
        <F label="Duration the kidney problem has been documented">
          <Input value={v.duration ?? ""} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 18 months, since 2019" />
        </F>
        <F label="Underlying cause of CKD" hint="Cause is part of the CGA classification.">
          <Input value={v.cause ?? ""} onChange={(e) => set("cause", e.target.value)} placeholder="e.g. diabetic kidney disease" />
        </F>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Documented evidence of chronicity (&gt; 3 months) — required before any CKD classification
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {CHRONICITY_MARKERS.map((m) => {
            const active = markers.includes(m.key);
            return (
              <button
                type="button"
                key={m.key}
                onClick={() => toggleMarker(m.key)}
                className={
                  "rounded-full border px-2.5 py-1 text-[11px] transition " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50")
                }
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="CKD classification (CGA)">
          {egfrUsed ? (
            <>
              <Row label="GFR category" value={cga.g ? `${cga.g.key} (${cga.g.range})` : null} />
              <Row label="Albuminuria category" value={aCategory ? `${aCategory.key} (${aCategory.range})` : "Not classified — UACR not documented"} />
              <Row label="Cause" value={cga.cause} />
              <Row label="CGA classification" value={cga.cga} />
              <Row label="G/A risk category" value={risk ? risk.label : null} />
              <Row label="CKD established" value={cga.established ? "Yes — chronicity documented" : "No — not established on these data"} />
              {cga.chronicityBasis.length > 0 && <Row label="Chronicity basis" value={cga.chronicityBasis.join("; ")} />}
            </>
          ) : (
            <Note tone="warn">No GFR category: a documented eGFR, or a creatinine with age and sex, is required.</Note>
          )}
          {cga.notes.map((n) => (
            <Note key={n} tone="warn">{n}</Note>
          ))}
          <Note>
            eGFR used: {egfrUsed ? `${egfrUsed} mL/min/1.73 m² (${egfrSource})` : "not available"}.
            {calcEgfr.value && Number.isFinite(documentedEgfr) && documentedEgfr > 0
              ? ` Calculated CKD-EPI 2021 cross-check: ${calcEgfr.value} mL/min/1.73 m².`
              : ""}
          </Note>
          <Note>{CKD_EPI_2021.limitations[0]}</Note>
        </Card>

        <Card title="Acute kidney injury (KDIGO 2012)">
          <Row label="AKI stage" value={aki.stage === null ? "Not classifiable" : aki.label} />
          {aki.ratio !== null && <Row label="Creatinine ratio to baseline" value={`${aki.ratio}×`} />}
          {aki.delta !== null && <Row label="Absolute rise" value={`${aki.delta} µmol/L`} />}
          {aki.criteria.length > 0 && (
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-foreground">
              {aki.criteria.map((c) => <li key={c}>{c}</li>)}
            </ul>
          )}
          {aki.caveats.map((c) => <Note key={c} tone="warn">{c}</Note>)}
          <Row label="Syndrome label" value={syndrome.label} />
          {syndrome.reason && <Note tone="warn">{syndrome.reason}</Note>}
          <Note>{AKI_DEFINITION}</Note>
        </Card>

        <Card title={KFRE_4VAR.name}>
          {kfre.missing.length ? (
            <Note tone="warn">Risk not calculated — missing: {kfre.missing.join(", ")}.</Note>
          ) : (
            <>
              <Row label="2-year risk of kidney failure" value={`${kfre.risk2y}%`} />
              <Row label="5-year risk of kidney failure" value={`${kfre.risk5y}%`} />
              <Row label="UACR used" value={`${v.uacr} mg/mmol (${kfre.uacrMgG} mg/g)`} />
              <Row label="Equation term" value={`exp(${kfre.linearPredictor})`} />
            </>
          )}
          <Note>{KFRE_4VAR.population}</Note>
          <Note tone="warn">{KFRE_4VAR.calibration}</Note>
          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
            {KFRE_4VAR.limitations.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </Card>
      </div>

      <F label="Clinician interpretation and documented limitations">
        <Input value={v.interpretation ?? ""} onChange={(e) => set("interpretation", e.target.value)} placeholder="Which values were used, what was not available, and how the result is applied" />
      </F>
    </div>
  );
}