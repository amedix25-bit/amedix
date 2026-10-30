import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCKED_MESSAGE, fetchCheckInStatus } from "@/lib/checkInGate";
import { DOCUMENT_TYPES } from "@/lib/clinicalDocuments";
import { isReferralNoteType } from "@/lib/noteSectionPolicy";
import { getSpecialtyDocs, getDocDef, getSpecialtyLabel, SPECIALTY_KEYS } from "@/lib/specialtyDocuments";
import DocumentFields, { EmergencyWorkflowStrip, isFieldVisible } from "./DocumentFields";
import SurgeryGuidelineBasis from "@/components/doctor/notes/SurgeryGuidelineBasis";
import ToothChart from "@/components/doctor/dental/ToothChart";
import { CERTIFICATE_DEFS, CERTIFICATE_KEYS } from "@/lib/specialtyDocumentsPart4";
import { Loader2, Lock, PenLine } from "lucide-react";
import MedicalDictationButton from "@/components/doctor/dictation/MedicalDictationButton";
import { formatFieldValue } from "@/lib/clinicalFieldValue";
import { buildNeurologyAuditPayload } from "@/lib/neurologyAudit";

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
  const [photoUris, setPhotoUris] = useState(() => (amendOf && Array.isArray(amendOf.photo_file_uris) ? amendOf.photo_file_uris : []));
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [checkIn, setCheckIn] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCheckInStatus(patient.id).then(setCheckIn);
  }, [patient.id]);

  // Specialty-aware documentation — the PRACTICING specialty of this
  // encounter (chosen by the doctor when they hold more than one verified
  // specialty, otherwise their profile specialty) decides which specialty's
  // paperwork is offered. Surgeons keep their dedicated Surgical Records
  // system exactly as it is.
  const practicingSpecialty = (encounter && encounter.doctor_specialty) || (doctorProfile && doctorProfile.specialization) || "";
  const myDocs = practicingSpecialty ? getSpecialtyDocs(practicingSpecialty) : [];
  const mySpecialtyKey = practicingSpecialty ? SPECIALTY_KEYS[practicingSpecialty] : null;
  const activeType = amendOf ? amendOf.document_type : documentType;
  const def = getDocDef(activeType);
  const hasFields = !!(def && def.fields && def.fields.length > 0);

  const setData = (key, value) => setDataValues((s) => ({ ...s, [key]: value }));
  // Neurology medication alerts, critical findings, escalations and emergencies are
  // sent beside the note so each becomes its own audit entry. Built from the values
  // the clinician documented; null for every other specialty.
  const neurologyAudit = buildNeurologyAuditPayload(dataValues);

  // The interactive Tooth Chart is linked to the patient's dental encounters
  // and dental treatment history — tooth statuses recorded in the patient's
  // earlier dental documents are overlaid on the chart for every new dental
  // document (oldest to newest, latest entry wins).
  const [dentalHistory, setDentalHistory] = useState({});
  useEffect(() => {
    if (!def?.toothChart || !patient?.id) {
      setDentalHistory({});
      return undefined;
    }
    let cancelled = false;
    base44.functions
      .invoke("doctorPatientMedicalData", { patient_id: patient.id })
      .then((res) => {
        if (cancelled) return;
        const docs = (res.data.clinical_documents || []).filter((d) => d.specialty === "dentistry");
        const map = {};
        docs.forEach((d) => {
          const tc = d.data?.tooth_chart?.value;
          if (Array.isArray(tc)) {
            tc.forEach((e) => {
              if (e && e.tooth) {
                map[e.tooth] = {
                  status: e.status, note: e.note,
                  doc: d.document_type_label, date: d.created_datetime,
                };
              }
            });
          }
        });
        setDentalHistory(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [def?.key, patient?.id]);

  // Clinical photographs (e.g. dermatology lesion photos) — uploaded to
  // PRIVATE storage and attached to the lesion document and its encounter.
  // They follow the same permission, access control and audit rules as all
  // other clinical information.
  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 6 - photoUris.length);
    if (!files.length) return;
    setUploadingPhotos(true);
    try {
      const uris = [];
      for (const f of files) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: f });
        uris.push(file_uri);
      }
      setPhotoUris((s) => [...s, ...uris]);
    } catch (err) {
      setError("Could not upload the photographs. Please try again.");
    } finally {
      setUploadingPhotos(false);
      e.target.value = "";
    }
  };

  const buildData = () => {
    if (!def) return {};
    const data = {};
    def.fields.filter((f) => isFieldVisible(f, dataValues)).forEach((f) => {
      const v = dataValues[f.key];
      const text = v === undefined || v === null ? "" : formatFieldValue(f.type, v);
      if (text !== "") data[f.key] = { label: f.label, value: text };
    });
    // The interactive Tooth Chart saves its entries (FDI tooth number, status,
    // note) into the document's structured data — attached to this dental
    // encounter and the longitudinal patient record like any other document.
    if (def.toothChart && Array.isArray(dataValues.tooth_chart) && dataValues.tooth_chart.length > 0) {
      data.tooth_chart = { label: "Tooth Chart", value: dataValues.tooth_chart };
    }
    return data;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!amendOf && !documentType) {
      setError("Please select the document type.");
      return;
    }
    // Required documentation in the selected template — every required field
    // offers a "not assessed / not performed" option, so this asks for an
    // explicit answer rather than blocking emergency documentation.
    const missingRequired = ((def && def.fields) || [])
      .filter((f) => isFieldVisible(f, dataValues))
      .filter((f) => f.required && String(dataValues[f.key] ?? "").trim() === "");
    if (missingRequired.length > 0) {
      setError(`Complete the required documentation: ${missingRequired.map((f) => f.label).join(", ")}.`);
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
          photo_file_uris: photoUris,
          amendment_reason: amendmentReason,
          neurology_audit: neurologyAudit,
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
          photo_file_uris: photoUris,
          neurology_audit: neurologyAudit,
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
              {mySpecialtyKey && myDocs.length > 0 && (
                <SelectGroup>
                  <SelectLabel>{getSpecialtyLabel(mySpecialtyKey)} — Your Specialty Documents</SelectLabel>
                  {myDocs.map((d) => (
                    <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                  ))}
                </SelectGroup>
              )}
              <SelectGroup>
                <SelectLabel>General Documents</SelectLabel>
                {DOCUMENT_TYPES.filter((d) => !CERTIFICATE_KEYS.includes(d.key) && !isReferralNoteType(d)).map((d) => (
                  <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Certificates & Official Documents</SelectLabel>
                {CERTIFICATE_DEFS.map((d) => (
                  <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {def && def.specialty === "emergency_medicine" && <EmergencyWorkflowStrip />}

      {hasFields && <SurgeryGuidelineBasis documentKey={def.key} />}

      {hasFields && (
        <DocumentFields defs={def.fields} values={dataValues} onChange={setData} specialty={practicingSpecialty} notice={def.notice || ""} patientId={patient?.id || ""} />
      )}

      {def && def.toothChart && (
        <div className="space-y-1.5">
          <Label>Tooth Chart</Label>
          <ToothChart
            value={Array.isArray(dataValues.tooth_chart) ? dataValues.tooth_chart : []}
            onChange={(entries) => setData("tooth_chart", entries)}
            history={dentalHistory}
          />
        </div>
      )}

      {def && def.photos && (
        <div className="space-y-1.5">
          <Label>Clinical Photographs ({photoUris.length}/6)</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotos}
            disabled={uploadingPhotos || photoUris.length >= 6}
          />
          {uploadingPhotos && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading photographs...
            </p>
          )}
          {photoUris.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photoUris.map((uri) => (
                <span key={uri} className="text-xs bg-secondary px-2 py-1 rounded-md flex items-center gap-1.5">
                  Photograph attached
                  <button
                    type="button"
                    onClick={() => setPhotoUris((s) => s.filter((u) => u !== uri))}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove photograph"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Photographs are attached to this lesion document and its encounter, stored privately, and follow the same
            permission, access control, audit and patient privacy rules as all clinical information.
          </p>
        </div>
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
        <MedicalDictationButton
          value={content}
          onChange={setContent}
          specialty={practicingSpecialty}
          contextLabel="Clinical document content — progress notes, discharge summaries and specialty documentation"
        />
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