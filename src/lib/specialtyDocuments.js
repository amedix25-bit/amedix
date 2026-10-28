// Specialty-specific clinical paperwork catalogs for the AMedix core clinical
// system. Every specialty document attaches to the existing AMedix Patient
// Record and its Encounter through the Part 1 ClinicalDocument system — the
// same PDF header, digital signature, timestamp, AMedix Document ID, version
// control, amendment system, permissions and audit log. No separate records.

import {
  ONCOLOGY_DOCS, INFECTIOUS_DISEASE_DOCS, RHEUMATOLOGY_DOCS, HEMATOLOGY_DOCS,
  FAMILY_MEDICINE_DOCS, DENTAL_DOCS, PHYSIO_DOCS, NUTRITION_DOCS, CERTIFICATE_DEFS,
} from "@/lib/specialtyDocumentsPart4";
import { RADIOLOGY_DOCS, LABORATORY_DOCS, PATHOLOGY_DOCS } from "@/lib/specialtyDocumentsPart5";
import { SURGERY_DOCS } from "@/lib/surgeryDocuments";
import { SURGERY_CONDITION_DOCS } from "@/lib/surgeryConditionDocuments";
import { applyNoteSectionPolicy } from "@/lib/noteSectionPolicy";
import { RHEUMATOLOGY_DISEASE_DOCS } from "@/lib/rheumDiseaseNotes";
import { ANESTHESIA_DOCS } from "@/lib/anesthesiologyDocuments";
import { NEPHROLOGY_DOCS } from "@/lib/nephrologyDocuments";
import { NEPHROLOGY_KIDNEY_DOCS } from "@/lib/nephrologyKidneyDocs";
import { NEPHROLOGY_CONDITION_DOCS } from "@/lib/nephrologyConditionDocs";

export const SPECIALTY_KEYS = {
  "Internal Medicine": "internal_medicine",
  "General Surgery": "surgery",
  "Surgeon": "surgery",
  "Emergency Medicine": "emergency_medicine",
  "Pediatrics": "pediatrics",
  "Obstetrics & Gynecology": "obstetrics_gynecology",
  "Anesthesiology & Intensive Care": "anesthesiology",
  "Cardiology": "cardiology",
  "Neurology": "neurology",
  "Psychiatry": "psychiatry",
  "Ophthalmology": "ophthalmology",
  "Dermatology": "dermatology",
  "Orthopedics": "orthopedics",
  "Urology": "urology",
  "ENT (Otolaryngology)": "ent",
  "Pulmonology": "pulmonology",
  "Gastroenterology": "gastroenterology",
  "Nephrology": "nephrology",
  "Endocrinology": "endocrinology",
  "Oncology": "oncology",
  "Infectious Diseases": "infectious_disease",
  "Rheumatology": "rheumatology",
  "Hematology": "hematology",
  "Family Medicine": "family_medicine",
  "General Practice": "family_medicine",
  "Dentistry": "dentistry",
  "Physical Medicine & Rehabilitation": "physiotherapy",
  "Nutrition & Dietetics": "nutrition",
  "Radiology": "radiology",
  "Pathology": "pathology",
  "Laboratory Medicine": "laboratory",
  "Neurosurgery": "surgery",
  "Cardiothoracic Surgery": "surgery",
  "Pediatric Surgery": "surgery",
  "Trauma Surgery": "surgery",
  "Critical Care / ICU": "internal_medicine",
  "Pain Medicine": "anesthesiology",
  "Allergy & Immunology": "internal_medicine",
  "Geriatrics": "internal_medicine",
  "Palliative Care": "family_medicine",
  "Sports Medicine": "orthopedics",
};

export const SPECIALTY_LABELS = {
  internal_medicine: "Internal Medicine",
  surgery: "Surgery",
  emergency_medicine: "Emergency Medicine",
  pediatrics: "Pediatrics",
  obstetrics_gynecology: "Obstetrics & Gynecology",
  anesthesiology: "Anesthesiology",
  cardiology: "Cardiology",
  neurology: "Neurology",
  psychiatry: "Psychiatry",
  ophthalmology: "Ophthalmology",
  dermatology: "Dermatology",
  orthopedics: "Orthopedics",
  urology: "Urology",
  ent: "ENT / Otolaryngology",
  pulmonology: "Pulmonology / Respiratory Medicine",
  gastroenterology: "Gastroenterology",
  nephrology: "Nephrology",
  endocrinology: "Endocrinology",
  oncology: "Oncology",
  infectious_disease: "Infectious Disease",
  rheumatology: "Rheumatology",
  hematology: "Hematology",
  family_medicine: "Family Medicine / General Practice",
  dentistry: "Dentistry",
  physiotherapy: "Physiotherapy / Rehabilitation",
  nutrition: "Nutrition / Dietetics",
  radiology: "Radiology",
  pathology: "Pathology",
  laboratory: "Laboratory Medicine",
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

const EM_DOCS = [
  {
    // The default Emergency Medicine note — one note that follows the full
    // AMedix emergency workflow: Arrival → Triage → Assessment →
    // Investigations → Treatment → Reassessment → Disposition.
    key: "em_emergency_note", label: "Emergency Note", specialty: "emergency_medicine",
    workflow: EMERGENCY_WORKFLOW,
    fields: [
      I("arrival_time", "Arrival — Time"),
      S("arrival_mode", "Arrival Mode", ["Walk-In", "Ambulance", "Private Vehicle", "Other"]),
      S("triage_category", "Triage Category", ["1 — Immediate (Resuscitation)", "2 — Emergent", "3 — Urgent", "4 — Less Urgent", "5 — Non-Urgent"]),
      N("pain_score", "Triage Pain Score (0–10)"),
      T("triage_note", "Triage — Chief Complaint & Initial Vitals"),
      T("assessment", "Assessment — History & Examination"),
      T("investigations", "Investigations & Results"),
      T("treatment", "Treatment Given"),
      T("reassessment", "Reassessment — Response to Treatment"),
      DISPO(),
      T("follow_up", "Follow-Up / Instructions"),
    ],
  },
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
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("birth_history", "Birth History"), T("feeding", "Feeding / Nutrition"), S("immunizations_uptodate", "Immunizations Up to Date", ["Yes", "No", "Partially"]), T("immunization_history", "Immunization History"), T("development", "Developmental Milestones"), T("school_performance", "School / Nursery Performance"), N("weight_kg", "Weight (kg)"), N("height_cm", "Height / Length (cm)"), N("head_circumference_cm", "Head Circumference (cm)"), T("exam_findings", "Pediatric Examination Findings"), T("assessment", "Assessment"), T("plan", "Treatment & Plan"), I("follow_up", "Follow-Up")],
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
    fields: [I("lmp", "Last Menstrual Period"), I("edd", "Estimated Due Date"), N("gravidity", "Gravidity"), N("parity", "Parity"), N("abortions", "Abortions / Miscarriages"), N("living_children", "Living Children"), I("gestational_age", "Gestational Age"), T("ob_history", "Obstetric History"), T("previous_c_sections", "Previous C-Sections"), T("pregnancy_complications", "Pregnancy Complications"), T("medical_history", "Medical History"), T("surgical_history", "Surgical History"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("exam_findings", "Physical Examination Findings"), T("dating_scan", "Dating Scan"), T("initial_labs", "Initial Laboratory Results"), T("risk_assessment", "Risk Assessment"), T("plan", "Plan")],
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
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("ob_history", "Obstetric History"), N("gravidity", "Gravidity"), N("parity", "Parity"), T("menstrual_history", "Menstrual / Gynecological History"), T("contraceptive_history", "Contraceptive History"), T("pmh", "Past Medical History"), T("exam_findings", "Physical Examination Findings"), T("assessment", "Assessment"), T("plan", "Treatment & Plan"), I("follow_up", "Follow-Up")],
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
    key: "obgyn_gyn_operative_note", label: "Gynecologic Operative Note", specialty: "obstetrics_gynecology",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), I("procedure", "Procedure"), I("surgeon", "Surgeon"), T("assistants", "Assistants"), S("anesthesia", "Anesthesia", ["General", "Regional", "Local", "Monitored Anesthesia Care", "Sedation", "Other"]), T("indication", "Indication"), T("findings", "Findings"), T("procedure_details", "Procedure Details"), T("specimens", "Specimens"), I("estimated_blood_loss", "Estimated Blood Loss"), T("complications", "Complications"), T("postop_plan", "Post-Operative Plan")],
  },
  {
    key: "obgyn_gyn_preop_assessment", label: "Gynecologic Pre-Operative Assessment", specialty: "obstetrics_gynecology",
    fields: [I("planned_procedure", "Planned Procedure"), T("indication", "Indication"), T("comorbidities", "Comorbidities"), T("labs_reviewed", "Laboratory Results Reviewed"), T("risk_assessment", "Risk Assessment"), S("clearance", "Clearance", ["Cleared", "Cleared with Conditions", "Not Cleared", "Pending"]), T("preop_instructions", "Pre-Operative Instructions")],
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

const CARDIOLOGY_DOCS = [
  {
    key: "cardio_consultation", label: "Cardiology Consultation", specialty: "cardiology",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("cardiac_risk_factors", "Cardiac Risk Factors"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("exam_findings", "Cardiovascular Examination Findings"), T("ecg_findings", "ECG Findings"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "cardio_followup", label: "Cardiology Follow-Up", specialty: "cardiology",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Symptoms (Angina / Dyspnea / Palpitations / Syncope)"), S("functional_class", "NYHA Functional Class", ["I", "II", "III", "IV"]), T("exam_findings", "Examination Findings"), T("investigations_reviewed", "Investigations Reviewed"), T("assessment", "Assessment"), T("plan", "Plan"), I("next_visit", "Next Visit")],
  },
  {
    key: "cardio_admission_note", label: "Cardiac Admission Note", specialty: "cardiology",
    fields: [T("admission_reason", "Reason for Admission"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("cardiac_history", "Cardiac History"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("admission_diagnosis", "Admission Diagnosis"), T("exam_findings", "Examination Findings"), T("vitals", "Vital Signs on Admission"), T("investigations_ordered", "Investigations Ordered"), T("admission_plan", "Admission Plan")],
  },
  {
    key: "cardio_progress_note", label: "Cardiac Progress Note", specialty: "cardiology",
    fields: [T("overnight_events", "Overnight Events"), T("symptoms", "Symptoms"), T("vitals", "Vital Signs"), T("exam_findings", "Examination Findings"), T("telemetry", "Telemetry / Monitoring Findings"), T("investigations", "Investigations"), T("medications_review", "Medications Review"), T("plan", "Plan")],
  },
  {
    key: "cardio_discharge_summary", label: "Cardiac Discharge Summary", specialty: "cardiology",
    fields: [T("admission_diagnosis", "Admission Diagnosis"), T("discharge_diagnosis", "Discharge Diagnosis"), T("hospital_course", "Hospital Course"), T("procedures_performed", "Procedures Performed"), T("discharge_condition", "Condition at Discharge"), T("discharge_medications", "Discharge Medications"), T("follow_up", "Follow-Up"), T("instructions", "Instructions"), T("pending_results", "Pending Results")],
  },
  {
    key: "cardio_procedure_note", label: "Cardiac Procedure Note", specialty: "cardiology",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), I("access_site", "Access Site"), T("complications", "Complications"), T("patient_condition", "Patient Condition"), T("post_procedure_plan", "Post-Procedure Plan")],
  },
  {
    key: "cardio_ecg_report", label: "ECG Report", specialty: "cardiology",
    fields: [T("indication", "Indication"), I("heart_rate", "Heart Rate (bpm)"), S("rhythm", "Rhythm", ["Sinus", "Atrial Fibrillation", "SVT", "Atrial Flutter", "Ventricular Tachycardia", "Other"]), I("pr_interval", "PR Interval (ms)"), I("qrs_duration", "QRS Duration (ms)"), I("qt_qtc", "QT / QTc (ms)"), I("axis", "Axis"), T("st_t_changes", "ST-Segment / T-Wave Changes"), T("ecg_findings", "Findings"), T("ecg_interpretation", "Interpretation"), T("clinical_comment", "Clinical Comment")],
  },
  {
    key: "cardio_echo_report", label: "Echocardiography Report", specialty: "cardiology",
    fields: [T("indication", "Indication"), I("lvef", "LVEF (%)"), S("lv_function", "LV Systolic Function", ["Normal", "Mildly Reduced", "Moderately Reduced", "Severely Reduced"]), T("lv_dimensions", "LV Dimensions"), T("wall_motion_abnormalities", "Wall Motion Abnormalities"), T("valve_findings", "Valve Findings"), T("la_size", "Left Atrium Size"), T("aortic_root", "Aortic Root"), T("pericardium", "Pericardium"), T("diastolic_function", "Diastolic Function"), T("echo_findings", "Findings"), T("echo_conclusion", "Conclusion"), T("recommendations", "Recommendations")],
  },
  {
    key: "cardio_holter_report", label: "Holter Report", specialty: "cardiology",
    fields: [T("indication", "Indication"), I("monitoring_duration", "Monitoring Duration (hours)"), I("total_beats", "Total Beats"), N("min_hr", "Minimum Heart Rate"), N("max_hr", "Maximum Heart Rate"), N("avg_hr", "Average Heart Rate"), T("pauses", "Pauses"), T("ectopy", "Ectopy / Premature Beats"), T("arrhythmias_detected", "Arrhythmias Detected"), T("st_segment_changes", "ST-Segment Changes"), T("hrv_analysis", "Heart Rate Variability Analysis"), T("conclusion", "Conclusion"), T("recommendations", "Recommendations")],
  },
  {
    key: "cardio_stress_test_report", label: "Stress Test Report", specialty: "cardiology",
    fields: [T("indication", "Indication"), I("protocol", "Protocol"), I("exercise_duration", "Exercise Duration (min)"), N("max_hr", "Maximum Heart Rate"), I("rest_bp", "Resting Blood Pressure"), I("peak_bp", "Peak Blood Pressure"), N("workload_mets", "Workload (METs)"), T("symptoms_during_test", "Symptoms During Test"), T("ecg_changes", "ECG Changes"), I("reason_for_termination", "Reason for Termination"), S("result", "Result", ["Negative", "Positive", "Inconclusive", "Equivocal"]), T("conclusion", "Conclusion")],
  },
  {
    key: "cardio_cath_report", label: "Cardiac Catheterization Report", specialty: "cardiology",
    fields: [T("indication", "Indication"), S("access_site", "Access Site", ["Femoral", "Radial", "Brachial"]), T("catheters_used", "Catheters Used"), T("coronary_anatomy", "Coronary Anatomy / Dominance"), T("lm", "Left Main"), T("lad", "LAD"), T("lcx", "LCx"), T("rca", "RCA"), T("grafts", "Grafts (if CABG)"), T("pressures", "Hemodynamic Pressures"), T("lv_function", "LV Function"), I("contrast_volume", "Contrast Volume (ml)"), T("complications", "Complications"), T("findings_summary", "Findings Summary"), T("recommendations", "Recommendations")],
  },
  {
    key: "cardio_referral", label: "Cardiology Referral", specialty: "cardiology",
    fields: [I("referral_to", "Referred To"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History")],
  },
];

const NEUROLOGY_DOCS = [
  {
    key: "neuro_consultation", label: "Neurology Consultation", specialty: "neurology",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("cranial_nerves", "Cranial Nerve Examination"), T("motor_exam", "Motor Examination"), T("sensory_exam", "Sensory Examination"), T("reflexes", "Reflexes"), T("coordination", "Coordination / Cerebellar Examination"), T("gait", "Gait"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "neuro_followup", label: "Neurology Follow-Up", specialty: "neurology",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("neuro_exam", "Neurological Examination"), T("investigations_reviewed", "Investigations Reviewed"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "neuro_admission_note", label: "Neurology Admission Note", specialty: "neurology",
    fields: [T("admission_reason", "Reason for Admission"), T("hpi", "History of Present Illness"), T("neuro_exam", "Neurological Examination"), T("admission_diagnosis", "Admission Diagnosis"), T("vitals", "Vital Signs"), T("investigations_ordered", "Investigations Ordered"), T("admission_plan", "Admission Plan")],
  },
  {
    key: "neuro_progress_note", label: "Neurology Progress Note", specialty: "neurology",
    fields: [T("overnight_events", "Overnight Events"), T("neuro_exam", "Neurological Examination"), I("consciousness_level", "Level of Consciousness"), T("investigations", "Investigations"), T("imaging_review", "Imaging Review"), T("plan", "Plan")],
  },
  {
    key: "neuro_discharge_summary", label: "Neurology Discharge Summary", specialty: "neurology",
    fields: [T("admission_diagnosis", "Admission Diagnosis"), T("discharge_diagnosis", "Discharge Diagnosis"), T("hospital_course", "Hospital Course"), T("discharge_neuro_status", "Neurological Status at Discharge"), T("discharge_medications", "Discharge Medications"), T("follow_up", "Follow-Up"), T("instructions", "Instructions")],
  },
  {
    key: "neuro_procedure_note", label: "Neurologic Procedure Note", specialty: "neurology",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), T("specimens", "Specimens"), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "neuro_eeg_report", label: "EEG Report", specialty: "neurology",
    fields: [T("indication", "Indication"), I("recording_duration", "Recording Duration"), T("background_activity", "Background Activity"), T("sleep_stages", "Sleep Stages"), T("epileptiform_discharges", "Epileptiform Discharges"), T("focal_findings", "Focal Findings"), T("activation_procedures", "Activation Procedures (HV / Photic)"), T("eeg_findings", "Findings"), T("eeg_conclusion", "Conclusion")],
  },
  {
    key: "neuro_emg_ncs_report", label: "EMG / NCS Report", specialty: "neurology",
    fields: [T("indication", "Indication"), T("nerves_studied", "Nerves Studied"), T("motor_ncs", "Motor NCS Results"), T("sensory_ncs", "Sensory NCS Results"), T("emg_findings", "EMG Findings"), T("needle_exam", "Needle Examination"), T("conclusion", "Conclusion"), T("recommendations", "Recommendations")],
  },
  {
    key: "neuro_stroke_record", label: "Stroke Assessment / Record", specialty: "neurology",
    fields: [I("onset_time", "Symptom Onset Time"), I("last_known_well", "Last Known Well"), N("nihss_score", "NIHSS Score"), T("fast_symptoms", "FAST / Symptoms at Onset"), T("imaging_done", "Imaging Performed"), T("imaging_findings", "Imaging Findings"), S("thrombolysis", "Thrombolysis", ["Given", "Not Given — Outside Window", "Not Given — Contraindicated", "Considered"]), S("thrombectomy", "Thrombectomy", ["Performed", "Not Performed", "Referred"]), S("etiology", "Etiology", ["Large Artery Atherosclerosis", "Cardioembolic", "Small Vessel", "Other Determined", "Undetermined"]), T("deficits", "Residual Deficits"), T("management", "Management"), T("secondary_prevention", "Secondary Prevention Plan")],
  },
  {
    key: "neuro_seizure_followup", label: "Seizure / Epilepsy Follow-Up", specialty: "neurology",
    fields: [I("epilepsy_duration", "Epilepsy Duration"), T("seizure_frequency", "Current Seizure Frequency"), T("seizure_types", "Seizure Types"), T("triggers", "Triggers"), S("medication_adherence", "Medication Adherence", ["Good", "Partial", "Poor"]), T("side_effects", "Side Effects"), T("aed_levels", "Antiepileptic Drug Levels"), I("driving_status", "Driving Status"), T("investigation_results", "Investigation Results"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "neuro_referral", label: "Neurology Referral", specialty: "neurology",
    fields: [I("referral_to", "Referred To"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History")],
  },
];

const PSYCHIATRY_DOCS = [
  {
    key: "psy_consultation", label: "Psychiatric Consultation", specialty: "psychiatry", confidential: true,
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("psychiatric_history", "Psychiatric History"), T("medical_history", "Medical History"), T("medications", "Current Medications"), T("substance_history", "Substance Use History"), T("family_psych_history", "Family Psychiatric History"), T("social_history", "Social History"), T("mental_status_exam", "Mental Status Examination"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "psy_assessment", label: "Psychiatric Assessment", specialty: "psychiatry", confidential: true,
    fields: [T("presenting_problem", "Presenting Problem"), T("history_present_illness", "History of Present Illness"), T("psychiatric_history", "Psychiatric History"), T("medication_history", "Medication History"), T("risk_screening", "Risk Screening"), T("mse_appearance", "MSE — Appearance & Behavior"), T("mse_speech", "MSE — Speech"), T("mse_mood", "MSE — Mood"), T("mse_affect", "MSE — Affect"), T("mse_thought", "MSE — Thought Form & Content"), T("mse_perception", "MSE — Perception"), T("mse_cognition", "MSE — Cognition"), T("mse_insight", "MSE — Insight & Judgment"), T("diagnosis", "Diagnosis"), T("formulation", "Formulation"), T("plan", "Plan")],
  },
  {
    key: "psy_followup", label: "Psychiatric Follow-Up", specialty: "psychiatry", confidential: true,
    fields: [T("interval_history", "Interval History"), T("current_symptoms", "Current Symptoms"), S("adherence", "Medication Adherence", ["Good", "Partial", "Poor"]), T("side_effects", "Side Effects"), T("functioning", "Functioning"), T("mse_summary", "Mental Status Summary"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "psy_progress_note", label: "Psychiatric Progress Note", specialty: "psychiatry", confidential: true,
    fields: [T("interval_events", "Interval Events"), T("mental_status", "Mental Status"), T("medication_response", "Medication Response"), T("risks_reviewed", "Risks Reviewed"), T("plan", "Plan")],
  },
  {
    key: "psy_treatment_plan", label: "Mental Health Treatment Plan", specialty: "psychiatry", confidential: true,
    fields: [T("diagnoses", "Diagnoses"), T("short_term_goals", "Short-Term Goals"), T("long_term_goals", "Long-Term Goals"), T("interventions", "Interventions"), T("therapy_modalities", "Therapy Modalities"), T("medication_plan", "Medication Plan"), I("session_frequency", "Session Frequency"), T("crisis_plan", "Crisis Plan"), I("review_date", "Review Date")],
  },
  {
    key: "psy_medication_followup", label: "Medication Follow-Up", specialty: "psychiatry", confidential: true,
    fields: [T("current_medications", "Current Medications & Doses"), T("response", "Response to Medication"), T("side_effects", "Side Effects"), T("labs_monitoring", "Laboratory Monitoring"), S("adherence", "Adherence", ["Good", "Partial", "Poor"]), T("adjustments_made", "Adjustments Made"), I("next_review", "Next Review")],
  },
  {
    key: "psy_risk_assessment", label: "Risk Assessment", specialty: "psychiatry", confidential: true,
    fields: [T("risk_domains", "Risk Domains (Suicide / Self-Harm / Violence / Neglect)"), T("ideation_screening", "Ideation Screening"), T("intent_plan_means", "Intent, Plan & Means"), T("protective_factors", "Protective Factors"), T("historical_risk", "Historical Risk Factors"), S("current_risk_level", "Current Risk Level", ["Low", "Moderate", "High", "Imminent"]), T("interventions", "Interventions"), T("crisis_plan", "Crisis / Safety Plan"), T("safety_contract", "Safety Agreement"), I("supervision_level", "Supervision Level")],
  },
  {
    key: "psy_crisis_assessment", label: "Crisis Assessment", specialty: "psychiatry", confidential: true,
    fields: [T("crisis_presenting", "Presenting Crisis"), T("crisis_context", "Context & Precipitants"), T("mental_status", "Mental Status"), T("risk_assessment", "Risk Assessment"), T("substances_involved", "Substances Involved"), T("supports_available", "Supports Available"), S("disposition", "Disposition", ["Outpatient Management", "Emergency Department Referral", "Voluntary Admission", "Involuntary Admission", "Intensive Follow-Up"]), T("safety_plan", "Safety Plan"), T("follow_up", "Follow-Up")],
  },
  {
    key: "psy_discharge_summary", label: "Psychiatric Discharge Summary", specialty: "psychiatry", confidential: true,
    fields: [T("admission_reason", "Reason for Admission"), T("diagnoses", "Diagnoses"), T("hospital_course", "Hospital Course"), T("medications_at_discharge", "Medications at Discharge"), T("risk_status_at_discharge", "Risk Status at Discharge"), T("follow_up", "Follow-Up"), T("crisis_plan", "Crisis Plan")],
  },
  {
    key: "psy_referral", label: "Psychiatric Referral", specialty: "psychiatry", confidential: true,
    fields: [I("referral_to", "Referred To"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History")],
  },
];

const OPHTHALMOLOGY_DOCS = [
  {
    key: "ophth_consultation", label: "Ophthalmology Consultation", specialty: "ophthalmology",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("ocular_history", "Ocular History"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), I("va_right", "Visual Acuity — Right Eye"), I("va_left", "Visual Acuity — Left Eye"), T("pupils", "Pupils"), T("ocular_motility", "Ocular Motility"), T("anterior_segment", "Anterior Segment"), T("posterior_segment", "Posterior Segment / Fundus Findings"), I("iop_right", "Intraocular Pressure — Right Eye"), I("iop_left", "Intraocular Pressure — Left Eye"), T("investigations", "Ophthalmic Investigations"), T("assessment", "Assessment"), T("plan", "Treatment & Plan"), I("follow_up", "Follow-Up")],
  },
  {
    key: "ophth_followup", label: "Ophthalmology Follow-Up", specialty: "ophthalmology",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), I("va_right", "Visual Acuity — Right Eye"), I("va_left", "Visual Acuity — Left Eye"), I("iop", "Intraocular Pressure"), T("exam_findings", "Examination Findings"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "ophth_procedure_note", label: "Eye Procedure Note", specialty: "ophthalmology",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "ophth_operative_note", label: "Ophthalmic Operative Note", specialty: "ophthalmology",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), I("procedure", "Procedure"), I("surgeon", "Surgeon"), T("assistants", "Assistants"), S("anesthesia", "Anesthesia", ["General", "Regional (Peribulbar / Retrobulbar)", "Topical", "Other"]), T("indication", "Indication"), T("technique_details", "Technique Details"), T("findings", "Findings"), T("specimens", "Specimens"), T("implants", "Implants (e.g. IOL Details)"), I("estimated_blood_loss", "Estimated Blood Loss"), T("complications", "Complications"), T("postop_plan", "Post-Operative Plan")],
  },
  {
    key: "ophth_preop_assessment", label: "Pre-Operative Assessment (Ophthalmology)", specialty: "ophthalmology",
    fields: [I("planned_procedure", "Planned Procedure"), T("indication", "Indication"), T("comorbidities", "Comorbidities"), T("ocular_history", "Ocular History"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("labs", "Laboratory Results"), T("risk_assessment", "Risk Assessment"), S("clearance", "Clearance", ["Cleared", "Cleared with Conditions", "Not Cleared", "Pending"]), T("preop_instructions", "Pre-Operative Instructions")],
  },
  {
    key: "ophth_postop_note", label: "Post-Operative Note (Ophthalmology)", specialty: "ophthalmology",
    fields: [I("procedure_date", "Procedure Date"), I("postop_day", "Post-Operative Day"), T("vision_status", "Vision Status"), I("iop", "Intraocular Pressure"), T("wound_condition", "Wound / Incision Condition"), T("medications", "Post-Operative Drops / Medications"), T("complications", "Complications"), T("plan", "Plan")],
  },
  {
    key: "ophth_discharge_summary", label: "Ophthalmology Discharge Summary", specialty: "ophthalmology",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), T("procedure", "Procedure Performed"), T("hospital_course", "Hospital Course"), T("eye_status_discharge", "Eye Status at Discharge"), T("discharge_medications", "Discharge Medications"), T("eye_drops", "Eye Drop Regimen"), T("follow_up", "Follow-Up"), T("instructions", "Instructions")],
  },
  {
    key: "ophth_diagnostic_report", label: "Visual / Diagnostic Test Report", specialty: "ophthalmology",
    fields: [S("test_type", "Test Type", ["Visual Acuity", "Visual Fields", "OCT", "Fundus Photography", "Fluorescein Angiography", "Biometry", "Other"]), T("indication", "Indication"), T("results_right_eye", "Results — Right Eye"), T("results_left_eye", "Results — Left Eye"), T("findings", "Findings"), T("interpretation", "Interpretation"), T("recommendations", "Recommendations")],
  },
  {
    key: "ophth_referral", label: "Ophthalmology Referral", specialty: "ophthalmology",
    fields: [I("referral_to", "Referred To"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History")],
  },
];

const DERMATOLOGY_DOCS = [
  {
    key: "derm_consultation", label: "Dermatology Consultation", specialty: "dermatology", photos: true,
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("lesion_description", "Lesion Description"), T("distribution", "Distribution"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("family_history", "Family History"), T("exam_findings", "Examination Findings"), T("differential", "Differential Diagnosis"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "derm_followup", label: "Dermatology Follow-Up", specialty: "dermatology", photos: true,
    fields: [T("interval_history", "Interval History"), T("response_to_treatment", "Response to Treatment"), T("current_exam", "Current Examination"), T("side_effects", "Side Effects"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "derm_lesion_assessment", label: "Lesion Assessment", specialty: "dermatology", photos: true,
    fields: [I("lesion_location", "Lesion Location"), I("size", "Size"), I("morphology", "Morphology"), I("color", "Color"), I("borders", "Borders"), I("surface", "Surface"), T("symptoms", "Symptoms (Itch / Pain / Bleeding)"), I("duration", "Duration"), T("evolution", "Evolution / Change Over Time"), T("risk_factors", "Risk Factors (Sun Exposure etc.)"), T("dermoscopy_findings", "Dermoscopy Findings"), T("differential_diagnosis", "Differential Diagnosis"), T("assessment", "Assessment"), T("management", "Management")],
  },
  {
    key: "derm_skin_procedure_note", label: "Skin Procedure Note", specialty: "dermatology", photos: true,
    fields: [I("procedure", "Procedure"), I("lesion_location", "Lesion Location"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("anesthesia", "Anesthesia"), T("findings", "Findings"), T("specimens_sent", "Specimens Sent"), T("closure", "Closure"), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "derm_biopsy_note", label: "Biopsy Procedure Note", specialty: "dermatology", photos: true,
    fields: [S("biopsy_type", "Biopsy Type", ["Shave", "Punch", "Excisional", "Incisional", "Other"]), I("lesion_location", "Lesion Location"), T("anesthesia", "Anesthesia"), T("technique", "Technique"), T("specimens", "Specimens"), T("hemostasis", "Hemostasis"), I("sutures", "Sutures"), T("wound_care", "Wound Care Instructions"), T("complications", "Complications")],
  },
  {
    key: "derm_operative_note", label: "Dermatologic Operative Note", specialty: "dermatology",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), I("procedure", "Procedure"), I("surgeon", "Surgeon"), T("assistants", "Assistants"), S("anesthesia", "Anesthesia", ["General", "Regional", "Local", "Sedation", "Other"]), T("technique_details", "Technique Details"), T("specimens", "Specimens"), T("flap_graft", "Flap / Graft Details"), I("estimated_blood_loss", "Estimated Blood Loss"), T("complications", "Complications"), T("postop_plan", "Post-Operative Plan")],
  },
  {
    key: "derm_pathology_request", label: "Pathology Request", specialty: "dermatology",
    fields: [T("specimens_sent", "Specimens Sent"), T("clinical_history", "Clinical History"), T("lesion_descriptions", "Lesion Descriptions"), T("site_details", "Site Details"), T("suspected_diagnosis", "Suspected Diagnosis"), S("urgency", "Urgency", ["Routine", "Urgent"])],
  },
  {
    key: "derm_discharge_followup", label: "Dermatology Discharge / Follow-Up", specialty: "dermatology", photos: true,
    fields: [T("diagnoses", "Diagnoses"), T("treatment_summary", "Treatment Summary"), T("response", "Response"), T("home_care", "Home Skin Care"), T("discharge_medications", "Discharge Medications"), T("follow_up", "Follow-Up"), T("warning_signs", "Warning Signs")],
  },
  {
    key: "derm_referral", label: "Dermatology Referral", specialty: "dermatology",
    fields: [I("referral_to", "Referred To"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History")],
  },
];

const ORTHOPEDICS_DOCS = [
  {
    key: "ortho_consultation", label: "Orthopedic Consultation", specialty: "orthopedics",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("injury_mechanism", "Injury Mechanism"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("exam_findings", "Examination Findings"), T("rom", "Range of Motion"), T("neurovascular_status", "Neurovascular Status"), T("imaging_reviewed", "Imaging Reviewed"), T("working_diagnosis", "Working Diagnosis"), T("plan", "Plan")],
  },
  {
    key: "ortho_followup", label: "Orthopedic Follow-Up", specialty: "orthopedics",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("exam_findings", "Examination Findings"), T("imaging", "Imaging"), T("implant_hardware_status", "Implant / Hardware Status"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "ortho_fracture_assessment", label: "Fracture Assessment", specialty: "orthopedics",
    fields: [T("injury_mechanism", "Injury Mechanism"), I("injury_datetime", "Date & Time of Injury"), I("fracture_location", "Fracture Location"), S("fracture_pattern", "Fracture Pattern", ["Transverse", "Oblique", "Spiral", "Comminuted", "Segmental", "Impacted", "Avulsion", "Compression", "Greenstick", "Other"]), S("open_closed", "Open / Closed", ["Closed", "Open Grade I", "Open Grade II", "Open Grade III"]), T("skin_condition", "Skin Condition Over Fracture"), T("neurovascular_status", "Neurovascular Status"), T("associated_injuries", "Associated Injuries"), T("imaging_findings", "Imaging Findings"), I("classification", "Classification (e.g. AO / Garden)"), T("treatment_plan", "Treatment Plan")],
  },
  {
    key: "ortho_injury_assessment", label: "Injury Assessment", specialty: "orthopedics",
    fields: [I("injury_datetime", "Date & Time of Injury"), T("mechanism", "Mechanism"), I("location", "Injury Location"), T("tissue_involvement", "Tissue Involvement (Bone / Ligament / Tendon / Muscle)"), T("neurovascular", "Neurovascular Assessment"), T("imaging", "Imaging"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "ortho_preop_assessment", label: "Pre-Operative Assessment (Orthopedics)", specialty: "orthopedics",
    fields: [I("planned_procedure", "Planned Procedure"), T("indication", "Indication"), T("comorbidities", "Comorbidities"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("labs", "Laboratory Results"), T("imaging", "Imaging"), T("risk_assessment", "Risk Assessment (incl. DVT / Infection)"), S("clearance", "Clearance", ["Cleared", "Cleared with Conditions", "Not Cleared", "Pending"]), T("preop_instructions", "Pre-Operative Instructions")],
  },
  {
    key: "ortho_operative_note", label: "Operative Note (Orthopedics)", specialty: "orthopedics",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), I("procedure", "Procedure"), I("surgeon", "Surgeon"), T("assistants", "Assistants"), S("anesthesia", "Anesthesia", ["General", "Regional", "Local", "Sedation", "Other"]), T("indication", "Indication"), T("findings", "Findings"), T("procedure_details", "Procedure Details"), T("implants_hardware", "Implants / Hardware Used"), T("specimens", "Specimens"), I("estimated_blood_loss", "Estimated Blood Loss"), I("tourniquet_time", "Tourniquet Time"), T("complications", "Complications"), T("drains", "Drains"), T("patient_condition", "Patient Condition"), T("postop_plan", "Post-Operative Plan")],
  },
  {
    key: "ortho_procedure_note", label: "Procedure Note (Orthopedics)", specialty: "orthopedics",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), S("anesthesia", "Anesthesia", ["General", "Regional", "Local", "Sedation", "Other"]), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "ortho_postop_note", label: "Post-Operative Note (Orthopedics)", specialty: "orthopedics",
    fields: [I("procedure_date", "Procedure Date"), I("postop_day", "Post-Operative Day"), T("vitals", "Vital Signs"), T("wound_condition", "Wound Condition"), T("drain_output", "Drain Output"), T("neurovascular_status", "Neurovascular Status"), T("xray_review", "Post-Operative X-Ray Review"), T("pain_control", "Pain Control"), T("mobilization", "Mobilization / Weight Bearing"), T("complications", "Complications"), T("plan", "Plan")],
  },
  {
    key: "ortho_daily_progress", label: "Daily Orthopedic Progress Note", specialty: "orthopedics",
    fields: [I("postop_day", "Post-Operative Day"), T("overnight_events", "Overnight Events"), T("wound_exam", "Wound Examination"), T("neurovascular", "Neurovascular Status"), T("labs", "Laboratory Results"), T("imaging", "Imaging"), T("dvt_prophylaxis", "DVT Prophylaxis"), T("antibiotics", "Antibiotics"), T("plan", "Plan")],
  },
  {
    key: "ortho_discharge_summary", label: "Discharge Summary (Orthopedics)", specialty: "orthopedics",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), T("procedure", "Procedure Performed"), T("hospital_course", "Hospital Course"), S("weight_bearing", "Weight Bearing Status", ["Non-Weight Bearing", "Partial / Toe-Touch", "Full Weight Bearing", "As Tolerated"]), T("immobilization", "Immobilization / Cast / Brace"), T("discharge_medications", "Discharge Medications"), T("physio_referral", "Physiotherapy Referral"), T("follow_up", "Follow-Up"), T("warning_signs", "Warning Signs")],
  },
  {
    key: "ortho_rehab_plan", label: "Rehabilitation Plan", specialty: "orthopedics",
    fields: [T("diagnosis", "Diagnosis"), T("current_function", "Current Functional Status"), T("goals", "Rehabilitation Goals"), S("weight_bearing_status", "Weight Bearing Status", ["Non-Weight Bearing", "Partial / Toe-Touch", "Full Weight Bearing", "As Tolerated"]), T("physio_program", "Physiotherapy Program"), T("exercises", "Exercises"), T("assistive_devices", "Assistive Devices"), T("pain_management", "Pain Management"), I("expected_timeline", "Expected Timeline"), T("follow_up", "Follow-Up")],
  },
];

const UROLOGY_DOCS = [
  {
    key: "uro_consultation", label: "Urology Consultation", specialty: "urology",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("urinary_symptoms", "Urinary Symptoms (LUTS)"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("exam_findings", "Examination Findings"), T("urinalysis", "Urinalysis"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "uro_followup", label: "Urology Follow-Up", specialty: "urology",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("exam_findings", "Examination Findings"), T("investigations", "Investigations"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "uro_procedure_note", label: "Urologic Procedure Note", specialty: "urology",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), T("specimens", "Specimens"), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "uro_operative_note", label: "Operative Note (Urology)", specialty: "urology",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), I("procedure", "Procedure"), I("surgeon", "Surgeon"), T("assistants", "Assistants"), S("anesthesia", "Anesthesia", ["General", "Regional", "Local", "Sedation", "Other"]), T("indication", "Indication"), T("findings", "Findings"), T("procedure_details", "Procedure Details"), T("specimens", "Specimens"), I("estimated_blood_loss", "Estimated Blood Loss"), T("complications", "Complications"), T("postop_plan", "Post-Operative Plan")],
  },
  {
    key: "uro_preop_assessment", label: "Pre-Operative Assessment (Urology)", specialty: "urology",
    fields: [I("planned_procedure", "Planned Procedure"), T("indication", "Indication"), T("comorbidities", "Comorbidities"), T("medications", "Current Medications"), T("labs", "Laboratory Results"), T("imaging", "Imaging"), T("risk_assessment", "Risk Assessment"), S("clearance", "Clearance", ["Cleared", "Cleared with Conditions", "Not Cleared", "Pending"]), T("preop_instructions", "Pre-Operative Instructions")],
  },
  {
    key: "uro_postop_note", label: "Post-Operative Note (Urology)", specialty: "urology",
    fields: [I("procedure_date", "Procedure Date"), I("postop_day", "Post-Operative Day"), T("vitals", "Vital Signs"), T("catheter_status", "Catheter Status"), T("urine_output", "Urine Output"), T("wound", "Wound"), T("pain", "Pain Control"), T("complications", "Complications"), T("plan", "Plan")],
  },
  {
    key: "uro_catheter_device_record", label: "Catheter / Device Record", specialty: "urology",
    fields: [S("device_type", "Device Type", ["Urethral Catheter", "Suprapubic Catheter", "Ureteric Stent", "Nephrostomy Tube", "Penile Prosthesis", "Other"]), I("size", "Size (Fr / Ch)"), I("insertion_datetime", "Insertion Date & Time"), I("inserted_by", "Inserted By"), I("insertion_site", "Insertion Site"), T("indication", "Indication"), T("drainage", "Drainage / Function"), T("complications", "Complications"), T("removal_plan", "Removal / Change Plan")],
  },
  {
    key: "uro_discharge_summary", label: "Discharge Summary (Urology)", specialty: "urology",
    fields: [T("admission_diagnosis", "Admission Diagnosis"), T("discharge_diagnosis", "Discharge Diagnosis"), T("procedures", "Procedures Performed"), T("hospital_course", "Hospital Course"), T("catheter_instructions", "Catheter / Device Instructions"), T("discharge_medications", "Discharge Medications"), T("follow_up", "Follow-Up"), T("warning_signs", "Warning Signs")],
  },
  {
    key: "uro_referral", label: "Urology Referral", specialty: "urology",
    fields: [I("referral_to", "Referred To"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History")],
  },
];

const ENT_DOCS = [
  {
    key: "ent_consultation", label: "ENT Consultation", specialty: "ent",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("ent_history", "ENT History"), T("pmh", "Past Medical History"), T("exam_findings", "Examination — Ears / Nose / Throat / Neck"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "ent_followup", label: "ENT Follow-Up", specialty: "ent",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("exam_findings", "Examination Findings"), T("investigations", "Investigations"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "ent_procedure_note", label: "ENT Procedure Note", specialty: "ent",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), T("specimens", "Specimens"), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "ent_operative_note", label: "Operative Note (ENT)", specialty: "ent",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), I("procedure", "Procedure"), I("surgeon", "Surgeon"), T("assistants", "Assistants"), S("anesthesia", "Anesthesia", ["General", "Regional", "Local", "Sedation", "Other"]), T("indication", "Indication"), T("findings", "Findings"), T("procedure_details", "Procedure Details"), T("specimens", "Specimens"), I("estimated_blood_loss", "Estimated Blood Loss"), T("complications", "Complications"), T("postop_plan", "Post-Operative Plan")],
  },
  {
    key: "ent_preop_assessment", label: "Pre-Operative Assessment (ENT)", specialty: "ent",
    fields: [I("planned_procedure", "Planned Procedure"), T("indication", "Indication"), T("comorbidities", "Comorbidities"), T("medications", "Current Medications"), T("labs", "Laboratory Results"), T("imaging", "Imaging"), S("clearance", "Clearance", ["Cleared", "Cleared with Conditions", "Not Cleared", "Pending"]), T("preop_instructions", "Pre-Operative Instructions")],
  },
  {
    key: "ent_postop_note", label: "Post-Operative Note (ENT)", specialty: "ent",
    fields: [I("procedure_date", "Procedure Date"), I("postop_day", "Post-Operative Day"), T("vitals", "Vital Signs"), T("wound", "Wound"), T("airway_status", "Airway Status"), T("packing_status", "Nasal Packing / Packs Status"), T("pain", "Pain Control"), T("complications", "Complications"), T("plan", "Plan")],
  },
  {
    key: "ent_audiology_report", label: "Audiology / Diagnostic Report", specialty: "ent",
    fields: [S("test_type", "Test Type", ["Pure Tone Audiometry", "Tympanometry", "OAE", "ABR", "Speech Audiometry", "Nasal Endoscopy", "Other"]), T("indication", "Indication"), T("results_right", "Results — Right"), T("results_left", "Results — Left"), T("interpretation", "Interpretation"), T("recommendations", "Recommendations")],
  },
  {
    key: "ent_discharge_summary", label: "Discharge Summary (ENT)", specialty: "ent",
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), T("procedure", "Procedure Performed"), T("hospital_course", "Hospital Course"), T("discharge_medications", "Discharge Medications"), T("wound_care", "Wound / Pack Care"), T("follow_up", "Follow-Up"), T("warning_signs", "Warning Signs")],
  },
  {
    key: "ent_referral", label: "ENT Referral", specialty: "ent",
    fields: [I("referral_to", "Referred To"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History")],
  },
];

const PULMONOLOGY_DOCS = [
  {
    key: "pulm_consultation", label: "Pulmonary Consultation", specialty: "pulmonology",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "Respiratory History — History of Present Illness"), T("respiratory_symptoms", "Cough / Sputum / Dyspnea / Wheeze / Hemoptysis"), N("spo2", "Oxygen Saturation (%)"), T("smoking_history", "Smoking History"), T("pmh", "Past Medical History"), T("occupational_exposure", "Occupational / Environmental Exposure"), T("exam_findings", "Chest Examination Findings"), T("chest_imaging", "Respiratory Imaging"), T("pft_summary", "Pulmonary Function Testing"), T("assessment", "Assessment"), T("plan", "Treatment & Plan"), I("follow_up", "Follow-Up")],
  },
  {
    key: "pulm_followup", label: "Pulmonary Follow-Up", specialty: "pulmonology",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("exam_findings", "Examination Findings"), T("inhaler_technique", "Inhaler Technique Review"), S("adherence", "Adherence", ["Good", "Partial", "Poor"]), T("investigations", "Investigations"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "pulm_admission_note", label: "Respiratory Admission Note", specialty: "pulmonology",
    fields: [T("admission_reason", "Reason for Admission"), T("hpi", "History of Present Illness"), T("exam_findings", "Examination Findings"), T("vitals", "Vital Signs"), T("oxygen_requirement", "Oxygen Requirement"), T("admission_diagnosis", "Admission Diagnosis"), T("admission_plan", "Admission Plan")],
  },
  {
    key: "pulm_progress_note", label: "Respiratory Progress Note", specialty: "pulmonology",
    fields: [T("overnight_events", "Overnight Events"), T("symptoms", "Symptoms"), T("vitals", "Vital Signs"), T("oxygen", "Oxygen Requirement"), T("abg", "Arterial Blood Gas"), T("exam_findings", "Examination Findings"), T("investigations", "Investigations"), T("nebulizers", "Nebulizers / Inhaled Therapy"), T("plan", "Plan")],
  },
  {
    key: "pulm_discharge_summary", label: "Discharge Summary (Respiratory)", specialty: "pulmonology",
    fields: [T("admission_diagnosis", "Admission Diagnosis"), T("discharge_diagnosis", "Discharge Diagnosis"), T("hospital_course", "Hospital Course"), T("discharge_medications", "Discharge Medications"), T("inhaler_plan", "Inhaler Plan"), T("oxygen_at_home", "Home Oxygen Plan"), T("follow_up", "Follow-Up"), T("instructions", "Instructions")],
  },
  {
    key: "pulm_procedure_note", label: "Pulmonary Procedure Note", specialty: "pulmonology",
    fields: [I("procedure", "Procedure (e.g. Thoracentesis / Chest Drain)"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), I("fluid_volume", "Fluid Volume Removed"), T("specimens", "Specimens"), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "pulm_pft_report", label: "Pulmonary Function Test Report", specialty: "pulmonology",
    fields: [T("indication", "Indication"), I("fev1", "FEV1 (L)"), I("fvc", "FVC (L)"), I("fev1_fvc_ratio", "FEV1/FVC Ratio (%)"), I("predicted_fev1", "Predicted FEV1 (%)"), T("tlc", "TLC"), T("rv", "Residual Volume"), T("dlco", "DLCO"), T("bronchodilator_response", "Bronchodilator Response"), S("interpretation", "Interpretation", ["Normal", "Obstructive", "Restrictive", "Mixed", "Non-Diagnostic"]), T("conclusion", "Conclusion"), T("recommendations", "Recommendations")],
  },
  {
    key: "pulm_bronchoscopy_report", label: "Bronchoscopy Report", specialty: "pulmonology",
    fields: [T("indication", "Indication"), I("scope_type", "Scope Type"), S("anesthesia", "Anesthesia", ["Local", "Sedation", "General"]), T("airway_findings", "Airway Findings"), T("lesions", "Lesions / Masses Seen"), T("washings_brushings", "Washings / Brushings"), T("biopsies", "Biopsies"), T("bal", "Bronchoalveolar Lavage"), T("specimens", "Specimens Sent"), T("complications", "Complications"), T("conclusion", "Conclusion")],
  },
  {
    key: "pulm_care_plan", label: "Respiratory Care Plan", specialty: "pulmonology",
    fields: [T("diagnoses", "Diagnoses"), T("control_assessment", "Current Control Assessment"), T("inhaler_regimen", "Inhaler / Medication Regimen"), T("technique_training", "Technique Training"), T("action_plan", "Exacerbation Action Plan"), T("vaccination", "Vaccination Status"), T("smoking_cessation", "Smoking Cessation Support"), I("review_interval", "Review Interval")],
  },
];

const GASTROENTEROLOGY_DOCS = [
  {
    key: "gi_consultation", label: "GI Consultation", specialty: "gastroenterology",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "Gastrointestinal History — History of Present Illness"), T("gi_symptoms", "GI / Abdominal Symptoms"), T("bowel_habits", "Bowel Habits"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("exam_findings", "GI Examination Findings"), T("investigations", "Relevant Investigations"), T("assessment", "Assessment"), T("plan", "Treatment & Plan"), I("follow_up", "Follow-Up")],
  },
  {
    key: "gi_followup", label: "GI Follow-Up", specialty: "gastroenterology",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("exam", "Examination Findings"), T("investigations", "Investigations"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "gi_admission_note", label: "GI Admission Note", specialty: "gastroenterology",
    fields: [T("admission_reason", "Reason for Admission"), T("hpi", "History of Present Illness"), T("exam_findings", "Examination Findings"), T("labs", "Laboratory Results"), T("admission_diagnosis", "Admission Diagnosis"), T("admission_plan", "Admission Plan")],
  },
  {
    key: "gi_progress_note", label: "GI Progress Note", specialty: "gastroenterology",
    fields: [T("overnight_events", "Overnight Events"), T("symptoms", "Symptoms"), T("vitals", "Vital Signs"), T("exam", "Examination Findings"), T("labs", "Laboratory Results"), T("imaging", "Imaging"), T("plan", "Plan")],
  },
  {
    key: "gi_endoscopy_report", label: "Endoscopy Report", specialty: "gastroenterology",
    fields: [S("procedure", "Procedure", ["EGD (Upper GI Endoscopy)", "Sigmoidoscopy", "Enteroscopy", "Other"]), T("indication", "Indication"), T("sedation", "Sedation"), T("esophagus_findings", "Esophagus Findings"), T("stomach_findings", "Stomach Findings"), T("duodenum_findings", "Duodenum Findings"), T("interventions_performed", "Interventions Performed"), T("specimens", "Biopsies / Specimens"), T("complications", "Complications"), T("tolerance", "Tolerance"), T("conclusion", "Conclusion")],
  },
  {
    key: "gi_colonoscopy_report", label: "Colonoscopy Report", specialty: "gastroenterology",
    fields: [T("indication", "Indication"), S("prep_quality", "Bowel Prep Quality", ["Excellent", "Good", "Fair", "Poor"]), T("sedation", "Sedation"), I("scope_reached", "Scope Reached (Cecum / Ileum)"), T("colon_findings", "Colon Findings"), N("polyps_found", "Number of Polyps"), T("polypectomy", "Polypectomy Details"), T("biopsy", "Biopsies"), T("hemostasis", "Hemostasis / Interventions"), T("complications", "Complications"), T("conclusions", "Conclusions"), I("follow_up_interval", "Recommended Follow-Up Interval")],
  },
  {
    key: "gi_ercp_report", label: "ERCP Procedure Report", specialty: "gastroenterology",
    fields: [T("indication", "Indication"), T("sedation", "Sedation"), T("duodenoscopy", "Duodenoscopy Findings"), T("papilla_cannulation", "Papilla & Cannulation"), T("bile_duct_findings", "Bile Duct Findings (Stones / Strictures)"), T("pancreatic_duct_findings", "Pancreatic Duct Findings"), T("sphincterotomy", "Sphincterotomy"), T("stent_placed", "Stent Placed"), I("stent_type", "Stent Type / Details"), T("stone_extraction", "Stone Extraction"), T("brushings", "Brushings / Cytology"), T("complications", "Complications"), T("conclusion", "Conclusion")],
  },
  {
    key: "gi_procedure_note", label: "GI Procedure Note", specialty: "gastroenterology",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), T("specimens", "Specimens"), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "gi_pathology_request", label: "Biopsy / Pathology Request (GI)", specialty: "gastroenterology",
    fields: [T("specimens_sent", "Specimens Sent"), T("clinical_history", "Clinical History"), T("sites_biopsied", "Sites Biopsied"), T("suspected_diagnosis", "Suspected Diagnosis"), S("urgency", "Urgency", ["Routine", "Urgent"])],
  },
  {
    key: "gi_discharge_summary", label: "Discharge Summary (GI)", specialty: "gastroenterology",
    fields: [T("admission_diagnosis", "Admission Diagnosis"), T("discharge_diagnosis", "Discharge Diagnosis"), T("hospital_course", "Hospital Course"), T("procedures", "Procedures Performed"), T("discharge_medications", "Discharge Medications"), T("diet_instructions", "Diet Instructions"), T("follow_up", "Follow-Up"), T("warning_signs", "Warning Signs")],
  },
];

const ENDOCRINOLOGY_DOCS = [
  {
    key: "endo_consultation", label: "Endocrinology Consultation", specialty: "endocrinology",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("family_history", "Family History"), T("exam_findings", "Examination Findings"), T("labs", "Laboratory Results"), T("imaging", "Imaging"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "endo_followup", label: "Endocrinology Follow-Up", specialty: "endocrinology",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("labs", "Laboratory Results"), T("medication_review", "Medication Review"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "endo_diabetes_followup", label: "Diabetes Follow-Up", specialty: "endocrinology",
    fields: [I("diabetes_type", "Diabetes Type"), I("diabetes_duration", "Duration"), T("glucose_log", "Glucose Log / CGM Summary"), I("hba1c", "HbA1c (%)"), T("hypo_episodes", "Hypoglycemic Episodes"), T("insulin_regimen", "Insulin Regimen"), T("oral_agents", "Oral Agents"), S("adherence", "Adherence", ["Good", "Partial", "Poor"]), T("diet", "Diet"), T("exercise", "Exercise"), T("complications_screening", "Complications Screening (Retinopathy / Nephropathy / Neuropathy / Foot)"), I("bp", "Blood Pressure"), T("lipids", "Lipid Profile"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "endo_thyroid_followup", label: "Thyroid Follow-Up", specialty: "endocrinology",
    fields: [T("symptoms", "Symptoms (Hypo / Hyper)"), I("tsh", "TSH"), I("ft4", "Free T4"), T("thyroid_exam", "Thyroid Examination"), T("goiter", "Goiter / Nodules"), T("antibodies", "Thyroid Antibodies"), T("ultrasound", "Ultrasound Findings"), T("medications", "Thyroid Medications"), T("dose_adjustment", "Dose Adjustment"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "endo_progress_note", label: "Endocrine Progress Note", specialty: "endocrinology",
    fields: [T("interval_events", "Interval Events"), T("symptoms", "Symptoms"), T("labs", "Laboratory Results"), T("medication_changes", "Medication Changes"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "endo_care_plan", label: "Endocrine Care Plan", specialty: "endocrinology",
    fields: [T("diagnoses", "Diagnoses"), T("targets", "Targets (HbA1c / TSH etc.)"), T("medication_plan", "Medication Plan"), T("monitoring_schedule", "Monitoring Schedule"), T("diet_lifestyle", "Diet & Lifestyle Plan"), T("education_given", "Education Given"), I("review_interval", "Review Interval")],
  },
  {
    key: "endo_medication_adjustment", label: "Medication Adjustment Record", specialty: "endocrinology",
    fields: [I("medication", "Medication"), I("previous_dose", "Previous Dose"), I("new_dose", "New Dose"), I("adjustment_datetime", "Adjustment Date & Time"), T("reason", "Reason"), T("monitoring_plan", "Monitoring Plan"), T("follow_up", "Follow-Up")],
  },
  {
    key: "endo_discharge_summary", label: "Discharge Summary (Endocrinology)", specialty: "endocrinology",
    fields: [T("admission_diagnosis", "Admission Diagnosis"), T("discharge_diagnosis", "Discharge Diagnosis"), T("hospital_course", "Hospital Course"), T("discharge_medications", "Discharge Medications"), T("monitoring_instructions", "Monitoring Instructions"), T("follow_up", "Follow-Up"), T("warning_signs", "Warning Signs")],
  },
];

export const SPECIALTY_DOCUMENTS = applyNoteSectionPolicy([
  ...IM_DOCS, ...SURGERY_DOCS, ...SURGERY_CONDITION_DOCS, ...EM_DOCS, ...PEDIATRICS_DOCS, ...OBGYN_DOCS, ...ANESTHESIA_DOCS,
  ...CARDIOLOGY_DOCS, ...NEUROLOGY_DOCS, ...PSYCHIATRY_DOCS, ...OPHTHALMOLOGY_DOCS, ...DERMATOLOGY_DOCS,
  ...ORTHOPEDICS_DOCS, ...UROLOGY_DOCS, ...ENT_DOCS, ...PULMONOLOGY_DOCS, ...GASTROENTEROLOGY_DOCS,
  ...NEPHROLOGY_DOCS, ...NEPHROLOGY_KIDNEY_DOCS, ...NEPHROLOGY_CONDITION_DOCS, ...ENDOCRINOLOGY_DOCS,
  ...ONCOLOGY_DOCS, ...INFECTIOUS_DISEASE_DOCS, ...RHEUMATOLOGY_DOCS, ...RHEUMATOLOGY_DISEASE_DOCS, ...HEMATOLOGY_DOCS,
  ...FAMILY_MEDICINE_DOCS, ...DENTAL_DOCS, ...PHYSIO_DOCS, ...NUTRITION_DOCS, ...CERTIFICATE_DEFS,
  ...RADIOLOGY_DOCS, ...LABORATORY_DOCS, ...PATHOLOGY_DOCS,
]);

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