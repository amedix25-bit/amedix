import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, BellRing, ExternalLink, FileCheck2, Info, ShieldCheck } from "lucide-react";
import {
  ENT_SAFETY_CONCERNS,
  ENT_SAFETY_PROVENANCE,
  buildEntSafetyPrompts,
} from "@/lib/entSafetyRules";

// Conditional safety prompts for the ENT notes.
//
// A prompt appears only when the clinician selected a concern in this encounter
// or documented a structured finding that raises it. Nothing is derived from an
// unanswered field, and an empty panel says explicitly that it is not
// reassurance. Prompts never diagnose, prescribe or label the patient — they
// record what was documented, the time-sensitivity and the decision taken.
// No field here is required: urgent care is never delayed for documentation.

const LEVEL_CHIP = {
  immediate: "bg-destructive/10 text-destructive",
  same_day: "bg-amber-100 text-amber-800",
  documented: "bg-primary/10 text-primary",
};

const LevelChip = ({ level }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
      LEVEL_CHIP[level] || LEVEL_CHIP.documented
    }`}
  >
    {level === "immediate" ? (
      <AlertTriangle className="w-3 h-3" />
    ) : level === "same_day" ? (
      <BellRing className="w-3 h-3" />
    ) : (
      <FileCheck2 className="w-3 h-3" />
    )}
    {level === "immediate" ? "Act now" : level === "same_day" ? "Same day" : "Document"}
  </span>
);

function PromptRow({ prompt, action, onAction, notApplicableReason, onNotApplicable }) {
  return (
    <div className="rounded-lg border border-border bg-background p-2.5 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-foreground leading-snug">{prompt.title}</p>
        <LevelChip level={prompt.level} />
      </div>

      {prompt.evidence && prompt.evidence.length > 0 && (
        <p className="text-[11px] text-foreground/80 leading-snug">
          <span className="font-medium">Documented:</span> {prompt.evidence.join("; ")}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground leading-relaxed">{prompt.basis}</p>
      <p className="text-[11px] text-foreground/90 leading-relaxed">{prompt.action}</p>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/40 text-muted-foreground">
          {ENT_SAFETY_PROVENANCE[prompt.provenance] || ENT_SAFETY_PROVENANCE.documentation_practice}
        </span>
        {prompt.approvalRequired && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800">
            Wording and timing awaiting ENT clinical approval
          </span>
        )}
        {prompt.source && (
          <a
            href={prompt.source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {prompt.source.organization} — {prompt.source.version}
          </a>
        )}
      </div>

      <Input
        value={action || ""}
        onChange={(e) => onAction(e.target.value)}
        placeholder="Action taken, timing, who was contacted and the outcome"
        className="h-8 text-xs"
      />
      {!String(action || "").trim() && (
        <p className="text-[11px] text-destructive">No action documented yet.</p>
      )}

      <Input
        value={notApplicableReason || ""}
        onChange={(e) => onNotApplicable(e.target.value)}
        placeholder="Or record why this prompt did not require action (reassuring findings documented)"
        className="h-8 text-xs"
      />
    </div>
  );
}

const TRIAGE_OPTIONS = [
  "Not documented",
  "Managed in clinic — no change to the planned care",
  "Same-day senior ENT review arranged",
  "Same-day theatre or specialist assessment arranged",
  "Emergency department / resuscitation area",
  "Admitted for observation",
  "Transferred to another facility",
  "Discussed with a senior clinician — plan documented",
];

export default function EntSafetyPromptsField({ value, values, onChange }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const concerns = Array.isArray(safe.concerns) ? safe.concerns : [];
  const actions = safe.actions || {};
  const notApplicable = safe.not_applicable || {};
  const prompts = buildEntSafetyPrompts({ concerns, values: values || {} });

  const set = (patch) => onChange({ ...safe, ...patch });

  const toggleConcern = (key) => {
    const next = concerns.includes(key) ? concerns.filter((c) => c !== key) : [...concerns, key];
    set({ concerns: next });
  };

  const setAction = (key, text) => set({ actions: { ...actions, [key]: text } });
  const setNotApplicable = (key, text) => set({ not_applicable: { ...notApplicable, [key]: text } });

  const unresolved = prompts.filter(
    (p) => !String(actions[p.key] || "").trim() && !String(notApplicable[p.key] || "").trim()
  );
  const immediate = prompts.filter((p) => p.level === "immediate");
  const sameDay = prompts.filter((p) => p.level === "same_day");
  const documented = prompts.filter((p) => p.level === "documented");

  // The prompts shown are stored WITH the note so the saved record and the PDF
  // show exactly what the clinician was shown, not a later recalculation.
  const resolved = prompts.map((p) => ({
    key: p.key,
    level: p.level,
    title: p.title,
    basis: p.basis,
    evidence: p.evidence || [],
    provenanceLabel: ENT_SAFETY_PROVENANCE[p.provenance] || "",
    source: p.source,
  }));
  const signature = JSON.stringify(resolved);
  const storedSignature = JSON.stringify(safe.resolved || []);
  useEffect(() => {
    if (signature !== storedSignature) onChange({ ...safe, resolved });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const group = (title, list, tone) =>
    list.length > 0 && (
      <div className="space-y-2">
        <p className={`text-xs font-semibold ${tone}`}>
          {title} ({list.length})
        </p>
        {list.map((p) => (
          <PromptRow
            key={p.key}
            prompt={p}
            action={actions[p.key]}
            onAction={(t) => setAction(p.key, t)}
            notApplicableReason={notApplicable[p.key]}
            onNotApplicable={(t) => setNotApplicable(p.key, t)}
          />
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
        <p className="text-xs font-medium flex items-center gap-1.5 text-primary">
          <ShieldCheck className="w-3.5 h-3.5" /> Decision support — never a substitute for clinical judgement
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          Urgent care comes first. If the patient is unwell, act and then document — nothing on this page has to be
          completed before treatment. A prompt does not diagnose, prescribe or order anything, and it never decides that
          a patient is stable or unstable: that judgement and the decision taken are recorded here by the clinician.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Safety concerns documented or suspected in this encounter</Label>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Select only what applies to this encounter. Leading this empty means no concern was recorded — not that none
          was present.
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {ENT_SAFETY_CONCERNS.map((c) => {
            const active = concerns.includes(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleConcern(c.key)}
                aria-pressed={active}
                className={`text-left text-[11px] leading-snug rounded-md border px-2 py-1.5 transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card text-foreground hover:bg-muted/60"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {prompts.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/40 p-2.5 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            No prompt is triggered by the findings documented so far in this note. That is not a statement that no
            urgent problem exists — record the examination, airway, bleeding and neurological findings that matter for
            this patient.
          </p>
        </div>
      ) : (
        <>
          {unresolved.length > 0 && (
            <p className="text-[11px] text-destructive">
              {unresolved.length} prompt{unresolved.length === 1 ? "" : "s"} without a documented action or reason.
            </p>
          )}
          {group("Act now", immediate, "text-destructive")}
          {group("Same-day clinical decision", sameDay, "text-amber-800")}
          {group("Decision to document", documented, "text-primary")}
        </>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Decision taken in this encounter</Label>
          <Select value={safe.triage || undefined} onValueChange={(v) => set("triage", v)}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {TRIAGE_OPTIONS.map((o) => (
                <SelectItem key={o} value={o} className="text-xs">
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Other safety concern identified clinically</Label>
          <Input
            value={safe.other_concern || ""}
            onChange={(e) => set("other_concern", e.target.value)}
            placeholder="Any concern the findings above do not capture"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          Escalation and documented action — who, when, outcome
        </Label>
        <Textarea
          rows={2}
          value={safe.escalation || ""}
          onChange={(e) => set("escalation", e.target.value)}
          placeholder="e.g. ENT registrar contacted 21:40 — admitted for airway observation"
          className="text-xs"
        />
      </div>
    </div>
  );
}