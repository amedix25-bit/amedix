import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Pill, X, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LOCKED_MESSAGE } from "@/lib/checkInGate";
import MedicationSafetyAlerts from "@/components/doctor/pharmacy/MedicationSafetyAlerts";
import MedicationAutocomplete from "@/components/medications/MedicationAutocomplete";
import InhalerDeviceField from "@/components/doctor/pharmacy/InhalerDeviceField";
import ProfessionalSignaturePanel from "@/components/doctor/signature/ProfessionalSignaturePanel";

const ROUTES = [
  { value: "oral", label: "Oral" },
  { value: "intravenous", label: "Intravenous" },
  { value: "intramuscular", label: "Intramuscular" },
  { value: "subcutaneous", label: "Subcutaneous" },
  { value: "topical", label: "Topical" },
  { value: "inhalation", label: "Inhalation" },
  { value: "rectal", label: "Rectal" },
  { value: "ophthalmic", label: "Ophthalmic" },
  { value: "otic", label: "Otic" },
  { value: "nasal", label: "Nasal" },
  { value: "other", label: "Other" },
];

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomSuffix = (len) => Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");

const EMPTY = {
  medication_name: "",
  active_ingredient: "",
  strength: "",
  dosage: "",
  route: "oral",
  frequency: "",
  duration: "",
  quantity: "",
  refills_authorized: 0,
  special_instructions: "",
  inhaler_device: "",
  inhaler_device_detail: "",
  inhaler_device_instructions: "",
  technique_counselling: "",
};

// Electronic prescription issue form — part of the patient's medical record.
// Every proposed medication is first checked against the patient's record
// (allergies, current medications, interactions) through the secure
// checkMedicationSafety function; critical warnings require the doctor's
// acknowledgment and blocking conflicts prevent submission. Submitted through
// the secure createPrescription backend function, which independently
// verifies the patient's active hospital check-in.
export default function PrescriptionForm({ patient, doctorProfile, encounterId, onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [safety, setSafety] = useState(null);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [justification, setJustification] = useState("");
  const [signature, setSignature] = useState(null);
  const { toast } = useToast();
  const checkSeq = useRef(0);

  // One prescription reference per form session — a retried submission
  // re-uses it so the backend can reject duplicates idempotently.
  const [refId] = useState(() => {
    const now = new Date();
    return `PR-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${randomSuffix(4)}`;
  });

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  // Run the safety check as the doctor types the medication.
  useEffect(() => {
    const med = form.medication_name.trim();
    if (med.length < 3 || !patient?.id || !doctorProfile?.id) {
      checkSeq.current++;
      setSafety(null);
      setSafetyLoading(false);
      setAcknowledged(false);
      setJustification("");
      return;
    }
    const seq = ++checkSeq.current;
    setSafetyLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke("checkMedicationSafety", {
          patient_id: patient.id,
          doctor_id: doctorProfile.id,
          medication_name: med,
          active_ingredient: form.active_ingredient.trim(),
        });
        if (checkSeq.current !== seq) return;
        setSafety(res.data);
      } catch (err) {
        if (checkSeq.current !== seq) return;
        setSafety(null);
      } finally {
        if (checkSeq.current === seq) setSafetyLoading(false);
      }
    }, 700);
    setAcknowledged(false);
    setJustification("");
    return () => clearTimeout(timer);
  }, [form.medication_name, form.active_ingredient, patient?.id, doctorProfile?.id]);

  const blocked = !!safety?.blocked;
  const hasAlerts = (safety?.alerts || []).length > 0;
  const needsAck = !!safety && !blocked && safety.has_critical;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.medication_name.trim()) return setError("Medication name is required.");
    if (!form.frequency.trim()) return setError("Frequency is required.");
    if (!form.duration.trim()) return setError("Duration is required.");
    if (!form.quantity.trim()) return setError("Quantity to dispense is required.");
    if (blocked) return setError("Prescription blocked by the medication safety check. Choose an alternative medication.");
    if (needsAck && !acknowledged) return setError("A critical safety warning requires your acknowledgment before issuing.");
    if (needsAck && acknowledged && !justification.trim()) return setError("Describe your clinical justification for proceeding.");
    if (!signature?.signed) return setError("Apply your professional signature before issuing the prescription.");
    setSubmitting(true);
    try {
      const safety_check = safety
        ? {
            checked_datetime: new Date().toISOString(),
            alerts: safety.alerts || [],
            decision: !hasAlerts
              ? "no_warnings"
              : justification.trim()
                ? "proceeded_with_justification"
                : "acknowledged",
            justification: justification.trim(),
            acknowledged_by: doctorProfile?.full_name || "",
          }
        : undefined;
      const res = await base44.functions.invoke("createPrescription", {
        prescription_id: refId,
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
        encounter_id: encounterId || "",
        medication_name: form.medication_name.trim(),
        active_ingredient: form.active_ingredient.trim(),
        strength: form.strength.trim(),
        dosage: form.dosage.trim(),
        route: form.route,
        frequency: form.frequency.trim(),
        duration: form.duration.trim(),
        quantity: form.quantity.trim(),
        refills_authorized: Number(form.refills_authorized) || 0,
        special_instructions: form.special_instructions.trim(),
        // The inhaler device is recorded only when the prescriber selected one
        // for an inhaled medication — never inferred from the drug name.
        ...(form.route === "inhalation" && form.inhaler_device
          ? {
              inhaler_device: form.inhaler_device,
              inhaler_device_detail: form.inhaler_device_detail.trim(),
              inhaler_device_instructions: form.inhaler_device_instructions.trim(),
              technique_counselling: form.technique_counselling,
            }
          : {}),
        safety_check,
        signature_record_id: signature.signature_record_id,
        signature_version: signature.signature_version,
        signature_source: signature.source,
      });
      toast({ title: "Prescription issued", description: "Checking availability across affiliated pharmacies..." });
      setForm(EMPTY);
      setSignature(null);
      onCreated?.(res.data.prescription);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Could not issue the prescription.";
      setError(msg === "checkin_required" ? LOCKED_MESSAGE : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-1.5">
          <Pill className="w-4 h-4 text-primary" /> New Electronic Prescription
        </h4>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Medication Name <span className="text-destructive">*</span></Label>
          <MedicationAutocomplete
            value={form.medication_name}
            onChange={(name) => setForm((s) => ({ ...s, medication_name: name }))}
            onSelect={(o) => setForm((s) => ({
              ...s,
              medication_name: o.medication_name,
              active_ingredient: o.active_ingredient || s.active_ingredient,
              strength: o.strength || s.strength,
            }))}
            placeholder="e.g. Panadol"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Active Ingredient</Label>
          <Input placeholder="e.g. Paracetamol" value={form.active_ingredient} onChange={set("active_ingredient")} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Strength</Label>
          <Input placeholder="e.g. 500 mg" value={form.strength} onChange={set("strength")} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Dosage</Label>
          <Input placeholder="e.g. 1 tablet" value={form.dosage} onChange={set("dosage")} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Route</Label>
          <select
            value={form.route}
            onChange={set("route")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {ROUTES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Frequency <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. 3 times daily" value={form.frequency} onChange={set("frequency")} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Duration <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. 7 days" value={form.duration} onChange={set("duration")} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Quantity to Dispense <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. 21 tablets" value={form.quantity} onChange={set("quantity")} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Authorized Refills</Label>
          <Input type="number" min="0" value={form.refills_authorized} onChange={set("refills_authorized")} />
        </div>
      </div>
      {(form.medication_name.trim().length >= 3 || safety) && (
        <MedicationSafetyAlerts result={safety} loading={safetyLoading} />
      )}
      {needsAck && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 space-y-2.5">
          <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
            <Checkbox checked={acknowledged} onCheckedChange={(v) => setAcknowledged(!!v)} className="mt-0.5" />
            <span>
              I have reviewed the safety warning(s) above against the patient's record and accept the clinical
              responsibility for issuing this medication.
            </span>
          </label>
          {acknowledged && (
            <div className="space-y-1.5">
              <Label className="text-xs">Clinical Justification *</Label>
              <Textarea
                placeholder="e.g. benefit outweighs risk, patient monitored, allergy record reviewed and not applicable..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs">Special Instructions</Label>
        <Textarea placeholder="e.g. take with food, avoid alcohol..." value={form.special_instructions} onChange={set("special_instructions")} />
      </div>
      {form.route === "inhalation" && (
        <InhalerDeviceField
          value={{
            inhaler_device: form.inhaler_device,
            inhaler_device_detail: form.inhaler_device_detail,
            inhaler_device_instructions: form.inhaler_device_instructions,
            technique_counselling: form.technique_counselling,
          }}
          onChange={(v) => setForm((f) => ({ ...f, ...v }))}
        />
      )}
      {blocked && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          The safety rules block this prescription. Choose an alternative medication or update the patient's allergy record.
        </div>
      )}
      <ProfessionalSignaturePanel
        doctorProfile={doctorProfile}
        value={signature}
        onChange={setSignature}
        subject="prescription"
      />
      <Button type="submit" disabled={submitting || blocked || !signature?.signed || (needsAck && (!acknowledged || !justification.trim()))} className="w-full sm:w-auto">
        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Issue Prescription
      </Button>
    </form>
  );
}