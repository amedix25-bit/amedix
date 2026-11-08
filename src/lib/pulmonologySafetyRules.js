// Pulmonology / Respiratory Medicine — advisory documentation prompts.
//
// Each prompt fires ONLY from documentation that is missing or internally
// inconsistent inside the note itself. It names the guidance it comes from, says
// what that guidance requires to be recorded, and leaves the decision — including
// the decision not to follow the prompt — to the clinician, who documents it.
//
// WHAT THESE PROMPTS NEVER DO
//   · They never block saving, signing or releasing a note.
//   · They never order treatment, calculate a dose or withhold therapy.
//   · They never change, suggest or confirm a diagnosis.
//   · They never read a blank field as normal, absent, negative or excluded.

import { PULMONOLOGY_REFERENCES } from "@/lib/pulmonologyReferences";

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const str = (v) => String(v ?? "").trim();
const list = (v) => (Array.isArray(v) ? v.filter((x) => str(x)) : str(v) ? [str(v)] : []);
const blank = (v) => !str(v) && !(Array.isArray(v) && v.length);
const block = (values, key) => asObject(values?.[key]);

const rule = (key, level, title, basis, action, refKey) => ({
  key,
  level,
  title,
  basis,
  action,
  provenance: refKey,
  source: PULMONOLOGY_REFERENCES[refKey] || null,
});

export const buildPulmonologySafetyPrompts = ({ values, noteKey }) => {
  const prompts = [];
  const symptoms = block(values, "pulm_symptoms");
  const exam = block(values, "pulm_exam");
  const inhaler = block(values, "pulm_inhaler_device");
  const exac = block(values, "pulm_exacerbation");
  const oxygen = block(values, "pulm_oxygen");
  const lungFunction = block(values, "pulm_lung_function");
  const asthma = block(values, "pulm_asthma");
  const copd = block(values, "pulm_copd");
  const ild = block(values, "pulm_ild");
  const sleep = block(values, "pulm_sleep");
  const tb = block(values, "pulm_tb");
  const pleural = block(values, "pulm_pleural");
  const pe = block(values, "pulm_pe");
  const history = block(values, "pulm_history");
  const scores = asObject(values?.pulm_scores);

  const symptomsPresent = list(symptoms.symptoms).some((s) => !/none documented|not documented/i.test(s));

  // 1. Respiratory symptoms documented, no respiratory examination documented.
  if (symptomsPresent && Object.values(exam).every((v) => blank(v))) {
    prompts.push(
      rule(
        "symptoms_without_exam",
        "documented",
        "Respiratory symptoms documented — respiratory examination not documented",
        "Every respiratory pathway cited in this note begins from the examination findings, and the auscultation and percussion findings are what the record is later reviewed against. A note that documents symptoms with no examination leaves the clinical reasoning unrecorded.",
        "Record the respiratory examination, or document that it could not be performed and why.",
        "gina",
      ),
    );
  }

  // 2. Asthma documented without any diagnostic basis.
  if (str(asthma.diagnosis_basis) === "Clinical diagnosis — objective confirmation not documented") {
    prompts.push(
      rule(
        "asthma_without_objective_confirmation",
        "documented",
        "Asthma documented without objective confirmation of variable airflow limitation",
        "GINA requires the diagnosis to be supported by documented variable airflow limitation (reversibility, peak-flow variability or challenge) wherever the patient can perform the test, because symptoms and examination alone cannot separate asthma from other causes of wheeze and breathlessness.",
        "Record the confirmatory test, or record why it could not be performed and what the working diagnosis rests on.",
        "gina",
      ),
    );
  }

  // 3. Asthma control documented, ACT not recorded.
  if (str(asthma.control) && !scores.act) {
    prompts.push(
      rule(
        "asthma_control_without_act",
        "advisory",
        "Asthma control category documented — ACT not recorded",
        "GINA names a validated control instrument as the way control is measured between visits. A control category with no instrument behind it cannot be compared over time.",
        "Record the ACT (all five items) or document the specific criteria the control assessment was based on.",
        "gina",
      ),
    );
  }

  // 4. Step 4/5 therapy with no exacerbation history documented.
  if (/step 4|step 5/i.test(str(asthma.current_step)) && blank(exac.frequency)) {
    prompts.push(
      rule(
        "high_step_without_exacerbation_history",
        "documented",
        "High-step asthma therapy documented without exacerbation history",
        "GINA's step 4 and 5 recommendations depend on documented exacerbations and risk factors, not on symptoms alone. Without the exacerbation history the escalation cannot be reviewed later.",
        "Record the exacerbations in the last 12 months, including treatment and any admission.",
        "gina",
      ),
    );
  }

  // 5. COPD grouping documented with nothing behind it.
  if (str(copd.abe_group) && /not documented/i.test(str(copd.exacerbation_group_basis) || "not documented")) {
    prompts.push(
      rule(
        "copd_group_without_basis",
        "documented",
        "GOLD group documented without the inputs that determine it",
        "The GOLD grouping is defined by exacerbation history plus the CAT or mMRC score. A group asserted without those inputs cannot be reproduced from the record.",
        "Record the exacerbation history and the CAT or mMRC result, or record the basis the group was assigned on.",
        "gold",
      ),
    );
  }

  // 6. COPD without smoking or exposure history.
  if (str(copd.abe_group) && str(history.smoking_status) === "Not documented" && list(history.exposures).length === 0) {
    prompts.push(
      rule(
        "copd_without_exposure_history",
        "advisory",
        "COPD documented without smoking or exposure history",
        "GOLD's definition of COPD rests on a documented exposure history together with persistent airflow obstruction. The exposure record is what makes the diagnosis reviewable.",
        "Record smoking status, pack-years and any occupational or biomass exposure.",
        "gold",
      ),
    );
  }

  // 7. Exacerbation documented without an action plan or safety netting.
  if (str(exac.current_exacerbation) && !/given and explained|reviewed today/i.test(str(exac.action_plan))) {
    prompts.push(
      rule(
        "exacerbation_without_action_plan",
        "documented",
        "Exacerbation documented — written action plan not documented",
        "Both GINA and GOLD treat a written action plan with self-management education as part of exacerbation management: it is what converts recognition of deterioration into timely treatment.",
        "Record the action plan given, or document that it was declined or considered not appropriate and why.",
        "gold",
      ),
    );
  }

  // 8. Reliever overuse documented without adherence or technique review.
  if (/several times a day|daily/i.test(str(symptoms.reliever_use)) && str(inhaler.technique) === "Not observed at this visit") {
    prompts.push(
      rule(
        "reliever_overuse_without_device_review",
        "documented",
        "Reliever overuse documented — inhaler technique and adherence not reviewed",
        "Guideline management of deteriorating control begins with confirming the diagnosis, the inhaler technique and adherence before any step-up. Overuse of a reliever with neither reviewed commonly reflects a device the patient cannot use correctly.",
        "Observe and record inhaler technique, and record the documented adherence and the reason for it.",
        "gina",
      ),
    );
  }

  // 9. Oxygen support documented with no target range.
  if (str(oxygen.current_support) && !/none — room air|not documented/i.test(str(oxygen.current_support)) && blank(oxygen.target_range)) {
    prompts.push(
      rule(
        "oxygen_without_target_range",
        "same_day",
        "Oxygen or ventilatory support in use — no target saturation range documented",
        "Oxygen is prescribed to a target range, with a lower range (88–92%) where there is hypercapnia risk. Without a documented target the next clinician cannot tell whether the current delivery is therapeutic or harmful.",
        "Record the prescribed target range and the delivery device.",
        "gold",
      ),
    );
  }

  // 10. Long-term oxygen criteria met with no safety advice.
  if (/criteria documented and met/i.test(str(oxygen.ltot_assessment)) && str(oxygen.oxygen_safety) === "Not documented") {
    prompts.push(
      rule(
        "ltot_without_safety_advice",
        "documented",
        "Long-term oxygen criteria met — no safety advice documented",
        "Domiciliary oxygen carries a fire and burn risk and requires no-smoking advice, equipment instructions and a documented review of hours of use. The prescription is not complete without it.",
        "Record the safety advice given and the documented hours of use.",
        "gold",
      ),
    );
  }

  // 11. Obstructive pattern documented without reversibility or quality documented.
  if (str(lungFunction.obstruction) === "Obstructive" && str(lungFunction.reversibility) === "Not documented") {
    prompts.push(
      rule(
        "obstruction_without_reversibility",
        "advisory",
        "Obstructive pattern documented — bronchodilator reversibility not documented",
        "ATS/ERS interpretation requires the post-bronchodilator response and the technical quality of the test to be recorded, because both change what the number means.",
        "Record whether reversibility was assessed and its result, or why it was not.",
        "ats_ers_pft",
      ),
    );
  }

  // 12. Suspected PE with no documented pre-test probability.
  if (str(pe.diagnostic_pathway) && /d-dimer|imaging|empirical/i.test(str(pe.diagnostic_pathway)) && /not documented/i.test(str(pe.pretest_probability) || "not documented")) {
    prompts.push(
      rule(
        "pe_without_pretest_probability",
        "documented",
        "Pulmonary embolism testing documented without a pre-test probability",
        "The ESC pathway is driven by documented pre-test probability: the same D-dimer or scan means different things at different probabilities, and the record has to show which pathway was followed.",
        "Record the Wells score or PERC result, or the clinical judgement the pathway was based on.",
        "esc_pe",
      ),
    );
  }

  // 13. Anticoagulation started with no safety documentation.
  if (/started|continuing/i.test(str(pe.anticoagulation)) && list(pe.anticoagulation_safety).some((s) => /no safety assessment documented/i.test(s))) {
    prompts.push(
      rule(
        "anticoagulation_without_safety",
        "same_day",
        "Anticoagulation documented without safety assessment",
        "Anticoagulation guidance requires bleeding risk, renal function and weight to be documented, because dose and follow-up depend on them and the decision must be reviewable.",
        "Record the bleeding risk assessment, renal function, weight and any interacting antiplatelet therapy.",
        "esc_pe",
      ),
    );
  }

  // 14. Sleep apnoea severity documented with no objective testing.
  if (["Mild", "Moderate", "Severe"].includes(str(sleep.ahi_band)) && str(sleep.sleep_study) === "Not performed") {
    prompts.push(
      rule(
        "osa_severity_without_testing",
        "documented",
        "Sleep apnoea severity documented — no objective sleep testing recorded",
        "OSA severity is defined by the apnoea-hypopnoea index from objective testing, not by symptoms or screening scores. Severity recorded without testing cannot support a diagnosis or CPAP funding.",
        "Record the sleep study report and the index it reports, or document the basis of the working diagnosis.",
        "aasm_osa",
      ),
    );
  }

  // 15. CPAP documented without driving advice.
  if (/started|continuing/i.test(str(sleep.cpap)) && str(sleep.driving_advice) === "No") {
    prompts.push(
      rule(
        "cpap_without_driving_advice",
        "same_day",
        "CPAP documented — driving and safety advice not documented",
        "Patients with untreated or undertreated sleep apnoea present a defined driving risk. Documented advice is required before the patient resumes driving.",
        "Record the driving advice given, or document that it was not applicable and why.",
        "aasm_osa",
      ),
    );
  }

  // 16. Tuberculosis treatment documented without notification.
  if (/tuberculosis/i.test(str(tb.tb_category)) && /not yet notified|not documented/i.test(str(tb.notification) || "not documented")) {
    prompts.push(
      rule(
        "tb_without_notification",
        "same_day",
        "Tuberculosis documented — public health notification not recorded",
        "WHO guidance makes notification of a tuberculosis diagnosis a component of case management and contact tracing, not an administrative afterthought.",
        "Record the notification and its reference, or the reason it has not been made.",
        "who_tb",
      ),
    );
  }

  // 17. Chest drain in situ with no documented output or removal criteria.
  if (str(pleural.drain) === "In situ — documented below" && (blank(pleural.drain_output) || /not documented/i.test(str(pleural.removal_criteria)))) {
    prompts.push(
      rule(
        "drain_without_output_or_criteria",
        "same_day",
        "Chest drain in situ — output or removal criteria not documented",
        "Pleural guidance requires the daily output, the fluid character and the criteria for removal to be recorded, because those are what determine the next intervention.",
        "Record the 24-hour output, the fluid character, drain swing or bubbling, and the documented removal criteria.",
        "bts_pleural",
      ),
    );
  }

  // 18. ILD progression documented with no monitoring or MDT outcome.
  if (/progressing|rapidly progressing/i.test(str(ild.ild_status)) && !/discussed — outcome documented/i.test(str(ild.mdt))) {
    prompts.push(
      rule(
        "ild_progression_without_review",
        "documented",
        "ILD progression documented — multi-disciplinary review outcome not documented",
        "Progression of interstitial lung disease is a multi-disciplinary decision that changes therapy. The record has to show the review and its outcome, not only the impression.",
        "Record the multi-disciplinary review outcome or the referral made.",
        "ats_ers_ild",
      ),
    );
  }

  // 19. Haemoptysis documented with no pathway documented.
  if (list(symptoms.symptoms).includes("Haemoptysis") && blank(symptoms.haemoptysis_volume)) {
    prompts.push(
      rule(
        "haemoptysis_without_volume",
        "documented",
        "Haemoptysis documented — volume and pathway not recorded",
        "The urgency of haemoptysis assessment depends on volume, recurrence and comorbidity. A record that documents the symptom without the volume cannot be triaged later.",
        "Record the volume, frequency and the assessment or referral pathway followed.",
        "bts_pleural",
      ),
    );
  }

  // 20. Smoking documented as current with no cessation support recorded.
  const management = block(values, "pulm_management");
  if (str(history.smoking_status) === "Current smoker" && str(management.smoking_cessation) === "Not documented") {
    prompts.push(
      rule(
        "current_smoker_without_cessation_support",
        "advisory",
        "Current smoker documented — cessation support not documented",
        "Smoking cessation is the single most effective intervention in both asthma and COPD management, and every guideline cited here requires it to be offered and recorded.",
        "Record the cessation advice and support offered, or that it was declined.",
        "gold",
      ),
    );
  }

  return prompts;
};

// Printed record: the prompts raised and whether the action was documented.
export const formatPulmSafety = (value) => {
  const state = asObject(value);
  const rows = Array.isArray(state.rows) ? state.rows : [];
  const acknowledged = Array.isArray(state.acknowledged) ? state.acknowledged : [];
  if (!rows.length) return "";
  return rows
    .map((r) => {
      const done = acknowledged.includes(r.key);
      return `${r.title} — ${done ? "action documented" : "action not documented in this note"}${
        str(r.note) ? `: ${str(r.note)}` : ""
      }`;
    })
    .join("\n");
};