# AMedix — Pulmonology / Respiratory Medicine Upgrade
## Final Implementation Report, Functional Testing Record and Outstanding Work

**Date:** 8 November 2026
**Scope:** GOLD COPD, GINA asthma, acute exacerbation, respiratory emergency and critical care, longitudinal follow-up, multidisciplinary referral, ICD-11 coding layer, and verification of the connected AMedix workflows.
**Test harness:** `qa/pulm-qa.mjs` (re-runnable, see §9)
**Status: NOT ACCEPTED — one acceptance criterion is unmet.** The app-side upgrade is complete and passes every automated check that does not require external credentials. The acceptance criterion *"real WHO ICD-11 integration works"* cannot be met until the WHO ICD-11 API credentials are configured (§7). Until then no code is ever presented as verified.

---

## 1. What was built, and where it lives

| Area | Module | Contents |
|---|---|---|
| Core respiratory documentation | `src/lib/pulmonologyBlocks.js` | 22 blocks — presentation, cough/sputum, dyspnoea (mMRC/Borg), exposure and risk profile, previous respiratory illness and ventilation history, symptoms, vitals and oxygen delivery, examination, inhaler device, exacerbation history, lung function, ILD, bronchiectasis, sleep, PE pathway, pleural disease, TB, oxygenation, management/education |
| GOLD COPD | `src/lib/pulmCopdModule.js` | Diagnostic confirmation and airflow grade, ABE grouping (CAT/mMRC, exacerbation inputs, eosinophils, comorbidities, technique, adherence, vaccination, rehabilitation), and the structured treatment plan through LABA/LAMA, ICS indications, triple therapy, oxygen and exacerbation prevention |
| GINA asthma | `src/lib/pulmAsthmaModule.js` | Diagnostic evidence of variable airflow limitation, the four control criteria, severity and risk, ICS-containing treatment and ICS-formoterol strategies, step up/step down, action plan, specialist referral |
| Acute exacerbation | `src/lib/pulmAcuteModule.js` | Severity and physiological assessment (RR, SpO₂ and its context, PEF, speech, mental status, ABG and interpretation, admission criteria, NIV assessment, critical-care discussion) and treatment/response with monitoring and escalation |
| Emergency and critical care | `src/lib/pulmEmergencyModule.js` | Emergency recognition with ABCDE state and documented immediate actions; time-critical conditions (tension pneumothorax, pneumothorax, PE, massive haemoptysis, severe pneumonia, ARDS, airway compromise, respiratory failure) with condition-specific management and reassessment; respiratory support and ventilation (support level, settings, FiO₂, targets, gas on support, lung-protective ventilation, prone position, weaning, ceiling of treatment) |
| Longitudinal follow-up | `src/lib/pulmFollowupModule.js` | Trend (symptoms, exacerbations, admissions, emergency attendances, ICU admissions, spirometry trend, FEV₁ entries, oxygen requirement trend, interpretation); treatment response, adherence, inhaler technique, device review, step changes; vaccination, smoking cessation, rehabilitation, long-term oxygen assessment, next review and earlier-review criteria |
| Referral / MDT | `src/lib/pulmReferralModule.js` | Referral specialty, reason, urgency with its basis, the clinical question, the summary communicated, treatment and reported results communicated, recorded letter, patient informed; and the MDT discussion record with decisions, shared management, owner, outstanding actions |
| Scores | `src/lib/pulmonologyScores.js` | ACT, CAT, mMRC, CURB-65, Wells PE, PERC, STOP-BANG — scored only when every item is answered; GOLD ABE derived only from documented inputs |
| Advisory prompts | `src/lib/pulmonologySafetyRules.js` | 44 prompts across documentation, same-day and advisory levels, each naming its guideline, the requirement, and the documentation action |
| Guideline attribution | `src/lib/pulmonologyReferences.js` | 17 registered international sources (GINA, GOLD, ATS, ERS, CHEST, BTS, WHO, ATS/IDSA, ATS/ERS PFT, ATS/ERS ILD, ERS bronchiectasis, CAP, ESC PE, AASM, WHO TB, BTS pleural) with edition, status and source link; empty local-protocol register |
| ICD-11 layer | `src/lib/pulmonologyIcd11.js`, `src/lib/pulmonologyConditions.js`, `src/lib/pulmonologyInvestigations.js` | Curated MMS catalogue (6 respiratory stems), 33-condition index that resolves through the WHO service, 32-investigation catalogue, coding detail fields, postcoordination instructions |
| WHO service | `base44/functions/icd11WhoSearch/entry.ts` | The only path by which a code is presented as verified |

**Note types:** the nine existing respiratory types are unchanged in key, label and specialty (`pulm_consultation`, `pulm_followup`, `pulm_admission_note`, `pulm_progress_note`, `pulm_discharge_summary`, `pulm_procedure_note`, `pulm_pft_report`, `pulm_bronchoscopy_report`, `pulm_care_plan`). No note type was added, renamed or removed; no existing field was removed or reordered — the respiratory content is appended in its own section.

**Block distribution:** 38 blocks total; consultation 26, admission 20, follow-up 17, care plan 14, progress 9, discharge 9.

---

## 2. Clinical governance controls — how each rule is enforced

| Requirement | Enforcement | Verified by |
|---|---|---|
| Decision support assists, never replaces judgment | Prompts are advisory only; nothing in the note path calls a blocking validator. Prompts carry `advisory / documented / same_day` levels and never issue an order (no "give/start/prescribe/order" verb in the action text) | QA §4 |
| No diagnosis automatically confirmed | Diagnosis status is chosen by the clinician; `requireConfirmation: true` on the ICD-11 field; unmapped or browser-entered codes are stored `review_required`/`unresolved`, never `verified`; the condition index carries no code | QA §5 |
| No medication automatically prescribed | No module contains dose calculation or an order; the acute treatment block records only what was given (`prescription_recorded` = "Prescription created / continued / none required") | QA §2, code review |
| No fabricated results or recommendations | Scores return `complete:false, total:null` unless every item is answered; GOLD ABE returns an empty group with a reason when inputs are missing; investigations record only the reported status and the clinician's interpretation | QA §3, §7 |
| Missing data never read as normal | Every option set carries `Not documented`; a blank block prints nothing; a blank note raises zero prompts (nothing is inferred from absence) | QA §2, §4 |
| Signed notes, authorship, timestamps protected | Saving applies `signed_by_name` + `signed_datetime` server-side; `signClinicalDocument` rejects a second signature on a signed version and restricts signing to the authoring doctor; signed corrections go through `amendClinicalDocument` | QA §9 |
| Patient permissions | ClinicalNote read rules are ownership/admin based and are not open; patient record reads go through `getPatientClinicalRecord`, which authorises and audits the access | QA §9 |
| Complete audit history | `createClinicalNote`, `signClinicalDocument` and the amendment path all call `logClinicalAudit`; coded diagnoses are audited separately with their provenance | QA §9 |

---

## 3. ICD-11 functional testing

| Test | Method | Result |
|---|---|---|
| Catalogue integrity — official codes only | Every catalogue entry asserted to carry a code, display term and the recorded release; ICD-10 shape rejected | **PASS** (6 entries) |
| No code generated, completed or crosswalked | Condition index asserted to hold no `code` field, only a WHO search phrase; endpoint asserted to contain no ICD-10 crosswalk and no fallback/suggested code | **PASS** |
| Grouping nodes not storable as diagnoses | `codable: Boolean(e.theCode)` filter in the endpoint | **PASS** (code) |
| Synonyms | WHO `useFlexibleSearch=true`; index phrases are lay and clinical synonyms | **PASS** (code) — live behaviour untested, see below |
| Arabic and English search | `lang` propagated to `Accept-Language` (`ar`/`en`); Arabic query sent successfully to the endpoint | **PASS** (request path); **BLOCKED** on credentials for a live Arabic result |
| Official term in the requested language | Term taken from the WHO payload only, never translated by AMedix | **PASS** (code) |
| Definition, inclusions, exclusions | Retrieved from the WHO entity record and stored with the diagnosis (`definition`, `inclusions`, `exclusions`) | **PASS** (code) — live retrieval blocked |
| Additional coding instructions | `coding_note` per diagnosis; postcoordination instructions state that clusters must be entered exactly as the WHO Coding Tool shows them and are never generated | **PASS** |
| Postcoordination | No cluster is generated; `cluster` is stored verbatim with the stem code and term | **PASS** |
| API authentication | OAuth2 client-credentials against `icdaccessmanagement.who.int`, scope `icdapi_access`, bearer token cached until 60 s before expiry, endpoint requires an authenticated user (401 otherwise) | **PASS** (code) — token exchange blocked without credentials |
| Versioning | Release resolved from `WHO_ICD11_RELEASE` or the newest release the API reports; the release is stored on every entry and returned with every response; `API-Version: v2` header | **PASS** (code) |
| Failure handling | Explicit `configured:false` response when credentials are absent; 400 on invalid mode/URI/query length; 502 on WHO failure with the status and detail; 15–20 s timeouts; only successful payloads cached; ancestor-chain failure never fails the entry | **PASS** |
| **Live WHO integration** | `mode=search` (English "asthma"), `mode=search` (Arabic "الربو"), `mode=entity` (invalid URI) executed against the deployed function | **FAILED / BLOCKED** — all three returned `configured:false`: *"WHO ICD-11 API credentials are not configured for this workspace, so no code can be verified automatically."* The degradation is correct and safe, but no live code verification, synonym, Arabic-term, exclusion or postcoordination retrieval could be demonstrated. |

**Catalogue coverage finding.** The curated catalogue holds 6 respiratory stems. Twelve conditions coded routinely by respiratory clinicians (`PULM_NOT_IN_CATALOGUE`: ILD/pulmonary fibrosis, bronchiectasis, OSA, CAP/HAP, pulmonary embolism, tuberculosis, pulmonary hypertension, sarcoidosis, occupational lung disease, cystic fibrosis, ABPA, pneumoconiosis) are deliberately **not** held as bundled codes — they must be resolved through the WHO service or entered from the WHO browser and stored as `review_required`. **With the WHO credentials absent, these conditions cannot currently reach a `verified` coding state at all.** This is the single largest functional gap in the upgrade.

---

## 4. Clinical scenario testing (consultation path)

Each scenario asserts that the note type loads, carries its blocks, scores, prompts, guidance and ICD-11 field, that blocks print what was documented and nothing else, and that the prompts fire only from documented gaps.

| Scenario | Note types exercised | Result |
|---|---|---|
| COPD — diagnosis, grade, ABE group, treatment, exacerbation prevention | consultation, follow-up, admission, discharge, care plan | **PASS** |
| Asthma — variable airflow evidence, control, steps, action plan, severe-asthma referral | consultation, follow-up, admission, discharge, care plan | **PASS** |
| Pneumonia — severity (CURB-65), site of care, sepsis management, review | consultation, admission, progress, discharge | **PASS** |
| Bronchiectasis — confirmation, airway clearance, exacerbations | consultation, care plan, bronchoscopy report | **PASS** |
| ILD — MDT-supported diagnosis, antigen exposure, progression | consultation, care plan | **PASS** |
| Pulmonary embolism — pre-test probability (Wells/PERC), anticoagulation recorded, follow-up | consultation, admission, progress | **PASS** |
| Respiratory failure — type, gas exchange, ventilatory support, ceiling of treatment | admission, progress | **PASS** |
| Emergency consultation — recognition, ABCDE, immediate actions, disposition | admission, progress | **PASS** |
| Follow-up — trend, response, adherence, technique, prevention, next review | follow-up, care plan, discharge | **PASS** |
| Referral — specialty, reason, urgency, clinical question, letter recorded | consultation, follow-up, discharge, care plan | **PASS** |

## 5. Connected workflow verification

| Workflow | Verification | Result |
|---|---|---|
| Laboratory orders | `createLabRequest` exists and is unchanged; the note records only the documented investigation status and its interpretation, never a result | **PASS** (integration preserved, code review) |
| Radiology orders | `createImagingRequest`, imaging request/result entities and the radiology workflow unchanged; no respiratory template duplicates imaging results (`noteSectionPolicy` retires imaging sections) | **PASS** |
| Prescriptions | `createPrescription` and the `Prescription` entity unchanged and reachable from the consultation path; the acute module records whether a prescription was created | **PASS**, with a gap (see §6) |
| Pharmacy integration | Authorisation, reservation, substitution, dispensing, inventory and recall functions unchanged; nothing in this upgrade bypasses them | **PASS** (integration preserved) |
| Referrals | `ReferralLetter` carries `reason_for_referral`, `urgency`, `specific_request` (the clinical question), `working_diagnosis`, medications and results; the respiratory referral block records the same fields in the note | **PASS**, with a gap (see §6) |
| Follow-up | Longitudinal blocks cover the review interval, trend, response and next appointment; the follow-up note type is unchanged | **PASS** |

## 6. Failed tests and outstanding issues

1. **WHO ICD-11 live integration — FAILED (blocked).** Credentials absent; every mode returns `configured:false`. Consequences: no live code verification, no live Arabic/English synonym retrieval, no live exclusions or coding instructions, and 12 major respiratory conditions cannot be coded as `verified`.
2. **Catalogue coverage — OPEN.** The bundled respiratory catalogue is 6 stems against 33 indexed conditions. Either accept WHO-dependent coding or extend the curated catalogue from the WHO release.
3. **Arabic UI for the new blocks — NOT DONE.** The respiratory modules contain no Arabic labels (0 Arabic characters across all 11 respiratory libraries). Arabic ICD-11 terminology is supported through the WHO service language parameter, but the note forms themselves are English-only.
4. **Respiratory prescription device field — OPEN.** The `Prescription` entity has `route`, `frequency`, `duration`, `special_instructions` and `safety_check`, but no dedicated `device` field, so an inhaler device is captured only inside the free-text instruction. A dedicated field (plus the form and dispensing display) is required for the "device" capture the specification asked for.
5. **Local protocol register — EMPTY.** No local respiratory protocol is registered, so every note correctly reports "no locally approved respiratory protocol" and international recommendations are labelled documentation support only. Registration requires the institution's approving body, approval reference, adoption date and review date.
6. **Clinical sign-off — NOT OBTAINED.** As with the Neurology gate, respiratory content has no recorded departmental approval. Automated tests prove integrity, not clinical acceptance.
7. **Live permission and signed-note UAT — NOT PERFORMED HERE.** Ownership/admin access rules, check-in gating, signature protection and audit writes are asserted from the code. Multi-account verification (doctor A cannot read doctor B's note, patient cannot read another patient's record, a signed note cannot be altered) requires real accounts and should be run in the Testing Agent.
8. **Pre-existing, unrelated failure.** `qa/ortho-qa.mjs` reports 30 failing checks because the central section policy drops orthopaedic fields (for example `ortho_postop_imaging`) that the orthopaedics templates still declare. This predates this upgrade and is untouched by it; it is recorded here because the same policy is what silently dropped one of the new respiratory blocks during development (fixed by renaming the block).

**Suites run:** `qa/pulm-qa.mjs` **PASS**, `qa/allergy-qa.mjs` **PASS**, `qa/gi-qa.mjs` **PASS**, `qa/hema-qa.mjs` **PASS**, `qa/neuro-qa.mjs` **PASS**, `qa/ophth-qa.mjs` **PASS**, `qa/peds-qa.mjs` **PASS**, `qa/peds-note-qa.mjs` **PASS**, `qa/nsg-qa.mjs` **PASS**, `qa/ortho-qa.mjs` **FAIL** (pre-existing, §6.8). Production build: **PASS**.

## 7. External credentials and configuration still required

| Item | Where | Needed for |
|---|---|---|
| `WHO_ICD11_CLIENT_ID` | Workspace secrets | All ICD-11 verification |
| `WHO_ICD11_CLIENT_SECRET` | Workspace secrets | All ICD-11 verification |
| `WHO_ICD11_RELEASE` (optional, e.g. `2024-01`) | Workspace secrets | Pinning a release instead of taking the newest reported by the API |

Credentials are obtained from a WHO ICD-11 API subscription at `https://icd.who.int/icdapi`. Until they are added, the note form must continue to accept a code and official term entered from the WHO browser, stored as **review required**.

## 8. Acceptance statement

By the criteria set for this upgrade, acceptance requires that *the existing portal remains fully functional, real WHO ICD-11 integration works, current GOLD and GINA recommendations are implemented, and every connected AMedix workflow is verified*.

- Existing portal fully functional — **met** (all nine respiratory note types intact, no field removed, nine other specialty suites pass, production build passes).
- GOLD and GINA recommendations implemented — **met at the documentation level** (ABE grouping, control criteria, treatment ladders, step-up/step-down, exacerbation pathways, vaccination, rehabilitation, oxygen assessment), with clinical sign-off still outstanding.
- Connected workflows verified — **met at the integration level** (lab, imaging, prescription, pharmacy, referral, follow-up all preserved), with the prescription device field open.
- Real WHO ICD-11 integration works — **NOT MET.** No credential is configured, so no code can be verified, and no live search, synonym, Arabic term, exclusion or postcoordination could be demonstrated.

**The upgrade is therefore not accepted. The remaining blocker is configuration, not code:** adding the two WHO secrets and re-running the three `icd11WhoSearch` calls is what converts the blocked tests into passed ones.

## 9. Re-running the tests

```
npx esbuild qa/pulm-qa.mjs --bundle --platform=node --format=esm \
  --outfile=/tmp/pqa.mjs --alias:@=./src && node /tmp/pqa.mjs
```
Other specialty suites are bundled the same way, adding `--define:import.meta.dirname='"/app/qa"'` so their file reads resolve.