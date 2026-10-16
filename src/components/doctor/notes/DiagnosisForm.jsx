import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Loader2, X } from "lucide-react";

const DIAGNOSIS_TYPES = ["Primary", "Secondary", "Provisional", "Differential", "Confirmed", "Chronic", "Acute", "Other"];

const EMPTY = {
  diagnosis_name: "",
  diagnosis_type: "",
  description: "",
  assessment: "",
  treatment_plan: "",
};

// Add Diagnosis form. The patient is searched and selected beforehand, and the
// diagnosis is permanently linked to that PatientID and the currently
// logged-in DoctorID. The date/time is recorded automatically on save, and
// duplicate diagnoses (same patient, same name + type) are blocked — the
// patient's record is never duplicated.
export default function DiagnosisForm({ doctorProfile, patient, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.diagnosis_name.trim()) {
      setError("Diagnosis name is required.");
      return;
    }
    if (!form.diagnosis_type) {
      setError("Select the diagnosis type.");
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      // Server-side save — the backend verifies the active check-in, blocks
      // duplicates, records the diagnosis and mirrors it into the patient's
      // known conditions.
      await base44.functions.invoke("createClinicalRecord", {
        kind: "diagnosis",
        patient_id: patient.id,
        record: {
          doctor_id: doctorProfile.id,
          doctor_name: doctorProfile.full_name,
          diagnosis_name: form.diagnosis_name.trim(),
          diagnosis_type: form.diagnosis_type,
          created_datetime: now,
          description: form.description.trim(),
          assessment: form.assessment.trim(),
          treatment_plan: form.treatment_plan.trim(),
        },
      });

      onSaved();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Could not save the diagnosis.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="font-semibold">Add Diagnosis</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Patient: <span className="font-medium text-foreground">{patient.full_name}</span> · CIN: {patient.cin}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="text-muted-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Diagnosis Name *</Label>
          <Input
            value={form.diagnosis_name}
            onChange={(e) => setForm({ ...form, diagnosis_name: e.target.value })}
            placeholder="e.g. Type 2 Diabetes Mellitus"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Diagnosis Type *</Label>
          <Select value={form.diagnosis_type} onValueChange={(v) => setForm({ ...form, diagnosis_type: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {DIAGNOSIS_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <CalendarClock className="w-3.5 h-3.5" />
        Date &amp; time is recorded automatically when the diagnosis is saved.
      </p>

      <div className="space-y-2">
        <Label>Clinical Notes / Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="Clinical description of the diagnosis"
        />
      </div>

      <div className="space-y-2">
        <Label>Assessment</Label>
        <Textarea
          value={form.assessment}
          onChange={(e) => setForm({ ...form, assessment: e.target.value })}
          rows={3}
          placeholder="Physician's assessment"
        />
      </div>

      <div className="space-y-2">
        <Label>Treatment / Management Plan</Label>
        <Textarea
          value={form.treatment_plan}
          onChange={(e) => setForm({ ...form, treatment_plan: e.target.value })}
          rows={3}
          placeholder="Treatment or management plan"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Diagnosis
      </Button>
    </form>
  );
}