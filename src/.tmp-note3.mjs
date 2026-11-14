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
  id: "note-en",
  document_type: "cardiology_consultation",
  document_type_label: "Cardiology Consultation Note",
  note_reference: "CN-20261114-0001",
  patient_name: "Mariam Abdulla Gaddafi Al-Mansouri",
  patient_cin: "CIN-2026-1001",
  patient_dob: "1984-06-12",
  doctor_name: "Dr. Sara Al-Mansouri",
  specialty: "cardiology",
  hospital: "Tripoli Central Hospital",
  encounter_datetime: "2026-11-14T09:20:00Z",
  history:
    "58-year-old woman with exertional central chest pain for three weeks, relieved by rest, with exertional dyspnoea and no rest pain. She denies syncope, palpitations and orthopnoea.",
  vital_signs:
    "Blood Pressure: 148/92 mmHg · Heart Rate: 88 bpm · Respiratory Rate: 18 /min · Temperature: 36.9 °C · Oxygen Saturation (SpO₂): 97 % · Weight: 78 kg · Height: 162 cm · BMI: 29.7",
  physical_examination:
    "Cardiovascular\n• Heart sounds: dual rhythm, no murmur\n• JVP: not raised\n• Peripheral pulses: intact bilaterally\n\nRespiratory\n• Air entry: equal bilaterally\n• Added sounds: fine basal crepitations",
  allergies: "Penicillin — rash",
  current_medications: ["Atorvastatin 20 mg", "Bisoprolol 2.5 mg", "Aspirin 75 mg"],
  diagnosis: "Stable angina pectoris, likely multi-vessel coronary artery disease",
  provisional_diagnoses: ["Stable angina pectoris", "Essential hypertension"],
  recommendations: "Start beta-blocker uptitration, arrange exercise tolerance test, cardiology review in two weeks.",
  prescription: "Bisoprolol 5 mg once daily\nAtorvastatin 40 mg at night",
  notes: "Patient counselled on lifestyle modification.",
  data: {
    "card.1": { label: "NYHA class", value: "II" },
    "card.2": { label: "Risk score", value: "GRACE 118" },
    "card.3": { label: "Echo ejection fraction", value: "48 %" },
    "card.4": { label: "Family history of premature CAD", value: "Father, myocardial infarction at 54 years" },
    "card.5": {
      label: "Cardiology examination",
      type: "examinations",
      value: "Inspection\n• Finding: normal\n• Note: no abnormality detected\n\nPalpation\n• Finding: soft\n• Note: no tenderness",
    },
  },
  signed_by_name: "Dr. Sara Al-Mansouri",
  signed_datetime: "2026-11-14T10:05:00Z",
};

const doc = await generateClinicalNotePdf(note, { logo, profile: { gender: "female", blood_type: "O+" } });
const issues = auditPdfLayout(doc);
const rows = (doc.__pdfBoxes || [])
  .filter((b) => b.page === 1 && b.top > 118 && b.top < 264)
  .sort((a, b) => a.top - b.top || a.x - b.x)
  .map((b) => `${b.top.toFixed(1).padStart(6)} x=${b.x.toFixed(0).padStart(3)} w=${b.width.toFixed(0).padStart(3)} ${b.kind.padEnd(7)} ${b.label.slice(0, 46)}`);
console.log(`issues=${issues.length} pages=${doc.getNumberOfPages()}`);
console.log(rows.join("\n"));