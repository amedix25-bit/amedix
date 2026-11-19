import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, X } from "lucide-react";
import {
  OPHTH_INVESTIGATION_MODALITIES,
  OPHTH_INVESTIGATION_EYES,
  OPHTH_INVESTIGATION_STATUSES,
  emptyOphthInvestigation,
  ophthInvestigationIncomplete,
} from "@/lib/ophthalmologyInvestigation";

// One card per investigation. Nothing is filled in for the clinician and no test
// is assumed: a test that was not done, one whose report is unavailable and one
// still awaited are recorded as different answers, and none reads as normal.
const performed = (record) => String(record?.status || "").startsWith("Performed — findings");

export default function OphthalmologyInvestigationsField({ value = [], onChange }) {
  const records = Array.isArray(value) ? value : [];

  const update = (index, patch) => onChange(records.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const remove = (index) => onChange(records.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {records.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No investigation recorded for this encounter. Add one only when it was reviewed or ordered.
        </p>
      )}

      {records.map((record, index) => {
        const warned = ophthInvestigationIncomplete(record);
        return (
          <div key={index} className="rounded-lg border border-border p-3 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium">Investigation {index + 1}</p>
              <button type="button" onClick={() => remove(index)} aria-label="Remove investigation">
                <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Test</Label>
              <Select value={record.modality || undefined} onValueChange={(v) => update(index, { modality: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select the test…" /></SelectTrigger>
                <SelectContent>
                  {OPHTH_INVESTIGATION_MODALITIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Eye examined</Label>
                <Select value={record.eye || undefined} onValueChange={(v) => update(index, { eye: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {OPHTH_INVESTIGATION_EYES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={record.date || ""} onChange={(e) => update(index, { date: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Status of this test</Label>
              <Select value={record.status || undefined} onValueChange={(v) => update(index, { status: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="What happened to this test?" /></SelectTrigger>
                <SelectContent>
                  {OPHTH_INVESTIGATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Indication — why the test was done</Label>
              <Input
                value={record.indication || ""}
                placeholder="Clinical question the test answers"
                onChange={(e) => update(index, { indication: e.target.value })}
              />
            </div>

            {performed(record) && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Findings — as reported by the test</Label>
                  <Textarea
                    rows={2}
                    value={record.findings || ""}
                    placeholder="Measurements and described findings — never a normal result unless one was reported"
                    onChange={(e) => update(index, { findings: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Interpretation by the treating clinician</Label>
                  <Textarea
                    rows={2}
                    value={record.interpretation || ""}
                    onChange={(e) => update(index, { interpretation: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Effect on management</Label>
                  <Input
                    value={record.management_impact || ""}
                    placeholder="What changed because of this result"
                    onChange={(e) => update(index, { management_impact: e.target.value })}
                  />
                </div>
              </>
            )}

            {warned && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {warned}
              </p>
            )}
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...records, emptyOphthInvestigation()])}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add investigation
      </Button>
    </div>
  );
}