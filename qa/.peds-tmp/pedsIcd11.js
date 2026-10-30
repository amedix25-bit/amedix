// Pediatrics — WHO ICD-11 MMS reference catalogue.
//
// SCOPE AND HONESTY RULES
//   * Only WHO ICD-11 MMS is used. There is no ICD-10 entry point and no ICD-10
//     crosswalk anywhere in this specialty: a paediatric diagnosis documented in
//     ICD-10 terms has to be re-expressed in ICD-11 to be coded here.
//   * Every seeded entry is marked REVIEW REQUIRED and carries no verification
//     date. A code is seeded only where the compiler could name the WHO category
//     and its official display term; the entry is still not a verified code for
//     this deployment, and a coding review has to confirm it in the WHO browser
//     before it counts as verified in the record.
//   * A code is never generated, completed, guessed or approximated. A diagnosis
//     that cannot be mapped stores NO code and is recorded as unresolved, and a
//     symptom is never filed as a diagnosis.
//   * A code is never a diagnosis. Every entry records its role, its diagnostic
//     status (confirmed / suspected / differential / ruled out / historical), its
//     mapping state and the clinician's own documented basis.
//
// WHAT IS DELIBERATELY NOT SEEDED — stated, not silently missing. Paediatrics
// spans more ICD-11 chapters than any other specialty, and a chapter listing read
// from memory is not a verified code. These are registered by NAME in
// PEDS_ICD11_UNSEEDED below, with the chapter they live in, so the clinician takes
// the code from the WHO browser (it is stored as review required) instead of
// accepting a code this catalogue cannot vouch for:
//   · the whole perinatal chapter (prematurity, low birth weight, neonatal sepsis,
//     respiratory distress, birth asphyxia, neonatal jaundice, feeding problems);
//   · congenital malformations (cardiac, neural tube, cleft, limb, chromosomal);
//   · severe and moderate acute malnutrition, stunting and micronutrient deficiency;
//   · the common acute infections of childhood (bronchiolitis, croup, otitis media,
//     urinary tract infection, gastroenteritis, dengue, malaria, HIV, tuberculosis);
//   · sickle cell disease, the thalassaemias, haemophilia and childhood malignancy
//     (coded by the haematology / oncology services);
//   · injury, poisoning, foreign body and child maltreatment (injury chapter).
// Laterality, gestational context, severity, organism and age at onset are recorded
// in the entry's own fields and are NEVER appended to a stem code by the app.

export const PEDS_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2026-01",
  label: "ICD-11 MMS",
  chapter: "Chapters 01–22 — paediatric categories across the ICD-11 MMS tabulation",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  retrieved: "2026-10-30",
};

export const PEDS_ICD11_DOMAINS = {
  infectious: "Certain infectious or parasitic diseases",
  haematology: "Diseases of the blood or blood-forming organs",
  endocrine_nutrition: "Endocrine, nutritional or metabolic diseases",
  development_behaviour: "Mental, behavioural or neurodevelopmental disorders",
  neurology: "Diseases of the nervous system",
  respiratory: "Diseases of the respiratory system",
};

// The distinction the record must keep: a hypothesis is not a diagnosis, a ruled-out
// diagnosis is not a current one, and a symptom is not a disease.
export const PEDS_ICD_STATUSES = [
  "Confirmed",
  "Suspected — not confirmed",
  "Differential diagnosis (hypothesis)",
  "Ruled out — documented as excluded",
  "Historical — previous episode, not current",
  "Symptom or sign — not a diagnosis",
];

export const PEDS_ICD_ROLES = [
  "Primary",
  "Secondary",
  "Complication of another documented diagnosis",
  "Comorbidity",
  "Underlying cause",
];

// Paediatric coding turns on age and on the perinatal context more than any other
// specialty, so both are recorded beside the code rather than inside it.
export const PEDS_AGE_BANDS = [
  "Neonate (0–27 days)",
  "Infant (28 days–11 months)",
  "Young child (1–4 years)",
  "Child (5–9 years)",
  "Adolescent (10–19 years)",
  "Age not documented",
];

export const PEDS_GESTATIONAL_CONTEXT = [
  "Term (37–42 weeks)",
  "Preterm (< 37 weeks)",
  "Post-term (> 42 weeks)",
  "Gestational age not documented",
  "Not applicable",
];

export const PEDS_SEVERITY_SCALE = [
  "Not documented",
  "Mild",
  "Moderate",
  "Severe",
  "Critical",
];

export const PEDS_ICD_DETAIL_FIELDS = [
  {
    key: "age_band",
    label: "Age band at diagnosis",
    type: "select",
    options: PEDS_AGE_BANDS,
    hint: "Paediatric categories are age-dependent — recorded beside the code, never inside it.",
  },
  {
    key: "age_at_onset",
    label: "Age at onset",
    type: "input",
    placeholder: "e.g. 4 months, 3 years 2 months",
  },
  {
    key: "gestational_context",
    label: "Gestational context",
    type: "select",
    options: PEDS_GESTATIONAL_CONTEXT,
    hint: "Only where the diagnosis arose in the perinatal period.",
  },
  {
    key: "severity_stage",
    label: "Severity or stage",
    type: "select",
    options: PEDS_SEVERITY_SCALE,
  },
  {
    key: "laterality",
    label: "Laterality",
    type: "select",
    options: ["Right", "Left", "Bilateral", "Midline / systemic", "Not applicable", "Not documented"],
  },
  { key: "aetiology", label: "Aetiology or organism", type: "input", placeholder: "e.g. respiratory syncytial virus, group A streptococcus, unknown" },
  { key: "complications", label: "Complications documented", type: "input", placeholder: "e.g. dehydration, febrile seizure, acute kidney injury" },
  { key: "associated_conditions", label: "Associated conditions", type: "input", placeholder: "e.g. prematurity, congenital heart disease, Down syndrome" },
];

export const PEDS_ICD_CATALOG_NOTE =
  "WHO ICD-11 MMS only — ICD-10 is never used and no crosswalk is applied. Every entry seeded here is marked REVIEW REQUIRED, because it was indexed from the tabulation and has not been confirmed in the WHO browser for this deployment. If the diagnosis is not listed, take the code from the WHO browser (it is stored as review required) or leave the diagnosis unresolved with no code.";

export const PEDS_ICD_CLUSTER_NOTE =
  "Leave empty unless the WHO Coding Tool produced a postcoordinated cluster. A cluster is copied exactly as the WHO browser shows it, never assembled here, and a stem code is never extended with an age, laterality or severity axis the classification does not provide.";

export const PEDS_ICD_SEARCH_GUIDANCE =
  "Search by the term used in the clinic. A paediatric diagnosis is coded at the most specific category the documentation supports; when the documentation does not support that specificity, the broader category is recorded and the missing detail is written beside it.";

// code | official display term | domain | primary tabulation entry (1 = yes)
const RAW = [
  // ---- Certain infectious or parasitic diseases -----------------------------
  "1A00|Cholera|infectious|1",
  "1A01|Typhoid fever|infectious|1",
  "1A02|Shigellosis|infectious|1",
  "1C12|Whooping cough|infectious|1",
  "1F02|Rubella|infectious|1",
  "1F03|Measles|infectious|1",

  // ---- Diseases of the blood or blood-forming organs ------------------------
  "3A00|Iron deficiency anaemia|haematology|1",

  // ---- Endocrine, nutritional or metabolic diseases -------------------------
  "5A10|Type 1 diabetes mellitus|endocrine_nutrition|1",
  "5A11|Type 2 diabetes mellitus|endocrine_nutrition|1",
  "5B81|Obesity|endocrine_nutrition|1",

  // ---- Mental, behavioural or neurodevelopmental disorders ------------------
  "6A00|Disorders of intellectual development|development_behaviour|1",
  "6A02|Autism spectrum disorder|development_behaviour|1",
  "6A05|Attention deficit hyperactivity disorder|development_behaviour|1",

  // ---- Diseases of the nervous system ---------------------------------------
  "8A62.0|Infantile spasms|neurology|1",
  "8A66|Status epilepticus|neurology|1",
  "8A80|Migraine|neurology|1",
  "8B11|Cerebral ischaemic stroke|neurology|1",
  "8D20|Cerebral palsy|neurology|1",

  // ---- Diseases of the respiratory system -----------------------------------
  "CA23|Asthma|respiratory|1",
  "CA40|Pneumonia|respiratory|1",
];

// Clinical synonyms are an INDEXING AID only: they let the clinician find the
// category by the words used in the clinic. The record always carries WHO's own
// display term, and a synonym never widens what a category covers.
const SYNONYMS = {
  "1A00": ["cholera", "rice water diarrhoea"],
  "1A01": ["enteric fever", "typhoid"],
  "1A02": ["bacillary dysentery", "shigella"],
  "1C12": ["pertussis", "whooping cough"],
  "1F02": ["rubella", "German measles", "congenital rubella"],
  "1F03": ["measles", "rubeola"],
  "3A00": ["iron deficiency", "microcytic anaemia", "anaemia of infancy"],
  "5A10": ["type 1 diabetes", "T1DM", "insulin-dependent diabetes", "diabetic ketoacidosis"],
  "5A11": ["type 2 diabetes", "T2DM", "adolescent type 2 diabetes"],
  "5B81": ["obesity", "raised BMI", "weight above healthy range"],
  "6A00": ["intellectual disability", "learning disability", "global developmental delay"],
  "6A02": ["autism", "ASD", "autistic spectrum"],
  "6A05": ["ADHD", "hyperkinetic disorder", "attention deficit"],
  "8A62.0": ["West syndrome", "infantile spasm", "epileptic spasms"],
  "8A66": ["status epilepticus", "prolonged seizure", "convulsive status"],
  "8A80": ["migraine", "migraine with aura", "abdominal migraine"],
  "8B11": ["ischaemic stroke", "cerebral infarct", "CVA", "arterial ischaemic stroke"],
  "8D20": ["cerebral palsy", "CP", "spastic diplegia", "hemiplegic cerebral palsy"],
  "CA23": ["asthma", "wheeze", "reactive airways", "asthma exacerbation"],
  "CA40": ["pneumonia", "chest infection", "lower respiratory tract infection"],
};

const CODING_NOTE = {
  "6A00":
    "Disorders of intellectual development are coded from the documented developmental and adaptive assessment — never from a single screening score, and never instead of the underlying cause when one is documented.",
  "6A02":
    "Autism spectrum disorder requires the documented developmental and behavioural assessment; a positive screening instrument is not a diagnosis and is not coded as one.",
  "6A05":
    "Attention deficit hyperactivity disorder requires symptoms documented across more than one setting with functional impact; a school report alone is not the diagnosis.",
  "8A62.0":
    "Infantile spasms is a subcategory of the epileptic encephalopathies — record the developmental course and the EEG pattern beside it.",
  "8A66":
    "Status epilepticus is coded only when the duration criterion documented in the note is met; a cluster of seizures is not status epilepticus.",
  "8D20":
    "Cerebral palsy is a clinical description of a motor disorder, not an aetiological diagnosis — record the presumed timing and cause, and the functional classification, beside it.",
  "5A10":
    "Type 1 diabetes is coded as the disease, not as its presentation: diabetic ketoacidosis is recorded as a complication beside the code.",
  "5B81":
    "Obesity in a child is defined against a growth reference (BMI-for-age), so the reference used and the plotted value are recorded beside the code.",
  "CA23":
    "Asthma is coded as the chronic disease; the acute exacerbation, its severity and the treatment given are recorded beside the code.",
  "CA40":
    "Pneumonia is coded without its organism or the WHO severity classification — record both beside the code.",
  "3A00":
    "Iron deficiency anaemia is coded only with a documented haematological result; pallor alone is a sign, not this diagnosis.",
};

export const PEDS_ICD11 = RAW.map((row) => {
  const [code, display, domain, primary] = row.split("|");
  const isPrimary = primary === "1";
  const domainLabel = PEDS_ICD11_DOMAINS[domain] || domain;
  const synonyms = SYNONYMS[code] || [];
  const stem = code.split(".")[0];
  return {
    code,
    display,
    synonyms,
    domain,
    domainLabel,
    primary: isPrimary,
    category: "medical_condition",
    release: PEDS_ICD11_MMS.release,
    version: `${PEDS_ICD11_MMS.label} ${PEDS_ICD11_MMS.release}`,
    source: PEDS_ICD11_MMS.browser_url,
    browser: PEDS_ICD11_MMS.browser_url,
    // Indexed from the tabulation — NOT confirmed in the WHO browser.
    mapping_state: "review_required",
    verified_date: "",
    precise: true,
    specificity: code.includes(".") ? "Subcategory — most specific" : "Category (stem) — select a subcategory when known",
    aliases: [display, domainLabel, ...synonyms].filter(Boolean).join(" "),
    hierarchy: {
      chapter: domainLabel,
      group: domainLabel,
      family: stem,
      level: code.includes(".") ? "Subcategory" : "Category",
    },
    coding_note: CODING_NOTE[code] || "",
    definition: isPrimary
      ? `WHO ICD-11 MMS category in ${domainLabel}. Inclusion and exclusion notes are not reproduced here — confirm the category in the WHO browser before relying on a residual code.`
      : "WHO carries this as a NON-primary tabulation entry. Document it together with the condition it qualifies, never instead of it.",
  };
});

for (const entry of PEDS_ICD11) {
  const stem = entry.code.split(".")[0];
  const parent = stem !== entry.code ? PEDS_ICD11.find((i) => i.code === stem) : null;
  entry.parent_code = parent ? parent.code : "";
  entry.parent_display = parent ? parent.display : "";
  entry.hierarchy.parent = parent ? `${parent.code} ${parent.display}` : "";
}

// Categories this catalogue does NOT seed, by name and chapter, so the clinician
// knows to take the code from the WHO browser instead of accepting a guess. This is
// a coding index, not a coded list: no code appears against any of these terms.
export const PEDS_ICD11_UNSEEDED = [
  { term: "Neonatal jaundice", chapter: "Certain conditions originating in the perinatal period", why: "Perinatal categories are not seeded — take the code from the WHO browser and record the bilirubin value and threshold beside it." },
  { term: "Neonatal sepsis", chapter: "Certain conditions originating in the perinatal period", why: "Take the code from the WHO browser; record the organism and the setting beside it." },
  { term: "Preterm birth / low birth weight", chapter: "Certain conditions originating in the perinatal period", why: "Take the code from the WHO browser; record gestational age and birth weight beside it." },
  { term: "Neonatal respiratory distress", chapter: "Certain conditions originating in the perinatal period", why: "Take the code from the WHO browser; record the support required beside it." },
  { term: "Birth asphyxia / hypoxic-ischaemic encephalopathy", chapter: "Certain conditions originating in the perinatal period", why: "Take the code from the WHO browser; record the staging and the resuscitation beside it." },
  { term: "Congenital heart disease", chapter: "Congenital malformations, deformations and chromosomal abnormalities", why: "Coded by the paediatric cardiology service — take the specific defect code from the WHO browser." },
  { term: "Neural tube defect", chapter: "Congenital malformations, deformations and chromosomal abnormalities", why: "Take the specific malformation code from the WHO browser; record the level and the closure status beside it." },
  { term: "Down syndrome and other chromosomal abnormalities", chapter: "Congenital malformations, deformations and chromosomal abnormalities", why: "Take the code from the WHO browser and record the karyotype beside it." },
  { term: "Severe or moderate acute malnutrition", chapter: "Endocrine, nutritional or metabolic diseases", why: "Take the code from the WHO browser; record MUAC, weight-for-height z-score and oedema beside it." },
  { term: "Vitamin D deficiency or rickets", chapter: "Endocrine, nutritional or metabolic diseases", why: "Take the code from the WHO browser; record the biochemical and radiographic findings beside it." },
  { term: "Bronchiolitis", chapter: "Diseases of the respiratory system", why: "Take the code from the WHO browser; record the respiratory support and feeding beside it." },
  { term: "Croup", chapter: "Diseases of the respiratory system", why: "Take the code from the WHO browser; record the stridor-at-rest state beside it." },
  { term: "Acute otitis media", chapter: "Diseases of the ear or mastoid process", why: "Take the code from the WHO browser; record the laterality and the otoscopy finding beside it." },
  { term: "Urinary tract infection", chapter: "Diseases of the genitourinary system", why: "Take the code from the WHO browser; record the culture result and the imaging decision beside it." },
  { term: "Acute gastroenteritis", chapter: "Diseases of the digestive system", why: "Take the code from the WHO browser; record the dehydration classification beside it." },
  { term: "Sickle cell disease and thalassaemia", chapter: "Diseases of the blood or blood-forming organs", why: "Coded with the haematology service — take the genotype-specific code from the WHO browser." },
  { term: "Childhood malignancy", chapter: "Neoplasms", why: "Coded by the oncology service — take the morphology-specific code from the WHO browser." },
  { term: "Type 1 diabetes presenting in ketoacidosis", chapter: "Endocrine, nutritional or metabolic diseases", why: "Code the diabetes and record the ketoacidosis as a complication beside it." },
  { term: "Injury, poisoning or foreign body", chapter: "Injury, poisoning or certain other consequences of external causes", why: "Take the injury code from the WHO browser; record the mechanism and intent beside it." },
  { term: "Child maltreatment", chapter: "Injury, poisoning or certain other consequences of external causes", why: "Code only what the assessment established — suspicion is recorded in the safeguarding record and is never coded as a confirmed injury." },
];

// Only the domains one note can code: a growth record never suggests a stroke code.
export const pedsCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return PEDS_ICD11;
  return PEDS_ICD11.filter((i) => wanted.includes(i.domain));
};

export const matchesPedsIcd11 = (item, query) => {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return false;
  return [item.code, item.display, item.definition, item.aliases]
    .filter(Boolean)
    .some((s) => String(s).toLowerCase().includes(q));
};