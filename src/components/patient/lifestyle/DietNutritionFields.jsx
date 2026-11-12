import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { DIET_TYPES } from "@/lib/lifestyleOptions";

// Diet & Nutrition — several diet types may apply (checkboxes). "Other" opens a
// text field, and a separate field records food allergies, intolerances and
// dietary restrictions. Everything is optional.
export default function DietNutritionFields({ dietTypes = [], dietOther = "", foodRestrictions = "", onChange }) {
  const { t } = usePatientLanguage();
  const toggle = (value) =>
    onChange({
      dietTypes: dietTypes.includes(value) ? dietTypes.filter((v) => v !== value) : [...dietTypes, value],
    });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">{t("Diet type — select all that apply")}</Label>
        <div className="grid sm:grid-cols-2 gap-2 mt-2">
          {DIET_TYPES.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`diet_${option.value}`}
                checked={dietTypes.includes(option.value)}
                onCheckedChange={() => toggle(option.value)}
              />
              <Label htmlFor={`diet_${option.value}`} className="text-sm font-normal">
                {t(option.label)}
              </Label>
            </div>
          ))}
        </div>
      </div>
      {dietTypes.includes("other") && (
        <div className="space-y-1.5">
          <Label htmlFor="diet_other">{t("Please specify the other diet")}</Label>
          <Input
            id="diet_other"
            value={dietOther}
            onChange={(e) => onChange({ dietOther: e.target.value })}
            placeholder={t("e.g. Texture-modified diet")}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="food_restrictions">{t("Food allergies, intolerances & dietary restrictions")}</Label>
        <Textarea
          id="food_restrictions"
          rows={2}
          value={foodRestrictions}
          onChange={(e) => onChange({ foodRestrictions: e.target.value })}
          placeholder={t("e.g. Peanut allergy, lactose intolerance, no pork")}
        />
      </div>
    </div>
  );
}