// Oncology — the calculations oncology documentation genuinely needs.
//
// RULES
//   · Every value is computed ONLY from what the clinician documented. A missing item
//     leaves the calculation uncalculated and names what is missing — nothing is
//     estimated, defaulted or inferred, and a blank is never read as a normal finding.
//   · NO DOSE IS CALCULATED OR SUGGESTED. Body surface area is arithmetic on recorded
//     height and weight and is shown with that statement; it is not a dose, and AMedix
//     never converts it into one.
//   · NO STAGE IS CALCULATED. Staging is recorded by the clinician in the staging block;
//     no instrument here derives a stage group from TNM categories.
//   · No overall response category is derived: the target-lesion arithmetic of RECIST is
//     shown, and the overall response (which also depends on non-target and new lesions)
//     stays the clinician's documented judgement.
//   · The wording and thresholds belong to the published instrument named beside each
//     entry. No probability, prognosis or treatment recommendation is invented.

import { asObject, num, isBlank } from "@/lib/fmFieldKit";
import { FM_SCORES, fmScore } from "@/lib/fmScores";

const ECOG_OPTIONS = [
  { value: "0", label: "0 — Fully active, no restriction" },
  { value: "1", label: "1 — Restricted in strenuous activity, ambulatory" },
  { value: "2", label: "2 — Ambulatory, up and about >50% of waking hours, unable to work" },
  { value: "3", label: "3 — Limited self-care, confined to bed or chair >50% of waking hours" },
  { value: "4", label: "4 — Completely disabled, no self-care, totally confined to bed or chair" },
];

const ECOG_BANDS = {
  "0": "ECOG 0 — fully active, able to carry on all pre-disease performance without restriction.",
  "1": "ECOG 1 — restricted in physically strenuous activity but ambulatory and able to carry out light work.",
  "2": "ECOG 2 — ambulatory and capable of all self-care, up more than 50% of waking hours; unable to carry out any work activity.",
  "3": "ECOG 3 — capable of only limited self-care, confined to bed or chair more than 50% of waking hours.",
  "4": "ECOG 4 — completely disabled, cannot carry on any self-care, totally confined to bed or chair.",
};

export const ONC_ONLY_SCORES = [
  {
    key: "onc_ecog",
    name: "ECOG Performance Status",
    purpose: "The documented performance status, with the published definition of the grade recorded",
    population: "Adults receiving cancer treatment",
    source: {
      organization: "Eastern Cooperative Oncology Group (ECOG) / WHO",
      title: "ECOG performance status scale",
      url: "https://www.mdanderson.org/research/departments-labs-institutes/departments-divisions/biostatistics/ecog-performance-status.html",
    },
    variables: [{ key: "grade", label: "ECOG grade documented at this encounter", type: "select", options: ECOG_OPTIONS }],
    calculate: (v) => {
      const grade = String(v.grade ?? "").trim();
      if (isBlank(grade)) return { missing: ["ECOG grade"] };
      return { value: `ECOG ${grade}`, unit: "", band: ECOG_BANDS[grade] || "", missing: [] };
    },
  },
  {
    key: "onc_bsa",
    name: "Body Surface Area (Mosteller)",
    purpose: "Height and weight converted to body surface area — arithmetic only, no dose is calculated or suggested",
    population: "Adults; the formula used is stated so the recorded figure can be checked",
    source: {
      organization: "Mosteller formula, as published",
      title: "Simplified calculation of body-surface area (Mosteller RD, N Engl J Med 1987)",
      url: "https://www.nejm.org/doi/10.1056/NEJM198710223171717",
    },
    variables: [
      { key: "height_cm", label: "Height", type: "number", unit: "cm", min: 50, max: 250 },
      { key: "weight_kg", label: "Weight", type: "number", unit: "kg", min: 1, max: 400 },
    ],
    calculate: (v) => {
      const h = num(v.height_cm);
      const w = num(v.weight_kg);
      const missing = [];
      if (h === null) missing.push("Height");
      if (w === null) missing.push("Weight");
      if (missing.length) return { missing };
      const bsa = Math.sqrt((h * w) / 3600);
      return {
        value: String(Math.round(bsa * 100) / 100),
        unit: "m²",
        band:
          "Mosteller: √(height cm × weight kg ÷ 3600). Arithmetic only — AMedix calculates no dose from it and suggests none; the authorized order is the prescriber's.",
        missing: [],
      };
    },
  },
  {
    key: "onc_recist_sum",
    name: "RECIST 1.1 — target lesion change",
    purpose: "Percentage change in the sum of target-lesion diameters, with the RECIST target-lesion category",
    population: "Adults with measurable solid tumours assessed by RECIST 1.1",
    source: {
      organization: "RECIST Working Group (EORTC / NCI / ACRIN)",
      title: "RECIST 1.1 — Response Evaluation Criteria in Solid Tumours",
      url: "https://recist.eortc.org/",
    },
    variables: [
      { key: "baseline_sum", label: "Baseline sum of target diameters", type: "number", unit: "mm", min: 0 },
      { key: "current_sum", label: "Current sum of target diameters", type: "number", unit: "mm", min: 0 },
      {
        key: "new_lesions",
        label: "New lesions",
        type: "select",
        options: [
          { value: "Absent", label: "Absent" },
          { value: "Present", label: "Present" },
        ],
      },
    ],
    calculate: (v) => {
      const base = num(v.baseline_sum);
      const now = num(v.current_sum);
      const missing = [];
      if (base === null || base <= 0) missing.push("Baseline sum of target diameters");
      if (now === null) missing.push("Current sum of target diameters");
      if (isBlank(v.new_lesions)) missing.push("New lesions");
      if (missing.length) return { missing };
      const change = Math.round(((now - base) / base) * 1000) / 10;
      let target = "Stable disease by target-lesion measurement";
      if (change <= -100) target = "Disappearance of all target lesions (target-lesion complete response)";
      else if (change <= -30) target = "At least 30% decrease (target-lesion partial response)";
      else if (change >= 20) target = "At least 20% increase (target-lesion progressive disease)";
      const caveat =
        v.new_lesions === "Present"
          ? " A new lesion is documented, so the overall response is progressive disease by RECIST irrespective of the measurements."
          : "";
      return {
        value: `${change > 0 ? "+" : ""}${change}`,
        unit: "% change",
        band: `${target}.${caveat} This is the target-lesion measurement only: the overall response also depends on non-target lesions and must be the clinician's documented assessment.`,
        missing: [],
      };
    },
  },
];

// The oncology panel offers its own instruments plus the shared calculations that
// oncology genuinely uses (BMI, eGFR for renal function before nephrotoxic therapy).
const SHARED_KEYS = ["bmi", "egfr"];

export const ONC_SHARED_SCORES = FM_SCORES.filter((s) => SHARED_KEYS.includes(s.key));

export const ONC_SCORES = [...ONC_ONLY_SCORES, ...ONC_SHARED_SCORES];

export const oncScore = (key) => ONC_ONLY_SCORES.find((s) => s.key === key) || fmScore(key);

// The one calculation entry point for oncology notes. Returns null for an unknown key
// and an object with `missing` when the documented items are not yet complete.
export const calculateOncScore = (key, inputs) => {
  const score = oncScore(key);
  if (!score) return null;
  return score.calculate(asObject(inputs));
};

export const oncScoreInputs = (values, fieldKey, scoreKey) =>
  asObject(asObject(asObject(values)[fieldKey])[scoreKey]);