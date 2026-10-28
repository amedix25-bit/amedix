// Structured kidney-laboratory documentation for the Nephrology note types.
//
// Nothing here orders a test: the catalogue is only a search index, and a test
// enters the note when the clinician selects it and documents the result. Each
// entry records the result with its date, units, reference range, previous
// value and comment. The abnormal flag and the trend are CALCULATED from the
// numbers that were entered — they are shown as calculated, never as a
// laboratory-reported interpretation, and they are never inferred when a value
// or a reference range is missing.

export const RENAL_LAB_PANELS = [
  { key: "chemistry", label: "Serum Chemistry & Renal Function" },
  { key: "haematology", label: "Haematology, Iron & Metabolic Bone" },
  { key: "urine", label: "Urine Studies" },
  { key: "immunology", label: "Immunology, Infection & Disease-Specific Tests" },
];

// How the information reached the note. Measured / historical / clinician-
// reported values are kept distinct so a historical figure is never read as
// today's result, and a pending test is never read as a normal one.
export const RENAL_LAB_STATUSES = [
  "Measured — this encounter",
  "Historical result",
  "Reported by patient",
  "Reported by referring clinician",
  "Pending — no result yet",
  "Unavailable",
  "Not done",
];

const RANGE_NOTE = "adult reference — confirm with the reporting laboratory";

export const RENAL_ANALYTES = [
  // ---- Serum chemistry & renal function ----
  { key: "creatinine", name: "Serum creatinine", panel: "chemistry", units: "µmol/L", low: 59, high: 104 },
  { key: "egfr", name: "eGFR (CKD-EPI)", panel: "chemistry", units: "mL/min/1.73 m²", low: 90, high: null, rangeText: "≥ 90" },
  { key: "urea", name: "Blood urea", panel: "chemistry", units: "mmol/L", low: 2.5, high: 7.1 },
  { key: "sodium", name: "Sodium", panel: "chemistry", units: "mmol/L", low: 135, high: 145 },
  { key: "potassium", name: "Potassium", panel: "chemistry", units: "mmol/L", low: 3.5, high: 5.0 },
  { key: "chloride", name: "Chloride", panel: "chemistry", units: "mmol/L", low: 98, high: 106 },
  { key: "bicarbonate", name: "Bicarbonate", panel: "chemistry", units: "mmol/L", low: 22, high: 29 },
  { key: "calcium", name: "Corrected calcium", panel: "chemistry", units: "mmol/L", low: 2.15, high: 2.55 },
  { key: "phosphate", name: "Phosphate", panel: "chemistry", units: "mmol/L", low: 0.81, high: 1.45 },
  { key: "magnesium", name: "Magnesium", panel: "chemistry", units: "mmol/L", low: 0.66, high: 1.07 },
  { key: "albumin", name: "Serum albumin", panel: "chemistry", units: "g/L", low: 35, high: 50 },
  { key: "uric_acid", name: "Uric acid", panel: "chemistry", units: "µmol/L", low: 150, high: 420 },
  { key: "glucose", name: "Random plasma glucose", panel: "chemistry", units: "mmol/L", low: 3.9, high: 7.8 },
  { key: "hba1c", name: "HbA1c", panel: "chemistry", units: "%", low: 4.0, high: 5.6 },
  { key: "crp", name: "C-reactive protein", panel: "chemistry", units: "mg/L", low: 0, high: 5 },
  { key: "pth", name: "Parathyroid hormone (intact)", panel: "chemistry", units: "pg/mL", low: 15, high: 65 },
  { key: "vitamin_d", name: "25-hydroxy vitamin D", panel: "chemistry", units: "nmol/L", low: 75, high: 250 },
  { key: "cystatin_c", name: "Cystatin C", panel: "chemistry", units: "mg/L", low: 0.5, high: 1.0 },
  { key: "osmolality", name: "Serum osmolality", panel: "chemistry", units: "mOsm/kg", low: 275, high: 295 },

  // ---- Haematology, iron & metabolic bone ----
  { key: "haemoglobin", name: "Haemoglobin", panel: "haematology", units: "g/L", low: 120, high: 170 },
  { key: "mcv", name: "Mean corpuscular volume (MCV)", panel: "haematology", units: "fL", low: 80, high: 100 },
  { key: "wbc", name: "White cell count", panel: "haematology", units: "×10⁹/L", low: 4.0, high: 11.0 },
  { key: "platelets", name: "Platelet count", panel: "haematology", units: "×10⁹/L", low: 150, high: 450 },
  { key: "ferritin", name: "Ferritin", panel: "haematology", units: "µg/L", low: 20, high: 300 },
  { key: "transferrin_saturation", name: "Transferrin saturation", panel: "haematology", units: "%", low: 20, high: 50 },
  { key: "reticulocytes", name: "Reticulocyte count", panel: "haematology", units: "%", low: 0.5, high: 2.5 },
  { key: "inr", name: "INR", panel: "haematology", units: "ratio", low: 0.8, high: 1.2 },

  // ---- Urine studies ----
  { key: "uacr", name: "Urine albumin-to-creatinine ratio (UACR)", panel: "urine", units: "mg/mmol", low: 0, high: 3 },
  { key: "upcr", name: "Urine protein-to-creatinine ratio (UPCR)", panel: "urine", units: "mg/mmol", low: 0, high: 15 },
  { key: "urine_protein_dipstick", name: "Urine protein — dipstick", panel: "urine", units: "", rangeText: "Negative", textOnly: true },
  { key: "urine_blood_dipstick", name: "Urine blood — dipstick", panel: "urine", units: "", rangeText: "Negative", textOnly: true },
  { key: "urine_leukocytes", name: "Urine leukocyte esterase / nitrites", panel: "urine", units: "", rangeText: "Negative", textOnly: true },
  { key: "urine_rbc", name: "Urine red cells (microscopy)", panel: "urine", units: "/hpf", low: 0, high: 2 },
  { key: "urine_wbc", name: "Urine white cells (microscopy)", panel: "urine", units: "/hpf", low: 0, high: 5 },
  { key: "urine_casts", name: "Urine casts", panel: "urine", units: "", rangeText: "None / occasional hyaline", textOnly: true },
  { key: "urine_sodium", name: "Urine sodium (spot)", panel: "urine", units: "mmol/L", low: 20, high: 40 },
  { key: "urine_osmolality", name: "Urine osmolality", panel: "urine", units: "mOsm/kg", low: 300, high: 900 },
  { key: "albumin_excretion_24h", name: "24-hour urine albumin", panel: "urine", units: "mg/24h", low: 0, high: 30 },

  // ---- Immunology, infection & disease-specific tests ----
  { key: "ana", name: "Antinuclear antibody (ANA)", panel: "immunology", units: "", rangeText: "Negative", textOnly: true },
  { key: "anti_dsdna", name: "Anti-double-stranded DNA", panel: "immunology", units: "IU/mL", low: 0, high: 30 },
  { key: "complement_c3", name: "Complement C3", panel: "immunology", units: "g/L", low: 0.9, high: 1.8 },
  { key: "complement_c4", name: "Complement C4", panel: "immunology", units: "g/L", low: 0.1, high: 0.4 },
  { key: "anca", name: "ANCA (PR3 / MPO)", panel: "immunology", units: "", rangeText: "Negative", textOnly: true },
  { key: "anti_gbm", name: "Anti-glomerular basement membrane antibody", panel: "immunology", units: "", rangeText: "Negative", textOnly: true },
  { key: "anti_pla2r", name: "Anti-phospholipase A2 receptor antibody", panel: "immunology", units: "", rangeText: "Negative", textOnly: true },
  { key: "cryoglobulins", name: "Cryoglobulins", panel: "immunology", units: "", rangeText: "Negative", textOnly: true },
  { key: "serum_free_light_chains", name: "Serum free light chain ratio", panel: "immunology", units: "ratio", low: 0.26, high: 1.65 },
  { key: "serum_electrophoresis", name: "Serum protein electrophoresis / paraprotein", panel: "immunology", units: "", rangeText: "No paraprotein detected", textOnly: true },
  { key: "hbsag", name: "Hepatitis B surface antigen", panel: "immunology", units: "", rangeText: "Negative", textOnly: true },
  { key: "anti_hcv", name: "Hepatitis C antibody", panel: "immunology", units: "", rangeText: "Negative", textOnly: true },
  { key: "hiv", name: "HIV antigen / antibody", panel: "immunology", units: "", rangeText: "Negative", textOnly: true },
  { key: "blood_culture", name: "Blood culture", panel: "immunology", units: "", rangeText: "No growth", textOnly: true },
];

const analyteByKey = new Map(RENAL_ANALYTES.map((a) => [a.key, a]));

export const analyteFor = (key) => analyteByKey.get(key) || null;

export const defaultReference = (analyte) => {
  if (!analyte) return "";
  if (analyte.rangeText) return analyte.rangeText;
  return `${analyte.low ?? ""}–${analyte.high ?? ""}`;
};

export const defaultUnits = (analyte) => (analyte ? analyte.units || "" : "");

export const newRenalLabRow = (analyte, customName = "") => ({
  id: `${analyte ? analyte.key : "custom"}-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  analyte: analyte ? analyte.key : "custom",
  name: analyte ? analyte.name : customName,
  panel: analyzePanelLabel(analyte ? analyte.panel : "chemistry"),
  status: "Measured — this encounter",
  specimen_date: "",
  value: "",
  units: defaultUnits(analyte),
  reference_range: defaultReference(analyte),
  previous_value: "",
  previous_date: "",
  comment: "",
});

export const analyzePanelLabel = (panelKey) => {
  const panel = RENAL_LAB_PANELS.find((p) => p.key === panelKey);
  return panel ? panel.label : "Other";
};

export const parseNumber = (value) => {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/,/g, "").replace(/[^\d.\-]/g, "").trim();
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

// Reference bounds are read from the range the clinician has in the note, so
// an institution-specific range is what the flag is calculated against.
export const parseReferenceBounds = (range) => {
  const text = String(range || "");
  if (!text) return { low: null, high: null };
  const aboveMatch = text.match(/≥\s*([\d.]+)/);
  if (aboveMatch) return { low: parseNumber(aboveMatch[1]), high: null };
  const belowOrEqualMatch = text.match(/≤\s*([\d.]+)/);
  if (belowOrEqualMatch) return { low: null, high: parseNumber(belowOrEqualMatch[1]) };
  const between = text.match(/([\d.]+)\s*[–\-]\s*([\d.]+)/);
  if (between) return { low: parseNumber(between[1]), high: parseNumber(between[2]) };
  const below = text.match(/<\s*([\d.]+)/);
  if (below) return { low: null, high: parseNumber(below[1]) };
  return { low: null, high: null };
};

export const labFlag = (row = {}) => {
  const value = parseNumber(row.value);
  if (value === null) return "";
  const { low, high } = parseReferenceBounds(row.reference_range);
  if (low === null && high === null) return "";
  if (low !== null && value < low) return "Below reference range";
  if (high !== null && value > high) return "Above reference range";
  return "Within reference range";
};

export const labTrend = (row = {}) => {
  const current = parseNumber(row.value);
  const previous = parseNumber(row.previous_value);
  if (current === null || previous === null) return "";
  if (previous === 0) return current === 0 ? "Stable" : "Rising";
  const change = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(change) < 5) return "Stable";
  return change > 0 ? "Rising" : "Falling";
};

// Readable entry stored with the note — dates, units, reference range, the
// calculated flag, the previous value and the calculated trend, plus the
// source status so a historical or pending result is never read as today's.
export const formatRenalLabEntry = (row = {}) => {
  const parts = [];
  const detail = [row.value ? `${row.value}${row.units ? ` ${row.units}` : ""}` : "result not documented"];
  parts.push(`${row.name} — ${detail.join(" ")}`);
  if (row.specimen_date) parts.push(`dated ${row.specimen_date}`);
  if (row.reference_range) parts.push(`reference ${row.reference_range}`);
  const flag = labFlag(row);
  if (flag) parts.push(`${flag} (calculated)`);
  if (row.previous_value) {
    const trend = labTrend(row);
    parts.push(
      `previous ${row.previous_value}${row.units ? ` ${row.units}` : ""}${row.previous_date ? ` on ${row.previous_date}` : ""}` +
        (trend ? ` — ${trend} (calculated)` : "")
    );
  }
  if (row.status) parts.push(row.status);
  if (row.comment) parts.push(row.comment);
  return parts.join(" · ");
};

export const formatRenalLabRows = (rows) =>
  (Array.isArray(rows) ? rows : []).filter(Boolean).map(formatRenalLabEntry).join("\n");

export const abnormalRows = (rows) =>
  (Array.isArray(rows) ? rows : []).filter((row) => {
    const flag = labFlag(row);
    return flag === "Below reference range" || flag === "Above reference range";
  });