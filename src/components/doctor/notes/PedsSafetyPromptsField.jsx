import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";
import { buildPedsSafetyPrompts } from "@/lib/pedsSafetyRules";
import { PEDS_REFERENCES } from "@/lib/pedsReferences";

// The pediatric safety review. Prompts are computed from what this note recorded and
// stored with the note, so the saved record and the PDF never show a later
// recalculation. A prompt never blocks saving and never changes a diagnosis.
export default function PedsSafetyPromptsField({ value, values, onChange }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const actions = safe.actions || {};
  const notApplicable = safe.not_applicable || {};
  const prompts = buildPedsSafetyPrompts({ values: values || {} });

  const set = (patch) => onChange({ ...safe, ...patch });
  const setAction = (key, text) => set({ actions: { ...actions, [key]: text } });
  const setNotApplicable = (key, text) => set({ not_applicable: { ...notApplicable, [key]: text } });

  const unresolved = prompts.filter(
    (p) => !String(actions[p.key] || "").trim() && !String(notApplicable[p.key] || "").trim(),
  );

  const resolved = prompts.map((p) => ({
    key: p.key,
    level: p.level,
    levelLabel: p.levelLabel,
    title: p.title,
    basis: p.basis,
    provenanceLabel: p.provenanceLabel,
    source: p.source,
    sourceLabel: p.sourceLabel,
  }));
  const signature = JSON.stringify(resolved);
  const storedSignature = JSON.stringify(safe.resolved || []);
  useEffect(() => {
    if (signature !== storedSignature) onChange({ ...safe, resolved });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2">
        <ShieldCheck className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-snug">
          Calculated from the findings recorded in this note, against the cited document. A prompt is advisory: it does
          not diagnose, order treatment or stop the note being saved, and an empty list is not a statement that no urgent
          problem exists.
        </p>
      </div>

      {!prompts.length && (
        <p className="text-[11px] text-muted-foreground">
          No prompt is triggered by the findings documented so far.
        </p>
      )}

      {prompts.map((prompt) => {
        const action = actions[prompt.key] || "";
        const notApplicableReason = notApplicable[prompt.key] || "";
        const critical = prompt.level === "critical";
        const url = PEDS_REFERENCES[prompt.source]?.url || "";
        return (
          <div
            key={prompt.key}
            className={`rounded-lg border px-2.5 py-2 space-y-1.5 ${critical ? "border-destructive/40 bg-destructive/5" : "border-warning/40 bg-warning/5"}`}
          >
            <div className="flex items-start gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${critical ? "text-destructive" : "text-warning"}`} />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground">
                  {prompt.levelLabel} — {prompt.title}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">{prompt.basis}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-border rounded px-1 py-0.5">
                {prompt.provenanceLabel}
              </span>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  {prompt.sourceLabel}
                </a>
              ) : (
                <span className="text-[10px] text-muted-foreground">{prompt.sourceLabel}</span>
              )}
            </div>
            <Input
              value={action}
              onChange={(e) => setAction(prompt.key, e.target.value)}
              placeholder="Action taken, timing, who was contacted and the outcome"
              className="h-8 text-xs"
            />
            {!String(action).trim() && <p className="text-[11px] text-destructive">No action documented yet.</p>}
            <Input
              value={notApplicableReason}
              onChange={(e) => setNotApplicable(prompt.key, e.target.value)}
              placeholder="Or record why no action was required, with the findings that supported that decision"
              className="h-8 text-xs"
            />
          </div>
        );
      })}

      {unresolved.length > 0 && (
        <p className="text-[11px] text-destructive">
          {unresolved.length} {unresolved.length === 1 ? "prompt still has" : "prompts still have"} neither an action nor
          a documented reason.
        </p>
      )}
    </div>
  );
}