# General Surgery — Implementation & Verification Report

Review date: 27 October 2026 · Scope: General Surgery note types only · Clinical content only

## 1. What changed and what did not

Changed (this phase):
- `src/lib/surgeryReferences.js` — new verified guideline register and per-note-type mapping.
- `src/components/doctor/notes/SurgeryGuidelineBasis.jsx` — new collapsible "Guideline basis & references" panel.
- `src/components/doctor/notes/ClinicalNoteForm.jsx` and `src/components/doctor/encounters/DocumentForm.jsx` — render the panel for surgery note types (returns nothing for every other specialty).
- `src/lib/surgeryConditionDocuments.js` — added the "Not assessed" answer to the required breast Clinical Assessment field so required validation can never block documentation.

Not changed: every entity schema, every RLS rule, every backend function, the note keys, note names, field keys, doctor/patient permissions, encounters, prescriptions, requests and audit behaviour. Verified with version control: no file under `base44/entities`, `base44/functions` or `base44/workflows` is modified.

## 2. Note types reviewed (25)

Existing catalogue (12): Surgical Consultation (27 fields) · Pre-Operative Assessment (38) · Operative Note (37) · Procedure Note (17) · Post-Operative Note (23) · Daily Surgical Progress Note (22) · Discharge Summary (20) · Surgical Follow-Up (12) · Pathology Request / Record (17) · Surgical Referral (12) · Consent Documentation (16) · Implant / Device Record (18).

Condition-specific (13): Acute Abdomen / Emergency General Surgery (25) · Appendicitis (23) · Bowel Obstruction (23) · Hernia & Abdominal Wall (19) · Gallbladder & Biliary (23) · Hepatobiliary & Pancreatic (22) · Colorectal & Anorectal (21) · Breast (21) · Thyroid & Parathyroid (20) · Upper GI (20) · Surgical Infection / Abscess / Wound (23) · Trauma & Emergency Surgery (22) · Endoscopy Record (15).

Total 536 fields. Required fields: 18 across 13 note types, each with an answer that means "not assessed / not yet decided / not performed".

## 3. References actually verified (reviewed 27 October 2026)

| Organization | Document (version) | Level | Source |
|---|---|---|---|
| WHO | Surgical Safety Checklist + Implementation Manual (2009) | Documentation standard | who.int safe-surgery tool & resources |
| WHO | Guidelines for Safe Surgery (2009) | Documentation standard | who.int/publications/i/item/9789241598552 |
| WHO | Global Guidelines for Prevention of SSI, 2nd ed. (2018) | Clinical recommendation | who.int/publications/i/item/9789241550475 |
| ACS | Statements on Principles; Principles Underlying Surgeon Responsibility Toward the Patient (9 Jun 2026) | Documentation standard | facs.org/about-acs/statements |
| ACS | ATLS Student Course Manual, 10th ed. (2018) | Clinical recommendation | facs.org trauma education |
| ERAS Society | Guideline collection: colorectal, emergency laparotomy, HPB, upper GI, trauma | Clinical recommendation | erassociety.org/guidelines |
| SAGES | Clinical / practice guideline index | Clinical recommendation | sages.org/publications/guidelines |
| SAGES | Safe Cholecystectomy Multi-Society Practice Guideline (May 2020) | Clinical recommendation | sages.org guideline page |
| SAGES | Intraoperative Imaging of the Common Bile Duct (Sep 2025) | Clinical recommendation | sages.org guideline page |
| SAGES | Laparoscopic Ventral Hernia Repair (Jun 2016) | Clinical recommendation | sages.org guideline page |
| EAES / SAGES | Diverticular Disease, multi-society update (Oct 2026) | Clinical recommendation | sages.org guideline page |
| WSES | Jerusalem guidelines, acute appendicitis 2020 update | Clinical recommendation | doi.org/10.1186/s13017-020-00306-3 |
| WSES | Bologna ASBO 2017 update (2018) | Clinical recommendation | pubmed.ncbi.nlm.nih.gov/29946347 |
| WSES | WSES guideline collection incl. emergency complicated hernia | Clinical recommendation | wses.org.uk/scientific-resources/guidelines |
| Tokyo Guidelines (JSHBPS) | TG18 diagnostic criteria and severity grading, acute cholecystitis | Clinical recommendation | pubmed.ncbi.nlm.nih.gov/29032636 |
| ASCRS | Clinical Practice Guidelines incl. Colon Cancer 2022 | Clinical recommendation | ascrsu.com guidelines |
| ASGE | Guideline collection incl. informed consent for GI endoscopy (2022) | Clinical recommendation | asge.org/home/resources/guidelines |
| ATA | 2015 Thyroid Nodules / Differentiated Thyroid Cancer guidelines | Clinical recommendation | thyroid.org professional guidelines |
| WHO | ICD-11 MMS | Classification / coding only | icd.who.int/browse/latest-release/mms/en |

Each reference is displayed in the note with its organization, document, date, level, what it supports, and a link to the official source.

## 4. Unresolved issues and flags (shown in the UI)

1. Full SAGES / ASGE / ASCRS texts sit behind publisher or society logins — index pages, titles, dates and abstracts verified; individual recommendation statements not re-read in full.
2. WSES guideline page lists documents without per-document dates; ASBO and appendicitis dates taken from their PubMed records.
3. Bethesda cytology categories and ASA physical status classes are used as documentation shorthand; their source documents were not retrieved in this review.
4. Clavien–Dindo grades are a recorded classification only; original validation publication not retrieved.
5. Breast oncoplastic / margin recommendations (ASBrS, SSO-ASTRO) not verified — the template therefore records the surgeon's plan and prescribes no margin threshold.
6. Societies conflict on antibiotic-first management of uncomplicated appendicitis and diverticulitis — AMedix records the documented decision only.
7. Local-policy dependencies: antibiotic choice and prophylaxis duration, VTE agent and duration, ERAS component set, contrast policy, trauma transfer criteria, consent law and form, implant traceability — institution-specific.
8. ICD-11 is used for diagnosis coding only, never as procedural guidance.

## 5. Tests performed (no real patient data, no destructive operations)

Method: a structural and simulation harness importing the real note modules — fictional values only, no writes to production records beyond reading one existing note.

1. Registry integrity — all 25 note keys unique, all scoped to `surgery`. PASS
2. Reference coverage — a reference set exists for all 25 note types, no orphan entries, 19 references structurally complete with https sources. PASS
3. Per-note cycle — for each of the 25 note types: fictional draft → required-field validation → save payload in the stored `{ label, value }` shape → retrieval. 25/25 PASS
4. Validation behaviour — every required field blocks an empty save, and every required select offers a non-committal answer so documentation is never blocked. PASS
5. Historical compatibility — the 11 field keys stored on the one existing surgery note still map to current fields; no key was renamed. PASS
6. Retrieval rendering — note and document cards render stored `data` generically by label, so historical records and new fields both display. PASS (code path verified)
7. Build — production build completes with no errors. PASS

Not executed: live browser click-through of each form and clinician UAT of clinical wording. Draft save/restore, signature, amendment and audit code paths were inspected and left unchanged, not exercised against production data.

## 6. Recommended next steps

- Clinician UAT of the wording and required-field choices for all 25 note types on a test patient.
- Local protocol sign-off for the eight flagged local-policy items before go-live.
- If the institution holds subscription access, re-read the full SAGES/ASGE/ASCRS texts and update the reference entries.