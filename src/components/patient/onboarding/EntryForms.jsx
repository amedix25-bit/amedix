import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { MED_ROUTES, MEAL_OPTIONS, routeLabel } from "@/lib/medicationUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";

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
  const { t } = usePatientLanguage();
  const [form, setForm] = useState({ name: "", date: "", details: "" });
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const add = () => {
    onAdd(form);
    setForm({ name: "", date: "", details: "" });
  };
  return (
    <div className="grid sm:grid-cols-[2fr_1fr_2fr_auto] gap-2">
      <Input placeholder={t("Condition, e.g. Hypertension")} value={form.name} onChange={set("name")} />
      <Input type="date" value={form.date} onChange={set("date")} />
      <Input placeholder={t("Details (optional)")} value={form.details} onChange={set("details")} />
      <Button type="button" variant="outline" onClick={add} disabled={!form.name}>
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function MedicationEntryForm({ onAdd }) {
  const { t } = usePatientLanguage();
  const EMPTY = { name: "", dose: "", frequency: "", route: "oral", meal_timing: "", duration: "", patient_notes: "", start_date: "" };
  const [form, setForm] = useState(EMPTY);
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const add = () => {
    onAdd(form);
    setForm(EMPTY);
  };
  return (
    <div className="grid sm:grid-cols-3 gap-2">
      <Input placeholder={`${t("Medication name")} *`} value={form.name} onChange={set("name")} />
      <Input placeholder={t("Dose, e.g. 500 mg")} value={form.dose} onChange={set("dose")} />
      <Select value={form.route} onValueChange={(v) => setForm((s) => ({ ...s, route: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {MED_ROUTES.map((r) => (
            <SelectItem key={r} value={r}>{t(routeLabel(r))}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input placeholder={t("Frequency, e.g. Twice daily")} value={form.frequency} onChange={set("frequency")} />
      <Select value={form.meal_timing} onValueChange={(v) => setForm((s) => ({ ...s, meal_timing: v }))}>
        <SelectTrigger><SelectValue placeholder={t("Before / after meals")} /></SelectTrigger>
        <SelectContent>
          {MEAL_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{t(o.label)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input placeholder={t("Duration, e.g. 14 days")} value={form.duration} onChange={set("duration")} />
      <Input placeholder={t("Additional notes")} value={form.patient_notes} onChange={set("patient_notes")} />
      <Input type="date" value={form.start_date} onChange={set("start_date")} />
      <Button type="button" variant="outline" onClick={add} disabled={!form.name}>
        <Plus className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Add")}
      </Button>
    </div>
  );
}

export function AllergyEntryForm({ onAdd }) {
  const { t } = usePatientLanguage();
  const [form, setForm] = useState({ allergen: "", allergy_type: "drug", reaction: "", severity: "mild" });
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const add = () => {
    onAdd(form);
    setForm({ allergen: "", allergy_type: "drug", reaction: "", severity: "mild" });
  };
  return (
    <div className="grid sm:grid-cols-[2fr_1fr_2fr_1fr_auto] gap-2">
      <Input placeholder={`${t("Allergen, e.g. Penicillin")} *`} value={form.allergen} onChange={set("allergen")} />
      <Select value={form.allergy_type} onValueChange={(v) => setForm((s) => ({ ...s, allergy_type: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="drug">{t("Drug")}</SelectItem>
          <SelectItem value="food">{t("Food")}</SelectItem>
          <SelectItem value="environmental">{t("Environmental")}</SelectItem>
          <SelectItem value="other">{t("Other")}</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder={t("Reaction, e.g. Rash")} value={form.reaction} onChange={set("reaction")} />
      <Select value={form.severity} onValueChange={(v) => setForm((s) => ({ ...s, severity: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="mild">{t("Mild")}</SelectItem>
          <SelectItem value="moderate">{t("Moderate")}</SelectItem>
          <SelectItem value="severe">{t("Severe")}</SelectItem>
        </SelectContent>
      </Select>
      <Button type="button" variant="outline" onClick={add} disabled={!form.allergen}>
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function SurgeryEntryForm({ onAdd }) {
  const { t } = usePatientLanguage();
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
      <Input placeholder={`${t("Type of surgery, e.g. Appendectomy")} *`} value={form.surgery_type} onChange={set("surgery_type")} />
      <Input type="date" value={form.surgery_date} onChange={set("surgery_date")} />
      <Input placeholder={t("Reason / indication")} value={form.reason} onChange={set("reason")} />
      <Input placeholder={t("Complications")} value={form.complications} onChange={set("complications")} />
      <Input placeholder={t("Recovery / outcome")} value={form.outcome} onChange={set("outcome")} />
      <div className="flex gap-2">
        <Input placeholder={t("Hospital stay, e.g. 3 days")} value={form.hospitalization_duration} onChange={set("hospitalization_duration")} />
        <Button type="button" variant="outline" onClick={add} disabled={!form.surgery_type}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}