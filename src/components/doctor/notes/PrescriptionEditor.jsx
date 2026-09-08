import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

const ROUTES = ["oral", "intravenous", "intramuscular", "subcutaneous", "topical", "inhalation", "rectal", "other"];
const EMPTY_MED = { name: "", dose: "", route: "", duration: "" };

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  {ROUTES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
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
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1" /> Add Medication
      </Button>
    </div>
  );
}