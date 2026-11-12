import { format, isValid, parse } from "date-fns";

// One date presentation across the portal: stored dates are ISO
// ("yyyy-MM-dd") and are shown as DD/MM/YYYY. Anything that is not a stored
// ISO date is returned untouched.
export function formatDateDisplay(value) {
  if (!value) return "";
  const parsed = typeof value === "string" ? parse(value.slice(0, 10), "yyyy-MM-dd", new Date()) : null;
  if (!parsed || !isValid(parsed)) return value;
  return format(parsed, "dd/MM/yyyy");
}