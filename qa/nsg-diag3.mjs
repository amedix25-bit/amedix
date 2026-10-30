import { SPECIALTY_DOCUMENTS } from "@/lib/specialtyDocuments";

const walk = (doc) => {
  const out = [];
  (doc.fields || []).forEach((f) => {
    if (f && Array.isArray(f.fields)) f.fields.forEach((x) => out.push({ ...x, section: f.title || f.section }));
    else if (f) out.push(f);
  });
  return out;
};
const docs = SPECIALTY_DOCUMENTS.filter((d) => d.specialty === "neurosurgery");
docs.forEach((d) => {
  const f = walk(d);
  const mod = (re) => (f.some((x) => re.test(x.key || "")) ? "Y" : "-");
  console.log(
    d.key.padEnd(22),
    "icd", mod(/^nsg_icd11|icd11/),
    "guid", mod(/guidance/),
    "exam", mod(/nsg_exam$/),
    "isncsi", mod(/isncsci/),
    "scores", mod(/score/),
    "emerg", mod(/emergency/),
    "oper", mod(/operative/),
    "postop", mod(/postop/),
    "total", f.length
  );
});