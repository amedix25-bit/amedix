// American Society of Hematology — clinical practice guideline register.
//
// WHAT THIS IS
// A transcription of the guidelines ASH currently publishes on its own
// guidelines page (https://www.hematology.org/resources/clinical-practice-guidelines),
// each with the edition, the population it was written for, what its panel
// actually covers and — just as important — what it does NOT cover. The note
// records which guideline a documented decision rests on, so a reader can check
// the claim against the source instead of trusting a label.
//
// THREE RULES ENFORCED HERE
//  1. Scope is never widened. An AML guideline written for OLDER ADULTS is never
//     presented as covering a fit 35-year-old, and an AYA ALL guideline is not
//     presented as covering an older adult.
//  2. Nothing is attributed to ASH that ASH has not published. Where ASH has no
//     guideline for the question — iron-deficiency TREATMENT is still in
//     development, febrile neutropenia has none, and no ASH guideline sets a
//     red-cell transfusion threshold outside sickle cell disease — the gap is
//     named and a complementary evidence-based reference is identified in its
//     own right (see HEMA_ASH_GAPS).
//  3. Evidence certainty is not invented. ASH grades with GRADE and each
//     recommendation carries its own certainty and strength; the app therefore
//     refuses to summarise a guideline as "strong" or "high certainty" and asks
//     the clinician to record the certainty the source published.
//
// This register is a technical implementation of published titles and scopes.
// It is NOT a clinical validation of any recommendation, and the safety prompts
// built on it require departmental sign-off before they are relied on.

export const HEMA_ASH_PROVENANCE = {
  ash_guideline: "ASH clinical practice guideline",
  complementary: "Complementary evidence-based reference — ASH publishes no guideline for this question",
  local: "AMedix local decision — requires Haematology department approval",
};

const CERTAINTY_NOTE =
  "ASH develops its guidelines with GRADE, and every recommendation carries its own strength and certainty rating in the published document. This app does not summarise, upgrade or infer that rating — record the certainty the source published.";

// ---------------------------------------------------------------------------
// Published ASH guidelines
// ---------------------------------------------------------------------------
export const HEMA_ASH_GUIDELINES = [
  {
    key: "ash_aml_older",
    title: "ASH Clinical Practice Guidelines on Acute Myeloid Leukemia in Older Adults",
    edition: "2020, updated 2025",
    population: "Adults with newly diagnosed AML who are older adults — the guideline's scope, not all adults with AML",
    scope: [
      "Choice of intensive versus non-intensive induction in older adults",
      "Post-remission treatment planning, including the ASH shared decision-making aid",
      "Fitness, comorbidity and patient-preference considerations in selecting therapy",
    ],
    notCovered: [
      "AML in younger, intensively treated adults (use ELN/NCCN guidance and the local protocol)",
      "APL-specific management, which has its own protocol",
      "Paediatric AML",
    ],
    url: "https://www.hematology.org/Resources/Clinical-Practice-Guidelines/Acute-Myeloid-Leukemia-Guidelines",
    domains: ["myeloid_neoplasm"],
    certaintyNote: CERTAINTY_NOTE,
  },
  {
    key: "ash_all_aya",
    title: "ASH Clinical Practice Guidelines on Acute Lymphoblastic Leukemia in Adolescents and Young Adults",
    edition: "2026",
    population: "Adolescents and young adults (AYA) with ALL — paediatric-inspired and adult-inspired approaches",
    scope: [
      "Frontline management of ALL in AYA",
      "Management of relapsed or refractory ALL in AYA",
    ],
    notCovered: [
      "Children treated on paediatric protocols",
      "Adults outside the AYA age range",
      "Ph-negative/Ph-positive regimen selection outside the AYA setting",
    ],
    url: "https://www.hematology.org/Resources/Clinical-Practice-Guidelines/Acute-Lymphoblastic-Leukemia-Guidelines",
    domains: ["lymphoid_neoplasm"],
    certaintyNote: CERTAINTY_NOTE,
  },
  {
    key: "ash_aplastic_anaemia",
    title: "ASH Clinical Practice Guidelines on Aplastic Anemia",
    edition: "2026",
    population: "Patients with severe and very severe acquired aplastic anaemia",
    scope: [
      "Diagnostic work-up of suspected acquired aplastic anaemia",
      "First-line immunosuppressive therapy versus transplantation",
      "Supportive care within the diagnosis and management pathway",
    ],
    notCovered: [
      "Non-severe aplastic anaemia",
      "Inherited marrow failure syndromes (use the inherited marrow failure pathway)",
      "Paediatric-specific protocols",
    ],
    url: "https://www.hematology.org/Resources/Clinical-Practice-Guidelines/Aplastic-Anemia-Guidelines",
    domains: ["marrow_failure", "erythroid"],
    certaintyNote: CERTAINTY_NOTE,
  },
  {
    key: "ash_itp_2019",
    title: "ASH Clinical Practice Guidelines on Immune Thrombocytopenia (2019)",
    edition: "2019",
    population: "Adults and children with primary ITP, including ITP in pregnancy",
    scope: [
      "Diagnosis and the work-up needed before primary ITP is accepted",
      "Observation versus treatment, and treatment thresholds as published",
      "Management of ITP in pregnancy and of the neonate",
    ],
    notCovered: [
      "Secondary thrombocytopenia (drug-induced, marrow disease, TMA, DIC)",
      "Initial and second-line drug choice in adults, which the 2026 update addresses",
    ],
    url: "https://doi.org/10.1182/bloodadvances.2019000966",
    domains: ["platelet"],
    certaintyNote: CERTAINTY_NOTE,
  },
  {
    key: "ash_itp_2026",
    title: "ASH Clinical Practice Guidelines on Immune Thrombocytopenia — 2026 update",
    edition: "2026",
    population: "Adults with primary ITP, initial and second-line therapy",
    scope: [
      "Choice of initial therapy in adults with primary ITP",
      "Choice of second-line therapy, including the place of splenectomy and thrombopoietin receptor agonists",
      "Shared decision-making using the ASH ITP decision aid",
    ],
    notCovered: ["Paediatric treatment selection", "ITP in pregnancy, covered by the 2019 guideline"],
    url: "https://doi.org/10.1182/bloodadvances.2026021269",
    domains: ["platelet"],
    certaintyNote: CERTAINTY_NOTE,
  },
  {
    key: "ash_iron_deficiency_diagnosis",
    title: "ASH Clinical Practice Guidelines on the Diagnosis of Iron Deficiency",
    edition: "Current ASH edition — the edition and publication date are printed on the linked ASH page",
    population: "Individuals with suspected iron deficiency, with or without anaemia",
    scope: [
      "Diagnostic thresholds for iron deficiency, including population-specific thresholds",
      "Which tests establish iron deficiency, and how to interpret ferritin in inflammation",
    ],
    notCovered: [
      "TREATMENT of iron deficiency — this guideline is still in development at ASH and is open for public comment",
      "Iron deficiency of pregnancy and childhood, which have their own local pathways",
    ],
    url: "https://www.hematology.org/Resources/Clinical-Practice-Guidelines/Iron-Deficiency-Anemia-Guidelines",
    domains: ["erythroid"],
    certaintyNote: CERTAINTY_NOTE,
  },
  {
    key: "ash_cancer_associated_anaemia",
    title: "Management of Cancer-Associated Anemia — ASH and ASCO guideline",
    edition: "2019 (ASH/ASCO)",
    population: "Adults with anaemia in the setting of active malignancy",
    scope: [
      "When erythropoiesis-stimulating agents may be used in cancer-associated anaemia",
      "Iron supplementation alongside erythropoiesis-stimulating agents",
      "Red-cell transfusion in cancer-associated anaemia",
    ],
    notCovered: ["Anaemia outside malignancy", "Paediatric oncology"],
    url: "https://ashpublications.org/bloodadvances/article/3/8/1197/260121/Management-of-cancer-associated-anemia-with",
    domains: ["erythroid"],
    certaintyNote: CERTAINTY_NOTE,
  },
  {
    key: "ash_myelofibrosis",
    title: "ASH Clinical Practice Guidelines on Management of Myelofibrosis in Adults",
    edition: "2026",
    population: "Adults with myelofibrosis",
    scope: [
      "Risk-stratified treatment selection in myelofibrosis",
      "Cytoreductive and JAK-inhibitor therapy decisions across key clinical scenarios",
      "Supportive management addressed by the panel",
    ],
    notCovered: [
      "Diagnostic criteria for MPN, which come from WHO classification",
      "Allogeneic transplant conditioning protocols",
    ],
    url: "https://ashpublications.org/bloodadvances/article/doi/10.1182/bloodadvances.2026021650/571415/American-Society-of-Hematology-2026-Guidelines-for",
    domains: ["myeloid_neoplasm"],
    certaintyNote: CERTAINTY_NOTE,
  },
  {
    key: "ash_scd_series",
    title: "ASH Clinical Practice Guidelines on Sickle Cell Disease",
    edition: "Topic series published separately (2019–2021 as published by ASH; check each linked topic for its current edition)",
    population: "People with sickle cell disease, including children and adults",
    scope: [
      "Cerebrovascular disease, including stroke prevention and transfusion for primary and secondary prevention",
      "Cardiopulmonary and kidney disease, including acute chest syndrome and pulmonary hypertension",
      "Dosing and monitoring of hydroxyurea",
      "Management of acute and chronic pain",
      "Transfusion support, including the choice of exchange versus simple transfusion and red-cell antigen matching",
      "Stem cell transplantation, and pregnancy in sickle cell disease",
    ],
    notCovered: [
      "Acute pain crisis analgesia dosing, which is a local protocol decision",
      "Iron chelation protocols",
      "Haemoglobinopathy genotypes other than sickle cell disease",
    ],
    url: "https://www.hematology.org/Resources/Clinical-Practice-Guidelines/Sickle-Cell-Disease-Guidelines",
    domains: ["haemoglobinopathy", "haemolytic"],
    certaintyNote: CERTAINTY_NOTE,
  },
  {
    key: "ash_vwd_2021",
    title: "ASH ISTH NHF WFH Guidelines on the Diagnosis and Management of von Willebrand Disease",
    edition: "2021",
    population: "People with von Willebrand disease — ASH, ISTH, NHF and WFH collaboration",
    scope: [
      "Laboratory diagnosis and classification of VWD",
      "Haemostatic treatment, including desmopressin and von Willebrand factor concentrates",
      "Management of bleeding and of procedures in VWD",
    ],
    notCovered: [
      "Haemophilia A and B (use WFH guidance)",
      "Acquired von Willebrand syndrome",
      "Platelet function disorders other than VWD",
    ],
    url: "https://www.hematology.org/Resources/Clinical-Practice-Guidelines/Von-Willebrand-Disease-Guidelines",
    domains: ["coagulation"],
    certaintyNote: CERTAINTY_NOTE,
  },
  {
    key: "ash_vte_series",
    title: "ASH Clinical Practice Guidelines on Venous Thromboembolism",
    edition: "Topic series — ASH VTE guideline snapshot set, 2023",
    population: "Adults and children with, or at risk of, venous thromboembolism, across the topics published",
    scope: [
      "Diagnosis of DVT and pulmonary embolism, including the diagnostic pathway after a positive D-dimer",
      "Anticoagulation therapy, including agent choice and duration",
      "Treatment, and cancer-associated thrombosis",
      "Prophylaxis in medical patients and prevention in surgical patients",
      "Heparin-induced thrombocytopenia",
      "Thrombophilia testing",
      "VTE in pregnancy and in paediatric patients",
    ],
    notCovered: [
      "Arterial thrombosis and antiphospholipid syndrome, which follow ISTH guidance",
      "Thrombolysis dosing and interventional procedures, which are protocol decisions",
      "Mechanical heart valve anticoagulation",
    ],
    url: "https://www.hematology.org/Resources/Clinical-Practice-Guidelines/Venous-Thromboembolism-Guidelines",
    domains: ["thrombotic", "coagulation"],
    certaintyNote: CERTAINTY_NOTE,
  },
  {
    key: "ash_amyloidosis",
    title: "ASH Clinical Practice Guidelines on the Diagnosis of Light Chain (AL) Amyloidosis",
    edition: "2026",
    population: "Patients with suspected light chain (AL) amyloidosis",
    scope: [
      "Recognition and tissue confirmation of AL amyloidosis",
      "Typing of the amyloid deposit before treatment is planned",
      "The diagnostic pathway required before a plasma-cell-directed plan",
    ],
    notCovered: [
      "TREATMENT of AL amyloidosis — the ASH treatment panel is still to be published",
      "AA and hereditary amyloidosis",
    ],
    url: "https://www.hematology.org/Resources/Clinical-Practice-Guidelines/Amyloidosis-Guidelines",
    domains: ["plasma_cell"],
    certaintyNote: CERTAINTY_NOTE,
  },
];

// ---------------------------------------------------------------------------
// Where ASH has no guidance — the gap is named, and the reference used instead
// is identified on its own terms. Nothing here is presented as an ASH statement.
// ---------------------------------------------------------------------------
export const HEMA_ASH_GAPS = [
  {
    key: "gap_iron_treatment",
    question: "How iron deficiency is treated (oral versus intravenous iron, dose, schedule, response)",
    ashStatus: "ASH treatment-of-iron-deficiency guideline is in development and open for public comment — not yet published",
    complementary: {
      organization: "British Society for Haematology",
      title: "UK guidelines on the management of iron deficiency anaemia in adults",
      edition: "2021",
      url: "https://b-s-h.org.uk/guidelines",
    },
  },
  {
    key: "gap_rbc_threshold",
    question: "The haemoglobin threshold for red-cell transfusion outside sickle cell disease",
    ashStatus: "ASH publishes no red-cell transfusion threshold guideline outside its sickle cell disease transfusion topic",
    complementary: {
      organization: "AABB (international consensus conference)",
      title: "Red Blood Cell Transfusion: 2023 AABB International Guidelines",
      edition: "2023",
      url: "https://doi.org/10.1001/jama.2023.12914",
    },
  },
  {
    key: "gap_platelet_transfusion",
    question: "Platelet transfusion thresholds and prophylactic platelet support",
    ashStatus: "No ASH platelet transfusion threshold guideline is published",
    complementary: {
      organization: "AABB",
      title: "Platelet Transfusion: A Clinical Practice Guideline From the AABB",
      edition: "2015",
      url: "https://doi.org/10.7326/M14-1589",
    },
  },
  {
    key: "gap_febrile_neutropenia",
    question: "Febrile neutropenia: risk stratification and empirical antimicrobial therapy",
    ashStatus: "ASH publishes no febrile neutropenia guideline",
    complementary: {
      organization: "IDSA / ASCO-ESMO",
      title: "IDSA Guideline for the Use of Antimicrobial Agents in Neutropenic Patients with Cancer (2010); ASCO/ESMO outpatient management of febrile neutropenia (2018)",
      edition: "2010 / 2018",
      url: "https://www.idsociety.org/practice-guideline/fever-and-neutropenia/",
    },
  },
  {
    key: "gap_ttp",
    question: "Thrombotic thrombocytopenic purpura and immune-mediated thrombotic microangiopathy",
    ashStatus: "No ASH TTP guideline is published",
    complementary: {
      organization: "International Society on Thrombosis and Haemostasis (ISTH)",
      title: "ISTH guidelines for the treatment of thrombotic thrombocytopenic purpura",
      edition: "2020",
      url: "https://doi.org/10.1111/jth.15005",
    },
  },
  {
    key: "gap_dic",
    question: "Diagnosis and management of disseminated intravascular coagulation",
    ashStatus: "No ASH DIC guideline is published",
    complementary: {
      organization: "ISTH Scientific and Standardization Committee",
      title: "Guidance for the diagnosis and treatment of DIC, and the ISTH overt DIC score",
      edition: "2015 / 2001 (score)",
      url: "https://doi.org/10.1111/jth.12968",
    },
  },
  {
    key: "gap_haemophilia",
    question: "Haemophilia A and B, including inhibitor management",
    ashStatus: "ASH publishes VWD guidance only — no haemophilia A/B guideline",
    complementary: {
      organization: "World Federation of Hemophilia",
      title: "WFH Guidelines for the Management of Hemophilia",
      edition: "3rd edition, 2020 (with later updates)",
      url: "https://elearning.wfh.org/resource/treatment-guidelines/",
    },
  },
  {
    key: "gap_myeloma",
    question: "Diagnosis, risk stratification and treatment of multiple myeloma",
    ashStatus: "No ASH myeloma treatment guideline is published",
    complementary: {
      organization: "International Myeloma Working Group (IMWG)",
      title: "IMWG consensus recommendations on diagnosis, risk stratification and response criteria",
      edition: "current IMWG consensus",
      url: "https://www.myeloma.org/international-myeloma-working-group",
    },
  },
  {
    key: "gap_cml",
    question: "Chronic myeloid leukaemia milestones and tyrosine kinase inhibitor selection",
    ashStatus: "No ASH CML guideline is published",
    complementary: {
      organization: "European LeukemiaNet",
      title: "ELN recommendations for treating CML",
      edition: "2020",
      url: "https://doi.org/10.1182/blood.2020009678",
    },
  },
  {
    key: "gap_mds",
    question: "Myelodysplastic neoplasm classification and prognosis",
    ashStatus: "No ASH MDS treatment guideline is published",
    complementary: {
      organization: "WHO / International Working Group",
      title: "WHO classification of haematolymphoid tumours (MDS) and IPSS-M",
      edition: "WHO 5th edition, 2022 — as published",
      url: "https://www.who.int/publications/i/item/9789241544323",
    },
  },
  {
    key: "gap_antiemesis",
    question: "Chemotherapy-induced nausea and vomiting prophylaxis",
    ashStatus: "No ASH antiemesis guideline is published",
    complementary: {
      organization: "MASCC / ESMO",
      title: "Antiemetic guideline for chemotherapy-induced nausea and vomiting",
      edition: "2023",
      url: "https://mascc.org/guidelines/",
    },
  },
  {
    key: "gap_transfusion_reaction",
    question: "Recognition and investigation of an acute transfusion reaction",
    ashStatus: "No ASH acute transfusion reaction guideline is published",
    complementary: {
      organization: "British Society for Haematology / SHOT",
      title: "BSH guideline on the investigation and management of acute transfusion reactions, with SHOT reporting",
      edition: "current BSH edition",
      url: "https://b-s-h.org.uk/guidelines",
    },
  },
];

export const ashGuideline = (key) => HEMA_ASH_GUIDELINES.find((g) => g.key === key) || null;
export const ashGap = (key) => HEMA_ASH_GAPS.find((g) => g.key === key) || null;

// Which guidelines and which gaps belong to a working diagnostic group. Used by
// the note form so a clinician sees only the guidance that applies to the group
// recorded in this note.
export const ASH_BY_GROUP = {
  Anaemia: {
    guidelines: ["ash_iron_deficiency_diagnosis", "ash_cancer_associated_anaemia"],
    gaps: ["gap_iron_treatment", "gap_rbc_threshold"],
  },
  Haemoglobinopathy: { guidelines: ["ash_scd_series"], gaps: ["gap_rbc_threshold"] },
  "Platelet disorder": {
    guidelines: ["ash_itp_2019", "ash_itp_2026"],
    gaps: ["gap_platelet_transfusion", "gap_ttp"],
  },
  "Cytopenia or marrow failure": {
    guidelines: ["ash_aplastic_anaemia"],
    gaps: ["gap_febrile_neutropenia", "gap_mds"],
  },
  "Bleeding disorder": {
    guidelines: ["ash_vwd_2021"],
    gaps: ["gap_haemophilia", "gap_platelet_transfusion", "gap_transfusion_reaction"],
  },
  "Thrombosis or anticoagulation": {
    guidelines: ["ash_vte_series"],
    gaps: ["gap_dic"],
  },
  "Myeloid neoplasm": {
    guidelines: ["ash_aml_older", "ash_myelofibrosis"],
    gaps: ["gap_cml", "gap_mds", "gap_febrile_neutropenia", "gap_antiemesis"],
  },
  "Lymphoid neoplasm": {
    guidelines: ["ash_all_aya"],
    gaps: ["gap_febrile_neutropenia", "gap_antiemesis", "gap_rbc_threshold"],
  },
  "Plasma cell disorder": {
    guidelines: ["ash_amyloidosis"],
    gaps: ["gap_myeloma", "gap_febrile_neutropenia", "gap_antiemesis"],
  },
  "Haematological emergency": {
    guidelines: ["ash_vte_series", "ash_itp_2019", "ash_scd_series"],
    gaps: ["gap_febrile_neutropenia", "gap_dic", "gap_ttp", "gap_transfusion_reaction"],
  },
};

export const ashGuidanceForGroup = (group) => {
  const entry = ASH_BY_GROUP[group] || { guidelines: [], gaps: [] };
  return {
    guidelines: entry.guidelines.map(ashGuideline).filter(Boolean),
    gaps: entry.gaps.map(ashGap).filter(Boolean),
  };
};

// The line stored with the note so the attribution travels with the record.
export const HEMA_ASH_ATTRIBUTION =
  "Guideline statements in this note cite the American Society of Hematology where an ASH guideline covers the question, and name the complementary source — never ASH — where it does not. Guidance supports, and never replaces, the treating clinician's judgement.";

export const HEMA_ASH_COUNT = HEMA_ASH_GUIDELINES.length;
export const HEMA_ASH_GAP_COUNT = HEMA_ASH_GAPS.length;
export const HEMA_ASH_SOURCE_URL = "https://www.hematology.org/resources/clinical-practice-guidelines";