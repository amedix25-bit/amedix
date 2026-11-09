import React, { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";
import { buildOncSafetyPrompts } from "@/lib/oncSafetyRules";

// The oncology safety review. Prompts are computed from what this note recorded and
// stored with the note, so the saved record and the PDF never show a later
// recalculation. A prompt never blocks saving, never stages, and never changes a
// diagnosis or an order.
export default function OncSafetyPromptsField({ value, values, onChange }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const actions = safe.actions || {};
  const notApplicable = safe.not_applicable || {};
  const prompts = buildOncSafetyPrompts({ values: values || {} });

  const set = (patch) => onChange({ ...safe, ...patch });
  const setAction = (key, text) => set({ actions: { ...actions, [key]: text } });
  const setNotApplicable = (key, text) => set({ not_applicable: { ...notApplicable, [key]: text } });

  const unresolved = prompts.filter(
    (p) => !String(actions[p.key] || "").trim() && !String(notApplicable[p.key] || "").trim(),
  );

  const resolved = prompts.map((p) => ({
    key: p.key,
    level: p.level,
    title: p.title,
    basis: p.basis,
    provenanceLabel: p.provenanceLabel,
    source: p.source,
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
          not diagnose, does not stage, orders nothing, and does not stop the note being saved. An empty list is not a
          statement that no urgent problem exists.
        </p>
      </div>

      {prompts.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {prompts.length} prompt{prompts.length === 1 ? "" : "s"} · {unresolved.length} without a documented response
        </p>
      )}

      {!prompts.length && (
        <p className="text-[11px] text-muted-foreground">No prompt is triggered by the findings documented so far.</p>
      )}

      {prompts.map((prompt) => {
        const action = actions[prompt.key] || "";
        const notApplicableReason = notApplicable[prompt.key] || "";
        const urgent = prompt.level === "urgent";
        const attention = prompt.level === "attention";
        return (
          <div
            key={prompt.key}
            className={`rounded-lg border p-2.5 space-y-2 ${
              urgent ? "border-critical/50 bg-critical/5" : attention ? "border-warning/50 bg-warning/5" : "border-border bg-muted/20"
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${urgent ? "text-critical" : attention ? "text-warning" : "text-primary"}`}
              />
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold leading-snug">{prompt.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{prompt.basis}</p>
                {prompt.ask && <p className="text-[11px] text-foreground leading-relaxed">{prompt.ask}</p>}
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {urgent ? "Urgent" : attention ? "Review" : "Consideration"} · {prompt.provenanceLabel}
                </p>
                <a
                  href={prompt.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  {prompt.source.organization} — {prompt.source.title}
                </a>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium">Action taken / clinical reasoning documented</label>
              <Textarea
                rows={2}
                value={action}
                onChange={(e) => setAction(prompt.key, e.target.value)}
                placeholder="What was done, arranged or considered — and why"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium">Not applicable to this patient — reason</label>
              <Textarea
                rows={1}
                value={notApplicableReason}
                onChange={(e) => setNotApplicable(prompt.key, e.target.value)}
                placeholder="Documented reason the prompt does not apply"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}