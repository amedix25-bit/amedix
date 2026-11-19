import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Calculator, ExternalLink, Info, Plus, X } from "lucide-react";
import { CARDIOLOGY_SCORES, calculateScore, indicatedScores } from "@/lib/cardiologyScores";

// Clinical scores for the cardiology notes.
//
// A score is offered when the documented findings match its population, and can
// still be opened deliberately by the clinician. It is calculated ONLY from the
// values entered here: while a variable is missing the score is not shown at all
// and the panel names what is missing, so no number is ever guessed. The result
// shows its variables and points, its interpretation band and its source.
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
  const incomplete = result && result.missing && result.missing.length > 0;

  return (
    <div className="rounded-lg border border-border bg-card p-2.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">{def.name}</p>
          <p className="text-[11px] text-muted-foreground leading-snug">{def.purpose}</p>
          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">Population: {def.population}</p>
        </div>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive shrink-0" title="Remove this score">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {def.external && (
        <p className="text-[11px] rounded border border-border bg-muted/40 p-1.5 leading-relaxed text-muted-foreground">
          {def.externalNote}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {def.variables.map((v) => (
          <div key={v.key} className="space-y-1">
            <Label className="text-[11px] text-muted-foreground leading-snug">{v.label}</Label>
            {v.type === "select" ? (
              <Select value={vars[v.key] || undefined} onValueChange={(x) => set(v.key, x)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Not documented" />
                </SelectTrigger>
                <SelectContent>
                  {v.options.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.value}
                      {o.points ? ` (${o.points > 0 ? "+" : ""}${o.points})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-1.5">
                <Input
                  type={v.type === "number" ? "number" : "text"}
                  value={vars[v.key] ?? ""}
                  step={v.step || "any"}
                  onChange={(e) => set(v.key, e.target.value)}
                  className="h-8 text-xs"
                  placeholder={v.type === "number" ? "Not documented" : "Source"}
                />
                {v.unit && <span className="text-[10px] text-muted-foreground shrink-0">{v.unit}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {incomplete ? (
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
                {result.display || `${result.total}${def.max ? ` of ${def.max}` : ""}${result.primaryLabel ? ` — ${result.primaryLabel}` : ""}`}
              </p>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${TONE_LABEL[result.band?.tone] || ""}`}>
                {result.band?.label}
              </span>
            </div>
            {result.secondary && (
              <p className="text-[11px] text-muted-foreground">
                {result.secondary.label}: {result.secondary.total}
              </p>
            )}
            <div className="text-[11px] leading-relaxed">
              {result.band?.note}
            </div>
            {result.mortality && (
              <p className="text-[11px] text-muted-foreground">Reported mortality for this score: {result.mortality}</p>
            )}
            {(result.items || []).length > 0 && (
              <div className="text-[10px] text-muted-foreground leading-relaxed border-t border-border/60 pt-1">
                {result.items.map((i) => (
                  <span key={i.label} className="mr-2 whitespace-nowrap">
                    {i.label}
                    {i.points === null || i.points === undefined ? "" : ` (${i.points > 0 ? "+" : ""}${i.points})`}
                  </span>
                ))}
              </div>
            )}
            {result.clinicianConfirms && (
              <p className="text-[10px] font-medium text-foreground">
                Clinician confirmation required — record the agreed stage in the assessment.
              </p>
            )}
          </div>
        )
      )}

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

export default function CardiologyScoresField({ value, values, onChange }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const entries = safe.entries && typeof safe.entries === "object" ? safe.entries : {};
  const open = Object.keys(entries);
  const indicated = indicatedScores(values || {});
  const available = CARDIOLOGY_SCORES.filter((s) => !open.includes(s.key));

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
          <Calculator className="w-3.5 h-3.5" /> Validated clinical scores — calculated only from documented values
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          A score appears below when the findings documented in this note match its population, and can also be opened
          deliberately. Every score is calculated from the values entered against it, keeps its variables and weighting in
          the record, and states its source. A score that cannot be calculated from documented information is left
          uncalculated — never filled in, estimated or defaulted.
        </p>
        {indicated.length > 0 && (
          <p className="text-[11px] mt-1.5 leading-relaxed">
            <span className="font-medium">Indicated by the documented findings: </span>
            {CARDIOLOGY_SCORES.filter((s) => indicated.includes(s.key))
              .map((s) => s.short)
              .join(" · ")}
          </p>
        )}
      </div>

      {open.length === 0 && (
        <div className="rounded-lg border border-border bg-muted/40 p-2.5 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            No score is open in this note. Open only the scores relevant to the decisions being taken — a score that does
            not change a decision adds risk without adding information.
          </p>
        </div>
      )}

      {open.map((key) => {
        const def = CARDIOLOGY_SCORES.find((s) => s.key === key);
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
            How the scores informed the decision — and any clinician disagreement with the score
          </Label>
          <Textarea
            rows={2}
            value={safe.clinical_use || ""}
            onChange={(e) => set({ clinical_use: e.target.value })}
            className="text-xs"
            placeholder="e.g. GRACE 152 — invasive strategy within 2 hours, cardiology registrar informed 03:10"
          />
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> A score supports a decision; it never makes it, and a high bleeding score
            is never by itself a reason to withhold anticoagulation.
          </p>
        </div>
      )}
    </div>
  );
}