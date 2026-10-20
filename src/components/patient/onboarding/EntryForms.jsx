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

// Structured list section: optional "none of the above" flag, saved entry
// rows, and the entry form below. headerExtra renders extra controls in the
// section header (e.g. the allergy section-level status); hideNone removes
// the built-in "none" checkbox when the section manages its own states.
export function MedicalListSection({
  id, title, description, entries, entryLabel, onRemove, noneChecked, onNoneChange, noneLabel, children, headerExtra, hideNone,
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      {headerExtra}
      {!hideNone && (
        <div className="flex items-center gap-2 mt-3">
          <Checkbox id={id} checked={noneChecked} onCheckedChange={onNoneChange} disabled={entries.length > 0} />
          <Label htmlFor={id} className="text-sm font-normal text-muted-foreground">{noneLabel}</Label>
        </div>
      )}
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

// Select options for the structured medical-history buckets — conditions and
// significant history events (registration checklist section 2).
export const CONDITION_TYPES = [
  { value: "existing_condition", label: "Existing condition / chronic disease" },
  { value: "previous_diagnosis", label: "Previous diagnosis" },
  { value: "long_term_monitoring", label: "Long-term condition requiring monitoring" },
  { value: "other", label: "Other significant history" },
];

export const MEDICAL_EVENT_TYPES = [
  { value: "hospital_admission", label: "Previous hospital admission" },
  { value: "er_visit", label: "Previous emergency department visit" },
  { value: "injury_accident", label: "Major injury or accident" },
  { value: "blood_transfusion", label: "Previous blood transfusion" },
  { value: "infectious_disease", label: "History of infectious disease" },
  { value: "treatment_complication", label: "Complication of medical treatment" },
  { value: "other", label: "Other significant medical history" },
];

export const conditionTypeLabel = (v, t) => {
  const item = CONDITION_TYPES.find((c) => c.value === v);
  return item ? t(item.label) : v;
};

export const medicalEventLabel = (v, t) => {
  const item = MEDICAL_EVENT_TYPES.find((c) => c.value === v);
  return item ? t(item.label) : v;
};

export const CONDITION_STATUS = [
  { value: "active", label: "Active / ongoing" },
  { value: "resolved", label: "Resolved" },
  { value: "being_monitored", label: "Under monitoring" },
  { value: "unknown", label: "Unknown" },
];

export const conditionStatusLabel = (v, t) => {
  const item = (CONDITION_STATUS.find((s) => s.value === v) || {});
  return item.label ? t(item.label) : v;
};

// Structured condition entry: diagnosis, approximate date of diagnosis,
// treating facility, current status and notes.
export function ConditionEntryForm({ onAdd }) {
  const { t, isArabic } = usePatientLanguage();
  const EMPTY = {
    name: "", name_en: "", name_ar: "", history_type: "existing_condition",
    date: "", treating_facility: "", current_status: "unknown", details: "",
  };
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(true);
  const set = (f) => (e) =>
    setForm((s) => ({
      ...s,
      [f]: e.target.value,
      ...(f === "name" ? { name_en: "", name_ar: "" } : {}),
    }));
  const selectTerm = (term) =>
    setForm((s) => ({
      ...s,
      name: isArabic ? term.ar : term.en,
      name_en: term.en,
      name_ar: isArabic ? term.ar : "",
    }));
  const save = () => {
    onAdd({
      name: form.name_en || form.name,
      ...(form.name_ar ? { name_ar: form.name_ar } : {}),
      history_type: form.history_type,
      date: form.date,
      treating_facility: form.treating_facility,
      current_status: form.current_status,
      details: form.details,
    });
    setForm(EMPTY);
    setOpen(false);
  };

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Add")}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid sm:grid-cols-[1fr_1fr] gap-2">
        <ArabicMedicalInput
          value={form.name}
          onChange={set("name")}
          onSelectTerm={selectTerm}
          placeholder={t("Condition, e.g. Hypertension")}
          terms={AR_CONDITION_TERMS}
        />
        <Select value={form.history_type} onValueChange={(v) => setForm((s) => ({ ...s, history_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CONDITION_TYPES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{t(c.label)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{t("Approximate date of diagnosis")}</Label>
          <Input type="date" value={form.date} onChange={set("date")} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{t("Treating facility")}</Label>
          <Input placeholder={t("e.g. Tripoli Central Hospital")} value={form.treating_facility} onChange={set("treating_facility")} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{t("Current status")}</Label>
          <Select value={form.current_status} onValueChange={(v) => setForm((s) => ({ ...s, current_status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONDITION_STATUS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{t(s.label)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid sm:grid-cols-[3fr_auto] gap-2">
        <Input placeholder={t("Relevant notes (optional)")} value={form.details} onChange={set("details")} />
        <Button type="button" onClick={save} disabled={!form.name}>
          {t("Save")}
        </Button>
      </div>
    </div>
  );
}

// Structured significant-history event: hospital admissions, ER visits,
// injuries/accidents, blood transfusions (with reaction), infectious
// diseases, complications of medical treatment and other history.
export function MedicalEventEntryForm({ onAdd }) {
  const { t } = usePatientLanguage();
  const EMPTY = {
    event_type: "hospital_admission", title: "", event_date: "",
    treating_facility: "", current_status: "unknown", reaction: "", notes: "",
  };
  const [form, setForm] = useState(EMPTY);
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const add = () => {
    onAdd(form);
    setForm(EMPTY);
  };
  return (
    <div className="space-y-2">
      <div className="grid sm:grid-cols-2 gap-2">
        <Select value={form.event_type} onValueChange={(v) => setForm((s) => ({ ...s, event_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MEDICAL_EVENT_TYPES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{t(c.label)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder={`${t("What happened, e.g. Appendectomy admission")} *`} value={form.title} onChange={set("title")} />
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <Input placeholder={t("Approximate date")} value={form.event_date} onChange={set("event_date")} />
        <Input placeholder={t("Treating facility, if known")} value={form.treating_facility} onChange={set("treating_facility")} />
        <Select value={form.current_status} onValueChange={(v) => setForm((s) => ({ ...s, current_status: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="resolved">{t("Resolved")}</SelectItem>
            <SelectItem value="ongoing">{t("Ongoing")}</SelectItem>
            <SelectItem value="unknown">{t("Unknown")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.event_type === "blood_transfusion" && (
        <Input placeholder={t("Transfusion reaction, if any")} value={form.reaction} onChange={set("reaction")} />
      )}
      <div className="grid sm:grid-cols-[3fr_auto] gap-2">
        <Input placeholder={t("Relevant notes (optional)")} value={form.notes} onChange={set("notes")} />
        <Button type="button" variant="outline" onClick={add} disabled={!form.title.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Structured medication entry: name, kind (prescription / OTC /
// vitamins-supplements / herbal / long-term injections and therapies),
// dose, route, frequency, reason, start and end dates, prescriber and
// current status.
export function MedicationEntryForm({ onAdd }) {
  const { t } = usePatientLanguage();
  const EMPTY = {
    name: "", medication_kind: "prescription", dose: "", frequency: "", route: "oral",
    meal_timing: "", duration: "", reason: "", start_date: "", end_date: "",
    prescribed_by: "", current_status: "taking", patient_notes: "",
  };
  const [form, setForm] = useState(EMPTY);
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
    <div className="space-y-2">
      <div className="grid sm:grid-cols-[2fr_2fr_1fr] gap-2">
        <Input placeholder={`${t("Medication name")} *`} value={form.name} onChange={set("name")} />
        <Select value={form.medication_kind} onValueChange={(v) => setForm((s) => ({ ...s, medication_kind: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="prescription">{t("Prescription medication")}</SelectItem>
            <SelectItem value="non_prescription">{t("Non-prescription (OTC) medication")}</SelectItem>
            <SelectItem value="vitamin_supplement">{t("Vitamin / supplement")}</SelectItem>
            <SelectItem value="herbal">{t("Herbal product")}</SelectItem>
            <SelectItem value="injection_therapy">{t("Long-term injection / other therapy")}</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder={t("Dose, e.g. 500 mg")} value={form.dose} onChange={set("dose")} />
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <Select value={form.route} onValueChange={(v) => setForm((s) => ({ ...s, route: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MED_ROUTES.map((r) => (
              <SelectItem key={r} value={r}>{t(routeLabel(r))}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder={t("Frequency, e.g. Twice daily")} value={form.frequency} onChange={set("frequency")} />
        <Input placeholder={t("Reason for taking it")} value={form.reason} onChange={set("reason")} />
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{t("Start date, if known")}</Label>
          <Input type="date" value={form.start_date} onChange={set("start_date")} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{t("End date, if known")}</Label>
          <Input type="date" value={form.end_date} onChange={set("end_date")} />
        </div>
        <Input placeholder={t("Prescribing doctor / facility, if known")} value={form.prescribed_by} onChange={set("prescribed_by")} />
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <Select value={form.current_status} onValueChange={(v) => setForm((s) => ({ ...s, current_status: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="taking">{t("Currently taking")}</SelectItem>
            <SelectItem value="discontinued">{t("Discontinued")}</SelectItem>
            <SelectItem value="taken_occasionally">{t("Taken occasionally")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={form.meal_timing} onValueChange={(v) => setForm((s) => ({ ...s, meal_timing: v }))}>
          <SelectTrigger><SelectValue placeholder={t("Before / after meals")} /></SelectTrigger>
          <SelectContent>
            {MEAL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{t(o.label)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder={t("Additional notes")} value={form.patient_notes} onChange={set("patient_notes")} />
      </div>
      <Button type="button" variant="outline" onClick={add} disabled={!form.name} className="w-full sm:w-auto">
        <Plus className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Add")}
      </Button>
      {medError && <p className="text-xs text-destructive">{medError}</p>}
    </div>
  );
}

// Structured allergy entry — distinguishes a confirmed allergy from a
// reported side effect, supports latex and contrast-agent reactions, and
// records the approximate date and treatment required.
export function AllergyEntryForm({ onAdd }) {
  const { t } = usePatientLanguage();
  const EMPTY = {
    allergen: "", allergy_type: "drug", entry_type: "confirmed_allergy",
    reaction: "", severity: "mild", approx_date: "", treatment_required: "",
  };
  const [form, setForm] = useState(EMPTY);
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const add = () => {
    onAdd(form);
    setForm(EMPTY);
  };
  return (
    <div className="space-y-2">
      <div className="grid sm:grid-cols-[2fr_1fr_1fr] gap-2">
        <Input placeholder={`${t("Substance causing the reaction, e.g. Penicillin")} *`} value={form.allergen} onChange={set("allergen")} />
        <Select value={form.allergy_type} onValueChange={(v) => setForm((s) => ({ ...s, allergy_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="drug">{t("Medication")}</SelectItem>
            <SelectItem value="food">{t("Food")}</SelectItem>
            <SelectItem value="latex">{t("Latex")}</SelectItem>
            <SelectItem value="contrast">{t("Contrast agent")}</SelectItem>
            <SelectItem value="environmental">{t("Environmental")}</SelectItem>
            <SelectItem value="other">{t("Other")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={form.entry_type} onValueChange={(v) => setForm((s) => ({ ...s, entry_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmed_allergy">{t("Allergy (confirmed by me)")}</SelectItem>
            <SelectItem value="reported_side_effect">{t("Side effect / intolerance")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <Input placeholder={t("Reaction, e.g. Rash")} value={form.reaction} onChange={set("reaction")} />
        <Select value={form.severity} onValueChange={(v) => setForm((s) => ({ ...s, severity: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mild">{t("Mild")}</SelectItem>
            <SelectItem value="moderate">{t("Moderate")}</SelectItem>
            <SelectItem value="severe">{t("Severe")}</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder={t("Approximate date, if known")} value={form.approx_date} onChange={set("approx_date")} />
      </div>
      <div className="grid sm:grid-cols-[3fr_auto] gap-2">
        <Input placeholder={t("Treatment required, if any")} value={form.treatment_required} onChange={set("treatment_required")} />
        <Button type="button" variant="outline" onClick={add} disabled={!form.allergen}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
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