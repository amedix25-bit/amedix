// Shared Nephrology field builders for the assessment, differential diagnosis,
// management, safety and follow-up structure.
//
// The same rules as the rest of the AMedix clinical system apply: nothing is
// defaulted to normal, nothing is inferred, and no field prescribes, orders a
// test or confirms a diagnosis. ICD-11 codes are documentation — they are
// recorded alongside the reasoning, never instead of it.

import { NEPH_ICD11 } from "@/lib/nephIcd11";

const I = (key, label, x = {}) => ({ key, label, type: "input", ...x });
const T = (key, label, x = {}) => ({ key, label, type: "textarea", ...x });
const S = (key, label, options, x = {}) => ({ key, label, type: "select", options, ...x });
const when = (key, ...values) => ({ showIf: { key, in: values } });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

const REFERRAL_TARGETS = [
  "No referral needed — managed here",
  "Nephrology",
  "Urology",
  "Transplant unit",
  "Dialysis access service",
  "Interventional radiology",
  "Cardiology",
  "Endocrinology",
  "Dietitian",
  "Palliative care",
  "Other — see detail",
];

// ---- Assessment and clinical reasoning -------------------------------------
export const clinicalReasoningSection = () =>
  sec("Assessment & Clinical Reasoning", [
    T("principal_problem", "Principal Clinical Problem (the single problem this assessment addresses)"),
    S("principal_problem_category", "Category of the Principal Problem", [
      "Acute kidney injury",
      "Chronic kidney disease",
      "Glomerular disease",
      "Fluid, electrolyte or acid–base disorder",
      "Stone or obstruction",
      "Dialysis-related problem",
      "Transplant-related problem",
      "Hypertensive or vascular kidney disease",
      "Hereditary or cystic kidney disease",
      "Medication-related kidney problem",
      "Other — see detail",
    ]),
    T("principal_problem_detail", "Category — Detail", when("principal_problem_category", "Other — see detail")),
    T("underlying_disease", "Underlying Disease or Aetiology (what is causing it, and on what evidence)"),
    T("comorbidities_relevant", "Relevant Comorbidities and Their Current Control"),
    T("complication_summary", "Complications Present at This Assessment"),
    S("diagnostic_certainty", "Diagnostic Certainty", [
      "Established — supporting evidence documented",
      "Probable — supportive but incomplete evidence",
      "Uncertain — competing explanations remain",
      "Indeterminate — data insufficient to decide",
    ]),
    T("uncertainty_detail", "Nature of the Uncertainty and What Would Resolve It", when("diagnostic_certainty", "Uncertain — competing explanations remain", "Indeterminate — data insufficient to decide")),
    T("clinical_reasoning", "Clinical Reasoning (how the history, examination and results support this assessment)"),
    T("evidence_against", "Findings That Do Not Fit the Working Diagnosis"),
    S("reasoning_coding_distinction", "Coding and Reasoning Kept Separate", [
      "Confirmed — code reflects the documented diagnosis",
      "Working diagnosis — code recorded as suspected or provisional",
      "Not coded — insufficient evidence to assign a code",
    ]),
  ]);

// ---- Differential diagnosis ------------------------------------------------
export const differentialSection = () =>
  sec("Differential Diagnosis", [
    {
      key: "differential_diagnoses",
      label: "Differential Diagnoses — record each with the role 'Differential'",
      type: "icd11_diagnoses",
      catalog: NEPH_ICD11,
      searchPlaceholder: "Search ICD-11 — acute kidney failure, chronic kidney disease, nephritic or nephrotic syndrome, kidney calculus...",
    },
    T("differential_reasoning", "Discriminating Features Considered for Each Differential"),
    T("differential_excluded", "Diagnoses Considered and Excluded — and Why"),
    S("further_investigation", "Investigations Needed to Discriminate", [
      "None — the evidence is sufficient",
      "Requested — pending",
      "Discussed, not requested",
      "Not indicated",
    ]),
    T("further_investigation_detail", "Investigations — What, Why and the Urgency", when("further_investigation", "Requested — pending", "Discussed, not requested")),
  ]);

// ---- Management ------------------------------------------------------------
export const managementSection = () =>
  sec("Management", [
    T("treatment_goals", "Individualised Treatment Goals (what success looks like for this patient)"),
    S("goal_basis", "Goals Set On", [
      "Symptoms and function",
      "Slowing progression",
      "Avoiding hospital admission",
      "Preparing for kidney replacement therapy",
      "Reducing cardiovascular risk",
      "Protecting the transplant",
      "Comfort and quality of life",
      "Combination — see detail",
    ]),
    T("goal_detail", "Goal Detail", when("goal_basis", "Combination — see detail")),
    {
      key: "neph_medications",
      label: "Medication Review — renal dosing, contraindications, interactions and monitoring",
      type: "neph_medications",
    },
    T("non_pharmacological", "Non-Pharmacological Management (volume, blood pressure and glycaemic targets, nephrotoxin avoidance)"),
    T("lifestyle_diet_advice", "Lifestyle, Diet and Fluid Advice Given, with the Individualised Target"),
    S("adherence_support", "Adherence Discussed and Support Agreed", [
      "Adherent — no support needed",
      "Support agreed — see detail",
      "Non-adherence identified — see detail",
      "Not discussed",
    ]),
    T("adherence_support_detail", "Adherence — Barriers and the Support Agreed", when("adherence_support", "Support agreed — see detail", "Non-adherence identified — see detail")),
    S("shared_decision", "Shared Decision-Making", [
      "Discussed — patient agrees with the plan",
      "Discussed — patient undecided",
      "Discussed — patient declines part of the plan",
      "Not discussed — see reason",
    ]),
    T("shared_decision_detail", "Shared Decision-Making — Options, Trade-offs and the Patient's Preference", when("shared_decision", "Discussed — patient undecided", "Discussed — patient declines part of the plan", "Not discussed — see reason")),
    S("treatment_response", "Response to Management So Far", [
      "Not yet assessable — therapy just started",
      "Goals met",
      "Partial response",
      "No response",
      "Intolerance or adverse effect",
    ]),
    T("treatment_response_detail", "Response — the Values, Dates and What Was Changed", when("treatment_response", "Goals met", "Partial response", "No response", "Intolerance or adverse effect")),
  ]);

// ---- Safety prompts --------------------------------------------------------
export const nephrologySafetySection = () =>
  sec("Safety Prompts", [
    { key: "neph_alerts", label: "Safety prompts from the documented values", type: "neph_alerts" },
    S("urgent_action", "Action Taken on Any Urgent Prompt", [
      "No urgent prompt triggered",
      "Same-day clinical review arranged",
      "Emergency department or acute admission arranged",
      "Specialty service contacted (urology / transplant / access)",
      "Treatment changed — see detail",
      "Patient declined — documented",
    ]),
    T("urgent_action_detail", "Urgent Action — Detail, Time and Who Was Contacted", when("urgent_action", "Same-day clinical review arranged", "Emergency department or acute admission arranged", "Specialty service contacted (urology / transplant / access)", "Treatment changed — see detail", "Patient declined — documented")),
    T("safety_netting", "Safety-Netting Given to the Patient (what to do and where to go if worse)"),
  ]);

// ---- Monitoring, referral and follow-up ------------------------------------
export const monitoringFollowupSection = () =>
  sec("Monitoring, Referral & Follow-Up", [
    I("responsible_clinician", "Responsible Clinician for This Plan"),
    S("referral_required", "Referral", REFERRAL_TARGETS),
    T("referral_urgency_detail", "Referral — To Whom, For What and the Urgency", when("referral_required", ...REFERRAL_TARGETS.filter((t) => t !== "No referral needed — managed here"))),
    I("reassessment_interval", "Planned Reassessment Interval (e.g. 2 weeks, 3 months)"),
    T("planned_reassessment", "Planned Reassessment — What Is Checked, and When"),
    T("monitoring_requirements", "Monitoring Requirements (which tests, how often, and the target)"),
    S("escalation_plan", "Escalation Plan", [
      "Same-day nephrology review if red flags",
      "Emergency department if red flags",
      "Contact the transplant unit",
      "Contact the dialysis access service",
      "No escalation criteria documented",
    ]),
    T("escalation_triggers", "Escalation Triggers, Who to Contact and How"),
    T("patient_education_given", "Patient Education Given and Understanding Confirmed"),
    T("followup_plan", "Follow-Up Plan"),
  ]);