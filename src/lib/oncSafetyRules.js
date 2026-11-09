// Oncology — advisory safety prompts.
//
// Each prompt compares what the note actually recorded with the requirement of the
// cited document. It states what was documented, the requirement it addresses and the
// source. It never diagnoses, never stages, never orders treatment and never changes a
// diagnosis. Nothing here blocks saving the note.
//
// WHERE THE NUMBERS COME FROM
//   · The record's own structured fields — the CTCAE block (counts, temperature,
//     calcium), the vital signs field, the treatment block (agents, cumulative dose,
//     documented risk features) and the documented instrument inputs.
//   · Nothing is parsed out of free text, nothing is estimated, and a value that was
//     not measured is never read as normal.
//
// A rule fires only from values that were documented. A blank is never treated as a
// negative finding, and a prompt is not a statement that the condition is present.

import { oncBlockValues } from "@/lib/oncBlocks";
import { calculateOncScore, oncScoreInputs } from "@/lib/oncScores";
import { ONC_REFERENCES } from "@/lib/oncReferences";
import { asObject, str, num, isBlank } from "@/lib/fmFieldKit";

export const ONC_SAFETY_PROVENANCE = {
  guideline: "Guideline requirement",
  local: "AMedix local decision — not a guideline claim",
};

const src = (key) => ONC_REFERENCES[key] || ONC_REFERENCES.nccn;

const bv = (values, block) => oncBlockValues(values, block);
const f = (values, block, field) => str(bv(values, block)[field]);
const arr = (values, block, field) => {
  const raw = bv(values, block)[field];
  if (Array.isArray(raw)) return raw.filter(Boolean).map((x) => String(x));
  return str(raw) ? [str(raw)] : [];
};
const has = (values, block, field, needle) =>
  arr(values, block, field).some((v) => v.toLowerCase().includes(String(needle).toLowerCase()));
const gradeAtLeast = (values, field, grade) => {
  const g = f(values, "onc_ctcae", field);
  const m = g.match(/grade\s*([1-5])/i);
  return !!m && Number(m[1]) >= grade;
};

// The vital signs field is stored as the readable summary the note view and the PDF
// already render ("Temperature: 38.4 °C · Pulse: 104 bpm · …"). Only measured values
// are present.
const vitalsTemperature = (values) => {
  const raw = typeof asObject(values).vitals === "string" ? asObject(values).vitals : "";
  if (!raw) return null;
  const match = raw.match(/temperature[^:]*:\s*([\d.]+)/i);
  const n = match ? Number(match[1]) : null;
  return Number.isFinite(n) ? n : null;
};

const egfr = (values) => {
  const result = calculateOncScore("egfr", oncScoreInputs(values, "onc_scores", "egfr"));
  if (!result || result.missing?.length) return null;
  const n = Number(String(result.value).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export const ONC_SAFETY_RULES = [
  {
    key: "febrile_neutropenia",
    level: "urgent",
    title: "Febrile neutropenia documented",
    when: (values) => {
      const temp = num(bv(values, "onc_ctcae").temperature);
      const anc = num(bv(values, "onc_ctcae").anc);
      const measured = temp !== null ? temp : vitalsTemperature(values);
      if (measured === null || measured < 38) return null;
      const febrile = gradeAtLeast(values, "febrile_neutropenia_grade", 1);
      if (anc === null && !febrile) return null;
      if (anc !== null && anc >= 1 && !febrile) return null;
      return `A temperature of ${measured} °C is documented${anc !== null ? ` with an absolute neutrophil count of ${anc} ×10⁹/L` : " with febrile neutropenia documented"} — this meets the definition of febrile neutropenia and is an oncological emergency.`;
    },
    ask: "Record the same-day assessment, the cultures and blood counts taken, the antimicrobial treatment started and the clinician who reviewed the patient.",
    source: "ctcae",
  },
  {
    key: "grade3_neutropenia",
    level: "attention",
    title: "Severe neutropenia recorded",
    when: (values) => {
      const anc = num(bv(values, "onc_ctcae").anc);
      if (anc !== null && anc < 1) return `An absolute neutrophil count of ${anc} ×10⁹/L is documented.`;
      if (gradeAtLeast(values, "neutropenia_grade", 3)) return `Neutropenia is documented as ${f(values, "onc_ctcae", "neutropenia_grade")}.`;
      return null;
    },
    ask: "Document whether the next cycle is proceeding, delayed or reduced, and the growth-factor decision — the dose decision stays with the treating clinician.",
    source: "ctcae",
  },
  {
    key: "thrombocytopenia_bleeding",
    level: "attention",
    title: "Significant thrombocytopenia recorded",
    when: (values) => {
      const plt = num(bv(values, "onc_ctcae").platelets);
      if (plt !== null && plt < 50) return `A platelet count of ${plt} ×10⁹/L is documented.`;
      if (gradeAtLeast(values, "thrombocytopenia_grade", 3)) return `Thrombocytopenia is documented as ${f(values, "onc_ctcae", "thrombocytopenia_grade")}.`;
      return null;
    },
    ask: "Document bleeding assessment, any planned procedure and the transfusion or delay decision taken.",
    source: "ctcae",
  },
  {
    key: "cord_compression",
    level: "urgent",
    title: "Possible malignant spinal cord compression",
    when: (values) => {
      const back = has(values, "onc_assessment", "symptoms_reported", "back pain");
      const neuro = has(values, "onc_assessment", "symptoms_reported", "new neurological deficit");
      if (!back || !neuro) return null;
      return "Back pain together with a new neurological deficit is documented in a patient with cancer — this is the presentation that requires urgent assessment for malignant spinal cord compression.";
    },
    ask: "Document the neurological examination, the urgency of the requested assessment, the steroid and analgesia decision, and who was informed.",
    source: "nccn",
  },
  {
    key: "svco",
    level: "urgent",
    title: "Possible superior vena cava obstruction",
    when: (values) => {
      if (!has(values, "onc_assessment", "symptoms_reported", "facial swelling")) return null;
      return "Facial swelling / plethora is documented in a patient with cancer — a presentation that requires urgent assessment for superior vena cava obstruction.";
    },
    ask: "Document the clinical assessment, the urgency, the treatment decision and the clinician informed.",
    source: "nccn",
  },
  {
    key: "hypercalcaemia",
    level: "urgent",
    title: "Hypercalcaemia documented",
    when: (values) => {
      const ca = num(bv(values, "onc_ctcae").corrected_calcium);
      if (ca === null || ca < 3.0) return null;
      return `An albumin-corrected calcium of ${ca} mmol/L is documented — a grade 3 or worse hypocalcaemia-scale abnormality on CTCAE grading that requires same-day clinical review.`;
    },
    ask: "Document the clinical assessment, the fluid and treatment decision, and the clinician who reviewed the result.",
    source: "ctcae",
  },
  {
    key: "tumour_lysis",
    level: "attention",
    title: "Tumour lysis risk features documented",
    when: (values) => {
      const features = arr(values, "onc_treatment", "tls_risk_features").filter((x) => !/none documented/i.test(x));
      if (!features.length) return null;
      return `Documented risk features: ${features.join(", ")}.`;
    },
    ask: "Document the prophylaxis, hydration and monitoring plan agreed with the treating team, and the bloods requested.",
    source: "nccn",
  },
  {
    key: "extravasation",
    level: "urgent",
    title: "Extravasation documented",
    when: (values) => {
      const yes = /^yes$/i.test(f(values, "onc_ctcae", "extravasation"));
      return yes ? "Extravasation is documented at this encounter." : null;
    },
    ask: "Document the site, the agent involved, the immediate management given and the clinician informed.",
    source: "asco",
  },
  {
    key: "immune_related_event",
    level: "attention",
    title: "Immune-related adverse event documented",
    when: (values) => {
      const onImmunotherapy = has(values, "onc_treatment", "modalities", "immunotherapy");
      if (!onImmunotherapy) return null;
      const type = f(values, "onc_ctcae", "irae_type");
      const graded = gradeAtLeast(values, "irae_grade", 2);
      if (!type && !graded) return null;
      return `Immunotherapy is documented${type ? ` with an immune-related event recorded as ${type}` : ""}${graded ? ` (${f(values, "onc_ctcae", "irae_grade")})` : ""}.`;
    },
    ask: "Document the assessment, whether treatment was held, and the management agreed — immune-related events are managed on the treating team's protocol.",
    source: "nccn",
  },
  {
    key: "anthracycline_monitoring",
    level: "attention",
    title: "Cumulative anthracycline dose recorded",
    when: (values) => {
      const dose = num(bv(values, "onc_treatment").anthracycline_cumulative_dose);
      if (dose === null || dose < 550) return null;
      const agent = f(values, "onc_treatment", "anthracycline_agent") || "an anthracycline";
      return `A cumulative dose of ${dose} mg/m² of ${agent} is documented, at or above the conventional doxorubicin-equivalent monitoring threshold.`;
    },
    ask: "Document the cardiac function assessment and the decision on further anthracycline, made by the treating clinician.",
    source: "esmo",
  },
  {
    key: "platinum_renal",
    level: "attention",
    title: "Nephrotoxic platinum with reduced renal function",
    when: (values) => {
      const regimen = `${f(values, "onc_treatment", "regimen_protocol")} ${f(values, "onc_treatment", "agents")}`;
      if (!/cisplatin/i.test(regimen)) return null;
      const value = egfr(values);
      if (value === null || value >= 60) return null;
      return `Cisplatin is documented with an eGFR of ${value} mL/min/1.73 m².`;
    },
    ask: "Document the renal assessment, the hydration plan and the dose decision taken by the treating clinician.",
    source: "nccn",
  },
  {
    key: "hepatitis_b_reactivation",
    level: "attention",
    title: "Hepatitis B positive with a B-cell–depleting regimen",
    when: (values) => {
      const status = f(values, "onc_assessment", "hbv_status");
      if (!/^positive/i.test(status)) return null;
      const documented = /^yes/i.test(f(values, "onc_treatment", "b_cell_depleting"));
      const regimen = `${f(values, "onc_treatment", "regimen_protocol")} ${f(values, "onc_treatment", "agents")}`;
      if (!documented && !/rituximab|obinutuzumab|anti-cd20/i.test(regimen)) return null;
      return `Hepatitis B is documented as ${status} and the treatment includes a B-cell–depleting agent${documented ? "" : " (recorded in the regimen)"}.`;
    },
    ask: "Document the antiviral prophylaxis decision and the monitoring plan agreed with the treating team.",
    source: "nccn",
  },
  {
    key: "fertility_preservation",
    level: "consideration",
    title: "Gonadotoxic treatment in a patient of reproductive potential",
    when: (values) => {
      if (!/^yes$/i.test(f(values, "onc_assessment", "reproductive_age"))) return null;
      const systemic = has(values, "onc_treatment", "modalities", "chemotherapy") || has(values, "onc_treatment", "modalities", "radiotherapy");
      if (!systemic) return null;
      return "The patient is documented as of reproductive potential and gonadotoxic treatment is documented.";
    },
    ask: "Document whether fertility preservation and contraception were discussed, offered or declined.",
    source: "asco",
  },
  {
    key: "stage_not_assignable",
    level: "attention",
    title: "Treatment documented while the stage cannot be assigned",
    when: (values) => {
      const curative = /^(curative|adjuvant|neoadjuvant|definitive chemoradiotherapy)$/i.test(f(values, "onc_treatment", "treatment_intent"));
      if (!curative) return null;
      const stage = f(values, "onc_staging", "stage_confirmation");
      if (!/cannot be assigned|provisional/i.test(stage)) return null;
      const missing = f(values, "onc_staging", "incomplete_information");
      return `Treatment intent is documented as ${f(values, "onc_treatment", "treatment_intent")} while the stage is recorded as ${stage}${missing ? ` (missing: ${missing})` : ""}.`;
    },
    ask: "Document the staging assessment completed before treatment, or the clinician's recorded reason for proceeding without it.",
    source: "ajcc",
  },
  {
    key: "mucositis_support",
    level: "attention",
    title: "Severe mucositis recorded",
    when: (values) => (gradeAtLeast(values, "mucositis_grade", 3) ? `Mucositis is documented as ${f(values, "onc_ctcae", "mucositis_grade")}.` : null),
    ask: "Document oral care, analgesia, nutritional support and the hydration assessment made at this encounter.",
    source: "ctcae",
  },
];

export const buildOncSafetyPrompts = ({ values = {} } = {}) =>
  ONC_SAFETY_RULES.map((rule) => {
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
      provenanceLabel: ONC_SAFETY_PROVENANCE.guideline,
      source: {
        organization: reference.issuing_organization,
        title: reference.title,
        url: reference.source_url,
        status: reference.status,
      },
    };
  }).filter(Boolean);

export const oncSafetyPrompt = (values, key) => buildOncSafetyPrompts({ values }).find((p) => p.key === key) || null;

export const oncSafetyState = (value) => asObject(value);

export const oncSafetyUnresolved = (value) => {
  const state = asObject(value);
  const resolved = Array.isArray(state.resolved) ? state.resolved : [];
  const actions = asObject(state.actions);
  const notApplicable = asObject(state.not_applicable);
  return resolved.filter((p) => isBlank(actions[p.key]) && isBlank(notApplicable[p.key]));
};