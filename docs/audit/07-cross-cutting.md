# Audit — Cross-cutting (auth, RLS, audit, storage, workflows, terminology)

## Findings

### XC-01 — Clinical files uploaded to public storage (HIGH)
- **Existing:** `UploadPublicFile` is used for: patient documents
  (`PatientDocuments.jsx`), patient onboarding documents
  (`PatientOnboardingForm.jsx`), referral letter attachments
  (`ReferralLetterForm.jsx`), radiologist result files
  (`RadiologistSubmitResults.jsx`, `RadiologyRecordForm.jsx`), and — server
  side — lab result uploads (`labSubmitResults`, `labUploadResults`,
  `labCorrectResult`). Each produces a permanent, world-readable URL stored
  on the entity. Radiology **study images**, identity-verification documents,
  clinical-note/encounter documents and dictation correctly use private
  storage with access-checked resolution.
- **Reference:** ISO 27799 §A.12.3 — PHI must be stored with access control;
  OWASP ASVS V1.12 / V4 — no unauthenticated access to protected files.
- **Status:** Missing (for the public-upload list above).
- **Risk:** High — anyone with a link reads the file forever; URLs are also
  recorded in entities (visible to anyone who can read the entity).
- **Proposed change:** migrate the listed uploads to `UploadPrivateFile` +
  `CreateFileSignedUrl` (short-lived signed URLs) on every view; keep
  genuinely-public media (partner ad images, logos, profile photos) public.
- **Affected:** the six frontend components and three lab functions listed;
  every view that renders `file_url`/`result_file_url`/`report_file_url`.
- **Acceptance test:** unauthenticated GET of a migrated file URL fails;
  authorized views (patient, doctor, lab, department) render via signed URLs
  that expire; existing historical records keep rendering (backfill step for
  legacy file_url values).

### XC-02 — `Appointment` entity has no RLS (HIGH)
- **Existing:** `Appointment.jsonc` declares `rls: {}` — any authenticated
  app user can read, create, update or delete any appointment. Other clinical
  entities correctly scope on `patient_user_id`/`doctor_user_id`.
- **Reference:** OWASP ASVS V4.1.2 — deny access by default; ISO 27799
  §A.11 — access control on all PHI.
- **Status:** Missing.
- **Risk:** High — cross-patient appointment exposure and tampering
  (including deletion).
- **Proposed change:** add RLS scoping reads/updates to the involved patient
  and doctor (`patient_user_id`/`doctor_user_id` + admin), with creation via
  the existing server-side appointment functions.
- **Affected:** `Appointment`, `createDoctorAppointment`,
  `PatientAppointments.jsx`, `DoctorAppointments.jsx`.
- **Acceptance test:** user A cannot read or list user B's appointments
  (SDK filter returns empty/403); the doctor and patient involved still see
  theirs; acceptance/decline and reschedule flows still work.

### XC-03 — Clinical audit trail readable by any authenticated user (MEDIUM)
- **Existing:** `ClinicalAuditLog` RLS defines create/update/delete
  (admin-only) but **no read rule** — the default leaves reads open to every
  authenticated app user. `AccessAuditLog` (patient + admin) and
  `LabAuditLog` (lab + admin) are correctly restricted.
- **Reference:** FHIR `AuditEvent` — audit records are sensitive metadata
  (who viewed what); ISO 27799 §A.12.4 — logs must be protected from
  unauthorized access.
- **Status:** Partial.
- **Risk:** Medium — a patient can see which other users viewed records,
  including other patients' identifiers.
- **Proposed change:** restrict `ClinicalAuditLog.read` to the audit's own
  patient (`patient_user_id`) and admins, mirroring `AccessAuditLog`.
- **Affected:** `base44/entities/ClinicalAuditLog.jsonc`.
- **Acceptance test:** user A cannot list audit entries concerning user B;
  user B still sees entries about their own record; admins see all.

### XC-04 — Role model is a single platform `user` role (MEDIUM)
- **Existing:** every portal user has role `user`; portal authorization is
  enforced server-side by profile lookups (verified in 20+ functions).
- **Reference:** OWASP ASVS V4.1.5 — role-based access at both function and
  data layers; ISO 27799 least privilege.
- **Status:** Partial (details in HS-01).
- **Risk:** Medium — data-layer (RLS) rules key on user ids, which is correct,
  but there is no role backstop.
- **Proposed change:** optional role-split as HS-01; low urgency while
  function-level checks hold.
- **Acceptance test:** as HS-01.

### XC-05 — No FHIR export layer (LOW)
- **Existing:** `TerminologyCode` carries FHIR system URIs (Phase 1);
  records themselves are not exported as FHIR resources.
- **Reference:** HL7 FHIR R4 — Patient, Encounter, Condition,
  AllergyIntolerance, MedicationRequest, Observation, DiagnosticReport,
  ImagingStudy, DocumentReference, Consent, AuditEvent.
- **Status:** Missing (deliberately deferred in Phase 1; dependencies: LB-01
  structured results, DR-01 coded diagnoses).
- **Risk:** Low today; blocks interoperability goals.
- **Proposed change:** later phase — an export function mapping existing
  entities to FHIR resources using the catalog's system URIs.
- **Acceptance test:** exported Patient + Condition resources validate
  against the FHIR R4 profile with ICD-11 codings.

### XC-06 — Audit trail integrity and retention (MEDIUM)
- **Existing:** 40 backend functions write `ClinicalAuditLog`; writes are
  admin/service-role gated; entity RLS prevents user deletion — but records
  are plain rows: no tamper-evidence (hash chain / append-only
  verification), no documented retention period, no export.
- **Reference:** ISO 27799 §A.12.4 — logging, protection, retention; FHIR
  `AuditEvent` retention expectations.
- **Status:** Partial.
- **Risk:** Medium — an admin-level compromise or future code defect could
  alter history silently; retention is undefined (Libyan law: see regulatory
  flags).
- **Proposed change:** (a) add a retention policy field and a periodic
  archival/export workflow; (b) optional tamper-evidence: store a running
  hash per record chain (only if the Libyan regulator requires it — do not
  over-engineer).
- **Affected:** `ClinicalAuditLog`, `AccessAuditLog`, `LabAuditLog`,
  audit-writing functions.
- **Acceptance test:** an audit entry older than the retention period is
  archived (export file exists) and removed from the live store; normal
  users can never delete audit rows (existing behavior re-verified).

### XC-07 — Medication safety knowledge source (MEDIUM)
- **Existing:** deterministic allergy + duplicate-therapy rules over the
  patient's own record (strong, honest); drug–drug interaction review is an
  LLM pass marked advisory-only, never blocking, with explicit limitations
  text. No licensed interaction/contraindication database is integrated.
- **Reference:** WHO/clinical governance — interaction checking should use a
  validated, versioned drug knowledge base (e.g. a licensed database), not
  generative AI alone.
- **Status:** Partial (design is honest and safe-by-escalation, but the
  source is not a validated database).
- **Risk:** Medium — hallucination risk is mitigated (advisory, no invented
  blocking) but completeness of interaction coverage is not guaranteed.
- **Proposed change:** keep the current design until a licensed drug
  knowledge base (or curated WHO SMART Guidelines ruleset) is procured; then
  replace the LLM pass with rules from that source, keeping LLM output
  advisory.
- **Affected:** `checkMedicationSafety`, prescribing workflow.
- **Acceptance test (current design):** a severe documented drug allergy
  blocks prescription; AI advisories are labeled ai_assisted and can never
  block (existing tests to re-run).

### XC-08 — Two-identifier confirmation on patient-linking writes (MEDIUM)
- **Existing:** all clinical entities carry `patient_cin` + `patient_name`
  (+ DOB on lab/imaging requests); lookups are CIN-only
  (`hospitalFindPatientByCin`, `labFindPatientByCin`,
  `pharmacyFindPatientByCin`, `radiologyFindRequestsByCin`). No write path
  requires a second identifier match at the moment of linking.
- **Reference:** patient-identification safety practice (two identifiers:
  unique ID + full name or DOB) — the standard wrong-patient safeguard.
- **Status:** Partial — identifiers are recorded everywhere (good), but the
  linking confirmation depends on the operator typing the right CIN.
- **Risk:** Medium — one mistyped digit attaches a visit/results/prescription
  to the wrong patient.
- **Proposed change:** in the three counter flows (hospital, lab, pharmacy),
  require the displayed patient name and DOB to match the operator's
  confirmation before check-in/visit creation (a UI + server double-check,
  not a data change).
- **Affected:** `hospitalCheckInPatient`, `labCheckInPatient`,
  `pharmacyVisitManage` + their screens.
- **Acceptance test:** a check-in attempt whose confirmed name/DOB do not
  match the CIN's patient is rejected; the correct confirmation proceeds and
  is audited.

### XC-09 — `MedicalTranslation` open access (LOW)
- **Existing:** `MedicalTranslation` (Arabic/English clinical term catalog)
  has no RLS — readable and writable by any authenticated user.
- **Reference:** least privilege; data integrity.
- **Status:** Partial — read-open is arguably intended (it powers
  translation display), but write-open is not.
- **Risk:** Low — a user could corrupt translation pairs (UI nuisance, not
  clinical safety).
- **Proposed change:** open read; restrict create/update to admins
  (`user_condition role: admin`).
- **Acceptance test:** a non-admin write attempt fails; translation display
  keeps working for all users.

### XC-10 — Scheduled workflows (verified as designed)
- **Existing:** 7 workflows — critical-findings escalation scan (hourly),
  medication duration sync, medication reminders, partner lifecycle scan,
  patient appointment reminders, patient lab notifications, pharmacy expiry
  alerts — all driven by scheduled triggers with backend functions.
- **Reference:** operational reliability; each workflow's own clinical
  purpose (e.g. RD-02 escalation).
- **Status:** Satisfied as designed; per-workflow acceptance tests live in
  their portal files.
- **Risk:** Low.
- **Proposed change:** none.
- **Acceptance test:** run history shows scheduled executions; a missed run
  is visible in the dashboard.

## Compliance posture summary

- **Do not claim:** DICOM/PACS interop is operational (RD-01); lab results are
  FHIR `Observation`-grade (LB-01); medication checking is
  knowledge-base-backed (XC-07); full FHIR export exists (XC-05).
- **Do claim (evidenced):** patient-owned record with enforced
  authorization; server-side identity verification; CIN-based lookups;
  deterministic medication allergy/duplicate hard rules; broad clinical audit
  logging; ICD-11/LOINC/DICOM-modality codings attached alongside free text
  (Phase 1).