// Emergency Medicine ICD-11 MMS reference catalogue.
//
// WHAT THIS IS, AND WHAT IT IS NOT
//
// Every code and title below was read from the published ICD-11 MMS tabulation
// for release 2026-01 (the current release at the time of writing, 2026-10-28)
// as reproduced verbatim by the Find-A-Code ICD-11 MMS browser. The chapters and
// blocks read are listed in EMERGENCY_REFERENCES.icd11_mms. Nothing here is
// generated from a clinical phrase, inferred from a symptom, or completed from
// memory.
//
// COVERAGE IS DELIBERATELY EXPLICIT. This is a curated core for the presentations
// the Emergency Medicine notes actually document — not the whole classification.
// A diagnosis outside the catalogue is entered by the clinician from the WHO
// ICD-11 browser (icd.who.int) and stored with mapping_state "review_required"
// until checked — the field never suggests, completes or invents a code. Known
// gaps, stated rather than hidden:
//   · Subcategories of intracranial injury (concussion, contusion, traumatic
//     subdural and extradural haemorrhage) — only the NA07 category was verified
//     in this build; select the subcategory from the WHO browser.
//   · Fractures other than skull and rib/sternum/thoracic spine, and injuries of
//     the abdomen and limbs — code from the WHO browser with the specific site.
//   · Poisoning by a named drug or substance: NE60/NE61 are broad categories; the
//     specific substance is coded as an extension in the WHO browser.
//   · Environmental injury (heat illness, hypothermia from exposure, drowning,
//     electrical injury, envenomation) — not verified in this build except
//     hypoglycaemia-adjacent metabolic states; code from the WHO browser.
//   · Acute kidney injury, rhabdomyolysis, electrolyte emergencies and acute
//     liver failure — code from the WHO browser.
//   · Mental-health and self-harm presentations — code from the WHO browser;
//     the note records the risk assessment, not a code alone.
//
// A code is never a diagnosis. The field records role (primary/secondary), status
// (confirmed/provisional/differential), the clinical basis and the mapping state,
// and only a clinician confirms.

export const EMERGENCY_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2026-01",
  label: "ICD-11 MMS",
  chapter:
    "Multiple chapters — 01 infections, 04 immune, 05 endocrine/metabolic, 08 nervous, 11 circulatory, 12 respiratory, 21 symptoms and signs, 22 injury and poisoning",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  source_url: "https://www.findacode.com/icd-11/",
  retrieved: "2026-10-28",
};

export const EMERGENCY_ICD11_DOMAINS = {
  cardiac_ischaemia: "Ischaemic heart disease and acute coronary syndromes",
  arrest_shock: "Cardiac arrest, shock and impaired perfusion",
  cerebrovascular: "Cerebrovascular disease (stroke and intracranial haemorrhage)",
  sepsis: "Sepsis and septic shock",
  trauma: "Injury — head and thorax",
  respiratory: "Respiratory failure, obstruction and pleural injury",
  metabolic_neuro: "Metabolic emergencies and status epilepticus",
  toxicology: "Harmful effects of substances",
  allergy: "Anaphylaxis and hypersensitivity",
  general: "General emergency symptoms",
  symptoms_signs: "Presenting symptoms and signs (chapter 21)",
  external_causes: "External causes of morbidity or mortality (chapter 23)",
};

const SPECIFICITY = {
  BLOCK: "Block (stem) — select a subcategory when known",
  SUB: "Subcategory — most specific",
};

// The kind of clinical concept a code describes. A symptom and a confirmed
// disease carry very different weight in a record, so the category travels with
// every coded entry and is chosen from the code's own chapter — never guessed
// from the words the clinician typed.
export const EMERGENCY_ICD11_CATEGORIES = {
  SYMPTOM: "Symptom or sign",
  DISEASE: "Disease or disorder",
  INJURY: "Injury",
  POISONING: "Poisoning or adverse effect",
  EXTERNAL: "External cause",
};

const categoryFor = (code) => {
  if (/^PL2/i.test(code)) return EMERGENCY_ICD11_CATEGORIES.EXTERNAL;
  if (/^NE6/i.test(code)) return EMERGENCY_ICD11_CATEGORIES.POISONING;
  if (/^N[AB]/i.test(code)) return EMERGENCY_ICD11_CATEGORIES.INJURY;
  if (/^M[A-Z]/i.test(code)) return EMERGENCY_ICD11_CATEGORIES.SYMPTOM;
  return EMERGENCY_ICD11_CATEGORIES.DISEASE;
};

// `aliases` are search aids only. They are never displayed as a code.
const entry = (
  code,
  display,
  domain,
  { sub = false, aliases = "", coding_note = "", chapter = "", block = "", definition = "" } = {}
) => ({
  code,
  display,
  domain,
  chapter,
  block,
  definition,
  category: categoryFor(code),
  specificity: sub ? SPECIFICITY.SUB : SPECIFICITY.BLOCK,
  release: EMERGENCY_ICD11_MMS.release,
  system: EMERGENCY_ICD11_MMS.system,
  system_uri: EMERGENCY_ICD11_MMS.system_uri,
  source: EMERGENCY_ICD11_MMS.source_url,
  verified_date: EMERGENCY_ICD11_MMS.retrieved,
  aliases,
  coding_note,
});

const STEM_NOTE =
  "Catalogue entry is a stem category. Code the most specific subcategory in the WHO browser when one applies, and " +
  "record the code you verified there.";

export const EMERGENCY_ICD11 = [
  // ---- Ischaemic heart disease -------------------------------------------
  entry("BA40", "Angina pectoris", "cardiac_ischaemia", {
    aliases: "chest pain angina ischaemic cardiac",
    coding_note: "A symptom-level category: unstable angina is a clinical diagnosis documented in the note, not created by the code.",
  }),
  entry("BA41", "Acute myocardial infarction", "cardiac_ischaemia", {
    aliases: "ami mi heart attack",
    coding_note: STEM_NOTE,
  }),
  entry("BA41.0", "Acute ST elevation myocardial infarction", "cardiac_ischaemia", {
    sub: true,
    aliases: "stemi st elevation",
  }),
  entry("BA41.1", "Acute non-ST elevation myocardial infarction", "cardiac_ischaemia", {
    sub: true,
    aliases: "nstemi non st elevation",
  }),
  entry("BA41.Z", "Acute myocardial infarction, unspecified", "cardiac_ischaemia", {
    sub: true,
    aliases: "mi unspecified",
    coding_note: "Use only when the type could not be established — never as a substitute for STEMI/NSTEMI.",
  }),
  entry("BA42", "Subsequent myocardial infarction", "cardiac_ischaemia", {
    aliases: "reinfarction recurrent mi",
  }),
  entry("BA43", "Coronary thrombosis not resulting in myocardial infarction", "cardiac_ischaemia", {
    aliases: "coronary thrombosis",
  }),

  // ---- Cardiac arrest, shock, perfusion ----------------------------------
  entry("MC82", "Cardiac arrest", "arrest_shock", {
    aliases: "arrest cpr resuscitation pulseless",
    coding_note:
      "Chapter 21 symptom/sign category. Record the arrest in the code record and, when known, the underlying cause with its own code.",
  }),
  entry("MG40", "Shock", "arrest_shock", {
    aliases: "shock hypotension hypoperfusion",
    coding_note:
      "Chapter 21 general symptom. Undifferentiated shock is coded here; once the cause is established, code the cause as the primary diagnosis.",
  }),
  entry("MG45", "Syncope or collapse", "arrest_shock", {
    aliases: "syncope collapse faint",
  }),
  entry("MG46", "Systemic inflammatory response syndrome of noninfectious origin", "arrest_shock", {
    aliases: "sirs noninfectious",
    coding_note: "Never use as a substitute for sepsis — sepsis is coded 1G40/1G41.",
  }),
  entry("MG4A", "Multi organ failure", "arrest_shock", {
    aliases: "multi organ failure moF",
  }),

  // ---- Cerebrovascular ----------------------------------------------------
  entry("8B00", "Intracerebral haemorrhage", "cerebrovascular", {
    aliases: "ich haemorrhagic stroke bleed",
  }),
  entry("8B01", "Subarachnoid haemorrhage", "cerebrovascular", {
    aliases: "sah subarachnoid",
  }),
  entry("8B02", "Nontraumatic subdural haemorrhage", "cerebrovascular", {
    aliases: "subdural sdh nontraumatic",
    coding_note: "Traumatic subdural haemorrhage is coded in Chapter 22 (intracranial injury), not here.",
  }),
  entry("8B03", "Nontraumatic epidural haemorrhage", "cerebrovascular", {
    aliases: "extradural epidural edh nontraumatic",
  }),
  entry("8B10", "Transient ischaemic attack", "cerebrovascular", {
    aliases: "tia transient ischaemic attack",
  }),
  entry("8B11", "Cerebral ischaemic stroke", "cerebrovascular", {
    aliases: "ischaemic stroke infarct cva",
    coding_note: STEM_NOTE,
  }),
  entry("8B20", "Stroke not known if ischaemic or haemorrhagic", "cerebrovascular", {
    aliases: "stroke undetermined cva",
    coding_note: "Use only while imaging has not established the type — not as a permanent diagnosis.",
  }),
  entry("8B0Z", "Intracranial haemorrhage, unspecified", "cerebrovascular", {
    aliases: "intracranial haemorrhage unspecified",
  }),

  // ---- Sepsis -------------------------------------------------------------
  entry("1G40", "Sepsis without septic shock", "sepsis", {
    aliases: "sepsis infection",
  }),
  entry("1G41", "Sepsis with septic shock", "sepsis", {
    aliases: "septic shock sepsis shock",
    coding_note:
      "WHO coding: sepsis with septic shock — the infection code is added alongside. Septic shock is not coded as MG40.",
  }),

  // ---- Trauma -------------------------------------------------------------
  entry("NA02", "Fracture of skull or facial bones", "trauma", {
    aliases: "skull fracture facial fracture head injury",
    coding_note: STEM_NOTE,
  }),
  entry("NA07", "Intracranial injury", "trauma", {
    aliases: "head injury tbi traumatic brain injury intracranial",
    coding_note:
      "Stem category. Concussion, contusion and traumatic haemorrhage are its subcategories — select the specific one " +
      "in the WHO browser; they were not verified in this build.",
  }),
  entry("NA82", "Fracture of rib, sternum or thoracic spine", "trauma", {
    aliases: "rib fracture sternum flail chest thoracic spine",
    coding_note: STEM_NOTE,
  }),
  entry("NB30", "Injury of blood vessels of thorax", "trauma", {
    aliases: "thoracic vascular injury aorta",
  }),
  entry("NB31", "Injury of heart", "trauma", {
    aliases: "cardiac injury blunt cardiac",
  }),
  entry("NB32", "Injury of other or unspecified intrathoracic organs", "trauma", {
    aliases: "lung injury intrathoracic",
  }),
  entry("NB35", "Multiple injuries of thorax", "trauma", {
    aliases: "multiple thoracic injuries",
  }),

  // ---- Respiratory --------------------------------------------------------
  entry("CA22", "Chronic obstructive pulmonary disease", "respiratory", {
    aliases: "copd exacerbation",
  }),
  entry("CA23", "Asthma", "respiratory", {
    aliases: "asthma wheeze bronchospasm",
  }),
  entry("CB21", "Pneumothorax", "respiratory", {
    aliases: "pneumothorax collapsed lung",
  }),
  entry("CB26", "Haemothorax", "respiratory", {
    aliases: "haemothorax hemothorax",
  }),
  entry("CB27", "Pleural effusion", "respiratory", {
    aliases: "pleural effusion",
  }),
  entry("CB41", "Respiratory failure", "respiratory", {
    aliases: "respiratory failure hypoxia hypercapnia",
    coding_note: STEM_NOTE,
  }),

  // ---- Metabolic and status epilepticus -----------------------------------
  entry("5A20", "Diabetic hyperosmolar hyperglycaemic state", "metabolic_neuro", {
    aliases: "hhs hyperosmolar",
  }),
  entry("5A21", "Hypoglycaemia in the context of diabetes mellitus", "metabolic_neuro", {
    aliases: "hypoglycaemia low glucose diabetes",
  }),
  entry("5A22", "Diabetic acidosis", "metabolic_neuro", {
    aliases: "dka ketoacidosis diabetic acidosis",
  }),
  entry("5A23", "Diabetic coma", "metabolic_neuro", {
    aliases: "diabetic coma",
  }),
  entry("5A41", "Hypoglycaemia without associated diabetes", "metabolic_neuro", {
    aliases: "hypoglycaemia low blood sugar",
  }),
  entry("8A66", "Status epilepticus", "metabolic_neuro", {
    aliases: "status epilepticus seizure",
    coding_note: STEM_NOTE,
  }),
  entry("8A66.0", "Convulsive status epilepticus", "metabolic_neuro", {
    sub: true,
    aliases: "convulsive status epilepticus",
  }),

  // ---- Toxicology ---------------------------------------------------------
  entry("NE60", "Harmful effects of drugs, medicaments or biological substances, not elsewhere classified", "toxicology", {
    aliases: "overdose poisoning drug toxicity",
    coding_note:
      "Broad category. Record the substance and dose in the note and code the specific substance as an extension in the WHO browser.",
  }),
  entry("NE61", "Harmful effects of or exposure to noxious substances, chiefly nonmedicinal as to source, not elsewhere classified", "toxicology", {
    aliases: "poisoning chemical exposure toxic",
  }),
  entry("NE6Z", "Harmful effects of unspecified substance", "toxicology", {
    aliases: "poisoning unspecified",
  }),

  // ---- Allergy ------------------------------------------------------------
  entry("4A84", "Anaphylaxis", "allergy", {
    aliases: "anaphylaxis allergic reaction",
  }),

  // ---- General emergency symptoms -----------------------------------------
  entry("MG26", "Fever of other or unknown origin", "general", {
    aliases: "fever pyrexia",
  }),
  entry("MG27", "Haemorrhage, not elsewhere classified", "general", {
    aliases: "haemorrhage bleeding",
  }),
  entry("MG28", "Hypothermia, not associated with low environmental temperature", "general", {
    aliases: "hypothermia",
    coding_note: "Hypothermia from environmental exposure is coded in Chapter 22, not here.",
  }),

  // ---- Presenting symptoms and signs (chapter 21) --------------------------
  // Verified in the same tabulation. A symptom code records what the patient
  // presented with; it never becomes the diagnosis.
  entry("MD30", "Chest pain", "symptoms_signs", {
    chapter: "21",
    aliases: "chest pain thoracic pain",
    coding_note:
      "Symptom-level category. Coding chest pain does NOT establish acute coronary syndrome — code the diagnosis " +
      "separately once it is established, and keep this entry as the presenting problem.",
  }),
  entry("MD30.0", "Chest pain on breathing", "symptoms_signs", {
    sub: true,
    chapter: "21",
    aliases: "pleuritic chest pain pain on breathing",
  }),
  entry("MD30.Z", "Chest pain, unspecified", "symptoms_signs", {
    sub: true,
    chapter: "21",
    aliases: "chest pain unspecified",
  }),
  entry("MD11.5", "Dyspnoea", "symptoms_signs", {
    chapter: "21",
    aliases: "dyspnoea dyspnea shortness of breath breathless respiratory distress",
    coding_note: "Symptom-level category — the cause is coded separately when it is established.",
  }),
  entry("MD81.4", "Other and unspecified abdominal pain", "symptoms_signs", {
    chapter: "21",
    aliases: "abdominal pain tummy pain belly pain",
    coding_note: "Symptom-level category — surgical diagnoses are coded separately when established.",
  }),

  // ---- External causes (chapter 23) ---------------------------------------
  // Chapter 23 was read at block level for release 2026-01 (block ranges are
  // listed in EMERGENCY_ICD11_EXTERNAL_CAUSE_BLOCKS). Only the two residual
  // categories below were verified as codes, so no specific external-cause code
  // is offered — the clinician takes the specific one from the WHO browser.
  entry("PL2Y", "Other specified external causes of morbidity or mortality", "external_causes", {
    chapter: "23",
    aliases: "external cause other specified",
    coding_note:
      "Residual category. The specific external cause (transport, fall, assault, self-harm, exposure, healthcare " +
      "related harm) must be taken from the WHO browser — a general external-cause entry alone does not identify it.",
  }),
  entry("PL2Z", "External causes of morbidity or mortality, unspecified", "external_causes", {
    chapter: "23",
    aliases: "external cause unspecified",
    coding_note: "Use only when the external cause is genuinely not known — never as a substitute for the specific cause.",
  }),
];

// Chapter 23 block ranges, read from the published tabulation for release
// 2026-01. These are BLOCK RANGES, not codes: they tell the clinician which part
// of the chapter to open in the WHO browser. No range is ever stored as a code.
export const EMERGENCY_ICD11_EXTERNAL_CAUSE_BLOCKS = [
  { range: "PA00–PB6Z", topic: "Unintentional causes" },
  { range: "PB80–PD3Z", topic: "Intentional self-harm" },
  { range: "PD50–PF2Z", topic: "Assault" },
  { range: "PF40–PH8Z", topic: "Undetermined intent" },
  { range: "PJ00–PJ0Z", topic: "Exposure to extreme forces of nature" },
  { range: "PJ20–PJ2Z", topic: "Maltreatment" },
  { range: "PJ40–PJ4Z", topic: "Legal intervention" },
  { range: "PJ60–PK6Z", topic: "Armed conflict" },
  { range: "PK80–PL14.Z", topic: "Causes of healthcare related harm or injury" },
];

export const emergencyCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return EMERGENCY_ICD11;
  return EMERGENCY_ICD11.filter((i) => wanted.includes(i.domain));
};

export const EMERGENCY_ICD11_COUNT = EMERGENCY_ICD11.length;

// Diagnostic status is deliberately separate from the code: a code records what
// a category IS, never how certain this clinician is. These are the statuses an
// Emergency note may record, and they keep a presenting symptom, a differential,
// a suspected/provisional diagnosis and a confirmed diagnosis visibly distinct.
export const EMERGENCY_ICD11_STATUSES = [
  "Suspected",
  "Provisional",
  "Differential — not confirmed",
  "Confirmed",
  "Symptom — no definitive diagnosis",
  "Undiagnosed — investigation pending",
  "Historical",
  "Resolved",
  "In remission",
];

export const EMERGENCY_ICD11_ROLES = [
  "Primary",
  "Secondary",
  "Differential",
  "Presenting problem — not a diagnosis",
];

// Postcoordination: WHO cluster coding expresses one clinical concept with
// several codes joined by "&" and "/". AMedix cannot build a cluster (that needs
// the WHO Coding Tool), so the clinician enters the cluster exactly as the
// browser shows it and it is stored as review required.
export const EMERGENCY_POSTCOORDINATION_NOTE =
  "Postcoordination is not generated by AMedix. If the WHO ICD-11 Coding Tool produced a cluster (codes joined with " +
  "\"&\" and \"/\"), enter it exactly as shown, mark it review required, and record where it was verified.";

// Live integration state — reported to the clinician, never assumed.
export const EMERGENCY_ICD11_LIVE_API = {
  connected: false,
  api: "https://icd.who.int/icdapi",
  note:
    "No live WHO ICD-11 API connection is configured for this deployment: the authorised API needs a registered " +
    "client id and secret (icd.who.int/icdapi), and none are stored. Codes therefore come from the verified bundled " +
    "catalogue below, or are entered by the clinician from the WHO browser and marked review required. ICD-11 is " +
    "NOT fully integrated in this build and this app does not claim to implement the full ICD-11 MMS.",
};

export const EMERGENCY_CODING_LIMITATION =
  `Verified subset of ICD-11 MMS release ${EMERGENCY_ICD11_MMS.release} — ${EMERGENCY_ICD11_COUNT} categories covering ` +
  "acute coronary syndromes, cardiac arrest and shock, stroke and intracranial haemorrhage, sepsis, head and thoracic " +
  "injury, respiratory failure and pleural injury, metabolic emergencies, status epilepticus, poisoning and adverse " +
  "effects, anaphylaxis, presenting symptoms and residual external causes. Not the full classification: a term outside " +
  "the subset is entered from the WHO browser (icd.who.int/browse/2026-01/mms/en) and marked review required. No live " +
  "WHO API is called, inclusion/exclusion notes are not displayed because they were not verified here, and " +
  "postcoordination must be entered as the browser shows it. Nothing is generated, completed or crosswalked from " +
  "ICD-10 by the app.";