import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// icd11WhoSearch — the ONLY path by which AMedix presents a code as verified.
//
// It calls the official WHO ICD-11 API (id.who.int) with the facility's own
// subscription credentials and returns exactly what the WHO service returned.
// Nothing is generated, completed, crosswalked or substituted: no ICD-10 code
// appears anywhere, and a code the WHO API did not send is never produced here.
//
// Modes
//   search    { query, limit? }  → codes for the query in the MMS linearization
//   entity    { uri }            → the entry's own record + parent/child links
//   releases  {}                 → the ICD-11 releases the subscription can see
//
// Every result carries: code, display term, WHO entity URI, release, the
// endpoint it came from and the time it was retrieved — so the note can store
// what the code was verified against, not only how it reads.
//
// Credentials: WHO_ICD11_CLIENT_ID / WHO_ICD11_CLIENT_SECRET (WHO ICD-11 API
// subscription, https://icd.who.int/icdapi). WHO_ICD11_RELEASE is optional —
// when it is empty the newest release the API reports is used.

const TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token";
const API_ROOT = "https://id.who.int/icd/release/11";
const BROWSER_ROOT = "https://icd.who.int/browse/2024-01/mms/en";

const readSecret = (name) => {
  try {
    return String(secrets.get(name) || "").trim();
  } catch (e) {
    return "";
  }
};

let tokenCache = { token: "", expiresAt: 0 };

async function accessToken(clientId, clientSecret) {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now + 60_000) return tokenCache.token;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "icdapi_access",
      grant_type: "client_credentials",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw Object.assign(new Error(`WHO ICD-11 token request failed (${res.status}). ${detail.slice(0, 200)}`), {
      status: 502,
    });
  }
  const data = await res.json();
  const token = String(data.access_token || "");
  if (!token) throw Object.assign(new Error("WHO ICD-11 token response contained no access token."), { status: 502 });
  tokenCache = { token, expiresAt: now + Number(data.expires_in || 3600) * 1000 };
  return token;
}

// Terminology is requested in the language the clinician is working in: the WHO
// API returns the official term for that language where the release carries one,
// and its own default elsewhere. AMedix never translates a classification term
// itself.
const apiHeaders = (token, lang = "en") => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Accept-Language": lang === "ar" ? "ar" : "en",
  "API-Version": "v2",
});

const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// A short-lived read cache. Classification content is stable within a release, so
// repeating the same lookup — while a clinician types, expands a parent chain or
// reopens the same entry — returns the same WHO answer instead of calling the
// service again. Only successful payloads are cached, and nothing is cached past
// its release's relevance window.
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();
const cacheGet = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return null;
  }
  return hit.value;
};
const cacheSet = (key, value) => {
  if (cache.size > 400) cache.clear();
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  return value;
};

const text = (node) => {
  if (!node) return "";
  if (typeof node === "string") return node.trim();
  if (typeof node === "object") {
    const value = node["@value"] ?? node.label?.["@value"] ?? node.label ?? node.title?.["@value"] ?? "";
    return typeof value === "string" ? value.trim() : "";
  }
  return "";
};

// Inclusions and exclusions the WHO record itself carries. Only what the service
// returned is passed on — nothing is inferred from the title.
const termList = (node) => asArray(node).map(text).filter(Boolean);

const entitySummary = (uri, e, lang) => ({
  uri,
  code: e?.code || "",
  display: e?.title?.["@value"] || "",
  definition: e?.definition?.["@value"] || "",
  inclusions: termList(e?.inclusion),
  exclusions: termList(e?.exclusion),
  index_terms: termList(e?.indexTerm),
  coding_note: text(e?.codingNote) || text(e?.note) || "",
  long_definition: e?.longDefinition?.["@value"] || "",
  parent_uris: asArray(e?.parent),
  child_uris: asArray(e?.child),
  ancestor_uris: asArray(e?.ancestor),
  chapter: e?.chapter || "",
  browser_url: e?.browserUrl || "",
  language: lang,
});

async function fetchEntity(uri, headers, lang) {
  const key = `entity|${lang}|${uri}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const res = await fetch(uri, { headers, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw Object.assign(new Error(`WHO ICD-11 entity lookup failed (${res.status}).`), { status: 502 });
  const payload = await res.json();
  return cacheSet(key, entitySummary(uri, payload, lang));
}

// The classification path, nearest parent first. Bounded and cached, because it
// is the clinician's context for a code and never a reason to hang the form.
async function fetchAncestors(uris, headers, lang) {
  const list = asArray(uris).slice(0, 8);
  const settled = await Promise.all(
    list.map((uri) =>
      fetchEntity(uri, headers, lang)
        .then((entry) => ({ uri, code: entry.code, display: entry.display }))
        .catch(() => null),
    ),
  );
  return settled.filter(Boolean);
}

// The release list endpoint's exact shape is not contractual, so it is read
// defensively: strings and release-id-bearing objects are both accepted. If the
// API returns something unexpected the caller is told to set WHO_ICD11_RELEASE
// explicitly rather than having a release guessed on their behalf.
function pickRelease(payload) {
  const ids = [];
  for (const entry of asArray(payload)) {
    if (typeof entry === "string" && /^\d{4}-\d{2}$/.test(entry)) ids.push(entry);
    else if (entry && typeof entry === "object") {
      const candidate = entry.releaseId || entry.release_id || entry.id || entry.release || "";
      const text = String(candidate).split("/").filter(Boolean).pop() || "";
      if (/^\d{4}-\d{2}$/.test(text)) ids.push(text);
    }
  }
  return ids.sort().reverse()[0] || "";
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mode = String(body.mode || "search");
    if (!["search", "entity", "releases"].includes(mode)) {
      return Response.json({ error: "mode must be search, entity or releases" }, { status: 400 });
    }

    const clientId = readSecret("WHO_ICD11_CLIENT_ID");
    const clientSecret = readSecret("WHO_ICD11_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return Response.json({
        configured: false,
        message:
          "WHO ICD-11 API credentials are not configured for this workspace, so no code can be verified automatically. " +
          "Until they are added, enter the code and official term from the WHO ICD-11 browser — it is stored as review required, never as verified.",
        documentation: "https://icd.who.int/icdapi",
      });
    }

    const token = await accessToken(clientId, clientSecret);
    const lang = body.lang === "ar" ? "ar" : "en";
    const headers = apiHeaders(token, lang);

    let release = readSecret("WHO_ICD11_RELEASE");
    if (!release) {
      const relRes = await fetch(API_ROOT, { headers, signal: AbortSignal.timeout(15_000) });
      if (relRes.ok) release = pickRelease(await relRes.json().catch(() => null));
    }
    if (!release) {
      return Response.json(
        {
          configured: true,
          error:
            "The WHO API did not report a usable ICD-11 release. Set WHO_ICD11_RELEASE (for example 2024-01) in the workspace secrets.",
        },
        { status: 409 },
      );
    }

    const retrievedAt = new Date().toISOString();
    const verification = {
      source: "WHO ICD-11 API",
      endpoint: "id.who.int",
      release,
      language: lang,
      retrieved_at: retrievedAt,
    };

    if (mode === "releases") {
      const relRes = await fetch(API_ROOT, { headers, signal: AbortSignal.timeout(15_000) });
      if (!relRes.ok) throw Object.assign(new Error(`WHO ICD-11 release list failed (${relRes.status}).`), { status: 502 });
      const payload = await relRes.json().catch(() => null);
      return Response.json({ configured: true, selectedRelease: release, releases: asArray(payload), ...verification });
    }

    if (mode === "entity") {
      const uri = String(body.uri || "").trim();
      if (!/^https:\/\/id\.who\.int\//.test(uri)) {
        return Response.json({ error: "uri must be an id.who.int entity URI" }, { status: 400 });
      }
      const entry = await fetchEntity(uri, headers, lang);
      // The classification path is context for the code, so it is returned with
      // the entry. A failure to read the path never fails the entry itself: the
      // clinician still gets exactly what the service returned for the code.
      const ancestors = body.withAncestors === false ? [] : await fetchAncestors(entry.ancestor_uris, headers, lang);
      return Response.json({
        configured: true,
        release,
        entry: { ...entry, ancestors },
        ...verification,
      });
    }

    const query = String(body.query || "").trim();
    if (query.length < 2) return Response.json({ error: "query must be at least 2 characters" }, { status: 400 });
    if (query.length > 120) return Response.json({ error: "query is too long (max 120 characters)" }, { status: 400 });
    const limit = Math.min(Math.max(Number(body.limit) || 15, 1), 25);

    const url =
      `${API_ROOT}/${release}/mms/search?q=${encodeURIComponent(query)}` +
      `&flatResults=true&useFlexibleSearch=true&includeKeywordResult=false`;
    const searchKey = `search|${lang}|${release}|${query.toLowerCase()}`;
    let data = cacheGet(searchKey);
    if (!data) {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw Object.assign(
          new Error(`WHO ICD-11 search failed (${res.status}). ${detail.slice(0, 200)}`),
          { status: 502 },
        );
      }
      data = cacheSet(searchKey, await res.json());
    }

    const results = asArray(data.destinationEntities)
      .map((e) => ({
        uri: e.id || "",
        code: e.theCode || "",
        display: e.title?.["@value"] || "",
        // A WHO grouping node without a code cannot be stored as a diagnosis.
        codable: Boolean(e.theCode),
        is_leaf: e.isLeaf === true,
        chapter: e.chapter || "",
        score: typeof e.score === "number" ? e.score : null,
        browser_url: BROWSER_ROOT,
      }))
      .filter((r) => r.display)
      .slice(0, limit);

    return Response.json({ configured: true, release, query, results, ...verification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}