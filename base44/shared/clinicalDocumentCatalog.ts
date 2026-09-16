// Server-side catalog of all clinical document types — the general Part 1
// types plus the specialty-specific paperwork. createClinicalDocument
// validates every request against this list and derives the document's
// specialty server-side; the frontend catalog (src/lib/specialtyDocuments.js)
// holds the field definitions and mirrors these keys.

export const GENERAL_DOCUMENT_TYPES = [
  "initial_consultation_note", "follow_up_note", "progress_note",
  "problem_oriented_progress_note", "assessment_and_plan", "procedure_note",
  "clinical_summary", "discharge_summary", "referral_note",
  "consultation_request", "consultation_response", "medical_certificate",
  "medical_report", "sick_leave_certificate", "patient_instructions",
  "medication_reconciliation", "allergy_reaction_record", "active_problem_list",
  "past_medical_history", "surgical_history", "family_history",
  "social_history", "medication_list", "diagnosis_history", "care_plan",
  "follow_up_plan", "admission_note", "daily_progress_note", "transfer_note",
  "transfer_of_care_note", "discharge_instructions",
];

export const SPECIALTY_DOCUMENT_KEYS: Record<string, string[]> = {
  internal_medicine: [
    "im_consultation", "im_new_patient_assessment", "im_followup",
    "im_chronic_followup", "im_admission_note", "im_daily_progress",
    "im_problem_oriented_progress", "im_consultation_request",
    "im_consultation_response", "im_medication_reconciliation",
    "im_discharge_summary", "im_medical_followup", "im_chronic_care_plan",
  ],
  surgery: [
    "surg_consultation", "surg_preop_assessment", "surg_operative_note",
    "surg_procedure_note", "surg_postop_note", "surg_daily_progress",
    "surg_discharge_summary", "surg_followup", "surg_pathology",
    "surg_referral", "surg_consent_documentation", "surg_implant_device",
  ],
  emergency_medicine: [
    "em_triage", "em_ed_assessment", "em_physician_note", "em_progress",
    "em_trauma_assessment", "em_procedure_note", "em_resuscitation_code",
    "em_consultation", "em_observation_note", "em_transfer_note",
    "em_discharge_summary", "em_discharge_instructions",
  ],
  pediatrics: [
    "peds_consultation", "peds_followup", "peds_well_child", "peds_admission_note",
    "peds_daily_progress", "peds_discharge_summary", "peds_referral",
    "peds_procedure_note", "peds_chronic_followup", "peds_growth_development",
    "peds_immunization_record", "peds_screening_record", "peds_anticipatory_guidance",
    "peds_newborn_record", "peds_birth_history", "peds_neonatal_progress",
    "peds_newborn_discharge_summary", "peds_adolescent_health",
    "peds_confidential_adolescent_note",
  ],
  obstetrics_gynecology: [
    "obgyn_initial_antenatal", "obgyn_antenatal_followup", "obgyn_pregnancy_record",
    "obgyn_prenatal_care_plan", "obgyn_labor_delivery_record", "obgyn_delivery_note",
    "obgyn_csection_operative_note", "obgyn_vaginal_delivery_note", "obgyn_postpartum_note",
    "obgyn_discharge_summary", "obgyn_pregnancy_followup", "obgyn_gyn_consultation",
    "obgyn_gyn_followup", "obgyn_gyn_procedure_note", "obgyn_gyn_operative_note",
    "obgyn_gyn_preop_assessment", "obgyn_gyn_postop_note", "obgyn_gyn_discharge_summary",
    "obgyn_gyn_referral",
  ],
  anesthesiology: [
    "anes_pre_assessment", "anes_consultation", "anes_plan", "anes_consent",
    "anes_airway_assessment", "anes_intraop_record", "anes_medication_record",
    "anes_monitoring_record", "anes_post_anesthesia_care_note",
    "anes_post_anesthesia_evaluation", "anes_followup", "anes_regional_record",
  ],
  cardiology: [
    "cardio_consultation", "cardio_followup", "cardio_admission_note",
    "cardio_progress_note", "cardio_discharge_summary", "cardio_procedure_note",
    "cardio_ecg_report", "cardio_echo_report", "cardio_holter_report",
    "cardio_stress_test_report", "cardio_cath_report", "cardio_referral",
  ],
  neurology: [
    "neuro_consultation", "neuro_followup", "neuro_admission_note",
    "neuro_progress_note", "neuro_discharge_summary", "neuro_procedure_note",
    "neuro_eeg_report", "neuro_emg_ncs_report", "neuro_stroke_record",
    "neuro_seizure_followup", "neuro_referral",
  ],
  psychiatry: [
    "psy_consultation", "psy_assessment", "psy_followup", "psy_progress_note",
    "psy_treatment_plan", "psy_medication_followup", "psy_risk_assessment",
    "psy_crisis_assessment", "psy_discharge_summary", "psy_referral",
  ],
  ophthalmology: [
    "ophth_consultation", "ophth_followup", "ophth_procedure_note",
    "ophth_operative_note", "ophth_preop_assessment", "ophth_postop_note",
    "ophth_discharge_summary", "ophth_diagnostic_report", "ophth_referral",
  ],
  dermatology: [
    "derm_consultation", "derm_followup", "derm_lesion_assessment",
    "derm_skin_procedure_note", "derm_biopsy_note", "derm_operative_note",
    "derm_pathology_request", "derm_discharge_followup", "derm_referral",
  ],
  orthopedics: [
    "ortho_consultation", "ortho_followup", "ortho_fracture_assessment",
    "ortho_injury_assessment", "ortho_preop_assessment", "ortho_operative_note",
    "ortho_procedure_note", "ortho_postop_note", "ortho_daily_progress",
    "ortho_discharge_summary", "ortho_rehab_plan",
  ],
  urology: [
    "uro_consultation", "uro_followup", "uro_procedure_note",
    "uro_operative_note", "uro_preop_assessment", "uro_postop_note",
    "uro_catheter_device_record", "uro_discharge_summary", "uro_referral",
  ],
  ent: [
    "ent_consultation", "ent_followup", "ent_procedure_note",
    "ent_operative_note", "ent_preop_assessment", "ent_postop_note",
    "ent_audiology_report", "ent_discharge_summary", "ent_referral",
  ],
  pulmonology: [
    "pulm_consultation", "pulm_followup", "pulm_admission_note",
    "pulm_progress_note", "pulm_discharge_summary", "pulm_procedure_note",
    "pulm_pft_report", "pulm_bronchoscopy_report", "pulm_care_plan",
  ],
  gastroenterology: [
    "gi_consultation", "gi_followup", "gi_admission_note", "gi_progress_note",
    "gi_endoscopy_report", "gi_colonoscopy_report", "gi_ercp_report",
    "gi_procedure_note", "gi_pathology_request", "gi_discharge_summary",
  ],
  nephrology: [
    "neph_consultation", "neph_followup", "neph_admission_note",
    "neph_progress_note", "neph_dialysis_record", "neph_access_record",
    "neph_procedure_note", "neph_discharge_summary", "neph_ckd_care_plan",
  ],
  endocrinology: [
    "endo_consultation", "endo_followup", "endo_diabetes_followup",
    "endo_thyroid_followup", "endo_progress_note", "endo_care_plan",
    "endo_medication_adjustment", "endo_discharge_summary",
  ],
};

// Restricted/confidential clinical documents — every psychiatric document is
// confidential: only the authoring doctor, the patient and administrators can
// ever access them (Row Level Security + server-side filtering).
export const CONFIDENTIAL_DOCUMENT_TYPES: string[] = [
  "psy_consultation", "psy_assessment", "psy_followup", "psy_progress_note",
  "psy_treatment_plan", "psy_medication_followup", "psy_risk_assessment",
  "psy_crisis_assessment", "psy_discharge_summary", "psy_referral",
];

export function isConfidentialDocumentType(key: string): boolean {
  return CONFIDENTIAL_DOCUMENT_TYPES.includes(key);
}

export function isKnownDocumentType(key: string): boolean {
  if (GENERAL_DOCUMENT_TYPES.includes(key)) return true;
  return Object.values(SPECIALTY_DOCUMENT_KEYS).some((keys) => keys.includes(key));
}

export function getDocumentSpecialty(key: string): string {
  if (GENERAL_DOCUMENT_TYPES.includes(key)) return "";
  for (const [specialty, keys] of Object.entries(SPECIALTY_DOCUMENT_KEYS)) {
    if (keys.includes(key)) return specialty;
  }
  return "";
}