// Escalation documentation for time-critical cardiology presentations.
//
// This module does NOT triage, score or decide anything. It records what the
// treating team already did: what triggered the escalation, when it was
// recognised, who was told and when, what was given before transfer, what is
// being monitored and what the response was. Each trigger names the guideline
// that defines why the presentation is time-critical, and every entry carries the
// same statement: the alert never delays treatment.
//
// A prompt is shown only for a trigger the clinician selected. Nothing is
// inferred from an empty field, and an empty field never means "not present".

import { getCardiologyReference } from "@/lib/cardiologyReferences";

const sourceOf = (id) => {
  const r = getCardiologyReference(id);
  if (!r) return null;
  return { organization: r.short || r.organization, title: r.title, version: r.version, url: r.url };
};

export const NO_DELAY_STATEMENT =
  "Documentation never precedes treatment. Resuscitation, defibrillation, reperfusion, oxygen, vascular access, analgesia and the emergency call are delivered first and recorded afterwards, including a retrospective time.";

const base = (key, label, urgency, sourceId, why, record) => ({
  key,
  label,
  urgency,
  why,
  record,
  source: sourceOf(sourceId),
  source_id: sourceId,
});

export const CARDIOLOGY_ESCALATION_TRIGGERS = [
  base(
    "suspected_acs",
    "Suspected acute coronary syndrome",
    "Immediate",
    "esc_acs_2023",
    "Suspected ACS starts a timed diagnostic pathway: ECG and biomarker assessment decide whether reperfusion is needed, and delay worsens outcome.",
    "Record the time of first medical contact, the ECG time, the first troponin and who was informed. The pathway chosen is recorded in the diagnostic fields."
  ),
  base(
    "myocardial_infarction",
    "Myocardial infarction confirmed or evolving",
    "Immediate",
    "acc_aha_acs_2025",
    "A confirmed infarction requires a reperfusion decision with a defined time target, and the decision and its timing belong in the record.",
    "Record the diagnosis time, the reperfusion strategy chosen and the time it started or was requested, with the responsible clinician."
  ),
  base(
    "unstable_arrhythmia",
    "Unstable tachyarrhythmia or bradyarrhythmia",
    "Immediate",
    "esc_af_2024",
    "Haemodynamically unstable rhythm disturbance requires immediate rhythm or rate correction and monitoring rather than outpatient adjustment.",
    "Record the rhythm, the treatment delivered (including cardioversion or pacing where used), the response and the monitoring in place."
  ),
  base(
    "cardiogenic_shock",
    "Cardiogenic shock",
    "Immediate",
    "esc_hf_2021",
    "Cardiogenic shock carries very high mortality and requires immediate senior cardiology and critical-care involvement with urgent revascularisation assessment.",
    "Record the perfusion findings, the vasoactive support and inotropes given by that team, the time of the escalation and who attended."
  ),
  base(
    "acute_decompensated_hf",
    "Acute decompensated heart failure",
    "Urgent",
    "acc_aha_hfsa_hf_2022",
    "Acute decompensation requires urgent decongestion and identification of the precipitant, and the guidelines define the review required after discharge.",
    "Record the congestion findings, the diuretic and vasodilator decisions, the precipitant identified and the follow-up arranged."
  ),
  base(
    "haemodynamic_instability",
    "Haemodynamic instability (hypotension, hypoperfusion or shock state)",
    "Immediate",
    "esc_acs_2023",
    "Instability changes the treatment pathway and requires senior and critical-care input at the time it is recognised.",
    "Record the observations that defined instability, the immediate treatment given and who was escalated to, with times."
  ),
  base(
    "dangerous_ecg",
    "Dangerous ECG abnormality (ST elevation, de Winter, Wellens, Brugada pattern, wide-complex tachycardia, complete heart block, marked QT prolongation)",
    "Immediate",
    "esc_acs_2023",
    "These ECG patterns carry an immediate risk of infarction, arrhythmia or complete block and change management at the moment they are seen.",
    "Record the pattern, who reviewed the ECG and when, the treatment or monitoring started, and whether the finding was communicated to the receiving team."
  ),
  base(
    "severe_hypertension_tod",
    "Severe hypertension with suspected acute target-organ damage",
    "Immediate",
    "esc_hypertension_2024",
    "Hypertensive emergency requires controlled, monitored blood-pressure reduction with treatment of the organ injury; severe elevation without organ injury follows a different pathway.",
    "Record the target-organ assessment, the agents given, the reduction achieved, the monitoring in place and who was informed."
  ),
];

export const ESCALATION_TRIGGER_BY_KEY = new Map(
  CARDIOLOGY_ESCALATION_TRIGGERS.map((t) => [t.key, t])
);

export const ESCALATION_TRIGGER_OPTIONS = CARDIOLOGY_ESCALATION_TRIGGERS.map((t) => t.label);

export const triggersFor = (keys = []) =>
  (Array.isArray(keys) ? keys : [])
    .map((k) => ESCALATION_TRIGGER_BY_KEY.get(k) || CARDIOLOGY_ESCALATION_TRIGGERS.find((t) => t.label === k))
    .filter(Boolean);

// Documentation gaps. Advisory only — never a clinical judgement and never a
// reason to withhold treatment.
export const escalationGaps = (value = {}) => {
  const v = value && typeof value === "object" ? value : {};
  const triggers = triggersFor(v.triggers);
  const gaps = [];
  if (!triggers.length) return gaps;

  const immediate = triggers.filter((t) => t.urgency === "Immediate");
  if (!String(v.escalated_to || "").trim()) {
    gaps.push({
      level: immediate.length ? "error" : "warning",
      message: `Record who was escalated to for: ${triggers.map((t) => t.label.toLowerCase()).join("; ")}.`,
    });
  }
  if (!String(v.escalation_time || "").trim()) {
    gaps.push({ level: "warning", message: "Record the time escalation was made — the interval is what the audit looks at." });
  }
  if (!String(v.recognised_time || "").trim()) {
    gaps.push({ level: "warning", message: "Record the time the trigger was recognised." });
  }
  if (!String(v.treatment_delivered || "").trim()) {
    gaps.push({
      level: immediate.length ? "error" : "warning",
      message: "Record the immediate treatment delivered and its time — including treatment given before escalation.",
    });
  }
  if (!String(v.monitoring || "").trim()) {
    gaps.push({ level: "warning", message: "Record the monitoring in place after the escalation." });
  }
  if (!String(v.response || "").trim()) {
    gaps.push({ level: "note", message: "Record the clinical response to treatment and the outcome of the escalation." });
  }
  return gaps;
};

const label = (k) => ESCALATION_TRIGGER_BY_KEY.get(k)?.label || k;

export const formatEscalation = (value = {}) => {
  const v = value && typeof value === "object" ? value : {};
  const triggers = triggersFor(v.triggers);
  if (!triggers.length && !v.escalated_to && !v.treatment_delivered) return "";
  const out = ["Escalation and time-critical pathway"];
  if (triggers.length) {
    out.push(
      `Trigger${triggers.length > 1 ? "s" : ""} documented: ${triggers
        .map((t) => `${t.label} (${t.urgency.toLowerCase()})`)
        .join("; ")}`
    );
  }
  const row = (k, l) => {
    const val = String(v[k] || "").trim();
    if (val) out.push(`${l}: ${val}`);
  };
  row("recognised_time", "Recognised at");
  row("escalated_to", "Escalated to");
  row("escalation_time", "Escalation time");
  row("treatment_delivered", "Treatment before and during escalation");
  row("monitoring", "Monitoring in place");
  row("response", "Response and outcome");
  row("referral", "Referral or transfer");
  if (triggers.length) {
    const sources = [...new Set(triggers.map((t) => t.source?.title).filter(Boolean))];
    if (sources.length) out.push(`Guideline basis: ${sources.join("; ")}`);
    out.push(`Advisory record only — ${NO_DELAY_STATEMENT}`);
  }
  return out.join("\n");
};