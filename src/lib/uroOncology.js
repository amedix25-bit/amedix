// Urology — oncological documentation structure.
//
// WHAT THIS MODULE DOES
//   It gives each urological tumour type the categories a clinician DOCUMENTS:
//   the T, N and M category as read from the pathology and imaging report, the
//   grade, the risk group the treating team documented, the tumour-board decision,
//   the treatment and its response, and the surveillance interval.
//
// WHAT THIS MODULE DELIBERATELY DOES NOT DO
//   * It does not DERIVE a stage group, a risk group, a nomogram or a prognosis.
//     Those depend on the edition of the classification and on tables that change
//     between editions; AMedix does not hold them and will not approximate them.
//     The clinician records the category and the group from the source in force.
//   * It does not add a code, a diagnosis or a recommendation.
//   * No category is pre-selected. A blank category is reported as NOT DOCUMENTED,
//     never as N0 / M0 / low risk.
//
// The category lists are the published AJCC/UICC categories for each tumour. The
// version in force at the institution must be stated in the note, because the
// categories differ between editions.

const T = (...codes) => ["Not documented", ...codes];
const N = (...codes) => ["Not documented", ...codes];
const M = (...codes) => ["Not documented", ...codes];

const MDT_MEMBERS = [
  "Urology",
  "Medical oncology",
  "Radiation oncology",
  "Radiology",
  "Histopathology",
  "Nursing / specialist nurse",
  "Palliative care",
  "Other",
];

const mdt = () => [
  { key: "mdt_date", label: "Tumour board date", type: "date" },
  { key: "mdt_members", label: "Members present", type: "multi", options: MDT_MEMBERS },
  { key: "mdt_imaging_reviewed", label: "Imaging reviewed (study and date)", type: "input" },
  { key: "mdt_histology_reviewed", label: "Histopathology reviewed (report and date)", type: "input" },
  {
    key: "mdt_decision",
    label: "Documented tumour-board decision",
    type: "select",
    options: [
      "Not documented",
      "Active surveillance",
      "Watchful waiting",
      "Further investigation before a decision",
      "Surgery",
      "Radiotherapy",
      "Systemic therapy",
      "Combined modality",
      "Palliative / symptom control",
      "No active treatment",
    ],
  },
  { key: "mdt_rationale", label: "Rationale recorded by the board", type: "textarea" },
  { key: "mdt_patient_preference", label: "Patient's documented preference", type: "textarea" },
  { key: "mdt_next_step", label: "Next step and owner", type: "input" },
];

const surveillance = (modalities) => [
  { key: "surveillance_modality", label: "Surveillance modality documented", type: "multi", options: modalities },
  { key: "surveillance_interval_months", label: "Documented interval (months)", type: "number", unit: "months", min: 0, max: 60 },
  { key: "next_surveillance_date", label: "Next surveillance date", type: "date" },
  { key: "surveillance_compliance", label: "Attendance / compliance documented", type: "select", options: ["Not documented", "Attended as planned", "Delayed", "Missed", "Lost to follow-up"] },
];

export const URO_CANCER_TYPES = {
  prostate: {
    key: "prostate",
    label: "Prostate cancer",
    reference: "eau_pca",
    tnm: {
      T: T("T1a", "T1b", "T1c", "T2a", "T2b", "T2c", "T3a", "T3b", "T4"),
      N: N("N0", "N1"),
      M: M("M0", "M1a", "M1b", "M1c"),
    },
    grade: ["Not documented", "ISUP grade group 1", "ISUP grade group 2", "ISUP grade group 3", "ISUP grade group 4", "ISUP grade group 5"],
    extra: [
      { key: "psa_at_diagnosis", label: "PSA at diagnosis (ng/mL)", type: "number", unit: "ng/mL", min: 0, max: 5000 },
      { key: "pirads", label: "PI-RADS score", type: "select", options: ["Not documented", "PI-RADS 1", "PI-RADS 2", "PI-RADS 3", "PI-RADS 4", "PI-RADS 5"] },
      { key: "cores_positive", label: "Biopsy cores positive / total", type: "input" },
      { key: "max_core_involvement_pct", label: "Maximum core involvement (%)", type: "number", unit: "%", min: 0, max: 100 },
      { key: "risk_group_documented", label: "Risk group documented by the team (from the EAU/NCCN table in force)", type: "select", options: ["Not documented", "Low risk", "Intermediate risk — favourable", "Intermediate risk — unfavourable", "High risk", "Locally advanced", "Metastatic"] },
    ],
    surveillance: surveillance(["PSA", "Digital rectal examination", "MRI prostate", "PSMA PET", "Bone imaging", "Clinical review"]),
  },
  bladder_nmibc: {
    key: "bladder_nmibc",
    label: "Bladder cancer — non-muscle-invasive",
    reference: "eau_nmibc",
    tnm: { T: T("Ta", "Tis", "T1"), N: N("N0", "N1", "N2", "N3"), M: M("M0", "M1a", "M1b") },
    grade: ["Not documented", "Low grade", "High grade", "Grade 1", "Grade 2", "Grade 3"],
    extra: [
      { key: "tumour_count", label: "Number of tumours", type: "select", options: ["Not documented", "Single", "2–7", "≥ 8"] },
      { key: "tumour_size", label: "Largest tumour size", type: "select", options: ["Not documented", "< 3 cm", "≥ 3 cm"] },
      { key: "prior_recurrence", label: "Prior recurrence", type: "select", options: ["Not documented", "Primary", "≤ 1 recurrence per year", "> 1 recurrence per year"] },
      { key: "concomitant_cis", label: "Concomitant carcinoma in situ", type: "select", options: ["Not documented", "Present", "Absent"] },
      { key: "detrusor_muscle_present", label: "Detrusor muscle in the specimen", type: "select", options: ["Not documented", "Present", "Absent"] },
      { key: "re_resection_planned", label: "Re-resection (second TURBT)", type: "select", options: ["Not documented", "Performed", "Planned", "Not indicated"] },
      { key: "risk_group_documented", label: "Risk group documented by the team (EAU table in force)", type: "select", options: ["Not documented", "Low risk", "Intermediate risk", "High risk", "Very high risk"] },
    ],
    surveillance: surveillance(["Cystoscopy", "Urine cytology", "Upper tract imaging", "CT urography", "Clinical review"]),
  },
  bladder_mibc: {
    key: "bladder_mibc",
    label: "Bladder cancer — muscle-invasive / metastatic",
    reference: "eau_mibc",
    tnm: { T: T("T2a", "T2b", "T3a", "T3b", "T4a", "T4b"), N: N("N0", "N1", "N2", "N3"), M: M("M0", "M1a", "M1b") },
    grade: ["Not documented", "Low grade", "High grade", "Grade 1", "Grade 2", "Grade 3"],
    extra: [
      { key: "neoadjuvant_chemotherapy", label: "Neoadjuvant chemotherapy documented", type: "select", options: ["Not documented", "Given", "Declined", "Not indicated", "Planned"] },
      { key: "cystectomy_performed", label: "Radical cystectomy", type: "select", options: ["Not documented", "Performed", "Planned", "Not indicated"] },
      { key: "urinary_diversion", label: "Urinary diversion documented", type: "select", options: ["Not documented", "Ileal conduit", "Orthotopic neobladder", "Continent cutaneous reservoir", "Ureterocutaneous stoma", "Other"] },
      { key: "variant_histology", label: "Variant histology documented", type: "input" },
    ],
    surveillance: surveillance(["CT thorax / abdomen / pelvis", "Clinical review", "Renal function", "Substitute / diversion review", "Bone imaging"]),
  },
  kidney: {
    key: "kidney",
    label: "Renal cell carcinoma",
    reference: "eau_rcc",
    tnm: { T: T("T1a", "T1b", "T2a", "T2b", "T3a", "T3b", "T3c", "T4"), N: N("N0", "N1"), M: M("M0", "M1") },
    grade: ["Not documented", "WHO/ISUP grade 1", "WHO/ISUP grade 2", "WHO/ISUP grade 3", "WHO/ISUP grade 4"],
    extra: [
      { key: "nephrometry_score", label: "Nephrometry score documented (e.g. RENAL / PADUA)", type: "input" },
      { key: "tumour_thrombus", label: "Venous tumour thrombus documented", type: "select", options: ["Not documented", "None", "Renal vein", "Infrahepatic IVC", "Suprahepatic IVC", "Above diaphragm"] },
      { key: "solitary_kidney", label: "Solitary or single functioning kidney", type: "select", options: ["Not documented", "Yes", "No"] },
      { key: "risk_group_documented", label: "Prognostic group documented by the team (from the model in force)", type: "select", options: ["Not documented", "Favourable", "Intermediate", "Poor"] },
    ],
    surveillance: surveillance(["CT thorax / abdomen", "Ultrasound", "MRI", "Renal function", "Clinical review", "Bone imaging"]),
  },
  utuc: {
    key: "utuc",
    label: "Upper tract urothelial carcinoma",
    reference: "eau_utuc",
    tnm: { T: T("Ta", "Tis", "T1", "T2", "T3", "T4"), N: N("N0", "N1", "N2", "N3"), M: M("M0", "M1") },
    grade: ["Not documented", "Low grade", "High grade"],
    extra: [
      { key: "tumour_location", label: "Tumour location documented", type: "select", options: ["Not documented", "Renal pelvis", "Proximal ureter", "Mid ureter", "Distal ureter", "Multiple sites"] },
      { key: "laterality", label: "Laterality", type: "select", options: ["Not documented", "Right", "Left", "Bilateral"] },
      { key: "cytology", label: "Urine cytology documented", type: "select", options: ["Not documented", "Positive", "Negative", "Atypical / suspicious", "Not performed"] },
      { key: "kidney_sparing", label: "Kidney-sparing approach documented", type: "select", options: ["Not documented", "Ureteroscopic ablation", "Segmental resection", "Not suitable", "Declined"] },
    ],
    surveillance: surveillance(["Cystoscopy", "CT urography", "Ureteroscopy", "Urine cytology", "Renal function"]),
  },
  testis: {
    key: "testis",
    label: "Testicular cancer",
    reference: "eau_testis",
    tnm: { T: T("pT0", "pTis", "pT1", "pT2", "pT3", "pT4"), N: N("N0", "N1", "N2", "N3"), M: M("M0", "M1a", "M1b") },
    grade: ["Not documented", "Seminoma", "Non-seminoma — low grade", "Non-seminoma — intermediate", "Non-seminoma — high grade"],
    extra: [
      { key: "afp", label: "AFP (ng/mL)", type: "number", unit: "ng/mL", min: 0, max: 1000000 },
      { key: "beta_hcg", label: "β-hCG (IU/L)", type: "number", unit: "IU/L", min: 0, max: 5000000 },
      { key: "ldh", label: "LDH (U/L)", type: "number", unit: "U/L", min: 0, max: 20000 },
      { key: "orchiectomy_performed", label: "Radical orchiectomy documented", type: "select", options: ["Not documented", "Performed", "Planned", "Declined"] },
      { key: "sperm_banking", label: "Sperm banking discussed", type: "select", options: ["Not documented", "Discussed and arranged", "Discussed — declined", "Not discussed"] },
      { key: "risk_group_documented", label: "Prognostic group documented by the team (IGCCCG in force)", type: "select", options: ["Not documented", "Good prognosis", "Intermediate prognosis", "Poor prognosis"] },
    ],
    surveillance: surveillance(["Tumour markers (AFP / β-hCG / LDH)", "CT abdomen / pelvis", "CT thorax", "Clinical review", "Contralateral testis examination"]),
  },
  penile: {
    key: "penile",
    label: "Penile cancer",
    reference: "eau_penile",
    tnm: { T: T("Tis", "Ta", "T1a", "T1b", "T2", "T3", "T4"), N: N("N0", "N1", "N2", "N3"), M: M("M0", "M1") },
    grade: ["Not documented", "Grade 1", "Grade 2", "Grade 3", "Sarcomatoid"],
    extra: [
      { key: "lesion_site", label: "Lesion site documented", type: "select", options: ["Not documented", "Glans", "Prepuce", "Shaft", "Coronal sulcus", "Multiple"] },
      { key: "lesion_size_mm", label: "Lesion size (mm)", type: "number", unit: "mm", min: 0, max: 300 },
      { key: "biopsy_performed", label: "Biopsy documented", type: "select", options: ["Not documented", "Performed", "Planned", "Not performed"] },
      { key: "node_assessment", label: "Inguinal node assessment documented", type: "select", options: ["Not documented", "Clinically negative", "Palpable — assessed", "Fine-needle aspiration performed", "Inguinal lymph node dissection performed"] },
    ],
    surveillance: surveillance(["Clinical review of the penis", "Inguinal node examination", "Imaging", "CT thorax / abdomen / pelvis"]),
  },
  urethral: {
    key: "urethral",
    label: "Primary urethral carcinoma",
    reference: "eau_urethral",
    tnm: { T: T("T1", "T2", "T3", "T4"), N: N("N0", "N1", "N2"), M: M("M0", "M1") },
    grade: ["Not documented", "Low grade", "High grade"],
    extra: [
      { key: "tumour_location", label: "Tumour location documented", type: "select", options: ["Not documented", "Anterior urethra", "Posterior urethra", "Whole urethra"] },
      { key: "histology_documented", label: "Histology documented", type: "select", options: ["Not documented", "Urothelial carcinoma", "Squamous cell carcinoma", "Adenocarcinoma", "Other"] },
    ],
    surveillance: surveillance(["Urethroscopy", "Imaging", "Clinical review", "Inguinal node examination"]),
  },
};

export const URO_CANCER_LIST = Object.values(URO_CANCER_TYPES);

export const uroCancer = (key) => URO_CANCER_TYPES[key] || null;

// The staging panel's fields for one tumour type, in documentation order. The
// tumour-board record and the surveillance record are appended by the field.
export const uroStagingFields = (cancerKey) => {
  const c = uroCancer(cancerKey);
  if (!c) return [];
  return [
    { key: "tnm_edition", label: "Classification edition documented in this note (e.g. AJCC 8th)", type: "input" },
    { key: "t_category", label: "T category as documented", type: "select", options: c.tnm.T },
    { key: "n_category", label: "N category as documented", type: "select", options: c.tnm.N },
    { key: "m_category", label: "M category as documented", type: "select", options: c.tnm.M },
    { key: "grade_documented", label: "Grade documented", type: "select", options: c.grade },
    ...c.extra,
    ...mdt(),
    ...c.surveillance,
    { key: "staging_note", label: "Staging note recorded by the clinician", type: "textarea" },
  ];
};

export const URO_STAGING_NOTICE =
  "AMedix records the categories you document and never derives a stage group, a risk group, a nomogram or a " +
  "prognosis. A category left blank is reported as NOT DOCUMENTED — never as N0, M0 or low risk.";

export const URO_MDT_NOTICE =
  "The tumour-board record is a record of what the board documented. It does not create a recommendation and does " +
  "not replace the multidisciplinary meeting.";