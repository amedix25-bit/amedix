# Deliverable — Standards-to-Feature Mapping Matrix (FHIR R4)

Reference mappings only — **no database rebuild, no new tables per resource**.
Existing entities and fields are the source of truth; mappings are how the
same data *would be* expressed as FHIR resources when export is built
(XC-05, low priority, explicitly deferred until approved).

Legend: ✅ direct field mapping · 🔸 derivable (code transforms it) · ⛔ missing
(see gap reference).

| FHIR Resource | AMedix source | Mapping | Gaps |
|---|---|---|---|
| **Patient** | `PatientProfile` | `identifier` = CIN; `name` = first/father/grandfather/last (en + ar via extensions); `birthDate`, `gender`, `contact` (phone_numbers, emergency_contacts), `address` | ✅ near-complete |
| **Practitioner** | `DoctorProfile`, `RadiologistProfile` | `identifier` = profile id; `name`; `PractitionerRole` specialty via `doctor_specialization` | 🔸 |
| **Organization** | `HospitalProfile`, `LaboratoryProfile`, `PharmacyProfile` | `name`, `address` = location, `contact` = phone; hospital_code as identifier | ✅ |
| **Encounter** | `Encounter` | `identifier` = encounter_id; `status` (active/completed/cancelled → in-progress/finished/cancelled); `class` from encounter_type; `participant` = doctor; `serviceProvider` = hospital | ✅ |
| **Condition** | `MedicalCondition` | `code` = ICD-11 (via `TerminologyCode`, `system_uri` http://id.who.int/icd/release/11/mms) + `code.text` = name/name_ar; `clinicalStatus` from current_status; `asserter` = patient (patient-reported) | ✅ (DR-01 for `Diagnosis` entity) |
| **AllergyIntolerance** | `Allergy` | `code` = allergen; `category` = allergy_type; `type` = allergy → intolerance for reported_side_effect; `criticality`/`reaction` from severity/reaction; `recordedDate` | 🔸 (criticality not stored — optional) |
| **Immunization** | `Immunization` | `vaccineCode`/`code` = name; `occurrenceDateTime` = date; `status` | ✅ (no CVX/ICD code — optional enhancement) |
| **FamilyMemberHistory** | `FamilyHistory` | `relationship` = relation; `condition` = condition (+ ICD-11); `ageAtOnset` = age_at_diagnosis | ✅ |
| **Observation** | `PatientLabResult`, **structured layer missing** | `code` = LOINC (catalog exists); `valueQuantity` + UCUM unit; `referenceRange`; `interpretation` flags | ⛔ LB-01 — blocking dependency |
| **ServiceRequest (lab)** | `LabRequest` | `identifier` = request_id/accession; `code` = tests (LOINC — LB-02); `specimen` = specimen_type + collection datetime; `intent` = order | 🔸 |
| **ServiceRequest (imaging)** | `ImagingRequest` | `code` = modality (DICOM) + examination; `priority`; `reasonCode` = clinical_indication; `supportingInfo` = MRI safety screen | ✅ |
| **DiagnosticReport (lab)** | `LabRequest` result stage | `basedOn` = LabRequest; `result` = Observations (⛔ LB-01); `conclusion` = result text; `presentedForm` = result_file_url; `status` maps the verification lifecycle (corrected results → `corrected`) | ⛔ LB-01 |
| **DiagnosticReport (imaging)** | radiology report versions | `imagingStudy` = study_instance_uid; `performer` = radiologist; versioned addenda; `presentedForm` = report_file_url | ✅ |
| **ImagingStudy / ImagingReport** | `ImagingRequest` | `instance.uid` = study_instance_uid; `identifier` = accession_number; `series` = image_file_urls (in-app files are **not** DICOM instances — mapping limited to identifiers) | 🔸 (RD-01 honesty: no DICOM interop claim) |
| **MedicationRequest** | `Prescription` (+ `Medication` doctor_prescribed) | `identifier` = prescription_id; `medicationCodeableConcept` = medication_name/active_ingredient; `dosageInstruction` = dosage/frequency/route/duration; `dispenseRequest` = quantity + refills_authorized; `recorder` = doctor | ✅ |
| **MedicationStatement** | `Medication` (patient_reported) | `informationSource` = patient vs practitioner (source field); `status` = current_status; `note` = stop_reason | ✅ |
| **MedicationDispense** | `Prescription` dispensing_events + `PaymentTransaction` | `quantity` = dispensed_quantity; `whenHandedOver` = dispensed_datetime; `performer` = pharmacist/pharmacy; batch → `LotNumber`; substitution → `substitution` (authorized workflow) | ✅ |
| **Medication** (concept) | `DrugCatalog` | `code` = product; `ingredient` = active_ingredient | 🔸 |
| **Consent** | `Consent` + `AccessRequest` + radiologist authorization | `category` = consent_type; `provision` = status (given/withdrawn); `patient` = patient_user_id | ✅ |
| **AuditEvent** | `ClinicalAuditLog`, `AccessAuditLog`, `LabAuditLog` | `type` = action; `agent` = actor; `patient` = patient_user_id; `recorded` = datetime | ✅ (⚠ XC-03 read scope first) |
| **Provenance** | derivable | entity audit entries + signing records (`signClinicalDocument`) → `Provenance` for signed documents | 🔸 |
| **DocumentReference** | `MedicalDocument`, clinical documents | `category` = category enum; `type` = type; `content.attachment` = file (⛔ XC-01 must be private first); `docStatus` | ✅ |
| **Appointment** | `Appointment` | `start` = date/time; `participant` = patient/doctor; `status` maps incl. reschedule history | ⚠ fix XC-02 (RLS) first |

## Sequencing (backwards-compatible only)

1. **No schema rebuild is required** for: Patient, Practitioner, Organization,
   Encounter, Condition, AllergyIntolerance, Immunization, FamilyMemberHistory,
   ServiceRequest (imaging), DiagnosticReport (imaging), MedicationRequest,
   MedicationStatement, MedicationDispense, Consent, AuditEvent,
   DocumentReference, Appointment — all map from existing fields.
2. **Dependencies before a meaningful export:** LB-01 (structured lab
   results → `Observation`), DR-01 (coded diagnoses → `Condition`),
   XC-01 (private files → `DocumentReference`), XC-02/XC-03 (RLS fixes so
   exported data is safe to produce).
3. **Incremental, additive changes** (no rewrites):
   - LB-02: add `loinc` + `system_uri` to `LabRequest.tests` entries (optional field, old data unchanged).
   - DR-01: resolve ICD-11 on diagnosis save, store alongside free text.
   - LB-01: optional structured-results array on `LabRequest` (file results remain valid).
4. **Only when explicitly approved** (constraint: "Implement actual FHIR
   APIs… only when justified… explicitly approved"): a `fhirExport`
   backend function producing the mappings above as JSON; no FHIR server is
   stood up, nothing external is exposed.

## Data-migration & rollback notes

- Every change above is **additive** (new optional fields / new derived
  output) — no existing field is renamed, retyped or removed; rollback is
  "stop writing the new field".
- `securityBackfill` already demonstrates the safe backfill pattern
  (idempotent, server-side, duplicate-checked); any coding backfill reuses it.
- No production data is deleted or reset in any step; synthetic records only
  for testing (constraint 6).