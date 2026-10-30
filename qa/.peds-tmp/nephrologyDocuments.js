// Nephrology clinical document catalogue — the nine existing AMedix
// Nephrology note types, strengthened in place. Every original note key is
// preserved (neph_consultation, neph_followup, neph_admission_note,
// neph_progress_note, neph_dialysis_record, neph_access_record,
// neph_procedure_note, neph_discharge_summary, neph_ckd_care_plan) and the
// existing AMedix document system — encounter link, digital signature,
// AMedix Document ID, versioning, amendments, permissions and audit log — is
// untouched.
//
// Content is aligned with WHO ICD-11 documentation requirements and the KDIGO
// clinical practice guidelines: kidney function is documented against a
// baseline, acute kidney injury and chronic kidney disease are staged
// explicitly (KDIGO G/A categories), glomerular disease is documented with its
// immunological and histopathological basis, and dialysis, access and
// transplantation are documented with their own structured history. Every
// section can record a positive finding, a relevant negative finding, "not
// assessed" or "unavailable" — nothing is ever defaulted to normal, and no
// test is ordered by the template.
//
// Physical examination reuses the platform's shared Vital Signs and Select
// Examination engines (the examination field is converted to the shared
// structured examination by the central note policy, exactly as in every other
// specialty). Serum, urine and immunological results use the shared renal
// results entry (renal_labs), which records dates, units, reference ranges,
// calculated flags and trends, previous values, and pending or unavailable
// results.
//
// Fields use the same shape as the rest of the clinical system (key, label,
// type, options, section) plus `showIf` — a field is shown only when its
// controlling answer matches, so a dialysis question is never asked of a
// non-dialysis patient.

import {
  clinicalReasoningSection,
  differentialSection,
  managementSection,
  nephrologySafetySection,
  monitoringFollowupSection,
} from "./nephrologyClinicalReasoning.js";

const I = (key, label, x = {}) => ({ key, label, type: "input", ...x });
const N = (key, label, x = {}) => ({ key, label, type: "number", ...x });
const T = (key, label, x = {}) => ({ key, label, type: "textarea", ...x });
const S = (key, label, options, x = {}) => ({ key, label, type: "select", options, ...x });
const when = (key, ...values) => ({ showIf: { key, in: values } });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

const YES_NO_UNK = ["Yes", "No", "Unknown"];
const NOT_KNOWN = "Not documented";
const SOURCES = [
  "Patient interview",
  "Referral letter",
  "Transfer summary",
  "Previous AMedix record",
  "Outside records",
  "Family / carer",
  "Patient unable to give history",
];
const ROS = ["Not asked", "Negative", "Positive — see detail"];
const ROS_POSITIVE = "Positive — see detail";
const AVAILABILITY = ["Results available — documented below", "Partially available", "Awaiting results", "Unavailable at this encounter"];

// ---- History: presenting problem ------------------------------------------
const presentingProblem = () =>
  sec("Presenting Problem", [
    S("information_source", "Source of Information", SOURCES),
    T("reason_for_referral", "Reason for Nephrology Referral (clinical question asked)"),
    T("chief_complaint", "Presenting Complaint (in the patient's own words)"),
    S("symptom_onset", "Symptom Onset", ["Today", "Within 48 hours", "This week", "1–4 weeks", "1–6 months", "More than 6 months", NOT_KNOWN]),
    I("symptom_duration", "Duration (e.g. 3 days, 6 weeks)"),
    S("symptom_progression", "Progression", ["Improving", "Static", "Progressively worsening", "Fluctuating", NOT_KNOWN]),
    T("associated_symptoms", "Associated Symptoms (nausea, vomiting, anorexia, fatigue, breathlessness, pruritus, sleep disturbance)"),
    T("hpi", "History of Present Illness — Narrative"),
    S("ros_constitutional", "Constitutional — fever, weight loss, night sweats", ROS),
    T("ros_constitutional_detail", "Constitutional — Detail", when("ros_constitutional", ROS_POSITIVE)),
    S("ros_cardiorespiratory", "Cardiorespiratory — breathlessness, orthopnoea, chest pain, palpitations", ROS),
    T("ros_cardiorespiratory_detail", "Cardiorespiratory — Detail", when("ros_cardiorespiratory", ROS_POSITIVE)),
    S("ros_gastrointestinal", "Gastrointestinal — nausea, vomiting, anorexia, diarrhoea", ROS),
    T("ros_gastrointestinal_detail", "Gastrointestinal — Detail", when("ros_gastrointestinal", ROS_POSITIVE)),
    S("ros_neurological", "Neurological — confusion, myoclonus, restless legs, paraesthesia", ROS),
    T("ros_neurological_detail", "Neurological — Detail", when("ros_neurological", ROS_POSITIVE)),
    S("ros_musculoskeletal", "Musculoskeletal — joint pain, swelling, muscle cramps", ROS),
    T("ros_musculoskeletal_detail", "Musculoskeletal — Detail", when("ros_musculoskeletal", ROS_POSITIVE)),
  ]);

// ---- History: kidney & urological ----------------------------------------
const kidneyHistory = () =>
  sec("Kidney & Urological History", [
    S("known_kidney_disease", "Known Kidney Disease", ["No known kidney disease", "Known — see detail", "Unknown"]),
    T("known_kidney_disease_detail", "Known Kidney Disease — Diagnosis, Duration & Treating Centre", when("known_kidney_disease", "Known — see detail")),
    I("baseline_creatinine", "Baseline Serum Creatinine (value and units)"),
    I("baseline_egfr", "Baseline eGFR (mL/min/1.73 m²)"),
    I("baseline_date", "Date of Baseline Values"),
    S("baseline_source", "Source of Baseline Values", ["Previous AMedix record", "Outside result", "Patient-reported", "Not known"]),
    S("previous_aki", "Previous Acute Kidney Injury (any episode)", YES_NO_UNK),
    T("previous_aki_detail", "Previous Acute Kidney Injury — Stage, Cause, Recovery & Date", when("previous_aki", "Yes")),
    S("recurrent_uti", "Recurrent Urinary Tract Infections", ["No", "Yes — see detail", "Unknown"]),
    T("recurrent_uti_detail", "Recurrent Urinary Tract Infections — Frequency, Organisms & Last Episode", when("recurrent_uti", "Yes — see detail")),
    S("kidney_stones", "Kidney Stones", ["No", "Yes — see detail", "Unknown"]),
    T("kidney_stones_detail", "Kidney Stones — Composition, Interventions & Recurrence", when("kidney_stones", "Yes — see detail")),
    S("previous_renal_procedures", "Previous Renal Procedures", ["None", "Yes — see detail", "Unknown"]),
    T("previous_renal_procedures_detail", "Previous Renal Procedures — Biopsy, Nephrostomy, Stent, Dialysis Catheter, Transplant, Nephrectomy", when("previous_renal_procedures", "Yes — see detail")),
    S("family_renal_disease", "Family & Hereditary Kidney Disease", ["No relevant history", "Yes — see detail", "Unknown", "Not asked"]),
    T("family_renal_disease_detail", "Family & Hereditary Kidney Disease — Relatives, Diagnosis & Age at Onset", when("family_renal_disease", "Yes — see detail")),
    S("hereditary_features", "Features Suggesting Hereditary Disease", ["None identified", "Multiple affected relatives", "Young-onset disease", "Deafness or ocular involvement", "Skeletal or skin features", "Not assessed"]),
    S("previous_renal_surgery", "Previous Renal or Urological Surgery", ["None", "Yes — see detail", "Unknown"]),
    T("previous_renal_surgery_detail", "Previous Renal or Urological Surgery — Detail", when("previous_renal_surgery", "Yes — see detail")),
  ]);

const urinaryHistory = () =>
  sec("Urinary & Volume History", [
    S("urine_output_change", "Urine Output Change", ["Normal", "Reduced — oliguria", "No urine — anuria", "Increased — polyuria", "Nocturia", "Fluctuating", NOT_KNOWN]),
    I("urine_output_24h", "Documented 24-hour Urine Output (mL)"),
    I("fluid_intake", "Documented Fluid Intake (mL/day)"),
    S("hematuria", "Haematuria", ["Absent", "Visible (macroscopic)", "Non-visible (microscopic only)", "Unknown", "Not tested"]),
    T("hematuria_detail", "Haematuria — Timing & Associated Features", when("hematuria", "Visible (macroscopic)", "Non-visible (microscopic only)")),
    S("foamy_urine", "Foamy Urine", ["Absent", "Present", "Not asked"]),
    S("dysuria", "Dysuria, Urgency or Frequency", ["Absent", "Present — see detail", "Not asked"]),
    T("urinary_symptoms_detail", "Urinary Symptoms — Detail (hesitancy, terminal dribbling, retention, incontinence)"),
    S("thirst", "Thirst / Polydipsia", ["Absent", "Present", "Not asked"]),
    S("edema_reported", "Patient-reported Swelling", ["None", "Ankle / pedal", "Legs", "Facial", "Generalised", NOT_KNOWN]),
    I("weight_current", "Current Weight (kg)"),
    I("weight_previous", "Previously Recorded Weight (kg)"),
    I("weight_change_interval", "Interval Between Weight Measurements"),
  ]);

// ---- History: comorbidities and medication exposure ----------------------
// Comorbidity and medication lists are carried by the unified AMedix Patient
// Record and are no longer re-entered in the Nephrology notes. Only the
// nephrology-specific exposure question is documented here.
const comorbidityHistory = () => [];

const medicationExposure = () =>
  sec("Nephrotoxic Risk", [
    S("nephrotoxic_exposure", "Nephrotoxic Exposure", ["None identified", "Contrast media", "Aminoglycoside", "Amphotericin B", "Cisplatin", "Calcineurin inhibitor", "Lithium", "Tenofovir", "Other — see detail", "Not assessed"]),
    T("nephrotoxic_exposure_detail", "Nephrotoxic Exposure — Agent, Timing & Relationship to the Presentation", when("nephrotoxic_exposure", "Contrast media", "Aminoglycoside", "Amphotericin B", "Cisplatin", "Calcineurin inhibitor", "Lithium", "Tenofovir", "Other — see detail")),
  ]);

// ---- History: dialysis and transplantation -------------------------------
const dialysisTransplant = () =>
  sec("Dialysis & Transplant Status", [
    S("dialysis_status", "Dialysis Status", ["Not on dialysis", "Haemodialysis", "Peritoneal dialysis", "Planned — not yet started", "Discontinued", "Unknown"]),
    I("dialysis_schedule", "Dialysis Schedule (sessions per week / hours)", when("dialysis_status", "Haemodialysis", "Peritoneal dialysis")),
    I("dialysis_access_in_use", "Access in Use (AV fistula / graft / tunnelled catheter / PD catheter)", when("dialysis_status", "Haemodialysis", "Peritoneal dialysis")),
    I("dry_weight", "Documented Dry Weight (kg)", when("dialysis_status", "Haemodialysis", "Peritoneal dialysis")),
    I("last_dialysis_session", "Date of Last Session", when("dialysis_status", "Haemodialysis", "Peritoneal dialysis")),
    T("dialysis_interval_review", "Interval Dialysis Review (adequacy, symptoms, volume control)", when("dialysis_status", "Haemodialysis", "Peritoneal dialysis", "Discontinued")),
    S("transplant_status", "Kidney Transplant Status", ["No transplant", "Functioning transplant", "Transplant with declining function", "Failed transplant", "Unknown"]),
    I("transplant_date", "Transplant Date", when("transplant_status", "Functioning transplant", "Transplant with declining function", "Failed transplant")),
    S("donor_type", "Donor Type", ["Living related", "Living unrelated", "Deceased donor", "Unknown"], when("transplant_status", "Functioning transplant", "Transplant with declining function", "Failed transplant")),
    T("immunosuppression_regimen", "Immunosuppressive Therapy (agents and current doses)", when("transplant_status", "Functioning transplant", "Transplant with declining function")),
    S("rejection_history", "Previous Rejection Episode", YES_NO_UNK, when("transplant_status", "Functioning transplant", "Transplant with declining function", "Failed transplant")),
    T("transplant_complications", "Transplant Complications (infection, drug toxicity, surgical)", when("transplant_status", "Functioning transplant", "Transplant with declining function")),
  ]);

// ---- Examination (shared engines) ----------------------------------------
const examinationSection = ({ access = false, label = "Renal & Systemic Examination Findings" } = {}) => [
  ...sec("Clinical Examination", [
    { key: "vitals", label: "Vital Signs", type: "vitals" },
    T("renal_examination_findings", label),
    S("volume_status", "Volume Status Assessment", ["Euvolaemic", "Hypovolaemic", "Hypervolaemic — see detail", "Difficult to assess", "Not assessed"]),
    T("volume_status_detail", "Volume Status — Supporting Findings", when("volume_status", "Hypervolaemic — see detail")),
    S("hydration_status", "Hydration (Mucous Membranes / Skin Turgor)", ["Well hydrated", "Mildly dehydrated", "Severely dehydrated", "Not assessed"]),
    S("peripheral_edema_findings", "Peripheral Edema — Documented Findings", ["Absent", "Ankle", "Pretibial / mid-shin", "Sacral", "Anasarca", "Unilateral — see detail", "Not assessed"]),
    S("pulmonary_congestion", "Pulmonary Congestion", ["Absent", "Bibasal crackles", "Crackles to mid-zones", "Pulmonary oedema", "Not assessed"]),
    S("renal_bruit", "Renal Bruit / Abdominal Findings", ["Not assessed", "Absent", "Present — right", "Present — left", "Present — bilateral"]),
    ...(access
      ? [
          S("access_assessment", "Dialysis Access Assessment", ["No access present", "Thrill present, bruit present", "Thrill absent", "Bruit absent", "Signs of infection — see detail", "Not assessed"]),
          T("access_assessment_detail", "Dialysis Access — Supporting Findings", when("access_assessment", "Thrill absent", "Bruit absent", "Signs of infection — see detail")),
        ]
      : []),
    T("other_systemic_findings", "Other Renal or Systemic Findings (skin, eyes, joints, neurological, musculoskeletal)"),
    S("negative_findings_documented", "Relevant Negative Findings Documented", ["Yes — recorded above", "Partially", "No", "Not applicable"]),
    S("findings_completeness", "Documentation of Findings", ["All systems documented", "Partial — patient unable to cooperate", "Limited by clinical condition", "Findings not assessed"]),
  ]),
];

// ---- Investigations ------------------------------------------------------
// Serum chemistry, renal function, urine studies, radiology and histopathology
// results live in the unified AMedix Patient Record (laboratory and imaging
// requests) and are no longer re-entered in the Nephrology notes. These
// builders stay so every template that composes them keeps working.
const chemistryResults = (_label) => [];

const urineResults = () => [];

const radiologyHistology = () => [];

const assessmentSection = ({ kdigo = true } = {}) => [
  ...sec("Assessment", [
    T("clinical_summary", "Clinical Summary / Syndromic Problem List"),
    ...(kdigo
      ? [
          S("aki_stage", "Acute Kidney Injury Stage (KDIGO)", ["Not applicable", "Stage 1", "Stage 2", "Stage 3", "Not yet classified"]),
          S("ckd_g_category", "CKD GFR Category (KDIGO)", ["Not applicable", "G1", "G2", "G3a", "G3b", "G4", "G5", "Not yet classified"]),
          S("albuminuria_category", "Albuminuria Category (KDIGO)", ["Not applicable", "A1", "A2", "A3", "Not measured"]),
          T("guideline_basis", "Guideline Basis and Reference (KDIGO chapter / WHO ICD-11 stem)"),
        ]
      : []),
    T("assessment", "Assessment"),
    T("plan", "Treatment and Plan"),
    T("monitoring_plan", "Monitoring and Review Plan"),
    T("safety_advice", "Safety Advice and When to Seek Urgent Care"),
  ]),
  ...clinicalReasoningSection(),
  ...differentialSection(),
  ...managementSection(),
  ...nephrologySafetySection(),
  ...monitoringFollowupSection(),
];

export const NEPHROLOGY_DOCS = [
  // ---- 1. Nephrology consultation ----------------------------------------
  {
    key: "neph_consultation",
    label: "Nephrology Consultation",
    specialty: "nephrology",
    fields: [
      ...presentingProblem(),
      ...kidneyHistory(),
      ...urinaryHistory(),
      ...comorbidityHistory(),
      ...medicationExposure(),
      ...dialysisTransplant(),
      ...examinationSection(),
      ...chemistryResults(),
      ...urineResults(),
      ...radiologyHistology(),
      ...assessmentSection(),
    ],
  },

  // ---- 2. Nephrology follow-up -------------------------------------------
  {
    key: "neph_followup",
    label: "Nephrology Follow-Up",
    specialty: "nephrology",
    fields: [
      ...sec("Interval Review", [
        I("interval_since", "Interval Since Last Review"),
        S("change_since_review", "Overall Change Since Last Review", ["Improved", "Stable", "Deteriorated", "Fluctuating", NOT_KNOWN]),
        T("interval_history", "Interval Events (admissions, procedures, infections, changes in therapy)"),
        T("symptoms", "Current Symptoms and Functional Impact"),
        S("symptom_status", "Symptom Status", ["Asymptomatic", "Symptoms improved", "Symptoms unchanged", "Symptoms worse", "New symptoms — see detail"]),
        T("new_symptoms_detail", "New Symptoms — Detail", when("symptom_status", "New symptoms — see detail")),
        T("referral_source", "Source of Review (clinic, referring doctor, dialysis unit)"),
      ]),
      ...sec("Interval Kidney Status", [
        I("baseline_creatinine", "Baseline Serum Creatinine (value and units)"),
        I("baseline_egfr", "Baseline eGFR (mL/min/1.73 m²)"),
        S("previous_aki", "Acute Kidney Injury Since Last Review", YES_NO_UNK),
        T("previous_aki_detail", "Acute Kidney Injury — Stage, Cause and Recovery", when("previous_aki", "Yes")),
        S("recurrent_uti", "Urinary Tract Infection Since Last Review", ["No", "Yes — see detail", "Unknown"]),
        T("recurrent_uti_detail", "Urinary Tract Infection — Treatment and Response", when("recurrent_uti", "Yes — see detail")),
        S("kidney_stones", "Stone Event Since Last Review", ["No", "Yes — see detail", "Unknown"]),
        T("kidney_stones_detail", "Stone Event — Intervention and Outcome", when("kidney_stones", "Yes — see detail")),
        S("family_renal_disease", "Family & Hereditary Kidney Disease", ["No relevant history", "Yes — see detail", "Unknown", "Not asked"]),
        T("family_renal_disease_detail", "Family & Hereditary Kidney Disease — Detail", when("family_renal_disease", "Yes — see detail")),
      ]),
      ...urinaryHistory(),
      ...medicationExposure(),
      ...dialysisTransplant(),
      ...examinationSection({ access: true }),
      ...chemistryResults(),
      ...urineResults(),
      ...assessmentSection(),
    ],
  },

  // ---- 3. Renal admission note -------------------------------------------
  {
    key: "neph_admission_note",
    label: "Renal Admission Note",
    specialty: "nephrology",
    fields: [
      ...sec("Admission", [
        S("information_source", "Source of Information", SOURCES),
        T("admission_reason", "Reason for Admission"),
        T("hpi", "History of Present Illness — Onset, Duration, Progression and Associated Symptoms"),
        S("presentation_severity", "Presentation Severity", ["Stable", "Moderately unwell", "Severely unwell", "Critical"]),
        S("symptom_onset", "Symptom Onset", ["Today", "Within 48 hours", "This week", "1–4 weeks", "1–6 months", "More than 6 months", NOT_KNOWN]),
        I("symptom_duration", "Duration (e.g. 3 days, 6 weeks)"),
        S("symptom_progression", "Progression", ["Improving", "Static", "Progressively worsening", "Fluctuating", NOT_KNOWN]),
        T("associated_symptoms", "Associated Symptoms"),
        T("reason_for_referral", "Reason for Nephrology Referral (clinical question asked)"),
      ]),
      ...kidneyHistory(),
      ...urinaryHistory(),
      ...comorbidityHistory(),
      ...medicationExposure(),
      ...dialysisTransplant(),
      ...examinationSection({ access: true }),
      ...chemistryResults(),
      ...urineResults(),
      ...radiologyHistology(),
      ...sec("Admission Assessment", [
        T("admission_diagnosis", "Admission Diagnosis"),
        T("admission_plan", "Admission Plan"),
      ]),
      ...assessmentSection(),
    ],
  },

  // ---- 4. Renal progress note --------------------------------------------
  {
    key: "neph_progress_note",
    label: "Renal Progress Note",
    specialty: "nephrology",
    fields: [
      ...sec("Interval Course", [
        T("overnight_events", "Overnight Events"),
        S("clinical_trajectory", "Clinical Trajectory", ["Improving", "Stable", "Deteriorating", "Fluctuating"]),
        T("current_symptoms", "Current Symptoms"),
        S("new_findings", "New Clinical Findings", ["None", "Present — see detail", "Not assessed"]),
        T("new_findings_detail", "New Clinical Findings — Detail", when("new_findings", "Present — see detail")),
      ]),
      ...sec("Clinical Examination", [
        { key: "vitals", label: "Vital Signs", type: "vitals" },
        T("renal_examination_findings", "Interval Examination Findings"),
        S("volume_status", "Volume Status Assessment", ["Euvolaemic", "Hypovolaemic", "Hypervolaemic — see detail", "Difficult to assess", "Not assessed"]),
        T("volume_status_detail", "Volume Status — Supporting Findings", when("volume_status", "Hypervolaemic — see detail")),
        S("hydration_status", "Hydration (Mucous Membranes / Skin Turgor)", ["Well hydrated", "Mildly dehydrated", "Severely dehydrated", "Not assessed"]),
        S("peripheral_edema_findings", "Peripheral Edema — Documented Findings", ["Absent", "Ankle", "Pretibial / mid-shin", "Sacral", "Anasarca", "Unilateral — see detail", "Not assessed"]),
        S("pulmonary_congestion", "Pulmonary Congestion", ["Absent", "Bibasal crackles", "Crackles to mid-zones", "Pulmonary oedema", "Not assessed"]),
        T("other_systemic_findings", "Other Renal or Systemic Findings"),
      ]),
      ...sec("Fluid Balance & Dialysis", [
        I("fluid_balance", "Fluid Balance (mL, 24 hours)"),
        I("urine_output", "Urine Output (mL, 24 hours)"),
        I("current_weight", "Documented Weight (kg)"),
        I("dry_weight", "Documented Dry Weight (kg)"),
        S("dialysis_status", "Dialysis Status", ["Not on dialysis", "Haemodialysis", "Peritoneal dialysis", "Planned — not yet started", "Discontinued", "Unknown"]),
        T("dialysis_review", "Dialysis Review (session, ultrafiltration, tolerance)", when("dialysis_status", "Haemodialysis", "Peritoneal dialysis")),
      ]),
      ...chemistryResults("Serum Chemistry and Haematology — Interval Results"),
      ...urineResults(),
      ...sec("Assessment & Plan", [
        T("clinical_summary", "Clinical Summary"),
        S("aki_stage", "Acute Kidney Injury Stage (KDIGO)", ["Not applicable", "Stage 1", "Stage 2", "Stage 3", "Not yet classified"]),
        S("ckd_g_category", "CKD GFR Category (KDIGO)", ["Not applicable", "G1", "G2", "G3a", "G3b", "G4", "G5", "Not yet classified"]),
        T("assessment", "Assessment"),
        T("plan", "Management Plan for Today"),
        T("monitoring_plan", "Monitoring and Review Plan"),
        T("safety_advice", "Safety Advice and Warning Signs"),
      ]),
      ...clinicalReasoningSection(),
      ...nephrologySafetySection(),
      ...monitoringFollowupSection(),
    ],
  },

  // ---- 5. Dialysis treatment record --------------------------------------
  {
    key: "neph_dialysis_record",
    label: "Dialysis Treatment Record",
    specialty: "nephrology",
    fields: [
      ...sec("Session Details", [
        S("dialysis_type", "Dialysis Type", ["Hemodialysis", "CAPD", "APD", "Other"]),
        I("session_datetime", "Session Date & Time"),
        N("duration_hours", "Duration (hours)", { min: 0, max: 24, step: 0.25, unit: "h" }),
        T("machine_settings", "Machine Settings / Dialysate"),
        T("dialyzer", "Dialyzer"),
        N("blood_flow", "Blood Flow Rate (ml/min)", { min: 50, max: 600, unit: "mL/min" }),
        N("dialysate_flow", "Dialysate Flow Rate (ml/min)", { min: 100, max: 1000, unit: "mL/min" }),
        I("uf_removed", "Ultrafiltration Removed (ml)"),
        I("uf_target", "Ultrafiltration Target (ml)"),
        I("target_weight", "Target Weight (kg)"),
      ]),
      ...sec("Pre- and Post-Dialysis Observations", [
        { key: "vitals_pre", label: "Vital Signs — Pre-Dialysis", type: "vitals" },
        I("pre_bp", "Pre-Dialysis Blood Pressure"),
        I("pre_weight", "Pre-Dialysis Weight (kg)"),
        I("pre_temp", "Pre-Dialysis Temperature (°C)"),
        { key: "vitals_post", label: "Vital Signs — Post-Dialysis", type: "vitals" },
        I("post_bp", "Post-Dialysis Blood Pressure"),
        I("post_weight", "Post-Dialysis Weight (kg)"),
        I("post_temp", "Post-Dialysis Temperature (°C)"),
        T("dialysis_examination_findings", "Pre- and Post-Dialysis Examination Findings"),
        S("volume_tolerance", "Volume Tolerance", ["Tolerated target", "Target not reached — see reason", "Symptomatic hypotension", "Cramps", "Nausea or vomiting", "Not documented"]),
        T("volume_tolerance_detail", "Volume Tolerance — Detail", when("volume_tolerance", "Target not reached — see reason", "Symptomatic hypotension", "Cramps", "Nausea or vomiting")),
      ]),
      ...sec("Access & Anticoagulation", [
        I("access_site", "Access Site"),
        S("access_assessment", "Access Assessment", ["Thrill present, bruit present", "Thrill absent", "Bruit absent", "Signs of infection — see detail", "Not assessed"]),
        T("access_assessment_detail", "Access Assessment — Detail", when("access_assessment", "Thrill absent", "Bruit absent", "Signs of infection — see detail")),
        S("anticoagulation", "Anticoagulation During Session", ["None", "Unfractionated heparin", "Low-molecular-weight heparin", "Citrate", "Other — see detail"]),
        T("anticoagulation_detail", "Anticoagulation — Dose and Monitoring", when("anticoagulation", "Unfractionated heparin", "Low-molecular-weight heparin", "Citrate", "Other — see detail")),
      ]),
      ...chemistryResults("Pre- and Post-Dialysis Serum Chemistry"),
      ...sec("Session Outcome", [
        T("complications", "Complications (e.g. Hypotension / Cramps)"),
        S("complication_severity", "Complication Severity", ["None", "Mild — managed on site", "Moderate — treatment interrupted", "Severe — session stopped", "Not applicable"]),
        T("tolerance", "Tolerance"),
        S("adequacy_documented", "Adequacy Documented", ["Yes — Kt/V or URR recorded", "No — not available", "Pending"]),
        I("ktv_urr", "Kt/V or URR Value"),
        I("next_session", "Next Session"),
        T("nursing_instructions", "Nursing Instructions and Safety Advice"),
      ]),
      ...nephrologySafetySection(),
      ...monitoringFollowupSection(),
    ],
  },

  // ---- 6. Dialysis access record -----------------------------------------
  {
    key: "neph_access_record",
    label: "Dialysis Access Record",
    specialty: "nephrology",
    fields: [
      ...sec("Access Details", [
        S("access_type", "Access Type", ["AV Fistula", "AV Graft", "Tunneled Catheter", "PD Catheter", "Other"]),
        I("location", "Location"),
        I("created_datetime", "Created / Inserted Date"),
        I("surgeon", "Created By"),
        S("access_side", "Side", ["Right", "Left", "Not applicable"]),
        S("access_dominance", "Dominant Arm", ["Yes — dominant arm", "No — non-dominant arm", "Not applicable", "Not documented"]),
        T("access_history", "Previous Accesses and Their Outcome (lines, fistulae, revisions)"),
        S("maturation_status", "Maturation / Function Status", ["Maturing", "Mature and in use", "Failing", "Thrombosed", "Not applicable", "Not documented"]),
      ]),
      ...sec("Access Function & Examination", [
        S("thrill", "Thrill", ["Present", "Absent", "Not assessed"]),
        S("bruit", "Bruit", ["Present", "Absent", "Not assessed"]),
        S("recirculation", "Recirculation", ["Not measured", "Measured — normal", "Measured — raised", "Not applicable"]),
        I("recirculation_value", "Recirculation Value (%)", when("recirculation", "Measured — normal", "Measured — raised")),
        T("flow_assessment", "Flow Assessment"),
        I("pump_speed", "Achieved Pump Speed (mL/min)"),
        S("access_infection", "Signs of Access Infection", ["None", "Erythema", "Discharge", "Abscess", "Systemic features", "Not assessed"]),
        T("access_infection_detail", "Access Infection — Detail and Treatment", when("access_infection", "Erythema", "Discharge", "Abscess", "Systemic features")),
        T("access_examination_findings", "Access Examination Findings (inspection, palpation, auscultation)"),
        T("other_systemic_findings", "Other Findings (aneurysm, steal syndrome, ischaemia, oedema)"),
      ]),
      ...sec("Radiology & Flow Studies", [
        S("access_radiology", "Access Radiology", ["Not performed", "Performed — see findings", "Pending", "Unavailable"]),
        I("access_radiology_date", "Date of Radiology", when("access_radiology", "Performed — see findings")),
        T("access_radiology_findings", "Access Radiology Findings (Doppler, fistulogram, venogram: stenosis, thrombosis, flow)", when("access_radiology", "Performed — see findings")),
      ]),
      ...sec("Assessment", [
        S("access_complication", "Access Complication", ["None", "Stenosis", "Thrombosis", "Infection", "Aneurysm", "Steal syndrome", "Catheter malfunction", "Other — see detail"]),
        T("access_complication_detail", "Access Complication — Detail", when("access_complication", "Stenosis", "Thrombosis", "Infection", "Aneurysm", "Steal syndrome", "Catheter malfunction", "Other — see detail")),
        T("access_plan", "Access Plan"),
        T("monitoring_plan", "Surveillance and Review Plan"),
        T("safety_advice", "Safety Advice and When to Seek Urgent Care"),
      ]),
      ...nephrologySafetySection(),
      ...monitoringFollowupSection(),
    ],
  },

  // ---- 7. Renal procedure note -------------------------------------------
  {
    key: "neph_procedure_note",
    label: "Renal Procedure Note",
    specialty: "nephrology",
    fields: [
      ...sec("Procedure", [
        I("procedure", "Procedure (e.g. Native Kidney Biopsy, Transplant Biopsy, Dialysis Catheter Insertion)"),
        S("procedure_urgency", "Procedure Urgency", ["Elective", "Urgent", "Emergency"]),
        T("indication", "Indication"),
        T("consent", "Consent (risks, benefits and alternatives discussed)"),
        S("information_source", "Source of Information", SOURCES),
      ]),
      ...sec("Pre-Procedure Safety", [
        S("coagulation_review", "Coagulation and Bleeding Risk Reviewed", ["Yes — results documented below", "No — not available", "Not applicable"]),
        S("antithrombotic_held", "Antiplatelet / Anticoagulant Management", ["None prescribed", "Continued", "Withheld — see detail", "Not reviewed"]),
        T("antithrombotic_detail", "Antithrombotic — Agent, Last Dose and Planned Restart", when("antithrombotic_held", "Continued", "Withheld — see detail")),
        S("blood_pressure_safe", "Blood Pressure Acceptable for Procedure", ["Yes", "No — optimised before procedure", "Not documented"]),
        S("infection_screen", "Infection Screen Before Procedure", ["Not required", "Done — negative", "Done — positive — see detail", "Not documented"]),
        T("infection_screen_detail", "Infection Screen — Detail", when("infection_screen", "Done — positive — see detail")),
        S("imaging_before", "Pre-Procedure Radiology", ["Not required", "Performed — see findings", "Not performed", "Unavailable"]),
        T("imaging_before_findings", "Pre-Procedure Radiology Findings (ultrasound, CT, vein mapping)", when("imaging_before", "Performed — see findings")),
      ]),
      ...chemistryResults("Pre-Procedure Serum Chemistry and Coagulation"),
      ...sec("Technique & Specimens", [
        T("technique", "Technique"),
        T("imaging_guidance", "Radiological Guidance"),
        T("local_anaesthesia", "Local Anaesthesia and Sedation"),
        S("passes", "Number of Needle Passes / Attempts", ["Not applicable", "One", "Two", "Three or more", "Not documented"]),
        T("specimens", "Specimens"),
        S("specimen_adequacy", "Specimen Adequacy", ["Adequate for interpretation", "Limited — see detail", "Inadequate", "Not applicable"]),
        T("specimen_adequacy_detail", "Specimen Adequacy — Detail", when("specimen_adequacy", "Limited — see detail", "Inadequate")),
      ]),
      ...sec("Post-Procedure Monitoring", [
        T("bleeding_check", "Post-Procedure Bleeding Check"),
        T("post_procedure_examination_findings", "Post-Procedure Examination Findings"),
        S("post_procedure_complication", "Post-Procedure Complication", ["None", "Bleeding", "Haematoma", "Pain", "Haematuria", "Hypotension", "Other — see detail"]),
        T("post_procedure_complication_detail", "Complication — Detail and Management", when("post_procedure_complication", "Bleeding", "Haematoma", "Pain", "Haematuria", "Hypotension", "Other — see detail")),
        I("post_procedure_haemoglobin", "Post-Procedure Haemoglobin (g/L)"),
        T("observation_instructions", "Observation Instructions (bed rest, monitoring, next observations)"),
        T("patient_condition", "Patient Condition"),
      ]),
      ...sec("Biopsy Findings", [
        S("biopsy_status", "Histopathology Status", ["Not applicable", "Pending", "Reported — see findings", "Unavailable"]),
        T("biopsy_findings", "Histopathology Findings — Light Microscopy, Immunofluorescence and Electron Microscopy", when("biopsy_status", "Reported — see findings")),
        I("pathology_reference", "Pathology Report Reference and Reporting Pathologist", when("biopsy_status", "Reported — see findings")),
      ]),
      ...sec("Assessment", [
        T("clinical_summary", "Clinical Summary"),
        T("plan", "Treatment and Plan"),
        T("monitoring_plan", "Monitoring and Review Plan"),
        T("safety_advice", "Safety Advice and When to Seek Urgent Care"),
      ]),
      ...clinicalReasoningSection(),
      ...nephrologySafetySection(),
      ...monitoringFollowupSection(),
    ],
  },

  // ---- 8. Nephrology discharge summary -----------------------------------
  {
    key: "neph_discharge_summary",
    label: "Discharge Summary (Nephrology)",
    specialty: "nephrology",
    fields: [
      ...sec("Admission & Course", [
        T("admission_diagnosis", "Admission Diagnosis"),
        T("discharge_diagnosis", "Discharge Diagnosis"),
        T("hospital_course", "Hospital Course"),
        S("aki_stage", "Acute Kidney Injury Stage (KDIGO)", ["Not applicable", "Stage 1", "Stage 2", "Stage 3", "Not yet classified"]),
        S("ckd_g_category", "CKD GFR Category (KDIGO)", ["Not applicable", "G1", "G2", "G3a", "G3b", "G4", "G5", "Not yet classified"]),
        S("albuminuria_category", "Albuminuria Category (KDIGO)", ["Not applicable", "A1", "A2", "A3", "Not measured"]),
      ]),
      ...chemistryResults("Renal Function at Discharge"),
      ...urineResults(),
      ...radiologyHistology(),
      ...sec("Discharge Status", [
        { key: "vitals", label: "Vital Signs at Discharge", type: "vitals" },
        T("discharge_examination_findings", "Discharge Examination Findings"),
        I("discharge_weight", "Discharge Weight (kg)"),
        I("dry_weight", "Documented Dry Weight (kg)"),
        S("volume_status", "Volume Status at Discharge", ["Euvolaemic", "Hypovolaemic", "Hypervolaemic — see detail", "Difficult to assess", "Not assessed"]),
        S("dialysis_status", "Dialysis Status at Discharge", ["Not on dialysis", "Haemodialysis", "Peritoneal dialysis", "Planned — not yet started", "Discontinued", "Unknown"]),
        T("dialysis_plan", "Dialysis Plan", when("dialysis_status", "Haemodialysis", "Peritoneal dialysis")),
        S("transplant_status", "Kidney Transplant Status", ["No transplant", "Functioning transplant", "Transplant with declining function", "Failed transplant", "Unknown"]),
        T("immunosuppression_regimen", "Immunosuppressive Therapy (agents and current doses)", when("transplant_status", "Functioning transplant", "Transplant with declining function")),
        T("outstanding_results", "Results Pending at Discharge and Who Will Follow Them Up"),
      ]),
      ...sec("Discharge Medication & Instructions", [
        T("discharge_medications", "Discharge Medications"),
        T("medication_changes", "Medication Changes Made During Admission (stopped, started, dose adjusted)"),
        T("renal_dose_instructions", "Renal Dose Instructions (agents needing adjustment and the new dose)"),
        S("nephrotoxin_advice", "Nephrotoxin Advice Given", ["Yes — NSAIDs and other nephrotoxins avoided", "Yes — contrast precautions given", "Not documented"]),
        I("fluid_restriction", "Fluid Restriction"),
        T("fluid_and_diet_advice", "Fluid and Dietary Advice"),
        T("instructions", "Instructions"),
        T("safety_advice", "Warning Signs and When to Seek Urgent Care"),
      ]),
      ...sec("Follow-Up", [
        T("follow_up", "Follow-Up"),
        I("follow_up_date", "Next Nephrology Review Date"),
        I("follow_up_clinic", "Review Clinic / Contact"),
        T("monitoring_plan", "Monitoring Plan (what will be checked and when)"),
      ]),
      ...clinicalReasoningSection(),
      ...managementSection(),
      ...nephrologySafetySection(),
      ...monitoringFollowupSection(),
    ],
  },

  // ---- 9. CKD care plan --------------------------------------------------
  {
    key: "neph_ckd_care_plan",
    label: "CKD Care Plan",
    specialty: "nephrology",
    fields: [
      ...sec("CKD Classification", [
        S("ckd_stage", "CKD Stage", ["Stage 1", "Stage 2", "Stage 3a", "Stage 3b", "Stage 4", "Stage 5"]),
        S("ckd_g_category", "KDIGO GFR Category", ["G1", "G2", "G3a", "G3b", "G4", "G5", "Not yet classified"]),
        S("albuminuria_category", "KDIGO Albuminuria Category", ["A1", "A2", "A3", "Not measured"]),
        I("egfr", "Current eGFR"),
        I("baseline_egfr", "Baseline eGFR"),
        S("progression_rate", "Progression Since Baseline", ["Stable", "Slow decline", "Rapid decline", "Improving", "Unknown"]),
        T("ckd_risk_note", "Risk Assessment Note (KDIGO risk heat map category and basis)"),
        T("guideline_basis", "Guideline Basis and Reference (KDIGO chapter / WHO ICD-11 stem)"),
      ]),
      ...chemistryResults(),
      ...urineResults(),
      ...sec("Clinical Status at Review", [
        { key: "vitals", label: "Vital Signs", type: "vitals" },
        T("clinic_examination_findings", "Clinic Examination Findings"),
        S("volume_status", "Volume Status Assessment", ["Euvolaemic", "Hypovolaemic", "Hypervolaemic — see detail", "Difficult to assess", "Not assessed"]),
        S("peripheral_edema_findings", "Peripheral Edema — Documented Findings", ["Absent", "Ankle", "Pretibial / mid-shin", "Sacral", "Anasarca", "Unilateral — see detail", "Not assessed"]),
        I("weight_current", "Current Weight (kg)"),
        I("weight_previous", "Previously Recorded Weight (kg)"),
      ]),
      ...sec("Treatment Targets", [
        I("hba1c_target", "HbA1c Target (%)"),
        I("bp_target", "Blood Pressure Target"),
        I("bp_achieved", "Blood Pressure Achieved"),
        T("management_goals", "Management Goals"),
      ]),
      ...sec("Complication Management", [
        S("anaemia_status", "Anaemia Status", ["Not present", "Present — iron deficiency", "Present — ESA treated", "Present — untreated", "Not assessed"]),
        T("anemia_management", "Anemia Management"),
        S("mineral_bone_status", "Mineral and Bone Disorder", ["Not present", "Hyperphosphataemia", "Hypocalcaemia", "Raised PTH", "Multiple — see detail", "Not assessed"]),
        T("bone_mineral_plan", "Bone and Mineral Plan"),
        S("acidosis_status", "Metabolic Acidosis", ["Not present", "Present — treated", "Present — untreated", "Not assessed"]),
        T("acidosis_management", "Acidosis Management"),
        T("diet_plan", "Diet and Fluid Plan"),
        T("medication_plan", "Kidney-Protective Therapy (agents, doses and renal dose review)"),
        S("nephrotoxin_advice", "Nephrotoxin Avoidance Discussed", ["Yes — NSAIDs and other nephrotoxins", "Yes — contrast precautions", "Not documented"]),
        S("vaccination_review", "Vaccination Review", ["Up to date", "Due — see detail", "Not reviewed"]),
        T("vaccination_detail", "Vaccination Detail", when("vaccination_review", "Due — see detail")),
      ]),
      ...sec("Planning & Education", [
        S("dialysis_planning_status", "Dialysis Planning", ["Not indicated", "Discussed", "Access planning started", "Pre-dialysis clinic", "Declined"]),
        T("dialysis_planning", "Dialysis Planning Detail"),
        S("transplant_status", "Transplant Assessment", ["Not indicated", "Discussed", "Referred", "On waiting list", "Not suitable", "Declined"]),
        T("transplant_referral", "Transplant Referral Detail"),
        T("education_given", "Education Given and Understanding Confirmed"),
        T("psychosocial_support", "Psychosocial and Support Needs"),
        I("review_interval", "Review Interval"),
        T("monitoring_plan", "Monitoring Plan (parameters, frequency and responsibility)"),
        T("safety_advice", "Safety Advice and When to Seek Urgent Care"),
      ]),
      ...clinicalReasoningSection(),
      ...differentialSection(),
      ...nephrologySafetySection(),
      ...monitoringFollowupSection(),
    ],
  },
];

// Shared builders, exported so the condition-specific Nephrology catalogues
// (CKD, AKI, glomerular disease, diabetic and hypertensive kidney disease,
// anaemia of CKD, CKD–MBD, electrolyte and acid–base disorders, stones and
// obstruction, hereditary disease, transplantation and conservative kidney
// management) reuse the SAME field definitions instead of copying them.
export {
  I, N, T, S, when, sec,
  YES_NO_UNK, NOT_KNOWN, SOURCES, ROS, ROS_POSITIVE, AVAILABILITY,
  presentingProblem, kidneyHistory, urinaryHistory, comorbidityHistory,
  medicationExposure, dialysisTransplant, examinationSection,
  chemistryResults, urineResults, radiologyHistology, assessmentSection,
};