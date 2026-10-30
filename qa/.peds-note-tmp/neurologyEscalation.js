// Neurology — deterioration, critical-finding and escalation record.
//
// WHAT THIS FILE IS
// The structured record behind "something changed, someone was told, and this is what
// was decided". A critical neurological finding entered here is never discarded: it
// carries who identified it, at what time, what was observed against baseline, who
// was informed and when, whether the escalation was acknowledged, the decision and
// its author, where the patient went, and the reassessment that followed.
//
// WHAT IT DOES NOT DO
// It does not diagnose, does not order treatment and does not decide the escalation
// threshold for the institution. It records the escalation the clinician performed.
// Documentation is written after the clinical action and may never delay it. A blank
// field prints as NOT DOCUMENTED and is reported as owed — it is never read as
// "no change" and never silently dropped.
//
// PROVENANCE
//   · guideline — the requirement is stated in the cited document.
//   · local — an AMedix/institution escalation requirement, labelled as such.

import { asObject, str, list } from "./neurologyFieldKit.js";
import { NEURO_REFERENCES } from "./neurologyReferences.js";

export const NEURO_ESCALATION_STATE_KEY = "neuro_escalation";

export const NEURO_ESCALATION_NOTICE =
  "Deterioration and escalation record only. It does not diagnose, does not order treatment and does not replace the institution's emergency call or referral route — it documents the escalation that was made, after it was made. Nothing in this record may delay calling for help.";

export const NEURO_ESCALATION_LEVELS = {
  immediate: { label: "Immediate — call now", order: 0, chip: "bg-destructive/10 text-destructive" },
  emergency: { label: "Emergency — same hour", order: 1, chip: "bg-warning/10 text-warning" },
  urgent: { label: "Urgent — same day", order: 2, chip: "bg-info/10 text-info" },
};

export const NEURO_ESCALATION_TRIGGERS = [
  "New critical finding",
  "Deterioration from baseline",
  "Anticipated deterioration — escalation agreed in advance",
  "Not documented",
];

export const NEURO_CRITICAL_FINDINGS = [
  {
    key: "gcs_decline",
    label: "Reduced level of consciousness — GCS fallen from baseline",
    level: "immediate",
    why: "A falling level of consciousness is the earliest reliable sign of a developing intracranial problem and of airway compromise.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "aha_ich_2022",
  },
  {
    key: "new_focal_deficit",
    label: "New or worsening focal neurological deficit",
    level: "immediate",
    why: "A new deficit may be evolving ischaemia, expansion of a haemorrhage or raised intracranial pressure, and is time-critical.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "aha_ais_2019",
  },
  {
    key: "pupillary_change",
    label: "Pupillary change or new asymmetry",
    level: "immediate",
    why: "An enlarging or unreactive pupil is a herniation warning sign and requires immediate senior review.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "aha_ich_2022",
  },
  {
    key: "respiratory_compromise",
    label: "Respiratory compromise — falling vital capacity, weak cough or rising carbon dioxide",
    level: "immediate",
    why: "In neuromuscular disease respiratory failure develops before it is clinically obvious; objective measurement is required.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "ean_gbs",
  },
  {
    key: "ongoing_seizure",
    label: "Seizure continuing or recurring without recovery",
    level: "immediate",
    why: "A seizure that does not stop, or seizures without recovery between them, is a medical emergency requiring staged treatment and airway support.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "ilae_status_2015",
  },
  {
    key: "suspected_herniation",
    label: "Clinical signs of raised intracranial pressure or impending herniation",
    level: "immediate",
    why: "Deteriorating consciousness with a pupillary change and abnormal posturing is a neurosurgical emergency.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "aha_ich_2022",
  },
  {
    key: "haemorrhage_expansion",
    label: "Suspected haemorrhage expansion",
    level: "emergency",
    why: "Expansion changes the treatment decision, including blood-pressure management and reversal of anticoagulation.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "aha_ich_2022",
  },
  {
    key: "rebleed_sah",
    label: "Suspected rebleeding after subarachnoid haemorrhage",
    level: "emergency",
    why: "Rebleeding carries a high risk of deterioration and requires immediate specialist involvement.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "aha_sah_2023",
  },
  {
    key: "cns_infection",
    label: "Suspected meningitis or encephalitis with deterioration",
    level: "emergency",
    why: "Untreated CNS infection deteriorates quickly; the time to antimicrobial treatment and to senior review must be recorded.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "local",
  },
  {
    key: "spinal_cord_compression",
    label: "Suspected acute spinal cord compression",
    level: "immediate",
    why: "Neurological function lost before decompression may not recover, so the time of recognition and the time of referral are both recorded.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "local",
  },
  {
    key: "cauda_equina",
    label: "Suspected cauda equina syndrome — saddle sensory loss, bladder or bowel dysfunction",
    level: "immediate",
    why: "Cauda equina syndrome is a surgical emergency; the timing of symptoms, referral and imaging is part of the record.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "local",
  },
  {
    key: "anticoagulant_bleeding",
    label: "Bleeding in a patient taking an anticoagulant",
    level: "emergency",
    why: "Anticoagulant-related bleeding requires reversal to be considered and the coagulation result to be documented.",
    requiresReassessment: true,
    provenance: "guideline",
    sourceId: "aha_ich_2022",
  },
  {
    key: "other_critical_finding",
    label: "Other critical neurological finding — described below",
    level: "urgent",
    why: "Any finding the clinician judges critical is recorded with the same escalation detail rather than left in free text.",
    requiresReassessment: false,
    provenance: "local",
    sourceId: "local",
  },
];

export const NEURO_CRITICAL_FINDING_MAP = NEURO_CRITICAL_FINDINGS.reduce((acc, f) => ({ ...acc, [f.key]: f }), {});

export const NEURO_ESCALATION_ROUTES = [
  "Emergency team / medical emergency call",
  "On-call neurologist",
  "Stroke team",
  "Neurosurgical referral",
  "Critical care referral",
  "Spinal surgical referral",
  "Infection team informed",
  "Transfer to another facility arranged",
  "No route activated — reason documented",
  "Not documented",
];

export const NEURO_ESCALATION_DESTINATIONS = [
  "Remained on this unit with increased observation",
  "Transferred to a monitored bed",
  "Transferred to intensive care",
  "Transferred to theatre",
  "Transferred to another facility",
  "Not documented",
];

// The fields every critical-finding event records, in the order they are printed.
// `required` means the printed record prints NOT DOCUMENTED when it is blank.
export const NEURO_ESCALATION_FIELDS = [
  { key: "trigger", label: "What prompted the escalation", type: "select", options: NEURO_ESCALATION_TRIGGERS, required: true },
  { key: "time_identified", label: "Time the finding was identified", type: "time", required: true },
  { key: "identified_by", label: "Identified by", type: "input", required: true },
  { key: "baseline_observation", label: "Observation before the change", type: "input", required: true },
  { key: "current_observation", label: "Observation at the time of the change", type: "input", required: true },
  { key: "finding_detail", label: "What was found", type: "textarea", required: true },
  { key: "who_informed", label: "Who was informed (name and role)", type: "input", required: true },
  { key: "time_informed", label: "Time informed", type: "time", required: true },
  { key: "route", label: "Route used", type: "select", options: NEURO_ESCALATION_ROUTES, required: true },
  { key: "acknowledged_by", label: "Acknowledged by", type: "input", required: false },
  { key: "acknowledged_time", label: "Time acknowledged", type: "time", required: false },
  { key: "decision", label: "Decision recorded", type: "textarea", required: true },
  { key: "decision_by", label: "Decision made by (name and role)", type: "input", required: true },
  { key: "decision_time", label: "Time of the decision", type: "time", required: false },
  { key: "destination", label: "Where the patient went", type: "select", options: NEURO_ESCALATION_DESTINATIONS, required: false },
  { key: "departure_time", label: "Time moved or handed over", type: "time", required: false },
  { key: "reassessment_time", label: "Time of reassessment", type: "time", required: false },
  { key: "reassessment", label: "Reassessment findings", type: "textarea", required: false },
];

export const emptyNeuroEscalationEvent = () => ({
  finding_key: "",
  ...Object.fromEntries(NEURO_ESCALATION_FIELDS.map((f) => [f.key, ""])),
});

export const emptyNeurologyEscalation = () => ({
  not_assessed: false,
  none_documented: false,
  events: [],
});

export const neurologyEscalationState = (value) => {
  const base = emptyNeurologyEscalation();
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  return {
    ...base,
    ...value,
    events: Array.isArray(value.events) ? value.events.filter((e) => e && typeof e === "object") : [],
  };
};

export const neuroCriticalFinding = (key) => NEURO_CRITICAL_FINDING_MAP[key] || null;

export const escalationFindingLevel = (event) =>
  (neuroCriticalFinding(asObject(event).finding_key) || {}).level || "urgent";

const minutes = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(str(hhmm));
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
};

const LEVEL_ORDER = { immediate: 0, emergency: 1, urgent: 2 };

// What the record still owes. Advisory: it reports, it never blocks the note.
export const neurologyEscalationIssues = (value) => {
  const state = neurologyEscalationState(value);
  const issues = [];

  if (!state.not_assessed && !state.none_documented && state.events.length === 0) {
    issues.push({
      key: "no_state",
      level: "documented",
      message:
        "No escalation statement recorded. Record every critical finding and escalation, or state explicitly that none occurred during this encounter.",
    });
  }

  if (state.none_documented && state.events.length > 0) {
    issues.push({
      key: "contradiction",
      level: "documented",
      message: "The record states that no critical finding occurred and also records one — resolve the contradiction.",
    });
  }

  if (state.not_assessed && state.events.length > 0) {
    issues.push({
      key: "not_assessed_contradiction",
      level: "documented",
      message: "The record states that escalation was not assessed and also records an event — correct the record.",
    });
  }

  state.events.forEach((event, index) => {
    const n = index + 1;
    const spec = neuroCriticalFinding(event.finding_key);
    if (!event.finding_key) {
      issues.push({
        key: `event_${n}_finding`,
        level: "documented",
        message: `Escalation ${n} does not name the critical finding or the change that prompted it.`,
      });
    }
    if (!str(event.time_identified)) {
      issues.push({
        key: `event_${n}_time_identified`,
        level: "immediate",
        message: `Escalation ${n}: the time the finding was identified is not recorded — a critical finding needs a timestamp to be auditable.`,
      });
    }
    if (!str(event.who_informed) || !str(event.time_informed)) {
      issues.push({
        key: `event_${n}_notification`,
        level: "immediate",
        message: `Escalation ${n}: who was informed and at what time is not recorded.`,
      });
    }
    if (spec && spec.level === "immediate" && !str(event.acknowledged_by)) {
      issues.push({
        key: `event_${n}_acknowledgement`,
        level: "immediate",
        message: `Escalation ${n} (${spec.label}): the escalation is recorded as sent but not as acknowledged by a senior clinician.`,
      });
    }
    if (!str(event.decision) || !str(event.decision_by)) {
      issues.push({
        key: `event_${n}_decision`,
        level: "documented",
        message: `Escalation ${n}: the decision and the clinician who made it are not both recorded.`,
      });
    }
    if (spec && spec.requiresReassessment && !str(event.reassessment_time) && !str(event.reassessment)) {
      issues.push({
        key: `event_${n}_reassessment`,
        level: "advisory",
        message: `Escalation ${n} (${spec.label}): no reassessment is recorded after the escalation.`,
      });
    }

    const identified = minutes(event.time_identified);
    const informed = minutes(event.time_informed);
    if (identified !== null && informed !== null && informed < identified) {
      issues.push({
        key: `event_${n}_time_order`,
        level: "documented",
        message: `Escalation ${n}: the time informed is earlier than the time the finding was identified — correct the record.`,
      });
    }

    if (
      event.trigger === NEURO_ESCALATION_TRIGGERS[1] &&
      str(event.baseline_observation) &&
      str(event.baseline_observation) === str(event.current_observation)
    ) {
      issues.push({
        key: `event_${n}_deterioration_contradiction`,
        level: "documented",
        message: `Escalation ${n}: it is recorded as a deterioration from baseline, but the observation before and at the change are identical — describe what changed.`,
      });
    }
  });

  return issues.sort((a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9));
};

export const neurologyEscalationUrgentCount = (value) =>
  neurologyEscalationIssues(value).filter((i) => i.level === "immediate" || i.level === "emergency").length;

export const neurologyEscalationSummary = (value) => {
  const events = neurologyEscalationState(value).events;
  const byLevel = { immediate: 0, emergency: 0, urgent: 0 };
  events.forEach((e) => {
    const level = escalationFindingLevel(e);
    byLevel[level] = (byLevel[level] || 0) + 1;
  });
  return { total: events.length, byLevel };
};

export const neurologyEscalationReferences = (value) => {
  const keys = [
    ...new Set(
      neurologyEscalationState(value)
        .events.map((e) => (neuroCriticalFinding(e.finding_key) || {}).sourceId)
        .filter(Boolean)
    ),
  ];
  return keys.map((k) => (NEURO_REFERENCES[k] ? { key: k, ...NEURO_REFERENCES[k] } : null)).filter(Boolean);
};

export const neurologyEscalationFindingsInUse = (value) =>
  list(neurologyEscalationState(value).events.map((e) => e.finding_key))
    .map((k) => neuroCriticalFinding(k))
    .filter(Boolean);

// ---- Print --------------------------------------------------------------
const nd = (v) => (str(v) ? str(v) : "NOT DOCUMENTED");

export const formatNeurologyEscalation = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const state = neurologyEscalationState(value);
  const lines = ["DETERIORATION, CRITICAL FINDINGS AND ESCALATION", NEURO_ESCALATION_NOTICE];

  if (state.not_assessed) lines.push("\nEscalation review: NOT ASSESSED at the time of this note.");
  if (state.none_documented) {
    lines.push(
      "\nNo critical finding or escalation was recorded during this encounter. This statement rests on the observations documented in the note and is not a substitute for observation.",
    );
  }

  state.events.forEach((event, index) => {
    const spec = neuroCriticalFinding(event.finding_key);
    const level = spec ? NEURO_ESCALATION_LEVELS[spec.level] : null;
    lines.push(`\nESCALATION ${index + 1}: ${spec ? spec.label : "critical finding not named"}${level ? ` — ${level.label}` : ""}`);
    if (spec) lines.push(`   Why recorded: ${spec.why}`);
    NEURO_ESCALATION_FIELDS.forEach((f) => {
      const v = str(event[f.key]);
      if (v) lines.push(`   ${f.label}: ${v}`);
      else if (f.required || (spec && spec.level === "immediate")) lines.push(`   ${f.label}: NOT DOCUMENTED`);
    });
    if (spec) {
      lines.push(`   Basis: ${spec.provenance === "guideline" ? "guideline requirement" : "AMedix local escalation requirement"}`);
      const ref = NEURO_REFERENCES[spec.sourceId];
      if (ref) lines.push(`   Source: ${ref.organization} — ${ref.title}, ${ref.edition}`);
    }
  });

  const issues = neurologyEscalationIssues(value).filter((i) => i.key !== "no_state");
  if (issues.length) {
    lines.push("\nRECORD STILL OWES:");
    issues.forEach((i) => lines.push(`   [${i.level.toUpperCase()}] ${i.message}`));
  }

  if (state.events.length) {
    lines.push(
      "\nThis record is part of the patient's clinical record and is preserved with the note's signature, timestamps and access rules. It documents the escalation performed and does not replace the institution's emergency call or referral record.",
    );
  }

  return lines.join("\n");
};