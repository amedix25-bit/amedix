import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { MED_ROUTES, MEAL_OPTIONS, routeLabel } from "@/lib/medicationUtils";
import { AR_CONDITION_TERMS, AR_SURGERY_TERMS, ARABIC_REGEX } from "@/lib/arabicMedicalTerms";
import { usePatientLanguage } from "@/lib/patientLanguage";
import ArabicMedicalInput from "./ArabicMedicalInput";

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
  const { t, isArabic } = usePatientLanguage();
  const [form, setForm] = useState({ name: "", name_en: "", name_ar: "", date: "", details: "" });
  const set = (f) => (e) =>
    setForm((s) => ({
      ...s,
      [f]: e.target.value,
      ...(f === "name" ? { name_en: "", name_ar: "" } : {}),
    }));
  // Selecting a suggestion maps the concept to the standardized English term
  // (stored on the record for the Doctor Portal) while the patient sees the
  // standardized Arabic term, which is preserved as name_ar.
  const selectTerm = (term) =>
    setForm((s) => ({
      ...s,
      name: isArabic ? term.ar : term.en,
      name_en: term.en,
      name_ar: isArabic ? term.ar : "",
    }));
  const add = () => {
    onAdd({
      name: form.name_en || form.name,
      ...(form.name_ar ? { name_ar: form.name_ar } : {}),
      date: form.date,
      details: form.details,
    });
    setForm({ name: "", name_en: "", name_ar: "", date: "", details: "" });
  };
  return (
    <div className="grid sm:grid-cols-[2fr_1fr_2fr_auto] gap-2">
      <ArabicMedicalInput
        value={form.name}
        onChange={set("name")}
        onSelectTerm={selectTerm}
        placeholder={t("Condition, e.g. Hypertension")}
        terms={AR_CONDITION_TERMS}
      />
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
  // Medication names are English-only — Arabic entries are rejected.
  const [medError, setMedError] = useState("");
  const set = (f) => (e) => {
    setForm((s) => ({ ...s, [f]: e.target.value }));
    if (f === "name") setMedError("");
  };
  const add = () => {
    if (ARABIC_REGEX.test(form.name)) {
      setMedError("يجب إدخال أسماء الأدوية باللغة الإنجليزية فقط.");
      return;
    }
    setMedError("");
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
      {medError && <p className="text-xs text-destructive sm:col-span-3">{medError}</p>}
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
  const { t, isArabic } = usePatientLanguage();
  const [form, setForm] = useState({
    surgery_type: "", surgery_type_en: "", surgery_type_ar: "", surgery_date: "", reason: "", complications: "", outcome: "", hospitalization_duration: "",
  });
  const set = (f) => (e) =>
    setForm((s) => ({
      ...s,
      [f]: e.target.value,
      ...(f === "surgery_type" ? { surgery_type_en: "", surgery_type_ar: "" } : {}),
    }));
  const selectTerm = (term) =>
    setForm((s) => ({
      ...s,
      surgery_type: isArabic ? term.ar : term.en,
      surgery_type_en: term.en,
      surgery_type_ar: isArabic ? term.ar : "",
    }));
  const add = () => {
    onAdd({
      surgery_type: form.surgery_type_en || form.surgery_type,
      ...(form.surgery_type_ar ? { surgery_type_ar: form.surgery_type_ar } : {}),
      surgery_date: form.surgery_date,
      reason: form.reason,
      complications: form.complications,
      outcome: form.outcome,
      hospitalization_duration: form.hospitalization_duration,
    });
    setForm({
      surgery_type: "", surgery_type_en: "", surgery_type_ar: "", surgery_date: "", reason: "", complications: "", outcome: "", hospitalization_duration: "",
    });
  };
  return (
    <div className="grid sm:grid-cols-3 gap-2">
      <ArabicMedicalInput
        value={form.surgery_type}
        onChange={set("surgery_type")}
        onSelectTerm={selectTerm}
        placeholder={`${t("Type of surgery, e.g. Appendectomy")} *`}
        terms={AR_SURGERY_TERMS}
      />
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