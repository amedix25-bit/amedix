import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Plus, X } from "lucide-react";

export default function DoctorAppointments({ doctorProfile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_cin: "", patient_name: "", date: "", time: "", reason: "" });

  useEffect(() => {
    load();
  }, [doctorProfile]);

  const load = async () => {
    try {
      const data = await base44.entities.Appointment.filter({ doctor_id: doctorProfile.id }, "-date");
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const patients = await base44.entities.PatientProfile.filter({ cin: form.patient_cin.toUpperCase() });
      if (patients.length === 0) {
        alert("Patient not found");
        return;
      }
      const p = patients[0];
      const accessReqs = await base44.entities.AccessRequest.filter({ patient_id: p.id, doctor_id: doctorProfile.id, status: "approved" });
      if (accessReqs.length === 0) {
        alert("You need approved access to this patient's record");
        return;
      }
      await base44.entities.Appointment.create({
        patient_id: p.id,
        doctor_id: doctorProfile.id,
        patient_cin: p.cin,
        patient_name: p.full_name,
        doctor_name: doctorProfile.full_name,
        date: form.date,
        time: form.time,
        reason: form.reason,
        status: "scheduled",
      });
      setForm({ patient_cin: "", patient_name: "", date: "", time: "", reason: "" });
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Create Appointment</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Patient CIN *</Label>
              <Input value={form.patient_cin} onChange={(e) => setForm({ ...form, patient_cin: e.target.value })} placeholder="CIN-XXXXXX" required />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for visit" />
            </div>
          </div>
          <Button type="submit">Create Appointment</Button>
        </form>
      )}

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No appointments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((apt) => (
            <div key={apt.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-primary">{apt.date?.slice(5, 7) || ""}</span>
                <span className="text-lg font-bold text-primary leading-none">{apt.date?.slice(8, 10) || ""}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{apt.patient_name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${apt.status === "scheduled" ? "bg-blue-50 text-blue-700" : apt.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {apt.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{apt.reason}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.time}</span>
                  <span>CIN: {apt.patient_cin}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}