// Pulmonology / Respiratory Medicine — guideline registry.
//
// TWO KINDS OF SOURCE, KEPT APART ON PURPOSE
//   · INTERNATIONAL RECOMMENDATIONS — published by a professional or global body
//     (GINA, GOLD, ATS, ERS, CHEST, BTS, WHO, IDSA). They are documentation
//     support: they never become the local rule of the institution.
//   · LOCALLY APPROVED PROTOCOLS — the institution's own adopted version, with an
//     approval reference, an approving body and a review date. AMedix holds NONE
//     by default (see PULM_LOCAL_PROTOCOLS) and the note says so plainly, so a
//     local protocol is never implied where none has been approved.
//
// Each entry states the issuing body, the edition, the population it applies to,
// the date the registry entry was last checked against the source, what AMedix
// cites it for, and where the document is published. AMedix links to the issuing
// body and never copies or redistributes the document.
//
// `status` is deliberately conservative: `current` means the issuing body's own
// publication carries this edition; `under_review` means the edition must be
// confirmed at the source before it is quoted and the note shows it as such.

const CHECKED = "2026-11-08";

export const PULMONOLOGY_REFERENCES = {
  gina: {
    key: "gina",
    issuing_organization: "Global Initiative for Asthma (GINA)",
    title: "Global Strategy for Asthma Management and Prevention",
    clinical_topic: "Asthma — diagnosis, control, severity, exacerbations",
    edition: "2026 report",
    publication_year: 2026,
    jurisdiction: "international",
    population: "Adults and children",
    status: "current",
    source_url: "https://ginasthma.org/",
    access_note: "Free download from GINA after registration.",
    what_it_supports:
      "Asthma presentation and trigger documentation, ACT control assessment, severity steps, exacerbation action plan, inhaler technique and adherence review, severe-asthma phenotyping and biologic monitoring.",
    status_note:
      "The registry cites the 2026 GINA report. GINA revises the strategy report every year, so the revision in force must be confirmed at ginasthma.org before it is quoted in a clinical record.",
    last_verified_date: CHECKED,
  },
  gold: {
    key: "gold",
    issuing_organization: "Global Initiative for Chronic Obstructive Lung Disease (GOLD)",
    title: "Global Strategy for Prevention, Diagnosis and Management of COPD",
    clinical_topic: "COPD — diagnosis, ABE grouping, exacerbations, oxygen, rehabilitation",
    edition: "2026 report",
    publication_year: 2026,
    jurisdiction: "international",
    population: "Adults",
    status: "current",
    source_url: "https://goldcopd.org/",
    access_note: "Free download from GOLD.",
    what_it_supports:
      "COPD symptom documentation, CAT and mMRC instruments, ABE grouping, exacerbation history and severity, inhaler and triple-therapy review, pulmonary rehabilitation, long-term oxygen and ventilatory support criteria.",
    status_note:
      "The registry cites the 2026 GOLD report. GOLD revises the report annually and its grouping vocabulary changed in the 2023 revision, so the edition in force must be confirmed at goldcopd.org.",
    last_verified_date: CHECKED,
  },
  ats: {
    key: "ats",
    issuing_organization: "American Thoracic Society (ATS)",
    title: "ATS clinical practice statements and standards for pulmonary, critical care and sleep medicine",
    clinical_topic: "Respiratory medicine — standards and interpretive strategies",
    edition: "Current published statements",
    jurisdiction: "international",
    population: "Adults and children, per statement",
    status: "under_review",
    source_url: "https://www.thoracic.org/",
    access_note: "Statements are published in the ATS journals; some open access, some subscription. Link only.",
    what_it_supports:
      "The society-level standard the specialty citations come from — lung function interpretation, ILD, critical care and sleep standards.",
    status_note:
      "ATS documents are revised statement by statement; the specific document and year must be named when it is cited in a note, not the society alone.",
    last_verified_date: CHECKED,
  },
  ers: {
    key: "ers",
    issuing_organization: "European Respiratory Society (ERS)",
    title: "ERS guidelines, statements and technical standards",
    clinical_topic: "Respiratory medicine — European guidelines and standards",
    edition: "Current published guidelines",
    jurisdiction: "international",
    population: "Adults and children, per guideline",
    status: "under_review",
    source_url: "https://www.ersnet.org/",
    access_note: "Guidelines are published in the ERS journals; access varies. Link only.",
    what_it_supports:
      "The society-level standard behind the bronchiectasis and lung-function citations, and the European reference point where the local protocol adopts it.",
    status_note: "Guideline by guideline revision; name the document and year when citing it.",
    last_verified_date: CHECKED,
  },
  chest: {
    key: "chest",
    issuing_organization: "American College of Chest Physicians (CHEST)",
    title: "CHEST clinical practice guidelines",
    clinical_topic: "Cough, haemoptysis, pleural disease, pulmonary vascular disease, critical care",
    edition: "Current published guidelines",
    jurisdiction: "international",
    population: "Adults",
    status: "under_review",
    source_url: "https://www.chestnet.org/",
    access_note: "Guidelines are published in CHEST; access varies. Link only.",
    what_it_supports:
      "The documented approach to chronic cough, haemoptysis, pleural procedures and the assessment of pulmonary vascular disease.",
    status_note: "Guideline by guideline revision; name the document and year when citing it.",
    last_verified_date: CHECKED,
  },
  bts: {
    key: "bts",
    issuing_organization: "British Thoracic Society (BTS)",
    title: "BTS clinical guidelines and quality standards",
    clinical_topic: "Respiratory medicine — UK guidelines and audit standards",
    edition: "Current published guidelines",
    jurisdiction: "international",
    population: "Adults and children, per guideline",
    status: "under_review",
    source_url: "https://www.brit-thoracic.org.uk/",
    access_note: "Free access from BTS.",
    what_it_supports:
      "The society-level standard behind the pneumonia and pleural citations, including the severity and procedure documentation they describe.",
    status_note: "Guideline by guideline revision; name the document and year when citing it.",
    last_verified_date: CHECKED,
  },
  who_resp: {
    key: "who_resp",
    issuing_organization: "World Health Organization (WHO)",
    title: "WHO guidance on tuberculosis, respiratory infection and oxygen therapy",
    clinical_topic: "Tuberculosis, respiratory infection, oxygen use, air quality",
    edition: "Current WHO publications",
    jurisdiction: "international",
    population: "Adults and children",
    status: "under_review",
    source_url: "https://www.who.int/",
    access_note: "Free publications from WHO.",
    what_it_supports:
      "Notification and treatment-adherence documentation for tuberculosis, infection-control advice and the safe use of medical oxygen.",
    status_note:
      "WHO updates each module on its own cycle; the module revision must be checked at the source before it is quoted.",
    last_verified_date: CHECKED,
  },
  idsa: {
    key: "idsa",
    issuing_organization: "Infectious Diseases Society of America (IDSA)",
    title: "IDSA clinical practice guidelines for respiratory infections",
    clinical_topic: "Community-acquired and hospital-acquired pneumonia, empyema, lung abscess",
    edition: "Current published guidelines",
    jurisdiction: "international",
    population: "Adults and children, per guideline",
    status: "under_review",
    source_url: "https://www.idsociety.org/",
    access_note: "Guidelines are published in IDSA journals; access varies. Link only.",
    what_it_supports:
      "The documented microbiology sampling, severity assessment and review interval for pneumonia, empyema and lung abscess.",
    status_note: "Guideline by guideline revision; name the document and year when citing it.",
    last_verified_date: CHECKED,
  },
  ats_ers_pft: {
    key: "ats_ers_pft",
    issuing_organization: "ATS/ERS Joint Task Force",
    title: "Standardisation of spirometry and interpretive strategies",
    clinical_topic: "Pulmonary function interpretation",
    edition: "ATS/ERS interpretive standards",
    jurisdiction: "international",
    population: "Adults and children able to perform spirometry",
    status: "under_review",
    source_url: "https://www.atsjournals.org/",
    access_note: "Subscription or open access depending on the paper; link only.",
    what_it_supports:
      "Recording how a spirometry or lung-volume report was interpreted, the predicted values used, and whether bronchodilator reversibility was assessed.",
    status_note:
      "The interpretive strategies have been revised more than once; the exact edition in use at the reporting laboratory must be recorded rather than assumed.",
    last_verified_date: CHECKED,
  },
  ats_ers_ild: {
    key: "ats_ers_ild",
    issuing_organization: "ATS/ERS/JRS/ALAT",
    title: "Idiopathic pulmonary fibrosis and progressive pulmonary fibrosis guidance",
    clinical_topic: "Interstitial lung disease",
    edition: "ATS/ERS/JRS/ALAT guidance",
    jurisdiction: "international",
    population: "Adults",
    status: "under_review",
    source_url: "https://www.atsjournals.org/",
    access_note: "Subscription or open access depending on the paper; link only.",
    what_it_supports:
      "ILD multi-disciplinary review documentation, antifibrotic therapy monitoring, oxygen and transplant referral, and progression assessment.",
    status_note:
      "Diagnostic and progression criteria have been revised; the edition applied must be confirmed at the source.",
    last_verified_date: CHECKED,
  },
  ers_bronchiectasis: {
    key: "ers_bronchiectasis",
    issuing_organization: "European Respiratory Society (ERS)",
    title: "Guidelines for the management of adult bronchiectasis",
    clinical_topic: "Bronchiectasis",
    edition: "ERS guideline",
    jurisdiction: "international",
    population: "Adults",
    status: "under_review",
    source_url: "https://www.ersjournals.com/",
    access_note: "Subscription or open access depending on the paper; link only.",
    what_it_supports:
      "Airway clearance documentation, exacerbation frequency, sputum microbiology status as documented, and long-term antibiotic monitoring.",
    status_note: "Confirm the edition in force at the issuing body before quoting it.",
    last_verified_date: CHECKED,
  },
  cap: {
    key: "cap",
    issuing_organization: "ATS/IDSA (with BTS for the UK pathway)",
    title: "Diagnosis and treatment of community-acquired pneumonia",
    clinical_topic: "Community-acquired pneumonia",
    edition: "ATS/IDSA guideline; BTS CAP guideline",
    jurisdiction: "international",
    population: "Adults",
    status: "under_review",
    source_url: "https://www.thoracic.org/",
    access_note: "Subscription or open access depending on the paper; link only.",
    what_it_supports:
      "Pneumonia severity documentation with CURB-65, site-of-care reasoning, and the review interval after treatment.",
    status_note:
      "Severity scores are advisory: the guidance requires the score to be read together with the clinical picture and comorbidity, which the note documents.",
    last_verified_date: CHECKED,
  },
  esc_pe: {
    key: "esc_pe",
    issuing_organization: "European Society of Cardiology (ESC)",
    title: "Acute pulmonary embolism — diagnosis and management",
    clinical_topic: "Pulmonary embolism and pulmonary hypertension",
    edition: "ESC guideline",
    jurisdiction: "international",
    population: "Adults",
    status: "under_review",
    source_url: "https://www.escardio.org/Guidelines",
    access_note: "Free access to the guideline from ESC.",
    what_it_supports:
      "Pre-test probability documentation with Wells and PERC, the documented diagnostic pathway, anticoagulation monitoring, and the pulmonary hypertension classification.",
    status_note: "Confirm the edition in force at ESC before quoting it.",
    last_verified_date: CHECKED,
  },
  aasm_osa: {
    key: "aasm_osa",
    issuing_organization: "American Academy of Sleep Medicine (AASM)",
    title: "Diagnostic criteria for obstructive sleep apnoea and CPAP therapy",
    clinical_topic: "Obstructive sleep apnoea and obesity hypoventilation",
    edition: "AASM scoring manual and clinical practice guidance",
    jurisdiction: "international",
    population: "Adults",
    status: "under_review",
    source_url: "https://aasm.org/clinical-resources/",
    access_note: "Scoring manual is licensed; clinical guidance is freely available.",
    what_it_supports:
      "STOP-BANG screening documentation, the requirement for objective sleep testing before a diagnosis, CPAP adherence review and driving advice.",
    status_note:
      "AHI thresholds and scoring rules come from the scoring manual; the edition used by the reporting sleep laboratory must be recorded.",
    last_verified_date: CHECKED,
  },
  who_tb: {
    key: "who_tb",
    issuing_organization: "World Health Organization (WHO)",
    title: "WHO consolidated guidelines on tuberculosis — modules 1–5",
    clinical_topic: "Tuberculosis",
    edition: "WHO consolidated guidelines",
    jurisdiction: "international",
    population: "Adults and children",
    status: "current",
    source_url: "https://www.who.int/",
    access_note: "Free publication from WHO.",
    what_it_supports:
      "Notification documentation, regimen and adherence support recording, contact tracing and isolation advice.",
    status_note:
      "The WHO modules are updated repeatedly; the module revision in force must be checked at the source.",
    last_verified_date: CHECKED,
  },
  bts_pleural: {
    key: "bts_pleural",
    issuing_organization: "British Thoracic Society (BTS)",
    title: "Pleural disease guideline — effusion, pneumothorax and chest drain management",
    clinical_topic: "Pleural disease",
    edition: "BTS pleural guideline series",
    jurisdiction: "international",
    population: "Adults",
    status: "under_review",
    source_url: "https://www.brit-thoracic.org.uk/",
    access_note: "Free access from BTS.",
    what_it_supports:
      "Chest drain and pleural procedure documentation, drain output and removal criteria, and referral for definitive management.",
    status_note: "Confirm the current edition at BTS before quoting it.",
    last_verified_date: CHECKED,
  },
};

export const PULMONOLOGY_REFERENCE_KEYS = Object.keys(PULMONOLOGY_REFERENCES);

export const pulmReference = (key) => PULMONOLOGY_REFERENCES[key] || null;

// Locally approved protocols. These are the institution's own adopted documents,
// not international recommendations. Nothing is registered by default: a local
// protocol only appears here once the institution records its own approval
// reference, approving body, adoption date and review date. The shape is fixed so
// an approved protocol is stored with the same traceability as a guideline.
//
// {
//   key: "local_copd_pathway",
//   title: "Institution COPD exacerbation pathway",
//   issuing_body: "Department of Respiratory Medicine",
//   derived_from: ["gold"],              // which international source it adopts
//   approval_reference: "…",             // the institution's own approval number
//   approved_date: "…", review_date: "…",
//   note_keys: ["pulm_admission_note"],  // notes it governs
//   status: "approved" | "superseded" | "withdrawn",
// }
export const PULM_LOCAL_PROTOCOLS = [];

export const PULM_LOCAL_PROTOCOL_NOTICE =
  "No locally approved respiratory protocol is registered for this note type. The international recommendations above are " +
  "documentation support only: they are not a local approval, and the treating clinician's documented decision remains the record.";

export const pulmLocalProtocolsFor = (noteKey) =>
  PULM_LOCAL_PROTOCOLS.filter(
    (p) => p.status === "approved" && (!p.note_keys || !noteKey || p.note_keys.includes(noteKey)),
  );

// Which international recommendations each existing pulmonary note cites. Keys are
// the EXISTING AMedix note keys — nothing is renamed or reorganised.
export const PULM_GUIDANCE_BY_NOTE = {
  pulm_consultation: [
    "gina", "gold", "ats_ers_pft", "ats_ers_ild", "cap", "esc_pe", "who_tb", "ers_bronchiectasis", "aasm_osa", "chest",
  ],
  pulm_followup: ["gina", "gold", "ers_bronchiectasis", "aasm_osa"],
  pulm_admission_note: ["cap", "gold", "idsa", "esc_pe", "bts_pleural", "ats"],
  pulm_progress_note: ["gold", "cap", "bts_pleural", "ats", "esc_pe"],
  pulm_discharge_summary: ["gold", "gina", "cap"],
  pulm_procedure_note: ["bts_pleural", "ers_bronchiectasis", "chest"],
  pulm_pft_report: ["ats_ers_pft", "gina", "gold"],
  pulm_bronchoscopy_report: ["ers_bronchiectasis", "who_tb", "chest"],
  pulm_care_plan: ["gina", "gold", "ers_bronchiectasis", "aasm_osa", "who_resp"],
};

export const guidanceForPulmNote = (noteKey) =>
  (PULM_GUIDANCE_BY_NOTE[noteKey] || []).map(pulmReference).filter(Boolean);

// Every reference whose status is not current, so the note and the references
// library can say plainly which editions must be re-checked.
export const PULM_STALE_REFERENCES = PULMONOLOGY_REFERENCE_KEYS.map(pulmReference).filter(
  (r) => r && r.status !== "current",
);

// The attribution line recorded with a note: international basis first, then any
// locally approved protocol, each labelled for what it is.
export const pulmonologyGuidanceBasis = (noteKey) => {
  const refs = guidanceForPulmNote(noteKey);
  const local = pulmLocalProtocolsFor(noteKey);
  const international = refs.length
    ? `International recommendations — ${refs
        .map((r) => `${r.issuing_organization}: ${r.title} (${r.edition})`)
        .join("; ")}`
    : "";
  const localLine = local.length
    ? `Locally approved protocols — ${local
        .map((p) => `${p.title} (${p.issuing_body}, approval ${p.approval_reference}, adopted ${p.approved_date})`)
        .join("; ")}`
    : "Locally approved protocols — none registered for this note type";
  return [international, localLine].filter(Boolean).join(". ");
};