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
  obgyn_initial_antenatal: () => [...antenatal(), ...earlyPregnancyFields()],
  obgyn_antenatal_followup: () => [...antenatal(), ...maternalStatusFields()],
  obgyn_pregnancy_record: () => [...antenatal(), ...earlyPregnancyFields()],
  obgyn_prenatal_care_plan: () => antenatal(),
  obgyn_pregnancy_followup: () => [...antenatal(), ...maternalStatusFields()],

  // ---- Intrapartum and postpartum ----------------------------------------
  obgyn_labor_delivery_record: () => [
    ...contextFields(),
    ...hypertensionFields(),
    ...haemorrhageFields(),
    ...fetalFields(),
    ...maternalStatusFields(),
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
    ...icdBlock(INTRAPARTUM_DOMAINS, "Search ICD-11 — hypertensive disorders and obstetric haemorrhage..."),
    ...safetyBlock(),
  ],
  obgyn_csection_operative_note: () => [
    ...contextFields(),
    ...hypertensionFields(),
    ...haemorrhageFields(),
    ...maternalStatusFields(),
    ...icdBlock(INTRAPARTUM_DOMAINS, "Search ICD-11 — hypertensive disorders and obstetric haemorrhage..."),
    ...safetyBlock(),
  ],
  obgyn_vaginal_delivery_note: () => [
    ...contextFields(),
    ...haemorrhageFields(),
    ...maternalStatusFields(),
    ...icdBlock(INTRAPARTUM_DOMAINS, "Search ICD-11 — obstetric haemorrhage and hypertensive categories..."),
    ...safetyBlock(),
  ],
  obgyn_postpartum_note: () => [
    ...contextFields(),
    ...haemorrhageFields(),
    ...maternalStatusFields(),
    ...icdBlock(INTRAPARTUM_DOMAINS, "Search ICD-11 — postpartum haemorrhage and hypertensive categories..."),
    ...safetyBlock(),
  ],
  obgyn_discharge_summary: () => [
    ...contextFields(),
    ...hypertensionFields(),
    ...haemorrhageFields(),
    ...maternalStatusFields(),
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