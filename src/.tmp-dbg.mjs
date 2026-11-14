// Temporary verification harness (deleted after the run).
const mkCtx = () => ({
  font: "",
  measureText: (t) => ({ width: String(t).length * 7 }),
  fillStyle: "",
  textBaseline: "",
  textAlign: "",
  clearRect() {},
  fillRect() {},
  fillText() {},
  drawImage() {},
});
globalThis.document = {
  createElement: () => ({
    width: 400,
    height: 80,
    getContext: () => mkCtx(),
    toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  }),
};
globalThis.Image = class {};
globalThis.window = globalThis;

const { generateClinicalNotePdf } = await import("@/lib/clinicalNotePdf");
const { auditPdfLayout } = await import("@/lib/pdfLayoutAudit");

const logo = { dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", ratio: 1.13 };

const note = {
  id: "edge",
  document_type: "cardiology_consultation",
  document_type_label: "Clinical Note",
  specialty: "cardiology",
  patient_name: "Mariam Abdulla",
  patient_cin: "CIN-2026-1001",
  doctor_name: "Dr. Sara Al-Mansouri",
  hospital: "Tripoli Central Hospital",
  history: Array.from({ length: 40 }, (_, i) => `Sentence ${i + 1}: the patient reports intermittent symptoms with no rest pain and no syncope.`).join(" "),
  data: { "card.huge": { label: "Extended narrative", value: Array.from({ length: 30 }, (_, i) => `Paragraph ${i + 1}: detailed clinical account of the encounter and its findings.`).join("\n") } },
  signed_by_name: "Dr. Sara Al-Mansouri",
};

const doc = await generateClinicalNotePdf(note, { logo, profile: { gender: "female", blood_type: "O+" } });
const issues = auditPdfLayout(doc);
console.log("issues", issues.map((i) => i.detail));
[1, 2].forEach((page) => {
  const list = (doc.__pdfBoxes || []).filter((b) => b.page === page).sort((a, b) => a.top - b.top);
  console.log(`--- page ${page} (${list.length} boxes)`);
  console.log(list.slice(0, 6).map((b) => `${b.top.toFixed(0)} ${b.kind} ${b.label.slice(0, 30)}`).join("\n"));
  console.log("...");
  console.log(list.slice(-3).map((b) => `${b.top.toFixed(0)} ${b.kind} ${b.label.slice(0, 30)}`).join("\n"));
});