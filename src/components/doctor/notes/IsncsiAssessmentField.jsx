import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import {
  ISNCSCI_DERMATOMES,
  ISNCSCI_GRADES,
  ISNCSCI_LOWER,
  ISNCSCI_SACRAL_STATE,
  ISNCSCI_SENSORY,
  ISNCSCI_UPPER,
  computeIsncsci,
} from "@/lib/neurosurgeryIsncsci";

// ISNCSCI / ASIA examination.
//
// The examiner records the standard key muscles and dermatomes. The app sums
// only what is documented, derives the levels and the AIS grade by the published
// rule, and refuses to classify an incomplete examination — naming what is
// missing instead of estimating it.

const cellCls = "h-7 w-full rounded border border-input bg-card px-1 text-[11px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function GradeGrid({ title, rows, values, prefix, onChange, options }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1">Level</th>
              <th className="font-medium pb-1">Right</th>
              <th className="font-medium pb-1">Left</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="py-0.5 pr-2 leading-tight">
                  <span className="font-medium">{row.level}</span>
                  <span className="text-muted-foreground"> — {row.label}</span>
                </td>
                {["r", "l"].map((side) => (
                  <td key={side} className="py-0.5 px-0.5 w-16">
                    <select
                      className={cellCls}
                      aria-label={`${row.level} ${side === "r" ? "right" : "left"}`}
                      value={values[`${prefix}${side}_${row.key}`] ?? ""}
                      onChange={(e) => onChange(`${prefix}${side}_${row.key}`, e.target.value)}
                    >
                      <option value="">—</option>
                      {options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SensoryGrid({ title, rows, values, prefix, onChange }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1">Dermatome</th>
              <th className="font-medium pb-1">Right</th>
              <th className="font-medium pb-1">Left</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d}>
                <td className="py-0.5 pr-2 font-medium">{d}</td>
                {["r", "l"].map((side) => (
                  <td key={side} className="py-0.5 px-0.5 w-16">
                    <select
                      className={cellCls}
                      aria-label={`${title} ${d} ${side === "r" ? "right" : "left"}`}
                      value={values[`${prefix}${side}_${d}`] ?? ""}
                      onChange={(e) => onChange(`${prefix}${side}_${d}`, e.target.value)}
                    >
                      <option value="">—</option>
                      {ISNCSCI_SENSORY.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function IsncsiAssessmentField({ value, onChange }) {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const motor = v.motor || {};
  const lt = v.light_touch || {};
  const pp = v.pin_prick || {};
  const sacral = v.sacral || {};
  const result = computeIsncsci(v);

  const setIn = (group, key, val) => onChange({ ...v, [group]: { ...(v[group] || {}), [key]: val } });
  const setSacral = (key, val) => onChange({ ...v, sacral: { ...sacral, [key]: val } });

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
        <p className="text-xs font-medium flex items-center gap-1.5 text-primary">
          <ShieldCheck className="w-3.5 h-3.5" /> ISNCSCI / ASIA examination — recorded as examined, summed only from what is documented
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          Motor grading 0–5 per key muscle (NT = not testable), sensory grading 0–2 per dermatome. The app adds the
          documented grades and derives the levels and the AIS grade. An incomplete examination is reported as not
          classifiable, with the missing items named — no total is estimated.
        </p>
      </div>

      <GradeGrid title="Key muscles — motor (0–5, NT)" rows={ISNCSCI_UPPER} values={motor} prefix="" onChange={(k, val) => setIn("motor", k, val)} options={ISNCSCI_GRADES} />
      <GradeGrid title="Lower limb key muscles" rows={ISNCSCI_LOWER} values={motor} prefix="" onChange={(k, val) => setIn("motor", k, val)} options={ISNCSCI_GRADES} />
      <SensoryGrid title="Light touch (0–2, NT)" rows={ISNCSCI_DERMATOMES} values={lt} prefix="" onChange={(k, val) => setIn("light_touch", k, val)} />
      <SensoryGrid title="Pin prick (0–2, NT)" rows={ISNCSCI_DERMATOMES} values={pp} prefix="" onChange={(k, val) => setIn("pin_prick", k, val)} />

      <div className="rounded-lg border border-border bg-card p-2.5 space-y-2">
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">Sacral examination</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["dap", "Deep anal pressure"],
            ["vac", "Voluntary anal contraction"],
            ["s45_lt", "S4–5 light touch"],
            ["s45_pp", "S4–5 pin prick"],
          ].map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{label}</Label>
              <select
                className={cellCls}
                value={sacral[key] ?? ""}
                onChange={(e) => setSacral(key, e.target.value)}
                aria-label={label}
              >
                <option value="">—</option>
                {(key === "s45_lt" || key === "s45_pp" ? ISNCSCI_SENSORY.slice(0, 3) : ISNCSCI_SACRAL_STATE).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {!result.complete ? (
        <div className="rounded-md border border-amber-400/50 bg-amber-50 p-2 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 text-amber-800 shrink-0" />
          <div className="text-[11px] leading-relaxed text-foreground">
            <span className="font-medium">AIS grade not assigned — examination incomplete.</span> Not documented:{" "}
            {result.missing.slice(0, 8).join(", ")}
            {result.missing.length > 8 ? ` and ${result.missing.length - 8} more` : ""}. A score is never estimated or
            defaulted; a "not testable" muscle is resolved by the standard substitution rule by the examiner.
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-muted/40 p-2 space-y-1">
          <p className="text-xs font-semibold">
            Motor score {result.motorTotal}/100 (UEMS {result.uems}/50 · LEMS {result.lems}/50) · Light touch{" "}
            {result.lightTouchTotal}/112 · Pin prick {result.pinPrickTotal}/112
          </p>
          <p className="text-[11px]">
            Sensory level right {result.levels.sensory_right} · left {result.levels.sensory_left} | Motor level right{" "}
            {result.levels.motor_right} · left {result.levels.motor_left} | NLI {result.levels.nli}
          </p>
          <p className="text-[11px] font-medium">
            AIS {result.ais} — {result.ais_rule}
          </p>
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Limitations carried with this examination</Label>
        <ul className="space-y-0.5">
          {result.limitations.map((l) => (
            <li key={l} className="text-[10px] text-muted-foreground leading-relaxed flex gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              {l}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Clinician note on this examination</Label>
        <Textarea
          rows={2}
          className="text-xs"
          value={v.clinician_note || ""}
          onChange={(e) => onChange({ ...v, clinician_note: e.target.value })}
          placeholder="Position and conditions of testing, prior deficit for an AIS E, substitution applied for a not-testable muscle"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Examination time</Label>
        <Input
          type="time"
          className="h-8 text-xs w-40"
          value={v.exam_time || ""}
          onChange={(e) => onChange({ ...v, exam_time: e.target.value })}
        />
      </div>
    </div>
  );
}