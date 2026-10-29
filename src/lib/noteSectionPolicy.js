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

// ---- Sections retired from EVERY specialty template -------------------------
// AMedix attaches the patient's recorded history, medications, laboratory and
// imaging results to the note automatically, so the note no longer repeats
// them. Retired everywhere, in every specialty and every diagnosis template:
// the referral & encounter block, past medical / surgical / family history,
// medication and treatment history, laboratory and imaging review, the plan,
// the referrals block and the encounter-context closing block.
const RETIRED_SECTION = [
  /^referrals?\s*(&|and)\s*encounter/i,
  /^referrals?\s*(&|and)\s*history/i,
  /^referrals?\s*(&|and)\s*clinical question/i,
  /^past medical,?\s*surgical/i,
  /^medication\s*(&|and)\s*treatment/i,
  /^medication,\s*safety\s*(&|and)\s*plan/i,
  /^treatment history$/i,
  /^medication review$/i,
  /^laborator/i,
  /^labs?\b/i,
  /^imaging$/i,
  /^investigations?\b/i,
  /^encounter context/i,
  /^plan$/i,
  /^decision\s*(&|and)\s*plan$/i,
  /^plan\s*(&|and)\s*counselling$/i,
  /^referrals?$/i,
];

const isRetiredSection = (section) =>
  !!section && RETIRED_SECTION.some((re) => re.test(section));

// A kept section that also carries another clinical domain: only the retired
// entries inside it go. "Referrals & Patient Education" keeps the education
// record and loses the referral entries; "Assessment & Plan" keeps the
// assessment, diagnosis and safety advice.
const RETIRED_INSIDE_KEPT_SECTION = (field) => {
  const section = field.section || "";
  if (!section) return false;
  if (/^referrals?\b/i.test(section) && (field.type === "rheum_referrals" || /^referral/i.test(field.label || ""))) return true;
  if (/plan$/i.test(section) && /^plan$/i.test((field.label || "").trim())) return true;
  return false;
};

// Field labels retired in every specialty — the flat templates (one long
// field list, no section headings) lose the same content as the sectioned
// ones, so nothing of the retired sections survives in any specialty.
const GLOBAL_RETIRED_FIELD_LABEL = [
  /^past medical history/i,
  /^past surgical history/i,
  /^past medical,?\s*surgical/i,
  /^medical history$/i,
  /^surgical history$/i,
  /^family history/i,
  /^current medications?\b/i,
  /^medication$/i,
  /^medications$/i,
  /^medication review/i,
  /^medications?\s+(review|changes|plan|reconciliation)$/i,
  /^treatment history/i,
  /^previous treatments?$/i,
  /^treatment$/i,
  /laborator/i,
  /^labs?\b/i,
  /^plan\b/i,
  /^referral/i,
];

const isGloballyRetiredField = (field) =>
  GLOBAL_RETIRED_FIELD_LABEL.some((re) => re.test(field.label || ""));

// Field labels that belong to a retired section.
const RETIRED_FIELD_LABEL = [
  /antimicrobial/i,
  /escalat/i, // covers Escalation Criteria and De-Escalation
  /investigation/i,
  /^imaging\b/i, // Imaging Reviewed / Findings / Performed / Guidance …
  /\bimaging$/i, // Pelvic / Chest Imaging, Respiratory Imaging, Staging Imaging …
  /working diagnosis/i,
];

// Note types retired from the catalogue (the Surgical Referral note).
const RETIRED_DOCUMENT_KEYS = ["surg_referral"];

// Referral letters are a document of their own in AMedix (the Referral Letter
// module), never a clinical note type. No specialty offers a referral note in
// its note-type list — the rule is by label and key, so a template added
// later cannot slip back in.
export const isReferralNoteType = (doc) =>
  /(^|_)referral(_|$)/i.test(doc.key || "") || /\breferral\b/i.test(doc.label || "");

// Imaging report note types exist to document imaging itself — their own
// content is left untouched.
const isImagingReport = (doc) => /imaging/i.test(doc.label || "");

// ---- Clinical-note field rules ---------------------------------------------
// Applied to every specialty template, General Surgery included:
// 1. Haemodynamic status is a structured clinical decision — exactly four
//    options, never a free-text value and never preselected.
// 2. Every free-text examination part — whatever its wording ("Examination",
//    "Abdominal Examination", "Cardiovascular Examination Findings",
//    "Neurological Examination" …) — is replaced by one "Select Examination",
//    the searchable structured examination interface for that specialty.
//    AMedix builds the structured examination it offers from the specialty's
//    own examination catalogue, so no examination content is lost when the
//    wording is retired. Fields that merely mention the word but are not the
//    examination section (exposure, an assessment summary, electrophysiology,
//    a lymph-node count) are left untouched, and specialties with no
//    examination catalogue of their own (radiology, dentistry, certificates)
//    keep their existing fields.
// 3. There is one diagnosis tab — "Differential Diagnosis". The separate
//    provisional / working diagnosis field is retired from the templates.
const HAEMODYNAMIC_STATUS_LABEL = /h(a)?emodynamic\s+(status|stability)/i;
const EXAMINATION_WORD = /examination/i;
// Labels that mention the word but document something else entirely.
const KEPT_EXAMINATION_LABEL = [
  /^exposure\b/i, // trauma exposure / log-roll
  /^assessment\b/i, // combined assessment summary
  /^other findings\b/i, // back, perineum, rectal & vaginal findings
  /^needle\b/i, // EMG needle study
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

const isHaemodynamicStatusField = (field) => {
  const label = field.label || "";
  if (!HAEMODYNAMIC_STATUS_LABEL.test(label)) return false;
  // A label that mentions haemodynamic pressures (e.g. a cath-lab report) is a
  // measurement, not the stability status.
  return !/pressure/i.test(label);
};

const isExaminationField = (field) => {
  const label = field.label || "";
  if (!EXAMINATION_WORD.test(label)) return false;
  return !KEPT_EXAMINATION_LABEL.some((re) => re.test(label));
};

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
    if (examinationTypes.length > 0 && isExaminationField(field)) {
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
  return { ...doc, fields: moveReviewOfSystems(fields) };
};

const isRetiredField = (field, specialty) => {
  const label = field.label || "";
  if (isGloballyRetiredField(field)) return true;
  if (specialty === "surgery" && SURGERY_RETIRED_FIELD_LABEL.some((re) => re.test(label))) return true;
  return RETIRED_FIELD_LABEL.some((re) => re.test(label));
};

// A retired section can leave behind a compound heading whose other domain
// survived: "Referrals & Patient Education" is shown as "Patient Education"
// once the referral entries are gone.
const renameKeptSection = (section) =>
  /^referrals?\s*(&|and)\s*patient education$/i.test(section) ? "Patient Education" : section;

// The retirement rules on their own, for the surgeon's record catalog — it is
// not part of the specialty document catalogue but is still clinical
// documentation, so the same sections are retired there.
export const retireNoteFields = (fields) =>
  (fields || [])
    .filter((field) => !isRetiredSection(field.section))
    .filter((field) => !RETIRED_INSIDE_KEPT_SECTION(field))
    .filter((field) => !isGloballyRetiredField(field))
    .map((field) => (field.section ? { ...field, section: renameKeptSection(field.section) } : field));

export const applyNoteSectionPolicy = (docs) =>
  docs
    .filter((doc) => !RETIRED_DOCUMENT_KEYS.includes(doc.key))
    .filter((doc) => !isReferralNoteType(doc))
    .map((doc) => {
      if (isImagingReport(doc) || !Array.isArray(doc.fields)) return doc;
      const fields = doc.fields
        .filter((field) => !isRetiredSection(field.section))
        .filter((field) => !RETIRED_INSIDE_KEPT_SECTION(field))
        .filter((field) => !isRetiredField(field, doc.specialty))
        .map((field) => (field.section ? { ...field, section: renameKeptSection(field.section) } : field));
      return applyClinicalFieldRules({ ...doc, fields });
    });