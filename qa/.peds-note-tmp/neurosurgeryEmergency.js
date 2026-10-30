// NEUROSURGERY — the time-critical pathway.
//
// A single structured record for an emergency presentation: what the patient
// presented with, how stable they were (airway, breathing, circulation), the
// neurological status and red flags, the time-critical actions with their times,
// the specialist discussion, the transfer decision, and who is responsible.
//
// DESIGN RULES
//   - Advisory and non-blocking. Nothing here stops a clinician treating first:
//     the record explicitly allows "life-saving treatment started first, note
//     completed immediately after".
//   - Nothing defaults to normal. An unrecorded airway is "Not documented", not
//     "patent"; an unrecorded scan is not "clear".
//   - No field duplicates the shared tabs: vital signs come from the shared
//     vitals component, investigations and laboratory results from the patient's
//     own record. This block records the emergency DECISIONS and their times.
//   - Every field label avoids the platform's retired wording ("escalation",
//     "investigation", "imaging", "working diagnosis"), so the pathway survives
//     the note section policy everywhere.

const NOT_DOCUMENTED = "Not documented";

export const NSG_STABILITY = [
  "Stable — observations within the documented range",
  "Unstable — physiological abnormality documented",
  "Peri-arrest",
  NOT_DOCUMENTED,
];

export const NSG_AIRWAY = [
  "Patent — self-ventilating",
  "Patent — intubated",
  "Partially obstructed — manoeuvre required",
  "Obstructed — airway secured",
  NOT_DOCUMENTED,
];

export const NSG_BREATHING = [
  "Spontaneous and adequate",
  "Tachypnoeic",
  "Hypoxaemic — oxygen started",
  "Ventilated — settings documented",
  "Irregular or inadequate",
  NOT_DOCUMENTED,
];

export const NSG_CIRCULATION = [
  "Normotensive",
  "Hypotensive — resuscitation started",
  "Hypertensive — managed",
  "Bradycardic with hypertension",
  "Arrested",
  NOT_DOCUMENTED,
];

export const NSG_HERNIATION = [
  "Not present",
  "Uncal — ipsilateral pupil dilated",
  "Central — bilateral pupillary change with posturing",
  "Tonsillar — respiratory compromise",
  "Suspected — documented features",
  NOT_DOCUMENTED,
];

export const NSG_SCAN_TIMING = [
  "Performed before arrival",
  "Performed within 30 minutes of the decision",
  "Performed within 1 hour",
  "Performed — delayed",
  "Not indicated — reason documented",
  NOT_DOCUMENTED,
];

export const NSG_TRANSFER = [
  "No transfer required — managed on site",
  "Transfer accepted — neurosurgical centre",
  "Transfer requested — awaiting acceptance",
  "Transfer declined — reason documented",
  "Transfer not clinically appropriate — documented",
  NOT_DOCUMENTED,
];

export const NSG_DOCUMENTATION_ORDER = [
  "Documented before treatment",
  "Life-saving treatment started first — note completed immediately after",
];

export const NSG_CONSCIOUS_TREND = [
  "Stable",
  "Improving",
  "Deteriorating",
  "Fluctuating",
  NOT_DOCUMENTED,
];

// The emergencies this pathway covers, with the red flags and time-critical
// actions that belong to each. The source is the published document the red
// flags follow; where none is attributed the entry says so instead of borrowing
// a society's name.
export const NSG_EMERGENCY_PRESENTATIONS = [
  {
    key: "deteriorating_consciousness",
    label: "Deteriorating consciousness",
    redFlags: [
      "Conscious level falling by two or more points",
      "New pupillary asymmetry",
      "New focal deficit",
      "Hypertension with bradycardia",
      "Abnormal posturing",
      "Respiratory pattern change",
    ],
    actions: [
      "Airway secured",
      "Ventilation and oxygenation checked",
      "Urgent CT requested",
      "Osmotherapy given",
      "Neurosurgical consultant informed",
      "Theatre prepared",
    ],
    note: "A falling conscious level is a time-critical finding: the record carries the observation before and after, the time, and what changed as a result.",
    source: "nice_ng232",
    population: "Infants, children and adults",
  },
  {
    key: "raised_icp",
    label: "Suspected raised intracranial pressure",
    redFlags: [
      "Headache with vomiting",
      "Reduced conscious level",
      "Pupillary asymmetry",
      "Papilloedema documented",
      "Cushing response",
      "Posterior fossa lesion on scan",
    ],
    actions: [
      "Head-up positioning and venous drainage checked",
      "Osmotherapy given",
      "Sedation and ventilation optimised",
      "CSF drainage considered or performed",
      "Decompression planned",
    ],
    note: "Intracranial pressure measurements, where taken, are recorded with the pressure target the treating team set for this patient.",
    source: "nice_ng232",
    population: "Infants, children and adults",
  },
  {
    key: "intracranial_haemorrhage",
    label: "Acute intracranial haemorrhage",
    redFlags: [
      "Extradural collection with neurological change",
      "Subdural collection with mass effect",
      "Intracerebral haemorrhage with a falling conscious level",
      "Subarachnoid haemorrhage with a thunderclap onset",
      "Anticoagulation or antiplatelet therapy",
      "Midline shift on scan",
    ],
    actions: [
      "Urgent CT performed and reviewed",
      "Coagulation corrected",
      "Blood pressure target documented",
      "Neurosurgical consultant informed",
      "Craniotomy or drainage arranged",
      "Vascular study arranged where indicated",
    ],
    note: "Traumatic haemorrhage is documented against the head-injury pathway; spontaneous haemorrhage follows the local stroke pathway. Record which applies rather than merging them.",
    source: null,
    sourceNote: "Traumatic haemorrhage follows NICE NG232 or AANS/CNS; spontaneous haemorrhage follows the local stroke pathway, which is not attributed to a society document here.",
    population: "All ages — the source depends on the mechanism",
  },
  {
    key: "traumatic_brain_injury",
    label: "Traumatic brain injury",
    redFlags: [
      "GCS 8 or less at any point after resuscitation",
      "Deterioration after an initial lucid interval",
      "Open or depressed skull fracture",
      "Post-traumatic seizure",
      "Focal deficit",
      "Anticoagulation with head injury",
    ],
    actions: [
      "Cervical spine protected",
      "Urgent CT performed and reviewed",
      "Coagulation corrected",
      "Neurosurgical consultant informed",
      "Intracranial pressure strategy documented",
      "Transfer arranged where the service is not on site",
    ],
    note: "Adult severe-TBI evidence and the age-inclusive head-injury pathway are distinct sources: the note records which one was applied.",
    source: "nice_ng232",
    sourceAlt: "aans_tbi_4th",
    population: "Infants, children and adults (adult severe-TBI evidence recorded separately)",
  },
  {
    key: "spinal_cord_compression",
    label: "Acute spinal cord compression",
    redFlags: [
      "New limb weakness",
      "Sensory level",
      "Bladder or bowel dysfunction",
      "Band-like pain or radicular pain",
      "Known malignancy",
      "Progressive deficit over hours",
    ],
    actions: [
      "Full spine imaging requested and reviewed",
      "Dexamethasone decision documented",
      "Spinal surgeon informed",
      "Analgesia and positioning",
      "Decompression arranged",
      "Transfer arranged where no spinal service is on site",
    ],
    note: "Malignant cord compression follows the local oncology pathway. The time the deficit was recognised and the time decompression was decided are both recorded, because the interval is what the record is judged on.",
    source: null,
    sourceNote: "Malignant spinal cord compression follows the local oncology pathway; no society document is attributed to this prompt.",
    population: "All ages",
  },
  {
    key: "cauda_equina",
    label: "Cauda equina syndrome — suspected",
    redFlags: [
      "New urinary retention or incontinence",
      "Saddle anaesthesia",
      "Bilateral sciatica",
      "Reduced anal tone",
      "Progressive bilateral leg weakness",
      "Faecal incontinence",
    ],
    actions: [
      "Emergency MRI requested",
      "Bladder scan and catheterisation decision documented",
      "Surgical team informed immediately",
      "Decompression planned within the local target",
      "Transfer arranged where no spinal service is on site",
    ],
    note: "Suspected cauda equina syndrome is a surgical emergency. The record carries the time the red flags were elicited, the time the scan was requested, and the time the decision to operate was made.",
    source: "nice_ng59",
    population: "People over 16 in the NICE pathway — a child is documented against the paediatric source",
  },
  {
    key: "acute_neurological_deficit",
    label: "Acute neurological deficit",
    redFlags: [
      "Sudden focal weakness or dysphasia",
      "Fixed neurological deficit of unknown onset",
      "Rapidly progressive deficit",
      "Cranial nerve palsy with a headache",
      "Anticoagulation with new deficit",
    ],
    actions: [
      "Urgent CT performed and reviewed",
      "Vascular study arranged where indicated",
      "Thrombolysis or thrombectomy decision documented",
      "Neurosurgical consultant informed",
      "Blood pressure target documented",
    ],
    note: "A new deficit is documented with the time it was first noticed and by whom — that timestamp, not the arrival time, drives the decision pathway.",
    source: null,
    sourceNote: "Acute stroke and deficit pathways are institutional; no society document is attributed to this prompt.",
    population: "All ages",
  },
  {
    key: "brain_herniation",
    label: "Brain herniation — suspected or established",
    redFlags: [
      "Fixed and dilated pupil",
      "Bilateral fixed pupils with posturing",
      "Respiratory arrest or irregular breathing",
      "Rapidly falling conscious level to unresponsive",
      "Cushing triad",
    ],
    actions: [
      "Airway secured and ventilation controlled",
      "Osmotherapy given",
      "Immediate decompression arranged",
      "CSF drainage considered",
      "Family informed",
    ],
    note: "Herniation is documented as a clinical syndrome with its features and times. Treatment is never delayed to complete the record.",
    source: "nice_ng232",
    population: "Infants, children and adults",
  },
  {
    key: "csf_diversion_emergency",
    label: "Shunt or drain malfunction — emergency",
    redFlags: [
      "Headache with vomiting after shunt insertion",
      "Reduced conscious level",
      "Shunt track swelling or CSF collection",
      "Fever with shunt in situ",
      "Failure of the drain to drain",
      "Abdominal pain with a peritoneal shunt",
    ],
    actions: [
      "Shunt series or CT reviewed",
      "CSF sampled where infection is suspected",
      "External drainage established or revised",
      "Neurosurgical consultant informed",
      "Revision arranged",
    ],
    note: "Device malfunction and device infection are documented as their own findings, separate from the underlying hydrocephalus.",
    source: null,
    sourceNote: "Paediatric shunt guidance exists (CNS) but adult practice differs; the local protocol governs, and no single document is attributed here.",
    population: "All ages — paediatric practice follows the paediatric source",
  },
  {
    key: "post_operative_emergency",
    label: "Post-operative neurosurgical emergency",
    redFlags: [
      "Falling conscious level after surgery",
      "New pupillary asymmetry",
      "New deficit after surgery",
      "Wound swelling or CSF leak",
      "Seizure in the first 24 hours",
      "Drain not draining",
    ],
    actions: [
      "Urgent CT performed and reviewed",
      "Wound inspected",
      "Drain checked and repositioned or removed",
      "Return to theatre arranged",
      "Neurosurgical consultant informed",
    ],
    note: "The operation, its findings and the post-operative course are read together: this block sits beside the operation record, not instead of it.",
    source: null,
    sourceNote: "Post-operative emergency thresholds are institutional; no society document is attributed to this prompt.",
    population: "All ages",
  },
];

const DEFAULT_RED_FLAGS = [
  "Reduced conscious level",
  "New focal deficit",
  "Pupillary change",
  "Severe or escalating headache",
  "New seizure",
  "Wound or drain problem",
];

const DEFAULT_ACTIONS = [
  "Airway secured",
  "Urgent CT requested",
  "Neurosurgical consultant informed",
  "Theatre prepared",
  "Transfer arranged",
];

export const emergencyPresentationFor = (key) =>
  NSG_EMERGENCY_PRESENTATIONS.find((p) => p.key === key) || null;

const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const TIME = (key, label, extra) => ({ key, label, type: "time", ...extra });
const CHECK = (key, label, options, extra) => ({ key, label, type: "checkbox", options, ...extra });

// The pathway, as sections the shared structured renderer draws. The red flags
// and time-critical actions change with the presentation selected, so the
// clinician is prompted with the ones that belong to that emergency.
export const emergencySections = (value = {}) => {
  const v = value || {};
  const presentation = emergencyPresentationFor(v.presentation);
  const redFlags = presentation?.redFlags?.length ? presentation.redFlags : DEFAULT_RED_FLAGS;
  const actions = presentation?.actions?.length ? presentation.actions : DEFAULT_ACTIONS;

  return [
    {
      title: "Presentation & Timing",
      fields: [
        S(
          "presentation",
          "Time-critical emergency being documented",
          NSG_EMERGENCY_PRESENTATIONS.map((p) => p.label)
        ),
        T("presentation_detail", "Presenting problem and the referrer's question", { rows: 2 }),
        TIME("onset_time", "Time the deficit or deterioration was first recognised"),
        TIME("arrival_time", "Time the patient was first seen by the neurosurgical team"),
        S("documentation_order", "Treatment and documentation order", NSG_DOCUMENTATION_ORDER, {
          critical: true,
          hint: "Documentation never delays treatment. Where treatment came first, say so here and complete the note immediately afterwards.",
        }),
      ],
    },
    {
      title: "Clinical Stability — Airway, Breathing, Circulation",
      note: "Vital signs are recorded in the shared observations block; this section records the assessment the decision was based on.",
      fields: [
        S("stability", "Overall physiological stability", NSG_STABILITY),
        S("airway", "Airway", NSG_AIRWAY, { critical: true }),
        S("breathing", "Breathing and oxygenation", NSG_BREATHING),
        I("ventilation_detail", "Ventilation mode, oxygen or airway detail"),
        S("circulation", "Circulation", NSG_CIRCULATION),
        I("pressure_detail", "Blood pressure and heart rate at assessment"),
        I("cervical_protection", "Cervical spine protection in place", {
          placeholder: "Collar, blocks and tape / not indicated — reason",
        }),
      ],
    },
    {
      title: "Neurological Status & Red Flags",
      note: "The structured examination and the GCS components are recorded in their own sections; this is the summary the pathway follows.",
      fields: [
        S("conscious_trend", "Conscious level trend", NSG_CONSCIOUS_TREND),
        TIME("last_neuro_obs", "Time of the last neurological observation"),
        S("herniation", "Herniation syndrome", NSG_HERNIATION),
        I("icp_signs", "Features of raised intracranial pressure documented"),
        I("icp_value", "Intracranial pressure and the target set, where monitored", {
          placeholder: "e.g. ICP 22 mmHg, target below 20 mmHg",
        }),
        CHECK("red_flags", "Red flags present at assessment", redFlags),
        T("red_flag_detail", "Red flags in detail — onset, progression and what they mean here", { rows: 2 }),
      ],
    },
    {
      title: "Time-Critical Actions",
      note: "Record what was actually done and when. An action not performed is left unticked rather than implied.",
      fields: [
        CHECK("critical_actions", "Actions taken", actions),
        TIME("action_time", "Time the first time-critical action was taken"),
        S("scan_timing", "CT / MRI", NSG_SCAN_TIMING),
        TIME("scan_time", "Time of the scan"),
        T("scan_finding", "Scan finding and what it changes", { rows: 2 }),
        I("medication_actions", "Time-critical medication given — agent, dose and time", {
          placeholder: "e.g. mannitol 20% 250 mL at 22:40; levetiracetam 1 g at 22:45",
        }),
      ],
    },
    {
      title: "Specialist Discussion & Transfer",
      fields: [
        I("discussion_with", "Neurosurgical consultant or senior discussed with — name and grade"),
        TIME("discussion_time", "Time of the discussion"),
        T("discussion_advice", "Advice given and the agreed decision", { rows: 2 }),
        S("transfer_status", "Transfer decision", NSG_TRANSFER, { critical: true }),
        I("transfer_destination", "Receiving centre and accepting clinician"),
        TIME("transfer_time", "Time the transfer decision was made"),
        I("transfer_mode", "Transfer mode and escort", { placeholder: "e.g. road ambulance, anaesthetist escort" }),
      ],
    },
    {
      title: "Deterioration Response & Responsibility",
      fields: [
        T("deterioration_criteria", "What must happen next, and who to call when it does", {
          rows: 2,
          hint: "Observation frequency, the thresholds that require a call, the name and grade of the person called, and the timeframe.",
        }),
        I("responsible_clinician", "Clinician responsible for this patient", { critical: true }),
        TIME("senior_review_time", "Time of the most senior review recorded"),
        I("next_review", "When the patient is next reviewed, and by whom"),
        S("family_informed", "Family or next of kin informed", [
          "Yes — documented",
          "Not yet — reason documented",
          "Not applicable",
          NOT_DOCUMENTED,
        ]),
        T("not_completed", "Anything still to be completed once the patient is stable", { rows: 2 }),
      ],
    },
  ];
};

const arr = (v) => (Array.isArray(v) ? v : []);
const text = (v) => String(v ?? "").trim();

export const emergencyFlags = (value = {}) => {
  const v = value || {};
  const herniation = text(v.herniation);
  return {
    documented: Boolean(text(v.presentation) || text(v.presentation_detail)),
    herniation: /Uncal|Central|Tonsillar|Suspected/.test(herniation),
    no_airway: !text(v.airway) || text(v.airway) === NOT_DOCUMENTED,
    no_scan: !text(v.scan_timing) || text(v.scan_timing) === NOT_DOCUMENTED,
    no_discussion: !text(v.discussion_with),
    no_transfer_decision: !text(v.transfer_status) || text(v.transfer_status) === NOT_DOCUMENTED,
    no_responsible: !text(v.responsible_clinician),
    treatment_first: /treatment started first/i.test(text(v.documentation_order)),
    red_flags: arr(v.red_flags),
  };
};

export const formatEmergencyPathway = (value) => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const lines = [];
  const presentation = emergencyPresentationFor(v.presentation);

  emergencySections(v).forEach((section) => {
    const body = section.fields
      .map((f) => {
        const raw = v[f.key];
        if (Array.isArray(raw)) return raw.length ? `${f.label}: ${raw.join("; ")}` : null;
        const val = text(raw);
        if (!val) return null;
        return `${f.label}: ${val}`;
      })
      .filter(Boolean);
    if (body.length) lines.push(`${section.title}\n${body.map((b) => `- ${b}`).join("\n")}`);
  });

  if (!lines.length) return "Time-critical pathway not documented in this note.";

  if (presentation) {
    lines.push(`Pathway applied: ${presentation.label}\n- ${presentation.note}`);
    if (presentation.population) lines.push(`- Population: ${presentation.population}`);
    const reference = presentation.source;
    if (reference) lines.push(`- Source: ${reference}`);
    else if (presentation.sourceNote) lines.push(`- Source: ${presentation.sourceNote}`);
  }

  if (!text(v.deterioration_criteria)) {
    lines.push(
      "Not documented: what must happen next and who to call if the patient deteriorates."
    );
  }

  return lines.join("\n\n");
};