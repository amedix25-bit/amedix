// Anesthesiology & Perioperative Medicine clinical document catalogue — the
// EXISTING AMedix note types, strengthened in place.
//
// The twelve original note keys are kept exactly as they were:
//   anes_pre_assessment, anes_consultation, anes_plan, anes_consent,
//   anes_airway_assessment, anes_intraop_record, anes_medication_record,
//   anes_monitoring_record, anes_post_anesthesia_care_note,
//   anes_post_anesthesia_evaluation, anes_followup, anes_regional_record
// Their original field keys are preserved too — only clinical content is
// deepened. Six note types the department documents but the catalogue did not
// yet offer are added alongside them, and nothing is duplicated:
//   procedural sedation / MAC, obstetric anesthesia, pediatric anesthesia,
//   emergency & trauma anesthesia, critical incident & complication reporting,
//   transfer of care (handover).
// General anesthesia, regional/neuraxial anesthesia, airway management, PACU
// care, pre-anesthesia evaluation and consent were already covered by existing
// note types and are strengthened there rather than duplicated.
//
// BASIS AND VERSION DATES (verified against the ASA Standards and Practice
// Parameters index):
//   Basic Standards for Preanesthesia Care — revised 15 October 2025
//   Standards for Basic Anesthetic Monitoring — last amended 15 October 2025
//   Standards for Postanesthesia Care — last amended 23 October 2024
//   Statement on ASA Physical Status Classification System — revised 15 Oct 2025
//   Practice Guidelines for Management of the Difficult Airway — January 2022
//   Practice Guidelines for Moderate Procedural Sedation and Analgesia — March 2018
//   Practice Guidelines for Obstetric Anesthesia — February 2016
//   Practice Guidelines for Preoperative Fasting (aspiration risk) — March 2017
//   Practice Guidelines for Preoperative Fasting: carbohydrate-containing clear
//     liquids, chewing gum and pediatric fasting duration — February 2023
//   Practice Guideline for Monitoring and Antagonism of Neuromuscular Blockade — January 2023
//   Practice Guidelines for Acute Pain Management in the Perioperative Setting — February 2012
//   Practice Guideline for Perioperative Pain Management Using Local and Regional
//     Analgesia for Cardiothoracic, Mastectomy and Abdominal Surgery — January 2026
//   Practice Advisory for Preanesthesia Evaluation — March 2012
//   Practice Guidelines for Perioperative Management of Patients with Obstructive
//     Sleep Apnea — February 2014
//   Practice Advisory for the Perioperative Management of Patients with Cardiac
//     Implantable Electronic Devices — February 2020
//   Practice Guidelines for Perioperative Blood Management — February 2015
//   Practice Guidelines for the Prevention, Detection and Management of Respiratory
//     Depression Associated with Neuraxial Opioids — March 2016
//   Practice Advisory for the Prevention of Perioperative Peripheral Neuropathies — January 2018
//   Practice Advisory for Perioperative Visual Loss Associated with Spine Surgery — February 2019
//   Practice Advisory for Perioperative Care of Older Adults Scheduled for Inpatient
//     Surgery — January 2025
//   Statement on Adverse Event Analysis — October 2025
//   Statement on Antenatal Anesthesiology Consultation — October 2025
//
// A recommendation is recorded only where it belongs to that clinical workflow,
// and every value stays empty until the anesthesiologist documents it. Nothing
// is defaulted to normal, no diagnosis is assigned, and ASA Physical Status is
// never derived from an ICD-11 diagnosis code.

import {
  I,
  N,
  T,
  S,
  VIT,
  R,
  when,
  sec,
  ICD,
  YES_NO,
  YES_NO_UNK,
  NOT_DOCUMENTED,
  ASA_CLASSES,
  ASA_EMERGENCY,
  TECHNIQUES,
  AIRWAY_DEVICES,
  FASTING_RECORDED,
  asaStatusFields,
  fastingFields,
  monitoringComplianceFields,
} from "@/lib/anesthesiaFields";
import { preAssessment, consultation, plan, consent } from "@/lib/anesthesiaPreopDocs";

// ---------------------------------------------------------------------------
// 5. Airway Assessment (with difficult-airway management)
// ---------------------------------------------------------------------------
const airway = {
  key: "anes_airway_assessment",
  label: "Airway Assessment",
  specialty: "anesthesiology",
  notice:
    "Airway assessment and strategy follow the ASA Practice Guidelines for Management of the Difficult Airway (January 2022): the assessment, the strategy chosen before induction, the primary and rescue plans, and the front-of-neck access plan are documented before, not after, the airway is managed. Every attempt is recorded.",
  fields: [
    ...sec("Airway Assessment", [
      S("mallampati", "Modified Mallampati Class", ["I", "II", "III", "IV", "Not assessed"]),
      T("mouth_opening", "Mouth Opening (Inter-incisor Gap)"),
      T("thyromental_distance", "Thyromental Distance"),
      T("neck_movement", "Neck Movement / Extension"),
      T("dental_status", "Dentition and Dental Risk"),
      T("mandibular_protrusion", "Mandibular Protrusion / Jaw Mobility"),
      S("upper_lip_bite", "Upper Lip Bite Test", ["Class I", "Class II", "Class III", "Not performed"]),
      T("soft_tissue", "Soft Tissue — beard, obesity, neck circumference, radiation change, mass"),
      S("cervical_spine_precaution", "Cervical Spine Precaution", [
        "None",
        "Manual in-line stabilisation required",
        "Rigid collar in place",
        "Known instability — documented plan",
      ]),
      T("previous_airway_record", "Previous Airway Record — device, grade, attempts, difficulty"),
    ]),
    ...sec("Predicted Difficulty (ASA 2022)", [
      S("predicted_difficulty_ventilation", "Predicted Difficulty — Mask Ventilation", [
        "Not anticipated",
        "Possibly difficult",
        "Anticipated difficult",
      ]),
      S("predicted_difficulty_supraglottic", "Predicted Difficulty — Supraglottic Airway", [
        "Not anticipated",
        "Possibly difficult",
        "Anticipated difficult",
      ]),
      S("predicted_difficulty_intubation", "Predicted Difficulty — Intubation", [
        "Not anticipated",
        "Possibly difficult",
        "Anticipated difficult",
      ]),
      S("predicted_difficulty_front_of_neck", "Predicted Difficulty — Emergency Invasive Airway", [
        "Not anticipated",
        "Possibly difficult — anatomy or access limitation",
        "Anticipated difficult",
      ]),
      S("aspiration_risk", "Aspiration Risk at Induction", ["Low", "Increased", "High — rapid sequence planned"]),
    ]),
    ...sec("Airway Strategy", [
      S("strategy_timing", "Strategy Chosen", [
        "Airway management after induction",
        "Awake airway management",
        "Awake airway management with surgical backup in theatre",
        "Not applicable — regional only",
      ]),
      S("primary_device", "Primary Device Planned", AIRWAY_DEVICES),
      T("primary_technique_detail", "Primary Technique — preoxygenation, positioning, adjuncts, video laryngoscope, bougie"),
      T("preoxygenation", "Preoxygenation and Oxygen Reserve — including apnoeic oxygenation or high-flow therapy where planned"),
      S("second_operator", "Second Skilled Operator Available", YES_NO_UNK),
      S("surgical_team_ready", "Surgical Team Ready for Front-of-Neck Access", [
        "Yes — in theatre",
        "Yes — on call",
        "No",
        "Not applicable",
      ]),
    ]),
    ...sec("Rescue & Front-of-Neck Access", [
      T("rescue_plan", "Rescue Plan — sequence of devices and operators if the primary approach fails"),
      S("oxygenation_rescue", "Oxygenation Rescue Ready", [
        "Supraglottic rescue device, mask and airway adjuncts",
        "Plus high-flow nasal oxygen",
        "Plus front-of-neck access kit and identified operator",
        "Not prepared",
      ]),
      T("cannot_intubate_cannot_oxygenate", "Cannot Intubate, Cannot Oxygenate Plan — who does what, and when it is called"),
      S("debrief_after_difficulty", "Debrief and Incident Reporting Planned if Difficulty Occurs", YES_NO_UNK),
    ]),
    ...sec("After Airway Management", [
      T("devices_used", "Devices and Adjuncts Used"),
      N("attempts", "Number of Intubation Attempts", { min: 0, max: 10, unit: "attempts" }),
      S("cl_grade", "Cormack-Lehane Grade", ["1", "2", "3", "4", "Not applicable"]),
      S("placement_verified", "Placement Verified by Clinical Assessment and Expired Carbon Dioxide", [
        "Yes — both",
        "Yes — carbon dioxide only",
        "Not documented",
      ]),
      S("airway_difficulty_occurred", "Difficulty Actually Encountered", [
        "None",
        "Yes — documented in the intraoperative record and incident report",
      ]),
      T("plan", "Airway Management Plan for This Anesthetic", R),
      T("aftercare", "Airway Aftercare — sore throat, hoarseness, dental or soft-tissue injury to review"),
      ICD("icd11_complications", "Airway Event or Injury Coded With ICD-11 — where a verified code applies"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 6. Intraoperative Anesthesia Record
// ---------------------------------------------------------------------------
const intraop = {
  key: "anes_intraop_record",
  label: "Intraoperative Anesthesia Record",
  specialty: "anesthesiology",
  notice:
    "This record carries the general, regional and monitored-anesthesia-care course. Monitoring follows the ASA Standards for Basic Anesthetic Monitoring (last amended 15 October 2025); neuromuscular management follows the ASA Practice Guideline for Monitoring and Antagonism of Neuromuscular Blockade (January 2023); blood management follows the ASA Practice Guidelines for Perioperative Blood Management (February 2015). Waiving a starred monitoring requirement is recorded with its reason.",
  fields: [
    ...sec("Case Timing & Team", [
      I("anesthesia_start", "Anesthesia Start Time"),
      I("anesthesia_end", "Anesthesia End Time"),
      I("procedure_performed", "Procedure Performed"),
      I("surgeon", "Surgeon"),
      I("anesthetist", "Anesthesia Provided By"),
      T("team", "Anesthesia Team — supervision and relief given"),
      T("position", "Patient Position and Position Changes"),
      S("time_out_completed", "Surgical Safety Checklist Sign-in / Time-out Completed Before Induction", [
        "Yes — with the team present",
        "Yes — partially",
        "No",
      ]),
      S("asa_class_at_case", "ASA Physical Status Recorded for This Anesthetic", ASA_CLASSES),
      S("asa_emergency_at_case", "Emergency Modifier Applied", ASA_EMERGENCY),
    ]),
    ...sec("Anesthetic Technique", [
      S("technique", "Technique Used", TECHNIQUES),
      T("technique_detail", "Technique Detail — regional component, catheter, sedation, conversion to another technique"),
      T("regional_or_neuraxial_detail", "Regional or Neuraxial Detail — level, block assessed, catheter management"),
      S("laterality", "Side / Laterality of the Procedure", ["Left", "Right", "Bilateral", "Midline — not applicable"]),
      S("conversion_or_supplement", "Conversion or Supplementation During the Case", [
        "None",
        "Converted to general anesthesia — documented",
        "Supplemented — analgesics or local anesthetic given",
        "Converted to regional — general abandoned",
      ]),
    ]),
    ...sec("Airway & Ventilation", [
      S("airway_device", "Airway Device", AIRWAY_DEVICES),
      I("tube_size", "Tube / Device Size"),
      T("intubation_details", "Intubation Details — attempts, grade, adjuncts used"),
      S("ventilation_mode", "Ventilation", [
        "Controlled mechanical ventilation",
        "Pressure support / spontaneous",
        "Spontaneous breathing — no device",
        "Not applicable — regional only",
      ]),
      T("ventilation_settings", "Ventilation Settings — tidal volume, rate, PEEP, peak pressure"),
      S("lung_protective_ventilation", "Lung-Protective Ventilation Applied", [
        "Yes — low tidal volume and PEEP",
        "Not indicated",
        "Not applied — reason documented",
      ]),
      T("etco2_course", "End-tidal Carbon Dioxide Course — values and events"),
      T("cuff_pressure", "Cuff Pressure / Airway Leak Check"),
      S("placement_confirmed", "Airway Placement Confirmed", [
        "Yes — waveform capnography and bilateral breath sounds",
        "Yes — waveform capnography only",
        "Not documented",
      ]),
      S("difficult_airway_event", "Difficult-Airway Event During This Case", [
        "None",
        "Yes — additional device or operator required",
        "Yes — cannot intubate, cannot oxygenate pathway activated",
        "Yes — surgical airway established",
      ]),
      T("airway_event_detail", "Difficult-Airway Event Detail — devices, attempts, grade, rescue and outcome", when("difficult_airway_event", "Yes — additional device or operator required", "Yes — cannot intubate, cannot oxygenate pathway activated", "Yes — surgical airway established")),
      T("respiratory_parameters", "Respiratory Parameters and Trends — tidal volume, rate, minute volume, peak and plateau pressure, PEEP, compliance"),
    ]),
    ...sec("Induction", [
      T("induction_medications", "Induction Agents and Doses"),
      S("induction_sequence", "Induction Sequence", [
        "Standard intravenous induction",
        "Rapid sequence induction",
        "Inhalational induction",
        "Awake or sedation-assisted",
        "Not applicable — regional only",
      ]),
      T("preoxygenation_detail", "Preoxygenation Given"),
      T("induction_response", "Haemodynamic and Airway Response to Induction"),
    ]),
    ...sec("Maintenance", [
      T("maintenance", "Maintenance — agents, concentrations and depth"),
      S("maintenance_mode", "Maintenance Mode", [
        "Volatile anesthesia",
        "Total intravenous anesthesia",
        "Balanced with regional",
        "Sedation only",
        "Not applicable",
      ]),
      T("mac_course", "Agent Concentration Course — end-tidal values and MAC"),
      T("intraop_analgesia", "Intraoperative Analgesia — including regional and non-opioid components"),
    ]),
    ...sec("Emergence & Extubation", [
      T("emergence", "Emergence — reversal, spontaneous breathing, responsiveness"),
      S("extubation_decision", "Extubation Decision", [
        "Awake extubation",
        "Deep extubation",
        "Airway exchanged for supraglottic device",
        "Left intubated — transferred ventilated",
        "Not applicable",
      ]),
      S("tof_before_extubation", "Quantitative Train-of-Four Ratio Before Extubation", [
        "≥ 0.9 documented",
        "Below 0.9 — reversal given and repeated",
        "Not measured — reason documented",
        "Not applicable — no neuromuscular blocking agent",
      ]),
      T("extubation_course", "Extubation Course and Any Airway Event"),
    ]),
    ...sec("Circulation, Fluids & Blood", [
      T("vitals_intraop", "Vital Signs — timed chart entries across the case"),
      VIT("timed_vitals", "Vital Signs (Structured Entry)"),
      T("haemodynamic_targets", "Haemodynamic Targets Set and Met — blood pressure and heart rate goals"),
      T("vasoactive_support", "Vasoactive Support — agents, doses, duration"),
      T("fluids_given", "Intravenous Fluids Given — type and total"),
      I("blood_loss", "Estimated Blood Loss"),
      T("urine_output", "Urine Output"),
      S("transfusion", "Blood Products Given", [
        "None",
        "Packed red cells",
        "Plasma",
        "Platelets",
        "More than one product",
      ]),
      T("transfusion_detail", "Transfusion Detail — units, indication, reaction monitoring"),
      T("coagulation_management", "Coagulation Management — tests, agents, response"),
      S("urine_output_monitored", "Urine Output Measured", [
        "Yes — catheter with hourly volumes",
        "Yes — intermittent measurement",
        "Not measured — not indicated",
        "Not measured — documented reason",
      ]),
      T("fluid_balance", "Fluid Balance — intake against output, and the running total"),
      T("vital_trends", "Vital Sign Trends Across the Case — direction of blood pressure, heart rate, saturation, end-tidal carbon dioxide and temperature, with times"),
      T("hemodynamic_instability", "Haemodynamic Instability — what was unstable, for how long, and the defined threshold that was crossed"),
      T("interventions_response", "Interventions and the Response — what was done, when, and how the patient responded"),
      T("help_called", "Help or Additional Support Called — who was called, when, and the outcome"),
    ]),
    ...sec("Neuromuscular Blockade", [
      S("relaxant_used", "Neuromuscular Blocking Agent", [
        "None",
        "Rocuronium",
        "Vecuronium",
        "Atracurium or cisatracurium",
        "Suxamethonium",
        "Other — documented",
      ]),
      S("quantitative_monitoring", "Quantitative Neuromuscular Monitoring Used", [
        "Throughout the case",
        "Before extubation only",
        "Not used — reason documented",
        "Not applicable",
      ]),
      T("block_course", "Block Course — dose, TOF counts and depth maintained"),
      T("reversal", "Reversal — agent, dose, and response measured"),
      S("residual_blockade_excluded", "Residual Blockade Excluded Before Transfer", [
        "Yes — clinical and quantitative",
        "Clinically only",
        "Cannot be excluded — documented",
        "Not applicable",
      ]),
    ]),
    ...sec("Temperature, Positioning & Safety", [
      T("temperature_course", "Temperature Course and Warming Applied"),
      S("pressure_area_protection", "Pressure Areas Protected", YES_NO),
      T("eyes_positioning", "Eye and Head Protection — including prone or steep positions"),
      S("prone_or_spine_surgery", "Prone or Prolonged Spine Position", [
        "Not applicable",
        "Applied — visual loss precautions documented (ASA February 2019 advisory)",
      ]),
      S("tourniquet", "Tourniquet Used", ["No", "Yes — time and pressure documented"]),
      T("tourniquet_detail", "Tourniquet Timing and Pressure", when("tourniquet", "Yes — time and pressure documented")),
      S("pregnancy_precaution", "Pregnancy / Radiation Precaution Staff Note", ["Not applicable", "Documented"]),
    ]),
    ...sec("Events & Handover", [
      T("events", "Intraoperative Events and Interventions"),
      S("critical_event", "Critical Event Occurred", [
        "None",
        "Yes — documented in the incident report",
      ]),
      S("awareness_reported_risk", "Awareness Risk Addressed — depth monitoring or documented explanation", [
        "Not applicable",
        "Depth monitoring used",
        "Risk considered and documented",
      ]),
      T("handover", "Handover to Recovery — structured transfer recorded"),
      T("debrief", "Team Debrief — and any practice change agreed"),
    ]),
    ...sec("Complications Documented (ICD-11)", [
      ICD("icd11_complications", "Conditions or Complications Coded With ICD-11 — where a verified code applies"),
      T("complication_detail", "Complication Detail — description, timing, management and outcome"),
      S("incident_reported", "Incident or Adverse Event Reported", [
        "Not applicable",
        "Yes — reference recorded",
        "No",
      ]),
    ]),
    ...sec("Special Population Documentation", [
      S("patient_population", "Special Population for This Anesthetic", [
        "Adult — no special population",
        "Obstetric",
        "Pediatric",
        "Emergency or trauma",
        "Complex adult with significant comorbidity",
      ]),
      I("gestational_age", "Gestational Age", when("patient_population", "Obstetric")),
      S("fetal_monitoring", "Fetal Monitoring During Anesthesia", [
        "Not applicable",
        "Continuous — documented by the obstetric team",
        "Intermittent",
        "Not performed — documented reason",
      ], when("patient_population", "Obstetric")),
      N("weight_kg", "Weight Used for Dosing (kg)", { min: 0.5, max: 300, unit: "kg", ...when("patient_population", "Pediatric") }),
      S("weight_based_dosing", "Doses and Fluid Volumes Calculated Against the Recorded Weight", [
        "Yes — verified against weight",
        "Not verified",
      ], when("patient_population", "Pediatric")),
      S("cervical_spine_precaution", "Cervical Spine Precaution", [
        "Manual in-line stabilisation",
        "Rigid collar in place",
        "Cleared clinically",
        "Not applicable",
      ], when("patient_population", "Emergency or trauma")),
      T("resuscitation_context", "Resuscitation Before and During the Case — fluids, blood products, procedures", when("patient_population", "Emergency or trauma")),
      ICD("icd11_comorbidities", "Active Comorbidities Coded With ICD-11 — those affecting this anesthetic", when("patient_population", "Complex adult with significant comorbidity")),
      T("comorbidity_management", "How Each Comorbidity Was Managed During the Case", when("patient_population", "Complex adult with significant comorbidity")),
      T("special_population_note", "Anything Specific to This Population — recorded here or in the dedicated note type"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 7. Anesthesia Medication Record
// ---------------------------------------------------------------------------
const medication = {
  key: "anes_medication_record",
  label: "Anesthesia Medication Record",
  specialty: "anesthesiology",
  notice:
    "This record documents what was actually administered during the anesthetic, with doses and times, so the course can be reconstructed. Controlled drugs are recorded with the witness and the balance checked. Prophylaxis items follow the ASA fasting, neuromuscular blockade and blood management guidance where relevant. Those are ASA practice guidelines rather than formal standards; dose ranges and formulary rules follow the institutional protocol.",
  fields: [
    ...sec("Planned Versus Administered", [
      T("planned_agents", "Agents Planned Before the Case — as recorded in the anesthesia plan"),
      S("variance_from_plan", "Variance From the Planned Regimen", [
        "None — administered as planned",
        "Yes — documented below",
        "No plan recorded",
      ]),
      T("variance_reason", "Variance Detail — what changed, why, and at what time", when("variance_from_plan", "Yes — documented below")),
      T("administration_times", "Timed Administration Sequence — what was given, by which route, and at what time"),
    ]),
    ...sec("Agents & Doses", [
      T("induction_agents", "Induction Agents — drug, dose, route, time"),
      T("maintenance_agents", "Maintenance Agents — drug, concentration, duration"),
      T("opioids", "Opioids — drug, dose, time, and total"),
      T("muscle_relaxants", "Neuromuscular Blocking Agents — drug, dose, time"),
      T("reversal_agents", "Reversal Agents — drug, dose, train-of-four response"),
      T("local_anesthetics", "Local Anesthetics — agent, concentration, volume, total dose in mg"),
      T("other_medications", "Other Medications — antiemetics, analgesics, antibiotics as prescribed, steroids"),
    ]),
    ...sec("Volatile & Sedative Exposure", [
      T("volatile_agent", "Volatile Agent Used and End-tidal Concentration Range"),
      T("mac_hours", "MAC-hours / Total Exposure"),
      T("tiva_regimen", "Total Intravenous Anesthesia Regimen — where used"),
      S("agent_analysis", "Agent Concentration Analysed", ["Continuous gas analysis", "Not available", "Not applicable"]),
    ]),
    ...sec("Vasoactive & Supportive Therapy", [
      T("vasopressors", "Vasopressors and Inotropes — drug, dose, timing"),
      T("fluids", "Intravenous Fluids — type and volume"),
      T("blood_products", "Blood Products — units and timing"),
      T("glucose_insulin", "Glucose and Insulin Management — where relevant"),
    ]),
    ...sec("Prophylaxis & Safety Checks", [
      S("ponv_prophylaxis", "Postoperative Nausea and Vomiting Prophylaxis Given", [
        "None",
        "One agent",
        "Two or more agents",
      ]),
      T("ponv_detail", "Antiemetic Agents and Timing"),
      S("antibiotic_given", "Surgical Antibiotic Prophylaxis Administered Per Prescriber", [
        "Given — time recorded",
        "Not given — documented reason",
        "Not applicable",
      ]),
      S("allergy_crosscheck", "Allergy Cross-check Performed Against the Patient Record", [
        "Checked — no conflict",
        "Checked — conflict identified and managed",
        "Unable to check",
      ]),
      S("anticoagulant_timing", "Anticoagulant Timing Verified Before Neuraxial or Regional Technique", [
        "Not applicable",
        "Verified — interval adequate",
        "Interval not adequate — technique deferred",
      ]),
    ]),
    ...sec("Controlled Drugs & Variance", [
      T("controlled_drugs", "Controlled Drugs — register, witness, balance"),
      T("unused_disposed", "Unused or Expired Medication Disposal"),
      T("discrepancies", "Discrepancies, Wastage or Administering Errors — and the action taken"),
      T("medication_reconciliation", "Medication Handover to the Receiving Team"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 8. Intraoperative Monitoring Record
// ---------------------------------------------------------------------------
const monitoring = {
  key: "anes_monitoring_record",
  label: "Intraoperative Monitoring Record",
  specialty: "anesthesiology",
  notice:
    "Monitoring is recorded against the ASA Standards for Basic Anesthetic Monitoring (last amended 15 October 2025). Qualified anesthesia personnel are continuously present; oxygenation, ventilation, circulation and temperature are continually evaluated. A waived requirement is recorded with its reason so the record shows what was actually monitored.",
  fields: [
    ...sec("Monitoring Modalities Used", [
      T("monitoring_modalities", "Monitoring Modalities in Use — list with start and stop times"),
      S("qualified_personnel_present", "Qualified Anesthesia Personnel Continuously Present", [
        "Yes — continuous presence",
        "Interrupted — reason documented",
      ]),
      S("alarms_audible", "Alarms Audible to the Anesthesia Team", ["Yes — all audible", "Adjusted — documented"]),
      T("monitoring_devices", "Monitoring Devices and Their Placement Times — oximeter, capnography, ECG leads, blood pressure cuff or arterial line, temperature probe"),
      S("monitoring_interruptions", "Interruptions in Continuous Monitoring", [
        "None",
        "Yes — reason and duration documented",
      ]),
    ]),
    ...sec("Standards Compliance", monitoringComplianceFields()),
    ...sec("Recorded Values", [
      T("vitals_log", "Vital Signs Log — timed entries"),
      T("spo2", "Oxygen Saturation Log"),
      T("etco2", "End-tidal Carbon Dioxide Log"),
      T("temperature", "Temperature Log"),
      T("blood_pressure", "Blood Pressure Log"),
      T("heart_rate", "Heart Rate Log"),
      T("agent_concentration", "Agent Concentration Log"),
      T("tof_log", "Train-of-Four Log"),
      T("depth_log", "Depth-of-Anesthesia Log — where monitored"),
      T("trend_summary", "Trend Summary — the direction of each measured variable across the case, with the times it changed"),
    ]),
    ...sec("Documented Waivers", [
      T("waived_requirements", "Requirement Waived and the Reason — recorded in the patient's record"),
      T("mitigation", "Mitigation Applied Instead"),
    ]),
    ...sec("Alerts & Escalation", [
      T("events", "Monitoring Events and Alerts — with the response"),
      T("escalation", "Help Called — who was called, when, and the outcome"),
      T("equipment_issue", "Equipment Failure or Artefact — and the replacement or recalibration"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 9. Post-Anesthesia Care Note (PACU)
// ---------------------------------------------------------------------------
const pacu = {
  key: "anes_post_anesthesia_care_note",
  label: "Post-Anesthesia Care Note",
  specialty: "anesthesiology",
  notice:
    "PACU documentation follows the ASA Standards for Postanesthesia Care (last amended 23 October 2024) and, where neuraxial opioids are in use, the ASA guidance on respiratory depression associated with neuraxial opioids (March 2016). Discharge criteria are recorded as met only when actually assessed.",
  fields: [
    ...sec("Arrival & Handover Received", [
      I("time_in_pacu", "Arrival Time in Recovery"),
      S("handover_received", "Structured Handover Received From the Anesthesia Team", [
        "Yes — verbal and documented",
        "Partially",
        "No",
      ]),
      T("handover_notes", "Key Points Received — technique, airway, blood loss, drugs, concerns"),
      VIT("vitals", "Vital Signs"),
    ]),
    ...sec("Airway, Breathing & Circulation", [
      S("airway", "Airway", [
        "Self-maintained",
        "Supraglottic device in place",
        "Endotracheal tube in place",
        "Adjunct required",
        "Airway support required",
      ]),
      S("respiratory_support", "Respiratory Support", [
        "Room air",
        "Low-flow oxygen",
        "High-flow oxygen",
        "Non-invasive ventilation",
        "Mechanical ventilation",
      ]),
      S("consciousness", "Consciousness Level", [
        "Alert and orientated",
        "Drowsy — rousable",
        "Sedated",
        "Unresponsive",
      ]),
      S("sedation_scale", "Sedation Scale Used", ["Alert / Voice / Pain / Unresponsive", "Richmond Agitation-Sedation Scale", "Not scored"]),
      T("haemodynamics", "Haemodynamic Course — blood pressure, heart rate, rhythm, interventions"),
      T("respiratory_course", "Respiratory Course — rate, oxygen saturation, carbon dioxide, interventions"),
      N("respiratory_rate_monitoring", "Respiratory Rate Monitoring Interval (minutes) Where Neuraxial Opioid Used", { min: 5, max: 120, unit: "minutes" }),
      S("oxygenation_assessed", "Oxygenation and Ventilation Assessed", [
        "Yes — oximetry and respiratory rate",
        "Yes — plus end-tidal carbon dioxide where measured",
        "Not assessed",
      ]),
      T("ventilation_course", "Ventilation in Detail — rate, depth, pattern, carbon dioxide where measured"),
      T("temperature_course", "Temperature and Warming — measured values and the method used"),
    ]),
    ...sec("Pain, Nausea & Comfort", [
      N("pain_score", "Pain Score (0–10)", { min: 0, max: 10, unit: "/ 10" }),
      T("pain_detail", "Pain — site, character, and the intervention given with its effect"),
      T("nausea", "Nausea / Vomiting — and the treatment given with its effect"),
      T("shivering", "Shivering and Temperature Management"),
      T("comfort", "Comfort, Positioning and Anxiety"),
      S("treatment_response", "Response to Treatment Given", [
        "Full response — symptom resolved",
        "Partial response — further treatment given",
        "No response — reported to the responsible clinician",
        "No treatment required",
      ]),
    ]),
    ...sec("Surgical Site & Fluid Balance", [
      T("bleeding", "Surgical Site, Drainage and Bleeding"),
      T("drain_output", "Drain and Output Volumes"),
      T("urine_output", "Urine Output"),
      T("fluid_balance", "Fluid Balance and Ongoing Replacement"),
    ]),
    ...sec("Neuraxial & Regional Aftercare", [
      S("regional_technique_present", "Regional or Neuraxial Technique in This Patient", YES_NO),
      T("motor_block", "Motor Block Regression and Sensory Level", when("regional_technique_present", "Yes")),
      S("respiratory_monitoring_neuraxial_opioid", "Respiratory Monitoring for Neuraxial Opioid", [
        "Not applicable",
        "Continuous pulse oximetry",
        "Intermittent respiratory rate and sedation checks",
        "Continuous oximetry plus sedation checks",
      ], when("regional_technique_present", "Yes")),
      T("block_aftercare", "Block Aftercare — catheter management, infusion, numbness precautions", when("regional_technique_present", "Yes")),
      S("residual_blockade", "Residual Neuromuscular Blockade at Discharge From Recovery", [
        "Excluded — quantitative train-of-four ratio documented",
        "Excluded — clinical assessment only",
        "Present — treated and re-assessed",
        "Not applicable — no neuromuscular blocking agent",
      ]),
      S("block_status", "Regional or Neuraxial Block Status", [
        "Not applicable",
        "Adequate analgesia — no motor block",
        "Residual motor block — documented",
        "Resolving",
      ], when("regional_technique_present", "Yes")),
    ]),
    ...sec("Adverse Events & Escalation", [
      S("adverse_event", "Adverse Event in Recovery", [
        "None",
        "Airway event",
        "Respiratory depression",
        "Hypotension or arrhythmia",
        "Haemorrhage",
        "Severe pain",
        "Nausea or vomiting",
        "Neurological change",
        "Other — documented",
      ]),
      T("adverse_event_detail", "Event Detail and Management"),
      ICD("icd11_complications", "Adverse Events or Complications Coded With ICD-11 — where a verified code applies"),
      S("anesthesiologist_called", "Anesthesiologist or Critical Care Called", [
        "Not required",
        "Called — attended",
        "Called — advice given",
        "Escalated to critical care outreach",
      ]),
      T("escalation_outcome", "Outcome of Calling for Help, and the Ongoing Plan"),
    ]),
    ...sec("Discharge Readiness", [
      S("discharge_criteria", "Discharge Criteria Met", ["Yes", "No — remains in recovery", "Pending"]),
      S("discharge_scoring", "Recovery Scoring Used", [
        "Aldrete score documented",
        "Institutional criteria documented",
        "Not scored — clinical criteria documented",
      ]),
      T("discharge_assessment", "Discharge Assessment — airway, breathing, circulation, consciousness, pain, nausea, mobility"),
      S("disposition", "Disposition From Recovery", [
        "Ward",
        "Intensive care unit",
        "High-dependency unit",
        "Day-case discharge",
        "Ward-level discharge",
        "Theatre — return for further surgery",
      ]),
      S("discharged_by", "Discharge Authorised By", [
        "Anesthesiologist",
        "Delegated recovery staff under protocol",
        "Not documented",
      ]),
      I("time_discharged", "Time Discharged From Recovery"),
      T("instructions_given", "Instructions Given to the Receiving Team or Patient"),
      S("transfer_readiness", "Transfer or Discharge Readiness Against the Institutional Protocol", [
        "Met — protocol criteria documented",
        "Met with conditions — documented",
        "Not met — remains in recovery",
      ]),
      T("ongoing_monitoring", "Ongoing Monitoring Requirements — what is monitored, how often, and by whom"),
      I("responsible_clinician", "Responsible Clinician After Transfer"),
      T("hydration", "Hydration and Fluid Status at Transfer"),
      S("handover_to_ward", "Structured Handover to the Receiving Team", [
        "Given verbally and documented",
        "Documented only",
        "Not given",
      ]),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 10. Post-Anesthesia Evaluation
// ---------------------------------------------------------------------------
const postEvaluation = {
  key: "anes_post_anesthesia_evaluation",
  label: "Post-Anesthesia Evaluation",
  specialty: "anesthesiology",
  notice:
    "The post-anesthesia evaluation is documented after the anesthetic, and for inpatients before discharge from the anesthesia episode, per the ASA Standards for Postanesthesia Care (last amended 23 October 2024). After-effects that are found are recorded as found, with the action taken; a complication is coded with ICD-11, never inferred.",
  fields: [
    ...sec("Evaluation Timing & Method", [
      S("evaluation_method", "Evaluation Performed By", [
        "Anesthesiologist — personal review",
        "Anesthesiologist — review of the record plus staff report",
        "Delegated clinician",
      ]),
      I("evaluation_datetime", "Date and Time of Evaluation"),
      S("evaluation_setting", "Where Evaluated", ["Recovery area", "Ward", "Intensive care unit", "Day-surgery unit", "Telephone follow-up"]),
      T("anesthetic_summary", "Anesthetic Summary — technique, duration, agents of note"),
    ]),
    ...sec("Airway & Respiratory After-Effects", [
      T("mental_status", "Mental Status and Orientation"),
      T("vital_signs", "Vital Signs"),
      T("respiratory_status", "Respiratory Status — pattern, oxygen requirement, auscultation"),
      S("sore_throat", "Sore Throat or Hoarseness", ["None", "Mild", "Moderate to severe"]),
      S("dental_injury", "Dental, Lip or Tongue Injury", ["None identified", "Identified — documented and referred"]),
      S("airway_after_effect", "Other Airway After-Effect", ["None", "Identified — documented"]),
      S("airway_patency", "Airway Patency", [
        "Patent — self-maintaining",
        "Maintained with an airway adjunct",
        "Device still in place",
        "Compromised — managed",
      ]),
      T("oxygenation", "Oxygenation — saturation, oxygen requirement and the trend since recovery"),
      T("ventilation_assessment", "Ventilation — respiratory rate, depth, and carbon dioxide where measured"),
    ]),
    ...sec("Pain, Nausea & Function", [
      N("pain_score", "Pain Score (0–10)", { min: 0, max: 10, unit: "/ 10" }),
      T("pain_control", "Pain Control — adequacy, analgesic plan, opioid requirement"),
      T("ponv", "Nausea and Vomiting — and treatment response"),
      S("mobility", "Mobility and Function", [
        "At baseline",
        "Reduced from baseline",
        "Unable to mobilise",
        "Not assessed",
      ]),
      T("oral_intake", "Oral Intake and Bowel Function"),
    ]),
    ...sec("Cardiovascular, Temperature & Fluids", [
      S("cardiovascular_status", "Cardiovascular Status", [
        "Stable — no intervention required",
        "Treated hypotension or arrhythmia — responding",
        "Unstable — reported to the responsible clinician",
        "Not assessed",
      ]),
      T("cardiovascular_detail", "Cardiovascular Findings — blood pressure, heart rate, rhythm, and the intervention with its effect", when("cardiovascular_status", "Treated hypotension or arrhythmia — responding", "Unstable — reported to the responsible clinician")),
      T("temperature", "Temperature — measured value and warming applied"),
      S("hydration_status", "Hydration Status", [
        "Adequate",
        "Deficient — replacement given",
        "Overloaded — managed",
        "Not assessed",
      ]),
      T("fluid_balance", "Fluid Balance — intake, output and any ongoing requirement"),
    ]),
    ...sec("Neurological & Cognitive", [
      S("nerve_injury", "New Peripheral Nerve Symptom", [
        "None identified",
        "Identified — documented and reviewed",
        "Not assessed",
      ]),
      T("nerve_assessment", "Neurological Assessment — sensation, motor power, site", when("nerve_injury", "Identified — documented and reviewed")),
      S("cognitive_screen", "Cognitive Screen (ASA January 2025 advisory for older adults)", [
        "Not applicable",
        "At or near baseline",
        "New confusion or delirium — assessed",
        "Not assessed",
      ]),
      S("awareness_recall", "Recall or Awareness Reported by the Patient", [
        "None reported",
        "Reported — documented and referred for review",
      ]),
    ]),
    ...sec("Complications Documented (ICD-11)", [
      ICD("icd11_complications", "Complications Coded With ICD-11 — where a complication occurred"),
      T("complications", "Anesthesia-Related Complications — description, timing, management and outcome"),
      S("critical_finding_escalated", "Complication Reported to the Responsible Team", [
        "Not applicable",
        "Yes — documented",
        "No",
      ]),
    ]),
    ...sec("Residual Blockade, Block Status & Disposition", [
      S("residual_blockade", "Residual Neuromuscular Blockade", [
        "Excluded — quantitative train-of-four ratio documented",
        "Excluded — clinical assessment only",
        "Present — treated and re-assessed",
        "Not indicated",
      ]),
      S("regional_block_status", "Regional or Neuraxial Block Status", [
        "Not applicable",
        "Adequate analgesia — no motor block",
        "Residual motor block — documented",
        "Resolving",
        "Complication — documented",
      ]),
      S("treatment_response", "Response to Treatment Given in Recovery", [
        "Full response — symptoms resolved",
        "Partial response — further treatment given",
        "No response — reported to the responsible clinician",
        "No treatment required",
      ]),
      S("disposition", "Disposition", [
        "Ward",
        "Day-surgery discharge",
        "High-dependency unit",
        "Intensive care unit",
        "Remains in recovery",
        "Transferred to another facility",
      ]),
      I("disposition_datetime", "Date and Time of Disposition"),
      I("responsible_clinician", "Responsible Clinician for Ongoing Care"),
    ]),
    ...sec("Patient Experience & Follow-Up", [
      S("satisfaction", "Patient Experience of the Anesthetic", [
        "Satisfied",
        "Satisfied with concerns raised",
        "Dissatisfied — concerns documented",
        "Not discussed",
      ]),
      T("patient_concerns", "Concerns Raised by the Patient"),
      T("follow_up", "Anesthetic Follow-Up Plan — who reviews what, and when"),
      T("pending_items", "Outstanding Items Before Discharge From the Anesthesia Episode"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 11. Anesthesia Follow-Up
// ---------------------------------------------------------------------------
const followup = {
  key: "anes_followup",
  label: "Anesthesia Follow-Up",
  specialty: "anesthesiology",
  notice:
    "Follow-up records how the anesthetic is affecting the patient after discharge, including persistent symptoms, recovery of function and any chronic postsurgical pain. A symptom that has not been assessed stays unrecorded. Basis: institutional follow-up protocol — no ASA standard governs this document.",
  fields: [
    ...sec("Interval Recovery", [
      I("days_since_anesthesia", "Days Since Anesthesia"),
      I("procedure_performed", "Procedure Performed"),
      S("recovery_status", "Overall Recovery", [
        "Fully recovered",
        "Recovering — improving",
        "Not improving",
        "Deteriorated",
      ]),
      T("activity", "Activity, Sleep and Appetite"),
      T("patient_satisfaction", "Patient Satisfaction and Experience"),
    ]),
    ...sec("Persistent Symptoms", [
      S("sore_throat", "Sore Throat or Voice Change", ["None", "Persistent", "Resolved"]),
      S("nausea", "Nausea or Vomiting", ["None", "Persistent", "Resolved"]),
      S("headache", "Headache — including post-dural puncture headache", ["None", "Present — documented", "Resolved"]),
      S("neurological", "Numbness, Weakness or Altered Sensation", ["None", "Present — documented", "Not assessed"]),
      S("fatigue", "Fatigue or Cognitive Change", ["None", "Present", "Not assessed"]),
      T("complications", "Complications Since Anesthesia — description and action taken"),
      ICD("icd11_complications", "Persistent Symptoms or Complications Coded With ICD-11 — where a verified code applies"),
    ]),
    ...sec("Chronic Postsurgical Pain", [
      N("pain_score", "Current Pain Score (0–10)"),
      S("pain_duration", "Pain Duration", ["Not applicable", "< 1 month", "1–3 months", "3–6 months", "> 6 months"]),
      S("pain_pattern", "Pain Pattern", [
        "Not applicable",
        "Resolving",
        "Persistent — under review",
        "Neuropathic features",
      ]),
      T("pain_management", "Pain Management — what is in place and who is responsible"),
      S("referral_pain_service", "Pain Service Input", ["Not required", "Discussed", "Referral made", "Existing"]),
    ]),
    ...sec("Patient Information", [
      T("explanation_given", "Explanation Given to the Patient"),
      T("plan", "Follow-Up Plan — what is reviewed next, and who to contact"),
      S("followup_complete", "Anesthetic Follow-Up Complete", YES_NO_UNK),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 12. Regional / Neuraxial Procedure Record
// ---------------------------------------------------------------------------
const regional = {
  key: "anes_regional_record",
  label: "Regional / Neuraxial Procedure Record",
  specialty: "anesthesiology",
  notice:
    "A regional or neuraxial technique is documented as a procedure: indication, consent, asepsis, guidance, drugs with total dose, assessment of the block, and monitoring afterwards. Where neuraxial opioids are used, monitoring follows the ASA guidance on respiratory depression (March 2016); anticoagulant timing is verified before the needle is placed. Basis: the institutional regional-anesthesia protocol together with the ASA practice guidance named above — practice guidance, not a formal ASA standard.",
  fields: [
    ...sec("Indication & Consent", [
      S("technique", "Technique", [
        "Spinal",
        "Epidural",
        "Combined spinal-epidural",
        "Peripheral nerve block",
        "Fascial plane block",
        "Intravenous regional anesthesia",
        "Other",
      ]),
      I("level", "Level / Site"),
      S("laterality", "Side / Laterality", ["Left", "Right", "Bilateral", "Midline — not applicable"]),
      T("site_detail", "Anatomical Site and Landmarks — space, approach and surface markings used"),
      T("indication", "Indication — surgical anesthesia, postoperative analgesia, both"),
      S("consent", "Consent for the Procedure", ["Documented", "Verbal — documented here", "Not documented"]),
      S("anticoagulant_verified", "Anticoagulant Timing Verified Before Needle Placement", [
        "Verified — interval adequate",
        "Not applicable — no anticoagulant",
        "Interval not adequate — technique deferred",
      ]),
      S("infection_precaution", "Asepsis", [
        "Full aseptic technique with chlorhexidine",
        "Full aseptic technique with povidone-iodine",
        "Other — documented",
      ]),
    ]),
    ...sec("Block Performance", [
      S("guidance", "Needle Guidance", [
        "Ultrasound and nerve stimulation",
        "Ultrasound",
        "Nerve stimulation",
        "Surface landmarks",
        "Fluoroscopy",
      ]),
      T("needle", "Needle and Catheter — gauge, length, catheter threaded"),
      N("attempts", "Number of Attempts / Needle Passes", { min: 0, max: 20, unit: "attempts" }),
      S("aspiration_test", "Incremental Injection With Repeated Aspiration", [
        "Yes — negative for blood and cerebrospinal fluid",
        "Blood aspirated — needle repositioned",
        "Not documented",
      ]),
      T("procedure_detail", "Procedure Detail — approach, depth, sonoanatomy, difficulties"),
    ]),
    ...sec("Local Anesthetic & Adjuvants", [
      T("drug_dose", "Local Anesthetic — agent, concentration, volume, total dose in mg"),
      T("adjuvants", "Adjuvants — opioid, clonidine, adrenaline, dexamethasone, with doses"),
      T("maximum_dose_check", "Maximum Safe Dose Calculated and Not Exceeded"),
      S("lipid_emulsion_available", "Lipid Emulsion Available in the Room", ["Yes", "No"]),
      S("resuscitation_equipment", "Resuscitation Equipment and Monitoring Present", ["Yes", "No"]),
    ]),
    ...sec("Block Outcome", [
      I("onset", "Onset Time"),
      T("block_quality", "Block Quality — sensory level or dermatomes, motor power, adequacy for the procedure"),
      S("block_success", "Block Outcome", [
        "Complete",
        "Partial — supplemented",
        "Failed — converted to another technique",
        "Not assessed",
      ]),
      T("supplementation", "Supplementation or Conversion — what was given and why"),
      T("monitoring", "Monitoring During and After the Procedure"),
    ]),
    ...sec("Aftercare & Safety", [
      T("complications", "Complications — vascular puncture, paraesthesia, dural puncture, fall, haematoma, infection"),
      ICD("icd11_complications", "Complications Coded With ICD-11 — where a verified code applies"),
      S("respiratory_monitoring", "Respiratory Monitoring Where Neuraxial Opioid Used", [
        "Not applicable",
        "Intermittent respiratory rate and sedation checks",
        "Continuous oximetry plus sedation checks",
      ]),
      T("catheter_plan", "Catheter Management and Infusion Plan"),
      T("numbness_precautions", "Numbness and Mobility Precautions Explained to the Patient"),
      T("follow_up", "Follow-Up — block review and documentation of resolution"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 13. NEW — Procedural Sedation / Monitored Anesthesia Care Record
// ---------------------------------------------------------------------------
const sedation = {
  key: "anes_procedural_sedation",
  label: "Procedural Sedation / Monitored Anesthesia Care Record",
  specialty: "anesthesiology",
  notice:
    "Procedural sedation and monitored anesthesia care are documented with their own pre-procedure evaluation, fasting precaution, monitoring and rescue capability, following the ASA Practice Guidelines for Moderate Procedural Sedation and Analgesia (March 2018) and the ASA Standards for Basic Anesthetic Monitoring (last amended 15 October 2025). Sedation deeper than intended is recorded and managed as such.",
  fields: [
    ...sec("Procedure & Patient Context", [
      I("procedure_planned", "Procedure Requiring Sedation", R),
      S("intended_depth", "Intended Sedation Depth", [
        "Minimal sedation (anxiolysis)",
        "Moderate sedation",
        "Deep sedation",
        "Monitored anesthesia care with anesthesia professional",
      ]),
      S("sedation_setting", "Setting", [
        "Operating theatre",
        "Endoscopy suite",
        "Interventional radiology",
        "Cardiology laboratory",
        "Emergency department",
        "Intensive care unit",
        "Other",
      ]),
      S("provider", "Sedation Provided By", [
        "Anesthesiologist",
        "Anesthesia care team directed by an anesthesiologist",
        "Non-anesthesia clinician credentialed for moderate sedation",
      ]),
    ]),
    ...sec("Pre-Sedation Evaluation", [
      ...asaStatusFields(),
      T("relevant_history", "Relevant History — cardiorespiratory disease, obstructive sleep apnoea, previous sedation problems"),
      ICD("icd11_conditions", "Conditions Coded With ICD-11 — those that affect sedation"),
      T("preop_examination", "Pre-Sedation Examination"),
      VIT("preop_vitals", "Vital Signs"),
      S("airway_risk", "Airway Risk Assessed", [
        "Assessed — no predictors of difficulty",
        "Assessed — predictors present, plan documented",
        "Not assessed",
      ]),
    ]),
    ...sec("Fasting & Aspiration Precaution", fastingFields()),
    ...sec("Sedation Course", [
      S("drugs_used", "Agents Used", [
        "Propofol",
        "Midazolam",
        "Fentanyl or other opioid",
        "Ketamine",
        "Dexmedetomidine",
        "Inhalational agent",
        "Combination — documented below",
      ]),
      T("drug_detail", "Agents, Doses and Times — including incremental dosing and total"),
      S("actual_depth", "Deepest Sedation Level Reached", [
        "Minimal",
        "Moderate",
        "Deep",
        "General anesthesia — converted",
      ]),
      T("course", "Sedation Course — responsiveness, airway, spontaneous ventilation maintained"),
      T("events", "Events — apnoea, desaturation, hypotension, agitation, paradoxical reaction, and the response"),
    ]),
    ...sec("Monitoring & Rescue Capability", [
      ...monitoringComplianceFields(),
      S("rescue_capability", "Rescue Capability at the Point of Care", [
        "Suction, oxygen, bag-mask and airway adjuncts immediately available",
        "Plus advanced airway equipment",
        "Plus reversal agents",
        "Plus defibrillator and emergency drugs",
        "Limited — documented",
      ]),
      S("personnel_dedicated", "Dedicated Monitoring Personnel Throughout", [
        "Yes — no competing duties",
        "No — documented",
      ]),
      S("capnography_used", "Exhaled Carbon Dioxide Monitored", [
        "Yes — continuous",
        "Yes — during deep sedation only",
        "Not used",
      ]),
    ]),
    ...sec("Recovery & Discharge", [
      N("pain_score", "Pain Score (0–10)", { min: 0, max: 10, unit: "/ 10" }),
      T("recovery_course", "Recovery Course — return to baseline responsiveness and ventilation"),
      S("discharge_criteria", "Discharge Criteria Met", [
        "Met — against institutional criteria",
        "Not met — remains under observation",
        "Pending",
      ]),
      S("escort", "Escort and Transport Arranged", ["Yes — responsible adult", "No", "Not applicable"]),
      T("instructions", "Instructions Given — no driving, no operating machinery, responsible adult present"),
      S("adverse_outcome", "Adverse Outcome", ["None", "Yes — documented and reviewed"]),
      T("follow_up", "Follow-Up and Reporting — who reviews the patient and any incident reported"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 14. NEW — Obstetric Anesthesia Record
// ---------------------------------------------------------------------------
const obstetric = {
  key: "anes_obstetric",
  label: "Obstetric Anesthesia Record",
  specialty: "anesthesiology",
  notice:
    "Obstetric anesthesia documentation covers the mother and the fetus: obstetric context, the neuraxial or general technique, maternal haemodynamic targets until delivery, block assessment, neonatal condition, and monitoring after the block. Basis: ASA Practice Guidelines for Obstetric Anesthesia (February 2016), the ASA Statement on Neuraxial Anesthesia in Obstetrics, the ASA Statement on Antenatal Anesthesiology Consultation (October 2025) and the ASA guidance on respiratory depression with neuraxial opioids (March 2016).",
  fields: [
    ...sec("Maternal & Obstetric Context", [
      I("gestational_age", "Gestational Age"),
      I("gravida_para", "Gravida / Para"),
      S("indication", "Indication for Anesthesia Care", [
        "Labor analgesia",
        "Cesarean delivery — elective",
        "Cesarean delivery — emergency",
        "Instrumental delivery",
        "Manual removal of placenta",
        "Postpartum haemorrhage",
        "Retained products or evacuation",
        "External cephalic version",
        "Postpartum sterilization",
        "Other — documented",
      ]),
      S("labor_stage", "Labor Stage at Request", ["Not in labor", "First stage", "Second stage", "Third stage"]),
      T("antenatal_consultation", "Antenatal Anesthesiology Consultation and Plan"),
      ICD("icd11_maternal_conditions", "Maternal Conditions Coded With ICD-11 — those affecting anesthesia"),
      S("asa_class", "ASA Physical Status Class", ASA_CLASSES),
      T("asa_class_basis", "Basis for the Assigned Class"),
      T("aspiration_prophylaxis", "Aspiration Prophylaxis Given — non-particulate antacid, H2 blocker, prokinetic"),
      S("fetal_status", "Fetal Status Before the Technique", [
        "Reassuring",
        "Non-reassuring — discussed with the obstetric team",
        "Not assessed",
      ]),
    ]),
    ...sec("Neuraxial Technique", [
      S("technique", "Technique", [
        "Epidural — labor analgesia",
        "Combined spinal-epidural",
        "Spinal for cesarean delivery",
        "Epidural top-up for cesarean delivery",
        "General anesthesia",
        "Other — documented",
      ]),
      I("level", "Interspace Used"),
      T("drug_dose", "Local Anesthetic and Adjuvants — agent, concentration, volume, dose"),
      T("catheter", "Catheter Placement and Test Dose"),
      S("block_assessment", "Block Assessed Before Surgery", [
        "Adequate bilateral block — level documented",
        "Incomplete — supplemented",
        "Failed — converted to general anesthesia",
        "Not applicable",
      ]),
      T("block_level", "Sensory Level Achieved"),
      S("anticoagulant_verified", "Anticoagulant Timing Verified Before Neuraxial Technique", [
        "Verified — interval adequate",
        "Not applicable",
        "Interval not adequate — technique deferred",
      ]),
      S("difficult_airway_planned", "Airway Plan Where General Anesthesia May Be Needed", [
        "Assessed — no predictors",
        "Assessed — difficult airway plan documented",
        "Not assessed",
      ]),
    ]),
    ...sec("Maternal Course & Safety", [
      T("maternal_monitoring", "Maternal Monitoring — blood pressure, heart rate, oxygen saturation, level of block"),
      T("haemodynamic_intervention", "Haemodynamic Intervention — vasopressor, fluid, timing"),
      S("maternal_bp_target", "Maternal Blood Pressure Maintained Until Delivery", [
        "Within 90% of baseline",
        "Below 90% of baseline — treated and documented",
        "Not documented",
      ]),
      T("events", "Events — high block, hypotension, bradycardia, intravascular injection, dural puncture, failure"),
      T("conversion", "Conversion or Supplementation — reason and agents used"),
      N("estimated_blood_loss", "Estimated Blood Loss"),
      S("uterine_tone_management", "Uterotonic Therapy Administered by the Obstetric Team", [
        "Given — documented in the obstetric record",
        "Not given",
        "Not applicable",
      ]),
    ]),
    ...sec("Delivery & Neonatal Condition", [
      I("delivery_time", "Time of Delivery"),
      S("delivery_mode", "Mode of Delivery", [
        "Spontaneous vaginal",
        "Instrumental",
        "Cesarean — category 1",
        "Cesarean — category 2",
        "Cesarean — category 3",
        "Cesarean — category 4",
      ]),
      T("neonatal_condition", "Neonatal Condition — Apgar scores, resuscitation required, cord gases"),
      T("neonatal_team", "Neonatal Team Present"),
    ]),
    ...sec("After Neuraxial Block", [
      S("respiratory_monitoring", "Respiratory Monitoring After Neuraxial Opioid", [
        "Intermittent respiratory rate and sedation checks",
        "Continuous pulse oximetry plus sedation checks",
        "Not applicable — no neuraxial opioid",
      ]),
      T("post_block_review", "Post-Block Review — sensory and motor recovery, catheter removal, neurological observations"),
      T("complications", "Complications — post-dural puncture headache, neurological symptoms, infection, haematoma"),
      T("follow_up", "Follow-Up and Documentation — who reviews the mother and when"),
      S("incident_reported", "Incident Reported Where an Adverse Event Occurred", ["Not applicable", "Yes", "No"]),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 15. NEW — Pediatric Anesthesia Record
// ---------------------------------------------------------------------------
const pediatric = {
  key: "anes_pediatric",
  label: "Pediatric Anesthesia Record",
  specialty: "anesthesiology",
  notice:
    "Pediatric documentation records the child's age and weight, the fasting intervals actually applied (ASA Practice Guidelines for Preoperative Fasting, February 2017, and the February 2023 update on carbohydrate-containing clear liquids, chewing gum and pediatric fasting duration), weight-based dosing, temperature management and recovery with a parent present. Doses are documented as given and calculated against the recorded weight.",
  fields: [
    ...sec("Pediatric Context", [
      I("age", "Age", R),
      N("weight_kg", "Weight (kg)", { required: true, min: 0.5, max: 300, unit: "kg" }),
      N("height_cm", "Height (cm)", { min: 20, max: 250, unit: "cm" }),
      S("asa_class", "ASA Physical Status Class", ASA_CLASSES),
      T("asa_class_basis", "Basis for the Assigned Class"),
      S("prematurity", "Prematurity / Former Preterm History", [
        "Not applicable — born at term",
        "Former preterm — apnoea risk documented",
        "Unknown",
      ]),
      S("apnoea_risk_plan", "Postoperative Apnoea Monitoring Plan", [
        "Not required",
        "Extended monitoring planned",
        "Admission for overnight monitoring planned",
      ]),
      T("relevant_history", "Relevant History — congenital disease, syndromes, previous anesthesia, airway problems"),
      ICD("icd11_conditions", "Conditions Coded With ICD-11 — those affecting this anesthetic"),
      S("guardian_consent", "Guardian Consent and Identity Confirmed", ["Yes", "Partially", "No"]),
    ]),
    ...sec("Fasting & Premedication", [
      S("fasting_clear_liquids", "Clear Liquids Withheld", FASTING_RECORDED),
      S("fasting_breast_milk", "Breast Milk Withheld", FASTING_RECORDED),
      S("fasting_formula", "Infant Formula or Non-human Milk Withheld", FASTING_RECORDED),
      S("fasting_solids", "Solids or Light Meal Withheld", FASTING_RECORDED),
      T("fasting_note", "Fasting Note — interval applied and any institutional variance"),
      S("premedication", "Premedication", ["None", "Anxiolysis", "Analgesia", "Antiemetic", "Other — documented"]),
      T("premedication_detail", "Premedication Given and Route"),
      S("parent_presence_induction", "Parent Present at Induction", YES_NO_UNK),
    ]),
    ...sec("Induction & Airway", [
      S("induction_technique", "Induction Technique", [
        "Inhalational",
        "Intravenous",
        "Intramuscular",
        "Sedation-assisted",
        "Not applicable — regional",
      ]),
      T("induction_detail", "Induction Agents and Doses — weight-based"),
      S("airway_device", "Airway Device", AIRWAY_DEVICES),
      T("device_size", "Device Size — tube internal diameter, supraglottic size, blade"),
      N("attempts", "Number of Attempts", { min: 0, max: 10, unit: "attempts" }),
      S("airway_difficulty", "Airway Difficulty Encountered", ["None", "Yes — documented"]),
      T("ventilation", "Ventilation and Respiratory Support"),
    ]),
    ...sec("Weight-Based Dosing & Fluids", [
      T("maintenance_agents", "Maintenance Agents and End-tidal Concentrations"),
      T("analgesia_regimen", "Analgesia Regimen — including regional or local techniques"),
      T("fluids", "Fluids — type, rate and total, calculated against weight"),
      T("blood_products", "Blood Products — where required, with volume"),
      N("blood_loss", "Estimated Blood Loss (mL/kg or total)"),
      T("glucose", "Glucose and Electrolyte Management"),
    ]),
    ...sec("Thermoregulation & Safety", [
      T("temperature", "Temperature Course and Warming Method"),
      S("fluid_warming", "Fluid and Blood Warming Used", YES_NO),
      T("pressure_area_protection", "Pressure Area and Eye Protection"),
      T("monitoring", "Monitoring in Use — adapted to size and procedure"),
      T("events", "Events — laryngospasm, desaturation, bradycardia, difficult access"),
    ]),
    ...sec("Emergence & Recovery", [
      S("emergence_quality", "Emergence", [
        "Calm and uneventful",
        "Agitated or delirious — managed",
        "Prolonged",
      ]),
      T("airway_at_transfer", "Airway Status at Transfer"),
      T("pain_plan", "Analgesia Plan and Pain Scores in Recovery"),
      S("ponv", "Nausea or Vomiting in Recovery", ["None", "Treated", "Persistent"]),
      T("parent_reunited", "Parent Reunited and Comfort Measures"),
      S("discharge_criteria", "Discharge Criteria Met", ["Met", "Not met", "Pending"]),
      T("instructions", "Instructions Given to the Guardian"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 16. NEW — Emergency & Trauma Anesthesia Record
// ---------------------------------------------------------------------------
const trauma = {
  key: "anes_emergency_trauma",
  label: "Emergency & Trauma Anesthesia Record",
  specialty: "anesthesiology",
  notice:
    "Emergency and trauma anesthesia records the resuscitation context alongside the anesthetic: injury pattern, haemodynamic state, airway and cervical-spine precautions, blood product strategy and the damage-control plan. An emergency procedure carries the E modifier next to the ASA Physical Status class; it does not change the class itself. Basis: the ASA practice guidelines and advisories named above, applied with the institutional trauma and massive-transfusion protocols — practice guidance, not formal standards.",
  fields: [
    ...sec("Injury & Resuscitation Context", [
      T("mechanism", "Mechanism of Injury or Reason for Emergency Surgery", R),
      T("injuries", "Injuries Identified"),
      S("urgency", "Urgency", [
        "Immediate — resuscitation room to theatre",
        "Emergency — within hours",
        "Urgent — expedited",
      ]),
      S("haemodynamic_state", "Haemodynamic State at Induction", [
        "Stable",
        "Responder to fluids",
        "Transient responder",
        "Non-responder — active haemorrhage",
      ]),
      S("shock_index", "Shock Index / Perfusion Assessment", [
        "Normal",
        "Abnormal — documented below",
        "Not documented",
      ]),
      T("resuscitation_to_date", "Resuscitation Before Anesthesia — fluids, blood products, drugs, procedures"),
      S("asa_class", "ASA Physical Status Class", ASA_CLASSES),
      S("asa_emergency", "Emergency Modifier", ASA_EMERGENCY),
      T("asa_class_basis", "Basis for the Assigned Class", R),
    ]),
    ...sec("Airway & Cervical Spine", [
      S("cervical_spine", "Cervical Spine Precaution", [
        "Manual in-line stabilisation",
        "Rigid collar in place",
        "Cleared clinically",
        "Imaging cleared",
      ]),
      S("airway_approach", "Airway Approach", [
        "Rapid sequence induction",
        "Awake or sedation-assisted intubation",
        "Surgical airway",
        "Supraglottic rescue then definitive airway",
        "Mask or spontaneous breathing — documented reason",
      ]),
      T("airway_detail", "Airway Detail — preoxygenation, drugs, device, attempts, grade"),
      S("aspiration_precaution", "Aspiration Precaution Applied", [
        "Rapid sequence with cricoid pressure",
        "Rapid sequence without cricoid pressure",
        "Not applied — documented reason",
      ]),
      S("airway_difficulty", "Airway Difficulty", ["None", "Yes — documented"]),
    ]),
    ...sec("Damage Control & Blood Products", [
      S("massive_transfusion", "Massive Transfusion Protocol", [
        "Not activated",
        "Activated — time recorded",
        "Standby only",
      ]),
      T("blood_products", "Blood Products Given — red cells, plasma, platelets, cryoprecipitate, and ratio"),
      T("blood_products_ordered", "Products Requested and Availability"),
      T("coagulation", "Coagulation and Calcium Management — tests, agents, response"),
      T("fluids", "Crystalloid and Colloid Given"),
      S("cell_salvage", "Cell Salvage Used", ["No", "Yes", "Not available"]),
      T("correction", "Correction of Hypothermia, Acidosis and Electrolytes"),
      S("damage_control_approach", "Surgical Strategy Agreed", [
        "Damage-control surgery planned",
        "Definitive surgery",
        "Not documented",
      ]),
      S("icu_bed", "Critical Care Bed", ["Confirmed", "Requested — not confirmed", "Not required"]),
    ]),
    ...sec("Course & Events", [
      T("monitoring", "Monitoring Established — and what could not be established"),
      T("vitals", "Vital Signs Course"),
      T("vasoactive_support", "Vasoactive Support — agents and doses"),
      T("events", "Critical Events — cardiac arrest, major haemorrhage, desaturation, and the response"),
      T("procedures", "Additional Procedures Performed"),
      S("outcome_at_end", "Situation at End of Anesthesia", [
        "Stable — transferred intubated",
        "Stable — extubated",
        "Unstable — critical care",
        "Deceased in theatre",
      ]),
    ]),
    ...sec("Complications Documented (ICD-11)", [
      ICD("icd11_complications", "Complications Coded With ICD-11 — where a complication occurred"),
      T("complications", "Complications and Adverse Events — description, management, outcome"),
      S("incident_reported", "Incident or Mortality Review Referred", ["Not applicable", "Yes", "No"]),
    ]),
    ...sec("Transfer & Communication", [
      T("handover", "Structured Handover to Critical Care or Ward"),
      T("family_communication", "Communication With the Family or Next of Kin"),
      T("follow_up", "Follow-Up Review Planned"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 17. NEW — Anesthesia Critical Incident & Complication Report
// ---------------------------------------------------------------------------
const incident = {
  key: "anes_complication",
  label: "Anesthesia Critical Incident & Complication Report",
  specialty: "anesthesiology",
  notice:
    "An incident is documented factually: what happened, when it was recognised, what was done, the outcome, who was informed, and what has been changed. Analysis follows the ASA Statement on Adverse Event Analysis (October 2025) and is separated from the clinical narrative. A complication is coded with ICD-11 only where a verified code applies.",
  fields: [
    ...sec("Event Identification", [
      S("event_type", "Type of Event", [
        "Airway — difficult or failed intubation",
        "Airway — cannot intubate, cannot oxygenate",
        "Aspiration",
        "Anaphylaxis or suspected allergy",
        "Local anesthetic systemic toxicity",
        "Cardiac arrest",
        "Severe hypotension or arrhythmia",
        "Awareness or recall",
        "Nerve injury",
        "Positional or pressure injury",
        "Dental or airway trauma",
        "Medication error",
        "Equipment failure",
        "Transfusion reaction",
        "Unexpected critical care admission",
        "Death",
        "Other — documented",
      ], R),
      S("phase", "Phase of Care", [
        "Pre-anesthesia assessment",
        "Induction",
        "Maintenance",
        "Emergence",
        "Recovery",
        "Postoperative ward care",
        "Follow-up",
      ]),
      I("event_datetime", "Date and Time of the Event"),
      I("recognition_datetime", "Date and Time Recognised"),
      T("description", "What Happened — factual sequence, no interpretation", R),
      S("severity", "Severity", [
        "Near miss — no harm",
        "Temporary harm — resolved",
        "Temporary harm — ongoing",
        "Permanent harm",
        "Death",
      ]),
      S("detected_by", "Detected By", [
        "Anesthesia team",
        "Surgical team",
        "Recovery staff",
        "Ward staff",
        "Monitoring alarm",
        "Patient report",
        "Other",
      ]),
    ]),
    ...sec("Immediate Management", [
      T("immediate_management", "Immediate Management — sequence and timing of interventions", R),
      T("team_response", "Team Called and Roles — who attended, when"),
      T("drugs_given", "Drugs and Doses Given in Response"),
      T("airway_management", "Airway or Ventilatory Rescue Performed"),
      S("escalation", "Who Was Called", [
        "Anesthesiologist in charge informed",
        "Critical care outreach activated",
        "Cardiac arrest team activated",
        "Surgical team informed",
        "No escalation required",
      ]),
      S("outcome", "Immediate Outcome", [
        "Full recovery",
        "Recovered with ongoing treatment",
        "Ongoing harm under treatment",
        "Permanent harm",
        "Death",
      ]),
    ]),
    ...sec("Complications Documented (ICD-11)", [
      ICD("icd11_complications", "Complication Coded With ICD-11 — where a verified code applies"),
      T("clinical_consequence", "Clinical Consequence — what the patient now has, and the plan"),
      T("ongoing_care", "Ongoing Care — critical care, specialty input, rehabilitation"),
    ]),
    ...sec("Notification & Disclosure", [
      S("patient_informed", "Patient or Family Informed", [
        "Yes — by the responsible clinician",
        "Yes — with the surgical team",
        "Not yet — plan documented",
        "Not applicable",
      ]),
      T("disclosure_detail", "What Was Explained, By Whom and When"),
      S("incident_system_reported", "Reported Through the Institutional Incident System", [
        "Yes — reference recorded",
        "Not yet",
        "Not applicable",
      ]),
      S("mortality_review", "Mortality or Morbidity Review", [
        "Not applicable",
        "Referred",
        "Scheduled",
      ]),
      T("responsible_clinicians", "Clinicians Involved and Responsible for Follow-Up"),
    ]),
    ...sec("Analysis & Prevention", [
      T("contributing_factors", "Contributing Factors — patient, task, team, equipment, environment, organisation"),
      T("what_went_well", "What Worked Well in Detection and Rescue"),
      T("actions_agreed", "Actions Agreed — with owner and deadline"),
      T("debrief", "Team Debrief — held with whom, and the learning shared"),
      S("practice_change", "Practice Change Implemented", [
        "None required",
        "Protocol or checklist amended",
        "Equipment or stocking changed",
        "Training delivered",
        "Multiple changes — documented",
      ]),
      T("follow_up", "Follow-Up — review of the patient and of the agreed actions"),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// 18. NEW — Anesthesia Transfer of Care (Handover)
// ---------------------------------------------------------------------------
const handoverDoc = {
  key: "anes_handover",
  label: "Anesthesia Transfer of Care (Handover)",
  specialty: "anesthesiology",
  notice:
    "A transfer of anesthesia care is documented as a handover: identity verification, what was done, what could still go wrong, and explicit acknowledgement by the receiving clinician. The receiving team's read-back is recorded, so responsibility for the patient is never assumed silently. Basis: institutional transfer-of-care protocol — no ASA standard prescribes handover content.",
  fields: [
    ...sec("Transfer Details", [
      S("direction", "Transfer", [
        "Theatre to recovery",
        "Recovery to ward",
        "Ward to intensive care",
        "Theatre to intensive care",
        "Between anesthetists during a case",
        "Intensive care to theatre",
      ]),
      S("identity_verified", "Patient Identity Verified With Two Identifiers", YES_NO),
      T("identity_detail", "Identifiers Used — name, CIN, date of birth, wristband"),
      I("handover_datetime", "Date and Time of Handover"),
      T("from_clinician", "Handing Over — clinician and role"),
      T("to_clinician", "Receiving — clinician and role"),
    ]),
    ...sec("What Was Done", [
      T("procedure", "Procedure Performed and Its Course"),
      S("technique", "Anesthetic Technique Used", TECHNIQUES),
      S("airway_status", "Airway at Handover", [
        "Self-ventilating, no device",
        "Supraglottic device removed",
        "Endotracheal tube removed",
        "Intubated and ventilated",
        "Tracheostomy",
        "Surgical airway",
      ]),
      T("airway_detail", "Airway Detail — difficulty, attempts, injuries, plan for removal"),
      T("vascular_access", "Vascular Access and Lines"),
      T("drugs_given", "Drugs and Reversal Given — including long-acting agents"),
      T("fluids_blood", "Fluids and Blood Products Given"),
      T("regional_blocks", "Regional or Neuraxial Blocks — site, drug, expected duration, aftercare"),
      T("blood_loss", "Estimated Blood Loss and Urine Output"),
    ]),
    ...sec("Current Status", [
      VIT("vitals", "Vital Signs at Handover"),
      T("haemodynamics", "Haemodynamic Support — vasoactive agents and doses"),
      S("respiratory_support", "Respiratory Support", [
        "Room air",
        "Low-flow oxygen",
        "High-flow oxygen",
        "Non-invasive ventilation",
        "Mechanical ventilation",
      ]),
      N("pain_score", "Pain Score (0–10)", { min: 0, max: 10, unit: "/ 10" }),
      T("analgesia_plan", "Analgesia Plan — what has been given and what is prescribed for the next hours"),
      S("ponv_prophylaxis", "Postoperative Nausea and Vomiting Prophylaxis Given", [
        "One agent",
        "Two or more agents",
        "None",
      ]),
      T("drains_monitoring", "Drains, Catheters and Monitoring in Place — with limits"),
    ]),
    ...sec("Ongoing Risks & Pending Issues", [
      T("risks", "What Could Still Go Wrong — and the specific trigger to call for help"),
      T("allergies_anticoagulation", "Allergy Status and Anticoagulation Plan"),
      T("pending_results", "Results or Items Pending — and who acts on them"),
      S("resuscitation_status", "Resuscitation Status Documented", [
        "For full resuscitation",
        "Limits of treatment documented",
        "Not documented",
      ]),
      T("escalation_plan", "When to Call for Help — who, and at what trigger"),
    ]),
    ...sec("Receiver Acknowledgement", [
      S("read_back", "Receiver Read-Back of Key Points", YES_NO_UNK),
      T("questions_asked", "Questions Asked and Clarified"),
      S("responsibility_transferred", "Responsibility Transferred and Accepted", [
        "Accepted",
        "Accepted with conditions — documented",
        "Not accepted — escalated",
      ]),
      T("notes", "Additional Notes"),
    ]),
  ],
};

export const ANESTHESIA_DOCS = [
  preAssessment,
  consultation,
  plan,
  consent,
  airway,
  intraop,
  medication,
  monitoring,
  pacu,
  postEvaluation,
  followup,
  regional,
  sedation,
  obstetric,
  pediatric,
  trauma,
  incident,
  handoverDoc,
];