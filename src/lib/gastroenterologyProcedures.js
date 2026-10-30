// Gastroenterology / Hepatology — procedure and time-critical documentation.
//
// The endoscopy, colonoscopy and ERCP notes already carry the endoscopic safety
// record (consent, time-out, ASA, sedation, monitoring, complications, recovery).
// What was missing is documentation for the procedures those notes also host but
// never described — EUS, capsule endoscopy, liver biopsy and paracentesis — plus
// the pre-procedure medication/allergy/anticoagulation record that every GI
// procedure needs, and a structured record for the time-critical presentations.
//
// Rules kept identical to the rest of the specialty:
//  - Nothing is preselected. A blank answer is "not documented", never "normal".
//  - Conditional questions (`showIf`) appear only where the procedure or the
//    documented problem makes them relevant.
//  - A block records what was done and what was arranged. It never states a
//    diagnosis, never orders a drug and never replaces the clinician's decision.
//  - Where a prompt or field reflects a general safety principle rather than a
//    published recommendation, the library says so instead of inventing a
//    society citation.

const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const M = (key, label, options, extra) => ({ key, label, type: "multi", options, ...extra });

const WHEN = (key, value) => ({ showIf: { key, equals: value } });
const WHEN_IN = (key, values) => ({ showIf: { key, in: values } });

const THERAPEUTIC = ["Therapeutic", "Diagnostic and therapeutic"];

const GI_AGENTS = [
  "Terlipressin",
  "Octreotide",
  "Somatostatin",
  "Ceftriaxone",
  "Norfloxacin",
  "Ciprofloxacin",
  "Rifaximin",
  "Lactulose",
  "Propranolol",
  "Carvedilol",
  "Intravenous proton pump inhibitor",
  "Rectal indomethacin after ERCP",
  "Pancreatic enzyme replacement",
  "Oral vancomycin",
  "Fidaxomicin",
  "Albumin",
];

export const GASTRO_PROCEDURE_BLOCKS = {
  // ---- Pre-procedure preparation, medication and allergy safety ------------
  gi_proc_safety: {
    title: "Pre-Procedure Preparation & Medication Safety",
    fields: [
      S("prep_fitness", "Preparation and Fitness for the Procedure", [
        "Fasting and airway assessment documented",
        "Preparation per protocol documented",
        "Emergency — not fasted, airway plan documented",
        "Not documented",
      ]),
      M("prep_medications", "Relevant Medications Reviewed Before the Procedure", [
        "Antiplatelet",
        "Anticoagulant",
        "Insulin",
        "Metformin",
        "Diuretic",
        "Non-steroidal anti-inflammatory drug",
        "Immunosuppressant",
        "None applicable",
        "Not reviewed",
      ]),
      T(
        "prep_anticoag_plan",
        "Antiplatelet / Anticoagulant Detail — Agent, Last Dose, Hold Interval, Restart Date and Who Decided",
        WHEN_IN("prep_medications", ["Antiplatelet", "Anticoagulant"])
      ),
      S("prep_allergy_check", "Allergy Status Verified Against the Record", [
        "Verified — no known allergies",
        "Verified — documented allergies reviewed",
        "Not documented",
      ]),
      S("prep_antibiotic", "Antibiotic Prophylaxis Before the Procedure", [
        "Not indicated",
        "Given — indication documented",
        "Not documented",
      ]),
      T("prep_antibiotic_detail", "Antibiotic Given — Agent, Dose, Route and Time", WHEN("prep_antibiotic", "Given — indication documented")),
      S("prep_fasting_compliance", "Documented Preparation Adequacy", [
        "Adequate for the planned procedure",
        "Inadequate — procedure modified or deferred",
        "Not applicable to this procedure",
        "Not documented",
      ]),
      I("prep_responsible_clinician", "Clinician Who Confirmed Fitness for the Procedure"),
    ],
  },

  // ---- Liver biopsy --------------------------------------------------------
  gi_liver_biopsy: {
    title: "Liver Biopsy Procedure Record",
    fields: [
      S("lb_route", "Route", [
        "Percutaneous — image guided",
        "Percutaneous — landmark technique",
        "Transjugular",
        "Laparoscopic",
        "Other — documented",
      ]),
      M("lb_coag_record", "Recorded Before the Biopsy", [
        "Platelet count documented",
        "INR documented",
        "Bleeding history reviewed",
        "Anticoagulant held",
        "Antiplatelet held",
        "None documented",
      ]),
      I("lb_coag_values", "Platelet Count, INR and Any Correction Given"),
      S("lb_needle", "Needle", ["16 gauge", "18 gauge", "Other — documented", "Not documented"]),
      N("lb_passes", "Number of Passes", { min: 0 }),
      S("lb_adequacy", "Specimen Adequacy for Histology", [
        "Adequate — length and portal tract number documented",
        "Adequate — length documented",
        "Suboptimal — repeat considered",
        "Not documented",
      ]),
      S("lb_observation", "Post-Biopsy Observation", [
        "Observed — observations documented for the observation period",
        "Observation not documented",
      ]),
      M("lb_complications", "Complications", [
        "None",
        "Bleeding",
        "Pain requiring analgesia",
        "Perforation",
        "Vasovagal reaction",
        "Other — documented",
      ]),
      S("lb_post_condition", "Post-Procedure Condition", [
        "Stable — discharged with written advice",
        "Admitted for observation",
        "Deteriorated — escalated",
        "Not documented",
      ]),
      S("lb_pathology", "Histology Request", ["Submitted with the clinical question", "To be submitted", "Not applicable"]),
      T("lb_followup", "Recommendations and Follow-Up"),
    ],
  },

  // ---- Paracentesis --------------------------------------------------------
  gi_paracentesis_proc: {
    title: "Paracentesis Procedure Record",
    fields: [
      S("pa_purpose", "Purpose", ["Diagnostic", "Therapeutic", "Diagnostic and therapeutic"]),
      S("pa_guidance", "Technique", ["Ultrasound guided", "Landmark technique", "Not documented"]),
      N("pa_volume", "Volume Removed", { min: 0, step: "0.1", unit: "litres", showIf: { key: "pa_purpose", in: THERAPEUTIC } }),
      M("pa_tests", "Ascitic Fluid Tests Sent", [
        "Cell count with neutrophil count",
        "Albumin with paired serum albumin for the serum-ascites albumin gradient",
        "Culture in blood culture bottles",
        "Cytology",
        "Glucose, protein and LDH",
        "Amylase",
        "Not documented",
      ]),
      S(
        "pa_albumin",
        "Albumin Replacement",
        ["Not indicated", "Given after large-volume paracentesis", "Indicated — not given, reason documented", "Not documented"],
        { showIf: { key: "pa_purpose", in: THERAPEUTIC } }
      ),
      M("pa_complications", "Complications", [
        "None",
        "Bleeding",
        "Bowel perforation",
        "Persistent leak",
        "Hypotension",
        "Infection",
        "Other — documented",
      ]),
      S("pa_post_condition", "Post-Procedure Condition", [
        "Stable — discharged with advice",
        "Observed — plan documented",
        "Deteriorated — escalated",
        "Not documented",
      ]),
      T("pa_followup", "Recommendations and Follow-Up"),
    ],
  },

  // ---- Endoscopic ultrasound ----------------------------------------------
  gi_eus: {
    title: "Endoscopic Ultrasound (EUS) Record",
    fields: [
      S("eus_scope", "Echoendoscope", ["Radial", "Linear (curved array)", "Both", "Not documented"]),
      S("eus_indication", "Indication", [
        "Pancreaticobiliary assessment",
        "Pancreatic mass",
        "Pancreatic cyst",
        "Subepithelial lesion",
        "Biliary obstruction",
        "Staging of a luminal malignancy",
        "Chronic pancreatitis",
        "Other — documented",
      ]),
      M("eus_stations", "Anatomy Examined", [
        "Oesophagus",
        "Stomach",
        "Duodenum",
        "Pancreas — head",
        "Pancreas — body and tail",
        "Biliary tree",
        "Mediastinum",
        "Not documented",
      ]),
      I("eus_lesion", "Lesion — Site, Size and Echo Features"),
      S("eus_tissue", "Tissue Acquisition", ["Not performed", "Fine-needle aspiration performed", "Fine-needle biopsy performed", "Attempted — non-diagnostic"]),
      S("eus_needle", "Needle Gauge", ["19 gauge", "22 gauge", "25 gauge", "Other — documented"], WHEN_IN("eus_tissue", ["Fine-needle aspiration performed", "Fine-needle biopsy performed"])),
      N("eus_passes", "Number of Passes", { min: 0, showIf: { key: "eus_tissue", in: ["Fine-needle aspiration performed", "Fine-needle biopsy performed"] } }),
      S(
        "eus_onsite",
        "On-Site Cytology Adequacy",
        ["Assessed — adequate", "Assessed — inadequate", "Not available"],
        { showIf: { key: "eus_tissue", in: ["Fine-needle aspiration performed", "Fine-needle biopsy performed"] } }
      ),
      S(
        "eus_cyst_antibiotic",
        "Antibiotic Prophylaxis for a Cystic Lesion",
        ["Not applicable — solid lesion", "Given — documented", "Indicated — not given, reason documented", "Not documented"],
        { showIf: { key: "eus_indication", in: ["Pancreatic cyst", "Pancreaticobiliary assessment", "Pancreatic mass"] } }
      ),
      M("eus_complications", "Complications", [
        "None",
        "Bleeding",
        "Perforation",
        "Post-procedure pancreatitis",
        "Infection",
        "Sedation-related event",
        "Other — documented",
      ]),
      S("eus_post_condition", "Post-Procedure Condition", [
        "Stable — discharged with advice",
        "Observed — plan documented",
        "Admitted",
        "Deteriorated — escalated",
        "Not documented",
      ]),
      T("eus_followup", "Recommendations and Follow-Up"),
    ],
  },

  // ---- Capsule endoscopy ---------------------------------------------------
  gi_capsule: {
    title: "Capsule Endoscopy Record",
    fields: [
      S("cap_type", "Study", ["Small bowel capsule", "Colon capsule", "Patency capsule first", "Other — documented"]),
      S("cap_indication", "Indication", [
        "Suspected small bowel bleeding",
        "Suspected or known Crohn disease",
        "Suspected small bowel tumour",
        "Polyposis surveillance — colon capsule",
        "Other — documented",
      ]),
      S("cap_patency", "Patency Assessed Before Ingestion", [
        "Patency confirmed before ingestion",
        "Patency capsule retained — study not proceeded with",
        "Not required",
        "Not documented",
      ]),
      S("cap_prep", "Preparation", ["Preparation per protocol documented", "Preparation inadequate — documented", "Not documented"]),
      S("cap_ingestion", "Ingestion and Oesophageal Transit", [
        "Swallowed — oesophageal transit confirmed",
        "Swallowed without a transit check",
        "Not documented",
      ]),
      S("cap_completion", "Study Completion", ["Complete — cecum reached", "Incomplete — reason documented", "Not documented"]),
      I("cap_transit_time", "Gastric and Small Bowel Transit Time"),
      T("cap_findings", "Findings by Segment"),
      S("cap_retention_risk", "Retention Risk Assessed", [
        "Assessed — no stricture suspected",
        "Assessed — stricture or previous retention documented",
        "Patency capsule used",
        "Not documented",
      ]),
      S("cap_excretion", "Capsule Status", [
        "Excreted",
        "Not yet excreted — tracking arranged",
        "Retained — management documented",
        "Not documented",
      ]),
      T("cap_followup", "Recommendations and Follow-Up"),
    ],
  },

  // ---- Time-critical abdominal presentations ------------------------------
  gi_acute: {
    title: "Acute Abdomen & Time-Critical Record",
    fields: [
      M("acute_problem", "Time-Critical Problem Documented at This Encounter", [
        "Perforation",
        "Obstruction",
        "Acute abdomen — cause not yet established",
        "Ischaemic bowel",
        "Severe dehydration",
        "Sepsis",
        "Acute pancreatitis",
        "Acute cholangitis",
        "Variceal haemorrhage",
        "Acute liver failure",
        "Altered consciousness",
        "None documented",
      ]),
      S(
        "acute_peritonism",
        "Peritonism on Examination",
        ["Present — guarding and rebound documented", "Absent", "Not assessed"],
        { showIf: { key: "acute_problem", in: ["Perforation", "Acute abdomen — cause not yet established", "Ischaemic bowel"] } }
      ),
      S(
        "acute_imaging",
        "Free Air / Obstruction Assessment on Imaging",
        [
          "Erect chest X-ray — free air documented",
          "CT abdomen performed",
          "Imaging arranged",
          "Not yet imaged — reason documented",
        ],
        { showIf: { key: "acute_problem", in: ["Perforation", "Obstruction", "Acute abdomen — cause not yet established"] } }
      ),
      S(
        "acute_decompression",
        "Bowel Decompression",
        ["Nasogastric or nasojejunal tube placed", "Not indicated", "Indicated — not placed, reason documented", "Not documented"],
        WHEN("acute_problem", "Obstruction")
      ),
      S(
        "acute_resuscitation",
        "Fluid Resuscitation and Reassessment",
        [
          "Resuscitation given with documented reassessment",
          "Resuscitation started — reassessment pending",
          "Not documented",
        ],
        { showIf: { key: "acute_problem", in: ["Severe dehydration", "Sepsis", "Perforation", "Acute abdomen — cause not yet established", "Ischaemic bowel"] } }
      ),
      S(
        "acute_cultures",
        "Cultures and Antibiotic Timing",
        [
          "Cultures taken and antibiotics given with times documented",
          "Cultures taken — antibiotics pending",
          "Not indicated",
          "Not documented",
        ],
        { showIf: { key: "acute_problem", in: ["Sepsis", "Acute cholangitis", "Perforation"] } }
      ),
      S(
        "acute_surgical",
        "Surgical Opinion",
        [
          "Obtained — time documented",
          "Discussed with the on-call surgeon",
          "Requested — awaiting review",
          "Not indicated — reason documented",
          "Not documented",
        ],
        { showIf: { key: "acute_problem", in: ["Perforation", "Obstruction", "Acute abdomen — cause not yet established", "Ischaemic bowel"] } }
      ),
      S(
        "acute_consciousness",
        "Consciousness and Airway",
        ["Alert and oriented", "Altered — GCS and airway plan documented", "Not assessed"],
        { showIf: { key: "acute_problem", in: ["Acute liver failure", "Altered consciousness", "Sepsis", "Variceal haemorrhage"] } }
      ),
      S("acute_level_of_care", "Level of Care", [
        "Escalated to high dependency or intensive care",
        "Discussed with the consultant — plan documented",
        "Ward care with documented observation",
        "Not documented",
      ]),
      I("acute_time_reference", "When the Time-Critical Problem Was Recognised and Who Was Informed"),
      T("acute_plan", "Immediate Management Planned"),
    ],
  },

  // ---- GI-critical drug therapy -------------------------------------------
  gi_drug_safety: {
    title: "GI Drug Therapy — Dose, Contraindications and Monitoring",
    fields: [
      M("drug_agents", "GI-Critical Agents Documented in This Encounter", [...GI_AGENTS, "None of these"]),
      T("drug_regimen", "Agent, Dose, Route, Frequency and Duration", { showIf: { key: "drug_agents", in: GI_AGENTS } }),
      S("drug_contraindications", "Contraindications Checked for the Agents Used", [
        "Checked — none present",
        "Present — agent changed or withheld, documented",
        "Not documented",
      ], { showIf: { key: "drug_agents", in: GI_AGENTS } }),
      S("drug_interactions", "Relevant Interactions Reviewed", [
        "Reviewed — none significant",
        "Interaction identified and managed",
        "Not documented",
      ], { showIf: { key: "drug_agents", in: GI_AGENTS } }),
      S("drug_allergy_check", "Allergy Check Against the Recorded Allergies", [
        "Verified — no known allergies",
        "Verified — documented allergy, alternative used",
        "Not documented",
      ], { showIf: { key: "drug_agents", in: GI_AGENTS } }),
      S("drug_monitoring", "Monitoring Documented", [
        "Monitoring parameters and review interval documented",
        "Monitoring not documented",
      ], { showIf: { key: "drug_agents", in: GI_AGENTS } }),
      T("drug_monitoring_detail", "Monitoring Parameters and Review Interval", WHEN("drug_monitoring", "Monitoring parameters and review interval documented")),
    ],
  },
};

export const GASTRO_PROCEDURE_BLOCK_KEYS = Object.keys(GASTRO_PROCEDURE_BLOCKS);