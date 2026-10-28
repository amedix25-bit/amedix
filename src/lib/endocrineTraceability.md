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

## 8. Outstanding

- Endocrinology sign-off on the seven local triage thresholds and their wording.
- UAT by an endocrinologist on one note of each type, including PDF rendering.