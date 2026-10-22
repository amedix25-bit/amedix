# Audit — Patient Portal (`/patient`, PatientDashboard + src/components/patient/*)

## Scope reviewed
Identity & CIN, demographics, medical history sections (conditions, events,
family history, allergies, immunizations, surgical, chronic care/devices),
medications, encounters, lab results, imaging reports, document uploads,
consent, access requests (doctors + radiologists), record sharing, ads/subscriptions.

## Findings

### PT-01 — Consent withdrawal / access revocation enforcement
- **Existing:** `PatientAccessControl` and `PatientRadiologistAccessControl`
  manage doctor access (`AccessRequest` approved/denied) and per-request
  radiologist authorization (`ImagingRequest.authorized_radiologist_user_ids`,
  set server-side by `radiologyRespondAccess`). `Consent` entity supports
  `withdrawal_revocation` with status `withdrawn`. `recordConsent` writes
  consent with audit logging.
- **Reference:** FHIR R4 `Consent` — consent provisions must be enforceable;
  ISO 27799 §A.11.2 — access must be revoked when authorization ends.
- **Status:** Partial — enforcement is verified in code for radiologist access
  (read RLS keys on `authorized_radiologist_user_ids` only) and for doctor
  record reads (approved `AccessRequest` required). An end-to-end test of
  revoking a previously approved doctor AccessRequest (does the doctor's
  already-loaded view and any list calls stop resolving?) is **not evidenced**.
- **Risk:** a revoked doctor could retain functional access if any view
  tolerates stale approval state.
- **Proposed change:** add an acceptance test; if revocation leaves any live
  path, re-filter doctor reads server-side on current approval status
  (already the design — verify all read paths use it).
- **Affected:** `AccessRequest`, `getPatientClinicalRecord`,
  `doctorPatientMedicalData`, `PatientAccessControl.jsx`.
- **Acceptance test:** patient revokes an approved doctor; the doctor's
  patient list refreshes and the direct record view returns 403; the audit log
  records the revocation.

### PT-02 — Patient identity and demographics
- **Existing:** `PatientProfile` requires `user_id`, `cin`, `full_name`; CIN is
  the platform-wide identifier; names stored in English + Arabic; document
  identity verification is server-side with strict match-or-fail
  (`verifyIdentityDocument`); patients self-edit demographics
  (`PatientProfileEdit`).
- **Reference:** FHIR `Patient` (identifier, name, gender, birthDate, contact);
  WHO patient-identification good practice: unique identifier + human-readable
  confirmation; ISO 27799 identity assurance.
- **Status:** Satisfied for structure and verification; Partial for
  two-identifier discipline on writes that link records (see XC-08).
- **Risk:** low — CIN is unique and verified; residual risk is mis-keyed CIN
  during clinical lookup (mitigated by CIN-only lookups, not names).
- **Proposed change:** none structural; fold into XC-08.
- **Affected:** `PatientProfile`, `hospitalFindPatientByCin`, `labFindPatientByCin`, `pharmacyFindPatientByCin`.
- **Acceptance test:** (from XC-08) a lab visit opened with a mistyped CIN
  cannot attach results to the wrong patient — results carry CIN + name + DOB
  match.

### PT-03 — Medical history, allergies, medications (patient-reported)
- **Existing:** structured entities (`MedicalCondition`, `MedicalHistoryEvent`,
  `FamilyHistory`, `Allergy`, `Immunization`, `ChronicCareItem`,
  `SurgicalHistory`, `Medication`) each carry `patient_user_id` for RLS, CIN
  and name; allergy entries distinguish `confirmed_allergy` vs
  `reported_side_effect`; allergy-record-status ("no known allergies" vs "not
  established") is preserved; medication entries carry source
  `patient_reported`/`doctor_prescribed`.
- **Reference:** FHIR `Condition`, `AllergyIntolerance` (criticality, category,
  clinicalStatus), `FamilyMemberHistory`, `Immunization`,
  `MedicationStatement` (source distinction is the FHIR `informationSource`
  concept). ISO 27799: patient-reported data must not be presented as
  clinically verified.
- **Status:** Satisfied — the schema enforces the distinction, and doctors see
  source labels (verified in `checkMedicationSafety` alert payloads).
- **Risk:** Low. Patient "no known allergies" is never clinically verified —
  this is by design and documented.
- **Proposed change:** none required; optional later phase — expose
  `AllergyIntolerance.criticality` when doctors confirm allergies.
- **Affected:** the eight history entities + registration forms.
- **Acceptance test:** an allergy entered by a patient renders in the doctor
  view tagged as patient-reported, and a severe drug-allergy match blocks a
  doctor prescription (overlaps DR-02 test).

### PT-04 — Documents, lab results, imaging (patient view)
- **Existing:** `PatientDocuments` (categorized), `PatientLabResults`
  (patient-submitted `PatientLabResult`), `PatientImagingResults` (released
  reports), access-checked file resolution for radiology studies (private
  storage + short-lived signed URLs).
- **Reference:** FHIR `DocumentReference`; ISO 27799 §A.12 — protected health
  information must be access-controlled at the storage layer.
- **Status:** Partial — access rules are right, but patient document uploads
  and onboarding files use **public** storage (see XC-01). Radiology study
  images correctly use private storage.
- **Risk:** High — document URLs are permanently readable by anyone with the
  link.
- **Proposed change:** migrate patient document upload to `UploadPrivateFile`
  + `CreateFileSignedUrl` on view.
- **Affected:** `PatientDocuments.jsx`, `PatientOnboardingForm.jsx`,
  `MedicalDocument.file_url`.
- **Acceptance test:** an unauthenticated GET of a stored document URL returns
  404/401; the signed URL works in the patient's session and expires.

### PT-05 — Partner ads / subscription in patient portal
- **Existing:** ads surface through the approved-partner pipeline
  (`patientPartnerAds`), validated ad templates, ad analytics events.
- **Reference:** ISO 27799 — advertising content must be separated from
  clinical content (no clinical data in ads); consumer-protection norms for
  health advertising.
- **Status:** Satisfied for separation — ads render in a dedicated strip and
  never inside clinical records; subscription status never influences clinical
  order selection (existing design decision, verified in order flows).
- **Risk:** Low.
- **Proposed change:** none (pharmacy-side subscription management gap is
  tracked separately under PH-03).
- **Affected:** `PartnerAdStrip`, `patientPartnerAds`, `PartnerAdvertisement`.
- **Acceptance test:** (existing) a lab-order or prescription screen renders
  identically regardless of a partner's subscription state.