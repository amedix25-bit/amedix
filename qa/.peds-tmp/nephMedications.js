// Structured medication review for the Nephrology notes.
//
// This documents a clinician's decision — it never prescribes, calculates a
// dose, stops a medicine or generates a regimen. Prescribing itself stays in
// the AMedix prescription module, which runs its own safety review.

export const NEPH_ROUTES = ["Oral", "Intravenous", "Intramuscular", "Subcutaneous", "Topical", "Inhaled", "Rectal", "Other"];

export const NEPH_RENAL_ADJUSTMENT = [
  "No adjustment required at this eGFR",
  "Dose reduced for kidney function",
  "Interval extended for kidney function",
  "Withheld — kidney function",
  "Contraindicated at this eGFR — not prescribed",
  "Not reviewed",
];

export const NEPH_CONTRAINDICATION_CHECK = [
  "Checked — no contraindication",
  "Checked — contraindication present, not prescribed",
  "Checked — allergy documented, not prescribed",
  "Not checked",
];

export const NEPH_INTERACTION_CHECK = [
  "Checked — no significant interaction",
  "Checked — interaction identified, managed",
  "Not checked",
];

export const NEPH_RESPONSE = ["Not yet assessable", "Goal met", "Partial response", "No response", "Intolerance or adverse effect"];

export const newNephMedRow = () => ({
  id: `med-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  name: "",
  dose: "",
  route: "",
  frequency: "",
  indication: "",
  renal_adjustment: "",
  renal_adjustment_note: "",
  contraindication_check: "",
  interaction_check: "",
  monitoring: "",
  response: "",
  review_date: "",
});

export function formatNephMedications(value) {
  const rows = Array.isArray(value) ? value.filter((r) => r && String(r.name || "").trim()) : [];
  if (rows.length === 0) return "No medication documented in this section.";
  return rows
    .map((r) => {
      const parts = [
        r.dose ? `Dose ${r.dose}` : "Dose not documented",
        r.route || "route not documented",
        r.frequency || "frequency not documented",
        r.indication ? `for ${r.indication}` : "",
        r.renal_adjustment ? `renal dosing: ${r.renal_adjustment}` : "renal dosing not documented",
        r.renal_adjustment_note ? String(r.renal_adjustment_note).trim() : "",
        r.contraindication_check ? `contraindications: ${r.contraindication_check}` : "contraindications not checked",
        r.interaction_check ? `interactions: ${r.interaction_check}` : "interactions not checked",
        r.monitoring ? `monitoring: ${String(r.monitoring).trim()}` : "monitoring not documented",
        r.response ? `response: ${r.response}` : "response not yet documented",
        r.review_date ? `review ${r.review_date}` : "",
      ].filter(Boolean);
      return `${r.name} — ${parts.join("; ")}`;
    })
    .join("\n");
}