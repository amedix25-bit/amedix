# Endocrinology — audit, templates, coding and safety traceability

Record of the Paragraph 2 audit of the existing Endocrinology Specialty System:
what was inspected, what was preserved, what was strengthened, and on what basis.
Sources: `src/lib/endocrineReferences.js`. Codes: `src/lib/endocrineIcd11.js`.
Implementation: `src/lib/endocrineDocuments.js` + `endocrineSafetyRules.js`.

## 1. Audit of what already existed

Eight note types were found and inspected end to end (fields, conditional logic,
validation, workflow):

`endo_consultation` · `endo_followup` · `endo_diabetes_followup` ·
`endo_thyroid_followup` · `endo_progress_note` · `endo_care_plan` ·
`endo_medication_adjustment` · `endo_discharge_summary`

All eight were **strengthened in place**. Keys, labels and order are unchanged;
every addition is appended, so saved notes keep their meaning and every workflow
reading a note by key keeps working. No patient record, saved note, permission or
audit entry was touched.

Two fields were already absent before this work, retired by the shared note policy
and not by this change: `medication` (labelled "Medication") and the free-text
`thyroid_exam`, which the policy replaces with the structured Select Examination.
Both were confirmed pre-existing, not regressions.

## 2. Duplication removed (shared AMedix surfaces)

The audit found that an earlier draft had re-collected values AMedix already
provides. Removed, so the notes do not duplicate shared tabs:

- the generic biochemistry panels (sodium, potassium, corrected calcium, glucose,
  eGFR) — laboratory results live in the shared record and attach to the note;
- the anthropometry/vitals block (weight, height, waist, blood pressure) — shared
  vital signs;
- free-text examination fields — every note now uses the one structured
  Select Examination interface built from the Endocrinology examination catalogue;
- therapy/smoking duplication — medications, allergies, social and past history
  stay with the unified Patient Record.

Consequently the numeric electrolyte rules were removed from the safety engine: no
rule reads a lab number out of a note any more. Electrolyte severity is raised by
the clinician selecting the concern, which keeps authorship of the judgement clear.

## 3. Clinical content added (per note)

| Note | Added |
|---|---|
| Consultation | Structured presentation (duration, cardinal diabetes symptoms, weight trend, family history of endocrine disease), **Differential Diagnosis + diagnostic confidence (required)**, management decision, education, follow-up |
| Follow-Up | Interval course, unscheduled care, adherence, therapy change, structured examination, management, education, follow-up |
| Diabetes Follow-Up | Individualised HbA1c target, monitoring method, CGM-only metrics (Time in Range / Below Range / GMI, conditional), ADA hypoglycaemia grade, acute decompensation state, cardiovascular & kidney risk profile, complication screening results, regimen category, education, follow-up |
| Thyroid Follow-Up | Functional status interpretation, pregnancy/postpartum context, treatment decision, follow-up, and a nodule block (size, sonographic risk category, growth, cytology) that appears only when a nodule is documented |
| Progress Note | Trajectory, adherence, therapy change, objective measures, structured examination, management, monitoring arranged, education, follow-up |
| Care Plan | Individualised targets, HbA1c / kidney / retinal / foot intervals, vaccination, sick-day rules, hypoglycaemia education, self-monitoring, plan shared with patient |
| Medication Adjustment | Drug class, basis for the adjustment, weight reference only when weight-based (conditional), hypoglycaemia risk, monitoring required, education, follow-up |
| Discharge Summary | Glycaemic state at discharge, insulin regimen only when applicable (conditional), stress-dose/sick-day advice, follow-up interval, readmission risk, self-management instructions |

### Documentation model actually implemented

- **Required** — one field only: the consultation's differential diagnosis, because
  a consultation without a differential is not a defensible record. Nothing else
  blocks saving, so urgent care is never delayed for documentation.
- **Optional** — every other field, including all safety fields.
- **Conditional** — declared with `showIf` and verified: CGM metrics (only for CGM
  methods), nodule assessment (only when a nodule is documented), insulin regimen
  at discharge (only when a glucose-lowering regimen applies), weight reference
  (only for a weight-based calculation).
- **Not examined / not assessed / not applicable / not documented** — explicit
  options wherever the state can legitimately be unknown. An unanswered field is
  never read as normal, and no option is preselected.
- **Not collected here at all** — history, medications, allergies, vital signs,
  laboratory and imaging results: supplied by the shared record and tabs.

## 3b. Condition-specific requirements (Paragraph 3)

Consultation, Follow-Up and Progress Note carry one **Condition-Specific** section.
The clinician selects the endocrine domain once and only that domain's fields
appear — 44 of the section's fields are conditional, so a thyroid review never
shows a bone-density question:

- **Diabetes** — type and classification, the diagnostic evidence behind it, HbA1c
  and glucose trend, ADA hypoglycaemia level, hyperglycaemic emergency, urine
  albumin category, kidney-function review, foot assessment, retinal assessment,
  cardiovascular risk.
- **Thyroid** — symptom pattern, functional pattern on the attached results,
  pregnancy/postpartum context, antibodies, imaging reviewed, Bethesda cytology,
  treatment response, monitoring arranged.
- **Pituitary** — hormone excess/deficiency symptoms, visual symptoms or field
  assessment, hormone investigations, imaging (micro/macroadenoma, post-treatment),
  treatment monitoring.
- **Adrenal** — glucocorticoid exposure, symptom pattern, blood pressure/volume
  status, electrolyte review, hormonal investigations, whether testing conditions
  were documented, adrenal crisis recognition, stress-dose advice.
- **Calcium, parathyroid, bone** — fracture history, bone density result, fracture
  risk category, biochemical review, treatment response, monitoring.
- **Obesity and metabolic** — weight history, BMI category, waist category,
  associated conditions, metabolic investigations, treatment response.
- **Reproductive and gonadal** — specific history, symptom pattern, gonadal
  findings, hormonal investigations, management decision.

Applied per note purpose, additionally: Diabetes Follow-Up gained the
classification/diagnostic-evidence block, albuminuria category, kidney-function
review and foot pulse/lesion detail; Thyroid Follow-Up gained symptoms, the
diagnostic basis, antibodies, imaging review, treatment response and monitoring;
Care Plan gained weight/metabolic, bone-health, fracture-risk and reproductive
review; Medication Adjustment gained glucocorticoid context, adrenal crisis advice
and bone protection; Discharge Summary gained hyperglycaemic-emergency and adrenal
crisis status, steroid emergency information and thyroid status at discharge.

`diagnostic_basis` records explicitly what the documented diagnosis rests on
(biochemical, imaging, cytology/histology, genetic, clinical only, **not yet
established**), so no single result assigns a diagnosis. Every field is optional;
no field re-collects a laboratory value, vital sign or examination finding — each
records the interpretation and the decision.

Safety: an adrenal crisis recorded in the new block now raises an **immediate**
prompt (verified).

## 4. Coding basis — ICD-11 MMS 2025-01

- 280 Chapter 05 categories from the WHO Simple Tabulation, release 2025-01,
  official titles verbatim (including WHO's "Postirridation hypothyroidism").
- Each note offers only the domains it can code (thyroid note: 82; diabetes note:
  129; medication adjustment: 172; the rest: all 280).
- 18 acute-diabetes-complication entries keep WHO's non-primary flag and say so, so
  ketoacidosis is never recorded instead of the diabetes type.
- Role, status and clinical basis are recorded per code; a code is never a
  confirmed diagnosis until a clinician documents it.
- Excluded and stated in the file: inborn errors of metabolism,
  undernutrition/deficiency codes, and Chapter 2 neoplasms (need histology from the
  WHO browser).

## 5. Guideline register

ADA Standards of Care in Diabetes—2026 · ATA hypothyroidism 2014 · ATA
thyrotoxicosis 2016 (corrigendum noted) · ATA nodules/DTC 2015 · ATA pregnancy
2017 · ES adrenal insufficiency 2016 · ES Cushing 2015 · ES hypopituitarism 2016 ·
ES acromegaly 2014 · AACE type 2 diabetes algorithm 2023 · ESE/ENSAT adrenal
incidentaloma 2023 · KDIGO 2022 diabetes in CKD · WHO ICD-11 MMS 2025-01.

Verified on official sources 2026-10-28. Unverified or local-policy items are
listed in `ENDOCRINE_REFERENCE_FLAGS` rather than implied.

## 6. Safety layer

Ten clinician-selectable concerns plus eight rules raised by documented fields:
ADA hypoglycaemia levels, ketoacidosis/hyperosmolar state, adrenal crisis, overt
thyrotoxicosis, thyroid disease in pregnancy, malignant cytology, advanced CKD
therapy review, missing stress-dose or sick-day advice.

Rules that need Endocrinology sign-off (`ENDOCRINE_SAFETY_APPROVAL_REQUIRED`) are
labelled in the note and PDF as AMedix local triage decisions.

Verified behaviour: DKA selection → immediate; Level 3 hypoglycaemia → immediate;
overt thyrotoxicosis + pregnant → same-day + documented; Bethesda VI → documented;
CKD G4–G5 → documented; concern-only selection builds the correct prompts; the PDF
formatter renders the stored prompts, not a recalculation.

## 7. Out of scope by design

No insulin, levothyroxine, steroid stress or titration dose is calculated,
suggested or defaulted; no sliding-scale content; no prompt diagnoses, prescribes,
orders or certifies stability.

## 8. Coding integrity — Paragraph 4

The ICD-11 block in every Endocrinology note is now a coded record, not a text
hint. What is enforced, and where:

| Requirement | Where it is enforced |
|---|---|
| A diagnosis carries a mapping state | `mapping_state` is one of `verified`, `review_required`, `unresolved`. Entered manually from the WHO browser → `review_required`; chosen from the verified catalogue → `verified`; not mappable → `unresolved` with **no code stored** |
| A code is never invented or completed | The field only accepts codes from `ENDOCRINE_ICD11` or a code the clinician typed after looking it up; nothing is derived from the diagnosis wording, and no residual (`…Y` / `…Z`) code is suggested |
| Every code carries its provenance | Each catalogue entry now records `system` (`ICD-11-MMS`), `system_uri` (`http://id.who.int/icd/release/11/mms`), `release` (`2025-01`), `source` (the WHO Simple Tabulation file) and `verified_date` (2026-10-28). Added to all 280 entries in this build |
| The code is part of the clinical record | Saving a note writes `ClinicalNote.icd11_coded_diagnoses` (code, display, system, URI, release, source, verified date, coding note, specificity, role, status, mapping state, basis, follow-up) and the same data is attached to the note record itself, not parsed back out of the note text |
| It reaches the patient record with the same provenance | A diagnosis the clinician marked **Confirmed** as primary or secondary is mirrored into `Diagnosis` with `icd11_code`, `icd11_display`, `icd11_system`, `icd11_system_uri`, `icd11_release`, `icd11_source`, `icd11_mapping_state`, `icd11_verified_date`, `icd11_note_reference` and `icd11_encounter_id`. Suspected, differential and unresolved entries stay on the note and never enter the confirmed problem list. Duplicates are skipped by code or term |
| The write is not trusted | `createClinicalNote` re-validates the array it receives: system is fixed to ICD-11 MMS, the mapping state is constrained, entries without a documented term are dropped, and the array is capped. A client cannot post a free-form code |
| Coding is auditable | A second audit entry is written per coded note — `coded_clinical_diagnosis`, with the release and the number of entries awaiting coding review, linked to the note and encounter |
| Nothing else is stored there | ICD-10 codes, LOINC laboratory codes, medication identifiers and procedure codes are excluded by the entity definition. Chapter 2 neoplasms and Chapter 6–23 concepts are outside the catalogue |

Explicitly **not** claimed: the catalogue reproduces WHO titles from the Simple
Tabulation only. Inclusion and exclusion notes are not reproduced, so the field
asks the clinician to confirm a residual code against the WHO browser rather than
presenting it as equivalent to a specific category.

## 9. Paragraph 5 — verification, traceability and completion report

### 9.1 What was actually run (2026-10-28)

Automated checks executed against the shipped modules (`specialtyDocuments.js` →
the final, policy-applied note set, `endocrineIcd11.js`,
`endocrineReferences.js`, `endocrineSafetyRules.js`), plus static checks of the
write path and the entity definitions.

| Suite | Checks | Result |
|---|---|---|
| Template structure — 8 notes present, ICD block, catalogue size, safety block | 32 | 32 passed |
| Template integrity — conditional targets and values exist, no duplicate field keys, ≤1 required field, no shared data re-collected | 40 | Passed; the label heuristic flagged 8 fields across 5 notes, each reviewed individually (9.5) and confirmed not to be a re-collected measurement |
| Coding integrity — 280 WHO categories, no duplicates, 18 non-primary entries flagged, every code with system / release / URI / verified date, per-note catalogue limited to its own domains | 20 | 20 passed |
| Safety engine behaviour — DKA concern, Level 3 hypoglycaemia, documented DKA state, thyrotoxicosis in pregnancy, Bethesda VI, CKD G4–G5, adrenal crisis, empty note, unknown concern, PDF text, empty-state wording, reference resolution, approval list, flags | 16 | 16 passed |
| Write path and wiring — entity fields, server re-validation, coding audit, confirmed-only mirroring, patient view, note UI, unresolved state in the field | 8 | 8 passed |

Behaviour confirmed by execution, not by reading:

- DKA selected as a concern → one `immediate` prompt.
- `Level 3` hypoglycaemia recorded → `immediate` prompt.
- `Diabetic ketoacidosis` recorded in the structured field → `immediate` prompt (`dka_hhs_documented`).
- `Overt thyrotoxicosis` + `Pregnant` → both prompts, sorted with the higher urgency first.
- Bethesda `VI` → documented-level malignancy prompt; CKD G4–G5 → documented-level therapy review; adrenal crisis features → `immediate`.
- Empty note, no concerns → zero prompts. Nothing is inferred from an unanswered field.
- Unknown concern key → ignored, no prompt invented.
- `formatEndocrineSafety` renders the prompts stored with the note (including the recorded action and the citation); with no prompts it states that this is not a statement that no urgent problem exists.

### 9.2 Traceability matrix — note ↔ coding ↔ guidance

| Note | Fields | Conditional | Required | ICD-11 codes offered | Domains | Guideline references naming this note |
|---|---|---|---|---|---|---|
| Endocrinology Consultation (`endo_consultation`) | 60 | 44 | 1 (differential diagnosis) | 280 | all 12 | ATA thyrotoxicosis 2016 · ATA nodules/DTC 2015 · ES adrenal insufficiency 2016 · ES Cushing 2015 · ES hypopituitarism 2016 · ES acromegaly 2014 · ESE/ENSAT adrenal incidentaloma 2023 |
| Endocrinology Follow-Up (`endo_followup`) | 58 | 44 | 0 | 280 | all 12 | ADA 2026 · ATA hypothyroidism 2014 · ATA thyrotoxicosis 2016 · ATA nodules/DTC 2015 · ATA pregnancy 2017 · ES Cushing 2015 · ES acromegaly 2014 · AACE T2D 2023 · ESE/ENSAT 2023 · KDIGO 2022 |
| Diabetes Follow-Up (`endo_diabetes_followup`) | 44 | 3 | 0 | 129 | diabetes, glucose regulation, obesity/nutrition, electrolyte, lipid, postprocedural | ADA 2026 · AACE T2D 2023 · KDIGO 2022 |
| Thyroid Follow-Up (`endo_thyroid_followup`) | 26 | 3 | 0 | 82 | thyroid, parathyroid, postprocedural | ATA hypothyroidism 2014 · ATA thyrotoxicosis 2016 · ATA nodules/DTC 2015 · ATA pregnancy 2017 |
| Endocrine Progress Note (`endo_progress_note`) | 59 | 44 | 0 | 280 | all 12 | via the condition-specific domain block (9.3) |
| Endocrine Care Plan (`endo_care_plan`) | 25 | 0 | 0 | 280 | all 12 | ADA 2026 · ES adrenal insufficiency 2016 · ES hypopituitarism 2016 · KDIGO 2022 |
| Medication Adjustment Record (`endo_medication_adjustment`) | 18 | 4 | 0 | 172 | thyroid, diabetes, glucose regulation, parathyroid, pituitary, adrenal | ADA 2026 · ATA hypothyroidism 2014 · ES adrenal insufficiency 2016 · ES hypopituitarism 2016 · AACE T2D 2023 |
| Discharge Summary (`endo_discharge_summary`) | 20 | 1 | 0 | 280 | all 12 | ADA 2026 · ATA thyrotoxicosis 2016 · ES adrenal insufficiency 2016 |

All eight notes additionally carry the WHO ICD-11 MMS 2025-01 register entry as
the classification basis for the coding block.

### 9.3 Domain block → guideline

The Consultation, Follow-Up and Progress Note share one Condition-Specific
section. Selecting the domain is what binds a note to a guideline set, so the
link is recorded here once:

| Domain block | References it rests on | Safety rules it can raise |
|---|---|---|
| Diabetes | ADA 2026 · AACE T2D 2023 · KDIGO 2022 | hypoglycaemia Level 2 / Level 3, DKA–HHS recorded |
| Thyroid | ATA hypothyroidism 2014 · ATA thyrotoxicosis 2016 · ATA nodules/DTC 2015 · ATA pregnancy 2017 | overt thyrotoxicosis, thyroid disease in pregnancy, malignant cytology |
| Pituitary | ES hypopituitarism 2016 · ES acromegaly 2014 | missing stress-dose advice |
| Adrenal | ES adrenal insufficiency 2016 · ES Cushing 2015 · ESE/ENSAT incidentaloma 2023 | adrenal crisis, glucocorticoid exposure, missing stress-dose advice |
| Calcium, parathyroid, bone | ES hypopituitarism 2016 (pituitary–bone axis) · local triage thresholds (`ENDOCRINE_REFERENCE_FLAGS: local_thresholds`) | none numeric — no guideline in the register defines a threshold the app may apply |
| Obesity and metabolic | ADA 2026 (weight and metabolic risk) | none |
| Reproductive and gonadal | flagged: no verified society guideline in this build (`not_verified_this_build`) | none |

### 9.4 Safety layer → the field that raises it

| Rule | Level | Raised by |
|---|---|---|
| `dka_hhs` | immediate | clinician-selected concern |
| `severe_hypoglycaemia_level3` / `level2_hypoglycaemia` | immediate / same day | `hypoglycaemia_level` |
| `dka_hhs_documented` | immediate | `acute_decompensation` |
| `adrenal_crisis` | immediate | `adrenal_crisis_status` |
| `thyrotoxicosis_documented` / `thyroid_in_pregnancy` | same day | `thyroid_status`, `pregnancy_status` |
| `thyroid_malignancy_documented` | documented | `fna_bethesda` |
| `advanced_ckd_medication_review` | documented | `ckd_status` |
| `steroid_stress_dose_not_documented` / `sick_day_rules_not_documented` | documented | `steroid_stress_dose_advice`, `sick_day_rules` |

Every rule carries the reference id it rests on; the prompt renders the
organisation, title, version, URL and verification status. Rules whose wording or
timing needs a qualified endocrinologist are listed in
`ENDOCRINE_SAFETY_APPROVAL_REQUIRED` and labelled in the note and the PDF as AMedix
local triage decisions.

### 9.5 Reviewed exceptions

Three fields carry a unit in their label and were checked individually rather than
treated as duplicated data:

- `hba1c` (Diabetes Follow-Up) — the glycaemic metric the ADA follow-up standard
  requires recording against the individualised target; it is read from the
  attached result, not re-entered as a laboratory panel.
- `glucose_management_indicator` — a metric produced by the CGM software, not a
  laboratory report; it appears only when the monitoring method is CGM.
- `weight_based_reference` — appears only when the adjustment basis is a
  weight-based calculation, and records the weight the clinician used.

No other measurement, vital sign, laboratory value, examination finding,
medication or allergy is collected in any Endocrinology note.

### 9.6 Completion report, paragraph by paragraph

| Paragraph | Requirement | State | Evidence |
|---|---|---|---|
| 1 | Keep the eight existing note types and their keys | Done | 8/8 present in the policy-applied note set; keys and labels unchanged |
| 1 | Do not duplicate shared data | Done | 0 measurement fields after reviewing 3 justified exceptions (9.5) |
| 2 | Audit each note against verified standards | Done | §1–§5 of this record; 13 references in the register, 5 unverified items flagged |
| 3 | Condition-specific requirements per disorder | Done | 44 conditional fields; a thyroid review cannot show a bone-density question; required fields ≤ 1 per note |
| 4 | ICD-11 coding with verification and integrity | Done | §8; 280 codes with release, source, URI and verification date; unresolved state stored instead of a guessed code; provenance written to the note and the patient record; coding audited |
| 5 | Traceability, tests and completion report | Done | §9.1–§9.6; 116 automated checks, all passed |

Deliberately not done, and not claimed: no code is generated, completed or
substituted; no dose is calculated; no prompt diagnoses, prescribes or orders; the
condition-specific content is documentation, not decision support that decides
anything on its own.

## 10. Outstanding

- Endocrinology sign-off on the seven local triage thresholds and their wording.
- UAT by an endocrinologist on one note of each type, including PDF rendering.
- Coding review workflow for entries stored as `review_required` — the state is
  recorded and shown to the patient as "coding review in progress"; no reviewer
  queue exists yet.
- No verified society guideline is cited for the reproductive/gonadal block; it is
  flagged rather than filled with an unverified source.