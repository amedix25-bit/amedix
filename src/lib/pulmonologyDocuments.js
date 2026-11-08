// Pulmonology / Respiratory Medicine — additive strengthening of the EXISTING
// pulmonary note types.
//
// Nothing here creates, renames, replaces or reorders a template. Each existing
// pulmonary note keeps every field it already had, in its existing order; the
// modules below are appended, a key that already exists is never added twice, and
// the note's own key and label are untouched.
//
// What is deliberately NOT added, because AMedix already provides it:
//   · the physical examination — the shared structured "Select Examination"
//     surface for the specialty;
//   · vital signs — the shared Vital Signs field;
//   · medications, allergies and the patient's history — the unified Patient
//     Record attached to every note;
//   · laboratory and imaging result entry — those live in their own tabs, and
//     the note records only what the clinician documented about them.
import { PULM_BLOCKS } from "@/lib/pulmonologyBlocks";
import { PULMONOLOGY_ICD11, PULM_ICD11_MMS, PULM_DIAGNOSIS_STATUSES, PULM_DIAGNOSIS_ROLES, PULM_DIAGNOSIS_CATEGORIES, PULM_POSTCOORDINATION_NOTE, PULM_CODING_DETAIL_FIELDS } from "@/lib/pulmonologyIcd11";

// Which blocks each EXISTING note receives. Keys are the existing AMedix note
// keys from specialtyDocuments.js — no note type is added here.
const BLOCKS_BY_NOTE = {
  pulm_consultation: [
    "pulm_history", "pulm_symptoms", "pulm_inhaler_device", "pulm_exacerbation",
    "pulm_lung_function", "pulm_asthma", "pulm_copd", "pulm_ild", "pulm_bronchiectasis",
    "pulm_sleep", "pulm_pe", "pulm_management",
  ],
  pulm_followup: [
    "pulm_symptoms", "pulm_inhaler_device", "pulm_exacerbation", "pulm_asthma",
    "pulm_copd", "pulm_lung_function", "pulm_management",
  ],
  pulm_admission_note: [
    "pulm_history", "pulm_symptoms", "pulm_oxygen", "pulm_exacerbation", "pulm_pe", "pulm_pleural", "pulm_copd",
  ],
  pulm_progress_note: ["pulm_symptoms", "pulm_oxygen", "pulm_exacerbation", "pulm_pleural"],
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

const blockField = (key) => ({
  key: `pulm_block_${key}`,
  label: PULM_BLOCKS[key].title,
  type: "pulm_modules",
  blockKey: key,
});

const scoresField = (noteKey) => ({
  key: "pulm_scores",
  label: "Documented Respiratory Scores",
  type: "pulm_scores",
  instruments: SCORES_BY_NOTE[noteKey] || [],
});

const safetyField = (noteKey) => ({
  key: "pulm_safety",
  label: "Advisory Documentation Prompts",
  type: "pulm_safety",
  noteKey,
});

const guidanceField = (noteKey) => ({
  key: "pulm_guidance",
  label: "Guideline Basis of This Note",
  type: "pulm_guidance",
  noteKey,
});

const icd11Field = () => ({
  key: "icd11_diagnoses",
  label: "ICD-11 Coded Diagnoses",
  type: "icd11_diagnoses",
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