import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ExternalLink } from "lucide-react";
import { FM_SCORES, calculateFmScore } from "@/lib/fmScores";
import { asObject } from "@/lib/fmFieldKit";

// Family medicine calculations. Each panel computes only from values documented in
// this note: a missing item leaves the score uncalculated and names what is missing.
// Every result is shown with its source, and nothing here writes a diagnosis.
export default function FmScoresField({ value, onChange, scores }) {
  const inputs = asObject(value);
  const [open, setOpen] = useState({});
  const offered = Array.isArray(scores) && scores.length ? FM_SCORES.filter((s) => scores.includes(s.key)) : FM_SCORES;

  const set = (scoreKey, varKey, next) =>
    onChange({ ...inputs, [scoreKey]: { ...asObject(inputs[scoreKey]), [varKey]: next } });

  return (
    <div className="space-y-2">
      {offered.map((score) => {
        const scoreInputs = asObject(inputs[score.key]);
        const result = calculateFmScore(score.key, scoreInputs);
        const isOpen = Boolean(open[score.key]);
        const state = result?.missing?.length ? "not calculated" : result?.value !== null && result ? `${result.value}` : "—";

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
                <p className="text-[11px] text-muted-foreground">
                  {score.purpose} — {score.population}
                </p>

                {score.variables.map((variable) => (
                  <div key={variable.key} className="space-y-1">
                    <Label className="text-xs font-medium">{variable.label}</Label>
                    {variable.type === "number" ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={scoreInputs[variable.key] ?? ""}
                          min={variable.min}
                          max={variable.max}
                          step="any"
                          onChange={(e) => set(score.key, variable.key, e.target.value)}
                        />
                        {variable.unit && <span className="shrink-0 text-[11px] text-muted-foreground">{variable.unit}</span>}
                      </div>
                    ) : (
                      <Select value={scoreInputs[variable.key] || undefined} onValueChange={(next) => set(score.key, variable.key, next)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {variable.options.map((option) => (
                            <SelectItem key={String(option.value)} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}

                <div className="rounded-md bg-muted/50 px-2.5 py-2">
                  {result?.missing?.length ? (
                    <p className="text-[11px] text-foreground">
                      Not calculated — the score needs every item. Still missing: {result.missing.join(", ")}.
                    </p>
                  ) : (
                    <p className="text-[11px] text-foreground">
                      <span className="font-semibold">
                        {score.name}: {result?.value} {result?.unit || ""}
                      </span>
                      {result?.band ? ` — ${result.band}` : ""}
                    </p>
                  )}
                  <a
                    href={score.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {score.source.organization} — {score.source.title}
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}