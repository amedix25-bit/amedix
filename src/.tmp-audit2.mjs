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

const def = SPECIALTY_DOCUMENTS.find((d) => d.key === "peds_consultation");
const data = {};
(def.fields || []).forEach((f, i) => {
  let value = i % 3 === 0 ? BULLETS : i % 2 === 0 ? LONG : "Documented";
  if (f.type === "vitals") value = "BP: 138/86 mmHg · Pulse: 92 bpm · Temp: 36.9°C · RR: 20 · SpO₂: 95% · Weight: 84 kg · Height: 172 cm · BMI: 28.4";
  data[f.key] = { label: f.label, value };
});
const doc = await generateClinicalNotePdf(
  { document_type: def.key, document_type_label: def.label, patient_name: "A B", doctor_name: "Dr X", data },
  { logo: LOGO, profile: {} }
);
console.log("audit:", JSON.stringify(auditPdfLayout(doc)));
const boxes = doc.__pdfBoxes;
const heading = boxes.find((b) => b.label.startsWith("Measurements & examination"));
if (heading) {
  const after = boxes.filter((b) => b.page === heading.page && b.top > heading.top).sort((a, b) => a.top - b.top);
  console.log("heading page", heading.page, "top", heading.top.toFixed(1));
  after.slice(0, 6).forEach((b) => console.log("  next", b.kind, "top", b.top.toFixed(1), "bot", (b.top + b.height).toFixed(1), "x", b.x.toFixed(1), b.label.slice(0, 34)));
}