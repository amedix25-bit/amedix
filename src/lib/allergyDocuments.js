// Allergy & Immunology note types and their documentation standards.
//
// ADDITIVE BY CONSTRUCTION
// No existing specialty template is recreated, renamed, replaced or
// reorganised. Allergy & Immunology previously resolved to the Internal
// Medicine set; every saved Internal Medicine note keeps its own key, label and
// fields, and is still read by the same key. What is added here is a set of
// allergy-specific note types plus the strengthening appended to them by
// `withAllergyStandards`.
//
// WHAT EACH NOTE RECORDS
//   · The history the specialty actually takes — exposure and trigger history,
//     time from exposure to symptoms, route, reproducibility, previous reactions
//     with their worst documented severity, previous workup and treatment, atopic
//     and family history, cofactors and the symptom diary.
//   · The specialty findings — nasal, ocular, respiratory, skin and systemic.
//   · The structured disease modules (asthma, rhinitis, anaphylaxis, food, drug,
//     skin, immunology, immunotherapy, supervised challenge) and the recorded
//     test results, entered only when a result was actually reported.
//   · ICD-11 MMS diagnoses and a separate differential field, each entry carrying
//     its own code, release, source, role, status, mapping state and basis.
//   · The guideline attribution the note's content was built from.
//
// WHAT IT DOES NOT DO
// It does not duplicate a shared AMedix surface (vital signs, medications,
// allergies, laboratory and imaging results, the patient's recorded history), it
// does not record a result that was not reported, and it never converts a
// positive test into a diagnosis. Every field is optional: a blank field is not
// documented, never normal.

import { allergyCatalogFor } from "@/lib/allergyIcd11";
import { allergyGuidelineBasis } from "@/lib/allergyReferences";
import { ALLERGY_BLOCKS } from "@/lib/allergyModules";

const T = (key, label, section) => ({ key, label, type: "textarea", section });
const I = (key, label, section) => ({ key, label, type: "input", section });
const S = (key, label, options, section) => ({ key, label, type: "select", options, section });

const HISTORY = "History";
const MODULES = "Specialty Modules";
const ASSESSMENT = "Assessment";
const MANAGEMENT = "Management";
const BASIS = "Guideline Basis";

const blockField = (key) => ({ key, label: ALLERGY_BLOCKS[key].title, type: "allergy_modules", section: MODULES });

const icdBlock = (domains) => [
  {
    key: "icd11_diagnoses",
    label: "Primary & Secondary Diagnoses (ICD-11 MMS)",
    type: "icd11_diagnoses",
    catalog: allergyCatalogFor(domains),
    searchPlaceholder: "Search ICD-11 — a coded diagnosis, never a generated code…",
    roles: ["Primary", "Secondary"],
    section: ASSESSMENT,
  },
  {
    key: "icd11_differential",
    label: "Differential Diagnoses — not confirmed (ICD-11 MMS)",
    type: "icd11_diagnoses",
    catalog: allergyCatalogFor(domains),
    searchPlaceholder: "Search ICD-11 — a diagnosis under consideration, not a confirmed one…",
    roles: ["Differential"],
    statuses: ["Suspected", "Provisional"],
    section: ASSESSMENT,
  },
];

const testsField = () => ({
  key: "allergy_tests",
  label: "Recorded Test Results (entered only as reported)",
  type: "allergy_tests",
  section: MODULES,
});

const treatmentField = () => ({
  key: "allergy_treatment",
  label: "Treatment & Management Plan (documented — never auto-prescribed)",
  type: "allergy_treatment",
  section: MANAGEMENT,
});

const safetyField = () => ({
  key: "allergy_safety",
  label: "Safety Concerns & Documented Action",
  type: "allergy_safety",
  section: ASSESSMENT,
});

const guidanceField = (noteKey) => ({
  key: "allergy_guidance",
  label: "Guideline Basis & Attribution",
  type: "allergy_guidance",
  noteKey,
  section: BASIS,
});

const ALL_DOMAINS = [
  "anaphylaxis", "food_allergy", "drug_allergy", "respiratory", "rhinitis",
  "skin", "urticaria_angioedema", "immunodeficiency", "eosinophilic", "venom",
];

export const ALLERGY_DOCS = [
  {
    key: "allergy_consultation",
    label: "Allergy & Immunology Consultation",
    specialty: "allergy",
    fields: [
      T("chief_complaint", "Presenting Complaint", HISTORY),
      T("hpi", "History of Present Illness — Detailed Chronology", HISTORY),
      T("exposure_history", "Allergy Exposure, Occupation and Environment", HISTORY),
      T("reaction_history", "Previous Allergic Reactions and Their Severity", HISTORY),
      blockField("allergy_history"),
      blockField("allergy_exam"),
      T("assessment", "Clinical Assessment", ASSESSMENT),
      T("differential_reasoning", "Clinical Reasoning and Differentials Considered", ASSESSMENT),
      T("management_summary", "Management Provided at This Visit", MANAGEMENT),
      I("follow_up", "Follow-Up Arrangement", MANAGEMENT),
    ],
  },
  {
    key: "allergy_followup",
    label: "Allergy & Immunology Follow-Up",
    specialty: "allergy",
    fields: [
      T("interval_history", "Interval History Since the Last Visit", HISTORY),
      T("symptom_review", "Current Symptom Review", HISTORY),
      blockField("allergy_exam"),
      T("treatment_response", "Documented Response to Treatment", ASSESSMENT),
      T("assessment", "Clinical Assessment", ASSESSMENT),
      T("management_summary", "Management at This Visit", MANAGEMENT),
      I("follow_up", "Follow-Up Arrangement", MANAGEMENT),
    ],
  },
  {
    key: "allergy_anaphylaxis_note",
    label: "Anaphylaxis Record",
    specialty: "allergy",
    fields: [
      I("event_date", "Date of the Event", HISTORY),
      T("presentation", "Presentation and Circumstances", HISTORY),
      T("trigger_narrative", "Suspected Trigger and Exposure Detail", HISTORY),
      blockField("allergy_anaphylaxis"),
      T("assessment", "Clinical Assessment", ASSESSMENT),
      T("management_summary", "Treatment Given and Response", MANAGEMENT),
      T("discharge_advice", "Discharge Advice, Autoinjector and Follow-Up", MANAGEMENT),
      I("follow_up", "Follow-Up Arrangement", MANAGEMENT),
    ],
  },
  {
    key: "allergy_food_note",
    label: "Food Allergy Assessment",
    specialty: "allergy",
    fields: [
      T("presentation", "Presenting Complaint", HISTORY),
      T("reaction_narrative", "Reaction History — Foods, Timing and Symptoms", HISTORY),
      T("diet_history", "Current Diet, Avoidance and Substitutions", HISTORY),
      blockField("allergy_food"),
      blockField("allergy_exam"),
      blockField("allergy_provocation"),
      T("assessment", "Clinical Assessment", ASSESSMENT),
      T("management_summary", "Management, Emergency Plan and Education", MANAGEMENT),
      I("follow_up", "Follow-Up and Reassessment Plan", MANAGEMENT),
    ],
  },
  {
    key: "allergy_drug_note",
    label: "Drug Allergy & Delabelling Assessment",
    specialty: "allergy",
    fields: [
      T("presentation", "Presenting Complaint", HISTORY),
      T("reaction_narrative", "Reaction History — Drug, Timing, Phenotype and Treatment", HISTORY),
      T("exposure_history", "Drug Exposure History and Tolerated Alternatives", HISTORY),
      blockField("allergy_drug"),
      blockField("allergy_exam"),
      blockField("allergy_provocation"),
      T("assessment", "Clinical Assessment and Label Decision", ASSESSMENT),
      T("management_summary", "Management, Alternatives and Record Update", MANAGEMENT),
      I("follow_up", "Follow-Up Arrangement", MANAGEMENT),
    ],
  },
  {
    key: "allergy_skin_note",
    label: "Skin Allergy Assessment",
    specialty: "allergy",
    fields: [
      T("presentation", "Presenting Complaint", HISTORY),
      T("hpi", "History of Present Illness — Skin", HISTORY),
      blockField("allergy_skin"),
      blockField("allergy_exam"),
      T("assessment", "Clinical Assessment", ASSESSMENT),
      T("management_summary", "Management and Education", MANAGEMENT),
      I("follow_up", "Follow-Up Arrangement", MANAGEMENT),
    ],
  },
  {
    key: "allergy_immunology_note",
    label: "Clinical Immunology Assessment",
    specialty: "allergy",
    fields: [
      I("age_at_assessment", "Age at Assessment", HISTORY),
      T("presentation", "Presenting Complaint", HISTORY),
      T("infection_history", "Infection History — Sites, Organisms, Treatment and Response", HISTORY),
      T("growth_history", "Growth, Feeding and Development (children)", HISTORY),
      blockField("allergy_immunology"),
      blockField("allergy_exam"),
      T("assessment", "Clinical Assessment and Category Considered", ASSESSMENT),
      T("management_summary", "Management, Prophylaxis and Referral", MANAGEMENT),
      I("follow_up", "Follow-Up Arrangement", MANAGEMENT),
    ],
  },
  {
    key: "allergy_immunotherapy_visit",
    label: "Allergen Immunotherapy Visit",
    specialty: "allergy",
    fields: [
      I("visit_date", "Date of Visit", HISTORY),
      blockField("allergy_ait"),
      T("assessment", "Assessment Before and After the Dose", ASSESSMENT),
      T("management_summary", "Dose Decision and Plan for the Next Visit", MANAGEMENT),
      I("follow_up", "Next Appointment", MANAGEMENT),
    ],
  },
  {
    key: "allergy_procedure_note",
    label: "Allergy Procedure Record",
    specialty: "allergy",
    fields: [
      I("procedure_date", "Date of Procedure", HISTORY),
      S("procedure_type", "Procedure", [
        "Skin prick testing", "Patch testing", "Oral food challenge", "Drug provocation test",
        "Desensitisation protocol", "Other",
      ], HISTORY),
      T("indication", "Indication", HISTORY),
      blockField("allergy_provocation"),
      blockField("allergy_exam"),
      T("assessment", "Assessment and Conclusion", ASSESSMENT),
      T("management_summary", "Advice Given After the Procedure", MANAGEMENT),
      I("follow_up", "Follow-Up Arrangement", MANAGEMENT),
    ],
  },
  {
    key: "allergy_child_consultation",
    label: "Paediatric Allergy & Immunology Consultation",
    specialty: "allergy",
    fields: [
      I("caregiver", "Parent / Caregiver Present", HISTORY),
      I("age_at_presentation", "Age at Presentation", HISTORY),
      T("presenting_complaint", "Presenting Complaint", HISTORY),
      T("feeding_growth", "Feeding, Growth and Nutrition", HISTORY),
      T("hpi", "History of Present Illness", HISTORY),
      T("school_care", "School, Nursery or Care Arrangements", HISTORY),
      blockField("allergy_history"),
      blockField("allergy_exam"),
      T("assessment", "Clinical Assessment", ASSESSMENT),
      T("management_summary", "Management, Carer Education and Written Plan", MANAGEMENT),
      I("follow_up", "Follow-Up Arrangement", MANAGEMENT),
    ],
  },
  {
    key: "allergy_care_plan",
    label: "Allergy Action Plan & Follow-Up",
    specialty: "allergy",
    fields: [
      T("plan_reason", "Reason for the Plan", HISTORY),
      T("triggers_to_avoid", "Documented Triggers and What to Avoid", MANAGEMENT),
      T("daily_treatment", "Daily Treatment Instructions", MANAGEMENT),
      T("emergency_steps", "Emergency Steps for the Patient or Carer", MANAGEMENT),
      T("when_to_seek_help", "When to Seek Urgent Help", MANAGEMENT),
      S("plan_given_to", "Who Was Given the Plan", [
        "Patient", "Parent or carer", "School or nursery", "Workplace", "Multiple recipients", "Not documented",
      ], MANAGEMENT),
      I("review_date", "Review Date", MANAGEMENT),
      blockField("allergy_management"),
      T("assessment", "Assessment Behind the Plan", ASSESSMENT),
      I("follow_up", "Follow-Up Arrangement", MANAGEMENT),
    ],
  },
];

const DOMAINS = {
  allergy_consultation: ALL_DOMAINS,
  allergy_followup: ALL_DOMAINS,
  allergy_anaphylaxis_note: ["anaphylaxis", "food_allergy", "drug_allergy", "venom", "urticaria_angioedema"],
  allergy_food_note: ["food_allergy", "anaphylaxis", "skin", "eosinophilic"],
  allergy_drug_note: ["drug_allergy", "anaphylaxis", "skin"],
  allergy_skin_note: ["skin", "urticaria_angioedema", "food_allergy", "drug_allergy"],
  allergy_immunology_note: ["immunodeficiency", "eosinophilic"],
  allergy_immunotherapy_visit: ["respiratory", "rhinitis", "venom"],
  allergy_procedure_note: ["food_allergy", "drug_allergy", "venom", "anaphylaxis"],
  allergy_child_consultation: ["food_allergy", "respiratory", "skin", "immunodeficiency", "anaphylaxis"],
  allergy_care_plan: ["anaphylaxis", "food_allergy", "respiratory", "skin", "urticaria_angioedema"],
};

// Which blocks each note type carries. A follow-up note never asks for a
// challenge protocol; a procedure note never asks for the whole history block.
const BLOCKS_BY_NOTE = {
  allergy_consultation: ["allergy_history", "allergy_exam"],
  allergy_followup: ["allergy_exam"],
  allergy_anaphylaxis_note: ["allergy_anaphylaxis"],
  allergy_food_note: ["allergy_food", "allergy_provocation"],
  allergy_drug_note: ["allergy_drug", "allergy_provocation"],
  allergy_skin_note: ["allergy_skin"],
  allergy_immunology_note: ["allergy_immunology"],
  allergy_immunotherapy_visit: ["allergy_ait"],
  allergy_procedure_note: ["allergy_provocation"],
  allergy_child_consultation: ["allergy_history", "allergy_exam"],
  allergy_care_plan: ["allergy_management"],
};

// Notes that record test results. A care plan does not, so it does not offer the
// test-result field at all rather than an empty one.
const TESTS_BY_NOTE = new Set([
  "allergy_consultation", "allergy_followup", "allergy_anaphylaxis_note", "allergy_food_note",
  "allergy_drug_note", "allergy_skin_note", "allergy_immunology_note", "allergy_procedure_note",
  "allergy_child_consultation",
]);

// Strengthening appended to each allergy note. Nothing already in the template is
// removed or reordered: the additions are appended, and a key that already exists
// is never added twice.
export const withAllergyStandards = (docs) =>
  docs.map((doc) => {
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = [];

    (BLOCKS_BY_NOTE[doc.key] || []).forEach((key) => {
      const field = blockField(key);
      if (!existing.has(field.key) && ALLERGY_BLOCKS[key]) {
        existing.add(field.key);
        additions.push(field);
      }
    });

    if (TESTS_BY_NOTE.has(doc.key) && !existing.has("allergy_tests")) {
      existing.add("allergy_tests");
      additions.push(testsField());
    }

    // Every allergy encounter documents its management. The module records the
    // plan and never orders: prescribing stays in the existing AMedix flow with
    // its medication safety, allergy and contraindication checks.
    if (!existing.has("allergy_treatment")) {
      existing.add("allergy_treatment");
      additions.push(treatmentField());
    }

    icdBlock(DOMAINS[doc.key] || ALL_DOMAINS).forEach((field) => {
      if (!existing.has(field.key)) {
        existing.add(field.key);
        additions.push(field);
      }
    });

    if (!existing.has("allergy_safety")) additions.push(safetyField());
    if (!existing.has("allergy_guidance")) additions.push(guidanceField(doc.key));

    if (!additions.length) return doc;
    return {
      ...doc,
      fields: [...(doc.fields || []), ...additions],
      guidelineBasis: allergyGuidelineBasis(doc.key),
    };
  });

export const ALLERGY_NOTE_KEYS = ALLERGY_DOCS.map((d) => d.key);