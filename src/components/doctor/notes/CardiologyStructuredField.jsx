import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getInvestigationSpec } from "@/lib/cardiologyInvestigationSpecs";

// Renders one structured cardiology investigation (ECG, echocardiogram or the
// laboratory panel) from its specification. Values are stored as one object, so
// the note keeps the measurement, not a sentence describing it.
export default function CardiologyStructuredField({ type, value, onChange, omit = [] }) {
  const spec = getInvestigationSpec(type);
  if (!spec) return null;
  const skipped = new Set(omit);
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const set = (key, v) => onChange({ ...safe, [key]: v });

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-muted/30 p-2">
        <p className="text-xs font-medium text-foreground">{spec.title}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{spec.note}</p>
      </div>
      {spec.groups.map((group) => (
        <div key={group.label} className="rounded-lg border border-border p-2.5 space-y-2">
          <p className="text-xs font-semibold text-foreground">{group.label}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.fields.filter((f) => !skipped.has(f.key)).map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2 space-y-1" : "space-y-1"}>
                <Label className="text-[11px] text-muted-foreground leading-snug">{f.label}</Label>
                {f.type === "select" && (
                  <Select value={safe[f.key] || undefined} onValueChange={(v) => set(f.key, v)}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o} value={o} className="text-xs">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {f.type === "number" && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={safe[f.key] ?? ""}
                      min={f.min}
                      max={f.max}
                      step={f.step || "any"}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="h-8 text-xs"
                    />
                    {f.unit && <span className="text-[10px] text-muted-foreground shrink-0">{f.unit}</span>}
                  </div>
                )}
                {f.type === "input" && (
                  <Input value={safe[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} className="h-8 text-xs" />
                )}
                {f.type === "textarea" && (
                  <Textarea rows={2} value={safe[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} className="text-xs" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}