import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Pill, Plus, X } from "lucide-react";
import {
  NEPH_CONTRAINDICATION_CHECK,
  NEPH_INTERACTION_CHECK,
  NEPH_RENAL_ADJUSTMENT,
  NEPH_RESPONSE,
  NEPH_ROUTES,
  newNephMedRow,
} from "@/lib/nephMedications";

// Structured medication review for the Nephrology notes. It records the
// clinician's decision with its renal-dosing, contraindication, interaction and
// monitoring requirements — it never prescribes, calculates a dose or stops a
// medicine. Prescribing stays in the AMedix prescription module.

const Field = ({ label, children, className = "" }) => (
  <div className={`space-y-1 ${className}`}>
    <Label className="text-[11px] text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const Picker = ({ value, onChange, options, placeholder = "Select..." }) => (
  <Select value={value || undefined} onValueChange={onChange}>
    <SelectTrigger className="h-8 text-xs">
      <SelectValue placeholder={placeholder} />
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

export default function NephMedicationsField({ value, onChange }) {
  const rows = Array.isArray(value) ? value : [];
  const update = (index, patch) => onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
        <p className="text-xs font-medium flex items-center gap-1.5 text-primary">
          <Info className="w-3.5 h-3.5" /> Documentation — not a prescription
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          Record the therapy decision and its renal considerations here. This does not prescribe, adjust a dose,
          discontinue a medicine or replace the AMedix prescription module, which re-checks the medication list and
          allergies.
        </p>
      </div>

      {rows.map((row, index) => (
        <div key={row.id || index} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-primary" /> {row.name || "New medication"}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            <Field label="Medication" className="sm:col-span-2">
              <Input
                value={row.name || ""}
                onChange={(e) => update(index, { name: e.target.value })}
                placeholder="Agent (generic name)"
                className="h-8 text-xs"
              />
            </Field>
            <Field label="Dose">
              <Input
                value={row.dose || ""}
                onChange={(e) => update(index, { dose: e.target.value })}
                placeholder="e.g. 20 mg"
                className="h-8 text-xs"
              />
            </Field>
            <Field label="Route">
              <Picker value={row.route} onChange={(v) => update(index, { route: v })} options={NEPH_ROUTES} />
            </Field>
            <Field label="Frequency">
              <Input
                value={row.frequency || ""}
                onChange={(e) => update(index, { frequency: e.target.value })}
                placeholder="e.g. once daily"
                className="h-8 text-xs"
              />
            </Field>
            <Field label="Indication" className="sm:col-span-3">
              <Input
                value={row.indication || ""}
                onChange={(e) => update(index, { indication: e.target.value })}
                placeholder="Why this patient is on it"
                className="h-8 text-xs"
              />
            </Field>
            <Field label="Renal dose consideration" className="sm:col-span-2">
              <Picker
                value={row.renal_adjustment}
                onChange={(v) => update(index, { renal_adjustment: v })}
                options={NEPH_RENAL_ADJUSTMENT}
              />
            </Field>
            <Field label="Renal dosing — detail" className="sm:col-span-2">
              <Input
                value={row.renal_adjustment_note || ""}
                onChange={(e) => update(index, { renal_adjustment_note: e.target.value })}
                placeholder="Dose used and the eGFR it was set for"
                className="h-8 text-xs"
              />
            </Field>
            <Field label="Contraindications" className="sm:col-span-2">
              <Picker
                value={row.contraindication_check}
                onChange={(v) => update(index, { contraindication_check: v })}
                options={NEPH_CONTRAINDICATION_CHECK}
              />
            </Field>
            <Field label="Interactions" className="sm:col-span-2">
              <Picker
                value={row.interaction_check}
                onChange={(v) => update(index, { interaction_check: v })}
                options={NEPH_INTERACTION_CHECK}
              />
            </Field>
            <Field label="Monitoring required" className="sm:col-span-2">
              <Input
                value={row.monitoring || ""}
                onChange={(e) => update(index, { monitoring: e.target.value })}
                placeholder="e.g. potassium and creatinine in 2 weeks"
                className="h-8 text-xs"
              />
            </Field>
            <Field label="Response">
              <Picker value={row.response} onChange={(v) => update(index, { response: v })} options={NEPH_RESPONSE} />
            </Field>
            <Field label="Review date">
              <Input
                type="date"
                value={row.review_date || ""}
                onChange={(e) => update(index, { review_date: e.target.value })}
                className="h-8 text-xs"
              />
            </Field>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => onChange([...rows, newNephMedRow()])}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add medication
      </Button>
    </div>
  );
}