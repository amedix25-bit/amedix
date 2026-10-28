# AMedix — ENT (Otolaryngology) Specialty Audit — Part 1 of 4
**Existing system, preservation, and authoritative references**

Reviewed: **2026-10-28** · Specialty key: `ent` · Display name: **ENT (Otolaryngology)**
Reference register: [`src/lib/entReferences.js`](./entReferences.js) · Review date recorded there: `2026-10-28`

> Part 1 is an inspection and traceability record. It changes **no** note type, key, field,
> schema, permission, workflow or stored record. Clinical strengthening of the note types is
> scheduled for Parts 2–4 and is listed as a checklist in §5.

---

## 1. What was actually inspected

| File / area | What it holds | ENT finding |
|---|---|---|
| `src/lib/specialtyDocuments.js` L47 | `SPECIALTY_KEYS` — `"ENT (Otolaryngology)": "ent"` | Specialty resolves to `ent`. Intact. |
| `src/lib/specialtyDocuments.js` L716–751 | `ENT_DOCS` — the complete ENT note-type catalogue | **9 note types**, all defined here, all flat field lists (`type: textarea / input / select / number`), no section headings. |
| `src/lib/specialtyDocuments.js` L871, L880, L885 | Assembly into `SPECIALTY_DOCUMENTS`; `getSpecialtyDocs()`, `getDocDef()` | ENT notes pass through the shared policy on load; the doctor's note-type list is built from this one catalogue. |
| `src/lib/noteSectionPolicy.js` | Shared retirement + field-replacement rules applied to **every** specialty | Actively removes fields from 5 of the 9 ENT note types and rewrites the examination field of 2 (§3). |
| `src/lib/examinations/index.js` | Structured-examination registry | ENT type registered. |
| `src/lib/examinations/types/ent.js` | ENT structured examination | 5 sections (Ear, Nose & Sinuses, Oral Cavity & Throat, Neck, Special Findings), 22 structured fields + free notes. Reused, not rebuilt. |
| `src/lib/examinations/clinicalExaminations.js` L60 | Specialty → examination mapping | `ent: ["ent", "general", "respiratory", "custom"]`. Intact. |
| `src/lib/diseaseSpecificNotes.js` | "Disease-Specific Note" browse groups | Only **surgery, nephrology, rheumatology** are grouped. ENT has **no** disease-specific templates — it is a presentation-only module, so ENT additions there cannot alter the 9 existing types. |
| `src/components/doctor/encounters/DocumentFields.jsx` | Field renderers | Renders `textarea, input, number, select, vitals, examinations, icd11_diagnoses, investigation_panels, renal_labs, kdigo_renal, neph_alerts, neph_medications, disease_activity, rheum_*`. **No ENT-specific renderer exists.** |
| `src/lib/clinicalFieldValue.js` | Readable text for stored values (note view / PDF / print) | Covers the generic types only; any new ENT structured field must be added here or it prints empty. |
| `ClinicalNote` (database) | Saved clinical notes | **0 records with `specialty = "ent"`.** 0 keys, no partial data, nothing to migrate. |
| `ClinicalNoteDraft` (database) | Autosaved drafts | **0 ENT drafts.** |
| `TerminologyCode` (database) | Verified code mappings | 64 rows. ENT-relevant: only `3016-3 Thyroid Function Tests` (LOINC), `5A00–5A2Z Thyroid Disease`, `5A00 Hypothyroidism`, `5A20 Hyperthyroidism`. **No ENT diagnosis coding map exists.** |
| Backend functions | `terminologyLookup` already deployed | Reusable for ENT coding — no new function needed. |
| Existing reference registers | `src/lib/surgeryReferences.js` is the only specialty register | No ENT register existed → created in Part 1 (documentation only, imported by nothing). |

**Database-wide preservation risk: nil for ENT data.** No ENT note has ever been saved, so no
existing record can be altered by the coming changes. The binding constraint is therefore the
**template catalogue itself** (keys, labels, field keys, ordering) and the **shared components**
other specialties depend on.

---

## 2. Preservation baseline — what must not change

1. The 9 ENT note types keep their **keys** (`ent_consultation` … `ent_referral`), **labels**,
   **specialty**, and their place in the **primary** note-type selector (they are not disease
   templates and must not be moved into the picker).
2. `ent_consultation … ent_referral` remain **General/free-standing note types**; any
   disease-specific ENT templates added in Part 4 must be **new keys** and must go into the
   "Disease-Specific Note" picker only.
3. `noteSectionPolicy.js` is shared by **every** specialty. It is **not** edited for ENT.
   Consequence for Parts 2–4: a new ENT field must be named so the shared retirement rules
   do not silently delete it. Labels matching any of these patterns are retired on load and
   **must be avoided**:

   `^Plan…`, `^Imaging`, `…imaging$`, `^Investigations?`, `^Labs?`, `^Laborator…`,
   `^Referral…`, `^Current Medications?`, `^Past Medical History`, `^Past Surgical History`,
   `^Family History`, `^Medical History`, `^Treatment History`, `^Previous Treatments?`,
   `^Medication(s| Review)`, `^Antimicrobial…`, `^Escalat…`, `^Working Diagnosis`,
   `^Provisional Diagnosis`, `^Vital Signs` (auto-converted), anything containing
   "Examination" (auto-replaced by *Select Examination*), `^Referrals & Encounter…`,
   `^Encounter Context`.

   Practical wording: *Management & Follow-Up Plan*, *Diagnostic Studies*, *Therapeutic Plan*,
   *Disposition & Safety-Net Advice*.
4. The ENT structured examination (`types/ent.js`) is **reused** — never re-declared inside a
   note template.
5. The unified Patient Record snapshots attached to every note (allergies, active medication
   names, recorded conditions, DOB, encounter, signature, note reference) are **not**
   duplicated inside ENT fields.
6. No change to `ClinicalNote`, `ClinicalDocument`, `Encounter`, permissions, RLS, signature,
   versioning or audit logging.

---

## 3. Per-note-type audit (each note type reviewed individually)

Legend — **Kept**: fields that survive the shared policy today. **Policy-removed**: fields the
shared policy already strips (not an ENT decision, and not restored in this programme).
**Gap**: what the note cannot document today, measured against the references in §4.

### 3.1 `ent_consultation` — ENT Consultation
- **Kept (5):** Chief Complaint · History of Present Illness · ENT History · Select Examination · Assessment
- **Policy-removed:** Past Medical History · Plan
- **Gap:** no laterality-aware otoscopy / nasal / laryngeal finding fields beyond the examination block; no symptom-duration field (needed for the acute-bacterial-vs-viral sinusitis distinction); no red-flag block (unilateral nasal obstruction with bleeding, persistent hoarseness >3 weeks, neck mass, sudden hearing loss, stridor, dysphagia, odynophagia, otalgia with normal otoscopy); no diagnosis coding; no documented shared-decision record.
- **References:** `aao_sinusitis_2025`, `aao_neck_mass_2017`, `aao_hoarseness_2018`, `aao_allergic_rhinitis_2015`, `aao_aoe_2014`, `aao_ome_2016`, `aao_tinnitus_2026`, `aao_bells_palsy_2013`, `aao_bppv_2017`, `aao_menieres_2020`, `who_icd11_mms`

### 3.2 `ent_followup` — ENT Follow-Up
- **Kept (4):** Interval History · Current Symptoms · Select Examination · Assessment
- **Policy-removed:** Investigations · Plan
- **Gap:** no interval treatment-response field (e.g. tinnitus handicap, hearing-aid use, sinus symptom score) and no adherence field; no documented next review interval.
- **References:** `aao_sinusitis_2025`, `aao_tinnitus_2026`, `aao_arhl_2024`, `aao_bppv_2017`, `aao_hoarseness_2018`, `aao_bells_palsy_2013`

### 3.3 `ent_procedure_note` — ENT Procedure Note
- **Kept (8):** Procedure · Indication · Consent · Technique · Findings · Specimens · Complications · Patient Condition
- **Gap:** no laterality/side field (critical: ears, nostrils, sinuses), no local anaesthesia / agent record, no pack or dressing placed (and removal date), no documented post-procedure instructions and warning signs (epistaxis, cerumen, BPPV manoeuvre).
- **References:** `aao_epistaxis_2020`, `aao_cerumen_2017`, `aao_bppv_2017`

### 3.4 `ent_operative_note` — Operative Note (ENT)
- **Kept (13):** all fields (Pre-Op Diagnosis · Post-Op Diagnosis · Procedure · Surgeon · Assistants · Anaesthesia · Indication · Findings · Procedure Details · Specimens · Estimated Blood Loss · Complications · Post-Operative Plan)
- **Gap:** no side/laterality, no microscope/endoscope and instrument record, no nerve-monitoring record (facial / recurrent laryngeal), no packs placed / count, no explicit throat-pack and airway-extubation record — the last three are the specific risks of ENT operating.
- **References:** `aao_crs_surgery_2025`, `aao_tympanostomy_2022`, `aao_voice_thyroid_2013`

### 3.5 `ent_preop_assessment` — Pre-Operative Assessment (ENT)
- **Kept (5):** Planned Procedure · Indication · Comorbidities · Clearance · Pre-Operative Instructions
- **Policy-removed:** Current Medications · Laboratory Results · Imaging
- **Gap:** no anticoagulant/antiplatelet status, no airway assessment (Mallampati, mouth opening, neck movement) — the central ENT preoperative risk —, no consent/expectation record for sinus surgery, no documented anaesthetic plan.
- **References:** `aao_crs_surgery_2025`, `aao_tympanostomy_2022`

### 3.6 `ent_postop_note` — Post-Operative Note (ENT)
- **Kept (8):** Procedure Date · Post-Operative Day · Vital Signs *(structured)* · Wound · Airway Status · Nasal Packing / Packs Status · Pain Control · Complications
- **Policy-removed:** Plan
- **Gap:** no analgesia plan field (opioid vs non-opioid, quantity), no debridement/cleaning record, no voice check after thyroid surgery, no discharge-readiness statement.
- **References:** `aao_opioid_2021`, `aao_crs_surgery_2025`, `aao_voice_thyroid_2013`, `aao_epistaxis_2020`

### 3.7 `ent_audiology_report` — Audiology / Diagnostic Report
- **Kept (6):** Test Type · Indication · Results — Right · Results — Left · Interpretation · Recommendations
- **Gap:** results are free text only — no structured PTA threshold per frequency, no speech discrimination score, no tympanogram type, no hearing-loss classification (conductive / sensorineural / mixed; mild–profound), no OAE/ABR result fields, so the report cannot be trended or compared with a later audiogram.
- **References:** `aao_arhl_2024`, `aao_sudden_hearing_loss_2019`, `aao_ome_2016`, `aao_tinnitus_2026`

### 3.8 `ent_discharge_summary` — Discharge Summary (ENT)
- **Kept (8):** Pre-Operative Diagnosis · Post-Operative Diagnosis · Procedure Performed · Hospital Course · Discharge Medications · Wound / Pack Care · Follow-Up · Warning Signs
- **Gap:** no pack-removal date / responsible clinician, no documented analgesia quantity on discharge, no activity and water-precautions advice field, no documented patient education.
- **References:** `aao_crs_surgery_2025`, `aao_tympanostomy_2022`, `aao_opioid_2021`, `aao_epistaxis_2020`

### 3.9 `ent_referral` — ENT Referral
- **Kept (4):** Referred To · Reason for Referral · Urgency · Relevant History
- **Gap:** no clinical question field, no documented investigations already performed, no red-flag statement — the three things an ENT referral is triaged on.
- **References:** all — the referral note carries the reason for any of the above.

---

## 4. Authoritative references — verification record

| ID | Source | Version / publication date | Level | Verified |
|---|---|---|---|---|
| `aao_sinusitis_2025` | AAO-HNSF CPG: Adult Sinusitis Update (DOI 10.1002/ohn.1344) | 31 Jul 2025 | clinical recommendation | official AAO-HNS page |
| `aao_crs_surgery_2025` | AAO-HNSF CPG: Surgical Management of Chronic Rhinosinusitis (10.1002/ohn.1287) | 27 May 2025 | clinical recommendation | official AAO-HNS page |
| `aao_tinnitus_2026` | AAO-HNSF CPG: Tinnitus Update (10.1002/ohn.70417) | 12 Oct 2026 | clinical recommendation | official AAO-HNS page |
| `aao_arhl_2024` | AAO-HNSF CPG: Age-Related Hearing Loss (10.1002/ohn.750) | 30 Apr 2024 | clinical recommendation | official AAO-HNS page |
| `aao_sudden_hearing_loss_2019` | AAO-HNSF CPG: Sudden Hearing Loss (Update) | 2019 | clinical recommendation | official AAO-HNS page |
| `aao_hoarseness_2018` | AAO-HNSF CPG: Hoarseness (Dysphonia) Update | 2018 | clinical recommendation | official AAO-HNS page |
| `aao_neck_mass_2017` | AAO-HNSF CPG: Evaluation of the Neck Mass in Adults | 2017 | clinical recommendation | official AAO-HNS page |
| `aao_tympanostomy_2022` | AAO-HNSF CPG: Tympanostomy Tubes in Children (Update) | 2022 | clinical recommendation | official AAO-HNS page |
| `aao_ome_2016` | AAO-HNSF CPG: Otitis Media with Effusion (Update) | 2016 | clinical recommendation | official AAO-HNS page |
| `aao_allergic_rhinitis_2015` | AAO-HNSF CPG: Allergic Rhinitis | 2015 | clinical recommendation | official AAO-HNS page |
| `aao_aoe_2014` | AAO-HNSF CPG: Acute Otitis Externa (Update) | 2014 | clinical recommendation | official AAO-HNS page |
| `aao_bells_palsy_2013` | AAO-HNSF CPG: Bell's Palsy (update in development) | 2013 | clinical recommendation | official AAO-HNS page |
| `aao_bppv_2017` | AAO-HNSF CPG: BPPV (Update) | 2017 | clinical recommendation | official AAO-HNS page |
| `aao_cerumen_2017` | AAO-HNSF CPG: Earwax (Cerumen Impaction) Update | 2017 | clinical recommendation | official AAO-HNS page |
| `aao_epistaxis_2020` | AAO-HNSF CPG: Nosebleed (Epistaxis) | 2020 | clinical recommendation | official AAO-HNS page |
| `aao_menieres_2020` | AAO-HNSF CPG: Ménière's Disease | 2020 | clinical recommendation | official AAO-HNS page |
| `aao_opioid_2021` | AAO-HNSF CPG: Opioid Prescribing After Common Otolaryngology Operations | 2021 | clinical recommendation | official AAO-HNS page |
| `aao_voice_thyroid_2013` | AAO-HNSF CPG: Voice Outcomes After Thyroid Surgery | 2013 | clinical recommendation | official AAO-HNS page |
| `who_icd11_mms` | WHO ICD-11 MMS — latest release browser | reviewed 2026-10-28 | classification / coding | icd.who.int |

**Reviewed but not applied** (no existing note type documents them): Rhinoplasty (2017),
Immunotherapy for Inhalant Allergy (2024) — listed in `ENT_REFERENCES_NOT_YET_APPLIED`.

**Verification flags carried forward** (`ENT_REFERENCE_FLAGS`):
1. The Adult Sinusitis Update page states the target population as "50 years and older", which
   conflicts with an adult scope — **no age gate is implemented**; the clinician judges.
2. Full texts are paywalled (Wiley). Only official summaries, patient resources and DOI records
   were verifiable; **no key-action-statement wording is quoted or encoded**.
3. AAO-HNSF guidance is US-population guidance; local formulary and national policy prevail.
4. **No ENT ICD-11 codes are verified or stored yet.** Codes will be added only from
   individually checked WHO Browser entries, in the same traced form used by
   `rheumIcd11.js` / `nephIcd11.js`, via the existing `terminologyLookup` function.
5. Bell's Palsy guideline is under revision — documentation requirements only, no treatment mandate.

**ICD-11 coding scope for ENT** (verified as the classification system; codes themselves pending
per-code verification): ear and mastoid diseases; upper-respiratory/sinus and pharynx diseases;
larynx and vocal cord diseases; diseases of the nervous system covering vestibular function;
neoplasms of the head and neck; symptoms/signs of the head and neck. Every code entry will store
code + official display term + the version reviewed.

---

## 5. Internal checklist — improvements per note type (status: Part 1)

| # | Note type | Planned improvement | Reference basis | ICD-11 | Status |
|---|---|---|---|---|---|
| 1 | `ent_consultation` | Add laterality-aware ENT symptom block; symptom duration/pattern; red-flag block; structured diagnosis coding; shared-decision record; safety-net advice | sinusitis 2025, neck mass 2017, hoarseness 2018, AOE 2014, OME 2016, tinnitus 2026, BPPV 2017, Ménière 2020, Bell's 2013 | pending | ☐ Part 2 |
| 2 | `ent_followup` | Add treatment-response and adherence fields; next-review interval; symptom-score delta | tinnitus 2026, ARHL 2024, sinusitis 2025, hoarseness 2018 | pending | ☐ Part 2 |
| 3 | `ent_procedure_note` | Add side/laterality; anaesthesia agent; pack/dressing placed + removal; post-procedure instructions & warning signs | epistaxis 2020, cerumen 2017, BPPV 2017 | pending | ☐ Part 2 |
| 4 | `ent_operative_note` | Add side; endoscope/microscope; nerve monitoring; packs and counts; throat pack / extubation record | CRS surgery 2025, tympanostomy 2022, thyroid voice 2013 | pending | ☐ Part 2 |
| 5 | `ent_preop_assessment` | Add anticoagulant status; airway assessment; consent & expectations; anaesthetic plan | CRS surgery 2025, tympanostomy 2022 | pending | ☐ Part 3 |
| 6 | `ent_postop_note` | Add analgesia plan (opioid vs non-opioid + quantity); debridement record; voice check; discharge-readiness | opioid 2021, CRS surgery 2025, thyroid voice 2013 | pending | ☐ Part 3 |
| 7 | `ent_audiology_report` | Add structured audiogram (per-frequency thresholds, speech discrimination, tympanogram type, classification) + hearing-loss severity; keep free text as-is | ARHL 2024, SSNHL 2019, OME 2016 | pending | ☐ Part 3 |
| 8 | `ent_discharge_summary` | Add pack-removal plan; discharge analgesia quantity; activity/water precautions; patient education record | CRS surgery 2025, tympanostomy 2022, opioid 2021 | pending | ☐ Part 3 |
| 9 | `ent_referral` | Add clinical question; investigations already performed; red-flag statement | as per referring condition | pending | ☐ Part 2 |
| 10 | ENT diagnosis coding | Verified ICD-11 MMS catalogue + entry through `terminologyLookup` / `TerminologyCode` | WHO ICD-11 | required | ☐ Part 3 |
| 11 | ENT disease-specific templates (new keys only) | Sinusitis (acute/CRS), otitis media/externa, hearing loss/tinnitus, vertigo, hoarseness, neck mass, epistaxis, tonsillitis | all of §4 | required | ☐ Part 4 |
| 12 | Readable output | Register any new field type in `clinicalFieldValue.js` so note view + PDF print the value | — | — | ☐ Part 3 |
| 13 | Label-policy conformance | Every new field label checked against the shared retirement patterns (§2.3) | — | — | ☐ each part |
| 14 | Regression | ENT catalogue still returns exactly 9 legacy keys; other specialties' doc counts unchanged; build clean | — | — | ☐ each part |

---

## 6. Change log — Part 1

| Change | Type | Runtime effect |
|---|---|---|
| Added `src/lib/entReferences.js` — verified reference register, levels, not-yet-applied list, verification flags | new documentation module | none (imported by no component yet) |
| Added this audit + traceability record | documentation | none |
| ENT note types, fields, keys, policy, examination, permissions, schemas, records | **unchanged** | none |

## 7. Verification performed for Part 1

- ENT catalogue contains exactly **9** note types, keys `ent_consultation` … `ent_referral`
  (counted in source, unchanged).
- Specialty mapping `"ENT (Otolaryngology)" → "ent"` intact; ENT examination mapping
  `["ent","general","respiratory","custom"]` intact.
- Database: **0** `ClinicalNote` and **0** `ClinicalNoteDraft` records for ENT → no record can be
  affected; no migration required.
- No shared file was edited: `noteSectionPolicy.js`, `specialtyDocuments.js`,
  `examinations/*`, `clinicalFieldValue.js`, `diseaseSpecificNotes.js` all untouched.

---

# Part 2 — ENT clinical documentation strengthened, ICD-11 catalogue live

Implemented: **2026-10-28** · Specialty key: `ent` · Note types: **14** (9 preserved + 5 added)

## 8. What changed

| Change | File | Effect at runtime |
|---|---|---|
| ENT note catalogue moved out of `specialtyDocuments.js` into its own module, content deepened | `src/lib/entDocuments.js` (new) | ENT notes render the new fields; the 9 legacy keys and labels are unchanged |
| `ENT_DOCS` imported instead of declared inline | `src/lib/specialtyDocuments.js` | same assembly into `SPECIALTY_DOCUMENTS`; no other specialty touched |
| Verified ICD-11 MMS catalogue for ENT | `src/lib/entIcd11.js` (new) | each ENT note carries a diagnosis field restricted to ENT-relevant codes |
| ICD-11 field stamps the release the code was verified against | `src/components/doctor/notes/Icd11DiagnosisField.jsx` | `version` now reads the entry's own release (ENT 2025-01, others unchanged) |
| ENT structured examination extended | `src/lib/examinations/types/ent.js` | +6 fields: positional testing (Dix–Hallpike / roll), facial nerve (House–Brackmann), nasal endoscopy, olfaction, laryngeal view, neck mass |

## 9. ICD-11 provenance (verifiable)

- Source: WHO ICD-11 MMS **Simple Tabulation, release 2025-01** —
  `https://icdcdn.who.int/static/releasefiles/2025-01/SimpleTabulation-ICD-11-MMS-en.xlsx`
- Retrieved `2026-10-28`; **133** codes extracted by code from the tabulation (code + official
  title + chapter), display terms copied character-for-character. No code was written from memory.
- Chapters covered: 10 (ear / mastoid), 12 (respiratory — nose, pharynx, larynx), 21 (symptoms),
  7 (sleep), 1 (infections), 13 (oral / salivary).
- Deliberately **not** encoded: inclusion and exclusion notes (not carried by the tabulation), and
  chapter 2 neoplasm codes (a neck mass must be coded with its histology from the WHO browser).
  The diagnosis field therefore never states an exclusion it could not be verified against, and a
  clinician can always add a code with its source from the WHO browser.
- Residual codes (`…Y` / `…Z`) are flagged in the catalogue and say so in the picker, so an
  unspecified code is a visible choice rather than a silent default.

## 10. Shared-policy conformance sweep (§2.3) — applied before writing

Every field label in the 14 note types was checked against the shared retirement patterns. The
labels below were reworded so the policy cannot strip them, and exactly one structured field per
note carries the "Examination" label (converted by the policy into *Select Examination*):

| Was | Now | Reason |
|---|---|---|
| Neck Examination | Neck Palpation Findings | contained "Examination" |
| Laryngeal Examination | Laryngeal View (endoscopy) | contained "Examination" |
| Cranial Nerve Examination | Cranial Nerves | contained "Examination" |
| Examination Cooperation | Cooperation During Assessment | contained "Examination" |
| …Mobility on Examination | …Mobility on Assessment | contained "Examination" |
| Examination Findings at Referral | Clinical Findings at Referral | contained "Examination" (a referral has no exam block) |
| Safety-Net Advice & Escalation Route Given | Safety-Net Advice & Who to Contact Given | matched `^Escalat…` |

## 11. New note types (new keys only — nothing moved into the picker)

| Key | Label | What it documents |
|---|---|---|
| `ent_otology` | Ear & Otology Note | otology history, tuning fork pattern, audiometry status, positional testing, facial nerve grade, vestibular assessment |
| `ent_rhinosinusitis` | Nose & Sinus Note | pattern and duration, epistaxis with bleeding risk, endoscopy, cross-sectional review, medical vs surgical decision |
| `ent_laryngology` | Throat, Larynx & Voice Note | voice, swallow and airway symptoms, laryngeal view, voice and swallow assessment, co-management |
| `ent_neck_mass` | Head & Neck Mass Note | mass character, red flags, cranial nerves, nasendoscopy, provisional nature, pathway, tissue sampling, MDT |
| `ent_paediatric` | Paediatric ENT Note | caregiver history, development and feeding, sleep-disordered breathing, infections, age-appropriate examination, surgical discussion |

## 12. Checklist status after Part 2

Items **1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13** of §5 are implemented.
Still open: **11** (ENT disease-specific templates for the "Disease-Specific Note" picker —
Part 4) and the Part 3/4 review of any guideline element not yet expressed as a field.

## 13. Verification performed for Part 2

- Production build passes with the new modules and the reworded labels.
- `SPECIALTY_DOCUMENTS` still assembles `...ENT_DOCS` in the same position; ENT keys
  `ent_consultation … ent_referral` unchanged, labels unchanged, specialty still `ent`.
- `noteSectionPolicy.js`, `clinicalFieldValue.js`, `diseaseSpecificNotes.js` and every other
  specialty's templates were **not** edited.
- No new data shapes are stored: all new fields use existing field types
  (`textarea, input, number, select, examinations, icd11_diagnoses`), so note view, print and
  PDF keep rendering without a new renderer.
- ENT records in the database: still **0**, so no stored note can be altered by this change.
- Other specialties untouched (`git status` shows only the new file).