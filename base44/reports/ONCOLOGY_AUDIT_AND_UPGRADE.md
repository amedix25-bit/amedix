# Oncology — Audit and Incremental Upgrade

Date: 2026-11-09 · Scope: existing AMedix Oncology Portal · Verified by `qa/onc-qa.mjs` (48 checks, all passing) and a clean production build.

## 1. Audit of the pre-existing portal

| Area | Found before this upgrade | Assessment |
|---|---|---|
| Specialty + templates | `oncology` specialty existed with **12 templates** (`onc_consultation`, `onc_treatment_plan`, `onc_followup`, `onc_progress_note`, `onc_chemo_record`, `onc_infusion_record`, `onc_radiation_record`, `onc_staging_record`, `onc_tumor_board_record`, `onc_discharge_summary`, `onc_treatment_summary`, `onc_surveillance_record`), registered in `specialtyDocuments.js` and in the server catalogue | Present, but flat free-text only |
| ICD-11 | None. No ICD-11 field on any oncology template, no oncology condition index, no behaviour (primary/secondary) model | **Missing** |
| Histopathology | One free-text line ("Biopsy / Pathology Results") | **Missing** structured synoptic record |
| Biomarkers | Free text only, no marker fields, no site-awareness | **Missing** |
| Staging | Free-text `t_stage`, `n_stage`, `m_stage`, `stage_group` + a system dropdown. No edition, no c/p/yp distinction, no confirmation, no guard against staging haematological disease with TNM | **Insufficient** |
| Treatment | Free text: regimen, modalities, cycles planned | **Insufficient** — no intent/line/dose basis/modification record |
| Toxicity | Free-text "Toxicities" / a single worst-grade dropdown | **Missing** CTCAE per-event grading |
| Response | Free-text "Response Assessment" dropdown on follow-up | **Missing** RECIST structure |
| MDT | "Tumor Board Record" free-text template | Present but unstructured |
| Safety prompts | None | **Missing** |
| Instruments | None | **Missing** |
| References | None. NCCN was registered only as a respiratory/second-line reference; no ESMO, AJCC, UICC, WHO tumour classification, CAP, RECIST or CTCAE | **Missing** |
| Oncology dashboard / registry entities / report PDF | None specialty-specific (app-wide dashboard, document signature/amendment/audit and PDF plumbing already exist and are reused) | **Deferred** (see §4) |
| Pre-existing note-governance effect | App-wide policy already retires `Past Medical History`, `Current Medications`, `Family History`, `Examination Findings`, `Imaging Reviewed` and the generic `Plan` line from these templates, because the patient record attaches them automatically and the structured examination replaces the free-text one | Unchanged by this work; documented, not "fixed" silently |

Nothing was recreated, renamed, deleted or reorganised. All 12 keys, labels and declared fields are intact.

## 2. What this upgrade adds

- **ICD-11 MMS integration** (`src/lib/oncIcd11.js`): tumour behaviour taxonomy (primary malignant, secondary/metastatic, in situ, benign, uncertain/unknown, haematological), oncology statuses, roles, and detail fields recording anatomical site, laterality, behaviour, histology, grade, diagnosis date, confirmation basis, classification release, coding clinician, and **ICD-O-3 topography/morphology held separately as registry-only fields**. 168 clinical search terms across 15 tumour groups resolved against the workspace ICD-11 dataset. `oncBehaviourConflicts()` blocks the integrity failure the request calls out: a metastasis recorded as a new primary, an unflagged unresolved code, or verified coding without a release.
- **Structured blocks** (`src/lib/oncBlocks.js`, 10 blocks): oncological assessment (presentation, B symptoms, weight loss, prior cancer/recurrence/metastases, hereditary syndrome, ECOG, nutrition), synoptic histopathology (size, grade, invasion, LVI/PNI, margins, nodes, extranodal extension, CAP protocol), site-conditional biomarkers (ER/PR/HER2/Ki-67, EGFR/ALK/ROS1, KRAS/NRAS/BRAF, MSI/MMR, TMB, PD-L1, BRCA, NTRK/RET/MET — shown only for the documented primary), staging (cTNM/pTNM/ypTNM, stage groups, edition, basis, confirmation, "cannot be assigned — incomplete information"), cancer-directed treatment (intent, line, regimen, dose basis, cycles, verification checklist, modifications, anthracycline cumulative dose, TLS risk), CTCAE adverse events (14 graded events + counts, calcium, extravasation), MDT (disciplines, discussion, recommendation, divergences, sign-off), response (RECIST 1.1 / RANO / Deauville structure), survivorship/recurrence, and supportive/palliative/goals-of-care.
- **Instruments** (`src/lib/oncScores.js`): ECOG (with the published band), Mosteller BSA (explicitly arithmetic only — no dose is calculated or suggested), RECIST 1.1 target-lesion arithmetic (overall response stays the clinician's), plus shared BMI and eGFR.
- **Advisory safety review** (`src/lib/oncSafetyRules.js`, 14 rules): febrile neutropenia, grade 3–4 neutropenia, significant thrombocytopenia, cord compression, SVCO, hypercalcaemia, tumour-lysis risk, extravasation, immune-related events, cumulative anthracycline, cisplatin with reduced eGFR, hepatitis B reactivation on B-cell depletion, fertility preservation, and curative treatment recorded against an unassignable stage. Every prompt cites a registered source, quotes only documented values, and is stored with the note.
- **References** (`src/lib/oncReferences.js`): NCCN (principal), ESMO, ESMO Living Guidelines, WHO Classification of Tumours, AJCC, UICC TNM, CAP, RECIST 1.1, CTCAE v5, ASCO — metadata and links only, with the NCCN/ESMO divergence stated rather than resolved, and no local protocol invented. Registered in the References Library (8 created, NCCN/CAP extended to oncology).
- **15 tumour workflows** (`src/lib/oncDocuments.js`, catalogued): breast, lung (NSCLC/SCLC), colorectal, oesophagogastric, hepatobiliary/pancreatic, prostate, urological, gynaecological, head & neck, thyroid, melanoma/skin, CNS, sarcoma, haematological, unknown primary/rare. Each carries assessment → pathology → biomarkers → staging → treatment → CTCAE → response → follow-up → supportive care, ICD-11, instruments, safety review and guideline basis.
- **Note types strengthened in place**: the 12 originals receive the same blocks appended after their existing fields.

## 3. Testing performed

`qa/onc-qa.mjs` — 48 checks over the shipped code: template preservation, catalogue acceptance, appended-field survival through note governance, ICD-11 taxonomy/completeness, absence of any written ICD-11/ICD-10 code in the coding module, ICD-O-3 separation, primary-vs-secondary integrity (positive and negative cases), block integrity, staging no-calculation and haematology staging options, biomarker conditionality, CTCAE coverage, MDT completeness, instrument arithmetic and missing-item behaviour, safety-prompt firing and non-firing on blank/normal values, prompt source resolvability and absence of order-like wording, reference honesty, and governance statements. Production build passes.

## 4. Known limits and deferred work (not claimed as done)

1. **Verified ICD-11 oncology codes need data or credentials.** The workspace ICD-11 dataset currently holds 6 verified respiratory entries only, and the WHO API credentials were declined. Until a WHO release is imported (Administration → ICD-11 dataset) or `WHO_ICD11_CLIENT_ID`/`WHO_ICD11_CLIENT_SECRET` are added, oncology diagnoses are recorded with **no code and flagged for coding review** — never with a guessed code. This is by design, and it is the remaining blocker on the "complete ICD-11 classification" requirement.
2. **Not built in this increment**: the oncology dashboard (active patients, awaiting biopsy/pathology/molecular/staging/MDT, overdue follow-up, filters), dedicated entities for treatment plans/administration/MDT meetings, an oncology-specific PDF report, and direct AMedix Laboratory/Radiology portal wiring inside oncology notes (pathology reports still upload through the existing patient-document system, and results are read from the patient record).
3. **Licensed guideline text is not included** — NCCN/ESMO content is linked, never reproduced; evidence grades are shown as stated by each body.
4. Nothing was tested against live patient data; no live record was modified.