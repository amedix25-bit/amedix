import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import EntryModal from "./EntryModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const ROUTES = ["oral", "intravenous", "intramuscular", "subcutaneous", "topical", "inhalation", "rectal", "other"];

export default function AddMedicationModal({ patient, onClose, onAdded }) {
  const [form, setForm] = useState({
    name: "",
    dose: "",
    frequency: "",
    route: "oral",
    start_date: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.Medication.create({
        patient_id: patient.id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        ...form,
      });
      onAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntryModal title="Add Medication" subtitle="Record a medication you are currently taking" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Medication name *</Label>
          <Input value={form.name} onChange={set("name")} placeholder="e.g. Metformin" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Dose</Label>
            <Input value={form.dose} onChange={set("dose")} placeholder="e.g. 500 mg" />
          </div>
          <div className="space-y-1.5">
            <Label>Frequency</Label>
            <Input value={form.frequency} onChange={set("frequency")} placeholder="e.g. Twice daily" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Route</Label>
            <Select value={form.route} onValueChange={(v) => setForm((s) => ({ ...s, route: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROUTES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input type="date" value={form.start_date} onChange={set("start_date")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Reason for use</Label>
          <Input value={form.reason} onChange={set("reason")} placeholder="e.g. Type 2 Diabetes" />
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save
        </Button>
      </form>
    </EntryModal>
  );
}