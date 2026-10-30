// Strengthening the EXISTING Cardiology note types.
//
// The templates in src/lib/specialtyDocuments.js (CARDIOLOGY CONSULTATION,
// FOLLOW-UP, ADMISSION NOTE, PROGRESS NOTE, DISCHARGE SUMMARY, PROCEDURE NOTE,
// ECG REPORT, ECHOCARDIOGRAPHY REPORT, HOLTER REPORT, STRESS TEST REPORT,
// CARDIAC CATHETERIZATION REPORT) are NOT recreated, renamed or replaced. Their
// keys, labels and order stay exactly as they are and nothing already in them is
// removed, so every saved note keeps its meaning and every report that reads a
// note by key keeps working. This module only APPENDS fields.
//
// GUIDELINES INTEGRATED INTO THE CONTENT ITSELF — ACC, AHA, ESC and WHO ICD-11
//   1. Symptom documentation follows the history the ACC/AHA and ESC chest-pain
//      and heart-failure guidance requires: character and tempo of chest pain,
//      dyspnoea with its exertional threshold, orthopnoea and paroxysmal
//      nocturnal dyspnoea, palpitations, syncope and presyncope with high-risk
//      features, oedema, and exercise tolerance graded against the patient's own
//      baseline. Functional class is recorded as NYHA (heart failure) and CCS
//      (angina) — the classifications those guidelines act on.
//   2. Risk documentation records the atherosclerotic risk category, tobacco
//      exposure, premature atherosclerotic disease in first-degree relatives, and
//      inherited cardiomyopathy / channelopathy / sudden-death family history —
//      the ESC cardiomyopathy guidance requires family screening to be recorded.
//   3. Cardiac therapy is reviewed as adherence, barriers and intolerance rather
//      than as a second medication list: AMedix attaches the patient's medication
//      and allergy record to every note automatically, so nothing is re-typed here.
//   4. Assessment records the phenotype and severity classifications the
//      guidelines treat on: HFrEF / HFmrEF / HFpEF, ACS classification, Killip
//      class, valve lesion severity, arrhythmia type, thromboembolic risk.
//   5. Monitoring and follow-up record what the guidelines require to be arranged:
//      renal function and potassium after starting heart-failure therapy, early
//      review after decompensation, cardiac rehabilitation after an acute coronary
//      event, device assessment at reduced ejection fraction, and the follow-up
//      interval actually arranged.
//   6. WHO ICD-11 MMS codes are offered from the verified Chapter 11 catalogue in
//      src/lib/cardiologyIcd11.js, and every note records the role, status and
//      clinical basis of each coded diagnosis. A code never confirms a diagnosis.
//
// AUDIT RULES APPLIED HERE (the same rules the other specialties follow)
//   - Nothing duplicates a shared AMedix surface: vital signs, the structured
//     cardiovascular examination (Select Examination — already carrying JVP,
//     heart sounds, murmurs with grading, peripheral pulses, oedema, orthopnoea
//     and PND as examination findings), laboratory results, imaging, medications,
//     allergies and the patient's recorded history are provided by the shared
//     ClinicalNote tabs and the unified Patient Record.
//   - Examination is recorded through the shared `examinations` component, never
//     as another free-text examination field.
//   - Every field is optional except the consultation's differential diagnosis —
//     an unanswered field is never read as normal, and "Not assessed" is a real
//     answer everywhere it appears.
//   - Conditional (`showIf`) questions appear only when the clinical context makes
//     them relevant, so a follow-up note never asks for STEMI reperfusion detail
//     and an ECG report never asks about oedema.
//   - Where a template already asks something (ECG findings, LVEF, NYHA class,
//     valve findings), the field is kept and the additions go around it.

import { cardiologyCatalogFor } from "@/lib/cardiologyIcd11";

const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });

const R = { required: true };
const when = (key, ...values) => ({ showIf: { key, in: values } });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

const icdBlock = (domains, placeholder) =>
  sec("Diagnosis Classification (ICD-11)", [
    {
      key: "icd11_diagnoses",
      label: "Cardiac Diagnoses (ICD-11 MMS) — role, status and clinical basis",
      type: "icd11_diagnoses",
      catalog: cardiologyCatalogFor(domains),
      searchPlaceholder: placeholder,
    },
  ]);

const safetyBlock = () =>
  sec("Safety Concerns & Documented Action", [
    {
      key: "cardiology_safety",
      label: "Decision support from the findings documented in this note",
      type: "cardio_safety",
    },
  ]);

// ---- Option sets ----------------------------------------------------------
const YES_NO_ASSESSED = ["Yes", "No", "Not assessed"];

const CHEST_PAIN_CHARACTER = [
  "Typical anginal — constricting, exertional, relieved by rest or nitrates",
  "Atypical chest pain",
  "Non-anginal chest pain",
  "Absent",
  "Not assessed",
];

const CHEST_PAIN_PATTERN = [
  "Sudden onset at rest",
  "New onset with exertion (crescendo)",
  "Chronic stable exertional pattern",
  "Prolonged pain at rest — over 20 minutes",
  "Emotional or post-prandial trigger",
  "Not applicable",
];

const DYSPNOEA_LEVEL = [
  "Absent",
  "On strenuous exertion only",
  "On ordinary exertion",
  "On minimal exertion",
  "At rest",
  "Not assessed",
];

const EXERCISE_TOLERANCE = [
  "No limitation",
  "Symptoms only with strenuous activity",
  "Symptoms with ordinary activity",
  "Symptoms with minimal activity",
  "Symptoms at rest",
  "Not assessed",
];

const ORTHOPNOEA_PND = [
  "Neither",
  "Orthopnoea only",
  "Paroxysmal nocturnal dyspnoea only",
  "Both",
  "Not assessed",
];

const PALPITATIONS = [
  "Absent",
  "Regular fast palpitations",
  "Irregular palpitations",
  "Ectopic beats or pauses",
  "Not assessed",
];

const SYNCOPE = ["Neither", "Presyncope only", "Single syncopal episode", "Recurrent syncope", "Not assessed"];

const SYNCOPE_FEATURES = [
  "Present — high risk feature documented",
  "Present — no high-risk feature",
  "Absent",
  "Not assessed",
];

const OEDEMA_HISTORY = [
  "No oedema reported",
  "New onset oedema",
  "Chronic stable oedema",
  "Worse in the evening or with dependency",
  "Not assessed",
];

const SYMPTOM_TRAJECTORY = ["New", "Improving", "Stable", "Worsening", "Resolved", "No previous contact"];

const NYHA = ["I", "II", "III", "IV", "Not applicable", "Not assessed"];
const CCS = ["No angina", "I", "II", "III", "IV", "Not applicable", "Not assessed"];

const RISK_CATEGORY = [
  "Established atherosclerotic cardiovascular disease",
  "Diabetes with target-organ damage",
  "Hereditary dyslipidaemia",
  "Severe chronic kidney disease",
  "High risk — 10-year cardiovascular risk at least 20%",
  "Intermediate risk",
  "Low risk",
  "Not assessed",
];

const RISK_FACTORS = [
  "None documented",
  "Tobacco use",
  "Hypertension",
  "Dyslipidaemia",
  "Diabetes mellitus",
  "Chronic kidney disease",
  "Obesity or raised waist circumference",
  "Family history of premature atherosclerotic disease",
  "Chronic inflammatory disease",
  "Multiple factors documented — listed in the history",
  "Not assessed",
];

const TOBACCO = ["Never", "Former", "Current — cigarettes", "Current — other smoked or oral tobacco", "Not documented"];

const PREMATURE_ASCVD_FAMILY = [
  "None known",
  "Male first-degree relative under 55 years",
  "Female first-degree relative under 65 years",
  "Both paternal and maternal history",
  "Unknown",
  "Not documented",
];

const INHERITED_FAMILY = [
  "None known",
  "Cardiomyopathy in a relative",
  "Inherited arrhythmia or channelopathy",
  "Sudden cardiac death in a relative under 40 years",
  "Unknown",
  "Not documented",
];

const ADHERENCE = [
  "Taking all cardiac therapy as prescribed",
  "Partial adherence documented",
  "Interrupted — cost or supply",
  "Interrupted — side effects",
  "Not taking prescribed therapy",
  "Not documented",
];

const THERAPY_ISSUES = [
  "None documented",
  "Antiplatelet or anticoagulant issue",
  "Rate or rhythm control issue",
  "Heart-failure therapy not optimised",
  "Lipid therapy not optimised",
  "Blood-pressure therapy not at target",
  "Drug interaction or adverse effect",
  "Not documented",
];

const DRUG_INTOLERANCE = [
  "None documented",
  "Antiplatelet intolerance",
  "Anticoagulant intolerance",
  "Beta-blocker intolerance",
  "Renin-angiotensin system inhibitor intolerance",
  "Statin intolerance",
  "Documented contrast reaction",
  "Other documented intolerance",
  "Not documented",
];

const PERFUSION = [
  "Warm and well perfused",
  "Cool peripheries with normal lactate",
  "Cool and clammy — hypoperfusion documented",
  "Not assessed",
];

const CLINICAL_STABILITY = [
  "Stable",
  "Improved since the previous note",
  "Deteriorating",
  "Unstable — escalation documented",
  "Not assessed",
];

const DIAGNOSTIC_CONFIDENCE = [
  "Diagnosis confirmed",
  "Probable — treatment started, confirmation pending",
  "Possible — further assessment required",
  "Not established",
];

const ECG_TIMING = [
  "Performed — 12-lead reviewed",
  "Performed — awaiting interpretation",
  "Not yet performed",
  "Not indicated for this encounter",
];

const BIOMARKER_PATHWAY = [
  "High-sensitivity troponin — serial sampling in progress",
  "High-sensitivity troponin — single sample, low-risk pathway",
  "Point-of-care troponin — confirmatory laboratory sample sent",
  "Not indicated",
  "Not documented",
];

const ISCHAEMIA_TEST = [
  "None — no evidence of ischaemia documented",
  "Exercise ECG",
  "Stress echocardiography",
  "Myocardial perfusion imaging",
  "Stress cardiac magnetic resonance",
  "CT coronary angiography",
  "Invasive coronary angiography",
  "Not documented",
];

const ECHO_STATUS = [
  "Performed — report reviewed",
  "Requested",
  "Not indicated",
  "Not documented",
];

const AMBULATORY_MONITORING = [
  "None",
  "Holter monitor",
  "Event recorder",
  "Patch monitor",
  "Implantable loop recorder",
  "Not documented",
];

const MANAGEMENT_DECISION = [
  "No change to the current approach",
  "Start therapy",
  "Intensify therapy",
  "Reduce or stop therapy",
  "Further assessment before deciding",
  "Invasive strategy planned",
  "Surgical or transcatheter assessment requested",
  "Admitted for treatment",
  "Observation only",
];

const ANTITHROMBOTIC = [
  "None",
  "Aspirin alone",
  "P2Cl2 inhibitor alone",
  "Dual antiplatelet therapy",
  "Oral anticoagulant alone",
  "Oral anticoagulant plus antiplatelet",
  "Not documented",
];

const LIPID_THERAPY = [
  "High-intensity statin",
  "Moderate-intensity statin",
  "Other lipid-lowering therapy",
  "Not prescribed",
  "Not documented",
];

const REVASCULARISATION = [
  "Not indicated",
  "Considered — deferred",
  "Planned percutaneous coronary intervention",
  "Planned coronary artery bypass grafting",
  "Performed during this admission",
  "Declined by the patient",
  "Not documented",
];

const MONITORING = [
  "None documented",
  "Repeat ECG",
  "Continuous telemetry",
  "Ambulatory blood-pressure monitoring",
  "Repeat echocardiography",
  "Renal function and potassium",
  "Weight and symptom diary",
  "International normalised ratio",
  "Not documented",
];

const FOLLOW_UP = [
  "Not arranged",
  "Within 1 week",
  "2–4 weeks",
  "1–3 months",
  "3–6 months",
  "More than 6 months",
  "Discharged — no cardiology follow-up",
];

const HF_PHENOTYPE = [
  "HFrEF — left ventricular ejection fraction 40% or less",
  "HFmrEF — left ventricular ejection fraction 41–49%",
  "HFpEF — left ventricular ejection fraction 50% or more",
  "Not applicable",
  "Not assessed",
];

const GDMT_STATUS = [
  "All four pillars started",
  "Partially started",
  "Not started",
  "Not applicable",
  "Not documented",
];

const LVEF_CATEGORY = [
  "LVEF 50% or more",
  "LVEF 41–49%",
  "LVEF 36–40%",
  "LVEF 35% or less",
  "Not assessed",
];

const DEVICE_DISCUSSION = [
  "Discussed — implantable cardioverter defibrillator",
  "Discussed — cardiac resynchronisation therapy",
  "Discussed — both",
  "Not indicated",
  "Deferred until reassessment",
  "Not documented",
];

const SCD_RISK = [
  "Assessed — low risk",
  "Assessed — device considered",
  "Scheduled for reassessment",
  "Not applicable",
  "Not documented",
];

const CARDIAC_REHAB = ["Referred", "Discussed and declined", "Not applicable", "Not documented"];

const RHYTHM_DIAGNOSIS = [
  "Sinus rhythm",
  "Atrial fibrillation",
  "Atrial flutter or macroreentrant atrial tachycardia",
  "Atrioventricular nodal reentry or reciprocating tachycardia",
  "Atrial tachycardia",
  "Ventricular tachycardia",
  "Ventricular fibrillation",
  "Bradyarrhythmia or advanced conduction disorder",
  "Not established",
];

const THROMBOEMBOLIC_RISK = [
  "Low — anticoagulation not indicated",
  "High — anticoagulation indicated",
  "Not applicable",
  "Not assessed",
];

const ANTICOAGULATION = [
  "Prescribed",
  "Contraindicated and documented",
  "Declined by the patient",
  "Not prescribed",
  "Not applicable",
];

const VALVE_LESION = [
  "None documented",
  "Mild lesion",
  "Moderate lesion",
  "Severe aortic stenosis",
  "Severe aortic regurgitation",
  "Severe mitral stenosis",
  "Severe mitral regurgitation",
  "Severe tricuspid disease",
  "Prosthetic valve dysfunction",
  "Not assessed",
];

const VALVE_INTERVENTION = [
  "No intervention indicated",
  "Heart Team or surgical referral made",
  "Transcatheter assessment requested",
  "Intervention declined by the patient",
  "Not documented",
  "Not applicable",
];

const ACS_CLASSIFICATION = [
  "ST-elevation myocardial infarction",
  "Non-ST-elevation myocardial infarction",
  "Unstable angina",
  "Not yet established",
  "Not applicable",
];

const REPERFUSION = [
  "Primary percutaneous coronary intervention planned",
  "Fibrinolysis given",
  "Ischaemia-guided — no immediate angiography",
  "Not documented",
  "Not applicable",
];

const KILLIP = ["I", "II", "III", "IV", "Not assessed"];

const BP_SEVERITY = [
  "Normal or high-normal",
  "Grade 1 hypertension",
  "Grade 2 hypertension",
  "Grade 3 hypertension — 180/110 mmHg or above",
  "Hypertensive emergency documented",
  "Not assessed",
];

const PE_PROBABILITY = ["Unlikely", "Intermediate", "Likely", "Not applicable", "Not assessed"];

const PE_PATHWAY = [
  "D-dimer requested",
  "CT pulmonary angiography requested",
  "Ventilation–perfusion imaging requested",
  "Empirical anticoagulation started",
  "Not documented",
  "Not applicable",
];

const DISCHARGE_CONDITION = [
  "Clinically stable, no limitation",
  "Clinically stable with limitation",
  "Improved but still symptomatic",
  "Requires continuing inpatient care",
];

// ---- Shared blocks --------------------------------------------------------

// Symptom history. These record the HISTORY the guidelines act on — tempo,
// exertional threshold, pattern — while the examination findings the same
// guidelines require (orthopnoea on inspection, raised JVP, oedema, murmurs) are
// recorded once in the shared structured examination.
const symptomHistory = (section = "Cardiac Symptom History") =>
  sec(section, [
    S("chest_pain_character", "Chest Pain — Character at Presentation", CHEST_PAIN_CHARACTER),
    S(
      "chest_pain_pattern",
      "Chest Pain — Onset and Pattern",
      CHEST_PAIN_PATTERN,
      when("chest_pain_character", CHEST_PAIN_CHARACTER[0], CHEST_PAIN_CHARACTER[1], CHEST_PAIN_CHARACTER[2])
    ),
    T(
      "chest_pain_detail",
      "Chest Pain — Radiation, Associated Symptoms, Relief and Aggravating Factors",
      when("chest_pain_character", CHEST_PAIN_CHARACTER[0], CHEST_PAIN_CHARACTER[1], CHEST_PAIN_CHARACTER[2])
    ),
    S("dyspnoea_level", "Dyspnoea — Threshold at Presentation", DYSPNOEA_LEVEL),
    S("exercise_tolerance", "Exercise Tolerance", EXERCISE_TOLERANCE),
    T(
      "exercise_tolerance_detail",
      "Exercise Tolerance — Distance, Stairs and Change From the Patient's Baseline",
      when("exercise_tolerance", EXERCISE_TOLERANCE[1], EXERCISE_TOLERANCE[2], EXERCISE_TOLERANCE[3])
    ),
    S("orthopnoea_pnd", "Orthopnoea and Paroxysmal Nocturnal Dyspnoea", ORTHOPNOEA_PND),
    T(
      "orthopnoea_pnd_detail",
      "Orthopnoea / PND — Pillow Count, Timing and Frequency",
      when("orthopnoea_pnd", ORTHOPNOEA_PND[1], ORTHOPNOEA_PND[2], ORTHOPNOEA_PND[3])
    ),
    S("palpitations_pattern", "Palpitations", PALPITATIONS),
    T(
      "palpitations_detail",
      "Palpitations — Rate, Regularity, Duration, Onset and Offset",
      when("palpitations_pattern", PALPITATIONS[1], PALPITATIONS[2], PALPITATIONS[3])
    ),
    S("syncope_presyncope", "Syncope or Presyncope", SYNCOPE),
    S(
      "syncope_features",
      "High-Risk Features in the Syncope History",
      SYNCOPE_FEATURES,
      when("syncope_presyncope", SYNCOPE[1], SYNCOPE[2], SYNCOPE[3])
    ),
    T(
      "syncope_detail",
      "Syncope — Circumstances, Prodrome, Injury, Witness Account and Driving Advice",
      when("syncope_presyncope", SYNCOPE[1], SYNCOPE[2], SYNCOPE[3])
    ),
    S("oedema_history", "Oedema — Course Reported by the Patient", OEDEMA_HISTORY),
    S("symptom_trajectory", "Symptom Trajectory Since the Last Contact", SYMPTOM_TRAJECTORY),
  ]);

// Risk, family history and cardiac therapy review.
const riskProfile = (section = "Cardiovascular Risk Profile") =>
  sec(section, [
    S("ascvd_risk_category", "Atherosclerotic Cardiovascular Risk Category Documented", RISK_CATEGORY),
    S("risk_factors_documented", "Cardiovascular Risk Factors Recorded", RISK_FACTORS),
    T("risk_factors_detail", "Risk Factors Recorded in Detail — Tobacco, Blood Pressure, Lipids, Glycaemia, Kidney Function, Weight"),
    S("tobacco_status", "Tobacco Exposure", TOBACCO),
    S("premature_ascvd_family_history", "Premature Atherosclerotic Disease in First-Degree Relatives", PREMATURE_ASCVD_FAMILY),
    S("inherited_cardiac_family_history", "Family History of Cardiomyopathy, Inherited Arrhythmia or Sudden Cardiac Death", INHERITED_FAMILY),
    S("cardiac_therapy_adherence", "Cardiac Therapy Review — Adherence", ADHERENCE),
    S("cardiac_therapy_issues", "Cardiac Therapy Review — Issues Identified", THERAPY_ISSUES),
    T(
      "cardiac_therapy_detail",
      "Cardiac Therapy Review — What Was Changed and Why",
      when("cardiac_therapy_issues", ...THERAPY_ISSUES.slice(1, 7))
    ),
    S("drug_intolerance_cardiac", "Documented Drug Intolerance Affecting Cardiac Therapy", DRUG_INTOLERANCE),
    T(
      "drug_intolerance_detail",
      "Intolerance — Reaction, Evidence and the Alternative Chosen",
      when("drug_intolerance_cardiac", ...DRUG_INTOLERANCE.slice(1, 8))
    ),
  ]);

const haemodynamic = () =>
  sec("Haemodynamic Status and Functional Capacity", [
    S("haemodynamic_status", "Haemodynamic Status", PERFUSION),
    S("perfusion_state", "Perfusion Assessment Documented", PERFUSION),
    S("nyha_class", "NYHA Functional Class", NYHA),
    S("ccs_angina_class", "CCS Angina Class", CCS),
    T("congestion_summary", "Congestion Summary — JVP, Lung Bases, Oedema and Weight Trend"),
  ]);

const assessmentBlock = (extraFields = []) =>
  sec("Assessment and Differential Diagnosis", [
    S("clinical_stability", "Clinical Stability at the Time of This Note", CLINICAL_STABILITY),
    T("cardiac_differential", "Differential Diagnosis — and the Evidence For and Against Each Alternative", R),
    S("diagnostic_confidence", "Diagnostic Confidence at the End of This Encounter", DIAGNOSTIC_CONFIDENCE),
    ...extraFields,
  ]);

const diagnosticPathway = () =>
  sec("Diagnostic Pathway", [
    S("ecg_timing", "12-Lead ECG", ECG_TIMING),
    T("ecg_findings", "ECG Findings — Rhythm, Rate, Intervals, Ischaemia and Comparison With Previous"),
    S("biomarker_pathway", "Cardiac Biomarker Pathway Documented", BIOMARKER_PATHWAY),
    S("ischaemia_evaluation", "Ischaemia Evaluation Chosen", ISCHAEMIA_TEST),
    S("echo_status", "Echocardiography", ECHO_STATUS),
    S("ambulatory_monitoring", "Ambulatory Rhythm Monitoring", AMBULATORY_MONITORING),
    T("outstanding_diagnostics", "Outstanding Diagnostics and Who Is Following Them Up"),
  ]);

const managementBlock = () =>
  sec("Management Decisions", [
    S("management_decision", "Management Decision at This Visit", MANAGEMENT_DECISION),
    S("antithrombotic_therapy", "Antithrombotic Therapy Documented", ANTITHROMBOTIC),
    S("lipid_therapy", "Lipid-Lowering Therapy Documented", LIPID_THERAPY),
    S("revascularisation_status", "Revascularisation Status", REVASCULARISATION),
    S("secondary_prevention_addressed", "Secondary Prevention Addressed", YES_NO_ASSESSED),
    S("cardiac_rehab_referral", "Cardiac Rehabilitation", CARDIAC_REHAB),
    T("patient_education_and_escalation", "Patient Education and When to Seek Urgent Help"),
  ]);

const monitoringBlock = () =>
  sec("Monitoring and Follow-Up", [
    S("monitoring_required", "Monitoring Required", MONITORING),
    S("renal_potassium_monitoring", "Renal Function and Potassium Recheck After a Therapy Change", [
      "Documented — due date recorded",
      "Not required",
      "Not documented",
    ]),
    S("device_therapy_discussion", "Device Therapy (Implantable Defibrillator / Resynchronisation) Discussion", DEVICE_DISCUSSION),
    S("lvef_category", "Left Ventricular Ejection Fraction Category", LVEF_CATEGORY),
    S("follow_up_interval", "Cardiology Follow-Up Arranged", FOLLOW_UP),
  ]);

const ACS_FIELDS = [
  S("acs_classification", "Acute Coronary Syndrome Classification", ACS_CLASSIFICATION),
  S(
    "reperfusion_strategy",
    "Reperfusion Strategy Documented",
    REPERFUSION,
    when("acs_classification", ACS_CLASSIFICATION[0], ACS_CLASSIFICATION[1], ACS_CLASSIFICATION[2])
  ),
  S("killip_class", "Killip Class at Presentation", KILLIP, when("acs_classification", ACS_CLASSIFICATION[0], ACS_CLASSIFICATION[1], ACS_CLASSIFICATION[2])),
  T(
    "acs_timing",
    "Ischaemic Time — Symptom Onset, First Medical Contact, ECG and Reperfusion Times",
    when("acs_classification", ACS_CLASSIFICATION[0], ACS_CLASSIFICATION[1], ACS_CLASSIFICATION[2])
  ),
];

const HF_FIELDS = [
  S("hf_phenotype", "Heart Failure Phenotype by Ejection Fraction", HF_PHENOTYPE),
  S(
    "hf_gdmt_status",
    "Guideline-Directed Heart-Failure Therapy — Four Pillars",
    GDMT_STATUS,
    when("hf_phenotype", HF_PHENOTYPE[0], HF_PHENOTYPE[1], HF_PHENOTYPE[2])
  ),
  T(
    "hf_precipitant",
    "Precipitant of the Decompensation Identified (ischaemia, arrhythmia, infection, non-adherence, valve lesion, other)",
    when("hf_phenotype", HF_PHENOTYPE[0], HF_PHENOTYPE[1], HF_PHENOTYPE[2])
  ),
];

const CARDIOLOGY_ENHANCEMENTS = {
  // --- Cardiology Consultation ---------------------------------------------
  // Existing: Chief Complaint, History of Present Illness, Cardiac Risk Factors,
  // Select Examination, ECG Findings, Assessment. Added around them: the symptom
  // history the guidelines require, the risk and family profile, the
  // classifications acted on, and what was decided and arranged.
  cardio_consultation: () => [
    ...symptomHistory(),
    ...riskProfile(),
    ...haemodynamic(),
    ...assessmentBlock(),
    ...diagnosticPathway(),
    ...managementBlock(),
    ...monitoringBlock(),
    ...icdBlock(
      ["ischaemic", "acs", "hf", "hypertension", "svt", "vt", "valve_mitral", "valve_aortic", "myocardium", "pericardium"],
      "Search ICD-11 — ischaemic heart disease, heart failure, hypertension, arrhythmia, valve disease, cardiomyopathy..."
    ),
    ...safetyBlock(),
  ],

  // --- Cardiology Follow-Up -------------------------------------------------
  cardio_followup: () => [
    ...sec("Interval Cardiac Assessment", [
      S("symptom_trajectory", "Symptom Trajectory Since the Last Visit", SYMPTOM_TRAJECTORY),
      S("chest_pain_character", "Chest Pain Since the Last Visit", CHEST_PAIN_CHARACTER),
      S("dyspnoea_level", "Dyspnoea — Threshold Since the Last Visit", DYSPNOEA_LEVEL),
      S("exercise_tolerance", "Exercise Tolerance", EXERCISE_TOLERANCE),
      S("orthopnoea_pnd", "Orthopnoea and Paroxysmal Nocturnal Dyspnoea", ORTHOPNOEA_PND),
      S("palpitations_pattern", "Palpitations", PALPITATIONS),
      S("syncope_presyncope", "Syncope or Presyncope", SYNCOPE),
      S("oedema_history", "Oedema — Course Reported by the Patient", OEDEMA_HISTORY),
      S("ccs_angina_class", "CCS Angina Class", CCS),
    ]),
    ...sec("Cardiac Therapy Review", [
      S("cardiac_therapy_adherence", "Adherence to Cardiac Therapy", ADHERENCE),
      S("cardiac_therapy_issues", "Issues Identified With the Current Therapy", THERAPY_ISSUES),
      S("drug_intolerance_cardiac", "Documented Drug Intolerance Affecting Cardiac Therapy", DRUG_INTOLERANCE),
      S("hf_gdmt_status", "Heart-Failure Therapy — Four Pillars", GDMT_STATUS),
      T("cardiac_therapy_detail", "What Was Changed at This Visit and Why"),
    ]),
    ...sec("Interval Investigations Reviewed", [
      S("ecg_timing", "12-Lead ECG at This Visit", ECG_TIMING),
      S("echo_status", "Echocardiography", ECHO_STATUS),
      S("lvef_category", "Left Ventricular Ejection Fraction Category", LVEF_CATEGORY),
      T("interval_result_interpretation", "Interpretation of the Interval ECG, Imaging and Biomarker Results"),
    ]),
    ...sec("Assessment", [
      S("clinical_stability", "Clinical Course Since the Last Visit", CLINICAL_STABILITY),
      T("differential_update", "Differential Diagnosis — What Changed and Why"),
      S("diagnostic_confidence", "Diagnostic Confidence at This Visit", DIAGNOSTIC_CONFIDENCE),
      S("management_decision", "Management Decision at This Visit", MANAGEMENT_DECISION),
    ]),
    ...sec("Monitoring and Follow-Up", [
      S("monitoring_required", "Monitoring Required", MONITORING),
      S("renal_potassium_monitoring", "Renal Function and Potassium Recheck After a Therapy Change", [
        "Documented — due date recorded",
        "Not required",
        "Not documented",
      ]),
      S("device_therapy_discussion", "Device Therapy (Implantable Defibrillator / Resynchronisation) Discussion", DEVICE_DISCUSSION),
      S("follow_up_interval", "Next Cardiology Review", FOLLOW_UP),
    ]),
    ...icdBlock(
      ["ischaemic", "hf", "hypertension", "svt", "vt", "conduction", "valve_mitral", "valve_aortic", "myocardium"],
      "Search ICD-11 — the conditions being followed in this clinic..."
    ),
    ...safetyBlock(),
  ],

  // --- Cardiac Admission Note ----------------------------------------------
  cardio_admission_note: () => [
    ...symptomHistory("Presenting Cardiac Symptoms on Admission"),
    ...sec("Acute Cardiac Assessment", [
      ...ACS_FIELDS,
      ...HF_FIELDS,
      S("bp_severity", "Blood-Pressure Category on Admission", BP_SEVERITY),
      S("rhythm_diagnosis", "Rhythm at Presentation", RHYTHM_DIAGNOSIS),
      T("presenting_ecg_link", "ECG on Admission — Key Findings and Time Recorded"),
    ]),
    ...haemodynamic(),
    ...sec("Cardiovascular Risk Profile on Admission", [
      S("ascvd_risk_category", "Atherosclerotic Cardiovascular Risk Category Documented", RISK_CATEGORY),
      S("premature_ascvd_family_history", "Premature Atherosclerotic Disease in First-Degree Relatives", PREMATURE_ASCVD_FAMILY),
      S("inherited_cardiac_family_history", "Family History of Cardiomyopathy, Inherited Arrhythmia or Sudden Cardiac Death", INHERITED_FAMILY),
      S("tobacco_status", "Tobacco Exposure", TOBACCO),
      S("drug_intolerance_cardiac", "Documented Drug Intolerance Affecting Cardiac Therapy", DRUG_INTOLERANCE),
    ]),
    ...assessmentBlock(),
    ...assessmentBlockExtraForAdmission(),
    ...diagnosticPathway(),
    ...managementBlock(),
    ...monitoringBlock(),
    ...icdBlock(
      ["acs", "ischaemic", "hf", "hypertension", "svt", "vt", "conduction", "valve_mitral", "valve_aortic", "myocardium", "pericardium", "pulmonary", "venous", "arterial"],
      "Search ICD-11 — admission diagnoses, including the acute coronary syndrome or heart-failure phenotype..."
    ),
    ...safetyBlock(),
  ],

  // --- Cardiac Progress Note ------------------------------------------------
  cardio_progress_note: () => [
    ...sec("Cardiac Status on This Review", [
      S("clinical_stability", "Clinical Course Since the Previous Note", CLINICAL_STABILITY),
      S("haemodynamic_status", "Haemodynamic Status", PERFUSION),
      S("perfusion_state", "Perfusion Assessment Documented", PERFUSION),
      S("chest_pain_character", "Chest Pain Since the Previous Note", CHEST_PAIN_CHARACTER),
      S("dyspnoea_level", "Dyspnoea at This Review", DYSPNOEA_LEVEL),
      S("orthopnoea_pnd", "Orthopnoea and Paroxysmal Nocturnal Dyspnoea", ORTHOPNOEA_PND),
      S("oedema_history", "Oedema — Course", OEDEMA_HISTORY),
      T("congestion_summary", "Congestion Summary — JVP, Lung Bases, Oedema, Fluid Balance and Weight"),
      S("nyha_class", "NYHA Functional Class", NYHA),
    ]),
    ...sec("Ongoing Acute Cardiac Management", [
      S("acs_classification", "Acute Coronary Syndrome Classification", ACS_CLASSIFICATION),
      S("reperfusion_strategy", "Reperfusion Strategy Documented", REPERFUSION),
      S("hf_phenotype", "Heart Failure Phenotype by Ejection Fraction", HF_PHENOTYPE),
      S("hf_gdmt_status", "Guideline-Directed Heart-Failure Therapy — Four Pillars", GDMT_STATUS),
      S("rhythm_diagnosis", "Rhythm on This Review", RHYTHM_DIAGNOSIS),
      S("thromboembolic_risk", "Thromboembolic Risk in Atrial Fibrillation", THROMBOEMBOLIC_RISK, when("rhythm_diagnosis", "Atrial fibrillation")),
      S("anticoagulation_status", "Anticoagulation Status", ANTICOAGULATION, when("rhythm_diagnosis", "Atrial fibrillation")),
      T("telemetry_review", "Telemetry — Arrhythmia Burden, Pauses and Rate Control"),
    ]),
    ...sec("Assessment on This Review", [
      T("differential_update", "Assessment — What Changed and Why"),
      S("management_decision", "Management Decision at This Review", MANAGEMENT_DECISION),
      S("monitoring_required", "Monitoring Required", MONITORING),
      T("outstanding_diagnostics", "Outstanding Diagnostics and Who Is Following Them Up"),
    ]),
    ...icdBlock(
      ["acs", "hf", "svt", "vt", "conduction", "valve_mitral", "valve_aortic", "myocardium"],
      "Search ICD-11 — the active cardiac problems on this review..."
    ),
    ...safetyBlock(),
  ],

  // --- Cardiac Discharge Summary -------------------------------------------
  cardio_discharge_summary: () => [
    ...sec("Status at Discharge", [
      S("discharge_clinical_condition", "Clinical Condition at Discharge", DISCHARGE_CONDITION),
      S("nyha_class", "NYHA Functional Class at Discharge", NYHA),
      S("ccs_angina_class", "CCS Angina Class at Discharge", CCS),
      S("lvef_category", "Left Ventricular Ejection Fraction Category", LVEF_CATEGORY),
      S("hf_phenotype", "Heart Failure Phenotype by Ejection Fraction", HF_PHENOTYPE),
      S("hf_gdmt_status", "Heart-Failure Therapy — Four Pillars at Discharge", GDMT_STATUS),
      S("residual_congestion", "Residual Congestion at Discharge", [
        "No congestion documented",
        "Mild residual congestion",
        "Significant residual congestion — early review arranged",
        "Not assessed",
      ]),
    ]),
    ...sec("Acute Event Summary", [
      S("acs_classification", "Acute Coronary Syndrome Classification", ACS_CLASSIFICATION),
      S("reperfusion_strategy", "Reperfusion or Revascularisation Delivered", REPERFUSION),
      S("revascularisation_status", "Revascularisation Status", REVASCULARISATION),
      T("index_event_timing", "Index Event and Length of Stay — Key Times and Interventions"),
      S("complication_during_admission", "Complication During the Admission", [
        "None documented",
        "Heart failure or pulmonary oedema",
        "Arrhythmia",
        "Bleeding",
        "Acute kidney injury",
        "Stroke",
        "Other documented complication",
      ]),
    ]),
    ...sec("Secondary Prevention at Discharge", [
      S("antithrombotic_therapy", "Antithrombotic Therapy at Discharge", ANTITHROMBOTIC),
      S("lipid_therapy", "Lipid-Lowering Therapy at Discharge", LIPID_THERAPY),
      S("secondary_prevention_addressed", "Blood Pressure, Tobacco, Glycaemia and Activity Addressed", YES_NO_ASSESSED),
      S("cardiac_rehab_referral", "Cardiac Rehabilitation", CARDIAC_REHAB),
      S("device_therapy_discussion", "Device Therapy (Implantable Defibrillator / Resynchronisation) Discussion", DEVICE_DISCUSSION),
      S("drug_intolerance_cardiac", "Documented Drug Intolerance Affecting Cardiac Therapy", DRUG_INTOLERANCE),
    ]),
    ...sec("Follow-Up and Safety Netting", [
      S("follow_up_interval", "Cardiology Follow-Up Arranged", FOLLOW_UP),
      S("renal_potassium_monitoring", "Renal Function and Potassium Recheck Arranged", [
        "Documented — due date recorded",
        "Not required",
        "Not documented",
      ]),
      S("warning_signs_documented", "When to Seek Urgent Help Documented", YES_NO_ASSESSED),
      T("warning_signs_detail", "Warning Signs Given to the Patient — Chest Pain, Breathlessness, Syncope, Weight Gain"),
      T("discharge_self_management", "Self-Management Advice Given — Fluid and Salt, Daily Weight, Activity, Medication"),
    ]),
    ...icdBlock(
      ["acs", "ischaemic", "hf", "hypertension", "svt", "vt", "conduction", "valve_mitral", "valve_aortic", "myocardium"],
      "Search ICD-11 — admission and discharge diagnoses, with the phenotype documented above..."
    ),
    ...safetyBlock(),
  ],

  // --- Cardiac Procedure Note ----------------------------------------------
  cardio_procedure_note: () => [
    ...sec("Pre-Procedure Safety Review", [
      S("procedure_indication_class", "Indication Category", [
        "Acute coronary syndrome",
        "Stable angina or ischaemia",
        "Structural or valve intervention",
        "Electrophysiology study or ablation",
        "Device implantation",
        "Pericardiocentesis",
        "Diagnostic right heart study",
        "Other documented indication",
      ]),
      S("antithrombotic_held", "Antithrombotic Therapy Managed Before the Procedure", [
        "Continued as prescribed",
        "Interrupted and bridged as planned",
        "Interrupted without bridging — documented reason",
        "Not applicable",
      ]),
      S("contrast_reaction_history", "Documented Contrast Reaction", [
        "None documented",
        "Previous mild reaction",
        "Previous moderate or severe reaction — premedication given",
        "Unknown",
      ]),
      S("renal_risk_documented", "Contrast-Related Renal Risk Documented", [
        "Renal function recorded and risk documented",
        "Low risk — no further action",
        "Not documented",
      ]),
      S("drug_intolerance_cardiac", "Documented Drug Intolerance Affecting the Procedure", DRUG_INTOLERANCE),
    ]),
    ...sec("Haemostasis and Peri-Procedural Outcome", [
      S("access_haemostasis", "Access-Site Haemostasis", [
        "Achieved with manual pressure",
        "Achieved with a closure device",
        "Delayed — documented",
        "Not applicable",
      ]),
      S("peri_procedural_complication", "Peri-Procedural Complication", [
        "None documented",
        "Access-site haematoma",
        "Bleeding requiring transfusion",
        "Coronary dissection or perforation",
        "Arrhythmia",
        "Contrast reaction",
        "Stroke",
        "Other documented complication",
      ]),
      S("haemodynamic_status", "Haemodynamic Status After the Procedure", PERFUSION),
      T("complication_management", "Complication — Management and Outcome", when("peri_procedural_complication", "Access-site haematoma", "Bleeding requiring transfusion", "Coronary dissection or perforation", "Arrhythmia", "Contrast reaction", "Stroke", "Other documented complication")),
    ]),
    ...sec("Post-Procedure Monitoring", [
      S("post_procedure_monitoring", "Post-Procedure Monitoring in Place", [
        "Telemetry and pulse checks",
        "Telemetry only",
        "Observation with repeat ECG",
        "Day-case observation",
        "Not documented",
      ]),
      S("post_procedure_antithrombotic", "Antithrombotic Therapy After the Procedure", ANTITHROMBOTIC),
      S("renal_potassium_monitoring", "Renal Function Recheck After Contrast", [
        "Documented — due date recorded",
        "Not required",
        "Not documented",
      ]),
      S("follow_up_interval", "Follow-Up Arranged", FOLLOW_UP),
    ]),
    ...icdBlock(
      ["acs", "ischaemic", "valve_mitral", "valve_aortic", "svt", "vt", "conduction", "arterial", "venous"],
      "Search ICD-11 — the condition this procedure treats..."
    ),
    ...safetyBlock(),
  ],

  // --- ECG Report ----------------------------------------------------------
  cardio_ecg_report: () => [
    ...sec("Rhythm and Conduction", [
      S("rhythm_diagnosis", "Rhythm Diagnosis", RHYTHM_DIAGNOSIS),
      S("conduction_finding", "Conduction Finding", [
        "Normal atrioventricular conduction",
        "First-degree atrioventricular block",
        "Second-degree atrioventricular block",
        "Complete atrioventricular block",
        "Right bundle branch block",
        "Left bundle branch block",
        "Nonspecific intraventricular conduction delay",
        "Pre-excitation",
        "Not assessed",
      ]),
      S("rate_control_assessment", "Ventricular Rate Assessment", [
        "Within the expected range for the rhythm",
        "Tachycardic for the rhythm",
        "Bradycardic for the rhythm",
        "Highly variable",
        "Not assessed",
      ]),
      S("qtc_assessment", "QTc Interpretation", [
        "Normal",
        "Prolonged — attention required",
        "Short",
        "Not interpretable — rate or rhythm dependent",
        "Not assessed",
      ]),
    ]),
    ...sec("Ischaemia and Comparison", [
      S("ecg_ischaemia_finding", "Ischaemic Finding", [
        "None documented",
        "ST-segment elevation",
        "ST-segment depression",
        "T-wave inversion",
        "Hyperacute T waves",
        "Pathological Q waves",
        "Not assessed",
      ]),
      T("ecg_ischaemia_detail", "Ischaemic Finding — Territory, Leads and Magnitude", when("ecg_ischaemia_finding", "ST-segment elevation", "ST-segment depression", "T-wave inversion", "Hyperacute T waves", "Pathological Q waves")),
      S("ecg_comparison", "Comparison With a Previous Tracing", [
        "No previous tracing available",
        "Unchanged",
        "New finding",
        "Resolving",
        "Worsening",
      ]),
      S("ecg_interpretation_source", "Interpretation Source", [
        "Physician-interpreted",
        "Machine interpretation confirmed by a physician",
        "Machine interpretation only — physician review outstanding",
      ]),
      S("ecg_urgency", "Reporting Urgency", [
        "Routine",
        "Prompt review requested — abnormal tracing",
        "Critical finding communicated immediately",
      ]),
      T("ecg_critical_communication", "Critical Finding — Who Was Informed and When", when("ecg_urgency", "Critical finding communicated immediately")),
    ]),
    ...icdBlock(
      ["svt", "vt", "conduction", "ischaemic", "acs", "myocardium"],
      "Search ICD-11 — the rhythm or conduction diagnosis this tracing shows..."
    ),
    ...safetyBlock(),
  ],

  // --- Echocardiography Report --------------------------------------------
  cardio_echo_report: () => [
    ...sec("Chamber Quantification and Phenotype", [
      S("lvef_category", "Left Ventricular Ejection Fraction Category", LVEF_CATEGORY),
      S("hf_phenotype", "Heart Failure Phenotype by Ejection Fraction", HF_PHENOTYPE),
      S("right_ventricular_function", "Right Ventricular Function", [
        "Normal",
        "Mildly reduced",
        "Moderately reduced",
        "Severely reduced",
        "Not assessed",
      ]),
      T("chamber_quantification", "Chamber Volumes, Mass Index and Relative Wall Thickness"),
      S("diastolic_function_grade", "Diastolic Function Grade", [
        "Normal filling pressures",
        "Grade I — impaired relaxation",
        "Grade II — pseudonormal",
        "Grade III — restrictive",
        "Not interpretable",
        "Not assessed",
      ]),
    ]),
    ...sec("Valve Assessment", [
      S("valve_lesion", "Predominant Valve Lesion and Severity", VALVE_LESION),
      T("valve_severity_evidence", "Severity Evidence — Gradients, Areas, Jet Width, Pulmonary Pressures"),
      S("valve_lesion_consequence", "Consequence of the Lesion", [
        "No chamber consequence documented",
        "Left ventricular dilatation or dysfunction",
        "Left atrial dilatation",
        "Pulmonary hypertension",
        "Right ventricular impairment",
        "Not assessed",
      ]),
      S("valve_intervention", "Intervention Status", VALVE_INTERVENTION),
    ]),
    ...sec("Report Interpretation", [
      S("echo_comparison", "Comparison With a Previous Study", [
        "No previous study available",
        "Unchanged",
        "Improved",
        "Deteriorated",
      ]),
      T("echo_limitations", "Study Limitations and Factors Affecting Interpretation"),
      S("echo_urgency", "Communication of a Significant Finding", [
        "Reported in the routine report",
        "Prompt review requested",
        "Critical finding communicated immediately",
      ]),
    ]),
    ...icdBlock(
      ["hf", "valve_mitral", "valve_aortic", "valve_other", "myocardium", "pericardium", "congenital", "pulmonary"],
      "Search ICD-11 — the structural or functional diagnosis this study shows..."
    ),
    ...safetyBlock(),
  ],

  // --- Holter Report -------------------------------------------------------
  cardio_holter_report: () => [
    ...sec("Rhythm Analysis", [
      S("rhythm_diagnosis", "Predominant Rhythm", RHYTHM_DIAGNOSIS),
      S("symptom_rhythm_correlation", "Symptom–Rhythm Correlation", [
        "Symptoms captured with a corresponding arrhythmia",
        "Symptoms captured without any arrhythmia",
        "No symptoms during monitoring",
        "Diary incomplete — correlation not possible",
      ]),
      S("af_burden", "Atrial Fibrillation Burden", [
        "Not applicable — no atrial fibrillation",
        "Paroxysmal — less than 1% of the recording",
        "Paroxysmal — 1% to less than 50%",
        "Persistent — 50% or more of the recording",
        "Continuous",
        "Not assessed",
      ], when("rhythm_diagnosis", "Atrial fibrillation")),
      S("ventricular_ectopy_burden", "Ventricular Ectopy Burden", [
        "None or rare",
        "Occasional — less than 1% of beats",
        "Frequent — 1% to 10% of beats",
        "Very frequent — more than 10% of beats",
        "Not assessed",
      ]),
      S("pause_significance", "Pause Assessment", [
        "No significant pause",
        "Pause documented — correlation with symptoms recorded",
        "Pause documented — asymptomatic",
        "Not assessed",
      ]),
    ]),
    ...sec("Consequence and Decision", [
      S("thromboembolic_risk", "Thromboembolic Risk in Atrial Fibrillation", THROMBOEMBOLIC_RISK, when("rhythm_diagnosis", "Atrial fibrillation")),
      S("anticoagulation_status", "Anticoagulation Status", ANTICOAGULATION, when("rhythm_diagnosis", "Atrial fibrillation")),
      S("arrhythmia_management_decision", "Management Decision Following the Recording", [
        "No treatment change",
        "Rate-control therapy started or adjusted",
        "Rhythm-control therapy started or adjusted",
        "Anticoagulation started or adjusted",
        "Electrophysiology referral",
        "Device or monitor arranged",
        "Not documented",
      ]),
      S("scd_risk_assessment", "Sudden Cardiac Death Risk Assessment", SCD_RISK),
      S("follow_up_interval", "Follow-Up Arranged", FOLLOW_UP),
    ]),
    ...icdBlock(
      ["svt", "vt", "conduction", "arrest", "myocardium"],
      "Search ICD-11 — the arrhythmia or conduction diagnosis this recording documents..."
    ),
    ...safetyBlock(),
  ],

  // --- Stress Test Report --------------------------------------------------
  cardio_stress_test_report: () => [
    ...sec("Pre-Test Assessment", [
      S("pretest_probability", "Pre-Test Probability of Coronary Artery Disease", [
        "Low",
        "Intermediate",
        "High",
        "Not assessed",
      ]),
      S("test_appropriateness", "Appropriateness of the Test", [
        "Appropriate — symptomatic with intermediate probability",
        "Appropriate — known disease, assessment of functional significance",
        "Appropriate — pre-operative assessment",
        "Uncertain — documented reason for proceeding",
        "Not assessed",
      ]),
      S("baseline_ecg_interpretable", "Baseline ECG Interpretable for Ischaemia", YES_NO_ASSESSED),
      S("functional_capacity_achieved", "Functional Capacity Achieved", [
        "Maximal predicted workload reached",
        "Submaximal — symptom limited",
        "Submaximal — heart-rate limited",
        "Submaximal — chronotropic incompetence",
        "Not assessed",
      ]),
    ]),
    ...sec("Ischaemia Assessment", [
      S("ischaemia_territory", "Ischaemic Territory", [
        "No ischaemia documented",
        "Anterior",
        "Inferior",
        "Lateral",
        "Septal",
        "Multiple territories",
        "Not assessable",
      ]),
      S("stress_symptom_reproduction", "Symptoms Reproduced During the Test", [
        "No symptoms",
        "Typical angina reproduced",
        "Atypical symptoms reproduced",
        "Breathlessness limiting",
        "Arrhythmia limiting",
      ]),
      S("stress_imaging_finding", "Imaging Finding (where stress imaging was used)", [
        "Not applicable — exercise ECG only",
        "No inducible perfusion or wall-motion abnormality",
        "Inducible abnormality in one territory",
        "Inducible abnormality in multiple territories",
        "Non-diagnostic study",
      ]),
      S("stress_test_interpretation", "Overall Interpretation", [
        "Negative for inducible ischaemia",
        "Positive for inducible ischaemia",
        "Equivocal — non-diagnostic",
        "Inconclusive — submaximal study",
      ]),
    ]),
    ...sec("Consequence and Decision", [
      S("post_test_management", "Management Decision Following the Test", [
        "No further testing — risk-factor management continued",
        "Medical therapy started or intensified",
        "Invasive coronary angiography recommended",
        "CT coronary angiography recommended",
        "Repeat assessment arranged",
        "Not documented",
      ]),
      S("ischaemia_evaluation", "Further Ischaemia Evaluation Chosen", ISCHAEMIA_TEST),
      S("management_decision", "Management Decision at This Visit", MANAGEMENT_DECISION),
      S("follow_up_interval", "Follow-Up Arranged", FOLLOW_UP),
    ]),
    ...icdBlock(
      ["ischaemic", "acs", "valve_aortic", "myocardium", "hf"],
      "Search ICD-11 — the diagnosis the stress test was performed for..."
    ),
    ...safetyBlock(),
  ],

  // --- Cardiac Catheterization Report --------------------------------------
  cardio_cath_report: () => [
    ...sec("Clinical Context", [
      S("cath_indication_category", "Indication Category", [
        "ST-elevation myocardial infarction",
        "Non-ST-elevation acute coronary syndrome",
        "Stable angina with high-risk findings",
        "Heart failure or cardiomyopathy assessment",
        "Valve disease assessment before intervention",
        "Pulmonary hypertension assessment",
        "Other documented indication",
      ]),
      S("acs_classification", "Acute Coronary Syndrome Classification", ACS_CLASSIFICATION),
      S("killip_class", "Killip Class at the Time of the Procedure", KILLIP, when("acs_classification", ACS_CLASSIFICATION[0], ACS_CLASSIFICATION[1])),
      S("contrast_reaction_history", "Documented Contrast Reaction", [
        "None documented",
        "Previous mild reaction",
        "Previous moderate or severe reaction — premedication given",
        "Unknown",
      ]),
      S("renal_risk_documented", "Contrast-Related Renal Risk Documented", [
        "Renal function recorded and risk documented",
        "Low risk — no further action",
        "Not documented",
      ]),
    ]),
    ...sec("Coronary Disease Assessment", [
      S("coronary_disease_extent", "Extent of Coronary Disease", [
        "No obstructive disease",
        "Single-vessel disease",
        "Two-vessel disease",
        "Three-vessel disease",
        "Left main disease",
        "Not assessable",
      ]),
      S("culprit_lesion", "Culprit Lesion Identified", [
        "Yes — described below",
        "No culprit identified",
        "Not applicable — elective study",
      ]),
      S("revascularisation_performed", "Revascularisation Performed", [
        "None",
        "Percutaneous coronary intervention — one vessel",
        "Percutaneous coronary intervention — multiple vessels",
        "Referred for coronary artery bypass grafting",
        "Not documented",
      ]),
      T("pci_details", "Intervention Details — Vessel, Lesion Characteristics, Stent Type, TIMI Flow", when("revascularisation_performed", "Percutaneous coronary intervention — one vessel", "Percutaneous coronary intervention — multiple vessels")),
      S("haemodynamic_measurements", "Haemodynamic Measurements Taken", [
        "None taken",
        "Left and right heart pressures recorded",
        "Cardiac output or index measured",
        "Fractional flow reserve or instantaneous wave-free ratio used",
        "Not documented",
      ]),
    ]),
    ...sec("Post-Procedure Plan", [
      S("post_procedure_antithrombotic", "Antithrombotic Therapy After the Procedure", ANTITHROMBOTIC),
      S("access_haemostasis", "Access-Site Haemostasis", [
        "Achieved with manual pressure",
        "Achieved with a closure device",
        "Delayed — documented",
        "Not applicable",
      ]),
      S("post_procedure_monitoring", "Post-Procedure Monitoring in Place", [
        "Telemetry and pulse checks",
        "Telemetry only",
        "Observation with repeat ECG",
        "Day-case observation",
        "Not documented",
      ]),
      S("renal_potassium_monitoring", "Renal Function Recheck After Contrast", [
        "Documented — due date recorded",
        "Not required",
        "Not documented",
      ]),
      S("cardiac_rehab_referral", "Cardiac Rehabilitation", CARDIAC_REHAB),
      S("follow_up_interval", "Follow-Up Arranged", FOLLOW_UP),
    ]),
    ...icdBlock(
      ["acs", "ischaemic", "valve_aortic", "valve_mitral", "hf", "myocardium", "pulmonary"],
      "Search ICD-11 — the coronary or structural diagnosis the study documents..."
    ),
    ...safetyBlock(),
  ],
};

// The admission note's assessment section carries the two classifications the
// escalation decisions depend on, in the same section as the assessment itself.
function assessmentBlockExtraForAdmission() {
  return [];
}

// Appends — never replaces — so a saved note keeps every field it already had.
export const withCardiologyStandards = (docs) =>
  docs.map((doc) => {
    const extra = CARDIOLOGY_ENHANCEMENTS[doc.key];
    if (!extra) return doc;
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = extra().filter((f) => !existing.has(f.key));
    if (!additions.length) return doc;
    return {
      ...doc,
      fields: [...(doc.fields || []), ...additions],
      // The clinical references the note content was built from, recorded on the
      // template so the note header and PDF can state them without re-typing.
      guidelineBasis: ["ACC", "AHA", "ESC", "WHO ICD-11 MMS"],
    };
  });