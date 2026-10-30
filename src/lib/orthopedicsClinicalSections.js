// Orthopedics & Traumatology — the sections appended to each EXISTING note type.
//
// The eleven orthopaedic note types in src/lib/specialtyDocuments.js keep their
// keys, labels, order and every existing field. Nothing is renamed, removed or
// reordered here: this module only appends sections, so a saved note keeps its
// meaning, its links and its PDF.
//
// WHAT IS APPENDED, AND WHY IN THIS FORM
//   · Injury & history — mechanism, date and time of injury, pain and functional
//     loss, previous fractures and orthopaedic procedures, implants in place,
//     anticoagulant and antiplatelet therapy, comorbidities that change bone
//     healing, and tetanus status for an open injury.
//   · Orthopaedic examination — inspection, deformity, swelling, bruising, wound,
//     skin, tenderness, crepitus, range of motion, stability and function, so the
//     examination is readable rather than one free-text paragraph.
//   · Neurovascular & compartment assessment — distal pulses, capillary refill,
//     motor, sensation and the compartment assessment, with the pressure fields
//     appearing only when a compartment is worth measuring.
//   · Fracture characterisation — bone, site, laterality, pattern, displacement,
//     angulation, rotation, shortening, articular involvement, open/closed status
//     with Gustilo–Anderson and OTA-OFC, soft tissue, associated injuries, and the
//     classification used — plus whether the information was sufficient to
//     classify at all, because a classification recorded on incomplete data is a
//     fabricated classification.
//   · Investigations — X-ray, CT, MRI and relevant laboratory work, each with the
//     comparison against previous studies and the state of the result (reviewed,
//     pending, not performed) so an absent result is never read as normal.
//   · Assessment, management, pre-operative, operative, post-operative, discharge
//     and rehabilitation sections, each shaped to the note type.
//
// Every note ends with one orthopaedic patient-safety review (type ortho_safety),
// which computes its prompts from what that note actually recorded.

import {
  orthopedicsCatalogFor,
  ORTHO_ICD11_MMS,
  ORTHO_ICD_STATUSES,
  ORTHO_ICD_ROLES,
  ORTHO_ICD_DETAIL_FIELDS,
  ORTHO_ICD_CATALOG_NOTE,
  ORTHO_ICD_CLUSTER_NOTE,
  ORTHO_ICD_SEARCH_GUIDANCE,
} from "@/lib/orthopedicsIcd11";
import {
  ORTHO_DECISION_FIELDS,
  ORTHO_IMMOBILISATION_FIELDS,
  ORTHO_MEDICATION_FIELDS,
  ORTHO_RECOVERY_FIELDS,
  ORTHO_SURGICAL_INDICATION_FIELDS,
} from "@/lib/orthopedicsManagement";

const T = (key, label, extra = {}) => ({ key, label, type: "textarea", ...extra });
const I = (key, label, extra = {}) => ({ key, label, type: "input", ...extra });
const N = (key, label, extra = {}) => ({ key, label, type: "number", ...extra });
const S = (key, label, options, extra = {}) => ({ key, label, type: "select", options, ...extra });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

const LATERALITY = ["Right", "Left", "Bilateral", "Not applicable", "Not documented"];
const YES_NO_NOT = ["Yes", "No", "Not documented"];

// ---- ICD-11 coding field ---------------------------------------------------
const icdB = (domains, placeholder, note) => ({
  key: "icd11_diagnoses",
  label: "Primary, secondary & differential diagnoses (ICD-11 MMS)",
  type: "icd11_diagnoses",
  catalog: orthopedicsCatalogFor(domains),
  searchPlaceholder: placeholder,
  catalogRelease: ORTHO_ICD11_MMS.release,
  catalogNote: note || ORTHO_ICD_CATALOG_NOTE,
  statuses: ORTHO_ICD_STATUSES,
  roles: ORTHO_ICD_ROLES,
  extraFields: ORTHO_ICD_DETAIL_FIELDS,
  clusterEnabled: true,
  clusterNote: ORTHO_ICD_CLUSTER_NOTE,
  requireConfirmation: true,
  unspecifiedJustification: true,
});

// ---- Safety review --------------------------------------------------------
const safety = () => [
  {
    key: "ortho_safety",
    label: "Orthopaedic patient-safety review",
    type: "ortho_safety",
    section: "Patient safety",
  },
];

// ---- Reusable sections ----------------------------------------------------
const injuryHistory = (extra = []) =>
  sec("Injury & history", [
    T("ortho_mechanism", "Mechanism of injury", { hint: "e.g. fall from standing, road traffic collision, twisting injury, direct blow" }),
    I("ortho_injury_datetime", "Date and time of injury", { placeholder: "e.g. 2026-10-29 18:40" }),
    S("ortho_injury_laterality", "Side injured", LATERALITY),
    T("ortho_pain", "Pain — site, character, severity and what relieves it"),
    T("ortho_functional_loss", "Functional limitations since the injury", {
      hint: "Weight bearing, walking distance, use of the arm, dressing, work",
    }),
    S("ortho_previous_fracture", "Previous fractures", [...YES_NO_NOT, "Unknown — records unavailable"]),
    T("ortho_previous_surgery", "Previous orthopaedic procedures"),
    S("ortho_implant_in_situ", "Implant already in place", [
      "None",
      "Plate and screws",
      "Intramedullary nail",
      "Arthroplasty",
      "External fixator",
      "Other",
      "Not documented",
    ]),
    S("ortho_anticoagulant", "Anticoagulant or antiplatelet therapy", [
      "Not on anticoagulant or antiplatelet",
      "Antiplatelet only",
      "Anticoagulant — warfarin",
      "Anticoagulant — DOAC",
      "Anticoagulant — heparin / LMWH",
      "Unknown",
    ]),
    S("ortho_tetanus_status", "Tetanus status (required for an open injury)", [
      "Up to date — booster within 10 years",
      "Booster indicated",
      "Not up to date",
      "Unknown",
      "Not applicable — closed injury",
    ]),
    S("ortho_smoking", "Smoking status", ["Never", "Former", "Current", "Not documented"]),
    S("ortho_diabetes", "Diabetes", ["No", "Yes — diet controlled", "Yes — on medication", "Yes — insulin treated", "Not documented"]),
    S("ortho_bone_health", "Bone health / fragility risk", [
      "No known risk",
      "Osteoporosis documented",
      "Fragility fracture history",
      "Long-term steroid use",
      "Not assessed",
    ]),
    T("ortho_comorbidities", "Comorbidities relevant to injury, anaesthesia and bone healing"),
    ...extra,
  ]);

const examination = () =>
  sec("Orthopaedic examination", [
    T("ortho_inspection", "Inspection — posture, attitude of the limb, open wounds"),
    T("ortho_deformity", "Deformity", { hint: "Angulation, rotation, shortening, swelling-distorting alignment" }),
    S("ortho_swelling", "Swelling", ["None", "Mild", "Moderate", "Marked", "Not documented"]),
    S("ortho_bruising", "Bruising / ecchymosis", ["None", "Present", "Not documented"]),
    S("ortho_wound", "Wound", ["None", "Laceration", "Open fracture", "Open joint injury", "Surgical wound"]),
    T("ortho_skin", "Skin condition over the injury", { hint: "Abrasion, blistering, tenting, pressure areas, previous scars" }),
    T("ortho_tenderness", "Tenderness — site and severity"),
    S("ortho_crepitus", "Crepitus", ["Absent", "Present", "Not assessed"]),
    T("ortho_rom", "Range of motion — joint and measured range", { hint: "Record what was measured; use 'not assessed' rather than leaving it blank" }),
    S("ortho_stability", "Joint stability", [
      "Stable",
      "Laxity — mild",
      "Laxity — significant",
      "Unstable",
      "Not assessed",
    ]),
    T("ortho_functional", "Functional assessment", { hint: "Weight bearing, gait, grip, straight-leg raise, ability to use the limb" }),
    T("ortho_alignment", "Limb alignment and length", { hint: "Clinical alignment and any leg-length discrepancy" }),
  ]);

const neurovascular = () =>
  sec("Neurovascular & compartment assessment", [
    S("ortho_distal_pulses", "Distal pulses", ["Palpable", "Doppler only", "Absent", "Not documented"]),
    S("ortho_cap_refill", "Capillary refill", ["Normal (<2 s)", "Delayed (>2 s)", "Not documented"]),
    S("ortho_motor", "Motor function distal to the injury", ["Intact", "Weak", "Absent", "Not documented"]),
    S("ortho_sensation", "Sensation distal to the injury", ["Intact", "Reduced", "Absent", "Not documented"]),
    S("ortho_compartment_assessment", "Compartment assessment", [
      "Not indicated",
      "Soft and compressible",
      "Firm — repeat assessment required",
      "Hard / tense",
    ]),
    N("ortho_compartment_pressure", "Compartment pressure measured", {
      unit: "mmHg",
      showIf: { key: "ortho_compartment_assessment", in: ["Firm — repeat assessment required", "Hard / tense"] },
    }),
    N("ortho_diastolic_pressure", "Diastolic blood pressure at the time of measurement", {
      unit: "mmHg",
      showIf: { key: "ortho_compartment_assessment", in: ["Firm — repeat assessment required", "Hard / tense"] },
    }),
    I("ortho_nv_assessed_at", "Neurovascular assessment documented at", { placeholder: "Time of assessment" }),
    S("ortho_nv_completeness", "Completeness of the neurovascular record", [
      "All documented",
      "Partially documented — deficit of the record stated",
      "Not documented",
    ]),
  ]);

// Life- and limb-threatening assessment. One panel per note, driven by what was
// actually documented — never a checklist that defaults to normal.
const traumaSection = () =>
  sec("Trauma emergency assessment", [
    {
      key: "ortho_trauma",
      label: "Life- and limb-threatening presentation, red flags and time-critical pathway",
      type: "ortho_trauma",
    },
  ]);

// Injury severity and physiology, so a limb-threatening injury is not documented
// as an isolated fracture in a patient who is physiologically abnormal.
const severitySection = () =>
  sec("Injury severity & physiology", [
    S("ortho_polytrauma", "Major associated trauma", [
      "No — single-region injury",
      "Yes — two or more regions injured",
      "Yes — physiologically unstable",
      "Not assessed",
    ]),
    I("ortho_iss", "Injury Severity Score, where calculated", { placeholder: "Calculated from the AIS of the three most severely injured regions" }),
    T("ortho_ais_regions", "Injured regions and their AIS", {
      hint: "Head/neck, face, chest, abdomen, extremities, external — with the score recorded for each",
    }),
    S("ortho_physiology", "Physiological state", ["Stable", "Borderline", "Unstable", "In extremis", "Not documented"]),
    I("ortho_shock_index_inputs", "Heart rate and systolic pressure at assessment", { placeholder: "e.g. HR 118, SBP 92 — the ratio is recorded with the observation" }),
    I("ortho_lactate", "Lactate / base deficit, where measured"),
    T("ortho_transfusion", "Blood products and major haemorrhage protocol", { hint: "Units given, times, and whether the protocol was activated" }),
  ]);

// Fracture healing, recorded as an explicit state.
const healingSection = () =>
  sec("Fracture healing", [
    { key: "ortho_healing", label: "Fracture healing assessment", type: "ortho_healing" },
  ]);

const fractureDetail = () =>
  sec("Fracture characterisation", [
    I("ortho_bone", "Bone(s) involved"),
    I("ortho_site", "Anatomical site", { hint: "e.g. femoral neck, distal third diaphysis, posterior malleolus, L4 vertebral body" }),
    S("ortho_laterality", "Laterality", LATERALITY),
    S("ortho_pattern", "Fracture pattern", [
      "Transverse",
      "Oblique",
      "Spiral",
      "Comminuted",
      "Segmental",
      "Impacted",
      "Avulsion",
      "Compression",
      "Greenstick",
      "Physeal (Salter–Harris)",
      "Not classified",
    ]),
    S("ortho_displacement", "Displacement", ["Undisplaced", "Minimally displaced", "Displaced", "Significantly displaced", "Not documented"]),
    I("ortho_angulation", "Angulation", { placeholder: "Direction and degrees as measured" }),
    I("ortho_rotation", "Rotation", { placeholder: "Clinically or radiologically documented rotation" }),
    I("ortho_shortening", "Shortening", { placeholder: "Measured shortening" }),
    S("ortho_articular", "Articular involvement", [
      "Extra-articular",
      "Intra-articular — undisplaced",
      "Intra-articular — displaced",
      "Not documented",
    ]),
    S("ortho_open_closed", "Open / closed injury", ["Closed", "Open", "Open with bone loss", "Not applicable"]),
    S("ortho_gustilo", "Gustilo–Anderson grade (open injuries)", [
      "Grade I",
      "Grade II",
      "Grade IIIA",
      "Grade IIIB",
      "Grade IIIC",
      "Not yet classified",
    ], { showIf: { key: "ortho_open_closed", in: ["Open", "Open with bone loss"] } }),
    I("ortho_ota_ofc", "OTA Open Fracture Classification (OTA-OFC)", {
      hint: "Skin, muscle, arterial and contamination categories as documented",
      showIf: { key: "ortho_open_closed", in: ["Open", "Open with bone loss"] },
    }),
    S("ortho_soft_tissue", "Soft-tissue damage", [
      "None documented",
      "Contusion / swelling",
      "Open wound",
      "Severe soft-tissue compromise",
      "Not documented",
    ]),
    T("ortho_associated_injuries", "Associated injuries", { hint: "Other fractures, head, chest, abdomen, vascular or nerve injury" }),
    I("ortho_classification_system", "Classification system used", {
      placeholder: "e.g. AO/OTA, Garden, Neer, Salter–Harris, Schatzker",
    }),
    I("ortho_classification_grade", "Grade / type within that system", { placeholder: "e.g. 31-B2, Garden III, Salter–Harris II" }),
    S("ortho_classification_adequate", "Was the information sufficient to classify?", [
      "Yes — classification supported by the documented imaging",
      "No — insufficient information, classification withheld",
      "Not applicable",
    ]),
    S("ortho_reduction_status", "Dislocation / reduction status", [
      "Reduced — documented",
      "Reduced in this encounter",
      "Not reduced — plan documented",
      "Not applicable",
    ]),
    S("ortho_spine_red_flags", "Spinal red flags (spinal injury or back pain)", [
      "None documented",
      "Saddle anaesthesia",
      "Bladder or bowel dysfunction",
      "Bilateral leg weakness or numbness",
      "Progressive neurological deficit",
      "Not applicable",
    ]),
  ]);

const investigations = () =>
  sec("Imaging & laboratory review", [
    T("ortho_xray", "X-ray — views taken and findings"),
    T("ortho_ct", "CT — findings"),
    T("ortho_mri", "MRI — findings"),
    T("ortho_labs", "Blood tests — results and times", {
      hint: "FBC, coagulation, group and save / crossmatch, renal function, inflammatory markers — each with its time",
    }),
    S("ortho_imaging_comparison", "Comparison with previous imaging", [
      "Compared with previous studies — documented difference",
      "Compared with previous studies — unchanged",
      "No previous study available",
      "Not documented",
    ]),
    S("ortho_imaging_state", "State of the imaging at the time of this note", [
      "Reviewed by the treating clinician",
      "Reported — not yet reviewed",
      "Pending",
      "Not performed",
    ]),
    S("ortho_infection_features", "Features of bone or joint infection", [
      "None documented",
      "Fever with hot swollen joint",
      "Deep bone pain with systemic features",
      "Draining sinus",
      "Infected implant",
      "Wound cellulitis",
    ]),
  ]);

const assessmentSection = () =>
  sec("Assessment & diagnostic reasoning", [
    S("ortho_group", "Working diagnostic group", [
      "Fracture",
      "Open fracture",
      "Dislocation / fracture-dislocation",
      "Ligament / tendon injury",
      "Sports or overuse injury",
      "Degenerative joint disease",
      "Inflammatory joint disease",
      "Bone or joint infection",
      "Spinal disorder",
      "Congenital / developmental",
      "Post-operative complication",
      "Other",
    ]),
    S("ortho_diagnosis_status", "Status of the working diagnosis", [
      "Confirmed",
      "Suspected",
      "Provisional",
      "Differential only",
    ]),
    T("ortho_differential", "Differential diagnoses considered"),
    T("ortho_reasoning", "Clinical reasoning", {
      hint: "Why this diagnosis, what the examination and imaging show, and what would change the assessment",
    }),
  ]);

const management = () =>
  sec("Management plan", [
    S("ortho_treatment", "Treatment planned or performed", [
      "Non-operative — immobilisation and review",
      "Non-operative — functional bracing",
      "Operative — planned",
      "Operative — performed in this encounter",
      "Conservative with early rehabilitation",
      "Referral to a specialist centre",
    ]),
    I("ortho_immobilisation", "Immobilisation / cast / brace", { placeholder: "Type, position and duration" }),
    S("ortho_weight_bearing", "Weight-bearing status", [
      "Non-weight bearing",
      "Partial / toe-touch",
      "Full weight bearing",
      "As tolerated",
      "Not applicable",
    ]),
    S("ortho_vte_prophylaxis", "Venous thromboembolism prophylaxis", [
      "Prescribed — pharmacological",
      "Prescribed — mechanical only",
      "Contraindicated — documented",
      "Not prescribed",
    ]),
    I("ortho_antibiotics", "Antibiotics — agent, dose and indication"),
    I("ortho_analgesia", "Analgesia plan"),
    I("ortho_review_interval", "Review interval", { placeholder: "e.g. 1 week in fracture clinic" }),
    S("ortho_rehab_referral", "Rehabilitation referral", [
      "Referred to physiotherapy",
      "Referred to occupational therapy",
      "Not referred — reason documented",
      "Not applicable",
    ]),
    // The decision and its reason — operative or not — with the alternatives,
    // the indications, the consent record, the immobilisation actually applied
    // and checked, the medication and wound plan, and the recovery prescription.
    ...sec("Decision & rationale", ORTHO_DECISION_FIELDS),
    ...sec("Surgical indications & consent", ORTHO_SURGICAL_INDICATION_FIELDS),
    ...sec("Immobilisation, cast & reduction", ORTHO_IMMOBILISATION_FIELDS),
    ...sec("Analgesia, wound & infection prevention", ORTHO_MEDICATION_FIELDS),
    ...sec("Recovery & follow-up", ORTHO_RECOVERY_FIELDS),
  ]);

const preopSection = () =>
  sec("Pre-operative optimisation", [
    I("ortho_planned_procedure", "Planned procedure"),
    S("ortho_indication_confirmed", "Indication confirmed", ["Yes — documented", "No — pending", "Not applicable"]),
    T("ortho_anaemia_optimisation", "Anaemia and blood preparation", { hint: "Haemoglobin, iron, group and save, crossmatch" }),
    T("ortho_anticoag_plan", "Anticoagulant / antiplatelet peri-operative plan", {
      hint: "Agent, last dose, interruption and bridging decision, who decided",
    }),
    T("ortho_glycaemic", "Glycaemic control", { hint: "HbA1c and the peri-operative plan for diabetes" }),
    S("ortho_infection_screen", "Infection screening", [
      "MRSA screened — negative",
      "MRSA screened — positive",
      "Screening not performed",
      "Not applicable",
    ]),
    T("ortho_implant_plan", "Implant / hardware plan", { hint: "Type, size range and availability confirmed with the theatre team" }),
    S("ortho_consent_documented", "Consent", [
      "Documented — risks, benefits and alternatives discussed",
      "Pending",
      "Emergency — documented reason",
    ]),
  ]);

const operativeSection = () =>
  sec("Operative detail", [
    I("ortho_surgical_approach", "Surgical approach"),
    S("ortho_reduction_quality", "Reduction quality", ["Anatomical", "Acceptable", "Suboptimal — plan documented", "Not applicable"]),
    T("ortho_fixation", "Fixation construct", { hint: "Plate, screws, nail, tension band, arthroplasty — with configuration" }),
    I("ortho_implant_lot", "Implant lot / serial numbers recorded"),
    I("ortho_fluoroscopy", "Fluoroscopy / screening time"),
    I("ortho_tourniquet_duration", "Tourniquet time", { placeholder: "minutes" }),
    I("ortho_blood_loss", "Measured blood loss"),
    T("ortho_implant_stability", "Intra-operative stability and range achieved", {
      hint: "Stability testing, range under anaesthesia, and whether the plan changed",
    }),
    S("ortho_prophylaxis_given", "Antibiotic prophylaxis", [
      "Given — agent and time documented",
      "Not given — reason documented",
      "Not applicable",
    ]),
    T("ortho_intraop_complication", "Intra-operative complications"),
  ]);

const postopSection = () =>
  sec("Post-operative assessment", [
    S("ortho_wound_status", "Wound status", ["Intact", "Clean surgical wound", "Sutures intact", "Discharging", "Infected / dehisced"]),
    I("ortho_drain_output", "Drain output", { placeholder: "Volume, character and whether removed" }),
    S("ortho_distal_pulses", "Distal pulses", ["Palpable", "Doppler only", "Absent", "Not documented"]),
    S("ortho_sensation", "Sensation", ["Intact", "Reduced", "Absent", "Not documented"]),
    S("ortho_motor", "Motor function", ["Intact", "Weak", "Absent", "Not documented"]),
    S("ortho_compartment_assessment", "Compartment assessment", [
      "Not indicated",
      "Soft and compressible",
      "Firm — repeat assessment required",
      "Hard / tense",
    ]),
    N("ortho_compartment_pressure", "Compartment pressure measured", {
      unit: "mmHg",
      showIf: { key: "ortho_compartment_assessment", in: ["Firm — repeat assessment required", "Hard / tense"] },
    }),
    N("ortho_diastolic_pressure", "Diastolic blood pressure at the time of measurement", {
      unit: "mmHg",
      showIf: { key: "ortho_compartment_assessment", in: ["Firm — repeat assessment required", "Hard / tense"] },
    }),
    N("ortho_pain_score", "Pain score at rest", { min: 0, max: 10, unit: "/10" }),
    T("ortho_mobilisation", "Mobilisation and weight bearing achieved"),
    S("ortho_hardware_status", "Implant / hardware status", [
      "Not applicable",
      "In place — satisfactory",
      "Loosening",
      "Failure / breakage",
      "Infected implant",
    ]),
    T("ortho_postop_imaging", "Post-operative imaging review", { hint: "Views taken and findings, with the comparison to the immediate post-operative film" }),
    S("ortho_vte_prophylaxis", "Venous thromboembolism prophylaxis", [
      "Prescribed — pharmacological",
      "Prescribed — mechanical only",
      "Contraindicated — documented",
      "Not prescribed",
    ]),
  ]);

const dischargeSection = () =>
  sec("Discharge arrangements", [
    T("ortho_discharge_medication_list", "Discharge medications", { hint: "Analgesia, antibiotics, thromboprophylaxis with doses and durations" }),
    I("ortho_vte_duration", "Thromboprophylaxis duration", { placeholder: "e.g. 28 days from the day of surgery" }),
    T("ortho_wound_care", "Wound care instructions"),
    T("ortho_weight_bearing_instructions", "Weight-bearing and immobilisation instructions given"),
    I("ortho_clinic_followup", "Follow-up clinic and interval", { placeholder: "e.g. fracture clinic in 10 days with repeat X-ray" }),
    S("ortho_implant_card", "Implant information", [
      "Implant details and card given to the patient",
      "Implant details recorded — card to follow",
      "Not applicable",
    ]),
    T("ortho_return_precautions", "Return precautions explained", {
      hint: "Escalating pain, numbness, wound discharge, fever, inability to weight bear",
    }),
  ]);

const rehabSection = () =>
  sec("Rehabilitation", [
    S("ortho_rehab_phase", "Rehabilitation phase", ["Protected / immobilised", "Early mobilisation", "Strengthening", "Functional / return to activity"]),
    I("ortho_rom_target", "Range-of-motion target for this phase"),
    T("ortho_strength_program", "Strengthening programme"),
    T("ortho_gait_training", "Gait and balance training"),
    T("ortho_adjuncts", "Assistive devices and adjuncts", { hint: "Crutches, brace, continuous passive motion, walking aid" }),
    T("ortho_return_to_function", "Return to work, driving and sport", { hint: "Criteria and expected timescale documented with the patient" }),
    I("ortho_rehab_review", "Rehabilitation review interval"),
  ]);

const ALL = ["degenerative", "inflammatory", "infection", "bone_quality", "spine"];
const FRACTURE_PLACEHOLDER =
  "Search ICD-11 — enter the fracture, dislocation or injury from the WHO browser, or pick a seeded musculoskeletal category…";

const icdFor = (domains, placeholder) => icdB(domains, placeholder);

// One entry per existing note type. Each returns only the sections that note
// can legitimately carry, so the consultation does not ask for operative detail
// and the discharge summary does not ask for the mechanism of injury again.
export const ORTHO_CLINICAL_SECTIONS = {
  ortho_consultation: () => [
    icdFor(ALL, "Search ICD-11 — osteoarthritis, inflammatory arthropathy, spinal or bone disorder…"),
    ...injuryHistory(),
    ...examination(),
    ...neurovascular(),
    ...severitySection(),
    ...investigations(),
    ...traumaSection(),
    ...assessmentSection(),
    ...management(),
    ...safety(),
  ],
  ortho_followup: () => [
    icdFor(ALL, "Search ICD-11 — the diagnosis this review follows…"),
    ...sec("Interval review", [
      T("ortho_interval_history", "Interval history since the last review"),
      T("ortho_healing_progress", "Healing progress", { hint: "Clinical and radiographic union, wound healing, pain trend" }),
      S("ortho_hardware_status", "Implant / hardware status", [
        "Not applicable",
        "In place — satisfactory",
        "Loosening",
        "Failure / breakage",
        "Infected implant",
      ]),
      T("ortho_function_at_review", "Function and range at this review"),
      T("ortho_rehab_adherence", "Rehabilitation progress and adherence"),
    ]),
    ...healingSection(),
    ...investigations(),
    ...assessmentSection(),
    ...management(),
    ...traumaSection(),
    ...safety(),
  ],
  ortho_fracture_assessment: () => [
    icdFor(ALL, FRACTURE_PLACEHOLDER),
    ...injuryHistory(),
    ...fractureDetail(),
    ...examination(),
    ...neurovascular(),
    ...severitySection(),
    ...investigations(),
    ...healingSection(),
    ...traumaSection(),
    ...assessmentSection(),
    ...management(),
    ...safety(),
  ],
  ortho_injury_assessment: () => [
    icdFor(ALL, FRACTURE_PLACEHOLDER),
    ...injuryHistory(),
    ...sec("Tissue involvement", [
      S("ortho_tissue_bone", "Bone", ["Intact", "Fractured", "Not assessed"]),
      S("ortho_tissue_ligament", "Ligament", ["Intact", "Sprained", "Ruptured", "Not assessed"]),
      S("ortho_tissue_tendon", "Tendon", ["Intact", "Partial tear", "Complete rupture", "Not assessed"]),
      S("ortho_tissue_muscle", "Muscle", ["Intact", "Strain", "Rupture", "Not assessed"]),
      S("ortho_tissue_nerve", "Nerve", ["Intact", "Neuropraxia", "Deficit — documented", "Not assessed"]),
      S("ortho_open_closed", "Open / closed injury", ["Closed", "Open", "Open with bone loss", "Not applicable"]),
      S("ortho_gustilo", "Gustilo–Anderson grade (open injuries)", [
        "Grade I",
        "Grade II",
        "Grade IIIA",
        "Grade IIIB",
        "Grade IIIC",
        "Not yet classified",
      ], { showIf: { key: "ortho_open_closed", in: ["Open", "Open with bone loss"] } }),
      T("ortho_associated_injuries", "Associated injuries"),
    ]),
    ...examination(),
    ...neurovascular(),
    ...severitySection(),
    ...investigations(),
    ...traumaSection(),
    ...assessmentSection(),
    ...management(),
    ...safety(),
  ],
  ortho_preop_assessment: () => [
    icdFor(ALL, "Search ICD-11 — the diagnosis the procedure treats…"),
    ...preopSection(),
    ...sec("Fitness for surgery", [
      T("ortho_anaesthetic_review", "Anaesthetic review and ASA grade"),
      T("ortho_cardiorespiratory", "Cardiorespiratory assessment"),
      T("ortho_renal_hepatic", "Renal and hepatic function relevant to anaesthesia"),
      T("ortho_functional_baseline", "Functional baseline before surgery", { hint: "Mobility, aids, social support and discharge destination" }),
    ]),
    ...safety(),
  ],
  ortho_operative_note: () => [
    icdFor(ALL, "Search ICD-11 — the pre-operative and post-operative diagnosis…"),
    ...operativeSection(),
    ...traumaSection(),
    ...safety(),
  ],
  ortho_procedure_note: () => [
    icdFor(ALL, "Search ICD-11 — the diagnosis this procedure treats…"),
    ...sec("Procedure detail", [
      I("ortho_procedure_setting", "Setting", { placeholder: "Emergency department, theatre, clinic" }),
      S("ortho_procedure_type", "Procedure type", [
        "Closed reduction",
        "Joint aspiration / injection",
        "Cast or splint application",
        "Wound debridement",
        "Removal of hardware",
        "Other",
      ]),
      S("ortho_reduction_status", "Reduction status after the procedure", [
        "Reduced — documented",
        "Reduced in this encounter",
        "Not reduced — plan documented",
        "Not applicable",
      ]),
      T("ortho_post_procedure_nv", "Neurovascular status after the procedure"),
      T("ortho_post_procedure_imaging", "Post-procedure films — views and findings"),
      S("ortho_analgesia_effective", "Analgesia adequate after the procedure", ["Yes", "No — plan documented", "Not assessed"]),
    ]),
    ...traumaSection(),
    ...safety(),
  ],
  ortho_postop_note: () => [
    icdFor(ALL, "Search ICD-11 — the procedure diagnosis and any post-operative complication…"),
    ...postopSection(),
    ...traumaSection(),
    ...safety(),
  ],
  ortho_daily_progress: () => [
    icdFor(ALL, "Search ICD-11 — the active diagnosis and any complication on this ward day…"),
    ...postopSection(),
    ...traumaSection(),
    ...safety(),
  ],
  ortho_discharge_summary: () => [
    icdFor(ALL, "Search ICD-11 — the admission, procedure and discharge diagnoses…"),
    ...dischargeSection(),
    ...traumaSection(),
    ...healingSection(),
    ...safety(),
  ],
  ortho_rehab_plan: () => [
    icdFor(["degenerative", "spine", "bone_quality"], "Search ICD-11 — the condition being rehabilitated…"),
    ...rehabSection(),
    ...safety(),
  ],
};