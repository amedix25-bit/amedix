// Urology — documented calculations.
//
// Every calculation runs ONLY from values documented in this note. A missing
// input leaves it uncalculated and names exactly what is missing: nothing is
// estimated, defaulted or inferred, and a blank is never treated as normal.
//
// A calculation is a documented arithmetic observation, never a diagnosis and
// never a treatment decision. Where a published threshold exists it is shown as
// ADVISORY with the source named, so a value is never read as a verdict. No
// probability, nomogram or outcome figure is produced here, and nothing in this
// module writes, changes or discontinues a medication.

import { asObject, num, isBlank } from "@/lib/uroFieldKit";

export const URO_SCORE_SOURCES = {
  ipss: {
    organization: "American Urological Association (AUA) / European Association of Urology (EAU)",
    title: "International Prostate Symptom Score (IPSS) with quality-of-life item",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines",
  },
  psa_density: {
    organization: "European Association of Urology (EAU)",
    title: "EAU Guidelines on Prostate Cancer — PSA and PSA density in the diagnostic pathway",
    url: "https://uroweb.org/guidelines/prostate-cancer",
  },
  psa_kinetics: {
    organization: "European Association of Urology (EAU)",
    title: "EAU Guidelines on Prostate Cancer — PSA kinetics (velocity and doubling time)",
    url: "https://uroweb.org/guidelines/prostate-cancer",
  },
  prostate_volume: {
    organization: "European Association of Urology (EAU)",
    title: "Prostate volume by the ellipsoid formula (transabdominal or transrectal measurement)",
    url: "https://uroweb.org/guidelines/prostate-cancer",
  },
  egfr: {
    organization: "KDIGO / National Kidney Foundation",
    title: "CKD-EPI 2021 creatinine equation for estimated GFR, with KDIGO G categories",
    url: "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
  },
  charlson: {
    organization: "Charlson et al.",
    title: "Charlson Comorbidity Index — weighted comorbidity score",
    url: "https://doi.org/10.1016/0021-9681(87)90171-8",
  },
  voiding_efficiency: {
    organization: "International Continence Society (ICS)",
    title: "Post-void residual and voiding efficiency in lower urinary tract assessment",
    url: "https://www.ics.org/",
  },
};

const opts = (pairs) => pairs.map(([value, label]) => ({ value: String(value), label }));

const IPSS_ITEMS = [
  ["incomplete", "Over the past month, how often have you had a sensation of not emptying your bladder completely after you finished urinating?"],
  ["frequency", "How often have you had to urinate again less than two hours after you finished urinating?"],
  ["intermittency", "How often have you found you stopped and started again several times when you urinated?"],
  ["urgency", "How difficult have you found it to postpone urination?"],
  ["weak_stream", "How often have you had a weak urinary stream?"],
  ["straining", "How often have you had to push or strain to begin urination?"],
  ["nocturia", "How many times did you most typically get up to urinate from the time you went to bed until the time you got up in the morning?"],
];

const IPSS_OPTIONS = opts([
  [0, "0 — Not at all"],
  [1, "1 — Less than 1 time in 5"],
  [2, "2 — Less than half the time"],
  [3, "3 — About half the time"],
  [4, "4 — More than half the time"],
  [5, "5 — Almost always"],
]);

const QOL_OPTIONS = opts([
  [0, "0 — Delighted"],
  [1, "1 — Pleased"],
  [2, "2 — Mostly satisfied"],
  [3, "3 — Mixed"],
  [4, "4 — Mostly dissatisfied"],
  [5, "5 — Unhappy"],
  [6, "6 — Terrible"],
]);

const ipssBand = (total) => (total <= 7 ? "Mild (0–7)" : total <= 19 ? "Moderate (8–19)" : "Severe (20–35)");

export const URO_SCORES = [
  {
    key: "ipss",
    name: "IPSS — International Prostate Symptom Score",
    purpose: "Severity of male lower urinary tract symptoms, item by item, over the past month",
    population: "Men with LUTS; documented as reported by the patient",
    source: URO_SCORE_SOURCES.ipss,
    note: "Bands 0–7 mild, 8–19 moderate, 20–35 severe. The quality-of-life item (0–6) is reported separately and is not part of the total.",
    variables: [
      ...IPSS_ITEMS.map(([key, label]) => ({ key, label, type: "select", options: IPSS_OPTIONS })),
      { key: "qol", label: "Quality of life — if you were to spend the rest of your life with your urinary condition just the way it is now, how would you feel?", type: "select", options: QOL_OPTIONS },
    ],
    calculate: (v) => {
      const missing = IPSS_ITEMS.filter(([k]) => num(v[k]) === null).map(([, label]) => label.split(",")[0].slice(0, 48));
      const qol = num(v.qol);
      if (missing.length) {
        return { value: null, missing, band: "", extra: qol === null ? "" : `Quality-of-life item recorded: ${qol}/6 (not part of the total)` };
      }
      const total = IPSS_ITEMS.reduce((sum, [k]) => sum + num(v[k]), 0);
      const qolNote = qol === null ? "Quality-of-life item not documented." : `Quality-of-life item: ${qol}/6 (reported separately).`;
      return { value: `${total}/35`, missing: [], band: ipssBand(total), extra: qolNote };
    },
  },
  {
    key: "psa_density",
    name: "PSA density",
    purpose: "Serum PSA related to prostate volume",
    population: "Men with a documented PSA and a measured prostate volume",
    source: URO_SCORE_SOURCES.psa_density,
    note: "Advisory only: 0.15 ng/mL/cc is a commonly cited reference point. The threshold applied to a decision is the one in the EAU panel edition in force, not this note.",
    variables: [
      { key: "psa", label: "Serum PSA (ng/mL)", type: "number", unit: "ng/mL", min: 0, max: 1000 },
      { key: "volume", label: "Prostate volume (cc / mL)", type: "number", unit: "cc", min: 1, max: 500 },
    ],
    calculate: (v) => {
      const psa = num(v.psa);
      const volume = num(v.volume);
      const missing = [];
      if (psa === null) missing.push("Serum PSA");
      if (volume === null || volume <= 0) missing.push("Prostate volume");
      if (missing.length) return { value: null, missing, band: "" };
      const density = psa / volume;
      return {
        value: `${density.toFixed(3)} ng/mL/cc`,
        missing: [],
        band: density >= 0.15 ? "At or above the commonly cited 0.15 ng/mL/cc reference point (advisory)" : "Below the commonly cited 0.15 ng/mL/cc reference point (advisory)",
        extra: "A density is arithmetic; it does not diagnose or exclude cancer and does not replace imaging or biopsy assessment.",
      };
    },
  },
  {
    key: "psa_kinetics",
    name: "PSA kinetics — velocity and doubling time",
    purpose: "Change in PSA between two dated measurements",
    population: "Men with at least two dated PSA values",
    source: URO_SCORE_SOURCES.psa_kinetics,
    note: "Both values and both dates are required. A doubling time is only meaningful when PSA is rising and both values are above zero.",
    variables: [
      { key: "psa1", label: "Earlier PSA (ng/mL)", type: "number", unit: "ng/mL", min: 0, max: 1000 },
      { key: "date1", label: "Earlier PSA date", type: "date" },
      { key: "psa2", label: "Later PSA (ng/mL)", type: "number", unit: "ng/mL", min: 0, max: 1000 },
      { key: "date2", label: "Later PSA date", type: "date" },
    ],
    calculate: (v) => {
      const psa1 = num(v.psa1);
      const psa2 = num(v.psa2);
      const missing = [];
      if (psa1 === null) missing.push("Earlier PSA");
      if (psa2 === null) missing.push("Later PSA");
      if (isBlank(v.date1)) missing.push("Earlier PSA date");
      if (isBlank(v.date2)) missing.push("Later PSA date");
      if (missing.length) return { value: null, missing, band: "" };
      const t1 = new Date(v.date1).getTime();
      const t2 = new Date(v.date2).getTime();
      if (!Number.isFinite(t1) || !Number.isFinite(t2) || t2 <= t1) {
        return { value: null, missing: ["Two dates in chronological order (the later date must be after the earlier one)"], band: "" };
      }
      const years = (t2 - t1) / (365.25 * 24 * 3600 * 1000);
      const velocity = (psa2 - psa1) / years;
      const parts = [`Velocity ${velocity.toFixed(2)} ng/mL/year`];
      if (psa1 > 0 && psa2 > 0 && psa2 > psa1) {
        const doubling = (Math.log(2) * years) / Math.log(psa2 / psa1);
        parts.push(`Doubling time ${doubling.toFixed(1)} months`);
      } else if (psa2 <= psa1) {
        parts.push("Doubling time not applicable — PSA did not rise between the two measurements");
      } else {
        parts.push("Doubling time not calculated — a zero PSA is not usable in the formula");
      }
      return { value: parts.join(" · "), missing: [], band: "", extra: "Kinetics are arithmetic from the two documented values; interpretation belongs to the clinician." };
    },
  },
  {
    key: "prostate_volume",
    name: "Prostate volume (ellipsoid)",
    purpose: "Estimated prostate volume from three measured diameters",
    population: "Men with a measured prostate on ultrasound, CT or MRI",
    source: URO_SCORE_SOURCES.prostate_volume,
    note: "Ellipsoid formula: volume = 0.523 × length × width × height. It is an estimate from the measured diameters, not a measured volume.",
    variables: [
      { key: "length", label: "Length (cm)", type: "number", unit: "cm", min: 0.5, max: 25 },
      { key: "width", label: "Width (cm)", type: "number", unit: "cm", min: 0.5, max: 25 },
      { key: "height", label: "Height (cm)", type: "number", unit: "cm", min: 0.5, max: 25 },
    ],
    calculate: (v) => {
      const l = num(v.length);
      const w = num(v.width);
      const h = num(v.height);
      const missing = [];
      if (l === null) missing.push("Length");
      if (w === null) missing.push("Width");
      if (h === null) missing.push("Height");
      if (missing.length) return { value: null, missing, band: "" };
      const cc = 0.523 * l * w * h;
      return { value: `${cc.toFixed(1)} cc`, missing: [], band: "", extra: "Estimated from the three diameters by the ellipsoid formula." };
    },
  },
  {
    key: "egfr",
    name: "eGFR — CKD-EPI 2021 (creatinine)",
    purpose: "Estimated glomerular filtration rate with its KDIGO G category",
    population: "Adults; not validated for children",
    source: URO_SCORE_SOURCES.egfr,
    note: "CKD-EPI 2021 creatinine equation (race-free): 142 × min(Scr/κ,1)^α × max(Scr/κ,1)^−1.200 × 0.9938^age × 1.012 [if female].",
    variables: [
      { key: "creatinine", label: "Serum creatinine (mg/dL)", type: "number", unit: "mg/dL", min: 0.1, max: 30 },
      { key: "age", label: "Age (years)", type: "number", unit: "years", min: 18, max: 120 },
      { key: "sex", label: "Sex recorded for the equation", type: "select", options: opts([["female", "Female"], ["male", "Male"]]) },
    ],
    calculate: (v) => {
      const scr = num(v.creatinine);
      const age = num(v.age);
      const sex = v.sex || "";
      const missing = [];
      if (scr === null || scr <= 0) missing.push("Serum creatinine");
      if (age === null) missing.push("Age");
      if (!sex) missing.push("Sex as recorded for the equation");
      if (age !== null && age < 18) missing.push("This equation is not validated under 18 years — a paediatric eGFR formula is required");
      if (missing.length) return { value: null, missing, band: "" };
      const female = sex === "female";
      const k = female ? 0.7 : 0.9;
      const a = female ? -0.241 : -0.302;
      const egfr = 142 * Math.min(scr / k, 1) ** a * Math.max(scr / k, 1) ** -1.2 * 0.9938 ** age * (female ? 1.012 : 1);
      const g =
        egfr >= 90 ? "G1 (≥90)" : egfr >= 60 ? "G2 (60–89)" : egfr >= 45 ? "G3a (45–59)" : egfr >= 30 ? "G3b (30–44)" : egfr >= 15 ? "G4 (15–29)" : "G5 (<15)";
      const alb = isBlank(v.acr) ? "Albuminuria category not documented — the KDIGO heat map needs it and is not applied here." : "";
      return {
        value: `${egfr.toFixed(0)} mL/min/1.73 m²`,
        missing: [],
        band: `KDIGO category ${g}`,
        extra: [`A G category alone is not a CKD diagnosis; chronicity (≥ 3 months) must be documented separately.`, alb].filter(Boolean).join(" "),
      };
    },
  },
  {
    key: "charlson",
    name: "Charlson Comorbidity Index",
    purpose: "Weighted comorbidity burden documented from the patient's record",
    population: "Adults; surgical and oncological risk discussion",
    source: URO_SCORE_SOURCES.charlson,
    note: "The 19 published items with their original weights. Age is NOT added — the age-adjusted variant is a separate index and is not computed here.",
    variables: [
      {
        key: "items",
        label: "Comorbidities documented for this patient (select all that apply)",
        type: "multi",
        options: opts([
          ["mi", "Myocardial infarction (1)"],
          ["chf", "Congestive heart failure (1)"],
          ["pvd", "Peripheral vascular disease (1)"],
          ["cvd", "Cerebrovascular disease (1)"],
          ["dementia", "Dementia (1)"],
          ["copd", "Chronic pulmonary disease (1)"],
          ["ctd", "Connective tissue disease (1)"],
          ["ulcer", "Peptic ulcer disease (1)"],
          ["mild_liver", "Mild liver disease (1)"],
          ["diabetes", "Diabetes without end-organ damage (1)"],
          ["hemiplegia", "Hemiplegia (2)"],
          ["renal", "Moderate or severe renal disease (2)"],
          ["diabetes_damage", "Diabetes with end-organ damage (2)"],
          ["tumour", "Any solid tumour, non-metastatic (2)"],
          ["leukaemia", "Leukaemia (2)"],
          ["lymphoma", "Lymphoma (2)"],
          ["liver", "Moderate or severe liver disease (3)"],
          ["metastatic", "Metastatic solid tumour (6)"],
          ["aids", "AIDS (6)"],
        ]),
      },
    ],
    calculate: (v) => {
      const weights = {
        mi: 1, chf: 1, pvd: 1, cvd: 1, dementia: 1, copd: 1, ctd: 1, ulcer: 1, mild_liver: 1, diabetes: 1,
        hemiplegia: 2, renal: 2, diabetes_damage: 2, tumour: 2, leukaemia: 2, lymphoma: 2,
        liver: 3, metastatic: 6, aids: 6,
      };
      const chosen = Array.isArray(v.items) ? v.items : [];
      const total = chosen.reduce((sum, k) => sum + (weights[k] || 0), 0);
      return {
        value: `${total}`,
        missing: [],
        band: chosen.length ? `${chosen.length} documented comorbidit${chosen.length === 1 ? "y" : "ies"}` : "No comorbidity recorded",
        extra: "A score of 0 means no listed comorbidity was documented — it is not a statement that the patient has none. Ten-year survival estimates are not reproduced.",
      };
    },
  },
  {
    key: "voiding_efficiency",
    name: "Post-void residual & voiding efficiency",
    purpose: "Residual urine as a proportion of the total bladder volume at that void",
    population: "Patients with a documented voided volume and residual",
    source: URO_SCORE_SOURCES.voiding_efficiency,
    note: "Voiding efficiency = voided volume ÷ (voided volume + residual) × 100.",
    variables: [
      { key: "voided", label: "Voided volume (mL)", type: "number", unit: "mL", min: 0, max: 3000 },
      { key: "residual", label: "Post-void residual (mL)", type: "number", unit: "mL", min: 0, max: 3000 },
    ],
    calculate: (v) => {
      const voided = num(v.voided);
      const residual = num(v.residual);
      const missing = [];
      if (voided === null) missing.push("Voided volume");
      if (residual === null) missing.push("Post-void residual");
      if (missing.length) return { value: null, missing, band: "" };
      const total = voided + residual;
      if (total <= 0) return { value: null, missing: ["A voided volume or a residual above zero"], band: "" };
      const pct = (voided / total) * 100;
      return {
        value: `${pct.toFixed(0)}% voided`,
        missing: [],
        band: `Post-void residual ${residual} mL`,
        extra: "A single residual is one observation. A residual does not by itself diagnose obstruction or retention.",
      };
    },
  },
];

export const URO_SCORE_MAP = Object.fromEntries(URO_SCORES.map((s) => [s.key, s]));

export const calculateUroScore = (key, inputs) => {
  const score = URO_SCORE_MAP[key];
  if (!score) return { value: null, missing: ["Unknown calculation"], band: "" };
  try {
    return score.calculate(asObject(inputs));
  } catch (e) {
    return { value: null, missing: ["The calculation could not be completed from the values entered"], band: "" };
  }
};