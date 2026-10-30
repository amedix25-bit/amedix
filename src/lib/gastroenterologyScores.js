// Gastroenterology / Hepatology clinical scores and staging instruments.
//
// Every instrument here is published, reproduced with its own variables,
// weighting and interpretation bands, and cited. Three rules are absolute:
//
//  1. NOTHING IS FABRICATED. A score is calculated only from values documented
//     in this note. If a variable is missing, the score is NOT calculated and NOT
//     estimated from a default — the panel says exactly what is missing.
//  2. Every result carries its source and its band, so the number in the record
//     can be audited against the original publication.
//  3. A score supports a decision; it never makes it. No score here withholds or
//     orders treatment, and no band is written into the record as a diagnosis.

const num = (key, label, unit, extra) => ({ key, label, type: "number", unit, ...extra });
const pick = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const opt = (value, points) => ({ value, points });

const isNum = (v) => v !== "" && v !== null && v !== undefined && !Number.isNaN(Number(v));
const isSet = (v) => String(v ?? "").trim() !== "";
const bandFrom = (total, bands) => bands.find((b) => b.max === undefined || total <= b.max) || bands[bands.length - 1];

// ---- 1. Child-Pugh --------------------------------------------------------
const CHILD_PUGH = {
  key: "child_pugh",
  name: "Child-Pugh score",
  purpose: "Severity of cirrhosis and prognosis, recorded as its five components.",
  population: "Adults with cirrhosis. Not validated for acute liver failure.",
  source: {
    organization: "AASLD / EASL practice guidance (original: Pugh et al., 1973)",
    title: "Child-Pugh classification as used in cirrhosis management guidance",
    url: "https://www.aasld.org/",
  },
  variables: [
    pick("bilirubin", "Total bilirubin", [
      opt("Less than 34 µmol/L (less than 2 mg/dL)", 1),
      opt("34–51 µmol/L (2–3 mg/dL)", 2),
      opt("More than 51 µmol/L (more than 3 mg/dL)", 3),
    ]),
    pick("albumin", "Albumin", [opt("More than 35 g/L", 1), opt("28–35 g/L", 2), opt("Less than 28 g/L", 3)]),
    pick("inr", "INR", [opt("Less than 1.7", 1), opt("1.7–2.3", 2), opt("More than 2.3", 3)]),
    pick("ascites", "Ascites", [opt("None", 1), opt("Mild — controlled with diuretics", 2), opt("Moderate to severe or refractory", 3)]),
    pick("encephalopathy", "Hepatic encephalopathy", [opt("None", 1), opt("Grade I–II", 2), opt("Grade III–IV", 3)]),
  ],
  bands: [
    { max: 6, label: "Class A — 5 to 6 points" },
    { max: 9, label: "Class B — 7 to 9 points" },
    { max: 15, label: "Class C — 10 to 15 points" },
  ],
};

// ---- 2. MELD-Na -----------------------------------------------------------
const MELD_NA = {
  key: "meld_na",
  name: "MELD-Na",
  purpose: "Short-term mortality risk in advanced liver disease, and the score used for transplant prioritisation.",
  population: "Adults 12 years and older with chronic liver disease. Not validated in acute liver failure.",
  source: {
    organization: "UNOS / OPTN allocation policy (Kim et al., 2008)",
    title: "MELD-Na as defined for liver allocation",
    url: "https://www.aasld.org/",
  },
  variables: [
    num("bilirubin", "Total bilirubin", "mg/dL", { min: 0, step: "0.1" }),
    num("inr", "INR", "", { min: 0, step: "0.1" }),
    num("creatinine", "Creatinine", "mg/dL", { min: 0, step: "0.01" }),
    pick("dialysis", "Dialysis at least twice in the past week", ["No", "Yes"]),
    num("sodium", "Sodium", "mmol/L", { min: 100, max: 160 }),
  ],
  compute: (v) => {
    const missing = [];
    if (!isNum(v.bilirubin)) missing.push("Total bilirubin");
    if (!isNum(v.inr)) missing.push("INR");
    if (v.dialysis === "Yes") {
      // Creatinine is set to 4.0 mg/dL by the allocation policy when dialysed.
    } else if (!isNum(v.creatinine)) {
      missing.push("Creatinine (or dialysis)");
    }
    if (!isNum(v.sodium)) missing.push("Sodium");
    if (missing.length) return { missing };

    const clampLow = (x) => Math.max(1, Number(x));
    const bili = clampLow(v.bilirubin);
    const inr = clampLow(v.inr);
    const creat = v.dialysis === "Yes" ? 4 : Math.min(4, clampLow(v.creatinine));
    const meld = 3.78 * Math.log(bili) + 11.2 * Math.log(inr) + 9.57 * Math.log(creat) + 6.43;
    const rounded = Math.round(meld);
    const na = Math.min(137, Math.max(125, Number(v.sodium)));
    const delta = 137 - na;
    const meldNa = meld + 1.32 * delta - 0.033 * meld * delta;
    const value = Math.round(Math.max(6, Math.min(40, meldNa)));
    return {
      value,
      detail: `MELD ${rounded} · sodium ${na} mmol/L · creatinine ${v.dialysis === "Yes" ? "set to 4.0 (dialysis)" : `${creat} mg/dL`}`,
      band: value >= 25 ? "High short-term mortality risk — urgent hepatology review" : value >= 15 ? "Intermediate risk" : "Lower risk",
      note: "Version recorded: MELD-Na, the version defined for liver allocation (UNOS/OPTN, 2016). MELD 3.0, which adds sex and albumin, is not calculated here and must not be substituted for this value. Floors of 1.0 apply to bilirubin, INR and creatinine; creatinine is capped at 4.0. Reported score is bounded 6–40 as in the allocation policy.",
    };
  },
  bands: [],
};

// ---- 3. FIB-4 -------------------------------------------------------------
const FIB4 = {
  key: "fib4",
  name: "FIB-4 index",
  purpose: "Non-invasive estimate of advanced fibrosis, used to decide who needs elastography or specialist referral.",
  population: "Adults with steatotic liver disease or chronic viral hepatitis. Age-specific cut-offs apply above 65 years.",
  source: {
    organization: "AASLD practice guidance (Sterling et al., 2006)",
    title: "FIB-4 for non-invasive fibrosis assessment",
    url: "https://www.aasld.org/",
  },
  variables: [
    num("age", "Age", "years", { min: 0, max: 120 }),
    num("ast", "AST", "U/L", { min: 0 }),
    num("alt", "ALT", "U/L", { min: 0 }),
    num("platelets", "Platelet count", "×10⁹/L", { min: 0 }),
  ],
  compute: (v) => {
    const missing = [];
    if (!isNum(v.age)) missing.push("Age");
    if (!isNum(v.ast)) missing.push("AST");
    if (!isNum(v.alt)) missing.push("ALT");
    if (!isNum(v.platelets)) missing.push("Platelet count");
    if (missing.length) return { missing };
    if (Number(v.alt) <= 0 || Number(v.platelets) <= 0) return { missing: ["ALT and platelet count must be greater than zero"] };
    const value = (Number(v.age) * Number(v.ast)) / (Number(v.platelets) * Math.sqrt(Number(v.alt)));
    const rounded = Math.round(value * 100) / 100;
    const older = Number(v.age) > 65;
    const low = older ? 1.3 : 1.3;
    const high = older ? 2.0 : 2.67;
    const band =
      rounded < low
        ? "Low risk of advanced fibrosis — F0–F1 range"
        : rounded > high
          ? "High risk of advanced fibrosis — refer for elastography or hepatology assessment"
          : "Indeterminate — a second non-invasive test is required";
    return {
      value: rounded,
      band,
      note: older ? "Age above 65: the lower threshold of 2.0 is used for the high-risk band." : "",
    };
  },
  bands: [],
};

// ---- 3b. APRI -------------------------------------------------------------
const APRI = {
  key: "apri",
  name: "APRI (AST to Platelet Ratio Index)",
  purpose: "Non-invasive estimate of fibrosis and of cirrhosis where elastography is unavailable.",
  population: "Adults with chronic hepatitis B or C. A normal AST depends on the laboratory's upper limit of normal, so the ULN must be entered.",
  source: {
    organization: "WHO and AASLD non-invasive fibrosis assessment guidance (Wai et al., 2003)",
    title: "APRI for staging fibrosis in chronic viral hepatitis",
    url: "https://www.aasld.org/",
  },
  variables: [
    num("ast", "AST", "U/L", { min: 0 }),
    num("ast_uln", "AST upper limit of normal for the reporting laboratory", "U/L", { min: 1 }),
    num("platelets", "Platelet count", "×10⁹/L", { min: 0 }),
  ],
  compute: (v) => {
    const missing = [];
    if (!isNum(v.ast)) missing.push("AST");
    if (!isNum(v.ast_uln)) missing.push("AST upper limit of normal");
    if (!isNum(v.platelets)) missing.push("Platelet count");
    if (missing.length) return { missing };
    if (Number(v.ast_uln) <= 0 || Number(v.platelets) <= 0) {
      return { missing: ["AST upper limit of normal and platelet count must be greater than zero"] };
    }
    const value = (Number(v.ast) / Number(v.ast_uln) / Number(v.platelets)) * 100;
    const rounded = Math.round(value * 100) / 100;
    return {
      value: rounded,
      band:
        rounded <= 0.5
          ? "Low probability of significant fibrosis — APRI 0.5 or less"
          : rounded >= 1.5
            ? "High probability of significant fibrosis — specialist assessment"
            : "Indeterminate — APRI between 0.5 and 1.5, a second test is required",
      note: "APRI is calculated only from the AST and platelet values documented in this note, using this laboratory's stated upper limit of normal. It is not a substitute for elastography or histology.",
    };
  },
  bands: [],
};

// ---- 4. Partial Mayo ------------------------------------------------------
const PARTIAL_MAYO = {
  key: "partial_mayo",
  name: "Partial Mayo score (ulcerative colitis)",
  purpose: "Clinical activity of ulcerative colitis without the endoscopic subscore.",
  population: "Adults with ulcerative colitis.",
  source: {
    organization: "ACG ulcerative colitis guideline (partial Mayo as used in practice guidance)",
    title: "Partial Mayo scoring",
    url: "https://gi.org/",
  },
  variables: [
    pick("stools", "Stool frequency above the patient's normal", [opt("Normal", 0), opt("1–2 more than normal", 1), opt("3–4 more than normal", 2), opt("5 or more more than normal", 3)]),
    pick("bleeding", "Rectal bleeding", [opt("None", 0), opt("Streaks less than half the time", 1), opt("Obvious blood most of the time", 2), opt("Blood alone passed", 3)]),
    pick("pga", "Physician global assessment", [opt("Normal", 0), opt("Mild", 1), opt("Moderate", 2), opt("Severe", 3)]),
  ],
  bands: [
    { max: 1, label: "Remission (0–1)" },
    { max: 4, label: "Mild activity (2–4)" },
    { max: 6, label: "Moderate activity (5–6)" },
    { max: 9, label: "Severe activity (7–9)" },
  ],
};

// ---- 5. Harvey-Bradshaw Index --------------------------------------------
const HBI = {
  key: "hbi",
  name: "Harvey-Bradshaw Index (Crohn disease)",
  purpose: "Clinical activity of Crohn disease.",
  population: "Adults with Crohn disease.",
  source: {
    organization: "ACG Crohn disease guideline (Harvey & Bradshaw, 1980)",
    title: "Harvey-Bradshaw Index",
    url: "https://gi.org/",
  },
  variables: [
    pick("wellbeing", "General wellbeing", [opt("Very well", 0), opt("Slightly below par", 1), opt("Poor", 2), opt("Very poor", 3), opt("Terrible", 4)]),
    pick("pain", "Abdominal pain", [opt("None", 0), opt("Mild", 1), opt("Moderate", 2), opt("Severe", 3)]),
    num("stools", "Liquid stools per day (one point each)", "per day", { min: 0 }),
    pick("mass", "Abdominal mass", [opt("None", 0), opt("Dubious", 1), opt("Definite", 2), opt("Definite and tender", 3)]),
    num("complications", "Complications present (one point each)", "", { min: 0 }),
  ],
  compute: (v) => {
    const missing = [];
    if (!isSet(v.wellbeing)) missing.push("General wellbeing");
    if (!isSet(v.pain)) missing.push("Abdominal pain");
    if (!isNum(v.stools)) missing.push("Liquid stools per day");
    if (!isSet(v.mass)) missing.push("Abdominal mass");
    if (!isNum(v.complications)) missing.push("Complications");
    if (missing.length) return { missing };
    const selectPoints = (key, chosen) => {
      const variable = HBI.variables.find((x) => x.key === key);
      return (variable?.options || []).find((o) => o.value === chosen)?.points ?? 0;
    };
    const total =
      selectPoints("wellbeing", v.wellbeing) +
      selectPoints("pain", v.pain) +
      selectPoints("mass", v.mass) +
      Number(v.stools) +
      Number(v.complications);
    return {
      value: total,
      band: total < 5 ? "Remission (less than 5)" : total <= 7 ? "Mild activity (5–7)" : total <= 16 ? "Moderate activity (8–16)" : "Severe activity (above 16)",
    };
  },
  bands: [],
};

// ---- 6. Glasgow-Blatchford -------------------------------------------------
const BLATCHFORD = {
  key: "blatchford",
  name: "Glasgow-Blatchford score",
  purpose: "Identifies upper GI bleeding patients who may be managed without endoscopic intervention.",
  population: "Adults with suspected upper GI bleeding. NOT for lower GI bleeding, and not for children.",
  source: {
    organization: "ACG upper GI and ulcer bleeding guideline (Blatchford et al., 2000)",
    title: "Glasgow-Blatchford bleeding score",
    url: "https://gi.org/",
  },
  variables: [
    num("bun", "Blood urea nitrogen", "mg/dL", { min: 0 }),
    num("haemoglobin", "Haemoglobin", "g/L", { min: 0 }),
    pick("sex", "Sex used for the haemoglobin bands", ["Male", "Female"]),
    num("systolic", "Systolic blood pressure", "mmHg", { min: 0, max: 300 }),
    num("heart_rate", "Heart rate", "bpm", { min: 0, max: 300 }),
    pick("melaena", "Melaena", ["No", "Yes"]),
    pick("syncope", "Syncope", ["No", "Yes"]),
    pick("hepatic", "Hepatic disease", ["No", "Yes"]),
    pick("cardiac", "Cardiac failure", ["No", "Yes"]),
  ],
  compute: (v) => {
    const missing = [];
    if (!isNum(v.bun)) missing.push("Blood urea nitrogen");
    if (!isNum(v.haemoglobin)) missing.push("Haemoglobin");
    if (!isSet(v.sex)) missing.push("Sex for the haemoglobin bands");
    if (!isNum(v.systolic)) missing.push("Systolic blood pressure");
    if (!isNum(v.heart_rate)) missing.push("Heart rate");
    if (!isSet(v.melaena) || !isSet(v.syncope) || !isSet(v.hepatic) || !isSet(v.cardiac)) missing.push("Melaena, syncope, hepatic disease and cardiac failure answers");
    if (missing.length) return { missing };

    const bun = Number(v.bun);
    const hb = Number(v.haemoglobin) / 10; // g/L → g/dL
    const sbp = Number(v.systolic);
    const hr = Number(v.heart_rate);

    const bunPoints = bun >= 25 ? 6 : bun >= 10 ? 4 : bun >= 8 ? 3 : bun >= 6.5 ? 2 : 0;
    const hbPoints =
      v.sex === "Male"
        ? hb >= 13 ? 0 : hb >= 12 ? 1 : hb >= 10 ? 3 : 6
        : hb >= 12 ? 0 : hb >= 10 ? 1 : 6;
    const sbpPoints = sbp < 90 ? 3 : sbp < 100 ? 2 : sbp < 110 ? 1 : 0;
    const hrPoints = hr >= 100 ? 1 : 0;
    const other =
      (v.melaena === "Yes" ? 1 : 0) +
      (v.syncope === "Yes" ? 1 : 0) +
      (v.hepatic === "Yes" ? 2 : 0) +
      (v.cardiac === "Yes" ? 2 : 0);

    const total = bunPoints + hbPoints + sbpPoints + hrPoints + other;
    return {
      value: total,
      band: total <= 1 ? "Low risk — outpatient management may be appropriate" : total >= 7 ? "High risk — urgent endoscopic and resuscitative management" : "Not low risk — inpatient assessment",
      note: "Interpretation depends on the local protocol; the score never replaces the clinician's judgement.",
    };
  },
  bands: [],
};

// ---- 7. BISAP -------------------------------------------------------------
const BISAP = {
  key: "bisap",
  name: "BISAP score",
  purpose: "Early severity stratification in acute pancreatitis.",
  population: "Adults with acute pancreatitis, assessed in the first 24 hours.",
  source: {
    organization: "ACG acute pancreatitis guideline (Wu et al., 2008)",
    title: "Bedside Index for Severity in Acute Pancreatitis",
    url: "https://gi.org/",
  },
  variables: [
    pick("bun", "Blood urea nitrogen above 25 mg/dL (8.9 mmol/L)", ["No", "Yes"]),
    pick("mental", "Impaired mental status", ["No", "Yes"]),
    pick("sirs", "Two or more SIRS criteria", ["No", "Yes"]),
    pick("age", "Age above 60 years", ["No", "Yes"]),
    pick("effusion", "Pleural effusion on imaging", ["No", "Yes"]),
  ],
  compute: (v) => {
    const keys = ["bun", "mental", "sirs", "age", "effusion"];
    const missing = keys.filter((k) => !isSet(v[k])).map((k) => BISAP.variables.find((x) => x.key === k).label);
    if (missing.length) return { missing };
    const total = keys.filter((k) => v[k] === "Yes").length;
    return {
      value: total,
      band: total >= 3 ? "Severity above 2 points — higher mortality risk, consider higher-level care" : total === 2 ? "2 points — intermediate risk" : "0–1 points — lower risk",
    };
  },
  bands: [],
};

export const GASTRO_SCORES = [CHILD_PUGH, MELD_NA, FIB4, APRI, PARTIAL_MAYO, HBI, BLATCHFORD, BISAP];

export const gastroScore = (key) => GASTRO_SCORES.find((s) => s.key === key) || null;

const pointsFor = (variable, value) => {
  if (variable.type === "select") {
    const found = (variable.options || []).find((o) => o.value === value);
    return found ? found.points : null;
  }
  if (variable.type === "number") {
    return isNum(value) ? Number(value) : null;
  }
  return null;
};

export const calculateGastroScore = (key, inputs = {}) => {
  const score = gastroScore(key);
  if (!score) return null;
  if (score.compute) return { score, ...score.compute(inputs || {}) };

  const missing = [];
  let total = 0;
  score.variables.forEach((variable) => {
    const points = pointsFor(variable, inputs?.[variable.key]);
    if (points === null) {
      missing.push(variable.label);
      return;
    }
    total += points;
  });
  if (missing.length) return { score, missing };
  return { score, value: total, band: bandFrom(total, score.bands).label };
};

export const calculateGastroScores = (inputs = {}) =>
  GASTRO_SCORES.map((score) => ({ ...calculateGastroScore(score.key, inputs?.[score.key] || {}), key: score.key, name: score.name }));

// Scores worth offering for a note, based on what the note documents.
export const indicatedGastroScores = (inputs = {}) => {
  const out = [];
  const has = (key) => Object.keys(inputs?.[key] || {}).some((k) => isSet(inputs[key][k]));
  if (has("child_pugh")) out.push("child_pugh");
  if (has("meld_na")) out.push("meld_na");
  if (has("fib4")) out.push("fib4");
  if (has("apri")) out.push("apri");
  if (has("partial_mayo")) out.push("partial_mayo");
  if (has("hbi")) out.push("hbi");
  if (has("blatchford")) out.push("blatchford");
  if (has("bisap")) out.push("bisap");
  return out;
};

// Rebuilt at read time from the documented inputs, so the screen, the saved note
// and the PDF can never disagree.
export const formatGastroScores = (value) => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const entries = GASTRO_SCORES.filter((s) => {
    const inputs = v[s.key];
    return inputs && typeof inputs === "object" && Object.keys(inputs).some((k) => isSet(inputs[k]));
  });
  if (!entries.length) return "No score recorded in this note.";

  return entries
    .map((s) => {
      const result = calculateGastroScore(s.key, v[s.key] || {});
      const head = `${s.name}: `;
      if (result?.missing?.length) return `${head}not calculated — missing ${result.missing.join(", ")}.`;
      const detail = result.detail ? ` (${result.detail})` : "";
      const note = result.note ? ` — ${result.note}` : "";
      return `${head}${result.value}${detail} — ${result.band}.${note} Source: ${s.source.organization}. Decision support only.`;
    })
    .join("\n");
};

export const GASTRO_SCORE_COUNT = GASTRO_SCORES.length;