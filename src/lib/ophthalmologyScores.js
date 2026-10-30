// Ophthalmology — guideline-based calculations.
//
// Three rules the specialty acts on, computed ONLY from values documented in the
// note. A missing variable leaves the calculation undone and states exactly what
// is missing — nothing is estimated, defaulted or inferred. Every result names
// the source it comes from and is stored as a calculation, never as a diagnosis.
//
//   1. Ocular Trauma Score (BETT / Kuhn et al.) — a prognostic category from the
//      documented presenting findings. The 5-year outcome probabilities are
//      tabulated in the source and are NOT reproduced or invented here.
//   2. AREDS simplified severity scale — the 5-step score for an eye at risk of
//      progression to advanced AMD. The score is recorded; the tabulated
//      progression risk stays in the source.
//   3. Hodapp-Parrish-Anderson field stage — from the documented mean deviation
//      for one eye. A single MD cannot establish an end-stage field, so the
//      calculation says so instead of staging it.

import { asObject, str, isBlank } from "@/lib/ophthFieldKit";

export const OPHTH_SCORE_SOURCES = {
  ots: {
    organization: "BETT / Ocular Trauma Score",
    title: "Ocular Trauma Score (Kuhn et al., 2002)",
    url: "https://pubmed.ncbi.nlm.nih.gov/12021970/",
  },
  areds: {
    organization: "AREDS",
    title: "AREDS Simplified Severity Scale (AREDS Report 18, 2005)",
    url: "https://pubmed.ncbi.nlm.nih.gov/16251173/",
  },
  hpa: {
    organization: "Hodapp-Parrish-Anderson",
    title: "Clinical Decisions in Glaucoma — visual field staging criteria",
    url: "https://www.aao.org/education/guidelines-browse",
  },
};

export const OPHTH_SCORES = [
  {
    key: "ocular_trauma_score",
    name: "Ocular Trauma Score",
    purpose: "Prognostic category for a traumatised eye from the documented presenting findings",
    population: "Ocular trauma at presentation, before definitive management",
    source: OPHTH_SCORE_SOURCES.ots,
    variables: [
      { key: "initial_va", label: "Initial Visual Acuity", type: "select", options: ["No light perception", "Light perception to hand movements", "1/200 to 19/200", "20/200 to 20/50", "20/40 or better"] },
      { key: "globe_rupture", label: "Globe Rupture", type: "select", options: ["No", "Yes"] },
      { key: "endophthalmitis", label: "Endophthalmitis", type: "select", options: ["No", "Yes"] },
      { key: "perforating_injury", label: "Perforating Injury", type: "select", options: ["No", "Yes"] },
      { key: "retinal_detachment", label: "Retinal Detachment", type: "select", options: ["No", "Yes"] },
      { key: "rapd", label: "Afferent Pupillary Defect", type: "select", options: ["No", "Yes"] },
    ],
  },
  {
    key: "amd_risk",
    name: "AREDS Simplified Severity Scale",
    purpose: "5-step score for the risk of progression to advanced AMD, from documented drusen and pigmentary change",
    population: "Non-advanced age-related macular degeneration",
    source: OPHTH_SCORE_SOURCES.areds,
    variables: [
      { key: "worse_drusen", label: "Large Drusen — Worse Eye", type: "select", options: ["No", "Yes"] },
      { key: "worse_pigment", label: "Pigmentary Abnormality — Worse Eye", type: "select", options: ["No", "Yes"] },
      { key: "fellow_drusen", label: "Large Drusen — Fellow Eye", type: "select", options: ["No", "Yes"] },
      { key: "fellow_pigment", label: "Pigmentary Abnormality — Fellow Eye", type: "select", options: ["No", "Yes"] },
      { key: "advanced_fellow", label: "Advanced AMD in One Eye", type: "select", options: ["No", "Yes"] },
    ],
  },
  {
    key: "glaucoma_field_stage",
    name: "Glaucoma Field Stage (Hodapp-Parrish-Anderson)",
    purpose: "Field stage for one eye from the documented mean deviation",
    population: "Glaucoma or glaucoma suspect with a documented visual field",
    source: OPHTH_SCORE_SOURCES.hpa,
    variables: [
      { key: "eye", label: "Eye", type: "select", options: ["Right", "Left"] },
      { key: "md", label: "Mean Deviation (dB)", type: "number" },
    ],
  },
];

const VA_POINTS = {
  "No light perception": 60,
  "Light perception to hand movements": 70,
  "1/200 to 19/200": 80,
  "20/200 to 20/50": 90,
  "20/40 or better": 100,
};

const yes = (v) => str(v) === "Yes";

const calculateOts = (inputs) => {
  const missing = [];
  if (!VA_POINTS[inputs.initial_va]) missing.push("Initial visual acuity");
  ["globe_rupture", "endophthalmitis", "perforating_injury", "retinal_detachment", "rapd"].forEach((k) => {
    if (!["Yes", "No"].includes(str(inputs[k]))) {
      const variable = OPHTH_SCORES[0].variables.find((v) => v.key === k);
      missing.push(variable ? variable.label : k);
    }
  });
  if (missing.length) return { missing };

  let raw = VA_POINTS[inputs.initial_va];
  const deductions = [];
  const deduct = (flag, points, label) => {
    if (yes(inputs[flag])) {
      raw -= points;
      deductions.push(`${label} −${points}`);
    }
  };
  deduct("globe_rupture", 23, "Globe rupture");
  deduct("endophthalmitis", 17, "Endophthalmitis");
  deduct("perforating_injury", 14, "Perforating injury");
  deduct("retinal_detachment", 11, "Retinal detachment");
  deduct("rapd", 10, "Afferent pupillary defect");

  raw = Math.max(0, Math.min(100, raw));

  let category;
  if (raw >= 92) category = "5";
  else if (raw >= 81) category = "4";
  else if (raw >= 66) category = "3";
  else if (raw >= 45) category = "2";
  else category = "1";

  return {
    value: raw,
    label: `Raw score ${raw} — OTS category ${category}`,
    detail: `${deductions.length ? deductions.join(", ") : "No adverse findings deducted"}. Category ${category} of 5, where 5 is the best prognostic group. The probability of each final acuity level for this category is tabulated in the source — this record stores the category, not a derived percentage.`,
    interpretation:
      "A prognostic category at presentation, not a treatment decision and not an outcome prediction for this individual patient.",
  };
};

const calculateAreds = (inputs) => {
  const keys = ["worse_drusen", "worse_pigment", "fellow_drusen", "fellow_pigment", "advanced_fellow"];
  const missing = keys
    .filter((k) => !["Yes", "No"].includes(str(inputs[k])))
    .map((k) => OPHTH_SCORES[1].variables.find((v) => v.key === k).label);
  if (missing.length) return { missing };

  const score =
    (yes(inputs.worse_drusen) ? 1 : 0) +
    (yes(inputs.worse_pigment) ? 1 : 0) +
    (yes(inputs.fellow_drusen) ? 1 : 0) +
    (yes(inputs.fellow_pigment) ? 1 : 0) +
    (yes(inputs.advanced_fellow) ? 1 : 0);

  const band = score <= 1 ? "Lower risk of progression" : score <= 3 ? "Intermediate risk of progression" : "Higher risk of progression";

  return {
    value: score,
    label: `AREDS simplified severity score ${score} of 5`,
    detail: `${band}. The score counts the documented drusen, pigmentary and fellow-eye findings; the tabulated 5-year progression risk for each score is in the source and is not converted into a percentage here.`,
    interpretation:
      "A risk score for the eye being monitored. It supports the follow-up interval and the discussion with the patient; it never replaces the documented macular examination.",
  };
};

const calculateHpa = (inputs) => {
  const missing = [];
  if (!["Right", "Left"].includes(str(inputs.eye))) missing.push("Eye");
  const md = str(inputs.md) === "" ? NaN : Number(inputs.md);
  if (Number.isNaN(md)) missing.push("Mean deviation (dB)");
  if (missing.length) return { missing };

  const eyeLabel = inputs.eye === "Right" ? "Right" : "Left";
  let stage;
  let caveat = "";
  if (md > -6) stage = "Early";
  else if (md >= -12) stage = "Moderate";
  else {
    stage = "Advanced";
    caveat =
      " A mean deviation alone cannot establish an end-stage field: document whether the central field is preserved before recording end-stage disease.";
  }

  return {
    value: `${eyeLabel}: ${stage}`,
    label: `${eyeLabel} eye — ${stage} field loss (MD ${md} dB)`,
    detail: `Hodapp-Parrish-Anderson assigns the stage from the visual field mean deviation together with the field's pattern: better than −6 dB is early, −6 to −12 dB is moderate, and worse than −12 dB is advanced.${caveat}`,
    interpretation:
      "A field stage, recorded as a calculation from the documented field. Staging that also considers the optic disc and the patient's function is the clinician's decision.",
  };
};

export const calculateOphthScore = (key, inputs) => {
  const value = asObject(inputs);
  if (key === "ocular_trauma_score") return calculateOts(value);
  if (key === "amd_risk") return calculateAreds(value);
  if (key === "glaucoma_field_stage") return calculateHpa(value);
  return null;
};

const scoreByKey = (key) => OPHTH_SCORES.find((s) => s.key === key) || null;

// The text a saved note and its PDF carry for the scores field.
export const formatOphthScores = (value) => {
  const state = asObject(value);
  const lines = Object.keys(state)
    .map((key) => {
      const score = scoreByKey(key);
      if (!score) return null;
      const result = calculateOphthScore(key, asObject(state[key]));
      if (!result) return null;
      if (result.missing?.length) {
        return `${score.name}: not calculated — ${result.missing.join(", ")} not documented.`;
      }
      return `${score.name}: ${result.label}. ${result.detail}`;
    })
    .filter(Boolean);
  return lines.join("\n");
};

export const scoreMissingLabel = (result) =>
  result?.missing?.length ? `Not calculated — ${result.missing.join(", ").toLowerCase()} not documented` : "";

export { isBlank };