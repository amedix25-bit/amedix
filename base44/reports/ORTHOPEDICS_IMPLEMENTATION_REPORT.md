# Orthopedics & Traumatology — Documentation Strengthening Report

**Scope:** the eleven existing Orthopedics & Traumatology note types, enhanced in place.
**Status:** implementation and technical verification complete. **No clinical approval is claimed** — every threshold and local rule below requires the Orthopedics lead's sign-off, and no note type has yet been saved and reopened by a clinician in the portal.

---

## 1. Note types reviewed (append-only)

| Note type key | Label |
|---|---|
| `ortho_consultation` | Orthopedic Consultation |
| `ortho_followup` | Orthopedic Follow-Up |
| `ortho_fracture_assessment` | Fracture Assessment |
| `ortho_injury_assessment` | Injury Assessment |
| `ortho_preop_assessment` | Pre-Operative Assessment |
| `ortho_operative_note` | Operative Note |
| `ortho_procedure_note` | Procedure Note |
| `ortho_postop_note` | Post-Operative Note |
| `ortho_daily_progress` | Daily Orthopedic Progress Note |
| `ortho_discharge_summary` | Discharge Summary |
| `ortho_rehab_plan` | Rehabilitation Plan |

No key, label, order or existing field was renamed, removed or reordered. Every original field is still declared; the new content is appended. Saved notes, views, reports and PDFs that read a note by key are unaffected.

## 2. What was added

**Coding.** One WHO ICD-11 MMS field per note, with clinician confirmation, postcoordination, a per-note domain filter and the orthopaedic detail fields carried beside each code. Unspecified codes require a recorded justification.

**Trauma-emergency assessment.** One panel per note (all notes but the Rehabilitation Plan), covering 14 presentations: acute compartment syndrome, open fracture, severe soft-tissue injury, neurovascular compromise, vascular injury, unstable pelvic injury, polytrauma, spinal cord injury, cauda equina syndrome, septic arthritis, osteomyelitis, fat embolism syndrome, post-operative infection and thromboembolic complication. Each presentation carries its recognition criteria, its own time-critical statement, its escalation route, a time-critical pathway record (who was informed, when, the decision, the destination, the capability of the unit), an urgent-intervention record, and neurovascular assessment before and after any intervention. Red flags are recorded separately from presentations.

**Injury severity and physiology.** Major associated trauma, Injury Severity Score and its regions, physiological state, shock-index inputs, lactate or base deficit, and blood products / major haemorrhage protocol — so a limb-threatening injury is not documented as an isolated fracture in an unstable patient.

**Management.** Operative versus non-operative direction with rationale and indications, consent and alternatives, immobilisation / cast / closed reduction with the post-splint check, analgesia and medication risk, wound and infection prevention, weight-bearing, therapy and follow-up.

**Fracture healing.** Seven explicit states (not assessable, progressing, union, delayed union, nonunion, malunion, uncertain) with the interval from injury, the radiographs compared, clinical and radiographic signs, and a justification required for the states that need one. An unrecorded state is reported as owed, never as united.

**Safety review.** Twenty prompts, each stating what was documented, the threshold or classification crossed, the escalation the cited source describes, and the action the clinician took. A prompt never diagnoses, orders treatment or changes a plan.

## 3. Reference register

35 entries, each with its edition, what it supports and **what it does not say**: AAOS clinical practice guidelines and appropriate use criteria, OTA classification and trauma resources, NICE and BOAST guidance, primary literature, and AMedix local decisions labelled as such. No society is credited with an AMedix threshold, cut-off or protocol; a citation supports only the statement beside it.

## 4. Defects found and fixed during verification

1. **Silent content loss.** Three fields were being removed by the app's clinical-section rules before the form saw them: the imaging comparison (its label ended in "imaging"), the condition group and the diagnosis status (their labels read as a provisional/working diagnosis). All three were renamed and are now retained — asserted against the real governance module, not a copy.
2. **Missing panels.** The trauma panel was absent from the pre-operative assessment, the healing panel from the consultation, injury assessment, pre-operative, post-operative, daily progress and rehabilitation notes. Added.
3. **Incomplete urgency record.** Presentations named an urgency level but carried no per-presentation time-critical statement or escalation route. Added to all fourteen, shown in the panel and printed in the record.

## 5. Verification

`node qa/ortho-qa.mjs` — 12 check groups, currently **PASS**, including:

- every note enhanced; every original template and field still declared; standards applied in the registry;
- every declared field survives the real clinical-section policy, and each note's panels do too;
- catalogue identity, mapping states, no pre-verified code, no ICD-10-shaped code;
- prompts fire in **both** directions, with attribution checked against the body actually cited;
- a blank trauma panel and a blank healing state are reported as owed, never as normal;
- intervention without a post-intervention neurovascular check is flagged; documented pathways are not;
- every reference cited by a presentation or a healing state resolves in the register.

`npx vite build` — clean.

## 6. Open items (require clinical input)

- No orthopaedic threshold, red-flag list, urgency level or local rule has clinical sign-off.
- The twelve seed ICD-11 entries are deliberately unverified; coding review is outstanding for all of them, and 22 trauma families are taken from the WHO browser rather than seeded.
- No note of each type has been saved, reloaded and printed by an orthopaedic clinician in the portal (UAT outstanding).
- Arabic translation of the new blocks is outstanding.
- The ICD-11 coding field and the safety review inherit the note's existing permissions; no new row-level access rule was introduced.