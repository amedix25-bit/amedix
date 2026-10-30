// Condition-specific Rheumatology note templates.
//
// One template per disease, each carrying that condition's own history,
// examination findings, laboratory and radiology workup, differential
// diagnoses, complications, organ involvement, treatment history, monitoring
// requirements and follow-up criteria — with the validated activity and
// functional instruments that belong to that condition attached.
//
// Two governance rules run through every template and are stated in each:
//  • classification criteria (ACR/EULAR or ASAS) are documented separately from
//    the clinical diagnosis and are never treated as a diagnostic result;
//  • a disease-activity score is only meaningful inside the population the
//    instrument was validated in, and is produced only from completed inputs.
//
// The structured examination uses the existing "Select Examination" interface,
// diagnoses use the verified ICD-11 field and the workup uses the rheumatology
// panel selector — nothing is duplicated.

import { withRheumCoreSections } from "./rheumDocumentCore.js";

const I = (key, label, x = {}) => ({ key, label, type: "input", ...x });
const T = (key, label, x = {}) => ({ key, label, type: "textarea", ...x });
const S = (key, label, options, x = {}) => ({ key, label, type: "select", options, ...x });
const R = { required: true };
const when = (key, ...values) => ({ showIf: { key, in: values } });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

const YES_NO = ["Yes", "No", "Unknown"];
const YES_NO_NA = ["Yes", "No", "Not applicable"];
const NONE_MILD_MOD_SEV = ["None", "Mild", "Moderate", "Severe"];

const CLASSIFICATION_NOTICE =
  "Classification criteria organise a diagnosis for study and audit; they are not a diagnostic test and never replace clinical judgement. Record the criteria set, its version and the items met — and keep a patient who does not meet them diagnosed on clinical grounds if that is the clinical conclusion.";

// ---- Shared building blocks ------------------------------------------------
const diagnosisFields = ({ criteria, differentials, diagnosisLabel = "Clinical Diagnosis" }) => [
  I("diagnosis_date", "Date of Diagnosis"),
  {
    key: "icd11_diagnoses",
    label: "Diagnosis & Differential (ICD-11) — role, status and clinical basis",
    type: "icd11_diagnoses",
  },
  T("clinical_diagnosis", `${diagnosisLabel} — the diagnosis made on clinical judgement, with the evidence that supports it`, R),
  S("classification_status", `Classification Criteria Status — ${criteria}`, [
    "Criteria met — documented below",
    "Criteria not met — diagnosed clinically",
    "Criteria not applicable to this presentation",
    "Not assessed",
  ]),
  T("classification_detail", `Classification Criteria Detail — ${criteria}: items met and items missing`),
  T("differential_diagnoses", `Differential Diagnosis — considered and excluded: ${differentials}`),
];

const activityFields = (instruments, extra = []) => [
  {
    key: "disease_activity",
    label: "Disease Activity & Functional Instruments — validated, scored only from completed inputs",
    type: "disease_activity",
    instruments,
  },
  ...extra,
  T("clinician_activity_assessment", "Clinician Assessment of Current Activity — integrating symptoms, findings and the scores above"),
];

const treatmentFields = (specific = []) => [
  {
    key: "structured_treatment_plan",
    label: "Structured Treatment Plan & Monitoring — ACR/EULAR-aligned decision support",
    type: "rheum_treatment",
  },
  ...specific,
  T("current_csdmards", "Current Conventional Synthetic DMARDs — agent, dose, start date, folic acid cover"),
  T("biologic_tsdmard_history", "Biologic / Targeted Synthetic Therapy History — agent, dates, response and reason for switching or stopping"),
  T("glucocorticoid_exposure", "Glucocorticoid Exposure — current dose, duration, prior pulses, cumulative burden"),
  T("treatment_response", "Documented Response — including the activity score that supported each treatment decision"),
  S("adherence", "Treatment Adherence", ["Taking as prescribed", "Partial adherence", "Not taking", "Not applicable"]),
  T("adverse_effects", "Adverse Effects, Intolerance & Contraindications"),
  T("shared_decision", "Shared Decision-Making — options discussed, risks and benefits, and the patient's preference"),
];

const monitoringFields = (specific = []) => [
  ...specific,
  S("tb_screening", "Tuberculosis Screening Before Biologic or Targeted Synthetic Therapy", [
    "Screen completed — negative",
    "Screen completed — latent TB, prophylaxis plan documented",
    "Screen completed — active TB excluded and referred",
    "Not done / pending",
  ]),
  S("hepatitis_b_status", "Hepatitis B Status (HBsAg, anti-HBc, anti-HBs)", [
    "Immune — resolved infection",
    "Vaccinated",
    "Chronic — antiviral plan documented",
    "Susceptible — vaccination planned",
    "Not checked",
  ]),
  S("hepatitis_c_hiv_status", "Hepatitis C & HIV Status", ["Negative", "Positive — management documented", "Not checked"]),
  T("baseline_safety_workup", "Baseline Safety Workup — full blood count, liver and renal function, lipids, glucose, blood pressure, pregnancy test where relevant"),
  T("monitoring_plan", "Monitoring Requirements — which test, how often, and who reviews the result"),
  T("vaccination_plan", "Vaccination Status & Plan — including live-vaccine avoidance on immunosuppression"),
  T("infection_counselling", "Infection-Risk Counselling & Sick-Day Rules"),
  S("reproductive_plan", "Reproductive Planning", [
    "Not applicable",
    "Contraception discussed — teratogenic therapy avoided",
    "Planning pregnancy — therapy reviewed and adjusted",
    "Pregnant — pregnancy-safe regimen documented",
    "Breastfeeding — therapy reviewed",
  ]),
];

const followUpFields = ({ target, flags }) => [
  T("treatment_target", `Treat-to-Target Goal — ${target}`),
  S("target_met", "Target Met at This Review", ["Yes — maintain", "No — treatment adjusted", "No — continue and reassess", "Not assessed"]),
  T("follow_up_criteria", "Follow-Up Criteria — the findings and scores that must be reviewed at the next visit"),
  I("review_interval", "Review Interval"),
  T("warning_signs", `Warning Signs Requiring Urgent Review — ${flags}`),
  T("referral_plan", "Referral & Multidisciplinary Plan"),
];

const structuredExam = (label = "Select Examination") => ({
  key: "structured_examination",
  label,
  type: "textarea",
});

// ---- 1. Rheumatoid arthritis ----------------------------------------------
const RHEUM_RA = {
  key: "rheum_dx_ra",
  label: "Rheumatoid Arthritis — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "2010 ACR/EULAR Rheumatoid Arthritis Classification Criteria",
      diagnosisLabel: "Clinical Diagnosis",
      differentials: "psoriatic arthritis, peripheral spondyloarthritis, SLE, viral arthritis, CPPD, polymyalgia rheumatica, fibromyalgia, paraneoplastic arthritis",
    })),
    ...sec("Rheumatoid Arthritis History", [
      T("symptom_onset", "Onset — date, site, speed of progression, and the first joint involved"),
      T("joint_distribution", "Joint Distribution — MCP, PIP, wrist, MTP, knee, elbow, shoulder, cervical spine; symmetry; any large-joint or axial involvement"),
      T("morning_stiffness", "Morning Stiffness — duration and whether it improves with use"),
      T("disease_course", "Disease Course — additive, palindromic, persistent or relapsing; previous remissions and their duration"),
      T("pain_function", "Pain, Night Pain & Functional Impact — dressing, grip, walking, work, driving"),
      T("extra_articular_history", "Extra-Articular History — nodules, dry eyes/mouth, breathlessness or cough, paraesthesia, rash, fever, weight loss"),
      T("previous_diagnoses", "Previous Diagnoses & Alternative Explanations Recorded"),
      T("family_and_social", "Family History, Smoking History and Occupational Exposures"),
      T("prior_treatment_history", "Full Treatment History — every DMARD, biologic and steroid course with dates, response and reason for stopping"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      S("joint_count_swelling", "Synovitis at Assessment", ["None", "Oligoarticular", "Polyarticular", "Active large-joint disease"]),
      S("deformity", "Deformity / Damage", ["None", "Early changes", "Established deformity", "Ankylosis"]),
      S("rheumatoid_nodules", "Rheumatoid Nodules", ["Absent", "Present"]),
      T("tendon_hand_findings", "Hand & Wrist Findings — tenosynovitis, trigger fingers, tendon rupture, carpal tunnel signs"),
      T("cervical_findings", "Cervical Spine Findings — pain, neurology, instability risk before intubation"),
      T("extra_articular_findings", "Extra-Articular Findings — eyes, lungs, skin, nerve, spleen"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("rf_status", "Rheumatoid Factor (RF)", ["Negative", "Low positive", "High positive", "Not done"]),
      S("anti_ccp_status", "Anti-CCP (ACPA)", ["Negative", "Low positive", "High positive", "Not done"]),
      S("acute_phase", "Acute-Phase Response", ["Both CRP and ESR raised", "CRP raised", "ESR raised", "Both normal", "Discordant"]),
      T("radiographic_findings", "Radiographic Findings — erosions, joint-space loss, deformity, baseline and progression"),
      S("functional_impact_screen", "Work / Function Impact", ["No limitation", "Mild limitation", "Work modification needed", "Unable to work"]),
    ]),
    ...sec("Disease Activity, Damage & Function", activityFields(["das28_esr", "das28_crp", "cdai", "sdai", "haq_di"], [
      T("damage_assessment", "Structural Damage & Disability — what is irreversible and what is still modifiable"),
    ])),
    ...sec("Extra-Articular Disease, Complications & Comorbidity", [
      S("interstitial_lung_disease", "Interstitial Lung Disease", ["Not present", "Suspected — referral made", "Confirmed", "Not assessed"]),
      S("ocular_involvement", "Ocular Involvement — scleritis, episcleritis, keratoconjunctivitis sicca", ["None", "Sicca symptoms", "Active inflammation", "Not assessed"]),
      S("vasculitis_neuropathy", "Rheumatoid Vasculitis or Neuropathy", ["None", "Suspected", "Confirmed", "Not assessed"]),
      S("cardiovascular_risk", "Cardiovascular Risk (RA is an independent risk factor)", ["Low", "Moderate", "High — risk assessment done", "Not assessed"]),
      S("osteoporosis_risk", "Fracture & Bone Health Risk", ["Low", "Moderate", "High — FRAX / bone density arranged", "Not assessed"]),
      S("infection_burden", "Serious Infection History", ["None", "One episode", "Recurrent", "Current infection"]),
      S("malignancy_screen", "Malignancy Screening (including lymphoma risk)", ["Up to date", "Overdue", "Under investigation", "Not applicable"]),
      T("comorbidity_detail", "Comorbidity Detail & Impact on Therapy Choice"),
    ]),
    ...sec("Treatment History", treatmentFields([
      T("methotrexate_plan", "Methotrexate Plan — route, dose, folate, timing and monitoring"),
      T("steroid_bridge", "Steroid Bridge Therapy — indication, dose and tapering plan"),
    ])),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("mtx_monitoring", "Methotrexate Monitoring — full blood count, liver and renal function intervals"),
      T("biologic_monitoring", "Biologic Monitoring — infection surveillance, injection-site reaction, drug-specific checks"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "remission (DAS28 < 2.6 or CDAI ≤ 2.8) or low disease activity, assessed at every review and used to drive treatment decisions",
      flags: "acute hot joint, new breathlessness, fever on immunosuppression, sudden visual loss, new neurological deficit, chest pain",
    })),
  ],
};

// ---- 2. Systemic lupus erythematosus --------------------------------------
const RHEUM_SLE = {
  key: "rheum_dx_sle",
  label: "Systemic Lupus Erythematosus — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "2019 EULAR/ACR SLE Classification Criteria (with ANA entry criterion)",
      diagnosisLabel: "Clinical Diagnosis",
      differentials: "drug-induced lupus, primary antiphospholipid syndrome, Sjögren disease, dermatomyositis, vasculitis, fibromyalgia, viral infection, lymphoma",
    })),
    ...sec("Lupus History", [
      T("onset_and_course", "Onset & Course — date, presenting features, relapsing or persistent activity"),
      T("constitutional_history", "Constitutional — fever, fatigue, weight change, night sweats"),
      T("mucocutaneous_history", "Mucocutaneous — malar rash, discoid lesions, photosensitivity, oral/nasal ulcers, alopecia, livedo"),
      T("musculoskeletal_history", "Musculoskeletal — synovitis pattern, myalgia, tendon involvement"),
      S("renal_history", "Renal Manifestations (ever)", ["None documented", "Proteinuria", "Active sediment", "Biopsy-proven nephritis", "Not assessed"]),
      T("renal_history_detail", "Renal History — proteinuria, haematuria, hypertension, creatinine change, biopsy class and date", {}, when("renal_history", "Proteinuria", "Active sediment", "Biopsy-proven nephritis")),
      T("neuropsychiatric_history", "Neuropsychiatric — seizures, psychosis, headache, cognitive change, neuropathy, stroke"),
      T("cardiorespiratory_history", "Cardiorespiratory — pleurisy, pericarditis, pulmonary hypertension, interstitial disease, thrombosis"),
      T("haematological_history", "Haematological — cytopenias, haemolysis, transfusion, thrombosis"),
      S("obstetric_history", "Obstetric History", ["Not applicable", "No pregnancy", "Uncomplicated pregnancy", "Pregnancy loss / morbidity", "Pre-eclampsia or preterm birth"]),
      T("thrombosis_history", "Thrombosis History — site, arterial or venous, anticoagulation and antiphospholipid results"),
      T("drug_exposure", "Drug & Environmental Exposures — including any drug-induced lupus trigger"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("lupus_skin_findings", "Skin & Mucosal Findings — rash distribution, scarring, ulcers, vasculitic lesions, nail-fold changes"),
      S("arthritis_myositis", "Joint & Muscle Findings", ["None", "Arthralgia only", "Synovitis", "Myositis suspected"]),
      T("cardiopulmonary_findings", "Cardiopulmonary Findings"),
      T("neurological_findings", "Neurological Findings"),
      T("lymphadenopathy_splenomegaly", "Lymphadenopathy / Splenomegaly"),
      S("disease_activity_pattern", "Activity Pattern", ["Remission on therapy", "Low activity", "Flaring", "Chronically active"]),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("ana_status", "Antinuclear Antibody (ANA)", ["Negative", "Positive — titre and pattern recorded", "Not done"]),
      S("dsdna_status", "Anti-dsDNA", ["Negative", "Positive — rising", "Positive — stable/falling", "Not done"]),
      S("complement_status", "Complement C3 / C4", ["Both normal", "C3 low", "C4 low", "Both low", "Not done"]),
      T("complement_values", "Complement & Anti-dsDNA Values with Dates — for trend comparison"),
      S("antiphospholipid_status", "Antiphospholipid Antibodies", ["All negative", "Single positive — repeat required", "Persistently positive", "Triple positive", "Not tested"]),
      T("urinalysis_detail", "Urinalysis & Protein Quantification — protein:creatinine ratio, sediment, casts"),
      S("renal_function", "Renal Function", ["Normal", "Mild impairment", "Moderate impairment", "Severe impairment", "Not assessed"]),
      S("biopsy_status", "Renal Biopsy", ["Not indicated", "Indicated — arranged", "Performed — class documented", "Declined"]),
      T("biopsy_detail", "Biopsy Class, Activity & Chronicity Indices", {}, when("biopsy_status", "Performed — class documented")),
    ]),
    ...sec("Disease Activity, Damage & Function", activityFields(["sledai_2k", "haq_di"], [
      T("organ_damage", "Cumulative Organ Damage — renal, neuropsychiatric, cardiac, ocular, musculoskeletal"),
    ])),
    ...sec("Organ Involvement, Complications & Comorbidity", [
      S("lupus_nephritis", "Lupus Nephritis Status", ["Not present", "Active", "In remission", "Relapsed", "Not assessed"]),
      S("neuropsychiatric_lupus", "Neuropsychiatric Lupus", ["None", "Attributed to SLE", "Attributed to other cause", "Not assessed"]),
      S("pulmonary_involvement", "Pulmonary Involvement", ["None", "Pleural disease", "Interstitial disease", "Pulmonary hypertension", "Not assessed"]),
      S("cardiac_involvement", "Cardiac Involvement", ["None", "Pericarditis", "Myocarditis", "Libman-Sacks endocarditis", "Not assessed"]),
      S("haematological_activity", "Haematological Activity", ["None", "Cytopenia attributable to SLE", "Haemolytic anaemia", "Not assessed"]),
      S("infection_risk", "Infection Risk & Current Infection", ["No current infection", "Treated infection in the last 3 months", "Current infection", "Recurrent infections"]),
      S("malignancy_screen", "Malignancy Screening", ["Up to date", "Overdue", "Under investigation", "Not applicable"]),
      S("pregnancy_plan", "Pregnancy Planning & Risk", ["Not applicable", "Contraception advised", "Planning pregnancy — therapy reviewed", "Pregnant — high-risk care", "Breastfeeding"]),
      T("comorbidity_detail", "Comorbidity Detail — cardiovascular risk, diabetes, bone health, thyroid"),
    ]),
    ...sec("Treatment History", treatmentFields([
      T("hydroxychloroquine_plan", "Hydroxychloroquine — dose, duration and retinal screening status"),
      T("immunosuppression_plan", "Immunosuppressive Therapy — agent, indication, dose and duration"),
      T("anticoagulation", "Anticoagulation / Antiplatelet Therapy — indication, agent, target and duration"),
    ])),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("renal_monitoring", "Renal Monitoring — protein:creatinine ratio, creatinine, blood pressure and review interval"),
      T("hcq_eye_monitoring", "Hydroxychloroquine Retinal Monitoring — baseline and annual screening"),
      T("steroid_bone_protection", "Steroid Bone Protection and Cardiovascular Risk Management"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "clinical remission or low disease activity with the lowest effective glucocorticoid dose (target ≤ 5 mg/day prednisolone), organ damage prevented, and every flare explained",
      flags: "rising creatinine or proteinuria, new seizures or psychosis, fever with cytopenia, chest pain, breathlessness, sudden visual loss, pregnancy on teratogenic therapy",
    })),
  ],
};

// ---- 3. Axial spondyloarthritis -------------------------------------------
const RHEUM_AXSPA = {
  key: "rheum_dx_axspa",
  label: "Axial Spondyloarthritis — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "ASAS axial spondyloarthritis criteria (clinical arm or radiographic arm)",
      diagnosisLabel: "Clinical Diagnosis (radiographic or non-radiographic axial spondyloarthritis)",
      differentials: "mechanical back pain, disc disease, fracture, infection, malignancy, diffuse idiopathic skeletal hyperostosis, CPPD, psoriatic axial disease",
    })),
    ...sec("Axial History", [
      T("back_pain_onset", "Back Pain Onset — age at onset, insidious or acute, site, radiation"),
      S("inflammatory_back_pain", "Inflammatory Back Pain Features", ["All features present", "Some features present", "Absent", "Not assessed"]),
      T("inflammatory_back_pain_detail", "Inflammatory Back Pain Detail — onset < 40 years, insidious onset, improvement with exercise, no improvement with rest, night pain"),
      T("stiffness", "Morning Stiffness & Spinal Stiffness — duration, response to movement"),
      T("alternating_buttock_pain", "Alternating Buttock Pain & Peripheral Symptoms"),
      T("enthesitis_history", "Enthesitis — heel, Achilles, plantar fascia, other sites"),
      T("extra_spinal_history", "Extra-Spinal History — acute anterior uveitis, psoriasis, inflammatory bowel disease, dactylitis"),
      T("function_history", "Function & Work Impact — bending, lifting, prolonged sitting, driving"),
      T("family_history", "Family History of Spondyloarthritis, Psoriasis or Inflammatory Bowel Disease"),
      S("hla_b27", "HLA-B27", ["Positive", "Negative", "Not tested"]),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("spinal_mobility", "Spinal Mobility — Schober, lateral flexion, occiput-to-wall, cervical rotation, chest expansion, tragus-to-wall"),
      T("sacroiliac_findings", "Sacroiliac & Hip Findings"),
      T("enthesitis_findings", "Enthesitis & Dactylitis Findings"),
      T("peripheral_joint_findings", "Peripheral Joint Findings — pattern and activity"),
      T("extra_articular_findings", "Extra-Articular Findings — eyes, skin, bowel, heart, lungs"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("acute_phase", "Acute-Phase Response", ["CRP and ESR raised", "CRP raised only", "ESR raised only", "Both normal"]),
      T("sacroiliac_radiology", "Sacroiliac & Spinal Findings — radiograph (radiographic vs non-radiographic) and MRI bone-marrow oedema where performed"),
      S("radiographic_stage", "Radiographic Stage", ["Non-radiographic", "Radiographic — sacroiliitis", "Radiographic — spinal syndesmophytes", "Not assessed"]),
    ]),
    ...sec("Disease Activity, Function & Metrology", activityFields(["asdas_crp", "asdas_esr", "basdai", "basfi"])),
    ...sec("Complications, Organ Involvement & Comorbidity", [
      S("uveitis", "Acute Anterior Uveitis", ["None", "Previous episodes", "Current episode — ophthalmology involved", "Not assessed"]),
      S("inflammatory_bowel_disease", "Inflammatory Bowel Disease", ["None", "Known — gastroenterology follow-up", "Suspected", "Not assessed"]),
      S("psoriasis", "Psoriasis", ["None", "Present", "Not assessed"]),
      S("spinal_fracture_risk", "Spinal Fracture & Osteoporosis Risk", ["Low", "Moderate", "High — bone density arranged", "Not assessed"]),
      S("cardiac_risk", "Cardiovascular & Aortic Risk", ["No concerns", "Hypertension", "Aortic valve disease documented", "Not assessed"]),
      S("renal_amyloid", "Renal Involvement / Amyloidosis", ["None", "Proteinuria — assessed", "Not assessed"]),
      T("comorbidity_detail", "Comorbidity Detail — including smoking, bone health and cardiovascular risk"),
    ]),
    ...sec("Treatment History", treatmentFields([
      T("nsaid_history", "NSAID Use — agent, dose, duration, response and gastrointestinal or renal risk"),
      T("exercise_physiotherapy", "Exercise, Physiotherapy & Posture Programme"),
    ])),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("biologic_monitoring", "Biologic Monitoring — infection surveillance and drug-specific checks"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "ASDAS < 2.1 (low activity) or inactive disease < 1.3, with preserved spinal mobility and function",
      flags: "new neurological deficit, sudden severe back pain after trauma, acute visual loss or painful red eye, fever, chest pain",
    })),
  ],
};

// ---- 4. Peripheral spondyloarthritis --------------------------------------
const RHEUM_PSPA = {
  key: "rheum_dx_pspa",
  label: "Peripheral Spondyloarthritis — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "ASAS peripheral spondyloarthritis criteria",
      diagnosisLabel: "Clinical Diagnosis",
      differentials: "rheumatoid arthritis, psoriatic arthritis, reactive arthritis, enteropathic arthritis, gout, CPPD, septic arthritis, Lyme disease",
    })),
    ...sec("Peripheral Spondyloarthritis History", [
      T("onset_history", "Onset — date, pattern (oligoarticular, asymmetric, lower-limb predominant), preceding infection"),
      T("joint_distribution", "Joint Distribution — knees, ankles, MTPs, dactylitis, enthesitis sites"),
      T("enthesitis_dactylitis_history", "Enthesitis & Dactylitis History"),
      T("axial_symptoms", "Axial Symptoms — inflammatory back pain and buttock pain"),
      T("extra_articular_history", "Extra-Articular History — uveitis, psoriasis, inflammatory bowel disease, urethritis, skin rash"),
      T("infection_trigger", "Preceding Infection / Trigger — gastrointestinal, genitourinary or other"),
      S("hla_b27", "HLA-B27", ["Positive", "Negative", "Not tested"]),
      T("function_history", "Function & Work Impact"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("peripheral_joint_findings", "Peripheral Joint Findings — swelling, tenderness, distribution, symmetry"),
      T("enthesitis_findings", "Enthesitis & Dactylitis Findings — site and count"),
      T("skin_nail_findings", "Skin & Nail Findings"),
      T("axial_findings", "Axial Findings"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("rf_ccp", "Rheumatoid Factor / Anti-CCP", ["Both negative", "RF positive only", "Anti-CCP positive", "Not tested"]),
      S("acute_phase", "Acute-Phase Response", ["Raised", "Normal", "Discordant"]),
      T("radiology_findings", "Radiographic & Ultrasound Findings — erosions, enthesophytes, synovitis, power Doppler"),
    ]),
    ...sec("Disease Activity & Function", activityFields(["haq_di"], [
      T("joint_activity_detail", "Joint Count & Active Joint Detail — the recorded counts that support the treatment decision"),
      S("disease_pattern", "Disease Pattern", ["Self-limiting", "Relapsing", "Persistent", "Chronic with damage"]),
    ])),
    ...sec("Complications, Organ Involvement & Comorbidity", [
      S("uveitis", "Acute Anterior Uveitis", ["None", "Previous episodes", "Current episode", "Not assessed"]),
      S("psoriasis", "Psoriasis", ["None", "Present", "Not assessed"]),
      S("inflammatory_bowel_disease", "Inflammatory Bowel Disease", ["None", "Known", "Suspected", "Not assessed"]),
      S("infection_screen", "Chronic or Occult Infection Screened", ["Hepatitis B, hepatitis C, HIV screened", "Partially screened", "Not screened"]),
      T("comorbidity_detail", "Comorbidity Detail"),
    ]),
    ...sec("Treatment History", treatmentFields([
      T("nsaid_history", "NSAID Use & Response"),
      T("local_therapy", "Intra-Articular or Local Therapy"),
    ])),
    ...sec("Safety Screening & Monitoring", monitoringFields()),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "clinical remission or low disease activity with no active peripheral arthritis, enthesitis or dactylitis, and preserved function",
      flags: "acute hot joint, fever, sudden visual loss or painful red eye, new back pain with neurology",
    })),
  ],
};

// ---- 5. Psoriatic arthritis ------------------------------------------------
const RHEUM_PSA = {
  key: "rheum_dx_psa",
  label: "Psoriatic Arthritis — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "CASPAR classification criteria for psoriatic arthritis",
      diagnosisLabel: "Clinical Diagnosis (and clinical domain: peripheral, axial, enthesitis, dactylitis, skin/nail, ocular, inflammatory bowel)",
      differentials: "rheumatoid arthritis, gout, CPPD, osteoarthritis, reactive arthritis, ankylosing spondylitis, fibromyalgia",
    })),
    ...sec("Psoriatic Arthritis History", [
      T("psoriasis_history", "Psoriasis History — onset, type, distribution, severity, treatments and family history"),
      T("joint_history", "Joint History — pattern (oligo/poly/asymmetric/DIP involvement), onset, distribution"),
      T("axial_history", "Axial History — inflammatory back pain, buttock pain, stiffness"),
      T("enthesitis_dactylitis_history", "Enthesitis & Dactylitis History"),
      T("nail_history", "Nail Changes — pitting, onycholysis, oil spots"),
      T("extra_articular_history", "Extra-Articular History — uveitis, inflammatory bowel disease, cardiovascular risk, fatigue"),
      T("function_history", "Function & Work Impact — grip, walking, dressing, work capacity"),
      T("therapy_history", "Therapy History — topicals, phototherapy, conventional DMARDs, biologics with response"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("psoriasis_assessment", "Psoriasis Assessment — body surface area, site and activity of plaques"),
      T("nail_findings", "Nail Findings"),
      T("joint_findings", "Joint Findings — DIP, PIP, MCP, wrists, knees, ankles, MTPs, asymmetry"),
      T("enthesitis_dactylitis_findings", "Enthesitis & Dactylitis Findings"),
      T("axial_findings", "Axial Findings"),
      T("eye_findings", "Ocular Findings"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("rf_ccp", "Rheumatoid Factor / Anti-CCP", ["Both negative", "RF positive only", "Anti-CCP positive", "Not tested"]),
      S("acute_phase", "Acute-Phase Response", ["Raised", "Normal", "Discordant"]),
      T("radiographic_findings", "Radiographic Findings — erosions, pencil-in-cup, new bone formation, sacroiliitis"),
      S("metabolic_comorbidity", "Metabolic Comorbidity", ["None", "Obesity", "Diabetes / metabolic syndrome", "Multiple"]),
    ]),
    ...sec("Disease Activity, Function & Damage", activityFields(["dapsa", "pasdas", "haq_di", "basdai"], [
      T("domain_summary", "Domain Summary — peripheral arthritis, axial disease, enthesitis, dactylitis, skin and nail disease each recorded separately"),
    ])),
    ...sec("Complications, Organ Involvement & Comorbidity", [
      S("uveitis", "Acute Anterior Uveitis", ["None", "Previous episodes", "Current episode", "Not assessed"]),
      S("inflammatory_bowel_disease", "Inflammatory Bowel Disease", ["None", "Known", "Suspected", "Not assessed"]),
      S("cardiovascular_risk", "Cardiovascular Risk", ["Low", "Moderate", "High — assessed", "Not assessed"]),
      S("bone_health", "Bone Health", ["No concerns", "Osteopenia", "Osteoporosis — treated", "Not assessed"]),
      T("comorbidity_detail", "Comorbidity Detail — including alcohol, smoking, fatty liver, diabetes"),
    ]),
    ...sec("Treatment History", treatmentFields([
      T("skin_therapy", "Skin-Directed Therapy — topical, phototherapy, systemic"),
      T("nsaid_history", "NSAID Use & Response"),
    ])),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("biologic_monitoring", "Biologic Monitoring — infection surveillance and drug-specific checks"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "DAPSA ≤ 4 (remission) or low disease activity, with skin, enthesitis and dactylitis targets documented separately",
      flags: "acute hot joint, widespread pustular psoriasis, fever on immunosuppression, sudden visual loss, severe abdominal pain",
    })),
  ],
};

// ---- 6. Gout and crystal arthropathies ------------------------------------
const RHEUM_GOUT = {
  key: "rheum_dx_gout",
  label: "Gout & Crystal Arthropathy — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "2015 ACR/EULAR gout classification criteria (CPPD and basic calcium phosphate disease have no classification score in routine use — document crystal confirmation instead)",
      diagnosisLabel: "Clinical Diagnosis (crystal-proven or clinically diagnosed)",
      differentials: "septic arthritis, CPPD, basic calcium phosphate disease, cellulitis, trauma, psoriatic arthritis, reactive arthritis, rheumatoid arthritis",
    })),
    ...sec("Crystal Arthropathy History", [
      T("attack_history", "Attack History — first attack, frequency per year, duration, severity, joints involved"),
      T("attack_triggers", "Triggers — alcohol, purine intake, dehydration, surgery, trauma, diuretics, initiation of urate-lowering therapy"),
      T("tophus_history", "Tophi — site, number, ulceration, discharge"),
      T("renal_history", "Renal History — stones, colic, chronic kidney disease, urine output"),
      T("comorbidity_history", "Comorbidity — hypertension, diabetes, obesity, metabolic syndrome, heart failure, transplantation"),
      T("drug_history", "Drugs Affecting Urate — diuretics, low-dose aspirin, ciclosporin, cytotoxics, vitamin C"),
      T("family_history", "Family History of Gout or Stone Disease"),
      S("crystal_type", "Crystal Type Confirmed", ["Monosodium urate — confirmed", "Calcium pyrophosphate — confirmed", "Basic calcium phosphate", "Clinically diagnosed — not crystal-proven", "Not established"]),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("affected_joint_findings", "Affected Joint Findings — swelling, erythema, warmth, tenderness, range of movement"),
      T("tophi_findings", "Tophi & Chronic Arthropathy Findings"),
      S("systemic_features", "Systemic Features", ["None", "Fever", "Malaise", "Fever with suspected sepsis"]),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      { key: "serum_urate", label: "Serum Urate (µmol/L) with date", type: "input" },
      S("urate_status", "Urate Status vs Target", ["At target (< 360 µmol/L)", "Above target", "At target for severe disease (< 300 µmol/L)", "Not measured"]),
      S("renal_function", "Renal Function", ["Normal", "Mild impairment", "Moderate impairment", "Severe impairment / dialysis"]),
      S("joint_aspiration", "Joint Aspiration", ["Performed — crystals seen", "Performed — no crystals, culture pending", "Performed — septic arthritis excluded", "Not performed"]),
      T("aspiration_detail", "Aspiration Detail — appearance, polarised microscopy, Gram stain and culture result"),
      S("stone_disease", "Urinary Stone Disease", ["None", "Previous stones", "Current symptoms", "Not assessed"]),
    ]),
    ...sec("Disease Activity, Flare Burden & Function", activityFields(["haq_di"], [
      I("attacks_last_12_months", "Number of Attacks in the Last 12 Months"),
      S("flare_severity", "Current Flare Severity", NONE_MILD_MOD_SEV),
      S("chronic_arthropathy", "Chronic Gouty Arthropathy", ["Absent", "Present", "With deformity", "Not assessed"]),
    ])),
    ...sec("Complications & Organ Involvement", [
      S("renal_involvement", "Renal Involvement — nephrolithiasis, urate nephropathy", ["None", "Stone disease", "Chronic kidney disease", "Not assessed"]),
      S("cardiovascular", "Cardiovascular Disease", ["None", "Hypertension", "Ischaemic heart disease / heart failure", "Not assessed"]),
      S("metabolic_syndrome", "Metabolic Syndrome", ["None", "Obesity", "Diabetes", "Multiple components"]),
      S("infection_risk", "Infection Risk & Septic Arthritis Concern", ["No concern", "Septic arthritis excluded", "Septic arthritis suspected — emergency management", "Current infection"]),
      T("comorbidity_detail", "Comorbidity Detail"),
    ]),
    ...sec("Treatment History", treatmentFields([
      T("acute_flare_treatment", "Acute Flare Treatment — NSAID, colchicine, glucocorticoid, IL-1 inhibitor with dose and response"),
      T("urate_lowering_therapy", "Urate-Lowering Therapy — agent, dose, titration, target and adherence (allopurinol, febuxostat, benzbromarone, pegloticase)"),
      T("prophylaxis", "Flare Prophylaxis During Urate-Lowering Initiation — agent, dose and duration"),
      T("diet_lifestyle", "Diet, Alcohol & Lifestyle Measures Discussed"),
    ])),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("ult_monitoring", "Urate-Lowering Therapy Monitoring — urate level, renal and liver function, flare frequency and HLA-B*5801 status where relevant"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "serum urate below 360 µmol/L (below 300 µmol/L in severe or tophaceous disease), no further flares, tophi resolving, and renal function preserved",
      flags: "fever with an acute hot joint (septic arthritis until excluded), severe renal colic or anuria, widespread tophaceous ulceration, drug hypersensitivity",
    })),
  ],
};

// ---- 7. Osteoarthritis -----------------------------------------------------
const RHEUM_OA = {
  key: "rheum_dx_oa",
  label: "Osteoarthritis — Disease-Specific Note",
  specialty: "rheumatology",
  notice:
    "Osteoarthritis is a clinical diagnosis: no classification score replaces the history, examination and appropriate radiology. AMedix records the joints involved, pain and function, and the mechanical and inflammatory contributions separately.",
  fields: [
    ...sec("Diagnosis & Differential", diagnosisFields({
      criteria: "ACR clinical/radiographic criteria for the individual joint where used (knee, hip, hand)",
      diagnosisLabel: "Clinical Diagnosis (joints involved and pattern)",
      differentials: "inflammatory arthritis, CPPD, gout, septic arthritis, bursitis, referred pain, fracture, avascular necrosis, malignancy, radiculopathy",
    })),
    ...sec("Osteoarthritis History", [
      T("pain_history", "Pain History — site, onset, character, aggravating and relieving factors, night pain, rest pain"),
      T("mechanical_symptoms", "Mechanical Symptoms — locking, giving way, crepitus, stiffness after rest"),
      T("duration_stiffness", "Stiffness — duration (typically brief morning stiffness) and relation to activity"),
      T("functional_history", "Functional Impact — walking distance, stairs, transfers, dressing, work and leisure"),
      T("previous_injury", "Previous Injury, Surgery or Occupational Loading"),
      T("weight_activity", "Weight, Physical Activity & Exercise History"),
      T("analgesic_history", "Analgesic History — paracetamol, NSAIDs, opioids, topical agents, intra-articular injections with response"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("joint_findings", "Joint Findings — crepitus, bony enlargement, effusion, instability, malalignment, range of movement"),
      T("gait_function", "Gait, Posture & Function"),
      S("inflammatory_signs", "Inflammatory Signs", ["Absent", "Present — alternative diagnosis considered", "Equivocal"]),
      T("neurovascular_findings", "Neurovascular & Regional Findings"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("acute_phase", "Acute-Phase Response", ["Normal", "Mildly raised", "Raised — inflammatory arthritis considered", "Not measured"]),
      T("radiographic_findings", "Radiographic Findings — joint-space narrowing, osteophytes, sclerosis, subchondral cysts"),
      S("severity", "Structural Severity", ["Mild", "Moderate", "Severe", "Not graded"]),
    ]),
    ...sec("Pain, Function & Impact", activityFields(["haq_di"], [
      S("pain_severity", "Pain Severity", NONE_MILD_MOD_SEV),
      T("impact_summary", "Impact Summary — sleep, mood, work, caregiving"),
    ])),
    ...sec("Complications & Comorbidity", [
      S("mobility_limitation", "Mobility Limitation", ["None", "Mild", "Requires walking aid", "Severe / housebound"]),
      S("falls_risk", "Falls Risk", ["Low", "Moderate", "High — assessed", "Not assessed"]),
      S("nsaid_risk", "NSAID Gastrointestinal, Renal & Cardiovascular Risk", ["Low", "Moderate", "High — avoided", "Not assessed"]),
      T("comorbidity_detail", "Comorbidity Detail — obesity, diabetes, cardiovascular disease, depression"),
    ]),
    ...sec("Treatment History", [
      {
        key: "structured_treatment_plan",
        label: "Structured Treatment Plan & Monitoring — ACR/EULAR-aligned decision support",
        type: "rheum_treatment",
      },
      T("non_pharmacological", "Non-Pharmacological Care — education, exercise, physiotherapy, weight management, walking aids, bracing"),
      T("pharmacological", "Pharmacological Care — agent, dose, duration, response and adverse effects"),
      T("injections_procedures", "Intra-Articular Injections & Procedures — site, agent, date and response"),
      S("surgical_referral", "Orthopaedic Referral", ["Not indicated", "Discussed", "Referred", "Awaiting surgery"]),
      T("shared_decision", "Shared Decision-Making — goals discussed and the patient's preference"),
    ]),
    ...sec("Monitoring & Follow-Up Criteria", [
      T("monitoring_plan", "Monitoring Requirements — analgesia review, renal and gastrointestinal safety, function"),
      T("treatment_target", "Functional Goal — what the patient wants to be able to do"),
      T("follow_up_criteria", "Follow-Up Criteria — pain, function and the need for referral"),
      I("review_interval", "Review Interval"),
      T("warning_signs", "Warning Signs Requiring Urgent Review — acute hot swollen joint, night pain with weight loss, progressive neurology, inability to weight-bear"),
    ]),
  ],
};

// ---- 8. Systemic sclerosis -------------------------------------------------
const RHEUM_SSC = {
  key: "rheum_dx_ssc",
  label: "Systemic Sclerosis — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "2013 ACR/EULAR systemic sclerosis classification criteria",
      diagnosisLabel: "Clinical Diagnosis (limited cutaneous, diffuse cutaneous, sine scleroderma or overlap)",
      differentials: "morphoea, scleromyxoedema, eosinophilic fasciitis, nephrogenic systemic fibrosis, Raynaud disease, primary Raynaud, mixed connective tissue disease, diabetic cheiroarthropathy",
    })),
    ...sec("Systemic Sclerosis History", [
      T("onset_history", "Onset — date, Raynaud onset, skin tightening sequence, progression"),
      T("raynaud_history", "Raynaud Phenomenon — frequency, triggers, colour change, ulceration, critical ischaemia"),
      T("skin_history", "Skin History — tightening, pruritus, pigment change, telangiectasia, calcinosis"),
      T("digital_ulcer_history", "Digital Ulcer & Pitting Scar History"),
      T("gastrointestinal_history", "Gastrointestinal — dysphagia, reflux, bloating, diarrhoea, faecal incontinence"),
      T("respiratory_history", "Respiratory — breathlessness, cough, exercise tolerance"),
      T("cardiac_history", "Cardiac — chest pain, palpitations, syncope, oedema"),
      T("renal_history", "Renal — hypertension, headache, visual change, urine output (scleroderma renal crisis symptoms)"),
      T("musculoskeletal_history", "Musculoskeletal — arthralgia, contractures, tendon friction rubs, weakness"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("skin_findings", "Skin Findings — distribution and extent of skin thickening, digital pitting scars, ulcers, calcinosis, telangiectasia"),
      T("vascular_findings", "Vascular Findings — Raynaud severity, digital perfusion, ulcer site and size, gangrene risk"),
      T("musculoskeletal_findings", "Musculoskeletal Findings — contractures, tendon friction rubs, joint range"),
      T("cardiopulmonary_findings", "Cardiopulmonary Findings"),
      T("gastrointestinal_findings", "Gastrointestinal Findings"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("autoantibody_profile", "Autoantibody Profile", ["Anti-centromere", "Anti-topoisomerase I (Scl-70)", "Anti-RNA polymerase III", "Anti-U1 RNP (overlap)", "ANA negative", "Not tested"]),
      S("lung_function", "Lung Function", ["Normal", "Restrictive pattern", "Reduced DLCO", "Restrictive with reduced DLCO", "Not performed"]),
      S("pulmonary_hypertension_screen", "Pulmonary Hypertension Screening (echocardiogram)", ["Normal", "Raised estimated pressure — right-heart study arranged", "Confirmed pulmonary hypertension", "Not performed"]),
      S("renal_crisis_risk", "Scleroderma Renal Crisis Risk", ["Low", "High — recent steroid use or diffuse disease", "Renal crisis treated", "Not assessed"]),
      T("radiology_findings", "Thoracic & Oesophageal Findings — interstitial changes, oesophageal dysmotility, dilatation"),
    ]),
    ...sec("Disease Activity, Skin & Function", activityFields(["mrss", "haq_di"], [
      S("skin_subset", "Cutaneous Subset", ["Limited cutaneous", "Diffuse cutaneous", "Sine scleroderma", "Overlap syndrome"]),
      S("disease_phase", "Disease Phase", ["Early diffuse (< 5 years)", "Late diffuse", "Limited", "Stable / burnt out"]),
      T("organ_involvement_summary", "Organ Involvement Summary — skin, vascular, lung, heart, kidney, gut, musculoskeletal"),
    ])),
    ...sec("Organ Involvement & Complications", [
      S("interstitial_lung_disease", "Interstitial Lung Disease", ["None detected", "Present — monitoring", "Present — immunosuppression started", "Not assessed"]),
      S("pulmonary_arterial_hypertension", "Pulmonary Arterial Hypertension", ["Not present", "Suspected — referral made", "Confirmed — treated", "Not assessed"]),
      S("gi_involvement", "Gastrointestinal Involvement", ["None", "Reflux", "Dysmotility with bacterial overgrowth", "Severe with weight loss"]),
      S("renal_involvement", "Renal Involvement", ["None", "Proteinuria / hypertension", "Scleroderma renal crisis", "Not assessed"]),
      S("cardiac_involvement", "Cardiac Involvement", ["None", "Conduction disease", "Heart failure", "Not assessed"]),
      S("digital_ischaemia", "Digital Ischaemia", ["None", "Ulceration", "Critical ischaemia — urgent", "Prior amputation"]),
      T("comorbidity_detail", "Comorbidity Detail — malignancy surveillance in anti-RNA polymerase III disease, thyroid, bone health"),
    ]),
    ...sec("Treatment History", treatmentFields([
      T("vasodilator_therapy", "Vasodilator & Digital Ulcer Therapy — calcium channel blocker, PDE5 inhibitor, prostacyclin, endothelin antagonist with dose and response"),
      T("immunosuppression_plan", "Immunosuppressive Therapy — agent, indication, dose, duration"),
      T("gastrointestinal_therapy", "Gastrointestinal Therapy — acid suppression, prokinetics, antibiotics for overgrowth"),
      T("steroid_caution", "Glucocorticoid Caution — dose and renal crisis risk documented"),
    ])),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("lung_monitoring", "Lung Monitoring — spirometry, DLCO and thoracic review interval"),
      T("cardiac_renal_monitoring", "Cardiac & Renal Monitoring — blood pressure, creatinine, echocardiogram interval"),
      T("digital_ulcer_monitoring", "Digital Ulcer Care & Vascular Monitoring"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "stable or improved skin score, no digital ulcers, stable lung function and no pulmonary hypertension or renal crisis",
      flags: "new hypertension with headache or visual change, new breathlessness or syncope, critical digital ischaemia, severe reflux with weight loss",
    })),
  ],
};

// ---- 9. Sjögren disease ----------------------------------------------------
const RHEUM_SJOGREN = {
  key: "rheum_dx_sjogren",
  label: "Sjögren Disease — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "2016 ACR/EULAR Sjögren disease classification criteria",
      diagnosisLabel: "Clinical Diagnosis (primary or secondary Sjögren disease)",
      differentials: "drug-induced sicca, chronic hepatitis C, sarcoidosis, IgG4-related disease, lymphoma, age-related sicca, diabetes, hypothyroidism",
    })),
    ...sec("Sjögren Disease History", [
      T("sicca_history", "Ocular & Oral Dryness — duration, severity, effect on reading, eating, speaking, dental care"),
      T("parotid_history", "Parotid & Salivary Gland Swelling — episodes, persistence, pain"),
      T("systemic_history", "Systemic Features — fatigue, fever, weight loss, arthralgia, rash, Raynaud"),
      T("organ_history", "Organ-Specific History — cough, breathlessness, neuropathy, renal symptoms, purpura, cytopenia"),
      T("lymphoma_warning", "Lymphoma Warning Symptoms — persistent glandular swelling, night sweats, weight loss, new lymphadenopathy"),
      T("medication_history", "Medications and Other Causes of Dryness"),
      T("dental_history", "Dental Caries, Periodontal Disease and Oral Candidiasis"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("glandular_findings", "Glandular Findings — parotid, submandibular and lacrimal enlargement"),
      T("ocular_findings", "Ocular Findings — corneal staining, conjunctival inflammation, visual acuity"),
      T("oral_findings", "Oral Findings — mucosal dryness, caries, candidiasis, angular cheilitis"),
      T("systemic_findings", "Systemic Findings — lymphadenopathy, spleen, skin, joints, neurology"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("anti_ro_la", "Anti-Ro/SSA and Anti-La/SSB", ["Both positive", "Anti-Ro positive only", "Anti-La positive only", "Both negative", "Not tested"]),
      S("rf_status", "Rheumatoid Factor", ["Negative", "Positive", "Not tested"]),
      S("schirmer_test", "Schirmer Test", ["Normal", "Reduced — positive", "Not performed"]),
      S("salivary_assessment", "Salivary Assessment — flow rate, sialography, scintigraphy or ultrasound", ["Normal", "Reduced", "Performed — abnormal", "Not performed"]),
      S("biopsy_status", "Labial Salivary Gland Biopsy", ["Not performed", "Performed — focal sialadenitis", "Performed — negative", "Declined"]),
      S("cryoglobulin_status", "Cryoglobulins & Complement", ["Negative", "Positive with low complement", "Not tested"]),
      T("haematology_detail", "Haematology Detail — cytopenias, monoclonal band, lymphoproliferative findings"),
    ]),
    ...sec("Disease Activity & Function", activityFields(["haq_di"], [
      S("fatigue", "Fatigue Severity", NONE_MILD_MOD_SEV),
      S("pain_severity", "Pain Severity", NONE_MILD_MOD_SEV),
      T("systemic_activity_summary", "Systemic Activity Summary — glandular, articular, cutaneous, pulmonary, renal, neurological, haematological"),
    ])),
    ...sec("Organ Involvement & Complications", [
      S("lymphoma_risk", "Lymphoma Risk Assessment", ["Low", "Intermediate — monitoring", "High — investigation arranged", "Lymphoma diagnosed"]),
      S("pulmonary_involvement", "Pulmonary Involvement", ["None", "Interstitial disease", "Airway disease", "Not assessed"]),
      S("renal_involvement", "Renal Involvement", ["None", "Interstitial nephritis", "Distal tubular acidosis", "Not assessed"]),
      S("neurological_involvement", "Neurological Involvement", ["None", "Peripheral neuropathy", "Small-fibre neuropathy", "CNS involvement", "Not assessed"]),
      S("ocular_complication", "Ocular Complications", ["None", "Corneal damage", "Recurrent infection", "Not assessed"]),
      T("comorbidity_detail", "Comorbidity Detail — thyroid, diabetes, hepatitis C, vitamin D, dental status"),
    ]),
    ...sec("Treatment History", treatmentFields([
      T("sicca_therapy", "Sicca Therapy — ocular lubricants, saliva substitutes, sialogogues, punctal occlusion, fluoride and dental care"),
      T("systemic_therapy", "Systemic Therapy — hydroxychloroquine, immunosuppression, biologic with dose and response"),
    ])),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("lymphoma_surveillance", "Lymphoma Surveillance — clinical review, imaging and haematology intervals"),
      T("dental_eye_monitoring", "Dental and Ocular Monitoring Plan"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "controlled sicca symptoms, no systemic flare, no lymphoproliferative progression, and preserved dental and ocular health",
      flags: "rapidly enlarging glandular mass, night sweats or weight loss, new cytopenia, breathlessness, progressive neuropathy",
    })),
  ],
};

// ---- 10. Inflammatory myopathies ------------------------------------------
const RHEUM_IIM = {
  key: "rheum_dx_iim",
  label: "Inflammatory Myopathy — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "2017 EULAR/ACR idiopathic inflammatory myopathy classification criteria (with myositis-specific antibody definition where available)",
      diagnosisLabel: "Clinical Diagnosis (dermatomyositis, polymyositis, immune-mediated necrotising myopathy, overlap myositis, inclusion-body myositis)",
      differentials: "drug-induced myopathy, hypothyroidism, electrolyte disturbance, muscular dystrophy, motor neurone disease, myasthenia gravis, statin myopathy, inclusion-body myositis",
    })),
    ...sec("Myopathy History", [
      T("weakness_history", "Weakness — onset, distribution (proximal, distal, axial, bulbar), progression, stairs and overhead activities"),
      T("myalgia_history", "Muscle Pain and Tenderness"),
      T("skin_history", "Skin Features — heliotrope rash, Gottron papules, shawl sign, V-sign, nail-fold changes, ulceration"),
      T("bulbar_respiratory_history", "Bulbar & Respiratory — dysphagia, aspiration, nasal speech, breathlessness, orthopnoea"),
      T("constitutional_history", "Constitutional — fever, fatigue, weight loss, Raynaud"),
      T("malignancy_screen_history", "Malignancy Screening History — age-appropriate screening, previous cancer, red-flag symptoms"),
      T("family_medication_history", "Family History and Medications (statins, colchicine, glucocorticoids, alcohol)"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("strength_findings", "Strength Findings — neck flexors, shoulder abductors, elbow flexors, wrist extensors, hip extensors/abductors, knee extensors, ankle dorsiflexors"),
      T("skin_findings", "Skin Findings — distribution and activity of rash, ulcers, calcinosis"),
      T("bulbar_findings", "Bulbar & Respiratory Findings"),
      S("joint_involvement", "Joint Involvement", ["None", "Arthralgia", "Arthritis", "Deforming arthropathy"]),
      T("systemic_findings", "Systemic Findings — cardiac, pulmonary, gastrointestinal"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("muscle_enzymes", "Muscle Enzymes", ["CK raised", "CK normal with raised aldolase", "All normal", "Markedly raised"]),
      S("myositis_antibodies", "Myositis-Specific / Associated Antibodies", ["Anti-Mi-2", "Anti-TIF1-γ", "Anti-NXP2", "Anti-MDA5", "Anti-SRP or anti-HMGCR", "Anti-Jo-1 / anti-synthetase", "Anti-U1 RNP", "Negative", "Not tested"]),
      S("emg_mri", "Electromyography / Muscle MRI", ["Performed — myopathic", "Performed — normal", "Not performed"]),
      S("biopsy_status", "Muscle Biopsy", ["Not performed", "Performed — inflammatory myopathy", "Performed — inclusion-body myositis", "Performed — non-diagnostic"]),
      S("lung_involvement", "Pulmonary Assessment", ["Normal", "Restrictive pattern", "Interstitial disease", "Rapidly progressive interstitial disease", "Not performed"]),
    ]),
    ...sec("Disease Activity & Function", activityFields(["mmt8", "haq_di"], [
      T("extramuscular_activity", "Extramuscular Activity — skin, joints, lung, cardiac, gastrointestinal"),
    ])),
    ...sec("Organ Involvement & Complications", [
      S("dysphagia", "Dysphagia & Aspiration Risk", ["None", "Mild", "Severe with aspiration", "Requires feeding support"]),
      S("interstitial_lung_disease", "Interstitial Lung Disease", ["None", "Present — stable", "Present — progressive", "Not assessed"]),
      S("cardiac_involvement", "Cardiac Involvement", ["None", "Conduction abnormality", "Myocarditis", "Not assessed"]),
      S("malignancy_association", "Malignancy Association", ["Screening up to date — none found", "Screening overdue", "Malignancy under investigation", "Malignancy diagnosed"]),
      S("calcinosis_ulceration", "Calcinosis or Skin Ulceration", ["None", "Calcinosis", "Ulceration", "Both"]),
      T("comorbidity_detail", "Comorbidity Detail — bone health, steroid burden, infection risk"),
    ]),
    ...sec("Treatment History", treatmentFields([
      T("steroid_regimen", "Glucocorticoid Regimen — dose, route, taper plan"),
      T("immunosuppression_plan", "Immunosuppressive Therapy — methotrexate, azathioprine, mycophenolate, ciclosporin with dose and response"),
      T("biologic_therapy", "Biologic / Intravenous Immunoglobulin Therapy"),
      T("physical_rehabilitation", "Physical Rehabilitation & Swallowing Therapy"),
    ])),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("enzyme_monitoring", "Muscle Enzyme & Strength Monitoring Interval"),
      T("malignancy_surveillance", "Malignancy Surveillance Plan — which screening, at what interval"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "improving strength with falling muscle enzymes, controlled skin disease, no aspiration, and stable lung function",
      flags: "rapidly progressive weakness, breathlessness, aspiration, fever on immunosuppression, new malignancy symptoms",
    })),
  ],
};

// ---- 11. Vasculitis --------------------------------------------------------
const RHEUM_VASCULITIS = {
  key: "rheum_dx_vasculitis",
  label: "Vasculitis — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "ACR/EULAR classification criteria for the specific vasculitis (GPA, MPA, EGPA, PAN, Takayasu, giant cell arteritis, IgA vasculitis, cryoglobulinaemic) with the CHCC nomenclature",
      diagnosisLabel: "Clinical Diagnosis and Vasculitis Category (small, medium or large vessel)",
      differentials: "infection, malignancy, embolic disease, antiphospholipid syndrome, drug reaction, cholesterol emboli, amyloidosis, thrombotic microangiopathy",
    })),
    ...sec("Vasculitis History", [
      T("onset_history", "Onset & Course — date, tempo, presenting organ, relapses"),
      T("constitutional_history", "Constitutional — fever, weight loss, night sweats, fatigue, myalgia"),
      T("ent_history", "Ear, Nose & Throat — epistaxis, crusting, sinusitis, hearing loss, subglottic symptoms, oral ulcers"),
      T("respiratory_history", "Respiratory — cough, haemoptysis, breathlessness, pleurisy"),
      T("renal_history", "Renal — haematuria, proteinuria, hypertension, urine output, oedema"),
      T("neurological_history", "Neurological — neuropathy, mononeuritis multiplex, headache, stroke, seizures"),
      T("skin_eye_history", "Skin & Eye — purpura, ulcers, nodules, scleritis, episcleritis, visual loss"),
      T("vascular_history", "Vascular — claudication, limb blood pressure difference, bruits, ischaemia"),
      T("drug_infection_history", "Drug and Infection Exposures — including hydralazine, propylthiouracil, cocaine, hepatitis B/C"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("ent_findings", "Ear, Nose & Throat Findings"),
      T("cutaneous_findings", "Cutaneous Findings — purpura, livedo, ulcers, infarcts"),
      T("neurological_findings", "Neurological Findings — cranial nerves and peripheral nerves"),
      T("vascular_findings", "Vascular Findings — pulses, bruits, blood pressure difference, temperature gradient"),
      T("ocular_findings", "Ocular Findings"),
      T("cardiopulmonary_findings", "Cardiopulmonary Findings"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("anca_status", "ANCA", ["c-ANCA / anti-PR3", "p-ANCA / anti-MPO", "ANCA negative", "Not tested"]),
      S("renal_function", "Renal Function & Urinalysis", ["Normal", "Active sediment", "Impaired function", "Rapidly deteriorating", "On dialysis"]),
      S("biopsy_status", "Tissue Biopsy", ["Performed — vasculitis confirmed", "Performed — non-diagnostic", "Not performed"]),
      T("biopsy_detail", "Biopsy Site & Histology"),
      S("angiography", "Vascular Study (angiography, MR or CT angiography, PET)", ["Performed — diagnostic", "Performed — normal", "Not performed"]),
      S("hepatitis_status", "Hepatitis B / C Status (relevant to all vasculitis)", ["Negative", "Hepatitis B positive", "Hepatitis C positive", "Not tested"]),
    ]),
    ...sec("Disease Activity, Damage & Function", activityFields(["bvas_v3", "haq_di"], [
      T("organ_damage", "Cumulative Organ Damage — renal, neurological, cardiac, hearing, vision, limb loss"),
      T("organ_involvement_summary", "Organ Involvement Summary — every system with active or persistent disease"),
    ])),
    ...sec("Complications & Organ Involvement", [
      S("renal_at_risk", "Renal Involvement", ["None", "Active glomerulonephritis", "Chronic kidney disease", "End-stage renal disease"]),
      S("pulmonary_involvement", "Pulmonary Involvement", ["None", "Alveolar haemorrhage", "Nodules / cavities", "Fibrosis", "Not assessed"]),
      S("neurological_involvement", "Neurological Involvement", ["None", "Mononeuritis multiplex", "CNS involvement", "Cranial neuropathy", "Not assessed"]),
      S("cardiac_involvement", "Cardiac Involvement", ["None", "Pericarditis", "Myocarditis / ischaemia", "Aortic involvement", "Not assessed"]),
      S("gi_involvement", "Gastrointestinal Involvement", ["None", "Abdominal pain / bleeding", "Ischaemic bowel", "Not assessed"]),
      S("infection_complication", "Infection Complication", ["None", "Treated infection", "Current severe infection", "Recurrent infection"]),
      T("comorbidity_detail", "Comorbidity Detail — cardiovascular, bone, diabetes, malignancy risk"),
    ]),
    ...sec("Treatment History", treatmentFields([
      T("induction_therapy", "Remission-Induction Therapy — glucocorticoid, cyclophosphamide, rituximab, plasma exchange with dates and response"),
      T("maintenance_therapy", "Remission-Maintenance Therapy — agent, dose and planned duration"),
      T("pjp_prophylaxis", "Pneumocystis Prophylaxis & Bone Protection"),
      T("refractory_disease", "Refractory or Relapsing Disease — what was tried and the outcome"),
    ])),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("renal_monitoring", "Renal Monitoring — creatinine, urinalysis, protein:creatinine ratio and review interval"),
      T("immunosuppression_monitoring", "Immunosuppression Monitoring — full blood count, liver function, glucose, bone protection"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "remission (BVAS 0) or low disease activity off induction therapy, preserved organ function, no relapse",
      flags: "haemoptysis, rapidly rising creatinine, new neurological deficit, severe abdominal pain, fever on immunosuppression, visual loss",
    })),
  ],
};

// ---- 12. Polymyalgia rheumatica -------------------------------------------
const RHEUM_PMR = {
  key: "rheum_dx_pmr",
  label: "Polymyalgia Rheumatica — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "2012 EULAR/ACR provisional classification criteria for polymyalgia rheumatica",
      diagnosisLabel: "Clinical Diagnosis (with the diagnostic uncertainty and treatment response documented)",
      differentials: "giant cell arteritis, rheumatoid arthritis, late-onset spondyloarthritis, inflammatory myopathy, malignancy, infection, hypothyroidism, fibromyalgia, frozen shoulder, osteoarthritis of the hip",
    })),
    ...sec("Polymyalgia Rheumatica History", [
      T("onset_history", "Onset — date, speed, distribution of pain and stiffness"),
      T("girdle_symptoms", "Shoulder and Pelvic Girdle Symptoms — symmetry, night pain, difficulty rising or raising arms"),
      T("systemic_history", "Constitutional — weight loss, fever, fatigue, anorexia"),
      S("gca_symptoms", "Giant Cell Arteritis Symptoms", ["None", "Headache", "Jaw claudication", "Visual symptoms", "Multiple features"]),
      T("gca_detail", "Giant Cell Arteritis Detail and Urgency Plan", {}, when("gca_symptoms", "Headache", "Jaw claudication", "Visual symptoms", "Multiple features")),
      T("function_history", "Functional Impact — dressing, transfers, stairs, work"),
      T("steroid_response_history", "Response to Previous Glucocorticoid Trial — dose, speed of response and relapse"),
      T("malignancy_infection_screen", "Malignancy and Infection Screen Documented"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("girdle_findings", "Girdle Findings — shoulder and hip restriction, tenderness, synovitis"),
      T("peripheral_findings", "Peripheral Findings — distal swelling, carpal tunnel, pitting oedema"),
      T("temporal_artery_findings", "Temporal Artery Findings — tenderness, thickening, pulses"),
      T("neurological_findings", "Neurological & Visual Findings"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("acute_phase", "Acute-Phase Response", ["ESR and CRP markedly raised", "Mildly raised", "Normal — diagnosis questioned", "Discordant"]),
      S("rf_ccp", "Rheumatoid Factor / Anti-CCP", ["Both negative", "RF positive", "Anti-CCP positive", "Not tested"]),
      S("temporal_artery_biopsy", "Temporal Artery Biopsy or Ultrasound", ["Not indicated", "Arrange urgently", "Performed — positive", "Performed — negative"]),
    ]),
    ...sec("Activity, Function & Impact", activityFields(["haq_di"], [
      S("disease_activity_judgement", "Clinician Judgement of Activity", ["Active", "Partially controlled", "Remission", "Relapse"]),
    ])),
    ...sec("Complications & Comorbidity", [
      S("visual_risk", "Visual Risk", ["No visual symptoms", "Transient visual loss", "Established visual loss", "Not assessed"]),
      S("vascular_risk", "Aortic & Large-Vessel Involvement", ["No concern", "Imaging arranged", "Aneurysm documented", "Not assessed"]),
      S("steroid_toxicity", "Glucocorticoid Toxicity", ["None", "Mild", "Significant — bone, glucose, blood pressure", "Not assessed"]),
      T("comorbidity_detail", "Comorbidity Detail — diabetes, osteoporosis, hypertension, infection risk"),
    ]),
    ...sec("Treatment History", [
      {
        key: "structured_treatment_plan",
        label: "Structured Treatment Plan & Monitoring — ACR/EULAR-aligned decision support",
        type: "rheum_treatment",
      },
      T("glucocorticoid_regimen", "Glucocorticoid Regimen — starting dose, current dose, taper plan and duration"),
      T("steroid_sparing", "Steroid-Sparing Therapy — methotrexate or biologic with dose and response"),
      T("relapse_history", "Relapse History and Treatment Response"),
      T("shared_decision", "Shared Decision-Making — including the tapering plan and relapse plan"),
      T("adherence", "Treatment Adherence"),
    ]),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("steroid_monitoring", "Glucocorticoid Monitoring — glucose, blood pressure, bone protection, weight, mood"),
      T("relapse_monitoring", "Relapse Monitoring — symptoms and acute-phase response interval"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "symptom remission with a tapering glucocorticoid regimen and the lowest effective dose, without relapse",
      flags: "visual loss, jaw claudication, new headache, limb claudication, fever, weight loss with atypical features",
    })),
  ],
};

// ---- 13. Giant cell arteritis ----------------------------------------------
const RHEUM_GCA = {
  key: "rheum_dx_gca",
  label: "Giant Cell Arteritis — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "2022 ACR/EULAR classification criteria for giant cell arteritis",
      diagnosisLabel: "Clinical Diagnosis (with the urgency of the presentation and the confirmation method documented)",
      differentials: "migraine, tension headache, infection, malignancy, polymyalgia rheumatica alone, Takayasu arteritis, non-arteritic anterior ischaemic optic neuropathy, medication-related headache",
    })),
    ...sec("Giant Cell Arteritis History", [
      T("headache_history", "Headache — onset, site, character, scalp tenderness, temporal artery symptoms"),
      S("jaw_claudication", "Jaw Claudication", ["Absent", "Present", "Present with tongue claudication"]),
      S("visual_symptoms", "Visual Symptoms", ["None", "Amaurosis fugax", "Diplopia", "Established visual loss", "Bilateral involvement"]),
      T("visual_detail", "Visual Symptom Detail — onset, duration, affected eye and urgency plan", {}, when("visual_symptoms", "Amaurosis fugax", "Diplopia", "Established visual loss", "Bilateral involvement")),
      T("pmr_symptoms", "Polymyalgia Symptoms — girdle pain and stiffness"),
      T("constitutional_history", "Constitutional — fever, weight loss, anorexia, fatigue"),
      T("limb_vascular_history", "Limb Claudication, Bruits and Blood Pressure Difference"),
      T("prior_steroid_history", "Glucocorticoid Given Before Assessment — dose, timing and effect on the findings"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("temporal_artery_findings", "Temporal Artery Findings — tenderness, nodularity, pulselessness"),
      T("visual_findings", "Visual Assessment — acuity, fields, fundoscopy"),
      T("vascular_findings", "Vascular Findings — pulses, bruits, blood pressure difference"),
      S("scalp_tenderness", "Scalp Tenderness", ["Absent", "Present", "Present with necrosis"]),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("acute_phase", "Acute-Phase Response", ["ESR and CRP markedly raised", "Mildly raised", "Normal — diagnosis questioned", "Discordant"]),
      S("vascular_ultrasound", "Temporal and Axillary Artery Ultrasound", ["Performed — halo sign", "Performed — negative", "Not performed"]),
      S("temporal_artery_biopsy", "Temporal Artery Biopsy", ["Performed — positive", "Performed — negative", "Arranged", "Not performed"]),
      S("large_vessel_study", "Large-Vessel Study (MR/CT angiography or PET)", ["Performed — aortitis", "Performed — normal", "Not performed"]),
    ]),
    ...sec("Activity, Function & Impact", activityFields(["haq_di"], [
      S("disease_activity_judgement", "Clinician Judgement of Activity", ["Active", "Partially controlled", "Remission", "Relapse"]),
    ])),
    ...sec("Complications & Organ Involvement", [
      S("visual_outcome", "Visual Outcome", ["No loss", "Transient loss recovered", "Partial loss", "Permanent loss", "Bilateral loss"]),
      S("aortic_involvement", "Aortic Involvement", ["None", "Aortitis on imaging", "Aneurysm — surveillance", "Dissection"]),
      S("cranial_neuropathy", "Cranial Nerve or Neurological Involvement", ["None", "Present", "Not assessed"]),
      S("steroid_toxicity", "Glucocorticoid Toxicity", ["None", "Mild", "Significant — bone, glucose, blood pressure, infection", "Not assessed"]),
      T("comorbidity_detail", "Comorbidity Detail"),
    ]),
    ...sec("Treatment History", [
      {
        key: "structured_treatment_plan",
        label: "Structured Treatment Plan & Monitoring — ACR/EULAR-aligned decision support",
        type: "rheum_treatment",
      },
      T("glucocorticoid_regimen", "Glucocorticoid Regimen — initial dose, route, current dose and taper plan"),
      T("steroid_sparing", "Tocilizumab or Other Steroid-Sparing Therapy — dose, duration and response"),
      T("aspirin_antithrombotic", "Antiplatelet Therapy Decision"),
      T("shared_decision", "Shared Decision-Making — including the visual-loss emergency plan"),
      T("adherence", "Treatment Adherence"),
    ]),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("steroid_monitoring", "Glucocorticoid Monitoring — glucose, blood pressure, bone protection, weight, mood and infection surveillance"),
      T("relapse_monitoring", "Relapse Monitoring — symptoms and acute-phase response interval"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "sustained clinical remission with a tapering glucocorticoid regimen and no visual or vascular complication",
      flags: "any new visual symptom (same-day ophthalmology and steroid), jaw claudication, limb claudication, new headache with fever, chest or back pain suggesting aortic involvement",
    })),
  ],
};

// ---- 14. Antiphospholipid syndrome ----------------------------------------
const RHEUM_APS = {
  key: "rheum_dx_aps",
  label: "Antiphospholipid Syndrome — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "2006 Sydney revised Sapporo classification criteria (clinical event plus persistent antiphospholipid antibody)",
      diagnosisLabel: "Clinical Diagnosis (primary or secondary antiphospholipid syndrome)",
      differentials: "inherited thrombophilia, heparin-induced thrombocytopenia, thrombosis from malignancy or myeloproliferative disease, lupus anticoagulant artefact, pre-eclampsia without APS, vasculitis",
    })),
    ...sec("Thrombosis & Pregnancy History", [
      T("venous_thrombosis_history", "Venous Thrombosis — site, date, provocation, treatment and recurrence"),
      T("arterial_thrombosis_history", "Arterial Thrombosis — site, date, stroke or myocardial infarction, treatment"),
      S("thrombosis_type", "Thrombosis Pattern", ["None", "Single venous", "Single arterial", "Recurrent", "Multiple sites"]),
      T("pregnancy_history", "Pregnancy Morbidity — losses, timing, severe pre-eclampsia, placental insufficiency, preterm birth"),
      S("livedo_renal", "Livedo Reticularis, Renal or Haematological Features", ["None", "Livedo reticularis", "Renal involvement", "Thrombocytopenia", "Multiple"]),
      T("bleeding_history", "Bleeding History and Anticoagulation Tolerance"),
      T("drug_history", "Drugs and Reversible Risk Factors — oestrogen, smoking, immobility, surgery"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("cutaneous_findings", "Cutaneous Findings — livedo, ulcers, necrosis, splinter haemorrhages"),
      T("cardiac_respiratory_findings", "Cardiac, Respiratory & Vascular Findings"),
      T("neurological_findings", "Neurological Findings"),
      T("obstetric_findings", "Obstetric Findings"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("lupus_anticoagulant", "Lupus Anticoagulant", ["Positive", "Negative", "Not tested"]),
      S("anticardiolipin", "Anticardiolipin Antibody (IgG/IgM)", ["Positive — high titre", "Positive — low titre", "Negative", "Not tested"]),
      S("anti_b2gpi", "Anti-β2-Glycoprotein I Antibody", ["Positive", "Negative", "Not tested"]),
      S("persistence", "Persistence of Antibodies (repeat ≥ 12 weeks)", ["Persistent — confirmed", "Single positive — repeat pending", "Transient — not APS", "Not repeated"]),
      S("antibody_profile", "Antibody Profile", ["Triple positive", "Double positive", "Single positive", "All negative"]),
      S("thrombocytopenia", "Thrombocytopenia / Haemolysis", ["None", "Mild thrombocytopenia", "Severe thrombocytopenia", "Haemolytic anaemia"]),
      T("vascular_study", "Vascular Study Findings — venous, arterial or organ infarction documented"),
    ]),
    ...sec("Activity, Function & Risk", activityFields(["haq_di"], [
      S("thrombotic_risk", "Recurrent Thrombosis Risk", ["Low", "Moderate", "High — triple positive or recurrent events", "Not assessed"]),
      S("anticoagulation_quality", "Anticoagulation Control", ["Within target range", "Subtherapeutic", "Supratherapeutic", "Not applicable"]),
    ])),
    ...sec("Organ Involvement & Complications", [
      S("renal_involvement", "Renal Involvement (APS nephropathy)", ["None", "Proteinuria / hypertension", "Thrombotic microangiopathy", "Not assessed"]),
      S("cardiac_involvement", "Cardiac Involvement", ["None", "Valve disease", "Thrombosis", "Not assessed"]),
      S("neurological_involvement", "Neurological Involvement", ["None", "Stroke / TIA", "Cognitive change", "Not assessed"]),
      S("obstetric_risk", "Obstetric Risk in Current or Planned Pregnancy", ["Not applicable", "High — specialist obstetric care", "Current pregnancy — managed", "Postpartum period"]),
      S("catastrophic_aps", "Catastrophic APS Features", ["None", "Suspected — emergency", "Diagnosed — treated", "Not assessed"]),
      T("comorbidity_detail", "Comorbidity Detail — SLE, cardiovascular risk, bleeding risk"),
    ]),
    ...sec("Treatment History", treatmentFields([
      T("anticoagulation", "Anticoagulation — agent, dose, target INR or DOAC decision, duration"),
      T("antiplatelet", "Antiplatelet Therapy"),
      T("obstetric_therapy", "Obstetric Therapy — aspirin, heparin and monitoring plan"),
      T("immunosuppression_plan", "Immunosuppression or Plasma Exchange where indicated"),
    ])),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("anticoagulation_monitoring", "Anticoagulation Monitoring — INR target, renal function, bleeding surveillance"),
      T("antibody_monitoring", "Antibody Re-testing Interval and Clinical Review"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "no recurrent thrombosis or pregnancy loss on therapy, anticoagulation within target, and modifiable risk factors controlled",
      flags: "new thrombosis, bleeding on anticoagulation, multi-organ failure suggesting catastrophic APS, pregnancy on anticoagulation",
    })),
  ],
};

// ---- 15. Osteoporosis & metabolic bone disease ----------------------------
const RHEUM_OSTEOPOROSIS = {
  key: "rheum_dx_osteoporosis",
  label: "Osteoporosis & Metabolic Bone Disease — Disease-Specific Note",
  specialty: "rheumatology",
  notice:
    "Fracture risk is a clinical judgement informed by bone density, fracture history and the validated risk tool. A FRAX probability must come from the official country-calibrated tool — AMedix records the inputs and the tool's output, never an estimate.",
  fields: [
    ...sec("Diagnosis & Differential", [
      I("diagnosis_date", "Date of Diagnosis"),
      { key: "icd11_diagnoses", label: "Diagnosis & Differential (ICD-11) — role, status and clinical basis", type: "icd11_diagnoses" },
      S("diagnosis_basis", "Diagnostic Basis", ["Fragility fracture", "Bone density T-score ≤ −2.5", "Low bone mass with high fracture risk", "Secondary osteoporosis", "Not yet established"]),
      T("clinical_diagnosis", "Clinical Diagnosis and Reasoning", R),
      T("differential_diagnoses", "Differential Diagnosis — osteomalacia, malignancy, myeloma, hyperparathyroidism, renal osteodystrophy, Paget disease, medication effect"),
    ]),
    ...sec("Bone Health History", [
      T("fracture_history", "Fragility Fracture History — site, date, mechanism, treatment and subsequent fractures"),
      T("fall_history", "Falls History — frequency, circumstances, syncope, vision, footwear, home hazards"),
      T("risk_factor_history", "Risk Factors — smoking, alcohol, low body weight, family history, early menopause, immobilisation"),
      T("glucocorticoid_history", "Glucocorticoid Exposure — dose, duration and cumulative burden"),
      T("secondary_cause_history", "Secondary Causes Screened — hyperthyroidism, hyperparathyroidism, malabsorption, coeliac disease, chronic kidney disease, hypogonadism, transplantation"),
      T("diet_lifestyle_history", "Calcium Intake, Vitamin D, Sunlight and Exercise"),
      T("previous_therapy", "Previous Bone Therapy — agent, duration, adherence, adverse effects"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("skeletal_findings", "Skeletal Findings — kyphosis, height loss, vertebral tenderness, deformity"),
      T("falls_assessment", "Falls and Mobility Assessment"),
      S("fragility_fracture_present", "Fragility Fracture Present", YES_NO),
    ]),
    ...sec("Bone Density, Laboratory & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("bmd_result", "Bone Mineral Density (DXA) — lowest T-score", ["Normal (≥ −1.0)", "Osteopenia (−1.1 to −2.4)", "Osteoporosis (≤ −2.5)", "Severe osteoporosis with fracture", "Not performed"]),
      T("bmd_sites", "BMD Values and Sites — lumbar spine, femoral neck, total hip with dates"),
      S("vertebral_assessment", "Vertebral Fracture Assessment", ["No fracture", "Vertebral fracture present", "Not performed"]),
      S("secondary_cause_screen", "Secondary Cause Screen", ["No secondary cause identified", "Secondary cause identified", "Screen incomplete"]),
      S("vitamin_d_status", "Vitamin D Status", ["Replete", "Insufficient", "Deficient — replacement started", "Not measured"]),
    ]),
    ...sec("Fracture Risk — Validated Assessment", activityFields(["frax"], [
      T("risk_interpretation", "Interpretation against the local intervention threshold — the threshold used and the decision it supported"),
    ])),
    ...sec("Fracture Risk, Complications & Comorbidity", [
      S("fracture_risk_category", "Fracture Risk Category", ["Low", "Moderate", "High — very high risk", "Established osteoporosis with fracture"]),
      S("fall_risk", "Falls Risk", ["Low", "Moderate", "High — intervention planned", "Not assessed"]),
      S("prior_fracture_complication", "Fracture Complications", ["None", "Chronic pain", "Functional loss", "Neurovascular complication"]),
      S("dental_renal_status", "Dental & Renal Status for Antiresorptive Therapy", ["Satisfactory", "Dental work required first", "Renal impairment — dose adjustment", "Not assessed"]),
      T("comorbidity_detail", "Comorbidity Detail — including glucocorticoid-treated inflammatory disease and malabsorption"),
    ]),
    ...sec("Treatment History", [
      {
        key: "structured_treatment_plan",
        label: "Structured Treatment Plan & Monitoring — ACR/EULAR-aligned decision support",
        type: "rheum_treatment",
      },
      T("calcium_vitamin_d", "Calcium and Vitamin D Supplementation"),
      T("bone_therapy", "Bone Therapy — bisphosphonate, denosumab, teriparatide, romosozumab with dose, duration and response"),
      T("glucocorticoid_protection", "Glucocorticoid-Induced Osteoporosis Protection"),
      S("adherence", "Treatment Adherence", ["Taking as prescribed", "Partial adherence", "Not taking", "Not applicable"]),
      T("adverse_effects", "Adverse Effects — including atypical femoral fracture, osteonecrosis of the jaw, hypocalcaemia"),
      T("shared_decision", "Shared Decision-Making — benefits, risks, duration and the stopping plan"),
    ]),
    ...sec("Monitoring & Follow-Up Criteria", [
      T("monitoring_plan", "Monitoring Requirements — repeat bone density interval, calcium and vitamin D, renal function, dental review"),
      T("treatment_target", "Treatment Goal — fracture prevention and the risk category being managed"),
      T("follow_up_criteria", "Follow-Up Criteria — adherence, new fracture, falls and the need for treatment change"),
      I("review_interval", "Review Interval"),
      T("warning_signs", "Warning Signs — new back pain, height loss, thigh pain on bisphosphonate, jaw pain, hypocalcaemia symptoms"),
    ]),
  ],
};

// ---- 16. Juvenile idiopathic arthritis ------------------------------------
const RHEUM_JIA = {
  key: "rheum_dx_jia",
  label: "Juvenile Idiopathic Arthritis — Disease-Specific Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Diagnosis, Classification & Differential", diagnosisFields({
      criteria: "ILAR classification categories for juvenile idiopathic arthritis (oligoarticular, RF-positive polyarticular, RF-negative polyarticular, systemic, psoriatic, enthesitis-related, undifferentiated)",
      diagnosisLabel: "Clinical Diagnosis and ILAR Category",
      differentials: "infection, leukaemia, lymphoma, neuroblastoma, reactive arthritis, Lyme disease, inflammatory bowel disease arthritis, Behçet disease, chronic recurrent multifocal osteomyelitis, mechanical pain",
    })),
    ...sec("Juvenile Arthritis History", [
      I("onset_age", "Age at Onset & Date of Onset"),
      T("presenting_history", "Presenting History — joints involved, swelling, stiffness, refusal to walk, night pain"),
      S("systemic_features", "Systemic Features", ["None", "Fever", "Rash", "Serositis", "Multiple features"]),
      T("systemic_detail", "Fever, Rash and Serositis Detail", {}, when("systemic_features", "Fever", "Rash", "Serositis", "Multiple features")),
      T("growth_history", "Growth, Weight and Pubertal Progress"),
      T("eye_history", "Eye History — redness, pain, photophobia, screening history"),
      T("function_school", "Function, School Attendance and Participation"),
      T("family_history", "Family History of Psoriasis, Spondyloarthritis or Inflammatory Bowel Disease"),
      T("previous_therapy", "Previous Therapy and Response — including glucocorticoid exposure"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("joint_findings", "Joint Findings — swelling, warmth, restriction, contracture, leg-length discrepancy"),
      S("uveitis_screen", "Uveitis Screening", ["Up to date — normal", "Up to date — abnormal", "Overdue", "Not applicable"]),
      T("growth_findings", "Growth and Nutrition Findings"),
      T("systemic_findings", "Systemic Findings — rash, lymphadenopathy, hepatosplenomegaly, serositis"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      S("rf_status", "Rheumatoid Factor", ["Negative", "Positive", "Not tested"]),
      S("ana_status", "Antinuclear Antibody", ["Negative", "Positive", "Not tested"]),
      S("hla_b27", "HLA-B27", ["Positive", "Negative", "Not tested"]),
      S("acute_phase", "Acute-Phase Response", ["Raised", "Normal", "Discordant"]),
      T("radiology_findings", "Radiographic & Ultrasound Findings"),
    ]),
    ...sec("Disease Activity, Function & Growth", activityFields(["jadas27_esr", "jadas27_crp", "haq_di"], [
      T("damage_growth_impact", "Damage, Growth and Bone Health Impact"),
    ])),
    ...sec("Complications & Organ Involvement", [
      S("uveitis", "Uveitis", ["None", "Previous episodes", "Active — ophthalmology involved", "Not assessed"]),
      S("macrophage_activation", "Macrophage Activation Syndrome Risk", ["No concern", "Suspected — emergency assessment", "Diagnosed", "Not applicable"]),
      S("growth_impact", "Growth Impact", ["Normal growth", "Mild growth delay", "Significant growth impairment", "Not assessed"]),
      S("bone_health", "Bone Health", ["Normal", "Osteopenia", "Fracture", "Not assessed"]),
      S("amyloidosis", "Amyloidosis / Chronic Inflammation Impact", ["None", "Suspected", "Not assessed"]),
      T("comorbidity_detail", "Comorbidity and Psychosocial Detail — school, mental health, family impact"),
    ]),
    ...sec("Treatment History", [
      {
        key: "structured_treatment_plan",
        label: "Structured Treatment Plan & Monitoring — ACR/EULAR-aligned decision support",
        type: "rheum_treatment",
      },
      T("nsaid_methotrexate", "NSAID and Methotrexate Therapy — dose, route, response and monitoring"),
      T("biologic_therapy", "Biologic Therapy — agent, dose, interval, response and adverse effects"),
      T("glucocorticoid", "Glucocorticoid Use — route, dose, taper and bone protection"),
      T("intra_articular", "Intra-Articular Glucocorticoid Injections — joint, date and response"),
      T("physiotherapy_ophthalmology", "Physiotherapy, Occupational Therapy and Ophthalmology Involvement"),
      T("adherence", "Treatment Adherence"),
      T("transition_plan", "Transition Planning to Adult Care"),
    ]),
    ...sec("Safety Screening & Monitoring", monitoringFields([
      T("growth_monitoring", "Growth, Nutrition and Bone Monitoring"),
      T("uveitis_monitoring", "Uveitis Screening Interval per the current national guidance"),
    ])),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "inactive disease (JADAS-27 ≤ 1) with normal growth, no uveitis and full school participation",
      flags: "fever with rash and cytopenia (macrophage activation syndrome), red painful eye, refusal to walk, severe pain with inability to weight-bear",
    })),
  ],
};

// ---- 17. Septic arthritis --------------------------------------------------
const RHEUM_SEPTIC = {
  key: "rheum_dx_septic",
  label: "Septic Arthritis — Disease-Specific Note",
  specialty: "rheumatology",
  notice:
    "A hot swollen joint with fever is septic arthritis until proven otherwise: aspiration and culture before antibiotics, and urgent orthopaedic referral. This template documents the emergency assessment and does not replace the local sepsis pathway.",
  fields: [
    ...sec("Diagnosis & Differential", [
      I("presentation_datetime", "Date and Time of Presentation"),
      { key: "icd11_diagnoses", label: "Diagnosis & Differential (ICD-11) — role, status and clinical basis", type: "icd11_diagnoses" },
      T("clinical_diagnosis", "Clinical Diagnosis — joint involved and the working clinical conclusion", R),
      T("differential_diagnoses", "Differential Diagnosis — gout, CPPD, reactive arthritis, inflammatory flare, haemarthrosis, bursitis, osteomyelitis, endocarditis-related", R),
    ]),
    ...sec("Emergency History", [
      I("joint_involved", "Joint Involved"),
      T("onset_history", "Onset and Duration — hours to days, preceding trauma, procedure or injection"),
      S("fever", "Fever / Systemic Illness", ["Absent", "Present", "Present with rigors", "Haemodynamically unstable"]),
      T("risk_factors", "Risk Factors — prosthesis, recent joint surgery or injection, immunosuppression, diabetes, intravenous drug use, skin infection, endocarditis, rheumatoid arthritis, age > 80"),
      T("source_history", "Possible Source — skin, urinary, respiratory, dental, gastrointestinal, indwelling line"),
      T("antibiotic_history", "Antibiotics Already Given — agent, dose and timing before aspiration"),
      T("allergy_history", "Drug Allergy History"),
    ]),
    ...sec("Examination Findings", [
      { key: "vital_signs", label: "Vital Signs", type: "vitals" },
      structuredExam(),
      T("joint_findings", "Joint Findings — swelling, warmth, erythema, effusion, range of movement, weight-bearing"),
      S("systemic_toxicity", "Systemic Toxicity", ["None", "Mild", "Moderate", "Septic physiology"]),
      T("other_findings", "Other Findings — skin, prosthetic material, cardiac murmurs, neurology"),
    ]),
    ...sec("Laboratory, Microbiology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Microbiology & Radiology — select only those indicated", type: "investigation_panels" },
      S("aspiration_status", "Joint Aspiration", ["Performed — purulent", "Performed — turbid", "Performed — blood-stained", "Performed — clear", "Not yet performed"]),
      T("synovial_analysis", "Synovial Fluid Analysis — cell count, differential, Gram stain, crystals and culture"),
      S("blood_cultures", "Blood Cultures", ["Taken — positive", "Taken — negative", "Taken — pending", "Not taken"]),
      S("inflammatory_markers", "Inflammatory Markers", ["CRP and ESR raised", "CRP raised", "Markedly raised with organ dysfunction", "Normal — diagnosis questioned"]),
      T("radiology_findings", "Radiographic, Ultrasound or MRI Findings"),
      S("prosthetic_joint", "Prosthetic Joint", ["No prosthesis", "Prosthesis present", "Prosthesis present with loosening"]),
    ]),
    ...sec("Sepsis, Complications & Organ Involvement", [
      S("sepsis_status", "Sepsis Status", ["No sepsis", "Sepsis", "Septic shock", "Not assessed"]),
      S("bacteraemia", "Bacteraemia / Endocarditis Risk", ["No concern", "Bacteraemia", "Endocarditis suspected — echocardiogram arranged", "Not assessed"]),
      S("joint_destruction_risk", "Joint Destruction Risk", ["Low", "Moderate", "High — surgical washout indicated", "Established destruction"]),
      S("immunosuppression", "Immunosuppression", ["None", "Biologic or DMARD therapy", "Glucocorticoids", "Multiple agents"]),
      T("comorbidity_detail", "Comorbidity Detail"),
    ]),
    ...sec("Treatment & Disposition", [
      T("antibiotic_plan", "Antibiotic Plan — agent, dose, route, duration and microbiology guidance"),
      S("surgical_management", "Surgical Management", ["Not required", "Aspiration only", "Arthroscopic washout", "Open washout", "Prosthesis revision"]),
      S("admission", "Disposition", ["Admitted under orthopaedics", "Admitted under medicine", "Day-case pathway", "Discharged with review"]),
      T("analgesia", "Analgesia and Joint Protection"),
      T("shared_decision", "Discussion with the Patient — diagnosis, plan, risks"),
    ]),
    ...sec("Monitoring & Follow-Up Criteria", [
      T("monitoring_plan", "Monitoring Requirements — temperature, inflammatory markers, renal function, antibiotic levels and joint review"),
      T("follow_up_criteria", "Follow-Up Criteria — clinical response, repeat aspiration, microbiology and orthopaedic review"),
      I("review_interval", "Review Interval"),
      T("warning_signs", "Warning Signs — persistent fever, worsening pain, systemic deterioration, new joint involvement"),
    ]),
  ],
};

// ---- 18. Other rheumatological conditions ---------------------------------
const RHEUM_OTHER = {
  key: "rheum_dx_other",
  label: "Other Rheumatological Condition — Structured Note",
  specialty: "rheumatology",
  notice: CLASSIFICATION_NOTICE,
  fields: [
    ...sec("Condition & Diagnosis", [
      I("condition_name", "Condition", R),
      S("condition_category", "Category", [
        "Autoimmune connective tissue disease",
        "Autoinflammatory disease",
        "Systemic vasculitis",
        "Crystal or metabolic arthropathy",
        "Metabolic bone disease",
        "Infection-related rheumatological disease",
        "Other",
      ], R),
      I("diagnosis_date", "Date of Diagnosis"),
      { key: "icd11_diagnoses", label: "Diagnosis & Differential (ICD-11) — role, status and clinical basis", type: "icd11_diagnoses" },
      T("clinical_diagnosis", "Clinical Diagnosis and Supporting Evidence", R),
      T("classification_criteria_note", "Classification Criteria — name, version, items met and items missing"),
      T("differential_diagnoses", "Differential Diagnosis Considered and Excluded"),
    ]),
    ...sec("History", [
      T("presenting_history", "Presenting History — onset, course, organ involvement"),
      T("systemic_history", "Constitutional and Systemic Symptoms"),
      T("organ_specific_history", "Organ-Specific Symptoms"),
      T("previous_history", "Previous Diagnoses, Treatments and Response"),
      T("family_social_history", "Family, Social and Occupational History"),
    ]),
    ...sec("Examination Findings", [
      structuredExam(),
      T("general_findings", "General Findings"),
      T("organ_findings", "Organ-Specific Findings"),
    ]),
    ...sec("Laboratory, Serology & Radiology", [
      { key: "rheum_workup", label: "Laboratory, Serology & Radiology — select only those indicated", type: "investigation_panels" },
      T("serology_detail", "Serology & Immunology Findings"),
      T("radiology_findings", "Radiological Findings"),
      S("acute_phase", "Acute-Phase Response", ["Raised", "Normal", "Discordant", "Not measured"]),
    ]),
    ...sec("Disease Activity & Function", activityFields(["haq_di"], [
      T("activity_assessment", "Disease Activity Assessment — condition-appropriate measures and the reasoning"),
    ])),
    ...sec("Organ Involvement & Complications", [
      T("organ_involvement", "Organ Involvement — system by system"),
      T("complications", "Complications"),
      T("comorbidity_detail", "Comorbidity Detail"),
    ]),
    ...sec("Treatment History", treatmentFields()),
    ...sec("Safety Screening & Monitoring", monitoringFields()),
    ...sec("Follow-Up & Review Criteria", followUpFields({
      target: "condition-specific remission or low disease activity, with organ function preserved",
      flags: "organ-threatening flare, new neurological deficit, fever on immunosuppression, acute visual loss, severe infection",
    })),
  ],
};

// Every disease-specific template closes with the same two structured
// endings: referrals with the question asked of each service, and the patient
// education actually delivered and understood.
const REFERRAL_AND_EDUCATION_FIELDS = [
  { key: "referrals", label: "Structured referrals — the question asked of each service", type: "rheum_referrals", section: "Referrals" },
  { key: "patient_education", label: "Education delivered, understanding confirmed and warning signs given", type: "rheum_education", section: "Patient Education" },
];

const DISEASE_DOCS = [
  RHEUM_RA,
  RHEUM_SLE,
  RHEUM_AXSPA,
  RHEUM_PSPA,
  RHEUM_PSA,
  RHEUM_GOUT,
  RHEUM_OA,
  RHEUM_SSC,
  RHEUM_SJOGREN,
  RHEUM_IIM,
  RHEUM_VASCULITIS,
  RHEUM_PMR,
  RHEUM_GCA,
  RHEUM_APS,
  RHEUM_OSTEOPOROSIS,
  RHEUM_JIA,
  RHEUM_SEPTIC,
  RHEUM_OTHER,
];

export const RHEUMATOLOGY_DISEASE_DOCS = DISEASE_DOCS.map((doc) =>
  withRheumCoreSections({
    ...doc,
    fields: [...doc.fields, ...REFERRAL_AND_EDUCATION_FIELDS],
  })
);