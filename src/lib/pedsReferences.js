// Pediatrics — governing clinical references, the conflict register and the
// evidence basis recorded with each note.
//
// PRIMARY AUTHORITIES: the American Academy of Pediatrics (AAP), the World Health
// Organization (WHO) — including Integrated Management of Childhood Illness and the
// WHO child growth standards — and the paediatric specialty societies whose
// documents govern a specific presentation (GINA for asthma, ILAE for seizure
// classification, AHA for Kawasaki disease, PALISI/SCCM for paediatric sepsis).
//
// WHAT IS RECORDED, AND WHAT IS NOT
//   · Only the document's identity (body, title, edition), the population it covers
//     and the link to the publisher. Guideline text is copyright protected and is
//     NOT reproduced in this app.
//   · The requirements the notes ask for are AMedix's own wording of what the cited
//     document requires to be documented. They are not quotations, and no threshold
//     is attributed to a body that does not publish it.
//   · `revision_verified` states whether the edition below was confirmed as current
//     on the publisher's page at review time. None is presented as current: the
//     guidance panel tells the reviewing clinician to confirm the revision before
//     the note is relied on as the department standard.
//   · Where two bodies publish guidance that cannot both be applied to the same
//     child, the difference is recorded in PEDS_GUIDELINE_CONFLICTS and flagged for
//     qualified paediatric review — never silently combined into one instruction.

export const PEDS_LAST_REVIEWED = "2026-10-30";

// Publication or update date of the edition recorded below.
//
// Only dates confirmed for that exact edition are entered. Where the date could not be
// confirmed, the register says so instead of inferring one from the edition number —
// an unverified date presented as a fact would make the attribution untraceable.
export const PEDS_PUBLICATION = {
  aap_bright_futures: "2017",
  aap_hyperbilirubinemia: "2022",
  aap_febrile_infant: "2021",
  aap_bronchiolitis: "2014",
  aap_aom: "2013",
  aap_developmental_screening: "2006",
  aap_autism: "2020",
  aap_child_abuse: "2015",
  aap_sids: "2022",
  aap_obesity: "2023",
  aap_iron: "2010",
  aap_uti: "2011",
  who_imci: "2014",
  who_growth_standards: "2006",
  who_growth_reference: "2007",
  who_newborn: "2017",
  who_preterm: "2022",
  who_pneumonia: "2014",
  who_diarrhoea: "2013",
  who_oxygen: "2016",
  who_nurturing_care: "2018",
  who_inspire: "2016",
  gina_asthma: "annual — confirm the current report",
  ilae_seizure_classification: "2017",
  aha_kawasaki: "2017",
  palsi_sepsis: "2020",
};

// The date as it is written into the note's attribution: the year, or a plain
// statement that it was not confirmed. Never a guessed date.
export const pedsPublicationLabel = (key) =>
  PEDS_PUBLICATION[key] ? `published ${PEDS_PUBLICATION[key]}` : "publication date not verified";

export const PEDS_REFERENCES = {
  // ---- American Academy of Pediatrics ---------------------------------------
  aap_bright_futures: {
    organization: "AAP",
    title: "Bright Futures: Guidelines for Health Supervision of Infants, Children, and Adolescents",
    edition: "4th edition",
    revision_verified: false,
    population: "Children and adolescents from birth to 21 years",
    applies: "the periodicity of health supervision, the content of the well-child visit, developmental surveillance and anticipatory guidance",
    type: "AAP health-supervision guidelines",
    url: "https://www.aap.org/en/practice-management/bright-futures/",
  },
  aap_hyperbilirubinemia: {
    organization: "AAP",
    title: "Clinical Practice Guideline Revision: Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation",
    edition: "Pediatrics, 2022",
    revision_verified: false,
    population: "Newborn infants born at 35 weeks' gestation or later",
    applies: "the jaundice record: risk factors, bilirubin measurement, the chart applied, the treatment threshold decision and the follow-up interval",
    type: "AAP clinical practice guideline",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_febrile_infant: {
    organization: "AAP",
    title: "Evaluation and Management of Well-Appearing Febrile Infants 8 to 60 Days Old",
    edition: "Pediatrics, 2021",
    revision_verified: false,
    population: "Well-appearing term infants aged 8 to 60 days with fever",
    applies: "the febrile-infant record: age band, inflammatory markers, urinalysis, the lumbar puncture decision and the treatment decision",
    type: "AAP clinical practice guideline",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_bronchiolitis: {
    organization: "AAP",
    title: "Clinical Practice Guideline: The Diagnosis, Management, and Prevention of Bronchiolitis",
    edition: "Pediatrics, 2014",
    revision_verified: false,
    population: "Infants and children aged 1 to 23 months with bronchiolitis",
    applies: "the bronchiolitis record: supportive care, hydration and oxygenation, and the treatments that are not routinely indicated",
    type: "AAP clinical practice guideline",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_aom: {
    organization: "AAP",
    title: "The Diagnosis and Management of Acute Otitis Media",
    edition: "Pediatrics, 2013",
    revision_verified: false,
    population: "Children aged 6 months to 12 years with acute otitis media",
    applies: "the diagnostic certainty required before treatment and the observation option in selected children",
    type: "AAP clinical practice guideline",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_developmental_screening: {
    organization: "AAP",
    title: "Promoting Optimal Development: Identifying Infants and Young Children With Developmental Disorders Through Developmental Surveillance and Screening",
    edition: "Pediatrics, 2020",
    revision_verified: false,
    population: "Infants and young children from birth to 5 years",
    applies: "developmental surveillance at every visit, the screening intervals, the red flags and the referral pathway",
    type: "AAP clinical report",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_autism: {
    organization: "AAP",
    title: "Identification, Evaluation, and Management of Children With Autism Spectrum Disorder",
    edition: "Pediatrics, 2020",
    revision_verified: false,
    population: "Children with suspected or confirmed autism spectrum disorder",
    applies: "the autism screening result, the diagnostic assessment and the developmental and behavioural plan",
    type: "AAP clinical report",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_adolescent_confidentiality: {
    organization: "AAP",
    title: "Confidentiality Protections for Adolescents and Young Adults in the Health Care Billing and Insurance Claims Process",
    edition: "Pediatrics, 2019",
    revision_verified: false,
    population: "Adolescents and young adults",
    applies: "the record of confidential time alone with the adolescent, the explanation of confidentiality and its limits, and the consent basis",
    type: "AAP policy statement",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_glad_pc: {
    organization: "AAP (endorsed)",
    title: "Guidelines for Adolescent Depression in Primary Care (GLAD-PC)",
    edition: "2018 update, Pediatrics",
    revision_verified: false,
    population: "Adolescents with depressive symptoms in primary care",
    applies: "the mood screening result, the suicide-risk assessment and the safety plan recorded for an adolescent",
    type: "Clinical practice guideline endorsed by AAP",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_child_abuse: {
    organization: "AAP",
    title: "Evaluation of Suspected Child Physical Abuse",
    edition: "Pediatrics, 2015",
    revision_verified: false,
    population: "Children in whom physical abuse is suspected",
    applies: "the safeguarding record: the injury pattern against the history, the developmental stage, the examination and the referral made",
    type: "AAP clinical report",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_vitamin_k: {
    organization: "AAP",
    title: "Controversies Concerning Vitamin K and the Newborn",
    edition: "Pediatrics, reaffirmed statement",
    revision_verified: false,
    population: "All newborn infants",
    applies: "the record of vitamin K prophylaxis at birth, including a documented refusal",
    type: "AAP policy statement",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_sids: {
    organization: "AAP",
    title: "Sleep-Related Infant Deaths: Updated Recommendations for Reducing Infant Deaths in the Sleep Environment",
    edition: "Pediatrics, 2022",
    revision_verified: false,
    population: "Infants up to 12 months",
    applies: "the safe-sleep advice recorded at the newborn visit, the well-child visit and discharge",
    type: "AAP policy statement",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_obesity: {
    organization: "AAP",
    title: "Clinical Practice Guideline for the Evaluation and Treatment of Children and Adolescents With Obesity",
    edition: "Pediatrics, 2023",
    revision_verified: false,
    population: "Children and adolescents aged 2 to 18 years",
    applies: "the weight-for-length and BMI-for-age assessment and the treatment intensity recorded for a child above a healthy weight",
    type: "AAP clinical practice guideline",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_iron: {
    organization: "AAP",
    title: "Diagnosis and Prevention of Iron Deficiency and Iron-Deficiency Anemia in Infants and Young Children (0–3 Years of Age)",
    edition: "Pediatrics, 2010",
    revision_verified: false,
    population: "Infants and young children aged 0 to 3 years",
    applies: "the iron intake and screening record, and the iron-deficiency diagnosis with its haematological basis",
    type: "AAP clinical report",
    url: "https://publications.aap.org/pediatrics",
  },
  aap_uti: {
    organization: "AAP",
    title: "Urinary Tract Infection: Clinical Practice Guideline for the Diagnosis and Management of the Initial UTI in Febrile Infants and Children 2 to 24 Months",
    edition: "Pediatrics, 2011 (reaffirmed)",
    revision_verified: false,
    population: "Febrile infants and children aged 2 to 24 months",
    applies: "the urine specimen requirement before treatment, the culture result and the imaging decision",
    type: "AAP clinical practice guideline",
    url: "https://publications.aap.org/pediatrics",
  },

  // ---- World Health Organization --------------------------------------------
  who_imci: {
    organization: "WHO",
    title: "Integrated Management of Childhood Illness — chart booklet",
    edition: "IMCI chart booklet",
    revision_verified: false,
    population: "Children aged 2 months to 5 years, and young infants under 2 months",
    applies: "the general danger signs, the age-specific fast-breathing thresholds, the classification of pneumonia, diarrhoea and malnutrition, and the action each classification requires",
    type: "WHO clinical guidance",
    url: "https://www.who.int/teams/maternal-newborn-child-adolescent-health-and-ageing/child-health/integrated-management-of-childhood-illness",
  },
  who_growth_standards: {
    organization: "WHO",
    title: "WHO Child Growth Standards",
    edition: "Standards for children 0–5 years",
    revision_verified: false,
    population: "Children from birth to 5 years",
    applies: "the growth record: weight-for-age, length/height-for-age, weight-for-length/height and BMI-for-age, and the z-score definitions of stunting, wasting and overweight",
    type: "WHO growth standard",
    url: "https://www.who.int/tools/child-growth-standards",
  },
  who_growth_reference: {
    organization: "WHO",
    title: "WHO Growth Reference for school-aged children and adolescents",
    edition: "Reference for children 5–19 years",
    revision_verified: false,
    population: "Children and adolescents aged 5 to 19 years",
    applies: "the growth record above 5 years, where the 0–5 standards do not apply",
    type: "WHO growth reference",
    url: "https://www.who.int/tools/growth-reference-data-for-5to19-years",
  },
  who_malnutrition: {
    organization: "WHO",
    title: "Updates on the management of severe acute malnutrition in infants and children",
    edition: "WHO guideline",
    revision_verified: false,
    population: "Infants and children with severe acute malnutrition",
    applies: "the malnutrition record: MUAC and oedema criteria, the appetite test, hypoglycaemia and hypothermia checks, therapeutic feeding and the follow-up",
    type: "WHO guideline",
    url: "https://www.who.int/publications",
  },
  who_immunization: {
    organization: "WHO",
    title: "WHO recommendations for routine immunization — summary tables",
    edition: "Current summary tables",
    revision_verified: false,
    population: "Children by age according to the routine immunisation schedule",
    applies: "the immunisation record: antigens due, antigens given, overdue antigens and the catch-up plan",
    type: "WHO recommendation",
    url: "https://www.who.int/teams/immunization-vaccines-and-biologicals/policies/who-recommendations-for-routine-immunization",
  },
  who_newborn: {
    organization: "WHO",
    title: "WHO recommendations on newborn health",
    edition: "WHO guideline compilation",
    revision_verified: false,
    population: "Newborn infants",
    applies: "the newborn record: immediate drying and skin-to-skin contact, early initiation of breastfeeding, thermal care, cord care, vitamin K prophylaxis and the newborn examination",
    type: "WHO guideline",
    url: "https://www.who.int/publications",
  },
  who_preterm: {
    organization: "WHO",
    title: "WHO recommendations for care of the preterm or low-birth-weight infant",
    edition: "WHO guideline, 2022",
    revision_verified: false,
    population: "Preterm and low-birth-weight infants",
    applies: "the thermal care, feeding support and kangaroo mother care recorded for a preterm or low-birth-weight infant",
    type: "WHO guideline",
    url: "https://www.who.int/publications",
  },
  who_pneumonia: {
    organization: "WHO",
    title: "Revised WHO classification and treatment of childhood pneumonia at health facilities",
    edition: "WHO guidance",
    revision_verified: false,
    population: "Children aged 2 months to 5 years with cough or difficult breathing",
    applies: "the pneumonia classification by fast breathing, chest indrawing and general danger signs, and the treatment each classification requires",
    type: "WHO guidance",
    url: "https://www.who.int/publications",
  },
  who_diarrhoea: {
    organization: "WHO",
    title: "The treatment of diarrhoea — a manual for physicians and other senior health workers",
    edition: "WHO manual",
    revision_verified: false,
    population: "Children with acute diarrhoea",
    applies: "the dehydration classification, the three treatment plans, oral rehydration and zinc supplementation",
    type: "WHO manual",
    url: "https://www.who.int/publications",
  },
  who_breastfeeding: {
    organization: "WHO",
    title: "Guideline: protecting, promoting and supporting breastfeeding in facilities providing maternity and newborn services",
    edition: "WHO guideline",
    revision_verified: false,
    population: "Mothers and infants in maternity and newborn services",
    applies: "the early initiation of breastfeeding, exclusive breastfeeding to 6 months and continued breastfeeding with complementary feeding",
    type: "WHO guideline",
    url: "https://www.who.int/publications",
  },
  who_oxygen: {
    organization: "WHO",
    title: "Oxygen therapy for children — a manual for health workers",
    edition: "WHO manual",
    revision_verified: false,
    population: "Children requiring oxygen therapy",
    applies: "the oxygen saturation threshold that defines hypoxaemia, the oxygen delivery recorded and the monitoring of a child on oxygen",
    type: "WHO manual",
    url: "https://www.who.int/publications",
  },
  who_nurturing_care: {
    organization: "WHO (with UNICEF and partners)",
    title: "Nurturing Care Framework for Early Childhood Development",
    edition: "Framework",
    revision_verified: false,
    population: "Children in the early years",
    applies: "the developmental and caregiver-support content recorded at a developmental or anticipatory-guidance visit",
    type: "WHO framework",
    url: "https://nurturing-care.org/",
  },
  who_adolescent: {
    organization: "WHO",
    title: "Global Accelerated Action for the Health of Adolescents (AA-HA!)",
    edition: "Guidance",
    revision_verified: false,
    population: "Adolescents aged 10 to 19 years",
    applies: "the adolescent visit: the holistic psychosocial assessment, confidentiality and the health-risk areas reviewed",
    type: "WHO guidance",
    url: "https://www.who.int/publications",
  },
  who_inspire: {
    organization: "WHO",
    title: "INSPIRE — seven strategies for ending violence against children",
    edition: "Technical package",
    revision_verified: false,
    population: "Children and adolescents",
    applies: "the safeguarding record and the referral route a documented concern requires",
    type: "WHO technical package",
    url: "https://www.who.int/publications",
  },

  // ---- Paediatric specialty societies ---------------------------------------
  gina_asthma: {
    organization: "GINA",
    title: "Global Strategy for Asthma Management and Prevention",
    edition: "Annual report, paediatric sections",
    revision_verified: false,
    population: "Children with asthma, including children 5 years and younger",
    applies: "the asthma severity assessment, the reliever and controller treatment recorded, the response and the written action plan",
    type: "International society strategy",
    url: "https://ginasthma.org/",
  },
  ilae_seizure_classification: {
    organization: "ILAE",
    title: "ILAE classification of the epilepsies and operational classification of seizure types",
    edition: "2017 classifications",
    revision_verified: false,
    population: "Children and adults with seizures",
    applies: "the seizure-type and epilepsy-type documentation, including the age-dependent syndromes of infancy and childhood",
    type: "International league classification",
    url: "https://www.ilae.org/guidelines/definition-and-classification",
  },
  aha_kawasaki: {
    organization: "AHA",
    title: "Diagnosis, Treatment, and Long-Term Management of Kawasaki Disease",
    edition: "AHA scientific statement",
    revision_verified: false,
    population: "Children with suspected or confirmed Kawasaki disease",
    applies: "the diagnostic criteria recorded, the echocardiography and the treatment and follow-up",
    type: "AHA scientific statement",
    url: "https://www.ahajournals.org/",
  },
  palsi_sepsis: {
    organization: "SCCM / PALISI",
    title: "Surviving Sepsis Campaign — international guidelines for the management of septic shock and sepsis-associated organ dysfunction in children",
    edition: "Paediatric guideline",
    revision_verified: false,
    population: "Children with suspected or confirmed sepsis",
    applies: "the recognition of septic shock, the time-critical treatment recorded and the reassessment after resuscitation",
    type: "International society guideline",
    url: "https://www.sccm.org/",
  },
  // AMedix / institution decisions, labelled as such and never presented as guideline.
  local: {
    organization: "AMedix / institution",
    title: "Local paediatric decision — institutional policy",
    edition: "Local",
    revision_verified: true,
    population: "The institution's paediatric patients",
    applies: "routes, time frames and monitoring intervals the institution sets: the referral destination, the return-to-hospital criteria and the review interval",
    type: "Local decision — not a guideline claim",
    url: "",
  },
};

export const PEDS_REFERENCE_LIST = Object.entries(PEDS_REFERENCES).map(([key, value]) => ({ key, ...value }));

// ---- Documented conflicts between bodies -----------------------------------
// Two documents can be right and still cannot both be applied to the same child.
// The register records the difference and the note records which one the department
// decided to follow — it never blends them into one instruction.
export const PEDS_GUIDELINE_CONFLICTS = [
  {
    key: "jaundice_thresholds",
    topic: "Which bilirubin chart decides treatment",
    positions: [
      { organization: "AAP", position: "Hour-specific phototherapy and exchange thresholds for infants born at 35 weeks or later, with risk factors adjusting the threshold.", source: "aap_hyperbilirubinemia" },
      { organization: "WHO", position: "Newborn care guidance aimed at all settings, without the same hour-specific threshold curves.", source: "who_newborn" },
    ],
    resolution:
      "A chart from one body is never substituted for the other. The note records which chart the institution uses, the value plotted against it and the threshold read from it.",
  },
  {
    key: "young_infant_fever",
    topic: "How a febrile young infant is evaluated",
    positions: [
      { organization: "AAP", position: "A risk-stratified pathway for well-appearing term infants aged 8 to 60 days, with inflammatory markers and a lumbar-puncture decision.", source: "aap_febrile_infant" },
      { organization: "WHO", position: "Any fever in an infant under 2 months is classified as severe disease requiring urgent referral and treatment, without a stratification step.", source: "who_imci" },
    ],
    resolution:
      "The pathway applied is recorded on the note. A child managed under the WHO classification is not described as having been stratified, and an infant of 28 days or less is never managed as low risk.",
  },
  {
    key: "aom_antibiotics",
    topic: "Whether every acute otitis media is treated with an antibiotic",
    positions: [
      { organization: "AAP", position: "Observation without an antibiotic is an option in selected children by age and severity, with reliable follow-up.", source: "aap_aom" },
      { organization: "WHO", position: "Ear infection and ear discharge are treated with an antibiotic at first contact in settings where follow-up cannot be assured.", source: "who_imci" },
    ],
    resolution:
      "The note records the strategy used and the follow-up that makes it safe. Observation is never recorded for a child who cannot be reviewed.",
  },
  {
    key: "growth_reference",
    topic: "Which growth reference the plotted value is read against",
    positions: [
      { organization: "WHO", position: "The 0–5 year standards and the 5–19 year reference are different references and are not interchangeable.", source: "who_growth_standards" },
      { organization: "National / institutional practice", position: "Many services plot on a national chart, which can place the same child on a different centile.", source: "local" },
    ],
    resolution:
      "The reference used is recorded with the plotted value, so a centile is never read against an unstated chart.",
  },
  {
    key: "allergen_introduction",
    topic: "When allergenic foods are introduced",
    positions: [
      { organization: "AAP", position: "Early introduction of peanut-containing foods in infants at high risk, after appropriate assessment.", source: "aap_bright_futures" },
      { organization: "WHO", position: "Complementary feeding guidance from 6 months emphasises continued breastfeeding and adequate, safe, responsive feeding, without a specific early-allergen schedule.", source: "who_breastfeeding" },
    ],
    resolution:
      "The advice given is recorded, with the infant's risk category. Guidance from one body is not presented as the other's recommendation.",
  },
  {
    key: "bcg_policy",
    topic: "Whether BCG is given at birth",
    positions: [
      { organization: "WHO", position: "BCG at birth in countries with high tuberculosis burden.", source: "who_immunization" },
      { organization: "National policy elsewhere", position: "Selective or no routine BCG where the burden is low.", source: "local" },
    ],
    resolution:
      "The schedule recorded on the note is the one the child's own national programme uses; a missing BCG is not read as an omission without checking that policy.",
  },
];

// ---- The evidence basis recorded with each note ----------------------------
export const PEDS_NOTE_BASIS = {
  peds_consultation: {
    note: "Pediatric Consultation",
    states:
      "The note records the presenting problem and its course, the feeding and growth history, the immunisation status, the developmental state, the age-appropriate assessment of the acutely unwell child against the IMCI danger signs, and the diagnoses with their WHO ICD-11 MMS coding and diagnostic status.",
    basis: ["who_imci", "aap_bright_futures", "who_growth_standards", "who_pneumonia", "who_diarrhoea"],
  },
  peds_followup: {
    note: "Pediatric Follow-Up",
    states:
      "The note records what changed since the last review, growth plotted against the stated reference, the developmental trajectory, the treatment response and the reason for any change, with the diagnoses carried forward or revised.",
    basis: ["aap_bright_futures", "who_growth_standards", "local"],
  },
  peds_well_child: {
    note: "Well-Child Visit",
    states:
      "The note records growth plotted on a named reference, developmental surveillance and any screening performed, the immunisation review, the age-appropriate anticipatory guidance given — including safe sleep and injury prevention — and the caregiver's understanding of it.",
    basis: ["aap_bright_futures", "who_growth_standards", "aap_developmental_screening", "aap_sids", "who_immunization"],
  },
  peds_admission_note: {
    note: "Pediatric Admission Note",
    states:
      "The note records why the child was admitted, the triage classification and danger signs, the severity assessment of the presenting problem, the nutritional and immunisation state, and the admission diagnoses coded in WHO ICD-11 MMS with their status.",
    basis: ["who_imci", "who_pneumonia", "who_diarrhoea", "who_malnutrition", "palsi_sepsis"],
  },
  peds_daily_progress: {
    note: "Pediatric Daily Progress Note",
    states:
      "The note records the overnight events, the current observations against the age-specific thresholds, feeding and output, the response to treatment and the trend rather than a repeated summary. Review intervals are recorded as the institution's local decision.",
    basis: ["who_imci", "who_oxygen", "local"],
  },
  peds_discharge_summary: {
    note: "Pediatric Discharge Summary",
    states:
      "The note records the admission and discharge diagnoses in WHO ICD-11 MMS, the course and the treatment changed, the feeding plan, the immunisation catch-up owed, the caregiver education given with the return criteria, and the follow-up arranged.",
    basis: ["aap_bright_futures", "aap_sids", "who_imci", "local"],
  },
  peds_procedure_note: {
    note: "Pediatric Procedure Note",
    states:
      "The note records the indication, the consent and the child's assent where age allows, the weight the dosing was based on, the sedation and monitoring used, the findings, the specimens and the recovery.",
    basis: ["local"],
  },
  peds_chronic_followup: {
    note: "Chronic Disease Follow-Up (Pediatric)",
    states:
      "The note records control of the chronic condition, adherence and the barriers to it, growth and development against the reference, the monitoring due, the school impact, the written emergency plan and the transition discussion as the child grows.",
    basis: ["aap_bright_futures", "who_growth_standards", "local"],
  },
  peds_growth_development: {
    note: "Growth & Development Record",
    states:
      "The note records the measurements plotted on a named reference with the z-score or centile recorded, the trajectory across visits, the developmental domains assessed and any red flag, and the action each finding requires.",
    basis: ["who_growth_standards", "who_growth_reference", "aap_developmental_screening", "who_malnutrition"],
  },
  peds_immunization_record: {
    note: "Immunization Record",
    states:
      "The note records the schedule the child follows, each antigen given with its date and batch, the antigens overdue, the catch-up plan, the contraindications checked and any adverse event following immunisation.",
    basis: ["who_immunization", "aap_bright_futures", "local"],
  },
  peds_screening_record: {
    note: "Screening Record",
    states:
      "The note records which screening was performed and with which instrument, the result, the action taken and the referral made — a positive screen is recorded as a positive screen, not as a diagnosis.",
    basis: ["aap_developmental_screening", "aap_autism", "local"],
  },
  peds_anticipatory_guidance: {
    note: "Anticipatory Guidance",
    states:
      "The note records the topics discussed for this child's age, the caregiver's questions, the advice given — including safe sleep, feeding and injury prevention where age-appropriate — and how the caregiver's understanding was confirmed.",
    basis: ["aap_bright_futures", "who_nurturing_care", "aap_sids", "who_breastfeeding"],
  },
  peds_newborn_record: {
    note: "Newborn Record",
    states:
      "The note records the delivery context, gestational age and birth measurements with the birth-weight category, thermal care, the initiation of feeding, vitamin K prophylaxis, the newborn examination findings, the screening performed and any danger sign.",
    basis: ["who_newborn", "who_preterm", "aap_vitamin_k", "aap_hyperbilirubinemia"],
  },
  peds_birth_history: {
    note: "Birth History",
    states:
      "The note records the pregnancy and delivery course, the gestational age and birth weight, the resuscitation and early course, and the complications that bear on the child's later growth, development and infection risk.",
    basis: ["who_newborn", "who_preterm", "local"],
  },
  peds_neonatal_progress: {
    note: "Neonatal Progress Note",
    states:
      "The note records the day's course, temperature, feeding and weight trend against birth weight, the bilirubin state where relevant, the danger signs screened for and the current treatment, with the review interval stated.",
    basis: ["who_newborn", "who_preterm", "aap_hyperbilirubinemia", "local"],
  },
  peds_newborn_discharge_summary: {
    note: "Newborn Discharge Summary",
    states:
      "The note records the birth and neonatal course, the feeding established, the vitamin K and screening status, the jaundice follow-up arranged, the safe-sleep and feeding advice given, and the review appointed.",
    basis: ["who_newborn", "aap_hyperbilirubinemia", "aap_sids", "aap_vitamin_k"],
  },
  peds_adolescent_health: {
    note: "Adolescent Health Assessment",
    states:
      "The note records the confidential interview and the limits of confidentiality explained, the HEEADSSS areas reviewed, the mood and risk assessment with the action each result requires, and the immunisation and growth review.",
    basis: ["aap_adolescent_confidentiality", "aap_glad_pc", "who_adolescent"],
  },
  peds_confidential_adolescent_note: {
    note: "Confidential Adolescent Note",
    states:
      "The note records the reason for the consultation, the confidentiality basis and the consent that applies, the assessment and the safety plan where a risk was identified, and what is and is not shared with the caregiver.",
    basis: ["aap_adolescent_confidentiality", "aap_glad_pc", "who_adolescent"],
  },
};

const ref = (key) => ({ key, ...(PEDS_REFERENCES[key] || PEDS_REFERENCES.local) });

export const pedsNoteBasis = (noteKey) => {
  const entry = PEDS_NOTE_BASIS[noteKey];
  if (!entry) return null;
  return { ...entry, basis: entry.basis.map(ref) };
};

// The attribution text that travels with the note, so an exported record keeps the
// evidence base it was written from.
export const pedsAttributionText = (noteKey) => {
  const entry = pedsNoteBasis(noteKey);
  if (!entry) return "";
  const refs = entry.basis.map(
    (b) =>
      `${b.organization} — ${b.title} (${b.edition}; ${pedsPublicationLabel(b.key)}); population: ${
        b.population
      }; applied to: ${b.applies}${
        b.revision_verified ? "" : "; current revision to be confirmed on the publisher's page"
      }${b.url ? `; ${b.url}` : ""}`,
  );
  return [
    `${entry.note} — guideline basis (AMedix own wording; publisher text is not reproduced)`,
    entry.states,
    ...refs,
    `Reference register last reviewed: ${PEDS_LAST_REVIEWED}`,
  ].join("\n");
};