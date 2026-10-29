# Emergency Medicine — Paragraph 4 & 5 record

Status: implementation complete at the code level; **clinical scenario testing not executed**, and no
Emergency Medicine clinician has signed this off. Nothing below may be presented as clinically approved.

## 1. What was changed and how it stays backward-compatible

- The 13 existing Emergency Medicine templates keep their keys, labels, order and every existing field.
  New content is **appended** by `withEmergencyStandards()` in `src/lib/emergencyDocuments.js`.
- Additions are de-duplicated by field key, so a saved note never gains a second field for a fact it
  already recorded, and an old note still opens with all of its original values.
- Every added field is **optional**. Nothing blocks saving, and no field blocks immediate care.
  Safety-critical fields are labelled in the form; they are still optional.
- Nothing in the app orders, prescribes, administers or administers a medication, marks an intervention
  as done, or finalises a diagnosis. Every new field records a clinician decision, its author and time.

## 2. Reference register (as stored in `src/lib/emergencyReferences.js`)

`text_verified: true` = the recommendation wording was read at the publisher's page. `false` = only the
title, edition and link were confirmed in this build; no recommendation text is quoted from it.

| id | Organisation | Title | Edition / date | URL | Verified |
|---|---|---|---|---|---|
| ssc_2021 | Surviving Sepsis Campaign (SCCM/ESICM) | International Guidelines for Management of Sepsis and Septic Shock | 2021, Crit Care Med 49(11):e1063–e1143 | sccm.org (guidelines page) | text |
| acs_atls_11 | American College of Surgeons – COT | Advanced Trauma Life Support, 11th edition | ATLS 11th ed. | facs.org/quality-programs/trauma/…/atls-11 | title + edition |
| btf_severe_tbi_4 | Brain Trauma Foundation | Guidelines for the Management of Severe TBI, 4th Edition | Neurosurgery 2017;80(1):6–15 | braintrauma.org/coma/guidelines/severe-tbi | text |
| ssc / sepsis prompts | see above | | | | |
| who_bec | WHO / ICRC (with IFEM) | Basic Emergency Care: approach to the acutely ill and injured | WHO publication | who.int (publications detail) | title |
| aha_2025_cpr_ecc | American Heart Association | 2025 AHA Guidelines for CPR and ECC | Circulation, 22 Oct 2025 | cpr.heart.org | title + date |
| aha_2025_als | American Heart Association | Part 9: Adult Advanced Life Support | Circulation doi:10.1161/CIR.0000000000001376 | ahajournals.org | title only |
| aha_2025_bls | American Heart Association | Part 7: Adult Basic Life Support | Circulation doi:10.1161/CIR.0000000000001369 | ahajournals.org | title only |
| aha_2025_post_arrest | American Heart Association | Part 11: Post–Cardiac Arrest Care | Circulation doi:10.1161/CIR.0000000000001375 | ahajournals.org | title only |
| acep_clinical_policies | American College of Emergency Physicians | ACEP Clinical Policies (board-approved collection) | current collection | acep.org/patient-care/clinical-policies | title |
| acep_asymptomatic_bp_2025 | ACEP | Clinical Policy: Asymptomatic Elevated Blood Pressure | 2025 | acep.org (clinical policies) | title |
| east_damage_control_resuscitation | EAST | Damage control resuscitation in severe traumatic hemorrhage | practice management guideline | east.org | title |
| east_hemothorax_occult_pneumothorax | EAST | Hemothorax and occult pneumothorax | practice management guideline | east.org | title |
| east_ed_thoracotomy | EAST | Emergency department thoracotomy | practice management guideline | east.org | title |
| east_endotracheal_intubation | EAST | Endotracheal intubation following trauma | practice management guideline | east.org | title |
| east_cervical_spine_clearance | EAST | Cervical spine collar clearance in the obtunded adult | practice management guideline | east.org | title |
| east_blunt_cerebrovascular_injury | EAST | Blunt cerebrovascular injury | practice management guideline | east.org | title |
| east_handoffs | EAST | Handoffs and transitions of care | practice management guideline | east.org | title |
| icd11_mms | WHO | ICD-11 for Mortality and Morbidity Statistics | release 2026-01 | icd.who.int/browse/2026-01/mms/en | text + release |
| amedix_local_triage | AMedix | Local emergency safety trigger set — **not a clinical guideline** | — | — | internal |

Apply-with-caution notes:
- SEP-1-style bundle elements (lactate, 30 mL/kg, antimicrobial timing) are recorded as *documentation of
  what was done and when*; the app never orders them.
- AHA 2025 recommendation text was not opened in this build: AMedix prompts documentation of the
  resuscitation elements and their times, and quotes no AHA instruction.
- EAST/ATLS/ACEP entries are used to justify *what is asked*, not to prescribe a threshold.

## 3. Note-by-note mapping (13 templates)

"Presentation" = presentation-conditional blocks from `emergencyPresentations.js` (chest pain,
respiratory, shock, altered mental status, stroke, seizure, abdominal pain, poisoning, anaphylaxis,
major trauma, cardiac arrest, paediatric, decision rule). "Safeguards" = `emergencySafeguards.js`.

| # | Template key | Purpose | Strengthened sections | ICD-11 | References |
|---|---|---|---|---|---|
| 1 | em_emergency_note | Full ED note | time-critical, red flags, ABCDE, **presentation blocks + GCS + decision rule + paediatrics**, reassessment, disposition/safety-netting, **medication safety, consent/capacity/informed refusal, pending results** | all domains, codes + category + cluster + confirmation | ssc_2021, acs_atls_11, aha_2025_*, acep_*, east_*, who_bec, icd11_mms |
| 2 | em_triage | Acuity only — no diagnosis | time-critical category, red flags, triage reassessment, **presentation blocks (no coding)** | none — by design | who_bec, amedix_local_triage |
| 3 | em_ed_assessment | Initial assessment | time-critical, red flags, ABCDE, sepsis, **presentation blocks + decision rule**, reassessment, **medication safety** | all domains | ssc_2021, acep_*, aha_2025_*, icd11_mms |
| 4 | em_physician_note | Physician assessment + plan | as #3 + disposition, **consent/capacity/informed refusal, pending results** | all domains | ssc_2021, acep_*, east_handoffs, icd11_mms |
| 5 | em_progress | Interval progress | reassessment, disposition, coding | all domains | east_handoffs, icd11_mms |
| 6 | em_trauma_assessment | Major trauma | time-critical, red flags, trauma primary survey, **presentation blocks (trauma/arrest)**, reassessment, transfer, **medication safety, neurovascular reassessment** | trauma domains | acs_atls_11, east_damage_control_resuscitation, east_cervical_spine_clearance, east_blunt_cerebrovascular_injury, east_hemothorax_occult_pneumothorax, east_ed_thoracotomy, east_endotracheal_intubation |
| 7 | em_procedure_note | Procedure | procedure safety (consent, site, sedation, asepsis, attempts, monitoring, aftercare), reassessment, disposition, **medication safety, neurovascular reassessment** | all domains | ACEP clinical policies, WHO procedural-safety prompts (local) |
| 8 | em_resuscitation_code | Cardiac arrest | time-critical, arrest record, **structured resuscitation record + timed event log + paediatric safeguards**, reassessment, **medication safety (weight-based dosing, double-check)** | arrest/shock domains | aha_2025_cpr_ecc, aha_2025_als, aha_2025_bls, aha_2025_post_arrest (titles only) |
| 9 | em_consultation | Consultation | consultation request/response times, outcome, handover | all domains | east_handoffs, icd11_mms |
| 10 | em_observation_note | Observation | observation criteria, escalation, disposition, **medication safety, pending results** | all domains | acep_*, who_bec, icd11_mms |
| 11 | em_transfer_note | Transfer | time-critical, transfer acceptance/monitoring/handover/risk, **pending results** | all domains | east_handoffs, icd11_mms |
| 12 | em_discharge_summary | Discharge | disposition, reassessment, **consent/capacity/informed refusal, pending results** | all domains | acep_*, east_handoffs, icd11_mms |
| 13 | em_discharge_instructions | Patient instructions | instruction mode, teach-back, **pending results and review pathway** | all domains | who_bec, icd11_mms |

## 4. ICD-11 integration — exact state

- Release **2026-01**, ICD-11 MMS, verified subset in `src/lib/emergencyIcd11.js` (chapters: 21
  symptoms and signs, 23 external causes, plus the emergency disease domains).
- **No live WHO ICD-11 API is connected.** No client id or secret is stored. The clinician either selects
  from the verified subset or enters the code from the WHO browser, which is stored as `review_required`.
  The app never generates, completes, crosswalks from ICD-10, or guesses a code.
- Each coded entry stores: code, official display, system, system URI, release, source, verified date,
  mapping state, role, status, concept category, postcoordinated cluster (as typed), clinical basis,
  follow-up, and the clinician's independent-check confirmation.
- Postcoordination is not generated: a cluster is recorded exactly as the WHO Coding Tool shows it.
- Validation is client-visible and blocking only on documentation integrity (a "Confirmed" diagnosis
  requires a clinical basis); it never blocks saving a note as a whole.

## 5. Verification actually performed in this build

Performed:
- Production build (`vite build`) completes with exit code 0 — every new module resolves and compiles.
- Static audit of appended field keys: no duplicate keys within any single template, and no key added that
  an existing template already declared (de-duplication runs at merge time).
- Existing template keys, order and pre-existing fields unchanged; additions are append-only.

**Not performed, and therefore not claimed:**
- No synthetic clinical scenario has been executed in the running app (cardiac arrest, major trauma,
  shock, chest pain, stroke, respiratory failure, poisoning, routine discharge). These need to be run in
  the preview or with the Testing Agent, note type by note type.
- ICD-11 search relevance, conditional-field behaviour, save/edit round-trip, permissions, signed-note
  integrity and audit-trail output have **not** been exercised end to end in this build.
- No Emergency Medicine clinician has reviewed the wording of the new prompts.

## 6. Open items before production

1. Emergency Medicine consultant review and written approval of every added block and prompt.
2. Run the synthetic scenario matrix (adult and paediatric) on each of the 13 note types and record
   pass/fail, including: blank-note save, partial-save, reopening a legacy note, and signed-note immutability.
3. Decide whether the local triage triggers in `amedix_local_triage` are accepted as institutional policy.
4. Confirm the paediatric weight/dose double-check wording with the pharmacy and paediatric teams.
5. If a live WHO ICD-11 API is wanted later, register credentials in the dashboard Secrets page; until then
   the notes must state that the subset is bundled, which they do.