// Allergy & Immunology ICD-11 MMS reference catalogue.
//
// WHAT IS STATED RATHER THAN GUESSED
// This build did NOT verify allergy and immunology codes against a published
// ICD-11 MMS code listing. Every entry is therefore stored as REVIEW REQUIRED —
// the clinician confirms the code in the WHO ICD-11 browser before it is relied
// on, and the note records that it was confirmed and by whom. Nothing here is
// invented, and no ICD-10 code or ICD-10 crosswalk appears anywhere.
//
// A large part of allergy practice sits in categories whose exact code could not
// be confirmed here — food allergy, drug allergy, venom allergy, hereditary and
// acquired angioedema, the individual inborn errors of immunity and the
// eosinophilic disorders. Those are NOT guessed: ALLERGY_NOT_IN_CATALOGUE lists
// them, the field tells the clinician to take the code from the WHO browser, and
// the note stores it as review required until it is checked. A wrong code is
// worse than no code.
//
// A code is never a diagnosis. Selecting a category records a SUSPECTED
// diagnosis carrying its release and source; only the clinician documents
// confirmation, the clinical basis and the detail the code cannot carry.

export const ALLERGY_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2026-01",
  label: "ICD-11 MMS",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  source_url: "https://icd.who.int/",
  retrieved: "2026-11-08",
  chapters:
    "Chapter 04 — Immune system disorders; Chapter 12 — Diseases of the skin; Chapter 11 — Diseases of the respiratory system (asthma and rhinitis categories)",
  sources: [
    "WHO ICD-11 browser 2026-01 — the only reference used for clinician verification and postcoordination",
    "No published MMS extraction was used to verify these entries in this build — each is therefore marked review required",
  ],
  verification_note:
    "Allergy and immunology entries below are category pointers, not verified codes. Confirm the code and its display term in the WHO browser before the note is signed.",
};

export const ALLERGY_ICD11_DOMAINS = {
  anaphylaxis: "Anaphylaxis and severe systemic reactions",
  food_allergy: "Food allergy and food-induced reactions",
  drug_allergy: "Drug and substance hypersensitivity",
  respiratory: "Asthma and lower respiratory allergy",
  rhinitis: "Allergic rhinitis and conjunctivitis",
  skin: "Atopic dermatitis, urticaria and contact dermatitis",
  urticaria_angioedema: "Urticaria, angioedema and bradykinin-mediated swelling",
  immunodeficiency: "Inborn errors of immunity and immune dysregulation",
  eosinophilic: "Eosinophilic and mast cell disorders",
  venom: "Venom and insect-sting allergy",
};

const R = (code, display, domain, coding_note) => ({
  code,
  display,
  domain,
  mapping_state: "review_required",
  specificity: code.includes(".") ? "Subcategory" : "Block (stem)",
  release: ALLERGY_ICD11_MMS.release,
  source: "WHO ICD-11 browser — confirm before use",
  verified_date: "",
  coding_note:
    coding_note ||
    "Category pointer only. Confirm the code and its exact display term in the WHO ICD-11 browser; this entry was not verified against a published MMS listing in this build.",
});

export const ALLERGY_ICD11 = [
  R("4A84", "Anaphylaxis", "anaphylaxis", "Confirm the trigger-specific subcategory in the browser; the trigger is recorded in the note's trigger field."),
  R("CA23", "Asthma", "respiratory", "GINA severity and control are documented separately — they are not coding categories."),
  R("CA08", "Allergic rhinitis", "rhinitis", "ARIA classification (intermittent/persistent, mild/moderate–severe) is recorded in the note, not in the code."),
  R("EA80", "Atopic eczema", "skin", "Severity instruments are recorded in the note; the code carries the diagnosis only."),
  R("EB05", "Urticaria", "urticaria_angioedema", "Acute vs chronic and the activity score are recorded in the note, not in the code."),
  R("4A00", "Primary immunodeficiencies", "immunodeficiency", "Select the specific inborn error of immunity in the browser where it is known; otherwise code the category and state that it is uncategorised."),
];

// Diagnoses this specialty documents that are deliberately NOT given a code
// here. Recording the clinical term with no code, flagged for coding review, is
// the honest record; an invented code is not.
export const ALLERGY_NOT_IN_CATALOGUE = [
  "Food allergy and food-induced anaphylaxis (specific food and mechanism)",
  "Drug allergy and hypersensitivity reactions by phenotype (including penicillin and NSAID hypersensitivity)",
  "Venom and insect-sting allergy",
  "Hereditary and acquired angioedema, and ACE-inhibitor-associated angioedema",
  "Individual inborn errors of immunity (antibody deficiencies, combined and cellular immunodeficiencies, phagocytic defects, complement deficiencies, immune dysregulation)",
  "Eosinophilic disorders (eosinophilic oesophagitis, eosinophilic asthma, EGPA)",
  "Exercise-induced bronchoconstriction and exercise-associated food reactions",
  "Contact dermatitis by allergen",
  "Mast cell disorders other than the urticaria category",
];

export const allergyCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return ALLERGY_ICD11;
  return ALLERGY_ICD11.filter((i) => wanted.includes(i.domain));
};

export const ALLERGY_CATALOG_STATS = {
  total: ALLERGY_ICD11.length,
  verified: ALLERGY_ICD11.filter((i) => i.mapping_state === "verified").length,
  review_required: ALLERGY_ICD11.filter((i) => i.mapping_state === "review_required").length,
};