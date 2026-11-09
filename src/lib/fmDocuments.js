// Strengthening the EXISTING Family Medicine note types.
//
// The nine templates already declared for family medicine — General Consultation,
// Preventive Health Visit, Chronic Disease Follow-Up, Acute Illness Visit, Family
// Medicine Follow-Up, Referral, Procedure Note, Medication Review and Health
// Maintenance Record — are NOT recreated, renamed, replaced or reorganised. Their
// keys, labels, order and every existing field stay exactly as they are, so saved
// notes keep their meaning and every view, report and PDF that reads a note by key
// keeps working.
//
// This module only APPENDS: the ICD-11 MMS diagnosis field, the structured blocks,
// the assessment instruments, the advisory safety review, the preventive-screening
// prompts and the guideline basis. A key the note already declares is never added
// twice, and nothing already recorded is overwritten.
//
// It also adds the family-medicine workflows that had no template of their own —
// child health, geriatric assessment, women's health, maternal primary care,
// vaccination, mental health, lifestyle counselling and the annual chronic-disease
// review — as new note types in the same catalogue.

const T = (key, label) => ({ key, label, type: "textarea" });
const S = (key, label, options) => ({ key, label, type: "select", options });
const I = (key, label) => ({ key, label, type: "input" });
const N = (key, label, unit) => ({ key, label, type: "number", ...(unit ? { unit } : {}) });

import {
  FM_ICD_STATUSES, FM_ICD_ROLES, FM_ICD_DETAIL_FIELDS, FM_ICD_CODING_NOTE,
  FM_ICD_CLUSTER_NOTE, FM_ICD_SEARCH_GUIDANCE, FM_ICD11_GROUPS, FM_ICD11_CONDITION_COUNT,
} from "@/lib/fmIcd11";

const icd11Field = () => ({
  key: "fm_icd11_diagnoses",
  label: "Diagnoses (ICD-11 MMS)",
  type: "icd11_diagnoses",
  section: "Diagnosis (ICD-11 MMS)",
  catalog: [],
  searchPlaceholder: "Search the workspace ICD-11 dataset above — or record the diagnosis with no code and flag it for coding review",
  catalogRelease: "workspace dataset",
  catalogNote: FM_ICD_CODING_NOTE,
  statuses: FM_ICD_STATUSES,
  roles: FM_ICD_ROLES,
  extraFields: FM_ICD_DETAIL_FIELDS,
  clusterEnabled: true,
  clusterNote: FM_ICD_CLUSTER_NOTE,
  conditionGroups: FM_ICD11_GROUPS,
  conditionIndexTitle: `Primary-care condition index (${FM_ICD11_CONDITION_COUNT} conditions — resolved against the workspace ICD-11 dataset)`,
  conditionIndexHint: FM_ICD_SEARCH_GUIDANCE,
  requireConfirmation: true,
  unspecifiedJustification: true,
});

const scoresField = (scores) => ({
  key: "fm_scores",
  label: "Assessment instruments",
  type: "fm_scores",
  section: "Assessment instruments",
  scores,
});

const safetyField = () => ({
  key: "fm_safety",
  label: "Clinical safety review",
  type: "fm_safety",
  section: "Clinical safety and escalation",
});

const screeningField = () => ({
  key: "fm_screening",
  label: "Preventive screening and immunizations",
  type: "fm_screening",
  section: "Prevention",
});

const guidanceField = (noteKey) => ({
  key: "fm_guidance",
  label: "Guideline basis",
  type: "fm_guidance",
  section: "Guideline basis",
  noteKey,
});

const blockField = (key, label, section) => ({ key, label: `${label} — structured findings`, type: "fm_modules", section });

// What each existing note gains, appended in this order.
const FM_ENHANCEMENTS = {
  fm_general_consultation: () => [
    blockField("fm_core", "Core consultation", "Structured consultation"),
    icd11Field(),
    scoresField(["bmi", "cvd_risk"]),
    screeningField(),
    safetyField(),
    guidanceField("fm_general_consultation"),
  ],
  fm_preventive_visit: () => [
    blockField("fm_preventive", "Preventive health review", "Prevention"),
    blockField("fm_lifestyle", "Lifestyle and risk factors", "Lifestyle"),
    icd11Field(),
    scoresField(["bmi", "cvd_risk", "audit_c"]),
    screeningField(),
    safetyField(),
    guidanceField("fm_preventive_visit"),
  ],
  fm_chronic_followup: () => [
    blockField("fm_chronic", "Chronic disease review", "Chronic disease"),
    icd11Field(),
    scoresField(["bmi", "egfr", "hba1c", "cvd_risk", "asthma_control", "cat", "mmrc"]),
    safetyField(),
    guidanceField("fm_chronic_followup"),
  ],
  fm_acute_visit: () => [
    blockField("fm_acute", "Acute presentation", "Acute assessment"),
    icd11Field(),
    scoresField(["bmi"]),
    safetyField(),
    guidanceField("fm_acute_visit"),
  ],
  fm_followup: () => [
    blockField("fm_core", "Core consultation", "Structured consultation"),
    icd11Field(),
    safetyField(),
    guidanceField("fm_followup"),
  ],
  fm_referral: () => [icd11Field(), guidanceField("fm_referral")],
  fm_procedure_note: () => [
    blockField("fm_core", "Core consultation", "Procedure context"),
    icd11Field(),
    safetyField(),
    guidanceField("fm_procedure_note"),
  ],
  fm_medication_review: () => [
    blockField("fm_chronic", "Chronic disease review", "Medication context"),
    icd11Field(),
    scoresField(["egfr", "bmi"]),
    safetyField(),
    guidanceField("fm_medication_review"),
  ],
  fm_health_maintenance: () => [
    blockField("fm_preventive", "Preventive health review", "Prevention"),
    blockField("fm_lifestyle", "Lifestyle and risk factors", "Lifestyle"),
    icd11Field(),
    scoresField(["bmi", "cvd_risk", "audit_c"]),
    screeningField(),
    safetyField(),
    guidanceField("fm_health_maintenance"),
  ],
};

export const withFamilyMedicineStandards = (docs) =>
  docs.map((doc) => {
    const build = FM_ENHANCEMENTS[doc.key];
    if (!build) return doc;
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = build().filter((f) => {
      if (existing.has(f.key)) return false;
      existing.add(f.key);
      return true;
    });
    if (!additions.length) return doc;
    return { ...doc, fields: [...(doc.fields || []), ...additions] };
  });

// ---------------------------------------------------------------- New templates
export const FM_WORKFLOW_DOCS = [
  {
    key: "fm_well_child",
    label: "Child Health / Well-Child Visit",
    specialty: "family_medicine",
    fields: [
      T("reason_for_visit", "Reason for the visit"),
      T("birth_history", "Birth history (gestation, delivery, birth weight, neonatal course)"),
      T("feeding_nutrition", "Feeding and nutrition"),
      T("development_history", "Development history as reported by the parent"),
      T("immunization_history", "Immunization history reviewed against the record"),
      T("school_nursery", "School / nursery, attendance and progress"),
      T("parental_concern", "Parental concern, in their own words"),
      blockField("fm_child", "Child health", "Structured assessment"),
      icd11Field(),
      scoresField(["child_bmi"]),
      safetyField(),
      screeningField(),
      guidanceField("fm_well_child"),
    ],
  },
  {
    key: "fm_geriatric_assessment",
    label: "Geriatric Comprehensive Assessment",
    specialty: "family_medicine",
    fields: [
      T("reason_for_visit", "Reason for the assessment"),
      T("medications_summary", "Medicines taken, as reconciled with the patient or carer"),
      T("functional_history", "Functional history (mobility, self-care, help available)"),
      T("cognitive_history", "Cognitive history and informant account"),
      blockField("fm_geriatric", "Geriatric assessment", "Structured assessment"),
      blockField("fm_lifestyle", "Lifestyle and risk factors", "Lifestyle"),
      icd11Field(),
      scoresField(["cfs", "falls_screen", "bmi", "egfr", "phq9"]),
      safetyField(),
      screeningField(),
      guidanceField("fm_geriatric_assessment"),
    ],
  },
  {
    key: "fm_womens_health",
    label: "Women's Health Review",
    specialty: "family_medicine",
    fields: [
      T("reason_for_visit", "Reason for the visit"),
      T("gynae_history", "Gynaecological history"),
      T("obstetric_history", "Obstetric history"),
      T("contraception_history", "Contraceptive history"),
      blockField("fm_women", "Women's health", "Structured assessment"),
      icd11Field(),
      scoresField(["bmi", "phq9", "gad7"]),
      safetyField(),
      screeningField(),
      guidanceField("fm_womens_health"),
    ],
  },
  {
    key: "fm_maternal_health",
    label: "Antenatal / Postnatal Primary-Care Review",
    specialty: "family_medicine",
    fields: [
      T("reason_for_visit", "Reason for the visit"),
      T("obstetric_summary", "Obstetric summary (gravidity, parity, previous complications)"),
      T("maternity_team", "Maternity team and next scheduled review"),
      blockField("fm_maternal", "Antenatal / postnatal review", "Structured assessment"),
      icd11Field(),
      scoresField(["bmi"]),
      safetyField(),
      screeningField(),
      guidanceField("fm_maternal_health"),
    ],
  },
  {
    key: "fm_vaccination",
    label: "Vaccination Visit",
    specialty: "family_medicine",
    fields: [
      T("reason_for_visit", "Reason for the visit / vaccine requested"),
      T("previous_reactions", "Previous vaccine reactions"),
      T("immunization_record", "Immunization record reviewed"),
      blockField("fm_vaccine", "Vaccination record", "Vaccine administered"),
      icd11Field(),
      safetyField(),
      guidanceField("fm_vaccination"),
    ],
  },
  {
    key: "fm_mental_health",
    label: "Mental Health Assessment (Primary Care)",
    specialty: "family_medicine",
    fields: [
      T("reason_for_visit", "Reason for the visit"),
      T("history", "History of the presenting problem"),
      T("past_psychiatric_history", "Past psychiatric history and treatment"),
      T("social_situation", "Social situation and supports"),
      blockField("fm_mental", "Mental health assessment", "Structured assessment"),
      icd11Field(),
      scoresField(["phq9", "gad7", "audit_c"]),
      safetyField(),
      guidanceField("fm_mental_health"),
    ],
  },
  {
    key: "fm_lifestyle_counseling",
    label: "Lifestyle and Risk-Factor Counselling",
    specialty: "family_medicine",
    fields: [
      T("reason_for_visit", "Reason for the visit"),
      T("risk_summary", "Risk-factor summary"),
      blockField("fm_lifestyle", "Lifestyle and risk factors", "Structured assessment"),
      blockField("fm_preventive", "Preventive health review", "Prevention"),
      icd11Field(),
      scoresField(["bmi", "cvd_risk", "audit_c"]),
      screeningField(),
      safetyField(),
      guidanceField("fm_lifestyle_counseling"),
    ],
  },
  {
    key: "fm_chronic_annual_review",
    label: "Annual Chronic Disease Review",
    specialty: "family_medicine",
    fields: [
      T("reason_for_visit", "Reason for the annual review"),
      T("conditions_summary", "Conditions under review"),
      T("interval_history", "Interval history since the last review"),
      blockField("fm_chronic", "Chronic disease review", "Chronic disease"),
      blockField("fm_lifestyle", "Lifestyle and risk factors", "Lifestyle"),
      icd11Field(),
      scoresField(["bmi", "egfr", "hba1c", "cvd_risk", "asthma_control", "cat", "mmrc", "phq9"]),
      safetyField(),
      screeningField(),
      guidanceField("fm_chronic_annual_review"),
    ],
  },
];