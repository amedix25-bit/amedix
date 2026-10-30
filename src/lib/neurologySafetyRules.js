// Neurology — advisory safety prompts.
//
// Each prompt compares what the note actually recorded against the requirement of
// the cited document. A prompt states what is documented, the requirement it fails,
// and the source of that requirement — it never diagnoses, never orders treatment
// and never changes a diagnosis. Nothing here blocks saving the note.
//
// Every rule carries its provenance:
//   · GUIDELINE — the requirement is stated in the cited document.
//   · LOCAL — the requirement is an AMedix/institution decision, clearly labelled as
//     such and never presented as a guideline recommendation.
//
// A rule fires only from values that were documented. A blank is never treated as
// a negative finding, and a prompt is not a statement that the condition is present.

import { neuroBlockValues } from "@/lib/neurologyBlocks";
import { calculateNeuroScore } from "@/lib/neurologyScores";
import { NEURO_REFERENCES } from "@/lib/neurologyReferences";
import { neurologyEmergencyState } from "@/lib/neurologyEmergencies";
import { neurologyMedicationAlerts } from "@/lib/neurologyMedications";
import { neurologyEscalationIssues } from "@/lib/neurologyEscalation";
import { asObject, str, list } from "@/lib/neurologyFieldKit";

export const NEURO_SAFETY_PROVENANCE = {
  guideline: "Guideline requirement",
  label: "Product-label check — verified by the prescriber and pharmacist against the current label",
  local: "AMedix local decision — not a guideline claim",
};

const REF = (key) => NEURO_REFERENCES[key];

const bv = (values, block) => neuroBlockValues(values, block);
const f = (values, block, field) => str(bv(values, block)[field]);
const m = (values, block, field) => list(bv(values, block)[field]);
const blockUsed = (values, block) =>
  Object.entries(bv(values, block)).some(([k, v]) =>
    k === "__n" ? false : Array.isArray(v) ? v.length > 0 : str(v) !== "",
  );

const REPERFUSION_GIVEN = ["Intravenous thrombolysis given", "Mechanical thrombectomy performed", "Thrombolysis and thrombectomy"];
const REPERFUSION_CONSIDERED = [...REPERFUSION_GIVEN, "Considered and not given — reason documented"];

const medIssues = (values) => neurologyMedicationAlerts(asObject(asObject(values).neuro_medications));
const escIssues = (values) => neurologyEscalationIssues(asObject(asObject(values).neuro_escalation));

const gcsTotal = (values) => {
  const result = calculateNeuroScore("gcs", asObject(asObject(values).neuro_scores?.gcs));
  return result && !result.missing.length ? result.value : null;
};

export const NEURO_SAFETY_RULES = [
  {
    key: "stroke_time_last_known_well",
    level: "critical",
    provenance: "guideline",
    source: "aha_ais_2019",
    title: "Time last known well is not recorded",
    basis:
      "The acute ischaemic stroke guideline requires the time the patient was last known to be at their baseline, because eligibility for reperfusion therapy is decided from it.",
    fires: (values) => blockUsed(values, "neuro_stroke") && !f(values, "neuro_stroke", "str_last_known_well"),
  },
  {
    key: "stroke_scan_before_reperfusion",
    level: "critical",
    provenance: "guideline",
    source: "aha_ais_2019",
    title: "Reperfusion decision documented without the scan finding",
    basis:
      "Reperfusion therapy is given only after intracranial haemorrhage has been excluded on imaging. The record documents the reperfusion decision but not the scan that preceded it.",
    fires: (values) =>
      REPERFUSION_CONSIDERED.includes(f(values, "neuro_stroke", "str_reperfusion_decision")) &&
      ["", "Not performed", "Not documented"].includes(f(values, "neuro_stroke", "str_first_scan_finding")),
  },
  {
    key: "stroke_contraindication_review",
    level: "critical",
    provenance: "guideline",
    source: "aha_ais_2019",
    title: "Thrombolysis recorded without a documented contraindication review",
    basis:
      "The guideline requires the contraindications to be reviewed before thrombolysis. The note records thrombolysis as given but not the review that cleared it.",
    fires: (values) =>
      f(values, "neuro_stroke", "str_reperfusion_decision").includes("thrombolysis") &&
      f(values, "neuro_stroke", "str_contraindication_review") !== "No contraindication identified",
  },
  {
    key: "stroke_bp_before_therapy",
    level: "warning",
    provenance: "guideline",
    source: "aha_ais_2019",
    title: "Blood pressure before reperfusion therapy is not documented",
    basis:
      "The guideline sets a blood-pressure ceiling that must be met before thrombolysis. The pressure at that point is not in the record, so the requirement cannot be checked.",
    fires: (values) =>
      REPERFUSION_GIVEN.includes(f(values, "neuro_stroke", "str_reperfusion_decision")) &&
      !f(values, "neuro_stroke", "str_bp_before_therapy"),
  },
  {
    key: "stroke_glucose_before_therapy",
    level: "warning",
    provenance: "guideline",
    source: "aha_ais_2019",
    title: "Blood glucose before reperfusion therapy is not documented",
    basis:
      "Hypoglycaemia mimics stroke and must be excluded before reperfusion therapy. The glucose at that point is not recorded.",
    fires: (values) =>
      REPERFUSION_GIVEN.includes(f(values, "neuro_stroke", "str_reperfusion_decision")) && !f(values, "neuro_stroke", "str_glucose"),
  },
  {
    key: "stroke_anticoagulant_unknown",
    level: "warning",
    provenance: "guideline",
    source: "aha_ais_2019",
    title: "Anticoagulant status is not documented",
    basis:
      "Recent anticoagulation is a contraindication to thrombolysis and governs reversal in haemorrhage. The record states that the anticoagulant status is not documented.",
    fires: (values) => f(values, "neuro_stroke", "str_anticoagulant") === "Not documented",
  },
  {
    key: "stroke_swallow_screen",
    level: "warning",
    provenance: "guideline",
    source: "aha_ais_2019",
    title: "Swallow screen not documented before oral intake",
    basis:
      "The guideline requires a dysphagia screen before oral intake after stroke, because aspiration risk is highest early. No screen is recorded in this note.",
    fires: (values) => blockUsed(values, "neuro_stroke") && !f(values, "neuro_stroke", "str_swallow_screen"),
  },
  {
    key: "stroke_cause_not_determined",
    level: "warning",
    provenance: "guideline",
    source: "aha_secondary_prevention_2021",
    title: "Cause of the ischaemic event is not recorded",
    basis:
      "Secondary prevention is chosen by cause. The record documents an ischaemic event without a documented cause classification or atrial-fibrillation status.",
    fires: (values) => {
      const scan = f(values, "neuro_stroke", "str_first_scan_finding");
      const ischaemic = ["No acute intracranial haemorrhage", "Early ischaemic change", "Established infarct", "Normal"].includes(scan);
      return ischaemic && ["", "Not determined"].includes(f(values, "neuro_stroke", "str_toast"));
    },
  },
  {
    key: "ich_on_anticoagulant",
    level: "critical",
    provenance: "guideline",
    source: "aha_ich_2022",
    title: "Intracerebral haemorrhage while anticoagulated — reversal not documented",
    basis:
      "The intracerebral haemorrhage guideline requires the anticoagulant to be reversed promptly. The scan shows a haemorrhage and the patient is on an anticoagulant, but no reversal decision is recorded in this note.",
    fires: (values) =>
      f(values, "neuro_stroke", "str_first_scan_finding") === "Intracerebral haemorrhage" &&
      ["Warfarin", "Direct oral anticoagulant"].includes(f(values, "neuro_stroke", "str_anticoagulant")),
  },
  {
    key: "seizure_classification_incomplete",
    level: "warning",
    provenance: "guideline",
    source: "ilae_seizure_2017",
    title: "Seizure documented without a documented onset classification",
    basis:
      "The ILAE operational classification begins with onset (focal, generalised or unknown); features recorded without an onset cannot be classified. Recording 'unknown onset' is a valid answer — leaving it blank is not.",
    fires: (values) =>
      blockUsed(values, "neuro_seizure") &&
      !f(values, "neuro_seizure", "szr_onset") &&
      (m(values, "neuro_seizure", "szr_features").length > 0 || Boolean(f(values, "neuro_seizure", "szr_epilepsy_type"))),
  },
  {
    key: "epilepsy_definition_not_recorded",
    level: "warning",
    provenance: "guideline",
    source: "ilae_definition_2014",
    title: "Epilepsy type recorded without the definition statement",
    basis:
      "Epilepsy is diagnosed from the documented event history (two unprovoked events more than 24 hours apart, or one with a documented recurrence risk of at least 60%). An epilepsy type is recorded here without that statement.",
    fires: (values) => {
      const type = f(values, "neuro_seizure", "szr_epilepsy_type");
      return Boolean(type) && type !== "Not established — single event" && !f(values, "neuro_seizure", "szr_definition_met");
    },
  },
  {
    key: "seizure_safety_advice",
    level: "warning",
    provenance: "local",
    source: "local",
    title: "Safety advice not documented for a patient with seizures",
    basis:
      "AMedix requires the safety advice given (driving according to the local licensing regulation, water, heights, alcohol and sleep) to be recorded in the note. This is an institutional requirement, not a guideline recommendation.",
    fires: (values) => {
      const advice = m(values, "neuro_seizure", "szr_safety_advice");
      return Boolean(f(values, "neuro_seizure", "szr_onset")) && (!advice.length || advice.includes("None documented"));
    },
  },
  {
    key: "status_first_line_time",
    level: "critical",
    provenance: "guideline",
    source: "ilae_status_2015",
    title: "Status epilepticus treatment recorded without the time it was given",
    basis:
      "Status epilepticus is defined by time: the stage reached decides the next intervention. The agent is recorded but not the time it was given, so the stage cannot be established from the record.",
    fires: (values) => Boolean(f(values, "neuro_status", "se_first_line_agent")) && !f(values, "neuro_status", "se_first_line_time"),
  },
  {
    key: "status_refractory_outside_critical_care",
    level: "critical",
    provenance: "guideline",
    source: "ncs_status",
    title: "Refractory status epilepticus recorded without critical-care level care",
    basis:
      "Once status epilepticus continues after the second-line agent it is refractory and requires critical-care monitoring. The record documents a refractory episode at ward level or without a documented level of care.",
    fires: (values) => {
      const stage = f(values, "neuro_status", "se_refractory");
      return (
        (stage.startsWith("Refractory") || stage.startsWith("Super-refractory")) &&
        ["", "Ward", "Not documented"].includes(f(values, "neuro_status", "se_level_of_care"))
      );
    },
  },
  {
    key: "status_nonconvulsive_without_eeg",
    level: "warning",
    provenance: "guideline",
    source: "ilae_status_2015",
    title: "Non-convulsive status epilepticus suspected without EEG",
    basis:
      "Non-convulsive status epilepticus cannot be confirmed clinically; EEG is required. The record suspects it and does not record an EEG request.",
    fires: (values) =>
      f(values, "neuro_status", "se_type") === "Non-convulsive — suspected" &&
      f(values, "neuro_status", "se_eeg_requested") !== "Yes — time documented",
  },
  {
    key: "headache_red_flag_unaddressed",
    level: "critical",
    provenance: "guideline",
    source: "snnoop10",
    title: "Secondary-headache flag recorded without a documented evaluation",
    basis:
      "A secondary-headache flag requires the evaluation it prompts to be documented. One or more SNNOOP10 flags are recorded, and no secondary-headache evaluation is recorded in this note.",
    fires: (values) => {
      const flags = m(values, "neuro_headache", "hd_red_flags").filter((x) => x !== "None of these documented");
      return flags.length > 0 && !f(values, "neuro_headache", "hd_secondary_evaluation");
    },
  },
  {
    key: "headache_primary_label_with_flag",
    level: "critical",
    provenance: "guideline",
    source: "ichd3",
    title: "Primary-headache label recorded alongside a secondary-headache flag",
    basis:
      "A primary headache diagnosis is made only when the secondary causes the flags point to have been excluded. A primary pattern is recorded here together with a secondary-headache flag.",
    fires: (values) => {
      const primary = ["Migraine without aura", "Migraine with aura", "Chronic migraine", "Tension-type headache", "Cluster headache or other trigeminal autonomic cephalalgia"];
      const flags = m(values, "neuro_headache", "hd_red_flags").filter((x) => x !== "None of these documented");
      return primary.includes(f(values, "neuro_headache", "hd_ichd_diagnosis")) && flags.length > 0;
    },
  },
  {
    key: "headache_medication_overuse",
    level: "warning",
    provenance: "guideline",
    source: "ichd3",
    title: "Medication-overuse pattern documented",
    basis:
      "ICHD-3 defines medication-overuse headache by headache days and acute-medicine days per month. The recorded values reach that pattern; the record should state the medicine class, because the day threshold differs between simple analgesics and other acute medicines.",
    fires: (values) => {
      const medicineDays = Number(bv(values, "neuro_headache").hd_acute_medicine_days);
      const headacheDays = Number(bv(values, "neuro_headache").hd_days_per_month);
      return Number.isFinite(medicineDays) && Number.isFinite(headacheDays) && medicineDays >= 10 && headacheDays >= 15;
    },
  },
  {
    key: "ms_criteria_not_assessable",
    level: "warning",
    provenance: "guideline",
    source: "mcdonald_2017",
    title: "Multiple sclerosis course recorded without assessable dissemination evidence",
    basis:
      "The diagnosis rests on documented dissemination in space and time. A disease course is recorded here while the dissemination evidence is not assessable or not documented, so the diagnosis cannot be confirmed from this note.",
    fires: (values) => {
      const course = f(values, "neuro_ms", "ms_course");
      if (!course || course === "Not established") return false;
      const space = f(values, "neuro_ms", "ms_dissemination_space");
      const time = f(values, "neuro_ms", "ms_dissemination_time");
      return ["", "Not assessable"].includes(space) || ["", "Not assessable"].includes(time);
    },
  },
  {
    key: "ms_monitoring_overdue",
    level: "warning",
    provenance: "guideline",
    source: "aan_ms",
    title: "Disease-modifying therapy monitoring recorded as overdue",
    basis:
      "The treatment review a multiple sclerosis note records includes the monitoring that therapy requires. The record states that monitoring is overdue.",
    fires: (values) => f(values, "neuro_ms", "ms_monitoring") === "Monitoring overdue",
  },
  {
    key: "neuromuscular_respiratory_not_measured",
    level: "critical",
    provenance: "guideline",
    source: "ean_gbs",
    title: "Respiratory warning symptoms documented without a measured vital capacity",
    basis:
      "In acute neuromuscular weakness, respiratory failure is detected by measuring ventilation, not by waiting for breathlessness. Respiratory symptoms are recorded and no vital capacity is recorded in this note.",
    fires: (values) => {
      const symptoms = m(values, "neuro_neuromuscular", "nm_respiratory_symptoms").filter((x) => x !== "None documented");
      return symptoms.length > 0 && !f(values, "neuro_neuromuscular", "nm_fvc");
    },
  },
  {
    key: "neuromuscular_ventilation_not_documented",
    level: "warning",
    provenance: "guideline",
    source: "ean_gbs",
    title: "Severe weakness recorded without the ventilatory status",
    basis:
      "The disability grade decides the level of care, and the ventilatory status has to be recorded beside it. Severe weakness is recorded with no ventilatory status documented.",
    fires: (values) => {
      const grade = f(values, "neuro_neuromuscular", "nm_gbs_grade");
      return (grade.startsWith("4") || grade.startsWith("5")) && !f(values, "neuro_neuromuscular", "nm_ventilation");
    },
  },
  {
    key: "reduced_consciousness_airway",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "GCS of 8 or less recorded — airway protection documented?",
    basis:
      "AMedix requires the airway decision to be recorded when the Glasgow Coma Scale is 8 or less. This is an institutional requirement, not a guideline recommendation.",
    fires: (values) => {
      const total = gcsTotal(values);
      return total !== null && total <= 8;
    },
  },
  {
    key: "pupil_asymmetry_without_neurosurgery",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "Pupillary abnormality recorded without a documented neurosurgical opinion",
    basis:
      "A fixed or asymmetric pupil with a falling conscious level is a herniation warning. AMedix requires the neurosurgical opinion to be recorded. This is an institutional requirement.",
    fires: (values) => {
      const pupils = f(values, "neuro_icp", "icp_pupils");
      const abnormal = pupils && pupils !== "Equal and reactive" && pupils !== "Not documented";
      return Boolean(abnormal) && f(values, "neuro_icp", "icp_neurosurgical") !== "Requested — time documented";
    },
  },
  {
    key: "cns_infection_lumbar_puncture",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "Suspected CNS infection without a documented lumbar puncture decision",
    basis:
      "Fever with meningeal signs requires the cerebrospinal fluid to be examined, or a documented reason why it was not. Neither is recorded in this note. This is an institutional requirement.",
    fires: (values) =>
      f(values, "neuro_cns_infection", "inf_fever") === "Present" &&
      f(values, "neuro_cns_infection", "inf_meningism") === "Present" &&
      ["", "Not documented"].includes(f(values, "neuro_cns_infection", "inf_lp_done")),
  },
  {
    key: "cns_infection_therapy_time",
    level: "warning",
    provenance: "local",
    source: "local",
    title: "Empirical therapy recorded without the time of the first dose",
    basis:
      "The time to the first antimicrobial dose is part of the CNS infection record. The agents are recorded and the time is not.",
    fires: (values) =>
      Boolean(f(values, "neuro_cns_infection", "inf_empirical_therapy")) && !f(values, "neuro_cns_infection", "inf_therapy_time"),
  },
  {
    key: "eeg_seizure_without_correlation",
    level: "warning",
    provenance: "guideline",
    source: "ilae_seizure_2017",
    title: "Electrographic seizure recorded without clinical correlation",
    basis:
      "An electrographic seizure pattern is interpreted together with what the patient was doing at the time. The pattern is recorded and the clinical correlation is not.",
    fires: (values) =>
      f(values, "neuro_eeg", "eeg_electrographic_seizure") === "Present" && !f(values, "neuro_eeg", "eeg_clinical_correlation"),
  },
  {
    key: "emg_without_reference_values",
    level: "warning",
    provenance: "guideline",
    source: "aan_polyneuropathy",
    title: "Nerve conduction interpretation recorded without the reference values",
    basis:
      "A conduction result is only interpretable against the normative values used. A pattern is recorded here without the reference values it was judged against.",
    fires: (values) =>
      Boolean(f(values, "neuro_emg", "emg_pattern")) && !f(values, "neuro_emg", "emg_reference_values"),
  },
];

// ---- Emergency-record rules ----------------------------------------------
// These read the emergency panel and fire only on what it records. They are
// advisory: they name the gap and the reason, never the treatment.
const emergencyState = (values) => neurologyEmergencyState(asObject(values).neuro_emergency);
const emergencyBlock = (state, key) => asObject(asObject(state.blocks)[key]);
const hasEmergency = (values, key) => neurologyEmergencyState(asObject(values).neuro_emergency).presentations.includes(key);

NEURO_SAFETY_RULES.push(
  {
    key: "emergency_pathway_unrecorded",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "An emergency is recorded with no urgent pathway",
    basis:
      "The emergency record names what the clinician found but not who was informed and at what time. The institution's deteriorating-patient policy requires that call to be recorded, because it is the only evidence that help was sought.",
    fires: (values) => {
      const state = emergencyState(values);
      if (!state.presentations.length) return false;
      return state.presentations.some((key) => {
        const pathway = asObject(emergencyBlock(state, key).pathway);
        return !str(pathway.who_informed) || !str(pathway.time_informed);
      });
    },
  },
  {
    key: "emergency_red_flag_without_record",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "A red flag is recorded with no emergency or pathway record",
    basis:
      "A red flag was ticked in the emergency screen, but no presentation was selected and no urgent pathway was recorded. The finding that prompted the flag is in the note; what happened about it is not.",
    fires: (values) => {
      const state = emergencyState(values);
      return state.red_flags.length > 0 && state.presentations.length === 0;
    },
  },
  {
    key: "emergency_herniation_unreported",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "Signs of impeding herniation are recorded without a recorded call",
    basis:
      "Pupil asymmetry, extensor posturing or a falling Glasgow Coma Scale with hypertension and bradycardia were recorded, but no time of escalation to a neurosurgeon or intensivist is in the record. These signs change within minutes.",
    fires: (values) => {
      const state = emergencyState(values);
      const herniation =
        state.presentations.includes("impending_herniation") ||
        state.presentations.includes("raised_icp") ||
        state.red_flags.includes("pupil_change") ||
        state.red_flags.includes("posturing");
      if (!herniation) return false;
      const keys = ["impending_herniation", "raised_icp"].filter((k) => state.presentations.includes(k));
      if (!keys.length) return true;
      return keys.every((key) => !str(asObject(emergencyBlock(state, key).pathway).time_informed));
    },
  },
  {
    key: "emergency_respiratory_not_measured",
    level: "critical",
    provenance: "guideline",
    source: "ean_gbs",
    title: "A neuromuscular emergency is recorded without a respiratory measurement",
    basis:
      "Guillain-Barré syndrome or myasthenic crisis was recorded with respiratory or bulbar compromise, but no vital capacity or single breath count is documented. Respiratory failure in these conditions develops before the patient looks distressed.",
    fires: (values) => {
      const state = emergencyState(values);
      const keys = ["gbs_respiratory_autonomic", "myasthenic_crisis"].filter((k) => state.presentations.includes(k));
      if (!keys.length) return false;
      return keys.some((key) => {
        const docs = asObject(emergencyBlock(state, key).docs);
        return !str(docs.vital_capacity) && !str(docs.single_breath);
      });
    },
  },
  {
    key: "emergency_stroke_timing_missing",
    level: "critical",
    provenance: "guideline",
    source: "aha_ais_2019",
    title: "Acute stroke recorded without the time last known well",
    basis:
      "The acute ischaemic stroke guideline decides reperfusion eligibility from the time the patient was last known to be at baseline. The emergency record names the stroke but carries no documented time.",
    fires: (values) => {
      if (!hasEmergency(values, "acute_ischaemic_stroke")) return false;
      const state = emergencyState(values);
      const docs = asObject(emergencyBlock(state, "acute_ischaemic_stroke").docs);
      const blockTime = str(asObject(asObject(values).neuro_stroke).str_last_known_well);
      return !str(docs.lkw) && !blockTime;
    },
  },
  {
    key: "med_allergy_conflict",
    level: "critical",
    provenance: "label",
    source: "local",
    title: "A documented allergy conflicts with a medicine recorded in this note",
    basis:
      "The medication record holds an allergen and a medicine from a group that cross-reacts with it. This is a product-label check: the prescriber and pharmacist verify the choice against the current label, and the reasoning for the medicine chosen is recorded.",
    fires: (values) => medIssues(values).some((i) => i.kind === "allergy"),
  },
  {
    key: "med_contraindication_conflict",
    level: "critical",
    provenance: "label",
    source: "local",
    title: "A documented contraindication fact conflicts with a medicine recorded in this note",
    basis:
      "A contraindication fact documented as present matches a medicine recorded in this note. The record must show the contraindication review, the decision and the clinician who made it.",
    fires: (values) => medIssues(values).some((i) => i.kind === "contraindication"),
  },
  {
    key: "med_interaction_conflict",
    level: "warning",
    provenance: "label",
    source: "local",
    title: "Two recorded medicines interact and the review is not recorded",
    basis:
      "Two medicines recorded in this note form a known interaction pair and the interaction review carries no conclusion. The interacting medicines are verified against the current product label before the next dose.",
    fires: (values) => medIssues(values).some((i) => i.kind === "interaction"),
  },
  {
    key: "med_adverse_effect_unactioned",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "An adverse effect is recorded with no action taken",
    basis:
      "A medicine in this note has an adverse effect recorded and no documented action. An adverse effect is never left without a recorded response and the clinician responsible.",
    fires: (values) => medIssues(values).some((i) => i.kind === "adverse"),
  },
  {
    key: "escalation_record_incomplete",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "A critical finding or escalation is recorded without the detail that makes it auditable",
    basis:
      "An escalation in this note is missing an element the record requires — the time the finding was identified, who was informed and when, or the acknowledgement of an immediate finding. The escalation was performed; the record must be completed.",
    fires: (values) => escIssues(values).some((i) => i.level === "immediate"),
  },
);

const LEVEL_LABEL = { critical: "ACT NOW", warning: "REVIEW" };

export const buildNeuroSafetyPrompts = ({ values }) => {
  const fired = NEURO_SAFETY_RULES.filter((rule) => {
    try {
      return Boolean(rule.fires(values || {}));
    } catch {
      // A rule that cannot evaluate the record stays silent rather than firing on a
      // guess.
      return false;
    }
  });
  return fired.map((rule) => ({
    key: rule.key,
    level: rule.level,
    title: rule.title,
    basis: rule.basis,
    provenanceLabel: NEURO_SAFETY_PROVENANCE[rule.provenance] || NEURO_SAFETY_PROVENANCE.local,
    source: REF(rule.source),
  }));
};

export const formatNeuroSafety = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const stored = Array.isArray(value.resolved) ? value.resolved : [];
  const actions = asObject(value.actions);
  const reasons = asObject(value.not_applicable);
  const lines = [];

  if (!stored.length) {
    lines.push(
      "No neurology safety prompt was triggered by the findings recorded in this note — this is not a statement that no urgent problem exists.",
    );
    return lines.join("\n");
  }

  lines.push(`Neurology safety prompts recorded in this note (${stored.length}):`);
  stored.forEach((p) => {
    lines.push(`[${LEVEL_LABEL[p.level] || "REVIEW"}] ${p.title}`);
    lines.push(`   Basis: ${p.basis}`);
    if (p.source) lines.push(`   Source: ${p.source.organization} — ${p.source.title}, ${p.source.edition}`);
    if (p.provenanceLabel) lines.push(`   Rule type: ${p.provenanceLabel}`);
    const action = str(actions[p.key]);
    const reason = str(reasons[p.key]);
    if (action) lines.push(`   Action taken: ${action}`);
    if (reason) lines.push(`   No action required because: ${reason}`);
    if (!action && !reason) lines.push("   Action not yet documented.");
  });

  return lines.join("\n");
};