// Internal Medicine — WHO ICD-11 MMS coding context and condition index.
//
// SCOPE AND HONESTY RULES
//   · WHO ICD-11 MMS only. No ICD-10 entry point and no crosswalk exists here.
//   · NO CODE IS WRITTEN IN THIS FILE. Every entry is a clinical search term that is
//     resolved at the moment of use against the AMedix-wide ICD-11 dataset (the same
//     shared infrastructure every specialty and hospital portal uses). A code is
//     stored only when the dataset returns that entry; a condition the dataset does
//     not hold is recorded with no code and flagged for coding review. A code is
//     never generated, completed or guessed — and never confirmed by software.
//   · The index is a shortcut into the classification, not a static diagnosis
//     dropdown: the clinician can always search the whole dataset by the words used
//     on the ward.
//   · Detail a code cannot carry — severity, stage, grade, laterality, organism — is
//     recorded beside the code in the entry's detail fields, never appended to it.

export const IM_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  label: "ICD-11 MMS",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  chapter_note:
    "Internal medicine codes across many chapters of ICD-11 MMS. The chapter is read from the dataset entry itself and is never chosen by AMedix.",
};

// Every diagnosis carries one of these documented statuses. A code alone never
// confirms a diagnosis — the status is the clinician's statement.
export const IM_ICD_STATUSES = [
  "Suspected",
  "Differential diagnosis",
  "Provisional",
  "Confirmed",
  "Ruled out",
  "Historical",
  "Resolved",
];

export const IM_ICD_ROLES = ["Primary", "Secondary"];

export const IM_ICD_DETAIL_FIELDS = [
  {
    key: "severity",
    label: "Severity recorded by the clinician",
    type: "input",
    placeholder: "e.g. mild / moderate / severe, or the score documented",
  },
  {
    key: "stage_grade",
    label: "Stage, grade or classification",
    type: "input",
    placeholder: "e.g. CKD G3a A2, Child-Pugh B, NYHA II, GOLD 2",
  },
  {
    key: "laterality",
    label: "Laterality / site",
    type: "select",
    options: ["Right", "Left", "Bilateral", "Midline / systemic", "Not applicable", "Not documented"],
    hint: "Recorded beside the code — never appended to it.",
  },
  { key: "duration", label: "Duration / onset", type: "input", placeholder: "e.g. 3 days, since 2019, recurrent" },
  {
    key: "organism",
    label: "Organism / resistance detail",
    type: "input",
    placeholder: "e.g. E. coli ESBL — as reported by the laboratory",
  },
  {
    key: "basis",
    label: "Clinical basis documented",
    type: "input",
    placeholder: "Findings and reasoning that support this entry",
  },
];

export const IM_ICD_CODING_NOTE =
  "WHO ICD-11 MMS only — ICD-10 is never used and no crosswalk is applied. A code is stored only when the workspace's ICD-11 dataset returns that entry, with the release recorded; anything else is recorded as unresolved and flagged for coding review. Neither a symptom nor a sign is coded as a diagnosis, and no code is ever confirmed by AMedix.";

export const IM_ICD_CLUSTER_NOTE =
  "Leave empty unless the WHO Coding Tool produced a postcoordinated cluster. A cluster is copied exactly as the WHO browser shows it, never assembled here and never extended with a stem the classification does not provide.";

export const IM_ICD_SEARCH_GUIDANCE =
  "Search by disease name, clinical term, synonym or abbreviation — in English or Arabic. Terms are resolved against the workspace ICD-11 dataset; a term the dataset does not hold is flagged for coding review rather than approximated.";

// Condition index — search terms grouped by discipline. These are SEARCH TERMS
// only; each is resolved against the dataset at the point of use.
const group = (key, label, terms) => ({ key, label, terms });

export const IM_ICD11_GROUPS = [
  group("cardiology", "Cardiology", [
    "acute coronary syndrome", "ST elevation myocardial infarction", "non-ST elevation myocardial infarction",
    "unstable angina", "stable angina", "heart failure", "acute heart failure", "reduced ejection fraction heart failure",
    "preserved ejection fraction heart failure", "atrial fibrillation", "atrial flutter", "supraventricular tachycardia",
    "ventricular tachycardia", "complete heart block", "aortic stenosis", "mitral regurgitation", "infective endocarditis",
    "pericarditis", "cardiac tamponade", "hypertensive emergency", "hypertensive urgency", "pulmonary hypertension",
    "cardiogenic shock", "syncope", "deep vein thrombosis", "pulmonary embolism",
  ]),
  group("respiratory", "Respiratory medicine", [
    "community acquired pneumonia", "hospital acquired pneumonia", "aspiration pneumonia", "acute bronchitis",
    "chronic obstructive pulmonary disease", "acute exacerbation of chronic obstructive pulmonary disease", "asthma",
    "acute severe asthma", "bronchiectasis", "pleural effusion", "empyema", "pneumothorax", "tension pneumothorax",
    "pulmonary embolism", "interstitial lung disease", "idiopathic pulmonary fibrosis", "sarcoidosis", "tuberculosis",
    "obstructive sleep apnoea", "respiratory failure", "acute respiratory distress syndrome", "haemoptysis",
  ]),
  group("gastroenterology", "Gastroenterology and hepatology", [
    "gastro-oesophageal reflux disease", "peptic ulcer disease", "upper gastrointestinal bleeding",
    "variceal bleeding", "acute pancreatitis", "chronic pancreatitis", "acute cholecystitis", "cholangitis",
    "inflammatory bowel disease", "ulcerative colitis", "crohn disease", "coeliac disease", "irritable bowel syndrome",
    "cirrhosis of liver", "decompensated cirrhosis", "ascites", "spontaneous bacterial peritonitis",
    "hepatic encephalopathy", "hepatitis B", "hepatitis C", "alcoholic liver disease", "acute liver failure",
    "clostridioides difficile infection", "constipation", "diarrhoea",
  ]),
  group("nephrology", "Nephrology", [
    "chronic kidney disease", "acute kidney injury", "nephrotic syndrome", "nephritic syndrome",
    "glomerulonephritis", "diabetic kidney disease", "hypertensive nephropathy", "polycystic kidney disease",
    "urinary tract infection", "pyelonephritis", "hyperkalaemia", "hypokalaemia", "hyponatraemia", "hypernatraemia",
    "metabolic acidosis", "renal tubular acidosis", "dialysis", "contrast induced nephropathy",
  ]),
  group("endocrinology", "Endocrinology and diabetes", [
    "type 1 diabetes mellitus", "type 2 diabetes mellitus", "diabetic ketoacidosis", "hyperosmolar hyperglycaemic state",
    "hypoglycaemia", "diabetic retinopathy", "diabetic neuropathy", "hypothyroidism", "hyperthyroidism",
    "thyroiditis", "thyroid nodule", "adrenal insufficiency", "cushing syndrome", "primary aldosteronism",
    "hypercalcaemia", "hypocalcaemia", "osteoporosis", "dyslipidaemia", "obesity", "pituitary adenoma",
  ]),
  group("hematology", "Hematology", [
    "iron deficiency anaemia", "anaemia of chronic disease", "megaloblastic anaemia", "haemolytic anaemia",
    "sickle cell disease", "thalassaemia", "thrombocytopenia", "immune thrombocytopenia", "neutropenia",
    "pancytopenia", "aplastic anaemia", "acute myeloid leukaemia", "chronic lymphocytic leukaemia",
    "lymphoma", "multiple myeloma", "polycythaemia", "essential thrombocythaemia", "haemophilia",
    "venous thromboembolism", "disseminated intravascular coagulation", "neutropenic sepsis",
  ]),
  group("infectious", "Infectious diseases", [
    "sepsis", "septic shock", "bacteraemia", "infective endocarditis", "meningitis", "encephalitis",
    "cellulitis", "osteomyelitis", "septic arthritis", "infective diarrhoea", "typhoid fever", "brucellosis",
    "tuberculosis", "influenza", "COVID-19", "malaria", "dengue", "leptospirosis", "HIV infection",
    "hepatitis B", "hepatitis C", "candidiasis", "antimicrobial resistance", "clostridioides difficile infection",
  ]),
  group("rheumatology", "Rheumatology", [
    "rheumatoid arthritis", "systemic lupus erythematosus", "antiphospholipid syndrome", "psoriatic arthritis",
    "ankylosing spondylitis", "gout", "calcium pyrophosphate deposition disease", "polymyalgia rheumatica",
    "giant cell arteritis", "systemic sclerosis", "sjogren syndrome", "dermatomyositis", "polymyositis",
    "vasculitis", "granulomatosis with polyangiitis", "behcet disease", "fibromyalgia", "osteoarthritis",
  ]),
  group("neurology", "Neurology", [
    "ischaemic stroke", "intracerebral haemorrhage", "transient ischaemic attack", "subarachnoid haemorrhage",
    "cerebral venous thrombosis", "epilepsy", "status epilepticus", "meningitis", "encephalitis",
    "guillain-barre syndrome", "myasthenia gravis", "multiple sclerosis", "parkinson disease", "dementia",
    "delirium", "migraine", "tension type headache", "peripheral neuropathy", "bell palsy", "vestibular neuritis",
  ]),
  group("oncology", "Oncology", [
    "lung cancer", "breast cancer", "colorectal cancer", "gastric cancer", "oesophageal cancer",
    "pancreatic cancer", "hepatocellular carcinoma", "prostate cancer", "bladder cancer", "renal cell carcinoma",
    "lymphoma", "multiple myeloma", "leukaemia", "metastatic disease", "cancer related pain", "febrile neutropenia",
    "tumour lysis syndrome", "malignant spinal cord compression", "superior vena cava obstruction",
    "hypercalcaemia of malignancy", "cancer cachexia",
  ]),
  group("geriatrics", "Geriatric medicine", [
    "frailty", "falls", "delirium", "dementia", "urinary incontinence", "pressure ulcer", "polypharmacy",
    "sarcopenia", "malnutrition", "hip fracture", "functional decline", "elderly abuse", "advance care planning",
  ]),
  group("general", "General internal medicine", [
    "hypertension", "chest pain", "dyspnoea", "fever of unknown origin", "syncope", "dizziness",
    "unintentional weight loss", "fatigue", "generalised oedema", "dehydration", "hypovolaemia",
    "anaphylaxis", "adverse drug reaction", "poisoning", "alcohol withdrawal", "tobacco use disorder",
    "venous thromboembolism", "perioperative medical assessment", "multimorbidity",
  ]),
];

export const IM_ICD11_CONDITION_COUNT = IM_ICD11_GROUPS.reduce((n, g) => n + g.terms.length, 0);