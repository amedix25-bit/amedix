import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, BellRing, ExternalLink, FileCheck2, Info, ShieldCheck } from "lucide-react";
import {
  HEMA_SAFETY_CONCERNS,
  HEMA_SAFETY_CONFIRMATION,
  HEMA_SAFETY_PROVENANCE,
  HEMA_SAFETY_THRESHOLDS,
  buildHemaSafetyPrompts,
} from "@/lib/hematologySafetyRules";
import { HEMA_ASH_ATTRIBUTION, HEMA_ASH_SOURCE_URL } from "@/lib/hematologyAshGuidelines";

// Conditional patient-safety panel for the Haematology notes.
//
// A prompt appears only when the note records a result beyond a stated threshold,
// a structured finding, an emergency presentation or a concern the clinician
// ticked. The thresholds in use are shown and can be changed for this encounter,
// with the value stored and printed beside the prompt. Nothing here treats,
// prescribes, orders blood or starts anticoagulation — the clinician documents
// the decision and who made it.

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
          {prompt.provenanceLabel || HEMA_SAFETY_PROVENANCE.local}
        </span>
        {prompt.source && (
          <a
            href={prompt.source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {prompt.source.organization} — {prompt.source.edition}
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

export default function HematologySafetyPromptsField({ value, values, onChange }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const concerns = Array.isArray(safe.concerns) ? safe.concerns : [];
  const actions = safe.actions || {};
  const notApplicable = safe.not_applicable || {};
  const overrides = safe.thresholds || {};
  const prompts = buildHemaSafetyPrompts({ concerns, values: values || {}, thresholds: overrides });

  const set = (patch) => onChange({ ...safe, ...patch });
  const toggleConcern = (key) => {
    const next = concerns.includes(key) ? concerns.filter((c) => c !== key) : [...concerns, key];
    set({ concerns: next });
  };
  const setAction = (key, text) => set({ actions: { ...actions, [key]: text } });
  const setNotApplicable = (key, text) => set({ not_applicable: { ...notApplicable, [key]: text } });
  const setThreshold = (key, text) => set({ thresholds: { ...overrides, [key]: text } });

  const unresolved = prompts.filter(
    (p) => !String(actions[p.key] || "").trim() && !String(notApplicable[p.key] || "").trim()
  );

  // The prompts shown are stored with the note, so the saved record and the PDF
  // show what the clinician was shown rather than a later recalculation.
  const resolved = prompts.map((p) => ({
    key: p.key,
    level: p.level,
    title: p.title,
    basis: p.basis,
    evidence: p.evidence || [],
    provenanceLabel: HEMA_SAFETY_PROVENANCE[p.provenance] || "",
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
          Urgent care comes first: treat, then document. Nothing here has to be completed before treatment, and no prompt
          diagnoses, prescribes, starts anticoagulation, orders blood or changes therapy. The decision, the time and the
          person who made it are recorded by the clinician.
        </p>
        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
          {HEMA_ASH_ATTRIBUTION}{" "}
          <a href={HEMA_ASH_SOURCE_URL} target="_blank" rel="noreferrer" className="underline hover:text-primary">
            ASH clinical practice guidelines
          </a>
          .
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Thresholds in use in this encounter</Label>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Defaults are shown with the body that publishes them. A local protocol may differ — change the value here and the
          value used is stored and printed beside the prompt. A threshold marked local requires Haematology approval.
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {HEMA_SAFETY_THRESHOLDS.map((t) => (
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
          {HEMA_SAFETY_CONCERNS.map((c) => {
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
            No prompt is triggered by what this note records so far. That is not a statement that no urgent problem exists —
            record the counts that were reported with their dates, the bleeding or thrombotic findings, the temperature and
            the emergency presentation if there is one.
          </p>
        </div>
      ) : (
        <>
          {unresolved.length > 0 && (
            <p className="text-[11px] text-destructive">
              {unresolved.length} prompt{unresolved.length === 1 ? "" : "s"} without a documented action or reason.
            </p>
          )}
          {group("Act now", prompts.filter((p) => p.level === "immediate"), "text-destructive")}
          {group("Same-day clinical decision", prompts.filter((p) => p.level === "same_day"), "text-amber-800")}
          {group("Decision to document", prompts.filter((p) => p.level === "documented"), "text-primary")}
        </>
      )}

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Other haematology safety concern identified clinically</Label>
        <Input
          value={safe.other_concern || ""}
          onChange={(e) => set("other_concern", e.target.value)}
          placeholder="Any concern the prompts above do not capture"
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Escalation and documented action — who, when, outcome</Label>
        <Textarea
          rows={2}
          value={safe.escalation || ""}
          onChange={(e) => set("escalation", e.target.value)}
          placeholder="e.g. Haematology registrar informed 21:40 — antibiotics given 22:05, admitted to haematology ward"
          className="text-xs"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Clinician review of these prompts</Label>
        <Select value={safe.clinician_review || undefined} onValueChange={(v) => set("clinician_review", v)}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {HEMA_SAFETY_CONFIRMATION.map((o) => (
              <SelectItem key={o} value={o} className="text-xs">
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground leading-snug">
          A decision is attributed to the clinician who signs the note. Selecting an option here records the review; it does
          not authorise any treatment on its own.
        </p>
      </div>
    </div>
  );
}