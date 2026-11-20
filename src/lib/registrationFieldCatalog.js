// The registration information catalogue behind the admin "Registration
// Information Overview". It documents what patient registration collects, what
// is mandatory, who can see each item, and where it is stored. It is
// documentation only — it drives no form and no permission.
//
// Visibility values:
//   "yes"        — the role sees it directly
//   "access"     — a treating doctor sees it only while holding patient-granted
//                  access (an approved AccessRequest or a hospital check-in)
//   "no"         — not shown to that role
//   "restricted" — access-controlled, shown only where clinically necessary

export const VISIBILITY = {
  yes: { label: "Yes", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  access: { label: "With granted access", className: "bg-blue-50 text-blue-700 border-blue-200" },
  no: { label: "No", className: "bg-muted text-muted-foreground border-border" },
  restricted: { label: "Restricted", className: "bg-amber-50 text-amber-800 border-amber-200" },
};

export const REGISTRATION_FIELD_GROUPS = [
  {
    key: "personal",
    step: "Step 1 — Personal Information",
    title: "Personal & identity details",
    note: "The patient's own details. Doctors see them only while holding access for that patient.",
    fields: [
      { label: "First, father's and last name (English)", required: true, stored: "PatientProfile.first_name / father_name / last_name / full_name", patient: "yes", doctor: "access", admin: "yes" },
      { label: "First, father's and last name (Arabic)", required: true, stored: "PatientProfile.*_ar / full_name_ar", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Grandfather's name", required: false, stored: "PatientProfile.grandfather_name(_ar)", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Date of birth", required: true, stored: "PatientProfile.date_of_birth", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Sex", required: true, stored: "PatientProfile.gender", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Phone number", required: true, stored: "PatientProfile.phone / phone_numbers", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Email address", required: true, stored: "User.email (account record)", patient: "yes", doctor: "no", admin: "yes" },
      { label: "Address", required: true, stored: "PatientProfile.address", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Nationality", required: false, stored: "PatientProfile.nationality", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Photo", required: false, stored: "PatientProfile.photo_uri (private storage)", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Emergency contact name, phone and relationship", required: true, stored: "PatientProfile.emergency_contacts", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Identification number (national ID / passport)", required: true, stored: "PatientProfile.identification_number", patient: "yes", doctor: "no", admin: "yes" },
      { label: "Blood type", required: false, stored: "PatientProfile.blood_type", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Preferred language", required: true, stored: "PatientProfile.preferred_language", patient: "yes", doctor: "no", admin: "yes" },
    ],
  },
  {
    key: "verification",
    step: "Step 1 — Verification Process",
    title: "Identity verification",
    note: "Required before registration can continue. The document is stored privately and is never shown to doctors.",
    fields: [
      { label: "Document type", required: true, stored: "IdentityVerification.document_type", patient: "yes", doctor: "no", admin: "yes" },
      { label: "Document number on the document", required: true, stored: "IdentityVerification.expected_number (masked when displayed)", patient: "yes", doctor: "no", admin: "yes" },
      { label: "Document file (PDF or photo)", required: true, stored: "IdentityVerification.file_uri — private storage, signed links only", patient: "yes", doctor: "no", admin: "restricted" },
      { label: "Verification outcome and review history", required: false, stored: "IdentityVerification.verification_outcome / review_history", patient: "yes", doctor: "no", admin: "yes" },
    ],
  },
  {
    key: "medical",
    step: "Step 2 — Medical History",
    title: "Medical, surgical and family history",
    note: "Every section must be answered — either with entries or with an explicit \"None\".",
    fields: [
      { label: "Medical conditions & diagnoses", required: true, stored: "MedicalCondition", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Hospital admissions & significant history", required: true, stored: "MedicalHistoryEvent", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Past surgical history", required: true, stored: "SurgicalHistory", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Family history (condition, relative, age at diagnosis)", required: true, stored: "FamilyHistory", patient: "yes", doctor: "access", admin: "yes" },
      { label: "\"None\" answers per section", required: false, stored: "Draft none_flags; an empty section is never treated as a negative history", patient: "yes", doctor: "access", admin: "yes" },
    ],
  },
  {
    key: "medications",
    step: "Step 3 — Medications & Allergies",
    title: "Medications and allergies",
    note: "Patient-reported entries are labelled as reported and are never presented as clinically verified.",
    fields: [
      { label: "Current & previous medications", required: true, stored: "Medication (via createClinicalRecord, source: patient_reported)", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Allergies & adverse reactions", required: true, stored: "Allergy", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Allergy section answer (no known allergies / not yet established)", required: true, stored: "PatientProfile.allergy_record_status", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Reported side effect vs confirmed allergy", required: false, stored: "Allergy.entry_type", patient: "yes", doctor: "access", admin: "yes" },
    ],
  },
  {
    key: "lifestyle",
    step: "Step 4 — Lifestyle",
    title: "Lifestyle and social history",
    note: "Smoking and alcohol are required; everything else in this step is voluntary.",
    fields: [
      { label: "Smoking status", required: true, stored: "PatientProfile.smoking_status", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Alcohol use", required: true, stored: "PatientProfile.alcohol_use", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Tobacco details, vaping history", required: false, stored: "PatientProfile.tobacco_details / vaping_history", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Other substance use", required: false, stored: "PatientProfile.substance_use", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Occupation and occupational exposures", required: false, stored: "PatientProfile.occupation / occupational_exposure", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Physical activity level", required: false, stored: "PatientProfile.physical_activity", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Mobility / functional limitations", required: false, stored: "PatientProfile.mobility_limitations", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Are your parents related? (consanguinity)", required: false, stored: "PatientProfile.consanguinity", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Diet types, diet details, food intolerances", required: false, stored: "PatientProfile.diet_types / typical_diet / food_allergies_intolerances", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Sleep patterns and concerns", required: false, stored: "PatientProfile.sleep_patterns / sleep_concerns", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Living situation", required: false, stored: "PatientProfile.living_situation_type / living_situation", patient: "yes", doctor: "access", admin: "yes" },
    ],
  },
  {
    key: "reproductive",
    step: "Step 4 — Female patients only",
    title: "Reproductive history (access-controlled)",
    note: "Asked only where relevant. Marital status is stored on its own and never records anything about pregnancy.",
    fields: [
      { label: "Marital status", required: true, stored: "PatientProfile.marital_status", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Current pregnancy status", required: true, stored: "PatientProfile.pregnancy_status / gynae_obstetric_history.current_pregnancy", patient: "yes", doctor: "restricted", admin: "yes" },
      { label: "Menstrual history", required: true, stored: "PatientProfile.gynae_obstetric_history.menstrual", patient: "yes", doctor: "restricted", admin: "yes" },
      { label: "Past gynaecological history and contraception", required: false, stored: "PatientProfile.gynae_obstetric_history.past", patient: "yes", doctor: "restricted", admin: "yes" },
      { label: "Previous pregnancies (obstetric history)", required: false, stored: "PatientProfile.gynae_obstetric_history.obstetric", patient: "yes", doctor: "restricted", admin: "yes" },
      { label: "Menopause", required: true, stored: "PatientProfile.gynae_obstetric_history.menopause", patient: "yes", doctor: "restricted", admin: "yes" },
      { label: "Urological / reproductive history (free text)", required: false, stored: "PatientProfile.urological_history", patient: "yes", doctor: "restricted", admin: "yes" },
      { label: "Declining to answer (prefer not to answer)", required: false, stored: "The question set is hidden; nothing is recorded on the patient's behalf", patient: "yes", doctor: "access", admin: "yes" },
    ],
  },
  {
    key: "preventive",
    step: "Step 4 — Screening & Preventive Care",
    title: "Screening, vaccination and chronic care",
    note: "A blank vaccination answer is stored as not recorded — never as unvaccinated.",
    fields: [
      { label: "Screening & preventive care entries", required: true, stored: "Immunization", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Vaccination card or supporting document", required: false, stored: "MedicalDocument (category: vaccination), private storage", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Vaccination status and per-vaccine records", required: false, stored: "PatientProfile.vaccination_status / vaccination_records", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Chronic care, devices and special needs", required: true, stored: "ChronicCareItem", patient: "yes", doctor: "access", admin: "yes" },
    ],
  },
  {
    key: "account",
    step: "After submission",
    title: "Account and identifiers",
    note: "Created only when a real patient completes registration — never in preview.",
    fields: [
      { label: "Clinical Identification Number (CIN)", required: true, stored: "PatientProfile.cin — generated once, permanent, never reused", patient: "yes", doctor: "yes", admin: "yes" },
      { label: "Patient profile record", required: true, stored: "PatientProfile", patient: "yes", doctor: "access", admin: "yes" },
      { label: "Registration draft (in-progress answers)", required: false, stored: "PatientRegistrationDraft — owner or administrator only", patient: "yes", doctor: "no", admin: "yes" },
      { label: "Registration audit events", required: false, stored: "RegistrationEvent — fingerprinted, administrator only", patient: "no", doctor: "no", admin: "yes" },
    ],
  },
];

export const VISIBILITY_NOTES = [
  "A doctor never sees a patient's record by default. Access is granted per patient — by the patient approving a request, or by a hospital check-in — and it can be withdrawn at any time.",
  "Reproductive history is access-controlled and shown only where it is clinically necessary.",
  "Identity documents and their numbers are visible to the patient and to AMedix administrators only. Treating doctors never see them.",
  "Everything a patient enters is stored as reported by the patient. Nothing entered during registration is presented as clinically verified.",
];