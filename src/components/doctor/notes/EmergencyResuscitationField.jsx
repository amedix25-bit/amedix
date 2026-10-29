import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Timer, X } from "lucide-react";

// Resuscitation log — the timed events of a resuscitation, in the order they
// happened. Times are entered as documented (free text so "14:32", "T+6" and
// "per monitor clock" all survive), and AMedix computes no interval from them.
export const RESUSCITATION_EVENTS = [
  "Collapse / arrest recognised",
  "CPR started",
  "Rhythm check",
  "Pulse check",
  "Shock delivered",
  "Drug given",
  "Airway placed",
  "Vascular access obtained",
  "Fluid or blood given",
  "Ultrasound performed",
  "Return of spontaneous circulation (ROSC)",
  "Resuscitation stopped",
  "Other event",
];

const emptyRow = () => ({ time: "", event: "", detail: "" });

export default function EmergencyResuscitationField({ value, onChange }) {
  const rows = Array.isArray(value) ? value : [];

  const update = (index, patch) => onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const add = () => onChange([...rows, emptyRow()]);
  const remove = (index) => onChange(rows.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground flex items-start gap-1">
        <Timer className="w-3 h-3 mt-0.5 shrink-0" />
        One row per event, with the time as recorded during the resuscitation. AMedix stores the times exactly as
        entered, computes no intervals and evaluates no algorithm.
      </p>

      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No events recorded yet. Add the arrest, CPR start, shocks, drugs, airway and ROSC (or the reason
          resuscitation stopped) as they happened.
        </p>
      )}

      {rows.map((r, i) => (
        <div key={i} className="rounded-lg border border-border p-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              className="w-24 shrink-0"
              placeholder="Time"
              value={r.time || ""}
              onChange={(e) => update(i, { time: e.target.value })}
            />
            <Select value={r.event || undefined} onValueChange={(v) => update(i, { event: v })}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Event" />
              </SelectTrigger>
              <SelectContent>
                {RESUSCITATION_EVENTS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button type="button" onClick={() => remove(i)} aria-label="Remove event">
              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
          <Input
            placeholder="Detail — drug and dose, energy, airway confirmation, rhythm"
            value={r.detail || ""}
            onChange={(e) => update(i, { detail: e.target.value })}
          />
        </div>
      ))}

      <Button type="button" size="sm" variant="outline" onClick={add} className="w-full">
        <Plus className="w-3.5 h-3.5 mr-1" /> Add resuscitation event
      </Button>
    </div>
  );
}