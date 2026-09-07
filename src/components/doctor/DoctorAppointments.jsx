import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Plus, X, Pencil, MapPin } from "lucide-react";

const EMPTY = { patient_cin: "", date: "", time: "", location: "", reason: "", notes: "" };

export default function DoctorAppointments({ doctorProfile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

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

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  };

  const openEdit = (apt) => {
    setEditing(apt);
    setForm({
      patient_cin: apt.patient_cin || "",
      date: apt.date || "",
      time: apt.time || "",
      location: apt.location || "",
      reason: apt.reason || "",
      notes: apt.notes || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await base44.entities.Appointment.update(editing.id, {
          date: form.date,
          time: form.time,
          location: form.location,
          reason: form.reason,
          notes: form.notes,
        });
      } else {
        const patients = await base44.entities.PatientProfile.filter({ cin: form.patient_cin.toUpperCase() });
        if (patients.length === 0) {
          setError("Patient not found. Please check the CIN.");
          return;
        }
        const p = patients[0];
        const accessReqs = await base44.entities.AccessRequest.filter({ patient_id: p.id, doctor_id: doctorProfile.id, status: "approved" });
        if (accessReqs.length === 0) {
          setError("You need approved access to this patient's record");
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
          location: form.location,
          reason: form.reason,
          notes: form.notes,
          status: "scheduled",
        });
      }
      setForm(EMPTY);
      setEditing(null);
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{editing ? "Edit Appointment" : "Create Appointment"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Patient CIN *</Label>
              <Input
                value={editing ? editing.patient_cin : form.patient_cin}
                onChange={(e) => setForm({ ...form, patient_cin: e.target.value })}
                placeholder="CIN-XXXXXX"
                disabled={!!editing}
                required={!editing}
              />
            </div>
            <div className="space-y-2">
              <Label>Location / Type of Appointment</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Clinic consultation, video call, hospital ward"
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for visit" />
          </div>
          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any relevant details for the patient" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit">{editing ? "Save Changes" : "Create Appointment"}</Button>
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
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${apt.status === "scheduled" ? "bg-blue-50 text-blue-700" : apt.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {apt.status}
                    </span>
                    {apt.status === "scheduled" && (
                      <button onClick={() => openEdit(apt)} className="text-muted-foreground hover:text-foreground" title="Edit appointment">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {apt.reason && <p className="text-sm text-muted-foreground mt-1">{apt.reason}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.time}</span>
                  <span>CIN: {apt.patient_cin}</span>
                  {apt.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{apt.location}</span>
                  )}
                </div>
                {apt.status === "scheduled" && (
                  <div className="mt-2">
                    {apt.patient_response === "accepted" && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Patient accepted{apt.response_date ? ` · ${apt.response_date.slice(0, 10)}` : ""}
                      </span>
                    )}
                    {apt.patient_response === "declined" && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        Patient declined{apt.response_date ? ` · ${apt.response_date.slice(0, 10)}` : ""}
                      </span>
                    )}
                    {!apt.patient_response && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Awaiting patient response
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}