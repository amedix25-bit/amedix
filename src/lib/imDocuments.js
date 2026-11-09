// Strengthening the EXISTING Internal Medicine note types.
//
// The thirteen templates already declared for internal medicine — Consultation,
// New Patient Assessment, Follow-Up, Chronic Disease Follow-Up, Admission Note,
// Daily Medical Progress, Problem-Oriented Progress, Consultation Request,
// Consultation Response, Medication Reconciliation, Discharge Summary, Medical
// Follow-Up and Chronic Disease Care Plan — are NOT recreated, renamed, replaced or
// reorganised. Their keys, labels, order and every existing field stay exactly as
// they are, so saved notes keep their meaning and every view, report and PDF that
// reads a note by key keeps working.
//
// This module only APPENDS: the shared ICD-11 MMS diagnosis field, validated
// internal-medicine instruments, the advisory safety review and the guideline basis.
// A key the note already declares is never added twice, and nothing already
// recorded is overwritten.
//
// It also adds the internal-medicine discipline templates that had no template of
// their own — a comprehensive assessment and one review per medical discipline, plus
// the acute presentations internal medicine is asked to assess — as new note types
// in the same catalogue.

import {
  IM_ICD_STATUSES, IM_ICD_ROLES, IM_ICD_DETAIL_FIELDS, IM_ICD_CODING_NOTE,
  IM_ICD_CLUSTER_NOTE, IM_ICD_SEARCH_GUIDANCE, IM_ICD11_GROUPS, IM_ICD11_CONDITION_COUNT,
} from "@/lib/imIcd11";

const T = (key, label) => ({ key, label, type: "textarea" });
const S = (key, label, options) => ({ key, label, type: "select", options });
const I = (key, label) => ({ key, label, type: "input" });

const icd11Field = () => ({
  key: "im_icd11_diagnoses",
  label: "Diagnoses (ICD-11 MMS)",
  type: "icd11_diagnoses",
  section: "Diagnosis (ICD-11 MMS)",
  catalog: [],
  searchPlaceholder:
    "Search the workspace ICD-11 dataset above — or record the diagnosis with no code and flag it for coding review",
  catalogRelease: "workspace dataset",
  catalogNote: IM_ICD_CODING_NOTE,
  statuses: IM_ICD_STATUSES,
  roles: IM_ICD_ROLES,
  extraFields: IM_ICD_DETAIL_FIELDS,
  clusterEnabled: true,
  clusterNote: IM_ICD_CLUSTER_NOTE,
  conditionGroups: IM_ICD11_GROUPS,
  conditionIndexTitle: `Internal medicine condition index (${IM_ICD11_CONDITION_COUNT} search terms across 12 disciplines — resolved against the workspace ICD-11 dataset)`,
  conditionIndexHint: IM_ICD_SEARCH_GUIDANCE,
  requireConfirmation: true,
  unspecifiedJustification: true,
});

const scoresField = (scores) => ({
  key: "im_scores",
  label: "Validated instruments",
  type: "im_scores",
  section: "Validated instruments",
  scores,
});

const safetyField = () => ({
  key: "im_safety",
  label: "Advisory safety review",
  type: "im_safety",
  section: "Safety review",
});

const guidanceField = (noteKey) => ({
  key: "im_guidance",
  label: "Guideline basis",
  type: "im_guidance",
  section: "Guideline basis",
  noteKey,
});

const blockField = (key, label) => ({ key, label, type: "im_modules" });

// Vital Signs as the platform's structured field: every vital is added only when it
// was measured, and the stored value stays the readable summary the note view and the
// PDF already render. The safety review reads only these documented values.
const vitalsField = () => ({ key: "vitals", label: "Vital Signs", type: "vitals" });

// Systemic examination is declared as the examination section of the note; the
// platform's governance replaces it with the structured "Select Examination"
// interface built from the specialty's own examination catalogue, so no free-text
// examination is stored.
const examinationField = () => ({ key: "systemic_examination", label: "Systemic examination", type: "textarea" });

// ------------------------------------------------------- enhancements (existing)
const IM_ENHANCEMENTS = {
  im_consultation: () => [icd11Field(), scoresField(["egfr", "bmi"]), safetyField(), guidanceField("im_consultation")],
  im_new_patient_assessment: () => [
    icd11Field(),
    scoresField(["egfr", "bmi", "kdigo_ckd"]),
    safetyField(),
    guidanceField("im_new_patient_assessment"),
  ],
  im_followup: () => [icd11Field(), scoresField(["egfr"]), safetyField(), guidanceField("im_followup")],
  im_chronic_followup: () => [
    blockField("im_chronic", "Chronic disease management"),
    icd11Field(),
    scoresField(["egfr", "hba1c", "kdigo_ckd", "cha2ds2_vasc", "has_bled"]),
    safetyField(),
    guidanceField("im_chronic_followup"),
  ],
  im_admission_note: () => [
    blockField("im_acute", "Acute assessment"),
    vitalsField(),
    icd11Field(),
    scoresField(["qsofa", "sofa", "curb65", "aki_stage", "egfr"]),
    safetyField(),
    guidanceField("im_admission_note"),
  ],
  im_daily_progress: () => [
    vitalsField(),
    icd11Field(),
    scoresField(["qsofa", "sofa", "aki_stage"]),
    safetyField(),
    guidanceField("im_daily_progress"),
  ],
  im_problem_oriented_progress: () => [
    icd11Field(),
    scoresField(["egfr", "aki_stage"]),
    safetyField(),
    guidanceField("im_problem_oriented_progress"),
  ],
  im_consultation_request: () => [guidanceField("im_consultation_request")],
  im_consultation_response: () => [icd11Field(), guidanceField("im_consultation_response")],
  im_medication_reconciliation: () => [safetyField(), guidanceField("im_medication_reconciliation")],
  im_discharge_summary: () => [
    blockField("im_discharge", "Transition of care"),
    icd11Field(),
    scoresField(["egfr", "kdigo_ckd"]),
    safetyField(),
    guidanceField("im_discharge_summary"),
  ],
  im_medical_followup: () => [icd11Field(), scoresField(["egfr"]), safetyField(), guidanceField("im_medical_followup")],
  im_chronic_care_plan: () => [
    blockField("im_chronic", "Chronic disease management"),
    icd11Field(),
    scoresField(["egfr", "kdigo_ckd", "hba1c", "cha2ds2_vasc", "has_bled"]),
    safetyField(),
    guidanceField("im_chronic_care_plan"),
  ],
};

// A key is appended only when the note does not already declare it.
export const withInternalMedicineStandards = (docs) =>
  docs.map((doc) => {
    const build = IM_ENHANCEMENTS[doc.key];
    if (!build) return doc;
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = build().filter((f) => {
      if (existing.has(f.key)) return false;
      existing.add(f.key);
      return true;
    });
    if (!additions.length) return doc;
    // ICD-11 goes immediately after the narrative fields, before the instruments.
    return { ...doc, fields: [...(doc.fields || []), ...additions] };
  });

// ---------------------------------------------------------------- New templates
export const IM_WORKFLOW_DOCS = [
  {
    key: "im_comprehensive_assessment",
    label: "Comprehensive Internal Medicine Assessment",
    specialty: "internal_medicine",
    fields: [
      blockField("im_history", "Comprehensive history"),
      blockField("im_ros", "Review of systems"),
      examinationField(),
      vitalsField(),
      icd11Field(),
      scoresField(["egfr", "bmi", "qsofa"]),
      safetyField(),
      guidanceField("im_comprehensive_assessment"),
    ],
  },
  {
    key: "im_cardiology_review",
    label: "Cardiology Review (Internal Medicine)",
    specialty: "internal_medicine",
    fields: [
      T("reason_for_review", "Reason for the review"),
      T("cardiac_symptoms", "Cardiac symptoms and functional class as documented"),
      vitalsField(),
      icd11Field(),
      scoresField(["cha2ds2_vasc", "has_bled", "egfr"]),
      safetyField(),
      guidanceField("im_cardiology_review"),
    ],
  },
  {
    key: "im_respiratory_review",
    label: "Respiratory Review (Internal Medicine)",
    specialty: "internal_medicine",
    fields: [
      T("reason_for_review", "Reason for the review"),
      T("respiratory_symptoms", "Respiratory symptoms and inhaler technique observed"),
      vitalsField(),
      icd11Field(),
      scoresField(["curb65", "cat", "mmrc", "asthma_control"]),
      safetyField(),
      guidanceField("im_respiratory_review"),
    ],
  },
  {
    key: "im_gastro_review",
    label: "Gastroenterology / Hepatology Review",
    specialty: "internal_medicine",
    fields: [
      T("reason_for_review", "Reason for the review"),
      T("gi_symptoms", "Gastrointestinal symptoms, bowel habit and bleeding"),
      vitalsField(),
      icd11Field(),
      scoresField(["child_pugh", "meld_na", "glasgow_blatchford"]),
      safetyField(),
      guidanceField("im_gastro_review"),
    ],
  },
  {
    key: "im_nephrology_review",
    label: "Nephrology Review (Internal Medicine)",
    specialty: "internal_medicine",
    fields: [
      T("reason_for_review", "Reason for the review"),
      T("renal_history", "Renal history, fluid balance and urine output"),
      vitalsField(),
      icd11Field(),
      scoresField(["egfr", "kdigo_ckd", "aki_stage"]),
      safetyField(),
      guidanceField("im_nephrology_review"),
    ],
  },
  {
    key: "im_diabetes_review",
    label: "Diabetes and Endocrine Review",
    specialty: "internal_medicine",
    fields: [
      T("reason_for_review", "Reason for the review"),
      T("glycaemic_history", "Glycaemic history, hypoglycaemia and monitoring"),
      T("complication_review", "Complication screening documented"),
      vitalsField(),
      icd11Field(),
      scoresField(["hba1c", "egfr", "kdigo_ckd", "bmi"]),
      safetyField(),
      guidanceField("im_diabetes_review"),
    ],
  },
  {
    key: "im_hematology_review",
    label: "Hematology Review (Internal Medicine)",
    specialty: "internal_medicine",
    fields: [
      T("reason_for_review", "Reason for the review"),
      T("haematology_history", "Bleeding, bruising, transfusion history and family history"),
      vitalsField(),
      icd11Field(),
      scoresField(["egfr"]),
      safetyField(),
      guidanceField("im_hematology_review"),
    ],
  },
  {
    key: "im_infectious_disease_review",
    label: "Infectious Disease Review",
    specialty: "internal_medicine",
    fields: [
      T("reason_for_review", "Reason for the review"),
      T("infection_history", "Infection history, exposures, travel and prior antimicrobials"),
      blockField("im_acute", "Acute assessment"),
      vitalsField(),
      icd11Field(),
      scoresField(["qsofa", "sofa", "egfr"]),
      safetyField(),
      guidanceField("im_infectious_disease_review"),
    ],
  },
  {
    key: "im_rheumatology_review",
    label: "Rheumatology Review (Internal Medicine)",
    specialty: "internal_medicine",
    fields: [
      T("reason_for_review", "Reason for the review"),
      T("joint_history", "Joint history, morning stiffness and systemic features"),
      vitalsField(),
      icd11Field(),
      scoresField(["egfr"]),
      safetyField(),
      guidanceField("im_rheumatology_review"),
    ],
  },
  {
    key: "im_neurology_review",
    label: "Neurology Review (Internal Medicine)",
    specialty: "internal_medicine",
    fields: [
      T("reason_for_review", "Reason for the review"),
      T("neuro_history", "Neurological history and time course"),
      examinationField(),
      vitalsField(),
      icd11Field(),
      scoresField(["egfr"]),
      safetyField(),
      guidanceField("im_neurology_review"),
    ],
  },
  {
    key: "im_oncology_review",
    label: "Oncology Review (Internal Medicine)",
    specialty: "internal_medicine",
    fields: [
      T("reason_for_review", "Reason for the review"),
      blockField("im_oncology", "Oncology assessment"),
      vitalsField(),
      icd11Field(),
      scoresField(["egfr"]),
      safetyField(),
      guidanceField("im_oncology_review"),
    ],
  },
  {
    key: "im_geriatric_review",
    label: "Geriatric Medicine Review",
    specialty: "internal_medicine",
    fields: [
      T("reason_for_review", "Reason for the review"),
      blockField("im_geriatric", "Geriatric assessment"),
      vitalsField(),
      icd11Field(),
      scoresField(["egfr", "bmi"]),
      safetyField(),
      guidanceField("im_geriatric_review"),
    ],
  },
  {
    key: "im_sepsis_assessment",
    label: "Sepsis Assessment",
    specialty: "internal_medicine",
    fields: [
      T("presenting_problem", "Presenting problem and time of onset"),
      blockField("im_acute", "Acute assessment"),
      vitalsField(),
      icd11Field(),
      scoresField(["qsofa", "sofa", "aki_stage", "egfr"]),
      safetyField(),
      guidanceField("im_sepsis_assessment"),
    ],
  },
  {
    key: "im_venous_thromboembolism",
    label: "Suspected Venous Thromboembolism",
    specialty: "internal_medicine",
    fields: [
      T("presenting_problem", "Presenting problem and risk factors"),
      vitalsField(),
      icd11Field(),
      scoresField(["wells_pe", "wells_dvt", "egfr"]),
      safetyField(),
      guidanceField("im_venous_thromboembolism"),
    ],
  },
  {
    key: "im_anticoagulation_review",
    label: "Anticoagulation Review",
    specialty: "internal_medicine",
    fields: [
      T("indication", "Indication for anticoagulation, as documented"),
      T("bleeding_history", "Bleeding history and current bleeding-risk factors"),
      vitalsField(),
      icd11Field(),
      scoresField(["cha2ds2_vasc", "has_bled", "egfr"]),
      safetyField(),
      guidanceField("im_anticoagulation_review"),
    ],
  },
  {
    key: "im_electrolyte_disorder",
    label: "Electrolyte and Metabolic Disorder",
    specialty: "internal_medicine",
    fields: [
      T("presenting_problem", "Presenting problem, fluid balance and access"),
      vitalsField(),
      icd11Field(),
      scoresField(["aki_stage", "egfr", "kdigo_ckd"]),
      safetyField(),
      guidanceField("im_electrolyte_disorder"),
    ],
  },
];