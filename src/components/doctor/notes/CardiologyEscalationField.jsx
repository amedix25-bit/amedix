import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Info, Siren } from "lucide-react";
import {
  CARDIOLOGY_ESCALATION_TRIGGERS,
  NO_DELAY_STATEMENT,
  escalationGaps,
  triggersFor,
} from "@/lib/cardiologyEscalation";

// Escalation record for a time-critical cardiology presentation. The clinician
// selects what actually happened; the component then shows the guideline basis
// for its urgency and asks for the timing and the response. Nothing is
// auto-selected, nothing blocks saving, and nothing delays treatment.
export default function CardiologyEscalationField({ value, onChange }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const set = (key, v) => onChange({ ...safe, [key]: v });
  const triggers = Array.isArray(safe.triggers) ? safe.triggers : [];
  const selected = triggersFor(triggers);
  const gaps = escalationGaps(safe);

  const toggle = (key) =>
    set("triggers", triggers.includes(key) ? triggers.filter((k) => k !== key) : [...triggers, key]);

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-muted/30 p-2">
        <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Siren className="w-3.5 h-3.5" /> Escalation and time-critical pathway
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
          Select only what happened in this encounter. The record documents the escalation that was made — it is
          advisory and never a substitute for clinical judgement.
        </p>
      </div>

      <div className="rounded-lg border border-border p-2.5 space-y-1.5">
        <p className="text-xs font-semibold text-foreground">Trigger documented in this encounter</p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {CARDIOLOGY_ESCALATION_TRIGGERS.map((t) => (
            <label key={t.key} className="flex items-start gap-1.5 text-[11px] leading-snug cursor-pointer">
              <Checkbox
                checked={triggers.includes(t.key)}
                onCheckedChange={() => toggle(t.key)}
                className="mt-0.5 h-3.5 w-3.5"
              />
              <span>
                {t.label}
                <span
                  className={
                    t.urgency === "Immediate"
                      ? "ml-1 text-destructive font-medium"
                      : "ml-1 text-muted-foreground"
                  }
                >
                  · {t.urgency}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <>
          <div className="rounded-lg border border-border p-2.5 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Recognised at</Label>
                <Input
                  type="time"
                  value={safe.recognised_time || ""}
                  onChange={(e) => set("recognised_time", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Escalation time</Label>
                <Input
                  type="time"
                  value={safe.escalation_time || ""}
                  onChange={(e) => set("escalation_time", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[11px] text-muted-foreground">Escalated to (name and role)</Label>
                <Input
                  value={safe.escalated_to || ""}
                  onChange={(e) => set("escalated_to", e.target.value)}
                  placeholder="Senior cardiologist, critical care, cath lab, receiving team"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[11px] text-muted-foreground">Treatment before and during escalation</Label>
                <Textarea
                  value={safe.treatment_delivered || ""}
                  onChange={(e) => set("treatment_delivered", e.target.value)}
                  rows={2}
                  className="text-xs"
                  placeholder="What was given or done, with times — recorded after treatment, never before it"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Monitoring in place</Label>
                <Textarea
                  value={safe.monitoring || ""}
                  onChange={(e) => set("monitoring", e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Response and outcome</Label>
                <Textarea
                  value={safe.response || ""}
                  onChange={(e) => set("response", e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[11px] text-muted-foreground">Referral, transfer or follow-up arranged</Label>
                <Input
                  value={safe.referral || ""}
                  onChange={(e) => set("referral", e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Cath lab activation, transfer, admission, clinic"
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/30 p-2 space-y-1.5">
            <p className="text-[11px] font-medium text-foreground">Guideline basis for the urgency</p>
            {selected.map((t) => (
              <div key={t.key} className="text-[11px] leading-snug">
                <p className="font-medium text-foreground">{t.label}</p>
                <p className="text-muted-foreground">{t.why}</p>
                <p className="text-muted-foreground">{t.record}</p>
                {t.source && (
                  <p className="text-[10px] text-muted-foreground">
                    {t.source.organization} — {t.source.title} ({t.source.version})
                  </p>
                )}
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground">{NO_DELAY_STATEMENT}</p>
          </div>

          {gaps.length > 0 && (
            <div className="rounded-md border border-border p-2 space-y-1">
              {gaps.map((g, i) => (
                <p key={i} className="text-[11px] flex items-start gap-1.5 leading-snug">
                  {g.level === "error" ? (
                    <AlertTriangle className="w-3 h-3 mt-0.5 text-destructive shrink-0" />
                  ) : (
                    <Info className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <span className={g.level === "error" ? "text-destructive font-medium" : "text-muted-foreground"}>
                    {g.message}
                  </span>
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}