// Guideline basis for the General Surgery note types.
//
// Every entry below was retrieved from the organization's own official website
// (or its official journal record) on the review date recorded here — nothing
// in this file is a citation from memory. Each reference records what it
// supports and how strongly it binds the documentation:
//
//   documentation_standard — the mandatory documentation elements AMedix
//     expects for that note to stand as a complete record. These describe
//     what must be documented, never what the clinical decision must be.
//   clinical_recommendation — society guidance: recommended practice, not a
//     mandate, and always subject to the treating clinician's judgement.
//   classification_standard — coding / classification only. ICD-11 codes
//     diagnoses; it is never used as procedural or treatment guidance.
//
// Items that could not be verified, are paywalled, conflict between societies,
// or depend on local policy are listed in SURGERY_REFERENCE_FLAGS and are
// surfaced in the UI rather than quietly omitted.

export const SURGERY_REFERENCES_REVIEWED = "2026-10-27";

export const REFERENCE_LEVEL_LABELS = {
  documentation_standard: "Documentation standard",
  clinical_recommendation: "Clinical recommendation",
  classification_standard: "Classification / coding",
};

export const SURGERY_REFERENCES = [
  {
    id: "who_sssl",
    organization: "World Health Organization",
    title: "WHO Surgical Safety Checklist and Implementation Manual",
    version: "2009",
    url: "https://www.who.int/teams/integrated-health-services/patient-safety/research/safe-surgery/tool-and-resources",
    level: "documentation_standard",
    supports:
      "Operative Note and Procedure Note — sign-in, time-out and sign-out confirmation, site marking, team briefing; Consent Documentation.",
  },
  {
    id: "who_safe_surgery",
    organization: "World Health Organization",
    title: "WHO Guidelines for Safe Surgery 2009: Safe Surgery Saves Lives",
    version: "2009",
    url: "https://www.who.int/publications/i/item/9789241598552",
    level: "documentation_standard",
    supports:
      "Surgical Consultation and Pre-Operative Assessment — documented indication, site/side, team and equipment checks before incision.",
  },
  {
    id: "who_ssi",
    organization: "World Health Organization",
    title: "Global Guidelines for the Prevention of Surgical Site Infection (2nd edition)",
    version: "2018",
    url: "https://www.who.int/publications/i/item/9789241550475",
    level: "clinical_recommendation",
    supports:
      "Pre-Operative Assessment (prophylaxis timing, decolonisation, hair removal), Post-Operative Note and Daily Progress (wound inspection, dressing), Surgical Infection note (wound complication assessment).",
  },
  {
    id: "acs_statements",
    organization: "American College of Surgeons",
    title:
      "ACS Statements on Principles — including Principles Underlying Surgeon Responsibility Toward the Patient",
    version: "Statement dated 9 June 2026",
    url: "https://www.facs.org/about-acs/statements/statement-of-principles-underlying-surgeon-responsibility-toward-the-patient/",
    level: "documentation_standard",
    supports:
      "Consent Documentation (informed consent, alternatives, risks, patient questions), Surgical Consultation, Discharge Summary and Surgical Follow-Up (communication, continuity of care, postoperative responsibility).",
  },
  {
    id: "acs_atls",
    organization: "American College of Surgeons",
    title: "Advanced Trauma Life Support (ATLS) Student Course Manual, 10th edition",
    version: "2018",
    url: "https://www.facs.org/quality-programs/trauma/education/advanced-trauma-life-support/",
    level: "clinical_recommendation",
    supports:
      "Trauma & Emergency Surgery Assessment — ABCDE primary survey, circulation status, damage-control decision documentation.",
  },
  {
    id: "eras",
    organization: "ERAS Society",
    title: "ERAS Society Guidelines (colorectal, emergency laparotomy, HPB, upper GI, trauma collections)",
    version: "Rolling guideline collection — accessed 27 October 2026",
    url: "https://erassociety.org/guidelines/",
    level: "clinical_recommendation",
    supports:
      "Pre-Operative Assessment, Operative Note (drains, nasogastric tubes, goal-directed fluids), Post-Operative Note, Daily Progress and Discharge Summary — recording ERAS omissions and reasons.",
  },
  {
    id: "sages_index",
    organization: "Society of American Gastrointestinal and Endoscopic Surgeons",
    title: "SAGES Clinical / Practice / Training Guidelines, Statements and Standards of Practice",
    version: "Rolling guideline collection — accessed 27 October 2026",
    url: "https://www.sages.org/publications/guidelines/",
    level: "clinical_recommendation",
    supports:
      "Operative Note and Procedure Note (minimally invasive access, pneumoperitoneum, conversion), Upper GI and Endoscopy notes.",
  },
  {
    id: "sages_safe_chole",
    organization: "SAGES (multi-society consensus)",
    title:
      "Safe Cholecystectomy Multi-Society Practice Guideline and State of the Art Consensus Conference on Prevention of Bile Duct Injury during Cholecystectomy",
    version: "May 2020",
    url: "https://www.sages.org/publications/guidelines/safe-cholecystectomy-multi-society-practice-guideline/",
    level: "clinical_recommendation",
    supports:
      "Gallbladder & Biliary Assessment and Operative Note — critical view of safety, time-out before division, bail-out options, conversion reasoning.",
  },
  {
    id: "sages_cbd",
    organization: "SAGES",
    title: "Guidelines for the Use of Intraoperative Imaging of the Common Bile Duct",
    version: "September 2025",
    url: "https://www.sages.org/publications/guidelines/guidelines-for-the-use-of-intraoperative-imaging-of-the-cbd/",
    level: "clinical_recommendation",
    supports:
      "Biliary and HPB assessment, Operative Note — intraoperative cholangiography / duct imaging and the reason it was used or omitted.",
  },
  {
    id: "sages_ventral_hernia",
    organization: "SAGES",
    title: "Guidelines for Laparoscopic Ventral Hernia Repair",
    version: "June 2016",
    url: "https://www.sages.org/publications/guidelines/guidelines-for-laparoscopic-ventral-hernia-repair/",
    level: "clinical_recommendation",
    supports:
      "Hernia & Abdominal Wall Assessment and Implant / Device Record — defect size and location, mesh type, fixation method, contamination status.",
  },
  {
    id: "eaes_sages_diverticulitis",
    organization: "EAES / SAGES",
    title:
      "EAES-SAGES Clinical Practice Guideline Update: Multi-Society Recommendations on Key Controversies in the Management of Diverticular Disease",
    version: "October 2026",
    url: "https://www.sages.org/publications/guidelines/eaes-sages-multi-society-recommendations-on-the-management-of-diverticular-disease/",
    level: "clinical_recommendation",
    supports:
      "Colorectal & Anorectal Assessment — severity classification, indication and timing of intervention, antibiotic strategy as documented by the clinician.",
  },
  {
    id: "wses_jerusalem_appendix",
    organization: "World Society of Emergency Surgery",
    title: "Diagnosis and treatment of acute appendicitis: 2020 update of the WSES Jerusalem guidelines",
    version: "2020",
    url: "https://doi.org/10.1186/s13017-020-00306-3",
    level: "clinical_recommendation",
    supports:
      "Appendicitis Assessment — diagnostic pathway, imaging choice, antibiotic-first versus operative discussion, diagnostic confidence documentation.",
  },
  {
    id: "wses_asbo",
    organization: "World Society of Emergency Surgery",
    title:
      "Bologna guidelines for diagnosis and management of adhesive small bowel obstruction (ASBO): 2017 update",
    version: "2018 (2017 update)",
    url: "https://pubmed.ncbi.nlm.nih.gov/29946347/",
    level: "clinical_recommendation",
    supports:
      "Bowel Obstruction Assessment — CT-based diagnosis, water-soluble contrast study, time-limited non-operative trial, indications for surgery.",
  },
  {
    id: "wses_guidelines",
    organization: "World Society of Emergency Surgery",
    title:
      "WSES Guidelines — including emergency repair of complicated abdominal wall hernias and intra-abdominal infections",
    version: "Rolling guideline collection — accessed 27 October 2026",
    url: "https://www.wses.org.uk/scientific-resources/guidelines",
    level: "clinical_recommendation",
    supports:
      "Acute Abdomen / Emergency General Surgery, Hernia (emergency presentation), Surgical Infection — source control, severity assessment, escalation and transfer criteria.",
  },
  {
    id: "tg18_cholecystitis",
    organization: "Japanese Society of Hepato-Biliary-Pancreatic Surgery (Tokyo Guidelines)",
    title: "Tokyo Guidelines 2018: diagnostic criteria and severity grading of acute cholecystitis",
    version: "2018",
    url: "https://pubmed.ncbi.nlm.nih.gov/29032636/",
    level: "clinical_recommendation",
    supports:
      "Gallbladder & Biliary Assessment — diagnostic criteria, Grade I–III severity grading, timing of surgery and drainage discussion.",
  },
  {
    id: "ascrs",
    organization: "American Society of Colon and Rectal Surgeons",
    title: "ASCRS Clinical Practice Guidelines (including Management of Colon Cancer, 2022)",
    version: "Rolling guideline collection — accessed 27 October 2026",
    url: "https://www.ascrsu.com/ascrs/index/ASCRS-Evidence-Based-Guidelines-and-Expert-Consensus/Clinical_Practice_Guidelines",
    level: "clinical_recommendation",
    supports:
      "Colorectal & Anorectal Assessment, Operative Note (anastomosis, stoma, rectal washout), Surgical Follow-Up, Pathology Request.",
  },
  {
    id: "asge",
    organization: "American Society for Gastrointestinal Endoscopy",
    title:
      "ASGE Guidelines — including the guideline on informed consent for GI endoscopic procedures (2022)",
    version: "Rolling guideline collection — accessed 27 October 2026",
    url: "https://www.asge.org/home/resources/guidelines",
    level: "clinical_recommendation",
    supports:
      "Endoscopy / Endoscopic Procedure Record — consent, sedation, completion or abandonment with reason, adverse events, post-procedure instructions.",
  },
  {
    id: "ata_thyroid",
    organization: "American Thyroid Association",
    title:
      "2015 ATA Management Guidelines for Adult Patients with Thyroid Nodules and Differentiated Thyroid Cancer",
    version: "2015",
    url: "https://www.thyroid.org/professionals/ata-professional-guidelines/",
    level: "clinical_recommendation",
    supports:
      "Thyroid & Parathyroid Assessment — ultrasound risk features, cytology result, extent of surgery, recurrent laryngeal nerve and calcium documentation.",
  },
  {
    id: "icd11",
    organization: "World Health Organization",
    title: "International Classification of Diseases 11th Revision (ICD-11 MMS)",
    version: "Current release — accessed 27 October 2026",
    url: "https://icd.who.int/browse/latest-release/mms/en",
    level: "classification_standard",
    supports:
      "Diagnosis coding across all note types. ICD-11 classifies diagnoses only; it is not used as procedural guidance, a treatment protocol or a substitute for clinical practice guidelines.",
  },
];

const REF_BY_ID = Object.fromEntries(SURGERY_REFERENCES.map((r) => [r.id, r]));

// Which references underpin each note type, and the fields they support.
const DOC_REFERENCES = {
  surg_consultation: {
    refs: ["acs_statements", "who_safe_surgery", "icd11"],
    fields:
      "Indication, treatment options and risks discussed, patient decision, recommendation and safety-netting; working diagnosis coding.",
  },
  surg_preop_assessment: {
    refs: ["who_ssi", "eras", "who_sssl", "acs_statements"],
    fields:
      "Prophylaxis timing, decolonisation, VTE and nutrition optimisation, ERAS omissions, consent status, planned approach and site marking.",
  },
  surg_operative_note: {
    refs: ["who_sssl", "sages_index", "sages_safe_chole", "sages_ventral_hernia", "eras"],
    fields:
      "Sign-in / time-out / sign-out, anaesthesia and ASA documentation, access and pneumoperitoneum, critical view of safety, implants, drains and swab counts.",
  },
  surg_procedure_note: {
    refs: ["who_sssl", "sages_index", "asge"],
    fields: "Consent confirmation, procedure performed, devices used, specimens, complications and aftercare.",
  },
  surg_postop_note: {
    refs: ["eras", "who_ssi", "sages_index"],
    fields: "Postoperative orders, ERAS deviations with reasons, wound and drain assessment, complication grading.",
  },
  surg_daily_progress: {
    refs: ["eras", "who_ssi"],
    fields: "Serial examination, wound and drain status, nutrition and mobilisation progress, plan change.",
  },
  surg_discharge_summary: {
    refs: ["acs_statements", "eras", "who_ssi"],
    fields: "Procedure and diagnosis summary, medication changes, wound care, follow-up and safety-netting.",
  },
  surg_followup: {
    refs: ["acs_statements", "ascrs", "icd11"],
    fields: "Wound and recovery review, pathology discussion, surveillance plan, documented decision.",
  },
  surg_pathology: {
    refs: ["ascrs", "ata_thyroid", "icd11"],
    fields: "Specimen orientation, site and laterality, clinical question, tumour staging fields.",
  },
  surg_referral: {
    refs: ["acs_statements", "icd11"],
    fields: "Reason for referral, documented findings and investigations, specific clinical question.",
  },
  surg_consent_documentation: {
    refs: ["acs_statements", "who_sssl", "asge"],
    fields: "Procedure and alternatives, material risks, questions answered, capacity and interpretation, consent or refusal.",
  },
  surg_implant_device: {
    refs: ["sages_ventral_hernia", "who_sssl", "acs_statements"],
    fields: "Device or mesh identification, lot/serial traceability, site, indication and patient information.",
  },
  surg_acute_abdomen: {
    refs: ["wses_guidelines", "eras", "who_sssl"],
    fields: "Haemodynamic and peritonism assessment, resuscitation, source-control plan, senior discussion and escalation.",
  },
  surg_appendicitis: {
    refs: ["wses_jerusalem_appendix", "wses_guidelines"],
    fields: "Diagnostic confidence, imaging, severity, antibiotic-first versus operative discussion and the documented decision.",
  },
  surg_bowel_obstruction: {
    refs: ["wses_asbo", "wses_guidelines"],
    fields: "CT findings, water-soluble contrast, duration and safety of non-operative trial, strangulation risk and operative indication.",
  },
  surg_hernia: {
    refs: ["sages_ventral_hernia", "wses_guidelines"],
    fields: "Defect size and location, reducibility and incarceration, contamination status, repair and mesh strategy.",
  },
  surg_biliary: {
    refs: ["tg18_cholecystitis", "sages_safe_chole", "sages_cbd"],
    fields: "Tokyo grade, critical view of safety, intraoperative duct imaging, bail-out and conversion reasoning.",
  },
  surg_hpb: {
    refs: ["sages_cbd", "sages_index", "eras"],
    fields: "Lesion assessment, MDT discussion, resectability documentation, drain and pancreatic enzyme discussion.",
  },
  surg_colorectal: {
    refs: ["ascrs", "eaes_sages_diverticulitis"],
    fields: "Severity classification, endoscopy and imaging findings, operative strategy, stoma and anastomosis decisions.",
  },
  surg_breast: {
    refs: ["acs_statements", "icd11"],
    fields:
      "Triple assessment documentation, clinical stage, specimen orientation and the documented surgical plan. Margin thresholds are deliberately not prescribed in the template.",
  },
  surg_thyroid: {
    refs: ["ata_thyroid"],
    fields: "Ultrasound risk features, cytology category, extent of thyroidectomy, nerve monitoring and calcium plan.",
  },
  surg_upper_gi: {
    refs: ["sages_index", "asge"],
    fields: "Alarm features, endoscopy findings, H. pylori status, acid-suppression trial and surgical referral.",
  },
  surg_infection: {
    refs: ["wses_guidelines", "who_ssi"],
    fields: "Severity and sepsis assessment, source control, antimicrobial documentation, wound classification and follow-up.",
  },
  surg_trauma: {
    refs: ["acs_atls", "eras"],
    fields: "ABCDE primary survey, circulation and resuscitation response, imaging decisions, damage-control or transfer reasoning.",
  },
  surg_endoscopy: {
    refs: ["asge", "sages_index"],
    fields: "Consent and sedation, extent of examination, completion or abandonment with reason, findings, therapy and aftercare.",
  },
};

// Items that are flagged for review rather than presented as verified.
export const SURGERY_REFERENCE_FLAGS = [
  "Full guideline texts for SAGES, ASGE and ASCRS are behind publisher or society logins. Official index pages, titles, publication dates and abstracts were verified; individual recommendation statements were not re-read in full during this review.",
  "The WSES guideline page lists documents without individual publication dates. The ASBO 2017 update and the appendicitis 2020 update were dated from their PubMed records.",
  "The Bethesda thyroid cytopathology categories and the ASA physical status classes appear as documentation shorthand. Their primary source documents were not retrieved in this review.",
  "Clavien–Dindo complication grades are recorded as a classification only; the original validation publication was not retrieved in this review.",
  "Breast oncoplastic and margin recommendations (ASBrS / SSO-ASTRO) were not verified in this review. The breast template therefore records the surgeon's documented plan and does not prescribe a margin threshold.",
  "Societies disagree on antibiotic-first management of uncomplicated appendicitis and diverticulitis. AMedix records the clinician's documented decision and never selects a strategy.",
  "Local policy determines: antibiotic choice and prophylaxis duration, VTE agent and duration, the ERAS component set, contrast policy, trauma transfer criteria, consent law and form, and implant traceability requirements. These are institution-specific and must be set locally.",
  "ICD-11 is used for diagnosis coding only. It is not procedural guidance and does not replace clinical practice guidelines.",
];

export function getSurgeryReferenceSet(documentKey) {
  const entry = DOC_REFERENCES[documentKey];
  if (!entry) return null;
  return {
    documentKey,
    reviewed: SURGERY_REFERENCES_REVIEWED,
    fields: entry.fields,
    references: entry.refs.map((id) => REF_BY_ID[id]).filter(Boolean),
    flags: SURGERY_REFERENCE_FLAGS,
  };
}

export const SURGERY_DOC_REFERENCE_KEYS = Object.keys(DOC_REFERENCES);