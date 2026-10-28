// Guideline basis for the existing Endocrinology note types.
//
// Every entry below was checked against the organisation's own website or its
// journal record on the review date recorded here — nothing in this file is a
// citation from memory. Each reference records what it supports in AMedix and how
// strongly it binds the documentation:
//
//   documentation_standard — the documentation elements AMedix expects for that
//     note to stand as a complete record. It describes what must be documented,
//     never what the clinical decision must be.
//   clinical_recommendation — society guidance: recommended practice, not a
//     mandate, and always subject to the treating clinician's judgement.
//   classification_standard — coding / classification only. ICD-11 codes
//     diagnoses; it is never used as treatment guidance.
//
// Guideline editions are recorded exactly as published. A re-issued or
// superseded edition is flagged in ENDOCRINE_REFERENCE_FLAGS rather than
// silently replaced, and no claim of "current" is made beyond the review date.
//
// Items that could not be verified in this build, are paywalled, or need a local
// policy decision are listed in ENDOCRINE_REFERENCE_FLAGS and surfaced rather
// than quietly omitted.

export const ENDOCRINE_REFERENCES_REVIEWED = "2026-10-28";

export const ENDOCRINE_REFERENCE_LEVELS = {
  documentation_standard: "Documentation standard",
  clinical_recommendation: "Clinical recommendation",
  classification_standard: "Classification / coding",
};

export const ENDOCRINE_REFERENCES = [
  {
    id: "who_icd11_mms_2025_01",
    organization: "World Health Organization",
    short: "WHO",
    title: "ICD-11 for Mortality and Morbidity Statistics (MMS), Chapter 05 — Endocrine, nutritional or metabolic diseases",
    version: "Release 2025-01",
    url: "https://icd.who.int/browse/2025-01/mms/en",
    level: "classification_standard",
    supports:
      "Diagnosis classification and code selection in every Endocrinology note. Codes and display terms in src/lib/endocrineIcd11.js are extracted from the WHO Simple Tabulation of this release; acute diabetes complications are carried as non-primary entries and are documented together with the diabetes type.",
    status: "verified_on_official_site",
  },
  {
    id: "ada_standards_2026",
    organization: "American Diabetes Association",
    short: "ADA",
    title: "Standards of Care in Diabetes—2026",
    version: "Diabetes Care 2026;49(Suppl. 1)",
    url: "https://diabetesjournals.org/care/issue/49/Supplement_1",
    level: "clinical_recommendation",
    supports:
      "Diabetes Follow-Up, Endocrine Care Plan, Medication Adjustment Record and Discharge Summary — the documentation of glycaemic metrics (HbA1c, time in range, time below range, glucose management indicator), the individualised HbA1c target, hypoglycaemia level (Level 1 < 3.9 mmol/L, Level 2 < 3.0 mmol/L, Level 3 severe), cardiovascular and kidney risk assessment, complication screening (retinopathy, foot, neuropathy), and vaccination status. The app records what was measured and decided; it never computes a treatment dose.",
    status: "verified_on_official_site",
  },
  {
    id: "ata_hypothyroidism_2014",
    organization: "American Thyroid Association",
    short: "ATA",
    title: "Guidelines for the Treatment of Hypothyroidism",
    version: "Thyroid 2014;24(12):1670–1751",
    doi: "10.1089/thy.2014.0028",
    url: "https://www.thyroid.org/professionals/ata-professional-guidelines/",
    level: "clinical_recommendation",
    supports:
      "Thyroid Follow-Up and Medication Adjustment Record — documented thyroid status, the replacement dose and its basis, dosing advice, and repeat thyroid function testing after a dose change. Levothyroxine remains the standard of care in the guideline; AMedix never recommends a preparation or a dose.",
    status: "verified_on_official_site",
  },
  {
    id: "ata_thyrotoxicosis_2016",
    organization: "American Thyroid Association",
    short: "ATA",
    title: "Guidelines for Diagnosis and Management of Hyperthyroidism and Other Causes of Thyrotoxicosis",
    version: "Thyroid 2016;26(10), first page 1343 (a corrigendum has since been published)",
    doi: "10.1089/thy.2016.0229",
    url: "https://www.thyroid.org/professionals/ata-professional-guidelines/",
    level: "clinical_recommendation",
    supports:
      "Thyroid Follow-Up, Endocrine Consultation and Discharge Summary — distinguishing thyrotoxicosis from hyperthyroidism, documenting the aetiology and the treatment decision (antithyroid drug, radioiodine, surgery, observation), and the same-day review expected when thyrotoxicosis is newly documented. Thyroid crisis (5A02.5) is recorded as a classification code only; the emergency pathway is not prescribed by the app.",
    status: "verified_on_official_site",
  },
  {
    id: "ata_thyroid_nodules_2015",
    organization: "American Thyroid Association",
    short: "ATA",
    title: "Management Guidelines for Adult Patients with Thyroid Nodules and Differentiated Thyroid Cancer",
    version: "Thyroid 2016;26(1):1–133",
    doi: "10.1089/thy.2015.0020",
    url: "https://www.thyroid.org/professionals/ata-professional-guidelines/",
    level: "clinical_recommendation",
    supports:
      "Thyroid Follow-Up — structured nodule documentation: sonographic risk category, nodule size, growth since the previous examination and cytology category, so the record shows on what basis a nodule was or was not sampled. No risk category is assigned by the app.",
    status: "verified_on_official_site",
  },
  {
    id: "ata_pregnancy_2017",
    organization: "American Thyroid Association",
    short: "ATA",
    title: "Guidelines for the Diagnosis and Management of Thyroid Disease During Pregnancy and the Postpartum",
    version: "Thyroid 2017;27(3):315–389",
    doi: "10.1089/thy.2016.0457",
    url: "https://www.thyroid.org/association-guidelines-management/",
    level: "clinical_recommendation",
    supports:
      "Thyroid Follow-Up — documenting pregnancy or postpartum status alongside thyroid status, because the interpretation of thyroid function tests and the management threshold differ in pregnancy. The app records the status; it does not apply a pregnancy-specific dose rule.",
    status: "verified_on_official_site",
  },
  {
    id: "es_adrenal_insufficiency_2016",
    organization: "Endocrine Society",
    short: "ES",
    title: "Diagnosis and Treatment of Primary Adrenal Insufficiency",
    version: "J Clin Endocrinol Metab 2016;101(2):364–389",
    url: "https://www.endocrine.org/clinical-practice-guidelines/primary-adrenal-insufficiency",
    level: "clinical_recommendation",
    supports:
      "Endocrine Consultation, Endocrine Care Plan, Medication Adjustment Record and Discharge Summary — documenting glucocorticoid and mineralocorticoid replacement, the annual review of over- and under-replacement, and the sick-day / stress-dose instructions that a patient on replacement therapy must carry. Adrenal crisis (5A74.1) is recorded as a classification and safety prompt; the emergency regimen itself is not prescribed by the app.",
    status: "verified_on_official_site",
  },
  {
    id: "es_cushing_2015",
    organization: "Endocrine Society",
    short: "ES",
    title: "Treatment of Cushing's Syndrome",
    version: "J Clin Endocrinol Metab 2015;100(8):2807–2837",
    doi: "10.1210/jc.2015-1818",
    url: "https://www.endocrine.org/clinical-practice-guidelines/treatment-of-cushing-syndrome",
    level: "clinical_recommendation",
    supports:
      "Endocrine Consultation and Endocrine Follow-Up — documenting the confirmed diagnosis before treatment, the cause-directed plan, and the post-operative assessment of cortisol status. The app records the clinician's documented diagnosis; it never treats a raised cortisol result as Cushing syndrome.",
    status: "verified_on_official_site",
  },
  {
    id: "es_hypopituitarism_2016",
    organization: "Endocrine Society",
    short: "ES",
    title: "Hormonal Replacement in Hypopituitarism in Adults",
    version: "J Clin Endocrinol Metab 2016;101(11):3888–3931",
    doi: "10.1210/jc.2016-2118",
    url: "https://www.endocrine.org/clinical-practice-guidelines/hormone-replacement-in-hypopituitarism",
    level: "clinical_recommendation",
    supports:
      "Endocrine Consultation, Endocrine Care Plan and Medication Adjustment Record — documenting which pituitary axes are deficient and replaced, with glucocorticoid replacement first where several axes are affected, and the monitoring attached to each replacement.",
    status: "verified_on_official_site",
  },
  {
    id: "es_acromegaly_2014",
    organization: "Endocrine Society",
    short: "ES",
    title: "Acromegaly",
    version: "J Clin Endocrinol Metab 2014;99(11):3933–3951",
    url: "https://academic.oup.com/jcem/article/99/11/3933/2836347",
    level: "clinical_recommendation",
    supports:
      "Endocrine Consultation and Endocrine Follow-Up — documenting the biochemical assessment, the cause-directed treatment decision and the follow-up of comorbidities in acromegaly. The guideline's biochemical thresholds are not applied by the app; the clinician documents the interpretation.",
    status: "verified_on_official_site",
  },
  {
    id: "aace_t2d_2023",
    organization: "American Association of Clinical Endocrinology",
    short: "AACE",
    title: "Comprehensive Type 2 Diabetes Management Algorithm",
    version: "Endocr Pract 2023",
    url: "https://www.endocrinepractice.org/article/S1530-891X(23)00034-4/fulltext",
    level: "clinical_recommendation",
    supports:
      "Diabetes Follow-Up and Medication Adjustment Record — documenting the current therapy category, the reason a glucose-lowering agent was chosen or changed, and the comorbidity-driven considerations (ASCVD, heart failure, kidney disease) that the algorithm groups. The app records the choice; it does not select an agent.",
    status: "verified_on_official_site",
  },
  {
    id: "ese_adrenal_incidentaloma_2023",
    organization: "European Society of Endocrinology (with ENSAT)",
    short: "ESE",
    title: "Clinical Practice Guideline on the Management of Adrenal Incidentalomas",
    version: "Eur J Endocrinol 2023;189(1), first page G1",
    url: "https://www.ese-hormones.org/publications/directory/ese-clinical-practice-guideline-on-the-management-of-adrenal-incidentalomas-in-collaboration-with-the-european-network-for-the-study-of-adrenal-tumors/",
    level: "clinical_recommendation",
    supports:
      "Endocrine Consultation and Endocrine Follow-Up — documenting that an adrenal mass found incidentally is assessed for hormonal activity and imaging characteristics before any label is applied, and that the assessment decision is recorded.",
    status: "verified_on_official_site",
  },
  {
    id: "kdigo_diabetes_ckd_2022",
    organization: "Kidney Disease: Improving Global Outcomes",
    short: "KDIGO",
    title: "Clinical Practice Guideline for Diabetes Management in Chronic Kidney Disease",
    version: "2022 (Kidney Int Suppl)",
    url: "https://kdigo.org/wp-content/uploads/2022/10/KDIGO-2022-Clinical-Practice-Guideline-for-Diabetes-Management-in-CKD.pdf",
    level: "clinical_recommendation",
    supports:
      "Diabetes Follow-Up and Endocrine Care Plan — documenting kidney measures (eGFR, urine albumin-to-creatinine ratio), the CKD stage used for medication review, and the monitoring interval. The app does not compute a dose adjustment from eGFR.",
    status: "verified_on_official_site",
  },
];

// Read by the app so a limitation is visible in the record, not hidden in a file.
export const ENDOCRINE_REFERENCE_FLAGS = [
  {
    id: "not_verified_this_build",
    issue:
      "These were NOT included because they were not verified in this build: Endocrine Society testosterone therapy in men with hypogonadism; Endocrine Society pharmacological management of obesity; an Endocrine Society or ESE primary hyperparathyroidism guideline; a dedicated severe hypercalcaemia or hyponatraemia correction protocol; ATA anaplastic / medullary thyroid cancer guidance. A clinician can record the source of any guidance they follow in the note itself.",
  },
  {
    id: "editions_move",
    issue:
      "ADA Standards of Care are re-issued annually and ATA/Endocrine Society documents are periodically updated. The versions above are those verified on 2026-10-28; a later edition may already exist and is not claimed here.",
  },
  {
    id: "corrigendum",
    issue:
      "A corrigendum to the 2016 ATA thyrotoxicosis guideline has been published. The app cites the guideline edition, not the corrected wording of any individual recommendation.",
  },
  {
    id: "local_thresholds",
    issue:
      "No guideline in this register defines a numeric emergency threshold for sodium, potassium or calcium that AMedix may apply automatically. The electrolyte safety prompts therefore use thresholds explicitly marked as AMedix local triage decisions requiring Endocrinology sign-off, and the ADA glucose thresholds are cited to the ADA Standard they come from.",
  },
  {
    id: "no_dose_calculation",
    issue:
      "AMedix does not calculate an insulin dose, a levothyroxine dose, a steroid stress dose or any titration. Weight and weight-based dose fields exist so the clinician can record the calculation they made, with its basis.",
  },
  {
    id: "insulin_never_auto",
    issue:
      "Insulin is never suggested, defaulted or auto-populated. Sliding-scale or correction-dose content is out of scope for this build.",
  },
];

export const getEndocrineReference = (id) =>
  ENDOCRINE_REFERENCES.find((r) => r.id === id) || null;