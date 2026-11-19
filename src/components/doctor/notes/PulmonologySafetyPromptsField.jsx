import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { buildPulmonologySafetyPrompts } from "@/lib/pulmonologySafetyRules";

const LEVEL = {
  same_day: { label: "Address today", box: "border-critical/40 bg-critical/5", text: "text-critical" },
  documented: { label: "Document before signing", box: "border-warning/40 bg-warning/5", text: "text-warning" },
  advisory: { label: "Advisory", box: "border-info/40 bg-info/5", text: "text-info" },
};

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

// Advisory documentation prompts built only from what this note documents. They
// never block saving, never add or change a diagnosis, never order anything and
// never read a blank field as normal: each one names what the cited guideline
// requires to be recorded and lets the clinician document the action taken —
// including a documented decision not to follow the prompt.
export default function PulmonologySafetyPromptsField({ value, values, onChange, noteKey }) {
  const state = asObject(value);
  const acknowledged = Array.isArray(state.acknowledged) ? state.acknowledged : [];
  const notes = asObject(state.notes);
  const prompts = buildPulmonologySafetyPrompts({ values, noteKey });

  const toggle = (key) =>
    onChange({
      ...state,
      acknowledged: acknowledged.includes(key) ? acknowledged.filter((k) => k !== key) : [...acknowledged, key],
    });

  const setNote = (key, text) => onChange({ ...state, notes: { ...notes, [key]: text } });

  return (
    <div className="space-y-3">
      {prompts.length === 0 ? (
        <p className="flex items-start gap-2 rounded-md border border-success/40 bg-success/5 px-2.5 py-2 text-xs text-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          No documentation gap was identified in the fields recorded on this note. This is not confirmation that
          assessment or management is complete — it reflects only what has been entered above.
        </p>
      ) : (
        <>
          <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {prompts.length} advisory {prompts.length === 1 ? "prompt" : "prompts"} raised from this note. These are
            documentation prompts, not clinical orders: record the action taken, or why it was not taken.
          </p>
          {prompts.map((p) => {
            const style = LEVEL[p.level] || LEVEL.advisory;
            const on = acknowledged.includes(p.key);
            return (
              <div key={p.key} className={`space-y-1.5 rounded-lg border px-3 py-2 ${style.box}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-start gap-1.5 text-xs font-semibold text-foreground">
                    <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${style.text}`} />
                    {p.title}
                  </p>
                  <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${style.text}`}>
                    {style.label}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{p.basis}</p>
                <p className="text-[11px] leading-relaxed text-foreground">{p.action}</p>
                {p.source && (
                  <p className="text-[10px] text-muted-foreground">
                    {p.source.issuing_organization} — {p.source.title}, {p.source.edition}
                    {p.source.status !== "current" ? " (edition to be re-checked at the source)" : ""}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => toggle(p.key)}
                    aria-pressed={on}
                    className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {on ? "Action documented" : "Mark action documented"}
                  </button>
                </div>
                {on && (
                  <div className="space-y-1">
                    <Label className="text-[11px]">What was documented</Label>
                    <Textarea
                      rows={2}
                      value={notes[p.key] ?? ""}
                      placeholder="The action taken, or the documented reason it was not appropriate here."
                      onChange={(e) => setNote(p.key, e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}