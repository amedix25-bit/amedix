// AMedix condition catalog — the single source for patient registration.
// Specialty grouping follows ICD-11 chapters. Search matches the English term,
// the Arabic term and the alternative names / abbreviations of every entry.
import { normalizeArabicText } from "./arabicMedicalTerms";
import { CORE_SPECIALTIES } from "./conditionCatalogCore";
import { MORE_SPECIALTIES } from "./conditionCatalogMore";

export const CONDITION_SPECIALTIES = [...CORE_SPECIALTIES, ...MORE_SPECIALTIES];

export const TOTAL_CONDITIONS = CONDITION_SPECIALTIES.reduce(
  (sum, s) => sum + s.conditions.length,
  0
);

export const conditionKey = (specialtyKey, en) => `${specialtyKey}::${en}`;

const normalize = (text) => normalizeArabicText(text).toLowerCase();

// One flat, pre-normalised index so typing filters instantly on any device.
const INDEX = CONDITION_SPECIALTIES.flatMap((specialty) =>
  specialty.conditions.map((condition) => ({
    specialty,
    condition,
    haystack: normalize(`${condition.en} ${condition.ar} ${condition.alt}`),
  }))
);

export function searchConditions(query, limit = 60) {
  const q = normalize(query);
  if (!q) return [];
  // Arabic patients often type the definite article ("الضغط") while the catalog
  // stores the plain term ("ضغط الدم"), so each word is also tried without it.
  const words = q
    .split(" ")
    .filter(Boolean)
    .map((word) => (word.length > 3 ? [word, word.replace(/^ال/, "")] : [word]));

  const matches = (haystack, variants) =>
    variants.some((word) =>
      word.length <= 3
        ? new RegExp(`(^|[^\\p{L}\\p{N}])${word}([^\\p{L}\\p{N}]|$)`, "u").test(haystack)
        : haystack.includes(word)
    );

  const hits = [];
  for (const entry of INDEX) {
    if (words.every((variants) => matches(entry.haystack, variants))) {
      hits.push(entry);
      if (hits.length >= limit) break;
    }
  }
  return hits;
}