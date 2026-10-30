// Neurology — WHO ICD-11 MMS reference catalogue.
//
// SCOPE AND HONESTY RULES
//   * Only WHO ICD-11 MMS is used. No ICD-10 entry point and no ICD-10 crosswalk
//     exists anywhere in this specialty.
//   * Every code below is a Chapter 08 (Diseases of the nervous system) category
//     or subcategory whose code and official display term were read from the
//     published ICD-11 MMS tabulation, release 2026-01, at implementation time.
//     The words are WHO's; nothing is paraphrased into a code name.
//   * Nothing here is presented as verified. Each seeded entry carries
//     `mapping_state: "review_required"` and NO verification date, because it was
//     read from the tabulation listing and not yet confirmed in the WHO browser
//     by a coder for this deployment. The clinician sees "Review required" and a
//     coding review has to confirm it before it is treated as verified.
//   * A code is never generated, completed, guessed or inferred. A diagnosis that
//     cannot be mapped stores NO code and is recorded as unresolved.
//   * A code is never a diagnosis. Every entry records role, diagnostic status
//     (confirmed / suspected / differential / symptom / sign), mapping state and
//     the clinician's documented basis.
//
// WHAT IS DELIBERATELY NOT SEEDED — stated, not silently missing. These areas are
// coded by their own services or need a category decision this catalogue cannot
// make from a listing, so the clinician takes the code from the WHO browser (it is
// stored as REVIEW REQUIRED) or leaves the diagnosis unresolved:
//   · CNS infections (meningitis, encephalitis, abscess) — Chapter 01 categories.
//   · Dementias and neurodevelopmental disorders — Chapter 06 categories.
//   · Nervous-system neoplasms — Chapter 02, coded by the oncology service.
//   · Head and spinal injury — Chapter 22 (injury) categories.
//   · Congenital malformations of the nervous system — Chapter 20.
//   · Peripheral-nerve entrapment, mononeuropathies beyond the polyneuropathy
//     category below, myopathies and muscular dystrophies, and the hereditary
//     ataxias — each needs its own verified subcategory list.
//   · Laterality. WHO carries it as a postcoordination axis (XK8G left, XK9K
//     right, XK9J bilateral). It is recorded in the entry's own laterality field
//     and a stem code is never rewritten to carry it.
//   · Severity, stage, vascular territory, seizure frequency and disability. These
//     are structured fields in the note; the code is never altered to carry them.

export const NEURO_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2026-01",
  label: "ICD-11 MMS",
  chapter: "Chapter 08 — Diseases of the nervous system",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  retrieved: "2026-10-30",
};

export const NEURO_ICD11_DOMAINS = {
  cerebrovascular: "Cerebrovascular disease",
  epilepsy: "Epilepsy and seizures",
  headache: "Headache disorders",
  demyelinating: "Demyelinating disease of the central nervous system",
  movement: "Movement disorders",
  neuromuscular: "Neuromuscular junction and peripheral nerve",
};

// The diagnostic status a coder reads off the note. A symptom and a sign are not
// diagnoses and are never recorded as one; a differential is a hypothesis, not a
// confirmed category.
export const NEURO_ICD_STATUSES = [
  "Confirmed",
  "Suspected",
  "Differential diagnosis",
  "Symptom — not a diagnosis",
  "Sign — not a diagnosis",
  "Historical — previous episode",
  "Resolved",
];

export const NEURO_ICD_ROLES = ["Primary", "Secondary", "Complication of another diagnosis"];

// The detail a code cannot carry is recorded beside it, never appended to it.
export const NEURO_LATERALITY = [
  "Right",
  "Left",
  "Bilateral",
  "Midline / systemic",
  "Not applicable",
  "Not documented",
];

export const NEURO_VASCULAR_TERRITORIES = [
  "Anterior cerebral artery",
  "Middle cerebral artery",
  "Posterior cerebral artery",
  "Vertebrobasilar",
  "Cerebellar",
  "Multiple territories",
  "Not determined",
];

export const NEURO_ICD_DETAIL_FIELDS = [
  {
    key: "laterality",
    label: "Laterality",
    type: "select",
    options: NEURO_LATERALITY,
    hint: "Recorded beside the code — never appended to it.",
  },
  {
    key: "anatomical_site",
    label: "Anatomical localisation",
    type: "input",
    placeholder: "e.g. left middle cerebral artery territory, cervical cord, neuromuscular junction",
  },
  {
    key: "territory",
    label: "Vascular territory",
    type: "select",
    options: NEURO_VASCULAR_TERRITORIES,
    hint: "Only for a cerebrovascular diagnosis.",
  },
  { key: "subtype", label: "Subtype or clinical variant", type: "input", placeholder: "e.g. lacunar, cardioembolic, focal onset" },
  { key: "severity_stage", label: "Severity or stage", type: "input", placeholder: "e.g. NIHSS 14, EDSS 3.5, ICH volume 22 mL" },
  { key: "complications", label: "Complications documented", type: "input", placeholder: "e.g. haemorrhagic transformation, aspiration pneumonia" },
  { key: "associated_conditions", label: "Associated conditions", type: "input", placeholder: "e.g. atrial fibrillation, type 2 diabetes" },
];

export const NEURO_ICD_CATALOG_NOTE =
  "WHO ICD-11 MMS only — ICD-10 is never used and no crosswalk is applied. Every seeded entry is a Chapter 08 category or subcategory read from the 2026-01 tabulation and is marked REVIEW REQUIRED: a coding review must confirm it against the WHO browser before it counts as verified in this record.";

export const NEURO_ICD_CLUSTER_NOTE =
  "Leave empty unless the WHO Coding Tool produced a postcoordinated cluster. A cluster is copied exactly as the WHO browser shows it (codes joined with & and /) — never assembled here, and never extended with a laterality, severity or territory stem the classification does not provide.";

export const NEURO_ICD_SEARCH_GUIDANCE =
  "Search by the term used in the clinic. If the diagnosis is not in the catalogue, take the code from the WHO browser (it is stored as review required), or record the diagnosis with no code and leave it unresolved — never approximate a code.";

// code | official display term | domain | primary tabulation entry (1 = yes)
const RAW = [
  // ---- Cerebrovascular ------------------------------------------------------
  "8B00|Intracerebral haemorrhage|cerebrovascular|1",
  "8B01|Subarachnoid haemorrhage|cerebrovascular|1",
  "8B10|Transient ischaemic attack|cerebrovascular|1",
  "8B11|Cerebral ischaemic stroke|cerebrovascular|1",

  // ---- Epilepsy and seizures ------------------------------------------------
  "8A60|Epilepsy due to structural or metabolic conditions or diseases|epilepsy|1",
  "8A61|Genetic or presumed genetic syndromes primarily expressed as epilepsy|epilepsy|1",
  "8A62|Epileptic encephalopathies|epilepsy|1",
  "8A62.0|Infantile spasms|epilepsy|1",
  "8A63|Seizure due to acute causes|epilepsy|1",
  "8A64|Single seizure due to remote causes|epilepsy|0",
  "8A65|Single unprovoked seizure|epilepsy|1",
  "8A66|Status epilepticus|epilepsy|1",
  "8A66.0|Convulsive status epilepticus|epilepsy|1",
  "8A66.1|Non-convulsive status epilepticus|epilepsy|1",
  "8A6Y|Other specified epilepsy or seizures|epilepsy|1",
  "8A6Z|Epilepsy or seizures, unspecified|epilepsy|1",

  // ---- Headache disorders ---------------------------------------------------
  "8A80|Migraine|headache|1",
  "8A80.2|Chronic migraine|headache|1",
  "8A81|Tension-type headache|headache|1",
  "8A81.0|Infrequent episodic tension-type headache|headache|1",
  "8A81.1|Frequent episodic tension-type headache|headache|1",
  "8A81.2|Chronic tension-type headache|headache|1",
  "8A82|Trigeminal autonomic cephalalgias|headache|1",

  // ---- Demyelinating disease of the CNS -------------------------------------
  "8A40|Multiple sclerosis|demyelinating|1",
  "8A40.0|Relapsing-remitting multiple sclerosis|demyelinating|1",
  "8A40.1|Primary progressive multiple sclerosis|demyelinating|1",
  "8A40.2|Secondary progressive multiple sclerosis|demyelinating|1",
  "8A41|Isolated demyelinating syndromes of the central nervous system|demyelinating|1",

  // ---- Movement disorders ---------------------------------------------------
  "8A00|Parkinsonism|movement|1",
  "8A00.0|Parkinson disease|movement|1",
  "8A00.1|Atypical parkinsonism|movement|1",
  "8A00.2|Secondary parkinsonism|movement|1",
  "8A01|Choreiform disorders|movement|1",
  "8A02|Dystonic disorders|movement|1",

  // ---- Neuromuscular junction and peripheral nerve --------------------------
  "8C03|Other secondary polyneuropathy|neuromuscular|1",
  "8C60|Myasthenia gravis|neuromuscular|1",
  "8C61|Congenital myasthenic syndromes|neuromuscular|1",
];

// Clinical synonyms are an INDEXING AID only: they let the clinician find the
// category by the words used in the clinic. The record always carries WHO's own
// display term, and a synonym never widens what a category covers.
const SYNONYMS = {
  "8B00": ["ICH", "brain haemorrhage", "haemorrhagic stroke"],
  "8B01": ["SAH", "subarachnoid bleed", "aneurysmal bleed"],
  "8B10": ["TIA", "transient cerebral ischaemia"],
  "8B11": ["ischaemic stroke", "infarction", "CVA", "cerebral infarct"],
  "8A60": ["symptomatic epilepsy", "structural epilepsy", "metabolic epilepsy"],
  "8A61": ["genetic epilepsy", "idiopathic epilepsy", "familial epilepsy"],
  "8A62": ["epileptic encephalopathy", "developmental and epileptic encephalopathy"],
  "8A63": ["provoked seizure", "acute symptomatic seizure"],
  "8A65": ["first seizure", "single seizure"],
  "8A66": ["status", "SE", "continuous seizure"],
  "8A80": ["migraine headache", "migraine with aura", "migraine without aura"],
  "8A81": ["tension headache"],
  "8A82": ["cluster headache", "TAC", "hemicrania continua", "paroxysmal hemicrania"],
  "8A40": ["MS", "multiple sclerosis"],
  "8A40.0": ["RRMS", "relapsing remitting MS"],
  "8A40.1": ["PPMS", "primary progressive MS"],
  "8A40.2": ["SPMS", "secondary progressive MS"],
  "8A41": ["CIS", "clinically isolated syndrome", "radiologically isolated syndrome"],
  "8A00": ["parkinsonism", "extrapyramidal syndrome"],
  "8A00.0": ["Parkinson's disease", "idiopathic parkinsonism", "PD"],
  "8A00.1": ["PSP", "MSA", "CBD", "atypical parkinsonian syndrome"],
  "8A00.2": ["drug-induced parkinsonism", "vascular parkinsonism"],
  "8A01": ["chorea", "Huntington", "hemiballismus"],
  "8A02": ["dystonia", "cervical dystonia", "blepharospasm"],
  "8C03": ["polyneuropathy", "peripheral neuropathy", "diabetic neuropathy"],
  "8C60": ["MG", "myasthenia", "ocular myasthenia", "generalised myasthenia"],
  "8C61": ["congenital myasthenia"],
};

// A code that WHO carries as a non-primary tabulation entry is documented together
// with the condition it qualifies — never instead of it.
const CODING_NOTE = {
  "8A64": "Single seizure due to a remote cause — document it with the remote cause it follows.",
  "8A66.0": "Convulsive status epilepticus is a subcategory of 8A66; use it when convulsive activity is documented.",
  "8A66.1": "Non-convulsive status epilepticus requires EEG documentation — never assign it on clinical suspicion alone.",
  "8A62.0": "Infantile spasms is a subcategory of the epileptic encephalopathies; record the developmental course beside it.",
  "8A80.2": "Chronic migraine is a subcategory of migraine, not a separate primary headache — record the headache days per month beside it.",
  "8A00": "Parkinsonism is the syndrome. Parkinson disease (8A00.0) is a separate subcategory — do not use the syndrome code for a confirmed disease.",
  "8A40": "Multiple sclerosis is the stem; the clinical course (8A40.0–8A40.2) is a subcategory and is recorded there when the course is documented.",
  "8B11": "Cerebral ischaemic stroke does not carry the vascular territory or the mechanism — record both beside the code.",
};

export const NEURO_ICD11 = RAW.map((row) => {
  const [code, display, domain, primary] = row.split("|");
  const isPrimary = primary === "1";
  const domainLabel = NEURO_ICD11_DOMAINS[domain] || domain;
  const synonyms = SYNONYMS[code] || [];
  return {
    code,
    display,
    synonyms,
    domain,
    domainLabel,
    primary: isPrimary,
    category: "medical_condition",
    release: NEURO_ICD11_MMS.release,
    version: `${NEURO_ICD11_MMS.label} ${NEURO_ICD11_MMS.release}`,
    source: NEURO_ICD11_MMS.browser_url,
    browser: NEURO_ICD11_MMS.browser_url,
    // Read from the tabulation listing, NOT confirmed in the WHO browser.
    mapping_state: "review_required",
    verified_date: "",
    precise: true,
    specificity: code.includes(".") ? "Subcategory — most specific" : "Category (stem) — select a subcategory when known",
    aliases: [display, domainLabel, ...synonyms].filter(Boolean).join(" "),
    hierarchy: {
      chapter: NEURO_ICD11_MMS.chapter,
      group: domainLabel,
      family: code.split(".")[0],
      level: code.includes(".") ? "Subcategory" : "Category",
    },
    coding_note: CODING_NOTE[code] || "",
    definition: isPrimary
      ? `WHO ICD-11 MMS category in ${domainLabel}. Inclusion and exclusion notes are not reproduced — confirm the exact category in the WHO browser before relying on a residual (…Y / …Z) code.`
      : "WHO carries this as a NON-primary tabulation entry. Document it together with the condition it qualifies, never instead of it.",
  };
});

for (const entry of NEURO_ICD11) {
  const stem = entry.code.split(".")[0];
  const parent = stem !== entry.code ? NEURO_ICD11.find((i) => i.code === stem) : null;
  entry.parent_code = parent ? parent.code : "";
  entry.parent_display = parent ? parent.display : "";
  entry.hierarchy.parent = parent ? `${parent.code} ${parent.display}` : "";
}

// Only the domains one note can code: an EEG report never suggests a stroke code.
export const neurologyCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return NEURO_ICD11;
  return NEURO_ICD11.filter((i) => wanted.includes(i.domain));
};

export const matchesNeuroIcd11 = (item, query) => {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return false;
  return [item.code, item.display, item.definition, item.aliases]
    .filter(Boolean)
    .some((s) => String(s).toLowerCase().includes(q));
};