import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { LIVING_SITUATIONS } from "@/lib/lifestyleOptions";

// Living Situation — exactly one primary situation (radio buttons), plus an
// optional field for details (used to specify "Other").
export default function LivingSituationFields({ type = "", details = "", onChange }) {
  const { t } = usePatientLanguage();

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">{t("Primary living situation — select one")}</Label>
        <RadioGroup
          value={type}
          onValueChange={(value) => onChange({ type: value })}
          className="grid sm:grid-cols-2 gap-2 mt-2"
        >
          {LIVING_SITUATIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem id={`living_${option.value}`} value={option.value} />
              <Label htmlFor={`living_${option.value}`} className="text-sm font-normal">
                {t(option.label)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="living_details">
          {type === "other" ? t("Please specify the other living situation") : t("Additional details")}
        </Label>
        <Input
          id="living_details"
          value={details}
          onChange={(e) => onChange({ details: e.target.value })}
          placeholder={t("e.g. Caregiving needs, accessibility (optional)")}
        />
      </div>
    </div>
  );
}