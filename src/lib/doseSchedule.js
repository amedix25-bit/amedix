// Client-side helper mirroring the server's dose schedule derivation
// (base44/shared/medicationSafety.ts) — used to pre-fill reminder times from
// the prescribed frequency when the patient turns reminders on.
export function doseTimesFromFrequency(frequency, prn) {
  if (prn) return [];
  const text = String(frequency || "").toLowerCase();
  let perDay = 0;
  const everyMatch = text.match(/every\s+(\d+)\s*(?:hour|hr)/);
  if (everyMatch) {
    const hours = parseInt(everyMatch[1], 10);
    if (hours > 0 && hours <= 24) perDay = Math.floor(24 / hours);
  }
  if (!perDay) {
    if (/\bonce\b|\b1\s*(time|x)\b|(^|\s)daily(\s|$)/.test(text)) perDay = 1;
    else if (/\btwice\b|\b2\s*(time|x)\b/.test(text)) perDay = 2;
    else if (/\bthree\b|\b3\s*(time|x)\b/.test(text)) perDay = 3;
    else if (/\bfour\b|\b4\s*(time|x)\b/.test(text)) perDay = 4;
  }
  if (!perDay) {
    const num = parseInt(String(text).replace(/[^0-9]/g, " ").trim().split(/\s+/)[0] || "", 10);
    if (Number.isFinite(num) && num >= 1 && num <= 6) perDay = num;
  }
  if (!perDay) perDay = 1;
  const defaults = { 1: ["08:00"], 2: ["08:00", "20:00"], 3: ["08:00", "14:00", "20:00"], 4: ["08:00", "12:00", "16:00", "20:00"] };
  if (defaults[perDay]) return defaults[perDay];
  const times = [];
  const step = Math.max(1, Math.floor(14 / perDay));
  for (let i = 0; i < perDay; i++) times.push(`${String(Math.min(8 + i * step, 23)).padStart(2, "0")}:00`);
  return times;
}