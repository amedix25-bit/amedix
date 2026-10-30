// The documentation standards register the Ophthalmology Department reviews.
//
// Each entry is one existing note type, its version, the guidance its content is
// mapped to, and the ICD-11 release its diagnoses are coded against. The register
// is derived from the same definitions the note form uses — it is not a written
// description that can drift away from the templates.
//
// Two different things are recorded here and must never be read as each other:
//   TECHNICAL VERIFICATION — the standard built, wired and checked by the app
//   (the integrity script and the production build).
//   CLINICAL APPROVAL — the Head of the Ophthalmology Department has reviewed the
//   standard and recorded a decision. Until that decision exists, a standard is
//   NOT department-approved, whatever the technical checks show.

import { SPECIALTY_DOCUMENTS } from "./specialtyDocuments.js";
import { OPHTH_REFERENCES, ophthNoteBasis } from "./ophthalmologyReferences.js";
import { OPHTH_ICD11, OPHTH_ICD11_MMS } from "./ophthalmologyIcd11.js";

export const OPHTH_STANDARD_VERSION = "AMedix Ophthalmology documentation standard — rev 1 (2026-10)";

export const OPHTH_TECHNICAL_VERIFICATION =
  "Fields, blocks, safety prompts and ICD-11 entries are checked by the module integrity script and the production build. This is technical verification only.";

export const ophthStandards = () =>
  SPECIALTY_DOCUMENTS.filter((doc) => String(doc.key || "").startsWith("ophth_")).map((doc) => {
    const basis = ophthNoteBasis(doc.key);
    const references = ((basis && basis.basis) || []).map((b) => {
      const ref = OPHTH_REFERENCES[b.key] || {};
      return {
        key: b.key,
        organization: ref.organization || "",
        title: ref.title || "",
        edition: ref.edition || "",
        revision_verified: Boolean(ref.revision_verified),
        applies: b.note || "",
      };
    });
    return {
      key: doc.key,
      label: doc.label,
      version: OPHTH_STANDARD_VERSION,
      field_count: (doc.fields || []).length,
      references,
      icd_system: "WHO ICD-11 MMS",
      icd_release: OPHTH_ICD11_MMS.release,
      icd_catalogue_size: OPHTH_ICD11.length,
    };
  });

export const OPHTH_STANDARD_KEYS = () => ophthStandards().map((s) => s.key);