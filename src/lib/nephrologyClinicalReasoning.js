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
    T("non_pharmacological", "Non-Pharmacological Management (volume, blood pressure and glycaemic targets, nephrotoxin avoidance)"),
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
  sec("Monitoring, Referral & Follow-Up", [T("followup_plan", "Follow-Up Plan")]);