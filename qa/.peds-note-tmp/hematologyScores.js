// Haematology validated assessment tools.
//
// Only tools whose published definition can be applied exactly are implemented,
// and every one of them refuses to produce a number from incomplete inputs: a
// score is shown only when every input it needs has been recorded. No score
// makes a diagnosis, and none of them replaces clinical judgement.
//
// Sources are recorded with each tool so the printed note carries the basis of
// the number beside it.

const num = (v) => {
  const n = Number(String(v ?? "").trim());
  return String(v ?? "").trim() !== "" && Number.isFinite(n) ? n : null;
};

const round = (n, places = 1) => Number(n.toFixed(places));

// Mentzer index — MCV ÷ red cell count. Published as a discrimination aid in
// microcytic anaemia, never as a diagnosis.
const mentzer = {
  key: "mentzer",
  label: "Mentzer index",
  source: "Mentzer WC, Ann Intern Med 1973 — MCV ÷ RBC count in microcytic anaemia",
  note: "A discrimination aid only: it neither confirms iron deficiency nor thalassaemia trait, and it does not apply when the count is not microcytic.",
  inputs: [
    { key: "mcv", label: "MCV", unit: "fL", type: "number" },
    { key: "rbc", label: "Red cell count", unit: "×10¹²/L", type: "number" },
  ],
  compute: (v) => {
    const mcv = num(v.mcv);
    const rbc = num(v.rbc);
    const missing = [];
    if (mcv === null) missing.push("MCV");
    if (rbc === null || rbc <= 0) missing.push("red cell count");
    if (missing.length) return { missing };
    const value = round(mcv / rbc, 2);
    return {
      value,
      interpretation:
        value < 13
          ? "Below 13 — thalassaemia trait is the more likely explanation of a microcytic anaemia"
          : value > 13
            ? "Above 13 — iron deficiency is the more likely explanation of a microcytic anaemia"
            : "Exactly 13 — not discriminating; interpret with the film and iron studies",
    };
  },
};

// Transferrin saturation — serum iron ÷ TIBC.
const transferrinSaturation = {
  key: "tsat",
  label: "Transferrin saturation",
  source: "Calculated: serum iron ÷ TIBC × 100",
  note: "Interpret against inflammation and the time of sampling; a single value does not establish iron deficiency or overload.",
  inputs: [
    { key: "iron", label: "Serum iron", unit: "µmol/L", type: "number" },
    { key: "tibc", label: "TIBC", unit: "µmol/L", type: "number" },
  ],
  compute: (v) => {
    const iron = num(v.iron);
    const tibc = num(v.tibc);
    const missing = [];
    if (iron === null) missing.push("serum iron");
    if (tibc === null || tibc <= 0) missing.push("TIBC");
    if (missing.length) return { missing };
    const value = round((iron / tibc) * 100, 1);
    return {
      value,
      unit: "%",
      interpretation:
        value < 20 ? "Below 20% — consistent with iron deficiency" : value > 50 ? "Above 50% — consistent with iron loading" : "20–50% — within the usual range",
    };
  },
};

// Absolute neutrophil count — WBC × neutrophil percentage.
const absoluteNeutrophils = {
  key: "anc",
  label: "Absolute neutrophil count",
  source: "Calculated: WBC × neutrophil percentage ÷ 100",
  note: "Enter the percentage the analyser or differential reported. Febrile neutropenia is a clinical diagnosis and is not defined by this number alone.",
  inputs: [
    { key: "wbc", label: "White cell count", unit: "×10⁹/L", type: "number" },
    { key: "neut_pct", label: "Neutrophils including bands", unit: "%", type: "number" },
  ],
  compute: (v) => {
    const wbc = num(v.wbc);
    const pct = num(v.neut_pct);
    const missing = [];
    if (wbc === null) missing.push("white cell count");
    if (pct === null) missing.push("neutrophil percentage");
    if (missing.length) return { missing };
    const value = round((wbc * pct) / 100, 2);
    return {
      value,
      unit: "×10⁹/L",
      interpretation:
        value < 0.5
          ? "Below 0.5 ×10⁹/L — severe neutropenia"
          : value < 1.0
            ? "0.5–1.0 ×10⁹/L — moderate neutropenia"
            : value < 1.5
              ? "1.0–1.5 ×10⁹/L — mild neutropenia"
              : "1.5 ×10⁹/L or above — not neutropenic by count",
    };
  },
};

// Corrected reticulocyte count — retic % × (patient Hct ÷ 45 %).
const correctedReticulocytes = {
  key: "corrected_retic",
  label: "Corrected reticulocyte count",
  source: "Calculated: reticulocyte % × (haematocrit ÷ 45)",
  note: "The corrected count adjusts for the degree of anaemia. It does not replace the reticulocyte production index, which additionally requires a maturation factor.",
  inputs: [
    { key: "retic_pct", label: "Reticulocyte count", unit: "%", type: "number" },
    { key: "hct", label: "Haematocrit", unit: "L/L", type: "number" },
  ],
  compute: (v) => {
    const retic = num(v.retic_pct);
    const hct = num(v.hct);
    const missing = [];
    if (retic === null) missing.push("reticulocyte count");
    if (hct === null || hct <= 0) missing.push("haematocrit");
    if (missing.length) return { missing };
    const normalHct = hct <= 1 ? 0.45 : 45;
    const value = round(retic * (hct / normalHct), 2);
    return {
      value,
      unit: "%",
      interpretation: `${value}% after correction — interpret against the haemoglobin and the marrow response expected for that degree of anaemia`,
    };
  },
};

// ISTH overt DIC score.
const isthDic = {
  key: "isth_dic",
  label: "ISTH overt DIC score",
  source: "Taylor et al., Thromb Haemost 2001 — ISTH Scientific and Standardization Committee",
  note: "Applies only where an underlying condition known to cause DIC is present. A score below 5 does not exclude DIC; the ISTH advises repeating the score.",
  inputs: [
    {
      key: "platelets",
      label: "Platelet count",
      type: "select",
      options: ["Above 100 ×10⁹/L (0)", "Below 100 ×10⁹/L (1)", "Below 50 ×10⁹/L (2)"],
      points: [0, 1, 2],
    },
    {
      key: "fibrin_marker",
      label: "Elevated fibrin-related marker (D-dimer / FDP)",
      type: "select",
      options: ["No increase (0)", "Moderate increase (1)", "Strong increase (2)"],
      points: [0, 1, 2],
    },
    {
      key: "pt_prolongation",
      label: "Prothrombin time prolongation",
      type: "select",
      options: ["Less than 3 s (0)", "3 to 6 s (1)", "More than 6 s (2)"],
      points: [0, 1, 2],
    },
    {
      key: "fibrinogen",
      label: "Fibrinogen",
      type: "select",
      options: ["Above 1 g/L (0)", "Below 1 g/L (1)"],
      points: [0, 1],
    },
  ],
  compute: (v) => {
    let total = 0;
    const missing = [];
    isthDic.inputs.forEach((input) => {
      const index = input.options.indexOf(v[input.key]);
      if (index === -1) {
        missing.push(input.label);
      } else {
        total += input.points[index];
      }
    });
    if (missing.length) return { missing };
    return {
      value: total,
      unit: "points",
      interpretation:
        total >= 5
          ? "5 or more — compatible with overt DIC; correlate with the clinical picture and repeat"
          : "Below 5 — does not meet the ISTH criteria for overt DIC; repeat the score if the picture is evolving",
    };
  },
};

// 4Ts score for heparin-induced thrombocytopenia.
const hit4Ts = {
  key: "hit_4ts",
  label: "4Ts score (heparin-induced thrombocytopenia)",
  source: "Lo et al., J Thromb Haemost 2006 — 4Ts pretest probability score",
  note: "A low score makes HIT unlikely; an intermediate or high score requires the heparin to be stopped and an immunoassay sent. The score never substitutes for the laboratory result.",
  inputs: [
    {
      key: "thrombocytopenia",
      label: "Degree of thrombocytopenia",
      type: "select",
      options: [
        "Platelet fall >50% and nadir ≥20 ×10⁹/L (2)",
        "Platelet fall 30–50% or nadir 10–19 ×10⁹/L (1)",
        "Platelet fall <30% or nadir <10 ×10⁹/L (0)",
      ],
      points: [2, 1, 0],
    },
    {
      key: "timing",
      label: "Timing of the platelet fall",
      type: "select",
      options: [
        "5–10 days after starting heparin, or ≤1 day with exposure in the past 30 days (2)",
        "After day 10, or ≤1 day with exposure 30–100 days earlier, or timing unclear (1)",
        "≤4 days with no recent exposure (0)",
      ],
      points: [2, 1, 0],
    },
    {
      key: "thrombosis",
      label: "Thrombosis or other sequelae",
      type: "select",
      options: [
        "New confirmed thrombosis (2)",
        "Progressive or recurrent thrombosis, or suspected but unconfirmed (1)",
        "None (0)",
      ],
      points: [2, 1, 0],
    },
    {
      key: "other_causes",
      label: "Other causes of thrombocytopenia",
      type: "select",
      options: ["None apparent (2)", "Possible (1)", "Definite (0)"],
      points: [2, 1, 0],
    },
  ],
  compute: (v) => {
    let total = 0;
    const missing = [];
    hit4Ts.inputs.forEach((input) => {
      const index = input.options.indexOf(v[input.key]);
      if (index === -1) {
        missing.push(input.label);
      } else {
        total += input.points[index];
      }
    });
    if (missing.length) return { missing };
    return {
      value: total,
      unit: "points",
      interpretation:
        total >= 6
          ? "6 or more — high probability; stop heparin and send the immunoassay"
          : total >= 4
            ? "4–5 — intermediate probability; stop heparin and send the immunoassay"
            : "0–3 — low probability; HIT is unlikely, consider other causes",
    };
  },
};

// HLH-2004 diagnostic criteria count.
const hlhCriteria = {
  key: "hlh_2004",
  label: "HLH-2004 diagnostic criteria",
  source: "Henter et al., Pediatr Blood Cancer 2007 — HLH-2004 diagnostic guidelines",
  note: "Five of the eight criteria are required where a molecular diagnosis is absent. A count of criteria is not the diagnosis: the treating clinician documents the assessment.",
  inputs: [
    {
      key: "criteria",
      label: "Criteria documented",
      type: "multi",
      options: [
        "Fever ≥38.5 °C",
        "Splenomegaly",
        "Cytopenia affecting ≥2 lineages",
        "Hypertriglyceridaemia and/or hypofibrinogenaemia",
        "Haemophagocytosis in marrow, spleen or lymph node",
        "Low or absent NK-cell activity",
        "Ferritin ≥500 µg/L",
        "Soluble CD25 ≥2400 U/mL",
      ],
    },
    {
      key: "molecular_diagnosis",
      label: "Molecular diagnosis of familial HLH documented",
      type: "select",
      options: ["No", "Yes"],
    },
  ],
  compute: (v) => {
    const selected = Array.isArray(v.criteria) ? v.criteria : [];
    if (!v.molecular_diagnosis) return { missing: ["whether a molecular diagnosis is documented"] };
    if (v.molecular_diagnosis === "Yes") {
      return {
        value: "Molecular diagnosis documented",
        interpretation:
          "A documented molecular diagnosis of familial HLH is sufficient on its own; the criteria count is recorded for completeness.",
      };
    }
    if (!selected.length) return { missing: ["at least one criterion assessment"] };
    return {
      value: `${selected.length} of 8`,
      interpretation:
        selected.length >= 5
          ? "5 or more criteria documented — meets the HLH-2004 criteria (molecular diagnosis absent)"
          : "Fewer than 5 criteria documented — does not meet the HLH-2004 criteria on this assessment",
    };
  },
};

export const HEMA_SCORES = [mentzer, transferrinSaturation, absoluteNeutrophils, correctedReticulocytes, isthDic, hit4Ts, hlhCriteria];

export const hemaScore = (key) => HEMA_SCORES.find((s) => s.key === key) || null;
export const HEMA_SCORE_COUNT = HEMA_SCORES.length;

// Reading a saved score. The result is always recomputed from the documented
// inputs, so the printed note and the form can never disagree, and a score with
// missing inputs prints the missing inputs instead of a number.
export const readHemaScore = (def, stored) => {
  const v = stored && typeof stored === "object" ? stored : {};
  const result = def.compute(v);
  const documented = def.inputs.some((input) =>
    input.type === "multi" ? Array.isArray(v[input.key]) && v[input.key].length > 0 : String(v[input.key] ?? "").trim() !== ""
  );
  return { documented, ...result };
};

export const formatHemaScores = (value) => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const lines = [];
  Object.entries(v).forEach(([key, stored]) => {
    const def = hemaScore(key);
    if (!def) return;
    const read = readHemaScore(def, stored);
    if (!read.documented) return;
    if (read.missing && read.missing.length) {
      lines.push(`${def.label}: not scored — missing ${read.missing.join(", ")}`);
    } else {
      lines.push(`${def.label}: ${read.value}${read.unit ? ` ${read.unit}` : ""} — ${read.interpretation}`);
    }
    lines.push(`  Source: ${def.source}`);
  });
  if (!lines.length) return "";
  return lines.join("\n");
};