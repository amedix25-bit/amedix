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
  createElement: () => {
    const el = {
      width: 300,
      height: 60,
      getContext: () => mkCtx(),
      toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    };
    return el;
  },
};
globalThis.Image = class {};
globalThis.window = globalThis;

const { generateClinicalNotePdf } = await import("@/lib/clinicalNotePdf");
const { auditPdfLayout } = await import("@/lib/pdfLayoutAudit");

const logo = { dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", ratio: 1.13 };

const longNote = (i, arabic) => ({
  id: `note-${i}`,
  document_type: "cardiology_consultation",
  document_type_label: arabic ? "ملاحظة سريرية — القلب" : "Cardiology Consultation Note",
  note_reference: `CN-20261114-${String(i).padStart(4, "0")}`,
  patient_name: arabic ? "مريم عبد الله القذافي" : "Mariam Abdulla Gaddafi",
  patient_cin: `CIN-2026-${1000 + i}`,
  patient_dob: "1984-06-12",
  doctor_name: "Dr. Sara Al-Mansouri",
  specialty: "cardiology",
  hospital: "Tripoli Central Hospital",
  encounter_datetime: "2026-11-14T09:20:00Z",
  history: arabic
    ? "تشكو المريضة من ألم في الصدر عند الجهد منذ ثلاثة أسابيع، يخف بالراحة، مع ضيق نفس عند الصعود."
    : "58-year-old woman with exertional central chest pain for three weeks, relieved by rest, with exertional dyspnoea and no rest pain.",
  vital_signs: "Blood Pressure: 148/92 mmHg · Heart Rate: 88 bpm · Respiratory Rate: 18 /min · Temperature: 36.9 °C · Oxygen Saturation (SpO₂): 97 % · Weight: 78 kg · Height: 162 cm · BMI: 29.7",
  physical_examination:
    "Cardiovascular\n• Heart sounds: dual rhythm, no murmur\n• JVP: not raised\n• Peripheral pulses: intact bilaterally\n\nRespiratory\n• Air entry: equal bilaterally\n• Added sounds: fine basal crepitations\n\nAbdomen\n• Soft, non-tender, no organomegaly",
  allergies: "Penicillin — rash",
  current_medications: ["Atorvastatin 20 mg", "Bisoprolol 2.5 mg", "Aspirin 75 mg"],
  diagnosis: "Stable angina pectoris, likely multi-vessel coronary artery disease",
  provisional_diagnoses: ["Stable angina pectoris", "Essential hypertension", "Type 2 diabetes mellitus"],
  recommendations: "Start beta-blocker uptitration, arrange exercise tolerance test, cardiology review in two weeks, red-flag advice given.",
  prescription: "Bisoprolol 5 mg once daily\nAtorvastatin 40 mg at night\nGTN spray as required",
  notes: "Patient counselled on lifestyle modification, smoking cessation and hypoglycaemia awareness.",
  biopsy: "",
  interventions: "Resting ECG performed in clinic — sinus rhythm, no acute ischaemic change.",
  data: Object.fromEntries(
    Array.from({ length: 46 }, (_, k) => [
      `card.${k}`,
      {
        label: arabic ? `البند السريري رقم ${k + 1} مع وصف مطول` : `Clinical field ${k + 1} with a moderately long descriptive label`,
        type: k % 7 === 0 ? "examinations" : "text",
        value:
          k % 7 === 0
            ? "Inspection\n• Finding: normal\n• Note: no abnormality detected\n\nPalpation\n• Finding: soft\n• Note: no tenderness"
            : arabic
            ? "قيمة سريرية موثقة للمريض تشمل عدة تفاصيل مهمة عن الحالة الحالية والتاريخ المرضي."
            : "Documented clinical value covering several relevant details of the present illness and prior history.",
      },
    ])
  ),
  signed_by_name: "Dr. Sara Al-Mansouri",
  signed_datetime: "2026-11-14T10:05:00Z",
});

const profile = { gender: "female", blood_type: "O+" };
const results = [];
for (const arabic of [false, true]) {
  for (const i of [1, 2, 3]) {
    const doc = await generateClinicalNotePdf(longNote(i, arabic), { logo, profile });
    const issues = auditPdfLayout(doc);
    results.push({ arabic, i, pages: doc.getNumberOfPages(), issues: issues.length, first: issues[0]?.detail || "" });
  }
}
console.log(JSON.stringify(results, null, 1));