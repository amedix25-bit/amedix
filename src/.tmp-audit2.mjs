import { stubCanvas } from "./.tmp-canvas.mjs";
stubCanvas();

const { generateClinicalNotePdf } = await import("@/lib/clinicalNotePdf");
const { SPECIALTY_DOCUMENTS } = await import("@/lib/specialtyDocuments");
const { auditPdfLayout } = await import("@/lib/pdfLayoutAudit");

const LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const LONG =
  "The patient reports a progressive course over the preceding three weeks with intermittent symptoms that are worse on exertion and at night, partially relieved by rest, with no associated fever, weight loss or night sweats. Family history is notable for premature coronary disease in a first-degree relative.";
const BULLETS = "• General appearance: Alert, comfortable at rest\n• Cardiovascular: S1 S2 heard, no murmur\n• Respiratory: Clear to auscultation bilaterally";

const def = SPECIALTY_DOCUMENTS.find((d) => d.key === "im_consultation");
const data = {};
(def.fields || []).forEach((f, i) => {
  let value = "Documented";
  if (f.type === "vitals") value = "BP: 138/86 mmHg · Pulse: 92 bpm · Temp: 36.9°C";
  else if (i % 3 === 0) value = BULLETS;
  else if (i % 2 === 0) value = LONG;
  data[f.key] = { label: f.label, value };
});
const doc = await generateClinicalNotePdf(
  { document_type: def.key, document_type_label: def.label, patient_name: "A B", doctor_name: "Dr X", data },
  { logo: LOGO, profile: {} }
);
const issues = auditPdfLayout(doc);
console.log("issues:", issues.length, JSON.stringify(issues.slice(0, 3), null, 1));
const boxes = doc.__pdfBoxes.filter((b) => b.page === 1).sort((a, b) => a.top - b.top);
boxes.slice(0, 14).forEach((b) => console.log(b.kind, "x", b.x.toFixed(1), "w", b.width.toFixed(1), "top", b.top.toFixed(1), "bot", (b.top + b.height).toFixed(1), b.label.slice(0, 40)));