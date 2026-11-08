import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalise, escapeRegex, searchTerms, coverageReport, ICD11_LOCAL, ARABIC_SOURCE_LABEL } from "../../shared/icd11Local.ts";

// icd11LocalSearch — search the workspace's OWN ICD-11 database.
//
// No WHO API subscription and no credentials are involved: the classification data
// lives in Icd11Term, imported from an official WHO release (or the bundled
// verified catalogue), and this function reads it.
//
// Nothing is generated here. A result is a stored entry or it does not exist; an
// unmatched query returns no code at all, with the wording that tells the clinician
// the term is not in the imported dataset and needs coding review.
//
// Modes
//   status  {}                              → active release, counts, respiratory coverage
//   search  { query, lang?, limit?, chapter? } → ranked local matches
//   entity  { uri | code }                  → one complete stored entry

const MAX_CANDIDATES = 400;

const releaseOf = async (db) => {
  const active = await db.entities.Icd11Release.filter({ status: "active" }, { sort: "-imported_datetime", limit: 1 });
  const rows = Array.isArray(active) ? active : active?.items || [];
  return rows[0] || null;
};

const summarise = (term, lang) => ({
  uri: term.uri || "",
  code: term.code || "",
  display: term.title_en || "",
  display_ar: term.title_ar || "",
  display_ar_source: term.title_ar_source || "none",
  display_ar_is_official: term.title_ar_source === "official_who",
  display_ar_note: term.title_ar_note || "",
  display_local: lang === "ar" && term.title_ar ? term.title_ar : term.title_en || "",
  codable: term.is_codable === true,
  is_leaf: term.is_leaf === true,
  kind: term.kind || "",
  chapter: [term.chapter_code, term.chapter_title_en].filter(Boolean).join(" · "),
  chapter_code: term.chapter_code || "",
  release: term.release_id || "",
  dataset_source: term.dataset_source || "",
  verified: term.verified === true,
  has_exclusions: (term.exclusions || []).length > 0,
  has_postcoordination: term.postcoordination?.supported === true,
});

async function candidatesFor(db, release, query, chapter) {
  const raw = String(query || "").trim();
  const q = normalise(raw);
  const first = q.split(" ")[0] || "";
  const filters = [];
  if (q) filters.push({ search_text: { $regex: escapeRegex(q) } });
  if (first.length > 2) filters.push({ search_text: { $regex: escapeRegex(first) } });
  if (raw.length >= 2) filters.push({ code: { $regex: `^${escapeRegex(raw.toUpperCase())}` } });

  const base = { release_id: release.release_id };
  if (chapter) base.chapter_code = chapter;
  const where = filters.length > 1 ? { ...base, $or: filters } : { ...base, ...filters[0] };

  const page = await db.entities.Icd11Term.filter(where, { limit: MAX_CANDIDATES });
  return Array.isArray(page) ? page : page?.items || [];
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mode = String(body.mode || "search");
    if (!["status", "search", "entity"].includes(mode)) {
      return Response.json({ error: "mode must be status, search or entity" }, { status: 400 });
    }

    const release = await releaseOf(base44);

    if (mode === "status") {
      const coverage = release?.validation?.coverage || null;
      return Response.json({
        dataset_ready: Boolean(release),
        credentials_required: false,
        release: release
          ? {
              release_id: release.release_id,
              linearization: release.linearization || "mms",
              title: release.title || "",
              source_type: release.source_type || "",
              licence_reference: release.licence_reference || "",
              imported_datetime: release.imported_datetime || "",
              imported_by_name: release.imported_by_name || "",
              term_count: release.term_count || 0,
              codable_count: release.codable_count || 0,
              arabic_official_count: release.arabic_official_count || 0,
            }
          : null,
        coverage,
        arabic_sources: ARABIC_SOURCE_LABEL,
        note: release
          ? "Clinical coding reads this local ICD-11 database. No WHO API subscription or credentials are used."
          : "No ICD-11 release has been imported yet. An administrator imports an official WHO ICD-11 release export (or loads the bundled verified catalogue); coding never falls back to a generated code.",
        system: ICD11_LOCAL.system,
        system_uri: ICD11_LOCAL.system_uri,
      });
    }

    if (mode === "entity") {
      if (!release) return Response.json({ dataset_ready: false, error: "No ICD-11 release has been imported yet." }, { status: 409 });
      const uri = String(body.uri || "").trim();
      const code = String(body.code || "").trim().toUpperCase();
      if (!uri && !code) return Response.json({ error: "uri or code is required" }, { status: 400 });
      const where = uri ? { release_id: release.release_id, uri } : { release_id: release.release_id, code };
      const found = await base44.entities.Icd11Term.filter(where, { limit: 1 });
      const term = (Array.isArray(found) ? found : found?.items || [])[0];
      if (!term) {
        return Response.json(
          {
            dataset_ready: true,
            error: "That entry is not in the imported ICD-11 dataset. No code is substituted.",
            release: release.release_id,
          },
          { status: 404 },
        );
      }
      return Response.json({
        dataset_ready: true,
        release: term.release_id,
        entry: {
          ...summarise(term, body.lang === "ar" ? "ar" : "en"),
          definition: term.definition || "",
          inclusions: term.inclusions || [],
          exclusions: term.exclusions || [],
          index_terms: term.synonyms_en || [],
          coding_note: term.coding_note_en || "",
          coding_note_ar: term.coding_note_ar || "",
          ancestors: term.ancestors || [],
          postcoordination: term.postcoordination || null,
          source: `${term.dataset_source === "who_export" ? "Official WHO ICD-11 export" : "AMedix verified catalogue"} — ${term.release_id}${
            term.uri ? ` — ${term.uri}` : ""
          }`,
        },
      });
    }

    const query = String(body.query || "").trim();
    if (query.length < 2) return Response.json({ error: "query must be at least 2 characters" }, { status: 400 });
    if (query.length > 120) return Response.json({ error: "query is too long (max 120 characters)" }, { status: 400 });

    if (!release) {
      return Response.json(
        {
          dataset_ready: false,
          results: [],
          credentials_required: false,
          message:
            "No ICD-11 release has been imported into this workspace yet, so no code can be offered. An administrator imports an official WHO ICD-11 release export — AMedix never substitutes a generated or remembered code.",
        },
        { status: 200 },
      );
    }

    const lang = body.lang === "ar" ? "ar" : "en";
    const limit = Math.min(Math.max(Number(body.limit) || 15, 1), 50);
    const chapter = String(body.chapter || "").trim();
    const candidates = await candidatesFor(base44, release, query, chapter);
    const ranked = searchTerms(candidates, query, { limit, chapter });

    return Response.json({
      dataset_ready: true,
      credentials_required: false,
      release: release.release_id,
      source_type: release.source_type,
      language: lang,
      query,
      retrieved_at: new Date().toISOString(),
      results: ranked.map((r) => ({ ...summarise(r.term, lang), matched_on: r.matched_on, score: r.score })),
      message: ranked.length
        ? ""
        : "No entry in the imported ICD-11 dataset matches this term. It is not mapped to a code — record the diagnosis as documented and flag it for coding review.",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}