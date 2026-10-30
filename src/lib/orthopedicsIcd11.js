// Orthopedics & Traumatology — WHO ICD-11 MMS coding layer.
//
// WHAT THIS FILE DOES, AND WHAT IT REFUSES TO DO
// It gives the existing Orthopedics note types a searchable ICD-11 MMS selection,
// the orthopaedic detail a code cannot carry (laterality, anatomical site, injury
// time, open/closed, pattern, displacement, articular and soft-tissue involvement,
// classification system and grade), and the rule that a code never confirms a
// diagnosis on its own.
//
// IT CONTAINS NO PRE-VERIFIED CODE. That is deliberate. An orthopaedic code is
// only correct once it is tied to a region, a bone, a pattern and an open/closed
// status, and a wrong code is worse than no code. Every entry below is therefore
// stored as REVIEW REQUIRED with the release and source recorded, and the note
// only becomes verified when the clinician ticks that they checked the code, the
// official term and the release against the WHO browser — the verification step
// the ICD-11 field already records, with its date.
//
// Trauma categories (fractures by bone and site, dislocations, ligament and
// tendon injuries) are NOT pre-filled: the correct stem depends on the bone, the
// segment, the pattern and whether the injury is open, and WHO extension codes
// for laterality and episode belong in the postcoordinated cluster the Coding
// Tool produces. Those are taken from the browser — ORTHO_NOT_IN_CATALOGUE lists
// them with the search term to use — and stored with their source. Nothing in
// AMedix ever assembles a cluster, invents a code or promotes a suspected
// diagnosis to confirmed.
//
// Official reference: https://icd.who.int/

export const ORTHO_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2026-01",
  label: "ICD-11 MMS",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  source_url: "https://icd.who.int/",
  retrieved: "2026-10-30",
  chapters:
    "Chapter 15 — Diseases of the musculoskeletal system or connective tissue (osteoarthritis, inflammatory arthropathies, bone and joint infection, bone quality); Chapter 22 — Injury, poisoning or certain other consequences of external causes (fractures, dislocations, soft-tissue and nerve injury, complications of surgical care)",
  sources: [
    "WHO ICD-11 browser 2026-01 — the authority for every code, term and cluster (https://icd.who.int/browse/2026-01/mms/en)",
    "ICD-11 MMS reference listings for the musculoskeletal chapter, used only to seed the candidate entries below",
  ],
};

export const ORTHO_ICD11_DOMAINS = {
  degenerative: "Osteoarthritis and degenerative joint disease",
  inflammatory: "Inflammatory and crystal arthropathy",
  infection: "Bone and joint infection",
  bone_quality: "Osteoporosis and bone quality",
  spine: "Spinal degenerative and disc disease",
};

export const ORTHO_ICD_STATUSES = [
  "Confirmed",
  "Suspected",
  "Provisional",
  "Differential diagnosis",
  "Historical — previous injury or procedure",
  "Healed / resolved",
  "Post-operative complication",
];

export const ORTHO_ICD_ROLES = ["Primary", "Secondary", "Differential"];

// The orthopaedic detail a stem code cannot carry. Recorded beside the code,
// never appended to it, and never derived from it.
export const ORTHO_ICD_DETAIL_FIELDS = [
  {
    key: "laterality",
    label: "Laterality",
    type: "select",
    options: ["Right", "Left", "Bilateral", "Not applicable", "Not documented"],
  },
  { key: "anatomical_site", label: "Anatomical site", type: "input", placeholder: "e.g. femoral neck, distal radius metaphysis, L4–L5" },
  { key: "injury_datetime", label: "Date and time of injury", type: "input", placeholder: "e.g. 2026-10-29 18:40" },
  {
    key: "open_closed",
    label: "Open / closed",
    type: "select",
    options: ["Closed", "Open", "Open with bone loss", "Not applicable", "Not documented"],
  },
  {
    key: "fracture_pattern",
    label: "Fracture pattern",
    type: "select",
    options: [
      "Transverse",
      "Oblique",
      "Spiral",
      "Comminuted",
      "Segmental",
      "Impacted",
      "Avulsion",
      "Compression",
      "Greenstick",
      "Not applicable",
      "Not documented",
    ],
  },
  {
    key: "displacement",
    label: "Displacement",
    type: "select",
    options: ["Undisplaced", "Minimally displaced", "Displaced", "Significantly displaced", "Not documented"],
  },
  {
    key: "articular_involvement",
    label: "Articular involvement",
    type: "select",
    options: ["Extra-articular", "Intra-articular — undisplaced", "Intra-articular — displaced", "Not documented"],
  },
  {
    key: "soft_tissue_injury",
    label: "Soft-tissue injury",
    type: "select",
    options: ["None documented", "Contusion / swelling", "Open wound", "Severe soft-tissue compromise", "Not documented"],
  },
  { key: "classification_system", label: "Classification system used", type: "input", placeholder: "e.g. AO/OTA, Garden, Salter–Harris, Neer, Gustilo–Anderson, OTA-OFC" },
  { key: "classification_grade", label: "Grade / type within that system", type: "input", placeholder: "e.g. 31-B2, Garden III, Salter–Harris II" },
  {
    key: "implant_present",
    label: "Implant in place",
    type: "select",
    options: ["None", "Plate and screws", "Intramedullary nail", "Arthroplasty", "External fixator", "Other", "Not documented"],
  },
];

export const ORTHO_ICD_CATALOG_NOTE =
  "WHO ICD-11 MMS only — ICD-10 is never used and no ICD-10 crosswalk is applied. Nothing here is pre-verified: every entry is stored as Review required until the clinician confirms the code, the official term and the release against the WHO ICD-11 browser, and the verification date is recorded. Fractures, dislocations and soft-tissue injuries are taken from the browser rather than seeded here, because the correct stem depends on bone, segment, pattern and open/closed status.";

export const ORTHO_ICD_CLUSTER_NOTE =
  "Leave empty unless the WHO Coding Tool produced a postcoordinated cluster for this injury — a stem code plus the WHO extension codes for laterality, episode of care or open wound. Copy the cluster exactly as the browser shows it (codes joined with & and /). AMedix never assembles a cluster and never adds a laterality or severity stem itself.";

// Families an orthopaedic note needs but which are deliberately not seeded, with
// the search term that finds them in the WHO browser. The clinician takes the
// verified code from the browser; the note stores what was entered, its source
// and its release, and flags it until it is checked.
export const ORTHO_NOT_IN_CATALOGUE = [
  "Fracture of the proximal femur / femoral neck / intertrochanteric region — search 'fracture femur' and select the segment",
  "Fracture of the distal radius or ulna — search 'fracture radius'",
  "Fracture of the humerus, olecranon or radial head — search 'fracture humerus'",
  "Fracture of the tibia, fibula or ankle (including the pilon) — search 'fracture tibia'",
  "Fracture of the pelvis or acetabulum — search 'fracture pelvis' and 'fracture acetabulum'",
  "Fracture of the clavicle, scapula or patella — search 'fracture clavicle'",
  "Fracture of the carpal, metacarpal, tarsal or metatarsal bones — search the named bone",
  "Fracture of the vertebral column, with or without cord injury — search 'fracture vertebra' and code the cord injury separately",
  "Fracture of the facial bones — search the named bone",
  "Open fracture — code the fracture and the open wound together, with the OTA Open Fracture Classification recorded in the note",
  "Dislocation or subluxation of a joint (shoulder, elbow, hip, knee, ankle, small joints) — search 'dislocation' plus the joint",
  "Fracture-dislocation — search both, and record the reduction status in the note",
  "Ligament injury (ACL, PCL, MCL, LCL, ankle syndesmosis, shoulder labrum) — search 'injury ligament' plus the joint",
  "Meniscal, rotator-cuff and tendon injury or rupture — search 'injury tendon' plus the named tendon",
  "Muscle strain and muscle rupture — search the named muscle group",
  "Nerve injury complicating trauma (including the brachial plexus) — search 'injury nerve'",
  "Compartment syndrome (traumatic or post-operative) — search 'compartment syndrome'",
  "Septic arthritis, prosthetic joint infection, infected non-union and osteomyelitis of a named bone — search 'arthritis infectious' and 'osteomyelitis'",
  "Congenital musculoskeletal conditions (developmental dysplasia of the hip, clubfoot, limb deficiency) — search the named condition",
  "Paediatric fracture patterns (physeal injuries, Salter–Harris) — search 'fracture' plus the bone, and record the physeal type in the note",
  "Complications of surgical or orthopaedic care — search 'complication surgical' and the complication named (non-union, malunion, hardware failure, peri-prosthetic fracture)",
  "Osteonecrosis, bone tumour and metabolic bone disease other than osteoporosis — search the named condition",
];

export const ORTHO_ICD_SEARCH_GUIDANCE =
  "Type the bone, joint or condition. If nothing suitable appears, open the WHO ICD-11 browser (ICD-11 MMS, current release), copy the code and official term, and record the release you verified against — the entry is then flagged Review required until you confirm it.";

// Seed entries. State is review_required for every one of them — see the header.
const CANDIDATES = [
  ["FA00", "Osteoarthritis of hip", "degenerative", "hip"],
  ["FA01", "Osteoarthritis of knee", "degenerative", "knee gonarthrosis"],
  ["FA02", "Osteoarthritis of first carpometacarpal joint", "degenerative", "thumb base rhizarthrosis"],
  ["FA03", "Osteoarthritis of other specified joint", "degenerative", "degenerative joint disease"],
  ["FA25", "Gout", "inflammatory", "gouty arthritis urate crystal"],
  ["FA20", "Rheumatoid arthritis", "inflammatory", "RA inflammatory polyarthritis"],
  ["FA20.0", "Seropositive rheumatoid arthritis", "inflammatory", "RF positive"],
  ["FA20.1", "Seronegative rheumatoid arthritis", "inflammatory", "RF negative"],
  ["FB55", "Osteomyelitis", "infection", "bone infection osteitis"],
  ["FB83", "Osteoporosis", "bone_quality", "fragility fracture low bone density"],
  ["FA70", "Spinal osteoarthritis", "spine", "spondylosis degenerative spine"],
  ["FA80", "Intervertebral disc degeneration", "spine", "disc degeneration degenerative disc disease"],
];

const SPEC_BLOCK = "Block — verify the subcategory";
const SPEC_SUB = "Subcategory";

const NOTE_BY_CODE = {
  FA00: "Hip osteoarthritis — record the laterality, whether the diagnosis is radiographic or clinical only, and the functional limitation the note documents.",
  FA01: "Knee osteoarthritis — record the laterality and the compartment involved in the examination field; a severity grade is recorded in the note, never added to the code.",
  FA02: "First carpometacarpal osteoarthritis — record the laterality and the clinical (not radiographic alone) basis.",
  FA03: "Residual category — use only when the named joint is not represented by a more specific WHO category. State the joint and the laterality in the detail fields.",
  FA25: "Gout requires the documented clinical and crystal evidence. The note records which; the code does not establish the diagnosis.",
  FA20: "Rheumatoid arthritis is a clinical diagnosis with classification criteria. Record the serology and the criteria documented in the note.",
  "FA20.0": "Seropositive rheumatoid arthritis — apply when RF and/or anti-CCP positivity is documented, not when it is ordered and pending.",
  "FA20.1": "Seronegative rheumatoid arthritis — apply only when the serology is documented negative.",
  FB55: "Osteomyelitis — the bone, acuity (acute or chronic), the organism when known and the presence of hardware are recorded in the note; WHO does not carry them in this stem.",
  FB83: "Osteoporosis — record whether it is established by DXA, by a fragility fracture, or both. A fracture is coded separately.",
  FA70: "Spinal osteoarthritis — record the spinal region and whether radicular symptoms are documented. Nerve root or cord involvement may need its own entry.",
  FA80: "Intervertebral disc degeneration — record the level and whether there is associated radiculopathy or stenosis, which the stem does not carry.",
};

export const ORTHO_ICD11 = CANDIDATES.map(([code, display, domain, aliases]) => {
  const domainLabel = ORTHO_ICD11_DOMAINS[domain] || "";
  return {
    code,
    display,
    domain,
    domain_label: domainLabel,
    synonyms: aliases.split(" "),
    aliases: [domainLabel, aliases].filter(Boolean).join(" "),
    specificity: code.includes(".") || !/[A-Z]$/.test(code) ? SPEC_SUB : SPEC_BLOCK,
    release: ORTHO_ICD11_MMS.release,
    source: ORTHO_ICD11_MMS.sources[0],
    verified_date: "",
    // Never presented as verified: the clinician verifies against the browser
    // and the field records that verification with its date.
    mapping_state: "review_required",
    coding_note: NOTE_BY_CODE[code] || "",
    category: "Musculoskeletal diagnosis",
    primary: true,
    definition: `WHO ICD-11 MMS category in ${domainLabel}. Confirm the exact code, the official term and whether the current release offers a more specific subcategory in the WHO browser before confirming the diagnosis. Inclusion and exclusion notes are not reproduced here.`,
  };
});

for (const entry of ORTHO_ICD11) {
  const stem = entry.code.split(".")[0];
  const parent = stem !== entry.code ? ORTHO_ICD11.find((i) => i.code === stem) : null;
  entry.parent_code = parent ? parent.code : "";
  entry.parent_display = parent ? parent.display : "";
  entry.hierarchy = {
    chapter: ORTHO_ICD11_MMS.chapters,
    group: entry.domain_label,
    family: stem,
    parent: parent ? `${parent.code} ${parent.display}` : "",
    level: entry.code.includes(".") ? "Subcategory" : "Category",
  };
}

// Only the domains a given note can legitimately code.
export const orthopedicsCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return ORTHO_ICD11;
  return ORTHO_ICD11.filter((i) => wanted.includes(i.domain));
};

export const ORTHO_CATALOG_STATS = {
  total: ORTHO_ICD11.length,
  verified: ORTHO_ICD11.filter((i) => i.mapping_state === "verified").length,
  review_required: ORTHO_ICD11.filter((i) => i.mapping_state === "review_required").length,
  not_seeded: ORTHO_NOT_IN_CATALOGUE.length,
};