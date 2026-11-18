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

// Contraception she is currently using — asked once, in its own section. An
// unanswered question is left empty, never written as "None".
export const CONTRACEPTION_METHODS = [
  { value: "none", label: "None" },
  { value: "oral", label: "Oral contraception" },
  { value: "injectable", label: "Injectable contraception" },
  { value: "iud", label: "Intrauterine device (IUD)" },
  { value: "implant", label: "Implant" },
  { value: "patch", label: "Contraceptive patch" },
  { value: "vaginal_ring", label: "Vaginal ring" },
  { value: "barrier", label: "Condoms / Barrier methods" },
  { value: "natural", label: "Natural / Fertility awareness methods" },
  { value: "permanent", label: "Permanent contraception" },
  { value: "other", label: "Other" },
];

// The second question, asked only when she selected Oral contraception.
export const ORAL_CONTRACEPTION_TYPES = [
  { value: "combined", label: "Combined oral contraceptive pill (COC – Estrogen + Progestin)" },
  { value: "progestin_only", label: "Progestin-only pill (POP / Mini-pill)" },
  { value: "emergency", label: "Emergency contraceptive pill" },
  { value: "other", label: "Other / Not sure" },
];

// Readable contraception answer for the profile and for treating doctors.
export const contraceptionSummary = (past = {}) => {
  const method = labelFor(CONTRACEPTION_METHODS, past.contraception_method);
  if (!method) return "";
  if (past.contraception_method !== "oral") return method;
  const oral = labelFor(ORAL_CONTRACEPTION_TYPES, past.contraception_oral_type);
  const detail = past.contraception_oral_type === "other" ? (past.contraception_oral_other || "").trim() : "";
  return [method, oral, detail].filter(Boolean).join(" · ");
};

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
    contraception_method: "",
    contraception_oral_type: "",
    contraception_oral_other: "",
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

// The five parts of the one history, and the label of each.
export const GYNAE_SECTION_KEYS = ["menstrual", "past", "obstetric", "current_pregnancy", "menopause"];

export const GYNAE_SECTION_LABELS = {
  menstrual: "Menstrual History",
  past: "Gynaecological History",
  obstetric: "Past Obstetric History",
  current_pregnancy: "Current Pregnancy",
  menopause: "Menopause",
};

// How many past saves are kept in the update history.
export const GYNAE_REVISION_LIMIT = 10;

// Fill in any subsection a legacy record does not have yet, and keep the
// saving metadata (who recorded it, when it was last updated, its revisions).
export const normalizeGynaeHistory = (record) => {
  const base = emptyGynaeHistory();
  const saved = record && typeof record === "object" ? record : {};
  return {
    menstrual: { ...base.menstrual, ...(saved.menstrual || {}) },
    past: { ...base.past, ...(saved.past || {}) },
    obstetric: { ...base.obstetric, ...(saved.obstetric || {}) },
    current_pregnancy: { ...base.current_pregnancy, ...(saved.current_pregnancy || {}) },
    menopause: { ...base.menopause, ...(saved.menopause || {}) },
    status: saved.status || "",
    recorded_datetime: saved.recorded_datetime || "",
    recorded_by: saved.recorded_by || "",
    updated_datetime: saved.updated_datetime || "",
    updated_by: saved.updated_by || "",
    section_updated: saved.section_updated && typeof saved.section_updated === "object" ? saved.section_updated : {},
    revisions: Array.isArray(saved.revisions) ? saved.revisions : [],
  };
};

// Whether one part carries any answer at all — a blank answer is never a
// negative history, so a blank part is simply "not recorded".
export const sectionHasAnswers = (key, value) => {
  const empty = emptyGynaeHistory()[key];
  if (!empty) return false;
  return JSON.stringify({ ...empty, ...(value || {}) }) !== JSON.stringify(empty);
};

export const hasAnyGynaeAnswer = (record) => {
  const g = normalizeGynaeHistory(record);
  return GYNAE_SECTION_KEYS.some((key) => sectionHasAnswers(key, g[key]));
};

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Builds the ONE saved history from what the patient submitted. It can run at
// registration and any number of times afterwards: every previous answer is
// kept, a pregnancy keeps its own entry_id so it is updated in place instead
// of being added again, and each save appends one revision to the update
// history. `finalStatus` is "in_progress" for a part-finished save.
export function buildGynaeSave(previous, next, actor = {}, options = {}) {
  const finalStatus = options.finalStatus || "completed";
  const prev = normalizeGynaeHistory(previous);
  const incoming = normalizeGynaeHistory(next);
  const now = new Date().toISOString();

  const pregnancies = [];
  const seen = new Set();
  (incoming.obstetric.pregnancies || []).forEach((raw) => {
    if (!raw) return;
    const entry = { ...raw, entry_id: raw.entry_id || newId("pg") };
    if (seen.has(entry.entry_id)) return;
    seen.add(entry.entry_id);
    pregnancies.push(entry);
  });

  const conditions = [];
  (incoming.past.conditions || []).forEach((key) => {
    if (key && !conditions.includes(key)) conditions.push(key);
  });

  // Gravida and the abortion total are derived from the answers at every save —
  // never typed by the patient. Gravida is stored only while she is pregnant;
  // otherwise it is left empty so it can never be displayed out of context.
  const obstetricAnswers = { ...incoming.obstetric, pregnancies };
  const gravida = calculatedGravida(obstetricAnswers, incoming.current_pregnancy.status);
  const abortions = abortionCount(obstetricAnswers);

  const sections = {
    menstrual: { ...incoming.menstrual },
    // The oral-contraception answers exist only while Oral contraception is the
    // method she chose — switching method clears them instead of leaving a
    // stale answer behind.
    past: {
      ...incoming.past,
      conditions,
      contraception_oral_type:
        incoming.past.contraception_method === "oral" ? incoming.past.contraception_oral_type : "",
      contraception_oral_other:
        incoming.past.contraception_method === "oral" && incoming.past.contraception_oral_type === "other"
          ? incoming.past.contraception_oral_other
          : "",
    },
    obstetric: {
      ...obstetricAnswers,
      gravida: gravida === null ? "" : String(gravida),
      abortions: abortions === null ? "" : String(abortions),
    },
    current_pregnancy: { ...incoming.current_pregnancy },
    menopause: { ...incoming.menopause },
  };

  const changed = GYNAE_SECTION_KEYS.filter(
    (key) => JSON.stringify(prev[key]) !== JSON.stringify(sections[key])
  );

  const section_updated = { ...prev.section_updated };
  changed.forEach((key) => {
    section_updated[key] = now;
  });

  const revision = {
    revision_id: newId("rev"),
    datetime: now,
    actor_name: actor.name || "",
    actor_role: actor.role || "patient",
    status: finalStatus,
    sections_changed: changed,
    snapshot: sections,
  };

  return {
    ...sections,
    status: finalStatus,
    recorded_datetime: prev.recorded_datetime || now,
    recorded_by: prev.recorded_by || actor.name || "",
    updated_datetime: now,
    updated_by: actor.name || prev.updated_by || "",
    section_updated,
    revisions: [...(prev.revisions || []), revision].slice(-GYNAE_REVISION_LIMIT),
  };
}

export const labelFor = (options, value) => options.find((o) => o.value === value)?.label || "";

export const conditionLabel = (key) => GYNAE_CONDITIONS.find((c) => c.key === key)?.label || key;

export const isDeliveryOutcome = (outcome) =>
  ["term_delivery", "preterm_delivery", "stillbirth"].includes(outcome);

export const toCount = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// The number of PREVIOUS pregnancies implied by the answers. Every previous
// pregnancy ended once: as a birth from 24 weeks (Para — a stillbirth is one of
// those and is recorded separately, so it is never added a second time), a
// miscarriage, an induced abortion or an ectopic pregnancy. Living children are
// never added: children are not pregnancies, and one pregnancy can produce more
// than one child. `null` means nothing about previous pregnancies is answered yet.
export const previousPregnancyCount = (obstetric = {}) => {
  const para = toCount(obstetric.para);
  const stillbirths = toCount(obstetric.stillbirths);
  const miscarriages = toCount(obstetric.miscarriages);
  const induced = toCount(obstetric.induced_abortions);
  const ectopic = toCount(obstetric.ectopic_pregnancies);
  const entries = Array.isArray(obstetric.pregnancies) ? obstetric.pregnancies.length : 0;
  const answered =
    entries > 0 || [para, stillbirths, miscarriages, induced, ectopic].some((v) => v !== null);
  if (!answered) return null;
  const births = para === null ? stillbirths ?? 0 : para;
  return Math.max(entries, births + (miscarriages ?? 0) + (induced ?? 0) + (ectopic ?? 0));
};

// Gravida is always CALCULATED, never asked of the patient: the total number of
// pregnancies, including the current one. It exists only while the patient is
// currently pregnant — a patient who is not pregnant, and any postmenopausal
// patient, is never shown a Gravida value.
export const calculatedGravida = (obstetric = {}, currentPregnancyStatus = "") => {
  if (currentPregnancyStatus !== "pregnant") return null;
  const previous = previousPregnancyCount(obstetric);
  return (previous ?? 0) + 1;
};

// The losses before 24 weeks, added up here so the patient is never asked to
// total them herself. Keeps a legacy entry when nothing newer was answered.
export const abortionCount = (obstetric = {}) => {
  const parts = [obstetric.miscarriages, obstetric.induced_abortions, obstetric.ectopic_pregnancies].map(
    toCount
  );
  if (parts.every((v) => v === null)) return toCount(obstetric.abortions);
  return parts.reduce((total, v) => total + (v ?? 0), 0);
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

  const contraception = contraceptionSummary(p) || p.contraception || "";

  const gynaecological = [
    gynaeConditions,
    p.infections ? `Previous pelvic infections: ${p.infections}` : "",
    p.surgeries ? `Gynaecological operations: ${p.surgeries}` : "",
    p.treatments ? `Treatments: ${p.treatments}` : "",
    p.investigations ? `Investigations: ${p.investigations}` : "",
    contraception ? `Contraception: ${contraception}` : "",
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

  // Gravida is the calculated value only, and it exists only while she is
  // pregnant — it is never shown for a non-pregnant or postmenopausal patient.
  const gravida = calculatedGravida(o, g.current_pregnancy.status);
  const para = toCount(o.para);
  const history = [
    gravida !== null ? `G${gravida} P${para ?? "?"}` : para !== null ? `P${para}` : "",
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
    ["gravida", gravida],
    ["para", o.para],
    ["living_children", o.living_children],
    ["miscarriages_abortions", abortionCount(o)],
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