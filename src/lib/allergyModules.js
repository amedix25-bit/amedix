// Allergy & Immunology — structured documentation blocks.
//
// Each block is ONE field of type `allergy_modules` on an existing AMedix note.
// The block's own definition lives here so the form, the saved note, the printed
// record, the safety prompts and the guideline attribution all read the same
// specification. Nothing here duplicates a shared AMedix surface: vital signs,
// the structured examination (Select Examination), medications, allergies,
// laboratory and imaging results and the patient's recorded history come from
// the unified Patient Record and the shared note tabs.
//
// Guideline vocabulary used in the option sets:
//   · Anaphylaxis — AAAAI/ACAAI practice parameter; WAO anaphylaxis guidance
//     (clinical criteria, adrenaline first-line, observation and biphasic risk).
//   · Asthma — GINA (control, severity steps 1–5, exacerbations, EIB).
//   · Allergic rhinitis / conjunctivitis — ARIA (intermittent vs persistent,
//     mild vs moderate–severe, intranasal / oral / ocular treatment).
//   · Urticaria and angioedema — EAACI/GA²LEN/EDF/WAO (acute vs chronic,
//     UAS7 and UCT as documented instruments, second-generation antihistamine
//     escalation, omalizumab).
//   · Atopic dermatitis — EAACI/AAAAI (distribution, documented severity
//     instrument, emollient / topical / systemic therapy, infection).
//   · Drug allergy — AAAAI/ACAAI and EAACI (reaction phenotype and timing,
//     index drug, delabelling pathway, provocation).
//   · Food allergy — AAAAI/ACAAI, EAACI (IgE- vs non-IgE-mediated, cofactors,
//     supervised challenge, growth and nutrition).
//   · Inborn errors of immunity — IUIS classification and the AAAAI practice
//     parameter (warning signs, infection pattern, immune-function workup).
//   · Allergen immunotherapy — EAACI AIT guideline and the ICON consensus
//     (build-up and maintenance dosing, local and systemic reactions, response).
//
// No block orders anything, and no block records a result that was not reported.

import {
  T, I, N, S, M, WHEN, WHEN_IN, NOT_ASSESSED, NOT_DOCUMENTED, NOT_APPLICABLE, UNKNOWN, YES_NO_DOC,
} from "@/lib/allergyFieldKit";

const CORE_BLOCKS = {
  // ---- Exposure, triggers and reaction history ---------------------------
  allergy_history: {
    title: "Allergy Exposure, Trigger & Reaction History",
    fields: [
      M("presentation", "Presenting Problem (as documented)", [
        "Rhinitis / nasal symptoms", "Conjunctivitis / ocular symptoms", "Asthma / wheeze",
        "Cough or breathlessness", "Food reaction", "Drug reaction", "Skin — eczema",
        "Skin — urticaria", "Angioedema / swelling", "Anaphylaxis", "Recurrent infections",
        "Suspected immunodeficiency", "Venom / insect sting reaction", "Other",
      ]),
      I("age_at_onset", "Age at Onset"),
      I("duration", "Duration of the Problem"),
      S("pattern", "Documented Pattern", [
        "Perennial — all year", "Seasonal — defined season", "Episodic — intermittent exposure",
        "Only with a specific trigger", "Continuous since onset", NOT_DOCUMENTED,
      ]),
      M("triggers", "Triggers Documented by the Patient", [
        "Tree pollen", "Grass pollen", "Weed pollen", "House dust mite", "Cat", "Dog",
        "Other animal dander", "Moulds", "Foods", "Drugs / medications", "Latex",
        "Insect sting", "Cold", "Heat", "Pressure / friction", "Exercise",
        "Alcohol", "NSAIDs", "Infection", "Occupational exposure", "No trigger identified",
      ]),
      T("trigger_detail", "Trigger Detail — Timing, Exposure Setting and Reproducibility"),
      I("occupation", "Occupation / Environment Relevant to Exposure"),
      S("route", "Documented Route of Exposure", [
        "Inhalation", "Ingestion", "Skin / mucosal contact", "Injection or infusion",
        "Insect sting", "Multiple routes", NOT_DOCUMENTED,
      ]),
      S("reaction_timing", "Documented Time from Exposure to Symptoms", [
        "Immediate — within minutes to 1 hour", "1–6 hours", "More than 6 hours",
        "Delayed — 24–72 hours or later", "Variable between episodes", NOT_DOCUMENTED,
      ]),
      S("reproducibility", "Reproducibility of the Reaction", [
        "Reproduced with the same exposure", "Not reproduced on every exposure",
        "Single episode only", "Not documented",
      ]),
      S("previous_reactions", "Previous Reactions to the Same Trigger", [
        "None documented", "One previous reaction", "Recurrent reactions", NOT_DOCUMENTED,
      ]),
      S("worst_previous_severity", "Worst Previously Documented Severity", [
        "Mild — local or limited", "Moderate — systemic, self-treated",
        "Severe — needed medical treatment", "Anaphylaxis — adrenaline given",
        "Anaphylaxis — intensive care admission", NOT_DOCUMENTED,
      ]),
      S("previous_adrenaline", "Adrenaline Used for a Previous Reaction", YES_NO_DOC),
      T("previous_workup", "Previous Allergy Testing or Assessment (and its result)"),
      T("previous_treatments", "Previous Treatments and Their Effect"),
      M("atopic_history", "Documented Atopic History", [
        "Asthma", "Atopic dermatitis / eczema", "Allergic rhinitis", "Food allergy",
        "Eosinophilic disorder", "None documented", NOT_ASSESSED,
      ]),
      S("family_atopy", "Family History of Atopy, Allergy or Immunodeficiency", [
        "None documented", "Atopy / allergy in first-degree relative",
        "Severe allergic reaction or anaphylaxis in the family",
        "Primary immunodeficiency in the family",
        "Consanguinity documented", NOT_DOCUMENTED,
      ]),
      M("cofactors", "Cofactors Documented Around Reactions", [
        "Exercise", "Alcohol", "NSAIDs", "Acute infection", "Fever",
        "Emotional stress", "Menstruation", "None documented", NOT_ASSESSED,
      ]),
      S("symptom_diary", "Symptom / Exposure Diary Kept", [
        "Yes — reviewed at this visit", "Yes — not yet reviewed", "No", NOT_DOCUMENTED,
      ]),
    ],
  },

  // ---- Specialty findings recorded at this visit -------------------------
  allergy_exam: {
    title: "Allergy & Immunology Findings at This Visit",
    fields: [
      S("general", "General Appearance", [
        "Well", "Mildly unwell", "Acutely unwell", "In distress", NOT_DOCUMENTED,
      ]),
      S("nasal", "Nasal Findings", [
        "Clear", "Pale / bluish turbinates", "Oedematous turbinates", "Clear rhinorrhoea",
        "Nasal polyps", "Septal deviation", "Crusting or bleeding", NOT_ASSESSED,
      ]),
      S("ocular", "Ocular Findings", [
        "Clear", "Conjunctival injection", "Watery discharge", "Periorbital oedema",
        "Cobblestone papillae", "Corneal involvement documented", NOT_ASSESSED,
      ]),
      S("respiratory", "Respiratory Findings", [
        "Normal air entry, no added sounds", "Wheeze — expiratory", "Wheeze — inspiratory and expiratory",
        "Prolonged expiratory phase", "Crackles", "Reduced air entry", "Stridor",
        "Increased work of breathing", NOT_ASSESSED,
      ]),
      S("skin", "Skin Findings", [
        "Clear", "Flexural eczema", "Lichenification", "Xerosis", "Urticarial weals",
        "Angioedema", "Contact dermatitis pattern", "Erythroderma", "Excoriation",
        "Secondary infection documented", NOT_ASSESSED,
      ]),
      S("systemic", "Systemic Findings", [
        "No systemic finding documented", "Hypotension documented", "Tachycardia documented",
        "Reduced consciousness level", "Lymphadenopathy", "Hepatosplenomegaly",
        "Growth or weight concern", "Dysmorphism documented", NOT_ASSESSED,
      ]),
      T("findings_detail", "Additional Documented Findings"),
    ],
  },

  // ---- Anaphylaxis -------------------------------------------------------
  allergy_anaphylaxis: {
    title: "Anaphylaxis Assessment & Treatment Record",
    fields: [
      I("onset_time", "Time of Onset"),
      I("exposure_time", "Time of Suspected Exposure"),
      S("suspected_trigger", "Suspected Trigger", [
        "Food", "Drug / medication", "Insect sting", "Latex", "Contrast media",
        "Exercise-associated", "Idiopathic — no trigger identified", "Other", NOT_DOCUMENTED,
      ]),
      I("trigger_detail", "Trigger Detail (food, drug, venom, product)"),
      M("criteria_met", "Clinical Criteria Documented (AAAAI/ACAAI · WAO)", [
        "Acute onset skin / mucosal involvement after a likely allergen",
        "Respiratory compromise — dyspnoea, wheeze, stridor, hypoxaemia",
        "Hypotension, collapse or end-organ dysfunction",
        "Persistent GI symptoms after exposure to a likely allergen",
        "Hypotension after exposure to a KNOWN allergen for that patient",
        "None of the criteria documented",
      ]),
      S("severity", "Documented Severity Grade", [
        "Grade 1 — skin / mucosal only", "Grade 2 — moderate, systemic",
        "Grade 3 — severe, hypoxia or hypotension", "Grade 4 — cardiac or respiratory arrest",
        "Not graded in the record",
      ]),
      M("systems", "Systems Involved (as documented)", [
        "Skin / mucosal", "Upper airway", "Lower airway", "Cardiovascular",
        "Gastrointestinal", "Neurological", "Other",
      ]),
      S("adrenaline_given", "Adrenaline Given", ["Yes — documented below", "No — not given", NOT_DOCUMENTED]),
      I("adrenaline_dose", "Adrenaline Dose", WHEN("adrenaline_given", "Yes — documented below")),
      S("adrenaline_route", "Adrenaline Route", [
        "Intramuscular — anterolateral thigh", "Intramuscular — other site",
        "Intravenous — monitored setting", "Subcutaneous", NOT_DOCUMENTED,
      ], WHEN("adrenaline_given", "Yes — documented below")),
      I("adrenaline_time", "Time Adrenaline Was Given", WHEN("adrenaline_given", "Yes — documented below")),
      N("adrenaline_doses", "Number of Adrenaline Doses", WHEN("adrenaline_given", "Yes — documented below")),
      M("adjuncts", "Adjunct Treatment Documented", [
        "High-flow oxygen", "Intravenous fluid bolus", "Inhaled bronchodilator",
        "H1 antihistamine", "H2 antihistamine", "Corticosteroid", "Glucagon",
        "Vasopressor infusion", "Airway support", "None",
      ]),
      S("positioning", "Positioning", ["Supine with legs elevated", "Sitting — breathing difficulty", "Other", NOT_DOCUMENTED]),
      S("refractory", "Refractory Anaphylaxis Documented", [
        "No", "Yes — repeated adrenaline required", "Yes — infusion required", NOT_DOCUMENTED,
      ]),
      S("observation", "Observation Period After Resolution", [
        "Less than 4 hours", "4–6 hours", "6–12 hours", "More than 12 hours",
        "Admitted for observation", NOT_DOCUMENTED,
      ]),
      S("biphasic_counselled", "Biphasic Reaction Risk Explained and Follow-Up Arranged", YES_NO_DOC),
      T("disposition", "Disposition and Documented Follow-Up (allergy referral, autoinjector, action plan)"),
    ],
  },

  // ---- Asthma and exercise-induced bronchoconstriction (GINA) ------------
  allergy_asthma: {
    title: "Asthma Assessment (GINA)",
    fields: [
      S("diagnosis_status", "Asthma Diagnosis Status", [
        "Confirmed — objective evidence documented", "Clinically suspected — no objective test documented",
        "Not documented", "Diagnosis reconsidered at this visit",
      ]),
      M("objective", "Objective Confirmation Documented", [
        "Spirometry — obstructive pattern", "Bronchodilator reversibility documented",
        "Peak-flow variability documented", "Bronchial provocation documented",
        "FeNO documented", "No objective confirmation documented",
      ]),
      M("control_symptoms", "Symptoms in the Last 4 Weeks (GINA control questions)", [
        "Daytime symptoms more than twice a week", "Night waking due to asthma",
        "Reliever needed more than twice a week", "Any activity limitation due to asthma",
        "No control question answered as yes",
      ]),
      S("control_level", "Assessed Control Level", [
        "Well controlled", "Partly controlled", "Uncontrolled", NOT_ASSESSED,
      ]),
      S("treatment_step", "Current GINA Treatment Step", [
        "Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Not on regular treatment", NOT_DOCUMENTED,
      ]),
      N("exacerbations_12m", "Exacerbations Requiring Oral Steroids or Urgent Care in 12 Months"),
      S("severe_exacerbation_history", "Ever Had a Severe Exacerbation (intubation, ICU, near-fatal)", YES_NO_DOC),
      M("triggers", "Documented Asthma Triggers", [
        "Allergens", "Exercise", "Viral infection", "Cold air", "Smoke / irritants",
        "Occupational exposure", "NSAIDs", "Stress", "None identified",
      ]),
      S("inhaler_technique", "Inhaler Technique Checked", [
        "Checked — correct", "Checked — errors corrected", "Not checked", NOT_DOCUMENTED,
      ]),
      S("adherence", "Documented Adherence", ["Good", "Partial", "Poor", "Not assessed"]),
      S("eib", "Exercise-Induced Bronchoconstriction Documented", YES_NO_DOC),
      T("eib_plan", "EIB Prevention Plan Documented (pre-exercise reliever, warm-up, controller)", WHEN("eib", "Yes")),
      S("action_plan", "Written Asthma Action Plan", [
        "Given and explained at this visit", "Previously given", "Not given", NOT_DOCUMENTED,
      ]),
      S("review_interval", "Documented Review Interval", [
        "1–3 months", "3–6 months", "6–12 months", "At exacerbation only", NOT_DOCUMENTED,
      ]),
    ],
  },

  // ---- Allergic rhinitis and conjunctivitis (ARIA) -----------------------
  allergy_rhinitis: {
    title: "Allergic Rhinitis & Conjunctivitis (ARIA)",
    fields: [
      S("duration_class", "ARIA Duration Classification", [
        "Intermittent — less than 4 days per week or less than 4 consecutive weeks",
        "Persistent — 4 or more days per week and more than 4 consecutive weeks",
        NOT_DOCUMENTED,
      ]),
      S("severity_class", "ARIA Severity Classification", [
        "Mild — no impairment of sleep, daily activities, sport, work or school",
        "Moderate–severe — impairment documented in at least one domain",
        NOT_DOCUMENTED,
      ]),
      M("symptoms", "Symptoms Documented", [
        "Sneezing", "Rhinorrhoea", "Nasal obstruction", "Nasal itch",
        "Ocular itch", "Ocular redness", "Watery eyes", "Post-nasal drip",
        "Anosmia or reduced smell", "Snoring or sleep disturbance",
      ]),
      S("score_instrument", "Symptom Score Instrument Documented", [
        "TNSS — total nasal symptom score", "VAS — visual analogue score",
        "Combined nasal and ocular score", "No score recorded", NOT_DOCUMENTED,
      ]),
      I("score_value", "Documented Score Value", WHEN_IN("score_instrument", ["TNSS — total nasal symptom score", "VAS — visual analogue score", "Combined nasal and ocular score"])),
      M("treatment_documented", "Treatment Documented at This Visit", [
        "Intranasal corticosteroid", "Intranasal antihistamine", "Oral second-generation antihistamine",
        "Oral antihistamine — first generation", "Leukotriene receptor antagonist",
        "Ocular antihistamine or mast-cell stabiliser", "Saline irrigation",
        "Decongestant — short course", "Allergen immunotherapy considered", "No treatment recorded",
      ]),
      S("ar_comorbidity", "Comorbid Conditions Documented", [
        "Asthma", "Conjunctivitis", "Chronic rhinosinusitis", "Nasal polyps",
        "Otitis media with effusion", "Sleep disturbance", "None documented", NOT_DOCUMENTED,
      ]),
      S("avoidance", "Allergen Avoidance Advice Documented", YES_NO_DOC),
      S("referral", "Specialist Referral Documented", [
        "Not required", "Allergy assessment requested", "ENT assessment requested",
        "Immunotherapy assessment requested", "Other",
      ]),
    ],
  },

  // ---- Food allergy ------------------------------------------------------
  allergy_food: {
    title: "Food Allergy Assessment",
    fields: [
      I("culprit_food", "Culprit Food(s) Documented"),
      S("mechanism", "Documented Mechanism", [
        "IgE-mediated — immediate", "Non-IgE-mediated — cell-mediated (e.g. FPIES, proctocolitis)",
        "Mixed — IgE and non-IgE (e.g. eosinophilic disorder)", "Mechanism not documented",
      ]),
      S("reaction_timing", "Documented Time from Ingestion to Symptoms", [
        "Within minutes to 2 hours", "1–4 hours", "4–24 hours",
        "Delayed — more than 24 hours (chronic)", "Variable", NOT_DOCUMENTED,
      ]),
      M("symptoms", "Symptoms Documented with the Reaction", [
        "Urticaria", "Angioedema", "Vomiting", "Diarrhoea", "Blood or mucus in stool",
        "Abdominal pain", "Wheeze", "Stridor", "Anaphylaxis", "Eczema flare",
        "Failure to thrive / growth concern", "Food refusal",
      ]),
      S("severity", "Worst Documented Reaction Severity", [
        "Mild — local or transient", "Moderate", "Anaphylaxis — adrenaline given",
        "Anaphylaxis — hospital treated", NOT_DOCUMENTED,
      ]),
      M("cofactors", "Cofactors Documented at Reaction", [
        "Exercise", "Alcohol", "NSAIDs", "Viral illness", "Menstruation",
        "None documented", NOT_ASSESSED,
      ]),
      S("test_correlation", "Test Result Correlation Documented", [
        "Positive test with a convincing clinical reaction",
        "Positive test without a documented clinical reaction",
        "Negative test with a documented reaction",
        "No test result recorded",
      ]),
      S("challenge_status", "Supervised Challenge Status", [
        "Not indicated", "Indicated — not yet performed", "Completed — documented below",
        "Pending appointment", "Declined by the family or patient", NOT_DOCUMENTED,
      ]),
      S("diet", "Documented Dietary Management", [
        "Strict avoidance of the culprit food", "Avoidance with substitute dietitian review",
        "Elimination diet — maternal (infant)", "Ladder / tolerance induction programme",
        "No dietary restriction documented",
      ]),
      S("growth", "Growth and Nutrition Assessed", [
        "Growth plotted and normal", "Growth concern documented", "Dietitian involved",
        "Not assessed",
      ]),
      S("emergency_plan", "Written Emergency Plan for Accidental Exposure", [
        "Given and explained", "Previously given", "Not given", NOT_DOCUMENTED,
      ]),
      S("school_plan", "School / Nursery / Care Plan Documented", [
        "Not applicable", "Given to the school or nursery", "Pending", "Not documented",
      ]),
      S("reassessment", "Reassessment Plan Documented", [
        "Repeat testing in 12 months", "Repeat testing in 6 months",
        "Supervised challenge when criteria met", "No reassessment planned", NOT_DOCUMENTED,
      ]),
    ],
  },

  // ---- Drug allergy and delabelling --------------------------------------
  allergy_drug: {
    title: "Drug Allergy & Delabelling Assessment",
    fields: [
      I("index_drug", "Index Drug Documented"),
      I("drug_class", "Drug Class / Group"),
      I("reaction_date", "Date or Age of the Reaction"),
      S("phenotype", "Documented Reaction Phenotype", [
        "Immediate urticaria / angioedema", "Anaphylaxis", "Bronchospasm",
        "Maculopapular exanthem", "Fixed drug eruption", "AGEP (acute generalised exanthematous pustulosis)",
        "DRESS / drug-induced hypersensitivity syndrome", "Stevens–Johnson syndrome / toxic epidermal necrolysis",
        "Drug-induced cytopenia", "Drug fever", "Other", NOT_DOCUMENTED,
      ]),
      S("timing", "Documented Time from First Dose to Reaction", [
        "Within 1 hour", "1–6 hours", "6–24 hours", "1–6 days", "More than 6 days",
        "On re-exposure after a tolerated course", NOT_DOCUMENTED,
      ]),
      S("severity", "Documented Severity", [
        "Mild — no treatment needed", "Moderate — treatment needed",
        "Severe — hospital care or systemic involvement", "Life-threatening", NOT_DOCUMENTED,
      ]),
      S("previous_exposure", "Previous Exposure to the Drug Documented", YES_NO_DOC),
      T("treatment_given", "Treatment Given for the Reaction"),
      S("label_state", "Current Recorded Allergy Label", [
        "Confirmed — reaction and evidence documented",
        "Possible — label kept pending assessment",
        "Unverified — label recorded without detail",
        "No evidence of allergy — label removed", NOT_DOCUMENTED,
      ]),
      S("delabelling_pathway", "Delabelling Pathway Documented", [
        "Direct oral provocation appropriate", "Skin test then provocation",
        "Provocation contraindicated — avoid and document alternatives",
        "Referral to allergy specialist", "None documented",
      ]),
      S("provocation_planned", "Drug Provocation Planned", [
        "Yes — documented below", "No — not indicated", "Declined", NOT_DOCUMENTED,
      ]),
      T("alternatives", "Documented Safe Alternatives / Cross-Reactivity Assessment"),
      S("record_updated", "Allergy Record Updated With the Outcome", YES_NO_DOC),
    ],
  },

  // ---- Skin allergy ------------------------------------------------------
  allergy_skin: {
    title: "Skin Allergy Assessment",
    fields: [
      M("conditions", "Conditions Documented", [
        "Atopic dermatitis / eczema", "Acute urticaria", "Chronic spontaneous urticaria",
        "Inducible urticaria", "Contact dermatitis", "Angioedema", "Eosinophilic dermatosis",
      ]),
      S("ad_distribution", "Atopic Dermatitis Distribution", [
        "Flexural — antecubital / popliteal", "Face and neck", "Hands",
        "Generalised", "Nummular", "Not applicable", NOT_ASSESSED,
      ]),
      S("ad_instrument", "Atopic Dermatitis Severity Instrument", [
        "EASI", "SCORAD", "POEM", "IGA", "No instrument recorded", NOT_APPLICABLE,
      ]),
      I("ad_score", "Documented Severity Score", WHEN_IN("ad_instrument", ["EASI", "SCORAD", "POEM", "IGA"])),
      M("ad_therapy", "Atopic Dermatitis Therapy Documented", [
        "Emollient", "Topical corticosteroid — potency documented", "Topical calcineurin inhibitor",
        "Topical antimicrobial", "Phototherapy", "Systemic immunosuppressant",
        "Biologic therapy", "Antihistamine", "None recorded",
      ]),
      S("ad_infection", "Skin Infection Documented", [
        "None", "Bacterial infection", "Eczema herpeticum", "Fungal infection", NOT_ASSESSED,
      ]),
      S("urticaria_type", "Urticaria Duration Classified", [
        "Acute — less than 6 weeks", "Chronic — 6 weeks or more", "Not applicable", NOT_ASSESSED,
      ]),
      S("urticaria_score", "Urticaria Activity / Control Score Documented", [
        "UAS7 — urticaria activity score over 7 days", "UCT — urticaria control test",
        "No score recorded", NOT_APPLICABLE,
      ]),
      I("urticaria_score_value", "Documented Score Value", WHEN_IN("urticaria_score", ["UAS7 — urticaria activity score over 7 days", "UCT — urticaria control test"])),
      S("urticaria_triggers", "Documented Urticaria Triggers", [
        "None identified", "Physical stimulus documented (cold, heat, pressure, dermographism)",
        "Drug — NSAID or other", "Infection", "Food", "Autoimmune association documented",
        NOT_DOCUMENTED,
      ]),
      M("urticaria_therapy", "Urticaria Therapy Documented", [
        "Second-generation H1 antihistamine — standard dose",
        "Second-generation H1 antihistamine — up-titrated dose",
        "First-generation antihistamine", "Short course systemic corticosteroid",
        "Omalizumab", "Ciclosporin", "No therapy recorded",
      ]),
      S("angioedema", "Angioedema Documented", YES_NO_DOC),
      S("angioedema_type", "Angioedema Type Documented", [
        "Histaminergic — with urticaria", "Bradykinin-mediated — suspected or confirmed",
        "ACE-inhibitor associated", "Hereditary angioedema", "Acquired angioedema", NOT_DOCUMENTED,
      ], WHEN("angioedema", "Yes")),
      S("patch_test_status", "Patch Testing Documented", [
        "Not indicated", "Performed — results recorded below", "Indicated — not yet performed",
        "Declined", NOT_DOCUMENTED,
      ]),
    ],
  },

  // ---- Clinical immunology ----------------------------------------------
  allergy_immunology: {
    title: "Clinical Immunology & Inborn Errors of Immunity",
    fields: [
      S("age_band", "Age Band at Assessment", [
        "Neonate", "Infant", "Child", "Adolescent", "Adult", "Older adult",
      ]),
      M("warning_signs", "Warning Signs Documented (AAAAI · IUIS)", [
        "Four or more ear infections in one year", "Two or more sinus infections in one year",
        "Two or more pneumonias in one year", "Two or more deep-seated or severe infections",
        "Recurrent deep skin or organ abscesses", "Persistent oral thrush or fungal infection",
        "Need for intravenous antibiotics to clear infection", "Failure to thrive or growth faltering",
        "Family history of primary immunodeficiency", "Unexplained recurrent fever",
        "Autoimmune cytopenia or autoimmunity at an early age", "Lymphoma or malignancy at an early age",
        "No warning sign documented",
      ]),
      N("warning_sign_count", "Number of Warning Signs Documented"),
      S("infection_pattern", "Documented Infection Pattern", [
        "Upper respiratory only", "Lower respiratory", "Gastrointestinal",
        "Skin and soft tissue", "Invasive / bloodstream", "Meningeal",
        "Multiple sites", "No infection documented",
      ]),
      T("organisms", "Organisms Documented (with site and date)"),
      S("iei_category", "Documented Category Under Consideration", [
        "Antibody deficiency", "Combined immunodeficiency",
        "Cellular / T-cell immunodeficiency", "Phagocytic or neutrophil defect",
        "Complement deficiency", "Immune dysregulation or autoinflammatory disorder",
        "Syndromic immunodeficiency", "Not yet categorised", NOT_DOCUMENTED,
      ]),
      S("vaccination_response", "Vaccine Antibody Response Documented", [
        "Protective titres documented", "Non-protective titres documented",
        "Tested — result pending", "Not tested", NOT_DOCUMENTED,
      ]),
      S("live_vaccine_safety", "Live Vaccine Safety Reviewed", [
        "Reviewed — live vaccines deferred pending assessment",
        "Reviewed — live vaccines considered safe on documented evidence",
        "Not reviewed", NOT_APPLICABLE,
      ]),
      S("genetic_testing", "Genetic Testing Documented", [
        "Not indicated", "Requested — result pending", "Result documented below",
        "Declined", NOT_DOCUMENTED,
      ]),
      T("genetic_detail", "Genetic Testing Detail (gene, variant, result)", WHEN("genetic_testing", "Result documented below")),
      S("prophylaxis", "Prophylaxis Documented", [
        "Antibiotic prophylaxis", "Immunoglobulin replacement", "Both",
        "None", NOT_DOCUMENTED,
      ]),
      S("specialist_referral", "Immunology Specialist Referral Documented", [
        "Not required", "Requested at this visit", "Already under specialist care",
        "Declined", NOT_DOCUMENTED,
      ]),
    ],
  },

  // ---- Allergen immunotherapy -------------------------------------------
  allergy_ait: {
    title: "Allergen Immunotherapy (SCIT / SLIT)",
    fields: [
      S("modality", "Modality Documented", [
        "Subcutaneous immunotherapy (SCIT)", "Sublingual tablet (SLIT)",
        "Sublingual drops (SLIT)", "Not started — under consideration", NOT_DOCUMENTED,
      ]),
      I("allergen", "Allergen / Extract Documented"),
      T("indication", "Documented Indication"),
      S("consent", "Informed Consent Documented", [
        "Obtained at this visit", "Previously obtained and reviewed", "Not documented",
      ]),
      S("asthma_control_before_dose", "Asthma Control Before Dose", [
        "Controlled — dose given", "Uncontrolled — dose withheld",
        "Not applicable — no asthma", NOT_DOCUMENTED,
      ]),
      S("phase", "Treatment Phase", [
        "Build-up / induction", "Maintenance", "Paused", "Completed", "Discontinued",
      ]),
      I("current_dose", "Current or Last Dose Documented"),
      S("missed_doses", "Missed or Delayed Doses Documented", [
        "None", "Yes — dose adjustment required", "Yes — restart of build-up required", NOT_DOCUMENTED,
      ]),
      S("local_reaction", "Local Reaction Documented", [
        "None", "Mild — resolved without treatment", "Moderate — treatment given",
        "Large local reaction", NOT_DOCUMENTED,
      ]),
      S("systemic_reaction", "Systemic Reaction Documented", [
        "None", "Mild — self-limited", "Moderate — treatment given",
        "Anaphylaxis — adrenaline given", NOT_DOCUMENTED,
      ]),
      S("dose_adjustment", "Dose Adjustment After Reaction", [
        "No adjustment", "Dose reduced", "Dose repeated", "Treatment paused",
        "Treatment discontinued", NOT_APPLICABLE,
      ]),
      S("observation_after_dose", "Observation Period After Dose", [
        "30 minutes documented", "More than 30 minutes documented",
        "Less than 30 minutes documented", NOT_DOCUMENTED,
      ]),
      S("response_review", "Treatment Response Reviewed", [
        "Reviewed — symptom score improved", "Reviewed — medication use reduced",
        "Reviewed — no change", "Not yet assessed", NOT_DOCUMENTED,
      ]),
      S("duration_planned", "Planned Duration Documented", [
        "3 years", "3–5 years", "Longer than 5 years", "Not documented",
      ]),
      S("adherence", "Adherence Documented", ["Good", "Partial", "Poor", "Not assessed"]),
    ],
  },

  // ---- Supervised provocation (OFC / DPT) --------------------------------
  allergy_provocation: {
    title: "Supervised Challenge / Drug Provocation Record",
    fields: [
      S("type", "Procedure Performed", [
        "Open food challenge", "Single-blind food challenge", "Double-blind placebo-controlled food challenge",
        "Drug provocation test", "Desensitisation / rapid protocol", "Not performed",
      ]),
      S("consent", "Written Consent Documented", ["Obtained", "Not documented"]),
      S("setting", "Setting Documented", [
        "Specialist allergy unit with resuscitation facilities", "Day-case unit", "Other", NOT_DOCUMENTED,
      ]),
      T("protocol", "Protocol Documented (doses, intervals, cumulative dose)"),
      I("start_time", "Start Time"),
      S("outcome", "Documented Outcome", [
        "Negative — tolerated the full target dose", "Positive — objective reaction reproduced",
        "Inconclusive — stopped for another reason", "Not completed", NOT_DOCUMENTED,
      ]),
      T("reaction_detail", "Reaction Detail (signs, timing, dose at reaction, treatment)"),
      I("observation_after", "Observation After the Final Dose"),
      T("conclusion", "Documented Conclusion and Advice Given"),
      S("record_updated", "Allergy Record Updated With the Outcome", YES_NO_DOC),
    ],
  },

  // ---- Management, education and follow-up ------------------------------
  allergy_management: {
    title: "Management, Education & Follow-Up",
    fields: [
      M("education", "Education Documented", [
        "Trigger avoidance strategy", "Allergen avoidance and label reading",
        "Inhaler and nasal spray technique", "Adrenaline autoinjector technique",
        "Urticaria trigger and treatment advice", "Emollient and topical steroid technique",
        "Food substitution and nutrition", "Infection-prevention advice",
        "Written action plan provided", "None documented",
      ]),
      S("autoinjector", "Adrenaline Autoinjector Documented", [
        "Prescribed and training given", "Prescribed — training not documented",
        "Not indicated", "Declined", NOT_DOCUMENTED,
      ]),
      S("medical_alert", "Medical Alert Information Documented", [
        "Wristband or card issued", "Recorded in the patient record only",
        "Not documented", NOT_APPLICABLE,
      ]),
      S("followup_interval", "Documented Follow-Up Interval", [
        "2 weeks", "4–6 weeks", "3 months", "6 months", "12 months",
        "As needed / open access", NOT_DOCUMENTED,
      ]),
      T("followup_plan", "Follow-Up Plan and Review Criteria"),
      T("referrals_made", "Referrals Made at This Visit (dietitian, immunology, dermatology, ENT, respiratory)"),
      S("safety_netting", "Safety-Netting Advice Documented", YES_NO_DOC),
    ],
  },
};

export const ALLERGY_BLOCKS = { ...CORE_BLOCKS };

export const allergyBlock = (key) => ALLERGY_BLOCKS[key] || null;

export const ALLERGY_BLOCK_KEYS = Object.keys(ALLERGY_BLOCKS);

// The block value a field holds, tagged with its own block key so the saved note,
// the screen and the printed record can be rebuilt without the form's context.
export const allergyBlockValue = (blockKey, value) => ({ ...(value || {}), __m: blockKey });

export const allergyBlockFrom = (value) => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return v.__m && ALLERGY_BLOCKS[v.__m] ? ALLERGY_BLOCKS[v.__m] : null;
};

// Printed form: every answered question, in the block's own order.
export const formatAllergyBlock = (value) => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const spec = allergyBlockFrom(value);
  if (!spec) return "";
  return spec.fields
    .map((f) => {
      const raw = v[f.key];
      const text = Array.isArray(raw) ? raw.filter(Boolean).join("; ") : String(raw ?? "").trim();
      return text ? `${f.label}: ${text}` : "";
    })
    .filter(Boolean)
    .join("\n");
};