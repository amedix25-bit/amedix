import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Calculator, ExternalLink, Info, Plus, X } from "lucide-react";
import { NSG_SCORES, calculateScore, indicatedScores } from "@/lib/neurosurgeryScores";

// Neurosurgical scores and classifications.
//
// A score is offered only for the conditions it was developed in, and is
// calculated solely from the values entered against it in this note. A missing
// variable leaves the score uncalculated and names what is missing. Every result
// carries its interpretation, its limitations and the publication that defines
// it, and none of them makes a decision.
const TONE = {
  success: "border-success/40 bg-success/5 text-foreground",
  warning: "border-amber-400/50 bg-amber-50 text-foreground",
  critical: "border-destructive/40 bg-destructive/5 text-foreground",
};

const TONE_LABEL = {
  success: "text-success",
  warning: "text-amber-800",
  critical: "text-destructive",
};

function ScoreCard({ def, vars, onChange, onRemove }) {
  const result = calculateScore(def.key, vars);
  const set = (key, v) => onChange({ ...vars, [key]: v });

  return (
    <div className="rounded-lg border border-border bg-card p-2.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{def.name}</p>
          <p className="text-[11px] text-muted-foreground leading-snug">{def.purpose}</p>
          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">Population: {def.population}</p>
        </div>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive shrink-0" title="Remove this score">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid gap-2">
        {def.variables.map((v) => (
          <div key={v.key} className="space-y-1">
            <Label className="text-[11px] text-muted-foreground leading-snug">{v.label}</Label>
            <select
              className="h-8 w-full rounded border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={v.label}
              value={vars[v.key] ?? ""}
              onChange={(e) => set(v.key, e.target.value)}
            >
              <option value="">Not documented</option>
              {v.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value}
                  {typeof o.points === "number" ? ` (${o.points > 0 ? "+" : ""}${o.points})` : ""}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {result?.missing?.length ? (
        <div className="rounded-md border border-amber-400/50 bg-amber-50 p-2 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 text-amber-800 shrink-0" />
          <div className="text-[11px] leading-relaxed text-foreground">
            <span className="font-medium">Score not calculated — insufficient documented information.</span> Missing:{" "}
            {result.missing.join(", ")}. No value is estimated and no default is assumed.
          </div>
        </div>
      ) : (
        result && (
          <div className={`rounded-md border p-2 space-y-1.5 ${TONE[result.band?.tone] || TONE.success}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold">
                {result.total}
                {def.max ? ` of ${def.max}` : ""} — {result.band?.label}
              </p>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${TONE_LABEL[result.band?.tone] || ""}`}>
                {result.total}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">{result.band?.note}</p>
            {(result.items || []).length > 0 && (
              <div className="text-[10px] text-muted-foreground leading-relaxed border-t border-border/60 pt-1">
                {result.items.map((i) => (
                  <span key={`${i.label}-${i.points}`} className="mr-2 whitespace-nowrap">
                    {i.label} ({i.points > 0 ? "+" : ""}
                    {i.points})
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      )}

      <div className="rounded-md border border-border bg-muted/40 p-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Limitations</p>
        <ul className="space-y-0.5">
          {def.limitations.map((l) => (
            <li key={l} className="text-[10px] text-muted-foreground leading-relaxed flex gap-1">
              <AlertTriangle className="w-2.5 h-2.5 mt-0.5 shrink-0" />
              {l}
            </li>
          ))}
        </ul>
      </div>

      <a
        href={def.source.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
      >
        <ExternalLink className="w-3 h-3" />
        {def.source.organization} — {def.source.title}, {def.source.version}
      </a>
    </div>
  );
}

export default function NeurosurgeryScoresField({ value, values, onChange }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const entries = safe.entries && typeof safe.entries === "object" ? safe.entries : {};
  const open = Object.keys(entries);
  const indicated = indicatedScores(values || {});
  const available = NSG_SCORES.filter((s) => !open.includes(s.key));

  const set = (patch) => onChange({ ...safe, ...patch });
  const openScore = (key) => set({ entries: { ...entries, [key]: {} } });
  const updateVars = (key, vars) => set({ entries: { ...entries, [key]: vars } });
  const removeScore = (key) => {
    const next = { ...entries };
    delete next[key];
    set({ entries: next });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
        <p className="text-xs font-medium flex items-center gap-1.5 text-primary">
          <Calculator className="w-3.5 h-3.5" /> Validated scores and classifications — used only where the condition applies
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          A score is offered when the findings documented in this note match the population it was developed in. It is
          calculated only from the values entered against it, keeps its variables, interpretation, limitations and
          definition in the record, and is never filled in, estimated or defaulted.
        </p>
        {indicated.length > 0 && (
          <p className="text-[11px] mt-1.5 leading-relaxed">
            <span className="font-medium">Indicated by the documented findings: </span>
            {NSG_SCORES.filter((s) => indicated.includes(s.key))
              .map((s) => s.short)
              .join(" · ")}
          </p>
        )}
      </div>

      {open.length === 0 && (
        <div className="rounded-lg border border-border bg-muted/40 p-2.5 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            No score is open in this note. Open only the scores that apply to this patient's condition — a score outside
            its population, or one that changes no decision, adds risk without adding information.
          </p>
        </div>
      )}

      {open.map((key) => {
        const def = NSG_SCORES.find((s) => s.key === key);
        if (!def) return null;
        return (
          <ScoreCard
            key={key}
            def={def}
            vars={entries[key] || {}}
            onChange={(vars) => updateVars(key, vars)}
            onRemove={() => removeScore(key)}
          />
        );
      })}

      {available.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground">Open another score</Label>
          <div className="flex flex-wrap gap-1.5">
            {available.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => openScore(s.key)}
                title={`${s.purpose} Population: ${s.population}`}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition-colors ${
                  indicated.includes(s.key)
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card text-foreground hover:bg-muted/60"
                }`}
              >
                <Plus className="w-3 h-3" />
                {s.short}
                {indicated.includes(s.key) && <span className="text-[9px] uppercase tracking-wide">indicated</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {open.length > 0 && (
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            How the score informed the decision — and any disagreement with it
          </Label>
          <Textarea
            rows={2}
            value={safe.clinical_use || ""}
            onChange={(e) => set({ clinical_use: e.target.value })}
            className="text-xs"
            placeholder="e.g. Spetzler–Martin III left temporal AVM — discussed at MDT, surgery offered with the risks documented"
          />
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> A score supports a decision; it never makes it, and a high grade is
            never by itself a reason to withhold treatment.
          </p>
        </div>
      )}
    </div>
  );
}