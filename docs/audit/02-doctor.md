# Audit — Doctor Portal (`/doctor`, DoctorDashboard + src/components/doctor/*)

## Scope reviewed
Patient lookup (CIN, QR scan, directory), encounters, clinical notes (with
drafts), diagnoses, procedures/surgical, prescriptions (with safety check),
medication history, allergies, lab and imaging requests, referral letters,
shared imaging results, record access.

## Findings

### DR-01 — Doctor-entered diagnoses are not coded
- **Existing:** `Diagnosis` entity stores free-text diagnoses; patient-reported
  conditions display ICD-11 codes on the patient summary (Phase 1);
  `terminologyLookup` can resolve condition terms in batches.
- **Reference:** ICD-11 MMS — diagnoses recorded for classification should
  carry their code; FHIR `Condition.code` is a CodeableConcept.
- **Status:** Partial — coding exists for the registration-derived condition
  list; doctor-entered `Diagnosis` records have no code field populated.
- **Risk:** Low (clinical meaning preserved in free text; reporting/export
  lacks coded diagnoses).
- **Proposed change:** on diagnosis save, resolve via `terminologyLookup`
  (concept_type `medical_condition`) and store the resolved coding
  alongside the free text; never overwrite the clinician's wording.
- **Affected:** `Diagnosis` entity, `createClinicalNote`/diagnosis save path,
  `DoctorPatientClinicalNotesView.jsx`.
- **Acceptance test:** a doctor saves "Essential hypertension"; the record
  shows ICD-11 BA00 beside the free text; an unmatched term saves uncoded with
  no error.

### DR-02 — Dispensing does not re-run the medication safety check
- **Existing:** `checkMedicationSafety` runs at prescription time and its
  outcome is stored on the prescription (`Prescription.safety_check`);
  `pharmacyDispensePrescription` validates authorization, status, inventory
  safety (quarantined/expired/recalled stock blocked) and duplicates — but does
  **not** re-check the patient's allergies at dispensing time.
- **Reference:** WHO medication-safety guidance — the last verification point
  before administration/dispensing should confirm allergy status; FHIR
  `MedicationDispenser` workflows embed a final safety check.
- **Status:** Partial — the check exists but only at prescribing time; a
  newly recorded allergy between prescription and dispensing is not caught.
- **Risk:** Medium — the pharmacist is the final barrier and currently has no
  allergy alert at the dispense action.
- **Proposed change:** call the deterministic allergy/duplicate rules inside
  `pharmacyDispensePrescription` (reuse a shared rule module, not the LLM
  pass) and surface a blocking/critical alert requiring acknowledgment.
- **Affected:** `pharmacyDispensePrescription`, `checkMedicationSafety`
  (extract shared rules to `base44/shared/`), Pharmacist prescription screen.
- **Acceptance test:** doctor prescribes after an old allergy record exists
  (no conflict), a new severe drug-allergy is recorded, the pharmacist's
  dispense attempt is blocked until acknowledged with a documented reason.

### DR-03 — Check-in gate and encounter-based documentation
- **Existing:** prescriptions, medications, clinical documents and notes are
  gated on an active checked-in visit (`checkInGate`,
  `getPatientCheckInStatus`); encounters carry hospital + doctor + department
  and full lifecycle (`createEncounter`, `updateEncounterStatus`).
- **Reference:** FHIR `Encounter` (status, class, participant, serviceProvider);
  ISO 27799 — documentation must be attributable to an encounter.
- **Status:** Satisfied — every clinical write path verifies an active
  encounter/visit server-side before creating records.
- **Risk:** Low.
- **Proposed change:** none.
- **Affected:** Encounter entity and all clinical create functions.
- **Acceptance test:** attempt to prescribe for a patient with no active
  check-in → server rejects; check in → write succeeds; audit log records both.

### DR-04 — Free-text preserved, coding attached alongside
- **Existing:** clinical notes keep narrative text (structured sections +
  draft persistence via `ClinicalNoteDraft`); ICD-11/LOINC codes are
  additive on summary/lab views (Phase 1); no coding replaces clinical
  documentation.
- **Reference:** HL7 CDS/FHIR guidance — coded data complements, never
  replaces, narrative documentation.
- **Status:** Satisfied.
- **Risk:** none.
- **Proposed change:** none (aligns with the user's stated requirement).
- **Acceptance test:** note with narrative sections saves and displays
  unchanged after coding is attached to the patient summary.

### DR-05 — Doctor directory integrity
- **Existing:** `doctorDirectory` filters out doctors without valid User
  profiles or with unregistered facilities; doctors join hospitals only by
  `hospital_code`; hospital association changes are logged
  (`hospitalUpdateDoctorAssociation`).
- **Reference:** OWASP ASVS 4.0 V4 — enforce least-privilege association;
  FHIR `PractitionerRole` (organization linkage must be valid).
- **Status:** Satisfied.
- **Risk:** Low.
- **Proposed change:** none.
- **Acceptance test:** a doctor with a revoked hospital association no longer
  appears routable for new encounters to that facility (re-verify after any
  portal change).