// Part 4 specialty documents — Oncology, Infectious Disease, Rheumatology,
// Hematology, Family Medicine / General Practice, Dentistry (with the
// interactive Tooth Chart), Physiotherapy / Rehabilitation, Nutrition /
// Dietetics, plus the centralized Certificates & Official Documents. Every
// document attaches to the existing AMedix Patient Record and its Encounter
// through the Part 1 ClinicalDocument system — the same PDF header, digital
// signature, timestamp, AMedix Document ID, version control, amendment
// system, permissions and audit log. No separate records.

// Rheumatology lives in its own module — its note types are unchanged in key,
// name and navigation, only their clinical content is authored there.
import { RHEUMATOLOGY_DOCS } from "./rheumatologyDocuments.js";

const I = (key, label) => ({ key, label, type: "input" });
const N = (key, label) => ({ key, label, type: "number" });
const T = (key, label) => ({ key, label, type: "textarea" });
const S = (key, label, options) => ({ key, label, type: "select", options });

const ONCOLOGY_DOCS = [
  {
    key: "onc_consultation", label: "Oncology Consultation", specialty: "oncology",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("family_history", "Family History"), S("performance_status", "ECOG Performance Status", ["0 — Fully Active", "1 — Restricted, Light Work", "2 — Ambulatory, No Work", "3 — Limited Self-Care", "4 — Completely Disabled"]), T("exam_findings", "Examination Findings"), T("imaging_reviewed", "Imaging Reviewed"), T("biopsy_pathology", "Biopsy / Pathology Results"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "onc_treatment_plan", label: "Cancer Treatment Plan", specialty: "oncology",
    fields: [I("diagnosis", "Diagnosis"), I("cancer_type", "Cancer Type / Primary Site"), I("histology", "Histology"), I("stage", "Stage"), S("treatment_goals", "Treatment Goals", ["Curative", "Palliative", "Neoadjuvant", "Adjuvant", "Observation"]), T("treatment_modalities", "Treatment Modalities Planned"), T("chemotherapy_protocol", "Chemotherapy Protocol / Regimen"), T("radiation_plan", "Radiation Plan"), T("surgery_plan", "Surgery Plan"), T("targeted_therapy", "Targeted Therapy"), T("immunotherapy", "Immunotherapy"), N("cycles_planned", "Cycles Planned"), T("monitoring", "Response & Toxicity Monitoring"), T("consent_discussed", "Consent & Goals-of-Care Discussion")],
  },
  {
    key: "onc_followup", label: "Oncology Follow-Up", specialty: "oncology",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), S("performance_status", "ECOG Performance Status", ["0 — Fully Active", "1 — Restricted, Light Work", "2 — Ambulatory, No Work", "3 — Limited Self-Care", "4 — Completely Disabled"]), T("exam_findings", "Examination Findings"), T("investigations", "Investigations Since Last Visit"), S("response_assessment", "Response Assessment", ["Complete Response", "Partial Response", "Stable Disease", "Progressive Disease", "Not Evaluable"]), T("toxicities", "Treatment Toxicities"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "onc_progress_note", label: "Oncology Progress Note", specialty: "oncology",
    fields: [T("interval_events", "Interval Events"), T("symptoms", "Symptoms"), T("vitals", "Vital Signs"), T("exam_findings", "Examination Findings"), T("labs", "Laboratory Results"), T("imaging", "Imaging"), T("treatment_given", "Treatment Given"), T("toxicities", "Toxicities & Grading"), T("plan", "Plan")],
  },
  {
    key: "onc_chemo_record", label: "Chemotherapy Treatment Record", specialty: "oncology",
    fields: [I("diagnosis", "Diagnosis"), I("regimen_name", "Regimen / Protocol"), N("cycle_number", "Cycle Number"), N("day_number", "Day of Cycle"), T("drugs_administered", "Drugs Administered"), T("doses", "Doses"), I("route", "Route"), T("premedications", "Premedications"), I("infusion_start", "Infusion Start Time"), I("infusion_end", "Infusion End Time"), T("vitals", "Vital Signs During Infusion"), T("labs_reviewed", "Laboratory Results Reviewed"), S("toxicity_grading", "Worst Toxicity This Cycle", ["None", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"]), T("dose_modifications", "Dose Modifications / Delays"), I("next_cycle", "Next Cycle Due")],
  },
  {
    key: "onc_infusion_record", label: "Infusion Record (Oncology)", specialty: "oncology",
    fields: [I("infusion_type", "Infusion Type"), I("medication", "Medication Infused"), I("dose", "Dose"), N("duration_hours", "Duration (hours)"), I("access_site", "Access Site / Line"), T("vitals", "Vital Signs"), T("observations", "Observations During Infusion"), T("adverse_reactions", "Adverse Reactions"), T("tolerance", "Tolerance")],
  },
  {
    key: "onc_radiation_record", label: "Radiation Treatment Record", specialty: "oncology",
    fields: [I("diagnosis", "Diagnosis"), I("site_irradiated", "Site Irradiated"), I("technique", "Technique"), I("total_dose", "Total Prescribed Dose (Gy)"), N("fractions_planned", "Fractions Planned"), N("fraction_number", "Current Fraction Number"), I("dose_per_fraction", "Dose per Fraction (Gy)"), I("energy", "Energy"), T("fields", "Fields / Beam Arrangement"), T("positioning", "Positioning & Immobilization"), T("verification_imaging", "Verification Imaging"), T("acute_reactions", "Acute Reactions"), T("tolerance", "Tolerance")],
  },
  {
    key: "onc_staging_record", label: "Cancer Staging Record", specialty: "oncology",
    fields: [I("primary_tumor", "Primary Tumor"), I("histology", "Histology"), I("t_stage", "T Stage"), I("n_stage", "N Stage"), I("m_stage", "M Stage"), I("stage_group", "Stage Group"), S("staging_system", "Staging System", ["TNM / AJCC", "Ann Arbor", "FIGO", "Duke's", "Other"]), T("imaging", "Staging Imaging"), T("biopsy", "Biopsy Results"), T("tumor_markers", "Tumor Markers"), T("staging_summary", "Staging Summary")],
  },
  {
    key: "onc_tumor_board_record", label: "Tumor Board Record", specialty: "oncology",
    fields: [I("board_date", "Tumor Board Date"), T("case_presented", "Case Presented"), T("attendees", "Attendees / Specialties Present"), T("imaging_review", "Imaging Review"), T("pathology_review", "Pathology Review"), T("treatment_options_discussed", "Treatment Options Discussed"), T("board_recommendation", "Board Recommendation"), T("plan", "Plan"), T("follow_up", "Follow-Up Arrangements")],
  },
  {
    key: "onc_discharge_summary", label: "Oncology Discharge Summary", specialty: "oncology",
    fields: [T("admission_diagnosis", "Admission Diagnosis"), T("discharge_diagnosis", "Discharge Diagnosis"), T("hospital_course", "Hospital Course"), T("treatments_given", "Treatments Given"), T("response", "Response to Treatment"), T("discharge_medications", "Discharge Medications"), T("follow_up", "Follow-Up"), T("instructions", "Instructions"), T("pending_results", "Pending Results")],
  },
  {
    key: "onc_treatment_summary", label: "Treatment Summary (Oncology)", specialty: "oncology",
    fields: [T("diagnosis", "Diagnosis"), I("stage", "Stage at Diagnosis"), T("treatments_completed", "Treatments Completed"), T("cumulative_doses", "Cumulative Doses / Total Radiation"), S("response_outcome", "Final Outcome", ["Complete Response", "Partial Response", "Stable Disease", "Progressive Disease"]), T("toxicities", "Long-Term Toxicities"), T("surveillance_plan", "Surveillance Plan"), T("late_effects_risk", "Late Effects Risk")],
  },
  {
    key: "onc_surveillance_record", label: "Follow-Up / Surveillance Record", specialty: "oncology",
    fields: [I("time_since_treatment", "Time Since Treatment Completion"), S("surveillance_visit", "Surveillance Visit Type", ["Routine Surveillance", "Symptom-Driven", "Restaging"]), T("symptoms", "Symptoms"), T("tumor_markers", "Tumor Markers"), T("imaging_surveillance", "Imaging Surveillance"), T("findings", "Findings"), S("recurrence_status", "Recurrence Status", ["No Evidence of Disease", "Suspicious — Under Investigation", "Recurrence Confirmed"]), I("next_surveillance", "Next Surveillance Visit")],
  },
];

const INFECTIOUS_DISEASE_DOCS = [
  {
    key: "id_consultation", label: "ID Consultation", specialty: "infectious_disease",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("infectious_symptoms", "Infectious Symptoms (Fever / Localizing Symptoms)"), T("pmh", "Past Medical History"), T("immunization_history", "Immunization History"), T("travel_history", "Travel History"), T("exposure_history", "Exposure / Contact History"), T("medications", "Current Medications (incl. Antimicrobials)"), T("exam_findings", "Examination Findings"), T("investigations", "Cultures & Investigations"), T("suspected_pathogens", "Suspected Pathogens"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "id_followup", label: "ID Follow-Up", specialty: "infectious_disease",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("culture_results", "Culture / Sensitivity Results"), T("antibiotic_course", "Current Antimicrobial Course"), S("response", "Response to Treatment", ["Improving", "Static", "Worsening"]), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "id_infection_assessment", label: "Infection Assessment", specialty: "infectious_disease",
    fields: [I("infection_site", "Infection Site"), T("symptoms", "Symptoms"), I("onset", "Onset"), S("severity", "Severity", ["Mild", "Moderate", "Severe", "Septic Shock"]), I("source", "Likely Source"), T("risk_factors", "Risk Factors (Immunosuppression / Devices / Surgery)"), T("immunization_status", "Immunization Status"), T("exam_findings", "Examination Findings"), T("labs", "Laboratory Results (WBC / CRP / Procalcitonin)"), T("cultures_ordered", "Cultures Ordered"), T("imaging", "Imaging"), T("suspected_organism", "Suspected Organism(s)"), T("assessment", "Assessment"), T("management", "Management")],
  },
  {
    key: "id_antimicrobial_plan", label: "Antimicrobial Treatment Plan", specialty: "infectious_disease",
    fields: [I("diagnosed_infection", "Diagnosed Infection"), T("empiric_therapy", "Empiric Therapy"), T("definitive_therapy", "Definitive Therapy"), I("drug", "Antimicrobial Agent(s)"), I("dose", "Dose"), I("route", "Route"), I("duration", "Planned Duration"), T("allergies", "Allergies / Prior Reactions"), T("cultures_guiding", "Cultures Guiding Therapy"), T("de_escalation_plan", "De-Escalation Plan"), T("monitoring", "Monitoring (Levels / Renal / CBC)"), T("resistance_considerations", "Resistance Considerations")],
  },
  {
    key: "id_antibiotic_review", label: "Antibiotic Review", specialty: "infectious_disease",
    fields: [T("antibiotics_reviewed", "Antibiotics Currently Prescribed"), S("indication_confirmed", "Indication Confirmed", ["Yes", "No", "Needs Clarification"]), S("duration_appropriate", "Duration Appropriate", ["Yes", "Too Long", "Unclear End Date"]), S("dose_appropriate", "Dose Appropriate for Site/Renal Function", ["Yes", "No — Adjusted", "No — Needs Adjustment"]), T("cultures_reviewed", "Cultures Reviewed"), S("de_escalation", "De-Escalation Possible", ["Yes — De-Escalated", "Yes — Recommended", "Not Applicable"]), T("adverse_effects", "Adverse Effects Noted"), I("stop_date", "Planned Stop Date"), T("recommendation", "Recommendation")],
  },
  {
    key: "id_progress_note", label: "Infection Progress Note", specialty: "infectious_disease",
    fields: [T("interval_events", "Interval Events"), T("symptoms", "Symptoms"), T("vitals", "Vital Signs"), T("labs", "Laboratory Results"), T("cultures", "Cultures / Sensitivities"), T("imaging", "Imaging"), T("antibiotic_review", "Current Antimicrobials & Day of Therapy"), T("response_to_treatment", "Response to Treatment"), T("plan", "Plan")],
  },
  {
    key: "id_isolation_record", label: "Isolation / Precaution Record", specialty: "infectious_disease",
    fields: [I("suspected_condition", "Suspected / Confirmed Condition"), S("isolation_type", "Isolation Type", ["Standard Precautions", "Contact", "Droplet", "Airborne", "Protective (Reverse)"]), T("precautions_implemented", "Precautions Implemented"), I("start_datetime", "Start Date & Time"), T("signs_symptoms", "Signs & Symptoms"), T("reason", "Indication for Isolation"), I("review_date", "Review Date"), T("discontinuation_criteria", "Discontinuation Criteria")],
  },
  {
    key: "id_discharge_summary", label: "Discharge Summary (Infectious Disease)", specialty: "infectious_disease",
    fields: [T("admission_diagnosis", "Admission Diagnosis"), T("discharge_diagnosis", "Discharge Diagnosis"), T("hospital_course", "Hospital Course"), T("antimicrobial_course_completed", "Antimicrobial Course Completed / To Continue"), T("discharge_medications", "Discharge Medications"), T("isolation_instructions", "Isolation Instructions at Home"), T("follow_up", "Follow-Up"), T("instructions", "Instructions")],
  },
  {
    key: "id_referral", label: "ID Referral", specialty: "infectious_disease",
    fields: [I("referral_to", "Referred To"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History")],
  },
];

const HEMATOLOGY_DOCS = [
  {
    key: "hema_consultation", label: "Hematology Consultation", specialty: "hematology",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("family_history", "Family History"), T("exam_findings", "Examination Findings (Lymphadenopathy / Splenomegaly)"), T("cbc_results", "CBC Results"), T("labs", "Other Laboratory Results"), T("imaging", "Imaging / Bone Marrow Findings"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "hema_followup", label: "Hematology Follow-Up", specialty: "hematology",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("cbc", "CBC Results"), T("labs", "Other Laboratory Results"), T("transfusion_history", "Transfusions Since Last Visit"), T("medication_response", "Medication Response"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "hema_progress_note", label: "Hematology Progress Note", specialty: "hematology",
    fields: [T("interval_events", "Interval Events"), T("symptoms", "Symptoms"), T("vitals", "Vital Signs"), T("cbc", "CBC Results"), T("labs", "Other Laboratory Results"), T("transfusions", "Transfusions Given"), T("medications", "Medications"), T("plan", "Plan")],
  },
  {
    key: "hema_transfusion_record", label: "Transfusion Record", specialty: "hematology",
    fields: [S("product_transfused", "Product Transfused", ["Packed Red Blood Cells", "Platelets", "Fresh Frozen Plasma", "Cryoprecipitate", "Whole Blood", "Other"]), N("units", "Units Transfused"), T("indication", "Indication"), I("blood_group", "Patient Blood Group"), I("crossmatch", "Crossmatch Result"), T("pre_transfusion_vitals", "Pre-Transfusion Vital Signs"), T("post_transfusion_vitals", "Post-Transfusion Vital Signs"), T("consent", "Transfusion Consent"), T("observations", "Observations During Transfusion"), S("transfusion_reaction", "Transfusion Reaction", ["None", "Mild — Febrile / Allergic", "Moderate", "Severe", "Anaphylaxis"]), T("notes", "Notes")],
  },
  {
    key: "hema_infusion_record", label: "Infusion Record (Hematology)", specialty: "hematology",
    fields: [I("medication", "Medication Infused"), I("dose", "Dose"), N("duration_hours", "Duration (hours)"), I("access_site", "Access Site / Line"), T("vitals", "Vital Signs"), T("observations", "Observations"), T("adverse_reactions", "Adverse Reactions"), T("tolerance", "Tolerance")],
  },
  {
    key: "hema_bone_marrow_record", label: "Bone Marrow Procedure Record", specialty: "hematology",
    fields: [T("indication", "Indication"), T("consent", "Consent"), S("site", "Procedure Site", ["Posterior Iliac Crest", "Sternum", "Other"]), T("anesthesia", "Anesthesia / Sedation"), T("technique", "Technique"), T("aspirate_findings", "Aspirate Findings"), T("trephine_biopsy", "Trephine Biopsy"), T("specimens_sent", "Specimens Sent (incl. Cytogenetics / Flow Cytometry)"), T("complications", "Complications"), T("patient_condition", "Patient Condition Post-Procedure"), T("post_procedure_care", "Post-Procedure Care")],
  },
  {
    key: "hema_treatment_plan", label: "Hematology Treatment Plan", specialty: "hematology",
    fields: [I("diagnosis", "Diagnosis"), T("treatment_goals", "Treatment Goals"), T("chemotherapy_protocol", "Chemotherapy Protocol"), T("targeted_therapy", "Targeted Therapy"), T("supportive_care", "Supportive Care (Transfusions / Growth Factors)"), T("transfusion_plan", "Transfusion Plan & Triggers"), T("monitoring", "Monitoring Schedule"), N("cycles", "Cycles Planned"), T("response_criteria", "Response Criteria")],
  },
  {
    key: "hema_discharge_summary", label: "Discharge Summary (Hematology)", specialty: "hematology",
    fields: [T("admission_diagnosis", "Admission Diagnosis"), T("discharge_diagnosis", "Discharge Diagnosis"), T("hospital_course", "Hospital Course"), T("treatments", "Treatments Given"), T("blood_counts_at_discharge", "Blood Counts at Discharge"), T("discharge_medications", "Discharge Medications"), T("follow_up", "Follow-Up"), T("instructions", "Instructions & Warning Signs")],
  },
];

const FAMILY_MEDICINE_DOCS = [
  {
    key: "fm_general_consultation", label: "General Consultation", specialty: "family_medicine",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("review_of_systems", "Review of Systems"), T("exam_findings", "Examination Findings"), T("assessment", "Assessment"), T("plan", "Plan"), I("follow_up", "Follow-Up")],
  },
  {
    key: "fm_preventive_visit", label: "Preventive Health Visit", specialty: "family_medicine",
    fields: [I("visit_type", "Visit Type (Adult Checkup / Well Visit / Screening)"), T("screening_done", "Screenings Performed"), T("immunizations_given", "Immunizations Given"), T("lifestyle_assessment", "Lifestyle Assessment (Diet / Exercise / Smoking / Alcohol)"), I("bp", "Blood Pressure"), N("bmi", "BMI"), T("health_risk_assessment", "Health Risk Assessment"), T("counseling", "Counseling Provided"), T("plan", "Plan")],
  },
  {
    key: "fm_chronic_followup", label: "Chronic Disease Follow-Up", specialty: "family_medicine",
    fields: [T("chronic_conditions", "Chronic Conditions (Diabetes / Hypertension / Asthma / Other)"), T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), S("medication_adherence", "Medication Adherence", ["Good", "Partial", "Poor"]), T("side_effects", "Side Effects"), T("labs", "Laboratory Results"), I("bp", "Blood Pressure"), T("exam_findings", "Examination Findings"), S("control_assessment", "Control Assessment", ["Well Controlled", "Partially Controlled", "Uncontrolled"]), T("plan", "Plan")],
  },
  {
    key: "fm_acute_visit", label: "Acute Illness Visit", specialty: "family_medicine",
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), I("duration", "Duration of Symptoms"), T("exam_findings", "Examination Findings"), T("working_diagnosis", "Working Diagnosis"), T("treatment", "Treatment & Prescription"), T("follow_up", "Follow-Up / Return Precautions")],
  },
  {
    key: "fm_followup", label: "Family Medicine Follow-Up", specialty: "family_medicine",
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("exam_findings", "Examination Findings"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "fm_referral", label: "Referral (Family Medicine)", specialty: "family_medicine",
    fields: [I("referral_to", "Referred To / Specialty"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant History"), T("clinical_summary", "Clinical Summary")],
  },
  {
    key: "fm_procedure_note", label: "Procedure Note (Family Medicine)", specialty: "family_medicine",
    fields: [I("procedure", "Procedure"), T("indication", "Indication"), T("consent", "Consent"), T("technique", "Technique"), T("findings", "Findings"), T("complications", "Complications"), T("patient_condition", "Patient Condition")],
  },
  {
    key: "fm_medication_review", label: "Medication Review", specialty: "family_medicine",
    fields: [T("current_medications", "Current Medications"), S("adherence", "Adherence", ["Good", "Partial", "Poor"]), T("side_effects", "Side Effects"), T("interactions", "Drug Interactions Identified"), T("deprescribing", "Medications to Stop / Reduce"), T("changes_made", "Changes Made"), T("monitoring", "Monitoring Plan")],
  },
  {
    key: "fm_health_maintenance", label: "Health Maintenance Record", specialty: "family_medicine",
    fields: [T("immunizations", "Immunization Status"), T("screening_status", "Screening Status (Blood Pressure / Glucose / Lipids / Cancer Screening)"), I("last_checkup", "Last Complete Check-Up"), T("health_targets", "Health Targets"), T("counseling", "Counseling Provided"), I("next_due", "Next Due")],
  },
];

const DENTAL_DOCS = [
  {
    key: "dental_consultation", label: "Dental Consultation", specialty: "dentistry", toothChart: true,
    fields: [T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("dental_history_summary", "Dental History Summary"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), T("exam_findings", "Intraoral / Extraoral Examination"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "dental_history", label: "Dental History", specialty: "dentistry", toothChart: true,
    fields: [T("previous_treatments", "Previous Dental Treatments"), T("oral_hygiene", "Oral Hygiene Routine"), T("brushing_habits", "Brushing Habits"), T("flossing_habits", "Flossing / Interdental Care"), T("pmh", "Past Medical History"), T("allergies", "Allergies (incl. Local Anesthetic / Latex)"), T("current_oral_symptoms", "Current Oral Symptoms"), T("notes", "Notes")],
  },
  {
    key: "dental_treatment_plan", label: "Dental Treatment Plan", specialty: "dentistry", toothChart: true,
    fields: [T("presenting_problems", "Presenting Problems"), T("treatment_sequence", "Treatment Sequence / Phases"), T("procedures_planned", "Procedures Planned"), T("alternatives_discussed", "Alternatives Discussed"), T("risks_discussed", "Risks & Prognosis Discussed"), T("consent", "Consent"), T("notes", "Notes")],
  },
  {
    key: "dental_procedure_note", label: "Dental Procedure Note", specialty: "dentistry", toothChart: true,
    fields: [I("procedure", "Procedure"), T("anesthesia", "Anesthesia (Agent / Technique)"), T("technique", "Technique"), T("materials_used", "Materials Used"), T("findings", "Findings"), T("complications", "Complications"), T("instructions", "Post-Procedure Instructions")],
  },
  {
    key: "dental_followup", label: "Dental Follow-Up", specialty: "dentistry", toothChart: true,
    fields: [T("interval_history", "Interval History"), T("symptoms", "Current Symptoms"), T("healing", "Healing / Wound Status"), T("oral_hygiene", "Oral Hygiene Assessment"), T("exam_findings", "Examination Findings"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "dental_operative_note", label: "Dental Operative Note", specialty: "dentistry", toothChart: true,
    fields: [T("preop_diagnosis", "Pre-Operative Diagnosis"), T("postop_diagnosis", "Post-Operative Diagnosis"), I("procedure", "Procedure"), I("surgeon", "Surgeon"), S("anesthesia", "Anesthesia", ["Local", "General", "Sedation (Oral)", "Sedation (IV)", "Other"]), T("technique_details", "Technique Details"), T("materials", "Materials / Implants Used"), T("specimens", "Specimens Sent"), T("complications", "Complications"), T("postop_plan", "Post-Operative Plan")],
  },
  {
    key: "dental_imaging_report", label: "Dental Imaging Report", specialty: "dentistry",
    fields: [S("imaging_type", "Imaging Type", ["Panoramic (OPG)", "Periapical", "Bitewing", "CBCT", "Lateral Cephalometric", "Other"]), T("teeth_imaged", "Teeth / Region Imaged"), T("findings", "Findings"), T("interpretation", "Interpretation"), T("recommendations", "Recommendations")],
  },
  {
    key: "dental_referral", label: "Dental Referral", specialty: "dentistry",
    fields: [I("referral_to", "Referred To"), T("reason", "Reason for Referral"), S("urgency", "Urgency", ["Routine", "Urgent", "Emergency"]), T("relevant_history", "Relevant Dental / Medical History")],
  },
  {
    key: "dental_completion", label: "Dental Completion / Discharge Note", specialty: "dentistry", toothChart: true,
    fields: [T("treatments_completed", "Treatments Completed"), T("outstanding_treatment", "Outstanding Treatment"), T("oral_hygiene_instruction", "Oral Hygiene Instructions Given"), T("follow_up", "Follow-Up / Recall Interval"), T("completion_summary", "Completion Summary")],
  },
];

const PHYSIO_DOCS = [
  {
    key: "physio_initial_assessment", label: "Initial Assessment (Physiotherapy)", specialty: "physiotherapy",
    fields: [I("referral_reason", "Referral Reason"), T("chief_complaint", "Chief Complaint"), T("hpi", "History of Present Illness"), T("pmh", "Past Medical History"), T("medications", "Current Medications"), N("pain_assessment", "Pain Score (0–10)"), T("posture", "Posture"), T("rom", "Range of Motion"), T("strength", "Strength (MMT)"), T("gait_assessment", "Gait Assessment"), T("functional_limitations", "Functional Limitations"), T("special_tests", "Special Tests"), T("goals", "Treatment Goals"), T("plan", "Plan")],
  },
  {
    key: "physio_functional_assessment", label: "Functional Assessment", specialty: "physiotherapy",
    fields: [T("functional_status", "Current Functional Status"), T("adl_assessment", "Activities of Daily Living"), T("mobility_assessment", "Mobility / Transfers"), T("outcome_measures", "Outcome Measures / Scores"), T("assistive_devices", "Assistive Devices Used"), T("home_environment", "Home Environment & Barriers"), T("summary", "Summary")],
  },
  {
    key: "physio_treatment_plan", label: "Treatment Plan (Physiotherapy)", specialty: "physiotherapy",
    fields: [T("diagnosis", "Diagnosis"), T("treatment_goals", "Treatment Goals"), T("treatment_modalities", "Treatment Modalities"), I("frequency", "Frequency (sessions/week)"), I("duration", "Planned Duration"), T("home_exercise_program", "Home Exercise Program"), T("precautions", "Precautions / Contraindications"), T("expected_outcomes", "Expected Outcomes")],
  },
  {
    key: "physio_session_note", label: "Therapy Session Note", specialty: "physiotherapy",
    fields: [I("session_date", "Session Date"), T("treatment_given", "Treatment Given"), T("modalities_used", "Modalities Used"), T("exercises_performed", "Exercises Performed"), T("patient_response", "Patient Response"), N("pain_before", "Pain Before Session (0–10)"), N("pain_after", "Pain After Session (0–10)"), T("adverse_effects", "Adverse Effects"), I("next_session", "Next Session")],
  },
  {
    key: "physio_progress_note", label: "Progress Note (Physiotherapy)", specialty: "physiotherapy",
    fields: [T("interval_events", "Interval Events"), T("current_status", "Current Status"), T("rom_progress", "Range of Motion Progress"), T("strength_progress", "Strength Progress"), T("functional_progress", "Functional Progress"), T("treatment_modifications", "Treatment Modifications"), T("plan", "Plan")],
  },
  {
    key: "physio_exercise_plan", label: "Exercise / Treatment Plan", specialty: "physiotherapy",
    fields: [T("exercises", "Exercises"), T("sets_reps", "Sets & Repetitions"), I("frequency", "Frequency"), T("progression_plan", "Progression Plan"), T("home_program", "Home Program"), T("precautions", "Precautions")],
  },
  {
    key: "physio_discharge", label: "Discharge from Rehabilitation", specialty: "physiotherapy",
    fields: [T("admission_reason", "Reason for Rehabilitation"), T("treatment_received", "Treatment Received"), T("functional_outcomes", "Functional Outcomes at Discharge"), S("goals_achieved", "Goals Achieved", ["Fully", "Partially", "Not Achieved"]), T("home_program", "Home Program at Discharge"), T("assistive_devices", "Assistive Devices"), T("follow_up", "Follow-Up"), T("instructions", "Instructions")],
  },
  {
    key: "physio_followup_assessment", label: "Follow-Up Assessment (Physiotherapy)", specialty: "physiotherapy",
    fields: [I("time_since_discharge", "Time Since Discharge"), T("current_function", "Current Functional Level"), T("symptoms", "Symptoms / Pain"), T("exam_findings", "Examination Findings"), T("re_assessment", "Re-Assessment vs. Discharge Status"), T("plan", "Plan")],
  },
];

const NUTRITION_DOCS = [
  {
    key: "nutr_assessment", label: "Nutrition Assessment", specialty: "nutrition",
    fields: [I("reason", "Reason for Referral"), N("weight_kg", "Weight (kg)"), N("height_cm", "Height (cm)"), N("bmi", "BMI"), T("weight_history", "Weight History / Changes"), T("dietary_intake", "Dietary Intake Assessment"), T("medical_conditions", "Relevant Medical Conditions"), T("medications", "Current Medications / Supplements"), T("gi_symptoms", "GI Symptoms"), T("labs", "Relevant Labs (Albumin / Electrolytes / Glucose)"), T("assessment", "Assessment"), T("plan", "Plan")],
  },
  {
    key: "nutr_dietary_history", label: "Dietary History", specialty: "nutrition",
    fields: [T("usual_intake", "Usual Dietary Intake"), T("meal_pattern", "Meal Pattern / Frequency"), T("food_allergies", "Food Allergies"), T("intolerances", "Food Intolerances"), T("preferences", "Food Preferences / Cultural / Religious"), S("appetite", "Appetite", ["Good", "Fair", "Poor"]), T("hydration", "Fluid Intake"), T("supplements", "Supplements Used"), T("cooking_facilities", "Cooking Facilities / Support"), T("notes", "Notes")],
  },
  {
    key: "nutr_diagnosis", label: "Nutritional Diagnosis", specialty: "nutrition",
    fields: [I("nutrition_diagnosis", "Nutritional Diagnosis"), T("etiology", "Etiology"), T("signs_symptoms", "Signs & Symptoms"), S("severity", "Severity", ["Mild", "Moderate", "Severe"]), T("goals", "Nutrition Goals")],
  },
  {
    key: "nutr_care_plan", label: "Nutrition Care Plan", specialty: "nutrition",
    fields: [T("nutrition_diagnosis", "Nutritional Diagnosis"), T("goals", "Goals"), T("interventions", "Nutrition Interventions"), T("education", "Nutrition Education Provided"), T("monitoring", "Monitoring Plan"), T("evaluation_criteria", "Evaluation Criteria"), I("review_date", "Review Date")],
  },
  {
    key: "nutr_diet_prescription", label: "Diet Prescription", specialty: "nutrition",
    fields: [I("diet_type", "Diet Type (Regular / Diabetic / Renal / Low-Sodium / Other)"), I("energy_requirement", "Energy Requirement (kcal/day)"), I("protein", "Protein (g/day)"), I("carbohydrates", "Carbohydrates (g/day)"), I("fats", "Fats (g/day)"), I("fluid", "Fluid Allowance (ml/day)"), S("consistency", "Consistency / Texture", ["Regular", "Soft", "Pureed", "Full Liquid", "Clear Liquid", "Other"]), T("specific_instructions", "Specific Instructions"), T("supplements", "Prescribed Supplements")],
  },
  {
    key: "nutr_followup", label: "Follow-Up (Nutrition)", specialty: "nutrition",
    fields: [T("interval_history", "Interval History"), N("weight_change", "Weight Change Since Last Visit"), S("adherence", "Adherence to Plan", ["Good", "Partial", "Poor"]), T("barriers", "Barriers to Adherence"), T("labs", "Relevant Labs"), T("progress_toward_goals", "Progress Toward Goals"), T("plan", "Plan")],
  },
  {
    key: "nutr_progress_note", label: "Progress Note (Nutrition)", specialty: "nutrition",
    fields: [T("interval_events", "Interval Events"), T("intake_assessment", "Current Intake Assessment"), N("weight", "Current Weight"), T("labs", "Relevant Labs"), T("response", "Response to Nutrition Intervention"), T("modifications", "Modifications to Plan")],
  },
  {
    key: "nutr_completion", label: "Discharge / Completion Note (Nutrition)", specialty: "nutrition",
    fields: [T("reason_completed", "Reason for Completion / Discharge"), S("goals_achieved", "Goals Achieved", ["Fully", "Partially", "Not Achieved"]), T("final_assessment", "Final Nutritional Assessment"), T("dietary_instructions", "Dietary Instructions at Discharge"), T("follow_up", "Follow-Up")],
  },
];

// Centralized Certificates & Official Documents — general document types
// available to every doctor, with structured fields. They use the same
// standardized AMedix header, digital signature, PDF generation, document ID,
// version control and audit logging as all clinical documents.
export const CERTIFICATE_DEFS = [
  {
    key: "medical_certificate", label: "Medical Certificate",
    fields: [I("certificate_purpose", "Purpose of Certificate"), T("examination_findings", "Examination Findings"), T("diagnosis", "Diagnosis"), T("fitness_statement", "Medical Statement"), I("validity_period", "Validity Period"), T("remarks", "Remarks")],
  },
  {
    key: "fitness_certificate", label: "Fitness Certificate",
    fields: [T("examination_findings", "Examination Findings"), T("vitals", "Vital Signs"), T("fitness_assessment", "Fitness Assessment"), S("fitness_statement", "Fitness Statement", ["Fit", "Unfit", "Fit with Restrictions"]), T("restrictions", "Restrictions"), I("validity_period", "Validity Period")],
  },
  {
    key: "sick_leave_certificate", label: "Sick Leave Certificate",
    fields: [T("diagnosis", "Diagnosis"), I("leave_from", "Leave From (Date)"), I("leave_to", "Leave To (Date)"), N("total_days", "Total Days of Leave"), S("extension_possible", "Extension Possible", ["Yes — Requires Review", "No"]), T("remarks", "Remarks")],
  },
  {
    key: "return_to_work_certificate", label: "Return-to-Work Certificate",
    fields: [I("date_declared_fit", "Date Declared Fit"), T("duties_resumed", "Duties to Be Resumed"), T("work_restrictions", "Work Restrictions / Modified Duties"), T("follow_up", "Follow-Up")],
  },
  {
    key: "school_medical_certificate", label: "School Medical Certificate",
    fields: [I("school_name", "School Name"), T("reason", "Reason for Certificate"), I("period_from", "Period From (Date)"), I("period_to", "Period To (Date)"), T("restrictions", "Activity Restrictions"), T("remarks", "Remarks")],
  },
  {
    key: "disability_functional_certificate", label: "Disability / Functional Capacity Certificate",
    fields: [I("disability_type", "Disability Type"), T("functional_limitations", "Functional Limitations"), S("degree", "Degree", ["Mild", "Moderate", "Severe", "Total"]), S("duration", "Duration", ["Temporary", "Permanent"]), T("assessment_findings", "Assessment Findings"), T("recommendations", "Recommendations / Accommodations")],
  },
  {
    key: "medical_summary", label: "Medical Summary",
    fields: [I("summary_period", "Summary Period"), T("active_problems", "Active Problems"), T("treatments", "Treatments Received"), T("current_medications", "Current Medications"), T("allergies", "Allergies"), T("summary_content", "Summary")],
  },
  {
    key: "medical_history_summary", label: "Medical History Summary",
    fields: [T("past_medical_history", "Past Medical History"), T("surgical_history", "Surgical History"), T("family_history", "Family History"), T("medications", "Current Medications"), T("allergies", "Allergies"), T("immunizations", "Immunizations"), T("summary_content", "Summary")],
  },
  {
    key: "fitness_for_procedure", label: "Fitness-for-Procedure Documentation",
    fields: [I("procedure", "Planned Procedure"), T("indication", "Indication"), T("assessment", "Clinical Assessment"), T("comorbidities", "Relevant Comorbidities"), T("investigations", "Investigations Reviewed"), S("anesthesia_fitness", "Fitness", ["Fit for Procedure", "Unfit for Procedure", "Fit with Conditions", "Pending Investigations"]), T("recommendations", "Recommendations / Optimization")],
  },
];

export const CERTIFICATE_KEYS = CERTIFICATE_DEFS.map((d) => d.key);

export const PART4_SPECIALTY_DOC_ARRAYS = {
  ONCOLOGY_DOCS,
  INFECTIOUS_DISEASE_DOCS,
  RHEUMATOLOGY_DOCS,
  HEMATOLOGY_DOCS,
  FAMILY_MEDICINE_DOCS,
  DENTAL_DOCS,
  PHYSIO_DOCS,
  NUTRITION_DOCS,
};

export {
  ONCOLOGY_DOCS,
  INFECTIOUS_DISEASE_DOCS,
  RHEUMATOLOGY_DOCS,
  HEMATOLOGY_DOCS,
  FAMILY_MEDICINE_DOCS,
  DENTAL_DOCS,
  PHYSIO_DOCS,
  NUTRITION_DOCS,
};