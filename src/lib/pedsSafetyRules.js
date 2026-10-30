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

const refLabel = (key) => {
  const ref = PEDS_REFERENCES[key] || PEDS_REFERENCES.local;
  return `${ref.organization} — ${ref.title} (${ref.edition})`;
};

const b = (values, key) => pedsBlockValues(values, key);
const f = (values, key, field) => str(b(values, key)[field]);
const m = (values, key, field) => list(b(values, key)[field]);
const used = (values, key) => blockUsed(b(values, key));

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