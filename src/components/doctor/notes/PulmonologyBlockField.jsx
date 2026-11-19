import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pulmBlock, pulmBlockValue } from "@/lib/pulmonologyBlocks";
import { pulmAr } from "@/lib/pulmonologyArabic";
import { useAppLanguage } from "@/lib/appLanguage";

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

const isVisible = (field, values) => {
  if (!field.showIf) return true;
  const controlling = values[field.showIf.key];
  if (Array.isArray(field.showIf.in)) return field.showIf.in.includes(controlling);
  return controlling === field.showIf.equals;
};

// One structured respiratory block. The block's own definition lives in the
// library module, so the form, the saved note and the printed record read the
// same specification. Conditional questions appear only when the recorded
// context makes them relevant, and nothing is preselected — an unanswered
// question stays unanswered rather than defaulting to "normal" or "absent".
export default function PulmonologyBlockField({ fieldKey, value, onChange }) {
  const { isArabic } = useAppLanguage();
  const spec = pulmBlock(fieldKey);
  if (!spec) return null;

  const values = asObject(value);
  const set = (key, next) => onChange(pulmBlockValue(fieldKey, { ...values, [key]: next }));
  const toggle = (key, option) => {
    const current = Array.isArray(values[key]) ? values[key] : [];
    set(key, current.includes(option) ? current.filter((x) => x !== option) : [...current, option]);
  };

  const visible = spec.fields.filter((f) => isVisible(f, values));

  return (
    <div className="space-y-4">
      {visible.map((f) => {
        const v = values[f.key];
        return (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={`${fieldKey}-${f.key}`} className="text-xs font-medium">
              {pulmAr(f.label, isArabic)}
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
              <Input
                id={`${fieldKey}-${f.key}`}
                type={f.type === "number" ? "number" : "text"}
                step={f.type === "number" ? "any" : undefined}
                value={v ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}

            {f.type === "computed" && (
              <div className="rounded-md border border-border bg-muted/40 px-2 py-1.5">
                {(() => {
                  const calculated = typeof f.compute === "function" ? f.compute(values) : null;
                  return (
                    <p className="text-xs">
                      {calculated === null || calculated === undefined || calculated === "" ? (
                        <span className="text-muted-foreground">{pulmAr("Not calculable yet — enter the values it needs above.", isArabic)}</span>
                      ) : (
                        <>
                          <span className="font-semibold">{calculated}</span>
                          {f.unit ? ` ${f.unit}` : ""}
                          <span className="ml-1 text-[10px] text-muted-foreground">{pulmAr("calculated, not entered", isArabic)}</span>
                        </>
                      )}
                    </p>
                  );
                })()}
              </div>
            )}

            {f.type === "select" && (
              <Select value={v || undefined} onValueChange={(next) => set(f.key, next)}>
                <SelectTrigger id={`${fieldKey}-${f.key}`} className="w-full">
                  <SelectValue placeholder={pulmAr("Select…", isArabic)} />
                </SelectTrigger>
                <SelectContent>
                  {f.options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {pulmAr(o, isArabic)}
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
                      {pulmAr(o, isArabic)}
                    </button>
                  );
                })}
              </div>
            )}

            {f.hint && <p className="text-[10px] text-muted-foreground">{pulmAr(f.hint, isArabic)}</p>}
          </div>
        );
      })}
    </div>
  );
}