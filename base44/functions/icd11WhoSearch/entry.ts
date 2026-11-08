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

const apiHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Accept-Language": "en",
  "API-Version": "v2",
});

const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

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
    const headers = apiHeaders(token);

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
      const res = await fetch(uri, { headers, signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw Object.assign(new Error(`WHO ICD-11 entity lookup failed (${res.status}).`), { status: 502 });
      const e = await res.json();
      return Response.json({
        configured: true,
        release,
        entry: {
          uri,
          code: e.code || "",
          display: e.title?.["@value"] || "",
          definition: e.definition?.["@value"] || "",
          parent_uris: asArray(e.parent),
          child_uris: asArray(e.child),
          browser_url: e.browserUrl || "",
        },
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
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw Object.assign(
        new Error(`WHO ICD-11 search failed (${res.status}). ${detail.slice(0, 200)}`),
        { status: 502 },
      );
    }
    const data = await res.json();

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