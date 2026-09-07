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
    ],
    tests: ["ESR", "Peripheral Blood Smear", "Reticulocyte Count", "PT (Prothrombin Time)", "INR", "aPTT", "Fibrinogen", "D-Dimer", "Blood Group & Rh"],
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

export const CATALOG_ENTRIES = LAB_CATEGORIES.flatMap((cat) => [
  ...(cat.panels || []).flatMap((panel) =>
    panel.tests.map((name) => ({
      id: `${cat.id}:${panel.id}:${name}`,
      name,
      category: cat.name,
      categoryId: cat.id,
      panel: panel.name,
      panelId: panel.id,
    }))
  ),
  ...(cat.tests || []).map((name) => ({
    id: `${cat.id}:${name}`,
    name,
    category: cat.name,
    categoryId: cat.id,
    panel: null,
    panelId: null,
  })),
]);

export const entryById = (id) => CATALOG_ENTRIES.find((t) => t.id === id);

export function searchLabTests(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CATALOG_ENTRIES.filter(
    (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.panel || "").toLowerCase().includes(q)
  );
}