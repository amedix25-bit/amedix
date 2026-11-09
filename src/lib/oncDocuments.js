// Strengthening the EXISTING Oncology note types, plus the tumour-specific workflows.
//
// The twelve oncology templates already declared — Oncology Consultation, Cancer
// Treatment Plan, Oncology Follow-Up, Oncology Progress Note, Chemotherapy Treatment
// Record, Infusion Record, Radiation Treatment Record, Cancer Staging Record, Tumor
// Board Record, Oncology Discharge Summary, Treatment Summary and Follow-Up /
// Surveillance Record — are NOT recreated, renamed, replaced or reorganised. Their
// keys, labels, order and every existing field stay exactly as they are, so saved
// notes keep their meaning and every view, report and PDF that reads a note by key
// keeps working.
//
// This module only APPENDS: the shared ICD-11 MMS diagnosis field (with tumour
// behaviour, primary/secondary integrity and the ICD-O-3 registry fields held
// separately), the structured oncology blocks, the oncology instruments, the advisory
// safety review and the guideline basis. A key the note already declares is never
// added twice, and nothing already recorded is overwritten.
//
// It also adds the tumour-specific workflows that had no template of their own — each
// one gathering the assessment, histopathology, biomarkers, staging, treatment,
// toxicity, response and follow-up that tumour type actually needs — as new note types
// in the same catalogue, so they inherit the same signature, amendment, permission and
// audit behaviour as every other AMedix clinical document.

import {
  ONC_ICD_STATUSES, ONC_ICD_ROLES, ONC_ICD_DETAIL_FIELDS, ONC_ICD_CODING_NOTE,
  ONC_ICD_CLUSTER_NOTE, ONC_ICD_SEARCH_GUIDANCE, ONC_ICD11_GROUPS, ONC_ICD11_TERM_COUNT,
} from "@/lib/oncIcd11";

const T = (key, label, placeholder) => ({ key, label, type: "textarea", placeholder });
const S = (key, label, options) => ({ key, label, type: "select", options });
const I = (key, label, placeholder) => ({ key, label, type: "input", placeholder });
const N = (key, label) => ({ key, label, type: "number" });

const icd11Field = () => ({
  key: "onc_icd11_diagnoses",
  label: "Diagnoses (ICD-11 MMS)",
  type: "icd11_diagnoses",
  section: "Diagnosis (ICD-11 MMS)",
  catalog: [],
  searchPlaceholder:
    "Search the workspace ICD-11 dataset by cancer name, anatomical site, histology, synonym or code — or record the diagnosis with no code and flag it for coding review",
  catalogRelease: "workspace dataset",
  catalogNote: ONC_ICD_CODING_NOTE,
  statuses: ONC_ICD_STATUSES,
  roles: ONC_ICD_ROLES,
  extraFields: ONC_ICD_DETAIL_FIELDS,
  clusterEnabled: true,
  clusterNote: ONC_ICD_CLUSTER_NOTE,
  conditionGroups: ONC_ICD11_GROUPS,
  conditionIndexTitle: `Oncology condition index (${ONC_ICD11_TERM_COUNT} search terms across 15 tumour groups — resolved against the workspace ICD-11 dataset)`,
  conditionIndexHint: ONC_ICD_SEARCH_GUIDANCE,
  requireConfirmation: true,
  unspecifiedJustification: true,
});

const blockField = (key, label) => ({ key, label, type: "onc_modules" });

const scoresField = (scores) => ({
  key: "onc_scores",
  label: "Oncology instruments",
  type: "onc_scores",
  section: "Oncology instruments",
  scores,
});

const safetyField = () => ({
  key: "onc_safety",
  label: "Advisory safety review",
  type: "onc_safety",
  section: "Safety review",
});

const guidanceField = (noteKey) => ({
  key: "onc_guidance",
  label: "Guideline basis",
  type: "onc_guidance",
  section: "Guideline basis",
  noteKey,
});

// Vital signs as the platform's structured field: a vital is stored only when it was
// measured, and the safety review reads only these documented values.
const vitalsField = () => ({ key: "vitals", label: "Vital Signs", type: "vitals" });

const CORE_SCORES = ["onc_ecog", "onc_bsa", "bmi"];

// ------------------------------------------------------- enhancements (existing)
const ONC_ENHANCEMENTS = {
  onc_consultation: () => [
    blockField("onc_assessment", "Oncological assessment"),
    blockField("onc_histopathology", "Histopathology (synoptic)"),
    blockField("onc_biomarkers", "Molecular and biomarker results"),
    icd11Field(),
    scoresField([...CORE_SCORES, "egfr"]),
    safetyField(),
    guidanceField("onc_consultation"),
  ],
  onc_treatment_plan: () => [
    blockField("onc_assessment", "Oncological assessment"),
    blockField("onc_staging", "Staging (TNM and stage group)"),
    blockField("onc_biomarkers", "Molecular and biomarker results"),
    blockField("onc_treatment", "Cancer-directed treatment"),
    icd11Field(),
    scoresField([...CORE_SCORES, "egfr"]),
    safetyField(),
    guidanceField("onc_treatment_plan"),
  ],
  onc_followup: () => [
    blockField("onc_response", "Response assessment"),
    blockField("onc_ctcae", "Adverse events (CTCAE)"),
    blockField("onc_followup", "Survivorship and recurrence monitoring"),
    icd11Field(),
    scoresField([...CORE_SCORES, "onc_recist_sum", "egfr"]),
    safetyField(),
    guidanceField("onc_followup"),
  ],
  onc_progress_note: () => [
    vitalsField(),
    blockField("onc_ctcae", "Adverse events (CTCAE)"),
    blockField("onc_response", "Response assessment"),
    blockField("onc_treatment", "Cancer-directed treatment"),
    icd11Field(),
    scoresField(CORE_SCORES),
    safetyField(),
    guidanceField("onc_progress_note"),
  ],
  onc_chemo_record: () => [
    vitalsField(),
    blockField("onc_treatment", "Cancer-directed treatment"),
    blockField("onc_ctcae", "Adverse events (CTCAE)"),
    blockField("onc_response", "Response assessment"),
    icd11Field(),
    scoresField(["onc_bsa", "onc_ecog", "egfr"]),
    safetyField(),
    guidanceField("onc_chemo_record"),
  ],
  onc_infusion_record: () => [
    vitalsField(),
    blockField("onc_ctcae", "Adverse events (CTCAE)"),
    blockField("onc_treatment", "Cancer-directed treatment"),
    scoresField(["onc_bsa"]),
    safetyField(),
    guidanceField("onc_infusion_record"),
  ],
  onc_radiation_record: () => [
    blockField("onc_ctcae", "Adverse events (CTCAE)"),
    blockField("onc_treatment", "Cancer-directed treatment"),
    icd11Field(),
    scoresField(CORE_SCORES),
    safetyField(),
    guidanceField("onc_radiation_record"),
  ],
  onc_staging_record: () => [
    blockField("onc_histopathology", "Histopathology (synoptic)"),
    blockField("onc_staging", "Staging (TNM and stage group)"),
    blockField("onc_biomarkers", "Molecular and biomarker results"),
    icd11Field(),
    scoresField(CORE_SCORES),
    safetyField(),
    guidanceField("onc_staging_record"),
  ],
  onc_tumor_board_record: () => [
    blockField("onc_mdt", "Multidisciplinary team review"),
    blockField("onc_staging", "Staging (TNM and stage group)"),
    icd11Field(),
    scoresField(CORE_SCORES),
    guidanceField("onc_tumor_board_record"),
  ],
  onc_discharge_summary: () => [
    blockField("onc_ctcae", "Adverse events (CTCAE)"),
    blockField("onc_followup", "Survivorship and recurrence monitoring"),
    icd11Field(),
    scoresField(CORE_SCORES),
    safetyField(),
    guidanceField("onc_discharge_summary"),
  ],
  onc_treatment_summary: () => [
    blockField("onc_response", "Response assessment"),
    blockField("onc_ctcae", "Adverse events (CTCAE)"),
    blockField("onc_followup", "Survivorship and recurrence monitoring"),
    icd11Field(),
    scoresField(["onc_recist_sum", "onc_ecog"]),
    guidanceField("onc_treatment_summary"),
  ],
  onc_surveillance_record: () => [
    blockField("onc_followup", "Survivorship and recurrence monitoring"),
    blockField("onc_response", "Response assessment"),
    icd11Field(),
    scoresField(["onc_ecog", "onc_recist_sum"]),
    guidanceField("onc_surveillance_record"),
  ],
};

// A key is appended only when the note does not already declare it.
export const withOncologyStandards = (docs) =>
  docs.map((doc) => {
    const build = ONC_ENHANCEMENTS[doc.key];
    if (!build) return doc;
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = build().filter((f) => {
      if (existing.has(f.key)) return false;
      existing.add(f.key);
      return true;
    });
    if (!additions.length) return doc;
    return { ...doc, fields: [...(doc.fields || []), ...additions] };
  });

// ------------------------------------------------------------- tumour workflows
// Every tumour workflow gathers the same clinical spine — assessment, histopathology,
// biomarkers, staging, treatment, toxicity, response, follow-up — with the fields and
// markers that tumour type actually uses. No irrelevant test is put in front of the
// clinician: the biomarker block shows only the group the clinician selected.
const siteDoc = (key, label, narrative, extraScores) => ({
  key,
  label,
  specialty: "oncology",
  fields: [
    T(`${key}_presentation`, "Presenting problem for this tumour", narrative),
    blockField("onc_assessment", "Oncological assessment"),
    vitalsField(),
    blockField("onc_histopathology", "Histopathology (synoptic)"),
    blockField("onc_biomarkers", "Molecular and biomarker results"),
    blockField("onc_staging", "Staging (TNM and stage group)"),
    blockField("onc_treatment", "Cancer-directed treatment"),
    blockField("onc_ctcae", "Adverse events (CTCAE)"),
    blockField("onc_response", "Response assessment"),
    blockField("onc_followup", "Survivorship and recurrence monitoring"),
    blockField("onc_supportive", "Supportive, palliative and goals of care"),
    icd11Field(),
    scoresField([...CORE_SCORES, ...(extraScores || []), "egfr"]),
    safetyField(),
    guidanceField(key),
  ],
});

export const ONC_SITE_DOCS = [
  siteDoc(
    "onc_breast_cancer",
    "Breast Cancer Workflow",
    "Lump, skin or nipple change, duration; screening and previous breast history; menstrual and reproductive history; hormonal exposure; known BRCA or other germline variant; family history of breast, ovarian, prostate or pancreatic cancer.",
    ["onc_recist_sum"],
  ),
  siteDoc(
    "onc_lung_cancer",
    "Lung Cancer Workflow (NSCLC and SCLC)",
    "Cough, haemoptysis, breathlessness, chest pain, weight loss; smoking pack-years and quit date; occupational exposure; previous lung disease; documented histological type — non-small cell versus small cell, because the staging and treatment paths differ.",
    ["onc_recist_sum"],
  ),
  siteDoc(
    "onc_colorectal_cancer",
    "Colorectal Cancer Workflow",
    "Change in bowel habit, rectal bleeding, anaemia, weight loss, obstruction; screening history; inflammatory bowel disease; known polyposis or Lynch syndrome; family history; documented mismatch-repair status.",
    ["onc_recist_sum", "bmi"],
  ),
  siteDoc(
    "onc_upper_gi_cancer",
    "Oesophagogastric Cancer Workflow",
    "Dysphagia, odynophagia, early satiety, vomiting, weight loss, bleeding; reflux and Barrett history; alcohol and tobacco; nutritional intake documented.",
    ["onc_recist_sum", "bmi"],
  ),
  siteDoc(
    "onc_hepatobiliary_pancreatic",
    "Hepatobiliary and Pancreatic Cancer Workflow",
    "Jaundice, pruritus, abdominal pain, weight loss, new diabetes, cholangitis; hepatitis B or C, cirrhosis, alcohol, metabolic liver disease; documented liver function and synthetic function.",
    ["onc_recist_sum", "bmi", "child_pugh"],
  ),
  siteDoc(
    "onc_prostate_cancer",
    "Prostate Cancer Workflow",
    "Urinary symptoms, retention, bone pain, haematuria; PSA history with dates; documented Gleason score and ISUP grade group; previous prostate surgery or radiotherapy; family history.",
    ["onc_recist_sum"],
  ),
  siteDoc(
    "onc_urologic_cancer",
    "Urological Cancer Workflow (Bladder, Kidney, Testis)",
    "Haematuria, flank pain, mass, swellings, systemic symptoms; smoking; occupational exposure; for germ-cell tumours the documented tumour markers and fertility status.",
    ["onc_recist_sum", "egfr"],
  ),
  siteDoc(
    "onc_gynaecologic_cancer",
    "Gynaecological Cancer Workflow (Ovary, Endometrium, Cervix, Vulva)",
    "Bleeding pattern, postmenopausal bleeding, pelvic pain, bloating, discharge; screening and HPV history; parity; documented tumour markers; known germline variant; the staging system that applies to the site.",
    ["onc_recist_sum"],
  ),
  siteDoc(
    "onc_head_neck_cancer",
    "Head and Neck Cancer Workflow",
    "Site and subsite, hoarseness, dysphagia, otalgia, neck lump, trismus, bleeding; tobacco, betel and alcohol; HPV status documented where relevant; dental assessment before radiotherapy; speech and swallow function.",
    ["onc_recist_sum", "bmi"],
  ),
  siteDoc(
    "onc_thyroid_cancer",
    "Thyroid Cancer Workflow",
    "Nodule, neck lump, voice change, dysphagia; documented thyroid function, calcitonin and thyroglobulin with dates; previous thyroid surgery; family history of thyroid cancer or MEN.",
    ["onc_recist_sum"],
  ),
  siteDoc(
    "onc_melanoma_skin_cancer",
    "Melanoma and Skin Cancer Workflow",
    "Lesion site, size, change, bleeding, itch; documented Breslow thickness, ulceration, mitotic rate and margin; previous melanoma or other skin cancer; sun and tanning exposure; sentinel-node procedure documented.",
    ["onc_recist_sum"],
  ),
  siteDoc(
    "onc_cns_tumour",
    "Brain and CNS Tumour Workflow",
    "Headache, seizures, focal deficit, cognitive change, raised-pressure symptoms; documented neurological examination; WHO grade and molecular markers (IDH, 1p/19q, MGMT) as reported; steroid and antiepileptic treatment documented; response assessed with the criteria appropriate to CNS tumours.",
    [],
  ),
  siteDoc(
    "onc_sarcoma",
    "Bone and Soft-Tissue Sarcoma Workflow",
    "Mass site, size, depth, growth rate, pain; documented imaging-defined extent, histological subtype and grade; compartment and neurovascular involvement; previous radiotherapy to the site; planned resection margins.",
    ["onc_recist_sum"],
  ),
  siteDoc(
    "onc_haematological_malignancy",
    "Haematological Malignancy Workflow (Leukaemia, Lymphoma, Myeloma)",
    "Fatigue, infections, bleeding, lymphadenopathy, night sweats, bone pain; documented full blood count and film, cytogenetics and molecular studies as reported; the classification and staging system appropriate to the disease — solid-tumour TNM is never applied; transplant status documented.",
    [],
  ),
  siteDoc(
    "onc_unknown_primary_rare",
    "Cancer of Unknown Primary and Rare Malignancies",
    "Presenting metastatic site and the biopsy that documented it; documented immunohistochemistry panel and the primary-site search performed; tumours for which a recognised classification exists are recorded there rather than as unknown primary; outstanding assessment documented.",
    ["onc_recist_sum"],
  ),
];

// The templates this module contributes to the catalogue: the tumour workflows only.
// The twelve original templates keep their own declaration in the catalogue and are
// strengthened in place by withOncologyStandards.
export const ONC_WORKFLOW_DOCS = ONC_SITE_DOCS;