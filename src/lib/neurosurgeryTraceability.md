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
| Note catalogue | `src/lib/neurosurgeryDocuments.js` — 10 new note types, registered first in the catalogue. |
| References | `src/lib/neurosurgeryReferences.js` — the guideline sources each note declares. |
| Decision support | `src/lib/neurosurgerySafetyRules.js` — 17 conditional, advisory prompts. |
| Coding | `src/lib/neurosurgeryCoding.js` — per-note ICD-11 coding instructions, diagnosis audit, saved-text formatter. |
| Field renderer | `src/components/doctor/notes/NeurosurgeryGuidanceField.jsx` — renders the guidance block (`nsg_guidance`), wired in `DocumentFields.jsx`. |
| Examination | `neurosurgery` mapped to its examination set in `clinicalExaminations.js` (neurological, general, musculoskeletal, custom). |
| Saved note / PDF | `formatNeurosurgeryGuidance` added to `clinicalFieldValue.js`, so the coding guidance, the prompts raised, the documented action and the "not applicable" reasons all print in the saved note and its PDF. |

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
| `nsg_discharge` | Neurosurgical Discharge Summary | 19 |

**261 structured fields in total.** Every note carries:

- `examinations` — "Select Examination", the structured neurological
  examination (plus general / musculoskeletal where the note needs a trauma
  survey or spinal range and deformity).
- `icd11_diagnoses` — Neurosurgical Diagnoses (ICD-11 MMS), with role,
  diagnostic status, clinical basis and follow-up per diagnosis.
- `nsg_guidance` — the coding guidance and conditional safety prompts for that
  note type.

Neurological status — including the GCS with its three components — is recorded
in the seven notes that document a clinical assessment, and deliberately not in
the two operative notes, which document the procedure instead.

## 3. Decision support — 17 rules

Every prompt is **advisory**. It is never a diagnosis, an order, a score or a
decision, and none of them fire on an empty note or on reassuring findings. A
prompt fires only from a structured value the clinician has actually recorded,
or from a concern they have explicitly selected.

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

## 5. Sources declared on the notes

| Key | Source |
| --- | --- |
| `nice_ng232` | NICE — Head injury: assessment and early management (NG232) |
| `nice_ng59` | NICE — Low back pain and sciatica in over 16s (NG59) |
| `aans_cns` | AANS/CNS evidence-based clinical practice guidelines |
| `icd11` | WHO ICD-11 MMS — diagnosis coding |

Each note declares its base guideline in `guidelineBasis`, and each prompt
shows its organisation and version next to the action field.

**Limitation stated on the note itself:** these are the published sources, and
their edition and currency in the reading clinician's jurisdiction must be
confirmed by the neurosurgical lead. The app does not claim any of them is the
current edition locally.

## 6. Verification performed

An automated suite of **117 checks** was run against the built modules, and all
117 passed:

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

## 7. Open items — not yet done

1. **No live session with an authorized Neurosurgery account.** The notes have
   not been opened, filled and saved end to end in the running app.
2. **Neurosurgical lead sign-off** on the note structure, the 17 prompts and
   their wording. Nothing here is clinically ratified.
3. **No pre-verified ICD-11 subcode set** for neurosurgery — a coding review
   queue is still needed, as it is for the other specialties.
4. **Local thresholds are not ratified.** Where a prompt uses a numeric
   threshold (GCS 8 for the airway prompt), that threshold must be confirmed
   against the local protocol rather than assumed from the guideline.
5. **Arabic translation** of the note labels, section headings, prompts and the
   saved guidance text is outstanding.