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
};

const SPECIFICITY = {
  BLOCK: "Block (stem) — select a subcategory when known",
  SUB: "Subcategory — most specific",
};

// `aliases` are search aids only. They are never displayed as a code.
const entry = (code, display, domain, { sub = false, aliases = "", coding_note = "" } = {}) => ({
  code,
  display,
  domain,
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
];

export const emergencyCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return EMERGENCY_ICD11;
  return EMERGENCY_ICD11.filter((i) => wanted.includes(i.domain));
};

export const EMERGENCY_ICD11_COUNT = EMERGENCY_ICD11.length;

export const EMERGENCY_CODING_LIMITATION =
  `Catalogue release ${EMERGENCY_ICD11_MMS.release} · ${EMERGENCY_ICD11_COUNT} verified categories covering acute ` +
  "coronary syndromes, cardiac arrest and shock, stroke and intracranial haemorrhage, sepsis, head and thoracic " +
  "injury, respiratory failure and pleural injury, metabolic emergencies, status epilepticus, harmful effects of " +
  "substances and anaphylaxis. No live WHO API is called. A diagnosis outside the catalogue is entered from the WHO " +
  "browser and marked review required until checked; nothing is generated or completed by the app.";