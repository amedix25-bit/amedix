export const LAB_CATEGORIES = [
  {
    id: "hematology",
    name: "Hematology",
    panels: [
      {
        id: "cbc",
        name: "CBC / CBS",
        tests: ["Hemoglobin", "Hematocrit", "RBC Count", "WBC Count", "Differential Count", "Platelets", "MCV", "MCH", "MCHC", "RDW"],
      },
      {
        id: "other",
        name: "Other",
        tests: ["ESR", "Peripheral Blood Smear", "Reticulocyte Count", "PT (Prothrombin Time)", "INR", "aPTT", "Fibrinogen", "D-Dimer", "Blood Group & Rh"],
      },
    ],
    tests: [],
  },
  {
    id: "biochemistry",
    name: "Biochemistry",
    panels: [
      {
        id: "rft",
        name: "Renal Function Test",
        tests: ["Urea / BUN", "Creatinine", "eGFR", "Sodium", "Potassium", "Chloride", "Bicarbonate", "Calcium", "Phosphate"],
      },
      {
        id: "lft",
        name: "Liver Function Test",
        tests: ["ALT", "AST", "ALP", "GGT", "Total Bilirubin", "Direct Bilirubin", "Albumin", "Total Protein"],
      },
      {
        id: "glucose",
        name: "Glucose Tests",
        tests: ["Fasting Glucose", "Random Glucose", "HbA1c", "OGTT (Oral Glucose Tolerance Test)"],
      },
    ],
    tests: [],
  },
  {
    id: "lipid",
    name: "Lipid Profile",
    panels: [],
    tests: ["Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol", "Triglycerides", "Non-HDL", "VLDL", "Cholesterol / HDL Ratio"],
  },
  {
    id: "thyroid",
    name: "Thyroid Function Tests",
    panels: [
      {
        id: "thyroid_antibodies",
        name: "Thyroid Antibodies",
        tests: ["Anti-TPO", "Anti-Tg", "TRAb"],
      },
    ],
    tests: ["TSH", "Free T4", "Free T3", "Total T4", "Total T3"],
  },
  {
    id: "cardiac",
    name: "Cardiac Tests",
    panels: [],
    tests: ["Troponin I / T", "CK-MB", "CK", "BNP", "NT-proBNP"],
  },
  {
    id: "iron",
    name: "Iron Studies",
    panels: [],
    tests: ["Serum Iron", "Ferritin", "TIBC", "Transferrin", "Transferrin Saturation"],
  },
  {
    id: "vitamins",
    name: "Vitamins & Minerals",
    panels: [],
    tests: ["Vitamin B12", "Folate", "Vitamin D", "Calcium", "Magnesium", "Phosphate", "Zinc"],
  },
  {
    id: "inflammatory",
    name: "Inflammatory & Autoimmune Tests",
    panels: [],
    tests: ["CRP", "ESR", "ANA", "Anti-dsDNA", "Rheumatoid Factor (RF)", "Anti-CCP", "C3", "C4"],
  },
  {
    id: "hormonal",
    name: "Hormonal Tests",
    panels: [],
    tests: ["FSH", "LH", "Prolactin", "Estradiol", "Progesterone", "Testosterone", "SHBG", "Cortisol", "ACTH", "Growth Hormone", "IGF-1", "Insulin"],
  },
  {
    id: "serology",
    name: "Infectious Disease / Serology",
    panels: [],
    tests: ["HIV (HIV 1 & 2)", "HBsAg (Hepatitis B)", "Anti-HCV (Hepatitis C)", "VDRL / RPR", "TPHA", "EBV Serology", "CMV Serology", "Toxoplasma Serology"],
  },
  {
    id: "urine",
    name: "Urine Tests",
    panels: [
      {
        id: "urinalysis",
        name: "Urinalysis",
        tests: ["Physical Examination", "Protein", "Glucose", "Ketones", "Blood", "Nitrite", "Leukocyte Esterase", "Bilirubin", "Urobilinogen", "Microscopy"],
      },
    ],
    tests: ["Urine Culture", "Protein / Creatinine Ratio", "Albumin / Creatinine Ratio", "24-Hour Urine Protein"],
  },
  {
    id: "microbiology",
    name: "Microbiology",
    panels: [],
    tests: ["Blood Culture & Sensitivity", "Urine Culture & Sensitivity", "Sputum Culture & Sensitivity", "Wound Culture & Sensitivity", "Throat Culture & Sensitivity"],
  },
  {
    id: "stool",
    name: "Stool Tests",
    panels: [],
    tests: ["Routine Examination", "Occult Blood", "Ova & Parasites", "Stool Culture", "Fecal Calprotectin", "H. Pylori Antigen"],
  },
  {
    id: "special",
    name: "Special Tests",
    panels: [],
    tests: ["Amylase", "Lipase", "LDH", "Uric Acid", "CK", "PSA", "CEA", "CA-125", "CA 19-9", "AFP", "Beta-hCG"],
  },
];

// Well-known abbreviations and search synonyms for real catalog tests — used for
// display badges and for searching by abbreviation (e.g. "hb" finds Hemoglobin,
// "a1c" finds HbA1c, "trop" finds Troponin). Synonyms are lowercase.
const TEST_META = {
  "Hemoglobin": { abbrev: "Hb", synonyms: ["hgb", "hb"] },
  "Hematocrit": { abbrev: "Hct", synonyms: ["packed cell volume", "pcv", "hct"] },
  "RBC Count": { abbrev: "RBC", synonyms: ["red blood cell count", "red cell count"] },
  "WBC Count": { abbrev: "WBC", synonyms: ["white blood cell count", "white cell count", "leukocyte count"] },
  "Differential Count": { abbrev: "Diff", synonyms: ["differential", "dc"] },
  "Platelets": { abbrev: "Plt", synonyms: ["platelet count", "thrombocytes", "plt"] },
  "MCV": { abbrev: "MCV", synonyms: ["mean corpuscular volume"] },
  "MCH": { abbrev: "MCH", synonyms: ["mean corpuscular hemoglobin"] },
  "MCHC": { abbrev: "MCHC", synonyms: ["mean corpuscular hemoglobin concentration"] },
  "RDW": { abbrev: "RDW", synonyms: ["red cell distribution width"] },
  "ESR": { abbrev: "ESR", synonyms: ["erythrocyte sedimentation rate", "sed rate", "westergren"] },
  "Peripheral Blood Smear": { abbrev: "PBS", synonyms: ["blood film", "smear"] },
  "Reticulocyte Count": { abbrev: "Retic", synonyms: ["reticulocytes"] },
  "PT (Prothrombin Time)": { abbrev: "PT", synonyms: ["prothrombin time"] },
  "INR": { abbrev: "INR", synonyms: ["international normalized ratio"] },
  "aPTT": { abbrev: "aPTT", synonyms: ["activated partial thromboplastin time", "ptt", "aptt"] },
  "Fibrinogen": { abbrev: "Fib", synonyms: [] },
  "D-Dimer": { abbrev: "D-Dimer", synonyms: ["d dimer", "ddimer"] },
  "Blood Group & Rh": { abbrev: "BG", synonyms: ["blood type", "group and rh", "abo"] },
  "Urea / BUN": { abbrev: "BUN", synonyms: ["bun", "urea", "blood urea nitrogen"] },
  "Creatinine": { abbrev: "Cr", synonyms: ["creatinine", "crea"] },
  "eGFR": { abbrev: "eGFR", synonyms: ["estimated glomerular filtration rate", "gfr"] },
  "Sodium": { abbrev: "Na", synonyms: ["na", "sodium level"] },
  "Potassium": { abbrev: "K", synonyms: ["k", "potassium level"] },
  "Chloride": { abbrev: "Cl", synonyms: ["cl"] },
  "Bicarbonate": { abbrev: "HCO3", synonyms: ["hco3", "co2 content"] },
  "Calcium": { abbrev: "Ca", synonyms: ["ca", "total calcium"] },
  "Phosphate": { abbrev: "PO4", synonyms: ["phosphorus", "po4"] },
  "ALT": { abbrev: "ALT", synonyms: ["sgpt", "alanine aminotransferase", "alt"] },
  "AST": { abbrev: "AST", synonyms: ["sgot", "aspartate aminotransferase", "ast"] },
  "ALP": { abbrev: "ALP", synonyms: ["alkaline phosphatase", "alp"] },
  "GGT": { abbrev: "GGT", synonyms: ["gamma gt", "gamma glutamyl transferase", "ggt"] },
  "Total Bilirubin": { abbrev: "T.Bili", synonyms: ["total bilirubin", "tbil"] },
  "Direct Bilirubin": { abbrev: "D.Bili", synonyms: ["direct bilirubin", "conjugated bilirubin", "dbil"] },
  "Albumin": { abbrev: "Alb", synonyms: ["albumin", "alb"] },
  "Total Protein": { abbrev: "TP", synonyms: ["total protein", "tp"] },
  "Fasting Glucose": { abbrev: "FBS", synonyms: ["fasting blood sugar", "fbs", "fasting plasma glucose"] },
  "Random Glucose": { abbrev: "RBS", synonyms: ["random blood sugar", "rbs"] },
  "HbA1c": { abbrev: "HbA1c", synonyms: ["a1c", "glycated hemoglobin", "glycosylated hemoglobin", "hba1c"] },
  "OGTT (Oral Glucose Tolerance Test)": { abbrev: "OGTT", synonyms: ["glucose tolerance test", "ogtt"] },
  "Total Cholesterol": { abbrev: "TC", synonyms: ["cholesterol total", "tc"] },
  "LDL Cholesterol": { abbrev: "LDL", synonyms: ["ldl", "ldl-c", "bad cholesterol"] },
  "HDL Cholesterol": { abbrev: "HDL", synonyms: ["hdl", "hdl-c", "good cholesterol"] },
  "Triglycerides": { abbrev: "TG", synonyms: ["trig", "tg"] },
  "Non-HDL": { abbrev: "Non-HDL", synonyms: ["non hdl cholesterol", "nonhdl"] },
  "VLDL": { abbrev: "VLDL", synonyms: ["very low density lipoprotein"] },
  "Cholesterol / HDL Ratio": { abbrev: "TC/HDL", synonyms: ["cholesterol ratio", "tc/hdl"] },
  "TSH": { abbrev: "TSH", synonyms: ["thyroid stimulating hormone", "tsh"] },
  "Free T4": { abbrev: "FT4", synonyms: ["free t4", "ft4", "free thyroxine"] },
  "Free T3": { abbrev: "FT3", synonyms: ["free t3", "ft3", "free triiodothyronine"] },
  "Total T4": { abbrev: "TT4", synonyms: ["total t4", "thyroxine", "tt4"] },
  "Total T3": { abbrev: "TT3", synonyms: ["total t3", "triiodothyronine", "tt3"] },
  "Anti-TPO": { abbrev: "TPOAb", synonyms: ["anti tpo", "tpo antibody", "thyroid peroxidase antibody"] },
  "Anti-Tg": { abbrev: "TgAb", synonyms: ["anti tg", "thyroglobulin antibody", "tg ab"] },
  "TRAb": { abbrev: "TRAb", synonyms: ["tsh receptor antibody"] },
  "Troponin I / T": { abbrev: "Trop", synonyms: ["troponin", "trop i", "trop t", "hs-troponin"] },
  "CK-MB": { abbrev: "CK-MB", synonyms: ["ckmb", "creatine kinase mb"] },
  "CK": { abbrev: "CK", synonyms: ["creatine kinase", "cpk", "ck"] },
  "BNP": { abbrev: "BNP", synonyms: ["b-type natriuretic peptide", "bnp"] },
  "NT-proBNP": { abbrev: "NT-proBNP", synonyms: ["nt probnp", "ntprobnp"] },
  "Serum Iron": { abbrev: "Fe", synonyms: ["iron level", "serum fe"] },
  "Ferritin": { abbrev: "Ferr", synonyms: ["ferritin level", "ferr"] },
  "TIBC": { abbrev: "TIBC", synonyms: ["total iron binding capacity", "tibc"] },
  "Transferrin": { abbrev: "Tf", synonyms: ["transferrin level"] },
  "Transferrin Saturation": { abbrev: "TSAT", synonyms: ["transferrin saturation", "tsat", "iron saturation"] },
  "Vitamin B12": { abbrev: "B12", synonyms: ["b12", "cobalamin", "vit b12"] },
  "Folate": { abbrev: "Folate", synonyms: ["folic acid", "b9", "folate level"] },
  "Vitamin D": { abbrev: "Vit D", synonyms: ["25 oh vitamin d", "25-hydroxyvitamin d", "vitamin d level", "vit d"] },
  "Magnesium": { abbrev: "Mg", synonyms: ["mg", "magnesium level"] },
  "Zinc": { abbrev: "Zn", synonyms: ["zn", "zinc level"] },
  "CRP": { abbrev: "CRP", synonyms: ["c-reactive protein", "hs-crp", "crp"] },
  "ANA": { abbrev: "ANA", synonyms: ["antinuclear antibody", "ana test", "ana"] },
  "Anti-dsDNA": { abbrev: "dsDNA", synonyms: ["anti ds dna", "double stranded dna antibody"] },
  "Rheumatoid Factor (RF)": { abbrev: "RF", synonyms: ["rheumatoid factor", "rf"] },
  "Anti-CCP": { abbrev: "CCP", synonyms: ["anti ccp", "anti cyclic citrullinated peptide", "ccp antibody"] },
  "C3": { abbrev: "C3", synonyms: ["complement c3"] },
  "C4": { abbrev: "C4", synonyms: ["complement c4"] },
  "FSH": { abbrev: "FSH", synonyms: ["follicle stimulating hormone", "fsh"] },
  "LH": { abbrev: "LH", synonyms: ["luteinizing hormone", "lh"] },
  "Prolactin": { abbrev: "PRL", synonyms: ["prolactin level", "prl"] },
  "Estradiol": { abbrev: "E2", synonyms: ["e2", "oestradiol"] },
  "Progesterone": { abbrev: "P4", synonyms: ["p4", "serum progesterone"] },
  "Testosterone": { abbrev: "T", synonyms: ["total testosterone", "free testosterone"] },
  "SHBG": { abbrev: "SHBG", synonyms: ["sex hormone binding globulin", "shbg"] },
  "Cortisol": { abbrev: "Cort", synonyms: ["serum cortisol", "morning cortisol"] },
  "ACTH": { abbrev: "ACTH", synonyms: ["adrenocorticotropic hormone", "acth"] },
  "Growth Hormone": { abbrev: "GH", synonyms: ["gh", "somatotropin", "human growth hormone"] },
  "IGF-1": { abbrev: "IGF-1", synonyms: ["igf1", "insulin like growth factor"] },
  "Insulin": { abbrev: "Ins", synonyms: ["fasting insulin", "serum insulin"] },
  "HIV (HIV 1 & 2)": { abbrev: "HIV", synonyms: ["hiv test", "hiv screen", "aids test"] },
  "HBsAg (Hepatitis B)": { abbrev: "HBsAg", synonyms: ["hepatitis b surface antigen", "hbsag", "hep b"] },
  "Anti-HCV (Hepatitis C)": { abbrev: "HCV Ab", synonyms: ["hepatitis c antibody", "hcv", "hep c"] },
  "VDRL / RPR": { abbrev: "VDRL", synonyms: ["rpr", "syphilis test", "vdrl"] },
  "TPHA": { abbrev: "TPHA", synonyms: ["treponema pallidum", "syphilis confirmatory"] },
  "EBV Serology": { abbrev: "EBV", synonyms: ["epstein barr", "ebv", "mononucleosis test"] },
  "CMV Serology": { abbrev: "CMV", synonyms: ["cytomegalovirus", "cmv"] },
  "Toxoplasma Serology": { abbrev: "Toxo", synonyms: ["toxoplasmosis", "toxoplasma igg igm", "toxo"] },
  "Urine Culture": { abbrev: "UC", synonyms: ["urine c&s", "urine culture"] },
  "Protein / Creatinine Ratio": { abbrev: "P/C", synonyms: ["protein creatinine ratio", "p/c ratio", "pcr urine"] },
  "Albumin / Creatinine Ratio": { abbrev: "ACR", synonyms: ["albumin creatinine ratio", "acr", "microalbuminuria"] },
  "24-Hour Urine Protein": { abbrev: "24h UP", synonyms: ["24 hour protein", "24h urine protein"] },
  "Blood Culture & Sensitivity": { abbrev: "BC", synonyms: ["blood c&s", "blood culture"] },
  "Urine Culture & Sensitivity": { abbrev: "UC&S", synonyms: ["urine c&s", "urine culture and sensitivity"] },
  "Sputum Culture & Sensitivity": { abbrev: "SC", synonyms: ["sputum c&s", "sputum culture"] },
  "Wound Culture & Sensitivity": { abbrev: "WC", synonyms: ["wound swab", "wound c&s"] },
  "Throat Culture & Sensitivity": { abbrev: "TC", synonyms: ["throat swab", "throat c&s"] },
  "Occult Blood": { abbrev: "FOB", synonyms: ["stool occult blood", "fob", "fecal occult blood"] },
  "Ova & Parasites": { abbrev: "O&P", synonyms: ["stool ova and parasites", "o&p"] },
  "Stool Culture": { abbrev: "SC", synonyms: ["stool c&s"] },
  "Fecal Calprotectin": { abbrev: "FC", synonyms: ["calprotectin", "stool calprotectin"] },
  "H. Pylori Antigen": { abbrev: "H. pylori", synonyms: ["helicobacter pylori", "h pylori stool antigen", "h pylori"] },
  "Amylase": { abbrev: "Amy", synonyms: ["serum amylase"] },
  "Lipase": { abbrev: "Lip", synonyms: ["serum lipase"] },
  "LDH": { abbrev: "LDH", synonyms: ["lactate dehydrogenase", "ldh"] },
  "Uric Acid": { abbrev: "UA", synonyms: ["urate", "uric acid level"] },
  "PSA": { abbrev: "PSA", synonyms: ["prostate specific antigen", "total psa", "psa"] },
  "CEA": { abbrev: "CEA", synonyms: ["carcinoembryonic antigen", "cea"] },
  "CA-125": { abbrev: "CA-125", synonyms: ["ca125", "cancer antigen 125"] },
  "CA 19-9": { abbrev: "CA19-9", synonyms: ["ca 19.9", "cancer antigen 19-9"] },
  "AFP": { abbrev: "AFP", synonyms: ["alpha fetoprotein", "afp"] },
  "Beta-hCG": { abbrev: "βhCG", synonyms: ["bhcg", "beta hcg", "pregnancy test blood", "b hcg"] },
};

// Specimen type, only where it is unambiguous from the category — otherwise
// omitted rather than guessed.
const CATEGORY_SPECIMEN = {
  urine: "Urine",
  stool: "Stool",
};

export const CATALOG_ENTRIES = LAB_CATEGORIES.flatMap((cat) => [
  ...(cat.panels || []).flatMap((panel) =>
    panel.tests.map((name) => ({
      id: `${cat.id}:${panel.id}:${name}`,
      name,
      category: cat.name,
      categoryId: cat.id,
      panel: panel.name,
      panelId: panel.id,
      ...(TEST_META[name] || {}),
      ...(CATEGORY_SPECIMEN[cat.id] ? { specimen: CATEGORY_SPECIMEN[cat.id] } : {}),
    }))
  ),
  ...(cat.tests || []).map((name) => ({
    id: `${cat.id}:${name}`,
    name,
    category: cat.name,
    categoryId: cat.id,
    panel: null,
    panelId: null,
    ...(TEST_META[name] || {}),
    ...(CATEGORY_SPECIMEN[cat.id] ? { specimen: CATEGORY_SPECIMEN[cat.id] } : {}),
  })),
]);

export const entryById = (id) => {
  const direct = CATALOG_ENTRIES.find((t) => t.id === id);
  if (direct) return direct;
  // Legacy two-part ids ("hematology:ESR") saved before a test moved into a
  // panel — resolve by category and name so old favorites keep working.
  const parts = String(id).split(":");
  if (parts.length === 2) {
    const [categoryId, name] = parts;
    return CATALOG_ENTRIES.find((t) => t.categoryId === categoryId && t.name === name);
  }
  return undefined;
};

export function searchLabTests(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CATALOG_ENTRIES.filter((t) => {
    if (t.name.toLowerCase().includes(q)) return true;
    if (t.category.toLowerCase().includes(q)) return true;
    if ((t.panel || "").toLowerCase().includes(q)) return true;
    if (t.abbrev && t.abbrev.toLowerCase().includes(q)) return true;
    return (t.synonyms || []).some((s) => s.includes(q));
  });
}