# Endocrinology — templates, coding and safety traceability

Audit record for the Endocrinology note suite: what was strengthened, on what
basis, and what remains subject to clinical approval. Cited sources are listed in
`src/lib/endocrineReferences.js`; codes in `src/lib/endocrineIcd11.js`.

## 1. Scope — existing notes strengthened in place

The eight templates were **not** recreated, renamed or replaced. Keys, labels and
field order are unchanged, and every field is appended, never removed, so notes
already saved and any workflow reading a note by key keep working.

| Note key | Appended (effective after the shared note policy) |
|---|---|
| `endo_consultation` | Endocrine presentation, anthropometry/vitals, biochemistry, ICD-11, safety |
| `endo_followup` | Interval course, biochemistry, ICD-11, safety |
| `endo_diabetes_followup` | Glycaemic metrics/targets, cardiovascular & kidney risk, complication screening, therapy & self-management, biochemistry, ICD-11, safety |
| `endo_thyroid_followup` | Thyroid biochemistry/status, replacement therapy, nodule assessment, biochemistry, ICD-11, safety |
| `endo_progress_note` | Interval course, biochemistry, ICD-11, safety |
| `endo_care_plan` | Individualised targets, monitoring intervals, preventive care & education, ICD-11, safety |
| `endo_medication_adjustment` | Drug class, basis for adjustment, post-change monitoring, biochemistry, ICD-11, safety |
| `endo_discharge_summary` | Status at discharge, insulin regimen, stress-dose advice, follow-up interval, readmission risk, biochemistry, ICD-11, safety |

Pre-existing fields the shared note policy already retires (Laboratory Results,
Plan, Imaging, Family History, Current Medications, Medication Review) are left
untouched in the source and are not relied on. Nothing added uses that vocabulary,
so nothing added is silently dropped.

## 2. Coding basis — ICD-11 MMS 2025-01

- 280 Chapter 05 categories extracted from the WHO Simple Tabulation, release
  2025-01, with official titles copied verbatim (including WHO's spelling of
  "Postirridation hypothyroidism").
- Each note offers only the domains it can code (e.g. thyroid note: 82 codes).
- 18 acute-diabetes-complication entries (5A20–5A24, 5A2Y) keep WHO's
  non-primary flag and say so in the picker, so ketoacidosis is never recorded
  instead of the diabetes type.
- Not included, and stated in the file rather than omitted: inborn errors of
  metabolism, undernutrition/deficiency codes, and Chapter 2 neoplasms (require
  histology from the WHO browser).
- Role, status and clinical basis are recorded per code. A code is never a
  confirmed diagnosis until a clinician documents it.

## 3. Guideline register

ADA Standards of Care in Diabetes—2026 · ATA hypothyroidism 2014 · ATA
thyrotoxicosis 2016 (corrigendum noted) · ATA nodules/DTC 2015 · ATA pregnancy
2017 · ES adrenal insufficiency 2016 · ES Cushing 2015 · ES hypopituitarism 2016 ·
ES acromegaly 2014 · AACE type 2 diabetes algorithm 2023 · ESE/ENSAT adrenal
incidentaloma 2023 · KDIGO 2022 diabetes in CKD · WHO ICD-11 MMS 2025-01.

Verified on official sources on 2026-10-28. Unverified, paywalled or
local-policy items are listed in `ENDOCRINE_REFERENCE_FLAGS` instead of being
implied.

## 4. Safety prompts

Two provenances, always shown in the note and in the PDF:

- **Guideline-based** — ADA hypoglycaemia levels, DKA/HHS, adrenal crisis,
  overt thyrotoxicosis, thyroid disease in pregnancy, malignant cytology, CKD
  therapy review, missing stress-dose/sick-day advice, ES adrenal insufficiency.
- **AMedix local triage decision (approval required)** — numeric thresholds for
  sodium, potassium, corrected calcium, thyroid storm, myxoedema coma, pituitary
  apoplexy and catecholamine excess, because no registered guideline defines a
  threshold the app may apply. `ENDOCRINE_SAFETY_APPROVAL_REQUIRED` lists them.

Behaviour verified end-to-end: DKA selection → immediate; Level 3 → immediate;
potassium 6.4 → immediate; sodium 118 → immediate; calcium 3.1 → same-day;
glucose 2.4 → immediate; overt thyrotoxicosis + pregnant → same-day + documented;
CKD G4–G5 → documented. An empty panel states it is not reassurance, no field is
required, and no prompt diagnoses, prescribes, orders or calculates a dose.

## 5. Deliberately out of scope

No insulin, levothyroxine, steroid stress or titration dose is calculated,
suggested or defaulted; weight-based dose fields exist only so the clinician can
record the calculation they made and its basis. Sliding-scale content is excluded.

## 6. Outstanding

- Endocrinology sign-off on the seven local triage thresholds and their wording.
- UAT by an endocrinologist on one note of each type, including the PDF rendering
  of the safety block.