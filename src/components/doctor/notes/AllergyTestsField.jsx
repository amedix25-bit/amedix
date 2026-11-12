import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import {
  ALLERGY_FLAGS,
  ALLERGY_TEST_NOTE,
  ALLERGY_TEST_PANELS,
  allergyTest,
  derivedFlag,
  emptyTestRow,
} from "@/lib/allergyTests";

const flagTone = (flag) =>
  flag === "High" || flag === "Low" || flag === "Borderline"
    ? "text-warning"
    : flag === "Positive" || flag === "Critical"
      ? "text-critical"
      : flag === "Negative" || flag === "Normal"
        ? "text-success"
        : "text-muted-foreground";

// Test results are entered, never generated. A row exists only because a
// clinician added it after a result was reported, and every value, unit,
// reference range and date is stored exactly as it was reported. The flag is a
// reading aid derived from the value and range, and a clinician can set or clear
// it; the printed record shows what is recorded here.
export default function AllergyTestsField({ value, onChange, encounterId }) {
  const rows = Array.isArray(value) ? value : [];
  const [panel, setPanel] = useState("");
  const [test, setTest] = useState("");

  const update = (index, patch) => onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const remove = (index) => onChange(rows.filter((_, i) => i !== index));

  const panelDef = ALLERGY_TEST_PANELS.find((p) => p.key === panel);
  const chosen = allergyTest(test);

  const add = () => {
    if (!test) return;
    const row = emptyTestRow(test, encounterId);
    if (!row) return;
    onChange([...rows, row]);
    setTest("");
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground leading-snug">{ALLERGY_TEST_NOTE}</p>

      <div className="rounded-lg border border-border p-2.5 space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px]">Test group</Label>
            <Select
              value={panel || undefined}
              onValueChange={(next) => {
                setPanel(next);
                setTest("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a group…" />
              </SelectTrigger>
              <SelectContent>
                {ALLERGY_TEST_PANELS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Test</Label>
            <Select value={test || undefined} onValueChange={setTest} disabled={!panelDef}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={panelDef ? "Select the test…" : "Choose a group first"} />
              </SelectTrigger>
              <SelectContent>
                {(panelDef?.tests || []).map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {panelDef?.note && <p className="text-[10px] text-muted-foreground leading-snug">{panelDef.note}</p>}
        {chosen?.note && <p className="text-[10px] text-muted-foreground leading-snug">{chosen.note}</p>}
        <Button type="button" size="sm" variant="outline" onClick={add} disabled={!test}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add reported result
        </Button>
      </div>

      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No result recorded. Add only the results that were actually reported for this patient — a test that has not
          been reported stays absent, not normal.
        </p>
      )}

      {rows.map((row, index) => {
        const label = row.label || allergyTest(row.test_key)?.label || "Test";
        const flag = row.flag || derivedFlag(row.value, row.range);
        return (
          <div key={`${row.test_key}-${index}`} className="rounded-lg border border-border p-3 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium min-w-0">{label}</p>
              <button type="button" onClick={() => remove(index)} aria-label="Remove result">
                <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Result / value</Label>
                <Input value={row.value ?? ""} onChange={(e) => update(index, { value: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Unit</Label>
                <Input value={row.unit ?? ""} onChange={(e) => update(index, { unit: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Reference range (as printed)</Label>
                <Input value={row.range ?? ""} onChange={(e) => update(index, { range: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Date of result</Label>
                <Input type="date" value={row.date ?? ""} onChange={(e) => update(index, { date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Ordering clinician</Label>
                <Input value={row.ordered_by ?? ""} onChange={(e) => update(index, { ordered_by: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Reporting source</Label>
                <Input
                  value={row.result_source ?? ""}
                  placeholder="Laboratory / device / unit"
                  onChange={(e) => update(index, { result_source: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-medium ${flagTone(flag)}`}>{flag || "No flag"}</span>
              <Select value={row.flag || "auto"} onValueChange={(next) => update(index, { flag: next === "auto" ? "" : next })}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue placeholder="Flag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic from range</SelectItem>
                  {ALLERGY_FLAGS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">Interpretation (clinician&apos;s own)</Label>
              <Input
                value={row.interpretation ?? ""}
                placeholder="Read with the documented reaction — a positive test is not a diagnosis"
                onChange={(e) => update(index, { interpretation: e.target.value })}
              />
            </div>

            <p className="text-[10px] text-muted-foreground">
              Recorded within this note, which is attached to the patient&apos;s encounter and unified record.
            </p>
          </div>
        );
      })}
    </div>
  );
}