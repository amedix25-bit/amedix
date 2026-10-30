// Pediatrics — advisory safety prompts.
//
// Each prompt compares what the note actually recorded against the requirement of the
// cited document. A prompt states what is documented, the requirement it fails and the
// source of that requirement — it never diagnoses, never orders treatment and never
// changes a diagnosis. Nothing here blocks saving the note.
//
// Every rule carries its provenance:
//   · GUIDELINE — the requirement is stated in the cited document.
//   · LOCAL — an AMedix / institutional decision, labelled as such.
//
// A rule fires only from values that were documented. A blank is never treated as a
// negative finding, and a prompt is not a statement that the condition is present.

import { pedsBlockValues } from "@/lib/pedsBlocks";
import { PEDS_REFERENCES } from "@/lib/pedsReferences";
import { asObject, str, list, num, blockUsed } from "@/lib/pedsFieldKit";
import { weightBasedDose } from "@/lib/pedsPatientMath";

const refLabel = (key) => {
  const ref = PEDS_REFERENCES[key] || PEDS_REFERENCES.local;
  return `${ref.organization} — ${ref.title} (${ref.edition})`;
};

const b = (values, key) => pedsBlockValues(values, key);
const f = (values, key, field) => str(b(values, key)[field]);
const m = (values, key, field) => list(b(values, key)[field]);
const used = (values, key) => blockUsed(b(values, key));

// The per-note clinical blocks share a prefix (peds_ctx_, peds_exam_, peds_assess_,
// peds_care_), so a rule reads the note-specific record without having to know which
// of the eighteen notes it is looking at. Only values that were documented are read.
const blocksWith = (values, prefix) =>
  Object.entries(asObject(values))
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => asObject(value));

const noteValue = (values, prefix, field) =>
  blocksWith(values, prefix)
    .map((v) => str(v[field]))
    .find((v) => v !== "") || "";

const noteList = (values, prefix, field) => blocksWith(values, prefix).flatMap((v) => list(v[field]));

const noteText = (values, prefix, fields) =>
  fields
    .map((field) => noteValue(values, prefix, field))
    .filter(Boolean)
    .join(" ");

const NOT_RECORDED = (value) => isBlankOrUndocumented(value) || /^not recorded$/i.test(str(value));

const isBlankOrUndocumented = (value) => {
  const v = str(value);
  return v === "" || /^not documented$/i.test(v);
};

// WHO IMCI age-specific fast-breathing thresholds.
const FAST_BREATHING = {
  "Under 2 months": 60,
  "2–11 months": 50,
  "12–59 months": 40,
};

const OXYGEN_GIVEN = ["Supplemental oxygen", "Respiratory support (high-flow or CPAP)"];

const DANGER_SIGN_ACTIONS = ["Admitted", "Referred urgently", "Resuscitation commenced", "Pre-referral treatment given"];

const icdEntries = (values) => {
  const raw = asObject(values).peds_icd11_diagnoses;
  return Array.isArray(raw) ? raw.filter((e) => e && typeof e === "object") : [];
};

export const PEDS_SAFETY_RULES = [
  {
    key: "triage_danger_sign_no_action",
    level: "critical",
    provenance: "guideline",
    source: "who_imci",
    title: "A general danger sign is documented without an urgent action",
    basis:
      "WHO IMCI classifies a child with any general danger sign as requiring urgent referral or admission. The note records the sign but no action that meets that requirement.",
    fires: (values) => {
      if (!m(values, "peds_triage", "tri_danger_signs").length) return false;
      const actions = m(values, "peds_triage", "tri_action");
      return !actions.some((a) => DANGER_SIGN_ACTIONS.includes(a));
    },
  },
  {
    key: "triage_fast_breathing_not_recorded",
    level: "warning",
    provenance: "guideline",
    source: "who_imci",
    title: "The recorded respiratory rate meets the WHO threshold but fast breathing is not recorded",
    basis:
      "WHO IMCI defines fast breathing by age: 60/min or more under 2 months, 50/min or more at 2–11 months, 40/min or more at 12–59 months. The rate recorded on this note meets that threshold and the assessment says it is absent.",
    fires: (values) => {
      const band = f(values, "peds_triage", "tri_age_band");
      const threshold = FAST_BREATHING[band];
      const rate = num(f(values, "peds_triage", "tri_resp_rate"));
      if (!threshold || rate === null) return false;
      return rate >= threshold && f(values, "peds_triage", "tri_fast_breathing") === "Absent";
    },
  },
  {
    key: "triage_hypoxaemia_no_oxygen",
    level: "critical",
    provenance: "guideline",
    source: "who_oxygen",
    title: "Oxygen saturation below 90% is recorded without oxygen",
    basis:
      "WHO oxygen therapy guidance treats a saturation below 90% as hypoxaemia requiring oxygen. The note records the value but not oxygen being given.",
    fires: (values) => {
      const spo2 = num(f(values, "peds_triage", "tri_spo2"));
      if (spo2 === null || spo2 >= 90) return false;
      return !OXYGEN_GIVEN.includes(f(values, "peds_respiratory", "res_oxygen"));
    },
  },
  {
    key: "respiratory_hypoxaemia_no_oxygen",
    level: "critical",
    provenance: "guideline",
    source: "who_oxygen",
    title: "Oxygen saturation below 90% is recorded without oxygen",
    basis:
      "WHO oxygen therapy guidance treats a saturation below 90% as hypoxaemia requiring oxygen. The note records the saturation but not oxygen being given.",
    fires: (values) => {
      const spo2 = num(f(values, "peds_respiratory", "res_spo2"));
      if (spo2 === null || spo2 >= 90) return false;
      return !OXYGEN_GIVEN.includes(f(values, "peds_respiratory", "res_oxygen"));
    },
  },
  {
    key: "respiratory_severe_pneumonia_no_antibiotic",
    level: "warning",
    provenance: "guideline",
    source: "who_pneumonia",
    title: "Severe pneumonia is classified without an antibiotic recorded",
    basis:
      "WHO classifies severe pneumonia as requiring antibiotic treatment and referral. The note records the classification but not the treatment decision.",
    fires: (values) =>
      f(values, "peds_respiratory", "res_classification") === "Severe pneumonia — indrawing or danger sign" &&
      isBlankOrUndocumented(f(values, "peds_respiratory", "res_antibiotic")),
  },
  {
    key: "bronchiolitis_treatment_without_basis",
    level: "warning",
    provenance: "guideline",
    source: "aap_bronchiolitis",
    title: "Bronchiolitis treated with a bronchodilator or corticosteroid without a documented basis",
    basis:
      "The AAP bronchiolitis guideline does not recommend routine bronchodilators, corticosteroids or antibiotics. The note records bronchiolitis and one of those treatments without the reason or the response.",
    fires: (values) => {
      if (f(values, "peds_respiratory", "res_classification") !== "Bronchiolitis") return false;
      const bronchodilator = f(values, "peds_respiratory", "res_bronchodilator");
      const steroid = f(values, "peds_respiratory", "res_steroid");
      const antibiotic = f(values, "peds_respiratory", "res_antibiotic");
      return (
        bronchodilator === "Given — no response documented" ||
        steroid === "Systemic corticosteroid given" ||
        steroid === "Inhaled corticosteroid started" ||
        antibiotic === "Prescribed"
      );
    },
  },
  {
    key: "dehydration_severe_no_plan_c",
    level: "critical",
    provenance: "guideline",
    source: "who_diarrhoea",
    title: "Severe dehydration is classified without Plan C recorded",
    basis:
      "WHO classifies severe dehydration as requiring intravenous fluids and urgent referral (Plan C). The note records severe dehydration with a different or no plan.",
    fires: (values) =>
      f(values, "peds_dehydration", "deh_classification") === "Severe dehydration" &&
      f(values, "peds_dehydration", "deh_plan") !== "Plan C — intravenous fluids and urgent referral",
  },
  {
    key: "dehydration_no_reassessment",
    level: "warning",
    provenance: "guideline",
    source: "who_diarrhoea",
    title: "Rehydration is planned without a documented reassessment",
    basis:
      "WHO oral rehydration under observation (Plan B) and intravenous rehydration (Plan C) both require the child to be reassessed and reclassified. The note records the plan and no reassessment.",
    fires: (values) => {
      const plan = f(values, "peds_dehydration", "deh_plan");
      if (!plan.startsWith("Plan B") && !plan.startsWith("Plan C")) return false;
      return isBlankOrUndocumented(f(values, "peds_dehydration", "deh_reassess"));
    },
  },
  {
    key: "malnutrition_sam_no_treatment",
    level: "critical",
    provenance: "guideline",
    source: "who_malnutrition",
    title: "Severe acute malnutrition is documented without nutrition treatment",
    basis:
      "WHO criteria (MUAC below 115 mm, weight-for-height below −3 SD, or bilateral pitting oedema) define severe acute malnutrition, which requires therapeutic feeding and the complications reviewed. The note records the classification but no treatment.",
    fires: (values) => {
      const muac = num(f(values, "peds_malnutrition", "mal_muac_mm"));
      const severe =
        f(values, "peds_malnutrition", "mal_classification") === "Severe acute malnutrition" ||
        (muac !== null && muac < 115) ||
        f(values, "peds_malnutrition", "mal_oedema") === "Present";
      if (!severe) return false;
      return m(values, "peds_malnutrition", "mal_treatment").length === 0;
    },
  },
  {
    key: "malnutrition_sam_no_glucose_check",
    level: "warning",
    provenance: "guideline",
    source: "who_malnutrition",
    title: "Severe acute malnutrition without a documented hypoglycaemia check",
    basis:
      "WHO management of severe acute malnutrition requires hypoglycaemia and hypothermia to be checked and treated on admission. The note records the classification without the check.",
    fires: (values) => {
      if (f(values, "peds_malnutrition", "mal_classification") !== "Severe acute malnutrition") return false;
      return isBlankOrUndocumented(f(values, "peds_malnutrition", "mal_hypoglycaemia"));
    },
  },
  {
    key: "growth_without_reference",
    level: "warning",
    provenance: "guideline",
    source: "who_growth_standards",
    title: "Measurements are recorded without the reference they were plotted on",
    basis:
      "WHO publishes the 0–5 year standards and the 5–19 year reference as different references. A centile or z-score without the reference recorded cannot be interpreted, and a national chart places the same child differently.",
    fires: (values) => {
      if (!used(values, "peds_growth")) return false;
      const chart = f(values, "peds_growth", "gr_chart_used");
      const measured =
        !isBlankOrUndocumented(f(values, "peds_growth", "gr_weight_kg")) ||
        !isBlankOrUndocumented(f(values, "peds_growth", "gr_length_cm"));
      return measured && (isBlankOrUndocumented(chart) || chart === "No chart used");
    },
  },
  {
    key: "growth_crossing_centiles_no_concern",
    level: "warning",
    provenance: "guideline",
    source: "who_growth_standards",
    title: "Growth crossing centiles downward with no concern documented",
    basis:
      "A child whose growth crosses centiles downward requires assessment; the trajectory is the finding, not the single plotted value. The note records the trajectory and no concern.",
    fires: (values) =>
      f(values, "peds_growth", "gr_trajectory") === "Crossing centiles downward" &&
      (m(values, "peds_growth", "gr_concern").length === 0 || m(values, "peds_growth", "gr_concern").join(",") === "None identified"),
  },
  {
    key: "newborn_temperature_not_recorded",
    level: "warning",
    provenance: "guideline",
    source: "who_newborn",
    title: "The newborn record carries no temperature",
    basis:
      "WHO newborn care requires thermal care to be documented, with hypothermia defined from the axillary temperature. The newborn record was used and the temperature left blank.",
    fires: (values) => used(values, "peds_newborn") && isBlankOrUndocumented(f(values, "peds_newborn", "nb_temp_c")),
  },
  {
    key: "newborn_feeding_not_recorded",
    level: "warning",
    provenance: "guideline",
    source: "who_breastfeeding",
    title: "The newborn record carries no feeding initiation",
    basis:
      "WHO recommends initiating breastfeeding within one hour of birth and recording it. The newborn record was used and the initiation of feeding left blank.",
    fires: (values) => used(values, "peds_newborn") && isBlankOrUndocumented(f(values, "peds_newborn", "nb_feeding_started")),
  },
  {
    key: "newborn_vitamin_k_not_recorded",
    level: "warning",
    provenance: "guideline",
    source: "aap_vitamin_k",
    title: "Vitamin K prophylaxis is not recorded",
    basis:
      "Vitamin K prophylaxis is given to every newborn unless the parents decline, and the decision is documented. The newborn record does not state whether it was given.",
    fires: (values) => used(values, "peds_newborn") && isBlankOrUndocumented(f(values, "peds_newborn", "nb_vitamin_k")),
  },
  {
    key: "newborn_danger_sign_no_action",
    level: "critical",
    provenance: "guideline",
    source: "who_imci",
    title: "A newborn danger sign is documented with no action",
    basis:
      "A young infant with a danger sign is classified as having severe disease requiring urgent referral. The record documents the sign without an action or return criteria.",
    fires: (values) => {
      if (!m(values, "peds_newborn", "nb_danger_signs").length) return false;
      const actions = m(values, "peds_triage", "tri_action");
      const returnCriteria = f(values, "peds_family", "fam_return_criteria");
      return actions.length === 0 && isBlankOrUndocumented(returnCriteria);
    },
  },
  {
    key: "jaundice_without_bilirubin",
    level: "critical",
    provenance: "guideline",
    source: "aap_hyperbilirubinemia",
    title: "Jaundice is documented without a bilirubin value",
    basis:
      "The AAP hyperbilirubinaemia guideline decides treatment from a measured bilirubin plotted against age in hours. The note records jaundice without a bilirubin value.",
    fires: (values) => {
      const newbornJaundice = f(values, "peds_newborn", "nb_jaundice").startsWith("Present");
      const blockJaundice = used(values, "peds_jaundice");
      if (!newbornJaundice && !blockJaundice) return false;
      return isBlankOrUndocumented(f(values, "peds_jaundice", "ja_bilirubin_value"));
    },
  },
  {
    key: "jaundice_no_chart",
    level: "warning",
    provenance: "guideline",
    source: "aap_hyperbilirubinemia",
    title: "A bilirubin value is recorded without the chart and threshold it was read against",
    basis:
      "A bilirubin value decides treatment only against a chart. The bodies publish different charts, so the one applied and the threshold read from it are recorded on the note.",
    fires: (values) => {
      if (isBlankOrUndocumented(f(values, "peds_jaundice", "ja_bilirubin_value"))) return false;
      const state = f(values, "peds_jaundice", "ja_threshold_state");
      return isBlankOrUndocumented(state) || state === "Threshold not read";
    },
  },
  {
    key: "jaundice_early_no_action",
    level: "warning",
    provenance: "guideline",
    source: "aap_hyperbilirubinemia",
    title: "Jaundice in the first 24 hours with no treatment or review documented",
    basis:
      "Jaundice appearing before 24 hours of age is always investigated promptly. The note records an onset under 24 hours without a treatment or follow-up decision.",
    fires: (values) => {
      const onset = num(f(values, "peds_jaundice", "ja_onset_age_hours"));
      const early = (onset !== null && onset < 24) || f(values, "peds_newborn", "nb_jaundice") === "Present — onset under 24 hours";
      if (!early) return false;
      return m(values, "peds_jaundice", "ja_treatment").length === 0 && isBlankOrUndocumented(f(values, "peds_jaundice", "ja_followup"));
    },
  },
  {
    key: "development_red_flag_no_referral",
    level: "critical",
    provenance: "guideline",
    source: "aap_developmental_screening",
    title: "A developmental red flag is documented without a referral",
    basis:
      "The AAP developmental surveillance and screening document requires a red flag to lead to referral rather than observation alone. The note records the flag and no referral destination.",
    fires: (values) =>
      m(values, "peds_development", "dev_red_flags").length > 0 &&
      isBlankOrUndocumented(f(values, "peds_development", "dev_referral_route")),
  },
  {
    key: "development_screen_positive_no_referral",
    level: "warning",
    provenance: "guideline",
    source: "aap_autism",
    title: "A positive developmental screen without the referral recorded",
    basis:
      "A positive screening result requires diagnostic assessment rather than a repeat screen alone. The note records a positive screen and no referral destination.",
    fires: (values) =>
      f(values, "peds_development", "dev_result").startsWith("Screen positive") &&
      f(values, "peds_development", "dev_result") !== "Screen positive — referral made" &&
      isBlankOrUndocumented(f(values, "peds_development", "dev_referral_route")),
  },
  {
    key: "immunisation_overdue_no_catch_up",
    level: "warning",
    provenance: "guideline",
    source: "who_immunization",
    title: "Overdue antigens are recorded without a catch-up plan",
    basis:
      "An overdue antigen is a documented gap that requires a catch-up schedule against the child's own programme. The note records the gap without one.",
    fires: (values) => {
      if (!m(values, "peds_immunisation", "imm_overdue").length) return false;
      const catchUp = f(values, "peds_immunisation", "imm_catch_up");
      return isBlankOrUndocumented(catchUp) || catchUp === "Catch-up not yet documented";
    },
  },
  {
    key: "adolescent_confidentiality_not_documented",
    level: "warning",
    provenance: "guideline",
    source: "aap_adolescent_confidentiality",
    title: "Confidential time and its limits are not recorded",
    basis:
      "The AAP confidentiality statement requires the adolescent to have confidential time and to be told what is and is not shared. The adolescent record does not state either.",
    fires: (values) => {
      if (!used(values, "peds_adolescent")) return false;
      return (
        isBlankOrUndocumented(f(values, "peds_adolescent", "ado_confidentiality")) ||
        isBlankOrUndocumented(f(values, "peds_adolescent", "ado_seen_alone"))
      );
    },
  },
  {
    key: "adolescent_risk_without_plan",
    level: "critical",
    provenance: "guideline",
    source: "aap_glad_pc",
    title: "A positive mood screen without a suicide-risk assessment",
    basis:
      "The GLAD-PC guideline requires a positive depression screen to be followed by a suicide-risk assessment and, where risk is identified, a safety plan. The note records the positive screen without the assessment.",
    fires: (values) => {
      if (f(values, "peds_adolescent", "ado_mood_screen") !== "Screen positive — further assessment") return false;
      const risk = f(values, "peds_adolescent", "ado_suicide_risk");
      return isBlankOrUndocumented(risk) || risk === "Not assessed";
    },
  },
  {
    key: "safeguarding_concern_no_action",
    level: "critical",
    provenance: "guideline",
    source: "who_inspire",
    title: "A safeguarding concern is documented without an action or a route",
    basis:
      "A documented concern requires a documented action and referral route, recorded with the time. The note records the concern without either.",
    fires: (values) => {
      const concern = f(values, "peds_safeguarding", "sg_concern");
      if (!["Concern documented", "Suspicion of abuse or neglect", "Disclosure made"].includes(concern)) return false;
      return m(values, "peds_safeguarding", "sg_actions").length === 0 || isBlankOrUndocumented(f(values, "peds_safeguarding", "sg_route"));
    },
  },
  {
    key: "procedure_weight_not_recorded",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "Sedation is documented without the weight the dose was calculated from",
    basis:
      "Paediatric drug doses are calculated from weight. AMedix requires the weight used for dosing to be recorded whenever a sedative or anaesthetic agent is documented, so the dose can be checked later.",
    fires: (values) =>
      !isBlankOrUndocumented(f(values, "peds_procedure", "proc_sedation")) &&
      isBlankOrUndocumented(f(values, "peds_procedure", "proc_weight_kg")),
  },
  {
    key: "procedure_consent_not_recorded",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "The procedure is documented without consent",
    basis:
      "A procedure on a child requires guardian consent, and the child's assent where age allows. The note records neither.",
    fires: (values) => {
      if (!used(values, "peds_procedure")) return false;
      const consent = f(values, "peds_procedure", "proc_consent");
      return isBlankOrUndocumented(consent) || consent === "Consent not documented";
    },
  },
  {
    key: "family_return_criteria_not_recorded",
    level: "warning",
    provenance: "local",
    source: "local",
    title: "Caregiver advice is recorded without the return criteria",
    basis:
      "AMedix requires the signs that must bring the child back to be recorded in the caregiver's own language, because the family makes that decision at home.",
    fires: (values) => used(values, "peds_family") && isBlankOrUndocumented(f(values, "peds_family", "fam_return_criteria")),
  },
  {
    key: "confirmed_diagnosis_without_code",
    level: "warning",
    provenance: "local",
    source: "local",
    title: "A confirmed diagnosis carries no ICD-11 MMS code",
    basis:
      "Every confirmed diagnosis on the note must either carry a WHO ICD-11 MMS code or be recorded as unresolved with the reason. A code is never guessed to fill the gap.",
    fires: (values) =>
      icdEntries(values).some((e) => str(e.status) === "Confirmed" && !str(e.code)),
  },
  {
    key: "code_awaiting_review",
    level: "advisory",
    provenance: "local",
    source: "local",
    title: "A coded diagnosis is still awaiting coding review",
    basis:
      "The code was recorded as review required: it has not been confirmed against the WHO browser. It is not presented as a verified code until a coding review confirms it.",
    fires: (values) =>
      icdEntries(values).some((e) => str(e.code) && str(e.mapping_state) === "review_required"),
  },

  // ---- The per-note record: dosing, age correction and time-critical findings ----
  {
    key: "note_dose_without_weight",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "A medicine is documented without the weight its dose was calculated from",
    basis:
      "Every pediatric dose in AMedix is weight-based. This note records a medicine but no measured weight, so the dose cannot be checked against the child it was written for.",
    fires: (values) => Boolean(noteValue(values, "peds_care_", "rx_drug")) && !noteValue(values, "peds_care_", "rx_weight_kg"),
  },
  {
    key: "note_dose_above_stated_maximum",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "The calculated dose exceeds the maximum recorded for this child",
    basis:
      "The medicine, the mg/kg and the maximum are all recorded. The arithmetic puts the calculated dose above that maximum, so the ceiling applies and the dose given must be the ceiling — not the calculated figure.",
    fires: (values) =>
      blocksWith(values, "peds_care_").some((v) => {
        const dose = weightBasedDose({ weightKg: v.rx_weight_kg, perKg: v.rx_mg_per_kg, maxDose: v.rx_max_mg });
        return Boolean(dose && dose.capped);
      }),
  },
  {
    key: "note_dose_maximum_not_stated",
    level: "warning",
    provenance: "local",
    source: "local",
    title: "A weight-based dose is recorded without the maximum for this child",
    basis:
      "A mg/kg dose without the maximum stated cannot be checked against the formulary ceiling. The maximum is recorded, or the reason it does not apply is written beside the dose.",
    fires: (values) =>
      Boolean(noteValue(values, "peds_care_", "rx_drug")) &&
      Boolean(noteValue(values, "peds_care_", "rx_mg_per_kg")) &&
      !noteValue(values, "peds_care_", "rx_max_mg"),
  },
  {
    key: "note_dose_allergy_not_checked",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "A medicine is documented without the allergy check",
    basis:
      "The allergy status recorded in this note has not been checked against the medicine prescribed. An unverified allergy is never read as no allergy.",
    fires: (values) => {
      if (!noteValue(values, "peds_care_", "rx_drug")) return false;
      const check = noteValue(values, "peds_care_", "rx_allergy_check");
      return isBlankOrUndocumented(check) || check === "Not checked";
    },
  },
  {
    key: "note_young_infant_fever_without_evaluation",
    level: "critical",
    provenance: "guideline",
    source: "who_imci",
    title: "Fever in an infant under 2 months is documented without an evaluation",
    basis:
      "WHO IMCI treats fever (37.5 °C or more) in a young infant as a sign requiring urgent assessment and a full evaluation for serious bacterial infection. This note records the fever and documents no evaluation and no critical severity.",
    fires: (values) => {
      const temp = num(noteValue(values, "peds_exam_", "vit_temp_c"));
      const band = noteValue(values, "peds_exam_", "vit_age_band");
      if (band !== "Under 2 months" || temp === null || temp < 37.5) return false;
      const evaluated =
        noteValue(values, "peds_assess_", "wkp_requested") || noteValue(values, "peds_assess_", "wkp_interpretation");
      const severity = noteValue(values, "peds_assess_", "asm_severity");
      return !evaluated && severity !== "Critical — resuscitation or immediate escalation";
    },
  },
  {
    key: "note_apnoea_without_monitoring",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "Apnoea is documented without a monitoring plan",
    basis:
      "A documented apnoea or breathing pause in an infant requires a documented monitoring plan and a named review. The note records the event and no monitoring parameters or frequency.",
    fires: (values) => {
      const apnoea =
        noteList(values, "peds_ctx_", "acu_red_flag_history").includes("Apnoea or breathing pause") ||
        noteList(values, "peds_exam_", "exs_resp_work").includes("Apnoea") ||
        Boolean(noteValue(values, "peds_care_", "nx_np_apnoea"));
      if (!apnoea) return false;
      return !noteList(values, "peds_care_", "mon_parameters").length || NOT_RECORDED(noteValue(values, "peds_care_", "mon_frequency"));
    },
  },
  {
    key: "note_cyanosis_without_saturation",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "Cyanosis is documented without an oxygen saturation",
    basis:
      "Central cyanosis is a time-critical finding. The note records it and no saturation, so the severity of the hypoxaemia is not documented.",
    fires: (values) => {
      const cyanosed =
        noteList(values, "peds_exam_", "exs_skin").includes("Cyanosis") ||
        noteList(values, "peds_exam_", "exn_skin_colour").includes("Central cyanosis");
      return cyanosed && !noteValue(values, "peds_exam_", "vit_spo2");
    },
  },
  {
    key: "note_shock_signs_without_action",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "Signs of poor perfusion are documented without an action or a disposition",
    basis:
      "A capillary refill of 2 seconds or more, cool peripheries or mottling is a documented perfusion abnormality. The note records it with no monitoring frequency, no deterioration trigger and no disposition decision.",
    fires: (values) => {
      const poorPerfusion =
        noteValue(values, "peds_exam_", "vit_crt") === "2 seconds or more" ||
        ["Cool peripheries documented", "Mottled"].includes(noteValue(values, "peds_exam_", "exs_perfusion")) ||
        noteList(values, "peds_assess_", "asm_red_flags").includes("Signs of shock");
      if (!poorPerfusion) return false;
      const decision = noteValue(values, "peds_care_", "dsp_decision");
      const undecided = isBlankOrUndocumented(decision) || decision === "Not yet decided";
      const monitored = noteList(values, "peds_care_", "mon_parameters").length > 0;
      return undecided && !monitored && !noteValue(values, "peds_care_", "mon_deterioration_trigger");
    },
  },
  {
    key: "note_seizure_without_management",
    level: "critical",
    provenance: "guideline",
    source: "ilae_seizure_classification",
    title: "A seizure is documented without any management recorded",
    basis:
      "A documented seizure requires the description, the time and the management given, including the anticonvulsant and its dose, or the documented reason none was required. This note records the seizure and no medicine at all.",
    fires: (values) => {
      const seizure =
        noteList(values, "peds_exam_", "exs_neuro").includes("Seizure activity observed") ||
        noteList(values, "peds_ctx_", "acu_red_flag_history").includes("Seizure");
      return seizure && !noteValue(values, "peds_care_", "rx_drug");
    },
  },
  {
    key: "note_reduced_consciousness_without_escalation",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "A reduced conscious level is documented without escalation recorded",
    basis:
      "A child who is not alert — drowsy, responding only to voice or pain, unresponsive, or lethargic — needs a documented escalation route, a monitoring frequency and a disposition. None is recorded on this note.",
    fires: (values) => {
      const reduced =
        ["Drowsy or irritable", "Responds to voice", "Responds to pain", "Unresponsive"].includes(
          noteValue(values, "peds_exam_", "vit_consciousness"),
        ) || ["Lethargic", "Irritable and inconsolable"].includes(noteValue(values, "peds_exam_", "exs_general"));
      if (!reduced) return false;
      const decision = noteValue(values, "peds_care_", "dsp_decision");
      const undecided = isBlankOrUndocumented(decision) || decision === "Not yet decided";
      return (
        undecided &&
        !noteList(values, "peds_care_", "mon_parameters").length &&
        !noteValue(values, "peds_care_", "mon_deterioration_trigger")
      );
    },
  },
  {
    key: "note_anaphylaxis_without_adrenaline",
    level: "critical",
    provenance: "local",
    source: "local",
    title: "Anaphylaxis is considered in the differential without adrenaline recorded",
    basis:
      "Where the note documents anaphylaxis as a differential, the management recorded must include adrenaline (epinephrine) with its weight-based dose, or the documented reason it was not given.",
    fires: (values) => {
      const reasoning = noteText(values, "peds_assess_", ["asm_differentials", "asm_leading", "asm_reasoning"]);
      if (!/anaphyla/i.test(reasoning)) return false;
      return !/adrenaline|epinephrine/i.test(noteText(values, "peds_care_", ["rx_drug", "rx_dose_basis_note"]));
    },
  },
  {
    key: "note_safeguarding_screen_without_record",
    level: "critical",
    provenance: "guideline",
    source: "aap_child_abuse",
    title: "A safeguarding concern is screened positive without a safeguarding record",
    basis:
      "The context record states a safeguarding concern was identified at this visit, and no safeguarding assessment is documented on the note. A concern recorded without an assessment, a route and a time leaves the child without a documented response.",
    fires: (values) =>
      noteValue(values, "peds_ctx_", "fam_safeguarding_screen") === "Concern identified — see safeguarding record" &&
      !used(values, "peds_safeguarding"),
  },
  {
    key: "note_preterm_corrected_age_missing",
    level: "warning",
    provenance: "guideline",
    source: "who_preterm",
    title: "A preterm infant's note does not record the corrected age",
    basis:
      "The gestational age recorded is under 37 weeks and the note carries no date of birth and no age, so growth and development cannot be read against the corrected age. The corrected age is recorded, or the reason it does not apply.",
    fires: (values) => {
      const gestation = num(noteValue(values, "peds_ctx_", "ctx_ga_weeks"));
      if (gestation === null || gestation >= 37) return false;
      return !noteValue(values, "peds_ctx_", "ctx_dob") && !noteValue(values, "peds_ctx_", "ctx_age_value");
    },
  },
  {
    key: "note_red_flag_without_severity",
    level: "warning",
    provenance: "local",
    source: "local",
    title: "A red flag is documented without a severity classification",
    basis:
      "The note records a time-critical finding but no severity classification, so the reader cannot tell whether it was treated as an emergency.",
    fires: (values) => {
      const flags = noteList(values, "peds_assess_", "asm_red_flags").filter((x) => x !== "None documented");
      if (!flags.length) return false;
      const severity = noteValue(values, "peds_assess_", "asm_severity");
      return isBlankOrUndocumented(severity) || severity === "Not classified";
    },
  },
  {
    key: "note_measurement_without_reference",
    level: "warning",
    provenance: "guideline",
    source: "who_growth_standards",
    title: "A measurement is recorded without the growth reference applied",
    basis:
      "A weight or length without the reference or chart it was read against cannot be interpreted. The reference is recorded, or the reason no chart was used.",
    fires: (values) => {
      const measured = ["msr_weight_kg", "msr_length_cm", "msr_head_cm"].some((key) =>
        Boolean(noteValue(values, "peds_exam_", key)),
      );
      if (!measured) return false;
      const reference = noteValue(values, "peds_exam_", "msr_growth_reference");
      return isBlankOrUndocumented(reference) || reference === "Not documented";
    },
  },
];

export const PEDS_LEVEL_LABEL = {
  critical: "Safety-critical",
  warning: "Review required",
  advisory: "Coding note",
};

const provenanceLabel = (rule) =>
  rule.provenance === "guideline"
    ? `Guideline requirement — ${refLabel(rule.source)}`
    : "AMedix local decision — not a guideline claim";

// The prompts this note actually raises, in a stable order.
export const buildPedsSafetyPrompts = ({ values } = {}) => {
  const safeValues = asObject(values);
  return PEDS_SAFETY_RULES.filter((rule) => {
    try {
      return Boolean(rule.fires(safeValues));
    } catch {
      // A rule never breaks the note form; a malformed value simply does not fire.
      return false;
    }
  }).map((rule) => ({
    key: rule.key,
    level: rule.level,
    levelLabel: PEDS_LEVEL_LABEL[rule.level] || "Review required",
    title: rule.title,
    basis: rule.basis,
    provenance: rule.provenance,
    provenanceLabel: provenanceLabel(rule),
    source: rule.source,
    sourceLabel: refLabel(rule.source),
  }));
};

// The readable text the saved note and its PDF carry.
export const formatPedsSafety = (value) => {
  const safe = asObject(value);
  const resolved = Array.isArray(safe.resolved) ? safe.resolved : [];
  if (!resolved.length) return "Advisory safety review — no prompt was raised by the documented content of this note.";
  const actions = asObject(safe.actions);
  const notApplicable = asObject(safe.not_applicable);
  const lines = resolved.map((p) => {
    const action = str(actions[p.key]);
    const na = str(notApplicable[p.key]);
    const outcome = action ? `Action documented: ${action}` : na ? `Not applicable: ${na}` : "Not addressed";
    return `[${p.levelLabel}] ${p.title}\n${p.basis}\nSource: ${p.provenanceLabel || p.sourceLabel}\n${outcome}`;
  });
  return `Advisory safety review — ${resolved.length} prompt(s) raised from documented content\n\n${lines.join("\n\n")}`;
};