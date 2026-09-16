// Specialty-specific clinical paperwork catalogs for the AMedix core clinical
// system. Every specialty document attaches to the existing AMedix Patient
// Record and its Encounter through the Part 1 ClinicalDocument system — the
// same PDF header, digital signature, timestamp, AMedix Document ID, version
// control, amendment system, permissions and audit log. No separate records.

export const SPECIALTY_KEYS = {
  "Internal Medicine": "internal_medicine",
  "Surgeon": "surgery",
  "Emergency Medicine": "emergency_medicine",
  "Pediatrics": "pediatrics",
  "Obstetrics & Gynecology": "obstetrics_gynecology",
  "Anesthesiology & Intensive Care": "anesthesiology",
};

export const SPECIALTY_LABELS = {
  internal_medicine: "Internal Medicine",
  surgery: "Surgery",
  emergency_medicine: "Emergency Medicine",
  pediatrics: "Pediatrics",
  obstetrics_gynecology: "Obstetrics & Gynecology",
  anesthesiology: "Anesthesiology",
};

// Emergency workflow: Arrival → Triage → Assessment → Investigations →
// Treatment → Reassessment → Disposition.
export const EMERGENCY_WORKFLOW = [
  "Arrival", "Triage", "Assessment", "Investigations", "Treatment", "Reassessment", "Disposition",
];

export const DISPOSITION_OPTIONS = [
  "Discharge", "Admission", "Transfer", "Observation", "Left Against Medical Advice",
];

// Field builders: I = single-line input, N = number, T = multi-line text,
// S = select with fixed options, DISPO = the emergency disposition field.
const I = (key, label) => ({ key, label, type: "input" });
const N = (key, label) => ({ key, label, type: "number" });
const T = (key, label) => ({ key, label, type: "textarea" });
const S = (key, label, options) => ({ key, label, type: "select", options });
const DISPO = () => S("disposition", "Disposition", DISPOSITION_OPTIONS);

const IM_DOCS = [
  {
    key: "im_consultation", label: "Internal Medicine Consultation", specialty: "internal_medicine",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("review_of_systems", "Review of Systems"), T("exam_findings", "Physical Examination Findings"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "im_new_patient_assessment", label: "New Patient Assessment", specialty: "internal_medicine",
    fields: [I("referral_source", "Referral Source"), T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("past_surgical_history", "Past Surgical History"), T("family_history", "Family History"), T("social_history", "Social History"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("review_of_systems", "Review of Systems"), T("exam_findings", "Physical Examination Findings"), T("problem_list", "Problem List"), T("assessment", "Assessment"), T("plan", "Initial Plan")],
  },
  {
    key: "im_followup", label: "Follow-Up Note", specialty: "internal_medicine",
    fields: [T("interval_history", "Interval History"), T("current_symptoms", "Current Symptoms"), T("exam_findings", "Physical Examination Findings"), T("assessment", "Assessment"), T("plan", "Plan"), I("next_visit", "Next Visit")],
  },
  {
    key: "im_chronic_followup", label: "Chronic Disease Follow-Up", specialty: "internal_medicine",
    fields: [T("chronic_conditions", "Chronic Conditions"), T("symptoms_since_last_visit", "Symptoms Since Last Visit"), S("adherence", "Treatment Adherence", ["Good", "Partial", "Poor"]), T("side_effects", "Side Effects"), I("vitals_bp", "Blood Pressure"), T("exam_findings", "Physical Examination Findings"), T("labs_reviewed", "Labs Reviewed"), T("assessment", "Assessment"), T("medication_changes", "Medication Changes"), T("plan", "Plan")],
  },
  {
    key: "im_admission_note", label: "Admission Note", specialty: "internal_medicine",
    fields: [T("admission_reason", "Reason for Admission"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("admission_diagnosis", "Admission Diagnosis"), T("exam_findings", "Physical Examination Findings"), T("admission_vitals", "Vital Signs on Admission"), T("investigations_ordered", "Investigations Ordered"), S("admission_status", "Admission To", ["Ward", "HDU", "ICU"]), T("admission_plan", "Admission Plan")],
  },
  {
    key: "im_daily_progress", label: "Daily Medical Progress Note", specialty: "internal_medicine",
    fields: [T("overnight_events", "Overnight Events"), T("subjective", "Subjective"), T("exam_findings", "Physical Examination Findings"), T("vitals", "Vital Signs"), T("investigations", "Investigations"), T("iv_fluids", "IV Fluids"), T("medications_review", "Medications Review"), T("plan", "Plan"), I("code_status", "Code Status")],
  },
  {
    key: "im_problem_oriented_progress", label: "Problem-Oriented Progress Note", specialty: "internal_medicine",
    fields: [T("active_problems", "Active Problems"), T("problem_by_problem", "Problem-by-Problem Assessment & Plan"), T("assessment", "Overall Assessment"), T("plan", "Plan")],
  },
  {
    key: "im_consultation_request", label: "Consultation Request", specialty: "internal_medicine",
    fields: [I("consulting_specialty", "Consulting Specialty"), T("reason_for_consultation", "Reason for Consultation"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("clinical_question", "Clinical Question"), T("relevant_history", "Relevant History"), T("current_status", "Current Status")],
  },
  {
    key: "im_consultation_response", label: "Consultation Response", specialty: "internal_medicine",
    fields: [I("consultant", "Consultant"), T("reason_for_consultation", "Reason for Consultation"), T("impression", "Impression"), T("recommendations", "Recommendations"), T("follow_up", "Follow-Up")],
  },
  {
    key: "im_medication_reconciliation", label: "Medication Reconciliation", specialty: "internal_medicine",
    fields: [T("current_medications", "Current Medications"), T("home_medications", "Home Medications"), T("discrepancies", "Discrepancies Identified"), S("reconciliation_outcome", "Reconciliation Outcome", ["Reconciled", "Changes Required", "Pending Review"]), T("changes_made", "Changes Made")],
  },
  {
    key: "im_discharge_summary", label: "Discharge Summary", specialty: "internal_medicine",
    fields: [T("admission_diagnosis", "Admission Diagnosis"), T("discharge_diagnosis", "Discharge Diagnosis"), T("hospital_course", "Hospital Course"), T("discharge_condition", "Condition at Discharge"), T("discharge_medications", "Discharge Medications"), T("follow_up", "Follow-Up"), T("instructions", "Instructions"), T("pending_results", "Pending Results")],
  },
  {
    key: "im_medical_followup", label: "Medical Follow-Up", specialty: "internal_medicine",
    fields: [I("reason", "Reason for Follow-Up"), T("interval_history", "Interval History"), T("exam_findings", "Physical Examination Findings"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "im_chronic_care_plan", label: "Chronic Disease Care Plan", specialty: "internal_medicine",
    fields: [T("diagnoses", "Chronic Diagnoses"), T("goals", "Care Goals"), T("target_values", "Target Values"), T("medications_plan", "Medication Plan"), T("lifestyle_plan", "Lifestyle Management"), T("monitoring_plan", "Monitoring Plan"), I("review_interval", "Review Interval"), T("escalation_criteria", "Escalation Criteria")],
  },
];

const SURGERY_DOCS = [
  {
    key: "surg_consultation", label: "Surgical Consultation", specialty: "surgery",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("surgical_history", "Past Surgical History"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("exam_findings", "Physical Examination Findings"), T("working_diagnosis", "Working Diagnosis"), T("investigations_ordered", "Investigations Ordered"), T("treatment_options_discussed", "Treatment Options Discussed"), T("recommendation", "Recommendation")],
  },
  {
    key: "surg_preop_assessment", label: "Pre-Operative Assessment", specialty: "surgery",
    fields: [I("planned_procedure", "Planned Procedure"), T("indication", "Indication for Surgery"), S("asa_class", "ASA Class", ["ASA I", "ASA II", "ASA III", "ASA IV", "ASA V", "ASA VI"]), T("comorbidities", "Comorbidities"), T("cardiac_status", "Cardiac Status"), T("respiratory_status", "Respiratory Status"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("labs_reviewed", "Laboratory Results Reviewed"), T("imaging_reviewed", "Imaging Reviewed"), T("risk_assessment", "Risk Assessment"), S("anesthesia_clearance", "Anesthesia Clearance", ["Cleared", "Cleared with Conditions", "Not Cleared", "Pending"]), T("preop_instructions", "Pre-Operative Instructions")],
  },
  {
    key: "surg_operative_note", label: "Operative Note", specialty: "surgery",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), I("procedure", "Procedure"), I("surgeon", "Surgeon"), T("assistants", "Assistants"), S("anesthesia", "Anesthesia", ["General", "Regional", "Local", "Monitored Anesthesia Care", "Sedation", "Other"]), T("indication", "Indication"), T("findings", "Findings"), T("procedure_details", "Procedure Details"), T("specimens", "Specimens"), I("estimated_blood_loss", "Estimated Blood Loss"), T("complications", "Complications"), T("drains", "Drains"), T("implants", "Implants"), T("patient_condition", "Patient Condition"), T("postop_plan", "Post-Operative Plan")],
  },
  {
    key: "surg_procedure_note", label: "Procedure Note", specialty: "surgery",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), T("specimens", "Specimens"), T("complications", "Complications"), T("patient_condition", "Patient Condition"), T("post_procedure_plan", "Post-Procedure Plan")],
  },
  {
    key: "surg_postop_note", label: "Post-Operative Note", specialty: "surgery",
    fields: [I("procedure_date", "Procedure Date"), I("postop_day", "Post-Operative Day"), T("vitals", "Vital Signs"), T("wound_condition", "Wound Condition"), T("drain_output", "Drain Output"), T("pain_control", "Pain Control"), T("mobility", "Mobility"), T("labs", "Laboratory Results"), T("complications", "Complications"), T("plan", "Plan")],
  },
  {
    key: "surg_daily_progress", label: "Daily Surgical Progress Note", specialty: "surgery",
    fields: [I("postop_day", "Post-Operative Day"), T("overnight_events", "Overnight Events"), T("wound_exam", "Wound Examination"), T("drain_status", "Drain Status"), T("labs", "Laboratory Results"), T("imaging", "Imaging"), T("antibiotics", "Antibiotics"), T("plan", "Plan"), I("code_status", "Code Status")],
  },
  {
    key: "surg_discharge_summary", label: "Discharge Summary", specialty: "surgery",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), T("procedure", "Procedure Performed"), T("hospital_course", "Hospital Course"), T("wound_instructions", "Wound Care Instructions"), T("discharge_medications", "Discharge Medications"), T("follow_up", "Follow-Up"), T("warning_signs", "Warning Signs"), T("pending_results", "Pending Results")],
  },
  {
    key: "surg_followup", label: "Surgical Follow-Up", specialty: "surgery",
    fields: [I("procedure_done", "Procedure Done"), I("time_since_procedure", "Time Since Procedure"), T("wound_status", "Wound Status"), T("symptoms", "Symptoms"), T("exam_findings", "Physical Examination Findings"), T("workup", "Work-Up"), T("plan", "Plan")],
  },
  {
    key: "surg_pathology", label: "Pathology Request / Record", specialty: "surgery",
    fields: [T("specimens_sent", "Specimens Sent"), T("clinical_history", "Clinical History"), T("gross_findings", "Gross Findings"), T("microscopic_findings", "Microscopic Findings"), T("diagnosis", "Pathology Diagnosis"), I("turnaround", "Turnaround / Report Date")],
  },
  {
    key: "surg_referral", label: "Surgical Referral", specialty: "surgery",
    fields: [I("referred_to", "Referred To"), T("referring_diagnosis", "Referring Diagnosis"), T("clinical_question", "Clinical Question / Reason"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History")],
  },
  {
    key: "surg_consent_documentation", label: "Consent Documentation", specialty: "surgery",
    fields: [I("procedure", "Procedure"), T("risks_discussed", "Risks Discussed"), T("alternatives", "Alternatives Discussed"), S("patient_agreement", "Patient Agreement", ["Agreed", "Declined", "Deferred"]), I("consent_type", "Consent Type"), I("witness", "Witness"), T("notes", "Notes")],
  },
  {
    key: "surg_implant_device", label: "Implant / Device Record", specialty: "surgery",
    fields: [I("implant_name", "Implant / Device Name"), I("manufacturer", "Manufacturer"), I("model", "Model"), I("serial_number", "Serial Number"), I("lot_number", "Lot / Batch Number"), I("implant_site", "Implant Site"), I("date_implanted", "Date Implanted"), I("expiration", "Expiration Date (if applicable)"), T("notes", "Notes")],
  },
];

const EM_DOCS = [
  {
    key: "em_triage", label: "Triage Record", specialty: "emergency_medicine",
    fields: [I("arrival_time", "Arrival Time"), S("arrival_mode", "Arrival Mode", ["Walk-In", "Ambulance", "Private Vehicle", "Other"]), S("triage_category", "Triage Category", ["1 — Immediate (Resuscitation)", "2 — Emergent", "3 — Urgent", "4 — Less Urgent", "5 — Non-Urgent"]), T("chief_complaint", "Chief Complaint"), T("vitals", "Vital Signs"), N("pain_score", "Pain Score (0–10)"), T("allergies", "Allergies"), T("medications", "Current Medications"), T("triage_note", "Triage Note")],
  },
  {
    key: "em_ed_assessment", label: "Emergency Department Assessment", specialty: "emergency_medicine",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("review_of_systems", "Review of Systems"), T("exam_findings", "Physical Examination Findings"), T("vitals", "Vital Signs"), T("ecg_findings", "ECG Findings"), T("assessment", "Assessment"), T("plan", "Plan (Investigations & Treatment)")],
  },
  {
    key: "em_physician_note", label: "Emergency Physician Note", specialty: "emergency_medicine",
    fields: [T("presenting_complaint", "Presenting Complaint"), T("hpi", "History of Present Illness"), T("exam_findings", "Physical Examination Findings"), T("vitals", "Vital Signs"), T("differential", "Differential Diagnosis"), T("investigations", "Investigations"), T("treatment_given", "Treatment Given"), T("response", "Response to Treatment"), T("assessment", "Assessment")],
  },
  {
    key: "em_progress", label: "Emergency Progress Note", specialty: "emergency_medicine",
    fields: [I("time_since_arrival", "Time Since Arrival"), T("interval_events", "Interval Events"), T("vitals", "Vital Signs"), T("exam_findings", "Reassessment Findings"), T("investigations_results", "Investigation Results"), T("treatment", "Treatment"), T("response", "Response"), T("plan", "Plan"), DISPO()],
  },
  {
    key: "em_trauma_assessment", label: "Trauma Assessment", specialty: "emergency_medicine",
    fields: [T("mechanism_of_injury", "Mechanism of Injury"), T("prehospital_report", "Pre-Hospital Report"), T("primary_survey", "Primary Survey (ABCDE)"), T("secondary_survey", "Secondary Survey"), T("injuries_identified", "Injuries Identified"), T("vitals", "Vital Signs"), T("investigations", "Investigations"), T("interventions", "Interventions"), I("trauma_team_lead", "Trauma Team Lead")],
  },
  {
    key: "em_procedure_note", label: "Emergency Procedure Note", specialty: "emergency_medicine",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), T("specimens", "Specimens"), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "em_resuscitation_code", label: "Resuscitation / Code Record", specialty: "emergency_medicine",
    fields: [I("event_time", "Event Time"), T("code_team", "Code Team Members"), T("arrest_time", "Time of Arrest"), T("rhythm", "Initial Rhythm"), T("interventions", "Interventions"), T("medications", "Medications Administered"), T("defibrillations", "Defibrillations / Shocks"), S("outcome", "Outcome", ["ROSC", "Ongoing Resuscitation", "Deceased", "Transferred for Continuing Care"]), T("family_contacted", "Family Contacted / Present"), T("notes", "Notes")],
  },
  {
    key: "em_consultation", label: "Emergency Consultation", specialty: "emergency_medicine",
    fields: [I("consultant_specialty", "Consultant Specialty"), T("reason", "Reason for Consultation"), T("findings", "Consultant Findings"), T("recommendations", "Recommendations")],
  },
  {
    key: "em_observation_note", label: "Observation Note", specialty: "emergency_medicine",
    fields: [T("observation_reason", "Reason for Observation"), T("interval_course", "Interval Course"), T("vitals", "Vital Signs"), T("assessment", "Assessment"), DISPO()],
  },
  {
    key: "em_transfer_note", label: "Transfer Note", specialty: "emergency_medicine",
    fields: [I("receiving_facility", "Receiving Facility"), T("reason_for_transfer", "Reason for Transfer"), I("transfer_mode", "Transfer Mode"), T("condition_at_transfer", "Condition at Transfer"), T("accompanied_by", "Accompanied By"), T("documents_sent", "Documents Sent"), T("consent", "Transfer Consent"), DISPO()],
  },
  {
    key: "em_discharge_summary", label: "Emergency Discharge Summary", specialty: "emergency_medicine",
    fields: [T("presenting_complaint", "Presenting Complaint"), T("diagnosis", "Diagnosis"), T("ed_course", "ED Course"), T("treatment_given", "Treatment Given"), T("discharge_medications", "Discharge Medications"), T("follow_up", "Follow-Up"), T("instructions", "Instructions"), DISPO()],
  },
  {
    key: "em_discharge_instructions", label: "Emergency Discharge Instructions", specialty: "emergency_medicine",
    fields: [T("diagnosis", "Diagnosis"), T("home_care", "Home Care Instructions"), T("medications", "Medications"), T("activity", "Activity"), T("warning_signs", "Warning Signs — Return Immediately If"), T("follow_up", "Follow-Up"), T("when_to_return", "When to Return to the Emergency Department")],
  },
];

const PEDIATRICS_DOCS = [
  {
    key: "peds_consultation", label: "Pediatric Consultation", specialty: "pediatrics",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("birth_history", "Birth History"), T("feeding", "Feeding / Nutrition"), S("immunizations_uptodate", "Immunizations Up to Date", ["Yes", "No", "Partially"]), T("development", "Development"), T("school_performance", "School / Nursery Performance"), N("weight_kg", "Weight (kg)"), N("height_cm", "Height / Length (cm)"), T("exam_findings", "Physical Examination Findings"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "peds_followup", label: "Pediatric Follow-Up", specialty: "pediatrics",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), N("weight_kg", "Weight (kg)"), N("height_cm", "Height / Length (cm)"), T("growth_review", "Growth Review"), T("exam_findings", "Physical Examination Findings"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "peds_well_child", label: "Well-Child Visit", specialty: "pediatrics",
    fields: [I("age", "Age"), N("weight_kg", "Weight (kg)"), N("height_cm", "Height / Length (cm)"), N("head_circumference_cm", "Head Circumference (cm)"), N("bmi", "BMI"), I("growth_percentile", "Growth Chart Percentiles"), T("developmental_milestones", "Developmental Milestones"), T("immunization_review", "Immunization Review"), T("screening_done", "Screening Performed"), T("anticipatory_guidance", "Anticipatory Guidance Given"), T("nutrition", "Nutrition"), T("safety", "Safety"), T("plan", "Plan")],
  },
  {
    key: "peds_admission_note", label: "Pediatric Admission Note", specialty: "pediatrics",
    fields: [T("admission_reason", "Reason for Admission"), T("hpi", "History of Present Illness"), T("birth_history", "Birth History"), T("pmh", "Past Medical History"), T("immunizations", "Immunization Status"), N("weight_kg", "Weight (kg)"), T("exam_findings", "Physical Examination Findings"), T("admission_diagnosis", "Admission Diagnosis"), T("admission_plan", "Admission Plan")],
  },
  {
    key: "peds_daily_progress", label: "Pediatric Daily Progress Note", specialty: "pediatrics",
    fields: [T("overnight_events", "Overnight Events"), N("weight_kg", "Weight (kg)"), T("intake_output", "Intake / Output"), T("exam_findings", "Physical Examination Findings"), T("investigations", "Investigations"), T("plan", "Plan")],
  },
  {
    key: "peds_discharge_summary", label: "Pediatric Discharge Summary", specialty: "pediatrics",
    fields: [T("admission_diagnosis", "Admission Diagnosis"), T("discharge_diagnosis", "Discharge Diagnosis"), T("hospital_course", "Hospital Course"), T("discharge_medications", "Discharge Medications"), T("feeding_plan", "Feeding Plan"), T("follow_up", "Follow-Up"), T("parent_instructions", "Parent / Caregiver Instructions")],
  },
  {
    key: "peds_referral", label: "Pediatric Referral", specialty: "pediatrics",
    fields: [I("referral_to", "Referred To"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History")],
  },
  {
    key: "peds_procedure_note", label: "Pediatric Procedure Note", specialty: "pediatrics",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent (Parent / Guardian)"), T("sedation", "Sedation"), T("technique", "Technique"), T("findings", "Findings"), T("specimens", "Specimens"), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "peds_chronic_followup", label: "Chronic Disease Follow-Up (Pediatric)", specialty: "pediatrics",
    fields: [T("chronic_condition", "Chronic Condition"), S("adherence", "Treatment Adherence", ["Good", "Partial", "Poor"]), T("symptoms", "Symptoms"), T("growth_review", "Growth Review"), T("labs", "Laboratory Results"), T("medication_changes", "Medication Changes"), T("plan", "Plan")],
  },
  {
    key: "peds_growth_development", label: "Growth & Development Record", specialty: "pediatrics",
    fields: [N("weight_kg", "Weight (kg)"), N("height_cm", "Height / Length (cm)"), N("head_circumference_cm", "Head Circumference (cm)"), N("bmi", "BMI"), I("growth_percentile", "Growth Chart Percentiles"), T("developmental_milestones", "Developmental Milestones"), T("concerns", "Concerns"), T("plan", "Plan")],
  },
  {
    key: "peds_immunization_record", label: "Immunization Record", specialty: "pediatrics",
    fields: [T("vaccines_given", "Vaccines Given"), I("date_administered", "Date Administered"), T("batch_numbers", "Batch Numbers"), T("site", "Administration Site(s)"), T("reactions", "Reactions"), I("next_due", "Next Dose Due"), T("catch_up_plan", "Catch-Up Plan")],
  },
  {
    key: "peds_screening_record", label: "Screening Record", specialty: "pediatrics",
    fields: [I("screening_type", "Screening Type"), T("result", "Result"), T("action", "Action Taken"), T("referral", "Referral")],
  },
  {
    key: "peds_anticipatory_guidance", label: "Anticipatory Guidance", specialty: "pediatrics",
    fields: [I("age_group", "Age Group"), T("topics_discussed", "Topics Discussed"), T("parent_questions", "Parent / Caregiver Questions"), T("recommendations", "Recommendations")],
  },
  {
    key: "peds_newborn_record", label: "Newborn Record", specialty: "pediatrics",
    fields: [I("birth_datetime", "Date & Time of Birth"), I("gestational_age", "Gestational Age (weeks)"), N("birth_weight_kg", "Birth Weight (kg)"), N("birth_length_cm", "Birth Length (cm)"), N("head_circumference_cm", "Head Circumference (cm)"), N("apgar_1", "APGAR — 1 Minute"), N("apgar_5", "APGAR — 5 Minutes"), S("delivery_type", "Delivery Type", ["Normal Vaginal Delivery", "Instrumental Delivery", "Cesarean Section", "Other"]), T("complications", "Complications")],
  },
  {
    key: "peds_birth_history", label: "Birth History", specialty: "pediatrics",
    fields: [T("pregnancy_course", "Course of Pregnancy"), S("delivery_mode", "Mode of Delivery", ["Normal Vaginal Delivery", "Instrumental Delivery", "Cesarean Section", "Other"]), I("gestational_age", "Gestational Age (weeks)"), N("birth_weight_kg", "Birth Weight (kg)"), T("neonatal_complications", "Neonatal Complications"), S("nicu_admission", "NICU Admission", ["Yes", "No"]), T("feeding_at_birth", "Feeding at Birth")],
  },
  {
    key: "peds_neonatal_progress", label: "Neonatal Progress Note", specialty: "pediatrics",
    fields: [I("day_of_life", "Day of Life"), N("weight_kg", "Weight (kg)"), T("feeding", "Feeding"), T("jaundice_status", "Jaundice Status"), T("vitals", "Vital Signs"), T("exam_findings", "Physical Examination Findings"), T("investigations", "Investigations"), T("plan", "Plan")],
  },
  {
    key: "peds_newborn_discharge_summary", label: "Newborn Discharge Summary", specialty: "pediatrics",
    fields: [T("birth_details", "Birth Details"), T("exam_at_discharge", "Examination at Discharge"), S("feeding_established", "Feeding Established", ["Yes — Breast", "Yes — Formula", "Mixed", "No"]), T("screening_tests", "Newborn Screening Tests"), T("immunizations_given", "Immunizations Given"), T("discharge_medications", "Discharge Medications"), T("follow_up", "Follow-Up"), T("parent_instructions", "Parent / Caregiver Instructions")],
  },
  {
    key: "peds_adolescent_health", label: "Adolescent Health Assessment", specialty: "pediatrics",
    fields: [T("concerns", "Concerns"), T("psychosocial_history", "Psychosocial History (HEEADSSS)"), T("substance_use", "Substance Use"), T("sexual_health", "Sexual Health"), T("mental_health", "Mental Health"), S("confidentiality_discussed", "Confidentiality Discussed", ["Yes", "No"]), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "peds_confidential_adolescent_note", label: "Confidential Adolescent Note", specialty: "pediatrics",
    fields: [T("consultation_reason", "Reason for Consultation"), T("assessment", "Assessment"), T("plan", "Plan"), T("confidentiality_note", "Confidentiality Note")],
  },
];

const OBGYN_DOCS = [
  {
    key: "obgyn_initial_antenatal", label: "Initial Antenatal Visit", specialty: "obstetrics_gynecology",
    fields: [I("lmp", "Last Menstrual Period"), I("edd", "Estimated Due Date"), N("gravidity", "Gravidity"), N("parity", "Parity"), N("abortions", "Abortions / Miscarriages"), N("living_children", "Living Children"), I("gestational_age", "Gestational Age"), T("ob_history", "Obstetric History"), T("medical_history", "Medical History"), T("surgical_history", "Surgical History"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("exam_findings", "Physical Examination Findings"), T("dating_scan", "Dating Scan"), T("initial_labs", "Initial Laboratory Results"), T("risk_assessment", "Risk Assessment"), T("plan", "Plan")],
  },
  {
    key: "obgyn_antenatal_followup", label: "Antenatal Follow-Up", specialty: "obstetrics_gynecology",
    fields: [I("gestational_age", "Gestational Age"), T("symptoms", "Symptoms"), I("fundal_height", "Fundal Height (cm)"), I("fetal_heart_rate", "Fetal Heart Rate"), T("fetal_movement", "Fetal Movement"), I("blood_pressure", "Blood Pressure"), T("urine", "Urine Dipstick"), I("weight_kg", "Weight (kg)"), T("edema", "Edema"), T("risk_flags", "Risk Flags"), T("plan", "Plan"), I("next_visit", "Next Visit")],
  },
  {
    key: "obgyn_pregnancy_record", label: "Pregnancy Record", specialty: "obstetrics_gynecology",
    fields: [N("gravidity", "Gravidity"), N("parity", "Parity"), N("abortions", "Abortions / Miscarriages"), N("living_children", "Living Children"), T("previous_pregnancies", "Previous Pregnancies"), T("previous_c_sections", "Previous C-Sections"), T("previous_complications", "Previous Complications"), T("current_pregnancy_course", "Current Pregnancy Course"), I("blood_type_rh", "Blood Type / Rh"), T("screening_results", "Screening Results"), T("high_risk_factors", "High-Risk Factors")],
  },
  {
    key: "obgyn_prenatal_care_plan", label: "Prenatal Care Plan", specialty: "obstetrics_gynecology",
    fields: [I("edd", "Estimated Due Date"), T("visit_schedule", "Visit Schedule"), T("supplements", "Supplements"), T("screening_plan", "Screening Plan"), T("ultrasound_schedule", "Ultrasound Schedule"), T("delivery_plan_preferences", "Delivery Plan / Preferences"), T("education_given", "Education Given"), T("warning_signs", "Warning Signs")],
  },
  {
    key: "obgyn_labor_delivery_record", label: "Labor & Delivery Record", specialty: "obstetrics_gynecology",
    fields: [I("admission_time", "Admission Time"), I("labor_onset", "Onset of Labor"), T("membranes", "Membranes / Rupture"), T("cervical_assessment", "Cervical Assessment"), T("fetal_heart_monitoring", "Fetal Heart Monitoring"), T("labor_progress", "Labor Progress"), T("augmentation", "Augmentation / Oxytocin"), T("analgesia", "Analgesia"), I("delivery_time", "Time of Delivery"), S("delivery_type", "Delivery Type", ["Normal Vaginal Delivery", "Instrumental Delivery", "Cesarean Section", "Other"]), N("apgar_1", "APGAR — 1 Minute"), N("apgar_5", "APGAR — 5 Minutes"), N("birth_weight_kg", "Birth Weight (kg)"), T("placenta", "Placenta / Cord"), T("perineal_status", "Perineal Status"), T("complications", "Complications"), DISPO()],
  },
  {
    key: "obgyn_delivery_note", label: "Delivery Note", specialty: "obstetrics_gynecology",
    fields: [S("delivery_mode", "Delivery Mode", ["Normal Vaginal Delivery", "Instrumental Delivery", "Cesarean Section", "Other"]), I("time_of_delivery", "Time of Delivery"), I("labor_duration", "Labor Duration"), T("anesthesia", "Anesthesia / Analgesia"), S("perineal_laceration", "Perineal Laceration", ["None", "First Degree", "Second Degree", "Third Degree", "Fourth Degree"]), T("repair_details", "Repair Details"), I("estimated_blood_loss", "Estimated Blood Loss"), T("newborn_details", "Newborn Details"), T("immediate_postpartum", "Immediate Postpartum Course"), T("complications", "Complications")],
  },
  {
    key: "obgyn_csection_operative_note", label: "Cesarean Section Operative Note", specialty: "obstetrics_gynecology",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), T("indication", "Indication for Cesarean"), S("anesthesia", "Anesthesia", ["General", "Regional (Spinal / Epidural)", "Other"]), I("surgeon", "Surgeon"), T("assistants", "Assistants"), I("skin_incision", "Skin Incision"), I("uterine_incision", "Uterine Incision"), T("delivery_details", "Delivery Details"), N("apgar_1", "APGAR — 1 Minute"), N("apgar_5", "APGAR — 5 Minutes"), N("birth_weight_kg", "Birth Weight (kg)"), I("estimated_blood_loss", "Estimated Blood Loss"), T("complications", "Complications"), T("postop_plan", "Post-Operative Plan")],
  },
  {
    key: "obgyn_vaginal_delivery_note", label: "Vaginal Delivery Note", specialty: "obstetrics_gynecology",
    fields: [I("labor_duration", "Labor Duration"), S("perineal_laceration", "Perineal Laceration", ["None", "First Degree", "Second Degree", "Third Degree", "Fourth Degree"]), T("repair_details", "Repair Details"), I("estimated_blood_loss", "Estimated Blood Loss"), T("placenta_inspection", "Placenta Inspection"), T("newborn_status", "Newborn Status"), T("complications", "Complications"), T("postpartum_plan", "Postpartum Plan")],
  },
  {
    key: "obgyn_postpartum_note", label: "Postpartum Note", specialty: "obstetrics_gynecology",
    fields: [I("postpartum_day", "Postpartum Day"), T("bleeding", "Bleeding / Lochia"), S("breastfeeding", "Breastfeeding", ["Exclusive", "Partial", "Formula", "Not Feeding"]), T("blood_pressure", "Blood Pressure"), I("temperature", "Temperature"), T("mood_screening", "Mood / Depression Screening"), T("contraception_discussed", "Contraception Discussed"), T("plan", "Plan")],
  },
  {
    key: "obgyn_discharge_summary", label: "Obstetric Discharge Summary", specialty: "obstetrics_gynecology",
    fields: [T("delivery_summary", "Delivery Summary"), T("postpartum_course", "Postpartum Course"), T("newborn_status", "Newborn Status"), T("discharge_medications", "Discharge Medications"), T("breastfeeding_support", "Breastfeeding Support"), T("contraception_plan", "Contraception Plan"), T("follow_up", "Follow-Up"), T("warning_signs", "Warning Signs")],
  },
  {
    key: "obgyn_pregnancy_followup", label: "Pregnancy Follow-Up", specialty: "obstetrics_gynecology",
    fields: [I("gestational_age", "Gestational Age"), T("interval_events", "Interval Events"), T("exam_findings", "Physical Examination Findings"), T("fetal_assessment", "Fetal Assessment"), T("plan", "Plan")],
  },
  {
    key: "obgyn_gyn_consultation", label: "Gynecology Consultation", specialty: "obstetrics_gynecology",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("ob_history", "Obstetric History"), T("menstrual_history", "Menstrual History"), T("contraceptive_history", "Contraceptive History"), T("pmh", "Past Medical History"), T("exam_findings", "Physical Examination Findings"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "obgyn_gyn_followup", label: "Gynecology Follow-Up", specialty: "obstetrics_gynecology",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("exam_findings", "Physical Examination Findings"), T("investigations", "Investigations"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "obgyn_gyn_procedure_note", label: "Gynecologic Procedure Note", specialty: "obstetrics_gynecology",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), T("specimens", "Specimens"), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "obgyn_gyn_operative_note", label: "Gynecologic Operative Note", specialty: "obstiatrics_gynecology",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), I("procedure", "Procedure"), I("surgeon", "Surgeon"), T("assistants", "Assistants"), S("anesthesia", "Anesthesia", ["General", "Regional", "Local", "Monitored Anesthesia Care", "Sedation", "Other"]), T("indication", "Indication"), T("findings", "Findings"), T("procedure_details", "Procedure Details"), T("specimens", "Specimens"), I("estimated_blood_loss", "Estimated Blood Loss"), T("complications", "Complications"), T("postop_plan", "Post-Operative Plan")],
  },
  {
    key: "obgyn_gyn_preop_assessment", label: "Gynecologic Pre-Operative Assessment", specialty: "obstetrics_gynecology",
    fields: [I("planned_procedure", "Planned Procedure"), T("indication", "Indication"), S("asa_class", "ASA Class", ["ASA I", "ASA II", "ASA III", "ASA IV", "ASA V", "ASA VI"]), T("comorbidities", "Comorbidities"), T("labs_reviewed", "Laboratory Results Reviewed"), T("risk_assessment", "Risk Assessment"), S("clearance", "Clearance", ["Cleared", "Cleared with Conditions", "Not Cleared", "Pending"]), T("preop_instructions", "Pre-Operative Instructions")],
  },
  {
    key: "obgyn_gyn_postop_note", label: "Gynecologic Post-Operative Note", specialty: "obstetrics_gynecology",
    fields: [I("procedure_date", "Procedure Date"), I("postop_day", "Post-Operative Day"), T("vitals", "Vital Signs"), T("wound", "Wound"), T("drain_output", "Drain Output"), T("pain", "Pain Control"), T("labs", "Laboratory Results"), T("complications", "Complications"), T("plan", "Plan")],
  },
  {
    key: "obgyn_gyn_discharge_summary", label: "Gynecologic Discharge Summary", specialty: "obstetrics_gynecology",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), T("procedure", "Procedure Performed"), T("hospital_course", "Hospital Course"), T("discharge_medications", "Discharge Medications"), T("wound_care", "Wound Care"), T("follow_up", "Follow-Up"), T("warning_signs", "Warning Signs")],
  },
  {
    key: "obgyn_gyn_referral", label: "Gynecology Referral", specialty: "obstetrics_gynecology",
    fields: [I("referral_to", "Referred To"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History")],
  },
];

const ANESTHESIA_DOCS = [
  {
    key: "anes_pre_assessment", label: "Pre-Anesthesia Assessment", specialty: "anesthesiology",
    fields: [S("asa_class", "ASA Class", ["ASA I", "ASA II", "ASA III", "ASA IV", "ASA V", "ASA VI"]), S("mallampati", "Mallampati Class", ["I", "II", "III", "IV"]), T("mouth_opening", "Mouth Opening"), T("thyromental_distance", "Thyromental Distance"), T("comorbidities", "Comorbidities"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("previous_anesthesia", "Previous Anesthesia History"), T("family_anesthesia_history", "Family Anesthesia History"), T("labs", "Laboratory Results"), S("fasting_status", "Fasting Status", ["Adequate", "Not Adequate", "Not Fasted"]), T("risk_assessment", "Risk Assessment"), T("plan", "Anesthetic Plan")],
  },
  {
    key: "anes_consultation", label: "Anesthesia Consultation", specialty: "anesthesiology",
    fields: [T("consult_reason", "Reason for Consultation"), T("history", "Relevant History"), T("exam_findings", "Physical Examination Findings"), T("investigations", "Investigations"), T("anesthetic_risk", "Anesthetic Risk"), T("recommendations", "Recommendations")],
  },
  {
    key: "anes_plan", label: "Anesthesia Plan", specialty: "anesthesiology",
    fields: [S("planned_technique", "Planned Technique", ["General", "Regional", "Local", "Monitored Anesthesia Care", "Sedation", "Combined General + Regional"]), T("airway_plan", "Airway Plan"), T("monitoring_plan", "Monitoring Plan"), T("analgesia_plan", "Analgesia Plan"), T("anesthesia_medications", "Planned Medications"), T("positioning", "Positioning"), T("contingency_plan", "Contingency Plan")],
  },
  {
    key: "anes_consent", label: "Anesthesia Consent", specialty: "anesthesiology",
    fields: [I("procedure", "Procedure"), S("technique", "Anesthetic Technique", ["General", "Regional", "Local", "Monitored Anesthesia Care", "Sedation", "Combined General + Regional"]), T("risks_discussed", "Risks Discussed"), T("alternatives", "Alternatives Discussed"), T("patient_questions", "Patient Questions"), S("patient_agreement", "Patient Agreement", ["Agreed", "Declined", "Deferred"])],
  },
  {
    key: "anes_airway_assessment", label: "Airway Assessment", specialty: "anesthesiology",
    fields: [S("mallampati", "Mallampati Class", ["I", "II", "III", "IV"]), T("mouth_opening", "Mouth Opening (Inter-incisor Gap)"), T("thyromental_distance", "Thyromental Distance"), T("neck_movement", "Neck Movement / Extension"), T("dental_status", "Dental Status"), S("predicted_difficulty", "Predicted Difficult Airway", ["No", "Yes", "Possibly"]), T("plan", "Airway Management Plan")],
  },
  {
    key: "anes_intraop_record", label: "Intraoperative Anesthesia Record", specialty: "anesthesiology",
    fields: [I("anesthesia_start", "Anesthesia Start Time"), S("technique", "Technique Used", ["General", "Regional", "Local", "Monitored Anesthesia Care", "Sedation", "Combined General + Regional"]), T("induction_medications", "Induction Medications"), S("airway_device", "Airway Device", ["Face Mask", "Laryngeal Mask Airway", "Endotracheal Tube", "Supraglottic Device", "Spontaneous Breathing"]), I("tube_size", "Tube Size"), T("intubation_details", "Intubation Details"), T("maintenance", "Maintenance"), T("fluids_given", "IV Fluids Given"), I("blood_loss", "Estimated Blood Loss"), T("urine_output", "Urine Output"), T("vitals_intraop", "Vital Signs Log"), T("events", "Intraoperative Events"), T("emergence", "Emergence / Extubation"), T("handover", "Handover / Recovery Note")],
  },
  {
    key: "anes_medication_record", label: "Anesthesia Medication Record", specialty: "anesthesiology",
    fields: [T("induction_agents", "Induction Agents"), T("maintenance_agents", "Maintenance Agents"), T("opioids", "Opioids"), T("muscle_relaxants", "Muscle Relaxants"), T("reversal_agents", "Reversal Agents"), T("local_anesthetics", "Local Anesthetics"), T("other_medications", "Other Medications")],
  },
  {
    key: "anes_monitoring_record", label: "Intraoperative Monitoring Record", specialty: "anesthesiology",
    fields: [T("monitoring_modalities", "Monitoring Modalities"), T("vitals_log", "Vital Signs Log"), T("spo2", "SpO2 Log"), T("etco2", "EtCO2 Log"), T("temperature", "Temperature Log"), T("blood_pressure", "Blood Pressure Log"), T("heart_rate", "Heart Rate Log"), T("events", "Monitoring Events / Alerts")],
  },
  {
    key: "anes_post_anesthesia_care_note", label: "Post-Anesthesia Care Note", specialty: "anesthesiology",
    fields: [I("time_in_pacu", "Time into PACU"), S("consciousness", "Consciousness Level", ["Alert", "Drowsy", "Unresponsive"]), S("airway", "Airway", ["Self-Maintained", "Adjunct Required", "Support Required"]), T("vitals", "Vital Signs"), N("pain_score", "Pain Score (0–10)"), T("nausea", "Nausea / Vomiting"), T("bleeding", "Bleeding"), T("motor_block", "Motor Block Regression"), S("discharge_criteria", "Discharge Criteria Met", ["Yes", "No", "Pending"]), S("disposition", "Disposition from PACU", ["Ward", "ICU", "HDU", "Day-Case Discharge", "Ward-level Discharge"])],
  },
  {
    key: "anes_post_anesthesia_evaluation", label: "Post-Anesthesia Evaluation", specialty: "anesthesiology",
    fields: [T("mental_status", "Mental Status"), T("vital_signs", "Vital Signs"), T("respiratory_status", "Respiratory Status"), N("pain_score", "Pain Score (0–10)"), T("ponv", "Postoperative Nausea / Vomiting"), T("complications", "Anesthesia-Related Complications"), T("follow_up", "Anesthesia Follow-Up Plan")],
  },
  {
    key: "anes_followup", label: "Anesthesia Follow-Up", specialty: "anesthesiology",
    fields: [I("days_since_anesthesia", "Days Since Anesthesia"), T("complications", "Complications Since Anesthesia"), N("pain_score", "Pain Score (0–10)"), T("nausea", "Nausea / Vomiting"), T("patient_satisfaction", "Patient Satisfaction"), T("plan", "Plan")],
  },
  {
    key: "anes_regional_record", label: "Regional / Neuraxial Procedure Record", specialty: "anesthesiology",
    fields: [S("technique", "Technique", ["Spinal", "Epidural", "Combined Spinal-Epidural", "Peripheral Nerve Block", "Other"]), I("level", "Level / Site"), T("needle", "Needle Used"), T("drug_dose", "Drug & Dose"), I("onset", "Onset Time"), T("block_quality", "Block Quality"), T("complications", "Complications"), T("monitoring", "Monitoring")],
  },
];

export const SPECIALTY_DOCUMENTS = [
  ...IM_DOCS, ...SURGERY_DOCS, ...EM_DOCS, ...PEDIATRICS_DOCS, ...OBGYN_DOCS, ...ANESTHESIA_DOCS,
];

export const getSpecialtyDocs = (specialization) => {
  const key = SPECIALTY_KEYS[specialization];
  return key ? SPECIALTY_DOCUMENTS.filter((d) => d.specialty === key) : [];
};

export const getDocDef = (key) => SPECIALTY_DOCUMENTS.find((d) => d.key === key) || null;

export const getSpecialtyOfDoc = (key) => {
  const def = getDocDef(key);
  return def ? def.specialty : "";
};

export const getSpecialtyLabel = (specialtyKey) => SPECIALTY_LABELS[specialtyKey] || specialtyKey;