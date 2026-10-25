// Structured Clinical Examination schema for every Obstetrics & Gynaecology
// sub-clinical note in the AMedix Doctor Portal. The framework follows the
// practical examination sequence of Macleod's Clinical Examination and the
// WHO antenatal-care / maternal-health recommendations. Observations are
// stored as structured clinical findings; diagnoses are mapped to ICD-11
// concepts separately by the existing platform terminology system — ICD-11 is
// never the source of examination technique and no codes are invented here.

export const FINDING_OPTIONS = ["Normal", "Abnormal", "Not Assessed", "Not Applicable"];

const S = (key, label, options) => ({ key, label, type: "select", options });
const FIND = (key, label) => S(key, label, FINDING_OPTIONS);
const NUM = (key, label, unit, min, max, placeholder) => ({ key, label, type: "number", unit, min, max, placeholder });
const TXT = (key, label, placeholder) => ({ key, label, type: "input", placeholder });
const AREA = (key, label, placeholder) => ({ key, label, type: "textarea", placeholder });

export const EXAM_STATUS_OPTIONS = ["Performed", "Partially Performed", "Deferred", "Declined by Patient", "Not Indicated"];
export const CONSENT_OPTIONS = ["Obtained", "Not Obtained", "Not Applicable"];
export const CHAPERONE_OPTIONS = ["Offered & Accepted", "Offered & Declined", "Not Offered", "Not Applicable"];

// ---------------------------------------------------------------- groups ----

const G = (key, label, opts, fields) => ({ key, label, ...opts, fields });

const generalMaternal = G("general_maternal", "General & Maternal Examination", { normalShortcut: true, intimate: false }, [
  S("general_appearance", "General Appearance & Clinical Condition", ["Well", "Unwell", "In Distress", "Not Assessed", "Not Applicable"]),
  TXT("bp", "Blood Pressure (mmHg)", "e.g. 118/76"),
  NUM("pulse", "Pulse", "bpm", 20, 220),
  NUM("respiratory_rate", "Respiratory Rate", "breaths/min", 4, 60),
  NUM("temperature", "Temperature", "°C", 30, 45),
  NUM("spo2", "Oxygen Saturation", "%", 50, 100),
  NUM("weight_kg", "Weight", "kg", 20, 300),
  NUM("height_cm", "Height", "cm", 50, 250),
  FIND("pallor", "Pallor / Signs of Anaemia"),
  S("hydration", "Hydration", ["Well Hydrated", "Dehydrated", "Not Assessed", "Not Applicable"]),
  S("oedema", "Peripheral Oedema", ["None", "Ankle", "Pedal & Legs", "Generalised / Anasarca", "Not Assessed", "Not Applicable"]),
  AREA("system_exam", "Cardiovascular / Respiratory / Thyroid / Neurological or Other System Examination (when indicated)"),
  AREA("general_comments", "Additional Findings & Comments"),
]);

const obstetricAbdominal = G("obstetric_abdominal", "Obstetric Abdominal Examination", { normalShortcut: true, intimate: false }, [
  AREA("ob_insp", "Inspection — Contour, Scars, Striae, Linea Nigra, Visible Movements, Abnormalities"),
  S("uterine_size", "Uterine Size vs Gestation", ["Consistent", "Larger Than Dates", "Smaller Than Dates", "Not Assessed", "Not Applicable"]),
  S("uterine_tenderness", "Uterine Tenderness", ["None", "Present", "Not Assessed", "Not Applicable"]),
  S("uterine_tone", "Uterine Tone / Contractions", ["Soft — No Contractions", "Irregular Contractions", "Regular Contractions", "Tonic / Constant", "Not Assessed", "Not Applicable"]),
  NUM("sfh_cm", "Symphysis–Fundal Height", "cm", 0, 60),
  S("fetal_lie", "Fetal Lie", ["Longitudinal", "Transverse", "Oblique", "Not Assessed", "Not Applicable"]),
  S("fetal_presentation", "Fetal Presentation", ["Cephalic", "Breech", "Other / Unstable", "Not Assessed", "Not Applicable"]),
  TXT("fetal_position", "Fetal Position & Palpable Fetal Back"),
  S("engagement", "Engagement of Presenting Part", ["Engaged", "Not Engaged / Free", "Not Assessed", "Not Applicable"]),
  S("amniotic_volume", "Clinical Amniotic Fluid Volume", ["Normal Clinically", "Clinically Increased", "Clinically Decreased", "Not Assessed", "Not Applicable"]),
  AREA("abdominal_masses", "Relevant Abdominal Masses / Other Abnormal Findings"),
  AREA("ob_abd_comments", "Additional Findings & Comments"),
]);

const fetalAssessment = G("fetal_assessment", "Fetal Assessment", { normalShortcut: true, intimate: false }, [
  NUM("fhr_bpm", "Fetal Heart Rate", "bpm", 60, 200),
  S("fhr_method", "FHR Assessment Method", ["Doppler (Pinard / Doppler Device)", "CTG / Cardiotocograph", "Ultrasound", "Not Assessed", "Not Applicable"]),
  S("fetal_movements", "Maternal Report of Fetal Movements", ["Reported Normal", "Reduced", "Absent", "Unusually Vigorous", "Not Assessed", "Not Applicable"]),
  S("fetal_growth", "Clinical Assessment of Fetal Growth", ["Consistent With Gestation", "Lagging — Concern", "Accelerated — Concern", "Not Assessed", "Not Applicable"]),
  AREA("ultrasound_findings", "Ultrasound Findings / Fetal Assessment Results (when available)"),
  AREA("fetal_concerns", "Concerns, Abnormalities & Actions Taken"),
]);

const labourExam = G("labour", "Labour Examination", { normalShortcut: false, intimate: true }, [
  NUM("contractions_per_10", "Contraction Frequency", "per 10 min", 0, 20),
  TXT("contraction_duration", "Contraction Duration"),
  S("contraction_strength", "Contraction Strength", ["Mild", "Moderate", "Strong", "Not Assessed", "Not Applicable"]),
  S("membranes", "Membrane Status", ["Intact", "Spontaneously Ruptured", "Artificially Ruptured (ARM)", "Not Assessed", "Not Applicable"]),
  TXT("rom_time", "Time of Rupture (when known)"),
  TXT("amniotic_fluid", "Amniotic Fluid Characteristics (colour, odour, volume)"),
  NUM("cervical_dilatation", "Cervical Dilatation", "cm", 0, 10),
  S("cervical_effacement", "Cervical Effacement", ["0–25%", "25–50%", "50–75%", "75–100%", "Not Assessed", "Not Applicable"]),
  S("cervical_position", "Cervical Position", ["Posterior", "Mid", "Anterior", "Not Assessed", "Not Applicable"]),
  S("cervical_consistency", "Cervical Consistency", ["Firm", "Soft", "Not Assessed", "Not Applicable"]),
  TXT("presenting_part", "Presenting Part, Station & Position"),
  S("caput", "Caput", ["None", "Mild", "Moderate", "Severe", "Not Assessed", "Not Applicable"]),
  S("moulding", "Moulding", ["None", "Mild", "Moderate", "Severe", "Not Assessed", "Not Applicable"]),
  AREA("labour_maternal_status", "Maternal Observations & Fetal Heart Rate During Labour"),
  AREA("ve_details", "Vaginal Examination — Indication, Consent & Relevant Details"),
  AREA("labour_escalation", "Escalation / Intervention (when indicated)"),
]);

const postpartumExam = G("postpartum", "Postpartum Examination", { normalShortcut: true, intimate: true }, [
  S("pp_general", "General Condition", ["Stable", "Unwell", "Not Assessed", "Not Applicable"]),
  TXT("pp_observations", "Maternal Observations (BP, pulse, temperature)"),
  S("lochia", "Vaginal Bleeding / Lochia", ["Normal", "Heavy", "Offensive", "Absent", "Not Assessed", "Not Applicable"]),
  AREA("bleeding_details", "Bleeding / Lochia Details"),
  S("uterine_involution", "Uterine Tone, Tenderness & Involution", ["Well Contracted", "Subinvoluted / Bulky", "Tender", "Not Assessed", "Not Applicable"]),
  AREA("perineum", "Perineum / Episiotomy / Tears"),
  AREA("pp_wound", "Caesarean or Other Operative Wound"),
  S("pp_infection", "Signs of Infection / Thromboembolic Complications", ["None Identified", "Fever", "Uterine Tenderness", "Wound Infection", "Leg Pain / Swelling — DVT Concern", "Other", "Not Assessed", "Not Applicable"]),
  AREA("pp_recovery", "Urinary, Bowel, Breastfeeding & Other Recovery Concerns"),
]);

const gynGeneral = G("gyn_general", "General Examination", { normalShortcut: true, intimate: false }, [
  S("gyn_appearance", "General Appearance & Hydration", ["Well", "Unwell", "In Distress", "Not Assessed", "Not Applicable"]),
  FIND("gyn_pallor", "Pallor / Signs of Anaemia"),
  NUM("gyn_weight_kg", "Weight", "kg", 20, 300),
  NUM("gyn_height_cm", "Height", "cm", 50, 250),
  FIND("gyn_thyroid", "Thyroid (when indicated)"),
  S("androgen_excess", "Signs of Androgen Excess", ["None", "Hirsutism", "Acne", "Hirsutism & Acne", "Not Assessed", "Not Applicable"]),
  S("galactorrhoea", "Galactorrhoea (menstrual / endocrine symptoms)", ["Absent", "Present", "Not Assessed", "Not Applicable"]),
  AREA("gyn_systems", "Other Relevant System Examination Findings"),
  AREA("gyn_gen_comments", "Additional Findings & Comments"),
]);

const gynAbdominal = G("gyn_abdominal", "Abdominal Examination", { normalShortcut: true, intimate: false }, [
  AREA("gyn_insp", "Inspection — Contour, Distension, Scars, Skin Changes, Visible Masses"),
  FIND("gyn_tenderness", "Abdominal Tenderness"),
  S("guarding", "Guarding", ["None", "Voluntary", "Involuntary (Peritonism)", "Not Assessed", "Not Applicable"]),
  FIND("rebound", "Rebound Tenderness"),
  AREA("palpable_masses", "Palpable Masses / Organ Enlargement"),
  S("percussion_auscultation", "Percussion / Auscultation (when indicated)", ["Normal", "Abnormal — Free Fluid / Altered Bowel Sounds", "Not Assessed", "Not Applicable"]),
  AREA("gyn_abd_comments", "Additional Findings & Comments"),
]);

const externalGenital = G("external_genital", "External Genital Examination", { normalShortcut: false, intimate: true }, [
  S("vulva", "Vulval Skin & Findings", ["Normal", "Lesions / Ulcers", "Rash / Inflammation", "Swelling", "Other Abnormality", "Not Assessed", "Not Applicable"]),
  TXT("vulva_details", "Vulval, Labial & Clitoral Findings (when relevant)"),
  S("discharge_source", "Discharge / Bleeding Apparent Source", ["No Abnormal Discharge or Bleeding", "Vaginal", "Cervical", "Urethral", "Not Assessed", "Not Applicable"]),
  S("bartholin", "Bartholin Glands", ["Normal", "Swelling", "Swelling & Tender", "Not Assessed", "Not Applicable"]),
  TXT("perineal_condition", "Perineal Condition, Scars & Relevant Prolapse Findings"),
  AREA("ext_gen_comments", "Additional Findings & Comments"),
]);

const speculum = G("speculum", "Speculum Examination", { normalShortcut: false, intimate: true }, [
  S("vaginal_walls", "Vaginal Walls", ["Normal", "Inflammation", "Atrophy", "Other Abnormality", "Not Assessed", "Not Applicable"]),
  TXT("speculum_discharge", "Vaginal Discharge Description"),
  S("cervix_appearance", "Cervical Appearance", ["Normal", "Ectropion", "Lesion", "Inflammation / Cervicitis", "Contact Bleeding", "Other Abnormality", "Not Assessed", "Not Applicable"]),
  S("bleeding_source_speculum", "Apparent Source of Bleeding", ["No Bleeding", "Cervical Origin", "Endocervical / Uterine Origin", "Not Assessed", "Not Applicable"]),
  S("cervical_os", "Cervical Os (when clinically relevant)", ["Closed", "Open / Admitting Finger", "Not Assessed", "Not Applicable"]),
  S("foreign_body", "Foreign Body / Other Visible Abnormality", ["None Seen", "Present", "Not Assessed", "Not Applicable"]),
  TXT("specimens", "Specimens Collected (cervical screening, microbiology)"),
  AREA("speculum_comments", "Additional Findings & Comments"),
]);

const bimanual = G("bimanual", "Bimanual Pelvic Examination", { normalShortcut: true, intimate: true }, [
  S("cervical_motion_tenderness", "Cervical Motion Tenderness", ["Absent", "Present", "Not Assessed", "Not Applicable"]),
  TXT("uterus_bimanual", "Uterine Size, Position, Mobility & Tenderness"),
  S("adnexa", "Adnexa", ["Normal", "Tender", "Mass", "Tender & Mass", "Not Assessed", "Not Applicable"]),
  TXT("pelvic_fullness", "Pelvic Fullness / Other Relevant Abnormalities"),
  AREA("bimanual_comments", "Additional Findings & Comments"),
]);

const additionalIndicated = G("additional_indicated", "Additional Examinations (when indicated)", { normalShortcut: false, intimate: true }, [
  S("breast_exam", "Breast Examination", ["Normal", "Abnormal — Details in Comments", "Not Indicated", "Not Assessed"]),
  S("prolapse_assessment", "Pelvic Organ Prolapse Assessment", ["Normal / No Prolapse", "Anterior Wall", "Uterine / Vault", "Other", "Not Indicated", "Not Assessed"]),
  S("cough_stress_test", "Cough Stress Test", ["No Leak Observed", "Stress Incontinence Observed", "Not Indicated", "Not Assessed"]),
  S("focused_neuro_endocrine", "Focused Neurological / Endocrine Examination", ["Not Indicated", "Normal", "Abnormal — Details in Comments", "Not Assessed"]),
  S("rectovaginal", "Rectovaginal Examination (appropriate indication only)", ["Not Indicated", "Normal", "Abnormal — Details in Comments", "Not Assessed"]),
  AREA("additional_comments", "Additional Findings & Comments"),
]);

// ------------------------------------------------------------ doc mapping ----
// Context-aware: each sub-note type shows only the examination groups that
// apply to that encounter. Irrelevant or invasive examinations are never
// forced onto a visit.

const ALL_GROUPS = {
  general_maternal: generalMaternal,
  obstetric_abdominal: obstetricAbdominal,
  fetal_assessment: fetalAssessment,
  labour: labourExam,
  postpartum: postpartumExam,
  gyn_general: gynGeneral,
  gyn_abdominal: gynAbdominal,
  external_genital: externalGenital,
  speculum: speculum,
  bimanual: bimanual,
  additional_indicated: additionalIndicated,
};

const DOC_GROUPS = {
  obgyn_initial_antenatal: ["general_maternal", "obstetric_abdominal", "fetal_assessment", "additional_indicated"],
  obgyn_antenatal_followup: ["general_maternal", "obstetric_abdominal", "fetal_assessment"],
  obgyn_pregnancy_record: ["general_maternal"],
  obgyn_prenatal_care_plan: ["general_maternal"],
  obgyn_labor_delivery_record: ["labour", "fetal_assessment", "general_maternal"],
  obgyn_delivery_note: ["general_maternal", "postpartum"],
  obgyn_csection_operative_note: ["general_maternal", "postpartum"],
  obgyn_vaginal_delivery_note: ["general_maternal", "postpartum"],
  obgyn_postpartum_note: ["postpartum", "general_maternal"],
  obgyn_discharge_summary: ["postpartum"],
  obgyn_pregnancy_followup: ["general_maternal", "obstetric_abdominal", "fetal_assessment"],
  obgyn_gyn_consultation: ["gyn_general", "gyn_abdominal", "external_genital", "speculum", "bimanual", "additional_indicated"],
  obgyn_gyn_followup: ["gyn_general", "gyn_abdominal", "bimanual"],
  obgyn_gyn_procedure_note: ["gyn_abdominal", "speculum"],
  obgyn_gyn_operative_note: ["gyn_general", "gyn_abdominal"],
  obgyn_gyn_preop_assessment: ["gyn_general", "gyn_abdominal"],
  obgyn_gyn_postop_note: ["gyn_general", "gyn_abdominal"],
  obgyn_gyn_discharge_summary: ["gyn_abdominal"],
  obgyn_gyn_referral: ["gyn_abdominal", "bimanual"],
};

// Every existing or future OB/GYN sub-note falls back to a symptom-directed
// gynaecological assessment rather than being left without an examination.
const DEFAULT_GROUPS = ["gyn_general", "gyn_abdominal", "bimanual"];

export function examGroupsForDoc(docKey) {
  const keys = DOC_GROUPS[docKey] || DEFAULT_GROUPS;
  return keys.map((k) => ALL_GROUPS[k]).filter(Boolean);
}

export function examHasIntimate(docKey) {
  return examGroupsForDoc(docKey).some((g) => g.intimate);
}

// Section-level keys — examination status, consent and chaperone — live in the
// same values object and are saved with the note as well.
export const EXAM_STATUS_KEY = "__exam_status";
export const EXAM_STATUS_REASON_KEY = "__exam_status_reason";
export const EXAM_CONSENT_KEY = "__consent";
export const EXAM_CHAPERONE_KEY = "__chaperone";
export const EXAM_CHAPERONE_NAME_KEY = "__chaperone_name";

const SECTION_LABELS = {
  [EXAM_STATUS_KEY]: "Clinical Examination — Status",
  [EXAM_STATUS_REASON_KEY]: "Clinical Examination — Status Reason",
  [EXAM_CONSENT_KEY]: "Clinical Examination — Intimate Examination Consent",
  [EXAM_CHAPERONE_KEY]: "Clinical Examination — Chaperone",
  [EXAM_CHAPERONE_NAME_KEY]: "Clinical Examination — Chaperone Identity",
};

// Findings stay structured: values are flat { fieldKey: "string" }. Labels are
// resolved from the schema at save time so the note carries its own labels.
export function flattenExamValues(values, docKey) {
  const out = [];
  const v = values || {};
  Object.entries(SECTION_LABELS).forEach(([key, label]) => {
    const val = String(v[key] ?? "").trim();
    if (val !== "") out.push({ key, label, value: val });
  });
  examGroupsForDoc(docKey).forEach((g) => {
    g.fields.forEach((f) => {
      const val = String(v[f.key] ?? "").trim();
      if (val !== "") out.push({ key: f.key, label: `${g.label} — ${f.label}`, value: val });
    });
  });
  return out;
}

export function examAnyValue(values) {
  return Object.values(values || {}).some((v) => String(v ?? "").trim() !== "");
}

const ABNORMAL_PREFIX = "Abnormal";
export function examAbnormalCount(values) {
  return Object.values(values || {}).filter((v) => String(v ?? "").startsWith(ABNORMAL_PREFIX)).length;
}