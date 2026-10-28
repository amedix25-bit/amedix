// Strengthening the EXISTING Endocrinology note types.
//
// The eight templates in src/lib/specialtyDocuments.js (ENDO_CONSULTATION,
// FOLLOW-UP, DIABETES FOLLOW-UP, THYROID FOLLOW-UP, PROGRESS NOTE, CARE PLAN,
// MEDICATION ADJUSTMENT, DISCHARGE SUMMARY) are NOT recreated, renamed or
// replaced. Their keys, labels and order stay exactly as they are, and nothing
// already in them is removed — this module only APPENDS fields, so every note
// already saved keeps its meaning and every existing workflow that reads a note
// by key keeps working.
//
// Two things are appended to each note:
//   1. Structured fields for the elements the guideline register in
//      src/lib/endocrineReferences.js expects a complete record to carry, placed
//      under explicit sections so they are visible rather than scattered.
//   2. An ICD-11 MMS 2025-01 classification block (role, status and clinical
//      basis per code) and the conditional safety panel.
//
// Labels deliberately avoid the retired vocabulary the shared note policy hides
// (a section titled Laboratory/Plan/Referral, a field titled "Family History",
// "Current Medications" or "Medication Review"), so nothing added here is
// silently dropped by that policy.

import { endocrineCatalogFor } from "@/lib/endocrineIcd11";

const T = (key, label) => ({ key, label, type: "textarea" });
const I = (key, label) => ({ key, label, type: "input" });
const N = (key, label) => ({ key, label, type: "number" });
const S = (key, label, options) => ({ key, label, type: "select", options });

const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

// Values a clinician may record at this visit. Numbers stay numbers so the
// safety rules can read them; an empty field is never read as normal.
const biochemistry = (withEgfr = true) =>
  sec("Endocrine Biochemistry", [
    N("sodium", "Sodium (mmol/L)"),
    N("potassium", "Potassium (mmol/L)"),
    N("corrected_calcium", "Corrected Calcium (mmol/L)"),
    N("fasting_glucose", "Glucose at This Visit (mmol/L)"),
    ...(withEgfr ? [N("egfr", "eGFR (mL/min/1.73 m²)")] : []),
  ]);

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

const ENDOCRINE_ENHANCEMENTS = {
  // --- Endocrinology Consultation ------------------------------------------
  endo_consultation: () => [
    ...sec("Endocrine Presentation", [
      S("symptom_duration", "Duration of Endocrine Symptoms", [
        "< 1 week",
        "1–4 weeks",
        "1–6 months",
        "6–12 months",
        "> 12 months",
        "Unknown",
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
      S("endocrine_therapy", "Endocrine Therapy at Presentation", [
        "None",
        "Insulin",
        "Non-insulin glucose-lowering therapy",
        "Thyroid hormone",
        "Antithyroid drug",
        "Glucocorticoid",
        "Other hormonal therapy",
        "Combination",
      ]),
    ]),
    ...sec("Anthropometry and Vitals", [
      N("weight_kg", "Weight (kg)"),
      N("height_cm", "Height (cm)"),
      N("waist_cm", "Waist Circumference (cm)"),
      I("blood_pressure", "Blood Pressure (mmHg)"),
    ]),
    ...biochemistry(),
    ...icdBlock(
      COMMON_DOMAINS,
      "Search ICD-11 — diabetes, thyroid, adrenal, pituitary, calcium, obesity, electrolytes..."
    ),
    ...safetyBlock(),
  ],

  // --- Endocrinology Follow-Up ---------------------------------------------
  endo_followup: () => [
    ...sec("Interval Course", [
      S("interval_symptom_control", "Symptom Control Since Last Visit", [
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
    ...biochemistry(),
    ...icdBlock(
      COMMON_DOMAINS,
      "Search ICD-11 — the condition followed up, its complications and the endocrine comorbidity..."
    ),
    ...safetyBlock(),
  ],

  // --- Diabetes Follow-Up (ADA Standards of Care) --------------------------
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
      N("time_in_range", "Time in Range (%)"),
      N("time_below_range", "Time Below Range (%)"),
      N("glucose_management_indicator", "Glucose Management Indicator (%)"),
      S("glucose_monitoring_method", "Glucose Monitoring Method", [
        "Self-monitoring of blood glucose",
        "Intermittently scanned CGM",
        "Real-time CGM",
        "Professional CGM",
        "None documented",
      ]),
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
      N("uacr", "Urine Albumin-to-Creatinine Ratio (mg/g)"),
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
      S("foot_risk_category", "Foot Risk Category", [
        "Low",
        "Moderate",
        "High",
        "Not assessed",
      ]),
      S("neuropathy_screening", "Peripheral Neuropathy Screening", [
        "Absent",
        "Present",
        "Not assessed",
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
      S("structured_education", "Structured Diabetes Education", [
        "Documented this visit",
        "Previously documented",
        "Not documented",
      ]),
      N("physical_activity_minutes", "Physical Activity (minutes per week)"),
      S("smoking_status_current", "Smoking Status", ["Never", "Former", "Current", "Not documented"]),
      T("therapy_change_documented", "Therapy Change Made at This Visit"),
    ]),
    ...biochemistry(),
    ...icdBlock(
      ["diabetes", "glucose_other", "lipid", "electrolyte", "nutrition", "postprocedural"],
      "Search ICD-11 — diabetes type, ketoacidosis, hyperosmolar state, hypoglycaemia, obesity, lipidaemia..."
    ),
    ...safetyBlock(),
  ],

  // --- Thyroid Follow-Up (ATA) ---------------------------------------------
  endo_thyroid_followup: () => [
    ...sec("Thyroid Biochemistry and Status", [
      N("ft3", "Free T3 (pmol/L)"),
      N("anti_tpo", "Anti-TPO Antibody (IU/mL)"),
      N("trab", "TSH Receptor Antibody (IU/L)"),
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
    ]),
    ...sec("Replacement Therapy", [
      I("levothyroxine_dose_mcg", "Levothyroxine Dose (micrograms per day)"),
      N("levothyroxine_dose_per_kg", "Recorded Dose per kg Body Weight (micrograms/kg)"),
      S("dose_timing_advice", "Dosing Advice Documented", [
        "Documented — separated from calcium and iron",
        "Documented — not separated",
        "Not documented",
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
    ]),
    ...sec("Nodule Assessment", [
      N("nodule_size_mm", "Largest Nodule Size (mm)"),
      S("tirads_category", "Sonographic Risk Category", [
        "TR1 — benign",
        "TR2 — not suspicious",
        "TR3 — mildly suspicious",
        "TR4 — moderately suspicious",
        "TR5 — highly suspicious",
        "Not applicable",
      ]),
      S("nodule_growth", "Growth Since the Previous Examination", [
        "No growth documented",
        "Growth documented",
        "Not comparable",
        "Not applicable",
      ]),
      S("fna_bethesda", "Cytology Category (Bethesda)", [
        "Not performed",
        "I — nondiagnostic",
        "II — benign",
        "III — atypia of undetermined significance",
        "IV — follicular neoplasm",
        "V — suspicious for malignancy",
        "VI — malignant",
      ]),
    ]),
    ...biochemistry(false),
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
    ...biochemistry(),
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
      S("foot_review_interval", "Foot Review Interval", [
        "Every visit",
        "Annually",
        "Not documented",
      ]),
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
      S("self_monitoring_plan", "Self-Monitoring Plan Given", [
        "Documented",
        "Not documented",
      ]),
    ]),
    ...icdBlock(
      COMMON_DOMAINS,
      "Search ICD-11 — every condition this care plan covers..."
    ),
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
      S("hypoglycaemia_risk_after_change", "Hypoglycaemia Risk After the Change", [
        "No increased risk recorded",
        "Increased — education given",
        "Increased — education not documented",
      ]),
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
    ]),
    ...biochemistry(),
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
      T("insulin_regimen_at_discharge", "Insulin Regimen at Discharge"),
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
      ]),
      S("readmission_risk", "Readmission Risk Documented", [
        "Low",
        "Intermediate",
        "High",
        "Not assessed",
      ]),
      T("discharge_self_management", "Self-Management Instructions Given to the Patient"),
    ]),
    ...biochemistry(),
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