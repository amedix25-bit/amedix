import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, FlaskConical, Plus } from "lucide-react";
import {
  RENAL_ANALYTES,
  RENAL_LAB_PANELS,
  analyteFor,
  abnormalRows,
  newRenalLabRow,
} from "@/lib/renalLabs";
import RenalLabRow from "./RenalLabRow";

// Renal results entry for the Nephrology note types. Tests are added one by
// one by the clinician — nothing is ordered, preselected or assumed. Each test
// records its own date, units, reference range, previous value and comment, so
// measured, historical, pending and unavailable results stay distinguishable.
export default function RenalLabsField({ value = [], onChange, panels }) {
  const rows = Array.isArray(value) ? value : [];
  const [choice, setChoice] = useState(undefined);
  const [customName, setCustomName] = useState("");

  const allowedPanels = panels && panels.length ? panels : RENAL_LAB_PANELS.map((p) => p.key);
  const grouped = useMemo(
    () =>
      RENAL_LAB_PANELS.filter((p) => allowedPanels.includes(p.key)).map((p) => ({
        ...p,
        analytes: RENAL_ANALYTES.filter((a) => a.panel === p.key),
      })),
    [allowedPanels.join(",")]
  );

  const selected = analyteFor(choice);
  const addSelected = () => {
    if (!selected) return;
    onChange([...rows, newRenalLabRow(selected)]);
    setChoice(undefined);
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    onChange([...rows, newRenalLabRow(null, name)]);
    setCustomName("");
  };

  const update = (index, patch) =>
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const abnormal = abnormalRows(rows);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/40 p-2.5">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <FlaskConical className="w-3.5 h-3.5 text-primary" /> Document only the results that exist — nothing is ordered
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Each test records its date, units, reference range, previous value and source, so a historical, pending or
          unavailable result is never read as today's measurement.
        </p>
      </div>

      {abnormal.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-2.5 space-y-1">
          <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {abnormal.length} result{abnormal.length === 1 ? "" : "s"} outside the documented reference range
          </p>
          {abnormal.map((r) => (
            <p key={r.id} className="text-xs">
              {r.name}: {r.value}
              {r.units ? ` ${r.units}` : ""}
              {r.reference_range ? ` (reference ${r.reference_range})` : ""}
              {r.specimen_date ? ` — ${r.specimen_date}` : ""}
            </p>
          ))}
          <p className="text-[10px] text-muted-foreground">Flag calculated from the entered value and reference range — for clinician review.</p>
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-border p-2.5">
        <Label className="text-xs">Add a result</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={choice} onValueChange={setChoice}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Choose a serum, urine or immunology test..." /></SelectTrigger>
            <SelectContent>
              {grouped.map((p) => (
                <SelectGroup key={p.key}>
                  <SelectLabel>{p.label}</SelectLabel>
                  {p.analytes.map((a) => (
                    <SelectItem key={a.key} value={a.key}>{a.name}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={addSelected} disabled={!selected} className="shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Other test not listed (type the name)"
          />
          <Button type="button" variant="outline" onClick={addCustom} disabled={!customName.trim()} className="shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add other
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No result has been documented in this section.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <RenalLabRow
              key={row.id || index}
              row={row}
              onChange={(patch) => update(index, patch)}
              onRemove={() => onChange(rows.filter((_, i) => i !== index))}
            />
          ))}
        </div>
      )}
    </div>
  );
}