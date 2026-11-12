import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import {
  HEMA_LAB_PANELS,
  HEMA_LAB_RANGE_NOTE,
  TREND_OPTIONS,
  emptyLabRow,
  derivedFlag,
  hemaAnalyte,
} from "@/lib/hematologyLabCatalogue";

// One recorded result per card. The value, unit, reference range, date, source,
// previous value and trend are stored exactly as the clinician entered them, so
// the printed note reproduces the laboratory report instead of a recalculated
// one. The abnormal flag is shown as a reading aid and can be set by hand.
const flagTone = (flag) =>
  flag === "High" || flag === "Low"
    ? "text-amber-700 dark:text-amber-400"
    : flag === "Critical"
      ? "text-destructive"
      : "text-muted-foreground";

export default function HematologyLabsField({ value = [], onChange, panels = [] }) {
  const rows = Array.isArray(value) ? value : [];
  const [pending, setPending] = useState("");
  const allowed = HEMA_LAB_PANELS.filter((p) => !panels.length || panels.includes(p.key));

  const update = (index, patch) => onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const remove = (index) => onChange(rows.filter((_, i) => i !== index));

  const add = () => {
    if (!pending) return;
    onChange([...rows, emptyLabRow(pending)]);
    setPending("");
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground leading-snug">{HEMA_LAB_RANGE_NOTE}</p>

      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No result recorded yet. Add only the results that were actually reported for this encounter.
        </p>
      )}

      {rows.map((row, index) => {
        const analyte = hemaAnalyte(row.analyte);
        const flag = row.flag || derivedFlag(row.value, row.range);
        return (
          <div key={`${row.analyte}-${index}`} className="rounded-lg border border-border p-3 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{analyte?.label || row.label || "Result"}</p>
                {analyte?.note && <p className="text-[10px] text-muted-foreground leading-snug">{analyte.note}</p>}
              </div>
              <button type="button" onClick={() => remove(index)} aria-label="Remove result">
                <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Value</Label>
                <Input value={row.value ?? ""} onChange={(e) => update(index, { value: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Date of result</Label>
                <Input type="date" value={row.date ?? ""} onChange={(e) => update(index, { date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Unit</Label>
                <Input value={row.unit ?? ""} onChange={(e) => update(index, { unit: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Reference range (as printed)</Label>
                <Input
                  value={row.range ?? ""}
                  placeholder="e.g. 130–170"
                  onChange={(e) => update(index, { range: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-medium ${flagTone(flag)}`}>
                {flag ? `Flag: ${flag}` : "Flag: not determined — enter a value and range"}
              </span>
              <Select value={row.flag || undefined} onValueChange={(v) => update(index, { flag: v })}>
                <SelectTrigger className="h-7 w-40 text-xs">
                  <SelectValue placeholder="Set flag manually" />
                </SelectTrigger>
                <SelectContent>
                  {["Low", "Normal", "High", "Critical", "Not flagged"].map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Previous value</Label>
                <Input
                  value={row.previous_value ?? ""}
                  onChange={(e) => update(index, { previous_value: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Previous date</Label>
                <Input
                  type="date"
                  value={row.previous_date ?? ""}
                  onChange={(e) => update(index, { previous_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Trend</Label>
                <Select value={row.trend || undefined} onValueChange={(v) => update(index, { trend: v })}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {TREND_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Reporting laboratory / source</Label>
                <Input value={row.source ?? ""} onChange={(e) => update(index, { source: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">Comment</Label>
              <Input
                value={row.comment ?? ""}
                placeholder="As reported — morphology comment, dilution, interference"
                onChange={(e) => update(index, { comment: e.target.value })}
              />
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={pending || undefined} onValueChange={setPending}>
          <SelectTrigger className="w-full sm:w-72 text-xs">
            <SelectValue placeholder="Choose the measurement…" />
          </SelectTrigger>
          <SelectContent>
            {allowed.map((panel) =>
              panel.analytes.map((a) => (
                <SelectItem key={a.key} value={a.key}>
                  {panel.label} · {a.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={!pending}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add result
        </Button>
      </div>
    </div>
  );
}