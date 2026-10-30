// Pre-operative anesthesia documents — the pre-anesthesia assessment, the
// anesthesia consultation, the anesthesia plan and anesthesia consent.
//
// Strengthened against:
//   ASA Basic Standards for Preanesthesia Care — revised 15 October 2025
//   ASA Practice Advisory for Preanesthesia Evaluation — March 2012
//   ASA Statement on ASA Physical Status Classification System — revised 15 Oct 2025
//   ASA Practice Guidelines for Preoperative Fasting — March 2017, updated February 2023
//   ASA Practice Guidelines for Management of the Difficult Airway — January 2022
//   ASA Practice Guidelines for Perioperative Management of Patients with
//     Obstructive Sleep Apnea — February 2014
//   ASA Practice Advisory for Perioperative Care of Older Adults — January 2025
//   ASA Practice Advisory for the Perioperative Management of Patients with
//     Cardiac Implantable Electronic Devices — February 2020
//
// Every item stays empty until the anesthesiologist documents it. Nothing is
// defaulted to normal, no diagnosis is assigned, an unevaluated assessment is
// never recorded as normal, ASA Physical Status is never derived from an ICD-11
// code, and consent is never recorded as obtained unless the discussion took
// place. Fields that only apply to certain patients are conditional.

import {
  I,
  N,
  T,
  S,
  VIT,
  R,
  when,
  sec,
  ICD,
  YES_NO,
  YES_NO_UNK,
  NOT_DOCUMENTED,
  ASA_CLASSES,
  ASA_EMERGENCY,
  TECHNIQUES,
  AIRWAY_DEVICES,
  NORMAL_ABNORMAL,
  asaStatusFields,
  fastingFields,
  airwayAssessmentFields,
} from "./anesthesiaFields.js";

const ABNORMAL = "Abnormal — documented below";

// ---------------------------------------------------------------------------
// 1. Pre-Anesthesia Assessment
// ---------------------------------------------------------------------------
export const preAssessment = {
  key: "anes_pre_assessment",
  label: "Pre-Anesthesia Assessment",
  specialty: "anesthesiology",
  notice:
    "Documentation basis: ASA Basic Standards for Preanesthesia Care (revised 15 October 2025) and the ASA Practice Advisory for Preanesthesia Evaluation (March 2012). ASA Physical Status is a functional classification, not a diagnosis and not a complete perioperative risk assessment: it is assigned by the anesthesiologist, recorded separately from ICD-11 codes, and an item that was not evaluated stays unanswered rather than recorded as normal.",
  fields: [
    ...sec("Patient & Procedure Identification", [
      S(
        "identity_verified",
        "Patient Identity Verified Before This Assessment",
        [
          "Yes — spoken identification and the record checked",
          "Yes — identification band and the record checked",
          "Yes — interpreter or family-assisted confirmation",
          "Not verified",
        ],
        R
      ),
      T("identity_identifiers", "Identifiers Used — full name, CIN, date of birth"),
      I("procedure_planned", "Procedure Planned", R),
      I("surgical_site", "Surgical Site / Side"),
      T("procedure_indication", "Indication for the Procedure — the surgical problem being treated"),
      I("surgical_specialty", "Surgical Specialty / Operating Team"),
      S("surgical_urgency", "Surgical Urgency", [
        "Elective",
        "Urgent — not immediately life-threatening",
        "Emergency — E modifier applies",
        "Time-critical",
        NOT_DOCUMENTED,
      ]),
      I("scheduled_date", "Scheduled Procedure Date"),
      S("evaluation_setting", "Where This Evaluation Was Documented", [
        "Pre-admission clinic",
        "Ward / bedside",
        "Day-of-surgery holding area",
        "Emergency department",
        "Intensive care unit",
        "Telephone / virtual review",
        "Other",
      ]),
      S("information_source", "Source of Information", [
        "Patient interview and existing record",
        "Patient interview only — record unavailable",
        "Existing record only — patient not interviewed",
        "Interpreter-assisted interview",
        "Surrogate or family informant",
        "Other",
      ]),
    ]),
    ...sec("History & Previous Anesthesia", [
      T("chief_concern", "The Patient's Own Concern About Anesthesia"),
      T("medical_history", "Relevant Medical History — the conditions that change anesthetic management"),
      T("surgical_history", "Relevant Surgical History — operations, dates and any complication"),
      T("previous_anesthesia", "Previous Anesthesia — agents, airway device, difficulty, adverse events"),
      S("previous_anesthesia_problem", "Previous Anesthetic Problem", [
        "None documented",
        "Documented — see above",
        "Unknown — records unavailable",
      ]),
      T("family_anesthesia_history", "Familial Anesthetic Risk — malignant hyperthermia, pseudocholinesterase deficiency"),
      S("allergies", "Allergy & Intolerance Confirmation", [
        "No known allergies — confirmed with the patient",
        "Documented allergy reviewed at this visit",
        "New allergy reported at this visit — recorded in the patient record",
        "Unable to confirm",
      ]),
      T("allergy_reactions", "Documented Reactions — agent, reaction, severity and when it occurred"),
      S("medication_reconciliation", "Medication Reconciliation Completed Against the Patient Record", [
        "Yes — full list reviewed at this visit",
        "Partially — gaps documented",
        "No — record unavailable",
      ]),
      T("medications", "Perioperative Medication Considerations — anticoagulants, antiplatelets, antihypertensives, hypoglycaemics"),
      S("anticoagulant_status", "Anticoagulant / Antiplatelet Therapy at Present", [
        "None",
        "Continues — neuraxial technique avoided or timed accordingly",
        "Withheld per documented plan",
        "Unknown — confirmed before neuraxial technique",
      ]),
      T(
        "anticoagulant_detail",
        "Anticoagulant / Antiplatelet Detail — agent, last dose, withholding and restart plan",
        when(
          "anticoagulant_status",
          "Continues — neuraxial technique avoided or timed accordingly",
          "Withheld per documented plan",
          "Unknown — confirmed before neuraxial technique"
        )
      ),
      S("substance_use", "Substance Use", [
        "None reported",
        "Tobacco — current or recent",
        "Alcohol — regular use",
        "Recreational substances",
        "More than one",
      ]),
      T("substance_detail", "Substance Use Detail — quantity, last use, and any cessation advice given"),
    ]),
    ...sec("Pre-Anesthesia Evaluation", [
      S("records_reviewed", "Relevant Record Reviewed Before the Procedure", [
        "Yes — full record reviewed",
        "Partially — gaps documented",
        "No",
      ]),
      S("evaluation_completed_timing", "Evaluation Completed", [
        "Within 30 days of the procedure",
        "More than 30 days before the procedure — repeat evaluation required",
        "On the day of the procedure",
        NOT_DOCUMENTED,
      ], R),
      T("preop_examination", "Preoperative Examination"),
      VIT("preop_vitals", "Vital Signs"),
      S("functional_capacity", "Functional Capacity", [
        "≥ 4 METs",
        "< 4 METs",
        "Unable to assess",
        NOT_DOCUMENTED,
      ]),
      S("exercise_tolerance", "Exercise Tolerance", [
        "No limitation on ordinary activity",
        "Limitation on strenuous exertion only",
        "Limitation on ordinary activity",
        "Breathless at rest or on minimal activity",
        "Unable to assess",
      ]),
      T("exercise_tolerance_detail", "What Limits the Patient — breathlessness, chest pain, joint pain, fatigue"),
      T("functional_limitation", "Functional Limitation — breathlessness at rest or on exertion, mobility, frailty"),
      S("cognitive_state", "Baseline Cognitive State", [
        "Intact",
        "Known cognitive impairment or dementia",
        "Delirium present",
        "Unable to assess",
      ]),
    ]),
    ...sec("System Assessment", [
      S("cardiovascular_status", "Cardiovascular Assessment", NORMAL_ABNORMAL),
      T(
        "cardiovascular_detail",
        "Cardiovascular Findings — murmur, rhythm, heart failure, ischaemic symptoms, pacemaker, blood pressure control",
        when("cardiovascular_status", ABNORMAL)
      ),
      S("respiratory_status", "Respiratory Assessment", NORMAL_ABNORMAL),
      T(
        "respiratory_detail",
        "Respiratory Findings — wheeze, infection, oxygen requirement, exercise limitation, recent exacerbation",
        when("respiratory_status", ABNORMAL)
      ),
      S("neurological_status", "Neurological Assessment", NORMAL_ABNORMAL),
      T(
        "neurological_detail",
        "Neurological Findings — cognition, focal deficit, seizure history, neuromuscular disease, autonomic involvement",
        when("neurological_status", ABNORMAL)
      ),
      S("renal_impairment", "Kidney Function Consideration", [
        "No known impairment",
        "Impaired — drug dosing reviewed",
        "Dialysis dependent — timing and access protection planned",
        "Unknown",
      ]),
      T(
        "renal_detail",
        "Renal Detail — creatinine or eGFR, electrolytes, dialysis schedule, fistula or graft protection",
        when("renal_impairment", "Impaired — drug dosing reviewed", "Dialysis dependent — timing and access protection planned")
      ),
      S("hepatic_status", "Hepatic Assessment", [
        "No known impairment",
        "Impaired — coagulation and drug metabolism reviewed",
        "Unknown",
      ]),
      T(
        "hepatic_detail",
        "Hepatic Findings — jaundice, ascites, encephalopathy, synthetic function",
        when("hepatic_status", "Impaired — coagulation and drug metabolism reviewed")
      ),
      S("endocrine_status", "Endocrine Assessment", [
        "No abnormality identified",
        "Diabetes — perioperative glycaemic plan documented",
        "Thyroid disease — therapy reviewed",
        "Adrenal or pituitary disease — steroid cover considered",
        "Other — documented below",
        "Unknown",
      ]),
      T(
        "endocrine_detail",
        "Endocrine Findings — control, current therapy, steroid cover, last doses",
        when(
          "endocrine_status",
          "Diabetes — perioperative glycaemic plan documented",
          "Thyroid disease — therapy reviewed",
          "Adrenal or pituitary disease — steroid cover considered",
          "Other — documented below"
        )
      ),
      S("hematological_status", "Haematological Assessment", [
        "No abnormality identified",
        "Anaemia — documented and optimised where possible",
        "Coagulopathy or thrombocytopenia — documented",
        "Sickle cell or thalassaemia — precautions documented",
        "Other — documented below",
        "Unknown",
      ]),
      T(
        "hematological_detail",
        "Haematological Findings — haemoglobin, platelets, clotting, transfusion history and antibodies",
        when(
          "hematological_status",
          "Anaemia — documented and optimised where possible",
          "Coagulopathy or thrombocytopenia — documented",
          "Sickle cell or thalassaemia — precautions documented",
          "Other — documented below"
        )
      ),
      T("other_system_findings", "Other Clinically Relevant Findings — musculoskeletal, dermatological, psychiatric, vascular access"),
    ]),
    ...sec("Pregnancy Considerations", [
      S("pregnancy_status", "Pregnancy Status", [
        "Not applicable",
        "Not pregnant — confirmed",
        "Pregnant — gestation recorded",
        "Unknown — pregnancy test to be performed",
      ]),
      I("gestational_age", "Gestational Age", when("pregnancy_status", "Pregnant — gestation recorded")),
      T(
        "pregnancy_considerations",
        "Pregnancy-Related Anesthetic Considerations — aspiration risk, aortocaval compression, left lateral tilt, fetal monitoring, tocolysis, thromboprophylaxis",
        when("pregnancy_status", "Pregnant — gestation recorded")
      ),
      S("pregnancy_test", "Pregnancy Test Before Anesthesia", [
        "Not applicable",
        "Performed — result documented",
        "Required, not yet performed",
        "Declined by the patient",
      ]),
    ]),
    ...sec("Airway & Aspiration Risk", [
      ...airwayAssessmentFields(),
      T("airway_anatomy", "Anatomical Considerations — beard, obesity, neck circumference, irradiation, mass, receding mandible"),
      T("ventilation_predictors", "Predictors of Difficult Mask Ventilation — age, obesity, edentulous, snoring, radiation change"),
      T("intubation_predictors", "Predictors of Difficult Intubation — mouth opening, thyromental distance, cervical mobility, previous difficulty"),
      S("difficult_airway_history", "Previous Difficult Airway or Difficult Ventilation", [
        "No",
        "Yes — documented record reviewed",
        "Yes — patient reports difficulty",
        "Unknown — records unavailable",
      ]),
      T(
        "difficult_airway_detail",
        "Previous Difficulty — what happened, device used, attempts and grade",
        when("difficult_airway_history", "Yes — documented record reviewed", "Yes — patient reports difficulty")
      ),
      S("aspiration_risk", "Aspiration Risk at Induction", ["Low", "Increased", "High — rapid sequence planned"]),
    ]),
    ...sec("Fasting & Pulmonary Aspiration Precaution", [
      ...fastingFields(),
      T("last_oral_intake", "Last Oral Intake — what was taken, when, and how much"),
    ]),
    ...sec("ASA Physical Status", [
      ...asaStatusFields(),
      S("asa_confirmed", "Class Confirmed by the Responsible Anesthesiologist", [
        "Confirmed at this assessment",
        "Provisional — to be confirmed on the day of the procedure",
        "Not confirmed",
      ]),
      S("asa_limitation", "Individualized Perioperative Risk Documented Separately From the Class", [
        "Yes — risk summary recorded",
        "Not yet documented",
      ]),
    ]),
    ...sec("Patient-Specific Risks", [
      S("osa_status", "Obstructive Sleep Apnoea", [
        "Not suspected",
        "Suspected — screening indicated",
        "Diagnosed — treated with CPAP or other therapy",
        "Diagnosed — not treated",
      ]),
      N(
        "stop_bang",
        "STOP-BANG Score (0–8) — where sleep apnoea risk is being assessed (ASA February 2014 guidance)",
        { min: 0, max: 8, unit: "/ 8" },
        when("osa_status", "Suspected — screening indicated", "Diagnosed — treated with CPAP or other therapy", "Diagnosed — not treated")
      ),
      S("ponv_risk", "Postoperative Nausea and Vomiting Risk", [
        "Low — 0 to 1 risk factors",
        "Moderate — 2 risk factors",
        "High — 3 or more risk factors",
        "Not assessed",
      ]),
      S("malignant_hyperthermia", "Malignant Hyperthermia History or Susceptibility", [
        "None known",
        "Family history — susceptibility documented",
        "Personal history or previous reaction — documented",
        "Unknown",
      ]),
      T(
        "mh_precautions",
        "Malignant Hyperthermia Precautions Planned — trigger-free technique, dantrolene availability, team briefing",
        when(
          "malignant_hyperthermia",
          "Family history — susceptibility documented",
          "Personal history or previous reaction — documented"
        )
      ),
      S("bleeding_risk", "Bleeding and Transfusion Risk", [
        "Low — no blood products planned",
        "Increased — group and save requested",
        "High — cross-matched units and blood management plan documented",
        "Not assessed",
      ]),
      S("delirium_risk", "Postoperative Delirium Risk (ASA January 2025 advisory for older adults)", [
        "Not applicable",
        "Low",
        "Increased — cognitive screening and prevention plan documented",
        "Not assessed",
      ]),
      T("other_patient_specific_risks", "Other Patient-Specific Risks — and what makes them relevant here"),
    ]),
    ...sec("Underlying Conditions & Perioperative Impact (ICD-11)", [
      T("comorbidities", "Comorbid Conditions Relevant to Anesthesia — as documented at this visit"),
      ICD("icd11_comorbidities", "Underlying Conditions Coded With ICD-11 — those that affect this anesthetic"),
      T("comorbidity_implications", "Perioperative Impact of Each Condition — organ reserve, drugs, monitoring, expected haemodynamic or respiratory consequence"),
      S("cardiac_implantable_device", "Cardiac Implantable Electronic Device", [
        "None",
        "Pacemaker",
        "Implantable cardioverter-defibrillator",
        "CRT device",
        "Unknown — device check and reprogramming plan required",
      ]),
      T(
        "cied_management",
        "Device Management Plan — interrogation, reprogramming, magnet, diathermy and pacing precautions (ASA February 2020 advisory)",
        when("cardiac_implantable_device", "Pacemaker", "Implantable cardioverter-defibrillator", "CRT device", "Unknown — device check and reprogramming plan required")
      ),
      S("frailty", "Frailty / Older Adult Consideration (ASA January 2025 advisory)", [
        "Not applicable",
        "Assessed — robust",
        "Assessed — vulnerable or frail, plan documented",
        "Not assessed",
      ]),
    ]),
    ...sec("Results, Optimisation & Preparation", [
      T("labs", "Results Reviewed — haemoglobin, coagulation, kidney function, glucose, ECG and any imaging performed"),
      T("results_interpretation", "Interpretation of Results — what each abnormal value means for this anesthetic"),
      S("tests_indicated", "Tests Requested for This Patient", [
        "None indicated — no test would change management",
        "Ordered — results awaited",
        "Available and reviewed",
        "Institutional protocol applies",
      ]),
      T("results_pending", "Results Awaited and Who Will Review Them Before Induction"),
      T("optimisation_actions", "Optimisation Before Anesthesia — anaemia, glycaemic control, blood pressure, infection, smoking, nutrition"),
      S("specialist_opinion_needed", "Further Specialist Opinion Needed", [
        "None",
        "Cardiology",
        "Respiratory",
        "Renal",
        "Endocrine",
        "Other — documented in the record",
      ]),
      T(
        "consultation_requests",
        "Additional Consultations Requested — specialty, the question asked, and the response received",
        when("specialist_opinion_needed", "Cardiology", "Respiratory", "Renal", "Endocrine", "Other — documented in the record")
      ),
      S("premedication_planned", "Premedication Planned", [
        "None",
        "Anxiolysis",
        "Aspiration prophylaxis",
        "Analgesia",
        "Continuation of regular therapy only",
        "Other — documented",
      ]),
      S("optimisation_outstanding", "Optimisation or Consultation Outstanding at the End of This Assessment", [
        "None — ready to proceed",
        "Outstanding — must be complete before induction",
        "Outstanding — procedure should be delayed until resolved",
      ]),
    ]),
    ...sec("Anesthetic Plan & Communication", [
      T("risk_assessment", "Risk Summary — explained to the patient in plain language"),
      T("plan", "Anesthetic Plan (provisional) — technique, airway, monitoring and analgesia"),
      S("shared_decision", "Patient Informed and Agreed", [
        "Yes — consent documented separately",
        "Partially — areas outstanding documented",
        "Declined",
        "Discussion not yet held",
      ]),
      S("consent_documented", "Informed Consent Recorded Separately", [
        "Documented — anesthesia consent note",
        "Discussion held, consent form outstanding",
        "Not yet discussed",
      ]),
      S("interpreter", "Interpreter Used", [
        "Not required",
        "Used — language recorded",
        "Required but unavailable — plan made to obtain one",
      ]),
      T("communication_needs", "Communication or Cognitive Needs — hearing, vision, cognition, anxiety"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 2. Anesthesia Consultation
// ---------------------------------------------------------------------------
export const consultation = {
  key: "anes_consultation",
  label: "Anesthesia Consultation",
  specialty: "anesthesiology",
  notice:
    "A consultation records a documented anesthetic opinion — usually for risk modification, optimisation or a procedure-specific question. Basis: ASA Practice Advisory for Preanesthesia Evaluation (March 2012), the ASA Practice Advisory for Perioperative Care of Older Adults (January 2025), the ASA advisory on Cardiac Implantable Electronic Devices (February 2020) and the ASA Statement on Antenatal Anesthesiology Consultation (October 2025). The ASA class is recorded as a functional classification only and is never presented as a complete individualized risk assessment.",
  fields: [
    ...sec("Consultation Request", [
      I("consult_reason", "Reason for Consultation"),
      I("requested_by", "Requested By"),
      I("procedure_planned", "Procedure Being Considered"),
      I("surgical_site", "Surgical Site / Side"),
      T("question_asked", "The Specific Question to Answer"),
      S("consult_urgency", "Urgency", ["Routine", "Before the scheduled date", "Same day", "Emergency"]),
    ]),
    ...sec("Clinical Assessment", [
      T("history", "Relevant History — presenting problem and anesthetic-relevant background"),
      T("exam_findings", "Physical Assessment"),
      VIT("consult_vitals", "Vital Signs"),
      S("airway_examined", "Airway Assessed During This Consultation", [
        "Yes — findings recorded",
        "No — assessed separately in the pre-anesthesia assessment",
      ]),
      T(
        "airway_findings",
        "Airway Findings — Mallampati, mouth opening, thyromental distance, neck mobility, dentition, previous difficulty",
        when("airway_examined", "Yes — findings recorded")
      ),
      T("investigations", "Results Reviewed — cardiac, respiratory, renal, haematological, endocrine"),
      T("results_interpretation", "Interpretation of Results — and what they change in the plan"),
      ICD("icd11_diagnoses", "Conditions Coded With ICD-11 — the conditions this opinion concerns"),
      S("met_capacity", "Functional Capacity", ["≥ 4 METs", "< 4 METs", "Unable to assess", NOT_DOCUMENTED]),
      T("functional_status", "Functional Capacity and Frailty"),
      S("medication_issues", "Medication Issues Identified", [
        "None",
        "Anticoagulation timing",
        "Cardiovascular therapy to continue or withhold",
        "Endocrine therapy to adjust",
        "Other — documented",
      ]),
      S("anticoagulation_advice", "Anticoagulation Advice Given", [
        "Not applicable",
        "Continue unchanged",
        "Withhold — timing specified",
        "Bridging considered — plan documented",
        "To be agreed with the prescribing team",
      ]),
    ]),
    ...sec("ASA Physical Status & Risk", [
      ...asaStatusFields(),
      S("risk_stratification", "Perioperative Risk Stratification", [
        "Low",
        "Intermediate",
        "High",
        "Very high",
        "Not stratified",
      ]),
      T("risk_stratification_basis", "Basis for the Risk Stratification — the factors that drive it"),
      S("asa_limitation", "Individualized Risk Recorded Separately From the ASA Class", [
        "Yes — recorded above",
        "Not yet documented",
      ]),
    ]),
    ...sec("Opinion & Recommendations", [
      T("recommendations", "Recommendations to the Referring Team"),
      T("further_optimisation", "Further Optimisation Requested — and the expected timeframe"),
      S("fitness", "Fitness for the Proposed Procedure", [
        "Fit as presented",
        "Fit with optimisation",
        "Not fit for this setting — alternative setting advised",
        "Unable to determine",
      ]),
      S("procedure_timing_advice", "Advice on Timing", [
        "Proceed as planned",
        "Proceed after optimisation",
        "Delay — reassess",
        "Not fit for the proposed setting — alternative setting advised",
      ]),
      S("anesthetic_technique_advised", "Anesthetic Technique Advised", TECHNIQUES),
      T("anesthetic_risk", "Anesthetic Risk Explanation Given to the Patient"),
      S("follow_up_arranged", "Follow-Up Arranged", [
        "Review before the procedure",
        "No further anesthesia review needed",
        "Review after the procedure",
        "Not documented",
      ]),
    ]),
    ...sec("Communication", [
      S("discussed_with_patient", "Discussed With the Patient", YES_NO_UNK),
      S("discussed_with_referrer", "Discussed With the Referring Team", YES_NO_UNK),
      T("outstanding_actions", "Outstanding Actions and Owner"),
      I("consultant_name", "Consultant Providing the Opinion"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 3. Anesthesia Plan
// ---------------------------------------------------------------------------
export const plan = {
  key: "anes_plan",
  label: "Anesthesia Plan",
  specialty: "anesthesiology",
  notice:
    "The plan documents the intended technique, airway strategy, monitoring and analgesia before induction. Where an item follows a standard, the standard is named: airway strategy per the ASA Practice Guidelines for Management of the Difficult Airway (January 2022), monitoring per the ASA Standards for Basic Anesthetic Monitoring (last amended 15 October 2025), neuromuscular management per the ASA Practice Guideline for Monitoring and Antagonism of Neuromuscular Blockade (January 2023), blood management per the ASA Practice Guidelines for Perioperative Blood Management (February 2015). A backup plan is recorded before the case, not after a failure.",
  fields: [
    ...sec("Procedure & Technique", [
      I("procedure_planned", "Procedure Planned"),
      I("surgical_site", "Surgical Site / Side"),
      T("procedure_indication", "Indication for the Procedure"),
      S("case_urgency", "Case Urgency", [
        "Elective",
        "Urgent — expedited",
        "Emergency — E modifier applies",
        "Time-critical",
      ]),
      S("planned_technique", "Planned Technique", TECHNIQUES),
      T("technique_rationale", "Why This Technique — patient factors, surgical requirements, patient preference"),
      T("alternatives_considered", "Alternatives Considered — and why they were not chosen"),
      S("anesthesia_setting", "Anesthetizing Location", [
        "Main operating theatre",
        "Day-surgery theatre",
        "Obstetric theatre or labour ward",
        "Interventional suite",
        "Emergency department",
        "Intensive care unit",
        "Imaging suite",
        "Other",
      ]),
      S("who_checklist_planned", "Surgical Safety Checklist Sign-in / Time-out Planned", [
        "Yes — team brief before induction",
        "Yes — before skin incision only",
        "Not planned",
      ]),
    ]),
    ...sec("Airway Strategy", [
      S("airway_approach_primary", "Primary Airway Approach", AIRWAY_DEVICES),
      T("airway_plan", "Airway Plan — preoxygenation, induction sequence, device, verification of placement"),
      S("difficult_airway_declared", "Difficult Airway Anticipated", [
        "No",
        "Yes — awake or invasive strategy planned",
        "Yes — proceed after induction with rescue plan ready",
        "Unknown — assessed at the time",
      ]),
      T("airway_rescue_plan", "Rescue Plan if the Primary Approach Fails — second device, second operator, supraglottic rescue"),
      S("front_of_neck_access", "Front-of-neck Access Preparedness", [
        "Kit available in theatre",
        "Kit available and operator identified",
        "Not prepared — not required for this case",
      ]),
      T("aspiration_precaution_plan", "Aspiration Precaution Plan — rapid sequence, cricoid pressure decision, suction"),
    ]),
    ...sec("Monitoring Plan (ASA Standards)", [
      T("monitoring_plan", "Monitoring Planned — oximetry, capnography, ECG, blood pressure interval, temperature"),
      S("invasive_monitoring", "Invasive Monitoring Planned", [
        "None",
        "Arterial line",
        "Central venous access",
        "Both arterial and central access",
        "Other — documented",
      ]),
      S("neuromuscular_monitoring_planned", "Quantitative Neuromuscular Monitoring Planned", [
        "Yes — train-of-four throughout",
        "Yes — at reversal only",
        "Not required — no neuromuscular blocking agent planned",
      ]),
      S("depth_of_anesthesia_monitoring", "Depth-of-anesthesia Monitoring Planned", [
        "Clinical signs and agent concentration only",
        "Processed EEG (BIS or equivalent)",
        "Not applicable",
      ]),
    ]),
    ...sec("Vascular Access & Fluids", [
      S("vascular_access", "Vascular Access Planned", [
        "One peripheral cannula",
        "Two peripheral cannulae",
        "Wide-bore peripheral access",
        "Central venous access",
        "Arterial line plus peripheral access",
        "Existing tunnelled line or port",
        "Difficult access — plan documented",
      ]),
      T("vascular_access_detail", "Access Detail — gauge, site and any difficult-access plan"),
      T("fluid_management", "Fluid Management Plan — type, rate, targets and whether goal-directed therapy is planned"),
      S("blood_products_planned", "Blood Products Planned", [
        "Not required",
        "Group and save only",
        "Cross-matched units requested",
        "Massive transfusion protocol on standby",
      ]),
    ]),
    ...sec("Analgesia & Opioid-Sparing Plan", [
      T("analgesia_plan", "Analgesia Plan — multimodal throughout the perioperative period"),
      S("regional_block_planned", "Regional or Neuraxial Block Planned", [
        "No",
        "Yes — single-shot block",
        "Yes — catheter technique",
        "Yes — neuraxial for intraoperative and postoperative analgesia",
      ]),
      T(
        "regional_block_detail",
        "Block Detail — site, technique, local anesthetic and total dose",
        when("regional_block_planned", "Yes — single-shot block", "Yes — catheter technique", "Yes — neuraxial for intraoperative and postoperative analgesia")
      ),
      S("ponv_prophylaxis_planned", "Postoperative Nausea and Vomiting Prophylaxis Planned", [
        "None",
        "One intervention",
        "Two or more interventions — risk-factor based",
      ]),
      S("opioid_sparing_strategy", "Opioid-Sparing Strategy", [
        "Multimodal non-opioid analgesia",
        "Regional or neuraxial technique",
        "Both",
        "Not applicable",
      ]),
    ]),
    ...sec("Positioning, Temperature & Blood", [
      T("positioning", "Positioning Planned — and the pressure, nerve and eye protection required"),
      S("peripheral_nerve_protection", "Peripheral Nerve Protection Planned (ASA January 2018 advisory)", [
        "Positioning and padding planned",
        "Additional restraint or support required",
        "Not applicable",
      ]),
      S("warming_planned", "Active Warming Planned", [
        "Forced air warming",
        "Fluid warming",
        "Both",
        "Not planned",
      ]),
      T("anesthesia_medications", "Planned Agents — induction, maintenance, relaxant and reversal, vasoactive support"),
    ]),
    ...sec("Postoperative Destination & Contingency", [
      S("postoperative_destination", "Postoperative Destination Planned", [
        "Recovery then ward",
        "Recovery then day-surgery discharge",
        "High-dependency unit",
        "Intensive care unit",
        "Recovery then specialist unit",
      ]),
      S("icu_bed_confirmed", "Postoperative Critical Care Bed Confirmed Where Needed", [
        "Not required",
        "Confirmed",
        "Requested — not yet confirmed",
      ]),
      T("contingency_plan", "Contingency Plan — failed technique, loss of airway, haemodynamic instability, anaphylaxis"),
      S("emergency_drugs_available", "Emergency Drugs and Difficult Airway Trolley Checked", [
        "Checked and available",
        "Not checked",
      ]),
    ]),
    ...sec("Team, Briefing & Handover", [
      T("team_brief", "Team Brief — plan shared with the surgical and anesthetic team"),
      S("supervision", "Supervision Arrangement", [
        "Personally performed by the consultant",
        "Consultant supervised trainee",
        "Care-team model with anesthesiologist direction",
        "Other — documented",
      ]),
      T("handover_plan", "Planned Handover — receiving team, monitoring, and the triggers to call for help"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 4. Anesthesia Consent
// ---------------------------------------------------------------------------
export const consent = {
  key: "anes_consent",
  label: "Anesthesia Consent",
  specialty: "anesthesiology",
  notice:
    "Consent records a discussion of the intended anesthetic, its material risks and the reasonable alternatives, in a form the patient can understand. Consent is recorded only after the discussion has actually taken place: nothing here is pre-filled as obtained. Risks are documented for the technique actually planned, and an item that was not discussed stays marked as not discussed — never as discussed. Basis: institutional consent protocol — no ASA standard prescribes the content of anesthesia consent.",
  fields: [
    ...sec("Procedure & Technique", [
      I("procedure", "Procedure"),
      I("surgical_site", "Surgical Site / Side"),
      I("patient_identity_confirmed", "Patient Identity Confirmed For This Discussion — name and CIN"),
      S("technique", "Anesthetic Technique Being Consented For", TECHNIQUES),
      S("neuraxial_planned", "Neuraxial or Regional Component", [
        "None",
        "Spinal",
        "Epidural",
        "Combined spinal-epidural",
        "Peripheral nerve block",
        "Catheter technique",
      ]),
      S("consent_discussion_setting", "Discussion Held", [
        "Pre-assessment clinic",
        "Ward",
        "Day-of-surgery holding area",
        "Antenatal clinic",
        "Emergency setting — documented as such",
      ]),
      S("consent_status", "Consent Recorded", [
        "Obtained — patient agreed",
        "Discussion held, consent form outstanding",
        "Declined",
        "Not yet discussed",
      ]),
    ]),
    ...sec("Benefits & Material Risks Discussed", [
      T("benefits_explained", "Benefits Explained — pain control, surgical conditions, safety"),
      S("risk_awareness", "Risk of Intraoperative Awareness Discussed", ["Discussed", "Not discussed", "Not applicable"]),
      S("risk_aspiration", "Risk of Aspiration Discussed", ["Discussed", "Not discussed", "Not applicable"]),
      S("risk_allergy", "Risk of Allergic Reaction Discussed", ["Discussed", "Not discussed", "Not applicable"]),
      S("risk_dental", "Risk of Dental or Lip Injury Discussed", ["Discussed", "Not discussed", "Not applicable"]),
      S("risk_sore_throat", "Risk of Sore Throat or Hoarseness Discussed", ["Discussed", "Not discussed", "Not applicable"]),
      S("risk_ponv", "Risk of Postoperative Nausea and Vomiting Discussed", ["Discussed", "Not discussed", "Not applicable"]),
      S("risk_nerve_injury", "Risk of Nerve Injury Discussed", ["Discussed", "Not discussed", "Not applicable"]),
      S("risk_regional_failure", "Risk of Block Failure or Incomplete Block Discussed", [
        "Discussed",
        "Not discussed",
        "Not applicable",
      ]),
      S("risk_pdp_headache", "Risk of Post-Dural Puncture Headache Discussed", [
        "Discussed",
        "Not discussed",
        "Not applicable",
      ]),
      S("risk_neuraxial_haematoma", "Risk of Neuraxial Haematoma or Infection Discussed", [
        "Discussed",
        "Not discussed",
        "Not applicable",
      ]),
      S("risk_last", "Risk of Local Anesthetic Systemic Toxicity Discussed", [
        "Discussed",
        "Not discussed",
        "Not applicable",
      ]),
      S("risk_cardiac_events", "Risk of Cardiac or Respiratory Complications Discussed", [
        "Discussed",
        "Not discussed",
        "Not applicable",
      ]),
      S("risk_cardiac_mi", "Risk of Heart Attack or Stroke Discussed", [
        "Discussed",
        "Not discussed",
        "Not applicable",
      ]),
      S("risk_mh", "Risk of Malignant Hyperthermia or Anesthetic Drug Reaction Discussed Where Relevant", [
        "Discussed",
        "Not discussed",
        "Not applicable",
      ]),
      S("risk_icu_death", "Risk of Unplanned Critical Care Admission or Death Discussed Where Relevant", [
        "Discussed",
        "Not discussed",
        "Not applicable",
      ]),
      T("risks_discussed", "Risks Discussed — in the words used with the patient, including likelihood"),
      T("additional_risks", "Patient-Specific Risks Discussed — driven by their conditions"),
    ]),
    ...sec("Alternatives & Questions", [
      T("alternatives", "Reasonable Alternatives Discussed — other techniques, including doing nothing"),
      T("alternatives_consequences", "Consequences of Declining Explained"),
      T("patient_questions", "Questions Asked by the Patient and the Answers Given"),
      S("patient_agreement", "Patient Agreement", ["Agreed", "Declined", "Deferred", "Agreed with conditions — documented"]),
    ]),
    ...sec("Capacity & Communication", [
      S("capacity", "Decision-Making Capacity", [
        "Assessed — has capacity",
        "Assessed — lacks capacity, best-interests decision documented",
        "Not formally assessed",
      ]),
      S("interpreter_used", "Interpreter", [
        "Not required",
        "Used — language recorded",
        "Required but unavailable",
      ]),
      T("consent_form_reference", "Consent Form Reference — form type, language, witness"),
      S("consent_withdrawn", "Consent Withdrawn or Changed Later", ["No", "Yes — documented", "Not applicable"]),
      I("consent_taken_by", "Consent Discussion Held By"),
      S("clinician_confirmation", "Confirmed by the Responsible Anesthesiologist", [
        "Yes — discussion held personally",
        "Held by another member of the anesthesia team and confirmed",
        "Not confirmed",
      ]),
    ]),
  ],
};