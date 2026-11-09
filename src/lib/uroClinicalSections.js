// Urology — the sections appended to each note type.
//
// The nine urology note types already declared in src/lib/specialtyDocuments.js
// keep their keys, labels, order and every existing field. Nothing is renamed,
// removed or reordered here: this module only APPENDS fields, so a saved note keeps
// its meaning, its links and its PDF.
//
// WHAT IS APPENDED
//   · The urological history, structured by onset, duration and previous
//     interventions rather than one free-text paragraph.
//   · The examination recorded element by element as NORMAL / ABNORMAL / NOT
//     PERFORMED / NOT APPLICABLE / NOT DOCUMENTED — an examination that was not
//     performed can never be read back as normal.
//   · WHO ICD-11 MMS coding resolved through the CENTRAL AMedix ICD-11 service,
//     with a urological condition index, clinician confirmation, a justification
//     for an unspecified code and laterality / site detail the code cannot carry.
//   · The documented calculations (IPSS, PSA density, PSA kinetics, prostate
//     volume, eGFR, Charlson, voiding efficiency), computed only from what the
//     note records.
//   · One advisory safety review computed from the documented findings.
//   · The guideline basis the note records about itself, so an exported record
//     keeps its evidence base (EAU primary, with AUA / ESMO / NCCN / KDIGO /
//     ESHRE / ICS / WHO named beside the topic).
//   · For tumour notes, the staging, tumour-board and surveillance record.
//
// Everything is optional. A blank is read as not documented, never as normal.

import {
  URO_ICD11,
  URO_ICD11_MMS,
  URO_ICD_STATUSES,
  URO_ICD_ROLES,
  URO_ICD_DETAIL_FIELDS,
  URO_ICD_CATALOG_NOTE,
  URO_ICD_CLUSTER_NOTE,
  URO_CONDITION_GROUPS,
  URO_CONDITION_COUNT,
} from "@/lib/uroIcd11";
import { URO_BLOCKS } from "@/lib/uroBlocks";
import { uroStagingFields, uroCancer } from "@/lib/uroOncology";

const groupsFor = (keys) =>
  Array.isArray(keys) && keys.length ? URO_CONDITION_GROUPS.filter((g) => keys.includes(g.key)) : URO_CONDITION_GROUPS;

export const uroIcdField = (groupKeys) => {
  const groups = groupsFor(groupKeys);
  const count = groups.reduce((n, g) => n + g.conditions.length, 0);
  return {
    key: "icd11_diagnoses",
    label: "Diagnoses (ICD-11 MMS)",
    type: "icd11_diagnoses",
    section: "Diagnosis (ICD-11 MMS)",
    catalog: URO_ICD11,
    catalogRelease: URO_ICD11_MMS.release,
    catalogNote: URO_ICD11_MMS.verification_note,
    conditionGroups: groups,
    conditionIndexTitle: `Urological condition index (${count} of ${URO_CONDITION_COUNT} portal conditions)`,
    conditionIndexHint:
      "Selecting a condition asks the central AMedix ICD-11 service for the official concept and stores the code, the official term, the release and the retrieval time. A condition the service cannot resolve is recorded without a code and flagged for coding review.",
    searchPlaceholder:
      "Search ICD-11 — stone, hydronephrosis, BPH, retention, haematuria, prostate cancer, torsion, stricture, reflux…",
    statuses: URO_ICD_STATUSES,
    roles: URO_ICD_ROLES,
    extraFields: URO_ICD_DETAIL_FIELDS,
    clusterEnabled: true,
    clusterNote: URO_ICD_CLUSTER_NOTE,
    requireConfirmation: true,
    unspecifiedJustification: true,
  };
};

export const uroBlockField = (blockKeys, section = "Structured documentation") => ({
  key: "uro_modules",
  label: "Structured urology documentation",
  type: "uro_modules",
  section,
  blocks: blockKeys.filter((k) => Boolean(URO_BLOCKS[k])),
});

export const uroExamField = (groupKeys, section = "Clinical examination") => ({
  key: "uro_exam",
  label: "Examination element by element (normal / abnormal / not performed / not applicable)",
  type: "uro_exam",
  section,
  groups: groupKeys,
});

export const uroScoresField = (scoreKeys) => ({
  key: "uro_scores",
  label: "Documented calculations",
  type: "uro_scores",
  section: "Calculations",
  scores: scoreKeys,
});

export const uroSafetyField = () => ({
  key: "uro_safety",
  label: "Advisory safety prompts",
  type: "uro_safety",
  section: "Safety review",
});

export const uroGuidanceField = (noteKey) => ({
  key: "uro_guidance",
  label: "Guideline basis & reference register",
  type: "uro_guidance",
  section: "Guideline basis",
  noteKey,
});

export const uroStagingField = (cancerKey) => ({
  key: "uro_staging",
  label: `Staging, tumour board & surveillance${uroCancer(cancerKey) ? ` — ${uroCancer(cancerKey).label}` : ""}`,
  type: "uro_staging",
  section: "Staging & tumour board",
  cancerKey,
  fields: uroStagingFields(cancerKey),
});

// Compose the standard sections every urology note carries, in a fixed order, so
// no note is missing its coding, its safety review or its evidence basis.
export const uroStandardSections = (noteKey, opts = {}) => {
  const out = [];
  if (opts.blocks && opts.blocks.length) out.push(uroBlockField(opts.blocks, opts.blockSection));
  if (opts.exams && opts.exams.length) out.push(uroExamField(opts.exams));
  if (opts.staging) out.push(uroStagingField(opts.staging));
  out.push(uroIcdField(opts.icdGroups));
  if (opts.scores && opts.scores.length) out.push(uroScoresField(opts.scores));
  out.push(uroSafetyField());
  out.push(uroGuidanceField(noteKey));
  return out;
};

// The nine existing note types, strengthened append-only.
const ALL_EXAMS = ["abdomen_renal", "genital", "prostate", "neurology", "devices"];

export const URO_ENHANCEMENTS = {
  uro_consultation: () =>
    uroStandardSections("uro_consultation", {
      blocks: ["uro_history", "uro_luts"],
      exams: ALL_EXAMS,
      scores: ["ipss", "voiding_efficiency", "prostate_volume", "psa_density", "egfr"],
    }),
  uro_followup: () =>
    uroStandardSections("uro_followup", {
      blocks: ["uro_luts"],
      exams: ["abdomen_renal", "prostate", "devices"],
      scores: ["ipss", "voiding_efficiency", "egfr"],
    }),
  uro_procedure_note: () =>
    uroStandardSections("uro_procedure_note", {
      blocks: ["uro_postop_review"],
      exams: ["devices"],
      scores: ["egfr"],
    }),
  uro_operative_note: () =>
    uroStandardSections("uro_operative_note", {
      blocks: ["uro_postop_review"],
      scores: ["egfr", "charlson"],
    }),
  uro_preop_assessment: () =>
    uroStandardSections("uro_preop_assessment", {
      scores: ["charlson", "egfr"],
    }),
  uro_postop_note: () =>
    uroStandardSections("uro_postop_note", {
      blocks: ["uro_postop_review"],
      exams: ["devices"],
    }),
  uro_catheter_device_record: () =>
    uroStandardSections("uro_catheter_device_record", {
      exams: ["devices"],
      blocks: ["uro_neuro_classification"],
    }),
  uro_discharge_summary: () => uroStandardSections("uro_discharge_summary"),
  uro_referral: () => uroStandardSections("uro_referral"),
};