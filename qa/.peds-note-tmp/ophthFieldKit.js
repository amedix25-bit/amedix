// Shared field helpers for the ophthalmology block definitions.
//
// One vocabulary for every block: the same field shapes, the same "not
// documented" / "not assessed" wording, and the same conditional-rendering
// contract the note form already understands (`showIf`). Blocks import these so
// no two blocks word the same answer differently.

export const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
export const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
export const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
export const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
export const M = (key, label, options, extra) => ({ key, label, type: "multi", options, ...extra });

export const WHEN = (key, value) => ({ showIf: { key, equals: value } });
export const WHEN_IN = (key, values) => ({ showIf: { key, in: values } });

export const NOT_DOCUMENTED = "Not documented";
export const NOT_ASSESSED = "Not assessed";
export const NOT_APPLICABLE = "Not applicable";
export const NONE_DOCUMENTED = "None documented";
// Four different facts, never interchangeable: a test not done, a record not
// accessible, a result still awaited, and a recorded negative finding.
export const NOT_PERFORMED = "Not performed";
export const NOT_AVAILABLE = "Unavailable — record not accessible";
export const PENDING = "Pending — result awaited";
export const NORMAL = "Normal";

// Vision-loss grades used wherever an acuity is entered as a grade rather than
// a Snellen line, in the order ophthalmology reads them.
export const VA_GRADES = [
  "6/6 or better",
  "6/9",
  "6/12",
  "6/18",
  "6/24",
  "6/36",
  "6/60",
  "Counting fingers",
  "Hand movements",
  "Light perception",
  "No light perception",
  NOT_ASSESSED,
];

export const EYE = (key = "eye", label = "Eye") =>
  S(key, label, ["Right", "Left", "Bilateral", NOT_DOCUMENTED]);

// ---- Value helpers -------------------------------------------------------
export const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
export const str = (v) => String(v ?? "").trim();
export const list = (v) => (Array.isArray(v) ? v.filter((x) => str(x)) : str(v) ? [str(v)] : []);

// A block counts as documented only when a real answer was entered; the block's
// own tag (`__m`) on an otherwise empty block means nothing was.
export const blockHasContent = (block) =>
  Object.keys(asObject(block)).some(
    (k) =>
      k !== "__m" &&
      (Array.isArray(block[k]) ? block[k].filter((x) => str(x)).length > 0 : str(block[k]) !== "")
  );

// A value that recorded the absence of an observation is not a finding: it must
// never be read by a prompt or a calculation as though something was seen.
export const isBlank = (v) =>
  str(v) === "" ||
  /^(not documented|not assessed|not performed|not applicable|not tested|unavailable|pending)/i.test(str(v));