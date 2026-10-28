// Endocrinology safety prompts.
//
// Same contract as the ENT safety layer: a prompt appears only when the clinician
// selected a concern, or when a structured field in THIS note records something
// that carries it. Nothing is inferred from an unanswered field, nothing is
// defaulted to normal, and the text never diagnoses, prescribes or labels the
// patient — it records what was documented, the time-sensitivity, and the
// decision taken.
//
// Two kinds of rule, always distinguished in the note and in the PDF:
//   clinical_recommendation — the condition and its urgency are defined by a
//     guideline in src/lib/endocrineReferences.js.
//   local_triage_decision — no guideline in the register sets a numeric
//     threshold for this, so the threshold is an AMedix decision that requires
//     Endocrinology sign-off before it is relied on clinically.
//
// Thresholds that ARE guideline-defined are cited exactly:
//   ADA Standards of Care in Diabetes—2026 — hypoglycaemia Level 1 < 3.9 mmol/L
//   (70 mg/dL) and > 3.0 mmol/L (54 mg/dL); Level 2 < 3.0 mmol/L (54 mg/dL);
//   Level 3 severe (altered mental and/or physical status requiring assistance).

import { getEndocrineReference } from "@/lib/endocrineReferences";

const PROVENANCE = {
  clinical_recommendation: "Guideline-based clinical recommendation",
  local_triage_decision: "AMedix local triage decision — requires Endocrinology approval",
};

const sourceOf = (id) => {
  const r = getEndocrineReference(id);
  if (!r) return null;
  return {
    organization: r.short || r.organization,
    title: r.title,
    version: r.version,
    url: r.url,
    verified: r.status === "verified_on_official_site" ? "verified on official source" : r.status,
  };
};

const LEVEL_ORDER = { immediate: 0, same_day: 1, documented: 2 };

export const ENDOCRINE_SAFETY_CONCERNS = [
  {
    key: "dka_hhs",
    label: "Diabetic ketoacidosis, hyperosmolar hyperglycaemic state or a mixed state",
    level: "immediate",
    title: "Acute hyperglycaemic decompensation documented in this encounter",
    basis:
      "Diabetic ketoacidosis and hyperosmolar hyperglycaemic state are acute complications of diabetes (ICD-11 5A22 / 5A20) that carry substantial mortality if treatment is delayed. The ADA Standards of Care define the diagnostic criteria and the treatment setting; the urgency recorded here is an AMedix triage decision.",
    action:
      "Arrange immediate senior assessment and the agreed acute pathway — fluids, insulin and electrolyte monitoring as the treating team directs — and record who was contacted and when. Insulin and fluid orders are made by that team and are not prescribed by this note.",
    sourceId: "ada_standards_2026",
    provenance: "clinical_recommendation",
  },
  {
    key: "severe_hypoglycaemia",
    label: "Severe hypoglycaemia (Level 3) or a Level 2 event with clinical concern",
    level: "immediate",
    title: "Severe hypoglycaemia documented in this encounter",
    basis:
      "The ADA Standards of Care define Level 3 hypoglycaemia as an event with altered mental and/or physical status requiring assistance for recovery. It is a recognised emergency and predicts further severe events.",
    action:
      "Treat the episode according to the agreed local protocol, keep the patient under observation until recovery is documented, and record the glucose value, the treatment given and the response. Review the regimen rather than adjusting a dose in this note.",
    sourceId: "ada_standards_2026",
    provenance: "clinical_recommendation",
  },
  {
    key: "adrenal_crisis",
    label: "Suspected or documented adrenal crisis (adrenocortical insufficiency)",
    level: "immediate",
    title: "Adrenal crisis documented or suspected in this encounter",
    basis:
      "The Endocrine Society guideline on primary adrenal insufficiency defines adrenal crisis as the acute presentation of adrenocortical insufficiency, requiring immediate glucocorticoid treatment and fluid resuscitation. Delay is associated with high mortality.",
    action:
      "Arrange immediate senior assessment and the agreed emergency pathway. Record that the patient carries a steroid-alert card or equivalent, the dose and route used by the treating team, and who was contacted.",
    sourceId: "es_adrenal_insufficiency_2016",
    provenance: "clinical_recommendation",
  },
  {
    key: "thyroid_storm",
    label: "Thyroid storm / thyroid crisis",
    level: "immediate",
    title: "Thyroid crisis (thyroid storm) documented or suspected",
    basis:
      "ICD-11 classifies thyroid crisis as 5A02.5. The ATA guideline on thyrotoxicosis describes it as a decompensated thyrotoxic state, and neither the guideline nor this register defines a scoring threshold that the app may apply.",
    action:
      "Arrange immediate senior endocrine or critical-care assessment and record the documented features (fever, tachyarrhythmia, agitation or delirium, gastrointestinal or hepatic involvement), who was contacted and the decision taken. Treatment is not prescribed by this note.",
    sourceId: "ata_thyrotoxicosis_2016",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  {
    key: "myxoedema_coma",
    label: "Myxoedema coma / decompensated hypothyroidism",
    level: "immediate",
    title: "Myxoedema coma documented or suspected",
    basis:
      "ICD-11 classifies myxoedema coma as 5A00.21. The ATA hypothyroidism guideline addresses severe hypothyroidism but sets no threshold for the decompensated state, so the urgency recorded here is an AMedix triage decision.",
    action:
      "Arrange immediate senior assessment with airway, temperature and glucose attention as the treating team directs, and record the documented features and who was contacted.",
    sourceId: "ata_hypothyroidism_2014",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  {
    key: "pituitary_apoplexy",
    label: "Pituitary apoplexy or acute pituitary failure",
    level: "immediate",
    title: "Pituitary apoplexy documented or suspected",
    basis:
      "No guideline in this register defines pituitary apoplexy. Acute haemorrhage or infarction of a pituitary lesion is a recognised emergency with sudden headache, visual loss and hormonal failure; the urgency recorded here is an AMedix triage decision.",
    action:
      "Arrange immediate senior endocrine and neurosurgical assessment, record the documented visual and neurological findings, whether glucocorticoid cover was given by the treating team, and who was contacted.",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  {
    key: "severe_hypercalcaemia",
    label: "Severe hypercalcaemia",
    level: "immediate",
    title: "Severe hypercalcaemia documented in this encounter",
    basis:
      "No guideline in this register sets a numeric severity threshold for hypercalcaemia that AMedix may apply automatically. Severe hypercalcaemia is a recognised emergency, and the threshold used here is an AMedix local triage decision requiring Endocrinology approval.",
    action:
      "Arrange same-day senior assessment with the agreed pathway, and record the calcium value, whether it was albumin-corrected, the symptoms documented, and who was contacted.",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  {
    key: "severe_hyponatraemia",
    label: "Severe hyponatraemia",
    level: "immediate",
    title: "Severe hyponatraemia documented in this encounter",
    basis:
      "Hyponatraemia may be classified as 5C72, but no guideline in this register gives a numeric threshold that the app may apply. The threshold used here is an AMedix local triage decision requiring Endocrinology approval; the correction rate is never prescribed by the app.",
    action:
      "Arrange same-day senior assessment, record the sodium value, the samples sent (serum and urine osmolality where taken) and who was contacted. The correction rate is set by the treating team, not by this note.",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  {
    key: "suspected_phaeochromocytoma",
    label: "Suspected catecholamine excess / phaeochromocytoma or paraganglioma",
    level: "same_day",
    title: "Catecholamine excess suspected — drug and imaging safety before intervention",
    basis:
      "No guideline in this register covers phaeochromocytoma. A catecholamine-secreting tumour is a recognised cause of hypertensive crisis, and unopposed alpha-blockade or contrast without preparation can precipitate one; this is an AMedix local decision.",
    action:
      "Document the biochemical evidence requested and the planned assessment, flag the suspicion prominently for any team undertaking imaging, biopsy or surgery, and record who was informed. No blockade regimen is prescribed here.",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  {
    key: "other_serious",
    label: "Other serious endocrine concern identified clinically",
    level: "documented",
    title: "Other serious endocrine concern documented in this encounter",
    basis: "Recorded by the clinician; no automatic rule applies to this entry.",
    action: "Record the finding, the action taken and who was contacted.",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
];

const CONCERN_PROMPTS = ENDOCRINE_SAFETY_CONCERNS.map((c) => ({
  key: c.key,
  level: c.level,
  title: c.title,
  basis: c.basis,
  action: c.action,
  source: c.sourceId ? sourceOf(c.sourceId) : null,
  provenance: c.provenance,
  approvalRequired: Boolean(c.approvalRequired),
}));

// Numeric parsing that never guesses: a value that is not a number is ignored.
const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", ".").replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const pick = (values, key) =>
  values && values[key] !== undefined && values[key] !== null ? values[key] : null;
const text = (values, key) => String(pick(values, key) || "").trim();

// Prompts that only a documented finding can raise.
const DERIVED_ONLY = {
  severe_hypoglycaemia_level3: {
    level: "immediate",
    title: "Hypoglycaemia recorded at Level 3 (severe)",
    basis:
      "The ADA Standards of Care define Level 3 hypoglycaemia as an event with altered mental and/or physical status requiring assistance for recovery.",
    action:
      "Record the glucose value, the treatment given and the response, keep the patient under observation until recovery is documented, and review the regimen with the patient before the next dose.",
    sourceId: "ada_standards_2026",
    provenance: "clinical_recommendation",
  },
  level2_hypoglycaemia: {
    level: "same_day",
    title: "Clinically significant (Level 2) hypoglycaemia recorded",
    basis:
      "The ADA Standards of Care define Level 2 hypoglycaemia as < 3.0 mmol/L (54 mg/dL). Repeated Level 2 events indicate that the regimen or the monitoring approach needs review.",
    action:
      "Record the number of events, the glucose values and the treatment used, and review the regimen and the education given at this visit.",
    sourceId: "ada_standards_2026",
    provenance: "clinical_recommendation",
  },
  dka_hhs_documented: {
    level: "immediate",
    title: "Acute diabetes decompensation recorded in the structured fields",
    basis:
      "Ketoacidosis and hyperosmolar hyperglycaemic state are acute complications of diabetes (ICD-11 5A22 / 5A20). The ADA Standards of Care define their diagnostic criteria and treatment setting.",
    action:
      "Confirm the treating team and the pathway in use, and record who was contacted and when. Insulin, fluid and electrolyte orders are made by that team.",
    sourceId: "ada_standards_2026",
    provenance: "clinical_recommendation",
  },
  biochemical_hypoglycaemia: {
    level: "immediate",
    title: "Glucose at this visit is in the Level 2 hypoglycaemia range",
    basis:
      "The ADA Standards of Care define Level 2 hypoglycaemia as a glucose concentration < 3.0 mmol/L (54 mg/dL), however symptomatic the patient is.",
    action:
      "Confirm the value and the patient's clinical state, treat according to the agreed local protocol, and record the response.",
    sourceId: "ada_standards_2026",
    provenance: "clinical_recommendation",
  },
  severe_dyskalaemia: {
    level: "immediate",
    title: "Severe potassium abnormality documented in this encounter",
    basis:
      "No guideline in this register sets a potassium threshold that AMedix may apply. Both severe hyperkalaemia and severe hypokalaemia are recognised causes of arrhythmia; the thresholds used here are AMedix local triage decisions requiring Endocrinology approval.",
    action:
      "Arrange same-day senior assessment, record the potassium value, whether the sample was haemolysed or repeated, and who was contacted. Treatment is set by the treating team.",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  severe_hyponatraemia_documented: {
    level: "immediate",
    title: "Severe hyponatraemia documented in this encounter",
    basis:
      "Hyponatraemia may be classified as 5C72, but no guideline in this register gives a numeric threshold that the app may apply. The threshold used here is an AMedix local triage decision requiring Endocrinology approval.",
    action:
      "Arrange same-day senior assessment, record the sodium value and the samples sent, and who was contacted. The correction rate is never prescribed by the app.",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  hypercalcaemia_review: {
    level: "same_day",
    title: "Corrected calcium in the hypercalcaemia range — same-day review",
    basis:
      "No guideline in this register sets a calcium threshold that AMedix may apply. The thresholds used here are AMedix local triage decisions requiring Endocrinology approval.",
    action:
      "Record the corrected calcium, whether the sample was repeated, the symptoms documented and who was contacted. Do not treat a single value as a diagnosis.",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  thyrotoxicosis_documented: {
    level: "same_day",
    title: "Overt thyrotoxicosis documented — aetiology and treatment decision required",
    basis:
      "The ATA guideline on thyrotoxicosis separates thyrotoxicosis from hyperthyroidism and requires the aetiology to be established before a treatment decision is made.",
    action:
      "Record the aetiology being pursued and the treatment decision (antithyroid drug, radioiodine, surgery, observation), and arrange the review that decision requires.",
    sourceId: "ata_thyrotoxicosis_2016",
    provenance: "clinical_recommendation",
  },
  thyroid_in_pregnancy: {
    level: "documented",
    title: "Thyroid disease documented during pregnancy or the postpartum period",
    basis:
      "The ATA guideline on thyroid disease in pregnancy states that thyroid function tests are interpreted differently in pregnancy and that management thresholds change.",
    action:
      "Record the pregnancy or postpartum status with the thyroid status, and the pregnancy-specific review arranged. No pregnancy dose rule is applied by the app.",
    sourceId: "ata_pregnancy_2017",
    provenance: "clinical_recommendation",
  },
  thyroid_malignancy_documented: {
    level: "documented",
    title: "Cytology reported as malignant — the surgical pathway is documented, not assumed",
    basis:
      "The ATA guideline on thyroid nodules and differentiated thyroid cancer bases management on the sonographic risk category and the cytology result.",
    action:
      "Record the cytology category, the nodule size and the surgical or multidisciplinary discussion arranged, and who is responsible for the next step.",
    sourceId: "ata_thyroid_nodules_2015",
    provenance: "clinical_recommendation",
  },
  advanced_ckd_medication_review: {
    level: "documented",
    title: "Advanced chronic kidney disease documented — glucose-lowering therapy needs review",
    basis:
      "The KDIGO guideline on diabetes management in CKD relates the choice and continuation of glucose-lowering therapy to the eGFR.",
    action:
      "Record that the current agents were reviewed against the recorded kidney function, and the monitoring interval set. The app does not compute a dose adjustment.",
    sourceId: "kdigo_diabetes_ckd_2022",
    provenance: "clinical_recommendation",
  },
  steroid_stress_dose_not_documented: {
    level: "documented",
    title: "Discharge without documented stress-dose instructions",
    basis:
      "The Endocrine Society guideline on primary adrenal insufficiency requires patients on glucocorticoid replacement to carry instructions for intercurrent illness and emergency dosing.",
    action:
      "Record the stress-dose and sick-day instructions given, or state explicitly why they do not apply. Nothing is generated for the patient by the app.",
    sourceId: "es_adrenal_insufficiency_2016",
    provenance: "clinical_recommendation",
  },
  sick_day_rules_not_documented: {
    level: "documented",
    title: "Self-management education recorded without sick-day rules",
    basis:
      "The ADA Standards of Care and the Endocrine Society adrenal insufficiency guideline both treat sick-day guidance as part of a complete care plan for a patient on glucose-lowering or glucocorticoid therapy.",
    action:
      "Record whether sick-day rules were given, and if not, whether they were declined or are not applicable.",
    sourceId: "ada_standards_2026",
    provenance: "clinical_recommendation",
  },
};

const FROM_VALUES = [
  // ADA hypoglycaemia level, recorded as a structured choice.
  (v) => {
    const level = text(v, "hypoglycaemia_level");
    if (!level) return null;
    if (/^Level 3/.test(level))
      return { key: "severe_hypoglycaemia_level3", evidence: `Hypoglycaemia level recorded: ${level}` };
    if (/^Level 2/.test(level))
      return { key: "level2_hypoglycaemia", evidence: `Hypoglycaemia level recorded: ${level}` };
    return null;
  },
  // Acute decompensation recorded as a structured choice.
  (v) => {
    const state = text(v, "acute_decompensation");
    if (!state) return null;
    if (
      /^(Diabetic ketoacidosis|Hyperosmolar hyperglycaemic state|Mixed ketoacidosis and hyperosmolar state)$/.test(
        state
      )
    )
      return { key: "dka_hhs_documented", evidence: `Acute state recorded: ${state}` };
    return null;
  },
  // ADA Level 2 threshold — a measured glucose below 3.0 mmol/L.
  (v) => {
    const g = num(pick(v, "fasting_glucose"));
    if (g === null || g >= 3.0) return null;
    return { key: "biochemical_hypoglycaemia", evidence: `Glucose documented: ${g} mmol/L` };
  },
  // Potassium — AMedix local thresholds, flagged for approval.
  (v) => {
    const k = num(pick(v, "potassium"));
    if (k === null) return null;
    if (k > 6.0 || k < 2.5)
      return { key: "severe_dyskalaemia", evidence: `Potassium documented: ${k} mmol/L` };
    return null;
  },
  // Sodium.
  (v) => {
    const na = num(pick(v, "sodium"));
    if (na === null || na >= 120) return null;
    return { key: "severe_hyponatraemia_documented", evidence: `Sodium documented: ${na} mmol/L` };
  },
  // Corrected calcium.
  (v) => {
    const ca = num(pick(v, "corrected_calcium"));
    if (ca === null) return null;
    if (ca > 3.5)
      return {
        key: "severe_hypercalcaemia",
        evidence: `Corrected calcium documented: ${ca} mmol/L`,
      };
    if (ca >= 3.0)
      return { key: "hypercalcaemia_review", evidence: `Corrected calcium documented: ${ca} mmol/L` };
    return null;
  },
  // Thyroid status.
  (v) => {
    const status = text(v, "thyroid_status");
    if (status !== "Overt thyrotoxicosis") return null;
    return { key: "thyrotoxicosis_documented", evidence: `Thyroid status recorded: ${status}` };
  },
  // Pregnancy / postpartum in a thyroid note.
  (v) => {
    const status = text(v, "pregnancy_status");
    if (status !== "Pregnant" && status !== "Postpartum") return null;
    return { key: "thyroid_in_pregnancy", evidence: `Pregnancy status recorded: ${status}` };
  },
  // Nodule cytology.
  (v) => {
    const cyto = text(v, "fna_bethesda");
    if (!/^VI/.test(cyto)) return null;
    return { key: "thyroid_malignancy_documented", evidence: `Cytology recorded: ${cyto}` };
  },
  // Kidney function.
  (v) => {
    if (text(v, "ckd_status") !== "CKD G4–G5") return null;
    return { key: "advanced_ckd_medication_review", evidence: "CKD stage recorded: CKD G4–G5" };
  },
  // Care-plan and discharge completeness.
  (v) => {
    if (text(v, "steroid_stress_dose_advice") !== "Not documented") return null;
    return {
      key: "steroid_stress_dose_not_documented",
      evidence: "Stress-dose advice: not documented",
    };
  },
  (v) => {
    if (text(v, "sick_day_rules") !== "Not documented") return null;
    return { key: "sick_day_rules_not_documented", evidence: "Sick-day rules: not documented" };
  },
];

const basePrompt = (key, overrides = {}) => {
  const concern = CONCERN_PROMPTS.find((p) => p.key === key);
  const derived = DERIVED_ONLY[key];
  const spec = concern || (derived ? { key, ...derived } : null);
  if (!spec) return null;
  return {
    key,
    level: spec.level,
    title: spec.title,
    basis: spec.basis,
    action: spec.action,
    provenance: spec.provenance,
    approvalRequired: Boolean(spec.approvalRequired),
    source: spec.source || (spec.sourceId ? sourceOf(spec.sourceId) : null),
    ...overrides,
  };
};

// Builds the prompts for this encounter. `concerns` are the ones the clinician
// selected; `values` is the note being written. Nothing is inferred from an
// unanswered field.
export function buildEndocrineSafetyPrompts({ concerns = [], values = {} } = {}) {
  const map = new Map();
  const push = (prompt, evidence) => {
    if (!prompt) return;
    const existing = map.get(prompt.key);
    if (existing) {
      if (evidence && !existing.evidence.includes(evidence)) existing.evidence.push(evidence);
      if (prompt.title) existing.title = prompt.title;
      return;
    }
    map.set(prompt.key, { ...prompt, evidence: evidence ? [evidence] : [] });
  };

  (concerns || []).forEach((key) => {
    const prompt = basePrompt(key);
    if (prompt) push(prompt, "Selected in this encounter");
  });

  FROM_VALUES.forEach((rule) => {
    const found = rule(values || {});
    if (!found) return;
    const prompt = basePrompt(found.key, found.title ? { title: found.title } : {});
    if (prompt) push(prompt, found.evidence);
  });

  return [...map.values()].sort(
    (a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9)
  );
}

// Readable text stored with the note and printed in the PDF. The prompts that
// fired are stored with the note, so the saved record shows exactly what the
// clinician was shown rather than a recalculation from later edits.
export function formatEndocrineSafety(value) {
  if (!value || typeof value !== "object") return "";
  const stored = Array.isArray(value.resolved) ? value.resolved : [];
  const actions = value.actions || {};
  const lines = [];

  if (stored.length === 0 && !String(value.other_concern || "").trim()) {
    lines.push(
      "No safety prompt triggered by the findings documented in this note — this is not a statement that no urgent problem exists."
    );
  } else {
    lines.push(`Safety prompts documented at the time of this note (${stored.length}):`);
    stored.forEach((p) => {
      const action = String(actions[p.key] || "").trim();
      lines.push(
        `[${p.level === "immediate" ? "ACT NOW" : p.level === "same_day" ? "SAME DAY" : "DOCUMENT"}] ${p.title}`
      );
      if (p.evidence && p.evidence.length) lines.push(`   Documented: ${p.evidence.join("; ")}`);
      lines.push(`   Basis: ${p.basis}`);
      if (p.source)
        lines.push(
          `   Source: ${p.source.organization} — ${p.source.title}, ${p.source.version} (${p.source.url}; ${p.source.verified})`
        );
      if (p.provenanceLabel) lines.push(`   Rule type: ${p.provenanceLabel}`);
      lines.push(`   Action taken: ${action || "NOT DOCUMENTED"}`);
    });
  }

  if (String(value.other_concern || "").trim())
    lines.push(`Other safety concern: ${String(value.other_concern).trim()}`);
  if (String(value.triage || "").trim()) lines.push(`Decision taken: ${String(value.triage).trim()}`);
  if (String(value.escalation || "").trim())
    lines.push(`Escalation and documented action: ${String(value.escalation).trim()}`);
  lines.push(
    "Clinical judgement remains with the treating clinician. These prompts do not diagnose, prescribe or order any test."
  );
  return lines.join("\n");
}

// Rules whose wording or timing needs a qualified Endocrinology clinician to sign
// off before they are relied on in practice.
export const ENDOCRINE_SAFETY_APPROVAL_REQUIRED = [
  ...CONCERN_PROMPTS.filter((p) => p.approvalRequired).map((p) => p.key),
  ...Object.entries(DERIVED_ONLY)
    .filter(([, r]) => r.approvalRequired)
    .map(([key]) => key),
];

export const ENDOCRINE_SAFETY_PROVENANCE = PROVENANCE;