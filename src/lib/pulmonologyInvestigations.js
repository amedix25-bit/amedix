// Pulmonology / Respiratory Medicine — structured investigation documentation.
//
// One entry per test the respiratory clinician records in the note. Each entry
// captures the SAME six things for every test, so nothing is ever reported without
// its context:
//   indication · result · unit · interpretation · date · attachment
// and the reference of the AMedix laboratory or imaging request the result arrived
// through, so the note points at the real workflow instead of copying it.
//
// These are documentation fields only. AMedix never interprets a result, never
// applies a reference range on the clinician's behalf and never marks a result
// normal or abnormal by itself — the interpretation is what the clinician wrote.

export const PULM_INVESTIGATION_GROUPS = [
  {
    key: "lung_function",
    label: "Lung function and exercise",
    tests: [
      { key: "spirometry", label: "Spirometry (pre- and post-bronchodilator)", unit: "% predicted and litres", captures: ["FEV1", "FVC", "FEV1/FVC", "Reversibility"] },
      { key: "peak_flow", label: "Peak expiratory flow (PEF) and variability", unit: "L/min" },
      { key: "lung_volumes", label: "Lung volumes — TLC and residual volume", unit: "litres / % predicted" },
      { key: "dlco", label: "Diffusing capacity (DLCO)", unit: "% predicted" },
      { key: "flow_volume", label: "Flow-volume loop", unit: "L/s and litres" },
      { key: "six_minute_walk", label: "Six-minute walk test", unit: "metres" },
      { key: "exercise_test", label: "Cardiopulmonary exercise test", unit: "as reported" },
    ],
  },
  {
    key: "laboratory",
    label: "Laboratory",
    tests: [
      { key: "cbc", label: "Full blood count", unit: "g/L, ×10⁹/L" },
      { key: "eosinophils", label: "Blood eosinophil count", unit: "cells/µL or ×10⁹/L" },
      { key: "crp", label: "C-reactive protein (CRP)", unit: "mg/L" },
      { key: "esr", label: "Erythrocyte sedimentation rate (ESR)", unit: "mm/h" },
      { key: "procalcitonin", label: "Procalcitonin", unit: "ng/mL" },
      { key: "abg", label: "Arterial blood gas", unit: "pH, kPa/mmHg, HCO₃" },
      { key: "vbg", label: "Venous blood gas", unit: "pH, mmHg, HCO₃" },
      { key: "alpha1", label: "Alpha-1 antitrypsin", unit: "g/L, phenotype/genotype" },
      { key: "immunology", label: "Immunological tests (total IgE, specific IgE, IgG and subclasses, precipitins, ANA, ANCA)", unit: "as reported" },
    ],
  },
  {
    key: "microbiology",
    label: "Microbiology and molecular testing",
    tests: [
      { key: "sputum_culture", label: "Sputum culture and sensitivity", unit: "organism" },
      { key: "afb", label: "Acid-fast bacilli smear", unit: "result" },
      { key: "tb_molecular", label: "Tuberculosis molecular testing (e.g. WHO-recommended NAAT)", unit: "result and resistance" },
      { key: "blood_culture", label: "Blood culture", unit: "organism" },
      { key: "fungal", label: "Fungal culture / Aspergillus serology", unit: "result" },
    ],
  },
  {
    key: "imaging",
    label: "Imaging",
    tests: [
      { key: "chest_xray", label: "Chest X-ray", unit: "as reported" },
      { key: "ct_chest", label: "CT chest", unit: "as reported" },
      { key: "hrct", label: "High-resolution CT (HRCT)", unit: "as reported" },
      { key: "ctpa", label: "CT pulmonary angiography", unit: "as reported" },
      { key: "pet_ct", label: "PET-CT", unit: "as reported" },
      { key: "pleural_ultrasound", label: "Pleural ultrasound", unit: "as reported" },
    ],
  },
  {
    key: "procedures",
    label: "Procedures and sampling",
    tests: [
      { key: "bronchoscopy", label: "Bronchoscopy", unit: "as reported" },
      { key: "bal", label: "Bronchoalveolar lavage (BAL)", unit: "cell differential" },
      { key: "pleural_fluid", label: "Pleural fluid analysis", unit: "protein, LDH, cells, pH" },
    ],
  },
  {
    key: "sleep_cardiac",
    label: "Sleep and cardiac assessment",
    tests: [
      { key: "sleep_study", label: "Sleep study / polysomnography", unit: "AHI, oxygen nadir" },
      { key: "echocardiography", label: "Echocardiography", unit: "as reported" },
    ],
  },
];

export const PULM_INVESTIGATION_TESTS = PULM_INVESTIGATION_GROUPS.flatMap((g) =>
  g.tests.map((t) => ({ ...t, group: g.key, groupLabel: g.label })),
);

export const PULM_INVESTIGATION_COUNT = PULM_INVESTIGATION_TESTS.length;

export const pulmInvestigationTest = (key) => PULM_INVESTIGATION_TESTS.find((t) => t.key === key) || null;

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

export const pulmInvestigationValue = (items) => ({ __x: "pulm_investigations", items: items || {} });

export const pulmInvestigationItems = (value) => {
  const v = asObject(value);
  return asObject(v.items);
};

const FIELDS = [
  { key: "indication", label: "Indication" },
  { key: "result", label: "Result" },
  { key: "unit", label: "Unit" },
  { key: "interpretation", label: "Interpretation" },
  { key: "date", label: "Date" },
  { key: "request_ref", label: "AMedix laboratory / imaging request reference" },
  { key: "attachment_name", label: "Attachment" },
];

// What is still missing on a documented test. Indication, result, interpretation
// and date are the minimum a result needs to be usable later; an attachment is
// recorded only when one exists.
export const pulmInvestigationGaps = (entry) => {
  const e = asObject(entry);
  return ["indication", "result", "interpretation", "date"].filter((k) => !String(e[k] ?? "").trim());
};

export const pulmInvestigationDocumented = (value) =>
  Object.entries(pulmInvestigationItems(value)).filter(([, e]) => {
    const item = asObject(e);
    return FIELDS.some((f) => String(item[f.key] ?? "").trim());
  });

// Printed form: every documented test with its context, in catalogue order.
export const formatPulmInvestigations = (value) => {
  const items = pulmInvestigationItems(value);
  return PULM_INVESTIGATION_TESTS.map((t) => {
    const e = asObject(items[t.key]);
    const lines = FIELDS.map((f) => {
      const text = String(e[f.key] ?? "").trim();
      return text ? `${f.label}: ${text}` : "";
    }).filter(Boolean);
    if (!lines.length) return "";
    const gaps = pulmInvestigationGaps(e);
    const gapLine = gaps.length
      ? `Not documented: ${gaps.map((k) => FIELDS.find((f) => f.key === k)?.label || k).join(", ")}`
      : "";
    return [`${t.label}${t.unit ? ` (reported in ${t.unit})` : ""}`, ...lines, gapLine].filter(Boolean).join("\n");
  })
    .filter(Boolean)
    .join("\n\n");
};