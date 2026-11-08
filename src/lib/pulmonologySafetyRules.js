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
// Block values are stored on the note under the field key the template registers
// (pulm_block_<key>); older notes may hold them under the bare block key, so both
// are read and a prompt never depends on which shape the note was saved in.
const block = (values, key) => {
  const direct = asObject(values?.[key]);
  if (Object.keys(direct).length) return direct;
  return asObject(values?.[`pulm_block_${key}`]);
};

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
  const cough = block(values, "pulm_cough_sputum");
  const presenting = block(values, "pulm_presenting");
  const vitals = block(values, "pulm_vitals");
  const investigations = asObject(asObject(values?.pulm_investigations).items);
  const scores = asObject(values?.pulm_scores);

  // The dedicated GOLD COPD and GINA asthma modules, and the acute exacerbation module.
  const copdDx = block(values, "pulm_copd_diagnosis");
  const copdAssess = block(values, "pulm_copd_assessment");
  const copdTx = block(values, "pulm_copd_treatment");
  const asthmaControl = block(values, "pulm_asthma_control");
  const asthmaTx = block(values, "pulm_asthma_treatment");
  const acute = block(values, "pulm_acute_assessment");
  const acuteResponse = block(values, "pulm_acute_response");

  // Emergency and critical care, longitudinal follow-up and referral modules.
  const emergency = block(values, "pulm_emergency_recognition");
  const critical = block(values, "pulm_time_critical_conditions");
  const ventilation = block(values, "pulm_ventilatory_support");
  const trend = block(values, "pulm_longitudinal_trend");
  const longCare = block(values, "pulm_longitudinal_care");
  const prevention = block(values, "pulm_longitudinal_prevention");
  const referral = block(values, "pulm_mdt_referral");

  // The cough/sputum block and the structured presenting complaints are the note's
  // primary entry for respiratory symptoms, so the prompts read them too.
  const coughPresent = ["Dry cough", "Productive cough"].includes(str(cough.cough));
  const symptomsPresent =
    list(symptoms.symptoms).some((s) => !/none documented|not documented/i.test(s)) ||
    coughPresent ||
    list(presenting.complaints).some((s) => /cough|breathless|wheeze|haemoptysis|sputum/i.test(s));

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
  const haemoptysisDocumented =
    list(symptoms.symptoms).includes("Haemoptysis") ||
    /streaking|frank haemoptysis|massive haemoptysis/i.test(str(cough.haemoptysis));
  if (haemoptysisDocumented && blank(symptoms.haemoptysis_volume)) {
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

  // 21. Hypoxaemia recorded with no oxygen documentation and no target range.
  const roomAirSaturation = Number(vitals.spo2_air);
  const hypoxaemic =
    String(vitals.spo2_air ?? "").trim() !== "" &&
    !Number.isNaN(roomAirSaturation) &&
    roomAirSaturation > 0 &&
    roomAirSaturation < 92;
  if (hypoxaemic && blank(vitals.o2_device) && blank(vitals.target_range) && blank(oxygen.current_support)) {
    prompts.push(
      rule(
        "hypoxaemia_without_oxygen_plan",
        "same_day",
        "Room-air saturation below 92% documented — no oxygen delivery or target range recorded",
        "A recorded saturation below 92% is the finding that starts an oxygen assessment. Without the delivery device, the target range and the response, the next clinician cannot tell whether the hypoxaemia was addressed or is still present.",
        "Record the oxygen device and flow rate used, the saturation achieved, and the prescribed target range.",
        "gold",
      ),
    );
  }

  // 22. An investigation recorded without the clinician's interpretation.
  const uninterpreted = Object.values(investigations).filter((entry) => {
    const item = asObject(entry);
    return String(item.result ?? "").trim() !== "" && String(item.interpretation ?? "").trim() === "";
  });
  if (uninterpreted.length > 0) {
    prompts.push(
      rule(
        "investigation_without_interpretation",
        "advisory",
        `${uninterpreted.length} investigation${uninterpreted.length === 1 ? "" : "s"} recorded without an interpretation`,
        "A result without the clinician's documented interpretation cannot be told apart from a result nobody reviewed, and the plan that followed cannot be reconstructed from the record.",
        "Record the interpretation for each documented result, or remove the result if it belongs in the Laboratory or Radiology record only.",
        "ats_ers_pft",
      ),
    );
  }

  // 23. A GOLD airflow grade recorded without the post-bronchodilator FEV1 behind it.
  if (str(copdDx.airflow_grade) && !/not documented/i.test(str(copdDx.airflow_grade)) && blank(copdDx.fev1_postbd_pct)) {
    prompts.push(
      rule(
        "gold_grade_without_fev1",
        "documented",
        "GOLD airflow grade documented — post-bronchodilator FEV1 % predicted not recorded",
        "The GOLD grade is defined by the post-bronchodilator FEV1 as a percentage of predicted in a patient whose FEV1/FVC is below 0.70. A grade recorded without that figure cannot be reproduced or followed over time.",
        "Record the post-bronchodilator FEV1 and its percentage of predicted, or record the grade as taken from a report saved in the record.",
        "gold",
      ),
    );
  }

  // 24. A confirmed COPD diagnosis with no post-bronchodilator confirmation.
  if (/^confirmed/i.test(str(copdDx.diagnosis)) && !/confirmed after bronchodilator/i.test(str(copdDx.post_bd_confirmation))) {
    prompts.push(
      rule(
        "copd_confirmed_without_post_bronchodilator",
        "documented",
        "COPD recorded as confirmed — post-bronchodilator confirmation not documented",
        "GOLD requires the diagnosis to rest on persistent airflow obstruction demonstrated after bronchodilator, because pre-bronchodilator obstruction alone cannot separate COPD from reversible disease.",
        "Record the post-bronchodilator spirometry result, or record the diagnosis as probable pending it.",
        "gold",
      ),
    );
  }

  // 25. ICS or triple therapy documented with no eosinophil count behind it.
  const icsDocumented =
    /started|continuing|considered/i.test(str(copdTx.ics)) ||
    /started|continuing|considered/i.test(str(copdTx.triple));
  if (
    icsDocumented &&
    blank(copdAssess.eosinophils) &&
    /^$|not available|not documented/i.test(str(copdAssess.eosinophil_band) || "")
  ) {
    prompts.push(
      rule(
        "ics_without_eosinophil_count",
        "advisory",
        "Inhaled corticosteroid documented — blood eosinophil count not recorded",
        "GOLD weighs the exacerbation benefit of an inhaled corticosteroid against its pneumonia risk using the blood eosinophil count, so the count is part of what makes the decision reviewable.",
        "Record the blood eosinophil count and its date, or record the clinical basis on which the corticosteroid was started.",
        "gold",
      ),
    );
  }

  // 26. An asthma control level recorded without all four GINA criteria.
  const criteriaRecorded = list(asthmaControl.control_criteria);
  if (
    str(asthmaControl.control) &&
    !criteriaRecorded.includes("None of the four criteria present") &&
    criteriaRecorded.length < 4
  ) {
    prompts.push(
      rule(
        "asthma_control_without_all_criteria",
        "advisory",
        "Asthma control level documented — not all four GINA criteria recorded",
        "GINA defines the control level from the four criteria actually present in the last four weeks. A level recorded without all four recorded cannot be distinguished from a criterion that was present but not asked about.",
        "Record each of the four criteria, or record that none of them was present.",
        "gina",
      ),
    );
  }

  // 27. A step-up with technique and adherence not reviewed.
  if (
    /step-up/i.test(str(asthmaTx.step_assessment)) &&
    !(list(asthmaTx.reviewed_before_stepup).includes("Adherence") &&
      list(asthmaTx.reviewed_before_stepup).includes("Inhaler technique"))
  ) {
    prompts.push(
      rule(
        "asthma_stepup_without_adherence_or_technique",
        "documented",
        "Asthma step-up documented — adherence and inhaler technique not both recorded",
        "GINA requires adherence, inhaler technique, diagnosis and comorbidities to be checked before treatment is escalated, because escalation without that check treats a delivery problem with more drug.",
        "Record the adherence assessment and the inhaler technique observation, or record why the step-up does not depend on them.",
        "gina",
      ),
    );
  }

  // 28. Severe asthma documented with no specialist referral recorded.
  if (/step 4 or 5|not assessable/i.test(str(asthmaControl.severity)) && !/referred/i.test(str(asthmaTx.specialist_referral))) {
    prompts.push(
      rule(
        "severe_asthma_without_specialist_referral",
        "advisory",
        "Severe or difficult-to-treat asthma documented — specialist referral not recorded",
        "GINA treats severe asthma as a specialist assessment, because the diagnosis, adherence, technique, comorbidities and phenotype all have to be confirmed before step 4–5 therapy, including a biologic, is continued.",
        "Record the referral made, or record why specialist input is not being sought.",
        "gina",
      ),
    );
  }

  // 29. Severe or life-threatening exacerbation with no blood gas documented.
  if (/^severe$|life-threatening/i.test(str(acute.severity)) && /not indicated|not documented|not yet performed|^$/i.test(str(acute.abg) || "")) {
    prompts.push(
      rule(
        "severe_exacerbation_without_blood_gas",
        "same_day",
        "Severe or life-threatening exacerbation documented — arterial blood gas not recorded",
        "Both GINA and GOLD assess a severe exacerbation on gas exchange as well as on the clinical picture: the carbon dioxide level is what identifies a patient who is tiring and needs ventilatory support rather than more bronchodilator.",
        "Record the arterial blood gas, or record why it was not indicated for this patient.",
        "gold",
      ),
    );
  }

  // 30. A poor response to treatment with no escalation documented.
  if (/poor response/i.test(str(acuteResponse.response)) && blank(acuteResponse.escalation_plan)) {
    prompts.push(
      rule(
        "poor_response_without_escalation",
        "same_day",
        "Poor response to exacerbation treatment documented — escalation plan not documented",
        "A documented poor response is the trigger for the next level of support, and the plan that followed it is what lets the receiving team continue the same decision.",
        "Record the escalation plan — repeat treatment, ventilatory support, critical-care referral — or record the ceiling of treatment agreed with the patient.",
        "gold",
      ),
    );
  }

  // ---- Respiratory emergencies and critical care ---------------------------

  // 31. An emergency documented with no disposition recorded.
  if (str(emergency.emergency_presentation) && /^\s*$|not documented/i.test(str(emergency.disposition))) {
    prompts.push(
      rule(
        "emergency_without_disposition",
        "same_day",
        "Respiratory emergency documented — disposition not recorded",
        "The record of an emergency has to show where the patient went next and on what basis, because the receiving team and any later review depend on that decision being documented.",
        "Record the disposition and the basis for it, or record why the decision was deferred.",
        "chest",
      ),
    );
  }

  // 32. A tension pneumothorax documented with no decompression recorded.
  if (list(critical.conditions).includes("Tension pneumothorax") && !/decompression|drain/i.test(list(critical.condition_actions).join(" "))) {
    prompts.push(
      rule(
        "tension_pneumothorax_without_decompression",
        "same_day",
        "Tension pneumothorax documented — decompression or drainage not recorded",
        "A tension pneumothorax is treated as a time-critical emergency: the record must show the decompression performed and the response to it, or document why that step was not taken.",
        "Record the needle decompression and intercostal drain performed, with the response, or record why the finding was not treated as a tension.",
        "bts_pleural",
      ),
    );
  }

  // 33. A pulmonary embolism documented with no anticoagulation recorded.
  if (list(critical.conditions).includes("Pulmonary embolism") && !/anticoagulation|thrombolysis/i.test(list(critical.condition_actions).join(" "))) {
    prompts.push(
      rule(
        "pe_without_anticoagulation_documented",
        "same_day",
        "Pulmonary embolism documented — anticoagulation or thrombolysis not recorded",
        "ESC guidance makes anticoagulation the immediate consequence of a confirmed pulmonary embolism, with thrombolysis for haemodynamic instability. Neither can be reviewed later unless it is in the record.",
        "Record the anticoagulant started with dose and timing, the thrombolysis performed, or the documented reason treatment was withheld.",
        "esc_pe",
      ),
    );
  }

  // 34. Massive haemoptysis documented with no definitive management recorded.
  if (list(critical.conditions).includes("Massive haemoptysis") && !/bronchoscopy|airway intervention|specialist opinion|surgical/i.test(list(critical.condition_actions).join(" "))) {
    prompts.push(
      rule(
        "massive_haemoptysis_without_definitive_management",
        "same_day",
        "Massive haemoptysis documented — definitive management not recorded",
        "Massive haemoptysis is managed on airway protection and control of the bleeding source; a record that stops at the observation cannot show that either was addressed.",
        "Record the airway measures, the bronchoscopy or specialist input arranged, or record the documented reason no definitive step was taken.",
        "bts",
      ),
    );
  }

  // 35. Severe pneumonia with sepsis documented without the sepsis pathway recorded.
  if (list(critical.conditions).includes("Severe pneumonia with sepsis") && !/sepsis pathway|vasopressor/i.test(list(critical.condition_actions).join(" "))) {
    prompts.push(
      rule(
        "severe_pneumonia_without_sepsis_management",
        "advisory",
        "Severe pneumonia with sepsis documented — sepsis management not recorded",
        "ATS/IDSA treat severe pneumonia as sepsis until proven otherwise, so the record is expected to show the sepsis pathway and the resuscitation documented alongside the antimicrobial decision.",
        "Record the sepsis pathway activated and the resuscitation given, or record why it did not apply.",
        "idsa",
      ),
    );
  }

  // 36. Ventilatory support documented with no blood gas on support.
  if (/NIV|invasive ventilation/i.test(str(ventilation.support_level)) && /not performed|not documented|^$/i.test(str(ventilation.blood_gas_on_support) || "")) {
    prompts.push(
      rule(
        "ventilatory_support_without_blood_gas",
        "same_day",
        "Ventilatory support documented — blood gas on support not recorded",
        "Ventilatory support is judged on gas exchange and acid–base response, not on saturation alone; the blood gas on support is what documents that the support is working or that it is failing.",
        "Record the arterial blood gas on support, or record why it was not performed.",
        "ats",
      ),
    );
  }

  // 37. Invasive ventilation without lung-protective ventilation recorded.
  if (str(ventilation.support_level) === "Invasive ventilation" && /not documented/i.test(str(ventilation.lung_protective))) {
    prompts.push(
      rule(
        "invasive_ventilation_without_lung_protection",
        "advisory",
        "Invasive ventilation documented — lung-protective ventilation not recorded",
        "ATS/ERS base invasive ventilation in acute hypoxaemic respiratory failure on a documented tidal volume and pressure limit; without them the settings cannot be reviewed against the patient's course.",
        "Record the tidal volume and pressure limits used, or record why a different strategy was chosen.",
        "ats",
      ),
    );
  }

  // 38. An emergency with no oxygen target documented.
  if (str(emergency.emergency_presentation) && blank(emergency.target_range)) {
    prompts.push(
      rule(
        "emergency_without_oxygen_target",
        "advisory",
        "Respiratory emergency documented — oxygen target range not recorded",
        "GOLD and BTS both require a documented target range in an acute respiratory episode, because a patient at risk of hypercapnia is harmed by the same oxygen dose that helps another patient.",
        "Record the prescribed target range (94–98%, 88–92% where hypercapnia risk is documented, or an individualised range).",
        "gold",
      ),
    );
  }

  // ---- Longitudinal follow-up ----------------------------------------------

  // 39. Exacerbations or admissions recorded with no vaccination status.
  if ((Number(trend.admissions_since_review) > 0 || Number(trend.exacerbations_since_review) > 0) && list(prevention.vaccinations).length === 0) {
    prompts.push(
      rule(
        "exacerbations_without_vaccination_status",
        "advisory",
        "Exacerbations or admissions recorded — vaccination status not documented",
        "GOLD and GINA both place vaccination among the interventions reviewed at every exacerbation-prone review, because it is the prevention step that the exacerbation history calls for.",
        "Record the influenza, pneumococcal and COVID-19 status, or record why vaccination was not reviewed.",
        "gold",
      ),
    );
  }

  // 40. A declining spirometry trend with no therapy change documented.
  if (/declined/i.test(str(trend.spirometry_trend)) && /no change/i.test(str(longCare.therapy_change))) {
    prompts.push(
      rule(
        "declining_lung_function_without_review",
        "advisory",
        "Declining lung function documented — no therapy or review change recorded",
        "A documented decline is the point at which GOLD and GINA ask for the treatment, adherence, technique, exposure and comorbidity to be reviewed and the decision recorded, even when the decision is to continue unchanged.",
        "Record the basis on which treatment continues unchanged, or record the change made.",
        "gold",
      ),
    );
  }

  // 41. Poor adherence documented with inhaler technique not checked.
  if (/poor/i.test(str(longCare.adherence)) && /not checked/i.test(str(longCare.inhaler_technique))) {
    prompts.push(
      rule(
        "poor_adherence_without_technique_check",
        "advisory",
        "Poor adherence documented — inhaler technique not checked",
        "GINA and GOLD treat technique and adherence as one assessment: an inhaled regimen cannot be judged, stepped up or stepped down until both have been looked at.",
        "Record the inhaler technique observation, or record why it could not be checked.",
        "gina",
      ),
    );
  }

  // ---- Referral and multidisciplinary communication ------------------------

  // 42. A referral with no urgency and no clinical question.
  if (list(referral.specialties).length && blank(referral.urgency)) {
    prompts.push(
      rule(
        "referral_without_urgency",
        "advisory",
        "Referral documented — urgency not recorded",
        "A referral carries its urgency with it: the receiving team triages on that statement, and without it the referral cannot be prioritised against the others in the same queue.",
        "Record the urgency and the basis for it.",
        "chest",
      ),
    );
  }

  if (list(referral.specialties).length && blank(referral.clinical_question)) {
    prompts.push(
      rule(
        "referral_without_clinical_question",
        "advisory",
        "Referral documented — the clinical question is not recorded",
        "A referral is answered against the question it asked. Without the question in the record, the reply cannot be matched to the reason the patient was sent.",
        "Record the specific question asked of the receiving team.",
        "chest",
      ),
    );
  }

  if (/urgent|emergency/i.test(str(referral.urgency)) && /not recorded/i.test(str(referral.letter_recorded))) {
    prompts.push(
      rule(
        "urgent_referral_without_recorded_letter",
        "advisory",
        "Urgent referral documented — referral letter not recorded",
        "An urgent referral is the one most likely to be acted on out of hours by a team that has only the written record, so the letter itself has to be in AMedix rather than only in a conversation.",
        "Save the referral letter in AMedix, or record who received the referral and when.",
        "chest",
      ),
    );
  }

  return prompts;
};

// Printed record: the prompts raised and whether the action was documented.
export const formatPulmSafety = (value) => {
  const state = asObject(value);
  const acknowledged = Array.isArray(state.acknowledged) ? state.acknowledged : [];
  const notes = asObject(state.notes);
  if (!acknowledged.length) return "";
  return acknowledged
    .map((key) => {
      const text = str(notes[key]);
      return text ? `${key} — ${text}` : `${key} — action documented`;
    })
    .join("\n");
};