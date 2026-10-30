// Orthopedics & Traumatology — management, recovery and fracture-healing layer.
//
// WHY THIS IS A SEPARATE MODULE
// The management of a fracture is not one decision: it is a direction (operative
// or non-operative) with a reason, an immobilisation or reduction that has to be
// checked, medications and wound care with their own risks, a weight-bearing and
// rehabilitation prescription, a follow-up interval — and, later, an explicit
// statement about whether the bone is healing.
//
// NONE OF IT IS A PROTOCOL. No field here forces an operation, a cast, an
// antibiotic or a thromboprophylaxis agent. Every field records what the
// clinician decided and why, and a healing state is never defaulted to "united":
// it is recorded, or it is recorded as not assessable.

import { orthoReferencesFor } from "@/lib/orthopedicsReferences";

const opt = (key, label, options, extra = {}) => ({ key, label, type: "select", options, ...extra });
const txt = (key, label, extra = {}) => ({ key, label, type: "textarea", ...extra });
const inp = (key, label, extra = {}) => ({ key, label, type: "input", ...extra });

// ---------------------------------------------------------------------------
// Decision: non-operative or operative, with the reason recorded
// ---------------------------------------------------------------------------
export const ORTHO_DECISION_DIRECTIONS = [
  "Non-operative — immobilisation and review",
  "Non-operative — functional bracing / early movement",
  "Operative — planned",
  "Operative — performed in this encounter",
  "Decision deferred — information pending",
  "Decision deferred — specialist opinion requested",
  "Not yet decided",
];

export const ORTHO_DECISION_FIELDS = [
  opt("ortho_decision_direction", "Direction of management", ORTHO_DECISION_DIRECTIONS),
  txt("ortho_decision_rationale", "Clinical rationale for this direction", {
    hint: "Displacement, stability, articular involvement, soft tissue, neurovascular status, function, anaesthetic risk, patient factors — and what would change the decision",
  }),
  txt("ortho_decision_goals", "Treatment goals for this patient", {
    hint: "Pain control, union, alignment, joint function, return to work or sport, independence",
  }),
  txt("ortho_decision_alternatives", "Alternatives considered and discussed", {
    hint: "Including the conservative option where surgery is chosen, and the operative option where it is not",
  }),
  txt("ortho_decision_patient_preference", "Patient preference and what was discussed with them", {
    hint: "Concerns, expectations, ability to comply with a cast or non-weight bearing, social support",
  }),
  opt("ortho_decision_urgency", "Urgency", [
    "Emergency — immediate",
    "Urgent — next available theatre",
    "Elective — scheduled",
    "Not applicable — non-operative",
    "Not documented",
  ]),
  inp("ortho_decision_made_by", "Decision made by", { placeholder: "Clinician, and any second opinion obtained" }),
  inp("ortho_decision_datetime", "Decision recorded at", { placeholder: "Date and time" }),
];

export const ORTHO_SURGICAL_INDICATION_FIELDS = [
  opt("ortho_surgical_indication", "Primary indication for surgery", [
    "Unstable or displaced fracture",
    "Intra-articular displacement / step",
    "Open injury requiring debridement and stabilisation",
    "Neurovascular compromise",
    "Failed non-operative treatment",
    "Dislocation that cannot be held closed",
    "Implant failure or peri-prosthetic fracture",
    "Nonunion or malunion requiring correction",
    "Infection requiring debridement",
    "Not applicable — non-operative management",
  ]),
  txt("ortho_surgical_indication_detail", "Indication detail", {
    hint: "The finding that makes operation the chosen course, with the measurement or image it rests on",
  }),
  txt("ortho_nonoperative_conditions", "Conditions attached to the non-operative course", {
    hint: "Acceptable position, review interval, what would require a change to operative treatment",
  }),
  opt("ortho_consent_decision", "Consent", [
    "Documented — risks, benefits and alternatives discussed",
    "Documented — patient declined the recommended option",
    "Pending",
    "Emergency — reason documented",
    "Lacks capacity — best-interest decision documented with the family",
  ]),
  txt("ortho_consent_risks", "Risks discussed", {
    hint: "Infection, bleeding, thromboembolism, nerve or vessel injury, nonunion, malunion, stiffness, implant failure, further surgery, anaesthetic risk",
  }),
  txt("ortho_consent_alternatives", "Alternatives discussed", {
    hint: "Cast treatment, accept the deformity, arthroplasty versus fixation, transfer of care",
  }),
  inp("ortho_consent_interpreter", "Interpreter or advocate used, if any"),
];

// ---------------------------------------------------------------------------
// Immobilisation, splinting, casting and closed reduction
// ---------------------------------------------------------------------------
export const ORTHO_IMMOBILISATION_FIELDS = [
  opt("ortho_immob_method", "Immobilisation method", [
    "Backslab / splint",
    "Full cast",
    "Functional brace",
    "Sling / collar and cuff",
    "Traction",
    "External fixator",
    "Boot / walker",
    "None — free mobilisation as tolerated",
    "Not documented",
  ]),
  opt("ortho_cast_material", "Material", ["Plaster of Paris", "Synthetic (fibreglass)", "Soft brace", "Not applicable", "Not documented"]),
  txt("ortho_cast_position", "Position of immobilisation", { hint: "Joint position and the reason for it" }),
  txt("ortho_cast_moulding", "Moulding / support achieved", { hint: "Three-point moulding, moulding over the fracture, conformity" }),
  opt("ortho_cast_window", "Cast modification", ["Not required", "Window cut for the wound", "Cast split", "Cast bivalved", "Not documented"]),
  inp("ortho_cast_duration", "Intended duration", { placeholder: "e.g. 6 weeks, with a review at 2 weeks" }),
  opt("ortho_reduction_method", "Reduction", [
    "Not performed",
    "Closed reduction — analgesia / sedation",
    "Closed reduction — regional or general anaesthesia",
    "Traction reduction",
    "Open reduction",
    "Not documented",
  ]),
  opt("ortho_reduction_quality", "Alignment achieved after reduction", [
    "Anatomical",
    "Acceptable — within the documented tolerance",
    "Suboptimal — plan documented",
    "Not applicable",
    "Not documented",
  ]),
  opt("ortho_nv_after_immobilisation", "Neurovascular check after splinting / casting / reduction", [
    "Checked — intact",
    "Checked — new deficit documented",
    "Checked — pre-existing deficit unchanged",
    "Not checked",
  ]),
  inp("ortho_nv_after_immob_time", "Time of that check", { placeholder: "HH:MM" }),
  txt("ortho_cast_instructions", "Instructions given", {
    hint: "Elevation, ice, cast care, keeping it dry, what to do if the cast feels tight or the fingers or toes change",
  }),
];

// ---------------------------------------------------------------------------
// Analgesia, medications, wound care and infection prevention
// ---------------------------------------------------------------------------
export const ORTHO_MEDICATION_FIELDS = [
  txt("ortho_analgesia_regimen", "Analgesia regimen", {
    hint: "Multimodal: paracetamol, NSAID decision, weak or strong opioid, adjuncts, regional block — with doses",
  }),
  txt("ortho_opioid_plan", "Opioid plan", { hint: "Agent, dose, maximum in 24 hours, review point, tapering and laxative cover" }),
  opt("ortho_nsaid_decision", "NSAID decision", [
    "Prescribed",
    "Avoided — renal impairment",
    "Avoided — bleeding or gastrointestinal risk",
    "Avoided — fracture-healing concern documented",
    "Not documented",
  ]),
  txt("ortho_interactions", "Interactions and allergy check", {
    hint: "Anticoagulant or antiplatelet interaction, renal dosing, documented allergies, duplicate therapy",
  }),
  opt("ortho_wound_class", "Wound class", [
    "Not applicable",
    "Clean",
    "Clean-contaminated",
    "Contaminated",
    "Dirty / infected",
    "Not documented",
  ]),
  inp("ortho_abx_prophylaxis", "Antibiotic prophylaxis — agent and time given", {
    placeholder: "e.g. IV cefazolin 2 g at 08:30, 45 minutes before the incision",
  }),
  txt("ortho_wound_plan", "Wound care", { hint: "Dressing, change interval, showering, suture or clip removal, who reviews the wound" }),
  opt("ortho_npwt", "Negative-pressure wound therapy", [
    "Not used",
    "Applied — reviewed at 48–72 hours",
    "Applied — plan and change interval documented",
    "Not documented",
  ]),
  txt("ortho_infection_surveillance", "Infection surveillance and return precautions", {
    hint: "Wound review dates, who reviews it, and the features that must bring the patient back",
  }),
];

// ---------------------------------------------------------------------------
// Weight bearing, mobility, rehabilitation and follow-up
// ---------------------------------------------------------------------------
export const ORTHO_RECOVERY_FIELDS = [
  opt("ortho_mobility_aid", "Mobility aid", [
    "None",
    "Crutches",
    "Walking frame",
    "Walking stick",
    "Wheelchair",
    "Not applicable",
    "Not documented",
  ]),
  txt("ortho_vte_risk_assessment", "Thrombosis and bleeding risk assessment", {
    hint: "Individual risk factors for venous thromboembolism weighed against the bleeding risk — the basis for the prophylaxis decision below",
  }),
  txt("ortho_physio_program", "Physiotherapy programme", {
    hint: "Exercises, frequency, precautions, weight-bearing progression and who delivers it",
  }),
  txt("ortho_ot_input", "Occupational therapy and social circumstances", {
    hint: "Home layout, stairs, equipment, carer support, driving and work",
  }),
  txt("ortho_followup_plan", "Follow-up arrangement", {
    hint: "Clinic, interval, who reviews the patient, and what is assessed at that visit",
  }),
  opt("ortho_followup_radiograph", "Radiographs at follow-up", [
    "Yes — at every review until union",
    "Yes — at the next review",
    "Not required — reason documented",
    "Not documented",
  ]),
  txt("ortho_return_precautions_expanded", "Features that must bring the patient back sooner", {
    hint: "Escalating pain, numbness or weakness, a cast that feels tight, wound discharge, fever, inability to weight bear",
  }),
];

// ---------------------------------------------------------------------------
// Fracture healing — an explicit state, never a default
// ---------------------------------------------------------------------------
export const ORTHO_HEALING_STATES = [
  {
    key: "not_assessable",
    label: "Not assessable at this visit",
    definition:
      "There is not enough information to judge healing — no current radiograph, too short an interval, or an unreliable examination. Recorded as not assessable, never as united.",
    requiresJustification: true,
    references: ["lit_healing_timeline"],
  },
  {
    key: "progressing",
    label: "Progressing — union not yet complete",
    definition:
      "Callus and clinical improvement are present, the fracture line is still visible on the current film, and the interval from injury is consistent with ongoing healing.",
    requiresJustification: false,
    references: ["lit_healing_timeline"],
  },
  {
    key: "union",
    label: "Union",
    definition:
      "Clinical union (no tenderness at the fracture, no pain on loading, no movement at the site) with radiographic continuity across the fracture, in a patient who can load the limb.",
    requiresJustification: false,
    references: ["lit_healing_timeline"],
  },
  {
    key: "delayed_union",
    label: "Delayed union",
    definition:
      "Healing is slower than expected for this bone, site and injury, with the fracture line still visible and no progression between consecutive films. There is no agreed numeric definition: the interval, the films compared and the clinician's judgement are recorded.",
    requiresJustification: true,
    references: ["lit_fda_nonunion", "lit_healing_timeline"],
  },
  {
    key: "nonunion",
    label: "Nonunion",
    definition:
      "The fracture has not united and shows no radiographic progression — the commonly cited definition is a fracture at least nine months old with no progression for three consecutive months, together with pain on loading and movement at the fracture site.",
    requiresJustification: true,
    references: ["lit_fda_nonunion", "lit_healing_timeline"],
  },
  {
    key: "malunion",
    label: "Malunion",
    definition:
      "The fracture has united in a position that is not acceptable — angulation, rotation, shortening or an articular step that affects function. The deformity is measured and its functional effect recorded.",
    requiresJustification: true,
    references: ["lit_healing_timeline"],
  },
  {
    key: "uncertain",
    label: "Uncertain — further assessment required",
    definition:
      "The findings are conflicting or the imaging is not yet reviewed. Recorded as uncertain with the outstanding step, never resolved by assumption.",
    requiresJustification: true,
    references: ["lit_healing_timeline"],
  },
];

export const ORTHO_HEALING_STATE_MAP = ORTHO_HEALING_STATES.reduce((acc, s) => {
  acc[s.key] = s;
  return acc;
}, {});

export const ORTHO_HEALING_CLINICAL_SIGNS = [
  "No tenderness at the fracture site",
  "No pain on weight bearing or loading",
  "No movement at the fracture site",
  "Ability to bear weight / use the limb",
  "Deformity resolved or acceptable",
];

export const ORTHO_HEALING_RADIOGRAPHIC_SIGNS = [
  "Bridging callus across the fracture",
  "Obliteration of the fracture line",
  "Cortical continuity restored",
  "Remodelling of the callus",
  "Fracture line still visible",
  "No callus visible",
  "Hardware intact",
  "Hardware loosening or breakage",
];

export const ORTHO_HEALING_FIELDS = [
  opt("ortho_healing_state", "Healing state", ORTHO_HEALING_STATES.map((s) => s.label)),
  inp("ortho_healing_interval", "Interval from injury or surgery", { placeholder: "e.g. 12 weeks" }),
  opt("ortho_healing_radiograph", "Radiographs at this assessment", [
    "Reviewed by the treating clinician",
    "Reported — not yet reviewed",
    "Pending",
    "Not performed",
  ]),
  inp("ortho_healing_comparison", "Compared with", { placeholder: "Date of the previous film and what changed" }),
  txt("ortho_healing_clinical", "Clinical signs at the fracture site"),
  txt("ortho_healing_radiographic", "Radiographic signs"),
];

// ---------------------------------------------------------------------------
// Healing helpers
// ---------------------------------------------------------------------------
const str = (v) => String(v ?? "").trim();

const stateKeyFromLabel = (label) => {
  const found = ORTHO_HEALING_STATES.find((s) => s.label === str(label));
  return found ? found.key : "";
};

export const orthoHealingState = (value) => {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return { ...safe, stateKey: stateKeyFromLabel(safe.ortho_healing_state) };
};

// What the record still owes about healing. A selected state that requires a
// justification and has none is an issue; no state at all is an issue.
export const orthoHealingIssues = (value) => {
  const v = orthoHealingState(value);
  const issues = [];
  if (!v.stateKey) {
    issues.push({ key: "no_state", message: "No healing state recorded — record the state, or record it as not assessable." });
    return issues;
  }
  const spec = ORTHO_HEALING_STATE_MAP[v.stateKey];
  if (spec.requiresJustification && !str(v.ortho_healing_justification)) {
    issues.push({
      key: "justification",
      message: `${spec.label} is recorded without the justification: the interval, the films compared and the clinical signs that support it.`,
    });
  }
  if (!str(v.ortho_healing_interval)) {
    issues.push({ key: "interval", message: "The interval from injury or surgery is not recorded, so the state cannot be judged." });
  }
  if (v.stateKey !== "not_assessable" && v.ortho_healing_radiograph === "Not performed") {
    issues.push({
      key: "no_film",
      message: "A healing state is recorded with no radiograph — state the clinical basis, or record the state as not assessable.",
    });
  }
  if (str(v.ortho_healing_radiograph) === "Pending" && v.stateKey === "union") {
    issues.push({ key: "union_without_film", message: "Union is recorded while the radiograph is still pending." });
  }
  return issues;
};

export const orthoHealingReferences = (value) => {
  const v = orthoHealingState(value);
  const spec = ORTHO_HEALING_STATE_MAP[v.stateKey];
  return orthoReferencesFor(spec ? spec.references : ["lit_healing_timeline"]);
};

export const formatOrthoHealing = (value) => {
  if (!value || typeof value !== "object") return "";
  const v = orthoHealingState(value);
  if (!v.stateKey && !str(v.ortho_healing_clinical)) return "";
  const lines = [];
  const spec = ORTHO_HEALING_STATE_MAP[v.stateKey];
  lines.push(`Fracture healing assessment: ${spec ? spec.label : "NOT DOCUMENTED"}`);
  if (spec) lines.push(`   Definition applied: ${spec.definition}`);
  if (str(v.ortho_healing_interval)) lines.push(`   Interval from injury or surgery: ${str(v.ortho_healing_interval)}`);
  if (str(v.ortho_healing_radiograph)) lines.push(`   Radiographs: ${str(v.ortho_healing_radiograph)}`);
  if (str(v.ortho_healing_comparison)) lines.push(`   Compared with previous: ${str(v.ortho_healing_comparison)}`);
  if (str(v.ortho_healing_clinical)) lines.push(`   Clinical signs: ${str(v.ortho_healing_clinical)}`);
  if (str(v.ortho_healing_radiographic)) lines.push(`   Radiographic signs: ${str(v.ortho_healing_radiographic)}`);
  if (str(v.ortho_healing_justification)) lines.push(`   Justification: ${str(v.ortho_healing_justification)}`);
  if (spec && spec.requiresJustification && !str(v.ortho_healing_justification)) {
    lines.push("   Justification: NOT DOCUMENTED — this state requires the interval, the films compared and the signs that support it.");
  }
  const issues = orthoHealingIssues(value);
  issues.forEach((i) => lines.push(`   Documentation still owed: ${i.message}`));
  return lines.join("\n");
};

// Union concern, for the safety prompt — read from the recorded state only.
export const orthoUnionConcern = (value) => {
  const v = orthoHealingState(value);
  return ["delayed_union", "nonunion", "malunion", "uncertain"].includes(v.stateKey);
};