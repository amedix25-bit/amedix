// General Surgery — CONDITION-SPECIFIC documentation templates.
//
// These sit alongside the core surgical note types (Consultation, Pre-Operative
// Assessment, Operative Note, Post-Operative Note, Daily Progress, Discharge,
// Follow-Up, Pathology, Referral, Consent, Implant) and exist so a surgeon can
// document a specific presentation with only the fields that presentation
// needs — no irrelevant sections are forced into any note.
//
// Safety principles applied throughout:
//  - Every value is entered by the clinician. Nothing here is pre-filled, and no
//    normal finding is ever recorded automatically.
//  - Select options include "Not assessed", "Not performed" and "Unknown" where
//    the information may genuinely be unavailable, so an unanswered question is
//    never stored as a negative finding.
//  - Severity scores are recorded as clinician-entered values with the option
//    "Not calculated" — the platform never computes or infers a score.
//  - A field marked `required` must be answered before the record is saved; each
//    required field offers an honest "not assessed" style option, so emergency
//    documentation is never blocked, only made explicit.
//  - "Clinician decision" fields record what the treating clinician decided.
//    They are documentation, not orders: completing a record never certifies
//    fitness for surgery and never authorises a procedure.
//
// Scores and classifications referenced: Alvarado score (appendicitis), Tokyo
// Guidelines 2018 severity grading (acute cholecystitis / cholangitis), European
// Hernia Society classification, qSOFA / SIRS sepsis screening, ATLS primary
// survey and damage-control principles, Bethesda thyroid cytology categories,
// and triple assessment for breast disease.

const I = (key, label) => ({ key, label, type: "input" });
const N = (key, label) => ({ key, label, type: "number" });
const T = (key, label) => ({ key, label, type: "textarea" });
const S = (key, label, options, required = false) => ({ key, label, type: "select", options, required });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));
const req = (f) => ({ ...f, required: true });

const NOTICE =
  "Clinician-recorded documentation. Values are never pre-filled or inferred, absent information is not treated as a negative finding, and severity scores are entered by the clinician. Completing this form does not certify fitness for surgery or authorise any procedure.";

const YES_NO_UNK = ["Yes", "No", "Unknown"];
const ASA = ["ASA I", "ASA II", "ASA III", "ASA IV", "ASA V", "ASA VI", "Not assessed"];
const URGENCY = ["Elective", "Urgent", "Emergency"];
const DECISION = [
  "Proceed to theatre",
  "Conservative management with review",
  "Further investigation",
  "Refer to specialist centre",
  "Discussed with senior — plan pending",
  "Not yet decided",
];

export const SURGERY_CONDITION_DOCS = [
  {
    key: "surg_acute_abdomen",
    label: "Acute Abdomen / Emergency General Surgery",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Presentation", [
        I("symptom_onset", "Onset & Duration"),
        T("pain_character", "Pain — Site, Character, Radiation & Progression"),
        T("associated_symptoms", "Associated Symptoms — Vomiting, Distension, Absolute Constipation, Fever"),
        T("prior_surgery", "Previous Abdominal Surgery / Known Adhesions"),
        T("comorbidities_medications", "Comorbidities & Medications (including anticoagulants)"),
        T("allergies", "Allergies"),
        S("pregnancy_status", "Pregnancy Status", ["Not applicable", "Negative", "Positive", "Not tested", "Unknown"]),
      ]),
      ...sec("Examination & Severity", [
        T("vitals", "Vital Signs"),
        S("haemodynamic_status", "Haemodynamic Status", ["Stable", "Tachycardic", "Hypotensive", "Peritonitic", "Not assessed"], true),
        T("abdominal_exam", "Abdominal Examination — Guarding, Rigidity, Rebound, Mass, Hernial Orifices, Bowel Sounds"),
        S("digital_rectal", "Digital Rectal Examination", ["Performed — normal", "Performed — abnormal", "Not performed", "Declined"]),
        S("sepsis_screen", "Sepsis Screening (qSOFA 0–3, clinician-scored)", ["0", "1", "2", "3", "Not calculated"]),
        S("peritonitis_extent", "Peritonitis Extent", ["Localised", "Generalised", "None detected", "Not assessed"]),
      ]),
      ...sec("Investigations", [
        T("labs", "Laboratory Results — WCC, CRP, Lactate, Amylase/Lipase, LFT, Renal, Group & Save"),
        S("imaging_performed", "Imaging Performed", ["CT abdomen & pelvis", "Erect chest X-ray", "Abdominal X-ray", "Ultrasound", "None yet", "Not assessed"]),
        T("imaging_findings", "Imaging Findings"),
        S("free_air", "Free Intraperitoneal Air", ["Present", "Absent", "Equivocal", "Not assessed"]),
      ]),
      ...sec("Assessment & Decision", [
        T("working_diagnosis", "Working Diagnosis"),
        S("perforation_assessment", "Visceral Perforation", ["Confirmed", "Suspected", "Not suspected", "Not assessed"]),
        T("differential_diagnosis", "Differential Diagnosis"),
        S("clinician_decision", "Clinician Decision (recorded, not an order)", DECISION, true),
        T("resuscitation", "Resuscitation Given — Fluids, Analgesia, Anti-emetic, Catheter, Nasogastric Tube"),
        T("antimicrobials", "Antimicrobials — Agent & Time Given"),
        T("escalation_criteria", "Escalation Criteria — When to Call for Senior or Theatre Review"),
        T("plan", "Plan"),
      ]),
    ],
  },
  {
    key: "surg_appendicitis",
    label: "Appendicitis Assessment",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Presentation", [
        T("symptom_duration", "Symptom Duration"),
        S("migratory_pain", "Migratory Pain to Right Iliac Fossa", YES_NO_UNK),
        S("anorexia", "Anorexia", YES_NO_UNK),
        S("nausea_vomiting", "Nausea / Vomiting", ["None", "Nausea", "Vomiting", "Unknown"]),
        T("prior_episodes", "Previous Episodes / Prior Appendicitis"),
        S("pregnancy_status", "Pregnancy Status", ["Not applicable", "Negative", "Positive", "Not tested", "Unknown"]),
        T("comorbidities_medications", "Comorbidities & Medications"),
      ]),
      ...sec("Examination & Scoring", [
        T("vitals", "Vital Signs"),
        S("rif_tenderness", "Right Iliac Fossa Tenderness", ["Present", "Absent", "Not assessed"]),
        S("rebound_guarding", "Rebound Tenderness / Guarding", ["Present", "Absent", "Not assessed"]),
        S("special_tests", "Rovsing / Psoas / Obturator Signs", ["Positive", "Negative", "Not performed", "Not assessed"]),
        S("alvarado_score", "Alvarado Score (clinician-entered)", ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Not calculated"]),
        T("examination_other", "Other Examination Findings"),
      ]),
      ...sec("Investigations", [
        T("labs", "Laboratory Results — WCC, CRP, Urinalysis, Beta-hCG where applicable"),
        S("imaging_performed", "Imaging Performed", ["Ultrasound", "CT", "MRI", "None yet", "Not assessed"]),
        T("imaging_findings", "Imaging Findings — Appendix Calibre, Faecolith, Free Fluid"),
      ]),
      ...sec("Assessment & Decision", [
        S("diagnostic_confidence", "Diagnostic Confidence", ["Confirmed on imaging", "Clinically suspected", "Equivocal", "Alternative diagnosis more likely", "Not assessed"], true),
        T("differential_diagnosis", "Differential Diagnosis Considered"),
        S("severity", "Severity", ["Uncomplicated", "Complicated — perforation or abscess", "Not assessed"]),
        S("management_decision", "Clinician Decision (recorded, not an order)", [
          "Laparoscopic appendicectomy",
          "Open appendicectomy",
          "Antibiotic-first with review",
          "Further investigation",
          "Refer",
          "Discussed with senior — plan pending",
          "Not yet decided",
        ], true),
        T("antibiotics", "Antibiotics — Agent & Time"),
        T("escalation_criteria", "Escalation Criteria"),
        T("plan", "Plan & Follow-Up"),
      ]),
    ],
  },
  {
    key: "surg_bowel_obstruction",
    label: "Bowel Obstruction Assessment",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Presentation", [
        T("symptom_onset", "Onset & Duration"),
        T("obstructive_symptoms", "Pain, Vomiting, Distension, Absolute Constipation"),
        T("prior_surgery_adhesions", "Previous Surgery / Known Adhesions"),
        S("known_hernia", "Known Hernia", YES_NO_UNK),
        S("malignancy_history", "Previous Malignancy", YES_NO_UNK),
        S("stoma", "Stoma Present", YES_NO_UNK),
        T("comorbidities_medications", "Comorbidities & Medications"),
      ]),
      ...sec("Examination", [
        T("vitals", "Vital Signs"),
        S("hydration", "Hydration Status", ["Well hydrated", "Mildly dehydrated", "Severely dehydrated", "Not assessed"]),
        T("abdominal_exam", "Abdominal Examination — Distension, Tympany, Tenderness, Hernial Orifices"),
        S("bowel_sounds", "Bowel Sounds", ["Normal", "Increased / tinkling", "Absent", "Not assessed"]),
        S("digital_rectal", "Digital Rectal Examination", ["Performed — normal", "Performed — abnormal", "Not performed", "Declined"]),
      ]),
      ...sec("Severity & Investigations", [
        S("strangulation", "Signs of Strangulation / Ischaemia", ["None", "Suspected", "Present", "Not assessed"]),
        S("closed_loop", "Closed-Loop Obstruction on Imaging", ["Present", "Absent", "Not assessed"]),
        T("labs", "Laboratory Results — WCC, Lactate, Electrolytes, Renal, Group & Save"),
        S("imaging_performed", "Imaging Performed", ["Abdominal X-ray", "CT abdomen & pelvis", "Water-soluble contrast study", "None yet", "Not assessed"]),
        T("imaging_findings", "Imaging Findings — Transition Point, Calibre, Free Fluid, Pneumatosis"),
      ]),
      ...sec("Management & Decision", [
        T("resuscitation", "Resuscitation — Fluids, Nasogastric Tube, Catheter, Electrolyte Correction"),
        S("water_soluble_contrast", "Water-Soluble Contrast Challenge", ["Given", "Considered", "Contraindicated", "Not indicated", "Not assessed"]),
        T("operative_indication", "Indication for Surgery, if Present"),
        S("clinician_decision", "Clinician Decision (recorded, not an order)", [
          "Conservative management with serial review",
          "Proceed to theatre",
          "Further imaging",
          "Refer to specialist centre",
          "Discussed with senior — plan pending",
          "Not yet decided",
        ], true),
        T("escalation_criteria", "Escalation Criteria — Peritonism, Rising Lactate, Strangulation"),
        T("plan", "Plan"),
      ]),
    ],
  },
  {
    key: "surg_hernia",
    label: "Hernia & Abdominal Wall Assessment",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Presentation", [
        I("site_duration", "Site & Duration"),
        S("reducibility", "Reducibility", ["Reducible", "Irreducible", "Incarcerated", "Strangulated", "Not assessed"], true),
        T("symptoms", "Symptoms — Pain, Discomfort, Obstructive Symptoms"),
        S("obstructive_symptoms", "Obstructive Symptoms Present", YES_NO_UNK),
        T("previous_repair", "Previous Repair / Mesh in Situ"),
        T("comorbidities", "Comorbidities & Risk Factors — Smoking, Steroids, Diabetes, Obesity, Chronic Cough"),
      ]),
      ...sec("Examination & Classification", [
        T("exam_standing", "Examination — Standing and Supine, Cough Impulse, Defect Size"),
        S("ehs_region", "EHS Region", ["Medial (direct)", "Lateral (indirect)", "Femoral", "Incisional", "Not classified"]),
        S("ehs_primary", "Primary or Incisional", ["Primary", "Incisional", "Not classified"]),
        S("defect_size", "Defect Size (clinic estimate)", ["≤1 finger", "2 fingers", "≥3 fingers", "Not measured"]),
        S("hernia_content", "Hernia Content", ["Omentum", "Bowel", "Mixed", "Not assessed", "Not applicable"]),
        S("complication", "Complication Present", ["None", "Obstruction", "Strangulation", "Incarceration", "Not assessed"]),
        S("asa_class", "Fitness for Repair (ASA Class)", ASA),
      ]),
      ...sec("Decision & Plan", [
        S("repair_approach", "Planned / Recorded Approach", ["Open", "Laparoscopic", "Robotic", "Watchful waiting", "Refer", "Not decided"]),
        S("mesh_plan", "Mesh Plan", ["Synthetic mesh", "Biological mesh", "Suture repair", "Not decided", "Not applicable"]),
        S("consent_documented", "Consent Documented", ["Yes", "No", "Pending", "Not applicable"]),
        T("optimisation", "Pre-Operative Optimisation — Weight, Smoking, Glycaemic Control"),
        T("escalation_criteria", "Escalation Criteria — Irreducibility, Pain, Obstruction"),
        T("plan_followup", "Plan & Follow-Up"),
      ]),
    ],
  },
  {
    key: "surg_biliary",
    label: "Gallbladder & Biliary Assessment",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Presentation", [
        I("symptom_duration", "Duration of Symptoms"),
        T("pain_pattern", "Pain — Site, Radiation, Relation to Meals"),
        S("murphy_sign", "Murphy Sign", ["Positive", "Negative", "Not assessed"]),
        S("fever_rigors", "Fever / Rigors", ["Fever", "Fever and rigors", "Neither", "Not assessed"]),
        S("jaundice", "Jaundice", ["Present", "Absent", "Not assessed"]),
        T("comorbidities_medications", "Comorbidities & Medications (including anticoagulants)"),
      ]),
      ...sec("Examination & Investigations", [
        T("vitals", "Vital Signs"),
        S("courvoisier", "Palpable Gallbladder / Courvoisier Sign", ["Absent", "Present", "Not assessed"]),
        T("labs", "Laboratory Results — WCC, CRP, Bilirubin, ALP, ALT, Amylase/Lipase"),
        S("imaging_performed", "Imaging Performed", ["Abdominal ultrasound", "CT", "MRCP", "HIDA scan", "None yet", "Not assessed"]),
        T("imaging_findings", "Imaging Findings — Stones, Wall Thickness, Pericholecystic Fluid, CBD Diameter"),
        S("cbd_stone", "Common Bile Duct Stone / Dilatation", ["Present", "Absent", "Equivocal", "Not assessed"]),
      ]),
      ...sec("Assessment", [
        S("working_diagnosis", "Working Diagnosis", [
          "Biliary colic",
          "Acute cholecystitis",
          "Acute cholangitis",
          "Gallstone pancreatitis",
          "Mirizzi syndrome",
          "Other biliary pathology",
          "Not established",
        ]),
        S("tokyo_severity", "Tokyo Guidelines Severity Grade", ["Grade I — mild", "Grade II — moderate", "Grade III — severe", "Not applicable", "Not assessed"]),
        S("sepsis_screen", "Sepsis Screening (qSOFA 0–3)", ["0", "1", "2", "3", "Not calculated"]),
        T("differential_diagnosis", "Differential Diagnosis"),
      ]),
      ...sec("Decision & Plan", [
        T("antimicrobials", "Antimicrobials — Agent & Time"),
        S("ercp_indication", "ERCP Indication", ["Indicated", "Not indicated", "Performed", "Refer for ERCP", "Not assessed"]),
        S("cholecystectomy_timing", "Cholecystectomy Timing", ["Index admission", "Interval", "Deferred", "Not decided", "Not applicable"]),
        S("asa_class", "Fitness for Surgery (ASA Class)", ASA),
        S("clinician_decision", "Clinician Decision (recorded, not an order)", DECISION, true),
        T("escalation_criteria", "Escalation Criteria — Sepsis, Rising Bilirubin, Pancreatitis"),
        T("plan", "Plan"),
      ]),
    ],
  },
  {
    key: "surg_hpb",
    label: "Hepatobiliary & Pancreatic Assessment",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Presentation", [
        T("presenting_features", "Presenting Features — Jaundice, Pain, Weight Loss, Pruritus, Steatorrhoea, GI Bleeding"),
        I("symptom_duration", "Duration"),
        T("risk_history", "Risk History — Alcohol, Hepatitis, Gallstones, Diabetes, Smoking"),
        T("comorbidities_medications", "Comorbidities & Medications"),
      ]),
      ...sec("Examination & Investigations", [
        T("vitals", "Vital Signs"),
        S("jaundice", "Jaundice", ["Present", "Absent", "Not assessed"]),
        S("courvoisier", "Palpable, Non-Tender Gallbladder (Courvoisier Sign)", ["Absent", "Present", "Not assessed"]),
        T("exam_other", "Other Findings — Hepatomegaly, Ascites, Cachexia, Nodules"),
        S("lft_pattern", "Liver Function Pattern", ["Obstructive", "Hepatocellular", "Mixed", "Normal", "Not assessed"]),
        T("tumour_markers", "Tumour Markers — CA 19-9, CEA, AFP (if requested)"),
        S("imaging_performed", "Imaging Performed", ["Ultrasound", "CT", "MRI / MRCP", "EUS", "ERCP", "None yet", "Not assessed"]),
        T("imaging_findings", "Imaging Findings — Mass, Duct Dilatation, Vascular Involvement, Metastases"),
      ]),
      ...sec("Assessment", [
        T("working_diagnosis", "Working Diagnosis"),
        T("differential_diagnosis", "Differential Diagnosis"),
        S("resectability", "Resectability Assessment (imaging-based, clinician-judged)", [
          "Potentially resectable",
          "Borderline resectable",
          "Locally advanced",
          "Metastatic",
          "Not assessed",
        ]),
        S("mdt", "Discussed at MDT / Hepatobiliary MDT", ["Not applicable", "Pending", "Discussed"]),
        S("nutrition_risk", "Nutritional Risk", ["Low", "Moderate", "High", "Not assessed"]),
      ]),
      ...sec("Decision & Plan", [
        S("biliary_drainage", "Biliary Drainage", ["Not required", "Indicated — ERCP", "Indicated — percutaneous", "Performed", "Not assessed"]),
        S("clinician_decision", "Clinician Decision (recorded, not an order)", [
          "Proceed to surgery",
          "Neoadjuvant therapy referral",
          "Palliative pathway referral",
          "Further investigation",
          "Refer to specialist centre",
          "Discussed at MDT — plan pending",
          "Not yet decided",
        ], true),
        T("optimisation", "Optimisation — Nutrition, Jaundice, Diabetes, Anaemia"),
        T("escalation_criteria", "Escalation Criteria — Cholangitis, Bleeding, Obstruction"),
        T("plan_followup", "Plan & Follow-Up"),
      ]),
    ],
  },
  {
    key: "surg_colorectal",
    label: "Colorectal & Anorectal Assessment",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Presentation", [
        T("presenting_features", "Presenting Features — Rectal Bleeding, Change in Bowel Habit, Tenesmus, Pain, Lump, Discharge"),
        I("symptom_duration", "Duration"),
        T("family_history", "Family History — Colorectal Cancer, Polyps, IBD"),
        S("anaemia_symptoms", "Symptoms of Anaemia", YES_NO_UNK),
        T("previous_colorectal", "Previous Colorectal Surgery / Colonoscopy / Polyps"),
        T("comorbidities_medications", "Comorbidities & Medications (including anticoagulants)"),
      ]),
      ...sec("Examination", [
        T("abdominal_exam", "Abdominal Examination"),
        S("digital_rectal", "Digital Rectal Examination", ["Performed — normal", "Performed — abnormal", "Not performed", "Declined"]),
        S("perianal_findings", "Perianal Findings", [
          "None",
          "Skin tags",
          "External haemorrhoids",
          "Anal fissure",
          "Fistula",
          "Abscess",
          "Rectal prolapse",
          "Not assessed",
        ]),
        S("haemorrhoid_grade", "Haemorrhoid Grade (if applicable)", ["Grade I", "Grade II", "Grade III", "Grade IV", "Not applicable", "Not assessed"]),
        T("proctoscopy", "Anoscopy / Rigid Proctoscopy Findings"),
      ]),
      ...sec("Investigations", [
        T("labs", "Laboratory Results — Haemoglobin, Ferritin, CEA if requested"),
        S("endoscopy", "Endoscopy Performed", ["Colonoscopy", "Flexible sigmoidoscopy", "Rigid sigmoidoscopy", "None yet", "Not assessed"]),
        T("endoscopy_findings", "Endoscopy / Biopsy Findings"),
        S("imaging_performed", "Imaging Performed", ["CT abdomen & pelvis", "MRI rectum", "Defaecating proctogram", "None yet", "Not assessed"]),
      ]),
      ...sec("Assessment & Decision", [
        S("working_diagnosis", "Working Diagnosis", [
          "Haemorrhoids",
          "Anal fissure",
          "Perianal abscess",
          "Fistula-in-ano",
          "Rectal prolapse",
          "Diverticular disease",
          "Inflammatory bowel disease",
          "Suspected colorectal malignancy",
          "Functional bowel disorder",
          "Not established",
        ]),
        T("differential_diagnosis", "Differential Diagnosis"),
        S("cancer_pathway", "Suspected Cancer Pathway", ["Referred", "Not indicated", "Discussed with patient", "Not assessed"]),
        S("clinician_decision", "Clinician Decision (recorded, not an order)", [
          "Conservative management",
          "Office procedure",
          "Surgical management",
          "Endoscopic management",
          "Further investigation",
          "Refer",
          "Not yet decided",
        ], true),
        T("plan_followup", "Plan & Follow-Up"),
        T("escalation_criteria", "Escalation Criteria — Obstruction, Bleeding, Sepsis, Peritonism"),
      ]),
    ],
  },
  {
    key: "surg_breast",
    label: "Breast Assessment",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Presentation", [
        S("presenting_complaint", "Presenting Complaint", ["Lump", "Pain", "Nipple discharge", "Skin change", "Screening abnormality", "Other"]),
        I("symptom_duration", "Duration"),
        S("nipple_discharge", "Nipple Discharge", ["None", "Serous", "Bloody", "Not assessed"]),
        S("skin_changes", "Skin / Nipple Changes", ["None", "Peau d'orange", "Dimpling", "Ulceration", "Nipple inversion", "Not assessed"]),
        T("risk_history", "Risk History — Family History, HRT, Parity, Breastfeeding, Previous Breast Surgery"),
        T("comorbidities_medications", "Comorbidities & Medications"),
      ]),
      ...sec("Examination", [
        S("laterality", "Side", ["Right", "Left", "Bilateral", "Not recorded"]),
        I("lump_site", "Lump Site / Quadrant and Size"),
        T("lump_character", "Lump — Consistency, Mobility, Tethering"),
        S("axillary_nodes", "Axillary Nodes", ["Clinically normal", "Palpable — mobile", "Palpable — fixed", "Not assessed"]),
        T("contralateral", "Contralateral Breast and Other Findings"),
      ]),
      ...sec("Triple Assessment", [
        S("clinical_assessment", "Clinical Assessment", ["Benign", "Suspicious", "Malignant", "Inconclusive", "Not assessed"], true),
        S("imaging", "Imaging", ["Ultrasound", "Mammography", "Both", "Not yet performed", "Not assessed"]),
        T("imaging_findings", "Imaging Findings (BIRADS if reported)"),
        S("pathology", "Pathology (FNA / Core Biopsy)", ["Not performed", "Benign", "Atypical / high-risk", "Malignant", "Pending"]),
      ]),
      ...sec("Assessment & Decision", [
        T("working_diagnosis", "Working Diagnosis"),
        T("differential_diagnosis", "Differential Diagnosis"),
        S("mdt", "Discussed at Breast MDT", ["Not applicable", "Pending", "Discussed"]),
        S("surgical_plan", "Clinician Decision — Surgical Plan (recorded, not an order)", [
          "Excision biopsy",
          "Wide local excision",
          "Mastectomy",
          "Axillary procedure",
          "Not decided",
          "Refer to oncology first",
        ], true),
        T("plan_followup", "Plan & Follow-Up"),
        T("escalation_criteria", "Escalation Criteria"),
      ]),
    ],
  },
  {
    key: "surg_thyroid",
    label: "Thyroid & Parathyroid Assessment",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Presentation", [
        T("presenting_features", "Presenting Features — Neck Swelling, Compressive Symptoms, Pain"),
        S("compressive_symptoms", "Compressive Symptoms", ["None", "Dysphagia", "Dyspnoea", "Hoarseness", "Multiple", "Not assessed"]),
        S("thyrotoxic_symptoms", "Thyrotoxic Symptoms", ["None", "Present", "Unknown"]),
        T("risk_history", "Risk History — Neck Irradiation, Family History, Previous Thyroid Surgery"),
        T("comorbidities_medications", "Comorbidities & Medications (including anticoagulants)"),
      ]),
      ...sec("Examination", [
        S("goitre", "Goitre / Nodule", ["Diffuse goitre", "Solitary nodule", "Multinodular", "Not assessed"]),
        T("exam_detail", "Consistency, Mobility, Retrosternal Extension, Tracheal Deviation"),
        S("cervical_nodes", "Cervical Lymphadenopathy", ["Absent", "Present", "Not assessed"]),
        S("vocal_cord", "Vocal Cord Assessment", ["Normal", "Paresis / palsy", "Not performed", "Not assessed"]),
      ]),
      ...sec("Investigations", [
        S("thyroid_function", "Thyroid Function", ["Euthyroid", "Hyperthyroid", "Hypothyroid", "Not available"]),
        S("ultrasound", "Ultrasound", ["Performed — benign features", "Performed — suspicious features", "Not performed"]),
        S("cytology", "FNA Cytology (Bethesda)", ["I — non-diagnostic", "II — benign", "III — AUS/FLUS", "IV — follicular neoplasm", "V — suspicious", "VI — malignant", "Not performed", "Pending"]),
        T("calcium_parathyroid", "Calcium, PTH and Vitamin D"),
        T("other_investigations", "Other Investigations — Crossmatch, Chest Imaging, Flow Volume Loop"),
      ]),
      ...sec("Assessment & Decision", [
        T("working_diagnosis", "Working Diagnosis"),
        T("differential_diagnosis", "Differential Diagnosis"),
        S("airway_risk", "Airway / Compression Risk", ["Low", "Moderate", "High — needs airway plan", "Not assessed"]),
        S("planned_surgery", "Clinician Decision — Planned Surgery (recorded, not an order)", [
          "Hemithyroidectomy",
          "Total thyroidectomy",
          "Completion thyroidectomy",
          "Parathyroidectomy",
          "Not decided",
          "Refer",
        ], true),
        T("postop_risks", "Risks Discussed — Recurrent Laryngeal Nerve Injury, Hypocalcaemia, Haematoma, Scar"),
        T("plan_followup", "Plan & Follow-Up"),
      ]),
    ],
  },
  {
    key: "surg_upper_gi",
    label: "Upper Gastrointestinal Assessment",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Presentation", [
        T("presenting_features", "Presenting Features — Dyspepsia, Reflux, Dysphagia, Vomiting, Epigastric Pain"),
        I("symptom_duration", "Duration"),
        S("gi_bleeding", "GI Bleeding", ["None", "Haematemesis", "Melaena", "Both", "Not assessed"]),
        S("weight_loss", "Unintentional Weight Loss", YES_NO_UNK),
        T("risk_history", "Risk History — NSAIDs, Alcohol, Smoking, H. pylori, Previous Ulcer or Gastric Surgery"),
        T("comorbidities_medications", "Comorbidities & Medications"),
      ]),
      ...sec("Examination", [
        T("vitals", "Vital Signs"),
        T("abdominal_exam", "Abdominal Examination — Epigastric Tenderness, Mass, Succession Splash"),
        S("anaemia_signs", "Signs of Anaemia", ["None", "Present", "Not assessed"]),
      ]),
      ...sec("Investigations", [
        T("labs", "Laboratory Results — Haemoglobin, Ferritin, Urea, Electrolytes"),
        S("h_pylori", "Helicobacter pylori Testing", ["Negative", "Positive", "Not tested", "Unknown"]),
        S("endoscopy", "Endoscopy", ["Not performed", "Performed — see findings", "Refer for endoscopy", "Pending"]),
        T("endoscopy_findings", "Endoscopy / Biopsy Findings"),
        S("imaging_performed", "Imaging Performed", ["CT abdomen", "Barium study", "None yet", "Not assessed"]),
      ]),
      ...sec("Assessment & Decision", [
        S("alarm_features", "Alarm Features", ["None documented", "Present — weight loss, dysphagia, bleeding or anaemia", "Not assessed"], true),
        T("working_diagnosis", "Working Diagnosis"),
        T("differential_diagnosis", "Differential Diagnosis"),
        S("clinician_decision", "Clinician Decision (recorded, not an order)", [
          "Acid suppression trial",
          "H. pylori eradication",
          "Endoscopic therapy",
          "Surgical referral",
          "Further investigation",
          "Not yet decided",
        ], true),
        T("plan_followup", "Plan & Follow-Up"),
        T("escalation_criteria", "Escalation Criteria — Active Bleeding, Perforation, Obstruction"),
      ]),
    ],
  },
  {
    key: "surg_infection",
    label: "Surgical Infection, Abscess & Wound Complication",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Presentation", [
        I("site_duration", "Site & Duration"),
        T("symptoms", "Symptoms — Pain, Fever, Discharge, Swelling"),
        T("risk_factors", "Risk Factors — Diabetes, Immunosuppression, Obesity, Smoking, Prosthetic Material"),
        T("prior_antibiotics", "Recent / Current Antibiotics"),
        T("comorbidities_medications", "Comorbidities & Medications"),
      ]),
      ...sec("Examination & Severity", [
        T("vitals", "Vital Signs"),
        S("sepsis_screen", "Sepsis Screening (qSOFA 0–3)", ["0", "1", "2", "3", "Not calculated"]),
        S("local_findings", "Local Findings", [
          "Cellulitis without collection",
          "Abscess with fluctuance",
          "Wound dehiscence",
          "Discharging sinus",
          "Suspected necrotising infection",
          "Not assessed",
        ]),
        S("ssi_depth", "Surgical Site Infection Depth (if postoperative)", ["Superficial incisional", "Deep incisional", "Organ / space", "Not applicable", "Not assessed"]),
        T("wound_description", "Wound Description — Size, Depth, Granulation, Slough, Exposed Structure"),
        S("drainage", "Drainage / Pus", ["None", "Serous", "Purulent", "Faeculent", "Not assessed"]),
      ]),
      ...sec("Investigations", [
        T("labs", "Laboratory Results — WCC, CRP, Lactate, Glucose"),
        S("cultures", "Cultures Sent", ["Yes — pending", "Yes — result available", "Not sent", "Not indicated"]),
        S("imaging_performed", "Imaging Performed", ["Ultrasound", "CT", "None yet", "Not assessed"]),
        T("imaging_findings", "Imaging Findings — Collection Size and Location"),
      ]),
      ...sec("Assessment & Decision", [
        T("working_diagnosis", "Working Diagnosis"),
        S("severity", "Severity", ["Localised infection", "Systemic sepsis", "Septic shock", "Suspected necrotising infection", "Not assessed"], true),
        S("source_control", "Source Control", [
          "Incision and drainage",
          "Debridement",
          "Device removal",
          "Drain placement",
          "None required",
          "Not yet performed",
        ]),
        T("antimicrobial_plan", "Antimicrobial Plan — Agent, Route, Duration and Review Date"),
        S("tetanus", "Tetanus Status (open wounds)", ["Up to date", "Due", "Unknown", "Not applicable"]),
        T("wound_care", "Wound Care Plan and Dressing"),
        T("escalation_criteria", "Escalation Criteria — Necrotising Infection, Sepsis, Exposed Prosthesis"),
        T("plan_followup", "Plan & Follow-Up"),
      ]),
    ],
  },
  {
    key: "surg_trauma",
    label: "Trauma & Emergency Surgery Assessment",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Mechanism & History", [
        T("mechanism", "Mechanism of Injury & Time of Injury"),
        T("prehospital", "Prehospital Care / Handover"),
        T("comorbidities_medications", "Comorbidities & Medications (including anticoagulants)"),
        T("allergies", "Allergies"),
        S("pregnancy_status", "Pregnancy Status", ["Not applicable", "Negative", "Positive", "Not tested", "Unknown"]),
      ]),
      ...sec("Primary Survey (ATLS)", [
        S("airway", "Airway", ["Patent", "Maintained with adjunct", "Compromised", "Secured", "Not assessed"]),
        S("breathing", "Breathing", ["Spontaneous", "Assisted ventilation", "Compromised", "Not assessed"]),
        S("circulation", "Circulation", ["Stable", "Compensated shock", "Decompensated shock", "Cardiac arrest", "Not assessed"], true),
        S("gcs", "Glasgow Coma Scale", ["13–15", "9–12", "≤8", "Not assessed"]),
        T("exposure", "Exposure — Full Examination Findings and Temperature Protection"),
        T("vitals", "Vital Signs"),
      ]),
      ...sec("Adjuncts & Injuries", [
        S("fast", "FAST Scan", ["Negative", "Positive — free fluid", "Equivocal", "Not performed"]),
        S("pelvic_imaging", "Pelvic / Chest Imaging", ["Performed — see findings", "Not performed", "Not indicated"]),
        T("injuries", "Injuries Identified"),
        T("labs", "Laboratory Results — Group & Save, Crossmatch, Coags, Lactate, Base Deficit"),
        S("massive_transfusion", "Massive Haemorrhage Protocol", ["Not activated", "Activated", "Considered", "Not assessed"]),
      ]),
      ...sec("Decision & Plan", [
        S("operative_indication", "Operative Indication", ["Immediate", "After resuscitation", "Not indicated", "Not assessed"]),
        S("damage_control", "Damage-Control Surgery", ["Yes", "No", "Considered", "Not applicable"]),
        S("transfer", "Transfer / Specialist Referral", ["Not required", "Discussed", "Arranged", "Not assessed"]),
        S("clinician_decision", "Clinician Decision (recorded, not an order)", [
          "Proceed to theatre",
          "Further imaging",
          "Observe with serial review",
          "Transfer to trauma centre",
          "Discussed with senior — plan pending",
          "Not yet decided",
        ], true),
        T("escalation_criteria", "Escalation & Time-Critical Criteria"),
        T("plan", "Plan"),
      ]),
    ],
  },
  {
    key: "surg_endoscopy",
    label: "Endoscopy / Endoscopic Procedure Record",
    specialty: "surgery",
    notice: NOTICE,
    fields: [
      ...sec("Indication & Preparation", [
        S("indication", "Indication", ["Diagnostic", "Therapeutic", "Surveillance", "GI bleeding", "Foreign body", "Other"]),
        S("consent", "Consent", ["Documented", "Not documented", "Not applicable"], true),
        S("asa_class", "ASA Class", ASA),
        S("anticoagulation", "Anticoagulant / Antiplatelet Plan", ["Continue", "Held — bridged", "Held — not bridged", "Not applicable", "Not assessed"]),
        S("sedation", "Sedation", ["None", "Midazolam ± opioid", "Propofol", "General anaesthesia", "Not recorded"]),
        T("bowel_prep", "Bowel Preparation (colonoscopy) / Fasting"),
      ]),
      ...sec("Procedure & Findings", [
        S("scope", "Scope Used", ["OGD", "Colonoscopy", "Flexible sigmoidoscopy", "Rigid sigmoidoscopy", "ERCP", "Other"]),
        S("completion", "Procedure Completion", ["Completed", "Incomplete — see reason", "Abandoned", "Not performed"], true),
        T("findings", "Findings"),
        T("therapy", "Therapy Performed — Biopsy, Polypectomy, Haemostasis, Dilatation, Stent"),
        T("complications", "Complications"),
        T("tolerance", "Patient Tolerance / Recovery"),
      ]),
      ...sec("Aftercare", [
        T("post_procedure_plan", "Post-Procedure Plan — Observation, Analgesia, Diet"),
        T("results_communication", "Results Communication — Histology and Follow-Up Arrangements"),
        T("escalation_criteria", "Escalation Criteria — Bleeding, Perforation, Sedation Complications"),
      ]),
    ],
  },
];