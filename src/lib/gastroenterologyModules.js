// Gastroenterology / Hepatology — structured documentation blocks.
//
// These are the reusable blocks the existing GI note types gain. Each block is
// one field of type `gi_modules` on the note, and its own definition lives here,
// so the form, the saved note, the printed record and the safety prompts all read
// the same specification. Nothing here duplicates a shared AMedix surface:
// vital signs, the structured abdominal examination, laboratory and imaging
// results, medications, allergies and the patient's recorded history are
// provided by the shared note tabs and the unified Patient Record.
//
// Rules applied throughout:
//  - "Not assessed" and "Not documented" are real answers, so a blank field is
//    never read as normal.
//  - Guideline questions appear only where the context makes them relevant
//    (`showIf`), so a follow-up note never asks for a Forrest class.
//  - Every option set is the vocabulary the cited guideline actually uses.

const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const M = (key, label, options, extra) => ({ key, label, type: "multi", options, ...extra });

const WHEN = (key, value) => ({ showIf: { key, equals: value } });
const WHEN_IN = (key, values) => ({ showIf: { key, in: values } });

const NOT_APPLICABLE = "Not applicable";

// Disease-specific blocks (upper GI, functional, coeliac, colorectal, pancreas,
// biliary, infection, viral hepatitis, MASLD, autoimmune/metabolic, cirrhosis)
// live in their own module and are merged into the same registry, so the form,
// the saved note, the PDF and the safety prompts read one catalogue.
import { GASTRO_DISEASE_BLOCKS } from "@/lib/gastroenterologyDiseaseBlocks";
// Procedure, pre-procedure, time-critical and GI drug-therapy blocks live in
// their own module for the same reason: one catalogue, one renderer.
import { GASTRO_PROCEDURE_BLOCKS } from "@/lib/gastroenterologyProcedures";

const CORE_BLOCKS = {
  // ---- Alarm features and escalation -------------------------------------
  gi_alarm: {
    title: "Alarm Features & Response",
    fields: [
      S("bleeding", "Overt GI Bleeding", ["None documented", "Haematemesis", "Melaena", "Haematochezia", "Occult — iron deficiency anaemia", "Not assessed"]),
      S("dysphagia", "Dysphagia / Odynophagia", ["None documented", "Progressive dysphagia", "Intermittent dysphagia", "Odynophagia only", "Not assessed"]),
      S("weight_loss", "Unintentional Weight Loss", ["None documented", "Yes — quantified below", "Not assessed"]),
      I("weight_loss_kg", "Weight Lost (kg) / Interval", WHEN("weight_loss", "Yes — quantified below")),
      S("anaemia", "Anaemia", ["None documented", "Iron deficiency anaemia documented", "Anaemia of another cause", "Not assessed"]),
      S("mass", "Mass, Organomegaly or Lymphadenopathy", ["None documented", "Abdominal mass", "Organomegaly", "Lymphadenopathy", "Not assessed"]),
      S("family_history", "Family History of GI Malignancy", ["No", "Yes — first-degree relative with colorectal or oesophageal / gastric cancer", "Not documented"]),
      S("persistent_vomiting", "Persistent Vomiting", ["No", "Yes — documented", "Not assessed"]),
      S("new_onset_older", "New-Onset Symptoms at an Age That Warrants Investigation", ["Not applicable", "Yes — documented", "No", "Not documented"]),
      S("escalation", "Urgency of the Clinical Response", [
        "Routine — outpatient pathway",
        "Expedited — investigation within days",
        "Two-week / fast-track suspected-cancer pathway",
        "Emergency — admitted or transferred today",
        "Not documented",
      ]),
      T("escalation_detail", "Who Was Informed, When, and What Was Arranged"),
      I("responsible_clinician", "Clinician Responsible for the Next Step"),
    ],
  },

  // ---- GI bleeding -------------------------------------------------------
  gi_bleeding: {
    title: "GI Bleeding Assessment",
    fields: [
      S("presentation", "Presentation", ["Haematemesis", "Coffee-ground vomiting", "Melaena", "Haematochezia", "Occult / anaemia only", "Other — documented"]),
      I("onset", "Time of Onset (as documented)"),
      S("haemodynamics", "Haemodynamic Status at Assessment", ["Stable", "Postural change on standing", "Tachycardic", "Hypotensive", "Shocked — resuscitation in progress", "Not documented"]),
      I("haemoglobin", "Documented Haemoglobin (g/L)"),
      S("transfusion", "Transfusion", [
        "Not required",
        "Cross-matched and transfused — units documented",
        "Massive transfusion protocol activated",
        "Transfusion threshold documented, not yet reached",
        "Not documented",
      ]),
      S("antithrombotic", "Antiplatelet / Anticoagulant Therapy", ["None", "Antiplatelet", "Anticoagulant", "Dual antiplatelet", "Anticoagulant plus antiplatelet", "Not documented"]),
      T("antithrombotic_plan", "Reversal, Holding and Restart Plan", WHEN_IN("antithrombotic", ["Antiplatelet", "Anticoagulant", "Dual antiplatelet", "Anticoagulant plus antiplatelet"])),
      S("endoscopy_timing", "Endoscopy Timing", [
        "Within 24 hours after resuscitation",
        "Within 12 hours — high-risk features documented",
        "Immediate — exsanguinating or unstable",
        "Deferred — reason documented",
        "Not documented",
      ]),
      S("lesion", "Bleeding Lesion at Endoscopy", [
        "Not yet endoscoped",
        "Peptic ulcer",
        "Erosive disease",
        "Mallory-Weiss tear",
        "Vascular lesion / angiodysplasia",
        "Varices",
        "Tumour",
        "No source identified",
      ]),
      S("forrest", "Forrest Class (Ulcer)", [
        "Not applicable — no ulcer",
        "Ia — spurting",
        "Ib — oozing",
        "IIa — non-bleeding visible vessel",
        "IIb — adherent clot",
        "IIc — flat pigmented spot",
        "III — clean base",
        "Not documented",
      ], WHEN_IN("lesion", ["Peptic ulcer"])),
      S("haemostasis", "Endoscopic Haemostasis", [
        "Not applicable",
        "Dual therapy — adrenaline injection plus a mechanical or thermal method",
        "Mechanical (clip / band ligation)",
        "Thermal",
        "Haemostatic powder",
        "Fibrin glue",
        "Attempted, not achieved",
        "Not documented",
      ]),
      S("varices", "Varices", [
        "Not applicable",
        "Oesophageal varices — grade documented",
        "Gastric varices — GOV1 / GOV2 / IGV documented",
        "Gastric varices with active bleeding",
        "Not documented",
      ]),
      S("vasoactive", "Vasoactive Therapy (Variceal Bleeding)", ["Not indicated", "Terlipressin", "Octreotide", "Somatostatin", "Not documented"]),
      S("antibiotic_prophylaxis", "Antibiotic Prophylaxis in Cirrhosis with Bleeding", [
        "Not applicable — no cirrhosis",
        "Ceftriaxone documented",
        "Alternative agent documented",
        "Not documented",
      ]),
      S("ppi", "Acid Suppression", ["Intravenous PPI documented", "Oral PPI documented", "Not indicated", "Not documented"]),
      S("rebleeding", "Rebleeding", ["No", "Yes — further bleeding documented", "Not assessed"]),
      S("disposition", "Disposition", ["Ward", "High dependency / ICU", "Transferred for specialist care", "Discharged with plan", "Not documented"]),
      T("restart_plan", "Antithrombotic Restart and Follow-Up Plan"),
    ],
  },

  // ---- Inflammatory bowel disease ----------------------------------------
  gi_ibd: {
    title: "Inflammatory Bowel Disease Assessment",
    fields: [
      S("disease", ["Ulcerative colitis", "Crohn disease", "IBD unclassified", "Not applicable"]),
      S("extent", "Documented Extent", [
        "Proctitis",
        "Left-sided colitis",
        "Extensive colitis",
        "Pan-colonic",
        "Ileal",
        "Ileocolonic",
        "Colonic",
        "Upper GI plus ileocolonic",
        "Perianal disease only",
        "Not documented",
      ]),
      S("activity_instrument", "Activity Instrument Used", ["Partial Mayo Score", "Harvey-Bradshaw Index", "Physician global assessment", "Endoscopic score only", "Not documented"]),
      S("endoscopic_severity", "Endoscopic Severity (where an examination was performed)", ["Mayo endoscopic 0", "Mayo endoscopic 1", "Mayo endoscopic 2", "Mayo endoscopic 3", "SES-CD documented", "Not documented", "Not performed"]),
      M("extraintestinal", "Extraintestinal Manifestations", ["None documented", "Arthritis / arthralgia", "Skin (erythema nodosum, pyoderma)", "Eyes (uveitis, episcleritis)", "Primary sclerosing cholangitis", "Thrombosis", "Not assessed"]),
      S("perianal", "Perianal Disease", ["None", "Fissure", "Fistula", "Abscess", "Not assessed"]),
      S("biologic", "Biologic Therapy", ["None", "Infliximab", "Adalimumab", "Ustekinumab", "Vedolizumab", "Tofacitinib or other small molecule", "Other — documented"]),
      S("immunomodulator", "Immunomodulator", ["None", "Azathioprine", "Mercaptopurine", "Methotrexate"]),
      M("pretreatment_screening", "Screening Before Immunosuppression", [
        "Tuberculosis screening documented (IGRA and/or chest imaging)",
        "Hepatitis B serology documented",
        "HIV and hepatitis C status documented",
        "Varicella immunity documented",
        "Vaccinations reviewed",
        "None documented",
      ], WHEN_IN("biologic", ["Infliximab", "Adalimumab", "Ustekinumab", "Vedolizumab", "Tofacitinib or other small molecule", "Other — documented"])),
      S("cdiff", "Clostridioides difficile Testing in a Flare", ["Not indicated", "Tested — negative", "Tested — positive", "Not documented"]),
      S("acute_severe", "Acute Severe Colitis", ["Not present", "Present — Truelove and Witts criteria documented", "Not assessed"]),
      S("rescue", "Rescue Therapy Considered", ["Not applicable", "Intravenous corticosteroid started", "Infliximab considered or given", "Surgical opinion obtained", "Not documented"], WHEN("acute_severe", "Present — Truelove and Witts criteria documented")),
      S("dysplasia_surveillance", "Dysplasia Surveillance", ["Not due", "Chromoscopy performed at this examination", "Due — arranged", "Not documented"]),
      S("bone_health", "Bone Health and Nutrition", ["Bone density documented", "Vitamin D and calcium addressed", "Referred for assessment", "Not addressed"]),
      S("treatment_target", "Documented Treatment Target", ["Clinical remission", "Endoscopic remission", "Steroid-free remission", "Transmural healing", "Not documented"]),
    ],
  },

  // ---- Hepatology --------------------------------------------------------
  gi_liver: {
    title: "Liver Disease Assessment",
    fields: [
      M("aetiology", "Documented Aetiology", [
        "Hepatitis B",
        "Hepatitis C",
        "Alcohol-associated liver disease",
        "Metabolic dysfunction-associated steatotic liver disease",
        "Autoimmune hepatitis",
        "Primary biliary cholangitis",
        "Primary sclerosing cholangitis",
        "Haemochromatosis",
        "Wilson disease",
        "Alpha-1 antitrypsin deficiency",
        "Drug-induced liver injury",
        "Vascular",
        "No cause identified — documented as such",
      ]),
      T("aetiology_evidence", "Evidence for the Aetiology (serology, imaging, histology, exposure)"),
      S("noninvasive_test", "Non-Invasive Fibrosis Assessment", ["FIB-4 (calculated in this note)", "Transient elastography — value documented", "Serum fibrosis panel", "Not performed"]),
      I("liver_stiffness", "Liver Stiffness (kPa), where measured"),
      S("fibrosis_stage", "Documented Fibrosis Stage", ["F0", "F1", "F2", "F3", "F4 — cirrhosis", "Not documented"]),
      M("decompensation", "Decompensation Events", ["None documented", "Ascites", "Variceal bleeding", "Hepatic encephalopathy", "Jaundice", "Spontaneous bacterial peritonitis", "Hepatorenal syndrome / AKI", "Not assessed"]),
      S("ascites_grade", "Ascites", ["None", "Mild — detectable on ultrasound only", "Moderate", "Severe / tense", "Refractory", "Not assessed"]),
      S("paracentesis", "Diagnostic Paracentesis", [
        "Not indicated",
        "Performed — ascitic neutrophil count documented",
        "Performed — result not yet documented",
        "Indicated, not performed — reason documented",
        "Not documented",
      ], WHEN_IN("ascites_grade", ["Mild — detectable on ultrasound only", "Moderate", "Severe / tense", "Refractory"])),
      S("sbp", "Spontaneous Bacterial Peritonitis", ["Not present", "Confirmed — neutrophils ≥ 250/mm³", "Culture negative but treated", "Not assessed"]),
      S("sbp_prophylaxis", "SBP Prophylaxis", ["Not indicated", "Norfloxacin documented", "Ciprofloxacin documented", "Other agent documented", "Not documented"]),
      S("encephalopathy_grade", "Hepatic Encephalopathy Grade (West Haven)", ["None", "Covert / minimal", "Grade I", "Grade II", "Grade III", "Grade IV", "Not assessed"]),
      S("varices", "Varices Status", [
        "Not yet screened",
        "None — non-invasive criteria met (liver stiffness ≤ 20 kPa and platelets ≥ 150 ×10⁹/L)",
        "Small",
        "Medium",
        "Large",
        "Not documented",
      ]),
      S("variceal_prophylaxis", "Portal Hypertension Prophylaxis", ["Not indicated", "Non-selective beta-blocker", "Carvedilol", "Endoscopic band ligation", "Not documented"]),
      S("hcc_surveillance", "HCC Surveillance", [
        "Not indicated for this patient",
        "Up to date — next examination date recorded",
        "Started — first examination arranged",
        "Overdue — arranged now",
        "Not documented",
      ]),
      I("hcc_next_date", "Next Surveillance Examination Due"),
      S("alcohol_assessment", "Alcohol Use Assessment", ["Not applicable", "Documented — quantity and pattern recorded", "Structured tool (AUDIT-C) recorded", "Referred to alcohol service", "Not documented"]),
      S("hbv_treatment", "Hepatitis B Treatment Status", ["Not applicable", "On antiviral therapy — agent documented", "Monitoring only — criteria documented", "Not documented"]),
      S("transplant_referral", "Transplant Assessment", ["Not indicated", "Referred", "Under assessment", "Not documented"]),
      T("liver_plan", "Management and Prevention Documented at This Visit"),
    ],
  },

  // ---- Acute pancreatitis ------------------------------------------------
  gi_pancreatitis: {
    title: "Acute Pancreatitis Assessment",
    fields: [
      M("diagnostic_basis", "Diagnostic Criteria Met (two of three required)", [
        "Characteristic epigastric pain",
        "Lipase or amylase greater than three times the upper limit of normal",
        "Imaging consistent with pancreatitis",
      ]),
      I("lipase", "Documented Lipase / Amylase"),
      S("aetiology", "Aetiology", ["Gallstones", "Alcohol", "Hypertriglyceridaemia", "Hypercalcaemia", "Post-ERCP", "Drug-induced", "Idiopathic — after work-up", "Other — documented"]),
      M("aetiology_workup", "Aetiology Work-Up Performed", [
        "Transabdominal ultrasound",
        "Triglycerides",
        "Serum calcium",
        "Medication review",
        "MRCP or EUS considered",
        "None documented",
      ]),
      S("severity", "Severity Classification (Revised Atlanta)", ["Mild — no organ failure, no local complication", "Moderately severe — transient organ failure or local complication", "Severe — persistent organ failure beyond 48 hours", "Not classified"]),
      M("organ_failure", "Organ Failure Present", ["None", "Respiratory", "Cardiovascular", "Renal"]),
      S("fluids", "Early Fluid Therapy", [
        "Moderately aggressive crystalloid with documented reassessment",
        "Crystalloid without documented reassessment",
        "Restricted — reason documented",
        "Not documented",
      ]),
      S("feeding", "Nutrition", ["Oral as tolerated", "Enteral feeding started within 72 hours", "Parenteral nutrition", "Nil by mouth — reason documented", "Not documented"]),
      S("necrosis", "Necrosis / Collections", ["None", "Not assessed", "Sterile necrosis or collection", "Infected necrosis"]),
      S("antibiotics", "Antibiotics", ["Not indicated", "Documented for infected necrosis or another infection", "Given without documented indication", "Not documented"]),
      S("disposition", "Disposition", ["Ward", "High dependency / ICU", "Discharged with plan", "Transfer", "Not documented"]),
    ],
  },

  // ---- Endoscopy safety and quality -------------------------------------
  gi_endoscopy: {
    title: "Endoscopy Safety & Quality Record",
    fields: [
      S("consent", "Consent", ["Written informed consent documented", "Emergency procedure — rationale documented", "Not documented"]),
      S("timeout", "Time-Out", ["Performed — identity, procedure, allergies and antithrombotic therapy verified", "Not documented"]),
      S("asa", "ASA Physical Status", ["ASA I", "ASA II", "ASA III", "ASA IV", "Not documented"]),
      S("sedation", "Sedation", ["Midazolam with or without opioid", "Propofol — anaesthetist or sedationist present", "Propofol — endoscopist administered", "No sedation", "Not documented"]),
      S("monitoring", "Monitoring During Sedation", ["Pulse oximetry, blood pressure and ECG documented", "Pulse oximetry only", "Not documented"]),
      S("insufflation", "Insufflation", ["Carbon dioxide", "Air", "Not documented"]),
      S("photodocumentation", "Photodocumentation of Key Landmarks and Lesions", ["Documented", "Partial", "Not documented"]),
      S("hp_testing", "Helicobacter pylori Assessment", ["Not indicated", "Rapid urease test", "Histology", "Stool antigen", "Urea breath test", "Not documented"]),
      M("complications", "Complications Recognised", ["None", "Bleeding", "Perforation", "Sedation-related event", "Aspiration", "Other — documented"]),
      T("complication_management", "Complication Management and Who Was Informed"),
      S("recovery", "Recovery and Discharge", ["Recovered and discharged with written advice", "Observed in recovery — plan documented", "Admitted", "Not documented"]),
      S("antithrombotic_plan", "Antithrombotic Plan Around the Procedure", ["Not applicable", "Continued — documented as low risk", "Held — restart documented", "Not documented"]),
      S("pathology", "Histology / Pathology Tracking", [
        "Specimens sent — request submitted",
        "Specimens sent — request pending",
        "No specimen taken",
        "Not documented",
      ]),
      I("procedure_follow_up", "Follow-Up Arranged and the Clinician Responsible"),
    ],
  },

  // ---- Colonoscopy / polypectomy ----------------------------------------
  gi_polypectomy: {
    title: "Colonoscopy Quality & Polypectomy Record",
    fields: [
      S("prep_scale", "Preparation Scale Used", ["Boston Bowel Preparation Scale", "Aronchick scale", "Not documented"]),
      S("prep_quality", "Preparation Quality for the Examination", ["Adequate — all segments", "Inadequate — repeat examination required", "Inadequate — repeat arranged", "Not documented"]),
      I("prep_score", "Documented Preparation Score (total, where a scale was used)"),
      S("cecal_intubation", "Cecal Intubation", ["Yes — photodocumented", "Yes — not photodocumented", "No — reason documented", "Not documented"]),
      N("withdrawal_minutes", "Withdrawal Time (minutes)"),
      S("withdrawal_adequacy", "Withdrawal Time Documented as Adequate", ["Yes — ≥ 6 minutes recorded", "No — reason documented", "Not documented"]),
      N("polyp_count", "Number of Polyps Removed"),
      N("largest_polyp_mm", "Largest Polyp (mm)"),
      T("polyp_detail", "Polyp Detail — Site, Size, Paris Morphology, Resection Method and Retrieval"),
      M("resection", "Resection Techniques Used", ["Cold snare", "Hot snare", "Endoscopic mucosal resection", "Submucosal dissection", "Piecemeal resection", "Not applicable"]),
      S("specimens", "Specimen Handling", ["All retrieved and sent in separate containers by site", "Retrieved — containers not separated by site", "Incomplete retrieval — documented", "Not applicable"]),
      S("clearance", "Clearance Status", ["Complete", "Clearance examination arranged", "Incomplete — reasons documented", "Not documented"]),
      S("surveillance", "Surveillance Interval Recommended", ["1 year", "3 years", "5 years", "10 years", "No surveillance", "Not determined — reasons documented"]),
      S("surveillance_basis", "Interval Based On", ["USMSTF 2020", "ESGE 2020", "Local protocol", "Not documented"]),
      S("perforation_check", "Perforation Assessment", ["No perforation suspected", "Suspected — management documented", "Not documented"]),
      S("bleeding_check", "Post-Polypectomy Bleeding", ["None", "Immediate — controlled endoscopically", "Delayed — documented", "Not assessed"]),
      S("antibiotic_prophylaxis", "Antibiotic Prophylaxis", ["Not indicated", "Given — indication documented", "Not documented"]),
    ],
  },

  // ---- ERCP ---------------------------------------------------------------
  gi_ercp: {
    title: "ERCP Safety Record",
    fields: [
      S("difficulty", "Procedure Difficulty (Schutz grade)", ["Grade I", "Grade II", "Grade III", "Grade IV", "Not graded"]),
      S("cannulation", "Cannulation Technique", [
        "Standard catheter with guidewire",
        "Double-wire technique",
        "Pancreatic guidewire placement",
        "Transpapillary balloon dilation",
        "Precut / fistulotomy",
        "Not documented",
      ]),
      S("sphincterotomy", "Sphincterotomy", ["None", "Biliary — standard", "Biliary — large", "Biliary with pancreatic sphincterotomy", "Not documented"]),
      S("stent", "Stent Placed", ["None", "Plastic — straight", "Plastic — pigtail", "Metal — covered", "Metal — uncovered", "Biliary and pancreatic stents"]),
      I("stent_specification", "Stent Specification (length, diameter, number)"),
      S("stent_plan", "Stent Plan", ["Not applicable", "Left in place — removal arranged", "Exchanged at this procedure", "Removed at this procedure"]),
      M("peps_prophylaxis", "Post-ERCP Pancreatitis Prophylaxis", [
        "Rectal non-steroidal anti-inflammatory drug given",
        "Periprocedural hydration documented",
        "Pancreatic stent placed",
        "Not indicated",
        "Not documented",
      ]),
      S("antibiotic_prophylaxis", "Antibiotic Prophylaxis", ["Not indicated", "Given — indication documented", "Not documented"]),
      S("perforation_check", "Perforation Assessment", ["No perforation suspected", "Suspected — management documented", "Not documented"]),
      S("bleeding_check", "Post-Sphincterotomy Bleeding", ["None", "Immediate — controlled", "Delayed — documented", "Not assessed"]),
      S("cholecystectomy", "Cholecystectomy Plan (after duct clearance for stones)", ["Not applicable", "Referred for cholecystectomy", "Already performed", "Deferred — reason documented", "Not documented"]),
      T("post_procedure_plan", "Post-Procedure Monitoring and Follow-Up"),
    ],
  },

  // ---- Nutrition and malabsorption ---------------------------------------
  gi_nutrition: {
    title: "Nutrition & Malabsorption",
    fields: [
      S("weight_trend", "Weight Trend", ["Stable", "Unintentional loss greater than 5% in three months", "Unintentional gain", "Not documented"]),
      N("bmi", "Documented BMI"),
      M("micronutrients", "Micronutrient Deficiencies Documented", ["None documented", "Vitamin B12", "Folate", "Iron / ferritin", "Vitamin D", "Calcium", "Zinc", "Magnesium", "Not assessed"]),
      S("dietitian", "Dietitian Involvement", ["Referred", "Review in progress", "Not indicated", "Not documented"]),
      S("support", "Nutritional Support", ["Not required", "Oral supplements", "Nasogastric feeding", "Nasojejunal feeding", "Parenteral nutrition", "Not documented"]),
      S("coeliac_serology", "Coeliac Serology (where coeliac disease is being considered)", [
        "Not applicable",
        "tTG-IgA with total IgA taken on a gluten-containing diet",
        "Serology taken while on a gluten-free diet — interpret with caution",
        "Not documented",
      ]),
      T("plan", "Nutrition Plan and Education Given"),
    ],
  },

  // ---- Discharge bundle --------------------------------------------------
  gi_discharge: {
    title: "Discharge Bundle",
    fields: [
      S("medication_reconciliation", "Medication Reconciliation", ["Documented", "Not documented"]),
      M("high_risk_medications", "High-Risk Therapy Reviewed", ["Anticoagulant", "Antiplatelet", "Non-steroidal anti-inflammatory drug", "Corticosteroid", "Immunomodulator", "Biologic", "None applicable"]),
      M("prophylaxis", "Prophylaxis Documented at Discharge", ["SBP prophylaxis", "Variceal bleeding prophylaxis", "Venous thromboembolism prophylaxis", "Bone protection", "None indicated"]),
      M("surveillance", "Surveillance Arranged", ["HCC ultrasound with or without AFP", "Variceal screening", "Colonoscopy surveillance", "IBD dysplasia surveillance", "None indicated"]),
      S("biologic_monitoring", "Biologic Safety Monitoring", ["Not applicable", "Laboratory and infection monitoring scheduled", "Not documented"]),
      S("readmission_risk", "Readmission Risk", ["Low", "Moderate", "High — mitigation plan documented"]),
      T("warning_signs", "Warning Signs Explained to the Patient"),
      I("follow_up_who", "Follow-Up With"),
      I("follow_up_when", "Follow-Up Date"),
      I("responsible_clinician", "Clinician Responsible"),
    ],
  },
};

export const GASTRO_BLOCKS = { ...CORE_BLOCKS, ...GASTRO_DISEASE_BLOCKS, ...GASTRO_PROCEDURE_BLOCKS };

export const gastroBlock = (key) => GASTRO_BLOCKS[key] || null;
export const GASTRO_BLOCK_KEYS = Object.keys(GASTRO_BLOCKS);

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const str = (v) => String(v ?? "").trim();
const list = (v) => (Array.isArray(v) ? v.filter((x) => str(x)) : str(v) ? [str(v)] : []);

// The block value a field holds, tagged with its own block key so the saved
// note, the screen and the PDF can be rebuilt without the form's context.
export const gastroBlockValue = (blockKey, value) => {
  const v = asObject(value);
  return { ...v, __m: blockKey };
};

export const gastroBlockFrom = (value) => {
  const v = asObject(value);
  return v.__m && GASTRO_BLOCKS[v.__m] ? GASTRO_BLOCKS[v.__m] : null;
};

export const formatGastroBlock = (value) => {
  const v = asObject(value);
  const spec = gastroBlockFrom(value);
  if (!spec) return "";
  const lines = spec.fields
    .map((f) => {
      const raw = v[f.key];
      if (f.type === "multi") {
        const items = list(raw);
        return items.length ? `${f.label}: ${items.join("; ")}` : null;
      }
      const val = str(raw);
      return val ? `${f.label}: ${val}` : null;
    })
    .filter(Boolean);
  if (!lines.length) return `${spec.title} — not documented in this note.`;
  return lines.join("\n");
};

// Reads a value for a flag from any GI block or from the note itself, so a rule
// keeps working whether the value sits in its block or on the note.
export const gastroFind = (values, blockKey, key) => {
  const block = asObject(values?.[blockKey]);
  if (str(block[key])) return str(block[key]);
  const direct = str(values?.[key]);
  if (direct) return direct;
  for (const k of GASTRO_BLOCK_KEYS) {
    const other = asObject(values?.[k]);
    if (str(other[key])) return str(other[key]);
  }
  return "";
};

export const gastroFindList = (values, blockKey, key) => {
  const block = asObject(values?.[blockKey]);
  if (list(block[key]).length) return list(block[key]);
  return list(values?.[key]);
};

const isBlank = (v) => str(v) === "" || /^(not documented|not assessed|not performed)$/i.test(str(v));

// Every flag the advisory prompts are built on, computed once from the note.
export const gastroFlags = (values = {}) => {
  const v = values || {};
  const f = (block, key) => gastroFind(v, block, key);
  const l = (block, key) => gastroFindList(v, block, key);
  // A block counts as documented only when a real answer was entered; the
  // block's own tag (`__m`) on an otherwise empty block means nothing was.
  const hasBlock = (block) => {
    const b = asObject(v[block]);
    return Object.keys(b).some(
      (k) => k !== "__m" && (Array.isArray(b[k]) ? b[k].filter((x) => str(x)).length > 0 : str(b[k]) !== "")
    );
  };

  const aetiology = l("gi_liver", "aetiology");
  const cirrhosis = aetiology.length > 0 && (f("gi_liver", "fibrosis_stage") === "F4 — cirrhosis" || /cirrhosis/i.test(f("gi_liver", "fibrosis_stage")));
  const ascites = !/^(None|Not assessed)$/i.test(f("gi_liver", "ascites_grade")) && f("gi_liver", "ascites_grade") !== "";
  const ibd = /ulcerative colitis|crohn|ibd unclassified/i.test(f("gi_ibd", "disease"));
  const onImmunosuppression = !/^(None|)$/i.test(f("gi_ibd", "biologic")) || !/^(None|)$/i.test(f("gi_ibd", "immunomodulator"));
  const alarm = f("gi_alarm", "bleeding") !== "None documented" && f("gi_alarm", "bleeding") !== "";

  return {
    // Alarm / escalation
    dysphagia: /Progressive dysphagia/i.test(f("gi_alarm", "dysphagia")),
    weight_loss: /Yes/i.test(f("gi_alarm", "weight_loss")),
    anaemia: /Iron deficiency/i.test(f("gi_alarm", "anaemia")),
    family_history: /^Yes/i.test(f("gi_alarm", "family_history")),
    alarm_escalation_missing: /Not documented|Routine/i.test(f("gi_alarm", "escalation")) && (alarm || /Progressive/i.test(f("gi_alarm", "dysphagia")) || /Yes/i.test(f("gi_alarm", "weight_loss"))),
    no_responsible: isBlank(f("gi_alarm", "responsible_clinician")) && isBlank(v?.responsible_clinician),

    // Bleeding
    bleeding_documented: !isBlank(f("gi_bleeding", "presentation")),
    endoscopy_timing_missing: isBlank(f("gi_bleeding", "endoscopy_timing")),
    variceal_bleeding: /Oesophageal varices|Gastric varices/i.test(f("gi_bleeding", "varices")),
    vasoactive_missing: isBlank(f("gi_bleeding", "vasoactive")),
    antibiotic_missing: isBlank(f("gi_bleeding", "antibiotic_prophylaxis")),
    on_antithrombotic: !/^(None|Not documented|)$/i.test(f("gi_bleeding", "antithrombotic")),
    antithrombotic_plan_missing: !/^(None|Not documented|)$/i.test(f("gi_bleeding", "antithrombotic")) && isBlank(f("gi_bleeding", "antithrombotic_plan")),
    ulcer_without_forrest: /Peptic ulcer/i.test(f("gi_bleeding", "lesion")) && isBlank(f("gi_bleeding", "forrest")),
    rebleed: /^Yes/i.test(f("gi_bleeding", "rebleeding")),

    ulcer_hp_missing: /Peptic ulcer/i.test(f("gi_bleeding", "lesion")) && (isBlank(f("gi_endoscopy", "hp_testing")) || /Not documented/i.test(f("gi_endoscopy", "hp_testing"))),
    dili_without_causality: /Drug-induced/i.test(aetiology.join(" ")) && isBlank(f("gi_liver", "aetiology_evidence")),
    coeliac_without_serology: /^Not documented$/i.test(f("gi_nutrition", "coeliac_serology")),

    // IBD
    ibd,
    onImmunosuppression,
    screening_missing: ibd && onImmunosuppression && l("gi_ibd", "pretreatment_screening").length === 0,
    acute_severe: /Present/i.test(f("gi_ibd", "acute_severe")),
    rescue_missing: /Present/i.test(f("gi_ibd", "acute_severe")) && isBlank(f("gi_ibd", "rescue")),
    cdiff_missing: ibd && isBlank(f("gi_ibd", "cdiff")),
    surveillance_missing: ibd && isBlank(f("gi_ibd", "dysplasia_surveillance")),

    // Liver
    liver_disease: aetiology.length > 0,
    cirrhosis,
    fib4_missing: aetiology.length > 0 && isBlank(f("gi_liver", "noninvasive_test")),
    ascites,
    paracentesis_missing: ascites && isBlank(f("gi_liver", "paracentesis")),
    sbp: /Confirmed|Culture negative/i.test(f("gi_liver", "sbp")),
    sbp_prophylaxis_missing: /Confirmed|Culture negative/i.test(f("gi_liver", "sbp")) && /Not documented/i.test(f("gi_liver", "sbp_prophylaxis")),
    hcc_surveillance_missing: cirrhosis && (isBlank(f("gi_liver", "hcc_surveillance")) || /Overdue/i.test(f("gi_liver", "hcc_surveillance"))),
    varices_missing: cirrhosis && isBlank(f("gi_liver", "varices")),
    variceal_prophylaxis_missing: cirrhosis && /Small|Medium|Large/i.test(f("gi_liver", "varices")) && isBlank(f("gi_liver", "variceal_prophylaxis")),
    severe_encephalopathy: /Grade III|Grade IV/i.test(f("gi_liver", "encephalopathy_grade")),
    alcohol_disease: /Alcohol-associated/i.test(aetiology.join(" ")),
    alcohol_assessment_missing: /Alcohol-associated/i.test(aetiology.join(" ")) && isBlank(f("gi_liver", "alcohol_assessment")),

    // Pancreatitis
    pancreatitis_documented: l("gi_pancreatitis", "diagnostic_basis").length > 0,
    pancreatitis_criteria_incomplete: l("gi_pancreatitis", "diagnostic_basis").length > 0 && l("gi_pancreatitis", "diagnostic_basis").length < 2,
    pancreatitis_aetiology_workup_missing: l("gi_pancreatitis", "diagnostic_basis").length > 0 && l("gi_pancreatitis", "aetiology_workup").length === 0,
    severe_pancreatitis: /Severe/i.test(f("gi_pancreatitis", "severity")),
    fluids_missing: /not documented/i.test(f("gi_pancreatitis", "fluids")),

    // Endoscopy / colonoscopy / ERCP
    consent_missing: /Not documented/i.test(f("gi_endoscopy", "consent")),
    timeout_missing: /Not documented/i.test(f("gi_endoscopy", "timeout")),
    sedation_monitoring_missing: /Not documented/i.test(f("gi_endoscopy", "monitoring")),
    cecal_missing: isBlank(f("gi_polypectomy", "cecal_intubation")) || /^No/i.test(f("gi_polypectomy", "cecal_intubation")),
    prep_inadequate: /Inadequate/i.test(f("gi_polypectomy", "prep_quality")),
    withdrawal_missing: isBlank(f("gi_polypectomy", "withdrawal_adequacy")),
    polyps_without_surveillance: (Number(f("gi_polypectomy", "polyp_count")) > 0) && isBlank(f("gi_polypectomy", "surveillance")),
    perforation_unassessed: /Not documented/i.test(f("gi_polypectomy", "perforation_check")) || /Not documented/i.test(f("gi_ercp", "perforation_check")),
    peps_prophylaxis_missing: l("gi_ercp", "peps_prophylaxis").length === 0,
    stent_unspecified: !/^None/i.test(f("gi_ercp", "stent")) && isBlank(f("gi_ercp", "stent_specification")),

    // Nutrition
    weight_loss_nutrition: /Unintentional loss/i.test(f("gi_nutrition", "weight_trend")),
    micronutrient_untested: /Not assessed/i.test(f("gi_nutrition", "micronutrients")),

    // Discharge
    prophylaxis_unspecified: l("gi_discharge", "surveillance").length === 0,
    warning_signs_missing: isBlank(f("gi_discharge", "warning_signs")),
    follow_up_missing: isBlank(f("gi_discharge", "follow_up_when")),

    // ---- Procedure records ------------------------------------------------
    uc: /ulcerative colitis/i.test(f("gi_ibd", "disease")),
    crohn: /crohn/i.test(f("gi_ibd", "disease")),
    overt_bleeding: /Haematemesis|Melaena|Haematochezia|Coffee-ground/i.test(f("gi_alarm", "bleeding")),
    unstable_bleeding: /Hypotensive|Shocked/i.test(f("gi_bleeding", "haemodynamics")),
    bleeding_no_level_of_care: /Hypotensive|Shocked/i.test(f("gi_bleeding", "haemodynamics")) && (isBlank(f("gi_bleeding", "disposition")) || /Not documented/i.test(f("gi_bleeding", "disposition"))),
    pancreatitis_context: l("gi_pancreatitis", "diagnostic_basis").length > 0 || l("gi_acute", "acute_problem").includes("Acute pancreatitis") || !isBlank(f("gi_pancreatitis", "severity")),
    pancreatitis_unclassified: l("gi_pancreatitis", "diagnostic_basis").length > 0 && /Not classified|^$/i.test(f("gi_pancreatitis", "severity")),
    prep_safety_documented: hasBlock("gi_proc_safety"),
    prep_anticoag_missing:
      l("gi_proc_safety", "prep_medications").some((x) => /Antiplatelet|Anticoagulant/i.test(x)) && isBlank(f("gi_proc_safety", "prep_anticoag_plan")),
    pathology_pending: /pending/i.test(f("gi_endoscopy", "pathology")),
    procedure_followup_missing: hasBlock("gi_proc_safety") && isBlank(f("gi_endoscopy", "procedure_follow_up")),

    // Liver biopsy
    biopsy_documented: hasBlock("gi_liver_biopsy"),
    biopsy_coag_missing: hasBlock("gi_liver_biopsy") && (l("gi_liver_biopsy", "lb_coag_record").length === 0 || l("gi_liver_biopsy", "lb_coag_record").includes("None documented")),
    biopsy_observation_missing: hasBlock("gi_liver_biopsy") && !/Observed/i.test(f("gi_liver_biopsy", "lb_observation")),
    biopsy_bleeding: l("gi_liver_biopsy", "lb_complications").some((x) => /Bleeding/i.test(x)),

    // Paracentesis
    paracentesis_documented: hasBlock("gi_paracentesis_proc"),
    paracentesis_tests_missing: hasBlock("gi_paracentesis_proc") && (l("gi_paracentesis_proc", "pa_tests").length === 0 || l("gi_paracentesis_proc", "pa_tests").includes("Not documented")),
    large_volume_paracentesis: Number(f("gi_paracentesis_proc", "pa_volume")) >= 5,
    lvp_without_albumin: Number(f("gi_paracentesis_proc", "pa_volume")) >= 5 && !/Given/i.test(f("gi_paracentesis_proc", "pa_albumin")),

    // EUS
    eus_fna: /Fine-needle/i.test(f("gi_eus", "eus_tissue")),
    eus_specimen_record_missing: /Fine-needle/i.test(f("gi_eus", "eus_tissue")) && (isBlank(f("gi_eus", "eus_passes")) || isBlank(f("gi_eus", "eus_onsite"))),

    // Capsule
    capsule_documented: hasBlock("gi_capsule"),
    capsule_retention_unassessed: hasBlock("gi_capsule") && /Not documented|^$/i.test(f("gi_capsule", "cap_retention_risk")),
    capsule_status_missing: hasBlock("gi_capsule") && /Not documented|^$/i.test(f("gi_capsule", "cap_excretion")),

    // ---- Time-critical abdominal presentations ---------------------------
    acute_problem: l("gi_acute", "acute_problem").filter((x) => x !== "None documented"),
    peritonism: /^Present/i.test(f("gi_acute", "acute_peritonism")),
    perforation_documented: l("gi_acute", "acute_problem").includes("Perforation"),
    obstruction_documented: l("gi_acute", "acute_problem").includes("Obstruction"),
    dehydration_documented: l("gi_acute", "acute_problem").includes("Severe dehydration"),
    sepsis_documented: l("gi_acute", "acute_problem").includes("Sepsis"),
    cholangitis_acute: l("gi_acute", "acute_problem").includes("Acute cholangitis"),
    ischaemic_bowel: l("gi_acute", "acute_problem").includes("Ischaemic bowel"),
    acute_no_surgical_opinion: isBlank(f("gi_acute", "acute_surgical")) && !/Not indicated/i.test(f("gi_acute", "acute_surgical")),
    acute_no_resuscitation: isBlank(f("gi_acute", "acute_resuscitation")),
    acute_no_cultures: isBlank(f("gi_acute", "acute_cultures")),
    acute_no_decompression: isBlank(f("gi_acute", "acute_decompression")) || /Indicated — not placed/i.test(f("gi_acute", "acute_decompression")),
    acute_no_imaging: isBlank(f("gi_acute", "acute_imaging")),
    altered_consciousness:
      f("gi_acute", "acute_consciousness") === "Not assessed" &&
      (l("gi_acute", "acute_problem").some((x) => /Acute liver failure|Altered consciousness|Sepsis|Variceal/i.test(x))),
    acute_no_level_of_care: isBlank(f("gi_acute", "acute_level_of_care")),

    // ---- GI-critical drug therapy ----------------------------------------
    drug_agents: l("gi_drug_safety", "drug_agents").filter((x) => x !== "None of these"),
    drug_contraindication_missing: l("gi_drug_safety", "drug_agents").some((x) => x !== "None of these") && (isBlank(f("gi_drug_safety", "drug_contraindications")) || /Not documented/i.test(f("gi_drug_safety", "drug_contraindications"))),
    drug_monitoring_missing: l("gi_drug_safety", "drug_agents").some((x) => x !== "None of these") && /Monitoring not documented|^$/i.test(f("gi_drug_safety", "drug_monitoring")),
    drug_allergy_missing: l("gi_drug_safety", "drug_agents").some((x) => x !== "None of these") && (isBlank(f("gi_drug_safety", "drug_allergy_check")) || /Not documented/i.test(f("gi_drug_safety", "drug_allergy_check"))),

    // ---- Disease-specific blocks ----------------------------------------
    // Upper GI: an eradicated-or-positive H. pylori result without a
    // confirmation test leaves the treatment unverified (ACG H. pylori guidance).
    hp_positive: f("gi_upper_gi", "upper_hp_status") === "Positive",
    hp_treated_without_confirmation: f("gi_upper_gi", "upper_hp_status") === "Positive" && !/arranged/i.test(f("gi_upper_gi", "upper_hp_confirmation")),
    barrett_without_surveillance:
      f("gi_upper_gi", "upper_problem") !== "" &&
      l("gi_upper_gi", "upper_problem").includes("Barrett oesophagus") &&
      isBlank(f("gi_upper_gi", "upper_barrett_surveillance")),

    // Functional: an organic cause neither tested for nor documented.
    functional_documented: l("gi_functional", "func_problem").some((x) => /irritable bowel|functional|chronic diarrhoea/i.test(x)),
    functional_organic_exclusion_missing: l("gi_functional", "func_problem").some((x) => /irritable bowel|functional|chronic diarrhoea/i.test(x)) && l("gi_functional", "func_organic_exclusion").length === 0,

    // Colorectal
    diverticulitis_followup_missing:
      l("gi_colorectal", "crc_problem").includes("Acute diverticulitis") && isBlank(f("gi_colorectal", "crc_diverticulitis_followup")),
    polyp_surveillance_missing:
      l("gi_colorectal", "crc_problem").some((x) => /polyp|serrated/i.test(x)) && isBlank(f("gi_colorectal", "crc_interval")),

    // Pancreas
    epi_without_enzyme_replacement:
      l("gi_pancreatic", "pan_problem").includes("Exocrine pancreatic insufficiency") && isBlank(f("gi_pancreatic", "pan_pert")),

    // Biliary
    cholangitis_documented: l("gi_biliary", "bil_problem").includes("Acute cholangitis"),
    cholangitis_drainage_missing: l("gi_biliary", "bil_problem").includes("Acute cholangitis") && isBlank(f("gi_biliary", "bil_drainage")),
    psc_without_cancer_surveillance:
      l("gi_biliary", "bil_problem").includes("Primary sclerosing cholangitis") && isBlank(f("gi_biliary", "bil_cca_surveillance")),

    // GI infection
    infection_documented: l("gi_infection", "inf_problem").length > 0,
    infection_without_stool_testing: l("gi_infection", "inf_problem").length > 0 && l("gi_infection", "inf_stool_tests").length === 0,
    cdiff_documented: l("gi_infection", "inf_problem").includes("Clostridioides difficile infection"),
    cdiff_treatment_missing: l("gi_infection", "inf_problem").includes("Clostridioides difficile infection") && isBlank(f("gi_infection", "inf_cdiff_agent")),
    cdiff_severity_missing: l("gi_infection", "inf_problem").includes("Clostridioides difficile infection") && isBlank(f("gi_infection", "inf_severity")),

    // Viral hepatitis
    viral_hepatitis_documented: l("gi_viral_hepatitis", "vir_problem").length > 0,
    hbv_or_hcv: l("gi_viral_hepatitis", "vir_problem").some((x) => /Hepatitis B|Hepatitis C|Hepatitis D/.test(x)),
    viral_hepatitis_without_vaccination: l("gi_viral_hepatitis", "vir_problem").length > 0 && l("gi_viral_hepatitis", "vir_vaccination").length === 0,
    hbv_without_treatment_decision: l("gi_viral_hepatitis", "vir_problem").some((x) => /Hepatitis B|Hepatitis D/.test(x)) && isBlank(f("gi_viral_hepatitis", "vir_hbv_treatment")),

    // MASLD
    masld_documented: /MASLD|MASH|Steatosis/i.test(f("gi_masld", "mas_status")),
    masld_without_fibrosis_risk: /MASLD|MASH|Steatosis/i.test(f("gi_masld", "mas_status")) && isBlank(f("gi_masld", "mas_risk_stratification")),
    masld_without_alcohol_quantification: /MASLD|MASH|Steatosis/i.test(f("gi_masld", "mas_status")) && isBlank(f("gi_masld", "mas_alcohol")),

    // Autoimmune / DILI / metabolic
    dili_documented: l("gi_immune_metabolic", "aim_problem").includes("Drug-induced liver injury"),
    dili_causality_missing: l("gi_immune_metabolic", "aim_problem").includes("Drug-induced liver injury") && isBlank(f("gi_immune_metabolic", "aim_dili_rucam")),
    acute_liver_failure_documented: l("gi_immune_metabolic", "aim_problem").includes("Acute liver failure"),
    alf_without_transplant_discussion: l("gi_immune_metabolic", "aim_problem").includes("Acute liver failure") && isBlank(f("gi_immune_metabolic", "aim_ali_transplant")),
    aih_without_induction_decision: l("gi_immune_metabolic", "aim_problem").includes("Autoimmune hepatitis") && isBlank(f("gi_immune_metabolic", "aim_induction")),

    // Cirrhosis, portal hypertension and transplant
    cirrhosis_block_documented: /cirrhosis/i.test(f("gi_cirrhosis", "cir_status")),
    decompensated: /Decompensated/i.test(f("gi_cirrhosis", "cir_status")),
    decompensation_event_missing: /Decompensated/i.test(f("gi_cirrhosis", "cir_status")) && l("gi_cirrhosis", "cir_event").length === 0,
    cir_variceal_screen_missing: /cirrhosis/i.test(f("gi_cirrhosis", "cir_status")) && isBlank(f("gi_cirrhosis", "cir_variceal_screen")),
    cir_hcc_surveillance_missing: /cirrhosis/i.test(f("gi_cirrhosis", "cir_status")) && isBlank(f("gi_cirrhosis", "cir_hcc_surveillance")),
    cir_vaccination_missing: /cirrhosis/i.test(f("gi_cirrhosis", "cir_status")) && l("gi_cirrhosis", "cir_vaccination").length === 0,
    transplant_without_criteria: /Referred|Under assessment/i.test(f("gi_cirrhosis", "cir_transplant")) && isBlank(f("gi_cirrhosis", "cir_transplant_criteria")),
  };
};

export const GASTRO_BLOCK_COUNT = GASTRO_BLOCK_KEYS.length;