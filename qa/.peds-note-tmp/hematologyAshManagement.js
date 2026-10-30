// Haematology — evidence-based management documentation.
//
// Every field here records a decision the clinician has already taken. Nothing
// prescribes, initiates anticoagulation, orders blood or changes a regimen: an
// order exists only once the treating clinician has entered it here or in the
// hospital's own system, and the `clinician_confirmation` field records that the
// decision was reviewed by an authorised prescriber.
//
// The guideline basis of a plan is recorded beside it, using the ASH register in
// hematologyAshGuidelines.js. Where ASH has no guideline for the question the
// block says so and asks for the complementary reference that was used — the app
// never attributes a non-ASH recommendation to ASH.
//
// These blocks complement, and never replace, hema_management: the existing
// generic management block stays on every note type exactly as it was.

import {
  T,
  I,
  S,
  M,
  WHEN,
  NOT_DOCUMENTED,
  NOT_APPLICABLE,
  UNKNOWN,
  YES_NO_STATES,
} from "./hematologyFieldKit.js";
import { HEMA_ASH_GUIDELINES, HEMA_ASH_GAPS, HEMA_ASH_PROVENANCE } from "./hematologyAshGuidelines.js";

const ROUTES = [
  "Oral",
  "Intravenous",
  "Intramuscular",
  "Subcutaneous",
  "Topical",
  "Inhalation",
  "Rectal",
  "Intrathecal",
  "Other",
  NOT_APPLICABLE,
];

// Options for the guideline-basis field: the ASH titles, then the two honest
// alternatives. A guideline title is never pre-selected.
const GUIDELINE_OPTIONS = [
  ...HEMA_ASH_GUIDELINES.map((g) => `ASH — ${g.title}`),
  "ASH publishes no guideline for this question — complementary reference recorded below",
  HEMA_ASH_PROVENANCE.local,
  "No guideline identified — documented clinical judgement",
];

const CONFIRMATION_OPTIONS = [
  "Reviewed and confirmed by the authorised prescriber",
  "Reviewed by the authorised prescriber — plan modified and documented",
  "Awaiting authorised prescriber review",
  NOT_APPLICABLE,
];

const basisFields = () => [
  S("guideline_basis", "Guideline basis recorded for this decision", GUIDELINE_OPTIONS, {
    note: "The ASH entries are the guidelines ASH currently publishes. Selecting one asserts only that it covers the question — the dose, the duration and the monitoring remain the treating clinician's decision.",
  }),
  I("complementary_reference", "Complementary reference used where ASH does not cover it", {
    placeholder: "Organisation, document title and edition — never recorded as an ASH statement",
  }),
  S("certainty", "Certainty / strength as published by the source", [
    "High",
    "Moderate",
    "Low",
    "Very low",
    "Not graded by the source",
    "Not stated",
    NOT_DOCUMENTED,
  ], {
    note: "Copied from the source. The app does not assign, upgrade or summarise evidence certainty.",
  }),
];

export const ASH_MANAGEMENT_BLOCKS = {
  // ---- Plan and its rationale ---------------------------------------------
  hema_ash_plan: {
    title: "Treatment Plan & Guideline Basis",
    note: "The plan, the evidence it rests on and the alternatives considered are recorded together, so the reasoning survives the encounter.",
    fields: [
      S("treatment_intent", "Treatment intent", [
        "Curative",
        "Disease-modifying",
        "Disease control",
        "Supportive and palliative",
        "Watch and wait",
        "Diagnostic work-up only",
        NOT_APPLICABLE,
      ]),
      ...basisFields(),
      T("clinical_rationale", "Clinical rationale for this plan", {
        placeholder: "Why this option, for this patient, at this stage — the documented evidence and the patient's circumstances",
      }),
      T("alternatives_considered", "Alternatives considered and why they were not chosen"),
      T("expected_benefit_and_risk", "Expected benefit and principal risks discussed"),
      S("treatment_limitation", "Documented limits of treatment", [
        "No limit documented",
        "Fitness or comorbidity limits intensive therapy",
        "Organ function limits dose intensity",
        "Patient preference limits treatment",
        "Supply or access limits treatment",
        "Not applicable",
      ]),
      I("review_milestone", "When the plan will be reassessed, and against what"),
      T("plan_detail", "Plan detail"),
    ],
  },

  // ---- Medication order ----------------------------------------------------
  hema_medication_order: {
    title: "Medication Order",
    note: "One block per medication decision. Dose, route, frequency, duration, contraindications screened and monitoring are recorded — never inferred from the plan.",
    fields: [
      I("medication_name", "Medication — name as prescribed"),
      I("active_ingredient", "Active ingredient / generic name"),
      I("indication", "Indication for this medication"),
      I("dose", "Dose with unit", { placeholder: "e.g. 100 mg, 15 mg/kg, 1 g" }),
      S("route", "Route", ROUTES),
      I("frequency", "Frequency", { placeholder: "e.g. once daily, twice daily, every 8 hours, single dose" }),
      I("duration", "Duration or stop date", { placeholder: "e.g. 7 days, until count recovery, continuing" }),
      I("dose_basis", "Dose basis", { placeholder: "Fixed dose, weight-based, body-surface area, renal adjustment, AUC target" }),
      M("contraindications_screened", "Contraindications and cautions screened before prescribing", [
        "Renal impairment",
        "Hepatic impairment",
        "Thrombocytopenia",
        "Neutropenia",
        "Pregnancy or lactation",
        "Prior hypersensitivity to this agent",
        "Drug interaction identified",
        "QT prolongation risk",
        "G6PD deficiency",
        "Active bleeding",
        "Live vaccine within 4 weeks",
        "None identified",
      ]),
      M("baseline_assessments", "Baseline assessments recorded before starting", [
        "Full blood count",
        "Renal function",
        "Liver function",
        "Coagulation profile",
        "Pregnancy test",
        "Virology screening",
        "ECG",
        "G6PD activity",
        "Cardiac function",
        "Not required for this agent",
      ]),
      M("monitoring_plan", "Monitoring required", [
        "Full blood count",
        "Renal function",
        "Liver function",
        "Coagulation or drug level",
        "Blood pressure",
        "Signs of bleeding",
        "Infection surveillance",
        "Clinical review only",
      ]),
      I("monitoring_frequency", "Monitoring frequency"),
      T("stop_or_modify_criteria", "Criteria for dose reduction, interruption or stopping"),
      T("modification_reason", "Reason for modification or discontinuation, if already changed"),
      S("clinician_confirmation", "Prescriber review", CONFIRMATION_OPTIONS),
      I("confirming_clinician", "Reviewing clinician and time"),
    ],
  },

  // ---- Anticoagulation -----------------------------------------------------
  hema_anticoagulation: {
    title: "Anticoagulation",
    note: "Indication, agent, dose, duration, bleeding risk and the reassessment plan are documented separately. Nothing is started by the app — anticoagulation is initiated only by the authorised prescriber.",
    fields: [
      S("anticoag_indication", "Indication", [
        "Provoked venous thromboembolism",
        "Unprovoked venous thromboembolism",
        "Cancer-associated thrombosis",
        "Pulmonary embolism",
        "Mechanical heart valve",
        "Atrial fibrillation",
        "Antiphospholipid syndrome",
        "Documented thrombophilia",
        "Heparin-induced thrombocytopenia — non-heparin anticoagulant required",
        "Other",
        NOT_APPLICABLE,
      ]),
      I("anticoag_indication_detail", "Indication detail — event, date and objective confirmation"),
      S("anticoag_agent", "Agent", [
        "Low-molecular-weight heparin",
        "Unfractionated heparin",
        "Fondaparinux",
        "Warfarin",
        "Apixaban",
        "Rivaroxaban",
        "Edoxaban",
        "Dabigatran",
        "Other",
        "None — not started",
      ]),
      I("anticoag_dose", "Dose and schedule", { placeholder: "e.g. enoxaparin 1 mg/kg twice daily; apixaban 10 mg twice daily for 7 days then 5 mg twice daily" }),
      I("anticoag_renal_consideration", "Renal function and any dose adjustment made"),
      S("anticoag_duration", "Planned duration", [
        "3 months",
        "6 months",
        "12 months",
        "Indefinite",
        "Until the provoking factor resolves",
        "Under review",
        NOT_DOCUMENTED,
      ]),
      M("bleeding_risk_factors", "Bleeding risk factors documented", [
        "Prior major bleeding",
        "Thrombocytopenia",
        "Renal impairment",
        "Liver disease",
        "Concurrent antiplatelet or NSAID",
        "Recent surgery or trauma",
        "Uncontrolled hypertension",
        "Alcohol excess",
        "Active malignancy",
        "Falls risk or frailty",
        "None identified",
      ]),
      S("bleeding_risk_category", "Bleeding risk assigned by the clinician", [
        "Low",
        "Intermediate",
        "High",
        "Not assessed",
      ], { note: "A judgement recorded by the clinician. The app does not calculate a bleeding score." }),
      S("anticoag_contraindication", "Contraindication status", [
        "No contraindication identified",
        "Contraindicated — documented below",
        "Relative — decision documented",
        "Not assessed",
      ]),
      T("anticoag_contraindication_detail", "Contraindication or relative-risk detail"),
      M("anticoag_monitoring", "Monitoring arranged", [
        "Full blood count",
        "Renal function",
        "Anti-Xa level",
        "INR",
        "Liver function",
        "Signs of bleeding at each review",
      ]),
      I("anticoag_reassessment", "Date of the next anticoagulation reassessment", { type: "date" }),
      T("interruption_plan", "Plan for procedures, surgery or interruption"),
      T("reversal_plan", "Reversal agent and major-bleeding plan"),
      M("anticoag_education", "Patient education documented", [
        "Purpose and expected duration",
        "Missed-dose advice",
        "Bleeding warning signs",
        "Drug and food interactions",
        "Need to declare anticoagulation before procedures",
        "Anticoagulation card or alert issued",
      ]),
      S("clinician_confirmation", "Prescriber review", CONFIRMATION_OPTIONS),
      I("confirming_clinician", "Reviewing clinician and time"),
    ],
  },

  // ---- Transfusion prescription -------------------------------------------
  hema_transfusion_prescription: {
    title: "Transfusion Prescription",
    note: "The indication, the threshold applied, the product chosen and the compatibility checks are recorded before the component is requested. The app never orders blood and never selects a product.",
    fields: [
      S("transfusion_indication", "Indication", [
        "Symptomatic anaemia",
        "Haemoglobin threshold reached — documented",
        "Acute blood loss",
        "Peri-operative or procedural cover",
        "Chronic transfusion programme",
        "Sickle cell — acute complication",
        "Sickle cell — stroke prevention",
        "Platelet count threshold reached",
        "Active bleeding with thrombocytopenia",
        "Coagulopathy requiring plasma or cryoprecipitate",
        "Other",
      ]),
      I("threshold_applied", "Threshold applied", { placeholder: "e.g. Hb below 70 g/L; platelets below 10 ×10⁹/L; institutional protocol reference" }),
      I("value_at_decision", "Value at the time of the decision, with unit and time"),
      M("components_requested", "Component requested", [
        "Red cells",
        "Platelets — pooled",
        "Platelets — apheresis",
        "Plasma",
        "Cryoprecipitate",
      ]),
      I("units_requested", "Units requested"),
      T("product_selection_rationale", "Product selection rationale", {
        placeholder: "Why this component, and why any special requirement — irradiation, phenotype matching, CMV-negative, washed, leucodepleted",
      }),
      M("special_requirements", "Special requirements", [
        "Irradiated",
        "Leucodepleted",
        "Washed",
        "Phenotype-matched",
        "CMV-negative",
        "None documented",
      ]),
      S("compatibility_status", "Compatibility status", [
        "Group and antibody screen current",
        "Crossmatch complete",
        "Antibody history reviewed",
        "Emergency release — group O issued",
        "Not yet available",
        NOT_DOCUMENTED,
      ]),
      S("consent_status", "Consent", [
        "Written consent documented",
        "Verbal consent documented",
        "Emergency — unable to consent, documented",
        "Patient declined",
        "Declined — decision under review",
      ]),
      M("pre_transfusion_checks", "Pre-transfusion checks documented", [
        "Patient identity confirmed at the bedside",
        "Prescription and component matched",
        "Unit and patient details checked",
        "Baseline observations recorded",
        "Intravenous access confirmed",
        "Consent confirmed",
      ]),
      M("monitoring_arranged", "Monitoring arranged", [
        "Observations at 15 minutes",
        "Observations every 30 minutes",
        "Observations at completion",
        "Continuous observation",
      ]),
      T("reaction_plan", "Action plan if a reaction is suspected", {
        placeholder: "Stop the transfusion, keep the line, report to the blood bank, samples and observations",
      }),
      S("clinician_confirmation", "Prescriber review", CONFIRMATION_OPTIONS),
      I("confirming_clinician", "Requesting clinician and time"),
    ],
  },

  // ---- Iron and nutritional replacement ------------------------------------
  hema_iron_nutrition: {
    title: "Iron & Nutritional Replacement",
    note: "The deficiency being treated, the route chosen, the dose and how the response will be judged are recorded. ASH has published diagnostic guidance for iron deficiency; treatment guidance is still in development, so the complementary reference is recorded.",
    fields: [
      S("deficiency_type", "Deficiency documented", [
        "Absolute iron deficiency",
        "Iron deficiency without anaemia",
        "Functional iron deficiency",
        "Vitamin B12 deficiency",
        "Folate deficiency",
        "Mixed deficiency",
        "Not established",
      ]),
      T("diagnostic_basis", "Diagnostic basis", { placeholder: "Ferritin, transferrin saturation, B12/folate, and the range used for this patient" }),
      S("replacement_route", "Route", ["Oral", "Intravenous", "Intramuscular", "None — not replaced", NOT_APPLICABLE]),
      I("replacement_product", "Product"),
      I("replacement_dose", "Dose and schedule", { placeholder: "e.g. ferrous sulfate 200 mg once daily; iron sucrose 200 mg in 250 mL over 30 minutes" }),
      I("replacement_duration", "Planned duration or total dose"),
      T("cause_addressed", "Cause of the deficiency addressed", {
        placeholder: "Blood loss, malabsorption, diet, menorrhagia, gastrointestinal lesion — and what is being done about it",
      }),
      M("response_assessment", "How the response will be judged", [
        "Repeat full blood count",
        "Reticulocyte response",
        "Ferritin and transferrin saturation",
        "Symptom response",
        "Repeat B12 or folate",
      ]),
      I("response_review_date", "Date of the response assessment", { type: "date" }),
      M("replacement_monitoring", "Monitoring arranged", [
        "Full blood count",
        "Ferritin and transferrin saturation",
        "Phosphate during intravenous iron",
        "Observations during infusion",
        "Infusion reaction surveillance",
      ]),
      M("replacement_adverse_effects", "Adverse effects documented", [
        "None reported",
        "Constipation",
        "Nausea or abdominal discomfort",
        "Dark stools",
        "Infusion reaction",
        "Hypophosphataemia",
        "Extravasation",
        "Other",
      ]),
      S("replacement_adherence", "Adherence", ["Adherent", "Missed doses reported", "Stopped — documented", NOT_APPLICABLE]),
      ...basisFields(),
    ],
  },

  // ---- Immunosuppressive / disease-modifying therapy ----------------------
  hema_immunosuppression: {
    title: "Immunosuppressive & Disease-Modifying Therapy",
    note: "Screening before treatment, prophylaxis, monitoring and the stopping rules are documented before the first dose. The app does not start or adjust any immunosuppressive therapy.",
    fields: [
      S("therapy_class", "Therapy class", [
        "Corticosteroid",
        "Thrombopoietin receptor agonist",
        "Intravenous immunoglobulin",
        "Anti-CD20 monoclonal antibody",
        "Calcineurin inhibitor",
        "Antimetabolite (azathioprine, mycophenolate)",
        "Complement inhibitor",
        "Interferon",
        "Hydroxyurea",
        "Other",
        NOT_APPLICABLE,
      ]),
      I("therapy_agent", "Agent"),
      I("therapy_dose", "Dose, route and frequency"),
      I("therapy_duration", "Planned duration or course"),
      M("pretreatment_screening", "Screening before starting", [
        "Hepatitis B serology",
        "Hepatitis C serology",
        "HIV serology",
        "Tuberculosis screening",
        "Pregnancy test",
        "Full blood count",
        "Renal function",
        "Liver function",
        "Vaccination status reviewed",
        "Cardiac assessment",
      ]),
      M("prophylaxis_arranged", "Prophylaxis arranged", [
        "Antiviral prophylaxis",
        "Pneumocystis jirovecii prophylaxis",
        "Antifungal prophylaxis",
        "Antibacterial prophylaxis",
        "Venous thromboembolism prophylaxis",
        "Bone protection",
        "Gastric protection",
        "None required",
      ]),
      M("therapy_monitoring", "Monitoring arranged", [
        "Full blood count",
        "Renal function",
        "Liver function",
        "Drug level",
        "Blood pressure",
        "Glucose",
        "Infection surveillance",
        "Bone density",
      ]),
      I("cumulative_dose_watch", "Cumulative dose or exposure limit to watch"),
      S("live_vaccine_caution", "Live vaccine caution documented", YES_NO_STATES),
      T("stop_criteria", "Criteria for stopping or escalating therapy"),
      T("therapy_adverse_effects", "Adverse effects and the reason for any change"),
      S("clinician_confirmation", "Prescriber review", CONFIRMATION_OPTIONS),
      I("confirming_clinician", "Reviewing clinician and time"),
    ],
  },

  // ---- Chemotherapy and targeted therapy ----------------------------------
  hema_chemo_targeted: {
    title: "Chemotherapy & Targeted Therapy",
    note: "Recorded where the encounter involves cytotoxic or targeted treatment. The regimen and its protocol reference are recorded as prescribed — the app does not calculate doses or select regimens.",
    fields: [
      I("regimen_name", "Regimen as prescribed"),
      I("protocol_reference", "Protocol reference and version", { placeholder: "Local protocol or trial number, with the version in use" }),
      S("line_of_therapy", "Line of therapy", [
        "First line",
        "Second line",
        "Third line or later",
        "Consolidation",
        "Maintenance",
        "Relapse therapy",
        NOT_APPLICABLE,
      ]),
      I("cycle_and_day", "Cycle and day"),
      T("agents_and_doses", "Agents with dose, route, frequency and duration", {
        placeholder: "One line per agent, exactly as prescribed and checked",
      }),
      S("dose_calculation_basis", "Dose calculation basis", [
        "Body-surface area",
        "Weight-based",
        "Fixed dose",
        "Renal-adjusted",
        "AUC-targeted",
        "Protocol-defined",
        NOT_DOCUMENTED,
      ]),
      T("dose_modifications", "Dose modifications and their reason"),
      M("supportive_protocols", "Supportive protocols applied", [
        "Antiemetic prophylaxis per MASCC/ESMO",
        "Tumour lysis prophylaxis",
        "Granulocyte colony-stimulating factor",
        "Antimicrobial prophylaxis",
        "Mouth care protocol",
        "Fertility preservation discussed",
        "Venous thromboembolism prophylaxis",
        "Growth factor support",
      ]),
      M("cycle_monitoring", "Monitoring before each cycle", [
        "Full blood count",
        "Renal function",
        "Liver function",
        "Cardiac function",
        "Virology",
        "Performance status",
        "Treatment response assessment",
      ]),
      T("extravasation_plan", "Extravasation and infusion reaction plan"),
      T("escalation_criteria", "Criteria for same-day escalation"),
      ...basisFields(),
      S("clinician_confirmation", "Prescriber review", CONFIRMATION_OPTIONS),
    ],
  },

  // ---- Infection prevention and supportive care ---------------------------
  hema_infection_support: {
    title: "Infection Prevention & Supportive Care",
    note: "Neutropenia status, precautions, prophylaxis and vaccination are documented as arranged. ASH publishes no febrile neutropenia guideline, so the antimicrobial reference is recorded on its own terms.",
    fields: [
      S("neutropenia_status", "Neutropenia status documented", [
        "Not neutropenic by count",
        "Mild — ANC 1.0 to 1.5 ×10⁹/L",
        "Moderate — ANC 0.5 to 1.0 ×10⁹/L",
        "Severe — ANC below 0.5 ×10⁹/L",
        "Not assessed",
      ], { note: "Recorded from the count the laboratory reported, not calculated by the app." }),
      M("neutropenic_precautions", "Neutropenic precautions in place", [
        "Single room",
        "Hand hygiene reinforced",
        "Food safety advice given",
        "Avoid rectal procedures and suppositories",
        "Avoid fresh flowers and plants",
        "Mask when outside the room",
        "Visitor restriction",
        "None — not neutropenic",
      ]),
      M("antimicrobial_prophylaxis", "Antimicrobial prophylaxis", [
        "Antibacterial prophylaxis",
        "Antifungal prophylaxis",
        "Antiviral prophylaxis",
        "Pneumocystis jirovecii prophylaxis",
        "None",
      ]),
      I("prophylaxis_detail", "Prophylaxis detail", { placeholder: "Agent, dose, frequency and stop rule" }),
      M("vaccination", "Vaccination status and plan", [
        "Influenza",
        "Pneumococcal",
        "Haemophilus influenzae type b",
        "Meningococcal",
        "Hepatitis B",
        "COVID-19",
        "Live vaccines avoided — documented",
        "Vaccination not indicated",
      ]),
      S("fever_action_plan", "Fever action plan given to the patient", [
        "Documented — return immediately with fever",
        "Documented — contact the unit before attending",
        "Not documented",
        NOT_APPLICABLE,
      ]),
      T("fever_action_detail", "Fever action detail", {
        placeholder: "Who to contact, where to attend, what to say — and the documented instruction not to wait for review",
      }),
      S("growth_factor", "Granulocyte colony-stimulating factor", [
        "Not used",
        "Primary prophylaxis",
        "Secondary prophylaxis",
        "Therapeutic use",
        "Documented decision not to use",
      ]),
      M("supportive_measures", "Other supportive care arranged", [
        "Tumour lysis prophylaxis and monitoring",
        "Nutritional support",
        "Psychosocial support",
        "Pain management",
        "Mouth care",
        "Transfusion support plan",
        "Fertility preservation",
      ]),
      I("supportive_reference", "Reference used for the antimicrobial or supportive decision", {
        placeholder: "Organisation, title and edition — recorded as its own source, not as ASH",
      }),
    ],
  },

  // ---- Thrombosis and bleeding prevention --------------------------------
  hema_thromboprophylaxis: {
    title: "Thrombosis & Bleeding Prevention",
    note: "Thrombotic risk, bleeding risk and the prophylaxis decision are documented together, with the reason when prophylaxis is withheld.",
    fields: [
      S("vte_risk_category", "Thrombotic risk assigned by the clinician", [
        "Low",
        "Intermediate",
        "High",
        "Not assessed",
      ], { note: "A judgement, not a calculated score. The app does not assign a risk category." }),
      M("thrombotic_risk_factors", "Thrombotic risk factors documented", [
        "Active cancer",
        "Immobility",
        "Prior venous thromboembolism",
        "Central venous catheter",
        "Recent surgery",
        "Inherited or acquired thrombophilia",
        "Pregnancy or postpartum",
        "Obesity",
        "Oestrogen-containing therapy",
        "Myeloproliferative neoplasm",
        "None identified",
      ]),
      M("bleeding_risk_factors", "Bleeding risk factors documented", [
        "Severe thrombocytopenia",
        "Active bleeding",
        "Recent major surgery",
        "Intracranial lesion",
        "Coagulopathy",
        "Renal impairment",
        "Concurrent antiplatelet therapy",
        "None identified",
      ]),
      S("prophylaxis_decision", "Prophylaxis decision", [
        "Pharmacological prophylaxis prescribed",
        "Mechanical prophylaxis only",
        "Combined pharmacological and mechanical",
        "Withheld — bleeding risk documented",
        "Withheld — not indicated",
        "Not yet decided",
      ]),
      I("prophylaxis_agent", "Prophylaxis agent and dose, where prescribed"),
      I("withheld_reason", "Reason prophylaxis was withheld, where withheld"),
      M("bleeding_precautions", "Bleeding precautions documented", [
        "Avoid NSAIDs and intramuscular injections",
        "Pressure after venepuncture",
        "Soft toothbrush and electric razor",
        "Avoid contact sports",
        "Anticoagulation alert card issued",
        "Signs of bleeding explained",
        "None required",
      ]),
      I("prophylaxis_reassessment", "When prophylaxis and bleeding risk will be reassessed"),
      ...basisFields(),
    ],
  },

  // ---- Counselling and shared decision-making ----------------------------
  hema_counsel: {
    title: "Counselling & Shared Decision-Making",
    note: "What was discussed, what the patient decided, and what matters to them are recorded in the patient's own terms. A decision recorded as agreed is the patient's, not an inference from the plan.",
    fields: [
      M("topics_discussed", "Discussed and documented", [
        "Diagnosis and what it means",
        "Treatment options, benefits and risks",
        "Option of no treatment or observation",
        "Expected outcome and prognosis",
        "Transfusion and its risks",
        "Anticoagulation and bleeding risk",
        "Infection risk and precautions",
        "Fertility and pregnancy planning",
        "Vaccination",
        "Genetic counselling",
        "Clinical trial participation",
        "Cost, access and travel",
      ]),
      S("decision_making_model", "How the decision was reached", [
        "Shared decision documented",
        "Patient-led decision",
        "Clinician-led — patient unable to participate, documented",
        "Patient declined to discuss",
        NOT_DOCUMENTED,
      ]),
      T("patient_preferences", "The patient's documented preferences", {
        placeholder: "What matters most to the patient, treatments they want or do not want, and any prior documented preference",
      }),
      S("goals_of_care", "Documented goals of care", [
        "Curative intent",
        "Life-prolonging treatment",
        "Comfort-focused care",
        "Not yet documented",
        NOT_APPLICABLE,
      ]),
      S("informed_consent", "Consent to the documented plan", [
        "Written consent documented",
        "Verbal consent documented",
        "Consent deferred — decision pending",
        "Declined",
        NOT_APPLICABLE,
      ]),
      S("interpreter", "Interpreter", [
        "Not needed",
        "Professional interpreter used",
        "Family member interpreted — documented",
        "Language support declined",
      ]),
      S("understanding_confirmed", "Understanding confirmed", [
        "Teach-back completed — understanding confirmed",
        "Partial understanding — plan revisited",
        "Not assessed",
      ]),
      M("written_information", "Written information given", [
        "Condition information leaflet",
        "Written treatment plan",
        "Contact numbers for urgent problems",
        "Anticoagulation or transfusion information",
        "None given",
      ]),
      T("counselling_detail", "Counselling detail and the patient's questions"),
      S("decision_owner", "Decisions in this plan made by", [
        "The treating haematologist",
        "The treating team with the patient",
        "Referral to the multidisciplinary meeting",
        "Not yet decided",
      ]),
    ],
  },
};

export const ASH_MANAGEMENT_BLOCK_KEYS = Object.keys(ASH_MANAGEMENT_BLOCKS);

// Blocks whose visibility follows the working diagnostic group recorded in the
// note, so a consultation does not present chemotherapy documentation for an
// iron-deficiency review. `showIf` uses the same key/`in` mechanism as the rest
// of the note form.
export const hemaAshBlock = (key, label, showIf) => ({
  key,
  label,
  type: "hema_modules",
  ...(showIf ? { showIf } : {}),
});

export const ASH_BLOCK_GROUP_RULES = {
  hema_anticoagulation: ["Thrombosis or anticoagulation", "Haematological emergency"],
  hema_transfusion_prescription: [
    "Anaemia",
    "Haemoglobinopathy",
    "Platelet disorder",
    "Bleeding disorder",
    "Cytopenia or marrow failure",
    "Haematological emergency",
  ],
  hema_iron_nutrition: ["Anaemia", "Haemoglobinopathy"],
  hema_immunosuppression: ["Platelet disorder", "Cytopenia or marrow failure", "Lymphoid neoplasm"],
  hema_chemo_targeted: ["Myeloid neoplasm", "Lymphoid neoplasm", "Plasma cell disorder"],
};