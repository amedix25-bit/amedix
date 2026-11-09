// Small value helpers shared by the Urology modules.
//
// One rule runs through every helper: a blank value is NEVER read as normal. It
// stays blank and every formatter says "not documented", so an examination that
// was not performed or not recorded is never mistaken for a normal one.

export const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

export const str = (v) => {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join("; ");
  return String(v).trim();
};

export const list = (v) => (Array.isArray(v) ? v.filter(Boolean) : str(v) ? [str(v)] : []);

export const isBlank = (v) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && !v.length);

export const num = (v) => {
  if (isBlank(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const round = (n, dp = 1) => (n === null || n === undefined ? null : Number(n.toFixed(dp)));

// Examination state. "Not performed" and "Not applicable" are first-class
// answers: an examination element that was not done can never be recorded, or
// read back, as normal.
export const EXAM_STATES = ["Normal", "Abnormal", "Not performed", "Not applicable", "Not documented"];

export const YES_NO_ND = ["Yes", "No", "Not documented"];

export const LATERALITY = ["Right", "Left", "Bilateral", "Midline", "Not applicable", "Not documented"];

export const URGENCY = ["Routine", "Urgent", "Emergency"];

export const NOT_DOCUMENTED = "not documented";

// Free text from every documented field, used by the safety rules to find the
// finding a clinician recorded rather than the value of a single named input.
export const allText = (values) => {
  const bag = [];
  const walk = (v) => {
    if (v === null || v === undefined) return;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      bag.push(String(v));
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    if (typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(values);
  return bag.join(" \u00b7 ").toLowerCase();
};

// The first documented numeric value held under any of the given keys, wherever
// it sits in the note's value tree.
export const anyNumber = (values, keys) => {
  const wanted = new Set(keys);
  let found = null;
  const walk = (v) => {
    if (found !== null || !v || typeof v !== "object") return;
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    for (const [k, val] of Object.entries(v)) {
      if (wanted.has(k)) {
        const n = num(val);
        if (n !== null) {
          found = n;
          return;
        }
      }
      if (val && typeof val === "object") walk(val);
    }
  };
  walk(values);
  return found;
};

export const anyText = (values, keys) => {
  const wanted = new Set(keys);
  let found = "";
  const walk = (v) => {
    if (found || !v || typeof v !== "object") return;
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    for (const [k, val] of Object.entries(v)) {
      if (wanted.has(k)) {
        const s = str(val);
        if (s) {
          found = s;
          return;
        }
      }
      if (val && typeof val === "object") walk(val);
    }
  };
  walk(values);
  return found;
};