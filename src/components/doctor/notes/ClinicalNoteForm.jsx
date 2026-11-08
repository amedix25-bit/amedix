import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MedicalDictationButton from "@/components/doctor/dictation/MedicalDictationButton";
import ExaminationsTab from "@/components/doctor/examination/ExaminationsTab";
import VitalSignsForm from "@/components/doctor/notes/VitalSignsForm";
import { mealLabel, medicationRecordFromForm } from "@/lib/medicationUtils";
import { fetchCheckInStatus, LOCKED_MESSAGE } from "@/lib/checkInGate";
import DocumentFields, { isFieldVisible } from "@/components/doctor/encounters/DocumentFields";
import DoctorAntenatalSection from "@/components/doctor/antenatal/DoctorAntenatalSection";
import ObgynExamSection from "@/components/doctor/notes/ObgynExamSection";
import { flattenExamValues, examAnyValue, examAbnormalCount } from "@/lib/obgynExamSchema";
import ObgynSrhSection from "@/components/doctor/notes/ObgynSrhSection";
import { flattenSrhValues, srhAnyValue, srhGroupsForDoc, srhConcernCount } from "@/lib/obgynSrhSchema";
import { getSpecialtyDocs, getDocDef, SPECIALTY_KEYS } from "@/lib/specialtyDocuments";
import { getDiseaseDocs, getDiseaseDocKeys, getDiseaseGroups, getDiseaseAliases } from "@/lib/diseaseSpecificNotes";
import NoteAccordionSection from "@/components/doctor/notes/NoteAccordionSection";
import SurgeryGuidelineBasis from "@/components/doctor/notes/SurgeryGuidelineBasis";
import DiagnosisNotePicker from "@/components/doctor/notes/DiagnosisNotePicker";
import NoteSectionNav from "@/components/doctor/notes/NoteSectionNav";
import PatientAlertHeader from "@/components/doctor/notes/PatientAlertHeader";
import { formatFieldValue } from "@/lib/clinicalFieldValue";
import { X, Search, Loader2, ArrowRight, Plus, Lock, CheckCircle2 } from "lucide-react";

// "General Clinical Note" — the universal free-text note with no
// specialty-specific structured template.
const GENERAL_KEY = "__general__";
// Pseudo note type: choose the diagnosis first, then its note template loads.
const DIAGNOSIS_KEY = "__diagnosis__";

const EMPTY = {
  patient_cin: "",
  encounter_datetime: "",
  location: "",
  history: "",
  vitals: { temperature: "", pulse: "", respiratory_rate: "", blood_pressure: "", spo2: "" },
  physical_examination: "",
  provisional_diagnoses: [""],
  prescription: "",
  interventions: "",
  biopsy: "",
  recommendations: "",
};

// Universal Specialty-Based Clinical Notes interface — the same reusable
// accordion form adapts to every specialty: the doctor's verified specialty
// loads its own note types and structured template, all presented as compact,
// independently collapsible sections with completion status and jump
// navigation. Data flows, permissions and workflows are unchanged.
export default function ClinicalNoteForm({ doctorProfile, onSaved, onCancel, onNavigateTab, preselectedPatient }) {
  const [form, setForm] = useState(EMPTY);
  const [patient, setPatient] = useState(preselectedPatient || null);
  const [selectedLabs, setSelectedLabs] = useState(new Set());
  const [selectedImaging, setSelectedImaging] = useState(new Set());
  const [medications, setMedications] = useState([]);
  const [finding, setFinding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draftId, setDraftId] = useState(null);
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // Specialty-aware note structure — AMedix automatically detects the
  // doctor's verified specialty from their profile; the doctor is NEVER
  // asked to select it again. Only the doctor's own specialty's note types
  // are offered, and choosing one loads its structured template.
  const mySpecialty = doctorProfile?.specialization || "";
  const mySpecialtyKey = mySpecialty ? SPECIALTY_KEYS[mySpecialty] : "";
  // Disease-specific note templates of this specialty — listed in full under
  // "Disease-Specific Note" so every condition template is reachable at once.
  const diseaseDocs = mySpecialtyKey ? getDiseaseDocs(mySpecialtyKey) : [];
  const diseaseGroups = mySpecialtyKey ? getDiseaseGroups(mySpecialtyKey) : [];
  const diseaseAliases = mySpecialtyKey ? getDiseaseAliases(mySpecialtyKey) : {};
  const diseaseKeys = mySpecialtyKey ? getDiseaseDocKeys(mySpecialtyKey) : new Set();
  // Every note type of the doctor's specialty is listed directly. Disease-
  // specific templates are ALSO reachable through "Disease-Specific Note", so
  // they are not repeated in the main list.
  const myDocs = mySpecialty
    ? getSpecialtyDocs(mySpecialty).filter((d) => !diseaseKeys.has(d.key))
    : [];
  const [docType, setDocType] = useState(
    // Emergency Medicine defaults to the unified workflow note; every other
    // specialty defaults to its consultation template.
    () => (myDocs.find((d) => d.workflow) || myDocs.find((d) => d.key.includes("consultation")) || myDocs[0] || { key: GENERAL_KEY }).key
  );
  // "Diagnosis-Specific Note" mode — the list of diagnosis templates that
  // were already part of General Surgery stays on screen, and the template of
  // the chosen diagnosis opens below it.
  const [diagnosisMode, setDiagnosisMode] = useState(false);
  const [dataValues, setDataValues] = useState({});
  const isDiagnosisDoc = diseaseKeys.has(docType);
  const activeDef = docType && docType !== GENERAL_KEY ? getDocDef(docType) : null;
  // While only the diagnosis list is showing (no diagnosis chosen yet) the
  // previous note type's template is not displayed.
  const hasSpecialtyFields =
    !(diagnosisMode && !isDiagnosisDoc) && !!(activeDef && activeDef.fields && activeDef.fields.length > 0);
  // In specialty mode the note displays ONLY the specialty's own fields —
  // the universal generic sections (History, Vital Signs, Physical
  // Examination, Interventions, Biopsy, Recommendations) are replaced by the
  // specialty-specific structure. Diagnosis, prescriptions and the
  // lab/imaging links stay — they are the platform-wide clinical record.
  const isGeneralNote = !activeDef;
  // Structured Clinical Examination — every Obstetrics & Gynaecology
  // sub-clinical note carries a context-aware examination module (Macleod's
  // examination framework + WHO maternal-care assessments), stored as
  // structured findings distinct from diagnosis and management.
  const isObgynDoc = activeDef?.specialty === "obstetrics_gynecology";
  const [examValues, setExamValues] = useState({});
  const examFilled = isObgynDoc && examAnyValue(examValues);
  const examAbnormal = isObgynDoc ? examAbnormalCount(examValues) : 0;
  // Structured Sexual & Reproductive History — sensitive, encounter-adapted,
  // and kept separate from the Clinical Examination section.
  const [srhValues, setSrhValues] = useState({});
  const srhGroups = isObgynDoc ? srhGroupsForDoc(docType) : [];
  const srhFilled = isObgynDoc && srhGroups.length > 0 && srhAnyValue(srhValues);
  const srhConcerns = isObgynDoc ? srhConcernCount(srhValues) : 0;
  const [photoUris, setPhotoUris] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  // Universal AMedix record context — allergies, active medications and
  // previous history pulled automatically from the patient's unified record
  // and attached to the note; the doctor never re-enters any of it.
  const [recordContext, setRecordContext] = useState(null);
  const loadRecordContext = async (p) => {
    try {
      const res = await base44.functions.invoke("doctorPatientMedicalData", { patient_id: p.id });
      const d = res.data;
      setRecordContext({
        meds: (d.medications || []).filter((m) => m.is_active).map((m) => m.name).filter(Boolean),
        conditions: (d.conditions || []).map((c) => c.name).filter(Boolean),
      });
    } catch (err) {
      console.error(err);
      setRecordContext(null);
    }
  };
  // Backend-verified check-in gate — the clinical functions stay locked until
  // the patient is checked in at the doctor's hospital.
  const [checkedIn, setCheckedIn] = useState(false);
  const [gateLoading, setGateLoading] = useState(false);

  const loadGate = async (patientId) => {
    setGateLoading(true);
    const s = await fetchCheckInStatus(patientId);
    setCheckedIn(!!s.checked_in);
    setGateLoading(false);
  };

  // Universal accordion state — every section starts collapsed in every
  // specialty, so only the section being worked on is expanded. Entered
  // information is preserved because all values live in this form's state
  // regardless of which section is open.
  const [openIds, setOpenIds] = useState(() => new Set());
  const toggleSection = (id) =>
    setOpenIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const jumpTo = (id) => {
    setOpenIds((s) => new Set([...s, id]));
    setTimeout(() => {
      document.getElementById(`note-section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const restoreDraft = (d) => {
    setDraftId(d.id);
    if (d.specialty_doc_type) setDocType(d.specialty_doc_type);
    if (d.specialty_data_values) setDataValues(d.specialty_data_values);
    if (d.exam_values) setExamValues(d.exam_values);
    if (d.srh_values) setSrhValues(d.srh_values);
    if (Array.isArray(d.photo_file_uris)) setPhotoUris(d.photo_file_uris);
    if (d.form_data)
      setForm((f) => {
        const merged = { ...f, ...d.form_data };
        if (!Array.isArray(merged.provisional_diagnoses) || merged.provisional_diagnoses.length === 0) {
          merged.provisional_diagnoses = merged.diagnosis ? [merged.diagnosis] : [""];
        }
        return merged;
      });
    if (Array.isArray(d.medications)) setMedications(d.medications);
    if (Array.isArray(d.selected_lab_request_ids)) setSelectedLabs(new Set(d.selected_lab_request_ids));
    if (Array.isArray(d.selected_imaging_request_ids)) setSelectedImaging(new Set(d.selected_imaging_request_ids));
    // Restoring a draft never expands a section — every section stays
    // collapsed until the doctor opens the one they are working on.
  };

  useEffect(() => {
    if (!preselectedPatient) return;
    setPatient(preselectedPatient);
    const loadDraft = async () => {
      try {
        const drafts = await base44.entities.ClinicalNoteDraft.filter({ patient_id: preselectedPatient.id, doctor_id: doctorProfile.id });
        if (drafts.length > 0) restoreDraft(drafts[0]);
      } catch (err) {
        console.error(err);
      }
    };
    loadDraft();
    loadGate(preselectedPatient.id);
    loadRecordContext(preselectedPatient);
  }, [preselectedPatient, doctorProfile]);

  const findPatient = async () => {
    setError("");
    setPatient(null);
    setDraftId(null);
    setSelectedLabs(new Set());
    setSelectedImaging(new Set());
    if (!form.patient_cin.trim()) return;
    setFinding(true);
    try {
      const patients = await base44.entities.PatientProfile.filter({ cin: form.patient_cin.toUpperCase() });
      if (patients.length === 0) {
        setError("Patient not found. Please check the CIN.");
        return;
      }
      const p = patients[0];
      setPatient(p);
      loadGate(p.id);
      loadRecordContext(p);
      const drafts = await base44.entities.ClinicalNoteDraft.filter({ patient_id: p.id, doctor_id: doctorProfile.id });
      if (drafts.length > 0) restoreDraft(drafts[0]);
    } catch (err) {
      console.error(err);
      setError("Could not load the patient's requests.");
    } finally {
      setFinding(false);
    }
  };

  // Clinical photographs (e.g. dermatology lesion photos) — uploaded to
  // PRIVATE storage and attached to the note, following the same permission,
  // access control and audit rules as all other clinical information.
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

  const saveDraft = async () => {
    const payload = {
      patient_id: patient.id,
      doctor_id: doctorProfile.id,
      patient_cin: patient.cin,
      patient_name: patient.full_name,
      form_data: { ...form },
      specialty_doc_type: docType,
      specialty_data_values: dataValues,
      exam_values: examValues,
      srh_values: srhValues,
      photo_file_uris: photoUris,
      medications,
      selected_lab_request_ids: [...selectedLabs],
      selected_imaging_request_ids: [...selectedImaging],
    };
    if (draftId) {
      await base44.entities.ClinicalNoteDraft.update(draftId, payload);
    } else {
      const created = await base44.entities.ClinicalNoteDraft.create(payload);
      setDraftId(created.id);
    }
  };

  // Autosave — every entry is saved to the reliable per-patient draft a
  // moment after the doctor stops typing, with visible save-status feedback.
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const autosaveSuppress = useRef(true);
  const anyVital = Object.values(form.vitals || {}).some((v) => String(v).trim());
  const noteHasContent =
    (docType && docType !== GENERAL_KEY) ||
    photoUris.length > 0 ||
    (form.history || "").trim() ||
    (form.physical_examination || "").trim() ||
    (form.recommendations || "").trim() ||
    (form.provisional_diagnoses || []).some((d) => d.trim()) ||
    anyVital ||
    Object.values(dataValues).some((v) => v !== undefined && v !== null && String(v).trim() !== "") ||
    (isObgynDoc && examAnyValue(examValues)) ||
    (isObgynDoc && srhAnyValue(srhValues)) ||
    medications.some((m) => m.name.trim()) ||
    selectedLabs.size > 0 ||
    selectedImaging.size > 0;

  useEffect(() => {
    if (!patient) return;
    if (autosaveSuppress.current) {
      autosaveSuppress.current = false;
      return;
    }
    if (!noteHasContent && !draftId) return;
    const t = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        await saveDraft();
        setSaveStatus("saved");
      } catch (err) {
        console.error(err);
        setSaveStatus("error");
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [form, dataValues, photoUris, docType, medications, selectedLabs, selectedImaging, patient, examValues, srhValues]);

  const saveDraftAndContinueToLabs = async () => {
    if (!patient) {
      setError("Find the patient first.");
      return;
    }
    setSavingDraft(true);
    setError("");
    try {
      await saveDraft();
      setShowDraftConfirm(false);
      onNavigateTab("labs", { patient });
    } catch (err) {
      console.error(err);
      setError("Could not save the draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  // Single path for choosing a note type — used by the note type selector and
  // by the Diagnosis-Specific Notes list, so both behave identically.
  const selectDocType = (v) => {
    setDocType(v);
    setDataValues({});
    setExamValues({});
    setSrhValues({});
    if (!getDocDef(v)?.photos) setPhotoUris([]);
    // Choosing a note type loads its template but opens no section — every
    // specialty template stays collapsed so the whole note fits on screen.
  };

  // Note type change — "Diagnosis-Specific Note" first asks for the diagnosis;
  // only after one is chosen does its template load for documentation.
  const handleNoteTypeChange = (v) => {
    if (v === DIAGNOSIS_KEY) {
      // Selecting "Diagnosis-Specific Note" opens a diagnosis template straight
      // away — the first one loads, and the doctor switches diagnosis from the
      // list. Selecting a template is always the same path as any note type.
      setDiagnosisMode(true);
      return;
    }
    setDiagnosisMode(false);
    selectDocType(v);
  };

  // A diagnosis template is loaded through the same path as any note type
  // chosen from the selector, then its template is opened on screen.
  const handleDiagnosisSelect = (key) => {
    setDiagnosisMode(true);
    selectDocType(key);
    setTimeout(() => {
      document.getElementById("note-section-template")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 160);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!patient) {
      setError("Find the patient first.");
      return;
    }
    if (!form.location) {
      setError("Select the location of the encounter.");
      jumpTo("encounter");
      return;
    }
    const diagnoses = (form.provisional_diagnoses || []).map((d) => d.trim()).filter(Boolean);
    if (diagnoses.length === 0) {
      setError("Provisional diagnosis is required.");
      jumpTo("diagnosis");
      return;
    }
    // Required documentation — only fields the loaded template marks as
    // required, each of which offers a "not assessed / not performed" answer,
    // so emergency documentation is made explicit rather than blocked.
    const missingRequired = (activeDef?.fields || [])
      .filter((f) => isFieldVisible(f, dataValues))
      .filter((f) => f.required && String(dataValues[f.key] ?? "").trim() === "");
    if (missingRequired.length > 0) {
      setError(`Complete the required documentation: ${missingRequired.map((f) => f.label).join(", ")}.`);
      jumpTo("template");
      return;
    }
    // A confirmed diagnosis coded to a less specific category than the catalogue
    // offers must state why, so "unspecified" is a documented decision and never
    // a shortcut. Only fields that ask for that justification enforce it.
    const unjustifiedCodes = (activeDef?.fields || [])
      .filter((f) => f.type === "icd11_diagnoses" && f.unspecifiedJustification)
      .flatMap((f) =>
        (Array.isArray(dataValues[f.key]) ? dataValues[f.key] : []).filter(
          (d) => d && d.status === "Confirmed" && d.specificity_hint && !String(d.unspecified_reason || "").trim(),
        ),
      );
    if (unjustifiedCodes.length > 0) {
      setError(
        `Justify the less specific ICD-11 category before saving: ${unjustifiedCodes
          .map((d) => `${d.display || "diagnosis"}${d.code ? ` (${d.code})` : ""}`)
          .join("; ")}.`,
      );
      jumpTo("template");
      return;
    }
    const meds = medications.filter((m) => m.name.trim());
    const prescriptionSummary = meds
      .map((m) =>
        `${m.name.trim()}` +
        `${m.dose.trim() ? ` — Dose: ${m.dose.trim()}` : ""}` +
        `${m.route ? ` — Route: ${m.route}` : ""}` +
        `${m.prn
          ? ` — PRN (as needed)${(m.max_frequency || "").trim() ? ` · Max: ${(m.max_frequency || "").trim()}` : ""}`
          : `${(m.frequency || "").trim() ? ` — Frequency: ${(m.frequency || "").trim()}` : ""}`}` +
        `${m.meal ? ` — ${mealLabel(m.meal)}` : ""}` +
        `${m.duration ? ` — Duration: ${m.duration} days` : ""}` +
        `${(m.reason || "").trim() ? ` — Indication: ${(m.reason || "").trim()}` : ""}` +
        `${m.notes.trim() ? ` — Notes: ${m.notes.trim()}` : ""}` +
        `${(m.special_instructions || "").trim() ? ` — Special instructions: ${(m.special_instructions || "").trim()}` : ""}`
      )
      .join("\n");
    const v = form.vitals || {};
    const vitalsSummary = [
      v.blood_pressure ? `BP: ${v.blood_pressure} mmHg` : "",
      v.pulse ? `Pulse: ${v.pulse} bpm` : "",
      v.temperature ? `Temp: ${v.temperature}°C` : "",
      v.respiratory_rate ? `RR: ${v.respiratory_rate} breaths/min` : "",
      v.spo2 ? `SpO₂: ${v.spo2}%` : "",
    ].filter(Boolean).join(" · ");
    // The specialty-specific structured fields captured by the loaded
    // template — saved with the note so it stays linked to the specialty
    // note type that produced it.
    const specialtyData = {};
    if (activeDef && activeDef.fields) {
      activeDef.fields.filter((f) => isFieldVisible(f, dataValues)).forEach((f) => {
        const val = dataValues[f.key];
        const text = val === undefined || val === null ? "" : formatFieldValue(f.type, val);
        if (text !== "") specialtyData[f.key] = { label: f.label, value: text };
      });
    }
    // Structured examination findings — saved with the note under their own
    // label prefix, distinct from the template fields, diagnoses and
    // management, and mapped to ICD-11 concepts separately by the
    // terminology system.
    if (isObgynDoc) {
      flattenExamValues(examValues, docType).forEach(({ key, label, value }) => {
        specialtyData[`exam.${key}`] = { label, value };
      });
    }
    // Structured sexual & reproductive history — saved under the sensitive
    // "srh." prefix so it stays separated from general summaries, printed
    // exports, notifications and shared records. Recorded as patient-reported
    // or verified history; no ICD-11 codes are assigned to history responses.
    if (isObgynDoc && srhGroups.length > 0) {
      flattenSrhValues(srhValues, docType).forEach(({ key, label, value }) => {
        specialtyData[`srh.${key}`] = { label, value };
      });
    }
    // Structured ICD-11 diagnoses — stored machine-readably beside the formatted
    // note text, so the patient record, the audit trail and any later coding
    // review read the same codes with the same provenance instead of re-parsing
    // a sentence. An unresolved or unverified mapping keeps its state here.
    const codedDiagnoses = [];
    if (activeDef && activeDef.fields) {
      activeDef.fields
        .filter((f) => f.type === "icd11_diagnoses" && isFieldVisible(f, dataValues))
        .forEach((f) => {
          (Array.isArray(dataValues[f.key]) ? dataValues[f.key] : []).forEach((d) => {
            if (!d || !d.display) return;
            codedDiagnoses.push({
              field_key: f.key,
              code: d.code || "",
              display: d.display,
              system: d.system || "ICD-11-MMS",
              system_uri: d.system_uri || "http://id.who.int/icd/release/11/mms",
              release: d.release || "",
              source: d.source || "",
              verified_date: d.verified_date || "",
              coding_note: d.coding_note || "",
              specificity: d.specificity || "",
              role: d.role || "",
              status: d.status || "",
              mapping_state: d.mapping_state || (d.manual ? "review_required" : "verified"),
              basis: d.basis || "",
              follow_up: d.follow_up || "",
              // WHO provenance and the official record detail travel with the
              // code, together with the append-only coding history, so a coded
              // diagnosis stays auditable after it is modified.
              who_uri: d.who_uri || "",
              who_browser_url: d.who_browser_url || "",
              definition: d.definition || "",
              inclusions: Array.isArray(d.inclusions) ? d.inclusions : [],
              exclusions: Array.isArray(d.exclusions) ? d.exclusions : [],
              index_terms: Array.isArray(d.index_terms) ? d.index_terms : [],
              ancestors: Array.isArray(d.ancestors) ? d.ancestors : [],
              cluster: d.cluster || "",
              language: d.language || "",
              retrieved_at: d.retrieved_at || "",
              detail_status: d.detail_status || "",
              coding_history: Array.isArray(d.coding_history) ? d.coding_history : [],
            });
          });
        });
    }
    setSaving(true);
    try {
      // The backend independently verifies the active check-in before creating
      // the note — the frontend lock is only a visual hint.
      await base44.functions.invoke("createClinicalNote", {
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        doctor_name: doctorProfile.full_name,
        date: new Date().toISOString().slice(0, 10),
        encounter_datetime: form.encounter_datetime ? new Date(form.encounter_datetime).toISOString() : "",
        location: form.location,
        history: form.history,
        vital_signs: vitalsSummary,
        physical_examination: form.physical_examination,
        provisional_diagnoses: diagnoses,
        diagnosis: diagnoses.join("; "),
        prescription: prescriptionSummary,
        interventions: form.interventions,
        biopsy: form.biopsy,
        lab_request_ids: [...selectedLabs],
        imaging_request_ids: [...selectedImaging],
        recommendations: form.recommendations,
        specialty: mySpecialtyKey,
        document_type: docType !== GENERAL_KEY ? docType : "",
        document_type_label: docType !== GENERAL_KEY ? activeDef?.label || docType : "",
        data: specialtyData,
        icd11_coded_diagnoses: codedDiagnoses,
        photo_file_uris: photoUris,
      });
      if (meds.length > 0) {
        await base44.entities.Medication.bulkCreate(
          meds.map((m) => medicationRecordFromForm(m, { patient, fallbackReason: diagnoses[0] }))
        );
      }
      if (draftId) {
        try { await base44.entities.ClinicalNoteDraft.delete(draftId); } catch (e) { console.error(e); }
      }
      onSaved();
    } catch (err) {
      console.error(err);
      setError("Could not save the clinical note.");
    } finally {
      setSaving(false);
    }
  };

  // Universal section map — one reusable accordion adapts to the loaded
  // specialty template; general sections appear only when they apply and
  // doctors are never forced to complete irrelevant specialty sections.
  const diagnosesFilled = (form.provisional_diagnoses || []).some((d) => d.trim());
  const specialtyFilled = hasSpecialtyFields
    ? activeDef.fields.filter((f) => String(dataValues[f.key] ?? "").trim() !== "").length
    : 0;
  const sections = [
    { id: "encounter", title: "Encounter Details", required: true, complete: !!(form.location && form.encounter_datetime) },
    { id: "noteType", title: "Note Type", complete: !!docType },
    // Every General Surgery diagnosis-specific template stays listed on screen
    // — searchable by diagnosis — exactly as before, with the chosen one
    // loading through the same template path as any other note type.
    ...(diseaseDocs.length > 0
      ? [{
          id: "dxTemplates",
          title: "Disease-Specific Notes",
          complete: isDiagnosisDoc,
          hint: isDiagnosisDoc ? activeDef?.label : `${diseaseDocs.length} templates — view all and select`,
        }]
      : []),
    ...(hasSpecialtyFields
      ? [{ id: "template", title: activeDef.label, complete: specialtyFilled > 0, hint: `${specialtyFilled}/${activeDef.fields.length} fields` }]
      : []),
    // Obstetrics & Gynecology — the full antenatal care module (WHO 8-contact
    // schedule, screening tracker, risk assessment and decision support) lives
    // inside the Antenatal Follow-Up note type.
    ...(srhGroups.length > 0
      ? [{
          id: "srh",
          title: "Sexual & Reproductive History",
          complete: srhFilled,
          hint: srhConcerns > 0 ? `⚠ ${srhConcerns} concerning answer${srhConcerns > 1 ? "s" : ""} — review` : "sensitive — private & trauma-informed",
        }]
      : []),
    ...(isObgynDoc
      ? [{
          id: "obexam",
          title: "Clinical Examination",
          complete: examFilled,
          hint: examAbnormal > 0 ? `⚠ ${examAbnormal} abnormal finding${examAbnormal > 1 ? "s" : ""} — review` : "structured, context-aware",
        }]
      : []),
    ...(activeDef?.key === "obgyn_antenatal_followup" && patient
      ? [{ id: "antenatal", title: "Antenatal Care Record", hint: "full antenatal module" }]
      : []),
    ...(activeDef && activeDef.photos ? [{ id: "photos", title: "Clinical Photographs", complete: photoUris.length > 0 }] : []),
    ...(isGeneralNote
      ? [
          { id: "history", title: "History", complete: !!(form.history || "").trim() },
          { id: "vitals", title: "Vital Signs", complete: anyVital },
          { id: "exam", title: "Physical Examination", complete: !!(form.physical_examination || "").trim() },
        ]
      : []),
    { id: "diagnosis", title: "Provisional Diagnosis", required: true, complete: diagnosesFilled },
    ...(isGeneralNote ? [{ id: "recommendations", title: "Doctor's Recommendations", complete: !!(form.recommendations || "").trim() }] : []),
  ];

  const renderSectionBody = (id) => {
    switch (id) {
      case "encounter":
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date/Time Patient Was Seen *</Label>
              <Input
                type="datetime-local"
                value={form.encounter_datetime}
                onChange={(e) => setForm({ ...form, encounter_datetime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Location of Visit *</Label>
              <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {["ER", "Clinic", "Ward", "ICU", "Other"].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "noteType":
        return (
          <div className="space-y-2">
            <Label>Note Type — {mySpecialty} (auto-detected)</Label>
            <Select
              value={diagnosisMode && !isDiagnosisDoc ? DIAGNOSIS_KEY : docType}
              onValueChange={handleNoteTypeChange}
            >
              <SelectTrigger><SelectValue placeholder="Select the note type..." /></SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value={GENERAL_KEY}>General Clinical Note</SelectItem>
                {myDocs.map((d) => (
                  <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                ))}
                {diseaseDocs.length > 0 && (
                  <SelectItem value={DIAGNOSIS_KEY}>Disease-Specific Note</SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              AMedix detected your verified specialty and loaded its note types and template — no need to select a specialty.
            </p>
          </div>
        );
      case "dxTemplates":
        return (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              All {diseaseDocs.length} disease-specific templates of {mySpecialtyKey ? mySpecialty : "this specialty"} are listed below — search by disease, or view the full list, and select one to load it.
            </p>
            <DiagnosisNotePicker
              groups={diseaseGroups}
              aliases={diseaseAliases}
              selectedKey={docType}
              onSelect={handleDiagnosisSelect}
            />
            {isDiagnosisDoc && activeDef && (
              <p className="text-xs text-emerald-700">Loaded template: {activeDef.label}</p>
            )}
          </div>
        );
      case "template":
        return (
          <div className="space-y-3">
            {activeDef.workflow && (
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-card border border-border p-2">
                {activeDef.workflow.map((stage, i) => (
                  <span key={stage} className="flex items-center gap-1.5">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                      {stage}
                    </span>
                    {i < activeDef.workflow.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  </span>
                ))}
              </div>
            )}
            {/* Guideline basis stays at the top of the template section so it is
                visible immediately, including in the very long trauma template. */}
            <SurgeryGuidelineBasis documentKey={activeDef.key} />
            <DocumentFields
              defs={activeDef.fields}
              values={dataValues}
              onChange={(k, val) => setDataValues((s) => ({ ...s, [k]: val }))}
              specialty={mySpecialty}
              notice={activeDef.notice || ""}
              patientId={patient?.id || ""}
            />
            <p className="text-xs text-muted-foreground">Complete the sections relevant to this encounter — empty optional sections are simply not saved. Fields marked Required must be answered.</p>
          </div>
        );
      case "antenatal":
        return <DoctorAntenatalSection patient={patient} doctorProfile={doctorProfile} />;
      case "photos":
        return (
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
              Photographs are attached to this note, stored privately, and follow the same permission, access control,
              audit and patient privacy rules as all clinical information.
            </p>
          </div>
        );
      case "history":
        return (
          <div className="space-y-2">
            <Label>History</Label>
            <Textarea
              value={form.history}
              onChange={(e) => setForm({ ...form, history: e.target.value })}
              rows={3}
              placeholder="Presenting complaint and history"
            />
            <MedicalDictationButton
              value={form.history}
              onChange={(v) => setForm({ ...form, history: v })}
              specialty={mySpecialty}
              contextLabel="History — presenting complaint, review of systems and history of present illness"
            />
          </div>
        );
      case "vitals":
        return (
          <div className="space-y-2">
            <Label>Vital Signs</Label>
            <VitalSignsForm value={form.vitals} onChange={(v) => setForm({ ...form, vitals: v })} />
          </div>
        );
      case "exam":
        return (
          <div className="space-y-2">
            <Label>Physical Examination</Label>
            <Textarea
              value={form.physical_examination}
              onChange={(e) => setForm({ ...form, physical_examination: e.target.value })}
              rows={3}
            />
            <MedicalDictationButton
              value={form.physical_examination}
              onChange={(v) => setForm({ ...form, physical_examination: v })}
              specialty={mySpecialty}
              contextLabel="Physical examination findings"
            />
            {patient && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <ExaminationsTab patient={patient} doctorProfile={doctorProfile} />
              </div>
            )}
          </div>
        );
      case "diagnosis":
        return (
          <div className="space-y-2">
            <Label>Provisional Diagnosis *</Label>
            {(form.provisional_diagnoses || [""]).map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={d}
                  onChange={(e) => {
                    const next = [...form.provisional_diagnoses];
                    next[i] = e.target.value;
                    setForm({ ...form, provisional_diagnoses: next });
                  }}
                  placeholder={i === 0 ? "Primary provisional diagnosis" : `Provisional diagnosis ${i + 1}`}
                  required={i === 0}
                />
                <MedicalDictationButton
                  value={d}
                  onChange={(v) => {
                    const next = [...form.provisional_diagnoses];
                    next[i] = v;
                    setForm({ ...form, provisional_diagnoses: next });
                  }}
                  specialty={mySpecialty}
                  contextLabel="Provisional diagnosis"
                />
                {(form.provisional_diagnoses || []).length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setForm({ ...form, provisional_diagnoses: form.provisional_diagnoses.filter((_, idx) => idx !== i) })
                    }
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm({ ...form, provisional_diagnoses: [...(form.provisional_diagnoses || []), ""] })}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Provisional Diagnosis
            </Button>
          </div>
        );
      case "recommendations":
        return (
          <div className="space-y-2">
            <Label className="text-primary">Doctor's Recommendations</Label>
            <Textarea
              value={form.recommendations}
              onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
              rows={3}
              placeholder="Recommendations, follow-up instructions, lifestyle advice, referrals..."
            />
            <MedicalDictationButton
              value={form.recommendations}
              onChange={(v) => setForm({ ...form, recommendations: v })}
              specialty={mySpecialty}
              contextLabel="Doctor's recommendations — follow-up and treatment instructions"
            />
          </div>
        );
      case "srh":
        return <ObgynSrhSection docKey={activeDef.key} values={srhValues} onChange={setSrhValues} />;
      case "obexam":
        return <ObgynExamSection docKey={activeDef.key} values={examValues} onChange={setExamValues} />;
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex justify-between items-center gap-3">
        <h3 className="font-semibold shrink-0">Write Clinical Note</h3>
        <div className="flex items-center gap-3 min-w-0">
          {patient && saveStatus === "saving" && (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving draft…
            </span>
          )}
          {patient && saveStatus === "saved" && (
            <span className="text-xs text-emerald-700 inline-flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Draft saved
            </span>
          )}
          {patient && saveStatus === "error" && (
            <span className="text-xs text-destructive shrink-0">Autosave failed — your entries stay on screen</span>
          )}
          <button type="button" onClick={onCancel} className="text-muted-foreground shrink-0"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {!preselectedPatient ? (
        <div className="space-y-2">
          <Label>Patient CIN *</Label>
          <div className="flex gap-2">
            <Input
              value={form.patient_cin}
              onChange={(e) => setForm({ ...form, patient_cin: e.target.value })}
              placeholder="CIN-XXXXXX"
            />
            <Button type="button" variant="outline" onClick={findPatient} disabled={finding}>
              {finding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Find Patient
            </Button>
          </div>
        </div>
      ) : null}

      {patient && (
        <PatientAlertHeader
          patient={patient}
          doctorProfile={doctorProfile}
          meds={recordContext?.meds || []}
          conditions={recordContext?.conditions || []}
        />
      )}

      {patient && (
        gateLoading ? (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Verifying hospital check-in...
          </div>
        ) : checkedIn ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Patient is checked in at your hospital — clinical functions unlocked.
          </div>
        ) : (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            {LOCKED_MESSAGE}
          </div>
        )
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {patient && (
        <div className="space-y-3">
          <NoteSectionNav
            sections={sections}
            onJump={jumpTo}
            onExpandAll={() => setOpenIds(new Set(sections.map((s) => s.id)))}
            onCollapseAll={() => setOpenIds(new Set())}
          />
          {sections.map((s) => (
            <NoteAccordionSection
              key={s.id}
              id={s.id}
              title={s.title}
              required={s.required}
              complete={s.complete}
              hint={s.hint}
              open={openIds.has(s.id)}
              onToggle={() => toggleSection(s.id)}
            >
              {renderSectionBody(s.id)}
            </NoteAccordionSection>
          ))}
        </div>
      )}

      <Button type="submit" disabled={saving || !checkedIn} title={!checkedIn ? LOCKED_MESSAGE : undefined}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Clinical Note
      </Button>
    </form>
  );
}