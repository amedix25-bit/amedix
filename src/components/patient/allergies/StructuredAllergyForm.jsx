import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePatientLanguage } from "@/lib/patientLanguage";
import {
  ALLERGY_REACTIONS,
  ALLERGY_STATUS_OPTIONS,
  FOOD_ALLERGENS,
  MEDICATION_ALLERGENS,
} from "@/components/patient/allergies/allergyOptions";

// Structured allergy capture — two categories of large, touch-friendly
// checkboxes, an optional reaction per allergy, and a free-text "other" row.
// Nothing the patient ticks is presented as clinically verified: every entry is
// saved as reported by the patient. Ticking an allergy clears a "no known
// allergies" answer, and choosing that answer clears only what was ticked in
// this form, after the patient confirms.
export default function StructuredAllergyForm({ entries, onEntriesChange, status, onStatusChange }) {
  const { t } = usePatientLanguage();
  const [groups, setGroups] = useState(() => ({
    food: entries.some((e) => e.allergy_type === "food"),
    drug: entries.some((e) => e.allergy_type === "drug"),
  }));
  const [other, setOther] = useState({ food: "", drug: "" });
  const [otherOn, setOtherOn] = useState({ food: false, drug: false });

  const list = (type) => (type === "food" ? FOOD_ALLERGENS : MEDICATION_ALLERGENS);
  const ofType = (type) => entries.filter((e) => e.allergy_type === type);
  const has = (type, label) => ofType(type).some((e) => e.allergen === label);
  const reactionOf = (type, label) => ofType(type).find((e) => e.allergen === label)?.reaction || "";

  const base = (label, type) => ({
    allergen: label,
    allergy_type: type,
    entry_type: "confirmed_allergy",
    source: "patient_reported",
    reaction: "",
  });

  const clearStatus = () => {
    if (status) onStatusChange("");
  };

  const toggleAllergen = (type, label, checked) => {
    clearStatus();
    if (checked) {
      if (has(type, label)) return;
      onEntriesChange([...entries, base(label, type)]);
    } else {
      onEntriesChange(entries.filter((e) => !(e.allergy_type === type && e.allergen === label)));
    }
  };

  const setReaction = (type, label, reaction) => {
    onEntriesChange(
      entries.map((e) =>
        e.allergy_type === type && e.allergen === label ? { ...e, reaction } : e
      )
    );
  };

  const setOtherText = (type, value) => {
    clearStatus();
    setOther((s) => ({ ...s, [type]: value }));
    const rest = entries.filter(
      (e) => !(e.allergy_type === type && !list(type).some((c) => c.label === e.allergen))
    );
    const label = value.trim();
    onEntriesChange(label ? [...rest, base(label, type)] : rest);
  };

  const toggleGroup = (type, checked) => {
    if (!checked) {
      if (ofType(type).length && !window.confirm(t("Remove the allergies you selected in this section?"))) return;
      onEntriesChange(entries.filter((e) => e.allergy_type !== type));
      setOther((s) => ({ ...s, [type]: "" }));
      setOtherOn((s) => ({ ...s, [type]: false }));
    }
    setGroups((g) => ({ ...g, [type]: checked }));
  };

  const chooseStatus = (value) => {
    if (status === value) {
      onStatusChange("");
      return;
    }
    if (entries.length && !window.confirm(t("This will clear the allergies you selected in this form. Continue?"))) return;
    onEntriesChange([]);
    setGroups({ food: false, drug: false });
    setOther({ food: "", drug: "" });
    setOtherOn({ food: false, drug: false });
    onStatusChange(value);
  };

  const groupBlock = (type) => {
    const title = type === "food" ? "I Have Food Allergies" : "I Have Medication Allergies";
    const otherTitle = type === "food" ? "Other food allergy" : "Other medication allergy";
    const otherPlaceholder = type === "food"
      ? "Type the food that is not in the list"
      : "Type the medication that is not in the list";
    return (
      <div className="rounded-xl border border-border p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-lg">
          <Checkbox
            id={`allergy_group_${type}`}
            checked={groups[type]}
            onCheckedChange={(v) => toggleGroup(type, v === true)}
            className="h-5 w-5"
          />
          <Label htmlFor={`allergy_group_${type}`} className="text-sm font-semibold cursor-pointer">
            {t(title)}
          </Label>
        </div>
        {groups[type] && (
          <div className="space-y-2">
            {list(type).map((item) => {
              const checked = has(type, item.label);
              return (
                <div key={item.value} className={`rounded-lg border p-3 ${checked ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`allergy_${type}_${item.value}`}
                      checked={checked}
                      onCheckedChange={(v) => toggleAllergen(type, item.label, v === true)}
                      className="h-5 w-5 mt-0.5"
                    />
                    <Label htmlFor={`allergy_${type}_${item.value}`} className="text-sm font-normal cursor-pointer">
                      {t(item.label)}
                    </Label>
                  </div>
                  {checked && (
                    <div className="mt-2 ps-8">
                      <Select value={reactionOf(type, item.label)} onValueChange={(v) => setReaction(type, item.label, v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t("Reaction (optional)")} />
                        </SelectTrigger>
                        <SelectContent>
                          {ALLERGY_REACTIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{t(r.label)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`allergy_other_${type}`}
                  checked={otherOn[type]}
                  onCheckedChange={(v) => {
                    const on = v === true;
                    setOtherOn((s) => ({ ...s, [type]: on }));
                    if (!on) setOtherText(type, "");
                  }}
                  className="h-5 w-5"
                />
                <Label htmlFor={`allergy_other_${type}`} className="text-sm font-normal cursor-pointer">
                  {t(otherTitle)}
                </Label>
              </div>
              {otherOn[type] && (
                <Input
                  value={other[type].trim()}
                  onChange={(e) => setOtherText(type, e.target.value)}
                  placeholder={t(otherPlaceholder)}
                  className="mt-1"
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {groupBlock("food")}
      {groupBlock("drug")}

      <div className="space-y-2 pt-1">
        {ALLERGY_STATUS_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center gap-3">
            <Checkbox
              id={`allergy_status_${option.value}`}
              checked={status === option.value}
              onCheckedChange={() => chooseStatus(option.value)}
              className="h-5 w-5"
            />
            <Label htmlFor={`allergy_status_${option.value}`} className="text-sm font-normal text-muted-foreground cursor-pointer">
              {t(option.label)}
            </Label>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {t("Anything you leave empty is saved as not recorded — never as \"no allergies\".")}
      </p>
    </div>
  );
}