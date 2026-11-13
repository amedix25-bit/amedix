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
const ARABIC = "يشكو المريض من ألم في الصدر منذ ثلاثة أسابيع مع ضيق في التنفس عند المجهود ولا يوجد تاريخ مرضي سابق";

function build(def, { arabic = false } = {}) {
  const data = {};
  (def.fields || []).forEach((f, i) => {
    let value = "Documented";
    if (f.type === "vitals") value = "BP: 138/86 mmHg · Pulse: 92 bpm · Temp: 36.9°C · RR: 20 · SpO₂: 95% · Weight: 84 kg · Height: 172 cm · BMI: 28.4";
    else if (i % 3 === 0) value = BULLETS;
    else if (i % 2 === 0) value = LONG;
    if (arabic && i % 4 === 0) value = ARABIC;
    data[f.key] = { label: f.label, value };
  });
  return {
    document_type: def.key,
    document_type_label: def.label,
    note_reference: "CN-20261113-8F3K",
    patient_name: arabic ? "محمد علي أحمد" : "Mohammed Ali Ahmed",
    patient_cin: "CIN-000123",
    doctor_name: arabic ? "د. سارة" : "Dr Sarah Hassan",
    hospital: "Tripoli Central Hospital",
    specialty: def.specialty || "",
    vital_signs: "BP: 130/80 mmHg · Pulse: 80 bpm",
    data,
  };
}

const sample = (list, n) => list.filter((_, i) => i % Math.max(1, Math.floor(list.length / n)) === 0).slice(0, n);

let total = 0;
const kinds = {};
for (const def of sample(SPECIALTY_DOCUMENTS, 14)) {
  for (const arabic of [false, true]) {
    const doc = await generateClinicalNotePdf(build(def, { arabic }), { logo: LOGO, profile: {} });
    const issues = auditPdfLayout(doc);
    total += issues.length;
    issues.forEach((i) => {
      kinds[`${i.kind} ${i.detail}`] = (kinds[`${i.kind} ${i.detail}`] || 0) + 1;
      if (Object.keys(kinds).length < 12) console.log("  !", def.key, arabic ? "AR" : "EN", i.kind, i.detail);
    });
    console.log(def.key, arabic ? "AR" : "EN", "pages:", doc.getNumberOfPages(), "issues:", issues.length);
  }
}
console.log("TOTAL ISSUES:", total);