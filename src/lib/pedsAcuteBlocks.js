// Pediatrics — the acute-assessment blocks: IMCI danger signs and triage, fever in
// the young infant, respiratory distress, and diarrhoea with dehydration.
//
// The thresholds recorded here are the ones the cited documents publish (WHO IMCI
// age-specific fast breathing, WHO oxygen saturation, WHO dehydration signs). The
// block records whether the threshold was met; it never decides the diagnosis.

const NOT_DOCUMENTED = "Not documented";

export const TRIAGE_BLOCK = {
  key: "peds_triage",
  title: "IMCI danger signs & triage record",
  note:
    "The WHO general danger signs decide urgency: a child with any one of them is classified as requiring urgent referral or admission, whatever the working diagnosis. The age-specific fast-breathing thresholds are 60/min under 2 months, 50/min at 2–11 months and 40/min at 12–59 months.",
  fields: [
    { key: "tri_age_band", label: "Age band used for the thresholds", type: "select", options: ["Under 2 months", "2–11 months", "12–59 months", "5 years or older", NOT_DOCUMENTED] },
    {
      key: "tri_danger_signs",
      label: "WHO general danger signs documented",
      type: "multi",
      options: [
        "Unable to drink or breastfeed",
        "Vomits everything",
        "Convulsions during this illness",
        "Convulsing now",
        "Lethargic or unconscious",
        "Not feeding well (young infant)",
      ],
    },
    { key: "tri_conscious", label: "Level of consciousness", type: "select", options: ["Alert", "Restless or irritable", "Lethargic", "Unconscious", NOT_DOCUMENTED] },
    { key: "tri_resp_rate", label: "Respiratory rate", type: "number", unit: "/min", min: 5, max: 120 },
    { key: "tri_fast_breathing", label: "Fast breathing for this age band", type: "select", options: ["Present", "Absent", "Not assessed", NOT_DOCUMENTED], hint: "Recorded as assessed against the age band above." },
    { key: "tri_chest_indrawing", label: "Lower chest wall indrawing", type: "select", options: ["Present", "Absent", NOT_DOCUMENTED] },
    { key: "tri_stridor", label: "Stridor when calm", type: "select", options: ["Present", "Absent", NOT_DOCUMENTED] },
    { key: "tri_spo2", label: "Oxygen saturation", type: "number", unit: "%", min: 40, max: 100 },
    {
      key: "tri_classification",
      label: "Triage classification documented",
      type: "select",
      options: ["No general danger sign", "General danger sign present — urgent", "Not classified", NOT_DOCUMENTED],
    },
    {
      key: "tri_action",
      label: "Action taken",
      type: "multi",
      options: ["Treated as outpatient", "Admitted", "Referred urgently", "Resuscitation commenced", "Pre-referral treatment given", "Observed and reassessed"],
    },
    { key: "tri_action_time", label: "Time the action was recorded", type: "input", placeholder: "Date and time the classification and action were documented" },
    { key: "tri_referral_route", label: "Referral destination", type: "input", placeholder: "Where the child was sent and how — the institution's own route" },
    { key: "tri_notes", label: "Triage notes", type: "textarea" },
  ],
};

export const FEVER_BLOCK = {
  key: "peds_fever",
  title: "Fever in the young infant & child record",
  note:
    "Age decides the pathway. The AAP febrile-infant guideline covers well-appearing term infants aged 8 to 60 days and uses inflammatory markers with a lumbar-puncture decision; an infant of 28 days or less is not managed as low risk. WHO guidance classifies any fever under 2 months as severe disease requiring urgent referral. The pathway applied is recorded — the two are never blended.",
  fields: [
    { key: "fev_age_days", label: "Age in days (young infant)", type: "number", unit: "days", min: 0, max: 365 },
    { key: "fev_age_group", label: "Age group", type: "select", options: ["28 days or less", "29–90 days", "3–36 months", "Older child", NOT_DOCUMENTED] },
    { key: "fev_temp_c", label: "Temperature", type: "number", unit: "°C", min: 30, max: 43 },
    { key: "fev_measured_route", label: "Measurement route", type: "select", options: ["Axillary", "Rectal", "Tympanic", "Oral", "Forehead", NOT_DOCUMENTED] },
    { key: "fev_appearance", label: "Appearance", type: "select", options: ["Well appearing", "Unwell", "Toxic or septic", NOT_DOCUMENTED] },
    {
      key: "fev_focus",
      label: "Focus identified",
      type: "multi",
      options: ["No focus identified", "Upper respiratory tract", "Acute otitis media", "Pneumonia", "Urinary tract", "Gastrointestinal", "Skin or soft tissue", "Meningitis suspected", "Bone or joint", "Kawasaki disease suspected"],
    },
    { key: "fev_markers", label: "Inflammatory markers", type: "select", options: ["Not performed", "Full blood count", "C-reactive protein", "Procalcitonin", "Full blood count with CRP or procalcitonin", NOT_DOCUMENTED] },
    { key: "fev_urinalysis", label: "Urine specimen", type: "select", options: ["Catheter or suprapubic specimen obtained", "Clean-catch specimen obtained", "Bag specimen only", "Not obtained", NOT_DOCUMENTED], hint: "A bag specimen is not a valid culture specimen for this decision." },
    { key: "fev_lumbar_puncture", label: "Lumbar puncture", type: "select", options: ["Performed", "Deferred — reason documented", "Not indicated on this pathway", NOT_DOCUMENTED] },
    { key: "fev_antibiotic", label: "Empirical antibiotic", type: "select", options: ["Given", "Not given — reason documented", "Not indicated", NOT_DOCUMENTED] },
    { key: "fev_pathway", label: "Pathway applied", type: "select", options: ["AAP febrile-infant pathway", "WHO IMCI classification", "Institution pathway", "Clinical assessment only", NOT_DOCUMENTED] },
    { key: "fev_reassessment", label: "Reassessment arranged", type: "input", placeholder: "When and by whom, or the return criteria given" },
    { key: "fev_notes", label: "Fever notes", type: "textarea" },
  ],
};

export const RESPIRATORY_BLOCK = {
  key: "peds_respiratory",
  title: "Respiratory distress & wheeze record",
  note:
    "The WHO pneumonia classification is recorded from what was documented: fast breathing for age is pneumonia, lower chest indrawing or any general danger sign is severe pneumonia. Oxygen saturation below 90% is hypoxaemia. In bronchiolitis the AAP guideline does not recommend routine bronchodilators, corticosteroids or antibiotics, so a treatment given is recorded with the reason and the response.",
  fields: [
    {
      key: "res_work_of_breathing",
      label: "Work of breathing documented",
      type: "multi",
      options: ["None", "Tachypnoea", "Nasal flaring", "Lower chest indrawing", "Grunting", "Head bobbing", "Apnoea"],
    },
    { key: "res_resp_rate", label: "Respiratory rate", type: "number", unit: "/min", min: 5, max: 120 },
    { key: "res_spo2", label: "Oxygen saturation on air", type: "number", unit: "%", min: 40, max: 100 },
    { key: "res_oxygen", label: "Oxygen", type: "select", options: ["Room air", "Supplemental oxygen", "Respiratory support (high-flow or CPAP)", NOT_DOCUMENTED] },
    {
      key: "res_auscultation",
      label: "Auscultation recorded",
      type: "multi",
      options: ["Normal air entry", "Wheeze", "Crackles", "Stridor", "Reduced air entry", "Pleural rub"],
    },
    {
      key: "res_classification",
      label: "Classification documented",
      type: "select",
      options: [
        "No pneumonia — cough or cold",
        "Pneumonia — fast breathing",
        "Severe pneumonia — indrawing or danger sign",
        "Bronchiolitis",
        "Asthma exacerbation",
        "Upper airway obstruction",
        "Not classified",
        NOT_DOCUMENTED,
      ],
    },
    { key: "res_bronchodilator", label: "Bronchodilator", type: "select", options: ["Not given", "Given — response documented", "Given — no response documented", "Not applicable", NOT_DOCUMENTED] },
    { key: "res_steroid", label: "Corticosteroid", type: "select", options: ["Systemic corticosteroid given", "Inhaled corticosteroid started", "Not given — reason documented", NOT_DOCUMENTED] },
    { key: "res_antibiotic", label: "Antibiotic", type: "select", options: ["Prescribed", "Not prescribed — reason documented", "Not indicated", NOT_DOCUMENTED] },
    { key: "res_feeding", label: "Feeding and hydration", type: "select", options: ["Feeding maintained", "Feeding reduced — supported", "Unable to feed", NOT_DOCUMENTED] },
    { key: "res_action_plan", label: "Action plan or return criteria given", type: "textarea", placeholder: "What the caregiver was told to return for, and when" },
    { key: "res_notes", label: "Respiratory notes", type: "textarea" },
  ],
};

export const DEHYDRATION_BLOCK = {
  key: "peds_dehydration",
  title: "Diarrhoea & dehydration record",
  note:
    "The WHO dehydration classification is recorded from the documented signs — two or more signs in a column classify the child — and the treatment plan follows the classification: Plan A at home, Plan B oral rehydration under observation, Plan C intravenous fluids with urgent referral.",
  fields: [
    { key: "deh_duration_days", label: "Duration of diarrhoea", type: "number", unit: "days", min: 0, max: 60 },
    { key: "deh_stool_frequency", label: "Stools in the last 24 hours", type: "input", placeholder: "Number, and whether watery or bloody" },
    { key: "deh_vomiting", label: "Vomiting", type: "select", options: ["None", "Occasional", "Persistent — unable to keep fluids", NOT_DOCUMENTED] },
    {
      key: "deh_signs",
      label: "Dehydration signs documented",
      type: "multi",
      options: [
        "Lethargic or unconscious",
        "Restless or irritable",
        "Sunken eyes",
        "Not able to drink or drinking poorly",
        "Drinks eagerly, thirsty",
        "Skin pinch returns very slowly (over 2 seconds)",
        "Skin pinch returns slowly",
        "Blood in stool",
      ],
    },
    { key: "deh_classification", label: "Classification documented", type: "select", options: ["No dehydration", "Some dehydration", "Severe dehydration", "Not classified", NOT_DOCUMENTED] },
    { key: "deh_plan", label: "Treatment plan applied", type: "select", options: ["Plan A — home fluids and feeding", "Plan B — oral rehydration under observation", "Plan C — intravenous fluids and urgent referral", "No plan documented", NOT_DOCUMENTED] },
    { key: "deh_ors", label: "Oral rehydration solution", type: "select", options: ["Given", "Not given — reason documented", "Not tolerated", NOT_DOCUMENTED] },
    { key: "deh_zinc", label: "Zinc supplementation", type: "select", options: ["Given", "Not given — reason documented", NOT_DOCUMENTED] },
    { key: "deh_iv_fluid", label: "Intravenous fluid recorded", type: "input", placeholder: "Fluid, rate and the weight it was calculated from" },
    { key: "deh_weight_kg", label: "Weight", type: "number", unit: "kg", min: 0.5, max: 250 },
    { key: "deh_urine", label: "Urine output", type: "select", options: ["Passing urine normally", "Reduced urine output", "No urine passed", NOT_DOCUMENTED] },
    { key: "deh_reassess", label: "Reassessment arranged", type: "input", placeholder: "When the child will be reassessed, and the return criteria given" },
    { key: "deh_notes", label: "Diarrhoea notes", type: "textarea" },
  ],
};