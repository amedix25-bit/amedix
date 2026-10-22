# Audit — Laboratory Portal (`/lab`, `/lab-portal`, `/lab-technician`)

## Scope reviewed
Lab requests (doctor-created, patient-authorized), test catalogs and panels,
specimen types, collection, visit flow, results upload, correction,
verification, finalization, release, audit log, notifications, payment records.

## Findings

### LB-01 — No structured result values (units, reference ranges, abnormal flags)
- **Existing:** results are delivered as documents — `LabRequest.result` (text)
  and `result_file_url` (PDF/image) — plus a structured workflow (specimen
  collection datetime, accession number, processing notes, verification
  fields, corrections that never overwrite originals). `PatientLabResult` is
  likewise file-based. There is **no** per-test structured value with unit,
  reference range or abnormal flag anywhere in the schema.
- **Reference:** FHIR R4 `DiagnosticReport` + `Observation` — a
  standards-aligned lab result requires `Observation.valueQuantity` (with
  UCUM units), `referenceRange`, and `interpretation` flags (H/L/N);
  LOINC identifies each Observation. Without this layer, abnormal-flag
  safety logic and FHIR exchange are impossible.
- **Status:** Missing (workflow layer Satisfied; data layer Missing).
- **Risk:** High — no machine-readable results; critical values cannot be
  flagged automatically; future exchange/interoperability blocked.
- **Proposed change (non-breaking, preserves existing workflow):** add an
  optional structured result set on `LabRequest` — array of
  `{test_name, loinc, value, unit (UCUM), reference_low, reference_high,
  abnormal_flag (H/L/N/A), result_type (quantitative/qualitative),
  qualitative_value, verified}`. Technicians may optionally key values in;
  file results remain the norm. Never require it.
- **Affected:** `LabRequest` entity, `labSubmitResults`/`labUploadResults`,
  technician results form, patient lab results view.
- **Acceptance test:** a technician keys a structured value with a unit
  outside its reference range → the record stores value + UCUM unit +
  abnormal flag `H`; the patient and doctor views render the flag; a
  file-only result continues to work unchanged.

### LB-02 — LOINC codes exist in the catalog but are not attached to requests
- **Existing:** `TerminologyCode` maps lab tests (panels + analytes) to LOINC;
  patient-submitted result test types show LOINC codes; `LabRequest.tests[]`
  stores plain names + specimen only.
- **Reference:** LOINC — every ordered test/observation should be identified
  by its LOINC code; FHIR `ServiceRequest.code` (order) and
  `Observation.code` (result).
- **Status:** Partial.
- **Risk:** Low — orders cannot be matched to results cross-system.
- **Proposed change:** when the doctor submits the request, resolve each
  test name via `terminologyLookup` (`lab_test`) and store `loinc` +
  `system_uri` on the test entry (alongside the name, non-breaking).
- **Affected:** `createLabRequest`, `LabTestPicker.jsx`, `LabRequest.tests`.
- **Acceptance test:** request "Complete Blood Count (CBC)" → stored test
  entry carries its LOINC code; an unmatched test name saves uncoded.

### LB-03 — Result file uploads use public storage
- **Existing:** `labSubmitResults`, `labUploadResults`, `labCorrectResult`
  upload result files with `UploadPublicFile` → permanent public URLs.
- **Reference:** ISO 27799 §A.12.3 — PHI must be stored access-controlled;
  OWASP ASVS V1.12 — file storage must enforce authorization.
- **Status:** Missing (see XC-01).
- **Risk:** High — lab reports are readable by anyone with the URL.
- **Proposed change:** switch these three functions to `UploadPrivateFile`
  and resolve views with `CreateFileSignedUrl` (short-lived), as already done
  for radiology study images.
- **Affected:** the three lab result functions; patient/doctor lab views.
- **Acceptance test:** unauthenticated GET of a result file URL fails; the
  authorized patient/doctor/lab views load via a signed URL that expires.

### LB-04 — Request lifecycle, verification and corrections
- **Existing:** status machine
  `requested → authorized → pending → results` with specimen collection
  datetime + collector, accession number, processing notes, verification
  (professional, datetime), release datetime; corrected results are separate
  files with reason/professional/datetime; original preserved; every step
  audited in `LabAuditLog` (read restricted to the laboratory + admin).
- **Reference:** ISO 15189 (lab quality) verification concept; FHIR
  `DiagnosticReport.status` lifecycle (registered → partial → final →
  corrected → amended).
- **Status:** Satisfied (workflow and auditability), with the data layer gap
  tracked as LB-01.
- **Risk:** Low.
- **Proposed change:** none.
- **Acceptance test:** verify a result → release → correct it: the original
  file remains intact and both versions appear in history with their
  professionals and timestamps.

### LB-05 — Patient authorization gate
- **Existing:** requests are invisible to the laboratory until the patient
  authorizes (`lab_id`, `authorized_by_patient`, `authorization_datetime`
  set server-side by `authorizeLabRequest`).
- **Reference:** ISO 27799 — disclosure of PHI requires authorization;
  FHIR `Consent`/`Task` pattern.
- **Status:** Satisfied.
- **Risk:** Low.
- **Proposed change:** none.
- **Acceptance test:** an unauthorized lab's worklist does not include the
  request; after patient authorization it appears, and the authorization
  timestamp is recorded in the audit log.