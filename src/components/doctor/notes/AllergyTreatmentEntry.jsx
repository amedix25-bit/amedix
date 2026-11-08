import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import {
  AGE_GROUPS,
  TREATMENT_CLASS_MAP,
  TREATMENT_STATUSES,
} from "@/lib/allergyTreatment";
import { referenceKeysFor } from "@/lib/clinicalReferences";
import { REFERENCE_STATUS, referenceStatusLabel } from "@/lib/clinicalReferences";

// One documented treatment. Adult and paediatric dosing are recorded separately
// and are typed by the clinician: AMedix performs no calculation, no conversion
// and no suggestion. Every field here is documentation.
export default function AllergyTreatmentEntry({ entry, index, onChange, onRemove }) {
  const cls = TREATMENT_CLASS_MAP[entry.treatment_class] || {};
  const refs = referenceKeysFor(entry.reference_keys || []);
  const set = (patch) => onChange(index, patch);

  return (
    <div className="rounded-lg border border-border p-3 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{cls.label || entry.treatment_class}</p>
          {cls.indication && <p className="text-[11px] text-muted-foreground mt-0.5">{cls.indication}</p>}
        </div>
        <button type="button" onClick={() => onRemove(index)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Agent / preparation</Label>
          <Input value={entry.agent} placeholder="As documented" onChange={(e) => set({ agent: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Route</Label>
          <Input value={entry.route} placeholder="e.g. oral, intranasal, inhaled, IM" onChange={(e) => set({ route: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={entry.status} onValueChange={(v) => set({ status: v })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {TREATMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">
          Indication for this treatment <span className="text-muted-foreground">· required for a complete record</span>
        </Label>
        <Textarea rows={2} value={entry.indication} placeholder="Why this treatment, for this patient, at this visit" onChange={(e) => set({ indication: e.target.value })} />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Age group covered by this plan</Label>
        <Select value={entry.age_group} onValueChange={(v) => set({ age_group: v })}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Age group" /></SelectTrigger>
          <SelectContent>
            {AGE_GROUPS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-2.5 space-y-2">
        <p className="text-[11px] font-medium">Adult dosing — as decided by the treating clinician</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Dose</Label>
            <Input value={entry.adult_dose} placeholder="Documented dose" onChange={(e) => set({ adult_dose: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Frequency</Label>
            <Input value={entry.adult_frequency} onChange={(e) => set({ adult_frequency: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duration</Label>
            <Input value={entry.adult_duration} onChange={(e) => set({ adult_duration: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-2.5 space-y-2">
        <p className="text-[11px] font-medium">Paediatric dosing — recorded separately, never calculated</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Dose</Label>
            <Input value={entry.paediatric_dose} placeholder="Documented dose" onChange={(e) => set({ paediatric_dose: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Age band</Label>
            <Input value={entry.paediatric_age_band} placeholder="e.g. 2–5 years" onChange={(e) => set({ paediatric_age_band: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Weight basis used</Label>
            <Input value={entry.paediatric_weight_basis} placeholder="Weight documented by the clinician" onChange={(e) => set({ paediatric_weight_basis: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Frequency</Label>
            <Input value={entry.paediatric_frequency} onChange={(e) => set({ paediatric_frequency: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duration</Label>
            <Input value={entry.paediatric_duration} onChange={(e) => set({ paediatric_duration: e.target.value })} />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          AMedix performs no weight-based calculation or conversion. The basis is recorded so the dose can be audited.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Monitoring plan</Label>
          <Textarea rows={2} value={entry.monitoring} onChange={(e) => set({ monitoring: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cautions documented</Label>
          <Textarea rows={2} value={entry.cautions} onChange={(e) => set({ cautions: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Clinician rationale</Label>
          <Input value={entry.rationale} placeholder="Why this choice, and what was considered instead" onChange={(e) => set({ rationale: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Review date</Label>
          <Input type="date" value={entry.review_date} onChange={(e) => set({ review_date: e.target.value })} />
        </div>
      </div>

      {refs.length > 0 && (
        <div className="rounded-md bg-muted/40 p-2 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">Guidance for this class</p>
          {refs.map((r) => (
            <p key={r.key} className="text-[10px] text-muted-foreground">
              {r.issuing_organization} — {r.title} ({r.version || "edition not stated"}); checked {r.last_verified_date};
              status {referenceStatusLabel(r.status)}
              {r.status !== REFERENCE_STATUS.CURRENT ? " — not current, confirm before relying" : ""}
            </p>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" size="sm" variant="outline" onClick={() => onRemove(index)}>
          Remove
        </Button>
      </div>
    </div>
  );
}