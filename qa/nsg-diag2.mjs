import { SPECIALTY_DOCUMENTS } from "@/lib/specialtyDocuments";
import { NEUROSURGERY_DOCS } from "@/lib/neurosurgeryDocuments";

const walk = (doc) => {
  const out = [];
  (doc.fields || []).forEach((f) => {
    if (f && Array.isArray(f.fields)) f.fields.forEach((x) => out.push({ ...x, section: f.title || f.section }));
    else if (f) out.push(f);
  });
  return out;
};
const live = new Map(SPECIALTY_DOCUMENTS.filter((d) => d.specialty === "neurosurgery").map((d) => [d.key, d]));
NEUROSURGERY_DOCS.forEach((raw) => {
  const r = walk(raw);
  const lk = walk(live.get(raw.key) || {}).map((f) => f.key);
  r.filter((f) => f.key && !lk.includes(f.key)).forEach((f) => console.log(raw.key, "|", f.key, "|", f.section, "|", f.label));
});

console.log("\n-- examinations field kept in other specialties? --");
["cardiology", "neurology", "general_surgery", "internal_medicine"].forEach((sp) => {
  const docs = SPECIALTY_DOCUMENTS.filter((d) => d.specialty === sp);
  const withExam = docs.filter((d) => walk(d).some((f) => f.type === "examinations")).length;
  console.log(sp, "notes", docs.length, "with shared examinations field:", withExam);
});