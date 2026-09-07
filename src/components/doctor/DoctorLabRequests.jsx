import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, Plus, X, Upload, CheckCircle2 } from "lucide-react";

export default function DoctorLabRequests({ doctorProfile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_cin: "", test_name: "", test_code: "" });
  const [uploadingId, setUploadingId] = useState(null);
  const [resultText, setResultText] = useState("");

  useEffect(() => { load(); }, [doctorProfile]);

  const load = async () => {
    try {
      const data = await base44.entities.LabRequest.filter({ doctor_id: doctorProfile.id }, "-date_requested");
      setItems(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const patients = await base44.entities.PatientProfile.filter({ cin: form.patient_cin.toUpperCase() });
      if (patients.length === 0) { alert("Patient not found"); return; }
      const p = patients[0];
      await base44.entities.LabRequest.create({
        patient_id: p.id, doctor_id: doctorProfile.id,
        patient_cin: p.cin, patient_name: p.full_name, doctor_name: doctorProfile.full_name,
        test_name: form.test_name, test_code: form.test_code,
        status: "requested", date_requested: new Date().toISOString().slice(0, 10),
      });
      setForm({ patient_cin: "", test_name: "", test_code: "" });
      setShowForm(false);
      load();
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (id, file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.LabRequest.update(id, { result_file_url: file_url });
      load();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />New Lab Request</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Request Lab Test</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-2">
            <Label>Patient CIN *</Label>
            <Input value={form.patient_cin} onChange={(e) => setForm({ ...form, patient_cin: e.target.value })} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Test Name *</Label>
              <Input value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Test Code</Label>
              <Input value={form.test_code} onChange={(e) => setForm({ ...form, test_code: e.target.value })} />
            </div>
          </div>
          <Button type="submit">Create Request</Button>
        </form>
      )}

      {loading ? <div className="text-muted-foreground text-sm">Loading...</div> : items.length === 0 ? (
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
                  <p className="text-xs text-muted-foreground mt-1">Requested: {lab.date_requested}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lab.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {lab.status}
                </span>
              </div>
              {lab.status === "requested" && (
                <div className="mt-3 pt-3 border-t border-border">
                  {uploadingId === lab.id ? (
                    <div className="space-y-2">
                      <Textarea placeholder="Enter result..." value={resultText} onChange={(e) => setResultText(e.target.value)} rows={2} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUploadResult(lab.id)}><CheckCircle2 className="w-4 h-4 mr-1" />Save Result</Button>
                        <Button size="sm" variant="outline" onClick={() => setUploadingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setUploadingId(lab.id)}><Upload className="w-4 h-4 mr-1" />Upload Result</Button>
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm border border-border hover:bg-accent">
                          <Upload className="w-4 h-4 mr-1" />Attach File
                        </span>
                        <input type="file" className="hidden" onChange={(e) => e.target.files[0] && handleFileUpload(lab.id, e.target.files[0])} />
                      </label>
                    </div>
                  )}
                </div>
              )}
              {lab.status === "completed" && lab.result && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-800">{lab.result}</p>
                  {lab.result_file_url && <a href={lab.result_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 underline mt-2 inline-block">View file</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}