// The emergency reasons the server accepts, kept identical to the shared
// server-side list so the browser and the recorded audit entry always agree.
export const EMERGENCY_REASONS = [
  "Life-threatening emergency",
  "Trauma or major injury",
  "Cardiac or respiratory emergency",
  "Neurological emergency",
  "Severe allergic reaction / anaphylaxis",
  "Altered consciousness or unresponsive patient",
  "Severe bleeding",
  "Obstetric emergency",
  "Paediatric emergency",
  "Other emergency",
];

// The two specialties the server accepts for the patient Emergency QR
// pathway (Pathway A) — kept identical to the server-side list.
export const EMERGENCY_SPECIALTIES = ["emergency medicine", "trauma surgery"];

// True only for a doctor whose verified specialty is Emergency Medicine or
// Trauma Surgery. Every other specialty reaches patients through the hospital
// Emergency Department QR instead. The server re-checks this on every scan.
export function isEmergencySpecialist(profile) {
  const list = [profile?.specialization, ...(Array.isArray(profile?.specialties) ? profile.specialties : [])]
    .filter(Boolean)
    .map((s) => String(s).trim().toLowerCase());
  return list.some((s) => EMERGENCY_SPECIALTIES.includes(s));
}

// Reads which kind of AMedix emergency QR was scanned, purely so the correct
// server action is called. The signature is verified on the server only.
export function scannedQrKind(value) {
  const parts = String(value || "").trim().split(".");
  if (parts.length !== 3 || parts[0] !== "amedix1") return null;
  try {
    const body = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(body + "=".repeat((4 - (body.length % 4)) % 4)));
    if (json && json.k === "h") return "hospital";
    if (json && json.k === "p") return "patient";
    return null;
  } catch (e) {
    return null;
  }
}

export function remainingLabel(iso) {
  const end = new Date(iso || 0).getTime();
  if (!Number.isFinite(end)) return "—";
  const ms = end - Date.now();
  if (ms <= 0) return "Expired";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes > 0 ? `${minutes} min ${String(seconds).padStart(2, "0")} s` : `${seconds} s`;
}

export function dateTimeLabel(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}