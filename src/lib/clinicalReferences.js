// Clinical References Library — the register behind the reference page.
//
// Each entry records who issued the guidance, its official title and topic, the
// version and dates the issuing body states, the official source URL, when
// AMedix last checked it, and its status. The library LINKS to the original
// publication and never hosts, copies or redistributes the document.
//
// STATUS RULES (deliberately strict)
//   current      the version recorded is the one the issuing body publishes, and
//                it was checked on last_verified_date;
//   superseded   a newer version exists — the superseding reference is named;
//   under_review the current version or its publication year could not be
//                confirmed from the issuing body's own pages, so it must never
//                be presented as current until it is checked.
// A year is recorded only when the issuing body states it. An unknown year is
// left empty and the reference sits under review — it is never estimated.

import { ALLERGY_REFERENCES } from "@/lib/allergyReferences";

export const REFERENCE_STATUS = {
  CURRENT: "current",
  SUPERSEDED: "superseded",
  UNDER_REVIEW: "under_review",
};

export const REFERENCE_STATUS_LABEL = {
  current: "Current",
  superseded: "Superseded",
  under_review: "Under review",
};

export const REFERENCE_STATUS_TONE = {
  current: "border-emerald-300/70 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
  superseded: "border-red-300/70 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300",
  under_review: "border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
};

// Per-reference governance decision: what was actually checked. Kept explicit
// rather than inferred from the status string, so the reasoning is auditable.
const GOVERNANCE = {
  who_icd11: {
    status: "current",
    year: null,
    note:
      "Classification release browsed and the WHO ICD-11 API used for verification. The release actually used for a code is stored on the diagnosis itself, from the API response.",
    access: "WHO browser and ICD-11 API subscription",
  },
  wao_anaphylaxis: { status: "current", year: 2020, note: "2020 WAO guidance; checked against the WAO publications page.", access: "Open access on the issuing body's site" },
  eaaci_anaphylaxis: { status: "current", year: 2021, note: "2021 EAACI anaphylaxis guideline.", access: "Journal publication — publisher's terms apply" },
  urticaria: { status: "current", year: 2021, note: "2021 revision and update, published 2022.", access: "Journal publication — publisher's terms apply" },
  hae: { status: "current", year: 2021, note: "WAO/EAACI 2021 revision.", access: "Open access on the issuing body's site" },
  eaaci_food: {
    status: "superseded",
    year: 2014,
    note: "The 2014 EAACI food allergy and anaphylaxis series is retained for attribution of older notes only. Later EAACI documents govern current practice.",
    superseded_by: "eaaci_anaphylaxis",
    access: "Journal publication — publisher's terms apply",
  },
  gina: {
    status: "under_review",
    year: null,
    note:
      "GINA revises the strategy report annually. The report used in this build was current at the last check (2026-11); confirm the latest annual report before relying on it.",
    access: "Free registration on the issuing body's site",
  },
  aria: {
    status: "under_review",
    year: null,
    note: "ARIA publishes implementation updates between guideline editions; confirm the current edition.",
    access: "Open access on the issuing body's site",
  },
  iuis_iei: {
    status: "under_review",
    year: null,
    note: "The IUIS phenotypical classification is updated periodically; confirm the current version and its year.",
    access: "Open access on the issuing body's site",
  },
  eaaci_ait: {
    status: "under_review",
    year: null,
    note: "The EAACI allergen immunotherapy guideline series covers several products and routes; confirm the edition that applies.",
    access: "Journal publication — publisher's terms apply",
  },
  icon_ait: {
    status: "under_review",
    year: null,
    note: "International consensus document; confirm the current edition and its year.",
    access: "Open access on the issuing body's site",
  },
  aaaai_anaphylaxis: { status: "under_review", year: null, note: "Practice parameter update — the exact edition year was not confirmed from the issuing body's own page at the last check.", access: "Journal publication — publisher's terms apply" },
  aaaai_drug: { status: "under_review", year: null, note: "Practice parameter update — the exact edition year was not confirmed from the issuing body's own page at the last check.", access: "Journal publication — publisher's terms apply" },
  aaaai_food: { status: "under_review", year: null, note: "Practice parameter — the exact edition year was not confirmed from the issuing body's own page at the last check.", access: "Journal publication — publisher's terms apply" },
  aaaai_iei: { status: "under_review", year: null, note: "Practice parameter — the exact edition year was not confirmed from the issuing body's own page at the last check.", access: "Journal publication — publisher's terms apply" },
  atopic_dermatitis: { status: "under_review", year: null, note: "Practice parameter and EAACI guideline series — the edition years were not confirmed at the last check.", access: "Journal publication — publisher's terms apply" },
};

const TOPICS = {
  who_icd11: "ICD-11 classification and coding",
  wao_anaphylaxis: "Anaphylaxis",
  eaaci_anaphylaxis: "Anaphylaxis",
  aaaai_anaphylaxis: "Anaphylaxis",
  urticaria: "Urticaria",
  hae: "Hereditary angioedema",
  eaaci_food: "Food allergy",
  aaaai_food: "Food allergy",
  aaaai_drug: "Drug allergy",
  gina: "Asthma",
  aria: "Allergic rhinitis",
  aaaai_iei: "Primary immunodeficiency",
  iuis_iei: "Inborn errors of immunity",
  eaaci_ait: "Allergen immunotherapy",
  icon_ait: "Allergen immunotherapy",
  atopic_dermatitis: "Atopic dermatitis",
};

const VERIFIED_ON = "2026-11-08";

const COPYRIGHT_NOTE =
  "Linked only. AMedix displays the citation and links to the issuing body's own publication; the document is not copied, stored or redistributed. Access and reuse are governed by the issuing body's terms.";

export const buildReferenceRecord = (key, raw, governance = {}) => {
  const reg = GOVERNANCE[key] || {};
  const status = governance.status || reg.status || REFERENCE_STATUS.UNDER_REVIEW;
  return {
    key,
    issuing_organization: raw.organization,
    title: raw.title,
    clinical_topic: TOPICS[key] || governance.topic || "Allergy & Immunology",
    specialty_keys: ["allergy"],
    publication_year: governance.year ?? reg.year ?? null,
    version: raw.edition || "",
    publication_date: governance.publication_date || "",
    update_date: governance.update_date || "",
    source_url: raw.url || "",
    last_verified_date: governance.last_verified_date || VERIFIED_ON,
    status,
    superseded_by_key: governance.superseded_by || reg.superseded_by || "",
    status_note: governance.note || reg.note || "",
    population: raw.population || "",
    what_it_supports: raw.applies || "",
    access_note: governance.access || reg.access || "",
    copyright_note: COPYRIGHT_NOTE,
  };
};

// The ICD-11 API's own documentation is a technical reference the verification
// path depends on, so it is registered beside the clinical guidelines.
const WHO_ICD11_API = {
  organization: "World Health Organization (WHO)",
  title: "ICD-11 API documentation",
  edition: "ICD-11 API (id.who.int) — v2 API version used by the verification function",
  population: "Not applicable — technical reference",
  url: "https://icd.who.int/icdapi",
  applies: "Authenticated search and entity lookup used to verify every ICD-11 code stored by AMedix",
};

export const CLINICAL_REFERENCES = [
  ...Object.entries(ALLERGY_REFERENCES).map(([key, raw]) => buildReferenceRecord(key, raw)),
  buildReferenceRecord("who_icd11_api", WHO_ICD11_API, {
    status: REFERENCE_STATUS.CURRENT,
    topic: "ICD-11 terminology integration",
    note: "The ICD-11 API is called server-side only, with the workspace's own WHO subscription credentials; no code is produced without a response from the service.",
    access: "WHO ICD-11 API subscription",
  }),
];

export const REFERENCE_BY_KEY = Object.fromEntries(CLINICAL_REFERENCES.map((r) => [r.key, r]));

export const referenceStatusLabel = (status) => REFERENCE_STATUS_LABEL[status] || "Under review";

// References a clinician must not treat as current: superseded and under review.
export const FLAGGED_REFERENCE_KEYS = CLINICAL_REFERENCES.filter((r) => r.status !== REFERENCE_STATUS.CURRENT).map(
  (r) => r.key,
);

export const referenceKeysFor = (keys = []) => keys.map((k) => REFERENCE_BY_KEY[k]).filter(Boolean);

export const REFERENCES_LAST_VERIFIED = VERIFIED_ON;