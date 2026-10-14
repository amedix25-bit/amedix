import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LabTestPicker from "@/components/doctor/lab/LabTestPicker";
import MedicalDictationButton from "@/components/doctor/dictation/MedicalDictationButton";
import PatientLabListRow from "@/components/doctor/lab/PatientLabListRow";
import LabHistoryList from "@/components/doctor/lab/LabHistoryList";
import { entryById } from "@/lib/labTestCatalog";
import { makeRequestId, generateLabRequestPdf, addRequestBarcode } from "@/lib/labRequestPdf";
import { fetchCheckInStatus, LOCKED_MESSAGE } from "@/lib/checkInGate";
import { FlaskConical, Plus, X, CheckCircle2, Loader2, Send, ArrowLeft, Search } from "lucide-react";

export default function DoctorLabRequests({ doctorProfile, draftContext, onNavigateTab }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [form, setForm] = useState({
    patient_cin: "",
    indication: "",
    clinical_info: "",
    instructions: "",
    lab_name: doctorProfile?.hospital || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    load();
  }, [doctorProfile]);

  useEffect(() => {
    if (draftContext?.patient) {
      setSelectedPatient(null);
      setShowForm(true);
      setForm((f) => ({ ...f, patient_cin: draftContext.patient.cin || "" }));
    }
  }, [draftContext]);

  const load = async () => {
    try {
      const data = await base44.entities.LabRequest.filter({ doctor_id: doctorProfile.id }, "-date_requested");
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTest = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const setMany = (ids, select) =>
    setSelected((s) => {
      const n = new Set(s);
      ids.forEach((id) => (select ? n.add(id) : n.delete(id)));
      return n;
    });

  const selectedEntries = useMemo(() => [...selected].map(entryById).filter(Boolean), [selected]);

  // One row per patient — never one row per test.
  const patients = useMemo(() => {
    const map = new Map();
    items.forEach((lab) => {
      if (!map.has(lab.patient_id)) {
        map.set(lab.patient_id, {
          patient_id: lab.patient_id,
          patient_name: lab.patient_name,
          patient_cin: lab.patient_cin,
        });
      }
    });
    return [...map.values()];
  }, [items]);

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        `${p.patient_name || ""}`.toLowerCase().includes(q) ||
        `${p.patient_cin || ""}`.toLowerCase().includes(q)
    );
  }, [patients, query]);

  // The selected patient's consolidated request history, newest first.
  const patientRequests = useMemo(() => {
    if (!selectedPatient) return [];
    const map = new Map();
    items
      .filter((lab) => lab.patient_id === selectedPatient.patient_id)
      .forEach((lab) => {
        const key = Array.isArray(lab.tests) && lab.tests.length > 0 ? lab.id : (lab.request_group_id || lab.id);
        if (!map.has(key)) map.set(key, lab);
      });
    return [...map.values()];
  }, [items, selectedPatient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (selected.size === 0) {
      setFormError("Select at least one test.");
      return;
    }
    if (!form.indication.trim()) {
      setFormError("A clinical indication is required.");
      return;
    }
    setSubmitting(true);
    try {
      const patients = await base44.entities.PatientProfile.filter({ cin: form.patient_cin.toUpperCase() });
      if (patients.length === 0) {
        setFormError("Patient not found. Please check the CIN.");
        setSubmitting(false);
        return;
      }
      const p = patients[0];
      // Check-in gate — the backend verifies it again at creation time.
      const gate = await fetchCheckInStatus(p.id);
      if (!gate.checked_in) {
        setFormError(LOCKED_MESSAGE);
        setSubmitting(false);
        return;
      }
      const count = selectedEntries.length;
      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        request_id: makeRequestId(),
        patient_id: p.id,
        patient_cin: p.cin,
        patient_name: p.full_name,
        patient_dob: p.date_of_birth || "",
        patient_gender: p.gender || "",
        patient_blood_type: p.blood_type || "",
        doctor_id: doctorProfile.id,
        doctor_name: doctorProfile.full_name,
        doctor_specialization: doctorProfile.specialization || "",
        doctor_hospital: doctorProfile.hospital || "",
        doctor_license: doctorProfile.license_number || "",
        tests: selectedEntries.map((entry) => ({
          name: entry.name,
          category: entry.category,
          panel: entry.panel || "",
        })),
        indication: form.indication,
        clinical_info: form.clinical_info,
        instructions: form.instructions,
        lab_name: form.lab_name,
        status: "requested",
        date_requested: today,
      };
      const doc = generateLabRequestPdf(payload);
      await addRequestBarcode(doc, payload.request_id);
      const pdfFile = new File([doc.output("blob")], `LabRequest_${p.cin}_${today}.pdf`, { type: "application/pdf" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
      const created = (await base44.functions.invoke("createLabRequest", { ...payload, pdf_url: file_url })).data.lab_request;
      if (draftContext?.patient && p.id === draftContext.patient.id) {
        try {
          const drafts = await base44.entities.ClinicalNoteDraft.filter({ patient_id: p.id, doctor_id: doctorProfile.id });
          if (drafts.length > 0) {
            const d = drafts[0];
            const ids = Array.isArray(d.selected_lab_request_ids) ? d.selected_lab_request_ids : [];
            if (!ids.includes(created.id)) {
              await base44.entities.ClinicalNoteDraft.update(d.id, { selected_lab_request_ids: [...ids, created.id] });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      setSelected(new Set());
      setForm({ patient_cin: "", indication: "", clinical_info: "", instructions: "", lab_name: doctorProfile?.hospital || "" });
      setShowForm(false);
      setSuccessMsg(
        `Consolidated lab request sent to ${payload.lab_name || "the laboratory"} — ${count} test(s) for ${p.full_name}. A PDF request form was generated.`
      );
      load();
    } catch (err) {
      console.error(err);
      setFormError("Failed to submit the request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formSection = showForm && (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Request Lab Investigations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select whole panels or individual tests — all selections are combined into one consolidated request with a single Request ID and PDF form.
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lab_cin">Patient CIN *</Label>
          <Input
            id="lab_cin"
            value={form.patient_cin}
            onChange={(e) => setForm({ ...form, patient_cin: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lab_name">Laboratory *</Label>
          <Input
            id="lab_name"
            placeholder="Laboratory to receive this request"
            value={form.lab_name}
            onChange={(e) => setForm({ ...form, lab_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Investigations *</Label>
        <LabTestPicker selected={selected} onToggle={toggleTest} onSetMany={setMany} doctorId={doctorProfile.id} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lab_indication">Clinical indication / reason for testing *</Label>
          <Textarea
            id="lab_indication"
            rows={3}
            placeholder="e.g. Suspected iron deficiency anemia"
            value={form.indication}
            onChange={(e) => setForm({ ...form, indication: e.target.value })}
            required
          />
          <MedicalDictationButton
            value={form.indication}
            onChange={(v) => setForm({ ...form, indication: v })}
            specialty={doctorProfile?.specialization || ""}
            contextLabel="Laboratory request — clinical indication / reason for testing"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lab_clinical">Relevant clinical information</Label>
          <Textarea
            id="lab_clinical"
            rows={3}
            placeholder="e.g. Known hypertension, on metformin, recent fatigue"
            value={form.clinical_info}
            onChange={(e) => setForm({ ...form, clinical_info: e.target.value })}
          />
          <MedicalDictationButton
            value={form.clinical_info}
            onChange={(v) => setForm({ ...form, clinical_info: v })}
            specialty={doctorProfile?.specialization || ""}
            contextLabel="Laboratory request — relevant clinical information"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lab_instructions">Laboratory instructions</Label>
        <Textarea
          id="lab_instructions"
          rows={2}
          placeholder="e.g. Fasting sample, morning draw"
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
        />
        <MedicalDictationButton
          value={form.instructions}
          onChange={(v) => setForm({ ...form, instructions: v })}
          specialty={doctorProfile?.specialization || ""}
          contextLabel="Laboratory request — instructions"
        />
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting request...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Submit Consolidated Lab Request
          </>
        )}
      </Button>
    </form>
  );

  return (
    <div className="space-y-4">
      {draftContext?.patient && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-sm">
            <span className="font-semibold">Clinical note draft saved</span>
            <span className="text-muted-foreground">
              {" "}— continue the lab request for {draftContext.patient.full_name} (CIN: {draftContext.patient.cin}). Your draft will be restored when you return to Clinical Notes.
            </span>
          </p>
          {onNavigateTab && (
            <Button size="sm" onClick={() => onNavigateTab("notes", { patient: draftContext.patient })}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Return to Clinical Notes
            </Button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg("")} className="shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      {selectedPatient ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedPatient(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> All patients
            </button>
            <Button size="sm" onClick={() => { setSelectedPatient(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Lab Request
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-medium">{selectedPatient.patient_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">CIN: {selectedPatient.patient_cin}</p>
          </div>
          {patientRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No lab requests for this patient.</p>
          ) : (
            <LabHistoryList requests={patientRequests} showPdf />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              New Lab Request
            </Button>
          </div>

          {formSection}

          {loading ? (
            <div className="text-muted-foreground text-sm">Loading...</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No patients with lab requests yet</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search patient by name or CIN..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {filteredPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No patients match your search.</p>
              ) : (
                <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                  {filteredPatients.map((p) => (
                    <PatientLabListRow key={p.patient_id} patient={p} onClick={() => setSelectedPatient(p)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}