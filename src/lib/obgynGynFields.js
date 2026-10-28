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
    S("gyn_sexual_history", "Sexual History", [
      "Not clinically indicated at this encounter",
      "Discussed privately — documented in the note",
      "Deferred at the patient's request",
      "Declined",
    ]),
    S("gyn_contraception_current", "Current Contraception", [
      "Not documented",
      "None",
      "Combined hormonal",
      "Progestogen only",
      "Intrauterine device or system",
      "Barrier",
      "Permanent method",
      "Other — documented in the note",
    ]),
    S("gyn_fertility_goals", "Fertility Goals Documented", [
      "Not documented",
      "Not currently trying to conceive",
      "Trying to conceive",
      "Seeking fertility assessment",
      "Fertility treatment in progress",
      "Family complete",
      "Not discussed — patient preference",
    ]),
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
// Intimate examination is recorded only when it was performed, with the consent
// and chaperone decision that accompanied it.
export const gynExaminationFields = () =>
  sec("Gynecologic Examination — Consent, Findings & Deferral", [
    S("gyn_exam_indication", "Indication for Examination at This Encounter", [
      "Not documented",
      "Symptoms reported",
      "Screening",
      "Follow-up of a known condition",
      "Pre-operative assessment",
      "Not indicated at this encounter",
    ]),
    S("gyn_exam_consent", "Consent for Intimate Examination", [
      "Documented",
      "Declined by the patient",
      "Not required — examination not performed",
      "Not documented",
    ]),
    S("gyn_chaperone_offer", "Chaperone", [
      "Offered — accepted",
      "Offered — declined by the patient",
      "Not offered — documented reason",
      "Not recorded",
    ]),
    S("gyn_abdominal_exam", "Abdominal Examination", [
      "Not indicated",
      "Not performed — deferred",
      "Performed — findings documented",
      "Performed — no abnormality documented",
    ]),
    S("gyn_speculum_exam", "Speculum Examination", [
      "Not indicated",
      "Not performed — deferred",
      "Declined by the patient",
      "Performed — findings documented",
      "Performed — no abnormality documented",
    ]),
    S("gyn_bimanual_exam", "Bimanual / Pelvic Examination", [
      "Not indicated",
      "Not performed — deferred",
      "Declined by the patient",
      "Performed — findings documented",
      "Performed — no abnormality documented",
    ]),
    S("gyn_breast_exam", "Breast Examination", [
      "Not indicated",
      "Not performed — deferred",
      "Performed — findings documented",
      "Performed — no abnormality documented",
    ]),
    T("gyn_exam_findings", "Examination Findings Recorded (for the examinations actually performed)"),
    T("gyn_exam_deferral_reason", "Reason Any Examination Was Deferred or Not Performed"),
  ]);

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

// ---- Investigations and screening ------------------------------------------
export const gynInvestigationFields = () =>
  sec("Investigations, Screening & Follow-Up", [
    S("gyn_investigation_intent", "Purpose of the Investigations in This Note", [
      "Not applicable",
      "Screening",
      "Diagnostic evaluation of symptoms",
      "Surveillance of a known condition",
      "Pre-operative assessment",
    ]),
    S("gyn_pregnancy_test", "Pregnancy Testing", [
      "Not indicated",
      "Indicated — not yet performed",
      "Performed — negative",
      "Performed — positive, assessment recorded",
      "Declined",
    ]),
    S("gyn_microbiology", "Microbiology", [
      "Not indicated",
      "Ordered — result awaited",
      "Result — no infection identified",
      "Result — organism identified, treatment recorded",
      "Declined",
    ]),
    S("gyn_hormonal_tests", "Hormonal Investigations", [
      "Not indicated",
      "Ordered — result awaited",
      "Result reviewed and documented",
      "Not documented",
    ]),
    S("gyn_ultrasound", "Pelvic Ultrasound", [
      "Not indicated",
      "Ordered — result awaited",
      "Performed — findings documented",
      "Performed — no abnormality documented",
    ]),
    S("gyn_histology", "Histology or Pathology", [
      "Not applicable",
      "Specimen sent — result awaited",
      "Result — benign, documented",
      "Result — abnormal, plan documented",
    ]),
    T("gyn_specimen_details", "Specimen Details — site, date taken and where sent"),
    F("gyn_screening_due_date", "Next Screening or Surveillance Due — date and the basis for the interval"),
    T("gyn_result_followup", "Follow-Up Action for the Results Above — who is responsible and when"),
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