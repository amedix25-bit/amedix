# Urology Portal — Implementation Report

**Scope:** strengthen the existing Urology portal (structured documentation, examination,
oncology staging, ICD-11 coding, calculations, advisory safety, guideline basis) without
recreating, renaming or removing anything that was already shipped.

**Status:** implemented and verified by automated checks. Not yet clinically signed off —
see *Open items*.

---

## 1. What was already there (audited first, kept intact)

The portal shipped **9 urology note types** and no specialty clinical layer:

| Key | Template |
|---|---|
| `uro_consultation` | Urology Consultation |
| `uro_followup` | Urology Follow-Up |
| `uro_procedure_note` | Urologic Procedure Note |
| `uro_operative_note` | Operative Note (Urology) |
| `uro_preop_assessment` | Pre-Operative Assessment (Urology) |
| `uro_postop_note` | Post-Operative Note (Urology) |
| `uro_catheter_device_record` | Catheter / Device Record |
| `uro_discharge_summary` | Discharge Summary (Urology) |
| `uro_referral` | Urology Referral *(retired by the pre-existing note-section policy — the Referral Letter module owns it)* |

Their keys, labels, order and every existing field are unchanged. The clinical layer was
**appended** to them only (`URO_ENHANCEMENTS` → `withUrologyStandards`), so a note saved
before this upgrade keeps its meaning and every view, report and PDF that reads a note by
key keeps working.

## 2. What was added

| Area | Delivered |
|---|---|
| Note types | **43** urology documents in the catalogue: the 9 existing + **35 added** (urological oncology, stone clinic/metabolic, LUTS/BPH, female & functional urology, neuro-urology & urodynamics, andrology & sexual medicine, reconstructive, paediatric, transplant-related, emergency urology, tumour board, surveillance, second opinion, follow-up) |
| Structured blocks | **25** blocks / **305** fields (stone record, metabolic stone risk, LUTS/BPH, bladder diary, urodynamics, neuro-urology, andrology & sexual, Peyronie, male infertility, reconstructive, paediatric, transplant, emergency, oncology tumour & treatment history) |
| Examination | **5** groups / **30** elements. Every element is recorded as **Normal / Abnormal / Not performed / Not applicable / Not documented** — an element not performed can never be stored or read back as normal |
| ICD-11 | **12** condition groups, **104** portal conditions for coding, routed through the existing central AMedix ICD-11 service (`Icd11Term` / `Icd11Release`, local search, release recorded per code). No code is generated, completed or substituted; unresolved diagnoses are stored without a code and flagged for coding review |
| Calculations | **7** instruments: IPSS, PSA density, PSA kinetics, prostate volume, eGFR (CKD-EPI 2021), Charlson, post-void residual / voiding efficiency. Each refuses to calculate with missing inputs and states so |
| Advisory safety | **17** deterministic prompts (infected obstruction, urosepsis, acute retention, torsion, deteriorating renal function, significant haematuria, renal trauma, priapism, postoperative deterioration, suspected malignancy, renal dose review, antimicrobial stewardship, pregnancy caution, duplicate therapy, antimuscarinic + retention, retained stent, paediatric medication caution). Advisory only: no dose figure, no order, no diagnosis |
| Oncology | Staging fields for **8** tumour types (prostate, NMIBC, MIBC/metastatic, renal, UTUC, testis, penile, urethral) + tumour-board and surveillance records. Categories are recorded, never derived into a stage group or prognosis |
| Evidence | **28** registered references (EAU primary, with AUA, ESMO, NCCN, KDIGO, ESHRE, ICS, WHO). Publication years are left unrecorded rather than invented |
| Confidentiality | The 5 andrology notes use the existing confidential-document policy — same permissions, access control and audit trail as other confidential notes |

## 3. Verification

Two harnesses assert properties of the **shipped** code (not of the harness):

```
npx esbuild qa/uro-qa.mjs        --bundle --platform=node --format=esm --outfile=/tmp/a.mjs --alias:@=./src && node /tmp/a.mjs
npx esbuild qa/uro-scenarios.mjs --bundle --platform=node --format=esm --outfile=/tmp/b.mjs --alias:@=./src && node /tmp/b.mjs
```

- `qa/uro-qa.mjs` — **1,456 checks passed, 0 failed**: catalogue integrity, append-only
  preservation of all 9 originals (key + delivered fields), unique field keys, sections
  surviving the note-section policy, ICD coverage checklist, calculator arithmetic and
  refusal, prompt firing and negative cases, staging completeness, and confidentiality.
- `qa/uro-scenarios.mjs` — **1,437 checks passed, 0 failed**: six representative clinical
  cases driven through the real modules (obstructed infected kidney, LUTS/BPH clinic,
  muscle-invasive bladder work-up, andrology/priapism, paediatric & examination states,
  plus the full per-note assembly audit).
- `npx vite build` — exit 0.

### Defect found and fixed by the checks

`uroSafetyRules.js` used `str()` in the infected-obstruction rule without importing it, so
that prompt threw and was swallowed by the evaluator — an obstructing infected stone with
no free-text mention of "obstruction" raised **no** prompt. The import was added and the
rule now reads the structured stone record (obstruction grade, hydronephrosis, stone
documented). Verified by scenario A.

## 4. Open items (require clinical involvement — not automatable)

1. **UAT by a urologist** on one note of each type, in the portal, before clinical use.
2. **Local protocol approval.** The 28 references are *international* documentation
   support. Any local protocol must be entered with its approving body, approval reference,
   adoption and review dates; until then the portal shows no local protocol as approved.
3. **ICD-11 coverage.** Only **3** codes are bundled as workspace-verified for release
   `2024-01`; the other 101 conditions resolve through the central service and stay
   review-required. An official WHO export can be imported by an administrator to expand
   coverage — AMedix itself never invents a code.
4. **Triage thresholds** used by the prompts (temperature ≥ 38 °C, residual ≥ 200 mL,
   priapism ≥ 4 h) follow the cited sources and need explicit urology sign-off as local
   thresholds.

## 5. Guard rails respected

Clinical decision support assists, never replaces judgement: no diagnosis is confirmed,
no medication prescribed or dosed, no result or stage fabricated. Missing data is never
presented as normal. Signed notes, authorship, timestamps, patient permissions and audit
history are untouched by this work.