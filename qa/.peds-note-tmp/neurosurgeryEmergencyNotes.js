// NEUROSURGERY — the two emergency note types.
//
// They exist because the specialty was represented by consultation, trauma,
// hydrocephalus and tumour notes, and the emergency presentations in paragraph 4
// — a falling conscious level, raised pressure, herniation, an acute deficit, cord
// compression and cauda equina — had no note of their own in which the
// time-critical decisions and their times could be recorded.
//
// Both notes are built from the same shared blocks as every other neurosurgical
// note, so nothing is re-typed and nothing duplicates the shared tabs: vital
// signs, the examination, the ICD-11 field, the scores and the safety prompts are
// the same components used everywhere else.

import {
  I,
  S,
  T,
  NOT_DOCUMENTED,
  emergencyBlock,
  examBlock,
  examField,
  gcsBlock,
  guidanceBlock,
  icdBlock,
  isncsciBlock,
  scoreBlock,
  sec,
  vitalsBlock,
} from "./neurosurgeryNoteBlocks.js";

// ---------------------------------------------------------------------------
// Emergency Cranial — deteriorating consciousness, raised pressure, herniation
// ---------------------------------------------------------------------------
export const EMERGENCY_CRANIAL = {
  key: "nsg_emergency_cranial",
  label: "Emergency Cranial — Deteriorating Consciousness, Raised ICP & Herniation",
  specialty: "neurosurgery",
  fields: [
    ...vitalsBlock(),
    ...sec("Neurological Status", [
      ...gcsBlock(),
      T("deficit", "Focal deficit, cranial nerve findings and any posturing"),
      S("spinal_injury", "Spinal injury suspected alongside the cranial emergency", [
        "No",
        "Suspected",
        "Yes — documented",
        "Not assessed",
      ]),
      S("anticoag", "Anticoagulant / antiplatelet status", [
        "None",
        "Antiplatelet only",
        "Anticoagulated — reversal started",
        "Anticoagulated — not reversed",
        "Unknown",
      ]),
    ]),
    ...examField(),
    ...examBlock(),
    ...emergencyBlock(),
    ...sec("Intracranial Pressure & Brain Protection", [
      S("icp_monitoring", "Intracranial pressure monitoring", [
        "Not monitored — reason documented",
        "External ventricular drain placed",
        "Intraparenchymal monitor placed",
        NOT_DOCUMENTED,
      ]),
      I("icp_target", "Pressure and cerebral perfusion targets set for this patient", {
        placeholder: "e.g. ICP below 20 mmHg, cerebral perfusion pressure 60–70 mmHg",
      }),
      S("osmotherapy", "Osmotherapy", [
        "Given — agent, dose and time recorded",
        "Not given — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("ventilation_strategy", "Ventilation strategy", [
        "Normocapnia targeted",
        "Brief hyperventilation for deterioration — documented",
        "Not applicable",
        NOT_DOCUMENTED,
      ]),
      S("sedation_analgesia", "Sedation and analgesia", [
        "Used — agent documented",
        "Not used — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("seizure_treatment", "Seizure treatment or prophylaxis", [
        "Started — agent and time recorded",
        "Not indicated — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("steroid", "Steroid", [
        "Given — indication documented",
        "Given — no indication documented",
        "Not given",
        NOT_DOCUMENTED,
      ]),
      S("pressure_target_met", "Blood pressure management against the documented target", [
        "Target documented and met",
        "Target documented — not met",
        "Not documented",
      ]),
    ]),
    ...sec("Operative Decision", [
      S("operative_decision", "Surgical decision", [
        "No operation — reason documented",
        "Decompression planned",
        "Drainage planned",
        "Deferred — documented",
      ]),
      I("decision_time", "Time the operative decision was made"),
      I("theatre_time", "Time the patient left for theatre"),
      S("consent_emergency", "Consent position for emergency surgery", [
        "Consent documented",
        "Emergency exception — documented",
        "Best-interest decision — documented",
        NOT_DOCUMENTED,
      ]),
      I("responsible_clinician", "Consultant responsible for the decision"),
    ]),
    ...icdBlock("Search the emergency diagnosis"),
    ...guidanceBlock("nsg_emergency_cranial"),
  ],
  guidelineBasis: [],
};

// ---------------------------------------------------------------------------
// Emergency Spinal — cord compression and cauda equina
// ---------------------------------------------------------------------------
export const EMERGENCY_SPINE = {
  key: "nsg_emergency_spine",
  label: "Emergency Spinal — Cord Compression & Cauda Equina",
  specialty: "neurosurgery",
  fields: [
    ...vitalsBlock(),
    ...sec("Onset & Deficit", [
      S("deficit_pattern", "Pattern of deficit", [
        "Unilateral",
        "Bilateral",
        "Asymmetrical",
        "Complete below the level",
        NOT_DOCUMENTED,
      ]),
      I("deficit_level", "Sensory level and worst documented motor grade"),
      S("bladder_bowel", "Bladder and bowel function", [
        "Normal",
        "Urinary retention",
        "Incontinence",
        "Catheter in situ",
        NOT_DOCUMENTED,
      ]),
      S("saddle", "Saddle sensation", [
        "Intact",
        "Reduced",
        "Absent",
        "Unable to assess",
        NOT_DOCUMENTED,
      ]),
      S("anal_tone", "Anal tone", ["Normal", "Reduced", "Absent", "Not examined", NOT_DOCUMENTED]),
      S("known_malignancy", "Known malignancy", ["No", "Yes — primary site documented", "Suspected", "Unknown"]),
      S("anticoag", "Anticoagulant / antiplatelet status", [
        "None",
        "Antiplatelet only",
        "Anticoagulated — reversal started",
        "Anticoagulated — not reversed",
        "Unknown",
      ]),
    ]),
    ...examField(),
    ...isncsciBlock(),
    ...emergencyBlock(),
    ...scoreBlock(),
    ...sec("Decompression Decision", [
      I("target_time", "Target time to decompression, and whether it was met"),
      S("dexamethasone", "Dexamethasone", [
        "Given — dose and time recorded",
        "Not given — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("surgical_service", "Surgical service involved", [
        "Neurosurgery on site — taken over",
        "Neurosurgery — transferred to",
        "Orthopaedic spinal service",
        "No surgical service available — documented",
        NOT_DOCUMENTED,
      ]),
      S("consent_emergency", "Consent position for emergency surgery", [
        "Consent documented",
        "Emergency exception — documented",
        "Best-interest decision — documented",
        NOT_DOCUMENTED,
      ]),
      I("responsible_clinician", "Consultant responsible for the decision"),
    ]),
    ...icdBlock("Search the cord or cauda equina diagnosis, with its level"),
    ...guidanceBlock("nsg_emergency_spine"),
  ],
  guidelineBasis: [],
};