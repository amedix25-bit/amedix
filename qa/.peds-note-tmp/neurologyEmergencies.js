// Neurology — emergency recognition and urgent pathway layer.
//
// WHAT THIS FILE IS
// The fifteen neurological emergencies the clinical team asked to have documented
// rather than described: acute ischaemic stroke, intracranial haemorrhage,
// suspected subarachnoid haemorrhage, transient ischaemic attack, status
// epilepticus, prolonged or recurrent seizures without recovery, acute altered
// consciousness, meningitis, encephalitis, raised intracranial pressure,
// impending brain herniation, acute spinal cord compression, cauda equina
// syndrome, Guillain-Barré syndrome with respiratory or autonomic compromise, and
// myasthenic crisis.
//
// WHAT IT DOES NOT DO
// It does not diagnose. It does not order treatment. It does not initiate or
// authorise thrombolysis, thrombectomy, antiseizure medicine or any other
// emergency intervention. Every presentation records what the clinician found,
// who was told and when, what decision a qualified clinician recorded, and where
// the patient went. Documentation is written after the clinical action it
// describes — no field here may delay treatment.

import { NEURO_REFERENCES } from "./neurologyReferences.js";

export const NEURO_EMERGENCY_STATE_KEY = "neuro_emergency";

export const NEURO_EMERGENCY_LEVELS = {
  immediate: {
    label: "Immediate — time-critical",
    order: 0,
    chip: "bg-destructive/10 text-destructive",
  },
  emergency: {
    label: "Emergency — same hour",
    order: 1,
    chip: "bg-warning/10 text-warning",
  },
  urgent: {
    label: "Urgent — same day",
    order: 2,
    chip: "bg-info/10 text-info",
  },
};

export const NEURO_EMERGENCY_NOTICE =
  "Recognition and urgent-pathway record only. It does not diagnose, does not order treatment and does not authorise thrombolysis, thrombectomy, antiseizure medicine or any other emergency intervention — those require assessment and a recorded decision by a qualified clinician. Record after you act: nothing in this panel may delay treatment.";

const opt = (key, label, options) => ({ key, label, type: "select", options });
const txt = (key, label) => ({ key, label, type: "textarea" });
const inp = (key, label, placeholder) => ({ key, label, type: "input", placeholder });

// ---- Shared urgent-pathway record ----------------------------------------
export const NEURO_PATHWAY_FIELDS = [
  inp("who_informed", "Senior clinician or team informed", "Name and role — on-call neurologist, stroke team, neurosurgeon, intensivist"),
  inp("time_informed", "Time informed", "HH:MM"),
  opt("route", "Route used", [
    "Local stroke pathway activated",
    "Emergency team / medical emergency call",
    "Critical care referral",
    "Neurosurgical referral",
    "Neuroradiology / interventional referral",
    "Spinal surgical referral",
    "Infection team informed",
    "Transfer to another facility arranged",
    "No route activated — reason documented",
    "Not documented",
  ]),
  inp("destination", "Destination and time", "e.g. CT 21:10, ICU 22:05, transferred 23:40"),
  opt("capability", "Capability of this unit", [
    "Definitive care available here",
    "Requires transfer — arranged",
    "Requires transfer — awaiting acceptance",
    "Not assessed",
  ]),
  txt("decision", "Decision recorded, by whom and on what basis"),
  txt("response", "Documented response to the action taken"),
];

// ---- Presentations -------------------------------------------------------
export const NEURO_EMERGENCY_PRESENTATIONS = [
  {
    key: "acute_ischaemic_stroke",
    label: "Acute ischaemic stroke",
    level: "immediate",
    provenance: "guideline",
    references: ["aha_ais_2019"],
    why:
      "Reperfusion eligibility is decided from a small number of facts — the time last known well, the examination, the glucose, the anticoagulant state, the scan and the vessel — and every one of them stops being recoverable once the window has passed.",
    recognition: [
      "Sudden focal neurological deficit with a documented time last known well",
      "Deficit still present at assessment, with a documented vascular territory",
      "Posterior circulation features — diplopia, dysarthria, ataxia, crossed signs — even without weakness",
      "Deficit in a patient who woke with symptoms, where the time last known well is the time last seen well",
    ],
    timeCritical:
      "The time last known well is not reconstructed later: it is written when the patient arrives. Imaging and reperfusion assessment proceed in parallel with this record, never after it.",
    pathway:
      "Activate the local stroke pathway at first recognition and inform the stroke team by name and time. Whether reperfusion is offered is a decision for the qualified clinician assessing the patient, recorded with the reason.",
    fields: [
      inp("lkw", "Time last known well", "HH:MM — the time last seen at baseline"),
      inp("discovery_time", "Time symptoms discovered", "HH:MM — when the patient was found"),
      opt("nihss_state", "NIHSS", [
        "Performed — score recorded in this note",
        "Not performed — reason documented",
        "Not applicable — deficit resolved before assessment",
      ]),
      opt("glucose_result", "Blood glucose", ["Measured — value recorded in this note", "Not measured", "Documented elsewhere"]),
      opt("anticoagulant", "Anticoagulant status", [
        "Not an anticoagulant",
        "Anticoagulant — last dose and agent recorded",
        "Anticoagulant — dose or timing not known",
        "Not documented",
      ]),
      opt("imaging_state", "Brain imaging", [
        "Performed — finding recorded",
        "Performed — haemorrhage excluded, finding recorded",
        "Not yet performed",
        "Not documented",
      ]),
      opt("vessel_state", "Vascular assessment", [
        "Vessel imaging performed — result recorded",
        "Vessel imaging not performed — reason documented",
        "Not documented",
      ]),
      opt("reperfusion", "Reperfusion assessment", [
        "Assessed — treatment given, decision-maker recorded",
        "Assessed — not given, reason documented",
        "Not assessed — outside window, reason documented",
        "Not documented",
      ]),
    ],
    requires: ["lkw", "glucose_result", "imaging_state"],
    note:
      "A normal glucose and an excluded haemorrhage are recorded as facts with results, not as reassurance. No score here decides treatment.",
  },
  {
    key: "intracranial_haemorrhage",
    label: "Intracranial haemorrhage",
    level: "immediate",
    provenance: "guideline",
    references: ["aha_ich_2022"],
    why:
      "Outcome depends on recognising the bleed, recording the anticoagulant or antiplatelet exposure, controlling blood pressure and getting a neurosurgical view — all in the first hours.",
    recognition: [
      "Sudden headache with vomiting, focal deficit or reduced consciousness",
      "Deterioration after a minor head injury, especially on an anticoagulant",
      "Blood on imaging within the brain parenchyma, ventricles or subdural space",
      "New focal deficit in a patient taking an anticoagulant or antiplatelet",
    ],
    timeCritical:
      "The scan time, the finding and the anticoagulant status are recorded together. Any reversal or blood-pressure decision is a clinician decision and is recorded with who made it.",
    pathway:
      "Inform the on-call neurologist or neurosurgeon and the intensivist by name and time. Where reversal of an anticoagulant is being considered it is recorded as a decision with its authorisation.",
    fields: [
      inp("scan_time", "Imaging time and finding", "e.g. CT 20:40 — right basal ganglia haemorrhage"),
      opt("antithrombotic", "Antithrombotic exposure", [
        "None",
        "Anticoagulant — agent, dose and last dose recorded",
        "Antiplatelet — agent and last dose recorded",
        "Both",
        "Not documented",
      ]),
      opt("reversal", "Reversal considered", [
        "Not applicable — no antithrombotic",
        "Considered — decision and authorisation recorded",
        "Not considered — reason documented",
        "Not documented",
      ]),
      opt("bp", "Blood pressure management recorded", [
        "Target and treatment recorded by the treating clinician",
        "Not treated — reason documented",
        "Not documented",
      ]),
      inp("neurosurgery", "Neurosurgical opinion — who and when"),
      opt("gcs_trend", "Consciousness trend", ["Stable", "Deteriorating — times documented", "Improving", "Not documented"]),
    ],
    requires: ["scan_time", "antithrombotic"],
  },
  {
    key: "subarachnoid_haemorrhage",
    label: "Suspected subarachnoid haemorrhage",
    level: "immediate",
    provenance: "guideline",
    references: ["aha_sah_2023"],
    why:
      "A thunderclap headache is a subarachnoid haemorrhage until imaging and, where needed, cerebrospinal fluid examination say otherwise; a re-bleed before treatment carries a high mortality.",
    recognition: [
      "Sudden severe headache reaching maximum intensity within seconds to a minute",
      "Headache with neck stiffness, photophobia, vomiting or syncope",
      "Headache on exertion, straining or sexual activity",
      "Sentinel headache in the preceding days or weeks",
    ],
    timeCritical:
      "The time of headache onset is recorded because it determines how the imaging is interpreted. A normal scan does not close the question on its own, and the reason for the next step is written down.",
    pathway:
      "Inform the on-call neurologist or neurosurgeon by name and time and arrange the pathway the institution uses for suspected subarachnoid haemorrhage; the route and destination are recorded.",
    fields: [
      inp("onset_time", "Time of headache onset", "HH:MM — and the seconds-to-peak description"),
      opt("onset_character", "Onset", ["Thunderclap — maximum within one minute", "Rapid but not thunderclap", "Progressive", "Not documented"]),
      inp("ct_time", "CT performed — time and finding", "e.g. CT 21:30, no blood seen"),
      opt("lp", "Cerebrospinal fluid examination", [
        "Performed — result recorded",
        "Not performed — imaging timing or clinical reasoning documented",
        "Planned",
        "Not documented",
      ]),
      opt("vascular", "Vascular imaging", ["Performed — result recorded", "Planned", "Not performed — reason documented", "Not documented"]),
      inp("grading", "Documented clinical grade", "WFNS or Hunt and Hess grade as recorded by the treating team"),
    ],
    requires: ["onset_time", "ct_time"],
  },
  {
    key: "tia",
    label: "Transient ischaemic attack",
    level: "urgent",
    provenance: "guideline",
    references: ["aha_secondary_prevention_2021"],
    why:
      "A resolved deficit still carries a high early risk of stroke, and the work that lowers it — vascular imaging, cardiac rhythm, and the reason for the event — is decided in the days that follow, not at the next routine visit.",
    recognition: [
      "Focal deficit that resolved completely, with a documented time of onset and resolution",
      "Transient monocular visual loss",
      "Transient speech or language disturbance",
      "Transient brainstem symptoms — diplopia, dysarthria, ataxia, drop attack",
    ],
    timeCritical:
      "The time the deficit resolved is recorded with the same care as its onset. A resolved deficit is not recorded as a normal examination: the deficit is documented as it was observed or described.",
    pathway:
      "Refer on the institution's urgent pathway for transient ischaemic attack and record who accepted the referral and when; the vascular and cardiac workup started is recorded with its result.",
    fields: [
      inp("onset_resolution", "Onset and resolution times", "HH:MM onset — HH:MM resolved"),
      txt("deficit", "Deficit as observed or described", "What was seen, by whom, and for how long"),
      opt("vascular", "Vascular imaging", ["Performed — result recorded", "Requested", "Not performed — reason documented", "Not documented"]),
      opt("cardiac", "Cardiac rhythm assessment", ["ECG in sinus rhythm", "Atrial fibrillation documented", "Monitoring arranged", "Not documented"]),
      opt("score", "Risk score", ["ABCD2 documented in this note", "Not calculated — reason documented", "Not documented"]),
      txt("secondary_prevention", "Secondary prevention recorded", "What was started, changed or continued, and by whom"),
    ],
    requires: ["onset_resolution", "deficit"],
  },
  {
    key: "status_epilepticus",
    label: "Status epilepticus",
    level: "immediate",
    provenance: "guideline",
    references: ["ilae_status_2015"],
    why:
      "Convulsive status epilepticus is a time-defined emergency: treatment is staged by time, and the airway, oxygenation, glucose and temperature are corrected while the antiseizure medicines are given.",
    recognition: [
      "Convulsive seizure lasting five minutes or more",
      "Repeated seizures without recovery of consciousness between them",
      "Non-convulsive status in a patient who does not recover as expected after a convulsion",
      "Ongoing seizure activity at the time of assessment",
    ],
    timeCritical:
      "The time last known seizing is recorded at the bedside. Treatment is not delayed to complete this record — the times of the medicines are written as they are given.",
    pathway:
      "Call for senior help and critical care support at first recognition and record who was called and at what time. Escalation to critical care is a clinician decision and is recorded with its authorisation.",
    fields: [
      inp("last_seizing", "Time last known seizing or at baseline", "HH:MM"),
      opt("airway", "Airway and breathing", ["Patent, self-ventilating", "Airway adjunct inserted", "Bag-valve-mask ventilation", "Intubated", "Not documented"]),
      inp("oxygenation", "Oxygenation recorded", "SpO2 and oxygen delivery, with time"),
      inp("circulation", "Circulation recorded", "Blood pressure, pulse, IV access"),
      inp("glucose", "Blood glucose", "Value and time"),
      inp("first_line", "First-line medicine — agent and time", "e.g. lorazepam 4 mg IV 20:12"),
      inp("second_line", "Second-line medicine — agent and time", "e.g. levetiracetam 60 mg/kg 20:35"),
      opt("response", "Documented response", ["Seizure stopped", "Continued — refractory stage recorded", "Recurred — times recorded", "Not documented"]),
      opt("eeg", "EEG", ["Performed — finding recorded", "Requested", "Not available — reason documented", "Not documented"]),
      inp("level_of_care", "Level of care and destination", "Ward, HDU, ICU — with the time of transfer"),
    ],
    requires: ["last_seizing", "airway", "glucose", "first_line"],
  },
  {
    key: "prolonged_recurrent_seizures",
    label: "Prolonged or recurrent seizures without recovery",
    level: "immediate",
    provenance: "guideline",
    references: ["ilae_status_2015"],
    why:
      "Repeated seizures with incomplete recovery between them are treated as evolving status epilepticus, even when no single event has lasted five minutes.",
    recognition: [
      "Two or more seizures with incomplete recovery of consciousness between them",
      "A seizure that has lasted longer than the patient's usual events",
      "Increasing frequency over hours with a declining baseline",
      "A cluster the patient or carer describes as different from previous events",
    ],
    timeCritical:
      "The number of events, their times and the state between them are recorded as observed, because the interval is what changes the urgency.",
    pathway:
      "Inform the on-call neurologist and record the time. Critical care support is requested by the treating clinician and the request and its outcome are recorded.",
    fields: [
      inp("event_count", "Number of events and their times", "e.g. 3 events — 18:10, 18:55, 19:40"),
      opt("recovery_between", "Recovery between events", ["Full recovery", "Partial — drowsy", "None — no recovery of consciousness", "Not documented"]),
      inp("oxygenation", "Oxygenation and airway recorded", "SpO2, airway support, time"),
      inp("medicines", "Emergency medicines given — agent and time", "Each agent with its dose and time"),
      opt("trigger_search", "Cause search", ["Glucose measured", "Infection considered", "Missed doses documented", "Toxicity considered", "Not documented"]),
      opt("monitoring", "Monitoring level", ["Ward observation", "Continuous monitoring", "Critical care", "Not documented"]),
    ],
    requires: ["event_count", "recovery_between", "medicines"],
  },
  {
    key: "acute_altered_consciousness",
    label: "Acute altered consciousness",
    level: "immediate",
    provenance: "local",
    references: ["local"],
    why:
      "A falling level of consciousness is the shared final pathway of hypoglycaemia, stroke, haemorrhage, seizure, infection, raised pressure and poisoning, so the reversible causes are excluded and recorded before the diagnosis is written.",
    recognition: [
      "New confusion, drowsiness or unresponsiveness from a documented baseline",
      "A fall in the Glasgow Coma Scale from the previous record",
      "A patient who cannot be roused but was reported normal earlier",
      "Agitation or behaviour change with reduced awareness",
    ],
    timeCritical:
      "Glasgow Coma Scale, pupils, glucose and the airway are recorded with times at first assessment and at every deterioration — the trend, not the single reading, is the finding.",
    pathway:
      "Inform the senior clinician on call immediately and record who and when. The institution's emergency pathway for the collapsed or deteriorating patient is activated by the treating team and the route recorded.",
    fields: [
      inp("gcs_series", "Glasgow Coma Scale with times", "e.g. 14 at 20:00, 11 at 20:40"),
      opt("airway", "Airway and breathing", ["Maintained", "At risk — adjunct or positioning used", "Requires ventilatory support", "Not documented"]),
      inp("glucose", "Blood glucose", "Value and time"),
      inp("pupils", "Pupils", "Size, symmetry and reaction, with time"),
      opt("causes", "Reversible causes assessed", [
        "Glucose", "Hypoxia", "Stroke or haemorrhage", "Seizure", "Infection",
        "Raised intracranial pressure", "Poisoning or medication effect",
      ]),
      inp("imaging", "Imaging arranged", "What was arranged, when, and the result recorded"),
      opt("trend", "Documented trend", ["Improving", "Stable", "Deteriorating — times recorded", "Not documented"]),
    ],
    requires: ["gcs_series", "glucose", "pupils"],
  },
  {
    key: "meningitis",
    label: "Meningitis",
    level: "immediate",
    provenance: "local",
    references: ["local"],
    why:
      "Bacterial meningitis is treated on suspicion, not on confirmation: the antimicrobial is given as soon as it is considered, and the record shows the time it was given and why any lumbar puncture was deferred.",
    recognition: [
      "Fever with neck stiffness, photophobia or severe headache",
      "A non-blanching rash with fever and altered consciousness",
      "Seizure or reduced consciousness with fever",
      "Meningism in a patient who is immunocompromised or has a shunt",
    ],
    timeCritical:
      "This record never precedes treatment. If lumbar puncture or imaging is deferred, the reason is written beside the antimicrobial time — a deferred test is not an omitted one.",
    pathway:
      "Inform the senior clinician and the infection team by name and time, and record the sepsis or meningitis pathway used by the institution.",
    fields: [
      inp("fever", "Fever and meningeal signs documented", "Temperature, neck stiffness, Kernig, Brudzinski, rash"),
      opt("lumbar_puncture", "Lumbar puncture", [
        "Performed — result recorded",
        "Deferred — reason documented",
        "Deferred — imaging performed first, reason documented",
        "Not documented",
      ]),
      inp("cultures", "Blood cultures — times taken", "Before the antimicrobial where possible, with the time"),
      inp("antimicrobial_time", "Antimicrobial given — agent and time", "As recorded by the treating clinician"),
      opt("consciousness", "Consciousness at assessment", ["Alert", "Confused", "Drowsy", "Unresponsive", "Not documented"]),
      opt("isolation", "Infection control measures", ["Applied", "Not applicable", "Not documented"]),
    ],
    requires: ["fever", "lumbar_puncture", "antimicrobial_time"],
  },
  {
    key: "encephalitis",
    label: "Encephalitis",
    level: "immediate",
    provenance: "local",
    references: ["local"],
    why:
      "Encephalitis is recognised from fever, new focal signs, seizure or altered behaviour together, and outcome depends on how soon the possibility is recorded and acted on.",
    recognition: [
      "Fever with altered consciousness or personality change",
      "New focal deficit or seizure with fever",
      "Movement disorder or autonomic instability with acute confusion",
      "Encephalopathy following a viral illness",
    ],
    timeCritical:
      "The time the possibility was recorded and the time the treating clinician acted on it are both written down; this panel documents them, it does not order them.",
    pathway:
      "Inform the senior clinician, the neurology team and the infection team by name and time; critical care support is requested by the treating clinician and its outcome recorded.",
    fields: [
      txt("features", "Features documented together", "Fever, behaviour change, focal signs, seizure, movement disorder"),
      opt("imaging", "Brain imaging", ["Performed — result recorded", "Requested", "Not performed — reason documented", "Not documented"]),
      opt("lumbar_puncture", "Cerebrospinal fluid examination", ["Performed — result recorded", "Deferred — reason documented", "Planned", "Not documented"]),
      inp("eeg", "EEG — performed, time and finding"),
      inp("treatment_time", "Treatment recorded by the treating clinician — agent and time"),
      opt("level_of_care", "Level of care", ["Ward", "High dependency", "Critical care", "Not documented"]),
    ],
    requires: ["features", "imaging", "lumbar_puncture"],
  },
  {
    key: "raised_icp",
    label: "Raised intracranial pressure",
    level: "immediate",
    provenance: "local",
    references: ["local"],
    why:
      "Headache, vomiting, papilloedema, a sixth-nerve palsy and a falling level of consciousness are the record of a pressure that is rising; the interventions that protect the patient are time-dependent.",
    recognition: [
      "Headache worse on lying flat, on coughing or on waking",
      "Projectile vomiting without nausea",
      "Papilloedema, or a sixth-nerve palsy with headache",
      "Falling consciousness without a metabolic explanation",
      "New focal deficit with headache and vomiting",
    ],
    timeCritical:
      "The Glasgow Coma Scale and the pupils are recorded with times so a trend exists; the record of what was done to lower the pressure carries the time it was done.",
    pathway:
      "Inform the on-call neurologist or neurosurgeon immediately and record who and when. Any urgent intervention is a clinician decision and is recorded with who authorised it.",
    fields: [
      inp("symptoms", "Presenting features documented", "Headache pattern, vomiting, visual symptoms"),
      opt("fundoscopy", "Fundoscopy", ["Papilloedema documented", "Normal", "Not performed — reason documented", "Not documented"]),
      inp("gcs_pupils", "Glasgow Coma Scale and pupils with times", "Serial readings, not a single value"),
      inp("imaging", "Imaging — time and finding", "e.g. CT 21:00, no mass, effaced sulci"),
      inp("measures_time", "Measures recorded — what and when", "Positioning, medication given by the treating clinician, with times"),
      inp("neurosurgery", "Neurosurgical view — who and when"),
    ],
    requires: ["gcs_pupils", "imaging"],
  },
  {
    key: "impending_herniation",
    label: "Impending brain herniation",
    level: "immediate",
    provenance: "local",
    references: ["local"],
    why:
      "A unilaterally dilating pupil, posturing or the combination of falling consciousness with rising blood pressure and falling pulse is the last window in which the patient can be helped.",
    recognition: [
      "New pupil asymmetry or a fixed dilated pupil",
      "Extensor posturing of one or both sides",
      "Falling Glasgow Coma Scale with hypertension and bradycardia",
      "Respiratory irregularity with a declining level of consciousness",
      "Deterioration while awaiting imaging or transfer",
    ],
    timeCritical:
      "This is the shortest time-critical record in the specialty. The observations are written at the bedside and the escalation time is written beside them — the record is never completed before help is called.",
    pathway:
      "Call the emergency team, the neurosurgeon and the intensivist at once and record each name and time. The institution's deteriorating-patient pathway is activated by the treating team.",
    fields: [
      inp("pupils", "Pupils — size, symmetry, reaction, time", "Both sides, with times"),
      opt("posturing", "Posturing", ["None", "Decorticate", "Decerebrate", "Not documented"]),
      inp("vitals", "Blood pressure, pulse and respiration with times", "Serial readings"),
      inp("gcs", "Glasgow Coma Scale with time", "And the previous reading for comparison"),
      inp("airway", "Airway secured — method, operator and time"),
      inp("call_times", "Who was called, at what time, and the time they arrived or advised"),
    ],
    requires: ["pupils", "gcs", "call_times"],
  },
  {
    key: "spinal_cord_compression",
    label: "Acute spinal cord compression",
    level: "immediate",
    provenance: "local",
    references: ["local"],
    why:
      "Function that is lost before decompression does not reliably return; the record of the level, the examination and the timing of imaging and referral is what makes the delay visible and preventable.",
    recognition: [
      "New back pain with a motor or sensory level",
      "Progressive weakness in the legs with a band of sensory loss",
      "Bilateral leg weakness with brisk reflexes and extensor plantars",
      "Known cancer with new back pain or new neurological signs",
    ],
    timeCritical:
      "The level, the power in each limb and the time imaging was requested and performed are recorded together, because the interval is the prognostic fact.",
    pathway:
      "Inform the on-call neurologist or spinal surgeon and the oncology team by name and time, and record the imaging request time and the accepting team.",
    fields: [
      inp("level", "Documented sensory level", "Dermatome, and how it was tested"),
      inp("power", "Power in each limb", "MRC grades, per limb"),
      opt("bladder", "Bladder and bowel function", ["Normal", "Retention", "Incontinence", "Catheterised", "Not assessed"]),
      inp("mri", "MRI — requested at, performed at, finding"),
      inp("referral", "Referral — team, named clinician and time"),
      opt("steroid", "Medication decision recorded", [
        "Recorded by the treating clinician with authorisation",
        "Not given — reason documented",
        "Not documented",
      ]),
    ],
    requires: ["level", "power", "mri"],
  },
  {
    key: "cauda_equina",
    label: "Cauda equina syndrome",
    level: "immediate",
    provenance: "local",
    references: ["local"],
    why:
      "Saddle anaesthesia, new urinary retention and bilateral leg symptoms together are a surgical emergency, and the record of when each was found is what allows decompression to happen in time.",
    recognition: [
      "Saddle anaesthesia or reduced perineal sensation",
      "New urinary retention, or incontinence with a palpable bladder",
      "Bilateral leg pain, weakness or sensory change",
      "Reduced anal tone on examination",
    ],
    timeCritical:
      "Bladder function is documented by what was measured — a post-void residual or a catheter — not by the patient's report alone. The time of the MRI request and of the surgical referral are recorded.",
    pathway:
      "Refer to the on-call spinal surgeon immediately and record the named clinician, the time and the accepting destination.",
    fields: [
      opt("saddle", "Saddle sensation", ["Intact", "Reduced", "Anaesthetic", "Not assessed"]),
      opt("bladder_state", "Bladder function", ["Normal", "Retention documented", "Incontinence", "Catheterised", "Not assessed"]),
      inp("residual", "Post-void residual", "Volume measured, with the method"),
      inp("anal_tone", "Anal tone and perianal sensation", "Findings as examined"),
      inp("mri", "MRI — requested at, performed at, finding"),
      inp("referral", "Surgical referral — named clinician and time"),
    ],
    requires: ["saddle", "bladder_state", "mri"],
  },
  {
    key: "gbs_respiratory_autonomic",
    label: "Guillain-Barré syndrome with respiratory or autonomic compromise",
    level: "immediate",
    provenance: "guideline",
    references: ["ean_gbs"],
    why:
      "Respiratory failure in Guillain-Barré syndrome develops over hours and is not predicted by how the patient looks; vital capacity and the ability to count and swallow are the observations that precede it, and autonomic instability can be the first sign of deterioration.",
    recognition: [
      "Progressive ascending weakness with reduced or absent reflexes",
      "Falling vital capacity, or a single breath count that is short of the patient's own baseline",
      "Bulbar weakness — nasal speech, pooling secretions, difficulty swallowing",
      "Blood-pressure and heart-rate variability without another cause",
      "Rapid progression, or weakness that has reached the arms and neck",
    ],
    timeCritical:
      "Vital capacity and the single breath count are recorded with their times, because the trend rather than the value predicts the need for ventilatory support — and the decision to escalate is made by the treating clinician, not by this panel.",
    pathway:
      "Inform the on-call neurologist and the intensivist by name and time; the level of monitoring is a clinician decision and is recorded with its authorisation.",
    fields: [
      inp("progression", "Onset, progression and current deficit", "Dates, pattern, what is affected now"),
      inp("vital_capacity", "Vital capacity with time", "mL or % predicted, and the time measured"),
      inp("single_breath", "Single breath count and speech", "Count, and whether speech is in full sentences"),
      opt("bulbar", "Bulbar function", ["Normal", "Mild — noted at review", "Pooling secretions or nasal speech", "Unable to swallow safely", "Not assessed"]),
      opt("autonomic", "Autonomic features", ["None documented", "Blood-pressure variability", "Heart-rate variability", "Both", "Not assessed"]),
      opt("monitoring", "Monitoring level", ["Ward observation", "Continuous cardiac and respiratory monitoring", "Critical care", "Not documented"]),
      inp("immunotherapy", "Treatment recorded by the treating clinician — agent and dates"),
    ],
    requires: ["vital_capacity", "bulbar", "autonomic"],
  },
  {
    key: "myasthenic_crisis",
    label: "Myasthenic crisis",
    level: "immediate",
    provenance: "local",
    references: ["local"],
    why:
      "Weakness that has reached the bulbar and respiratory muscles can progress to ventilatory failure within hours, and the precipitant — infection, a new medicine, a missed dose — changes what is done next.",
    recognition: [
      "Worsening weakness with difficulty swallowing, chewing or speaking",
      "Breathlessness at rest, or on talking, with a falling vital capacity",
      "Weakness after a recent infection, new medicine or a change in treatment",
      "A patient with myasthenia who is deteriorating rather than fluctuating",
    ],
    timeCritical:
      "Respiratory function is recorded as measured — vital capacity and single breath count with times — and the precipitant search is written beside it.",
    pathway:
      "Inform the neurology team and the intensivist by name and time. Any change to treatment or ventilatory support is a clinician decision recorded with its authorisation.",
    fields: [
      inp("weakness", "Distribution and progression of weakness", "Bulbar, neck, respiratory, limb — with dates"),
      inp("vital_capacity", "Vital capacity with time", "mL or % predicted"),
      inp("single_breath", "Single breath count", "Count and the time taken"),
      opt("precipitant", "Precipitant identified", [
        "Infection", "New medicine", "Missed doses", "Taper of treatment",
        "Surgery or procedure", "None identified", "Not documented",
      ]),
      inp("medication_times", "Current treatment and last doses", "Agent, dose and time recorded by the treating team"),
      opt("level_of_care", "Level of care", ["Ward", "High dependency", "Critical care", "Not documented"]),
    ],
    requires: ["weakness", "vital_capacity", "precipitant"],
  },
];

export const NEURO_EMERGENCY_MAP = NEURO_EMERGENCY_PRESENTATIONS.reduce((acc, p) => {
  acc[p.key] = p;
  return acc;
}, {});

// ---- Red-flag screen -----------------------------------------------------
// Each flag names the presentation it points to, so a ticked flag can never be
// recorded without a visible destination.
export const NEURO_RED_FLAGS = [
  { key: "thunderclap", label: "Sudden severe headache reaching maximum within a minute", level: "immediate", pointsTo: "subarachnoid_haemorrhage" },
  { key: "focal_deficit", label: "New focal weakness, sensory loss or visual loss", level: "immediate", pointsTo: "acute_ischaemic_stroke" },
  { key: "resolved_deficit", label: "Focal deficit that has resolved", level: "urgent", pointsTo: "tia" },
  { key: "speech_change", label: "New speech or language disturbance", level: "immediate", pointsTo: "acute_ischaemic_stroke" },
  { key: "seizure_ongoing", label: "Seizure ongoing, or repeated seizures without recovery", level: "immediate", pointsTo: "status_epilepticus" },
  { key: "gcs_drop", label: "Falling level of consciousness from a documented baseline", level: "immediate", pointsTo: "acute_altered_consciousness" },
  { key: "fever_meningism", label: "Fever with neck stiffness, photophobia or rash", level: "immediate", pointsTo: "meningitis" },
  { key: "fever_encephalopathy", label: "Fever with new confusion, behaviour change or focal signs", level: "immediate", pointsTo: "encephalitis" },
  { key: "pupil_change", label: "New pupil asymmetry or a fixed dilated pupil", level: "immediate", pointsTo: "impending_herniation" },
  { key: "posturing", label: "New extensor posturing", level: "immediate", pointsTo: "impending_herniation" },
  { key: "papilloedema", label: "Papilloedema, or headache with vomiting on waking", level: "immediate", pointsTo: "raised_icp" },
  { key: "cord_level", label: "New limb weakness with a sensory level or sphincter disturbance", level: "immediate", pointsTo: "spinal_cord_compression" },
  { key: "saddle_anaesthesia", label: "Saddle anaesthesia or new urinary retention", level: "immediate", pointsTo: "cauda_equina" },
  { key: "ascending_weakness", label: "Ascending weakness with falling vital capacity", level: "immediate", pointsTo: "gbs_respiratory_autonomic" },
  { key: "bulbar_weakness", label: "New bulbar weakness with breathlessness", level: "immediate", pointsTo: "myasthenic_crisis" },
  { key: "anticoagulated_headache", label: "Headache or new deficit on an anticoagulant", level: "immediate", pointsTo: "intracranial_haemorrhage" },
];

export const NEURO_RED_FLAG_STATES = [
  "No red flag documented — examination documented above",
  "Red flags documented — see below",
  "Not assessed",
];

// ---- State ---------------------------------------------------------------
export const emptyNeurologyEmergency = () => ({
  none_documented: false,
  not_assessed: false,
  red_flag_state: "",
  red_flags: [],
  presentations: [],
  blocks: {},
});

export const neurologyEmergencyState = (value) => {
  const base = emptyNeurologyEmergency();
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  return {
    ...base,
    ...value,
    red_flags: Array.isArray(value.red_flags) ? value.red_flags : [],
    presentations: Array.isArray(value.presentations) ? value.presentations : [],
    blocks: value.blocks && typeof value.blocks === "object" && !Array.isArray(value.blocks) ? value.blocks : {},
  };
};

export const neurologyEmergencyLevelOrder = (key) =>
  NEURO_EMERGENCY_LEVELS[NEURO_EMERGENCY_MAP[key]?.level]?.order ?? 9;

export const selectedNeuroEmergencies = (value) =>
  neurologyEmergencyState(value)
    .presentations.filter((k) => Boolean(NEURO_EMERGENCY_MAP[k]))
    .sort((a, b) => neurologyEmergencyLevelOrder(a) - neurologyEmergencyLevelOrder(b));

export const neuroRedFlag = (key) => NEURO_RED_FLAGS.find((f) => f.key === key) || null;

export const neuroEmergencyReferences = (value) => {
  const keys = [];
  selectedNeuroEmergencies(value).forEach((key) => {
    (NEURO_EMERGENCY_MAP[key].references || []).forEach((r) => keys.push(r));
  });
  return [...new Set(keys)]
    .map((key) => (NEURO_REFERENCES[key] ? { key, ...NEURO_REFERENCES[key] } : null))
    .filter(Boolean);
};

// ---- Completeness --------------------------------------------------------
const s = (v) => String(v ?? "").trim();

const blockOf = (state, key) => state.blocks[key] || {};

// What the record still owes. Returned as a list so the panel can show it, the
// safety review can read it and the printed note can carry it — never a silent
// pass, and never a block on saving the note.
export const neurologyEmergencyIssues = (value) => {
  const state = neurologyEmergencyState(value);
  const issues = [];
  const hasState =
    state.none_documented ||
    state.not_assessed ||
    state.presentations.length > 0 ||
    state.red_flags.length > 0 ||
    s(state.red_flag_state) !== "";

  if (!hasState) {
    issues.push({
      key: "no_state",
      level: "documented",
      message:
        "No emergency statement recorded. Record the presentations considered, or state explicitly that none was documented and that the examination supports it.",
    });
  }

  if (state.none_documented && state.presentations.length > 0) {
    issues.push({
      key: "contradiction",
      level: "documented",
      message: "The record states that no emergency was documented and also records one — resolve the contradiction.",
    });
  }

  if (s(state.red_flag_state) === NEURO_RED_FLAG_STATES[0] && state.red_flags.length > 0) {
    issues.push({
      key: "red_flag_contradiction",
      level: "documented",
      message: "Red flags are both stated as absent and recorded — correct the record.",
    });
  }

  selectedNeuroEmergencies(value).forEach((key) => {
    const spec = NEURO_EMERGENCY_MAP[key];
    const block = blockOf(state, key);
    const docs = block.docs || {};
    const pathway = block.pathway || {};

    if (!s(pathway.who_informed) || !s(pathway.time_informed)) {
      issues.push({
        key: `${key}_pathway`,
        level: spec.level,
        message: `${spec.label}: the urgent pathway is incomplete — who was informed and at what time must be recorded.`,
      });
    }

    (spec.requires || []).forEach((fieldKey) => {
      const field = (spec.fields || []).find((f) => f.key === fieldKey);
      if (!field) return;
      if (!s(docs[fieldKey])) {
        issues.push({
          key: `${key}_${fieldKey}`,
          level: spec.level,
          message: `${spec.label}: ${field.label} is not recorded.`,
        });
      }
    });
  });

  if (state.red_flags.length > 0) {
    const anyPathway = state.presentations.some((key) => s(blockOf(state, key).pathway?.who_informed));
    if (!anyPathway) {
      issues.push({
        key: "red_flag_pathway",
        level: "immediate",
        message:
          "A red flag is recorded with no documented urgent pathway — record who was informed, at what time, and the decision taken.",
      });
    }
  }

  return issues;
};

export const neurologyEmergencyUrgentCount = (value) =>
  neurologyEmergencyIssues(value).filter((i) => i.level === "immediate" || i.level === "emergency").length;

// ---- Print ---------------------------------------------------------------
const orNotDocumented = (v) => (s(v) ? s(v) : "NOT DOCUMENTED");

export const formatNeurologyEmergency = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const state = neurologyEmergencyState(value);
  const lines = ["NEUROLOGICAL EMERGENCIES — RECOGNITION AND URGENT PATHWAY", NEURO_EMERGENCY_NOTICE];

  if (state.not_assessed) lines.push("\nEmergency assessment: NOT ASSESSED at the time of this note.");
  if (state.none_documented) {
    lines.push(
      "\nNo neurological emergency documented in this encounter. This statement rests on the examination recorded in the note.",
    );
  }

  if (s(state.red_flag_state)) lines.push(`Red flags: ${state.red_flag_state}`);
  if (state.red_flags.length) {
    lines.push("Red flags recorded:");
    state.red_flags.forEach((key) => {
      const flag = neuroRedFlag(key);
      lines.push(`   • ${flag ? `${flag.label} (points to ${NEURO_EMERGENCY_MAP[flag.pointsTo]?.label || flag.pointsTo})` : key}`);
    });
  }

  selectedNeuroEmergencies(value).forEach((key) => {
    const spec = NEURO_EMERGENCY_MAP[key];
    const block = blockOf(state, key);
    lines.push(`\n${spec.label.toUpperCase()} — ${NEURO_EMERGENCY_LEVELS[spec.level].label}`);
    lines.push(`   Why urgent: ${spec.why}`);
    lines.push(`   Time-critical: ${spec.timeCritical}`);
    spec.fields.forEach((f) => {
      const v = (block.docs || {})[f.key];
      if (s(v)) lines.push(`   ${f.label}: ${s(v)}`);
      else if ((spec.requires || []).includes(f.key)) lines.push(`   ${f.label}: NOT DOCUMENTED`);
    });
    const pathway = block.pathway || {};
    lines.push("   Urgent pathway record:");
    NEURO_PATHWAY_FIELDS.forEach((f) => {
      lines.push(`      ${f.label}: ${orNotDocumented(pathway[f.key])}`);
    });
    lines.push(`   Source: ${spec.provenance === "guideline" ? "guideline requirement" : "AMedix local decision — not a guideline claim"}`);
  });

  const issues = neurologyEmergencyIssues(value).filter((i) => i.key !== "no_state");
  if (issues.length) {
    lines.push("\nRECORD STILL OWES:");
    issues.forEach((i) => lines.push(`   • ${i.message}`));
  }

  return lines.join("\n");
};