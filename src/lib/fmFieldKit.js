// Small value helpers shared by the Family Medicine modules. A blank value is
// never read as normal: it stays blank, and every formatter says "not documented".

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

export const ageFromDob = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
};

export const ageMonthsFromDob = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return months >= 0 ? months : null;
};