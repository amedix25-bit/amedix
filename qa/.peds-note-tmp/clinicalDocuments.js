// Core clinical system catalogs: encounter types, the universal clinical
// document types available to every doctor regardless of specialty, and the
// centralized consent types. Keys are validated server-side.
export const ENCOUNTER_TYPES = [
  { key: "consultation", label: "Consultation" },
  { key: "follow_up", label: "Follow-Up" },
  { key: "emergency", label: "Emergency" },
  { key: "procedure", label: "Procedure" },
  { key: "admission", label: "Admission" },
  { key: "telemedicine", label: "Telemedicine" },
  { key: "other", label: "Other" },
];

export const DOCUMENT_TYPES = [
  { key: "initial_consultation_note", label: "Initial Consultation Note", group: "Clinical Notes" },
  { key: "follow_up_note", label: "Follow-Up Note", group: "Clinical Notes" },
  { key: "progress_note", label: "Progress Note", group: "Clinical Notes" },
  { key: "problem_oriented_progress_note", label: "Problem-Oriented Progress Note", group: "Clinical Notes" },
  { key: "assessment_and_plan", label: "Assessment & Plan", group: "Clinical Notes" },
  { key: "procedure_note", label: "Procedure Note", group: "Clinical Notes" },
  { key: "admission_note", label: "Admission Note", group: "Clinical Notes" },
  { key: "daily_progress_note", label: "Daily Progress Note", group: "Clinical Notes" },
  { key: "clinical_summary", label: "Clinical Summary", group: "Summaries & Reports" },
  { key: "discharge_summary", label: "Discharge Summary", group: "Summaries & Reports" },
  { key: "discharge_instructions", label: "Discharge Instructions", group: "Summaries & Reports" },
  { key: "medical_certificate", label: "Medical Certificate", group: "Summaries & Reports" },
  { key: "medical_report", label: "Medical Report", group: "Summaries & Reports" },
  { key: "sick_leave_certificate", label: "Sick Leave / Work Certificate", group: "Summaries & Reports" },
  { key: "patient_instructions", label: "Patient Instructions", group: "Summaries & Reports" },
  { key: "referral_note", label: "Referral Note", group: "Consultations & Referrals" },
  { key: "consultation_request", label: "Consultation Request", group: "Consultations & Referrals" },
  { key: "consultation_response", label: "Consultation Response", group: "Consultations & Referrals" },
  { key: "transfer_note", label: "Transfer Note", group: "Consultations & Referrals" },
  { key: "transfer_of_care_note", label: "Transfer-of-Care Note", group: "Consultations & Referrals" },
  { key: "active_problem_list", label: "Active Problem List", group: "Histories & Lists" },
  { key: "past_medical_history", label: "Past Medical History", group: "Histories & Lists" },
  { key: "surgical_history", label: "Surgical History", group: "Histories & Lists" },
  { key: "family_history", label: "Family History", group: "Histories & Lists" },
  { key: "social_history", label: "Social History", group: "Histories & Lists" },
  { key: "medication_list", label: "Medication List", group: "Histories & Lists" },
  { key: "medication_reconciliation", label: "Medication Reconciliation", group: "Histories & Lists" },
  { key: "diagnosis_history", label: "Diagnosis History", group: "Histories & Lists" },
  { key: "allergy_reaction_record", label: "Allergy / Adverse Reaction Record", group: "Histories & Lists" },
  { key: "care_plan", label: "Care Plan", group: "Care Plans" },
  { key: "follow_up_plan", label: "Follow-Up Plan", group: "Care Plans" },
];

export const CONSENT_TYPES = [
  { key: "general_treatment", label: "General Treatment Consent" },
  { key: "procedure", label: "Procedure Consent" },
  { key: "surgical", label: "Surgical Consent" },
  { key: "anesthesia", label: "Anesthesia Consent" },
  { key: "blood_transfusion", label: "Blood Transfusion Consent" },
  { key: "imaging_contrast", label: "Imaging / Contrast Consent" },
  { key: "research", label: "Research Consent" },
  { key: "privacy_data_sharing", label: "Privacy / Data Sharing Consent" },
  { key: "patient_access_authorization", label: "Patient Access Authorization" },
  { key: "withdrawal_revocation", label: "Withdrawal / Revocation of Consent" },
];

export const CONSENT_STATUSES = [
  { key: "given", label: "Given" },
  { key: "declined", label: "Declined" },
  { key: "withdrawn", label: "Withdrawn" },
];

const labelOf = (list, key) => list.find((x) => x.key === key)?.label || key;

export const getEncounterTypeLabel = (key) => labelOf(ENCOUNTER_TYPES, key);
export const getDocumentTypeLabel = (key) => labelOf(DOCUMENT_TYPES, key);
export const getConsentTypeLabel = (key) => labelOf(CONSENT_TYPES, key);

// Groups all versions of each clinical document into families. Each family is
// sorted newest version first; families are sorted by their latest version's
// creation date, newest first. family[0] is always the latest version.
export const groupDocumentFamilies = (documents) => {
  const families = {};
  (documents || []).forEach((d) => {
    if (!families[d.document_id]) families[d.document_id] = [];
    families[d.document_id].push(d);
  });
  return Object.values(families)
    .map((versions) => [...versions].sort((a, b) => (b.version || 1) - (a.version || 1)))
    .sort((a, b) => {
      const at = new Date(a[0].created_datetime || a[0].created_date || 0);
      const bt = new Date(b[0].created_datetime || b[0].created_date || 0);
      return bt - at;
    });
};