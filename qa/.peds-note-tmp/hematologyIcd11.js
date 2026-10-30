// Hematology ICD-11 MMS reference catalogue.
//
// WHERE THESE CODES COME FROM — AND WHAT IS STATED RATHER THAN GUESSED
// Every code and display term below was copied from a published ICD-11 for
// Mortality and Morbidity Statistics (MMS) code listing, not generated:
//   · the ICD-11 MMS code system published with the Kenya ePrescription FHIR
//     implementation guide (WHO MMS codes and display terms), and
//   · the ICD-11 classification mapping published as KEGG BRITE br08403
//     ("Human Diseases in ICD-11 Classification").
// Where those two listings differ on the wording or on what a code covers, the
// entry is NOT presented as verified: it is stored as REVIEW REQUIRED with the
// conflict written into its coding note, so a clinician checks it in the WHO
// browser before it is used. Nothing in this file is invented, and no ICD-10
// code or ICD-10 crosswalk appears anywhere.
//
// WHAT IS DELIBERATELY LEFT OUT, AND SAID SO
// A large part of haematology practice sits in categories whose exact code could
// not be confirmed here — ITP subtypes, TTP/HUS, the transfusion reactions,
// neutropenia and febrile neutropenia, HLH, GVHD, iron overload, the leukaemia,
// lymphoma and myeloma subcategories, and sickle cell genotypes. Those are NOT
// guessed. HEMA_NOT_IN_CATALOGUE lists them, the field tells the clinician to
// take the code from the WHO browser, and the note stores it as review required
// until it is checked. A wrong code is worse than no code: a note that says
// "no code — coding review required" is honest, a note with an invented code is
// dangerous.
//
// A code is never a diagnosis. Selecting a category records a SUSPECTED
// diagnosis carrying its release and source; only the clinician documents
// confirmation, the clinical basis and the detail the code cannot carry.

export const HEMA_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2026-01",
  label: "ICD-11 MMS",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  source_url: "https://icd.who.int/",
  retrieved: "2026-10-30",
  chapters:
    "Chapter 03 — Diseases of the blood or blood-forming organs; Chapter 02 — Neoplasms of haematopoietic or lymphoid tissues (2A20–2B3Z); Chapter 04 — selected immune and eosinophil categories",
  sources: [
    "ICD-11 MMS code system, Kenya ePrescription FHIR IG (WHO MMS codes and display terms)",
    "ICD-11 classification mapping, KEGG BRITE br08403 — Human Diseases in ICD-11 Classification",
    "WHO ICD-11 browser 2026-01 — for clinician verification and postcoordination",
  ],
};

export const HEMA_ICD11_DOMAINS = {
  erythroid: "Nutritional and metabolic anaemias",
  haemolytic: "Haemolytic anaemias",
  haemoglobinopathy: "Thalassaemias and haemoglobinopathies",
  marrow_failure: "Marrow failure, pure red cell aplasia and other anaemias",
  erythrocytosis: "Polycythaemia and methaemoglobinaemia",
  coagulation: "Coagulation defects and haemorrhagic disorders",
  platelet: "Platelet number and function",
  thrombotic: "Thrombophilia, thrombotic microangiopathy and antiphospholipid syndrome",
  eosinophil_mast: "Eosinophilic and mast cell disorders",
  spleen: "Disorders of the spleen",
  myeloid_neoplasm: "Myeloid, myelodysplastic and myeloproliferative neoplasms",
  lymphoid_neoplasm: "Lymphoid neoplasms",
  plasma_cell: "Plasma cell neoplasms",
};

// Statuses are documentation truths, not severities: a category the clinician is
// still working through is never stored as confirmed, and "in remission" and
// "relapsed or refractory" are separate states because they change management.
export const HEMA_ICD_STATUSES = [
  "Confirmed",
  "Suspected",
  "Provisional",
  "Differential diagnosis",
  "Historical — previous episode",
  "In remission",
  "Relapsed or refractory",
];

export const HEMA_ICD_ROLES = [
  "Primary",
  "Secondary",
  "Differential",
  "Complication of another diagnosis",
  "Comorbidity",
  "Associated condition",
];

// The haematology-specific detail a stem code cannot carry. Every one of these is
// recorded beside the code, never appended to it, and none is derived from the
// code itself.
export const HEMA_ICD_DETAIL_FIELDS = [
  {
    key: "disease_subtype",
    label: "Subtype or clinical variant",
    type: "input",
    placeholder: "e.g. warm autoimmune, MDS with excess blasts, IgG kappa",
  },
  {
    key: "cytogenetic_molecular",
    label: "Cytogenetic / molecular finding",
    type: "input",
    placeholder: "e.g. t(9;22) BCR-ABL1, JAK2 V617F, del(5q), FLT3-ITD",
    hint: "Recorded as documented — never used to pick the code automatically.",
  },
  {
    key: "disease_phase",
    label: "Disease phase",
    type: "select",
    options: ["Newly diagnosed", "In remission", "Relapsed", "Refractory", "Transformation", "Not applicable"],
  },
  {
    key: "therapy_related",
    label: "Therapy-related",
    type: "select",
    options: ["No", "Yes — prior chemotherapy", "Yes — prior radiotherapy", "Yes — other therapy", "Unknown"],
  },
  {
    key: "transfusion_dependence",
    label: "Transfusion dependence",
    type: "select",
    options: ["Transfusion-dependent", "Not transfusion-dependent", "Not documented"],
  },
  {
    key: "severity_grade",
    label: "Severity or grade documented",
    type: "input",
    placeholder: "e.g. severe haemophilia (factor <1%), grade 3 neutropenia",
  },
  { key: "complications", label: "Complications documented", type: "input", placeholder: "e.g. iron overload, alloimmunisation" },
  {
    key: "associated_conditions",
    label: "Associated conditions",
    type: "input",
    placeholder: "e.g. chronic kidney disease, autoimmune haemolysis",
  },
];

export const HEMA_ICD_CATALOG_NOTE =
  "WHO ICD-11 MMS only — ICD-10 is never used and no ICD-10 crosswalk is applied. Codes come from this verified catalogue with the release stored beside them, or are entered from the WHO browser and marked review required. Entries flagged Review required are categories where the published listings consulted differ on the wording: check them in the browser before relying on them.";

export const HEMA_ICD_CLUSTER_NOTE =
  "Leave empty unless the WHO Coding Tool produced a postcoordinated cluster. A cluster is copied exactly as the WHO browser shows it (codes joined with & and /) — never assembled here, and never extended with a severity, phase or transfusion-dependence stem the classification does not provide.";

// Families a haematology note needs but whose exact MMS code is not confirmed
// here. The clinician takes the code from the WHO browser; the note stores what
// was entered with its source and flags it until it is checked.
export const HEMA_NOT_IN_CATALOGUE = [
  "Neutropenia, agranulocytosis and febrile neutropenia",
  "Immune thrombocytopenia (ITP) and drug-induced immune thrombocytopenia",
  "Thrombotic thrombocytopenic purpura and haemolytic uraemic syndrome",
  "Transfusion reactions — haemolytic, febrile non-haemolytic, allergic, TRALI, TACO, alloimmunisation",
  "Haemophagocytic lymphohistiocytosis",
  "Graft-versus-host disease and post-transplant haematological states",
  "Iron overload and hereditary haemochromatosis",
  "Sickle cell genotypes and crisis types (vaso-occlusive, acute chest, splenic sequestration)",
  "Leukaemia, lymphoma and myeloma subcategories (ALL, CLL subtypes, DLBCL, multiple myeloma)",
  "Hereditary red cell membrane and enzyme defects (spherocytosis, G6PD deficiency)",
  "Acquired coagulation inhibitors other than those already listed, and anticoagulant-associated bleeding",
  "Haematological disorders in pregnancy, which are coded through the pregnancy chapter in the WHO browser",
];

const SPEC_BLOCK = "Block (stem) — select a subcategory when known";
const SPEC_SUB = "Subcategory — most specific";

// code | WHO display term | domain | catalogue state
// state: verified      both listings agree on the code and its display term
//        review_required the listings consulted differ — confirm in the browser
const RAW = [
  // ---- Nutritional and metabolic anaemias ---------------------------------
  "3A00|Iron deficiency anaemia|erythroid|verified",
  "3A00.0|Acquired iron deficiency anaemia due to blood loss|erythroid|verified",
  "3A00.2|Acquired iron deficiency anaemia due to coeliac disease|erythroid|verified",
  "3A00.3|Acquired iron deficiency anaemia due to increased requirement in pregnancy|erythroid|verified",
  "3A01|Megaloblastic anaemia due to vitamin B12 deficiency|erythroid|verified",
  "3A01.3|Vitamin B12 deficiency anaemia due to intrinsic factor deficiency|erythroid|verified",
  "3A01.4|Acquired megaloblastic anaemia due to vitamin B12 deficiency secondary to intestinal disease|erythroid|verified",
  "3A02|Folate deficiency anaemia|erythroid|verified",
  "3A02.3|Megaloblastic anaemia due to decreased intestinal absorption of folate|erythroid|verified",
  "3A02.4|Megaloblastic anaemia due to drug-induced folate deficiency|erythroid|verified",
  "3A03|Other nutritional or metabolic anaemias|erythroid|review_required",

  // ---- Haemolytic anaemias ------------------------------------------------
  "3A10|Hereditary haemolytic anaemia|haemolytic|verified",
  "3A20|Acquired haemolytic anaemia, immune|haemolytic|verified",
  "3A21|Acquired haemolytic anaemia, non-immune|haemolytic|verified",
  "3A4Z|Haemolytic anaemias, unspecified|haemolytic|verified",

  // ---- Thalassaemias and haemoglobinopathies ------------------------------
  "3A50|Thalassaemias|haemoglobinopathy|verified",
  "3A50.0|Alpha thalassaemia|haemoglobinopathy|verified",
  "3A50.01|Haemoglobin Constant Spring|haemoglobinopathy|verified",
  "3A50.02|Alpha thalassaemia intermedia|haemoglobinopathy|verified",
  "3A50.03|Haemoglobin Bart hydrops fetalis|haemoglobinopathy|verified",
  "3A50.3|Haemoglobin Lepore|haemoglobinopathy|verified",
  "3A51|Sickle cell disorders or other haemoglobinopathies|haemoglobinopathy|verified",

  // ---- Marrow failure and other anaemias ----------------------------------
  "3A60|Congenital pure red cell aplasia|marrow_failure|verified",
  "3A61|Acquired pure red cell aplasia|marrow_failure|verified",
  "3A70|Aplastic anaemia|marrow_failure|verified",
  "3A71|Anaemia due to chronic disease|marrow_failure|verified",
  "3A72|Sideroblastic anaemia|marrow_failure|verified",
  "3A73|Congenital dyserythropoietic anaemia|marrow_failure|verified",
  "3A90|Anaemia due to acute disease|marrow_failure|verified",
  "3A94|Acute posthaemorrhagic anaemia|marrow_failure|verified",

  // ---- Polycythaemia and methaemoglobinaemia ------------------------------
  "3A80|Congenital polycythaemia|erythrocytosis|verified",
  "3A81|Acquired polycythaemia|erythrocytosis|verified",
  "3A91|Congenital methaemoglobinaemia|erythrocytosis|verified",
  "3A93|Acquired methaemoglobinaemia|erythrocytosis|verified",

  // ---- Coagulation defects and haemorrhagic disorders ---------------------
  "3B10|Hereditary factor VIII deficiency|coagulation|verified",
  "3B10.1|Hereditary factor VIII deficiency with anti-factor VIII inhibitor|coagulation|verified",
  "3B11|Hereditary factor IX deficiency|coagulation|verified",
  "3B11.0|Symptomatic form of haemophilia B in female carriers|coagulation|verified",
  "3B12|Von Willebrand disease|coagulation|review_required",
  "3B13|Haemophilia C|coagulation|verified",
  "3B20|Disseminated intravascular coagulation|coagulation|review_required",
  "3B21|Haemorrhagic disorder due to circulating anticoagulants or coagulation factors inhibitors|coagulation|verified",
  "3B22|Acquired haemophilia|coagulation|review_required",
  "3B50|Inherited fibrinolytic defects|coagulation|verified",
  "3B51|Acquired fibrinolytic defects|coagulation|verified",

  // ---- Platelet number and function ---------------------------------------
  "3B60|Non-thrombocytopenic purpura|platelet|verified",
  "3B62|Qualitative platelet defects|platelet|verified",
  "3B63|Thrombocytosis|platelet|verified",
  "3B64|Thrombocytopenia|platelet|verified",

  // ---- Thrombophilia and thrombotic microangiopathy -----------------------
  "3B61|Thrombophilia|thrombotic|verified",
  "3B65|Thrombotic microangiopathy, not elsewhere classified|thrombotic|verified",
  "4A45|Antiphospholipid syndrome|thrombotic|verified",

  // ---- Eosinophilic and mast cell disorders -------------------------------
  "4B03|Eosinophilia|eosinophil_mast|verified",
  "2A21|Mastocytosis|eosinophil_mast|verified",
  "2A21.0|Systemic mastocytosis|eosinophil_mast|verified",

  // ---- Spleen -------------------------------------------------------------
  "3B80|Congenital disorders of spleen|spleen|verified",
  "3B81|Acquired disorders of spleen|spleen|verified",

  // ---- Myeloid, myelodysplastic and myeloproliferative neoplasms ----------
  "2A20|Non mast cell myeloproliferative neoplasms|myeloid_neoplasm|verified",
  "2A20.0|Chronic myelogenous leukaemia, BCR-ABL1-positive|myeloid_neoplasm|verified",
  "2A20.00|Chronic myelogenous leukaemia with blast crisis|myeloid_neoplasm|verified",
  "2A20.1|Chronic neutrophilic leukaemia|myeloid_neoplasm|verified",
  "2A20.3|Chronic eosinophilic leukaemia, not elsewhere classified|myeloid_neoplasm|verified",
  "2A20.4|Primary polycythaemia|myeloid_neoplasm|verified",
  "2A20.5|Non mast cell myeloproliferative neoplasm, unclassifiable|myeloid_neoplasm|verified",
  "2A30|Refractory anaemia|myeloid_neoplasm|review_required",
  "2A31|Refractory neutropaenia|myeloid_neoplasm|verified",
  "2A32|Refractory thrombocytopenia|myeloid_neoplasm|verified",
  "2A36|Myelodysplastic syndrome with isolated del(5q)|myeloid_neoplasm|review_required",
  "2A37|Myelodysplastic syndrome, unclassifiable|myeloid_neoplasm|verified",
  "2A38|Refractory cytopenia of childhood|myeloid_neoplasm|verified",
  "2A40|Chronic myelomonocytic leukaemia|myeloid_neoplasm|verified",
  "2A41|Atypical chronic myeloid leukaemia, BCR-ABL1-negative|myeloid_neoplasm|verified",
  "2A42|Juvenile myelomonocytic leukaemia|myeloid_neoplasm|verified",
  "2A50|Myeloid or lymphoid neoplasm associated with PDGFRA rearrangement|myeloid_neoplasm|verified",
  "2A51|Myeloid neoplasm associated with PDGFRB rearrangement|myeloid_neoplasm|verified",
  "2A52|Myeloid or lymphoid neoplasms with FGFR1 abnormalities|myeloid_neoplasm|verified",
  "2A60|Acute myeloid leukaemias and related precursor neoplasms|myeloid_neoplasm|verified",
  "2A60.2|Therapy-related myeloid neoplasms|myeloid_neoplasm|verified",
  "2A60.4|Myeloid proliferation associated with Down syndrome|myeloid_neoplasm|verified",
  "2A61|Acute leukaemias of ambiguous lineage|myeloid_neoplasm|review_required",

  // ---- Lymphoid neoplasms -------------------------------------------------
  "2A70|Precursor B-lymphoblastic neoplasms|lymphoid_neoplasm|verified",
  "2A71|Precursor T-lymphoblastic neoplasms|lymphoid_neoplasm|verified",
  "2A80|Follicular lymphoma|lymphoid_neoplasm|verified",
  "2A81|Diffuse large B-cell lymphomas|lymphoid_neoplasm|verified",
  "2A82|Mature B-cell neoplasm with leukaemic behaviour|lymphoid_neoplasm|verified",
  "2B30|Hodgkin lymphoma|lymphoid_neoplasm|verified",
  "2B33|Malignant haematopoietic neoplasms without further specification|lymphoid_neoplasm|verified",

  // ---- Plasma cell neoplasms ----------------------------------------------
  "2A83|Plasma cell neoplasms|plasma_cell|verified",
];

// Clinical synonyms are an INDEXING AID only. They let the clinician find a
// category by the words used on the ward round; the code is always stored with
// WHO's display term, and a synonym never widens what a category covers.
const SYNONYMS = {
  "3A00": "ida iron deficiency anaemia microcytic hypochromic low ferritin",
  "3A01": "b12 deficiency macrocytic megaloblastic anaemia",
  "3A01.3": "pernicious anaemia intrinsic factor",
  "3A02": "folate folic acid deficiency macrocytic",
  "3A10": "hereditary spherocytosis elliptocytosis red cell membrane defect",
  "3A20": "aiha warm cold agglutinin autoimmune haemolysis",
  "3A21": "mahi microangiopathic haemolytic anaemia non-immune haemolysis",
  "3A50": "thalassemia thalassaemia alpha beta",
  "3A51": "sickle cell sic kle sct hbs haemoglobin s",
  "3A60": "diamond blackfan pure red cell aplasia congenital",
  "3A61": "pure red cell aplasia acquired prca",
  "3A70": "aplastic anaemia bone marrow failure pancytopenia",
  "3A71": "anaemia of chronic disease inflammation ckd anaemia",
  "3A72": "sideroblastic ring sideroblasts",
  "3A80": "polycythaemia erythrocytosis congenital",
  "3A81": "polycythaemia erythrocytosis acquired secondary",
  "3B10": "haemophilia a hemophilia a factor viii deficiency",
  "3B10.1": "haemophilia a with inhibitor factor viii inhibitor",
  "3B11": "haemophilia b hemophilia b christmas disease factor ix",
  "3B12": "vwd von willebrand disease",
  "3B13": "haemophilia c hemophilia c factor xi",
  "3B20": "dic disseminated intravascular coagulation consumptive coagulopathy",
  "3B21": "lupus anticoagulant inhibitor coagulopathy factor inhibitor",
  "3B22": "acquired haemophilia acquired factor inhibitor",
  "3B60": "purpura vasculitic non-thrombocytopenic",
  "3B61": "thrombophilia hypercoagulable state",
  "3B62": "platelet function defect glanzmann bernard soulier storage pool",
  "3B63": "thrombocytosis reactive essential thrombocythaemia platelet count high",
  "3B64": "thrombocytopenia low platelets",
  "3B65": "tma ttp hus thrombotic microangiopathy",
  "4A45": "aps antiphospholipid syndrome lupus anticoagulant",
  "4B03": "eosinophilia hypereosinophilia raised eosinophils",
  "2A21.0": "systemic mastocytosis mast cell",
  "2A20.0": "cml chronic myeloid leukaemia bcr abl philadelphia",
  "2A20.4": "polycythaemia vera pv jak2",
  "2A30": "mds myelodysplastic syndrome refractory anaemia",
  "2A36": "5q syndrome mds del5q",
  "2A40": "cmml chronic myelomonocytic leukaemia",
  "2A42": "jmml juvenile myelomonocytic leukaemia",
  "2A50": "pdgfra fip1l1 myeloid neoplasm",
  "2A60": "aml acute myeloid leukaemia",
  "2A60.2": "therapy related aml traml secondary aml",
  "2A61": "mixed phenotype acute leukaemia mpal ambiguous lineage",
  "2A70": "all b-all lymphoblastic leukaemia precursor b",
  "2A71": "t-all lymphoblastic lymphoma precursor t",
  "2A80": "follicular lymphoma",
  "2A81": "dlbcl diffuse large b cell lymphoma",
  "2A82": "cll chronic lymphocytic leukaemia small lymphocytic lymphoma",
  "2A83": "multiple myeloma plasma cell myeloma plasmacytoma mgus",
  "2B30": "hodgkin lymphoma hodgkins",
  "2B33": "haematological malignancy neoplasm unspecified",
};

// Coding instructions where the classification is routinely misapplied.
const CODING_NOTE = {
  "3A03":
    "The published listings consulted differ on this residual category's wording (other versus certain nutritional or metabolic anaemias). Use it only after the specific deficiency categories have been excluded, and confirm the wording in the WHO browser.",
  "2A30":
    "The published listings consulted differ on whether this stem is refractory anaemia or refractory anaemia without sideroblasts. Confirm the level — stem or subtype — in the WHO browser before use.",
  "2A36":
    "The published listings consulted differ on this code's wording (isolated del(5q) versus 5q- syndrome). Confirm it in the WHO browser; the cytogenetic finding is recorded in the detail fields.",
  "2A61":
    "The published listings consulted differ on this code's wording (acute leukaemias of ambiguous lineage versus mixed phenotype acute leukaemia). Confirm in the WHO browser, and document the lineage evidence that supports it.",
  "3A00":
    "Iron deficiency is coded from the blood count and the iron studies together. Anaemia of chronic disease (3A71) is a different category and often coexists — code both only when both are documented.",
  "3A01":
    "Macrocytosis is not the diagnosis. Apply this category when the B12 deficiency is documented biochemically; a low or borderline level alone does not confirm it.",
  "3A50":
    "Select the subtype the laboratory has confirmed. The stem is used only while the subtype is not documented, and the subtype is never inferred from the mean cell volume.",
  "3A51":
    "Sickle cell disease and sickle cell trait are not interchangeable, and a vaso-occlusive or acute chest crisis is documented in the note — it is not coded as a separate disease category by hand. Take the genotype subcategory from the WHO browser.",
  "3A70":
    "Aplastic anaemia is a marrow diagnosis: code it when the marrow and the cytopenias are documented. A low blood count alone never establishes it.",
  "3A71":
    "Anaemia of chronic disease is recorded together with the underlying condition it belongs to, never instead of it.",
  "3B10":
    "WHO does not use 'haemophilia A' at this level — the display term is Hereditary factor VIII deficiency. Severity is recorded in the detail fields, never added to the code.",
  "3B10.1":
    "The inhibitor belongs to this category. Do not also code the inhibitor as a separate haemorrhagic disorder.",
  "3B12":
    "The published listings consulted differ on whether this stem carries von Willebrand disease or one of its types. Confirm the correct level (stem or type) in the WHO browser before use.",
  "3B20":
    "The published listings consulted differ on what this stem covers (disseminated intravascular coagulation versus acquired fibrinogenopenia). Confirm in the WHO browser before use.",
  "3B22":
    "The published listings consulted differ on this code (acquired haemophilia versus acquired factor XIII deficiency). Confirm in the WHO browser before use.",
  "3B61":
    "Thrombophilia is a predisposition, not a thrombosis event. When a thrombosis has occurred, code it in the appropriate chapter as well.",
  "3B64":
    "Thrombocytopenia is a finding category. Immune thrombocytopenia and drug-induced immune thrombocytopenia are separate WHO categories — take the specific one from the browser rather than stopping at this stem.",
  "3B65":
    "This is a category of exclusion. Document whether TTP, HUS or another cause was established, because the specific category carries the treatment decision.",
  "2A20.0":
    "Apply this category when the BCR-ABL1 fusion or the Philadelphia chromosome is documented. Without it, a different myeloproliferative category applies.",
  "2A60":
    "Acute myeloid leukaemia is coded from the marrow and the WHO-defined categories. A blast percentage alone does not select the category, and a suspected diagnosis is never stored as confirmed.",
  "2A83":
    "Plasma cell neoplasms is the parent category — multiple myeloma is a subcategory. Select it in the browser when the diagnostic criteria are met; smouldering myeloma is not active myeloma.",
  "2A82":
    "This is the leukaemic mature B-cell group (for example chronic lymphocytic leukaemia). Do not code it as lymphoma when the documented disease is leukaemic.",
  "2B30":
    "Hodgkin lymphoma subtypes are subcategories. The stem is used only while the subtype is not yet documented.",
  "2A21.0":
    "Systemic mastocytosis requires the WHO criteria to be met. A raised tryptase alone does not establish it.",
};

export const HEMA_ICD11 = RAW.map((line) => {
  const [code, display, domain, state] = line.split("|");
  const synonyms = SYNONYMS[code] || "";
  const domainLabel = HEMA_ICD11_DOMAINS[domain] || "";
  const reviewRequired = state === "review_required";
  return {
    code,
    display,
    domain,
    domain_label: domainLabel,
    synonyms: synonyms ? synonyms.split(" ") : [],
    aliases: [domainLabel, synonyms].filter(Boolean).join(" "),
    specificity: code.includes(".") ? SPEC_SUB : SPEC_BLOCK,
    release: HEMA_ICD11_MMS.release,
    source: HEMA_ICD11_MMS.sources[0],
    verified_date: HEMA_ICD11_MMS.retrieved,
    mapping_state: reviewRequired ? "review_required" : "verified",
    coding_note: CODING_NOTE[code] || "",
    category: domain.includes("neoplasm") ? "Haematopoietic neoplasm" : "Haematological disease",
    primary: true,
    definition: reviewRequired
      ? `WHO ICD-11 MMS category in ${domainLabel}. The published listings consulted differ on the exact wording or scope of this code — confirm it in the WHO browser before relying on it. Inclusion and exclusion notes are not reproduced here.`
      : `WHO ICD-11 MMS category in ${domainLabel}. Inclusion and exclusion notes are not reproduced here — confirm the exact category against the WHO browser before relying on a residual (…Y / …Z) code.`,
  };
});

// Where a subcategory's parent category is in the catalogue the entry carries the
// parent link, so the clinician sees where the code sits in the classification.
for (const entry of HEMA_ICD11) {
  const stem = entry.code.split(".")[0];
  const parent = stem !== entry.code ? HEMA_ICD11.find((i) => i.code === stem) : null;
  entry.parent_code = parent ? parent.code : "";
  entry.parent_display = parent ? parent.display : "";
  entry.hierarchy = {
    chapter: HEMA_ICD11_MMS.chapters,
    group: entry.domain_label,
    family: stem,
    parent: parent ? `${parent.code} ${parent.display}` : "",
    level: entry.code.includes(".") ? "Subcategory" : "Category",
  };
}

// Only the domains one note can code, so a transfusion record never suggests an
// acute leukaemia category and a marrow note does not offer plasma cell codes it
// would only ever use through the haematology service.
export const hematologyCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return HEMA_ICD11;
  return HEMA_ICD11.filter((i) => wanted.includes(i.domain));
};

export const HEMA_CATALOG_STATS = {
  total: HEMA_ICD11.length,
  verified: HEMA_ICD11.filter((i) => i.mapping_state === "verified").length,
  review_required: HEMA_ICD11.filter((i) => i.mapping_state === "review_required").length,
};