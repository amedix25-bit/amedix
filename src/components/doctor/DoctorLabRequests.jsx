import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LabTestPicker from "@/components/doctor/lab/LabTestPicker";
import LabRequestCard from "@/components/doctor/lab/LabRequestCard";
import { entryById } from "@/lib/labTestCatalog";
import { makeRequestId, generateLabRequestPdf } from "@/lib/labRequestPdf";
import { FlaskConical, Plus, X, CheckCircle2, Loader2, Send } from "lucide-react";

export default function DoctorLabRequests({ doctorProfile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const groupedSelection = useMemo(() => {
    const map = new Map();
    selectedEntries.forEach((e) => {
      if (!map.has(e.category)) map.set(e.category, []);
      map.get(e.category).push(e);
    });
    return [...map.entries()];
  }, [selectedEntries]);

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
      const pdfFile = new File([doc.output("blob")], `LabRequest_${p.cin}_${today}.pdf`, { type: "application/pdf" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
      await base44.entities.LabRequest.create({ ...payload, pdf_url: file_url });
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

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg("")} className="shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Lab Request
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Request Lab Investigations</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select whole panels or individual tests — all selections are combined into one consolidated request with a single PDF form.
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
            <LabTestPicker selected={selected} onToggle={toggleTest} onSetMany={setMany} />
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
          </div>

          {selectedEntries.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold mb-1">Review Consolidated Request ({selectedEntries.length} tests)</p>
              <p className="text-xs text-muted-foreground mb-3">
                Patient CIN: {form.patient_cin || "—"} · Laboratory: {form.lab_name || "—"} · One submission = one consolidated request and one PDF form.
              </p>
              {groupedSelection.map(([category, entries]) => (
                <div key={category} className="mb-3 last:mb-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {entries.map((e) => (
                      <span key={e.id} className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-xs">
                        {e.name}
                        <button
                          type="button"
                          onClick={() => toggleTest(e.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

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
      )}

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No lab requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((lab) => (
            <LabRequestCard key={lab.id} lab={lab} onUpdate={load} />
          ))}
        </div>
      )}
    </div>
  );
}