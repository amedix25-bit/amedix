import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, Info, Plus, Trash2 } from "lucide-react";
import {
  NEURO_CRITICAL_FINDINGS,
  NEURO_CRITICAL_FINDING_MAP,
  NEURO_ESCALATION_FIELDS,
  NEURO_ESCALATION_LEVELS,
  NEURO_ESCALATION_NOTICE,
  emptyNeuroEscalationEvent,
  neurologyEscalationIssues,
  neurologyEscalationState,
  neurologyEscalationSummary,
} from "@/lib/neurologyEscalation";

// Deterioration, critical-finding and escalation record.
//
// Every critical finding is kept with its timestamp, the observation before and at
// the change, who was informed and when, whether the escalation was acknowledged,
// the decision and its author, where the patient went and the reassessment that
// followed. Nothing is discarded: a blank required field prints as NOT DOCUMENTED
// and is listed as owed. Advisory only — it records the escalation made and never
// replaces the emergency call.

const TextField = ({ field, value, onChange }) => {
  const common = { value: value || "", onChange: (e) => onChange(e.target.value), className: "h-8 text-xs" };
  if (field.type === "textarea") {
    return (
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-[11px] text-muted-foreground">{field.label}</Label>
        <Textarea {...common} rows={2} className="text-xs min-h-[52px]" />
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">{field.label}</Label>
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
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{field.label}</Label>
      <Input {...common} placeholder={field.type === "time" ? "HH:MM" : ""} />
    </div>
  );
};

function EventCard({ event, index, onChange, onRemove }) {
  const spec = NEURO_CRITICAL_FINDING_MAP[event.finding_key];
  const level = spec ? NEURO_ESCALATION_LEVELS[spec.level] : null;

  return (
    <div className="rounded-lg border border-border p-2.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold text-foreground">Escalation {index + 1}</p>
          {spec && (
            <span className={`inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded ${level.chip}`}>
              {level.label}
            </span>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={onRemove}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[11px] text-muted-foreground">Critical finding or change</Label>
          <Select
            value={event.finding_key || undefined}
            onValueChange={(v) => onChange({ ...event, finding_key: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select the finding that prompted the escalation…" />
            </SelectTrigger>
            <SelectContent>
              {NEURO_CRITICAL_FINDINGS.map((f) => (
                <SelectItem key={f.key} value={f.key} className="text-xs">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {NEURO_ESCALATION_FIELDS.map((f) => (
          <TextField
            key={f.key}
            field={f}
            value={event[f.key]}
            onChange={(v) => onChange({ ...event, [f.key]: v })}
          />
        ))}
      </div>

      {spec && (
        <p className="text-[10px] text-muted-foreground leading-snug border-t border-border pt-1.5">
          Why this is recorded as critical: {spec.why}
        </p>
      )}
    </div>
  );
}

export default function NeurologyEscalationField({ value, onChange }) {
  const state = neurologyEscalationState(value);
  const set = (key, v) => onChange({ ...state, [key]: v });
  const setEvent = (index, event) =>
    onChange({ ...state, events: state.events.map((e, i) => (i === index ? event : e)) });
  const removeEvent = (index) => onChange({ ...state, events: state.events.filter((_, i) => i !== index) });
  const addEvent = () => onChange({ ...state, events: [...state.events, emptyNeuroEscalationEvent()] });

  const issues = neurologyEscalationIssues(state);
  const summary = neurologyEscalationSummary(state);
  const critical = issues.filter((i) => i.level === "immediate").length;

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-muted/30 p-2">
        <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Deterioration, critical findings and escalation
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{NEURO_ESCALATION_NOTICE}</p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-md bg-muted/30 border border-border p-2">
        <label className="flex items-center gap-1.5 text-[11px] text-foreground">
          <Checkbox
            checked={Boolean(state.none_documented)}
            onCheckedChange={(v) => set("none_documented", Boolean(v))}
          />
          No critical finding or escalation during this encounter
        </label>
        <label className="flex items-center gap-1.5 text-[11px] text-foreground">
          <Checkbox checked={Boolean(state.not_assessed)} onCheckedChange={(v) => set("not_assessed", Boolean(v))} />
          Not assessed at the time of this note
        </label>
      </div>

      {summary.total > 0 && (
        <div className="rounded-md border border-border p-2 flex flex-wrap items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] text-foreground">
            {summary.total} escalation record{summary.total === 1 ? "" : "s"} preserved with this note
          </span>
          {Object.entries(summary.byLevel)
            .filter(([, count]) => count > 0)
            .map(([level, count]) => (
              <span
                key={level}
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${NEURO_ESCALATION_LEVELS[level].chip}`}
              >
                {count} {NEURO_ESCALATION_LEVELS[level].label}
              </span>
            ))}
        </div>
      )}

      <div className="space-y-2">
        {state.events.map((event, index) => (
          <EventCard
            key={index}
            event={event}
            index={index}
            onChange={(e) => setEvent(index, e)}
            onRemove={() => removeEvent(index)}
          />
        ))}
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addEvent}>
          <Plus className="w-3.5 h-3.5" /> Record an escalation
        </Button>
      </div>

      {issues.length > 0 && (
        <div className="rounded-lg border border-border p-2.5 space-y-1.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> What this record still owes ({issues.length})
            {critical > 0 && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">{critical} urgent</span>}
          </p>
          <ul className="space-y-1">
            {issues.map((i) => (
              <li key={i.key} className="text-[11px] text-foreground leading-snug">
                <span className="text-[9px] font-semibold uppercase text-muted-foreground mr-1">[{i.level}]</span>
                {i.message}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground">
            These items are reported, not enforced: saving is never blocked and no finding is deleted. Documentation is
            written after the clinical action and may never delay it.
          </p>
        </div>
      )}
    </div>
  );
}