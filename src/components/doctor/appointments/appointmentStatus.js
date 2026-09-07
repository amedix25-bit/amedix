export function getAppointmentStatus(apt) {
  if (apt.status === "completed") return "Completed";
  if (apt.patient_response === "declined") return "Declined by Patient";
  if (apt.status === "cancelled") return "Cancelled";
  if (apt.patient_response === "accepted") return "Confirmed";
  return "Pending";
}

export const STATUS_BADGE = {
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  Confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Declined by Patient": "bg-red-50 text-red-700 border border-red-200",
  Cancelled: "bg-red-50 text-red-700 border border-red-200",
  Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export function isDeclined(apt) {
  return apt.patient_response === "declined";
}

export function sortByDateTime(list) {
  return [...list].sort(
    (a, b) =>
      (a.date || "").localeCompare(b.date || "") ||
      (a.time || "").localeCompare(b.time || "") ||
      (a.patient_name || "").localeCompare(b.patient_name || "")
  );
}

export function formatLongDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString()} — ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}