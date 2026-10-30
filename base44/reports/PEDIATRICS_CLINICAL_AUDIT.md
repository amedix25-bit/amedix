# Pediatrics — Clinical Documentation Audit

**Specialty:** Paediatrics
**Reviewed:** 30 October 2026
**Scope:** the eighteen pediatric note types that already exist in AMedix
**Status:** technical verification complete — **awaiting specialist sign-off** (section 8)

---

## 1. What was audited, and how

The audit asked one question of every note type: *if a clinician documents a child in this
note, does the note record enough for the next clinician — and does the app notice, from
what was actually written, when it does not?*

Three things were checked for each of the eighteen notes:

| Check | What it means |
| --- | --- |
| **Structure** | The note carries four clinical sections of its own — history & context, measurements & examination, assessment & differentials, management & follow-up — and every field is labelled, uniquely keyed and correctly typed. |
| **Append-only integrity** | Nothing already in the note type was removed or reordered. The sections are appended; existing fields, coding and signature behaviour are untouched. |
| **Safety behaviour** | Given a documented scenario, the review panel raises exactly the findings that scenario records, and a complete note raises none. |

Method: the checks run against the real modules the Doctor Portal uses, not a copy.
`node qa/peds-note-qa.mjs` verifies structure and behaviour; `node qa/peds-qa.mjs`
re-verifies append-only integrity, the ICD-11 catalogue and the reference register.

---

## 2. The eighteen note types

Field counts are `history / examination / assessment / management`. Sources are the
documents the note records as its basis.

| Note type | Clinical purpose | Fields | Sources recorded |
| --- | --- | --- | --- |
| Consultation | A first assessment of a new problem: the story, the measurements, the examination, the differential and the decision. | 34/35/12/26 | WHO IMCI · AAP Bright Futures · WHO growth standards · WHO pneumonia · WHO diarrhoea |
| Follow-up | A review of a known problem: what changed, whether treatment worked, what happens next. | 24/35/13/26 | AAP Bright Futures · WHO growth standards · local |
| Well-child visit | Health supervision: growth plotted, development watched, preventive care given, family counselled. | 27/26/7/15 | AAP Bright Futures · WHO growth standards · AAP developmental screening · AAP SIDS · WHO immunisation |
| Admission note | Why inpatient care is needed, baseline measurements, immediate orders, the monitoring set. | 31/35/12/28 | WHO IMCI · WHO pneumonia · WHO diarrhoea · WHO malnutrition · PALISI/SCCM sepsis |
| Daily progress | The ward round: the last 24 hours, the child now, what changes today. | 22/35/8/20 | WHO IMCI · WHO oxygen therapy · local |
| Discharge summary | The course, condition at discharge, medicines to take home, follow-up, warning signs. | 22/23/7/29 | AAP Bright Futures · AAP SIDS · WHO IMCI · local |
| Procedure note | Indication, sedation and comfort plan, what was done, after-care. | 16/20/8/27 | local |
| Chronic follow-up | Control, adherence, complications, growth, school, and the plan for the interval. | 26/24/13/26 | AAP Bright Futures · WHO growth standards · local |
| Growth & development | Growth as the clinical question: measurements on a named reference, developmental domains, the action a faltering line requires. | 21/26/12/27 | WHO growth standards · WHO 5–19 reference · AAP developmental screening · WHO malnutrition |
| Immunisation record | What was given, how, what reaction occurred, when the next dose is due. | 17/13/7/16 | WHO immunisation · AAP Bright Futures · local |
| Screening record | Which screen, which instrument, what it showed, the action required. | 16/11/10/14 | AAP developmental screening · AAP autism · local |
| Anticipatory guidance | Guidance for the age and stage, how the family understood it, what to do if things change. | 22/11/7/15 | AAP Bright Futures · WHO nurturing care · AAP SIDS · WHO breastfeeding |
| Newborn record | How the baby was born, how the baby is now, feeding, thermal care, prophylaxis, danger signs screened. | 25/30/13/22 | WHO newborn · WHO preterm · AAP vitamin K · AAP hyperbilirubinaemia |
| Birth history | The pregnancy, delivery, resuscitation and first days, recorded once and read by every clinician afterwards. | 26/18/8/6 | WHO newborn · WHO preterm · local |
| Neonatal progress | Feeds and weight, temperature, breathing and apnoea, bilirubin, and today's changes. | 14/30/12/19 | WHO newborn · WHO preterm · AAP hyperbilirubinaemia · local |
| Newborn discharge | The course, feeding and weight at discharge, screening done, the safety net for the first weeks. | 26/30/7/28 | WHO newborn · AAP hyperbilirubinaemia · AAP SIDS · AAP vitamin K |
| Adolescent health | Growth and puberty, mental health and risk, confidentiality, preventive care for the age. | 28/25/12/28 | AAP adolescent confidentiality · AAP GLAD-PC · WHO adolescent health |
| Confidential adolescent note | What the adolescent shared alone, the risk assessment, and the limits of confidentiality explained first. | 20/12/9/15 | AAP adolescent confidentiality · AAP GLAD-PC · WHO adolescent health |

The notes are conditional on their own clinical purpose, not one oversized form: the
newborn record never asks about school, the well-child visit never asks about a delivery,
and the confidential adolescent note never asks a parent-reported feeding history.

---

## 3. History — what is now recorded, and where it differs by note

- **Ages are computed, never typed twice.** Date of birth, assessment date, gestational
  age at birth and the corrected age for preterm infants are derived once and displayed as
  a computed value, with the 24-month correction convention stated where it is used.
- **Newborn and preterm history** is confined to the newborn, birth-history, neonatal and
  newborn-discharge notes: delivery setting, gestation, birth weight and weight category,
  resuscitation, feeding initiation, jaundice onset.
- **Acute history** (red-flag history, feeding and wet nappies, symptom duration) sits in
  the acute notes; **nutrition and growth history** in the growth, well-child and chronic
  notes; **family and social history** in every note that makes a safeguarding judgement.
- **A safeguarding screen is a recorded state**, not an inference: *screened, no concern*,
  *concern identified — see safeguarding record*, or *not recorded*. A blank is never read
  as "no concern".
- **Medication and allergy history** is recorded per note so the prescribing decision and
  the allergy state sit in the same place.

---

## 4. Examination — measurements, vitals and systems

- **Measurements** (weight, length/height, head circumference, BMI where age-appropriate)
  are recorded with **the reference they were plotted on** — WHO 0–5 standards or the WHO
  5–19 reference — as a required companion field, not an assumption.
- **Vital signs** carry an explicit **age band**, because every paediatric threshold is
  age-dependent: temperature, respiratory rate, heart rate, oxygen saturation, capillary
  refill time and level of consciousness. The age band drives the fast-breathing
  thresholds the review panel uses.
- **System examination** is by body system with the findings that change management
  (work of breathing, perfusion, hydration, neurological state, skin) and a
  *not documented* option that is preserved as such.
- **Growth and development** sections record the developmental domains screened, the
  instrument used, and the result as a state — never "normal" by default.

---

## 5. Assessment and safety engine

Assessment records the differential considerations, the leading diagnosis with its
reasoning, a clinician-assigned severity, and the red flags documented. The severity scale
is explicit, including **"Not classified"**, so an unclassified note is visible as
unclassified rather than silently mild.

**45 advisory prompts** compare what the note recorded against the requirement of the cited
document: **23 critical · 21 warning · 1 advisory**. Of these, 30 are stated in a cited
guideline document and 15 are AMedix or institutional decisions labelled as local. No
prompt blocks saving, changes a diagnosis, orders treatment or writes into the note.

Prompts added or extended in this audit, one family per clinical question:

| Area | Prompts |
| --- | --- |
| Weight-based dosing | Dose recorded with no weight · calculated dose above the recorded maximum · mg/kg dose with no maximum stated · medicine recorded with the allergy check outstanding |
| Time-critical findings | Fever under 2 months without an evaluation · apnoea without a monitoring plan · cyanosis without a saturation · poor perfusion without an action or disposition · seizure without any management · reduced conscious level without escalation · anaphylaxis in the differential without adrenaline |
| Safeguarding | Concern screened positive with no safeguarding record written |
| Growth and gestation | Preterm note with no corrected age · measurement with no growth reference applied |
| Assessment hygiene | Red flag documented without a severity classification |

Each prompt names what is documented, the requirement it fails and its source; a prompt
appears only when the underlying value was documented. Blank fields are never treated as
normal, and a prompt is never a statement that the condition is present.

---

## 6. WHO ICD-11 MMS coding

- Every pediatric note requires a coded diagnosis field using **ICD-11 MMS only**, with
  the release recorded and the catalogue source carried with the code.
- A code is **never generated, completed or substituted** by the app. Where a term has no
  confirmed stem code it stays unseeded and the clinician is told what to do instead.
- **"Unspecified" needs a justification** before the note can be finalised.
- A coded diagnosis must be **confirmed by the clinician**; a code alone never confirms a
  diagnosis.
- Catalogue entries are recorded with `mapping_state` reflecting reality — none is
  presented as verified against the WHO browser until a clinician confirms it. The panel
  reports "code awaiting review" rather than implying verification.

---

## 7. Traceability

Every source a note relies on is recorded with the note, in the attribution text that
travels with it and in the reference register:

- issuing body, **exact title**, edition, **publication or update date**, population, the
  requirement the note takes from it, publisher link, and whether the edition was
  confirmed as current;
- **34 sources** in the register · **26 with a confirmed publication date** · **8 awaiting
  date confirmation** (recorded as "publication date not verified", never inferred) ·
  **0 confirmed as the current revision**;
- the register is reviewed as a whole and stamped with its review date
  (30 October 2026);
- where two bodies publish guidance that cannot both be applied to the same child, the
  difference is recorded as a conflict with a documented resolution, not merged into one
  instruction.

---

## 8. Verification evidence

| Suite | Asserts | Result |
| --- | --- | --- |
| `qa/peds-note-qa.mjs` | 18 notes × 4 sections; blocks registered; fields labelled, uniquely keyed, correctly typed; medication sections always ask for weight and allergy check; 13 documented clinical scenarios raise the expected prompts and a fully documented note raises none; every prompt and note basis resolves to a register row; attribution carries a publication date | **passed** |
| `qa/peds-qa.mjs` | append-only integrity against the original templates (no original field lost); coding, safety and guidance records survive the section policy; ICD-11 catalogue honesty; 45 prompts fire on their documented finding and are silent on an empty note; reference register completeness | **passed** — 18 notes, 88 blocks, 20 ICD-11 entries, 45 prompts, 34 references |

Scenarios covered: well-child visit (clean); young infant with fever, unevaluated and
evaluated; preterm infant, corrected age missing and recorded; respiratory emergency with
and without oxygen and disposition; neonatal apnoea monitored and unmonitored; seizure
untreated and treated; reduced conscious level; anaphylaxis with and without adrenaline;
dosing without weight, without maximum, above maximum, allergy unchecked; safeguarding
concern with no record; red flag with no severity.

---

## 9. Limitations — stated, not hidden

1. **No clinical sign-off yet.** Everything above is technical and documentary
   verification. The department standard is not set by this report.
2. **Guideline revisions unconfirmed.** The register records the edition and publication
   date, and states plainly that the current revision must be confirmed on the publisher's
   page. No document is presented as current.
3. **ICD-11 entries are not browser-verified.** Each entry carries its source and release;
   confirmation against the WHO browser is a clinician step, and the coding-review queue
   for entries still awaiting review does not exist yet.
4. **WHO inclusion/exclusion wording is not transcribed**, because publisher text is not
   reproduced in the app.
5. **Arabic translation of the new pediatric sections is outstanding**; the notes are
   English-only at present.
6. **Local thresholds need a named owner.** The 15 local prompts are institutional
   decisions that require a departmental owner and a review date in their own right.
7. **No end-to-end walkthrough on a live patient account** has been performed for the
   eighteen notes.

---

## 10. Sign-off

| Field | Value |
| --- | --- |
| Specialty reviewer | ______________________ |
| Capacity | Consultant Paediatrician / Head of Paediatrics |
| Registration | ______________________ |
| Decision | ☐ Approved  ☐ Approved with comments  ☐ Changes requested |
| Comments | |
| Date | |

Until this block is completed by a registered clinician, the pediatric notes remain
**technically verified, not department-approved**.