// Shared field builders for the Pulmonology / Respiratory Medicine modules.
//
// The builders, the "not documented" vocabulary and the text helpers are the
// same ones every AMedix specialty module uses, so a respiratory note reads and
// prints exactly like the rest of the record. Nothing here is preselected: a
// blank field is read as NOT DOCUMENTED, never as normal and never as absent.
import { NOT_DOCUMENTED } from "@/lib/allergyFieldKit";

export {
  T,
  I,
  N,
  S,
  M,
  WHEN,
  WHEN_IN,
  NOT_ASSESSED,
  NOT_DOCUMENTED,
  NOT_APPLICABLE,
  UNKNOWN,
  YES_NO_DOC,
  YES_NO_NA,
  str,
  list,
  asObject,
  hasAny,
} from "@/lib/allergyFieldKit";

export const PRESENT = "Present";
export const ABSENT = "Absent";
export const NOT_MEASURED = "Not measured";
export const NOT_PERFORMED = "Not performed";

// Oxygen support in ascending order of intensity — the vocabulary the
// respiratory guidelines use when they describe escalation.
export const OXYGEN_SUPPORT = [
  "None — room air",
  "Nasal cannula",
  "Simple face mask",
  "Venturi mask",
  "Reservoir (non-rebreathe) mask",
  "High-flow nasal oxygen",
  "NIV — CPAP",
  "NIV — BiPAP",
  "Invasive ventilation",
  NOT_DOCUMENTED,
];

export const SMOKING_STATUS = [
  "Never smoked",
  "Current smoker",
  "Ex-smoker",
  "Current e-cigarette / vape use",
  "Passive exposure only",
  NOT_DOCUMENTED,
];

export const SEVERITY_DOC = ["Mild", "Moderate", "Severe", "Life-threatening", NOT_DOCUMENTED];

export const EXACERBATION_FREQUENCY = [
  "None documented in the last 12 months",
  "1 moderate exacerbation",
  "2 or more moderate exacerbations",
  "At least one exacerbation needing hospital attendance",
  "At least one exacerbation needing admission",
  "At least one exacerbation needing ventilatory support",
  NOT_DOCUMENTED,
];

// Documented status of a test that was performed elsewhere. The note records the
// status and the interpretation the clinician documented — it never becomes a
// second laboratory or imaging result surface.
export const REPORT_STATUS = [
  "Reported and reviewed",
  "Reported — awaiting review",
  "Ordered — not yet reported",
  "Not performed",
  NOT_DOCUMENTED,
];