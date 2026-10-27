// Clinical governance: sections the clinical team has retired from the note
// templates. Applied once, centrally, to every specialty catalogue (medical and
// surgical) so a retired section can never reappear inside a note form, a note
// view or its PDF export — whatever specialty or diagnosis template it was
// authored in. Nothing else about a template changes: keys, ordering, required
// checks and the surrounding note system stay exactly as they were.
//
// Retired sections: Antimicrobial, Escalation Criteria, Surgical Referral Note,
// Investigation, Imaging Request and Finding, Working Diagnosis — together with
// their close variants (e.g. "Antimicrobials — Agent & Time", "Investigations &
// Treatment", "Imaging Findings", "Escalation & Time-Critical Criteria").
// In the General Surgery templates only, these further sections are retired:
// Past Medical History, Past Surgical History, Current Medications, Allergies,
// Social History, and Risks/Benefits & Alternatives.

import {
  examinationTypeKeysFor,
  HEMODYNAMIC_STABILITY_OPTIONS,
} from "@/lib/examinations/clinicalExaminations";

// Sections the surgical team retired from the General Surgery templates only.
// These duplicate what the unified AMedix Patient Record already attaches to
// every note automatically, plus the generic counselling line. Nothing else in
// a surgical template is touched.
const SURGERY_RETIRED_FIELD_LABEL = [
  /^past medical history/i,
  /^past surgical history/i,
  /^current medications/i, // Current Medications (…), Current Medications / Anticoagulants & Allergies
  /^allergies$/i,
  /^social history/i,
  /^risks?,?\s*benefits? and alternatives/i,
  // Retired: the free-text focused surgical examination — the structured
  // "Select Examination" now covers every surgical examination.
  /^focused surgical exam/i,
];

// Field labels that belong to a retired section.
const RETIRED_FIELD_LABEL = [
  /antimicrobial/i,
  /escalat/i, // covers Escalation Criteria and De-Escalation
  /investigation/i,
  /^imaging\b/i, // Imaging Reviewed / Findings / Performed / Guidance …
  /\bimaging$/i, // Pelvic / Chest Imaging, Respiratory Imaging, Staging Imaging …
  /working diagnosis/i,
];

// A label that mentions a retired word but is not that section — it stays.
const KEPT_FIELD_LABEL = [/^current medications/i];

// Note types retired from the catalogue (the Surgical Referral note).
const RETIRED_DOCUMENT_KEYS = ["surg_referral"];

// Imaging report note types exist to document imaging itself — their own
// content is left untouched.
const isImagingReport = (doc) => /imaging/i.test(doc.label || "");

// ---- Clinical-note field rules ---------------------------------------------
// Applied to every specialty template, General Surgery included:
// 1. Haemodynamic status is a structured clinical decision — exactly four
//    options, never a free-text value and never preselected.
// 2. The generic examination field is replaced by "Select Examination", the
//    searchable structured examination interface. Specialty-specific
//    examination fields (ENT, ophthalmology, obstetric, dental …) stay exactly
//    as they are — only the generic "Examination" label is converted.
// 3. There is one diagnosis tab — "Differential Diagnosis". The separate
//    provisional / working diagnosis field is retired from the templates.
const HAEMODYNAMIC_STATUS_LABEL = /h(a)?emodynamic\s+(status|stability)/i;
const GENERIC_EXAMINATION_LABEL = [
  /^examination$/i,
  /^examination findings$/i,
  /^physical examination findings$/i,
  /^current examination$/i,
  /^other examination findings$/i,
];
const PROVISIONAL_DIAGNOSIS_LABEL = /^(provisional|working)\s+diagnos/i;

// 4. Vital Signs is recorded as clickable options — every vital is added only
//    when it was measured. The stored value stays the same readable summary.
const VITAL_SIGNS_LABEL = /^vital signs$/i;

// 5. Review of Systems belongs in the history, immediately after the History of
//    Present Illness, never under Examination.
const REVIEW_OF_SYSTEMS_LABEL = /^review of systems$/i;
const HPI_LABEL = /history of present illness/i;

const moveReviewOfSystems = (fields) => {
  const from = fields.findIndex((f) => REVIEW_OF_SYSTEMS_LABEL.test(f.label || ""));
  if (from === -1) return fields;
  const next = [...fields];
  const [ros] = next.splice(from, 1);
  const hpiIndex = next.findIndex((f) => HPI_LABEL.test(f.label || ""));
  if (hpiIndex === -1) return fields;
  const target = next[hpiIndex];
  next.splice(hpiIndex + 1, 0, { ...ros, section: target.section });
  return next;
};

// 6. In the General Surgery templates the BMI measurement is the last thing
//    recorded before the examination — it sits directly above the Examination
//    section, never buried among the earlier history fields.
const placeBmiAboveExamination = (fields) => {
  const from = fields.findIndex((f) => f.key === "bmi");
  if (from === -1) return fields;
  const next = [...fields];
  const [bmi] = next.splice(from, 1);
  const examIndex = next.findIndex((f) => /^examination$/i.test(f.section || ""));
  if (examIndex === -1) return fields;
  next.splice(examIndex, 0, bmi);
  return next;
};

const isHaemodynamicStatusField = (field) => {
  const label = field.label || "";
  if (!HAEMODYNAMIC_STATUS_LABEL.test(label)) return false;
  // A label that mentions haemodynamic pressures (e.g. a cath-lab report) is a
  // measurement, not the stability status.
  return !/pressure/i.test(label);
};

const isGenericExaminationField = (field) =>
  GENERIC_EXAMINATION_LABEL.some((re) => re.test(field.label || ""));

const applyClinicalFieldRules = (doc) => {
  if (!Array.isArray(doc.fields)) return doc;
  const examinationTypes = examinationTypeKeysFor(doc.specialty);
  const hasExaminationField = doc.fields.some((field) => field.type === "examinations");
  let examinationPlaced = hasExaminationField;
  const fields = [];
  doc.fields.forEach((field) => {
    if (PROVISIONAL_DIAGNOSIS_LABEL.test(field.label || "")) return;
    if (isHaemodynamicStatusField(field)) {
      fields.push({ ...field, type: "select", options: [...HEMODYNAMIC_STABILITY_OPTIONS] });
      return;
    }
    if (VITAL_SIGNS_LABEL.test(field.label || "")) {
      fields.push(field.type === "vitals" ? field : { ...field, type: "vitals" });
      return;
    }
    if (examinationTypes.length > 0 && isGenericExaminationField(field)) {
      if (!examinationPlaced) {
        fields.push({
          key: "examinations",
          label: "Select Examination",
          type: "examinations",
          examinationTypes,
          section: field.section,
        });
        examinationPlaced = true;
      }
      return;
    }
    fields.push(field);
  });
  const ordered = moveReviewOfSystems(fields);
  return {
    ...doc,
    fields: doc.specialty === "surgery" ? placeBmiAboveExamination(ordered) : ordered,
  };
};

const isRetiredField = (field, specialty) => {
  const label = field.label || "";
  if (specialty === "surgery" && SURGERY_RETIRED_FIELD_LABEL.some((re) => re.test(label))) return true;
  if (KEPT_FIELD_LABEL.some((re) => re.test(label))) return false;
  return RETIRED_FIELD_LABEL.some((re) => re.test(label));
};

export const applyNoteSectionPolicy = (docs) =>
  docs
    .filter((doc) => !RETIRED_DOCUMENT_KEYS.includes(doc.key))
    .map((doc) => {
      if (isImagingReport(doc) || !Array.isArray(doc.fields)) return doc;
      const kept = { ...doc, fields: doc.fields.filter((field) => !isRetiredField(field, doc.specialty)) };
      return applyClinicalFieldRules(kept);
    });