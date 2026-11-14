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
const { SPECIALTY_DOCUMENTS } = await import("@/lib/specialtyDocuments");
const { auditPdfLayout } = await import("@/lib/pdfLayoutAudit");

const logo = { dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", ratio: 1.13 };

const base = {
  id: "edge",
  patient_name: "Mariam Abdulla",
  patient_cin: "CIN-2026-1001",
  doctor_name: "Dr. Sara Al-Mansouri",
  hospital: "Tripoli Central Hospital",
  signed_by_name: "Dr. Sara Al-Mansouri",
};

const cases = [
  { name: "minimal", note: { ...base } },
  { name: "name-only-dob", note: { ...base, patient_dob: "1984-06-12", document_type_label: "Clinical Note" } },
  {
    name: "huge-single-field",
    note: {
      ...base,
      document_type_label: "Clinical Note",
      document_type: "cardiology_consultation",
      specialty: "cardiology",
      history: Array.from({ length: 40 }, (_, i) => `Sentence ${i + 1}: the patient reports intermittent symptoms with no rest pain and no syncope.`).join(" "),
      data: { "card.huge": { label: "Extended narrative", value: Array.from({ length: 30 }, (_, i) => `Paragraph ${i + 1}: detailed clinical account of the encounter and its findings.`).join("\n") } },
    },
  },
  {
    name: "unbreakable-token",
    note: {
      ...base,
      document_type_label: "Clinical Note",
      data: { "card.token": { label: "Reference", value: `REF-${"X".repeat(180)}` } },
    },
  },
  {
    name: "arabic-sample",
    note: {
      ...base,
      document_type_label: "ملاحظة سريرية",
      patient_name: "مريم عبد الله القذافي",
      history: "تشكو المريضة من ألم في الصدر عند الجهد منذ ثلاثة أسابيع، يخف بالراحة.",
      data: { "card.a1": { label: "التاريخ المرضي", value: "لا يوجد تاريخ سابق لأمراض القلب." }, "card.a2": { label: "الأدوية", value: "أتورفاستاتين 20 ملغ" } },
    },
  },
  {
    name: "arabic-full",
    note: {
      ...base,
      document_type_label: "ملاحظة سريرية — القلب",
      document_type: "cardiology_consultation",
      specialty: "cardiology",
      patient_name: "مريم عبد الله القذافي",
      data: Object.fromEntries(
        Array.from({ length: 24 }, (_, k) => [
          `card.ar${k}`,
          { label: `البند ${k + 1}`, value: "قيمة سريرية موثقة تشمل عدة تفاصيل مهمة عن الحالة الحالية." },
        ])
      ),
    },
  },
];

for (const item of cases) {
  try {
    const doc = await generateClinicalNotePdf(item.note, { logo, profile: { gender: "female", blood_type: "O+" } });
    const issues = auditPdfLayout(doc);
    let extra = "";
    if (issues.length) {
      const p1 = (doc.__pdfBoxes || []).filter((b) => b.page === 1).sort((a, b) => a.top - b.top);
      extra = p1.slice(-3).map((b) => `${b.kind}:${b.label.slice(0, 24)}@${b.top.toFixed(0)}`).join(" | ");
    }
    console.log(JSON.stringify({ case: item.name, pages: doc.getNumberOfPages(), issues: issues.length, first: issues[0]?.detail || "", extra }));
  } catch (e) {
    console.log(JSON.stringify({ case: item.name, error: String(e.message).slice(0, 120) }));
  }
}

// Arabic pass over a spread of specialty templates.
let arabicFailures = 0;
const sample = SPECIALTY_DOCUMENTS.filter((_, i) => i % 23 === 0).slice(0, 20);
for (const def of sample) {
  const data = {};
  (def.fields || []).slice(0, 25).forEach((field) => {
    data[field.key] = {
      label: `${field.label} — ${def.label}`,
      type: field.type,
      value: field.type === "examinations"
        ? "الفحص\n• النتيجة: طبيعي\n• ملاحظة: لا شذوذ"
        : "قيمة سريرية موثقة تشمل عدة تفاصيل مهمة عن الحالة الحالية والتاريخ المرضي للمريض.",
    };
  });
  try {
    const doc = await generateClinicalNotePdf(
      { ...base, document_type: def.key, document_type_label: def.label, patient_name: "مريم عبد الله القذافي", data },
      { logo, profile: { gender: "female", blood_type: "O+" } }
    );
    if (auditPdfLayout(doc).length > 0) arabicFailures += 1;
  } catch (e) {
    arabicFailures += 1;
  }
}
console.log(JSON.stringify({ arabicTemplates: sample.length, arabicFailures }));