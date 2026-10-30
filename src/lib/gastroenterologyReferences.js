// Gastroenterology / Hepatology — guideline attribution registry.
//
// Every gastroenterology note records, in the note itself, which guideline its
// content and safety prompts were built from, with the edition and the
// population each applies to. Where two bodies differ, the divergence is stated
// rather than averaged into a single silent recommendation.
//
// A citation here is a documentation pointer, not a substituted protocol: the
// clinician's own institutional protocol and the patient in front of them decide
// management. Editions are recorded because a guideline's advice changes between
// them, and a note signed in 2026 must say which version it followed.

const WHO_ICD11 = {
  organization: "WHO",
  title: "International Classification of Diseases, 11th Revision — Mortality and Morbidity Statistics",
  edition: "ICD-11 MMS, release 2026-01",
  population: "All ages · all populations",
  url: "https://icd.who.int/browse/2026-01/mms/en",
  applies: "Diagnostic classification and coding",
};

const BAVENO = {
  organization: "Baveno VII Faculty (endorsed by AASLD and EASL)",
  title: "Baveno VII — Renewing consensus in portal hypertension",
  edition: "Baveno VII, Journal of Hepatology 2022",
  population: "Adults with cirrhosis and portal hypertension; not validated in children",
  url: "https://www.aasld.org/",
  applies: "Variceal screening, primary and secondary prophylaxis, ascites and decompensation",
};

const ROME = {
  organization: "Rome Foundation",
  title: "Rome IV diagnostic criteria for functional gastrointestinal disorders",
  edition: "Rome IV, 2016",
  population: "Adults (paediatric Rome IV criteria are separate)",
  url: "https://theromefoundation.org/",
  applies: "Functional and motility disorder classification",
};

export const GASTRO_REFERENCES = {
  acg_ugib: {
    organization: "ACG",
    title: "Clinical Guideline — Upper Gastrointestinal and Ulcer Bleeding",
    edition: "American Journal of Gastroenterology, 2021",
    population: "Adults presenting with acute upper GI bleeding; NOT children, and not variceal bleeding (see Baveno VII)",
    url: "https://gi.org/",
    applies: "Risk stratification, timing of endoscopy, transfusion, endoscopic haemostasis, PPI therapy and Helicobacter pylori management",
  },
  acg_h_pylori: {
    organization: "ACG",
    title: "Clinical Guideline — Treatment of Helicobacter pylori Infection",
    edition: "American Journal of Gastroenterology, 2024",
    population: "Adults and adolescents with H. pylori infection; paediatric regimens differ",
    url: "https://gi.org/",
    applies: "Test selection, eradication regimen, and confirmation of eradication after treatment",
  },
  acg_cdiff: {
    organization: "ACG / IDSA-SHEA",
    title: "Clinical Guidance — Clostridioides difficile Infection in Adults",
    edition: "American Journal of Gastroenterology, 2021 (IDSA-SHEA 2017 guidance where the two differ)",
    population: "Adults; paediatric and pregnancy considerations are addressed separately",
    url: "https://gi.org/",
    applies: "Diagnostic testing, severity assessment, first-line agents, recurrence and infection control",
  },
  tokyo_biliary: {
    organization: "Tokyo Guidelines (TG18)",
    title: "Tokyo Guidelines — Acute Cholangitis and Acute Cholecystitis",
    edition: "Journal of Hepato-Biliary-Pancreatic Sciences, 2018",
    population: "Adults with acute biliary infection",
    url: "https://www.jshbps.jp/",
    applies: "Severity grading, timing of biliary drainage, antibiotic therapy and cholecystectomy timing",
  },
  acg_ibd_uc: {
    organization: "ACG",
    title: "Clinical Guideline — Ulcerative Colitis in Adults",
    edition: "American Journal of Gastroenterology, 2019",
    population: "Adults with ulcerative colitis",
    url: "https://gi.org/",
    applies: "Activity assessment, extent documentation, treatment targets and monitoring",
  },
  acg_ibd_crohn: {
    organization: "ACG",
    title: "Clinical Guideline — Management of Crohn's Disease in Adults",
    edition: "American Journal of Gastroenterology, 2018",
    population: "Adults with Crohn disease",
    url: "https://gi.org/",
    applies: "Behaviour and extent, activity assessment, and biologic safety monitoring",
  },
  acg_ibs: {
    organization: "ACG",
    title: "Clinical Guideline — Management of Irritable Bowel Syndrome",
    edition: "American Journal of Gastroenterology, 2021",
    population: "Adults with IBS; a different AGA pathway applies to children",
    url: "https://gi.org/",
    applies: "Symptom-based diagnosis, limited testing, alarm-feature escalation",
  },
  acg_barretts: {
    organization: "ACG",
    title: "Clinical Guideline — Diagnosis and Management of Barrett's Oesophagus",
    edition: "American Journal of Gastroenterology, 2022",
    population: "Adults with columnar-lined oesophagus",
    url: "https://gi.org/",
    applies: "Seattle protocol sampling, dysplasia management and surveillance intervals",
  },
  acg_liver_chemistries: {
    organization: "ACG",
    title: "Clinical Guideline — Evaluation of Abnormal Liver Chemistries",
    edition: "American Journal of Gastroenterology, 2017",
    population: "Adults with abnormal liver biochemistry",
    url: "https://gi.org/",
    applies: "Structured aetiology work-up and repeat testing before labelling a chronic disease",
  },
  acg_acute_pancreatitis: {
    organization: "ACG",
    title: "Clinical Guideline — Diagnosis and Management of Acute Pancreatitis",
    edition: "American Journal of Gastroenterology, 2024",
    population: "Adults with acute pancreatitis",
    url: "https://gi.org/",
    applies: "Diagnostic criteria, early fluid therapy, severity assessment, feeding and aetiology work-up",
  },
  acg_chronic_pancreatitis: {
    organization: "ACG",
    title: "Clinical Guideline — Chronic Pancreatitis",
    edition: "American Journal of Gastroenterology, 2020",
    population: "Adults with chronic pancreatitis",
    url: "https://gi.org/",
    applies: "Aetiology, exocrine insufficiency, bone health and monitoring",
  },
  aga_coeliac: {
    organization: "AGA",
    title: "Clinical Practice Update — Diagnosis and Management of Coeliac Disease",
    edition: "Gastroenterology, 2023",
    population: "Adults and children with suspected coeliac disease",
    url: "https://gastro.org/",
    applies: "Serological testing on a gluten-containing diet, biopsy when indicated, and follow-up",
  },
  aga_ibd_preventive: {
    organization: "AGA",
    title: "Clinical Practice Update — Preventive Care in Inflammatory Bowel Disease",
    edition: "Gastroenterology, 2020",
    population: "Adults with IBD on immunomodulator or biologic therapy",
    url: "https://gastro.org/",
    applies: "Screening before immunosuppression, vaccination, bone health and dysplasia surveillance",
  },
  aasld_masld: {
    organization: "AASLD",
    title: "Practice Guidance — Evaluation and Management of Metabolic Dysfunction-Associated Steatotic Liver Disease",
    edition: "Hepatology, 2023",
    population: "Adults with hepatic steatosis",
    url: "https://www.aasld.org/",
    applies: "Non-invasive fibrosis assessment, risk stratification and referral thresholds",
  },
  aasld_hcc: {
    organization: "AASLD",
    title: "Practice Guidance — Prevention, Diagnosis and Treatment of Hepatocellular Carcinoma",
    edition: "Hepatology, 2023",
    population: "Adults with cirrhosis or chronic hepatitis B",
    url: "https://www.aasld.org/",
    applies: "Six-monthly surveillance and the recall pathway after a positive test",
  },
  aasld_ascites: {
    organization: "AASLD",
    title: "Practice Guidance — Ascites, Spontaneous Bacterial Peritonitis and Hepatorenal Syndrome",
    edition: "Hepatology, 2021",
    population: "Adults with cirrhosis and ascites",
    url: "https://www.aasld.org/",
    applies: "Diagnostic paracentesis, SBP diagnosis and prophylaxis, and diuretic management",
  },
  aasld_hepatitis_b: {
    organization: "AASLD",
    title: "Practice Guidance — Chronic Hepatitis B",
    edition: "Hepatology, 2024 update",
    population: "Adults with chronic hepatitis B; pregnancy and children follow separate pathways",
    url: "https://www.aasld.org/",
    applies: "Treatment thresholds, monitoring and prophylaxis before immunosuppression",
  },
  easl_cirrhosis: {
    organization: "EASL",
    title: "Clinical Practice Guidelines — Decompensated Cirrhosis",
    edition: "Journal of Hepatology, 2018",
    population: "Adults with decompensated cirrhosis",
    url: "https://easl.eu/",
    applies: "Decompensation events, transplant referral and infection prevention",
  },
  easl_dili: {
    organization: "EASL",
    title: "Clinical Practice Guidelines — Drug-Induced Liver Injury",
    edition: "Journal of Hepatology, 2019",
    population: "Adults and children with suspected drug-induced liver injury",
    url: "https://easl.eu/",
    applies: "Causality assessment, implicated-agent withdrawal and monitoring",
  },
  esge_ercp: {
    organization: "ESGE",
    title: "Guideline — Endoscopic Retrograde Cholangiopancreatography-related adverse events",
    edition: "Endoscopy, 2020",
    population: "Adults undergoing ERCP",
    url: "https://www.esge.com/",
    applies: "Post-ERCP pancreatitis prophylaxis, perforation and bleeding recognition",
  },
  usmstf_surveillance: {
    organization: "USMSTF (with ESGE 2020 guidance)",
    title: "Update on Colorectal Cancer Screening and Post-Polypectomy Surveillance",
    edition: "Gastroenterology 2020; ESGE Endoscopy 2020",
    population: "Adults after colonoscopy; the two documents differ on some intervals, so the note records which one was applied",
    url: "https://gi.org/",
    applies: "Surveillance intervals after adenoma or serrated polyp removal",
  },
  asge_quality: {
    organization: "ASGE / ESGE",
    title: "Quality indicators for gastrointestinal endoscopy",
    edition: "ASGE standards 2015 (updated indicators to 2023); ESGE quality framework 2020",
    population: "Adults undergoing diagnostic and therapeutic endoscopy",
    url: "https://www.asge.org/",
    applies: "Cecal intubation, withdrawal time, preparation quality and adenoma detection documentation",
  },
};

export const BAVENO_REFERENCE = BAVENO;
export const ROME_REFERENCE = ROME;
export const WHO_ICD11_REFERENCE = WHO_ICD11;

// Per note type: the guidelines its content and prompts were built from, and the
// one thing that note documents in their terms.
export const GASTRO_NOTE_BASIS = {
  gi_consultation: {
    note: "Gastroenterology Consultation",
    basis: [
      GASTRO_REFERENCES.acg_liver_chemistries,
      GASTRO_REFERENCES.acg_ibs,
      GASTRO_REFERENCES.acg_barretts,
      GASTRO_REFERENCES.aga_coeliac,
      ROME,
      WHO_ICD11,
    ],
    states: "Symptom pattern and alarm features, aetiology work-up where liver biochemistry is abnormal, and a coded diagnosis whose confirmation state is explicit.",
  },
  gi_followup: {
    note: "GI Follow-Up",
    basis: [GASTRO_REFERENCES.acg_ibd_uc, GASTRO_REFERENCES.acg_ibd_crohn, GASTRO_REFERENCES.aasld_masld, BAVENO, WHO_ICD11],
    states: "Interval course, measured disease activity, treatment tolerance and the monitoring the guideline requires at this visit.",
  },
  gi_admission_note: {
    note: "GI Admission Note",
    basis: [GASTRO_REFERENCES.acg_ugib, GASTRO_REFERENCES.acg_acute_pancreatitis, BAVENO, GASTRO_REFERENCES.aasld_ascites, WHO_ICD11],
    states: "Severity at presentation — bleeding risk score, pancreatitis severity or decompensation stage — and the immediate actions it triggers.",
  },
  gi_progress_note: {
    note: "GI Progress Note",
    basis: [BAVENO, GASTRO_REFERENCES.aasld_ascites, GASTRO_REFERENCES.acg_acute_pancreatitis, WHO_ICD11],
    states: "Daily trajectory of the decompensation or bleed, current grade of encephalopathy, and the response to treatment delivered.",
  },
  gi_endoscopy_report: {
    note: "Endoscopy Report",
    basis: [GASTRO_REFERENCES.acg_ugib, GASTRO_REFERENCES.acg_barretts, GASTRO_REFERENCES.asge_quality, GASTRO_REFERENCES.aga_coeliac, WHO_ICD11],
    states: "Findings by segment, Forrest class for a bleeding lesion, Barrett Prague class and Seattle-protocol sampling, H. pylori sampling, and the quality indicators of the examination.",
  },
  gi_colonoscopy_report: {
    note: "Colonoscopy Report",
    basis: [GASTRO_REFERENCES.usmstf_surveillance, GASTRO_REFERENCES.asge_quality, GASTRO_REFERENCES.acg_ibd_uc, WHO_ICD11],
    states: "Preparation quality, cecal intubation and withdrawal time, each polyp with size and morphology, and the surveillance interval that follows.",
  },
  gi_ercp_report: {
    note: "ERCP Procedure Report",
    basis: [GASTRO_REFERENCES.esge_ercp, GASTRO_REFERENCES.asge_quality, WHO_ICD11],
    states: "Cannulation and sphincterotomy detail, stent specification, post-ERCP pancreatitis prophylaxis, and the recognition plan for perforation or bleeding.",
  },
  gi_procedure_note: {
    note: "GI Procedure Note",
    basis: [GASTRO_REFERENCES.asge_quality, GASTRO_REFERENCES.esge_ercp, WHO_ICD11],
    states: "Consent and time-out, sedation, specimens, complications and the disposition of the patient.",
  },
  gi_pathology_request: {
    note: "Biopsy / Pathology Request (GI)",
    basis: [GASTRO_REFERENCES.acg_barretts, GASTRO_REFERENCES.aga_coeliac, GASTRO_REFERENCES.asge_quality, WHO_ICD11],
    states: "Each specimen with its site and container, the clinical question the pathologist must answer, and the coded suspicion it relates to.",
  },
  gi_discharge_summary: {
    note: "Discharge Summary (GI)",
    basis: [
      GASTRO_REFERENCES.aasld_ascites,
      GASTRO_REFERENCES.aasld_hcc,
      GASTRO_REFERENCES.aasld_hepatitis_b,
      GASTRO_REFERENCES.acg_ibd_crohn,
      GASTRO_REFERENCES.aga_ibd_preventive,
      GASTRO_REFERENCES.usmstf_surveillance,
      WHO_ICD11,
    ],
    states: "The discharge bundle each guideline requires: prophylaxis, surveillance dates, biologic safety monitoring, and the follow-up actually arranged.",
  },
};

export const gastroNoteBasis = (noteKey) => GASTRO_NOTE_BASIS[noteKey] || null;

// Short labels recorded on the template itself (note header / PDF export).
export const gastroGuidelineBasis = (noteKey) => {
  const entry = GASTRO_NOTE_BASIS[noteKey];
  if (!entry) return ["ACG", "AGA", "AASLD", "EASL", "WHO ICD-11 MMS"];
  const orgs = entry.basis.map((b) => b.organization);
  return Array.from(new Set([...orgs, "WHO ICD-11 MMS"]));
};

export const GASTRO_REFERENCE_COUNT = Object.keys(GASTRO_REFERENCES).length;