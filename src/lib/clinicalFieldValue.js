// Serializes the structured Rheumatology fields into the readable text stored
// with a clinical note or document, so the diagnosis and investigation detail
// is preserved in the longitudinal record and in exports.
import { formatInstrumentEntry } from "@/lib/rheumInstruments";
import { formatTreatmentPlan } from "@/lib/rheumTreatmentSafety";

export function formatFieldValue(type, value) {
  if (value === undefined || value === null) return "";

  if (type === "disease_activity" && Array.isArray(value)) {
    return value
      .map((e) => formatInstrumentEntry(e) + (e.inputs ? "" : ""))
      .join("\n");
  }

  if (type === "icd11_diagnoses" && Array.isArray(value)) {
    return value
      .map((d) => {
        const head = `${d.code || ""} ${d.display || ""}`.trim();
        const meta = [d.role, d.status, d.version].filter(Boolean).join(" · ");
        return (
          `${head}${meta ? ` — ${meta}` : ""}` +
          (d.basis ? ` — Basis: ${String(d.basis).trim()}` : "") +
          (d.follow_up ? ` — Follow-up: ${String(d.follow_up).trim()}` : "") +
          (d.manual ? " — code entered from the WHO browser" : "")
        );
      })
      .join("\n");
  }

  if (type === "investigation_panels" && Array.isArray(value)) {
    return value
      .map((i) => {
        const detail = [
          i.indication ? `Indication: ${String(i.indication).trim()}` : "",
          i.result ? `Result: ${String(i.result).trim()}${i.units ? ` ${i.units}` : ""}` : "",
          i.reference_range ? `Reference: ${String(i.reference_range).trim()}` : "",
          i.interpretation ? `Interpretation: ${i.interpretation}` : "",
          i.follow_up ? `Action: ${String(i.follow_up).trim()}` : "",
        ]
          .filter(Boolean)
          .join("; ");
        return `${i.name}${i.panel ? ` [${i.panel}]` : ""}${i.status ? ` — ${i.status}` : ""}${detail ? ` — ${detail}` : ""}`;
      })
      .join("\n");
  }

  if (type === "rheum_treatment") return formatTreatmentPlan(value);

  return String(value);
}