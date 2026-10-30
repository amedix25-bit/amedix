// Disease-specific Gastroenterology and Hepatology documentation blocks.
//
// These are ADDED to the existing note types (see gastroenterologyDocuments.js);
// no existing block, field, key or label is renamed or removed.
//
// Design rules, identical to the rest of the specialty:
//   - Every block opens with ONE "which problem does this note document" selector.
//     Every other question in the block appears only when that selector makes it
//     relevant, so a consultation never shows the whole catalogue of questions.
//   - Nothing is preselected and nothing defaults to normal. A blank field is
//     read as not documented, and "Not documented" / "Not applicable" are real,
//     selectable answers wherever the choice matters.
//   - Vital signs, the abdominal examination, laboratory and imaging results,
//     medications and allergies stay on the shared AMedix surfaces and are never
//     duplicated here.
//
// Field keys are prefixed per block and never reuse a key that another block or
// the note already uses for a different meaning, so a flag computed from a value
// can never read the wrong field.
//
// GUIDELINE ANCHORS
//   Upper GI / H. pylori / PUD ... ACG clinical guidelines (H. pylori treatment,
//     GERD, peptic ulcer bleeding), AGA dyspepsia and Barrett guidance.
//   Functional / IBS / constipation ... ACG IBS and chronic idiopathic
//     constipation monographs, Rome IV criteria.
//   Coeliac / malabsorption ....... AGA coeliac guideline (serology on a
//     gluten-containing diet, biopsy, follow-up), ACG malabsorption guidance.
//   Colorectal ................... USMSTF post-polypectomy surveillance, ACG
//     colorectal cancer screening, ASCRS diverticulitis guidance.
//   Pancreas ..................... ACG acute and chronic pancreatitis guidelines,
//     AGA exocrine pancreatic insufficiency and pancreatic cyst guidance.
//   Biliary ...................... Tokyo Guidelines (cholangitis, cholecystitis),
//     AASLD/EASL PBC and PSC guidance.
//   GI infection ................. ACG/IDSA C. difficile guidance, ACG acute
//     infectious diarrhoea guidance.
//   Viral hepatitis .............. AASLD hepatitis B guidance, AASLD/IDSA HCV
//     guidance, CDC adult vaccination schedule.
//   MASLD / MASH ................. AASLD MASLD practice guidance, EASL MASLD
//     guideline, AGA clinical care pathway.
//   Autoimmune / DILI / metabolic  AASLD autoimmune hepatitis guidance,
//     AASLD DILI practice guidance (RUCAM, Hy's law), AASLD/EASL haemochromatosis
//     and Wilson disease guidance.
//   Cirrhosis / portal HTN ....... Baveno VII (varices, prophylaxis, screening),
//     AASLD ascites / SBP / HRS-AKI guidance, AASLD HCC guidance, EASL
//     decompensated cirrhosis guidance, transplant referral criteria.

const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const M = (key, label, options, extra) => ({ key, label, type: "multi", options, ...extra });

const WHEN = (key, value) => ({ showIf: { key, equals: value } });
const WHEN_IN = (key, values) => ({ showIf: { key, in: values } });

const NONE = "None documented in this note";

// ---- 1. Upper GI ----------------------------------------------------------
const GERD = ["Gastro-oesophageal reflux disease", "Erosive oesophagitis", "Barrett oesophagus"];
const PUD = ["Peptic ulcer disease", "H. pylori infection"];

const UPPER_GI = {
  title: "Upper GI Disease Assessment (oesophagus, stomach, duodenum)",
  fields: [
    M("upper_problem", "Documented Upper GI Problem", [
      ...GERD,
      ...PUD,
      "Gastritis",
      "Functional dyspepsia",
      "Oesophageal stricture",
      "Achalasia / oesophageal motility disorder",
      "Gastroparesis",
      "Upper GI malignancy",
      NONE,
    ]),
    S("upper_reflux_pattern", "Reflux Symptom Pattern", [
      "Typical — heartburn and/or regurgitation",
      "Extraoesophageal — cough, hoarseness, chest pain",
      "Both documented",
      "Not documented",
    ], WHEN_IN("upper_problem", GERD)),
    S("upper_ppi_response", "PPI Trial and Documented Response", [
      "Not started",
      "Started — full response",
      "Started — partial response",
      "No response — refractory work-up documented",
      "Not documented",
    ], WHEN_IN("upper_problem", GERD)),
    S("upper_endoscopy_indication", "Endoscopy Decision Documented", [
      "Indicated for alarm features",
      "Indicated for Barrett screening",
      "Indicated for refractory symptoms",
      "Surveillance endoscopy",
      "Not indicated — reason documented",
      "Not documented",
    ], WHEN_IN("upper_problem", GERD)),
    S("upper_prague", "Prague Classification (C and M) Documented", [
      "Documented",
      "Not applicable",
      "Not documented",
    ], WHEN("upper_problem", "Barrett oesophagus")),
    S("upper_dysplasia", "Barrett Dysplasia Grade", [
      "No dysplasia",
      "Indefinite for dysplasia",
      "Low grade dysplasia",
      "High grade dysplasia",
      "Not documented",
    ], WHEN("upper_problem", "Barrett oesophagus")),
    S("upper_barrett_surveillance", "Barrett Surveillance Interval", [
      "Documented with its basis",
      "Not indicated — documented",
      "Not documented",
    ], WHEN("upper_problem", "Barrett oesophagus")),
    M("upper_ulcer_risk", "Documented Ulcer Risk Factors", [
      "H. pylori infection",
      "NSAID use",
      "Aspirin",
      "Anticoagulant therapy",
      "Previous ulcer or bleed",
      "Smoking",
      "None documented",
    ], WHEN_IN("upper_problem", PUD)),
    S("upper_ulcer_healing", "Ulcer Healing Plan", [
      "Repeat endoscopy arranged",
      "Repeat endoscopy not indicated — documented",
      "Clinical follow-up only — documented",
      "Not documented",
    ], WHEN("upper_problem", "Peptic ulcer disease")),
    S("upper_hp_status", "H. pylori Status", [
      "Not tested",
      "Positive",
      "Negative",
      "Eradicated — confirmation documented",
    ], WHEN_IN("upper_problem", [...PUD, "Gastritis", "Functional dyspepsia"])),
    S("upper_hp_test", "H. pylori Test Used", [
      "Urea breath test",
      "Stool antigen test",
      "Histology",
      "Rapid urease test",
      "Serology only — limitation documented",
      "Not documented",
    ], WHEN_IN("upper_hp_status", ["Positive", "Negative"])),
    S("upper_hp_regimen", "Eradication Regimen Documented", [
      "Documented with agents and duration",
      "Documented without duration",
      "Not started — reason documented",
      "Not documented",
    ], WHEN("upper_hp_status", "Positive")),
    S("upper_hp_confirmation", "Eradication Confirmation Planned", [
      "Urea breath test arranged",
      "Stool antigen arranged",
      "Endoscopic retest arranged",
      "Not indicated — documented",
      "Not documented",
    ], WHEN("upper_hp_status", "Positive")),
    S("upper_hp_ppi_hold", "PPI Held Before Testing Documented", [
      "Yes — documented",
      "No — test limitation documented",
      "Not applicable",
      "Not documented",
    ], WHEN_IN("upper_hp_status", ["Positive", "Negative"])),
    S("upper_gastritis_pattern", "Gastritis Pattern", [
      "H. pylori-associated",
      "Autoimmune (corpus-predominant, pernicious pattern)",
      "NSAID / medication-related",
      "Eosinophilic",
      "Reactive / chemical",
      "Not documented",
    ], WHEN("upper_problem", "Gastritis")),
    S("upper_gastric_cancer_risk", "Gastric Cancer Risk Addressed", [
      "Atrophy or intestinal metaplasia documented — surveillance addressed",
      "Risk factors reviewed — no surveillance indicated",
      "Not documented",
    ], WHEN("upper_problem", "Gastritis")),
    S("upper_emptying_test", "Gastric Emptying Assessment", [
      "Scintigraphy documented",
      "Breath test documented",
      "Not performed — documented",
      "Not documented",
    ], WHEN("upper_problem", "Gastroparesis")),
    S("upper_dyspepsia_strategy", "Dyspepsia Strategy Documented", [
      "Test-and-treat for H. pylori",
      "Empirical PPI trial",
      "Endoscopy first",
      "Not documented",
    ], WHEN("upper_problem", "Functional dyspepsia")),
    S("upper_malignancy_plan", "Malignancy Referral and Staging", [
      "Staging documented",
      "MDT referral documented",
      "Palliative plan documented",
      "Not documented",
    ], WHEN("upper_problem", "Upper GI malignancy")),
    T("upper_response", "Documented Response to Treatment"),
    T("upper_plan", "Management Plan Documented at This Visit"),
  ],
};

// ---- 2. Functional GI and motility ----------------------------------------
const FUNCTIONAL = ["Irritable bowel syndrome", "Functional constipation", "Chronic diarrhoea", "Functional bloating / distension"];

const FUNCTIONAL_GI = {
  title: "Functional GI Disorder & Motility Assessment",
  fields: [
    M("func_problem", "Documented Functional or Motility Problem", [
      ...FUNCTIONAL,
      "Functional dyspepsia",
      "Faecal incontinence",
      "Dyssynergic defecation",
      NONE,
    ]),
    S("func_rome_criteria", "Rome IV Criteria", [
      "Met — criteria documented",
      "Not met — documented",
      "Not documented",
    ], WHEN_IN("func_problem", FUNCTIONAL)),
    S("func_ibs_subtype", "IBS Subtype", [
      "IBS-C — constipation predominant",
      "IBS-D — diarrhoea predominant",
      "IBS-M — mixed",
      "IBS-U — unclassified",
      "Not documented",
    ], WHEN("func_problem", "Irritable bowel syndrome")),
    S("func_symptom_duration", "Symptom Duration Documented", [
      "Onset at least 6 months and active in the last 3 months",
      "Shorter duration — documented",
      "Not documented",
    ], WHEN_IN("func_problem", FUNCTIONAL)),
    M("func_alarm_review", "Alarm Features Reviewed", [
      "No weight loss",
      "No rectal bleeding",
      "No anaemia",
      "No nocturnal symptoms",
      "No family history of colorectal cancer or IBD",
      "Alarm feature present — escalation documented",
      "Not reviewed",
    ], WHEN_IN("func_problem", FUNCTIONAL)),
    M("func_organic_exclusion", "Organic Disease Excluded — Documented", [
      "Coeliac serology",
      "Faecal calprotectin",
      "Stool microscopy and culture",
      "Thyroid function",
      "None documented",
    ], WHEN_IN("func_problem", FUNCTIONAL)),
    S("func_bristol", "Bristol Stool Form Documented", [
      "Documented",
      "Not documented",
    ], WHEN_IN("func_problem", ["Irritable bowel syndrome", "Functional constipation", "Chronic diarrhoea"])),
    M("func_constipation_features", "Constipation Features Documented", [
      "Fewer than 3 stools per week",
      "Straining",
      "Lumpy or hard stools",
      "Incomplete evacuation",
      "Digital manoeuvres or manual assistance",
      "None documented",
    ], WHEN_IN("func_problem", ["Irritable bowel syndrome", "Functional constipation"])),
    S("func_pelvic_floor", "Dyssynergic Defecation Addressed", [
      "Anorectal manometry arranged",
      "Biofeedback referral made",
      "Not assessed",
    ], WHEN_IN("func_problem", ["Functional constipation", "Dyssynergic defecation", "Irritable bowel syndrome"])),
    S("func_stool_studies", "Chronic Diarrhoea Work-Up Documented", [
      "Stool studies documented",
      "Faecal calprotectin documented",
      "Both documented",
      "Not performed — documented",
      "Not documented",
    ], WHEN_IN("func_problem", ["Chronic diarrhoea", "Irritable bowel syndrome"])),
    M("func_treatment", "Treatment Documented", [
      "Dietary — low FODMAP or fibre adjustment",
      "Bulking agent",
      "Osmotic laxative",
      "Stimulant laxative",
      "Antispasmodic",
      "Neuromodulator (TCA or SSRI)",
      "Antidiarrhoeal",
      "Rifaximin trial",
      "Psychological therapy referral",
      "None documented",
    ], WHEN_IN("func_problem", FUNCTIONAL)),
    T("func_response", "Documented Response to Treatment", WHEN_IN("func_problem", FUNCTIONAL)),
    T("func_plan", "Ongoing Plan Documented"),
  ],
};

// ---- 3. Coeliac disease and malabsorption ---------------------------------
const COELIAC_STATUS = ["Suspected coeliac disease", "Confirmed coeliac disease", "Refractory coeliac disease", "Non-coeliac malabsorption"];

const COELIAC = {
  title: "Coeliac Disease & Malabsorption Assessment",
  fields: [
    S("coe_status", "Documented Coeliac / Malabsorption Status", [...COELIAC_STATUS, NONE]),
    S("coe_serology", "Coeliac Serology", [
      "tTG-IgA with total IgA documented",
      "tTG-IgA without total IgA documented",
      "Endomysial antibodies documented",
      "Not performed — documented",
      "Not documented",
    ], WHEN_IN("coe_status", COELIAC_STATUS)),
    S("coe_gluten_at_testing", "Diet at Time of Serology", [
      "Gluten-containing diet",
      "Gluten-free diet — limitation documented",
      "Not documented",
    ], WHEN_IN("coe_serology", ["tTG-IgA with total IgA documented", "tTG-IgA without total IgA documented", "Endomysial antibodies documented"])),
    S("coe_biopsy", "Duodenal Histology", [
      "Biopsy performed — Marsh grade documented",
      "Biopsy not performed — no-biopsy criteria documented",
      "Biopsy declined — documented",
      "Not indicated",
      "Not documented",
    ], WHEN_IN("coe_status", COELIAC_STATUS)),
    S("coe_hla", "HLA DQ2 / DQ8", ["Positive", "Negative", "Not tested"], WHEN_IN("coe_status", ["Suspected coeliac disease", "Refractory coeliac disease"])),
    M("coe_micronutrients", "Micronutrients Tested", [
      "Iron and ferritin",
      "Vitamin B12",
      "Folate",
      "Vitamin D",
      "Calcium",
      "Fat-soluble vitamins",
      "Zinc or copper",
      "None documented",
    ], WHEN_IN("coe_status", COELIAC_STATUS)),
    S("coe_bone", "Bone Health", [
      "DEXA performed",
      "DEXA arranged",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("coe_status", ["Confirmed coeliac disease", "Refractory coeliac disease", "Non-coeliac malabsorption"])),
    S("coe_dietitian", "Dietitian and Gluten-Free Adherence", [
      "Dietitian seen — adherence documented",
      "Dietitian referral made",
      "No dietitian involvement documented",
    ], WHEN_IN("coe_status", ["Confirmed coeliac disease", "Refractory coeliac disease"])),
    S("coe_associated", "Associated Conditions Addressed", [
      "Type 1 diabetes",
      "Autoimmune thyroid disease",
      "Dermatitis herpetiformis",
      "None documented",
    ], WHEN("coe_status", "Confirmed coeliac disease")),
    S("coe_followup_serology", "Follow-Up Serology", [
      "Arranged with a documented date",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("coe_status", ["Confirmed coeliac disease", "Refractory coeliac disease"])),
    S("coe_elastase", "Faecal Elastase", [
      "Value documented",
      "Not tested — documented",
      "Not documented",
    ], WHEN_IN("coe_status", ["Non-coeliac malabsorption", "Refractory coeliac disease"])),
    T("coe_plan", "Nutritional and Treatment Plan Documented"),
  ],
};

// ---- 4. Colorectal: polyps, cancer, diverticular disease ------------------
const COLORECTAL = ["Adenomatous polyp", "Sessile serrated lesion", "Colorectal cancer", "Diverticulosis", "Acute diverticulitis", "Colorectal screening or surveillance"];

const COLORECTAL_BLOCK = {
  title: "Colorectal Disease Assessment (polyps, cancer, diverticular disease)",
  fields: [
    M("crc_problem", "Documented Colorectal Problem", [...COLORECTAL, NONE]),
    N("crc_polyp_count", "Polyp Count Documented", { min: 0 }, WHEN_IN("crc_problem", ["Adenomatous polyp", "Sessile serrated lesion"])),
    I("crc_polyp_size", "Largest Polyp Size (mm)", WHEN_IN("crc_problem", ["Adenomatous polyp", "Sessile serrated lesion"])),
    S("crc_histology", "Histology", [
      "Documented — result recorded above",
      "Pending",
      "Not documented",
    ], WHEN_IN("crc_problem", ["Adenomatous polyp", "Sessile serrated lesion"])),
    S("crc_resection", "Resection Completeness", [
      "Complete — documented",
      "Piecemeal — documented",
      "Incomplete — repeat arranged",
      "Not documented",
    ], WHEN_IN("crc_problem", ["Adenomatous polyp", "Sessile serrated lesion"])),
    S("crc_interval", "Post-Polypectomy Surveillance Interval", [
      "Documented with its basis (USMSTF)",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("crc_problem", ["Adenomatous polyp", "Sessile serrated lesion"])),
    I("crc_next_exam", "Next Examination Due", WHEN_IN("crc_problem", ["Adenomatous polyp", "Sessile serrated lesion"])),
    S("crc_site", "Tumour Site", [
      "Right colon",
      "Transverse colon",
      "Left colon",
      "Rectum",
      "Not documented",
    ], WHEN("crc_problem", "Colorectal cancer")),
    S("crc_stage", "Staging", [
      "TNM documented",
      "Staging in progress",
      "Not documented",
    ], WHEN("crc_problem", "Colorectal cancer")),
    S("crc_mmr", "Mismatch Repair / MSI Testing", [
      "Performed — result documented",
      "Arranged",
      "Not documented",
    ], WHEN("crc_problem", "Colorectal cancer")),
    S("crc_mdt", "MDT and Oncology Referral", [
      "Discussed — outcome documented",
      "Referred",
      "Not documented",
    ], WHEN("crc_problem", "Colorectal cancer")),
    S("crc_surgery", "Surgical Plan Documented", [
      "Surgical referral made",
      "Surgery deferred — documented",
      "Not a surgical candidate — documented",
      "Not documented",
    ], WHEN("crc_problem", "Colorectal cancer")),
    S("crc_diverticulitis_severity", "Diverticulitis Severity", [
      "Uncomplicated",
      "Complicated — abscess",
      "Complicated — perforation",
      "Complicated — fistula",
      "Complicated — obstruction",
      "Not documented",
    ], WHEN("crc_problem", "Acute diverticulitis")),
    S("crc_diverticulitis_antibiotics", "Antibiotic Decision", [
      "Antibiotics given — regimen documented",
      "Antibiotics not indicated — documented",
      "Not documented",
    ], WHEN("crc_problem", "Acute diverticulitis")),
    S("crc_diverticulitis_followup", "Post-Acute Diverticulitis Follow-Up", [
      "Colonoscopy arranged",
      "Not indicated — documented",
      "Not documented",
    ], WHEN("crc_problem", "Acute diverticulitis")),
    S("crc_screening", "Screening or Surveillance Status", [
      "FIT-based screening documented",
      "Colonoscopy screening documented",
      "Family history assessed",
      "Not documented",
    ], WHEN_IN("crc_problem", ["Colorectal screening or surveillance", "Colorectal cancer"])),
    T("crc_plan", "Plan Documented at This Visit"),
  ],
};

// ---- 5. Pancreas: chronic pancreatitis, cysts, insufficiency --------------
const PANCREAS = ["Chronic pancreatitis", "Exocrine pancreatic insufficiency", "Pancreatic cyst / IPMN", "Pancreatic adenocarcinoma", "Pancreatic neuroendocrine tumour"];

const PANCREATIC = {
  title: "Pancreatic Disease Assessment (chronic pancreatitis, insufficiency, lesions)",
  fields: [
    M("pan_problem", "Documented Pancreatic Problem", [...PANCREAS, "Acute-on-chronic pancreatitis", NONE]),
    S("pan_cp_aetiology", "Chronic Pancreatitis Aetiology", [
      "Toxic-metabolic (alcohol, smoking)",
      "Genetic",
      "Autoimmune",
      "Obstructive",
      "Idiopathic — after work-up",
      "Not documented",
    ], WHEN_IN("pan_problem", ["Chronic pancreatitis", "Acute-on-chronic pancreatitis"])),
    M("pan_cp_imaging", "Imaging Findings Documented", [
      "CT",
      "MRCP",
      "EUS",
      "Calcifications",
      "Duct dilatation",
      "Atrophy",
      "None documented",
    ], WHEN_IN("pan_problem", ["Chronic pancreatitis", "Acute-on-chronic pancreatitis"])),
    S("pan_cp_pain", "Pain Management Documented", [
      "Analgesic plan documented",
      "Endotherapy arranged",
      "Coeliac plexus block arranged",
      "Surgical referral",
      "Not documented",
    ], WHEN_IN("pan_problem", ["Chronic pancreatitis", "Acute-on-chronic pancreatitis"])),
    S("pan_cp_diabetes", "Pancreatogenic Diabetes Addressed", [
      "Screened — HbA1c documented",
      "Diabetes documented and managed",
      "Not addressed",
    ], WHEN_IN("pan_problem", ["Chronic pancreatitis", "Exocrine pancreatic insufficiency"])),
    S("pan_elastase", "Faecal Elastase", ["Value documented", "Not tested — documented", "Not documented"], WHEN_IN("pan_problem", ["Exocrine pancreatic insufficiency", "Chronic pancreatitis"])),
    S("pan_pert", "Pancreatic Enzyme Replacement", [
      "Started — dose documented",
      "Dose adjusted — response documented",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("pan_problem", ["Exocrine pancreatic insufficiency", "Chronic pancreatitis"])),
    S("pan_fat_soluble", "Fat-Soluble Vitamins Assessed", [
      "Assessed — documented",
      "Not assessed — documented",
      "Not documented",
    ], WHEN_IN("pan_problem", ["Exocrine pancreatic insufficiency", "Chronic pancreatitis"])),
    I("pan_cyst_size", "Cyst Size (mm)", WHEN_IN("pan_problem", ["Pancreatic cyst / IPMN"])),
    S("pan_cyst_stigmata", "High-Risk Stigmata", [
      "Present — documented",
      "Absent — documented",
      "Not assessed",
    ], WHEN("pan_problem", "Pancreatic cyst / IPMN")),
    S("pan_cyst_surveillance", "Cyst Surveillance Interval", [
      "Documented",
      "Resection recommended — documented",
      "Not documented",
    ], WHEN("pan_problem", "Pancreatic cyst / IPMN")),
    S("pan_cancer_staging", "Cancer Staging and MDT", [
      "Staging documented",
      "MDT discussed",
      "Resection assessment documented",
      "Palliative plan documented",
      "Not documented",
    ], WHEN_IN("pan_problem", ["Pancreatic adenocarcinoma", "Pancreatic neuroendocrine tumour"])),
    T("pan_plan", "Plan Documented at This Visit"),
  ],
};

// ---- 6. Biliary and cholestatic liver disease ----------------------------
const CHOLANGITIS = "Acute cholangitis";
const BILIARY_PROBLEMS = ["Choledocholithiasis", CHOLANGITIS, "Acute cholecystitis", "Primary biliary cholangitis", "Primary sclerosing cholangitis", "IgG4-related cholangitis", "Biliary stricture"];

const BILIARY = {
  title: "Biliary & Cholestatic Disease Assessment",
  fields: [
    M("bil_problem", "Documented Biliary Problem", [...BILIARY_PROBLEMS, "Gallstone pancreatitis", NONE]),
    S("bil_cholangitis_grade", "Cholangitis Severity", [
      "Grade I — mild",
      "Grade II — moderate",
      "Grade III — severe",
      "Not documented",
    ], WHEN("bil_problem", CHOLANGITIS)),
    S("bil_antibiotics", "Antibiotic Therapy", [
      "Started — regimen documented",
      "Not started — reason documented",
      "Not documented",
    ], WHEN_IN("bil_problem", [CHOLANGITIS, "Acute cholecystitis"])),
    S("bil_drainage", "Biliary Drainage Timing", [
      "ERCP within 24 hours — documented",
      "Drainage arranged with a documented time",
      "Not indicated — documented",
      "Not documented",
    ], WHEN("bil_problem", CHOLANGITIS)),
    S("bil_duct_findings", "Ductal Findings Documented", [
      "Common bile duct stones",
      "Duct dilatation",
      "Stricture",
      "No obstruction — documented",
      "Not documented",
    ], WHEN_IN("bil_problem", ["Choledocholithiasis", "Biliary stricture", "Gallstone pancreatitis"])),
    S("bil_definitive", "Definitive Management", [
      "Cholecystectomy arranged",
      "ERCP completed — documented",
      "Interval procedure planned",
      "Not a candidate — documented",
      "Not documented",
    ], WHEN_IN("bil_problem", ["Choledocholithiasis", "Gallstone pancreatitis"])),
    S("bil_cholecystitis_grade", "Cholecystitis Severity", [
      "Grade I — mild",
      "Grade II — moderate",
      "Grade III — severe",
      "Not documented",
    ], WHEN("bil_problem", "Acute cholecystitis")),
    S("bil_cholecystectomy_timing", "Cholecystectomy Timing", [
      "Early cholecystectomy arranged",
      "Interval cholecystectomy planned",
      "Not a surgical candidate — documented",
      "Not documented",
    ], WHEN("bil_problem", "Acute cholecystitis")),
    S("bil_pbc_serology", "PBC Serology", [
      "AMA or AMA-M2 positive — documented",
      "Negative — documented",
      "Not documented",
    ], WHEN("bil_problem", "Primary biliary cholangitis")),
    S("bil_udca", "UDCA and Biochemical Response", [
      "Started — response documented",
      "Started — response not yet assessed",
      "Not tolerated — documented",
      "Not documented",
    ], WHEN("bil_problem", "Primary biliary cholangitis")),
    S("bil_pruritus", "Pruritus Management", [
      "Addressed — treatment documented",
      "Not present — documented",
      "Not documented",
    ], WHEN("bil_problem", "Primary biliary cholangitis")),
    S("bil_psc_imaging", "MRCP Findings", [
      "Multifocal strictures documented",
      "No strictures documented",
      "Not documented",
    ], WHEN("bil_problem", "Primary sclerosing cholangitis")),
    S("bil_cca_surveillance", "Cholangiocarcinoma Surveillance", [
      "CA19-9 and imaging documented",
      "Arranged",
      "Not indicated — documented",
      "Not documented",
    ], WHEN("bil_problem", "Primary sclerosing cholangitis")),
    S("bil_psc_ibd", "IBD Status and Colonoscopy Surveillance", [
      "IBD present — surveillance documented",
      "IBD excluded — documented",
      "Not documented",
    ], WHEN("bil_problem", "Primary sclerosing cholangitis")),
    S("bil_igg4", "Serum IgG4 Documented", ["Value documented", "Not tested — documented", "Not documented"], WHEN("bil_problem", "IgG4-related cholangitis")),
    S("bil_bone_health", "Bone Health Addressed", [
      "DEXA performed",
      "DEXA arranged",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("bil_problem", ["Primary biliary cholangitis", "Primary sclerosing cholangitis"])),
    T("bil_plan", "Plan Documented at This Visit"),
  ],
};

// ---- 7. Gastrointestinal infection ---------------------------------------
const CDIFF = "Clostridioides difficile infection";
const INFECTION_PROBLEMS = ["Acute infectious diarrhoea", CDIFF, "Parasitic infection", "Food-borne illness", "Travel-associated diarrhoea", "Healthcare-associated diarrhoea"];

const INFECTION = {
  title: "Gastrointestinal Infection Assessment",
  fields: [
    M("inf_problem", "Documented GI Infection", [...INFECTION_PROBLEMS, NONE]),
    M("inf_exposure", "Exposure History Documented", [
      "Recent travel",
      "Food or water exposure",
      "Antibiotic exposure within 8 weeks",
      "Healthcare exposure",
      "Outbreak or contact exposure",
      "Sexual exposure history",
      "None documented",
    ], WHEN_IN("inf_problem", INFECTION_PROBLEMS)),
    M("inf_stool_tests", "Stool Testing Documented", [
      "Culture",
      "Multiplex PCR panel",
      "C. difficile toxin or PCR",
      "Ova, cysts and parasites",
      "Faecal calprotectin",
      "Blood tests",
      "None documented",
    ], WHEN_IN("inf_problem", INFECTION_PROBLEMS)),
    S("inf_severity", "Severity Documented", [
      "Mild — no systemic features",
      "Moderate — systemic features",
      "Severe — hypovolaemia, acute kidney injury or colitis",
      "Not documented",
    ], WHEN_IN("inf_problem", INFECTION_PROBLEMS)),
    S("inf_cdiff_episode", "C. difficile Episode", [
      "First episode",
      "First recurrence",
      "Second or further recurrence",
      "Not documented",
    ], WHEN("inf_problem", CDIFF)),
    S("inf_cdiff_agent", "C. difficile Treatment", [
      "Fidaxomicin",
      "Oral vancomycin",
      "Metronidazole — documented reason",
      "Not started — documented",
      "Not documented",
    ], WHEN("inf_problem", CDIFF)),
    S("inf_cdiff_inciting", "Inciting Antibiotic Addressed", [
      "Stopped",
      "Continued — reason documented",
      "Not applicable",
      "Not documented",
    ], WHEN("inf_problem", CDIFF)),
    S("inf_cdiff_recurrence", "Recurrence Plan", [
      "Documented",
      "FMT referral documented",
      "Not documented",
    ], WHEN("inf_problem", CDIFF)),
    S("inf_isolation", "Infection Control Measures", [
      "Isolation and hand hygiene documented",
      "Not documented",
    ], WHEN("inf_problem", CDIFF)),
    S("inf_notification", "Public Health Notification Considered", [
      "Notifiable disease notified",
      "Not notifiable — documented",
      "Not documented",
    ], WHEN_IN("inf_problem", INFECTION_PROBLEMS)),
    S("inf_antibiotic_decision", "Antibiotic Decision Documented", [
      "Not indicated — documented",
      "Indicated — regimen documented",
      "Not documented",
    ], WHEN_IN("inf_problem", ["Acute infectious diarrhoea", "Food-borne illness", "Travel-associated diarrhoea", "Healthcare-associated diarrhoea"])),
    S("inf_hydration", "Hydration and Nutrition Plan", [
      "Documented",
      "Not documented",
    ], WHEN_IN("inf_problem", INFECTION_PROBLEMS)),
    T("inf_plan", "Return-to-Work, Contact and Follow-Up Advice Documented"),
  ],
};

// ---- 8. Viral hepatitis ---------------------------------------------------
const HEP_B = "Hepatitis B";
const HEP_C = "Hepatitis C";
const VIRAL = ["Hepatitis A", HEP_B, HEP_C, "Hepatitis D", "Hepatitis E"];

const VIRAL_HEPATITIS = {
  title: "Viral Hepatitis Assessment (A, B, C, D, E)",
  fields: [
    M("vir_problem", "Documented Viral Hepatitis", [...VIRAL, "Viral hepatitis screening", NONE]),
    S("vir_status", "Infection Status", [
      "Acute infection",
      "Chronic infection",
      "Resolved / immune",
      "Immune after vaccination",
      "Susceptible — vaccination offered",
      "Not documented",
    ], WHEN_IN("vir_problem", [...VIRAL, "Viral hepatitis screening"])),
    S("vir_hbsag", "HBsAg Status", ["Positive", "Negative", "Not documented"], WHEN_IN("vir_problem", [HEP_B, "Hepatitis D"])),
    S("vir_hbeag", "HBeAg Status", ["Positive", "Negative", "Not tested"], WHEN_IN("vir_problem", [HEP_B, "Hepatitis D"])),
    S("vir_hbv_dna", "HBV DNA Documented", ["Value documented", "Not tested — documented", "Not documented"], WHEN_IN("vir_problem", [HEP_B, "Hepatitis D"])),
    S("vir_hbv_phase", "Disease Phase Assessed", [
      "Immune tolerant",
      "Immune active",
      "Inactive carrier",
      "Reactivation",
      "Not documented",
    ], WHEN_IN("vir_problem", [HEP_B, "Hepatitis D"])),
    S("vir_hbv_treatment", "HBV Treatment Decision (AASLD)", [
      "Started — agent documented",
      "Monitoring — criteria documented",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("vir_problem", [HEP_B, "Hepatitis D"])),
    S("vir_hdv", "Hepatitis D Testing", [
      "Anti-HDV tested",
      "Not tested — documented",
      "Not applicable",
    ], WHEN("vir_problem", HEP_B)),
    S("vir_hbv_surveillance", "HCC Surveillance Considered", [
      "Indicated — surveillance documented",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("vir_problem", [HEP_B, "Hepatitis D"])),
    S("vir_hcv_rna", "HCV RNA Documented", ["Detected — value documented", "Not detected", "Not tested — documented", "Not documented"], WHEN("vir_problem", HEP_C)),
    S("vir_hcv_genotype", "HCV Genotype", ["Documented", "Not required — pangenotypic regimen", "Not documented"], WHEN("vir_problem", HEP_C)),
    S("vir_hcv_treatment", "DAA Treatment", [
      "Started — regimen documented",
      "Completed — SVR12 documented",
      "Not indicated — documented",
      "Awaiting treatment",
      "Not documented",
    ], WHEN("vir_problem", HEP_C)),
    S("vir_hcv_svr", "SVR12 Status", ["Achieved", "Not achieved — documented", "Pending", "Not applicable"], WHEN("vir_problem", HEP_C)),
    S("vir_hcv_counselling", "Reinfection Risk Counselling Documented", ["Documented", "Not documented"], WHEN("vir_problem", HEP_C)),
    S("vir_hav_igm", "HAV IgM Documented", ["Positive", "Negative", "Not tested — documented"], WHEN("vir_problem", "Hepatitis A")),
    S("vir_hev", "HEV Testing Documented", ["IgM or RNA documented", "Not tested — documented", "Not documented"], WHEN("vir_problem", "Hepatitis E")),
    S("vir_pregnancy", "Pregnancy Consideration Documented", [
      "Not pregnant — documented",
      "Pregnant — vertical transmission and treatment addressed",
      "Not applicable",
      "Not documented",
    ], WHEN_IN("vir_problem", [HEP_B, HEP_C, "Hepatitis E"])),
    M("vir_vaccination", "Vaccination Considerations Documented", [
      "Hepatitis A vaccination",
      "Hepatitis B vaccination",
      "Influenza",
      "Pneumococcal",
      "COVID-19",
      "Not indicated — documented",
      "None documented",
    ], WHEN_IN("vir_problem", [...VIRAL, "Viral hepatitis screening"])),
    S("vir_contact", "Contact Tracing and Partner Notification", [
      "Documented",
      "Not applicable",
      "Not documented",
    ], WHEN_IN("vir_problem", [HEP_B, HEP_C, "Hepatitis A"])),
    T("vir_plan", "Treatment and Monitoring Plan Documented"),
  ],
};

// ---- 9. MASLD / MASH ------------------------------------------------------
const MASLD = {
  title: "MASLD / MASH Assessment",
  fields: [
    S("mas_status", "Documented MASLD / MASH Status", [
      "MASLD — steatosis with cardiometabolic criteria",
      "MASH — steatohepatitis",
      "Steatosis without cardiometabolic criteria",
      "MASLD with cirrhosis",
      NONE,
    ]),
    S("mas_steatosis_evidence", "Steatosis Evidence", [
      "Imaging documented",
      "Histology documented",
      "Not documented",
    ], WHEN("mas_status", "MASLD — steatosis with cardiometabolic criteria")),
    M("mas_cardiometabolic", "Cardiometabolic Criteria Documented", [
      "Overweight or obesity (BMI at least 25)",
      "Type 2 diabetes",
      "Hypertension",
      "Dyslipidaemia",
      "Metabolic syndrome criteria met",
      "None documented",
    ], WHEN_IN("mas_status", ["MASLD — steatosis with cardiometabolic criteria", "MASH — steatohepatitis", "MASLD with cirrhosis"])),
    S("mas_alcohol", "Alcohol Quantification", [
      "Below MASLD thresholds — documented",
      "Above thresholds — alcohol-associated disease considered",
      "Not documented",
    ], WHEN_IN("mas_status", ["MASLD — steatosis with cardiometabolic criteria", "MASH — steatohepatitis"])),
    M("mas_other_causes", "Other Causes Excluded", [
      "Hepatitis B serology",
      "Hepatitis C serology",
      "Autoimmune markers",
      "Iron studies",
      "Medication review",
      "None documented",
    ], WHEN_IN("mas_status", ["MASLD — steatosis with cardiometabolic criteria", "MASH — steatohepatitis", "Steatosis without cardiometabolic criteria"])),
    S("mas_fib4", "FIB-4 Category Documented", [
      "Low risk (below 1.3)",
      "Indeterminate (1.3 to 2.67)",
      "High risk (above 2.67)",
      "Not calculated — documented",
    ], WHEN_IN("mas_status", ["MASLD — steatosis with cardiometabolic criteria", "MASH — steatohepatitis"])),
    S("mas_second_test", "Second-Line Fibrosis Test", [
      "Transient elastography documented",
      "Serum fibrosis panel documented",
      "Arranged",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("mas_fib4", ["Indeterminate (1.3 to 2.67)", "High risk (above 2.67)"])),
    S("mas_risk_stratification", "Advanced Fibrosis Risk Stratification", [
      "Documented",
      "Not documented",
    ], WHEN_IN("mas_status", ["MASLD — steatosis with cardiometabolic criteria", "MASH — steatohepatitis"])),
    S("mas_weight_target", "Weight Loss Target Documented", [
      "Target documented (7 to 10 percent of body weight)",
      "Referred to a structured programme",
      "Not documented",
    ], WHEN_IN("mas_status", ["MASLD — steatosis with cardiometabolic criteria", "MASH — steatohepatitis"])),
    S("mas_mash_therapy", "MASH-Directed Therapy", [
      "GLP-1 receptor agonist considered",
      "Pioglitazone considered",
      "Vitamin E considered",
      "Not indicated — documented",
      "Not documented",
    ], WHEN("mas_status", "MASH — steatohepatitis")),
    S("mas_statin", "Statin Safety Documented", [
      "Statin safe — documented",
      "Statin adjusted — documented",
      "Not on a statin — documented",
      "Not documented",
    ], WHEN_IN("mas_status", ["MASLD — steatosis with cardiometabolic criteria", "MASH — steatohepatitis", "MASLD with cirrhosis"])),
    S("mas_osa", "Sleep Apnoea Screening", [
      "Screened",
      "Not screened — documented",
      "Not documented",
    ], WHEN_IN("mas_status", ["MASLD — steatosis with cardiometabolic criteria", "MASH — steatohepatitis"])),
    S("mas_referral", "Hepatology Referral", [
      "Referred",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("mas_status", ["MASLD — steatosis with cardiometabolic criteria", "MASH — steatohepatitis", "MASLD with cirrhosis"])),
    T("mas_plan", "Management Plan Documented at This Visit"),
  ],
};

// ---- 10. Autoimmune, drug-induced and metabolic liver disease ------------
const AIH = "Autoimmune hepatitis";
const DILI = "Drug-induced liver injury";
const ALI = ["Acute liver injury", "Acute liver failure"];

const IMMUNE_METABOLIC = {
  title: "Autoimmune, Drug-Induced & Metabolic Liver Disease",
  fields: [
    M("aim_problem", "Documented Condition", [
      AIH,
      DILI,
      "Haemochromatosis",
      "Wilson disease",
      "Alpha-1 antitrypsin deficiency",
      ...ALI,
      NONE,
    ]),
    S("aim_autoantibodies", "Autoimmune Markers", [
      "ANA and/or ASMA documented",
      "Anti-LKM1 documented",
      "Seronegative — documented",
      "Not tested — documented",
    ], WHEN("aim_problem", AIH)),
    S("aim_igg", "IgG Documented", ["Value documented", "Not tested — documented", "Not documented"], WHEN("aim_problem", AIH)),
    S("aim_biopsy", "Histology", [
      "Performed — findings documented",
      "Not performed — documented",
      "Not documented",
    ], WHEN("aim_problem", AIH)),
    S("aim_induction", "Induction Therapy", [
      "Prednisolone started — dose documented",
      "Prednisolone with azathioprine — documented",
      "Not started — reason documented",
      "Not documented",
    ], WHEN("aim_problem", AIH)),
    S("aim_response", "Biochemical Response Documented", ["Documented", "Not yet assessable", "Not documented"], WHEN("aim_problem", AIH)),
    S("aim_dili_agent", "Implicated Agent(s) Documented", [
      "Agent identified with dates",
      "Agent identified without dates",
      "No agent identified — documented",
      "Not documented",
    ], WHEN("aim_problem", DILI)),
    S("aim_dili_latency", "Latency Documented", ["Documented", "Not documented"], WHEN("aim_problem", DILI)),
    S("aim_dili_pattern", "Injury Pattern (R ratio)", [
      "Hepatocellular",
      "Cholestatic",
      "Mixed",
      "Not calculable — documented",
    ], WHEN("aim_problem", DILI)),
    S("aim_dili_rucam", "Causality Assessment (RUCAM)", [
      "Score documented",
      "Assessment documented without a score",
      "Not documented",
    ], WHEN("aim_problem", DILI)),
    S("aim_dili_dechallenge", "Dechallenge Documented", ["Documented", "Not documented"], WHEN("aim_problem", DILI)),
    S("aim_dili_hys_law", "Hy's Law Criteria Assessed", [
      "Met — documented",
      "Not met — documented",
      "Not documented",
    ], WHEN("aim_problem", DILI)),
    S("aim_dili_steroid", "Corticosteroid or Antidote Decision", [
      "Given — documented",
      "Not indicated — documented",
      "Not documented",
    ], WHEN("aim_problem", DILI)),
    S("aim_ali_coagulation", "Coagulation and Bilirubin Documented", [
      "INR and bilirubin documented",
      "Not documented",
    ], WHEN_IN("aim_problem", ALI)),
    S("aim_ali_encephalopathy", "Encephalopathy Assessed", [
      "Absent — documented",
      "Present — documented",
      "Not documented",
    ], WHEN_IN("aim_problem", ALI)),
    S("aim_ali_nac", "N-Acetylcysteine Considered", [
      "Given — documented",
      "Considered, not indicated — documented",
      "Not documented",
    ], WHEN_IN("aim_problem", ALI)),
    S("aim_ali_level_of_care", "Level of Care", ["ICU", "High dependency", "Ward", "Not documented"], WHEN_IN("aim_problem", ALI)),
    S("aim_ali_transplant", "Transplant Centre Discussion", [
      "Referred to a transplant centre",
      "Discussed — not indicated",
      "Not documented",
    ], WHEN_IN("aim_problem", ALI)),
    S("aim_iron_studies", "Ferritin and Transferrin Saturation", [
      "Documented",
      "Not documented",
    ], WHEN("aim_problem", "Haemochromatosis")),
    S("aim_hfe", "HFE Genotype", ["Documented", "Not tested — documented", "Not documented"], WHEN("aim_problem", "Haemochromatosis")),
    S("aim_venesection", "Venesection Plan", [
      "Started — schedule documented",
      "Not indicated — documented",
      "Not documented",
    ], WHEN("aim_problem", "Haemochromatosis")),
    S("aim_ceruloplasmin", "Ceruloplasmin Documented", ["Value documented", "Not tested — documented"], WHEN("aim_problem", "Wilson disease")),
    S("aim_urine_copper", "24-Hour Urinary Copper Documented", ["Value documented", "Not tested — documented"], WHEN("aim_problem", "Wilson disease")),
    S("aim_kf_rings", "Kayser-Fleischer Rings Assessed", ["Present", "Absent", "Not documented"], WHEN("aim_problem", "Wilson disease")),
    S("aim_genetic", "Genetic Testing Documented", ["Documented", "Arranged", "Not documented"], WHEN("aim_problem", "Wilson disease")),
    S("aim_aat", "Alpha-1 Antitrypsin Level or Genotype Documented", ["Documented", "Not tested — documented"], WHEN("aim_problem", "Alpha-1 antitrypsin deficiency")),
    T("aim_plan", "Treatment, Monitoring and Follow-Up Documented"),
  ],
};

// ---- 11. Cirrhosis, portal hypertension and transplant -------------------
const CIRRHOSIS = {
  title: "Cirrhosis, Portal Hypertension & Transplant Consideration",
  fields: [
    S("cir_status", "Documented Cirrhosis Status", [
      "Compensated cirrhosis",
      "Decompensated cirrhosis",
      NONE,
    ]),
    M("cir_event", "Decompensation Event(s) Documented", [
      "Ascites",
      "Variceal bleeding",
      "Hepatic encephalopathy",
      "Jaundice",
      "Spontaneous bacterial peritonitis",
      "Hepatorenal syndrome or acute kidney injury",
      "None documented in this admission",
    ], WHEN("cir_status", "Decompensated cirrhosis")),
    S("cir_aetiology_control", "Aetiology Control", [
      "Achieved — documented",
      "On treatment — response documented",
      "Not achieved — documented",
      "Not documented",
    ], WHEN_IN("cir_status", ["Compensated cirrhosis", "Decompensated cirrhosis"])),
    S("cir_variceal_screen", "Variceal Screening Status", [
      "Screened — date documented",
      "Not screened — arranged",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("cir_status", ["Compensated cirrhosis", "Decompensated cirrhosis"])),
    S("cir_variceal_size", "Varices Found on Screening", [
      "None",
      "Small",
      "Medium",
      "Large",
      "Not documented",
    ], WHEN_IN("cir_variceal_screen", ["Screened — date documented", "Not screened — arranged"])),
    S("cir_prophylaxis", "Portal Hypertension Prophylaxis", [
      "Non-selective beta-blocker",
      "Carvedilol",
      "Endoscopic band ligation",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("cir_variceal_size", ["Small", "Medium", "Large"])),
    S("cir_ascites", "Ascites Status", ["None", "Mild", "Moderate", "Severe or refractory", "Not documented"], WHEN_IN("cir_status", ["Compensated cirrhosis", "Decompensated cirrhosis"])),
    S("cir_paracentesis", "Diagnostic Paracentesis (SAAG and neutrophils)", [
      "Performed — results documented",
      "Indicated — not yet performed",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("cir_ascites", ["Mild", "Moderate", "Severe or refractory"])),
    S("cir_diuretics", "Diuretic Regimen Documented", ["Documented", "Not indicated — documented", "Not documented"], WHEN_IN("cir_ascites", ["Mild", "Moderate", "Severe or refractory"])),
    S("cir_he_grade", "Hepatic Encephalopathy", [
      "Absent — documented",
      "Covert or grade I",
      "Grade II",
      "Grade III",
      "Grade IV",
      "Not documented",
    ], WHEN_IN("cir_status", ["Compensated cirrhosis", "Decompensated cirrhosis"])),
    S("cir_he_precipitant", "Encephalopathy Precipitant Identified", [
      "Identified — documented",
      "Not identified — documented",
      "Not applicable",
      "Not documented",
    ], WHEN_IN("cir_he_grade", ["Covert or grade I", "Grade II", "Grade III", "Grade IV"])),
    S("cir_he_treatment", "Encephalopathy Treatment", [
      "Lactulose documented",
      "Lactulose and rifaximin documented",
      "Not documented",
    ], WHEN_IN("cir_he_grade", ["Covert or grade I", "Grade II", "Grade III", "Grade IV"])),
    S("cir_hrs_aki", "Hepatorenal Syndrome and AKI", [
      "Assessed — documented",
      "Not applicable",
      "Not documented",
    ], WHEN_IN("cir_status", ["Decompensated cirrhosis"])),
    S("cir_hcc_surveillance", "HCC Surveillance Status", [
      "Up to date",
      "Overdue — arranged",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("cir_status", ["Compensated cirrhosis", "Decompensated cirrhosis"])),
    S("cir_hcc_interval", "HCC Surveillance Interval Documented", ["Six-monthly documented", "Other interval documented", "Not documented"], WHEN("cir_hcc_surveillance", "Up to date")),
    S("cir_hcc_finding", "HCC Finding / LI-RADS", [
      "No lesion — documented",
      "Lesion — LI-RADS category documented",
      "HCC diagnosed — staging documented",
      "Not documented",
    ], WHEN_IN("cir_hcc_surveillance", ["Up to date", "Overdue — arranged"])),
    S("cir_hcc_plan", "HCC Treatment Plan", [
      "MDT discussed",
      "Resection, ablation, TACE or systemic therapy documented",
      "Best supportive care — documented",
      "Not documented",
    ], WHEN_IN("cir_hcc_finding", ["HCC diagnosed — staging documented", "Lesion — LI-RADS category documented"])),
    S("cir_transplant", "Transplant Consideration", [
      "Referred",
      "Under assessment",
      "Not indicated — documented",
      "Not documented",
    ], WHEN_IN("cir_status", ["Compensated cirrhosis", "Decompensated cirrhosis"])),
    S("cir_transplant_criteria", "Transplant Criteria Documented", [
      "MELD or Child-Pugh recorded",
      "Contraindications assessed",
      "Social and nutritional assessment documented",
      "Not documented",
    ], WHEN_IN("cir_transplant", ["Referred", "Under assessment"])),
    M("cir_vaccination", "Vaccination Status Documented", [
      "Hepatitis A",
      "Hepatitis B",
      "Influenza",
      "Pneumococcal",
      "COVID-19",
      "None documented",
    ], WHEN_IN("cir_status", ["Compensated cirrhosis", "Decompensated cirrhosis"])),
    S("cir_nutrition", "Nutrition and Sarcopenia", [
      "Assessed — documented",
      "Dietitian referral documented",
      "Not documented",
    ], WHEN_IN("cir_status", ["Compensated cirrhosis", "Decompensated cirrhosis"])),
    M("cir_medication_safety", "Medication Safety Review", [
      "NSAIDs avoided — documented",
      "Benzodiazepines avoided — documented",
      "PPI indication reviewed",
      "Renal dosing reviewed",
      "None documented",
    ], WHEN_IN("cir_status", ["Compensated cirrhosis", "Decompensated cirrhosis"])),
    I("cir_followup", "Follow-Up Interval Documented", WHEN_IN("cir_status", ["Compensated cirrhosis", "Decompensated cirrhosis"])),
  ],
};

export const GASTRO_DISEASE_BLOCKS = {
  gi_upper_gi: UPPER_GI,
  gi_functional: FUNCTIONAL_GI,
  gi_coeliac: COELIAC,
  gi_colorectal: COLORECTAL_BLOCK,
  gi_pancreatic: PANCREATIC,
  gi_biliary: BILIARY,
  gi_infection: INFECTION,
  gi_viral_hepatitis: VIRAL_HEPATITIS,
  gi_masld: MASLD,
  gi_immune_metabolic: IMMUNE_METABOLIC,
  gi_cirrhosis: CIRRHOSIS,
};

export const GASTRO_DISEASE_BLOCK_KEYS = Object.keys(GASTRO_DISEASE_BLOCKS);