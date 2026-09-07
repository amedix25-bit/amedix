import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LabTestPicker from "@/components/doctor/lab/LabTestPicker";
import { entryById } from "@/lib/labTestCatalog";
import { FlaskConical, Plus, X, Upload, CheckCircle2, Loader2, Send } from "lucide-react";

export default function DoctorLabRequests({ doctorProfile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [form, setForm] = useState({
    patient_cin: "",
    indication: "",
    instructions: "",
    lab_name: doctorProfile?.hospital || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadingId, setUploadingId] = useState(null);
  const [resultText, setResultText] = useState("");

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
      const groupId = crypto.randomUUID();
      const today = new Date().toISOString().slice(0, 10);
      await base44.entities.LabRequest.bulkCreate(
        selectedEntries.map((entry) => ({
          patient_id: p.id,
          doctor_id: doctorProfile.id,
          patient_cin: p.cin,
          patient_name: p.full_name,
          doctor_name: doctorProfile.full_name,
          test_name: entry.name,
          test_code: entry.id,
          category: entry.category,
          request_group_id: groupId,
          indication: form.indication,
          instructions: form.instructions,
          lab_name: form.lab_name,
          status: "requested",
          date_requested: today,
        }))
      );
      const count = selectedEntries.length;
      const labName = form.lab_name;
      setSelected(new Set());
      setForm({ patient_cin: "", indication: "", instructions: "", lab_name: doctorProfile?.hospital || "" });
      setShowForm(false);
      setSuccessMsg(`Lab request sent to ${labName || "the laboratory"} — ${count} test(s) for ${p.full_name}.`);
      load();
    } catch (err) {
      console.error(err);
      setFormError("Failed to submit the request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadResult = async (id) => {
    try {
      await base44.entities.LabRequest.update(id, {
        status: "completed",
        result: resultText,
        date_completed: new Date().toISOString().slice(0, 10),
      });
      setUploadingId(null);
      setResultText("");
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (id, file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.LabRequest.update(id, { result_file_url: file_url });
      load();
    } catch (err) {
      console.error(err);
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
                Select whole panels or individual tests, then submit electronically.
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
              <Label htmlFor="lab_instructions">Laboratory instructions</Label>
              <Textarea
                id="lab_instructions"
                rows={3}
                placeholder="e.g. Fasting sample, morning draw"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </div>
          </div>

          {selectedEntries.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold mb-3">Review Selected Tests ({selectedEntries.length})</p>
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
                Submit Lab Request
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
            <div key={lab.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium">{lab.test_name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{lab.patient_name} · CIN: {lab.patient_cin}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested: {lab.date_requested}
                    {lab.lab_name ? ` · Lab: ${lab.lab_name}` : ""}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    lab.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {lab.status}
                </span>
              </div>
              {lab.status === "requested" && (
                <div className="mt-3 pt-3 border-t border-border">
                  {uploadingId === lab.id ? (
                    <div className="space-y-2">
                      <Textarea placeholder="Enter result..." value={resultText} onChange={(e) => setResultText(e.target.value)} rows={2} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUploadResult(lab.id)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Save Result
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setUploadingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setUploadingId(lab.id)}>
                        <Upload className="w-4 h-4 mr-1" />
                        Upload Result
                      </Button>
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm border border-border hover:bg-accent">
                          <Upload className="w-4 h-4 mr-1" />
                          Attach File
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => e.target.files[0] && handleFileUpload(lab.id, e.target.files[0])}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
              {lab.status === "completed" && lab.result && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-800">{lab.result}</p>
                  {lab.result_file_url && (
                    <a
                      href={lab.result_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 underline mt-2 inline-block"
                    >
                      View file
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}