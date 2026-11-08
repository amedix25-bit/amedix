// Allergy & Immunology investigation catalogue.
//
// WHAT THIS IS
// A picker of the investigations this specialty actually orders, so a result is
// recorded against its own test instead of a free-text line. The VALUE, UNIT,
// REFERENCE RANGE and DATE are stored exactly as the reporting source printed
// them — nothing is normalised, recalculated or corrected here.
//
// WHAT THIS IS NOT
// It is not a result generator. No row exists until a clinician adds it, no
// result is proposed or assumed, and a test that has not been reported is simply
// not recorded. A blank result is "not documented", never "normal".
//
// REFERENCE RANGES
// The ranges shown are customary adult values from standard laboratory and
// allergy practice, and they differ by assay, method, age, sex and laboratory.
// The field asks for the range that was used, and the printed record shows the
// range beside the value, so the record reproduces the report that was issued.
//
// INTERPRETATION IS NOT AUTOMATIC
// A skin-prick or specific-IgE result only supports a diagnosis when it is read
// with the documented clinical reaction (AAAAI/ACAAI, EAACI). The interpretation
// field is the clinician's, and the safety prompts never convert a positive test
// into a diagnosis.

const A = (key, label, unit, range, note) => ({ key, label, unit, range, note: note || "" });

export const ALLERGY_TEST_NOTE =
  "Reference ranges shown are customary values for adults. Replace each with the range printed by the reporting laboratory or the device manufacturer — the range used is stored with the value. No result is ever generated, converted or assumed.";

export const ALLERGY_FLAGS = ["Normal", "High", "Low", "Positive", "Negative", "Borderline", "Indeterminate", "Critical"];

export const ALLERGY_TEST_PANELS = [
  {
    key: "spt",
    label: "Skin Prick Testing",
    note: "Wheal diameter is read at 15–20 minutes against the positive and negative controls. A result means nothing without the documented reaction history.",
    tests: [
      A("spt_histamine", "Histamine — positive control", "mm wheal", "3 mm or more", "Control failure invalidates the panel"),
      A("spt_saline", "Saline — negative control", "mm wheal", "Less than 3 mm"),
      A("spt_grass", "Grass pollen (timothy / mixed)", "mm wheal", "Less than 3 mm"),
      A("spt_tree", "Tree pollen (birch / mixed)", "mm wheal", "Less than 3 mm"),
      A("spt_weed", "Weed pollen (mugwort / parietaria)", "mm wheal", "Less than 3 mm"),
      A("spt_dust_mite", "Dermatophagoides pteronyssinus", "mm wheal", "Less than 3 mm"),
      A("spt_dust_mite_farinae", "Dermatophagoides farinae", "mm wheal", "Less than 3 mm"),
      A("spt_cat", "Cat dander", "mm wheal", "Less than 3 mm"),
      A("spt_dog", "Dog dander", "mm wheal", "Less than 3 mm"),
      A("spt_mould", "Mould (Alternaria / Cladosporium)", "mm wheal", "Less than 3 mm"),
      A("spt_egg", "Hen egg white", "mm wheal", "Less than 3 mm"),
      A("spt_milk", "Cow's milk", "mm wheal", "Less than 3 mm"),
      A("spt_peanut", "Peanut", "mm wheal", "Less than 3 mm"),
      A("spt_treenut", "Tree nut mix", "mm wheal", "Less than 3 mm"),
      A("spt_wheat", "Wheat", "mm wheal", "Less than 3 mm"),
      A("spt_soy", "Soy", "mm wheal", "Less than 3 mm"),
      A("spt_fish", "Fish (cod)", "mm wheal", "Less than 3 mm"),
      A("spt_shrimp", "Shellfish (shrimp)", "mm wheal", "Less than 3 mm"),
      A("spt_latex", "Latex", "mm wheal", "Less than 3 mm"),
      A("spt_venom", "Venom (bee / wasp)", "mm wheal", "Less than 3 mm"),
      A("spt_betalactam", "Beta-lactam determinants (where used)", "mm wheal", "Less than 3 mm", "Only where the validated reagent and protocol are available"),
    ],
  },
  {
    key: "sige",
    label: "Total & Allergen-Specific IgE",
    note: "Specific IgE is reported in kUA/L against the assay's own calibration. The decision point depends on age and on the allergen, so the reported value and the documented reaction — not a fixed cut-off — are recorded.",
    tests: [
      A("total_ige", "Total IgE", "kU/L", "0–100", "Age-dependent; record the range the laboratory printed"),
      A("sige_egg", "Egg white specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_milk", "Cow's milk specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_peanut", "Peanut specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_treenut", "Tree nut specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_wheat", "Wheat specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_soy", "Soy specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_fish", "Fish specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_shrimp", "Shrimp specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_dust_mite", "Dermatophagoides pteronyssinus specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_cat", "Cat dander specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_dog", "Dog dander specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_grass", "Grass pollen specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_birch", "Birch pollen specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_mould", "Mould specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_latex", "Latex specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_venom", "Venom specific IgE", "kUA/L", "Less than 0.35"),
      A("sige_betalactam", "Beta-lactam specific IgE", "kUA/L", "Less than 0.35", "Sensitivity is limited; a negative result does not exclude allergy"),
    ],
  },
  {
    key: "crd",
    label: "Component-Resolved Diagnostics (CRD)",
    note: "A component result describes sensitisation to one molecule. It supports risk assessment and cross-reactivity reasoning; it never replaces the documented reaction or a supervised challenge.",
    tests: [
      A("crd_arah1", "Ara h 1 — peanut seed storage protein", "kUA/L", "Less than 0.35"),
      A("crd_arah2", "Ara h 2 — peanut seed storage protein", "kUA/L", "Less than 0.35"),
      A("crd_arah3", "Ara h 3 — peanut seed storage protein", "kUA/L", "Less than 0.35"),
      A("crd_arah8", "Ara h 8 — PR-10 (pollen cross-reactivity)", "kUA/L", "Less than 0.35"),
      A("crd_arah9", "Ara h 9 — lipid transfer protein", "kUA/L", "Less than 0.35"),
      A("crd_gald1", "Gal d 1 — ovomucoid", "kUA/L", "Less than 0.35"),
      A("crd_gald2", "Gal d 2 — ovalbumin", "kUA/L", "Less than 0.35"),
      A("crd_bosd8", "Bos d 8 — casein", "kUA/L", "Less than 0.35"),
      A("crd_tria19", "Tri a 19 — omega-5 gliadin (wheat-dependent exercise-induced anaphylaxis)", "kUA/L", "Less than 0.35"),
      A("crd_cora9", "Cor a 9 — hazelnut legumin", "kUA/L", "Less than 0.35"),
      A("crd_cora14", "Cor a 14 — hazelnut 2S albumin", "kUA/L", "Less than 0.35"),
      A("crd_prup3", "Pru p 3 — peach lipid transfer protein", "kUA/L", "Less than 0.35"),
      A("crd_betv1", "Bet v 1 — birch PR-10", "kUA/L", "Less than 0.35"),
      A("crd_feld1", "Fel d 1 — cat", "kUA/L", "Less than 0.35"),
      A("crd_canf1", "Can f 1 — dog lipocalin", "kUA/L", "Less than 0.35"),
      A("crd_canf5", "Can f 5 — dog prostatic kallikrein", "kUA/L", "Less than 0.35"),
      A("crd_derp1", "Der p 1 — house dust mite cysteine protease", "kUA/L", "Less than 0.35"),
      A("crd_derp2", "Der p 2 — house dust mite", "kUA/L", "Less than 0.35"),
      A("crd_derp10", "Der p 10 — tropomyosin (cross-reactivity)", "kUA/L", "Less than 0.35"),
      A("crd_derp23", "Der p 23 — house dust mite peritrophin", "kUA/L", "Less than 0.35"),
      A("crd_vesv5", "Ves v 5 — wasp venom antigen 5", "kUA/L", "Less than 0.35"),
      A("crd_pold5", "Pol d 5 — paper wasp venom antigen 5", "kUA/L", "Less than 0.35"),
    ],
  },
  {
    key: "patch",
    label: "Patch Testing",
    note: "Read at the intervals the unit uses (commonly day 2 and day 4, with a late read where indicated). The morphological grade is recorded as read — it is never inferred from the allergen name.",
    tests: [
      A("patch_nickel", "Nickel sulfate", "grading", "Negative"),
      A("patch_cobalt", "Cobalt chloride", "grading", "Negative"),
      A("patch_chromate", "Potassium dichromate", "grading", "Negative"),
      A("patch_fragrance1", "Fragrance mix I", "grading", "Negative"),
      A("patch_balsam", "Myroxylon pereirae (balsam of Peru)", "grading", "Negative"),
      A("patch_mit", "Methylisothiazolinone", "grading", "Negative"),
      A("patch_ppd", "p-Phenylenediamine", "grading", "Negative"),
      A("patch_colophony", "Colophonium", "grading", "Negative"),
      A("patch_epoxy", "Epoxy resin", "grading", "Negative"),
      A("patch_thiuram", "Thiuram mix (rubber accelerator)", "grading", "Negative"),
      A("patch_carba", "Carba mix (rubber accelerator)", "grading", "Negative"),
      A("patch_own", "Own product / workplace material", "grading", "Negative", "Tested at the concentration the unit validated"),
    ],
  },
  {
    key: "mastcell",
    label: "Mast Cell & Eosinophil Markers",
    note: "Tryptase is interpreted against the sample timing and a documented baseline; a single value is not a diagnosis of mastocytosis.",
    tests: [
      A("tryptase_acute", "Serum tryptase — acute sample", "µg/L", "Less than 11.4", "Timing relative to the reaction must be recorded"),
      A("tryptase_baseline", "Serum tryptase — baseline", "µg/L", "Less than 11.4"),
      A("tryptase_24h", "Serum tryptase — 24 hours or later", "µg/L", "Less than 11.4"),
      A("eosinophils_abs", "Absolute eosinophil count", "×10⁹/L", "0.02–0.5"),
      A("eosinophils_pct", "Eosinophils on differential", "%", "1–5"),
      A("ecp", "Eosinophil cationic protein (where reported)", "µg/L", "Laboratory-specific"),
    ],
  },
  {
    key: "humoral",
    label: "Humoral Immunity",
    note: "Immunoglobulin results are read against age-specific ranges; subclass and vaccine-response results are interpreted together, never in isolation.",
    tests: [
      A("igg", "IgG", "g/L", "7.0–16.0"),
      A("iga", "IgA", "g/L", "0.7–4.0", "Age-specific; IgA deficiency affects interpretation of other tests"),
      A("igm", "IgM", "g/L", "0.4–2.3"),
      A("ige_total", "IgE total (immune workup)", "kU/L", "0–100"),
      A("igg1", "IgG subclass 1", "g/L", "3.8–9.3"),
      A("igg2", "IgG subclass 2", "g/L", "2.4–7.0"),
      A("igg3", "IgG subclass 3", "g/L", "0.2–1.8"),
      A("igg4", "IgG subclass 4", "g/L", "0.02–2.0"),
      A("ab_tetanus", "Anti-tetanus antibody", "IU/mL", "More than 0.1", "Protective threshold is assay-specific"),
      A("ab_diphtheria", "Anti-diphtheria antibody", "IU/mL", "More than 0.1"),
      A("ab_pneumococcal", "Anti-pneumococcal polysaccharide antibody", "µg/mL", "Laboratory-specific", "Read against pre/post-vaccination pairs"),
      A("ab_hib", "Anti-Hib antibody", "µg/mL", "More than 1.0"),
    ],
  },
  {
    key: "cellular",
    label: "Cellular Immunity",
    note: "Subset results are age-dependent and are interpreted with the clinical picture and the vaccine response.",
    tests: [
      A("cd3", "CD3+ T cells", "% / ×10⁹/L", "Laboratory-specific"),
      A("cd4", "CD4+ T cells", "% / ×10⁹/L", "Laboratory-specific"),
      A("cd8", "CD8+ T cells", "% / ×10⁹/L", "Laboratory-specific"),
      A("cd19", "CD19+ B cells", "% / ×10⁹/L", "Laboratory-specific"),
      A("cd16_56", "CD16/56+ NK cells", "% / ×10⁹/L", "Laboratory-specific"),
      A("naive_t", "Naive CD4/CD45RA T cells", "%", "Laboratory-specific"),
      A("memory_t", "Memory T cells", "%", "Laboratory-specific"),
      A("trec", "TREC (T-cell receptor excision circles)", "copies/µL", "Laboratory-specific"),
      A("krec", "KREC (kappa-deleting recombination excision circles)", "copies/µL", "Laboratory-specific"),
      A("proliferation", "Lymphocyte proliferation to mitogens", "stimulation index", "Laboratory-specific"),
    ],
  },
  {
    key: "complement",
    label: "Complement",
    note: "C3 and C4 are consumed in activation; a normal level does not exclude hereditary angioedema, and C1-inhibitor function is required where it is suspected.",
    tests: [
      A("c3", "Complement C3", "g/L", "0.9–1.8"),
      A("c4", "Complement C4", "g/L", "0.1–0.4"),
      A("ch50", "CH50 — classical pathway", "% or U/mL", "Laboratory-specific"),
      A("ah50", "AH50 — alternative pathway", "% or U/mL", "Laboratory-specific"),
      A("c1inh_antigen", "C1 inhibitor — antigenic", "g/L", "Laboratory-specific"),
      A("c1inh_function", "C1 inhibitor — functional", "%", "70–130"),
      A("c1q", "C1q", "mg/L", "Laboratory-specific"),
      A("c3d", "C3d / activation markers", "Laboratory-specific", "Laboratory-specific"),
    ],
  },
  {
    key: "phagocyte",
    label: "Phagocyte Function",
    note: "Performed only in a laboratory that validates the assay; a normal result does not exclude every phagocytic defect.",
    tests: [
      A("dhr", "Dihydrorhodamine (DHR) oxidative burst", "stimulation index", "Laboratory-specific"),
      A("nbt", "NBT reduction test", "% cells", "Laboratory-specific"),
      A("neutrophil_count", "Absolute neutrophil count", "×10⁹/L", "2.0–7.5"),
      A("cd11b", "CD11b / adhesion molecule expression", "%", "Laboratory-specific"),
    ],
  },
  {
    key: "challenge",
    label: "Supervised Challenge (result summary)",
    note: "The challenge protocol, doses and outcome are documented in the challenge block. Record here only the summary the unit reported.",
    tests: [
      A("ofc_result", "Oral food challenge — outcome", "outcome", "Negative"),
      A("dpt_result", "Drug provocation test — outcome", "outcome", "Negative"),
      A("cumulative_dose", "Cumulative dose tolerated", "as documented", "Not applicable"),
      A("reaction_threshold", "Dose at reaction", "as documented", "Not applicable"),
    ],
  },
];

export const allergyPanel = (key) => ALLERGY_TEST_PANELS.find((p) => p.key === key) || null;

export const allergyTest = (key) =>
  ALLERGY_TEST_PANELS.flatMap((p) => p.tests.map((t) => ({ ...t, panel: p.key, panelLabel: p.label }))).find(
    (t) => t.key === key,
  ) || null;

export const ALLERGY_TEST_KEYS = ALLERGY_TEST_PANELS.flatMap((p) => p.tests.map((t) => t.key));

// A row stores only what the clinician entered. Nothing is prefilled: an empty
// row is an unfilled row, not a normal result.
export const emptyTestRow = (testKey, encounterId) => {
  const test = allergyTest(testKey);
  if (!test) return null;
  return {
    test_key: test.key,
    label: test.label,
    panel: test.panel,
    value: "",
    unit: test.unit === "Laboratory-specific" ? "" : test.unit,
    range: test.range === "Laboratory-specific" || test.range === "Not applicable" ? "" : test.range,
    flag: "",
    interpretation: "",
    date: "",
    ordered_by: "",
    result_source: "",
    encounter_id: encounterId || "",
  };
};

// Reading aid only: parsed from the value and the range when both are numeric.
// A clinician-set flag always wins, and the printed record shows it as recorded.
export const derivedFlag = (value, range) => {
  const v = parseFloat(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(v)) return "";
  const m = String(range ?? "").match(/(-?\d+(?:[.,]\d+)?)\s*(?:–|-|to)\s*(-?\d+(?:[.,]\d+)?)/);
  if (!m) return "";
  const low = parseFloat(m[1].replace(",", "."));
  const high = parseFloat(m[2].replace(",", "."));
  if (!Number.isFinite(low) || !Number.isFinite(high)) return "";
  if (v < low) return "Low";
  if (v > high) return "High";
  return "Normal";
};

export const formatAllergyTests = (value) => {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .filter((r) => r && (String(r.value ?? "").trim() || String(r.interpretation ?? "").trim()))
    .map((r) => {
      const head = r.label || allergyTest(r.test_key)?.label || "Test";
      const result = [String(r.value ?? "").trim(), String(r.unit ?? "").trim()].filter(Boolean).join(" ");
      const range = String(r.range ?? "").trim();
      const flag = String(r.flag ?? "").trim();
      const parts = [
        result ? `Result: ${result}` : "",
        range ? `Reference: ${range}` : "",
        flag ? `Flag: ${flag}` : "",
        r.date ? `Date: ${r.date}` : "",
        r.ordered_by ? `Ordered by: ${r.ordered_by}` : "",
        r.result_source ? `Source: ${r.result_source}` : "",
        r.interpretation ? `Interpretation: ${r.interpretation}` : "",
      ].filter(Boolean);
      return parts.length ? `${head} — ${parts.join(" · ")}` : head;
    })
    .join("\n");
};