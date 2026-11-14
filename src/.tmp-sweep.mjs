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

const long =
  "Documented clinical finding covering several relevant details of the present illness, prior history and current management, recorded in the clinician's own words.";
const bullet =
  "Inspection\n• Finding: normal\n• Note: no abnormality detected\n\nPalpation\n• Finding: soft\n• Note: no tenderness";

const build = (def) => {
  const data = {};
  (def.fields || []).forEach((field, index) => {
    if (index % 9 === 8) return;
    const type = String(field.type || "");
    data[field.key] = {
      label: field.label,
      type,
      value:
        type === "examinations"
          ? bullet
          : index % 3 === 0
          ? "Yes"
          : index % 3 === 1
          ? "Mild restriction, no red flags"
          : long,
    };
  });
  return {
    id: `sweep-${def.key}`,
    document_type: def.key,
    document_type_label: def.label,
    note_reference: "CN-20261114-SWP1",
    patient_name: "Mariam Abdulla Gaddafi Al-Mansouri",
    patient_cin: "CIN-2026-1001",
    patient_dob: "1984-06-12",
    doctor_name: "Dr. Sara Al-Mansouri",
    specialty: def.specialty || def.specialtyKey || "cardiology",
    hospital: "Tripoli Central Hospital",
    encounter_datetime: "2026-11-14T09:20:00Z",
    history: long,
    vital_signs: "Blood Pressure: 148/92 mmHg · Heart Rate: 88 bpm · Weight: 78 kg",
    physical_examination: bullet,
    allergies: "Penicillin — rash",
    diagnosis: "Working diagnosis recorded by the treating clinician",
    data,
    signed_by_name: "Dr. Sara Al-Mansouri",
    signed_datetime: "2026-11-14T10:05:00Z",
  };
};

let failed = 0;
let maxPages = 0;
const samples = [];
for (const def of SPECIALTY_DOCUMENTS) {
  try {
    const doc = await generateClinicalNotePdf(build(def), { logo, profile: { gender: "female", blood_type: "O+" } });
    const issues = auditPdfLayout(doc);
    maxPages = Math.max(maxPages, doc.getNumberOfPages());
    if (issues.length > 0) {
      failed += 1;
      if (samples.length < 5) samples.push({ key: def.key, issues: issues.slice(0, 2).map((i) => i.detail) });
    }
  } catch (e) {
    failed += 1;
    if (samples.length < 5) samples.push({ key: def.key, error: String(e.message).slice(0, 90) });
  }
}
console.log(JSON.stringify({ templates: SPECIALTY_DOCUMENTS.length, failed, maxPages, samples }, null, 1));