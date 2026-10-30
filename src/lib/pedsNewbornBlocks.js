// Pediatrics — newborn, jaundice, growth and nutrition blocks.
//
// Each block records what was documented; nothing here computes a diagnosis and no
// threshold is stated that the cited document does not publish. A blank stays blank.

const NOT_DOCUMENTED = "Not documented";

export const NEWBORN_BLOCK = {
  key: "peds_newborn",
  title: "Newborn assessment record",
  note:
    "The record WHO newborn care requires of the first hours: the delivery context, gestational age and the birth measurements with their weight category, thermal care, the initiation of feeding, vitamin K prophylaxis, the examination findings and the danger signs screened for. A field left blank is reported as not documented, never as normal.",
  fields: [
    { key: "nb_delivery_setting", label: "Birth setting", type: "select", options: ["Health facility", "Home birth", "Born before arrival", NOT_DOCUMENTED] },
    { key: "nb_gestation_weeks", label: "Gestational age", type: "number", unit: "weeks", min: 20, max: 45 },
    { key: "nb_birth_weight_g", label: "Birth weight", type: "number", unit: "g", min: 300, max: 7000 },
    {
      key: "nb_weight_category",
      label: "Birth-weight category",
      type: "select",
      options: ["Normal birth weight (2500 g or more)", "Low birth weight (< 2500 g)", "Very low birth weight (< 1500 g)", "Extremely low birth weight (< 1000 g)", NOT_DOCUMENTED],
      hint: "The WHO category as documented — never inferred from the weight by the app.",
    },
    { key: "nb_length_cm", label: "Birth length", type: "number", unit: "cm", min: 20, max: 70 },
    { key: "nb_head_cm", label: "Head circumference", type: "number", unit: "cm", min: 20, max: 45 },
    { key: "nb_temp_c", label: "Axillary temperature", type: "number", unit: "°C", min: 30, max: 43, hint: "WHO newborn thermal range starts at 36.5 °C axillary." },
    { key: "nb_resp_rate", label: "Respiratory rate", type: "number", unit: "/min", min: 10, max: 120 },
    { key: "nb_apgar_1", label: "APGAR at 1 minute", type: "number", min: 0, max: 10 },
    { key: "nb_apgar_5", label: "APGAR at 5 minutes", type: "number", min: 0, max: 10 },
    { key: "nb_resuscitation", label: "Resuscitation at birth", type: "select", options: ["None required", "Stimulation only", "Bag-mask ventilation", "Advanced resuscitation", NOT_DOCUMENTED] },
    { key: "nb_skin_to_skin", label: "Skin-to-skin contact", type: "select", options: ["Yes", "No — reason documented", NOT_DOCUMENTED] },
    { key: "nb_cord_clamp", label: "Cord clamping", type: "select", options: ["Delayed (1 minute or more)", "Immediate", NOT_DOCUMENTED] },
    { key: "nb_feeding_started", label: "Initiation of feeding", type: "select", options: ["Breastfeeding within 1 hour", "Breastfeeding later than 1 hour", "Formula", "Not yet feeding — reason documented", NOT_DOCUMENTED] },
    { key: "nb_vitamin_k", label: "Vitamin K prophylaxis", type: "select", options: ["Given", "Not given — reason documented", "Declined by parent", NOT_DOCUMENTED] },
    { key: "nb_eye_prophylaxis", label: "Eye prophylaxis", type: "select", options: ["Given", "Not given — reason documented", "Not required by local policy", NOT_DOCUMENTED] },
    { key: "nb_voided_stooled", label: "Urine and meconium", type: "select", options: ["Urine and meconium passed", "Urine only", "Meconium only", "Neither passed", NOT_DOCUMENTED] },
    { key: "nb_jaundice", label: "Jaundice at this assessment", type: "select", options: ["Absent", "Present — onset under 24 hours", "Present — onset 24 hours or later", NOT_DOCUMENTED] },
    {
      key: "nb_danger_signs",
      label: "Danger signs screened for (WHO young infant)",
      type: "multi",
      options: [
        "Not feeding well",
        "Convulsions",
        "Fast breathing (60/min or more)",
        "Severe chest indrawing",
        "Fever (37.5 °C or more)",
        "Hypothermia (below 35.5 °C)",
        "No spontaneous movement",
        "Lethargic or unconscious",
      ],
      hint: "Only what was documented — an unticked box is not a statement that the sign is absent.",
    },
    {
      key: "nb_congenital_findings",
      label: "Findings recorded",
      type: "multi",
      options: [
        "No abnormality identified",
        "Cardiac murmur",
        "Cleft lip or palate",
        "Neural tube defect",
        "Limb or skeletal anomaly",
        "Undescended testis",
        "Ambiguous genitalia",
        "Other — documented below",
      ],
    },
    { key: "nb_screening", label: "Newborn screening performed", type: "select", options: ["Bloodspot screening taken", "Hearing screening performed", "Both performed", "Not performed — reason documented", NOT_DOCUMENTED] },
    { key: "nb_notes", label: "Additional newborn findings", type: "textarea", placeholder: "Free text — what was seen and what was done about it" },
  ],
};

export const JAUNDICE_BLOCK = {
  key: "peds_jaundice",
  title: "Neonatal jaundice record",
  note:
    "The jaundice record the AAP hyperbilirubinaemia guideline requires: the gestational age and risk factors, the bilirubin value with the specimen type and the age at measurement, the chart applied and the threshold read from it, the treatment given and the follow-up arranged. The app does not compute a threshold — the clinician records which chart was used and what it showed.",
  fields: [
    { key: "ja_gestation_weeks", label: "Gestational age", type: "number", unit: "weeks", min: 20, max: 45 },
    { key: "ja_age_hours", label: "Age at assessment", type: "number", unit: "hours", min: 0, max: 1000 },
    { key: "ja_onset_age_hours", label: "Age at onset of jaundice", type: "number", unit: "hours", min: 0, max: 1000, hint: "Jaundice under 24 hours is always a documented concern." },
    {
      key: "ja_risk_factors",
      label: "Risk factors documented",
      type: "multi",
      options: [
        "Gestational age under 38 weeks",
        "Exclusive breastfeeding with weight loss",
        "Haemolysis (ABO or Rh incompatibility)",
        "Cephalohaematoma or significant bruising",
        "Previous sibling required phototherapy",
        "Jaundice before 24 hours of age",
        "G6PD deficiency known or suspected",
      ],
    },
    { key: "ja_bilirubin_value", label: "Bilirubin value", type: "number", min: 0, max: 1000 },
    { key: "ja_bilirubin_unit", label: "Bilirubin unit", type: "select", options: ["µmol/L", "mg/dL", NOT_DOCUMENTED] },
    { key: "ja_specimen", label: "Specimen", type: "select", options: ["Serum total bilirubin", "Transcutaneous, confirmed by serum", "Transcutaneous only", NOT_DOCUMENTED] },
    {
      key: "ja_chart_applied",
      label: "Chart applied",
      type: "select",
      options: [
        "AAP hour-specific chart",
        "Institution chart",
        "WHO-aligned local chart",
        "No chart applied — clinical decision only",
        NOT_DOCUMENTED,
      ],
      hint: "Recorded because the bodies publish different thresholds — the chart used decides treatment (see the conflict register).",
    },
    {
      key: "ja_threshold_state",
      label: "Threshold read from that chart",
      type: "select",
      options: ["Below the treatment threshold", "At or above the phototherapy threshold", "At or above the exchange threshold", "Threshold not read", NOT_DOCUMENTED],
    },
    { key: "ja_treatment", label: "Treatment recorded", type: "multi", options: ["No treatment", "Phototherapy", "Intravenous immunoglobulin", "Exchange transfusion", "Fluid supplementation", "Breastfeeding support"] },
    {
      key: "ja_neuro_signs",
      label: "Neurological signs recorded",
      type: "multi",
      options: ["None documented", "Lethargy", "Poor feeding", "Hypertonia or opisthotonus", "Retrocollis", "High-pitched cry", "Seizure"],
    },
    {
      key: "ja_followup",
      label: "Follow-up arranged",
      type: "select",
      options: ["Bilirubin repeated within 24 hours", "Bilirubin repeated within 48 hours", "Clinical review only", "No follow-up required", NOT_DOCUMENTED],
    },
    { key: "ja_feeding_state", label: "Feeding at this assessment", type: "select", options: ["Feeding well", "Feeding poorly — assessed", "Not feeding", NOT_DOCUMENTED] },
    { key: "ja_notes", label: "Additional jaundice notes", type: "textarea" },
  ],
};

export const GROWTH_BLOCK = {
  key: "peds_growth",
  title: "Growth & nutrition record",
  note:
    "The measurements are recorded with the reference they were plotted on, because the same child reads differently on the WHO 0–5 standards, the WHO 5–19 reference and a national chart. The z-score or centile is what the clinician read off the chart — the app never derives it without the reference tables.",
  fields: [
    { key: "gr_age_months", label: "Age at measurement", type: "number", unit: "months", min: 0, max: 250 },
    { key: "gr_weight_kg", label: "Weight", type: "number", unit: "kg", min: 0.5, max: 250 },
    { key: "gr_length_cm", label: "Length / height", type: "number", unit: "cm", min: 20, max: 220 },
    { key: "gr_head_cm", label: "Head circumference", type: "number", unit: "cm", min: 20, max: 70 },
    { key: "gr_muac_mm", label: "Mid-upper arm circumference", type: "number", unit: "mm", min: 50, max: 400, hint: "Used from 6 months; below 115 mm is severe acute malnutrition by WHO criteria." },
    {
      key: "gr_chart_used",
      label: "Reference the values were plotted on",
      type: "select",
      options: ["WHO Child Growth Standards (0–5 years)", "WHO Growth Reference (5–19 years)", "National chart", "Institution chart", "No chart used", NOT_DOCUMENTED],
    },
    { key: "gr_weight_for_age", label: "Weight-for-age read from that chart", type: "input", placeholder: "e.g. −2.1 SD, 3rd centile" },
    { key: "gr_height_for_age", label: "Length/height-for-age read from that chart", type: "input", placeholder: "e.g. −1.4 SD, 15th centile" },
    { key: "gr_weight_for_height", label: "Weight-for-length/height or BMI-for-age", type: "input", placeholder: "e.g. −2.8 SD, +2.3 SD" },
    { key: "gr_trajectory", label: "Trajectory across visits", type: "select", options: ["Tracking along the same centile", "Crossing centiles upward", "Crossing centiles downward", "First measurement — no trajectory yet", NOT_DOCUMENTED] },
    {
      key: "gr_feeding_method",
      label: "Feeding recorded",
      type: "multi",
      options: ["Exclusive breastfeeding", "Breastfeeding with complementary foods", "Infant formula", "Mixed feeding", "Family diet", "Therapeutic or special diet", "Tube or gastrostomy feeding"],
    },
    { key: "gr_diet", label: "Diet and appetite", type: "select", options: ["Adequate intake documented", "Poor intake documented", "Excessive intake documented", "Feeding difficulty documented", NOT_DOCUMENTED] },
    {
      key: "gr_micronutrients",
      label: "Micronutrient supplementation recorded",
      type: "multi",
      options: ["Vitamin D", "Iron", "Vitamin A", "Multiple micronutrient powder", "Zinc", "None given"],
    },
    {
      key: "gr_concern",
      label: "Growth concern recorded",
      type: "multi",
      options: ["None identified", "Faltering growth", "Short stature", "Wasting", "Overweight", "Obesity", "Macrocephaly", "Microcephaly", "Pubertal delay", "Pubertal precocity"],
    },
    { key: "gr_notes", label: "Growth and nutrition notes", type: "textarea" },
  ],
};

export const MALNUTRITION_BLOCK = {
  key: "peds_malnutrition",
  title: "Nutrition status & malnutrition record",
  note:
    "The WHO malnutrition criteria are recorded as measured: MUAC, weight-for-height, bilateral pitting oedema and the appetite test. The classification is the clinician's documented decision against those criteria; the treatment and the hypoglycaemia and hypothermia checks follow from it.",
  fields: [
    { key: "mal_muac_mm", label: "MUAC", type: "number", unit: "mm", min: 50, max: 400 },
    { key: "mal_weight_for_height", label: "Weight-for-height z-score", type: "input", placeholder: "e.g. −3.4 SD" },
    { key: "mal_height_for_age", label: "Height-for-age z-score", type: "input", placeholder: "e.g. −2.9 SD" },
    { key: "mal_oedema", label: "Bilateral pitting oedema", type: "select", options: ["Absent", "Present", NOT_DOCUMENTED], hint: "Oedema of both feet confirms severe acute malnutrition whatever the anthropometry." },
    {
      key: "mal_classification",
      label: "Classification documented",
      type: "select",
      options: ["No acute malnutrition", "Moderate acute malnutrition", "Severe acute malnutrition", "Stunting without acute malnutrition", "Overweight or obesity", "Not classified", NOT_DOCUMENTED],
    },
    { key: "mal_appetite_test", label: "Appetite test", type: "select", options: ["Passed", "Failed", "Not performed", NOT_DOCUMENTED] },
    { key: "mal_hypoglycaemia", label: "Hypoglycaemia check", type: "select", options: ["Checked — normal", "Checked — low, treated", "Not checked", NOT_DOCUMENTED] },
    { key: "mal_hypothermia", label: "Temperature check", type: "select", options: ["Checked — normal", "Checked — low, warmed", "Not checked", NOT_DOCUMENTED] },
    {
      key: "mal_treatment",
      label: "Nutrition treatment recorded",
      type: "multi",
      options: ["Ready-to-use therapeutic food", "Inpatient stabilisation", "Supplementary feeding", "Nutrition counselling", "Micronutrient supplementation", "Admission for complications"],
    },
    { key: "mal_vitamin_a", label: "Vitamin A", type: "select", options: ["Given", "Not given — reason documented", "Not indicated", NOT_DOCUMENTED] },
    { key: "mal_deworming", label: "Deworming", type: "select", options: ["Given", "Not given — reason documented", "Not indicated", NOT_DOCUMENTED] },
    { key: "mal_feeding_advice", label: "Feeding advice given to the caregiver", type: "textarea", placeholder: "What was advised, and how the caregiver's understanding was confirmed" },
    { key: "mal_followup", label: "Follow-up interval", type: "input", placeholder: "When the child is weighed again" },
  ],
};