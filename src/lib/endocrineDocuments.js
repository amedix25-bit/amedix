// Strengthening the EXISTING Endocrinology note types.
//
// The eight templates in src/lib/specialtyDocuments.js (CONSULTATION, FOLLOW-UP,
// DIABETES FOLLOW-UP, THYROID FOLLOW-UP, PROGRESS NOTE, CARE PLAN, MEDICATION
// ADJUSTMENT, DISCHARGE SUMMARY) are NOT recreated, renamed or replaced. Their
// keys, labels and order stay exactly as they are and nothing already in them is
// removed, so every saved note keeps its meaning and every workflow that reads a
// note by key keeps working. This module only APPENDS fields.
//
// AUDIT RULES APPLIED HERE
// 1. Nothing duplicates a shared AMedix surface. Vital signs, the structured
//    examination (Select Examination), laboratory results, imaging, medications,
//    allergies and the patient's recorded history are provided by the shared
//    ClinicalNote tabs and the unified Patient Record, which attach to every note
//    automatically. No note here re-collects them.
// 2. Examination is recorded through the shared `examinations` component, never
//    as another free-text examination field.
// 3. Every field is optional unless its absence would make the record
//    indefensible: only the consultation's differential diagnosis is required.
//    "Not examined", "Not assessed", "Not applicable" and "Not documented" are
//    real options — an unanswered field is never read as normal.
// 4. Conditional (`showIf`) questions appear only when the clinical context makes
//    them relevant, so no note forces a clinician to answer a question that does
//    not apply.
// 5. Where a template already asks a question (Assessment, Adherence, Diet,
//    Exercise, Follow-Up), the audit keeps that field and adds around it rather
//    than asking the same thing twice.

import { endocrineCatalogFor } from "@/lib/endocrineIcd11";

const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
// The shared note policy replaces any field whose label contains "Examination"
// with the one structured "Select Examination" interface built from the
// specialty's own examination catalogue. Planting that label is how a note joins
// the shared component instead of adding a second free-text examination —
// declaring type "examinations" here would be dropped, because the policy sees
// the document as already carrying its examination field.
const X = (key, label) => ({ key, label, type: "textarea" });

const R = { required: true };
const when = (key, ...values) => ({ showIf: { key, in: values } });

const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

const FOLLOW_UP_OPTIONS = [
  "Not arranged",
  "Within 1 week",
  "2–4 weeks",
  "1–3 months",
  "3–6 months",
  "More than 6 months",
  "Discharged — no endocrine follow-up",
];

const EDUCATION_OPTIONS = [
  "Documented this visit",
  "Previously documented",
  "Declined by the patient",
  "Not applicable to this visit",
  "Not documented",
];

const MANAGEMENT_OPTIONS = [
  "No change to the current approach",
  "Start therapy",
  "Adjust therapy",
  "Stop therapy",
  "Further assessment before deciding",
  "Procedure or surgery discussed",
  "Admitted for treatment",
  "Observation only",
];

const icdBlock = (domains, placeholder) =>
  sec("Diagnosis Classification (ICD-11)", [
    {
      key: "icd11_diagnoses",
      label: "Diagnoses (ICD-11 MMS) — role, status and clinical basis",
      type: "icd11_diagnoses",
      catalog: endocrineCatalogFor(domains),
      searchPlaceholder: placeholder,
    },
  ]);

const safetyBlock = () =>
  sec("Safety Concerns & Documented Action", [
    {
      key: "endocrine_safety",
      label: "Safety prompts from the findings documented in this note",
      type: "endocrine_safety",
    },
  ]);

const COMMON_DOMAINS = [
  "thyroid",
  "diabetes",
  "glucose_other",
  "pituitary",
  "adrenal",
  "parathyroid",
  "gonadal",
  "polyglandular",
  "nutrition",
  "electrolyte",
  "lipid",
  "postprocedural",
];

// ---- Condition-specific assessment (Paragraph 3) ---------------------------
// Each note asks only the questions that belong to the disorder it documents.
// The clinician selects the endocrine domain once, and only that domain's fields
// appear, so a thyroid review never shows a bone-density question.
//
// Nothing here re-collects shared data: no laboratory number, vital sign,
// anthropometric measurement or examination finding is entered twice. The fields
// record the clinician's INTERPRETATION ("pattern on the attached results"), the
// classification and the decision taken. A diagnosis is therefore never produced
// by the app from a single result — `diagnostic_basis` records explicitly what the
// documented diagnosis rests on, and "Not yet established" is always available.
const DM = "Diabetes mellitus";
const THY = "Thyroid disorder";
const PIT = "Pituitary disorder";
const ADR = "Adrenal disorder";
const BONE = "Calcium, parathyroid or metabolic bone disorder";
const OBES = "Obesity or metabolic disorder";
const REPRO = "Reproductive or gonadal disorder";
const OTHER = "Other or overlapping endocrine disorder";

const DOMAIN_OPTIONS = [DM, THY, PIT, ADR, BONE, OBES, REPRO, OTHER];
const onDomain = (...domains) => when("endocrine_domain", ...domains);

const DIAGNOSTIC_BASIS_OPTIONS = [
  "Biochemical confirmation",
  "Imaging",
  "Cytology or histology",
  "Genetic testing",
  "Clinical features only",
  "Not yet established",
];

const HYPOGLYCAEMIA_OPTIONS = [
  "None documented",
  "Level 1 — glucose < 3.9 mmol/L (70 mg/dL)",
  "Level 2 — glucose < 3.0 mmol/L (54 mg/dL)",
  "Level 3 — severe: altered mental or physical status requiring assistance",
];

const DECOMPENSATION_OPTIONS = [
  "None documented",
  "Diabetic ketoacidosis",
  "Hyperosmolar hyperglycaemic state",
  "Mixed ketoacidosis and hyperosmolar state",
  "Severe hyperglycaemia without ketosis",
  "Not assessed",
];

const THYROID_STATUS_OPTIONS = [
  "Overt hypothyroidism",
  "Subclinical hypothyroidism",
  "Euthyroid on replacement",
  "Subclinical hyperthyroidism",
  "Overt thyrotoxicosis",
  "Not interpretable — repeat testing",
];

const PREGNANCY_OPTIONS = ["Not applicable", "Not pregnant", "Pregnant", "Postpartum", "Unknown"];

const BETHESDA_OPTIONS = [
  "Not performed",
  "I — nondiagnostic",
  "II — benign",
  "III — atypia of undetermined significance",
  "IV — follicular neoplasm",
  "V — suspicious for malignancy",
  "VI — malignant",
];

const conditionSpecificFields = (section) =>
  sec(section, [
    S("endocrine_domain", "Endocrine Domain Addressed at This Encounter", DOMAIN_OPTIONS),
    S(
      "diagnostic_basis",
      "Basis for the Documented Endocrine Diagnosis",
      DIAGNOSTIC_BASIS_OPTIONS,
      onDomain(...DOMAIN_OPTIONS)
    ),

    // --- Diabetes mellitus (ADA Standards of Care) ---
    S("dm_type_classification", "Diabetes Type and Classification", [
      "Type 1 diabetes",
      "Type 2 diabetes",
      "Gestational diabetes",
      "Monogenic or neonatal diabetes",
      "Secondary or pancreatogenic diabetes",
      "Classification not yet established",
    ], onDomain(DM)),
    S("dm_diagnostic_evidence", "Diagnostic Evidence Documented for the Classification", [
      "Fasting plasma glucose",
      "2-hour oral glucose tolerance test",
      "HbA1c",
      "Random glucose with symptoms",
      "Previously established diagnosis",
      "Not documented",
    ], onDomain(DM)),
    S("hba1c_trend", "HbA1c and Glucose Trend", [
      "Improving",
      "Stable",
      "Worsening",
      "No comparable previous value",
    ], onDomain(DM)),
    S("hypoglycaemia_level", "Highest Hypoglycaemia Level Documented", HYPOGLYCAEMIA_OPTIONS, onDomain(DM)),
    S("acute_decompensation", "Hyperglycaemic Emergency Documented", DECOMPENSATION_OPTIONS, onDomain(DM)),
    S("albuminuria_category", "Urine Albumin-to-Creatinine Category", [
      "A1 — normal to mildly increased",
      "A2 — moderately increased",
      "A3 — severely increased",
      "Not measured",
    ], onDomain(DM)),
    S("renal_function_review", "Kidney Function Review", [
      "Stable",
      "Declining",
      "Not reviewed",
      "Not applicable",
    ], onDomain(DM)),
    S("foot_assessment", "Foot Assessment", [
      "No lesion, pulses present",
      "Reduced or absent pulses",
      "Ulcer or lesion present",
      "Previous amputation",
      "Not examined",
    ], onDomain(DM)),
    S("retinal_assessment", "Retinal Assessment", [
      "No retinopathy",
      "Non-proliferative retinopathy",
      "Proliferative retinopathy",
      "Not screened",
    ], onDomain(DM)),
    S("cv_risk_category", "Cardiovascular Risk", [
      "Established cardiovascular disease",
      "High risk without established disease",
      "Not assessed",
    ], onDomain(DM)),

    // --- Thyroid disorders (ATA) ---
    S("thyroid_symptom_pattern", "Thyroid Symptom Pattern", [
      "None documented",
      "Thyrotoxic features",
      "Hypothyroid features",
      "Mixed or compressive features",
      "Not assessed",
    ], onDomain(THY)),
    S("thyroid_status", "Thyroid Functional Pattern on the Attached Results", THYROID_STATUS_OPTIONS, onDomain(THY)),
    S("pregnancy_status", "Pregnancy or Postpartum Status", PREGNANCY_OPTIONS, onDomain(THY)),
    S("thyroid_antibodies", "Thyroid Antibodies", [
      "Not indicated",
      "TPO antibodies positive",
      "Thyroglobulin antibodies positive",
      "TSH-receptor antibodies positive",
      "Antibodies negative",
      "Ordered — result awaited",
      "Not documented",
    ], onDomain(THY)),
    S("thyroid_imaging_review", "Thyroid Imaging Reviewed", [
      "Ultrasound reviewed",
      "Nodule documented with sonographic risk category",
      "No imaging indicated",
      "Imaging not documented",
    ], onDomain(THY)),
    S("fna_bethesda", "Cytology Result (Bethesda)", BETHESDA_OPTIONS, onDomain(THY)),
    S("thyroid_treatment_response", "Response to Thyroid Treatment", [
      "Remission",
      "Partial response",
      "No response",
      "Treatment not started",
      "Too early to assess",
    ], onDomain(THY)),
    S("thyroid_monitoring_arranged", "Thyroid Monitoring Arranged", [
      "TSH in 6–8 weeks",
      "TSH in 3 months",
      "Ultrasound surveillance",
      "Repeat fine-needle aspiration",
      "Not documented",
    ], onDomain(THY)),

    // --- Pituitary disorders ---
    S("pituitary_symptom_pattern", "Pituitary Hormone Excess or Deficiency Symptoms", [
      "None documented",
      "Features of hormone excess",
      "Features of hormone deficiency",
      "Both excess and deficiency",
      "Not assessed",
    ], onDomain(PIT)),
    S("pituitary_visual_status", "Visual Symptoms or Field Assessment", [
      "No visual symptoms",
      "Visual field defect documented",
      "Visual symptoms reported, not tested",
      "Not assessed",
    ], onDomain(PIT)),
    S("pituitary_hormone_investigations", "Pituitary Hormone Investigations", [
      "Requested at this encounter",
      "Results reviewed and interpreted",
      "Not indicated",
      "Not documented",
    ], onDomain(PIT)),
    S("pituitary_imaging_status", "Pituitary Imaging", [
      "No lesion",
      "Microadenoma",
      "Macroadenoma",
      "Post-surgical or post-radiotherapy change",
      "Imaging not performed",
    ], onDomain(PIT)),
    S("pituitary_treatment_monitoring", "Pituitary Treatment Monitoring", [
      "Biochemical control documented",
      "Dose adjusted",
      "Awaiting repeat testing",
      "Not applicable",
    ], onDomain(PIT)),

    // --- Adrenal disorders (Endocrine Society) ---
    S("glucocorticoid_exposure", "Glucocorticoid Exposure", [
      "None documented",
      "Current systemic glucocorticoid",
      "Recent systemic glucocorticoid",
      "Withdrawn",
      "Topical or inhaled only",
      "Not documented",
    ], onDomain(ADR)),
    S("adrenal_symptom_pattern", "Adrenal Symptom Pattern", [
      "None documented",
      "Fatigue and postural symptoms",
      "Hyperpigmentation",
      "Salt craving or hypotension",
      "Not assessed",
    ], onDomain(ADR)),
    S("adrenal_haemodynamic_status", "Blood Pressure and Volume Status", [
      "Stable, no postural change",
      "Postural drop documented",
      "Hypotension documented",
      "Hypertension documented",
      "Not documented",
    ], onDomain(ADR)),
    S("adrenal_electrolyte_review", "Electrolyte Abnormality on the Attached Results", [
      "No abnormality documented",
      "Hyponatraemia",
      "Hyperkalaemia",
      "Hyponatraemia and hyperkalaemia",
      "Not documented",
    ], onDomain(ADR)),
    S("adrenal_hormonal_investigations", "Adrenal Hormonal Investigations", [
      "Morning cortisol",
      "ACTH stimulation test",
      "Renin and aldosterone",
      "Overnight dexamethasone suppression",
      "Plasma metanephrines",
      "Not requested",
    ], onDomain(ADR)),
    S("adrenal_testing_conditions", "Testing Conditions Documented", [
      "Timing, fasting and interfering medication documented",
      "Partially documented",
      "Not documented",
    ], onDomain(ADR)),
    S("adrenal_crisis_status", "Adrenal Crisis Recognition", [
      "No features of adrenal crisis",
      "Features present — emergency treatment given",
      "Features present — treatment not documented",
      "Suspected",
      "Not applicable",
    ], onDomain(ADR)),
    S("steroid_stress_dose_advice", "Sick-Day and Emergency Steroid Advice", [
      "Documented",
      "Not applicable",
      "Not documented",
    ], onDomain(ADR)),

    // --- Calcium, parathyroid and metabolic bone disease ---
    S("fracture_history", "Fracture History", [
      "No fragility fracture",
      "One fragility fracture — site documented",
      "Multiple fragility fractures",
      "Previous vertebral fracture on imaging",
      "Not documented",
    ], onDomain(BONE)),
    S("bone_density_status", "Bone Density Result", [
      "T-score −1.0 or above",
      "Osteopenia (T-score −1.0 to −2.5)",
      "Osteoporosis (T-score −2.5 or below)",
      "Not measured",
    ], onDomain(BONE)),
    S("fracture_risk_category", "Fracture Risk Assessment", [
      "Low",
      "Intermediate",
      "High",
      "Not calculated",
    ], onDomain(BONE)),
    S("bone_biochemistry_review", "Biochemical Review on the Attached Results", [
      "No abnormality documented",
      "Hypocalcaemia",
      "Hypercalcaemia",
      "Vitamin D deficiency",
      "Raised parathyroid hormone",
      "Not documented",
    ], onDomain(BONE)),
    S("bone_treatment_response", "Response to Bone Treatment", [
      "Responding",
      "Stable on treatment",
      "No response",
      "Not on treatment",
      "Too early to assess",
    ], onDomain(BONE)),
    S("bone_monitoring_arranged", "Bone Monitoring Arranged", [
      "Calcium and vitamin D in 3 months",
      "Repeat bone density",
      "Renal function and calcium",
      "Not documented",
    ], onDomain(BONE)),

    // --- Obesity and metabolic disorders ---
    S("weight_history", "Weight History", [
      "Progressive gain",
      "Stable",
      "Recent loss",
      "Fluctuating",
      "Not documented",
    ], onDomain(OBES)),
    S("bmi_category", "BMI Category", [
      "Underweight",
      "Normal range",
      "Overweight",
      "Obesity class I",
      "Obesity class II",
      "Obesity class III",
      "Not documented",
    ], onDomain(OBES)),
    S("waist_category", "Waist Circumference Category", [
      "Below the risk threshold",
      "Above the risk threshold",
      "Not measured",
    ], onDomain(OBES)),
    S("obesity_associated_conditions", "Associated Metabolic Conditions", [
      "None documented",
      "Dyslipidaemia",
      "Hypertension",
      "Metabolic dysfunction-associated steatotic liver disease",
      "Obstructive sleep apnoea",
      "Osteoarthritis",
      "Multiple conditions documented",
    ], onDomain(OBES)),
    S("metabolic_investigations", "Metabolic Investigations Reviewed", [
      "Fasting glucose and HbA1c",
      "Lipid profile",
      "Liver enzymes",
      "Not documented",
    ], onDomain(OBES)),
    S("obesity_treatment_response", "Response to Weight Intervention", [
      "Weight reduction achieved",
      "Partial response",
      "No change",
      "Not on treatment",
      "Too early to assess",
    ], onDomain(OBES)),

    // --- Reproductive, gonadal and other endocrine disorders ---
    T("reproductive_history", "Condition-Specific Reproductive History", onDomain(REPRO)),
    S("gonadal_symptom_pattern", "Gonadal Symptom Pattern", [
      "None documented",
      "Delayed puberty",
      "Features of hypogonadism",
      "Menstrual disturbance",
      "Fertility concern",
      "Not assessed",
    ], onDomain(REPRO)),
    S("gonadal_findings", "Gonadal Findings", [
      "Normal gonadal findings",
      "Delayed or incomplete development",
      "Gonadal atrophy",
      "Atypical genital development",
      "Not examined",
    ], onDomain(REPRO)),
    S("gonadal_hormonal_investigations", "Gonadal Hormonal Investigations", [
      "FSH and LH",
      "Testosterone or oestradiol",
      "Prolactin",
      "Karyotype",
      "Semen analysis",
      "Not documented",
    ], onDomain(REPRO)),
    S("gonadal_management", "Gonadal Management Decision", [
      "Observation",
      "Hormone replacement",
      "Fertility referral",
      "Surgical referral",
      "Discussed, decision pending",
    ], onDomain(REPRO)),
  ]);

const ENDOCRINE_ENHANCEMENTS = {
  // --- Endocrinology Consultation ------------------------------------------
  // Existing: Chief Complaint, History of Present Illness, Select Examination,
  // Assessment. Added around them: the presentation in structured terms, the
  // differential the consultation is for, and what was decided and arranged.
  endo_consultation: () => [
    ...sec("Endocrine Presentation", [
      S("symptom_duration", "Duration of Endocrine Symptoms", [
        "< 1 week",
        "1–4 weeks",
        "1–6 months",
        "6–12 months",
        "> 12 months",
        "Not assessed",
      ]),
      S("diabetes_symptoms", "Polyuria, Polydipsia or Unexplained Weight Loss", [
        "Present",
        "Absent",
        "Not assessed",
      ]),
      S("weight_trend", "Weight Trend", [
        "Stable",
        "Unintentional loss",
        "Unintentional gain",
        "Not assessed",
      ]),
      S("relatives_endocrine_disease", "Relatives with Endocrine Disease", [
        "None known",
        "Type 1 or type 2 diabetes",
        "Thyroid disease",
        "Multiple endocrine neoplasia",
        "Other endocrine disease",
        "Unknown",
      ]),
    ]),
    ...sec("Differential Diagnosis", [
      T(
        "differential",
        "Differential Diagnosis — and the evidence that supports or excludes each",
        R
      ),
      S("diagnostic_confidence", "Diagnostic Confidence at the End of This Encounter", [
        "Diagnosis confirmed",
        "Probable — treatment started, confirmation pending",
        "Possible — further assessment required",
        "Not established",
      ]),
    ]),
    ...conditionSpecificFields("Condition-Specific Assessment"),
    ...sec("Management and Follow-Up", [
      S("management_approach", "Management Decision at This Visit", MANAGEMENT_OPTIONS),
      S("education_documented", "Patient Education Documented", EDUCATION_OPTIONS),
      S("follow_up_interval", "Endocrine Follow-Up Arranged", FOLLOW_UP_OPTIONS),
    ]),
    ...icdBlock(
      COMMON_DOMAINS,
      "Search ICD-11 — diabetes, thyroid, adrenal, pituitary, calcium, obesity, electrolytes..."
    ),
    ...safetyBlock(),
  ],

  // --- Endocrinology Follow-Up ---------------------------------------------
  endo_followup: () => [
    ...sec("Interval Course", [
      S("interval_symptom_control", "Symptom Control Since the Last Visit", [
        "Better",
        "Unchanged",
        "Worse",
        "Fluctuating",
        "Not assessed",
      ]),
      S("unscheduled_care_since_last", "Unscheduled Care Since the Last Visit", [
        "None documented",
        "Emergency department attendance",
        "Admission",
        "Unscheduled clinic attendance",
        "Unknown",
      ]),
      S("adherence_since_last", "Adherence Since the Last Visit", [
        "Complete",
        "Partial",
        "Poor",
        "Not assessed",
      ]),
      S("therapy_change_since_last", "Therapy Change Since the Last Visit", [
        "None",
        "Dose changed",
        "Agent added",
        "Agent stopped",
        "Preparation switched",
      ]),
    ]),
    ...sec("Examination at This Visit", [X("examination_at_this_visit", "Examination at This Visit")]),
    ...conditionSpecificFields("Condition-Specific Review"),
    ...sec("Management and Follow-Up", [
      S("management_approach", "Management Decision at This Visit", MANAGEMENT_OPTIONS),
      S("education_documented", "Patient Education Documented", EDUCATION_OPTIONS),
      S("follow_up_interval", "Endocrine Follow-Up Arranged", FOLLOW_UP_OPTIONS),
    ]),
    ...icdBlock(
      COMMON_DOMAINS,
      "Search ICD-11 — the condition followed up, its complications and endocrine comorbidity..."
    ),
    ...safetyBlock(),
  ],

  // --- Diabetes Follow-Up (ADA Standards of Care) --------------------------
  // Existing: type, duration, glucose log, HbA1c, hypoglycaemic episodes, insulin
  // regimen, oral agents, adherence, diet, exercise, complication screening, BP,
  // lipid profile, assessment. Added: the individualised target the values are
  // judged against, the ADA hypoglycaemia grade, the cardiovascular/kidney risk
  // profile and whether each modifiable risk was addressed.
  endo_diabetes_followup: () => [
    ...sec("Glycaemic Metrics and Targets", [
      S("hba1c_target", "Individualised HbA1c Target", [
        "< 6.5%",
        "< 7.0%",
        "< 7.5%",
        "< 8.0%",
        "Avoiding hypoglycaemia is the priority",
        "Not individualised",
      ]),
      S("glucose_monitoring_method", "Glucose Monitoring Method", [
        "Self-monitoring of blood glucose",
        "Intermittently scanned CGM",
        "Real-time CGM",
        "Professional CGM",
        "None documented",
      ]),
      N("time_in_range", "Time in Range (%)", when("glucose_monitoring_method", "Intermittently scanned CGM", "Real-time CGM", "Professional CGM")),
      N("time_below_range", "Time Below Range (%)", when("glucose_monitoring_method", "Intermittently scanned CGM", "Real-time CGM", "Professional CGM")),
      N("glucose_management_indicator", "Glucose Management Indicator (%)", when("glucose_monitoring_method", "Intermittently scanned CGM", "Real-time CGM", "Professional CGM")),
      S("hypoglycaemia_level", "Highest Hypoglycaemia Level Documented", [
        "None documented",
        "Level 1 — glucose < 3.9 mmol/L (70 mg/dL)",
        "Level 2 — glucose < 3.0 mmol/L (54 mg/dL)",
        "Level 3 — severe: altered mental or physical status requiring assistance",
      ]),
      S("acute_decompensation", "Acute Decompensation at This Visit", [
        "None documented",
        "Diabetic ketoacidosis",
        "Hyperosmolar hyperglycaemic state",
        "Mixed ketoacidosis and hyperosmolar state",
        "Severe hyperglycaemia without ketosis",
        "Not assessed",
      ]),
    ]),
    ...sec("Cardiovascular and Kidney Risk", [
      S("ascvd_status", "Atherosclerotic Cardiovascular Disease", [
        "Established ASCVD",
        "High risk, no established ASCVD",
        "Not assessed",
      ]),
      S("heart_failure_status", "Heart Failure", [
        "Established heart failure",
        "No heart failure documented",
        "Not assessed",
      ]),
      S("ckd_status", "Chronic Kidney Disease Stage", [
        "No CKD documented",
        "CKD G1–G2",
        "CKD G3a–G3b",
        "CKD G4–G5",
        "Not assessed",
      ]),
      S("statin_therapy", "Statin Therapy", [
        "Prescribed",
        "Not indicated",
        "Discussed, not started",
        "Not documented",
      ]),
      S("ras_blockade", "RAS Blockade (ACE inhibitor / ARB)", [
        "Prescribed",
        "Not indicated",
        "Contraindicated or not tolerated",
        "Not documented",
      ]),
      S("sglt2_inhibitor", "SGLT2 Inhibitor", [
        "Prescribed",
        "Not prescribed — no indication recorded",
        "Not prescribed — kidney function or tolerance",
        "Contraindicated",
        "Not documented",
      ]),
      S("glp1_receptor_agonist", "GLP-1 Receptor Agonist", [
        "Prescribed",
        "Not prescribed — no indication recorded",
        "Not prescribed — tolerance or preference",
        "Contraindicated",
        "Not documented",
      ]),
    ]),
    ...sec("Complication Screening This Visit", [
      S("retinopathy_screening", "Retinal Screening Result", [
        "No retinopathy",
        "Non-proliferative retinopathy",
        "Proliferative retinopathy",
        "Not screened",
      ]),
      S("foot_risk_category", "Foot Risk Category", ["Low", "Moderate", "High", "Not assessed"]),
      S("neuropathy_screening", "Peripheral Neuropathy Screening", [
        "Absent",
        "Present",
        "Not assessed",
      ]),
    ]),
    ...sec("Diabetes Classification and Purpose-Specific Assessment", [
      S("dm_type_classification", "Diabetes Type and Classification", [
        "Type 1 diabetes",
        "Type 2 diabetes",
        "Gestational diabetes",
        "Monogenic or neonatal diabetes",
        "Secondary or pancreatogenic diabetes",
        "Classification not yet established",
      ]),
      S("dm_diagnostic_evidence", "Diagnostic Evidence Documented for the Classification", [
        "Fasting plasma glucose",
        "2-hour oral glucose tolerance test",
        "HbA1c",
        "Random glucose with symptoms",
        "Previously established diagnosis",
        "Not documented",
      ]),
      S("hba1c_trend", "HbA1c and Glucose Trend", [
        "Improving",
        "Stable",
        "Worsening",
        "No comparable previous value",
      ]),
      S("albuminuria_category", "Urine Albumin-to-Creatinine Category", [
        "A1 — normal to mildly increased",
        "A2 — moderately increased",
        "A3 — severely increased",
        "Not measured",
      ]),
      S("renal_function_review", "Kidney Function Review", [
        "Stable",
        "Declining",
        "Not reviewed",
        "Not applicable",
      ]),
      S("foot_pulses", "Foot Pulses", [
        "Present in both feet",
        "Reduced",
        "Absent",
        "Not examined",
      ]),
      S("foot_lesion", "Foot Lesion or Ulcer", [
        "None documented",
        "Callus or fissure",
        "Ulcer present",
        "Previous amputation",
        "Not examined",
      ]),
    ]),
    ...sec("Therapy and Self-Management", [
      S("current_regimen_category", "Current Glucose-Lowering Regimen", [
        "Lifestyle alone",
        "Metformin",
        "Metformin plus another oral agent",
        "GLP-1 receptor agonist",
        "SGLT2 inhibitor",
        "Basal insulin",
        "Basal-bolus insulin",
        "Premixed insulin",
        "Combination therapy",
      ]),
      S("structured_education", "Structured Diabetes Education", EDUCATION_OPTIONS),
      T("therapy_change_documented", "Therapy Change Made at This Visit"),
      S("follow_up_interval", "Diabetes Follow-Up Arranged", FOLLOW_UP_OPTIONS),
    ]),
    ...icdBlock(
      ["diabetes", "glucose_other", "lipid", "electrolyte", "nutrition", "postprocedural"],
      "Search ICD-11 — diabetes type, ketoacidosis, hyperosmolar state, hypoglycaemia, obesity, lipidaemia..."
    ),
    ...safetyBlock(),
  ],

  // --- Thyroid Follow-Up (ATA) ---------------------------------------------
  // Existing: symptoms, TSH, free T4, thyroid examination, goitre/nodules,
  // antibodies, ultrasound findings, thyroid medications, dose adjustment,
  // assessment. Added: the functional interpretation the values support, the
  // pregnancy context that changes it, the replacement decision, and a nodule
  // block that appears only when a nodule is actually documented.
  endo_thyroid_followup: () => [
    ...sec("Thyroid Functional Status", [
      S("thyroid_status", "Thyroid Functional Status", [
        "Overt hypothyroidism",
        "Subclinical hypothyroidism",
        "Euthyroid on replacement",
        "Subclinical hyperthyroidism",
        "Overt thyrotoxicosis",
        "Not interpretable — repeat testing",
      ]),
      S("pregnancy_status", "Pregnancy or Postpartum Status", [
        "Not applicable",
        "Not pregnant",
        "Pregnant",
        "Postpartum",
        "Unknown",
      ]),
      S("treatment_decision", "Treatment Decision at This Visit", [
        "Continue current therapy",
        "Dose increase",
        "Dose decrease",
        "Switch preparation",
        "Start antithyroid drug",
        "Radioiodine discussed",
        "Surgery discussed",
        "Observe and repeat testing",
      ]),
      S("follow_up_interval", "Thyroid Follow-Up Arranged", FOLLOW_UP_OPTIONS),
    ]),
    ...sec("Thyroid Assessment and Treatment Response", [
      S("thyroid_symptom_pattern", "Thyroid Symptom Pattern", [
        "None documented",
        "Thyrotoxic features",
        "Hypothyroid features",
        "Mixed or compressive features",
        "Not assessed",
      ]),
      S("diagnostic_basis", "Basis for the Documented Thyroid Diagnosis", [
        "Biochemical confirmation",
        "Imaging",
        "Cytology or histology",
        "Genetic testing",
        "Clinical features only",
        "Not yet established",
      ]),
      S("thyroid_antibodies", "Thyroid Antibodies", [
        "Not indicated",
        "TPO antibodies positive",
        "Thyroglobulin antibodies positive",
        "TSH-receptor antibodies positive",
        "Antibodies negative",
        "Ordered — result awaited",
        "Not documented",
      ]),
      S("thyroid_imaging_review", "Thyroid Imaging Reviewed", [
        "Ultrasound reviewed",
        "Nodule documented with sonographic risk category",
        "No imaging indicated",
        "Imaging not documented",
      ]),
      S("thyroid_treatment_response", "Response to Thyroid Treatment", [
        "Remission",
        "Partial response",
        "No response",
        "Treatment not started",
        "Too early to assess",
      ]),
      S("thyroid_monitoring_arranged", "Thyroid Monitoring Arranged", [
        "TSH in 6–8 weeks",
        "TSH in 3 months",
        "Ultrasound surveillance",
        "Repeat fine-needle aspiration",
        "Not documented",
      ]),
    ]),
    ...sec("Nodule Assessment", [
      S("thyroid_nodule_status", "Nodule Status at This Visit", [
        "No nodule documented",
        "Single nodule documented",
        "Multinodular goitre documented",
        "Not examined",
      ]),
      N("nodule_size_mm", "Largest Nodule Size (mm)", when("thyroid_nodule_status", "Single nodule documented", "Multinodular goitre documented")),
      S("tirads_category", "Sonographic Risk Category", [
        "TR1 — benign",
        "TR2 — not suspicious",
        "TR3 — mildly suspicious",
        "TR4 — moderately suspicious",
        "TR5 — highly suspicious",
        "Not applicable",
      ], when("thyroid_nodule_status", "Single nodule documented", "Multinodular goitre documented")),
      S("nodule_growth", "Growth Since the Previous Examination", [
        "No growth documented",
        "Growth documented",
        "Not comparable",
      ], when("thyroid_nodule_status", "Single nodule documented", "Multinodular goitre documented")),
      S("fna_bethesda", "Cytology Category (Bethesda)", [
        "Not performed",
        "I — nondiagnostic",
        "II — benign",
        "III — atypia of undetermined significance",
        "IV — follicular neoplasm",
        "V — suspicious for malignancy",
        "VI — malignant",
      ], when("thyroid_nodule_status", "Single nodule documented", "Multinodular goitre documented")),
    ]),
    ...icdBlock(
      ["thyroid", "parathyroid", "postprocedural"],
      "Search ICD-11 — hypothyroidism, thyrotoxicosis, thyroiditis, goitre, nodule, post-surgical thyroid disease..."
    ),
    ...safetyBlock(),
  ],

  // --- Endocrine Progress Note ---------------------------------------------
  endo_progress_note: () => [
    ...sec("Interval Course", [
      S("interval_trajectory", "Trajectory Since the Previous Note", [
        "Improving",
        "Stable",
        "Worsening",
        "Fluctuating",
        "Not assessed",
      ]),
      S("adherence_since_last", "Adherence", ["Complete", "Partial", "Poor", "Not assessed"]),
      S("therapy_change_since_last", "Therapy Change Since the Previous Note", [
        "None",
        "Dose changed",
        "Agent added",
        "Agent stopped",
        "Preparation switched",
      ]),
      T("objective_measures", "Objective Measures Documented at This Visit"),
    ]),
    ...sec("Examination at This Visit", [X("examination_at_this_visit", "Examination at This Visit")]),
    ...conditionSpecificFields("Condition-Specific Review"),
    ...sec("Management and Follow-Up", [
      S("management_approach", "Management Decision at This Visit", MANAGEMENT_OPTIONS),
      S("monitoring_arranged", "Monitoring Arranged", [
        "Glucose self-monitoring",
        "HbA1c",
        "Thyroid function tests",
        "Kidney function and albumin-to-creatinine ratio",
        "Imaging",
        "None documented",
      ]),
      S("education_documented", "Patient Education Documented", EDUCATION_OPTIONS),
      S("follow_up_interval", "Follow-Up Arranged", FOLLOW_UP_OPTIONS),
    ]),
    ...icdBlock(
      COMMON_DOMAINS,
      "Search ICD-11 — the endocrine problem being followed and its complications..."
    ),
    ...safetyBlock(),
  ],

  // --- Endocrine Care Plan -------------------------------------------------
  endo_care_plan: () => [
    ...sec("Individualised Targets", [
      I("target_hba1c", "Individualised HbA1c Target (%)"),
      I("target_blood_pressure", "Blood Pressure Target (mmHg)"),
      I("target_ldl", "LDL Cholesterol Target (mmol/L)"),
      I("target_weight", "Weight Target (kg)"),
    ]),
    ...sec("Monitoring Schedule Details", [
      S("hba1c_frequency", "HbA1c Monitoring Interval", [
        "Every 3 months",
        "Every 6 months",
        "Annually",
        "Not applicable",
      ]),
      S("kidney_monitoring", "Kidney Monitoring", [
        "eGFR and albumin-to-creatinine ratio annually",
        "eGFR and albumin-to-creatinine ratio more frequently",
        "Not applicable",
        "Not documented",
      ]),
      S("eye_screening_interval", "Retinal Screening Interval", [
        "Annual",
        "More frequent than annual",
        "Not applicable",
        "Not documented",
      ]),
      S("foot_review_interval", "Foot Review Interval", ["Every visit", "Annually", "Not documented"]),
    ]),
    ...sec("Preventive Care and Education", [
      S("vaccination_status", "Vaccination Status", [
        "Up to date",
        "Incomplete",
        "Declined",
        "Not documented",
      ]),
      S("sick_day_rules", "Sick-Day Rules", ["Documented", "Not documented", "Not applicable"]),
      S("hypoglycaemia_education", "Hypoglycaemia Education", [
        "Documented",
        "Not documented",
        "Not applicable",
      ]),
      S("self_monitoring_plan", "Self-Monitoring Plan Given", ["Documented", "Not documented"]),
      S("care_plan_shared_with_patient", "Care Plan Discussed With the Patient", [
        "Documented",
        "Declined",
        "Not documented",
      ]),
    ]),
    ...sec("Condition-Specific Monitoring", [
      S("weight_management_plan", "Weight and Metabolic Plan", [
        "Structured lifestyle programme",
        "Pharmacotherapy considered",
        "Bariatric surgery discussed",
        "Not applicable",
        "Not documented",
      ]),
      S("bone_health_reviewed", "Bone Health and Fracture Risk Reviewed", [
        "Reviewed — no action required",
        "Reviewed — treatment planned",
        "Not reviewed",
        "Not applicable",
      ]),
      S("fracture_risk_recorded", "Fracture Risk Assessment Recorded", [
        "Recorded",
        "Not recorded",
        "Not applicable",
      ]),
      S("reproductive_health_reviewed", "Reproductive and Gonadal Health Reviewed", [
        "Reviewed — no action required",
        "Reviewed — referral planned",
        "Not reviewed",
        "Not applicable",
      ]),
    ]),
    ...icdBlock(COMMON_DOMAINS, "Search ICD-11 — every condition this care plan covers..."),
    ...safetyBlock(),
  ],

  // --- Medication Adjustment Record ----------------------------------------
  endo_medication_adjustment: () => [
    ...sec("Adjustment Detail", [
      S("drug_class", "Drug Class", [
        "Insulin — basal",
        "Insulin — bolus",
        "Insulin — premixed",
        "Metformin",
        "SGLT2 inhibitor",
        "GLP-1 receptor agonist",
        "DPP-4 inhibitor",
        "Sulfonylurea",
        "Levothyroxine",
        "Thionamide (carbimazole, methimazole, propylthiouracil)",
        "Glucocorticoid",
        "Mineralocorticoid",
        "Vitamin D analogue",
        "Other",
      ]),
      S("titration_basis", "Basis for the Adjustment", [
        "Glucose readings",
        "HbA1c",
        "TSH or free T4",
        "Adverse effect",
        "Weight-based calculation",
        "Protocol or guideline",
        "Clinical judgement",
      ]),
      N("weight_based_reference", "Weight Used for the Calculation (kg)", when("titration_basis", "Weight-based calculation")),
      S("hypoglycaemia_risk_after_change", "Hypoglycaemia Risk After the Change", [
        "No increased risk recorded",
        "Increased — education given",
        "Increased — education not documented",
      ]),
      S("glucocorticoid_exposure", "Glucocorticoid Exposure Context", [
        "Replacement for adrenal insufficiency",
        "Suppression or anti-inflammatory course",
        "Withdrawal or taper",
        "Not applicable",
      ], when("drug_class", "Glucocorticoid", "Mineralocorticoid")),
      S("adrenal_crisis_advice", "Sick-Day and Adrenal Crisis Advice Given", [
        "Documented",
        "Not applicable",
        "Not documented",
      ], when("drug_class", "Glucocorticoid", "Mineralocorticoid")),
      S("bone_protection_review", "Bone Protection Reviewed", [
        "Reviewed — calcium and vitamin D",
        "Reviewed — bone density arranged",
        "Not indicated",
        "Not documented",
      ], when("drug_class", "Glucocorticoid")),
    ]),
    ...sec("Monitoring After the Change", [
      S("monitoring_required", "Monitoring Required", [
        "Glucose self-monitoring",
        "HbA1c in 3 months",
        "TSH in 6–8 weeks",
        "Free T4 in 6–8 weeks",
        "Potassium",
        "Cortisol or ACTH",
        "Corrected calcium",
        "None documented",
      ]),
      S("education_given", "Education Given with the Change", [
        "Dose and timing",
        "Missed-dose plan",
        "Sick-day rules",
        "Hypoglycaemia management",
        "Injection technique",
        "Not documented",
      ]),
      S("follow_up_interval", "Follow-Up Arranged", FOLLOW_UP_OPTIONS),
    ]),
    ...icdBlock(
      ["diabetes", "glucose_other", "thyroid", "adrenal", "pituitary", "parathyroid"],
      "Search ICD-11 — the indication this adjustment is made for..."
    ),
    ...safetyBlock(),
  ],

  // --- Discharge Summary (Endocrinology) -----------------------------------
  endo_discharge_summary: () => [
    ...sec("Status at Discharge", [
      S("discharge_glycaemic_state", "Glycaemic State at Discharge", [
        "Stable on the discharge regimen",
        "Newly started insulin",
        "Resolving ketoacidosis",
        "Resolving hyperosmolar state",
        "Not applicable",
      ]),
      T("insulin_regimen_at_discharge", "Insulin Regimen at Discharge", when("discharge_glycaemic_state", "Stable on the discharge regimen", "Newly started insulin", "Resolving ketoacidosis", "Resolving hyperosmolar state")),
      S("steroid_stress_dose_advice", "Stress-Dose and Sick-Day Advice Documented", [
        "Documented",
        "Not applicable",
        "Not documented",
      ]),
      S("follow_up_interval", "Follow-Up Interval", [
        "Within 1 week",
        "2–4 weeks",
        "1–3 months",
        "More than 3 months",
        "Not arranged",
      ]),
      S("readmission_risk", "Readmission Risk Documented", [
        "Low",
        "Intermediate",
        "High",
        "Not assessed",
      ]),
      T("discharge_self_management", "Self-Management Instructions Given to the Patient"),
    ]),
    ...sec("Condition-Specific Discharge Status", [
      S("hyperglycaemic_emergency_admission", "Hyperglycaemic Emergency During the Admission", [
        "None documented",
        "Diabetic ketoacidosis",
        "Hyperosmolar hyperglycaemic state",
        "Mixed ketoacidosis and hyperosmolar state",
        "Not applicable",
      ]),
      S("adrenal_crisis_admission", "Adrenal Crisis During the Admission", [
        "None documented",
        "Treated adrenal crisis",
        "Suspected",
        "Not applicable",
      ]),
      S("steroid_emergency_card_issued", "Steroid Emergency Information Given", [
        "Documented",
        "Not applicable",
        "Not documented",
      ]),
      S("thyroid_status_at_discharge", "Thyroid Status at Discharge", THYROID_STATUS_OPTIONS),
      T("condition_specific_discharge_instructions", "Condition-Specific Instructions at Discharge"),
    ]),
    ...icdBlock(
      COMMON_DOMAINS,
      "Search ICD-11 — admission and discharge diagnoses including the endocrine complication..."
    ),
    ...safetyBlock(),
  ],
};

// Appends — never replaces — so a saved note keeps every field it already had.
export const withEndocrineStandards = (docs) =>
  docs.map((doc) => {
    const extra = ENDOCRINE_ENHANCEMENTS[doc.key];
    if (!extra) return doc;
    const existing = new Set(doc.fields.map((f) => f.key));
    const additions = extra().filter((f) => !existing.has(f.key));
    return { ...doc, fields: [...doc.fields, ...additions] };
  });