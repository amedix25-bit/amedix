// Neurology — the sections appended to each EXISTING note type.
//
// The eleven neurology note types in src/lib/specialtyDocuments.js keep their keys,
// labels, order and every existing field. Nothing is renamed, removed or reordered
// here: this module only APPENDS fields, so a saved note keeps its meaning, its
// links and its PDF.
//
// WHAT IS APPENDED
//   · The neurological history and interval history, structured by onset, tempo,
//     course and laterality rather than one free-text paragraph.
//   · The examination in the elements a neurologist records separately: awareness,
//     orientation and language; each cranial nerve group; power per limb on the MRC
//     scale with the pattern of weakness; reflexes, plantar responses and sensory
//     distribution; coordination and gait; and meningeal, spinal and cauda-equina
//     warning signs.
//   · The presentation record the cited guideline requires: the hyperacute stroke
//     record, the ILAE seizure and epilepsy classification, the staged status
//     epilepticus pathway, the ICHD-3 headache pattern with the SNNOOP10 flags, the
//     multiple sclerosis course and monitoring record, the neuromuscular record with
//     its respiratory assessment, cognition with its functional consequence, the
//     raised-pressure and CNS-infection records, and the discharge record.
//   · WHO ICD-11 MMS coding on every note, with the diagnostic status separated into
//     confirmed, suspected, differential, symptom and sign, and the detail a code
//     cannot carry recorded beside it.
//   · The guideline-based scores, computed only from documented values.
//   · One advisory safety review, calculated from what the note actually recorded.
//   · The guideline basis the note records about itself, so an exported record keeps
//     its evidence base.
//
// Everything is optional. A blank is read as not documented, never as normal.

import {
  neurologyCatalogFor,
  NEURO_ICD11_MMS,
  NEURO_ICD_STATUSES,
  NEURO_ICD_ROLES,
  NEURO_ICD_DETAIL_FIELDS,
  NEURO_ICD_CATALOG_NOTE,
  NEURO_ICD_CLUSTER_NOTE,
} from "@/lib/neurologyIcd11";
import { NEURO_BLOCKS } from "@/lib/neurologyBlocks";

const block = (key, section) => ({ key, label: NEURO_BLOCKS[key].title, type: "neuro_modules", section });

const ALL_DOMAINS = ["cerebrovascular", "epilepsy", "headache", "demyelinating", "movement", "neuromuscular"];

const icdFor = (domains, placeholder) => [
  {
    key: "neuro_icd11_diagnoses",
    label: "Diagnoses (ICD-11 MMS)",
    type: "icd11_diagnoses",
    section: "Diagnosis (ICD-11 MMS)",
    catalog: neurologyCatalogFor(domains),
    searchPlaceholder: placeholder,
    catalogRelease: NEURO_ICD11_MMS.release,
    catalogNote: NEURO_ICD_CATALOG_NOTE,
    statuses: NEURO_ICD_STATUSES,
    roles: NEURO_ICD_ROLES,
    extraFields: NEURO_ICD_DETAIL_FIELDS,
    clusterEnabled: true,
    clusterNote: NEURO_ICD_CLUSTER_NOTE,
    requireConfirmation: true,
    unspecifiedJustification: true,
  },
];

const scoresFor = (keys) => [
  { key: "neuro_scores", label: "Guideline-Based Scores", type: "neuro_scores", section: "Scores & severity", scores: keys },
];

const safety = () => [
  { key: "neuro_safety", label: "Advisory Safety Prompts", type: "neuro_safety", section: "Safety review" },
];

const guidance = (noteKey) => [
  { key: "neuro_guidance", label: "Guideline Basis & Reference Register", type: "neuro_guidance", section: "Guideline basis", noteKey },
];

export const NEURO_ENHANCEMENTS = {
  neuro_consultation: () => [
    block("neuro_history", "History"),
    block("neuro_mental_status", "Neurological examination"),
    block("neuro_cranial_nerves", "Neurological examination"),
    block("neuro_motor", "Neurological examination"),
    block("neuro_reflexes", "Neurological examination"),
    block("neuro_coordination", "Neurological examination"),
    block("neuro_meningeal", "Neurological examination"),
    block("neuro_cognitive", "Cognition & function"),
    block("neuro_headache", "Presentation-specific record"),
    block("neuro_seizure", "Presentation-specific record"),
    ...icdFor(ALL_DOMAINS, "Search ICD-11 — the diagnosis this consultation documents…"),
    ...scoresFor(["gcs", "mrs"]),
    ...safety(),
    ...guidance("neuro_consultation"),
  ],

  neuro_followup: () => [
    block("neuro_interval", "Interval review"),
    block("neuro_mental_status", "Neurological examination"),
    block("neuro_cranial_nerves", "Neurological examination"),
    block("neuro_motor", "Neurological examination"),
    block("neuro_reflexes", "Neurological examination"),
    block("neuro_coordination", "Neurological examination"),
    block("neuro_headache", "Presentation-specific record"),
    block("neuro_seizure", "Presentation-specific record"),
    block("neuro_ms", "Presentation-specific record"),
    ...icdFor(ALL_DOMAINS, "Search ICD-11 — the diagnosis this review follows…"),
    ...scoresFor(["gcs", "mrs"]),
    ...safety(),
    ...guidance("neuro_followup"),
  ],

  neuro_admission_note: () => [
    block("neuro_history", "History"),
    block("neuro_mental_status", "Neurological examination"),
    block("neuro_cranial_nerves", "Neurological examination"),
    block("neuro_motor", "Neurological examination"),
    block("neuro_reflexes", "Neurological examination"),
    block("neuro_coordination", "Neurological examination"),
    block("neuro_meningeal", "Neurological examination"),
    block("neuro_stroke", "Acute presentation"),
    block("neuro_seizure", "Acute presentation"),
    block("neuro_status", "Acute presentation"),
    block("neuro_icp", "Acute presentation"),
    block("neuro_cns_infection", "Acute presentation"),
    ...icdFor(ALL_DOMAINS, "Search ICD-11 — the diagnoses this admission documents…"),
    ...scoresFor(["nihss", "gcs", "ich_score", "mrs"]),
    ...safety(),
    ...guidance("neuro_admission_note"),
  ],

  neuro_progress_note: () => [
    block("neuro_interval", "Interval review"),
    block("neuro_mental_status", "Neurological examination"),
    block("neuro_cranial_nerves", "Neurological examination"),
    block("neuro_motor", "Neurological examination"),
    block("neuro_reflexes", "Neurological examination"),
    block("neuro_icp", "Monitoring"),
    block("neuro_status", "Monitoring"),
    ...icdFor(ALL_DOMAINS, "Search ICD-11 — the diagnosis being followed on this ward round…"),
    ...scoresFor(["gcs", "mrs"]),
    ...safety(),
    ...guidance("neuro_progress_note"),
  ],

  neuro_discharge_summary: () => [
    block("neuro_discharge", "Status at discharge"),
    ...icdFor(ALL_DOMAINS, "Search ICD-11 — the discharge diagnoses…"),
    ...scoresFor(["mrs", "gcs"]),
    ...safety(),
    ...guidance("neuro_discharge_summary"),
  ],

  neuro_procedure_note: () => [
    block("neuro_procedure", "Procedure"),
    ...icdFor(["cerebrovascular", "epilepsy", "headache"], "Search ICD-11 — the indication for this procedure…"),
    ...safety(),
    ...guidance("neuro_procedure_note"),
  ],

  neuro_eeg_report: () => [
    block("neuro_eeg", "Recording"),
    block("neuro_seizure", "Seizure classification"),
    ...icdFor(["epilepsy"], "Search ICD-11 — the epilepsy or seizure diagnosis this recording addresses…"),
    ...safety(),
    ...guidance("neuro_eeg_report"),
  ],

  neuro_emg_ncs_report: () => [
    block("neuro_emg", "Study"),
    block("neuro_neuromuscular", "Clinical correlation"),
    ...icdFor(["neuromuscular"], "Search ICD-11 — the neuromuscular diagnosis this study addresses…"),
    ...safety(),
    ...guidance("neuro_emg_ncs_report"),
  ],

  neuro_stroke_record: () => [
    block("neuro_stroke", "Hyperacute record"),
    block("neuro_icp", "Monitoring"),
    ...icdFor(["cerebrovascular"], "Search ICD-11 — intracerebral haemorrhage, cerebral ischaemic stroke, TIA…"),
    ...scoresFor(["nihss", "ich_score", "mrs", "cha2ds2_vasc", "has_bled", "abcd2"]),
    ...safety(),
    ...guidance("neuro_stroke_record"),
  ],

  neuro_seizure_followup: () => [
    block("neuro_seizure", "Seizure classification"),
    block("neuro_status", "Status epilepticus history"),
    ...icdFor(["epilepsy"], "Search ICD-11 — the epilepsy or seizure diagnosis…"),
    ...safety(),
    ...guidance("neuro_seizure_followup"),
  ],

  neuro_referral: () => [
    block("neuro_referral_question", "Handover"),
    ...icdFor(ALL_DOMAINS, "Search ICD-11 — the diagnosis being discussed…"),
    ...safety(),
    ...guidance("neuro_referral"),
  ],
};

export const NEURO_ENHANCED_KEYS = Object.keys(NEURO_ENHANCEMENTS);