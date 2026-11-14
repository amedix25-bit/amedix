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
  id: "note-ar",
  document_type: "cardiology_consultation",
  document_type_label: "ملاحظة سريرية — القلب",
  note_reference: "CN-20261114-0001",
  patient_name: "مريم عبد الله القذافي",
  patient_cin: "CIN-2026-1001",
  patient_dob: "1984-06-12",
  doctor_name: "Dr. Sara Al-Mansouri",
  specialty: "cardiology",
  hospital: "Tripoli Central Hospital",
  encounter_datetime: "2026-11-14T09:20:00Z",
  history: "تشكو المريضة من ألم في الصدر عند الجهد منذ ثلاثة أسابيع، يخف بالراحة، مع ضيق نفس عند الصعود.",
  vital_signs: "Blood Pressure: 148/92 mmHg · Heart Rate: 88 bpm · Weight: 78 kg",
  physical_examination: "Cardiovascular\n• القلب: إيقاع ثنائي بدون لغط\n• النبض: طبيعي",
  allergies: "بنسلين — طفح",
  current_medications: ["أتورفاستاتين 20 ملغ"],
  diagnosis: "ذبحة صدرية مستقرة",
  data: Object.fromEntries(
    Array.from({ length: 40 }, (_, k) => [
      `card.${k}`,
      {
        label: `البند السريري رقم ${k + 1} مع وصف مطول`,
        type: "text",
        value: "قيمة سريرية موثقة للمريض تشمل عدة تفاصيل مهمة عن الحالة الحالية والتاريخ المرضي.",
      },
    ])
  ),
  signed_by_name: "Dr. Sara Al-Mansouri",
  signed_datetime: "2026-11-14T10:05:00Z",
};

const doc = await generateClinicalNotePdf(note, { logo, profile: { gender: "female", blood_type: "O+" } });
const issues = auditPdfLayout(doc);
const pages = new Map();
(doc.__pdfBoxes || []).forEach((b) => {
  if (!pages.has(b.page)) pages.set(b.page, []);
  pages.get(b.page).push(b);
});
const out = [...pages.entries()].map(([page, list]) => {
  const sorted = [...list].sort((a, b) => a.top - b.top);
  const bottom = Math.max(...list.map((b) => b.top + b.height));
  return {
    page,
    boxes: list.length,
    fill: Math.round(264 - bottom),
    first: sorted[0]?.label?.slice(0, 34),
    last: sorted[sorted.length - 1]?.label?.slice(0, 34),
  };
});
console.log(JSON.stringify({ pages: doc.getNumberOfPages(), issues: issues.length, detail: out }, null, 1));