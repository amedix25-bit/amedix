// Strengthening the EXISTING Obstetrics & Gynecology note types.
//
// The 19 templates declared in src/lib/specialtyDocuments.js are NOT recreated,
// renamed or replaced. Their keys, labels, order and every existing field stay
// exactly as they are, so saved notes keep their meaning and every workflow that
// reads a note by key keeps working. This module only APPENDS fields.
//
// AUDIT RULES APPLIED HERE
// 1. Nothing duplicates a shared AMedix surface. Blood pressure, weight,
//    temperature and other vital signs; laboratory results; imaging; medications;
//    allergies; and the patient's recorded history are provided by the shared
//    ClinicalNote tabs and the unified Patient Record, which attach to every note
//    automatically. No note here re-collects them.
// 2. The existing structured gynecologic examination and sexual & reproductive
//    health sections stay the only structured examination surfaces. Nothing here
//    adds a second examination field.
// 3. Every field is optional. Urgent obstetric care is never delayed for
//    documentation, and "Not documented", "Not assessed" and "Not applicable"
//    are real options — an unanswered field is never read as normal.
// 4. Fields record the clinician's INTERPRETATION and decision, not a
//    measurement: no diagnosis is produced by the app from a single value.
// 5. Conditional fields appear only when the clinical context makes them
//    relevant.

import { obgynCatalogFor, OBGYN_CODING_LIMITATION, OBGYN_ICD11_MMS } from "@/lib/obgynIcd11";

const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const F = (key, label, extra) => ({ key, label, type: "input", ...extra });
const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });

const when = (key, ...values) => ({ showIf: { key, in: values } });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

// ---- Coding context ---------------------------------------------------------
// ICD-11 codes an obstetric condition inside the pregnancy / childbirth /
// puerperium chapter, while a gynecologic condition is coded from the
// genitourinary chapter. The note records which context applies, so the coding is
// auditable and a reviewer can see what the clinician intended.
const CONTEXT_OPTIONS = [
  "Not pregnant — gynecologic encounter",
  "Antenatal",
  "Intrapartum",
  "Postpartum — before discharge",
  "Puerperium — after discharge",
  "Pregnancy status unknown or not documented",
];

const CONTEXT_KEYS = [
  "Antenatal",
  "Intrapartum",
  "Postpartum — before discharge",
  "Puerperium — after discharge",
];

const contextFields = () =>
  sec("Obstetric & Gynecologic Coding Context", [
    S("ob_context", "Coding Context at This Encounter", CONTEXT_OPTIONS),
    N("ob_gestational_age_weeks", "Gestational Age at This Encounter (completed weeks)", when("ob_context", "Antenatal", "Intrapartum")),
    N("ob_postpartum_day", "Postpartum Day", when("ob_context", "Postpartum — before discharge", "Puerperium — after discharge")),
    S(
      "ob_condition_relationship",
      "The Documented Diagnosis Is Coded As",
      [
        "Not applicable — gynecologic condition",
        "Obstetric condition of pregnancy, childbirth or the puerperium",
        "Maternal condition complicating pregnancy, childbirth or the puerperium",
        "Coding context uncertain — coding review required",
        "Not documented",
      ],
      when("ob_context", ...CONTEXT_KEYS)
    ),
  ]);

// ---- Condition-specific clinical status ------------------------------------
// Shared by the obstetric notes. Each field records what the clinician documented
// and the decision taken — never a computed diagnosis, never a dose, never an
// order. Only the fields relevant to the note are appended (see the map below).
const HTN_OPTIONS = [
  "Not documented",
  "No hypertensive disorder documented",
  "Chronic hypertension predating pregnancy",
  "Gestational hypertension",
  "Pre-eclampsia without documented severe features",
  "Pre-eclampsia with severe features documented",
  "Pre-eclampsia superimposed on chronic hypertension",
  "Eclampsia",
  "Not assessed",
];

const SEVERE_FEATURE_OPTIONS = [
  "Not assessed",
  "None documented",
  "Severe-range blood pressure documented",
  "Neurological symptoms documented",
  "Renal or hepatic involvement documented",
  "Haematological involvement documented",
];

const MGSO4_OPTIONS = [
  "Not indicated",
  "Given — loading dose documented",
  "Given — maintenance documented",
  "Not given — documented reason",
  "Not documented",
];

const PPH_OPTIONS = [
  "Not applicable",
  "No postpartum haemorrhage documented",
  "Postpartum haemorrhage documented — bleeding controlled",
  "Bleeding ongoing at time of documentation",
  "Massive transfusion or hysterectomy required",
  "Not assessed",
];

const UTEROTONIC_OPTIONS = ["Given — documented", "Not given — documented reason", "Not documented", "Not applicable"];

const INFECTION_OPTIONS = [
  "None documented",
  "Infection documented — not sepsis",
  "Sepsis suspected — assessment documented",
  "Sepsis confirmed — treatment documented",
  "Not assessed",
];

const VTE_RISK_OPTIONS = ["Not assessed", "Low", "Intermediate", "High"];
const VTE_PROPHYLAXIS_OPTIONS = ["Prescribed", "Not prescribed — documented reason", "Not prescribed", "Not applicable"];

const FETAL_OPTIONS = [
  "Not applicable",
  "Reassuring — documented",
  "Non-reassuring — escalation documented",
  "Not assessed",
];

const ECTOPIC_OPTIONS = [
  "Not applicable",
  "Excluded",
  "Suspected — assessment documented",
  "Confirmed — unruptured",
  "Confirmed — ruptured",
];

const hypertensionFields = () =>
  sec("Hypertensive Disorder — Documented Status", [
    S("htn_disorder", "Hypertensive Disorder Documented at This Encounter", HTN_OPTIONS),
    S("severe_features", "Severe Features Documented", SEVERE_FEATURE_OPTIONS, {
      showIf: { key: "htn_disorder", in: ["Pre-eclampsia without documented severe features", "Pre-eclampsia with severe features documented", "Pre-eclampsia superimposed on chronic hypertension", "Eclampsia", "Gestational hypertension"] },
    }),
    S("magnesium_sulphate_status", "Magnesium Sulfate — Documented Decision", MGSO4_OPTIONS, {
      showIf: { key: "htn_disorder", in: ["Pre-eclampsia with severe features documented", "Eclampsia", "Pre-eclampsia without documented severe features"] },
    }),
    S("antihypertensive_treatment_documented", "Antihypertensive Treatment Documented in This Note", [
      "Not applicable",
      "Documented — agent and response recorded",
      "Not given — documented reason",
      "Not documented",
    ], {
      showIf: { key: "htn_disorder", in: ["Chronic hypertension predating pregnancy", "Gestational hypertension", "Pre-eclampsia without documented severe features", "Pre-eclampsia with severe features documented", "Pre-eclampsia superimposed on chronic hypertension", "Eclampsia"] },
    }),
  ]);

const haemorrhageFields = () =>
  sec("Obstetric Haemorrhage — Documented Status", [
    S("pph_status", "Postpartum Haemorrhage Status", PPH_OPTIONS),
    S("uterotonic_prophylaxis", "Uterotonic Prophylaxis for This Birth", UTEROTONIC_OPTIONS, {
      showIf: { key: "pph_status", in: PPH_OPTIONS },
    }),
    S("haemorrhage_cause_documented", "Cause Documented", [
      "Not documented",
      "Uterine atony",
      "Genital tract trauma",
      "Retained placenta or products",
      "Coagulopathy",
      "Placenta accreta spectrum",
      "Cause not established",
    ], {
      showIf: { key: "pph_status", in: ["Postpartum haemorrhage documented — bleeding controlled", "Bleeding ongoing at time of documentation", "Massive transfusion or hysterectomy required"] },
    }),
  ]);

const maternalStatusFields = () =>
  sec("Maternal Status Documented at This Encounter", [
    S("maternal_infection_status", "Maternal Infection or Sepsis Status", INFECTION_OPTIONS),
    S("vte_risk", "Venous Thromboembolism Risk Documented", VTE_RISK_OPTIONS),
    S("vte_prophylaxis", "Thromboprophylaxis Documented", VTE_PROPHYLAXIS_OPTIONS, {
      showIf: { key: "vte_risk", in: ["Intermediate", "High"] },
    }),
  ]);

const fetalFields = () =>
  sec("Fetal Status Documented at This Encounter", [
    S("fetal_wellbeing", "Fetal Status as Documented", FETAL_OPTIONS),
    S("fetal_monitoring_method", "Monitoring Method Documented", [
      "Not documented",
      "Intermittent auscultation",
      "Continuous cardiotocography",
      "Ultrasound assessment",
      "Doppler",
      "Other — documented in the note",
    ], {
      showIf: { key: "fetal_wellbeing", in: ["Reassuring — documented", "Non-reassuring — escalation documented"] },
    }),
    S("delivery_decision_documented", "Delivery Decision Documented", [
      "Not applicable",
      "Continue expectant management",
      "Plan for induction of labour",
      "Plan for caesarean delivery",
      "Emergency delivery undertaken",
      "Decision deferred — documented reason",
    ]),
  ]);

const earlyPregnancyFields = () =>
  sec("Early Pregnancy Assessment — Documented Status", [
    S("ectopic_status", "Ectopic Pregnancy Status", ECTOPIC_OPTIONS),
    S("pregnancy_location_confirmed", "Pregnancy Location Confirmed by", [
      "Not documented",
      "Ultrasound — intrauterine pregnancy seen",
      "Ultrasound — extrauterine pregnancy seen",
      "Ultrasound — location not established",
      "Clinical assessment only",
    ], {
      showIf: { key: "ectopic_status", in: ECTOPIC_OPTIONS },
    }),
    S("rhesus_status_documented", "Rh Status and Anti-D Decision Documented", [
      "Not documented",
      "Rh positive — anti-D not applicable",
      "Rh negative — anti-D given",
      "Rh negative — anti-D not given, documented reason",
      "Not applicable",
    ]),
  ]);

// ---- Antenatal assessment: dating, history and investigations --------------
// Every investigation field offers "Not indicated at this gestation" as a real
// answer, so no screening test is applied indiscriminately to every patient and
// an unanswered field is never read as a completed normal result.
const antenatalAssessmentFields = () =>
  sec("Antenatal Assessment — Dating, History & Investigations", [
    S("ob_trimester", "Trimester at This Assessment", [
      "Not documented",
      "First trimester",
      "Second trimester",
      "Third trimester",
    ]),
    S("ob_dating_method", "Pregnancy Dating Method", [
      "Not documented",
      "Last menstrual period",
      "Ultrasound",
      "Ultrasound concordant with last menstrual period",
      "Clinical assessment only",
      "Assisted reproduction — transfer date",
      "Dating uncertain",
    ]),
    F("ob_dating_scan_date", "Dating Ultrasound — Date"),
    F("ob_dating_scan_ga", "Dating Ultrasound — Gestational Age Recorded (e.g. 8w+3d)"),
    S("ob_dating_concordance", "Basis of the Estimated Due Date", [
      "Not documented",
      "Estimated due date kept from last menstrual period",
      "Estimated due date revised by ultrasound — documented",
      "Dating uncertain — repeat assessment planned",
    ]),
    T("ob_ultrasound_findings", "Ultrasound Findings Relevant to This Assessment (viability, number of fetuses, placental site, growth, liquor volume)"),
    S("ob_prior_preterm_birth", "Previous Preterm Birth", ["Not documented", "None documented", "One or more — documented"]),
    S("ob_prior_stillbirth", "Previous Stillbirth", ["Not documented", "None documented", "One or more — documented"]),
    S("ob_prior_ectopic_pregnancy", "Previous Ectopic Pregnancy", ["Not documented", "None documented", "One or more — documented"]),
    S("ob_prior_caesarean", "Previous Caesarean Deliveries", [
      "Not documented",
      "None documented",
      "One previous caesarean",
      "Two or more previous caesareans",
    ]),
    S("ob_antibody_screening", "Red Cell Antibody Screening", [
      "Not indicated at this gestation",
      "Indicated — not yet performed",
      "Performed — no antibodies documented",
      "Performed — antibodies documented, plan recorded",
      "Declined by the patient — documented",
      "Not documented",
    ]),
    S("ob_anaemia_assessment", "Anaemia Assessment", [
      "Not indicated at this gestation",
      "Haemoglobin documented — no anaemia recorded",
      "Anaemia documented — plan recorded",
      "Result awaited",
      "Not documented",
    ]),
    S("ob_infection_screening", "Infection Screening", [
      "Not indicated at this gestation",
      "Indicated — not yet performed",
      "Performed — no infection identified",
      "Performed — positive result, plan recorded",
      "Declined by the patient — documented",
      "Not documented",
    ]),
    S("ob_gdm_assessment", "Gestational Diabetes Assessment", [
      "Not indicated at this gestation",
      "Risk factors documented — testing planned",
      "Testing performed — no gestational diabetes",
      "Gestational diabetes documented — management recorded",
      "Testing declined — documented",
      "Not documented",
    ]),
    S("ob_urinalysis_status", "Urinalysis at This Assessment", [
      "Not performed",
      "Performed — no proteinuria or infection recorded",
      "Proteinuria documented — assessment recorded",
      "Urinary infection documented — treatment recorded",
      "Not documented",
    ]),
    T("ob_screening_pending", "Investigations Pending (test, date taken, when the result is expected)"),
    T("ob_screening_followup", "Follow-Up Action for the Results Above (who is responsible and when)"),
  ]);

// ---- High-risk pregnancy ---------------------------------------------------
// The classification is always the clinician's decision. Nothing here is derived
// from a value, and an unclassified pregnancy stays unclassified.
const highRiskFields = () =>
  sec("High-Risk Pregnancy — Classification, Monitoring & Planning", [
    S("ob_risk_classification", "High-Risk Classification Documented", [
      "Not yet classified",
      "No high-risk factor documented at this encounter",
      "High risk — reason documented below",
    ]),
    T("ob_risk_reason", "Reason for High-Risk Classification (indication required when high risk is recorded)"),
    S("ob_risk_category", "Primary High-Risk Category", [
      "None documented",
      "Hypertensive disorder",
      "Pre-gestational or gestational diabetes",
      "Fetal growth restriction",
      "Multiple pregnancy",
      "Placental disorder (praevia, accreta spectrum, abruption)",
      "Preterm labour or prelabour rupture of membranes",
      "Maternal infection",
      "Thromboembolic risk",
      "Previous adverse pregnancy outcome",
      "Maternal medical or surgical condition",
      "Other — documented in the note",
    ]),
    S("ob_risk_severity", "Severity as Documented", ["Not documented", "Mild", "Moderate", "Severe"]),
    S("ob_monitoring_level", "Monitoring Level Documented", [
      "Routine antenatal schedule",
      "Increased visit frequency",
      "Day-unit assessment",
      "Inpatient admission",
      "Not documented",
    ]),
    S("ob_specialist_involvement", "Specialist Involvement Documented", [
      "None documented",
      "Obstetric specialist",
      "Maternal-fetal medicine",
      "Multidisciplinary — disciplines documented in the note",
      "Not documented",
    ]),
    S("ob_fetal_surveillance_plan", "Fetal Surveillance Plan", [
      "Not indicated",
      "Serial growth assessment",
      "Umbilical artery Doppler",
      "Cardiotocography as indicated",
      "Reduced fetal movement pathway",
      "Not documented",
    ]),
    T("ob_medication_considerations", "Medication Considerations in This Pregnancy (agent, indication, review)"),
    T("ob_delivery_plan", "Delivery Planning (intended gestation, mode, place and the documented reason)"),
    T("ob_escalation_thresholds", "Escalation Thresholds Agreed With the Patient (what to do, who to contact)"),
    F("ob_review_interval", "Review Interval and Responsible Clinician"),
  ]);

// ---- Labour and birth ------------------------------------------------------
const labourAdmissionFields = () =>
  sec("Labour — Admission, Monitoring & Progress", [
    S("ob_admission_indication", "Indication for This Admission", [
      "Spontaneous labour",
      "Induction of labour",
      "Prelabour rupture of membranes",
      "Antepartum bleeding",
      "Reduced fetal movement",
      "Hypertensive disorder",
      "Other — documented in the note",
    ]),
    S("ob_membrane_status", "Membrane Status", [
      "Not documented",
      "Intact",
      "Ruptured — spontaneous",
      "Ruptured — artificial",
      "Uncertain",
    ]),
    F("ob_rupture_datetime", "Time of Rupture of Membranes", when("ob_membrane_status", "Ruptured — spontaneous", "Ruptured — artificial", "Uncertain")),
    S("ob_liquor_status", "Liquor Documented", [
      "Not documented",
      "Clear",
      "Meconium-stained",
      "Blood-stained",
      "Purulent — documented",
    ], when("ob_membrane_status", "Ruptured — spontaneous", "Ruptured — artificial", "Uncertain")),
    S("ob_cervical_examination", "Cervical Examination", [
      "Not performed",
      "Performed — consent documented",
      "Declined by the patient",
      "Not documented",
    ]),
    T("ob_cervical_findings", "Cervical Findings Recorded (dilatation, effacement, station, position)", when("ob_cervical_examination", "Performed — consent documented")),
    S("ob_contractions", "Contractions Documented", [
      "Not documented",
      "Not in labour",
      "Irregular",
      "Regular",
      "Inadequate — augmentation considered",
    ]),
    S("ob_partograph", "Partograph or Equivalent Labour Record", [
      "Used — documented",
      "Not used — not applicable",
      "Not used — not documented",
    ]),
    S("ob_labour_stage", "Stage of Labour Documented", [
      "Not documented",
      "Latent first stage",
      "Active first stage",
      "Second stage",
      "Third stage",
      "Completed",
      "Prolonged — documented",
      "Obstructed — documented",
    ]),
    S("ob_induction_augmentation", "Induction or Augmentation", [
      "Not applicable — spontaneous labour",
      "Induction — indication and method documented",
      "Augmentation — indication documented",
      "Performed without a documented indication",
      "Not documented",
    ]),
    T("ob_decision_and_consent", "Decision Taken, Who Made It and the Consent Documented (induction, augmentation, instrumental birth or caesarean)"),
  ]);

const birthOutcomeFields = () =>
  sec("Birth — Procedure, Placenta, Newborn & Handover", [
    S("ob_instrumental_birth", "Instrumental Birth", [
      "Not applicable — no instrumental birth",
      "Ventouse — indication documented",
      "Forceps — indication documented",
      "Attempted — abandoned, documented",
      "Not documented",
    ]),
    S("ob_placenta_completeness", "Placenta and Membranes", [
      "Complete — documented",
      "Incomplete — manual removal documented",
      "Retained — theatre documented",
      "Not documented",
    ]),
    S("ob_newborn_outcome", "Newborn Outcome as Documented", [
      "Alive — no resuscitation recorded",
      "Alive — resuscitation documented",
      "Stillborn",
      "Early neonatal death documented",
      "Not documented",
    ]),
    S("ob_newborn_resuscitation", "Newborn Resuscitation Documented", [
      "Not required — documented",
      "Stimulation",
      "Bag-mask ventilation",
      "Advanced resuscitation — documented",
      "Not documented",
    ], when("ob_newborn_outcome", "Alive — resuscitation documented")),
    F("ob_newborn_transfer", "Newborn Transferred To (unit and level of care) — or 'not transferred'"),
    F("ob_responsible_clinician", "Responsible Clinician(s) for This Birth"),
    T("ob_handover", "Handover — to whom, when, and what was handed over"),
  ]);

// ---- Obstetric emergency ---------------------------------------------------
// Documentation never gates treatment: the fields below record what was done.
const EMERGENCY_TYPES = [
  "Postpartum haemorrhage",
  "Antepartum haemorrhage",
  "Ectopic pregnancy",
  "Pregnancy loss",
  "Severe hypertension or eclampsia",
  "Maternal sepsis",
  "Uterine rupture",
  "Cord prolapse",
  "Shoulder dystocia",
  "Fetal compromise",
  "Preterm labour or prelabour rupture of membranes",
  "Thromboembolism",
  "Other — documented in the note",
];

const emergencyFields = () =>
  sec("Obstetric Emergency — Recognition & Response", [
    S("ob_emergency", "Obstetric Emergency at This Encounter", [
      "No obstetric emergency documented",
      "Emergency — see type below",
      "Not assessed",
    ]),
    S("ob_emergency_type", "Emergency Documented", EMERGENCY_TYPES, when("ob_emergency", "Emergency — see type below")),
    T("ob_red_flags", "Red Flags Present on Assessment", when("ob_emergency", "Emergency — see type below")),
    T("ob_immediate_actions", "Immediate Actions Taken (treatment must never wait for this note to be completed)", when("ob_emergency", "Emergency — see type below")),
    S("ob_response_to_treatment", "Response to Treatment", [
      "Not documented",
      "Improving",
      "Stable",
      "Deteriorating",
    ], when("ob_emergency", "Emergency — see type below")),
    S("ob_escalation", "Escalation Documented", [
      "Not documented",
      "None required",
      "Senior obstetrician informed",
      "Consultant-led care",
      "Anaesthesia and theatre informed",
      "Critical care informed",
      "Blood bank activated",
      "Multidisciplinary team convened",
    ], when("ob_emergency", "Emergency — see type below")),
    S("ob_transfer", "Transfer Documented", [
      "Not documented",
      "Not transferred",
      "Transferred within the facility",
      "Transferred to a higher-level facility — documented",
    ], when("ob_emergency", "Emergency — see type below")),
    S("ob_disposition", "Disposition After the Event", [
      "Not documented",
      "Labour ward",
      "Theatre",
      "Critical care",
      "Postnatal ward",
      "Discharged",
    ], when("ob_emergency", "Emergency — see type below")),
    F("ob_critical_times", "Time-Critical Events and Their Times", when("ob_emergency", "Emergency — see type below")),
  ]);

// ---- Postnatal care --------------------------------------------------------
const postnatalFields = () =>
  sec("Postnatal Assessment — Recovery & Discharge", [
    S("ob_lochia", "Bleeding / Lochia Documented", [
      "Not assessed",
      "Normal for the postnatal day",
      "Heavy bleeding — documented",
      "Offensive discharge — documented",
      "Absent — documented",
    ]),
    S("ob_uterine_involution", "Uterine Involution", ["Not assessed", "Normal involution documented", "Subinvolution — documented"]),
    S("ob_perineum_wound", "Perineum or Abdominal Wound", [
      "Not applicable",
      "Not assessed",
      "Perineum intact — documented",
      "Repair intact — documented",
      "Wound breakdown — documented",
      "Wound infection — documented",
      "Caesarean wound healthy — documented",
      "Caesarean wound concern — documented",
    ]),
    S("ob_postnatal_pain", "Pain Control", ["Not assessed", "Adequate — documented", "Inadequate — plan documented"]),
    S("ob_urinary_function", "Urinary Function", [
      "Not assessed",
      "Normal — documented",
      "Retention — catheter documented",
      "Incontinence — documented",
    ]),
    S("ob_bowel_function", "Bowel Function", ["Not assessed", "Normal — documented", "Constipation — documented"]),
    S("ob_mental_health_screen", "Postpartum Mental Health Screening", [
      "Not screened",
      "Screened — no concern documented",
      "Screened — concern documented, referral recorded",
      "Declined by the patient — documented",
      "Not documented",
    ]),
    S("ob_contraception_method", "Contraception Documented", [
      "Not discussed",
      "Discussed — method provided",
      "Discussed — decision deferred",
      "Declined by the patient",
    ]),
    S("ob_breastfeeding_support", "Breastfeeding Support Documented", [
      "Support given in this encounter",
      "Referred to lactation support",
      "Not required",
      "Not documented",
    ]),
    T("ob_newborn_concerns", "Newborn Concerns (feeding, jaundice, weight, follow-up)"),
    S("ob_discharge_readiness", "Discharge Readiness", [
      "Not applicable",
      "Not ready — reason documented",
      "Ready for discharge",
      "Discharged",
    ]),
    S("ob_safety_netting", "Safety-Netting Given", [
      "Warning signs discussed and documented",
      "Warning signs not documented",
    ]),
    F("ob_postnatal_followup", "Postnatal Follow-Up — date, place and who reviews"),
  ]);

// ---- Gynecology ------------------------------------------------------------
const gynFields = () =>
  sec("Gynecologic Problem — Documented Status", [
    S("gyn_bleeding_pattern", "Bleeding Pattern Documented", [
      "Not documented",
      "Regular cycles",
      "Irregular cycles",
      "Heavy menstrual bleeding documented",
      "Intermenstrual bleeding documented",
      "Postmenopausal bleeding documented",
      "Not applicable",
    ]),
    S("gyn_pain_status", "Pelvic Pain Documented", [
      "Not documented",
      "No pelvic pain documented",
      "Cyclical pain documented",
      "Non-cyclical pain documented",
      "Acute pelvic pain — assessment documented",
    ]),
    S("endometriosis_status", "Endometriosis Status", [
      "Not applicable",
      "Not suspected",
      "Suspected — assessment documented",
      "Surgically confirmed",
      "Histologically confirmed",
    ]),
    S("fertility_status", "Fertility Status Documented", [
      "Not documented",
      "No fertility concern documented",
      "Primary infertility",
      "Secondary infertility",
      "Recurrent pregnancy loss",
    ]),
    S("menopause_status", "Menopausal Status Documented", [
      "Not documented",
      "Premenopausal",
      "Perimenopausal",
      "Postmenopausal",
      "Not applicable",
    ]),
    S("malignancy_suspicion", "Malignancy Suspicion Documented", [
      "Not documented",
      "No suspicion documented",
      "Suspicion documented — referral or workup recorded",
      "Suspicion documented — workup not recorded",
    ]),
  ]);

// ---- Shared blocks ---------------------------------------------------------
const icdBlock = (domains, placeholder) =>
  sec("Diagnosis Classification (ICD-11)", [
    {
      key: "icd11_diagnoses",
      label: "Diagnoses (ICD-11 MMS) — role, status, maternal context and clinical basis",
      type: "icd11_diagnoses",
      catalog: obgynCatalogFor(domains),
      searchPlaceholder: placeholder,
      catalogRelease: OBGYN_ICD11_MMS.release,
      catalogNote: OBGYN_CODING_LIMITATION,
    },
  ]);

// One field carries both the concerns the clinician raises and the prompts the
// documented findings produce — the concerns are toggled inside the field, so the
// note stores a single coherent record instead of two half-filled ones.
const safetyBlock = () =>
  sec("Safety Concerns & Documented Action", [
    {
      key: "obgyn_safety",
      label: "Safety concerns and the prompts raised by the findings documented in this note",
      type: "obgyn_safety",
    },
  ]);

// ---- Per-note enhancement map ---------------------------------------------
const ANTENATAL_DOMAINS = ["early_pregnancy", "hypertensive", "haemorrhage"];
const INTRAPARTUM_DOMAINS = ["hypertensive", "haemorrhage"];
const GYN_DOMAINS = ["endometriosis", "gyn_benign", "gyn_bleeding", "menopause", "fertility", "gyn_pain"];

const antenatal = (domains = ANTENATAL_DOMAINS, placeholder = "Search ICD-11 — early pregnancy, hypertensive and haemorrhage categories...") =>
  [...contextFields(), ...hypertensionFields(), ...fetalFields(), ...icdBlock(domains, placeholder), ...safetyBlock()];

export const OBGYN_ENHANCEMENTS = {
  // ---- Antenatal ----------------------------------------------------------
  obgyn_initial_antenatal: () => [
    ...antenatal(),
    ...earlyPregnancyFields(),
    ...antenatalAssessmentFields(),
    ...highRiskFields(),
  ],
  obgyn_antenatal_followup: () => [
    ...antenatal(),
    ...maternalStatusFields(),
    ...antenatalAssessmentFields(),
    ...highRiskFields(),
  ],
  obgyn_pregnancy_record: () => [
    ...antenatal(),
    ...earlyPregnancyFields(),
    ...antenatalAssessmentFields(),
    ...highRiskFields(),
  ],
  obgyn_prenatal_care_plan: () => [...antenatal(), ...antenatalAssessmentFields(), ...highRiskFields()],
  obgyn_pregnancy_followup: () => [
    ...antenatal(),
    ...maternalStatusFields(),
    ...antenatalAssessmentFields(),
    ...highRiskFields(),
  ],

  // ---- Intrapartum and postpartum ----------------------------------------
  obgyn_labor_delivery_record: () => [
    ...contextFields(),
    ...hypertensionFields(),
    ...haemorrhageFields(),
    ...fetalFields(),
    ...maternalStatusFields(),
    ...labourAdmissionFields(),
    ...birthOutcomeFields(),
    ...emergencyFields(),
    ...icdBlock(INTRAPARTUM_DOMAINS, "Search ICD-11 — hypertensive disorders and obstetric haemorrhage..."),
    ...safetyBlock(),
  ],
  obgyn_delivery_note: () => [
    ...contextFields(),
    ...hypertensionFields(),
    ...haemorrhageFields(),
    ...fetalFields(),
    ...maternalStatusFields(),
    ...earlyPregnancyFields(),
    ...birthOutcomeFields(),
    ...emergencyFields(),
    ...icdBlock(INTRAPARTUM_DOMAINS, "Search ICD-11 — hypertensive disorders and obstetric haemorrhage..."),
    ...safetyBlock(),
  ],
  obgyn_csection_operative_note: () => [
    ...contextFields(),
    ...hypertensionFields(),
    ...haemorrhageFields(),
    ...maternalStatusFields(),
    ...birthOutcomeFields(),
    ...emergencyFields(),
    ...icdBlock(INTRAPARTUM_DOMAINS, "Search ICD-11 — hypertensive disorders and obstetric haemorrhage..."),
    ...safetyBlock(),
  ],
  obgyn_vaginal_delivery_note: () => [
    ...contextFields(),
    ...haemorrhageFields(),
    ...maternalStatusFields(),
    ...birthOutcomeFields(),
    ...emergencyFields(),
    ...icdBlock(INTRAPARTUM_DOMAINS, "Search ICD-11 — obstetric haemorrhage and hypertensive categories..."),
    ...safetyBlock(),
  ],
  obgyn_postpartum_note: () => [
    ...contextFields(),
    ...haemorrhageFields(),
    ...maternalStatusFields(),
    ...postnatalFields(),
    ...emergencyFields(),
    ...icdBlock(INTRAPARTUM_DOMAINS, "Search ICD-11 — postpartum haemorrhage and hypertensive categories..."),
    ...safetyBlock(),
  ],
  obgyn_discharge_summary: () => [
    ...contextFields(),
    ...hypertensionFields(),
    ...haemorrhageFields(),
    ...maternalStatusFields(),
    ...postnatalFields(),
    ...emergencyFields(),
    ...icdBlock(INTRAPARTUM_DOMAINS, "Search ICD-11 — the diagnoses this admission was coded for..."),
    ...safetyBlock(),
  ],

  // ---- Gynecology ---------------------------------------------------------
  obgyn_gyn_consultation: () => gynNote(),
  obgyn_gyn_followup: () => gynNote(),
  obgyn_gyn_procedure_note: () => gynNote("Search ICD-11 — the gynecologic diagnosis this procedure was performed for..."),
  obgyn_gyn_operative_note: () => gynNote("Search ICD-11 — pre-operative and post-operative gynecologic diagnosis..."),
  obgyn_gyn_preop_assessment: () => gynNote(),
  obgyn_gyn_postop_note: () => gynNote(),
  obgyn_gyn_discharge_summary: () => gynNote("Search ICD-11 — the diagnoses this admission was coded for..."),
  obgyn_gyn_referral: () => gynNote(),
};

function gynNote(placeholder = "Search ICD-11 — gynecologic diagnoses (endometriosis, bleeding, pelvic pain, fertility, menopause)...") {
  return [
    S("ob_context", "Coding Context at This Encounter", CONTEXT_OPTIONS),
    ...gynFields(),
    ...icdBlock(GYN_DOMAINS, placeholder),
    ...safetyBlock(),
  ];
}

// Appends — never replaces — so a saved note keeps every field it already had.
export const withObgynStandards = (docs) =>
  docs.map((doc) => {
    const extra = OBGYN_ENHANCEMENTS[doc.key];
    if (!extra) return doc;
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = extra().filter((f) => !existing.has(f.key));
    return { ...doc, fields: [...(doc.fields || []), ...additions] };
  });