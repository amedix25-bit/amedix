// ICD-11 diagnosis catalogue for Rheumatology.
//
// Every entry is a code verified against the WHO ICD-11 for Mortality and
// Morbidity Statistics (MMS) browser. Nothing is generated or inferred: a
// concept that is not listed is entered by the clinician with its code and
// official term read from the WHO browser, and is flagged as manually entered
// so it is never presented as a catalogue match.
//
// The catalogue is a search aid only. Selecting a code never confirms a
// diagnosis: a diagnosis is recorded as Suspected / Provisional / Confirmed /
// Historical / Resolved / In remission by the clinician, with the clinical
// basis documented. A keyword, antibody, laboratory result or imaging finding
// never confirms a diagnosis on its own.

export const ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2024-01",
  browser_url: "https://icd.who.int/browse/2024-01/mms/en",
  label: "ICD-11 MMS",
};

export const SPECIFICITY = {
  BLOCK: "Block (stem) — select a subcategory when known",
  SUB: "Subcategory — most specific",
  GROUP: "Category group — specify the syndrome",
};

// `criteria` names the classification criteria a clinician may apply. These
// are references for documentation only — classification criteria are not a
// substitute for clinical diagnosis.
export const RHEUM_ICD11 = [
  {
    code: "FA20",
    display: "Rheumatoid arthritis",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "Chronic inflammatory polyarthritis, usually symmetrical and affecting small joints of the hands and feet, with morning stiffness and possible extra-articular involvement. Classification does not rest on serology alone.",
    criteria: "ACR/EULAR 2010 classification criteria (Aletaha et al., 2010)",
    aliases: "ra rheumatoid seropositive seronegative polyarthritis",
  },
  {
    code: "FA20.0",
    display: "Seropositive rheumatoid arthritis",
    specificity: SPECIFICITY.SUB,
    definition:
      "Rheumatoid arthritis with rheumatoid factor and/or anti-cyclic citrullinated peptide antibodies detected. Serology supports but never establishes the diagnosis.",
    criteria: "ACR/EULAR 2010 classification criteria (Aletaha et al., 2010)",
    aliases: "ra rf anti ccp acpa",
  },
  {
    code: "FA20.1",
    display: "Seronegative rheumatoid arthritis",
    specificity: SPECIFICITY.SUB,
    definition:
      "Rheumatoid arthritis without detectable rheumatoid factor or anti-CCP antibodies; a clinical diagnosis supported by inflammatory joint findings after excluding mimics.",
    criteria: "ACR/EULAR 2010 classification criteria (Aletaha et al., 2010)",
    aliases: "ra seronegative",
  },
  {
    code: "FA21",
    display: "Psoriatic arthritis",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "Inflammatory arthritis associated with psoriasis, typically seronegative, with peripheral, axial, entheseal and dactylitic patterns and varying skin and nail disease.",
    criteria: "CASPAR classification criteria (Taylor et al., 2006)",
    aliases: "psa psoriasis dactylitis enthesitis",
  },
  {
    code: "FA92.0",
    display: "Axial spondyloarthritis",
    specificity: SPECIFICITY.SUB,
    definition:
      "Chronic inflammatory back pain with sacroiliac and spinal inflammation, with or without radiographic sacroiliitis, often with enthesitis, uveitis and family history.",
    criteria: "ASAS classification criteria (Rudwaleit et al., 2009)",
    aliases: "as ankylosing spondylitis axspa sacroiliitis inflammatory back pain",
  },
  {
    code: "FA92.1",
    display: "Peripheral spondyloarthritis",
    specificity: SPECIFICITY.SUB,
    definition:
      "Predominantly peripheral inflammatory arthritis or enthesitis associated with spondyloarthritis features, typically seronegative.",
    criteria: "ASAS classification criteria for peripheral SpA (Rudwaleit et al., 2011)",
    aliases: "pspa peripheral spa enthesitis",
  },
  {
    code: "4A40.0",
    display: "Systemic lupus erythematosus",
    specificity: SPECIFICITY.SUB,
    definition:
      "Multisystem autoimmune disease with constitutional, mucocutaneous, articular, renal, haematological, serosal and neuropsychiatric manifestations, usually with ANA positivity. ANA alone does not diagnose SLE.",
    criteria: "EULAR/ACR 2019 classification criteria (Aringer et al., 2019)",
    aliases: "sle lupus ana dsDNA nephritis",
  },
  {
    code: "4A42",
    display: "Systemic sclerosis",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "Autoimmune connective tissue disease with skin fibrosis, vasculopathy and internal organ fibrosis, ranging from limited to diffuse cutaneous patterns with organ-based complications.",
    criteria: "ACR/EULAR 2013 classification criteria (van den Hoogen et al., 2013)",
    aliases: "scleroderma systemic sclerosis limited diffuse raynaud",
  },
  {
    code: "4A43.2",
    display: "Sjögren syndrome",
    specificity: SPECIFICITY.SUB,
    definition:
      "Chronic autoimmune exocrinopathy with ocular and oral dryness, often with systemic extraglandular features and increased lymphoma risk; may be primary or associated with another autoimmune disease.",
    criteria: "ACR/EULAR 2016 classification criteria (Shiboski et al., 2017)",
    aliases: "sicca dryness anti ro la ssb ssa",
  },
  {
    code: "4A43.3",
    display: "Mixed connective tissue disease",
    specificity: SPECIFICITY.SUB,
    definition:
      "Overlap connective tissue disease combining features of lupus, systemic sclerosis and myositis, usually with high-titre anti-U1-RNP antibodies.",
    criteria: "No validated ACR/EULAR criteria — diagnosis is clinical (Alarcón-Segovia / Kasukawa descriptions)",
    aliases: "mctd u1 rnp overlap",
  },
  {
    code: "4A41.0",
    display: "Dermatomyositis",
    specificity: SPECIFICITY.SUB,
    definition:
      "Idiopathic inflammatory myopathy with proximal muscle weakness and characteristic skin manifestations, with risk of interstitial lung disease, dysphagia and malignancy.",
    criteria: "EULAR/ACR 2017 classification criteria for idiopathic inflammatory myopathies (Lundberg et al., 2017)",
    aliases: "myositis heliotrope gottron muscle weakness",
  },
  {
    code: "4A41.1",
    display: "Polymyositis",
    specificity: SPECIFICITY.SUB,
    definition:
      "Idiopathic inflammatory myopathy causing symmetrical proximal muscle weakness without the characteristic skin disease of dermatomyositis.",
    criteria: "EULAR/ACR 2017 classification criteria for idiopathic inflammatory myopathies (Lundberg et al., 2017)",
    aliases: "myositis proximal weakness ck",
  },
  {
    code: "4A44.A",
    display: "Antineutrophil cytoplasmic antibody associated vasculitis",
    specificity: SPECIFICITY.GROUP,
    definition:
      "Small-vessel vasculitides including granulomatosis with polyangiitis, microscopic polyangiitis and eosinophilic granulomatosis with polyangiitis; organ-threatening disease requires urgent assessment. ANCA supports but does not confirm the diagnosis.",
    criteria: "ACR/EULAR 2022 classification criteria for ANCA-associated vasculitis",
    aliases: "anca vasculitis gpa mpa egpa pr3 mpo",
  },
  {
    code: "4A44.2",
    display: "Giant cell arteritis",
    specificity: SPECIFICITY.SUB,
    definition:
      "Large-vessel vasculitis of older adults with headache, scalp tenderness, jaw claudication and visual risk; frequently associated with polymyalgia rheumatica.",
    criteria: "ACR/EULAR 2022 classification criteria for giant cell arteritis",
    aliases: "gca temporal arteritis jaw claudication vision",
  },
  {
    code: "FA22",
    display: "Polymyalgia rheumatica",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "Inflammatory syndrome of older adults with shoulder and pelvic girdle pain and stiffness, raised inflammatory markers and rapid response to glucocorticoids.",
    criteria: "EULAR/ACR 2012 provisional classification criteria (Dasgupta et al., 2012)",
    aliases: "pmr girdle stiffness",
  },
  {
    code: "FA25",
    display: "Gout",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "Monosodium urate crystal deposition disease causing acute inflammatory arthritis, tophi and urate-related renal disease, associated with hyperuricaemia.",
    criteria: "ACR/EULAR 2015 classification criteria (Neogi et al., 2015)",
    aliases: "gout urate hyperuricaemia podagra tophus",
  },
  {
    code: "FA25.1",
    display: "Secondary gout",
    specificity: SPECIFICITY.SUB,
    definition:
      "Gout occurring secondary to an identifiable cause such as renal impairment, diuretic or cytotoxic therapy, or a myeloproliferative disorder.",
    criteria: "ACR/EULAR 2015 classification criteria (Neogi et al., 2015)",
    aliases: "gout secondary diuretic renal",
  },
  {
    code: "FA25.20",
    display: "Tophaceous gout",
    specificity: SPECIFICITY.SUB,
    definition:
      "Gout with visible or imaging-confirmed tophi, reflecting prolonged urate deposition and often erosive disease.",
    criteria: "ACR/EULAR 2015 classification criteria (Neogi et al., 2015)",
    aliases: "gout tophi chronic erosive",
  },
  {
    code: "4A45",
    display: "Antiphospholipid syndrome",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "Acquired thrombophilia with venous or arterial thrombosis and/or pregnancy morbidity together with persistent antiphospholipid antibodies; may be primary or associated with SLE.",
    criteria: "Revised Sydney / ISTH classification criteria (Miyakis et al., 2006)",
    aliases: "aps antiphospholipid lupus anticoagulant cardiolipin beta2 glycoprotein thrombosis",
  },
  {
    code: "FA01",
    display: "Osteoarthritis of knee",
    specificity: SPECIFICITY.SUB,
    definition:
      "Degenerative joint disease of the knee with activity-related pain, brief stiffness, crepitus and variable synovitis, often with radiographic joint-space loss.",
    criteria: "ACR clinical and radiographic classification criteria (Altman et al., 1986)",
    aliases: "oa knee osteoarthritis degenerative",
  },
  {
    code: "FA02",
    display: "Osteoarthritis of wrist or hand",
    specificity: SPECIFICITY.SUB,
    definition:
      "Degenerative joint disease of the hand or wrist, typically affecting distal and proximal interphalangeal joints and the first carpometacarpal joint.",
    criteria: "ACR classification criteria for hand osteoarthritis (Altman et al., 1990)",
    aliases: "oa hand osteoarthritis heberden bouchard",
  },
  {
    code: "MG30.01",
    display: "Chronic widespread pain",
    specificity: SPECIFICITY.SUB,
    definition:
      "Diffuse chronic musculoskeletal pain with the fibromyalgia syndrome among its inclusion terms; a clinical diagnosis of exclusion, never made from laboratory findings.",
    criteria: "ACR 2010/2016 fibromyalgia diagnostic criteria (Wolfe et al.)",
    aliases: "fibromyalgia fm widespread pain",
  },
];

export const DIAGNOSIS_STATUSES = [
  "Suspected",
  "Provisional",
  "Confirmed",
  "Historical",
  "Resolved",
  "In remission",
];

export const DIAGNOSIS_ROLES = ["Primary", "Secondary", "Differential"];

export const matchesIcd11 = (item, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return [item.code, item.display, item.definition, item.aliases]
    .filter(Boolean)
    .some((s) => String(s).toLowerCase().includes(q));
};