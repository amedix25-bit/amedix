import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, X } from "lucide-react";

export default function DoctorClinicalNotes({ doctorProfile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_cin: "", diagnosis: "", notes: "", prescription: "" });

  useEffect(() => { load(); }, [doctorProfile]);

  const load = async () => {
    try {
      const data = await base44.entities.ClinicalNote.filter({ doctor_id: doctorProfile.id }, "-date");
      setItems(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const patients = await base44.entities.PatientProfile.filter({ cin: form.patient_cin.toUpperCase() });
      if (patients.length === 0) { alert("Patient not found"); return; }
      const p = patients[0];
      await base44.entities.ClinicalNote.create({
        patient_id: p.id, doctor_id: doctorProfile.id,
        patient_cin: p.cin, patient_name: p.full_name, doctor_name: doctorProfile.full_name,
        date: new Date().toISOString().slice(0, 10),
        diagnosis: form.diagnosis, notes: form.notes, prescription: form.prescription,
      });
      setForm({ patient_cin: "", diagnosis: "", notes: "", prescription: "" });
      setShowForm(false);
      load();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />New Clinical Note</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Write Clinical Note</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-2">
            <Label>Patient CIN *</Label>
            <Input value={form.patient_cin} onChange={(e) => setForm({ ...form, patient_cin: e.target.value })} placeholder="CIN-XXXXXX" required />
          </div>
          <div className="space-y-2">
            <Label>Diagnosis *</Label>
            <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Prescription</Label>
            <Textarea value={form.prescription} onChange={(e) => setForm({ ...form, prescription: e.target.value })} rows={2} />
          </div>
          <Button type="submit">Save Clinical Note</Button>
        </form>
      )}

      {loading ? <div className="text-muted-foreground text-sm">Loading...</div> : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No clinical notes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((note) => (
            <div key={note.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-medium">{note.patient_name}</p>
                <span className="text-xs text-muted-foreground">{note.date}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Diagnosis: </span><span className="font-medium">{note.diagnosis}</span></div>
                {note.notes && <div><span className="text-muted-foreground">Notes: </span>{note.notes}</div>}
                {note.prescription && <div><span className="text-muted-foreground">Prescription: </span>{note.prescription}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}