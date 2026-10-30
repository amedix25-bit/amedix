// Cardiology decision support.
//
// Same contract as the Endocrine and ENT safety layers: a prompt appears only
// when the clinician selected a concern in this encounter, or when a structured
// field IN THIS NOTE records a finding that raises it. Nothing is inferred from
// an unanswered field, nothing is defaulted to stable, and no prompt diagnoses,
// prescribes or orders anything — it records what was documented, the
// time-sensitivity defined by the cited guideline, and the decision the clinician
// took. Urgent care is never delayed for documentation.
//
// Two rule types, always distinguished in the note and in the PDF:
//   clinical_recommendation — the condition and its urgency come from a guideline
//     registered in src/lib/cardiologyReferences.js.
//   local_decision — no registered guideline sets this exact wording or interval,
//     so the prompt is an AMedix decision that requires Cardiology sign-off before
//     it is relied on clinically.
//
// Numbers that ARE guideline-defined are quoted as published, with the guideline
// that defines them. Nothing here re-collects a laboratory result or a vital sign:
// troponin, potassium, creatinine, blood pressure and the ECG report live in the
// shared record and in the note's own fields, so a rule reads only the clinical
// classification the clinician documented.

import { getCardiologyReference } from "@/lib/cardiologyReferences";

export const CARDIOLOGY_SAFETY_PROVENANCE = {
  clinical_recommendation: "Guideline-based clinical recommendation",
  local_decision: "AMedix local decision — requires Cardiology approval",
};

const sourceOf = (id) => {
  const r = getCardiologyReference(id);
  if (!r) return null;
  return {
    organization: r.short || r.organization,
    title: r.title,
    version: r.version,
    url: r.url,
  };
};

const LEVEL_ORDER = { immediate: 0, same_day: 1, documented: 2 };

const text = (v, key) => String((v || {})[key] ?? "").trim();

// ---- Prompts the clinician can select in this encounter --------------------
export const CARDIOLOGY_SAFETY_CONCERNS = [
  {
    key: "suspected_acs",
    label: "Suspected or confirmed acute coronary syndrome",
    level: "immediate",
    title: "Acute coronary syndrome documented in this encounter",
    basis:
      "Acute coronary syndrome is time-critical: the ESC and ACC/AHA ACS guidelines define the diagnostic pathway and the timing of reperfusion, and outcomes depend on how quickly it is started.",
    action:
      "Confirm the 12-lead ECG time, the first cardiac biomarker and the antithrombotic treatment given, and record which reperfusion or ischaemia-guided pathway was chosen and by whom. Treatment and transfer decisions are made by the treating team, not by this note.",
    sourceId: "esc_acs_2023",
    provenance: "clinical_recommendation",
  },
  {
    key: "cardiogenic_shock",
    label: "Cardiogenic shock or severe haemodynamic compromise",
    level: "immediate",
    title: "Cardiogenic shock or haemodynamic compromise documented",
    basis:
      "Cardiogenic shock carries very high mortality and requires immediate senior and critical-care involvement together with urgent revascularisation assessment.",
    action:
      "Escalate now to the senior cardiologist and critical care, record the perfusion findings, the vasoactive support and inotrope decisions made by that team, and record the timing of the discussion and the outcome.",
    sourceId: "esc_hf_2021",
    provenance: "clinical_recommendation",
  },
  {
    key: "acute_hf_decompensation",
    label: "Acute heart failure decompensation",
    level: "same_day",
    title: "Acute heart failure decompensation documented",
    basis:
      "The ESC and ACC/AHA/HFSA heart-failure guidelines separate acute from chronic management and define the discharge and follow-up requirements that reduce readmission.",
    action:
      "Record the congestion findings, the diuretic and vasodilator decisions made, the precipitant identified, and the follow-up arranged — the heart-failure guidelines require early review after a decompensation.",
    sourceId: "acc_aha_hfsa_hf_2022",
    provenance: "clinical_recommendation",
  },
  {
    key: "hypertensive_emergency",
    label: "Hypertensive emergency or suspected secondary hypertension",
    level: "immediate",
    title: "Severe blood pressure elevation with clinical concern documented",
    basis:
      "ESC and ACC/AHA hypertension guidance distinguishes severe blood-pressure elevation without acute target-organ injury from a hypertensive emergency, where controlled blood-pressure reduction and inpatient assessment are required.",
    action:
      "Record the target-organ assessment made, the blood-pressure reduction actually given and the monitoring in place, and who was informed. Treatment decisions belong to the treating team.",
    sourceId: "esc_hypertension_2024",
    provenance: "clinical_recommendation",
  },
  {
    key: "high_risk_syncope",
    label: "Syncope with a high-risk feature",
    level: "immediate",
    title: "Syncope with a documented high-risk feature",
    basis:
      "The ESC syncope guideline and the ACC/AHA/HRS syncope guideline define the features — structural heart disease, an abnormal ECG, syncope during exertion or supine, injury, or a family history of sudden death — that require in-hospital evaluation.",
    action:
      "Document the features present, the monitoring arranged and the admission or early-review decision taken, together with the advice given about driving and about recurrence.",
    sourceId: "esc_syncope_2018",
    provenance: "clinical_recommendation",
  },
  {
    key: "ventricular_arrhythmia",
    label: "Ventricular tachycardia, ventricular fibrillation or aborted cardiac arrest",
    level: "immediate",
    title: "Ventricular tachyarrhythmia documented",
    basis:
      "Sustained ventricular tachyarrhythmia and aborted cardiac arrest require immediate assessment, correction of reversible causes and structured evaluation for sudden-death risk.",
    action:
      "Record the rhythm, the treatment delivered, the reversible causes assessed and the monitoring in place, and record who was escalated to. Device and ablation decisions are made by the arrhythmia service.",
    sourceId: "esc_cardiomyopathy_2023",
    provenance: "clinical_recommendation",
  },
  {
    key: "acute_limb_ischaemia",
    label: "Acute limb ischaemia or a threatened limb",
    level: "immediate",
    title: "Acute arterial occlusion or a threatened limb documented",
    basis:
      "Acute limb ischaemia is a vascular emergency in which limb loss is time-dependent, and the peripheral artery guideline sets out the urgency of revascularisation assessment.",
    action:
      "Record the limb findings, the time of onset, the revascularisation pathway chosen and the referral made, with the time it was made.",
    sourceId: "acc_aha_pad_2024",
    provenance: "clinical_recommendation",
  },
  {
    key: "suspected_pe",
    label: "Suspected pulmonary embolism",
    level: "same_day",
    title: "Pulmonary embolism suspected or documented",
    basis:
      "The ESC pulmonary embolism guideline defines the probability assessment, the D-dimer and imaging pathway and the anticoagulation decision that follow a clinical suspicion.",
    action:
      "Record the clinical probability documented, the diagnostic pathway chosen and the anticoagulation decision with its timing, and who made it.",
    sourceId: "esc_pe_2019",
    provenance: "clinical_recommendation",
  },
  {
    key: "severe_valve_disease",
    label: "Severe valve disease or a dysfunctional prosthetic valve",
    level: "same_day",
    title: "Severe valve disease documented",
    basis:
      "The ACC/AHA and ESC/EACTS valve guidelines define when a severe lesion with symptoms or with ventricular decompensation requires Heart Team assessment rather than observation.",
    action:
      "Record the severity evidence, whether symptoms are attributable to the lesion, and the Heart Team or referral route taken — or the documented reason for continued observation.",
    sourceId: "acc_aha_vhd_2020",
    provenance: "clinical_recommendation",
  },
  {
    key: "endocarditis_risk",
    label: "Suspected infective endocarditis or a prosthetic valve with fever",
    level: "same_day",
    title: "Infective endocarditis suspicion documented",
    basis:
      "Suspected endocarditis requires blood cultures before antibiotics, early echocardiography and involvement of the endocarditis team; prosthetic-valve infection carries a high early complication rate.",
    action:
      "Record the cultures taken and when, the echocardiography requested and the antibiotics started by the treating team, and the referral made.",
    sourceId: "esc_eacts_vhd_2021",
    provenance: "clinical_recommendation",
  },
];

const CONCERN_SPECS = {
  ecg_not_yet_performed: {
    level: "immediate",
    title: "Chest pain documented but no 12-lead ECG recorded yet",
    basis:
      "The ESC and ACC/AHA ACS guidelines require a 12-lead ECG within 10 minutes of first medical contact for a patient with suspected acute coronary syndrome, and the ECG is what decides the pathway.",
    action:
      "Record the time the ECG was obtained and the interpretation, or the documented reason it could not be obtained. The ECG itself is recorded in the note's ECG findings.",
    sourceId: "esc_acs_2023",
    provenance: "clinical_recommendation",
  },
  stemi_no_reperfusion_plan: {
    level: "immediate",
    title: "ST-elevation myocardial infarction documented without a reperfusion decision",
    basis:
      "The ESC ACS guideline and the ACC/AHA ACS guideline define primary PCI as the preferred reperfusion strategy, with a target first-medical-contact-to-device time of 120 minutes, and fibrinolysis within 10 minutes of diagnosis when primary PCI cannot be delivered in that window.",
    action:
      "Record the reperfusion strategy chosen, the time of diagnosis and the time reperfusion started or is expected, and who made the decision. If transfer is required, record when it was requested.",
    sourceId: "acc_aha_acs_2025",
    provenance: "clinical_recommendation",
  },
  af_no_anticoagulation: {
    level: "same_day",
    title: "Atrial fibrillation with a documented indication for anticoagulation and none prescribed",
    basis:
      "The ESC and ACC/AHA/ACCP/HRS atrial-fibrillation guidelines make stroke risk the driver of anticoagulation: where the documented thromboembolic risk is high, anticoagulation is recommended unless it is contraindicated or declined, and the reason is recorded.",
    action:
      "Record the anticoagulant prescribed, or the documented contraindication, bleeding risk or patient decision — and the review interval at which it will be revisited.",
    sourceId: "acc_aha_hhs_af_2023",
    provenance: "clinical_recommendation",
  },
  hfref_therapy_incomplete: {
    level: "same_day",
    title: "Reduced-ejection-fraction heart failure without all four treatment pillars started",
    basis:
      "The ESC and ACC/AHA/HFSA heart-failure guidelines recommend four pillars for heart failure with reduced ejection fraction — a renin-angiotensin system inhibitor (or ARNI), a beta-blocker, a mineralocorticoid receptor antagonist and an SGLT2 inhibitor — initiated early and titrated to the tolerated dose.",
    action:
      "Record which pillars are in place, which are planned and when, and the documented reason for any that is withheld (blood pressure, renal function, potassium, intolerance). Doses are set by the treating team.",
    sourceId: "esc_hf_2021",
    provenance: "clinical_recommendation",
  },
  severe_as_no_referral: {
    level: "same_day",
    title: "Severe aortic stenosis documented without an intervention decision",
    basis:
      "The ACC/AHA and ESC/EACTS valve guidelines require intervention assessment — surgical or transcatheter — for severe aortic stenosis once symptoms or ventricular decompensation are documented, rather than continued observation alone.",
    action:
      "Record the Heart Team or referral route taken, the time it was made, or the documented reason that intervention is not being pursued.",
    sourceId: "esc_eacts_vhd_2021",
    provenance: "clinical_recommendation",
  },
  hypertensive_emergency_recorded: {
    level: "immediate",
    title: "Hypertensive emergency documented in this encounter",
    basis:
      "In a hypertensive emergency, the ESC and ACC/AHA hypertension guidance require immediate, monitored blood-pressure reduction together with treatment of the target-organ injury, rather than outpatient adjustment.",
    action:
      "Record the target-organ findings, the agents given, the monitoring in place and who was informed, with times.",
    sourceId: "esc_hypertension_2024",
    provenance: "clinical_recommendation",
  },
  high_risk_syncope_recorded: {
    level: "immediate",
    title: "Syncope with a high-risk feature documented",
    basis:
      "The ESC syncope guideline and the ACC/AHA/HRS syncope guideline place syncope with a high-risk feature in the in-hospital evaluation pathway because of the short-term risk of a cardiac cause.",
    action:
      "Record the monitoring, admission or early-review decision, and the driving and recurrence advice given.",
    sourceId: "esc_syncope_2018",
    provenance: "clinical_recommendation",
  },
  ventricular_arrhythmia_recorded: {
    level: "immediate",
    title: "Ventricular tachyarrhythmia documented in this encounter",
    basis:
      "Sustained ventricular tachyarrhythmia requires immediate assessment for reversible causes and structured sudden-death risk evaluation, as set out in the cardiomyopathy and arrhythmia guidance.",
    action:
      "Record the treatment delivered, the reversible causes assessed, the monitoring in place and the escalation made.",
    sourceId: "esc_cardiomyopathy_2023",
    provenance: "clinical_recommendation",
  },
  ascvd_no_lipid_therapy: {
    level: "documented",
    title: "Established atherosclerotic disease without lipid-lowering therapy documented",
    basis:
      "The ESC/EAS dyslipidaemia guideline recommends lipid-lowering therapy for every patient with established atherosclerotic cardiovascular disease, with an LDL-C target, and a documented reason where it is not prescribed.",
    action:
      "Record the lipid-lowering therapy in place or started, the target discussed, or the documented intolerance and the alternative chosen.",
    sourceId: "esc_eas_dyslipidaemia_2019",
    provenance: "clinical_recommendation",
  },
  device_therapy_not_discussed: {
    level: "documented",
    title: "Left ventricular ejection fraction ≤ 35% without a documented device discussion",
    basis:
      "The heart-failure guidelines require an assessment for an implantable cardioverter defibrillator and for cardiac resynchronisation therapy at this level of systolic dysfunction once optimal medical therapy has been established.",
    action:
      "Record whether device therapy was discussed, deferred until reassessment, declined, or not indicated, and the reassessment interval.",
    sourceId: "acc_aha_hfsa_hf_2022",
    provenance: "clinical_recommendation",
  },
  post_mi_rehab_not_documented: {
    level: "documented",
    title: "Myocardial infarction without cardiac rehabilitation documented",
    basis:
      "The ACC/AHA and ESC ACS guidelines recommend referral to a cardiac rehabilitation programme after an acute coronary event as part of secondary prevention.",
    action:
      "Record the referral made, or the documented reason it was not made.",
    sourceId: "acc_aha_acs_2025",
    provenance: "clinical_recommendation",
  },
  cardiomyopathy_scd_not_assessed: {
    level: "documented",
    title: "Sudden cardiac death risk not documented",
    basis:
      "The ESC cardiomyopathy guideline requires a structured assessment of sudden cardiac death risk and family screening in every cardiomyopathy or inherited arrhythmia, with the decision and its basis recorded.",
    action:
      "Record the risk assessment performed and its outcome, and the family screening advice given.",
    sourceId: "esc_cardiomyopathy_2023",
    provenance: "clinical_recommendation",
  },
  renal_potassium_monitoring_not_documented: {
    level: "documented",
    title: "Heart-failure therapy started without documented renal and potassium monitoring",
    basis:
      "The heart-failure guidelines require renal function and potassium to be rechecked after starting or titrating a renin-angiotensin system inhibitor or a mineralocorticoid receptor antagonist.",
    action:
      "Record when the recheck is due and who is responsible for reviewing it.",
    sourceId: "esc_hf_2021",
    provenance: "clinical_recommendation",
  },
};

// ---- Rules that read the structured fields of this note -------------------
const FROM_VALUES = [
  (v) => {
    const pain = text(v, "chest_pain_character");
    if (!pain || pain === "Absent" || pain === "Not assessed") return null;
    const ecg = text(v, "ecg_timing");
    if (ecg !== "Not yet performed") return null;
    return { key: "ecg_not_yet_performed", evidence: `Chest pain: ${pain}; ECG: not yet performed` };
  },
  (v) => {
    if (!/^ST-elevation myocardial infarction/i.test(text(v, "acs_classification"))) return null;
    const strategy = text(v, "reperfusion_strategy");
    if (strategy && !/^Not documented|^Not applicable/i.test(strategy)) return null;
    return {
      key: "stemi_no_reperfusion_plan",
      evidence: `Classification: ${text(v, "acs_classification")}; reperfusion: ${strategy || "not documented"}`,
    };
  },
  (v) => {
    if (!/^Atrial fibrillation/i.test(text(v, "rhythm_diagnosis"))) return null;
    if (!/^High/.test(text(v, "thromboembolic_risk"))) return null;
    const ac = text(v, "anticoagulation_status");
    if (ac !== "Not prescribed") return null;
    return { key: "af_no_anticoagulation", evidence: "AF with high thromboembolic risk; anticoagulation: not prescribed" };
  },
  (v) => {
    if (!/HFrEF/.test(text(v, "hf_phenotype"))) return null;
    const gdmt = text(v, "hf_gdmt_status");
    if (!/Not started|Partially started|Not documented/i.test(gdmt)) return null;
    return { key: "hfref_therapy_incomplete", evidence: `Phenotype: HFrEF; pillars: ${gdmt}` };
  },
  (v) => {
    if (!/Severe aortic stenosis/i.test(text(v, "valve_lesion"))) return null;
    const plan = text(v, "valve_intervention");
    if (plan !== "Not documented") return null;
    return { key: "severe_as_no_referral", evidence: "Lesion: severe aortic stenosis; intervention: not documented" };
  },
  (v) =>
    text(v, "bp_severity") === "Hypertensive emergency documented"
      ? { key: "hypertensive_emergency_recorded", evidence: "Blood pressure: hypertensive emergency documented" }
      : null,
  (v) =>
    /^Present — high risk/i.test(text(v, "syncope_features"))
      ? { key: "high_risk_syncope_recorded", evidence: `Syncope: ${text(v, "syncope_features")}` }
      : null,
  (v) => {
    if (!/^Ventricular (tachycardia|fibrillation)/i.test(text(v, "rhythm_diagnosis"))) return null;
    return { key: "ventricular_arrhythmia_recorded", evidence: `Rhythm: ${text(v, "rhythm_diagnosis")}` };
  },
  (v) => {
    if (!/^Established atherosclerotic/i.test(text(v, "ascvd_risk_category"))) return null;
    if (!/^Not (prescribed|documented)/i.test(text(v, "lipid_therapy"))) return null;
    return { key: "ascvd_no_lipid_therapy", evidence: `Risk: ${text(v, "ascvd_risk_category")}; lipid therapy: ${text(v, "lipid_therapy")}` };
  },
  (v) => {
    if (text(v, "lvef_category") !== "LVEF 35% or less") return null;
    if (text(v, "device_therapy_discussion") !== "Not documented") return null;
    return { key: "device_therapy_not_discussed", evidence: "LVEF 35% or less; device therapy: not documented" };
  },
  (v) => {
    const acs = text(v, "acs_classification");
    if (!/^(ST-elevation myocardial infarction|Non-ST-elevation myocardial infarction|Unstable angina)/i.test(acs))
      return null;
    if (text(v, "cardiac_rehab_referral") !== "Not documented") return null;
    return { key: "post_mi_rehab_not_documented", evidence: `Classification: ${acs}; cardiac rehabilitation: not documented` };
  },
  (v) => {
    if (text(v, "scd_risk_assessment") !== "Not documented") return null;
    return { key: "cardiomyopathy_scd_not_assessed", evidence: `Cardiomyopathy: ${text(v, "cardiomyopathy_phenotype")}; SCD risk: not documented` };
  },
  (v) => {
    const pillars = text(v, "hf_gdmt_status");
    if (!/All four pillars|Partially started/i.test(pillars)) return null;
    if (text(v, "renal_potassium_monitoring") !== "Not documented") return null;
    return { key: "renal_potassium_monitoring_not_documented", evidence: `Pillars: ${pillars}; renal and potassium monitoring: not documented` };
  },
];

const basePrompt = (key, overrides = {}) => {
  const concern = CARDIOLOGY_SAFETY_CONCERNS.find((p) => p.key === key);
  const spec = concern || CONCERN_SPECS[key];
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

export function buildCardiologySafetyPrompts({ concerns = [], values = {} } = {}) {
  const map = new Map();
  const push = (prompt, evidence) => {
    if (!prompt) return;
    const existing = map.get(prompt.key);
    if (existing) {
      if (evidence && !existing.evidence.includes(evidence)) existing.evidence.push(evidence);
      return;
    }
    map.set(prompt.key, { ...prompt, evidence: evidence ? [evidence] : [] });
  };

  (concerns || []).forEach((key) => push(basePrompt(key), "Selected in this encounter"));
  FROM_VALUES.forEach((rule) => {
    const found = rule(values || {});
    if (!found) return;
    push(basePrompt(found.key, found.title ? { title: found.title } : {}), found.evidence);
  });

  return [...map.values()].sort(
    (a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9)
  );
}

// Readable text stored with the note and printed in the PDF.
export function formatCardiologySafety(value) {
  if (!value || typeof value !== "object") return "";
  const stored = Array.isArray(value.resolved) ? value.resolved : [];
  const actions = value.actions || {};
  const reasons = value.not_applicable || {};
  const lines = [];

  if (stored.length === 0 && !String(value.other_concern || "").trim()) {
    lines.push(
      "No cardiology decision-support prompt was triggered by the findings documented in this note — this is not a statement that no urgent problem exists."
    );
  } else {
    lines.push(`Cardiology decision support at the time of this note (${stored.length}):`);
    stored.forEach((p) => {
      const action = String(actions[p.key] || "").trim();
      const reason = String(reasons[p.key] || "").trim();
      lines.push(
        `[${p.level === "immediate" ? "ACT NOW" : p.level === "same_day" ? "SAME DAY" : "DOCUMENT"}] ${p.title}`
      );
      if (p.evidence && p.evidence.length) lines.push(`   Documented: ${p.evidence.join("; ")}`);
      lines.push(`   Basis: ${p.basis}`);
      if (p.source)
        lines.push(`   Source: ${p.source.organization} — ${p.source.title}, ${p.source.version} (${p.source.url})`);
      if (p.provenanceLabel) lines.push(`   Rule type: ${p.provenanceLabel}`);
      lines.push(`   Action taken: ${action || (reason ? `Not applicable — ${reason}` : "NOT DOCUMENTED")}`);
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

export const CARDIOLOGY_SAFETY_APPROVAL_REQUIRED = Object.entries(CONCERN_SPECS)
  .filter(([, spec]) => spec.approvalRequired)
  .map(([key]) => key);