// Pulmonology / Respiratory Medicine — structured documentation blocks.
//
// Each block is ONE field of type `pulm_modules` on an existing AMedix note. The
// block's definition lives here so the form, the saved note, the printed record,
// the safety prompts and the guideline attribution all read the same
// specification.
//
// Nothing here duplicates a shared AMedix surface: vital signs, the structured
// examination, medications, allergies, reported laboratory and imaging results,
// and the patient's recorded history come from the unified Patient Record and the
// existing note tabs. A block records the clinician's documentation — it never
// orders, calculates a dose or reports a result that was not documented.
//
// Vocabulary comes from the sources registered in pulmonologyReferences.js:
// GINA (asthma control, steps, exacerbations), GOLD (COPD symptoms, ABE grouping,
// exacerbations, oxygen, rehabilitation), ATS/ERS (lung function interpretation,
// ILD), ERS (bronchiectasis), ATS/IDSA and BTS (pneumonia), ESC (pulmonary
// embolism), AASM (sleep apnoea), WHO (tuberculosis), BTS (pleural disease).

import {
  T,
  I,
  N,
  S,
  M,
  WHEN,
  WHEN_IN,
  NOT_DOCUMENTED,
  NOT_APPLICABLE,
  YES_NO_DOC,
  REPORT_STATUS,
  OXYGEN_SUPPORT,
  SMOKING_STATUS,
  EXACERBATION_FREQUENCY,
} from "@/lib/pulmonologyFieldKit";

const CORE_BLOCKS = {
  // ---- Presentation, exposure and history ---------------------------------
  pulm_history: {
    title: "Respiratory History, Exposure & Risk Profile",
    fields: [
      M("presentation", "Presenting Problem (as documented)", [
        "Cough", "Sputum production", "Breathlessness", "Wheeze", "Chest tightness",
        "Haemoptysis", "Fever", "Chest pain", "Snoring / witnessed apnoea",
        "Recurrent infection", "Known disease review", "Occupational assessment", "Other",
      ]),
      T("onset_pattern", "Onset and Pattern — When It Began, Progression, Periodicity, What Relieves It"),
      M("triggers", "Triggers Documented", [
        "Exercise", "Cold air", "Allergens", "Smoke", "Dust / fumes", "Occupational exposure",
        "Respiratory infection", "Medications (e.g. beta-blocker, NSAID)", "Emotion / stress",
        "Recumbency", "No trigger identified", NOT_DOCUMENTED,
      ]),
      S("smoking_status", "Smoking Status", SMOKING_STATUS),
      N("pack_years", "Pack-Years (as documented, not calculated)"),
      I("exposure_years", "Years of Documented Occupational or Environmental Exposure"),
      M("exposures", "Documented Exposures", [
        "Asbestos", "Silica", "Coal dust", "Beryllium", "Organic dusts / moulds (farmers, malt)",
        "Isocyanates / paints", "Welding fumes", "Bird / animal antigen", "Biomass fuel smoke",
        "Second-hand smoke", "Vaping / e-cigarette", "None documented", NOT_DOCUMENTED,
      ]),
      M("risk_factors", "Risk Factors Documented", [
        "Atopy / allergic rhinitis", "Eczema", "Family history of asthma", "Alpha-1 antitrypsin deficiency (known)",
        "Prematurity / childhood wheeze", "Immunosuppression", "Diabetes", "Chronic kidney disease",
        "Thromboembolic history", "Recent surgery or immobilisation", "Active malignancy",
        "Tuberculosis contact", "Endemic-area travel", "Injecting drug use", "None documented", NOT_DOCUMENTED,
      ]),
      S("tb_contact", "Documented Tuberculosis Contact or Endemic Exposure", ["No", "Yes — contact tracing recorded", "Yes — detail not documented", NOT_DOCUMENTED]),
    ],
  },

  // ---- Symptom assessment --------------------------------------------------
  pulm_symptoms: {
    title: "Symptom Assessment",
    fields: [
      M("symptoms", "Symptoms Documented at This Visit", [
        "Productive cough", "Dry cough", "Sputum colour change", "Sputum volume",
        "Breathlessness on exertion", "Breathlessness at rest", "Orthopnoea",
        "Nocturnal symptoms", "Wheeze", "Chest tightness", "Haemoptysis",
        "Fever", "Night sweats", "Weight loss", "Ankle swelling",
        "Snoring", "Witnessed apnoea", "Daytime sleepiness", "None documented", NOT_DOCUMENTED,
      ]),
      S("sputum_character", "Sputum Character as Documented", [
        "No sputum", "Clear / mucoid", "Purulent", "Blood-stained", "Frank haemoptysis", NOT_DOCUMENTED,
      ]),
      S("haemoptysis_volume", "Haemoptysis Volume (where documented)", [
        "Not applicable", "Streaking only", "Less than a teaspoon", "More than a teaspoon per episode",
        "Large volume — more than 100 mL in 24 hours", NOT_DOCUMENTED,
      ], WHEN("sputum_character", "Frank haemoptysis")),
      S("night_symptoms", "Night-Time Waking With Respiratory Symptoms", [
        "None", "Less than once a week", "Once or more a week", "Every night", NOT_DOCUMENTED,
      ]),
      S("reliever_use", "Reliever Inhaler Use Documented", [
        "Not used", "Less than twice a week", "Twice or more a week but not daily", "Daily",
        "Several times a day", NOT_DOCUMENTED,
      ]),
      T("functional_impact", "Functional Impact and Effect on Work, Sleep and Exercise"),
      N("weight_change", "Documented Weight Change (kg)"),
    ],
  },

  // ---- Structured respiratory examination ---------------------------------
  pulm_exam: {
    title: "Respiratory Examination",
    fields: [
      S("general", "General Appearance as Documented", [
        "Comfortable at rest", "Mild increased work of breathing", "Moderate increased work of breathing",
        "Severe distress — unable to complete sentences", "Cyanosed", NOT_DOCUMENTED,
      ]),
      M("inspection", "Inspection", [
        "Chest wall normal", "Barrel chest", "Accessory muscle use", "Tracheal tug",
        "Intercostal recession", "Pursed-lip breathing", "Finger clubbing", "Peripheral cyanosis",
        "Ankle oedema", "Raised JVP", "Surgical or drain scar", NOT_DOCUMENTED,
      ]),
      S("trachea", "Tracheal Position", ["Central", "Deviated to the right", "Deviated to the left", NOT_DOCUMENTED]),
      S("expansion", "Chest Expansion", ["Symmetrical and normal", "Symmetrical but reduced", "Asymmetrical — right reduced", "Asymmetrical — left reduced", NOT_DOCUMENTED]),
      S("percussion", "Percussion Note", ["Resonant bilaterally", "Dullness — right", "Dullness — left", "Hyper-resonant", "Stony dullness with effusion", NOT_DOCUMENTED]),
      S("breath_sounds", "Breath Sounds", ["Vesicular bilaterally", "Reduced right", "Reduced left", "Reduced bilaterally", "Absent — right", "Absent — left", NOT_DOCUMENTED]),
      M("added_sounds", "Added Sounds", [
        "None", "Widespread wheeze", "Focal wheeze", "Coarse crackles", "Fine inspiratory crackles",
        "Pleural rub", "Stridor", NOT_DOCUMENTED,
      ]),
      S("vocal_resonance", "Vocal Resonance", ["Normal", "Increased", "Reduced", NOT_DOCUMENTED]),
      M("extrapulmonary", "Extrapulmonary Findings Documented", [
        "None", "Ear, nose and throat findings", "Cardiac murmur", "Peripheral oedema",
        "Lymphadenopathy", "Joint findings", "Skin findings", "Neurological findings", NOT_DOCUMENTED,
      ]),
      T("exam_detail", "Examination Detail — site-by-site findings and anything not covered above"),
    ],
  },

  // ---- Inhaler, device and adherence --------------------------------------
  pulm_inhaler_device: {
    title: "Inhaler and Device Review",
    fields: [
      M("devices", "Devices Documented", [
        "Pressurised metered-dose inhaler", "Metered-dose inhaler with spacer", "Dry-powder inhaler",
        "Soft-mist inhaler", "Nebuliser", "Peak flow meter", "Intermittent positive pressure device",
        "Nasal CPAP", "Nasal high-flow device", "None", NOT_DOCUMENTED,
      ]),
      S("technique", "Inhaler Technique Observed or Demonstrated", [
        "Correct on observation", "Minor errors seen and corrected", "Major errors — teaching repeated",
        "Not observed at this visit", NOT_DOCUMENTED,
      ]),
      M("technique_errors", "Documented Technique Errors", [
        "No error observed", "Did not shake the device", "Poor coordination of actuation and breath",
        "Insufficient breath-hold", "Did not exhale before actuation", "Inhaled too quickly for a dry-powder device",
        "Did not load or prime the device", "Spacer not used where prescribed", NOT_DOCUMENTED,
      ]),
      S("adherence", "Documented Adherence", ["Good", "Partial", "Poor", "Not assessed", NOT_DOCUMENTED]),
      T("adherence_reason", "Reasons for Poor or Partial Adherence as Documented (cost, side effects, complexity, belief, forgetfulness)"),
      S("spacer", "Spacer Documented", ["Prescribed and available", "Prescribed — not available", "Not indicated", NOT_DOCUMENTED]),
      T("regimen_simplification", "Regimen Simplification or Switch Discussed"),
    ],
  },

  // ---- Exacerbation history and action plan -------------------------------
  pulm_exacerbation: {
    title: "Exacerbation History, Action Plan & Self-Management",
    fields: [
      S("frequency", "Exacerbations in the Last 12 Months", EXACERBATION_FREQUENCY),
      N("exacerbations_count", "Number of Exacerbations Documented in the Last 12 Months"),
      M("severity_history", "Most Severe Documented Exacerbation", [
        "Treated at home with antibiotics or steroids", "Treated at home with both",
        "Emergency department attendance", "Hospital admission", "Admission with NIV",
        "Admission with invasive ventilation", "No exacerbation documented", NOT_DOCUMENTED,
      ]),
      T("current_exacerbation", "Current Exacerbation — Onset, Symptoms, Treatment Given, Response"),
      M("exacerbation_triggers", "Documented Exacerbation Triggers", [
        "Respiratory infection", "Air pollution episode", "Non-adherence to maintenance therapy",
        "Inhaler technique deterioration", "Cold weather", "Unknown", NOT_DOCUMENTED,
      ]),
      S("action_plan", "Written Action Plan", [
        "Given and explained at this visit", "Previously given — reviewed today",
        "Previously given — not reviewed", "Not documented", NOT_APPLICABLE,
      ]),
      T("action_plan_detail", "Action Plan Content Documented (recognition signs, when to start treatment, when to seek urgent care)"),
      S("self_management", "Self-Management Education Documented", YES_NO_DOC),
      S("safety_netting", "Safety-Netting Advice Documented", YES_NO_DOC),
    ],
  },

  // ---- Oxygen and ventilatory support ------------------------------------
  pulm_oxygen: {
    title: "Oxygen and Ventilatory Support",
    fields: [
      S("current_support", "Oxygen or Ventilatory Support in Use", OXYGEN_SUPPORT),
      S("target_range", "Prescribed Oxygen Target Range", [
        "94–98% (normal target range)", "88–92% (hypercapnia risk target range)",
        "88–92% (COPD target range)", "Individualised range documented", NOT_DOCUMENTED,
      ]),
      S("resting_saturation", "Resting Saturation on Room Air Documented", [
        "Documented in vital signs", "Not measured at this visit", NOT_DOCUMENTED,
      ]),
      S("exertion_saturation", "Exertional or Ambulatory Desaturation Documented", [
        "No desaturation documented", "Desaturation on exertion documented",
        "Desaturation on ambulation documented", "Not measured", NOT_DOCUMENTED,
      ]),
      S("ltot_assessment", "Long-Term Oxygen Assessment Documented", [
        "Criteria documented and met", "Criteria documented and not met", "Assessment in progress",
        "Not indicated", "Not documented", NOT_APPLICABLE,
      ]),
      T("ltot_criteria", "Long-Term Oxygen Criteria as Documented (saturation, arterial gases, number of assessments)"),
      S("oxygen_safety", "Home Oxygen Safety Advice Documented", [
        "Fire risk and no-smoking advice given", "Given with equipment instructions",
        "Not documented", NOT_APPLICABLE,
      ]),
      S("niv_documented", "Non-Invasive Ventilation Documented", [
        "Established ventilation — settings documented", "Acute use during this episode",
        "Considered and not indicated", "Not applicable", NOT_DOCUMENTED,
      ]),
      T("niv_detail", "Ventilation Detail (modes, pressures, interface, hours per day, adherence)", WHEN_IN("niv_documented", ["Established ventilation — settings documented", "Acute use during this episode"])),
      S("ventilation_stop_rule", "Escalation or Stopping Rule Documented", YES_NO_DOC),
    ],
  },

  // ---- Lung function documentation ---------------------------------------
  pulm_lung_function: {
    title: "Lung Function Interpretation (as documented)",
    fields: [
      S("spirometry_status", "Spirometry", REPORT_STATUS),
      S("obstruction", "Documented Pattern", [
        "Obstructive", "Restrictive", "Mixed", "Normal", "Non-diagnostic", NOT_DOCUMENTED,
      ]),
      S("reversibility", "Bronchodilator Reversibility Documented", [
        "Significant reversibility documented", "No significant reversibility documented",
        "Not assessed", NOT_DOCUMENTED,
      ]),
      S("predicted_values", "Predicted Values Used as Documented", [
        "Laboratory default set", "GLI reference equations", "Other set documented",
        "Not recorded", NOT_DOCUMENTED,
      ]),
      S("dlco_status", "Diffusing Capacity", REPORT_STATUS),
      S("lung_volumes", "Lung Volumes", REPORT_STATUS),
      S("quality_grade", "Reported Test Quality", [
        "Acceptable and reproducible", "Acceptable — not reproducible", "Suboptimal",
        "Grading not reported", NOT_DOCUMENTED,
      ]),
      S("pft_interpretation_source", "Interpretation Made By", [
        "Reporting laboratory", "Treating clinician", "Multi-disciplinary review", "Not recorded", NOT_DOCUMENTED,
      ]),
      T("pft_summary", "Interpretation Summary as Documented"),
      S("progression", "Change From Previous Documented Study", [
        "Stable", "Improved", "Declined — exceeds the reported variability",
        "No comparable previous study", NOT_DOCUMENTED,
      ]),
    ],
  },

  // ---- Disease-specific: asthma and COPD ---------------------------------
  pulm_asthma: {
    title: "Asthma Assessment",
    fields: [
      S("diagnosis_basis", "Diagnostic Basis Documented", [
        "Variable airflow limitation documented (reversibility or variability)",
        "Peak flow variability documented", "Bronchial challenge documented",
        "Clinical diagnosis — objective confirmation not documented", "Established diagnosis from previous record", NOT_DOCUMENTED,
      ]),
      S("current_step", "Documented Treatment Step (GINA 1–5)", [
        "Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Not documented",
      ]),
      S("control", "Documented Control Category", [
        "Well controlled", "Partly controlled", "Uncontrolled", NOT_DOCUMENTED,
      ]),
      M("control_criteria", "Control Criteria as Documented in the Last 4 Weeks", [
        "Daytime symptoms more than twice a week", "Night waking due to asthma",
        "Reliever needed more than twice a week", "Activity limitation",
        "None of the criteria documented", NOT_DOCUMENTED,
      ]),
      M("exacerbation_risk", "Exacerbation Risk Factors Documented", [
        "One or more exacerbations in the last year", "Ever admitted to intensive care for asthma",
        "Ever intubated for asthma", "Overuse of short-acting beta-agonist",
        "Low adherence", "Incorrect inhaler technique", "Smoking or exposure to smoke",
        "Obesity", "Eosinophilia documented", "Food allergy", "None documented", NOT_DOCUMENTED,
      ]),
      S("phenotype", "Documented Phenotype or Treatable Trait", [
        "Allergic", "Eosinophilic", "Non-eosinophilic", "Exercise-induced",
        "Aspirin-exacerbated", "Occupational", "Mixed", "Not characterised", NOT_DOCUMENTED,
      ]),
      S("biologic", "Biologic Therapy Documented", [
        "Not applicable", "Being considered — workup documented", "Started — monitoring documented",
        "Continuing — response documented", "Stopped — reason documented", NOT_DOCUMENTED,
      ]),
      T("biologic_monitoring", "Biologic Response Measure, Review Interval and Stopping Rule", WHEN_IN("biologic", ["Started — monitoring documented", "Continuing — response documented", "Stopped — reason documented"])),
      S("asthma_review_interval", "Documented Review Interval", ["1 month", "3 months", "6 months", "12 months", "As needed / open access", NOT_DOCUMENTED]),
    ],
  },

  pulm_copd: {
    title: "COPD Assessment",
    fields: [
      S("diagnosis_basis", "Diagnostic Basis Documented", [
        "Post-bronchodilator airflow obstruction documented",
        "Airflow obstruction documented without post-bronchodilator confirmation",
        "Clinical diagnosis — spirometry not documented", "Established diagnosis from previous record", NOT_DOCUMENTED,
      ]),
      S("abe_group", "GOLD Group as Documented by the Clinician", [
        "Group A", "Group B", "Group E", "Not documented",
      ]),
      S("exacerbation_group_basis", "Group Based On", [
        "Documented exacerbation history and symptom score", "Documented symptom score only",
        "Documented exacerbation history only", "Not documented", NOT_APPLICABLE,
      ]),
      M("management_elements", "Management Elements Documented", [
        "Smoking cessation support", "Vaccination review", "Inhaler therapy reviewed",
        "Inhaler technique reviewed", "Pulmonary rehabilitation discussed",
        "Pulmonary rehabilitation referred", "Long-term oxygen assessed",
        "NIV assessed", "Written action plan given", "Comorbidity review",
        "Palliative or advance care discussion", "None documented", NOT_DOCUMENTED,
      ]),
      S("triple_therapy", "Triple Therapy Documented", [
        "Not applicable", "Continuing — indication documented", "Started — indication documented",
        "Being considered", "Stopped — reason documented", NOT_DOCUMENTED,
      ]),
      T("triple_indication", "Indication as Documented for Triple Therapy (exacerbation history, eosinophil count, symptom burden)", WHEN_IN("triple_therapy", ["Continuing — indication documented", "Started — indication documented", "Being considered"])),
      S("azithromycin", "Long-Term Azithromycin Documented", [
        "Not applicable", "Continuing — monitoring documented", "Started — monitoring documented",
        "Not indicated", NOT_DOCUMENTED,
      ]),
      S("azithromycin_monitoring", "Azithromycin Monitoring Documented (hearing, cardiac rhythm, resistance)", YES_NO_DOC),
      S("comorbidity_screen", "Comorbidity Review Documented", [
        "Cardiovascular disease", "Anxiety or depression", "Osteoporosis", "Skeletal muscle dysfunction",
        "Lung cancer screening discussed", "Obstructive sleep apnoea", "Reflux", "Several reviewed — detail documented", "Not documented",
      ]),
      S("prognosis_discussion", "Prognosis, Advance Care or Palliative Discussion Documented", YES_NO_DOC),
    ],
  },

  // ---- Disease-specific: ILD, bronchiectasis, sleep, TB, pleural, PE ------
  pulm_ild: {
    title: "Interstitial Lung Disease Review",
    fields: [
      S("ild_status", "Documented Disease Status", [
        "Stable", "Progressing", "Rapidly progressing", "Stable on therapy",
        "Awaiting multi-disciplinary review", NOT_DOCUMENTED,
      ]),
      S("mdt", "Multi-Disciplinary Review", [
        "Discussed — outcome documented", "Referred — not yet discussed",
        "Not indicated", NOT_DOCUMENTED,
      ]),
      S("antifibrotic", "Antifibrotic Therapy", [
        "Not applicable", "Continuing — tolerance documented", "Started — tolerance documented",
        "Stopped — reason documented", "Being considered", NOT_DOCUMENTED,
      ]),
      M("antifibrotic_monitoring", "Antifibrotic Monitoring Documented", [
        "Liver function monitored", "Diarrhoea documented and managed", "Photosensitivity advice given",
        "Nausea documented and managed", "No monitoring documented", NOT_APPLICABLE,
      ]),
      S("transplant_referral", "Transplant Assessment", [
        "Referred", "Not indicated", "Discussed with the patient", "Not documented", NOT_APPLICABLE,
      ]),
      S("oxygen_assessed", "Oxygen Assessment Documented", YES_NO_DOC),
      S("rehab_referred", "Pulmonary Rehabilitation Referred", YES_NO_DOC),
      T("progression_markers", "Progression Markers as Documented (symptom change, functional change, reported lung function change)"),
    ],
  },

  pulm_bronchiectasis: {
    title: "Bronchiectasis Review",
    fields: [
      S("airway_clearance", "Airway Clearance", [
        "Technique taught and demonstrated", "Technique reviewed", "Technique not documented",
        "Not indicated", NOT_DOCUMENTED,
      ]),
      M("clearance_devices", "Airway Clearance Methods Documented", [
        "Active cycle of breathing", "Autogenic drainage", "Oscillating positive expiratory pressure device",
        "High-frequency chest wall oscillation", "Postural drainage", "None documented", NOT_DOCUMENTED,
      ]),
      S("sputum_microbiology", "Sputum Microbiology Status as Documented", [
        "No growth documented", "Organism documented — detail in the record",
        "Pseudomonas documented", "Non-tuberculous mycobacteria documented",
        "Awaiting culture", "Not sent", NOT_DOCUMENTED,
      ]),
      S("long_term_antibiotic", "Long-Term Antibiotic Therapy", [
        "Not applicable", "Continuing — monitoring documented", "Started — monitoring documented",
        "Being considered", "Stopped — reason documented", NOT_DOCUMENTED,
      ]),
      M("long_term_antibiotic_monitoring", "Long-Term Antibiotic Monitoring Documented", [
        "Sputum culture surveillance", "Hearing assessment", "Renal function monitoring",
        "Cardiac rhythm monitoring", "No monitoring documented", NOT_APPLICABLE,
      ]),
      S("exacerbation_definition", "Exacerbation Criteria Documented", YES_NO_DOC),
      S("referral", "Surgical or Specialist Referral Documented", [
        "Not applicable", "Thoracic surgery referral", "Specialist bronchiectasis centre referral",
        "Physiotherapy referral", "Not documented",
      ]),
    ],
  },

  pulm_sleep: {
    title: "Sleep-Disordered Breathing Assessment",
    fields: [
      M("sleep_symptoms", "Symptoms Documented", [
        "Loud snoring", "Witnessed apnoea", "Choking or gasping at night", "Non-restorative sleep",
        "Daytime sleepiness", "Morning headache", "Nocturia", "Insomnia",
        "Driving sleepiness", "None documented", NOT_DOCUMENTED,
      ]),
      S("sleepiness_measure", "Documented Sleepiness Instrument", [
        "Epworth Sleepiness Scale recorded", "STOP-BANG recorded", "Both recorded",
        "Clinical assessment only", "Not documented",
      ]),
      S("sleep_study", "Objective Sleep Testing", [
        "Reported and reviewed", "Reported — awaiting review", "Ordered — not yet performed",
        "Not performed", "Declined", NOT_DOCUMENTED,
      ]),
      S("ahi_band", "Documented Severity Band", [
        "Not obstructive sleep apnoea", "Mild", "Moderate", "Severe", NOT_DOCUMENTED,
      ]),
      S("cpap", "CPAP Therapy", [
        "Not applicable", "Started — adherence documented", "Continuing — adherence documented",
        "Trial unsuccessful", "Declined", NOT_DOCUMENTED,
      ]),
      T("cpap_adherence", "CPAP Adherence and Settings as Documented (hours per night, pressure, mask type, side effects)", WHEN_IN("cpap", ["Started — adherence documented", "Continuing — adherence documented"])),
      S("driving_advice", "Driving and Safety Advice Documented", YES_NO_DOC),
      S("weight_management", "Weight Management Discussed", YES_NO_DOC),
      S("other_sleep_diagnosis", "Other Sleep Diagnosis Documented", [
        "Obesity hypoventilation documented", "Central sleep apnoea documented",
        "Overlap syndrome documented", "None documented", NOT_DOCUMENTED,
      ]),
    ],
  },

  pulm_tb: {
    title: "Tuberculosis Documentation",
    fields: [
      S("tb_category", "Documented Classification", [
        "Pulmonary tuberculosis — bacteriologically confirmed", "Pulmonary tuberculosis — clinically diagnosed",
        "Extrapulmonary tuberculosis", "Latent tuberculosis infection", "Not tuberculosis", NOT_DOCUMENTED,
      ]),
      S("bacteriology_status", "Bacteriological Confirmation as Documented", [
        "Confirmed — result documented in the record", "Not confirmed — clinical diagnosis",
        "Awaiting results", "Not performed", NOT_DOCUMENTED,
      ]),
      S("notification", "Public Health Notification", [
        "Notified — reference documented", "Notified — reference not recorded",
        "Not yet notified", "Not applicable", NOT_DOCUMENTED,
      ]),
      T("regimen", "Regimen Documented (drugs, doses, phase and duration as prescribed)"),
      S("adherence_support", "Adherence Support Documented", [
        "Directly observed therapy", "Video-observed therapy", "Self-administered with adherence support",
        "Treatment supporter identified", "Not documented", NOT_APPLICABLE,
      ]),
      S("isolation", "Infection Control Advice Documented", YES_NO_DOC),
      S("contact_tracing", "Contact Tracing", [
        "Contacts identified and referred", "Contacts identified — referral pending",
        "No contacts identified", "Not documented", NOT_APPLICABLE,
      ]),
      S("drug_monitoring", "Treatment Monitoring Documented", [
        "Baseline and follow-up monitoring recorded", "Baseline only", "Follow-up only",
        "Not documented", NOT_APPLICABLE,
      ]),
      S("resistance", "Documented Resistance Status", [
        "Drug-susceptible", "Rifampicin-resistant", "Multi-drug resistant", "Extensively drug resistant",
        "Not yet known", NOT_APPLICABLE, NOT_DOCUMENTED,
      ]),
    ],
  },

  pulm_pleural: {
    title: "Pleural Disease and Drain Documentation",
    fields: [
      S("pleural_problem", "Documented Pleural Problem", [
        "Pleural effusion", "Pneumothorax", "Empyema", "Pleural thickening",
        "Pleural mass", "No pleural problem", NOT_DOCUMENTED,
      ]),
      S("drain", "Chest Drain", [
        "In situ — documented below", "Inserted at this encounter", "Removed at this encounter",
        "Not in situ", NOT_DOCUMENTED,
      ]),
      S("drain_type", "Drain Type", ["Small-bore catheter", "Large-bore chest drain", "Indwelling pleural catheter", "Not documented"], WHEN("drain", "In situ — documented below")),
      S("drain_side", "Side", ["Right", "Left", "Bilateral", NOT_DOCUMENTED], WHEN("drain", "In situ — documented below")),
      T("drain_output", "Drain Output and Swing as Documented (volume in 24 hours, fluid character, bubbling, swing)", WHEN("drain", "In situ — documented below")),
      S("removal_criteria", "Removal Criteria Documented", [
        "Criteria documented and met", "Criteria documented and not yet met",
        "Not documented", NOT_APPLICABLE,
      ], WHEN("drain", "In situ — documented below")),
      S("pleural_procedure", "Pleural Procedure Documented", [
        "Thoracentesis", "Intercostal drain insertion", "Pleurodesis", "Indwelling catheter insertion",
        "Medical thoracoscopy", "None", NOT_DOCUMENTED,
      ]),
      S("pleural_fluid_character", "Fluid Character as Documented", [
        "Serous", "Purulent", "Blood-stained", "Milky", "Not documented", NOT_APPLICABLE,
      ]),
      S("definitive_plan", "Definitive Management Documented", [
        "Referral to respiratory or thoracic service", "Surgical referral", "Oncology referral",
        "Pleurodesis planned", "Indwelling catheter planned", "Conservative management documented",
        "Not documented", NOT_APPLICABLE,
      ]),
      S("pneumothorax_size", "Pneumothorax Documentation", [
        "Not applicable", "Small — observation documented", "Moderate — drainage documented",
        "Large or tension — emergency drainage documented", "Not documented",
      ]),
    ],
  },

  pulm_pe: {
    title: "Suspected Pulmonary Embolism Pathway",
    fields: [
      S("pretest_probability", "Documented Pre-Test Probability", [
        "PE unlikely", "PE likely", "Score documented in the scores section",
        "Clinical judgement documented", "Not documented",
      ]),
      S("rule_out_applied", "PERC or Rule-Out Criteria", [
        "PERC negative — testing not indicated as documented", "PERC positive — testing pathway applied",
        "Not applied", "Not documented",
      ]),
      S("diagnostic_pathway", "Documented Diagnostic Pathway", [
        "D-dimer then imaging if indicated", "Imaging requested directly",
        "Imaging performed — report reviewed", "Empirical treatment documented", "Not documented",
      ]),
      S("anticoagulation", "Anticoagulation Documented", [
        "Not applicable", "Started — contraindications documented", "Continuing — monitoring documented",
        "Withheld — reason documented", NOT_DOCUMENTED,
      ]),
      M("anticoagulation_safety", "Anticoagulation Safety Documentation", [
        "Bleeding risk assessed", "Renal function documented", "Weight documented for dosing",
        "Concomitant antiplatelet documented", "No safety assessment documented", NOT_APPLICABLE,
      ]),
      S("provoked_status", "Provoked or Unprovoked as Documented", [
        "Provoked — transient risk factor documented", "Unprovoked", "Cancer-associated",
        "Not documented", NOT_DOCUMENTED,
      ]),
      S("duration_plan", "Documented Anticoagulation Duration Plan", [
        "3 months", "6 months", "Indefinite", "Until reassessment documented", "Not documented", NOT_APPLICABLE,
      ]),
      T("followup_thrombosis", "Follow-Up and Thrombophilia Assessment Documented"),
    ],
  },

  // ---- Education, vaccination and follow-up ------------------------------
  pulm_management: {
    title: "Education, Prevention and Follow-Up",
    fields: [
      M("education", "Education Documented", [
        "Diagnosis explained", "Inhaler technique taught", "Action plan given",
        "Smoking cessation advice", "Vaccination advice", "Oxygen safety",
        "Airway clearance teaching", "Sleep hygiene and CPAP advice",
        "Occupational exposure advice", "Written information provided", "None documented",
      ]),
      S("smoking_cessation", "Smoking Cessation Support Documented", [
        "Advised to stop", "Advised and referred to a cessation service",
        "Pharmacotherapy discussed (NRT, varenicline, bupropion)", "Declined",
        "Not applicable — non-smoker", NOT_DOCUMENTED,
      ]),
      M("vaccination", "Vaccination Status Documented", [
        "Influenza — up to date", "Influenza — due", "Pneumococcal — up to date",
        "Pneumococcal — due", "COVID-19 — up to date", "COVID-19 — due",
        "Pertussis in relevant contacts", "Not documented",
      ]),
      M("referrals", "Referrals Documented at This Visit", [
        "Pulmonary rehabilitation", "Physiotherapy", "Respiratory specialist centre",
        "Thoracic surgery", "Oncology", "Sleep service", "Tuberculosis service",
        "Palliative care", "Smoking cessation service", "Occupational health",
        "None", NOT_DOCUMENTED,
      ]),
      S("rehab_status", "Pulmonary Rehabilitation", [
        "Referred", "Completed — outcome documented", "Attending — progress documented",
        "Offered and declined", "Not indicated", "Not documented", NOT_APPLICABLE,
      ]),
      T("rehab_outcome", "Rehabilitation Outcome as Documented (exercise capacity, breathlessness, completion)", WHEN_IN("rehab_status", ["Completed — outcome documented", "Attending — progress documented"])),
      S("followup_interval", "Documented Follow-Up Interval", [
        "1 week", "2 weeks", "4–6 weeks", "3 months", "6 months", "12 months",
        "As needed / open access", NOT_DOCUMENTED,
      ]),
      T("followup_plan", "Follow-Up Plan and Review Criteria"),
      S("escalation_plan", "Escalation or Admission Criteria Documented", YES_NO_DOC),
    ],
  },
};

export const PULM_BLOCKS = { ...CORE_BLOCKS };

export const PULM_BLOCK_KEYS = Object.keys(PULM_BLOCKS);

export const pulmBlock = (key) => PULM_BLOCKS[key] || null;

// The block value a field holds, tagged with its block key so the saved note, the
// screen and the printed record can be rebuilt without the form's context.
export const pulmBlockValue = (blockKey, value) => ({ ...(value || {}), __m: blockKey });

export const pulmBlockFrom = (value) => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return v.__m && PULM_BLOCKS[v.__m] ? PULM_BLOCKS[v.__m] : null;
};

// Printed form: every answered question, in the block's own order.
export const formatPulmBlock = (value) => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const spec = pulmBlockFrom(value);
  if (!spec) return "";
  return spec.fields
    .map((f) => {
      const raw = v[f.key];
      const text = Array.isArray(raw) ? raw.filter(Boolean).join("; ") : String(raw ?? "").trim();
      return text ? `${f.label}: ${text}` : "";
    })
    .filter(Boolean)
    .join("\n");
};