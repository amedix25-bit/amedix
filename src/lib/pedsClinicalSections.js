// Pediatrics — the sections appended to each EXISTING note type.
//
// The paediatrics note types declared in src/lib/specialtyDocuments.js keep their
// keys, labels, order and every existing field. Nothing is renamed, removed or
// reordered here: this module only APPENDS fields, so a saved note keeps its
// meaning, its links and its PDF.
//
// WHAT IS APPENDED
//   · The record the cited document requires of the presentation: the newborn and
//     jaundice records, growth plotted on a named reference, developmental
//     surveillance and screening, the immunisation status with its catch-up, the IMCI
//     danger-sign triage, the febrile-infant pathway, the respiratory classification,
//     the dehydration classification and the malnutrition criteria.
//   · The child-specific records the generic templates do not carry: the adolescent
//     psychosocial and confidentiality record, the safeguarding record, the chronic
//     condition and transition review, the procedure and sedation safety record, and
//     the family education record with its return criteria.
//   · WHO ICD-11 MMS coding on every note, with the diagnostic status kept apart:
//     confirmed, suspected, differential, ruled out, historical, and symptom-not-a-
//     diagnosis.
//   · One advisory safety review, calculated from what the note actually recorded.
//   · The guideline basis the note records about itself, so an exported record keeps
//     its evidence base and the documented conflicts between bodies.
//
// Everything is optional. A blank is read as not documented, never as normal.

import {
  pedsCatalogFor,
  PEDS_ICD11_MMS,
  PEDS_ICD_STATUSES,
  PEDS_ICD_ROLES,
  PEDS_ICD_DETAIL_FIELDS,
  PEDS_ICD_CATALOG_NOTE,
  PEDS_ICD_CLUSTER_NOTE,
} from "@/lib/pedsIcd11";
import { PEDS_BLOCKS } from "@/lib/pedsBlocks";

const block = (key, section) => ({ key, label: PEDS_BLOCKS[key].title, type: "peds_modules", section });

const ALL_DOMAINS = ["infectious", "haematology", "endocrine_nutrition", "development_behaviour", "neurology", "respiratory"];

const icdFor = (domains, placeholder, extra = {}) => [
  {
    key: "peds_icd11_diagnoses",
    label: "Diagnoses (ICD-11 MMS)",
    type: "icd11_diagnoses",
    section: "Diagnosis (ICD-11 MMS)",
    catalog: pedsCatalogFor(domains),
    searchPlaceholder: placeholder,
    catalogRelease: PEDS_ICD11_MMS.release,
    catalogNote: PEDS_ICD_CATALOG_NOTE,
    statuses: PEDS_ICD_STATUSES,
    roles: PEDS_ICD_ROLES,
    extraFields: PEDS_ICD_DETAIL_FIELDS,
    clusterEnabled: true,
    clusterNote: PEDS_ICD_CLUSTER_NOTE,
    requireConfirmation: true,
    unspecifiedJustification: true,
    ...extra,
  },
];

const safety = () => [
  {
    key: "peds_safety",
    label: "Advisory Safety Prompts",
    type: "peds_safety",
    section: "Safety review",
    hint: "Calculated from what this note recorded. A prompt never blocks saving and never changes a diagnosis.",
  },
];

const guidance = (noteKey) => [
  {
    key: "peds_guidance",
    label: "Guideline Basis & Reference Register",
    type: "peds_guidance",
    section: "Guideline basis",
    noteKey,
  },
];

const growth = () => [block("peds_growth", "Growth & nutrition")];
const development = () => [block("peds_development", "Development & behaviour")];
const immunisation = () => [block("peds_immunisation", "Immunisation")];
const newborn = () => [block("peds_newborn", "Newborn assessment")];
const jaundice = () => [block("peds_jaundice", "Newborn assessment")];
const triage = () => [block("peds_triage", "Acute assessment")];
const fever = () => [block("peds_fever", "Acute assessment")];
const respiratory = () => [block("peds_respiratory", "Acute assessment")];
const dehydration = () => [block("peds_dehydration", "Acute assessment")];
const malnutrition = () => [block("peds_malnutrition", "Growth & nutrition")];
const chronic = () => [block("peds_chronic", "Chronic care")];
const adolescent = () => [block("peds_adolescent", "Adolescent health")];
const safeguarding = () => [block("peds_safeguarding", "Safeguarding")];
const family = () => [block("peds_family", "Family education")];
const procedure = () => [block("peds_procedure", "Procedure safety")];
const reasoning = () => [block("peds_reasoning", "Clinical reasoning")];

export const PEDS_ENHANCEMENTS = {
  peds_consultation: () => [
    ...triage(),
    ...fever(),
    ...respiratory(),
    ...dehydration(),
    ...growth(),
    ...development(),
    ...immunisation(),
    ...safeguarding(),
    ...reasoning(),
    ...icdFor(ALL_DOMAINS, "Search ICD-11 — the diagnosis this consultation documents…"),
    ...safety(),
    ...guidance("peds_consultation"),
  ],

  peds_followup: () => [
    ...growth(),
    ...development(),
    ...chronic(),
    ...family(),
    ...reasoning(),
    ...icdFor(ALL_DOMAINS, "Search ICD-11 — the diagnosis this review follows…"),
    ...safety(),
    ...guidance("peds_followup"),
  ],

  peds_well_child: () => [
    ...growth(),
    ...development(),
    ...immunisation(),
    ...family(),
    ...reasoning(),
    ...icdFor(["development_behaviour", "endocrine_nutrition", "haematology"], "Search ICD-11 — a finding this well-child visit identified…"),
    ...safety(),
    ...guidance("peds_well_child"),
  ],

  peds_admission_note: () => [
    ...triage(),
    ...fever(),
    ...respiratory(),
    ...dehydration(),
    ...malnutrition(),
    ...growth(),
    ...reasoning(),
    ...icdFor(ALL_DOMAINS, "Search ICD-11 — the admission diagnoses…"),
    ...safety(),
    ...guidance("peds_admission_note"),
  ],

  peds_daily_progress: () => [
    ...triage(),
    ...fever(),
    ...respiratory(),
    ...dehydration(),
    ...chronic(),
    ...reasoning(),
    ...icdFor(ALL_DOMAINS, "Search ICD-11 — the diagnosis being followed on this ward round…"),
    ...safety(),
    ...guidance("peds_daily_progress"),
  ],

  peds_discharge_summary: () => [
    ...chronic(),
    ...immunisation(),
    ...family(),
    ...reasoning(),
    ...icdFor(ALL_DOMAINS, "Search ICD-11 — the discharge diagnoses…"),
    ...safety(),
    ...guidance("peds_discharge_summary"),
  ],

  peds_procedure_note: () => [
    ...procedure(),
    ...family(),
    ...reasoning(),
    ...icdFor(["infectious", "haematology", "neurology", "respiratory"], "Search ICD-11 — the indication for this procedure…"),
    ...safety(),
    ...guidance("peds_procedure_note"),
  ],

  peds_chronic_followup: () => [
    ...growth(),
    ...chronic(),
    ...development(),
    ...family(),
    ...reasoning(),
    ...icdFor(["endocrine_nutrition", "haematology", "neurology", "respiratory", "development_behaviour"], "Search ICD-11 — the chronic condition this review follows…"),
    ...safety(),
    ...guidance("peds_chronic_followup"),
  ],

  peds_growth_development: () => [
    ...growth(),
    ...development(),
    ...malnutrition(),
    ...family(),
    ...reasoning(),
    ...icdFor(["endocrine_nutrition", "development_behaviour", "haematology"], "Search ICD-11 — a growth or developmental diagnosis…"),
    ...safety(),
    ...guidance("peds_growth_development"),
  ],

  peds_immunization_record: () => [
    ...immunisation(),
    ...family(),
    ...reasoning(),
    ...icdFor(["infectious"], "Search ICD-11 — a vaccine-preventable disease this record documents…"),
    ...safety(),
    ...guidance("peds_immunization_record"),
  ],

  peds_screening_record: () => [
    ...development(),
    ...growth(),
    ...family(),
    ...reasoning(),
    ...icdFor(["development_behaviour", "haematology"], "Search ICD-11 — a diagnosis the screening established…"),
    ...safety(),
    ...guidance("peds_screening_record"),
  ],

  peds_anticipatory_guidance: () => [
    ...family(),
    ...development(),
    ...growth(),
    ...reasoning(),
    ...icdFor(["development_behaviour", "endocrine_nutrition"], "Search ICD-11 — only a diagnosis established at this visit…"),
    ...safety(),
    ...guidance("peds_anticipatory_guidance"),
  ],

  peds_newborn_record: () => [
    ...newborn(),
    ...jaundice(),
    ...family(),
    ...reasoning(),
    ...icdFor(["infectious", "haematology", "neurology"], "Search ICD-11 — a condition identified in this newborn…"),
    ...safety(),
    ...guidance("peds_newborn_record"),
  ],

  peds_birth_history: () => [
    ...newborn(),
    ...jaundice(),
    ...reasoning(),
    ...icdFor(["infectious", "neurology"], "Search ICD-11 — a condition arising from the birth history…"),
    ...safety(),
    ...guidance("peds_birth_history"),
  ],

  peds_neonatal_progress: () => [
    ...newborn(),
    ...jaundice(),
    ...triage(),
    ...family(),
    ...reasoning(),
    ...icdFor(["infectious", "neurology", "respiratory"], "Search ICD-11 — the condition being followed in this neonate…"),
    ...safety(),
    ...guidance("peds_neonatal_progress"),
  ],

  peds_newborn_discharge_summary: () => [
    ...newborn(),
    ...jaundice(),
    ...family(),
    ...reasoning(),
    ...icdFor(["infectious", "neurology"], "Search ICD-11 — the neonatal diagnoses at discharge…"),
    ...safety(),
    ...guidance("peds_newborn_discharge_summary"),
  ],

  peds_adolescent_health: () => [
    ...adolescent(),
    ...growth(),
    ...immunisation(),
    ...safeguarding(),
    ...family(),
    ...reasoning(),
    ...icdFor(["development_behaviour", "endocrine_nutrition"], "Search ICD-11 — a diagnosis established at this assessment…"),
    ...safety(),
    ...guidance("peds_adolescent_health"),
  ],

  peds_confidential_adolescent_note: () => [
    ...adolescent(),
    ...safeguarding(),
    ...reasoning(),
    ...icdFor(["development_behaviour", "infectious"], "Search ICD-11 — a diagnosis documented in this confidential note…"),
    ...safety(),
    ...guidance("peds_confidential_adolescent_note"),
  ],
};