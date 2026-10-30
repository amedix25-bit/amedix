// Pediatrics — the clinical field sets the per-note blocks are built from.
//
// One set records one clinical question. A note picks only the sets its purpose
// needs, so the newborn record is not asked about school performance and the
// confidential adolescent note is not asked about the delivery room. Keys are
// prefixed per domain so two sets can never collide inside one block.
//
// A set states what to record, never a threshold the app invents: where a numeric
// threshold exists it belongs to a cited document and is written in the hint
// ("WHO IMCI: 60/min or more under 2 months"), and the value is recorded, not judged.

import { ageBreakdown, correctedAge, bmiValue, weightChangePercent, weightBasedDose, CORRECTION_CONVENTION } from "./pedsPatientMath.js";
import { str } from "./pedsFieldKit.js";

const ND = "Not documented";

const ageComputed = (values) => {
  const age = ageBreakdown(values.ctx_dob, values.ctx_assessed_on);
  return age ? age.text : null;
};

const correctedComputed = (values) => {
  const corrected = correctedAge(values.ctx_dob, values.ctx_ga_weeks, values.ctx_assessed_on, values.ctx_ga_days);
  return corrected ? corrected.text : null;
};

const bmiComputed = (values) => {
  const bmi = bmiValue(values.msr_weight_kg, values.msr_height_cm);
  return bmi === null ? null : `${bmi} kg/m² (arithmetic only — the app states no BMI percentile)`;
};

const weightChangeComputed = (values) => {
  const change = weightChangePercent(values.msr_baseline_weight_kg, values.msr_weight_kg);
  if (change === null) return null;
  return `${change}% of the baseline weight recorded on this note`;
};

const doseComputed = (values) => {
  const dose = weightBasedDose({
    weightKg: values.rx_weight_kg,
    perKg: values.rx_mg_per_kg,
    maxDose: values.rx_max_mg,
  });
  return dose ? dose.text : null;
};

export const PEDS_FIELD_SETS = {
  // ---- Who this child is, and where the story came from --------------------
  identity: [
    { key: "ctx_dob", label: "Date of birth used for the age calculation", type: "date", hint: "Auto-attached from the AMedix patient record where available. Entered here only when the calculation needs it." },
    { key: "ctx_assessed_on", label: "Assessment date", type: "date" },
    { key: "ctx_age_calc", label: "Age at assessment (calculated)", type: "computed", compute: ageComputed, hint: "Calculated from the two dates above. Nothing is assumed when either is blank." },
    { key: "ctx_age_value", label: "Age as recorded in the narrative", type: "number", hint: "The unit the clinician used — days for a newborn, months for an infant, years for a school-age child." },
    { key: "ctx_age_unit", label: "Age unit", type: "select", options: ["Days", "Weeks", "Months", "Years", ND] },
    { key: "ctx_ga_weeks", label: "Gestational age at birth", type: "number", unit: "weeks", min: 20, max: 45, hint: "Recorded before a corrected age can be stated." },
    { key: "ctx_ga_days", label: "Additional days of gestation", type: "number", unit: "days", min: 0, max: 6 },
    { key: "ctx_corrected_age", label: "Corrected age (calculated)", type: "computed", compute: correctedComputed, hint: CORRECTION_CONVENTION },
    { key: "ctx_caregiver", label: "History given by", type: "select", options: ["Parent", "Guardian", "Parent and patient", "Patient alone", "Other caregiver", ND] },
    { key: "ctx_history_source", label: "Source of the history", type: "multi", options: ["Caregiver report", "Patient report", "Referral letter", "Previous AMedix record", "Growth card", "Immunisation card", "Transfer summary", "Interpreter"] },
    { key: "ctx_history_reliability", label: "Reliability of the history", type: "select", options: ["Reliable", "Partially reliable — interpreter or language barrier", "Unreliable — details cannot be confirmed", ND] },
  ],

  nutrition: [
    { key: "nut_feeding", label: "Feeding", type: "select", options: ["Exclusive breastfeeding", "Breastfeeding with complementary feeds", "Formula", "Mixed feeding", "Family diet", "Tube feeding", ND] },
    { key: "nut_feeding_detail", label: "Feeds per day and volume taken", type: "input", placeholder: "e.g. 6 feeds/day, 90 mL each" },
    { key: "nut_intake_change", label: "Intake compared with usual", type: "select", options: ["Unchanged", "Reduced", "Refusing feeds", "Unable to feed", ND] },
    { key: "nut_urine_output", label: "Urine output", type: "select", options: ["Normal for age", "Reduced", "No urine passed in 12 hours", "No urine passed in 24 hours", ND] },
    { key: "nut_weight_loss", label: "Weight loss since birth or last visit", type: "select", options: ["None documented", "Less than 5%", "5–10%", "More than 10%", ND] },
  ],

  medsAllergy: [
    { key: "med_current_list", label: "Current medications — reconciled", type: "select", options: ["Reconciled with the caregiver", "Reconciled with the AMedix record", "Not reconciled — reason documented", ND] },
    { key: "med_allergy_status", label: "Allergies verified with the caregiver", type: "select", options: ["Verified — no known allergies", "Verified — allergy documented in the record", "Not verified", ND] },
    { key: "med_allergy_detail", label: "Allergy and reaction", type: "input", placeholder: "Drug or food, and the reaction observed" },
    { key: "med_past_history", label: "Relevant past history confirmed", type: "input", placeholder: "Admissions, chronic conditions, operations — as confirmed with the caregiver" },
  ],

  familySocial: [
    { key: "fam_family_history", label: "Family history relevant to this presentation", type: "input" },
    { key: "fam_household", label: "Household and caregivers", type: "multi", options: ["Both parents", "One parent", "Extended family", "Institutional care", "Recent displacement", "Financial difficulty affecting care", ND] },
    { key: "fam_school", label: "School or nursery", type: "select", options: ["Attending and coping", "Attending with difficulty", "Not attending — reason documented", "Not of school age", ND] },
    { key: "fam_safeguarding_screen", label: "Safeguarding screen at this visit", type: "select", options: ["No concern identified", "Concern identified — see safeguarding record", "Not screened — reason documented", ND] },
    { key: "fam_social_notes", label: "Social circumstances relevant to care", type: "textarea", placeholder: "Travel time to hospital, other children at home, who can bring the child back" },
  ],

  acuteHistory: [
    { key: "acu_onset", label: "Onset", type: "select", options: ["Under 24 hours", "1–3 days", "4–7 days", "More than 7 days", ND] },
    { key: "acu_course", label: "Course since onset", type: "select", options: ["Improving", "Static", "Worsening", "Fluctuating", ND] },
    { key: "acu_fever", label: "Fever documented at home", type: "select", options: ["Yes — measured", "Yes — felt hot, not measured", "No", ND] },
    { key: "acu_fever_treatment", label: "Antipyretic already given", type: "input", placeholder: "Drug, dose and time given by the caregiver" },
    { key: "acu_antibiotics", label: "Antibiotic already given", type: "select", options: ["None", "Yes — prescribed", "Yes — without prescription", ND] },
    { key: "acu_vomiting", label: "Vomiting", type: "select", options: ["None", "Occasional", "Persistent — unable to keep fluids down", ND] },
    { key: "acu_diarrhoea", label: "Diarrhoea", type: "select", options: ["None", "Watery, no blood", "Blood in stool", ND] },
    { key: "acu_contacts", label: "Exposures and contacts", type: "multi", options: ["Sick contact at home", "Outbreak at school or nursery", "Animal contact", "Travel outside the city", "Recent hospital contact", "No exposure identified"] },
    { key: "acu_red_flag_history", label: "Red-flag history documented", type: "multi", options: ["Apnoea or breathing pause", "Cyanotic episode", "Seizure", "Lethargy", "Poor feeding", "Bile-stained vomiting", "Bloody diarrhoea", "None documented"] },
  ],

  neonatalHistory: [
    { key: "neo_pregnancy", label: "Pregnancy complications", type: "multi", options: ["None documented", "Hypertension or pre-eclampsia", "Diabetes", "Infection in pregnancy", "Preterm labour", "Rupture of membranes over 18 hours", "Oligohydramnios", "Multiple pregnancy"] },
    { key: "neo_maternal_screen", label: "Maternal screening recorded", type: "multi", options: ["Group B streptococcus status known", "Blood group and antibody screen known", "Hepatitis B and HIV status known", "Syphilis screening known", "None available"] },
    { key: "neo_delivery_mode", label: "Mode of delivery", type: "select", options: ["Spontaneous vaginal", "Assisted vaginal", "Elective caesarean", "Emergency caesarean", ND] },
    { key: "neo_gestation_weeks", label: "Gestational age at birth", type: "number", unit: "weeks", min: 20, max: 45 },
    { key: "neo_birth_weight_g", label: "Birth weight", type: "number", unit: "g", min: 300, max: 7000 },
    { key: "neo_apgar", label: "Apgar recorded", type: "input", placeholder: "1 min / 5 min / 10 min" },
    { key: "neo_resuscitation", label: "Resuscitation at birth", type: "select", options: ["None", "Stimulation only", "Bag-mask ventilation", "Advanced resuscitation", ND] },
    { key: "neo_nicu_course", label: "Neonatal unit course", type: "select", options: ["Not admitted", "Admitted — respiratory support", "Admitted — infection treated", "Admitted — jaundice treated", "Admitted — feeding support", "Admitted — other", ND] },
    { key: "neo_cord_sepsis_risk", label: "Sepsis risk factors documented", type: "multi", options: ["Maternal fever in labour", "Prolonged rupture of membranes", "Group B streptococcus colonisation", "Preterm rupture of membranes", "None documented"] },
    { key: "neo_first_feed", label: "First feed", type: "select", options: ["Breastfed within 1 hour", "Breastfed later than 1 hour", "Formula", "Tube feeding", "Not yet fed", ND] },
  ],

  adolescentHistory: [
    { key: "ado_confidentiality", label: "Confidentiality", type: "select", options: ["Discussed and agreed with the adolescent", "Discussed — guardian present with consent", "Not discussed — reason documented", ND] },
    { key: "ado_confidential_limits", label: "Limits of confidentiality explained", type: "select", options: ["Explained — risk of harm to self or others, and abuse", "Not explained", ND] },
    { key: "ado_alone_time", label: "Seen alone for part of the consultation", type: "select", options: ["Yes", "No — reason documented", ND] },
    { key: "ado_school_work", label: "School, training or work", type: "input" },
    { key: "ado_peer_family", label: "Relationships and home", type: "select", options: ["No concern documented", "Conflict at home", "Bullying", "Social isolation", ND] },
    { key: "ado_mood_screen", label: "Mood and safety screen", type: "select", options: ["PHQ-A or institution screen — negative", "Screen positive — risk assessment documented", "Screen positive — risk assessment outstanding", "Asked directly — no concern documented", ND] },
    { key: "ado_substance", label: "Substance use", type: "select", options: ["None reported", "Tobacco or vaping", "Alcohol", "Cannabis", "Other substance", "Declined to answer", ND] },
    { key: "ado_sexual_health", label: "Sexual health", type: "select", options: ["Not applicable", "Discussed — no concern", "Contraception discussed", "STI risk assessed", "Declined to discuss", ND] },
  ],

  chronicHistory: [
    { key: "chr_condition", label: "Chronic condition this note follows", type: "input" },
    { key: "chr_duration", label: "Time since diagnosis", type: "input", placeholder: "e.g. 3 years" },
    { key: "chr_control", label: "Disease control documented", type: "select", options: ["Well controlled", "Partially controlled", "Poorly controlled", "In remission", ND] },
    { key: "chr_adherence", label: "Adherence", type: "select", options: ["Taking treatment as prescribed", "Missed doses documented", "Stopped treatment — reason documented", "Not assessed", ND] },
    { key: "chr_complications", label: "Complications documented", type: "multi", options: ["None documented", "Growth faltering", "Organ complication", "Frequent admissions", "School absence", "Psychosocial impact"] },
    { key: "chr_transition", label: "Transition to adult care", type: "select", options: ["Not yet relevant", "Discussed with the family", "Transition plan documented", "Transferred", ND] },
  ],

  measurements: [
    { key: "msr_weight_kg", label: "Weight", type: "number", unit: "kg", min: 0.3, max: 200, hint: "The weight every dose on this note is calculated from." },
    { key: "msr_length_cm", label: "Length or height", type: "number", unit: "cm", min: 20, max: 230 },
    { key: "msr_head_cm", label: "Head circumference", type: "number", unit: "cm", min: 20, max: 65 },
    { key: "msr_bmi_calc", label: "BMI (calculated)", type: "computed", compute: bmiComputed, hint: "Recorded only when a height is documented. The app does not assign a weight status." },
    { key: "msr_baseline_weight_kg", label: "Baseline weight for this episode", type: "number", unit: "kg", min: 0.3, max: 200 },
    { key: "msr_weight_change_calc", label: "Weight change from baseline (calculated)", type: "computed", compute: weightChangeComputed },
    { key: "msr_growth_reference", label: "Growth reference applied", type: "select", options: ["WHO child growth standards (0–5 years)", "WHO growth reference (5–19 years)", "Institution chart", "Not documented"], hint: "Recorded so the plotted position can be read against the chart it came from." },
    { key: "msr_weight_position", label: "Weight-for-age position as read from the chart", type: "input", placeholder: "e.g. between −1 and −2 SD; or the centile the chart showed" },
    { key: "msr_length_position", label: "Length- or height-for-age position", type: "input" },
    { key: "msr_head_position", label: "Head-circumference-for-age position", type: "input" },
    { key: "msr_growth_pattern", label: "Growth pattern across visits", type: "select", options: ["Following the same channel", "Crossing centiles upwards", "Crossing centiles downwards", "No previous measurement available", ND] },
  ],

  vitals: [
    { key: "vit_age_band", label: "Age band these thresholds are read against", type: "select", options: ["Under 2 months", "2–11 months", "12–59 months", "5–11 years", "12 years and over", ND] },
    { key: "vit_temp_c", label: "Temperature", type: "number", unit: "°C", min: 30, max: 43 },
    { key: "vit_temp_route", label: "Temperature route", type: "select", options: ["Axillary", "Tympanic", "Oral", "Rectal", "Forehead", ND] },
    { key: "vit_hr", label: "Heart rate", type: "number", unit: "/min", min: 20, max: 300 },
    { key: "vit_rr", label: "Respiratory rate", type: "number", unit: "/min", min: 5, max: 120, hint: "Counted over a full minute. WHO IMCI reads fast breathing as 60/min or more under 2 months, 50/min or more at 2–11 months and 40/min or more at 12–59 months." },
    { key: "vit_spo2", label: "Oxygen saturation", type: "number", unit: "%", min: 30, max: 100 },
    { key: "vit_oxygen", label: "Oxygen or respiratory support", type: "select", options: ["None", "Nasal prongs", "Face mask", "High-flow nasal oxygen", "CPAP", "Ventilated", ND] },
    { key: "vit_bp", label: "Blood pressure and cuff used", type: "input", placeholder: "e.g. 96/58 with a 6 cm cuff" },
    { key: "vit_bp_interpretation", label: "Blood pressure interpreted against age", type: "select", options: ["Normotensive for age as documented", "Elevated for age as documented", "Hypotensive for age as documented", "Not interpreted", "Not measured", ND] },
    { key: "vit_crt", label: "Capillary refill time", type: "select", options: ["Under 2 seconds", "2 seconds or more", "Not recorded", ND] },
    { key: "vit_consciousness", label: "Conscious level", type: "select", options: ["Alert", "Drowsy or irritable", "Responds to voice", "Responds to pain", "Unresponsive", NT()] },
    { key: "vit_pain", label: "Pain score and scale", type: "input", placeholder: "e.g. FLACC 4/10" },
  ],

  examSystems: [
    { key: "exs_general", label: "General appearance", type: "select", options: ["Well, interactive", "Unwell but alert", "Lethargic", "Irritable and inconsolable", ND] },
    { key: "exs_hydration", label: "Hydration", type: "select", options: ["No dehydration documented", "Some dehydration documented", "Severe dehydration documented", ND] },
    { key: "exs_perfusion", label: "Perfusion", type: "select", options: ["Warm peripheries, good perfusion documented", "Cool peripheries documented", "Mottled", ND] },
    { key: "exs_resp_work", label: "Work of breathing", type: "multi", options: ["No distress documented", "Tachypnoea", "Subcostal recession", "Intercostal recession", "Tracheal tug", "Grunting", "Nasal flaring", "Head bobbing", "Apnoea", "Stridor", "Wheeze audible"] },
    { key: "exs_resp_auscultation", label: "Chest auscultation", type: "multi", options: ["Clear and equal bilaterally", "Fine crackles", "Coarse crackles", "Wheeze", "Reduced air entry", "Pleural rub", ND] },
    { key: "exs_saturation_room_air", label: "Saturation in room air documented", type: "select", options: ["Yes — recorded above", "No — on oxygen at the time", "Not recorded", ND] },
    { key: "exs_cardiac", label: "Cardiovascular examination", type: "multi", options: ["Normal heart sounds documented", "Murmur documented", "Galop", "Femoral pulses normal", "Femoral pulses reduced", "Hepatomegaly documented", NT()] },
    { key: "exs_abdomen", label: "Abdominal examination", type: "multi", options: ["Soft and non-tender documented", "Distension", "Tenderness", "Organomegaly", "Mass", "Absent bowel sounds", ND] },
    { key: "exs_neuro", label: "Neurological examination", type: "multi", options: ["Alert and appropriate", "Anterior fontanelle normal", "Anterior fontanelle bulging", "Anterior fontanelle sunken", "Neck stiffness", "Tone normal for age", "Tone reduced", "Tone increased", "Seizure activity observed", ND] },
    { key: "exs_skin", label: "Skin and mucosae", type: "multi", options: ["No rash documented", "Non-blanching rash", "Petechiae", "Dry mucosae", "Cyanosis", "Jaundice", "Capillary haemangioma", ND] },
    { key: "exs_ent", label: "Ear, nose and throat", type: "multi", options: ["Normal otoscopy documented", "Bulging tympanic membrane", "Discharging ear", "Tonsillar exudate", "Not examined", ND] },
    { key: "exs_other", label: "Other systems examined", type: "textarea", placeholder: "Musculoskeletal, genitalia, developmental examination — what was found" },
  ],

  examNeonate: [
    { key: "exn_tone", label: "Tone and posture", type: "select", options: ["Normal for gestational age", "Reduced", "Increased", ND] },
    { key: "exn_reflexes", label: "Primitive reflexes", type: "multi", options: ["Moro present", "Suck present", "Root present", "Palmar grasp present", "Not assessed"] },
    { key: "exn_fontanelle", label: "Fontanelle", type: "select", options: ["Flat and soft", "Bulging", "Sunken", ND] },
    { key: "exn_umbilical", label: "Umbilical stump", type: "select", options: ["Clean and dry", "Redness at the base", "Discharge", "Bleeding", ND] },
    { key: "exn_skin_colour", label: "Colour", type: "multi", options: ["Pink and well perfused documented", "Central cyanosis", "Pallor", "Jaundice", "Plethora", "Mottling"] },
    { key: "exn_birth_injury", label: "Birth injury or anomaly documented", type: "input", placeholder: "Caput, cephalhaematoma, bruising, anomaly — or none documented" },
    { key: "exn_feeding_effectiveness", label: "Feeding observed", type: "select", options: ["Effective latch and suck documented", "Weak suck", "Unable to feed", "Not observed", ND] },
  ],

  examProcedure: [
    { key: "exp_procedure", label: "Procedure performed", type: "input" },
    { key: "exp_site", label: "Site and side", type: "input" },
    { key: "exp_consent", label: "Consent", type: "select", options: ["Written consent from parent or guardian", "Verbal consent documented", "Emergency treatment documented", "Not obtained — reason documented", ND] },
    { key: "exp_hold", label: "Comfort and holding", type: "multi", options: ["Comfort positioning", "Sucrose or breastfeeding", "Local anaesthetic", "Sedation", "General anaesthesia", "Play preparation"] },
    { key: "exp_airway", label: "Airway assessment before sedation", type: "select", options: ["Airway assessment documented as favourable", "Airway concern — senior review obtained", "Not applicable — no sedation", ND] },
    { key: "exp_asa", label: "Physical status recorded", type: "select", options: ["ASA I", "ASA II", "ASA III", "ASA IV", "Not recorded", ND] },
    { key: "exp_findings", label: "Findings and specimens", type: "textarea", placeholder: "What was found, what was sent and where" },
    { key: "exp_complications", label: "Complications", type: "select", options: ["None documented", "Bleeding", "Infection", "Failed attempt — repeated", "Other — documented below", ND] },
  ],

  assessment: [
    { key: "asm_severity", label: "Severity documented by the clinician", type: "select", options: ["Not acutely unwell", "Mild", "Moderate", "Severe", "Critical — resuscitation or immediate escalation", "Not classified", ND] },
    { key: "asm_leading", label: "Leading diagnosis documented", type: "input", placeholder: "The working label this note documents — coded separately in the diagnosis record" },
    { key: "asm_differentials", label: "Differential considerations recorded", type: "textarea", placeholder: "The alternatives considered and what argues for or against each" },
    { key: "asm_red_flags", label: "Red flags documented", type: "multi", options: ["None documented", "Age under 3 months with fever", "Apnoea", "Cyanosis", "Seizure", "Altered consciousness", "Signs of shock", "Severe dehydration", "Severe malnutrition", "Suspected serious bacterial infection", "Suspected non-accidental injury"] },
    { key: "asm_tool", label: "Validated tool used", type: "select", options: ["None used", "Paediatric early-warning score (institution)", "Paediatric Glasgow Coma Scale", "Pain scale (FLACC, Wong-Baker or institution)", "Dehydration score (institution)", "Asthma severity score (institution)", "M-CHAT-R/F", "ASQ-3", "Other — named in the reasoning"] },
    { key: "asm_tool_result", label: "Tool result and interpretation", type: "input", placeholder: "The score and what the clinician read it as" },
    { key: "asm_reasoning", label: "Clinical reasoning recorded", type: "textarea", placeholder: "What supports the assessment, what remains uncertain, and what would change it" },
  ],

  workup: [
    { key: "wkp_requested", label: "Tests requested and the question each answers", type: "textarea", placeholder: "Test — what decision it is expected to change" },
    { key: "wkp_available", label: "Results available at the time of this note", type: "multi", options: ["Full blood count", "C-reactive protein", "Blood culture", "Urine culture", "Urinalysis", "Electrolytes and renal function", "Blood gas", "Chest radiograph", "Lumbar puncture", "Malaria or rapid antigen test", "None returned yet"] },
    { key: "wkp_pending", label: "Outstanding at the time of this note", type: "input" },
    { key: "wkp_decision_effect", label: "Decision affected by an outstanding result", type: "input", placeholder: "What will change when the result returns, and who will review it" },
    { key: "wkp_interpretation", label: "How the available results were interpreted", type: "textarea", placeholder: "Values with the interpretation recorded by the clinician" },
  ],

  medication: [
    { key: "rx_weight_kg", label: "Weight used for this dose", type: "number", unit: "kg", min: 0.3, max: 200, hint: "The measured weight, never an estimate. A dose is not calculated without it." },
    { key: "rx_drug", label: "Medicine", type: "input", placeholder: "Generic name" },
    { key: "rx_mg_per_kg", label: "Dose prescribed per kilogram", type: "number", unit: "mg/kg" },
    { key: "rx_max_mg", label: "Maximum dose stated for this child", type: "number", unit: "mg", hint: "The ceiling from the formulary or the institution's dose reference." },
    { key: "rx_dose_calc", label: "Dose per administration (calculated)", type: "computed", compute: doseComputed, hint: "Arithmetic only: weight × mg/kg, with the stated maximum applied. The clinician confirms the result against the formulary." },
    { key: "rx_dose_given", label: "Dose actually given per administration", type: "number", unit: "mg" },
    { key: "rx_route", label: "Route", type: "select", options: ["Oral", "Intravenous", "Intramuscular", "Subcutaneous", "Inhaled", "Topical", "Rectal", "Nasogastric", ND] },
    { key: "rx_frequency", label: "Frequency", type: "input", placeholder: "e.g. every 8 hours" },
    { key: "rx_duration", label: "Duration", type: "input", placeholder: "e.g. 5 days" },
    { key: "rx_allergy_check", label: "Allergy check", type: "select", options: ["Checked — no allergy to this medicine", "Checked — allergy documented, medicine avoided", "Not checked", ND] },
    { key: "rx_contraindication_check", label: "Contraindications checked", type: "select", options: ["Checked — none documented", "Checked — contraindication documented, medicine withheld", "Not checked", ND] },
    { key: "rx_interaction_check", label: "Interactions checked against the current medicines", type: "select", options: ["Checked — none documented", "Checked — interaction documented and managed", "Not checked", ND] },
    { key: "rx_dose_basis_note", label: "Dose basis or adjustment", type: "input", placeholder: "Reduced for renal or hepatic impairment, capped at adult dose, or as stated in the formulary" },
  ],

  monitoring: [
    { key: "mon_parameters", label: "Parameters to be monitored", type: "multi", options: ["Respiratory rate", "Oxygen saturation", "Heart rate", "Temperature", "Blood pressure", "Conscious level", "Fluid balance and urine output", "Blood glucose", "Weight", "Pain score", "Feeding"] },
    { key: "mon_frequency", label: "Monitoring frequency", type: "select", options: ["Continuous", "Hourly", "Every 2–4 hours", "Every shift", "Twice daily", "Once daily", "At the next visit", ND] },
    { key: "mon_reassess_time", label: "Documented time of the next review", type: "input", placeholder: "e.g. 18:00 or after the next feed" },
    { key: "mon_response", label: "Response to treatment so far", type: "select", options: ["Improving", "Unchanged", "Worsening — action taken", "Not yet reassessed", ND] },
    { key: "mon_deterioration_trigger", label: "Deterioration triggers recorded for the team", type: "textarea", placeholder: "The documented findings that require the senior clinician to be called, and the route used" },
  ],

  disposition: [
    { key: "dsp_decision", label: "Disposition decided at this note", type: "select", options: ["Discharge home", "Observe in the department", "Admit to the ward", "Admit to high dependency", "Admit to intensive care", "Refer to a specialist team", "Transfer to another facility", "Not yet decided", ND] },
    { key: "dsp_criteria", label: "Criteria for that decision documented", type: "textarea", placeholder: "The findings that make this the safe disposition, and the ones that would have changed it" },
    { key: "dsp_referral_to", label: "Referred or transferred to", type: "input", placeholder: "Team, facility and the clinical question asked" },
    { key: "dsp_counselling", label: "Caregiver counselling recorded", type: "multi", options: ["Diagnosis explained in plain language", "Treatment and how to give it", "Feeding advice", "Warning signs explained", "Infection prevention advice", "Follow-up arrangements", "Nothing yet documented"] },
    { key: "dsp_teach_back", label: "Caregiver repeated the plan back correctly", type: "select", options: ["Yes", "Partially — explained again", "No — interpreter or written plan used", "Not documented", ND] },
    { key: "dsp_return_precautions", label: "Return precautions given", type: "textarea", placeholder: "The specific findings that mean the child must be brought back immediately" },
    { key: "dsp_followup_interval", label: "Follow-up interval", type: "select", options: ["24 hours", "48 hours", "72 hours", "1 week", "2 weeks", "1 month", "3 months", "As needed", "No follow-up required", ND] },
    { key: "dsp_followup_with", label: "Follow-up with", type: "select", options: ["Same clinician", "Paediatric clinic", "Primary care", "Specialist team", "Community or public health nurse", "Not arranged", ND] },
  ],
};

function NT() {
  return "Not documented";
}