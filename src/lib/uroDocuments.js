// Strengthening the EXISTING AMedix Urology note types, and adding the note types
// the specialty needs.
//
// NOTHING IS RECREATED. The nine templates declared in src/lib/specialtyDocuments.js
// — Urology Consultation, Urology Follow-Up, Urologic Procedure Note, Operative
// Note (Urology), Pre-Operative Assessment (Urology), Post-Operative Note
// (Urology), Catheter / Device Record, Discharge Summary (Urology) and Urology
// Referral — keep their keys, labels, order and every existing field. Their
// structure is only APPENDED to, through URO_ENHANCEMENTS in
// uroClinicalSections.js, so a saved note keeps its meaning and every view,
// report and PDF that reads a note by key keeps working.
//
// WHAT IS ADDED HERE
//   The note types a urology service documents that the portal did not yet have:
//   the urological tumour notes with staging and tumour-board records, the stone
//   clinic and metabolic stone assessment, LUTS / BPH, female and functional
//   urology, neuro-urology and urodynamics, andrology and sexual medicine,
//   reconstructive urology, paediatric urology, transplant-related urology,
//   emergency urology, second opinion and the follow-up record.
//
// Every added note carries the same standard sections: structured blocks, the
// element-by-element examination, ICD-11 coding through the central AMedix
// service, documented calculations, the advisory safety review and the guideline
// basis. No note type contains a placeholder and none is left without coding.

import { URO_ENHANCEMENTS, uroStandardSections } from "@/lib/uroClinicalSections";

export const withUrologyStandards = (docs) =>
  docs.map((doc) => {
    const sections = URO_ENHANCEMENTS[doc.key];
    if (!sections) return doc;
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = sections().filter((f) => {
      if (existing.has(f.key)) return false;
      existing.add(f.key);
      return true;
    });
    if (!additions.length) return doc;
    return { ...doc, fields: [...(doc.fields || []), ...additions] };
  });

const I = (key, label) => ({ key, label, type: "input" });
const N = (key, label, unit, min, max) => ({ key, label, type: "number", unit, min, max });
const D = (key, label) => ({ key, label, type: "date" });
const T = (key, label) => ({ key, label, type: "textarea" });
const S = (key, label, options) => ({ key, label, type: "select", options });

const URGENCY = ["Routine", "Urgent", "Emergency"];

// A new note type: its own short set of top-level fields plus the standard
// urology sections. Sections are appended in a fixed order.
const doc = (key, label, fields, sections = {}) => ({
  key,
  label,
  specialty: "urology",
  fields: [...fields, ...uroStandardSections(key, sections)],
});

const clinicFields = () => [
  I("reason_for_attendance", "Reason for attendance"),
  S("urgency", "Urgency", [...URGENCY, "Not documented"]),
  T("clinical_summary", "Clinical summary documented by the clinician"),
  T("documented_actions", "Documented actions and follow-up"),
  I("review_interval", "Documented review interval"),
];

const tumourFields = () => [
  I("referral_source", "Referral source"),
  D("first_presentation_date", "Date first presented"),
  T("presentation_summary", "Presentation and clinical summary"),
  T("histology_summary", "Histopathology summary as reported (accession, date, grade, margins)"),
  T("multidisciplinary_outcome", "Outcome of the multidisciplinary discussion as recorded"),
  T("documented_actions", "Documented actions and follow-up"),
];

export const URO_WORKFLOW_DOCS = [
  // ---- Urological oncology -------------------------------------------------
  doc("uro_oncology_prostate", "Prostate Cancer Assessment", tumourFields(), {
    blocks: ["uro_oncology_tumour", "uro_oncology_treatment_history"],
    staging: "prostate",
    icdGroups: ["prostate"],
    scores: ["psa_density", "psa_kinetics", "prostate_volume", "egfr"],
  }),
  doc("uro_oncology_bladder_nmibc", "Bladder Cancer — Non-Muscle-Invasive", tumourFields(), {
    blocks: ["uro_oncology_tumour", "uro_oncology_treatment_history"],
    staging: "bladder_nmibc",
    icdGroups: ["bladder"],
    scores: ["egfr"],
  }),
  doc("uro_oncology_bladder_mibc", "Bladder Cancer — Muscle-Invasive / Metastatic", tumourFields(), {
    blocks: ["uro_oncology_tumour", "uro_oncology_treatment_history"],
    staging: "bladder_mibc",
    icdGroups: ["bladder", "postoperative"],
    scores: ["egfr", "charlson"],
  }),
  doc("uro_oncology_renal", "Renal Cancer Assessment", tumourFields(), {
    blocks: ["uro_oncology_tumour", "uro_oncology_treatment_history"],
    staging: "kidney",
    icdGroups: ["kidney_upper_tract"],
    scores: ["egfr", "charlson"],
  }),
  doc("uro_oncology_utuc", "Upper Tract Urothelial Carcinoma Assessment", tumourFields(), {
    blocks: ["uro_oncology_tumour", "uro_oncology_treatment_history"],
    staging: "utuc",
    icdGroups: ["kidney_upper_tract", "ureter"],
    scores: ["egfr"],
  }),
  doc("uro_oncology_testis", "Testicular Cancer Assessment", tumourFields(), {
    blocks: ["uro_oncology_tumour", "uro_oncology_treatment_history"],
    staging: "testis",
    exams: ["genital"],
    icdGroups: ["male_genital"],
  }),
  doc("uro_oncology_penile", "Penile Cancer Assessment", tumourFields(), {
    blocks: ["uro_oncology_tumour", "uro_oncology_treatment_history"],
    staging: "penile",
    exams: ["genital"],
    icdGroups: ["male_genital"],
  }),
  doc("uro_oncology_urethral", "Urethral Cancer Assessment", tumourFields(), {
    blocks: ["uro_oncology_tumour", "uro_oncology_treatment_history"],
    staging: "urethral",
    exams: ["genital"],
    icdGroups: ["urethra"],
  }),
  doc(
    "uro_oncology_mdt",
    "Urological Tumour Board Record",
    [
      D("meeting_date", "Meeting date"),
      T("cases_discussed", "Cases discussed with their AMedix note references"),
      T("imaging_and_histology_reviewed", "Reviews presented (study / report and date)"),
      T("board_recommendation", "Recommendation recorded by the board"),
      T("actions_and_owners", "Actions, owners and deadlines"),
    ],
    { blocks: ["uro_oncology_tumour", "uro_oncology_treatment_history"], icdGroups: ["kidney_upper_tract", "bladder", "prostate", "male_genital", "ureter"] },
  ),
  doc(
    "uro_oncology_surveillance",
    "Oncology Surveillance Visit",
    [
      D("visit_date", "Visit date"),
      T("interval_summary", "Interval summary recorded by the clinician"),
      T("results_reviewed", "Results reviewed with their dates"),
      T("documented_actions", "Documented actions and next interval"),
    ],
    { blocks: ["uro_oncology_treatment_history"], icdGroups: ["prostate", "bladder", "kidney_upper_tract"] },
  ),

  // ---- Stone disease -------------------------------------------------------
  doc("uro_stone_clinic", "Stone Clinic Assessment", clinicFields(), {
    blocks: ["uro_stone_documentation", "uro_metabolic_stone"],
    exams: ["abdomen_renal"],
    icdGroups: ["kidney_upper_tract", "ureter", "bladder"],
    scores: ["egfr", "voiding_efficiency"],
  }),
  doc("uro_stone_metabolic", "Metabolic Stone Assessment", clinicFields(), {
    blocks: ["uro_stone_documentation", "uro_metabolic_stone"],
    icdGroups: ["kidney_upper_tract", "ureter"],
    scores: ["egfr"],
  }),
  doc("uro_stone_emergency", "Stone — Emergency Assessment", clinicFields(), {
    blocks: ["uro_emergency", "uro_stone_documentation"],
    exams: ["abdomen_renal"],
    icdGroups: ["kidney_upper_tract", "ureter", "trauma"],
    scores: ["egfr"],
  }),

  // ---- Functional, female and neuro-urology --------------------------------
  doc("uro_luts_bph", "LUTS / Benign Prostatic Obstruction Assessment", clinicFields(), {
    blocks: ["uro_luts"],
    exams: ["abdomen_renal", "prostate", "devices"],
    icdGroups: ["prostate", "bladder"],
    scores: ["ipss", "voiding_efficiency", "prostate_volume", "psa_density", "egfr"],
  }),
  doc("uro_incontinence_female", "Female Urinary Incontinence Assessment", clinicFields(), {
    blocks: ["uro_female_urology", "uro_bladder_diary"],
    exams: ["abdomen_renal", "neurology"],
    icdGroups: ["female_urology", "bladder"],
    scores: ["voiding_efficiency"],
  }),
  doc("uro_neuro_urology", "Neuro-Urology Assessment", clinicFields(), {
    blocks: ["uro_neuro_classification", "uro_bladder_diary"],
    exams: ["neurology", "abdomen_renal", "devices"],
    icdGroups: ["neuro_urology", "bladder"],
    scores: ["voiding_efficiency", "egfr"],
  }),
  doc("uro_urodynamics", "Urodynamic Study Report", clinicFields(), {
    blocks: ["uro_urodynamics", "uro_bladder_diary"],
    exams: ["neurology"],
    icdGroups: ["neuro_urology", "bladder", "female_urology"],
    scores: ["voiding_efficiency"],
  }),
  doc("uro_recurrent_uti", "Recurrent Urinary Tract Infection Assessment", clinicFields(), {
    blocks: ["uro_history", "uro_bladder_diary"],
    exams: ["abdomen_renal"],
    icdGroups: ["bladder", "kidney_upper_tract"],
    scores: ["egfr"],
  }),
  doc("uro_bladder_pain", "Bladder Pain Syndrome Assessment", clinicFields(), {
    blocks: ["uro_bladder_diary", "uro_luts"],
    exams: ["abdomen_renal"],
    icdGroups: ["bladder", "female_urology"],
    scores: ["voiding_efficiency"],
  }),

  // ---- Andrology, sexual and reproductive medicine -------------------------
  doc("uro_andrology_ed", "Erectile Dysfunction Assessment", clinicFields(), {
    blocks: ["uro_andrology_sexual", "uro_history"],
    icdGroups: ["male_genital"],
    scores: ["egfr"],
  }),
  doc("uro_andrology_infertility", "Male Infertility Assessment", clinicFields(), {
    blocks: ["uro_infertility", "uro_history"],
    exams: ["genital"],
    icdGroups: ["male_genital"],
  }),
  doc("uro_andrology_peyronie", "Peyronie Disease Assessment", clinicFields(), {
    blocks: ["uro_peyronie", "uro_andrology_sexual"],
    exams: ["genital"],
    icdGroups: ["male_genital"],
  }),
  doc("uro_andrology_hypogonadism", "Testosterone Deficiency Assessment", clinicFields(), {
    blocks: ["uro_hypogonadism"],
    icdGroups: ["male_genital"],
    scores: ["egfr"],
  }),
  doc("uro_andrology_priapism", "Priapism Assessment", clinicFields(), {
    blocks: ["uro_priapism"],
    exams: ["genital"],
    icdGroups: ["male_genital", "trauma"],
  }),

  // ---- Reconstructive urology ---------------------------------------------
  doc("uro_reconstructive_stricture", "Urethral Stricture Assessment", clinicFields(), {
    blocks: ["uro_stricture", "uro_history"],
    exams: ["genital", "abdomen_renal", "devices"],
    icdGroups: ["urethra"],
    scores: ["voiding_efficiency", "egfr"],
  }),
  doc("uro_reconstructive_plan", "Reconstructive Surgery Planning Record", clinicFields(), {
    blocks: ["uro_stricture", "uro_second_opinion"],
    icdGroups: ["urethra", "trauma"],
    scores: ["charlson", "egfr"],
  }),

  // ---- Paediatric urology --------------------------------------------------
  doc("uro_paediatric_consultation", "Paediatric Urology Consultation", clinicFields(), {
    blocks: ["uro_paediatric", "uro_history"],
    exams: ["abdomen_renal", "genital", "neurology"],
    icdGroups: ["paediatric", "bladder", "kidney_upper_tract"],
    scores: ["voiding_efficiency"],
  }),
  doc("uro_paediatric_urology_workup", "Paediatric Urology Work-Up", clinicFields(), {
    blocks: ["uro_paediatric"],
    exams: ["abdomen_renal", "genital"],
    icdGroups: ["paediatric", "kidney_upper_tract", "bladder"],
  }),

  // ---- Transplant-related urology -----------------------------------------
  doc("uro_transplant_urology", "Renal Transplant — Urological Assessment", clinicFields(), {
    blocks: ["uro_transplant"],
    icdGroups: ["transplant", "kidney_upper_tract"],
    scores: ["egfr"],
  }),

  // ---- Emergency urology ---------------------------------------------------
  doc("uro_emergency_retention", "Acute Urinary Retention — Emergency Assessment", clinicFields(), {
    blocks: ["uro_emergency", "uro_luts"],
    exams: ["abdomen_renal", "devices"],
    icdGroups: ["bladder", "prostate", "neuro_urology"],
    scores: ["egfr", "voiding_efficiency"],
  }),
  doc("uro_emergency_trauma", "Urological Trauma — Emergency Assessment", clinicFields(), {
    blocks: ["uro_emergency"],
    exams: ["abdomen_renal", "genital"],
    icdGroups: ["trauma", "kidney_upper_tract", "bladder", "urethra"],
    scores: ["egfr", "charlson"],
  }),
  doc("uro_emergency_infection", "Urological Sepsis / Infected Obstruction — Emergency Assessment", clinicFields(), {
    blocks: ["uro_emergency", "uro_stone_documentation"],
    exams: ["abdomen_renal"],
    icdGroups: ["kidney_upper_tract", "bladder", "prostate"],
    scores: ["egfr"],
  }),
  doc("uro_emergency_torsion", "Acute Scrotum — Emergency Assessment", clinicFields(), {
    blocks: ["uro_emergency"],
    exams: ["genital"],
    icdGroups: ["male_genital", "trauma"],
  }),

  // ---- Other ---------------------------------------------------------------
  doc("uro_second_opinion", "Urology Second Opinion", clinicFields(), {
    blocks: ["uro_second_opinion"],
    icdGroups: ["kidney_upper_tract", "bladder", "prostate", "male_genital"],
  }),
  doc(
    "uro_followup_plan",
    "Urology Follow-Up Record",
    [
      D("visit_date", "Visit date"),
      T("interval_summary", "Interval summary documented by the clinician"),
      T("documented_actions", "Documented actions, review interval and who is responsible"),
    ],
    { blocks: ["uro_luts"], exams: ["abdomen_renal"], icdGroups: ["kidney_upper_tract", "bladder", "prostate"] },
  ),
];

export const URO_WORKFLOW_KEYS = URO_WORKFLOW_DOCS.map((d) => d.key);

export { uroStandardSections };