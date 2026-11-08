// COPD — dedicated GOLD-based clinical module.
//
// The module documents the three things GOLD asks a COPD record to carry, in the
// order a clinician works through them:
//   1. pulm_copd_diagnosis  — the diagnostic confirmation: symptoms, exposure and
//      POST-bronchodilator spirometry, with the airflow limitation grade.
//   2. pulm_copd_assessment — the symptom burden and exacerbation risk the current
//      A/B/E grouping is derived from, with the eosinophil count, comorbidities,
//      inhaler technique, adherence, vaccination and rehabilitation.
//   3. pulm_copd_treatment  — the structured treatment plan: smoking cessation,
//      LABA, LAMA, LABA/LAMA, ICS when indicated, triple therapy, oxygen and
//      ventilatory assessment, and exacerbation prevention.
//
// INTEGRITY
//   · Every grade, group and treatment entry is documented by the clinician. Where
//     the app also shows a figure it derives from recorded entries (the ratio, the
//     GOLD grade band, the A/B/E group), it is marked `computed`: shown for review,
//     never written back over what the clinician documented.
//   · Nothing here orders, prescribes or calculates a dose. The prescription itself
//     is created in the AMedix medication record, where the allergy, interaction,
//     contraindication and duplicate-therapy checks live; the note records that the
//     prescription was made and the indication behind it.
import {
  T,
  I,
  N,
  S,
  M,
  WHEN_IN,
  NOT_DOCUMENTED,
  NOT_APPLICABLE,
  YES_NO_DOC,
  SMOKING_STATUS,
} from "@/lib/pulmonologyFieldKit";

// GOLD airflow limitation grades, stated as GOLD states them: post-bronchodilator
// FEV1 as a percentage of predicted, in a patient with FEV1/FVC below 0.70.
const AIRFLOW_GRADE = [
  "GOLD 1 — mild (FEV1 ≥ 80% predicted)",
  "GOLD 2 — moderate (FEV1 50–79% predicted)",
  "GOLD 3 — severe (FEV1 30–49% predicted)",
  "GOLD 4 — very severe (FEV1 < 30% predicted)",
  NOT_DOCUMENTED,
];

const MMRC = [
  "0 — Breathless only with strenuous exercise",
  "1 — Short of breath hurrying on level ground or walking up a slight hill",
  "2 — Walks slower than peers, or stops for breath at own pace on level ground",
  "3 — Stops for breath after about 100 metres or a few minutes on level ground",
  "4 — Too breathless to leave the house, or breathless when dressing",
  NOT_DOCUMENTED,
];

const ONGOING_THERAPY = [
  "Started — documented",
  "Continuing — documented",
  "Dose or device changed — documented",
  "Being considered",
  "Not prescribed",
  "Stopped — reason documented",
  NOT_DOCUMENTED,
];

const REVIEW_INTERVAL = [
  "2 weeks",
  "1 month",
  "3 months",
  "6 months",
  "12 months",
  "As needed / open access",
  NOT_DOCUMENTED,
];

const gradeFromPct = (pct) => {
  const n = Number(pct);
  if (!pct || Number.isNaN(n)) return null;
  if (n >= 80) return "GOLD 1 — mild";
  if (n >= 50) return "GOLD 2 — moderate";
  if (n >= 30) return "GOLD 3 — severe";
  return "GOLD 4 — very severe";
};

export const PULM_COPD_BLOCKS = {
  // ---- 1. Diagnostic confirmation ----------------------------------------
  pulm_copd_diagnosis: {
    title: "COPD — Diagnostic Confirmation (GOLD)",
    fields: [
      S("symptoms_documented", "Symptoms Consistent With COPD Documented", [
        "Chronic and progressive breathlessness", "Chronic cough", "Chronic sputum production",
        "Wheeze and chest tightness", "Recurrent lower respiratory tract infections",
        "Several of these documented — detail below", "None documented", NOT_DOCUMENTED,
      ]),
      S("exposure_documented", "Exposure History Documented", [
        "Tobacco smoking documented", "Biomass fuel smoke exposure documented",
        "Occupational dust or fume exposure documented", "More than one exposure documented",
        "No exposure documented", NOT_DOCUMENTED,
      ]),
      S("spirometry_status", "Post-Bronchodilator Spirometry", [
        "Performed at this visit — values documented below",
        "Reported and reviewed — values documented below",
        "Pre-bronchodilator only — post-bronchodilator not performed",
        "Not performed", NOT_DOCUMENTED,
      ]),
      N("fev1_postbd_ml", "Post-Bronchodilator FEV1 (mL)"),
      N("fvc_postbd_ml", "Post-Bronchodilator FVC (mL)"),
      N("fev1_postbd_pct", "Post-Bronchodilator FEV1 (% of Predicted)"),
      N("fev1_fvc_postbd", "Post-Bronchodilator FEV1/FVC as Reported"),
      {
        key: "fev1_fvc_calculated",
        label: "FEV1/FVC — calculated from the two volumes above",
        type: "computed",
        unit: "ratio",
        hint: "FEV1 ÷ FVC. Shown so the reported ratio can be checked; the reported value above is never overwritten by it.",
        compute: (v) => {
          const fev1 = Number(v.fev1_postbd_ml);
          const fvc = Number(v.fvc_postbd_ml);
          if (!fev1 || !fvc) return null;
          return Math.round((fev1 / fvc) * 100) / 100;
        },
      },
      S("lln_reported", "Relation to the Lower Limit of Normal as Reported", [
        "Below the lower limit of normal", "At or above the lower limit of normal",
        "Lower limit of normal not reported", NOT_DOCUMENTED,
      ]),
      S("test_quality", "Reported Test Quality", [
        "Acceptable and reproducible", "Acceptable — not reproducible", "Suboptimal",
        "Quality not reported", NOT_DOCUMENTED,
      ]),
      S("airflow_grade", "GOLD Airflow Limitation Grade as Documented", AIRFLOW_GRADE),
      {
        key: "airflow_grade_calculated",
        label: "GOLD grade — calculated from the documented FEV1 % predicted",
        type: "computed",
        hint: "The grade bands as GOLD states them. Shown for review only: the grade recorded above is the clinician's, and no grade is written into the record by the app.",
        compute: (v) => gradeFromPct(v.fev1_postbd_pct),
      },
      S("post_bd_confirmation", "Post-Bronchodilator Confirmation", [
        "Persistent airflow obstruction confirmed after bronchodilator",
        "Obstruction not confirmed after bronchodilator",
        "Post-bronchodilator value not recorded", NOT_DOCUMENTED,
      ]),
      S("diagnosis", "COPD Diagnosis as Documented", [
        "Confirmed — post-bronchodilator obstruction with compatible symptoms and exposure",
        "Probable — confirmatory spirometry outstanding",
        "Not confirmed — alternative diagnosis documented",
        "Established from a previous record", NOT_DOCUMENTED,
      ]),
      T("alternative_diagnosis", "Alternative or Coexisting Diagnoses Documented (asthma, bronchiectasis, heart failure, tuberculosis, interstitial lung disease)"),
      S("alpha1", "Alpha-1 Antitrypsin Deficiency", [
        "Tested — deficiency documented", "Tested — normal result", "Testing ordered",
        "Not indicated", NOT_DOCUMENTED,
      ]),
    ],
  },

  // ---- 2. Symptom burden, exacerbation risk and ABE group ------------------
  pulm_copd_assessment: {
    title: "COPD — Symptom Burden, Exacerbation Risk and GOLD ABE Group",
    fields: [
      N("cat_total", "CAT Total Score Documented (0–40)"),
      S("cat_impact", "CAT Impact Band as Documented by the Clinician", [
        "Low (< 10)", "Medium (10–19)", "High (20–30)", "Very high (> 30)", NOT_DOCUMENTED,
      ]),
      S("mmrc_grade", "mMRC Grade Documented", MMRC),
      N("moderate_exac_12m", "Moderate Exacerbations in the Last 12 Months (treated with antibiotics or oral corticosteroids, not admitted)"),
      N("severe_exac_12m", "Exacerbations Needing Emergency Attendance or Admission in the Last 12 Months"),
      M("exacerbation_history", "Exacerbation and Hospitalisation History Documented", [
        "No exacerbation in the last 12 months", "Treated at home with antibiotics",
        "Treated at home with oral corticosteroids", "Emergency department attendance",
        "Hospital admission", "Admission with non-invasive ventilation",
        "Admission with invasive ventilation", "Intensive care admission",
        "None documented", NOT_DOCUMENTED,
      ]),
      S("abe_group", "GOLD ABE Group as Documented by the Clinician", [
        "Group A", "Group B", "Group E", NOT_DOCUMENTED,
      ]),
      {
        key: "abe_group_calculated",
        label: "GOLD ABE group — calculated from the entries above",
        type: "computed",
        hint: "E: two or more moderate exacerbations, or one needing emergency attendance or admission. Otherwise A where CAT < 20 and mMRC 0–1, B where CAT ≥ 20 or mMRC ≥ 2. Shown for review; the group recorded above is the clinician's.",
        compute: (v) => {
          const moderate = Number(v.moderate_exac_12m);
          const severe = Number(v.severe_exac_12m);
          const cat = Number(v.cat_total);
          const mmrc = Number(String(v.mmrc_grade || "").trim().charAt(0));
          const hasExac = String(v.moderate_exac_12m ?? "").trim() !== "" || String(v.severe_exac_12m ?? "").trim() !== "";
          const hasSymptom =
            String(v.cat_total ?? "").trim() !== "" || String(v.mmrc_grade ?? "").trim() !== "";
          if (!hasExac && !hasSymptom) return null;
          if (severe >= 1 || moderate >= 2) return "Group E";
          if (!hasSymptom) return null;
          const catHigh = String(v.cat_total ?? "").trim() !== "" && cat >= 20;
          const mmrcHigh = String(v.mmrc_grade ?? "").trim() !== "" && mmrc >= 2;
          return catHigh || mmrcHigh ? "Group B" : "Group A";
        },
      },
      S("abe_basis", "Group Based On", [
        "Documented exacerbation history and CAT or mMRC score",
        "Symptom score only", "Exacerbation history only",
        "Not documented", NOT_APPLICABLE,
      ]),
      N("eosinophils", "Blood Eosinophil Count Documented (cells/µL)"),
      I("eosinophil_date", "Date of the Eosinophil Count"),
      S("eosinophil_band", "Eosinophil Count Read by the Clinician", [
        "Below 100 cells/µL", "100–299 cells/µL", "300 cells/µL or more",
        "Not available", NOT_DOCUMENTED,
      ]),
      S("smoking_status", "Smoking Status", SMOKING_STATUS),
      N("pack_years", "Pack-Years as Documented"),
      M("comorbidities", "Comorbidities Documented at This Visit", [
        "Ischaemic heart disease", "Heart failure", "Atrial fibrillation", "Hypertension",
        "Diabetes", "Chronic kidney disease", "Osteoporosis", "Anxiety or depression",
        "Lung cancer", "Obstructive sleep apnoea", "Gastro-oesophageal reflux",
        "Bronchiectasis", "None documented", NOT_DOCUMENTED,
      ]),
      S("comorbidity_impact", "Comorbidity Effect on the Respiratory Plan Documented", YES_NO_DOC),
      S("inhaler_technique", "Inhaler Technique", [
        "Observed — correct", "Observed — errors seen and corrected",
        "Not observed at this visit", NOT_DOCUMENTED,
      ]),
      S("adherence", "Documented Adherence", ["Good", "Partial", "Poor", "Not assessed", NOT_DOCUMENTED]),
      M("vaccination", "Vaccination Status Documented", [
        "Influenza — up to date", "Influenza — due", "Pneumococcal — up to date",
        "Pneumococcal — due", "COVID-19 — up to date", "COVID-19 — due",
        "Pertussis-containing vaccine for relevant contacts", "Not documented",
      ]),
      S("rehabilitation", "Pulmonary Rehabilitation", [
        "Referred", "Attending — progress documented", "Completed — outcome documented",
        "Offered and declined", "Not indicated", NOT_APPLICABLE, NOT_DOCUMENTED,
      ]),
      T("rehabilitation_detail", "Rehabilitation Outcome or Reason Documented", WHEN_IN("rehabilitation", ["Attending — progress documented", "Completed — outcome documented", "Offered and declined"])),
      S("symptom_trend", "Change Since the Previous Documented Review", [
        "Improved", "Stable", "Worsened — detail documented", "No previous review documented", NOT_DOCUMENTED,
      ]),
    ],
  },

  // ---- 3. Structured treatment planning ----------------------------------
  pulm_copd_treatment: {
    title: "COPD — Structured Treatment Plan and Exacerbation Prevention",
    fields: [
      S("smoking_cessation", "Smoking Cessation Support", [
        "Advised to stop", "Advised and referred to a cessation service",
        "Pharmacotherapy discussed (NRT, varenicline, bupropion)", "Declined",
        "Not applicable — non-smoker", NOT_DOCUMENTED,
      ]),
      T("smoking_cessation_detail", "Cessation Support Documented (pharmacotherapy, referral, quit date, follow-up)", WHEN_IN("smoking_cessation", ["Advised and referred to a cessation service", "Pharmacotherapy discussed (NRT, varenicline, bupropion)"])),
      S("saba", "Short-Acting Bronchodilator (Reliever)", [
        "Prescribed as reliever — documented", "Continuing — documented",
        "Not prescribed", NOT_DOCUMENTED,
      ]),
      S("lama", "Long-Acting Muscarinic Antagonist (LAMA)", ONGOING_THERAPY),
      T("lama_detail", "LAMA Documented (drug, dose, device, frequency)", WHEN_IN("lama", ["Started — documented", "Continuing — documented", "Dose or device changed — documented"])),
      S("laba", "Long-Acting Beta-Agonist (LABA)", ONGOING_THERAPY),
      T("laba_detail", "LABA Documented (drug, dose, device, frequency)", WHEN_IN("laba", ["Started — documented", "Continuing — documented", "Dose or device changed — documented"])),
      S("laba_lama", "LABA/LAMA Combination", ONGOING_THERAPY),
      T("laba_lama_detail", "LABA/LAMA Combination Documented (device, dose, frequency)", WHEN_IN("laba_lama", ["Started — documented", "Continuing — documented", "Dose or device changed — documented"])),
      S("ics", "Inhaled Corticosteroid", [
        "Started — indication documented", "Continuing — indication documented",
        "Considered — indication documented", "Not indicated — reason documented",
        "Stopped — reason documented", NOT_DOCUMENTED,
      ]),
      T("ics_indication", "ICS Indication as Documented (exacerbation history, blood eosinophil count, history of asthma)", WHEN_IN("ics", ["Started — indication documented", "Continuing — indication documented", "Considered — indication documented"])),
      S("triple", "Triple Therapy (LABA/LAMA/ICS)", ONGOING_THERAPY),
      T("triple_basis", "Triple Therapy Basis as Documented (exacerbation history, eosinophil count, symptom burden)", WHEN_IN("triple", ["Started — documented", "Continuing — documented", "Dose or device changed — documented", "Being considered"])),
      S("roflumilast", "Roflumilast Documented", [
        "Not indicated", "Started — documented", "Continuing — documented",
        "Stopped — reason documented", NOT_DOCUMENTED,
      ]),
      S("azithromycin", "Long-Term Azithromycin Documented", [
        "Not indicated", "Started — monitoring documented", "Continuing — monitoring documented",
        "Stopped — reason documented", NOT_DOCUMENTED,
      ]),
      S("azithromycin_monitoring", "Azithromycin Monitoring Documented (hearing, cardiac rhythm, sputum culture, resistance)", YES_NO_DOC, WHEN_IN("azithromycin", ["Started — monitoring documented", "Continuing — monitoring documented"])),
      S("mucolytic", "Mucolytic Documented", [
        "Not indicated", "Prescribed — documented", "Continuing — documented", NOT_DOCUMENTED,
      ]),
      S("oxygen_assessment", "Long-Term Oxygen Assessment", [
        "Criteria documented and met", "Criteria documented and not met",
        "Assessment in progress", "Not indicated", NOT_APPLICABLE, NOT_DOCUMENTED,
      ]),
      T("oxygen_criteria", "Oxygen Criteria and Prescription Documented (saturation, arterial gases, hours per day, device)", WHEN_IN("oxygen_assessment", ["Criteria documented and met", "Assessment in progress"])),
      S("niv_assessment", "Nocturnal Non-Invasive Ventilation Assessment", [
        "Assessed — criteria documented", "Referred for assessment",
        "Established — settings documented", "Not indicated", NOT_APPLICABLE, NOT_DOCUMENTED,
      ]),
      T("niv_detail", "Ventilation Detail Documented (mode, pressures, interface, hours, adherence)", WHEN_IN("niv_assessment", ["Assessed — criteria documented", "Established — settings documented"])),
      T("exacerbation_prevention", "Exacerbation Prevention Plan Documented (action plan, vaccination, rehabilitation, inhaler review, follow-up interval)"),
      S("action_plan", "Written Action Plan", [
        "Given and explained at this visit", "Previously given — reviewed today",
        "Previously given — not reviewed", "Not documented", NOT_APPLICABLE,
      ]),
      S("prescription_recorded", "Respiratory Prescription Recorded in the Medication Record", [
        "Prescription created at this visit", "Existing prescription reviewed — no change",
        "Change made — prescription updated", "No prescription required", NOT_DOCUMENTED,
      ]),
      T("medication_plan", "Medication Plan as Documented (drug, dose, route, frequency, duration, device, instructions, indication)"),
      T("treatment_summary", "Treatment Plan Summary and Review Criteria"),
      S("review_interval", "Documented Review Interval", REVIEW_INTERVAL),
      S("escalation_plan", "Escalation or Admission Criteria Documented", YES_NO_DOC),
    ],
  },
};

export const PULM_COPD_BLOCK_KEYS = Object.keys(PULM_COPD_BLOCKS);