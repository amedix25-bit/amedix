import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { normalizeLabStatus } from "@/lib/labRequestUtils";
import { X, Search, Loader2, FlaskConical, Image as ImageIcon, ArrowRight } from "lucide-react";

const EMPTY = {
  patient_cin: "",
  encounter_datetime: "",
  location: "",
  history: "",
  vital_signs: "",
  physical_examination: "",
  diagnosis: "",
  prescription: "",
  interventions: "",
  biopsy: "",
  recommendations: "",
};

export default function ClinicalNoteForm({ doctorProfile, onSaved, onCancel, onNavigateTab }) {
  const [form, setForm] = useState(EMPTY);
  const [patient, setPatient] = useState(null);
  const [labRequests, setLabRequests] = useState([]);
  const [imagingRequests, setImagingRequests] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState(new Set());
  const [selectedImaging, setSelectedImaging] = useState(new Set());
  const [finding, setFinding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const findPatient = async () => {
    setError("");
    setPatient(null);
    setLabRequests([]);
    setImagingRequests([]);
    setSelectedLabs(new Set());
    setSelectedImaging(new Set());
    if (!form.patient_cin.trim()) return;
    setFinding(true);
    try {
      const patients = await base44.entities.PatientProfile.filter({ cin: form.patient_cin.toUpperCase() });
      if (patients.length === 0) {
        setError("Patient not found. Please check the CIN.");
        return;
      }
      const p = patients[0];
      setPatient(p);
      const [labs, imaging] = await Promise.all([
        base44.entities.LabRequest.filter({ patient_id: p.id, doctor_id: doctorProfile.id }, "-date_requested"),
        base44.entities.ImagingRequest.filter({ patient_id: p.id, doctor_id: doctorProfile.id }, "-date_requested"),
      ]);
      setLabRequests(labs);
      setImagingRequests(imaging);
    } catch (err) {
      console.error(err);
      setError("Could not load the patient's requests.");
    } finally {
      setFinding(false);
    }
  };

  const toggleLab = (id) =>
    setSelectedLabs((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleImaging = (id) =>
    setSelectedImaging((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!patient) {
      setError("Find the patient first.");
      return;
    }
    if (!form.location) {
      setError("Select the location of the encounter.");
      return;
    }
    if (!form.diagnosis.trim()) {
      setError("Final diagnosis is required.");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.ClinicalNote.create({
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        doctor_name: doctorProfile.full_name,
        date: new Date().toISOString().slice(0, 10),
        encounter_datetime: form.encounter_datetime ? new Date(form.encounter_datetime).toISOString() : "",
        location: form.location,
        history: form.history,
        vital_signs: form.vital_signs,
        physical_examination: form.physical_examination,
        diagnosis: form.diagnosis,
        prescription: form.prescription,
        interventions: form.interventions,
        biopsy: form.biopsy,
        lab_request_ids: [...selectedLabs],
        imaging_request_ids: [...selectedImaging],
        recommendations: form.recommendations,
      });
      onSaved();
    } catch (err) {
      console.error(err);
      setError("Could not save the clinical note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Write Clinical Note</h3>
        <button type="button" onClick={onCancel} className="text-muted-foreground"><X className="w-5 h-5" /></button>
      </div>

      <div className="space-y-2">
        <Label>Patient CIN *</Label>
        <div className="flex gap-2">
          <Input
            value={form.patient_cin}
            onChange={(e) => setForm({ ...form, patient_cin: e.target.value })}
            placeholder="CIN-XXXXXX"
          />
          <Button type="button" variant="outline" onClick={findPatient} disabled={finding}>
            {finding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Find Patient
          </Button>
        </div>
        {patient && (
          <p className="text-sm text-muted-foreground">
            Patient: <span className="font-medium text-foreground">{patient.full_name}</span> · CIN: {patient.cin}
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date/Time Patient Was Seen *</Label>
          <Input
            type="datetime-local"
            value={form.encounter_datetime}
            onChange={(e) => setForm({ ...form, encounter_datetime: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Location of Encounter *</Label>
          <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
            <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
            <SelectContent>
              {["ER", "Clinic", "Ward", "ICU", "Other"].map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>History</Label>
        <Textarea
          value={form.history}
          onChange={(e) => setForm({ ...form, history: e.target.value })}
          rows={3}
          placeholder="Presenting complaint and history"
        />
      </div>

      <div className="space-y-2">
        <Label>Vital Signs</Label>
        <Textarea
          value={form.vital_signs}
          onChange={(e) => setForm({ ...form, vital_signs: e.target.value })}
          rows={2}
          placeholder="e.g. BP 120/80, HR 78, Temp 37.0°C, RR 16"
        />
      </div>

      <div className="space-y-2">
        <Label>Physical Examination</Label>
        <Textarea
          value={form.physical_examination}
          onChange={(e) => setForm({ ...form, physical_examination: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Final Diagnosis *</Label>
        <Input
          value={form.diagnosis}
          onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
          required
        />
      </div>

      <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-4">
        <p className="text-sm font-semibold">Management</p>

        <div className="space-y-2">
          <Label>Prescriptions</Label>
          <Textarea
            value={form.prescription}
            onChange={(e) => setForm({ ...form, prescription: e.target.value })}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Interventions</Label>
          <Textarea
            value={form.interventions}
            onChange={(e) => setForm({ ...form, interventions: e.target.value })}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Biopsy (if required)</Label>
          <Textarea
            value={form.biopsy}
            onChange={(e) => setForm({ ...form, biopsy: e.target.value })}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="flex items-center gap-1.5"><FlaskConical className="w-4 h-4 text-primary" />Lab Requests</Label>
            {onNavigateTab && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onNavigateTab("labs")}>
                Go to Lab Requests <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          {!patient ? (
            <p className="text-xs text-muted-foreground">Find the patient to link their lab requests.</p>
          ) : labRequests.length === 0 ? (
            <p className="text-xs text-muted-foreground">No lab requests for this patient yet.</p>
          ) : (
            <div className="space-y-1.5">
              {labRequests.map((r) => (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleLab(r.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleLab(r.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-accent/50 transition-colors ${
                    selectedLabs.has(r.id) ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <Checkbox checked={selectedLabs.has(r.id)} className="pointer-events-none" tabIndex={-1} />
                  <span className="flex-1 truncate">
                    {r.request_id || "Lab request"} · {r.date_requested}
                  </span>
                  <LabStatusBadge status={normalizeLabStatus(r.status)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-primary" />Imaging Requests</Label>
            {onNavigateTab && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onNavigateTab("imaging")}>
                Go to Imaging <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          {!patient ? (
            <p className="text-xs text-muted-foreground">Find the patient to link their imaging requests.</p>
          ) : imagingRequests.length === 0 ? (
            <p className="text-xs text-muted-foreground">No imaging requests for this patient yet.</p>
          ) : (
            <div className="space-y-1.5">
              {imagingRequests.map((r) => (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleImaging(r.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleImaging(r.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-accent/50 transition-colors ${
                    selectedImaging.has(r.id) ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <Checkbox checked={selectedImaging.has(r.id)} className="pointer-events-none" tabIndex={-1} />
                  <span className="flex-1 truncate">
                    {r.request_id || r.scan_type} · {r.date_requested}
                  </span>
                  {r.pdf_url && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); window.open(r.pdf_url, "_blank"); }}
                      className="text-xs text-primary underline"
                    >
                      PDF
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
        <Label className="text-primary">Doctor's Recommendations</Label>
        <Textarea
          value={form.recommendations}
          onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
          rows={3}
          placeholder="Recommendations, follow-up instructions, lifestyle advice, referrals..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Clinical Note
      </Button>
    </form>
  );
}