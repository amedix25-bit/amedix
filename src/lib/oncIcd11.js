// Oncology — WHO ICD-11 MMS coding context, tumour behaviour and primary/secondary integrity.
//
// SCOPE AND HONESTY RULES
//   · WHO ICD-11 MMS only. ICD-10 and ICD-O-3 are SEPARATE systems held beside it and
//     are never treated as interchangeable: ICD-O-3 stays available for cancer-registry
//     topography and morphology, ICD-11 MMS is the clinical classification, and neither
//     is converted into the other by this module.
//   · NO CODE IS WRITTEN IN THIS FILE. Every entry below is a clinical search term that
//     is resolved at the moment of use against the AMedix-wide ICD-11 dataset (the same
//     shared infrastructure the rest of the app uses, seeded from an official WHO
//     release). A code is stored only when the dataset returns that entry; a tumour the
//     dataset does not hold is recorded with NO code and flagged for coding review. A
//     code is never generated, completed or guessed for oncology — a wrong neoplasm code
//     is a wrong cancer diagnosis.
//   · The index is a shortcut into the classification, not a static cancer dropdown: the
//     clinician can always search the whole dataset by cancer name, anatomical site,
//     histology, synonym or code.
//   · Detail a code cannot carry — site, laterality, behaviour, histology, grade,
//     diagnosis date, confirmation status, coding clinician, release — is recorded
//     BESIDE the code in the entry's detail fields, never appended to it.
//   · Behaviour is recorded explicitly. A metastatic deposit is NEVER written as a new
//     primary cancer, and a secondary-behaviour entry is never given the Primary role.

export const ONC_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  label: "ICD-11 MMS",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  chapter_note:
    "Neoplasms sit mainly in chapter 02 (Neoplasms) of ICD-11 MMS, grouped by behaviour and anatomy — malignant primary, malignant secondary (metastatic), in situ, benign, and neoplasms of uncertain or unknown behaviour — with haematological malignancies in the same chapter. The chapter and block are read from the dataset entry itself and are never chosen by AMedix.",
};

// The behaviour a neoplasm is documented as. Recorded beside the code, because the
// same anatomical site can appear in more than one behaviour group.
export const ONC_TUMOUR_BEHAVIOURS = [
  "Primary malignant neoplasm",
  "Secondary (metastatic) neoplasm",
  "Carcinoma in situ",
  "Benign neoplasm",
  "Neoplasm of uncertain or unknown behaviour",
  "Haematological malignancy",
  "Not applicable / non-neoplastic",
];

export const ONC_BEHAVIOUR_NOTES = {
  primary: "A primary cancer is recorded once, at its anatomical origin, with the histology documented beside it.",
  secondary:
    "A secondary (metastatic) deposit is recorded with the SECONDARY behaviour and the metastatic site — it is never recorded as a new primary cancer, and it never replaces the primary diagnosis.",
  in_situ: "Carcinoma in situ is a distinct behaviour from invasive malignancy and is coded in its own group.",
  benign: "A benign neoplasm keeps its own behaviour; it is never coded as malignant because it was investigated for cancer.",
  uncertain:
    "A neoplasm of uncertain or unknown behaviour stays in that group until the histopathology documents otherwise — uncertainty is never resolved by coding.",
  haematology:
    "Haematological malignancies use the classification appropriate to them (for example Ann Arbor for lymphoma, ISS/R-ISS for myeloma, the relevant leukaemia classification) — solid-tumour TNM staging is not applied to them.",
  not_neoplastic: "A non-neoplastic finding is never coded as a neoplasm, even in a patient with a known cancer.",
};

// Every oncology diagnosis carries one of these documented statuses. A code alone
// never confirms a cancer diagnosis — the status is the clinician's statement, and it
// is the only thing that makes a diagnosis confirmed.
export const ONC_ICD_STATUSES = [
  "Suspected",
  "Differential diagnosis",
  "Provisional",
  "Histologically confirmed",
  "Clinically confirmed (no histology)",
  "Ruled out",
  "Historical / previous cancer",
  "Metastatic — secondary to known primary",
];

export const ONC_ICD_ROLES = ["Primary cancer", "Secondary / metastatic site", "Concurrent malignancy", "Complication of cancer"];

export const ONC_CONFIRMATION_BASIS = [
  "Histopathology",
  "Cytology",
  "Imaging",
  "Tumour markers",
  "Clinical assessment",
  "Not documented",
];

// Recorded beside the code, never inside it.
export const ONC_ICD_DETAIL_FIELDS = [
  {
    key: "anatomical_site",
    label: "Anatomical site / primary origin",
    type: "input",
    placeholder: "e.g. upper outer quadrant of left breast, right upper lobe",
  },
  {
    key: "laterality",
    label: "Laterality",
    type: "select",
    options: ["Right", "Left", "Bilateral", "Midline", "Not applicable", "Not documented"],
    hint: "Recorded beside the code — never appended to it.",
  },
  {
    key: "behaviour",
    label: "Tumour behaviour",
    type: "select",
    options: ONC_TUMOUR_BEHAVIOURS,
    hint: "A metastasis is recorded as secondary — never as a new primary.",
  },
  {
    key: "histology",
    label: "Histological type / subtype",
    type: "input",
    placeholder: "e.g. invasive ductal carcinoma, adenocarcinoma, diffuse large B-cell lymphoma",
  },
  {
    key: "grade",
    label: "Grade (with the system used)",
    type: "input",
    placeholder: "e.g. Nottingham grade 2, WHO grade III, Fuhrman grade 3",
  },
  {
    key: "diagnosis_date",
    label: "Date of diagnosis",
    type: "input",
    placeholder: "Date the diagnosis was documented (not the date of coding)",
  },
  {
    key: "classification_version",
    label: "Classification release / edition",
    type: "input",
    placeholder: "ICD-11 MMS release the code was read from, plus the staging edition if recorded",
  },
  {
    key: "coded_by",
    label: "Coding clinician",
    type: "input",
    placeholder: "Who assigned this code (recorded by the platform as the author of the entry)",
  },
  {
    key: "icd_o_topography",
    label: "ICD-O-3 topography (registry only)",
    type: "input",
    placeholder: "Recorded separately for cancer registry — never used as an ICD-11 code",
  },
  {
    key: "icd_o_morphology",
    label: "ICD-O-3 morphology (registry only)",
    type: "input",
    placeholder: "Recorded separately for cancer registry — never used as an ICD-11 code",
  },
];

export const ONC_ICD_CODING_NOTE =
  "A code is stored only when the workspace ICD-11 dataset returns it. If a tumour cannot be resolved, record the diagnosis with no code and flag it for coding review — AMedix never generates, completes or guesses a neoplasm code. Behaviour, site, laterality, histology and grade are recorded beside the code.";

export const ONC_ICD_CLUSTER_NOTE =
  "Postcoordination is offered only where the dataset entry itself declares the axes. A cluster is never built by AMedix, and an unsupported combination is left unbuilt rather than approximated.";

export const ONC_ICD_SEARCH_GUIDANCE =
  "Search by cancer name, anatomical site, histology, synonym or code. Read the official description, hierarchy, inclusion and exclusion notes before selecting. The classification entry is checked by the clinician — never auto-selected by AMedix.";

// ---------------------------------------------------------------- tumour behaviour
// A small, deterministic integrity check over the entries the clinician documented.
// It reports what the record says; it never changes or completes a code.
export const oncBehaviourConflicts = (entries = []) => {
  const list = Array.isArray(entries) ? entries : [];
  const problems = [];
  list.forEach((entry) => {
    const e = entry || {};
    const label = e.display || e.code || "unnamed entry";
    const behaviour = String(e.behaviour || "");
    const role = String(e.role || "");
    const secondary = /secondary|metastatic/i.test(behaviour);
    if (secondary && /^primary cancer$/i.test(role.trim())) {
      problems.push(
        `"${label}" is documented as a secondary (metastatic) neoplasm but given the Primary role — a metastasis is never a new primary cancer.`,
      );
    }
    if (/^secondary \/ metastatic site$/i.test(role.trim()) && behaviour && !secondary) {
      problems.push(
        `"${label}" is given the metastatic-site role but its behaviour is "${behaviour}" — check which is correct before signing.`,
      );
    }
    if (e.code && String(e.mapping_state || "") === "verified" && !String(e.release || "").trim()) {
      problems.push(`"${label}" is marked verified but carries no classification release — provenance is incomplete.`);
    }
    if (!e.code && !/unresolved|review_required/.test(String(e.mapping_state || ""))) {
      problems.push(`"${label}" has no code and is not flagged for coding review.`);
    }
  });
  return problems;
};

// Search-term index. Terms only — each is resolved against the official dataset.
const group = (key, label, terms, note) => ({ key, label, terms, note });

export const ONC_ICD11_GROUPS = [
  group("breast", "Breast", [
    "malignant neoplasm of breast", "invasive ductal carcinoma of breast", "invasive lobular carcinoma of breast",
    "triple negative breast cancer", "inflammatory breast cancer", "ductal carcinoma in situ", "lobular carcinoma in situ",
    "Paget disease of nipple", "male breast cancer", "secondary malignant neoplasm of breast",
  ]),
  group("thoracic", "Lung and thorax", [
    "malignant neoplasm of lung", "non-small cell lung cancer", "squamous cell carcinoma of lung",
    "adenocarcinoma of lung", "large cell carcinoma of lung", "small cell lung cancer", "mesothelioma",
    "thymoma", "malignant neoplasm of pleura", "secondary malignant neoplasm of lung", "malignant pleural effusion",
  ]),
  group("colorectal", "Colorectal and anal", [
    "malignant neoplasm of colon", "malignant neoplasm of caecum", "malignant neoplasm of sigmoid colon",
    "malignant neoplasm of rectum", "malignant neoplasm of anus", "adenocarcinoma of colon",
    "mucinous adenocarcinoma of colon", "secondary malignant neoplasm of liver", "familial adenomatous polyposis",
    "lynch syndrome",
  ]),
  group("upper_gi", "Oesophagus and stomach", [
    "malignant neoplasm of oesophagus", "adenocarcinoma of oesophagus", "squamous cell carcinoma of oesophagus",
    "malignant neoplasm of stomach", "gastric adenocarcinoma", "gastro-oesophageal junction adenocarcinoma",
    "gastrointestinal stromal tumour", "malignant neoplasm of small intestine",
  ]),
  group("hepatobiliary", "Liver, biliary tract and pancreas", [
    "hepatocellular carcinoma", "cholangiocarcinoma", "malignant neoplasm of gallbladder",
    "malignant neoplasm of ampulla of Vater", "pancreatic ductal adenocarcinoma",
    "neuroendocrine neoplasm of pancreas", "malignant neoplasm of liver", "secondary malignant neoplasm of liver",
  ]),
  group("genitourinary", "Prostate, kidney, bladder and testis", [
    "malignant neoplasm of prostate", "acinar adenocarcinoma of prostate", "malignant neoplasm of kidney",
    "renal cell carcinoma", "clear cell renal cell carcinoma", "malignant neoplasm of bladder",
    "urothelial carcinoma of bladder", "malignant neoplasm of ureter", "malignant neoplasm of testis",
    "seminoma", "non-seminomatous germ cell tumour", "penile carcinoma",
  ]),
  group("gynaecological", "Ovary, uterus, cervix, vulva", [
    "malignant neoplasm of ovary", "serous carcinoma of ovary", "high grade serous ovarian carcinoma",
    "malignant neoplasm of fallopian tube", "malignant neoplasm of uterus", "endometrial adenocarcinoma",
    "malignant neoplasm of cervix uteri", "squamous cell carcinoma of cervix", "malignant neoplasm of vulva",
    "gestational trophoblastic neoplasia", "secondary malignant neoplasm of ovary",
  ]),
  group("head_neck", "Head, neck and thyroid", [
    "malignant neoplasm of oral cavity", "malignant neoplasm of tongue", "malignant neoplasm of larynx",
    "malignant neoplasm of hypopharynx", "malignant neoplasm of nasopharynx", "malignant neoplasm of oropharynx",
    "malignant neoplasm of salivary gland", "malignant neoplasm of thyroid gland", "papillary thyroid carcinoma",
    "follicular thyroid carcinoma", "medullary thyroid carcinoma", "anaplastic thyroid carcinoma",
    "malignant neoplasm of parathyroid gland",
  ]),
  group("skin", "Skin, melanoma and soft tissue", [
    "malignant melanoma of skin", "nodular melanoma", "superficial spreading melanoma", "lentigo maligna melanoma",
    "acral melanoma", "basal cell carcinoma of skin", "squamous cell carcinoma of skin",
    "Merkel cell carcinoma", "dermatofibrosarcoma protuberans", "cutaneous T-cell lymphoma",
    "malignant neoplasm of skin", "secondary malignant neoplasm of skin",
  ]),
  group("cns", "Brain and central nervous system", [
    "malignant neoplasm of brain", "glioblastoma", "astrocytoma", "oligodendroglioma", "ependymoma",
    "medulloblastoma", "primary central nervous system lymphoma", "meningioma",
    "malignant neoplasm of spinal cord", "secondary malignant neoplasm of brain", "carcinomatous meningitis",
  ]),
  group("sarcoma", "Bone and soft-tissue sarcoma", [
    "osteosarcoma", "Ewing sarcoma", "chondrosarcoma", "malignant neoplasm of bone",
    "soft tissue sarcoma", "liposarcoma", "leiomyosarcoma", "rhabdomyosarcoma", "synovial sarcoma",
    "angiosarcoma", "retroperitoneal sarcoma", "secondary malignant neoplasm of bone",
  ]),
  group("haematological", "Haematological malignancies", [
    "acute myeloid leukaemia", "acute lymphoblastic leukaemia", "chronic myeloid leukaemia",
    "chronic lymphocytic leukaemia", "hairy cell leukaemia", "myelodysplastic syndrome",
    "myeloproliferative neoplasm", "Hodgkin lymphoma", "diffuse large B-cell lymphoma",
    "follicular lymphoma", "mantle cell lymphoma", "marginal zone lymphoma", "Burkitt lymphoma",
    "peripheral T-cell lymphoma", "anaplastic large cell lymphoma", "multiple myeloma",
    "plasma cell neoplasm", "amyloidosis", "Waldenstrom macroglobulinaemia",
  ]),
  group("secondary", "Secondary and metastatic disease", [
    "secondary malignant neoplasm of lymph node", "secondary malignant neoplasm of bone",
    "secondary malignant neoplasm of lung", "secondary malignant neoplasm of liver",
    "secondary malignant neoplasm of brain", "secondary malignant neoplasm of pleura",
    "malignant ascites", "metastatic malignant neoplasm", "carcinomatosis",
  ]),
  group("non_invasive", "In situ, benign and uncertain behaviour", [
    "carcinoma in situ", "ductal carcinoma in situ of breast", "carcinoma in situ of cervix uteri",
    "carcinoma in situ of colon", "benign neoplasm", "colorectal adenoma", "colonic polyp",
    "benign neoplasm of thyroid gland", "uterine leiomyoma", "lipoma", "meningioma of uncertain behaviour",
    "neoplasm of uncertain behaviour", "neoplasm of unknown behaviour", "monoclonal gammopathy of undetermined significance",
    "myelodysplastic syndrome of uncertain behaviour",
  ]),
  group("complications", "Cancer complications and presentations", [
    "febrile neutropenia", "malignant spinal cord compression", "superior vena cava obstruction",
    "hypercalcaemia of malignancy", "tumour lysis syndrome", "cancer related pain", "cancer cachexia",
    "malignant pericardial effusion", "haemoptysis", "pancytopenia due to chemotherapy",
    "chemotherapy induced nausea and vomiting", "peripheral neuropathy due to chemotherapy",
    "immune related adverse event", "radiation pneumonitis", "mucositis due to chemotherapy",
    "lymphoedema", "paraneoplastic syndrome", "cancer of unknown primary",
  ]),
];

export const ONC_ICD11_TERM_COUNT = ONC_ICD11_GROUPS.reduce((sum, g) => sum + g.terms.length, 0);

// Site groups used by the biopsy-free biomarker block and by the site workflows, so
// only tumour-relevant markers appear for the documented primary.
export const ONC_SITE_GROUPS = [
  { value: "Breast", label: "Breast" },
  { value: "Lung (NSCLC)", label: "Lung — non-small cell" },
  { value: "Lung (SCLC)", label: "Lung — small cell" },
  { value: "Colorectal", label: "Colorectal" },
  { value: "Upper GI / oesophagogastric", label: "Oesophagogastric" },
  { value: "Hepatobiliary / pancreatic", label: "Hepatobiliary / pancreatic" },
  { value: "Prostate", label: "Prostate" },
  { value: "Urothelial / renal", label: "Bladder / kidney" },
  { value: "Testicular", label: "Testis" },
  { value: "Ovarian", label: "Ovary" },
  { value: "Endometrial", label: "Endometrium" },
  { value: "Cervical", label: "Cervix" },
  { value: "Head and neck", label: "Head and neck" },
  { value: "Thyroid", label: "Thyroid" },
  { value: "Melanoma", label: "Melanoma" },
  { value: "Non-melanoma skin", label: "Non-melanoma skin" },
  { value: "CNS", label: "Brain / CNS" },
  { value: "Sarcoma", label: "Bone / soft tissue sarcoma" },
  { value: "Haematological", label: "Haematological" },
  { value: "Unknown primary", label: "Unknown primary" },
];