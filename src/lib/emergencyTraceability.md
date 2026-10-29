# AMedix — Emergency Medicine Specialty System
## In-place strengthening, guideline traceability and QA record

Audit date: 2026-10-29 · Scope: the **13 existing** Emergency Medicine note types · Auditor: AMedix engineering (automated)

---

### 1. What this change did — and what it did not do

The 13 Emergency Medicine templates were **strengthened in place**: every one of their existing
keys, labels, order and fields is unchanged, and the new documentation blocks are **appended**.
Nothing was recreated, renamed, deleted or reorganised; no other specialty, portal, permission,
entity or workflow was modified.

A read-only comparison against the build captured before this work confirms **0 existing
Emergency field keys removed** (23 baseline keys before and after, difference = none). New
content is added through one module (`src/lib/emergencyDocuments.js`) plus three reference
modules, and wired into the shared note form and the saved-note formatter.

**Explicitly not claimed:** the department is not "compliant" with any guideline, no guideline
has been "implemented", and nothing here is a substitute for clinical judgement. The notes
record what the clinician documented; the trigger layer states what was documented and how
time-sensitive it is.

---

### 2. Inventory — all 13 note types after strengthening

All fields optional (0 required across the specialty). "ICD" = number of codes offered by that
note's filtered ICD-11 catalogue.

| # | Note type (key) | Fields | Sections | ICD | Coding block |
|---|---|---|---|---|---|
| 1 | em_emergency_note | 34 | 7 | 49 | Yes |
| 2 | em_triage | 17 | 4 | — | **No — by design** (triage records acuity and risk, not a diagnosis) |
| 3 | em_ed_assessment | 31 | 7 | 49 | Yes |
| 4 | em_physician_note | 36 | 8 | 49 | Yes |
| 5 | em_progress | 15 | 4 | 49 | Yes |
| 6 | em_trauma_assessment | 39 | 7 | 29 | Yes |
| 7 | em_procedure_note | 23 | 5 | 49 | Yes |
| 8 | em_resuscitation_code | 33 | 5 | 31 | Yes |
| 9 | em_consultation | 13 | 4 | 49 | Yes |
| 10 | em_observation_note | 18 | 4 | 49 | Yes |
| 11 | em_transfer_note | 17 | 4 | 49 | Yes |
| 12 | em_discharge_summary | 17 | 4 | 49 | Yes |
| 13 | em_discharge_instructions | 10 | 3 | 49 | Yes |

**Blocks added, by clinical purpose**

- **Emergency time-critical record** — suspected time-critical condition, symptom onset /
  last known well, first medical contact, ECG performed, pathway activated, resuscitation
  status documented.
- **Red-flag screening** — screen performed / not performed / unable with a recorded reason,
  at-risk group (pregnancy, anticoagulation, immunocompromise, frailty, child, cognitive
  impairment).
- **Resuscitation & stabilisation** — documented airway, breathing, circulation, consciousness
  (AVPU or sedated) and glucose status, plus pain reassessment. These record the decision and
  the support given; they do **not** re-collect vital signs, which the shared ClinicalNote
  surfaces already provide.
- **Trauma primary survey (structured)** — mechanism, team activation, A–E elements, adjuncts,
  tranexamic acid, massive transfusion activation, definitive care, head-injury severity and
  anticoagulant status. The existing free-text primary/secondary survey fields are untouched.
- **Arrest record** — witnessed status, bystander CPR, public-access defibrillator, initial
  rhythm, time to first shock, shocks, CPR quality, ROSC time, post-ROSC care, timed drugs,
  family presence/contact, team debrief.
- **Sepsis assessment** — sepsis severity, antimicrobial timing, lactate, fluid resuscitation,
  vasopressor support.
- **Reassessment & escalation**, **disposition & safety-netting**, **procedural safety**,
  **consultation & response**, **observation standards**, **handover & transfer**, and
  **patient instructions & safety-netting** (instruction mode and teach-back).
- **Diagnosis classification (ICD-11)** and **safety concerns & documented action**.

No template duplicates a fact it already recorded: the procedure note keeps its own consent
field (no second consent field is added), the discharge-instructions note keeps its own
warning-sign field (no second return-precaution field is added), and no note re-collects
history, medications, allergies, laboratory results, imaging or vital signs.

---

### 3. Guideline and reference register

Register: `src/lib/emergencyReferences.js` — **19 references**. Each carries organisation, title,
edition, URL, retrieval date, `evidence_type`, and `title_verified` / `text_verified`.

**Text verified at source (4)**

| Reference | What was actually read (2026-10-28/29) |
|---|---|
| Surviving Sepsis Campaign 2021 | Recommendation wording, strength and certainty read on the SCCM guideline page: antimicrobials immediately, ideally within 1 hour of recognition, for possible septic shock or high likelihood of sepsis (strong; low/very low certainty); ≥30 mL/kg crystalloid within 3 hours for sepsis-induced hypoperfusion (weak); initial MAP target 65 mm Hg (strong; moderate); measure blood lactate (weak); sepsis is a medical emergency and resuscitation should begin immediately (best practice statement). |
| Brain Trauma Foundation, severe TBI, 4th edition | Statement read at braintrauma.org: ICP should be monitored in all salvageable patients with severe TBI (GCS 3–8 after resuscitation) and an abnormal CT. The 4th edition is listed there as the current severe-TBI guideline. |
| WHO ICD-11 MMS, release 2026-01 | Every code and title in the catalogue was read from the tabulation (chapters/blocks listed in the reference entry). |
| AMedix local emergency trigger set | A local clinical decision set — not a guideline. Labelled as local everywhere it appears. |

**Title/edition verified, recommendation text NOT opened (15)** — these are labelled
"reference not verified in this build" in the note and the PDF, and no wording is quoted:

- **AHA** — 2025 Guidelines for CPR and ECC (published in *Circulation*, 22 October 2025);
  Part 7 Adult BLS (doi:10.1161/CIR.0000000000001369); Part 9 Adult ALS
  (doi:10.1161/CIR.0000000000001376); Part 11 Post–Cardiac Arrest Care
  (doi:10.1161/CIR.0000000000001375). Only titles/dates and the published abstracts were read.
- **ACEP** — Clinical policies index (titles read: Acute Blunt Trauma; Acute Heart Failure
  Syndromes; Asymptomatic Elevated Blood Pressure; Non–ST-Elevation ACS; Reperfusion Therapy
  for STEMI; Seizure; Severe Agitation). **Individual policy pages require an ACEP member
  sign-in and could not be opened**, so no ACEP recommendation is quoted and no policy year is
  asserted, except the 2025 asymptomatic elevated blood pressure policy whose approval date
  (22 January 2025) and publication month (July 2025) were read from ACEP/ACEP Now reporting.
- **ACS / ATLS 11** — the ACS announcement of ATLS 11 and its 2025 launch was read. ATLS is
  recorded as a **consensus-based training programme**, not a graded guideline; its content is
  not public, so no ATLS instruction is reproduced.
- **EAST** — nine practice management guidelines, titles and years read on EAST's own index:
  damage control resuscitation in severe traumatic haemorrhage (2017); haemothorax and occult
  pneumothorax (2011); emergency department thoracotomy (2015); endotracheal intubation following
  trauma (2012); cervical spine collar clearance in the obtunded blunt trauma patient (2015);
  blunt cerebrovascular injury (2020); handoffs and transitions of care (2024).
- **WHO–ICRC Basic Emergency Care** (2018, with IFEM) — a consensus-based open-access training
  course; description read at WHO. The manual's wording was not opened, so no instruction is
  quoted.

**How the distinction is kept visible:** every prompt shows its reference, its
`evidence_type` (formal recommendation / consensus or programme / local protocol) and whether
its text was verified at source. Ten items are listed in
`EMERGENCY_SAFETY_APPROVAL_REQUIRED` because they currently rest on a reference whose text was
not verified, or on a local decision. Those must be signed off before clinical use.

---

### 4. ICD-11 integration

- **System** ICD-11-MMS · **Release 2026-01** · `http://id.who.int/icd/release/11/mms` · source
  recorded per entry with retrieval date 2026-10-28. No ICD-10 code is stored, substituted or
  displayed.
- **Catalogue:** 49 verified categories in 10 domains — ischaemic heart disease 7, arrest/shock
  5, cerebrovascular 8, sepsis 2, trauma 7, respiratory 6, metabolic/status epilepticus 7,
  toxicology 3, allergy 1, general 3.
- **Per-template filtering works:** emergency/assessment/physician/progress/procedure/
  consultation/observation/transfer/discharge notes offer 49; the trauma note offers 29
  (trauma, arrest/shock, respiratory, cerebrovascular, general); the code record offers 31
  (arrest/shock, ischaemic heart disease, respiratory, toxicology, metabolic, general). A
  trauma note cannot suggest anaphylaxis as a diagnosis.
- **Integrity checks executed, all passing:** code format valid for every entry; no duplicate
  codes; no subcategory without its parent category; system, URI, release and verification date
  present on every entry; no empty domain.
- **Coding workflow:** role (primary/secondary), status (confirmed/provisional/differential),
  specificity, clinical basis, mapping state (verified / review required / unresolved) and
  follow-up are recorded per entry. A diagnosis outside the catalogue is entered from the WHO
  browser and stored as **review required** — the app never generates, completes or guesses a
  code. Coded diagnoses are stored machine-readably in `ClinicalNote.icd11_coded_diagnoses`
  and revalidated server-side by `createClinicalNote` (system fixed, mapping state constrained,
  documented term required, capped at 40 entries).
- **Known catalogue gaps, stated not hidden:** subcategories of intracranial injury
  (concussion/contusion/traumatic haemorrhage), fractures other than skull and rib/sternum/
  thoracic spine, abdominal and limb injuries, named poisons, environmental injury, acute kidney
  injury, rhabdomyolysis, electrolyte emergencies and self-harm presentations. These are coded
  from the WHO browser as review required.
- **Triage note:** carries no coding block by design — a diagnosis is not made at triage. Its
  safety layer is told this, so it never asks for a code.

---

### 5. Safety-prompt engine

Engine: `src/lib/emergencySafetyRules.js`. Levels: **Act now**, **Same day**, **Documented**.
Each template declares what it can record (`capabilities`), so a document that cannot code a
diagnosis or cannot discharge a patient never raises a prompt it can never satisfy.

**Rules (24 triggers + 11 clinician concerns).** Immediate: cardiac arrest; post-ROSC care
undocumented; ACS reperfusion pathway undocumented; stroke (time last known well missing);
septic shock (antimicrobial timing, lactate); airway compromise; inadequate breathing;
haemodynamic support; major haemorrhage; severe TBI; anaphylaxis; status epilepticus; severe
hypoglycaemia. Same day: sepsis without shock; anticoagulated head injury without a documented
decision; poisoning; transfer without documented acceptance. Documented: red-flag screen not
completed; time-critical condition not recorded; critical times incomplete; pathway not
documented; reassessment not documented; no ICD-11 diagnosis on a time-critical encounter;
discharge without safety-netting; discharge without follow-up; debrief not documented;
procedure consent not documented; reduced consciousness without a glucose.

**Behaviour verified:** an empty note raises **no** prompt; an unrecognised value raises no
prompt for an unknown state; prompts are sorted immediate → same day → documented; every
prompt's reference resolves to a register entry; the stored prompt set is snapshotted into the
note and reproduced verbatim (with the verification state) in the saved note and the PDF.

---

### 6. Tests executed and results

| Test | Result |
|---|---|
| All 13 original note types present after the change | **Pass** (13/13) |
| No existing Emergency field key removed (git comparison of the template block) | **Pass** (0 removed) |
| No duplicate field key inside any template | **Pass** |
| Every select has options; every `showIf` target exists | **Pass** |
| Zero required fields across all 13 templates | **Pass** |
| No section matches a centrally retired section name | **Pass** |
| ICD code format / duplicates / orphan subcategories / metadata | **Pass** (49 entries) |
| Per-template ICD catalogues non-empty and domain-filtered | **Pass** (49 / 29 / 31) |
| Empty note raises no safety prompt | **Pass** |
| Sepsis, ACS, arrest, stroke, TBI, airway/breathing/circulation, discharge gaps, concerns | **22 distinct rules fired, 0 errors** |
| Triage never prompted for an ICD code; ED note is prompted | **Pass** |
| Discharge-instructions note prompted for safety-netting | **Pass** |
| Non-discharge note never prompted for discharge gaps | **Pass** |
| Every prompt reference resolves | **Pass** (11 distinct references used) |
| Saved-note/PDF formatter renders levels, actions and verification state | **Pass** |
| Production build compiles with the new modules wired in | **Pass** |

**Not tested (and not claimed):** browser/UI interaction, save → reopen → edit → sign in a live
session, role and permission behaviour against a live database, audit-log review, and rendering
of a historical note saved before this change.

---

### 7. Open items requiring clinical sign-off

1. **AHA 2025 recommendation text** — titles and abstracts verified only; the graded
   recommendations must be read at source before any prompt cites them.
2. **ACEP clinical policies** — policy pages require member sign-in; titles and one 2025 policy
   date confirmed, text not. Confirm each policy and its year.
3. **ATLS 11** — recorded as a programme/edition only; no ATLS content is reproduced or claimed.
4. **BTF** — only the ICP statement was verified; other recommendations are not cited.
5. **EAST** — titles and years verified, recommendation text not.
6. **Local decisions** — 10 items in `EMERGENCY_SAFETY_APPROVAL_REQUIRED`, including stroke
   time thresholds, head-injury anticoagulation reversal, and the local trigger wording/levels.
7. **ICD-11 gaps** in §4, and the absence of a coding-review queue for `review_required` entries.
8. **Arabic** — the clinical note form is English-only; the patient portal is bilingual.

### 8. Non-claims

This record establishes that the 13 existing Emergency Medicine note types are intact and
internally consistent, that their new documentation blocks do not duplicate shared surfaces and
do not block care, that the ICD-11 catalogue is internally consistent on release 2026-01, and
that the safety engine behaves as described on the scenarios listed. It does **not** establish
that the portal is clinically validated, that it is compliant with ACEP, AHA, ACS/ATLS, BTF,
EAST or WHO guidance, or that it is fit for use without review and sign-off by an emergency
medicine consultant, together with clinical-safety and privacy review.