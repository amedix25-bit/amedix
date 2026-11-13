import { stubCanvas } from "./.tmp-canvas.mjs";
stubCanvas();

const { generateClinicalNotePdf } = await import("@/lib/clinicalNotePdf");
const { SPECIALTY_DOCUMENTS } = await import("@/lib/specialtyDocuments");
const { auditPdfLayout } = await import("@/lib/pdfLayoutAudit");

const LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const LONG =
  "The patient reports a progressive course over the preceding three weeks with intermittent symptoms that are worse on exertion and at night, partially relieved by rest, with no associated fever, weight loss or night sweats. Family history is notable for premature coronary disease in a first-degree relative.";
const SHORT = "Documented";
const BULLETS = "• General appearance: Alert, comfortable at rest\n• Cardiovascular: S1 S2 heard, no murmur\n• Respiratory: Clear to auscultation bilaterally";
const ARABIC = "يشكو المريض من ألم في الصدر منذ ثلاثة أسابيع مع ضيق في التنفس عند المجهود ولا يوجد تاريخ مرضي سابق";

function build(def, mode) {
  const data = {};
  (def.fields || []).forEach((f, i) => {
    let value = SHORT;
    if (f.type === "vitals") value = "BP: 138/86 mmHg · Pulse: 92 bpm · Temp: 36.9°C · RR: 20 · SpO₂: 95% · Weight: 84 kg · Height: 172 cm · BMI: 28.4";
    else if (mode === "dense") value = i % 2 ? LONG : BULLETS;
    else if (i % 3 === 0) value = BULLETS;
    else if (i % 2 === 0) value = LONG;
    if (mode === "ar" && i % 4 === 0) value = ARABIC;
    data[f.key] = { label: f.label, value };
  });
  return {
    document_type: def.key,
    document_type_label: def.label,
    note_reference: "CN-20261113-8F3K",
    patient_name: mode === "ar" ? "محمد علي أحمد" : "Mohammed Ali Ahmed",
    patient_cin: "CIN-000123",
    doctor_name: "Dr Sarah Hassan",
    hospital: "Tripoli Central Hospital",
    specialty: def.specialty || "",
    vital_signs: "BP: 130/80 mmHg · Pulse: 80 bpm",
    data,
  };
}

const tally = {};
let pages = 0;
let count = 0;
for (const def of SPECIALTY_DOCUMENTS) {
  for (const mode of ["normal", "dense", "ar"]) {
    const doc = await generateClinicalNotePdf(build(def, mode), { logo: LOGO, profile: {} });
    pages += doc.getNumberOfPages();
    count += 1;
    auditPdfLayout(doc).forEach((issue) => {
      tally[issue.kind] = (tally[issue.kind] || 0) + 1;
      if (Object.values(tally).reduce((a, b) => a + b, 0) < 8) console.log("!", def.key, mode, issue.kind, issue.detail);
    });
  }
}
console.log("documents:", count, "avg pages:", (pages / count).toFixed(2));
console.log("issues by kind:", JSON.stringify(tally));