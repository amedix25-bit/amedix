import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Info, Pill, Plus, Trash2 } from "lucide-react";
import {
  NEURO_ALLERGY_STATES,
  NEURO_ADVERSE_ACTION_STATES,
  NEURO_CONTRAINDICATION_FACTS,
  NEURO_FREQUENCIES,
  NEURO_INTERACTION_REVIEW_STATES,
  NEURO_MED_CLASS_MAP,
  NEURO_MEDICATION_SPEC,
  NEURO_ROUTES,
  NEURO_TIMING,
  classifyNeuroDrug,
  detectedNeuroMedicationClasses,
  emptyNeuroMedicationEntry,
  neurologyMedicationIssues,
  neurologyMedicationsState,
} from "@/lib/neurologyMedications";

// Neurology medication, allergy, contraindication and interaction record.
//
// Every medicine is recorded with the dose actually given or prescribed, route,
// frequency, timing, indication, response and any adverse effect. The panel then
// reads what was documented — the allergy review, the fact statements, the other
// recorded medicines and the class-specific monitoring — and lists what is owed.
// Advisory only: it never prescribes, never calculates a dose and never decides that
// a medicine is safe.

const LEVEL_STYLE = {
  immediate: { chip: "bg-destructive/10 text-destructive", label: "ALERT" },
  documented: { chip: "bg-warning/10 text-warning", label: "RECORD" },
  advisory: { chip: "bg-info/10 text-info", label: "REVIEW" },
};

const field = (key, label, placeholder) => ({ key, label, placeholder });

const ENTRY_FIELDS = [
  field("dose", "Dose given or prescribed", "Exactly as given — e.g. 500 mg"),
  field("given_datetime", "Date and time given or prescribed", "e.g. 30/10/2026 14:20"),
  field("indication", "Indication", "Why this medicine, for this patient"),
];

const Row = ({ label, children }) => (
  <div className="space-y-1">
    <Label className="text-[11px] leading-snug text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const Picker = ({ value, options, placeholder, onChange }) => (
  <Select value={value || undefined} onValueChange={onChange}>
    <SelectTrigger className="h-8 text-xs">
      <SelectValue placeholder={placeholder || "Select…"} />
    </SelectTrigger>
    <SelectContent>
      {options.map((o) => (
        <SelectItem key={o} value={o} className="text-xs">
          {o}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

function EntryCard({ entry, index, onChange, onRemove }) {
  const set = (key, v) => onChange({ ...entry, [key]: v });
  const cls = NEURO_MED_CLASS_MAP[classifyNeuroDrug(entry.name)];

  return (
    <div className="rounded-lg border border-border p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-foreground">
          Medicine {index + 1}
          {cls && <span className="ml-1.5 font-normal text-muted-foreground">— {cls.label}</span>}
        </p>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={onRemove}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Row label="Medicine name">
          <Input
            value={entry.name || ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Generic name as given"
            className="h-8 text-xs"
          />
        </Row>
        {ENTRY_FIELDS.map((f) => (
          <Row key={f.key} label={f.label}>
            <Input
              value={entry[f.key] || ""}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="h-8 text-xs"
            />
          </Row>
        ))}
        <Row label="Route">
          <Picker value={entry.route} options={NEURO_ROUTES} onChange={(v) => set("route", v)} />
        </Row>
        <Row label="Frequency">
          <Picker value={entry.frequency} options={NEURO_FREQUENCIES} onChange={(v) => set("frequency", v)} />
        </Row>
        <Row label="Timing">
          <Picker value={entry.timing} options={NEURO_TIMING} onChange={(v) => set("timing", v)} />
        </Row>
        <Row label="Response observed">
          <Input
            value={entry.response || ""}
            onChange={(e) => set("response", e.target.value)}
            placeholder="What was observed, and when"
            className="h-8 text-xs"
          />
        </Row>
        <Row label="Time response assessed">
          <Input
            value={entry.response_datetime || ""}
            onChange={(e) => set("response_datetime", e.target.value)}
            placeholder="e.g. 14:45"
            className="h-8 text-xs"
          />
        </Row>
        <Row label="Adverse effect">
          <Input
            value={entry.adverse_effect || ""}
            onChange={(e) => set("adverse_effect", e.target.value)}
            placeholder="Recorded adverse effect, or leave blank if none observed"
            className="h-8 text-xs"
          />
        </Row>
        <Row label="Action taken for the adverse effect">
          <Picker
            value={entry.adverse_action}
            options={NEURO_ADVERSE_ACTION_STATES}
            onChange={(v) => set("adverse_action", v)}
          />
        </Row>
      </div>

      {cls && (
        <div className="rounded-md bg-muted/40 border border-border p-2">
          <p className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Monitoring for this class</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{cls.monitoring.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}

export default function NeurologyMedicationField({ value, onChange }) {
  const state = neurologyMedicationsState(value);
  const set = (key, v) => onChange({ ...state, [key]: v });
  const setFact = (key, v) => onChange({ ...state, facts: { ...state.facts, [key]: v } });
  const setClassReview = (key, patch) =>
    onChange({ ...state, class_reviews: { ...state.class_reviews, [key]: { ...(state.class_reviews[key] || {}), ...patch } } });
  const setEntry = (index, entry) =>
    onChange({ ...state, entries: state.entries.map((e, i) => (i === index ? entry : e)) });
  const removeEntry = (index) => onChange({ ...state, entries: state.entries.filter((_, i) => i !== index) });
  const addEntry = () => onChange({ ...state, entries: [...state.entries, emptyNeuroMedicationEntry()] });

  const issues = neurologyMedicationIssues(state);
  const alerts = issues.filter((i) => i.level === "immediate").length;
  const classes = detectedNeuroMedicationClasses(state);

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-muted/30 p-2">
        <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Pill className="w-3.5 h-3.5" /> {NEURO_MEDICATION_SPEC.title}
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{NEURO_MEDICATION_SPEC.note}</p>
      </div>

      {alerts > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground">
            {alerts} medication safety alert{alerts === 1 ? "" : "s"} raised from what this note recorded. They are listed
            below and printed with the note — none of them is dismissed by saving.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border p-2.5 space-y-2">
        <p className="text-xs font-semibold text-foreground">Allergy review</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Row label="Allergy status">
            <Picker value={state.allergy_status} options={NEURO_ALLERGY_STATES} onChange={(v) => set("allergy_status", v)} />
          </Row>
          <Row label="Allergens documented (as recorded)">
            <Input
              value={state.allergens || ""}
              onChange={(e) => set("allergens", e.target.value)}
              placeholder="Copy the allergens exactly as the record states them"
              className="h-8 text-xs"
            />
          </Row>
          <Row label="Review verified by">
            <Input
              value={state.allergy_verified_by || ""}
              onChange={(e) => set("allergy_verified_by", e.target.value)}
              placeholder="Name and role"
              className="h-8 text-xs"
            />
          </Row>
        </div>
        <p className="text-[10px] text-muted-foreground">
          A blank allergen list is recorded as not established, never as no allergy.
        </p>
      </div>

      <div className="rounded-lg border border-border p-2.5 space-y-2">
        <p className="text-xs font-semibold text-foreground">Contraindication screening</p>
        <p className="text-[10px] text-muted-foreground">
          State each fact explicitly. "Not documented" is reported as owed and is never read as absent.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {NEURO_CONTRAINDICATION_FACTS.map((f) => (
            <Row key={f.key} label={f.label}>
              <Picker value={state.facts[f.key]} options={["Yes", "No", "Not documented"]} onChange={(v) => setFact(f.key, v)} />
            </Row>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-foreground">Medicines recorded</p>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addEntry}>
            <Plus className="w-3.5 h-3.5" /> Add medicine
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 rounded-md bg-muted/30 border border-border p-2">
          <label className="flex items-center gap-1.5 text-[11px] text-foreground">
            <Checkbox
              checked={Boolean(state.no_medications)}
              onCheckedChange={(v) => set("no_medications", Boolean(v))}
            />
            No medicine given or prescribed in this encounter
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-foreground">
            <Checkbox checked={Boolean(state.not_assessed)} onCheckedChange={(v) => set("not_assessed", Boolean(v))} />
            Medication review not assessed at the time of this note
          </label>
        </div>

        {state.entries.map((entry, index) => (
          <EntryCard
            key={index}
            entry={entry}
            index={index}
            onChange={(e) => setEntry(index, e)}
            onRemove={() => removeEntry(index)}
          />
        ))}
      </div>

      {classes.length > 0 && (
        <div className="rounded-lg border border-border p-2.5 space-y-2">
          <p className="text-xs font-semibold text-foreground">Class safety review</p>
          {classes.map((cls) => {
            const review = state.class_reviews[cls.key] || {};
            return (
              <div key={cls.key} className="rounded-md border border-border p-2 space-y-1.5">
                <p className="text-[11px] font-medium text-foreground">{cls.label}</p>
                <div className="flex flex-wrap gap-2">
                  <Picker
                    value={review.reviewed}
                    options={["Yes", "No", "Not documented"]}
                    onChange={(v) => setClassReview(cls.key, { reviewed: v })}
                  />
                  <Input
                    value={review.note || ""}
                    onChange={(e) => setClassReview(cls.key, { note: e.target.value })}
                    placeholder="What was checked and decided"
                    className="h-8 text-xs flex-1 min-w-[180px]"
                  />
                </div>
                <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc pl-4">
                  {cls.focus.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-border p-2.5 space-y-2">
        <p className="text-xs font-semibold text-foreground">Interaction review</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Row label="Review performed">
            <Picker
              value={state.interactions_reviewed}
              options={NEURO_INTERACTION_REVIEW_STATES}
              onChange={(v) => set("interactions_reviewed", v)}
            />
          </Row>
          <Row label="Conclusion">
            <Input
              value={state.interactions_conclusion || ""}
              onChange={(e) => set("interactions_conclusion", e.target.value)}
              placeholder="What was found and what was decided"
              className="h-8 text-xs"
            />
          </Row>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="rounded-lg border border-border p-2.5 space-y-1.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Alerts and what this record still owes ({issues.length})
          </p>
          <ul className="space-y-1">
            {issues.map((i) => {
              const style = LEVEL_STYLE[i.level] || LEVEL_STYLE.advisory;
              return (
                <li key={i.key} className="flex items-start gap-1.5">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${style.chip} shrink-0 mt-0.5`}>
                    {style.label}
                  </span>
                  <span className="text-[11px] text-foreground leading-snug">{i.message}</span>
                </li>
              );
            })}
          </ul>
          <p className="text-[10px] text-muted-foreground">
            Advisory only. The prescriber and pharmacist verify every dose, contraindication and interaction against the
            current product label; nothing here decides that a medicine is safe.
          </p>
        </div>
      )}
    </div>
  );
}