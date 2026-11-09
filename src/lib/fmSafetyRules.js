// Family Medicine — advisory safety prompts.
//
// Each prompt compares what the note actually recorded with the requirement of the
// cited document. It states what was documented, the requirement it fails, and the
// source of that requirement. It never diagnoses, never orders treatment and never
// changes a diagnosis. Nothing here blocks saving the note.
//
// PROVENANCE
//   · GUIDELINE — the requirement is stated in the cited document.
//   · LABEL — a product-label compatibility check the prescriber and pharmacist
//     verify against the current label; AMedix does not hold label data.
//   · LOCAL — an AMedix/institution decision, labelled as such and never presented
//     as a guideline recommendation.
//
// A rule fires only from values that were documented. A blank is never treated as a
// negative finding, and a prompt is not a statement that the condition is present.

import { fmBlockValues, blockHasContent } from "@/lib/fmBlocks";
import { calculateFmScore, fmScoreInputs } from "@/lib/fmScores";
import { FM_REFERENCES } from "@/lib/fmReferences";
import { asObject, str, list, num } from "@/lib/fmFieldKit";

export const FM_SAFETY_PROVENANCE = {
  guideline: "Guideline requirement",
  label: "Product-label check — verified by the prescriber and pharmacist against the current label",
  local: "AMedix local decision — not a guideline claim",
};

const src = (key) => FM_REFERENCES[key] || FM_REFERENCES.aafp;

const bv = (values, block) => fmBlockValues(values, block);
const f = (values, block, field) => str(bv(values, block)[field]);
const m = (values, block, field) => list(bv(values, block)[field]);
const has = (values, block, field, needle) => m(values, block, field).includes(needle);
const score = (values, key) => {
  const result = calculateFmScore(key, fmScoreInputs(values, key));
  return result && !result.missing?.length ? result : null;
};

const HOME_DISPOSITIONS = ["Managed at home", "Observed in clinic"];
const ESCALATED = ["Referred to emergency department", "Admitted"];

const MED_TEXT = (values) =>
  [f(values, "fm_core", "treatment_plan"), f(values, "fm_chronic", "medication_changes"), f(values, "fm_core", "med_reconciliation_done")]
    .join(" ")
    .toLowerCase();

const TERATOGENIC_KEYWORDS = [
  "methotrexate", "warfarin", "isotretinoin", "valproate", "sodium valproate", "doxycycline",
  "ramipril", "lisinopril", "enalapril", "perindopril", "candesartan", "losartan", "valsartan",
  "atorvastatin", "simvastatin", "rosuvastatin", "ibuprofen", "diclofenac", "naproxen",
];

const pregnancyMedicationConcern = (values) => {
  const text = MED_TEXT(values);
  return TERATOGENIC_KEYWORDS.filter((k) => text.includes(k));
};

const rule = (r) => r;

export const FM_SAFETY_RULES = [
  // ---------------------------------------------------------------- Emergencies
  rule({
    key: "chest_pain_no_ecg",
    level: "critical",
    provenance: "guideline",
    source: "acc_aha",
    title: "Chest pain documented without an ECG or escalation",
    basis:
      "Acute chest pain requires an electrocardiogram and an assessment for an acute coronary syndrome before a patient is managed at home. This note documents chest pain with neither an ECG nor an escalation.",
    fires: (values) =>
      has(values, "fm_acute", "red_flags_present", "Chest pain") &&
      !m(values, "fm_acute", "point_of_care").includes("ECG") &&
      !ESCALATED.includes(f(values, "fm_acute", "disposition")),
  }),
  rule({
    key: "stroke_deficit_not_escalated",
    level: "critical",
    provenance: "guideline",
    source: "nice",
    title: "Focal neurological deficit documented without emergency escalation",
    basis:
      "Sudden focal neurological deficit is a time-critical presentation. The note records the deficit but not referral to emergency care or admission.",
    fires: (values) =>
      has(values, "fm_acute", "red_flags_present", "Focal neurological deficit") &&
      !ESCALATED.includes(f(values, "fm_acute", "disposition")),
  }),
  rule({
    key: "sepsis_features_not_escalated",
    level: "critical",
    provenance: "guideline",
    source: "nice",
    title: "Features of possible sepsis without escalation",
    basis:
      "Fever with rigors or altered mental state requires a sepsis assessment and, where the criteria are met, urgent escalation. The note records the features without referral to emergency care or admission.",
    fires: (values) =>
      (f(values, "fm_acute", "fever") === "Measured ≥38.0 °C" || has(values, "fm_acute", "systemic_features", "Rigors")) &&
      (has(values, "fm_acute", "red_flags_present", "Altered mental state") || has(values, "fm_acute", "red_flags_present", "Breathlessness at rest")) &&
      !ESCALATED.includes(f(values, "fm_acute", "disposition")),
  }),
  rule({
    key: "respiratory_distress_home",
    level: "critical",
    provenance: "guideline",
    source: "nice",
    title: "Breathlessness at rest with home management",
    basis:
      "Breathlessness at rest is a red-flag presentation. The note records it and records management at home without escalation or an oxygen saturation.",
    fires: (values) =>
      has(values, "fm_acute", "red_flags_present", "Breathlessness at rest") &&
      HOME_DISPOSITIONS.includes(f(values, "fm_acute", "disposition")) &&
      !m(values, "fm_acute", "point_of_care").includes("SpO2"),
  }),
  rule({
    key: "peritonism_not_referred",
    level: "critical",
    provenance: "guideline",
    source: "nice",
    title: "Peritonism documented without surgical referral",
    basis:
      "Rigidity or peritonism suggests a surgical abdomen and requires same-day surgical assessment. The note records the finding without emergency referral or admission.",
    fires: (values) =>
      (has(values, "fm_acute", "red_flags_present", "Peritonism / rigidity") ||
        has(values, "fm_acute", "red_flags_present", "Severe abdominal pain")) &&
      !ESCALATED.includes(f(values, "fm_acute", "disposition")),
  }),
  rule({
    key: "infant_fever",
    level: "critical",
    provenance: "guideline",
    source: "nice",
    title: "Fever in an infant under 3 months",
    basis:
      "A fever of 38 °C or more in an infant under 3 months is a red flag requiring same-day paediatric assessment. The note records this feature.",
    fires: (values) => has(values, "fm_child", "child_red_flags", "Age under 3 months with fever ≥38 °C"),
  }),
  rule({
    key: "child_serious_illness",
    level: "critical",
    provenance: "guideline",
    source: "nice",
    title: "Features of serious illness in a child",
    basis:
      "Lethargy, poor feeding, reduced urine output, grunting, a non-blanching rash, bilious vomiting or a seizure require urgent paediatric assessment. The note records one or more of these.",
    fires: (values) =>
      ["Lethargy or floppiness", "Poor feeding", "Reduced urine output", "Non-blanching rash", "Grunting or recessions", "Seizure", "Bilious vomiting"].some((x) =>
        has(values, "fm_child", "child_red_flags", x),
      ),
  }),
  rule({
    key: "pregnancy_danger_sign",
    level: "critical",
    provenance: "guideline",
    source: "acog",
    title: "Obstetric danger sign documented",
    basis:
      "Bleeding, severe headache, visual disturbance, epigastric pain or reduced fetal movements in pregnancy require same-day obstetric assessment. The note records a danger sign; confirm the obstetric referral is documented.",
    fires: (values) =>
      ["Vaginal bleeding", "Severe headache", "Visual disturbance", "Epigastric pain", "Reduced fetal movements"].some((x) =>
        has(values, "fm_maternal", "danger_signs", x),
      ) && f(values, "fm_maternal", "referral_to_maternity") !== "Yes",
  }),

  // -------------------------------------------------------------- Mental health
  rule({
    key: "phq9_item9",
    level: "critical",
    provenance: "guideline",
    source: "nice",
    title: "PHQ-9 item 9 answered positively",
    basis:
      "A positive answer to the self-harm item requires a direct suicide-risk assessment, documented in the note. The score is recorded; the risk assessment is not.",
    fires: (values) => {
      const r = score(values, "phq9");
      if (!r?.flagSelfHarm) return false;
      const ideation = f(values, "fm_mental", "suicidal_ideation");
      return !ideation || ideation === "Not asked";
    },
  }),
  rule({
    key: "suicide_plan_not_escalated",
    level: "critical",
    provenance: "guideline",
    source: "nice",
    title: "Active suicidal thoughts with a plan, without same-day escalation",
    basis:
      "Active suicidal ideation with a plan requires an urgent same-day mental-health assessment. The note records the ideation with a plan; the referral recorded is not an emergency referral.",
    fires: (values) =>
      f(values, "fm_mental", "suicidal_ideation") === "Active thoughts with plan" &&
      f(values, "fm_mental", "referral_made") !== "Emergency — same day",
  }),
  rule({
    key: "risk_not_asked",
    level: "warning",
    provenance: "guideline",
    source: "nice",
    title: "Mental-health assessment without a recorded risk enquiry",
    basis:
      "Risk of self-harm and suicide is asked about directly at assessment and the answer recorded. This note records a mental-health assessment with the risk question not asked.",
    fires: (values) =>
      blockHasContent(values, "fm_mental") &&
      ["suicidal_ideation", "self_harm"].some((k) => f(values, "fm_mental", k) === "Not asked"),
  }),

  // ------------------------------------------------------- Medications / safety
  rule({
    key: "teratogen_pregnancy",
    level: "critical",
    provenance: "label",
    source: "acog",
    title: "Medicine with known pregnancy risk documented in pregnancy",
    basis:
      "The plan names a medicine that is contraindicated or requires specialist review in pregnancy, and the note records the patient as pregnant. Verify against the current product label with the pharmacist before dispensing.",
    fires: (values) =>
      f(values, "fm_women", "pregnancy_status") === "Pregnant" && pregnancyMedicationConcern(values).length > 0,
    detail: (values) => `Medicine named in the plan: ${pregnancyMedicationConcern(values).join(", ")}.`,
  }),
  rule({
    key: "teratogen_pregnancy_unknown",
    level: "warning",
    provenance: "label",
    source: "acog",
    title: "Pregnancy status not documented before a medicine requiring review",
    basis:
      "The plan names a medicine that requires pregnancy review, and pregnancy status is not recorded. Record the status (or the reason it does not apply) before dispensing.",
    fires: (values) =>
      ["Not documented", ""].includes(f(values, "fm_women", "pregnancy_status")) &&
      pregnancyMedicationConcern(values).length > 0,
    detail: (values) => `Medicine named in the plan: ${pregnancyMedicationConcern(values).join(", ")}.`,
  }),
  rule({
    key: "allergy_list_not_reviewed",
    level: "warning",
    provenance: "guideline",
    source: "aafp",
    title: "Allergy list not reviewed before a prescribing decision",
    basis:
      "A primary-care consultation that records a treatment plan reviews the patient's allergy list. This note records a plan without recording that the allergy list was reviewed.",
    fires: (values) =>
      Boolean(f(values, "fm_core", "treatment_plan")) && f(values, "fm_core", "allergy_reviewed") !== "Yes",
  }),
  rule({
    key: "polypharmacy_no_review",
    level: "warning",
    provenance: "guideline",
    source: "nice",
    title: "Ten or more regular medicines without a documented medication review",
    basis:
      "Polypharmacy at this level warrants a structured medication review. The note records the number of medicines but no medication review content.",
    fires: (values) => {
      const n = num(bv(values, "fm_geriatric").polypharmacy);
      return n !== null && n >= 10 && !f(values, "fm_core", "med_discrepancies") && !f(values, "fm_chronic", "medication_changes");
    },
  }),

  // ------------------------------------------------------- Chronic disease care
  rule({
    key: "egfr_severe",
    level: "critical",
    provenance: "guideline",
    source: "kdigo",
    title: "eGFR below 15 mL/min/1.73 m²",
    basis:
      "An eGFR in the kidney-failure range requires urgent specialist assessment. The calculation is recorded; confirm the renal referral is documented.",
    fires: (values) => {
      const r = score(values, "egfr");
      return r ? r.value < 15 : false;
    },
  }),
  rule({
    key: "egfr_low_no_referral",
    level: "warning",
    provenance: "guideline",
    source: "kdigo",
    title: "eGFR below 30 mL/min/1.73 m² without a documented renal referral",
    basis:
      "KDIGO advises referral to kidney services for severely reduced filtration. The note records the value without a referral or an explanation why one is not indicated.",
    fires: (values) => {
      const r = score(values, "egfr");
      if (!r || r.value >= 30) return false;
      const text = `${f(values, "fm_core", "referral")} ${f(values, "fm_core", "plan")}`.toLowerCase();
      return !/nephro|renal|kidney/.test(text);
    },
  }),
  rule({
    key: "diabetes_no_foot_exam",
    level: "warning",
    provenance: "guideline",
    source: "ada",
    title: "Diabetes review without a foot examination",
    basis:
      "A diabetes review includes foot assessment for neuropathy, ischaemia and ulcer risk. The note records diabetes care without documenting a foot examination.",
    fires: (values) =>
      (has(values, "fm_chronic", "condition_focus", "Type 2 diabetes") || has(values, "fm_chronic", "condition_focus", "Type 1 diabetes")) &&
      blockHasContent(values, "fm_chronic") &&
      !has(values, "fm_chronic", "monitoring_done", "Foot examination") &&
      f(values, "fm_chronic", "monitoring_due") === "",
  }),
  rule({
    key: "asthma_uncontrolled",
    level: "warning",
    provenance: "guideline",
    source: "gina",
    title: "Uncontrolled asthma without a documented treatment decision",
    basis:
      "The GINA tool records uncontrolled asthma. The note does not record a treatment change, a review date, or a reason for not changing treatment.",
    fires: (values) => {
      const r = score(values, "asthma_control");
      if (!r || r.value < 3) return false;
      return !f(values, "fm_chronic", "medication_changes") && !f(values, "fm_core", "follow_up_interval") && !f(values, "fm_chronic", "next_review");
    },
  }),
  rule({
    key: "hba1c_above_target_no_followup",
    level: "warning",
    provenance: "guideline",
    source: "ada",
    title: "HbA1c above the recorded target without a follow-up plan",
    basis:
      "Glycaemia above the individualised target calls for a documented plan and a review interval. Neither is recorded.",
    fires: (values) => {
      const r = score(values, "hba1c");
      if (!r) return false;
      const value = num(r.value);
      const target = num(fmScoreInputs(values, "hba1c").hba1c_target);
      if (value === null || target === null || value <= target) return false;
      return !f(values, "fm_chronic", "next_review") && !f(values, "fm_core", "follow_up_interval");
    },
  }),

  // --------------------------------------------------------- Older adults
  rule({
    key: "falls_positive_no_assessment",
    level: "warning",
    provenance: "guideline",
    source: "cdc_steadi",
    title: "Positive falls screen without a gait and balance assessment",
    basis:
      "A positive falls screen requires gait, strength and balance assessment and a review of contributing medication under the STEADI algorithm. Neither is documented.",
    fires: (values) => {
      const fallsRecorded =
        ["One", "Two", "Three or more"].includes(f(values, "fm_geriatric", "falls_past_year")) ||
        score(values, "falls_screen")?.value > 0;
      if (!fallsRecorded) return false;
      const text = `${f(values, "fm_geriatric", "mobility_aid")} ${f(values, "fm_core", "examination")} ${f(values, "fm_core", "plan")}`.toLowerCase();
      return !/gait|balance|timed up|tug|steadi|strength/.test(text);
    },
  }),
  rule({
    key: "delirium_possible",
    level: "critical",
    provenance: "guideline",
    source: "nice",
    title: "Acute change in attention or awareness",
    basis:
      "An acute change in attention or awareness suggests delirium, which is a medical emergency in an older adult until proven otherwise. The note records the change; confirm the assessment and escalation are documented.",
    fires: (values) => f(values, "fm_geriatric", "delirium_features") === "Present",
  }),
  rule({
    key: "severe_frailty_no_plan",
    level: "warning",
    provenance: "guideline",
    source: "cdc_steadi",
    title: "Severe frailty without an advance-care discussion",
    basis:
      "Severe frailty affects treatment goals and escalation decisions. The note records the frailty level without a documented advance-care discussion or a reason one was not held.",
    fires: (values) => {
      const r = score(values, "cfs");
      if (!r || r.value < 7) return false;
      return ["", "Not documented"].includes(f(values, "fm_geriatric", "advance_care"));
    },
  }),

  // ---------------------------------------------------------- Prevention
  rule({
    key: "smoker_no_cessation",
    level: "warning",
    provenance: "guideline",
    source: "uspstf",
    title: "Current smoker without documented cessation support",
    basis:
      "Every contact with a person who smokes is an opportunity to advise stopping and offer support. The note records current smoking without cessation counselling or a referral.",
    fires: (values) => {
      const status = f(values, "fm_lifestyle", "smoking_status");
      if (status !== "Current smoker" && status !== "Waterpipe / shisha") return false;
      return !m(values, "fm_lifestyle", "counselling_given").includes("Smoking cessation") && !m(values, "fm_lifestyle", "referral").includes("Smoking cessation service");
    },
  }),
  rule({
    key: "obesity_no_intervention",
    level: "warning",
    provenance: "guideline",
    source: "uspstf",
    title: "BMI in the obesity range without a documented intervention",
    basis:
      "Adults with obesity should be offered intensive multicomponent behavioural intervention. The note records the BMI without counselling or a referral.",
    fires: (values) => {
      const r = score(values, "bmi");
      if (!r || r.value < 30) return false;
      return !m(values, "fm_lifestyle", "counselling_given").length && !m(values, "fm_lifestyle", "referral").length;
    },
  }),
  rule({
    key: "vaccine_consent",
    level: "warning",
    provenance: "local",
    source: "who_immunization",
    title: "Vaccine given without a documented consent",
    basis:
      "AMedix records consent for every dose administered. The note records a vaccine given with consent not documented.",
    fires: (values) => Boolean(f(values, "fm_vaccine", "vaccine_name")) && ["", "Not documented"].includes(f(values, "fm_vaccine", "consent")),
  }),
  rule({
    key: "vaccine_anaphylaxis",
    level: "critical",
    provenance: "guideline",
    source: "who_immunization",
    title: "Anaphylaxis recorded after vaccination",
    basis:
      "Anaphylaxis after a vaccine requires emergency treatment and reporting to the national immunization programme. The note records the reaction; confirm both are documented.",
    fires: (values) => f(values, "fm_vaccine", "reaction") === "Anaphylaxis — emergency pathway activated",
  }),
];

// One prompt per rule that fires, each carrying the text and the source a reader
// needs to see why it was raised.
export const buildFmSafetyPrompts = ({ values = {} } = {}) =>
  FM_SAFETY_RULES.filter((r) => {
    try {
      return Boolean(r.fires(values));
    } catch {
      return false;
    }
  }).map((r) => {
    const ref = src(r.source);
    let detail = "";
    try {
      detail = r.detail ? r.detail(values) : "";
    } catch {
      detail = "";
    }
    return {
      key: r.key,
      level: r.level,
      title: r.title,
      basis: r.basis,
      detail,
      provenance: r.provenance,
      provenanceLabel: FM_SAFETY_PROVENANCE[r.provenance] || "AMedix advisory",
      source: {
        key: ref.key,
        organization: ref.issuing_organization,
        title: ref.title,
        url: ref.source_url,
      },
    };
  });

export const fmSafetyPrompt = (values, key) => buildFmSafetyPrompts({ values }).find((p) => p.key === key) || null;