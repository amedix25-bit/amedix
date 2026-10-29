// Presentation-specific documentation for the EXISTING Emergency Medicine note
// types. Every field here is optional and everything is conditional on the
// presentation the clinician records, so a note never shows a wall of irrelevant
// questions and never delays urgent care.
//
// WHAT THIS MODULE DOES NOT DO
//  · It does not compute a score that decides care. The Glasgow Coma Scale field
//    adds up the components the examiner documented and shows the sum; no
//    severity band is assigned by the app beyond the wording the clinician chose.
//  · It does not apply a decision rule for the clinician. A validated rule is
//    valid only in eligible patients, so the rule field records eligibility, the
//    exclusions, whether the rule's required variables were documented, and the
//    result AS DOCUMENTED — the app calculates nothing and states no threshold.
//  · It does not invent doses, algorithms or targets. Paediatric entries record
//    the weight, its source and that weight-based doses were independently
//    double-checked; the dose itself comes from the clinician and the formulary.
//
// Nothing here duplicates a shared surface: vital signs, laboratory results,
// imaging, allergies, medications and history attach to the note automatically.

const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const F = (key, label, extra) => ({ key, label, type: "input", ...extra });
const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
const when = (key, ...values) => ({ showIf: { key, in: values } });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

// The presentation select drives every block below. It is a documentation
// label, not a diagnosis, and "Not documented" is always available.
export const EMERGENCY_PRESENTATION_OPTIONS = [
  "Chest pain",
  "Respiratory distress",
  "Shock or hypoperfusion",
  "Altered mental status",
  "Suspected stroke",
  "Seizure",
  "Acute abdominal pain",
  "Poisoning or toxic exposure",
  "Anaphylaxis",
  "Sepsis",
  "Major trauma",
  "Cardiac arrest",
  "Paediatric emergency",
  "Other presentation (documented in the note)",
  "Not documented",
];

const NOT_DOCUMENTED = "Not documented";

const presentationBlock = () =>
  sec("Presenting Emergency Problem", [
    S("ec_presentation", "Presenting Problem Documented at This Encounter", EMERGENCY_PRESENTATION_OPTIONS, {
      showIf: null,
    }),
    S("ec_presentation_certainty", "How the Presenting Problem Is Recorded", [
      "Symptom or sign only — no diagnosis established",
      "Working diagnosis — investigation in progress",
      "Diagnosis established at this encounter",
      NOT_DOCUMENTED,
    ]),
  ]);

// ---- Chest pain -------------------------------------------------------------
const chestPainBlock = () =>
  sec(
    "Chest Pain Assessment",
    [
      S("ec_cp_features", "Presenting Features Documented", [
        "Typical features documented",
        "Atypical features documented",
        "Mixed features documented",
        NOT_DOCUMENTED,
      ]),
      F("ec_cp_ecg_time", "ECG — Time Performed"),
      S("ec_cp_ecg_finding", "ECG Finding Documented", [
        "Ischaemic changes documented",
        "Non-ischaemic changes documented",
        "No acute changes documented",
        "ECG not performed — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_reperfusion", "Reperfusion Pathway Decision", [
        "Pathway activated",
        "Assessed — not eligible, reason documented",
        "Not assessed — reason documented",
        "Not applicable",
        NOT_DOCUMENTED,
      ]),
      S("ec_cp_troponin", "Cardiac Troponin Sampling", [
        "Serial samples with times documented",
        "Single sample only — reason documented",
        "Not performed — reason documented",
        "Not indicated",
        NOT_DOCUMENTED,
      ]),
    ].map((f) => withPresentation(f, "Chest pain"))
  );

// ---- Respiratory distress ---------------------------------------------------
const respiratoryBlock = () =>
  sec(
    "Respiratory Distress Assessment",
    [
      S("ec_resp_severity", "Severity Documented", [
        "Mild — documented",
        "Moderate — documented",
        "Severe — documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_resp_support", "Respiratory Support Given", [
        "None — documented",
        "Oxygen therapy documented",
        "Non-invasive ventilation or high-flow therapy documented",
        "Invasive ventilation documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_resp_monitoring", "Gas Exchange Monitored", [
        "Blood gas documented",
        "Oximetry only documented",
        "Neither documented",
      ]),
      S("ec_resp_cause", "Cause Recorded", [
        "Cause established at this encounter",
        "Suspected — investigation pending",
        "Undiagnosed — investigation documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_resp_escalation", "Escalation if Not Improving", [
        "Plan documented",
        "Not documented",
        "Not applicable",
      ]),
    ].map((f) => withPresentation(f, "Respiratory distress"))
  );

// ---- Shock ---------------------------------------------------------------
const shockBlock = () =>
  sec(
    "Shock Assessment",
    [
      S("ec_shock_type", "Shock Type Documented", [
        "Undifferentiated shock",
        "Haemorrhagic",
        "Septic",
        "Cardiogenic",
        "Obstructive",
        "Neurogenic",
        "Distributive — other",
        NOT_DOCUMENTED,
      ]),
      S("ec_shock_perfusion", "Perfusion Markers Documented", [
        "Documented — mental state, perfusion and urine output",
        "Partially documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_shock_fluids", "Fluid Resuscitation", [
        "Documented with volume and time",
        "Documented without time",
        "Not given — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_shock_response", "Response to Resuscitation", [
        "Response documented",
        "No response — escalation documented",
        NOT_DOCUMENTED,
      ]),
    ].map((f) => withPresentation(f, "Shock or hypoperfusion"))
  );

// ---- Altered mental status, GCS ------------------------------------------
const alteredMentalStatusBlock = () =>
  sec(
    "Altered Mental Status Assessment",
    [
      {
        key: "ec_gcs",
        label: "Glasgow Coma Scale — components as documented by the examiner",
        type: "gcs_score",
      },
      S("ec_ams_pupils", "Pupils Documented", [
        "Documented — equal and reactive",
        "Documented — abnormal",
        NOT_DOCUMENTED,
      ]),
      S("ec_ams_sedation", "Sedation or Paralysis", [
        "Not sedated or paralysed",
        "Sedated or paralysed — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_ams_causes", "Reversible Causes Considered", [
        "Documented — glucose, oxygen, medication, seizure, sepsis, trauma",
        "Partially documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_ams_disposition_plan", "Disposition Plan Documented", [
        "Admit for observation",
        "Investigate further in the department",
        "Transfer",
        "Discharge with safety-net — documented",
        NOT_DOCUMENTED,
      ]),
    ].map((f) => withPresentation(f, "Altered mental status"))
  );

// ---- Stroke --------------------------------------------------------------
const strokeBlock = () =>
  sec(
    "Stroke Time-Critical Record",
    [
      S("ec_stroke_screen", "Focal Neurological Findings Documented", [
        "Documented — findings and time",
        "Documented without time",
        NOT_DOCUMENTED,
      ]),
      F("ec_last_known_well", "Time Last Known Well (as documented)"),
      S("ec_stroke_scale", "Severity Scale Documented", [
        "Documented — scale and score recorded",
        "Scale not used — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_stroke_imaging", "Imaging", [
        "Performed — result documented with time",
        "Performed — awaiting result",
        "Not performed — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_reperfusion_therapy", "Reperfusion Therapy Decision", [
        "Thrombolysis given — time documented",
        "Assessed — not eligible, reason documented",
        "Thrombectomy pathway documented",
        "Not applicable",
        NOT_DOCUMENTED,
      ]),
      S("ec_stroke_bp", "Blood Pressure Management Documented", [
        "Managed and documented",
        "Not managed — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_swallow_screen", "Swallow Screen Before Oral Intake", [
        "Completed",
        "Not completed — reason documented",
        "Not applicable",
        NOT_DOCUMENTED,
      ]),
    ].map((f) => withPresentation(f, "Suspected stroke"))
  );

// ---- Seizure -------------------------------------------------------------
const seizureBlock = () =>
  sec(
    "Seizure Record",
    [
      S("ec_seizure_type", "Seizure Type Documented", [
        "Generalised convulsive",
        "Focal",
        "Focal with impaired awareness",
        "Status epilepticus documented",
        "Other — documented",
        NOT_DOCUMENTED,
      ]),
      F("ec_seizure_duration", "Duration as Documented"),
      S("ec_seizure_rescue", "Rescue Medication", [
        "Given — agent and time documented",
        "Given without time",
        "Not given — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_seizure_recurrence", "Recurrence", ["Recurrent — documented", "Single episode", NOT_DOCUMENTED]),
      S("ec_seizure_cause", "Cause Assessment Documented", [
        "Assessed and documented",
        "Partially documented",
        NOT_DOCUMENTED,
      ]),
    ].map((f) => withPresentation(f, "Seizure"))
  );

// ---- Acute abdominal pain -------------------------------------------------
const abdominalPainBlock = () =>
  sec(
    "Acute Abdominal Pain Assessment",
    [
      S("ec_abdo_peritonism", "Peritonism Documented", [
        "Present — documented",
        "Absent — documented",
        "Unable to assess — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_abdo_analgesia", "Analgesia", [
        "Given — time documented",
        "Given without time",
        "Not given — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_abdo_pregnancy_test", "Pregnancy Test (where applicable)", [
        "Performed — result documented",
        "Not performed — reason documented",
        "Not applicable",
        NOT_DOCUMENTED,
      ]),
      S("ec_abdo_imaging", "Imaging", [
        "Performed — result documented",
        "Requested — pending",
        "Not indicated — documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_abdo_surgical_review", "Surgical Review", [
        "Obtained — time documented",
        "Requested — pending",
        "Not required — documented",
        NOT_DOCUMENTED,
      ]),
    ].map((f) => withPresentation(f, "Acute abdominal pain"))
  );

// ---- Poisoning and toxic exposure ----------------------------------------
const poisoningBlock = () =>
  sec(
    "Poisoning and Toxic Exposure",
    [
      F("ec_tox_substance", "Substance(s) and Amount as Documented"),
      F("ec_tox_time", "Time of Exposure / Ingestion"),
      S("ec_tox_toxidrome", "Toxidrome or Clinical Pattern Documented", [
        "Documented",
        "Mixed features documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_tox_decontamination", "Decontamination", [
        "Performed — documented",
        "Not indicated — documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_tox_antidote", "Antidote", [
        "Given — agent and time documented",
        "Not indicated — documented",
        "Not available — documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_tox_poison_centre", "Poison Information Service", [
        "Consulted — documented",
        "Not consulted — reason documented",
        "Not available",
        NOT_DOCUMENTED,
      ]),
      S("ec_tox_observation", "Observation Period Planned", [
        "Documented with a time frame",
        "Not documented",
        "Not applicable",
      ]),
      S("ec_tox_risk", "Mental-Health Risk Assessment (self-harm presentations)", [
        "Documented",
        "Not applicable",
        NOT_DOCUMENTED,
      ]),
    ].map((f) => withPresentation(f, "Poisoning or toxic exposure"))
  );

// ---- Anaphylaxis ---------------------------------------------------------
const anaphylaxisBlock = () =>
  sec(
    "Anaphylaxis Record",
    [
      F("ec_ana_trigger", "Suspected Trigger"),
      S("ec_ana_adrenaline", "Adrenaline", [
        "Given — dose, route and time documented",
        "Given — timing incomplete",
        "Not given — reason documented",
        NOT_DOCUMENTED,
      ]),
      F("ec_ana_doses", "Number of Doses and Intervals"),
      S("ec_ana_response", "Response Documented", ["Documented", "Partially documented", NOT_DOCUMENTED]),
      S("ec_ana_biphasic", "Observation for Recurrence", [
        "Observation period documented",
        "Discharged without an observation period — documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_ana_criteria", "Diagnostic Criteria Applied", [
        "Applied and documented",
        "Not documented",
      ]),
    ].map((f) => withPresentation(f, "Anaphylaxis"))
  );

// ---- Major trauma (presentation view; the trauma note has the full survey) --
const traumaPresentationBlock = () =>
  sec(
    "Mechanism and Timing of Injury",
    [
      F("ec_trauma_time", "Time of Injury"),
      S("ec_trauma_mechanism_detail", "Mechanism Documented with Energy and Direction", [
        "Documented in full",
        "Partially documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_trauma_immobilisation", "Spinal Motion Restriction", [
        "Applied — documented",
        "Not applied — reason documented",
        "Not indicated",
        NOT_DOCUMENTED,
      ]),
      S("ec_trauma_survey", "Primary and Secondary Survey", [
        "Both completed and documented",
        "Primary only — documented",
        "Not documented",
      ]),
    ].map((f) => withPresentation(f, "Major trauma"))
  );

// ---- Cardiac arrest presentation (full record in the code note) ------------
const arrestPresentationBlock = () =>
  sec(
    "Resuscitation Record",
    [
      {
        key: "ec_resuscitation_log",
        label: "CPR and intervention log — time, event, detail",
        type: "emergency_resuscitation",
      },
      S("ec_rhythm_checks", "Rhythm and Pulse Checks Documented", [
        "Documented with times",
        "Documented without times",
        NOT_DOCUMENTED,
      ]),
      S("ec_defibrillation", "Defibrillation Recorded", [
        "Recorded — energy, shocks and times",
        "Recorded — without energy",
        "No shock delivered — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_airway_arrest", "Airway During Resuscitation", [
        "Bag-mask ventilation documented",
        "Supraglottic airway documented",
        "Endotracheal intubation documented — confirmation recorded",
        NOT_DOCUMENTED,
      ]),
      S("ec_access_arrest", "Vascular Access", [
        "Intravenous documented",
        "Intraosseous documented",
        "Both documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_resus_algorithm", "Algorithm / Protocol Followed", [
        "Adult BLS / ACLS documented",
        "Paediatric BLS / PALS documented",
        "Local protocol documented",
        NOT_DOCUMENTED,
      ]),
    ].map((f) => withPresentation(f, "Cardiac arrest"))
  );

// ---- Paediatric safeguards ----------------------------------------------
// Shown on every Emergency note: a child can present with any of the above.
const paediatricBlock = () =>
  sec("Paediatric Safeguards", [
    S("ec_paediatric", "Patient Group", [
      "Child or young person (under 18)",
      "Adult",
      NOT_DOCUMENTED,
    ]),
    S(
      "ec_peds_weight_source",
      "Weight Used for Dosing",
      [
        "Measured weight documented",
        "Estimated weight documented — method recorded",
        "Weight not documented",
      ],
      when("ec_paediatric", "Child or young person (under 18)")
    ),
    N("ec_peds_weight", "Weight Used for Dosing (kg)", {
      min: 0.2,
      max: 250,
      step: "0.1",
      unit: "kg",
      ...when("ec_paediatric", "Child or young person (under 18)"),
    }),
    S(
      "ec_peds_dose_check",
      "Weight-Based Dose Safeguard",
      [
        "Doses calculated from the recorded weight and independently double-checked",
        "Doses calculated from the recorded weight — not double-checked",
        "No medication given",
        NOT_DOCUMENTED,
      ],
      when("ec_paediatric", "Child or young person (under 18)")
    ),
    S(
      "ec_peds_caregiver",
      "Caregiver and Consent",
      [
        "Caregiver present — consent documented",
        "Caregiver not present — documented, emergency treatment given",
        NOT_DOCUMENTED,
      ],
      when("ec_paediatric", "Child or young person (under 18)")
    ),
    S(
      "ec_peds_escalation",
      "Paediatric Escalation",
      [
        "Paediatric team involved — documented",
        "Not required — documented",
        NOT_DOCUMENTED,
      ],
      when("ec_paediatric", "Child or young person (under 18)")
    ),
  ]);

// ---- Validated decision rules (documented, never computed) ----------------
const decisionRuleBlock = () =>
  sec("Validated Decision Rule Record", [
    {
      key: "ec_decision_rule",
      label:
        "A validated rule may be applied only to eligible patients — record eligibility, exclusions, the required variables and the result as documented",
      type: "decision_rule",
    },
  ]);

function withPresentation(field, presentation) {
  return { ...field, showIf: field.showIf || { key: "ec_presentation", in: [presentation] } };
}

// Blocks in the order they are appended to a note.
const PRESENTATION_BLOCKS = [
  chestPainBlock,
  respiratoryBlock,
  shockBlock,
  alteredMentalStatusBlock,
  strokeBlock,
  seizureBlock,
  abdominalPainBlock,
  poisoningBlock,
  anaphylaxisBlock,
  traumaPresentationBlock,
  arrestPresentationBlock,
];

// The presentation blocks that belong on a note type that documents assessment.
export const emergencyPresentationEnhancements = () => [
  ...presentationBlock(),
  ...PRESENTATION_BLOCKS.flat(),
  ...decisionRuleBlock(),
  ...paediatricBlock(),
];

// The triage record documents the presentation only.
export const emergencyTriagePresentationEnhancements = () => [
  ...presentationBlock(),
  ...chestPainBlock(),
  ...respiratoryBlock(),
  ...shockBlock(),
  ...strokeBlock(),
  ...seizureBlock(),
  ...anaphylaxisBlock(),
  ...paediatricBlock(),
];

// The resuscitation note gets the full arrest record and the paediatric
// safeguards, and none of the presentation blocks it would never use.
export const emergencyArrestEnhancements = () => [
  ...sec(
    "Resuscitation Record — Structured",
    [
      S("ec_resus_algorithm", "Algorithm / Protocol Followed", [
        "Adult BLS / ACLS documented",
        "Paediatric BLS / PALS documented",
        "Local protocol documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_rhythm_checks", "Rhythm and Pulse Checks Documented", [
        "Documented with times",
        "Documented without times",
        NOT_DOCUMENTED,
      ]),
      S("ec_defibrillation", "Defibrillation Recorded", [
        "Recorded — energy, shocks and times",
        "Recorded — without energy",
        "No shock delivered — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ec_airway_arrest", "Airway During Resuscitation", [
        "Bag-mask ventilation documented",
        "Supraglottic airway documented",
        "Endotracheal intubation documented — confirmation recorded",
        NOT_DOCUMENTED,
      ]),
      S("ec_access_arrest", "Vascular Access", [
        "Intravenous documented",
        "Intraosseous documented",
        "Both documented",
        NOT_DOCUMENTED,
      ]),
      {
        key: "ec_resuscitation_log",
        label: "CPR and intervention log — time, event, detail",
        type: "emergency_resuscitation",
      },
    ]
  ),
  ...paediatricBlock(),
];

export const emergencyDecisionRuleEnhancements = () => [...decisionRuleBlock()];