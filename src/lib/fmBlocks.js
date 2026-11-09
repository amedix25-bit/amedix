// Family Medicine — structured clinical blocks.
//
// One registry for the whole specialty, so the note form, the saved record and the
// printed note read the same definitions. Every item is optional and nothing is
// pre-selected: a blank is "not documented", never a normal finding. Conditional
// items appear only where the recorded context makes them relevant.
//
// Nothing here diagnoses or treats. A block records what the clinician documented.

import { asObject, str, list } from "@/lib/fmFieldKit";

const YN = ["Yes", "No", "Not documented"];
const YNNA = ["Yes", "No", "Not applicable", "Not documented"];

export const FM_CORE_BLOCK = {
  key: "fm_core",
  title: "Core Consultation",
  note: "The full primary-care consultation: presenting problem, history, reconciliation, assessment and plan. A blank is not a negative finding.",
  fields: [
    { key: "presenting_complaint", label: "Presenting complaint", type: "text", placeholder: "In the patient's own words" },
    { key: "hpi_onset", label: "Onset", type: "text", placeholder: "When and how it started" },
    { key: "hpi_course", label: "Course since onset", type: "select", options: ["Improving", "Static", "Worsening", "Intermittent / recurrent", "Not documented"] },
    { key: "hpi_severity", label: "Severity and functional impact", type: "text", placeholder: "e.g. cannot work, sleep disturbed" },
    { key: "hpi_associated", label: "Associated symptoms reported", type: "text", placeholder: "As reported by the patient" },
    { key: "hpi_previous_episodes", label: "Previous episodes of this problem", type: "select", options: YN },
    { key: "pmh", label: "Past medical history", type: "text", placeholder: "Known conditions, with duration" },
    { key: "psh", label: "Past surgical history", type: "text", placeholder: "Operations and year" },
    { key: "family_history", label: "Family history", type: "text", placeholder: "Condition, relative, age at onset" },
    { key: "social_history", label: "Social history", type: "text", placeholder: "Occupation, household, housing, travel, substance use" },
    { key: "med_reconciliation_done", label: "Medication reconciliation performed", type: "select", options: YN },
    { key: "med_discrepancies", label: "Medication discrepancies found", type: "text", placeholder: "e.g. stopped statin without advice, duplicate antihypertensive" },
    { key: "allergy_reviewed", label: "Allergy list reviewed with the patient", type: "select", options: YN },
    { key: "ros", label: "Review of systems — positives only", type: "text", placeholder: "Constitutional, cardiovascular, respiratory, GI, GU, neuro, MSK, skin, psychiatric" },
    { key: "examination", label: "Physical examination findings", type: "text", placeholder: "Only systems examined; state what was examined" },
    { key: "assessment", label: "Assessment / clinical impression", type: "text" },
    { key: "differentials", label: "Differential diagnoses considered", type: "text", placeholder: "Alternatives considered and why less likely" },
    { key: "investigations_planned", label: "Investigation plan", type: "text", placeholder: "Test, reason, where and when" },
    { key: "treatment_plan", label: "Treatment plan", type: "text", placeholder: "Pharmacological and non-pharmacological; no dose is suggested by AMedix" },
    { key: "patient_education", label: "Education and shared decision-making", type: "text" },
    { key: "safety_netting", label: "Safety-netting advice given", type: "text", placeholder: "What to do if symptoms change, and where to go" },
    { key: "follow_up_interval", label: "Follow-up", type: "text", placeholder: "e.g. review in 2 weeks, or as needed" },
    { key: "referral", label: "Referral made or considered", type: "text", placeholder: "Specialty, urgency, question asked" },
  ],
};

export const FM_ACUTE_BLOCK = {
  key: "fm_acute",
  title: "Acute Presentation",
  note: "For an acute illness visit. Red-flag features are recorded as asked — a feature not recorded is not the same as absent.",
  fields: [
    { key: "onset_duration", label: "Duration of symptoms", type: "text", placeholder: "e.g. 2 days" },
    { key: "fever", label: "Fever reported or measured", type: "select", options: ["Measured ≥38.0 °C", "Reported but not measured", "No fever", "Not documented"] },
    { key: "systemic_features", label: "Systemic features", type: "multi", options: ["Rigors", "Weight loss", "Night sweats", "Malaise", "Poor oral intake", "Vomiting", "Diarrhoea", "None documented"] },
    { key: "red_flags_asked", label: "Red-flag screen performed", type: "select", options: YN },
    { key: "red_flags_present", label: "Red-flag features present", type: "multi", options: ["Chest pain", "Breathlessness at rest", "Focal neurological deficit", "Severe abdominal pain", "Peritonism / rigidity", "Non-blanching rash", "Altered mental state", "Dehydration", "Bleeding", "Suicidal ideation", "None documented"] },
    { key: "hydration", label: "Hydration assessment", type: "select", options: ["Adequately hydrated", "Mildly dehydrated", "Severely dehydrated", "Not assessed"] },
    { key: "focused_exam", label: "Focused examination", type: "text" },
    { key: "point_of_care", label: "Point-of-care tests done", type: "multi", options: ["Blood glucose", "Urinalysis", "Pregnancy test", "Rapid antigen test", "ECG", "Peak flow", "SpO2", "None documented"] },
    { key: "working_diagnosis", label: "Working diagnosis", type: "text" },
    { key: "disposition", label: "Disposition", type: "select", options: ["Managed at home", "Observed in clinic", "Referred to emergency department", "Admitted", "Referred to specialist clinic", "Not documented"] },
    { key: "return_precautions", label: "Return precautions given", type: "text", placeholder: "Specific symptoms and time frame for returning" },
  ],
};

export const FM_CHILD_BLOCK = {
  key: "fm_child",
  title: "Child Health",
  note: "Paediatric primary care. Measurements are recorded as taken; percentiles are read from the WHO growth charts and are never computed by AMedix.",
  fields: [
    { key: "age_months", label: "Age at visit", type: "number", unit: "months", min: 0, max: 216 },
    { key: "weight_kg", label: "Weight", type: "number", unit: "kg", min: 0.5, max: 120 },
    { key: "height_cm", label: "Length / height", type: "number", unit: "cm", min: 30, max: 210 },
    { key: "head_circumference_cm", label: "Head circumference (under 2 years)", type: "number", unit: "cm", min: 25, max: 60 },
    { key: "muac_cm", label: "Mid-upper arm circumference", type: "number", unit: "cm", min: 8, max: 35 },
    { key: "growth_chart_note", label: "Growth chart plotted", type: "select", options: ["Plotted on WHO chart", "Measurements recorded only", "Not documented"] },
    { key: "feeding", label: "Feeding", type: "select", options: ["Exclusive breastfeeding", "Breastfeeding with complementary feeds", "Formula feeding", "Mixed feeding", "Family diet", "Not documented"] },
    { key: "development_concern", label: "Developmental concern", type: "select", options: ["No concern documented", "Concern — gross motor", "Concern — fine motor", "Concern — speech and language", "Concern — social interaction", "Concern — multiple domains", "Regression noted"] },
    { key: "milestones", label: "Milestones achieved (as reported)", type: "text", placeholder: "e.g. sits unsupported 7 months, first words 13 months" },
    { key: "immunization_reviewed", label: "Immunization status reviewed", type: "select", options: YN },
    { key: "school", label: "School / nursery and attendance", type: "text" },
    { key: "parental_concern", label: "Parental concern recorded", type: "text", placeholder: "In the parent's own words" },
    { key: "child_red_flags", label: "Serious-illness features present", type: "multi", options: ["Age under 3 months with fever ≥38 °C", "Lethargy or floppiness", "Poor feeding", "Reduced urine output", "Non-blanching rash", "Grunting or recessions", "Seizure", "Inconsolable crying", "Bilious vomiting", "None documented"] },
  ],
};

export const FM_GERIATRIC_BLOCK = {
  key: "fm_geriatric",
  title: "Geriatric Assessment",
  note: "Comprehensive assessment of the older adult. Function, cognition, falls, continence and nutrition are documented separately — a blank is not a normal finding.",
  fields: [
    { key: "living_situation", label: "Living situation", type: "select", options: ["Lives alone", "Lives with family", "Assisted living", "Residential care", "Nursing home", "Not documented"] },
    { key: "carer", label: "Main carer", type: "text", placeholder: "Who helps, and how often" },
    { key: "adl", label: "Activities of daily living", type: "select", options: ["Independent", "Needs some help", "Needs substantial help", "Dependent", "Not documented"] },
    { key: "iadl", label: "Instrumental ADL (shopping, finances, transport, medicines)", type: "select", options: ["Independent", "Needs some help", "Dependent", "Not documented"] },
    { key: "mobility_aid", label: "Mobility", type: "select", options: ["Unaided", "Stick", "Frame / walker", "Wheelchair", "Bedbound", "Not documented"] },
    { key: "falls_past_year", label: "Falls in the past year", type: "select", options: ["None", "One", "Two", "Three or more", "Not documented"] },
    { key: "fall_injury", label: "Injury from a fall", type: "text", placeholder: "e.g. wrist fracture, no injury" },
    { key: "dizziness_orthostatic", label: "Dizziness or postural symptoms", type: "select", options: YN },
    { key: "continence", label: "Continence", type: "select", options: ["Continent", "Urinary incontinence", "Faecal incontinence", "Catheter", "Not documented"] },
    { key: "cognition", label: "Cognition", type: "select", options: ["No concern documented", "Subjective decline", "Documented diagnosis", "Delirium suspected", "Not assessed"] },
    { key: "delirium_features", label: "Acute change in attention or awareness", type: "select", options: ["Present", "Absent", "Not assessed"] },
    { key: "nutrition", label: "Nutrition", type: "select", options: ["No concern documented", "Weight loss documented", "Poor intake", "Dysphagia", "Dietitian involved", "Not assessed"] },
    { key: "sensory", label: "Sensory function", type: "multi", options: ["Visual impairment", "Hearing impairment", "Both", "None documented"] },
    { key: "polypharmacy", label: "Regular medicines", type: "number", unit: "medicines", min: 0, max: 40 },
    { key: "psychosocial", label: "Psychosocial screen", type: "multi", options: ["Lives alone", "Bereavement", "Financial difficulty", "Carer strain", "Safeguarding concern", "None documented"] },
    { key: "advance_care", label: "Advance care plan / treatment escalation", type: "select", options: ["Documented and discussed", "Discussed today", "Not documented", "Patient declined discussion"] },
    { key: "pressure_injury", label: "Pressure injury risk", type: "select", options: ["No concern documented", "At risk — prevention advised", "Existing pressure injury", "Not assessed"] },
  ],
};

export const FM_WOMENS_BLOCK = {
  key: "fm_women",
  title: "Women's Health",
  note: "Menstrual, contraceptive, screening and pregnancy status. Pregnancy status is recorded before any prescribing decision.",
  fields: [
    { key: "lmp", label: "Last menstrual period", type: "text", placeholder: "Date, or 'not applicable'" },
    { key: "cycle", label: "Menstrual cycle", type: "select", options: ["Regular", "Irregular", "Oligomenorrhoea", "Amenorrhoea", "Postmenopausal", "Not documented"] },
    { key: "pregnancy_status", label: "Pregnancy status", type: "select", options: ["Not pregnant", "Pregnant", "Possible — test pending", "Postpartum", "Not applicable", "Not documented"] },
    { key: "gestation", label: "Gestation if pregnant", type: "text", placeholder: "Weeks + days, or estimated date of delivery" },
    { key: "contraception", label: "Contraception", type: "select", options: ["None", "Combined hormonal", "Progestogen-only", "Copper IUD", "Hormonal IUD", "Barrier", "Sterilisation", "Not documented"] },
    { key: "cervical_screening", label: "Cervical screening status", type: "select", options: ["Up to date", "Due", "Never screened", "Not applicable", "Not documented"] },
    { key: "breast_screening", label: "Breast screening status", type: "select", options: ["Up to date", "Due", "Not applicable by age", "Not documented"] },
    { key: "breast_symptoms", label: "Breast symptoms", type: "multi", options: ["Lump", "Nipple discharge", "Skin change", "Pain", "None documented"] },
    { key: "pelvic_symptoms", label: "Pelvic symptoms", type: "multi", options: ["Abnormal bleeding", "Postcoital bleeding", "Pelvic pain", "Discharge", "Prolapse symptoms", "None documented"] },
    { key: "menopause", label: "Menopausal status and symptoms", type: "text" },
    { key: "preconception", label: "Preconception counselling", type: "select", options: ["Discussed", "Not indicated", "Declined", "Not documented"] },
    { key: "folic_acid", label: "Preconception folic acid discussed", type: "select", options: [...YN, "Already taking"] },
    { key: "postnatal", label: "Postnatal review (if applicable)", type: "text", placeholder: "Weeks postpartum, feeding, mood, wound, contraception" },
  ],
};

export const FM_MATERNAL_BLOCK = {
  key: "fm_maternal",
  title: "Antenatal / Postnatal Primary-Care Review",
  note: "Primary-care review alongside maternity care. It records what was checked and refers — it does not replace obstetric assessment.",
  fields: [
    { key: "stage", label: "Stage", type: "select", options: ["Antenatal — first contact", "Antenatal — routine review", "Postnatal — within 7 days", "Postnatal — 6-week review", "Not documented"] },
    { key: "gestation_weeks", label: "Gestation", type: "number", unit: "weeks", min: 0, max: 45 },
    { key: "gravida_para", label: "Gravida / para", type: "text", placeholder: "e.g. G3 P2" },
    { key: "bp_reviewed", label: "Blood pressure reviewed", type: "select", options: YN },
    { key: "danger_signs", label: "Danger signs present", type: "multi", options: ["Vaginal bleeding", "Severe headache", "Visual disturbance", "Epigastric pain", "Reduced fetal movements", "Fever", "Dysuria", "Severe abdominal pain", "None documented"] },
    { key: "supplements", label: "Supplements", type: "multi", options: ["Folic acid", "Iron", "Vitamin D", "Calcium", "None documented"] },
    { key: "feeding", label: "Infant feeding", type: "select", options: ["Exclusive breastfeeding", "Mixed feeding", "Formula feeding", "Not applicable", "Not documented"] },
    { key: "mood_screen", label: "Perinatal mood screen", type: "select", options: ["No concern documented", "Low mood reported", "Validated screen completed", "Urgent concern — same-day review", "Not assessed"] },
    { key: "wound", label: "Perineal / caesarean wound", type: "select", options: ["Healing normally", "Concern documented", "Not applicable", "Not examined"] },
    { key: "contraception_postnatal", label: "Postnatal contraception discussed", type: "select", options: YN },
    { key: "referral_to_maternity", label: "Referred to maternity / obstetric team", type: "select", options: [...YN, "Not applicable"] },
  ],
};

export const FM_VACCINE_BLOCK = {
  key: "fm_vaccine",
  title: "Vaccination Record",
  note: "One entry per vaccine given. Batch and site are recorded so a dose can be traced; consent is recorded, never assumed.",
  fields: [
    { key: "vaccine_name", label: "Vaccine", type: "text", placeholder: "As written on the vial" },
    { key: "dose_number", label: "Dose number in series", type: "number", min: 1, max: 10 },
    { key: "batch_number", label: "Batch / lot number", type: "text" },
    { key: "expiry", label: "Expiry date on the vial", type: "text" },
    { key: "route_site", label: "Route and site", type: "text", placeholder: "e.g. IM left deltoid" },
    { key: "given_datetime", label: "Date and time given", type: "text" },
    { key: "consent", label: "Consent", type: "select", options: ["Verbal consent recorded", "Written consent recorded", "Consent given by parent / guardian", "Patient declined", "Not documented"] },
    { key: "screening_before_dose", label: "Pre-vaccination screening", type: "multi", options: ["Acute illness screen", "Allergy screen", "Pregnancy screen", "Previous reaction reviewed", "Immunosuppression reviewed", "None documented"] },
    { key: "reaction", label: "Immediate reaction", type: "select", options: ["None observed", "Local reaction", "Systemic reaction", "Anaphylaxis — emergency pathway activated", "Not documented"] },
    { key: "observation", label: "Post-vaccination observation", type: "text", placeholder: "Duration observed and condition" },
    { key: "next_due", label: "Next dose due", type: "text" },
    { key: "recorded_in_register", label: "Entered in the national immunization register", type: "select", options: YNNA },
  ],
};

export const FM_MENTAL_BLOCK = {
  key: "fm_mental",
  title: "Mental Health Assessment",
  note: "Risk is asked about directly and recorded as answered. A blank risk field is not evidence that risk is absent.",
  fields: [
    { key: "presenting_concern", label: "Presenting concern", type: "text" },
    { key: "duration", label: "Duration", type: "text", placeholder: "e.g. 3 months, worse in the last 2 weeks" },
    { key: "functional_impact", label: "Functional impact", type: "select", options: ["None", "Interferes with work or study", "Interferes with relationships", "Unable to work", "Unable to care for self", "Not documented"] },
    { key: "suicidal_ideation", label: "Thoughts of self-harm or suicide", type: "select", options: ["Denies", "Passive thoughts of not wanting to be here", "Active thoughts without plan", "Active thoughts with plan", "Not asked"] },
    { key: "self_harm", label: "Self-harm history or current", type: "select", options: ["None", "Historical", "Recent — within 12 months", "Current", "Not asked"] },
    { key: "risk_to_others", label: "Risk to others", type: "select", options: ["Denies", "Ideation reported", "Specific threat reported", "Not asked"] },
    { key: "protective_factors", label: "Protective factors", type: "multi", options: ["Family support", "Engaged with services", "Children or dependants", "Religious or personal beliefs", "Employment", "Future plans", "None documented"] },
    { key: "substance_use", label: "Substance use", type: "multi", options: ["Alcohol", "Tobacco", "Cannabis", "Opioids", "Sedatives without prescription", "Stimulants", "None documented"] },
    { key: "sleep", label: "Sleep", type: "text" },
    { key: "previous_treatment", label: "Previous mental-health treatment", type: "text" },
    { key: "safety_plan", label: "Safety plan agreed", type: "select", options: [...YNNA, "Not indicated"] },
    { key: "crisis_contacts_given", label: "Crisis contacts given", type: "select", options: YNNA },
    { key: "referral_made", label: "Referral to mental-health services", type: "select", options: ["Routine", "Urgent", "Emergency — same day", "Not indicated", "Patient declined", "Not documented"] },
  ],
};

export const FM_LIFESTYLE_BLOCK = {
  key: "fm_lifestyle",
  title: "Lifestyle and Risk Factors",
  note: "Behaviour is recorded as the patient reports it, with readiness to change — advice is offered, never assumed to have been accepted.",
  fields: [
    { key: "smoking_status", label: "Smoking", type: "select", options: ["Never smoked", "Ex-smoker", "Current smoker", "Waterpipe / shisha", "Not documented"] },
    { key: "cigarettes_per_day", label: "Cigarettes per day", type: "number", min: 0, max: 100 },
    { key: "pack_years", label: "Pack-years", type: "number", min: 0, max: 150 },
    { key: "quit_date", label: "Quit date (ex-smoker)", type: "text" },
    { key: "readiness_smoking", label: "Readiness to stop smoking", type: "select", options: ["Not ready", "Considering", "Preparing", "Actively quitting", "Not applicable"] },
    { key: "alcohol_units", label: "Alcohol units per week", type: "number", min: 0, max: 200 },
    { key: "physical_activity", label: "Physical activity", type: "select", options: ["150 minutes/week or more", "Some activity, below 150 minutes", "Sedentary", "Not documented"] },
    { key: "diet", label: "Diet pattern", type: "select", options: ["Balanced", "High processed food", "High sugar intake", "Low fruit and vegetable intake", "Skipping meals", "Not documented"] },
    { key: "weight_kg", label: "Weight", type: "number", unit: "kg", min: 1, max: 400 },
    { key: "height_cm", label: "Height", type: "number", unit: "cm", min: 50, max: 250 },
    { key: "waist_cm", label: "Waist circumference", type: "number", unit: "cm", min: 30, max: 250 },
    { key: "sleep_hours", label: "Usual sleep", type: "number", unit: "hours/night", min: 0, max: 24 },
    { key: "counselling_given", label: "Brief counselling given", type: "multi", options: ["Smoking cessation", "Alcohol reduction", "Physical activity", "Diet", "Weight management", "Sleep", "None documented"] },
    { key: "goal_agreed", label: "Goal agreed with the patient", type: "text", placeholder: "Specific, patient-owned goal" },
    { key: "referral", label: "Referral for lifestyle support", type: "multi", options: ["Smoking cessation service", "Dietitian", "Exercise programme", "Weight-management programme", "None documented"] },
  ],
};

export const FM_CHRONIC_BLOCK = {
  key: "fm_chronic",
  title: "Chronic Disease Review",
  note: "One review for the long-term condition. Monitoring that is due is recorded as done, booked or declined — never assumed.",
  fields: [
    { key: "condition_focus", label: "Condition reviewed", type: "multi", options: ["Hypertension", "Type 2 diabetes", "Type 1 diabetes", "Asthma", "COPD", "Chronic kidney disease", "Ischaemic heart disease", "Heart failure", "Dyslipidaemia", "Thyroid disease", "Obesity", "Depression or anxiety", "Other"] },
    { key: "control_assessment", label: "Overall control", type: "select", options: ["Well controlled", "Partially controlled", "Uncontrolled", "Not documented"] },
    { key: "adherence", label: "Medication adherence", type: "select", options: ["Good", "Partial", "Poor", "Stopped by patient", "Not documented"] },
    { key: "adherence_reason", label: "Reason for poor adherence", type: "text", placeholder: "Cost, side effects, forgetfulness, beliefs" },
    { key: "side_effects", label: "Side effects reported", type: "text" },
    { key: "monitoring_done", label: "Monitoring completed this visit", type: "multi", options: ["Blood pressure", "HbA1c", "Lipid profile", "Renal function / eGFR", "Urine albumin-to-creatinine ratio", "Foot examination", "Retinal screening", "Spirometry", "Symptom score", "None documented"] },
    { key: "monitoring_due", label: "Monitoring due but not done", type: "text", placeholder: "What is outstanding and when it is booked" },
    { key: "complication_review", label: "Complication review", type: "multi", options: ["No complication documented", "Neuropathy", "Retinopathy", "Nephropathy", "Peripheral arterial disease", "Heart failure", "None assessed"] },
    { key: "targets_agreed", label: "Targets agreed with the patient", type: "text", placeholder: "Individualised targets and the reason for them" },
    { key: "medication_changes", label: "Medication changes made", type: "text" },
    { key: "self_management", label: "Self-management plan", type: "text" },
    { key: "next_review", label: "Next review", type: "text" },
  ],
};

export const FM_PREVENTIVE_BLOCK = {
  key: "fm_preventive",
  title: "Preventive Health Review",
  note: "Screening and prevention discussed at this visit. What is recorded here is what was discussed and decided, not what the guideline recommends for everyone.",
  fields: [
    { key: "visit_type", label: "Visit type", type: "select", options: ["Adult health check", "Well-child visit", "Antenatal / postnatal", "Pre-travel", "Pre-employment", "Opportunistic prevention", "Not documented"] },
    { key: "risk_factors", label: "Risk factors documented", type: "multi", options: ["Smoking", "Obesity", "Sedentary lifestyle", "Family history of premature cardiovascular disease", "Diabetes", "Hypertension", "Dyslipidaemia", "Chronic kidney disease", "Alcohol excess", "None documented"] },
    { key: "cvd_risk_discussed", label: "Cardiovascular risk discussed", type: "select", options: [...YN, "Calculated from a validated chart"] },
    { key: "cvd_risk_value", label: "Documented 10-year cardiovascular risk", type: "text", placeholder: "Value read from the chart used, and which chart" },
    { key: "screening_discussed", label: "Screening discussed", type: "multi", options: ["Blood pressure", "Diabetes", "Lipids", "Colorectal cancer", "Cervical cancer", "Breast cancer", "Lung cancer", "Hepatitis B", "Hepatitis C", "HIV", "Osteoporosis", "Depression", "Anxiety", "Latent tuberculosis", "None documented"] },
    { key: "screening_declined", label: "Screening declined by the patient", type: "text", placeholder: "Which test, and the reason given" },
    { key: "immunization_discussed", label: "Immunization discussed", type: "select", options: YN },
    { key: "chemoprevention", label: "Chemoprevention discussed", type: "text", placeholder: "e.g. statin for risk, aspirin — with the decision recorded" },
    { key: "counselling", label: "Counselling provided", type: "text" },
    { key: "next_due", label: "Next preventive review", type: "text" },
  ],
};

export const FM_BLOCKS = {
  [FM_CORE_BLOCK.key]: FM_CORE_BLOCK,
  [FM_ACUTE_BLOCK.key]: FM_ACUTE_BLOCK,
  [FM_CHILD_BLOCK.key]: FM_CHILD_BLOCK,
  [FM_GERIATRIC_BLOCK.key]: FM_GERIATRIC_BLOCK,
  [FM_WOMENS_BLOCK.key]: FM_WOMENS_BLOCK,
  [FM_MATERNAL_BLOCK.key]: FM_MATERNAL_BLOCK,
  [FM_VACCINE_BLOCK.key]: FM_VACCINE_BLOCK,
  [FM_MENTAL_BLOCK.key]: FM_MENTAL_BLOCK,
  [FM_LIFESTYLE_BLOCK.key]: FM_LIFESTYLE_BLOCK,
  [FM_CHRONIC_BLOCK.key]: FM_CHRONIC_BLOCK,
  [FM_PREVENTIVE_BLOCK.key]: FM_PREVENTIVE_BLOCK,
};

export const FM_BLOCK_KEYS = Object.keys(FM_BLOCKS);

export const fmBlock = (key) => FM_BLOCKS[key] || null;

// The saved value keeps its block identity, so a reader always knows which block a
// value belongs to even after the template changes.
export const fmBlockValue = (blockKey, values) => ({ __block: blockKey, ...asObject(values) });

export const fmBlockFrom = (value) => fmBlock(asObject(value).__block);

export const fmBlockValues = (values, blockKey) => asObject(asObject(values)[blockKey]);

export const blockHasContent = (values, blockKey) =>
  Object.entries(fmBlockValues(values, blockKey)).some(([k, v]) =>
    k === "__block" ? false : Array.isArray(v) ? v.length > 0 : str(v) !== "",
  );

// Printed form of one block, in the order its own definition declares.
export const formatFmBlock = (value) => {
  const v = asObject(value);
  const spec = fmBlockFrom(value);
  if (!spec) return "";
  const lines = spec.fields
    .map((f) => {
      const raw = v[f.key];
      if (f.type === "multi") {
        const items = list(raw);
        return items.length ? `${f.label}: ${items.join("; ")}` : null;
      }
      const val = str(raw);
      return val ? `${f.label}: ${val}${f.unit ? ` ${f.unit}` : ""}` : null;
    })
    .filter(Boolean);
  if (!lines.length) return `${spec.title} — not documented in this note.`;
  return lines.join("\n");
};