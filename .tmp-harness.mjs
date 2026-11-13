import { createServer } from "vite";

const server = await createServer({ root: "/app", server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" });
const { generateClinicalNotePdf } = await server.ssrLoadModule("/src/lib/clinicalNotePdf.js");


// minimal canvas + image stubs (only used for Arabic lines)
const ctx = () => ({
  font: "",
  fillStyle: "",
  textBaseline: "",
  measureText: (t) => ({ width: String(t).length * 6 }),
  fillText: () => {},
  drawImage: () => {},
});
globalThis.document = {
  createElement: () => ({
    width: 0, height: 0,
    getContext: ctx,
    toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  }),
};

const long = (n, s = "finding") => Array.from({ length: n }, (_, i) => `${s} ${i + 1}`).join("; ");
const note = {
  id: "n1", note_reference: "CN-20261113-8F3K", document_type: "im_consultation",
  document_type_label: "Internal Medicine — Comprehensive Consultation and Follow-Up Review",
  patient_name: "Fatima Mohamed Ali Al-Zawi", patient_cin: "CIN-2026-0001", patient_dob: "1979-04-02",
  doctor_name: "Dr. Yasmin Abdelsalam", doctor_specialization: "Internal Medicine", specialty: "internal_medicine",
  hospital: "Tripoli Medical Centre", date: "2026-11-13", encounter_datetime: "2026-11-13T10:20:00Z",
  history: long(40, "history line"),
  vital_signs: "Temperature: 37.2 °C · Pulse: 88 bpm · Respiratory Rate: 18 breaths/min · Blood Pressure: 128/82 mmHg · Oxygen Saturation (SpO₂): 97 % · Weight: 74 kg · Height: 162 cm · BMI: 28.2 kg/m²",
  physical_examination: "General — Abnormal\n• General Appearance: Ill-looking, mildly pale; no jaundice\n• Hydration: Mucous membranes moist\nNotes: alert\n\nCardiovascular — Normal\n• Heart sounds: Normal S1 S2, no murmur\n\nRespiratory — Abnormal\n• Auscultation: Bilateral basal crepitations",
  provisional_diagnoses: ["Community-acquired pneumonia", "Type 2 diabetes mellitus"],
  prescription: "1. Amoxicillin 500 mg — 1 tablet three times daily for 7 days\n2. Paracetamol 1 g — as needed",
  recommendations: long(30, "advice"),
  allergies: "Penicillin — rash",
  current_medications: ["Metformin 1 g BD", "Atorvastatin 20 mg ON"],
  data: {
    vital_signs: { label: "Vital Signs", value: "Temperature: 37.2 °C · Pulse: 88 bpm · Respiratory Rate: 18 breaths/min · Blood Pressure: 128/82 mmHg · Oxygen Saturation (SpO₂): 97 % · Weight: 74 kg · Height: 162 cm · BMI: 28.2 kg/m²" },
    im_history_presenting: { label: "History of Presenting Illness", value: long(60, "presenting detail") },
    im_ros: { label: "Review of Systems", value: "Cardiovascular: no chest pain\nRespiratory: productive cough\nGastrointestinal: reduced appetite" },
    im_past_medical: { label: "Past Medical History", value: "Type 2 diabetes since 2012; hypertension" },
    im_investigations: { label: "Investigations Ordered", value: long(25, "CBC and CRP") },
    im_assessment: { label: "Assessment and Differential Diagnosis", value: long(35, "assessment") },
    im_plan: { label: "Management Plan", value: long(45, "plan") },
    im_guidance: { label: "Guideline Basis of This Note", value: "should never print" },
    "srh.contraception": { label: "Contraception", value: "None" },
    im_very_long_word: { label: "Reference Code", value: "X".repeat(420) },
    im_arabic: { label: "Chief Complaint", value: "سعال منتج مع حمى منذ خمسة أيام" },
  },
  signed_by_name: "Dr. Yasmin Abdelsalam", signed_datetime: "2026-11-13T10:55:00Z",
};

const logo = { dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", ratio: 3.2 };
const doc = await generateClinicalNotePdf(note, { logo, profile: { gender: "female", blood_type: "O+" } });
console.log("pages:", doc.getNumberOfPages());
const text = doc.output("datauristring");
console.log("guideline leaked:", /Guideline Basis/.test(text), "| has arabic image:", /data:image\/png/.test(text));

console.log('DONE');
await server.close();
process.exit(0);
