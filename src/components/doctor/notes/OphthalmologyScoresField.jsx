import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { OPHTH_SCORES, calculateOphthScore, scoreMissingLabel } from "@/lib/ophthalmologyScores";
import { asObject } from "@/lib/ophthFieldKit";

// Ophthalmology calculations. Each panel computes only from values documented in
// this note: a missing variable leaves the calculation undone and states exactly
// what is missing. Every result is shown with its source, and nothing here ever
// writes a stage or a category into the record as a diagnosis.
export default function OphthalmologyScoresField({ value, onChange, scores }) {
  const inputs = asObject(value);
  const [open, setOpen] = useState({});
  const offered = Array.isArray(scores) && scores.length
    ? OPHTH_SCORES.filter((s) => scores.includes(s.key))
    : OPHTH_SCORES;

  const set = (scoreKey, varKey, next) =>
    onChange({ ...inputs, [scoreKey]: { ...asObject(inputs[scoreKey]), [varKey]: next } });

  return (
    <div className="space-y-2">
      {offered.map((score) => {
        const scoreInputs = asObject(inputs[score.key]);
        const result = calculateOphthScore(score.key, scoreInputs);
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
                          {variable.options.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={scoreInputs[variable.key] ?? ""}
                        onChange={(e) => set(score.key, variable.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                {result?.missing?.length ? (
                  <p className="text-[11px] text-muted-foreground">
                    {scoreMissingLabel(result)}.
                  </p>
                ) : result ? (
                  <div className="rounded-md border border-border bg-card px-2.5 py-2 space-y-1">
                    <p className="text-xs font-semibold text-foreground">{result.label}</p>
                    <p className="text-[11px] text-foreground leading-relaxed">{result.detail}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{result.interpretation}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {score.source.organization} — {score.source.title}
                    </p>
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