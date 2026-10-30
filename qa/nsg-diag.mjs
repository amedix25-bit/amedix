import { SPECIALTY_DOCUMENTS } from "@/lib/specialtyDocuments";
import { NEUROSURGERY_DOCS } from "@/lib/neurosurgeryDocuments";

const walk = (doc) => {
  const out = [];
  (doc.fields || []).forEach((f) => {
    if (f && Array.isArray(f.fields)) f.fields.forEach((x) => out.push({ ...x, section: f.title || f.section }));
    else out.push(f);
  });
  return out;
};

const live = new Map(SPECIALTY_DOCUMENTS.filter((d) => d.specialty === "neurosurgery").map((d) => [d.key, d]));
console.log("raw notes:", NEUROSURGERY_DOCS.length, "live:", live.size);
NEUROSURGERY_DOCS.forEach((raw) => {
  const r = walk(raw);
  const l = walk(live.get(raw.key) || {});
  const rk = r.map((f) => f && f.key);
  const lk = l.map((f) => f && f.key);
  const gone = rk.filter((k) => !lk.includes(k));
  const guidanceKeys = lk.filter((k) => k && /guidance/i.test(k));
  const examKeys = lk.filter((k) => k && /exam|isncsci/i.test(k));
  console.log(
    raw.key.padEnd(24),
    "fields", String(r.length).padStart(2), "->", String(l.length).padStart(2),
    "| dropped:", gone.length ? gone.join(",") : "-",
    "| guidance:", guidanceKeys.join(",") || "NONE",
    "| exam:", examKeys.join(",") || "NONE"
  );
});