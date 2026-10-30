// Haematology investigation catalogue.
//
// Each analyte carries the panel it belongs to, its customary unit and an adult
// reference interval. The interval is a starting value the clinician can replace
// with the reporting laboratory's own range — the value the laboratory printed is
// what the record keeps, and no result is ever normalised, recalculated or
// corrected here.
//
// Ranges are adult intervals from standard haematology reference material. They
// differ by assay, analyser, age, sex and pregnancy, which is why the field asks
// for the range used and why the printed record shows it beside every value.

import { NOT_DOCUMENTED } from "@/lib/hematologyFieldKit";

const A = (key, label, unit, range, note) => ({ key, label, unit, range, note: note || "" });

export const HEMA_LAB_RANGE_NOTE =
  "Reference intervals shown are customary adult values. Replace each with the range printed by the reporting laboratory — the range used is stored with the value.";

export const HEMA_LAB_PANELS = [
  {
    key: "cbc",
    label: "Blood Counts & Red Cell Indices",
    note: "Record the count that was reported, with its date. A trend needs at least two dated values.",
    analytes: [
      A("hb", "Haemoglobin", "g/L", "130–170", "130–170 g/L (men) · 115–165 g/L (women)"),
      A("hct", "Haematocrit", "L/L", "0.40–0.50", "0.40–0.50 (men) · 0.36–0.46 (women)"),
      A("rbc", "Red cell count", "×10¹²/L", "4.5–5.9", "4.5–5.9 (men) · 4.1–5.1 (women)"),
      A("mcv", "MCV", "fL", "80–100"),
      A("mch", "MCH", "pg", "27–33"),
      A("mchc", "MCHC", "g/L", "320–360"),
      A("rdw", "RDW", "%", "11.5–14.5"),
      A("wbc", "White cell count", "×10⁹/L", "4.0–11.0"),
      A("neut", "Neutrophils", "×10⁹/L", "2.0–7.5", "Include bands where the laboratory reports them"),
      A("lymph", "Lymphocytes", "×10⁹/L", "1.0–4.0"),
      A("mono", "Monocytes", "×10⁹/L", "0.2–0.8"),
      A("eos", "Eosinophils", "×10⁹/L", "0.02–0.5"),
      A("baso", "Basophils", "×10⁹/L", "0.02–0.1"),
      A("plt", "Platelet count", "×10⁹/L", "150–450"),
      A("mpv", "Mean platelet volume", "fL", "7.5–11.5"),
      A("blasts", "Blast cells on differential", "%", "0–0", "Any blast reported is a finding the clinician documents"),
    ],
  },
  {
    key: "retic",
    label: "Reticulocytes",
    note: "A reticulocyte response is read against the degree of anaemia; the corrected count is calculated only when both inputs are recorded.",
    analytes: [
      A("retic_pct", "Reticulocyte count", "%", "0.5–2.5"),
      A("retic_abs", "Absolute reticulocyte count", "×10⁹/L", "25–125"),
      A("retic_immature", "Immature reticulocyte fraction", "%", "5–20", "Where the analyser reports it"),
      A("nrbc", "Nucleated red cells", "/100 WBC", "0–0"),
    ],
  },
  {
    key: "iron",
    label: "Iron Studies",
    note: "Ferritin is an acute-phase reactant: a normal ferritin does not exclude iron deficiency when inflammation is present.",
    analytes: [
      A("ferritin", "Ferritin", "µg/L", "15–300", "Interpret against inflammation; ranges differ by sex and assay"),
      A("iron", "Serum iron", "µmol/L", "11–30"),
      A("tibc", "TIBC", "µmol/L", "45–70"),
      A("tsat", "Transferrin saturation", "%", "20–50", "Calculated from iron and TIBC when both are recorded"),
      A("str", "Soluble transferrin receptor", "mg/L", "2.2–5.0"),
      A("hepcidin", "Hepcidin", "ng/mL", "", "Where locally available"),
    ],
  },
  {
    key: "haematinics",
    label: "Vitamin B12 & Folate",
    note: "Serum B12 is assay-dependent and a borderline value is not a diagnosis; record methylmalonic acid or homocysteine where they were measured.",
    analytes: [
      A("b12", "Vitamin B12", "ng/L", "200–900", "Assay-dependent — record the laboratory's range"),
      A("folate", "Serum folate", "µg/L", "3–20"),
      A("rbc_folate", "Red cell folate", "µg/L", "150–600"),
      A("mma", "Methylmalonic acid", "µmol/L", "0.00–0.40"),
      A("homocysteine", "Homocysteine", "µmol/L", "5–15"),
      A("ifab", "Intrinsic factor antibodies", "", "", "Qualitative — enter as reported"),
      A("apca", "Anti-parietal cell antibodies", "", "", "Qualitative — enter as reported"),
    ],
  },
  {
    key: "haemolysis",
    label: "Haemolysis Screen",
    note: "No single test confirms haemolysis: the diagnosis rests on the combination documented by the clinician, not on one abnormal value.",
    analytes: [
      A("ldh", "LDH", "U/L", "120–250"),
      A("haptoglobin", "Haptoglobin", "g/L", "0.3–2.0"),
      A("unconj_bili", "Unconjugated bilirubin", "µmol/L", "0–17"),
      A("dat", "Direct antiglobulin test (DAT)", "", "", "Enter the laboratory's report, including IgG/C3d specificity"),
      A("free_hb", "Plasma free haemoglobin", "mg/L", "0–50"),
      A("haemosiderin", "Urinary haemosiderin", "", "", "Qualitative — enter as reported"),
      A("g6pd", "G6PD activity", "U/g Hb", "7–20", "Interpret with the timing of the haemolytic episode"),
    ],
  },
  {
    key: "coag",
    label: "Coagulation Profile",
    note: "Coagulation results are only interpretable with the sample time and anticoagulant status recorded.",
    analytes: [
      A("pt", "Prothrombin time", "s", "11–14"),
      A("inr", "INR", "", "0.8–1.2"),
      A("aptt", "aPTT", "s", "25–35"),
      A("fibrinogen", "Fibrinogen", "g/L", "2.0–4.0"),
      A("ddimer", "D-dimer", "mg/L FEU", "0.00–0.50", "Age-adjusted cut-offs apply in suspected VTE"),
      A("tt", "Thrombin time", "s", "14–19"),
      A("anti_xa", "Anti-Xa activity", "IU/mL", "", "Record the sampling time relative to the dose"),
      A("mixing", "Mixing study", "", "", "Enter as reported — corrects / does not correct"),
      A("bleeding_time", "Bleeding time / PFA closure", "", "", "Where performed"),
      A("adamts13", "ADAMTS13 activity", "%", "50–150", "Urgent where TTP is suspected"),
      A("adamts13_inh", "ADAMTS13 inhibitor", "BU", "", "Where measured"),
    ],
  },
  {
    key: "factor",
    label: "Factor Assays & Inhibitor Testing",
    note: "Record the assay method where known (one-stage clotting vs chromogenic), because results are not interchangeable.",
    analytes: [
      A("fviii", "Factor VIII activity", "%", "50–150"),
      A("fix", "Factor IX activity", "%", "50–150"),
      A("fxi", "Factor XI activity", "%", "50–150"),
      A("fxiii", "Factor XIII activity", "%", "50–150"),
      A("vwf_ag", "von Willebrand factor antigen", "%", "50–160"),
      A("vwf_rco", "von Willebrand factor activity (VWF:RCo or GP1bM)", "%", "50–160"),
      A("fviii_binding", "Factor VIII binding capacity", "", "", "Where VWD type 2N is being assessed"),
      A("bethesda", "Factor inhibitor titre (Bethesda)", "BU", "0–0"),
      A("plt_aggregation", "Platelet aggregation studies", "", "", "Enter the pattern reported"),
    ],
  },
  {
    key: "hbpathy",
    label: "Haemoglobinopathy Studies",
    note: "Genotype is recorded as the laboratory reported it; the app never infers a genotype from a phenotype.",
    analytes: [
      A("hba", "Haemoglobin A", "%", "96–98"),
      A("hba2", "Haemoglobin A2", "%", "2.0–3.5"),
      A("hbf", "Haemoglobin F", "%", "0–1"),
      A("hbs", "Haemoglobin S", "%", "0–0"),
      A("hbc", "Haemoglobin C", "%", "0–0"),
      A("hbe", "Haemoglobin E", "%", "0–0"),
      A("hplc_pattern", "HPLC / electrophoresis pattern", "", "", "Enter the pattern as reported"),
      A("solubility", "Sickling / solubility test", "", "", "Qualitative — enter as reported"),
      A("alpha_genotype", "Alpha globin genotype", "", "", "Enter the genotype reported, e.g. --SEA/αα"),
      A("beta_genotype", "Beta globin genotype", "", "", "Enter the genotype reported, e.g. HbSS, β0/β+"),
    ],
  },
  {
    key: "advanced",
    label: "Flow Cytometry, Cytogenetics & Molecular",
    note: "Report the assay, the sample and the date. A molecular result is recorded exactly as reported, including the variant nomenclature.",
    analytes: [
      A("flow", "Flow cytometry / immunophenotype", "", "", "Enter the marker profile reported"),
      A("mrd", "Measurable residual disease", "%", "", "Record the assay and its limit of detection"),
      A("karyotype", "Karyotype", "", "", "Enter the ISCN karyotype as reported"),
      A("fish", "FISH", "", "", "Enter the probe and result as reported"),
      A("ngs", "Next-generation sequencing panel", "", "", "Enter the variants reported, with allele frequency"),
      A("jak2", "JAK2 V617F", "%", "", "Record the assay's detection limit"),
      A("calr", "CALR mutation", "", "", "Enter the variant reported"),
      A("mpl", "MPL mutation", "", "", "Enter the variant reported"),
      A("bcr_abl1", "BCR-ABL1 (IS)", "%", "", "Record the scale used (international scale)"),
      A("pml_rara", "PML-RARα", "", "", "Enter the transcript reported"),
      A("npm1", "NPM1 mutation", "", ""),
      A("flt3", "FLT3-ITD / TKD", "", "", "Record the allelic ratio where reported"),
      A("cebpa", "CEBPA mutation", "", ""),
      A("tp53", "TP53 mutation", "", "", "Record the variant and allele frequency"),
      A("myeloid_panel", "Other myeloid variants", "", "", "e.g. IDH1/2, KIT, ASXL1, SRSF2, SF3B1"),
      A("myd88", "MYD88 L265P", "", ""),
    ],
  },
  {
    key: "marrow",
    label: "Bone Marrow Studies",
    note: "Aspirate and trephine findings are documented as reported by the pathologist; the treating clinician records the interpretation.",
    analytes: [
      A("marrow_cellularity", "Marrow cellularity", "%", "", "Enter the reported cellularity for age"),
      A("me_ratio", "Myeloid:erythroid ratio", "", "2–4"),
      A("marrow_blasts", "Marrow blasts", "%", "", "Record the count used for classification"),
      A("dysplasia", "Dysplasia", "", "", "Enter the lineages affected, as reported"),
      A("fibrosis", "Fibrosis grade", "", "", "MF-0 to MF-3 as reported"),
      A("iron_stores", "Marrow iron stores", "", "", "Enter the grade reported"),
      A("ring_sideroblasts", "Ring sideroblasts", "%", ""),
      A("haemophagocytosis", "Haemophagocytosis", "", "", "Enter as reported"),
      A("trephine", "Trephine histology", "", "", "Enter the histological report"),
      A("ihc", "Immunohistochemistry", "", "", "e.g. CD34, CD117, CD20, CD3, kappa/lambda"),
    ],
  },
  {
    key: "biochem",
    label: "Renal, Liver & Metabolic",
    note: "Record the values that determine dose adjustment and supportive care, with their date.",
    analytes: [
      A("creatinine", "Creatinine", "µmol/L", "60–110"),
      A("egfr", "eGFR", "mL/min/1.73 m²", "90–120"),
      A("urea", "Urea", "mmol/L", "2.5–7.0"),
      A("alt", "ALT", "U/L", "0–40"),
      A("alp", "Alkaline phosphatase", "U/L", "30–130"),
      A("bili_total", "Total bilirubin", "µmol/L", "0–21"),
      A("albumin", "Albumin", "g/L", "35–50"),
      A("calcium", "Calcium", "mmol/L", "2.20–2.60"),
      A("corrected_calcium", "Corrected calcium", "mmol/L", "2.20–2.60", "Corrected for albumin when albumin is recorded"),
      A("urate", "Uric acid", "µmol/L", "150–400"),
      A("crp", "CRP", "mg/L", "0–5"),
      A("esr", "ESR", "mm/h", "0–20"),
      A("potassium", "Potassium", "mmol/L", "3.5–5.1"),
      A("phosphate", "Phosphate", "mmol/L", "0.8–1.5"),
      A("magnesium", "Magnesium", "mmol/L", "0.7–1.0"),
    ],
  },
  {
    key: "infection",
    label: "Infection Screening",
    note: "Screening status is recorded before immunosuppression, transfusion support and splenectomy — not inferred.",
    analytes: [
      A("hiv", "HIV antibody/antigen", "", "", "Enter as reported (reactive / non-reactive)"),
      A("hbsag", "Hepatitis B surface antigen", "", ""),
      A("anti_hbc", "Hepatitis B core antibody", "", ""),
      A("hbv_dna", "Hepatitis B DNA", "IU/mL", ""),
      A("hcv", "Hepatitis C antibody / RNA", "", ""),
      A("cmv", "CMV IgG / IgM", "", ""),
      A("ebv", "EBV serology", "", ""),
      A("parvo", "Parvovirus B19", "", ""),
      A("blood_culture", "Blood cultures", "", "", "Record organism and sensitivities as reported"),
    ],
  },
  {
    key: "immuno",
    label: "Immunoglobulins & Plasma Cell Studies",
    note: "Record the assay units the laboratory reported; free light chain ratios are assay-specific.",
    analytes: [
      A("igg", "IgG", "g/L", "6.0–16.0"),
      A("iga", "IgA", "g/L", "0.8–3.0"),
      A("igm", "IgM", "g/L", "0.4–2.5"),
      A("spep", "Serum protein electrophoresis", "", "", "Enter the pattern and any paraprotein with its concentration"),
      A("ife", "Immunofixation", "", "", "Enter the clonal band reported"),
      A("flc_kappa", "Free light chain kappa", "mg/L", "3.3–19.4"),
      A("flc_lambda", "Free light chain lambda", "mg/L", "5.7–26.3"),
      A("flc_ratio", "Free light chain ratio", "", "0.26–1.65"),
      A("b2m", "Beta-2 microglobulin", "mg/L", "1.2–2.5"),
      A("cryoglobulins", "Cryoglobulins", "", "", "Enter as reported"),
      A("cold_agglutinin", "Cold agglutinin titre", "", ""),
    ],
  },
  {
    key: "pregnancy",
    label: "Pregnancy-Related Testing",
    note: "Record only what was measured; the app never dates a pregnancy or interprets a pregnancy test.",
    analytes: [
      A("beta_hcg", "Beta-hCG", "IU/L", "", "Enter as reported"),
      A("blood_group", "Blood group & antibody screen", "", "", "Enter group, Rh and antibody status"),
      A("hb_electrophoresis", "Haemoglobin studies in pregnancy", "", "", "Enter the result reported"),
      A("plt_preg", "Platelet count in pregnancy", "×10⁹/L", "150–450"),
    ],
  },
];

export const HEMA_ANALYTES = HEMA_LAB_PANELS.flatMap((p) =>
  p.analytes.map((a) => ({ ...a, panel: p.key, panelLabel: p.label }))
);

export const hemaAnalyte = (key) => HEMA_ANALYTES.find((a) => a.key === key) || null;

export const hemaPanel = (key) => HEMA_LAB_PANELS.find((p) => p.key === key) || null;

export const HEMA_ANALYTE_COUNT = HEMA_ANALYTES.length;

// ---- Reading a result -----------------------------------------------------
// The abnormal flag is derived from the value the clinician recorded against the
// range recorded beside it. It is a reading aid only: the clinician can set the
// flag themselves, and a value outside the range is never called critically
// abnormal by the app.
const NUMBER = /-?\d+(?:\.\d+)?/;

export const parseRange = (range) => {
  const text = String(range || "");
  const parts = text.match(/-?\d+(?:\.\d+)?/g) || [];
  if (parts.length < 2) return null;
  const low = Number(parts[0]);
  const high = Number(parts[1]);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
  // A sex- or assay-dependent interval is written as "130–170 (men)"; the two
  // numbers still bound the value range the user copied from the report.
  return low <= high ? { low, high } : { low: high, high: low };
};

export const derivedFlag = (value, range) => {
  const text = String(value ?? "").trim();
  if (!text || !NUMBER.test(text)) return "";
  const numeric = Number((text.match(NUMBER) || [])[0]);
  const bounds = parseRange(range);
  if (!Number.isFinite(numeric) || !bounds) return "";
  if (numeric < bounds.low) return "Low";
  if (numeric > bounds.high) return "High";
  return "Normal";
};

export const FLAG_OPTIONS = ["Low", "Normal", "High", "Critical", "Not flagged"];

export const TREND_OPTIONS = [
  "Improving",
  "Stable",
  "Worsening",
  "Not comparable — different assay/unit",
  NOT_DOCUMENTED,
];

// One recorded measurement. Every stored row keeps the value, unit, range, date,
// source, previous value and trend as entered, so the printed record reproduces
// the laboratory report rather than a recalculated one.
export const emptyLabRow = (analyteKey) => {
  const a = hemaAnalyte(analyteKey);
  return {
    analyte: analyteKey,
    label: a?.label || "",
    value: "",
    unit: a?.unit || "",
    range: a?.range || "",
    date: "",
    flag: "",
    previous_value: "",
    previous_date: "",
    trend: "",
    source: "",
    comment: "",
  };
};

// The text a saved note and its PDF carry for one group of recorded results.
// Values are printed exactly as recorded, with the range that was used, so the
// reader can see why a value was flagged.
export const formatHemaLabs = (value) => {
  const rows = Array.isArray(value) ? value : [];
  const text = (v) => String(v ?? "").trim();
  const lines = rows
    .filter((row) => text(row?.value) || text(row?.comment))
    .map((row) => {
      const analyte = hemaAnalyte(row.analyte);
      const head = `${analyte?.label || row.label || "Result"}: ${text(row.value) || "not recorded"}${row.unit ? ` ${row.unit}` : ""}`;
      const flag = row.flag || derivedFlag(row.value, row.range);
      const meta = [
        row.date ? `dated ${row.date}` : "date not recorded",
        flag ? `flag ${flag}` : "flag not determined",
        row.range ? `reference range ${row.range}` : "reference range not recorded",
        row.previous_value
          ? `previous ${row.previous_value}${row.previous_date ? ` (${row.previous_date})` : ""}`
          : "",
        row.trend ? `trend ${row.trend}` : "",
        row.source ? `source ${row.source}` : "",
        row.comment ? `comment: ${row.comment}` : "",
      ].filter(Boolean);
      return `${head} — ${meta.join(" · ")}`;
    });
  return lines.join("\n");
};