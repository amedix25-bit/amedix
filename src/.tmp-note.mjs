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

const makeNote = (i, arabic) => ({
  id: `note-${i}`,
  document_type: "cardiology_consultation",
  document_type_label: arabic ? "ملاحظة سريرية — القلب" : "Cardiology Consultation Note",
  note_reference: `CN-20261114-${String(i).padStart(4, "0")}`,
  patient_name: arabic ? "مريم عبد الله القذافي" : "Mariam Abdulla Gaddafi Al-Mansouri",
  patient_cin: `CIN-2026-${1000 + i}`,
  patient_dob: "1984-06-12",
  doctor_name: "Dr. Sara Al-Mansouri",
  specialty: "cardiology",
  hospital: "Tripoli Central Hospital",
  encounter_datetime: "2026-11-14T09:20:00Z",
  history: arabic
    ? "تشكو المريضة من ألم في الصدر عند الجهد منذ ثلاثة أسابيع، يخف بالراحة، مع ضيق نفس عند الصعود."
    : "58-year-old woman with exertional central chest pain for three weeks, relieved by rest, with exertional dyspnoea and no rest pain. She denies syncope, palpitations and orthopnoea. Cardiovascular risk factors include hypertension and type 2 diabetes mellitus diagnosed eight years ago.",
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

const sourceOf = (note) =>
  [
    ...Object.values(note.data || {}).map((f) => f.value),
    note.history,
    note.physical_examination,
    note.prescription,
    note.recommendations,
    note.interventions,
    note.notes,
    note.allergies,
    (note.current_medications || []).join(", "),
    (note.provisional_diagnoses || []).map((d) => `• ${d}`).join("\n"),
  ]
    .join("\n")
    .replace(/\s+/g, " ");

for (const arabic of [false, true]) {
  for (const i of [1, 2]) {
    const note = makeNote(i, arabic);
    const doc = await generateClinicalNotePdf(note, { logo, profile: { gender: "female", blood_type: "O+" } });
    const issues = auditPdfLayout(doc);
    const source = sourceOf(note);
    const broken = (doc.__pdfBoxes || [])
      .filter((b) => b.kind === "text" && !/[\u0600-\u06FF]/.test(b.label))
      .map((b) => b.label)
      .filter((line) => line.replace(/\s+/g, " ").trim().length > 24 && !source.includes(line.replace(/\s+/g, " ").trim()));
    const byPage = new Map();
    (doc.__pdfBoxes || []).forEach((b) => {
      const bottom = b.top + b.height;
      byPage.set(b.page, Math.max(byPage.get(b.page) || 0, bottom));
    });
    const ends = [...byPage.entries()].sort((a, b) => a[0] - b[0]).map(([pg, b]) => `${pg}:${Math.round(264 - b)}`);
    console.log(
      JSON.stringify({
        arabic,
        i,
        pages: doc.getNumberOfPages(),
        issues: issues.length,
        firstIssue: issues[0]?.detail || "",
        brokenLines: broken.slice(0, 3),
        boxes: (doc.__pdfBoxes || []).length,
        trailingGapMm: ends,
      })
    );
  }
}