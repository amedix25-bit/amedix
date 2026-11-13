// Shared vocabulary and helpers for a female patient's Gynaecological &
// Obstetric History. It is recorded once at registration and stored on
// PatientProfile.gynae_obstetric_history, so the Patient Portal and every
// authorized treating doctor read the same history — never a second copy.

export const CYCLE_REGULARITY = [
  { value: "regular", label: "Regular" },
  { value: "irregular", label: "Irregular" },
  { value: "unknown", label: "Unknown" },
];

export const MENSTRUAL_FLOW = [
  { value: "light", label: "Light" },
  { value: "normal", label: "Normal" },
  { value: "heavy", label: "Heavy" },
  { value: "unknown", label: "Unknown" },
];

export const DYSMENORRHOEA = [
  { value: "none", label: "None" },
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
  { value: "unknown", label: "Unknown" },
];

export const YES_NO_UNKNOWN = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
];

export const GYNAE_CONDITIONS = [
  { key: "pelvic_inflammatory_disease", label: "Pelvic inflammatory disease" },
  { key: "sexually_transmitted_infection", label: "Sexually transmitted infection" },
  { key: "endometriosis", label: "Endometriosis" },
  { key: "pcos", label: "Polycystic ovary syndrome (PCOS)" },
  { key: "fibroids", label: "Uterine fibroids" },
  { key: "ovarian_cysts", label: "Ovarian cysts" },
  { key: "cervical_abnormality", label: "Cervical abnormality (e.g. abnormal smear, HPV)" },
  { key: "other", label: "Other gynaecological condition" },
];

export const PREGNANCY_OUTCOMES = [
  { value: "term_delivery", label: "Term delivery (37+ weeks)" },
  { value: "preterm_delivery", label: "Preterm delivery (before 37 weeks)" },
  { value: "miscarriage", label: "Miscarriage" },
  { value: "induced_abortion", label: "Induced abortion" },
  { value: "ectopic_pregnancy", label: "Ectopic pregnancy" },
  { value: "stillbirth", label: "Stillbirth" },
  { value: "unknown", label: "Unknown" },
];

export const DELIVERY_MODES = [
  { value: "vaginal", label: "Vaginal (spontaneous)" },
  { value: "assisted_vaginal", label: "Assisted vaginal (forceps / ventouse)" },
  { value: "caesarean", label: "Caesarean section" },
  { value: "unknown", label: "Unknown" },
];

export const NEONATAL_OUTCOMES = [
  { value: "alive_healthy", label: "Alive and well" },
  { value: "nicu", label: "Admitted to neonatal unit" },
  { value: "stillbirth", label: "Stillbirth" },
  { value: "neonatal_death", label: "Neonatal death" },
  { value: "unknown", label: "Unknown" },
];

export const MENOPAUSE_SYMPTOMS = [
  { key: "hot_flashes", label: "Hot flushes" },
  { key: "night_sweats", label: "Night sweats" },
  { key: "vaginal_dryness", label: "Vaginal dryness" },
  { key: "sleep_disturbance", label: "Sleep disturbance" },
];

export const CURRENT_PREGNANCY_OPTIONS = [
  { value: "pregnant", label: "Pregnant" },
  { value: "not_pregnant", label: "Not pregnant" },
  { value: "unknown", label: "Unknown" },
];

export const MENOPAUSE_STATUS_OPTIONS = [
  { value: "postmenopausal", label: "Postmenopausal" },
  { value: "premenopausal", label: "Premenopausal" },
  { value: "unknown", label: "Unknown" },
];

// A structured, empty history. Everything starts unanswered — an empty field is
// saved as "unknown", never as a negative history.
export const emptyGynaeHistory = () => ({
  menstrual: {
    age_at_menarche: "",
    cycle_regularity: "",
    cycle_length: "",
    bleeding_duration: "",
    flow: "",
    dysmenorrhoea: "",
    abnormal_uterine_bleeding: "",
    lmp: "",
    details: "",
  },
  past: {
    conditions: [],
    condition_details: {},
    infections: "",
    surgeries: "",
    treatments: "",
    investigations: "",
    contraception: "",
    fertility: "",
    other_details: "",
  },
  obstetric: {
    gravida: "",
    para: "",
    abortions: "",
    term_deliveries: "",
    preterm_deliveries: "",
    miscarriages: "",
    induced_abortions: "",
    ectopic_pregnancies: "",
    stillbirths: "",
    living_children: "",
    pregnancies: [],
  },
  current_pregnancy: { status: "", lmp: "", gestational_age: "", edd: "" },
  menopause: {
    status: "",
    age_at_menopause: "",
    year_of_menopause: "",
    last_menstrual_period: "",
    postmenopausal_bleeding: "",
    symptoms: [],
    hrt: "",
    hrt_details: "",
    osteoporosis: "",
    fragility_fracture: "",
    other_details: "",
    surgical_menopause: "",
    surgical_menopause_reason: "",
    surgical_menopause_age: "",
  },
});

// Fill in any subsection a legacy record does not have yet.
export const normalizeGynaeHistory = (record) => {
  const base = emptyGynaeHistory();
  const saved = record && typeof record === "object" ? record : {};
  return {
    menstrual: { ...base.menstrual, ...(saved.menstrual || {}) },
    past: { ...base.past, ...(saved.past || {}) },
    obstetric: { ...base.obstetric, ...(saved.obstetric || {}) },
    current_pregnancy: { ...base.current_pregnancy, ...(saved.current_pregnancy || {}) },
    menopause: { ...base.menopause, ...(saved.menopause || {}) },
    recorded_datetime: saved.recorded_datetime || "",
  };
};

export const labelFor = (options, value) => options.find((o) => o.value === value)?.label || "";

export const conditionLabel = (key) => GYNAE_CONDITIONS.find((c) => c.key === key)?.label || key;

export const isDeliveryOutcome = (outcome) =>
  ["term_delivery", "preterm_delivery", "stillbirth"].includes(outcome);

export const toCount = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// Derived G/P/A text, e.g. "G3 P2 A1".
export const gpaText = (obstetric = {}) => {
  const g = toCount(obstetric.gravida);
  const p = toCount(obstetric.para);
  const a = toCount(obstetric.abortions);
  if (g === null && p === null && a === null) return "";
  return `G${g ?? "?"} P${p ?? "?"} A${a ?? "?"}`;
};

// Parity + abortions can never add up to more pregnancies than the patient
// reported: the same pregnancy is never counted twice.
export const obstetricTotalWarning = (obstetric = {}) => {
  const g = toCount(obstetric.gravida);
  const p = toCount(obstetric.para);
  const a = toCount(obstetric.abortions);
  if (g === null || p === null || a === null) return "";
  return p + a > g ? "Para and abortions together cannot exceed the number of pregnancies." : "";
};

// The legacy flat PatientProfile summaries are kept in sync so every existing
// view (doctor summaries, PDFs, older screens) keeps working unchanged.
export function legacyGynaeFields(gynae, isFemale) {
  const g = normalizeGynaeHistory(gynae);
  if (!isFemale) {
    return {
      pregnancy_status: "not_applicable",
      gestational_age: "",
      estimated_due_date: "",
      gravida: 0,
      para: 0,
      living_children: 0,
      miscarriages_abortions: 0,
      stillbirths: 0,
      pregnancy_history: "",
      pregnancy_complications: "",
      menstrual_history: "",
      gynecological_history: "",
    };
  }
  const m = g.menstrual;
  const p = g.past;
  const o = g.obstetric;
  const pregnant = g.current_pregnancy.status === "pregnant";
  const status =
    g.current_pregnancy.status === "pregnant" || g.current_pregnancy.status === "not_pregnant"
      ? g.current_pregnancy.status
      : "unknown";

  const menstrual = [
    m.age_at_menarche ? `Menarche at ${m.age_at_menarche}` : "",
    labelFor(CYCLE_REGULARITY, m.cycle_regularity),
    m.cycle_length ? `Cycle ${m.cycle_length} days` : "",
    m.bleeding_duration ? `Bleeding ${m.bleeding_duration} days` : "",
    m.flow ? `${labelFor(MENSTRUAL_FLOW, m.flow)} flow` : "",
    m.dysmenorrhoea ? `Dysmenorrhoea: ${labelFor(DYSMENORRHOEA, m.dysmenorrhoea)}` : "",
    m.abnormal_uterine_bleeding === "yes" ? "Abnormal uterine bleeding" : "",
    m.lmp ? `LMP ${m.lmp}` : "",
    m.details,
  ].filter(Boolean).join(" · ");

  const gynaeConditions = (p.conditions || [])
    .map((key) => {
      const detail = p.condition_details?.[key];
      return `${conditionLabel(key)}${detail ? ` (${detail})` : ""}`;
    })
    .join("; ");

  const gynaecological = [
    gynaeConditions,
    p.infections ? `Previous pelvic infections: ${p.infections}` : "",
    p.surgeries ? `Gynaecological operations: ${p.surgeries}` : "",
    p.treatments ? `Treatments: ${p.treatments}` : "",
    p.investigations ? `Investigations: ${p.investigations}` : "",
    p.other_details,
  ].filter(Boolean).join(" · ");

  const pregnancies = (o.pregnancies || [])
    .map((entry, i) => {
      const parts = [
        entry.year || "",
        labelFor(PREGNANCY_OUTCOMES, entry.outcome),
        entry.gestational_age ? `${entry.gestational_age}` : "",
        labelFor(DELIVERY_MODES, entry.mode_of_delivery),
        entry.complications,
        entry.delivery_complications,
        labelFor(NEONATAL_OUTCOMES, entry.neonatal_outcome),
      ].filter(Boolean);
      return `Pregnancy ${i + 1}: ${parts.join(", ")}`;
    })
    .join(" | ");

  const summary = gpaText(o);
  const history = [
    summary,
    toCount(o.living_children) !== null ? `${o.living_children} living children` : "",
    toCount(o.stillbirths) !== null ? `${o.stillbirths} stillbirths` : "",
    pregnancies,
  ].filter(Boolean).join(" · ");

  const complications = (o.pregnancies || [])
    .map((entry) => entry.complications)
    .filter(Boolean)
    .join("; ");

  // A counter the patient did not answer is left out entirely — never written
  // as 0, which would turn an unanswered question into a negative history.
  const counts = {};
  [
    ["gravida", o.gravida],
    ["para", o.para],
    ["living_children", o.living_children],
    ["miscarriages_abortions", o.abortions],
    ["stillbirths", o.stillbirths],
  ].forEach(([field, raw]) => {
    const n = toCount(raw);
    if (n !== null) counts[field] = n;
  });

  return {
    pregnancy_status: status,
    gestational_age: pregnant ? String(g.current_pregnancy.gestational_age || "") : "",
    estimated_due_date: pregnant ? String(g.current_pregnancy.edd || "") : "",
    ...counts,
    pregnancy_history: history,
    pregnancy_complications: complications,
    menstrual_history: menstrual,
    gynecological_history: gynaecological,
  };
}