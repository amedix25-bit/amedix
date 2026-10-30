import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, BellRing, ExternalLink, FileCheck2, Info, ShieldCheck } from "lucide-react";
import {
  NSG_PROVENANCE,
  NSG_SAFETY_CONCERNS,
  buildNeurosurgerySafetyPrompts,
} from "@/lib/neurosurgerySafetyRules";
import {
  NSG_CODING_PRINCIPLES,
  auditNeurosurgicalDiagnoses,
  codingInstructionsFor,
} from "@/lib/neurosurgeryCoding";
import { NSG_REFERENCES } from "@/lib/neurosurgeryReferences";

// Coding guidance + conditional decision support for the Neurosurgery notes.
//
// A prompt appears only when the clinician selected a concern in this encounter
// or documented a structured finding that raises it. Nothing is derived from an
// unanswered field, and an empty panel says so instead of implying reassurance.
// No prompt diagnoses, prescribes, orders or prioritises care, no prompt blocks
// saving, and none of it comes before treating the patient.

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

function PromptRow({ prompt, action, onAction, notApplicable, onNotApplicable }) {
  return (
    <div className="rounded-lg border border-border bg-background p-2.5 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-foreground leading-snug">{prompt.title}</p>
        <LevelChip level={prompt.level} />
      </div>
      {prompt.evidence.length > 0 && (
        <p className="text-[11px] text-foreground/80 leading-snug">
          <span className="font-medium">Documented:</span> {prompt.evidence.join("; ")}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground leading-relaxed">{prompt.basis}</p>
      <p className="text-[11px] text-foreground/90 leading-relaxed">{prompt.action}</p>
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/40 text-muted-foreground">
          {prompt.provenanceLabel || NSG_PROVENANCE.local_decision}
        </span>
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
        placeholder="Action taken, time, who was informed and the outcome"
        className="h-8 text-xs"
      />
      {!String(action || "").trim() && <p className="text-[11px] text-destructive">No action documented yet.</p>}
      <Input
        value={notApplicable || ""}
        onChange={(e) => onNotApplicable(e.target.value)}
        placeholder="Or record why this prompt did not require action"
        className="h-8 text-xs"
      />
    </div>
  );
}

export default function NeurosurgeryGuidanceField({ value, values, onChange, noteKey }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const concerns = Array.isArray(safe.concerns) ? safe.concerns : [];
  const actions = safe.actions || {};
  const notApplicable = safe.not_applicable || {};
  const prompts = buildNeurosurgerySafetyPrompts({ concerns, values: values || {} });
  const coding = codingInstructionsFor(noteKey);
  const audit = auditNeurosurgicalDiagnoses(values?.icd11_diagnoses);

  const set = (patch) => onChange({ ...safe, ...patch });
  const toggleConcern = (key) =>
    set({ concerns: concerns.includes(key) ? concerns.filter((c) => c !== key) : [...concerns, key] });

  const unresolved = prompts.filter(
    (p) => !String(actions[p.key] || "").trim() && !String(notApplicable[p.key] || "").trim()
  );

  // The prompts and coding instructions shown are stored WITH the note, so the
  // saved record and its PDF show what the clinician was shown.
  const resolved = prompts.map((p) => ({
    key: p.key,
    level: p.level,
    title: p.title,
    basis: p.basis,
    evidence: p.evidence,
    provenanceLabel: p.provenanceLabel,
    source: p.source,
  }));
  const signature = JSON.stringify({ resolved, coding });
  const storedSignature = JSON.stringify({ resolved: safe.resolved || [], coding: safe.coding || [] });
  useEffect(() => {
    if (signature !== storedSignature) onChange({ ...safe, resolved, coding });
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
            onAction={(t) => set({ actions: { ...actions, [p.key]: t } })}
            notApplicable={notApplicable[p.key]}
            onNotApplicable={(t) => set({ not_applicable: { ...notApplicable, [p.key]: t } })}
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
          Treat first, document after. Nothing on this page has to be completed before treatment, and nothing here
          decides that a patient is stable — that judgement, and the decision taken, are recorded by the clinician.
        </p>
        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
          Content follows:{" "}
          {NSG_REFERENCES.map((r, i) => (
            <span key={r.key}>
              {i > 0 && " · "}
              <a href={r.url} target="_blank" rel="noreferrer" className="underline hover:text-primary">
                {r.short}
              </a>
            </span>
          ))}
          . The edition in use must be confirmed by the neurosurgical lead.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-2.5 space-y-1.5">
        <Label className="text-xs">Coding guidance for this note</Label>
        {coding.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No note-specific instruction recorded.</p>
        ) : (
          <ul className="space-y-1">
            {coding.map((line) => (
              <li key={line} className="text-[11px] text-foreground/85 leading-relaxed flex gap-1.5">
                <span className="text-primary">•</span>
                {line}
              </li>
            ))}
          </ul>
        )}
        <ul className="space-y-1 pt-1 border-t border-border">
          {NSG_CODING_PRINCIPLES.slice(0, 3).map((line) => (
            <li key={line} className="text-[10px] text-muted-foreground leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
        {audit.length > 0 && (
          <div className="rounded-md border border-amber-300/60 bg-amber-50 p-2 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Coding review prompts (advisory — the documented diagnosis stands)
            </p>
            {audit.map((a, i) => (
              <p key={`${a.message}-${i}`} className="text-[11px] text-amber-900 leading-relaxed">
                {a.message}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Findings and concerns documented in this encounter</Label>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Select only what applies. Leaving this empty means no concern was recorded — not that none was present.
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {NSG_SAFETY_CONCERNS.map((c) => {
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
            No prompt is triggered by the findings documented so far. That is not a statement that no urgent problem
            exists — record the conscious level and its trend, the pupils, the focal findings and the values that
            matter for this patient.
          </p>
        </div>
      ) : (
        <>
          {unresolved.length > 0 && (
            <p className="text-[11px] text-destructive">
              {unresolved.length} prompt{unresolved.length === 1 ? "" : "s"} without a documented action or reason.
            </p>
          )}
          {group("Record the action now", prompts.filter((p) => p.level === "immediate"), "text-destructive")}
          {group("Same day", prompts.filter((p) => p.level === "same_day"), "text-amber-700")}
          {group("Documentation", prompts.filter((p) => p.level === "documented"), "text-primary")}
        </>
      )}
    </div>
  );
}