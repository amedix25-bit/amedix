// Pediatrics — the arithmetic the notes are allowed to do.
//
// Everything here is a calculation, never a threshold: the app adds up an age,
// subtracts weeks of prematurity, divides a weight by a squared height and multiplies
// a mg/kg dose by a weight. It never decides whether a value is normal. A blank input
// returns null and the note says "not calculated" — a missing date of birth is never
// turned into an assumed age, and a missing weight is never turned into a dose.
//
// The one convention used is the corrected-age window below. It is a convention, not
// a threshold, and the block states the convention it applied so a reviewer can see
// which rule produced the value.

export const CORRECTION_UNTIL_MONTHS = 24;
export const CORRECTION_CONVENTION =
  "Prematurity is corrected until 24 months of age by subtracting the weeks born before 40 completed weeks (AAP convention; the institution may state a different window).";

export const toDate = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const iso = raw.length <= 10 ? `${raw}T00:00:00Z` : raw;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const daysBetween = (from, to) => {
  const a = toDate(from);
  const b = toDate(to);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

const completedMonths = (from, to) => {
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  return months;
};

// Age at the assessment date, in the units a paediatric note actually uses.
export const ageBreakdown = (dobValue, onValue) => {
  const dob = toDate(dobValue);
  const on = toDate(onValue);
  const days = daysBetween(dobValue, onValue);
  if (!dob || !on || days === null || days < 0) return null;
  const months = Math.max(0, completedMonths(dob, on));
  return {
    days,
    weeks: Math.floor(days / 7),
    months,
    years: Math.floor(months / 12),
    text: `${days} day(s) · ${Math.floor(days / 7)} week(s) · ${months} month(s) · ${Math.floor(months / 12)} year(s)`,
  };
};

// Corrected age for a child born before 37 completed weeks.
export const correctedAge = (dobValue, gaWeeksValue, onValue, gaDaysValue = 0) => {
  const age = ageBreakdown(dobValue, onValue);
  const weeks = Number(gaWeeksValue);
  const extraDays = Number(gaDaysValue) || 0;
  if (!age || !Number.isFinite(weeks) || weeks <= 0) return null;
  if (weeks >= 37) return { applicable: false, text: "Not applicable — born at 37 weeks or later." };
  if (age.months >= CORRECTION_UNTIL_MONTHS) {
    return {
      applicable: false,
      text: `Not applied — the child is ${age.months} months old, beyond the ${CORRECTION_UNTIL_MONTHS}-month correction window.`,
    };
  }
  const weeksEarly = 40 - (weeks + extraDays / 7);
  const correctedDays = age.days - Math.round(weeksEarly * 7);
  const safeDays = Math.max(0, correctedDays);
  return {
    applicable: true,
    weeksEarly: Math.round(weeksEarly * 10) / 10,
    correctedDays: safeDays,
    correctedWeeks: Math.floor(safeDays / 7),
    correctedMonths: Math.floor(safeDays / 30.4375),
    text: `${safeDays} day(s) · ${Math.floor(safeDays / 7)} week(s) · ${Math.floor(safeDays / 30.4375)} month(s) corrected (${Math.round(weeksEarly * 10) / 10} week(s) early)`,
  };
};

// BMI, arithmetic only. The app does not state a BMI percentile or a weight status.
export const bmiValue = (weightKgValue, heightCmValue) => {
  const weight = Number(weightKgValue);
  const heightCm = Number(heightCmValue);
  if (!Number.isFinite(weight) || !Number.isFinite(heightCm) || weight <= 0 || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weight / (m * m)) * 10) / 10;
};

// Inpatient weight change from the admission weight, as a percentage.
export const weightChangePercent = (baselineKgValue, currentKgValue) => {
  const baseline = Number(baselineKgValue);
  const current = Number(currentKgValue);
  if (!Number.isFinite(baseline) || !Number.isFinite(current) || baseline <= 0) return null;
  return Math.round(((current - baseline) / baseline) * 1000) / 10;
};

// A weight-based dose, with the stated maximum applied and shown.
export const weightBasedDose = ({ weightKg, perKg, maxDose } = {}) => {
  const weight = Number(weightKg);
  const dose = Number(perKg);
  const max = Number(maxDose);
  if (!Number.isFinite(weight) || !Number.isFinite(dose) || weight <= 0 || dose <= 0) return null;
  const calculated = Math.round(weight * dose * 100) / 100;
  const hasMax = Number.isFinite(max) && max > 0;
  const capped = hasMax && calculated > max;
  return {
    calculated,
    hasMax,
    max: hasMax ? max : null,
    capped,
    given: capped ? max : calculated,
    text: `${calculated} mg per dose calculated (${weight} kg × ${dose} mg/kg)${hasMax ? `, maximum ${max} mg${capped ? " — ceiling applied" : " — ceiling not reached"}` : ", no maximum entered"}`,
  };
};

export const formatNumber = (value, unit = "") => {
  if (value === null || value === undefined || value === "") return "";
  return `${value}${unit ? ` ${unit}` : ""}`;
};