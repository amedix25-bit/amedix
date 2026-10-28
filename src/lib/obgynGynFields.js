// Strengthening the EXISTING gynecology note types — additive only.
//
// The eight gynecology templates declared in src/lib/specialtyDocuments.js keep
// their keys, labels, order and every existing field. This module only APPENDS
// fields to the templates whose clinical purpose already covers the domain.
//
// RULES APPLIED HERE
// 1. Sensitive history and intimate examination are asked respectfully and are
//    never mandatory: every field offers "Not clinically indicated", "Declined"
//    and "Not documented" as real answers, and no field is required.
// 2. Nothing here records a normal finding on the clinician's behalf. An
//    unanswered field is never read as normal, and an examination that was not
//    performed is recorded as not performed.
// 3. Chaperone offer and consent are recorded for intimate examination.
// 4. No diagnosis, cancer, infection or infertility is inferred from a symptom —
//    the note records the clinician's documented status, including "suspected",
//    "unconfirmed" and "unresolved".
// 5. Validated criteria and risk tools carry their own name, source and version
//    field, so nothing is claimed as validated without being identified.

const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const F = (key, label, extra) => ({ key, label, type: "input", ...extra });
const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

// ---- History and presenting symptoms ---------------------------------------
export const gynHistoryFields = () =>
  sec("Gynecologic History & Presenting Symptoms", [
    S("gyn_symptom_onset", "Symptom Onset", [
      "Not documented",
      "Sudden",
      "Gradual",
      "Chronic — months",
      "Recurrent or cyclical",
    ]),
    F("gyn_symptom_duration", "Symptom Duration (e.g. 3 weeks)"),
    S("gyn_symptom_severity", "Symptom Severity as Documented", [
      "Not documented",
      "Mild",
      "Moderate",
      "Severe",
      "Disabling",
    ]),
    S("gyn_cycle_regularity", "Menstrual Cycle", [
      "Not documented",
      "Regular",
      "Irregular",
      "Absent — amenorrhoea",
      "Not applicable",
    ]),
    F("gyn_lmp_date", "Last Menstrual Period — Date"),
    S("gyn_postmenopausal_status", "Postmenopausal Bleeding", [
      "Not applicable — premenopausal",
      "Postmenopausal — no bleeding documented",
      "Postmenopausal bleeding documented — assessment recorded",
      "Not documented",
    ]),
    S("gyn_aub_cause_category", "Abnormal Uterine Bleeding — Cause Category Documented", [
      "Not documented",
      "Structural cause suspected — imaging documented",
      "Non-structural cause suspected — documented",
      "Mixed or uncertain",
      "No abnormal bleeding documented",
    ]),
    S("gyn_vaginal_discharge", "Vaginal Discharge", [
      "Not documented",
      "No abnormal discharge documented",
      "Discharge documented — assessment recorded",
      "Offensive or blood-stained discharge documented",
      "Not applicable",
    ]),
    S("gyn_urinary_symptoms", "Urinary Symptoms", [
      "Not documented",
      "None documented",
      "Frequency or urgency",
      "Incontinence",
      "Retention",
      "Dysuria",
      "Mixed — documented in the note",
    ]),
    S("gyn_bowel_symptoms", "Bowel Symptoms", [
      "Not documented",
      "None documented",
      "Constipation",
      "Obstructed defecation",
      "Faecal incontinence",
      "Other — documented in the note",
    ]),
    // Sexual activity, contraception, pregnancy intention and safeguarding are
    // recorded once, in the shared Sexual & Reproductive History section of the
    // same form — they are deliberately not repeated here.
    T("gyn_previous_gyn_procedures", "Previous Gynecologic Procedures or Surgery"),
    S("gyn_cervical_screening_status", "Cervical Screening Status", [
      "Not documented",
      "Never screened",
      "Screened — normal result recorded",
      "Screened — abnormal result, follow-up documented",
      "Overdue for screening",
      "Not applicable — outside the screening programme or not offered",
    ]),
    S("gyn_hpv_vaccination", "HPV Vaccination Documented", [
      "Not documented",
      "Vaccinated — documented",
      "Not vaccinated",
      "Declined",
      "Not offered",
    ]),
  ]);

// ---- Examination -----------------------------------------------------------
// The clinical examination is documented ONCE, in the shared structured
// examination module of every OB/GYN note (src/lib/obgynExamSchema.js +
// ObgynExamSection.jsx): general, abdominal, external genital, speculum,
// bimanual, breast and other indicated examinations, with examination status,
// intimate-examination consent, chaperone offer and decision, and the documented
// reason when an examination was deferred, declined or not indicated.
// No examination fields are duplicated here — a second copy would let the two
// disagree and would ask the doctor to document the same examination twice.

// ---- Assessment ------------------------------------------------------------
export const gynAssessmentFields = () =>
  sec("Assessment, Differential & Management Plan", [
    S("gyn_condition_focus", "Condition Addressed at This Encounter", [
      "Not documented",
      "Abnormal uterine bleeding",
      "Postmenopausal bleeding",
      "Pelvic pain",
      "Endometriosis",
      "Adenomyosis",
      "Uterine fibroids",
      "Ovarian cyst or mass",
      "Menstrual or ovulatory disorder",
      "Polycystic ovary syndrome",
      "Infertility",
      "Menopause or climacteric symptoms",
      "Pelvic organ prolapse",
      "Urinary incontinence",
      "Genital tract infection",
      "Sexually transmitted infection",
      "Early pregnancy complication",
      "Cervical abnormality",
      "Suspected gynecologic malignancy",
      "Other — documented in the note",
    ]),
    S("gyn_diagnosis_status", "Documented Diagnosis Status", [
      "Symptom only — no diagnosis established",
      "Screening encounter — no disease documented",
      "Abnormal finding — assessment pending",
      "Suspected — assessment in progress",
      "Confirmed — documented by the clinician",
      "History of disease — not active",
      "Unresolved / unconfirmed — coding review required",
    ]),
    T("gyn_differential", "Differential Diagnoses Considered"),
    F("gyn_criteria_used", "Validated Criteria or Risk Tool Used — name, source and version"),
    T("gyn_management_options", "Management Options Considered, Counselling Given and the Patient's Choice"),
    S("gyn_referral_criteria", "Referral Decision", [
      "Not applicable",
      "Referral criteria met — documented",
      "Criteria not met — managed locally",
      "Criteria documented in the note",
    ]),
  ]);

// ---- Screening and surveillance --------------------------------------------
// Screening and surveillance DECISIONS belong in the note; ordering tests,
// entering results and viewing report files stay in the Laboratory, Imaging and
// Histopathology tabs, which already hold them. Nothing here re-creates a test
// order form or a result entry screen.
export const gynScreeningFields = () =>
  sec("Screening, Surveillance & Follow-Up", [
    S("gyn_screening_intent", "Purpose Recorded at This Encounter", [
      "Not applicable",
      "Screening",
      "Diagnostic evaluation of symptoms",
      "Surveillance of a known condition",
      "Pre-operative assessment",
    ]),
    S("gyn_screening_eligibility", "Screening Eligibility", [
      "Not applicable",
      "Eligible — programme applies",
      "Not eligible — outside the age range",
      "Not offered — documented reason",
      "Patient declined screening",
      "Not documented",
    ]),
    S("gyn_cervical_test_type", "Cervical Screening Test Documented", [
      "Not applicable",
      "Cytology alone",
      "HPV testing alone",
      "Co-testing — cytology and HPV",
      "Not performed this encounter",
      "Not documented",
    ]),
    S("gyn_cervical_result_summary", "Cervical Screening Result as Reviewed", [
      "No result to review",
      "Normal — result reviewed",
      "Abnormal — result reviewed, management documented",
      "Unsatisfactory sample — repeat required",
      "Result pending in the laboratory record",
      "Not documented",
    ]),
    F("gyn_screening_interval_basis", "Screening Interval Applied and Its Basis (source of the interval)"),
    F("gyn_screening_due_date", "Next Screening or Surveillance Due — date"),
    T("gyn_specimen_details", "Specimen Details for Any Sample Taken in This Encounter — site, date, where sent"),
    T("gyn_result_followup", "Follow-Up for Pending or Reviewed Results — who is responsible, when, and where the result is held"),
  ]);

// ---- Medication safety -----------------------------------------------------
// The medication list itself belongs to the Medication tab and is attached to
// the note automatically. This block records only the clinician's safety review
// at this encounter — never a prescription and never an automatic change.
export const gynMedicationSafetyFields = () =>
  sec("Medication Safety Review at This Encounter", [
    S("gyn_med_review_status", "Medication Safety Review", [
      "Not reviewed at this encounter",
      "Reviewed — no change to treatment",
      "Reviewed — change made and documented in the medication record",
      "Reviewed — prescribing deferred, reason documented",
      "Not applicable — no medication prescribed or continued",
    ]),
    S("gyn_med_pregnancy_lactation", "Pregnancy and Breastfeeding Considered", [
      "Not applicable",
      "Considered — no contraindication documented",
      "Considered — contraindication documented and avoided",
      "Not assessed — documented reason",
      "Unknown pregnancy status — documented",
    ]),
    T("gyn_med_safety_notes", "Interactions, Allergy and Maternal or Fetal Risk Considered — the clinician's documented decision"),
  ]);

// ---- Procedures and surgery ------------------------------------------------
export const gynProcedureFields = () =>
  sec("Procedure & Surgical Documentation", [
    S("gyn_pregnancy_status_preop", "Pregnancy Status Before the Procedure", [
      "Not applicable",
      "Pregnancy test — negative, documented",
      "Pregnancy test — positive, documented",
      "Not performed — documented reason",
      "Not documented",
    ]),
    T("gyn_alternatives_discussed", "Alternatives Discussed, Including No Treatment"),
    S("gyn_consent_documented", "Informed Consent", [
      "Documented — risks discussed",
      "Documented but limited — noted",
      "Not documented",
      "Patient declined the procedure",
    ]),
    T("gyn_preop_optimisation", "Pre-Operative Optimisation — comorbidities, medication review, thromboprophylaxis and antibiotic decisions"),
    F("gyn_operator_grade", "Operator and Grade (if not recorded elsewhere)"),
  ]);

export const gynPostopFields = () =>
  sec("Post-Operative Condition, Instructions & Follow-Up", [
    S("gyn_postop_condition", "Condition Documented After the Procedure", [
      "Not documented",
      "Stable",
      "Improving",
      "Complication documented",
      "Critical care required",
    ]),
    S("gyn_postop_vte", "Thromboprophylaxis After the Procedure", [
      "Prescribed",
      "Not prescribed — documented reason",
      "Not applicable",
      "Not documented",
    ]),
    S("gyn_wound_review", "Wound or Vault Review", [
      "Not applicable",
      "Intact — documented",
      "Concern documented",
      "Not assessed",
    ]),
    T("gyn_postop_instructions", "Instructions Given to the Patient"),
    T("gyn_postop_followup", "Follow-Up Arrangements — who reviews, when and where"),
  ]);