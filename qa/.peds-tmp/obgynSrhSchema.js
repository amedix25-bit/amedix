// Structured Sexual & Reproductive History schema for every Obstetrics &
// Gynaecology sub-clinical note in the AMedix Doctor Portal. Follows WHO
// sexual and reproductive health / STI / antenatal-care guidance and the
// Macleod's Clinical Examination history-taking framework. Information is
// recorded as patient-reported or verified history — never as a coded
// diagnosis; confirmed or provisional diagnoses are classified to ICD-11
// separately through the existing platform terminology system.

// Encounter-adapted: each sub-note type shows only the groups that apply to
// that encounter, and every field supports a structured selection, optional
// free text, "Not Assessed" / "Not Applicable" and "Prefers Not to Answer"
// where appropriate. "Not sexually active" is never treated as "no STI risk"
// and nothing is inferred about orientation, gender identity, marital status,
// fertility or consent.

const S = (key, label, options) => ({ key, label, type: "select", options });
const TXT = (key, label, placeholder) => ({ key, label, type: "input", placeholder });
const AREA = (key, label, placeholder) => ({ key, label, type: "textarea", placeholder });

const PNTA = "Prefers Not to Answer";
export const SRH_SOURCE_OPTIONS = ["Patient-Reported", "Verified Results", "Patient-Reported & Verified", "Not Documented"];

// ---------------------------------------------------------------- groups ----

const G = (key, label, fields) => ({ key, label, fields });

const activity = G("activity", "Sexual Activity & Partner History", [
  S("srh_activity_status", "Sexual Activity Status", ["Currently Sexually Active", "Previously Sexually Active", "Not Currently Sexually Active", PNTA]),
  TXT("srh_partners_number", "Number of Partners (clinically appropriate time period)", "e.g. 1 in the last 12 months — only when relevant"),
  AREA("srh_partner_history", "Relevant Partner History (when relevant to the encounter)"),
  S("srh_exposure_risk", "New Partners, Concurrent Partners or STI Exposure Risk (when clinically relevant)", [
    "None Identified", "Concern — New Partner Reported", "Concern — Multiple or Concurrent Partners",
    "Concern — Known STI Exposure", "Concern — Other, Details in Notes", "Not Assessed", "Not Applicable", PNTA,
  ]),
  AREA("srh_practices", "Relevant Sexual Practices (documented sensitively, without assumptions)"),
  TXT("srh_last_activity_date", "Date of Last Sexual Activity (only when clinically necessary)"),
  AREA("srh_concerns", "Patient-Reported Sexual Health Concerns"),
  AREA("srh_activity_notes", "Additional Notes"),
]);

const contraception = G("contraception", "Contraception & Pregnancy Intentions", [
  AREA("srh_contraception_current", "Current Contraceptive Method(s)"),
  AREA("srh_contraception_previous", "Previous Methods, Side Effects & Reasons for Discontinuation"),
  S("srh_contraception_issues", "Adherence, Effectiveness or Side-Effect Concerns", [
    "None Reported", "Adherence Concern", "Effectiveness Concern", "Side Effects Reported",
    "Multiple Concerns — Details in Notes", "Not Assessed", "Not Applicable",
  ]),
  S("srh_emergency_contraception", "Emergency Contraception (when relevant)", [
    "Discussed", "Used This Cycle", "Provided", "Not Relevant", "Not Assessed", PNTA,
  ]),
  S("srh_pregnancy_intention", "Pregnancy Intention", [
    "Desires Pregnancy", "Avoiding Pregnancy", "Uncertain", "No Current Intention Documented", PNTA, "Not Applicable",
  ]),
  S("srh_preconception_counselling", "Preconception Counselling (when appropriate)", [
    "Provided", "Discussed — Follow-Up Planned", "Declined", "Not Indicated", "Not Assessed",
  ]),
  S("srh_contraceptive_counselling", "Contraceptive Counselling (when appropriate)", [
    "Provided", "Discussed — Follow-Up Planned", "Declined", "Not Indicated", "Not Assessed",
  ]),
  S("srh_pregnancy_possibility", "Pregnancy Possibility & Testing", [
    "Assessed — Pregnancy Excluded (Verified)", "Assessed — Pregnancy Possible (Patient-Reported)",
    "Pregnancy Test Ordered", "Patient Declined Testing", "Not Assessed", "Not Applicable",
  ]),
  TXT("srh_pregnancy_test_result", "Pregnancy Test Result (verified, when performed)"),
  AREA("srh_contraception_notes", "Additional Notes"),
]);

const sti = G("sti", "STI & Infection History", [
  AREA("srh_previous_sti", "Previous STIs — Diagnosis, Treatment & Relevant Dates"),
  AREA("srh_previous_screening", "Previous STI Screening & Results (where available)"),
  S("srh_current_symptoms", "Current Symptoms", [
    "None Reported", "Genital Lesions", "Abnormal Discharge", "Dysuria", "Pelvic Pain", "Postcoital Bleeding",
    "Multiple Symptoms — Details in Notes", "Not Assessed", "Not Applicable",
  ]),
  AREA("srh_exposure_partner_history", "Known Exposure, Partner Diagnosis & Previous Partner Treatment (when relevant)"),
  AREA("srh_investigations", "Investigations Ordered, Test Results & Treatment (state patient-reported vs verified)"),
  S("srh_counselling", "Counselling Provided", [
    "Provided", "Discussed — Follow-Up Planned", "Declined", "Not Indicated", "Not Assessed",
  ]),
  AREA("srh_sti_followup", "Follow-Up Plan"),
]);

const sexualFunction = G("function", "Sexual Function & Symptoms", [
  S("srh_dyspareunia", "Dyspareunia", [
    "None Reported", "Present — Superficial", "Present — Deep", "Present — Superficial & Deep",
    "Not Assessed", "Not Applicable", PNTA,
  ]),
  TXT("srh_dyspareunia_details", "Dyspareunia — Onset, Duration, Severity"),
  S("srh_dryness", "Vaginal Dryness / Discomfort", ["None Reported", "Present", "Not Assessed", "Not Applicable", PNTA]),
  S("srh_desire_arousal", "Desire, Arousal & Orgasmic Concerns (when relevant)", [
    "No Concerns Reported", "Reduced Desire", "Arousal Difficulty", "Orgasmic Concern",
    "Multiple Concerns", "Not Assessed", "Not Applicable", PNTA,
  ]),
  S("srh_male_function", "Erectile or Other Sexual-Function Concerns (when clinically relevant)", [
    "No Concerns Reported", "Concern Reported — Details in Notes", "Not Assessed", "Not Applicable",
  ]),
  S("srh_context", "Symptom Context (pregnancy, postpartum, menopause, medications, conditions)", [
    "Not Applicable", "Pregnancy-Related", "Postpartum Recovery", "Menopause", "Medication-Related",
    "Underlying Condition", "Multiple — Details in Notes", "Not Assessed",
  ]),
  AREA("srh_impact", "Onset, Duration, Severity, Associated Symptoms & Impact on Quality of Life"),
  S("srh_resumption_postpartum", "Readiness to Resume Sexual Activity (postpartum, when appropriate)", [
    "Resumed", "Not Yet — Recovery Ongoing", "Discussed", "Not Applicable", "Not Assessed", PNTA,
  ]),
]);

const safety = G("safety", "Consent, Safeguarding & Safety", [
  S("srh_private_opportunity", "Private Opportunity to Discuss Sexual Health", [
    "Provided — Patient Spoke Privately", "Provided — Patient Declined to Discuss", "Not Provided", "Not Assessed",
  ]),
  S("srh_accompanying_person", "Accompanying Person During Discussion", [
    "Not Present", "Present — Patient Explicitly Requested & Assessed Appropriate", "Not Applicable", "Not Documented",
  ]),
  S("srh_consensual_activity", "Consensuality of Sexual Activity (when clinically indicated)", [
    "Patient Reports Consensual", "Patient Reports Concerns — Safeguarding Action Below", "Not Assessed", "Not Applicable", PNTA,
  ]),
  S("srh_feels_safe", "Patient Reports Feeling Safe", [
    "Yes", "No — Safeguarding Action Below", "Not Assessed", "Not Applicable", PNTA,
  ]),
  S("srh_coercion_ipv", "Coercion, Sexual Violence, Exploitation or Intimate Partner Violence (trauma-informed, when indicated)", [
    "No Concerns Identified", "Concerns Identified — Details Below", "Not Assessed", "Not Applicable", PNTA,
  ]),
  AREA("srh_safeguarding_actions", "Safeguarding / Mandatory-Reporting Actions & Confidentiality Notes"),
  AREA("srh_safety_notes", "Additional Notes"),
]);

// ------------------------------------------------------------ doc mapping ----

const ALL_GROUPS = {
  activity,
  contraception,
  sti,
  function: sexualFunction,
  safety,
};

const DOC_GROUPS = {
  obgyn_initial_antenatal: ["activity", "contraception", "sti", "safety"],
  obgyn_antenatal_followup: ["sti"],
  obgyn_pregnancy_record: ["activity", "contraception", "sti", "safety"],
  obgyn_prenatal_care_plan: ["contraception"],
  obgyn_labor_delivery_record: [],
  obgyn_delivery_note: [],
  obgyn_csection_operative_note: [],
  obgyn_vaginal_delivery_note: [],
  obgyn_postpartum_note: ["contraception", "function", "safety"],
  obgyn_discharge_summary: ["contraception", "function"],
  obgyn_pregnancy_followup: ["sti"],
  obgyn_gyn_consultation: ["activity", "contraception", "sti", "function", "safety"],
  obgyn_gyn_followup: ["sti", "function"],
  obgyn_gyn_procedure_note: ["contraception"],
  obgyn_gyn_operative_note: ["contraception"],
  obgyn_gyn_preop_assessment: ["activity", "contraception"],
  obgyn_gyn_postop_note: ["contraception"],
  obgyn_gyn_discharge_summary: ["contraception"],
  obgyn_gyn_referral: ["activity", "contraception", "sti", "function"],
};

// Every existing or future OB/GYN sub-note falls back to the relevant
// reproductive-health history rather than being left without the section.
const DEFAULT_GROUPS = ["activity", "contraception", "sti", "safety"];

export function srhGroupsForDoc(docKey) {
  const keys = DOC_GROUPS[docKey] || DEFAULT_GROUPS;
  return keys.map((k) => ALL_GROUPS[k]).filter(Boolean);
}

// Section-level key — where the information came from (patient-reported vs
// verified), recorded once per encounter alongside the structured fields.
export const SRH_SOURCE_KEY = "srh_source";

// Findings stay structured: values are flat { fieldKey: "string" }. Labels are
// resolved from the schema at save time so the note carries its own labels,
// saved under the sensitive "srh." prefix — never mixed into general
// patient-facing summaries, printed exports or shared records.
export function flattenSrhValues(values, docKey) {
  const out = [];
  const v = values || {};
  const source = String(v[SRH_SOURCE_KEY] ?? "").trim();
  if (source !== "") out.push({ key: SRH_SOURCE_KEY, label: "Sexual & Reproductive History — Information Source", value: source });
  srhGroupsForDoc(docKey).forEach((g) => {
    g.fields.forEach((f) => {
      const val = String(v[f.key] ?? "").trim();
      if (val !== "") out.push({ key: f.key, label: `Sexual & Reproductive History — ${g.label} — ${f.label}`, value: val });
    });
  });
  return out;
}

export function srhAnyValue(values) {
  return Object.values(values || {}).some((v) => String(v ?? "").trim() !== "");
}

// Values that signal a positive / concerning finding for the collapsed-section
// badge and the amber field flag — colour is never the only signal.
const CONCERN_PREFIXES = ["Concern", "Present", "Multiple Symptoms", "Multiple Concerns", "No —", "Concerns Identified", "Concern Reported"];
export function srhConcernCount(values) {
  return Object.values(values || {}).filter((val) => {
    const s = String(val ?? "");
    return CONCERN_PREFIXES.some((p) => s.startsWith(p));
  }).length;
}