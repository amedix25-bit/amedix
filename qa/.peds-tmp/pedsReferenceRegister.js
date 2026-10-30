// Pediatrics — the traceable reference register.
//
// One row per source the notes rely on, carrying everything a reviewer needs to find the
// document and judge whether it still governs the requirement: the issuing body, the exact
// title, the edition, the publication or update date, the population it covers, what the
// notes take from it, the publisher link and whether the edition was confirmed as current.
//
// The register adds no new clinical claim. Each row is assembled from PEDS_REFERENCES and
// PEDS_PUBLICATION, so what a note records as its basis and what this register lists can
// never drift apart.

import {
  PEDS_REFERENCES,
  PEDS_NOTE_BASIS,
  PEDS_PUBLICATION,
  PEDS_LAST_REVIEWED,
  pedsPublicationLabel,
} from "./pedsReferences.js";

// Every requirement a note records, traced back to its source row.
export const PEDS_REGISTER_ROWS = Object.entries(PEDS_REFERENCES).map(([key, ref]) => ({
  key,
  organization: ref.organization,
  title: ref.title,
  edition: ref.edition,
  publication: PEDS_PUBLICATION[key] || "",
  publication_label: pedsPublicationLabel(key),
  publication_verified: Boolean(PEDS_PUBLICATION[key]),
  population: ref.population,
  requirement: ref.applies,
  document_type: ref.type,
  url: ref.url,
  current_revision_confirmed: ref.revision_verified === true,
  reviewed: PEDS_LAST_REVIEWED,
}));

export const PEDS_REGISTER_INDEX = Object.fromEntries(PEDS_REGISTER_ROWS.map((row) => [row.key, row]));

// Which note types lean on each source — the reverse of PEDS_NOTE_BASIS, so a reviewer
// opening one document can see every note its requirement reaches.
export const PEDS_REGISTER_REACH = PEDS_REGISTER_ROWS.reduce((acc, row) => {
  acc[row.key] = Object.entries(PEDS_NOTE_BASIS)
    .filter(([, entry]) => entry.basis.includes(row.key))
    .map(([noteKey]) => noteKey);
  return acc;
}, {});

export const PEDS_REGISTER_SUMMARY = {
  reviewed: PEDS_LAST_REVIEWED,
  total: PEDS_REGISTER_ROWS.length,
  publication_dated: PEDS_REGISTER_ROWS.filter((r) => r.publication_verified).length,
  publication_unverified: PEDS_REGISTER_ROWS.filter((r) => !r.publication_verified).length,
  current_revision_confirmed: PEDS_REGISTER_ROWS.filter((r) => r.current_revision_confirmed).length,
  without_publisher_link: PEDS_REGISTER_ROWS.filter((r) => !r.url).length,
};

// One printable line per source, for the audit report and the review pack.
export const pedsRegisterLine = (key) => {
  const row = PEDS_REGISTER_INDEX[key];
  if (!row) return "";
  return [
    `${row.organization} — ${row.title}`,
    `${row.edition}; ${row.publication_label}`,
    `population: ${row.population}`,
    `applied to: ${row.requirement}`,
    row.current_revision_confirmed ? "current revision confirmed" : "current revision to be confirmed",
    row.url,
    `reaches: ${(PEDS_REGISTER_REACH[key] || []).join(", ") || "—"}`,
    `reviewed ${row.reviewed}`,
  ]
    .filter(Boolean)
    .join(" · ");
};

export const pedsRegisterText = () => PEDS_REGISTER_ROWS.map((row) => pedsRegisterLine(row.key)).join("\n");