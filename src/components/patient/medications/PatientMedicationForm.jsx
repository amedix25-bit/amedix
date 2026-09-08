import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { MED_ROUTES, MEAL_OPTIONS } from "@/lib/medicationUtils";

const EMPTY = { name: "", dose: "", route: "oral", frequency: "", meal_timing: "", duration: "", patient_notes: "" };

export default function PatientMedicationForm({ initial, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name || "",
          dose: initial.dose || "",
          route: initial.route || "oral",
          frequency: initial.frequency || "",
          meal_timing: initial.meal_timing || "",
          duration: (initial.duration || "").replace(" days", ""),
          patient_notes: initial.patient_notes || "",
        }
      : EMPTY
  );
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{initial ? "Edit Medication" : "Add Medication Information"}</p>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Drug Name *</Label>
          <Input value={form.name} onChange={set("name")} placeholder="e.g. Metformin" required />
        </div>
        <div className="space-y-1.5">
          <Label>Dose</Label>
          <Input value={form.dose} onChange={set("dose")} placeholder="e.g. 500 mg" />
        </div>
        <div className="space-y-1.5">
          <Label>Route of Administration</Label>
          <Select value={form.route} onValueChange={(v) => setForm((s) => ({ ...s, route: v }))}>
            <SelectTrigger>
              <SelectValue />
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
        <div className="space-y-1.5">
          <Label>Frequency</Label>
          <Input value={form.frequency} onChange={set("frequency")} placeholder="e.g. Twice daily" />
        </div>
        <div className="space-y-1.5">
          <Label>Before or After Meal</Label>
          <Select value={form.meal_timing} onValueChange={(v) => setForm((s) => ({ ...s, meal_timing: v }))}>
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
        <div className="space-y-1.5">
          <Label>Duration (if known)</Label>
          <Input value={form.duration} onChange={set("duration")} placeholder="e.g. 14 days" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Additional Notes</Label>
          <Textarea value={form.patient_notes} onChange={set("patient_notes")} rows={2} />
        </div>
      </div>
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {initial ? "Save Changes" : "Add Medication"}
      </Button>
    </form>
  );
}