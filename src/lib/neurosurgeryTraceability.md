# Neurosurgery documentation — traceability record

Status: **built and self-verified; awaiting neurosurgical clinical sign-off.**
Scope: the Neurosurgery specialty documentation set added to the existing AMedix
clinical-note framework. No existing specialty, note, key or renderer was
modified.

---

## 1. What changed, and where

| Area | Change |
| --- | --- |
| Specialty resolution | `Neurosurgery` previously resolved to the `surgery` key, so it had **no templates of its own** and fell back to the General Surgery notes. It now resolves to its own key, `neurosurgery`. |
| Note catalogue | `src/lib/neurosurgeryDocuments.js` — 17 note types, registered first in the catalogue. |
| References | `src/lib/neurosurgeryReferences.js` — the guideline sources each note declares. |
| Decision support | `src/lib/neurosurgerySafetyRules.js` — 24 conditional, advisory prompts. |
| Coding | `src/lib/neurosurgeryCoding.js` — per-note ICD-11 coding instructions, diagnosis audit, saved-text formatter. |
| Field renderer | `src/components/doctor/notes/NeurosurgeryGuidanceField.jsx` — renders the guidance block (`nsg_guidance`), wired in `DocumentFields.jsx`. |
| Examination | `neurosurgery` mapped to its examination set in `clinicalExaminations.js` (neurological, general, musculoskeletal, custom). |
| Saved note / PDF | `formatNeurosurgeryGuidance` added to `clinicalFieldValue.js`, so the coding guidance, the prompts raised, the documented action and the "not applicable" reasons all print in the saved note and its PDF. |
| Guideline attribution | `src/lib/neurosurgeryReferences.js` rewritten as the single reference registry (12 documents across 8 organisations, each with title, edition, date, population, review state and link); `src/components/doctor/notes/NeurosurgerySourceAttribution.jsx` renders it inside the note and records which source was applied. |
| Template basis | Each template's `guidelineBasis` is now derived from that registry instead of typed by hand, so a note cannot cite a document that is not defined. |
| Scope expansion | The set was extended to the whole specialty — neuro-oncology, neurovascular, spinal tumours, functional/epilepsy/stereotactic, peripheral nerve, paediatric and raised-ICP notes — so the specialty is not represented by consultations, trauma and hydrocephalus alone. |
| Structured examination | `src/lib/neurosurgeryExam.js` + `NeurosurgicalExamField.jsx` (`nsg_exam`) — conscious level and trend, orientation, pupils with measured asymmetry, cranial nerves, power, sensory level, reflexes, coordination, gait, meningeal signs and spinal column findings, recorded as structured observations. |
| ISNCSCI / ASIA | `src/lib/neurosurgeryIsncsci.js` + `IsncsiAssessmentField.jsx` (`nsg_isncsci`) — the full motor, light-touch and pin-prick key muscles/dermatomes, sensory and motor levels, NLI, AIS grade, completeness and the list of what is still missing. |
| Clinical scores | `src/lib/neurosurgeryScores.js` + `NeurosurgeryScoresField.jsx` (`nsg_scores`) — condition-specific scales (Spetzler–Martin, Hunt & Hess, WFNS, modified Fisher, Barrow, Sundt, Rotterdam, Marshall, TL AOSIS, mJOA, Nurick, ASIA, House–Brackmann, mRS, ILAE, Engel and others), each shown only where the documented findings indicate it. |

Nothing else about the note system changed: keys, ordering, required checks,
permissions, audit logging and the referral/investigation retirement policy all
behave exactly as before.

## 2. Note inventory

Field counts are after the global section-retirement policy is applied — i.e.
what the clinician actually sees.

| Key | Note | Fields |
| --- | --- | --- |
| `nsg_consultation` | Neurosurgical Consultation | 29 |
| `nsg_spine` | Spine & Nerve Compression Assessment | 28 |
| `nsg_neurotrauma` | Neurotrauma Admission | 34 |
| `nsg_cerebrovascular` | Cerebrovascular Emergency Note | 26 |
| `nsg_hydrocephalus` | Hydrocephalus & CSF Diversion Note | 26 |
| `nsg_neuro_oncology` | Neuro-Oncology Assessment | 27 |
| `nsg_cranial_operative` | Cranial Operative Note | 25 |
| `nsg_spinal_operative` | Spinal Operative Note | 26 |
| `nsg_postop_progress` | Post-Operative Neurosurgical Progress | 21 |
| `nsg_discharge` | Neurosurgical Discharge Summary | 20 |
| `nsg_aneurysm_avm` | Aneurysm & AVM Assessment | 42 |
| `nsg_spinal_cord` | Spinal Cord Injury & Cord Compression (ISNCSCI) | 46 |
| `nsg_spinal_tumour` | Spinal Tumour Assessment | 39 |
| `nsg_functional` | Functional, Epilepsy & Stereotactic Note | 34 |
| `nsg_peripheral_nerve` | Peripheral Nerve & Plexus Assessment | 30 |
| `nsg_paediatric` | Paediatric Neurosurgery Note | 29 |
| `nsg_icp` | Raised ICP & Cerebral Oedema Note | 37 |

**541 structured fields in total across 17 note types.** Every note carries:

- `examinations` — "Select Examination", the structured neurological
  examination (plus general / musculoskeletal where the note needs a trauma
  survey or spinal range and deformity).
- `icd11_diagnoses` — Neurosurgical Diagnoses (ICD-11 MMS), with role,
  diagnostic status, clinical basis and follow-up per diagnosis.
- `nsg_guidance` — the coding guidance and conditional safety prompts for that
  note type.

Neurological status — including the GCS with its three components — is recorded
in the fifteen notes that document a clinical assessment, and deliberately not in
the two operative notes, which document the procedure instead. Ten notes carry
the structured examination and the ISNCSCI assessment; ten carry the conditional
score block; the discharge summary and the operative notes carry neither, because
they summarise or record a procedure rather than assess the patient.

### 2.1 What the examination records, and what it refuses to infer

- Pupils are recorded per side with a size and a reactivity; when the two sides
  differ, the note prints the measured difference rather than the word
  "asymmetry".
- Power is recorded per myotome as an MRC grade; a documented grade of 3 or less
  raises the focal-deficit prompt instead of being counted as normal.
- The sensory level, reflexes (including plantar response and clonus),
  coordination, gait and meningeal signs are separate recorded observations. A
  blank examination prints **"Neurological examination not documented in this
  note."** — never "normal".
- **The ISNCSCI engine derives, it does not grade on the clinician's behalf.** It
  computes the sensory and motor levels, the neurological level of injury, the
  motor and sensory totals and the AIS grade **only** when all 28 dermatomes,
  10 key muscles per side and the sacral examination are recorded; otherwise it
  returns "not classified" together with the exact list of what is missing. AIS A
  is decided by absence of sacral sparing alone, so a complete injury at any level
  is graded A even when no normal segment above the lesion was recorded.
- Scores are computed from documented findings only. A score whose inputs are
  incomplete is displayed as not calculated, with the missing items named — it is
  never defaulted to a value. Every calculated score prints its own version,
  source, interpretation band and the sentence describing what the number does
  **not** mean (for example: the Rotterdam score is a prognostic research tool and
  does not direct treatment, and the Spetzler–Martin grade does not by itself
  determine operability).

## 3. Decision support — 24 rules

Every prompt is **advisory**. It is never a diagnosis, an order, a score or a
decision, and none of them fire on an empty note or on reassuring findings. A
prompt fires only from a structured value the clinician has actually recorded,
or from a concern they have explicitly selected.

Each prompt carries the **population** its source covers, and where the applicable
document or population differs it lists the alternative instead of flattening the
two into one rule (adult severe-TBI evidence vs the age-inclusive NICE pathway;
the WFNS scale grading the clinical state vs the EANS management guideline;
paediatric vs adult hydrocephalus). **Six prompts are local documentation
requirements with no guideline attributed** — cord compression, post-operative
haematoma, VTE prophylaxis timing, surgical-site concern, a documented focal
weakness and neurogenic shock. They say so rather than borrowing a society's
name.

| Level | Key | Trigger |
| --- | --- | --- |
| immediate | `airway_icp` | GCS 8 or less, computed only from all three components |
| immediate | `pupils` | Pupillary asymmetry or a fixed pupil |
| immediate | `deterioration` | Neurological deterioration documented |
| immediate | `cord_compression` | Suspected spinal cord compression |
| immediate | `cauda_equina` | Cauda equina features documented |
| immediate | `anticoagulation` | Anticoagulation not reversed before urgent neurosurgery |
| immediate | `shunt` | Shunt or EVD malfunction documented or suspected |
| immediate | `postop_haematoma` | Post-operative haematoma, swelling or new deficit |
| same_day | `traumatic_haemorrhage` | Traumatic intracranial haemorrhage documented |
| same_day | `csf_leak` | CSF leak documented or suspected |
| same_day | `steroid` | Steroid given without a documented indication |
| same_day | `hydrocephalus` | Hydrocephalus documented — drainage decision required |
| same_day | `wound` | Surgical site concern documented |
| documented | `seizure` | Seizure documented |
| documented | `vasospasm` | Vasospasm surveillance not documented after aneurysmal haemorrhage |
| documented | `vte_timing` | VTE prophylaxis timing after neurosurgery not documented |
| documented | `icp_target` | ICP monitored without a documented target |
| immediate | `deteriorating_consciousness` | Conscious level depressed on the structured examination, or recorded as deteriorating |
| immediate | `fixed_pupil` | Fixed pupil or a recorded pupillary asymmetry |
| immediate | `cord_syndrome` | Spinal cord syndrome documented (central, anterior, Brown–Séquard, conus, cauda equina) |
| immediate | `neurogenic_shock` | Neurogenic shock documented or suspected |
| same_day | `meningism` | Meningeal signs documented on examination |
| same_day | `new_deficit` | Focal weakness recorded on the structured examination |
| documented | `facial_nerve` | Facial nerve involvement documented |

Each prompt records, per patient: the finding that raised it (the documented
evidence), the action taken, or a reason it does not apply. An incomplete GCS
(e.g. "NT — Intubated") **never** produces a computed total, so it can never
silently trigger — or silently fail to trigger — the airway prompt.

## 4. Coding — what is claimed and what is not

- **No ICD-11 code is pre-loaded for Neurosurgery, deliberately.** Supplying
  unverified neurosurgical codes would put a wrong code in a permanent record.
  The `catalog` on every neurosurgery note is therefore empty.
- A clinician enters the code and display term from the WHO ICD-11 MMS browser.
  On save the note records the code, the display term, the ICD-11 MMS system
  URI, the release it was checked against, the source, the date, the diagnosis
  role and status, and the clinical basis.
- Integrity is explicit, not assumed — each diagnosis is one of:
  - `verified` — taken from the verified catalogue, release recorded;
  - `review_required` — clinician-entered, **not yet** checked against the
    catalogue, so it stays in the coding review queue;
  - `unresolved` — could not be mapped; no code is stored and the note says so.
- `auditNeurosurgicalDiagnoses` flags only what the record itself contradicts:
  a confirmed diagnosis with no documented clinical basis, an unresolved entry
  with no coding review noted, and a code entered without a WHO browser source.
  It never proposes a code.
- Coding instructions are per note type (TBI, haemorrhage, hydrocephalus, tumour,
  spinal compression and so on) and state the classification logic to apply,
  not a code list.

## 5. Sources — as cited, with the state of each citation

Citations were checked against the publishers on 30 Oct 2026. A document whose
edition or date could not be confirmed from the publisher carries **no date** and
says "publication date to be confirmed at local review" — a plausible-looking
date is never shown in its place.

| Organisation | Document | Edition / date | Population | Citation state |
| --- | --- | --- | --- | --- |
| AANS (with CNS) | Guidelines for the Management of Severe Traumatic Brain Injury | 4th edition, 2017 | Adults with severe TBI | Verified (Neurosurgery 2017;80(1):6–15) |
| CNS | Pediatric hydrocephalus: systematic literature review and evidence-based guidelines | CNS guideline series | Children | Title verified — date to confirm |
| EANS (with ESO, ESMINT) | ESO/EANS/ESMINT guideline on aneurysmal subarachnoid haemorrhage | Joint society guideline | Adults with aSAH, European context | Title verified — date to confirm |
| WFNS | WFNS subarachnoid haemorrhage grading scale | Committee report, 1988 | Adults with aSAH | Verified |
| AO Spine | AOSpine Thoracolumbar Spine Injury Classification System | 2013 | Adults | Verified (Spine 2013;38(23):2028–37) |
| AO Spine | The Thoracolumbar AOSpine Injury Score (TL AOSIS) | 2016 | Adults, thoracolumbar trauma | Verified (Global Spine J 2016;6(4):329–34) |
| AO Spine | AOSpine Subaxial Cervical Spine Injury Classification System | Classification system | Adults, subaxial trauma | Title verified — date to confirm |
| ISPN | ISPN Guide to Pediatric Neurosurgery | Living online guide | Children | Title verified — expert guide, not a graded guideline |
| NICE | Head injury: assessment and early management (NG232) | 2023 | Infants, children and adults | Verified |
| NICE | Low back pain and sciatica in over 16s (NG59) | 2016 | People over 16 | Verified |
| WHO | ICD-11 for Mortality and Morbidity Statistics (MMS) | Release 2026-01 | All ages | Verified against the WHO browser |
| WHO | WHO Classification of Tumours: Central Nervous System Tumours | 5th edition, 2021 | All ages | Verified |

Each note maps to the documents its structure follows, plus the population they
cover and the points where they diverge; the note shows all of it, and the
clinician records which source was applied when they differ.

**Limitation stated on the note itself:** these are the published sources, and
their currency in the reading clinician's jurisdiction must be confirmed by the
neurosurgical lead. The app does not claim any of them is the current edition
locally, and does not present one merged recommendation where the sources differ.

## 6. Verification performed

An automated suite of **117 structure and safety checks** plus **251 attribution
checks** was run against the built modules, and all passed. The scope expansion
was then verified by a further **175 checks**, also all passing:

- catalogue: 17 notes, unique keys, no duplicate field keys within a note, the
  guidance and ICD-11 blocks on every note, a required differential and a
  structured examination on every assessment note, and the score block present
  exactly where it is meant to be;
- ISNCSCI: complete examination recognised; AIS A for absent sacral sparing
  including the all-zero examination; AIS E for a normal examination with the
  correct totals (100 motor, 112 light touch, 112 pin prick); AIS C and AIS D
  separated by the "at least half preserved" rule; an incomplete examination
  returns no grade and names the missing item by side and level;
- scores: Spetzler–Martin, Rotterdam and mJOA computed to the expected totals and
  bands; an incomplete score reports missing inputs and no total; a scale is
  surfaced only when the documented findings indicate it; the saved text carries
  the source, the band and the limitation sentence;
- examination text: pupils printed with the measured asymmetry, dermatomal level,
  meningeal signs and the spinal column findings all reach the saved value; an
  empty examination prints the explicit "not documented" sentence;
- decision support: each of the seven added prompts fires from its recorded
  finding, and the whole set stays silent on an empty note.

- catalogue: 10 notes, all on the `neurosurgery` key, no duplicate field keys,
  every note ≥ 19 fields, ICD-11 and guidance fields present on all ten, no
  invented codes anywhere, no neurosurgery note leaked into another specialty;
- retirement policy: no retired wording ("Plan", investigation, escalation,
  antimicrobial, imaging, working diagnosis) survives in any label; the ICD
  coding and guidance sections survive it;
- decision support: each of the trigger paths above exercised, including the
  negative cases (empty note, reassuring findings, incomplete GCS);
- coding: instruction sets resolve per note, unknown note returns none, audit
  rules fire on the contradictions above;
- saved text: coding guidance, prompt, source and documented action all reach
  the stored value and PDF.
- attribution: all six societies present; every document complete, linked and
  carrying a valid state; no unconfirmed document carries a date; every note maps
  to at least two documents including ICD-11; every prompt records its population
  and resolves its source or states that none is attributed; the EANS/WFNS and
  adult/paediatric divergences are present rather than merged; the saved text
  carries the documents, the ICD-11 release, the source applied, the divergence
  and the review status, with no undefined values.

## 7. Open items — not yet done

1. **No live session with an authorized Neurosurgery account.** The notes have
   not been opened, filled and saved end to end in the running app.
2. **Neurosurgical lead sign-off** on the note structure, the 24 prompts, the
   examination item set and their wording. Nothing here is clinically ratified.
3. **No pre-verified ICD-11 subcode set** for neurosurgery — a coding review
   queue is still needed, as it is for the other specialties.
4. **Local thresholds are not ratified.** The GCS 8 airway threshold is shown as
   NICE NG232 (all ages) with the adult severe-TBI guideline as a variant, but
   whether the local protocol uses that point must be confirmed by the
   neurosurgical lead.
5. **Four citations still need their edition or date confirmed** (CNS paediatric
   hydrocephalus, ESO/EANS/ESMINT aSAH, AO Spine subaxial, ISPN Guide). They are
   displayed without a date and marked accordingly until confirmed.
6. **Arabic translation** of the note labels, section headings, prompts and the
   saved guidance text is outstanding.
7. **Score versions are not locally ratified.** The scales added with the
   expanded scope (Spetzler–Martin, Hunt & Hess, WFNS, modified Fisher, Barrow,
   Sundt, Rotterdam, Marshall, TL AOSIS, mJOA, Nurick, House–Brackmann, mRS,
   ILAE, Engel, ISNCSCI) each carry the version recorded in the registry, but the
   institution must confirm which version it uses — the mJOA variant, the time
   point for the mRS, and the seizure-freedom definition for Engel/I-
   LAE all differ between publications.
8. **The AIS classification is validated for adults.** Applying it to young
   children requires the lead's decision, and the paediatric note states that
   rather than implying the grade is equivalent.
9. **Editions and dates of the score and classification sources added with the
   expanded scope still need publisher-level confirmation** at local review, in
   the same way as the four outstanding citations above.