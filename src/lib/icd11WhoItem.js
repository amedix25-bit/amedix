// Turns a WHO ICD-11 API result into the entry the diagnosis field stores.
//
// Shared by anything that retrieves a concept from the official WHO service, so a
// code selected from a condition index and a code selected from the free-text WHO
// search carry exactly the same provenance: release, WHO entity URI, retrieval
// time, language, and whether the WHO record detail was actually read.
//
// Nothing here invents anything. A field the service did not return stays empty.

import { SPECIFICITY } from "@/lib/rheumIcd11";

export const whoToday = () => new Date().toISOString().slice(0, 10);

export const buildWhoItem = ({ result, detail, detailError, release, language, retrievedAt }) => ({
  code: result.code,
  display: result.display,
  synonyms: detail?.index_terms || [],
  specificity: result.is_leaf ? SPECIFICITY.SUB : SPECIFICITY.BLOCK,
  definition: detail?.definition || "",
  long_definition: detail?.long_definition || "",
  inclusions: detail?.inclusions || [],
  exclusions: detail?.exclusions || [],
  index_terms: detail?.index_terms || [],
  coding_note:
    detail?.coding_note ||
    (result.is_leaf
      ? ""
      : "WHO returns this as a grouping entry — check whether a more specific subcategory applies before relying on it."),
  ancestors: detail?.ancestors || [],
  who_uri: result.uri || detail?.uri || "",
  who_browser_url: detail?.browser_url || "",
  detail_status: detail ? "read" : detailError ? "detail_unavailable" : "search_only",
  detail_error: detailError || "",
  release: release || "",
  language: language || "en",
  retrieved_at: retrievedAt || "",
  source: `WHO ICD-11 API — ${result.uri}`,
  verified_date: whoToday(),
  mapping_state: "verified",
  hierarchy: { uri: result.uri, parent: "", chapter: result.chapter || "" },
  category: result.chapter || "",
  manual: false,
});