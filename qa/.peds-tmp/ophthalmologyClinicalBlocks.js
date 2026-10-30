// Ophthalmology — the clinical narrative blocks.
//
// Two blocks that give every ophthalmic note the same structured backbone the
// free-text sections already describe:
//
//   ophth_history   the symptom history, asked once and in the order an
//                   ophthalmologist takes it — onset, course, laterality, then
//                   each visual symptom, then the ocular and systemic past, the
//                   medication and lens history, family history and risk factors.
//   ophth_impression diagnosis reasoning and the management plan: differentials
//                   considered, why one was favoured, what is monitored and when,
//                   what the patient was taught, and the safety net.
//
// Rules these blocks follow:
//   - nothing is pre-filled and nothing defaults to normal: a blank is "not
//     documented" and is never read as a negative finding;
//   - laterality is explicit wherever the two eyes can differ;
//   - a symptom recorded here is a symptom — it never becomes a diagnosis;
//   - the medication, allergy and investigation history held in the unified
//     AMedix Patient Record is not duplicated: these fields ask only what the
//     ocular encounter needs on top of it.

import {
  T, I, S, M, WHEN, WHEN_IN, NOT_DOCUMENTED, NONE_DOCUMENTED, EYE,
} from "./ophthFieldKit.js";

export const OPHTH_HISTORY_BLOCK = {
  title: "Ophthalmic History",
  fields: [
    S("hx_source", "History Taken From", ["Patient", "Parent or carer", "Referring clinician", "Other — documented", NOT_DOCUMENTED]),
    T("hx_presenting", "Presenting Complaint in the Patient's Own Terms"),
    S("hx_onset", "Onset", ["Sudden — within minutes to hours", "Acute — within days", "Gradual — weeks", "Chronic — months or longer", "Not established"]),
    I("hx_duration", "Duration", { placeholder: "e.g. 3 days" }),
    S("hx_course", "Course Since Onset", ["Improving", "Stable", "Worsening", "Intermittent or episodic", "Fluctuating through the day", "Not established"]),
    S("hx_laterality", "Eye(s) Affected", ["Right eye (OD)", "Left eye (OS)", "Both eyes (OU)", "Alternating", "Not established"]),
    S("hx_severity", "Symptom Severity as Reported", ["Mild — does not limit activity", "Moderate — limits some activity", "Severe — limits daily activity", "Not established"]),
    S("hx_pain", "Pain", ["None", "Mild", "Moderate", "Severe — with systemic features", "Not established"]),
    I("hx_pain_detail", "Pain — Character and Radiation", WHEN_IN("hx_pain", ["Mild", "Moderate", "Severe — with systemic features"])),
    M("hx_visual_symptoms", "Visual Symptoms Reported", [
      "Blurred vision", "Sudden loss of vision", "Gradual loss of vision", "Flashes of light",
      "Floaters — new or increased", "Photophobia", "Diplopia", "Metamorphopsia or distortion",
      "Glare or halos", "Colour vision change", "Visual field loss", "Transient visual loss",
      NONE_DOCUMENTED,
    ]),
    M("hx_ocular_surface", "Ocular Surface Symptoms", [
      "Redness", "Watery discharge", "Mucopurulent discharge", "Itching",
      "Foreign body sensation", "Photophobia", "Dryness", "Swelling of the lids", NONE_DOCUMENTED,
    ]),
    S("hx_trauma", "Ocular Trauma", ["No", "Yes — documented below", "Uncertain", NOT_DOCUMENTED]),
    T("hx_trauma_detail", "Trauma — Mechanism, Time and Object", WHEN("hx_trauma", "Yes — documented below")),
    S("hx_contact_lens", "Contact Lens Wear", ["Never", "Current — type and schedule documented", "Past use", "Not documented"]),
    I("hx_contact_lens_detail", "Contact Lens — Type, Schedule and Hygiene", WHEN_IN("hx_contact_lens", ["Current — type and schedule documented", "Past use"])),
    T("hx_previous_ocular_disease", "Previous Ocular Disease"),
    T("hx_previous_ocular_surgery", "Previous Eye Operations or Laser", { placeholder: "Operation, eye, year, surgeon or facility, outcome" }),
    T("hx_ocular_medications", "Current Ocular Medications", { placeholder: "Drops and ointments with dose, frequency and duration — especially steroid and antiglaucoma therapy" }),
    T("hx_drop_intolerance", "Allergy or Intolerance to Eye Drops"),
    T("hx_systemic_disease", "Systemic Disease Relevant to the Eye"),
    T("hx_systemic_medications", "Systemic Medications Relevant to the Eye", { placeholder: "e.g. anticoagulants, antimalarials, ethambutol, bisphosphonates, systemic steroids" }),
    T("hx_family_history", "Family History of Ocular Disease"),
    M("hx_risk_factors", "Risk Factors Documented", [
      "Diabetes", "Hypertension", "Smoking", "Steroid use — topical or systemic", "Immunosuppression",
      "Previous ocular trauma", "High myopia", "Family history of glaucoma", "Prematurity",
      "Contact lens wear", "Occupational or chemical exposure", "None documented",
    ]),
    S("hx_function_impact", "Impact on Daily Function", ["No impact reported", "Reading or driving affected", "Work affected", "Independent living affected", "Not established"]),
  ],
};

export const OPHTH_IMPRESSION_BLOCK = {
  title: "Diagnostic Reasoning & Management Plan",
  fields: [
    T("reasoning_summary", "Clinical Reasoning — How the Findings Fit Together"),
    T("differentials_considered", "Differential Diagnoses Considered", { placeholder: "Each differential with the features for and against it" }),
    I("differential_excluded_by", "What Excluded the Leading Alternative", { placeholder: "Examination finding, test or response to treatment" }),
    S("diagnosis_certainty", "Diagnostic Certainty at This Visit", ["Confirmed on this assessment", "Probable — treatment started, confirmation pending", "Possible — under investigation", "Undifferentiated — observation", "Not documented"]),
    T("management_decisions", "Management Decisions and Their Rationale"),
    T("monitoring_parameters", "What Will Be Monitored and How"),
    I("monitoring_interval", "Monitoring Interval", { placeholder: "e.g. 6 weeks" }),
    M("education_provided", "Patient Education Provided", [
      "Condition explained", "Drop instillation technique demonstrated", "Red-flag symptoms discussed",
      "Adherence and persistence discussed", "Lifestyle and smoking advice", "Driving advice",
      "Workplace or sports protection", "Contact lens hygiene", "Written information given", NONE_DOCUMENTED,
    ]),
    T("safety_netting", "Safety Net — What the Patient Was Told to Return For"),
    EYE("planned_eye", "Eye the Plan Applies To"),
  ],
};

export const OPHTH_CLINICAL_BLOCKS = {
  ophth_history: OPHTH_HISTORY_BLOCK,
  ophth_impression: OPHTH_IMPRESSION_BLOCK,
};

export const OPHTH_CLINICAL_BLOCK_COUNT = Object.keys(OPHTH_CLINICAL_BLOCKS).length;