import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

export function MedicalListSection({
  id, title, description, entries, entryLabel, onRemove, noneChecked, onNoneChange, noneLabel, children,
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      <div className="flex items-center gap-2 mt-3">
        <Checkbox id={id} checked={noneChecked} onCheckedChange={onNoneChange} disabled={entries.length > 0} />
        <Label htmlFor={id} className="text-sm font-normal text-muted-foreground">{noneLabel}</Label>
      </div>
      {!noneChecked && (
        <div className="mt-4 space-y-3">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-muted px-3 py-2">
              <p className="text-sm">{entryLabel(entry)}</p>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {children}
        </div>
      )}
    </div>
  );
}

export function ConditionEntryForm({ onAdd }) {
  const [form, setForm] = useState({ name: "", date: "", details: "" });
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const add = () => {
    onAdd(form);
    setForm({ name: "", date: "", details: "" });
  };
  return (
    <div className="grid sm:grid-cols-[2fr_1fr_2fr_auto] gap-2">
      <Input placeholder="Condition, e.g. Hypertension" value={form.name} onChange={set("name")} />
      <Input type="date" value={form.date} onChange={set("date")} />
      <Input placeholder="Details (optional)" value={form.details} onChange={set("details")} />
      <Button type="button" variant="outline" onClick={add} disabled={!form.name}>
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function MedicationEntryForm({ onAdd }) {
  const [form, setForm] = useState({ name: "", dose: "", frequency: "", route: "oral", start_date: "", reason: "" });
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const add = () => {
    onAdd(form);
    setForm({ name: "", dose: "", frequency: "", route: "oral", start_date: "", reason: "" });
  };
  return (
    <div className="grid sm:grid-cols-3 gap-2">
      <Input placeholder="Medication name *" value={form.name} onChange={set("name")} />
      <Input placeholder="Dose, e.g. 500 mg" value={form.dose} onChange={set("dose")} />
      <Input placeholder="Frequency, e.g. Twice daily" value={form.frequency} onChange={set("frequency")} />
      <Select value={form.route} onValueChange={(v) => setForm((s) => ({ ...s, route: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {["oral", "intravenous", "intramuscular", "subcutaneous", "topical", "inhalation", "rectal", "other"].map((r) => (
            <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input type="date" value={form.start_date} onChange={set("start_date")} />
      <Input placeholder="Reason for use" value={form.reason} onChange={set("reason")} />
      <Button type="button" variant="outline" onClick={add} disabled={!form.name}>
        <Plus className="w-4 h-4 mr-1" />
        Add
      </Button>
    </div>
  );
}

export function AllergyEntryForm({ onAdd }) {
  const [form, setForm] = useState({ allergen: "", allergy_type: "drug", reaction: "", severity: "mild" });
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const add = () => {
    onAdd(form);
    setForm({ allergen: "", allergy_type: "drug", reaction: "", severity: "mild" });
  };
  return (
    <div className="grid sm:grid-cols-[2fr_1fr_2fr_1fr_auto] gap-2">
      <Input placeholder="Allergen, e.g. Penicillin *" value={form.allergen} onChange={set("allergen")} />
      <Select value={form.allergy_type} onValueChange={(v) => setForm((s) => ({ ...s, allergy_type: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="drug">Drug</SelectItem>
          <SelectItem value="food">Food</SelectItem>
          <SelectItem value="environmental">Environmental</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder="Reaction, e.g. Rash" value={form.reaction} onChange={set("reaction")} />
      <Select value={form.severity} onValueChange={(v) => setForm((s) => ({ ...s, severity: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="mild">Mild</SelectItem>
          <SelectItem value="moderate">Moderate</SelectItem>
          <SelectItem value="severe">Severe</SelectItem>
        </SelectContent>
      </Select>
      <Button type="button" variant="outline" onClick={add} disabled={!form.allergen}>
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function SurgeryEntryForm({ onAdd }) {
  const [form, setForm] = useState({
    surgery_type: "", surgery_date: "", reason: "", complications: "", outcome: "", hospitalization_duration: "",
  });
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const add = () => {
    onAdd(form);
    setForm({ surgery_type: "", surgery_date: "", reason: "", complications: "", outcome: "", hospitalization_duration: "" });
  };
  return (
    <div className="grid sm:grid-cols-3 gap-2">
      <Input placeholder="Type of surgery, e.g. Appendectomy *" value={form.surgery_type} onChange={set("surgery_type")} />
      <Input type="date" value={form.surgery_date} onChange={set("surgery_date")} />
      <Input placeholder="Reason / indication" value={form.reason} onChange={set("reason")} />
      <Input placeholder="Complications" value={form.complications} onChange={set("complications")} />
      <Input placeholder="Recovery / outcome" value={form.outcome} onChange={set("outcome")} />
      <div className="flex gap-2">
        <Input placeholder="Hospital stay, e.g. 3 days" value={form.hospitalization_duration} onChange={set("hospitalization_duration")} />
        <Button type="button" variant="outline" onClick={add} disabled={!form.surgery_type}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}