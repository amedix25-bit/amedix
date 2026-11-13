import { jsPDF } from "jspdf";
import { generateClinicalNotePdf } from "@/lib/clinicalNotePdf";
import { getSpecialtyDocs } from "@/lib/specialtyDocuments";

const LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const long =
  "Patient reports progressive exertional breathlessness over three weeks, worse on climbing stairs, with orthopnoea requiring two pillows and no paroxysmal nocturnal dyspnoea. Denies chest pain at rest.";

function valueFor(field, i) {
  const type = field.type || "input";
  if (type === "vitals") {
    return "BP: 138/86 mmHg · Pulse: 92 bpm · Temp: 36.9°C · RR: 20 breaths/min · SpO₂: 95% · Weight: 84 kg · Height: 172 cm · BMI: 28.4";
  }
  if (type === "select") return (field.options || ["Yes"])[0];
  if (type === "number") return String(20 + i);
  if (type === "textarea") return i % 3 === 0 ? long : "Documented";
  if (type === "examinations") {
    return "Cardiovascular Examination — Documented\n• General: Normal\n• Peripheral: Abnormal — JVP raised 4 cm, pitting oedema to mid-shin\n• Auscultation: Abnormal — 3/6 systolic murmur at apex";
  }
  if (i % 4 === 0) return "• Finding one: Normal\n• Finding two: Abnormal — mild\n• Finding three: Not assessed";
  if (i % 3 === 0) return long;
  return "Not assessed";
}

const cases = [];
for (const spec of ["Cardiology", "Obstetrics & Gynecology", "Neurology", "Internal Medicine"]) {
  const docs = getSpecialtyDocs(spec);
  const def = docs.find((d) => (d.fields || []).some((f) => f.section)) || docs[0];
  const data = {};
  (def.fields || []).forEach((f, i) => {
    data[f.key] = { label: f.label, value: valueFor(f, i) };
  });
  cases.push({
    def,
    note: {
      id: "n1",
      document_type: def.key,
      document_type_label: def.label,
      note_reference: "NOTE-20261113-8F3K",
      patient_name: "Amina Mohamed Al-Fituri",
      patient_cin: "CIN-2026-8F3K2M",
      patient_dob: "1979-04-12",
      doctor_name: "Dr. Sara Ben Ali",
      specialty: def.specialty,
      hospital: "Tripoli Central Hospital",
      encounter_datetime: "2026-11-13T19:40:00Z",
      history: long,
      allergies: "Penicillin — rash",
      current_medications: ["Furosemide 40 mg", "Bisoprolol 5 mg"],
      provisional_diagnoses: ["Heart failure with reduced ejection fraction", "Atrial fibrillation"],
      prescription: "Furosemide 40 mg PO daily\nBisoprolol 5 mg PO daily",
      recommendations: "Daily weights, fluid restriction 1.5 L",
      vital_signs: "BP: 138/86 mmHg · Pulse: 92 bpm · Temp: 36.9°C · RR: 20 · SpO₂: 95%",
      physical_examination:
        "Cardiovascular Examination — Documented\n• General: Normal\n• Peripheral: Abnormal — JVP raised 4 cm\n\nRespiratory Examination — Documented\n• Chest: Abnormal — bibasal crackles",
      signed_by_name: "Dr. Sara Ben Ali",
      signed_datetime: "2026-11-13T20:05:00Z",
      data,
    },
  });
}

// Section labels are drawn character by character for their tracking, so the
// extracted text is flattened before it is compared.
const pdfText = (pdf) =>
  [...pdf.matchAll(/\((?:\\.|[^()\\])*\)\s*Tj/g)]
    .map((m) => m[0].replace(/\)\s*Tj$/, "").slice(1).replace(/\\([()\\])/g, "$1"))
    .join("")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const key = (label) =>
  label
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 18);

const report = [];
for (const { def, note } of cases) {
  const doc = await generateClinicalNotePdf(note, { logo: LOGO, profile: { gender: "female", blood_type: "O+" } });
  const text = pdfText(doc.output());
  const uniqueHeadings = [...new Set((def.fields || []).filter((f) => f.section).map((f) => f.section))];
  const missing = uniqueHeadings.filter((h) => !text.includes(key(h)));
  const fieldLabels = [...new Set((def.fields || []).map((f) => f.label))];
  const missingFields = fieldLabels.filter((l) => !text.includes(key(l)));
  report.push(
    `${def.label} [${def.key}] pages=${doc.getNumberOfPages()} chars=${text.length} ` +
      `sections=${uniqueHeadings.length} missingSections=${missing.length} missingFields=${missingFields.length}` +
      (missing.length ? `\n   SECT: ${missing.slice(0, 5).join(" | ")}` : "") +
      (missingFields.length ? `\n   FIELD: ${missingFields.slice(0, 5).join(" | ")}` : "") +
      (missingFields.length
        ? `\n   DETAIL: ${(def.fields || [])
            .filter((f) => missingFields.includes(f.label))
            .slice(0, 5)
            .map((f) => `${f.key}/${f.type}/${f.section || "-"}`)
            .join(" | ")}`
        : "")
  );
}

console.log(report.join("\n"));