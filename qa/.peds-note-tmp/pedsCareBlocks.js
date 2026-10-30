// Pediatrics — developmental, preventive, chronic, adolescent and safeguarding
// blocks, plus the reasoning, procedure and family-education records.

const NOT_DOCUMENTED = "Not documented";

export const DEVELOPMENT_BLOCK = {
  key: "peds_development",
  title: "Developmental surveillance record",
  note:
    "Surveillance is recorded at every visit and screening at the intervals the AAP document sets. A red flag or a positive screen is recorded as a finding that requires action — never as a diagnosis, and never left without the referral or review it calls for.",
  fields: [
    { key: "dev_age_months", label: "Age at assessment", type: "number", unit: "months", min: 0, max: 250 },
    {
      key: "dev_domains",
      label: "Domains assessed",
      type: "multi",
      options: ["Gross motor", "Fine motor", "Speech and language", "Social and play", "Cognitive and problem-solving", "Self-care", "Hearing and vision"],
    },
    {
      key: "dev_milestones",
      label: "Milestone assessment recorded",
      type: "select",
      options: ["Age-appropriate in all assessed domains", "Delay suspected in one or more domains", "Regression — loss of acquired skills", "Not assessed", NOT_DOCUMENTED],
    },
    { key: "dev_tool", label: "Screening instrument used", type: "select", options: ["M-CHAT-R/F", "ASQ-3", "Denver II", "Institution instrument", "Surveillance only — no instrument", "Not performed", NOT_DOCUMENTED] },
    {
      key: "dev_result",
      label: "Screening result",
      type: "select",
      options: ["Screen negative", "Screen positive — referral made", "Screen positive — repeat screening planned", "Inconclusive — reassess at next visit", NOT_DOCUMENTED],
    },
    {
      key: "dev_red_flags",
      label: "Red flags documented",
      type: "multi",
      options: [
        "No social smile by 2 months",
        "Does not respond to sound",
        "No babbling by 9 months",
        "Not sitting without support by 9 months",
        "Not walking by 18 months",
        "No single words by 18 months",
        "No two-word phrases by 24 months",
        "Loss of previously acquired skills",
        "Hand preference before 12 months",
        "Abnormal tone or posturing",
        "Head circumference crossing centiles",
      ],
    },
    { key: "dev_hearing", label: "Hearing screening", type: "select", options: ["Passed", "Referred", "Not performed", NOT_DOCUMENTED] },
    { key: "dev_vision", label: "Vision screening", type: "select", options: ["Passed", "Referred", "Not performed", NOT_DOCUMENTED] },
    { key: "dev_referral_route", label: "Referral destination", type: "input", placeholder: "Audiology, speech and language, developmental paediatrics — where and when" },
    { key: "dev_caregiver_advice", label: "Caregiver advice given", type: "textarea", placeholder: "Play, reading, responsive feeding and stimulation advised for this age" },
    { key: "dev_notes", label: "Developmental notes", type: "textarea" },
  ],
};

export const IMMUNISATION_BLOCK = {
  key: "peds_immunisation",
  title: "Immunisation status & catch-up record",
  note:
    "The schedule the child follows is recorded, because national programmes differ (BCG and hepatitis B birth dose, for example). An antigen is marked overdue only against that schedule, and an overdue antigen is never left without a catch-up plan.",
  fields: [
    { key: "imm_schedule", label: "Schedule followed", type: "select", options: ["WHO routine immunisation schedule", "National schedule", "Institution schedule", NOT_DOCUMENTED] },
    {
      key: "imm_given",
      label: "Antigens documented as given",
      type: "multi",
      options: ["BCG", "Hepatitis B birth dose", "OPV or IPV", "DTP-containing (pentavalent)", "Pneumococcal conjugate", "Rotavirus", "Measles-containing (MCV1)", "MCV2", "HPV", "Influenza", "Other — documented below"],
    },
    {
      key: "imm_overdue",
      label: "Antigens documented as overdue",
      type: "multi",
      options: ["BCG", "Hepatitis B birth dose", "OPV or IPV", "DTP-containing (pentavalent)", "Pneumococcal conjugate", "Rotavirus", "Measles-containing (MCV1)", "MCV2", "HPV", "Influenza", "Other — documented below"],
    },
    { key: "imm_catch_up", label: "Catch-up plan", type: "select", options: ["Catch-up schedule documented", "Catch-up not yet documented", "No catch-up required", NOT_DOCUMENTED] },
    {
      key: "imm_contraindications",
      label: "Contraindications reviewed",
      type: "multi",
      options: ["Anaphylaxis to a vaccine component", "Severe immunodeficiency (live vaccines)", "Current moderate or severe acute illness", "Pregnancy (live vaccines)", "None identified"],
    },
    { key: "imm_aefi", label: "Adverse event following immunisation", type: "select", options: ["None documented", "Event documented below", NOT_DOCUMENTED] },
    { key: "imm_cold_chain", label: "Cold chain", type: "select", options: ["Maintained", "Breach documented", NOT_DOCUMENTED] },
    { key: "imm_batch", label: "Batch and site", type: "input", placeholder: "Batch numbers and administration sites" },
    { key: "imm_next_due", label: "Next dose due", type: "input", placeholder: "Antigen and date" },
    { key: "imm_notes", label: "Immunisation notes", type: "textarea" },
  ],
};

export const CHRONIC_BLOCK = {
  key: "peds_chronic",
  title: "Chronic condition & transition record",
  note:
    "A chronic condition in a child is reviewed with growth, development, school and self-management, not only with disease markers. The written emergency plan and the transition discussion are recorded because they are the parts a family cannot reconstruct later.",
  fields: [
    { key: "chr_condition", label: "Condition", type: "input", placeholder: "The documented chronic condition" },
    { key: "chr_since", label: "Diagnosed", type: "input", placeholder: "Age or date of diagnosis" },
    { key: "chr_control", label: "Control at this review", type: "select", options: ["Well controlled", "Partially controlled", "Uncontrolled", "In remission", NOT_DOCUMENTED] },
    { key: "chr_adherence", label: "Adherence", type: "select", options: ["Good", "Partial", "Poor", "Not assessed"] },
    {
      key: "chr_barriers",
      label: "Barriers documented",
      type: "multi",
      options: ["None documented", "Missed doses", "Adverse effect", "Cost or supply", "Device or technique problem", "Dose during school hours", "Caregiver understanding"],
    },
    {
      key: "chr_monitoring",
      label: "Monitoring recorded at this visit",
      type: "multi",
      options: ["Growth plotted", "Blood pressure", "Laboratory monitoring", "Vision and hearing", "Developmental review", "Mental health review", "Disease-specific score"],
    },
    { key: "chr_school", label: "School and daily life", type: "select", options: ["Attending normally", "Absences documented", "Additional support in place", "Not in school", NOT_DOCUMENTED] },
    { key: "chr_emergency_plan", label: "Written emergency plan", type: "select", options: ["Given and explained", "Given at a previous visit", "Not given", NOT_DOCUMENTED] },
    { key: "chr_self_management", label: "Self-management", type: "select", options: ["Age-appropriate self-management", "Caregiver-managed", "Transition readiness discussed", "Transition plan documented", NOT_DOCUMENTED] },
    { key: "chr_vaccination", label: "Additional vaccination for this condition", type: "select", options: ["Upto date for condition", "Additional vaccines needed", "Not applicable", NOT_DOCUMENTED] },
    { key: "chr_notes", label: "Chronic condition notes", type: "textarea" },
  ],
};

export const ADOLESCENT_BLOCK = {
  key: "peds_adolescent",
  title: "Adolescent psychosocial & confidentiality record",
  note:
    "The adolescent is seen alone for part of the visit, and confidentiality and its limits are explained. The HEEADSSS areas reviewed, the mood and suicide-risk assessment and the action each result requires are recorded — a positive risk answer is never left without a plan.",
  fields: [
    { key: "ado_seen_alone", label: "Seen alone", type: "select", options: ["Yes — confidential time documented", "No — reason documented", NOT_DOCUMENTED] },
    { key: "ado_confidentiality", label: "Confidentiality", type: "select", options: ["Explained, including its limits", "Not explained", NOT_DOCUMENTED] },
    {
      key: "ado_areas",
      label: "HEEADSSS areas reviewed",
      type: "multi",
      options: ["Home", "Education or employment", "Eating and body image", "Activities and peers", "Drugs, alcohol and vaping", "Sexuality and relationships", "Suicide, mood and self-harm", "Safety and violence"],
    },
    { key: "ado_mood_screen", label: "Mood screening", type: "select", options: ["Screen negative", "Screen positive — further assessment", "Not performed", NOT_DOCUMENTED] },
    {
      key: "ado_suicide_risk",
      label: "Suicide-risk assessment",
      type: "select",
      options: ["No risk identified", "Risk identified — safety plan documented", "Risk identified — urgent mental health referral", "Not assessed", NOT_DOCUMENTED],
    },
    { key: "ado_substance", label: "Substance use", type: "select", options: ["None disclosed", "Alcohol", "Tobacco or vaping", "Cannabis", "Other substance disclosed", "Not assessed", NOT_DOCUMENTED] },
    { key: "ado_sexual_health", label: "Sexual health", type: "select", options: ["Not discussed", "Discussed — contraception", "Discussed — STI testing", "Discussed — contraception and STI testing", "Not applicable", NOT_DOCUMENTED] },
    { key: "ado_safeguarding", label: "Safeguarding", type: "select", options: ["No concern documented", "Concern — recorded in the safeguarding record", "Not documented"] },
    { key: "ado_consent", label: "Consent basis", type: "select", options: ["Consent by the young person", "Consent by parent or guardian", "Assent with guardian consent", NOT_DOCUMENTED] },
    { key: "ado_shared_with", label: "What is shared with the caregiver", type: "input", placeholder: "Recorded so the young person knows what will be discussed" },
    { key: "ado_notes", label: "Adolescent notes", type: "textarea" },
  ],
};

export const SAFEGUARDING_BLOCK = {
  key: "peds_safeguarding",
  title: "Safeguarding record",
  note:
    "A safeguarding concern is documented against the history, the child's developmental stage and the examination, and the route taken is recorded with the time. Suspicion is recorded as suspicion — it is never coded as a confirmed injury.",
  fields: [
    { key: "sg_concern", label: "Concern", type: "select", options: ["No concern identified", "Concern documented", "Suspicion of abuse or neglect", "Disclosure made", NOT_DOCUMENTED] },
    {
      key: "sg_category",
      label: "Category documented",
      type: "multi",
      options: ["Physical abuse", "Neglect", "Emotional abuse", "Sexual abuse", "Fabricated or induced illness", "Female genital mutilation", "Trafficking or exploitation", "Not applicable"],
    },
    { key: "sg_history_consistency", label: "Injury against the history", type: "select", options: ["Consistent with the history", "Inconsistent with the history", "Not consistent with the developmental stage", "Not applicable", NOT_DOCUMENTED] },
    { key: "sg_explanation", label: "Explanation offered", type: "select", options: ["Consistent across accounts", "Inconsistent across accounts", "No explanation offered", "Child non-verbal for age", NOT_DOCUMENTED] },
    {
      key: "sg_actions",
      label: "Actions documented",
      type: "multi",
      options: ["Injuries mapped and measured", "Photographs taken per policy", "Skeletal survey requested", "Child protection team informed", "Social services notified", "Police informed", "Safety plan for discharge documented", "Follow-up appointment made"],
    },
    { key: "sg_route", label: "Route taken", type: "input", placeholder: "Who was contacted, when, and by which route" },
    { key: "sg_consent", label: "Consent", type: "select", options: ["Consent for assessment given", "Consent refused — documented", "Assessment under statutory powers", "Not applicable", NOT_DOCUMENTED] },
    { key: "sg_notes", label: "Safeguarding notes", type: "textarea", placeholder: "What was said, by whom, and what was observed — recorded verbatim where possible" },
  ],
};

export const FAMILY_BLOCK = {
  key: "peds_family",
  title: "Family education & safety advice record",
  note:
    "What the caregiver was told, how their understanding was confirmed, and what should bring the child back. The return criteria are recorded because the family, not the clinician, makes that decision at home.",
  fields: [
    {
      key: "fam_topics",
      label: "Topics covered",
      type: "multi",
      options: ["Feeding", "Safe sleep", "Injury prevention", "Fever management", "Medication administration", "When to return", "Immunisation schedule", "Development and play", "Screen time", "Nutrition and growth", "Hygiene and sanitation"],
    },
    { key: "fam_understanding", label: "Understanding confirmed", type: "select", options: ["Teach-back demonstrated", "Understanding not confirmed", "Interpreter used", "Written information given", NOT_DOCUMENTED] },
    { key: "fam_interpreter", label: "Interpreter", type: "select", options: ["Not required", "Used", "Needed and not available", NOT_DOCUMENTED] },
    { key: "fam_return_criteria", label: "Return criteria given", type: "textarea", placeholder: "The signs that must bring the child back, in the caregiver's own language" },
    { key: "fam_safe_sleep", label: "Safe sleep advice", type: "select", options: ["Given — supine sleep, firm surface, no loose bedding", "Given at a previous visit", "Not applicable for age", "Not given", NOT_DOCUMENTED] },
    { key: "fam_followup", label: "Follow-up arranged", type: "input", placeholder: "Where, when and with whom" },
    { key: "fam_questions", label: "Caregiver questions", type: "textarea" },
  ],
};

export const PROCEDURE_BLOCK = {
  key: "peds_procedure",
  title: "Procedure & sedation safety record",
  note:
    "A child's procedure record carries the weight the dosing was calculated from, the consent and the child's assent where age allows, the monitoring used and the recovery. Consent and weight are not optional details — they decide whether the sedation was safe.",
  fields: [
    { key: "proc_name", label: "Procedure", type: "input" },
    { key: "proc_weight_kg", label: "Weight used for dosing", type: "number", unit: "kg", min: 0.5, max: 250, hint: "The weight the drug doses were calculated from — recorded, never assumed." },
    { key: "proc_consent", label: "Consent and assent", type: "select", options: ["Guardian consent documented", "Guardian consent and child assent documented", "Consent not documented", NOT_DOCUMENTED] },
    { key: "proc_fasting", label: "Fasting per policy", type: "select", options: ["Fasting documented per policy", "Not fasted — emergency procedure documented", "Not documented"] },
    { key: "proc_sedation", label: "Sedation or anaesthesia", type: "input", placeholder: "Agent, dose and route" },
    {
      key: "proc_monitoring",
      label: "Monitoring documented",
      type: "multi",
      options: ["Continuous pulse oximetry", "Heart rate", "Respiratory rate", "Blood pressure", "Capnography", "Pain score"],
    },
    { key: "proc_airway", label: "Airway equipment", type: "select", options: ["Checked and available", "Not documented"] },
    { key: "proc_findings", label: "Findings", type: "textarea" },
    { key: "proc_specimens", label: "Specimens", type: "input" },
    { key: "proc_events", label: "Events during the procedure", type: "select", options: ["No complication documented", "Complication — documented below", "Not documented"] },
    { key: "proc_recovery", label: "Recovery", type: "select", options: ["Recovered and discharged", "Admitted for observation", "Escalated to higher care", "Not documented"] },
    { key: "proc_notes", label: "Procedure notes", type: "textarea" },
  ],
};

export const REASONING_BLOCK = {
  key: "peds_reasoning",
  title: "Clinical reasoning & documentation review",
  note:
    "The reasoning is recorded so the next clinician can see why a diagnosis was kept, excluded or left open — and which coding is still owed. A provisional diagnosis is recorded as provisional.",
  fields: [
    { key: "rea_considered", label: "Diagnoses considered", type: "textarea", placeholder: "Each diagnosis considered, and the documented evidence for keeping it" },
    { key: "rea_excluded", label: "Diagnoses excluded", type: "textarea", placeholder: "What was excluded and on what basis — a ruled-out diagnosis is not a current one" },
    { key: "rea_basis", label: "Basis for the working diagnosis", type: "textarea", placeholder: "The findings and results the working diagnosis rests on" },
    { key: "rea_certainty", label: "Diagnostic certainty", type: "select", options: ["Diagnosis established", "Diagnosis provisional — review planned", "Diagnosis uncertain — further assessment planned", NOT_DOCUMENTED] },
    { key: "rea_coding_owed", label: "Coding still owed", type: "textarea", placeholder: "Diagnoses awaiting a verified ICD-11 MMS code, and why" },
    {
      key: "rea_outstanding",
      label: "Outstanding at the end of this note",
      type: "multi",
      options: ["Repeat observation", "Laboratory result awaited", "Imaging result awaited", "Specialist opinion awaited", "Caregiver education pending", "Follow-up appointment pending", "Vaccination catch-up pending", "Coding review pending"],
    },
    { key: "rea_deterioration", label: "Deterioration and return plan", type: "textarea", placeholder: "What would count as deterioration, what the family was told to do, and the institution's route" },
  ],
};