import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PrescriptionEditor from "@/components/doctor/notes/PrescriptionEditor";
import ExaminationsTab from "@/components/doctor/examination/ExaminationsTab";
import VitalSignsForm from "@/components/doctor/notes/VitalSignsForm";
import { mealLabel, medicationRecordFromForm } from "@/lib/medicationUtils";
import { fetchCheckInStatus, LOCKED_MESSAGE } from "@/lib/checkInGate";
import DocumentFields from "@/components/doctor/encounters/DocumentFields";
import { getSpecialtyDocs, getDocDef, SPECIALTY_KEYS } from "@/lib/specialtyDocuments";
import { X, Search, Loader2, FlaskConical, Image as ImageIcon, ArrowRight, Plus, Lock, CheckCircle2 } from "lucide-react";

// "General Clinical Note" — the universal free-text note with no
// specialty-specific structured template.
const GENERAL_KEY = "__general__";

const EMPTY = {
  patient_cin: "",
  encounter_datetime: "",
  location: "",
  history: "",
  vitals: { temperature: "", pulse: "", respiratory_rate: "", blood_pressure: "", spo2: "" },
  physical_examination: "",
  provisional_diagnoses: [""],
  prescription: "",
  interventions: "",
  biopsy: "",
  recommendations: "",
};

export default function ClinicalNoteForm({ doctorProfile, onSaved, onCancel, onNavigateTab, preselectedPatient }) {
  const [form, setForm] = useState(EMPTY);
  const [patient, setPatient] = useState(preselectedPatient || null);
  const [selectedLabs, setSelectedLabs] = useState(new Set());
  const [selectedImaging, setSelectedImaging] = useState(new Set());
  const [medications, setMedications] = useState([]);
  const [finding, setFinding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draftId, setDraftId] = useState(null);
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // Specialty-aware note structure — AMedix automatically detects the
  // doctor's verified specialty from their profile; the doctor is NEVER
  // asked to select it again. Only the doctor's own specialty's note types
  // are offered, and choosing one loads its structured template.
  const mySpecialty = doctorProfile?.specialization || "";
  const myDocs = mySpecialty ? getSpecialtyDocs(mySpecialty) : [];
  const mySpecialtyKey = mySpecialty ? SPECIALTY_KEYS[mySpecialty] : "";
  const [docType, setDocType] = useState(
    () => (myDocs.find((d) => d.key.includes("consultation")) || myDocs[0] || { key: GENERAL_KEY }).key
  );
  const [dataValues, setDataValues] = useState({});
  const activeDef = docType && docType !== GENERAL_KEY ? getDocDef(docType) : null;
  const hasSpecialtyFields = !!(activeDef && activeDef.fields && activeDef.fields.length > 0);
  // In specialty mode the note displays ONLY the specialty's own fields —
  // the universal generic sections (History, Vital Signs, Physical
  // Examination, Interventions, Biopsy, Recommendations) are replaced by the
  // specialty-specific structure. Diagnosis, prescriptions and the
  // lab/imaging links stay — they are the platform-wide clinical record.
  const isGeneralNote = !activeDef;
  const [photoUris, setPhotoUris] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  // Backend-verified check-in gate — the clinical functions stay locked until
  // the patient is checked in at the doctor's hospital.
  const [checkedIn, setCheckedIn] = useState(false);
  const [gateLoading, setGateLoading] = useState(false);

  const loadGate = async (patientId) => {
    setGateLoading(true);
    const s = await fetchCheckInStatus(patientId);
    setCheckedIn(!!s.checked_in);
    setGateLoading(false);
  };

  const restoreDraft = (d) => {
    setDraftId(d.id);
    if (d.specialty_doc_type) setDocType(d.specialty_doc_type);
    if (d.specialty_data_values) setDataValues(d.specialty_data_values);
    if (Array.isArray(d.photo_file_uris)) setPhotoUris(d.photo_file_uris);
    if (d.form_data)
      setForm((f) => {
        const merged = { ...f, ...d.form_data };
        if (!Array.isArray(merged.provisional_diagnoses) || merged.provisional_diagnoses.length === 0) {
          merged.provisional_diagnoses = merged.diagnosis ? [merged.diagnosis] : [""];
        }
        return merged;
      });
    if (Array.isArray(d.medications)) setMedications(d.medications);
    if (Array.isArray(d.selected_lab_request_ids)) setSelectedLabs(new Set(d.selected_lab_request_ids));
    if (Array.isArray(d.selected_imaging_request_ids)) setSelectedImaging(new Set(d.selected_imaging_request_ids));
  };

  useEffect(() => {
    if (!preselectedPatient) return;
    setPatient(preselectedPatient);
    const loadDraft = async () => {
      try {
        const drafts = await base44.entities.ClinicalNoteDraft.filter({ patient_id: preselectedPatient.id, doctor_id: doctorProfile.id });
        if (drafts.length > 0) restoreDraft(drafts[0]);
      } catch (err) {
        console.error(err);
      }
    };
    loadDraft();
    loadGate(preselectedPatient.id);
  }, [preselectedPatient, doctorProfile]);

  const findPatient = async () => {
    setError("");
    setPatient(null);
    setDraftId(null);
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
      loadGate(p.id);
      const drafts = await base44.entities.ClinicalNoteDraft.filter({ patient_id: p.id, doctor_id: doctorProfile.id });
      if (drafts.length > 0) restoreDraft(drafts[0]);
    } catch (err) {
      console.error(err);
      setError("Could not load the patient's requests.");
    } finally {
      setFinding(false);
    }
  };

  // Clinical photographs (e.g. dermatology lesion photos) — uploaded to
  // PRIVATE storage and attached to the note, following the same permission,
  // access control and audit rules as all other clinical information.
  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 6 - photoUris.length);
    if (!files.length) return;
    setUploadingPhotos(true);
    try {
      const uris = [];
      for (const f of files) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: f });
        uris.push(file_uri);
      }
      setPhotoUris((s) => [...s, ...uris]);
    } catch (err) {
      setError("Could not upload the photographs. Please try again.");
    } finally {
      setUploadingPhotos(false);
      e.target.value = "";
    }
  };

  const saveDraft = async () => {
    const payload = {
      patient_id: patient.id,
      doctor_id: doctorProfile.id,
      patient_cin: patient.cin,
      patient_name: patient.full_name,
      form_data: { ...form },
      specialty_doc_type: docType,
      specialty_data_values: dataValues,
      photo_file_uris: photoUris,
      medications,
      selected_lab_request_ids: [...selectedLabs],
      selected_imaging_request_ids: [...selectedImaging],
    };
    if (draftId) {
      await base44.entities.ClinicalNoteDraft.update(draftId, payload);
    } else {
      const created = await base44.entities.ClinicalNoteDraft.create(payload);
      setDraftId(created.id);
    }
  };

  const saveDraftAndContinueToLabs = async () => {
    if (!patient) {
      setError("Find the patient first.");
      return;
    }
    setSavingDraft(true);
    setError("");
    try {
      await saveDraft();
      setShowDraftConfirm(false);
      onNavigateTab("labs", { patient });
    } catch (err) {
      console.error(err);
      setError("Could not save the draft.");
    } finally {
      setSavingDraft(false);
    }
  };

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
    const diagnoses = (form.provisional_diagnoses || []).map((d) => d.trim()).filter(Boolean);
    if (diagnoses.length === 0) {
      setError("Provisional diagnosis is required.");
      return;
    }
    const meds = medications.filter((m) => m.name.trim());
    const prescriptionSummary = meds
      .map((m) =>
        `${m.name.trim()}` +
        `${m.dose.trim() ? ` — Dose: ${m.dose.trim()}` : ""}` +
        `${m.route ? ` — Route: ${m.route}` : ""}` +
        `${m.prn
          ? ` — PRN (as needed)${(m.max_frequency || "").trim() ? ` · Max: ${(m.max_frequency || "").trim()}` : ""}`
          : `${(m.frequency || "").trim() ? ` — Frequency: ${(m.frequency || "").trim()}` : ""}`}` +
        `${m.meal ? ` — ${mealLabel(m.meal)}` : ""}` +
        `${m.duration ? ` — Duration: ${m.duration} days` : ""}` +
        `${(m.reason || "").trim() ? ` — Indication: ${(m.reason || "").trim()}` : ""}` +
        `${m.notes.trim() ? ` — Notes: ${m.notes.trim()}` : ""}` +
        `${(m.special_instructions || "").trim() ? ` — Special instructions: ${(m.special_instructions || "").trim()}` : ""}`
      )
      .join("\n");
    const v = form.vitals || {};
    const vitalsSummary = [
      v.blood_pressure ? `BP: ${v.blood_pressure} mmHg` : "",
      v.pulse ? `Pulse: ${v.pulse} bpm` : "",
      v.temperature ? `Temp: ${v.temperature}°C` : "",
      v.respiratory_rate ? `RR: ${v.respiratory_rate} breaths/min` : "",
      v.spo2 ? `SpO₂: ${v.spo2}%` : "",
    ].filter(Boolean).join(" · ");
    // The specialty-specific structured fields captured by the loaded
    // template — saved with the note so it stays linked to the specialty
    // note type that produced it.
    const specialtyData = {};
    if (activeDef && activeDef.fields) {
      activeDef.fields.forEach((f) => {
        const val = dataValues[f.key];
        if (val !== undefined && val !== null && val !== "") {
          specialtyData[f.key] = { label: f.label, value: String(val) };
        }
      });
    }
    setSaving(true);
    try {
      // The backend independently verifies the active check-in before creating
      // the note — the frontend lock is only a visual hint.
      await base44.functions.invoke("createClinicalNote", {
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        doctor_name: doctorProfile.full_name,
        date: new Date().toISOString().slice(0, 10),
        encounter_datetime: form.encounter_datetime ? new Date(form.encounter_datetime).toISOString() : "",
        location: form.location,
        history: form.history,
        vital_signs: vitalsSummary,
        physical_examination: form.physical_examination,
        provisional_diagnoses: diagnoses,
        diagnosis: diagnoses.join("; "),
        prescription: prescriptionSummary,
        interventions: form.interventions,
        biopsy: form.biopsy,
        lab_request_ids: [...selectedLabs],
        imaging_request_ids: [...selectedImaging],
        recommendations: form.recommendations,
        specialty: mySpecialtyKey,
        document_type: docType !== GENERAL_KEY ? docType : "",
        document_type_label: docType !== GENERAL_KEY ? activeDef?.label || docType : "",
        data: specialtyData,
        photo_file_uris: photoUris,
      });
      if (meds.length > 0) {
        await base44.entities.Medication.bulkCreate(
          meds.map((m) => medicationRecordFromForm(m, { patient, fallbackReason: diagnoses[0] }))
        );
      }
      if (draftId) {
        try { await base44.entities.ClinicalNoteDraft.delete(draftId); } catch (e) { console.error(e); }
      }
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

      {!preselectedPatient ? (
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
      ) : (
        <p className="text-sm text-muted-foreground">
          Patient: <span className="font-medium text-foreground">{patient.full_name}</span> · CIN: {patient.cin}
        </p>
      )}

      {patient && (
        gateLoading ? (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Verifying hospital check-in...
          </div>
        ) : checkedIn ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Patient is checked in at your hospital — clinical functions unlocked.
          </div>
        ) : (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            {LOCKED_MESSAGE}
          </div>
        )
      )}

      {myDocs.length > 0 && (
        <div className="space-y-2">
          <Label>Note Type — {mySpecialty} (auto-detected)</Label>
          <Select value={docType} onValueChange={(v) => { setDocType(v); setDataValues({}); if (!getDocDef(v)?.photos) setPhotoUris([]); }}>
            <SelectTrigger><SelectValue placeholder="Select the note type..." /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value={GENERAL_KEY}>General Clinical Note</SelectItem>
              {myDocs.map((d) => (
                <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            AMedix detected your verified specialty and loaded its note types and template — no need to select a specialty.
          </p>
        </div>
      )}

      {hasSpecialtyFields && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-semibold">{activeDef.label}</p>
          <DocumentFields
            defs={activeDef.fields}
            values={dataValues}
            onChange={(k, val) => setDataValues((s) => ({ ...s, [k]: val }))}
          />
        </div>
      )}

      {activeDef && activeDef.photos && (
        <div className="space-y-1.5">
          <Label>Clinical Photographs ({photoUris.length}/6)</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotos}
            disabled={uploadingPhotos || photoUris.length >= 6}
          />
          {uploadingPhotos && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading photographs...
            </p>
          )}
          {photoUris.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photoUris.map((uri) => (
                <span key={uri} className="text-xs bg-secondary px-2 py-1 rounded-md flex items-center gap-1.5">
                  Photograph attached
                  <button
                    type="button"
                    onClick={() => setPhotoUris((s) => s.filter((u) => u !== uri))}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove photograph"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Photographs are attached to this note, stored privately, and follow the same permission, access control,
            audit and patient privacy rules as all clinical information.
          </p>
        </div>
      )}

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

      {isGeneralNote && (
        <>
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
            <VitalSignsForm value={form.vitals} onChange={(v) => setForm({ ...form, vitals: v })} />
          </div>

          <div className="space-y-2">
            <Label>Physical Examination</Label>
            <Textarea
              value={form.physical_examination}
              onChange={(e) => setForm({ ...form, physical_examination: e.target.value })}
              rows={3}
            />
            {patient && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <ExaminationsTab patient={patient} doctorProfile={doctorProfile} />
              </div>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>Provisional Diagnosis *</Label>
        {(form.provisional_diagnoses || [""]).map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={d}
              onChange={(e) => {
                const next = [...form.provisional_diagnoses];
                next[i] = e.target.value;
                setForm({ ...form, provisional_diagnoses: next });
              }}
              placeholder={i === 0 ? "Primary provisional diagnosis" : `Provisional diagnosis ${i + 1}`}
              required={i === 0}
            />
            {(form.provisional_diagnoses || []).length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setForm({ ...form, provisional_diagnoses: form.provisional_diagnoses.filter((_, idx) => idx !== i) })
                }
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setForm({ ...form, provisional_diagnoses: [...(form.provisional_diagnoses || []), ""] })}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Provisional Diagnosis
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-4">
        <p className="text-sm font-semibold">Management</p>

        <div className="space-y-2">
          <Label>Prescriptions</Label>
          <p className="text-xs text-muted-foreground">
            Prescribed medications are automatically added to the patient's Medication History as active medications.
          </p>
          <PrescriptionEditor medications={medications} onChange={setMedications} />
        </div>

        {isGeneralNote && (
          <>
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
          </>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="flex items-center gap-1.5"><FlaskConical className="w-4 h-4 text-primary" />Lab Requests</Label>
            {onNavigateTab && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowDraftConfirm(true)}>
                Go to Lab Requests <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          {selectedLabs.size > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedLabs.size} lab request{selectedLabs.size !== 1 ? "s" : ""} created during this encounter will be linked to this note.
            </p>
          )}
        </div>

        {showDraftConfirm && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <p className="text-sm font-semibold">Save Clinical Notes Draft?</p>
            <p className="text-xs text-muted-foreground">
              Everything you have written will be saved as a draft linked to this patient and encounter, and restored exactly as it was when you return to Clinical Notes.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={saveDraftAndContinueToLabs} disabled={savingDraft}>
                {savingDraft && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Save Draft & Continue to Labs
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowDraftConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-primary" />Imaging Requests</Label>
            {onNavigateTab && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onNavigateTab("imaging")}>
                Go to Imaging <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          {selectedImaging.size > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedImaging.size} imaging request{selectedImaging.size !== 1 ? "s" : ""} created during this encounter will be linked to this note.
            </p>
          )}
        </div>
      </div>

      {isGeneralNote && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <Label className="text-primary">Doctor's Recommendations</Label>
          <Textarea
            value={form.recommendations}
            onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
            rows={3}
            placeholder="Recommendations, follow-up instructions, lifestyle advice, referrals..."
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={saving || !checkedIn} title={!checkedIn ? LOCKED_MESSAGE : undefined}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Clinical Note
      </Button>
    </form>
  );
}