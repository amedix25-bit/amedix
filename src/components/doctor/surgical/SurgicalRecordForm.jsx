import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCKED_MESSAGE, fetchCheckInStatus } from "@/lib/checkInGate";
import { Loader2, Lock, ChevronDown, ChevronRight } from "lucide-react";

// Structured documentation form for one surgical record type. The surgeon's
// equivalent of a clinical note: the patient's medical information stays
// accessible while documenting, and saving is blocked unless the patient is
// actively checked in at the surgeon's hospital (the backend re-verifies it).
export default function SurgicalRecordForm({ doctorProfile, patient, recordType, onSaved, onCancel }) {
  const [values, setValues] = useState({});
  const [checkIn, setCheckIn] = useState(null); // null = loading
  const [medInfo, setMedInfo] = useState(null);
  const [showMedInfo, setShowMedInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCheckInStatus(patient.id).then(setCheckIn);
    const load = async () => {
      const [meds, conditions, allergies, labs, imaging] = await Promise.all([
        base44.entities.Medication.filter({ patient_id: patient.id, is_active: true }).catch(() => []),
        base44.entities.MedicalCondition.filter({ patient_id: patient.id }).catch(() => []),
        base44.entities.Allergy.filter({ patient_id: patient.id }).catch(() => []),
        base44.entities.LabRequest.filter({ patient_id: patient.id }, "-created_date", 10).catch(() => []),
        base44.entities.ImagingRequest.filter({ patient_id: patient.id }, "-created_date", 10).catch(() => []),
      ]);
      setMedInfo({ meds, conditions, allergies, labs, imaging });
    };
    load();
  }, [patient.id]);

  const setField = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  const requiredMissing = recordType.fields.filter(
    (f) => f.required && !String(values[f.key] || "").trim()
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!checkIn?.checked_in) {
      setError(LOCKED_MESSAGE);
      return;
    }
    if (requiredMissing.length > 0) {
      setError("Please complete all required fields before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("createSurgicalRecord", {
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
        record_type: recordType.key,
        record_type_title: recordType.title,
        data: values,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save the record. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f) => {
    if (f.type === "select") {
      return (
        <Select value={values[f.key] || ""} onValueChange={(v) => setField(f.key, v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {(f.options || []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (f.type === "date" || f.type === "input") {
      return (
        <Input
          type={f.type === "date" ? "date" : "text"}
          value={values[f.key] || ""}
          onChange={(e) => setField(f.key, e.target.value)}
        />
      );
    }
    return (
      <Textarea
        rows={3}
        value={values[f.key] || ""}
        onChange={(e) => setField(f.key, e.target.value)}
      />
    );
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onCancel}>&larr; Back to record types</Button>

      {/* Patient header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-lg">{recordType.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{recordType.description}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-4 text-sm">
          <p><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{patient.full_name}</span></p>
          <p><span className="text-muted-foreground">CIN:</span> <span className="font-medium">{patient.cin}</span></p>
          {patient.date_of_birth && (
            <p><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{patient.date_of_birth}</span></p>
          )}
          {patient.gender && (
            <p><span className="text-muted-foreground">Gender:</span> <span className="font-medium capitalize">{patient.gender}</span></p>
          )}
          {patient.blood_type && patient.blood_type !== "Unknown" && (
            <p><span className="text-muted-foreground">Blood type:</span> <span className="font-medium">{patient.blood_type}</span></p>
          )}
          {patient.allergies && (
            <p className="text-destructive"><span className="text-muted-foreground">Allergies:</span> <span className="font-medium">{patient.allergies}</span></p>
          )}
        </div>

        {/* Patient medical information remains accessible while documenting */}
        <button
          type="button"
          onClick={() => setShowMedInfo((s) => !s)}
          className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {showMedInfo ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Patient medical information
        </button>
        {showMedInfo && (
          <div className="mt-3 space-y-3 text-sm border-t border-border pt-3">
            {!medInfo ? (
              <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading patient information...
              </p>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Medications</p>
                  {medInfo.meds.length === 0 ? (
                    <p className="text-muted-foreground mt-0.5">No active medications</p>
                  ) : (
                    <ul className="mt-0.5 space-y-0.5">
                      {medInfo.meds.map((m) => (
                        <li key={m.id}>
                          {m.name}
                          {m.dose ? ` — ${m.dose}` : ""}
                          {m.frequency ? `, ${m.frequency}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Known Conditions</p>
                  {medInfo.conditions.length === 0 ? (
                    <p className="text-muted-foreground mt-0.5">None recorded</p>
                  ) : (
                    <p className="mt-0.5">{medInfo.conditions.map((c) => c.name).join(", ")}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Allergies</p>
                  {medInfo.allergies.length === 0 ? (
                    <p className="text-muted-foreground mt-0.5">No known allergies</p>
                  ) : (
                    <p className="mt-0.5 text-destructive">{medInfo.allergies.map((a) => a.name || a.allergy || a.allergen).filter(Boolean).join(", ")}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Laboratory Requests</p>
                  {medInfo.labs.length === 0 ? (
                    <p className="text-muted-foreground mt-0.5">No laboratory requests</p>
                  ) : (
                    <ul className="mt-0.5 space-y-0.5">
                      {medInfo.labs.slice(0, 5).map((l) => (
                        <li key={l.id}>
                          {(l.tests || []).map((t) => t.name).join(", ") || "Lab request"} — <span className="capitalize">{l.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Imaging</p>
                  {medInfo.imaging.length === 0 ? (
                    <p className="text-muted-foreground mt-0.5">No imaging requests</p>
                  ) : (
                    <ul className="mt-0.5 space-y-0.5">
                      {medInfo.imaging.slice(0, 5).map((i) => (
                        <li key={i.id}>
                          {i.examination || i.scan_type} — <span className="capitalize">{i.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {recordType.fields.map((f) => (
            <div key={f.key} className={f.type === "textarea" ? "md:col-span-2 space-y-1.5" : "space-y-1.5"}>
              <Label htmlFor={`sr-${f.key}`}>
                {f.label}
                {f.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {renderField(f)}
            </div>
          ))}
        </div>

        {error && (
          <p className={`text-sm ${checkIn && !checkIn.checked_in ? "text-muted-foreground flex items-start gap-2" : "text-destructive"}`}>
            {checkIn && !checkIn.checked_in && <Lock className="w-4 h-4 shrink-0 mt-0.5" />}
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={saving || !checkIn}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Surgical Record"}
          </Button>
          {checkIn === null && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying hospital check-in...
            </p>
          )}
        </div>
      </form>
    </div>
  );
}