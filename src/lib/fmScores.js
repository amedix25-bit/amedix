// Family Medicine — guideline-based calculations.
//
// Every score is computed ONLY from values documented in the note. A missing item
// leaves the score uncalculated and names exactly what is missing: nothing is
// estimated, defaulted or inferred, and a blank is never read as a normal finding.
//
// The item wording and weights belong to the published instrument named beside each
// score. Only the score and its published interpretation bands are produced — no
// probability, prognosis or treatment recommendation is invented, and a score is a
// documented observation, never a diagnosis.

import { asObject, num, isBlank } from "@/lib/fmFieldKit";

const FREQ = [
  { value: "0", label: "Not at all (0)" },
  { value: "1", label: "Several days (1)" },
  { value: "2", label: "More than half the days (2)" },
  { value: "3", label: "Nearly every day (3)" },
];

const YN_YN = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const SEX = [
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
];

const phqItems = [
  ["phq_interest", "Little interest or pleasure in doing things"],
  ["phq_mood", "Feeling down, depressed or hopeless"],
  ["phq_sleep", "Trouble falling or staying asleep, or sleeping too much"],
  ["phq_energy", "Feeling tired or having little energy"],
  ["phq_appetite", "Poor appetite or overeating"],
  ["phq_selfworth", "Feeling bad about yourself, or that you are a failure"],
  ["phq_concentration", "Trouble concentrating on things"],
  ["phq_psychomotor", "Moving or speaking slowly, or being restless"],
  ["phq_selfharm", "Thoughts that you would be better off dead, or of hurting yourself"],
];

const gadItems = [
  ["gad_nervous", "Feeling nervous, anxious or on edge"],
  ["gad_worry", "Not being able to stop or control worrying"],
  ["gad_worry_much", "Worrying too much about different things"],
  ["gad_relax", "Trouble relaxing"],
  ["gad_restless", "Being so restless that it is hard to sit still"],
  ["gad_irritable", "Becoming easily annoyed or irritable"],
  ["gad_fear", "Feeling afraid as if something awful might happen"],
];

const catItems = [
  ["cat_cough", "I cough"],
  ["cat_phlegm", "I have phlegm (sputum) in my chest"],
  ["cat_chest", "My chest feels tight"],
  ["cat_breath", "When I walk up a hill or one flight of stairs I am out of breath"],
  ["cat_activity", "I am limited doing activities at home"],
  ["cat_confidence", "I am confident leaving my home despite my lung condition"],
  ["cat_sleep", "I sleep soundly"],
  ["cat_energy", "I have lots of energy"],
];

const catOptions = [
  { value: "0", label: "0 — no problem" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5 — worst" },
];

const itemVars = (items) => items.map(([key, label]) => ({ key, label, type: "select", options: FREQ }));

const sum = (inputs, items, maxPerItem = 3) => {
  const missing = [];
  let total = 0;
  items.forEach(([key, label]) => {
    const raw = inputs[key];
    if (isBlank(raw)) {
      missing.push(label);
      return;
    }
    const n = num(raw);
    if (n === null) missing.push(label);
    else total += Math.min(Math.max(n, 0), maxPerItem);
  });
  return { missing, total };
};

export const FM_SCORES = [
  {
    key: "bmi",
    name: "Body Mass Index (BMI)",
    purpose: "Weight and height converted to BMI, with the WHO weight classification",
    population: "Adults; not valid for pregnancy or children",
    source: {
      organization: "World Health Organization",
      title: "BMI classification for adults (underweight, normal, overweight, obesity)",
      url: "https://www.who.int/health-topics/obesity",
    },
    variables: [
      { key: "weight_kg", label: "Weight", type: "number", unit: "kg", min: 1, max: 400 },
      { key: "height_cm", label: "Height", type: "number", unit: "cm", min: 50, max: 250 },
    ],
    calculate: (v) => {
      const w = num(v.weight_kg);
      const h = num(v.height_cm);
      const missing = [];
      if (w === null) missing.push("Weight");
      if (h === null) missing.push("Height");
      if (missing.length) return { missing };
      const bmi = w / Math.pow(h / 100, 2);
      const value = Math.round(bmi * 10) / 10;
      let band = "Obesity class III (≥40.0)";
      if (bmi < 18.5) band = "Underweight (<18.5)";
      else if (bmi < 25) band = "Normal range (18.5–24.9)";
      else if (bmi < 30) band = "Overweight (25.0–29.9)";
      else if (bmi < 35) band = "Obesity class I (30.0–34.9)";
      else if (bmi < 40) band = "Obesity class II (35.0–39.9)";
      return { value, unit: "kg/m²", band, missing };
    },
  },
  {
    key: "egfr",
    name: "eGFR — CKD-EPI 2021 (race-free)",
    purpose: "Estimated glomerular filtration rate with the KDIGO G stage",
    population: "Adults with a stable creatinine; not valid in acute kidney injury",
    source: {
      organization: "KDIGO / National Kidney Foundation",
      title: "CKD-EPI 2021 creatinine equation and KDIGO GFR categories",
      url: "https://www.kidney.org/professionals/gfr_calculator",
    },
    variables: [
      { key: "creatinine", label: "Serum creatinine", type: "number", unit: "mg/dL", min: 0.1, max: 20 },
      { key: "age", label: "Age", type: "number", unit: "years", min: 18, max: 120 },
      { key: "sex", label: "Sex", type: "select", options: SEX },
    ],
    calculate: (v) => {
      const cr = num(v.creatinine);
      const age = num(v.age);
      const sex = v.sex;
      const missing = [];
      if (cr === null) missing.push("Serum creatinine");
      if (age === null) missing.push("Age");
      if (sex !== "Female" && sex !== "Male") missing.push("Sex");
      if (missing.length) return { missing };
      const female = sex === "Female";
      const kappa = female ? 0.7 : 0.9;
      const alpha = female ? -0.241 : -0.302;
      const ratio = cr / kappa;
      const egfr =
        142 *
        Math.pow(Math.min(ratio, 1), alpha) *
        Math.pow(Math.max(ratio, 1), -1.2) *
        Math.pow(0.9938, age) *
        (female ? 1.012 : 1);
      const value = Math.round(egfr);
      let band = "G5 — kidney failure (<15)";
      if (egfr >= 90) band = "G1 — normal or high (≥90)";
      else if (egfr >= 60) band = "G2 — mildly decreased (60–89)";
      else if (egfr >= 45) band = "G3a — mildly to moderately decreased (45–59)";
      else if (egfr >= 30) band = "G3b — moderately to severely decreased (30–44)";
      else if (egfr >= 15) band = "G4 — severely decreased (15–29)";
      return {
        value,
        unit: "mL/min/1.73 m²",
        band: `${band} — staging requires albuminuria and persistence beyond 3 months; a single value is not a diagnosis of chronic kidney disease.`,
        missing,
      };
    },
  },
  {
    key: "phq9",
    name: "PHQ-9 — depression severity",
    purpose: "Nine-item depression measure scored over the last two weeks",
    population: "Adults and adolescents (adolescent wording at the source)",
    source: {
      organization: "Kroenke, Spitzer & Williams — PHQ screeners",
      title: "Patient Health Questionnaire-9 (PHQ-9) and its severity bands",
      url: "https://www.phqscreeners.com/",
    },
    variables: itemVars(phqItems),
    calculate: (v) => {
      const { missing, total } = sum(v, phqItems);
      if (missing.length) return { missing };
      let band = "Severe (20–27)";
      if (total < 5) band = "Minimal (0–4)";
      else if (total < 10) band = "Mild (5–9)";
      else if (total < 15) band = "Moderate (10–14)";
      else if (total < 20) band = "Moderately severe (15–19)";
      const selfHarm = num(v.phq_selfharm) || 0;
      return {
        value: total,
        unit: "/27",
        band: selfHarm > 0 ? `${band} — item 9 answered ${selfHarm}: a direct suicide-risk assessment is required and must be documented.` : band,
        missing,
        flagSelfHarm: selfHarm > 0,
      };
    },
  },
  {
    key: "gad7",
    name: "GAD-7 — anxiety severity",
    purpose: "Seven-item anxiety measure scored over the last two weeks",
    population: "Adults",
    source: {
      organization: "Spitzer, Kroenke, Williams & Löwe — PHQ screeners",
      title: "Generalized Anxiety Disorder-7 (GAD-7) and its severity bands",
      url: "https://www.phqscreeners.com/",
    },
    variables: itemVars(gadItems),
    calculate: (v) => {
      const { missing, total } = sum(v, gadItems);
      if (missing.length) return { missing };
      let band = "Severe (15–21)";
      if (total < 5) band = "Minimal (0–4)";
      else if (total < 10) band = "Mild (5–9)";
      else if (total < 15) band = "Moderate (10–14)";
      return { value: total, unit: "/21", band, missing };
    },
  },
  {
    key: "audit_c",
    name: "AUDIT-C — alcohol use",
    purpose: "Three-item alcohol screen, scored with the sex-specific positive thresholds",
    population: "Adults",
    source: {
      organization: "WHO / Bush et al.",
      title: "AUDIT-C alcohol consumption questions and cut-offs",
      url: "https://www.who.int/publications/i/item/9789241547222",
    },
    variables: [
      {
        key: "audit_frequency",
        label: "How often do you have a drink containing alcohol?",
        type: "select",
        options: [
          { value: "0", label: "Never (0)" },
          { value: "1", label: "Monthly or less (1)" },
          { value: "2", label: "2–4 times a month (2)" },
          { value: "3", label: "2–3 times a week (3)" },
          { value: "4", label: "4 or more times a week (4)" },
        ],
      },
      {
        key: "audit_amount",
        label: "How many drinks on a typical drinking day?",
        type: "select",
        options: [
          { value: "0", label: "1 or 2 (0)" },
          { value: "1", label: "3 or 4 (1)" },
          { value: "2", label: "5 or 6 (2)" },
          { value: "3", label: "7 to 9 (3)" },
          { value: "4", label: "10 or more (4)" },
        ],
      },
      {
        key: "audit_binge",
        label: "How often six or more drinks on one occasion?",
        type: "select",
        options: [
          { value: "0", label: "Never (0)" },
          { value: "1", label: "Less than monthly (1)" },
          { value: "2", label: "Monthly (2)" },
          { value: "3", label: "Weekly (3)" },
          { value: "4", label: "Daily or almost daily (4)" },
        ],
      },
      { key: "sex", label: "Sex (for the published cut-off)", type: "select", options: SEX },
    ],
    calculate: (v) => {
      const keys = ["audit_frequency", "audit_amount", "audit_binge"];
      const missing = [];
      let total = 0;
      keys.forEach((k) => {
        const n = num(v[k]);
        if (n === null) missing.push(k);
        else total += n;
      });
      if (v.sex !== "Female" && v.sex !== "Male") missing.push("Sex");
      if (missing.length) return { missing };
      const threshold = v.sex === "Female" ? 3 : 4;
      return {
        value: total,
        unit: "/12",
        band:
          total >= threshold
            ? `Positive screen at the published cut-off for ${v.sex.toLowerCase()} patients (≥${threshold}) — further assessment is indicated; the result is a screen, not a diagnosis.`
            : `Below the published cut-off (≥${threshold}) — a negative screen does not exclude harmful drinking.`,
        missing,
      };
    },
  },
  {
    key: "asthma_control",
    name: "Asthma symptom control (GINA tool)",
    purpose: "The four GINA symptom-control questions from the last four weeks",
    population: "Adults and adolescents with asthma",
    source: {
      organization: "Global Initiative for Asthma (GINA)",
      title: "GINA assessment of asthma control — the four symptom questions",
      url: "https://ginasthma.org/reports/",
    },
    variables: [
      { key: "gina_daytime", label: "Daytime asthma symptoms more than twice a week?", type: "select", options: YN_YN },
      { key: "gina_night", label: "Any night waking due to asthma?", type: "select", options: YN_YN },
      { key: "gina_reliever", label: "Reliever needed more than twice a week?", type: "select", options: YN_YN },
      { key: "gina_activity", label: "Any activity limitation due to asthma?", type: "select", options: YN_YN },
    ],
    calculate: (v) => {
      const keys = ["gina_daytime", "gina_night", "gina_reliever", "gina_activity"];
      const missing = [];
      let yes = 0;
      keys.forEach((k) => {
        if (v[k] !== "Yes" && v[k] !== "No") missing.push(k);
        else if (v[k] === "Yes") yes += 1;
      });
      if (missing.length) return { missing };
      const band =
        yes === 0
          ? "Well controlled — none of the four features present"
          : yes <= 2
            ? "Partly controlled — 1–2 features present"
            : "Uncontrolled — 3–4 features present";
      return { value: yes, unit: "features present", band, missing };
    },
  },
  {
    key: "cat",
    name: "COPD Assessment Test (CAT)",
    purpose: "Eight-item symptom burden score for COPD",
    population: "Adults with COPD",
    source: {
      organization: "COPD Assessment Test",
      title: "CAT — COPD Assessment Test, eight items each scored 0–5",
      url: "https://www.catestonline.org/",
    },
    variables: catItems.map(([key, label]) => ({ key, label, type: "select", options: catOptions })),
    calculate: (v) => {
      const missing = [];
      let total = 0;
      catItems.forEach(([key, label]) => {
        const n = num(v[key]);
        if (n === null) missing.push(label);
        else total += n;
      });
      if (missing.length) return { missing };
      let band = "Very high impact (>30)";
      if (total < 10) band = "Low impact (<10)";
      else if (total <= 20) band = "Medium impact (10–20)";
      else if (total <= 30) band = "High impact (21–30)";
      return { value: total, unit: "/40", band, missing };
    },
  },
  {
    key: "mmrc",
    name: "mMRC breathlessness scale",
    purpose: "Breathlessness grade in chronic respiratory disease",
    population: "Adults with COPD or other chronic breathlessness",
    source: {
      organization: "GOLD",
      title: "Modified Medical Research Council (mMRC) dyspnoea scale, grades 0–4",
      url: "https://goldcopd.org/",
    },
    variables: [
      {
        key: "mmrc_grade",
        label: "Breathlessness grade",
        type: "select",
        options: [
          { value: "0", label: "0 — breathless only with strenuous exercise" },
          { value: "1", label: "1 — short of breath when hurrying on the level or up a slight hill" },
          { value: "2", label: "2 — walks slower than people of the same age, or stops for breath walking at own pace" },
          { value: "3", label: "3 — stops for breath after 100 metres or after a few minutes on the level" },
          { value: "4", label: "4 — too breathless to leave the house, or breathless when dressing" },
        ],
      },
    ],
    calculate: (v) => {
      const n = num(v.mmrc_grade);
      if (n === null) return { missing: ["Breathlessness grade"] };
      return { value: n, unit: "/4", band: `mMRC grade ${n}`, missing: [] };
    },
  },
  {
    key: "cfs",
    name: "Clinical Frailty Scale (CFS)",
    purpose: "Frailty category from the nine-level clinical scale",
    population: "Adults, typically 65 years and older",
    source: {
      organization: "Rockwood et al. — Dalhousie University",
      title: "Clinical Frailty Scale, levels 1–9 with their published descriptions",
      url: "https://www.dal.ca/sites/gmr/our-tools/clinical-frailty-scale.html",
    },
    variables: [
      {
        key: "cfs_level",
        label: "Frailty level",
        type: "select",
        options: [
          { value: "1", label: "1 — Very fit" },
          { value: "2", label: "2 — Fit" },
          { value: "3", label: "3 — Managing well" },
          { value: "4", label: "4 — Living with very mild frailty" },
          { value: "5", label: "5 — Living with mild frailty" },
          { value: "6", label: "6 — Living with moderate frailty" },
          { value: "7", label: "7 — Living with severe frailty" },
          { value: "8", label: "8 — Living with very severe frailty" },
          { value: "9", label: "9 — Terminally ill" },
        ],
      },
    ],
    calculate: (v) => {
      const n = num(v.cfs_level);
      if (n === null) return { missing: ["Frailty level"] };
      const band =
        n <= 3 ? "Fit to managing well" : n === 4 ? "Vulnerable / very mild frailty" : n <= 6 ? "Mild to moderate frailty" : "Severe frailty or terminal illness";
      return { value: n, unit: "/9", band, missing: [] };
    },
  },
  {
    key: "falls_screen",
    name: "Falls screen (STEADI 3 key questions)",
    purpose: "Number of positive fall-screening questions",
    population: "Adults 65 years and older",
    source: {
      organization: "CDC — STEADI",
      title: "STEADI fall-risk screening: the three key questions",
      url: "https://www.cdc.gov/steadi/",
    },
    variables: [
      { key: "fall_q1", label: "Fallen in the past year?", type: "select", options: YN_YN },
      { key: "fall_q2", label: "Feels unsteady when standing or walking?", type: "select", options: YN_YN },
      { key: "fall_q3", label: "Worries about falling?", type: "select", options: YN_YN },
    ],
    calculate: (v) => {
      const keys = ["fall_q1", "fall_q2", "fall_q3"];
      const missing = [];
      let yes = 0;
      keys.forEach((k) => {
        if (v[k] !== "Yes" && v[k] !== "No") missing.push(k);
        else if (v[k] === "Yes") yes += 1;
      });
      if (missing.length) return { missing };
      return {
        value: yes,
        unit: "positive answers",
        band:
          yes > 0
            ? "Positive screen — gait, strength and balance assessment and a medication review are indicated per the STEADI algorithm."
            : "Negative screen — a negative screen does not exclude future falls.",
        missing,
      };
    },
  },
  {
    key: "cvd_risk",
    name: "10-year cardiovascular risk (documented value)",
    purpose: "Records the risk value read from the validated chart used, with the ACC/AHA risk category",
    population: "Adults 40–75 years without established atherosclerotic disease",
    source: {
      organization: "ACC / AHA",
      title: "2019 ACC/AHA Guideline on the Primary Prevention of Cardiovascular Disease — risk categories",
      url: "https://www.acc.org/guidelines",
    },
    variables: [
      { key: "risk_percent", label: "10-year risk as read from the chart used", type: "number", unit: "%", min: 0, max: 100 },
      { key: "risk_chart", label: "Chart used", type: "select", options: [
        { value: "WHO/ISH risk chart", label: "WHO/ISH risk chart" },
        { value: "SCORE2", label: "SCORE2" },
        { value: "Pooled Cohort Equations", label: "Pooled Cohort Equations" },
        { value: "Other validated chart", label: "Other validated chart" },
      ] },
    ],
    calculate: (v) => {
      const p = num(v.risk_percent);
      const missing = [];
      if (p === null) missing.push("10-year risk value");
      if (!v.risk_chart) missing.push("Chart used");
      if (missing.length) return { missing };
      let band = "High risk (≥20%)";
      if (p < 5) band = "Low risk (<5%)";
      else if (p < 7.5) band = "Borderline risk (5% to <7.5%)";
      else if (p < 20) band = "Intermediate risk (7.5% to <20%)";
      return {
        value: p,
        unit: "%",
        band: `${band} — recorded from ${v.risk_chart}. AMedix does not compute the risk itself; the value and its chart are recorded as entered.`,
        missing,
      };
    },
  },
  {
    key: "hba1c",
    name: "HbA1c against the documented target",
    purpose: "Compares the measured HbA1c with the individualised target recorded for this patient",
    population: "Adults with diabetes",
    source: {
      organization: "American Diabetes Association",
      title: "Standards of Care in Diabetes — glycaemic targets are individualised",
      url: "https://professional.diabetes.org/standards-of-care",
    },
    variables: [
      { key: "hba1c_value", label: "HbA1c measured", type: "number", unit: "%", min: 3, max: 20 },
      { key: "hba1c_target", label: "Individualised target recorded", type: "number", unit: "%", min: 5, max: 12 },
    ],
    calculate: (v) => {
      const value = num(v.hba1c_value);
      const target = num(v.hba1c_target);
      const missing = [];
      if (value === null) missing.push("HbA1c measured");
      if (target === null) missing.push("Individualised target");
      if (missing.length) return { missing };
      return {
        value,
        unit: "%",
        band:
          value <= target
            ? `At or below the recorded target of ${target}% — the target itself is the treating clinician's, not an AMedix default.`
            : `Above the recorded target of ${target}% — the target is individualised and remains the treating clinician's decision.`,
        missing,
      };
    },
  },
  {
    key: "child_bmi",
    name: "Child measurements (plot on WHO chart)",
    purpose: "BMI from the child's measurements, for plotting on the WHO growth chart — AMedix does not compute a percentile",
    population: "Children 2–19 years",
    source: {
      organization: "World Health Organization",
      title: "WHO Child Growth Standards and growth reference — percentiles are read from the chart",
      url: "https://www.who.int/tools/child-growth-standards",
    },
    variables: [
      { key: "weight_kg", label: "Weight", type: "number", unit: "kg", min: 1, max: 150 },
      { key: "height_cm", label: "Height", type: "number", unit: "cm", min: 30, max: 210 },
    ],
    calculate: (v) => {
      const w = num(v.weight_kg);
      const h = num(v.height_cm);
      const missing = [];
      if (w === null) missing.push("Weight");
      if (h === null) missing.push("Height");
      if (missing.length) return { missing };
      return {
        value: Math.round((w / Math.pow(h / 100, 2)) * 10) / 10,
        unit: "kg/m²",
        band:
          "BMI only. Plot weight-for-age, height-for-age and BMI-for-age on the WHO chart and record the percentile or Z-score there — AMedix never estimates a percentile.",
        missing,
      };
    },
  },
];

export const fmScore = (key) => FM_SCORES.find((s) => s.key === key) || null;

// The one calculation entry point. Returns null for an unknown score and an object
// with `missing` when the documented items are not yet complete.
export const calculateFmScore = (key, inputs) => {
  const score = fmScore(key);
  if (!score) return null;
  return score.calculate(asObject(inputs));
};

// Values a safety rule reads without knowing how the score was stored.
export const fmScoreInputs = (values, key) => asObject(asObject(asObject(values).fm_scores)[key]);