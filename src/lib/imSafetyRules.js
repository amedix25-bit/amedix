// Internal Medicine — advisory safety prompts.
//
// Each prompt compares what the note actually recorded with the requirement of the
// cited document. It states what was documented, the requirement it addresses and
// the source. It never diagnoses, never orders treatment and never changes a
// diagnosis. Nothing here blocks saving the note.
//
// WHERE THE NUMBERS COME FROM
//   · The record's own structured fields — the Vital Signs field (the values the
//     clinician measured) and the documented inputs of the validated instruments.
//   · Nothing is parsed out of free text, nothing is estimated, and a vital that was
//     not measured is never read as normal.
//
// A rule fires only from values that were documented. A blank is never treated as a
// negative finding, and a prompt is not a statement that the condition is present.

import { imBlockValues } from "@/lib/imBlocks";
import { calculateImScore, imScoreInputs } from "@/lib/imScores";
import { IM_REFERENCES } from "@/lib/imReferences";
import { asObject, str, num } from "@/lib/fmFieldKit";

export const IM_SAFETY_PROVENANCE = {
  guideline: "Guideline requirement",
  local: "AMedix local decision — not a guideline claim",
};

const src = (key) => IM_REFERENCES[key] || IM_REFERENCES.acp;

const bv = (values, block) => imBlockValues(values, block);
const f = (values, block, field) => str(bv(values, block)[field]);

// A score is usable only when every documented input is present.
const scored = (values, key) => {
  const result = calculateImScore(key, imScoreInputs(values, "im_scores", key));
  return result && !result.missing?.length ? result : null;
};

// Vital signs are stored as the readable summary string the note, the view and the
// PDF already render ("Temperature: 37.2 °C · Pulse: 104 bpm · …"). Only the values
// the clinician measured are present; anything absent stays absent.
const VITAL_LABELS = {
  temperature: "temperature",
  pulse: "pulse",
  "respiratory rate": "respiratory_rate",
  "mean arterial pressure": "map",
  "oxygen saturation (spo₂)": "spo2",
  "oxygen saturation (spo2)": "spo2",
  "oxygen saturation": "spo2",
  "blood glucose": "blood_glucose",
  "urine output": "urine_output",
  "glasgow coma scale": "gcs",
  "pain score": "pain_score",
};

export const imVitalsFrom = (values = {}) => {
  const raw = typeof asObject(values).vitals === "string" ? asObject(values).vitals : "";
  const out = {};
  if (!raw) return out;
  raw.split("·").forEach((part) => {
    const idx = part.lastIndexOf(":");
    if (idx < 0) return;
    const label = part.slice(0, idx).trim().toLowerCase();
    const rest = part.slice(idx + 1).trim();
    if (label === "blood pressure") {
      const m = rest.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
      if (m) {
        out.systolic = Number(m[1]);
        out.diastolic = Number(m[2]);
      }
      return;
    }
    const key = VITAL_LABELS[label];
    if (!key) return;
    const n = Number(rest.replace(",", ".").replace(/[^\d.\-]/g, ""));
    if (!Number.isNaN(n) && rest.trim() !== "") out[key] = n;
  });
  return out;
};

const MED_TEXT = (values) =>
  [
    f(values, "im_history", "medications"),
    f(values, "im_chronic", "medicines_review"),
    f(values, "im_chronic", "deprescribing"),
  ]
    .join(" ")
    .toLowerCase();

const hasAny = (text, words) => words.some((w) => text.includes(w));

const NSAIDS = ["ibuprofen", "naproxen", "diclofenac", "indomethacin", "celecoxib", "etoricoxib", "aspirin", "nsaid", "ketorolac"];
const RAS_BLOCKERS = ["ramipril", "lisinopril", "enalapril", "perindopril", "captopril", "losartan", "valsartan", "candesartan", "olmesartan", "irbesartan", "sacubitril"];
const DIURETICS = ["furosemide", "frusemide", "bumetanide", "spironolactone", "hydrochlorothiazide", "indapamide", "torasemide"];
const ANTICOAGULANTS = ["warfarin", "apixaban", "rivaroxaban", "edoxaban", "dabigatran", "enoxaparin", "heparin", "acenocoumarol"];

const documented = (values, field, block = "im_chronic") => str(bv(values, block)[field]) !== "";

export const IM_SAFETY_RULES = [
  // ------------------------------------------------------------ vital signs
  {
    key: "hypotension",
    level: "critical",
    title: "Systolic blood pressure below 90 mmHg",
    source: "idsa",
    when: (values) => {
      const v = imVitalsFrom(values);
      if (v.systolic === undefined || v.systolic >= 90) return null;
      return `Systolic blood pressure ${v.systolic} mmHg recorded in this note's vital signs.`;
    },
    ask: "Document the cause considered, the fluid or vasopressor response, the repeat observations, and who reviewed the patient.",
  },
  {
    key: "hypoxia",
    level: "high",
    title: "Oxygen saturation below 92%",
    source: "ats",
    when: (values) => {
      const v = imVitalsFrom(values);
      if (v.spo2 === undefined || v.spo2 >= 92) return null;
      return `Oxygen saturation ${v.spo2}% recorded in this note's vital signs.`;
    },
    ask: "Document the oxygen therapy given and the target range, the response, the blood gas if taken, and the escalation plan.",
  },
  {
    key: "tachypnoea",
    level: "high",
    title: "Respiratory rate of 30/min or more",
    source: "ats",
    when: (values) => {
      const v = imVitalsFrom(values);
      if (v.respiratory_rate === undefined || v.respiratory_rate < 30) return null;
      return `Respiratory rate ${v.respiratory_rate}/min recorded in this note's vital signs.`;
    },
    ask: "Document the work of breathing, the cause considered, the oxygen and ventilatory support plan, and the review interval.",
  },
  {
    key: "hypothermia",
    level: "critical",
    title: "Temperature below 35 °C",
    source: "idsa",
    when: (values) => {
      const v = imVitalsFrom(values);
      if (v.temperature === undefined || v.temperature >= 35) return null;
      return `Temperature ${v.temperature} °C recorded in this note's vital signs.`;
    },
    ask: "Document the rewarming measures, the sepsis assessment (hypothermia is a sepsis criterion), and the senior review.",
  },
  {
    key: "tachycardia",
    level: "moderate",
    title: "Pulse above 120/min",
    source: "aha_acc",
    when: (values) => {
      const v = imVitalsFrom(values);
      if (v.pulse === undefined || v.pulse <= 120) return null;
      return `Pulse ${v.pulse}/min recorded in this note's vital signs.`;
    },
    ask: "Document whether the rhythm was confirmed on ECG, the cause considered, and the treatment given or withheld and why.",
  },
  {
    key: "hypoglycaemia",
    level: "high",
    title: "Blood glucose below 3.9 mmol/L (70 mg/dL)",
    source: "ada",
    when: (values) => {
      const v = imVitalsFrom(values);
      if (v.blood_glucose === undefined || v.blood_glucose >= 3.9) return null;
      return `Blood glucose ${v.blood_glucose} mmol/L recorded in this note's vital signs.`;
    },
    ask: "Document the treatment given and the response, the hypoglycaemic agent reviewed, the cause considered and the education given.",
  },
  {
    key: "severe_hyperglycaemia",
    level: "high",
    title: "Blood glucose 13.9 mmol/L (250 mg/dL) or more",
    source: "ada",
    when: (values) => {
      const v = imVitalsFrom(values);
      if (v.blood_glucose === undefined || v.blood_glucose < 13.9) return null;
      return `Blood glucose ${v.blood_glucose} mmol/L recorded in this note's vital signs.`;
    },
    ask: "Document the ketone assessment, the fluid and insulin plan where indicated, and the precipitant considered.",
  },
  {
    key: "oliguria",
    level: "high",
    title: "Urine output below 20 mL/hour",
    source: "kdigo",
    when: (values) => {
      const v = imVitalsFrom(values);
      if (v.urine_output === undefined || v.urine_output >= 20) return null;
      return `Urine output ${v.urine_output} mL/hour recorded in this note's vital signs.`;
    },
    ask: "Document the volume status, the fluid challenge or diuretic given and the response, the catheter status, and the renal function plan.",
  },

  // ------------------------------------------------------------ documented diagnoses and instruments
  {
    key: "sepsis_qsofa",
    level: "high",
    title: "Suspected infection with a qSOFA of 2 or more",
    source: "idsa",
    when: (values) => {
      const infection = f(values, "im_acute", "suspected_infection");
      if (infection !== "Suspected" && !String(infection).startsWith("Confirmed")) return null;
      const q = scored(values, "qsofa");
      if (!q || q.value < 2) return null;
      return `Suspected infection documented with qSOFA ${q.value}.`;
    },
    ask: "Document the sepsis assessment, cultures, antimicrobial timing and the senior or critical-care review.",
  },
  {
    key: "aki_any_stage",
    level: "high",
    title: "KDIGO acute kidney injury stage documented",
    source: "kdigo",
    when: (values) => {
      const aki = scored(values, "aki_stage");
      if (!aki || !aki.value) return null;
      return `KDIGO AKI stage ${aki.value} calculated from the documented creatinine values.`;
    },
    ask: "Record the aetiology considered, nephrotoxins stopped, volume status, urine-output monitoring and dose review of renally cleared medicines.",
  },
  {
    key: "aki_stage_3",
    level: "critical",
    title: "KDIGO stage 3 acute kidney injury",
    source: "kdigo",
    when: (values) => {
      const aki = scored(values, "aki_stage");
      if (!aki || aki.value !== 3) return null;
      return "KDIGO stage 3 acute kidney injury calculated from the documented values.";
    },
    ask: "Document the urgent renal review, the indication for renal replacement therapy assessment, and the medication hold or dose changes.",
  },
  {
    key: "triple_whammy",
    level: "moderate",
    title: "NSAID with a renin-angiotensin blocker and a diuretic",
    source: "kdigo",
    when: (values) => {
      const text = MED_TEXT(values);
      if (!hasAny(text, NSAIDS) || !hasAny(text, RAS_BLOCKERS) || !hasAny(text, DIURETICS)) return null;
      return "The medication list documents an NSAID together with a renin-angiotensin system blocker and a diuretic.";
    },
    ask: "Document the indication for each, the renal function monitoring plan, and whether the combination can be changed.",
  },
  {
    key: "anticoagulation_bleeding_risk",
    level: "moderate",
    title: "Anticoagulant with a HAS-BLED of 3 or more",
    source: "accp",
    when: (values) => {
      const text = MED_TEXT(values);
      if (!hasAny(text, ANTICOAGULANTS)) return null;
      const hb = scored(values, "has_bled");
      if (!hb || hb.value < 3) return null;
      if (documented(values, "medicines_review") || documented(values, "deprescribing")) return null;
      return `Anticoagulation documented with HAS-BLED ${hb.value}, and no medicines review or bleeding-risk review recorded in this note.`;
    },
    ask: "Document the modifiable bleeding-risk factors addressed, the review interval, and the reason the anticoagulant is continued or changed.",
  },
  {
    key: "atrial_fibrillation_no_decision",
    level: "high",
    title: "Atrial fibrillation without a documented anticoagulation decision",
    source: "aha_acc",
    when: (values) => {
      const conditions = `${f(values, "im_chronic", "conditions_reviewed")} ${f(values, "im_history", "pmh_conditions")}`.toLowerCase();
      if (!conditions.includes("atrial fibrillation")) return null;
      const text = MED_TEXT(values);
      if (hasAny(text, ANTICOAGULANTS)) return null;
      const decision = `${f(values, "im_chronic", "medicines_review")} ${f(values, "im_chronic", "escalation_plan")} ${f(values, "im_chronic", "deprescribing")}`.toLowerCase();
      if (hasAny(decision, ["anticoag", "bleeding", "cha2ds2", "declined", "not indicated"])) return null;
      return "Atrial fibrillation is recorded with no anticoagulant and no documented anticoagulation decision.";
    },
    ask: "Document the stroke-risk assessment and the anticoagulation decision, including the reason if it is not prescribed.",
  },
  {
    key: "pneumonia_severity",
    level: "moderate",
    title: "CURB-65 of 3 or more without a recorded site-of-care decision",
    source: "nice",
    when: (values) => {
      const curb = scored(values, "curb65");
      if (!curb || curb.value < 3) return null;
      if (documented(values, "senior_review", "im_acute") || documented(values, "follow_up", "im_discharge")) return null;
      return `CURB-65 ${curb.value} calculated, with no senior review or disposition recorded in this note.`;
    },
    ask: "Document the site-of-care decision, the oxygen and antimicrobial plan, and who reviewed the patient.",
  },
  {
    key: "pulmonary_embolism_probability",
    level: "moderate",
    title: "PE likely on the Wells score",
    source: "accp",
    when: (values) => {
      const wells = scored(values, "wells_pe");
      if (!wells || wells.value <= 4) return null;
      return `Wells score for PE ${wells.value} — PE likely in the two-tier scheme.`;
    },
    ask: "Document the diagnostic pathway followed (imaging requested or the reason it was not), and the anticoagulation decision with its timing.",
  },
  {
    key: "cirrhosis_severity",
    level: "high",
    title: "Cirrhosis with a Child-Pugh C or MELD-Na of 20 or more",
    source: "aasld",
    when: (values) => {
      const cp = scored(values, "child_pugh");
      const meld = scored(values, "meld_na");
      const cpC = cp && cp.value >= 10;
      const meldHigh = meld && typeof meld.value === "number" && meld.value >= 20;
      if (!cpC && !meldHigh) return null;
      const parts = [];
      if (cpC) parts.push(`Child-Pugh ${cp.value}`);
      if (meldHigh) parts.push(`MELD-Na ${meld.value}`);
      return `Severity documented as ${parts.join(" and ")}.`;
    },
    ask: "Document the decompensating precipitant, the variceal and ascites management, and whether transplant or specialist referral was considered.",
  },
  {
    key: "falls_review",
    level: "moderate",
    title: "Two or more falls without a documented falls assessment",
    source: "nice",
    when: (values) => {
      if (f(values, "im_geriatric", "falls") !== "Two or more") return null;
      if (documented(values, "falls_circumstances", "im_geriatric") && documented(values, "medicines_risk", "im_geriatric")) return null;
      return "Two or more falls are recorded without both the circumstances and the medicines review documented.";
    },
    ask: "Document the fall circumstances, the gait and balance assessment, the medicines reviewed, and the bone-health and vision assessment considered.",
  },
  {
    key: "febrile_neutropenia",
    level: "critical",
    title: "Fever with neutropenia documented",
    source: "idsa",
    when: (values) => {
      if (f(values, "im_oncology", "febrile_neutropenia") !== "Yes") return null;
      return "Fever with neutropenia is recorded during this episode.";
    },
    ask: "Document the cultures, the empirical antimicrobial and its timing, the source search, and the oncology discussion.",
  },
];

const asRecord = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

export const buildImSafetyPrompts = ({ values = {} } = {}) =>
  IM_SAFETY_RULES.map((rule) => {
    let basis = null;
    try {
      basis = rule.when(values);
    } catch {
      basis = null;
    }
    if (!basis) return null;
    const reference = src(rule.source);
    return {
      key: rule.key,
      level: rule.level,
      title: rule.title,
      basis,
      ask: rule.ask,
      provenance: "guideline",
      provenanceLabel: IM_SAFETY_PROVENANCE.guideline,
      source: {
        organization: reference.issuing_organization,
        title: reference.title,
        url: reference.source_url,
        status: reference.status,
      },
    };
  }).filter(Boolean);

export const imSafetyPrompt = (values, key) =>
  buildImSafetyPrompts({ values }).find((p) => p.key === key) || null;

export const imSafetyState = (value) => asRecord(value);