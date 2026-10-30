// Small value helpers shared by the Neurology modules. A blank value is never
// read as normal: it stays blank, and every formatter says "not documented".

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

export const YES_NO = ["Yes", "No", "Not documented"];
export const LATERALITY = ["Right", "Left", "Bilateral", "Not applicable", "Not documented"];