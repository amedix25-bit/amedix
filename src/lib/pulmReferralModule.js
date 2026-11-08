// Multidisciplinary referral and shared decision documentation.
//
// Two blocks used on the consultation, follow-up, care-plan and discharge notes:
//   pulm_mdt_referral   — who the patient is referred to, why, how urgently and with
//     what clinical question, together with the summary communicated (history,
//     examination, documented ICD-11 diagnoses, treatment and reported results), the
//     recorded referral letter and the patient's information.
//   pulm_mdt_discussion — the multidisciplinary discussion itself: the teams
//     involved, the decisions recorded, the shared management with its owner, the
//     outstanding actions, what the patient was told and any onward referral.
//
// The block records a referral the clinician documented. It never generates a
// letter, never chooses the specialty and never decides the urgency.
import {
  T,
  I,
  S,
  M,
  NOT_DOCUMENTED,
  YES_NO_DOC,
} from "@/lib/pulmonologyFieldKit";

export const PULM_REFERRAL_SPECIALTIES = [
  "Internal Medicine",
  "Emergency Medicine",
  "Cardiothoracic Surgery",
  "Thoracic Oncology",
  "Infectious Diseases",
  "Allergy and Immunology",
  "Radiology",
  "Laboratory Medicine",
  "Intensive Care",
  "Sleep Medicine",
  "Other specialty — documented",
];

export const PULM_REFERRAL_BLOCKS = {
  pulm_mdt_referral: {
    title: "Multidisciplinary Referral — Specialty, Reason, Urgency and Clinical Question",
    fields: [
      M("specialties", "Specialty Referred To", PULM_REFERRAL_SPECIALTIES),
      S("urgency", "Referral Urgency", [
        "Routine", "Expedited", "Urgent", "Emergency — same day", NOT_DOCUMENTED,
      ]),
      T("urgency_basis", "Basis for the Urgency Documented"),
      T("referral_reason", "Referral Reason Documented"),
      T("clinical_question", "Clinical Question Asked of the Receiving Team"),
      T("clinical_summary", "Clinical Summary Communicated (history, examination, documented diagnoses)"),
      S("diagnoses_included", "Documented ICD-11 Diagnoses Included", [
        "Included — coded in this note",
        "Included — documented without a code, coding review outstanding",
        "Not included",
        NOT_DOCUMENTED,
      ]),
      T("treatment_communicated", "Current Treatment Communicated (medications, oxygen, ventilatory support)"),
      T("results_communicated", "Reported Results Communicated (results attached to the record and named in the referral)"),
      S("letter_recorded", "Referral Letter Recorded in AMedix", [
        "Recorded — saved referral letter",
        "Not recorded — verbal or hand-written referral documented",
        NOT_DOCUMENTED,
      ]),
      S("patient_informed", "Patient Informed of the Referral", YES_NO_DOC),
      I("referring_clinician", "Referring Clinician Documented"),
      I("response_expected", "Response Expected By"),
    ],
  },

  pulm_mdt_discussion: {
    title: "Multidisciplinary Discussion and Shared Decisions Recorded",
    fields: [
      M("teams_involved", "Teams Involved in the Discussion", PULM_REFERRAL_SPECIALTIES),
      I("discussion_date", "Discussion Date"),
      S("discussion_format", "Discussion Format", [
        "Face-to-face meeting", "Virtual meeting", "Written correspondence", "Telephone discussion", NOT_DOCUMENTED,
      ]),
      T("decisions", "Decisions Recorded by the Discussion"),
      T("shared_management", "Shared Management Documented (what is being done, by which team, by when)"),
      M("outstanding_actions", "Outstanding Actions Documented", [
        "Further assessment",
        "Procedure or intervention",
        "Treatment change",
        "Repeat testing",
        "Clinic review",
        "None documented",
        NOT_DOCUMENTED,
      ]),
      I("action_owner", "Action Owner Documented"),
      T("patient_communication", "Communication to the Patient Documented"),
      S("onward_referral", "Onward Referral Documented", YES_NO_DOC),
    ],
  },
};