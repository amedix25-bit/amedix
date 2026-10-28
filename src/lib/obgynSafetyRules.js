// Obstetric safety-prompt engine.
//
// WHAT IT DOES: reads only what the clinician documented in this note and
// returns prompts that state (a) what was documented, (b) how time-sensitive it
// is, and (c) which reference it rests on — with that reference's verification
// state shown. It never diagnoses, never prescribes, never orders, and never
// infers a finding from an unanswered field.
//
// WHAT IT DOES NOT DO: it does not create a finding. If nothing was documented,
// no prompt appears, and the panel says explicitly that this is not reassurance.
//
// LEVELS
//   immediate  — the documented situation needs action now, at the point of care
//   same_day   — needs assessment or escalation the same day
//   documented — a documentation or review gap to close, not an emergency
//
// SIGN-OFF: the triggers are AMedix local clinical decisions. Everything that is
// not backed by a reference verified at source is listed in
// OBGYN_SAFETY_APPROVAL_REQUIRED and is labelled as such in the note and PDF.

import { resolveObgynReference } from "@/lib/obgynReferences";

export const OBGYN_SAFETY_LEVELS = {
  immediate: "Act now",
  same_day: "Same day",
  documented: "Documented",
};

export const OBGYN_SAFETY_PROVENANCE = {
  source: "AMedix obstetric safety trigger set",
  build: "2026-10-28",
  note: "Local clinical triggers. Not a guideline, not a diagnosis and not a treatment order.",
};

// Concerns a clinician can raise directly, when the situation is not captured by
// a structured field (for example a presentation found on examination).
export const OBGYN_SAFETY_CONCERNS = [
  { key: "severe_hypertension", label: "Severe hypertension at this encounter", level: "immediate", reference_id: "who_pre_eclampsia_factsheet" },
  { key: "suspected_eclampsia", label: "Seizure or suspected eclampsia", level: "immediate", reference_id: "who_pre_eclampsia_factsheet" },
  { key: "ongoing_haemorrhage", label: "Ongoing heavy bleeding", level: "immediate", reference_id: "amedix_local_triage" },
  { key: "suspected_maternal_sepsis", label: "Suspected maternal sepsis", level: "immediate", reference_id: "rcog_sepsis" },
  { key: "ruptured_ectopic", label: "Suspected ruptured ectopic pregnancy", level: "immediate", reference_id: "acog_ectopic" },
  { key: "suspected_vte", label: "Suspected venous thromboembolism", level: "immediate", reference_id: "rcog_vte" },
  { key: "reduced_fetal_movement", label: "Reduced fetal movement reported", level: "same_day", reference_id: "figo_wellbeing" },
  { key: "non_reassuring_fetal_status", label: "Non-reassuring fetal status", level: "same_day", reference_id: "figo_wellbeing" },
  { key: "pprom", label: "Suspected prelabour rupture of membranes", level: "same_day", reference_id: "amedix_local_triage" },
  { key: "severe_headache_visual", label: "Severe headache or visual disturbance", level: "same_day", reference_id: "who_pre_eclampsia_factsheet" },
  { key: "reduced_urine_output", label: "Reduced urine output", level: "same_day", reference_id: "amedix_local_triage" },
  { key: "concern_other", label: "Other obstetric concern (documented in the note)", level: "same_day", reference_id: "amedix_local_triage" },
];

const concernByKey = OBGYN_SAFETY_CONCERNS.reduce((acc, c) => {
  acc[c.key] = c;
  return acc;
}, {});

const same = (value, ...options) => options.includes(value);

const prompt = (rule_key, level, title, message, reference_id) => {
  const ref = resolveObgynReference(reference_id);
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
    reference_note: ref ? ref.verification_note : "",
  };
};

// values = the whole note's field values (structured fields + concerns).
export function buildObgynSafetyPrompts(values, raisedConcerns) {
  const v = values || {};
  const out = [];

  const htn = v.htn_disorder;
  const severeFeatures = v.severe_features;
  const mgso4 = v.magnesium_sulphate_status;
  const pph = v.pph_status;
  const uterotonic = v.uterotonic_prophylaxis;
  const infection = v.maternal_infection_status;
  const vteRisk = v.vte_risk;
  const vteProphylaxis = v.vte_prophylaxis;
  const fetal = v.fetal_wellbeing;
  const ectopic = v.ectopic_status;

  // ---- Hypertensive disorders ---------------------------------------------
  if (htn === "Eclampsia") {
    out.push(
      prompt(
        "eclampsia_documented",
        "immediate",
        "Eclampsia documented",
        "Eclampsia is recorded in this note. Document the airway and seizure management, the antihypertensive " +
          "treatment given and the magnesium sulfate course — or the documented reason none was given — before the " +
          "note is signed.",
        "who_pre_eclampsia_factsheet"
      )
    );
  }

  if (htn === "Pre-eclampsia with severe features documented") {
    out.push(
      prompt(
        "severe_preeclampsia_documented",
        "immediate",
        "Pre-eclampsia with severe features documented",
        "Severe pre-eclampsia is recorded. Document the antihypertensive treatment, the magnesium sulfate decision, " +
          "the fetal assessment and the delivery plan in the note.",
        "who_pre_eclampsia_factsheet"
      )
    );
  }

  if (severeFeatures === "Severe-range blood pressure documented") {
    out.push(
      prompt(
        "severe_range_bp_documented",
        "immediate",
        "Severe-range blood pressure documented",
        "A severe-range blood pressure is documented at this encounter. Record the treatment given and the repeat " +
          "measurement after treatment.",
        "who_severe_hypertension_2018"
      )
    );
  }

  if (
    same(severeFeatures, "Neurological symptoms documented", "Renal or hepatic involvement documented", "Haematological involvement documented")
  ) {
    out.push(
      prompt(
        "end_organ_feature_documented",
        "immediate",
        "Feature of severe pre-eclampsia documented",
        "A symptom or end-organ feature of severe pre-eclampsia is recorded. Document the assessment, the treatment " +
          "and the decision taken at this encounter.",
        "who_pre_eclampsia_factsheet"
      )
    );
  }

  if (
    same(htn, "Eclampsia", "Pre-eclampsia with severe features documented") &&
    mgso4 === "Not given — documented reason"
  ) {
    out.push(
      prompt(
        "magnesium_not_given_reason_required",
        "same_day",
        "Magnesium sulfate not given",
        "Magnesium sulfate is recorded as not given. The documented reason is part of the record — confirm it is " +
          "written in this note and that the decision was reviewed by the responsible clinician.",
        "who_pre_eclampsia_factsheet"
      )
    );
  }

  if (
    same(htn, "Eclampsia", "Pre-eclampsia with severe features documented") &&
    same(mgso4, "Not documented", "")
  ) {
    out.push(
      prompt(
        "magnesium_decision_not_documented",
        "documented",
        "Magnesium sulfate decision not documented",
        "Severe pre-eclampsia or eclampsia is documented but no magnesium sulfate decision is recorded. Document the " +
          "decision and the reason — this is the prevention WHO describes for progression to eclampsia.",
        "who_pre_eclampsia_factsheet"
      )
    );
  }

  // ---- Haemorrhage ---------------------------------------------------------
  if (pph === "Bleeding ongoing at time of documentation") {
    out.push(
      prompt(
        "haemorrhage_ongoing",
        "immediate",
        "Haemorrhage ongoing at this encounter",
        "Bleeding is recorded as ongoing. Document the uterotonics given, the resuscitation, the haemostatic measures " +
          "and who was called, then record the time each step was taken.",
        "who_pph"
      )
    );
  }

  if (pph === "Massive transfusion or hysterectomy required") {
    out.push(
      prompt(
        "haemorrhage_massive",
        "immediate",
        "Massive haemorrhage documented",
        "Massive transfusion or hysterectomy is recorded. Document the resuscitation, the team involved and the " +
          "post-event debrief, and record the blood products given.",
        "who_pph"
      )
    );
  }

  if (pph === "Postpartum haemorrhage documented — bleeding controlled") {
    out.push(
      prompt(
        "haemorrhage_documented",
        "documented",
        "Postpartum haemorrhage documented",
        "A postpartum haemorrhage is recorded and bleeding is documented as controlled. Record the cause identified, " +
          "the treatment given and the plan for the next 24 hours.",
        "who_pph"
      )
    );
  }

  if (
    same(pph, "Postpartum haemorrhage documented — bleeding controlled", "Bleeding ongoing at time of documentation", "Massive transfusion or hysterectomy required") === false &&
    uterotonic === "Not documented"
  ) {
    out.push(
      prompt(
        "uterotonic_prophylaxis_not_documented",
        "documented",
        "Uterotonic prophylaxis not documented",
        "No uterotonic prophylaxis is recorded for this birth. Document what was given, or the documented reason it " +
          "was not.",
        "who_pph"
      )
    );
  }

  // ---- Infection, thrombosis, fetal status, ectopic -----------------------
  if (same(infection, "Sepsis suspected — assessment documented", "Sepsis confirmed — treatment documented")) {
    out.push(
      prompt(
        "maternal_sepsis",
        "immediate",
        "Maternal sepsis documented",
        "Sepsis is recorded. Document the source, the antimicrobials given and their timing, the fluid resuscitation " +
          "and the escalation — and keep the note consistent with the observation chart.",
        "rcog_sepsis"
      )
    );
  }

  if (vteRisk === "High" && same(vteProphylaxis, "Not prescribed", "")) {
    out.push(
      prompt(
        "vte_prophylaxis_gap",
        "documented",
        "High thrombotic risk with no prophylaxis documented",
        "A high venous thromboembolism risk is recorded without prophylaxis. Document the risk assessment, the " +
          "decision and the reason if prophylaxis is withheld.",
        "rcog_vte"
      )
    );
  }

  if (fetal === "Non-reassuring — escalation documented") {
    out.push(
      prompt(
        "fetal_status_non_reassuring",
        "same_day",
        "Non-reassuring fetal status documented",
        "Fetal status is recorded as non-reassuring. Document the monitoring used, the action taken and the time it " +
          "was taken, and record the delivery decision if one was made.",
        "figo_wellbeing"
      )
    );
  }

  if (same(ectopic, "Confirmed — ruptured", "Suspected — assessment documented")) {
    out.push(
      prompt(
        ectopic === "Confirmed — ruptured" ? "ectopic_ruptured" : "ectopic_suspected",
        "immediate",
        ectopic === "Confirmed — ruptured" ? "Ruptured ectopic pregnancy documented" : "Ectopic pregnancy suspected",
        "Ectopic pregnancy is recorded at this encounter. Document the haemodynamic status, the investigation result, " +
          "the treatment decision and the arrangements for theatre or follow-up.",
        "acog_ectopic"
      )
    );
  }

  // ---- Concerns raised directly by the clinician --------------------------
  // Keys come from the safety field; the stored note may also hold the human
  // labels, so both are accepted and normalised here.
  const concerns = (Array.isArray(raisedConcerns) ? raisedConcerns : Array.isArray(v.obgyn_concerns) ? v.obgyn_concerns : []).map(
    (entry) => (concernByKey[entry] ? entry : Object.keys(concernByKey).find((k) => concernByKey[k].label === entry) || entry)
  );
  concerns.forEach((key) => {
    const c = concernByKey[key];
    if (!c) return;
    out.push(prompt(`concern_${c.key}`, c.level, c.label, "Raised by the clinician for this encounter. Document the assessment, the action taken and who was involved.", c.reference_id));
  });

  // Highest time-sensitivity first, then a stable order.
  const rank = { immediate: 0, same_day: 1, documented: 2 };
  return out.sort((a, b) => (rank[a.level] ?? 9) - (rank[b.level] ?? 9));
}

// Written into the note (and the PDF) exactly as stored at signing time.
export function formatObgynSafety(value) {
  const entries = Array.isArray(value) ? value : Array.isArray(value?.prompts) ? value.prompts : [];
  if (!entries.length) {
    return "No safety prompt was raised by the findings documented in this note. This is not a statement that no urgent problem is present.";
  }
  const lines = entries.map((e) => {
    const level = OBGYN_SAFETY_LEVELS[e.level] || e.level || "";
    const state = e.reference_verified ? "reference verified at source" : "reference NOT verified in this build";
    return (
      `[${level}] ${e.title || e.rule_key} — ${e.message || ""}` +
      (e.action_taken ? ` — Action documented: ${String(e.action_taken).trim()}` : " — Action not documented") +
      (e.acknowledged_datetime ? ` — Recorded ${e.acknowledged_datetime}` : "") +
      (e.reference_label ? ` — Reference: ${e.reference_label} (${state})` : "")
    );
  });
  lines.push(`Source: ${OBGYN_SAFETY_PROVENANCE.source} · ${OBGYN_SAFETY_PROVENANCE.build} · ${OBGYN_SAFETY_PROVENANCE.note}`);
  return lines.join("\n");
}

// Triggers without a reference verified at source: named so they can be signed
// off explicitly instead of being assumed to be guideline-backed.
export const OBGYN_SAFETY_APPROVAL_REQUIRED = [
  { rule: "haemorrhage_ongoing / haemorrhage_massive / haemorrhage_documented", needs: "WHO and FIGO postpartum haemorrhage guidance confirmed at source" },
  { rule: "uterotonic_prophylaxis_not_documented", needs: "WHO uterotonic prophylaxis guidance confirmed at source" },
  { rule: "maternal_sepsis", needs: "RCOG maternal sepsis guidance number and version confirmed at source" },
  { rule: "vte_prophylaxis_gap", needs: "RCOG venous thromboembolism guidance number and version confirmed at source" },
  { rule: "fetal_status_non_reassuring", needs: "FIGO intrapartum fetal monitoring guidance confirmed at source" },
  { rule: "ectopic_ruptured / ectopic_suspected", needs: "ACOG tubal ectopic pregnancy guidance number and version confirmed at source" },
  { rule: "all levels", needs: "Obstetric sign-off of the AMedix trigger levels and wording" },
];