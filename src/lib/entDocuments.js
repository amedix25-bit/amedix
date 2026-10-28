// ENT (Otolaryngology) clinical document catalogue.
//
// The nine note types the ENT department already used are kept exactly as they
// were — same keys (ent_consultation, ent_followup, ent_procedure_note,
// ent_operative_note, ent_preop_assessment, ent_postop_note,
// ent_audiology_report, ent_discharge_summary, ent_referral) and same labels.
// Only their clinical content is deepened. Five further note types the
// department documents but the catalogue did not offer are added alongside
// them; nothing is duplicated:
//   ent_otology        — ear and otology
//   ent_rhinosinusitis — nose and paranasal sinuses
//   ent_laryngology    — throat, larynx and voice
//   ent_neck_mass      — head and neck mass
//   ent_paediatric     — paediatric ENT
//
// Content follows the documentation elements set out by the American Academy
// of Otolaryngology–Head and Neck Surgery (AAO-HNS) clinical practice
// guidelines registered in src/lib/entReferences.js: the symptom duration and
// severity each guideline uses to define its population, the findings each
// guideline requires, the explicit distinction between a symptom code and an
// established diagnosis, and safety-netting for airway and bleeding risk. No
// guideline ever substitutes for the clinician's assessment.
//
// Field shape matches the rest of the clinical system (key, label, type,
// options, section, required) plus `showIf`. Nothing is defaulted to normal:
// an unanswered finding stays unanswered. The single field whose label
// contains "Examination" is converted by the shared note policy into the
// structured ENT examination (src/lib/examinations/types/ent.js), so no
// free-text examination duplicates it.

import { entCatalogFor } from "@/lib/entIcd11";

const I = (key, label, x = {}) => ({ key, label, type: "input", ...x });
const N = (key, label, x = {}) => ({ key, label, type: "number", ...x });
const T = (key, label, x = {}) => ({ key, label, type: "textarea", ...x });
const S = (key, label, options, x = {}) => ({ key, label, type: "select", options, ...x });

const R = { required: true };
const when = (key, ...values) => ({ showIf: { key, in: values } });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

const LATERALITY = ["Right", "Left", "Bilateral", "Midline", "Not applicable"];
const URGENCY = ["Routine", "Urgent", "Emergency"];
const IMPACT = ["No impact", "Mild — occasional", "Moderate — daily activity affected", "Severe — activity stopped", "Not assessed"];
const RED_FLAG_OPTIONS = [
  "None identified",
  "Airway compromise / stridor",
  "Uncontrolled bleeding",
  "Rapidly progressive swelling",
  "Cranial nerve deficit",
  "Severe systemic illness",
  "Other — see detail",
];

const diagnosisField = (domains, label = "Diagnoses (ICD-11) — role, status and clinical basis") => ({
  key: "icd11_diagnoses",
  label,
  type: "icd11_diagnoses",
  catalog: entCatalogFor(domains),
});

const laterality = (options = LATERALITY) => S("laterality", "Laterality", options);
const side = (key, label) => S(key, label, LATERALITY);
const symptomDuration = () =>
  S("symptom_duration", "Duration of Symptoms", ["< 48 hours", "2–7 days", "< 4 weeks", "4–12 weeks", "> 12 weeks", "Unknown"]);
const impact = () => S("symptom_impact", "Impact on Daily Activity", IMPACT);
const redFlagField = () => S("red_flags", "Red Flags Present", RED_FLAG_OPTIONS);
const redFlagDetail = () =>
  T("red_flag_detail", "Red Flag — Detail and Action Taken", when("red_flags", "Airway compromise / stridor", "Uncontrolled bleeding", "Rapidly progressive swelling", "Cranial nerve deficit", "Severe systemic illness", "Other — see detail"));

// ---- Reused blocks -------------------------------------------------------
const entBackground = () =>
  sec("ENT Background", [
    T("ent_history", "ENT History — previous episodes, surgery, trauma, radiotherapy"),
    T("previous_ent_treatment", "Previous ENT Treatment & Response"),
    T("comorbidities", "Relevant Comorbidities and Current Control"),
    S("anticoagulants", "Anticoagulant / Antiplatelet Therapy", ["None", "Antiplatelet", "Anticoagulant", "Combination", "Unknown"]),
    T("exposures", "Smoking, Alcohol, Occupational & Allergen Exposure"),
    T("allergies", "Allergies & Previous Reactions"),
    T("focused_ros", "Focused Review of Systems"),
  ]);

const assessmentBlock = (domains) =>
  sec("Assessment & Clinical Reasoning", [
    diagnosisField(domains),
    T("differential", "Differential Diagnosis — and the evidence that supports or excludes each"),
    T("assessment", "Assessment — the single clinical problem and its severity"),
    T("tests_requested", "Tests & Studies Requested — what each will answer", R),
    T("results_awaited", "Results Awaited — who will review them"),
  ]);

const managementBlock = (extra = []) =>
  sec("Management & Follow-Up", [
    T("management", "Management — the plan decided with the patient", R),
    ...extra,
    T("counselling", "Counselling & Shared Decision-Making — options, benefits and risks discussed"),
    T("safety_net", "Safety-Net Advice & Warning Signs Given", R),
    I("review_interval", "Review Interval / Next Assessment"),
  ]);

const anaestheticBlock = () =>
  sec("Airway & Anaesthetic Considerations", [
    S("airway_assessment", "Airway Assessment", ["Easy — no concerns", "Anticipated difficult airway", "Compromised airway at rest", "Compromised airway on exertion only", "Not assessed"], R),
    T("airway_detail", "Airway Findings & Plan — mouth opening, dentition, neck movement, previous airway difficulty", when("airway_assessment", "Anticipated difficult airway", "Compromised airway at rest", "Compromised airway on exertion only")),
    S("anaesthetic_approach", "Anaesthetic Approach", ["General with airway tube", "General with laryngeal mask", "Local infiltration", "Topical", "Sedation", "To be decided by anaesthetist"]),
    T("anaesthetic_notes", "Anaesthetic Notes & Communication with Anaesthetist"),
  ]);

// ---- 1. Consultation -----------------------------------------------------
const consultation = {
  key: "ent_consultation",
  label: "ENT Consultation",
  specialty: "ent",
  fields: [
    ...sec("Presentation", [
      I("referred_by", "Referred By — clinician or service, or self"),
      T("reason_for_attendance", "Reason for Attendance"),
      S("urgency", "Urgency", URGENCY, R),
      laterality(),
    ]),
    ...sec("History of Present Illness", [
      T("chief_complaint", "Chief Complaint", R),
      T("hpi", "History of Present Illness", R),
      symptomDuration(),
      S("onset", "Onset", ["Sudden", "Gradual", "Progressive", "Intermittent", "Unknown"]),
      S("course", "Course Since Onset", ["Improving", "Stable", "Worsening", "Fluctuating", "Not assessed"]),
      S("severity", "Severity", ["Mild", "Moderate", "Severe", "Not assessed"]),
      impact(),
      T("associated_symptoms", "Associated Symptoms — hearing loss, otorrhoea, nasal obstruction, dysphagia, hoarseness, neck swelling, weight loss"),
      T("pertinent_negatives", "Relevant Negative Findings"),
      redFlagField(),
      redFlagDetail(),
    ]),
    ...entBackground(),
    ...sec("Examination", [
      T("exam_findings", "Examination — Ears / Nose / Throat / Neck"),
    ]),
    ...assessmentBlock(["ear", "nose", "throat", "neck", "symptom"]),
    ...managementBlock(),
  ],
};

// ---- 2. Follow-up --------------------------------------------------------
const followup = {
  key: "ent_followup",
  label: "ENT Follow-Up",
  specialty: "ent",
  fields: [
    ...sec("Interval Course", [
      T("interval_history", "Interval History Since the Last Review", R),
      T("treatment_received", "Treatment Received Since Last Review"),
      S("adherence", "Adherence to the Agreed Treatment", ["Fully", "Partially", "Not taken", "Not applicable", "Unknown"]),
      S("symptom_course", "Symptom Course", ["Resolved", "Improving", "Unchanged", "Worse", "Intermittent", "Not assessed"], R),
      T("new_concerns", "New Concerns or New Symptoms"),
      redFlagField(),
      redFlagDetail(),
    ]),
    ...sec("Examination", [
      T("exam_findings", "Examination Findings — Ears / Nose / Throat / Neck"),
    ]),
    ...sec("Reassessment", [
      T("results_reviewed", "Results Reviewed Since Last Review — with their effect on the diagnosis"),
      diagnosisField(["ear", "nose", "throat", "neck", "symptom"], "Diagnoses (ICD-11) — status at this review"),
      T("assessment", "Updated Assessment", R),
      T("treatment_changes", "Treatment Changes and the Reason for Each"),
      T("co_management", "Co-Management & Services Involved — audiology, speech and language therapy, oncology"),
    ]),
    ...managementBlock([T("ongoing_surveillance", "Ongoing Surveillance — what is being watched, and how often")]),
  ],
};

// ---- 3. Procedure note ---------------------------------------------------
const procedureNote = {
  key: "ent_procedure_note",
  label: "ENT Procedure Note",
  specialty: "ent",
  fields: [
    ...sec("Procedure", [
      I("procedure", "Procedure", R),
      T("indication", "Indication", R),
      side("procedure_side", "Side / Laterality"),
      S("anaesthesia", "Anaesthesia / Agent", ["None", "Topical", "Local infiltration", "Sedation", "General"]),
      S("setting", "Setting", ["Clinic / office", "Day-case theatre", "Inpatient theatre", "Ward", "Emergency department"]),
      T("consent", "Consent & Material Risks Discussed"),
    ]),
    ...sec("Findings & Technique", [
      T("technique", "Technique — step by step, including instrument and energy used"),
      T("findings", "Findings at the Time of the Procedure"),
      T("specimens", "Specimens Taken — site, container, tests requested"),
      S("histology_review", "Histology Review Arranged", ["Not applicable", "Requested — result awaited", "Discussed with pathologist"]),
      T("packs", "Packs / Dressings Placed and Removal Plan"),
      T("complications", "Complications & How They Were Managed"),
      T("estimated_blood_loss", "Estimated Blood Loss"),
      T("patient_condition", "Patient Condition at Completion"),
    ]),
    ...sec("Aftercare", [
      T("aftercare", "Aftercare Instructions and Warning Signs Given", R),
      T("analgesia", "Analgesia Provided — agent, dose and maximum in 24 hours"),
      I("review_interval", "Review / Pack Removal Interval"),
    ]),
  ],
};

// ---- 4. Operative note ---------------------------------------------------
const operativeNote = {
  key: "ent_operative_note",
  label: "Operative Note (ENT)",
  specialty: "ent",
  fields: [
    ...sec("Procedure Identification", [
      T("preop_diagnosis", "Pre-Operative Diagnosis", R),
      T("postop_diagnosis", "Post-Operative Diagnosis"),
      I("procedure", "Procedure Performed", R),
      side("operative_side", "Side / Laterality"),
      I("surgeon", "Surgeon"),
      T("assistants", "Assistants"),
      S("anesthesia", "Anaesthesia", ["General", "Regional", "Local", "Sedation", "Other"]),
      T("intraoperative_anaesthesia_notes", "Intraoperative Anaesthesia Notes — airway used, throat pack, extubation"),
    ]),
    ...sec("Operative Findings", [
      T("indication", "Indication"),
      T("findings", "Operative Findings", R),
      S("microscope_endoscope", "Optical Assistance", ["None", "Operating microscope", "Rigid endoscope", "Both", "Image guidance"]),
      S("nerve_monitoring", "Nerve Monitoring", ["Not used", "Facial nerve", "Recurrent laryngeal nerve", "Both", "Other"]),
      T("frozen_section", "Frozen Section / Intraoperative Consultation — result and the decision made"),
    ]),
    ...sec("Technique", [
      T("procedure_details", "Procedure Details — incision, approach, resection, reconstruction", R),
      T("implants", "Implants / Grafts / Prosthesis Used — type, size, batch"),
      T("specimens", "Specimens — site, orientation, container, tests requested"),
      T("estimated_blood_loss", "Estimated Blood Loss / Transfusion"),
      T("counts", "Instrument, Swab and Pack Counts"),
      T("complications", "Complications & How They Were Managed"),
    ]),
    ...sec("Closure & Post-Operative Instructions", [
      T("closure", "Closure, Packs and Drains — with removal instructions"),
      T("postop_plan", "Post-Operative Instructions — monitoring, analgesia, antibiotics, activity", R),
      T("safety_net", "Safety-Net Advice & Who to Contact Given"),
      I("review_interval", "Review / Pack Removal Interval"),
    ]),
  ],
};

// ---- 5. Pre-operative assessment ----------------------------------------
const preopAssessment = {
  key: "ent_preop_assessment",
  label: "Pre-Operative Assessment (ENT)",
  specialty: "ent",
  fields: [
    ...sec("Planned Procedure", [
      I("planned_procedure", "Planned Procedure", R),
      T("indication", "Indication for Surgery", R),
      side("planned_side", "Planned Side / Laterality"),
      T("consent", "Consent — procedure, alternatives, material risks and benefits discussed"),
      T("patient_expectations", "Patient Expectations and Goals of Surgery"),
    ]),
    ...anaestheticBlock(),
    ...sec("Medical Optimisation", [
      T("comorbidities", "Comorbidities and Current Control", R),
      T("medications", "Medication Changes Before Surgery — which were held, continued or bridged"),
      S("anticoagulation_plan", "Anticoagulant / Antiplatelet Plan", ["Not applicable", "Continued", "Held — plan documented", "Bridged", "Discussed with haematology / cardiology"]),
      T("tests_reviewed", "Tests Reviewed — bloods, ECG, cross-sectional studies, audiology"),
      T("anaemia_plan", "Anaemia / Transfusion Plan"),
      S("infection_screen", "Infection Screen Before Surgery", ["Not required", "MRSA screen — negative", "MRSA screen — positive, decolonised", "Other — see detail"]),
      S("clearance", "Anaesthetic Clearance", ["Cleared", "Cleared with Conditions", "Not Cleared", "Pending"], R),
      T("clearance_conditions", "Clearance Conditions", when("clearance", "Cleared with Conditions", "Not Cleared")),
      T("preop_instructions", "Pre-Operative Instructions — fasting, medication, admission, escort"),
    ]),
  ],
};

// ---- 6. Post-operative note ---------------------------------------------
const postopNote = {
  key: "ent_postop_note",
  label: "Post-Operative Note (ENT)",
  specialty: "ent",
  fields: [
    ...sec("Post-Operative Course", [
      I("procedure_date", "Procedure Date"),
      I("postop_day", "Post-Operative Day", R),
      T("vitals", "Vital Signs"),
      S("pain_score", "Pain Score at Rest", ["0 — none", "1–3 — mild", "4–6 — moderate", "7–9 — severe", "10 — worst possible"], R),
      T("pain", "Pain Control — agents, dose, effect, and what is prescribed for home"),
      T("nausea", "Nausea, Vomiting and Oral Intake"),
      T("mobility", "Mobility and Discharge Readiness"),
    ]),
    ...sec("Airway & Wound", [
      T("airway_status", "Airway Status", R),
      T("wound", "Wound / Surgical Site"),
      T("packing_status", "Nasal Packing / Packs Status — with removal plan"),
      T("drains", "Drains and Output"),
      T("complications", "Complications — bleeding, infection, haematoma, airway concern"),
      redFlagField(),
      redFlagDetail(),
    ]),
    ...sec("Prevention & Disposition", [
      S("thromboprophylaxis", "Venous Thromboembolism Prophylaxis", ["Not indicated", "Mechanical only", "Pharmacological — prescribed", "Held — reason documented"]),
      T("analgesia_plan", "Analgesia Prescribed at Discharge — agent, dose, maximum in 24 hours"),
      T("antibiotics", "Antibiotics — indication, agent, duration"),
      T("disposition", "Disposition", ["Continue inpatient care", "Discharge today", "Discharge with day-case review", "Escalated to higher care"]),
      T("discharge_instructions", "Discharge Instructions and Warning Signs Given"),
      I("review_interval", "Review / Pack Removal Interval"),
    ]),
  ],
};

// ---- 7. Audiology / diagnostic report ----------------------------------
const audiologyReport = {
  key: "ent_audiology_report",
  label: "Audiology / Diagnostic Report",
  specialty: "ent",
  fields: [
    ...sec("Test Performed", [
      S("test_type", "Test Type", ["Pure Tone Audiometry", "Tympanometry", "OAE", "ABR", "Speech Audiometry", "Nasal Endoscopy", "Other"], R),
      S("side_tested", "Side Tested", ["Bilateral", "Right", "Left", "Not applicable"]),
      T("indication", "Indication"),
      T("test_conditions", "Test Conditions & Reliability — calibration, masking, patient cooperation"),
    ]),
    ...sec("Results", [
      T("results_right", "Results — Right"),
      T("results_left", "Results — Left"),
      N("pta_right", "Pure Tone Average — Right (dB HL)"),
      N("pta_left", "Pure Tone Average — Left (dB HL)"),
      S("hearing_loss_type", "Hearing Loss Type", ["None", "Conductive", "Sensorineural", "Mixed", "Not assessable"]),
      S("hearing_loss_grade", "Hearing Loss Grade", ["Normal", "Mild", "Moderate", "Moderately severe", "Severe", "Profound", "Not graded"]),
      S("tympanogram_right", "Tympanogram — Right", ["Type A", "Type B", "Type C", "Not performed"]),
      S("tympanogram_left", "Tympanogram — Left", ["Type A", "Type B", "Type C", "Not performed"]),
      T("vestibular_results", "Vestibular Assessment — positional testing, head impulse, VEMP, caloric"),
    ]),
    ...sec("Interpretation", [
      T("interpretation", "Interpretation — what the results show and what they do not", R),
      diagnosisField(["ear", "symptom"], "Diagnosis Supported by These Results (ICD-11)"),
      T("recommendations", "Recommendations — further testing, amplification, review interval"),
      S("results_communicated", "Results Communicated To", ["Not yet", "Patient", "Referring clinician", "Both"], R),
    ]),
  ],
};

// ---- 8. Discharge summary ----------------------------------------------
const dischargeSummary = {
  key: "ent_discharge_summary",
  label: "Discharge Summary (ENT)",
  specialty: "ent",
  fields: [
    ...sec("Admission & Course", [
      T("preop_diagnosis", "Presenting / Pre-Operative Diagnosis", R),
      T("postop_diagnosis", "Final Diagnosis"),
      T("procedure", "Procedure Performed"),
      T("hospital_course", "Hospital Course — including complications and how they were managed", R),
      T("results_summary", "Key Results and Their Significance"),
      S("histology_status", "Histology Result", ["Not applicable", "Awaited", "Benign", "Malignant", "Inconclusive"]),
      T("histology_detail", "Histology Detail and Discussion with the Patient", when("histology_status", "Benign", "Malignant", "Inconclusive")),
    ]),
    ...sec("Discharge Treatment & Instructions", [
      T("discharge_medications", "Medication Changes at Discharge — started, stopped and why"),
      T("wound_care", "Wound, Pack and Stoma Care"),
      T("activity_advice", "Activity, Work and Water Precautions"),
      T("warning_signs", "Warning Signs and Who to Contact", R),
      T("follow_up", "Follow-Up — clinic, pack removal, audiology, histology discussion", R),
      T("copy_to", "Information Copied To", ["Patient", "Referring clinician", "General practitioner", "Other — see detail"]),
    ]),
  ],
};

// ---- 9. Referral --------------------------------------------------------
const referral = {
  key: "ent_referral",
  label: "ENT Referral",
  specialty: "ent",
  fields: [
    ...sec("Referral Question", [
      I("referral_to", "Referred To"),
      T("reason", "Reason for Referral", R),
      T("clinical_question", "The Clinical Question the Receiving Team Must Answer", R),
      S("urgency", "Urgency", URGENCY, R),
      S("laterality", "Laterality", LATERALITY),
    ]),
    ...sec("Clinical Summary", [
      T("relevant_history", "Relevant History", R),
      T("exam_summary", "Clinical Findings at Referral"),
      T("tests_completed", "Tests Completed and Results", R),
      T("treatment_tried", "Treatment Already Tried and the Response"),
      S("red_flags", "Red Flags Present", RED_FLAG_OPTIONS),
      T("patient_expectations", "What the Patient Has Been Told and Expects"),
    ]),
  ],
};

// ---- 10. Otology --------------------------------------------------------
const otology = {
  key: "ent_otology",
  label: "Ear & Otology Note",
  specialty: "ent",
  fields: [
    ...sec("Presentation", [
      T("chief_complaint", "Chief Complaint", R),
      side("affected_ear", "Affected Ear"),
      symptomDuration(),
      S("onset", "Onset", ["Sudden", "Gradual", "Progressive", "Intermittent", "Unknown"]),
      S("severity", "Severity", ["Mild", "Moderate", "Severe", "Not assessed"]),
      impact(),
    ]),
    ...sec("Otological History", [
      S("otalgia", "Otalgia", ["Absent", "Present — dull", "Present — sharp", "Present — throbbing", "Not assessed"]),
      S("otorrhoea", "Otorrhoea", ["Absent", "Clear", "Mucoid", "Purulent", "Blood-stained"]),
      S("hearing_loss", "Hearing Loss", ["Not reported", "Reported — right", "Reported — left", "Reported — bilateral", "Reported — fluctuating"]),
      S("tinnitus", "Tinnitus", ["Absent", "Present — intermittent", "Present — constant", "Present — pulsatile"]),
      S("vertigo", "Vertigo or Imbalance", ["Absent", "Present — triggered by position change", "Present — spontaneous episodes", "Present — constant imbalance", "Not assessed"]),
      S("aural_fullness", "Aural Fullness or Pressure", ["Absent", "Present", "Not assessed"]),
      S("facial_weakness", "Facial Weakness", ["Absent", "Present — new", "Present — established", "Not assessed"]),
      T("noise_exposure", "Noise Exposure & Ototoxic Medication Exposure"),
      T("previous_ear_surgery", "Previous Ear Surgery or Instrumentation"),
      T("associated_symptoms", "Associated Symptoms — fever, headache, neck stiffness, weight loss, dysphagia"),
    ]),
    ...sec("Examination", [
      T("exam_findings", "Examination — Ear, Nose, Throat & Neck"),
    ]),
    ...sec("Hearing & Vestibular Assessment", [
      S("tuning_fork_summary", "Tuning Fork Pattern", ["Not performed", "Rinne positive both sides", "Rinne negative — right", "Rinne negative — left", "Weber lateralised right", "Weber lateralised left"]),
      S("audiometry_available", "Audiometry Available at This Visit", ["Not available", "Reviewed — see audiology report", "Requested"]),
      T("audiometry_summary", "Audiometry Summary — pure tone average, air–bone gap, speech discrimination", when("audiometry_available", "Reviewed — see audiology report")),
      S("positional_testing", "Positional Testing", ["Not performed", "Negative", "Positive — posterior canal", "Positive — horizontal canal", "Not tolerated"]),
      S("facial_nerve_grade", "Facial Nerve Function (House-Brackmann)", ["I — normal", "II — slight", "III — moderate", "IV — moderately severe", "V — severe", "VI — total", "Not assessed"]),
      T("vestibular_assessment", "Vestibular Assessment — head impulse, nystagmus, gait, Romberg"),
    ]),
    ...assessmentBlock(["ear", "symptom"]),
    ...managementBlock([
      T("ear_care", "Ear Care, Drops and Dressing Instructions"),
      S("surgery_discussion", "Surgical Option Discussed", ["Not indicated", "Discussed — patient considering", "Listed for surgery", "Declined by patient"]),
    ]),
  ],
};

// ---- 11. Rhinosinusitis / rhinology ------------------------------------
const rhinosinusitis = {
  key: "ent_rhinosinusitis",
  label: "Nose & Sinus Note",
  specialty: "ent",
  fields: [
    ...sec("Presentation", [
      T("chief_complaint", "Chief Complaint", R),
      laterality(["Bilateral", "Right", "Left", "Midline", "Not applicable"]),
      symptomDuration(),
      S("pattern", "Pattern", ["First episode", "Recurrent — separate episodes", "Persistent", "Post-operative", "Unknown"], R),
      S("severity", "Severity", ["Mild", "Moderate", "Severe", "Not assessed"]),
      impact(),
    ]),
    ...sec("Rhinological History", [
      S("nasal_obstruction", "Nasal Obstruction", ["Absent", "Unilateral", "Bilateral — intermittent", "Bilateral — constant"]),
      S("discharge", "Nasal Discharge", ["Absent", "Clear", "Mucopurulent", "Purulent", "Blood-stained"]),
      S("facial_pain", "Facial Pain or Pressure", ["Absent", "Present — mild", "Present — moderate", "Present — severe"]),
      S("smell", "Sense of Smell", ["Normal", "Reduced", "Lost", "Distorted", "Not assessed"]),
      S("allergic_pattern", "Allergic Pattern", ["None", "Seasonal", "Perennial", "Both", "Unknown"]),
      S("epistaxis", "Epistaxis", ["Absent", "Occasional", "Frequent", "Severe or prolonged"]),
      T("epistaxis_detail", "Epistaxis — frequency, duration, volume, first aid used, previous cautery or packing", when("epistaxis", "Occasional", "Frequent", "Severe or prolonged")),
      S("bleeding_risk", "Bleeding Risk Factors", ["None", "Anticoagulant / antiplatelet", "Known coagulopathy", "Both", "Unknown"]),
      T("asthma_nsaid", "Asthma, Aspirin / NSAID Sensitivity and Nasal Polyps"),
      T("previous_treatment", "Previous Medical and Surgical Treatment & Response"),
    ]),
    ...sec("Examination", [
      T("exam_findings", "Examination — Nose, Sinuses, Throat & Neck"),
      S("endoscopy", "Nasal Endoscopy", ["Not performed", "Performed — normal", "Performed — polyps", "Performed — purulence", "Performed — mass", "Performed — adhesions"]),
      T("endoscopy_detail", "Endoscopy Findings — where the disease sits and what it touches", when("endoscopy", "Performed — polyps", "Performed — purulence", "Performed — mass", "Performed — adhesions")),
    ]),
    ...sec("Objective Assessment", [
      S("radiology_reviewed", "Cross-Sectional Studies Reviewed", ["None available", "Plain radiographs", "CT sinuses", "MRI", "Both CT and MRI"]),
      T("radiology_detail", "Radiology Findings — which sinuses, extent, and what it changes", when("radiology_reviewed", "CT sinuses", "MRI", "Both CT and MRI")),
      T("allergy_testing", "Allergy Testing Reviewed"),
      T("comorbidities", "Relevant Comorbidities — asthma, bronchiectasis, immunodeficiency, cystic fibrosis"),
    ]),
    ...assessmentBlock(["nose", "symptom"]),
    ...managementBlock([
      T("medical_therapy", "Medical Therapy — agent, dose, duration and what will show it worked"),
      S("surgery_discussion", "Surgical Option Discussed", ["Not indicated", "Discussed — patient considering", "Listed for surgery", "Declined by patient"]),
    ]),
  ],
};

// ---- 12. Laryngology / voice ------------------------------------------
const laryngology = {
  key: "ent_laryngology",
  label: "Throat, Larynx & Voice Note",
  specialty: "ent",
  fields: [
    ...sec("Presentation", [
      T("chief_complaint", "Chief Complaint", R),
      symptomDuration(),
      S("onset", "Onset", ["Sudden", "Gradual", "Progressive", "Intermittent", "Unknown"]),
      S("severity", "Severity", ["Mild", "Moderate", "Severe", "Not assessed"]),
      S("voice_use", "Vocal Demand", ["Low", "Professional voice user", "Heavy voice use", "Not applicable"]),
    ]),
    ...sec("Voice, Swallow & Airway", [
      S("hoarseness", "Voice Change / Hoarseness", ["Absent", "Intermittent", "Constant", "Progressive"]),
      S("dysphagia", "Dysphagia", ["Absent", "Solids only", "Liquids only", "Solids and liquids", "Not assessed"]),
      S("odynophagia", "Odynophagia", ["Absent", "Present"]),
      S("globus", "Globus Sensation", ["Absent", "Present — intermittent", "Present — constant"]),
      S("cough", "Cough", ["Absent", "Dry", "Productive", "Post-prandial"]),
      S("aspiration", "Aspiration or Choking Episodes", ["Absent", "Occasional", "Frequent", "With every meal"]),
      S("airway_symptoms", "Airway Symptoms", ["Absent", "Exertional stridor", "Stridor at rest", "Voice change with breathlessness"], R),
      T("airway_detail", "Airway Symptoms — timing, triggers and what has been done", when("airway_symptoms", "Exertional stridor", "Stridor at rest", "Voice change with breathlessness")),
      T("reflux_symptoms", "Reflux Symptoms & Treatment Tried"),
      T("risk_factors", "Smoking, Alcohol, Occupational Voice Exposure and Previous Radiotherapy"),
      redFlagField(),
    ]),
    ...sec("Examination", [
      T("exam_findings", "Examination — Oral Cavity, Pharynx, Larynx & Neck"),
      S("laryngoscopy", "Laryngeal View (endoscopy)", ["Not performed", "Indirect laryngoscopy — normal", "Flexible endoscopy — normal", "Flexible endoscopy — abnormal", "Not tolerated"]),
      T("laryngoscopy_detail", "Laryngeal Findings — mobility of both cords, mucosa, lesion site and size", when("laryngoscopy", "Indirect laryngoscopy — normal", "Flexible endoscopy — normal", "Flexible endoscopy — abnormal")),
      S("neck_palpation", "Neck Palpation Findings", ["Normal", "Nodes palpable", "Thyroid abnormality", "Laryngeal crepitus lost"]),
    ]),
    ...sec("Assessment", [
      T("voice_assessment", "Voice Assessment — perceptual rating, maximum phonation time, therapy status"),
      T("swallow_assessment", "Swallow Assessment — bedside findings, need for instrumental assessment"),
      diagnosisField(["throat", "symptom"]),
      T("differential", "Differential Diagnosis — and the evidence that supports or excludes each"),
      T("assessment", "Assessment", R),
      T("tests_requested", "Tests & Studies Requested — what each will answer", R),
    ]),
    ...managementBlock([
      T("voice_advice", "Voice Care, Rest and Therapy Plan"),
      S("co_management", "Co-Management Arranged", ["None", "Speech and language therapy", "Gastroenterology", "Oncology / multidisciplinary team", "Respiratory", "Other — see detail"]),
    ]),
  ],
};

// ---- 13. Head and neck mass -------------------------------------------
const neckMass = {
  key: "ent_neck_mass",
  label: "Head & Neck Mass Note",
  specialty: "ent",
  fields: [
    ...sec("Presentation", [
      T("chief_complaint", "Chief Complaint", R),
      T("mass_location", "Mass — Anatomical Location and Boundaries", R),
      side("mass_side", "Side"),
      S("duration", "Duration", ["< 2 weeks", "2–6 weeks", "6 weeks – 3 months", "> 3 months", "Unknown"], R),
      S("size_change", "Size Change", ["Stable", "Increasing", "Decreasing", "Fluctuating"]),
      T("mass_character", "Mass — Size, Consistency, Tenderness and Mobility on Assessment", R),
      redFlagField(),
      redFlagDetail(),
    ]),
    ...sec("Associated History", [
      S("pain", "Pain", ["Absent", "Present", "Present — with swallowing", "Present — radiating to the ear"]),
      S("hoarseness", "Voice Change", ["Absent", "Present"]),
      S("dysphagia", "Dysphagia", ["Absent", "Solids only", "Solids and liquids", "Not assessed"]),
      S("weight_loss", "Unintentional Weight Loss", ["None", "Less than 5% body weight", "5–10% body weight", "More than 10% body weight", "Not assessed"]),
      S("fever", "Fever", ["Absent", "Present"]),
      T("dental_infection", "Dental Infection, Oral Sepsis or Recent Upper Respiratory Infection"),
      T("risk_factors", "Smoking, Alcohol, Betel / Tobacco Use and Previous Radiotherapy"),
      T("previous_cancer", "Previous Cancer and Its Treatment"),
      T("travel_endemic", "Travel, TB Contact or Other Endemic Exposure"),
    ]),
    ...sec("Examination", [
      T("exam_findings", "Examination — Head, Neck, Oral Cavity, Pharynx, Larynx & Cranial Nerves"),
      S("cranial_nerves", "Cranial Nerves", ["Normal", "Lower cranial nerve deficit", "Facial nerve deficit", "Multiple deficits", "Not assessed"], R),
      T("cranial_nerve_detail", "Cranial Nerve Deficit — which nerves and how documented", when("cranial_nerves", "Lower cranial nerve deficit", "Facial nerve deficit", "Multiple deficits")),
      T("oral_pharynx_exam", "Oral Cavity and Oropharynx Findings — including the tonsils and tongue base"),
      S("endoscopy_done", "Flexible Nasendoscopy", ["Not performed", "Performed — no primary site found", "Performed — primary site seen", "Not tolerated"]),
      T("endoscopy_detail", "Nasendoscopy Findings — site, extent, airway", when("endoscopy_done", "Performed — primary site seen")),
    ]),
    ...sec("Assessment & Urgency", [
      S("provisional_nature", "Provisional Nature of the Mass", ["Reactive / infective", "Benign neoplasm suspected", "Malignancy cannot be excluded", "Indeterminate", "Not assessed"], R),
      diagnosisField(["neck", "throat", "symptom"]),
      T("differential", "Differential Diagnosis — and the evidence that supports or excludes each", R),
      T("assessment", "Assessment", R),
      S("pathway", "Pathway", ["Routine outpatient work-up", "Two-week / urgent suspected cancer pathway", "Same-day emergency assessment", "Not applicable"], R),
      T("tests_requested", "Tests & Studies Requested — cross-sectional studies, bloods, endoscopy, cytology", R),
      S("sample_plan", "Tissue Sampling", ["Not yet indicated", "Ultrasound-guided fine needle aspiration", "Core biopsy", "Examination under anaesthesia with biopsy", "Discussed with oncology"]),
      T("mdt_referral", "Multidisciplinary Team Discussion — when and with what question"),
    ]),
    ...managementBlock([T("result_review", "Result Review and Follow-Up Owner")]),
  ],
};

// ---- 14. Paediatric ENT ------------------------------------------------
const paediatric = {
  key: "ent_paediatric",
  label: "Paediatric ENT Note",
  specialty: "ent",
  fields: [
    ...sec("Presentation & Caregiver History", [
      I("age", "Age"),
      N("weight", "Weight (kg)"),
      T("caregiver_concerns", "Caregiver Concerns in Their Own Words", R),
      T("birth_history", "Birth and Neonatal History — gestation, ventilation, syndromic features"),
      T("development", "Development — motor, speech and language milestones, school progress"),
      S("feeding", "Feeding", ["Normal", "Difficulty — see detail", "Nasogastric or gastrostomy feeding", "Not applicable"]),
      T("feeding_detail", "Feeding Difficulty — coughing, choking, nasal regurgitation, length of feeds", when("feeding", "Difficulty — see detail", "Nasogastric or gastrostomy feeding")),
      T("immunisation", "Immunisation Status"),
    ]),
    ...sec("Paediatric ENT History", [
      T("chief_complaint", "Chief Complaint", R),
      symptomDuration(),
      S("recurrent_infections", "Recurrent Infections", ["No", "Yes — documented frequency below", "Not assessed"]),
      T("infection_frequency", "Infection Frequency and Antibiotic Courses in the Last Year", when("recurrent_infections", "Yes — documented frequency below")),
      S("snoring", "Snoring", ["No", "Occasional", "Most nights", "Every night"]),
      S("apnoea", "Witnessed Apnoea or Pauses in Breathing", ["No", "Yes — described by caregiver", "Unknown"], R),
      S("sleep_disruption", "Sleep-Disordered Breathing Symptoms", ["None", "Mouth breathing", "Restless sleep", "Daytime sleepiness", "Both mouth breathing and restless sleep"]),
      S("hearing_concern", "Hearing or Speech Concern", ["None", "Hearing concern", "Speech delay", "Both"]),
      S("nasal_symptoms", "Nasal Symptoms", ["None", "Obstruction", "Discharge", "Both"]),
      T("associated_symptoms", "Associated Symptoms — fever, weight loss, neck swelling, stridor, aspiration"),
      S("red_flags", "Red Flags Present", ["None identified", "Stridor at rest", "Apnoea with cyanosis", "Failure to thrive", "Rapidly progressive neck swelling", "Other — see detail"], R),
      T("red_flag_detail", "Red Flag — Detail and Action Taken", when("red_flags", "Stridor at rest", "Apnoea with cyanosis", "Failure to thrive", "Rapidly progressive neck swelling", "Other — see detail")),
    ]),
    ...sec("Examination", [
      T("exam_findings", "Examination — Ears, Nose, Throat & Neck (age-appropriate)"),
      S("cooperation", "Cooperation During Assessment", ["Full", "Partial — limited views", "Not possible — deferred"]),
      T("deferred_exam", "Which Findings Could Not Be Assessed and What Is Planned"),
    ]),
    ...sec("Assessment", [
      diagnosisField(["ear", "nose", "throat", "sleep", "symptom"]),
      T("differential", "Differential Diagnosis — and the evidence that supports or excludes each"),
      T("assessment", "Assessment", R),
      S("severity", "Severity / Impact", ["Mild — no functional impact", "Moderate — school or sleep affected", "Severe — growth, development or airway affected", "Not assessed"], R),
      T("tests_requested", "Tests & Studies Requested — audiology, sleep study, bloods, cross-sectional studies", R),
      S("hearing_test_status", "Hearing Assessment Status", ["Not indicated", "Requested", "Completed — normal", "Completed — abnormal", "Not possible at this age"]),
    ]),
    ...managementBlock([
      T("caregiver_education", "Caregiver Education — what to watch for and when to seek help", R),
      S("surgical_indication", "Surgical Indication", ["Not indicated", "Discussed with caregivers", "Listed for surgery", "Deferred — reassess after medical treatment"]),
      T("surgical_discussion", "Surgical Discussion — expected benefit, risks, anaesthetic considerations and what happens if surgery is not done", when("surgical_indication", "Discussed with caregivers", "Listed for surgery", "Deferred — reassess after medical treatment")),
    ]),
  ],
};

// ---- Safety prompts (added once to every ENT note type) --------------------
// Conditional on the encounter and the documented findings — see
// src/lib/entSafetyRules.js. Not a required field: urgent care comes first.
export const entSafetySection = () =>
  sec("Safety Concerns & Documented Action", [
    { key: "ent_safety", label: "Safety prompts from the documented findings", type: "ent_safety" },
  ]);

export const ENT_DOCS = [
  consultation,
  followup,
  procedureNote,
  operativeNote,
  preopAssessment,
  postopNote,
  audiologyReport,
  dischargeSummary,
  referral,
  otology,
  rhinosinusitis,
  laryngology,
  neckMass,
  paediatric,
];