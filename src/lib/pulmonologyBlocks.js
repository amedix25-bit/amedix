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
import { PULM_COPD_BLOCKS } from "@/lib/pulmCopdModule";
import { PULM_ASTHMA_BLOCKS } from "@/lib/pulmAsthmaModule";
import { PULM_ACUTE_BLOCKS } from "@/lib/pulmAcuteModule";

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

      // Smoking is quantified, not only categorised: both the documented figure
      // and the pack-years calculated from the two entries below are kept, so the
      // arithmetic is visible and can be checked.
      N("cigarettes_per_day", "Cigarettes per Day (current, or before stopping)"),
      N("years_smoked", "Years Smoked"),
      {
        key: "pack_years_calculated",
        label: "Pack-Years — calculated from the two entries above",
        type: "computed",
        unit: "pack-years",
        hint: "Cigarettes per day ÷ 20 × years smoked. Shown for review; the documented pack-year figure above is never overwritten by it.",
        compute: (v) => {
          const perDay = Number(v.cigarettes_per_day);
          const years = Number(v.years_smoked);
          if (!perDay || !years) return null;
          return Math.round((perDay / 20) * years * 10) / 10;
        },
      },

      // Shisha / water-pipe exposure is documented in its own right: it is not
      // converted into cigarette equivalents, because no conversion is applied by
      // the app — the sessions and years are recorded as the patient reports them.
      S("shisha_status", "Shisha / Water-Pipe Use", [
        "Never", "Current — occasional", "Current — daily", "Ex-shisha user", NOT_DOCUMENTED,
      ]),
      N("shisha_sessions_per_week", "Shisha Sessions per Week as Documented"),
      N("shisha_years", "Years of Shisha Use"),
      T("shisha_detail", "Shisha Exposure Detail (sessions, years, sharing, venue) — no cigarette-equivalent is calculated"),

      I("occupation", "Current or Previous Occupation(s)"),
      I("occupational_years", "Years in the Documented Occupation"),
      S("respiratory_protection", "Respiratory Protection Used at Work", YES_NO_DOC),
      M("environmental_exposures", "Environmental Exposures Documented at Home or Locally", [
        "Urban air pollution", "Traffic-related pollution", "Industrial emissions nearby",
        "Indoor biomass or charcoal smoke", "Damp or mould at home", "Overcrowding",
        "Pets or animal antigens", "Dust mite", "Pollen", "Passive smoking", "None documented", NOT_DOCUMENTED,
      ]),
      S("home_environment", "Home Environment Documented", [
        "No damp or mould documented", "Damp or mould documented", "Overcrowding documented",
        "Indoor biomass fuel use documented", "Not documented", NOT_APPLICABLE,
      ]),
      S("endemic_travel", "Travel or Residence in a Tuberculosis-Endemic Area", [
        "None documented", "Yes — documented", NOT_DOCUMENTED,
      ]),
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

      // The findings the note records explicitly, then the SAME examination
      // documented for the right and the left lung field separately, so a focal
      // finding is never flattened into a single chest-wide statement.
      S("distress", "Respiratory Distress", [
        "No distress at rest", "On exertion only", "At rest — mild", "At rest — moderate",
        "At rest — severe", "Unable to speak in sentences", NOT_DOCUMENTED,
      ]),
      S("accessory_muscles", "Accessory Muscle Use", [
        "None", "Mild", "Moderate", "Marked — with sternal recession", NOT_DOCUMENTED,
      ]),
      S("cyanosis", "Cyanosis", ["None", "Central", "Peripheral", "Central and peripheral", NOT_DOCUMENTED]),
      S("clubbing", "Finger Clubbing", [
        "Absent", "Present — grade documented", "Present — with tar staining", "Present — with signs of chronic suppuration", NOT_DOCUMENTED,
      ]),
      T("clubbing_detail", "Clubbing and Peripheral Signs Detail (grade, tar staining, flap, purpura)"),
      S("inspection_right", "Inspection — Right Hemithorax", [
        "Symmetrical movement", "Reduced movement", "Intercostal recession", "Bulging", "Surgical scar or drain site", NOT_DOCUMENTED,
      ]),
      S("inspection_left", "Inspection — Left Hemithorax", [
        "Symmetrical movement", "Reduced movement", "Intercostal recession", "Bulging", "Surgical scar or drain site", NOT_DOCUMENTED,
      ]),
      S("expansion_right", "Chest Expansion — Right", ["Normal", "Reduced", "Increased", NOT_DOCUMENTED]),
      S("expansion_left", "Chest Expansion — Left", ["Normal", "Reduced", "Increased", NOT_DOCUMENTED]),
      S("fremitus_right", "Tactile Vocal Fremitus — Right", ["Normal", "Increased", "Reduced", NOT_DOCUMENTED]),
      S("fremitus_left", "Tactile Vocal Fremitus — Left", ["Normal", "Increased", "Reduced", NOT_DOCUMENTED]),
      S("percussion_right", "Percussion — Right Lung Field", [
        "Resonant", "Dull", "Stony dull", "Hyper-resonant", "Tympanic", NOT_DOCUMENTED,
      ]),
      S("percussion_left", "Percussion — Left Lung Field", [
        "Resonant", "Dull", "Stony dull", "Hyper-resonant", "Tympanic", NOT_DOCUMENTED,
      ]),
      S("breath_sounds_right", "Breath Sounds — Right Lung Field", [
        "Vesicular", "Bronchial", "Reduced", "Absent", NOT_DOCUMENTED,
      ]),
      S("breath_sounds_left", "Breath Sounds — Left Lung Field", [
        "Vesicular", "Bronchial", "Reduced", "Absent", NOT_DOCUMENTED,
      ]),
      M("added_sounds_right", "Added Sounds — Right Lung Field", [
        "None", "Widespread wheeze", "Focal wheeze", "Coarse crackles", "Fine inspiratory crackles",
        "Pleural rub", "Stridor", NOT_DOCUMENTED,
      ]),
      M("added_sounds_left", "Added Sounds — Left Lung Field", [
        "None", "Widespread wheeze", "Focal wheeze", "Coarse crackles", "Fine inspiratory crackles",
        "Pleural rub", "Stridor", NOT_DOCUMENTED,
      ]),
      S("vocal_resonance_right", "Vocal Resonance — Right", ["Normal", "Increased", "Reduced", NOT_DOCUMENTED]),
      S("vocal_resonance_left", "Vocal Resonance — Left", ["Normal", "Increased", "Reduced", NOT_DOCUMENTED]),
      T("auscultation_detail", "Auscultation Detail — zone-by-zone findings, and how the patient was breathing during the examination"),
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

  // ---- Structured presentation -------------------------------------------
  pulm_presenting: {
    title: "Structured Presenting Complaints & History of Present Illness",
    fields: [
      M("complaints", "Presenting Complaints Recorded at This Visit", [
        "Cough", "Sputum production", "Breathlessness", "Wheeze", "Chest tightness",
        "Haemoptysis", "Fever", "Chest pain", "Snoring / witnessed apnoea",
        "Weight loss", "Night sweats", "Recurrent infection", "Incidental imaging finding",
        "Occupational assessment", "Other", NOT_DOCUMENTED,
      ]),
      I("duration_value", "Duration (number)"),
      S("duration_unit", "Duration Unit", ["Hours", "Days", "Weeks", "Months", "Years", NOT_DOCUMENTED]),
      S("onset", "Onset", ["Sudden", "Gradual", "Progressive", "Episodic / intermittent", NOT_DOCUMENTED]),
      S("course", "Course Since Onset", [
        "Improving", "Stable", "Worsening", "Fluctuating", "Resolved and recurred", NOT_DOCUMENTED,
      ]),
      M("associations", "Associated Symptoms Documented", [
        "Fever", "Night sweats", "Weight loss", "Ankle swelling", "Palpitations",
        "Chest pain", "Hoarseness", "Dysphagia", "Rash", "Joint symptoms",
        "None documented", NOT_DOCUMENTED,
      ]),
      T("hpi_narrative", "History of Present Illness — Narrative"),
      T("prior_treatment", "Treatment Already Taken for This Episode and the Response"),
      S("previous_episodes", "Previous Similar Episodes", [
        "First episode", "Recurrent — documented", "Seasonal pattern documented",
        "Related to a known trigger", "Not documented",
      ]),
    ],
  },

  // ---- Cough and sputum ---------------------------------------------------
  pulm_cough_sputum: {
    title: "Cough and Sputum Assessment",
    fields: [
      S("cough", "Cough as Documented", ["No cough", "Dry cough", "Productive cough", NOT_DOCUMENTED]),
      S("cough_duration", "Cough Duration", [
        "Less than 3 weeks (acute)", "3–8 weeks (subacute)", "More than 8 weeks (chronic)", NOT_DOCUMENTED,
      ], WHEN_IN("cough", ["Dry cough", "Productive cough"])),
      S("cough_timing", "Cough Timing", [
        "Mainly daytime", "Mainly nocturnal", "On waking", "Throughout the day and night", NOT_DOCUMENTED,
      ], WHEN_IN("cough", ["Dry cough", "Productive cough"])),
      M("cough_features", "Cough Features Documented", [
        "Paroxysmal", "Associated with wheeze", "Associated with breathlessness",
        "Associated with chest pain", "Post-prandial", "With vomiting", "None documented", NOT_DOCUMENTED,
      ], WHEN_IN("cough", ["Dry cough", "Productive cough"])),
      S("sputum_volume", "Sputum Volume as Documented", [
        "No sputum", "Less than a teaspoon daily", "Teaspoon to tablespoon daily",
        "More than a tablespoon daily", "Large volume — measured", NOT_DOCUMENTED,
      ], WHEN("cough", "Productive cough")),
      S("sputum_colour", "Sputum Colour", [
        "Clear / mucoid", "White", "Yellow", "Green", "Rust-coloured", "Blood-stained", "Frothy pink", NOT_DOCUMENTED,
      ], WHEN("cough", "Productive cough")),
      S("sputum_consistency", "Sputum Consistency", [
        "Thin", "Thick", "Frothy", "Plug-like", "Foul-smelling", NOT_DOCUMENTED,
      ], WHEN("cough", "Productive cough")),
      S("sputum_change", "Change From the Patient's Baseline", [
        "No change documented", "Increased volume", "Increased purulence", "Increased breathlessness with sputum change",
        "Not applicable — first episode", NOT_DOCUMENTED,
      ], WHEN("cough", "Productive cough")),
      S("haemoptysis", "Haemoptysis as Documented", [
        "None", "Blood streaking only", "Frank haemoptysis", "Massive haemoptysis", NOT_DOCUMENTED,
      ]),
    ],
  },

  // ---- Dyspnoea -----------------------------------------------------------
  pulm_dyspnoea: {
    title: "Dyspnoea Assessment (mMRC and Borg)",
    fields: [
      S("dyspnoea_presence", "Breathlessness as Documented", [
        "None", "On exertion only", "At rest and on exertion", "Orthopnoea only", NOT_DOCUMENTED,
      ]),
      S("mmrc_grade", "mMRC Grade Documented at This Visit", [
        "0 — Breathless only with strenuous exercise",
        "1 — Short of breath hurrying on level ground or walking up a slight hill",
        "2 — Walks slower than peers, or stops for breath at own pace on level ground",
        "3 — Stops for breath after about 100 metres or a few minutes on level ground",
        "4 — Too breathless to leave the house, or breathless when dressing",
        NOT_DOCUMENTED,
      ]),
      S("borg_rest", "Borg Breathlessness Rating at Rest", [
        "0 — Nothing at all", "0.5 — Very, very slight", "1 — Very slight", "2 — Slight", "3 — Moderate",
        "4 — Somewhat severe", "5 — Severe", "6", "7 — Very severe", "8", "9 — Very, very severe",
        "10 — Maximal", NOT_DOCUMENTED,
      ]),
      S("borg_exertion", "Borg Breathlessness Rating After the Documented Exertion", [
        "0 — Nothing at all", "0.5 — Very, very slight", "1 — Very slight", "2 — Slight", "3 — Moderate",
        "4 — Somewhat severe", "5 — Severe", "6", "7 — Very severe", "8", "9 — Very, very severe",
        "10 — Maximal", "Not assessed", NOT_DOCUMENTED,
      ]),
      I("borg_exertion_task", "Exertion the Rating Was Taken After (e.g. 20-metre walk, one flight of stairs)"),
      S("orthopnoea", "Orthopnoea", [
        "None", "Present — number of pillows documented", "Present — sleeps upright", NOT_DOCUMENTED,
      ]),
      S("pnd", "Paroxysmal Nocturnal Dyspnoea", ["None", "Present — documented", NOT_DOCUMENTED]),
      M("dyspnoea_features", "Dyspnoea Features Documented", [
        "Wheeze-associated", "Pleuritic", "Positional", "With cough", "With haemoptysis",
        "Progressive over weeks", "Sudden onset", "None documented", NOT_DOCUMENTED,
      ]),
      I("exertional_threshold", "Exertional Threshold as Documented (distance, stairs, activities)"),
      T("dyspnoea_impact", "Functional Impact of Breathlessness (work, self-care, mobility, sleep)"),
    ],
  },

  // ---- Previous respiratory history --------------------------------------
  pulm_past_respiratory: {
    title: "Previous Respiratory Illness, Admissions and Ventilation History",
    fields: [
      M("previous_illnesses", "Previous Respiratory Conditions Documented", [
        "Childhood asthma or wheeze", "Asthma", "Tuberculosis", "Pneumonia",
        "Pleural effusion or empyema", "Pneumothorax", "Bronchiectasis",
        "Interstitial lung disease", "Obstructive sleep apnoea", "Lung cancer",
        "Previous thoracic surgery", "None documented", NOT_DOCUMENTED,
      ]),
      N("admissions_12m", "Respiratory Hospital Admissions in the Last 12 Months"),
      N("admissions_lifetime", "Respiratory Hospital Admissions Documented Before That"),
      I("last_admission_date", "Date of the Most Recent Respiratory Admission"),
      S("icu_history", "Intensive Care Admission Documented", [
        "Never admitted to intensive care", "Previously admitted — detail documented",
        "Currently in intensive care", NOT_DOCUMENTED,
      ]),
      S("intubation_history", "Intubation History", [
        "Never intubated", "Previously intubated — detail documented",
        "Currently ventilated", "Not documented",
      ]),
      S("niv_history", "Non-Invasive Ventilation History", [
        "None documented", "Previous acute NIV", "Long-term nocturnal NIV", NOT_DOCUMENTED,
      ]),
      T("ventilation_detail", "Ventilation Detail (indication, date, duration, weaning, complications)", WHEN_IN("intubation_history", ["Previously intubated — detail documented", "Currently ventilated"])),
      T("known_microbiology", "Known Microbiology or Colonisation Documented (e.g. Pseudomonas, MRSA, non-tuberculous mycobacteria)"),
      I("last_chest_imaging", "Last Chest Imaging Documented and Its Date"),
    ],
  },

  // ---- Medication, allergy and comorbidity -------------------------------
  pulm_meds_allergies: {
    title: "Respiratory Medication, Allergy and Comorbidity Review",
    fields: [
      T("respiratory_medications", "Respiratory Medication as Documented (drug, dose, frequency, duration — the prescription itself lives in the medication record)"),
      M("therapy_classes", "Therapy Classes Documented", [
        "Short-acting bronchodilator", "Long-acting beta-agonist", "Long-acting muscarinic antagonist",
        "Inhaled corticosteroid", "Triple therapy", "Leukotriene receptor antagonist",
        "Theophylline", "Roflumilast", "Maintenance oral corticosteroid", "Steroid course",
        "Biologic therapy", "Long-term antibiotic", "Home oxygen", "CPAP or NIV",
        "Nebulised therapy", "None documented", NOT_DOCUMENTED,
      ]),
      M("relevant_other_medications", "Other Medications Relevant to Respiratory Care Documented", [
        "Beta-blocker", "NSAID", "ACE inhibitor", "Amiodarone", "Methotrexate",
        "Anticoagulant", "Opioid", "Sedative or benzodiazepine", "None documented", NOT_DOCUMENTED,
      ]),
      S("allergy_status", "Allergy Status as Documented", [
        "No known drug allergy documented",
        "Drug allergy documented — detail in the patient record",
        "Drug allergy documented — detail recorded below",
        "Not documented",
      ]),
      T("allergy_detail", "Allergy Detail Documented Here (drug, reaction, severity, when)"),
      M("comorbidities", "Comorbidities Documented at This Visit", [
        "Ischaemic heart disease", "Heart failure", "Atrial fibrillation", "Hypertension",
        "Diabetes", "Chronic kidney disease", "Obesity", "Anxiety or depression",
        "Osteoporosis", "Gastro-oesophageal reflux", "Obstructive sleep apnoea",
        "Active malignancy", "Immunosuppression", "None documented", NOT_DOCUMENTED,
      ]),
      T("comorbidity_impact", "How the Comorbidities Affect the Respiratory Plan"),
    ],
  },

  // ---- Vital signs and oxygen delivery -----------------------------------
  pulm_vitals: {
    title: "Vital Signs, Oxygen Saturation and Oxygen Delivery",
    fields: [
      S("measurement_context", "Measurement Context", [
        "Room air", "On supplemental oxygen", "On high-flow therapy", "On NIV",
        "On invasive ventilation", NOT_DOCUMENTED,
      ]),
      N("respiratory_rate", "Respiratory Rate"),
      N("heart_rate", "Heart Rate"),
      N("systolic_bp", "Systolic Blood Pressure"),
      N("diastolic_bp", "Diastolic Blood Pressure"),
      N("temperature", "Temperature"),
      N("spo2_air", "Oxygen Saturation on Room Air"),
      N("spo2_on_o2", "Oxygen Saturation on Supplemental Oxygen"),
      S("o2_device", "Oxygen Delivery Device", OXYGEN_SUPPORT),
      N("o2_flow", "Oxygen Flow Rate"),
      N("fio2", "FiO2"),
      S("target_range", "Prescribed Oxygen Target Range", [
        "94–98%", "88–92% (hypercapnia risk)", "Individualised range documented", NOT_DOCUMENTED,
      ]),
      I("peak_flow", "Peak Expiratory Flow as Documented"),
      S("consciousness", "Consciousness Level", [
        "Alert", "Responds to voice", "Responds to pain", "Unresponsive", NOT_DOCUMENTED,
      ]),
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

export const PULM_BLOCKS = {
  ...CORE_BLOCKS,
  ...PULM_COPD_BLOCKS,
  ...PULM_ASTHMA_BLOCKS,
  ...PULM_ACUTE_BLOCKS,
};

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
      // A calculated value is printed as calculated, together with the entries it
      // came from, so the arithmetic in an exported note can be checked by hand.
      if (f.type === "computed") {
        const calculated = typeof f.compute === "function" ? f.compute(v) : null;
        if (calculated === null || calculated === undefined || calculated === "") return "";
        return `${f.label}: ${calculated}${f.unit ? ` ${f.unit}` : ""} (calculated)`;
      }
      const raw = v[f.key];
      const text = Array.isArray(raw) ? raw.filter(Boolean).join("; ") : String(raw ?? "").trim();
      return text ? `${f.label}: ${text}` : "";
    })
    .filter(Boolean)
    .join("\n");
};