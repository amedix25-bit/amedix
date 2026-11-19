import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { buildAllergySafetyPrompts } from "@/lib/allergySafetyRules";

const LEVEL = {
  same_day: { label: "Address today", box: "border-critical/40 bg-critical/5", text: "text-critical" },
  documented: { label: "Document before signing", box: "border-warning/40 bg-warning/5", text: "text-warning" },
  advisory: { label: "Advisory", box: "border-info/40 bg-info/5", text: "text-info" },
};

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

// Advisory decision support built only from what this note documents. It never
// blocks saving, never changes a diagnosis, never orders anything and never turns
// a test result into a diagnosis: it names what the cited guideline requires to
// be recorded and lets the clinician document the action taken — including a
// documented decision not to follow the prompt.
export default function AllergySafetyPromptsField({ value, values, onChange }) {
  const state = asObject(value);
  const acknowledged = Array.isArray(state.acknowledged) ? state.acknowledged : [];
  const prompts = buildAllergySafetyPrompts({ values });

  const toggle = (key) =>
    onChange({
      ...state,
      acknowledged: acknowledged.includes(key) ? acknowledged.filter((k) => k !== key) : [...acknowledged, key],
    });

  return (
    <div className="space-y-3">
      {prompts.length === 0 ? (
        <p className="flex items-start gap-2 text-xs rounded-md border border-success/40 bg-success/5 px-2.5 py-2 text-foreground">
          <ShieldCheck className="w-4 h-4 shrink-0 text-success" />
          No documentation gap was identified from the fields recorded in this note. This is not confirmation that
          assessment or management is complete — it only reflects what has been entered above.
        </p>
      ) : (
        <>
          <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {prompts.length} advisory {prompts.length === 1 ? "prompt" : "prompts"} raised from this note. Tick the ones
            where the action is now documented, and record what was done.
          </p>
          {prompts.map((p) => {
            const style = LEVEL[p.level] || LEVEL.advisory;
            const on = acknowledged.includes(p.key);
            return (
              <div key={p.key} className={`rounded-lg border px-3 py-2 space-y-1.5 ${style.box}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground flex items-start gap-1.5">
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${style.text}`} />
                    {p.title}
                  </p>
                  <span className={`shrink-0 text-[10px] uppercase tracking-wide font-semibold ${style.text}`}>
                    {style.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{p.basis}</p>
                <p className="text-[11px] text-foreground leading-relaxed">{p.action}</p>
                {p.source ? (
                  <p className="text-[10px] text-muted-foreground">
                    {p.source.organization} — {p.source.title}, {p.source.edition}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => toggle(p.key)}
                  aria-pressed={on}
                  className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                    on
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {on ? "Action documented" : "Mark action documented"}
                </button>
              </div>
            );
          })}
        </>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">What was done about the prompts above</Label>
        <Textarea
          rows={2}
          value={state.notes ?? ""}
          onChange={(e) => onChange({ ...state, notes: e.target.value })}
          placeholder="Who was informed, what was arranged, or the documented reason a prompt does not apply."
        />
      </div>
    </div>
  );
}