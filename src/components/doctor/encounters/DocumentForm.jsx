import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCKED_MESSAGE, fetchCheckInStatus } from "@/lib/checkInGate";
import { DOCUMENT_TYPES } from "@/lib/clinicalDocuments";
import { getSpecialtyDocs, getDocDef, getSpecialtyLabel, SPECIALTY_KEYS } from "@/lib/specialtyDocuments";
import DocumentFields, { EmergencyWorkflowStrip } from "./DocumentFields";
import { Loader2, Lock, PenLine } from "lucide-react";

// Creates a new clinical document in an encounter, or — in amend mode — a
// new VERSION of a signed document (the original is never overwritten).
// Offers the general document types to every doctor plus the doctor's own
// specialty paperwork (Internal Medicine, Surgery, Emergency Medicine,
// Pediatrics, OB/GYN, Anesthesiology) with its structured fields.
export default function DocumentForm({ doctorProfile, patient, encounter, amendOf, onSaved, onCancel }) {
  const [documentType, setDocumentType] = useState(undefined);
  const [content, setContent] = useState(amendOf ? amendOf.content || "" : "");
  const [amendmentReason, setAmendmentReason] = useState("");
  const [dataValues, setDataValues] = useState(() => {
    const initial = {};
    if (amendOf && amendOf.data) {
      Object.entries(amendOf.data).forEach(([k, v]) => { initial[k] = v && v.value !== undefined ? v.value : ""; });
    }
    return initial;
  });
  const [checkIn, setCheckIn] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCheckInStatus(patient.id).then(setCheckIn);
  }, [patient.id]);

  const myDocs = doctorProfile ? getSpecialtyDocs(doctorProfile.specialization) : [];
  const mySpecialtyKey = doctorProfile ? SPECIALTY_KEYS[doctorProfile.specialization] : null;
  const activeType = amendOf ? amendOf.document_type : documentType;
  const def = getDocDef(activeType);
  const hasFields = !!(def && def.fields && def.fields.length > 0);

  const setData = (key, value) => setDataValues((s) => ({ ...s, [key]: value }));

  const buildData = () => {
    if (!def) return {};
    const data = {};
    def.fields.forEach((f) => {
      const v = dataValues[f.key];
      if (v !== undefined && v !== null && v !== "") data[f.key] = { label: f.label, value: String(v) };
    });
    return data;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!amendOf && !documentType) {
      setError("Please select the document type.");
      return;
    }
    const data = buildData();
    if (!content.trim() && Object.keys(data).length === 0) {
      setError(hasFields ? "Please fill in the document fields or the narrative." : "Please write the document content.");
      return;
    }
    if (amendOf && !amendmentReason.trim()) {
      setError("Please enter the reason for the amendment.");
      return;
    }
    if (!checkIn?.checked_in) {
      setError(LOCKED_MESSAGE);
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (amendOf) {
        const res = await base44.functions.invoke("amendClinicalDocument", {
          document_record_id: amendOf.id,
          content,
          data,
          amendment_reason: amendmentReason,
        });
        onSaved(res.data.document);
      } else {
        const label =
          DOCUMENT_TYPES.find((d) => d.key === documentType)?.label ||
          getDocDef(documentType)?.label ||
          documentType;
        const res = await base44.functions.invoke("createClinicalDocument", {
          patient_id: patient.id,
          doctor_id: doctorProfile.id,
          encounter_id: encounter.encounter_id,
          document_type: documentType,
          document_type_label: label,
          content,
          data,
        });
        onSaved(res.data.document);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Could not save the document. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <PenLine className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">
          {amendOf ? `Amend — New Version of ${amendOf.document_type_label}` : "New Clinical Document"}
        </h3>
      </div>
      {amendOf ? (
        <p className="text-sm text-muted-foreground">
          Version {amendOf.version} is signed and permanently preserved. This creates Version {amendOf.version + 1} under
          the same AMedix Document ID ({amendOf.document_id}) — the original stays in the audit history.
        </p>
      ) : (
        <div className="space-y-1.5">
          <Label>Document Type *</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select a document type..." /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectGroup>
                <SelectLabel>General Documents</SelectLabel>
                {DOCUMENT_TYPES.map((d) => (
                  <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                ))}
              </SelectGroup>
              {mySpecialtyKey && myDocs.length > 0 && (
                <SelectGroup>
                  <SelectLabel>{getSpecialtyLabel(mySpecialtyKey)} — Specialty Documents</SelectLabel>
                  {myDocs.map((d) => (
                    <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {def && def.specialty === "emergency_medicine" && <EmergencyWorkflowStrip />}

      {hasFields && (
        <DocumentFields defs={def.fields} values={dataValues} onChange={setData} />
      )}

      {amendOf && (
        <div className="space-y-1.5">
          <Label>Reason for Amendment *</Label>
          <Input value={amendmentReason} onChange={(e) => setAmendmentReason(e.target.value)} placeholder="e.g. Corrected diagnosis wording" />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>{hasFields ? "Additional Narrative (optional)" : "Content *"}</Label>
        <Textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Document the clinical content..." />
      </div>
      {error && (
        <p className={`text-sm ${checkIn && !checkIn.checked_in ? "text-muted-foreground flex items-start gap-2" : "text-destructive"}`}>
          {checkIn && !checkIn.checked_in && <Lock className="w-4 h-4 shrink-0 mt-0.5" />}
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !checkIn}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : amendOf ? `Save Version ${amendOf.version + 1}` : "Save Document"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}