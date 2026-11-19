import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ChevronDown, ExternalLink, Info } from "lucide-react";
import { NEURO_REFERENCES } from "@/lib/neurologyReferences";
import {
  NEURO_EMERGENCY_LEVELS,
  NEURO_EMERGENCY_MAP,
  NEURO_EMERGENCY_NOTICE,
  NEURO_EMERGENCY_PRESENTATIONS,
  NEURO_PATHWAY_FIELDS,
  NEURO_RED_FLAGS,
  NEURO_RED_FLAG_STATES,
  neurologyEmergencyIssues,
  neurologyEmergencyState,
  selectedNeuroEmergencies,
} from "@/lib/neurologyEmergencies";

// Neurological emergency documentation panel.
//
// It records what the clinician found, which emergency it corresponded to, who was
// informed and when, what decision a qualified clinician recorded and where the
// patient went. It contains no treatment rule and no diagnosis: recognising a
// presentation here never orders thrombolysis, thrombectomy, an antiseizure
// medicine or any other intervention, and nothing here blocks saving the note.

function DocField({ field, value, onChange }) {
  if (field.type === "select") {
    return (
      <div className="space-y-1">
        <Label className="text-[11px] leading-snug">{field.label}</Label>
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o} value={o} className="text-xs">
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-[11px] leading-snug">{field.label}</Label>
        <Textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={2} className="text-xs min-h-[52px]" />
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <Label className="text-[11px] leading-snug">{field.label}</Label>
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || ""}
        className="h-8 text-xs"
      />
    </div>
  );
}

function FieldGroup({ fields, bag, setKey }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {fields.map((f) => (
        <DocField key={f.key} field={f} value={bag[f.key]} onChange={(v) => setKey(f.key, v)} />
      ))}
    </div>
  );
}

export default function NeurologyEmergencyField({ value, onChange }) {
  const state = neurologyEmergencyState(value);
  const [open, setOpen] = useState({});
  const patch = (next) => onChange({ ...state, ...next });
  const blocks = state.blocks || {};

  const blockOf = (key) => blocks[key] || {};
  const setDoc = (key, fieldKey, v) =>
    patch({
      blocks: { ...blocks, [key]: { ...blockOf(key), docs: { ...(blockOf(key).docs || {}), [fieldKey]: v } } },
    });
  const setPathway = (key, fieldKey, v) =>
    patch({
      blocks: { ...blocks, [key]: { ...blockOf(key), pathway: { ...(blockOf(key).pathway || {}), [fieldKey]: v } } },
    });

  const toggle = (field, key) => {
    const list = Array.isArray(state[field]) ? state[field] : [];
    patch({ [field]: list.includes(key) ? list.filter((x) => x !== key) : [...list, key] });
  };

  const selected = selectedNeuroEmergencies(state);
  const issues = neurologyEmergencyIssues(state);
  const issuesFor = (key) => issues.filter((i) => String(i.key).startsWith(`${key}_`));

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <p className="text-[11px] leading-snug text-foreground">{NEURO_EMERGENCY_NOTICE}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px]">Red-flag screen</Label>
          <Select value={state.red_flag_state || undefined} onValueChange={(v) => patch({ red_flag_state: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {NEURO_RED_FLAG_STATES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Emergency statement</Label>
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="flex items-start gap-2 text-[11px] leading-snug cursor-pointer">
              <Checkbox
                checked={Boolean(state.none_documented)}
                onCheckedChange={(c) => patch({ none_documented: Boolean(c), not_assessed: false })}
                className="mt-0.5"
              />
              <span>No neurological emergency documented — the examination above supports this</span>
            </label>
            <label className="flex items-start gap-2 text-[11px] leading-snug cursor-pointer">
              <Checkbox
                checked={Boolean(state.not_assessed)}
                onCheckedChange={(c) => patch({ not_assessed: Boolean(c), none_documented: false })}
                className="mt-0.5"
              />
              <span>Not assessed at the time of this note</span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-[11px]">Red flags recorded</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
          {NEURO_RED_FLAGS.map((flag) => {
            const on = state.red_flags.includes(flag.key);
            return (
              <label key={flag.key} className="flex items-start gap-2 text-[11px] leading-snug cursor-pointer">
                <Checkbox checked={on} onCheckedChange={() => toggle("red_flags", flag.key)} className="mt-0.5" />
                <span>
                  {flag.label}
                  <span className="block text-[10px] text-muted-foreground">
                    {NEURO_EMERGENCY_LEVELS[flag.level].label} · points to {NEURO_EMERGENCY_MAP[flag.pointsTo]?.label}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-[11px]">Emergencies documented in this encounter</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
          {NEURO_EMERGENCY_PRESENTATIONS.map((p) => {
            const on = state.presentations.includes(p.key);
            return (
              <label key={p.key} className="flex items-start gap-2 text-[11px] leading-snug cursor-pointer">
                <Checkbox checked={on} onCheckedChange={() => toggle("presentations", p.key)} className="mt-0.5" />
                <span>
                  {p.label}
                  <span className={`block text-[10px] ${p.level === "immediate" ? "text-destructive" : "text-muted-foreground"}`}>
                    {NEURO_EMERGENCY_LEVELS[p.level].label}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {selected.map((key) => {
        const spec = NEURO_EMERGENCY_MAP[key];
        const block = blockOf(key);
        const docs = block.docs || {};
        const pathway = block.pathway || {};
        const isOpen = Boolean(open[key]);
        const own = issuesFor(key);

        return (
          <div key={key} className="rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                <span className="text-xs font-semibold text-primary truncate">{spec.label}</span>
              </span>
              <span className="shrink-0 flex items-center gap-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${NEURO_EMERGENCY_LEVELS[spec.level].chip}`}>
                  {NEURO_EMERGENCY_LEVELS[spec.level].label}
                </span>
                {own.length > 0 && <span className="text-[10px] text-warning">{own.length} owed</span>}
              </span>
            </button>

            {isOpen && (
              <div className="px-3 pb-3 pt-3 space-y-3">
                <div className="rounded-md bg-muted/40 px-2.5 py-2 space-y-1">
                  <p className="text-[11px] leading-snug text-foreground">
                    <span className="font-semibold">Why this is urgent: </span>
                    {spec.why}
                  </p>
                  <p className="text-[11px] leading-snug text-foreground">
                    <span className="font-semibold">Time-critical: </span>
                    {spec.timeCritical}
                  </p>
                  <p className="text-[11px] leading-snug text-foreground">
                    <span className="font-semibold">Pathway: </span>
                    {spec.pathway}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {spec.provenance === "guideline" ? "Guideline requirement" : "AMedix local decision — not a guideline claim"}
                    {spec.references
                      .map((r) => NEURO_REFERENCES[r])
                      .filter(Boolean)
                      .map((r) => ` · ${r.organization} — ${r.title}`)
                      .join("")}
                  </p>
                  {spec.references.some((r) => NEURO_REFERENCES[r]?.url) && (
                    <span className="flex flex-wrap gap-2">
                      {spec.references
                        .map((r) => NEURO_REFERENCES[r])
                        .filter((r) => r && r.url)
                        .map((r) => (
                          <a
                            key={r.title}
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {r.organization}
                          </a>
                        ))}
                    </span>
                  )}
                </div>

                <div className="rounded-md border border-border px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Findings that raise this presentation
                  </p>
                  <ul className="space-y-0.5">
                    {spec.recognition.map((r) => (
                      <li key={r} className="text-[11px] leading-snug text-foreground flex gap-1.5">
                        <span className="text-muted-foreground">·</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <FieldGroup fields={spec.fields} bag={docs} setKey={(k, v) => setDoc(key, k, v)} />

                <div className="rounded-md border border-border px-2.5 py-2 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Urgent pathway record</p>
                  <FieldGroup fields={NEURO_PATHWAY_FIELDS} bag={pathway} setKey={(k, v) => setPathway(key, k, v)} />
                </div>

                {spec.note && <p className="text-[10px] text-muted-foreground leading-snug">{spec.note}</p>}

                {own.length > 0 && (
                  <div className="rounded-md bg-warning/10 px-2.5 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground mb-1">This record still owes</p>
                    <ul className="space-y-0.5">
                      {own.map((i) => (
                        <li key={i.key} className="text-[11px] leading-snug text-foreground">
                          {i.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {issues.length > 0 && (
        <div className="rounded-md bg-muted/50 px-2.5 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
            <Info className="w-3 h-3" /> Outstanding in this emergency record
          </p>
          <ul className="space-y-0.5">
            {issues.map((i) => (
              <li key={i.key} className="text-[11px] leading-snug text-foreground">
                {i.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground leading-snug">
        Alerts here describe what was documented and why it matters. They never diagnose, never order treatment and never delay it —
        treatment decisions belong to the qualified clinician assessing the patient, and are recorded with that clinician's name.
      </p>
    </div>
  );
}