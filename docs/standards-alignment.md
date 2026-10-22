# AMedix — Standards Alignment Framework (Phase 1: Clinical Coding)

This document records which international standards AMedix aligns with, where
each applies, and the rationale for what is implemented now versus deferred.
AMedix is an enhancement of the existing platform — no existing functionality,
records, or workflows are replaced; standards are attached alongside existing
data.

## Reference framework

| Standard | Owner | Applies in AMedix to | Status |
|---|---|---|---|
| HL7 FHIR | HL7 | Data exchange format; coding structure (CodeableConcept) | Partial — catalog entries carry FHIR system URIs so records can be exported as FHIR codings; full FHIR resources are a later phase |
| WHO ICD-11 (MMS) | WHO | Disease/diagnosis classification for conditions recorded at registration and by doctors | **Implemented** (catalog) |
| LOINC | Regenstrief | Laboratory test / panel identification | **Implemented** (catalog) |
| DICOM | NEMA | Imaging modality identification; PACS interop | **Implemented** for modality codes; full DICOM/PACS integration remains via the existing server-side PACS bridge |
| SNOMED CT | SNOMED International | Clinical terminology | **Excluded by decision** — Libya is not a SNOMED CT member country; production use would require a paid individual license. Documented as a gap; revisit if licensing is obtained |
| WHO SMART Guidelines | WHO | Evidence-based digital health workflows | Not selected for Phase 1 — applies to future clinical-decision features (e.g. medication safety ruleset) |
| OWASP ASVS | OWASP | Application security verification | Separate phase (security hardening) |
| ISO 27799 | ISO | Healthcare information security management | Separate phase (policy/process alignment) |
| Libyan requirements | MoH Libya | Medical practice, pharmacy, laboratory, records retention, privacy | Flagged — see below |

## Rationale — what applies where

- **Conditions / diagnoses** → ICD-11 MMS codes (system URI
  `http://id.who.int/icd/release/11/mms`). Broad lay terms the platform stores
  (e.g. "Diabetes Mellitus", "Heart Disease", "Cancer") are mapped to the
  corresponding ICD-11 **block (range) code** with an explicit note, because a
  lay term has no single stem code. Specific clinical terms map to stem codes.
- **Laboratory tests** → LOINC codes (system URI `http://loinc.org`). Panel
  level where the platform works at panel level (CBC, Lipid Profile, LFT, RFT),
  analyte level for individual results.
- **Imaging modalities** → DICOM modality codes (DX, CT, MR, US, MG; system
  URI `http://dicom.nema.org/medical/dicom`). These are the values of the DICOM
  Modality data element (0008,0060) and align the existing imaging-request
  workflow with PACS tagging.

## How it attaches (non-breaking)

1. **TerminologyCode catalog entity** — one record per mapping:
   `concept_type` (condition / lab test / imaging modality), the AMedix English
   and Arabic terms, `coding_system`, FHIR `system_uri`, `code`,
   `code_display`, optional `notes`. Readable by all app users; only
   administrators may edit.
2. **`terminologyLookup` backend function** — authenticated lookup that maps
   batches of terms (max 100) to codes; returns matched codings and an honest
   `unmatched` list. No fuzzy guessing: unknown terms stay uncoded.
3. **Doctor-facing display** — known conditions on the doctor's patient
   summary show their ICD-11 code; patient-submitted laboratory results show
   their LOINC code, when the catalog contains them.

## Libyan regulatory flags (require confirmation by a qualified Libyan
legal/regulatory authority — do not treat as settled)

- Health-data privacy and cross-border data handling: confirm the applicable
  Libyan data-protection instrument and whether patient health data may be
  hosted outside Libya.
- Medical-records retention period and lawful electronic-record status
  (patient-owned records with per-doctor authorization).
- Pharmacy and laboratory licensing requirements for electronic prescription
  and result workflows (including the substitution/dispensing authorization
  flow).
- Any required registration or approval of electronic health platforms with
  the Ministry of Health.

## Deferred (later phases)

- FHIR resource export (Patient, Encounter, DiagnosticReport, MedicationRequest,
  Consent, AuditEvent) built on the catalog's system URIs.
- OWASP ASVS / ISO 27799 security-hardening pass.
- SNOMED CT — only if licensing is obtained.
- Libya regulatory confirmations above.