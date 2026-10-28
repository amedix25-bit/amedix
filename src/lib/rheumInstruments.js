// Rheumatology disease-activity and functional instruments.
//
// Every instrument here declares its own identity (name, version, intended
// population), the exact inputs it needs and how it is scored. A score is only
// ever produced when EVERY required input is present and inside its valid
// range — nothing is defaulted, imputed or invented, and an instrument is never
// applied outside the population it was validated in.
//
// Two groups exist, and the difference is deliberate:
//  • computed — the published arithmetic is applied here (DAS28, CDAI, SDAI,
//    HAQ-DI, SLEDAI-2K, BASDAI, BASFI, ASDAS, DAPSA, JADAS-27, mRSS, MMT-8).
//  • recorded — instruments whose published score depends on transforms or
//    item weighting that cannot be reproduced safely outside the validated
//    tool (PASDAS with its SF-36 transform, BVAS(v.3) with its weighted item
//    ceilings, FRAX with its country-specific model). The required inputs and
//    the result printed by the validated tool are recorded together, so the
//    score is never fabricated by AMedix; the inputs are still checked and the
//    result is range-validated before it can be saved.
//
// Classification criteria are NOT instruments: no score here diagnoses disease
// or replaces clinical judgement.

export const INSTRUMENT_BANDS = {};

const num = (key, label, min, max, hint = "") => ({ key, label, kind: "number", min, max, hint });
const yn = (key, label) => ({ key, label, kind: "choice", options: ["Yes", "No"] });
const scale = (key, label, max = 10) => ({ key, label, kind: "number", min: 0, max, hint: `0–${max}` });
const recorded = (key, label, min, max, hint = "") => ({ key, label, kind: "number", min, max, hint });

const band = (value, bands) => {
  const found = bands.find((b) => value <= b.max);
  return found ? found.label : bands[bands.length - 1].label;
};

// ---- Health Assessment Questionnaire — Disability Index ------------------
// 20 items in 8 categories, each scored 0–3; a category takes the highest
// score of its answered items and the index is the mean of the categories.
// The published rule allows at most two missing items — beyond that the index
// is not calculable and none is produced.
const HAQ_OPTIONS = [
  "Without any difficulty (0)",
  "With some difficulty (1)",
  "With much difficulty (2)",
  "Unable to do (3)",
];
const HAQ_ITEM_VALUE = { "Without any difficulty (0)": 0, "With some difficulty (1)": 1, "With much difficulty (2)": 2, "Unable to do (3)": 3 };

const HAQ_ITEMS = [
  ["haq_1", "Dress yourself, including tying shoelaces and doing buttons?", "dressing"],
  ["haq_2", "Shampoo your hair?", "dressing"],
  ["haq_3", "Stand up from an armless straight chair?", "arising"],
  ["haq_4", "Get in and out of bed?", "arising"],
  ["haq_5", "Cut your meat?", "eating"],
  ["haq_6", "Lift a full cup or glass to your mouth?", "eating"],
  ["haq_7", "Open a new carton of milk?", "eating"],
  ["haq_8", "Walk outdoors on flat ground?", "walking"],
  ["haq_9", "Climb up five steps?", "walking"],
  ["haq_10", "Wash and dry your entire body?", "hygiene"],
  ["haq_11", "Take a tub bath?", "hygiene"],
  ["haq_12", "Get on and off the toilet?", "hygiene"],
  ["haq_13", "Reach and get down a 5-pound object from above your head?", "reach"],
  ["haq_14", "Bend down to pick up clothing from the floor?", "reach"],
  ["haq_15", "Open car doors?", "grip"],
  ["haq_16", "Open jars which have already been opened?", "grip"],
  ["haq_17", "Turn taps on and off?", "grip"],
  ["haq_18", "Run errands and shop?", "activities"],
  ["haq_19", "Get in and out of a car?", "activities"],
  ["haq_20", "Do chores such as vacuuming or yard work?", "activities"],
];

const haqInputs = HAQ_ITEMS.map(([key, label]) => ({ key, label, kind: "select", options: HAQ_OPTIONS }));

const computeHaq = (v) => {
  const answered = HAQ_ITEMS.filter(([key]) => HAQ_ITEM_VALUE[v[key]] !== undefined);
  if (answered.length < 18) return null;
  const groups = {};
  answered.forEach(([key, , cat]) => {
    const value = HAQ_ITEM_VALUE[v[key]];
    groups[cat] = Math.max(groups[cat] ?? 0, value);
  });
  const cats = Object.values(groups);
  return cats.reduce((a, b) => a + b, 0) / cats.length;
};

// ---- SLEDAI-2K -----------------------------------------------------------
// 24 descriptors. Every descriptor must be answered Yes or No: an unanswered
// descriptor is a missing input, never a zero.
const SLEDAI_DESCRIPTORS = [
  ["sledai_seizure", "Seizure — recent onset, excluding metabolic, infectious or drug causes", 8],
  ["sledai_psychosis", "Psychosis — altered ability to function, excluding uraemia and drugs", 8],
  ["sledai_organic_brain", "Organic brain syndrome — impaired cognition, excluding metabolic causes", 8],
  ["sledai_visual", "Visual disturbance — SLE retinal changes", 8],
  ["sledai_cranial_nerve", "Cranial nerve disorder — new onset", 8],
  ["sledai_headache", "Lupus headache — severe, persistent, non-responsive to narcotics", 8],
  ["sledai_cva", "Cerebrovascular accident — new onset", 8],
  ["sledai_vasculitis", "Vasculitis — ulceration, gangrene, tender finger nodules, digital infarction", 8],
  ["sledai_arthritis", "Arthritis — ≥ 2 joints with pain, swelling or effusion", 4],
  ["sledai_myositis", "Myositis — proximal weakness with raised CK/aldolase or EMG/histology", 4],
  ["sledai_urinary_casts", "Urinary casts — granular or red cell casts", 4],
  ["sledai_haematuria", "Haematuria — > 5 red cells/high-power field", 4],
  ["sledai_proteinuria", "Proteinuria — > 0.5 g/24 hours or ≥ 3+", 4],
  ["sledai_pyuria", "Pyuria — > 5 white cells/high-power field", 4],
  ["sledai_rash", "Rash — new or recurrent inflammatory rash", 2],
  ["sledai_alopecia", "Alopecia — new or recurrent patchy or diffuse loss", 2],
  ["sledai_mucosal_ulcers", "Mucosal ulcers — new or recurrent oral or nasal ulceration", 2],
  ["sledai_pleurisy", "Pleurisy — pleuritic pain, rub, effusion or pleural thickening", 2],
  ["sledai_pericarditis", "Pericarditis — pain, rub, effusion or ECG/pericardial evidence", 2],
  ["sledai_low_complement", "Low complement — CH50, C3 or C4 below the laboratory reference", 2],
  ["sledai_dna_binding", "Increased DNA binding — above the laboratory reference", 2],
  ["sledai_fever", "Fever — > 38 °C, excluding infection", 1],
  ["sledai_thrombocytopenia", "Thrombocytopenia — < 100 × 10⁹/L", 1],
  ["sledai_leukopenia", "Leukopenia — < 3.0 × 10⁹/L", 1],
];

const sledaiInputs = SLEDAI_DESCRIPTORS.map(([key, label, weight]) => ({
  key,
  label: `${label} — ${weight} point${weight === 1 ? "" : "s"}`,
  kind: "choice",
  options: ["Yes", "No"],
}));

const computeSledai = (v) =>
  SLEDAI_DESCRIPTORS.reduce((total, [key, , weight]) => total + (v[key] === "Yes" ? weight : 0), 0);

// ---- Modified Rodnan Skin Score -----------------------------------------
const MRSS_SITES = [
  ["mrss_face", "Face"],
  ["mrss_chest", "Anterior chest"],
  ["mrss_abdomen", "Abdomen"],
  ["mrss_right_arm", "Right upper arm"],
  ["mrss_right_forearm", "Right forearm"],
  ["mrss_right_hand", "Right hand / fingers"],
  ["mrss_left_arm", "Left upper arm"],
  ["mrss_left_forearm", "Left forearm"],
  ["mrss_left_hand", "Left hand / fingers"],
  ["mrss_right_thigh", "Right thigh"],
  ["mrss_right_leg", "Right lower leg"],
  ["mrss_right_foot", "Right foot"],
  ["mrss_left_thigh", "Left thigh"],
  ["mrss_left_leg", "Left lower leg"],
  ["mrss_left_foot", "Left foot"],
];

// ---- Manual Muscle Testing — 8 muscle groups ------------------------------
const MMT_GROUPS = [
  ["mmt_neck_flexors", "Neck flexors"],
  ["mmt_shoulder_abductors", "Shoulder abductors"],
  ["mmt_elbow_flexors", "Elbow flexors"],
  ["mmt_wrist_extensors", "Wrist extensors"],
  ["mmt_hip_extensors", "Hip extensors"],
  ["mmt_hip_abductors", "Hip abductors"],
  ["mmt_knee_extensors", "Knee extensors"],
  ["mmt_ankle_dorsiflexors", "Ankle dorsiflexors"],
];

// ---- BVAS(v.3) organ systems ---------------------------------------------
const BVAS_SYSTEMS = [
  ["bvas_general", "General — constitutional, fever, weight loss"],
  ["bvas_cutaneous", "Cutaneous — purpura, ulcers, infarction, nodules"],
  ["bvas_mucous", "Mucous membranes & eyes"],
  ["bvas_ent", "Ear, nose & throat — sinus, subglottic, hearing"],
  ["bvas_chest", "Chest — respiratory and cardiovascular"],
  ["bvas_abdominal", "Abdominal — gut, hepatic, peritoneal"],
  ["bvas_renal", "Renal — haematuria, proteinuria, creatinine, dialysis"],
  ["bvas_nervous", "Nervous system — CNS and peripheral"],
];

const MUSCULOSKELETAL_INPUTS = [
  num("tjc28", "Tender joint count — 28 joints", 0, 28),
  num("sjc28", "Swollen joint count — 28 joints", 0, 28),
];

const GLOBAL_INPUTS = [
  num("physician_global", "Physician global assessment of disease activity (0–10)", 0, 10),
  num("patient_global", "Patient global assessment of disease activity (0–10)", 0, 10),
];

export const RHEUM_INSTRUMENTS = {
  // ---- Rheumatoid arthritis ---------------------------------------------
  das28_esr: {
    key: "das28_esr",
    name: "DAS28-ESR",
    version: "4-variable DAS28 (Prevoo 1995; EULAR thresholds)",
    population: "Established rheumatoid arthritis — not a diagnostic or classification instrument.",
    summary: "Tender and swollen 28-joint counts, ESR and patient global health.",
    mode: "computed",
    decimals: 2,
    range: "0 – 9.4",
    inputs: [
      ...MUSCULOSKELETAL_INPUTS,
      num("esr", "ESR (mm/hour)", 1, 140),
      num("global_health", "Patient global health — 100 mm visual analogue scale", 0, 100, "0 = best, 100 = worst"),
    ],
    compute: (v) => 0.56 * Math.sqrt(v.tjc28) + 0.28 * Math.sqrt(v.sjc28) + 0.7 * Math.log(v.esr) + 0.014 * v.global_health,
    bands: [
      { max: 2.6, label: "Remission (< 2.6)" },
      { max: 3.2, label: "Low activity (2.6 – 3.2)" },
      { max: 5.1, label: "Moderate activity (> 3.2 – 5.1)" },
      { max: 100, label: "High activity (> 5.1)" },
    ],
  },
  das28_crp: {
    key: "das28_crp",
    name: "DAS28-CRP",
    version: "4-variable DAS28-CRP (EULAR thresholds)",
    population: "Established rheumatoid arthritis — not a diagnostic or classification instrument.",
    summary: "Tender and swollen 28-joint counts, CRP and patient global health.",
    mode: "computed",
    decimals: 2,
    range: "0 – 10",
    inputs: [
      ...MUSCULOSKELETAL_INPUTS,
      num("crp", "CRP (mg/L)", 1, 350),
      num("global_health", "Patient global health — 100 mm visual analogue scale", 0, 100, "0 = best, 100 = worst"),
    ],
    compute: (v) => 0.56 * Math.sqrt(v.tjc28) + 0.28 * Math.sqrt(v.sjc28) + 0.36 * Math.log(v.crp + 1) + 0.014 * v.global_health + 0.96,
    bands: [
      { max: 2.6, label: "Remission (< 2.6)" },
      { max: 3.2, label: "Low activity (2.6 – 3.2)" },
      { max: 5.1, label: "Moderate activity (> 3.2 – 5.1)" },
      { max: 100, label: "High activity (> 5.1)" },
    ],
  },
  cdai: {
    key: "cdai",
    name: "CDAI",
    version: "Clinical Disease Activity Index (Aletaha 2005)",
    population: "Rheumatoid arthritis — laboratory-free composite.",
    summary: "28-joint counts plus physician and patient global assessments.",
    mode: "computed",
    decimals: 2,
    range: "0 – 76",
    inputs: [...MUSCULOSKELETAL_INPUTS, ...GLOBAL_INPUTS],
    compute: (v) => v.tjc28 + v.sjc28 + v.physician_global + v.patient_global,
    bands: [
      { max: 2.8, label: "Remission (≤ 2.8)" },
      { max: 10, label: "Low activity (> 2.8 – 10)" },
      { max: 22, label: "Moderate activity (> 10 – 22)" },
      { max: 1000, label: "High activity (> 22)" },
    ],
  },
  sdai: {
    key: "sdai",
    name: "SDAI",
    version: "Simplified Disease Activity Index (Smolen 2003)",
    population: "Rheumatoid arthritis — CDAI plus CRP.",
    summary: "28-joint counts, global assessments and CRP (mg/dL).",
    mode: "computed",
    decimals: 2,
    range: "0 – 86",
    inputs: [...MUSCULOSKELETAL_INPUTS, ...GLOBAL_INPUTS, num("crp_mg_dl", "CRP (mg/dL)", 0.1, 35, "mg/dL — not mg/L")],
    compute: (v) => v.tjc28 + v.sjc28 + v.physician_global + v.patient_global + v.crp_mg_dl,
    bands: [
      { max: 3.3, label: "Remission (≤ 3.3)" },
      { max: 11, label: "Low activity (> 3.3 – 11)" },
      { max: 26, label: "Moderate activity (> 11 – 26)" },
      { max: 1000, label: "High activity (> 26)" },
    ],
  },
  haq_di: {
    key: "haq_di",
    name: "HAQ-DI",
    version: "Health Assessment Questionnaire — Disability Index, 20-item version",
    population: "Inflammatory arthritis and other rheumatological disease — physical function, not disease activity.",
    summary: "20 function items in 8 categories; at most 2 may be unanswered.",
    mode: "computed",
    decimals: 2,
    range: "0 – 3",
    inputs: haqInputs,
    compute: computeHaq,
    bands: [
      { max: 0.49, label: "No to minimal difficulty (0 – 0.49)" },
      { max: 1, label: "Mild to moderate difficulty (0.5 – 1)" },
      { max: 2, label: "Moderate to severe difficulty (> 1 – 2)" },
      { max: 3, label: "Severe disability (> 2 – 3)" },
    ],
    note: "Aids and devices are not applied to this 20-item index; the category-scored result is recorded as calculated.",
  },

  // ---- Systemic lupus erythematosus --------------------------------------
  sledai_2k: {
    key: "sledai_2k",
    name: "SLEDAI-2K",
    version: "SLEDAI-2K (Gladman 2002) — 24 descriptors, 105-point scale",
    population: "Systemic lupus erythematosus in adults — disease activity over the preceding 30 days; not validated for juvenile SLE.",
    summary: "Every descriptor must be answered; an unanswered descriptor is a missing input, never a zero.",
    mode: "computed",
    decimals: 0,
    range: "0 – 105",
    inputs: sledaiInputs,
    compute: computeSledai,
    bands: [
      { max: 0, label: "No activity (0)" },
      { max: 5, label: "Mild activity (1 – 5)" },
      { max: 10, label: "Moderate activity (6 – 10)" },
      { max: 105, label: "High activity (> 10)" },
    ],
    note: "Descriptors refer to the 30 days before assessment and are scored only when attributable to lupus activity.",
  },

  // ---- Axial and peripheral spondyloarthritis ----------------------------
  asdas_crp: {
    key: "asdas_crp",
    name: "ASDAS-CRP",
    version: "ASDAS with CRP (Lukas 2009; ASAS thresholds)",
    population: "Axial spondyloarthritis — ankylosing spondylitis and non-radiographic axSpA.",
    summary: "Patient-reported items (BASDAI questions 2, 3 and 6), patient global and CRP.",
    mode: "computed",
    decimals: 2,
    range: "0 – 10",
    inputs: [
      num("back_pain", "BASDAI Q2 — neck, back or hip pain (0–10)", 0, 10),
      num("peripheral_pain", "BASDAI Q3 — pain/swelling in other joints (0–10)", 0, 10),
      num("morning_stiffness_duration", "BASDAI Q6 — duration of morning stiffness (0–10; 0 = none, 10 = ≥ 2 hours)", 0, 10),
      num("patient_global", "Patient global assessment (0–10)", 0, 10),
      num("crp", "CRP (mg/L)", 1, 350),
    ],
    compute: (v) =>
      0.121 * v.back_pain + 0.11 * v.morning_stiffness_duration + 0.073 * v.peripheral_pain + 0.058 * v.patient_global + 0.579 * Math.log(v.crp + 1),
    bands: [
      { max: 1.3, label: "Inactive disease (< 1.3)" },
      { max: 2.1, label: "Low activity (1.3 – 2.1)" },
      { max: 3.5, label: "High activity (> 2.1 – 3.5)" },
      { max: 100, label: "Very high activity (> 3.5)" },
    ],
  },
  asdas_esr: {
    key: "asdas_esr",
    name: "ASDAS-ESR",
    version: "ASDAS with ESR (Lukas 2009; ASAS thresholds)",
    population: "Axial spondyloarthritis — use only where CRP is unavailable or uninterpretable.",
    summary: "Patient-reported items (BASDAI questions 2, 3 and 6), patient global and ESR.",
    mode: "computed",
    decimals: 2,
    range: "0 – 10",
    inputs: [
      num("back_pain", "BASDAI Q2 — neck, back or hip pain (0–10)", 0, 10),
      num("peripheral_pain", "BASDAI Q3 — pain/swelling in other joints (0–10)", 0, 10),
      num("morning_stiffness_duration", "BASDAI Q6 — duration of morning stiffness (0–10; 0 = none, 10 = ≥ 2 hours)", 0, 10),
      num("patient_global", "Patient global assessment (0–10)", 0, 10),
      num("esr", "ESR (mm/hour)", 1, 140),
    ],
    compute: (v) =>
      0.121 * v.back_pain + 0.11 * v.morning_stiffness_duration + 0.073 * v.peripheral_pain + 0.058 * v.patient_global + 0.579 * Math.log(v.esr + 1),
    bands: [
      { max: 1.3, label: "Inactive disease (< 1.3)" },
      { max: 2.1, label: "Low activity (1.3 – 2.1)" },
      { max: 3.5, label: "High activity (> 2.1 – 3.5)" },
      { max: 100, label: "Very high activity (> 3.5)" },
    ],
  },
  basdai: {
    key: "basdai",
    name: "BASDAI",
    version: "Bath Ankylosing Spondylitis Disease Activity Index (Garrett 1994)",
    population: "Axial spondyloarthritis — patient-reported disease activity.",
    summary: "Six patient-reported items, each 0–10.",
    mode: "computed",
    decimals: 2,
    range: "0 – 10",
    inputs: [
      num("q1_fatigue", "Q1 — Fatigue / tiredness (0–10)", 0, 10),
      num("q2_spinal_pain", "Q2 — Neck, back or hip pain (0–10)", 0, 10),
      num("q3_peripheral", "Q3 — Pain or swelling in other joints (0–10)", 0, 10),
      num("q4_enthesitis", "Q4 — Discomfort in areas tender to touch (0–10)", 0, 10),
      num("q5_stiffness_severity", "Q5 — Severity of morning stiffness (0–10)", 0, 10),
      num("q6_stiffness_duration", "Q6 — Duration of morning stiffness (0 = none, 10 = ≥ 2 hours)", 0, 10),
    ],
    compute: (v) => (v.q1_fatigue + v.q2_spinal_pain + v.q3_peripheral + v.q4_enthesitis + (v.q5_stiffness_severity + v.q6_stiffness_duration) / 2) / 5,
    bands: [
      { max: 3.99, label: "Below the active-disease threshold (< 4)" },
      { max: 10, label: "Active disease (≥ 4)" },
    ],
  },
  basfi: {
    key: "basfi",
    name: "BASFI",
    version: "Bath Ankylosing Spondylitis Functional Index (Calin 1994)",
    population: "Axial spondyloarthritis — physical function.",
    summary: "Ten function items, each 0–10.",
    mode: "computed",
    decimals: 2,
    range: "0 – 10",
    inputs: [
      num("q1", "Q1 — Putting on socks/tights without help (0–10)", 0, 10),
      num("q2", "Q2 — Bending forward to pick up a pen from the floor (0–10)", 0, 10),
      num("q3", "Q3 — Reaching a high shelf without help (0–10)", 0, 10),
      num("q4", "Q4 — Getting up from an armless chair without using your hands (0–10)", 0, 10),
      num("q5", "Q5 — Getting up from lying on the floor without help (0–10)", 0, 10),
      num("q6", "Q6 — Standing unsupported for 10 minutes without discomfort (0–10)", 0, 10),
      num("q7", "Q7 — Climbing 12–15 steps without using a handrail or walking aid (0–10)", 0, 10),
      num("q8", "Q8 — Looking over your shoulder without turning your body (0–10)", 0, 10),
      num("q9", "Q9 — Doing physically demanding activities (0–10)", 0, 10),
      num("q10", "Q10 — Doing a full day of activities at home or work (0–10)", 0, 10),
    ],
    compute: (v) => Object.values(v).reduce((a, b) => a + b, 0) / 10,
    bands: [
      { max: 3.99, label: "Relatively preserved function (< 4)" },
      { max: 10, label: "Substantial functional limitation (≥ 4)" },
    ],
  },

  // ---- Psoriatic arthritis ------------------------------------------------
  dapsa: {
    key: "dapsa",
    name: "DAPSA",
    version: "Disease Activity in PSoriatic Arthritis (Schoels 2010)",
    population: "Psoriatic arthritis with peripheral arthritis — not for axial-predominant disease.",
    summary: "68/66 joint counts, patient pain, patient global and CRP (mg/dL).",
    mode: "computed",
    decimals: 1,
    range: "0 – 164",
    inputs: [
      num("tjc68", "Tender joint count — 68 joints", 0, 68),
      num("sjc66", "Swollen joint count — 66 joints", 0, 66),
      num("pain", "Patient pain (0–10)", 0, 10),
      num("patient_global", "Patient global assessment (0–10)", 0, 10),
      num("crp_mg_dl", "CRP (mg/dL)", 0.1, 35, "mg/dL — not mg/L"),
    ],
    compute: (v) => v.tjc68 + v.sjc66 + v.pain + v.patient_global + v.crp_mg_dl,
    bands: [
      { max: 4, label: "Remission (≤ 4)" },
      { max: 14, label: "Low activity (> 4 – 14)" },
      { max: 28, label: "Moderate activity (> 14 – 28)" },
      { max: 1000, label: "High activity (> 28)" },
    ],
  },
  pasdas: {
    key: "pasdas",
    name: "PASDAS",
    version: "Psoriatic Arthritis Disease Activity Score (Helliwell 2012)",
    population: "Psoriatic arthritis — full composite including physical function.",
    summary:
      "The published score applies its own transforms to physician and patient global assessments, the 66/68 joint counts, CRP, enthesitis, dactylitis and the SF-36 physical component summary. AMedix does not re-implement those transforms: every input is recorded and the score printed by the validated PASDAS calculator is entered with it.",
    mode: "recorded",
    decimals: 1,
    range: "0 – 10",
    inputs: [
      num("tjc68", "Tender joint count — 68 joints", 0, 68),
      num("sjc66", "Swollen joint count — 66 joints", 0, 66),
      num("physician_global", "Physician global assessment (0–10)", 0, 10),
      num("patient_global", "Patient global assessment (0–10)", 0, 10),
      num("crp", "CRP (mg/L)", 1, 350),
      num("leeds_enthesitis", "Leeds Enthesitis Index — count of tender entheseal sites", 0, 6),
      num("dactylitis_count", "Tender dactylitis count", 0, 20),
      num("sf36_pcs", "SF-36 physical component summary (PCS)", 0, 100),
    ],
    resultInputs: [recorded("score", "PASDAS recorded from the validated calculator (0–10)", 0, 10)],
    bands: [
      { max: 1.9, label: "Low disease activity (≤ 1.9)" },
      { max: 3.2, label: "Moderate disease activity (2.0 – 3.2)" },
      { max: 10, label: "High disease activity (> 3.2)" },
    ],
  },

  // ---- Systemic lupus / vasculitis ---------------------------------------
  bvas_v3: {
    key: "bvas_v3",
    name: "BVAS(v.3)",
    version: "Birmingham Vasculitis Activity Score version 3 — BVAS1 (new/worse) and BVAS2 (persistent)",
    population: "Systemic vasculitis — requires physician assessment of every organ system; not a patient-reported measure.",
    summary:
      "BVAS(v.3) weights each item within nine organ systems and applies a ceiling to each system, so AMedix does not recompute the total. Every organ system is assessed and both the organ involvement and the BVAS1/BVAS2 totals from the validated form are recorded together.",
    mode: "recorded",
    decimals: 0,
    range: "0 – 63",
    inputs: [
      ...BVAS_SYSTEMS.map(([key, label]) => ({ key, label, kind: "select", options: ["Not assessed", "No active item", "Active — new or worse", "Persistent"] })),
      { key: "musculoskeletal", label: "Musculoskeletal — arthritis, myalgia, arthralgia/functional impairment", kind: "select", options: ["Not assessed", "No active item", "Active — new or worse", "Persistent"] },
    ],
    resultInputs: [
      recorded("bvas1", "BVAS1 — new or worse activity (validated form)", 0, 63),
      recorded("bvas2", "BVAS2 — persistent activity (validated form)", 0, 63),
    ],
    bands: [
      { max: 0, label: "No active disease (0)" },
      { max: 63, label: "Active vasculitis (> 0)" },
    ],
    note: "Both totals must come from the completed BVAS(v.3) form; BVAS2 ≥ BVAS1 is rejected as an invalid entry.",
  },

  // ---- Still at the same review ------------------------------------------
  jadas27_esr: {
    key: "jadas27_esr",
    name: "JADAS-27 (ESR)",
    version: "Juvenile Arthritis Disease Activity Score — 27-joint version with ESR",
    population: "Juvenile idiopathic arthritis — 27 joint counts with ESR.",
    summary: "27-joint counts, physician and patient/parent global, ESR divided by 10.",
    mode: "computed",
    decimals: 1,
    range: "0 – 40",
    inputs: [
      num("tjc27", "Tender joint count — 27 joints", 0, 27),
      num("sjc27", "Swollen joint count — 27 joints", 0, 27),
      num("physician_global", "Physician global assessment (0–10)", 0, 10),
      num("patient_global", "Patient / parent global assessment (0–10)", 0, 10),
      num("esr", "ESR (mm/hour)", 1, 140),
    ],
    compute: (v) => v.tjc27 + v.sjc27 + v.physician_global + v.patient_global + v.esr / 10,
    bands: [
      { max: 1, label: "Inactive disease (≤ 1)" },
      { max: 3.8, label: "Low activity (> 1 – 3.8)" },
      { max: 10.5, label: "Moderate activity (> 3.8 – 10.5)" },
      { max: 100, label: "High activity (> 10.5)" },
    ],
  },
  jadas27_crp: {
    key: "jadas27_crp",
    name: "JADAS-27 (CRP)",
    version: "Juvenile Arthritis Disease Activity Score — 27-joint version with CRP",
    population: "Juvenile idiopathic arthritis — 27 joint counts with CRP.",
    summary: "27-joint counts, physician and patient/parent global, CRP (mg/L) divided by 10.",
    mode: "computed",
    decimals: 1,
    range: "0 – 40",
    inputs: [
      num("tjc27", "Tender joint count — 27 joints", 0, 27),
      num("sjc27", "Swollen joint count — 27 joints", 0, 27),
      num("physician_global", "Physician global assessment (0–10)", 0, 10),
      num("patient_global", "Patient / parent global assessment (0–10)", 0, 10),
      num("crp", "CRP (mg/L)", 1, 350),
    ],
    compute: (v) => v.tjc27 + v.sjc27 + v.physician_global + v.patient_global + v.crp / 10,
    bands: [
      { max: 1, label: "Inactive disease (≤ 1)" },
      { max: 3.8, label: "Low activity (> 1 – 3.8)" },
      { max: 10.5, label: "Moderate activity (> 3.8 – 10.5)" },
      { max: 100, label: "High activity (> 10.5)" },
    ],
  },

  // ---- Systemic sclerosis & myositis -------------------------------------
  mrss: {
    key: "mrss",
    name: "mRSS",
    version: "Modified Rodnan Skin Score — 17-site method",
    population: "Systemic sclerosis — skin thickness by palpation at 17 sites, each 0–3.",
    summary: "17 sites scored 0 (normal), 1 (mild), 2 (moderate) or 3 (severe thickening).",
    mode: "computed",
    decimals: 0,
    range: "0 – 51",
    inputs: MRSS_SITES.map(([key, label]) => num(key, label, 0, 3, "0–3")),
    compute: (v) => MRSS_SITES.reduce((total, [key]) => total + v[key], 0),
    bands: [
      { max: 9, label: "Limited skin involvement (0 – 9)" },
      { max: 29, label: "Moderate skin involvement (10 – 29)" },
      { max: 51, label: "Severe skin involvement (> 29)" },
    ],
    note: "Skin score is observer-dependent: record it with the same assessor where possible.",
  },
  mmt8: {
    key: "mmt8",
    name: "MMT-8",
    version: "Manual Muscle Testing of 8 muscle groups (0–10 each)",
    population: "Inflammatory myopathy — proximal and axial strength.",
    summary: "Eight muscle groups graded 0–10; total 0–80 (higher = stronger).",
    mode: "computed",
    decimals: 0,
    range: "0 – 80",
    inputs: MMT_GROUPS.map(([key, label]) => num(key, label, 0, 10, "0–10")),
    compute: (v) => MMT_GROUPS.reduce((total, [key]) => total + v[key], 0),
    bands: [
      { max: 79, label: "Weakness present (< 80)" },
      { max: 80, label: "Full strength (80)" },
    ],
    note: "Higher scores mean stronger muscles — this is a strength measure, not a disease-activity score.",
  },

  // ---- Osteoporosis ------------------------------------------------------
  frax: {
    key: "frax",
    name: "FRAX",
    version: "FRAX 10-year fracture probability — country-specific model",
    population: "Adults aged 40–90 without established osteoporosis treatment — treatment thresholds are national, not universal.",
    summary:
      "FRAX probabilities come from the official country-calibrated FRAX tool. All clinical risk inputs are recorded here and the tool's output, with the model version used, is entered alongside them; AMedix never estimates a FRAX probability.",
    mode: "recorded",
    decimals: 1,
    range: "0 – 100 (%)",
    inputs: [
      num("age", "Age (years, 40–90)", 40, 90),
      { key: "sex", label: "Sex", kind: "select", options: ["Female", "Male"] },
      num("bmi", "Body mass index (kg/m²)", 10, 60),
      { key: "prior_fracture", label: "Previous fragility fracture", kind: "choice", options: ["Yes", "No"] },
      { key: "parent_hip_fracture", label: "Parent fractured hip", kind: "choice", options: ["Yes", "No"] },
      { key: "current_smoking", label: "Current smoking", kind: "choice", options: ["Yes", "No"] },
      { key: "glucocorticoids", label: "Oral glucocorticoids (current, or ≥ 3 months at ≥ 5 mg prednisolone)", kind: "choice", options: ["Yes", "No"] },
      { key: "rheumatoid_arthritis", label: "Rheumatoid arthritis", kind: "choice", options: ["Yes", "No"] },
      { key: "secondary_osteoporosis", label: "Secondary osteoporosis", kind: "choice", options: ["Yes", "No"] },
      { key: "alcohol", label: "Alcohol ≥ 3 units daily", kind: "choice", options: ["Yes", "No"] },
      num("femoral_neck_t_score", "Femoral neck BMD T-score (optional; leave empty when not measured)", -6, 4),
    ],
    resultInputs: [
      recorded("major_osteoporotic", "10-year major osteoporotic fracture probability from the FRAX tool (%)", 0, 100),
      recorded("hip", "10-year hip fracture probability from the FRAX tool (%)", 0, 100),
      { key: "model", label: "FRAX model / version and country calibration used", kind: "text", required: true },
    ],
    bands: [
      { max: 100, label: "Recorded from the validated FRAX tool — interpret against the national intervention threshold" },
    ],
    note: "BMD is optional in FRAX: entering a T-score changes the model output, so the probability must be taken from the tool run that included it.",
  },
};

export const INSTRUMENT_LIST = Object.values(RHEUM_INSTRUMENTS);

export function getInstrument(key) {
  return RHEUM_INSTRUMENTS[key] || null;
}

const isFilled = (input, raw) => {
  if (raw === undefined || raw === null) return false;
  if (input.kind === "number") return String(raw).trim() !== "" && !Number.isNaN(Number(raw));
  return String(raw).trim() !== "";
};

// Scores an instrument from its recorded inputs. Returns the score only when
// every required input is present and valid; otherwise it reports exactly what
// is missing so the clinician can complete the assessment.
export function scoreInstrument(key, values = {}) {
  const instrument = getInstrument(key);
  if (!instrument) return { ok: false, missing: [], invalid: [], error: "Unknown instrument." };

  const allInputs = [...instrument.inputs, ...(instrument.resultInputs || [])];
  const missing = [];
  const invalid = [];

  allInputs.forEach((input) => {
    if (input.kind === "text") {
      if (!isFilled(input, values[input.key])) missing.push(input.label);
      return;
    }
    const raw = values[input.key];
    if (!isFilled(input, raw)) {
      // Optional BMD T-score in FRAX is not required to record a probability.
      if (input.key === "femoral_neck_t_score") return;
      missing.push(input.label);
      return;
    }
    if (input.kind === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < input.min || n > input.max) {
        invalid.push(`${input.label} — must be between ${input.min} and ${input.max}`);
      }
    }
  });

  if (missing.length || invalid.length) return { ok: false, missing, invalid, instrument };

  if (instrument.mode === "recorded") {
    const score = Number(values.score ?? values.major_osteoporotic);
    if (instrument.key === "bvas_v3" && Number(values.bvas2) > Number(values.bvas1)) {
      return { ok: false, missing: [], invalid: ["BVAS2 cannot exceed BVAS1 — check the totals from the validated form"], instrument };
    }
    const max = instrument.key === "frax" ? 100 : instrument.key === "bvas_v3" ? 63 : 10;
    if (!Number.isFinite(score) || score < 0 || score > max) {
      return { ok: false, missing: [], invalid: [`Recorded score must be between 0 and ${max}`], instrument };
    }
  }

  let score;
  if (instrument.mode === "computed") {
    const numeric = {};
    instrument.inputs.forEach((input) => {
      if (input.kind === "number") numeric[input.key] = Number(values[input.key]);
      else numeric[input.key] = values[input.key];
    });
    score = instrument.compute(numeric);
    if (!Number.isFinite(score)) {
      return { ok: false, missing: [], invalid: ["The inputs did not produce a finite score — review the values entered"], instrument };
    }
  } else if (instrument.key === "bvas_v3") {
    score = Number(values.bvas1);
  } else if (instrument.key === "frax") {
    score = Number(values.major_osteoporotic);
  } else {
    score = Number(values.score);
  }

  const rounded = Number(score.toFixed(instrument.decimals));
  const allBands = instrument.bands || [];
  const label = (instrument.key === "frax" ? allBands[0].label : band(rounded, allBands)) || "";
  return { ok: true, score: rounded, band: label, instrument, missing: [], invalid: [] };
}

// A stable, readable line for each recorded score — also the format the note
// view, the PDF export and the longitudinal comparison read back.
export function formatInstrumentEntry(entry = {}) {
  const head = [entry.instrument_name, entry.version ? `(${entry.version})` : ""].filter(Boolean).join(" ");
  const meta = [entry.score ?? "", entry.band || "", entry.scored_datetime ? entry.scored_datetime.slice(0, 10) : ""]
    .filter((p) => p !== "" && p !== undefined && p !== null)
    .join(" · ");
  return `${head} — ${meta}`;
}