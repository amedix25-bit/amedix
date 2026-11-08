// Local ICD-11 terminology and classification support.
//
// The classification data AMedix searches is held in the workspace itself
// (Icd11Term / Icd11Release), so coding works with no WHO API subscription and no
// credentials of any kind. Two things feed that database, and nothing else does:
//
//   1. the verified AMedix catalogue — entries read from the published ICD-11 MMS
//      tabulation with the release recorded (the bundled seed), and
//   2. an official WHO ICD-11 release export imported by the institution under its
//      own licence (file upload or API export), validated on the way in.
//
// What this module will never do: generate, complete, crosswalk, guess or repair a
// code. A code exists here only because an official source supplied it. A term the
// dataset does not contain is reported as absent — "not in the imported dataset,
// coding review required" — and is never given an approximate code.
//
// Arabic is displayed only from data the dataset actually carries. When the
// official release supplies an Arabic title it is marked OFFICIAL. When AMedix
// supplies a working translation it is marked as an AMedix translation and is never
// treated as official WHO terminology, and never used to claim verification.

export const ARABIC_SOURCE = {
  OFFICIAL: "official_who",
  AMEDIX: "amedix_translation",
  NONE: "none",
};

export const ARABIC_SOURCE_LABEL = {
  official_who: "Official WHO Arabic term",
  amedix_translation: "AMedix working translation — not official WHO terminology",
  none: "No Arabic term",
};

export const ICD11_LOCAL = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  linearization: "mms",
  browser_root: "https://icd.who.int/browse",
  licence_page: "https://icd.who.int/icdapi",
  // The release the bundled verified catalogue was read from.
  catalogue_release: "2026-01",
  catalogue_verified_date: "2026-10-28",
};

// ── Normalisation ───────────────────────────────────────────────────────────
// Search only. The stored title is never altered: this is the comparison form.

const ARABIC_MARKS = /[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]/g;

export function normalise(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(ARABIC_MARKS, "")
    .replace(/\u0640/g, "") // tatweel
    .replace(/[\u0623\u0625\u0622]/g, "\u0627") // alef forms → alef
    .replace(/\u0649/g, "\u064A") // alef maqsura → ya
    .replace(/\u0629/g, "\u0647") // ta marbuta → ha (comparison form only)
    .replace(/[^\p{L}\p{N}\s.]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function searchTextOf(term) {
  const parts = [
    term.code || "",
    term.title_en || "",
    ...(term.synonyms_en || []),
    ...(term.inclusions || []),
    ...(term.synonyms_ar || []),
    term.title_ar || "",
  ];
  return parts.map(normalise).filter(Boolean).join(" | ");
}

// ── Ranking ─────────────────────────────────────────────────────────────────

const hasWord = (haystack, needle) => new RegExp(`(^|\\s)${escapeRegex(needle)}`).test(haystack);

// Ranks one stored entry against a query. The matched_on value tells the UI which
// field produced the hit, so a code match is never presented the same way as a
// loose text hit.
export function scoreTerm(term, rawQuery) {
  const q = normalise(rawQuery);
  if (!q) return { score: 0, matched_on: "" };

  const code = normalise(term.code);
  if (code && code === q) return { score: 1000, matched_on: "code" };
  if (code && code.startsWith(q)) return { score: 900, matched_on: "code" };

  const title = normalise(term.title_en);
  if (title) {
    if (title === q) return { score: 850, matched_on: "official_term" };
    if (title.startsWith(q)) return { score: 780, matched_on: "official_term" };
    if (hasWord(title, q)) return { score: 700, matched_on: "official_term" };
    if (title.includes(q)) return { score: 620, matched_on: "official_term" };
  }

  const arabicTitle = normalise(term.title_ar);
  if (arabicTitle) {
    if (arabicTitle === q) return { score: 600, matched_on: "arabic_term" };
    if (arabicTitle.startsWith(q) || hasWord(arabicTitle, q)) return { score: 560, matched_on: "arabic_term" };
    if (arabicTitle.includes(q)) return { score: 500, matched_on: "arabic_term" };
  }

  const synonyms = [...(term.synonyms_en || []), ...(term.inclusions || []), ...(term.synonyms_ar || [])].map(normalise);
  if (synonyms.some((s) => s === q)) return { score: 540, matched_on: "synonym" };
  if (synonyms.some((s) => s && (s.includes(q) || hasWord(s, q)))) return { score: 480, matched_on: "synonym" };

  // A partial match is offered only when EVERY meaningful word of the query is
  // present in the entry. A query that matches on one word of three is not the
  // condition that was asked for, and offering it would invite a wrong code.
  const search = term.search_text || searchTextOf(term);
  const tokens = q.split(" ").filter((t) => t.length > 2);
  if (tokens.length && search && tokens.every((t) => search.includes(t))) {
    return { score: 400, matched_on: "partial" };
  }
  return { score: 0, matched_on: "" };
}

export function searchTerms(terms, rawQuery, { limit = 15, chapter = "", codableOnly = false } = {}) {
  const q = normalise(rawQuery);
  if (q.length < 2) return [];
  return (terms || [])
    .filter((t) => (chapter ? t.chapter_code === chapter : true))
    .filter((t) => (codableOnly ? t.is_codable === true : true))
    .map((t) => ({ term: t, ...scoreTerm(t, rawQuery) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.term.title_en).localeCompare(String(b.term.title_en));
    })
    .slice(0, Math.min(Math.max(limit, 1), 50));
}

// ── Import validation ───────────────────────────────────────────────────────

// Accepted shapes: chapter "12", block "CA2", category "CA22", subcategory
// "CA22.0". Anything else is reported, not repaired.
const CODE_SHAPE = /^(?:\d{2}|[0-9A-Z]{3}|[0-9A-Z]{4}(?:\.[0-9A-Z]{1,3})?)$/;

export function kindOf(entry) {
  const code = String(entry?.code || "").trim();
  if (entry?.kind) return entry.kind;
  if (/^\d{2}$/.test(code)) return "chapter";
  if (/^[0-9A-Z]{3}$/.test(code)) return "block";
  if (code.includes(".")) return "subcategory";
  return code ? "category" : "category";
}

const list = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => String(x || "").trim()).filter(Boolean);

const exclusionList = (v) =>
  list(v)
    .map((x) => (typeof x === "string" ? { term: x, code: "", uri: "" } : null))
    .filter(Boolean)
    .concat(
      (Array.isArray(v) ? v : [])
        .filter((x) => x && typeof x === "object")
        .map((x) => ({ term: String(x.term || "").trim(), code: String(x.code || "").trim(), uri: String(x.uri || "").trim() }))
        .filter((x) => x.term),
    );

const ancestorsOf = (v) =>
  (Array.isArray(v) ? v : []).map((a) =>
    typeof a === "string"
      ? { uri: a, code: "", title_en: "" }
      : { uri: String(a?.uri || "").trim(), code: String(a?.code || "").trim(), title_en: String(a?.title_en || a?.title || "").trim() },
  );

// Postcoordination is stored only as the official dataset expresses it. Without
// dataset data the entry says so instead of describing axes AMedix invented.
export function normalisePostcoordination(raw) {
  const supported = Boolean(raw && raw.supported !== false && (Array.isArray(raw.axes) ? raw.axes.length : raw.axes));
  const axes = supported
    ? (Array.isArray(raw.axes) ? raw.axes : []).map((axis) => ({
        axis_key: String(axis?.axis_key || axis?.key || "").trim(),
        axis_title_en: String(axis?.axis_title_en || axis?.title || "").trim(),
        values: (Array.isArray(axis?.values) ? axis.values : []).map((v) => ({
          code: String(v?.code || "").trim(),
          title_en: String(v?.title_en || v?.title || "").trim(),
          title_ar: String(v?.title_ar || "").trim(),
        })),
      }))
    : [];
  return {
    supported,
    axes,
    cluster_example: String(raw?.cluster_example || "").trim(),
    note: supported
      ? String(raw?.note || "Postcoordination axes as supplied by the imported official dataset.").trim()
      : "The imported dataset carries no postcoordination data for this entry, so no cluster is proposed. A cluster must be taken from the official WHO Coding Tool and recorded with the code it was verified against.",
  };
}

// Validates and shapes one imported entry. Returns { record } or { reject }.
export function validateEntry(raw, ctx) {
  const title_en = String(raw?.title_en || raw?.title || raw?.display || "").trim();
  if (!title_en) return { reject: "missing_title" };

  const code = String(raw?.code || raw?.theCode || "").trim();
  const kind = kindOf(raw);
  if (code && !CODE_SHAPE.test(code)) return { reject: `code_shape_invalid:${code}` };

  const title_ar = String(raw?.title_ar || "").trim();
  let title_ar_source = String(raw?.title_ar_source || "").trim();
  if (!title_ar) title_ar_source = ARABIC_SOURCE.NONE;
  if (title_ar && !title_ar_source) return { reject: `arabic_without_source:${code || title_en}` };
  if (title_ar_source === ARABIC_SOURCE.OFFICIAL && ctx.sourceType === "verified_catalogue") {
    // The bundled catalogue carries no Arabic, so nothing may claim to be official.
    title_ar_source = ARABIC_SOURCE.AMEDIX;
  }

  const is_codable = code ? (raw?.is_codable === false ? false : kind === "category" || kind === "subcategory") : false;

  return {
    record: {
      release_id: ctx.releaseId,
      linearization: ctx.linearization || ICD11_LOCAL.linearization,
      code,
      uri: String(raw?.uri || "").trim(),
      kind,
      is_codable,
      is_leaf: raw?.is_leaf === true,
      chapter_code: String(raw?.chapter_code || "").trim(),
      chapter_title_en: String(raw?.chapter_title_en || "").trim(),
      chapter_title_ar: String(raw?.chapter_title_ar || "").trim(),
      block_code: String(raw?.block_code || "").trim(),
      block_title_en: String(raw?.block_title_en || "").trim(),
      parent_uri: String(raw?.parent_uri || "").trim(),
      ancestors: ancestorsOf(raw?.ancestors),
      title_en,
      title_ar,
      title_ar_source,
      title_ar_note: title_ar ? ARABIC_SOURCE_LABEL[title_ar_source] : "",
      synonyms_en: list(raw?.synonyms_en || raw?.synonyms || raw?.index_terms),
      synonyms_ar: list(raw?.synonyms_ar),
      inclusions: list(raw?.inclusions),
      exclusions: exclusionList(raw?.exclusions),
      coding_note_en: String(raw?.coding_note_en || raw?.coding_note || "").trim(),
      coding_note_ar: String(raw?.coding_note_ar || "").trim(),
      postcoordination: normalisePostcoordination(raw?.postcoordination),
      definition: String(raw?.definition || "").trim(),
      search_text: "",
      dataset_source: ctx.sourceType === "verified_catalogue" ? "verified_catalogue" : "who_export",
      source_reference: ctx.sourceReference || "",
      // Verified means matched against an official source. Only an official source
      // can set it, and a hand-typed term never reaches this shape.
      verified: true,
      verified_date: String(raw?.verified_date || ctx.verifiedDate || "").trim(),
      imported_datetime: ctx.importedDatetime,
      imported_by_name: ctx.importedByName || "",
      search_text_final: true,
    },
  };
}

export function validateImport(rawEntries, ctx) {
  const accepted = [];
  const rejected = [];
  const seen = new Map();
  let duplicates = 0;

  (Array.isArray(rawEntries) ? rawEntries : []).forEach((raw, index) => {
    const result = validateEntry(raw, ctx);
    if (result.reject) {
      rejected.push({ index, reason: result.reject, title: String(raw?.title_en || raw?.title || raw?.display || "").slice(0, 120) });
      return;
    }
    const record = result.record;
    if (record.code) {
      if (seen.has(record.code)) {
        duplicates += 1;
        rejected.push({ index, reason: `duplicate_code:${record.code}`, title: record.title_en.slice(0, 120) });
        return;
      }
      seen.set(record.code, true);
    }
    record.search_text = searchTextOf(record);
    delete record.search_text_final;
    accepted.push(record);
  });

  const officialArabic = accepted.filter((r) => r.title_ar_source === ARABIC_SOURCE.OFFICIAL).length;
  const withExclusions = accepted.filter((r) => (r.exclusions || []).length).length;
  const withPostcoordination = accepted.filter((r) => r.postcoordination?.supported).length;

  return {
    accepted,
    rejected,
    report: {
      accepted: accepted.length,
      rejected: rejected.length,
      duplicates,
      missing_code: accepted.filter((r) => !r.code).length,
      codable: accepted.filter((r) => r.is_codable).length,
      arabic_official: officialArabic,
      arabic_amedix: accepted.filter((r) => r.title_ar_source === ARABIC_SOURCE.AMEDIX).length,
      with_exclusions: withExclusions,
      with_postcoordination: withPostcoordination,
      checks: [
        {
          key: "codes",
          label: "Every code came from the import (none generated)",
          outcome: "passed",
          detail: `${accepted.filter((r) => r.code).length} coded entries, ${accepted.filter((r) => !r.code).length} grouping entries with no code`,
        },
        {
          key: "arabic_source",
          label: "Every Arabic term carries its source",
          outcome: accepted.every((r) => !r.title_ar || ARABIC_SOURCE_LABEL[r.title_ar_source]) ? "passed" : "failed",
          detail: `${officialArabic} official WHO, ${accepted.filter((r) => r.title_ar_source === ARABIC_SOURCE.AMEDIX).length} AMedix working translations`,
        },
        {
          key: "duplicates",
          label: "No duplicate codes admitted",
          outcome: duplicates ? "failed" : "passed",
          detail: duplicates ? `${duplicates} duplicate code(s) rejected` : "no duplicates",
        },
        {
          key: "rejected",
          label: "Rejected entries are named with their reason",
          outcome: "passed",
          detail: rejected.length ? rejected.map((r) => r.reason).join(", ").slice(0, 300) : "nothing rejected",
        },
      ],
    },
  };
}

// ── Bundled verified catalogue seed ─────────────────────────────────────────
// These six entries are the respiratory subset of the AMedix verified catalogue:
// read from the published ICD-11 MMS tabulation, release recorded, verified date
// recorded. The Arabic titles are AMedix working translations and are marked as
// such — they are NOT official WHO Arabic terminology.

const SEED_RELEASE = ICD11_LOCAL.catalogue_release;
const SEED_VERIFIED = ICD11_LOCAL.catalogue_verified_date;
const SEED_CHAPTER = { chapter_code: "12", chapter_title_en: "Diseases of the respiratory system" };
const SEED_SOURCE = "AMedix verified ICD-11 MMS catalogue (published WHO tabulation)";

export const VERIFIED_RESPIRATORY_SEED = [
  {
    code: "CA22",
    title_en: "Chronic obstructive pulmonary disease",
    ...SEED_CHAPTER,
    synonyms_en: ["copd", "chronic obstructive pulmonary disease", "exacerbation"],
    title_ar: "داء الانسداد الرئوي المزمن",
    title_ar_source: ARABIC_SOURCE.AMEDIX,
    coding_note_en: "",
    verified_date: SEED_VERIFIED,
  },
  {
    code: "CA23",
    title_en: "Asthma",
    ...SEED_CHAPTER,
    synonyms_en: ["asthma", "wheeze", "bronchospasm"],
    title_ar: "الربو",
    title_ar_source: ARABIC_SOURCE.AMEDIX,
    verified_date: SEED_VERIFIED,
  },
  {
    code: "CB21",
    title_en: "Pneumothorax",
    ...SEED_CHAPTER,
    synonyms_en: ["pneumothorax", "collapsed lung", "tension pneumothorax"],
    title_ar: "استرواح الصدر",
    title_ar_source: ARABIC_SOURCE.AMEDIX,
    verified_date: SEED_VERIFIED,
  },
  {
    code: "CB26",
    title_en: "Haemothorax",
    ...SEED_CHAPTER,
    synonyms_en: ["haemothorax", "hemothorax"],
    title_ar: "التدمّي الصدري",
    title_ar_source: ARABIC_SOURCE.AMEDIX,
    verified_date: SEED_VERIFIED,
  },
  {
    code: "CB27",
    title_en: "Pleural effusion",
    ...SEED_CHAPTER,
    synonyms_en: ["pleural effusion"],
    title_ar: "الانصباب الجنبي",
    title_ar_source: ARABIC_SOURCE.AMEDIX,
    verified_date: SEED_VERIFIED,
  },
  {
    code: "CB41",
    title_en: "Respiratory failure",
    ...SEED_CHAPTER,
    synonyms_en: ["respiratory failure", "hypoxia", "hypercapnia", "type 1 respiratory failure", "type 2 respiratory failure"],
    title_ar: "الفشل التنفسي",
    title_ar_source: ARABIC_SOURCE.AMEDIX,
    coding_note_en:
      "Catalogue entry is a stem category. Code the most specific subcategory in the official dataset when one applies.",
    verified_date: SEED_VERIFIED,
  },
];

export function seedRecords({ importedDatetime, importedByName }) {
  return validateImport(VERIFIED_RESPIRATORY_SEED, {
    releaseId: SEED_RELEASE,
    sourceType: "verified_catalogue",
    sourceReference: SEED_SOURCE,
    verifiedDate: SEED_VERIFIED,
    importedDatetime,
    importedByName,
  });
}

// ── Respiratory coverage of the local dataset ───────────────────────────────
// The conditions a pulmonologist codes routinely. Each is resolved by searching
// the local dataset — never by assigning a code here. A condition the dataset does
// not hold is reported as not_in_dataset so the coding gap is visible rather than
// filled with an approximation.

export const RESPIRATORY_COVERAGE_TARGETS = [
  { key: "copd", label: "Chronic obstructive pulmonary disease", queries: ["chronic obstructive pulmonary disease", "copd"] },
  { key: "asthma", label: "Asthma", queries: ["asthma"] },
  { key: "pneumonia", label: "Pneumonia (community- and hospital-acquired)", queries: ["pneumonia", "community-acquired pneumonia"] },
  { key: "pulmonary_embolism", label: "Pulmonary embolism", queries: ["pulmonary embolism", "pulmonary thromboembolism"] },
  { key: "ild", label: "Interstitial lung disease and pulmonary fibrosis", queries: ["interstitial lung disease", "pulmonary fibrosis"] },
  { key: "bronchiectasis", label: "Bronchiectasis", queries: ["bronchiectasis"] },
  { key: "osa", label: "Obstructive sleep apnoea and obesity hypoventilation", queries: ["obstructive sleep apnoea", "sleep apnoea", "obesity hypoventilation"] },
  { key: "tuberculosis", label: "Tuberculosis and latent tuberculosis infection", queries: ["tuberculosis", "latent tuberculosis infection"] },
  { key: "pulmonary_hypertension", label: "Pulmonary hypertension", queries: ["pulmonary hypertension"] },
  { key: "sarcoidosis", label: "Sarcoidosis", queries: ["sarcoidosis"] },
  { key: "occupational", label: "Occupational lung disease (asbestosis, silicosis)", queries: ["asbestosis", "silicosis", "occupational lung disease"] },
  { key: "cystic_fibrosis", label: "Cystic fibrosis and non-cystic-fibrosis bronchiectasis", queries: ["cystic fibrosis"] },
  { key: "abpa", label: "Allergic bronchopulmonary aspergillosis", queries: ["allergic bronchopulmonary aspergillosis"] },
  { key: "pneumoconiosis", label: "Pneumoconiosis", queries: ["pneumoconiosis"] },
];

// Resolves one coverage target against stored terms. A match must be a codable,
// verified entry that names the target condition — a partial text overlap is not
// a match, because reporting it as covered would hide a real dataset gap.
const COVERAGE_MATCHES = ["code", "official_term", "synonym", "arabic_term"];

export function coverageForTarget(terms, target) {
  for (const query of target.queries || []) {
    const hits = searchTerms(terms, query, { limit: 5, codableOnly: true });
    const hit = hits.find(
      (h) => h.term?.verified === true && h.term?.code && COVERAGE_MATCHES.includes(h.matched_on),
    );
    if (hit) {
      return {
        key: target.key,
        label: target.label,
        status: "mapped",
        query,
        code: hit.term.code,
        title_en: hit.term.title_en,
        uri: hit.term.uri || "",
        matched_on: hit.matched_on,
      };
    }
  }
  return { key: target.key, label: target.label, status: "not_in_dataset", query: "", code: "", title_en: "", uri: "", matched_on: "" };
}

export function coverageReport(terms) {
  const rows = RESPIRATORY_COVERAGE_TARGETS.map((t) => coverageForTarget(terms, t));
  return {
    rows,
    mapped: rows.filter((r) => r.status === "mapped").length,
    total: rows.length,
    missing: rows.filter((r) => r.status === "not_in_dataset").map((r) => r.label),
  };
}