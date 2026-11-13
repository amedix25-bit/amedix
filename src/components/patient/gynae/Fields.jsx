import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateField from "@/components/ui/date-field";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Small shared controls for the Gynaecological & Obstetric History, so every
// field of that section is styled, labelled and translated the same way.

export function SelectField({ label, value, onChange, options, required, placeholder, disabled }) {
  const { t } = usePatientLanguage();
  return (
    <div className="space-y-1.5">
      <Label>
        {t(label)}
        {required ? " *" : ""}
      </Label>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={t(placeholder || "Select")} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder, type = "text", min, max, required }) {
  const { t } = usePatientLanguage();
  return (
    <div className="space-y-1.5">
      <Label>
        {t(label)}
        {required ? " *" : ""}
      </Label>
      <Input
        type={type}
        min={min}
        max={max}
        value={value || ""}
        placeholder={placeholder ? t(placeholder) : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 2 }) {
  const { t } = usePatientLanguage();
  return (
    <div className="space-y-1.5">
      <Label>{t(label)}</Label>
      <textarea
        value={value || ""}
        rows={rows}
        placeholder={placeholder ? t(placeholder) : ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}

export function DateInputField({ label, value, onChange, disableFuture = true, minYear = 1930 }) {
  const { t } = usePatientLanguage();
  return (
    <div className="space-y-1.5">
      <Label>{t(label)}</Label>
      <DateField value={value || ""} onChange={onChange} disableFuture={disableFuture} minYear={minYear} />
    </div>
  );
}

export function CheckField({ id, label, checked, onChange, disabled }) {
  const { t } = usePatientLanguage();
  return (
    <div className="flex items-start gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} disabled={disabled} />
      <Label htmlFor={id} className="text-sm font-normal leading-snug">
        {t(label)}
      </Label>
    </div>
  );
}