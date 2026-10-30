// Shared field builders, option constants and reusable clinical blocks for the
// Anesthesiology & Perioperative Medicine document catalogue.
//
// Kept in one place so every note type builds its fields the same way and so
// the note definitions themselves stay readable.

import { ANESTHESIA_ICD11 } from "./anesthesiaIcd11.js";

export const I = (key, label, x = {}) => ({ key, label, type: "input", ...x });
export const N = (key, label, x = {}) => ({ key, label, type: "number", ...x });
export const T = (key, label, x = {}) => ({ key, label, type: "textarea", ...x });
export const S = (key, label, options, x = {}) => ({ key, label, type: "select", options, ...x });
export const VIT = (key = "vitals", label = "Vital Signs", x = {}) => ({ key, label, type: "vitals", ...x });

export const R = { required: true };
export const when = (key, ...values) => ({ showIf: { key, in: values } });
export const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

export const ICD = (key, label, x = {}) => ({
  key,
  label,
  type: "icd11_diagnoses",
  catalog: ANESTHESIA_ICD11,
  searchPlaceholder:
    "Search ICD-11 — hypertension, ischaemic heart disease, COPD, asthma, diabetes, chronic kidney disease, obesity...",
  ...x,
});

export const YES_NO = ["Yes", "No"];
export const YES_NO_UNK = ["Yes", "No", "Unknown"];
export const NOT_DOCUMENTED = "Not documented";

export const ASA_CLASSES = [
  "ASA I",
  "ASA II",
  "ASA III",
  "ASA IV",
  "ASA V",
  "ASA VI",
  "Not yet assigned",
];
export const ASA_EMERGENCY = [
  "Elective — no E modifier",
  "Emergency — E modifier applies",
  "Not documented",
];

export const TECHNIQUES = [
  "General anesthesia",
  "Neuraxial — spinal",
  "Neuraxial — epidural",
  "Neuraxial — combined spinal-epidural",
  "Peripheral nerve block",
  "Intravenous regional anesthesia",
  "Local infiltration",
  "Monitored anesthesia care",
  "Moderate procedural sedation",
  "Deep sedation",
  "Combined general + regional",
];

export const AIRWAY_DEVICES = [
  "Face mask",
  "Supraglottic airway (LMA)",
  "Endotracheal tube — direct laryngoscopy",
  "Endotracheal tube — video laryngoscopy",
  "Endotracheal tube — awake fibreoptic",
  "Tracheostomy",
  "Spontaneous breathing — no device",
  "Not applicable — regional only",
];

export const FASTING_RECORDED = ["Interval met", "Interval not met", "Not applicable", NOT_DOCUMENTED];

export const NORMAL_ABNORMAL = ["No abnormality identified", "Abnormal — documented below", "Not assessed"];

// ---------------------------------------------------------------------------
// Shared blocks
// ---------------------------------------------------------------------------

export const asaStatusFields = () => [
  S("asa_class", "ASA Physical Status Class", ASA_CLASSES),
  S("asa_emergency", "Emergency Modifier", ASA_EMERGENCY),
  T(
    "asa_class_basis",
    "Basis for the Assigned Class — the systemic disease and the functional limitation it causes"
  ),
  S("asa_class_reviewed_with", "Class Discussed With", [
    "Operating surgeon",
    "Operating surgeon and ward team",
    "Not discussed",
  ]),
];

export const fastingFields = () => [
  S("fasting_status", "Fasting Status at Presentation", [
    "Adequate — all applicable intervals met",
    "Not adequate — see recorded intervals",
    "Not fasted",
    NOT_DOCUMENTED,
  ]),
  S("fasting_clear_liquids", "Clear Liquids Withheld", FASTING_RECORDED),
  S("fasting_breast_milk", "Breast Milk Withheld", FASTING_RECORDED),
  S("fasting_formula_meal", "Infant Formula / Non-human Milk / Light Meal Withheld", FASTING_RECORDED),
  S("fasting_fatty_meal", "Fried Food, Fatty Meal or Meat Withheld", FASTING_RECORDED),
  S("chewing_gum", "Chewing Gum Within the Fasting Period", [
    "No",
    "Yes — procedure not delayed (ASA February 2023 guidance)",
    "Yes — procedure delayed",
    NOT_DOCUMENTED,
  ]),
  T("aspiration_risk_factors", "Aspiration Risk Factors — reflux, gastroparesis, bowel obstruction, pregnancy, obesity, emergency"),
  T("aspiration_prophylaxis", "Aspiration Prophylaxis Considered — non-particulate antacid, H2 blocker, prokinetic, rapid sequence induction"),
];

export const airwayAssessmentFields = () => [
  S("mallampati", "Modified Mallampati Class", ["I", "II", "III", "IV", "Not assessed"]),
  T("mouth_opening", "Mouth Opening / Inter-incisor Gap"),
  T("thyromental_distance", "Thyromental Distance"),
  T("neck_movement", "Neck Movement / Extension — and any cervical spine precautions"),
  T("dental_status", "Dentition — mobile teeth, crowns, dentures, previous dental injury"),
  S("predicted_difficulty", "Predicted Difficult Airway", [
    "No — no predictors identified",
    "Possibly — predictors present, strategy documented",
    "Yes — anticipated difficulty, strategy documented",
    "Unable to assess",
  ]),
];

export const monitoringComplianceFields = () => [
  S("oxygen_analyzer", "Inspired Oxygen Analyzer With Low-limit Alarm (general anesthesia, machine circuit)", [
    "In use",
    "Not applicable",
    "Waived — reason documented",
  ]),
  S("pulse_oximetry", "Pulse Oximetry — quantitative, continual, audible variable-pitch tone and low threshold alarm", [
    "In use throughout",
    "Waived — reason documented",
  ]),
  S("capnography", "End-tidal Carbon Dioxide — quantitative, from airway placement until removal or transfer", [
    "In use throughout",
    "Not applicable — regional or local anesthesia with minimal sedation",
    "Waived — reason documented",
  ]),
  S("ventilator_disconnect_alarm", "Breathing-system Disconnect Alarm During Mechanical Ventilation", [
    "Active",
    "Not applicable",
    "Waived — reason documented",
  ]),
  S("ecg", "Electrocardiogram — continuously displayed from start of anesthesia to leaving the anesthetizing location", [
    "Continuous",
    "Waived — reason documented",
  ]),
  S("blood_pressure_interval", "Arterial Blood Pressure and Heart Rate Interval", [
    "At least every 5 minutes",
    "More frequently than every 5 minutes",
    "Interval exceeded — reason documented",
  ]),
  S("temperature_monitoring", "Temperature Monitored", [
    "Yes — measured",
    "Not indicated",
    "Expected but not measured — reason documented",
  ]),
  S("circulatory_continuous", "Additional Continual Circulatory Assessment (general anesthesia)", [
    "Pulse plethysmography",
    "Invasive arterial trace",
    "Auscultation of heart sounds",
    "Palpation of a pulse",
    "Not applicable",
  ]),
];