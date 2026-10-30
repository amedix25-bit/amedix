// Orthopedics & Traumatology — condition-specific reference register.
//
// WHY THIS FILE IS A REGISTER AND NOT A CITATION LIST
// A note must never print "AAOS recommends…" over a decision AAOS does not
// actually make. Each entry below therefore records: who publishes it, what
// kind of document it is (clinical practice guideline, appropriate use criteria,
// classification, national standard, or primary literature), the condition it
// applies to, and one `supports` line stating the single thing it may be used to
// support — plus a `doesNotSay` line where the document is commonly over-read.
//
// Attribution is applied per condition. Nothing here is a blanket endorsement,
// and this register never claims that AAOS, OTA or any other body endorses an
// AMedix threshold, score cut-off or local protocol.
//
// EDITIONS: recorded as published at the time of implementation. Confirm the
// current edition on the society's own site before printing a citation; the note
// stores the edition that was printed, so a later change is visible.

export const ORTHO_REFERENCE_KINDS = {
  guideline: "Clinical practice guideline",
  auc: "Appropriate use criteria",
  classification: "Classification / documentation standard",
  standard: "National or society standard",
  literature: "Primary literature",
  local: "AMedix local decision — requires Orthopedics approval",
};

export const ORTHO_ATTRIBUTION_NOTICE =
  "References are recorded per condition. A citation supports the statement beside it only: no society endorses an AMedix threshold, cut-off or local protocol, and no recommendation is attributed to AAOS unless AAOS publishes it.";

const AAOS_HOME = "https://www.aaos.org/quality/";
const OTA_HOME = "https://ota.org/";

export const ORTHO_REFERENCES = [
  // ---- AAOS clinical practice guidelines --------------------------------
  {
    key: "aaos_hip_fracture",
    organization: "AAOS",
    kind: "guideline",
    title: "Management of Hip Fractures in Older Adults",
    edition: "AAOS clinical practice guideline (2021)",
    url: AAOS_HOME,
    appliesTo: ["hip_fracture", "fragility_fracture"],
    supports:
      "The elements AAOS addresses for the older adult with a hip fracture: timing of surgery, surgical options, mobilisation, bone-health assessment, delirium and thromboprophylaxis.",
    doesNotSay:
      "It does not set a universally mandatory operation for every patient; the guideline is written for the older adult with a fragility hip fracture and a decision must still be individualised.",
  },
  {
    key: "aaos_distal_radius",
    organization: "AAOS",
    kind: "guideline",
    title: "Management of Distal Radius Fractures",
    edition: "AAOS clinical practice guideline (2020)",
    url: AAOS_HOME,
    appliesTo: ["distal_radius_fracture"],
    supports:
      "The AAOS statements on operative versus non-operative treatment of distal radius fractures, and on the assessment of the radiocarpal joint and the distal radioulnar joint.",
    doesNotSay:
      "It does not mandate operative fixation for every displaced fracture; the guideline explicitly leaves the choice to the clinician and the patient.",
  },
  {
    key: "aaos_acl",
    organization: "AAOS",
    kind: "guideline",
    title: "Management of Anterior Cruciate Ligament Injuries",
    edition: "AAOS clinical practice guideline (2022)",
    url: AAOS_HOME,
    appliesTo: ["acl_injury", "knee_ligament_injury"],
    supports: "The AAOS statements on assessment, reconstruction and rehabilitation of ACL injury in adults and in skeletally immature patients.",
    doesNotSay: "It does not recommend reconstruction for every tear; non-operative management with rehabilitation is a documented option in selected patients.",
  },
  {
    key: "aaos_rotator_cuff",
    organization: "AAOS",
    kind: "guideline",
    title: "Management of Rotator Cuff Injuries",
    edition: "AAOS clinical practice guideline (2019)",
    url: AAOS_HOME,
    appliesTo: ["rotator_cuff_tear", "shoulder_soft_tissue"],
    supports: "The AAOS statements on diagnosis, non-operative treatment and repair of rotator cuff tears.",
    doesNotSay: "It does not require imaging or repair for every shoulder pain presentation.",
  },
  {
    key: "aaos_knee_oa",
    organization: "AAOS",
    kind: "guideline",
    title: "Management of Osteoarthritis of the Knee (Non-Arthroplasty)",
    edition: "AAOS clinical practice guideline (2021)",
    url: AAOS_HOME,
    appliesTo: ["knee_osteoarthritis", "degenerative_joint_disease"],
    supports: "The AAOS statements on exercise, weight management, analgesia and the limited role of several intra-articular and device-based interventions.",
    doesNotSay: "It is not a statement about arthroplasty indications, which a separate AAOS guideline addresses.",
  },
  {
    key: "aaos_sch",
    organization: "AAOS",
    kind: "guideline",
    title: "Management of Supracondylar Humerus Fractures in Children",
    edition: "AAOS clinical practice guideline (2011)",
    url: AAOS_HOME,
    appliesTo: ["paediatric_elbow_fracture", "supracondylar_fracture"],
    supports: "The AAOS statements on the assessment of the neurovascular status, the classification and the treatment of paediatric supracondylar fractures.",
    doesNotSay: "It does not apply to the adult distal humerus, and it does not replace an individual vascular assessment.",
  },
  {
    key: "aaos_vte_arthroplasty",
    organization: "AAOS",
    kind: "guideline",
    title: "Prevention of Venous Thromboembolic Disease in Patients Undergoing Elective Hip and Knee Arthroplasty",
    edition: "AAOS clinical practice guideline (reaffirmed)",
    url: AAOS_HOME,
    appliesTo: ["arthroplasty", "thromboembolism", "vte_prophylaxis"],
    supports: "The AAOS statements on thromboprophylaxis after elective hip and knee arthroplasty, including that no single agent is mandated for every patient.",
    doesNotSay: "It does not cover trauma or non-arthroplasty fracture surgery, where the thromboprophylaxis decision follows the trauma and national guidance cited separately.",
  },
  {
    key: "aaos_pji_dental",
    organization: "AAOS",
    kind: "auc",
    title: "Prevention of Orthopaedic Implant Infection in Patients Undergoing Dental Procedures",
    edition: "AAOS / ADA appropriate use criteria",
    url: AAOS_HOME,
    appliesTo: ["periprosthetic_joint_infection", "implant_infection"],
    supports: "The AAOS/ADA position on antibiotic prophylaxis for patients with orthopaedic implants undergoing dental procedures.",
    doesNotSay: "It says nothing about prophylaxis at the time of orthopaedic surgery, which is a separate question.",
  },

  // ---- OTA ---------------------------------------------------------------
  {
    key: "ota_ofc",
    organization: "OTA",
    kind: "classification",
    title: "OTA Open Fracture Classification (OTA-OFC)",
    edition: "OTA-OFC, as published by the Orthopaedic Trauma Association",
    url: OTA_HOME,
    appliesTo: ["open_fracture", "severe_soft_tissue", "compartment_syndrome"],
    supports:
      "A structured description of an open fracture by skin, muscle, arterial and contamination status, which replaces sole reliance on a single Gustilo–Anderson grade.",
    doesNotSay: "It is a description, not a treatment algorithm; the operative plan still follows the individual injury.",
  },
  {
    key: "ota_ao_compendium",
    organization: "OTA / AO Foundation",
    kind: "classification",
    title: "Fracture and Dislocation Classification Compendium",
    edition: "OTA/AO compendium (2018 revision)",
    url: OTA_HOME,
    appliesTo: ["fracture", "dislocation", "fracture_dislocation", "unstable_pelvis", "spinal_cord_injury"],
    supports: "The alphanumeric fracture classification used to describe a fracture consistently between clinicians and across records.",
    doesNotSay: "A classification code is a description of the injury; it does not determine the treatment.",
  },
  {
    key: "ota_trauma_resources",
    organization: "OTA",
    kind: "standard",
    title: "Orthopaedic Trauma Association — trauma resources and evidence summaries",
    edition: "current OTA resources",
    url: OTA_HOME,
    appliesTo: ["open_fracture", "compartment_syndrome", "unstable_pelvis", "polytrauma", "vascular_injury"],
    supports: "The general trauma principles cited beside the trauma prompts: time-critical debridement, recognition of compartment syndrome, and staged care of the multiply injured patient.",
    doesNotSay: "It is a resource collection, not a single guideline that can be cited for a specific numeric threshold.",
  },

  // ---- Trauma societies and national standards ---------------------------
  {
    key: "atls",
    organization: "American College of Surgeons — Committee on Trauma",
    kind: "standard",
    title: "Advanced Trauma Life Support (ATLS) student course manual",
    edition: "10th edition",
    url: "https://www.facs.org/quality-programs/trauma/education/atls/",
    appliesTo: ["polytrauma", "unstable_pelvis", "spinal_cord_injury", "vascular_injury", "open_fracture"],
    supports: "The primary survey sequence, the recognition of shock, and the place of pelvic binding, splinting and damage-control orthopaedics within resuscitation.",
    doesNotSay: "It does not set orthopaedic operative indications.",
  },
  {
    key: "wses_pelvis",
    organization: "World Society of Emergency Surgery (WSES)",
    kind: "guideline",
    title: "Pelvic trauma: WSES classification and guidelines",
    edition: "WSES guidelines (current)",
    url: "https://wjes.biomedcentral.com/",
    appliesTo: ["unstable_pelvis"],
    supports: "The assessment and early management sequence for pelvic ring injury, including haemorrhage control and the place of pelvic stabilisation.",
    doesNotSay: "It does not replace the local major haemorrhage protocol or the decision of the treating trauma team.",
  },
  {
    key: "aospine_tl",
    organization: "AOSpine",
    kind: "classification",
    title: "AOSpine Thoracolumbar Spine Injury Classification System",
    edition: "AOSpine classification (as published)",
    url: "https://www.aofoundation.org/",
    appliesTo: ["spinal_cord_injury", "spinal_fracture", "cauda_equina"],
    supports: "A consistent description of thoracolumbar injury morphology, neurological status and modifiers.",
    doesNotSay: "It is a classification with a suggested score, not a mandatory operative indication.",
  },
  {
    key: "aospine_subaxial",
    organization: "AOSpine",
    kind: "classification",
    title: "AOSpine Subaxial Cervical Spine Injury Classification System",
    edition: "AOSpine classification (as published)",
    url: "https://www.aofoundation.org/",
    appliesTo: ["spinal_cord_injury", "cervical_spine_injury"],
    supports: "A consistent description of subaxial cervical injury morphology and neurological status.",
    doesNotSay: "It does not on its own determine whether a patient needs surgery.",
  },
  {
    key: "nice_ng37",
    organization: "NICE (UK National Institute for Health and Care Excellence)",
    kind: "standard",
    title: "Fractures (non-complex): assessment and management",
    edition: "NICE guideline NG37",
    url: "https://www.nice.org.uk/guidance/ng37",
    appliesTo: ["fracture", "distal_radius_fracture", "ankle_fracture", "conservative_management"],
    supports: "The assessment, imaging and follow-up sequence for non-complex fractures, including the place of closed treatment and of neurovascular checks after splinting.",
    doesNotSay: "It is written for non-complex fractures and does not cover the multiply injured or open-injury pathway.",
  },
  {
    key: "nice_ng41",
    organization: "NICE (UK National Institute for Health and Care Excellence)",
    kind: "standard",
    title: "Spinal injury: assessment and initial management",
    edition: "NICE guideline NG41",
    url: "https://www.nice.org.uk/guidance/ng41",
    appliesTo: ["spinal_cord_injury", "cervical_spine_injury", "cauda_equina"],
    supports: "The assessment, spinal motion restriction, imaging and referral sequence for suspected spinal injury, including the recognition of cord and cauda equina features.",
    doesNotSay: "It does not state that a normal plain film excludes injury in an unreliable examination.",
  },
  {
    key: "nice_ng89",
    organization: "NICE (UK National Institute for Health and Care Excellence)",
    kind: "standard",
    title: "Venous thromboembolism: reducing the risk in hospital",
    edition: "NICE guideline NG89",
    url: "https://www.nice.org.uk/guidance/ng89",
    appliesTo: ["vte_prophylaxis", "thromboembolism", "fracture", "arthroplasty"],
    supports: "The individual risk assessment that must precede a thromboprophylaxis decision, and the balance of mechanical and pharmacological prophylaxis with bleeding risk.",
    doesNotSay: "It does not mandate one agent, dose or duration for every orthopaedic injury.",
  },
  {
    key: "nice_cg124",
    organization: "NICE (UK National Institute for Health and Care Excellence)",
    kind: "standard",
    title: "Hip fracture: management",
    edition: "NICE clinical guideline CG124",
    url: "https://www.nice.org.uk/guidance/cg124",
    appliesTo: ["hip_fracture", "fragility_fracture", "delirium"],
    supports: "The hip fracture pathway: prompt surgery, orthogeriatric review, delirium prevention and bone-health assessment.",
    doesNotSay: "It does not override the individual decision for a patient who is not fit for surgery.",
  },
  {
    key: "boast_open_lower_limb",
    organization: "British Orthopaedic Association / BAPRAS",
    kind: "standard",
    title: "BOAST — The management of severe open lower limb fractures",
    edition: "BOAST standard (current)",
    url: "https://www.boa.ac.uk/standards-guidance/boasts.html",
    appliesTo: ["open_fracture", "severe_soft_tissue", "vascular_injury"],
    supports: "The open-fracture standards: early antibiotics, tetanus assessment, debridement timing, documentation of the soft-tissue injury and combined orthoplastic planning.",
    doesNotSay: "It does not replace the OTA-OFC description of the injury or the local theatre capability.",
  },
  {
    key: "boast_spinal_clearance",
    organization: "British Orthopaedic Association",
    kind: "standard",
    title: "BOAST — Spinal clearance in the trauma patient",
    edition: "BOAST standard (current)",
    url: "https://www.boa.ac.uk/standards-guidance/boasts.html",
    appliesTo: ["spinal_cord_injury", "cervical_spine_injury"],
    supports: "The standard for clearing the spine in an awake, alert patient and for maintaining spinal motion restriction when the examination is unreliable.",
    doesNotSay: "It does not permit clinical clearance in an intoxicated, sedated or unconscious patient.",
  },
  {
    key: "east_vte_trauma",
    organization: "Eastern Association for the Surgery of Trauma (EAST)",
    kind: "guideline",
    title: "Practice management guideline on venous thromboembolism prophylaxis in trauma patients",
    edition: "EAST practice management guideline (current)",
    url: "https://www.east.org/education-career-development/practice-management-guidelines",
    appliesTo: ["vte_prophylaxis", "thromboembolism", "polytrauma"],
    supports: "The trauma-specific thromboprophylaxis decision, including the timing of pharmacological prophylaxis after bleeding risk is controlled.",
    doesNotSay: "It does not remove the need to document the individual bleeding and clotting risk.",
  },
  {
    key: "idsa_pji",
    organization: "IDSA (Infectious Diseases Society of America)",
    kind: "guideline",
    title: "Diagnosis and Management of Prosthetic Joint Infection",
    edition: "IDSA clinical practice guideline",
    url: "https://www.idsociety.org/practice-guideline/",
    appliesTo: ["periprosthetic_joint_infection", "implant_infection", "postop_infection"],
    supports: "The diagnostic sequence for prosthetic joint infection: aspirate and tissue sampling before antibiotics where the patient is stable, and the role of microbiology.",
    doesNotSay: "It does not decide the surgical strategy, which is a combined orthopaedic and microbiology decision.",
  },
  {
    key: "idsa_nvo",
    organization: "IDSA (Infectious Diseases Society of America)",
    kind: "guideline",
    title: "Diagnosis and Management of Native Vertebral Osteomyelitis",
    edition: "IDSA clinical practice guideline",
    url: "https://www.idsociety.org/practice-guideline/",
    appliesTo: ["osteomyelitis", "spinal_infection"],
    supports: "The diagnostic pathway for native vertebral osteomyelitis, including image-guided sampling before antibiotics where safe.",
    doesNotSay: "It does not cover implant-associated spinal infection.",
  },
  {
    key: "bsac_septic_arthritis",
    organization: "BSAC / British Infection Association",
    kind: "guideline",
    title: "Guideline for the management of septic arthritis in native joints",
    edition: "BSAC/BIA guideline (current)",
    url: "https://bsac.org.uk/",
    appliesTo: ["septic_arthritis", "bone_joint_infection"],
    supports: "The diagnostic and treatment sequence for native joint infection: aspiration before antibiotics where possible, and the need for joint drainage.",
    doesNotSay: "It does not cover prosthetic joint infection, which IDSA guidance addresses.",
  },
  {
    key: "cdc_tetanus",
    organization: "CDC",
    kind: "standard",
    title: "Tetanus vaccination and wound management",
    edition: "current adult immunisation schedule",
    url: "https://www.cdc.gov/vaccines/vpd/tetanus/",
    appliesTo: ["open_fracture", "severe_soft_tissue"],
    supports: "The tetanus assessment for a contaminated or open wound, based on the documented vaccination history.",
    doesNotSay: "It does not replace the local immunisation protocol or the patient's own record.",
  },

  // ---- Classification and primary literature -----------------------------
  {
    key: "lit_gustilo_anderson",
    organization: "Gustilo & Anderson",
    kind: "literature",
    title: "Classification of open fractures (Gustilo–Anderson)",
    edition: "primary description, as revised",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    appliesTo: ["open_fracture", "severe_soft_tissue"],
    supports: "The historically used open-fracture grade, recorded alongside the OTA-OFC description.",
    doesNotSay: "The grade alone does not define the debridement timing or the fixation method.",
  },
  {
    key: "lit_tschorne",
    organization: "Tscherne & Oestern",
    kind: "literature",
    title: "Closed fracture soft-tissue classification (Tscherne)",
    edition: "primary description",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    appliesTo: ["severe_soft_tissue", "closed_fracture"],
    supports: "A description of the closed soft-tissue injury, which the OTA-OFC does not cover.",
    doesNotSay: "It does not on its own indicate operation.",
  },
  {
    key: "lit_mess",
    organization: "Johansen et al.",
    kind: "literature",
    title: "Mangled Extremity Severity Score (MESS)",
    edition: "primary description",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    appliesTo: ["vascular_injury", "severe_soft_tissue", "open_fracture"],
    supports: "A descriptive score of skeletal and soft-tissue injury, limb ischaemia, shock and age, recorded with its components shown.",
    doesNotSay:
      "It is not a decision rule for amputation. The original report described an association with limb loss in its own cohort; later work shows it cannot be used alone, and limb salvage is a consultant-level multidisciplinary decision.",
  },
  {
    key: "lit_iss",
    organization: "Baker et al.",
    kind: "literature",
    title: "Injury Severity Score (ISS)",
    edition: "primary description",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    appliesTo: ["polytrauma", "fracture", "unstable_pelvis"],
    supports: "A summary of anatomical injury severity in the multiply injured patient, calculated from the AIS of the three most severely injured body regions.",
    doesNotSay: "A low ISS does not exclude a limb-threatening injury, and the score is never a triage decision on its own.",
  },
  {
    key: "lit_fda_nonunion",
    organization: "US Food and Drug Administration",
    kind: "standard",
    title: "Guidance on the definition of nonunion for clinical trials",
    edition: "FDA guidance document",
    url: "https://www.fda.gov/",
    appliesTo: ["delayed_union", "nonunion", "malunion", "fracture_healing"],
    supports:
      "The commonly cited definition of nonunion used in this app: a fracture at least nine months old with no radiographic progression for three consecutive months.",
    doesNotSay:
      "There is no agreed definition of delayed union in the literature; the app records the clinician's judgement and the interval rather than applying a single cut-off.",
  },
  {
    key: "lit_gurd_wilson",
    organization: "Gurd & Wilson",
    kind: "literature",
    title: "Fat embolism syndrome — clinical criteria",
    edition: "primary description",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    appliesTo: ["fat_embolism"],
    supports: "The clinical criteria used to describe fat embolism syndrome (respiratory, cerebral and petechial features after long-bone injury).",
    doesNotSay: "There is no confirmatory test and no specific therapy; management is supportive, which the record must state rather than imply a protocol exists.",
  },
  {
    key: "lit_tile",
    organization: "Tile",
    kind: "classification",
    title: "Tile classification of pelvic ring injuries",
    edition: "primary description",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    appliesTo: ["unstable_pelvis"],
    supports: "A description of pelvic ring stability and mechanism, recorded with the injury.",
    doesNotSay: "It does not define the haemorrhage-control sequence.",
  },
  {
    key: "lit_young_burgess",
    organization: "Young & Burgess",
    kind: "classification",
    title: "Young–Burgess classification of pelvic ring injuries",
    edition: "primary description",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    appliesTo: ["unstable_pelvis"],
    supports: "A mechanism-based description of pelvic ring injury, recorded alongside the Tile type.",
    doesNotSay: "It is descriptive; the resuscitation pathway is governed by ATLS and the local major haemorrhage protocol.",
  },
  {
    key: "lit_healing_timeline",
    organization: "AMedix Orthopedics",
    kind: "local",
    title: "Fracture healing assessment — documentation structure",
    edition: "AMedix local decision",
    url: "",
    appliesTo: ["fracture_healing", "union", "delayed_union", "nonunion", "malunion"],
    supports:
      "The requirement that healing is recorded as an explicit state — not assessable, progressing, united, delayed union, nonunion, malunion — with the interval, the imaging reviewed and the clinical signs.",
    doesNotSay:
      "No numeric union timeline is applied: expected healing time differs by bone, site, soft-tissue injury, fixation and patient factors, so the clinician records the interval and the judgement.",
  },
];

export const ORTHO_REFERENCE_MAP = ORTHO_REFERENCES.reduce((acc, ref) => {
  acc[ref.key] = ref;
  return acc;
}, {});

export const orthoReferencesFor = (keys = []) => {
  const wanted = Array.isArray(keys) ? keys : [keys];
  const out = [];
  const seen = new Set();
  wanted.forEach((k) => {
    const ref = ORTHO_REFERENCE_MAP[k];
    if (ref && !seen.has(ref.key)) {
      seen.add(ref.key);
      out.push(ref);
    }
  });
  return out;
};

// Everything published for one condition — used by the condition blocks and by
// the reference panel, so a condition never falls back to a generic citation.
export const orthoReferencesForCondition = (conditionKey) =>
  ORTHO_REFERENCES.filter((ref) => (ref.appliesTo || []).includes(conditionKey));

export const formatOrthoReferences = (refs = []) =>
  refs
    .map(
      (ref) =>
        `${ref.organization} — ${ref.title}, ${ref.edition}${
          ref.url ? ` (${ref.url})` : ""
        }\n   Kind: ${ORTHO_REFERENCE_KINDS[ref.kind] || ref.kind}\n   Supports: ${ref.supports}${
          ref.doesNotSay ? `\n   Does not say: ${ref.doesNotSay}` : ""
        }`,
    )
    .join("\n");