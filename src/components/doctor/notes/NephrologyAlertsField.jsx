import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { AlertTriangle, BellRing, Info, ShieldCheck } from "lucide-react";
import { buildNephAlerts } from "@/lib/nephAlerts";

// Safety prompts for the Nephrology notes.
//
// Every prompt below is generated from a value the clinician has already
// documented, at a published threshold that is shown with the prompt. Nothing
// is calculated from an assumption, and an empty list is never reassurance —
// it says so. The prompts assist a decision; they do not diagnose, prescribe,
// order tests, or delay urgent care.

const Chip = ({ level }) => (
  <span
    className={
      level === "urgent"
        ? "inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive"
        : "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
    }
  >
    {level === "urgent" ? <AlertTriangle className="w-3 h-3" /> : <BellRing className="w-3 h-3" />}
    {level === "urgent" ? "Same-day" : "Follow-up"}
  </span>
);

const AlertRow = ({ alert, action, onAction }) => (
  <div className="rounded-lg border border-border bg-background p-2.5 space-y-1.5">
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs font-medium text-foreground leading-snug">{alert.label}</p>
      <Chip level={alert.level} />
    </div>
    <p className="text-[11px] text-muted-foreground leading-relaxed">{alert.basis}</p>
    <Input
      value={action || ""}
      onChange={(e) => onAction(e.target.value)}
      placeholder="Action taken, timing and who was contacted"
      className="h-8 text-xs"
    />
    {alert.level === "urgent" && !String(action || "").trim() && (
      <p className="text-[11px] text-destructive">No action documented yet for an urgent prompt.</p>
    )}
  </div>
);

export default function NephrologyAlertsField({ value, values, onChange }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const actions = safe.actions || {};
  const alerts = buildNephAlerts(values || {});
  const urgent = alerts.filter((a) => a.level === "urgent");
  const routine = alerts.filter((a) => a.level === "routine");
  const unresolved = urgent.filter((a) => !String(actions[a.key] || "").trim()).length;

  const setAction = (key, text) => onChange({ ...safe, actions: { ...actions, [key]: text } });

  // The prompts that fired are stored WITH the note, so the saved record and
  // the PDF show exactly what the clinician was shown — not a recalculation
  // from values that may later be edited.
  const resolved = alerts.map((a) => ({ key: a.key, level: a.level, label: a.label, basis: a.basis }));
  const signature = JSON.stringify(resolved);
  const stored = JSON.stringify(safe.resolved || []);
  useEffect(() => {
    if (signature !== stored) onChange({ ...safe, resolved });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
        <p className="text-xs font-medium flex items-center gap-1.5 text-primary">
          <ShieldCheck className="w-3.5 h-3.5" /> Decision support — never a substitute for clinical judgement
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          Prompts are generated only from the values documented in this note, at the published thresholds shown with
          each one. They do not diagnose, prescribe, stop a medicine or order a test, and they must never delay urgent
          care: if the patient is unwell, act first and document afterwards.
        </p>
      </div>

      {alerts.length === 0 && (
        <div className="rounded-lg border border-border bg-muted/40 p-2.5 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            No prompt is triggered by the values documented so far. That is not a statement that no urgent problem
            exists — document the creatinine, potassium, bicarbonate, urine output, volume status and any suspected
            obstruction or access problem.
          </p>
        </div>
      )}

      {urgent.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-destructive">
            Urgent prompts ({urgent.length}
            {unresolved ? `, ${unresolved} without a documented action` : ""})
          </p>
          {urgent.map((a) => (
            <AlertRow key={a.key} alert={a} action={actions[a.key]} onAction={(t) => setAction(a.key, t)} />
          ))}
        </div>
      )}

      {routine.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Routine follow-up reminders ({routine.length})</p>
          {routine.map((a) => (
            <AlertRow key={a.key} alert={a} action={actions[a.key]} onAction={(t) => setAction(a.key, t)} />
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Other urgent concern identified clinically</Label>
          <Textarea
            rows={2}
            value={safe.other_concern || ""}
            onChange={(e) => onChange({ ...safe, other_concern: e.target.value })}
            placeholder="Any urgent concern the documented values do not capture"
            className="text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Escalation documented — who, when, outcome</Label>
          <Textarea
            rows={2}
            value={safe.escalation || ""}
            onChange={(e) => onChange({ ...safe, escalation: e.target.value })}
            placeholder="e.g. Urology registrar contacted 14:20 — ureteric stent arranged"
            className="text-xs"
          />
        </div>
      </div>
    </div>
  );
}