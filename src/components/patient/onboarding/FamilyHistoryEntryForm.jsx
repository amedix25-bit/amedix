import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Selectable familial conditions — shown in Arabic when the patient's
// language is Arabic. The English term is stored for the record, the Arabic
// term is preserved as condition_ar.
export const FAMILY_CONDITIONS = [
  { value: "Diabetes Mellitus", ar: "داء السكري" },
  { value: "Hypertension", ar: "ارتفاع ضغط الدم" },
  { value: "Heart Disease", ar: "أمراض القلب" },
  { value: "Stroke", ar: "السكتة الدماغية" },
  { value: "Cancer", ar: "السرطان" },
  { value: "Asthma", ar: "الربو" },
  { value: "Thyroid Disease", ar: "أمراض الغدة الدرقية" },
  { value: "Kidney Disease", ar: "أمراض الكلى" },
  { value: "Sickle Cell Disease", ar: "فقر الدم المنجلي" },
  { value: "Hyperlipidemia", ar: "ارتفاع دهون الدم" },
  { value: "Other", ar: "أخرى" },
];

export const FAMILY_RELATIONS = [
  { value: "father", label: "Father", ar: "الأب" },
  { value: "mother", label: "Mother", ar: "الأم" },
  { value: "brother", label: "Brother", ar: "الأخ" },
  { value: "sister", label: "Sister", ar: "الأخت" },
  { value: "other", label: "Other Relative", ar: "قريب آخر" },
];

export const relationLabel = (value, isArabic) => {
  const rel = FAMILY_RELATIONS.find((r) => r.value === value);
  if (!rel) return value;
  return isArabic ? rel.ar : rel.label;
};

export const familyConditionLabel = (entry, isArabic) =>
  isArabic && entry.condition_ar ? entry.condition_ar : entry.condition;

// Save/Add entry form for the Family History section of patient registration.
// Uses only selectable options; "Other" reveals a free-text input to specify
// the condition.
export default function FamilyHistoryEntryForm({ onAdd }) {
  const { t, isArabic } = usePatientLanguage();
  const [open, setOpen] = useState(true);
  const [condition, setCondition] = useState("");
  const [custom, setCustom] = useState("");
  const [relation, setRelation] = useState("");

  const isOther = condition === "Other";
  const canSave = !!condition && !!relation && (!isOther || custom.trim() !== "");

  const save = () => {
    if (!canSave) return;
    const name = isOther ? custom.trim() : condition;
    const matched = FAMILY_CONDITIONS.find((c) => c.value === condition);
    onAdd({
      condition: name,
      condition_ar: isArabic ? (isOther ? name : matched.ar) : "",
      relation,
    });
    setCondition("");
    setCustom("");
    setRelation("");
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
      <div className="grid sm:grid-cols-2 gap-2">
        <Select value={condition} onValueChange={setCondition}>
          <SelectTrigger><SelectValue placeholder={t("Familial condition")} /></SelectTrigger>
          <SelectContent>
            {FAMILY_CONDITIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{isArabic ? c.ar : c.value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isOther && (
          <Input placeholder={t("Please specify")} value={custom} onChange={(e) => setCustom(e.target.value)} />
        )}
      </div>
      <div className="grid sm:grid-cols-[2fr_auto] gap-2">
        <Select value={relation} onValueChange={setRelation}>
          <SelectTrigger><SelectValue placeholder={t("Family member")} /></SelectTrigger>
          <SelectContent>
            {FAMILY_RELATIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{isArabic ? r.ar : r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={save} disabled={!canSave}>
          {t("Save")}
        </Button>
      </div>
    </div>
  );
}