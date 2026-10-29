// Strengthening the EXISTING Emergency Medicine note types.
//
// The 13 templates declared in src/lib/specialtyDocuments.js are NOT recreated,
// renamed, reordered or replaced. Their keys, labels, order and every existing
// field stay exactly as they are, so saved notes keep their meaning and every
// workflow that reads a note by key keeps working. This module only APPENDS
// fields.
//
// AUDIT RULES APPLIED HERE
// 1. Nothing duplicates a shared AMedix surface. Vital signs, laboratory results,
//    imaging, medications, allergies and the patient's recorded history are
//    provided by the shared ClinicalNote tabs and the unified Patient Record,
//    which attach to every note automatically. No field here re-collects them.
//    The structured fields record the clinician's DECISION and its timing — not a
//    measurement that already exists elsewhere.
// 2. Every field is optional. Time-critical care is never delayed for
//    documentation, and "Not documented" and "Not applicable" are real options —
//    an unanswered field is never read as normal.
// 3. Where a template already documents a fact (for example the procedure's own
//    consent field, or the discharge instruction's warning-sign field), no second
//    field is added for the same fact.
// 4. Prompts quote no guideline instruction unless that text was verified at
//    source (see src/lib/emergencyReferences.js). A reference that was not
//    verified is labelled as such in the note and the PDF.
// 5. Conditional fields appear only when the clinical context makes them
//    relevant.

import {
  emergencyCatalogFor,
  EMERGENCY_CODING_LIMITATION,
  EMERGENCY_ICD11_MMS,
  EMERGENCY_ICD11_CATEGORIES,
  EMERGENCY_ICD11_ROLES,
  EMERGENCY_ICD11_STATUSES,
  EMERGENCY_POSTCOORDINATION_NOTE,
} from "@/lib/emergencyIcd11";
import { EMERGENCY_TIME_CRITICAL_OPTIONS } from "@/lib/emergencySafetyRules";
import {
  emergencyPresentationEnhancements,
  emergencyTriagePresentationEnhancements,
  emergencyArrestEnhancements,
} from "@/lib/emergencyPresentations";

const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const F = (key, label, extra) => ({ key, label, type: "input", ...extra });
const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });

const when = (key, ...values) => ({ showIf: { key, in: values } });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

// ---- Shared option sets -----------------------------------------------------
const ECG_OPTIONS = [
  "Performed — findings documented",
  "Performed — reported normal",
  "Not performed — reason documented",
  "Not indicated",
  "Not documented",
];

const PATHWAY_OPTIONS = [
  "Cardiac arrest pathway",
  "ACS / reperfusion pathway",
  "Stroke / thrombolysis pathway",
  "Sepsis pathway",
  "Major trauma / massive transfusion pathway",
  "Obstetric emergency pathway",
  "None activated",
  "Not documented",
];

const GCS_BANDS = [
  "Not applicable",
  "Mild (GCS 13–15 documented)",
  "Moderate (GCS 9–12 documented)",
  "Severe (GCS 3–8 documented)",
  "GCS not documented",
];

// ---- Shared blocks ---------------------------------------------------------
const timeCriticalBlock = () =>
  sec("Emergency Time-Critical Record", [
    S("ec_time_critical", "Time-Critical Condition Suspected at This Encounter", EMERGENCY_TIME_CRITICAL_OPTIONS),
    F("ec_symptom_onset", "Symptom Onset / Time Last Known Well"),
    F("ec_first_contact", "First Medical Contact — Time"),
    S("ec_ecg", "ECG Performed", ECG_OPTIONS),
    S("ec_pathway", "Time-Critical Pathway Activated", PATHWAY_OPTIONS),
    S("ec_resuscitation_status", "Resuscitation Status / Goals of Care Documented", [
      "Documented",
      "Not documented — unable to establish",
      "Not applicable",
    ]),
  ]);

const redFlagBlock = () =>
  sec("Red-Flag Screening", [
    S("ec_red_flags", "Red-Flag Screen", [
      "Screened — red flags present",
      "Screened — none present",
      "Not screened — reason documented",
      "Unable to screen — reason documented",
      "Not documented",
    ]),
    T("ec_red_flag_details", "Red Flags Found", when("ec_red_flags", "Screened — red flags present")),
    S("ec_vulnerable", "At-Risk Group Documented", [
      "None documented",
      "Pregnancy",
      "Anticoagulated",
      "Immunocompromised",
      "Frail or older adult",
      "Child or young person",
      "Cognitive impairment",
      "Multiple — documented in the note",
    ]),
  ]);

const abcdeBlock = () =>
  sec("Resuscitation & Stabilisation", [
    S("ec_airway", "Airway", [
      "Patent — no intervention",
      "Patent — adjunct or positioning documented",
      "Advanced airway placed — confirmation documented",
      "Compromised — intervention documented",
      "Not documented",
    ]),
    S("ec_breathing", "Breathing & Oxygenation", [
      "Adequate — no support",
      "Oxygen or ventilatory support documented",
      "Inadequate — escalation documented",
      "Not documented",
    ]),
    S("ec_circulation", "Circulation & Haemodynamics", [
      "Stable — no support",
      "Fluid resuscitation documented",
      "Vasopressor or blood product support documented",
      "Peri-arrest — resuscitation documented",
      "Not documented",
    ]),
    S("ec_consciousness", "Consciousness (AVPU or Sedated)", [
      "Alert",
      "Responds to voice",
      "Responds to pain",
      "Unresponsive",
      "Sedated or paralysed — not assessable",
      "Not documented",
    ]),
    S("ec_glucose", "Glucose Measured", [
      "Measured — value documented",
      "Not measured — reason documented",
      "Not indicated",
      "Not documented",
    ]),
    S("ec_pain_reassessed", "Pain Reassessed After Treatment", [
      "Yes — score documented",
      "No — reason documented",
      "Not applicable",
      "Not documented",
    ]),
  ]);

const sepsisBlock = () =>
  sec("Sepsis Assessment", [
    S("ec_sepsis_severity", "Sepsis Status Documented", [
      "Not applicable",
      "Sepsis documented — no shock",
      "Septic shock documented",
      "Suspected — assessment documented",
      "Not documented",
    ]),
    S("ec_antimicrobial_time", "Antimicrobials Given — Timing", [
      "Within 1 hour of recognition",
      "Within 1–3 hours",
      "More than 3 hours",
      "Not given — reason documented",
      "Not applicable",
      "Not documented",
    ]),
    S("ec_lactate", "Lactate", [
      "Measured — value documented",
      "Not measured — reason documented",
      "Not indicated",
      "Not documented",
    ]),
    S("ec_fluid_resuscitation", "Fluid Resuscitation Documented", [
      "Documented with volume and time",
      "Documented without time",
      "Not documented",
      "Not applicable",
    ]),
    S("ec_vasopressor", "Vasopressor Support", [
      "Documented with agent and time",
      "Documented without time",
      "Not required",
      "Not documented",
    ]),
  ]);

const reassessmentBlock = () =>
  sec("Reassessment & Escalation", [
    S("ec_reassessment", "Reassessment Documented", [
      "Yes — response documented",
      "Yes — no change documented",
      "Pending — time planned",
      "Not documented",
    ]),
    F("ec_reassessment_time", "Reassessment Time"),
    S("ec_escalation", "Escalation", [
      "Escalated — documented",
      "Not escalated — reason documented",
      "Not required",
      "Not documented",
    ]),
    F("ec_senior_clinician", "Senior Clinician Informed — Name / Time"),
    T("ec_escalation_detail", "Escalation and Response", when("ec_escalation", "Escalated — documented")),
  ]);

const dispositionBlock = () =>
  sec("Disposition & Safety-Netting", [
    S("ec_disposition_decision", "Disposition Decision Documented", [
      "Documented with time",
      "Documented without time",
      "Not documented",
    ]),
    S("ec_followup_plan", "Follow-Up Plan", [
      "Arranged with a time frame",
      "Advised to arrange — documented",
      "Not arranged",
      "Not applicable — admitted or transferred",
    ]),
    S("ec_safety_netting", "Safety-Netting / Return Advice", [
      "Written and verbal",
      "Verbal only",
      "Interpreter or language support used — documented",
      "Not documented",
      "Not applicable — admitted or transferred",
    ]),
    S("ec_med_reconciliation", "Medication Reconciliation at Discharge", [
      "Completed",
      "Not required — documented",
      "Not documented",
      "Not applicable",
    ]),
  ]);

const traumaBlock = () =>
  sec("Trauma Primary Survey (Structured)", [
    S("ec_trauma_mechanism", "Mechanism of Injury Documented", [
      "Blunt",
      "Penetrating",
      "Burn",
      "Blast",
      "Mixed",
      "Other — documented",
      "Not documented",
    ]),
    S("ec_trauma_team", "Trauma Team Activation", [
      "Activated — documented",
      "Not activated — reason documented",
      "Not documented",
    ]),
    S("ec_trauma_a", "A — Airway with Cervical Spine Protection", [
      "Patent — protection documented",
      "Advanced airway placed — confirmation documented",
      "Compromised — intervention documented",
      "Not documented",
    ]),
    S("ec_trauma_b", "B — Breathing & Ventilation", [
      "Adequate",
      "Supported — documented",
      "Inadequate — intervention documented",
      "Not documented",
    ]),
    S("ec_trauma_c", "C — Circulation & Haemorrhage Control", [
      "Stable",
      "Haemorrhage control documented",
      "Haemorrhagic shock — resuscitation documented",
      "Not documented",
    ]),
    S("ec_trauma_d", "D — Disability (GCS and Pupils)", [
      "Documented — GCS and pupils",
      "Documented — GCS only",
      "Not documented",
    ]),
    S("ec_trauma_e", "E — Exposure & Environmental Control", ["Completed — documented", "Not documented"]),
    S("ec_trauma_adjuncts", "Adjuncts Documented", [
      "FAST, pelvic and chest imaging documented",
      "Some adjuncts documented",
      "None documented",
      "Not applicable",
    ]),
    S("ec_txa", "Tranexamic Acid", [
      "Given — time documented",
      "Considered — not given, reason documented",
      "Not documented",
      "Not applicable",
    ]),
    S("ec_mtp", "Massive Transfusion Protocol", [
      "Activated — time documented",
      "Not activated — reason documented",
      "Not documented",
      "Not applicable",
    ]),
    S("ec_definitive_care", "Definitive Care Plan", [
      "Proceeded to theatre",
      "Admitted under trauma service",
      "Transferred — documented",
      "Observation documented",
      "Not documented",
    ]),
    S("ec_head_injury_severity", "Head Injury Severity (after resuscitation)", GCS_BANDS),
    S("ec_anticoagulant", "Anticoagulant Status at Injury", [
      "Not on anticoagulant",
      "On anticoagulant — reversal/decision documented",
      "On anticoagulant — reversal/decision NOT documented",
      "Unknown",
    ]),
  ]);

const arrestBlock = () =>
  sec("Arrest Record — Structured Elements", [
    S("ec_arrest_witnessed", "Arrest Witnessed", ["Yes — witnessed arrest", "No — unwitnessed", "Unknown"]),
    S("ec_bystander_cpr", "Bystander CPR", ["Yes — documented", "No", "Unknown"]),
    S("ec_aed", "Public-Access Defibrillator Applied", ["Yes — documented", "No", "Unknown", "Not applicable"]),
    S("ec_initial_rhythm", "Initial Rhythm", [
      "Shockable — ventricular fibrillation",
      "Shockable — pulseless ventricular tachycardia",
      "Non-shockable — asystole",
      "Non-shockable — pulseless electrical activity",
      "Unknown",
    ]),
    F("ec_time_to_first_shock", "Time to First Shock"),
    F("ec_shock_count", "Number of Shocks"),
    S("ec_cpr_quality", "CPR Quality Documented", [
      "Documented — compression metrics",
      "Documented — without metrics",
      "Not documented",
    ]),
    F("ec_rosc_time", "Time of ROSC / Resuscitation Ended"),
    S("ec_post_rosc_bundle", "Post-ROSC Care", [
      "Documented",
      "Partially documented",
      "Not documented",
      "Not applicable",
    ]),
    S("ec_drugs_timed", "Arrest Medications", [
      "Given — with times documented",
      "Given — without times",
      "None given",
      "Not documented",
    ]),
    S("ec_family_presence", "Family Presence or Contact", [
      "Present — documented",
      "Contacted — documented",
      "Not documented",
      "Not applicable",
    ]),
    S("ec_debrief", "Team Debrief", ["Completed", "Offered — not yet held", "Not documented", "Not applicable"]),
  ]);

const procedureBlock = (includeConsent = false) =>
  sec("Procedural Safety", [
    ...(includeConsent
      ? [
          S("ec_procedure_consent", "Consent Confirmed Before the Procedure", [
            "Documented",
            "Emergency — reason consent not obtained documented",
            "Not documented",
          ]),
        ]
      : []),
    S("ec_procedure_site_marking", "Site / Side Confirmed", ["Confirmed and documented", "Not applicable", "Not documented"]),
    S("ec_procedure_sedation", "Sedation or Anaesthesia", [
      "Documented — agent and monitoring",
      "None used",
      "Not documented",
      "Not applicable",
    ]),
    S("ec_procedure_sterility", "Aseptic Technique", ["Documented", "Not documented", "Not applicable"]),
    S("ec_procedure_attempts", "Number of Attempts Documented", ["Yes", "No"]),
    S("ec_procedure_post_monitoring", "Post-Procedure Monitoring", [
      "Documented",
      "Not documented",
      "Not applicable",
    ]),
    S("ec_procedure_aftercare", "Aftercare Instructions Given", ["Documented", "Not documented", "Not applicable"]),
  ]);

const consultationBlock = () =>
  sec("Consultation & Response", [
    F("ec_consult_requested_time", "Consultation Requested — Time"),
    F("ec_consult_response_time", "Consultant Response — Time"),
    S("ec_consult_outcome", "Consultation Outcome", [
      "Accepted — plan documented",
      "Accepted — advice only",
      "Declined — reason documented",
      "Pending",
    ]),
    S("ec_consult_handover", "Handover to Consultant / Team", [
      "Documented",
      "Not documented",
      "Not applicable",
    ]),
  ]);

const observationBlock = () =>
  sec("Observation Standards", [
    S("ec_observation_level", "Observation Level", [
      "Observation ward",
      "Short-stay unit",
      "Monitored bed",
      "Not documented",
    ]),
    F("ec_obs_reassessment_interval", "Reassessment Interval Documented"),
    S("ec_observation_criteria", "Escalation Criteria Documented", ["Documented", "Not documented"]),
    S("ec_observation_decision", "Observation Decision", [
      "Continue observation",
      "Admit",
      "Discharge",
      "Transfer",
      "Not documented",
    ]),
  ]);

const transferBlock = () =>
  sec("Handover & Transfer", [
    S("ec_transfer_accepted", "Receiving Facility Acceptance", [
      "Accepted — name and time documented",
      "Accepted — without name or time",
      "Not documented",
      "Not applicable",
    ]),
    S("ec_transfer_monitoring", "Monitoring During Transfer", [
      "Continuous monitoring documented",
      "Intermittent monitoring documented",
      "Not documented",
      "Not applicable",
    ]),
    S("ec_transfer_handover", "Handover Documented", [
      "Structured handover documented",
      "Informal handover documented",
      "Not documented",
    ]),
    S("ec_transfer_risk", "Transfer Risk Documented", ["Documented — benefits and risks", "Not documented"]),
  ]);

const patientInstructionsBlock = () =>
  sec("Patient Instructions & Safety-Netting", [
    S("ec_instructions_mode", "How Instructions Were Given", [
      "Written and verbal",
      "Verbal only",
      "Interpreter or language support — documented",
      "Not documented",
    ]),
    S("ec_teach_back", "Understanding Confirmed (Teach-Back)", [
      "Confirmed",
      "Not confirmed",
      "Not documented",
    ]),
  ]);

const icdBlock = (domains, placeholder) =>
  sec("Diagnosis Classification (ICD-11)", [
    {
      key: "icd11_diagnoses",
      label: "Diagnoses (ICD-11 MMS) — role, status, clinical basis and mapping state",
      type: "icd11_diagnoses",
      catalog: emergencyCatalogFor(domains),
      searchPlaceholder: placeholder,
      catalogRelease: EMERGENCY_ICD11_MMS.release,
      catalogNote: EMERGENCY_CODING_LIMITATION,
      // A presenting symptom, a differential, a suspected diagnosis and a
      // confirmed disease must stay visibly distinct in an emergency record.
      statuses: EMERGENCY_ICD11_STATUSES,
      roles: EMERGENCY_ICD11_ROLES,
      showCategory: true,
      categories: Object.values(EMERGENCY_ICD11_CATEGORIES),
      clusterEnabled: true,
      clusterNote: EMERGENCY_POSTCOORDINATION_NOTE,
      requireConfirmation: true,
    },
  ]);

// `capabilities` tells the prompt engine what this template can actually record,
// so a document that cannot code a diagnosis never asks for one.
const safetyBlock = (capabilities = {}) =>
  sec("Safety Concerns & Documented Action", [
    {
      key: "emergency_safety",
      label: "Safety concerns and the prompts raised by the findings documented in this note",
      type: "emergency_safety",
      capabilities,
    },
  ]);

// ---- Domain sets -----------------------------------------------------------
const ALL_DOMAINS = [
  "cardiac_ischaemia",
  "arrest_shock",
  "cerebrovascular",
  "sepsis",
  "trauma",
  "respiratory",
  "metabolic_neuro",
  "toxicology",
  "allergy",
  "general",
];

const PLACEHOLDER_ALL =
  "Search ICD-11 — acute coronary syndromes, arrest and shock, stroke, sepsis, injury, respiratory failure, metabolic emergencies, poisoning, anaphylaxis...";

const ARREST_DOMAINS = ["arrest_shock", "cardiac_ischaemia", "respiratory", "toxicology", "metabolic_neuro", "general"];
const TRAUMA_DOMAINS = ["trauma", "arrest_shock", "respiratory", "cerebrovascular", "general"];

export const EMERGENCY_ENHANCEMENTS = {
  // Full workflow note: timeline, red flags, resuscitation, reassessment,
  // disposition and coding.
  em_emergency_note: () => [
    ...timeCriticalBlock(),
    ...redFlagBlock(),
    ...abcdeBlock(),
    ...emergencyPresentationEnhancements(),
    ...reassessmentBlock(),
    ...dispositionBlock(),
    ...icdBlock(ALL_DOMAINS, PLACEHOLDER_ALL),
    ...safetyBlock({ icd: true, discharge: true }),
  ],

  // Triage documents acuity and risk, not a diagnosis — no coding block.
  em_triage: () => [
    ...sec("Emergency Time-Critical Record", [
      S("ec_time_critical", "Presenting Problem Category", EMERGENCY_TIME_CRITICAL_OPTIONS),
      F("ec_symptom_onset", "Symptom Onset / Time Last Known Well"),
      F("ec_first_contact", "First Medical Contact — Time"),
    ]),
    ...redFlagBlock(),
    ...sec("Reassessment & Escalation", [
      S("ec_reassessment", "Triage Reassessment Documented", [
        "Yes — response documented",
        "Yes — no change documented",
        "Pending — time planned",
        "Not documented",
      ]),
      F("ec_obs_reassessment_interval", "Reassessment Interval Documented"),
    ]),
    ...emergencyTriagePresentationEnhancements(),
    ...safetyBlock({ icd: false, discharge: false }),
  ],

  em_ed_assessment: () => [
    ...timeCriticalBlock(),
    ...redFlagBlock(),
    ...abcdeBlock(),
    ...sepsisBlock(),
    ...emergencyPresentationEnhancements(),
    ...reassessmentBlock(),
    ...icdBlock(ALL_DOMAINS, PLACEHOLDER_ALL),
    ...safetyBlock({ icd: true, discharge: false }),
  ],

  em_physician_note: () => [
    ...timeCriticalBlock(),
    ...redFlagBlock(),
    ...abcdeBlock(),
    ...sepsisBlock(),
    ...emergencyPresentationEnhancements(),
    ...reassessmentBlock(),
    ...dispositionBlock(),
    ...icdBlock(ALL_DOMAINS, PLACEHOLDER_ALL),
    ...safetyBlock({ icd: true, discharge: true }),
  ],

  em_progress: () => [
    ...reassessmentBlock(),
    ...dispositionBlock(),
    ...icdBlock(ALL_DOMAINS, "Search ICD-11 — the diagnoses this encounter is being coded for..."),
    ...safetyBlock({ icd: true, discharge: true }),
  ],

  em_trauma_assessment: () => [
    ...timeCriticalBlock(),
    ...redFlagBlock(),
    ...traumaBlock(),
    ...emergencyPresentationEnhancements(),
    ...reassessmentBlock(),
    ...transferBlock(),
    ...icdBlock(TRAUMA_DOMAINS, "Search ICD-11 — head and thoracic injury, haemorrhagic shock, respiratory injury..."),
    ...safetyBlock({ icd: true, discharge: false }),
  ],

  em_procedure_note: () => [
    ...procedureBlock(false),
    ...reassessmentBlock(),
    ...dispositionBlock(),
    ...icdBlock(ALL_DOMAINS, "Search ICD-11 — the diagnosis this procedure was performed for..."),
    ...safetyBlock({ icd: true, discharge: true }),
  ],

  em_resuscitation_code: () => [
    ...timeCriticalBlock(),
    ...arrestBlock(),
    ...emergencyArrestEnhancements(),
    ...reassessmentBlock(),
    ...icdBlock(ARREST_DOMAINS, "Search ICD-11 — cardiac arrest, the cause if known, and shock..."),
    ...safetyBlock({ icd: true, discharge: false }),
  ],

  em_consultation: () => [
    ...consultationBlock(),
    ...reassessmentBlock(),
    ...icdBlock(ALL_DOMAINS, "Search ICD-11 — the diagnoses discussed at consultation..."),
    ...safetyBlock({ icd: true, discharge: false }),
  ],

  em_observation_note: () => [
    ...observationBlock(),
    ...reassessmentBlock(),
    ...dispositionBlock(),
    ...icdBlock(ALL_DOMAINS, "Search ICD-11 — the working diagnoses under observation..."),
    ...safetyBlock({ icd: true, discharge: true }),
  ],

  em_transfer_note: () => [
    ...timeCriticalBlock(),
    ...transferBlock(),
    ...reassessmentBlock(),
    ...icdBlock(ALL_DOMAINS, "Search ICD-11 — the diagnoses this transfer is coded for..."),
    ...safetyBlock({ icd: true, discharge: true }),
  ],

  em_discharge_summary: () => [
    ...dispositionBlock(),
    ...reassessmentBlock(),
    ...icdBlock(ALL_DOMAINS, "Search ICD-11 — the diagnoses this attendance is coded for..."),
    ...safetyBlock({ icd: true, discharge: true }),
  ],

  em_discharge_instructions: () => [
    ...patientInstructionsBlock(),
    ...icdBlock(ALL_DOMAINS, "Search ICD-11 — the diagnosis the instructions relate to..."),
    ...safetyBlock({ icd: true, discharge: true, dischargeAlways: true }),
  ],
};

// Appends — never replaces — so a saved note keeps every field it already had.
export const withEmergencyStandards = (docs) =>
  docs.map((doc) => {
    const extra = EMERGENCY_ENHANCEMENTS[doc.key];
    if (!extra) return doc;
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = extra().filter((f) => !existing.has(f.key));
    return { ...doc, fields: [...(doc.fields || []), ...additions] };
  });