// Rheumatology clinical document catalogue — the existing AMedix Rheumatology
// note types, strengthened in place. The seven original note keys are kept
// exactly as they were (rheum_consultation, rheum_followup,
// rheum_activity_followup, rheum_therapy_record, rheum_infusion_record,
// rheum_progress_note, rheum_discharge_summary) — only their clinical content
// is deepened. Three further note types the department documents but the
// catalogue did not yet offer are added alongside them (urgent consultation,
// inpatient consultation, second opinion); nothing is duplicated.
//
// Content is aligned with WHO ICD-11 (musculoskeletal and immune-mediated
// condition documentation), the American College of Rheumatology (ACR) and the
// European Alliance of Associations for Rheumatology (EULAR): structured
// history and review of systems, examination performed systematically and
// never defaulted to normal, treat-to-target disease-activity measurement,
// infection-risk screening before immunosuppression, reproductive planning on
// DMARDs/biologics, and explicit shared-decision documentation.
//
// Fields use the same shape as the rest of the clinical system (key, label,
// type, options, section, required) plus one addition: `showIf` — a field is
// shown only when its controlling answer matches, so clinically relevant
// questions appear without presenting an unrelated wall of inputs.
// Nothing is ever marked normal by default: unanswered stays unanswered.

import { THERAPEUTIC_TARGETS, TARGET_STATUS } from "@/lib/rheumFollowup";

const I = (key, label, x = {}) => ({ key, label, type: "input", ...x });
const N = (key, label, x = {}) => ({ key, label, type: "number", ...x });
const T = (key, label, x = {}) => ({ key, label, type: "textarea", ...x });
const S = (key, label, options, x = {}) => ({ key, label, type: "select", options, ...x });

// Required documentation must be answered before the note is saved.
const R = { required: true };
// Shown only when the controlling field holds one of these answers.
const when = (key, ...values) => ({ showIf: { key, in: values } });
// Groups the following fields under one heading inside the same note.
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

const YES_NO_UNK = ["Yes", "No", "Unknown"];
const NOT_ASSESSED = ["Not assessed", "Normal", "Abnormal"];
const ROS_OPTIONS = ["Not asked", "Negative", "Positive — see detail"];
const ROS_POSITIVE = "Positive — see detail";
const PRESENT = "Present — see details";

// ---- Review of systems ------------------------------------------------
// Every system is asked explicitly. "Not asked" stays the empty state so an
// unreviewed system can never be read as normal.
const ROS_SYSTEMS = [
  ["constitutional", "Constitutional", "fever, weight loss, night sweats, fatigue"],
  ["musculoskeletal", "Musculoskeletal", "joint pain, swelling, stiffness, weakness"],
  ["skin", "Skin & Nails", "rash, psoriasis, nodules, ulcers, Raynaud, nail changes"],
  ["ocular", "Ocular", "redness, pain, photophobia, visual change, dryness"],
  ["respiratory", "Respiratory", "cough, breathlessness, pleuritic pain, haemoptysis"],
  ["cardiovascular", "Cardiovascular", "chest pain, palpitations, claudication, oedema"],
  ["renal", "Renal & Urinary", "oedema, haematuria, urine output, dysuria"],
  ["gastrointestinal", "Gastrointestinal", "dysphagia, abdominal pain, diarrhoea, bleeding"],
  ["neurological", "Neurological", "weakness, sensory loss, headache, seizures, cognition"],
];

const rosFields = (keys = ROS_SYSTEMS.map(([k]) => k)) =>
  ROS_SYSTEMS.filter(([k]) => keys.includes(k)).flatMap(([k, label, hint]) => [
    S(`ros_${k}`, `${label} — ${hint}`, ROS_OPTIONS),
    T(`ros_${k}_detail`, `${label} — Details & Duration`, when(`ros_${k}`, ROS_POSITIVE)),
  ]);

// ---- Joint-by-joint assessment ---------------------------------------
const JOINT_STATUS = [
  "Not examined",
  "Normal",
  "Tender",
  "Swollen",
  "Tender & swollen",
  "Deformity",
  "Reduced range of motion",
  "Not assessable",
];
const JOINT_REGIONS = [
  ["shoulders", "Shoulders"],
  ["elbows", "Elbows"],
  ["wrists", "Wrists"],
  ["mcps", "Metacarpophalangeal joints (MCPs)"],
  ["pips", "Proximal interphalangeal joints (PIPs)"],
  ["dips", "Distal interphalangeal joints (DIPs)"],
  ["hips", "Hips"],
  ["knees", "Knees"],
  ["ankles", "Ankles & Feet"],
  ["mtps", "Metatarsophalangeal joints (MTPs)"],
  ["cervical_spine", "Cervical spine"],
  ["thoracolumbar_spine", "Thoracic & lumbar spine"],
  ["sacroiliac", "Sacroiliac joints"],
];
const jointFields = (regions = JOINT_REGIONS) => regions.map(([k, label]) => S(`joint_${k}`, label, JOINT_STATUS));

// Enthesitis (EULAR/GRAPPA points) and dactylitis — recorded where relevant.
const enthesitisFields = [
  S("enthesitis_present", "Enthesitis", ["Not assessed", "Absent", PRESENT]),
  I("enthesitis_sites", "Enthesitis — Sites (Achilles, plantar fascia, epicondyles, greater trochanter, patella)", when("enthesitis_present", PRESENT)),
  S("dactylitis_present", "Dactylitis", ["Not assessed", "Absent", PRESENT]),
  I("dactylitis_digits", "Dactylitis — Digits Involved", when("dactylitis_present", PRESENT)),
];

// ---- Extra-articular assessment --------------------------------------
const EA_OPTIONS = ["Not assessed", "Absent", PRESENT];
const EA_ITEMS = [
  ["ea_skin", "Skin & Nails — psoriasis, rash, nodules, ulcers, sclerodactyly"],
  ["ea_eyes", "Eyes — uveitis, episcleritis or scleritis, sicca"],
  ["ea_oral_nasal", "Oral & Nasal — ulcers, sicca, nasal crusting or collapse"],
  ["ea_respiratory", "Respiratory — fine crackles, pleural rub, reduced expansion"],
  ["ea_cardiac", "Cardiovascular — murmur, pericardial rub, pulse loss, hypertension"],
  ["ea_renal", "Renal — hypertension, oedema, haematuria"],
  ["ea_gi", "Gastrointestinal & Hepatic"],
  ["ea_neuro", "Neurological — mononeuritis multiplex, peripheral neuropathy"],
  ["ea_nodes", "Lymph Nodes & Spleen"],
];
const extraArticularFields = () => [
  ...EA_ITEMS.map(([k, label]) => S(k, label, EA_OPTIONS)),
  ...EA_ITEMS.slice(0, 6).map(([k, label]) => T(`${k}_detail`, `${label.split(" — ")[0]} — Details`, when(k, PRESENT))),
];

// ---- Standard history blocks -----------------------------------------
const infectionRiskFields = () => [
  S("prior_serious_infection", "Previous Serious Infection (requiring admission or IV therapy)", ["None", "Yes — documented below", "Unknown"]),
  I("prior_infection_detail", "Previous Serious Infection — Organism, Site, Year", when("prior_serious_infection", "Yes — documented below")),
  S("hepatitis_b", "Hepatitis B Status", ["Not tested", "Immune — vaccinated", "Immune — past infection", "Not immune", "Chronic HBV"]),
  S("hepatitis_c", "Hepatitis C Status", ["Not tested", "Negative", "Positive"]),
  S("hiv_status", "HIV Status", ["Not tested", "Negative", "Positive"]),
  S("tb_screening", "Tuberculosis Screening (IGRA / Mantoux / chest radiograph)", ["Not done", "Negative", "Latent TB — treatment indicated", "Active TB excluded"]),
  S("vaccination_status", "Vaccination Status — influenza, pneumococcal, COVID-19, zoster, HPV", ["Up to date", "Incomplete", "Not vaccinated", "Unknown"]),
  S("live_vaccine_recent", "Live Vaccine in the Past 4 Weeks", ["No", "Yes", "Unknown"]),
];

const reproductiveFields = () => [
  S("reproductive_relevance", "Reproductive Health Documentation", ["Not applicable to this patient", "Relevant — document below"]),
  S("pregnancy_status", "Pregnancy Status", ["Not pregnant", "Pregnant", "Unknown"], when("reproductive_relevance", "Relevant — document below")),
  I("gestational_age", "Gestational Age / EDD", {}, when("reproductive_relevance", "Relevant — document below")),
  S("breastfeeding", "Breastfeeding", ["No", "Yes", "Unknown"], when("reproductive_relevance", "Relevant — document below")),
  S("contraception", "Contraception", ["None", "Barrier", "Combined hormonal", "Progestogen only", "Intrauterine device", "Sterilisation", "Not applicable"], when("reproductive_relevance", "Relevant — document below")),
  S("conception_plans", "Conception Plans", ["Not planning", "Planning within 12 months", "Planning later", "Unknown"], when("reproductive_relevance", "Relevant — document below")),
  T("menstrual_pattern", "Menstrual Pattern", {}, when("reproductive_relevance", "Relevant — document below")),
  T("teratogen_counselling", "Teratogenicity Counselling — methotrexate, leflunomide, biologics", {}, when("reproductive_relevance", "Relevant — document below")),
];

const functionalFields = () => [
  S("functional_status", "Functional Status", ["Independent", "Mild limitation", "Moderate limitation", "Severe limitation", "Bed-bound"]),
  S("gait", "Gait", ["Not examined", "Normal", "Antalgic", "Abnormal — other"]),
  S("muscle_strength", "Muscle Strength", ["Not examined", "Normal (5/5)", "Mild reduction (4/5)", "Marked weakness (≤3/5)", "Not assessable"]),
  T("deformities", "Deformities & Alignment"),
  S("work_impact", "Work / Education Impact", ["None", "Reduced hours", "Sick leave", "Unable to work", "Not applicable"]),
];

const labFields = (extra = []) => [
  T("labs_core", "Laboratory Results — CBC, ESR, CRP, renal & liver function"),
  T("labs_serology", "Immunology — RF, anti-CCP, ANA, anti-dsDNA, complement, ANCA, urate"),
  T("urinalysis", "Urinalysis — protein, blood, casts"),
  T("radiographs", "Radiographs, Ultrasound, CT or MRI Reviewed"),
  ...extra,
];

// ---- Diagnostic assessment (ICD-11) ----------------------------------
// Diagnosis selection is a documented clinical decision, never an automatic
// one: each diagnosis carries its official ICD-11 code and display term, its
// specificity and classification release, whether it is primary, secondary or
// differential, and its status (suspected, provisional, confirmed, historical,
// resolved, in remission) with the clinical basis recorded.
const diagnosisFields = () => [
  { key: "icd11_diagnoses", label: "Diagnoses (ICD-11) — role, status and clinical basis", type: "icd11_diagnoses" },
  T("diagnostic_reasoning", "Diagnostic Reasoning — how the history, examination and results support or refute each diagnosis"),
  T("differential_diagnoses", "Alternative & Excluded Diagnoses — the evidence that excluded them"),
  S("disease_phenotype", "Disease Phenotype / Pattern", [
    "Not determined",
    "Monoarticular",
    "Oligoarticular",
    "Polyarticular",
    "Axial",
    "Peripheral with enthesitis",
    "Systemic / multi-organ",
    "Overlap",
    "Other",
  ]),
  S("symptom_duration", "Symptom Duration at Assessment", ["< 6 weeks", "6 weeks – 3 months", "3–12 months", "> 12 months", "Unknown"]),
  S("severity_assessment", "Severity Assessment", ["Mild", "Moderate", "Severe", "Life- or organ-threatening", "Not assessed"]),
  T("organ_involvement", "Organ Involvement — skin, eyes, joints, renal, pulmonary, cardiac, neurological, haematological"),
  T("disease_complications", "Complications — erosive damage, deformity, contracture, amyloidosis, infection, thrombosis, osteoporosis"),
  T("comorbidities", "Comorbidities Relevant to This Disease and Its Treatment"),
  T("outstanding_investigations", "Outstanding Investigations & Results Awaited — who will review them"),
];

// Structured investigation tracking — panels of relevant laboratory,
// serological, imaging and procedural investigations. Nothing is ordered
// automatically; the clinician selects what is indicated and records the
// indication, result, units, reference range, interpretation and follow-up.
const investigationFields = () => [
  { key: "investigation_panels", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
];

// A note template's structured examination is the shared Dynamic Examination
// Engine interface: a field labelled as an examination is rendered as the
// searchable "Select Examination" component for Rheumatology (musculoskeletal,
// general, dermatological, free-form), so findings are documented
// structurally and never assumed.
const examinationPlaceholder = (section, label = "Musculoskeletal & General Examination") => ({
  key: "structured_examination",
  label,
  type: "textarea",
  section,
});

export const RHEUMATOLOGY_DOCS = [
  // ---- 1. Initial consultation ---------------------------------------
  {
    key: "rheum_consultation",
    label: "Rheumatology Consultation",
    specialty: "rheumatology",
    fields: [
      ...sec("Referral & Encounter", [
        I("referral_source", "Referral Source"),
        T("referral_reason", "Reason for Referral"),
        T("patient_priorities", "Patient's Own Concerns & Goals of Care"),
      ]),
      ...sec("Chief Complaint & History of Present Illness", [
        T("chief_complaint", "Chief Complaint", R),
        T("hpi", "History of Present Illness — onset, site, radiation, character, timing, aggravating and relieving factors, severity", R),
        S("onset_pattern", "Onset", ["Acute (< 6 weeks)", "Subacute (6 weeks – 3 months)", "Chronic (> 3 months)"]),
        S("disease_course", "Course", ["Monocyclic", "Polycyclic", "Progressive", "Relapsing-remitting", "Unclear"]),
        S("symptom_pattern", "Symptom Pattern", ["Inflammatory", "Mechanical", "Mixed", "Unclear"]),
        T("pertinent_negatives", "Pertinent Negatives"),
      ]),
      ...sec("Musculoskeletal Symptom Detail", [
        S("joint_pattern", "Joint Involvement Pattern", ["Monoarticular", "Oligoarticular (2–4)", "Polyarticular (≥ 5)", "Axial only", "Mixed"]),
        S("symmetry", "Symmetry", ["Symmetrical", "Asymmetrical", "Not applicable"]),
        S("joint_distribution", "Distribution", ["Small joints of hands/feet", "Large joints", "Both", "Axial", "Entheseal", "Not applicable"]),
        S("morning_stiffness", "Morning Stiffness", ["None", "< 30 minutes", "30–60 minutes", "> 60 minutes"]),
        S("stiffness_activity", "Stiffness Improves with Activity", YES_NO_UNK),
        S("night_pain", "Night Pain Waking the Patient", YES_NO_UNK),
        S("inflammatory_back_pain", "Inflammatory Back Pain (ASAS criteria features)", ["Absent", "Present — documented below", "Not assessed"]),
        T("inflammatory_back_pain_detail", "Inflammatory Back Pain — Features (onset < 40, insidious, improves with exercise, no improvement with rest, night pain)", {}, when("inflammatory_back_pain", "Present — documented below")),
        S("acute_hot_joint", "Acute Hot Swollen Joint", YES_NO_UNK),
        T("acute_hot_joint_detail", "Acute Hot Joint — Site, Duration, Fever, Suspected Source (urgent assessment)", {}, when("acute_hot_joint", "Yes")),
        T("functional_impact", "Impact on Daily Function, Self-Care & Work"),
      ]),
      ...sec("Review of Systems", [
        ...rosFields(),
      ]),
      ...sec("Past Medical, Surgical & Family History", [
        T("pmh", "Past Medical History & Comorbidities (diabetes, hypertension, renal, hepatic, malignancy, thyroid)"),
        T("surgical_history", "Past Surgical History"),
        T("hospitalisations", "Previous Hospital Admissions"),
        T("family_history", "Family History"),
        S("family_autoimmune", "Family History of Autoimmune or Inflammatory Disease", ["None known", "First-degree relative", "Other relative", "Unknown"]),
      ]),
      ...sec("Social History", [
        S("smoking", "Smoking Status", ["Never", "Former", "Current", "Unknown"]),
        I("pack_years", "Pack-Years", {}, when("smoking", "Current")),
        S("alcohol", "Alcohol Intake", ["None", "Occasional", "Regular", "Unknown"]),
        T("occupation_exposures", "Occupation, Physical Demands & Exposures (silica, solvents, sun)"),
        T("living_support", "Living Situation & Support at Home"),
      ]),
      ...sec("Medication & Treatment History", [
        T("medications", "Current Medications (including over-the-counter, herbal and supplements)"),
        T("previous_treatments", "Previous DMARD / Biologic / Targeted Therapy — drug, dose, duration, reason stopped"),
        S("corticosteroid_history", "Glucocorticoid Use", ["None", "Current", "Previous", "Unknown"]),
        I("corticosteroid_detail", "Glucocorticoid — Preparation, Current Daily Dose, Cumulative Duration", {}, when("corticosteroid_history", "Current", "Previous")),
        S("nsaid_use", "NSAID Use", ["None", "Occasional", "Regular", "Contraindicated"]),
        T("adverse_effects", "Previous Adverse Drug Reactions / Intolerance"),
        T("allergies", "Allergies"),
        S("adherence", "Reported Treatment Adherence", ["Full", "Partial — documented below", "Not taking", "Not applicable"]),
        T("adherence_detail", "Adherence — Reasons and Barriers", {}, when("adherence", "Partial — documented below", "Not taking")),
      ]),
      ...sec("Infection Risk & Pre-Treatment Screening", [
        ...infectionRiskFields(),
      ]),
      ...sec("Reproductive History (where relevant)", [
        ...reproductiveFields(),
      ]),
      ...sec("Examination", [
        { key: "vitals", label: "Vital Signs", type: "vitals" },
        examinationPlaceholder("Examination"),
        S("grip_strength", "Grip Strength", ["Not examined", "Normal", "Reduced — right", "Reduced — left", "Reduced — bilateral"]),
      ]),
      ...sec("Joint-by-Joint Assessment", [
        N("tender_joint_count", "Tender Joint Count (28-joint)"),
        N("swollen_joint_count", "Swollen Joint Count (28-joint)"),
        ...jointFields(),
        T("other_joints", "Other Joints Involved"),
        ...enthesitisFields,
      ]),
      ...sec("Extra-Articular Assessment", [
        ...extraArticularFields(),
      ]),
      ...sec("Muscle Strength, Gait & Function", [
        ...functionalFields(),
      ]),
      ...sec("Laboratory & Radiographic Review", [
        ...labFields(),
        ...investigationFields(),
      ]),
      ...sec("Diagnostic Assessment (ICD-11)", [
        ...diagnosisFields(),
      ]),
      ...sec("Assessment", [
        T("assessment", "Assessment — Clinical Reasoning & Differential Diagnosis (ICD-11)"),
        S("classification_criteria", "Classification Criteria Met", [
          "Not assessed",
          "Rheumatoid Arthritis — ACR/EULAR 2010",
          "SLE — EULAR/ACR 2019",
          "Axial Spondyloarthritis — ASAS",
          "Psoriatic Arthritis — CASPAR",
          "Gout — ACR/EULAR 2015",
          "Systemic Sclerosis — ACR/EULAR 2013",
          "Sjögren — ACR/EULAR 2016",
          "Vasculitis — ACR/EULAR 2022",
          "Other",
        ]),
        S("disease_activity", "Overall Disease Activity (clinician judgement)", ["Remission", "Low", "Moderate", "High", "Not assessed"]),
        S("damage_risk", "Structural Damage / Poor-Prognosis Features", ["None identified", "Present — documented below", "Not assessed"]),
        T("damage_risk_detail", "Poor-Prognosis Features — erosions, extra-articular disease, high serology, functional loss", {}, when("damage_risk", "Present — documented below")),
      ]),
      ...sec("Plan", [
        {
          key: "structured_treatment_plan",
          label: "Structured Treatment Plan & Monitoring — ACR/EULAR-aligned decision support",
          type: "rheum_treatment",
        },
        T("treatment_plan", "Treatment Plan"),
        T("dmard_plan", "DMARD / Biologic Decision (agent, dose, baseline monitoring)"),
        T("glucocorticoid_plan", "Glucocorticoid Plan (dose, tapering schedule, bone protection)"),
        T("non_pharmacological", "Non-Pharmacological Care — physiotherapy, exercise, smoking cessation, diet, self-management"),
        T("monitoring_plan", "Monitoring & Safety Plan — bloods, infection advice, when to seek urgent care"),
        T("shared_decision", "Shared Decision-Making & Education Documented"),
        I("followup_interval", "Follow-Up Interval"),
      ]),
    ],
  },

  // ---- 2. Urgent consultation ----------------------------------------
  {
    key: "rheum_urgent_consultation",
    label: "Rheumatology Urgent Consultation",
    specialty: "rheumatology",
    fields: [
      ...sec("Urgency & Referral", [
        S("urgency_level", "Urgency", ["Same-day clinic review", "Emergency department review", "Inpatient review", "Telephone triage"]),
        I("referral_source", "Referral Source"),
        T("urgent_reason", "Reason for Urgent Review", R),
        S("time_of_assessment", "Time of Assessment", ["Within 1 hour", "Within 4 hours", "Same day", "Next working day"]),
      ]),
      ...sec("Red Flags", [
        S("rf_septic_joint", "Suspected Septic Arthritis / Acute Hot Joint", ["Absent", "Suspected", PRESENT]),
        S("rf_cord", "Cord Compression / New Neurological Deficit", ["Absent", "Suspected", PRESENT]),
        S("rf_vision", "Visual Loss or Threatened Vision (giant cell arteritis)", ["Absent", "Suspected", PRESENT]),
        S("rf_vasculitis", "Organ-Threatening Vasculitis (renal, pulmonary, mesenteric, cerebral)", ["Absent", "Suspected", PRESENT]),
        S("rf_mas", "Macrophage Activation Syndrome / Cytokine Storm", ["Absent", "Suspected", PRESENT]),
        S("rf_drug_reaction", "Severe Drug Reaction (anaphylaxis, SJS/TEN, agranulocytosis)", ["Absent", "Suspected", PRESENT]),
        S("rf_apseudo", "Catastrophic Antiphospholipid Syndrome", ["Absent", "Suspected", PRESENT]),
        T("red_flag_detail", "Red Flag Findings & Immediate Actions Taken", {}, when("rf_septic_joint", "Suspected", PRESENT)),
      ]),
      ...sec("Focused History", [
        T("chief_complaint", "Chief Complaint", R),
        T("hpi", "History of Present Illness — onset, progression, systemic features, fever"),
        ...rosFields(["constitutional", "skin", "respiratory", "renal", "neurological"]),
        T("medications", "Current Medications — immunosuppressants, biologics, anticoagulants"),
        T("recent_infection", "Recent Infection, Antibiotics or Vaccination"),
        T("allergies", "Allergies"),
        S("reproductive_relevance", "Reproductive Health Documentation", ["Not applicable to this patient", "Relevant — document below"]),
        S("pregnancy_status", "Pregnancy Status", ["Not pregnant", "Pregnant", "Unknown"], when("reproductive_relevance", "Relevant — document below")),
      ]),
      ...sec("Focused Examination", [
        { key: "vitals", label: "Vital Signs — including temperature and haemodynamic status", type: "vitals" },
        examinationPlaceholder("Focused Examination"),
        I("index_joint", "Index Joint Assessed"),
        S("index_joint_status", "Index Joint Findings", JOINT_STATUS),
        S("neuro_vascular", "Distal Neurovascular Status", ["Not assessed", "Intact", "Impaired — documented below"]),
        T("neuro_vascular_detail", "Neurovascular Findings — Sensation, Pulses, Capillary Refill", {}, when("neuro_vascular", "Impaired — documented below")),
        S("skin_red_flags", "Skin & Soft Tissue — cellulitis, necrosis, purpura, livedo", ["Not assessed", "Absent", PRESENT]),
      ]),
      ...sec("Urgent Investigations", [
        T("labs_urgent", "Laboratory Results — CBC, CRP, ESR, renal & liver function, coagulation, blood gas"),
        T("blood_cultures", "Blood Cultures / Microbiology"),
        S("joint_aspiration", "Joint Aspiration Performed", YES_NO_UNK),
        T("synovial_fluid", "Synovial Fluid — appearance, cell count, crystals, Gram stain, culture", {}, when("joint_aspiration", "Yes")),
        T("serology_urgent", "Urgent Serology — complement, ANCA, anti-GBM, cryoglobulins, blood film, ferritin"),
        T("radiographs_urgent", "Radiographs, Ultrasound or Cross-Sectional Studies"),
        ...investigationFields(),
      ]),
      ...sec("Immediate Management", [
        T("immediate_actions", "Immediate Actions & Resuscitation Measures", R),
        S("antibiotics_given", "Empirical Antibiotic Therapy", ["Not indicated", "Started — documented below", "Deferred to treating team"]),
        T("antibiotics_detail", "Antibiotic Regimen — agent, dose, route, time started", {}, when("antibiotics_given", "Started — documented below")),
        T("glucocorticoid_urgent", "Glucocorticoid Therapy — agent, dose, route, indication"),
        T("immunosuppression_hold", "Immunosuppressant / Biologic Held or Continued — rationale"),
        S("admission_decision", "Disposition", ["Admitted to hospital", "High-dependency / ICU", "Same-day discharge with review", "Referred to another specialty"]),
        T("specialty_referrals", "Urgent Specialist Referrals — orthopaedics, ophthalmology, nephrology, haematology"),
        T("safety_netting", "Safety-Netting Advice Given to Patient and Carers"),
        I("review_interval", "Review Interval / Next Assessment"),
      ]),
      ...sec("Diagnostic Assessment & Communication", [
        { key: "icd11_diagnoses", label: "Working Diagnoses (ICD-11) — role, status and clinical basis", type: "icd11_diagnoses" },
        T("differential_urgent", "Differential Diagnosis — including the immediately life-threatening alternatives"),
        T("diagnostic_reasoning", "Diagnostic Reasoning — how the findings support or refute each diagnosis"),
        T("outstanding_investigations", "Outstanding Investigations & Results Awaited"),
        S("senior_review", "Senior / Consultant Review", ["Not available", "Discussed", "Patient reviewed in person"]),
        T("communication", "Communication with Referring Team & Notes"),
      ]),
    ],
  },

  // ---- 3. Inpatient consultation -------------------------------------
  {
    key: "rheum_inpatient_consultation",
    label: "Rheumatology Inpatient Consultation",
    specialty: "rheumatology",
    fields: [
      ...sec("Admission & Consult Request", [
        I("requesting_team", "Requesting Team / Specialty"),
        T("consult_reason", "Reason for Rheumatology Consultation", R),
        I("admitting_diagnosis", "Admitting Diagnosis"),
        I("admission_date", "Date of Admission"),
        I("ward_bed", "Ward & Bed"),
      ]),
      ...sec("History", [
        T("chief_complaint", "Chief Complaint"),
        T("hpi", "History of Present Illness — course since admission, interventions so far"),
        T("pmh", "Past Medical History & Comorbidities"),
        T("pmh_dmard", "Current Immunosuppressive / DMARD Therapy"),
        T("procedures", "Recent Procedures and Devices"),
        T("recent_infection", "Recent or Current Infection, Antibiotics, Isolation Status"),
        T("allergies", "Allergies"),
        S("reproductive_relevance", "Reproductive Health Documentation", ["Not applicable to this patient", "Relevant — document below"]),
        S("pregnancy_status", "Pregnancy Status", ["Not pregnant", "Pregnant", "Unknown"], when("reproductive_relevance", "Relevant — document below")),
      ]),
      ...sec("Inpatient Review of Systems", [
        ...rosFields(["constitutional", "musculoskeletal", "skin", "respiratory", "renal"]),
      ]),
      ...sec("Examination", [
        { key: "vitals", label: "Vital Signs", type: "vitals" },
        examinationPlaceholder("Examination"),
        N("tender_joint_count", "Tender Joint Count"),
        N("swollen_joint_count", "Swollen Joint Count"),
        ...jointFields([["knees", "Knees"], ["wrists", "Wrists"], ["mcps", "Metacarpophalangeal joints (MCPs)"], ["ankles", "Ankles & Feet"]]),
        ...enthesitisFields,
      ]),
      ...sec("Extra-Articular Assessment", [
        ...extraArticularFields(),
      ]),
      ...sec("Inpatient Risk Assessment", [
        S("infection_risk", "Infection Risk on Immunosuppression", ["Low", "Moderate", "High", "Established infection"]),
        S("vte_risk", "Venous Thromboembolism Risk", ["Low", "Moderate", "High — prophylaxis indicated"]),
        S("fracture_risk", "Osteoporosis / Fragility Fracture Risk", ["Not assessed", "Low", "Moderate", "High"]),
        S("steroid_cover", "Glucocorticoid Stress Coverage Required", ["No", "Yes", "Not applicable"]),
        S("renal_hepatic", "Renal / Hepatic Impairment Affecting Drug Dosing", ["None", "Renal impairment", "Hepatic impairment", "Both"]),
        S("falls_risk", "Falls Risk", ["Low", "Moderate", "High"]),
      ]),
      ...sec("Investigations", [
        T("labs_inpatient", "Laboratory Results — CBC, CRP, ESR, renal & hepatic, urinalysis"),
        T("microbiology", "Microbiology & Serology"),
        T("radiographs_inpatient", "Radiographs, Ultrasound, CT or MRI Reviewed"),
        ...investigationFields(),
      ]),
      ...sec("Diagnostic Assessment (ICD-11)", [
        ...diagnosisFields(),
      ]),
      ...sec("Assessment & Management", [
        T("assessment", "Clinical Assessment & Impression"),
        T("immunosuppression_plan", "Immunosuppressive Therapy Plan — continue, hold, adjust"),
        T("glucocorticoid_plan", "Glucocorticoid Plan — dose, route, taper, bone protection"),
        T("infection_management", "Infection Treatment & Prophylaxis"),
        T("medication_reconciliation", "Medication Reconciliation & Interactions"),
        T("supportive_care", "Supportive Care — analgesia, physiotherapy, nutrition, VTE prophylaxis, pressure care"),
        T("discharge_planning", "Discharge Planning — criteria, rehabilitation, community support"),
        T("followup_plan", "Rheumatology Follow-Up Plan"),
      ]),
    ],
  },

  // ---- 4. Follow-up ---------------------------------------------------
  {
    key: "rheum_followup",
    label: "Rheumatology Follow-Up",
    specialty: "rheumatology",
    fields: [
      ...sec("Interval History", [
        I("previous_review_date", "Date of Previous Rheumatology Review"),
        I("previous_document_reference", "Previous Note / Document Reference"),
        T("interval_history", "Interval History Since Last Review", R),
        S("flare_since_visit", "Flare Since Last Visit", ["No", "Yes — documented below", "Ongoing flare"]),
        S("flare_frequency", "Flare Frequency Since Last Visit", ["None", "One flare", "Two or more flares", "Continuous active disease", "Not applicable"]),
        T("flare_detail", "Flare — Timing, Triggers, Joints Involved, Treatment Used", {}, when("flare_since_visit", "Yes — documented below", "Ongoing flare")),
        T("symptoms", "Current Symptoms"),
        S("morning_stiffness", "Morning Stiffness", ["None", "< 30 minutes", "30–60 minutes", "> 60 minutes"]),
        T("patient_priorities", "Patient's Concerns & Priorities Today"),
      ]),
      ...sec("Interval Comparison — Previous Review vs Today", [
        { key: "interval_comparison", label: "Domain-by-domain comparison with the previous review", type: "rheum_comparison" },
      ]),
      ...sec("Review of Systems", [
        ...rosFields(["constitutional", "skin", "ocular", "respiratory", "neurological"]),
      ]),
      ...sec("Medication Review", [
        T("medications", "Current Medications"),
        S("medication_response", "Response to Current Therapy", ["Full", "Partial", "None", "Intolerant", "Not applicable"]),
        S("adherence", "Reported Adherence", ["Full", "Partial — documented below", "Not taking", "Not applicable"]),
        T("adherence_detail", "Adherence — Reasons and Barriers", {}, when("adherence", "Partial — documented below", "Not taking")),
        S("side_effects", "Adverse Effects Since Last Visit", ["None", "Present — documented below"]),
        T("side_effects_detail", "Adverse Effects — Agent, Effect, Action Taken", {}, when("side_effects", "Present — documented below")),
        S("infections_since_visit", "Infections Since Last Visit", ["None", "One or more — documented below"]),
        T("infections_detail", "Infections — Site, Organism, Treatment, Course", {}, when("infections_since_visit", "One or more — documented below")),
      ]),
      ...sec("Examination", [
        { key: "vitals", label: "Vital Signs", type: "vitals" },
        examinationPlaceholder("Examination"),
        N("tender_joint_count", "Tender Joint Count (28-joint)"),
        N("swollen_joint_count", "Swollen Joint Count (28-joint)"),
        ...jointFields([["wrists", "Wrists"], ["mcps", "Metacarpophalangeal joints (MCPs)"], ["pips", "Proximal interphalangeal joints (PIPs)"], ["knees", "Knees"], ["ankles", "Ankles & Feet"], ["mtps", "Metatarsophalangeal joints (MTPs)"]]),
        N("pain_score", "Pain Score (0–10)"),
        N("patient_global", "Patient Global Assessment (0–10)"),
        N("physician_global", "Physician Global Assessment (0–10)"),
        ...functionalFields(),
      ]),
      ...sec("Disease Activity & Safety Monitoring", [
        S("disease_activity", "Disease Activity", ["Remission", "Low", "Moderate", "High", "Not assessed"]),
        {
          key: "activity_instruments",
          label: "Validated Disease Activity & Functional Instruments — scored only when all inputs are entered",
          type: "disease_activity",
          instruments: ["das28_crp", "das28_esr", "cdai", "sdai", "basdai", "asdas_crp", "sledai_2k", "dapsa", "haq_di"],
        },
        S("therapeutic_target", "Therapeutic Target (treat-to-target)", THERAPEUTIC_TARGETS),
        S("target_status", "Target Achieved at This Review", TARGET_STATUS),
        T("target_barriers", "Barriers When the Target Was Not Achieved — adherence, toxicity, cost, access, comorbidity", {}, when("target_status", "Partially met", "Not met")),
        T("labs_monitoring", "Laboratory Monitoring — CBC, ESR, CRP, renal, hepatic, urinalysis"),
        S("labs_trend", "Laboratory Trend Since Previous Review", ["Improved", "Stable", "Worsening", "Not comparable", "Not assessed"]),
        T("labs_trend_detail", "Laboratory Trend — the values compared and their significance"),
        T("radiographs", "Radiographs or MRI Reviewed"),
        S("imaging_trend", "Imaging Trend Since Previous Review", ["Improved", "Stable", "Worsening", "No interval imaging", "Not assessed"]),
        T("imaging_trend_detail", "Imaging Trend — findings compared with the previous study"),
        T("bone_health", "Bone Health & Fracture Risk Review"),
        T("cardiovascular_risk", "Cardiovascular Risk Review"),
        ...investigationFields(),
      ]),
      ...sec("Assessment & Plan", [
        { key: "icd11_diagnoses", label: "Diagnoses (ICD-11) — status at this review", type: "icd11_diagnoses" },
        T("diagnostic_reasoning", "Diagnostic Reasoning — including any change in diagnosis"),
        T("assessment", "Assessment"),
        {
          key: "structured_treatment_plan",
          label: "Structured Treatment Plan & Monitoring — ACR/EULAR-aligned decision support",
          type: "rheum_treatment",
        },
        T("plan", "Plan — treat-to-target decisions, dose changes, tapering"),
        T("monitoring_plan", "Monitoring & Safety Plan"),
        T("education", "Education & Self-Management Advice Given"),
        I("followup_interval", "Next Review Interval"),
      ]),
    ],
  },

  // ---- 5. Second opinion ----------------------------------------------
  {
    key: "rheum_second_opinion",
    label: "Rheumatology Second Opinion",
    specialty: "rheumatology",
    fields: [
      ...sec("Request & Records", [
        I("referring_doctor", "Referring Doctor / Facility"),
        T("second_opinion_reason", "Reason for Second Opinion", R),
        S("records_reviewed", "Records Available for Review", ["Complete records", "Partial records", "Summary only", "Verbal history only"]),
        I("current_diagnosis", "Current Working Diagnosis"),
        I("diagnosis_date", "Date of Diagnosis"),
        T("treatment_to_date", "Treatment Received to Date"),
      ]),
      ...sec("Independent History", [
        T("chief_complaint", "Chief Complaint"),
        T("hpi", "History of Present Illness (taken independently)"),
        T("pmh", "Relevant Past Medical & Surgical History"),
        T("family_history", "Family History"),
        T("medications", "Current Medications and Previous Therapies"),
        T("allergies", "Allergies & Intolerances"),
      ]),
      ...sec("Review of Systems", [
        ...rosFields(["constitutional", "musculoskeletal", "skin", "ocular", "renal"]),
      ]),
      ...sec("Examination", [
        { key: "vitals", label: "Vital Signs", type: "vitals" },
        examinationPlaceholder("Examination"),
        N("tender_joint_count", "Tender Joint Count"),
        N("swollen_joint_count", "Swollen Joint Count"),
        ...jointFields([["wrists", "Wrists"], ["mcps", "Metacarpophalangeal joints (MCPs)"], ["knees", "Knees"], ["ankles", "Ankles & Feet"]]),
        ...functionalFields(),
      ]),
      ...sec("Review of the Evidence", [
        T("investigations_reviewed", "Laboratory & Serology Results Reviewed"),
        T("radiographs_reviewed", "Radiographs & Cross-Sectional Studies Reviewed"),
        ...investigationFields(),
        S("diagnosis_concordance", "Agreement with the Referring Diagnosis", ["Agree", "Partially agree", "Disagree", "Insufficient information"]),
        { key: "icd11_diagnoses", label: "Diagnoses (ICD-11) — role, status and clinical basis", type: "icd11_diagnoses" },
        T("diagnostic_reasoning", "Diagnostic Reasoning & Alternative Diagnoses"),
        T("criteria_applied", "Classification Criteria Applied and Result"),
        T("treatment_appraisal", "Appraisal of Current Treatment — appropriateness, dose, monitoring"),
        S("additional_workup", "Additional Workup Recommended", ["None", "Yes — documented below"]),
        T("additional_workup_detail", "Additional Workup — Tests Requested and Rationale", {}, when("additional_workup", "Yes — documented below")),
      ]),
      ...sec("Opinion & Recommendations", [
        T("opinion", "Second-Opinion Conclusion"),
        T("recommendations", "Recommendations — investigations, therapy changes, monitoring"),
        T("risk_discussion", "Risks, Benefits & Alternatives Discussed with the Patient"),
        S("communication_with_referrer", "Communication with Referring Clinician", ["Letter sent", "Telephone discussion", "Pending", "Patient declined"]),
        I("followup_plan", "Follow-Up Plan"),
      ]),
    ],
  },

  // ---- 6. Disease activity follow-up ---------------------------------
  {
    key: "rheum_activity_followup",
    label: "Disease Activity Follow-Up",
    specialty: "rheumatology",
    fields: [
      ...sec("Disease & Target", [
        S("disease", "Disease", [
          "Rheumatoid Arthritis",
          "Systemic Lupus Erythematosus",
          "Psoriatic Arthritis",
          "Axial Spondyloarthritis",
          "Gout",
          "Polymyalgia Rheumatica / Giant Cell Arteritis",
          "Systemic Sclerosis",
          "Sjögren's Syndrome",
          "Mixed Connective Tissue Disease",
          "Vasculitis",
          "Juvenile Idiopathic Arthritis",
          "Other",
        ]),
        S("treatment_target", "Treat-to-Target Aim", ["Remission", "Low disease activity", "Symptom control", "Not applicable"]),
        S("target_met", "Target Met at This Review", ["Yes", "No — escalate", "No — continue and reassess", "Not assessed"]),
        { key: "icd11_diagnoses", label: "Diagnoses (ICD-11) — status at this review, including remission", type: "icd11_diagnoses" },
      ]),
      ...sec("Patient-Reported Measures", [
        N("pain_score", "Pain Score (0–10)"),
        N("patient_global", "Patient Global Assessment (0–10)"),
        N("fatigue_score", "Fatigue (0–10)"),
        S("morning_stiffness", "Morning Stiffness", ["None", "< 30 minutes", "30–60 minutes", "> 60 minutes"]),
        S("flare", "Current Flare", ["None", "Mild", "Moderate", "Severe"]),
      ]),
      ...sec("Joint Counts & Clinician Assessment", [
        N("tender_joint_count", "Tender Joint Count (28)"),
        N("swollen_joint_count", "Swollen Joint Count (28)"),
        N("physician_global", "Physician Global Assessment (0–10)"),
        N("esr", "ESR (mm/hr)"),
        N("crp", "CRP (mg/L)"),
        S("activity_assessment", "Disease Activity Assessment", ["Remission", "Low", "Moderate", "High"]),
        I("composite_score", "Composite Score — DAS28-CRP / CDAI / SLEDAI / BASDAI / DAPSA"),
        I("composite_value", "Composite Score Value"),
      ]),
      ...sec("Review of Systems", [
        ...rosFields(["constitutional", "skin", "ocular", "renal"]),
      ]),
      ...sec("Examination", [
        { key: "vitals", label: "Vital Signs", type: "vitals" },
        examinationPlaceholder("Examination"),
        ...enthesitisFields,
      ]),
      ...sec("Medication, Safety & Plan", [
        T("labs", "Laboratory Results and Monitoring Due"),
        ...investigationFields(),
        T("medication_review", "Medication Review — dose, adherence, adverse effects"),
        S("infection_screen", "Infection Since Last Review", ["None", "Present — documented below"]),
        T("infection_screen_detail", "Infection — Details and Outcome", {}, when("infection_screen", "Present — documented below")),
        {
          key: "structured_treatment_plan",
          label: "Structured Treatment Plan & Monitoring — ACR/EULAR-aligned decision support",
          type: "rheum_treatment",
        },
        T("plan", "Plan — escalation, tapering, switching or continuation with rationale"),
        T("safety_advice", "Safety Advice & When to Seek Urgent Care"),
        I("next_review", "Next Review"),
      ]),
    ],
  },

  // ---- 7. Therapy record ---------------------------------------------
  {
    key: "rheum_therapy_record",
    label: "Medication / Immunosuppressive Therapy Record",
    specialty: "rheumatology",
    fields: [
      ...sec("Therapy Details", [
        S("therapy_class", "Therapy Class", ["Conventional synthetic DMARD", "Biologic DMARD", "Targeted synthetic DMARD (JAK inhibitor)", "Glucocorticoid", "Uricosuric / anti-gout", "Other"]),
        I("medication", "Medication"),
        I("dose", "Dose"),
        I("route", "Route"),
        I("frequency", "Frequency"),
        I("start_date", "Start Date"),
        T("indication", "Indication & Treatment Target"),
      ]),
      ...sec("Baseline Screening Before Starting", [
        T("baseline_screening", "Baseline Screening — CBC, renal, hepatic, lipids, varicella status"),
        S("tb_screening", "Tuberculosis Screening", ["Not done", "Negative", "Latent TB — prophylaxis", "Active TB excluded"]),
        S("hepatitis_b", "Hepatitis B Status", ["Not tested", "Immune — vaccinated", "Immune — past infection", "Not immune", "Chronic HBV"]),
        S("hepatitis_c", "Hepatitis C Status", ["Not tested", "Negative", "Positive"]),
        S("hiv_status", "HIV Status", ["Not tested", "Negative", "Positive"]),
        S("pregnancy_test", "Pregnancy Test Before Starting", ["Not applicable", "Negative", "Positive", "Not done"]),
        S("vaccination_status", "Vaccination Status", ["Up to date", "Incomplete", "Not vaccinated", "Unknown"]),
      ]),
      ...sec("Monitoring", [
        I("monitoring_schedule", "Laboratory Monitoring Schedule"),
        T("labs_monitoring", "Current Monitoring Results"),
        T("clinical_response", "Clinical Response"),
        S("response", "Response Assessment", ["Good", "Partial", "No response", "Not yet assessable"]),
        T("adverse_effects", "Adverse Effects"),
        S("serious_infection", "Serious Infection on Therapy", ["None", "Present — documented below"]),
        T("serious_infection_detail", "Serious Infection — Agent, Site, Management, Therapy Held", {}, when("serious_infection", "Present — documented below")),
        S("therapy_status", "Therapy Status", ["Continuing", "Dose reduced", "Dose increased", "Interrupted", "Stopped"]),
        T("therapy_change_reason", "Reason for Change / Interruption", {}, when("therapy_status", "Dose reduced", "Dose increased", "Interrupted", "Stopped")),
      ]),
      ...sec("Counselling & Follow-Up", [
        T("counselling", "Counselling Provided — infection precautions, live vaccines, pregnancy avoidance, alcohol, self-monitoring"),
        S("shared_decision", "Shared Decision-Making Documented", ["Yes", "Discussed with family", "Patient deferred"]),
        S("infusion_required", "Infusion or Injection Required", ["No", "Yes — documented below"]),
        T("infusion_details", "Administration Details — setting, premedication, observation period", {}, when("infusion_required", "Yes — documented below")),
        I("next_dose", "Next Dose Due"),
        I("next_review", "Next Review"),
      ]),
    ],
  },

  // ---- 8. Infusion record --------------------------------------------
  {
    key: "rheum_infusion_record",
    label: "Infusion Record (Rheumatology)",
    specialty: "rheumatology",
    fields: [
      ...sec("Therapy & Preparation", [
        I("medication", "Medication Infused"),
        I("dose", "Dose"),
        I("batch_lot", "Batch / Lot Number"),
        I("indication", "Indication"),
        I("infusion_date", "Date of Infusion"),
        S("infection_screen_today", "Screening Before Infusion — fever, active infection, recent live vaccine", ["No concerns", "Concern — documented below"]),
        T("infection_screen_detail", "Concern Identified & Action Taken", {}, when("infection_screen_today", "Concern — documented below")),
        S("consent", "Consent for Infusion Confirmed", ["Yes", "Obtained previously", "Not documented"]),
        T("premedications", "Premedications Given"),
      ]),
      ...sec("Administration", [
        I("infusion_start", "Infusion Start Time"),
        I("infusion_end", "Infusion End Time"),
        I("access_site", "Access Site / Line"),
        { key: "vitals_pre", label: "Vital Signs Before Infusion", type: "vitals" },
        { key: "vitals_during", label: "Vital Signs During Infusion", type: "vitals" },
        { key: "vitals_post", label: "Vital Signs After Infusion", type: "vitals" },
        T("observations", "Observations During Infusion"),
      ]),
      ...sec("Safety & Outcome", [
        S("adverse_reactions", "Adverse Reaction", ["None", "Mild — documented below", "Moderate — documented below", "Severe — infusion stopped"]),
        T("adverse_reaction_detail", "Reaction — timing, features, treatment, outcome", {}, when("adverse_reactions", "Mild — documented below", "Moderate — documented below", "Severe — infusion stopped")),
        S("tolerance", "Tolerance", ["Good", "Fair", "Poor"]),
        S("infusion_completed", "Infusion Completed as Planned", ["Yes", "Partially", "No — discontinued"]),
        T("followup_advice", "Advice Given to Patient"),
        I("next_infusion", "Next Infusion Due"),
      ]),
    ],
  },

  // ---- 9. Progress note ----------------------------------------------
  {
    key: "rheum_progress_note",
    label: "Rheumatology Progress Note",
    specialty: "rheumatology",
    fields: [
      ...sec("Interval Events", [
        T("interval_events", "Interval Events Since Last Note", R),
        T("symptoms", "Current Symptoms"),
        S("flare", "Disease Flare", ["None", "Mild", "Moderate", "Severe"]),
      ]),
      ...sec("Review of Systems", [
        ...rosFields(["constitutional", "musculoskeletal", "skin", "respiratory"]),
      ]),
      ...sec("Examination", [
        { key: "vitals", label: "Vital Signs", type: "vitals" },
        examinationPlaceholder("Examination"),
        N("tender_joint_count", "Tender Joint Count"),
        N("swollen_joint_count", "Swollen Joint Count"),
        ...jointFields([["wrists", "Wrists"], ["mcps", "Metacarpophalangeal joints (MCPs)"], ["knees", "Knees"]]),
        ...enthesitisFields,
      ]),
      ...sec("Investigations & Medications", [
        T("labs", "Laboratory Results"),
        ...investigationFields(),
        T("radiographs", "Radiographs or Cross-Sectional Studies Reviewed"),
        T("medications", "Current Medications"),
        S("adherence", "Reported Adherence", ["Full", "Partial", "Not taking", "Not applicable"]),
        T("adverse_effects", "Adverse Effects"),
      ]),
      ...sec("Assessment & Plan", [
        { key: "icd11_diagnoses", label: "Diagnoses (ICD-11) — role, status and clinical basis", type: "icd11_diagnoses" },
        T("diagnostic_reasoning", "Diagnostic Reasoning"),
        T("assessment", "Assessment"),
        T("plan", "Plan"),
        T("safety_advice", "Safety Advice & Follow-Up"),
      ]),
    ],
  },

  // ---- 10. Discharge summary -----------------------------------------
  {
    key: "rheum_discharge_summary",
    label: "Discharge Summary (Rheumatology)",
    specialty: "rheumatology",
    fields: [
      ...sec("Admission & Discharge", [
        T("admission_diagnosis", "Admission Diagnosis"),
        T("discharge_diagnosis", "Discharge Diagnosis (ICD-11)"),
        { key: "icd11_diagnoses", label: "Final Diagnoses (ICD-11) — role, status and clinical basis", type: "icd11_diagnoses" },
        I("admission_date", "Date of Admission"),
        I("discharge_date", "Date of Discharge"),
        T("discharge_condition", "Condition at Discharge"),
      ]),
      ...sec("Hospital Course", [
        T("hospital_course", "Hospital Course"),
        T("procedures_performed", "Procedures or Joint Interventions Performed"),
        T("complications", "Complications During Admission"),
        S("infection_course", "Infection During Admission", ["None", "Treated during admission", "Ongoing at discharge"]),
        T("infection_course_detail", "Infection — Organism, Treatment, Duration", {}, when("infection_course", "Treated during admission", "Ongoing at discharge")),
      ]),
      ...sec("Investigations & Outstanding Results", [
        ...investigationFields(),
        T("outstanding_investigations", "Results Awaited at Discharge — who will review them and action if abnormal"),
      ]),
      ...sec("Discharge Therapy", [
        T("discharge_medications", "Discharge Medications — DMARDs, biologics, glucocorticoids with taper"),
        T("medication_changes", "Changes to Therapy Made During Admission"),
        T("monitoring_plan", "Monitoring Plan After Discharge"),
        T("infection_precautions", "Infection Precautions & Vaccination Advice"),
        T("bone_health", "Bone Protection & Fracture Prevention Plan"),
      ]),
      ...sec("Follow-Up & Instructions", [
        T("follow_up", "Rheumatology Follow-Up Arrangements"),
        T("pending_results", "Pending Results and Who Will Review Them"),
        T("instructions", "Written Instructions Given to the Patient"),
        T("when_to_seek_help", "When to Seek Urgent Help — fever, new weakness, visual loss, hot joint"),
        T("information_given_to", "Summary Sent To — primary care, referring team, patient"),
      ]),
    ],
  },
];