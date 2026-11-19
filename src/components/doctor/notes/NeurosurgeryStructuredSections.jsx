import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Shared renderer for the neurosurgical structured records (time-critical
// pathway, operation record, post-operative monitoring).
//
// One renderer so a section definition in the lib is enough to add a block: the
// component never carries clinical wording of its own. Nothing is preselected,
// every select can be left as "Not documented", and a field marked
// safety-critical says so on screen without ever blocking the save.

const NOT_DOCUMENTED = "Not documented";

const withNotDocumented = (options = []) =>
  options.includes(NOT_DOCUMENTED) ? options : [NOT_DOCUMENTED, ...options];

function Field({ field, value, onChange }) {
  const label = (
    <div className="flex items-baseline gap-1.5">
      <Label className="text-[11px] text-muted-foreground leading-snug">{field.label}</Label>
      {field.critical && (
        <span className="text-[9px] font-semibold uppercase tracking-wide text-critical">
          Safety-critical
        </span>
      )}
    </div>
  );

  const hint = field.hint ? (
    <p className="text-[10px] text-muted-foreground leading-snug">{field.hint}</p>
  ) : null;

  if (field.type === "checkbox") {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (option) =>
      onChange(
        selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]
      );
    return (
      <div className="space-y-1.5 sm:col-span-2">
        {label}
        {hint}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {field.options.map((option) => (
            <label key={option} className="flex items-start gap-2 text-[11px] leading-snug cursor-pointer">
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={() => toggle(option)}
                className="mt-0.5 h-3.5 w-3.5"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-1">
        {label}
        {hint}
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder={NOT_DOCUMENTED} />
          </SelectTrigger>
          <SelectContent>
            {withNotDocumented(field.options).map((option) => (
              <SelectItem key={option} value={option} className="text-xs">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1 sm:col-span-2">
        {label}
        {hint}
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows || 2}
          className="text-xs"
          placeholder={field.placeholder || ""}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label}
      {hint}
      <Input
        type={field.type === "number" ? "number" : field.type === "time" ? "time" : "text"}
        value={value ?? ""}
        onChange={(e) => onChange(field.type === "number" ? e.target.value : e.target.value)}
        min={field.min}
        className="h-8 text-xs"
        placeholder={field.placeholder || ""}
      />
    </div>
  );
}

export default function NeurosurgeryStructuredSections({ value, onChange, sections = [], footer }) {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const set = (key, next) => onChange({ ...v, [key]: next });

  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <div key={section.title} className="rounded-lg border border-border bg-card p-2.5 space-y-2">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">
            {section.title}
          </p>
          {section.note && (
            <p className="text-[10px] text-muted-foreground leading-snug">{section.note}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {section.fields.map((field) => (
              <Field
                key={field.key}
                field={field}
                value={v[field.key]}
                onChange={(next) => set(field.key, next)}
              />
            ))}
          </div>
        </div>
      ))}
      {footer && <p className="text-[10px] text-muted-foreground leading-snug">{footer}</p>}
    </div>
  );
}