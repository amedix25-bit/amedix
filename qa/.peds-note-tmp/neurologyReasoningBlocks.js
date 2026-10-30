// Neurology — the clinical reasoning each note owes, whatever the diagnosis.
//
// The note types already record the history, the examination and the coded
// diagnosis. What they did not record, and what a reader of the record needs, is
// the reasoning between them: what else was considered, what was done about it,
// what is being monitored, what the patient was told and when they are next
// seen. Every field is optional and a blank stays blank.

const YES_NO_NOT = ["Yes", "No", "Not documented"];

export const REASONING_BLOCK = {
  key: "neuro_reasoning",
  title: "Differential Reasoning & Management Record",
  note: "What else was considered and what argued against it, what was acted on, what is being monitored, what the patient was told and when they are seen again. This is the clinician's reasoning, recorded — not a generated differential and not a suggested treatment.",
  fields: [
    {
      key: "rea_differentials",
      label: "Differentials considered",
      type: "textarea",
      placeholder: "Each alternative, and the finding that supports or argues against it",
    },
    {
      key: "rea_reasoning",
      label: "Reasoning for the recorded assessment",
      type: "textarea",
      placeholder: "Why the documented assessment is the best explanation of the findings recorded above",
    },
    {
      key: "rea_uncertainty",
      label: "What remains uncertain",
      type: "textarea",
      placeholder: "The finding that does not fit, or the question the record cannot yet answer",
    },
    {
      key: "rea_investigations",
      label: "Tests ordered, requested or reviewed — and their result",
      type: "textarea",
      placeholder: "What was ordered, when, and the result as reviewed — 'awaited' is recorded as awaited",
    },
    {
      key: "rea_management",
      label: "Management recorded by the clinician",
      type: "textarea",
      placeholder: "What was started, changed, stopped or deferred — and by whom",
    },
    {
      key: "rea_monitoring",
      label: "Monitoring recorded",
      type: "textarea",
      placeholder: "What is measured, how often, by whom, and the threshold that triggers review",
    },
    {
      key: "rea_counselling",
      label: "Counselling and advice given",
      type: "multi",
      options: [
        "Diagnosis and uncertainty explained", "Driving advice", "Work or school advice",
        "Seizure safety advice", "Falls and home safety", "Alcohol and sleep advice",
        "Pregnancy and contraception discussed", "Medication adherence and side effects",
        "Written information given", "None of these documented",
      ],
    },
    {
      key: "rea_red_flag_advice",
      label: "Advice given about when to seek urgent help",
      type: "textarea",
      placeholder: "The symptoms the patient was told to return for, and where to go",
    },
    {
      key: "rea_follow_up_interval",
      label: "Follow-up interval",
      type: "select",
      options: ["1 week", "2 weeks", "4 weeks", "3 months", "6 months", "12 months", "As needed", "No routine follow-up — reason documented", "Not documented"],
    },
    {
      key: "rea_follow_up_with",
      label: "Follow-up with",
      type: "input",
      placeholder: "Named clinician, clinic or service — and who arranges it",
    },
    { key: "rea_review_results", label: "Who reviews the outstanding results", type: "input", placeholder: "Name or role, and how the patient is told" },
    {
      key: "rea_second_opinion",
      label: "Discussion with a colleague recorded",
      type: "select",
      options: ["Yes — name and outcome recorded", "No — not required", "Requested — awaiting", "Not documented"],
    },
    {
      key: "rea_shared_decision",
      label: "Patient involvement recorded",
      type: "select",
      options: ["Decision made with the patient", "Decision made for the patient — reason documented", "Patient declined the plan", "Not documented"],
    },
    { key: "rea_questions", label: "Patient's questions and the answers given", type: "textarea" },
    {
      key: "rea_carer",
      label: "Family or carer involved",
      type: "select",
      options: ["Yes — with the patient's agreement", "Yes — patient lacks capacity, documented", "No — declined", "Not applicable", "Not documented"],
    },
    { key: "rea_next_review_trigger", label: "Finding that would trigger an earlier review", type: "input", placeholder: "The change that should bring the patient back sooner" },
    {
      key: "rea_documented_at",
      label: "Reasoning recorded at",
      type: "input",
      placeholder: "Date and time this reasoning was written",
    },
    {
      key: "rea_verified",
      label: "The clinician confirms this record reflects their own assessment",
      type: "select",
      options: YES_NO_NOT,
    },
  ],
};

export const NEURO_REASONING_BLOCKS = [REASONING_BLOCK];