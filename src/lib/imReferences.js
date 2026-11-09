// Internal Medicine — reference register and guideline basis.
//
// ACP Clinical Practice Guidelines are the principal general internal medicine
// reference; the specialty bodies are cited for their own domains (AHA/ACC, ESC,
// ADA, KDIGO, GOLD, GINA, IDSA, ACG, AASLD, ASH, ACR, AAN, NCCN, NICE, ATS, ACCP).
//
// RULES
//   · Every entry is a LINK to the issuing body's own publication. No document is
//     copied, hosted or redistributed by AMedix.
//   · A year is recorded only where the collection itself states one; a living
//     collection stays `null` rather than being given an invented date.
//   · `status` is honest: `current` means the body still publishes the collection,
//     `superseded` names what replaced it, and `verify` means the current edition
//     must be confirmed at the source before it is presented as current.
//   · These are INTERNATIONAL recommendations. They are never presented as a local
//     approval, and local protocols are held separately (and are empty until the
//     institution registers one).
//   · Evidence grading differs by body and is stated with the reference; a grade is
//     never invented for a recommendation.

export const IM_PRINCIPAL_REFERENCE = "acp";

export const IM_REFERENCES = {
  acp: {
    key: "acp",
    issuing_organization: "American College of Physicians (ACP)",
    title: "ACP Clinical Practice Guidelines",
    clinical_topic: "General internal medicine — principal reference",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.acponline.org/clinical_information/guidelines/",
    population: "Adults receiving internal medicine care",
    status: "current",
    evidence_grading:
      "ACP grades recommendations with GRADE: strength (strong or conditional) and certainty of evidence (high, moderate, low, very low).",
    status_note:
      "A continuously maintained collection; each guideline carries its own publication and update date that must be read at the source.",
    role: "principal",
  },
  aha_acc: {
    key: "aha_acc",
    issuing_organization: "American Heart Association / American College of Cardiology (AHA/ACC)",
    title: "AHA/ACC Clinical Practice Guidelines",
    clinical_topic: "Cardiovascular disease",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.acc.org/Guidelines",
    population: "Adults with cardiovascular disease",
    status: "current",
    evidence_grading:
      "AHA/ACC grade recommendations by Class of Recommendation (COR 1, 2a, 2b, 3) and Level of Evidence (LOE A, B-R, B-NR, C-LD, C-EO).",
    status_note: "Guidelines are revised as new evidence appears; confirm the current edition and its focused updates at the source.",
  },
  esc: {
    key: "esc",
    issuing_organization: "European Society of Cardiology (ESC)",
    title: "ESC Clinical Practice Guidelines",
    clinical_topic: "Cardiovascular disease",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.escardio.org/Guidelines",
    population: "Adults with cardiovascular disease",
    status: "current",
    evidence_grading: "ESC grades recommendations by Class (I, IIa, IIb, III) and Level of Evidence (A, B, C).",
    status_note: "ESC publishes focused updates between full revisions; confirm the current edition at the source.",
  },
  ada: {
    key: "ada",
    issuing_organization: "American Diabetes Association (ADA)",
    title: "Standards of Care in Diabetes",
    clinical_topic: "Diabetes mellitus",
    version: "annual revision",
    publication_year: null,
    source_url: "https://diabetesjournals.org/care",
    population: "Adults and children with diabetes",
    status: "current",
    evidence_grading: "ADA grades evidence as A, B, C or E, and recommendations as level 1 or 2.",
    status_note:
      "Revised every year; the applicable year's Standards must be read at the source — a previous year's edition is archived and is not presented here as current.",
  },
  kdigo: {
    key: "kdigo",
    issuing_organization: "Kidney Disease: Improving Global Outcomes (KDIGO)",
    title: "KDIGO Clinical Practice Guidelines",
    clinical_topic: "Kidney disease — CKD, AKI, glomerular disease, electrolytes",
    version: "living collection",
    publication_year: null,
    source_url: "https://kdigo.org/guidelines/",
    population: "Adults and children with kidney disease",
    status: "current",
    evidence_grading:
      "KDIGO uses GRADE: strength (level 1 or 2) and quality of evidence (A, B, C, D).",
    status_note: "Individual guidelines are updated on their own cycle; confirm the current edition at the source.",
  },
  gold: {
    key: "gold",
    issuing_organization: "Global Initiative for Chronic Obstructive Lung Disease (GOLD)",
    title: "GOLD Reports — Global Strategy for Prevention, Diagnosis and Management of COPD",
    clinical_topic: "Chronic obstructive pulmonary disease",
    version: "annual report",
    publication_year: null,
    source_url: "https://goldcopd.org/gold-reports/",
    population: "Adults with COPD",
    status: "current",
    evidence_grading:
      "GOLD labels evidence by study type (randomised controlled trials, observational studies) with evidence categories A–D for the statement concerned.",
    status_note:
      "An annual report: each year supersedes the previous one, and the year of the report being followed must be recorded in the note.",
  },
  gina: {
    key: "gina",
    issuing_organization: "Global Initiative for Asthma (GINA)",
    title: "GINA Reports — Global Strategy for Asthma Management and Prevention",
    clinical_topic: "Asthma",
    version: "annual report",
    publication_year: null,
    source_url: "https://ginasthma.org/reports/",
    population: "Adults and children with asthma",
    status: "current",
    evidence_grading: "GINA grades evidence levels A–D and labels the strength of each recommendation.",
    status_note:
      "An annual report: each year supersedes the previous one, and the year being followed must be recorded in the note.",
  },
  idsa: {
    key: "idsa",
    issuing_organization: "Infectious Diseases Society of America (IDSA)",
    title: "IDSA Clinical Practice Guidelines",
    clinical_topic: "Infectious diseases, antimicrobial therapy and sepsis",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.idsociety.org/practice-guideline/practice-guidelines/",
    population: "Adults and children with infection",
    status: "current",
    evidence_grading: "IDSA uses GRADE: strong or conditional recommendations with high, moderate or low certainty of evidence.",
    status_note: "Guidelines are updated individually; confirm the current edition at the source.",
  },
  acg: {
    key: "acg",
    issuing_organization: "American College of Gastroenterology (ACG)",
    title: "ACG Clinical Guidelines",
    clinical_topic: "Gastroenterology and hepatology",
    version: "living collection",
    publication_year: null,
    source_url: "https://gi.org/clinical-guidelines/",
    population: "Adults with gastrointestinal and liver disease",
    status: "current",
    evidence_grading: "ACG grades recommendations as strong or conditional with high, moderate or low quality of evidence.",
    status_note: "Each guideline is revised on its own cycle; confirm the current edition at the source.",
  },
  aasld: {
    key: "aasld",
    issuing_organization: "American Association for the Study of Liver Diseases (AASLD)",
    title: "AASLD Practice Guidance and Guidelines",
    clinical_topic: "Liver disease — cirrhosis, hepatitis, acute liver failure",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.aasld.org/practice-guidelines",
    population: "Adults with liver disease",
    status: "current",
    evidence_grading: "AASLD guidance documents state the strength and quality of the evidence supporting each statement.",
    status_note: "Confirm the current edition at the source; practice guidance and formal guidelines carry different weight.",
  },
  ash: {
    key: "ash",
    issuing_organization: "American Society of Hematology (ASH)",
    title: "ASH Clinical Practice Guidelines",
    clinical_topic: "Hematology — anaemia, thrombosis, malignant and non-malignant haematology",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.hematology.org/education/clinicians/guidelines-and-quality-standards",
    population: "Adults with haematological disease",
    status: "current",
    evidence_grading: "ASH uses GRADE with strong or conditional recommendations and explicit certainty ratings.",
    status_note: "Confirm the current edition at the source.",
  },
  acr: {
    key: "acr",
    issuing_organization: "American College of Rheumatology (ACR)",
    title: "ACR Clinical Practice Guidelines",
    clinical_topic: "Rheumatology",
    version: "living collection",
    publication_year: null,
    source_url: "https://rheumatology.org/clinical-practice-guidelines",
    population: "Adults with rheumatic disease",
    status: "current",
    evidence_grading: "ACR grades recommendations as strong or conditional, with a stated certainty of evidence.",
    status_note: "Confirm the current edition at the source.",
  },
  aan: {
    key: "aan",
    issuing_organization: "American Academy of Neurology (AAN)",
    title: "AAN Clinical Practice Guidelines",
    clinical_topic: "Neurology",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.aan.com/Guidelines",
    population: "Adults with neurological disease",
    status: "current",
    evidence_grading: "AAN rates recommendations by level of obligation (A, B, C, U) against the classified evidence.",
    status_note: "Confirm the current edition at the source.",
  },
  nccn: {
    key: "nccn",
    issuing_organization: "National Comprehensive Cancer Network (NCCN)",
    title: "NCCN Clinical Practice Guidelines in Oncology",
    clinical_topic: "Oncology — diagnosis, staging and treatment pathways",
    version: "versioned, frequently revised",
    publication_year: null,
    source_url: "https://www.nccn.org/guidelines/category_1",
    population: "Adults with cancer",
    status: "current",
    evidence_grading: "NCCN categorises recommendations by the strength of the supporting evidence and the consensus level.",
    status_note:
      "Each guideline is versioned and revised several times a year; the version being followed must be recorded in the note, and free access may require registration.",
  },
  ats: {
    key: "ats",
    issuing_organization: "American Thoracic Society (ATS)",
    title: "ATS Clinical Practice Guidelines and Statements",
    clinical_topic: "Respiratory medicine, critical care and sleep medicine",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.thoracic.org/statements/",
    population: "Adults with respiratory disease",
    status: "current",
    evidence_grading: "ATS uses GRADE with strong or conditional recommendations and certainty ratings.",
    status_note: "Confirm the current edition at the source.",
  },
  accp: {
    key: "accp",
    issuing_organization: "American College of Chest Physicians (CHEST)",
    title: "CHEST Guidelines and Consensus Statements",
    clinical_topic: "Thrombosis, pulmonary medicine and critical care",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.chestnet.org/Guidelines-and-Resources/Guidelines-and-Consensus-Statements",
    population: "Adults with thrombotic or pulmonary disease",
    status: "current",
    evidence_grading: "CHEST uses GRADE with strong or weak recommendations and certainty ratings; some documents are consensus statements, which are labelled as such.",
    status_note: "Confirm the current edition at the source.",
  },
  nice: {
    key: "nice",
    issuing_organization: "National Institute for Health and Care Excellence (NICE)",
    title: "NICE Guidance — clinical guidelines and quality standards",
    clinical_topic: "Evidence-based diagnosis and management across internal medicine",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.nice.org.uk/guidance",
    population: "Adults (per individual guideline)",
    status: "current",
    evidence_grading: "NICE recommendations are linked to the quality of the underlying evidence and are updated through surveillance reviews.",
    status_note:
      "NICE withdraws guidance when it is no longer supported by current evidence; withdrawn guidance must not be presented as current.",
  },
  who_icd11: {
    key: "who_icd11",
    issuing_organization: "World Health Organization (WHO)",
    title: "ICD-11 — International Classification of Diseases, 11th Revision, MMS linearization",
    clinical_topic: "Diagnosis classification and coding",
    version: "release stated with each coded entry",
    publication_year: null,
    source_url: "https://icd.who.int/",
    population: "All ages",
    status: "current",
    evidence_grading: "A classification, not a guideline: it carries no recommendation grades.",
    status_note:
      "The release a code was verified against is recorded with the code. AMedix never generates or completes an ICD-11 code.",
  },
};

// Which references underpin each IM note. ACP is cited on every note as the
// principal general-internal-medicine reference; the specialty body is added for
// the domain the note addresses.
const BASE = ["acp", "nice", "who_icd11"];

export const IM_NOTE_REFERENCES = {
  im_consultation: BASE,
  im_new_patient_assessment: BASE,
  im_followup: BASE,
  im_chronic_followup: ["acp", "nice", "ada", "kdigo", "who_icd11"],
  im_admission_note: ["acp", "nice", "idsa", "who_icd11"],
  im_daily_progress: ["acp", "nice", "who_icd11"],
  im_problem_oriented_progress: BASE,
  im_consultation_request: BASE,
  im_consultation_response: BASE,
  im_medication_reconciliation: ["acp", "nice", "who_icd11"],
  im_discharge_summary: ["acp", "nice", "who_icd11"],
  im_medical_followup: BASE,
  im_chronic_care_plan: ["acp", "nice", "ada", "kdigo", "gold", "who_icd11"],
  im_cardiology_review: ["acp", "aha_acc", "esc", "nice", "who_icd11"],
  im_respiratory_review: ["acp", "gold", "gina", "ats", "nice", "who_icd11"],
  im_gastro_review: ["acp", "acg", "aasld", "nice", "who_icd11"],
  im_nephrology_review: ["acp", "kdigo", "nice", "who_icd11"],
  im_diabetes_review: ["acp", "ada", "nice", "who_icd11"],
  im_hematology_review: ["acp", "ash", "nice", "who_icd11"],
  im_infectious_disease_review: ["acp", "idsa", "nice", "who_icd11"],
  im_rheumatology_review: ["acp", "acr", "nice", "who_icd11"],
  im_neurology_review: ["acp", "aan", "nice", "who_icd11"],
  im_oncology_review: ["acp", "nccn", "nice", "who_icd11"],
  im_geriatric_review: ["acp", "nice", "who_icd11"],
  im_sepsis_assessment: ["acp", "idsa", "nice", "who_icd11"],
  im_acute_deterioration: ["acp", "nice", "ats", "who_icd11"],
  im_venous_thromboembolism: ["acp", "accp", "aha_acc", "nice", "who_icd11"],
  im_anticoagulation_review: ["acp", "aha_acc", "accp", "nice", "who_icd11"],
  im_electrolyte_disorder: ["acp", "kdigo", "nice", "who_icd11"],
};

export const imReference = (key) => IM_REFERENCES[key] || null;

export const imGuidanceForNote = (noteKey) => {
  const keys = IM_NOTE_REFERENCES[noteKey] || BASE;
  const list = keys.map((k) => IM_REFERENCES[k]).filter(Boolean);
  // ACP first, always — it is the principal general internal medicine reference.
  return list.sort((a, b) => (a.key === IM_PRINCIPAL_REFERENCE ? -1 : b.key === IM_PRINCIPAL_REFERENCE ? 1 : 0));
};

// Local protocols are stored separately from international recommendations and stay
// empty until the institution registers one. An empty list is reported as such.
export const imLocalProtocolsFor = () => [];

export const IM_LOCAL_PROTOCOL_NOTICE =
  "No local protocol is registered for this note type. The references listed are international recommendations recorded as documentation support — they are not a local approval.";

export const imGuidanceBasis = (noteKey) => {
  const refs = imGuidanceForNote(noteKey);
  if (!refs.length) return "Documentation structure — no international reference registered for this note type.";
  const principal = refs.find((r) => r.key === IM_PRINCIPAL_REFERENCE);
  const others = refs.filter((r) => r.key !== IM_PRINCIPAL_REFERENCE);
  const parts = [];
  if (principal) parts.push(`${principal.issuing_organization} — ${principal.title} (principal general internal medicine reference)`);
  others.forEach((r) => parts.push(`${r.issuing_organization} — ${r.title}`));
  return `Documentation structure follows: ${parts.join("; ")}. These are international recommendations recorded as documentation support, not local approval. Where a body publishes an annual edition (GOLD, GINA, ADA, NCCN), the edition followed must be stated in the note.`;
};

// Conditional guidance shown beside a documented finding. Each item names its
// source and states what the cited document recommends; none of it orders treatment.
export const IM_REFERENCE_GUIDANCE = {
  sepsis: {
    source: "idsa",
    text: "In suspected sepsis, the cited guidance addresses early recognition, cultures where they do not delay therapy, antimicrobial timing and source control. Antibiotic choice and dose remain the treating physician's documented decision.",
  },
  aki: {
    source: "kdigo",
    text: "KDIGO stages AKI on a creatinine rise and urine output, and addresses removing nephrotoxins, optimising volume status and reviewing medication doses — the staging is a description, not an order.",
  },
  hyperkalaemia: {
    source: "kdigo",
    text: "The cited guidance addresses confirming the sample, ECG assessment and urgent treatment of severe hyperkalaemia; the decision and its timing belong in the record.",
  },
  cirrhosis: {
    source: "aasld",
    text: "The cited guidance addresses decompensation, variceal screening and prophylaxis, spontaneous bacterial peritonitis and transplant referral; Child-Pugh and MELD describe severity and do not by themselves direct treatment.",
  },
  diabetes: {
    source: "ada",
    text: "The cited Standards address individualised glycaemic targets, hypoglycaemia risk, renal dosing and complication screening; a target is a documented clinical decision, never a default applied by AMedix.",
  },
  copd: {
    source: "gold",
    text: "The cited report addresses exacerbation severity, bronchodilator and steroid decisions, oxygen targets and follow-up; the report edition being followed must be recorded.",
  },
  asthma: {
    source: "gina",
    text: "The cited report addresses severity assessment, ICS-containing treatment and escalation; the report edition being followed must be recorded.",
  },
  pneumonia: {
    source: "ats",
    text: "The cited guidance addresses severity assessment, site of care and microbiology; CURB-65 and PSI describe severity and do not by themselves decide admission.",
  },
  anticoagulation: {
    source: "accp",
    text: "The cited guidance addresses indications, agent choice, renal dosing and bleeding-risk review; CHA₂DS₂-VASc and HAS-BLED inform the decision and are not a prescription.",
  },
  cancer: {
    source: "nccn",
    text: "The cited guidelines are versioned and revised frequently; the version followed must be recorded, and treatment intent and performance status belong in the note.",
  },
};

export const imReferenceGuidance = (key) => {
  const item = IM_REFERENCE_GUIDANCE[key];
  if (!item) return null;
  const ref = IM_REFERENCES[item.source];
  return { ...item, organization: ref?.issuing_organization || "", title: ref?.title || "", url: ref?.source_url || "" };
};