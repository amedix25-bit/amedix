// Family Medicine — WHO ICD-11 condition index and coding context.
//
// SCOPE AND HONESTY RULES
//   · WHO ICD-11 MMS only. No ICD-10 entry point and no crosswalk exists here.
//   · NO CODE IS WRITTEN IN THIS FILE. Each entry is a clinical search term that is
//     resolved at the moment of use against the workspace's own ICD-11 dataset
//     (icd11LocalSearch). A code is stored only when the dataset returns it; a
//     condition the dataset does not hold is recorded with no code and flagged for
//     coding review. A code is never generated, completed or guessed.
//   · The index is a shortcut into the classification, not a static diagnosis list:
//     the clinician can always search the whole dataset by the words used in clinic.
//   · A code is never a diagnosis. Every entry records role, diagnostic status
//     (confirmed / suspected / differential / symptom / sign), mapping state and the
//     clinician's own documented basis.
//   · Detail a code cannot carry — severity, laterality, stage, trimesters, grade —
//     is recorded beside the code in the entry's detail fields, never appended to it.

export const FM_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  label: "ICD-11 MMS",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  chapter_note:
    "Family medicine codes across many chapters of ICD-11 MMS. The chapter is read from the dataset entry itself and is never chosen by AMedix.",
};

export const FM_ICD_STATUSES = [
  "Confirmed",
  "Suspected",
  "Differential diagnosis",
  "Symptom — not a diagnosis",
  "Sign — not a diagnosis",
  "Ruled out",
  "Historical — resolved",
];

export const FM_ICD_ROLES = ["Primary", "Secondary", "Complication of another diagnosis", "Reason for encounter"];

export const FM_ICD_DETAIL_FIELDS = [
  {
    key: "laterality",
    label: "Laterality",
    type: "select",
    options: ["Right", "Left", "Bilateral", "Midline / systemic", "Not applicable", "Not documented"],
    hint: "Recorded beside the code — never appended to it.",
  },
  { key: "severity", label: "Severity recorded by the clinician", type: "input", placeholder: "e.g. mild / moderate / severe, or a score" },
  { key: "stage_grade", label: "Stage, grade or classification", type: "input", placeholder: "e.g. CKD G3a A2, GOLD 2, asthma step 3" },
  { key: "duration", label: "Duration / onset", type: "input", placeholder: "e.g. 3 days, since childhood, recurrent" },
  { key: "pregnancy_context", label: "Pregnancy context", type: "select", options: ["Not pregnant", "Pregnant — relevant to this diagnosis", "Postpartum", "Not applicable", "Not documented"] },
  { key: "later_episode", label: "Episode", type: "select", options: ["First episode", "Recurrent", "Follow-up of known diagnosis", "Not documented"] },
  { key: "basis", label: "Clinical basis documented", type: "input", placeholder: "Findings and reasoning that support this entry" },
];

export const FM_ICD_CODING_NOTE =
  "WHO ICD-11 MMS only — ICD-10 is never used and no crosswalk is applied. A code is stored only when the workspace's ICD-11 dataset returns that entry, with the release recorded; anything else is recorded as unresolved and flagged for coding review. Neither a symptom nor a sign is coded as a diagnosis.";

export const FM_ICD_CLUSTER_NOTE =
  "Leave empty unless the WHO Coding Tool produced a postcoordinated cluster. A cluster is copied exactly as the WHO browser shows it, never assembled here and never extended with a stem the classification does not provide.";

export const FM_ICD_SEARCH_GUIDANCE =
  "Search by the words used in the clinic. If the condition is not in the dataset, take the term from the WHO browser (it is stored as review required) or record the diagnosis with no code and leave it unresolved — never approximate a code.";

const C = (key, label, whoQuery) => ({ key, label, whoQuery });

// The index is grouped by the domains family medicine actually works in. Each entry
// is a search phrase, not a code and not an assertion that the diagnosis is present.
export const FM_ICD11_GROUPS = [
  {
    key: "acute",
    label: "Acute presentations and undifferentiated illness",
    conditions: [
      C("fever_unknown", "Fever, unspecified", "fever"),
      C("fatigue", "Fatigue or malaise", "malaise fatigue"),
      C("acute_pain", "Acute pain", "pain unspecified"),
      C("dizziness", "Dizziness or giddiness", "dizziness"),
      C("syncope", "Syncope or collapse", "syncope"),
      C("dehydration", "Dehydration", "dehydration"),
      C("insomnia", "Insomnia", "insomnia"),
      C("headache", "Headache", "headache"),
      C("cough", "Cough", "cough"),
      C("sore_throat", "Sore throat", "pharyngitis"),
    ],
  },
  {
    key: "infections",
    label: "Infections",
    conditions: [
      C("uri", "Upper respiratory tract infection", "upper respiratory tract infection"),
      C("influenza", "Influenza", "influenza"),
      C("pneumonia", "Pneumonia", "pneumonia"),
      C("bronchitis", "Acute bronchitis", "bronchitis"),
      C("uti", "Urinary tract infection", "urinary tract infection"),
      C("gastroenteritis", "Gastroenteritis", "gastroenteritis"),
      C("cellulitis", "Cellulitis", "cellulitis"),
      C("hepatitis_b", "Chronic hepatitis B", "chronic hepatitis B"),
      C("hepatitis_c", "Chronic hepatitis C", "chronic hepatitis C"),
      C("hiv", "HIV disease", "human immunodeficiency virus disease"),
      C("tuberculosis", "Tuberculosis", "tuberculosis"),
      C("otitis_media", "Otitis media", "otitis media"),
      C("sinusitis", "Sinusitis", "sinusitis"),
      C("covid", "Coronavirus disease 2019", "coronavirus disease 2019"),
    ],
  },
  {
    key: "cardiovascular",
    label: "Cardiovascular",
    conditions: [
      C("hypertension", "Essential hypertension", "essential hypertension"),
      C("ihd", "Ischaemic heart disease", "ischaemic heart disease"),
      C("acs", "Acute coronary syndrome", "acute myocardial infarction"),
      C("heart_failure", "Heart failure", "heart failure"),
      C("af", "Atrial fibrillation", "atrial fibrillation"),
      C("dyslipidaemia", "Disorder of lipid metabolism", "disorders of lipoprotein metabolism"),
      C("stroke", "Stroke", "cerebral ischaemic stroke"),
      C("tia", "Transient ischaemic attack", "transient ischaemic attack"),
      C("pad", "Peripheral arterial disease", "peripheral arterial disease"),
      C("dvt", "Deep vein thrombosis", "deep vein thrombosis"),
    ],
  },
  {
    key: "respiratory",
    label: "Respiratory",
    conditions: [
      C("asthma", "Asthma", "asthma"),
      C("copd", "Chronic obstructive pulmonary disease", "chronic obstructive pulmonary disease"),
      C("allergic_rhinitis", "Allergic rhinitis", "allergic rhinitis"),
      C("sleep_apnoea", "Obstructive sleep apnoea", "obstructive sleep apnoea"),
      C("bronchiectasis", "Bronchiectasis", "bronchiectasis"),
      C("pe", "Pulmonary embolism", "pulmonary embolism"),
      C("pneumothorax", "Pneumothorax", "pneumothorax"),
      C("pleural_effusion", "Pleural effusion", "pleural effusion"),
    ],
  },
  {
    key: "gastrointestinal",
    label: "Gastrointestinal and liver",
    conditions: [
      C("gerd", "Gastro-oesophageal reflux disease", "gastro-oesophageal reflux disease"),
      C("gastritis", "Gastritis", "gastritis"),
      C("pud", "Peptic ulcer disease", "peptic ulcer"),
      C("ibs", "Irritable bowel syndrome", "irritable bowel syndrome"),
      C("ibd", "Inflammatory bowel disease", "inflammatory bowel disease"),
      C("constipation", "Constipation", "constipation"),
      C("nafld", "Metabolic dysfunction-associated fatty liver disease", "fatty liver"),
      C("cirrhosis", "Cirrhosis of the liver", "cirrhosis of liver"),
      C("gallstones", "Cholelithiasis", "cholelithiasis"),
      C("acute_abdomen", "Acute abdomen", "acute abdomen"),
    ],
  },
  {
    key: "endocrine",
    label: "Endocrine and metabolic",
    conditions: [
      C("t2dm", "Type 2 diabetes mellitus", "type 2 diabetes mellitus"),
      C("t1dm", "Type 1 diabetes mellitus", "type 1 diabetes mellitus"),
      C("prediabetes", "Intermediate hyperglycaemia", "intermediate hyperglycaemia"),
      C("hypothyroidism", "Hypothyroidism", "hypothyroidism"),
      C("hyperthyroidism", "Hyperthyroidism", "thyrotoxicosis"),
      C("obesity", "Obesity", "obesity"),
      C("vitamin_d", "Vitamin D deficiency", "vitamin D deficiency"),
      C("iron_deficiency", "Iron deficiency anaemia", "iron deficiency anaemia"),
      C("gout", "Gout", "gout"),
      C("osteoporosis", "Osteoporosis", "osteoporosis"),
    ],
  },
  {
    key: "renal",
    label: "Kidney and urinary",
    conditions: [
      C("ckd", "Chronic kidney disease", "chronic kidney disease"),
      C("aki", "Acute kidney injury", "acute kidney failure"),
      C("nephrotic", "Nephrotic syndrome", "nephrotic syndrome"),
      C("renal_stone", "Kidney stone", "calculus of kidney"),
      C("bph", "Benign prostatic hyperplasia", "benign prostatic hyperplasia"),
      C("incontinence", "Urinary incontinence", "urinary incontinence"),
    ],
  },
  {
    key: "neurological",
    label: "Neurological",
    conditions: [
      C("migraine", "Migraine", "migraine"),
      C("tension_headache", "Tension-type headache", "tension-type headache"),
      C("epilepsy", "Epilepsy", "epilepsy"),
      C("parkinson", "Parkinson disease", "parkinsonism"),
      C("dementia", "Dementia", "dementia"),
      C("neuropathy", "Peripheral neuropathy", "polyneuropathy"),
      C("bells_palsy", "Facial nerve palsy", "facial nerve disorder"),
      C("vertigo", "Vertigo", "vertigo"),
    ],
  },
  {
    key: "musculoskeletal",
    label: "Musculoskeletal",
    conditions: [
      C("osteoarthritis", "Osteoarthritis", "osteoarthritis"),
      C("ra", "Rheumatoid arthritis", "rheumatoid arthritis"),
      C("low_back_pain", "Low back pain", "low back pain"),
      C("neck_pain", "Neck pain", "neck pain"),
      C("shoulder_pain", "Shoulder pain", "shoulder lesion"),
      C("fibromyalgia", "Fibromyalgia", "fibromyalgia"),
      C("osteoporotic_fracture", "Fragility fracture", "fracture"),
      C("tendinopathy", "Tendinopathy", "tendon disorder"),
    ],
  },
  {
    key: "dermatology",
    label: "Dermatology",
    conditions: [
      C("eczema", "Atopic dermatitis", "atopic dermatitis"),
      C("psoriasis", "Psoriasis", "psoriasis"),
      C("acne", "Acne", "acne"),
      C("fungal_skin", "Dermatophyte infection", "dermatophytosis"),
      C("urticaria", "Urticaria", "urticaria"),
      C("cellulitis_skin", "Bacterial skin infection", "bacterial infection of skin"),
      C("skin_lesion", "Unspecified skin lesion", "lesion of skin"),
      C("scabies", "Scabies", "scabies"),
    ],
  },
  {
    key: "mental_health",
    label: "Mental health",
    conditions: [
      C("depression", "Depressive episode", "depressive episode"),
      C("recurrent_depression", "Recurrent depressive disorder", "recurrent depressive disorder"),
      C("anxiety", "Generalised anxiety disorder", "generalised anxiety disorder"),
      C("panic", "Panic disorder", "panic disorder"),
      C("ocd", "Obsessive-compulsive disorder", "obsessive-compulsive disorder"),
      C("ptsd", "Post-traumatic stress disorder", "post-traumatic stress disorder"),
      C("bipolar", "Bipolar type I disorder", "bipolar type I disorder"),
      C("alcohol_use", "Harmful alcohol use", "harmful pattern of use of alcohol"),
      C("tobacco_dependence", "Tobacco dependence", "tobacco dependence"),
      C("self_harm", "Intentional self-harm", "intentional self-harm"),
    ],
  },
  {
    key: "womens_health",
    label: "Women's health and maternity",
    conditions: [
      C("pcos", "Polycystic ovary syndrome", "polycystic ovary syndrome"),
      C("endometriosis", "Endometriosis", "endometriosis"),
      C("menopause", "Menopausal and perimenopausal disorder", "menopausal disorder"),
      C("dysmenorrhoea", "Dysmenorrhoea", "dysmenorrhoea"),
      C("vaginitis", "Vaginitis", "vaginitis"),
      C("antenatal_care", "Antenatal care of normal pregnancy", "supervision of normal pregnancy"),
      C("postnatal_care", "Postpartum care", "postpartum care"),
      C("gestational_hypertension", "Gestational hypertension", "gestational hypertension"),
      C("gestational_diabetes", "Gestational diabetes", "gestational diabetes"),
      C("postnatal_depression", "Postpartum depression", "postpartum depression"),
      C("ectopic", "Ectopic pregnancy", "ectopic pregnancy"),
      C("miscarriage", "Spontaneous miscarriage", "spontaneous abortion"),
    ],
  },
  {
    key: "child_health",
    label: "Child and adolescent health",
    conditions: [
      C("well_child", "Health examination of child", "health examination"),
      C("growth_faltering", "Failure to thrive", "failure to thrive"),
      C("acute_otitis", "Acute otitis media", "acute otitis media"),
      C("bronchiolitis", "Bronchiolitis", "bronchiolitis"),
      C("croup", "Croup", "acute obstructive laryngitis"),
      C("asthma_child", "Childhood asthma", "asthma"),
      C("febrile_seizure", "Febrile seizure", "febrile seizure"),
      C("developmental_delay", "Developmental delay", "developmental delay"),
      C("adhd", "Attention deficit hyperactivity disorder", "attention deficit hyperactivity disorder"),
      C("malnutrition", "Malnutrition", "malnutrition"),
      C("worm_infection", "Intestinal helminthiasis", "helminthiasis"),
    ],
  },
  {
    key: "geriatric",
    label: "Geriatric syndromes",
    conditions: [
      C("frailty", "Frailty", "frailty"),
      C("falls", "Recurrent falls", "recurrent falls"),
      C("delirium", "Delirium", "delirium"),
      C("cognitive_decline", "Cognitive decline", "cognitive impairment"),
      C("pressure_ulcer", "Pressure ulcer", "pressure ulcer"),
      C("sarcopenia", "Sarcopenia", "sarcopenia"),
      C("polypharmacy", "Polypharmacy review", "polypharmacy"),
      C("elder_maltreatment", "Maltreatment of older person", "maltreatment"),
    ],
  },
  {
    key: "preventive",
    label: "Preventive encounters and counselling",
    conditions: [
      C("immunization", "Immunization encounter", "immunization"),
      C("screening", "Health screening encounter", "screening"),
      C("counselling_diet", "Dietary counselling", "dietary counselling"),
      C("counselling_smoking", "Smoking cessation advice", "tobacco use counselling"),
      C("contraception_advice", "Contraceptive counselling", "contraceptive advice"),
      C("travel_advice", "Pre-travel health advice", "travel medicine"),
      C("preconception", "Preconception counselling", "preconception care"),
      C("weight_management", "Weight management counselling", "weight reduction"),
    ],
  },
];

export const FM_ICD11_CONDITION_COUNT = FM_ICD11_GROUPS.reduce((n, g) => n + g.conditions.length, 0);

export const fmIcdGroup = (key) => FM_ICD11_GROUPS.find((g) => g.key === key) || null;