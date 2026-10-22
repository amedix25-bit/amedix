# Deliverable — Risk Register, Prioritized Changes, Implementation Plan

Consolidates `00-overview.md` + `07-cross-cutting.md` + `08-security-controls.md`
into the decision-ready register. Risk scoring: impact × likelihood, judged
against a live clinical platform holding real records.

## 1. Prioritized risk register

| Rank | ID | Risk | Impact | Likelihood | Priority | Mitigation status |
|---|---|---|---|---|---|---|
| 1 | XC-01 | Clinical files (patient docs, onboarding docs, referral attachments, radiologist result files, all lab result uploads) on permanent **public** URLs | Patient harm, privacy breach, legal exposure | High (URLs are guessable-persistent and logged in entities) | **CRITICAL** | Fix designed; not yet implemented |
| 2 | XC-02 | `Appointment` entity has no RLS — any authenticated user can read/modify/delete any appointment | Privacy breach, record tampering | Medium (requires an authenticated account) | **CRITICAL** | Fix designed; one-file change |
| 3 | XC-03 | `ClinicalAuditLog` readable by any authenticated user | Privacy breach (who-viewed-what metadata) | Medium | **HIGH** | One-file change |
| 4 | LB-01 | No structured lab values (units, reference ranges, flags) | Unsafe abnormal-value handling, no interoperability | Medium | **HIGH** | Optional-layer design; needs UI |
| 5 | DR-02/PH-01 | No allergy re-check at dispensing | Patient safety (missed new allergy) | Low–Medium | **HIGH** | Shared-rule design exists |
| 6 | RD-01 | PACS/DICOM fields exist without operational verification | False sense of integration | Situational | **MEDIUM** | Honest gating in place; deployment test required |
| 7 | XC-08 | No second-identifier confirmation at counter check-ins | Wrong-patient linking | Low (CIN-only lookups) | **MEDIUM** | UI+server double-check designed |
| 8 | XC-06 | No retention policy / no tamper-evidence on audit logs | Legal exposure | Low | **MEDIUM** | Policy decision required |
| 9 | XC-04 | Coarse role model (single `user` role) | Weakened defense-in-depth | Low (function checks hold) | **MEDIUM** | Optional role split |
| 10 | XC-07 | Interaction checking is AI-advisory, not knowledge-base-backed | Missed interactions | Low (labeled advisory) | **MEDIUM** | External procurement decision |
| 11 | PT-01 | Consent/revocation enforcement not regression-tested | Latent access leak | Low (design verified) | **MEDIUM** | Test required |
| 12 | XC-09 | `MedicalTranslation` open to user writes | Data corruption (non-clinical) | Low | **LOW** | One-file change |
| 13 | XC-05 | No FHIR export | Blocks interoperability only | — | **LOW** | Deferred pending approval |
| 14 | DR-01 | Doctor diagnoses uncoded | Reporting/export only | — | **LOW** | Additive change designed |
| 15 | LB-02 | LOINC not attached to lab orders | Interoperability only | — | **LOW** | Additive change designed |
| 16 | PH-03/PH-04 | Pharmacy subscription/refund gaps | Commercial, not clinical | — | **LOW** | Existing open todos |

## 2. Recommended changes by priority

**CRITICAL (do first)**
1. C1 — XC-01: migrate the six clinical upload groups to private storage +
   short-lived signed URLs (server functions + views; keep ad images, logos,
   profile photos public). Includes backfilling legacy file references
   (re-upload pattern is *not* needed: existing public files remain readable
   until replaced — new uploads go private immediately, and a backfill pass
   re-stores legacy files privately via `securityBackfill`-style processing).
2. C2 — XC-02: add RLS to `Appointment` (patient/doctor/admin scoping).
3. C3 — XC-03: restrict `ClinicalAuditLog.read` to the record's patient + admin.

**HIGH**
4. H1 — DR-02/PH-01: extract the deterministic allergy/duplicate rules into
   `base44/shared/` and re-run them at dispensing with a required
   acknowledgment.
5. H2 — LB-01: optional structured results layer (values, UCUM units,
   reference ranges, H/L/N flags) with abnormal-flag surfacing to patient and
   doctor views.

**MEDIUM**
6. M1 — XC-08: two-identifier confirmation at hospital/lab/pharmacy
   check-ins (name + DOB confirmation against the CIN-resolved record).
7. M2 — XC-09: restrict `MedicalTranslation` writes to admin.
8. M3 — XC-06: document retention policy; add archival workflow when a
   retention period is decided.
9. M4 — XC-04 (optional): named portal roles in the User entity; only if
   adopted, with a careful migration (defaults preserved).

**LOW**
10. L1 — DR-01: code doctor diagnoses to ICD-11 alongside free text.
11. L2 — LB-02: attach LOINC to lab request test entries.
12. L3 — XC-05: `fhirExport` function per `09-fhir-mapping.md` (only on
    explicit approval).
13. L4 — PH-03/PH-04: pharmacy subscription UI + refund round-trip
    (existing product todos).

## 3. Implementation plan (dependencies, migration, rollback)

| Step | Change | Depends on | Migration risk | Rollback |
|---|---|---|---|---|
| 1 | C2, C3, M2 (entity RLS edits) | none | **Low** — rules are stricter, not looser; existing users are unaffected because all clinical RLS keys already exist on records. Risk: an entity whose legacy records lack `patient_user_id` would lose visibility → run/verify `securityBackfill` first (it exists for exactly this) | Revert the entity file (restore previous rls) |
| 2 | C1 (private uploads) | Step 1 (so file resolution obeys RLS) | **Medium** — views must resolve signed URLs before rendering; a missed view = broken image. Mitigation: migrate one group at a time (start lab results), keep old records rendering until backfilled | Point uploads back to public; views already tolerate both |
| 3 | C1 backfill of legacy files | Step 2 | Low–Medium — long-running pass over `MedicalDocument`, `LabRequest`, `ReferralLetter`, radiologist results; idempotent, records `migrated` flag | None needed (additive) |
| 4 | H1 (dispensing re-check) | none | **Low** — new rule path added; existing dispensing flows unchanged when no alert fires | Remove the call |
| 5 | H2 (structured lab results) | none (backend layer first) | **Low** — optional array; file results stay the norm; UI reads it only when present | Ignore the field |
| 6 | M1 (two-identifier confirmation) | none | **Low** — adds a confirmation step; staff training note | Remove the check |
| 7 | L1, L2 (terminology attachment) | terminologyLookup (exists) | **Low** — additive fields; unmatched terms save uncoded | Stop resolving; fields inert |
| 8 | L3 (FHIR export) | Steps 5, 7 + explicit approval + C1/C2/C3 | Low (read-only export) | Delete the function |
| 9 | L4 (pharmacy product items) | none | product work, no clinical data change | n/a |

**Testing at every step:** the acceptance tests below and in the portal files;
synthetic records only; no destructive operations on production data; staging
(where available) before production (see `11-test-plan.md`).

## 4. Requirements needing external integration, infrastructure, or legal review

| Requirement | Category | Owner / next step |
|---|---|---|
| Malware scanning of user uploads | External service | Needs a scanning vendor or platform feature; blocked until one exists |
| Rate limiting / brute-force protection | Platform responsibility | Base44 platform; cannot be configured or verified in-app |
| Backup + restore drill | Platform/hosting | Confirm with Base44 support / dashboard export; document the result; no compliance claim until tested |
| Retention period decision (audit logs, results, reports) | **Legal review** | Libyan retention requirements — clinical/legal sign-off before M3 |
| Licensed drug-interaction knowledge base | External integration + licensing | Procurement decision (XC-07); keep AI advisory until then |
| PACS/DICOM interop verification | External (vendor) | Facility imaging team; per-deployment acceptance test (RD-01) |
| FHIR API operation / terminology server | Explicit approval required | Deferred (L3); no FHIR server stood up in-app |
| External exposure of any patient data | **Legal + authorization** | Prohibited by constraint 6 until authorization exists |
| Regulatory compliance claims (HIPAA-equivalent, ISO 27799 certification) | **Legal review** | Do not claim; controls documented, certification not sought |
| Native push for critical findings | Platform capability | Only with a native mobile build; in-app + audited escalation already covers the requirement |