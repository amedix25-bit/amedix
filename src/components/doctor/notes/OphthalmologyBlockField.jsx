import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ophthBlock, ophthBlockValue } from "@/lib/ophthalmologyBlocks";
import { asObject } from "@/lib/ophthFieldKit";

// One structured ophthalmology block. Every field is optional, so the clinician
// can document exactly what was examined and leave the rest untouched — a blank
// is never read as normal. Laterality is carried by the fields themselves.
const visible = (field, values) => {
  const cond = field.showIf;
  if (!cond) return true;
  const current = values[cond.key];
  if (cond.equals !== undefined) return current === cond.equals;
  if (Array.isArray(cond.in)) return cond.in.includes(current);
  return true;
};

export default function OphthalmologyBlockField({ fieldKey, value, onChange }) {
  const spec = ophthBlock(fieldKey);
  if (!spec) return null;
  const values = asObject(value);

  const set = (key, next) => onChange(ophthBlockValue(fieldKey, { ...values, [key]: next }));

  return (
    <div className="space-y-3">
      {spec.fields.filter((f) => visible(f, values)).map((f) => {
        const current = values[f.key];
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
                    <SelectItem key={option} value={option}>{option}</SelectItem>
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

            {f.type === "input" && (
              <Input
                value={current ?? ""}
                placeholder={f.placeholder || ""}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}

            {f.type === "number" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={f.min}
                  max={f.max}
                  value={current ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
                {f.unit ? <span className="text-[11px] text-muted-foreground shrink-0">{f.unit}</span> : null}
              </div>
            )}

            {f.type === "textarea" && (
              <Textarea rows={2} value={current ?? ""} onChange={(e) => set(f.key, e.target.value)} />
            )}
          </div>
        );
      })}

      <p className="text-[10px] text-muted-foreground">
        Only what was examined needs an answer. A field left blank is recorded as not documented.
      </p>
    </div>
  );
}