import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { MED_ROUTES, MEAL_OPTIONS } from "@/lib/medicationUtils";

const EMPTY_MED = { name: "", dose: "", route: "", frequency: "", meal: "", duration: "", notes: "" };

export default function PrescriptionEditor({ medications, onChange }) {
  const update = (i, field, value) =>
    onChange(medications.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  const add = () => onChange([...medications, { ...EMPTY_MED }]);
  const remove = (i) => onChange(medications.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {medications.length === 0 && (
        <p className="text-xs text-muted-foreground">No medications prescribed yet.</p>
      )}
      {medications.map((med, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Medication {i + 1}</p>
            <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Drug Name *</Label>
              <Input
                value={med.name}
                onChange={(e) => update(i, "name", e.target.value)}
                placeholder="e.g. Amoxicillin"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dose</Label>
              <Input
                value={med.dose}
                onChange={(e) => update(i, "dose", e.target.value)}
                placeholder="e.g. 500 mg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Route</Label>
              <Select value={med.route} onValueChange={(v) => update(i, "route", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {MED_ROUTES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Frequency</Label>
              <Input
                value={med.frequency}
                onChange={(e) => update(i, "frequency", e.target.value)}
                placeholder="e.g. 3 times daily"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Before / After Meal</Label>
              <Select value={med.meal} onValueChange={(v) => update(i, "meal", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duration (days)</Label>
              <Input
                type="number"
                min="1"
                value={med.duration}
                onChange={(e) => update(i, "duration", e.target.value)}
                placeholder="e.g. 14"
              />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <Label className="text-xs">Doctor's Notes</Label>
              <Textarea
                value={med.notes}
                onChange={(e) => update(i, "notes", e.target.value)}
                rows={2}
                placeholder="e.g. Take with plenty of water."
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1" /> Add Medication
      </Button>
    </div>
  );
}