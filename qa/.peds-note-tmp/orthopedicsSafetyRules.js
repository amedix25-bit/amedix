// Orthopedics & Traumatology — patient-safety prompts.
//
// A prompt appears only when this encounter recorded something that raises it: an
// open injury, a compartment finding, a distal deficit, a red flag, an implant
// problem, a medication that changes surgical risk, or a concern the clinician
// ticked. Nothing is inferred from an empty field, and an empty panel states that
// it is not reassurance.
//
// A prompt never diagnoses, never orders imaging, antibiotics or thromboprophylaxis,
// never reduces or immobilises anything and never changes a plan. It records what
// was documented, the threshold or classification that was crossed, the escalation
// the cited source describes, and the action the clinician actually took.
//
// ATTRIBUTION: AAOS and OTA are cited only where they publish on the question.
// Everything else is labelled with the body that actually publishes it (CDC for
// tetanus) or as an AMedix local decision that requires Orthopedics approval —
// never dressed up as a society guideline.

import { ORTHO_TRAUMA_MAP } from "./orthopedicsTrauma.js";
import { ORTHO_HEALING_STATE_MAP, orthoHealingState } from "./orthopedicsManagement.js";
import { orthoReferencesFor } from "./orthopedicsReferences.js";

export const ORTHO_SAFETY_PROVENANCE = {
  aaos_guideline: "AAOS guideline",
  ota_standard: "OTA reference standard",
  complementary: "Complementary guideline",
  standard: "National or society standard",
  literature: "Primary literature",
  local: "AMedix local decision — requires Orthopedics approval",
};

const AAOS = {
  organization: "AAOS",
  title: "AAOS Clinical Practice Guidelines and Appropriate Use Criteria",
  edition: "current edition",
  url: "https://www.aaos.org/quality/",
};

const AAOS_VTE = {
  organization: "AAOS",
  title: "Prevention of Venous Thromboembolic Disease in Patients Undergoing Elective Hip and Knee Arthroplasty",
  edition: "clinical practice guideline, reaffirmed",
  url: "https://www.aaos.org/quality/",
};

const OTA = {
  organization: "OTA",
  title: "Orthopaedic Trauma Association — open fracture classification (OTA-OFC) and trauma resources",
  edition: "OTA Open Fracture Classification",
  url: "https://ota.org/",
};

const CDC_TETANUS = {
  organization: "CDC",
  title: "Tetanus vaccination and wound management guidance",
  edition: "current adult immunisation schedule",
  url: "https://www.cdc.gov/vaccines/vpd/tetanus/",
};

// Sources taken from the condition register, so the prompt and the note cite the
// same document and the same edition.
const conditionalSource = (key) => {
  const r = orthoReferencesFor([key])[0];
  return r ? { organization: r.organization, title: r.title, edition: r.edition, url: r.url } : null;
};

const WSES = conditionalSource("wses_pelvis");
const NICE_SPINAL = conditionalSource("nice_ng41");
const NICE_VTE = conditionalSource("nice_ng89");
const GURD_WILSON = conditionalSource("lit_gurd_wilson");
const BSAC = conditionalSource("bsac_septic_arthritis");
const IDSA_NVO = conditionalSource("idsa_nvo");
const IDSA_PJI = conditionalSource("idsa_pji");
const FDA_NONUNION = conditionalSource("lit_fda_nonunion");

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------
export const ORTHO_SAFETY_THRESHOLDS = [
  {
    key: "compartment_pressure_abs",
    label: "Compartment pressure raising concern",
    value: 30,
    unit: "mmHg",
    basis:
      "Absolute compartment pressure used in the widely taught diagnostic criteria for compartment syndrome. The published criteria are not a substitute for the clinical picture, and the level used in this unit is a local decision.",
    provenance: "local",
    source: null,
  },
  {
    key: "compartment_delta",
    label: "Diastolic pressure minus compartment pressure",
    value: 30,
    unit: "mmHg",
    basis:
      "Pressure difference below which compartment syndrome must be excluded. Recorded and printed beside the prompt; the local protocol governs.",
    provenance: "local",
    source: null,
  },
  {
    key: "tetanus_booster_years",
    label: "Tetanus booster interval",
    value: 10,
    unit: "years",
    basis:
      "Primary series plus a booster every ten years; a contaminated or open wound is managed according to the documented vaccination history.",
    provenance: "complementary",
    source: CDC_TETANUS,
  },
];

export const ORTHO_SAFETY_THRESHOLD_MAP = ORTHO_SAFETY_THRESHOLDS.reduce((acc, t) => {
  acc[t.key] = t.value;
  return acc;
}, {});

const mergeThresholds = (override) => {
  const out = { ...ORTHO_SAFETY_THRESHOLD_MAP };
  if (override && typeof override === "object") {
    Object.entries(override).forEach(([key, raw]) => {
      const n = Number(String(raw ?? "").trim());
      if (key in out && String(raw ?? "").trim() !== "" && Number.isFinite(n)) out[key] = n;
    });
  }
  return out;
};

// ---------------------------------------------------------------------------
// Concerns
// ---------------------------------------------------------------------------
export const ORTHO_SAFETY_CONCERNS = [
  { key: "open_fracture", label: "Open fracture or open joint injury", level: "immediate" },
  { key: "compartment_syndrome", label: "Suspected compartment syndrome", level: "immediate" },
  { key: "neurovascular_deficit", label: "Distal vascular or neurological deficit", level: "immediate" },
  { key: "unreduced_dislocation", label: "Dislocation or fracture-dislocation not yet reduced", level: "immediate" },
  { key: "cauda_equina", label: "Spinal injury with cord or cauda equina red flags", level: "immediate" },
  { key: "bone_joint_infection", label: "Suspected bone or joint infection", level: "same_day" },
  { key: "anticoagulation", label: "Anticoagulant or antiplatelet therapy affecting injury or surgery", level: "same_day" },
  { key: "tetanus", label: "Open wound with tetanus status not up to date", level: "same_day" },
  { key: "vte_prophylaxis", label: "Thromboprophylaxis not prescribed after major lower-limb surgery", level: "same_day" },
  { key: "postop_complication", label: "Documented post-operative complication (wound, hardware, union)", level: "same_day" },
  // Raised from the trauma-emergency panel and the healing assessment, so the
  // prompts follow what the note actually recorded for each presentation.
  { key: "vascular_injury", label: "Vascular injury or ischaemic limb", level: "immediate" },
  { key: "unstable_pelvis", label: "Unstable pelvic injury with haemodynamic concern", level: "immediate" },
  { key: "spinal_cord_injury", label: "Spinal cord injury", level: "immediate" },
  { key: "severe_soft_tissue", label: "Severe soft-tissue injury threatening cover or viability", level: "immediate" },
  { key: "fat_embolism", label: "Suspected fat embolism syndrome", level: "immediate" },
  { key: "septic_arthritis", label: "Suspected septic arthritis", level: "same_day" },
  { key: "osteomyelitis", label: "Suspected osteomyelitis", level: "same_day" },
  { key: "postop_infection", label: "Post-operative surgical-site infection", level: "same_day" },
  { key: "thromboembolism", label: "Suspected venous thromboembolism", level: "same_day" },
  { key: "union_complication", label: "Delayed union, nonunion or malunion recorded", level: "same_day" },
];

// The presentations documented in this note's trauma panel.
const traumaPresentations = (v) => {
  const panel = v && typeof v.ortho_trauma === "object" && !Array.isArray(v.ortho_trauma) ? v.ortho_trauma : {};
  return Array.isArray(panel.presentations) ? panel.presentations : [];
};
const hasTrauma = (v, key) => traumaPresentations(v).includes(key);

const SPECS = {
  open_fracture: {
    title: "Open fracture documented — record the grade, the antibiotics and the debridement plan",
    basis:
      "An open fracture is a surgical urgency: the OTA Open Fracture Classification (OTA-OFC) describes the injury by skin, muscle, arterial and contamination status, and the management pathway follows from that description rather than from the grade alone.",
    action:
      "Record the OTA-OFC and Gustilo–Anderson description, the time of injury and of the first dose of antibiotics, the tetanus assessment, the wound coverage applied, and the time and team for debridement. Record who was referred to and when.",
    provenance: "ota_standard",
    source: OTA,
  },
  compartment_syndrome: {
    title: "Compartment findings documented — compartment syndrome must be excluded now",
    basis:
      "Pain out of proportion, a tense compartment, pain on passive stretch or a pressure at or above the recorded threshold require immediate assessment. The absolute and delta pressure criteria are recorded with the prompt so the level used is never assumed.",
    action:
      "Record the compartment examined, the pressure measured and the method, the delta pressure if a diastolic value was documented, the analgesic requirement, and the time the surgical team was informed. Escalate immediately — do not wait for a repeat measurement before informing the on-call surgeon.",
    provenance: "local",
    source: null,
  },
  neurovascular_deficit: {
    title: "Distal vascular or neurological deficit documented",
    basis:
      "A pulseless or ischaemic limb and a new motor or sensory deficit change the urgency of reduction and, in an open injury, of vascular repair. Documentation of the deficit before and after any intervention is the record that protects the patient.",
    action:
      "Record the pulse (palpable, Doppler or absent), capillary refill, motor and sensory findings, the ankle-brachial or Doppler index where measured, the time of assessment, and the immediate escalation. Re-document after reduction, splinting or surgery.",
    provenance: "local",
    source: null,
  },
  unreduced_dislocation: {
    title: "Dislocation or fracture-dislocation documented without a recorded reduction",
    basis:
      "An unreduced joint, particularly the hip or a fracture-dislocation, risks avascular change and nerve injury; the OTA trauma standards treat reduction as time-critical where the joint is dislocated.",
    action:
      "Record the joint, the direction, the time of dislocation, the reduction performed or planned, the post-reduction neurovascular status and the post-reduction imaging, and who was notified.",
    provenance: "ota_standard",
    source: OTA,
  },
  cauda_equina: {
    title: "Spinal red flag documented — cord or cauda equina compression must be excluded",
    basis:
      "Saddle anaesthesia, bladder or bowel dysfunction, bilateral leg symptoms or a progressive deficit with spinal pain or injury require urgent assessment and imaging; the clinical picture, not the imaging request, sets the urgency.",
    action:
      "Record the red flag, the time it was documented, the neurological examination including perianal sensation and tone, the imaging arranged and its time, and the immediate referral to spine surgery.",
    provenance: "local",
    source: null,
  },
  bone_joint_infection: {
    title: "Bone or joint infection suspected — aspirate before antibiotics where the joint is involved",
    basis:
      "A hot swollen joint with systemic features and an infected implant or draining sinus need organism identification. Where a native joint is suspected, joint aspiration before antibiotics preserves the chance of a diagnosis.",
    action:
      "Record the temperature, the joint or bone involved, whether aspiration was performed and when, the samples sent, the inflammatory markers with their times, the antibiotics started and by whom, and the orthopaedic and microbiology referral.",
    provenance: "local",
    source: null,
  },
  anticoagulation: {
    title: "Anticoagulant or antiplatelet therapy documented — surgical and bleeding risk must be addressed",
    basis:
      "Warfarin, a DOAC, heparin or an antiplatelet agent changes the timing of surgery, the choice of anaesthesia and the bleeding risk of an injury. Interruption and bridging are decisions of the treating team with the anticoagulation protocol.",
    action:
      "Record the agent, dose, indication, the last dose and the measured INR or anti-Xa where available, the plan for interruption or continuation, who was consulted, and the bleeding and thrombotic risk documented.",
    provenance: "local",
    source: null,
  },
  tetanus: {
    title: "Open wound with tetanus status not documented as up to date",
    basis:
      "Wound management follows the documented vaccination history: a full primary series with a booster within ten years, a booster indicated, or an incomplete or unknown history each lead to different action.",
    action:
      "Record the documented history, whether tetanus toxoid and/or immunoglobulin was given and when, and who verified the history. Record 'not documented' rather than assuming immunity.",
    provenance: "complementary",
    source: CDC_TETANUS,
  },
  vte_prophylaxis: {
    title: "No thromboprophylaxis recorded after major lower-limb surgery",
    basis:
      "The AAOS guideline on prevention of venous thromboembolic disease after elective hip and knee arthroplasty sets out risk-stratified prophylaxis. A decision not to prescribe is legitimate but must be documented with its reason.",
    action:
      "Record the prophylaxis prescribed (agent, dose, duration) or the documented contraindication and the bleeding risk that justified it, the mechanical prophylaxis in use, and the plan for reassessment at discharge.",
    provenance: "aaos_guideline",
    source: AAOS_VTE,
  },
  vascular_injury: {
    title: "Vascular injury documented — limb viability is time-critical",
    basis:
      "Hard signs of vascular injury, an ischaemic limb or an arterial injury in an open fracture change the order of care: reduction and revascularisation come before definitive fixation. Limb salvage is a consultant-level multidisciplinary decision, and no score makes it alone.",
    action:
      "Record the hard signs, the Doppler index, the time ischaemia started, the imaging performed, who was informed and when, and the revascularisation or transfer plan. Record prophylactic fasciotomy where it was performed, and the neurovascular state after revascularisation.",
    provenance: "ota_standard",
    source: OTA,
  },
  unstable_pelvis: {
    title: "Unstable pelvic injury documented — haemorrhage control comes first",
    basis:
      "An unstable pelvic ring with haemodynamic compromise is a resuscitation problem. Pelvic binding, blood products and haemorrhage control precede any definitive orthopaedic decision, and the classification describes the injury rather than setting the sequence.",
    action:
      "Record the binder time, the haemodynamic state and its trend, the blood products given, whether the major haemorrhage protocol was activated, the urogenital and rectal assessment, the imaging obtained and the definitive stabilisation plan with its timing.",
    provenance: "standard",
    source: WSES,
  },
  spinal_cord_injury: {
    title: "Spinal cord injury documented — level, grade and restriction must be recorded",
    basis:
      "A cord injury is described by neurological level, ASIA grade and sacral sparing, and the spine is not cleared on a plain film when the examination is unreliable. Neurogenic shock and the risk of a second injury during transfer are the reasons the restriction and the clearance decision are recorded.",
    action:
      "Record the level, the ASIA grade, sacral sparing, the spinal motion restriction in place, the clearance decision and who made it, the imaging performed, the spine team contacted and when, and the rehabilitation and specialist-centre plan.",
    provenance: "standard",
    source: NICE_SPINAL,
  },
  severe_soft_tissue: {
    title: "Severe soft-tissue injury documented — cover and timing must be planned",
    basis:
      "Severe closed soft-tissue damage is not a simple closed fracture, and the OTA-OFC describes the open injury by skin, muscle, arterial and contamination status. The soft-tissue state determines the timing of cover and the choice of fixation.",
    action:
      "Record the mechanism, the skin and muscle state, the grade used, the photographs taken, the dressing or negative-pressure plan, the debridement and cover timing and the teams involved.",
    provenance: "ota_standard",
    source: OTA,
  },
  fat_embolism: {
    title: "Fat embolism syndrome suspected — supportive care and exclusions must be recorded",
    basis:
      "The diagnosis rests on clinical criteria after long-bone or pelvic injury: respiratory, cerebral and petechial features, usually after a latent interval. There is no confirmatory test and no specific therapy.",
    action:
      "Record the onset and interval, the oxygen requirement, the cerebral features, the rash, the alternative diagnoses excluded, the fracture stabilisation time and the critical-care involvement. Record the care as supportive — do not record a specific treatment that does not exist.",
    provenance: "literature",
    source: GURD_WILSON,
  },
  septic_arthritis: {
    title: "Septic arthritis suspected — aspirate before antibiotics where the patient is stable",
    basis:
      "A native joint is aspirated before antibiotics where that is safe, because the organism and its sensitivities change the treatment. The joint also needs drainage, and crystal and inflammatory causes must be considered.",
    action:
      "Record the joint, the systemic features, whether aspiration preceded antibiotics and the fluid findings, the inflammatory markers with times, the drainage plan and the microbiology and infectious diseases input.",
    provenance: "standard",
    source: BSAC,
  },
  osteomyelitis: {
    title: "Osteomyelitis suspected — the tissue sampled determines the diagnosis",
    basis:
      "Deep tissue or bone samples, not a superficial swab, identify the organism in bone infection, and implant-associated infection follows a different pathway from native bone infection.",
    action:
      "Record the bone and segment, the acuity, whether an implant is involved, the samples taken and how many, the imaging, the antibiotic plan with its review point, and the surgical plan for debridement and dead space.",
    provenance: "standard",
    source: IDSA_NVO,
  },
  postop_infection: {
    title: "Surgical-site infection documented — superficial and deep must be separated",
    basis:
      "A discharging or dehisced wound after fixation is not the same problem as a deep infection around an implant. The distinction determines the sampling, the return to theatre and whether the implant can be retained.",
    action:
      "Record the post-operative day, the wound appearance, the swab or aspirate and its result, the inflammatory markers with times, the antibiotics and who started them, the implant decision and the return-to-theatre decision with its timing.",
    provenance: "standard",
    source: IDSA_PJI,
  },
  thromboembolism: {
    title: "Thromboembolic complication suspected — prophylaxis state and treatment must be recorded",
    basis:
      "Venous thromboembolism after orthopaedic injury or surgery is assessed against the prophylaxis actually in place and the individual bleeding risk. Treatment is a balance between the clot and the surgical site.",
    action:
      "Record the presentation, the prophylaxis state at the time, the imaging requested and performed, the anticoagulation started with its time and dose, the bleeding-risk assessment, and the planned duration with its review point.",
    provenance: "standard",
    source: NICE_VTE,
  },
  union_complication: {
    title: "Delayed union, nonunion or malunion recorded — the evidence must be stated",
    basis:
      "Nonunion is commonly defined as a fracture at least nine months old with no radiographic progression for three consecutive months; there is no agreed definition of delayed union, and malunion is a statement about position and function. None of these is a diagnosis that follows from elapsed time alone.",
    action:
      "Record the interval, the films compared and their dates, the clinical signs, the imaging reviewed and the justification. Record the plan — observation, revise fixation, bone graft, corrective osteotomy or referral — and who decided it.",
    provenance: "literature",
    source: FDA_NONUNION,
  },
  postop_complication: {
    title: "Post-operative complication documented — the pathway must be recorded",
    basis:
      "A discharging or dehisced wound, a loose or broken implant or delayed union changes follow-up, imaging and return to theatre. AAOS guidance on surgical-site infection and on peri-prosthetic joint infection sets out the assessment sequence, which begins with documentation of the findings.",
    action:
      "Record the finding and when it appeared, the wound swab or aspirate sent, the imaging requested, the implant status, the antibiotics started, the return-to-theatre decision and who made it, and the follow-up arranged.",
    provenance: "aaos_guideline",
    source: AAOS,
  },
};

// ---------------------------------------------------------------------------
// Triggers — read only what this note recorded
// ---------------------------------------------------------------------------
const str = (v) => String(v ?? "").trim();
const startsWithAny = (v, prefixes) => prefixes.some((p) => str(v).startsWith(p));
const inList = (v, list) => list.includes(str(v));

const pressureNumber = (v) => {
  const n = Number(str(v));
  return Number.isFinite(n) && str(v) !== "" ? n : null;
};

const TRIGGERS = {
  open_fracture: (v) =>
    startsWithAny(v.ortho_open_closed, ["Open"]) ||
    inList(v.ortho_wound, ["Open fracture", "Open joint injury"]) ||
    startsWithAny(v.ortho_group, ["Open"]) ||
    hasTrauma(v, "open_fracture"),
  compartment_syndrome: (v) => {
    if (inList(v.ortho_compartment_assessment, ["Hard / tense", "Firm — repeat assessment required"])) return true;
    if (hasTrauma(v, "compartment_syndrome")) return true;
    const pressure = pressureNumber(v.ortho_compartment_pressure);
    const diastolic = pressureNumber(v.ortho_diastolic_pressure);
    if (pressure === null) return false;
    if (pressure >= ORTHO_SAFETY_THRESHOLD_MAP.compartment_pressure_abs) return true;
    return diastolic !== null && diastolic - pressure <= ORTHO_SAFETY_THRESHOLD_MAP.compartment_delta;
  },
  neurovascular_deficit: (v) =>
    inList(v.ortho_distal_pulses, ["Absent"]) ||
    inList(v.ortho_sensation, ["Reduced", "Absent"]) ||
    inList(v.ortho_motor, ["Weak", "Absent"]) ||
    hasTrauma(v, "neurovascular_compromise"),
  unreduced_dislocation: (v) =>
    startsWithAny(v.ortho_group, ["Dislocation", "Fracture-dislocation"]) &&
    !inList(v.ortho_reduction_status, ["Reduced — documented", "Reduced in this encounter"]),
  cauda_equina: (v) =>
    (str(v.ortho_spine_red_flags) !== "" &&
      !inList(v.ortho_spine_red_flags, ["None documented", "Not applicable"])) ||
    hasTrauma(v, "cauda_equina"),
  bone_joint_infection: (v) =>
    str(v.ortho_infection_features) !== "" && !inList(v.ortho_infection_features, ["None documented"]),
  anticoagulation: (v) => startsWithAny(v.ortho_anticoagulant, ["Anticoagulant", "Antiplatelet"]),
  tetanus: (v) =>
    (startsWithAny(v.ortho_open_closed, ["Open"]) || inList(v.ortho_wound, ["Open fracture", "Open joint injury"])) &&
    inList(v.ortho_tetanus_status, ["Booster indicated", "Not up to date", "Unknown"]),
  vte_prophylaxis: (v) => inList(v.ortho_vte_prophylaxis, ["Not prescribed"]),
  postop_complication: (v) =>
    inList(v.ortho_wound_status, ["Discharging", "Infected / dehisced"]) ||
    inList(v.ortho_hardware_status, ["Loosening", "Failure / breakage", "Infected implant"]),
  // The trauma-emergency panel raises its own prompts from what was documented in
  // it — a presentation that was recorded is never silently dropped.
  vascular_injury: (v) => hasTrauma(v, "vascular_injury"),
  unstable_pelvis: (v) => hasTrauma(v, "unstable_pelvis"),
  spinal_cord_injury: (v) => hasTrauma(v, "spinal_cord_injury"),
  severe_soft_tissue: (v) => hasTrauma(v, "severe_soft_tissue"),
  fat_embolism: (v) => hasTrauma(v, "fat_embolism"),
  septic_arthritis: (v) => hasTrauma(v, "septic_arthritis"),
  osteomyelitis: (v) => hasTrauma(v, "osteomyelitis"),
  postop_infection: (v) => hasTrauma(v, "postop_infection"),
  thromboembolism: (v) => hasTrauma(v, "thromboembolism"),
  union_complication: (v) =>
    ["delayed_union", "nonunion", "malunion"].includes(orthoHealingState(v.ortho_healing).stateKey),
};

const LEVEL_ORDER = { immediate: 0, same_day: 1, documented: 2 };

const evidenceFor = (key, v, thresholds) => {
  const out = [];
  if (key === "open_fracture") {
    if (str(v.ortho_open_closed)) out.push(`Open/closed: ${str(v.ortho_open_closed)}`);
    if (str(v.ortho_gustilo)) out.push(`Gustilo–Anderson: ${str(v.ortho_gustilo)}`);
    if (str(v.ortho_wound)) out.push(`Wound: ${str(v.ortho_wound)}`);
  }
  if (key === "compartment_syndrome") {
    if (str(v.ortho_compartment_assessment)) out.push(`Compartment: ${str(v.ortho_compartment_assessment)}`);
    if (str(v.ortho_compartment_pressure))
      out.push(`Pressure: ${str(v.ortho_compartment_pressure)} mmHg (threshold ${thresholds.compartment_pressure_abs})`);
    if (str(v.ortho_diastolic_pressure)) out.push(`Diastolic: ${str(v.ortho_diastolic_pressure)} mmHg`);
  }
  if (key === "neurovascular_deficit") {
    ["ortho_distal_pulses", "ortho_cap_refill", "ortho_motor", "ortho_sensation"].forEach((k) => {
      if (str(v[k])) out.push(`${k.replace("ortho_", "").replace(/_/g, " ")}: ${str(v[k])}`);
    });
  }
  if (key === "unreduced_dislocation" && str(v.ortho_group)) out.push(`Working group: ${str(v.ortho_group)}`);
  if (key === "cauda_equina" && str(v.ortho_spine_red_flags)) out.push(`Red flag: ${str(v.ortho_spine_red_flags)}`);
  if (key === "bone_joint_infection" && str(v.ortho_infection_features))
    out.push(`Infection feature: ${str(v.ortho_infection_features)}`);
  if (key === "anticoagulation" && str(v.ortho_anticoagulant)) out.push(`Therapy: ${str(v.ortho_anticoagulant)}`);
  if (key === "tetanus" && str(v.ortho_tetanus_status)) out.push(`Tetanus status: ${str(v.ortho_tetanus_status)}`);
  if (key === "vte_prophylaxis" && str(v.ortho_vte_prophylaxis)) out.push(`Prophylaxis: ${str(v.ortho_vte_prophylaxis)}`);
  if (key === "postop_complication") {
    if (str(v.ortho_wound_status)) out.push(`Wound: ${str(v.ortho_wound_status)}`);
    if (str(v.ortho_hardware_status)) out.push(`Hardware: ${str(v.ortho_hardware_status)}`);
  }
  const traumaSpec = ORTHO_TRAUMA_MAP[key];
  if (traumaSpec && hasTrauma(v, key)) {
    out.push(`Presentation documented: ${traumaSpec.label}`);
    const panelBlock = (v.ortho_trauma && v.ortho_trauma.blocks && v.ortho_trauma.blocks[key]) || {};
    const pathway = panelBlock.pathway || {};
    if (str(pathway.who_informed)) {
      out.push(`Escalated to ${str(pathway.who_informed)} at ${str(pathway.time_informed) || "time not documented"}`);
    }
    const intervention = panelBlock.intervention || {};
    if (str(intervention.performed)) out.push(`Intervention: ${str(intervention.performed)}`);
  }
  if (key === "union_complication") {
    const healing = orthoHealingState(v.ortho_healing);
    if (healing.stateKey) out.push(`Healing state: ${ORTHO_HEALING_STATE_MAP[healing.stateKey].label}`);
    if (str(healing.ortho_healing_interval)) out.push(`Interval: ${str(healing.ortho_healing_interval)}`);
  }
  return out;
};

// A concern the clinician ticked always raises its prompt; the recorded findings
// raise it on their own as well.
export const buildOrthoSafetyPrompts = ({ concerns = [], values = {}, thresholds } = {}) => {
  const merged = mergeThresholds(thresholds);
  const selected = Array.isArray(concerns) ? concerns : [];
  const raised = ORTHO_SAFETY_CONCERNS.filter((c) => selected.includes(c.key) || (TRIGGERS[c.key] || (() => false))(values));
  return raised
    .map((c) => {
      const spec = SPECS[c.key] || {};
      return {
        key: c.key,
        level: c.level,
        title: spec.title || c.label,
        basis: spec.basis || "",
        action: spec.action || "",
        provenance: spec.provenance || "local",
        provenanceLabel: ORTHO_SAFETY_PROVENANCE[spec.provenance || "local"],
        source: spec.source || null,
        evidence: evidenceFor(c.key, values, merged),
        triggeredBy: selected.includes(c.key) ? "clinician" : "documented finding",
      };
    })
    .sort((a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9));
};

const LEVEL_LABEL = { immediate: "ACT NOW", same_day: "SAME DAY", documented: "DOCUMENT" };

// Printed into the saved note and the PDF from what was stored, so the document
// can never disagree with what the clinician was shown.
export const formatOrthoSafety = (value) => {
  if (!value || typeof value !== "object") return "";
  const stored = Array.isArray(value.resolved) ? value.resolved : [];
  const actions = value.actions || {};
  const reasons = value.not_applicable || {};
  const overrides = value.thresholds || {};
  const lines = [];

  const custom = Object.entries(overrides).filter(([, v]) => str(v) !== "");
  if (custom.length) {
    lines.push(`Thresholds in use in this encounter: ${custom.map(([k, v]) => `${k} = ${v}`).join("; ")}`);
  }

  if (stored.length === 0 && !str(value.other_concern)) {
    lines.push(
      "No orthopaedic safety prompt was triggered by the findings recorded in this note — this is not a statement that no urgent problem exists."
    );
    return lines.join("\n");
  }

  lines.push(`Orthopaedic safety prompts recorded in this note (${stored.length}):`);
  stored.forEach((p) => {
    const action = str(actions[p.key]);
    const reason = str(reasons[p.key]);
    lines.push(`[${LEVEL_LABEL[p.level] || "DOCUMENT"}] ${p.title}`);
    if (p.evidence && p.evidence.length) lines.push(`   Documented: ${p.evidence.join("; ")}`);
    lines.push(`   Basis: ${p.basis}`);
    if (p.source) lines.push(`   Source: ${p.source.organization} — ${p.source.title}, ${p.source.edition} (${p.source.url})`);
    if (p.provenanceLabel) lines.push(`   Rule type: ${p.provenanceLabel}`);
    if (action) lines.push(`   Action taken: ${action}`);
    if (reason) lines.push(`   No action required because: ${reason}`);
    if (!action && !reason) lines.push("   Action taken: NOT DOCUMENTED");
  });
  if (str(value.other_concern)) lines.push(`Other safety concern documented: ${str(value.other_concern)}`);
  return lines.join("\n");
};