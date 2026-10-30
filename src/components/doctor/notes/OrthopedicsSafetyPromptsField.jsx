import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, BellRing, ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";
import {
  ORTHO_SAFETY_CONCERNS,
  ORTHO_SAFETY_PROVENANCE,
  ORTHO_SAFETY_THRESHOLDS,
  buildOrthoSafetyPrompts,
} from "@/lib/orthopedicsSafetyRules";

// Conditional patient-safety panel for the Orthopedics & Traumatology notes.
//
// A prompt appears only when this note recorded something that raises it — an
// open injury, a compartment finding, a distal deficit, a spinal red flag, an
// implant problem, a medication that changes surgical risk — or when the
// clinician ticks the concern. Nothing here diagnoses, orders imaging or
// antibiotics, reduces a joint or changes a plan: the clinician documents the
// action, the time and the person who made the decision.

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
          {prompt.provenanceLabel || ORTHO_SAFETY_PROVENANCE.local}
        </span>
        {prompt.source && (
          <a
            href={prompt.source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {prompt.source.organization}
          </a>
        )}
      </div>
      <Input
        value={action || ""}
        onChange={(e) => onAction(e.target.value)}
        placeholder="Action taken, timing, who was contacted and the outcome"
        className="h-8 text-xs"
      />
      {!String(action || "").trim() && <p className="text-[11px] text-destructive">No action documented yet.</p>}
      <Input
        value={notApplicableReason || ""}
        onChange={(e) => onNotApplicable(e.target.value)}
        placeholder="Or record why no action was required, with the findings that supported that decision"
        className="h-8 text-xs"
      />
    </div>
  );
}

export default function OrthopedicsSafetyPromptsField({ value, values, onChange }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const concerns = Array.isArray(safe.concerns) ? safe.concerns : [];
  const actions = safe.actions || {};
  const notApplicable = safe.not_applicable || {};
  const overrides = safe.thresholds || {};
  const prompts = buildOrthoSafetyPrompts({ concerns, values: values || {}, thresholds: overrides });

  const set = (patch) => onChange({ ...safe, ...patch });
  const toggleConcern = (key) =>
    set({ concerns: concerns.includes(key) ? concerns.filter((c) => c !== key) : [...concerns, key] });
  const setAction = (key, text) => set({ actions: { ...actions, [key]: text } });
  const setNotApplicable = (key, text) => set({ not_applicable: { ...notApplicable, [key]: text } });
  const setThreshold = (key, text) => set({ thresholds: { ...overrides, [key]: text } });

  const unresolved = prompts.filter(
    (p) => !String(actions[p.key] || "").trim() && !String(notApplicable[p.key] || "").trim()
  );

  // What the clinician was shown is stored with the note, so the saved record and
  // the PDF never show a later recalculation.
  const resolved = prompts.map((p) => ({
    key: p.key,
    level: p.level,
    title: p.title,
    basis: p.basis,
    evidence: p.evidence || [],
    provenanceLabel: p.provenanceLabel || "",
    source: p.source,
    triggeredBy: p.triggeredBy,
  }));
  const signature = JSON.stringify(resolved);
  const storedSignature = JSON.stringify(safe.resolved || []);
  useEffect(() => {
    if (signature !== storedSignature) onChange({ ...safe, resolved });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
        <p className="text-xs font-medium flex items-center gap-1.5 text-primary">
          <ShieldCheck className="w-3.5 h-3.5" /> Decision support — never a substitute for clinical judgement
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          Urgent care comes first: reduce, splint, escalate, then document. Nothing here has to be completed before treatment,
          and no prompt diagnoses, orders imaging or antibiotics, prescribes thromboprophylaxis, reduces a joint or changes a
          plan. The decision, the time and the person who made it are recorded by the clinician.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Thresholds in use in this encounter</Label>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Defaults are shown with the body that publishes them. A local protocol may differ — change the value here and the
          value used is stored and printed beside the prompt. A threshold marked local requires Orthopedics approval.
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {ORTHO_SAFETY_THRESHOLDS.map((t) => (
            <div key={t.key} className="rounded-md border border-border bg-card p-2 space-y-1">
              <p className="text-[11px] font-medium leading-snug">{t.label}</p>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={overrides[t.key] ?? String(t.value)}
                  onChange={(e) => setThreshold(t.key, e.target.value)}
                  className="h-7 text-xs w-24"
                />
                <span className="text-[10px] text-muted-foreground">{t.unit}</span>
                <span className="text-[10px] px-1 py-0.5 rounded border border-border bg-muted/40 text-muted-foreground ml-auto">
                  {t.provenance === "local" ? "Local" : "Published"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">{t.basis}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Concerns documented or suspected in this encounter</Label>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Select only what applies. Leaving this empty means no concern was recorded — not that none was present.
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {ORTHO_SAFETY_CONCERNS.map((c) => {
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

      {prompts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Raised by this note ({prompts.length})</p>
          {prompts.map((p) => (
            <PromptRow
              key={p.key}
              prompt={p}
              action={actions[p.key]}
              onAction={(t) => setAction(p.key, t)}
              notApplicableReason={notApplicable[p.key]}
              onNotApplicable={(t) => setNotApplicable(p.key, t)}
            />
          ))}
          {unresolved.length > 0 && (
            <p className="text-[11px] text-destructive">
              {unresolved.length} prompt{unresolved.length === 1 ? "" : "s"} without an action or a documented reason.
            </p>
          )}
        </div>
      )}

      {prompts.length === 0 && (
        <p className="text-[11px] text-muted-foreground leading-relaxed rounded-md border border-dashed border-border p-2">
          No prompt has been raised by the findings recorded in this note so far. This is not a statement that no urgent
          problem exists — record the examination and the findings that matter.
        </p>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Other safety concern documented</Label>
        <Input
          value={safe.other_concern || ""}
          onChange={(e) => set({ other_concern: e.target.value })}
          placeholder="Any other concern and the action taken"
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}