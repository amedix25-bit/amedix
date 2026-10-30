// KDIGO kidney-function reasoning for the Nephrology note types.
//
// This module does ONE thing: it applies the published KDIGO definitions to the
// values a clinician has actually documented. It never fills a gap, never
// assumes a baseline, and never shows a stage, category or risk figure unless
// every input that definition requires is present and labelled with its own
// date. When the inputs are insufficient the result says so, with the reason.
//
// References (the versions the definitions below follow):
// - KDIGO 2012 Clinical Practice Guideline for Acute Kidney Injury — AKI
//   definition and Stage 1–3 creatinine and urine-output criteria.
// - KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of
//   Chronic Kidney Disease — CKD definition (abnormalities of kidney structure
//   or function present for >3 months), GFR categories G1–G5, albuminuria
//   categories A1–A3 and the G/A risk heat map.
// - Tangri N, et al. JAMA 2016 — 4-variable Kidney Failure Risk Equation.
// - CKD-EPI 2021 creatinine equation (Inker LA, et al. NEJM 2021).
//
// Nothing here orders a test, assigns a diagnosis or decides treatment: every
// output is described as calculated, with its method, population and limits.

const round = (v, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
};

const num = (v) => {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// ---- GFR categories (KDIGO 2024) -------------------------------------------
export const GFR_CATEGORIES = [
  { key: "G1", label: "G1 — normal or high", range: "≥ 90 mL/min/1.73 m²", low: 90, high: null },
  { key: "G2", label: "G2 — mildly decreased", range: "60–89 mL/min/1.73 m²", low: 60, high: 90 },
  { key: "G3a", label: "G3a — mildly to moderately decreased", range: "45–59 mL/min/1.73 m²", low: 45, high: 60 },
  { key: "G3b", label: "G3b — moderately to severely decreased", range: "30–44 mL/min/1.73 m²", low: 30, high: 45 },
  { key: "G4", label: "G4 — severely decreased", range: "15–29 mL/min/1.73 m²", low: 15, high: 30 },
  { key: "G5", label: "G5 — kidney failure", range: "< 15 mL/min/1.73 m²", low: null, high: 15 },
];

export const gfrCategoryFor = (egfr) => {
  const v = num(egfr);
  if (v === null || v <= 0) return null;
  if (v >= 90) return GFR_CATEGORIES[0];
  if (v >= 60) return GFR_CATEGORIES[1];
  if (v >= 45) return GFR_CATEGORIES[2];
  if (v >= 30) return GFR_CATEGORIES[3];
  if (v >= 15) return GFR_CATEGORIES[4];
  return GFR_CATEGORIES[5];
};

// ---- Albuminuria categories (KDIGO 2024, UACR) ------------------------------
// A1 < 3 mg/mmol, A2 3–30 mg/mmol, A3 > 30 mg/mmol (mg/g: < 30, 30–300, > 300).
export const ALBUMINURIA_CATEGORIES = [
  { key: "A1", label: "A1 — normal to mildly increased", range: "< 3 mg/mmol (< 30 mg/g)", low: null, high: 3 },
  { key: "A2", label: "A2 — moderately increased", range: "3–30 mg/mmol (30–300 mg/g)", low: 3, high: 30 },
  { key: "A3", label: "A3 — severely increased", range: "> 30 mg/mmol (> 300 mg/g)", low: 30, high: null },
];

export const MG_G_PER_MG_MMOL = 8.8401;

export const albuminuriaCategoryFor = (uacrMgMmol) => {
  const v = num(uacrMgMmol);
  if (v === null || v < 0) return null;
  if (v < 3) return ALBUMINURIA_CATEGORIES[0];
  if (v <= 30) return ALBUMINURIA_CATEGORIES[1];
  return ALBUMINURIA_CATEGORIES[2];
};

// ---- KDIGO G/A risk heat map ----------------------------------------------
export const RISK_LEVELS = {
  low: "Low risk (no CKD if no other marker of kidney damage)",
  moderately: "Moderately increased risk",
  high: "High risk",
  veryhigh: "Very high risk",
};

export const ckdRiskCategory = (g, a) => {
  if (!g || !a) return null;
  const gi = GFR_CATEGORIES.findIndex((c) => c.key === g);
  const ai = ALBUMINURIA_CATEGORIES.findIndex((c) => c.key === a);
  if (gi < 0 || ai < 0) return null;
  // Columns A1, A2, A3; rows G1 … G5.
  const map = [
    ["low", "moderately", "high"],
    ["low", "moderately", "high"],
    ["moderately", "high", "veryhigh"],
    ["high", "veryhigh", "veryhigh"],
    ["veryhigh", "veryhigh", "veryhigh"],
    ["veryhigh", "veryhigh", "veryhigh"],
  ];
  return { level: map[gi][ai], label: RISK_LEVELS[map[gi][ai]] };
};

// ---- CKD-EPI 2021 creatinine equation --------------------------------------
export const CKD_EPI_2021 = {
  name: "CKD-EPI 2021 creatinine equation",
  population: "Adults ≥ 18 years with a stable serum creatinine (standardised assay).",
  limitations: [
    "Requires a STABLE creatinine — it is not valid during acute kidney injury or rapidly changing kidney function.",
    "Not validated in pregnancy, in children or adolescents under 18, or in extremes of muscle mass (amputation, bodybuilding, cachexia).",
    "Drugs that block tubular creatinine secretion (e.g. trimethoprim, cimetidine, dolutegravir) raise creatinine without a matching fall in GFR.",
    "The reporting laboratory's own eGFR remains the document of record; this figure is a cross-check.",
  ],
};

export const egfrCkdEpi2021 = ({ creatinineUmol, age, sex }) => {
  const scrUmol = num(creatinineUmol);
  const years = num(age);
  if (scrUmol === null || scrUmol <= 0 || years === null || !(sex === "male" || sex === "female")) {
    return { value: null, missing: ["serum creatinine", "age", "sex (for the equation's sex term)"].filter(Boolean) };
  }
  const scr = scrUmol / 88.4;
  const kappa = sex === "female" ? 0.7 : 0.9;
  const alpha = sex === "female" ? -0.241 : -0.302;
  const ratio = scr / kappa;
  const value =
    142 * Math.min(ratio, 1) ** alpha * Math.max(ratio, 1) ** -1.2 * 0.9938 ** years * (sex === "female" ? 1.012 : 1);
  return { value: round(value, 0) };
};

// ---- Chronicity evidence ---------------------------------------------------
// CKD is a diagnosis of STRUCTURE or FUNCTION present for more than three
// months. Each marker below is a documented fact, not an inference, and the
// classification is only offered when at least one is recorded.
export const CHRONICITY_MARKERS = [
  { key: "egfr_3m", label: "eGFR < 60 mL/min/1.73 m² on repeated measurements ≥ 3 months apart" },
  { key: "albuminuria_3m", label: "Albuminuria / proteinuria (UACR > 3 mg/mmol) documented ≥ 3 months apart" },
  { key: "structural", label: "Structural abnormality (imaging, cysts, dysplastic or small kidneys, hydronephrosis)" },
  { key: "histology", label: "Histological abnormality on kidney biopsy" },
  { key: "transplant", label: "Kidney transplant recipient" },
  { key: "duration", label: "Known kidney disease documented for ≥ 3 months (with its source)" },
  { key: "tubular", label: "Persistent tubular disorder or electrolyte abnormality of renal origin" },
];

// ---- CKD classification (CGA) ---------------------------------------------
export const ckdCga = ({ egfr, uacrMgMmol, markers = [], durationDocumented = "", cause = "" }) => {
  const g = gfrCategoryFor(egfr);
  const a = albuminuriaCategoryFor(uacrMgMmol);
  const markersHeld = CHRONICITY_MARKERS.filter((m) => markers.includes(m.key));
  const chronicity = markersHeld.length > 0;
  const reasons = [];

  if (!chronicity) reasons.push("No evidence of chronicity (> 3 months) is documented — CKD cannot be diagnosed or staged on these data.");
  if (!g) reasons.push("A documented eGFR (or a valid creatinine, age and sex for the calculated value) is required for the GFR category.");
  if (!a) reasons.push("A documented UACR is required for the albuminuria category; a normal dipstick does not replace it.");
  if (!cause) reasons.push("The underlying cause of CKD is not documented; the CGA classification includes the cause.");

  const established = chronicity && !!g;
  const risk = established && a ? ckdRiskCategory(g.key, a.key) : null;

  return {
    established,
    cga: established && a && cause ? `${cause} · ${g.key} · ${a.key}` : "",
    cause: cause || "",
    g: g ? { ...g, calculated: true } : null,
    a: a ? { ...a } : null,
    risk,
    chronicityBasis: markersHeld.map((m) => m.label).concat(durationDocumented ? [`Documented duration: ${durationDocumented}`] : []),
    notes: reasons,
  };
};

// ---- Acute kidney injury (KDIGO 2012) --------------------------------------
export const AKI_DEFINITION =
  "AKI is any of: a rise in serum creatinine ≥ 26.5 µmol/L (0.3 mg/dL) within 48 hours; a rise to ≥ 1.5 times baseline, known or presumed to have occurred within the prior 7 days; or urine volume < 0.5 mL/kg/h for 6 hours.";

export const akiStaging = ({
  baselineCreatinineUmol,
  currentCreatinineUmol,
  baselineHours,
  urineOutputMl,
  urineHours,
  weightKg,
  rrtInitiated = false,
}) => {
  const baseline = num(baselineCreatinineUmol);
  const current = num(currentCreatinineUmol);
  const hours = num(baselineHours);
  const criteria = [];
  const caveats = [];
  let stage = 0;

  if (baseline === null || current === null) {
    return {
      stage: null,
      label: "Not classifiable — baseline and current creatinine are both required",
      criteria: [],
      caveats: ["KDIGO staging needs a documented baseline creatinine with its date; it is never assumed from a population average."],
      ratio: null,
      delta: null,
    };
  }

  const ratio = current / baseline;
  const delta = current - baseline;

  if (delta >= 26.5 && (hours === null || hours <= 48)) {
    stage = Math.max(stage, 1);
    criteria.push(`Creatinine rise of ${round(delta, 0)} µmol/L (≥ 26.5 µmol/L) within 48 hours — Stage 1 criterion`);
    if (hours === null) caveats.push("The interval between the two creatinine values is not documented; the 48-hour criterion is accepted on the clinician's timing record.");
  }
  if (hours === null || hours <= 168) {
    if (ratio >= 3) {
      stage = Math.max(stage, 3);
      criteria.push(`Creatinine ${round(ratio, 1)}× baseline (≥ 3.0×) within 7 days — Stage 3 criterion`);
    } else if (ratio >= 2) {
      stage = Math.max(stage, 2);
      criteria.push(`Creatinine ${round(ratio, 1)}× baseline (2.0–2.9×) — Stage 2 criterion`);
    } else if (ratio >= 1.5) {
      stage = Math.max(stage, 1);
      criteria.push(`Creatinine ${round(ratio, 1)}× baseline (1.5–1.9×) — Stage 1 criterion`);
    }
  }
  if (current >= 353.6 && stage > 0) {
    stage = 3;
    criteria.push("Serum creatinine ≥ 353.6 µmol/L (4.0 mg/dL) with a documented acute rise — Stage 3 criterion");
  }
  if (rrtInitiated) {
    stage = 3;
    criteria.push("Kidney replacement therapy initiated — Stage 3 criterion");
  }

  const volume = num(urineOutputMl);
  const uHours = num(urineHours);
  const weight = num(weightKg);
  if (volume !== null && uHours !== null && weight !== null && uHours > 0 && weight > 0) {
    const rate = volume / (uHours * weight);
    if (rate < 0.3 && uHours >= 24) {
      stage = 3;
      criteria.push(`Urine output ${round(rate, 2)} mL/kg/h (< 0.3) for ≥ 24 hours — Stage 3 criterion`);
    } else if (rate === 0 && uHours >= 12) {
      stage = 3;
      criteria.push("Anuria for ≥ 12 hours — Stage 3 criterion");
    } else if (rate < 0.5 && uHours >= 12) {
      stage = Math.max(stage, 2);
      criteria.push(`Urine output ${round(rate, 2)} mL/kg/h (< 0.5) for ≥ 12 hours — Stage 2 criterion`);
    } else if (rate < 0.5 && uHours >= 6) {
      stage = Math.max(stage, 1);
      criteria.push(`Urine output ${round(rate, 2)} mL/kg/h (< 0.5) for 6–12 hours — Stage 1 criterion`);
    }
  } else {
    caveats.push("Urine-output criteria were not applied — volume, duration and body weight must all be documented (and the volume must be a measured catheter or timed collection, not an estimate).");
  }
  if (num(urineOutputMl) !== null && weight === null) caveats.push("Body weight is missing, so urine output could not be indexed per kg.");
  if (stage === 0) caveats.push("The documented values do not meet any KDIGO AKI criterion. This does not exclude AKI if the baseline or timing is uncertain — document the limitation.");

  const labels = ["No KDIGO AKI criterion met", "Stage 1", "Stage 2", "Stage 3"];
  return {
    stage,
    label: labels[stage],
    criteria,
    caveats,
    ratio: round(ratio, 2),
    delta: round(delta, 0),
  };
};

// ---- Syndrome classification: AKI, CKD, AKI on CKD -------------------------
export const classifyKidneySyndrome = ({ akiStage, ckdEstablished, chronicityDocumented }) => {
  if (akiStage === null || akiStage === undefined) {
    return { label: "Not classified", reason: "AKI staging and CKD evidence are both required before a syndrome label is applied." };
  }
  if (akiStage > 0 && ckdEstablished) return { label: "AKI on CKD" };
  if (akiStage > 0) return { label: "AKI" };
  if (ckdEstablished) return { label: "CKD (no acute injury identified on these data)" };
  if (chronicityDocumented) return { label: "Chronic kidney function change — chronicity not yet established" };
  return { label: "Indeterminate — evidence insufficient", reason: "No acute criterion is met and chronicity is not yet documented; repeat creatinine and document the duration before labelling." };
};

// ---- Kidney Failure Risk Equation (4-variable, Tangri 2016) ----------------
export const KFRE_4VAR = {
  name: "Kidney Failure Risk Equation — 4-variable (age, sex, eGFR, UACR)",
  citation: "Tangri N, Grams ME, Levey AS, et al. Multinational assessment of accuracy of equations for predicting risk of kidney failure. JAMA 2016;315(2):164-174.",
  population:
    "Adults with chronic kidney disease (developed and validated predominantly in eGFR < 60 mL/min/1.73 m²), not on dialysis and without a functioning transplant.",
  calibration:
    "Uses the original development-cohort baseline survival. Centres that use a regionally recalibrated KFRE must apply that local calibration — the absolute percentage here is an estimate, not a local probability.",
  limitations: [
    "Not validated in acute kidney injury, during acute illness, in pregnancy, or under 18 years.",
    "Requires a timed urine albumin-to-creatinine ratio; a dipstick result cannot substitute.",
    "Not a transplant or dialysis-list decision on its own — it supports, and never replaces, clinical assessment and shared decision-making.",
    "Garbage in, garbage out: a non-steady-state creatinine or a single unconfirmed UACR makes the output unreliable.",
    "Discrimination falls at very high eGFR and the equation says nothing about the cause of CKD.",
  ],
};

export const kfre4 = ({ age, sex, egfr, uacrMgMmol }) => {
  const years = num(age);
  const gfr = num(egfr);
  const uacr = num(uacrMgMmol);
  const missing = [];
  if (years === null) missing.push("age");
  if (!(sex === "male" || sex === "female")) missing.push("sex");
  if (gfr === null) missing.push("eGFR");
  if (uacr === null) missing.push("UACR");
  if (missing.length) return { risk2y: null, risk5y: null, missing, ...KFRE_4VAR };
  if (uacr <= 0) return { risk2y: null, risk5y: null, missing: ["a UACR greater than zero"], ...KFRE_4VAR };

  const uacrMgG = uacr * MG_G_PER_MG_MMOL;
  const lp =
    -0.2201 * (years / 10 - 7.036) +
    0.2467 * ((sex === "male" ? 1 : 0) - 0.5642) -
    0.5567 * (gfr / 5 - 7.222) +
    0.451 * (Math.log(uacrMgG) - 5.137);
  const risk5y = 1 - 0.924 ** Math.exp(lp);
  const risk2y = 1 - 0.975 ** Math.exp(lp);
  return {
    risk2y: round(risk2y * 100, 1),
    risk5y: round(risk5y * 100, 1),
    uacrMgG: round(uacrMgG, 1),
    linearPredictor: round(lp, 4),
    missing: [],
    ...KFRE_4VAR,
  };
};

// ---- Evidence completeness for a documented classification ----------------
export const classificationGuard = ({ egfr, uacrMgMmol, markers, cause, akiEvidence, steadyState }) => {
  const warnings = [];
  if (!markers || markers.length === 0) warnings.push("CKD staging withheld: chronicity (> 3 months) is not documented.");
  if (num(uacrMgMmol) === null) warnings.push("Albuminuria category withheld: no UACR documented.");
  if (!cause) warnings.push("Cause component withheld: the underlying cause of CKD is not documented.");
  if (akiEvidence) warnings.push("An acute creatinine change is documented: the GFR category is not interpreted as stable CKD until kidney function stabilises.");
  if (steadyState === "no") warnings.push("Creatinine is not at steady state — eGFR-based categories are provisional.");
  return warnings;
};