import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { SLEEP_PATTERNS } from "@/lib/lifestyleOptions";

// Sleep Pattern — several patterns may apply (checkboxes); "Other" opens a text
// field and a separate optional field holds any further sleep concerns.
export default function SleepPatternFields({ patterns = [], other = "", concerns = "", onChange }) {
  const { t } = usePatientLanguage();
  const toggle = (value) =>
    onChange({
      patterns: patterns.includes(value) ? patterns.filter((v) => v !== value) : [...patterns, value],
    });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">{t("Sleep pattern — select all that apply")}</Label>
        <div className="grid sm:grid-cols-2 gap-2 mt-2">
          {SLEEP_PATTERNS.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`sleep_${option.value}`}
                checked={patterns.includes(option.value)}
                onCheckedChange={() => toggle(option.value)}
              />
              <Label htmlFor={`sleep_${option.value}`} className="text-sm font-normal">
                {t(option.label)}
              </Label>
            </div>
          ))}
        </div>
      </div>
      {patterns.includes("other") && (
        <div className="space-y-1.5">
          <Label htmlFor="sleep_other">{t("Please specify the other sleep pattern")}</Label>
          <Input
            id="sleep_other"
            value={other}
            onChange={(e) => onChange({ other: e.target.value })}
            placeholder={t("e.g. Works night shifts")}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="sleep_concerns">{t("Additional sleep-related concerns")}</Label>
        <Textarea
          id="sleep_concerns"
          rows={2}
          value={concerns}
          onChange={(e) => onChange({ concerns: e.target.value })}
          placeholder={t("Anything else about your sleep (optional)")}
        />
      </div>
    </div>
  );
}