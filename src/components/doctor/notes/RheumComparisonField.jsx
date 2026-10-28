import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMPARISON_ROWS, TREND_OPTIONS, comparisonRow, setComparisonRow } from "@/lib/rheumFollowup";

// Previous visit versus today, domain by domain. Nothing is filled in
// automatically: a blank cell means the comparison was not documented.
export default function RheumComparisonField({ value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="hidden md:grid md:grid-cols-12 gap-2 px-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        <span className="md:col-span-3">Domain</span>
        <span className="md:col-span-3">Previously documented</span>
        <span className="md:col-span-3">At this review</span>
        <span className="md:col-span-3">Direction</span>
      </div>
      {COMPARISON_ROWS.map((row) => {
        const r = comparisonRow(value, row.key);
        const update = (patch) => onChange(setComparisonRow(value, row.key, patch));
        return (
          <div key={row.key} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:items-center rounded-md border border-border p-2 md:border-0 md:p-0">
            <p className="md:col-span-3 text-xs font-medium">{row.label}</p>
            <Input
              className="md:col-span-3 h-9 text-sm"
              placeholder="Previous"
              value={r.previous || ""}
              onChange={(e) => update({ previous: e.target.value })}
            />
            <Input
              className="md:col-span-3 h-9 text-sm"
              placeholder="Current"
              value={r.current || ""}
              onChange={(e) => update({ current: e.target.value })}
            />
            <Select value={r.trend || undefined} onValueChange={(v) => update({ trend: v })}>
              <SelectTrigger className="md:col-span-3 h-9 text-sm">
                <SelectValue placeholder="Not assessed" />
              </SelectTrigger>
              <SelectContent>
                {TREND_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}