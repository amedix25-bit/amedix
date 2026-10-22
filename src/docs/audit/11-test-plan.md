# Deliverable — Test & Acceptance Plan

Every test uses **synthetic data only** (create dedicated test patients/
doctors/labs where needed and delete them after, per the existing "delete
synthetic records" practice). No destructive actions on production records.
"Staging" inside Base44 = running against this app before publishing, plus a
cloned copy for risky steps if available; tests that cannot run here are
marked **EXTERNAL**.

Test owners run these in the app (Testing Agent or manually); each maps to a
finding ID in `00-overview.md`.

## A. Patient identity and record linkage (XC-08, PT-02)
- A1 — CIN lookup with a wrong digit: no patient resolves; lookup is audited.
- A2 — CIN resolves but confirmed name/DOB mismatch at check-in → blocked
  (after M1; before M1, document the residual risk).
- A3 — All clinical records created in one visit carry the same `patient_id`,
  `patient_cin`, `patient_user_id`.
- A4 — Identity document verification: mismatch of DOB or national ID fails
  verification; entered data is never auto-corrected.
- **EXTERNAL:** none.

## B. Data validation and duplicate submissions (server-side controls)
- B1 — Double-click dispensing: second attempt returns the existing fill, not
  a second transaction.
- B2 — Duplicate check-in for the same visit: rejected with the existing
  check-in returned.
- B3 — Lab result file validation: renamed `.pdf` (real image bytes) is
  rejected; oversized file (>3.3 MB) is rejected with a clear error.
- B4 — Radiology report finalize twice: versioned, not duplicated.
- B5 — Terminology backfill run twice: no duplicate codes.
- **EXTERNAL:** none.

## C. Role-based and cross-patient access prevention (XC-02, XC-03, XC-09)
- C1 — Authenticated user B cannot read user A's appointments
  (after C2 fix); before the fix, record the exposure as the baseline.
- C2 — User B cannot list user A's clinical audit entries (after C3 fix).
- C3 — User B cannot write a `MedicalTranslation` record (after M2).
- C4 — Direct SDK/entity access with a forged/foreign id returns nothing for
  all clinical entities (spot-check: Medication, MedicalCondition,
  Prescription, ImagingRequest, ClinicalNote).
- **EXTERNAL:** penetration testing of the public endpoints is beyond the
  in-app test surface; the app's security scan (dashboard → Security) covers
  the static portion.

## D. Consent, access approval, revocation (PT-01, XC-01 design)
- D1 — Doctor without an approved request → `getPatientClinicalRecord` 403.
- D2 — Patient approves → doctor sees the record; approval timestamp audited.
- D3 — Patient revokes → doctor's next read fails; doctor's open tab shows
  stale data only until navigation (document the behavior; no server
  continuation).
- D4 — Radiologist: request access → patient authorizes → radiologist sees
  only that request; revocation removes it.
- D5 — Suspended ("eye off") doctor: in list but blocked from reads until
  restored.
- **EXTERNAL:** none.

## E. Clinical record creation and modification history
- E1 — Note → draft → save → sign: draft persists per doctor; signed record
  is versioned; amendments create new versions, originals intact.
- E2 — Encounter complete → further writes blocked by the check-in gate.
- E3 — Every create/update in E1–E2 has an audit entry with actor + datetime.
- **EXTERNAL:** none.

## F. Laboratory order-to-result linkage (LB-01 after H2)
- F1 — Request → patient authorization → collection → results → verification
  → release: every step timestamped and audited; the lab never sees the
  request before authorization.
- F2 — Correction: original file and values preserved; corrected entry
  recorded with professional + reason.
- F3 — (after H2) structured value with an abnormal flag renders `H/L` on
  patient and doctor views.
- **EXTERNAL:** none.

## G. Imaging order-to-report linkage (RD-01..RD-05)
- G1 — Request → department acceptance → scheduling → performance → images →
  reporting → final → released: full status history present.
- G2 — Critical finding flagged → doctor and patient notified → hourly
  escalation fires when unacknowledged (verify workflow run history).
- G3 — Radiologist views only authorized requests.
- G4 — Study images render via signed URLs; the signed URL expires.
- G5 — **PACS launch (EXTERNAL — requires a facility with real PACS):**
  single-use token works once, fails on reuse, expires after 15 minutes;
  correct study opens by `study_instance_uid`.
- **EXTERNAL:** G5, plus DICOMweb verification against a vendor endpoint.

## H. Prescription-to-dispensing linkage (H1 after DR-02)
- H1 — Prescribe → safety check recorded → authorize pharmacy → reserve →
  dispense (partial) → refill accounting → payment record: every link audited;
  quantity limits and refill counts enforced server-side.
- H2 — Recalled/quarantined/expired batch: dispensing blocked with the
  documented error.
- H3 — (after H1 change) new severe allergy between prescription and
  dispensing blocks dispense until acknowledged.
- H4 — Substitution requires doctor approval; auto-substitution impossible.
- **EXTERNAL:** none.

## I. File upload security (XC-01 after C1)
- I1 — Unauthenticated GET of any migrated clinical file URL fails.
- I2 — Authorized views (patient, doctor, lab, department, radiologist)
  render their files via short-lived signed URLs.
- I3 — Backfill: legacy records keep rendering during and after migration.
- **EXTERNAL:** malware scanning (not available in-app).

## J. Error handling and interrupted workflows
- J1 — Kill the browser mid-note: the draft survives; reopening restores it.
- J2 — Network failure during dispensing: no partial transaction; state
  consistent (verify prescription + inventory movement + payment).
- J3 — Failed uploads: clear error, no orphaned records (ad subscription
  validation precedent).
- **EXTERNAL:** none.

## K. Backup restoration and recovery
- K1 — Entity-level export from the dashboard for each clinical entity;
  integrity spot-check.
- K2 — **EXTERNAL (platform):** full restore drill — cannot be performed
  inside the app. Requires Base44 support/hosting confirmation. **No backup
  or recovery claim is made until K2 produces evidence.**

## L. Regression across all portals (after every change above)
- Smoke list, in order: patient register → identity verify → doctor join
  hospital by code → check-in → encounter → note → prescription → lab request
  → lab results → imaging request → radiology report → patient views all →
  pharmacy dispense → hospital checkout → admin partner flow. Any red failure
  blocks the change that caused it.

## What cannot be tested within Base44 (summary)

| Item | Required expertise / infrastructure |
|---|---|
| Full backup/restore drill (K2) | Base44 platform support / hosting operations |
| Malware scanning of uploads | A scanning service or platform feature |
| Rate limiting / DoS resilience | Platform infrastructure |
| PACS/DICOM interop (G5) | A facility's real PACS + its imaging team |
| Penetration testing of public endpoints | External security professional |
| FHIR conformance validation | A FHIR validator (e.g. HL7 validator) when L3 is approved |
| Regulatory certification | Legal/compliance counsel — not attempted |