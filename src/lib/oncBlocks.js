// Oncology — structured clinical blocks.
//
// One registry for the whole specialty, so the note form, the saved record and the
// printed note read the same definitions. Every item is optional and nothing is
// pre-selected: a blank is "not documented", never a normal finding, never a negative,
// and never an inferred stage.
//
// Nothing here diagnoses, stages, or treats. A block records what the clinician
// documented. No stage group is calculated, no dose is calculated, and no biomarker
// result is derived — only what was measured and written down.

import { asObject, str } from "@/lib/fmFieldKit";
import { ONC_TUMOUR_BEHAVIOURS, ONC_SITE_GROUPS } from "@/lib/oncIcd11";

const YN = ["Yes", "No", "Not documented"];
const YNNA = ["Yes", "No", "Not applicable", "Not documented"];
const GRADES = ["Not assessed", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Not documented"];

const ECOG = [
  "0 — Fully active",
  "1 — Restricted in strenuous activity",
  "2 — Ambulatory, unable to work",
  "3 — Limited self-care, bed/chair >50% of day",
  "4 — Completely disabled",
  "Not documented",
];

const LATERALITY = ["Right", "Left", "Bilateral", "Midline", "Not applicable", "Not documented"];

// ------------------------------------------------------------- 1. Assessment
export const ONC_ASSESSMENT_BLOCK = {
  key: "onc_assessment",
  title: "Oncological assessment",
  note: "What the patient reported and what was measured at this encounter. A symptom not asked about is not the same as a symptom absent, and no performance score is pre-selected.",
  fields: [
    { key: "review_reason", label: "Reason for this oncology review", type: "input", placeholder: "e.g. newly diagnosed breast mass, cycle review, suspected recurrence" },
    { key: "source_of_referral", label: "Source of referral and date", type: "input", placeholder: "Specialty, hospital, date of referral" },
    { key: "disease_status", label: "Disease status at this visit", type: "select", options: ["Newly diagnosed — assessment in progress", "On active treatment", "Between treatment lines", "Surveillance", "Suspected recurrence", "Documented progression", "Remission", "Palliative", "Not documented"] },
    { key: "presenting_complaint", label: "Presenting complaint, in the patient's words", type: "text" },
    { key: "symptom_duration", label: "Symptom duration", type: "input", placeholder: "e.g. 6 weeks" },
    { key: "symptom_progression", label: "Progression since onset", type: "select", options: ["Improving", "Stable", "Worsening", "Fluctuating", "Not documented"] },
    {
      key: "symptoms_reported",
      label: "Symptoms reported",
      type: "multi",
      options: [
        "Unintentional weight loss", "Fatigue", "Fever", "Drenching night sweats", "Pain",
        "Bleeding", "Cough", "Haemoptysis", "Breathlessness", "Dysphagia",
        "Change in bowel habit", "Rectal bleeding", "Urinary symptoms", "Haematuria",
        "Lump or mass", "Change in a mole or skin lesion", "Headache", "New neurological deficit",
        "Back pain", "Facial swelling / plethora", "Lymph node swelling", "None reported",
      ],
    },
    { key: "weight_loss_kg", label: "Weight lost", type: "number", unit: "kg" },
    { key: "weight_loss_percent", label: "Weight lost as % of usual body weight", type: "number", unit: "%" },
    { key: "pain_site", label: "Pain — site and character", type: "input" },
    { key: "pain_score", label: "Pain score now (0–10, as reported)", type: "number", min: 0, max: 10 },
    { key: "bleeding_details", label: "Bleeding — site and amount", type: "input", placeholder: "Only if bleeding was reported" },
    { key: "prior_cancer", label: "Previous cancer diagnosis", type: "select", options: YN },
    { key: "prior_cancer_details", label: "Previous cancer — type, date, treatment received", type: "text" },
    { key: "recurrence_documented", label: "Recurrence of a known cancer documented", type: "select", options: YN },
    { key: "known_metastatic_sites", label: "Known metastatic sites", type: "text", placeholder: "Site and how each was documented; a deposit is never recorded as a new primary" },
    { key: "previous_treatment_modalities", label: "Previous cancer-directed treatment", type: "multi", options: ["Surgery", "Chemotherapy", "Radiotherapy", "Immunotherapy", "Targeted therapy", "Endocrine therapy", "Stem-cell transplant", "None", "Not documented"] },
    { key: "previous_treatment_details", label: "Previous treatment — regimens, dates, response", type: "text" },
    { key: "family_history_of_cancer", label: "Family history of cancer", type: "select", options: YN },
    { key: "family_history_details", label: "Family history — cancer, relative, age at diagnosis", type: "text" },
    { key: "hereditary_syndrome_known", label: "Known hereditary cancer syndrome", type: "select", options: YN },
    { key: "hereditary_syndrome_name", label: "Syndrome documented", type: "input", placeholder: "e.g. BRCA1 pathogenic variant, Lynch syndrome" },
    { key: "genetic_counselling_documented", label: "Genetic counselling documented", type: "select", options: YNNA },
    { key: "comorbidities", label: "Comorbidities relevant to treatment", type: "text" },
    { key: "hbv_status", label: "Hepatitis B status documented", type: "select", options: ["Positive — surface antigen", "Positive — core antibody only", "Negative", "Not tested", "Not documented"] },
    { key: "organ_function_notes", label: "Organ function relevant to treatment", type: "input", placeholder: "e.g. known CKD stage, LVEF, hepatic impairment — as documented" },
    { key: "reproductive_age", label: "Reproductive age / pregnancy potential", type: "select", options: ["Yes", "No", "Pregnant", "Not applicable", "Not documented"] },
    { key: "fertility_preservation_discussed", label: "Fertility preservation discussed", type: "select", options: YNNA },
    { key: "ecog", label: "ECOG performance status", type: "select", options: ECOG },
    { key: "performance_change", label: "Performance status change since last review", type: "select", options: ["Improved", "Unchanged", "Declined", "First assessment", "Not documented"] },
    { key: "weight_kg", label: "Weight", type: "number", unit: "kg" },
    { key: "height_cm", label: "Height", type: "number", unit: "cm" },
    { key: "nutrition_screen", label: "Nutrition screen", type: "select", options: ["Low risk", "Moderate risk", "High risk — dietitian involved", "Not screened"] },
    { key: "exam_findings", label: "Examination findings", type: "text", placeholder: "Only the systems examined; state what was examined" },
    { key: "mass_or_node_details", label: "Palpable mass / lymphadenopathy documented", type: "input", placeholder: "Site, size, consistency, mobility" },
    { key: "mdt_review_done", label: "Multidisciplinary review completed for this decision", type: "select", options: YNNA },
    { key: "assessment_summary", label: "Assessment summary recorded by the clinician", type: "text" },
    { key: "outstanding_items", label: "Outstanding items before a decision", type: "text", placeholder: "Pending histopathology, molecular result, staging assessment" },
  ],
};

// --------------------------------------------------------- 2. Histopathology
export const ONC_HISTOPATHOLOGY_BLOCK = {
  key: "onc_histopathology",
  title: "Histopathology (synoptic)",
  note: "The pathology findings as reported — biopsy and resection. A blank element is not a negative finding; report what the pathologist documented.",
  fields: [
    { key: "specimen_date", label: "Specimen date", type: "input", placeholder: "Date the specimen was taken" },
    { key: "specimen_type", label: "Specimen type / procedure", type: "input", placeholder: "e.g. core biopsy, excision, resection, cytology" },
    { key: "specimen_site", label: "Specimen anatomical site", type: "input" },
    { key: "laterality", label: "Laterality", type: "select", options: LATERALITY },
    { key: "anatomical_origin", label: "Anatomical origin documented by the pathologist", type: "input" },
    { key: "histological_diagnosis", label: "Histological diagnosis", type: "input", placeholder: "As worded in the pathology report" },
    { key: "histological_subtype", label: "Histological subtype / variant", type: "input" },
    { key: "behaviour_documented", label: "Behaviour documented by the pathologist", type: "select", options: ONC_TUMOUR_BEHAVIOURS },
    { key: "grade_system", label: "Grading system used", type: "input", placeholder: "e.g. Nottingham, WHO CNS grading, ISUP, Fuhrman" },
    { key: "grade", label: "Grade as reported", type: "input", placeholder: "e.g. 2 / grade II / intermediate" },
    { key: "tumour_size_mm", label: "Tumour size (largest dimension)", type: "number", unit: "mm" },
    { key: "invasion_depth", label: "Depth of invasion / extent", type: "input", placeholder: "e.g. into muscularis propria, 4 mm beyond basement membrane" },
    { key: "lymphovascular_invasion", label: "Lymphovascular invasion", type: "select", options: ["Present", "Absent", "Indeterminate", "Not reported"] },
    { key: "perineural_invasion", label: "Perineural invasion", type: "select", options: ["Present", "Absent", "Indeterminate", "Not reported"] },
    { key: "margins_status", label: "Surgical margin status", type: "select", options: ["Clear", "Close", "Involved", "Not applicable — biopsy only", "Not reported"] },
    { key: "closest_margin_mm", label: "Closest margin", type: "number", unit: "mm" },
    { key: "nodes_examined", label: "Lymph nodes examined", type: "number" },
    { key: "nodes_positive", label: "Lymph nodes involved", type: "number" },
    { key: "extranodal_extension", label: "Extranodal extension", type: "select", options: ["Present", "Absent", "Not reported", "Not applicable"] },
    { key: "ihc_summary", label: "Immunohistochemistry reported", type: "text", placeholder: "Markers and results as reported — no interpretation added" },
    { key: "other_findings", label: "Other reported findings", type: "text", placeholder: "e.g. necrosis, lymphocytic infiltrate, associated lesion" },
    { key: "synoptic_protocol", label: "Synoptic reporting standard applied", type: "input", placeholder: "e.g. CAP cancer protocol — specimen type and version as stated in the report" },
    { key: "reporting_pathologist", label: "Reporting pathologist", type: "input" },
    { key: "report_reference", label: "Report reference / accession", type: "input" },
    { key: "report_uploaded", label: "Pathology report uploaded to the patient record", type: "select", options: YNNA },
  ],
};

// --------------------------------------------- 3. Molecular and biomarkers
export const ONC_BIOMARKERS_BLOCK = {
  key: "onc_biomarkers",
  title: "Molecular and biomarker results",
  note: "Only the tests done for this tumour appear below — select the primary site group first. A test that was not performed stays blank; it is never recorded as negative.",
  fields: [
    { key: "site_group", label: "Primary site group", type: "select", options: ONC_SITE_GROUPS.map((s) => s.value) },
    { key: "tumour_tissue_available", label: "Tumour tissue available for testing", type: "select", options: ["Yes — archival", "Yes — new biopsy", "No", "Not documented"] },
    { key: "specimen_used", label: "Specimen used for molecular testing", type: "input", placeholder: "Block / slide reference, date, site" },
    { key: "tests_performed", label: "Tests performed", type: "multi", options: ["ER", "PR", "HER2 (IHC)", "HER2 (ISH)", "Ki-67", "PD-L1", "MSI / MMR", "TMB", "EGFR", "ALK", "ROS1", "BRAF", "KRAS", "NRAS", "BRCA1/2", "NTRK", "RET", "MET", "Other"] },
    { key: "test_date", label: "Test date", type: "input" },
    { key: "laboratory_source", label: "Where the result was produced", type: "select", options: ["AMedix Laboratory Portal", "External laboratory", "Both", "Not documented"] },
    { key: "er", label: "ER result", type: "input", placeholder: "e.g. positive 90%, Allred 8", showIf: { key: "site_group", equals: "Breast" } },
    { key: "pr", label: "PR result", type: "input", placeholder: "e.g. positive 60%, Allred 7", showIf: { key: "site_group", equals: "Breast" } },
    { key: "her2", label: "HER2 result", type: "input", placeholder: "e.g. IHC 3+, or IHC 2+ with ISH amplified", showIf: { key: "site_group", equals: "Breast" } },
    { key: "ki67", label: "Ki-67", type: "input", placeholder: "Percentage as reported", showIf: { key: "site_group", equals: "Breast" } },
    { key: "egfr_mutation", label: "EGFR result", type: "input", placeholder: "Exon/variant as reported", showIf: { key: "site_group", in: ["Lung (NSCLC)"] } },
    { key: "alk", label: "ALK result", type: "input", showIf: { key: "site_group", in: ["Lung (NSCLC)"] } },
    { key: "ros1", label: "ROS1 result", type: "input", showIf: { key: "site_group", in: ["Lung (NSCLC)"] } },
    { key: "pdl1_lung", label: "PD-L1 result (TPS as reported)", type: "input", showIf: { key: "site_group", in: ["Lung (NSCLC)"] } },
    { key: "kras", label: "KRAS result", type: "input", showIf: { key: "site_group", in: ["Colorectal", "Lung (NSCLC)"] } },
    { key: "nras", label: "NRAS result", type: "input", showIf: { key: "site_group", in: ["Colorectal"] } },
    { key: "braf", label: "BRAF result", type: "input", showIf: { key: "site_group", in: ["Colorectal", "Melanoma"] } },
    { key: "msi_mmr", label: "MSI / MMR result", type: "input", placeholder: "e.g. MSI-high, dMMR, MSS", showIf: { key: "site_group", in: ["Colorectal", "Endometrial", "Upper GI / oesophagogastric"] } },
    { key: "her2_gi", label: "HER2 result", type: "input", showIf: { key: "site_group", in: ["Upper GI / oesophagogastric", "Colorectal"] } },
    { key: "brca", label: "BRCA1/2 result (germline or somatic as stated)", type: "input", showIf: { key: "site_group", in: ["Breast", "Ovarian", "Prostate", "Hepatobiliary / pancreatic"] } },
    { key: "pdl1_other", label: "PD-L1 result (CPS / TPS as reported)", type: "input", showIf: { key: "site_group", in: ["Upper GI / oesophagogastric", "Head and neck", "Urothelial / renal", "Cervical"] } },
    { key: "tmb", label: "Tumour mutational burden", type: "input", placeholder: "Value and units as reported" },
    { key: "ntrk", label: "NTRK result", type: "input" },
    { key: "ret", label: "RET result", type: "input", showIf: { key: "site_group", in: ["Thyroid", "Lung (NSCLC)"] } },
    { key: "met", label: "MET result", type: "input", showIf: { key: "site_group", in: ["Lung (NSCLC)"] } },
    { key: "other_marker", label: "Other marker — name and result", type: "input" },
    { key: "results_summary", label: "Results summary as reported", type: "text" },
    { key: "pending_tests", label: "Tests still pending", type: "text", placeholder: "Test, specimen, expected date" },
    { key: "germline_testing", label: "Germline testing", type: "select", options: ["Performed", "Offered — awaiting", "Declined", "Not indicated", "Not documented"] },
    { key: "actionable_documented", label: "Clinician recorded a treatment implication", type: "select", options: YNNA },
  ],
};

// ------------------------------------------------------------- 4. Staging
export const ONC_STAGING_BLOCK = {
  key: "onc_staging",
  title: "Staging",
  note: "TNM categories and the stage group are recorded as the treating clinician assigns them. AMedix never calculates a stage, never fills a missing category, and never stages a haematological malignancy with solid-tumour rules.",
  fields: [
    { key: "staging_system", label: "Staging system", type: "select", options: ["AJCC / UICC TNM", "Ann Arbor (lymphoma)", "FIGO (gynaecological)", "ISS / R-ISS (myeloma)", "Rai (CLL)", "Binet (CLL)", "IPSS-R (MDS)", "Other", "Not applicable to this tumour", "Not documented"] },
    { key: "staging_edition", label: "Edition used", type: "input", placeholder: "e.g. AJCC 8th edition, Ann Arbor, FIGO 2018" },
    { key: "assessment_date", label: "Staging assessment date", type: "input" },
    { key: "staging_basis", label: "Basis of the stage", type: "select", options: ["Clinical (pre-treatment)", "Pathological (after surgery)", "Post-neoadjuvant (yp)", "Restaging after treatment", "At recurrence", "Not documented"] },
    { key: "ct", label: "Clinical T", type: "input" },
    { key: "cn", label: "Clinical N", type: "input" },
    { key: "cm", label: "Clinical M", type: "input" },
    { key: "clinical_stage_group", label: "Clinical stage group", type: "input", placeholder: "Only as assigned by the clinician — not calculated" },
    { key: "pt", label: "Pathological T", type: "input" },
    { key: "pn", label: "Pathological N", type: "input" },
    { key: "pm", label: "Pathological M", type: "input" },
    { key: "pathological_stage_group", label: "Pathological stage group", type: "input" },
    { key: "yp_t", label: "Post-neoadjuvant ypT", type: "input" },
    { key: "yp_n", label: "Post-neoadjuvant ypN", type: "input" },
    { key: "yp_m", label: "Post-neoadjuvant ypM", type: "input" },
    { key: "yp_stage_group", label: "Post-neoadjuvant stage group", type: "input" },
    { key: "grade_for_stage", label: "Grade or risk group used in staging", type: "input", placeholder: "Where the system incorporates grade or a risk score" },
    { key: "metastatic_status", label: "Metastatic status", type: "select", options: ["M0 — no distant metastasis documented", "M1 — distant metastasis documented", "Unknown / not fully assessed", "Not applicable"] },
    { key: "metastatic_sites", label: "Distant sites documented", type: "text", placeholder: "Site and the result that documented it" },
    { key: "incomplete_information", label: "Information missing that would change the stage", type: "text", placeholder: "A stage is never assigned while these are outstanding" },
    { key: "stage_confirmation", label: "Stage status", type: "select", options: ["Confirmed by the treating clinician", "Provisional — pending further assessment", "Cannot be assigned — incomplete information", "Not documented"] },
    { key: "confirmed_by", label: "Stage confirmed by", type: "input" },
    { key: "confirmation_date", label: "Confirmation date", type: "input" },
    { key: "staging_comment", label: "Staging comment recorded by the clinician", type: "text" },
  ],
};

// ------------------------------------------------------------ 5. Treatment
export const ONC_TREATMENT_BLOCK = {
  key: "onc_treatment",
  title: "Cancer-directed treatment",
  note: "The plan and the administration as documented by the treating clinician. AMedix calculates no dose, suggests no regimen and signs nothing — every order is authorized by the clinician.",
  fields: [
    { key: "treatment_intent", label: "Treatment intent", type: "select", options: ["Curative", "Adjuvant", "Neoadjuvant", "Definitive chemoradiotherapy", "Palliative", "Disease control", "Observation / watch and wait", "Supportive care only", "Not documented"] },
    { key: "treatment_line", label: "Line of treatment", type: "select", options: ["First line", "Second line", "Third line", "Fourth line or later", "Not applicable", "Not documented"] },
    { key: "modalities", label: "Modalities", type: "multi", options: ["Surgery", "Chemotherapy", "Immunotherapy", "Targeted therapy", "Endocrine / hormonal therapy", "Radiotherapy", "Chemoradiotherapy", "Stem-cell transplantation", "Supportive care"] },
    { key: "regimen_protocol", label: "Regimen / protocol", type: "input", placeholder: "Regimen name exactly as prescribed, with the protocol reference" },
    { key: "regimen_basis", label: "Documented basis for the regimen", type: "input", placeholder: "The guideline and category the clinician cited — e.g. NCCN category 1, ESMO grade A" },
    { key: "agents", label: "Agents and doses as prescribed", type: "text", placeholder: "Agent, dose, units, route, days — transcribed from the authorized order" },
    { key: "dose_basis", label: "Dose basis recorded", type: "select", options: ["BSA (mg/m²)", "Weight (mg/kg)", "Fixed dose", "AUC-targeted", "Other", "Not documented"] },
    { key: "bsa_used", label: "BSA used for the order", type: "number", unit: "m²" },
    { key: "weight_used", label: "Weight used for the order", type: "number", unit: "kg" },
    { key: "dose_units", label: "Dose units", type: "input", placeholder: "As written on the order" },
    { key: "route", label: "Route", type: "select", options: ["Intravenous", "Oral", "Subcutaneous", "Intramuscular", "Intrathecal", "Intravesical", "Intraperitoneal", "Topical", "Other", "Not documented"] },
    { key: "frequency", label: "Frequency / schedule", type: "input", placeholder: "e.g. every 21 days, days 1 and 8" },
    { key: "cycle_length_days", label: "Cycle length", type: "number", unit: "days" },
    { key: "cycle_number", label: "Cycle number", type: "number" },
    { key: "cycles_planned", label: "Cycles planned", type: "number" },
    { key: "start_date", label: "Start date", type: "input" },
    { key: "planned_end_date", label: "Planned completion date", type: "input" },
    { key: "pre_treatment_verification", label: "Documented before administration", type: "multi", options: ["Blood counts reviewed", "Liver and renal function reviewed", "Weight and BSA documented", "Consent documented", "Allergy status checked", "Extravasation precautions documented", "Growth-factor plan documented", "Fertility discussed", "None documented"] },
    { key: "antiemetic_prophylaxis", label: "Antiemetic prophylaxis documented", type: "select", options: YNNA },
    { key: "gcsf_prophylaxis", label: "Granulocyte colony-stimulating factor prophylaxis documented", type: "select", options: YNNA },
    { key: "b_cell_depleting", label: "B-cell–depleting agent included", type: "select", options: ["Yes — anti-CD20 or equivalent", "No", "Not documented"], hint: "Recorded by the prescriber; relevant to hepatitis B reactivation screening." },
    { key: "anthracycline_agent", label: "Anthracycline used", type: "input", placeholder: "e.g. doxorubicin, epirubicin — leave blank if none" },
    { key: "anthracycline_cumulative_dose", label: "Cumulative anthracycline dose", type: "number", unit: "mg/m²", hint: "Recorded from the treatment record; the published threshold is a monitoring prompt, not a stop order." },
    { key: "radiation_site", label: "Radiotherapy site and technique", type: "input" },
    { key: "radiation_dose", label: "Radiotherapy dose and fractions", type: "input", placeholder: "e.g. 50 Gy in 25 fractions" },
    { key: "surgery_planned", label: "Surgical procedure planned or performed", type: "input" },
    { key: "modifications", label: "Modifications, delays or dose reductions", type: "text", placeholder: "What changed, by how much, and why it was documented" },
    { key: "dose_reduction_percent", label: "Dose reduction applied", type: "number", unit: "%" },
    { key: "modification_reason", label: "Reason recorded for the modification", type: "input", placeholder: "e.g. grade 3 neutropenia, renal function, patient preference" },
    { key: "tls_risk_features", label: "Tumour lysis risk features documented", type: "multi", options: ["Bulky disease", "High lactate dehydrogenase", "Highly chemosensitive tumour", "Pre-existing renal impairment", "None documented"] },
    { key: "response_documented", label: "Response to this treatment documented", type: "select", options: ["Complete response", "Partial response", "Stable disease", "Progressive disease", "Not yet assessed", "Not evaluable"] },
    { key: "supportive_measures", label: "Supportive measures documented", type: "text" },
    { key: "next_assessment_due", label: "Next assessment due", type: "input" },
  ],
};

// --------------------------------------------------------- 6. Adverse events
export const ONC_CTCAE_BLOCK = {
  key: "onc_ctcae",
  title: "Adverse events (CTCAE)",
  note: "Each grade is the clinician's CTCAE grade for this encounter. A term that was not assessed stays 'not assessed' — it is never recorded as grade 0.",
  fields: [
    { key: "assessment_date", label: "Assessment date", type: "input" },
    { key: "ctcae_version", label: "CTCAE version used", type: "input", placeholder: "e.g. v5.0" },
    { key: "worst_grade_overall", label: "Worst grade this encounter", type: "select", options: GRADES },
    { key: "neutropenia_grade", label: "Neutropenia", type: "select", options: GRADES },
    { key: "anaemia_grade", label: "Anaemia", type: "select", options: GRADES },
    { key: "thrombocytopenia_grade", label: "Thrombocytopenia", type: "select", options: GRADES },
    { key: "febrile_neutropenia_grade", label: "Febrile neutropenia", type: "select", options: GRADES },
    { key: "nausea_grade", label: "Nausea", type: "select", options: GRADES },
    { key: "vomiting_grade", label: "Vomiting", type: "select", options: GRADES },
    { key: "diarrhoea_grade", label: "Diarrhoea", type: "select", options: GRADES },
    { key: "mucositis_grade", label: "Mucositis / oral mucositis", type: "select", options: GRADES },
    { key: "neuropathy_grade", label: "Peripheral sensory neuropathy", type: "select", options: GRADES },
    { key: "renal_grade", label: "Acute kidney injury / renal toxicity", type: "select", options: GRADES },
    { key: "hepatic_grade", label: "Hepatotoxicity", type: "select", options: GRADES },
    { key: "cardiac_grade", label: "Cardiac toxicity", type: "select", options: GRADES },
    { key: "irae_grade", label: "Immune-related adverse event", type: "select", options: GRADES },
    { key: "irae_type", label: "Immune-related event documented", type: "input", placeholder: "e.g. colitis, thyroiditis, pneumonitis, hepatitis, dermatitis" },
    { key: "radiation_toxicity_grade", label: "Radiation toxicity", type: "select", options: GRADES },
    { key: "fatigue_grade", label: "Fatigue", type: "select", options: GRADES },
    { key: "pain_grade", label: "Pain", type: "select", options: GRADES },
    { key: "temperature", label: "Highest temperature documented", type: "number", unit: "°C" },
    { key: "anc", label: "Absolute neutrophil count", type: "number", unit: "×10⁹/L" },
    { key: "haemoglobin", label: "Haemoglobin", type: "number", unit: "g/dL" },
    { key: "platelets", label: "Platelet count", type: "number", unit: "×10⁹/L" },
    { key: "creatinine", label: "Creatinine", type: "number", unit: "µmol/L" },
    { key: "corrected_calcium", label: "Albumin-corrected calcium", type: "number", unit: "mmol/L" },
    { key: "extravasation", label: "Extravasation documented", type: "select", options: YNNA },
    { key: "action_taken", label: "Action taken for these events", type: "text", placeholder: "As documented — AMedix suggests no action" },
    { key: "dose_impact", label: "Impact on the treatment plan", type: "select", options: ["No change", "Delayed", "Dose reduced", "Treatment held", "Treatment discontinued", "Not documented"] },
    { key: "supportive_treatment_given", label: "Supportive treatment given", type: "text" },
    { key: "outcome", label: "Outcome at this encounter", type: "select", options: ["Resolving", "Ongoing", "Resolved", "Worsening", "Not documented"] },
  ],
};

// --------------------------------------------------------------- 7. MDT
export const ONC_MDT_BLOCK = {
  key: "onc_mdt",
  title: "Multidisciplinary team review",
  note: "The meeting record: who was present, what was presented, what was recommended and who is responsible. The decision stays the team's — AMedix records it.",
  fields: [
    { key: "meeting_date", label: "Meeting date", type: "input" },
    { key: "meeting_type", label: "Meeting type", type: "select", options: ["Multidisciplinary team meeting", "Tumour board", "Case conference", "Joint clinic", "Other"] },
    { key: "disciplines_present", label: "Disciplines present", type: "multi", options: ["Medical oncology", "Surgical oncology", "Radiation oncology", "Haematology", "Pathology", "Radiology", "Palliative care", "Nuclear medicine", "Clinical genetics", "Nursing", "Other"] },
    { key: "presenter", label: "Case presented by", type: "input" },
    { key: "case_presentation", label: "Case presentation", type: "text" },
    { key: "histology_reviewed", label: "Histopathology reviewed", type: "select", options: YNNA },
    { key: "staging_reviewed", label: "Staging reviewed", type: "select", options: YNNA },
    { key: "molecular_reviewed", label: "Molecular results reviewed", type: "select", options: YNNA },
    { key: "treatment_to_date", label: "Treatment to date", type: "text" },
    { key: "discussion_points", label: "Discussion points", type: "text" },
    { key: "recommendation", label: "Team recommendation", type: "text" },
    { key: "alternatives_considered", label: "Alternatives considered and why not chosen", type: "text" },
    { key: "guideline_cited", label: "Guideline cited in the discussion", type: "input", placeholder: "Collection, version and the section cited — never paraphrased by AMedix" },
    { key: "divergent_guidance", label: "Divergence between sources noted", type: "select", options: ["Not applicable", "NCCN and ESMO differ — both cited", "Other disagreement documented", "Not documented"] },
    { key: "outstanding_items", label: "Outstanding items before treatment", type: "text" },
    { key: "decision_status", label: "Decision status", type: "select", options: ["Agreed", "Deferred — awaiting results", "Consensus not reached", "Referred to another team", "Not documented"] },
    { key: "responsible_clinicians", label: "Responsible clinicians", type: "input" },
    { key: "patient_preference", label: "Patient preference documented", type: "text" },
    { key: "signed_by", label: "Record signed by", type: "input" },
    { key: "signed_date", label: "Date signed", type: "input" },
  ],
};

// ------------------------------------------------------------ 8. Response
export const ONC_RESPONSE_BLOCK = {
  key: "onc_response",
  title: "Response assessment",
  note: "Measurements and the overall response as the clinician recorded them. AMedix computes no overall response category — that judgement includes non-target lesions and new lesions.",
  fields: [
    { key: "criteria", label: "Criteria used", type: "select", options: ["RECIST 1.1", "iRECIST", "RANO (CNS)", "Deauville (lymphoma)", "Haematological response criteria", "Tumour markers only", "Other", "Not documented"] },
    { key: "assessment_date", label: "Assessment date", type: "input" },
    { key: "comparison_date", label: "Compared with assessment of", type: "input" },
    { key: "study_reference", label: "Study reference compared", type: "input", placeholder: "The examination reference held in the patient record" },
    { key: "target_lesions_documented", label: "Target lesions documented", type: "select", options: YNNA },
    { key: "baseline_sum_mm", label: "Baseline sum of target diameters", type: "number", unit: "mm" },
    { key: "current_sum_mm", label: "Current sum of target diameters", type: "number", unit: "mm" },
    { key: "non_target_response", label: "Non-target lesion assessment", type: "select", options: ["Complete response", "Non-complete response / non-progressive", "Unequivocal progression", "Not assessed"] },
    { key: "new_lesions", label: "New lesions", type: "select", options: ["Present", "Absent", "Not assessed"] },
    { key: "overall_response", label: "Overall response recorded by the clinician", type: "select", options: ["Complete response", "Partial response", "Stable disease", "Progressive disease", "Not evaluable", "Not assessed"] },
    { key: "confirmation_repeat", label: "Response confirmed on repeat assessment", type: "select", options: YNNA },
    { key: "clinician_confirmed", label: "Response confirmed by", type: "input" },
    { key: "response_comment", label: "Comment", type: "text" },
  ],
};

// ------------------------------------------------------------ 9. Follow-up
export const ONC_FOLLOWUP_BLOCK = {
  key: "onc_followup",
  title: "Survivorship and recurrence monitoring",
  note: "The surveillance record. A test not performed is not a negative result, and a suspicion of recurrence is recorded as a suspicion until it is documented.",
  fields: [
    { key: "months_since_diagnosis", label: "Time since diagnosis", type: "input", placeholder: "e.g. 18 months" },
    { key: "months_since_treatment", label: "Time since treatment completion", type: "input" },
    { key: "symptoms_reported", label: "Symptoms reported", type: "text" },
    { key: "recurrence_suspected", label: "Suspected recurrence", type: "select", options: ["No", "Suspected — under assessment", "Recurrence documented", "Not documented"] },
    { key: "recurrence_details", label: "Recurrence — site and basis", type: "text", placeholder: "How it was documented; a deposit is never recorded as a new primary" },
    { key: "surveillance_performed", label: "Surveillance assessment performed", type: "text", placeholder: "What was done, where, and when — no result is inferred" },
    { key: "tumour_markers", label: "Tumour markers", type: "input", placeholder: "Marker, value, date, and the reference range reported" },
    { key: "late_effects", label: "Late effects documented", type: "multi", options: ["Cardiac dysfunction", "Peripheral neuropathy", "Lymphoedema", "Pulmonary toxicity", "Renal impairment", "Endocrine dysfunction", "Infertility", "Cognitive change", "Second malignancy surveillance", "None documented"] },
    { key: "psychological_support", label: "Psychological support", type: "select", options: ["In place", "Offered", "Declined", "Not indicated", "Not documented"] },
    { key: "rehabilitation", label: "Rehabilitation", type: "select", options: ["In place", "Offered", "Declined", "Not indicated", "Not documented"] },
    { key: "vaccination_review", label: "Vaccination review", type: "select", options: ["Up to date", "Incomplete", "Live vaccines avoided", "Not applicable", "Not documented"] },
    { key: "fertility_review", label: "Fertility review", type: "select", options: YNNA },
    { key: "survivorship_plan_given", label: "Survivorship care plan given", type: "select", options: YNNA },
    { key: "next_assessment", label: "Next assessment", type: "input" },
    { key: "discharge_to_primary_care", label: "Discharged to primary care", type: "select", options: YNNA },
  ],
};

// --------------------------------------------------- 10. Supportive / palliative
export const ONC_SUPPORTIVE_BLOCK = {
  key: "onc_supportive",
  title: "Supportive, palliative and goals of care",
  note: "Symptoms, function, and what the patient has decided. Scores are the patient's report; the goals-of-care record is theirs and the clinician's, never the platform's.",
  fields: [
    { key: "pain_score", label: "Pain score now (0–10, as reported)", type: "number", min: 0, max: 10 },
    { key: "pain_site", label: "Pain — site and character", type: "input" },
    { key: "analgesia_current", label: "Current analgesia", type: "text", placeholder: "As prescribed — AMedix suggests no dose" },
    { key: "breakthrough_pain", label: "Breakthrough pain documented", type: "select", options: YN },
    { key: "dyspnoea_score", label: "Breathlessness score (0–10)", type: "number", min: 0, max: 10 },
    { key: "nausea_score", label: "Nausea score (0–10)", type: "number", min: 0, max: 10 },
    { key: "fatigue_score", label: "Fatigue score (0–10)", type: "number", min: 0, max: 10 },
    { key: "anorexia_score", label: "Appetite loss score (0–10)", type: "number", min: 0, max: 10 },
    { key: "ecog", label: "ECOG performance status", type: "select", options: ECOG },
    { key: "nutrition_hydration", label: "Nutrition and hydration documented", type: "select", options: ["Adequate intake", "Reduced intake", "Assisted feeding", "Enteral feeding", "Hydration support", "Not documented"] },
    { key: "weight_change", label: "Weight change recorded", type: "input", placeholder: "e.g. 4 kg lost over 2 months" },
    { key: "psychosocial", label: "Psychological and social needs documented", type: "text" },
    { key: "spiritual_support", label: "Spiritual or cultural support", type: "select", options: ["In place", "Offered", "Declined", "Not documented"] },
    { key: "family_support", label: "Family and carer support documented", type: "text" },
    { key: "palliative_care_involvement", label: "Palliative care involvement", type: "select", options: ["Inpatient team", "Community team", "Clinic-based", "Not yet involved", "Not documented"] },
    { key: "advance_care_plan", label: "Advance care plan documented", type: "select", options: YNNA },
    { key: "resuscitation_status", label: "Resuscitation status documented", type: "select", options: ["Documented — for resuscitation", "Documented — not for resuscitation", "Not yet discussed", "Not documented"] },
    { key: "preferred_place_of_care", label: "Preferred place of care", type: "input" },
    { key: "goals_of_care", label: "Goals of care documented", type: "text" },
    { key: "bereavement_support", label: "Bereavement support offered to the family", type: "select", options: YNNA },
    { key: "urgent_needs", label: "Urgent needs identified", type: "text" },
  ],
};

export const ONC_BLOCKS = {
  onc_assessment: ONC_ASSESSMENT_BLOCK,
  onc_histopathology: ONC_HISTOPATHOLOGY_BLOCK,
  onc_biomarkers: ONC_BIOMARKERS_BLOCK,
  onc_staging: ONC_STAGING_BLOCK,
  onc_treatment: ONC_TREATMENT_BLOCK,
  onc_ctcae: ONC_CTCAE_BLOCK,
  onc_mdt: ONC_MDT_BLOCK,
  onc_response: ONC_RESPONSE_BLOCK,
  onc_followup: ONC_FOLLOWUP_BLOCK,
  onc_supportive: ONC_SUPPORTIVE_BLOCK,
};

export const ONC_BLOCK_KEYS = Object.keys(ONC_BLOCKS);

export const oncBlock = (key) => ONC_BLOCKS[key] || null;

export const oncBlockValue = (blockKey, values) => ({ __block: blockKey, ...asObject(values) });

export const oncBlockValues = (values, blockKey) => asObject(asObject(values)[blockKey]);

export const oncBlockHasContent = (values, blockKey) =>
  Object.entries(oncBlockValues(values, blockKey)).some(([k, v]) =>
    k === "__block" ? false : Array.isArray(v) ? v.length > 0 : str(v) !== "",
  );

// Printed form, in the order the block declares.
export const formatOncBlock = (value) => {
  const v = asObject(value);
  const spec = oncBlock(v.__block);
  if (!spec) return "";
  return spec.fields
    .map((f) => {
      const raw = v[f.key];
      const text = Array.isArray(raw) ? raw.join(", ") : str(raw);
      return text ? `${f.label}: ${text}${f.unit ? ` ${f.unit}` : ""}` : "";
    })
    .filter(Boolean)
    .join("\n");
};