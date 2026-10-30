import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { GASTRO_SCORES, calculateGastroScore } from "@/lib/gastroenterologyScores";

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

// Gastroenterology / Hepatology scores. The panel only calculates from values
// documented in this note: a missing variable leaves the score uncalculated and
// states exactly what is missing. Every result is shown with its band and its
// source, and the panel never writes a band into the record as a diagnosis.
export default function GastroScoresField({ value, onChange, scores }) {
  const inputs = asObject(value);
  const [open, setOpen] = useState({});
  const offered = Array.isArray(scores) && scores.length ? GASTRO_SCORES.filter((s) => scores.includes(s.key)) : GASTRO_SCORES;

  const set = (scoreKey, varKey, next) =>
    onChange({ ...inputs, [scoreKey]: { ...asObject(inputs[scoreKey]), [varKey]: next } });

  return (
    <div className="space-y-2">
      {offered.map((score) => {
        const scoreInputs = asObject(inputs[score.key]);
        const result = calculateGastroScore(score.key, scoreInputs);
        const isOpen = Boolean(open[score.key]);
        const state = result?.missing?.length
          ? "not calculated"
          : result
            ? `${result.value}`
            : "—";

        return (
          <div key={score.key} className="rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [score.key]: !o[score.key] }))}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide truncate">{score.name}</span>
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{state}</span>
            </button>

            {isOpen && (
              <div className="px-3 pb-3 pt-3 space-y-3">
                <p className="text-[11px] text-muted-foreground">{score.purpose} — {score.population}</p>
                {score.variables.map((variable) => (
                  <div key={variable.key} className="space-y-1">
                    <Label className="text-xs font-medium">{variable.label}</Label>
                    {variable.type === "select" ? (
                      <Select
                        value={scoreInputs[variable.key] || undefined}
                        onValueChange={(next) => set(score.key, variable.key, next)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {variable.options.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={variable.min}
                          max={variable.max}
                          step={variable.step || "any"}
                          value={scoreInputs[variable.key] ?? ""}
                          onChange={(e) => set(score.key, variable.key, e.target.value)}
                        />
                        {variable.unit ? <span className="text-xs text-muted-foreground shrink-0">{variable.unit}</span> : null}
                      </div>
                    )}
                  </div>
                ))}

                {result?.missing?.length ? (
                  <p className="text-[11px] rounded-md border border-border bg-muted/40 px-2 py-1.5 text-muted-foreground">
                    Not calculated — missing {result.missing.join(", ")}. A score is never estimated from a default.
                  </p>
                ) : result ? (
                  <div className="text-[11px] rounded-md border border-border bg-muted/40 px-2 py-1.5">
                    <p className="font-semibold text-foreground">
                      {score.name}: {result.value}
                      {result.detail ? ` — ${result.detail}` : ""}
                    </p>
                    <p className="text-muted-foreground">{result.band}</p>
                    {result.note ? <p className="text-muted-foreground">{result.note}</p> : null}
                    <p className="text-muted-foreground">Source: {score.source.organization} · decision support only.</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}