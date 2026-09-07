import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import EntryModal from "./EntryModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function AddAllergyModal({ patient, onClose, onAdded }) {
  const [form, setForm] = useState({ allergen: "", allergy_type: "drug", reaction: "", severity: "mild" });
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.Allergy.create({
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
    <EntryModal title="Add Allergy" subtitle="Record an allergy and its reaction" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Allergen *</Label>
          <Input value={form.allergen} onChange={set("allergen")} placeholder="e.g. Penicillin" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.allergy_type} onValueChange={(v) => setForm((s) => ({ ...s, allergy_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="drug">Drug</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Severity</Label>
            <Select value={form.severity} onValueChange={(v) => setForm((s) => ({ ...s, severity: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Reaction</Label>
          <Input value={form.reaction} onChange={set("reaction")} placeholder="e.g. Skin rash, swelling" />
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save
        </Button>
      </form>
    </EntryModal>
  );
}