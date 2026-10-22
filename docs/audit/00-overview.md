# AMedix — Standards Audit (Phase 2)

Audit of the **existing** implementation against the reference framework in
`docs/standards-alignment.md`. Nothing was modified; every finding is based on
the actual code, entity schemas and backend functions read for this audit
(inventory: 26 pages, 76 entities, 100 backend functions, 7 workflows).

## Method and evidence base

- Portal-by-portal inspection of `src/pages/*` and `src/components/{patient,doctor,lab,radiology,radiologist,pharmacy,hospital,partner,admin}/*`.
- Entity-level inspection of `base44/entities/*.jsonc` (schemas + Row-Level Security rules) — 73 of 76 entities carry RLS.
- Backend-function inspection of `base44/functions/*` (access enforcement, duplicate prevention, audit writes, file storage).
- Standards mapping per `docs/standards-alignment.md` (FHIR R4 resources, ICD-11 MMS, LOINC, DICOM, OWASP ASVS, ISO 27799, Libyan regulatory flags).
- **Rule applied:** a feature is only marked compliant when the code proves it. Name resemblance to a standard resource is never treated as compliance (e.g. the "Imaging Viewer" is not claimed as DICOM interop; the medication "safety checker" is not claimed as a drug-knowledge-base check).

## Findings register

| ID | Area | Title | Status | Risk |
|---|---|---|---|---|
| XC-01 | Cross-cutting | Clinical files uploaded to **public** storage | Missing | High |
| XC-02 | Cross-cutting | `Appointment` entity has **no RLS** | Missing | High |
| XC-03 | Cross-cutting | `ClinicalAuditLog` readable by any authenticated user | Partial | Medium |
| XC-04 | Cross-cutting | Role model is a single `user` role; portal access enforced by server-side profile checks | Partial | Medium |
| XC-05 | Cross-cutting | No FHIR export (Patient, Encounter, DiagnosticReport, MedicationRequest, Consent, AuditEvent) | Missing | Low |
| XC-06 | Cross-cutting | Audit trail not tamper-evident; no retention policy | Partial | Medium |
| XC-07 | Cross-cutting | Medication safety: no licensed drug-interaction knowledge base | Partial | Medium |
| XC-08 | Cross-cutting | No two-identifier (CIN + DOB) check on every patient-linking write | Partial | Medium |
| XC-09 | Cross-cutting | MedicalTranslation readable/writable by all authenticated users | Partial | Low |
| DR-01 | Doctor | Doctor-entered `Diagnosis` records not yet coded to ICD-11 | Partial | Low |
| DR-02 | Doctor | Prescriptions record the safety check but pharmacy dispensing does not re-verify allergies | Partial | Medium |
| LB-01 | Laboratory | Results are document-based; no structured values, units, reference ranges, abnormal flags | Missing | High |
| LB-02 | Laboratory | LOINC codes exist in the catalog but are not attached to lab requests/tests | Partial | Low |
| LB-03 | Laboratory | Lab result file uploads use public storage | Missing | High (subsumed by XC-01) |
| RD-01 | Radiology | DICOM/PACS integration is configured-but-unverified | Partial | Medium |
| RD-02 | Radiology | Critical-findings escalation: push/email reach depends on native build + registered users | Partial | Low |
| PT-01 | Patient | Patient withdrawal of consent / access revocation: enforcement verified for radiologist access; lab/doctor access revocation needs end-to-end test | Partial | Medium |
| HS-01 | Hospital | Receptionist/technician access is server-side per-profile; no distinct role in the User entity | Partial | Medium |

Portal-level detail: `01-patient.md`, `02-doctor.md`, `03-laboratory.md`,
`04-radiology.md`, `05-pharmacy.md`, `06-hospital.md`, cross-cutting detail:
`07-cross-cutting.md`.

## Top risks (priority order)

1. **XC-01 / LB-03** — clinical documents, patient uploads, referral letters, lab
   results and some radiologist outputs are stored with a permanent public URL.
   Anyone holding the link can read them. ISO 27799 / privacy risk.
2. **XC-02** — appointments are readable and writable by any authenticated user
   (entity carries no RLS rule).
3. **LB-01** — laboratory results have no structured data layer (values, units,
   reference ranges, flags), so FHIR `Observation`/`DiagnosticReport` exchange
   and abnormal-flag safety logic are impossible today.
4. **XC-03** — the clinical audit trail is readable by any authenticated user.

## What is already solid (verified, not assumed)

- **Patient-owned record + access control:** clinical record access requires an
  **approved** `AccessRequest` (`getPatientClinicalRecord` returns 403 without
  it); radiologist access is granted per-request via
  `authorized_radiologist_user_ids`; lab requests only reach a laboratory after
  the patient authorizes it (`authorized_by_patient`).
- **Identity verification is server-side:** document extraction and field
  matching (`verifyIdentityDocument`) happen in a backend function; entered data
  is never modified to force a match; only the service role can produce a
  verified status.
- **Duplicate prevention is server-side:** duplicate check-ins
  (`hospitalCheckInPatient`), duplicate dispensing
  (`pharmacyDispensePrescription`), duplicate prescriptions/reports and
  terminology backfill (`securityBackfill`).
- **Audit logging is broad:** 40 backend functions write `ClinicalAuditLog`
  (views, encounters, documents, signing, consent, requests, dispensing,
  cancellations).
- **Immunization**: vaccines, screenings and preventive care collected with
  explicit `kind` taxonomy (registration entry forms).
- **Medication safety design:** deterministic hard rules (severe drug allergy
  blocks; moderate/mild warn + require acknowledgment; duplicate therapy warns
  critical) over verified record data, with AI interaction review marked
  advisory-only and honest limitations text — no invented interaction rules.
- **Records linking:** `patient_id`, `patient_user_id` (RLS key), `patient_cin`
  and `patient_name` are carried consistently on clinical entities.
- **Result lifecycle:** lab corrections never overwrite originals; radiology
  report versions, drafts and status history are retained.