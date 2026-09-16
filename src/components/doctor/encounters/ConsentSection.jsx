import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCKED_MESSAGE, fetchCheckInStatus } from "@/lib/checkInGate";
import { CONSENT_TYPES, CONSENT_STATUSES, getConsentTypeLabel } from "@/lib/clinicalDocuments";
import { format } from "date-fns";
import { Loader2, Lock, ShieldCheck, Plus, Minus } from "lucide-react";

// Centralized consent management for one patient/encounter: existing consents
// (type, who obtained it, when, facility, status, signature) and recording of
// new consents — gated by the hospital check-in.
export default function ConsentSection({ doctorProfile, patient, encounter, consents, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [consentType, setConsentType] = useState(undefined);
  const [status, setStatus] = useState("given");
  const [notes, setNotes] = useState("");
  const [checkIn, setCheckIn] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCheckInStatus(patient.id).then(setCheckIn);
  }, [patient.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!consentType) {
      setError("Please select the consent type.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("recordConsent", {
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
        consent_type: consentType,
        consent_type_label: getConsentTypeLabel(consentType),
        status,
        notes,
        department: encounter?.department || "",
        encounter_id: encounter?.encounter_id || "",
      });
      setConsentType(undefined);
      setStatus("given");
      setNotes("");
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || "Could not record the consent. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Consents</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Close" : "Record Consent"}
        </Button>
      </div>

      {consents.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">No consents recorded yet.</p>
      )}
      {consents.length > 0 && (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {consents.map((c) => (
            <div key={c.id} className="p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{c.consent_type_label || getConsentTypeLabel(c.consent_type)}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === "given" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                  {c.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Obtained by {c.obtained_by_name || "-"} at {c.hospital || "-"}
                {c.department ? ` · ${c.department}` : ""}
                {c.consent_datetime ? ` · ${format(new Date(c.consent_datetime), "MMM d, yyyy · h:mm a")}` : ""}
              </p>
              {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="space-y-4 border-t border-border pt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Consent Type *</Label>
              <Select value={consentType} onValueChange={setConsentType}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {CONSENT_TYPES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONSENT_STATUSES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Details / Scope</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && (
            <p className={`text-sm ${checkIn && !checkIn.checked_in ? "text-muted-foreground flex items-start gap-2" : "text-destructive"}`}>
              {checkIn && !checkIn.checked_in && <Lock className="w-4 h-4 shrink-0 mt-0.5" />}
              {error}
            </p>
          )}
          <Button type="submit" size="sm" disabled={saving || !checkIn}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Consent"}
          </Button>
        </form>
      )}
    </div>
  );
}