// Internal Medicine — structured clinical blocks.
//
// One registry for the whole specialty, so the note form, the saved record and the
// printed note read the same definitions. Every item is optional and nothing is
// pre-selected: a blank is "not documented", never a normal finding. Conditional
// items appear only where the recorded context makes them relevant.
//
// Nothing here diagnoses or treats. A block records what the clinician documented.

import { asObject, str } from "@/lib/fmFieldKit";

const YN = ["Yes", "No", "Not documented"];
const YNNA = ["Yes", "No", "Not applicable", "Not documented"];

export const IM_BLOCKS = {
  // ------------------------------------------------------------ history
  im_history: {
    key: "im_history",
    title: "Comprehensive medical history",
    note: "The history an internal medicine assessment is built on. A blank is 'not documented', never a negative finding.",
    fields: [
      { key: "presenting_complaint", label: "Presenting complaint", type: "input", placeholder: "In the patient's own words" },
      { key: "hpi_onset", label: "Onset and timing", type: "input", placeholder: "When it started, sudden or gradual" },
      {
        key: "hpi_course",
        label: "Course since onset",
        type: "select",
        options: ["Improving", "Static", "Progressively worsening", "Intermittent / recurrent", "Not documented"],
      },
      { key: "hpi_character", label: "Character, site and radiation of the symptom", type: "text", placeholder: "What it is like, where it is, where it moves" },
      { key: "hpi_aggravating", label: "Aggravating and relieving factors", type: "input" },
      { key: "hpi_associated", label: "Associated symptoms (as reported)", type: "text" },
      { key: "hpi_systemic", label: "Systemic features — fever, weight loss, night sweats, appetite", type: "text" },
      { key: "hpi_function", label: "Functional impact", type: "input", placeholder: "e.g. cannot climb stairs, off work" },
      { key: "pmh_conditions", label: "Past medical history — conditions with duration", type: "text" },
      { key: "pmh_surgical", label: "Past surgical history — operation and year", type: "text" },
      { key: "pmh_admissions", label: "Previous admissions and ICU stays", type: "text" },
      { key: "medications", label: "Current medications as reconciled", type: "text", placeholder: "Name, dose, frequency — include over-the-counter and herbal products" },
      { key: "adherence", label: "Adherence as reported", type: "select", options: ["Full", "Partial", "Poor", "Stopped by patient", "Not documented"] },
      { key: "allergies", label: "Allergies and reaction type", type: "text", placeholder: "Agent, reaction, when — or state that none are known" },
      { key: "family_history", label: "Family history", type: "text", placeholder: "Condition, relative, age at onset" },
      { key: "social_smoking", label: "Smoking", type: "select", options: ["Never", "Ex-smoker", "Current — <10/day", "Current — 10-20/day", "Current — >20/day", "Not documented"] },
      { key: "social_alcohol", label: "Alcohol", type: "input", placeholder: "Units per week, pattern" },
      { key: "social_occupation", label: "Occupation and exposures", type: "input", placeholder: "Including occupational and travel exposures" },
      { key: "social_support", label: "Living situation and support at home", type: "input" },
      { key: "functional_baseline", label: "Functional baseline before this illness", type: "text", placeholder: "Mobility, self-care, usual exercise tolerance" },
      { key: "advance_care", label: "Advance care plan / treatment ceiling discussed", type: "select", options: YNNA },
    ],
  },

  // ------------------------------------------------------------ review of systems
  im_ros: {
    key: "im_ros",
    title: "Review of systems",
    note: "Record the positives and the relevant negatives per system. Only the systems actually reviewed should be completed; an unanswered system is not 'negative'.",
    fields: [
      { key: "ros_constitutional", label: "Constitutional — fever, sweats, weight, appetite, fatigue", type: "text" },
      { key: "ros_cardiovascular", label: "Cardiovascular — chest pain, palpitations, dyspnoea, orthopnoea, oedema", type: "text" },
      { key: "ros_respiratory", label: "Respiratory — cough, sputum, haemoptysis, wheeze, pleurisy", type: "text" },
      { key: "ros_gastrointestinal", label: "Gastrointestinal — pain, dysphagia, nausea, bowel habit, bleeding", type: "text" },
      { key: "ros_genitourinary", label: "Genitourinary — urinary symptoms, output, haematuria", type: "text" },
      { key: "ros_neurological", label: "Neurological — headache, weakness, sensory change, speech, seizure, gait", type: "text" },
      { key: "ros_endocrine", label: "Endocrine — polyuria, polydipsia, heat/cold intolerance, thyroid symptoms", type: "text" },
      { key: "ros_haematological", label: "Haematological — bruising, bleeding, lumps, transfusions", type: "text" },
      { key: "ros_musculoskeletal", label: "Musculoskeletal — joint pain and swelling, morning stiffness, back pain", type: "text" },
      { key: "ros_skin", label: "Skin — rash, ulcers, pigmentation change", type: "text" },
      { key: "ros_psychiatric", label: "Psychiatric — mood, sleep, anxiety, cognition", type: "text" },
      { key: "ros_not_reviewed", label: "Systems not reviewed, and why", type: "input", placeholder: "e.g. respiratory not examined — patient in isolation" },
    ],
  },

  // ------------------------------------------------------------ chronic disease
  im_chronic: {
    key: "im_chronic",
    title: "Chronic disease management",
    note: "The longitudinal view of multimorbidity. Targets are the clinician's documented decisions — AMedix never applies a default target.",
    fields: [
      { key: "conditions_reviewed", label: "Chronic conditions reviewed at this visit", type: "text" },
      { key: "control_overall", label: "Overall control as assessed", type: "select", options: ["At documented target", "Above target", "Below target", "Not assessable", "Not documented"] },
      { key: "bp_target", label: "Blood pressure target documented", type: "input", placeholder: "e.g. <130/80 mmHg (clinician's stated target)" },
      { key: "bp_current", label: "Current blood pressure", type: "input", placeholder: "e.g. 156/88 mmHg" },
      { key: "glycaemic_target", label: "Glycaemic target documented", type: "input", placeholder: "e.g. HbA1c <7.0% — individualised" },
      { key: "lipids", label: "Lipid status and decision", type: "text" },
      { key: "renal_monitoring", label: "Renal monitoring — eGFR, urine ACR", type: "text" },
      { key: "complication_screening", label: "Complication screening due or done", type: "text", placeholder: "Eyes, feet, urine albumin, lipids, vaccination — as applicable" },
      { key: "medicines_review", label: "Medicines review — indications, duplications, interactions", type: "text" },
      { key: "deprescribing", label: "Medication stopped or reduced, with reason", type: "text" },
      { key: "self_management", label: "Self-management plan agreed with the patient", type: "text" },
      { key: "monitoring_plan", label: "Monitoring plan and interval", type: "text" },
      { key: "escalation_plan", label: "Escalation criteria agreed", type: "text" },
    ],
  },

  // ------------------------------------------------------------ acute deterioration
  im_acute: {
    key: "im_acute",
    title: "Acute deterioration and suspected infection",
    note: "Documents the acute assessment. Sepsis is a clinical diagnosis: a score supports the assessment and never makes it.",
    fields: [
      { key: "suspected_infection", label: "Suspected or confirmed infection", type: "select", options: ["Suspected", "Confirmed (organism or source documented)", "Not suspected", "Not documented"] },
      { key: "infection_source", label: "Source identified or suspected", type: "input", placeholder: "e.g. pneumonia, urinary, abdominal, line, unknown" },
      { key: "organ_dysfunction", label: "Organ dysfunction documented", type: "text", placeholder: "Hypotension, hypoxia, oliguria, encephalopathy, coagulopathy, hyperbilirubinaemia" },
      { key: "lactate", label: "Lactate", type: "number", unit: "mmol/L", min: 0, max: 30 },
      { key: "cultures_before_antibiotics", label: "Cultures taken before antimicrobials", type: "select", options: YNNA },
      { key: "antibiotics_time", label: "Antimicrobial started — time and agent", type: "input", placeholder: "Time and agent as given" },
      { key: "fluid_resuscitation", label: "Fluid resuscitation given and response", type: "text" },
      { key: "vasopressors", label: "Vasopressor support", type: "select", options: ["None", "Started", "Escalated", "Weaned", "Not documented"] },
      { key: "source_control", label: "Source control considered", type: "text", placeholder: "Drainage, surgery, line removal — done, planned or not indicated" },
      { key: "senior_review", label: "Senior or critical-care review", type: "text", placeholder: "Who, when, outcome" },
      { key: "monitoring", label: "Monitoring in place", type: "text", placeholder: "Frequency of observations, urine output, repeat lactate" },
      { key: "resuscitation_status", label: "Resuscitation status documented", type: "select", options: ["For full active treatment", "Limits of treatment documented", "Comfort-focused", "Not documented"] },
    ],
  },

  // ------------------------------------------------------------ geriatric
  im_geriatric: {
    key: "im_geriatric",
    title: "Geriatric assessment",
    note: "The domains that decide an older patient's trajectory — function, cognition, falls, continence, nutrition and medicines.",
    fields: [
      { key: "living_arrangement", label: "Living arrangement and carers", type: "input" },
      { key: "baseline_function", label: "Baseline function before this illness", type: "text", placeholder: "Mobility, transfers, dressing, feeding, continence" },
      { key: "current_function", label: "Current function", type: "text" },
      { key: "mobility_aid", label: "Mobility aid used", type: "select", options: ["Independent", "Stick", "Frame", "Wheelchair", "Bed-bound", "Not documented"] },
      { key: "falls", label: "Falls in the past year", type: "select", options: ["None", "One", "Two or more", "Not documented"] },
      { key: "falls_circumstances", label: "Fall circumstances and injury", type: "text" },
      { key: "cognition", label: "Cognition — screening result documented", type: "text", placeholder: "Test used and score as performed" },
      { key: "delirium_features", label: "Delirium features", type: "text", placeholder: "Acute onset, fluctuation, inattention — as observed" },
      { key: "continence", label: "Continence", type: "select", options: ["Continent", "Urinary incontinence", "Faecal incontinence", "Catheter", "Not documented"] },
      { key: "nutrition", label: "Nutrition and weight trend", type: "text" },
      { key: "pressure_areas", label: "Pressure areas / skin integrity", type: "text" },
      { key: "medicines_risk", label: "Medicines with a high risk in older people", type: "text", placeholder: "Sedatives, anticholinergics, hypoglycaemics, anticoagulants, NSAIDs" },
      { key: "polypharmacy_count", label: "Regular medicines (count)", type: "number", min: 0, max: 60 },
      { key: "goals_of_care", label: "Goals of care agreed with patient and family", type: "text" },
      { key: "social_needs", label: "Social and discharge needs", type: "text", placeholder: "Home support, equipment, care package, safeguarding concern" },
    ],
  },

  // ------------------------------------------------------------ oncology
  im_oncology: {
    key: "im_oncology",
    title: "Oncology assessment",
    note: "Records the cancer pathway as documented by the treating team. AMedix does not stage, grade or choose a regimen.",
    fields: [
      { key: "cancer_type", label: "Cancer type and primary site", type: "input" },
      { key: "histology", label: "Histology and molecular markers as reported", type: "text" },
      { key: "stage_documented", label: "Stage documented by the oncology team", type: "input", placeholder: "e.g. as stated in the oncology letter — not derived here" },
      { key: "treatment_intent", label: "Treatment intent", type: "select", options: ["Curative", "Adjuvant", "Neoadjuvant", "Palliative", "Watch and wait", "Not documented"] },
      { key: "current_regimen", label: "Current systemic therapy", type: "text", placeholder: "Regimen and cycle as prescribed by oncology" },
      { key: "last_cycle", label: "Date of last cycle and next due", type: "input" },
      { key: "performance_status", label: "Performance status documented", type: "input", placeholder: "Scale and score as recorded by the treating team" },
      { key: "treatment_toxicity", label: "Toxicity documented", type: "text", placeholder: "Grade and system — as recorded" },
      { key: "febrile_neutropenia", label: "Fever with neutropenia during this episode", type: "select", options: YNNA },
      { key: "pain", label: "Pain assessment and plan", type: "text" },
      { key: "palliative_needs", label: "Palliative and supportive care needs", type: "text" },
      { key: "advance_care", label: "Advance care plan and treatment ceiling", type: "text" },
      { key: "oncology_contact", label: "Oncology team and contact", type: "input" },
      { key: "patient_understanding", label: "Patient's understanding of the plan, in their words", type: "text" },
    ],
  },

  // ------------------------------------------------------------ transition of care
  im_discharge: {
    key: "im_discharge",
    title: "Transition of care",
    note: "The discharge and handover record. Pending results and outstanding actions remain the responsibility of the discharging clinician.",
    fields: [
      { key: "admission_reason", label: "Reason for admission", type: "input" },
      { key: "key_findings", label: "Key findings and course", type: "text" },
      { key: "procedures", label: "Procedures and interventions performed", type: "text" },
      { key: "complications", label: "Complications during the admission", type: "text" },
      { key: "discharge_medications", label: "Discharge medications and changes", type: "text", placeholder: "Started, stopped, dose changed — with reason" },
      { key: "medicines_reconciled", label: "Medicines reconciled against the pre-admission list", type: "select", options: YNNA },
      { key: "pending_results", label: "Results pending at discharge", type: "text", placeholder: "Test, who will action it, and how the patient is told" },
      { key: "follow_up", label: "Follow-up arranged", type: "text", placeholder: "Clinic, date, who — or 'to be arranged by'" },
      { key: "community_team", label: "Community and social handover", type: "text" },
      { key: "red_flags", label: "Safety-netting and red flags given to the patient", type: "text" },
      { key: "patient_given_copy", label: "Written summary given to the patient", type: "select", options: YNNA },
      { key: "discharge_destination", label: "Discharge destination", type: "select", options: ["Home", "Home with support", "Rehabilitation", "Care facility", "Transfer to another hospital", "Not documented"] },
    ],
  },

};

export const IM_BLOCK_KEYS = Object.keys(IM_BLOCKS);

export const imBlock = (key) => IM_BLOCKS[key] || null;

// The saved value keeps its block identity, so a reader always knows which block a
// value belongs to even after the template changes.
export const imBlockValue = (blockKey, values) => ({ __block: blockKey, ...asObject(values) });

export const imBlockValues = (values, blockKey) => asObject(asObject(values)[blockKey]);

export const imBlockHasContent = (values, blockKey) =>
  Object.entries(imBlockValues(values, blockKey)).some(([k, v]) =>
    k === "__block" ? false : Array.isArray(v) ? v.length > 0 : str(v) !== "",
  );

// Printed form, in the order the block declares.
export const formatImBlock = (value) => {
  const v = asObject(value);
  const spec = imBlock(asObject(v).__block);
  if (!spec) return "";
  return spec.fields
    .map((f) => {
      const raw = v[f.key];
      const text = Array.isArray(raw) ? raw.join(", ") : str(raw);
      return text ? `${f.label}: ${text}${f.unit ? ` ${f.unit}` : ""}` : "";
    })
    .filter(Boolean)
    .join("\n");
};