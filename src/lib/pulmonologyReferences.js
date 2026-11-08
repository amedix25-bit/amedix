// Pulmonology / Respiratory Medicine — guideline registry.
//
// One entry per source the respiratory modules cite. Each record states the
// issuing body, the edition, the population it applies to, what AMedix cites it
// for, and where the document is published. AMedix links to the issuing body and
// never copies or redistributes the document.
//
// `status` is deliberately conservative: an edition is marked current only where
// the issuing body's own publication naming that edition is confirmed. Anything
// that needs re-checking at the source is marked under_review and is presented as
// such — never as current guidance.

export const PULMONOLOGY_REFERENCES = {
  gina: {
    key: "gina",
    issuing_organization: "Global Initiative for Asthma (GINA)",
    title: "Global Strategy for Asthma Management and Prevention",
    clinical_topic: "Asthma — diagnosis, control, severity, exacerbations",
    edition: "2025 report",
    population: "Adults and children",
    status: "current",
    source_url: "https://ginasthma.org/reports/",
    access_note: "Free download from GINA after registration.",
    what_it_supports:
      "Asthma presentation and trigger documentation, ACT control assessment, severity steps, exacerbation action plan, inhaler technique and adherence review, biologic monitoring.",
    status_note:
      "GINA publishes an updated strategy report each year; the edition cited here must be re-checked against ginaasthma.org before it is quoted in a clinical record.",
    last_verified_date: "2026-11-08",
  },
  gold: {
    key: "gold",
    issuing_organization: "Global Initiative for Chronic Obstructive Lung Disease (GOLD)",
    title: "Global Strategy for Prevention, Diagnosis and Management of COPD",
    clinical_topic: "COPD — diagnosis, ABE grouping, exacerbations, oxygen, rehabilitation",
    edition: "2025 report",
    population: "Adults",
    status: "current",
    source_url: "https://goldcopd.org/2025-gold-report/",
    access_note: "Free download from GOLD.",
    what_it_supports:
      "COPD symptom documentation, CAT and mMRC instruments, ABE grouping, exacerbation history, inhaler and triple-therapy review, pulmonary rehabilitation and long-term oxygen criteria.",
    status_note:
      "GOLD revises the report annually and its grouping vocabulary changed in the 2023 revision; confirm the edition in force at the source before quoting it.",
    last_verified_date: "2026-11-08",
  },
  ats_ers_pft: {
    key: "ats_ers_pft",
    issuing_organization: "ATS/ERS Joint Task Force",
    title: "Standardisation of spirometry and interpretive strategies",
    clinical_topic: "Pulmonary function interpretation",
    edition: "ATS/ERS interpretive standards",
    population: "Adults and children able to perform spirometry",
    status: "under_review",
    source_url: "https://www.atsjournals.org/",
    access_note: "Subscription or open access depending on the paper; link only.",
    what_it_supports:
      "Recording how a spirometry or lung-volume report was interpreted, the predicted values used, and whether bronchodilator reversibility was assessed.",
    status_note:
      "The interpretive strategies have been revised more than once; the exact edition in use at the reporting laboratory must be recorded rather than assumed.",
    last_verified_date: "2026-11-08",
  },
  ats_ers_ild: {
    key: "ats_ers_ild",
    issuing_organization: "ATS/ERS/JRS/ALAT",
    title: "Idiopathic pulmonary fibrosis and progressive pulmonary fibrosis guidance",
    clinical_topic: "Interstitial lung disease",
    edition: "ATS/ERS/JRS/ALAT guidance",
    population: "Adults",
    status: "under_review",
    source_url: "https://www.atsjournals.org/",
    access_note: "Subscription or open access depending on the paper; link only.",
    what_it_supports:
      "ILD multi-disciplinary review documentation, antifibrotic therapy monitoring, oxygen and transplant referral, and progression assessment.",
    status_note:
      "Diagnostic and progression criteria have been revised; the edition applied must be confirmed at the source.",
    last_verified_date: "2026-11-08",
  },
  ers_bronchiectasis: {
    key: "ers_bronchiectasis",
    issuing_organization: "European Respiratory Society (ERS)",
    title: "Guidelines for the management of adult bronchiectasis",
    clinical_topic: "Bronchiectasis",
    edition: "ERS guideline",
    population: "Adults",
    status: "under_review",
    source_url: "https://www.ersjournals.com/",
    access_note: "Subscription or open access depending on the paper; link only.",
    what_it_supports:
      "Airway clearance documentation, exacerbation frequency, sputum microbiology status as documented, and long-term antibiotic monitoring.",
    status_note: "Confirm the edition in force at the issuing body before quoting it.",
    last_verified_date: "2026-11-08",
  },
  cap: {
    key: "cap",
    issuing_organization: "ATS/IDSA (with BTS for the UK pathway)",
    title: "Diagnosis and treatment of community-acquired pneumonia",
    clinical_topic: "Community-acquired pneumonia",
    edition: "ATS/IDSA guideline; BTS CAP guideline",
    population: "Adults",
    status: "under_review",
    source_url: "https://www.thoracic.org/statements/",
    access_note: "Subscription or open access depending on the paper; link only.",
    what_it_supports:
      "Pneumonia severity documentation with CURB-65, site-of-care reasoning, and the review interval after treatment.",
    status_note:
      "Severity scores are advisory: the guidance requires the score to be read together with the clinical picture and comorbidity, which the note documents.",
    last_verified_date: "2026-11-08",
  },
  esc_pe: {
    key: "esc_pe",
    issuing_organization: "European Society of Cardiology (ESC)",
    title: "Acute pulmonary embolism — diagnosis and management",
    clinical_topic: "Pulmonary embolism",
    edition: "ESC guideline",
    population: "Adults",
    status: "under_review",
    source_url: "https://www.escardio.org/Guidelines",
    access_note: "Free access to the guideline from ESC.",
    what_it_supports:
      "Pre-test probability documentation with Wells and PERC, the documented diagnostic pathway, and anticoagulation monitoring.",
    status_note: "Confirm the edition in force at ESC before quoting it.",
    last_verified_date: "2026-11-08",
  },
  aasm_osa: {
    key: "aasm_osa",
    issuing_organization: "American Academy of Sleep Medicine (AASM)",
    title: "Diagnostic criteria for obstructive sleep apnoea and CPAP therapy",
    clinical_topic: "Obstructive sleep apnoea",
    edition: "AASM scoring manual and clinical practice guidance",
    population: "Adults",
    status: "under_review",
    source_url: "https://aasm.org/clinical-resources/",
    access_note: "Scoring manual is licensed; clinical guidance is freely available.",
    what_it_supports:
      "STOP-BANG screening documentation, the requirement for objective sleep testing before a diagnosis, CPAP adherence review and driving advice.",
    status_note:
      "The AHI thresholds and scoring rules come from the scoring manual; the edition used by the reporting sleep laboratory must be recorded.",
    last_verified_date: "2026-11-08",
  },
  who_tb: {
    key: "who_tb",
    issuing_organization: "World Health Organization (WHO)",
    title: "WHO consolidated guidelines on tuberculosis — modules 1–5",
    clinical_topic: "Tuberculosis",
    edition: "WHO consolidated guidelines",
    population: "Adults and children",
    status: "current",
    source_url: "https://www.who.int/publications/i/item/9789240022676",
    access_note: "Free publication from WHO.",
    what_it_supports:
      "Notification documentation, regimen and adherence support recording, contact tracing and isolation advice.",
    status_note:
      "The WHO modules are updated repeatedly; the module revision in force must be checked at the source.",
    last_verified_date: "2026-11-08",
  },
  bts_pleural: {
    key: "bts_pleural",
    issuing_organization: "British Thoracic Society (BTS)",
    title: "Pleural disease guideline — effusion, pneumothorax and chest drain management",
    clinical_topic: "Pleural disease",
    edition: "BTS pleural guideline series",
    population: "Adults",
    status: "under_review",
    source_url: "https://www.brit-thoracic.org.uk/quality-improvement/guidelines/",
    access_note: "Free access from BTS.",
    what_it_supports:
      "Chest drain and pleural procedure documentation, drain output and removal criteria, and referral for definitive management.",
    status_note: "Confirm the current edition at BTS before quoting it.",
    last_verified_date: "2026-11-08",
  },
};

export const PULMONOLOGY_REFERENCE_KEYS = Object.keys(PULMONOLOGY_REFERENCES);

export const pulmReference = (key) => PULMONOLOGY_REFERENCES[key] || null;

// Which references each existing pulmonary note cites. Keys are the EXISTING
// AMedix note keys — nothing is renamed or reorganised.
export const PULM_GUIDANCE_BY_NOTE = {
  pulm_consultation: ["gina", "gold", "ats_ers_pft", "ats_ers_ild", "cap", "esc_pe", "who_tb"],
  pulm_followup: ["gina", "gold", "ers_bronchiectasis", "aasm_osa"],
  pulm_admission_note: ["cap", "gold", "esc_pe", "bts_pleural"],
  pulm_progress_note: ["gold", "cap", "bts_pleural"],
  pulm_discharge_summary: ["gold", "gina", "cap"],
  pulm_procedure_note: ["bts_pleural", "ers_bronchiectasis"],
  pulm_pft_report: ["ats_ers_pft", "gina", "gold"],
  pulm_bronchoscopy_report: ["ers_bronchiectasis", "who_tb"],
  pulm_care_plan: ["gina", "gold", "ers_bronchiectasis", "aasm_osa"],
};

export const guidanceForPulmNote = (noteKey) =>
  (PULM_GUIDANCE_BY_NOTE[noteKey] || []).map(pulmReference).filter(Boolean);

// Every reference whose status is not current, so the note and the references
// library can say plainly which editions must be re-checked.
export const PULM_STALE_REFERENCES = PULMONOLOGY_REFERENCE_KEYS.map(pulmReference).filter(
  (r) => r && r.status !== "current",
);

export const pulmonologyGuidanceBasis = (noteKey) => {
  const refs = guidanceForPulmNote(noteKey);
  if (!refs.length) return "";
  return refs.map((r) => `${r.issuing_organization} — ${r.title} (${r.edition})`).join("; ");
};