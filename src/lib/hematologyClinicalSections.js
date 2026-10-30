// Haematology — the strengthened sections appended to each existing note type.
//
// The eight note types keep their keys, labels and every existing field. This
// module only adds sections: a history that fits the encounter, a structured
// physical assessment, the blood counts and films that were actually reported,
// the diagnostic reasoning, the condition block that matches the working group,
// the management record and the follow-up arrangements.
//
// Relevance is enforced structurally: a condition block appears only when the
// clinician records that working group, so an anaemia review never asks about
// cord compression and a transfusion record never asks about pica.

const GROUP_ALL = [
  "Anaemia",
  "Haemoglobinopathy",
  "Platelet disorder",
  "Cytopenia or marrow failure",
  "Bleeding disorder",
  "Thrombosis or anticoagulation",
  "Myeloid neoplasm",
  "Lymphoid neoplasm",
  "Plasma cell disorder",
  "Haematological emergency",
];

const GROUP_TRANSFUSION = [
  "Anaemia",
  "Haemoglobinopathy",
  "Platelet disorder",
  "Bleeding disorder",
  "Cytopenia or marrow failure",
  "Transfusion medicine",
];

const GROUP_PROCEDURE = [
  "Cytopenia or marrow failure",
  "Myeloid neoplasm",
  "Lymphoid neoplasm",
  "Plasma cell disorder",
  "Anaemia",
];

const GROUP_TREATMENT = [
  "Myeloid neoplasm",
  "Lymphoid neoplasm",
  "Plasma cell disorder",
  "Cytopenia or marrow failure",
  "Haemoglobinopathy",
  "Bleeding disorder",
  "Thrombosis or anticoagulation",
];

const GROUP_INFUSION = [
  "Myeloid neoplasm",
  "Lymphoid neoplasm",
  "Plasma cell disorder",
  "Cytopenia or marrow failure",
  "Haemoglobinopathy",
];

const withSection = (section, fields) => fields.map((f) => ({ ...f, section }));

const group = (options) => ({
  key: "diagnostic_group",
  label: "Working Diagnostic Group",
  type: "select",
  options: [...options, "Other"],
});

const blk = (key, label, showGroup) => ({
  key,
  label,
  type: "hema_modules",
  ...(showGroup ? { showIf: { key: "diagnostic_group", equals: showGroup } } : {}),
});

const labs = (key, label, panels) => ({ key, label, type: "hema_labs", panels });

// One condition block per working group, each behind its own answer.
const conditionBlocks = (options) =>
  options
    .map((groupName) => {
      switch (groupName) {
        case "Anaemia":
          return blk("hema_anaemia", "Anaemia — Mechanism & Evidence", groupName);
        case "Haemoglobinopathy":
          return blk("hema_haemoglobinopathy", "Haemoglobinopathy — Sickle Cell & Thalassaemia", groupName);
        case "Platelet disorder":
          return blk("hema_platelet_disorder", "Platelet Disorder — Thrombocytopenia, ITP & Thrombocytosis", groupName);
        case "Cytopenia or marrow failure":
          return blk("hema_marrow_failure", "Cytopenia & Marrow Failure", groupName);
        case "Bleeding disorder":
          return blk("hema_bleeding_disorder", "Inherited or Acquired Bleeding Disorder", groupName);
        case "Thrombosis or anticoagulation":
          return blk("hema_thrombosis_disorder", "Thrombosis, Thrombophilia & Anticoagulation", groupName);
        case "Myeloid neoplasm":
          return blk("hema_myeloid_neoplasm", "Myeloid Neoplasm — AML, CML, MPN & MDS", groupName);
        case "Lymphoid neoplasm":
          return blk("hema_lymphoid_neoplasm", "Lymphoid Neoplasm — Leukaemia & Lymphoma", groupName);
        case "Plasma cell disorder":
          return blk("hema_plasma_cell", "Plasma Cell Disorder — Myeloma & Related", groupName);
        case "Haematological emergency":
          return blk("hema_emergency", "Haematological Emergency", groupName);
        case "Transfusion medicine":
          return blk("hema_transfusion_assessment", "Transfusion Assessment & Monitoring", groupName);
        default:
          return null;
      }
    })
    .filter(Boolean);

const consultation = () => [
  ...withSection("Clinical History", [
    blk("hema_presentation", "Presenting Problem & Symptom History"),
    blk("hema_bleeding_history", "Bleeding & Bruising History"),
    blk("hema_thrombosis_history", "Thrombotic History"),
    blk("hema_transfusion_history", "Transfusion History"),
    blk("hema_exposures", "Drug, Toxin & Treatment Exposure"),
    blk("hema_nutrition_reproductive", "Nutritional & Reproductive History"),
    blk("hema_familial", "Familial & Genetic History"),
  ]),
  ...withSection("Physical Findings", [blk("hema_exam", "Physical Findings — Structured Haematology Assessment")]),
  ...withSection("Blood Counts & Film", [
    labs("hema_cbc", "Blood Counts, Indices & Reticulocytes", ["cbc", "retic"]),
    blk("hema_film", "Blood Film & Morphology"),
  ]),
  ...withSection("Haematinics & Haemostasis Studies", [
    labs("hema_iron", "Iron Studies", ["iron"]),
    labs("hema_haematinics", "Vitamin B12 & Folate", ["haematinics"]),
    labs("hema_haemolysis", "Haemolysis Screen", ["haemolysis"]),
    labs("hema_coag", "Coagulation Profile", ["coag", "factor"]),
    labs("hema_hbpathy_tests", "Haemoglobinopathy Studies", ["hbpathy"]),
    labs("hema_advanced", "Flow Cytometry, Cytogenetics & Molecular", ["advanced"]),
    labs("hema_marrow_studies", "Bone Marrow Studies", ["marrow"]),
    labs("hema_biochem", "Renal, Liver & Metabolic", ["biochem"]),
    labs("hema_infection", "Infection Screening", ["infection"]),
    labs("hema_immuno", "Immunoglobulins & Plasma Cell Studies", ["immuno"]),
  ]),
  ...withSection("Diagnostic Reasoning", [
    blk("hema_reasoning", "Assessment & Diagnostic Reasoning"),
    { key: "hema_scores", label: "Validated Assessment Tools", type: "hema_scores" },
  ]),
  ...withSection("Condition-Specific Documentation", [group(GROUP_ALL), ...conditionBlocks(GROUP_ALL)]),
  ...withSection("Management", [blk("hema_management", "Management")]),
  ...withSection("Follow-Up Arrangements", [blk("hema_followup", "Follow-Up Arrangements")]),
];

const followup = () => [
  ...withSection("Interval History", [
    blk("hema_interval", "Interval History"),
    blk("hema_transfusion_history", "Transfusion History"),
  ]),
  ...withSection("Physical Findings", [blk("hema_exam", "Physical Findings — Structured Haematology Assessment")]),
  ...withSection("Blood Counts & Film", [
    labs("hema_cbc", "Blood Counts, Indices & Reticulocytes", ["cbc", "retic"]),
    blk("hema_film", "Blood Film & Morphology"),
  ]),
  ...withSection("Haematinics & Haemostasis Studies", [
    labs("hema_iron", "Iron Studies", ["iron"]),
    labs("hema_haematinics", "Vitamin B12 & Folate", ["haematinics"]),
    labs("hema_coag", "Coagulation Profile", ["coag", "factor"]),
    labs("hema_biochem", "Renal, Liver & Metabolic", ["biochem"]),
  ]),
  ...withSection("Treatment Response & Toxicity", [
    blk("hema_response", "Treatment Response & Toxicity"),
    { key: "hema_scores", label: "Validated Assessment Tools", type: "hema_scores" },
  ]),
  ...withSection("Condition-Specific Documentation", [group(GROUP_ALL), ...conditionBlocks(GROUP_ALL)]),
  ...withSection("Management", [blk("hema_management", "Management")]),
  ...withSection("Follow-Up Arrangements", [blk("hema_followup", "Follow-Up Arrangements")]),
];

const progressNote = () => [
  ...withSection("Interval History", [blk("hema_interval", "Events Since the Last Ward Review")]),
  ...withSection("Physical Findings", [blk("hema_exam", "Physical Findings — Structured Haematology Assessment")]),
  ...withSection("Blood Counts & Film", [
    labs("hema_cbc", "Blood Counts, Indices & Reticulocytes", ["cbc", "retic"]),
    blk("hema_film", "Blood Film & Morphology"),
  ]),
  ...withSection("Coagulation & Biochemistry", [
    labs("hema_coag", "Coagulation Profile", ["coag"]),
    labs("hema_biochem", "Renal, Liver & Metabolic", ["biochem"]),
    labs("hema_infection", "Infection Screening", ["infection"]),
  ]),
  ...withSection("Assessment", [blk("hema_reasoning", "Assessment & Diagnostic Reasoning")]),
  ...withSection("Condition-Specific Documentation", [group(GROUP_ALL), ...conditionBlocks(GROUP_ALL)]),
  ...withSection("Management", [blk("hema_management", "Management")]),
  ...withSection("Next Review", [blk("hema_followup", "Follow-Up & Escalation")]),
];

const transfusionRecord = () => [
  ...withSection("Transfusion Assessment & Monitoring", [
    blk("hema_transfusion_assessment", "Transfusion Assessment & Monitoring"),
  ]),
  ...withSection("Counts & Compatibility", [
    labs("hema_cbc", "Blood Counts Before and After", ["cbc", "retic"]),
    labs("hema_haemolysis", "Haemolysis Screen (if a reaction is assessed)", ["haemolysis"]),
    labs("hema_coag", "Coagulation Profile (plasma or cryoprecipitate)", ["coag"]),
  ]),
  ...withSection("Condition-Specific Documentation", [group(GROUP_TRANSFUSION), ...conditionBlocks(GROUP_TRANSFUSION)]),
  ...withSection("Follow-Up Arrangements", [blk("hema_followup", "Follow-Up Arrangements")]),
];

const infusionRecord = () => [
  ...withSection("Infusion Documentation", [blk("hema_infusion", "Infusion & Day-Unit Therapy")]),
  ...withSection("Counts & Biochemistry", [
    labs("hema_cbc", "Blood Counts", ["cbc", "retic"]),
    labs("hema_biochem", "Renal, Liver & Metabolic", ["biochem"]),
  ]),
  ...withSection("Condition-Specific Documentation", [group(GROUP_INFUSION), ...conditionBlocks(GROUP_INFUSION)]),
  ...withSection("Follow-Up Arrangements", [blk("hema_followup", "Follow-Up Arrangements")]),
];

const boneMarrowRecord = () => [
  ...withSection("Procedure Documentation", [blk("hema_bone_marrow_procedure", "Bone Marrow Aspiration & Biopsy")]),
  ...withSection("Pre-Procedure Checks", [
    labs("hema_cbc", "Blood Counts & Coagulation Before the Procedure", ["cbc", "coag"]),
  ]),
  ...withSection("Provisional Reasoning", [
    blk("hema_reasoning", "Diagnostic Reasoning at the Time of the Procedure"),
  ]),
  ...withSection("Condition-Specific Documentation", [group(GROUP_PROCEDURE), ...conditionBlocks(GROUP_PROCEDURE)]),
  ...withSection("Follow-Up Arrangements", [blk("hema_followup", "Result Follow-Up")]),
];

const treatmentPlan = () => [
  ...withSection("Treatment & Supportive Care", [blk("hema_management", "Treatment & Supportive Care")]),
  ...withSection("Treatment Response & Toxicity", [blk("hema_response", "Treatment Response & Toxicity")]),
  ...withSection("Condition-Specific Documentation", [group(GROUP_TREATMENT), ...conditionBlocks(GROUP_TREATMENT)]),
  ...withSection("Monitoring", [
    labs("hema_cbc", "Blood Counts", ["cbc", "retic"]),
    labs("hema_biochem", "Renal, Liver & Metabolic", ["biochem"]),
    labs("hema_infection", "Infection Screening", ["infection"]),
  ]),
  ...withSection("Follow-Up Arrangements", [blk("hema_followup", "Review & Response Assessment")]),
];

const dischargeSummary = () => [
  ...withSection("Admission Course", [blk("hema_discharge", "Admission Course & Discharge")]),
  ...withSection("Findings at Discharge", [blk("hema_exam", "Physical Findings at Discharge")]),
  ...withSection("Counts at Discharge", [labs("hema_cbc", "Blood Counts & Film at Discharge", ["cbc", "retic"])]),
  ...withSection("Condition-Specific Documentation", [group(GROUP_ALL), ...conditionBlocks(GROUP_ALL)]),
  ...withSection("Medication & Ongoing Treatment", [blk("hema_management", "Ongoing Management")]),
  ...withSection("Follow-Up Arrangements", [blk("hema_followup", "Follow-Up Arrangements")]),
];

export const HEMA_CLINICAL_SECTIONS = {
  hema_consultation: consultation,
  hema_followup: followup,
  hema_progress_note: progressNote,
  hema_transfusion_record: transfusionRecord,
  hema_infusion_record: infusionRecord,
  hema_bone_marrow_record: boneMarrowRecord,
  hema_treatment_plan: treatmentPlan,
  hema_discharge_summary: dischargeSummary,
};