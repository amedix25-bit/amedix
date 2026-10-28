import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlaskConical } from "lucide-react";
import {
  MONITORING_STATUS,
  RESULT_OPTIONS,
  evaluateMonitoring,
  getDrug,
  monitoringRequirements,
} from "@/lib/rheumTreatment";

// Baseline and interval monitoring for every documented treatment. The panel
// states what each therapy requires and records what the clinician has seen —
// a requirement is never marked complete by the system.
const STATUS_CLASS = {
  high: "border-destructive/40 bg-destructive/10 text-destructive",
  moderate: "border-amber-500/40 bg-amber-500/10 text-amber-700",
  info: "border-primary/30 bg-primary/10 text-primary",
  none: "border-border bg-muted text-muted-foreground",
};

export default function RheumMonitoringPanel({ entries = [], onChange }) {
  const rows = evaluateMonitoring(entries);
  const counts = rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
  const findRow = (drugKey, test) => rows.find((r) => r.drugKey === drugKey && r.test === test);

  const record = (entryId, test, patch) => {
    onChange(entries.map((e) => {
      if (e.id !== entryId) return e;
      const list = Array.isArray(e.monitoring) ? [...e.monitoring] : [];
      const idx = list.findIndex((m) => m.test === test);
      if (idx === -1) list.push({ test, ...patch });
      else list[idx] = { ...list[idx], ...patch };
      return { ...e, monitoring: list };
    }));
  };

  if (!entries.length) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/40 p-2.5 space-y-1.5">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <FlaskConical className="w-3.5 h-3.5 text-primary" /> Baseline requirements & monitoring
        </p>
        <p className="text-[11px] text-muted-foreground">
          Record the baseline result and the date it was last seen. Overdue, awaited and abnormal items are surfaced for
          review; nothing is inferred from a test that was never recorded.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {["abnormal", "overdue", "awaiting", "not_documented", "current"].map((key) => (
            counts[key] ? (
              <Badge key={key} variant="outline" className={`text-[10px] ${STATUS_CLASS[MONITORING_STATUS[key].level]}`}>
                {MONITORING_STATUS[key].label}: {counts[key]}
              </Badge>
            ) : null
          ))}
        </div>
      </div>

      {entries.map((entry) => {
        const reqs = monitoringRequirements(entry.drug_key || entry.drug);
        if (!reqs.length) return null;
        const drug = getDrug(entry.drug_key);
        return (
          <div key={entry.id} className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-sm font-medium">
              {entry.drug}
              <span className="text-[11px] text-muted-foreground font-normal">
                {drug && reqs[0] ? ` — reviewed every ${reqs[0].intervalMonths} months where the interval applies` : ""}
              </span>
            </p>
            <div className="space-y-2">
              {reqs.map((req) => {
                const status = findRow(entry.drug_key || entry.drug, req.test);
                const current = (Array.isArray(entry.monitoring) ? entry.monitoring : []).find((m) => m.test === req.test) || {};
                const state = status ? MONITORING_STATUS[status.status] : MONITORING_STATUS.not_documented;
                return (
                  <div key={req.test} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border-t border-border/60 pt-2 first:border-t-0 first:pt-0">
                    <div className="sm:col-span-5">
                      <Label className="text-xs">{req.label}</Label>
                      <p className="text-[10px] text-muted-foreground">{req.baseline}</p>
                    </div>
                    <div className="sm:col-span-3">
                      <Label className="text-[11px] text-muted-foreground">Last result date</Label>
                      <Input
                        type="date"
                        value={current.last_date || ""}
                        onChange={(e) => record(entry.id, req.test, { last_date: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Label className="text-[11px] text-muted-foreground">Result</Label>
                      <Select value={current.result || undefined} onValueChange={(v) => record(entry.id, req.test, { result: v })}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Not recorded" /></SelectTrigger>
                        <SelectContent>{RESULT_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-1 flex sm:justify-end">
                      <Badge variant="outline" className={`text-[10px] ${STATUS_CLASS[state.level]}`}>{state.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">Reference: {reqs[0].reference}</p>
          </div>
        );
      })}
    </div>
  );
}