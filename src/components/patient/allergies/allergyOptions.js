// Structured allergy vocabulary — the lists the patient picks from so nobody
// has to type their allergies by hand. Stored values are the English labels
// (the clinical name); the patient reads them translated.

export const FOOD_ALLERGENS = [
  { value: "peanuts", label: "Peanuts" },
  { value: "tree_nuts", label: "Tree nuts (almonds, walnuts, cashews)" },
  { value: "milk", label: "Milk / dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "fish", label: "Fish" },
  { value: "shellfish", label: "Shellfish (shrimp, crab)" },
  { value: "wheat", label: "Wheat" },
  { value: "soy", label: "Soy" },
  { value: "sesame", label: "Sesame" },
];

export const MEDICATION_ALLERGENS = [
  { value: "penicillins", label: "Penicillins (amoxicillin, ampicillin)" },
  { value: "cephalosporins", label: "Cephalosporins (ceftriaxone, cephalexin)" },
  { value: "sulfonamides", label: "Sulfonamide antibiotics (co-trimoxazole)" },
  { value: "nsaids", label: "NSAIDs (ibuprofen, aspirin, diclofenac)" },
  { value: "macrolides", label: "Macrolide antibiotics (azithromycin, erythromycin)" },
  { value: "fluoroquinolones", label: "Fluoroquinolones (ciprofloxacin, levofloxacin)" },
  { value: "anticonvulsants", label: "Anticonvulsants (carbamazepine, lamotrigine)" },
];

export const ALLERGY_REACTIONS = [
  { value: "Rash", label: "Rash" },
  { value: "Itching", label: "Itching" },
  { value: "Swelling", label: "Swelling" },
  { value: "Difficulty breathing", label: "Difficulty breathing" },
  { value: "Anaphylaxis", label: "Anaphylaxis" },
  { value: "Nausea / vomiting", label: "Nausea / vomiting" },
  { value: "Other reaction", label: "Other reaction" },
  { value: "Don't remember", label: "Don't remember" },
];

export const ALLERGY_STATUS_OPTIONS = [
  { value: "no_known_allergies", label: "No Known Allergies" },
  { value: "not_established", label: "Not Sure" },
  { value: "prefer_not_to_answer", label: "Prefer Not to Answer" },
];

export const isCatalogAllergen = (allergen) =>
  [...FOOD_ALLERGENS, ...MEDICATION_ALLERGENS].some((item) => item.label === allergen);