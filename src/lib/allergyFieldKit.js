// Shared field builders for the Allergy & Immunology documentation modules.
//
// Every option set below is the vocabulary the cited guideline actually uses.
// Nothing is preselected, and an unanswered question stays unanswered: a blank
// field is read as NOT DOCUMENTED, never as normal and never as absent.

export const NOT_ASSESSED = "Not assessed";
export const NOT_DOCUMENTED = "Not documented";
export const NOT_APPLICABLE = "Not applicable";
export const UNKNOWN = "Unknown — not documented";

export const YES_NO_DOC = ["Yes", "No", NOT_DOCUMENTED];
export const YES_NO_NA = ["Yes", "No", NOT_APPLICABLE, NOT_DOCUMENTED];

export const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
export const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
export const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
export const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
export const M = (key, label, options, extra) => ({ key, label, type: "multi", options, ...extra });

export const WHEN = (key, value) => ({ showIf: { key, equals: value } });
export const WHEN_IN = (key, values) => ({ showIf: { key, in: values } });

// Text helpers shared by the safety rules and the printed record.
export const str = (v) => String(v ?? "").trim();
export const list = (v) => (Array.isArray(v) ? v.filter((x) => str(x)) : str(v) ? [str(v)] : []);
export const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
export const hasAny = (value, options) => list(value).some((v) => options.includes(v));