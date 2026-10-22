# Deliverable — Security Control Evaluation (OWASP ASVS 4.0 + healthcare security guidance)

Companion to `00-overview.md`. Every control is marked **VERIFIED** (evidence
read in code this audit), **TEST REQUIRED** (code looks right but needs an
acceptance test), or **EXTERNAL** (needs infrastructure/configuration outside
the current app).

## 1. Server-side authorization (ASVS V4.1 — "deny by default")

| Control | Evidence | Verdict |
|---|---|---|
| Portal access enforced by backend, not hidden UI | Every portal function resolves the caller's profile server-side (`pharmacistProfileManage`, `labTechnicianLogin`, `hospitalReceptionistLogin`, `doctorHospitalSession`) and returns **403** when absent; `getPatientClinicalRecord` returns 403 without an approved `AccessRequest` | VERIFIED |
| RLS on the data layer | 73 of 76 entities carry `rls` rules keyed on `patient_user_id` / `doctor_user_id` / role | VERIFIED |
| Cross-patient access via changed identifier/URL | Clinical entities key RLS on `patient_user_id`, never on client-passed ids; record views resolve the patient server-side from the doctor's approved access, not from a URL parameter | VERIFIED |
| CIN-only lookups (no name-based resolution) | `hospitalFindPatientByCin`, `labFindPatientByCin`, `pharmacyFindPatientByCin`, `radiologyFindRequestsByCin` — all audit the lookup | VERIFIED |
| Check-in gate before clinical writes | `checkInGate` / `getPatientCheckInStatus` verified server-side before notes, documents, prescriptions, medications | VERIFIED |
| Per-request radiologist authorization | `ImagingRequest.authorized_radiologist_user_ids` set only by `radiologyRespondAccess` (server-side); RLS read key | VERIFIED |

**TEST REQUIRED (regression):** none of the above is exempt from the test plan
in `11-test-plan.md` (category C — cross-patient access prevention); the
control is in code, the guarantee comes from the tests.

## 2. Consent and access lifecycle (FHIR Consent semantics, ISO 27799 §A.11.2)

| Control | Evidence | Verdict |
|---|---|---|
| Access states cover the lifecycle | `AccessRequest.status`: pending → approved → declined → revoked → suspended, persisted on the record | VERIFIED |
| Revoked access stops at the next read | Every read path filters `status: "approved"` server-side (`getPatientClinicalRecord`, `doctorPatientMedicalData`); there is no long-lived access token to leak — access is re-checked per request | VERIFIED |
| Radiologist revocation | Authorization lives on the request record and is removed server-side by `radiologyRespondAccess`; no session grants persist | VERIFIED |
| Consent records (FHIR `Consent` shape) | `Consent` entity: type, obtained-by, encounter, status given/declined/withdrawn, audit | VERIFIED |
| Revocation end-to-end behavior (stale caches, open views) | Frontend views may hold already-loaded data in memory — server enforcement stops further reads, but an open tab shows stale data until refresh | TEST REQUIRED (PT-01) |
| Withdrawn consent blocks a previously authorized scope | Same — `withdrawn` consent status exists; an automated check that a withdrawn consent cannot be relied on by any flow is not evidenced | TEST REQUIRED |

## 3. Audit trail (ASVS V7, ISO 27799 §A.12.4)

| Control | Evidence | Verdict |
|---|---|---|
| Sensitive actions logged | 40 backend functions write `ClinicalAuditLog` (record views, encounters, documents, signing, consents, requests, dispensing, cancellations); `AccessAuditLog` and `LabAuditLog` for their scopes | VERIFIED |
| Audit writes are tamper-resistant by users | Create/update/delete gated to admin/service role | VERIFIED |
| Audit logs readable only by the right parties | `ClinicalAuditLog` has **no read rule** — open to any authenticated user (XC-03); `AccessAuditLog`, `LabAuditLog` correctly scoped | VERIFIED (gap found) |
| Retention, archival, tamper-evidence | Not implemented (XC-06) | TEST REQUIRED / EXTERNAL (policy decision) |

## 4. File uploads (ASVS V1.12 / V5)

| Control | Evidence | Verdict |
|---|---|---|
| Content-type validation by real file signature | `labSubmitResults` checks the `%PDF-` signature / PNG-JPEG-WebP magic bytes, not the extension; ~3.3 MB cap enforced server-side | VERIFIED |
| Server-side (not client-side) validation | Validation happens in the backend function before storage | VERIFIED |
| Private storage for clinical files | Radiology study images, identity documents, clinical notes/encounter documents, dictation → `UploadPrivateFile` + access-checked signed URLs (`radiologyFileAccess`) | VERIFIED |
| **Public storage for other clinical files** | Patient documents, onboarding documents, referral attachments, radiologist result files, and all lab result uploads (`UploadFile` = retired public upload) → permanent world-readable URLs (XC-01) | VERIFIED (gap found) |
| Malware scanning of uploads | Not implemented | EXTERNAL (requires a scanning service; not available in-app) |

## 5. Authentication, sessions, API access (ASVS V2/V3/V6)

| Control | Evidence | Verdict |
|---|---|---|
| Platform-managed authentication | Email/password + OTP verification + OAuth providers are Base44 platform features (owned backend; the app implements no auth logic) | VERIFIED |
| Session handling | Platform-managed tokens; hard redirects after login; per-request authorization (no app-issued long-lived credentials to portals) | VERIFIED |
| Portal sessions tied to profiles | Session functions (`doctorHospitalSession`, `pharmacistLogin`, `labTechnicianLogin`, `hospitalReceptionistLogin`) re-resolve the profile server-side on use | VERIFIED |
| Revoked/stale sessions | Authorization is data-driven per request, not token-scoped — a stale session cannot confer access to revoked records beyond what the data allows | VERIFIED (design) — include in test category D |
| API access (app's own API) | The app's API authenticates with personal access tokens (platform feature); no app-issued keys exist | VERIFIED |
| Rate limiting / brute-force lockout | Platform-managed; not app-visible — cannot be verified from code | EXTERNAL (platform responsibility) |

## 6. Data protection (ASVS V6, ISO 27799)

| Control | Evidence | Verdict |
|---|---|---|
| RLS scoping on all clinical entities | Verified across 73 entities | VERIFIED |
| Known RLS exceptions | `Appointment` (none — XC-02), `MedicalTranslation` (open — XC-09), `User` (platform standard) | VERIFIED (gap found) |
| Separation of patient-reported vs clinically verified data | Allergy entry types, source labels, "never clinically verified" wording | VERIFIED |
| Backups, recovery, retention | Platform-managed storage; the app has no backup/retention documentation or restore drill (Section 7) | EXTERNAL |

## 7. Backups, recovery, retention — explicit statement

Base44 operates the database and storage; the app does not manage backups.
What can be verified and documented **within the app**:

- Retention policy: document one (proposal in `10-risk-register.md`, item R-14) — audit logs, corrected results, report versions and prescriptions are currently retained indefinitely.
- Restore drill: cannot be performed from inside the app — this is a
  **platform/hosting responsibility** and must be confirmed with Base44
  support or via the app dashboard's export features (entity data export,
  user export). Any claim of a tested restore is **not permitted without
  evidence** (constraint 6).
- Record-level export: available per entity from the dashboard; a full
  patient-record export function is proposed as a low-priority item (also
  serves the FHIR export phase).

## 8. Summary — verified vs not

- **Verified in code:** server-side authorization, RLS on 73 entities,
  CIN-only lookups, per-request access enforcement, revocation-on-read
  design, real-signature upload validation, private storage for radiology
  studies/identity documents, broad audit logging.
- **Gaps found (fix proposed):** public storage of five clinical upload
  groups (XC-01), no `Appointment` RLS (XC-02), open audit-log reads
  (XC-03), open `MedicalTranslation` writes (XC-09), missing
  re-check-at-dispensing (DR-02).
- **Requires testing in-app:** revocation end-to-end (stale views), consent
  withdrawal enforcement, regression across all portals (test plan).
- **Requires external configuration/decision:** malware scanning, rate
  limiting (platform), backups/restore drill (platform), retention policy
  sign-off, licensed drug knowledge base, FHIR endpoint operation.