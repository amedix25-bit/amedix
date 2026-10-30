// Emergency Medicine safety-prompt engine.
//
// WHAT IT DOES: reads only what the clinician documented in this note and returns
// prompts that state (a) what was documented, (b) how time-sensitive it is, and
// (c) which reference it rests on — with that reference's verification state and
// its evidence type shown. It never diagnoses, never prescribes, never orders,
// and never infers a finding from an unanswered field.
//
// WHAT IT DOES NOT DO: it does not create a finding. If nothing was documented,
// no prompt appears, and the panel says explicitly that this is not reassurance.
//
// LEVELS
//   immediate  — the documented situation needs action now, at the point of care
//   same_day   — needs assessment, escalation or documentation the same day
//   documented — a documentation or review gap to close, not an emergency
//
// SIGN-OFF: where a guideline's recommendation text was verified at source, the
// prompt cites it. Where it was not, the prompt says so and the trigger is listed
// in EMERGENCY_SAFETY_APPROVAL_REQUIRED. AMedix never claims that a guideline has
// been implemented or that the department is compliant.

import { resolveEmergencyReference } from "./emergencyReferences.js";

export const EMERGENCY_SAFETY_LEVELS = {
  immediate: "Act now",
  same_day: "Same day",
  documented: "Documented",
};

export const EMERGENCY_SAFETY_PROVENANCE = {
  source: "AMedix emergency safety trigger set",
  build: "2026-10-29",
  note:
    "Local documentation triggers. Not a guideline, not a diagnosis, not a treatment order, and not a claim of " +
    "compliance with any guideline.",
};

export const EMERGENCY_SAFETY_CONCERNS = [
  { key: "chest_pain_acs", label: "Chest pain — possible acute coronary syndrome", level: "immediate", reference_id: "acep_clinical_policies" },
  { key: "stroke_symptoms", label: "Focal neurological deficit — possible stroke", level: "immediate", reference_id: "who_bec" },
  { key: "sepsis_concern", label: "Possible sepsis or septic shock", level: "immediate", reference_id: "ssc_2021" },
  { key: "major_trauma", label: "Major trauma", level: "immediate", reference_id: "acs_atls_11" },
  { key: "anaphylaxis_concern", label: "Possible anaphylaxis", level: "immediate", reference_id: "amedix_local_triage" },
  { key: "poisoning_concern", label: "Poisoning or toxic exposure", level: "same_day", reference_id: "amedix_local_triage" },
  { key: "head_injury_concern", label: "Head injury with altered consciousness", level: "immediate", reference_id: "btf_severe_tbi_4" },
  { key: "severe_pain", label: "Severe uncontrolled pain", level: "same_day", reference_id: "amedix_local_triage" },
  { key: "agitation_self_harm", label: "Agitation or self-harm risk", level: "same_day", reference_id: "acep_clinical_policies" },
  { key: "obstetric_emergency", label: "Obstetric emergency", level: "immediate", reference_id: "amedix_local_triage" },
  { key: "concern_other", label: "Other emergency concern (documented in the note)", level: "same_day", reference_id: "amedix_local_triage" },
];

const prompt = (rule_key, level, title, message, reference_id) => {
  const ref = resolveEmergencyReference(reference_id);
  return {
    rule_key,
    level,
    title,
    message,
    reference_id,
    reference_label: ref
      ? `${ref.organisation} — ${ref.title}${ref.edition ? ` (${ref.edition})` : ""}`
      : "",
    reference_verified: Boolean(ref && ref.text_verified),
    reference_evidence_type: ref ? ref.evidence_type : "",
    reference_note: ref ? ref.verification_note : "",
  };
};

const has = (v, ...values) => values.includes(v);
const filled = (v) => typeof v === "string" && v.trim() !== "";

// The time-critical presentations a note can record. Kept in one place so the
// template select and the rules below can never drift apart.
export const EMERGENCY_TIME_CRITICAL_OPTIONS = [
  "Cardiac arrest",
  "Peri-arrest or ROSC after arrest",
  "Suspected acute coronary syndrome",
  "ST-elevation myocardial infarction (STEMI) confirmed",
  "Suspected stroke",
  "Intracranial haemorrhage confirmed",
  "Sepsis — no shock documented",
  "Septic shock documented",
  "Major trauma",
  "Severe traumatic brain injury (GCS 3–8 documented)",
  "Airway compromise",
  "Respiratory failure or severe respiratory distress",
  "Major haemorrhage",
  "Anaphylaxis",
  "Status epilepticus",
  "Severe hypoglycaemia",
  "Poisoning or toxic exposure",
  "Obstetric emergency",
  "Other time-critical condition (documented in the note)",
  "None identified at this encounter",
  "Not documented",
];

const CARDIAC = ["Suspected acute coronary syndrome", "ST-elevation myocardial infarction (STEMI) confirmed"];
const ARREST = ["Cardiac arrest", "Peri-arrest or ROSC after arrest"];

// values = the whole note's field values (structured fields + concerns).
// capabilities = what THIS template can record (declared in the template, not
// inferred): { icd: boolean, discharge: boolean, dischargeAlways: boolean }.
// It stops a document that cannot code a diagnosis, or cannot discharge a
// patient, from producing a prompt it can never satisfy.
export function buildEmergencySafetyPrompts(values, raisedConcerns, capabilities) {
  const v = values || {};
  const caps = capabilities || {};
  const concerns = Array.isArray(raisedConcerns) ? raisedConcerns : [];
  const out = [];

  const tc = v.ec_time_critical;
  const airway = v.ec_airway;
  const breathing = v.ec_breathing;
  const circulation = v.ec_circulation;
  const consciousness = v.ec_consciousness;
  const sepsis = v.ec_sepsis_severity;
  const antimicrobial = v.ec_antimicrobial_time;
  const lactate = v.ec_lactate;
  const reperfusion = v.ec_reperfusion;
  const redFlags = v.ec_red_flags;
  const reassessment = v.ec_reassessment;
  const headSeverity = v.ec_head_injury_severity;
  const anticoag = v.ec_anticoagulant;
  const pathway = v.ec_pathway;
  const safetyNet = v.ec_safety_netting;
  const followUp = v.ec_followup_plan;
  const transferAccepted = v.ec_transfer_accepted;
  const debrief = v.ec_debrief;
  const postRosc = v.ec_post_rosc_bundle;
  const consent = v.ec_procedure_consent;
  const disposition = v.disposition;
  const coded = Array.isArray(v.icd11_diagnoses) ? v.icd11_diagnoses : [];
  const canDischarge = caps.discharge === true || caps.dischargeAlways === true;
  const discharged =
    canDischarge && (has(disposition, "Discharge", "Left Against Medical Advice") || caps.dischargeAlways === true);

  // ---- Immediately time-critical documented situations --------------------
  if (has(tc, ...ARREST) || has(v.ec_arrest_witnessed, "Yes — witnessed arrest")) {
    out.push(
      prompt(
        "cardiac_arrest_documented",
        "immediate",
        "Cardiac arrest documented",
        "An arrest is recorded in this note. Record the arrest and first-shock times, the initial rhythm, the shocks " +
          "and drugs given with their times, the return of spontaneous circulation (or the reason resuscitation " +
          "stopped), and where the patient went next — before the record is signed.",
        "aha_2025_als"
      )
    );
  }

  if (
    (has(tc, "Peri-arrest or ROSC after arrest") || filled(v.ec_rosc_time)) &&
    !has(postRosc, "Documented")
  ) {
    out.push(
      prompt(
        "post_rosc_bundle",
        "immediate",
        "Return of spontaneous circulation — post-arrest care not documented",
        "ROSC is recorded but post-arrest care is not documented. Record the airway and ventilation, haemodynamics, " +
          "neurological status, the target temperature decision and the destination.",
        "aha_2025_post_arrest"
      )
    );
  }

  if (has(tc, ...CARDIAC)) {
    if (!has(reperfusion, "Pathway activated", "Assessed — not eligible, reason documented")) {
      out.push(
        prompt(
          "acs_reperfusion_pathway",
          "immediate",
          "Possible acute coronary syndrome — reperfusion pathway not documented",
          "An acute coronary syndrome is recorded without a documented reperfusion decision. Record the ECG time and " +
            "finding, whether the reperfusion pathway was activated, or the documented reason it was not.",
          "acep_clinical_policies"
        )
      );
    }
    out.push(
      prompt(
        "acs_times_recorded",
        "same_day",
        "Acute coronary syndrome — record the diagnostic times",
        "Record symptom onset, first medical contact, ECG time and the disposition decision time so the time-critical " +
          "course can be audited.",
        "acep_clinical_policies"
      )
    );
  }

  if (has(tc, "Suspected stroke") || has(tc, "Intracranial haemorrhage confirmed")) {
    out.push(
      prompt(
        "stroke_time_critical",
        "immediate",
        "Stroke pathway documented",
        "A stroke or intracranial haemorrhage is recorded. Document the time last known well, the neurological findings " +
          "and their time, the imaging time and result, and the reperfusion or admission decision with its reason.",
        "who_bec"
      )
    );
    if (!filled(v.ec_symptom_onset)) {
      out.push(
        prompt(
          "stroke_last_known_well_missing",
          "immediate",
          "Time last known well not recorded",
          "No symptom onset or last-known-well time is recorded for a suspected stroke. Record it — without it, " +
            "time-based eligibility cannot be reviewed.",
          "amedix_local_triage"
        )
      );
    }
  }

  if (has(sepsis, "Septic shock documented")) {
    out.push(
      prompt(
        "septic_shock_documented",
        "immediate",
        "Septic shock documented",
        "Septic shock is recorded. The guidelines the app has verified state that antimicrobials should be given " +
          "immediately, ideally within 1 hour of recognition, and that at least 30 mL/kg of IV crystalloid is suggested " +
          "within the first 3 hours for sepsis-induced hypoperfusion. Record what was given and when.",
        "ssc_2021"
      )
    );
    if (!has(antimicrobial, "Within 1 hour of recognition")) {
      out.push(
        prompt(
          "antimicrobial_timing_not_documented",
          "immediate",
          "Antimicrobial timing not documented to 1 hour",
          "Septic shock is recorded but antimicrobial timing within 1 hour is not recorded. Document the time " +
            "antimicrobials were given, or the documented reason they were delayed.",
          "ssc_2021"
        )
      );
    }
  }

  if (has(sepsis, "Sepsis documented — no shock")) {
    out.push(
      prompt(
        "sepsis_without_shock",
        "same_day",
        "Sepsis documented without shock",
        "Sepsis without shock is recorded. The verified guideline suggests a time-limited course of rapid " +
          "investigation, with antimicrobials within 3 hours of recognition if concern for infection persists. Record " +
          "the assessment and the timing.",
        "ssc_2021"
      )
    );
  }

  if (has(sepsis, "Sepsis documented — no shock", "Septic shock documented") && has(lactate, "Not measured — reason documented", "Not documented")) {
    out.push(
      prompt(
        "lactate_not_recorded",
        "same_day",
        "Lactate not recorded in documented sepsis",
        "Sepsis is recorded and no lactate measurement is documented. The verified guideline suggests measuring blood " +
          "lactate in suspected sepsis; record the value or the documented reason it was not measured.",
        "ssc_2021"
      )
    );
  }

  if (has(airway, "Compromised — intervention documented")) {
    out.push(
      prompt(
        "airway_compromise",
        "immediate",
        "Airway compromise documented",
        "Airway compromise is recorded. Document the intervention, who performed it, the number of attempts, the " +
          "confirmation method and the post-intervention course.",
        "who_bec"
      )
    );
  }

  if (has(breathing, "Inadequate — escalation documented")) {
    out.push(
      prompt(
        "breathing_inadequate",
        "immediate",
        "Inadequate breathing documented",
        "Inadequate breathing or ventilation is recorded. Document the support given, the response and the escalation.",
        "who_bec"
      )
    );
  }

  if (has(circulation, "Vasopressor or blood product support documented", "Peri-arrest — resuscitation documented")) {
    out.push(
      prompt(
        "haemodynamic_support",
        "immediate",
        "Haemodynamic support documented",
        "Vasopressor, blood-product or peri-arrest support is recorded. Document the resuscitation given, the " +
          "monitoring used and the response, with times.",
        "east_damage_control_resuscitation"
      )
    );
  }

  if (has(tc, "Major haemorrhage")) {
    out.push(
      prompt(
        "major_haemorrhage",
        "immediate",
        "Major haemorrhage documented",
        "Major haemorrhage is recorded. Document the source control attempted, the blood products and tranexamic acid " +
          "with times, the massive-transfusion activation, and the response.",
        "east_damage_control_resuscitation"
      )
    );
  }

  if (has(tc, "Severe traumatic brain injury (GCS 3–8 documented)") || has(headSeverity, "Severe (GCS 3–8 documented)")) {
    out.push(
      prompt(
        "severe_tbi",
        "immediate",
        "Severe traumatic brain injury documented",
        "A severe traumatic brain injury (GCS 3–8 after resuscitation) is recorded. The verified Brain Trauma " +
          "Foundation statement concerns intracranial pressure monitoring in salvageable patients with an abnormal CT; " +
          "record the CT finding and the monitoring decision, or the documented reason.",
        "btf_severe_tbi_4"
      )
    );
  }

  if (
    has(headSeverity, "Mild (GCS 13–15 documented)", "Moderate (GCS 9–12 documented)", "Severe (GCS 3–8 documented)") &&
    has(anticoag, "On anticoagulant — reversal/decision NOT documented")
  ) {
    out.push(
      prompt(
        "anticoagulated_head_injury",
        "same_day",
        "Head injury on an anticoagulant — decision not documented",
        "A head injury is recorded in a patient on an anticoagulant, without a documented reversal or observation " +
          "decision. Record the agent, the last dose, the imaging and the decision made.",
        "amedix_local_triage"
      )
    );
  }

  if (has(tc, "Anaphylaxis")) {
    out.push(
      prompt(
        "anaphylaxis_documented",
        "immediate",
        "Anaphylaxis documented",
        "Anaphylaxis is recorded. Document the trigger suspected, the adrenaline dose and route with times, the " +
          "adjunctive treatment, the response and the observation period.",
        "amedix_local_triage"
      )
    );
  }

  if (has(tc, "Status epilepticus")) {
    out.push(
      prompt(
        "status_epilepticus_documented",
        "immediate",
        "Status epilepticus documented",
        "Status epilepticus is recorded. Document the seizure onset time, the glucose, the agents given with times, " +
          "the response, and the escalation if seizures continued.",
        "acep_clinical_policies"
      )
    );
  }

  if (has(tc, "Severe hypoglycaemia")) {
    out.push(
      prompt(
        "hypoglycaemia_documented",
        "immediate",
        "Severe hypoglycaemia documented",
        "Severe hypoglycaemia is recorded. Document the glucose value, the treatment given, the response and the " +
          "reason for the episode, and observe until the glucose is stable.",
        "who_bec"
      )
    );
  }

  if (has(tc, "Poisoning or toxic exposure")) {
    out.push(
      prompt(
        "poisoning_documented",
        "same_day",
        "Poisoning or toxic exposure documented",
        "A poisoning or exposure is recorded. Document the substance, the dose and the time, the toxidrome, the " +
          "observation period, and whether a poisons service or antidote decision was documented.",
        "amedix_local_triage"
      )
    );
  }

  // ---- Documentation gaps on time-critical encounters ---------------------
  if (has(redFlags, "Not screened — reason documented", "Unable to screen — reason documented")) {
    out.push(
      prompt(
        "red_flags_not_screened",
        "documented",
        "Red-flag screen not completed",
        "The red-flag screen is recorded as not completed. Record the reason and the alternative assessment used — an " +
          "unscreened patient is not a screened patient.",
        "amedix_local_triage"
      )
    );
  }

  if (has(tc, "Not documented")) {
    out.push(
      prompt(
        "time_critical_not_documented",
        "documented",
        "Time-critical assessment not documented",
        "No time-critical condition field has been recorded. Complete it — including \"None identified at this " +
          "encounter\" — so the note shows the assessment was made, not merely left empty.",
        "amedix_local_triage"
      )
    );
  }

  if (filled(tc) && !has(tc, "None identified at this encounter", "Not documented") && (!filled(v.ec_symptom_onset) || !filled(v.ec_first_contact))) {
    out.push(
      prompt(
        "critical_times_incomplete",
        "documented",
        "Time-critical times incomplete",
        "A time-critical condition is recorded but the symptom-onset or first-medical-contact time is missing. Record " +
          "both so the time course can be reviewed.",
        "amedix_local_triage"
      )
    );
  }

  if (filled(tc) && !has(tc, "None identified at this encounter", "Not documented") && has(pathway, "Not documented", "")) {
    out.push(
      prompt(
        "pathway_not_documented",
        "documented",
        "Time-critical pathway not documented",
        "A time-critical condition is recorded but no pathway activation is documented. Record which pathway was " +
          "activated, or that none applies and why.",
        "amedix_local_triage"
      )
    );
  }

  if (has(reassessment, "Not documented")) {
    out.push(
      prompt(
        "reassessment_not_documented",
        "documented",
        "Reassessment not documented",
        "No reassessment is recorded. Document the reassessment (or that it is pending with a time planned) — an " +
          "emergency note without a reassessment cannot show the response to treatment.",
        "amedix_local_triage"
      )
    );
  }

  if (
    caps.icd === true &&
    filled(tc) &&
    !has(tc, "None identified at this encounter", "Not documented") &&
    coded.filter((d) => d && d.display).length === 0
  ) {
    out.push(
      prompt(
        "icd11_not_recorded",
        "documented",
        "No ICD-11 diagnosis recorded for a time-critical encounter",
        "A time-critical condition is documented without a coded diagnosis. Record the working diagnosis in the ICD-11 " +
          "field with its role, status and mapping state — or record it as unresolved so coding review is raised.",
        "icd11_mms"
      )
    );
  }

  if (discharged && has(safetyNet, "Not documented")) {
    out.push(
      prompt(
        "safety_netting_missing",
        "documented",
        "Discharged without documented safety-netting",
        "The patient is recorded as discharged or leaving against advice without documented return advice. Record the " +
          "warning signs given and how they were given.",
        "amedix_local_triage"
      )
    );
  }

  if (discharged && has(followUp, "Not arranged")) {
    out.push(
      prompt(
        "followup_not_arranged",
        "documented",
        "Discharge with no follow-up arranged",
        "The patient is discharged with no follow-up arranged. Record the follow-up plan, or the documented reason none " +
          "is needed.",
        "amedix_local_triage"
      )
    );
  }

  if (has(transferAccepted, "Not documented")) {
    out.push(
      prompt(
        "transfer_acceptance_missing",
        "same_day",
        "Transfer without documented acceptance",
        "A transfer is recorded without documented acceptance by the receiving facility. Record who accepted, when, " +
          "and the monitoring and escort arranged.",
        "east_handoffs"
      )
    );
  }

  if (has(debrief, "Not documented", "Offered — not yet held")) {
    out.push(
      prompt(
        "debrief_not_recorded",
        "documented",
        "Team debrief not documented",
        "A debrief is recorded as not held or not documented. Record the debrief, or the plan to hold it — this is a " +
          "local documentation standard, not a guideline requirement.",
        "amedix_local_triage"
      )
    );
  }

  if (has(consent, "Not documented")) {
    out.push(
      prompt(
        "procedure_consent_not_documented",
        "documented",
        "Procedure consent not documented",
        "No consent is documented for the procedure. Record the consent, or the emergency and the reason it could not " +
          "be obtained.",
        "amedix_local_triage"
      )
    );
  }

  if (has(consciousness, "Unresponsive") && !has(v.ec_glucose, "Measured — value documented")) {
    out.push(
      prompt(
        "glucose_not_measured",
        "same_day",
        "Reduced consciousness without a documented glucose",
        "Reduced consciousness is recorded without a documented glucose measurement. Record the glucose — a treatable " +
          "cause that is easily missed.",
        "who_bec"
      )
    );
  }

  // ---- Concerns raised directly by the clinician --------------------------
  concerns.forEach((key) => {
    const concern = EMERGENCY_SAFETY_CONCERNS.find((c) => c.key === key);
    if (!concern) return;
    out.push(
      prompt(
        `concern_${concern.key}`,
        concern.level,
        concern.label,
        "Raised as a clinical concern at this encounter. Record the findings that raised it, the assessment made, the " +
          "action taken and the response.",
        concern.reference_id
      )
    );
  });

  const seen = new Set();
  const unique = out.filter((p) => {
    if (seen.has(p.rule_key)) return false;
    seen.add(p.rule_key);
    return true;
  });

  const rank = { immediate: 0, same_day: 1, documented: 2 };
  return unique.sort((a, b) => (rank[a.level] ?? 9) - (rank[b.level] ?? 9));
}

// Written into the note (and the PDF) exactly as stored at signing time.
export function formatEmergencySafety(value) {
  const entries = Array.isArray(value) ? value : Array.isArray(value?.prompts) ? value.prompts : [];
  if (!entries.length) {
    return (
      "No safety prompt was raised by the findings documented in this note. This is not a statement that no urgent " +
      "problem is present."
    );
  }
  const lines = entries.map((e) => {
    const level = EMERGENCY_SAFETY_LEVELS[e.level] || e.level || "";
    const state = e.reference_verified ? "reference verified at source" : "reference NOT verified in this build";
    const type = e.reference_evidence_type ? ` [${e.reference_evidence_type.replace(/_/g, " ")}]` : "";
    return (
      `[${level}] ${e.title || e.rule_key} — ${e.message || ""}` +
      (e.action_taken ? ` — Action documented: ${String(e.action_taken).trim()}` : " — Action not documented") +
      (e.acknowledged_datetime ? ` — Recorded ${e.acknowledged_datetime}` : "") +
      (e.reference_label ? ` — Reference: ${e.reference_label}${type} (${state})` : "")
    );
  });
  lines.push(`Source: ${EMERGENCY_SAFETY_PROVENANCE.source} · ${EMERGENCY_SAFETY_PROVENANCE.build} · ${EMERGENCY_SAFETY_PROVENANCE.note}`);
  return lines.join("\n");
}

// Triggers without a reference whose recommendation text was verified at source:
// named so they can be signed off explicitly instead of being assumed.
export const EMERGENCY_SAFETY_APPROVAL_REQUIRED = [
  { rule: "cardiac_arrest_documented / post_rosc_bundle / cardiac rhythm prompts", needs: "AHA 2025 ALS and post-arrest recommendation text confirmed at source (only titles and abstracts were verified)" },
  { rule: "acs_reperfusion_pathway / acs_times_recorded", needs: "ACEP acute coronary syndrome and STEMI reperfusion policy text and years confirmed at source (pages require member sign-in)" },
  { rule: "stroke_time_critical / stroke_last_known_well_missing", needs: "Local stroke pathway thresholds and eligibility windows signed off by the emergency department lead" },
  { rule: "severe_tbi", needs: "Brain Trauma Foundation 4th edition statements other than the ICP statement confirmed at source" },
  { rule: "anticoagulated_head_injury", needs: "Local head-injury anticoagulation reversal protocol sign-off" },
  { rule: "major_haemorrhage / haemodynamic_support", needs: "EAST damage control resuscitation recommendation text confirmed at source" },
  { rule: "transfer_acceptance_missing", needs: "EAST handoffs recommendation text confirmed; local transfer acceptance policy confirmed" },
  { rule: "status_epilepticus_documented", needs: "ACEP seizure clinical policy text and year confirmed at source" },
  { rule: "all local prompts (pathway_not_documented, safety_netting_missing, followup_not_arranged, glucose_not_measured, debrief_not_recorded)", needs: "Emergency department sign-off of the AMedix local trigger wording and levels" },
  { rule: "all levels", needs: "Emergency medicine consultant sign-off of the trigger set before clinical use" },
];