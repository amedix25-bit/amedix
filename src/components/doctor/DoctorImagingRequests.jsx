import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Plus, X, Upload, CheckCircle2 } from "lucide-react";

export default function DoctorImagingRequests({ doctorProfile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_cin: "", scan_type: "", body_part: "" });
  const [uploadingId, setUploadingId] = useState(null);
  const [reportText, setReportText] = useState("");

  useEffect(() => { load(); }, [doctorProfile]);

  const load = async () => {
    try {
      const data = await base44.entities.ImagingRequest.filter({ doctor_id: doctorProfile.id }, "-date_requested");
      setItems(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const patients = await base44.entities.PatientProfile.filter({ cin: form.patient_cin.toUpperCase() });
      if (patients.length === 0) { alert("Patient not found"); return; }
      const p = patients[0];
      await base44.entities.ImagingRequest.create({
        patient_id: p.id, doctor_id: doctorProfile.id,
        patient_cin: p.cin, patient_name: p.full_name, doctor_name: doctorProfile.full_name,
        scan_type: form.scan_type, body_part: form.body_part,
        status: "requested", date_requested: new Date().toISOString().slice(0, 10),
      });
      setForm({ patient_cin: "", scan_type: "", body_part: "" });
      setShowForm(false);
      load();
    } catch (err) { console.error(err); }
  };

  const handleUploadReport = async (id) => {
    try {
      await base44.entities.ImagingRequest.update(id, {
        status: "completed", report: reportText,
        date_completed: new Date().toISOString().slice(0, 10),
      });
      setUploadingId(null); setReportText(""); load();
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (id, file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.ImagingRequest.update(id, { report_file_url: file_url });
      load();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />New Imaging Request</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Request Imaging</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-2">
            <Label>Patient CIN *</Label>
            <Input value={form.patient_cin} onChange={(e) => setForm({ ...form, patient_cin: e.target.value })} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Scan Type *</Label>
              <Select value={form.scan_type} onValueChange={(v) => setForm({ ...form, scan_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select scan type" /></SelectTrigger>
                <SelectContent>
                  {["X-Ray", "MRI", "CT Scan", "Ultrasound", "Mammogram"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Body Part *</Label>
              <Input value={form.body_part} onChange={(e) => setForm({ ...form, body_part: e.target.value })} placeholder="e.g. Chest, Knee" required />
            </div>
          </div>
          <Button type="submit">Create Request</Button>
        </form>
      )}

      {loading ? <div className="text-muted-foreground text-sm">Loading...</div> : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No imaging requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((img) => (
            <div key={img.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium">{img.scan_type} — {img.body_part}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{img.patient_name} · CIN: {img.patient_cin}</p>
                  <p className="text-xs text-muted-foreground mt-1">Requested: {img.date_requested}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${img.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {img.status}
                </span>
              </div>
              {img.status === "requested" && (
                <div className="mt-3 pt-3 border-t border-border">
                  {uploadingId === img.id ? (
                    <div className="space-y-2">
                      <Textarea placeholder="Enter report..." value={reportText} onChange={(e) => setReportText(e.target.value)} rows={2} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUploadReport(img.id)}><CheckCircle2 className="w-4 h-4 mr-1" />Save Report</Button>
                        <Button size="sm" variant="outline" onClick={() => setUploadingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setUploadingId(img.id)}><Upload className="w-4 h-4 mr-1" />Upload Report</Button>
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm border border-border hover:bg-accent">
                          <Upload className="w-4 h-4 mr-1" />Attach File
                        </span>
                        <input type="file" className="hidden" onChange={(e) => e.target.files[0] && handleFileUpload(img.id, e.target.files[0])} />
                      </label>
                    </div>
                  )}
                </div>
              )}
              {img.status === "completed" && img.report && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-800">{img.report}</p>
                  {img.report_file_url && <a href={img.report_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 underline mt-2 inline-block">View file</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}