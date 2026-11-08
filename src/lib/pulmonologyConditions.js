// Pulmonology / Respiratory Medicine — condition index for diagnosis entry.
//
// WHY THIS FILE HOLDS NO CODES
// Every entry below is a CONDITION the respiratory clinician can select. None of
// them carries an ICD-11 code: a code is only ever taken from the official WHO
// ICD-11 service at the moment the condition is selected (see
// Icd11ConditionIndex). The `whoQuery` is the term sent to the WHO search — it is
// a search phrase, never a code and never a substitute for one.
//
// This keeps the app's coding rule intact: AMedix never generates, completes,
// crosswalks or approximates a code. A condition that cannot be resolved in the
// WHO service is documented without a code and flagged for coding review.

export const RESPIRATORY_CONDITION_GROUPS = [
  {
    key: "obstructive",
    label: "Obstructive airway disease",
    conditions: [
      { key: "asthma", label: "Asthma", whoQuery: "asthma", note: "Variable airflow limitation should be documented before a confirmed diagnosis is coded." },
      { key: "severe_asthma", label: "Severe asthma", whoQuery: "severe asthma", note: "GINA step 4–5 treatment with documented adherence and comorbidity review is what makes a severe-asthma diagnosis defensible." },
      { key: "asthma_exacerbation", label: "Asthma exacerbation (acute)", whoQuery: "asthma exacerbation", note: "Record severity, the treatment given and the response — the exacerbation is coded separately from the underlying asthma." },
      { key: "copd", label: "Chronic obstructive pulmonary disease", whoQuery: "chronic obstructive pulmonary disease", note: "Post-bronchodilator airflow obstruction should be documented before a confirmed diagnosis is coded." },
      { key: "aecopd", label: "Acute exacerbation of COPD", whoQuery: "acute exacerbation of chronic obstructive pulmonary disease", note: "Document the trigger, severity and the treatment escalation alongside the underlying COPD." },
      { key: "chronic_bronchitis", label: "Chronic bronchitis", whoQuery: "chronic bronchitis" },
      { key: "emphysema", label: "Emphysema", whoQuery: "emphysema" },
      { key: "bronchiolitis", label: "Bronchiolitis", whoQuery: "bronchiolitis", note: "Age and the clinical picture belong in the note; the code alone never states severity." },
      { key: "bronchiectasis", label: "Bronchiectasis", whoQuery: "bronchiectasis", note: "Radiological confirmation and the documented sputum microbiology stay in the record beside the code." },
    ],
  },
  {
    key: "infection",
    label: "Respiratory infection",
    conditions: [
      { key: "cap", label: "Community-acquired pneumonia", whoQuery: "pneumonia", note: "Severity, site of care and the review interval are documented in the note; the organism is never inferred from the code." },
      { key: "hap", label: "Hospital-acquired pneumonia (including ventilator-associated)", whoQuery: "hospital acquired pneumonia", note: "Record the onset date relative to admission and any device exposure." },
      { key: "lung_abscess", label: "Lung abscess", whoQuery: "lung abscess" },
      { key: "empyema", label: "Empyema", whoQuery: "empyema", note: "Pleural fluid analysis belongs in the investigations section beside this diagnosis." },
      { key: "tuberculosis", label: "Tuberculosis — pulmonary", whoQuery: "tuberculosis of lung", note: "Bacteriological status, notification and the regimen are documented in the tuberculosis block." },
    ],
  },
  {
    key: "interstitial",
    label: "Interstitial, fibrotic and occupational",
    conditions: [
      { key: "ild", label: "Interstitial lung disease", whoQuery: "interstitial lung disease" },
      { key: "ipf", label: "Idiopathic pulmonary fibrosis", whoQuery: "idiopathic pulmonary fibrosis", note: "A multi-disciplinary review is what supports this diagnosis; record its outcome in the ILD block." },
      { key: "sarcoidosis", label: "Sarcoidosis — pulmonary", whoQuery: "sarcoidosis of lung" },
      { key: "hypersensitivity_pneumonitis", label: "Hypersensitivity pneumonitis", whoQuery: "hypersensitivity pneumonitis", note: "The documented antigen exposure is what supports the diagnosis — record it in the exposure block." },
      { key: "occupational_lung_disease", label: "Occupational lung disease (pneumoconiosis, asbestosis)", whoQuery: "pneumoconiosis", note: "The occupational history and the basis for attributing the condition to the exposure are recorded with the code." },
    ],
  },
  {
    key: "pleural",
    label: "Pleural disease",
    conditions: [
      { key: "pleural_effusion", label: "Pleural effusion", whoQuery: "pleural effusion", note: "Side and the fluid character are recorded in the pleural block; the cause is coded separately when established." },
      { key: "pneumothorax", label: "Pneumothorax", whoQuery: "pneumothorax", note: "Side, size and whether drainage was performed are documented beside the code." },
    ],
  },
  {
    key: "vascular",
    label: "Pulmonary vascular disease",
    conditions: [
      { key: "pulmonary_embolism", label: "Pulmonary embolism", whoQuery: "pulmonary embolism", note: "Pre-test probability and the diagnostic pathway are recorded in the PE block." },
      { key: "pulmonary_hypertension", label: "Pulmonary hypertension", whoQuery: "pulmonary hypertension", note: "The documented group and the confirmation study belong in the note; the code does not carry them." },
    ],
  },
  {
    key: "sleep_ventilation",
    label: "Sleep and ventilatory disorders",
    conditions: [
      { key: "osa", label: "Obstructive sleep apnoea", whoQuery: "obstructive sleep apnoea", note: "Objective sleep testing must be documented before this diagnosis is recorded as confirmed." },
      { key: "obesity_hypoventilation", label: "Obesity hypoventilation syndrome", whoQuery: "obesity hypoventilation syndrome", note: "Documented awake hypercapnia with obesity is what supports the diagnosis." },
      { key: "acute_respiratory_failure", label: "Acute respiratory failure", whoQuery: "acute respiratory failure", note: "Record the gas exchange, the support given and the target range." },
      { key: "chronic_respiratory_failure", label: "Chronic respiratory failure", whoQuery: "chronic respiratory failure", note: "Long-term oxygen or ventilatory support criteria are recorded in the oxygen block." },
    ],
  },
  {
    key: "critical",
    label: "Critical care",
    conditions: [
      { key: "ards", label: "Acute respiratory distress syndrome", whoQuery: "acute respiratory distress syndrome", note: "The diagnostic criteria met, the timing and the ventilatory strategy are documented in the note." },
    ],
  },
  {
    key: "neoplastic",
    label: "Neoplastic disease",
    conditions: [
      { key: "lung_cancer", label: "Lung cancer (bronchial carcinoma)", whoQuery: "malignant neoplasm of bronchus or lung", note: "Histology and stage are documented in the note; the code records the neoplasm, not its stage." },
      { key: "pulmonary_nodule", label: "Pulmonary nodule", whoQuery: "pulmonary nodule", note: "A nodule is a finding, not a diagnosis — record size, morphology and the follow-up plan." },
      { key: "metastatic_lung", label: "Metastatic pulmonary disease", whoQuery: "secondary malignant neoplasm of lung", note: "The primary site is coded separately when it is known." },
    ],
  },
  {
    key: "symptoms",
    label: "Presenting symptoms (not diagnoses)",
    conditions: [
      { key: "chronic_cough", label: "Chronic cough", whoQuery: "cough", note: "A symptom code records what the patient presented with; it never establishes the underlying disease." },
      { key: "haemoptysis", label: "Haemoptysis", whoQuery: "haemoptysis", note: "Volume, the source if identified and the investigation pathway are documented beside the code." },
    ],
  },
];

export const RESPIRATORY_CONDITIONS = RESPIRATORY_CONDITION_GROUPS.flatMap((g) =>
  g.conditions.map((c) => ({ ...c, group: g.key, groupLabel: g.label })),
);

export const RESPIRATORY_CONDITION_COUNT = RESPIRATORY_CONDITIONS.length;

export const respiratoryCondition = (key) => RESPIRATORY_CONDITIONS.find((c) => c.key === key) || null;