# Neurosurgery documentation — automated verification record

Scope: the 19 neurosurgery note types, the structured examination and ISNCSCI/ASIA blocks,
the ten time-critical emergency pathways, the ten procedure-specific operation-record blocks,
the post-operative monitoring blocks (full and monitoring-only), the advisory safety prompts,
the validated scores, and the save/print formatters.

Run: `npx esbuild qa/nsg-qa.mjs --bundle --platform=node --format=esm --outfile=/tmp/qa.mjs --alias:@=./src && node /tmp/qa.mjs`

## Result

```
notes=19 rules=36 scores=7 emergencyPresentations=10 procedures=10
ALL CHECKS PASSED
```

## What is asserted

1. **Note availability** — all 19 note types survive the section policy, and no structured module
   (`nsg_exam`, `nsg_isncsci`, `nsg_emergency`, `nsg_operative`, `nsg_postop`, `nsg_guidance`,
   `nsg_icd11`, `nsg_scores`) is silently retired or dropped.
2. **Note integrity** — every note carries a guideline-guidance block and an ICD-11 diagnosis entry,
   has an examination or operation record, unique field keys, a label on every field, and at least
   two options on every dropdown.
3. **Emergency pathways** — 10 presentations, each with at least six documented sections; the flags
   for herniation, airway, imaging, specialist discussion, transfer decision and responsible
   clinician behave in both directions (missing values raise, documented values stay silent).
4. **Operation record** — the full record renders in seven sections, every procedure type adds at
   least two procedure-specific blocks, and the implant, consent, swab/instrument count, drain and
   post-operative neurological status flags are checked both raised and cleared.
5. **Post-operative monitoring** — the monitoring-only variant exposes two sections and the full
   variant at least four; the flags for observation interval, deterioration, pupil change, CSF leak,
   bleeding, infection, drain function, seizure, threshold criteria and responsible clinician behave
   in both directions; an empty record formats to an explicit “not documented” line rather than
   silently rendering nothing.
6. **Advisory prompts** — 36 rules. Each of nine prompts is confirmed to fire on the missing
   documentation it is written for, the *same* values recorded flat on an older note still raise the
   prompt, and a fully documented note raises none of them.
7. **Formatters and scores** — every formatter is run on empty, partial and undefined values without
   throwing; ISNCSCI returns an assessment; all seven scores return a value on empty input and the
   indicated-score helper returns a list.

## Clinical verification still required

This record proves the documentation structure, the safety logic and the output are intact and
behave as written. It does not substitute for clinical sign-off:

- Neurosurgical lead sign-off on the documentation content and the safety guidance wording.
- End-to-end UAT by a neurosurgeon on one note of each type.
- Pre-verified ICD-11 MMS code subsets for neurosurgery remain outstanding; codes entered from the
  WHO browser stay `review_required` until they are checked against the catalogue.