// Pulmonology / Respiratory Medicine — documented clinical instruments.
//
// Every instrument below is one AMedix field of type `pulm_scores`. Each item
// records what the patient or the clinician documented; the components are added
// up exactly as the published instrument defines them, and the total is shown
// with the band the instrument's own authors define.
//
// WHAT THESE INSTRUMENTS NEVER DO
//   · They never diagnose, stage a disease for the clinician or select a therapy.
//   · They never read an unanswered item as normal or as zero — an incomplete
//     instrument stays incomplete and is not scored.
//   · They never replace the clinician's documented interpretation.
//
// Instruments and their sources:
//   · ACT — Asthma Control Test (QualityMetric), the control measure GINA names.
//   · CAT — COPD Assessment Test (GlaxoSmithKline), the symptom burden measure
//     GOLD uses.
//   · mMRC — modified Medical Research Council dyspnoea scale (GOLD).
//   · CURB-65 — CAP severity score (BTS / IDSA-ATS pneumonia guidance).
//   · Wells PE — Wells score for pulmonary embolism probability (ESC PE guidance).
//   · PERC — Pulmonary Embolism Rule-out Criteria (ESC / ACEP guidance).
//   · STOP-BANG — obstructive sleep apnoea screening (AASM-referenced).
//   · GOLD ABE — the GOLD 2023+ grouping, derived only from documented inputs.

const scale = (labels) => labels.map((label, index) => ({ label, score: index + 1 }));
const zeroScale = (labels) => labels.map((label, index) => ({ label, score: index }));

const LIKERT_5 = scale([
  "1 — All of the time",
  "2 — Most of the time",
  "3 — Some of the time",
  "4 — A little of the time",
  "5 — None of the time",
]);

const CONTROL_5 = scale([
  "1 — Not controlled at all",
  "2 — Poorly controlled",
  "3 — Somewhat controlled",
  "4 — Well controlled",
  "5 — Completely controlled",
]);

const CAT_6 = zeroScale([
  "0 — No problem at all",
  "1",
  "2",
  "3",
  "4",
  "5 — Worst possible",
]);

const binary = (points) => [
  { label: "No", score: 0 },
  { label: "Yes", score: points },
];

export const PULM_INSTRUMENTS = {
  act: {
    key: "act",
    label: "Asthma Control Test (ACT)",
    source: "GINA — Asthma Control Test",
    total: 25,
    incomplete: "Every one of the five questions must be answered before the ACT is scored.",
    items: [
      { key: "act_work", label: "1. In the past 4 weeks, how often did asthma keep you from getting as much done at work, school or home?", options: LIKERT_5 },
      { key: "act_breath", label: "2. In the past 4 weeks, how often have you had shortness of breath?", options: LIKERT_5 },
      { key: "act_night", label: "3. In the past 4 weeks, how often did asthma symptoms wake you at night or earlier than usual?", options: LIKERT_5 },
      { key: "act_reliever", label: "4. In the past 4 weeks, how often have you used your reliever inhaler?", options: LIKERT_5 },
      { key: "act_control", label: "5. In the past 4 weeks, how would you rate your asthma control?", options: CONTROL_5 },
    ],
    band: (total) =>
      total >= 20
        ? "20–25 — well controlled as measured by the ACT; the clinician's own assessment remains the record"
        : total >= 16
          ? "16–19 — not well controlled as measured by the ACT"
          : "5–15 — very poorly controlled as measured by the ACT",
  },
  cat: {
    key: "cat",
    label: "COPD Assessment Test (CAT)",
    source: "GOLD — COPD Assessment Test",
    total: 40,
    incomplete: "Every one of the eight items must be answered before the CAT is scored.",
    items: [
      { key: "cat_cough", label: "1. Cough", options: CAT_6 },
      { key: "cat_phlegm", label: "2. Phlegm", options: CAT_6 },
      { key: "cat_tightness", label: "3. Chest tightness", options: CAT_6 },
      { key: "cat_stairs", label: "4. Breathlessness walking up stairs or a hill", options: CAT_6 },
      { key: "cat_home", label: "5. Activity limitation at home", options: CAT_6 },
      { key: "cat_confidence", label: "6. Confidence leaving home despite lung disease", options: CAT_6 },
      { key: "cat_sleep", label: "7. Sleep", options: CAT_6 },
      { key: "cat_energy", label: "8. Energy", options: CAT_6 },
    ],
    band: (total) =>
      total >= 30
        ? "30–40 — very high impact"
        : total >= 20
          ? "20–29 — high impact"
          : total >= 10
            ? "10–19 — medium impact"
            : "0–9 — low impact",
  },
  mmrc: {
    key: "mmrc",
    label: "modified MRC Dyspnoea Scale (mMRC)",
    source: "GOLD — mMRC",
    total: 4,
    incomplete: "Select the single grade that matches the documented breathlessness.",
    items: [
      {
        key: "mmrc_grade",
        label: "Grade",
        options: [
          { label: "0 — Breathless only with strenuous exercise", score: 0 },
          { label: "1 — Short of breath when hurrying on level ground or walking up a slight hill", score: 1 },
          { label: "2 — Walks slower than people of the same age, or stops for breath walking level at own pace", score: 2 },
          { label: "3 — Stops for breath after about 100 metres or a few minutes on level ground", score: 3 },
          { label: "4 — Too breathless to leave the house, or breathless when dressing", score: 4 },
        ],
      },
    ],
    band: (total) =>
      total >= 2
        ? "2–4 — breathlessness that GOLD treats as a high symptom burden when grouping patients"
        : "0–1 — lower breathlessness burden as measured by the mMRC",
  },
  curb65: {
    key: "curb65",
    label: "CURB-65 — pneumonia severity",
    source: "BTS / IDSA-ATS community-acquired pneumonia guidance",
    total: 5,
    incomplete: "Each criterion must be answered as documented before the score is read.",
    items: [
      { key: "curb_confusion", label: "New confusion", options: binary(1) },
      { key: "curb_urea", label: "Urea above 7 mmol/L", options: binary(1) },
      { key: "curb_rr", label: "Respiratory rate 30/min or more", options: binary(1) },
      { key: "curb_bp", label: "Systolic below 90 mmHg or diastolic 60 mmHg or below", options: binary(1) },
      { key: "curb_age", label: "Age 65 or older", options: binary(1) },
    ],
    band: (total) =>
      total >= 3
        ? "3–5 — high severity; the guidance associates this with inpatient management and considers critical care assessment"
        : total === 2
          ? "2 — the guidance considers short-stay inpatient assessment or supervised outpatient management"
          : "0–1 — the guidance supports outpatient management where the clinical picture allows",
  },
  wells_pe: {
    key: "wells_pe",
    label: "Wells score — pulmonary embolism",
    source: "ESC pulmonary embolism guidance",
    total: 12.5,
    incomplete: "Answer every item from the documented findings before reading the score.",
    items: [
      { key: "wells_dvt", label: "Clinical signs of deep vein thrombosis", options: binary(3) },
      { key: "wells_pe_likely", label: "PE is the most likely diagnosis (or equally likely)", options: binary(3) },
      { key: "wells_hr", label: "Heart rate above 100/min", options: binary(1.5) },
      { key: "wells_immobile", label: "Immobilisation for 3 days or surgery in the previous 4 weeks", options: binary(1.5) },
      { key: "wells_previous", label: "Previous DVT or pulmonary embolism", options: binary(1.5) },
      { key: "wells_haemoptysis", label: "Haemoptysis", options: binary(1) },
      { key: "wells_malignancy", label: "Active malignancy", options: binary(1) },
    ],
    band: (total) =>
      total > 4
        ? "Above 4 — PE likely as scored; the guidance proceeds to diagnostic imaging"
        : "4 or less — PE unlikely as scored; the guidance proceeds with a rule-out pathway",
  },
  perc: {
    key: "perc",
    label: "PERC — pulmonary embolism rule-out criteria",
    source: "ESC / ACEP pulmonary embolism guidance",
    total: 8,
    incomplete: "Every criterion must be documented as absent or present before PERC is applied.",
    items: [
      { key: "perc_age", label: "Age 50 or older", options: binary(1) },
      { key: "perc_hr", label: "Heart rate 100/min or more", options: binary(1) },
      { key: "perc_spo2", label: "Oxygen saturation below 95%", options: binary(1) },
      { key: "perc_haemoptysis", label: "Haemoptysis", options: binary(1) },
      { key: "perc_oestrogen", label: "Oestrogen use", options: binary(1) },
      { key: "perc_previous", label: "Previous DVT or pulmonary embolism", options: binary(1) },
      { key: "perc_leg", label: "Unilateral leg swelling", options: binary(1) },
      { key: "perc_surgery", label: "Surgery or trauma needing hospitalisation in the previous 4 weeks", options: binary(1) },
    ],
    band: (total) =>
      total === 0
        ? "All eight criteria absent — PERC negative as documented (PE below the guideline testing threshold)"
        : `${total} criteria present — PERC cannot rule out PE; the guideline testing pathway applies`,
  },
  stopbang: {
    key: "stopbang",
    label: "STOP-BANG — obstructive sleep apnoea screening",
    source: "STOP-BANG screening questionnaire",
    total: 8,
    incomplete: "Answer all eight items; a partly answered STOP-BANG is not scored.",
    items: [
      { key: "sb_snore", label: "Snoring loudly enough to be heard through a closed door", options: binary(1) },
      { key: "sb_tired", label: "Tiredness or sleepiness during the day", options: binary(1) },
      { key: "sb_observed", label: "Observed stopping of breathing or choking during sleep", options: binary(1) },
      { key: "sb_pressure", label: "High blood pressure, treated or untreated", options: binary(1) },
      { key: "sb_bmi", label: "Body mass index above 35 kg/m²", options: binary(1) },
      { key: "sb_age", label: "Age above 50", options: binary(1) },
      { key: "sb_neck", label: "Neck circumference above 40 cm", options: binary(1) },
      { key: "sb_gender", label: "Male gender", options: binary(1) },
    ],
    band: (total) =>
      total >= 5
        ? "5–8 — high risk as screened; the guideline pathway is objective sleep testing"
        : total >= 3
          ? "3–4 — intermediate risk as screened"
          : "0–2 — low risk as screened",
  },
};

export const PULM_SCORE_KEYS = Object.keys(PULM_INSTRUMENTS);

export const pulmInstrument = (key) => PULM_INSTRUMENTS[key] || null;

// The value a score field holds: answers keyed by item, tagged with the
// instrument so a saved note can be printed without the form's context.
export const pulmScoreValue = (instrumentKey, answers) => ({ __i: instrumentKey, answers: answers || {} });

const answerScore = (item, answer) => {
  const option = (item.options || []).find((o) => o.label === answer);
  return option ? option.score : null;
};

// A score is returned only when every item is answered. Anything else stays
// unscored — an unanswered item is never counted as zero.
export const pulmScore = (instrumentKey, value) => {
  const spec = pulmInstrument(instrumentKey);
  const answers = value && typeof value === "object" ? value.answers || {} : {};
  if (!spec) return { complete: false, total: null, answered: 0, of: 0, band: "" };
  const scored = spec.items.map((item) => answerScore(item, answers[item.key]));
  const answered = scored.filter((s) => s !== null).length;
  if (answered !== spec.items.length) {
    return { complete: false, total: null, answered, of: spec.items.length, band: "" };
  }
  const total = Math.round(scored.reduce((sum, s) => sum + s, 0) * 10) / 10;
  return { complete: true, total, answered, of: spec.items.length, band: spec.band(total) };
};

// GOLD ABE grouping, derived ONLY from what the clinician documented. When the
// inputs are missing the group is not assigned.
export const goldAbe = ({ exacerbations, catTotal, mmrcGrade }) => {
  const exac = String(exacerbations || "");
  if (!exac || /not documented/i.test(exac)) return { group: "", reason: "Exacerbation history not documented." };
  const highRisk = /2 or more|hospital attendance|needing admission|ventilatory support/i.test(exac);
  if (highRisk) return { group: "E", reason: "Grouped E from the documented exacerbation history." };
  const symptomatic =
    (typeof catTotal === "number" && catTotal >= 10) || (typeof mmrcGrade === "number" && mmrcGrade >= 2);
  const hasSymptomMeasure = typeof catTotal === "number" || typeof mmrcGrade === "number";
  if (!hasSymptomMeasure) return { group: "", reason: "CAT or mMRC not documented, so A and B cannot be separated." };
  return symptomatic
    ? { group: "B", reason: "Grouped B: fewer than two moderate exacerbations with a high symptom burden." }
    : { group: "A", reason: "Grouped A: fewer than two moderate exacerbations with a low symptom burden." };
};

// Printed form: every answered item in the instrument's own order, then the total
// and the band, or an explicit statement that the instrument is incomplete.
export const formatPulmonologyScores = (value) => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return PULM_SCORE_KEYS.map((key) => {
    const answers = (v[key] && v[key].answers) || {};
    const spec = pulmInstrument(key);
    const answered = spec.items.filter((i) => String(answers[i.key] ?? "").trim());
    if (answered.length === 0) return "";
    const result = pulmScore(key, v[key]);
    const lines = answered.map((i) => `${i.label} ${answers[i.key]}`);
    const footer = result.complete
      ? `Total ${result.total}${key === "act" || key === "cat" ? `/${spec.total}` : ""} — ${result.band}`
      : `Incomplete — ${result.answered} of ${result.of} items answered, so no total is recorded.`;
    return `${spec.label} (${spec.source})\n${lines.join("\n")}\n${footer}`;
  })
    .filter(Boolean)
    .join("\n\n");
};