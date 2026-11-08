// Respiratory emergencies and critical care — recognition, time-critical
// conditions and ventilatory support.
//
// Three blocks used on the admission and progress notes:
//   pulm_emergency_recognition    — what was recognised, when, the airway /
//     breathing / circulation state, the observations that episode, the immediate
//     actions documented, the course and the disposition with its basis.
//   pulm_time_critical_conditions — the time-critical diagnoses (tension
//     pneumothorax, pneumothorax, pulmonary embolism, massive haemoptysis, severe
//     pneumonia, ARDS, airway compromise, respiratory failure), the basis they were
//     recognised on, the condition-specific management documented, the reassessment
//     and the specialist review.
//   pulm_ventilatory_support      — the support level actually documented, its
//     settings, oxygenation targets, the blood gas on support, lung-protective
//     ventilation, prone positioning, weaning and the ceiling of treatment.
//
// Vocabulary follows the sources registered in pulmonologyReferences.js (ESC for
// pulmonary embolism, ATS/ERS for ARDS and ventilatory support, BTS for pleural
// disease, ATS/IDSA for pneumonia, GOLD and GINA for severe exacerbations).
// Nothing here prescribes: every entry records what the treating team documented.
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
  OXYGEN_SUPPORT,
} from "@/lib/pulmonologyFieldKit";

const EMERGENCY_PRESENTATIONS = [
  "Acute respiratory distress",
  "Severe asthma / near-fatal asthma",
  "COPD exacerbation with respiratory failure",
  "Suspected pneumothorax",
  "Suspected tension pneumothorax",
  "Suspected pulmonary embolism",
  "Massive haemoptysis",
  "Severe pneumonia with sepsis",
  "Acute respiratory distress syndrome",
  "Airway compromise / obstruction",
  "Acute deterioration of another respiratory condition",
  "Other — documented",
  NOT_DOCUMENTED,
];

const IMMEDIATE_ACTIONS = [
  "Oxygen titrated to a documented target",
  "Nebulised bronchodilator given",
  "Systemic corticosteroid given",
  "Intravenous access obtained",
  "Continuous monitoring applied",
  "Airway positioning / suction documented",
  "Needle decompression documented",
  "Intercostal drain inserted documented",
  "Non-invasive ventilation started",
  "Invasive ventilation / intubation documented",
  "Sepsis pathway activated",
  "Senior or critical-care team called",
  "Blood gas taken",
  "Bloods and cross-match requested",
  "None documented",
  NOT_DOCUMENTED,
];

const TIME_CRITICAL_CONDITIONS = [
  "Tension pneumothorax",
  "Pneumothorax",
  "Pulmonary embolism",
  "Massive haemoptysis",
  "Severe pneumonia with sepsis",
  "Acute respiratory distress syndrome",
  "Airway obstruction / compromise",
  "Type 1 respiratory failure",
  "Type 2 respiratory failure",
  "Near-fatal asthma",
  "None documented",
  NOT_DOCUMENTED,
];

const CONDITION_ACTIONS = [
  "Needle decompression documented",
  "Intercostal drain documented",
  "Anticoagulation started",
  "Thrombolysis documented",
  "Protective ventilation documented",
  "Prone positioning documented",
  "Bronchoscopy documented",
  "Airway intervention documented",
  "Sepsis pathway activated",
  "Vasopressor support documented",
  "Surgical or specialist opinion requested",
  "None documented",
  NOT_DOCUMENTED,
];

const VENTILATORY_MODES = [
  "Volume-controlled",
  "Pressure-controlled",
  "Pressure support",
  "Other mode documented",
  NOT_DOCUMENTED,
];

const INVASIVE_SUPPORT = ["NIV — CPAP", "NIV — BiPAP", "Invasive ventilation"];

export const PULM_EMERGENCY_BLOCKS = {
  pulm_emergency_recognition: {
    title: "Respiratory Emergency — Recognition and Immediate Actions",
    fields: [
      S("emergency_presentation", "Emergency Presentation as Recognised", EMERGENCY_PRESENTATIONS),
      I("recognised_time", "Date and Time First Recognised"),
      S("airway", "Airway", [
        "Patent", "At risk — documented", "Obstructed", "Secured — airway device in place", NOT_DOCUMENTED,
      ]),
      S("breathing", "Breathing", [
        "Spontaneous", "Supported — non-invasive ventilation", "Supported — invasive ventilation",
        "Inadequate / apnoeic — documented", NOT_DOCUMENTED,
      ]),
      S("circulation", "Circulation", [
        "Stable", "Tachycardic", "Hypotensive", "Peri-arrest — documented", NOT_DOCUMENTED,
      ]),
      S("consciousness", "Consciousness Level", [
        "Alert", "Responds to voice", "Responds to pain", "Unresponsive", NOT_DOCUMENTED,
      ]),
      N("spo2", "Oxygen Saturation at Recognition (%)"),
      S("oxygen_context", "Saturation Measured", [
        "On room air", "On supplemental oxygen", "On high-flow therapy", "On non-invasive ventilation", NOT_DOCUMENTED,
      ]),
      N("respiratory_rate", "Respiratory Rate at Recognition"),
      N("heart_rate", "Heart Rate at Recognition"),
      N("systolic_bp", "Systolic Blood Pressure at Recognition (mmHg)"),
      S("target_range", "Prescribed Oxygen Target Range", [
        "94–98%", "88–92% (hypercapnia risk)", "Individualised range documented", NOT_DOCUMENTED,
      ]),
      M("immediate_actions", "Immediate Actions Documented", IMMEDIATE_ACTIONS),
      S("senior_help", "Senior or Critical-Care Help", [
        "Called — documented", "Attended — documented", "Considered and not called — documented", NOT_DOCUMENTED,
      ]),
      T("emergency_course", "Emergency Course Documented (sequence, times, response to each intervention)"),
      S("disposition", "Disposition", [
        "Admitted to ward", "Admitted to high-dependency or intensive care", "Transferred to another facility",
        "Discharged from the emergency area with a documented review", "Died — documented", NOT_DOCUMENTED,
      ]),
      T("disposition_basis", "Basis for the Disposition Documented (severity, gas exchange, response, comorbidity, home support)"),
    ],
  },

  pulm_time_critical_conditions: {
    title: "Time-Critical Respiratory Conditions — Recognition and Definitive Management",
    fields: [
      M("conditions", "Condition(s) Documented", TIME_CRITICAL_CONDITIONS),
      T("recognition_basis", "Basis of Recognition Documented (clinical signs, bedside findings, the confirmed result)"),
      M("condition_actions", "Condition-Specific Management Documented", CONDITION_ACTIONS),
      T("condition_detail", "Management Detail as Documented (agent, dose, route, procedure, timing)"),
      S("reassessment", "Reassessment After the Intervention", [
        "Reassessed — improvement documented",
        "Reassessed — no improvement documented",
        "Reassessed — deterioration documented",
        "Not yet reassessed",
        NOT_DOCUMENTED,
      ]),
      T("reassessment_detail", "Reassessment Findings Documented (observations, gas exchange, imaging or report reviewed)"),
      S("specialist_review", "Specialist Review Documented", [
        "Reviewed by respiratory medicine",
        "Reviewed by critical care",
        "Reviewed by cardiothoracic surgery",
        "Reviewed by another specialist — documented",
        "Not documented",
        NOT_DOCUMENTED,
      ]),
      S("definitive_care", "Definitive Care Documented", [
        "Provided in this episode", "Arranged — awaiting", "Transferred for definitive care",
        "Ceiling of treatment agreed — documented", NOT_DOCUMENTED,
      ]),
    ],
  },

  pulm_ventilatory_support: {
    title: "Respiratory Support and Ventilation Documented",
    fields: [
      S("support_level", "Respiratory Support at This Point", OXYGEN_SUPPORT),
      I("device_interface", "Device and Interface Documented (e.g. nasal cannula, HFNC, oronasal mask)"),
      N("fio2", "FiO2 (%)"),
      N("flow_lpm", "Gas Flow (L/min)", WHEN_IN("support_level", [
        "Nasal cannula", "Simple face mask", "Venturi mask", "Reservoir (non-rebreathe) mask", "High-flow nasal oxygen",
      ])),
      S("niv_mode", "Non-Invasive Ventilation Mode Documented", [
        "CPAP", "BiPAP", "Other mode documented", NOT_DOCUMENTED,
      ], WHEN_IN("support_level", ["NIV — CPAP", "NIV — BiPAP"])),
      N("ipap", "IPAP Documented (cmH2O)", WHEN_IN("support_level", ["NIV — BiPAP"])),
      N("epap", "EPAP / PEEP Documented (cmH2O)", WHEN_IN("support_level", ["NIV — CPAP", "NIV — BiPAP"])),
      S("invasive_mode", "Invasive Ventilation Mode Documented", VENTILATORY_MODES, WHEN_IN("support_level", ["Invasive ventilation"])),
      N("tidal_volume_ml", "Tidal Volume Documented (mL)", WHEN_IN("support_level", INVASIVE_SUPPORT)),
      N("peep", "PEEP Documented (cmH2O)", WHEN_IN("support_level", ["Invasive ventilation"])),
      S("lung_protective", "Lung-Protective Ventilation Documented", [
        "Tidal volume and pressure limits documented",
        "Not documented",
        NOT_APPLICABLE,
        NOT_DOCUMENTED,
      ], WHEN_IN("support_level", ["Invasive ventilation"])),
      S("prone_position", "Prone Positioning Documented", [
        "Applied — documented", "Considered and not applied — documented", "Not documented", NOT_DOCUMENTED,
      ], WHEN_IN("support_level", ["Invasive ventilation"])),
      S("oxygen_targets", "Oxygenation Targets Documented", [
        "SpO2 target documented", "PaO2 target documented", "Both documented", "Not documented", NOT_DOCUMENTED,
      ]),
      S("blood_gas_on_support", "Blood Gas on Support", [
        "Performed — values documented", "Performed — report reviewed", "Not performed", NOT_DOCUMENTED,
      ]),
      S("weaning", "Weaning Assessment Documented", [
        "Assessed — weaning started", "Assessed — not ready", "Not yet assessed", NOT_DOCUMENTED,
      ], WHEN_IN("support_level", INVASIVE_SUPPORT)),
      M("complications", "Complications Documented", [
        "Barotrauma", "Ventilator-associated pneumonia", "Pressure injury", "Delirium",
        "Haemodynamic compromise", "None documented", NOT_DOCUMENTED,
      ]),
      T("ceiling_of_treatment", "Ceiling of Treatment and Patient Wishes Documented"),
      S("support_discussed", "Support Decision Discussed with the Patient or Family", YES_NO_DOC),
      T("support_course", "Ventilatory Course Documented (setting changes, response, times)"),
    ],
  },
};