// Acute asthma and acute COPD exacerbation — severity, physiological assessment,
// treatment response and escalation.
//
// Two blocks used together on the admission and progress notes:
//   pulm_acute_assessment — severity classification, the acute physiological markers
//     (respiratory rate, saturation context, peak flow, speech, mental status), the
//     arterial blood gas where it was taken, the admission criteria and the
//     non-invasive ventilation / critical-care assessment.
//   pulm_acute_response   — the treatment documented at the episode, the response to
//     it, the monitoring plan, the deterioration alerts and the escalation plan.
//
// The note's own vital-signs block remains the primary record of the observations;
// this module records the severity reading of them and everything severity-specific
// that a vital-signs block cannot hold. Nothing here prescribes, and no severity band
// or admission decision is decided by the app: each is recorded as documented.
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

const SEVERITY = ["Mild", "Moderate", "Severe", "Life-threatening", NOT_DOCUMENTED];

const ACUTE_THERAPY = [
  "Nebulised short-acting beta-agonist", "Nebulised ipratropium bromide",
  "Systemic corticosteroid", "Antibiotic", "Magnesium sulfate",
  "Oxygen titrated to the target range", "Non-invasive ventilation",
  "Intravenous bronchodilator", "Intravenous fluid", "None documented", NOT_DOCUMENTED,
];

export const PULM_ACUTE_BLOCKS = {
  pulm_acute_assessment: {
    title: "Acute Exacerbation — Severity and Physiological Assessment",
    fields: [
      S("presentation", "Acute Presentation", [
        "Acute asthma", "Acute COPD exacerbation",
        "Acute asthma with COPD (asthma–COPD overlap)",
        "Acute deterioration of another respiratory condition", NOT_DOCUMENTED,
      ]),
      S("severity", "Severity as Documented", SEVERITY),
      S("severity_criteria", "Severity Criteria Documented", [
        "Criteria written in the note", "Criteria recorded on the emergency record",
        "Clinical impression only — criteria not recorded", "Not documented",
      ]),
      S("vitals_reference", "Where This Episode's Vital Signs Are Recorded", [
        "Vital-signs block of this note", "Emergency department record",
        "Nursing observation chart", NOT_DOCUMENTED,
      ]),
      N("respiratory_rate", "Respiratory Rate Documented for This Episode"),
      N("heart_rate", "Heart Rate Documented for This Episode"),
      N("spo2", "Oxygen Saturation Documented for This Episode"),
      S("oxygen_context", "Saturation Measured", [
        "On room air", "On supplemental oxygen", "On high-flow therapy", "On non-invasive ventilation", NOT_DOCUMENTED,
      ]),
      S("target_range", "Prescribed Oxygen Target Range", [
        "94–98%", "88–92% (hypercapnia risk)", "Individualised range documented", NOT_DOCUMENTED,
      ]),
      N("pef", "Peak Expiratory Flow Documented (L/min)"),
      N("pef_best_pct", "PEF as % of Predicted or Best Recorded"),
      S("speech", "Ability to Speak", [
        "Full sentences", "Phrases only", "Single words only", "Unable to speak", NOT_DOCUMENTED,
      ]),
      S("mental_status", "Mental Status", [
        "Alert and orientated", "Agitated", "Confused or drowsy", "Reduced consciousness", NOT_DOCUMENTED,
      ]),
      S("distress", "Respiratory Distress", [
        "No distress at rest", "Mild increased work of breathing", "Moderate increased work of breathing",
        "Severe distress — unable to complete sentences", "Exhaustion documented", NOT_DOCUMENTED,
      ]),
      M("acute_findings", "Key Acute Findings Documented", [
        "Silent chest", "Widespread wheeze", "Pulsus paradoxus", "Central cyanosis",
        "Accessory muscle use", "Tripod positioning", "Chest tightness on exertion",
        "None documented", NOT_DOCUMENTED,
      ]),
      S("abg", "Arterial Blood Gas", [
        "Performed — values documented below", "Performed — report reviewed",
        "Indicated — not yet performed", "Not indicated", NOT_DOCUMENTED,
      ]),
      N("ph", "pH"),
      N("pao2", "PaO2 (kPa)"),
      N("paco2", "PaCO2 (kPa)"),
      N("hco3", "Bicarbonate (mmol/L)"),
      N("lactate", "Lactate (mmol/L)"),
      S("gas_interpretation", "Acid–Base and Oxygenation Interpretation as Documented", [
        "Normal gas exchange", "Type 1 respiratory failure (hypoxaemia)",
        "Type 2 respiratory failure (hypercapnia)", "Respiratory acidosis",
        "Compensated respiratory acidosis", "Metabolic acidosis — detail documented",
        NOT_DOCUMENTED,
      ], WHEN_IN("abg", ["Performed — values documented below", "Performed — report reviewed"])),
      S("admission_criteria", "Admission Criteria Assessment", [
        "Criteria documented — admission indicated",
        "Criteria documented — discharge or ambulatory care considered",
        "Criteria not documented", NOT_DOCUMENTED,
      ]),
      T("admission_basis", "Basis for Admission or Discharge Documented (severity, gas exchange, response, home support, comorbidity)"),
      S("niv_assessment", "Non-Invasive Ventilation Assessment", [
        "Assessed — NIV indicated and started", "Assessed — NIV considered and not indicated",
        "Assessed — escalated to invasive ventilation", "Not assessed", NOT_DOCUMENTED,
      ]),
      T("niv_detail", "NIV Detail Documented (mode, pressures, interface, tolerance, response)", WHEN_IN("niv_assessment", ["Assessed — NIV indicated and started"])),
      S("critical_care", "Critical Care Escalation", [
        "Discussed with critical care", "Referred to intensive care",
        "Escalation considered not appropriate — documented", "Not documented", NOT_DOCUMENTED,
      ]),
      T("critical_care_basis", "Critical Care Discussion Documented (indication, ceiling of treatment, patient wishes)", WHEN_IN("critical_care", ["Discussed with critical care", "Referred to intensive care"])),
    ],
  },

  pulm_acute_response: {
    title: "Acute Exacerbation — Treatment and Response to Treatment",
    fields: [
      M("treatment_given", "Treatment Documented at This Episode", ACUTE_THERAPY),
      T("treatment_detail", "Treatment Detail as Documented (drug, dose, route, frequency, duration, device)"),
      S("prescription_recorded", "Treatment Prescription Recorded in the Medication Record", [
        "Prescription created", "Existing prescription continued", "No prescription required", NOT_DOCUMENTED,
      ]),
      T("trigger", "Precipitating Cause or Trigger Documented (infection, adherence, exposure, comorbidity)"),
      S("response", "Response to Treatment", [
        "Good response — documented", "Partial response — documented",
        "Poor response — escalation documented", "Not yet assessed", NOT_DOCUMENTED,
      ]),
      T("response_detail", "Response Documented (symptoms, peak flow, saturation, respiratory rate, blood gas)"),
      S("monitoring", "Monitoring Documented", [
        "Continuous oximetry", "Repeat blood gas planned", "Repeat peak flow documented",
        "Cardiac monitoring", "Repeat observations documented", "Not documented",
      ]),
      S("deterioration_alerts", "Deterioration Alerts and Escalation Triggers Documented", YES_NO_DOC),
      T("escalation_plan", "Escalation Plan Documented (who to call, thresholds, ceiling of treatment)"),
      S("review_interval", "Documented Review Interval", [
        "Within 1 hour", "Within 4 hours", "Within 24 hours", "At 48–72 hours",
        "4–6 weeks after discharge", NOT_DOCUMENTED,
      ]),
      S("followup_arranged", "Follow-Up Arranged", [
        "Respiratory clinic appointment — documented", "Primary care follow-up — documented",
        "Pulmonary rehabilitation referral", "Not yet arranged", NOT_APPLICABLE, NOT_DOCUMENTED,
      ]),
      T("discharge_plan", "Discharge Plan Documented (medication, action plan, inhaler technique, follow-up)"),
      I("followup_date", "Documented Follow-Up Date"),
    ],
  },
};

export const PULM_ACUTE_BLOCK_KEYS = Object.keys(PULM_ACUTE_BLOCKS);