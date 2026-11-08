// Longitudinal respiratory follow-up — trend, treatment response and prevention.
//
// Three blocks used on the follow-up, care-plan and discharge notes:
//   pulm_longitudinal_trend — symptoms, exacerbations, admissions and emergency
//     attendances since the last review, the spirometry trend, the oxygen
//     requirement trend, and the clinician's interpretation of that trend.
//   pulm_longitudinal_care  — response to treatment, adherence, inhaler technique,
//     the device review, any step change with its basis, and the documented
//     self-management and education.
//   pulm_longitudinal_prevention — vaccination status, smoking status and cessation
//     support, pulmonary rehabilitation, long-term oxygen assessment, and the next
//     review with the criteria for earlier review.
//
// Every entry is what was documented at the review. The module never computes a
// change, never compares values itself and never reads a missing trend as stable.
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

const TRAJECTORY = ["Improving", "Stable", "Worsening", "Fluctuating", NOT_DOCUMENTED];

export const PULM_FOLLOWUP_BLOCKS = {
  pulm_longitudinal_trend: {
    title: "Longitudinal Review — Symptoms, Exacerbations and Lung Function Trend",
    fields: [
      S("review_interval", "Interval Since the Last Respiratory Review", [
        "Less than 1 month", "1–3 months", "3–6 months", "6–12 months", "More than 12 months", NOT_DOCUMENTED,
      ]),
      S("symptom_trajectory", "Symptom Trajectory Since the Last Review", TRAJECTORY),
      N("exacerbations_since_review", "Exacerbations Since the Last Review (number)"),
      N("admissions_since_review", "Admissions Since the Last Review (number)"),
      N("emergency_attendances", "Emergency Attendances Since the Last Review (number)"),
      N("icu_admissions", "Intensive-Care Admissions Since the Last Review (number)"),
      S("worst_exacerbation", "Most Severe Exacerbation Since the Last Review", [
        "None documented",
        "Treated in the community",
        "Treated in the emergency area",
        "Needed non-invasive ventilation",
        "Needed invasive ventilation",
        NOT_DOCUMENTED,
      ]),
      S("spirometry_trend", "Spirometry Trend", [
        "Improved since the last measurement",
        "Stable since the last measurement",
        "Declined since the last measurement",
        "Not performed since the last review",
        NOT_DOCUMENTED,
      ]),
      I("fev1_current", "FEV1 at This Review (value and unit as reported)"),
      I("fev1_previous", "Previous FEV1 Recorded (value and unit as reported)"),
      S("fev1_documented_change", "Documented Change in FEV1", [
        "Increased", "Unchanged", "Declined — documented", "Not comparable", NOT_DOCUMENTED,
      ]),
      S("oxygen_requirement_trend", "Oxygen Requirement Trend", [
        "None — room air",
        "New requirement documented",
        "Increased",
        "Reduced",
        "Unchanged",
        "Not documented",
        NOT_DOCUMENTED,
      ]),
      S("trend_compared_against", "Trend Compared Against", [
        "Previous respiratory review",
        "Previous spirometry",
        "Previous admission",
        "No previous record available",
        NOT_DOCUMENTED,
      ]),
      T("trend_interpretation", "Clinician's Interpretation of the Trend Documented"),
    ],
  },

  pulm_longitudinal_care: {
    title: "Longitudinal Review — Treatment Response, Adherence and Self-Management",
    fields: [
      S("treatment_response", "Response to the Current Treatment", [
        "Good — documented", "Partial — documented", "Poor — documented", "Not assessable", NOT_DOCUMENTED,
      ]),
      S("adherence", "Adherence", [
        "Good — documented", "Partial — documented", "Poor — documented", "Not assessed", NOT_DOCUMENTED,
      ]),
      T("adherence_detail", "Adherence Detail Documented (what the patient reported, what was checked)"),
      S("inhaler_technique", "Inhaler Technique", [
        "Checked — correct",
        "Checked — errors corrected",
        "Checked — uncorrected errors documented",
        "Not checked",
        NOT_DOCUMENTED,
      ]),
      T("inhaler_technique_detail", "Inhaler Technique Findings Documented (device, error, correction)"),
      S("device_review", "Device Review", [
        "Device appropriate — documented",
        "Device changed — documented",
        "Device review not documented",
        NOT_DOCUMENTED,
      ]),
      S("therapy_change", "Therapy Change at This Review", [
        "No change",
        "Stepped up — documented",
        "Stepped down — documented",
        "Treatment stopped — documented",
        NOT_DOCUMENTED,
      ]),
      T("therapy_change_basis", "Basis for the Change Documented"),
      S("action_plan", "Written Action Plan", [
        "Issued — documented", "Reviewed — documented", "Not issued", NOT_APPLICABLE, NOT_DOCUMENTED,
      ]),
      T("self_management", "Self-Management Documentation (triggers, what to do when symptoms change, when to seek help)"),
      T("patient_education", "Education Documented at This Review"),
    ],
  },

  pulm_longitudinal_prevention: {
    title: "Longitudinal Review — Vaccination, Smoking Cessation and Rehabilitation",
    fields: [
      M("vaccinations", "Vaccination Status Documented", [
        "Influenza — current",
        "Influenza — due",
        "Pneumococcal — current",
        "Pneumococcal — due",
        "COVID-19 — current",
        "COVID-19 — due",
        "RSV — documented",
        "Pertussis — documented",
        "None documented",
        NOT_DOCUMENTED,
      ]),
      T("vaccination_notes", "Vaccination Notes (what was given, what was declined and why)"),
      S("smoking_status_now", "Smoking Status at This Review", SMOKING_STATUS),
      S("cessation_support", "Smoking Cessation Support Documented", [
        "Provided — documented",
        "Offered — accepted",
        "Offered — declined",
        "Not applicable — non-smoker",
        "Not offered",
        NOT_DOCUMENTED,
      ]),
      T("cessation_detail", "Cessation Support Detail Documented (advice, product, referral, follow-up)"),
      S("pulmonary_rehab", "Pulmonary Rehabilitation", [
        "Completed — documented",
        "Referred — awaiting",
        "Offered — declined",
        "Not indicated — documented",
        "Not documented",
        NOT_DOCUMENTED,
      ]),
      S("oxygen_assessment", "Long-Term Oxygen Assessment", [
        "Assessed — documented",
        "Not indicated — documented",
        "Referred — awaiting",
        "Not assessed",
        NOT_APPLICABLE,
        NOT_DOCUMENTED,
      ]),
      I("next_review_date", "Next Respiratory Review Date"),
      T("review_arrangements", "Review Arrangements Documented (place, with whom, what will be repeated)"),
      T("earlier_review_criteria", "Criteria for Earlier Review Documented"),
    ],
  },
};