import { differenceInYears } from "date-fns";

export function calcAge(dob) {
  if (!dob) return null;
  const age = differenceInYears(new Date(), new Date(dob));
  return Number.isFinite(age) && age >= 0 ? age : null;
}

export function calcAgeLabel(dob) {
  const age = calcAge(dob);
  return age === null ? null : `${age} years`;
}

export function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export const SMOKING_LABELS = {
  never: "Never smoked",
  former: "Former smoker",
  current: "Current smoker",
};

export const ALCOHOL_LABELS = {
  none: "None",
  occasional: "Occasional",
  regular: "Regular",
  former: "Former drinker",
};

export const PREGNANCY_LABELS = {
  not_applicable: "Not applicable",
  not_pregnant: "Not pregnant",
  pregnant: "Pregnant",
};