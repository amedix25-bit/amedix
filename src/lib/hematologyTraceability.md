# Hematology — traceability record

## What was changed, and what was not

The existing Hematology specialty system is preserved. The eight note types in
`src/lib/specialtyDocumentsPart4.js` keep their keys, labels, order and every
field they already had. `/qa/hema-qa.mjs` reads that file, extracts the original
field keys of each note, runs the enhancement over them and fails if a single
original field is missing or duplicated.

| Note key | Original fields | ICD-11 field appended |
|---|---|---|
| `hema_consultation` | 11 | 1 |
| `hema_followup` | 8 | 1 |
| `hema_progress_note` | 8 | 1 |
| `hema_transfusion_record` | 13 | 1 |
| `hema_infusion_record` | 8 | 1 |
| `hema_bone_marrow_record` | 11 | 1 |
| `hema_treatment_plan` | 9 | 1 |
| `hema_discharge_summary` | 8 | 1 |

No entity, relationship, permission, workflow or saved record was modified. The
coded diagnoses are written to the existing `ClinicalNote.icd11_coded_diagnoses`
array by the existing save path — the same array Ophthalmology, Cardiology,
Gastroenterology, Nephrology and the other upgraded specialties already use.

## ICD-11 classification layer

- Standard: WHO ICD-11 MMS, release 2026-01, canonical URI
  `http://id.who.int/icd/release/11/mms`. No ICD-10 entry point and no crosswalk.
- Chapters: 03 (blood and blood-forming organs), 02 (haematopoietic and lymphoid
  neoplasms, 2A20–2B3Z), 04 (selected immune and eosinophil categories).
- Catalogue: `src/lib/hematologyIcd11.js`. 13 domains, per-note domain filtering
  so a transfusion record never offers an acute leukaemia category.
- Every entry stores code, WHO display term, release, source, verification date,
  specificity, hierarchy (chapter → group → family → parent), coding instruction
  and mapping state.

### Where each code came from

Two published ICD-11 MMS listings were consulted, and **only codes present in a
published listing are in the catalogue**:

1. ICD-11 MMS code system published with the Kenya ePrescription FHIR
   implementation guide (WHO MMS codes and display terms).
2. ICD-11 classification mapping, KEGG BRITE `br08403` — *Human Diseases in ICD-11
   Classification*.

Where the two listings agree, the entry is **verified**. Where they differ on the
wording or scope of a code, the entry is stored as **review required** with the
conflict written into its coding note — it is never presented as verified. The
review-required entries are `3A03`, `3B12` (von Willebrand disease vs type 3),
`3B20` (DIC vs acquired fibrinogenopenia), `3B22` (acquired haemophilia vs
acquired factor XIII deficiency), `2A30`, `2A36` and `2A61`.

### What is deliberately absent

`HEMA_NOT_IN_CATALOGUE` names the families whose exact MMS code could not be
confirmed from a published listing: neutropenia and febrile neutropenia, ITP,
TTP/HUS, the transfusion reactions, HLH, GVHD and post-transplant states, iron
overload, sickle cell genotypes and crisis types, leukaemia/lymphoma/myeloma
subcategories, red cell membrane and enzyme defects, other acquired inhibitors,
and haematological disorders in pregnancy. These are not guessed. The clinician
takes the code from the WHO browser; the note stores it with its source and flags
it as review required until it is checked.

**Known limitation to state plainly:** the catalogue is not the whole of ICD-11
haematology, and it was not compiled from the WHO tabulation page by page. It is
a subset of published, traceable codes plus an explicit, visible route for
everything else. Any entry marked review required must be confirmed in the
browser before it is relied on clinically.

## Rules enforced by the field

1. A code never confirms a diagnosis — entries start as *Suspected*; the clinician
   records status (Confirmed / Suspected / Provisional / Differential /
   Historical / In remission / Relapsed or refractory) and the clinical basis.
   A *Confirmed*, *Resolved* or *In remission* entry requires a documented basis.
2. A confirmed diagnosis needs a verified code, or the documented reason it has
   none — an unmapped diagnosis is kept with no code and flagged for coding
   review, never approximated.
3. A less specific category than the catalogue offers must be justified before it
   saves as confirmed (`unspecifiedJustification`).
4. Duplicates are prevented by code; role separates primary, secondary,
   differential, complication, comorbidity and associated condition.
5. Postcoordination is recorded only when the WHO Coding Tool produced a cluster,
   copied exactly. The app never assembles a cluster and never rewrites a stem.
6. Detail the code cannot carry — subtype, cytogenetic/molecular finding, disease
   phase, therapy-related status, transfusion dependence, severity or grade,
   complications, associated conditions — is recorded beside the code in its own
   fields.

## Verification

```
node qa/hema-qa.mjs
```

Checks the eight notes are append-only and key-unique, every original field
survives, the catalogue has unique and well-formed codes with no ICD-10-style
codes, every entry carries release/source/verification date and a valid state,
review-required entries state why, parent links resolve, domain filtering does not
leak, the uncatalogued families are declared, and `specialtyDocuments.js` really
applies the standards.

## Still to do (next paragraphs)

- American Society of Hematology reference register and guideline attribution per
  note, with edition/version stated and no claim of ASH endorsement.
- Haematology-specific structured blocks, safety prompts and scores.
- Arabic patient-facing terms for the haematology note content.