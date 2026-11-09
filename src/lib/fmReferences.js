// Family Medicine — the international reference register the documentation cites.
//
// RULES
//   · Every entry names the issuing body, the document and a link to that body's own
//     publication. AMedix links to the source and never copies or redistributes it.
//   · publication_year is filled ONLY where the edition year is stated by the
//     issuer in the title itself. An annually revised document carries version
//     "annual" and no invented year.
//   · last_verified_date is deliberately empty: these links have not been re-checked
//     by a clinician for this deployment, so the note shows "not yet re-checked"
//     rather than a false verification date. Re-checking is done from the Clinical
//     References Library, which records the date and never overwrites a signed note.
//   · An international recommendation is documentation support, NOT a local
//     approval. No local protocol is registered for family medicine yet, and the
//     note says so plainly instead of implying one exists.
//   · A new edition is never applied retroactively: a signed note keeps the basis it
//     was written with, and only a new note cites the newer edition.

export const FM_REFERENCES = {
  aafp: {
    key: "aafp",
    issuing_organization: "American Academy of Family Physicians (AAFP)",
    title: "AAFP Clinical Practice Guidelines and Recommendations",
    clinical_topic: "Family medicine — comprehensive primary care",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.aafp.org/family-physician/patient-care/clinical-recommendations.html",
    population: "All ages in primary care",
    status: "current",
    status_note: "A living collection revised continuously by AAFP; individual guideline editions must be read at the source.",
  },
  nice: {
    key: "nice",
    issuing_organization: "National Institute for Health and Care Excellence (NICE)",
    title: "NICE Guidance — clinical guidelines, quality standards and technology appraisals",
    clinical_topic: "Evidence-based diagnosis and management",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.nice.org.uk/guidance",
    population: "Adults and children (per individual guideline)",
    status: "current",
    status_note: "NICE publishes updates with surveillance reviews; the current edition of each guideline must be confirmed at the source.",
  },
  who_phc: {
    key: "who_phc",
    issuing_organization: "World Health Organization (WHO)",
    title: "WHO Primary Health Care — guidelines and international standards",
    clinical_topic: "International primary healthcare standards",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.who.int/health-topics/primary-health-care",
    population: "All ages, international",
    status: "current",
    status_note: "WHO guidance is issued and revised by programme area; each document is read at the source.",
  },
  uspstf: {
    key: "uspstf",
    issuing_organization: "US Preventive Services Task Force (USPSTF)",
    title: "USPSTF Recommendations for preventive services",
    clinical_topic: "Preventive medicine and screening",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.uspreventiveservicestaskforce.org/uspstf/",
    population: "Asymptomatic populations, by age and risk group",
    status: "current",
    status_note: "Each recommendation carries its own grade (A–D or I) and date; the grade recorded in a note is the one read at the source.",
  },
  wonca: {
    key: "wonca",
    issuing_organization: "World Organization of Family Doctors (WONCA)",
    title: "WONCA Global Standards for Family Medicine and statements on continuity of care",
    clinical_topic: "Family medicine competencies and continuity of care",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.globalfamilydoctor.com/",
    population: "Family medicine practice and training",
    status: "current",
    status_note: "WONCA standards describe the discipline; they are not treatment protocols.",
  },
  acc_aha: {
    key: "acc_aha",
    issuing_organization: "American College of Cardiology / American Heart Association",
    title: "ACC/AHA Guideline on the Primary Prevention of Cardiovascular Disease",
    clinical_topic: "Cardiovascular risk assessment and prevention",
    version: "",
    publication_year: 2019,
    source_url: "https://www.acc.org/guidelines",
    population: "Adults without established atherosclerotic disease",
    status: "current",
    status_note: "The 2019 primary-prevention guideline is the edition cited here; confirm whether a newer edition has been published before relying on it.",
  },
  ada: {
    key: "ada",
    issuing_organization: "American Diabetes Association (ADA)",
    title: "Standards of Care in Diabetes",
    clinical_topic: "Diabetes diagnosis, monitoring and management",
    version: "annual edition",
    publication_year: null,
    source_url: "https://professional.diabetes.org/standards-of-care",
    population: "Adults and children with diabetes or at risk of diabetes",
    status: "current",
    status_note: "Revised every year; the edition in force at the time of the note must be read at the source.",
  },
  kdigo: {
    key: "kdigo",
    issuing_organization: "Kidney Disease: Improving Global Outcomes (KDIGO)",
    title: "KDIGO Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease",
    clinical_topic: "Chronic kidney disease staging and monitoring",
    version: "2024",
    publication_year: 2024,
    source_url: "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
    population: "Adults with or at risk of chronic kidney disease",
    status: "current",
    status_note: "The 2024 CKD guideline is the edition cited; a later KDIGO update supersedes it when published.",
  },
  gina: {
    key: "gina",
    issuing_organization: "Global Initiative for Asthma (GINA)",
    title: "Global Strategy for Asthma Management and Prevention",
    clinical_topic: "Asthma — diagnosis, control assessment and treatment",
    version: "annual update",
    publication_year: null,
    source_url: "https://ginasthma.org/reports/",
    population: "Adults and children with asthma",
    status: "current",
    status_note: "Updated annually; the strategy report in force must be read at the source.",
  },
  gold: {
    key: "gold",
    issuing_organization: "Global Initiative for Chronic Obstructive Lung Disease (GOLD)",
    title: "Global Strategy for Prevention, Diagnosis and Management of COPD",
    clinical_topic: "COPD — assessment and management",
    version: "annual report",
    publication_year: null,
    source_url: "https://goldcopd.org/",
    population: "Adults with chronic obstructive pulmonary disease",
    status: "current",
    status_note: "Updated annually; confirm the current report edition at the source.",
  },
  idsa: {
    key: "idsa",
    issuing_organization: "Infectious Diseases Society of America (IDSA)",
    title: "IDSA Practice Guidelines",
    clinical_topic: "Infectious diseases — diagnosis and antimicrobial treatment",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.idsociety.org/practice-guideline/",
    population: "Adults and children (per individual guideline)",
    status: "current",
    status_note: "Each guideline has its own edition and update date; read the current edition at the source. Local antimicrobial resistance patterns govern empiric choice.",
  },
  acog: {
    key: "acog",
    issuing_organization: "American College of Obstetricians and Gynecologists (ACOG)",
    title: "ACOG Clinical Practice Guidelines, Committee Opinions and Practice Bulletins",
    clinical_topic: "Women's health, pregnancy and postpartum care",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.acog.org/clinical",
    population: "Adolescent and adult women; pregnancy",
    status: "current",
    status_note: "Documents are revised and replaced; the current document number must be confirmed at the source.",
  },
  who_immunization: {
    key: "who_immunization",
    issuing_organization: "World Health Organization (WHO)",
    title: "WHO immunization recommendations and vaccine position papers",
    clinical_topic: "Immunization schedules and vaccine guidance",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.who.int/teams/immunization-vaccines-and-biologicals",
    population: "All ages",
    status: "current",
    status_note: "The national immunization schedule of the country of practice takes precedence; WHO position papers are the international basis.",
  },
  who_growth: {
    key: "who_growth",
    issuing_organization: "World Health Organization (WHO)",
    title: "WHO Child Growth Standards",
    clinical_topic: "Growth and development assessment in children",
    version: "",
    publication_year: 2006,
    source_url: "https://www.who.int/tools/child-growth-standards",
    population: "Children 0–5 years (standards); 5–19 years (reference)",
    status: "current",
    status_note: "Percentiles and Z-scores are read from the WHO charts; AMedix records the measurements and never computes a percentile from memory.",
  },
  cdc_steadi: {
    key: "cdc_steadi",
    issuing_organization: "Centers for Disease Control and Prevention (CDC) — STEADI",
    title: "STEADI — Stopping Elderly Accidents, Deaths and Injuries: fall-risk screening",
    clinical_topic: "Falls risk in older adults",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.cdc.gov/steadi/",
    population: "Adults 65 years and older",
    status: "current",
    status_note: "Screening questions and algorithm are read at the source; the recorded answers are the clinician's, not inferred.",
  },
};

export const FM_LOCAL_PROTOCOL_NOTICE =
  "No locally approved family medicine protocol is registered in this workspace. The basis recorded below is international documentation support only and is not a local approval. A local protocol must be added with its approving body, approval reference, adoption date and review date before it is presented as approved.";

// Which international references each family medicine note cites.
export const FM_NOTE_REFERENCES = {
  fm_general_consultation: ["aafp", "nice", "who_phc", "wonca"],
  fm_preventive_visit: ["uspstf", "who_immunization", "aafp", "who_phc"],
  fm_chronic_followup: ["nice", "aafp", "ada", "kdigo", "acc_aha"],
  fm_acute_visit: ["nice", "idsa", "aafp", "who_phc"],
  fm_followup: ["aafp", "nice", "wonca"],
  fm_referral: ["aafp", "wonca", "nice"],
  fm_procedure_note: ["aafp", "nice"],
  fm_medication_review: ["nice", "aafp", "idsa", "ada"],
  fm_health_maintenance: ["uspstf", "who_immunization", "aafp", "wonca"],
  fm_well_child: ["who_growth", "who_immunization", "uspstf", "aafp"],
  fm_geriatric_assessment: ["cdc_steadi", "nice", "uspstf", "aafp"],
  fm_womens_health: ["acog", "uspstf", "nice", "aafp"],
  fm_maternal_health: ["acog", "who_phc", "nice"],
  fm_vaccination: ["who_immunization", "uspstf", "aafp"],
  fm_mental_health: ["nice", "aafp", "uspstf"],
  fm_lifestyle_counseling: ["uspstf", "nice", "who_phc", "aafp", "acc_aha"],
  fm_chronic_annual_review: ["nice", "ada", "kdigo", "gina", "gold", "acc_aha"],
};

export const fmGuidanceForNote = (noteKey) =>
  (FM_NOTE_REFERENCES[noteKey] || ["aafp", "who_phc"]).map((k) => FM_REFERENCES[k]).filter(Boolean);

export const fmReference = (key) => FM_REFERENCES[key] || null;

// Local protocols are stored separately from international recommendations and are
// empty until the institution registers one — an empty list is reported as such.
export const fmLocalProtocolsFor = () => [];

export const fmGuidanceBasis = (noteKey) => {
  const refs = fmGuidanceForNote(noteKey);
  if (!refs.length) return "Documentation structure — no international reference registered for this note type.";
  return `Documentation structure follows: ${refs
    .map((r) => `${r.issuing_organization} — ${r.title}${r.publication_year ? ` (${r.publication_year})` : ""}`)
    .join("; ")}. These are international recommendations recorded as documentation support, not local approval.`;
};

// Conditional guidance shown beside a documented finding. Each carries its source,
// and none of it orders treatment: it states what the cited document recommends so
// the clinician can decide and document the decision.
export const FM_REFERENCE_GUIDANCE = {
  tobacco: {
    source: "uspstf",
    text: "Ask every adult about tobacco use, advise quitting and offer behavioural support and pharmacotherapy.",
  },
  blood_pressure: {
    source: "uspstf",
    text: "Screen all adults for hypertension with office blood-pressure measurement; confirm outside the clinic before starting treatment.",
  },
  colorectal: {
    source: "uspstf",
    text: "Screen average-risk adults aged 45–75 years for colorectal cancer.",
  },
  cervical: {
    source: "uspstf",
    text: "Screen women aged 21–65 years for cervical cancer; the interval depends on the test used and must be read at the source.",
  },
  breast: {
    source: "uspstf",
    text: "Screen women aged 40–74 years with biennial mammography.",
  },
  lung: {
    source: "uspstf",
    text: "Annual low-dose CT for adults 50–80 years with a 20 pack-year history who currently smoke or quit within 15 years.",
  },
  diabetes: {
    source: "uspstf",
    text: "Screen adults aged 35–70 years who are overweight or obese for prediabetes and type 2 diabetes.",
  },
  cardiovascular_risk: {
    source: "acc_aha",
    text: "Estimate 10-year atherosclerotic cardiovascular risk and discuss risk-based preventive treatment with the patient.",
  },
  ckd: {
    source: "kdigo",
    text: "Stage chronic kidney disease by eGFR and albuminuria; a single eGFR is not a diagnosis of chronic kidney disease.",
  },
  asthma: {
    source: "gina",
    text: "Assess symptom control at every visit and treat according to the current GINA strategy; reliever-only treatment is not recommended for adults and adolescents.",
  },
  copd: {
    source: "gold",
    text: "Assess symptoms and exacerbation history at every review; confirm the diagnosis on spirometry before long-term inhaled treatment.",
  },
  mental_health: {
    source: "nice",
    text: "Use a validated measure to record severity, and ask directly about self-harm and suicidal thoughts at assessment.",
  },
  falls: {
    source: "cdc_steadi",
    text: "Screen older adults for falls, assess gait and balance when positive, and review contributing medication.",
  },
  growth: {
    source: "who_growth",
    text: "Plot measurements on the WHO growth charts; a single measurement is not a growth trend.",
  },
  pregnancy: {
    source: "acog",
    text: "Record pregnancy status before prescribing, and review medicines for pregnancy compatibility at every visit.",
  },
  antimicrobial: {
    source: "idsa",
    text: "Base empiric antimicrobial choice on the likely pathogen and local resistance patterns, and document the indication and duration.",
  },
};