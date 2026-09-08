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

export function medicationStatus(med, today) {
  const day = today || todayStr();
  if (med.is_active !== false && (!med.end_date || med.end_date >= day)) return "active";
  if (med.end_date && med.stopped_date === med.end_date) return "completed";
  return "discontinued";
}