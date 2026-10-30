// Strengthening the EXISTING Hematology note types — ICD-11 coding layer.
//
// The eight templates in src/lib/specialtyDocumentsPart4.js — Hematology
// Consultation, Follow-Up, Progress Note, Transfusion Record, Infusion Record,
// Bone Marrow Procedure Record, Treatment Plan and Discharge Summary — are NOT
// recreated, renamed, replaced or reorganised. Their keys, labels, order and
// every existing field stay exactly as they are, so saved notes keep their
// meaning and every report that reads a note by key keeps working. This module
// only APPENDS one field to each.
//
// WHAT IS APPENDED
// A structured Primary & Secondary Diagnoses field coded to WHO ICD-11 MMS, with
// the specialty's own statuses, roles and detail fields, added to every note type
// so coding is consistent across the consultation, the ward note, the procedure
// record, the treatment plan, the discharge summary — and therefore across the
// laboratory requests, referrals and inpatient records the note is linked to.
// The existing free-text "Assessment" / "Diagnosis" fields are untouched: the
// coded entry is stored machine-readably beside them in
// ClinicalNote.icd11_coded_diagnoses, so nothing has to be re-parsed from prose.
//
// CODING RULES ENFORCED BY THE FIELD (see hematologyIcd11.js for the catalogue)
//   - WHO ICD-11 MMS only; no ICD-10 entry point and no crosswalk.
//   - Code, WHO display term, release and source are stored with every entry.
//   - A code never confirms a diagnosis: entries start as Suspected and the
//     clinician records the status and the clinical basis.
//   - A confirmed diagnosis needs a verified code, or the documented reason it
//     has none; a less specific category than the catalogue offers must be
//     justified before it saves as confirmed.
//   - Duplicates are prevented by code, and a diagnosis that cannot be mapped is
//     kept with no code and flagged for coding review rather than approximated.
//   - Postcoordination is recorded only when the WHO Coding Tool produced a
//     cluster, copied exactly — the app never assembles one.
//
// NOT DONE HERE (deliberately, and stated): no ASH reference attribution is
// attached yet and no guideline prompts are added. This module carries the
// classification layer only.

import {
  hematologyCatalogFor,
  HEMA_ICD11_MMS,
  HEMA_ICD_STATUSES,
  HEMA_ICD_ROLES,
  HEMA_ICD_DETAIL_FIELDS,
  HEMA_ICD_CATALOG_NOTE,
  HEMA_ICD_CLUSTER_NOTE,
} from "./hematologyIcd11.js";
import { HEMA_CLINICAL_SECTIONS } from "./hematologyClinicalSections.js";

const ALL_DOMAINS = [
  "erythroid",
  "haemolytic",
  "haemoglobinopathy",
  "marrow_failure",
  "erythrocytosis",
  "coagulation",
  "platelet",
  "thrombotic",
  "eosinophil_mast",
  "spleen",
  "myeloid_neoplasm",
  "lymphoid_neoplasm",
  "plasma_cell",
];

const icdBlock = (domains, placeholder) => [
  {
    key: "icd11_diagnoses",
    label: "Primary & Secondary Diagnoses (ICD-11 MMS)",
    type: "icd11_diagnoses",
    catalog: hematologyCatalogFor(domains),
    searchPlaceholder: placeholder,
    catalogRelease: HEMA_ICD11_MMS.release,
    catalogNote: HEMA_ICD_CATALOG_NOTE,
    statuses: HEMA_ICD_STATUSES,
    roles: HEMA_ICD_ROLES,
    extraFields: HEMA_ICD_DETAIL_FIELDS,
    clusterEnabled: true,
    clusterNote: HEMA_ICD_CLUSTER_NOTE,
    requireConfirmation: true,
    unspecifiedJustification: true,
  },
];

// One entry per note type: the domains that note can legitimately code, so the
// search offers what belongs on the note and nothing else.
export const HEMA_ENHANCEMENTS = {
  hema_consultation: () =>
    icdBlock(ALL_DOMAINS, "Search ICD-11 — anaemia, thalassaemia, CML, myeloma, thrombocytopenia, VWD…"),
  hema_followup: () =>
    icdBlock(ALL_DOMAINS, "Search ICD-11 — the diagnosis this review follows…"),
  hema_progress_note: () =>
    icdBlock(ALL_DOMAINS, "Search ICD-11 — the active diagnosis on this ward day…"),
  hema_transfusion_record: () =>
    icdBlock(
      ["erythroid", "haemolytic", "haemoglobinopathy", "marrow_failure", "platelet", "coagulation", "thrombotic"],
      "Search ICD-11 — the indication for this transfusion, and any reaction being documented…",
    ),
  hema_infusion_record: () =>
    icdBlock(
      ["erythroid", "haemolytic", "haemoglobinopathy", "marrow_failure", "lymphoid_neoplasm", "plasma_cell"],
      "Search ICD-11 — the diagnosis this infusion treats…",
    ),
  hema_bone_marrow_record: () =>
    icdBlock(
      ["marrow_failure", "erythroid", "myeloid_neoplasm", "lymphoid_neoplasm", "plasma_cell"],
      "Search ICD-11 — the diagnosis the marrow is being examined for…",
    ),
  hema_treatment_plan: () =>
    icdBlock(
      [
        "myeloid_neoplasm",
        "lymphoid_neoplasm",
        "plasma_cell",
        "marrow_failure",
        "haemoglobinopathy",
        "haemolytic",
        "coagulation",
        "thrombotic",
      ],
      "Search ICD-11 — the diagnosis the treatment plan addresses…",
    ),
  hema_discharge_summary: () =>
    icdBlock(ALL_DOMAINS, "Search ICD-11 — the admission and discharge diagnoses…"),
};

// Appends — never replaces — so a saved note keeps every field it already had.
// Two layers are appended to each note type, in this order: the ICD-11 coding
// field, then the strengthened clinical sections (history, findings, reported
// results, reasoning, condition block, management, follow-up).
export const withHematologyStandards = (docs) =>
  docs.map((doc) => {
    const extra = HEMA_ENHANCEMENTS[doc.key];
    const sections = HEMA_CLINICAL_SECTIONS[doc.key];
    if (!extra && !sections) return doc;
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const candidates = [...(extra ? extra() : []), ...(sections ? sections() : [])];
    const additions = candidates.filter((f) => {
      if (existing.has(f.key)) return false;
      existing.add(f.key);
      return true;
    });
    if (!additions.length) return doc;
    return { ...doc, fields: [...(doc.fields || []), ...additions] };
  });