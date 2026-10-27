# Trauma Surgery — Clinical Note Strengthening: Traceability Report

Review date: 27 October 2026
Scope: the existing AMedix specialty system only. No specialty, note type, route, entity, permission or workflow was created, renamed, removed or reordered.

## 1. Inventory of what exists (verified, not assumed)

Trauma Surgery is a selectable specialty in `SPECIALTIES`. It resolves to the surgical catalogue (`SPECIALTY_KEYS["Trauma Surgery"] = "surgery"`), so a Trauma Surgery doctor sees the existing 24 surgical note types:

Core notes (12): Surgical Consultation · Pre-Operative Assessment · Operative Note · Procedure Note · Post-Operative Note · Daily Surgical Progress Note · Discharge Summary · Surgical Follow-Up · Pathology Request / Record · Consent Documentation · Implant / Device Record (Surgical Referral is retired by the central section policy).

Condition notes (12): Acute Abdomen · Appendicitis · Bowel Obstruction · Hernia · Biliary · HPB · Colorectal · Breast · Thyroid · Upper GI · Infection · Trauma · Endoscopy.

**The trauma note is `surg_trauma` — "Trauma & Emergency Surgery Assessment".** It is the only note type in the catalogue whose clinical purpose is trauma, so the material strengthening was applied there; the shared notes were left intact except the Operative Note, which gained an explicitly optional trauma block (a trauma laparotomy is documented in that note).

## 2. What changed, and why

### 2.1 `surg_trauma` — Trauma & Emergency Surgery Assessment (81 fields, 10 sections)

| Section | Retained | Strengthened / added | Reason | Source |
|---|---|---|---|---|
| Prehospital & Mechanism of Injury | mechanism, prehospital handover, comorbidities, pregnancy status | structured mechanism list; injury date-time; trauma-team activation tier; referring facility; anticoagulant/antiplatelet status | Mechanism drives injury pattern and activation tier; anticoagulation drives reversal and imaging decisions | ATLS 11; ACS TQP BPG |
| Primary Survey — Catastrophic Haemorrhage & Airway | airway, breathing, exposure, vitals, GCS | haemorrhage control before airway; cervical-spine protection; thoracic decompression; **four-option Haemodynamic Status (Stable / Unstable / Transient Responder / Non-Responder)**; haemorrhage class; GCS band + total + trend; pupils | The four-option responder status is the documented marker of resuscitation response and the trigger for the next intervention | ATLS 11; EAST DCR 2017 |
| Resuscitation & Response | massive transfusion protocol | fluids and blood products; whole blood; tranexamic acid with the 3-hour distinction; REBOA; response trend; coagulation, calcium and temperature | Traceable response to resuscitation, not just a snapshot of observations | EAST DCR 2017; EAST whole blood 2024; EAST REBOA 2025; CRASH-2 |
| Adjuncts, FAST & Cross-Sectional Study | FAST, laboratory results | CT strategy (whole-body / selective / deferred); CT and radiograph findings | Records the imaging decision in relation to physiology, which is the documented safeguard around the unstable patient | ATLS 11; WTA; WSES |
| Secondary Survey — Head, Neck & Face | — | TBI band; anticoagulant reversal; repeat head CT; neurosurgical referral; ICP/CPP management; maxillofacial; penetrating neck signs | Brain injury and anticoagulation are the two highest-consequence additions | ACS TQP TBI; EAST mild TBI |
| Secondary Survey — Chest | — | rib-fracture count; flail chest; pneumothorax; haemothorax; tube thoracostomy; tube antibiotic prophylaxis; operative indication; thoracic findings | Chest injury documentation and the tube-thoracostomy prophylaxis question | WSES–AAST thoracic 2025; EAST tube thoracostomy 2022 |
| Secondary Survey — Abdomen & Solid Organs | — | abdominal examination; solid-organ injury; **spleen, liver and kidney AAST 2018 grades**; non-operative management decision; abdominal findings | Grades are classification only and are never derived by the platform | AAST OIS 2018; WTA solid-organ algorithms |
| Secondary Survey — Vascular, Pelvis & Extremities | — | vascular hard signs; ABI; pelvic binder; pelvic fracture pattern; pelvic haemorrhage control; spinal injury and neurological status; Gustilo–Anderson; compartment syndrome; ISS; head-to-toe summary; other findings | Vascular, pelvic, spinal and open-fracture documentation previously had no structured field | WTA vascular and pelvic algorithms; EAST extremity guidance |
| Assessment & Operative Decision | operative indication, damage control, transfer, clinician decision, plan | damage-control strategy detail; temporary abdominal closure; planned re-look; senior review line | Damage-control and open-abdomen decisions must be explicit and revisitable | EAST open abdomen 2022; EAST DCR 2017 |
| Recovery, Prophylaxis & Follow-Up | — | tertiary survey; VTE prophylaxis timing; nutrition plan; PTSD screening referral; rehabilitation referral; forensic documentation; follow-up plan | Missed injuries, VTE timing and psychological sequelae are the recognised post-trauma failure points | ATLS 11 (tertiary survey); EAST PTSD 2025 |

Removed/retired labels: "Allergies" (auto-attached to every note from the unified patient record), "Pelvic / Chest Imaging" (retired imaging section), "Escalation & Time-Critical Criteria" (retired escalation section). These were already being removed by the central section policy; the template no longer declares them.

Validation: required fields are limited to Haemodynamic Status and the Clinician Decision. Both offer honest escape values ("Transient Responder", "Not yet decided"), so emergency documentation is never blocked. Nothing is pre-filled, and no normal finding is auto-recorded.

### 2.2 `surg_operative_note` — Operative Note (7 added optional fields)

Section "Trauma Additions — complete only for injured patients": haemodynamic status at incision (four options), damage-control strategy, temporary abdominal closure, massive transfusion protocol (component therapy or whole blood), tranexamic acid, planned re-look, intra-operative injury findings and AAST grades.

Reason: a trauma laparotomy is documented in the Operative Note; without these, damage-control and staged closure decisions had no home. All fields are optional and labelled so a general-surgery operative note is unaffected.
Sources: EAST DCR 2017; EAST open abdomen 2022; EAST whole blood 2024.

### 2.3 Shared notes deliberately not changed

Surgical Consultation, Pre-Operative Assessment, Post-Operative Note, Daily Progress, Discharge Summary, Follow-Up, Consent, Pathology, Implant, Procedure and the condition notes belong to every surgical specialty. Adding trauma-specific fields to them would force irrelevant content into general surgical documentation, which the brief forbids. They already carry the generic documented elements (ASA, urgency, VTE risk, Clavien–Dindo grading, consent and capacity, discharge and follow-up). This is an open item if a dedicated trauma post-operative monitoring block is wanted.

## 3. Reference verification

Each source was retrieved from the organisation's own site (or the official journal record) on 27 October 2026 and is now recorded in `surgeryReferences.js`, which the existing "Guideline basis" panel in the note reads. 16 sources apply to the trauma note; the full list and the exact supported fields are visible in that panel.

Flags raised for review (not silently resolved):
- ACS TQP Best Practices Guidelines are a living collection with no collection-level version.
- ATLS 11 registration date and edition-level changes verified from the ACS page; the full course manual was not retrieved.
- AAST grades are classification only and are never derived by the platform.
- VTE prophylaxis timing after solid-organ or brain injury differs between societies — the template records the clinician's documented timing and reason.
- TXA dose and indication, REBOA availability, MTP composition, whole-body CT criteria, activation tiers, transfer criteria and destination are institution-specific.
- Trauma in pregnancy and paediatric trauma require specialist input; the template records status and refers on.
- Forensic reporting duties are jurisdiction-specific.

## 4. Implementation status and testing actually performed

Implementation: complete, reversible, content-only.

Executed verification (the catalogue was run through the central section policy and inspected programmatically):
- Trauma Surgery resolves to 24 note types; `surg_trauma` renders 81 fields across 10 sections.
- Haemodynamic Status resolves to exactly the four required options.
- All 16 previously existing field keys are preserved, so values already saved in earlier notes still map.
- No field of the new template is stripped by the central retirement policy (`escalation`, `investigation`, `imaging` rules).
- Operative Note renders its 7 trauma fields.
- The trauma note resolves 16 references and 16 review flags.
- Application build completes with no errors.

Not performed here: interactive entry, save, reopen, sign, amend and audit-trail testing inside the running portal. That requires the Testing Agent with a synthetic patient, for example "Open a Trauma Surgery note for a synthetic patient, complete the haemodynamic status and chest section, save, reopen, sign, then amend". No claim of UI test completion is made.

## 5. Unresolved issues

1. Interactive form, save, sign, amend and audit verification pending (see above).
2. Trauma post-operative monitoring block not added to the shared Post-Operative Note.
3. Local protocols (MTP composition, VTE timing, transfer criteria, TXA availability, forensic reporting) must be set institutionally; the templates record decisions, not policy.
4. ATLS 11 full manual content not reviewed; only the edition launch and edition-level changes were verified.