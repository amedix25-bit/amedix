import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { gastroBlock, gastroBlockValue } from "@/lib/gastroenterologyModules";

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

const isVisible = (field, values) => {
  if (!field.showIf) return true;
  const controlling = values[field.showIf.key];
  if (Array.isArray(field.showIf.in)) return field.showIf.in.includes(controlling);
  return controlling === field.showIf.equals;
};

// One structured Gastroenterology / Hepatology block. The block's own definition
// lives in the library module, so the form, the saved note and the printed record
// all read the same specification. Conditional questions appear only when the
// clinical context makes them relevant, and no field is preselected — an
// unanswered question stays unanswered rather than defaulting to "normal".
export default function GastroBlockField({ fieldKey, value, onChange }) {
  const spec = gastroBlock(fieldKey);
  if (!spec) return null;

  const values = asObject(value);
  const set = (key, next) => onChange(gastroBlockValue(fieldKey, { ...values, [key]: next }));
  const toggle = (key, option) => {
    const current = Array.isArray(values[key]) ? values[key] : [];
    const isOn = current.includes(option);
    set(key, isOn ? current.filter((x) => x !== option) : [...current, option]);
  };

  const visible = spec.fields.filter((f) => isVisible(f, values));

  return (
    <div className="space-y-4">
      {visible.map((f) => {
        const v = values[f.key];
        return (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={`${fieldKey}-${f.key}`} className="text-xs font-medium">
              {f.label}
            </Label>

            {f.type === "textarea" && (
              <Textarea
                id={`${fieldKey}-${f.key}`}
                rows={2}
                value={v ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}

            {(f.type === "input" || f.type === "number") && (
              <div className="flex items-center gap-2">
                <Input
                  id={`${fieldKey}-${f.key}`}
                  type={f.type === "number" ? "number" : "text"}
                  min={f.min}
                  max={f.max}
                  step={f.step || (f.type === "number" ? "any" : undefined)}
                  value={v ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
                {f.unit ? <span className="text-xs text-muted-foreground shrink-0">{f.unit}</span> : null}
              </div>
            )}

            {f.type === "select" && (
              <Select value={v || undefined} onValueChange={(next) => set(f.key, next)}>
                <SelectTrigger id={`${fieldKey}-${f.key}`} className="w-full">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {f.options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {f.type === "multi" && (
              <div className="flex flex-wrap gap-1.5">
                {f.options.map((o) => {
                  const on = Array.isArray(v) && v.includes(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => toggle(f.key, o)}
                      aria-pressed={on}
                      className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                        on
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground">
        Nothing in this block is preselected. A question left blank is recorded as not documented, never as normal.
      </p>
    </div>
  );
}