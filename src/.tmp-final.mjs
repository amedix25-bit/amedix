import { generateClinicalNotePdf } from "@/lib/clinicalNotePdf";
import { getDocDef } from "@/lib/specialtyDocuments";

const LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const def = getDocDef("cardio_consultation");
const data = {};
(def.fields || []).forEach((f, i) => {
  data[f.key] = {
    label: f.label,
    value:
      f.type === "vitals"
        ? "BP: 138/86 mmHg · Pulse: 92 bpm · Temp: 36.9°C · RR: 20 · SpO₂: 95% · Weight: 84 kg"
        : i % 5 === 0
          ? "Documented"
          : i % 4 === 0
            ? "• Finding one: Normal\n• Finding two: Abnormal — mild"
            : "A longer narrative answer that has to take the full width of the sheet because it says substantially more than a short value can.",
  };
});
const doc = await generateClinicalNotePdf(
  {
    document_type: "cardio_consultation",
    document_type_label: def.label,
    patient_name: "A B",
    doctor_name: "Dr X",
    vital_signs: "BP: 130/80 mmHg · Pulse: 80 bpm",
    data,
  },
  { logo: LOGO, profile: {} }
);
const flat = [...doc.output().matchAll(/\((?:\\.|[^()\\])*\)\s*Tj/g)]
  .map((m) => m[0].replace(/\)\s*Tj$/, "").slice(1))
  .join("")
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "");
const sections = [...new Set((def.fields || []).filter((f) => f.section).map((f) => f.section))];
const missing = sections.filter(
  (s) => !flat.includes(s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 18))
);
console.log("pages:", doc.getNumberOfPages(), "sections:", sections.length, "missing:", missing.length, missing.join(" | "));