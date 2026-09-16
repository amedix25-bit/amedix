import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCKED_MESSAGE, fetchCheckInStatus } from "@/lib/checkInGate";
import { ENCOUNTER_TYPES } from "@/lib/clinicalDocuments";
import { Loader2, Lock } from "lucide-react";

// Opens a new patient encounter — the container every clinical document,
// order and result attaches to. Enforces the hospital check-in gate.
export default function EncounterForm({ doctorProfile, patient, onCreated, onCancel }) {
  // The doctor's verified specialties — with more than one, the doctor picks
  // which specialty they are practicing for THIS encounter; the selection is
  // saved to the encounter and applies to all documents created during it.
  const mySpecialties = (Array.isArray(doctorProfile.specialties) && doctorProfile.specialties.length
    ? doctorProfile.specialties
    : [doctorProfile.specialization]
  ).filter(Boolean);
  const [practicingSpecialty, setPracticingSpecialty] = useState(undefined);
  const [encounterType, setEncounterType] = useState(undefined);
  const [department, setDepartment] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [checkIn, setCheckIn] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCheckInStatus(patient.id).then(setCheckIn);
  }, [patient.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (mySpecialties.length > 1 && !practicingSpecialty) {
      setError("Please select the specialty you are practicing for this encounter.");
      return;
    }
    if (!encounterType) {
      setError("Please select the encounter type.");
      return;
    }
    if (!checkIn?.checked_in) {
      setError(LOCKED_MESSAGE);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await base44.functions.invoke("createEncounter", {
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
        encounter_type: encounterType,
        practicing_specialty: practicingSpecialty || doctorProfile.specialization,
        department,
        chief_complaint: chiefComplaint,
      });
      onCreated(res.data.encounter);
    } catch (err) {
      setError(err.response?.data?.error || "Could not open the encounter. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="font-semibold">New Encounter — {patient.full_name}</h3>
      {mySpecialties.length > 1 && (
        <div className="space-y-1.5">
          <Label>Practicing Specialty (this encounter) *</Label>
          <Select value={practicingSpecialty} onValueChange={setPracticingSpecialty}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select the specialty you are practicing..." /></SelectTrigger>
            <SelectContent>
              {mySpecialties.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This specialty is saved to the encounter and all documents created during it.
          </p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Encounter Type *</Label>
          <Select value={encounterType} onValueChange={setEncounterType}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {ENCOUNTER_TYPES.map((t) => (
                <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Internal Medicine" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Chief Complaint / Reason for Visit</Label>
        <Textarea rows={2} value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
      </div>
      {error && (
        <p className={`text-sm ${checkIn && !checkIn.checked_in ? "text-muted-foreground flex items-start gap-2" : "text-destructive"}`}>
          {checkIn && !checkIn.checked_in && <Lock className="w-4 h-4 shrink-0 mt-0.5" />}
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !checkIn}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Open Encounter"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        {checkIn === null && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying hospital check-in...
          </p>
        )}
      </div>
    </form>
  );
}