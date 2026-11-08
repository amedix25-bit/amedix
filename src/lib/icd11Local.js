import { SPECIFICITY } from "@/lib/rheumIcd11";

// Turns an entry from the workspace's own ICD-11 database into the diagnosis
// record the note stores — the same shape the WHO retrieval path produced, so the
// note, the printed record and the coding history are unchanged.
//
// A local entry is verified because it was imported from an official source and is
// stored with the release it came from. Nothing is translated here: the English
// term is the coded term, and an Arabic term is carried beside it with its source
// recorded so official WHO terminology is never confused with an AMedix working
// translation.

export const ARABIC_SOURCE_LABEL = {
  official_who: "Official WHO Arabic term",
  amedix_translation: "AMedix working translation — not official WHO terminology",
  none: "No Arabic term",
};

export const ARABIC_SOURCE_TONE = {
  official_who: "green",
  amedix_translation: "amber",
  none: "gray",
};

export const arabicSourceLabel = (source) => ARABIC_SOURCE_LABEL[source] || ARABIC_SOURCE_LABEL.none;

export const localBrowsers = (release) =>
  release ? `https://icd.who.int/browse/${release}/mms/en` : "https://icd.who.int/browse/2026-01/mms/en";

export const localEntryToDiagnosis = (entry, { language = "en", release = "" } = {}) => ({
  code: entry.code || "",
  display: entry.display || "",
  display_ar: entry.display_ar || "",
  display_ar_source: entry.display_ar_source || "none",
  display_ar_note: entry.display_ar_note || "",
  synonyms: entry.index_terms || [],
  specificity: entry.is_leaf ? SPECIFICITY.SUB : SPECIFICITY.BLOCK,
  definition: entry.definition || "",
  long_definition: "",
  inclusions: entry.inclusions || [],
  exclusions: (entry.exclusions || []).map((e) => (typeof e === "string" ? e : e.term)).filter(Boolean),
  exclusion_codes: (entry.exclusions || []).filter((e) => e && e.code).map((e) => ({ code: e.code, term: e.term })),
  index_terms: entry.index_terms || [],
  coding_note: entry.coding_note || "",
  coding_note_ar: entry.coding_note_ar || "",
  ancestors: entry.ancestors || [],
  postcoordination: entry.postcoordination || null,
  who_uri: entry.uri || "",
  who_browser_url: localBrowsers(release || entry.release),
  detail_status: "read",
  detail_error: "",
  release: release || entry.release || "",
  language,
  retrieved_at: new Date().toISOString(),
  source: entry.source || "AMedix local ICD-11 database",
  verified_date: new Date().toISOString().slice(0, 10),
  mapping_state: entry.verified ? "verified" : "review_required",
  hierarchy: { uri: entry.uri || "", parent: "", chapter: entry.chapter_code || entry.chapter || "" },
  category: entry.chapter_code || "",
  manual: false,
});

// A diagnosis the local dataset does not hold. Recorded exactly as documented, with
// no code — the alternative would be a guess, and a guessed code is worse than none.
export const localUnmappedDiagnosis = (term, reason) => ({
  code: "",
  display: term,
  clinician_term: term,
  definition: "No ICD-11 code assigned — the condition is recorded exactly as documented.",
  coding_note: `Unmapped — ${reason}. Coding review required.`,
  mapping_state: "unresolved",
  specificity: "Pending review — no code assigned",
  source: "Documented in the note — coding review required",
});

export const coverageTone = (status) =>
  status === "mapped" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400";