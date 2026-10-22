import { base44 } from "@/api/base44Client";

// Protected clinical file resolution (security hardening). Legacy public
// https URLs pass through unchanged; private storage URIs are resolved
// through the access-checked backend function into a short-lived signed
// URL, cached for its lifetime. No patient-identifiable file is ever
// linked publicly.
const cache = new Map(); // `${kind}|${id}|${fileRef}` -> { url, exp }
const TTL = 9 * 60 * 1000;

export default async function resolveClinicalFile(kind, id, fileRef) {
  if (!fileRef) return "";
  if (/^https?:/i.test(fileRef)) return fileRef;
  const key = `${kind || ""}|${id || ""}|${fileRef}`;
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.url;
  const res = await base44.functions.invoke("clinicalFileAccess", {
    kind,
    id,
    file_uri: fileRef,
  });
  const url = res.data.signed_url;
  cache.set(key, { url, exp: Date.now() + TTL });
  return url;
}