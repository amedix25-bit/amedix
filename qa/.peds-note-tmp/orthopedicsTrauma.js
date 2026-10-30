// Orthopedics & Traumatology — life- and limb-threatening presentation layer.
//
// WHAT THIS FILE IS
// The fourteen presentations below are the orthopaedic emergencies the clinical
// team asked to have documented rather than described: acute compartment
// syndrome, open fractures, severe soft-tissue injury, neurovascular compromise,
// vascular injury, unstable pelvic injury, major associated trauma, spinal cord
// injury, cauda equina syndrome, septic arthritis, osteomyelitis, fat embolism
// syndrome, post-operative infection and thromboembolic complications.
//
// Each one carries only what a record needs: the findings that raise it, the
// documentation it demands, the time-critical pathway record, the urgent
// intervention record, and the requirement for a neurovascular reassessment
// before and after any intervention. Nothing here diagnoses, orders treatment or
// imposes a decision. A presentation that was not looked for is recorded as "not
// assessed" — never as absent, and never as normal by default.

import { orthoReferencesFor } from "./orthopedicsReferences.js";

export const ORTHO_TRAUMA_STATE_KEY = "ortho_trauma";

export const ORTHO_TRAUMA_LEVELS = {
  immediate: { label: "Immediate", chip: "bg-destructive/10 text-destructive", order: 0 },
  urgent: { label: "Urgent", chip: "bg-amber-100 text-amber-800", order: 1 },
  same_day: { label: "Same day", chip: "bg-primary/10 text-primary", order: 2 },
};

const opt = (key, label, options, extra = {}) => ({ key, label, type: "select", options, ...extra });
const txt = (key, label, extra = {}) => ({ key, label, type: "textarea", ...extra });
const inp = (key, label, extra = {}) => ({ key, label, type: "input", ...extra });

// ---- Neurovascular reassessment (before AND after any intervention) -------
const NV_FIELDS = (prefix, when) => [
  inp(`${prefix}_time`, `${when} — time documented`, { placeholder: "HH:MM" }),
  opt(`${prefix}_pulses`, `${when} — distal pulses`, ["Palpable", "Doppler only", "Absent", "Not documented"]),
  opt(`${prefix}_cap_refill`, `${when} — capillary refill`, ["Normal (<2 s)", "Delayed (>2 s)", "Not documented"]),
  opt(`${prefix}_motor`, `${when} — motor`, ["Intact", "Weak", "Absent", "Not documented"]),
  opt(`${prefix}_sensation`, `${when} — sensation`, ["Intact", "Reduced", "Absent", "Not documented"]),
  opt(`${prefix}_compartment`, `${when} — compartment`, [
    "Soft and compressible",
    "Firm — repeat assessment",
    "Hard / tense",
    "Not assessed",
  ]),
  inp(`${prefix}_abi`, `${when} — ankle-brachial / Doppler index, if measured`, { placeholder: "e.g. 0.7" }),
];

export const ORTHO_PRE_NV_FIELDS = NV_FIELDS("pre_nv", "Before the intervention");
export const ORTHO_POST_NV_FIELDS = NV_FIELDS("post_nv", "After the intervention");

// ---- Shared pathway and intervention records ------------------------------
export const ORTHO_PATHWAY_FIELDS = [
  inp("who_informed", "Who was informed", { placeholder: "Name / role — on-call surgeon, trauma team leader, anaesthetist" }),
  inp("time_informed", "Time informed", { placeholder: "HH:MM" }),
  inp("decision", "Decision taken and by whom", { placeholder: "Decision, decision-maker and the reasoning recorded" }),
  inp("destination", "Destination and timing", { placeholder: "e.g. theatre 20:15, transfer to tertiary centre, admission to HDU" }),
  opt("capability", "Capability of this unit", [
    "Manageable here",
    "Requires transfer — arranged",
    "Requires transfer — awaiting acceptance",
    "Not assessed",
  ]),
];

export const ORTHO_INTERVENTION_FIELDS = [
  opt("performed", "Urgent intervention performed in this encounter", [
    "Yes — performed here",
    "Yes — performed before arrival",
    "No — planned",
    "No — declined or not indicated (reason documented)",
    "Not yet documented",
  ]),
  inp("procedure", "Intervention", { placeholder: "e.g. four-compartment fasciotomy, debridement, closed reduction, pelvic binder" }),
  inp("time", "Time of intervention", { placeholder: "HH:MM" }),
  inp("operator", "Operator and grade"),
  txt("findings", "Operative / procedural findings"),
  txt("complication", "Complication during the intervention"),
];

// ---- Presentations --------------------------------------------------------
export const ORTHO_TRAUMA_PRESENTATIONS = [
  {
    key: "compartment_syndrome",
    label: "Acute compartment syndrome",
    level: "immediate",
    timeCritical:
      "Decompression is not delayed for a repeat pressure measurement or further observation once the clinical picture is established. The time the diagnosis was considered and the time of decompression are both recorded.",
    escalation:
      "Inform the on-call orthopaedic consultant and the anaesthetist at the time the diagnosis is considered; theatre or transfer is arranged by them and the destination and time are recorded.",
    recognition: [
      "Pain out of proportion to the injury, escalating despite analgesia",
      "Pain on passive stretch of the compartment muscles",
      "Tense, tense-woody compartment on palpation",
      "Paraesthesia in the distribution of the traversing nerve",
      "Pressure at or above the threshold recorded in this note, or a diastolic–compartment difference that is too small",
      "Late signs — pallor, paralysis, absent pulse — must not be waited for",
    ],
    fields: [
      opt("compartment_site", "Compartment(s) assessed", [
        "Anterior leg",
        "Lateral leg",
        "Superficial posterior leg",
        "Deep posterior leg",
        "Thigh",
        "Forearm — volar",
        "Forearm — dorsal",
        "Hand / foot",
        "Other",
      ]),
      inp("pain_score", "Pain score at the time of assessment", { placeholder: "0–10, and the analgesic given" }),
      inp("pressure", "Compartment pressure measured", { placeholder: "mmHg, with the method used" }),
      inp("diastolic", "Diastolic pressure at the time of measurement", { placeholder: "mmHg" }),
      inp("delta", "Pressure difference recorded", { placeholder: "Diastolic minus compartment pressure" }),
      opt("sedation_effect", "Is the examination reliable?", [
        "Awake and reliable",
        "Sedated or intubated — examination unreliable",
        "Regional block in place — examination unreliable",
        "Not documented",
      ]),
      txt("serial", "Repeat assessments and trend", { placeholder: "Time, findings and whether the pressure or the clinical picture changed" }),
    ],
    intervention: [
      inp("fasciotomy_time", "Fasciotomy — time started and completed", { placeholder: "HH:MM" }),
      txt("compartments_released", "Compartments released and their appearance"),
      txt("wound_plan", "Wound management plan until closure", { placeholder: "Negative-pressure dressing, return to theatre interval, closure plan" }),
      txt("decompression", "Non-operative decompression measures documented", { placeholder: "Cast split, bandage divided, limb elevated to heart level — with time" }),
    ],
    requiresReassessment: true,
    references: ["ota_ofc", "ota_trauma_resources", "boast_open_lower_limb", "nice_ng37"],
    note:
      "Compartment syndrome is a clinical diagnosis. The recorded pressure is evidence beside the examination, not a substitute for it, and a normal pressure in an unreliable examination does not exclude the diagnosis.",
  },
  {
    key: "open_fracture",
    label: "Open fracture",
    level: "immediate",
    timeCritical:
      "Antibiotics are given as soon as the open fracture is recognised and debridement is planned without avoidable delay. The time of injury, of the first dose and of the planned debridement are recorded.",
    escalation:
      "Refer to the orthopaedic team on call and, where soft-tissue cover is in doubt, to plastic surgery; who was informed and at what time are recorded.",
    recognition: [
      "Wound communicating with the fracture or the joint",
      "Bone visible, or bone felt in the wound",
      "Any wound over a fracture, however small",
      "High-energy injury with a break in the skin",
    ],
    fields: [
      opt("gustilo", "Gustilo–Anderson grade", ["Grade I", "Grade II", "Grade IIIA", "Grade IIIB", "Grade IIIC", "Not yet classified"]),
      txt("ota_ofc", "OTA-OFC description", { placeholder: "Skin, muscle, arterial and contamination categories" }),
      inp("injury_time", "Time of injury", { placeholder: "HH:MM on the documented date" }),
      inp("antibiotic_time", "First antibiotic — agent and time", { placeholder: "e.g. IV co-amoxiclav 20:05" }),
      inp("tetanus", "Tetanus assessment and action", { placeholder: "Status, and what was given" }),
      inp("coverage", "Wound coverage applied", { placeholder: "Sterile dressing, photograph, splint — and the time" }),
      inp("debridement_planned", "Debridement — time planned and team", { placeholder: "Theatre time, orthoplastic involvement" }),
      opt("contamination", "Contamination", ["Clean", "Contaminated", "Heavily contaminated", "Marine / agricultural", "Not documented"]),
      opt("photo_documented", "Photograph taken before dressing", ["Yes", "No — reason documented", "Not documented"]),
    ],
    intervention: [
      inp("debridement_time", "Debridement — time started", { placeholder: "HH:MM" }),
      txt("debridement_findings", "Debridement findings and soft-tissue documentation"),
      txt("fixation", "Method of stabilisation used"),
      txt("second_look", "Second-look / definitive soft-tissue plan with timing"),
    ],
    requiresReassessment: true,
    references: ["ota_ofc", "boast_open_lower_limb", "lit_gustilo_anderson", "cdc_tetanus"],
    note:
      "The grade describes the injury; the pathway is set by the soft-tissue and vascular status. Tetanus status and the first antibiotic dose belong in the record with their times.",
  },
  {
    key: "severe_soft_tissue",
    label: "Severe soft-tissue injury",
    level: "immediate",
    timeCritical:
      "Soft-tissue viability is judged at the first assessment, and the time of injury, of the first dressing and of the planned surgical review are recorded.",
    escalation:
      "Inform the on-call orthopaedic and plastic surgery teams; where the limb cannot be covered locally, the transfer request and its acceptance are recorded.",
    recognition: [
      "Degloving, avulsion or crush injury",
      "Skin tenting, blistering or a threatened flap over a fracture",
      "Extensive closed soft-tissue damage with swelling",
      "Open wound that cannot be closed primarily",
    ],
    fields: [
      opt("mechanism", "Soft-tissue mechanism", ["Crush", "Degloving", "Avulsion", "Shear", "Burn", "Blast", "Other"]),
      opt("tschorne", "Closed soft-tissue grade (Tscherne)", [
        "Grade 0 — negligible",
        "Grade I — superficial abrasion or contusion",
        "Grade II — deep contusion, imminent skin breakdown",
        "Grade III — extensive skin contusion or crushed tissue",
        "Not applicable — open injury",
        "Not documented",
      ]),
      txt("skin_state", "Skin and subcutaneous state", { placeholder: "Blistering, tenting, capillary refill of the skin, demarcation" }),
      txt("muscle_state", "Muscle state where visible", { placeholder: "Viability, colour, contractility — described, not graded from a photograph" }),
      txt("plastic_plan", "Soft-tissue cover plan and team involved"),
      opt("photo", "Serial photographs for progression", ["Yes — taken and filed", "No — reason documented", "Not documented"]),
    ],
    intervention: [
      inp("debridement_time", "Debridement time"),
      txt("excision", "Tissue excised and the reconstruction plan"),
      txt("dressing", "Dressing / negative-pressure plan and change interval"),
    ],
    requiresReassessment: true,
    references: ["lit_tschorne", "ota_ofc", "boast_open_lower_limb", "lit_mess"],
    note:
      "Soft-tissue severity drives the timing of cover and the choice of fixation. A closed injury with severe soft-tissue damage is recorded as such — not as a simple closed fracture.",
  },
  {
    key: "neurovascular_compromise",
    label: "Neurovascular compromise",
    level: "immediate",
    timeCritical:
      "A new deficit is re-examined immediately and again after any reduction, cast or dressing change; both examination times are recorded.",
    escalation:
      "Inform the on-call orthopaedic consultant and the vascular team without waiting for imaging; who was called and when is recorded.",
    recognition: [
      "Absent or weakly palpable pulse with a cold, mottled or pale limb",
      "New motor or sensory deficit distal to the injury",
      "Expanding swelling with pain and paraesthesia",
      "Disproportionate pain after reduction or splinting",
    ],
    fields: [
      opt("deficit_type", "Nature of the deficit", [
        "Vascular — pulse deficit",
        "Vascular — ischaemic limb",
        "Neurological — motor",
        "Neurological — sensory",
        "Mixed vascular and neurological",
        "Not classified",
      ]),
      inp("abi", "Ankle-brachial / Doppler index", { placeholder: "e.g. 0.6 — with the vessel examined" }),
      txt("nerve_documented", "Nerve(s) involved and the documented distribution"),
      inp("vascular_surgery", "Vascular team informed — who and when"),
      txt("reduction_effect", "Effect of reduction, splinting or cast splitting on the deficit", {
        placeholder: "Findings before and after, with times — this is the record that matters",
      }),
      opt("limb_viability", "Limb viability at the time of assessment", [
        "Viable",
        "Threatened — reversible",
        "Non-viable — documented findings",
        "Not documented",
      ]),
    ],
    intervention: [
      inp("reduction_time", "Reduction / cast split — time"),
      txt("post_intervention", "Post-intervention status and who reassessed"),
      txt("escalation", "Onward escalation and destination"),
    ],
    requiresReassessment: true,
    references: ["ota_trauma_resources", "atls", "nice_ng37", "boast_open_lower_limb"],
    note:
      "A neurovascular deficit is documented before and after every intervention. 'Pulse present' alone is not a neurovascular examination.",
  },
  {
    key: "vascular_injury",
    label: "Vascular injury",
    level: "immediate",
    timeCritical:
      "Haemorrhage control and vascular assessment are not delayed for imaging; tourniquet or pressure times and the time of vascular review are recorded.",
    escalation:
      "Call the vascular surgeon and activate the major haemorrhage pathway at once; the time of the call and the destination agreed are recorded.",
    recognition: [
      "Hard signs — pulsatile bleeding, expanding haematoma, bruit or thrill, absent pulse, ischaemic limb",
      "Soft signs with a penetrating injury near a vessel",
      "Discrepancy between the injury and the perfusion of the limb",
      "Open fracture with an arterial injury (Gustilo–Anderson IIIC)",
    ],
    fields: [
      opt("hard_signs", "Hard signs of vascular injury", [
        "None",
        "Pulsatile bleeding",
        "Expanding haematoma",
        "Bruit or thrill",
        "Absent distal pulse",
        "Ischaemic limb",
        "Multiple",
      ]),
      inp("cta", "CT angiography / duplex — performed, time and result", { placeholder: "Investigation actually performed, not assumed" }),
      inp("abi_value", "Doppler index on the injured and uninjured limb"),
      inp("ischemia_time", "Time ischaemia started", { placeholder: "HH:MM" }),
      inp("repair_plan", "Vascular repair plan and team", { placeholder: "Repair, shunt, ligation, transfer — and who decided" }),
      txt("mess", "Mangled Extremity Severity Score components", {
        placeholder: "Skeletal/soft-tissue, limb ischaemia, shock, age — recorded as components, never used alone to decide amputation",
      }),
      opt("amputation_discussion", "Amputation discussed", [
        "Not applicable — limb salvageable",
        "Discussed with the patient and family",
        "Not discussed — reason documented",
        "Not documented",
      ]),
    ],
    intervention: [
      inp("revascularisation_time", "Revascularisation — time and procedure"),
      txt("shunt_plan", "Shunt / temporary measure and the definitive plan"),
      inp("fasciotomy_performed", "Prophylactic fasciotomy performed", { placeholder: "Yes/No with time" }),
    ],
    requiresReassessment: true,
    references: ["lit_mess", "boast_open_lower_limb", "atls", "ota_trauma_resources"],
    note:
      "Limb salvage is a consultant-level multidisciplinary decision. No score, including MESS, decides it on its own, and the record must show the discussion rather than a number.",
  },
  {
    key: "unstable_pelvis",
    label: "Unstable pelvic injury",
    level: "immediate",
    timeCritical:
      "Mechanical stabilisation and haemorrhage control come before definitive imaging; the time of binder or fixation and of the first transfusion are recorded.",
    escalation:
      "Activate the trauma team and the major haemorrhage protocol; who led, who was informed and the destination (theatre, interventional radiology or transfer) are recorded.",
    recognition: [
      "Haemodynamic instability with a pelvic injury",
      "Mechanism of high energy — lateral compression, anteroposterior compression, vertical shear",
      "Pain on pelvic springing with an unstable ring",
      "Blood at the urethral meatus, perineal or scrotal haematoma",
      "Neurological deficit in the lower limbs with a pelvic injury",
    ],
    fields: [
      opt("tile", "Tile classification", ["Type A — stable", "Type B — rotationally unstable", "Type C — rotationally and vertically unstable", "Not classified"]),
      opt("young_burgess", "Young–Burgess type", ["APC", "Lateral compression", "Vertical shear", "Combined mechanism", "Not classified"]),
      inp("binder_time", "Pelvic binder / sheet applied — time"),
      opt("haemodynamics", "Haemodynamic state", ["Stable", "Transient responder", "Non-responder", "Not documented"]),
      inp("transfusion", "Blood products given", { placeholder: "Units and times — major haemorrhage protocol activation" }),
      txt("haemorrhage_control", "Haemorrhage control pathway", { placeholder: "Angio-embolisation, pelvic packing, REBOA — decision and times" }),
      opt("urogenital", "Urogenital assessment", [
        "No sign of injury documented",
        "Blood at meatus — urology involved",
        "Retained urine / catheter not attempted",
        "Not assessed",
      ]),
      opt("rectal", "Rectal and perineal assessment", ["Performed — no injury", "Performed — injury documented", "Not performed — reason documented"]),
      inp("definitive", "Definitive stabilisation plan and timing"),
    ],
    intervention: [
      inp("stabilisation_time", "Stabilisation — time and method", { placeholder: "Binder, external fixator, packing, angio-embolisation" }),
      txt("imaging", "Imaging obtained and findings"),
      txt("transfer", "Transfer or admission decision"),
    ],
    requiresReassessment: true,
    references: ["atls", "wses_pelvis", "lit_tile", "lit_young_burgess"],
    note:
      "Exsanguinating pelvic injury is a resuscitation problem first. The classification is recorded, but the record must show the haemorrhage-control sequence and its times.",
  },
  {
    key: "polytrauma",
    label: "Major associated trauma (polytrauma)",
    level: "immediate",
    timeCritical:
      "The primary survey is documented with its times, and treatment of the limb never delays treatment of an airway, breathing or circulation problem.",
    escalation:
      "Hand over to the trauma team leader; the time of handover and the destination agreed for each injured region are recorded.",
    recognition: [
      "Two or more body regions injured, one of them life-threatening",
      "Physiological derangement — shock, hypoxia, reduced consciousness",
      "High-energy mechanism with an obvious major injury",
      "Orthopaedic injury in a patient who is not physiologically stable",
    ],
    fields: [
      inp("iss", "Injury Severity Score", { placeholder: "Calculated from the AIS of the three most severely injured regions" }),
      txt("regions", "Injured regions and their AIS", { placeholder: "Head/neck, face, chest, abdomen, extremities, external" }),
      opt("physiology", "Physiological state", ["Stable", "Borderline", "Unstable", "In extremis", "Not documented"]),
      txt("primary_survey", "Primary survey findings", { placeholder: "Airway, breathing, circulation, disability, exposure — with the times" }),
      txt("damage_control", "Damage-control decision", { placeholder: "Early total care, damage-control orthopaedics, staged plan — and who decided" }),
      inp("team", "Trauma team leader and specialties involved"),
      txt("priorities", "Sequence of operative priorities"),
      inp("icu", "Critical care destination and timing"),
    ],
    intervention: [
      inp("first_operation", "First operation, time and procedure"),
      txt("staging", "Staging plan and the physiological triggers for it"),
      txt("reassessment", "Reassessment after each stage"),
    ],
    requiresReassessment: true,
    references: ["atls", "lit_iss", "ota_trauma_resources", "east_vte_trauma"],
    note:
      "The orthopaedic plan is subordinate to resuscitation. The record states which strategy was chosen and on what physiological grounds.",
  },
  {
    key: "spinal_cord_injury",
    label: "Spinal cord injury",
    level: "immediate",
    timeCritical:
      "Immobilisation and neuroprotection begin at the first assessment; the time of injury, of immobilisation and of the specialist referral are recorded.",
    escalation:
      "Inform the spine surgeon or the regional spinal injuries unit immediately; the time of referral and whether the patient was accepted are recorded.",
    recognition: [
      "Motor or sensory deficit below an injury level",
      "Neurogenic shock — hypotension with bradycardia",
      "Priapism, loss of anal tone, bulbocavernosus reflex absent",
      "High-energy mechanism with spinal pain or tenderness",
      "Reduced consciousness or intoxication making the examination unreliable",
    ],
    fields: [
      inp("level", "Neurological level of injury"),
      opt("asia", "ASIA / AIS grade", ["A — complete", "B — sensory incomplete", "C — motor incomplete", "D — motor incomplete", "E — normal", "Not yet documented"]),
      txt("motor_sensory", "Motor and sensory examination", { placeholder: "Key muscles and dermatomes tested, sacral sparing" }),
      opt("sacral", "Sacral sparing", ["Present", "Absent", "Not assessed"]),
      opt("restriction", "Spinal motion restriction", ["Collar and blocks in place", "Removed after clearance", "Not applied — reason documented", "Not documented"]),
      inp("clearance", "Spinal clearance decision — who and when", { placeholder: "Clinical or radiological clearance, and by whom" }),
      inp("imaging", "Imaging performed and findings"),
      txt("spine_plan", "Spine team referral and plan", { placeholder: "Who was referred to, when, and the decision" }),
      opt("neurogenic_shock", "Neurogenic shock", ["Present — managed", "Absent", "Not assessed"]),
    ],
    intervention: [
      inp("reduction_time", "Reduction / immobilisation of the spinal column — time"),
      txt("surgery", "Surgical plan, timing and team"),
      txt("rehab", "Early rehabilitation and specialist centre referral"),
    ],
    requiresReassessment: true,
    references: ["nice_ng41", "boast_spinal_clearance", "aospine_tl", "aospine_subaxial", "atls"],
    note:
      "A normal plain film does not clear the spine in an unreliable examination. Cord injury is documented by level, grade and sacral sparing, not by 'weak legs'.",
  },
  {
    key: "cauda_equina",
    label: "Cauda equina syndrome",
    level: "immediate",
    timeCritical:
      "Decompression is time-sensitive: the time of the first symptoms, of this assessment and of the MRI request are recorded, and imaging is not delayed by conservative measures.",
    escalation:
      "Inform the on-call spine surgeon at the time the diagnosis is suspected; who was informed and the time of the call are recorded.",
    recognition: [
      "Saddle anaesthesia",
      "Bladder dysfunction — retention, incontinence, loss of awareness of fullness",
      "Bowel dysfunction — reduced sensation or incontinence",
      "Bilateral sciatica or bilateral leg weakness",
      "Progressive neurological deficit with back pain",
    ],
    fields: [
      txt("red_flags", "Red flags documented with times", { placeholder: "Saddle sensation, bladder and bowel function, bilateral symptoms — each with the time it was recorded" }),
      opt("bladder", "Bladder function", ["Normal", "Retention", "Incontinence", "Reduced awareness of fullness", "Not assessed"]),
      inp("post_void", "Post-void residual, if measured"),
      opt("saddle", "Saddle sensation", ["Normal", "Reduced", "Absent", "Not assessed"]),
      inp("mri", "MRI — requested time and performed time", { placeholder: "Time requested, time performed, result" }),
      inp("referral_time", "Spine surgery informed — who and when"),
      opt("category", "Cauda equina category recorded", [
        "CESS — suspected, with red flags and no objective signs",
        "CESI — incomplete, objective signs",
        "CESR — retention with overflow",
        "Not documented",
      ]),
      txt("consent_timing", "Discussion with the patient and the timing of any delay explained"),
    ],
    intervention: [
      inp("decompression_time", "Decompression — time and team"),
      txt("catheter", "Bladder management", { placeholder: "Catheter, intermittent self-catheterisation, teaching given" }),
      txt("prognosis", "Prognosis discussion and follow-up"),
    ],
    requiresReassessment: false,
    references: ["nice_ng41", "boast_spinal_clearance", "aospine_tl"],
    note:
      "Cauda equina syndrome is time-critical. The record must show when each red flag was documented and when imaging and the spine team were engaged — the delay, if any, is part of the record.",
  },
  {
    key: "septic_arthritis",
    label: "Septic arthritis",
    level: "same_day",
    timeCritical:
      "Joint aspiration and antibiotics are arranged on the same day the diagnosis is suspected; the times of aspiration, of the first dose and of surgical washout are recorded.",
    escalation:
      "Inform the on-call orthopaedic team and microbiology the same day; who was informed and the time of the call are recorded.",
    recognition: [
      "Hot, swollen, exquisitely painful joint with reluctance to move it",
      "Fever or systemic upset with a joint effusion",
      "Recent joint procedure, injection or penetrating injury",
      "Prosthetic joint with pain and effusion",
    ],
    fields: [
      inp("joint", "Joint involved"),
      opt("systemic", "Systemic features", ["Febrile", "Afebrile", "Septic physiology", "Not documented"]),
      inp("aspiration", "Aspiration — performed, time and appearance", { placeholder: "Fluid appearance, cell count, crystals, Gram stain, culture" }),
      inp("antibiotics", "Antibiotics — agent, dose and time", { placeholder: "Recorded with the time, and whether aspiration preceded it" }),
      inp("inflammatory", "Inflammatory markers and blood cultures", { placeholder: "CRP, WBC with times; culture bottles taken" }),
      opt("drainage", "Joint drainage plan", ["Aspiration only — repeat planned", "Arthroscopic washout planned", "Arthrotomy planned", "Not documented"]),
      txt("microbiology", "Microbiology and infectious diseases involvement"),
      txt("differential", "Alternative diagnoses considered", { placeholder: "Crystal arthropathy, inflammatory flare, haemarthrosis" }),
    ],
    intervention: [
      inp("washout_time", "Washout / drainage — time"),
      txt("washout_findings", "Operative findings and samples sent"),
      txt("antibiotic_review", "Antibiotic review plan with microbiology"),
    ],
    requiresReassessment: false,
    references: ["bsac_septic_arthritis", "idsa_pji"],
    note:
      "A native joint is aspirated before antibiotics where the patient is stable; the record states which came first and why.",
  },
  {
    key: "osteomyelitis",
    label: "Osteomyelitis",
    level: "same_day",
    timeCritical:
      "Deep cultures are taken before antibiotics where the patient is stable, and surgical review takes place the same day; the times of sampling, of the first dose and of review are recorded.",
    escalation:
      "Refer to the orthopaedic team and microbiology the same day; the time of referral and the plan agreed are recorded.",
    recognition: [
      "Deep, unremitting bone pain with systemic features",
      "Draining sinus or a wound that will not heal over bone",
      "Infected implant with loosening or pain",
      "Diabetic foot infection reaching bone",
      "Vertebral infection with back pain and fever",
    ],
    fields: [
      inp("bone", "Bone and segment involved"),
      opt("acuity", "Acuity", ["Acute", "Chronic", "Acute on chronic", "Implant-associated", "Not documented"]),
      opt("implant", "Implant involved", ["None", "Plate / screws", "Intramedullary nail", "Arthroplasty", "External fixator", "Spinal implant"]),
      txt("samples", "Samples taken", { placeholder: "Deep tissue versus swab, number of samples, bone biopsy, with times" }),
      inp("imaging", "Imaging performed and findings"),
      txt("antibiotics", "Antibiotic plan and duration", { placeholder: "Agent, route, planned duration, review point — with microbiology input" }),
      txt("surgical_plan", "Surgical plan", { placeholder: "Debridement, implant retention or removal, dead-space management" }),
      opt("sinus", "Sinus or wound", ["None", "Draining sinus", "Chronic wound over bone", "Not documented"]),
    ],
    intervention: [
      inp("debridement_time", "Debridement — time"),
      txt("debridement_findings", "Findings and tissue sent"),
      txt("stability", "Stability decision after debridement"),
    ],
    requiresReassessment: false,
    references: ["idsa_nvo", "idsa_pji"],
    note:
      "A superficial swab is not a bone culture. The record states the tissue sampled and how many samples were taken.",
  },
  {
    key: "fat_embolism",
    label: "Fat embolism syndrome",
    level: "immediate",
    timeCritical:
      "Supportive treatment and the search for the alternative diagnosis — pulmonary embolism, sepsis, transfusion reaction — begin when the syndrome is suspected, and their times are recorded.",
    escalation:
      "Inform the anaesthetist and critical care immediately; the time of the call and the level of care the patient was moved to are recorded.",
    recognition: [
      "Hypoxia and breathlessness after long-bone or pelvic fracture",
      "Confusion or a falling level of consciousness without head injury",
      "Petechial rash over the chest, axillae or conjunctivae",
      "Onset typically after a latent interval following the injury",
    ],
    fields: [
      inp("onset", "Onset — date and time and the interval from injury"),
      inp("spo2", "Oxygen saturation and respiratory support", { placeholder: "SpO2, respiratory rate, oxygen device and flow" }),
      opt("respiratory", "Respiratory features", ["Hypoxia", "Tachypnoea", "ARDS picture", "None documented"]),
      opt("cerebral", "Cerebral features", ["Confusion", "Reduced consciousness", "Agitation", "None documented"]),
      opt("petechiae", "Petechial rash", ["Present", "Absent", "Not examined"]),
      txt("differential", "Alternative diagnoses excluded", { placeholder: "Pulmonary embolism, pneumonia, sepsis, head injury, transfusion reaction" }),
      txt("support", "Supportive management recorded", { placeholder: "Oxygen, ventilation, fluids, critical care — recorded as supportive, not as a specific therapy" }),
      inp("fracture_stabilised", "Long-bone fracture stabilised — time"),
    ],
    intervention: [
      inp("icu_time", "Critical care — time of admission / review"),
      txt("ventilation", "Ventilatory support and response"),
      txt("review", "Reassessment and outcome"),
    ],
    requiresReassessment: false,
    references: ["lit_gurd_wilson"],
    note:
      "There is no confirmatory test and no specific therapy for fat embolism syndrome. The record documents the criteria, the exclusions and the supportive care — never a treatment that does not exist.",
  },
  {
    key: "postop_infection",
    label: "Post-operative infection",
    level: "same_day",
    timeCritical:
      "Wound review, cultures and the decision on surgical management are made the same day; the time the wound was first noted and the time of review are recorded.",
    escalation:
      "Inform the operating surgeon and microbiology the same day; who was informed and the plan for theatre are recorded.",
    recognition: [
      "Wound discharge, spreading cellulitis or dehiscence",
      "Fever, rigors or systemic upset after surgery",
      "Increasing pain, swelling or stiffness in the operated site",
      "Wound that fails to dry or a persistent sinus after fixation",
    ],
    fields: [
      inp("postop_day", "Post-operative day"),
      opt("wound", "Wound appearance", [
        "Clean and dry",
        "Serous discharge",
        "Purulent discharge",
        "Cellulitis",
        "Dehiscence",
        "Abscess / collection",
      ]),
      inp("swab", "Swab or aspirate — taken, time and result"),
      inp("inflammatory", "CRP / WBC trend with times"),
      txt("antibiotics", "Antibiotics started — agent, dose, time and who decided"),
      opt("implant_decision", "Implant decision", [
        "Retained — plan documented",
        "Removal planned",
        "Removal performed",
        "Not applicable",
        "Not yet decided",
      ]),
      txt("return_theatre", "Return to theatre decision", { placeholder: "Washout, debridement, implant exchange — decision, timing and decision-maker" }),
      txt("microbiology", "Microbiology and infectious diseases input"),
    ],
    intervention: [
      inp("washout_time", "Washout — time"),
      txt("washout_findings", "Findings and tissue sent"),
      txt("followup", "Antibiotic duration and follow-up plan"),
    ],
    requiresReassessment: false,
    references: ["idsa_pji", "aaos_pji_dental"],
    note:
      "A superficial swab does not diagnose deep infection. The record distinguishes superficial from deep, states the samples taken and who made the return-to-theatre decision.",
  },
  {
    key: "thromboembolism",
    label: "Thromboembolic complication",
    level: "same_day",
    timeCritical:
      "Anticoagulation and imaging are arranged the same day the diagnosis is suspected, after the bleeding risk is documented; the times of the request and of the first dose are recorded.",
    escalation:
      "Inform the treating team and, where there is haemodynamic compromise, critical care immediately; who was informed and when are recorded.",
    recognition: [
      "Unilateral calf pain, swelling or tenderness",
      "Sudden breathlessness, pleuritic pain, tachycardia or hypoxia",
      "Unexplained low-grade fever or tachycardia after surgery",
      "Collapse with hypoxia after immobilisation",
    ],
    fields: [
      opt("presentation", "Presentation", ["Suspected DVT", "Suspected PE", "Confirmed DVT", "Confirmed PE", "Not classified"]),
      opt("prophylaxis_state", "Prophylaxis status at the time", [
        "Pharmacological prophylaxis in place",
        "Mechanical only",
        "Contraindicated — documented",
        "Not prescribed",
      ]),
      inp("imaging", "Duplex / CTPA — requested and performed times, findings"),
      inp("anticoagulation", "Therapeutic anticoagulation — agent, dose and time"),
      inp("bleeding_risk", "Bleeding risk assessment", { placeholder: "Surgical site, haemoglobin, anticoagulant interaction" }),
      txt("haematology", "Haematology / thrombosis team input and duration plan"),
      txt("reassessment", "Reassessment after starting treatment"),
    ],
    intervention: [
      inp("treatment_time", "Treatment started — time"),
      txt("monitoring", "Monitoring plan", { placeholder: "Platelets, renal function, haemoglobin, wound check" }),
      txt("duration_plan", "Planned duration and review point"),
    ],
    requiresReassessment: false,
    references: ["nice_ng89", "east_vte_trauma", "aaos_vte_arthroplasty"],
    note:
      "Prophylaxis is an individual decision documented with its bleeding and clotting risk — not a default that is assumed because a protocol exists.",
  },
];

export const ORTHO_TRAUMA_MAP = ORTHO_TRAUMA_PRESENTATIONS.reduce((acc, p) => {
  acc[p.key] = p;
  return acc;
}, {});

// ---- Red flags ------------------------------------------------------------
export const ORTHO_RED_FLAGS = [
  { key: "escalating_pain", label: "Pain escalating despite adequate analgesia", level: "immediate" },
  { key: "tense_swelling", label: "Tense swelling with pain on passive stretch", level: "immediate" },
  { key: "pulseless_limb", label: "Pulseless or ischaemic limb", level: "immediate" },
  { key: "new_deficit", label: "New motor or sensory deficit", level: "immediate" },
  { key: "saddle_anaesthesia", label: "Saddle anaesthesia or bladder / bowel dysfunction", level: "immediate" },
  { key: "unstable_pelvis_flag", label: "Haemodynamic instability with pelvic or femoral injury", level: "immediate" },
  { key: "fever_joint", label: "Hot swollen joint with fever", level: "urgent" },
  { key: "wound_deterioration", label: "Wound discharge, dehiscence or spreading cellulitis", level: "urgent" },
  { key: "unexplained_deterioration", label: "Breathlessness, confusion or hypoxia after injury or surgery", level: "immediate" },
  { key: "cast_too_tight", label: "Cast or splint that feels too tight, with numbness or swelling", level: "immediate" },
];

export const ORTHO_RED_FLAG_STATES = [
  "No red flag documented — examination documented above",
  "Red flags documented — see below",
  "Not assessed",
];

// ---- State ---------------------------------------------------------------
export const emptyOrthoTrauma = () => ({
  none_documented: false,
  not_assessed: false,
  red_flag_state: "",
  red_flags: [],
  presentations: [],
  blocks: {},
});

export const orthoTraumaState = (value) => {
  const base = emptyOrthoTrauma();
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  return {
    ...base,
    ...value,
    red_flags: Array.isArray(value.red_flags) ? value.red_flags : [],
    presentations: Array.isArray(value.presentations) ? value.presentations : [],
    blocks: value.blocks && typeof value.blocks === "object" && !Array.isArray(value.blocks) ? value.blocks : {},
  };
};

export const orthoTraumaLevelOrder = (key) =>
  ORTHO_TRAUMA_LEVELS[ORTHO_TRAUMA_MAP[key]?.level]?.order ?? 9;

export const selectedPresentations = (value) =>
  orthoTraumaState(value).presentations.filter((k) => Boolean(ORTHO_TRAUMA_MAP[k]));

// ---- Completeness checks -------------------------------------------------
const str = (v) => String(v ?? "").trim();

const blockOf = (state, key) => state.blocks[key] || {};

// What the record still owes. Returned as a list so the panel can show it and the
// printed record can carry it — never a silent pass.
export const orthoTraumaIssues = (value) => {
  const state = orthoTraumaState(value);
  const issues = [];
  const hasState =
    state.none_documented ||
    state.not_assessed ||
    state.presentations.length > 0 ||
    state.red_flags.length > 0 ||
    str(state.red_flag_state) !== "";

  if (!hasState) {
    issues.push({
      key: "no_state",
      level: "documented",
      message:
        "No trauma-emergency statement recorded. Record the presentations considered, or state explicitly that none was documented and that the examination supports it.",
    });
  }

  if (state.none_documented && state.presentations.length > 0) {
    issues.push({
      key: "contradiction",
      level: "documented",
      message: "The record states that no emergency was documented and also records one or more presentations — resolve the contradiction.",
    });
  }

  if (str(state.red_flag_state) === ORTHO_RED_FLAG_STATES[0] && state.red_flags.length > 0) {
    issues.push({
      key: "red_flag_contradiction",
      level: "documented",
      message: "Red flags are both stated as absent and recorded — correct the record.",
    });
  }

  state.presentations.forEach((key) => {
    const spec = ORTHO_TRAUMA_MAP[key];
    if (!spec) return;
    const block = blockOf(state, key);
    const pathway = block.pathway || {};
    const intervention = block.intervention || {};
    if (!str(pathway.who_informed) || !str(pathway.time_informed)) {
      issues.push({
        key: `${key}_pathway`,
        level: spec.level,
        message: `${spec.label}: the time-critical pathway is incomplete — who was informed and at what time must be recorded.`,
      });
    }
    const performed = str(intervention.performed);
    if (performed.startsWith("Yes")) {
      if (!str(intervention.time)) {
        issues.push({
          key: `${key}_intervention_time`,
          level: spec.level,
          message: `${spec.label}: an urgent intervention is recorded without its time.`,
        });
      }
      if (spec.requiresReassessment) {
        const post = block.post_nv || {};
        if (!str(post.post_nv_time) || !str(post.post_nv_pulses) || str(post.post_nv_pulses) === "Not documented") {
          issues.push({
            key: `${key}_post_nv`,
            level: spec.level,
            message: `${spec.label}: no post-intervention neurovascular reassessment is recorded.`,
          });
        }
        const pre = block.pre_nv || {};
        if (!str(pre.pre_nv_time)) {
          issues.push({
            key: `${key}_pre_nv`,
            level: spec.level,
            message: `${spec.label}: no pre-intervention neurovascular assessment time is recorded.`,
          });
        }
      }
    }
  });

  if (state.red_flags.length > 0) {
    const anyPathway = state.presentations.some((key) => str(blockOf(state, key).pathway?.who_informed));
    if (!anyPathway) {
      issues.push({
        key: "red_flag_pathway",
        level: "immediate",
        message: "A red flag is recorded with no documented escalation — record who was informed, at what time and the decision taken.",
      });
    }
  }

  return issues;
};

export const orthoTraumaReferences = (value) => {
  const keys = [];
  selectedPresentations(value).forEach((key) => {
    (ORTHO_TRAUMA_MAP[key].references || []).forEach((r) => keys.push(r));
  });
  return orthoReferencesFor(keys);
};

// ---- Print ---------------------------------------------------------------
const flagLine = (v) => (str(v) ? str(v) : "NOT DOCUMENTED");

export const formatOrthoTrauma = (value) => {
  if (!value || typeof value !== "object") return "";
  const state = orthoTraumaState(value);
  const lines = [];

  if (state.not_assessed) lines.push("Trauma-emergency assessment: NOT ASSESSED at the time of this note.");
  if (state.none_documented) {
    lines.push(
      "Life- and limb-threatening orthopaedic presentations: none documented in this encounter. This statement rests on the examination recorded in the note."
    );
  }

  if (str(state.red_flag_state)) lines.push(`Red flags: ${state.red_flag_state}`);
  if (state.red_flags.length) {
    lines.push("Red flags recorded:");
    state.red_flags.forEach((key) => {
      const flag = ORTHO_RED_FLAGS.find((f) => f.key === key);
      lines.push(`   • ${flag ? flag.label : key}`);
    });
  }

  selectedPresentations(value).forEach((key) => {
    const spec = ORTHO_TRAUMA_MAP[key];
    const block = blockOf(state, key);
    lines.push(`\n${spec.label.toUpperCase()} — ${ORTHO_TRAUMA_LEVELS[spec.level].label.toLowerCase()}`);
    lines.push(`   Time-critical: ${spec.timeCritical}`);
    lines.push(`   Escalation: ${spec.escalation}`);
    const docs = block.docs || {};
    spec.fields.forEach((f) => {
      if (str(docs[f.key])) lines.push(`   ${f.label}: ${str(docs[f.key])}`);
    });
    if (spec.intervention) {
      const intervention = block.intervention || {};
      spec.intervention.forEach((f) => {
        if (str(intervention[f.key])) lines.push(`   ${f.label}: ${str(intervention[f.key])}`);
      });
      if (str(intervention.performed)) lines.push(`   Intervention performed: ${str(intervention.performed)}`);
    }
    const pathway = block.pathway || {};
    lines.push(
      `   Time-critical pathway: informed ${flagLine(pathway.who_informed)} at ${flagLine(pathway.time_informed)}; decision ${flagLine(
        pathway.decision,
      )}; destination ${flagLine(pathway.destination)}; capability ${flagLine(pathway.capability)}`
    );
    if (spec.requiresReassessment) {
      const pre = block.pre_nv || {};
      const post = block.post_nv || {};
      lines.push(
        `   Neurovascular before the intervention (${flagLine(pre.pre_nv_time)}): pulses ${flagLine(pre.pre_nv_pulses)}, motor ${flagLine(
          pre.pre_nv_motor,
        )}, sensation ${flagLine(pre.pre_nv_sensation)}`
      );
      lines.push(
        `   Neurovascular after the intervention (${flagLine(post.post_nv_time)}): pulses ${flagLine(post.post_nv_pulses)}, motor ${flagLine(
          post.post_nv_motor,
        )}, sensation ${flagLine(post.post_nv_sensation)}`
      );
    }
    lines.push(`   Note: ${spec.note}`);
  });

  const issues = orthoTraumaIssues(value);
  if (issues.length) {
    lines.push("\nDocumentation still owed:");
    issues.forEach((i) => lines.push(`   — ${i.message}`));
  }

  return lines.join("\n").trim();
};