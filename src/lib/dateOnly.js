// Date-only helpers — a stored date is always "YYYY-MM-DD" and is never
// turned into a moment in time, so no timezone can shift it by a day.
// Anything the patient sees is DD/MM/YYYY.

const pad = (n) => String(n).padStart(2, "0");

// Reads "YYYY-MM-DD" (or a full ISO datetime) into year / month / day numbers.
export function isoParts(value) {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(value || "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isRealDate(year, month, day)) return null;
  return { year, month, day };
}

// A genuine calendar date: rejects 32/13, 31/02, 29/02 outside leap years.
export function isRealDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

export const isoFromParts = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

export const displayFromIso = (value) => {
  const parts = isoParts(value);
  return parts ? `${pad(parts.day)}/${pad(parts.month)}/${parts.year}` : "";
};

export const isoToDate = (value) => {
  const parts = isoParts(value);
  return parts ? new Date(parts.year, parts.month - 1, parts.day) : null;
};

export const todayIso = () => {
  const now = new Date();
  return isoFromParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
};