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
};

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