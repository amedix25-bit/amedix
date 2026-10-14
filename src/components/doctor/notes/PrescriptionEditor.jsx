import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import MedicalDictationButton from "@/components/doctor/dictation/MedicalDictationButton";
import { MED_ROUTES, MEAL_OPTIONS, todayStr, computeEndDate } from "@/lib/medicationUtils";

const EMPTY_MED = {
  name: "",
  dose: "",
  route: "",
  frequency: "",
  meal: "",
  duration: "",
  notes: "",
  start_date: todayStr(),
  reason: "",
  prn: false,
  max_frequency: "",
  special_instructions: "",
  status: "active",
};

export default function PrescriptionEditor({ medications, onChange, specialty = "" }) {
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
        <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-3">
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
              <MedicalDictationButton
                value={med.name}
                onChange={(v) => update(i, "name", v)}
                specialty={specialty}
                contextLabel="Prescription — medication (drug) name"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dose</Label>
              <Input
                value={med.dose}
                onChange={(e) => update(i, "dose", e.target.value)}
                placeholder="e.g. 500 mg"
              />
              <MedicalDictationButton
                value={med.dose}
                onChange={(v) => update(i, "dose", v)}
                specialty={specialty}
                contextLabel="Prescription — medication dose"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Route of Administration</Label>
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">{med.prn ? "Max Frequency" : "Frequency"}</Label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal cursor-pointer">
                  <Checkbox checked={med.prn} onCheckedChange={(v) => update(i, "prn", v === true)} />
                  PRN (as needed)
                </label>
              </div>
              <Input
                value={med.prn ? med.max_frequency : med.frequency}
                onChange={(e) => update(i, med.prn ? "max_frequency" : "frequency", e.target.value)}
                placeholder={med.prn ? "e.g. Max 3 times daily" : "e.g. 3 times daily"}
              />
              <MedicalDictationButton
                value={med.prn ? med.max_frequency : med.frequency}
                onChange={(v) => update(i, med.prn ? "max_frequency" : "frequency", v)}
                specialty={specialty}
                contextLabel="Prescription — medication frequency"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Before / After Food</Label>
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
              <Label className="text-xs">Medication Status</Label>
              <Select value={med.status} onValueChange={(v) => update(i, "status", v)}>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Duration (days)</Label>
              <Input
                type="number"
                min="1"
                value={med.duration}
                onChange={(e) => update(i, "duration", e.target.value)}
                placeholder="e.g. 7"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={med.start_date}
                onChange={(e) => update(i, "start_date", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date (auto)</Label>
              <Input value={computeEndDate(med.start_date, med.duration)} readOnly disabled placeholder="—" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Indication / Reason</Label>
            <Input
              value={med.reason}
              onChange={(e) => update(i, "reason", e.target.value)}
              placeholder="e.g. Chest infection"
            />
            <MedicalDictationButton
              value={med.reason}
              onChange={(v) => update(i, "reason", v)}
              specialty={specialty}
              contextLabel="Prescription — indication / reason"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Doctor's Instructions / Notes</Label>
            <Textarea
              value={med.notes}
              onChange={(e) => update(i, "notes", e.target.value)}
              rows={2}
              placeholder="e.g. Complete the full course and take with water."
            />
            <MedicalDictationButton
              value={med.notes}
              onChange={(v) => update(i, "notes", v)}
              specialty={specialty}
              contextLabel="Prescription — doctor's instructions"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Special Instructions</Label>
            <Textarea
              value={med.special_instructions}
              onChange={(e) => update(i, "special_instructions", e.target.value)}
              rows={2}
              placeholder="Any special instructions for the patient to follow"
            />
            <MedicalDictationButton
              value={med.special_instructions}
              onChange={(v) => update(i, "special_instructions", v)}
              specialty={specialty}
              contextLabel="Prescription — special instructions"
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1" /> Add Medication
      </Button>
    </div>
  );
}