import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { RENAL_LAB_STATUSES, labFlag, labTrend } from "@/lib/renalLabs";

// One documented renal result. The abnormal flag and the trend are calculated
// from the values entered and are labelled as calculated — they never replace
// the laboratory's own interpretation and are left blank when a value or a
// reference range was not documented.
export default function RenalLabRow({ row, onChange, onRemove }) {
  const flag = labFlag(row);
  const trend = labTrend(row);
  const abnormal = flag === "Below reference range" || flag === "Above reference range";
  const numeric = row.analyte !== undefined && row.analyte !== "custom";

  const field = (label, key, props = {}) => (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input
        value={row[key] ?? ""}
        onChange={(e) => onChange({ [key]: e.target.value })}
        {...props}
      />
    </div>
  );

  return (
    <div className={`rounded-lg border p-2.5 space-y-2 ${abnormal ? "border-destructive/40 bg-destructive/5" : "border-border"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{row.name || "Unnamed test"}</p>
          <p className="text-[10px] text-muted-foreground">{row.panel}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onRemove} aria-label="Remove result">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Source of result</Label>
          <Select value={row.status || undefined} onValueChange={(v) => onChange({ status: v })}>
            <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {RENAL_LAB_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {field("Specimen date", "specimen_date", { type: "date" })}
        {field("Result value", "value", { placeholder: numeric ? "e.g. 210" : "e.g. Negative" })}
        {field("Units", "units")}
        {field("Reference range", "reference_range", { placeholder: "e.g. 59–104" })}
        {field("Previous value", "previous_value")}
        {field("Previous date", "previous_date", { type: "date" })}
      </div>

      {field("Comment / interpretation", "comment")}

      {(flag || trend) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {flag && (
            <span className={`px-1.5 py-0.5 rounded border font-medium ${abnormal ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground"}`}>
              {flag}
            </span>
          )}
          {trend && <span className="px-1.5 py-0.5 rounded border border-border text-muted-foreground">Trend: {trend}</span>}
          <span className="text-muted-foreground">Calculated from the entered values — not a laboratory interpretation.</span>
        </div>
      )}
    </div>
  );
}