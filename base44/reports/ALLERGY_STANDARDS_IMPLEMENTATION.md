# Allergy & Immunology — guideline-based documentation and decision-support upgrade

**Date:** 2026-11-08
**Scope:** additive. No existing note type, template, field, workflow, permission or saved record was changed, reorganised or removed.

---

## 1. What the request asked for, and where it landed

| Requested capability | Implementation | Governance position |
| --- | --- | --- |
| Structured documentation blocks aligned to AAAAI/ACAAI, GINA, WAO, ARIA, ICD-11 | 11 blocks + 11 note types (already present) plus the new **Treatment & Management** module and 3 additional advisory prompts | Blocks record; they do not conclude |
| Specialty-specific investigation and safety prompt modules as **additive** fields | `allergy_tests` (10 test groups) and `allergy_safety` (now 18 prompts); treatment documentation module added alongside | Nothing pre-existing was replaced |
| Real-time verification of ICD-11 codes against the **official WHO API** | `icd11WhoSearch` backend function (OAuth2 client-credentials against `icd.who.int`, server-side only) + in-note `Icd11WhoSearch` picker | A code exists only if the WHO service returned it, with release, URI and retrieval timestamp recorded |
| Store the retrieval context beside the code | `release`, `system_uri`, `source`, `verified_date` on the coded diagnosis; `who_release`/`retrieved_datetime` in the note field value | Auditable provenance |
| Treatment and management modules, **adult and paediatric separately**, no automated dose calculation | `allergy_treatment` field: adult dose/frequency/duration and paediatric dose/age band/weight basis/frequency/duration recorded independently, plus monitoring, cautions, rationale, review date | `DOSING_RULE` states in the UI that no calculation or conversion is performed |
| Dependence on **existing AMedix safety checks** rather than a second checker | The module documents; prescribing stays in the existing prescription flow with `checkMedicationSafety`, the allergy/contraindication checks and clinician approval | No parallel prescriber, no order created |
| Clinical references library with **source attribution and status**, linking to originals | 17 governed references, `ClinicalReference` entity seeded, page at `/clinical-references`, inline links from each guidance block | Metadata and links only — no document is copied, hosted or redistributed |
| Distinguish current from superseded guidance | Status `current` / `superseded` / `under_review`; a superseded reference names its successor; the note UI shows a warning for anything not current | Unconfirmed editions are shown as `under_review`, never as current |

---

## 2. What was deliberately not done

1. **No code is generated, completed or inferred.** Without a WHO response the field says so and stores nothing as verified.
2. **No dose, conversion or weight-based calculation** — the paediatric weight basis is recorded so the clinician's arithmetic can be audited, not performed.
3. **No automated treatment recommendation.** The class list is a documentation vocabulary, not an order set.
4. **No clinical content was invented to fill a gap.** Where an edition year could not be confirmed from the issuing body, the year is left empty and the status is `under_review`.
5. **No copyrighted guideline text is stored.** The library holds citations, links and the status assessment only.
6. **No specialty other than Allergy & Immunology was touched**; the only shared-file edits are the renderer branch, the print formatter and the router entry.

---

## 3. Outstanding items

| Item | Owner | Note |
| --- | --- | --- |
| WHO ICD-11 API credentials (`WHO_ICD11_CLIENT_ID`, `WHO_ICD11_CLIENT_SECRET`, optional `WHO_ICD11_RELEASE`) | Workspace owner | Until added, verification reports "not configured" and typed-in codes are stored as `review_required` |
| Confirm each reference's current edition and update `last_verified_date` | Allergy lead | 9 of 17 references are intentionally `under_review` pending this check |
| Review the 18 advisory prompts and the treatment class list | Allergy lead | Prompts are advisory and never block |
| Paediatric review of the separate paediatric dosing documentation | Paediatric allergy lead | No calculation is performed by the platform |
| Coding review of `review_required` diagnoses | Coding lead | Existing queue still outstanding |