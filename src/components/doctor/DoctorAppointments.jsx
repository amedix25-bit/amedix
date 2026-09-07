import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, CalendarDays, Users, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import UpcomingAppointments from "./appointments/UpcomingAppointments";
import AppointmentsCalendar from "./appointments/AppointmentsCalendar";
import DeclinedAppointments from "./appointments/DeclinedAppointments";
import AppointmentDetailsDialog from "./appointments/AppointmentDetailsDialog";
import DoctorPatientRecordView from "./DoctorPatientRecordView";
import { getAppointmentStatus } from "./appointments/appointmentStatus";

const EMPTY = { patient_cin: "", date: "", time: "", location: "", reason: "", notes: "" };
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function DoctorAppointments({ doctorProfile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [view, setView] = useState("calendar");
  const [detail, setDetail] = useState(null);
  const [recordError, setRecordError] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reschedule, setReschedule] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", time: "" });
  const [seenConfirm, setSeenConfirm] = useState(null);

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
    setDetail(null);
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

  const handleDelete = async (apt) => {
    try {
      await base44.entities.Appointment.delete(apt.id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const openRecord = async (apt) => {
    setRecordError("");
    try {
      const accessReqs = await base44.entities.AccessRequest.filter({ patient_id: apt.patient_id, doctor_id: doctorProfile.id, status: "approved" });
      if (accessReqs.length === 0) {
        setRecordError("You don't have approved access to this patient's record.");
        return;
      }
      const profiles = await base44.entities.PatientProfile.filter({ id: apt.patient_id });
      if (profiles.length === 0) {
        setRecordError("Patient profile not found.");
        return;
      }
      setDetail(null);
      setSelectedPatient(profiles[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const openReschedule = (apt) => {
    setDetail(null);
    setReschedule(apt);
    setRescheduleForm({ date: apt.date || "", time: apt.time || "" });
  };

  const confirmReschedule = async () => {
    const apt = reschedule;
    try {
      const patch = {
        date: rescheduleForm.date,
        time: rescheduleForm.time,
        rescheduled: true,
        reschedule_datetime: new Date().toISOString(),
      };
      if (!apt.original_date) patch.original_date = apt.date;
      if (!apt.original_time) patch.original_time = apt.time;
      await base44.entities.Appointment.update(apt.id, patch);
      setReschedule(null);
      load();
      base44.functions.invoke("notifyPatientReschedule", {
        patient_id: apt.patient_id,
        patient_name: apt.patient_name,
        doctor_name: doctorProfile.full_name,
        original_date: apt.date,
        original_time: apt.time,
        new_date: rescheduleForm.date,
        new_time: rescheduleForm.time,
        location: apt.location,
        reason: apt.reason,
      }).catch(console.error);
    } catch (err) {
      console.error(err);
    }
  };

  const requestPatientSeen = (apt) => {
    setDetail(null);
    setSeenConfirm(apt);
  };

  const confirmPatientSeen = async (apt) => {
    const now = new Date();
    const nowIso = now.toISOString();
    try {
      const patch = {
        status: "completed",
        seen_by_doctor_id: doctorProfile.id,
        seen_by_doctor_name: doctorProfile.full_name,
        seen_datetime: nowIso,
      };
      if (!apt.original_date) patch.original_date = apt.date;
      if (!apt.original_time) patch.original_time = apt.time;
      await base44.entities.Appointment.update(apt.id, patch);
      await base44.entities.MedicalHistoryEntry.create({
        patient_id: apt.patient_id,
        patient_cin: apt.patient_cin,
        patient_name: apt.patient_name,
        entry_type: "patient_seen",
        date: nowIso.slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        doctor_id: doctorProfile.id,
        doctor_name: doctorProfile.full_name,
        location: apt.location,
        appointment_reason: apt.reason,
        status: "Completed / Patient Seen",
      });
      setSeenConfirm(null);
      setDetail(null);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setRecordError("");
  };

  if (selectedPatient) {
    return (
      <div className="space-y-4">
        <DoctorPatientRecordView patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
      </div>
    );
  }

  const today = todayStr();
  const upcoming = items.filter((a) => {
    const s = getAppointmentStatus(a);
    return (s === "Pending" || s === "Confirmed") && a.date >= today;
  });
  const active = items.filter((a) => {
    const s = getAppointmentStatus(a);
    return s === "Pending" || s === "Confirmed";
  });
  const declined = items.filter((a) => a.patient_response === "declined" || a.status === "cancelled");

  const tabs = [
    { key: "upcoming", label: "Upcoming", icon: Users, count: upcoming.length },
    { key: "calendar", label: "Calendar", icon: CalendarDays },
    { key: "declined", label: "Declined", icon: Ban, count: declined.length },
  ];

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

      <div className="flex rounded-xl border border-border bg-card p-1 gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              view === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && <span className="text-xs opacity-80">({t.count})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : view === "upcoming" ? (
        <UpcomingAppointments items={upcoming} onOpen={setDetail} onEdit={openEdit} onReschedule={openReschedule} onPatientSeen={requestPatientSeen} />
      ) : view === "calendar" ? (
        <AppointmentsCalendar items={active} onOpen={setDetail} />
      ) : (
        <DeclinedAppointments items={declined} onDelete={handleDelete} />
      )}

      <Dialog open={!!reschedule} onOpenChange={(open) => { if (!open) setReschedule(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>{reschedule?.patient_name}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Date</Label>
              <Input type="date" value={rescheduleForm.date} onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>New Time</Label>
              <Input type="time" value={rescheduleForm.time} onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })} />
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">Current: </span><span className="font-medium">{reschedule?.date} at {reschedule?.time}</span></p>
            <p><span className="text-muted-foreground">New: </span><span className="font-medium">{rescheduleForm.date} at {rescheduleForm.time}</span></p>
          </div>
          <Button
            className="w-full"
            disabled={
              !rescheduleForm.date ||
              !rescheduleForm.time ||
              (rescheduleForm.date === reschedule?.date && rescheduleForm.time === reschedule?.time)
            }
            onClick={confirmReschedule}
          >
            Confirm Reschedule
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!seenConfirm} onOpenChange={(open) => { if (!open) setSeenConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you have seen this patient?</AlertDialogTitle>
            <AlertDialogDescription>
              {seenConfirm?.patient_name} — {seenConfirm?.date} at {seenConfirm?.time}. The encounter will be recorded in the patient's medical history and removed from your upcoming appointments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmPatientSeen(seenConfirm)}>Yes, Patient Seen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppointmentDetailsDialog apt={detail} onClose={closeDetail} onOpenRecord={openRecord} recordError={recordError} onReschedule={openReschedule} onPatientSeen={requestPatientSeen} />
    </div>
  );
}