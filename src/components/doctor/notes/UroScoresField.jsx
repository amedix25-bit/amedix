import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ExternalLink } from "lucide-react";
import { URO_SCORES, calculateUroScore } from "@/lib/uroScores";
import { asObject } from "@/lib/uroFieldKit";

// Urology calculations. Each panel computes only from values documented in this
// note: a missing item leaves the calculation unperformed and names what is
// missing. Every result is shown with its source; nothing here writes a
// diagnosis, a stage or a treatment decision.

function VariableInput({ variable, value, onChange }) {
  if (variable.type === "select") {
    return (
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Not documented" />
        </SelectTrigger>
        <SelectContent>
          {variable.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (variable.type === "number") {
    return (
      <div className="flex items-center gap-2">
        <Input type="number" inputMode="decimal" step="any" min={variable.min} max={variable.max} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        {variable.unit ? <span className="shrink-0 text-[11px] text-muted-foreground">{variable.unit}</span> : null}
      </div>
    );
  }
  if (variable.type === "date") {
    return <Input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }
  if (variable.type === "multi") {
    const chosen = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-wrap gap-1.5">
        {variable.options.map((option) => {
          const active = chosen.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(active ? chosen.filter((v) => v !== option.value) : [...chosen, option.value])}
              className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                active ? "border-primary bg-primary/10 font-medium text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }
  return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Not documented" />;
}

export default function UroScoresField({ value, onChange, scores }) {
  const inputs = asObject(value);
  const [open, setOpen] = useState({});
  const offered = Array.isArray(scores) && scores.length ? URO_SCORES.filter((s) => scores.includes(s.key)) : URO_SCORES;

  const set = (scoreKey, varKey, next) =>
    onChange({ ...inputs, [scoreKey]: { ...asObject(inputs[scoreKey]), [varKey]: next } });

  return (
    <div className="space-y-2">
      {offered.map((score) => {
        const scoreInputs = asObject(inputs[score.key]);
        const result = calculateUroScore(score.key, scoreInputs);
        const isOpen = Boolean(open[score.key]);
        const state = result?.missing?.length ? "not calculated" : result?.value ? `${result.value}` : "—";

        return (
          <div key={score.key} className="overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [score.key]: !o[score.key] }))}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-2 bg-muted/40 px-3 py-2 text-left transition-colors hover:bg-muted/60"
            >
              <span className="flex min-w-0 items-center gap-2">
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                <span className="truncate text-xs font-semibold uppercase tracking-wide text-primary">{score.name}</span>
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{state}</span>
            </button>

            {isOpen && (
              <div className="space-y-3 px-3 pb-3 pt-3">
                <p className="text-[11px] text-muted-foreground">
                  {score.purpose} — {score.population}
                </p>

                {score.variables.map((variable) => (
                  <div key={variable.key} className="space-y-1">
                    <Label className="text-xs font-medium">{variable.label}</Label>
                    <VariableInput variable={variable} value={scoreInputs[variable.key]} onChange={(next) => set(score.key, variable.key, next)} />
                  </div>
                ))}

                <div className="rounded-md bg-muted/50 px-2.5 py-2">
                  {result?.missing?.length ? (
                    <p className="text-[11px] text-foreground">
                      Not calculated — this needs every required value. Still missing: {result.missing.join("; ")}.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[11px] text-foreground">
                        <span className="font-semibold">{score.name}: {result?.value}</span>
                        {result?.band ? ` — ${result.band}` : ""}
                      </p>
                      {result?.extra ? <p className="text-[10px] text-muted-foreground">{result.extra}</p> : null}
                    </div>
                  )}
                  {score.note ? <p className="mt-1 text-[10px] text-muted-foreground">{score.note}</p> : null}
                  <a href={score.source.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    {score.source.organization} — {score.source.title}
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground">
        A calculation is a documented observation, never a diagnosis and never an order. No dose, stage, risk group or
        probability is produced here.
      </p>
    </div>
  );
}