# Pediatrics — Documentation, Coding and Safety Implementation Report

Status: **technical implementation complete, clinical approval outstanding.**

Specialty: `pediatrics` · Note types: 18 · Blocks: 16 · ICD-11 MMS entries: 20 · Safety rules: 30 · References: 34
Verification: `node qa/peds-qa.mjs` → OK · Production build: passes

---

## 1. What was audited

The eighteen pediatric note types already in `src/lib/specialtyDocuments.js` were audited in place:

| # | Key | Label |
|---|---|---|
| 1 | `peds_consultation` | Pediatric Consultation |
| 2 | `peds_followup` | Pediatric Follow-Up |
| 3 | `peds_well_child` | Well-Child Visit |
| 4 | `peds_admission_note` | Pediatric Admission Note |
| 5 | `peds_daily_progress` | Pediatric Daily Progress Note |
| 6 | `peds_discharge_summary` | Pediatric Discharge Summary |
| 7 | `peds_procedure_note` | Pediatric Procedure Note |
| 8 | `peds_chronic_followup` | Chronic Disease Follow-Up (Pediatric) |
| 9 | `peds_growth_development` | Growth & Development Record |
| 10 | `peds_immunization_record` | Immunization Record |
| 11 | `peds_screening_record` | Screening Record |
| 12 | `peds_anticipatory_guidance` | Anticipatory Guidance |
| 13 | `peds_newborn_record` | Newborn Record |
| 14 | `peds_birth_history` | Birth History |
| 15 | `peds_neonatal_progress` | Neonatal Progress Note |
| 16 | `peds_newborn_discharge_summary` | Newborn Discharge Summary |
| 17 | `peds_adolescent_health` | Adolescent Health Assessment |
| 18 | `peds_confidential_adolescent_note` | Confidential Adolescent Note |

`peds_referral` is **not** enhanced: referral letters are their own document in AMedix and the note-section policy retires referral note types from the note list. Nothing about that rule was changed.

### Findings from the audit

1. No note carried WHO ICD-11 MMS coding — children's diagnoses were free text.
2. No note recorded growth against a named reference; a centile without its reference cannot be interpreted, and the under-5 standards and the 5–19 reference place the same child differently.
3. The newborn notes recorded birth measurements but not the thermal care, feeding initiation, vitamin K prophylaxis or danger-sign screening the newborn documents require.
4. Jaundice was documented without a bilirubin value or the chart it was read against.
5. Nutrition status was recorded as free text, so the WHO severe-acute-malnutrition criteria (MUAC, weight-for-height, oedema) were never applied explicitly.
6. Acute presentations had no IMCI danger-sign triage, no age-specific fast-breathing threshold and no dehydration classification with its plan.
7. Immunisation was recorded as a free-text history; overdue antigens and the catch-up decision were not separated.
8. The adolescent notes recorded a confidentiality checkbox, but not confidential time, the limits of confidentiality, or a documented suicide-risk assessment after a positive mood screen.
9. No pediatric note recorded a safeguarding concern with its action, route and time.
10. Procedure notes recorded sedation without the weight the dose was calculated from, and consent was a free-text line.
11. No note recorded the guideline basis it was written from, so an exported record carried no evidence base.

---

## 2. What was added

### 2.1 Append-only architecture

`src/lib/pedsDocuments.js` → `withPediatricsStandards(PEDIATRICS_DOCS)`.

Every original key, label, order and field is preserved. Fields are appended, and a key the note already declares is never added twice. `qa/peds-qa.mjs` re-reads every original field out of `specialtyDocuments.js` and fails if one is missing — after accounting for the app's own retirement rules, which pre-date this work.

### 2.2 WHO ICD-11 MMS coding (`src/lib/pedsIcd11.js`)

- 20 indexed categories across six domains (infectious, haematology, endocrine/nutrition, development/behaviour, neurology, respiratory).
- **Nothing is presented as verified.** Every entry is `mapping_state: review_required`, with release, WHO browser source and coding note recorded.
- Diagnostic status is separate from the code: Confirmed, Suspected, Differential, Ruled out, Historical, Symptom (not a diagnosis).
- Age band, gestational context and severity are recorded beside the code.
- 20 further categories are listed as **unseeded with no code at all** — perinatal conditions, congenital anomalies, bronchiolitis, otitis media, UTI and others must be taken from the WHO browser.
- A `Confirmed` entry without a code raises a prompt; an unspecified code requires justification before it can be saved as confirmed.
- Each note is offered only the domains it can code.

### 2.3 Structured pediatric blocks (`src/lib/pedsNewbornBlocks.js`, `pedsAcuteBlocks.js`, `pedsCareBlocks.js`)

Sixteen blocks, no pre-selected value, blank means not documented:

Newborn assessment · Neonatal jaundice · Growth & nutrition · Nutrition status & malnutrition · IMCI danger signs & triage · Fever in the young infant & child · Respiratory distress & wheeze · Diarrhoea & dehydration · Developmental surveillance · Immunisation status & catch-up · Chronic condition & transition · Adolescent psychosocial & confidentiality · Safeguarding · Family education & safety advice · Procedure & sedation safety · Clinical reasoning & documentation review.

### 2.4 Advisory safety engine (`src/lib/pedsSafetyRules.js`)

30 rules; each states the documented finding, the requirement it fails, and its provenance — **guideline** (with body, title and edition) or **AMedix local decision**, labelled as such. A rule never fires from a blank, never diagnoses and never blocks saving.

Coverage: IMCI danger signs, age-specific fast breathing, hypoxaemia without oxygen (triage and respiratory), severe pneumonia without antibiotics, bronchiolitis treatment without basis, severe dehydration without Plan C, rehydration without reassessment, SAM without treatment, SAM without a glucose check, growth without a reference, growth crossing centiles, newborn temperature/feeding/vitamin K/danger signs, jaundice without bilirubin, bilirubin without a chart, jaundice under 24 hours without action, developmental red flags, positive screens, overdue antigens, adolescent confidentiality, positive mood screen without risk assessment, safeguarding concerns, sedation without weight, procedure without consent, caregiver advice without return criteria, and two coding-integrity prompts.

### 2.5 Guideline basis and documented conflicts (`src/lib/pedsReferences.js`)

34 references with organisation, title, edition, population, what each is applied to, document type and a current-revision flag. Six documented conflicts are registered rather than blended — jaundice charts, young-infant fever, otitis media antibiotics, growth references, allergen introduction and BCG policy — each with the resolution the note must record.

### 2.6 Interface and record

- `PedsBlockField` — the structured block, nothing pre-selected.
- `PedsSafetyPromptsField` — the prompts this note raised, with the action or the documented reason no action was required; the list is stored with the note.
- `PedsGuidanceField` — the note's own guideline basis and the conflicts that apply to it.
- `clinicalFieldValue.js` — blocks, prompts and attribution all reach the saved note and the printed PDF, including explicit "not documented" where fields were left blank.

---

## 3. Verification

`node qa/peds-qa.mjs` proves, against the real modules the Doctor Portal imports:

1. All 18 note types are enhanced append-only with no duplicate keys.
2. No original field was lost (retirement rules accounted for separately).
3. ICD field, safety review and guideline basis all survive the note-section policy.
4. All 16 blocks exist, are fully specified and have unique field keys.
5. The catalogue is honest: no verified code, no ICD-10 shape, release and WHO source on every entry, no code against an unseeded term.
6. Coding is configured for clinician confirmation and unspecified-code justification on every note.
7. Every rule is fully attributed, silent on an empty note, and fires on the documented finding (13 positive/negative scenarios).
8. Formatters carry values and "not documented" states into the printed record.
9. The note form and PDF wire all three sections.

Production build: passes.

---

## 4. Outstanding — requires clinical authority

Technical verification is **not** clinical approval. AMedix does not claim pediatric endorsement.

| Item | Owner |
|---|---|
| Review of all 20 ICD-11 entries in the WHO browser; record `verified` with verifier and date | Pediatric coding lead |
| Choice of bilirubin chart, growth reference and young-infant fever pathway per institution | Head of Pediatrics |
| Sign-off on the six documented conflicts and the resolution each note records | Head of Pediatrics |
| Review of the 30 safety rules, especially the local-decision ones (weight for sedation, return criteria, procedure consent) | Head of Pediatrics |
| Confirmation of current revisions flagged `revision_verified: false` | Pediatric lead |
| Local triage escalation routes and time thresholds | Emergency Medicine + Pediatrics |
| UAT on one note of each of the 18 types | Pediatric consultant |
| Arabic translation of the new blocks and prompts | Clinical translation |

No threshold in this layer is invented: where a source does not publish one, the field records what was documented and the prompt cites the document instead.