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

const def = SPECIALTY_DOCUMENTS.find((d) => d.key === "surg_discharge_summary");
const data = {};
(def.fields || []).forEach((f, i) => {
  let value = i % 3 === 0 ? BULLETS : i % 2 === 0 ? LONG : "Documented";
  if (f.type === "vitals") value = "BP: 138/86 mmHg · Pulse: 92 bpm";
  data[f.key] = { label: f.label, value };
});
const doc = await generateClinicalNotePdf(
  { document_type: def.key, document_type_label: def.label, patient_name: "A B", doctor_name: "Dr X", data },
  { logo: LOGO, profile: {} }
);
console.log("audit:", JSON.stringify(auditPdfLayout(doc).slice(0, 3)));
const boxes = doc.__pdfBoxes;
const p1 = boxes.filter((b) => b.page === 1).sort((a, b) => a.top - b.top);
p1.slice(-5).forEach((b) => console.log("p1", b.kind, b.top.toFixed(1), b.label.slice(0, 34)));
const p2 = boxes.filter((b) => b.page === 2).sort((a, b) => a.top - b.top);
p2.slice(0, 4).forEach((b) => console.log("p2", b.kind, b.top.toFixed(1), b.label.slice(0, 34)));