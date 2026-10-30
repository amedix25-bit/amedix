import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ChevronDown, ExternalLink, Info, Siren } from "lucide-react";
import {
  ORTHO_INTERVENTION_FIELDS,
  ORTHO_PATHWAY_FIELDS,
  ORTHO_POST_NV_FIELDS,
  ORTHO_PRE_NV_FIELDS,
  ORTHO_RED_FLAGS,
  ORTHO_RED_FLAG_STATES,
  ORTHO_TRAUMA_LEVELS,
  ORTHO_TRAUMA_MAP,
  ORTHO_TRAUMA_PRESENTATIONS,
  emptyOrthoTrauma,
  orthoTraumaIssues,
  orthoTraumaReferences,
  orthoTraumaState,
} from "@/lib/orthopedicsTrauma";

// Trauma-emergency documentation panel for the Orthopedics & Traumatology notes.
//
// It records what the clinician found, who was told and when, what was done, and
// the neurovascular state before and after it. It contains no treatment rule: a
// presentation is documented because it was found — the action taken is written
// by the clinician, and an empty field is printed as NOT DOCUMENTED rather than
// read as normal.

const LEVEL_CHIP = { immediate: ORTHO_TRAUMA_LEVELS.immediate.chip, urgent: ORTHO_TRAUMA_LEVELS.urgent.chip, same_day: ORTHO_TRAUMA_LEVELS.same_day.chip };

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

function PresentationCard({ spec, block, update }) {
  const [open, setOpen] = useState(true);
  const docs = block.docs || {};
  const intervention = block.intervention || {};
  const pathway = block.pathway || {};
  const pre = block.pre_nv || {};
  const post = block.post_nv || {};

  const setDocs = (k, v) => update({ ...block, docs: { ...docs, [k]: v } });
  const setIntervention = (k, v) => update({ ...block, intervention: { ...intervention, [k]: v } });
  const setPathway = (k, v) => update({ ...block, pathway: { ...pathway, [k]: v } });
  const setPre = (k, v) => update({ ...block, pre_nv: { ...pre, [k]: v } });
  const setPost = (k, v) => update({ ...block, post_nv: { ...post, [k]: v } });

  const interventionRecorded = String(intervention.performed || "").startsWith("Yes");

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-2 p-2.5 text-left"
      >
        <span className="flex items-start gap-1.5">
          <Siren className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <span className="text-xs font-semibold text-foreground leading-snug">{spec.label}</span>
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-3 px-2.5 pb-3">
          <div className="rounded-md border border-border bg-muted/30 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">What raises it</p>
            <ul className="mt-1 space-y-0.5">
              {spec.recognition.map((r) => (
                <li key={r} className="text-[11px] text-foreground/80 leading-snug flex gap-1.5">
                  <span className="text-muted-foreground">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-foreground mb-1">Documented findings</p>
            <FieldGroup fields={spec.fields} bag={docs} setKey={setDocs} />
          </div>

          <div>
            <p className="text-[11px] font-semibold text-foreground mb-1">Time-critical pathway</p>
            <FieldGroup fields={ORTHO_PATHWAY_FIELDS} bag={pathway} setKey={setPathway} />
          </div>

          <div>
            <p className="text-[11px] font-semibold text-foreground mb-1">Urgent intervention</p>
            <FieldGroup fields={ORTHO_INTERVENTION_FIELDS} bag={intervention} setKey={setIntervention} />
            {spec.intervention && (
              <div className="mt-2">
                <FieldGroup fields={spec.intervention} bag={intervention} setKey={setIntervention} />
              </div>
            )}
          </div>

          {spec.requiresReassessment && (
            <div className={interventionRecorded ? "" : "opacity-80"}>
              <p className="text-[11px] font-semibold text-foreground mb-1">
                Neurovascular reassessment {interventionRecorded ? "" : "(required once an intervention is recorded)"}
              </p>
              <div className="space-y-2">
                <div className="rounded-md border border-border p-2">
                  <FieldGroup fields={ORTHO_PRE_NV_FIELDS} bag={pre} setKey={setPre} />
                </div>
                <div className="rounded-md border border-border p-2">
                  <FieldGroup fields={ORTHO_POST_NV_FIELDS} bag={post} setKey={setPost} />
                </div>
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground leading-relaxed rounded-md bg-muted/30 p-2">
            <Info className="w-3 h-3 inline mr-1" />
            {spec.note}
          </p>
        </div>
      )}
    </div>
  );
}

export default function OrthopedicsTraumaField({ value, onChange }) {
  const state = orthoTraumaState(value);
  const issues = orthoTraumaIssues(state);
  const refs = orthoTraumaReferences(state);

  const set = (patch) => onChange({ ...emptyOrthoTrauma(), ...state, ...patch });

  const togglePresentation = (key) => {
    const active = state.presentations.includes(key);
    set({
      presentations: active ? state.presentations.filter((p) => p !== key) : [...state.presentations, key],
      none_documented: active ? state.none_documented : false,
      not_assessed: active ? state.not_assessed : false,
    });
  };

  const toggleRedFlag = (key) => {
    const active = state.red_flags.includes(key);
    set({
      red_flags: active ? state.red_flags.filter((r) => r !== key) : [...state.red_flags, key],
      red_flag_state: active ? state.red_flag_state : ORTHO_RED_FLAG_STATES[1],
    });
  };

  const updateBlock = (key, block) => set({ blocks: { ...state.blocks, [key]: block } });

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-2.5">
        <p className="text-xs font-medium flex items-center gap-1.5 text-destructive">
          <AlertTriangle className="w-3.5 h-3.5" /> Life- and limb-threatening assessment
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          Record what was found, who was informed and when, what was done, and the neurovascular state before and after it.
          Nothing here is completed by default: an untreated field prints as NOT DOCUMENTED, not as normal.
        </p>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => set({ none_documented: !state.none_documented, presentations: [], not_assessed: false })}
          aria-pressed={state.none_documented}
          className={`text-left text-[11px] rounded-md border px-2 py-1.5 leading-snug ${
            state.none_documented ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-card hover:bg-muted/60"
          }`}
        >
          None documented in this encounter — supported by the examination recorded above
        </button>
        <button
          type="button"
          onClick={() => set({ not_assessed: !state.not_assessed, none_documented: false })}
          aria-pressed={state.not_assessed}
          className={`text-left text-[11px] rounded-md border px-2 py-1.5 leading-snug ${
            state.not_assessed ? "border-amber-400 bg-amber-50 text-amber-900 font-medium" : "border-border bg-card hover:bg-muted/60"
          }`}
        >
          Not assessed at the time of this note — the examination is incomplete
        </button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Red flags</Label>
        <Select value={state.red_flag_state || undefined} onValueChange={(v) => set({ red_flag_state: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Record whether red flags were looked for…" />
          </SelectTrigger>
          <SelectContent>
            {ORTHO_RED_FLAG_STATES.map((o) => (
              <SelectItem key={o} value={o} className="text-xs">
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.red_flag_state === ORTHO_RED_FLAG_STATES[1] && (
          <div className="grid gap-1.5 sm:grid-cols-2 pt-1">
            {ORTHO_RED_FLAGS.map((f) => {
              const active = state.red_flags.includes(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleRedFlag(f.key)}
                  aria-pressed={active}
                  className={`text-left text-[11px] rounded-md border px-2 py-1.5 leading-snug ${
                    active ? "border-destructive bg-destructive/10 text-destructive font-medium" : "border-border bg-card hover:bg-muted/60"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Presentations documented in this encounter</Label>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {ORTHO_TRAUMA_PRESENTATIONS.map((p) => {
            const active = state.presentations.includes(p.key);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => togglePresentation(p.key)}
                aria-pressed={active}
                className={`text-left text-[11px] rounded-md border px-2 py-1.5 leading-snug flex items-center justify-between gap-1.5 ${
                  active ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-card hover:bg-muted/60"
                }`}
              >
                <span>{p.label}</span>
                <span className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${LEVEL_CHIP[p.level]}`}>
                  {ORTHO_TRAUMA_LEVELS[p.level].label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {state.presentations.map((key) => {
        const spec = ORTHO_TRAUMA_MAP[key];
        if (!spec) return null;
        return (
          <PresentationCard
            key={key}
            spec={spec}
            block={state.blocks[key] || {}}
            update={(block) => updateBlock(key, block)}
          />
        );
      })}

      {issues.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 space-y-1">
          <p className="text-[11px] font-semibold text-destructive">Documentation still owed ({issues.length})</p>
          {issues.map((i) => (
            <p key={i.key} className="text-[11px] text-destructive leading-snug">
              — {i.message}
            </p>
          ))}
        </div>
      )}

      {refs.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">References applied to the presentations recorded here</p>
          {refs.map((r) => (
            <div key={r.key} className="text-[10px] text-muted-foreground leading-snug">
              <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="w-3 h-3" />
                {r.organization}
              </a>{" "}
              — {r.title}, {r.edition}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}