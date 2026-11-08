// Allergy & Immunology advisory decision support.
//
// Each prompt fires ONLY from documentation that is missing or internally
// inconsistent in the note itself. It names the guidance it comes from, states
// what that guidance requires to be recorded, and leaves the decision — and the
// decision not to follow the prompt — to the clinician, who documents it.
//
// WHAT THESE PROMPTS NEVER DO
//   · They never block saving a note, withhold treatment or order anything.
//   · They never change, suggest or confirm a diagnosis.
//   · They never read a blank field as normal, absent, negative or excluded.
//   · They never convert a positive test into a diagnosis.
//
// The wording of every prompt says "not documented", because that is what a blank
// field means.

import { ALLERGY_REFERENCES } from "@/lib/allergyReferences";

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const str = (v) => String(v ?? "").trim();
const list = (v) => (Array.isArray(v) ? v.filter((x) => str(x)) : str(v) ? [str(v)] : []);
const blank = (v) => !str(v) && !(Array.isArray(v) && v.length);

const block = (values, key) => asObject(values?.[key]);
const tests = (values) => (Array.isArray(values?.allergy_tests) ? values.allergy_tests : []);

const hasTestResult = (values, prefixes) =>
  tests(values).some(
    (r) =>
      r &&
      (str(r.value) || str(r.interpretation)) &&
      prefixes.some((p) => String(r.test_key || "").startsWith(p)),
  );

const rule = (key, level, title, basis, action, refKey) => ({
  key,
  level,
  title,
  basis,
  action,
  provenance: refKey,
  source: ALLERGY_REFERENCES[refKey] || null,
});

const ANAPHYLAXIS_SEVERITY = ["Grade 3 — severe, hypoxia or hypotension", "Grade 4 — cardiac or respiratory arrest"];

export const buildAllergySafetyPrompts = ({ values }) => {
  const prompts = [];
  const ana = block(values, "allergy_anaphylaxis");
  const asthma = block(values, "allergy_asthma");
  const rhinitis = block(values, "allergy_rhinitis");
  const food = block(values, "allergy_food");
  const drug = block(values, "allergy_drug");
  const skin = block(values, "allergy_skin");
  const imm = block(values, "allergy_immunology");
  const ait = block(values, "allergy_ait");
  const prov = block(values, "allergy_provocation");

  const anaphylaxisDocumented =
    ANAPHYLAXIS_SEVERITY.includes(str(ana.severity)) ||
    list(ana.criteria_met).some((c) => c !== "None of the criteria documented");

  // 1. Anaphylaxis documented, adrenaline not documented.
  if (anaphylaxisDocumented && str(ana.adrenaline_given) !== "Yes — documented below") {
    prompts.push(
      rule(
        "anaphylaxis_without_adrenaline",
        "same_day",
        "Anaphylaxis documented — adrenaline administration not documented",
        "Adrenaline is the first-line treatment of anaphylaxis in the AAAAI/ACAAI practice parameter and the WAO guidance. A record that documents anaphylaxis without documenting adrenaline may reflect a genuinely omitted dose or an incomplete record; both need resolving before the note is signed.",
        "Record whether adrenaline was given, the dose, the route, the site and the time — or document why it was not given.",
        "aaaai_anaphylaxis",
      ),
    );
  }

  // 2. Adrenaline given, no observation period recorded.
  if (str(ana.adrenaline_given) === "Yes — documented below" && blank(ana.observation)) {
    prompts.push(
      rule(
        "anaphylaxis_observation_undocumented",
        "documented",
        "Observation period after adrenaline not documented",
        "Reactions can recur after apparent resolution, and the guidance consulted differ on the minimum observation period. What is required either way is that the period used is recorded.",
        "Record the observation period actually used after resolution of the reaction, and who decided it.",
        "wao_anaphylaxis",
      ),
    );
  }

  // 3. Anaphylaxis without a disposition.
  if (anaphylaxisDocumented && blank(ana.disposition)) {
    prompts.push(
      rule(
        "anaphylaxis_disposition_missing",
        "documented",
        "Disposition and follow-up after anaphylaxis not documented",
        "Follow-up after anaphylaxis — allergy assessment, a written emergency plan and, where indicated, an adrenaline autoinjector — is part of the cited guidance, not an optional extra.",
        "Document the disposition, the referral made and what the patient or carer was given before discharge.",
        "aaaai_anaphylaxis",
      ),
    );
  }

  // 4. Drug allergy label kept without the reaction being described.
  if (
    str(drug.index_drug) &&
    (blank(drug.phenotype) || str(drug.phenotype) === "Not documented" || str(drug.label_state) === "Unverified — label recorded without detail")
  ) {
    prompts.push(
      rule(
        "drug_label_unverified",
        "documented",
        "Drug allergy label recorded without a documented reaction phenotype",
        "The drug allergy practice parameter requires the reaction phenotype and timing to be recorded before a label is kept: without them a label cannot be assessed, de-labelled or safely used to guide alternatives.",
        "Record what the reaction was, when it occurred relative to the dose, and what treatment was needed — or mark the label as unverified pending assessment.",
        "aaaai_drug",
      ),
    );
  }

  // 5. Possible label, no delabelling pathway considered.
  if (
    ["Possible — label kept pending assessment", "Unverified — label recorded without detail"].includes(str(drug.label_state)) &&
    (!str(drug.delabelling_pathway) || str(drug.delabelling_pathway) === "None documented")
  ) {
    prompts.push(
      rule(
        "drug_delabelling_not_considered",
        "advisory",
        "Delabelling pathway not documented for an unverified drug label",
        "An unverified label has clinical cost: less effective or broader-spectrum alternatives. The practice parameter asks for a documented decision — formal assessment, direct provocation, or an explicitly documented reason not to pursue it.",
        "Document the delabelling pathway chosen, or the reason assessment is not being pursued.",
        "aaaai_drug",
      ),
    );
  }

  // 6. Asthma diagnosis without objective confirmation documented.
  if (
    str(asthma.diagnosis_status) === "Clinically suspected — no objective test documented" ||
    list(asthma.objective).includes("No objective confirmation documented")
  ) {
    prompts.push(
      rule(
        "asthma_without_objective_confirmation",
        "advisory",
        "Asthma documented without objective confirmation recorded",
        "GINA describes the diagnosis as being based on a characteristic symptom pattern plus documented variable airflow limitation. Symptoms alone are not confirmation.",
        "Record the objective test performed and its result, or state that the diagnosis remains clinically suspected and how it will be confirmed.",
        "gina",
      ),
    );
  }

  // 7. Uncontrolled asthma, treatment step not documented.
  if (str(asthma.control_level) === "Uncontrolled" && (!str(asthma.treatment_step) || str(asthma.treatment_step) === "Not documented")) {
    prompts.push(
      rule(
        "asthma_uncontrolled_step_missing",
        "documented",
        "Uncontrolled asthma with no current treatment step documented",
        "GINA manages asthma by step, and a step cannot be adjusted when the current step, adherence and inhaler technique are not recorded.",
        "Record the current treatment step, the adherence and inhaler-technique findings, and the step decision made at this visit.",
        "gina",
      ),
    );
  }

  // 8. Rhinitis documented without an ARIA classification.
  if (
    list(rhinitis.symptoms).length > 0 &&
    (blank(rhinitis.duration_class) || rhinitis.duration_class === "Not documented" || blank(rhinitis.severity_class) || rhinitis.severity_class === "Not documented")
  ) {
    prompts.push(
      rule(
        "rhinitis_unclassified",
        "advisory",
        "Allergic rhinitis symptoms documented without an ARIA classification",
        "ARIA classifies rhinitis by duration (intermittent vs persistent) and by severity (mild vs moderate–severe), and the classification determines the treatment step.",
        "Record the duration class and the severity class, or state why the classification is not applicable.",
        "aria",
      ),
    );
  }

  // 9. Chronic urticaria without a documented activity or control score.
  if (
    str(skin.urticaria_type) === "Chronic — 6 weeks or more" &&
    (!str(skin.urticaria_score) || str(skin.urticaria_score) === "No score recorded")
  ) {
    prompts.push(
      rule(
        "chronic_urticaria_without_score",
        "advisory",
        "Chronic urticaria documented without an activity or control instrument",
        "The urticaria guideline measures disease with a validated instrument (UAS7 for activity, UCT for control). Treatment escalation without a documented score cannot be shown to be justified or effective.",
        "Record the UAS7 or UCT result, or state why an instrument was not used at this visit.",
        "urticaria",
      ),
    );
  }

  // 10. Suspected bradykinin-mediated angioedema without complement workup.
  if (
    ["Bradykinin-mediated — suspected or confirmed", "Hereditary angioedema", "Acquired angioedema"].includes(str(skin.angioedema_type)) &&
    !hasTestResult(values, ["c4", "c1inh", "c3"])
  ) {
    prompts.push(
      rule(
        "angioedema_complement_not_recorded",
        "documented",
        "Bradykinin-mediated angioedema documented without complement results recorded",
        "Hereditary and acquired angioedema are diagnosed from C1-inhibitor antigen and function with C4 — not from the clinical picture alone — and the acute treatment is different from histaminergic angioedema.",
        "Record the complement results documented for this patient, or state that testing has been requested and the acute plan in the meantime.",
        "hae",
      ),
    );
  }

  // 11. Multiple immunodeficiency warning signs without an immune workup recorded.
  const warningSigns = list(imm.warning_signs).filter((s) => s !== "No warning sign documented");
  if (
    warningSigns.length >= 2 &&
    !hasTestResult(values, ["igg", "iga", "igm", "ab_", "cd3", "cd4", "cd19", "c3", "c4", "ch50", "ah50", "dhr", "nbt"]) &&
    !["Protective titres documented", "Non-protective titres documented"].includes(str(imm.vaccination_response))
  ) {
    prompts.push(
      rule(
        "immunodeficiency_workup_not_recorded",
        "documented",
        "Immunodeficiency warning signs documented without an immune workup recorded",
        "The primary immunodeficiency practice parameter pairs defined warning signs with an initial evaluation — immunoglobulins, vaccine antibody responses and, where indicated, lymphocyte subsets and complement.",
        "Record the initial immune evaluation performed and its results, or state that it has been requested and by whom.",
        "aaaai_iei",
      ),
    );
  }

  // 12. Immunotherapy given without documented consent.
  if (
    ["Subcutaneous immunotherapy (SCIT)", "Sublingual tablet (SLIT)", "Sublingual drops (SLIT)"].includes(str(ait.modality)) &&
    (!str(ait.consent) || str(ait.consent) === "Not documented")
  ) {
    prompts.push(
      rule(
        "ait_consent_not_documented",
        "documented",
        "Allergen immunotherapy documented without informed consent recorded",
        "The EAACI immunotherapy guideline requires a documented discussion of benefit, risk, duration and the alternative of symptomatic treatment before treatment starts.",
        "Record that informed consent was obtained and reviewed, or the reason treatment is proceeding without it documented.",
        "eaaci_ait",
      ),
    );
  }

  // 13. Immunotherapy dose without a documented observation period.
  if (
    ["Subcutaneous immunotherapy (SCIT)", "Sublingual tablet (SLIT)", "Sublingual drops (SLIT)"].includes(str(ait.modality)) &&
    (!str(ait.observation_after_dose) || str(ait.observation_after_dose) === "Not documented")
  ) {
    prompts.push(
      rule(
        "ait_observation_not_documented",
        "advisory",
        "Observation period after the immunotherapy dose not documented",
        "Post-dose observation is the safety control that makes an immediate reaction treatable. The consensus documents the observation period used, particularly for subcutaneous dosing.",
        "Record the observation period after this dose, or the documented reason it was not used.",
        "icon_ait",
      ),
    );
  }

  // 14. Anaphylactic food reaction without a written emergency plan.
  if (
    (list(food.severity).some((s) => s.startsWith("Anaphylaxis")) || str(food.mechanism) === "IgE-mediated — immediate") &&
    list(food.severity).some((s) => s.startsWith("Anaphylaxis")) &&
    (!str(food.emergency_plan) || str(food.emergency_plan) === "Not given" || str(food.emergency_plan) === "Not documented")
  ) {
    prompts.push(
      rule(
        "food_anaphylaxis_without_plan",
        "documented",
        "Food-induced anaphylaxis documented without a written emergency plan",
        "Food allergy guidance requires a written plan for accidental exposure, with the adrenaline device and the observation instructions the patient or carer will actually use.",
        "Record whether a written emergency plan and autoinjector training were given, and what was given if not.",
        "aaaai_food",
      ),
    );
  }

  // 15. Positive provocation without the allergy record being updated.
  if (str(prov.outcome) === "Positive — objective reaction reproduced" && str(prov.record_updated) !== "Yes") {
    prompts.push(
      rule(
        "provocation_outcome_not_recorded",
        "documented",
        "Positive provocation result without the allergy record updated",
        "A provocation result changes what the patient must avoid and what may safely be given. Leaving the allergy label unchanged after a positive provocation keeps the record inconsistent with the result.",
        "Record that the allergy record and the patient's allergy label were updated with the outcome, or the reason they were not.",
        "aaaai_drug",
      ),
    );
  }

  return prompts;
};