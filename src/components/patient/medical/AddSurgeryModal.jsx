import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import EntryModal from "./EntryModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AddSurgeryModal({ patient, onClose, onAdded }) {
  const [form, setForm] = useState({
    surgery_type: "",
    surgery_date: "",
    reason: "",
    complications: "",
    outcome: "",
    hospitalization_duration: "",
    anesthesia_history: "",
    anesthesia_complications: "",
    other_procedures: "",
    transfusion_count: "",
    transfusion_type: "",
    transfusion_amount: "",
    transfusion_reason: "",
    transfusion_timing: "",
    transfusion_reactions: "",
    implants_devices: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const field = (name, label, placeholder = "") => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={form[name]} onChange={set(name)} placeholder={placeholder} />
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.SurgicalHistory.create({
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
    <EntryModal title="Add Past Surgery" subtitle="Record a previous surgery or procedure in full detail" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type of surgery *</Label>
            <Input value={form.surgery_type} onChange={set("surgery_type")} placeholder="e.g. Appendectomy" required />
          </div>
          {field("surgery_date", "Date of surgery")}
          {field("reason", "Reason / indication", "e.g. Acute appendicitis")}
          {field("hospitalization_duration", "Duration of hospitalization", "e.g. 3 days")}
          {field("complications", "Complications")}
          {field("outcome", "Recovery / outcome", "e.g. Full recovery")}
        </div>

        <div className="rounded-lg border border-border p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Anesthesia</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {field("anesthesia_history", "Anesthesia history", "e.g. General anesthesia")}
            {field("anesthesia_complications", "Anesthesia complications")}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {field("other_procedures", "Other procedures", "e.g. Endoscopy, biopsy")}
          {field("implants_devices", "Implants / medical devices", "e.g. Orthopedic screws")}
        </div>

        <div className="rounded-lg border border-border p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Blood transfusion history</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {field("transfusion_count", "Number of transfusions")}
            {field("transfusion_type", "Blood / component type", "e.g. Packed RBCs")}
            {field("transfusion_amount", "Amount", "e.g. 2 units")}
            {field("transfusion_reason", "Reason for transfusion")}
            {field("transfusion_timing", "Timing relative to surgery", "e.g. During surgery")}
            {field("transfusion_reactions", "Reactions / complications", "e.g. None")}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Surgery
        </Button>
      </form>
    </EntryModal>
  );
}