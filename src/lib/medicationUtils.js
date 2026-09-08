export const MED_ROUTES = ["oral", "intravenous", "intramuscular", "subcutaneous", "topical", "inhalation", "rectal", "other"];

export const MEAL_OPTIONS = [
  { value: "before_meal", label: "Before meals" },
  { value: "after_meal", label: "After meals" },
  { value: "with_meal", label: "With meals" },
  { value: "anytime", label: "Anytime" },
  { value: "unknown", label: "Not specified" },
];

export function mealLabel(value) {
  const opt = MEAL_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : "";
}

export function routeLabel(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function computeEndDate(startDate, durationDays) {
  const days = parseInt(durationDays, 10);
  if (!startDate || !durationDays || isNaN(days) || days <= 0) return "";
  return new Date(new Date(startDate).getTime() + days * 86400000).toISOString().slice(0, 10);
}

export const ROUTE_OPTIONS = [
  { value: "oral", label: "Oral" },
  { value: "intravenous", label: "IV" },
  { value: "intramuscular", label: "IM" },
  { value: "subcutaneous", label: "SC" },
  { value: "topical", label: "Topical" },
  { value: "inhalation", label: "Inhaled" },
  { value: "other", label: "Other" },
];

export function medicationRecordFromForm(m, { patient, fallbackReason }) {
  const days = parseInt(m.duration, 10);
  const start = m.start_date || todayStr();
  const rec = {
    patient_id: patient.id,
    patient_cin: patient.cin,
    patient_name: patient.full_name,
    name: (m.name || "").trim(),
    dose: (m.dose || "").trim(),
    route: m.route,
    frequency: m.prn ? "" : (m.frequency || "").trim(),
    meal_timing: m.meal,
    duration: m.duration ? `${m.duration} days` : "",
    prn: !!m.prn,
    max_frequency: m.prn ? (m.max_frequency || "").trim() : "",
    doctor_notes: (m.notes || "").trim(),
    special_instructions: (m.special_instructions || "").trim(),
    start_date: start,
    reason: (m.reason || "").trim() || (fallbackReason || ""),
    source: "doctor_prescribed",
  };
  if (m.duration && !isNaN(days) && days > 0) {
    rec.end_date = computeEndDate(start, m.duration);
  }
  if (m.status === "completed") {
    rec.is_active = false;
    rec.stopped_date = rec.end_date || start;
  } else if (m.status === "discontinued") {
    rec.is_active = false;
    rec.stopped_date = start;
  } else {
    rec.is_active = true;
  }
  return rec;
}

export function medicationStatus(med, today) {
  const day = today || todayStr();
  if (med.is_active !== false && (!med.end_date || med.end_date >= day)) return "active";
  if (med.end_date && med.stopped_date === med.end_date) return "completed";
  return "discontinued";
}