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

**History and examination.** The neurological history is structured by onset, tempo, course and laterality instead of one free-text paragraph, and the examination is recorded in the elements a neurologist documents separately: awareness, orientation and language; each cranial nerve group; power per limb on the MRC scale with the pattern of weakness; reflexes, plantar responses and sensory distribution; coordination and gait; and meningeal, spinal and cauda-equina warning signs. Twenty-six structured blocks serve these sections.

**Presentation records.** The hyperacute stroke record, the ILAE seizure and epilepsy classification, the staged status epilepticus pathway, the ICHD-3 headache pattern with the SNNOOP10 flags, the multiple sclerosis course and monitoring record, the neuromuscular record with its respiratory assessment, cognition with its functional consequence, and the raised-pressure and CNS-infection records. Each note type carries the record its indication requires — the EEG and EMG/NCS reports carry their own reporting blocks, the discharge summary the discharge record, the referral the referral record.

**Scores.** Seven guideline scores, computed only from documented values: NIHSS, GCS, mRS, ICH score, CHA2DS2-VASc, HAS-BLED and ABCD2. A score refuses to total when an item is missing, and names the missing item on the printed record instead of showing a partial total.

**Safety review.** Thirty-three advisory prompts covering stroke time-criticality, imaging before reperfusion, contraindication and anticoagulant review, swallow screening, intracerebral haemorrhage on an anticoagulant, seizure and epilepsy classification and safety advice, the status epilepticus pathway, headache red flags and medication overuse, multiple sclerosis criteria and monitoring, neuromuscular respiratory assessment, airway in reduced consciousness, pupil asymmetry, CNS infection, and EEG/EMG reporting requirements. Each prompt states what was documented, the requirement it fails, and the source of that requirement. A prompt never diagnoses, never orders treatment, never edits a diagnosis, and never blocks saving the note. Every rule is labelled either a guideline requirement or an AMedix local decision — no society is credited with an AMedix threshold.

**Condition-specific records.** Three presentations that were previously written as a sentence now have their own record, appended to the notes where they occur: movement disorders (pattern, symmetry, tremor character, rigidity, bradykinesia demonstration, postural stability, gait, non-motor features, treatment already tried and its effect), peripheral neuropathy (distribution, modalities, pain features, reflexes, autonomic features, aetiological screen, study result, foot and falls advice) and dizziness (symptom type and timing, triggers, associated symptoms, head impulse, nystagmus, skew, positional testing, gait, orthostatic blood pressure and the reasoning recorded for the impression).

**Reasoning, management and follow-up.** One record in every note carries what the note previously left implicit: the differentials considered with what argued against each, the reasoning for the recorded assessment, what remains uncertain, the tests ordered and their results as reviewed, the management recorded by the clinician, the monitoring plan, the counselling given, the advice about when to seek urgent help, the follow-up interval and with whom, and whether the patient was involved in the decision.

**Emergency recognition and urgent pathway.** One record in every note covers the fifteen emergencies in the request: acute ischaemic stroke, intracranial haemorrhage, suspected subarachnoid haemorrhage, transient ischaemic attack, status epilepticus, prolonged or recurrent seizures without recovery, acute altered consciousness, meningitis, encephalitis, raised intracranial pressure, impending brain herniation, acute spinal cord compression, cauda equina syndrome, Guillain-Barré syndrome with respiratory or autonomic compromise, and myasthenic crisis. Each carries its urgency level, **the clinical reason it is urgent**, the findings that raise it, its own time-critical statement, the institutional pathway it directs to, the documentation it requires, and a timestamped pathway record — who was informed, when, the route used, the destination, the unit's capability, the decision recorded and its authoriser. Sixteen red flags can be screened, and each one names the presentation it points to. The panel states in the note itself that it does not diagnose, does not order treatment and does not authorise thrombolysis, thrombectomy or any other intervention, and that documentation is written after the clinical action and may never delay it. A record that names an emergency without a recorded call is reported as owing that call — it never blocks saving the note.

**Stroke and status epilepticus, completed.** Two stroke facts were missing and are now recorded: the time symptoms were discovered, kept distinct from the time last known well, and whether the NIHSS was appropriate to perform, with the reason when it was not. Status epilepticus gains breathing and oxygenation, circulation and access, and the documented response to treatment beside the existing airway, glucose, temperature and staged medicine times.

**Guideline basis.** Each note records the documents it was written against, with edition and what the source does not support, so an exported record keeps its evidence base.

## 3. Reference register

Twenty entries: AAN (multiple sclerosis, polyneuropathy, Bell's palsy, brain death), ILAE (seizure classification, epilepsy classification, definition, status epilepticus, drug-resistant epilepsy), AHA/ASA (acute ischaemic stroke, intracerebral haemorrhage, subarachnoid haemorrhage, secondary prevention, primary prevention), McDonald criteria, ICHD-3, SNNOOP10, the EAN Guillain-Barré guidance, and the AMedix local decisions labelled as such. Each entry carries its edition and a "what it does not say" statement; a citation supports only the statement beside it.

## 4. Defects found and fixed during verification

1. **A score could total from an unrecognised value.** A documented value that matched no option was silently counted as zero, producing a plausible but wrong total — and the safety prompts read from that total. The calculation now withholds the score and names the item as not recognised, so nothing downstream is built on it.
2. **A section filled only with ticked options read as empty.** The safety review tested free-text values only, so a section where the clinician had ticked checkboxes was treated as undocumented and its prompts stayed silent. The review now counts ticked options as documented content.

## 5. Verification

`node qa/neuro-qa.mjs` — **PASS**:

> 11 Neurology note types enhanced, 37 ICD-11 MMS entries (all 37 review required, 0 pre-verified by design), 26 blocks, 7 scores, 33 safety rules verified in both directions, 15 emergency presentations verified in both directions, 20 register references.

The suite runs against the real modules the Doctor Portal uses (the app's `@/lib/…` alias is mirrored, not copied), and asserts:

- every note type is enhanced, append-only, with no duplicate field key and no existing key overwritten;
- every original field of every neurology template is still declared, checked against `specialtyDocuments.js`;
- every appended section survives the app's own note-section policy, so no panel is dropped before it reaches the doctor;
- every block and score a note declares actually exists;
- the catalogue is honest: no pre-verified entry, no ICD-10-shaped code, a release and a coding note on every entry, no fabricated code;
- ICD-11 configuration requires clinician confirmation and a justification for an unspecified code;
- every safety prompt fires on the documented finding **and** stays silent without it, and every citation resolves in the register;
- scores refuse to total when an item is missing;
- every one of the fifteen emergencies carries an urgency level, a reason, a time-critical statement, a pathway, recognition findings, required documentation that actually exists as a field, and a source that resolves in the register; no emergency field is phrased as an order;
- the notice in the panel states that it does not diagnose, does not order treatment, does not authorise intervention and may not delay it;
- an emergency with no recorded call, a red flag with nothing done about it, a herniation sign with no call time and a neuromuscular emergency with no respiratory measurement each raise their prompt, and each stays silent when the record is complete;
- the printed emergency record prints NOT DOCUMENTED for a required missing field and lists what the record still owes;
- the note form and the printed record both render the new sections.

The production build (`vite build`) completes with no errors.

## 6. Outstanding before clinical use

- **Coding review.** All 37 ICD-11 MMS entries await review in the coding-review queue. Until then no entry is presented as verified.
- **Clinical sign-off.** The safety thresholds, the score bands, the emergency pathways and every local decision need the Neurology lead's approval; AMedix labels them as local decisions in the meantime. The emergency pathways in particular name no local telephone number or team — the institution's own route must be confirmed and recorded.
- **Emergency drill.** One simulated acute stroke, one status epilepticus and one cauda equina record should be walked through with the department, to confirm the panel is completed after the clinical action rather than instead of it.
- **Clinician UAT.** One note of each type saved and reopened in the portal, then exported to PDF.
- **Arabic.** The new blocks are not yet translated for the Arabic patient-facing view.