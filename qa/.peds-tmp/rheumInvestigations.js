// Rheumatology investigation panels.
//
// Panels group the investigations relevant to inflammatory and autoimmune
// rheumatic disease so a clinician can find one quickly. NOTHING is ordered or
// preselected: the panels are a search index, and an investigation is included
// only when the clinician selects it and documents the indication.
//
// Suggested reference ranges are shown as a prompt only. They are
// laboratory-dependent — the clinician documents the range issued by the
// reporting laboratory, which is saved with the result.

export const INVESTIGATION_PANELS = [
  {
    key: "haematology",
    label: "Haematology & Inflammatory Markers",
    items: [
      { key: "cbc", label: "Complete Blood Count (CBC) with differential" },
      { key: "esr", label: "Erythrocyte Sedimentation Rate (ESR)" },
      { key: "crp", label: "C-Reactive Protein (CRP)" },
      { key: "ferritin", label: "Ferritin" },
      { key: "blood_film", label: "Peripheral Blood Film" },
      { key: "coagulation", label: "Coagulation Screen (PT / APTT / fibrinogen)" },
    ],
  },
  {
    key: "biochemistry",
    label: "Biochemistry & Organ Function",
    items: [
      { key: "renal", label: "Renal Function (urea, creatinine, eGFR)" },
      { key: "liver", label: "Liver Function Tests" },
      { key: "electrolytes", label: "Electrolytes & Bone Profile" },
      { key: "ck", label: "Creatine Kinase (CK)" },
      { key: "aldolase", label: "Aldolase" },
      { key: "urate", label: "Serum Urate" },
      { key: "glucose_lipids", label: "Fasting Glucose & Lipid Profile" },
      { key: "tsh", label: "Thyroid Function (TSH)" },
    ],
  },
  {
    key: "urine",
    label: "Urine Assessment",
    items: [
      { key: "urinalysis", label: "Urinalysis (dipstick & microscopy)" },
      { key: "urine_pcr", label: "Urine Protein : Creatinine Ratio" },
      { key: "urine_24h", label: "24-Hour Urine Protein" },
      { key: "urine_culture", label: "Urine Culture" },
    ],
  },
  {
    key: "immunology",
    label: "Immunology & Autoantibodies",
    items: [
      { key: "rf", label: "Rheumatoid Factor (RF)" },
      { key: "anti_ccp", label: "Anti-Cyclic Citrullinated Peptide (anti-CCP)" },
      { key: "ana", label: "Antinuclear Antibody (ANA) with titre & pattern" },
      { key: "anti_dsdna", label: "Anti-double-stranded DNA (anti-dsDNA)" },
      { key: "ena", label: "ENA Screen / Extractable Nuclear Antigens" },
      { key: "complement", label: "Complement C3 & C4" },
      { key: "antiphospholipid", label: "Antiphospholipid Antibodies (lupus anticoagulant, anticardiolipin, anti-β2-glycoprotein I)" },
      { key: "anca", label: "ANCA (PR3 / MPO) — when indicated" },
      { key: "disease_antibodies", label: "Disease-Associated Antibodies (anti-CCP, anti-U1-RNP, anti-Sm, anti-Scl-70, anti-centromere, anti-Jo-1, anti-Ro/La)" },
      { key: "cryoglobulins", label: "Cryoglobulins" },
      { key: "immunoglobulins", label: "Immunoglobulins & Serum Electrophoresis" },
    ],
  },
  {
    key: "synovial_micro",
    label: "Synovial Fluid & Microbiology",
    items: [
      { key: "synovial_analysis", label: "Synovial Fluid Analysis (appearance, cell count, differential)" },
      { key: "synovial_crystals", label: "Synovial Fluid Crystal Examination (polarised light)" },
      { key: "synovial_gram_culture", label: "Synovial Fluid Gram Stain & Culture" },
      { key: "blood_cultures", label: "Blood Cultures" },
      { key: "tb_screening", label: "Tuberculosis Screening (IGRA / Mantoux)" },
      { key: "hbv", label: "Hepatitis B Serology" },
      { key: "hcv", label: "Hepatitis C Serology" },
      { key: "hiv", label: "HIV Testing" },
      { key: "other_infection", label: "Other Infection Screening (as indicated)" },
    ],
  },
  {
    key: "imaging",
    label: "Imaging",
    items: [
      { key: "xray_hands", label: "Radiographs — hands & feet" },
      { key: "xray_axial", label: "Radiographs — spine / sacroiliac joints" },
      { key: "xray_other", label: "Radiographs — other region" },
      { key: "ultrasound", label: "Ultrasound (synovitis, erosions, enthesitis)" },
      { key: "mri", label: "MRI (including whole-body MRI where indicated)" },
      { key: "ct", label: "CT — when indicated" },
      { key: "dxa", label: "DXA Bone Density" },
    ],
  },
  {
    key: "procedures",
    label: "Procedures & Tissue",
    items: [
      { key: "arthrocentesis", label: "Arthrocentesis (diagnostic / therapeutic)" },
      { key: "synovial_biopsy", label: "Synovial Biopsy" },
      { key: "minor_salivary_biopsy", label: "Minor Salivary Gland Biopsy" },
      { key: "skin_biopsy", label: "Skin Biopsy" },
      { key: "temporal_artery_biopsy", label: "Temporal Artery Biopsy" },
      { key: "muscle_biopsy", label: "Muscle Biopsy" },
      { key: "renal_biopsy", label: "Renal Biopsy" },
    ],
  },
];

export const INVESTIGATION_STATUSES = [
  "Selected — not yet ordered",
  "Ordered",
  "Resulted — awaiting review",
  "Reviewed",
  "Not indicated",
];

export const INTERPRETATIONS = [
  "Awaiting result",
  "Normal",
  "Abnormal — clinically significant",
  "Abnormal — not significant",
  "Equivocal",
  "Not applicable",
];

export const SIGNIFICANT = "Abnormal — clinically significant";

export const findPanelItem = (key) => {
  for (const panel of INVESTIGATION_PANELS) {
    const item = panel.items.find((i) => i.key === key);
    if (item) return { panel, item };
  }
  return null;
};

export const searchInvestigations = (query) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return INVESTIGATION_PANELS.flatMap((panel) =>
    panel.items
      .filter((i) => `${i.label} ${i.key}`.toLowerCase().includes(q))
      .map((i) => ({ ...i, panel: panel.label, panel_key: panel.key }))
  );
};