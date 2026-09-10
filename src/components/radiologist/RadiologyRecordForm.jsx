import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";

const ALLOWED_TYPES = ["pdf", "jpg", "jpeg", "png", "webp"];

// Form for creating a radiology record: examination information, date/time,
// findings/report, and an upload of the radiology PDF or medical image
// (PDF, JPG, JPEG, PNG, WEBP).
export default function RadiologyRecordForm({ patient, radiologistProfile, user, onSaved, onCancel }) {
  const [form, setForm] = useState({
    examination_type: "",
    examination_datetime: "",
    findings: "",
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.examination_type.trim()) {
      setError("Examination type is required.");
      return;
    }
    if (!form.examination_datetime) {
      setError("Select the date and time of the examination.");
      return;
    }
    if (!file) {
      setError("Upload the radiology PDF or image file.");
      return;
    }
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      setError("Only PDF, JPG, JPEG, PNG or WEBP files are supported.");
      return;
    }
    setSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.RadiologyRecord.create({
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        radiologist_id: radiologistProfile.id,
        radiologist_user_id: user.id,
        radiologist_name: radiologistProfile.full_name,
        examination_type: form.examination_type.trim(),
        examination_datetime: new Date(form.examination_datetime).toISOString(),
        findings: form.findings.trim(),
        file_url,
        file_name: file.name,
        file_type: ext,
        created_datetime: new Date().toISOString(),
      });
      onSaved();
    } catch (err) {
      console.error(err);
      setError("Could not save the radiology record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="font-semibold">New Radiology Record — {patient.full_name}</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Examination Type *</Label>
          <Input
            placeholder="e.g. Chest X-Ray, MRI Brain, CT Abdomen"
            value={form.examination_type}
            onChange={(e) => setForm({ ...form, examination_type: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Date / Time of Examination *</Label>
          <Input
            type="datetime-local"
            value={form.examination_datetime}
            onChange={(e) => setForm({ ...form, examination_datetime: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Findings / Report</Label>
        <Textarea
          rows={4}
          placeholder="Radiological findings and report..."
          value={form.findings}
          onChange={(e) => setForm({ ...form, findings: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Radiology PDF or Image *</Label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="block w-full text-sm text-muted-foreground border border-input rounded-md px-3 py-2 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:text-sm"
        />
        {file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Save Record
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}