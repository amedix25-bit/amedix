# Allergy & Immunology — implementation and traceability record

**Build date:** 2026-11-08
**Specialty key:** `allergy` (label *Allergy & Immunology*)
**Status:** additive build on the existing AMedix clinical documentation system

---

## 1. Audit of what existed before this build

| Area | Finding |
| --- | --- |
| Specialty registry | `Allergy & Immunology` was a selectable specialty (`SPECIALTIES`) but mapped to the **Internal Medicine** note set (`SPECIALTY_KEYS` → `internal_medicine`). There were no allergy note types, no allergy blocks, no allergy investigation field, no allergy safety prompts, no allergy ICD-11 catalogue and no allergy guideline attribution. |
| Consultation templates | Only the 13 generic Internal Medicine templates (`im_*`). |
| Diagnosis sections | The shared ICD-11 diagnosis field (`icd11_diagnoses`) with the rheumatology-derived catalogue — no allergy/immunology entries. |
| Investigation fields | None for this specialty. The structured laboratory field types (`hema_labs`, `renal_labs`, `cardio_labs`, `ophth_investigations`) belong to other specialties. |
| Treatment modules | None specialty-specific. |
| Follow-up workflows | Generic follow-up note only. |
| Database relationships | Notes attach to the existing `ClinicalNote` / `ClinicalDocument` + `Encounter` + `PatientProfile` chain. No allergy-specific table existed. |
| Permissions | Existing note permissions, RLS and audit logging applied unchanged. |
| Cross-cutting policy | `noteSectionPolicy` retires investigation/laboratory/imaging/family-history/referral/"Plan" sections from every template — so any new field had to be named and typed to survive that policy without weakening it. |

**No existing template was recreated, renamed, replaced or reorganised.** The 13 Internal Medicine templates and every saved note keep their keys, labels and fields. `internal_medicine` is still a valid specialty key and every `im_*` document type is still accepted server-side.

---

## 2. What was added (all additive)

### 2.1 Note types — `src/lib/allergyDocuments.js` (11 templates)

| Key | Label |
| --- | --- |
| `allergy_consultation` | Allergy & Immunology Consultation |
| `allergy_followup` | Allergy & Immunology Follow-Up |
| `allergy_anaphylaxis_note` | Anaphylaxis Record |
| `allergy_food_note` | Food Allergy Assessment |
| `allergy_drug_note` | Drug Allergy & Delabelling Assessment |
| `allergy_skin_note` | Skin Allergy Assessment |
| `allergy_immunology_note` | Clinical Immunology Assessment |
| `allergy_immunotherapy_visit` | Allergen Immunotherapy Visit |
| `allergy_procedure_note` | Allergy Procedure Record |
| `allergy_child_consultation` | Paediatric Allergy & Immunology Consultation |
| `allergy_care_plan` | Allergy Action Plan & Follow-Up |

Every template records: presenting complaint, detailed history of presenting illness, allergy exposure/occupation/environment, previous reactions and their severity, previous workup and treatment, atopic and family history, the specialty findings, the clinical assessment and the documented reasoning with differentials, management at this visit and the follow-up arrangement.

Server-side registration: `base44/shared/clinicalDocumentCatalog.ts` → `allergy` entry, so `createClinicalDocument` accepts and derives the specialty for these keys.

### 2.2 Structured blocks — `src/lib/allergyModules.js` (11 blocks, field type `allergy_modules`)

`allergy_history`, `allergy_exam`, `allergy_anaphylaxis`, `allergy_asthma`, `allergy_rhinitis`, `allergy_food`, `allergy_drug`, `allergy_skin`, `allergy_immunology`, `allergy_ait`, `allergy_provocation`, `allergy_management`.

Coverage against the requested scope:

| Requested area | Where it is documented |
| --- | --- |
| Respiratory allergy — asthma, rhinitis, conjunctivitis, exercise-induced bronchoconstriction | `allergy_asthma` (GINA control questions, treatment step, objective confirmation, EIB plan), `allergy_rhinitis` (ARIA duration/severity, symptom score instrument, intranasal/oral/ocular treatment) |
| Food allergy — IgE and non-IgE, food-induced anaphylaxis, testing, supervised challenges | `allergy_food`, `allergy_provocation` |
| Drug allergy — penicillin, NSAID, other reactions, provocation, delabelling | `allergy_drug`, `allergy_provocation` |
| Skin allergy — atopic dermatitis, acute and chronic urticaria, contact dermatitis, angioedema | `allergy_skin` |
| Severe reactions — anaphylaxis, hereditary and acquired angioedema | `allergy_anaphylaxis`, `allergy_skin` (angioedema type) |
| Clinical immunology — PID/IEI, antibody, cellular/combined, complement, immune dysregulation | `allergy_immunology` |
| Allergen immunotherapy — SCIT, SLIT, response, adverse reactions, safety monitoring | `allergy_ait` |
| Adult and paediatric | `allergy_immunology.age_band`, `allergy_child_consultation`, and the age-specific guidance recorded in the attribution |

No block duplicates a shared AMedix surface: vital signs, medications, allergies, laboratory/imaging results and the patient's recorded history stay in the unified Patient Record and the shared note tabs.

### 2.3 Recorded test results — `src/lib/allergyTests.js` (field type `allergy_tests`)

Ten groups: skin prick testing, total and specific IgE, component-resolved diagnostics, patch testing, mast-cell/eosinophil markers, humoral immunity, cellular immunity, complement, phagocyte function, and challenge result summaries.

Each row stores **only what was entered**: test, result/value, unit, reference range, flag, interpretation, date, ordering clinician, reporting source. **No result is generated, defaulted or prefilled** — `emptyTestRow` returns empty strings for every result field, and a row with no value prints nothing. The abnormality flag is derived from the value and range only when both are numeric and the range is parseable, and a clinician can override or clear it.

### 2.4 Advisory decision support — `src/lib/allergySafetyRules.js` (15 prompts)

Prompts fire only from documentation gaps or internal inconsistencies in the note, and each one names its guideline and the action to document. They never block saving, never change a diagnosis, never order anything, and never read a blank field as normal.

Examples: anaphylaxis documented without adrenaline documented; adrenaline given without an observation period recorded; drug allergy label kept without a phenotype; chronic urticaria without UAS7/UCT; suspected bradykinin-mediated angioedema without complement results; two or more immunodeficiency warning signs without an immune workup recorded; immunotherapy without documented consent or post-dose observation; positive provocation without the allergy record updated.

### 2.5 Guideline attribution — `src/lib/allergyReferences.js`

Sixteen references across AAAAI/ACAAI Joint Task Force, EAACI, WAO, GINA, ARIA, IUIS and WHO ICD-11. Each carries organisation, title, edition, population, what it is applied to, a source URL, the date the edition was last checked (`current_as_of`) and a status.

* **Editions that are not current are marked** (`status` not starting “current”), and the note UI shows them with an explicit warning not to treat them as current guidance. The EAACI 2014 food allergy series is recorded that way.
* The attribution text is written **into the note itself** (`allergy_guidance`), so an exported record keeps its evidence base.

### 2.6 ICD-11 — `src/lib/allergyIcd11.js`

Six category pointers (anaphylaxis, asthma, allergic rhinitis, atopic eczema, urticaria, primary immunodeficiencies) plus an explicit `ALLERGY_NOT_IN_CATALOGUE` list for the diagnoses that are **not** coded here.

**Important and deliberate:** this build did **not** verify allergy/immunology codes against a published ICD-11 MMS listing. Every catalogue entry is therefore stored as **`review_required`**, with the coding note instructing the clinician to confirm the code and display term in the WHO browser before signing. No code is invented, no ICD-10 code or crosswalk appears, and a diagnosis that cannot be mapped stores **no code** and is flagged for coding review.

### 2.7 UI

`AllergyBlockField`, `AllergyTestsField`, `AllergySafetyPromptsField` and `AllergyGuidanceField`, wired in `DocumentFields.jsx` for `allergy_modules`, `allergy_tests`, `allergy_safety`, `allergy_guidance`. Printing/export goes through `formatAllergyBlock` and `formatAllergyTests` in `clinicalFieldValue.js`.

### 2.8 Verification

`qa/allergy-qa.mjs` asserts: the specialty resolves; 11 notes exist; every declared field survived the note section policy; no retired section label reappeared; no duplicate field keys; blocks print; result rows start empty and an empty row prints nothing; flags are computed only from numeric value + parseable range; prompts fire only from documentation and carry a source; attribution carries edition, population and check date; strengthening is idempotent.

```
npx esbuild qa/allergy-qa.mjs --bundle --format=esm --alias:@=./src --outfile=/tmp/allergy-qa.mjs && node /tmp/allergy-qa.mjs
→ Allergy QA passed — 11 notes, 146 fields.
```

---

## 3. What this build deliberately does not do

1. **No generated clinical content.** No result, diagnosis, score or recommendation is produced automatically.
2. **No ICD-11 codes asserted as verified.** See §2.6 — confirmation in the WHO browser is required, and it is recorded in the note.
3. **No automatic severity grading or risk scoring** where the instrument requires clinician input (EASI, SCORAD, UAS7, UCT, TNSS are recorded as documented values, not calculated from fields that may be incomplete).
4. **No guideline edition is claimed to be the latest without a check date.** Each reference states when it was last checked and asks for re-confirmation.
5. **No new database table, page, permission or integration.** Everything stores inside the existing `ClinicalNote` / `ClinicalDocument` structured data, inheriting the same access control, signature, versioning and audit trail.
6. **No change to any other specialty.** The only shared-file edits are the specialty key mapping, the label, the catalogue entry and four renderer branches.

---

## 4. Outstanding items for clinical sign-off

| Item | Owner |
| --- | --- |
| Verify every ICD-11 category against the WHO MMS browser and record the release used | Coding lead |
| Confirm the current edition of each guideline in `allergyReferences.js` and update `current_as_of` | Allergy lead |
| Review the 15 advisory prompts against departmental policy | Allergy lead |
| Confirm the reference ranges used by the local laboratory for each test group | Laboratory lead |
| Paediatric review of weight-based dosing fields and age-specific provisions | Paediatric allergy lead |
| UAT: one note of each of the 11 types on a test patient | Clinical team |