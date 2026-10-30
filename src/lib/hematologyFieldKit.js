// Shared field vocabulary for the Haematology documentation blocks.
//
// Every block is built from these helpers so the same clinical fact is worded
// the same way everywhere in the specialty. Two rules matter clinically:
//
//  1. Four different facts are never interchangeable — a finding that is not
//     present ("Absent"), one that was never looked for ("Not examined"), one
//     that does not apply to this patient ("Not applicable"), and a result that
//     was never recorded ("Not documented"). Nothing blank is ever read as
//     normal, and nothing is pre-selected.
//  2. A block records only what the clinician enters. No block supplies a
//     diagnosis, a severity grade or a treatment decision.

export const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
export const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
export const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
export const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
export const M = (key, label, options, extra) => ({ key, label, type: "multi", options, ...extra });

export const WHEN = (key, value) => ({ showIf: { key, equals: value } });
export const WHEN_IN = (key, values) => ({ showIf: { key, in: values } });

export const NOT_DOCUMENTED = "Not documented";
export const NOT_EXAMINED = "Not examined";
export const NOT_APPLICABLE = "Not applicable";
export const NOT_PERFORMED = "Not performed";
export const PENDING = "Pending — result awaited";
export const UNAVAILABLE = "Unavailable — record not accessible";
export const NONE = "None";
export const UNKNOWN = "Unknown";

// Structured physical-finding states. "Present" documents an abnormality the
// clinician found; "Absent" documents that it was looked for and not found.
export const FINDING_STATES = ["Present", "Absent", NOT_EXAMINED, NOT_APPLICABLE];

// The same three answers for a documented yes/no with an unknown option.
export const YES_NO_STATES = ["Yes", "No", UNKNOWN, NOT_APPLICABLE];

// Functional capacity, as the validated scale is written.
export const ECOG = [
  "0 — Fully active",
  "1 — Restricted in strenuous activity, ambulatory",
  "2 — Ambulatory, up and about >50% of waking hours, unable to work",
  "3 — Limited self-care, confined to bed/chair >50% of waking hours",
  "4 — Completely disabled, no self-care",
  NOT_DOCUMENTED,
];

export const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
export const str = (v) => String(v ?? "").trim();
export const list = (v) => (Array.isArray(v) ? v.filter((x) => str(x)) : str(v) ? [str(v)] : []);

// A block counts as documented only when a real answer was entered; the block's
// own tag on an otherwise empty block means nothing was.
export const blockHasContent = (block) =>
  Object.keys(asObject(block)).some(
    (k) =>
      k !== "__m" &&
      (Array.isArray(block[k]) ? block[k].filter((x) => str(x)).length > 0 : str(block[k]) !== "")
  );

// A value that records the absence of an observation is not a finding.
export const isBlank = (v) =>
  str(v) === "" ||
  /^(not documented|not examined|not performed|not applicable|not assessed|unavailable|pending|unknown|none)$/i.test(
    str(v)
  );