# AMedix — Obstetrics & Gynecology Specialty System
## Final QA and clinical-validation audit

Audit date: 2026-10-28 · Release audited: this working build · Auditor: AMedix engineering (automated)

### 1. What this audit actually did

Methods used, and nothing more:

1. **Code and data audit** of the live template registry, examination schema, sexual and
   reproductive health schema, ICD-11 catalogue, safety-rule engine and note-section policy.
2. **Executed logic tests** (Node, against the real modules, no mocks) for safety-prompt
   generation, examination flattening, sexual-history flattening and per-template ICD catalogue
   filtering.
3. **Backward-compatibility diff** of every template field key against the build captured
   before this work began (read-only git comparison).

**Not performed, and therefore not claimed:** no browser/UI interaction test, no end-to-end
save → reopen → edit → sign cycle, no role/permission exercise against a live database, no
Arabic UI pass, no destructive test, no test using real patient data. Those are listed as
pending in §8.

### 2. Inventory — every OB/GYN note type, as currently configured

All 19 original keys are present. Baseline field keys removed: **0**. Keys added: **68**
(plus template-level blocks added earlier in this work). Required fields across the whole
specialty: **0** — no alert, examination or emergency field can block documenting care.

| # | Note type (key) | Fields | Sections | Exam groups | SRH groups | ICD catalogue |
|---|---|---|---|---|---|---|
| 1 | obgyn_initial_antenatal | 56 | 8 | 4 | 4 | 27 |
| 2 | obgyn_antenatal_followup | 53 | 8 | 3 | 1 | 27 |
| 3 | obgyn_pregnancy_record | 53 | 8 | 1 | 4 | 27 |
| 4 | obgyn_prenatal_care_plan | 47 | 7 | 1 | 1 | 27 |
| 5 | obgyn_labor_delivery_record | 62 | 10 | 3 | 0 | 20 |
| 6 | obgyn_delivery_note | 47 | 10 | 2 | 0 | 20 |
| 7 | obgyn_csection_operative_note | 46 | 8 | 2 | 0 | 20 |
| 8 | obgyn_vaginal_delivery_note | 35 | 7 | 2 | 0 | 20 |
| 9 | obgyn_postpartum_note | 40 | 7 | 2 | 3 | 20 |
| 10 | obgyn_discharge_summary | 45 | 8 | 1 | 2 | 20 |
| 11 | obgyn_pregnancy_followup | 46 | 8 | 3 | 1 | 27 |
| 12 | obgyn_gyn_consultation | 49 | 7 | 6 | 5 | 34 |
| 13 | obgyn_gyn_followup | 42 | 7 | 3 | 2 | 34 |
| 14 | obgyn_gyn_procedure_note | 32 | 6 | 2 | 1 | 34 |
| 15 | obgyn_gyn_operative_note | 40 | 7 | 2 | 1 | 34 |
| 16 | obgyn_gyn_preop_assessment | 23 | 5 | 2 | 2 | 34 |
| 17 | obgyn_gyn_postop_note | 26 | 5 | 2 | 1 | 34 |
| 18 | obgyn_gyn_discharge_summary | 38 | 7 | 1 | 1 | 34 |
| 19 | obgyn_gyn_referral | 26 | 5 | 2 | 4 | 34 |

Examination and sexual-history content are **not** counted as template fields: they live in
the two shared modules every note renders, so the same examination is never documented twice.

### 3. Improvements applied, by template

Shared by all 19: structured clinical examination, sexual & reproductive history, ICD-11
coding block with role/status/mapping state, and safety prompts.

- **Antenatal and pregnancy notes (1–4, 11):** dating and screening with pending-result
  follow-up, initial booking assessment, high-risk classification, escalation planning,
  preventive care; early-pregnancy, hypertensive and haemorrhage coding domains.
- **Labour, delivery and caesarean notes (5–8):** admission, partograph, induction and
  consent, procedure documentation, birth/placenta/newborn handover, operative and
  anaesthesia record, pregnancy status before procedure, specimens and blood loss.
- **Postpartum and discharge notes (9–10):** recovery, breastfeeding support, thromboprophylaxis,
  wound review, discharge instructions and follow-up.
- **Gynecologic notes (12–19):** structured symptom history (onset, duration, severity, cycle,
  LMP, postmenopausal bleeding, bleeding pattern, discharge, urinary, bowel, prior procedures,
  cervical screening status, HPV vaccination), assessment with differential, documented
  diagnosis status and criteria source/version, screening and surveillance decisions,
  medication-safety review, procedure/consent/pregnancy status, post-operative instructions.

Deliberate removals this session (all added earlier in the same work, none pre-existing):
the gynecology-only examination block (duplicated the shared examination module) and three
history fields (duplicated the shared sexual & reproductive history) — so no doctor documents
the same finding twice.

### 4. Guideline traceability register

Internal register: `src/lib/obgynReferences.js` (16 entries, each with organisation, title,
URL, edition, verification state, verification note).

| Reference (id) | Organisation | Title | Version/date | Text verified at source |
|---|---|---|---|---|
| who_pre_eclampsia_factsheet | WHO | Pre-eclampsia — fact sheet | Updated 6 Oct 2026 | **Yes** |
| icd11_mms | WHO | ICD-11 for Mortality and Morbidity Statistics | Release 2026-01 | **Yes** |
| amedix_local_triage | AMedix | Local obstetric safety trigger set (not a guideline) | This build | **Yes** (as a local decision) |
| who_pe_eclampsia_2011 | WHO | Recommendations for prevention and treatment of pre-eclampsia and eclampsia | 2011 | No |
| who_severe_hypertension_2018 | WHO | Drug treatment for severe hypertension in pregnancy | 2018 | No |
| who_non_severe_hypertension_2020 | WHO | Drug treatment for non-severe hypertension in pregnancy | 2020 | No |
| who_antiplatelet_2021 | WHO | Antiplatelet agents for prevention of pre-eclampsia | 2021 | No |
| who_anc_2016 | WHO | Antenatal care for a positive pregnancy experience | 2016 | No |
| who_pph | WHO | Postpartum haemorrhage guidance | Edition unconfirmed | No |
| acog_hypertension | ACOG | Gestational hypertension and pre-eclampsia guidance | Number/year unconfirmed | No |
| acog_pph | ACOG | Postpartum haemorrhage guidance | Number/year unconfirmed | No |
| acog_ectopic | ACOG | Tubal ectopic pregnancy guidance | Number/year unconfirmed | No |
| rcog_sepsis | RCOG | Maternal sepsis guidance | Green-top number/year unconfirmed | No |
| rcog_vte | RCOG | Reducing the risk of VTE in pregnancy and the puerperium | Green-top number/year unconfirmed | No |
| figo_pph | FIGO | Postpartum haemorrhage guidance | Edition unconfirmed | No |
| figo_wellbeing | FIGO | Intrapartum fetal monitoring guidance | Edition unconfirmed | No |

Stated plainly:

- **13 of 16 references are not verified at source**, including every ACOG, RCOG and FIGO
  entry. Their document numbers and dates were never confirmed, so no ACOG/ROCG/FIGO
  document number is cited anywhere in the interface. Each prompt shows "not verified in this
  build — confirm before relying on it".
- **No claim is made that all four organisations support every change.** The safety triggers
  are a local AMedix decision set; WHO is cited where a WHO document is the basis; ACOG, RCOG
  and FIGO are cited individually only where that organisation is the basis for that rule.
- Local adaptation is recorded, not hidden: 10 trigger/approval items are listed in
  `OBGYN_SAFETY_APPROVAL_REQUIRED` as requiring local sign-off (e.g. local triage thresholds,
  the antenatal schedule, labour/delivery triggers).

### 5. ICD-11 validation

- **System:** ICD-11-MMS · **Release 2026-01** · URI `http://id.who.int/icd/release/11/mms`
  · source recorded per entry with retrieval date 2026-10-28. No ICD-10 code is stored,
  substituted or displayed anywhere in this specialty.
- **Catalogue:** 61 categories across 9 domains (early pregnancy 7, hypertensive 7, obstetric
  haemorrhage 13, endometriosis/adenomyosis 12, benign gynaecologic 10, abnormal uterine
  bleeding 6, menopause 2, fertility 3, pelvic pain 1).
- **Integrity checks executed, all passing:** code format valid for every entry; no duplicate
  codes; no subcategory without its parent category in the catalogue; system, URI, release,
  display term and verification date present on every entry.
- **Per-template filtering works:** antenatal and pregnancy notes offer 27 codes, intrapartum
  and postpartum notes 20, gynecologic notes 34 — an antenatal note cannot suggest a
  gynecologic bleeding code.
- **Symptom ≠ diagnosis:** the field offers no symptom categories as diagnoses; role, status
  (confirmed/provisional/differential), maternal context, specificity, basis and mapping state
  are recorded per entry; residual codes (`…Y`/`…Z`) carry a warning to confirm code-also
  instructions in the WHO browser.
- **Server-side re-validation** in `createClinicalNote`: system fixed to ICD-11-MMS, mapping
  state constrained to verified/review_required/unresolved, entry requires a documented term,
  capped at 40 entries per note; coded diagnoses are written to
  `ClinicalNote.icd11_coded_diagnoses` and coding provenance is audited separately.
- **Finding — not fixed, flagged:** the server enforces the *shape and system* of a code, not
  that the code exists in the WHO tabulation. Codes entered through the WHO-browser path are
  accepted as `review_required`. There is no coding-review queue yet to close those entries.

**Known gaps, explicit (no code offered rather than an unverified one):** uterine fibroids,
ovarian masses, PCOS, prolapse, urinary incontinence, genital tract and sexually transmitted
infections, cervical abnormality, gynecologic malignancy, most labour complications
(obstructed labour, malpresentation, cord), and puerperal sepsis. These are coded by the
clinician from the WHO browser and stored as review required.

### 6. Conditional logic and validation

- Conditional fields exist and were checked in the data: emergency fields display only when an
  emergency is documented; type-specific obstetric fields display only for the selected
  emergency/complication.
- Required fields: **0** across all 19 templates, so urgent care is never delayed by the form.
- Examination status now offers Performed, Partially Performed, **Not Examined**, Deferred,
  Declined by Patient, Not Indicated and **Unable to Assess**, each non-performance state
  asking for a documented reason. Nothing is preselected as normal; the "document normal
  findings" control fills only empty select fields, never measurements or free text, and says
  so on screen.
- Notes remain snapshot-based: history, medications and allergies are attached from the
  unified patient record at save time rather than re-entered.
- Draft restore exists (`ClinicalNoteDraft`), and note creation writes an audit entry
  (`created_clinical_note`), with coded diagnoses audited as `coded_clinical_diagnosis`.
- No section is silently dropped: the audit compared pre-policy and post-policy sections per
  template and found every section present after the central section policy runs (this testing
  caught and fixed one section that was being retired by name).

### 7. Tests executed and results

| Test | Result |
|---|---|
| All 19 original note types present after changes | **Pass** (19/19) |
| No original template field key removed (git diff of keys) | **Pass** (0 removed, 68 added) |
| No duplicate field keys inside any template | **Pass** |
| Every select has options; no dead field | **Pass** |
| Zero required fields (no blocking alerts) | **Pass** |
| ICD code format / duplicates / orphan subcategories / metadata | **Pass** (61 entries) |
| Per-template ICD catalogue non-empty and domain-filtered | **Pass** (27 / 20 / 34) |
| Empty note raises no safety prompt (no fabrication) | **Pass** |
| Emergency documented without a type raises no prompt, no crash | **Pass** |
| PPH, APH, ectopic, eclampsia, severe pre-eclampsia, magnesium not given, sepsis, VTE, reduced fetal movement, other concern | **12/12 pass** |
| Examination flattening records status, reason, consent and findings | **Pass** (4 rows) |
| Empty examination / empty SRH flatten to zero rows | **Pass** (0 rows) |
| Every safety rule's reference id resolves to a register entry | **Pass** (none unresolved) |

### 8. Unresolved, unverified and pending

1. **Guideline verification** — 13 references unverified at source, including all ACOG, RCOG
   and FIGO document numbers; needs a clinician with institutional access to complete dates and
   document numbers.
2. **Local sign-off** — 10 items in `OBGYN_SAFETY_APPROVAL_REQUIRED`, including local triage
   thresholds and the antenatal schedule, await obstetric lead approval.
3. **ICD-11 coverage gaps** (see §5) and **no coding-review queue** for `review_required` and
   `unresolved` entries.
4. **Arabic** — the clinical note form is English-only; the patient portal is bilingual and the
   Arabic note/PDF export remains an open item.
5. **Not exercised at all** — UI-level end-to-end (save, reopen, edit, sign, amend), duplicate
   and overwrite protection in a live session, role-based permissions against a real database,
   audit-log review in the portal, and backward compatibility of *stored* records (only the
   template definitions were compared).
6. **Migration risk of stored data** — notes store their own field labels with their values, so
   older notes continue to display their own labels; this was reasoned from the save path, not
   tested against a real historical record.

### 9. Explicit non-claims

This audit does not establish that the portal is secure, clinically validated, or
production-ready. It establishes that the 19 existing OB/GYN note types are intact, that their
forms are internally consistent and non-blocking, that the ICD-11 catalogue is internally
consistent on release 2026-01, and that the safety-prompt engine behaves correctly on the
scenarios listed. **Before real patient use, the specialty requires review and sign-off by a
qualified obstetrician-gynecologist, together with clinical-safety and privacy review.**