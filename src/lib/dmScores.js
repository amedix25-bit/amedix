// Dermatology — validated instruments and severity scores.
//
// Every score is computed ONLY from values documented in the note. A missing item
// leaves the score uncalculated and names exactly what is missing: nothing is
// estimated, defaulted or inferred, and a blank is never read as zero or as normal.
//
// The item wording and weights belong to the published instrument named beside each
// score. Only the score and its published interpretation bands are produced — no
// probability, prognosis or treatment recommendation is invented, and a score is a
// documented observation, never a diagnosis and never a treatment decision.

import { asObject, num } from "@/lib/fmFieldKit";
import { FM_SCORES, fmScore, calculateFmScore } from "@/lib/fmScores";

// ---------------------------------------------------------------- helpers
const AREA_GRADES = [
  { value: "0", label: "0 — no involvement" },
  { value: "1", label: "1 — under 10%" },
  { value: "2", label: "2 — 10 to under 30%" },
  { value: "3", label: "3 — 30 to under 50%" },
  { value: "4", label: "4 — 50 to under 70%" },
  { value: "5", label: "5 — 70 to under 90%" },
  { value: "6", label: "6 — 90 to 100%" },
];

const SEVERITY_0_4 = [
  { value: "0", label: "0 — none" },
  { value: "1", label: "1 — mild" },
  { value: "2", label: "2 — moderate" },
  { value: "3", label: "3 — marked" },
  { value: "4", label: "4 — very marked" },
];

const SEVERITY_0_3 = [
  { value: "0", label: "0 — none" },
  { value: "1", label: "1 — mild" },
  { value: "2", label: "2 — moderate" },
  { value: "3", label: "3 — severe" },
];

const grade = (v, key, label, missing) => {
  const n = num(v[key]);
  if (n === null || n < 0) {
    missing.push(label);
    return 0;
  }
  return n;
};

// PASI / EASI share the four-region structure and its published weights.
const REGIONS = [
  { key: "head", label: "Head and neck", weight: 0.1 },
  { key: "upper", label: "Upper limbs", weight: 0.2 },
  { key: "trunk", label: "Trunk", weight: 0.3 },
  { key: "lower", label: "Lower limbs", weight: 0.4 },
];

const regionVariables = () =>
  REGIONS.flatMap((r) => [
    { key: `${r.key}_area`, label: `${r.label} — area involved`, type: "select", options: AREA_GRADES },
    { key: `${r.key}_erythema`, label: `${r.label} — erythema`, type: "select", options: SEVERITY_0_4 },
    { key: `${r.key}_induration`, label: `${r.label} — induration / thickness`, type: "select", options: SEVERITY_0_4 },
    { key: `${r.key}_desquamation`, label: `${r.label} — desquamation / scaling`, type: "select", options: SEVERITY_0_4 },
  ]);

const regionTotal = (v, missing) =>
  REGIONS.reduce((sum, r) => {
    const area = grade(v, `${r.key}_area`, `${r.label} — area involved`, missing);
    const e = grade(v, `${r.key}_erythema`, `${r.label} — erythema`, missing);
    const i = grade(v, `${r.key}_induration`, `${r.label} — induration / thickness`, missing);
    const d = grade(v, `${r.key}_desquamation`, `${r.label} — desquamation / scaling`, missing);
    return sum + (e + i + d) * area * r.weight;
  }, 0);

const pasiBand = (value) => {
  if (value === 0) return "PASI 0 — no measurable disease documented";
  if (value < 5) return "PASI under 5 — limited disease as measured by this instrument";
  if (value < 10) return "PASI 5 to under 10 — moderate disease as measured by this instrument";
  if (value < 20) return "PASI 10 to under 20 — moderate to severe disease as measured by this instrument";
  return "PASI 20 or above — severe disease as measured by this instrument";
};

// ---------------------------------------------------------------- registry
export const DM_ONLY_SCORES = [
  {
    key: "bsa",
    name: "Body surface area involved (rule of nines)",
    purpose: "Share of body surface affected, summed from the regions examined",
    population: "Adults. Paediatric proportions differ and must be assessed with an age-appropriate chart.",
    source: {
      organization: "American Academy of Dermatology (AAD)",
      title: "AAD Clinical Practice Guidelines — severity assessment",
      url: "https://www.aad.org/",
    },
    variables: [
      { key: "head", label: "Head and neck", type: "select", options: [{ value: "Yes", label: "Involved" }, { value: "No", label: "Not involved" }] },
      { key: "arm_right", label: "Right upper limb", type: "select", options: [{ value: "Yes", label: "Involved" }, { value: "No", label: "Not involved" }] },
      { key: "arm_left", label: "Left upper limb", type: "select", options: [{ value: "Yes", label: "Involved" }, { value: "No", label: "Not involved" }] },
      { key: "trunk_front", label: "Trunk — anterior", type: "select", options: [{ value: "Yes", label: "Involved" }, { value: "No", label: "Not involved" }] },
      { key: "trunk_back", label: "Trunk — posterior", type: "select", options: [{ value: "Yes", label: "Involved" }, { value: "No", label: "Not involved" }] },
      { key: "leg_right", label: "Right lower limb", type: "select", options: [{ value: "Yes", label: "Involved" }, { value: "No", label: "Not involved" }] },
      { key: "leg_left", label: "Left lower limb", type: "select", options: [{ value: "Yes", label: "Involved" }, { value: "No", label: "Not involved" }] },
      { key: "genitalia", label: "Genitalia", type: "select", options: [{ value: "Yes", label: "Involved" }, { value: "No", label: "Not involved" }] },
      { key: "palm_areas", label: "Additional involvement, counted in patient palm areas (one palm ≈ 1%)", type: "number", unit: "palm areas", min: 0, max: 100 },
    ],
    calculate: (v) => {
      const missing = [];
      const regions = [
        ["head", "Head and neck", 9],
        ["arm_right", "Right upper limb", 9],
        ["arm_left", "Left upper limb", 9],
        ["trunk_front", "Trunk — anterior", 18],
        ["trunk_back", "Trunk — posterior", 18],
        ["leg_right", "Right lower limb", 18],
        ["leg_left", "Left lower limb", 18],
      ];
      let total = 0;
      regions.forEach(([key, label, pct]) => {
        if (v[key] === "Yes") total += pct;
        else if (v[key] !== "No") missing.push(label);
      });
      if (v.genitalia === "Yes") total += 1;
      else if (v.genitalia !== "No") missing.push("Genitalia");
      const palms = num(v.palm_areas);
      if (palms !== null && palms > 0) total += palms;
      if (missing.length) return { missing };
      const value = Math.min(100, Math.round(total * 10) / 10);
      return {
        value,
        unit: "%",
        band:
          value === 0
            ? "No body surface involvement is documented for any listed region."
            : `${value}% of body surface documented as involved by the regions examined. Adult rule-of-nines proportions were used; this is a description of extent, not a treatment threshold.`,
        missing,
      };
    },
  },
  {
    key: "pasi",
    name: "PASI — Psoriasis Area and Severity Index",
    purpose: "Documented psoriasis severity across four body regions",
    population: "Adults and children with psoriasis; a severity description, not a treatment decision",
    source: {
      organization: "American Academy of Dermatology (AAD) / EADV",
      title: "PASI as reported in psoriasis guidance",
      url: "https://www.aad.org/",
    },
    variables: regionVariables(),
    calculate: (v) => {
      const missing = [];
      const value = Math.round(regionTotal(v, missing) * 10) / 10;
      if (missing.length) return { missing };
      return { value, unit: "PASI", band: pasiBand(value), missing };
    },
  },
  {
    key: "easi",
    name: "EASI — Eczema Area and Severity Index",
    purpose: "Documented atopic dermatitis extent and intensity across four body regions",
    population: "Adults and children with atopic dermatitis",
    source: {
      organization: "American Academy of Dermatology (AAD)",
      title: "EASI as reported in atopic dermatitis guidance",
      url: "https://www.aad.org/",
    },
    variables: regionVariables(),
    calculate: (v) => {
      const missing = [];
      const value = Math.round(regionTotal(v, missing) * 10) / 10;
      if (missing.length) return { missing };
      const band =
        value === 0
          ? "EASI 0 — no signs documented"
          : value < 7
            ? "EASI under 7 — mild signs as measured by this instrument"
            : value < 21
              ? "EASI 7 to under 21 — moderate signs as measured by this instrument"
              : value < 50
                ? "EASI 21 to under 50 — severe signs as measured by this instrument"
                : "EASI 50 or above — very severe signs as measured by this instrument";
      return { value, unit: "EASI", band, missing };
    },
  },
  {
    key: "scorad",
    name: "SCORAD — SCORing Atopic Dermatitis",
    purpose: "Extent, intensity and patient-reported symptoms of atopic dermatitis",
    population: "Children and adults with atopic dermatitis",
    source: {
      organization: "European Academy of Dermatology and Venereology (EADV)",
      title: "SCORAD as reported in atopic dermatitis guidance",
      url: "https://www.eadv.org/",
    },
    variables: [
      { key: "extent", label: "Extent — body surface area involved", type: "number", unit: "%", min: 0, max: 100 },
      { key: "erythema", label: "Erythema", type: "select", options: SEVERITY_0_3 },
      { key: "oedema", label: "Oedema / papulation", type: "select", options: SEVERITY_0_3 },
      { key: "oozing", label: "Oozing / crusting", type: "select", options: SEVERITY_0_3 },
      { key: "excoriation", label: "Excoriation", type: "select", options: SEVERITY_0_3 },
      { key: "lichenification", label: "Lichenification", type: "select", options: SEVERITY_0_3 },
      { key: "dryness", label: "Dryness (assessed on uninvolved skin)", type: "select", options: SEVERITY_0_3 },
      { key: "itch", label: "Itch — average over the last 3 days (0–10)", type: "number", min: 0, max: 10 },
      { key: "sleep", label: "Sleep loss — average over the last 3 days (0–10)", type: "number", min: 0, max: 10 },
    ],
    calculate: (v) => {
      const missing = [];
      const extent = num(v.extent);
      if (extent === null || extent < 0 || extent > 100) missing.push("Extent — body surface area involved");
      const intensityKeys = [
        ["erythema", "Erythema"],
        ["oedema", "Oedema / papulation"],
        ["oozing", "Oozing / crusting"],
        ["excoriation", "Excoriation"],
        ["lichenification", "Lichenification"],
        ["dryness", "Dryness"],
      ];
      let intensity = 0;
      intensityKeys.forEach(([key, label]) => {
        intensity += grade(v, key, label, missing);
      });
      const a = extent === null ? 0 : extent;
      const objective = Math.round((a / 5 + (7 * intensity) / 2) * 10) / 10;
      const itch = num(v.itch);
      const sleep = num(v.sleep);
      const subjectiveComplete = itch !== null && sleep !== null;
      const subjective = subjectiveComplete ? itch + sleep : null;
      if (missing.length) return { missing };
      const total = subjectiveComplete ? Math.round((objective + subjective) * 10) / 10 : null;
      const band =
        total === null
          ? `Objective SCORAD ${objective} (extent and intensity only — itch and sleep were not documented, so the total SCORAD cannot be calculated).`
          : total < 25
            ? `SCORAD ${total} — mild disease as measured by this instrument`
            : total < 50
              ? `SCORAD ${total} — moderate disease as measured by this instrument`
              : `SCORAD ${total} — severe disease as measured by this instrument`;
      return { value: total === null ? objective : total, unit: total === null ? "objective SCORAD" : "SCORAD", band, missing };
    },
  },
  {
    key: "dlqi",
    name: "DLQI — Dermatology Life Quality Index",
    purpose: "Patient-reported effect of the skin condition on daily life",
    population: "Adults; the wording is validated for patients 16 years and over",
    source: {
      organization: "British Association of Dermatologists (BAD)",
      title: "DLQI as reported in dermatology guidance",
      url: "https://www.bad.org.uk/",
    },
    variables: [
      { key: "q1", label: "1. Itch, soreness, aching or stinging", type: "select", options: SEVERITY_0_3 },
      { key: "q2", label: "2. Embarrassment or self-consciousness", type: "select", options: SEVERITY_0_3 },
      { key: "q3", label: "3. Shopping, housework or gardening", type: "select", options: SEVERITY_0_3 },
      { key: "q4", label: "4. Clothes worn", type: "select", options: SEVERITY_0_3 },
      { key: "q5", label: "5. Social or leisure activities", type: "select", options: SEVERITY_0_3 },
      { key: "q6", label: "6. Sport", type: "select", options: SEVERITY_0_3 },
      { key: "q7", label: "7. Working or studying", type: "select", options: SEVERITY_0_3 },
      { key: "q8", label: "8. Relationships with partner, friends or relatives", type: "select", options: SEVERITY_0_3 },
      { key: "q9", label: "9. Sexual difficulties", type: "select", options: SEVERITY_0_3 },
      { key: "q10", label: "10. Treatment — how much of a problem", type: "select", options: SEVERITY_0_3 },
    ],
    calculate: (v) => {
      const missing = [];
      let total = 0;
      for (let i = 1; i <= 10; i += 1) {
        total += grade(v, `q${i}`, `Question ${i}`, missing);
      }
      if (missing.length) return { missing };
      const band =
        total <= 1
          ? "DLQI 0–1 — no effect on the patient's life as reported"
          : total <= 5
            ? "DLQI 2–5 — small effect on the patient's life as reported"
            : total <= 10
              ? "DLQI 6–10 — moderate effect on the patient's life as reported"
              : total <= 20
                ? "DLQI 11–20 — very large effect on the patient's life as reported"
                : "DLQI 21–30 — extremely large effect on the patient's life as reported";
      return { value: total, unit: "DLQI", band, missing };
    },
  },
  {
    key: "iga_psoriasis",
    name: "IGA — Investigator's Global Assessment (psoriasis)",
    purpose: "The clinician's documented global severity judgement on a 0–4 scale",
    population: "Adults and children with psoriasis",
    source: {
      organization: "American Academy of Dermatology (AAD)",
      title: "IGA as reported in psoriasis guidance",
      url: "https://www.aad.org/",
    },
    variables: [
      {
        key: "score",
        label: "Global assessment",
        type: "select",
        options: [
          { value: "0", label: "0 — clear" },
          { value: "1", label: "1 — almost clear" },
          { value: "2", label: "2 — mild" },
          { value: "3", label: "3 — moderate" },
          { value: "4", label: "4 — severe" },
        ],
      },
    ],
    calculate: (v) => {
      const missing = [];
      const value = grade(v, "score", "Global assessment", missing);
      if (missing.length) return { missing };
      const labels = ["clear", "almost clear", "mild", "moderate", "severe"];
      return { value, unit: "IGA", band: `IGA ${value} — ${labels[value] || "recorded"} on this scale.`, missing };
    },
  },
  {
    key: "hurley",
    name: "Hurley staging — hidradenitis suppurativa",
    purpose: "Documented stage of hidradenitis suppurativa",
    population: "Adults and adolescents with hidradenitis suppurativa",
    source: {
      organization: "European Academy of Dermatology and Venereology (EADV)",
      title: "Hurley staging as reported in hidradenitis suppurativa guidance",
      url: "https://www.eadv.org/",
    },
    variables: [
      {
        key: "stage",
        label: "Hurley stage",
        type: "select",
        options: [
          { value: "I", label: "Stage I — single or multiple abscesses without sinus tracts or scarring" },
          { value: "II", label: "Stage II — recurrent abscesses with sinus tracts and scarring, widely separated lesions" },
          { value: "III", label: "Stage III — diffuse or near-diffuse involvement with interconnected sinus tracts" },
        ],
      },
    ],
    calculate: (v) => {
      const missing = [];
      const stage = v.stage;
      if (!["I", "II", "III"].includes(stage)) missing.push("Hurley stage");
      if (missing.length) return { missing };
      return {
        value: stage,
        unit: "Hurley",
        band: `Hurley stage ${stage} documented. The stage describes the pattern of disease and does not by itself select a treatment.`,
        missing,
      };
    },
  },
  {
    key: "uas7",
    name: "UAS7 — Urticaria Activity Score over 7 days",
    purpose: "Weekly urticaria activity from the patient's daily diary",
    population: "Adults and adolescents with chronic spontaneous urticaria",
    source: {
      organization: "European Academy of Dermatology and Venereology (EADV)",
      title: "UAS7 as reported in urticaria guidance",
      url: "https://www.eadv.org/",
    },
    variables: Array.from({ length: 7 }, (_, i) => ({
      key: `day${i + 1}`,
      label: `Day ${i + 1} — wheals (0–3) plus itch (0–3), total`,
      type: "select",
      options: [
        { value: "0", label: "0 — none" },
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "5", label: "5" },
        { value: "6", label: "6 — maximum" },
      ],
    })),
    calculate: (v) => {
      const missing = [];
      let total = 0;
      for (let i = 1; i <= 7; i += 1) {
        total += grade(v, `day${i}`, `Day ${i} score`, missing);
      }
      if (missing.length) return { missing };
      const band =
        total === 0
          ? "UAS7 0 — no urticaria activity recorded over the 7 days"
          : total < 7
            ? "UAS7 1–6 — well controlled urticaria activity as recorded"
            : total < 16
              ? "UAS7 7–15 — mild urticaria activity as recorded"
              : total < 28
                ? "UAS7 16–27 — moderate urticaria activity as recorded"
                : "UAS7 28–42 — severe urticaria activity as recorded";
      return { value: total, unit: "UAS7", band, missing };
    },
  },
];

// The dermatology panel offers its own instruments plus the shared calculations that
// are equally used in dermatology (BMI for systemic therapy, eGFR for methotrexate
// and ciclosporin dosing review).
const SHARED_KEYS = ["bmi", "egfr"];

export const DM_SHARED_SCORES = FM_SCORES.filter((s) => SHARED_KEYS.includes(s.key));

export const DM_SCORES = [...DM_ONLY_SCORES, ...DM_SHARED_SCORES];

export const dmScore = (key) => DM_ONLY_SCORES.find((s) => s.key === key) || fmScore(key);

// The one calculation entry point for dermatology notes. Returns null for an unknown
// key and an object with `missing` when the documented items are not yet complete.
export const calculateDmScore = (key, inputs) => {
  const score = dmScore(key);
  if (!score) return null;
  return score.calculate(asObject(inputs));
};

export const dmScoreInputs = (values, fieldKey, scoreKey) =>
  asObject(asObject(asObject(values)[fieldKey])[scoreKey]);

export { calculateFmScore };