import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Bone, ExternalLink } from "lucide-react";
import {
  ORTHO_HEALING_CLINICAL_SIGNS,
  ORTHO_HEALING_RADIOGRAPHIC_SIGNS,
  ORTHO_HEALING_STATES,
  ORTHO_HEALING_STATE_MAP,
  orthoHealingIssues,
  orthoHealingReferences,
  orthoHealingState,
} from "@/lib/orthopedicsManagement";

// Fracture-healing assessment panel.
//
// Healing is recorded as an explicit state. Nothing is preselected, "united" is
// never assumed because time has passed, and delayed union, nonunion and malunion
// cannot be recorded without the interval, the films compared and the signs that
// support the statement. The definition shown is the one the printed record
// carries, so the state can never be read differently from what was meant.

const toggleLine = (text, line) => {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const next = lines.includes(line) ? lines.filter((l) => l !== line) : [...lines, line];
  return next.join("\n");
};

const hasLine = (text, line) =>
  String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .includes(line);

function SignChips({ label, signs, text, onChange }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] leading-snug">{label}</Label>
      <div className="flex flex-wrap gap-1">
        {signs.map((s) => {
          const active = hasLine(text, s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(toggleLine(text, s))}
              aria-pressed={active}
              className={`text-[10px] rounded border px-1.5 py-0.5 leading-snug ${
                active ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-card text-foreground hover:bg-muted/60"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
      <Textarea value={text || ""} onChange={(e) => onChange(e.target.value)} rows={2} className="text-xs min-h-[52px]" />
    </div>
  );
}

export default function OrthopedicsHealingField({ value, onChange }) {
  const v = orthoHealingState(value);
  const spec = ORTHO_HEALING_STATE_MAP[v.stateKey];
  const issues = orthoHealingIssues(v);
  const refs = orthoHealingReferences(v);

  const set = (patch) => onChange({ ...v, ...patch });

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
        <p className="text-xs font-medium flex items-center gap-1.5 text-primary">
          <Bone className="w-3.5 h-3.5" /> Fracture healing assessment
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          Healing is recorded, never assumed: an unassessed fracture is recorded as not assessable, and delayed union,
          nonunion or malunion requires the interval, the films compared and the signs that support it.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[11px]">Healing state</Label>
          <Select value={v.ortho_healing_state || undefined} onValueChange={(val) => set({ ortho_healing_state: val })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Record the state at this assessment…" />
            </SelectTrigger>
            <SelectContent>
              {ORTHO_HEALING_STATES.map((s) => (
                <SelectItem key={s.key} value={s.label} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Interval from injury or surgery</Label>
          <Input
            value={v.ortho_healing_interval || ""}
            onChange={(e) => set({ ortho_healing_interval: e.target.value })}
            placeholder="e.g. 12 weeks"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Radiographs at this assessment</Label>
          <Select value={v.ortho_healing_radiograph || undefined} onValueChange={(val) => set({ ortho_healing_radiograph: val })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {["Reviewed by the treating clinician", "Reported — not yet reviewed", "Pending", "Not performed"].map((o) => (
                <SelectItem key={o} value={o} className="text-xs">
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[11px]">Compared with</Label>
          <Input
            value={v.ortho_healing_comparison || ""}
            onChange={(e) => set({ ortho_healing_comparison: e.target.value })}
            placeholder="Date of the previous film and what changed"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <SignChips
          label="Clinical signs at the fracture site"
          signs={ORTHO_HEALING_CLINICAL_SIGNS}
          text={v.ortho_healing_clinical || ""}
          onChange={(t) => set({ ortho_healing_clinical: t })}
        />
        <SignChips
          label="Radiographic signs"
          signs={ORTHO_HEALING_RADIOGRAPHIC_SIGNS}
          text={v.ortho_healing_radiographic || ""}
          onChange={(t) => set({ ortho_healing_radiographic: t })}
        />
      </div>

      {spec && (
        <div className="rounded-md border border-border bg-muted/30 p-2 space-y-1">
          <p className="text-[11px] font-medium text-foreground">{spec.label} — definition applied</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{spec.definition}</p>
        </div>
      )}

      {spec && spec.requiresJustification && (
        <div className="space-y-1">
          <Label className="text-[11px]">Justification for this state</Label>
          <Textarea
            value={v.ortho_healing_justification || ""}
            onChange={(e) => set({ ortho_healing_justification: e.target.value })}
            rows={2}
            className="text-xs min-h-[52px]"
            placeholder="The interval, the films compared, the clinical and radiographic signs — and what happens next"
          />
          {!String(v.ortho_healing_justification || "").trim() && (
            <p className="text-[11px] text-destructive">
              This state cannot be recorded without its justification.
            </p>
          )}
        </div>
      )}

      {issues.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 space-y-1">
          <p className="text-[11px] font-semibold text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Documentation still owed
          </p>
          {issues.map((i) => (
            <p key={i.key} className="text-[11px] text-destructive leading-snug">
              — {i.message}
            </p>
          ))}
        </div>
      )}

      {refs.length > 0 && (
        <div className="space-y-0.5">
          {refs.map((r) => (
            <p key={r.key} className="text-[10px] text-muted-foreground leading-snug">
              <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="w-3 h-3" />
                {r.organization}
              </a>{" "}
              — {r.title}, {r.edition}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}