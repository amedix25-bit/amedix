import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import EntryModal from "./EntryModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AddConditionModal({ patient, category, onClose, onAdded }) {
  const [form, setForm] = useState({ name: "", date: "", details: "" });
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.MedicalCondition.create({
        patient_id: patient.id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        category,
        name: form.name,
        date: form.date,
        details: form.details,
      });
      onAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntryModal
      title={category === "known_case" ? "Add Known Condition" : "Add Past Medical History"}
      subtitle={category === "known_case"
        ? "An established chronic or previous medical condition"
        : "A previous disease or important hospitalization"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Condition *</Label>
          <Input value={form.name} onChange={set("name")} placeholder="e.g. Type 2 Diabetes" required />
        </div>
        <div className="space-y-1.5">
          <Label>Date (if known)</Label>
          <Input type="date" value={form.date} onChange={set("date")} />
        </div>
        <div className="space-y-1.5">
          <Label>Details</Label>
          <Input value={form.details} onChange={set("details")} placeholder="Additional details or notes" />
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save
        </Button>
      </form>
    </EntryModal>
  );
}