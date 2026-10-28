# Obstetrics & Gynecology — clinical enhancement record

Scope: the **existing** Obstetrics & Gynecology note types in the AMedix Specialty
System. Nothing in this record recreates, renames, reorders or removes a template.
Every change is an **append**: existing keys, labels, order and saved notes are
untouched, so a note signed before this build keeps its meaning and every workflow
that reads a note by key keeps working.

Build date: **2026-10-28**.

## 1. What already existed, and what was added

19 note types were found in the specialty catalogue and all 19 were strengthened
in place.

| # | Note key | Existing purpose | What was appended |
|---|---|---|---|
| 1 | `obgyn_initial_antenatal` | booking visit | coding context · hypertensive status · fetal status · early-pregnancy status · ICD-11 · safety |
| 2 | `obgyn_antenatal_followup` | routine antenatal review | coding context · hypertensive status · fetal status · maternal status · ICD-11 · safety |
| 3 | `obgyn_pregnancy_record` | pregnancy summary record | coding context · hypertensive status · fetal status · early-pregnancy status · ICD-11 · safety |
| 4 | `obgyn_prenatal_care_plan` | care plan | coding context · hypertensive status · fetal status · ICD-11 · safety |
| 5 | `obgyn_pregnancy_followup` | interval pregnancy review | coding context · hypertensive status · fetal status · maternal status · ICD-11 · safety |
| 6 | `obgyn_labor_delivery_record` | labour and birth record | coding context · hypertensive status · haemorrhage status · fetal status · maternal status · ICD-11 · safety |
| 7 | `obgyn_delivery_note` | delivery note | coding context · hypertensive · haemorrhage · fetal · maternal · early-pregnancy · ICD-11 · safety |
| 8 | `obgyn_csection_operative_note` | caesarean operative note | coding context · hypertensive · haemorrhage · maternal · ICD-11 · safety |
| 9 | `obgyn_vaginal_delivery_note` | vaginal delivery note | coding context · haemorrhage · maternal · ICD-11 · safety |
| 10 | `obgyn_postpartum_note` | postpartum review | coding context · haemorrhage · maternal · ICD-11 · safety |
| 11 | `obgyn_discharge_summary` | obstetric discharge | coding context · hypertensive · haemorrhage · maternal · ICD-11 · safety |
| 12 | `obgyn_gyn_consultation` | gynecology consultation | coding context · gynecologic status · ICD-11 · safety |
| 13 | `obgyn_gyn_followup` | gynecology follow-up | coding context · gynecologic status · ICD-11 · safety |
| 14 | `obgyn_gyn_procedure_note` | procedure note | coding context · gynecologic status · ICD-11 · safety |
| 15 | `obgyn_gyn_operative_note` | operative note | coding context · gynecologic status · ICD-11 · safety |
| 16 | `obgyn_gyn_preop_assessment` | pre-operative assessment | coding context · gynecologic status · ICD-11 · safety |
| 17 | `obgyn_gyn_postop_note` | post-operative note | coding context · gynecologic status · ICD-11 · safety |
| 18 | `obgyn_gyn_discharge_summary` | gynecologic discharge | coding context · gynecologic status · ICD-11 · safety |
| 19 | `obgyn_gyn_referral` | referral | coding context · gynecologic status · ICD-11 · safety |

Deliberately **not** done: no field re-collects a vital sign, laboratory value,
imaging finding, medication or allergy — those arrive from the shared ClinicalNote
tabs and the unified Patient Record. The existing structured gynecologic
examination and sexual & reproductive health sections remain the only structured
examination surfaces; nothing here adds a second one.

## 2. ICD-11 integration

**Release used: ICD-11 MMS 2026-01**, the release in force when this audit was run.
Codes and official display terms were read from the published tabulation on
2026-10-28 — Chapter 18 (pregnancy, childbirth, puerperium) and Chapter 16
(diseases of the genitourinary system). **61 verified categories** are offered.

| Block | Codes offered | Used by |
|---|---|---|
| JA00–JA0Z abortive outcome of pregnancy | 7 | antenatal, pregnancy record, delivery |
| JA20–JA2Z hypertensive disorders | 7 | every obstetric note |
| JA40–JA4Z obstetric haemorrhage (incl. JA43 subtypes) | 13 | intrapartum, postpartum, discharge |
| GA10–GA11 endometriosis and adenomyosis | 12 | every gynecologic note |
| GA12–GA1Z noninflammatory/acquired genital tract disorders | 10 | every gynecologic note |
| GA20–GA2Z abnormal uterine or vaginal bleeding | 6 | every gynecologic note |
| GA30–GA34 menopause, infertility, MAR, recurrent loss, pelvic pain | 6 | every gynecologic note |

Coding integrity, enforced in the field and on the server:

- A diagnosis is recorded with **role** (primary/secondary) and **status**
  (confirmed/provisional/differential) — a code never confirms a diagnosis.
- Every entry stores **system, system URI, release, source and verification date**
  with the code, so the note remains auditable after signature.
- A code outside the catalogue is entered by the clinician from the WHO browser and
  stored as **mapping review required**; a diagnosis that cannot be mapped is stored
  as **unresolved with no code at all**. The app never generates, completes or
  suggests a code from clinical wording.
- **Release difference, recorded not hidden:** Endocrinology was built on 2025-01;
  this specialty uses 2026-01. Each entry carries its own release, so the two are
  never silently mixed.
- No live WHO API is called, and the note says so beside the field.

Known coding gaps, stated rather than filled with unverified codes: labour and
delivery complications other than haemorrhage, puerperal sepsis/infection,
inflammatory disorders of the female genital tract (GA00–GA0Z — block known, no
categories verified), neoplastic codes (Chapter 02 requires histology), maternal
medical conditions from other chapters, and symptom codes (MF30–MF3Y), which are
findings and are not offered as diagnoses.

## 3. Reference register — what was actually verified

| Reference | Organisation | Edition | Verification state |
|---|---|---|---|
| Pre-eclampsia — fact sheet | WHO | Updated 6 October 2026 | **Text read at source** (2026-10-28) |
| ICD-11 MMS tabulation | WHO | 2026-01 | **Codes and titles read at source** (2026-10-28) |
| Prevention and treatment of pre-eclampsia and eclampsia | WHO | 2011 | Title, year and link verified; recommendation text not opened |
| Drug treatment for severe hypertension in pregnancy | WHO | 2018 | Title, year and link verified; recommendation text not opened |
| Drug treatment for non-severe hypertension in pregnancy | WHO | 2020 | Title, year and link verified; recommendation text not opened |
| Antiplatelet agents for prevention of pre-eclampsia | WHO | 2021 | Title, year and link verified; recommendation text not opened |
| Antenatal care for a positive pregnancy experience | WHO | 2016 | Title, year and link verified; recommendation text not opened |
| Postpartum haemorrhage guidance | WHO | not confirmed | **Not verified** — WHO fact-sheet address returned "page cannot be found" |
| Gestational hypertension and pre-eclampsia | ACOG | not confirmed | **Not verified** — document number and date not confirmed at source |
| Postpartum haemorrhage | ACOG | not confirmed | **Not verified** |
| Tubal ectopic pregnancy | ACOG | not confirmed | **Not verified** |
| Maternal sepsis | RCOG | not confirmed | **Not verified** |
| Venous thromboembolism in pregnancy and the puerperium | RCOG | not confirmed | **Not verified** |
| Postpartum haemorrhage | FIGO | not confirmed | **Not verified** |
| Intrapartum fetal monitoring | FIGO | not confirmed | **Not verified** |

No ACOG, RCOG or FIGO document number or revision year is cited anywhere in the
app, because none was confirmed at source in this build. Where a rule rests on one
of those organisations, the note and the PDF print the reference together with
"not verified in this build — confirm before relying on it". Claiming a version
that was never opened would have been worse than stating the gap.

## 4. Safety layer

Prompts arise **only** from what the clinician documented in that note, in that
encounter. Nothing is inferred from an unanswered field, an empty panel says
explicitly that it is not reassurance, and no prompt is required to sign a note.

| Trigger | Level | Rests on |
|---|---|---|
| Eclampsia documented | Act now | WHO pre-eclampsia fact sheet (verified) |
| Pre-eclampsia with severe features documented | Act now | WHO pre-eclampsia fact sheet (verified) |
| Severe-range blood pressure documented | Act now | WHO severe hypertension 2018 (title verified) |
| Neurological / renal / hepatic / haematological feature documented | Act now | WHO pre-eclampsia fact sheet (verified) |
| Magnesium sulfate not given — reason required | Same day | WHO pre-eclampsia fact sheet (verified) |
| Magnesium decision not documented | Documented | WHO pre-eclampsia fact sheet (verified) |
| Haemorrhage ongoing at this encounter | Act now | WHO PPH guidance (not verified) |
| Massive haemorrhage documented | Act now | WHO PPH guidance (not verified) |
| Postpartum haemorrhage documented, bleeding controlled | Documented | WHO PPH guidance (not verified) |
| Uterotonic prophylaxis not documented | Documented | WHO PPH guidance (not verified) |
| Maternal sepsis documented | Act now | RCOG maternal sepsis (not verified) |
| High VTE risk with no prophylaxis documented | Documented | RCOG VTE (not verified) |
| Non-reassuring fetal status documented | Same day | FIGO fetal monitoring (not verified) |
| Ectopic pregnancy suspected / ruptured | Act now | ACOG ectopic (not verified) |
| Clinician-raised concerns (12) | per concern | as labelled |

The magnesium sulfate statement used in the verified prompt is the WHO fact sheet's
own sentence: in women with pre-eclampsia, magnesium sulfate reduces the risk of
eclampsia by more than half.

Prompts record what was documented, how time-sensitive it is, the reference and its
verification state, and the **action taken** — with who and when. They never
diagnose, prescribe, calculate a dose or place an order.

## 5. Sign-off required before clinical reliance

1. WHO and FIGO postpartum haemorrhage guidance confirmed at source (the triggers
   above depend on it).
2. ACOG document numbers and dates confirmed for hypertension, PPH and ectopic.
3. RCOG Green-top numbers and dates confirmed for sepsis and VTE.
4. FIGO fetal monitoring guidance confirmed.
5. Obstetric sign-off of the AMedix trigger levels and wording.
6. UAT by an obstetrician on one note of each of the 19 types, including PDF output.

## 6. Files

- `src/lib/obgynIcd11.js` — verified ICD-11 MMS 2026-01 catalogue and its stated limits.
- `src/lib/obgynReferences.js` — reference register with per-reference verification state.
- `src/lib/obgynSafetyRules.js` — trigger engine, PDF formatting, sign-off list.
- `src/lib/obgynDocuments.js` — the appended fields, per note, additive only.
- `src/components/doctor/notes/ObgynSafetyPromptsField.jsx` — concern toggles, prompts, action capture.

## 7. Second pass — clinical domains added to the same 19 templates

No template was created, renamed or removed. The blocks below were appended to
the templates whose clinical purpose already covers the domain.

| Block | Appended to | Covers |
|---|---|---|
| Antenatal assessment (17 fields) | Initial Antenatal Visit, Antenatal Follow-Up, Pregnancy Record, Pregnancy Follow-Up, Prenatal Care Plan | trimester, dating method, dating-scan date and gestational age, basis of the EDD, ultrasound findings, previous preterm/stillbirth/ectopic/caesarean, antibody screening, anaemia, infection screening, gestational diabetes, urinalysis, pending results and the follow-up action |
| High-risk pregnancy (12 fields) | the same five antenatal templates | classification, documented reason, primary category, severity, monitoring level, specialist/MFM involvement, fetal surveillance plan, medication considerations, delivery planning, escalation thresholds, review interval |
| Labour admission and progress (12 fields) | Labor & Delivery Record | admission indication, membrane status, rupture time, liquor, cervical examination **with documented consent** and findings, contractions, partograph or equivalent, stage of labour, induction/augmentation with documented indication, decision and consent |
| Birth, placenta, newborn and handover (7 fields) | Labor & Delivery Record, Delivery Note, Vaginal Delivery Note, Cesarean Operative Note | instrumental birth, placenta and membranes completeness, newborn outcome, newborn resuscitation (only when resuscitation is recorded), newborn transfer, responsible clinician, handover |
| Obstetric emergency (11 fields) | Labor & Delivery Record, Delivery Note, Vaginal Delivery Note, Cesarean Operative Note, Postpartum Note, Obstetric Discharge Summary | emergency type, red flags, immediate actions, response to treatment, escalation, transfer, disposition, time-critical events |
| Postnatal assessment (13 fields) | Postpartum Note, Obstetric Discharge Summary | lochia, uterine involution, perineum or abdominal wound, pain control, urinary and bowel function, mental-health screening, contraception, breastfeeding support, newborn concerns, discharge readiness, safety-netting, follow-up |

Emergency prompts were extended to the emergencies the note can now record:
postpartum and antepartum haemorrhage, ectopic pregnancy, pregnancy loss, severe
hypertension/eclampsia, maternal sepsis, uterine rupture, cord prolapse, shoulder
dystocia, fetal compromise, preterm labour/PPROM and thromboembolism — each at the
time-sensitivity the documented situation carries, plus a documentation-gap prompt
when the response to treatment is not recorded. Every prompt states in the note
that treatment must never wait for documentation.

**Still not covered, stated plainly:**
- There is no separate Maternal-Fetal Medicine, high-risk-pregnancy or emergency
  obstetric **template** in the system, so nothing was duplicated to create one;
  those domains live inside the templates above.
- ICD-11 codes for gestational diabetes, fetal growth restriction, multiple
  pregnancy, preterm labour, sepsis, thromboembolism, cord prolapse, shoulder
  dystocia and uterine rupture are **not** in the verified catalogue; those
  diagnoses must be mapped by the clinician from the WHO browser and will be stored
  as coding review required.
- ACOG, RCOG and FIGO document numbers remain unconfirmed, so the emergency
  prompts that rest on them stay labelled as not verified in this build.

## 8. Third pass — the eight gynecology templates, in place

No gynecology template was created, renamed, reordered or removed. Their existing
fields stay exactly as they were; the blocks below were appended, each only to the
templates whose clinical purpose covers it.

| Block | Fields | Appended to |
|---|---|---|
| History and presenting symptoms | 17 | Gynecology Consultation, Gynecology Follow-Up |
| Examination — consent, chaperone, findings, deferral | 9 | Gynecology Consultation, Gynecology Follow-Up |
| Assessment, differential and management plan | 6 | Consultation, Follow-Up, Procedure Note, Operative Note, Post-Operative Note, Discharge Summary, Referral |
| Investigations, screening and follow-up | 9 | Consultation, Follow-Up, Discharge Summary |
| Procedure and surgical documentation | 5 | Procedure Note, Operative Note, Pre-Operative Assessment |
| Post-operative condition, instructions and follow-up | 5 | Procedure Note, Operative Note, Post-Operative Note, Discharge Summary |

Deliberate design points:

- **Sensitive questions are optional and non-directive.** Sexual history offers
  "Not clinically indicated" and "Deferred at the patient's request"; fertility
  goals offer "Not discussed — patient preference"; no intimate examination field
  is required, and every examination field can record "Not performed — deferred"
  or "Declined by the patient" with a reason.
- **Consent and chaperone are recorded**, not assumed.
- **No normal finding is generated.** A field left blank stays blank in the note
  and in the PDF.
- **Symptom is not diagnosis.** The assessment block records the documented status
  — symptom only, screening encounter, abnormal finding pending, suspected,
  confirmed, history of disease, or unresolved/unconfirmed — and the ICD-11 entries
  carry their own mapping state, so a symptom is never coded as cancer, infection
  or infertility.
- **Validated tools carry their source.** The criteria field asks for name, source
  and version, so no tool is cited without identification.
- **Screening is separated from diagnosis** by an explicit purpose field, and
  cervical screening status includes overdue and not-applicable, with HPV
  vaccination recorded separately — one universal schedule is never assigned.

**Still outstanding for this specialty:** ACOG and RCOG document numbers and dates
could not be confirmed at source in this build, so no gynecology guidance is cited
by number; the ICD-11 catalogue covers endometriosis, benign genital tract
disorders, abnormal uterine bleeding, menopause, infertility and pelvic pain only,
so fibroids, ovarian masses, PCOS, prolapse, incontinence, genital infection,
cervical abnormality and malignancy must be mapped by the clinician from the WHO
browser and are stored as coding review required.