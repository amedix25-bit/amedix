import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { neuroBlock, neuroBlockValue } from "@/lib/neurologyBlocks";
import { asObject } from "@/lib/neurologyFieldKit";

// One structured neurology block. Every item is optional: the clinician documents
// exactly what applies and leaves the rest untouched — a blank is never read as
// normal, and nothing is pre-selected.
const visible = (field, values) => {
  const cond = field.showIf;
  if (!cond) return true;
  const current = values[cond.key];
  if (cond.equals !== undefined) return current === cond.equals;
  if (Array.isArray(cond.in)) return cond.in.includes(current);
  return true;
};

export default function NeurologyBlockField({ fieldKey, value, onChange }) {
  const spec = neuroBlock(fieldKey);
  if (!spec) return null;
  const values = asObject(value);
  const set = (key, next) => onChange(neuroBlockValue(fieldKey, { ...values, [key]: next }));

  return (
    <div className="space-y-3">
      {spec.note && <p className="text-[11px] text-muted-foreground leading-snug">{spec.note}</p>}
      {spec.fields.filter((f) => visible(f, values)).map((f) => {
        const current = values[f.key];
        const hint = f.hint || f.placeholder;
        return (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs font-medium leading-snug">{f.label}</Label>

            {f.type === "select" && (
              <Select value={current || undefined} onValueChange={(next) => set(f.key, next)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {f.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {f.type === "multi" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {f.options.map((option) => {
                  const selected = Array.isArray(current) ? current : [];
                  const on = selected.includes(option);
                  return (
                    <label key={option} className="flex items-start gap-2 text-[11px] leading-snug cursor-pointer">
                      <Checkbox
                        checked={on}
                        onCheckedChange={(checked) =>
                          set(f.key, checked ? [...selected, option] : selected.filter((x) => x !== option))
                        }
                        className="mt-0.5"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {(f.type === "input" || f.type === "date") && (
              <Input value={current ?? ""} placeholder={hint || ""} type={f.type === "date" ? "date" : "text"} onChange={(e) => set(f.key, e.target.value)} />
            )}

            {f.type === "number" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={current ?? ""}
                  min={f.min}
                  max={f.max}
                  placeholder={f.placeholder || ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
                {f.unit && <span className="text-xs text-muted-foreground shrink-0">{f.unit}</span>}
              </div>
            )}

            {f.type === "textarea" && (
              <Textarea rows={2} value={current ?? ""} placeholder={f.placeholder || ""} onChange={(e) => set(f.key, e.target.value)} />
            )}
          </div>
        );
      })}
    </div>
  );
}