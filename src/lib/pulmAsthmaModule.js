// Asthma — dedicated GINA-based clinical module.
//
// Three blocks, in the order GINA works through an asthma record:
//   1. pulm_asthma_diagnosis — the evidence of VARIABLE respiratory symptoms and of
//      variable airflow limitation: spirometry, bronchodilator responsiveness, peak
//      flow variability, challenge testing.
//   2. pulm_asthma_control   — the four GINA control criteria, night waking, reliever
//      use, activity limitation, exacerbations and oral corticosteroid courses,
//      adherence, technique, and the severity assessment.
//   3. pulm_asthma_treatment — ICS-containing therapy, ICS/formoterol strategies,
//      the step-up and step-down assessment, the written action plan and specialist
//      referral for severe or difficult-to-treat asthma.
//
// INTEGRITY
//   · The control level and the FEV1 change are shown as `computed` from the entries
//     the clinician recorded; neither is written back over the clinician's own
//     documented control category or reported spirometry.
//   · No biologic, dose or step is chosen by the app. Each is recorded as documented.
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
} from "@/lib/pulmonologyFieldKit";

const REVIEW_INTERVAL = [
  "1 month",
  "3 months",
  "6 months",
  "12 months",
  "As needed / open access",
  NOT_DOCUMENTED,
];

const CONTROL_CRITERIA = [
  "Daytime symptoms more than twice a week",
  "Any night waking due to asthma",
  "Reliever needed more than twice a week",
  "Any activity limitation due to asthma",
  "None of the four criteria present",
  NOT_DOCUMENTED,
];

export const PULM_ASTHMA_BLOCKS = {
  // ---- 1. Diagnostic evidence -------------------------------------------
  pulm_asthma_diagnosis: {
    title: "Asthma — Diagnostic Evidence of Variable Airflow Limitation (GINA)",
    fields: [
      M("variable_symptoms", "Variable Respiratory Symptoms Documented", [
        "Wheeze", "Shortness of breath", "Chest tightness", "Cough",
        "Worse at night or on waking", "Triggered by exercise, allergen, cold air or laughter",
        "Vary over time and in intensity", "None documented", NOT_DOCUMENTED,
      ]),
      S("symptom_pattern", "Documented Symptom Pattern", [
        "Episodic with symptom-free intervals", "Persistent with diurnal variation",
        "Seasonal pattern documented", "Exercise-induced only",
        "Continuous from a defined onset", NOT_DOCUMENTED,
      ]),
      S("spirometry", "Spirometry", [
        "Performed — pre- and post-bronchodilator values documented below",
        "Performed — pre-bronchodilator only",
        "Reported and reviewed — values documented below",
        "Not performed", NOT_DOCUMENTED,
      ]),
      N("fev1_pre_pct", "Pre-Bronchodilator FEV1 (% of Predicted)"),
      N("fev1_post_pct", "Post-Bronchodilator FEV1 (% of Predicted)"),
      N("fev1_pre_ml", "Pre-Bronchodilator FEV1 (mL)"),
      N("fev1_post_ml", "Post-Bronchodilator FEV1 (mL)"),
      N("fev1_fvc_pre", "Pre-Bronchodilator FEV1/FVC as Reported"),
      N("fev1_fvc_post", "Post-Bronchodilator FEV1/FVC as Reported"),
      {
        key: "fev1_change_calculated",
        label: "Change in FEV1 — calculated from the two volumes above",
        type: "computed",
        unit: "%",
        hint: "The percentage change GINA uses to describe bronchodilator responsiveness, shown beside the absolute change so both can be read together. Shown for review; the reported values above are never overwritten.",
        compute: (v) => {
          const pre = Number(v.fev1_pre_ml);
          const post = Number(v.fev1_post_ml);
          if (!pre || !post) return null;
          return Math.round(((post - pre) / pre) * 1000) / 10;
        },
      },
      S("reversibility", "Bronchodilator Responsiveness as Documented", [
        "Increase of 12% or more and 200 mL or more in FEV1 documented",
        "Increase documented but below both thresholds",
        "No significant reversibility documented",
        "Not assessed", NOT_DOCUMENTED,
      ]),
      N("reversibility_volume_ml", "Documented Absolute FEV1 Increase (mL)"),
      S("pef_variability", "Peak Expiratory Flow Variability", [
        "Documented — variability recorded below",
        "Diurnal variability documented over two weeks",
        "Assessed — within normal variability",
        "Not assessed", NOT_DOCUMENTED,
      ]),
      N("pef_variability_pct", "Documented PEF Variability (%)"),
      I("pef_best", "Documented Best Peak Flow (L/min)"),
      S("confirmatory_test", "Other Confirmatory Testing Documented", [
        "Positive bronchial challenge documented", "Negative bronchial challenge documented",
        "Fractional exhaled nitric oxide documented", "Allergy testing documented",
        "Not performed", NOT_DOCUMENTED,
      ]),
      S("diagnosis", "Asthma Diagnosis as Documented", [
        "Confirmed — objective evidence of variable airflow limitation documented",
        "Clinical diagnosis — objective confirmation not documented",
        "Probable — confirmatory testing in progress",
        "Established from a previous record", NOT_DOCUMENTED,
      ]),
      T("alternative_diagnosis", "Alternative Diagnoses Documented (COPD, bronchiectasis, heart failure, vocal cord dysfunction, cough syndromes, ILD)"),
    ],
  },

  // ---- 2. Control, risk and severity ------------------------------------
  pulm_asthma_control: {
    title: "Asthma — Symptom Control, Exacerbation Risk and Severity (GINA)",
    fields: [
      M("control_criteria", "GINA Control Criteria Documented in the Last 4 Weeks", CONTROL_CRITERIA),
      {
        key: "control_level_calculated",
        label: "Control level — calculated from the criteria ticked above",
        type: "computed",
        hint: "GINA: none of the four criteria present = well controlled; one or two = partly controlled; three or four = uncontrolled. Shown for review; the control level recorded below is the clinician's.",
        compute: (v) => {
          const selected = Array.isArray(v.control_criteria) ? v.control_criteria : [];
          const present = selected.filter((c) => c !== "None of the four criteria present" && c !== NOT_DOCUMENTED);
          if (!present.length) {
            return selected.includes("None of the four criteria present") ? "Well controlled" : null;
          }
          if (present.length <= 2) return "Partly controlled";
          return "Uncontrolled";
        },
      },
      S("control", "Control Level as Documented by the Clinician", [
        "Well controlled", "Partly controlled", "Uncontrolled", NOT_DOCUMENTED,
      ]),
      N("night_waking_nights", "Nights Woken by Asthma in the Last 4 Weeks"),
      S("reliever_use", "Reliever Use Documented", [
        "Not used", "Less than twice a week", "Twice or more a week but not daily",
        "Daily", "Several times a day", NOT_DOCUMENTED,
      ]),
      S("activity_limitation", "Activity Limitation Documented", [
        "None", "Strenuous activity only", "Moderate activity",
        "Daily activities and self-care", NOT_DOCUMENTED,
      ]),
      N("exac_12m", "Exacerbations in the Last 12 Months"),
      N("ocs_courses_12m", "Oral Corticosteroid Courses in the Last 12 Months"),
      S("severe_exac_history", "Severe Exacerbation History Documented", [
        "None documented", "Emergency attendance documented", "Hospital admission documented",
        "Intensive care admission documented", "Intubated for asthma documented", NOT_DOCUMENTED,
      ]),
      M("risk_factors", "Exacerbation Risk Factors Documented", [
        "One or more exacerbations in the last year", "Ever admitted to intensive care for asthma",
        "Ever intubated for asthma", "Reliever overuse", "Low adherence",
        "Incorrect inhaler technique", "Smoking or smoke exposure", "Obesity",
        "Blood eosinophilia", "Food allergy", "None documented", NOT_DOCUMENTED,
      ]),
      S("adherence", "Documented Adherence", ["Good", "Partial", "Poor", "Not assessed", NOT_DOCUMENTED]),
      T("adherence_reason", "Reasons for Poor or Partial Adherence as Documented (cost, side effects, complexity, belief, forgetfulness)"),
      S("inhaler_technique", "Inhaler Technique", [
        "Observed — correct", "Observed — errors seen and corrected",
        "Not observed at this visit", NOT_DOCUMENTED,
      ]),
      S("severity", "Severity Assessment Documented (GINA)", [
        "Mild — controlled on step 1 or 2 therapy",
        "Moderate — controlled on step 3 therapy",
        "Severe — needs step 4 or 5 therapy to maintain control",
        "Not assessable — control not achieved on the current therapy",
        NOT_DOCUMENTED,
      ]),
      S("difficult_to_treat", "Difficult-to-Treat or Severe Asthma Assessment", [
        "Adherence, technique, comorbidities and diagnosis addressed before any step-up",
        "Referred to specialist care", "Managed as severe asthma — specialist input documented",
        "Not applicable", NOT_DOCUMENTED,
      ]),
      M("treatable_traits", "Treatable Traits Documented", [
        "Blood eosinophilia documented", "Raised exhaled nitric oxide documented",
        "Allergic sensitisation documented", "Raised total IgE documented",
        "Obesity documented", "Rhinosinusitis or nasal polyps documented",
        "Gastro-oesophageal reflux documented", "Anxiety or depression documented",
        "None documented", NOT_DOCUMENTED,
      ]),
      N("eosinophils", "Blood Eosinophil Count Documented (cells/µL)"),
      I("eosinophil_date", "Date of the Eosinophil Count"),
      S("biologic", "Biologic Therapy Documented", [
        "Not applicable", "Being considered — workup documented", "Started — monitoring documented",
        "Continuing — response documented", "Stopped — reason documented", NOT_DOCUMENTED,
      ]),
      T("biologic_monitoring", "Biologic Response Measure, Review Interval and Stopping Rule", WHEN_IN("biologic", ["Started — monitoring documented", "Continuing — response documented", "Stopped — reason documented"])),
      S("control_trend", "Change Since the Previous Documented Review", [
        "Improved", "Stable", "Worsened — detail documented", "No previous review documented", NOT_DOCUMENTED,
      ]),
    ],
  },

  // ---- 3. ICS-containing treatment and step assessment -------------------
  pulm_asthma_treatment: {
    title: "Asthma — ICS-Containing Treatment, Step Assessment and Action Plan",
    fields: [
      S("current_step", "Current Treatment Step (GINA 1–5)", [
        "Step 1", "Step 2", "Step 3", "Step 4", "Step 5", NOT_DOCUMENTED,
      ]),
      S("ics_containing", "ICS-Containing Therapy as Documented", [
        "Inhaled corticosteroid alone — low dose",
        "ICS/formoterol used as needed (anti-inflammatory reliever)",
        "ICS/formoterol maintenance and reliever therapy",
        "ICS/LABA maintenance with a separate reliever",
        "Medium-dose ICS/LABA",
        "High-dose ICS/LABA",
        "Not on ICS-containing therapy — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("reliever_strategy", "Reliever Strategy Documented", [
        "Short-acting beta-agonist only",
        "ICS/formoterol as the reliever (anti-inflammatory reliever)",
        "ICS/formoterol maintenance and reliever therapy",
        "Not documented", NOT_DOCUMENTED,
      ]),
      S("ics_dose_band", "Documented Inhaled Corticosteroid Dose Band", [
        "Low", "Medium", "High", "Not on an inhaled corticosteroid", NOT_DOCUMENTED,
      ]),
      T("current_regimen", "Current Regimen as Documented (drug, dose, device, frequency, technique)"),
      S("step_assessment", "Step-Up or Step-Down Assessment", [
        "Step-up documented — reasons recorded",
        "Step-down documented — reasons recorded",
        "Continued at the current step — reasons recorded",
        "Not documented",
      ]),
      T("step_basis", "Basis for the Step Change Documented (control, exacerbations, adherence, technique, comorbidities)", WHEN_IN("step_assessment", ["Step-up documented — reasons recorded", "Step-down documented — reasons recorded"])),
      M("reviewed_before_stepup", "Reviewed Before Any Step-Up", [
        "Adherence", "Inhaler technique", "Diagnosis confirmed",
        "Comorbidities and triggers", "Alternative diagnoses considered",
        "Not documented", NOT_APPLICABLE,
      ]),
      S("action_plan", "Written Asthma Action Plan", [
        "Given and explained at this visit", "Previously given — reviewed today",
        "Previously given — not reviewed", "Not documented", NOT_APPLICABLE,
      ]),
      T("action_plan_detail", "Action Plan Content Documented (recognition, when to increase treatment, when to seek urgent care)"),
      S("specialist_referral", "Specialist Referral Documented", [
        "Referred — severe or difficult-to-treat asthma",
        "Referred — diagnostic uncertainty",
        "Referred — suspected occupational asthma",
        "Not indicated", "Offered and declined", NOT_DOCUMENTED,
      ]),
      T("referral_detail", "Referral Reason, Urgency and Clinical Question Documented", WHEN_IN("specialist_referral", ["Referred — severe or difficult-to-treat asthma", "Referred — diagnostic uncertainty", "Referred — suspected occupational asthma"])),
      S("prescription_recorded", "Asthma Prescription Recorded in the Medication Record", [
        "Prescription created at this visit", "Existing prescription reviewed — no change",
        "Change made — prescription updated", "No prescription required", NOT_DOCUMENTED,
      ]),
      T("medication_plan", "Medication Plan as Documented (drug, dose, route, frequency, duration, device, instructions, indication)"),
      T("treatment_summary", "Treatment Plan Summary and Review Criteria"),
      S("review_interval", "Documented Review Interval", REVIEW_INTERVAL),
      S("escalation_plan", "Escalation and Safety-Netting Criteria Documented", YES_NO_DOC),
    ],
  },
};

export const PULM_ASTHMA_BLOCK_KEYS = Object.keys(PULM_ASTHMA_BLOCKS);