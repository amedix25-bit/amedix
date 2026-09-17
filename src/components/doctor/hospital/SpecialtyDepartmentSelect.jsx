import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/specialties";
import { useAppLanguage } from "@/lib/appLanguage";

// "Your specialty / department at this hospital" — a fixed dropdown of the
// predefined specialties instead of free text, used in both hospital join
// flows (the Doctor Portal hospital gate and My Hospitals). The doctor can
// only pick from the official list, never type.
export default function SpecialtyDepartmentSelect({ value, onChange }) {
  const { t } = useAppLanguage();
  const options = [...new Set([value, ...SPECIALTIES].filter(Boolean))];

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{t("Your specialty / department at this hospital")}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("Select your specialty")} />
        </SelectTrigger>
        <SelectContent>
          {options.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}