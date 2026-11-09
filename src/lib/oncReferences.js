// Oncology — reference register and guideline basis.
//
// RULES
//   · Every entry is a LINK to the issuing body's own publication. No NCCN, ESMO, WHO,
//     AJCC, UICC or CAP document is copied, hosted, reproduced or redistributed by
//     AMedix — those are licensed publications and the clinician reads them at source.
//   · A version or year is recorded only where the issuing body states one; a living
//     collection stays `null` rather than being given an invented date.
//   · `status` is honest: `current` means the body still publishes the collection,
//     `verify` means the current edition must be confirmed at the source before it is
//     presented as current.
//   · These are INTERNATIONAL recommendations. They are never presented as a local
//     approval; local protocols are held separately and are empty until the institution
//     registers one.
//   · Where NCCN and ESMO differ, the disagreement is stated and the clinician is sent
//     to both original sources. AMedix never silently picks one.

export const ONC_PRINCIPAL_REFERENCE = "nccn";

export const ONC_REFERENCES = {
  nccn: {
    key: "nccn",
    issuing_organization: "National Comprehensive Cancer Network (NCCN)",
    title: "NCCN Clinical Practice Guidelines in Oncology",
    clinical_topic: "Cancer management across tumour types — principal oncology reference",
    version: "living collection, versioned by tumour type and year",
    publication_year: null,
    source_url: "https://www.nccn.org/guidelines/category_1",
    population: "Adults with solid tumours and haematological malignancies",
    status: "current",
    evidence_grading:
      "NCCN grades recommendations by category of evidence and consensus (1, 2A, 2B, 3) with the supporting evidence listed per recommendation.",
    status_note:
      "Each guideline is issued per tumour type with its own version and date; the current version and its categories must be read at the source. NCCN content is licensed and is not reproduced here.",
    role: "principal",
  },
  esmo: {
    key: "esmo",
    issuing_organization: "European Society for Medical Oncology (ESMO)",
    title: "ESMO Clinical Practice Guidelines",
    clinical_topic: "Cancer management across tumour types",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.esmo.org/guidelines",
    population: "Adults with cancer",
    status: "current",
    evidence_grading:
      "ESMO grades recommendations by level of evidence (I–V) and grade of recommendation (A–E), with an ESCAT scale for molecular targets.",
    status_note:
      "Published and updated per tumour type, with a separate Living Guidelines programme; the current edition must be read at the source.",
  },
  esmo_living: {
    key: "esmo_living",
    issuing_organization: "European Society for Medical Oncology (ESMO)",
    title: "ESMO Living Guidelines",
    clinical_topic: "Continuously updated oncology recommendations",
    version: "living",
    publication_year: null,
    source_url: "https://www.esmo.org/guidelines/esmo-living-guidelines",
    population: "Adults with cancer",
    status: "current",
    evidence_grading: "As stated in each living guideline at the source.",
    status_note:
      "A living collection that changes without a new edition number — the date read at the source is the only reliable version marker.",
  },
  who_tumours: {
    key: "who_tumours",
    issuing_organization: "World Health Organization / International Agency for Research on Cancer (WHO/IARC)",
    title: "WHO Classification of Tumours",
    clinical_topic: "Tumour classification — histology, site and molecular definition",
    version: "5th edition series, per organ system",
    publication_year: null,
    source_url: "https://www.iarc.who.int/cancer-type/",
    population: "All patients with a neoplasm",
    status: "current",
    evidence_grading:
      "A classification rather than a graded recommendation: it defines tumour types, their diagnostic criteria and their molecular features.",
    status_note:
      "The 5th edition is published volume by volume; the volume covering the relevant organ system must be confirmed at the source, because not every organ system has moved to the 5th edition.",
  },
  ajcc: {
    key: "ajcc",
    issuing_organization: "American Joint Committee on Cancer (AJCC)",
    title: "AJCC Cancer Staging Manual",
    clinical_topic: "TNM staging for solid tumours",
    version: "8th edition",
    publication_year: 2017,
    source_url: "https://www.facs.org/quality-programs/cancer-programs/ajcc/",
    population: "Patients with solid tumours",
    status: "verify",
    evidence_grading:
      "Not a graded recommendation: stage definitions (TNM and stage groups) with stage-specific prognosis.",
    status_note:
      "The 8th edition is the current manual published by AJCC; later revisions and tumour-specific updates must be confirmed at the source before a stage group is assigned from it.",
  },
  uicc: {
    key: "uicc",
    issuing_organization: "Union for International Cancer Control (UICC)",
    title: "TNM Classification of Malignant Tumours",
    clinical_topic: "TNM staging — international edition",
    version: "8th edition",
    publication_year: 2017,
    source_url: "https://www.uicc.org/resources/tnm",
    population: "Patients with solid tumours",
    status: "verify",
    evidence_grading: "Not a graded recommendation: TNM definitions and stage grouping rules.",
    status_note:
      "UICC and AJCC TNM editions are harmonised but not identical in every tumour type; record which edition governed the stage, and confirm the current edition at the source.",
  },
  cap: {
    key: "cap",
    issuing_organization: "College of American Pathologists (CAP)",
    title: "CAP Cancer Protocols and Biomarker Reporting Templates",
    clinical_topic: "Synoptic histopathology reporting",
    version: "living collection, per specimen type",
    publication_year: null,
    source_url: "https://www.cap.org/protocols-and-guidelines/cancer-reporting-tools/cancer-protocols",
    population: "Patients with a cancer specimen",
    status: "current",
    evidence_grading:
      "Not a graded recommendation: required and recommended data elements for a synoptic cancer report.",
    status_note:
      "Protocols are released and revised per specimen type; the current protocol version must be read at the source.",
  },
  recist: {
    key: "recist",
    issuing_organization: "RECIST Working Group (EORTC / NCI / ACRIN)",
    title: "RECIST 1.1 — Response Evaluation Criteria in Solid Tumours",
    clinical_topic: "Solid-tumour response assessment",
    version: "1.1",
    publication_year: 2009,
    source_url: "https://recist.eortc.org/",
    population: "Adults with measurable solid tumours",
    status: "current",
    evidence_grading:
      "A response criteria set, not a graded recommendation: definitions of measurable disease, target and non-target lesions, and overall response categories.",
    status_note:
      "RECIST 1.1 remains the standard for most solid tumours; tumour-specific criteria (for example RANO for CNS tumours, Deauville for lymphoma) apply where they exist.",
  },
  ctcae: {
    key: "ctcae",
    issuing_organization: "US National Cancer Institute (NCI)",
    title: "Common Terminology Criteria for Adverse Events (CTCAE)",
    clinical_topic: "Adverse event grading",
    version: "v5.0",
    publication_year: 2017,
    source_url: "https://ctep.cancer.gov/protocoldevelopment/electronic_applications/ctcae.htm",
    population: "Patients receiving cancer treatment",
    status: "current",
    evidence_grading:
      "A grading system, not a graded recommendation: grade 1–5 definitions per adverse event term.",
    status_note:
      "v5.0 is the current published version; confirm at the source before using a term whose grading changed between versions.",
  },
  asco: {
    key: "asco",
    issuing_organization: "American Society of Clinical Oncology (ASCO)",
    title: "ASCO Guidelines and Provisional Clinical Opinions",
    clinical_topic: "Supportive care, biomarkers and specific cancer questions",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.asco.org/guidelines",
    population: "Adults with cancer",
    status: "current",
    evidence_grading:
      "ASCO grades recommendations by strength and evidence quality using its own adapted GRADE approach.",
    status_note: "Guidelines are revised and retired over time; confirm the current version at the source.",
  },
};

export const ONC_LOCAL_PROTOCOL_NOTICE =
  "No locally approved oncology protocol is registered for this note. An international recommendation is not a local approval — the institution's own approved protocol is held separately and this note does not claim one.";

export const ONC_REFERENCE_DIVERGENCE_NOTE =
  "NCCN and ESMO recommendations do not always agree — for example on the extent of molecular testing, on adjuvant treatment thresholds and on surveillance imaging intervals. Where they differ, this note records the divergence and sends the clinician to both original documents; AMedix never selects one silently.";

// Which collection each note's documentation structure follows. NCCN is the principal
// reference; the ESMO guideline for the same tumour and the staging, pathology and
// response standards are cited beside it.
const NOTE_REFERENCES = {
  onc_consultation: ["nccn", "esmo", "who_tumours", "ajcc"],
  onc_treatment_plan: ["nccn", "esmo", "esmo_living", "ctcae"],
  onc_followup: ["nccn", "esmo", "recist", "ctcae"],
  onc_progress_note: ["nccn", "ctcae", "recist"],
  onc_chemo_record: ["nccn", "ctcae", "asco"],
  onc_infusion_record: ["nccn", "ctcae", "asco"],
  onc_radiation_record: ["nccn", "esmo", "ctcae"],
  onc_staging_record: ["ajcc", "uicc", "who_tumours", "nccn"],
  onc_tumor_board_record: ["nccn", "esmo", "ajcc"],
  onc_discharge_summary: ["nccn", "asco"],
  onc_treatment_summary: ["nccn", "esmo", "recist"],
  onc_surveillance_record: ["nccn", "esmo", "recist"],
  onc_breast_cancer: ["nccn", "esmo", "ajcc", "cap", "who_tumours"],
  onc_lung_cancer: ["nccn", "esmo", "ajcc", "cap", "recist"],
  onc_colorectal_cancer: ["nccn", "esmo", "ajcc", "cap", "who_tumours"],
  onc_upper_gi_cancer: ["nccn", "esmo", "ajcc", "cap"],
  onc_hepatobiliary_pancreatic: ["nccn", "esmo", "ajcc", "cap"],
  onc_prostate_cancer: ["nccn", "esmo", "ajcc", "cap"],
  onc_urologic_cancer: ["nccn", "esmo", "ajcc", "cap"],
  onc_gynaecologic_cancer: ["nccn", "esmo", "ajcc", "cap"],
  onc_head_neck_cancer: ["nccn", "esmo", "ajcc", "cap"],
  onc_thyroid_cancer: ["nccn", "esmo", "ajcc", "cap", "who_tumours"],
  onc_melanoma_skin_cancer: ["nccn", "esmo", "ajcc", "cap", "who_tumours"],
  onc_cns_tumour: ["nccn", "esmo", "who_tumours", "recist"],
  onc_sarcoma: ["nccn", "esmo", "ajcc", "cap", "who_tumours"],
  onc_haematological_malignancy: ["nccn", "esmo", "who_tumours", "ctcae"],
  onc_unknown_primary_rare: ["nccn", "esmo", "who_tumours", "ajcc"],
};

export const oncReferencesForNote = (noteKey) =>
  (NOTE_REFERENCES[noteKey] || [ONC_PRINCIPAL_REFERENCE]).map((k) => ONC_REFERENCES[k]).filter(Boolean);

export const ONC_LOCAL_PROTOCOLS = {};

export const oncLocalProtocolsFor = (noteKey) =>
  Object.values(ONC_LOCAL_PROTOCOLS).filter((p) => (p.note_keys || []).includes(noteKey));

export const oncGuidanceBasis = (noteKey) => {
  const refs = oncReferencesForNote(noteKey);
  if (!refs.length) return "";
  const named = refs.map((r) => `${r.issuing_organization} — ${r.title}`).join("; ");
  return `Documentation structure follows the international recommendations of ${named}. ${ONC_REFERENCE_DIVERGENCE_NOTE} ${ONC_LOCAL_PROTOCOL_NOTICE}`;
};

export const oncReferenceAt = (key) => ONC_REFERENCES[key] || ONC_REFERENCES.nccn;