import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Info, Pill } from "lucide-react";
import {
  MED_SAFETY_SPEC,
  RECONCILIATION_OPTIONS,
  ALLERGY_REVIEW_OPTIONS,
  CLASS_REVIEW_OPTIONS,
  medicationSafetyGaps,
} from "@/lib/cardiologyMedicationSafety";

// Medication-safety review for a cardiology encounter: reconciliation, allergy,
// contraindication, interaction and renal review, then a documented check for
// each high-alert cardiovascular class. Advisory only — the gaps listed are
// documentation gaps, never a statement that a medicine is wrong.
export default function CardiologyMedicationSafetyField({ value, onChange }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const set = (key, v) => onChange({ ...safe, [key]: v });
  const setClass = (key, patch) =>
    onChange({ ...safe, classes: { ...(safe.classes || {}), [key]: { ...(safe.classes?.[key] || {}), ...patch } } });

  const gaps = medicationSafetyGaps(safe);
  const errors = gaps.filter((g) => g.level === "error");

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-muted/30 p-2">
        <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Pill className="w-3.5 h-3.5" /> {MED_SAFETY_SPEC.title}
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{MED_SAFETY_SPEC.note}</p>
      </div>

      <div className="rounded-lg border border-border p-2.5 space-y-2">
        <p className="text-xs font-semibold text-foreground">Reconciliation, allergy and interaction review</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Medication reconciliation</Label>
            <Select value={safe.reconciliation || undefined} onValueChange={(v) => set("reconciliation", v)}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {RECONCILIATION_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o} className="text-xs">
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Allergy review</Label>
            <Select value={safe.allergy_review || undefined} onValueChange={(v) => set("allergy_review", v)}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {ALLERGY_REVIEW_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o} className="text-xs">
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[11px] text-muted-foreground">Sources checked</Label>
            <Input
              value={safe.sources || ""}
              onChange={(e) => set("sources", e.target.value)}
              placeholder="Patient interview, pharmacy record, discharge letter, referral"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Contraindications identified</Label>
            <Textarea
              value={safe.contraindications || ""}
              onChange={(e) => set("contraindications", e.target.value)}
              rows={2}
              className="text-xs"
              placeholder="Contraindication and the alternative chosen"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Interactions reviewed</Label>
            <Textarea
              value={safe.interactions || ""}
              onChange={(e) => set("interactions", e.target.value)}
              rows={2}
              className="text-xs"
              placeholder="Interacting pair and the action taken"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Renal function documented</Label>
            <Input
              value={safe.egfr || ""}
              onChange={(e) => set("egfr", e.target.value)}
              placeholder="eGFR / creatinine as documented"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Renal dose review</Label>
            <Input
              value={safe.renal_review || ""}
              onChange={(e) => set("renal_review", e.target.value)}
              placeholder="Agents adjusted, withheld or unchanged, and why"
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-2.5 space-y-2">
        <p className="text-xs font-semibold text-foreground">High-alert cardiovascular therapy</p>
        <div className="space-y-2">
          {MED_SAFETY_SPEC.classes.map((cls) => {
            const row = safe.classes?.[cls.key] || {};
            return (
              <div key={cls.key} className="rounded-md border border-border/70 p-2 space-y-1.5">
                <div className="grid gap-2 sm:grid-cols-[1fr,1.2fr] sm:items-start">
                  <div>
                    <p className="text-[11px] font-medium text-foreground">{cls.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                      Monitor: {cls.monitoring.join(", ")}
                    </p>
                  </div>
                  <Select value={row.state || undefined} onValueChange={(v) => setClass(cls.key, { state: v })}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_REVIEW_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o} className="text-xs">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {row.state === "Issue identified — action documented" && (
                  <Input
                    value={row.action || ""}
                    onChange={(e) => setClass(cls.key, { action: e.target.value })}
                    placeholder="Action taken and who was informed"
                    className="h-8 text-xs"
                  />
                )}
                <details className="text-[10px] text-muted-foreground">
                  <summary className="cursor-pointer select-none">What this class requires documented</summary>
                  <ul className="mt-1 space-y-0.5 list-disc pl-4">
                    {cls.focus.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </details>
              </div>
            );
          })}
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Monitoring planned</Label>
          <Textarea
            value={safe.monitoring || ""}
            onChange={(e) => set("monitoring", e.target.value)}
            rows={2}
            className="text-xs"
            placeholder="Parameters, interval and who reviews them"
          />
        </div>
      </div>

      {gaps.length > 0 && (
        <div className="rounded-md border border-border bg-muted/30 p-2 space-y-1">
          {gaps.map((g, i) => (
            <p key={i} className="text-[11px] flex items-start gap-1.5 leading-snug">
              {g.level === "error" ? (
                <AlertTriangle className="w-3 h-3 mt-0.5 text-destructive shrink-0" />
              ) : (
                <Info className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
              )}
              <span className={g.level === "error" ? "text-destructive font-medium" : "text-muted-foreground"}>
                {g.message}
              </span>
            </p>
          ))}
          {errors.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Documentation prompts only — they never block treatment or prevent saving.
            </p>
          )}
        </div>
      )}
    </div>
  );
}