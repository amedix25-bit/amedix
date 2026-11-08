// Allergy & Immunology — guideline attribution registry.
//
// Every allergy note records, in the note itself, which body's guidance its
// content and safety prompts were built from, in which edition, for which
// population, and when that edition was current. Where bodies differ — for
// example on the observation period after anaphylaxis, or on when a supervised
// food challenge is required — the divergence is stated rather than averaged
// into one silent recommendation.
//
// EDITIONS ARE RECORDED, NOT ASSUMED CURRENT
// A guideline changes between editions, and a note signed in 2026 must say which
// version it followed. `current_as_of` is the date this registry was last
// checked, and every entry carries `check_for_update: true`: before relying on
// one, confirm the edition in the source link. A superseded edition is marked.

const WHO_ICD11 = {
  organization: "WHO",
  title: "International Classification of Diseases, 11th Revision — Mortality and Morbidity Statistics",
  edition: "ICD-11 MMS, release 2026-01",
  population: "All ages · all populations",
  url: "https://icd.who.int/browse/2026-01/mms/en",
  applies: "Diagnostic classification and coding",
  current_as_of: "2026-11",
  check_for_update: false,
  status: "current",
};

const AAAAI_ANAPHYLAXIS = {
  organization: "AAAAI / ACAAI Joint Task Force on Practice Parameters",
  title: "Anaphylaxis — a practice parameter update",
  edition: "Published in the Journal of Allergy and Clinical Immunology; confirm the exact edition year in the source",
  population: "Adults and children; includes specific paediatric dosing and observation guidance",
  url: "https://www.aaaai.org/",
  applies: "Recognition criteria, adrenaline as first-line treatment, observation, biphasic risk and discharge",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current",
};

const WAO_ANAPHYLAXIS = {
  organization: "World Allergy Organization (WAO)",
  title: "WAO Anaphylaxis Guidance",
  edition: "World Allergy Organization Journal, 2020 guidance",
  population: "Global guidance for adults and children",
  url: "https://www.worldallergy.org/",
  applies: "Global recognition and management of anaphylaxis, adrenaline access and follow-up",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current",
};

const AAAAI_DRUG = {
  organization: "AAAAI / ACAAI Joint Task Force on Practice Parameters",
  title: "Drug allergy — a practice parameter update",
  edition: "Journal of Allergy and Clinical Immunology; confirm the exact edition year in the source",
  population: "Adults and children; paediatric provocation protocols differ",
  url: "https://www.aaaai.org/",
  applies: "Reaction phenotype and timing, index drug, risk stratification, delabelling and drug provocation",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current",
};

const AAAAI_FOOD = {
  organization: "AAAAI / ACAAI Joint Task Force on Practice Parameters",
  title: "Food allergy — practice parameter",
  edition: "Journal of Allergy and Clinical Immunology; confirm the exact edition year in the source",
  population: "Adults and children; infant feeding and prevention guidance is age-specific",
  url: "https://www.aaaai.org/",
  applies: "IgE- vs non-IgE-mediated diagnosis, test interpretation, challenge, avoidance and re-evaluation",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current",
};

const EAACI_FOOD = {
  organization: "European Academy of Allergy and Clinical Immunology (EAACI)",
  title: "EAACI Food Allergy and Anaphylaxis Guidelines",
  edition: "Allergy, 2014 guideline series — older edition; check for the current EAACI guideline before relying on it",
  population: "Adults and children in the EAACI population",
  url: "https://www.eaaci.org/",
  applies: "Food allergy diagnosis and management, anaphylaxis management and the acute allergy pathway",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "superseded in part — later EAACI documents may apply",
};

const EAACI_ANAPHYLAXIS = {
  organization: "European Academy of Allergy and Clinical Immunology (EAACI)",
  title: "EAACI Anaphylaxis Guideline",
  edition: "Allergy, 2021 guideline",
  population: "Adults and children",
  url: "https://www.eaaci.org/",
  applies: "Anaphylaxis recognition, adrenaline use, observation and referral",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current",
};

const URTICARIA_GUIDELINE = {
  organization: "EAACI / GA²LEN / EDF / WAO (with APAAACI)",
  title: "International guideline for the definition, classification, diagnosis and management of urticaria — 2021 revision and update",
  edition: "Allergy, 2021 revision (published 2022)",
  population: "Adults and children; paediatric dosing differs",
  url: "https://www.eaaci.org/",
  applies: "Acute vs chronic urticaria, UAS7 and UCT as activity and control instruments, antihistamine escalation, omalizumab and ciclosporin",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current",
};

const HAE_GUIDELINE = {
  organization: "WAO / EAACI",
  title: "Guideline for the management of hereditary angioedema — 2021 revision",
  edition: "Allergy, 2021 revision",
  population: "Adults, children and pregnancy — with separate recommendations for each",
  url: "https://www.worldallergy.org/",
  applies: "C1-inhibitor testing, on-demand treatment, short- and long-term prophylaxis and attack management",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current",
};

const GINA = {
  organization: "Global Initiative for Asthma (GINA)",
  title: "Global Strategy for Asthma Management and Prevention",
  edition: "GINA 2025 report — the strategy report is revised annually; confirm the latest edition",
  population: "Adults and adolescents (6 years and over); GINA publishes separate guidance for children 5 years and younger",
  url: "https://ginasthma.org/",
  applies: "Diagnosis, assessment of control, severity and treatment steps 1–5, exacerbation management and follow-up",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current at the time of writing — a later annual report may exist",
};

const ARIA = {
  organization: "ARIA — Allergic Rhinitis and its Impact on Asthma (in collaboration with EAACI and WHO)",
  title: "ARIA guidelines — allergic rhinitis",
  edition: "ARIA 2019 guideline and its 2024/2025 implementation updates where applicable; confirm the current edition",
  population: "Adults and children",
  url: "https://www.ariasalute.org/",
  applies: "Intermittent vs persistent and mild vs moderate–severe classification, symptom scoring, intranasal, oral and ocular treatment, and the asthma link",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current — check the latest ARIA update",
};

const AAAAI_IEI = {
  organization: "AAAAI / ACAAI Joint Task Force on Practice Parameters",
  title: "Practice parameter for the diagnosis and management of primary immunodeficiency",
  edition: "Journal of Allergy and Clinical Immunology; confirm the exact edition year in the source",
  population: "Adults and children; warning signs are age-specific",
  url: "https://www.aaaai.org/",
  applies: "Warning signs, initial immune evaluation, specialist referral and infection-prevention advice",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current",
};

const IUIS_IEI = {
  organization: "International Union of Immunological Societies (IUIS) Expert Committee",
  title: "Human inborn errors of immunity — IUIS phenotypical classification",
  edition: "Latest published IUIS classification; the committee updates it periodically — confirm the current version",
  population: "All ages",
  url: "https://iuis.org/",
  applies: "Categories of inborn errors of immunity and their defining laboratory phenotypes",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current — confirm the latest classification update",
};

const EAACI_AIT = {
  organization: "European Academy of Allergy and Clinical Immunology (EAACI)",
  title: "EAACI Guidelines on Allergen Immunotherapy",
  edition: "EAACI AIT guideline series (allergic rhinoconjunctivitis and venom); confirm the current edition",
  population: "Adults and children; age restrictions apply to specific products",
  url: "https://www.eaaci.org/",
  applies: "Indication, build-up and maintenance dosing, adverse reactions, contraindications and treatment duration",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current",
};

const ICON_AIT = {
  organization: "International Consensus (ICON) on Allergen Immunotherapy",
  title: "International consensus on allergen immunotherapy",
  edition: "World Allergy Organization Journal consensus document; confirm the current edition",
  population: "Adults and children",
  url: "https://www.worldallergy.org/",
  applies: "Practical AIT delivery, dose adjustment after interruption, safety monitoring and response assessment",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current",
};

const AAAAI_ATOPIC = {
  organization: "AAAAI / ACAAI (with EAACI and other bodies)",
  title: "Atopic dermatitis — practice parameter and EAACI guideline",
  edition: "Published practice parameter and guideline series; confirm the exact edition years in the source",
  population: "Adults and children; paediatric topical potency and systemic thresholds differ",
  url: "https://www.aaaai.org/",
  applies: "Distribution, severity instruments, emollients, topical anti-inflammatory therapy, infection and systemic therapy",
  current_as_of: "2026-11",
  check_for_update: true,
  status: "current",
};

export const ALLERGY_REFERENCES = {
  who_icd11: WHO_ICD11,
  aaaai_anaphylaxis: AAAAI_ANAPHYLAXIS,
  wao_anaphylaxis: WAO_ANAPHYLAXIS,
  aaaai_drug: AAAAI_DRUG,
  aaaai_food: AAAAI_FOOD,
  eaaci_food: EAACI_FOOD,
  eaaci_anaphylaxis: EAACI_ANAPHYLAXIS,
  urticaria: URTICARIA_GUIDELINE,
  hae: HAE_GUIDELINE,
  gina: GINA,
  aria: ARIA,
  aaaai_iei: AAAAI_IEI,
  iuis_iei: IUIS_IEI,
  eaaci_ait: EAACI_AIT,
  icon_ait: ICON_AIT,
  atopic_dermatitis: AAAAI_ATOPIC,
};

// Which guidance each note type's content was built from. A note never claims a
// single universal recommendation: where two bodies differ, both are listed.
export const ALLERGY_NOTE_BASIS = {
  allergy_consultation: {
    note: "Allergy & Immunology Consultation",
    states:
      "History, examination and assessment are documented in the specialty's own vocabulary. Every management statement in this note is attributed to the guideline below; the clinician's own institutional protocol and the individual patient decide management.",
    basis: [AAAAI_ANAPHYLAXIS, AAAAI_FOOD, AAAAI_DRUG, URTICARIA_GUIDELINE, GINA, ARIA, AAAAI_IEI],
  },
  allergy_followup: {
    note: "Allergy & Immunology Follow-Up",
    states: "Follow-up records what changed since the last visit against the same guideline set that governed the original assessment.",
    basis: [AAAAI_ANAPHYLAXIS, AAAAI_FOOD, AAAAI_DRUG, URTICARIA_GUIDELINE, GINA, ARIA, EAACI_AIT],
  },
  allergy_anaphylaxis_note: {
    note: "Anaphylaxis Record",
    states:
      "Recognition criteria, adrenaline as first-line treatment and observation are recorded as the cited bodies state them. The observation period after resolution differs between guidance — the period actually used is documented in the note rather than implied.",
    basis: [AAAAI_ANAPHYLAXIS, WAO_ANAPHYLAXIS, EAACI_ANAPHYLAXIS],
  },
  allergy_food_note: {
    note: "Food Allergy Assessment",
    states:
      "A test supports a diagnosis only with a compatible documented reaction. A supervised challenge is documented as performed, not assumed, and the record keeps the challenge outcome the unit reported.",
    basis: [AAAAI_FOOD, EAACI_FOOD],
  },
  allergy_drug_note: {
    note: "Drug Allergy & Delabelling Assessment",
    states:
      "The reaction phenotype and timing are recorded before any label is kept or removed. Delabelling is documented as a decision with its pathway, never as an inference from a negative test alone.",
    basis: [AAAAI_DRUG],
  },
  allergy_skin_note: {
    note: "Skin Allergy Assessment",
    states:
      "Urticaria activity and control are recorded with a documented instrument (UAS7, UCT) rather than a description alone; atopic dermatitis severity is recorded with the instrument the clinic used.",
    basis: [URTICARIA_GUIDELINE, HAE_GUIDELINE, AAAAI_ATOPIC],
  },
  allergy_immunology_note: {
    note: "Clinical Immunology Assessment",
    states:
      "Warning signs are recorded individually, and an immune-workup result is never read as a diagnosis on its own. Categories follow the IUIS classification.",
    basis: [AAAAI_IEI, IUIS_IEI],
  },
  allergy_immunotherapy_visit: {
    note: "Allergen Immunotherapy Visit",
    states:
      "The dose given, any reaction and the resulting adjustment are recorded together, so the next dose is decided from documentation rather than recollection.",
    basis: [EAACI_AIT, ICON_AIT],
  },
  allergy_procedure_note: {
    note: "Allergy Procedure Record",
    states:
      "Consent, setting, protocol and outcome are recorded as one procedure record. A challenge result is recorded exactly as the unit concluded it.",
    basis: [AAAAI_FOOD, AAAAI_DRUG, EAACI_ANAPHYLAXIS],
  },
  allergy_child_consultation: {
    note: "Paediatric Allergy & Immunology Consultation",
    states:
      "Paediatric documentation follows the same guidance with the age-specific provisions those bodies publish — GINA guidance for children, age-specific reference intervals, and weight-based adrenaline dosing recorded as given.",
    basis: [AAAAI_ANAPHYLAXIS, AAAAI_FOOD, GINA, ARIA, AAAAI_IEI],
  },
  allergy_care_plan: {
    note: "Allergy Action Plan & Follow-Up",
    states:
      "An action plan states what the patient or carer does, when, and with which medicine. It is recorded as given and explained, never as implied by a prescription.",
    basis: [AAAAI_ANAPHYLAXIS, WAO_ANAPHYLAXIS, AAAAI_FOOD, URTICARIA_GUIDELINE],
  },
};

export const allergyNoteBasis = (noteKey) => ALLERGY_NOTE_BASIS[noteKey] || null;

export const allergyGuidelineBasis = (noteKey) => {
  const entry = ALLERGY_NOTE_BASIS[noteKey];
  if (!entry) return ["AAAAI / ACAAI", "EAACI", "WAO", "GINA", "ARIA", "WHO ICD-11 MMS"];
  return Array.from(new Set([...entry.basis.map((b) => b.organization), "WHO ICD-11 MMS"]));
};

export const ALLERGY_REFERENCE_COUNT = Object.keys(ALLERGY_REFERENCES).length;

// Editions that are no longer current, surfaced so they can never be presented
// as current guidance inside a note.
export const ALLERGY_OUTDATED_EDITIONS = Object.values(ALLERGY_REFERENCES).filter(
  (r) => r.status && !/^current/i.test(r.status),
);