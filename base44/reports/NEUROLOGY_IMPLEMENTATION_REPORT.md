# Neurology — Documentation Strengthening Report

**Scope:** the eleven existing Neurology note types, enhanced in place.
**Status:** implementation and technical verification complete. **No clinical approval is claimed.** No neurologist has yet saved and reopened a note in the portal, and the 37 ICD-11 MMS catalogue entries are deliberately marked *review required* — they are checked by a coding reviewer before any of them is treated as verified.

---

## 1. Note types reviewed (append-only)

| Note type key | Label |
|---|---|
| `neuro_consultation` | Neurology Consultation |
| `neuro_followup` | Neurology Follow-Up |
| `neuro_admission_note` | Neurology Admission Note |
| `neuro_progress_note` | Neurology Progress Note |
| `neuro_discharge_summary` | Neurology Discharge Summary |
| `neuro_procedure_note` | Neurologic Procedure Note |
| `neuro_eeg_report` | EEG Report |
| `neuro_emg_ncs_report` | EMG / NCS Report |
| `neuro_stroke_record` | Stroke Assessment / Record |
| `neuro_seizure_followup` | Seizure / Epilepsy Follow-Up |
| `neuro_referral` | Neurology Referral |

No key, label, order or existing field was renamed, removed or reordered. Every original field is still declared and the new content is appended after it, so saved notes, views, reports and PDFs that read a note by key are unaffected. A field key a note already declares is never added a second time.

## 2. What was added

**Coding.** WHO ICD-11 MMS on every note (release 2026-01, Chapter 08), with clinician confirmation, postcoordination, a per-note domain filter, and the detail a code cannot carry recorded beside it — laterality, vascular territory, seizure type and frequency, onset and course. Diagnostic status is recorded separately from the code (confirmed, suspected, differential, symptom — not a diagnosis, sign — not a diagnosis, historical, resolved), so a symptom is never filed as a diagnosis. An unspecified code requires a recorded justification. ICD-10 is never offered or stored.

**History and examination.** The neurological history is structured by onset, tempo, course and laterality instead of one free-text paragraph, and the examination is recorded in the elements a neurologist documents separately: awareness, orientation and language; each cranial nerve group; power per limb on the MRC scale with the pattern of weakness; reflexes, plantar responses and sensory distribution; coordination and gait; and meningeal, spinal and cauda-equina warning signs. Twenty-two structured blocks serve these sections.

**Presentation records.** The hyperacute stroke record, the ILAE seizure and epilepsy classification, the staged status epilepticus pathway, the ICHD-3 headache pattern with the SNNOOP10 flags, the multiple sclerosis course and monitoring record, the neuromuscular record with its respiratory assessment, cognition with its functional consequence, and the raised-pressure and CNS-infection records. Each note type carries the record its indication requires — the EEG and EMG/NCS reports carry their own reporting blocks, the discharge summary the discharge record, the referral the referral record.

**Scores.** Seven guideline scores, computed only from documented values: NIHSS, GCS, mRS, ICH score, CHA2DS2-VASc, HAS-BLED and ABCD2. A score refuses to total when an item is missing, and names the missing item on the printed record instead of showing a partial total.

**Safety review.** Twenty-eight advisory prompts covering stroke time-criticality, imaging before reperfusion, contraindication and anticoagulant review, swallow screening, intracerebral haemorrhage on an anticoagulant, seizure and epilepsy classification and safety advice, the status epilepticus pathway, headache red flags and medication overuse, multiple sclerosis criteria and monitoring, neuromuscular respiratory assessment, airway in reduced consciousness, pupil asymmetry, CNS infection, and EEG/EMG reporting requirements. Each prompt states what was documented, the requirement it fails, and the source of that requirement. A prompt never diagnoses, never orders treatment, never edits a diagnosis, and never blocks saving the note. Every rule is labelled either a guideline requirement or an AMedix local decision — no society is credited with an AMedix threshold.

**Guideline basis.** Each note records the documents it was written against, with edition and what the source does not support, so an exported record keeps its evidence base.

## 3. Reference register

Twenty entries: AAN (multiple sclerosis, polyneuropathy, Bell's palsy, brain death), ILAE (seizure classification, epilepsy classification, definition, status epilepticus, drug-resistant epilepsy), AHA/ASA (acute ischaemic stroke, intracerebral haemorrhage, subarachnoid haemorrhage, secondary prevention, primary prevention), McDonald criteria, ICHD-3, SNNOOP10, the EAN Guillain-Barré guidance, and the AMedix local decisions labelled as such. Each entry carries its edition and a "what it does not say" statement; a citation supports only the statement beside it.

## 4. Defects found and fixed during verification

1. **A score could total from an unrecognised value.** A documented value that matched no option was silently counted as zero, producing a plausible but wrong total — and the safety prompts read from that total. The calculation now withholds the score and names the item as not recognised, so nothing downstream is built on it.
2. **A section filled only with ticked options read as empty.** The safety review tested free-text values only, so a section where the clinician had ticked checkboxes was treated as undocumented and its prompts stayed silent. The review now counts ticked options as documented content.

## 5. Verification

`node qa/neuro-qa.mjs` — **PASS**:

> 11 Neurology note types enhanced, 37 ICD-11 MMS entries (all 37 review required, 0 pre-verified by design), 22 blocks, 7 scores, 28 safety rules verified in both directions, 20 register references.

The suite runs against the real modules the Doctor Portal uses (the app's `@/lib/…` alias is mirrored, not copied), and asserts:

- every note type is enhanced, append-only, with no duplicate field key and no existing key overwritten;
- every original field of every neurology template is still declared, checked against `specialtyDocuments.js`;
- every appended section survives the app's own note-section policy, so no panel is dropped before it reaches the doctor;
- every block and score a note declares actually exists;
- the catalogue is honest: no pre-verified entry, no ICD-10-shaped code, a release and a coding note on every entry, no fabricated code;
- ICD-11 configuration requires clinician confirmation and a justification for an unspecified code;
- every safety prompt fires on the documented finding **and** stays silent without it, and every citation resolves in the register;
- scores refuse to total when an item is missing;
- the note form and the printed record both render the new sections.

The production build (`vite build`) completes with no errors.

## 6. Outstanding before clinical use

- **Coding review.** All 37 ICD-11 MMS entries await review in the coding-review queue. Until then no entry is presented as verified.
- **Clinical sign-off.** The safety thresholds, the score bands and every local decision need the Neurology lead's approval; AMedix labels them as local decisions in the meantime.
- **Clinician UAT.** One note of each type saved and reopened in the portal, then exported to PDF.
- **Arabic.** The new blocks are not yet translated for the Arabic patient-facing view.