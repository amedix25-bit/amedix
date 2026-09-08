import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Pill } from "lucide-react";
import {
  MEAL_OPTIONS,
  ROUTE_OPTIONS,
  todayStr,
  computeEndDate,
  medicationRecordFromForm,
} from "@/lib/medicationUtils";

const FREQUENCY_CHOICES = ["Once daily", "Twice daily", "Three times daily", "Every X hours", "PRN / As needed"];

export default function DoctorMedicationForm({ patient, onSaved, onCancel }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    dose: "",
    route: "oral",
    frequency: "",
    everyHours: "",
    meal: "",
    duration: "",
    start_date: todayStr(),
    reason: "",
    notes: "",
    max_frequency: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isPrn = form.frequency === "PRN / As needed";
  const isEveryX = form.frequency === "Every X hours";
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Drug name is required.");
      return;
    }
    setSaving(true);
    try {
      const frequency = isPrn
        ? ""
        : isEveryX
          ? `Every ${form.everyHours || "X"} hours`
          : form.frequency;
      const rec = medicationRecordFromForm({ ...form, frequency, prn: isPrn }, { patient });
      await base44.entities.Medication.create(rec);
      toast({
        title: "Medication added",
        description: `${form.name.trim()} was added to ${patient.full_name}'s medication record.`,
      });
      onSaved();
    } catch (err) {
      console.error(err);
      setError("Could not save the medication.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Pill className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Add Medication</h3>
          <p className="text-xs text-muted-foreground">
            {patient.full_name} · {patient.cin}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        The medication is added to the patient's medication record as doctor-prescribed.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Drug Name *</Label>
          <Input value={form.name} onChange={set("name")} placeholder="e.g. Amoxicillin" required />
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
              {ROUTE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Frequency</Label>
          <Select value={form.frequency} onValueChange={(v) => setForm((s) => ({ ...s, frequency: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_CHOICES.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isEveryX && (
          <div className="space-y-1.5">
            <Label>Every — hours</Label>
            <Input type="number" min="1" value={form.everyHours} onChange={set("everyHours")} placeholder="e.g. 6" />
          </div>
        )}
        {isPrn && (
          <div className="space-y-1.5">
            <Label>PRN Maximum Dose / Frequency</Label>
            <Input
              value={form.max_frequency}
              onChange={set("max_frequency")}
              placeholder="e.g. Max 3 times daily"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Before / After Food</Label>
          <Select value={form.meal} onValueChange={(v) => setForm((s) => ({ ...s, meal: v }))}>
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Duration (days)</Label>
          <Input type="number" min="1" value={form.duration} onChange={set("duration")} placeholder="e.g. 7" />
        </div>
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input type="date" value={form.start_date} onChange={set("start_date")} />
        </div>
        <div className="space-y-1.5">
          <Label>End Date (auto)</Label>
          <Input value={computeEndDate(form.start_date, form.duration)} readOnly disabled placeholder="—" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Indication / Reason for Medication</Label>
        <Input value={form.reason} onChange={set("reason")} placeholder="e.g. Chest infection" />
      </div>

      <div className="space-y-1.5">
        <Label>Doctor's Instructions / Notes</Label>
        <Textarea
          value={form.notes}
          onChange={set("notes")}
          rows={2}
          placeholder="e.g. Complete the full course and take with water."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Medication Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Medication
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}