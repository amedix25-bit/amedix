// NEUROSURGERY — post-operative monitoring.
//
// The record of what was watched, what changed, whether a documented threshold
// was reached, what was done about it, who is responsible, and when the patient
// is next reviewed. One structured block, used by the post-operative progress
// note and by both operation notes for the immediate post-operative period.
//
// DESIGN RULES
//   - A missing value is "Not documented", never "no complication".
//   - Thresholds are documented criteria, not a severity score, and reaching one
//     never replaces the clinician's decision.

export const NOT_DOCUMENTED = "Not documented";

export const NSG_OBS_FREQUENCY = [
  "Every 15 minutes",
  "Hourly",
  "Every 2 hours",
  "Every 4 hours",
  "Per the unit's post-operative protocol",
  NOT_DOCUMENTED,
];

export const NSG_TREND = ["Stable", "Improving", "Deteriorating", "Fluctuating", NOT_DOCUMENTED];

export const NSG_PUPIL_TREND = [
  "Equal and reactive",
  "Asymmetrical — documented",
  "Fixed — documented",
  "Unable to assess",
  NOT_DOCUMENTED,
];

export const NSG_POSTOP_CRITERIA = [
  "GCS fallen by two or more points",
  "New or unequal pupil",
  "New focal deficit",
  "First seizure",
  "Wound swelling, CSF leak or wound discharge",
  "Drain or EVD not draining, or output changed unexpectedly",
  "Fever with meningism or wound change",
  "Blood pressure or cerebral perfusion pressure below the documented target",
  "Severe or escalating headache with vomiting",
  "New respiratory compromise",
];

export const NSG_DRAIN_FUNCTION = [
  "Functioning — draining as expected",
  "Not draining — checked and repositioned",
  "Blocked — replaced",
  "Dislodged — documented and managed",
  "Removed — reason documented",
  "Not applicable",
  NOT_DOCUMENTED,
];

export const NSG_WOUND = [
  "Dry and intact",
  "Swelling without leak",
  "CSF leak",
  "Discharge or dehiscence",
  "Haematoma",
  NOT_DOCUMENTED,
];

export const NSG_BLEEDING = [
  "No clinical concern",
  "Suspected — CT requested",
  "Confirmed on CT",
  NOT_DOCUMENTED,
];

export const NSG_INFECTION = [
  "No features",
  "Fever without a source",
  "Meningism",
  "Wound infection",
  "Confirmed — organism documented",
  NOT_DOCUMENTED,
];

const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const TIME = (key, label, extra) => ({ key, label, type: "time", ...extra });
const NUM = (key, label, extra) => ({ key, label, type: "number", ...extra });
const CHECK = (key, label, options, extra) => ({ key, label, type: "checkbox", options, ...extra });

// "monitoring" keeps only what the post-operative progress note does not
// already ask: the observation interval, the neurological trend, and the
// documented thresholds with the action, the responsible clinician and the
// review. "full" is used where no other post-operative fields exist.
const buildSections = () => [
  {
    title: "Observation Interval & Neurological Monitoring",
    fields: [
      NUM("postop_day", "Post-operative day", { min: 0 }),
      TIME("last_obs_time", "Time of the last documented observation"),
      S("obs_frequency", "Neurological observation frequency in place", NSG_OBS_FREQUENCY, {
        critical: true,
      }),
      S("gcs_trend", "Conscious level trend", NSG_TREND),
      S("pupil_trend", "Pupillary trend", NSG_PUPIL_TREND),
      S("new_deficit", "New neurological deficit since the last entry", [
        "None documented",
        "New deficit — documented",
        "Unable to assess",
        NOT_DOCUMENTED,
      ]),
      I("deficit_detail", "Deficit detail and the grade compared with the previous entry"),
      S("seizure", "Seizure", ["None", "First seizure — documented", "Recurrent", "History only", NOT_DOCUMENTED]),
    ],
  },
  {
    title: "Wound, Drain & Pressure",
    note: "Intracranial pressure and cerebral perfusion pressure, where monitored, are recorded with the target the treating team set.",
    fields: [
      S("wound", "Surgical site and wound", NSG_WOUND),
      I("wound_detail", "Wound detail — size, leak, handling and swab result"),
      I("drain_type", "Drain or EVD in place — type and setting"),
      S("drain_function", "Drain function", NSG_DRAIN_FUNCTION),
      I("drain_output", "Drain output over the interval"),
      I("icp", "Intracranial pressure / cerebral perfusion pressure against target"),
      I("positioning", "Positioning and mobilisation in place"),
    ],
  },
  {
    title: "Complications Being Watched For",
    fields: [
      S("bleeding", "Post-operative bleeding or haematoma", NSG_BLEEDING),
      S("infection", "Infection features", NSG_INFECTION),
      S("csf", "CSF leak", ["None", "Suspected", "Confirmed", NOT_DOCUMENTED]),
      S("hydrocephalus", "Hydrocephalus features", ["None documented", "Present — documented", NOT_DOCUMENTED]),
      S("systemic", "Systemic complication", [
        "None documented",
        "Respiratory",
        "Thromboembolic",
        "Cardiac",
        "Renal or electrolyte",
        "Other — documented",
        NOT_DOCUMENTED,
      ]),
      S("postop_ct", "CT since the operation", [
        "Not indicated — reason documented",
        "Requested — pending",
        "Performed — reviewed",
        NOT_DOCUMENTED,
      ]),
      T("ct_detail", "CT finding and what it changes", { rows: 2 }),
    ],
  },
  {
    title: "Deterioration Response, Responsibility & Review",
    note: "Criteria are documented thresholds for calling for help. Reaching one prompts a review; it never replaces the clinician's decision.",
    fields: [
      CHECK("criteria_met", "Documented thresholds reached since the last entry", NSG_POSTOP_CRITERIA),
      T("action_taken", "Action taken in response — who was called, what was done and what it changed", {
        rows: 2,
      }),
      TIME("action_time", "Time the action was taken"),
      I("responsible_clinician", "Clinician responsible for this patient", { critical: true }),
      I("reviewed_by", "Reviewed by — name, grade and time"),
      I("next_review", "Next review — when and by whom"),
      S("next_ct", "Next CT or review of the post-operative scan", [
        "None planned — reason documented",
        "Planned — timing documented",
        "On deterioration only",
        NOT_DOCUMENTED,
      ]),
      T("followup", "Review and follow-up after discharge — clinic, wound check, scan and who is responsible", {
        rows: 2,
      }),
      I("handover", "Handover given to — name, grade and time"),
    ],
  },
];

const MONITORING_ONLY = [
  "Observation Interval & Neurological Monitoring",
  "Deterioration Response, Responsibility & Review",
];

export const postopSections = (variant = "full") => {
  const sections = buildSections();
  if (variant !== "monitoring") return sections;
  return sections.filter((s) => MONITORING_ONLY.includes(s.title));
};

const arr = (v) => (Array.isArray(v) ? v : []);
const text = (v) => String(v ?? "").trim();

export const postopFlags = (value = {}) => {
  const v = value || {};
  return {
    documented: Boolean(text(v.obs_frequency) || text(v.gcs_trend) || text(v.wound)),
    no_observation_interval: !text(v.obs_frequency) || text(v.obs_frequency) === NOT_DOCUMENTED,
    deterioration: /Deteriorating/i.test(text(v.gcs_trend)) || /New deficit/i.test(text(v.new_deficit)),
    pupil_change: /Asymmetrical|Fixed/i.test(text(v.pupil_trend)),
    csf_leak: /Suspected|Confirmed/i.test(text(v.csf)),
    bleeding: /Suspected|Confirmed/i.test(text(v.bleeding)),
    infection: /Meningism|Wound infection|Confirmed/i.test(text(v.infection)),
    drain_problem: /Not draining|Blocked|Dislodged/i.test(text(v.drain_function)),
    seizure: /First seizure|Recurrent/i.test(text(v.seizure)),
    criteria: arr(v.criteria_met),
    no_responsible: !text(v.responsible_clinician),
  };
};

export const formatPostopMonitoring = (value) => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const lines = [];

  postopSections().forEach((section) => {
    const body = section.fields
      .map((f) => {
        const raw = v[f.key];
        const val = Array.isArray(raw) ? raw.join("; ") : text(raw);
        return val ? `${f.label}: ${val}` : null;
      })
      .filter(Boolean);
    if (body.length) lines.push(`${section.title}\n${body.map((b) => `- ${b}`).join("\n")}`);
  });

  if (!lines.length) return "Post-operative monitoring not documented in this note.";

  if (!text(v.obs_frequency)) {
    lines.push("Not documented: the neurological observation frequency in place.");
  }
  if (!text(v.responsible_clinician)) {
    lines.push("Not documented: the clinician responsible for this patient.");
  }

  return lines.join("\n\n");
};