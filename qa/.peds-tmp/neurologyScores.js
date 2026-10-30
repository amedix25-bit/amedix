// Neurology — guideline-based calculations.
//
// Every score below is computed ONLY from values documented in the note. A
// missing item leaves the score uncalculated and states exactly what is missing:
// nothing is estimated, defaulted or inferred, and a blank is never treated as a
// normal finding. A score is a documented observation, never a diagnosis.
//
// The item weights are those of the published instrument named beside each score.
// No probability, prognosis or outcome table is invented: only the score itself is
// computed, and the published interpretation bands are named where they exist.

import { asObject, num, str, isBlank } from "./neurologyFieldKit.js";

export const NEURO_SCORE_SOURCES = {
  nihss: {
    organization: "NIH Stroke Scale",
    title: "National Institutes of Health Stroke Scale (NIHSS) — 15-item scale, total 0-42",
    url: "https://www.ninds.nih.gov/health-information/public-education/brain-basics",
  },
  gcs: {
    organization: "Glasgow Coma Scale",
    title: "Glasgow Coma Scale — eye, verbal and motor components (Teasdale & Jennett)",
    url: "https://www.glasgowcomascale.org/",
  },
  mrs: {
    organization: "Modified Rankin Scale",
    title: "Modified Rankin Scale for global disability, grades 0-6",
    url: "https://www.ahajournals.org/journal/str",
  },
  ich: {
    organization: "Hemphill et al.",
    title: "ICH Score for spontaneous intracerebral haemorrhage (0-6)",
    url: "https://pubmed.ncbi.nlm.nih.gov/11565064/",
  },
  chads: {
    organization: "CHA2DS2-VASc",
    title: "CHA2DS2-VASc stroke-risk score in atrial fibrillation (0-9)",
    url: "https://www.ahajournals.org/journal/str",
  },
  hasbled: {
    organization: "HAS-BLED",
    title: "HAS-BLED bleeding-risk score in atrial fibrillation (0-9)",
    url: "https://www.ahajournals.org/journal/str",
  },
  abcd2: {
    organization: "ABCD2",
    title: "ABCD2 score after transient ischaemic attack (0-7)",
    url: "https://www.ahajournals.org/journal/str",
  },
};

const opts = (pairs) => pairs.map(([value, label]) => ({ value, label }));
const y = (label) => ({ value: "Yes", label: label || "Yes" });
const n = (label) => ({ value: "No", label: label || "No" });

export const NEURO_SCORES = [
  {
    key: "nihss",
    name: "NIH Stroke Scale (NIHSS)",
    purpose: "Documented stroke severity, item by item, as examined",
    population: "Acute stroke, before and after reperfusion therapy",
    source: NEURO_SCORE_SOURCES.nihss,
    max: 42,
    variables: [
      { key: "1a", label: "1a — Level of consciousness", options: opts([[0, "0 Alert"], [1, "1 Not alert, arousable by minor stimulation"], [2, "2 Not alert, requires repeated stimulation"], [3, "3 Unresponsive or reflex responses only"]]) },
      { key: "1b", label: "1b — LOC questions (month, age)", options: opts([[0, "0 Both correct"], [1, "1 One correct"], [2, "2 Neither correct"]]) },
      { key: "1c", label: "1c — LOC commands (open/close eyes, grip/release)", options: opts([[0, "0 Both correct"], [1, "1 One correct"], [2, "2 Neither correct"]]) },
      { key: "2", label: "2 — Best gaze", options: opts([[0, "0 Normal"], [1, "1 Partial gaze palsy"], [2, "2 Forced deviation or total paresis"]]) },
      { key: "3", label: "3 — Visual fields", options: opts([[0, "0 No visual loss"], [1, "1 Partial hemianopia"], [2, "2 Complete hemianopia"], [3, "3 Bilateral hemianopia or blind"]]) },
      { key: "4", label: "4 — Facial palsy", options: opts([[0, "0 Normal"], [1, "1 Minor paralysis"], [2, "2 Partial paralysis"], [3, "3 Complete paralysis of one or both sides"]]) },
      { key: "5l", label: "5 — Motor, left arm (0-4)", options: opts([[0, "0 No drift"], [1, "1 Drift"], [2, "2 Some effort against gravity"], [3, "3 No effort against gravity"], [4, "4 No movement"]]) },
      { key: "6r", label: "6 — Motor, right arm (0-4)", options: opts([[0, "0 No drift"], [1, "1 Drift"], [2, "2 Some effort against gravity"], [3, "3 No effort against gravity"], [4, "4 No movement"]]) },
      { key: "7l", label: "7 — Motor, left leg (0-4)", options: opts([[0, "0 No drift"], [1, "1 Drift"], [2, "2 Some effort against gravity"], [3, "3 No effort against gravity"], [4, "4 No movement"]]) },
      { key: "8r", label: "8 — Motor, right leg (0-4)", options: opts([[0, "0 No drift"], [1, "1 Drift"], [2, "2 Some effort against gravity"], [3, "3 No effort against gravity"], [4, "4 No movement"]]) },
      { key: "9", label: "9 — Limb ataxia", options: opts([[0, "0 Absent"], [1, "1 Present in one limb"], [2, "2 Present in two limbs"]]) },
      { key: "10", label: "10 — Sensory", options: opts([[0, "0 Normal"], [1, "1 Mild to moderate loss"], [2, "2 Severe or total loss"]]) },
      { key: "11", label: "11 — Best language", options: opts([[0, "0 No aphasia"], [1, "1 Mild to moderate aphasia"], [2, "2 Severe aphasia"], [3, "3 Mute or global aphasia"]]) },
      { key: "12", label: "12 — Dysarthria", options: opts([[0, "0 Normal"], [1, "1 Mild to moderate"], [2, "2 Severe, unintelligible or mute"]]) },
      { key: "13", label: "13 — Extinction and inattention", options: opts([[0, "0 None"], [1, "1 One modality"], [2, "2 More than one modality"]]) },
    ],
  },
  {
    key: "gcs",
    name: "Glasgow Coma Scale (GCS)",
    purpose: "Level of consciousness, recorded as its three components and their sum",
    population: "Any reduced level of consciousness",
    source: NEURO_SCORE_SOURCES.gcs,
    max: 15,
    variables: [
      { key: "eye", label: "Eye opening", options: opts([[4, "4 Spontaneous"], [3, "3 To sound"], [2, "2 To pressure"], [1, "1 None"]]) },
      { key: "verbal", label: "Verbal response", options: opts([[5, "5 Orientated"], [4, "4 Confused"], [3, "3 Words"], [2, "2 Sounds"], [1, "1 None"]]) },
      { key: "motor", label: "Motor response", options: opts([[6, "6 Obeys commands"], [5, "5 Localising"], [4, "4 Normal flexion"], [3, "3 Abnormal flexion"], [2, "2 Extension"], [1, "1 None"]]) },
    ],
    mode: "sum",
    min: 3,
  },
  {
    key: "mrs",
    name: "Modified Rankin Scale (mRS)",
    purpose: "Global disability at this point in the patient's course",
    population: "Stroke and other acquired neurological disability",
    source: NEURO_SCORE_SOURCES.mrs,
    variables: [
      {
        key: "grade",
        label: "Grade",
        options: opts([
          [0, "0 No symptoms"],
          [1, "1 No significant disability despite symptoms"],
          [2, "2 Slight disability — independent but unable to carry out all previous activities"],
          [3, "3 Moderate disability — requires some help but walks without assistance"],
          [4, "4 Moderately severe disability — unable to walk or attend to bodily needs without assistance"],
          [5, "5 Severe disability — bedridden, incontinent, requires constant care"],
          [6, "6 Dead"],
        ]),
      },
    ],
    mode: "single",
  },
  {
    key: "ich_score",
    name: "ICH Score (spontaneous intracerebral haemorrhage)",
    purpose: "Documented severity of a spontaneous intracerebral haemorrhage",
    population: "Adults with spontaneous intracerebral haemorrhage",
    source: NEURO_SCORE_SOURCES.ich,
    max: 6,
    variables: [
      { key: "gcs_band", label: "GCS at presentation", options: opts([[0, "13-15 (0)"], [1, "5-12 (1)"], [2, "3-4 (2)"]]) },
      { key: "volume", label: "Haemorrhage volume ≥ 30 mL", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "ivh", label: "Intraventricular extension", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "infratentorial", label: "Infratentorial origin", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "age80", label: "Age ≥ 80 years", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
    ],
  },
  {
    key: "cha2ds2_vasc",
    name: "CHA2DS2-VASc",
    purpose: "Documented stroke-risk factors in atrial fibrillation",
    population: "Atrial fibrillation, for the thromboembolic-risk record",
    source: NEURO_SCORE_SOURCES.chads,
    max: 9,
    variables: [
      { key: "chf", label: "Congestive heart failure", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "htn", label: "Hypertension", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "age75", label: "Age ≥ 75 years", options: opts([[0, "No (0)"], [2, "Yes (2)"]]) },
      { key: "dm", label: "Diabetes mellitus", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "stroke", label: "Prior stroke, TIA or thromboembolism", options: opts([[0, "No (0)"], [2, "Yes (2)"]]) },
      { key: "vasc", label: "Vascular disease", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "age65", label: "Age 65-74 years", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "sex", label: "Female sex", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
    ],
  },
  {
    key: "has_bled",
    name: "HAS-BLED",
    purpose: "Documented bleeding-risk factors before anticoagulation",
    population: "Atrial fibrillation being considered for anticoagulation",
    source: NEURO_SCORE_SOURCES.hasbled,
    max: 9,
    variables: [
      { key: "htn", label: "Uncontrolled hypertension (systolic > 160 mmHg)", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "renal", label: "Abnormal renal function", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "liver", label: "Abnormal liver function", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "stroke", label: "Prior stroke", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "bleeding", label: "Prior major bleeding or predisposition", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "labile_inr", label: "Labile INR", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "elderly", label: "Age > 65 years", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "drugs", label: "Antiplatelet or NSAID use", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "alcohol", label: "Alcohol excess", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
    ],
  },
  {
    key: "abcd2",
    name: "ABCD2",
    purpose: "Documented short-term stroke-risk factors after a transient ischaemic attack",
    population: "Transient ischaemic attack",
    source: NEURO_SCORE_SOURCES.abcd2,
    max: 7,
    variables: [
      { key: "age", label: "Age ≥ 60 years", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "bp", label: "Blood pressure ≥ 140/90 mmHg at assessment", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
      { key: "clinical", label: "Clinical features", options: opts([[0, "Other (0)"], [1, "Speech disturbance without weakness (1)"], [2, "Unilateral weakness (2)"]]) },
      { key: "duration", label: "Attack duration", options: opts([[0, "< 10 minutes (0)"], [1, "10-59 minutes (1)"], [2, "≥ 60 minutes (2)"]]) },
      { key: "diabetes", label: "Diabetes mellitus", options: opts([[0, "No (0)"], [1, "Yes (1)"]]) },
    ],
  },
];

export const neuroScore = (key) => NEURO_SCORES.find((s) => s.key === key) || null;

// A score is computed only when every item is documented. The returned object
// names what is still missing instead of producing a partial total that would read
// as a complete score.
export const calculateNeuroScore = (key, inputs) => {
  const spec = neuroScore(key);
  if (!spec) return null;
  const values = asObject(inputs);
  const missing = spec.variables.filter((v) => isBlank(values[v.key])).map((v) => v.label);
  if (missing.length) return { spec, missing, value: null, band: "" };

  if (spec.mode === "single") {
    const chosen = spec.variables[0].options.find((o) => String(o.value) === String(values[spec.variables[0].key]));
    return { spec, missing: [], value: chosen ? chosen.value : null, band: chosen ? chosen.label : "" };
  }

  // A documented value that matches no option is never counted as zero: the total
  // is withheld and the item is named, so a mistyped or legacy value can never
  // produce a wrong score — and no safety prompt or printed record is built on one.
  const unmatched = spec.variables.filter(
    (v) => !v.options.some((o) => String(o.value) === String(values[v.key])),
  );
  if (unmatched.length) {
    return { spec, missing: unmatched.map((v) => `${v.label} (value not recognised)`), value: null, band: "" };
  }

  const total = spec.variables.reduce((sum, v) => {
    const chosen = v.options.find((o) => String(o.value) === String(values[v.key]));
    return sum + (chosen ? Number(chosen.value) : 0);
  }, 0);

  const band =
    key === "gcs"
      ? total <= 8
        ? "Severe (GCS ≤ 8) — airway and airway-protection assessment recorded"
        : total <= 12
          ? "Moderate (GCS 9-12)"
          : "Mild (GCS 13-15)"
      : "";

  return { spec, missing: [], value: total, band };
};

export const formatNeuroScores = (value) => {
  const inputs = asObject(value);
  const lines = NEURO_SCORES.map((spec) => {
    const result = calculateNeuroScore(spec.key, asObject(inputs[spec.key]));
    if (!result) return null;
    if (result.missing.length) {
      return `${spec.name}: not calculated — missing ${result.missing.join(", ")}`;
    }
    if (result.value === null) return null;
    const detail = spec.variables
      .map((v) => {
        const raw = asObject(inputs[spec.key])[v.key];
        const chosen = v.options.find((o) => String(o.value) === String(raw));
        return chosen ? `${v.label}: ${chosen.label}` : null;
      })
      .filter(Boolean)
      .join("; ");
    return `${spec.name}: ${result.value}${result.band ? ` (${result.band})` : ""}${
      spec.variables.length > 1 ? ` — ${detail}` : ""
    } — source: ${spec.source.organization}, ${spec.source.title}`;
  }).filter(Boolean);
  if (!lines.length) return "No guideline-based score documented in this note.";
  return lines.join("\n");
};

// Kept so a caller can render a plain-text score summary without pulling the
// component in.
export const neuroScoreSummary = (key, inputs) => {
  const result = calculateNeuroScore(key, inputs);
  if (!result) return "";
  if (result.missing.length) return `not calculated — missing ${result.missing.join(", ")}`;
  return str(result.value);
};