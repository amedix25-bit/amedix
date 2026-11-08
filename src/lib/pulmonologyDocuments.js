// Pulmonology / Respiratory Medicine — additive strengthening of the EXISTING
// pulmonary note types.
//
// Nothing here creates, renames, replaces or reorders a template. Each existing
// pulmonary note keeps every field it already had, in its existing order; the
// modules below are appended, a key that already exists is never added twice, and
// the note's own key and label are untouched.
//
// The respiratory consultation carries its own structured presentation, cough and
// sputum assessment, dyspnoea assessment (mMRC and Borg), exposure and pack-year
// documentation, previous illness and ventilation history, medication/allergy and
// comorbidity review, a respiratory examination documented for each lung field
// separately, and vital signs with the oxygen device, flow rate and FiO2.
//
// What is deliberately NOT duplicated, because AMedix already provides it:
//   · the shared structured "Select Examination" surface stays available — the
//     respiratory exam block records the clinician's chest findings in the note;
//   · the unified Patient Record (allergies, medication list, past history) — the
//     note records the respiratory reading of it, never a second copy;
//   · ordering, performing and resulting laboratory and imaging work — that stays
//     in those workflows, and the note records the indication, result, unit,
//     interpretation, date, attachment and the request reference.
import { PULM_BLOCKS } from "@/lib/pulmonologyBlocks";
import { RESPIRATORY_CONDITION_GROUPS, RESPIRATORY_CONDITION_COUNT } from "@/lib/pulmonologyConditions";
import { PULMONOLOGY_ICD11, PULM_ICD11_MMS, PULM_DIAGNOSIS_STATUSES, PULM_DIAGNOSIS_ROLES, PULM_DIAGNOSIS_CATEGORIES, PULM_POSTCOORDINATION_NOTE, PULM_CODING_DETAIL_FIELDS } from "@/lib/pulmonologyIcd11";

// Which blocks each EXISTING note receives. Keys are the existing AMedix note
// keys from specialtyDocuments.js — no note type is added here.
const BLOCKS_BY_NOTE = {
  pulm_consultation: [
    "pulm_presenting", "pulm_cough_sputum", "pulm_dyspnoea", "pulm_history",
    "pulm_past_respiratory", "pulm_meds_allergies", "pulm_symptoms", "pulm_exam",
    "pulm_vitals", "pulm_inhaler_device", "pulm_exacerbation",
    "pulm_lung_function", "pulm_asthma", "pulm_copd", "pulm_ild", "pulm_bronchiectasis",
    "pulm_sleep", "pulm_pe", "pulm_management",
  ],
  pulm_followup: [
    "pulm_dyspnoea", "pulm_symptoms", "pulm_exam", "pulm_inhaler_device", "pulm_exacerbation", "pulm_asthma",
    "pulm_copd", "pulm_lung_function", "pulm_management",
  ],
  pulm_admission_note: [
    "pulm_presenting", "pulm_cough_sputum", "pulm_dyspnoea", "pulm_history",
    "pulm_past_respiratory", "pulm_symptoms", "pulm_vitals", "pulm_exam",
    "pulm_oxygen", "pulm_exacerbation", "pulm_pe", "pulm_pleural", "pulm_copd",
  ],
  pulm_progress_note: ["pulm_symptoms", "pulm_vitals", "pulm_exam", "pulm_oxygen", "pulm_exacerbation", "pulm_pleural"],
  pulm_discharge_summary: ["pulm_oxygen", "pulm_exacerbation", "pulm_management"],
  pulm_procedure_note: ["pulm_pleural", "pulm_oxygen"],
  pulm_pft_report: ["pulm_lung_function"],
  pulm_bronchoscopy_report: ["pulm_bronchiectasis", "pulm_tb", "pulm_oxygen"],
  pulm_care_plan: [
    "pulm_asthma", "pulm_copd", "pulm_ild", "pulm_bronchiectasis", "pulm_sleep", "pulm_oxygen", "pulm_management",
  ],
};

// Notes that record a coded diagnosis. A test report and a procedure note code
// the indication, so they carry the same ICD-11 field.
const ICD11_NOTES = new Set([
  "pulm_consultation", "pulm_followup", "pulm_admission_note", "pulm_progress_note",
  "pulm_discharge_summary", "pulm_procedure_note", "pulm_pft_report",
  "pulm_bronchoscopy_report", "pulm_care_plan",
]);

// The instruments offered on each note — only those the note can document.
const SCORES_BY_NOTE = {
  pulm_consultation: ["act", "cat", "mmrc", "curb65", "wells_pe", "perc", "stopbang"],
  pulm_followup: ["act", "cat", "mmrc", "stopbang"],
  pulm_admission_note: ["curb65", "wells_pe", "perc", "mmrc"],
  pulm_progress_note: ["curb65", "mmrc"],
  pulm_care_plan: ["act", "cat", "mmrc", "stopbang"],
};

// The added modules sit together in one section of the note, so the existing
// fields stay exactly where they were and the respiratory strengthening reads as
// its own collapsible part of the form.
const SECTION = "Respiratory Assessment & Coding";

const blockField = (key) => ({
  key: `pulm_block_${key}`,
  label: PULM_BLOCKS[key].title,
  type: "pulm_modules",
  blockKey: key,
  section: SECTION,
});

const scoresField = (noteKey) => ({
  key: "pulm_scores",
  label: "Documented Respiratory Scores",
  type: "pulm_scores",
  instruments: SCORES_BY_NOTE[noteKey] || [],
  section: SECTION,
});

const safetyField = (noteKey) => ({
  key: "pulm_safety",
  label: "Advisory Documentation Prompts",
  type: "pulm_safety",
  noteKey,
  section: SECTION,
});

const guidanceField = (noteKey) => ({
  key: "pulm_guidance",
  label: "Guideline Basis of This Note",
  type: "pulm_guidance",
  noteKey,
  section: SECTION,
});

// Structured investigations — the same six captures for every test, plus the
// AMedix request the result arrived through.
const investigationsField = () => ({
  key: "pulm_investigations",
  label: "Structured Investigations",
  type: "pulm_investigations",
  section: SECTION,
});

// Notes that document investigations in the encounter itself.
const INVESTIGATION_NOTES = new Set([
  "pulm_consultation", "pulm_admission_note", "pulm_progress_note", "pulm_followup",
]);

const icd11Field = () => ({
  key: "icd11_diagnoses",
  label: "ICD-11 Coded Diagnoses",
  type: "icd11_diagnoses",
  // The condition index is a shortcut into the official WHO service: the concept
  // is retrieved at selection time and no code is held in the app.
  conditionGroups: RESPIRATORY_CONDITION_GROUPS,
  conditionIndexTitle: `Respiratory condition index (${RESPIRATORY_CONDITION_COUNT} conditions — retrieves the official ICD-11 concept)`,
  conditionIndexHint:
    "Select the condition: AMedix asks the WHO ICD-11 service for the official concept and stores the code, the official term, the release and the retrieval time. A condition the service cannot resolve is recorded without a code and flagged for coding review.",
  catalog: PULMONOLOGY_ICD11,
  catalogRelease: PULM_ICD11_MMS.release,
  catalogNote: PULM_ICD11_MMS.verification_note,
  searchPlaceholder: "Search ICD-11 — asthma, COPD, bronchiectasis, ILD, pneumonia, PE, sleep apnoea, tuberculosis...",
  statuses: PULM_DIAGNOSIS_STATUSES,
  roles: PULM_DIAGNOSIS_ROLES,
  showCategory: true,
  categories: PULM_DIAGNOSIS_CATEGORIES,
  clusterEnabled: true,
  clusterNote: PULM_POSTCOORDINATION_NOTE,
  requireConfirmation: true,
  unspecifiedJustification: true,
  extraFields: PULM_CODING_DETAIL_FIELDS,
  section: SECTION,
});

// Strengthening appended to each existing pulmonary note.
export const withPulmonologyStandards = (docs) =>
  docs.map((doc) => {
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = [];

    (BLOCKS_BY_NOTE[doc.key] || []).forEach((key) => {
      if (!PULM_BLOCKS[key]) return;
      const field = blockField(key);
      if (existing.has(field.key)) return;
      existing.add(field.key);
      additions.push(field);
    });

    if ((SCORES_BY_NOTE[doc.key] || []).length && !existing.has("pulm_scores")) {
      existing.add("pulm_scores");
      additions.push(scoresField(doc.key));
    }

    if (INVESTIGATION_NOTES.has(doc.key) && !existing.has("pulm_investigations")) {
      existing.add("pulm_investigations");
      additions.push(investigationsField());
    }

    if (ICD11_NOTES.has(doc.key) && !existing.has("icd11_diagnoses")) {
      existing.add("icd11_diagnoses");
      additions.push(icd11Field());
    }

    // Every pulmonary note is a clinical assessment, so every one of them carries
    // the advisory prompts and the guideline basis it cites.
    if (!existing.has("pulm_safety")) {
      existing.add("pulm_safety");
      additions.push(safetyField(doc.key));
    }

    if (!existing.has("pulm_guidance")) {
      existing.add("pulm_guidance");
      additions.push(guidanceField(doc.key));
    }

    return { ...doc, fields: [...(doc.fields || []), ...additions] };
  });

export const PULMONOLOGY_NOTE_KEYS = Object.keys(BLOCKS_BY_NOTE);

export const pulmBlocksForNote = (noteKey) => (BLOCKS_BY_NOTE[noteKey] || []).filter((k) => PULM_BLOCKS[k]);