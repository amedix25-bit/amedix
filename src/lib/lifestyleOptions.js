// Shared option lists for the patient-owned lifestyle, nutrition, sleep,
// living-situation and vaccination sections. The English label is the
// translation key, so every option renders in Arabic and English wherever
// these lists are used (registration, profile and My Health).

export const DIET_TYPES = [
  { value: "balanced", label: "Regular / Balanced diet" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "mediterranean", label: "Mediterranean diet" },
  { value: "low_carb", label: "Low-carbohydrate diet" },
  { value: "high_protein", label: "High-protein diet" },
  { value: "low_salt", label: "Low-salt diet" },
  { value: "diabetic", label: "Diabetic diet" },
  { value: "renal", label: "Renal diet" },
  { value: "gluten_free", label: "Gluten-free diet" },
  { value: "lactose_free", label: "Lactose-free diet" },
  { value: "other", label: "Other" },
];

export const SLEEP_PATTERNS = [
  { value: "sleeps_through_night", label: "Sleeps through the night" },
  { value: "frequent_waking", label: "Frequently wakes up during the night" },
  { value: "difficulty_falling_asleep", label: "Takes a long time to fall asleep" },
  { value: "early_waking", label: "Wakes up too early" },
  { value: "restless_sleep", label: "Experiences interrupted or restless sleep" },
  { value: "excessive_sleep", label: "Sleeps excessively" },
  { value: "other", label: "Other" },
];

export const LIVING_SITUATIONS = [
  { value: "alone", label: "Lives alone" },
  { value: "immediate_family", label: "Lives with immediate family" },
  { value: "extended_family", label: "Lives with extended family" },
  { value: "caregiver", label: "Lives with a caregiver" },
  { value: "assisted_living", label: "Lives in assisted living / residential care" },
  { value: "other", label: "Other" },
];

export const VACCINATION_STATUSES = [
  { value: "fully_vaccinated", label: "Fully vaccinated according to age" },
  { value: "partially_vaccinated", label: "Partially vaccinated" },
  { value: "not_vaccinated", label: "Not vaccinated" },
  { value: "unknown", label: "Vaccination history unknown" },
];

export const VACCINES = [
  { value: "hepatitis_b", label: "Hepatitis B" },
  { value: "hepatitis_a", label: "Hepatitis A" },
  { value: "bcg", label: "BCG" },
  { value: "polio", label: "Polio" },
  { value: "dtp", label: "DTP / DTaP" },
  { value: "hib", label: "Hib" },
  { value: "pneumococcal", label: "Pneumococcal" },
  { value: "mmr", label: "MMR" },
  { value: "varicella", label: "Varicella" },
  { value: "hpv", label: "HPV" },
  { value: "meningococcal", label: "Meningococcal" },
  { value: "influenza", label: "Influenza" },
  { value: "covid19", label: "COVID-19" },
  { value: "other", label: "Other" },
];

// An unanswered vaccine is never stored as "not received": only answers the
// patient actually gave ("received" / "not_received" / "unknown") are kept.
export const VACCINE_RECEIVED = [
  { value: "received", label: "Received" },
  { value: "not_received", label: "Not received" },
  { value: "unknown", label: "Unknown" },
];

export const optionLabel = (list, value, t) => {
  const item = list.find((o) => o.value === value);
  if (!item) return value || "";
  return t ? t(item.label) : item.label;
};

export const optionsLabel = (list, values, t) =>
  (values || []).map((v) => optionLabel(list, v, t)).filter(Boolean).join(", ");

// Profile stores the vaccine answers as an array of records; the forms edit
// them as a map keyed by vaccine so a vaccine is never duplicated.
export const vaccinationRecordsToMap = (records = []) =>
  (records || []).reduce((acc, r) => (r?.vaccine ? { ...acc, [r.vaccine]: r } : acc), {});

const RECEIVED_VALUES = VACCINE_RECEIVED.map((o) => o.value);

export const vaccinationMapToRecords = (map = {}) =>
  Object.entries(map || {})
    .filter(([, r]) => r && RECEIVED_VALUES.includes(r.received))
    .map(([vaccine, r]) => ({
      vaccine,
      received: r.received,
      ...(r.other_label ? { other_label: r.other_label } : {}),
      ...(r.date ? { date: r.date } : {}),
      ...(r.doses ? { doses: r.doses } : {}),
      ...(r.notes ? { notes: r.notes } : {}),
    }));