// Strengthening the EXISTING Dermatology note types.
//
// The nine templates already declared for dermatology — Consultation, Follow-Up,
// Lesion Assessment, Skin Procedure Note, Biopsy Procedure Note, Dermatologic
// Operative Note, Pathology Request, Dermatology Discharge / Follow-Up and Dermatology
// Referral — are NOT recreated, renamed, replaced or reorganised. Their keys, labels,
// order and every existing field stay exactly as they are, so saved notes keep their
// meaning and every view, report and PDF that reads a note by key keeps working.
//
// This module only APPENDS: the shared ICD-11 MMS diagnosis field, structured
// dermatological modules, validated dermatology instruments, the advisory safety
// review and the guideline basis. A key the note already declares is never added
// twice, and nothing already recorded is overwritten.
//
// It also adds the condition modules that had no template of their own — acne, eczema,
// psoriasis, cutaneous infection, skin cancer, hair and nail, pigmentary, paediatric,
// autoimmune and blistering, the other dermatological conditions, the severe cutaneous
// reaction assessment and the biologic review — as new note types in the same
// catalogue.

import {
  DM_ICD_STATUSES, DM_ICD_ROLES, DM_ICD_DETAIL_FIELDS, DM_ICD_CODING_NOTE,
  DM_ICD_CLUSTER_NOTE, DM_ICD_SEARCH_GUIDANCE, DM_ICD11_GROUPS, DM_ICD11_CONDITION_COUNT,
} from "@/lib/dmIcd11";

const T = (key, label) => ({ key, label, type: "textarea" });
const S = (key, label, options) => ({ key, label, type: "select", options });
const I = (key, label) => ({ key, label, type: "input" });

const icd11Field = () => ({
  key: "dm_icd11_diagnoses",
  label: "Diagnoses (ICD-11 MMS)",
  type: "icd11_diagnoses",
  section: "Diagnosis (ICD-11 MMS)",
  catalog: [],
  searchPlaceholder:
    "Search the workspace ICD-11 dataset above — or record the diagnosis with no code and flag it for coding review",
  catalogRelease: "workspace dataset",
  catalogNote: DM_ICD_CODING_NOTE,
  statuses: DM_ICD_STATUSES,
  roles: DM_ICD_ROLES,
  extraFields: DM_ICD_DETAIL_FIELDS,
  clusterEnabled: true,
  clusterNote: DM_ICD_CLUSTER_NOTE,
  conditionGroups: DM_ICD11_GROUPS,
  conditionIndexTitle: `Dermatology condition index (${DM_ICD11_CONDITION_COUNT} search terms across 10 groups — resolved against the workspace ICD-11 dataset)`,
  conditionIndexHint: DM_ICD_SEARCH_GUIDANCE,
  requireConfirmation: true,
  unspecifiedJustification: true,
});

const scoresField = (scores) => ({
  key: "dm_scores",
  label: "Validated instruments",
  type: "dm_scores",
  section: "Validated instruments",
  scores,
});

const safetyField = () => ({
  key: "dm_safety",
  label: "Advisory safety review",
  type: "dm_safety",
  section: "Safety review",
});

const guidanceField = (noteKey) => ({
  key: "dm_guidance",
  label: "Guideline basis",
  type: "dm_guidance",
  section: "Guideline basis",
  noteKey,
});

const blockField = (key, label) => ({ key, label, type: "dm_modules" });

// Skin findings as the platform's structured examination: the specialty's own
// examination catalogue is offered, so the regional findings are recorded the same
// way in every dermatology note.
const skinFindingsField = () => ({ key: "skin_examination", label: "Skin findings by region", type: "textarea" });

// ------------------------------------------------------- enhancements (existing)
const DM_ENHANCEMENTS = {
  derm_consultation: () => [
    blockField("dm_exam", "Skin findings (structured assessment)"),
    icd11Field(),
    scoresField(["bsa", "dlqi"]),
    safetyField(),
    guidanceField("derm_consultation"),
  ],
  derm_followup: () => [
    blockField("dm_followup", "Longitudinal review"),
    icd11Field(),
    scoresField(["bsa", "dlqi"]),
    safetyField(),
    guidanceField("derm_followup"),
  ],
  derm_lesion_assessment: () => [
    blockField("dm_lesion_cancer", "Skin cancer and lesion module"),
    icd11Field(),
    safetyField(),
    guidanceField("derm_lesion_assessment"),
  ],
  derm_skin_procedure_note: () => [icd11Field(), safetyField(), guidanceField("derm_skin_procedure_note")],
  derm_biopsy_note: () => [icd11Field(), safetyField(), guidanceField("derm_biopsy_note")],
  derm_operative_note: () => [icd11Field(), safetyField(), guidanceField("derm_operative_note")],
  derm_pathology_request: () => [icd11Field(), guidanceField("derm_pathology_request")],
  derm_discharge_followup: () => [
    blockField("dm_followup", "Longitudinal review"),
    icd11Field(),
    safetyField(),
    guidanceField("derm_discharge_followup"),
  ],
  derm_referral: () => [icd11Field(), guidanceField("derm_referral")],
};

// Appends the strengthening to each existing template, skipping any key it already
// declares, so re-applying is idempotent and nothing is duplicated.
export const withDermatologyStandards = (docs) =>
  docs.map((doc) => {
    const build = DM_ENHANCEMENTS[doc.key];
    if (!build) return doc;
    const fields = doc.fields || [];
    const existing = new Set(fields.map((f) => f.key));
    const add = build().filter((f) => !existing.has(f.key));
    return add.length ? { ...doc, fields: [...fields, ...add] } : doc;
  });

// ------------------------------------------------------- new condition modules
const conditionDoc = ({ key, label, block, blockLabel, scores = [], photos = false, extra = [] }) => ({
  key,
  label,
  specialty: "dermatology",
  photos,
  fields: [
    blockField(block, blockLabel),
    ...extra,
    icd11Field(),
    ...(scores.length ? [scoresField(scores)] : []),
    safetyField(),
    guidanceField(key),
  ],
});

export const DM_WORKFLOW_DOCS = [
  conditionDoc({
    key: "dm_comprehensive_assessment",
    label: "Comprehensive Dermatological Assessment",
    block: "dm_history",
    blockLabel: "Dermatological history",
    scores: ["bsa", "dlqi"],
    photos: true,
    extra: [
      blockField("dm_exam", "Skin findings (structured assessment)"),
      skinFindingsField(),
      T("assessment", "Clinical assessment"),
      T("differential", "Differential diagnoses documented"),
      T("plan", "Management plan"),
      T("counselling", "Counselling and follow-up"),
    ],
  }),
  conditionDoc({
    key: "dm_acne_review",
    label: "Acne Review",
    block: "dm_acne",
    blockLabel: "Acne module",
    scores: ["dlqi"],
    photos: true,
    extra: [T("assessment", "Assessment and severity documented"), T("plan", "Treatment plan and review interval")],
  }),
  conditionDoc({
    key: "dm_eczema_review",
    label: "Eczema / Dermatitis Review",
    block: "dm_eczema",
    blockLabel: "Eczema and dermatitis module",
    scores: ["easi", "scorad", "dlqi"],
    photos: true,
    extra: [T("assessment", "Assessment"), T("plan", "Treatment plan and review interval")],
  }),
  conditionDoc({
    key: "dm_psoriasis_review",
    label: "Psoriasis Review",
    block: "dm_psoriasis",
    blockLabel: "Psoriasis module",
    scores: ["pasi", "bsa", "dlqi", "iga_psoriasis"],
    photos: true,
    extra: [T("assessment", "Assessment"), T("plan", "Treatment plan and review interval")],
  }),
  conditionDoc({
    key: "dm_infection_review",
    label: "Cutaneous Infection Review",
    block: "dm_infection",
    blockLabel: "Cutaneous infection module",
    photos: true,
    extra: [T("assessment", "Assessment"), T("plan", "Treatment plan and review interval")],
  }),
  conditionDoc({
    key: "dm_skin_cancer_review",
    label: "Skin Cancer / Lesion Clinic Review",
    block: "dm_lesion_cancer",
    blockLabel: "Skin cancer and lesion module",
    photos: true,
    extra: [
      blockField("dm_exam", "Skin findings (structured assessment)"),
      T("assessment", "Assessment"),
      T("plan", "Management plan"),
      T("follow_up", "Follow-up and surveillance plan"),
    ],
  }),
  conditionDoc({
    key: "dm_hair_nail_review",
    label: "Hair and Nail Review",
    block: "dm_hair_nail",
    blockLabel: "Hair, scalp and nail module",
    photos: true,
    extra: [T("assessment", "Assessment"), T("plan", "Treatment plan and review interval")],
  }),
  conditionDoc({
    key: "dm_pigmentary_review",
    label: "Pigmentary Disorder Review",
    block: "dm_pigment",
    blockLabel: "Pigmentary disorder module",
    scores: ["dlqi"],
    photos: true,
    extra: [T("assessment", "Assessment"), T("plan", "Treatment plan and review interval")],
  }),
  conditionDoc({
    key: "dm_pediatric_review",
    label: "Paediatric Dermatology Review",
    block: "dm_pediatric",
    blockLabel: "Paediatric dermatology module",
    scores: ["easi", "scorad"],
    photos: true,
    extra: [T("assessment", "Assessment"), T("plan", "Treatment plan and review interval")],
  }),
  conditionDoc({
    key: "dm_autoimmune_review",
    label: "Autoimmune and Blistering Disease Review",
    block: "dm_autoimmune",
    blockLabel: "Autoimmune and blistering module",
    scores: ["bsa"],
    photos: true,
    extra: [T("assessment", "Assessment"), T("plan", "Treatment plan and monitoring")],
  }),
  conditionDoc({
    key: "dm_other_conditions_review",
    label: "Dermatology Condition Review (Rosacea, Hidradenitis, Urticaria, Lichenoid Disease)",
    block: "dm_other",
    blockLabel: "Other dermatological conditions",
    scores: ["dlqi", "hurley", "uas7"],
    photos: true,
    extra: [T("assessment", "Assessment"), T("plan", "Treatment plan and review interval")],
  }),
  conditionDoc({
    key: "dm_severe_reaction_assessment",
    label: "Severe Cutaneous Reaction Assessment",
    block: "dm_other",
    blockLabel: "Other dermatological conditions",
    scores: ["bsa"],
    extra: [
      T("vital_signs", "Observations documented"),
      T("mucosal_eye", "Mucosal and ocular findings documented"),
      T("fluid_wound", "Fluid, wound and analgesic management documented"),
      T("assessment", "Assessment"),
      T("plan", "Management plan and disposition"),
    ],
  }),
  conditionDoc({
    key: "dm_biologic_review",
    label: "Biologic Therapy Review (Dermatology)",
    block: "dm_psoriasis",
    blockLabel: "Psoriasis module",
    scores: ["pasi", "bsa", "dlqi"],
    extra: [
      S("infection_screen", "Infection screening documented at this visit", ["Reviewed — no features", "Features present — action documented", "Not reviewed"]),
      T("monitoring", "Monitoring results and actions documented"),
      T("response", "Treatment response and adverse effects documented"),
      T("vaccination", "Vaccination review documented"),
      T("plan", "Continuation, interval change or switch — as decided by the clinician"),
    ],
  }),
  {
    key: "dm_phototherapy_review",
    label: "Phototherapy Review",
    specialty: "dermatology",
    photos: true,
    fields: [
      S("modality", "Modality", ["Narrowband UVB", "Broadband UVB", "PUVA — oral", "PUVA — topical", "Excimer", "Other"]),
      I("cumulative_dose", "Cumulative dose documented"),
      I("sessions", "Sessions completed"),
      T("response", "Response documented"),
      T("adverse_effects", "Adverse effects documented"),
      S("eye_protection", "Eye protection and genital shielding documented", ["Yes", "No", "Not documented"]),
      S("photosensitivity_review", "Photosensitivity and drug review documented", ["Reviewed", "Not reviewed"]),
      T("skin_cancer_surveillance", "Skin surveillance during the course"),
      icd11Field(),
      safetyField(),
      guidanceField("dm_phototherapy_review"),
    ],
  },
];