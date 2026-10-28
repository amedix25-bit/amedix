// Shared closing sections added to every rheumatology document — both the
// department's note types and the disease-specific templates. They close the
// gaps the specification names explicitly:
//
//  • encounter context and the reliability of the information recorded,
//    including interpreter assistance and the patient's own concerns;
//  • explicit labelling of where each piece of information came from, so a
//    patient-reported symptom is never read as an examination finding, a
//    transcribed external report is never read as a verified result in AMedix,
//    and a system-generated reminder is never read as a clinical finding;
//  • a final impression and plan with diagnostic certainty, medication changes
//    and their rationale, ownership of outstanding results, safety-net
//    instructions and the objectives of follow-up.
//
// These are documentation fields only. Nothing here calculates a score,
// assigns a diagnosis or recommends a treatment.

const I = (key, label, x = {}) => ({ key, label, type: "input", ...x });
const T = (key, label, x = {}) => ({ key, label, type: "textarea", ...x });
const S = (key, label, options, x = {}) => ({ key, label, type: "select", options, ...x });
const when = (key, ...values) => ({ showIf: { key, in: values } });

export const ENCOUNTER_CONTEXT_FIELDS = [
  S("history_source", "History Obtained From", [
    "Patient — direct interview",
    "Patient with relative or carer",
    "Referring clinician's letter / transfer documentation",
    "Records review — patient not present",
    "Mixed sources — documented below",
  ]),
  S("history_reliability", "Reliability of the History", [
    "Reliable and complete",
    "Partially reliable — gaps documented",
    "Unreliable — documented below",
    "Not assessed",
  ]),
  T("information_limitations", "Limitations of the Information Recorded — missing records, recall difficulty, language, cognition", {}, when("history_reliability", "Partially reliable — gaps documented", "Unreliable — documented below", "Not assessed")),
  S("interpreter_used", "Interpreter Assistance", [
    "Not required",
    "Professional interpreter used",
    "Family member or ad-hoc interpreter used",
    "Patient declined an interpreter",
    "Language barrier — assessment limited",
  ]),
  I("interpreter_language", "Interpreter — Language", {}, when("interpreter_used", "Professional interpreter used", "Family member or ad-hoc interpreter used")),
  T("patient_concerns", "Patient's Own Concerns, Priorities and Goals for This Consultation"),
];

export const INFORMATION_SOURCE_FIELDS = [
  S("examination_source", "Examination Findings — Recorded By", [
    "Examined by me at this encounter",
    "Examined by another clinician — findings transcribed",
    "Patient-reported findings only — not examined",
    "Not examined",
  ]),
  S("laboratory_source", "Laboratory Results — Source", [
    "Verified laboratory report in AMedix",
    "External laboratory report transcribed",
    "Patient-reported result — unverified",
    "No laboratory results available",
  ]),
  S("imaging_source", "Imaging Findings — Source", [
    "Verified imaging report in AMedix",
    "External imaging report transcribed",
    "Images reviewed by me",
    "No imaging available",
  ]),
  S("system_prompts_reviewed", "Automated Reminders & Decision-Support Alerts Reviewed (system-generated, not clinical findings)", [
    "Reviewed — no action required",
    "Reviewed — action documented in the plan",
    "Not applicable to this note",
  ]),
];

export const FINAL_IMPRESSION_PLAN_FIELDS = [
  S("diagnostic_certainty", "Diagnostic Certainty", [
    "Confirmed — meets classification criteria",
    "Probable — meets some criteria",
    "Possible — under evaluation",
    "Undetermined",
    "Excluded",
  ]),
  T("final_clinical_impression", "Final Clinical Impression — the conclusion this note records, and what remains uncertain"),
  T("medication_changes", "Medication Changes at This Visit — drug, dose, change, and the clinical reason for it"),
  I("outstanding_results_owner", "Outstanding Results — who is responsible for review, and how the result reaches the patient"),
  T("safety_net_instructions", "Safety-Net Instructions Given — symptoms that require urgent contact, and where to seek care"),
  T("followup_objectives", "Follow-Up Objectives — what must be achieved by the next review, and when it is due"),
];

// Appends the shared closing sections to one rheumatology document. Any field
// the document already defines with the same key is left exactly as it is, so
// nothing is duplicated and no existing content is overwritten.
export function withRheumCoreSections(doc) {
  const existing = new Set((doc.fields || []).map((f) => f.key));
  const add = (section, fields) =>
    fields
      .filter((f) => !existing.has(f.key))
      .map((f) => ({ ...f, section }));

  return {
    ...doc,
    fields: [
      ...(doc.fields || []),
      ...add("Encounter Context & Reliability of Information", ENCOUNTER_CONTEXT_FIELDS),
      ...add("Source of Findings — Recorded Fact vs Interpretation", INFORMATION_SOURCE_FIELDS),
      ...add("Final Impression & Closing Plan", FINAL_IMPRESSION_PLAN_FIELDS),
    ],
  };
}