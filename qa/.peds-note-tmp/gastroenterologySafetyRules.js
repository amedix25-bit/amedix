// Gastroenterology / Hepatology advisory safety prompts.
//
// Each prompt fires only from documentation that is missing or inconsistent in
// the note itself, names the guideline it comes from, and states the action a
// clinician can take. They are decision support: nothing here blocks saving a
// note, withholds treatment, changes a diagnosis or orders anything. The
// clinician decides and documents — including a decision not to follow a prompt.
//
// The wording never assumes: a blank field is read as "not documented", which is
// what it is, and is never read as "normal".

import { gastroFlags } from "./gastroenterologyModules.js";
import { GASTRO_REFERENCES, BAVENO_REFERENCE, ROME_REFERENCE } from "./gastroenterologyReferences.js";

const rule = (key, level, title, basis, action, provenance, source) => ({
  key,
  level,
  title,
  basis,
  action,
  provenance,
  source: source || null,
});

export const GASTRO_SAFETY_RULES = [
  // ---- Escalation --------------------------------------------------------
  rule(
    "alarm_features_not_escalated",
    "same_day",
    "Alarm features documented without a documented escalation",
    "Progressive dysphagia, unintentional weight loss, iron deficiency anaemia or a significant family history in a patient with new GI symptoms change the pathway — ACG and AGA guidance both require expedited investigation, and the record has to show that decision.",
    "Record the urgency chosen, who was informed and what was arranged — including the reason investigation is not being expedited.",
    "acg",
    GASTRO_REFERENCES.acg_barretts
  ),
  rule(
    "bleeding_without_endoscopy_timing",
    "same_day",
    "Overt GI bleeding without documented endoscopy timing",
    "Guideline-based management of acute upper GI bleeding depends on resuscitation followed by endoscopy within 24 hours, and sooner where high-risk features are present. A bleeding presentation with no recorded timing leaves the next shift without a plan.",
    "Document the planned endoscopy timing and the resuscitation it depends on, or the documented reason for deferral.",
    "acg",
    GASTRO_REFERENCES.acg_ugib
  ),
  rule(
    "variceal_bleeding_without_bundle",
    "same_day",
    "Variceal bleeding without the documented vasoactive and antibiotic bundle",
    "In cirrhotic variceal bleeding, a vasoactive agent and antibiotic prophylaxis are started at presentation — they reduce rebleeding and mortality, and the record must show both were given or why not.",
    "Document the vasoactive agent and antibiotic prophylaxis given, with times, or the documented contraindication and what was done instead.",
    "baveno",
    BAVENO_REFERENCE
  ),
  rule(
    "antithrombotic_without_plan",
    "same_day",
    "Antithrombotic therapy in a bleeding patient without a reversal or restart plan",
    "A GI bleed in a patient on antiplatelet or anticoagulant therapy needs an explicit decision on holding, reversing and restarting — a decision left unrecorded is repeated or contradicted by the next clinician.",
    "Record whether therapy was held or reversed, what was given, and the documented restart plan with the reasoning.",
    "acg",
    GASTRO_REFERENCES.acg_ugib
  ),
  rule(
    "ulcer_without_forrest",
    "documented",
    "Bleeding peptic ulcer without a recorded Forrest class",
    "The Forrest classification determines whether endoscopic therapy is required and how the patient is monitored afterwards. A bleeding ulcer documented without its class cannot be audited against the guideline that decided treatment.",
    "Record the Forrest class seen, or state that the lesion was not actively bleeding and describe its appearance.",
    "acg",
    GASTRO_REFERENCES.acg_ugib
  ),
  rule(
    "hp_not_assessed_in_ulcer",
    "documented",
    "Peptic ulcer documented without Helicobacter pylori assessment",
    "Every peptic ulcer carries an indication to test for H. pylori, and eradication confirmed afterwards. The record should show the test taken (or the reason it was not) so treatment is not left incomplete.",
    "Record the H. pylori test performed (rapid urease, histology, stool antigen or breath test), or the reason it has not been done and when it will be.",
    "acg",
    GASTRO_REFERENCES.acg_ugib
  ),

  // ---- Inflammatory bowel disease ---------------------------------------
  rule(
    "ibd_screening_missing",
    "same_day",
    "Immunosuppressive IBD therapy without documented pre-treatment screening",
    "Before starting a biologic or immunomodulator, tuberculosis and hepatitis B screening are required, with the other pre-treatment checks. Starting therapy without them is a preventable safety event.",
    "Record the screening performed — tuberculosis, hepatitis B, HIV and hepatitis C, varicella immunity and vaccination review — before the next dose.",
    "aga",
    GASTRO_REFERENCES.aga_ibd_preventive
  ),
  rule(
    "acute_severe_colitis_without_rescue",
    "same_day",
    "Acute severe colitis without documented rescue planning",
    "Acute severe colitis is a medical emergency: intravenous corticosteroid, close monitoring and, where there is no response, rescue therapy or surgical assessment within the guideline timeframe.",
    "Document rescue therapy or surgical opinion and the review timeline, including any decision to continue medical therapy with the reasons.",
    "acg",
    GASTRO_REFERENCES.acg_ibd_uc
  ),
  rule(
    "ibd_flare_without_cdiff_testing",
    "documented",
    "IBD flare without documented Clostridioides difficile testing",
    "A flare in IBD and C. difficile infection look alike, and treating one as the other delays effective treatment. The test result or the reason it was not done belongs in the note.",
    "Record the C. difficile test result, or why it was not indicated at this presentation.",
    "acg",
    GASTRO_REFERENCES.acg_ibd_crohn
  ),
  rule(
    "ibd_surveillance_not_documented",
    "documented",
    "Long-standing IBD without documented dysplasia surveillance status",
    "Guideline-based IBD care includes surveillance colonoscopy with chromoscopy at the recommended interval. An unrecorded status is read by the next clinician as 'not done'.",
    "Record whether surveillance is due, was performed at this examination, or is arranged — with the interval applied.",
    "aga",
    GASTRO_REFERENCES.aga_ibd_preventive
  ),

  // ---- Liver -------------------------------------------------------------
  rule(
    "cirrhosis_without_hcc_surveillance",
    "same_day",
    "Cirrhosis without documented HCC surveillance",
    "Six-monthly surveillance with ultrasound, with or without alpha-fetoprotein, is recommended for adults with cirrhosis. A patient with cirrhosis and no recorded surveillance plan is outside the guideline pathway.",
    "Record the next surveillance examination and date, or the documented reason surveillance does not apply.",
    "aasld",
    GASTRO_REFERENCES.aasld_hcc
  ),
  rule(
    "cirrhosis_without_variceal_screening",
    "same_day",
    "Cirrhosis without documented variceal screening status",
    "Baveno VII defines how varices are screened — endoscopy, or non-invasive criteria where liver stiffness and platelets allow — and when prophylaxis starts. The status has to be recorded either way.",
    "Record the screening performed or the non-invasive criteria met, and the prophylaxis decision that follows.",
    "baveno",
    BAVENO_REFERENCE
  ),
  rule(
    "ascites_without_paracentesis",
    "same_day",
    "Ascites without diagnostic paracentesis",
    "New or worsening ascites requires diagnostic paracentesis with an ascitic neutrophil count, because spontaneous bacterial peritonitis can present without fever or pain.",
    "Record the paracentesis performed with the neutrophil count, or the reason it was not done and when it will be.",
    "aasld",
    GASTRO_REFERENCES.aasld_ascites
  ),
  rule(
    "sbp_without_prophylaxis",
    "documented",
    "Spontaneous bacterial peritonitis without documented secondary prophylaxis",
    "After an episode of SBP, secondary antibiotic prophylaxis is indicated to prevent recurrence.",
    "Record the prophylactic agent and duration, or the documented reason it is not indicated.",
    "aasld",
    GASTRO_REFERENCES.aasld_ascites
  ),
  rule(
    "severe_encephalopathy_without_level_of_care",
    "same_day",
    "Grade III–IV hepatic encephalopathy without documented level of care",
    "Severe encephalopathy threatens the airway and is managed in a high-dependency setting with a documented precipitant search.",
    "Record the level of care, airway consideration, precipitant being treated and who was informed.",
    "easl",
    GASTRO_REFERENCES.easl_cirrhosis
  ),
  rule(
    "liver_disease_without_fibrosis_assessment",
    "documented",
    "Chronic liver disease without a documented non-invasive fibrosis assessment",
    "The stage of fibrosis determines surveillance, treatment thresholds and referral. FIB-4 or elastography is the documented first step in AASLD guidance.",
    "Record the fibrosis assessment performed with its value, or the reason it has not been done.",
    "aasld",
    GASTRO_REFERENCES.aasld_masld
  ),
  rule(
    "alcohol_liver_disease_without_assessment",
    "documented",
    "Alcohol-associated liver disease without a documented alcohol assessment",
    "Management of alcohol-associated liver disease includes a recorded assessment of alcohol use and the offer of treatment for alcohol use disorder — it changes outcomes independently of liver-directed therapy.",
    "Record the assessment performed, the referral made, or the patient's documented decision.",
    "aasld",
    GASTRO_REFERENCES.aasld_ascites
  ),
  rule(
    "liver_injury_without_causality",
    "documented",
    "Suspected drug-induced liver injury without documented causality assessment",
    "Drug-induced liver injury is a diagnosis of exclusion: the implicated agent, the temporal relationship, the alternatives excluded and the monitoring plan all belong in the note.",
    "Record the implicated agent, the alternative causes excluded and the follow-up monitoring arranged.",
    "easl",
    GASTRO_REFERENCES.easl_dili
  ),

  // ---- Pancreatitis ------------------------------------------------------
  rule(
    "pancreatitis_diagnostic_criteria_incomplete",
    "same_day",
    "Acute pancreatitis documented with fewer than two diagnostic criteria",
    "Two of three criteria — characteristic pain, lipase or amylase above three times the upper limit of normal, and imaging — are required. One criterion alone is not the diagnosis, and the record should show which were met.",
    "Record the criteria that were met, and the investigation still outstanding.",
    "acg",
    GASTRO_REFERENCES.acg_acute_pancreatitis
  ),
  rule(
    "pancreatitis_aetiology_not_worked_up",
    "documented",
    "Acute pancreatitis without a documented aetiology work-up",
    "Identifying the cause changes management: gallstones need ultrasound and a cholecystectomy plan, hypertriglyceridaemia needs treatment, and drugs need withdrawal.",
    "Record the work-up performed — ultrasound, triglycerides, calcium, medication review — or the reason it has been deferred.",
    "acg",
    GASTRO_REFERENCES.acg_acute_pancreatitis
  ),
  rule(
    "pancreatitis_fluids_not_documented",
    "same_day",
    "Acute pancreatitis without documented early fluid therapy",
    "Early goal-directed crystalloid therapy with reassessment is the core of early management, and the guideline requires the plan to be documented.",
    "Record the fluid given, the rate and the documented reassessment.",
    "acg",
    GASTRO_REFERENCES.acg_acute_pancreatitis
  ),

  // ---- Endoscopy, colonoscopy, ERCP -------------------------------------
  rule(
    "consent_not_documented",
    "documented",
    "Procedure documented without recorded informed consent",
    "Every endoscopic procedure requires documented consent, or — in an emergency — the documented rationale for proceeding without it.",
    "Record the consent taken and by whom, or the emergency rationale.",
    "asge",
    GASTRO_REFERENCES.asge_quality
  ),
  rule(
    "timeout_not_documented",
    "documented",
    "Procedure documented without a recorded time-out",
    "A documented time-out verifies patient identity, procedure, allergies and antithrombotic therapy before sedation.",
    "Record that the time-out was performed and what it confirmed.",
    "asge",
    GASTRO_REFERENCES.asge_quality
  ),
  rule(
    "sedation_monitoring_not_documented",
    "documented",
    "Sedation without documented physiological monitoring",
    "Monitoring during sedation is a quality indicator: pulse oximetry, and blood pressure and ECG where sedation is deeper.",
    "Record the monitoring used and the observations during the procedure.",
    "asge",
    GASTRO_REFERENCES.asge_quality
  ),
  rule(
    "cecal_intubation_not_documented",
    "documented",
    "Colonoscopy without documented cecal intubation state",
    "Cecal intubation — photodocumented where possible — is a core quality indicator and determines whether the examination is complete.",
    "Record whether the cecum was reached and photodocumented, or the reason the examination was incomplete.",
    "asge",
    GASTRO_REFERENCES.asge_quality
  ),
  rule(
    "withdrawal_time_not_documented",
    "documented",
    "Colonoscopy without a documented withdrawal time",
    "Adequate withdrawal time (at least six minutes) is associated with higher adenoma detection and is a reported quality indicator.",
    "Record the withdrawal time or the reason it was shorter.",
    "asge",
    GASTRO_REFERENCES.asge_quality
  ),
  rule(
    "polyps_without_surveillance_interval",
    "documented",
    "Polyps removed without a documented surveillance interval",
    "The interval follows USMSTF or ESGE criteria according to polyp number, size and histology; the guideline applied must be recorded so the interval is auditable.",
    "Record the recommended interval and the guideline basis — including 'determined after histology' where the interval depends on pathology.",
    "usmstf",
    GASTRO_REFERENCES.usmstf_surveillance
  ),
  rule(
    "inadequate_prep_without_repeat",
    "documented",
    "Inadequate bowel preparation without a documented repeat plan",
    "An inadequate preparation limits the examination and misses lesions; a repeat examination has to be arranged, not assumed.",
    "Record the repeat examination arranged with its timing, and the preparation plan for it.",
    "usmstf",
    GASTRO_REFERENCES.usmstf_surveillance
  ),
  rule(
    "perforation_not_assessed",
    "same_day",
    "Therapeutic endoscopy without a documented perforation assessment",
    "Perforation is the complication whose outcome depends on recognition; the record should state whether it was suspected and what was done.",
    "Record the perforation assessment made at the end of the procedure, and the post-procedure observation plan.",
    "esge",
    GASTRO_REFERENCES.esge_ercp
  ),
  rule(
    "ercp_pep_prophylaxis_missing",
    "documented",
    "ERCP without documented post-ERCP pancreatitis prophylaxis",
    "Rectal NSAID, periprocedural hydration and, in selected patients, a pancreatic stent reduce post-ERCP pancreatitis. What was used — or why none was indicated — belongs in the record.",
    "Record the prophylaxis used, or the documented reason it was not indicated.",
    "esge",
    GASTRO_REFERENCES.esge_ercp
  ),
  rule(
    "stent_without_specification",
    "documented",
    "Biliary or pancreatic stent placed without a documented specification",
    "Stent type, length and diameter determine the removal or exchange plan and the risk of a further procedure.",
    "Record the stent specification, and when and by whom it will be reviewed or removed.",
    "esge",
    GASTRO_REFERENCES.esge_ercp
  ),

  // ---- Nutrition and discharge -----------------------------------------
  rule(
    "malnutrition_not_assessed",
    "documented",
    "Significant weight loss without a documented nutritional assessment",
    "Unintentional weight loss in GI disease requires a recorded nutritional assessment and, where indicated, dietetic referral and micronutrient testing.",
    "Record the assessment, the micronutrients tested and the dietetic plan.",
    "aga",
    GASTRO_REFERENCES.aga_coeliac
  ),
  rule(
    "coeliac_without_serology",
    "documented",
    "Suspected coeliac disease without documented serology on a gluten-containing diet",
    "Coeliac serology (tissue transglutaminase IgA with total IgA) is only interpretable on a gluten-containing diet, and biopsy follows where indicated.",
    "Record the serology taken, the diet at the time of testing, and the biopsy decision.",
    "aga",
    GASTRO_REFERENCES.aga_coeliac
  ),
  rule(
    "discharge_without_bundle",
    "documented",
    "Discharge without documented prophylaxis, surveillance and follow-up",
    "The guideline-required discharge package — prophylaxis where indicated, surveillance dates, biologic safety monitoring, warning signs and a dated follow-up — is what prevents readmission.",
    "Record each element or state why it is not indicated, and the follow-up appointment arranged.",
    "aasld",
    GASTRO_REFERENCES.aasld_ascites
  ),
  // ---- Disease-specific documentation ----------------------------------
  rule(
    "hp_treated_without_confirmation",
    "documented",
    "H. pylori treated without a documented confirmation of eradication",
    "ACG guidance requires confirmation of eradication after treatment, with testing delayed until the PPI has been held for an appropriate interval. An unconfirmed eradication leaves a treated ulcer or gastritis without its cure documented.",
    "Record the confirmation test arranged and when the PPI is held before it, or the documented reason confirmation is not being done.",
    "acg",
    GASTRO_REFERENCES.acg_h_pylori
  ),
  rule(
    "functional_diagnosis_without_organic_exclusion",
    "documented",
    "Functional diagnosis without documented exclusion of organic disease",
    "A diagnosis of IBS or a functional bowel disorder rests on the absence of alarm features and, where indicated, coeliac serology and faecal calprotectin. Recording what was excluded is what makes the diagnosis auditable.",
    "Record the coeliac serology and calprotectin taken, or the documented reason they are not indicated.",
    "acg",
    ROME_REFERENCE
  ),
  rule(
    "diverticulitis_without_followup",
    "documented",
    "Acute diverticulitis without documented follow-up colonoscopy decision",
    "After an episode of complicated, and in most guidance uncomplicated, diverticulitis the decision on a follow-up colonoscopy belongs in the record — it is how a missed malignancy is excluded.",
    "Record the colonoscopy arranged, or the documented reason it is not indicated.",
    "acg",
    GASTRO_REFERENCES.usmstf_surveillance
  ),
  rule(
    "cholangitis_without_drainage_plan",
    "same_day",
    "Acute cholangitis without a documented biliary drainage plan",
    "Tokyo Guidelines grade the severity of acute cholangitis and tie the timing of biliary drainage to that grade. A cholangitis entry without a drainage plan and its timing leaves the definitive treatment unplanned.",
    "Record the severity grade, the drainage arranged with its time, and the antibiotic regimen.",
    "acg",
    GASTRO_REFERENCES.tokyo_biliary
  ),
  rule(
    "cdiff_without_documented_therapy",
    "same_day",
    "C. difficile infection without documented therapy and severity",
    "Guideline-directed treatment of C. difficile depends on the severity and the episode number, and the inciting antibiotic has to be addressed. An entry that records neither leaves treatment to assumption.",
    "Record the severity, the agent chosen with its dose, and whether the inciting antibiotic was stopped.",
    "acg",
    GASTRO_REFERENCES.acg_cdiff
  ),
  rule(
    "hbv_without_treatment_decision",
    "documented",
    "Chronic hepatitis B without a documented treatment decision",
    "AASLD guidance decides treatment from HBV DNA, ALT, HBeAg status and fibrosis stage. Recording the decision — treat, or monitor with its criteria — is what makes the decision reviewable at the next visit.",
    "Record the phase assessed, the treatment started with its agent, or the monitoring criteria documented.",
    "aasld",
    GASTRO_REFERENCES.aasld_hepatitis_b
  ),
  rule(
    "masld_without_fibrosis_risk_stratification",
    "documented",
    "MASLD without documented fibrosis risk stratification",
    "AASLD and EASL guidance stratify MASLD by fibrosis risk using FIB-4 first and a second-line test when FIB-4 is indeterminate. Without that step the patient's risk of advanced fibrosis is undocumented.",
    "Record the FIB-4 category and, where it is indeterminate or high, the elastography or serum panel arranged.",
    "aasld",
    GASTRO_REFERENCES.aasld_masld
  ),
  rule(
    "acute_liver_failure_without_transplant_discussion",
    "same_day",
    "Acute liver failure without a documented transplant centre discussion",
    "Acute liver failure carries a high mortality and its outcome depends on early discussion with a transplant centre. The record must show that discussion happened, or why it was not indicated.",
    "Record the transplant centre contacted and when, or the documented reason it was not indicated.",
    "aasld",
    GASTRO_REFERENCES.easl_cirrhosis
  ),
  rule(
    "decompensated_cirrhosis_without_event",
    "documented",
    "Decompensated cirrhosis without the decompensating event recorded",
    "Decompensation is defined by the event — ascites, variceal bleeding, encephalopathy, jaundice, SBP or HRS-AKI. A record that states decompensation without naming the event cannot be audited or followed.",
    "Record the event that defines decompensation, and the plan that prevents its recurrence.",
    "baveno",
    BAVENO_REFERENCE
  ),
  rule(
    "cirrhosis_without_vaccination_review",
    "documented",
    "Cirrhosis without a documented vaccination review",
    "Patients with cirrhosis are at increased risk from hepatitis A and B, influenza and pneumococcal disease, and vaccination status is part of their routine cirrhosis care.",
    "Record the vaccines given or arranged, or the documented reason vaccination is not indicated.",
    "aasld",
    GASTRO_REFERENCES.easl_cirrhosis
  ),
  rule(
    "transplant_referral_without_criteria",
    "documented",
    "Transplant referral without documented criteria and contraindication assessment",
    "Referral for liver transplantation is judged on disease severity, on the absence of contraindications and on a social and nutritional assessment. A referral recorded without those elements cannot be assessed by the centre.",
    "Record the MELD or Child-Pugh value, the contraindication assessment and the nutritional and social assessment.",
    "aasld",
    GASTRO_REFERENCES.aasld_hcc
  ),
  // ---- Procedures, time-critical presentations and drug therapy ----------
  rule(
    "procedure_prep_antithrombotic_without_plan",
    "same_day",
    "Antiplatelet or anticoagulant therapy without a documented peri-procedural plan",
    "ASGE guidance ties the decision to hold, continue or bridge antiplatelet and anticoagulant therapy to the bleeding risk of the procedure and the thrombotic risk of the patient. A record that lists the agent without the decision leaves the next clinician to guess.",
    "Document the agent, the last dose, the hold interval, the restart date and who made the decision.",
    "asge",
    GASTRO_REFERENCES.asge_quality
  ),
  rule(
    "liver_biopsy_coagulation_not_documented",
    "same_day",
    "Liver biopsy without documented coagulation and bleeding-risk assessment",
    "Percutaneous liver biopsy carries a recognised bleeding risk, and the pre-procedure record has to show the platelet count, the INR, the bleeding history and what was held or corrected before the needle.",
    "Document the platelet count, INR, bleeding history and any correction given before the biopsy.",
    "asge",
    GASTRO_REFERENCES.gi_procedure_note
  ),
  rule(
    "liver_biopsy_without_observation",
    "same_day",
    "Liver biopsy without documented post-procedure observation",
    "Post-biopsy observation with recorded observations is how a delayed bleed is detected. An observation section left undocumented reads as no monitoring rather than a normal course.",
    "Document the observation period, the observations recorded and the condition at discharge.",
    "asge",
    GASTRO_REFERENCES.gi_procedure_note
  ),
  rule(
    "liver_biopsy_bleeding",
    "same_day",
    "Bleeding after liver biopsy",
    "Post-biopsy bleeding needs a documented response — resuscitation, imaging, transfusion decision and escalation — recorded at the time it is recognised.",
    "Document the recognition time, haemodynamic status, resuscitation given, imaging obtained and who was informed.",
    "asge",
    GASTRO_REFERENCES.asge_quality
  ),
  rule(
    "paracentesis_fluid_tests_not_documented",
    "documented",
    "Paracentesis without documented ascitic fluid analysis",
    "AASLD guidance bases the diagnosis of spontaneous bacterial peritonitis and the serum-ascites albumin gradient on defined ascitic fluid tests. A tap recorded without the tests sent cannot answer the clinical question it was performed for.",
    "Record the cell count with neutrophil count, the paired albumin for the gradient and the culture bottles used.",
    "aasld",
    GASTRO_REFERENCES.aasld_ascites
  ),
  rule(
    "large_volume_paracentesis_without_albumin",
    "same_day",
    "Large-volume paracentesis without documented albumin replacement",
    "Albumin given after large-volume paracentesis reduces post-paracentesis circulatory dysfunction. A volume of five litres or more removed without albumin given or a documented reason leaves that risk unaddressed.",
    "Record the albumin given with its dose, or the documented reason it was withheld.",
    "aasld",
    GASTRO_REFERENCES.aasld_ascites
  ),
  rule(
    "eus_fna_specimen_record_missing",
    "documented",
    "EUS tissue acquisition without the specimen record",
    "The diagnostic yield of EUS-guided sampling depends on the needle, the number of passes and on-site adequacy assessment. Those details are what the cytopathologist and the next endoscopist need.",
    "Record the needle gauge, the number of passes, the on-site adequacy assessment and where the specimen was sent.",
    "asge",
    GASTRO_REFERENCES.asge_quality
  ),
  rule(
    "capsule_retention_not_assessed",
    "same_day",
    "Capsule endoscopy without a documented retention risk assessment",
    "Capsule retention is the defining serious adverse event of capsule endoscopy, and guidance requires the retention risk to be assessed before ingestion, with a patency capsule where a stricture is suspected.",
    "Record how retention risk was assessed before ingestion, and the plan if the capsule is retained.",
    "asge",
    GASTRO_REFERENCES.asge_quality
  ),
  rule(
    "capsule_status_not_documented",
    "documented",
    "Capsule endoscopy without the capsule excretion status recorded",
    "A capsule that has not been excreted needs to be tracked until it is, and a retained capsule needs a documented management plan. The record must state which applies.",
    "Record whether the capsule was excreted, or the tracking and management plan arranged.",
    "asge",
    GASTRO_REFERENCES.asge_quality
  ),
  rule(
    "acute_peritonism_without_surgical_opinion",
    "same_day",
    "Peritonism or a suspected perforation without a documented surgical opinion",
    "Peritonitic signs and free air are surgical problems until proven otherwise, and the timing of the surgical opinion is a determinant of outcome. The record must show the opinion obtained and when.",
    "Document the surgical opinion obtained with its time, or the documented reason it was not indicated.",
    "acg",
    GASTRO_REFERENCES.acg_ugib
  ),
  rule(
    "acute_abdomen_without_resuscitation_record",
    "same_day",
    "Time-critical abdominal presentation without documented resuscitation and reassessment",
    "Sepsis, perforation, obstruction and dehydration all depend on fluid resuscitation with documented reassessment. A record without it cannot show whether the patient was stabilised before the next decision.",
    "Document the fluid given, the haemodynamic response and who reassessed the patient.",
    "acg",
    GASTRO_REFERENCES.acg_acute_pancreatitis
  ),
  rule(
    "sepsis_without_cultures_and_antibiotics",
    "same_day",
    "Sepsis or cholangitis without documented culture timing and antibiotic administration",
    "Guideline-based sepsis care requires cultures and antibiotics with the times recorded. The interval to antibiotics is the measure the record is audited against.",
    "Document the cultures taken, the antibiotic given with its time and the source control arranged.",
    "acg",
    GASTRO_REFERENCES.tokyo_biliary
  ),
  rule(
    "obstruction_without_decompression",
    "same_day",
    "Bowel obstruction without a documented decompression decision",
    "Bowel decompression is a core step in the initial management of obstruction, and the decision for or against it belongs in the record with its reason.",
    "Record the tube placed, or the documented reason decompression was not indicated.",
    "acg",
    GASTRO_REFERENCES.acg_acute_pancreatitis
  ),
  rule(
    "time_critical_presentation_without_imaging",
    "same_day",
    "Suspected perforation or obstruction without documented imaging",
    "Free air and obstruction are diagnosed on imaging, and the choice of imaging with the reason for any delay has to be documented at the time of the decision.",
    "Record the imaging performed with its findings, or the documented reason it has not yet been obtained.",
    "acg",
    GASTRO_REFERENCES.acg_ugib
  ),
  rule(
    "altered_consciousness_without_airway_plan",
    "same_day",
    "Altered consciousness without a documented GCS and airway plan",
    "In variceal bleeding, acute liver failure and sepsis, an altered level of consciousness changes airway management and the level of care needed. A record without a GCS and airway plan leaves that decision unrecorded.",
    "Document the GCS, the airway plan and who was informed.",
    "aasld",
    GASTRO_REFERENCES.easl_cirrhosis
  ),
  rule(
    "time_critical_presentation_without_level_of_care",
    "same_day",
    "Time-critical abdominal presentation without a documented level of care",
    "Every time-critical GI presentation ends in a documented disposition — escalated, discussed with a consultant, or managed on a ward with observation. Without it the record does not show where the patient was cared for.",
    "Record the level of care decided, who was informed and the observation plan.",
    "acg",
    GASTRO_REFERENCES.acg_ugib
  ),
  rule(
    "gi_drug_contraindications_not_documented",
    "documented",
    "GI-critical drug therapy without documented contraindication review",
    "The agents used in GI and liver disease carry defined contraindications and interactions, and the record has to show they were checked before the agent was given.",
    "Record the contraindications and interactions reviewed, or the agent changed or withheld and why.",
    "acg",
    GASTRO_REFERENCES.acg_liver_chemistries
  ),
  rule(
    "gi_drug_monitoring_not_documented",
    "documented",
    "GI-critical drug therapy without documented monitoring",
    "Guideline-based use of these agents requires defined monitoring parameters and a review interval. Without them the next review has nothing to compare against.",
    "Record the monitoring parameters, their interval and who reviews them.",
    "acg",
    GASTRO_REFERENCES.acg_liver_chemistries
  ),
  rule(
    "gi_drug_allergy_check_not_documented",
    "documented",
    "GI-critical drug therapy without a documented allergy check",
    "The recorded allergies are the safety net for every prescription, and the note has to show they were checked against the agent chosen.",
    "Record that the recorded allergies were verified, or the alternative used.",
    "acg",
    GASTRO_REFERENCES.acg_liver_chemistries
  ),
  rule(
    "procedure_pathology_and_followup_not_documented",
    "documented",
    "Procedure with specimens or follow-up left undocumented",
    "A specimen sent without a documented request, or a procedure without a documented follow-up owner, is how results are lost. Both belong in the procedure record.",
    "Record where the specimen was sent and with what clinical question, and the follow-up arranged with the clinician responsible.",
    "asge",
    GASTRO_REFERENCES.gi_pathology_request
  ),
  rule(
    "no_responsible_clinician",
    "documented",
    "Entry without the clinician responsible for the next step",
    "A note that does not name who is responsible leaves the escalation, the result follow-up or the repeat investigation without an owner.",
    "Record the clinician responsible and the next review point.",
    "acg",
    GASTRO_REFERENCES.acg_liver_chemistries
  ),
];

export const GASTRO_SAFETY_RULE_COUNT = GASTRO_SAFETY_RULES.length;

// Fires the rules whose condition the documented note meets. A rule that throws
// never breaks the note: it is treated as not applicable.
export const buildGastroSafetyPrompts = ({ values = {} } = {}) => {
  const flags = gastroFlags(values || {});
  return GASTRO_SAFETY_RULES.filter((r) => {
    try {
      return CONDITION[r.key] ? CONDITION[r.key](flags) : false;
    } catch {
      return false;
    }
  }).map((r) => ({
    key: r.key,
    level: r.level,
    title: r.title,
    basis: r.basis,
    action: r.action,
    provenance: r.provenance,
    source: r.source,
  }));
};

// The condition for each rule, expressed on the flags computed from the note.
const CONDITION = {
  alarm_features_not_escalated: (f) => f.alarm_escalation_missing,
  bleeding_without_endoscopy_timing: (f) => f.bleeding_documented && f.endoscopy_timing_missing,
  variceal_bleeding_without_bundle: (f) => f.variceal_bleeding && (f.vasoactive_missing || f.antibiotic_missing),
  antithrombotic_without_plan: (f) => f.antithrombotic_plan_missing,
  ulcer_without_forrest: (f) => f.ulcer_without_forrest,
  hp_not_assessed_in_ulcer: (f) => f.ulcer_without_forrest || f.ulcer_hp_missing,
  ibd_screening_missing: (f) => f.screening_missing,
  acute_severe_colitis_without_rescue: (f) => f.rescue_missing,
  ibd_flare_without_cdiff_testing: (f) => f.cdiff_missing,
  ibd_surveillance_not_documented: (f) => f.surveillance_missing,
  cirrhosis_without_hcc_surveillance: (f) => f.hcc_surveillance_missing,
  cirrhosis_without_variceal_screening: (f) => f.varices_missing || f.variceal_prophylaxis_missing,
  ascites_without_paracentesis: (f) => f.paracentesis_missing,
  sbp_without_prophylaxis: (f) => f.sbp_prophylaxis_missing,
  severe_encephalopathy_without_level_of_care: (f) => f.severe_encephalopathy,
  liver_disease_without_fibrosis_assessment: (f) => f.fib4_missing,
  alcohol_liver_disease_without_assessment: (f) => f.alcohol_assessment_missing,
  liver_injury_without_causality: (f) => f.dili_without_causality,
  pancreatitis_diagnostic_criteria_incomplete: (f) => f.pancreatitis_criteria_incomplete,
  pancreatitis_aetiology_not_worked_up: (f) => f.pancreatitis_aetiology_workup_missing,
  pancreatitis_fluids_not_documented: (f) => f.fluids_missing,
  consent_not_documented: (f) => f.consent_missing,
  timeout_not_documented: (f) => f.timeout_missing,
  sedation_monitoring_not_documented: (f) => f.sedation_monitoring_missing,
  cecal_intubation_not_documented: (f) => f.cecal_missing,
  withdrawal_time_not_documented: (f) => f.withdrawal_missing,
  polyps_without_surveillance_interval: (f) => f.polyps_without_surveillance,
  inadequate_prep_without_repeat: (f) => f.prep_inadequate,
  perforation_not_assessed: (f) => f.perforation_unassessed,
  ercp_pep_prophylaxis_missing: (f) => f.peps_prophylaxis_missing,
  stent_without_specification: (f) => f.stent_unspecified,
  malnutrition_not_assessed: (f) => f.weight_loss_nutrition,
  coeliac_without_serology: (f) => f.coeliac_without_serology,
  discharge_without_bundle: (f) => f.prophylaxis_unspecified || f.warning_signs_missing || f.follow_up_missing,
  no_responsible_clinician: (f) => f.no_responsible,

  // ---- Disease-specific documentation ----------------------------------
  hp_treated_without_confirmation: (f) => f.hp_treated_without_confirmation,
  functional_diagnosis_without_organic_exclusion: (f) => f.functional_organic_exclusion_missing,
  diverticulitis_without_followup: (f) => f.diverticulitis_followup_missing,
  cholangitis_without_drainage_plan: (f) => f.cholangitis_drainage_missing,
  cdiff_without_documented_therapy: (f) => f.cdiff_documented && (f.cdiff_treatment_missing || f.cdiff_severity_missing),
  hbv_without_treatment_decision: (f) => f.hbv_without_treatment_decision,
  masld_without_fibrosis_risk_stratification: (f) => f.masld_without_fibrosis_risk,
  acute_liver_failure_without_transplant_discussion: (f) => f.alf_without_transplant_discussion,
  decompensated_cirrhosis_without_event: (f) => f.decompensated && f.decompensation_event_missing,
  cirrhosis_without_vaccination_review: (f) => f.cir_vaccination_missing,
  transplant_referral_without_criteria: (f) => f.transplant_without_criteria,

  // ---- Procedures, time-critical presentations and drug therapy ----------
  procedure_prep_antithrombotic_without_plan: (f) => f.prep_anticoag_missing,
  liver_biopsy_coagulation_not_documented: (f) => f.biopsy_coag_missing,
  liver_biopsy_without_observation: (f) => f.biopsy_observation_missing,
  liver_biopsy_bleeding: (f) => f.biopsy_bleeding,
  paracentesis_fluid_tests_not_documented: (f) => f.paracentesis_tests_missing,
  large_volume_paracentesis_without_albumin: (f) => f.lvp_without_albumin,
  eus_fna_specimen_record_missing: (f) => f.eus_specimen_record_missing,
  capsule_retention_not_assessed: (f) => f.capsule_retention_unassessed,
  capsule_status_not_documented: (f) => f.capsule_status_missing,
  acute_peritonism_without_surgical_opinion: (f) => f.peritonism && f.acute_no_surgical_opinion,
  acute_abdomen_without_resuscitation_record: (f) => f.acute_problem.length > 0 && f.acute_no_resuscitation,
  sepsis_without_cultures_and_antibiotics: (f) => (f.sepsis_documented || f.cholangitis_acute) && f.acute_no_cultures,
  obstruction_without_decompression: (f) => f.obstruction_documented && f.acute_no_decompression,
  time_critical_presentation_without_imaging: (f) => (f.perforation_documented || f.obstruction_documented) && f.acute_no_imaging,
  altered_consciousness_without_airway_plan: (f) => f.altered_consciousness,
  time_critical_presentation_without_level_of_care: (f) => f.acute_problem.length > 0 && f.acute_no_level_of_care,
  gi_drug_contraindications_not_documented: (f) => f.drug_contraindication_missing,
  gi_drug_monitoring_not_documented: (f) => f.drug_monitoring_missing,
  gi_drug_allergy_check_not_documented: (f) => f.drug_allergy_missing,
  procedure_pathology_and_followup_not_documented: (f) =>
    f.procedure_followup_missing || (f.pathology_pending && (f.biopsy_documented || f.capsule_documented || f.eus_fna)),
};

// The prompts shown in the panel are also written into the saved note, so a
// reviewer sees what the record raised and what the clinician said about it.
export const formatGastroSafety = (value) => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const acknowledged = Array.isArray(v.acknowledged) ? v.acknowledged : [];
  const lines = [];
  if (acknowledged.length) {
    lines.push(`Documented action recorded against: ${acknowledged.join("; ")}`);
  }
  if (String(v.notes || "").trim()) lines.push(`Clinician note: ${String(v.notes).trim()}`);
  if (!lines.length) return "";
  return `Decision-support review (advisory — the clinician's documented plan stands)\n${lines.join("\n")}`;
};