// Field and section builders shared by all examination type configurations.
// A field spec is plain data — the Dynamic Examination Engine renders whatever
// these builders produce, so new fields/options never require UI changes.

export const MRC_POWER_SCALE = [
  "0 — No contraction",
  "1 — Flicker of contraction",
  "2 — Movement with gravity eliminated",
  "3 — Movement against gravity",
  "4 — Movement against resistance",
  "5 — Normal power",
];

export const REFLEX_SCALE = [
  "0 — Absent",
  "1+ — Hypoactive",
  "2+ — Normal",
  "3+ — Hyperactive",
  "4+ — Clonus",
];

export const SIDE_OPTIONS = ["Right", "Left", "Bilateral"];

// type "select" — dropdown. options: list. bilateral: renders Right/Left pair.
// detailOn: option(s) that reveal a detail text input (+ laterality when detailLaterality).
export const sel = (key, label, options, extra = {}) => ({ key, label, type: "select", options, ...extra });

// type "checkbox" — boolean finding. detailOn: reveals detail text when checked.
export const chk = (key, label, extra = {}) => ({ key, label, type: "checkbox", ...extra });

// type "multiselect" — multiple choice pills.
export const multi = (key, label, options, extra = {}) => ({ key, label, type: "multiselect", options, ...extra });

// type "number" — numeric input. unit/min/max/step supported. bilateral: Right/Left pair.
export const num = (key, label, extra = {}) => ({ key, label, type: "number", ...extra });

// type "text" / "textarea"
export const txt = (key, label, extra = {}) => ({ key, label, type: "text", ...extra });
export const area = (key, label, extra = {}) => ({ key, label, type: "textarea", ...extra });

// type "laterality" — Right / Left / Bilateral selector.
export const lat = (key, label, extra = {}) => ({ key, label, type: "laterality", ...extra });

// type "scale" — graded scale (e.g. MRC power 0–5, reflexes 0–4). bilateral: Right/Left pair.
export const scale = (key, label, min, max, scaleLabels, extra = {}) =>
  ({ key, label, type: "scale", min, max, scaleLabels, ...extra });

// MRC 0–5 muscle power field with Right/Left grading.
export const power = (key, label) => scale(key, label, 0, 5, MRC_POWER_SCALE, { bilateral: true });

// Deep tendon reflex field with Right/Left 0–4+ grading.
export const reflex = (key, label) => scale(key, label, 0, 4, REFLEX_SCALE, { bilateral: true });

// type "cn" — cranial nerve: Normal / Abnormal / Not tested + detail when abnormal.
export const cn = (key, cnNumber, cnName) =>
  ({ key, cnNumber, cnName, label: `${cnNumber} — ${cnName}`, type: "cn" });

// A section card. mode "normal_abnormal" shows Normal/Abnormal controls and
// hides abnormalFields + notes until Abnormal is selected; mode "free" always
// shows its fields (e.g. vital signs, muscle power, cranial nerves).
export const section = (key, title, fields, extra = {}) => ({
  key,
  title,
  mode: "normal_abnormal",
  fields,
  abnormalFields: [],
  ...extra,
});

// Standard "Special Findings" section appended to clinical examinations.
export const specialFindings = (extraOptions = []) => section(
  "special_findings",
  "Special Findings",
  extraOptions,
  {
    abnormalFields: [area("findings", "Describe findings")],
    notesLabel: "Additional special findings / notes",
  }
);