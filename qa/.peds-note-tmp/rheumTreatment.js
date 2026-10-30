// Rheumatology treatment documentation & clinical decision support.
//
// This module holds the reference knowledge behind the structured treatment
// plan and the safety / monitoring panel. It never prescribes, calculates a
// patient-specific regimen, or stops therapy: it states what a documented
// treatment requires (baseline tests, monitoring intervals, interactions,
// counselling) and raises alerts a clinician must verify.
//
// Every requirement and alert carries an explanation and its source, with the
// publication year where one exists. Where a statement comes from the drug's
// approved product information it says so rather than inventing a guideline.

export const SOURCES = {
  ra2021: "2021 ACR Guideline for the Treatment of Rheumatoid Arthritis (Arthritis Rheumatol 2021)",
  eularRa2022: "EULAR recommendations for the management of rheumatoid arthritis: 2022 update (Ann Rheum Dis 2023)",
  mtx2016: "EULAR points to consider for the use of methotrexate in rheumatic diseases (Ann Rheum Dis 2016)",
  sle2023: "EULAR recommendations for the management of systemic lupus erythematosus: 2023 update",
  aav2021: "2021 ACR/Vasculitis Foundation Guideline for ANCA-Associated Vasculitis",
  gout2020: "2020 ACR Guideline for the Management of Gout (Arthritis Rheumatol 2020)",
  asasEular2022: "ASAS-EULAR recommendations for the management of axial spondyloarthritis: 2022 update",
  psa2018: "2018 ACR/National Psoriasis Foundation Guideline for the Treatment of Psoriatic Arthritis",
  oa2019: "2019 ACR/Arthritis Foundation Guideline for the Management of Osteoarthritis of the Hand, Hip and Knee",
  giop2017: "2017 ACR Guideline for the Prevention and Treatment of Glucocorticoid-Induced Osteoporosis",
  vacc2019: "EULAR recommendations for vaccination in adult patients with autoimmune inflammatory rheumatic diseases (2019)",
  smpc: "Approved product information (Summary of Product Characteristics) — drug-specific monitoring",
};

export const TREATMENT_CLASSES = [
  { key: "csdmard", label: "Conventional synthetic DMARD" },
  { key: "bdmard", label: "Biologic DMARD" },
  { key: "tsdmard", label: "Targeted synthetic DMARD" },
  { key: "glucocorticoid", label: "Glucocorticoid" },
  { key: "nsaid", label: "NSAID" },
  { key: "analgesic", label: "Analgesic" },
  { key: "colchicine", label: "Colchicine" },
  { key: "ult", label: "Urate-lowering therapy" },
  { key: "osteoporosis", label: "Osteoporosis medication" },
  { key: "non_pharm", label: "Non-pharmacological intervention" },
];

export const ROUTES = ["Oral", "Subcutaneous", "Intramuscular", "Intravenous", "Intra-articular", "Topical", "Other"];
export const ADHERENCE_OPTIONS = ["Taking as prescribed", "Partial adherence", "Not taking", "Not documented"];
export const RESULT_OPTIONS = ["Normal", "Abnormal — clinically significant", "Awaiting result", "Not done"];

export const MONITORING_TESTS = {
  cbc: { label: "Full blood count", baseline: "Before starting, then on the interval below" },
  liver: { label: "Liver function — ALT, AST, albumin, bilirubin", baseline: "Before starting, then on the interval below" },
  renal: { label: "Renal function — creatinine, eGFR", baseline: "Before starting, then on the interval below" },
  urinalysis: { label: "Urinalysis — protein, blood, casts", baseline: "Before starting, then on the interval below" },
  hbv: { label: "Hepatitis B — HBsAg, anti-HBc, anti-HBs", baseline: "Before starting immunosuppression" },
  hcv: { label: "Hepatitis C serology", baseline: "Before starting immunosuppression" },
  hiv: { label: "HIV screening", baseline: "Before starting immunosuppression" },
  tb: { label: "Tuberculosis screening — IGRA or Mantoux, chest radiograph", baseline: "Before every biologic or targeted synthetic DMARD" },
  pregnancy: { label: "Pregnancy test and contraception review", baseline: "Before starting a teratogenic or unestablished-risk therapy" },
  lipids: { label: "Lipids", baseline: "Before starting, then annually" },
  glucose: { label: "Fasting glucose or HbA1c", baseline: "Before starting, then annually" },
  bp: { label: "Blood pressure", baseline: "Before starting, then at each review" },
  weight: { label: "Weight and body mass index", baseline: "At baseline, then annually" },
  dxa: { label: "DXA bone density", baseline: "At baseline, then every 2 years on glucocorticoids" },
  calciumVitD: { label: "Calcium, vitamin D, alkaline phosphatase", baseline: "At baseline, then annually on bone-protective therapy" },
  eye: { label: "Ocular review — retina on hydroxychloroquine; cataract and glaucoma on glucocorticoids", baseline: "At baseline, then annually" },
  dental: { label: "Dental review before antiresorptive therapy", baseline: "Before zoledronic acid or denosumab" },
  ck: { label: "Creatine kinase", baseline: "Before starting, then if muscle symptoms occur" },
  urate: { label: "Serum urate", baseline: "Before starting, then to target" },
  g6pd: { label: "G6PD status where relevant", baseline: "Before sulfasalazine in at-risk patients" },
  tpmt: { label: "TPMT / NUDT15 genotype or phenotype", baseline: "Before starting a thiopurine" },
  vaccination: { label: "Vaccination review — including live-vaccine avoidance", baseline: "Before starting immunosuppression" },
  infection: { label: "Infection surveillance at each visit", baseline: "At every review on immunosuppression" },
};

const CLASS_PROFILE = {
  csdmard: { tests: ["cbc", "liver", "renal", "hbv", "hcv", "pregnancy"], months: 3, note: "Blood counts and liver enzymes are checked more often at initiation and after any dose change." },
  bdmard: { tests: ["tb", "hbv", "hcv", "hiv", "cbc", "liver", "renal", "pregnancy", "vaccination"], months: 6, note: "Screen for latent tuberculosis and hepatitis before the first dose; re-screen after exposure risk." },
  tsdmard: { tests: ["tb", "hbv", "hcv", "hiv", "cbc", "liver", "renal", "lipids", "pregnancy", "vaccination"], months: 3, note: "Herpes zoster and venous thromboembolism risk are reviewed before and during therapy." },
  glucocorticoid: { tests: ["bp", "glucose", "lipids", "weight", "dxa", "calciumVitD", "eye"], months: 12, note: "Bone protection and metabolic surveillance run for the whole duration of glucocorticoid exposure." },
  nsaid: { tests: ["renal", "bp", "cbc"], months: 6, note: "Renal function and blood pressure are reviewed, with gastrointestinal and cardiovascular risk at each review." },
  analgesic: { tests: ["renal", "liver"], months: 12, note: "Review total daily dose, combination products and hepatic or renal impairment." },
  colchicine: { tests: ["cbc", "renal", "liver", "ck"], months: 6, note: "Dose is limited by renal and hepatic function and by CYP3A4 / P-glycoprotein inhibitors." },
  ult: { tests: ["urate", "renal", "liver"], months: 3, note: "Urate is titrated to target; flare prophylaxis continues while urate is above target." },
  osteoporosis: { tests: ["dxa", "calciumVitD", "renal", "dental"], months: 12, note: "Review dental status before antiresorptive therapy and re-assess bone density on schedule." },
  non_pharm: { tests: [], months: 0, note: "Non-pharmacological care is reviewed against function, activity and the patient's own goals." },
};

const D = (key, name, cls, extra = {}) => ({ key, name, cls, routes: ["Oral"], immunosuppressant: false, teratogenic: false, ...extra });

export const DRUGS = [
  D("methotrexate", "Methotrexate", "csdmard", {
    routes: ["Oral", "Subcutaneous", "Intramuscular"], immunosuppressant: true, teratogenic: true,
    tests: ["cbc", "liver", "renal", "hbv", "hcv", "hiv", "pregnancy"],
    note: "Folic acid cover, once-weekly dosing, alcohol limit and pregnancy avoidance are documented with the plan.",
    counsel: ["Once weekly only", "Folic acid cover", "Alcohol limit", "Effective contraception", "Sick-day rules"],
    ref: SOURCES.mtx2016,
  }),
  D("hydroxychloroquine", "Hydroxychloroquine", "csdmard", {
    tests: ["eye"], months: 12,
    note: "Weight-based dosing with retinal screening; routine blood counts are not required.",
    counsel: ["Annual retinal screening", "Report visual change", "Adhere to the dose ceiling"],
    ref: SOURCES.eularRa2022,
  }),
  D("sulfasalazine", "Sulfasalazine", "csdmard", {
    tests: ["cbc", "liver", "renal", "g6pd", "pregnancy"],
    note: "Enteric-coated titration; sulphonamide allergy and G6PD status are checked first.",
    counsel: ["Report rash or sore throat", "Folate supplementation", "Temporary urine discolouration"],
    ref: SOURCES.eularRa2022,
  }),
  D("leflunomide", "Leflunomide", "csdmard", {
    immunosuppressant: true, teratogenic: true, tests: ["cbc", "liver", "renal", "bp", "pregnancy"],
    note: "Contraception is mandatory; a washout protocol applies before conception.",
    counsel: ["Effective contraception", "Blood pressure checks", "Report hair loss or diarrhoea"],
    ref: SOURCES.eularRa2022,
  }),
  D("azathioprine", "Azathioprine", "csdmard", {
    immunosuppressant: true, tests: ["tpmt", "cbc", "liver", "renal"],
    note: "Thiopurine methyltransferase status is checked before starting; allopurinol and febuxostat co-prescription is avoided.",
    counsel: ["Sun protection", "Sick-day rules", "Report fever or bruising"],
    ref: SOURCES.sle2023,
  }),
  D("mycophenolate", "Mycophenolate mofetil", "csdmard", {
    immunosuppressant: true, teratogenic: true, tests: ["cbc", "liver", "renal", "pregnancy"],
    note: "A pregnancy-prevention programme applies; live vaccines are avoided.",
    counsel: ["Strict contraception", "Do not share medication", "Report infection"],
    ref: SOURCES.sle2023,
  }),
  D("cyclophosphamide", "Cyclophosphamide", "csdmard", {
    routes: ["Oral", "Intravenous"], immunosuppressant: true, teratogenic: true,
    tests: ["cbc", "renal", "liver", "urinalysis", "pregnancy"],
    note: "Specialist supervision with mesna and hydration for intravenous pulses; fertility counselling documented.",
    counsel: ["Fertility and gonadal protection", "Hydration", "Contraception"],
    ref: SOURCES.aav2021,
  }),
  D("adalimumab", "Adalimumab", "bdmard", {
    routes: ["Subcutaneous"], immunosuppressant: true,
    tests: ["tb", "hbv", "hcv", "hiv", "cbc", "liver", "pregnancy", "vaccination"],
    counsel: ["Injection technique", "Sick-day rules", "No live vaccines"], ref: SOURCES.ra2021,
  }),
  D("etanercept", "Etanercept", "bdmard", {
    routes: ["Subcutaneous"], immunosuppressant: true,
    tests: ["tb", "hbv", "hcv", "hiv", "cbc", "liver", "pregnancy", "vaccination"],
    counsel: ["Injection technique", "Sick-day rules", "No live vaccines"], ref: SOURCES.ra2021,
  }),
  D("infliximab", "Infliximab", "bdmard", {
    routes: ["Intravenous"], immunosuppressant: true,
    tests: ["tb", "hbv", "hcv", "hiv", "cbc", "liver", "pregnancy", "vaccination"],
    note: "Infusion reactions and premedication are documented with each administration.",
    counsel: ["Infusion reaction symptoms", "Sick-day rules", "No live vaccines"], ref: SOURCES.ra2021,
  }),
  D("golimumab", "Golimumab", "bdmard", {
    routes: ["Subcutaneous", "Intravenous"], immunosuppressant: true,
    tests: ["tb", "hbv", "hcv", "hiv", "cbc", "liver", "pregnancy", "vaccination"], ref: SOURCES.asasEular2022,
  }),
  D("certolizumab", "Certolizumab pegol", "bdmard", {
    routes: ["Subcutaneous"], immunosuppressant: true,
    tests: ["tb", "hbv", "hcv", "hiv", "cbc", "liver", "pregnancy", "vaccination"], ref: SOURCES.ra2021,
  }),
  D("abatacept", "Abatacept", "bdmard", {
    routes: ["Subcutaneous", "Intravenous"], immunosuppressant: true,
    tests: ["tb", "hbv", "hcv", "hiv", "cbc", "liver", "pregnancy", "vaccination"], ref: SOURCES.ra2021,
  }),
  D("tocilizumab", "Tocilizumab", "bdmard", {
    routes: ["Subcutaneous", "Intravenous"], immunosuppressant: true,
    tests: ["cbc", "liver", "lipids", "tb", "hbv", "hcv", "pregnancy"],
    note: "CRP may be suppressed by IL-6 blockade — disease activity is interpreted with that in mind.", ref: SOURCES.ra2021,
  }),
  D("sarilumab", "Sarilumab", "bdmard", {
    routes: ["Subcutaneous"], immunosuppressant: true,
    tests: ["cbc", "liver", "lipids", "tb", "hbv", "hcv", "pregnancy"], ref: SOURCES.ra2021,
  }),
  D("rituximab", "Rituximab", "bdmard", {
    routes: ["Intravenous"], immunosuppressant: true,
    tests: ["hbv", "hcv", "hiv", "cbc", "renal", "pregnancy", "vaccination"],
    note: "Hepatitis B reactivation risk is assessed before every course; immunoglobulin levels are reviewed with repeated courses.",
    ref: SOURCES.aav2021,
  }),
  D("belimumab", "Belimumab", "bdmard", {
    routes: ["Intravenous", "Subcutaneous"], immunosuppressant: true,
    tests: ["tb", "hbv", "cbc", "renal", "pregnancy"], ref: SOURCES.sle2023,
  }),
  D("secukinumab", "Secukinumab", "bdmard", {
    routes: ["Subcutaneous"], immunosuppressant: true, tests: ["tb", "hbv", "hcv", "cbc", "pregnancy"],
    note: "Candida infection and inflammatory bowel disease history are reviewed.", ref: SOURCES.asasEular2022,
  }),
  D("ixekizumab", "Ixekizumab", "bdmard", {
    routes: ["Subcutaneous"], immunosuppressant: true, tests: ["tb", "hbv", "hcv", "cbc", "pregnancy"], ref: SOURCES.asasEular2022,
  }),
  D("ustekinumab", "Ustekinumab", "bdmard", {
    routes: ["Subcutaneous", "Intravenous"], immunosuppressant: true, tests: ["tb", "hbv", "hcv", "cbc", "pregnancy"], ref: SOURCES.psa2018,
  }),
  D("tofacitinib", "Tofacitinib", "tsdmard", {
    immunosuppressant: true, teratogenic: true,
    tests: ["cbc", "liver", "renal", "lipids", "tb", "hbv", "hcv", "pregnancy", "bp"],
    note: "Cardiovascular and venous thromboembolic risk are assessed before starting, with the lowest effective dose and a documented risk discussion.",
    counsel: ["Herpes zoster risk", "Thrombosis warning signs", "No live vaccines"], ref: SOURCES.ra2021,
  }),
  D("baricitinib", "Baricitinib", "tsdmard", {
    immunosuppressant: true, teratogenic: true,
    tests: ["cbc", "liver", "renal", "lipids", "tb", "hbv", "hcv", "pregnancy", "bp"],
    note: "Dose is adjusted for renal impairment; thrombotic and lipid risk are reviewed.", ref: SOURCES.ra2021,
  }),
  D("upadacitinib", "Upadacitinib", "tsdmard", {
    immunosuppressant: true, teratogenic: true,
    tests: ["cbc", "liver", "renal", "lipids", "tb", "hbv", "hcv", "pregnancy", "bp"],
    note: "Thrombotic and cardiovascular risk assessment documented before starting.", ref: SOURCES.ra2021,
  }),
  D("prednisolone", "Prednisolone", "glucocorticoid", {
    tests: ["bp", "glucose", "lipids", "weight", "dxa", "calciumVitD", "eye", "infection"],
    note: "Tapering schedule and bone protection are documented with the dose.",
    counsel: ["Do not stop abruptly", "Bone protection", "Glucose monitoring", "Infection warning signs"], ref: SOURCES.giop2017,
  }),
  D("methylprednisolone", "Methylprednisolone", "glucocorticoid", {
    routes: ["Oral", "Intravenous", "Intramuscular"], tests: ["bp", "glucose", "lipids", "weight", "dxa", "calciumVitD", "eye"],
    note: "Pulse therapy requires blood pressure, glucose and infection surveillance.", ref: SOURCES.giop2017,
  }),
  D("ibuprofen", "Ibuprofen", "nsaid", {
    tests: ["renal", "bp", "cbc"], note: "Gastrointestinal, renal and cardiovascular risk are reviewed before starting.",
    counsel: ["Take with food", "Report black stools or epigastric pain", "Avoid during dehydration"], ref: SOURCES.ra2021,
  }),
  D("naproxen", "Naproxen", "nsaid", { tests: ["renal", "bp", "cbc"], ref: SOURCES.oa2019 }),
  D("diclofenac", "Diclofenac", "nsaid", { tests: ["renal", "bp", "cbc", "liver"], ref: SOURCES.oa2019 }),
  D("celecoxib", "Celecoxib", "nsaid", {
    tests: ["renal", "bp", "cbc"], note: "Cardiovascular risk and sulphonamide allergy are reviewed before starting a coxib.", ref: SOURCES.oa2019,
  }),
  D("etoricoxib", "Etoricoxib", "nsaid", { tests: ["renal", "bp", "cbc"], ref: SOURCES.oa2019 }),
  D("paracetamol", "Paracetamol", "analgesic", {
    tests: ["liver"], note: "Total daily dose across all combination products is documented.",
    counsel: ["Maximum daily dose", "Check combination products"], ref: SOURCES.oa2019,
  }),
  D("tramadol", "Tramadol", "analgesic", {
    tests: ["renal", "liver"], note: "Sedation, seizure threshold and serotonergic interactions are reviewed.", ref: SOURCES.oa2019,
  }),
  D("codeine", "Codeine", "analgesic", { tests: ["renal", "liver"], note: "Constipation prophylaxis and driving advice documented.", ref: SOURCES.oa2019 }),
  D("colchicine", "Colchicine", "colchicine", {
    tests: ["cbc", "renal", "liver", "ck"],
    note: "Dose is limited by renal and hepatic function and by CYP3A4 / P-glycoprotein inhibitors; diarrhoea is the commonest early toxicity.",
    counsel: ["Dose reduction in renal impairment", "Stop and seek advice if diarrhoea", "Avoid grapefruit and interacting drugs"], ref: SOURCES.gout2020,
  }),
  D("allopurinol", "Allopurinol", "ult", {
    tests: ["urate", "renal", "liver", "cbc"],
    note: "Start low and titrate to urate target; HLA-B*5801 testing is recommended in Han Chinese, Korean and Thai patients with chronic kidney disease.",
    counsel: ["Flare prophylaxis while titrating", "Report rash immediately", "Do not stop during a flare"], ref: SOURCES.gout2020,
  }),
  D("febuxostat", "Febuxostat", "ult", {
    tests: ["urate", "renal", "liver", "cbc"],
    note: "Cardiovascular history is reviewed before use; avoid with azathioprine or mercaptopurine.", ref: SOURCES.gout2020,
  }),
  D("alendronate", "Alendronate", "osteoporosis", {
    tests: ["dxa", "calciumVitD", "renal", "dental"],
    note: "Administration instruction and dental review are documented before the first dose.",
    counsel: ["Take upright with water", "Stay upright 30 minutes", "Dental review before starting"], ref: SOURCES.giop2017,
  }),
  D("risedronate", "Risedronate", "osteoporosis", { tests: ["dxa", "calciumVitD", "renal", "dental"], ref: SOURCES.giop2017 }),
  D("zoledronic_acid", "Zoledronic acid", "osteoporosis", {
    routes: ["Intravenous"], tests: ["dxa", "calciumVitD", "renal", "dental"],
    note: "Renal function and dental status are checked before each annual infusion; acute-phase reaction advice is given.", ref: SOURCES.giop2017,
  }),
  D("denosumab", "Denosumab", "osteoporosis", {
    routes: ["Subcutaneous"], tests: ["dxa", "calciumVitD", "renal", "dental"],
    note: "Do not delay or omit doses — rebound vertebral fracture risk after stopping requires a documented transition plan.", ref: SOURCES.giop2017,
  }),
  D("teriparatide", "Teriparatide", "osteoporosis", {
    routes: ["Subcutaneous"], tests: ["dxa", "calciumVitD", "renal"],
    note: "Time-limited therapy with a documented plan for the antiresorptive that follows it.", ref: SOURCES.giop2017,
  }),
  D("calcium_vitd", "Calcium and vitamin D", "osteoporosis", { tests: ["calciumVitD", "renal"], ref: SOURCES.giop2017 }),
  D("physiotherapy", "Physiotherapy / physiotherapy-led exercise", "non_pharm", {
    routes: ["Other"], tests: [], months: 0, note: "Dose, supervision and progression are documented with the referrer.",
    counsel: ["Home exercise programme", "Pacing and joint protection"], ref: SOURCES.ra2021,
  }),
  D("exercise", "Structured aerobic and strengthening exercise", "non_pharm", { routes: ["Other"], tests: [], months: 0, ref: SOURCES.eularRa2022 }),
  D("smoking_cessation", "Smoking cessation support", "non_pharm", {
    routes: ["Other"], tests: [], months: 0,
    note: "Smoking is a modifiable risk factor for disease activity, cardiovascular risk and biologic failure.", ref: SOURCES.eularRa2022,
  }),
  D("weight_management", "Weight management and dietetic review", "non_pharm", { routes: ["Other"], tests: [], months: 0, ref: SOURCES.eularRa2022 }),
  D("self_management", "Self-management education and supported self-monitoring", "non_pharm", { routes: ["Other"], tests: [], months: 0, ref: SOURCES.eularRa2022 }),
  D("podiatry", "Podiatry and foot care", "non_pharm", { routes: ["Other"], tests: [], months: 0, ref: SOURCES.ra2021 }),
  D("occupational_therapy", "Occupational therapy and joint protection", "non_pharm", { routes: ["Other"], tests: [], months: 0, ref: SOURCES.ra2021 }),
  D("orthotics", "Orthotics and assistive devices", "non_pharm", { routes: ["Other"], tests: [], months: 0, ref: SOURCES.oa2019 }),
];

export const getDrug = (keyOrName) => {
  if (!keyOrName) return null;
  const q = String(keyOrName).trim().toLowerCase();
  return DRUGS.find((d) => d.key === q || d.name.toLowerCase() === q) || null;
};

export const classLabel = (cls) => (TREATMENT_CLASSES.find((c) => c.key === cls) || {}).label || cls || "";

export const searchDrugs = (query = "") => {
  const q = query.trim().toLowerCase();
  if (!q) return DRUGS;
  return DRUGS.filter((d) => d.name.toLowerCase().includes(q) || classLabel(d.cls).toLowerCase().includes(q));
};

// Baseline + interval monitoring a documented drug requires. This is the
// requirement set — it is never marked complete automatically.
export function monitoringRequirements(keyOrName) {
  const drug = getDrug(keyOrName);
  if (!drug) return [];
  const profile = CLASS_PROFILE[drug.cls] || CLASS_PROFILE.csdmard;
  const tests = drug.tests || profile.tests;
  const months = drug.months === undefined ? profile.months : drug.months;
  return tests.map((t) => {
    const test = MONITORING_TESTS[t] || { label: t, baseline: "Before starting" };
    return {
      test: t,
      label: test.label,
      baseline: test.baseline,
      intervalMonths: months,
      reference: drug.ref || SOURCES.smpc,
    };
  });
}

export const drugNote = (keyOrName) => {
  const drug = getDrug(keyOrName);
  if (!drug) return "";
  const profile = CLASS_PROFILE[drug.cls] || {};
  return drug.note || profile.note || "";
};

const addMonths = (dateStr, months) => {
  if (!dateStr || !months) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const next = new Date(d);
  next.setMonth(next.getMonth() + months);
  return next;
};

const iso = (d) => d.toISOString().slice(0, 10);

// Status of every monitoring item for every documented drug. Only what the
// clinician recorded is evaluated — nothing is inferred from missing data.
export function evaluateMonitoring(entries = [], today = new Date()) {
  const rows = [];
  (entries || []).forEach((entry) => {
    const reqs = monitoringRequirements(entry.drug_key || entry.drug);
    const recorded = Array.isArray(entry.monitoring) ? entry.monitoring : [];
    reqs.forEach((req) => {
      const rec = recorded.find((m) => m.test === req.test) || {};
      const last = rec.last_date || "";
      const result = rec.result || "";
      const due = addMonths(last, req.intervalMonths);
      let status = "not_documented";
      if (String(result).indexOf("Abnormal") === 0) status = "abnormal";
      else if (result === "Awaiting result") status = "awaiting";
      else if (!last && result !== "Normal") status = "not_documented";
      else if (last && due && due < today) status = "overdue";
      else if (last && due && due - today <= 30 * 86400000) status = "due_soon";
      else if (last) status = "current";
      rows.push({
        entryId: entry.id,
        drugKey: entry.drug_key || entry.drug,
        drugName: (getDrug(entry.drug_key || entry.drug) || {}).name || entry.drug,
        test: req.test,
        label: req.label,
        baseline: req.baseline,
        intervalMonths: req.intervalMonths,
        last_date: last,
        result,
        next_due: due ? iso(due) : "",
        status,
        reference: req.reference,
      });
    });
  });
  const rank = { abnormal: 0, overdue: 1, awaiting: 2, not_documented: 3, due_soon: 4, current: 5 };
  return rows.sort((a, b) => rank[a.status] - rank[b.status]);
}

export const MONITORING_STATUS = {
  abnormal: { label: "Abnormal — review", level: "high" },
  overdue: { label: "Overdue", level: "moderate" },
  awaiting: { label: "Result awaited", level: "info" },
  not_documented: { label: "Not documented", level: "moderate" },
  due_soon: { label: "Due within 30 days", level: "info" },
  current: { label: "Up to date", level: "none" },
};

export const INTERACTION_RULES = [
  {
    id: "mtx_trimethoprim", a: ["methotrexate"], b: ["trimethoprim", "co-trimoxazole", "cotrimoxazole"], level: "high",
    title: "Methotrexate with trimethoprim",
    detail: "Both are folate antagonists; the combination can cause severe marrow suppression.",
    action: "Avoid the combination where an alternative antibiotic exists; if unavoidable, monitor the blood count closely.",
    reference: SOURCES.mtx2016,
  },
  {
    id: "mtx_clearance", a: ["methotrexate"], b: ["probenecid", "penicillin"], level: "moderate",
    title: "Methotrexate with a drug that reduces its clearance",
    detail: "Probenecid and high-dose penicillins reduce methotrexate elimination and can increase toxicity.",
    action: "Review the methotrexate dose and blood count during co-prescription.",
    reference: SOURCES.smpc,
  },
  {
    id: "mtx_nsaid", a: ["methotrexate"], b: ["ibuprofen", "naproxen", "diclofenac", "celecoxib", "etoricoxib", "aspirin"], level: "moderate",
    title: "Methotrexate with an NSAID",
    detail: "NSAIDs can reduce methotrexate clearance, particularly at higher methotrexate doses or with renal impairment.",
    action: "Monitor the blood count, liver and renal function more closely, especially at methotrexate doses above 15 mg weekly.",
    reference: SOURCES.mtx2016,
  },
  {
    id: "aza_allopurinol", a: ["azathioprine", "mercaptopurine"], b: ["allopurinol", "febuxostat"], level: "high",
    title: "Thiopurine with a xanthine oxidase inhibitor",
    detail: "Allopurinol and febuxostat block thiopurine metabolism and can cause profound myelosuppression.",
    action: "Avoid the combination; if urate-lowering therapy is essential, specialist dose reduction and close blood-count monitoring are required.",
    reference: SOURCES.gout2020,
  },
  {
    id: "colchicine_cyp", a: ["colchicine"], b: ["clarithromycin", "erythromycin", "ketoconazole", "itraconazole", "ritonavir", "cyclosporin", "cyclosporine", "verapamil", "diltiazem"], level: "high",
    title: "Colchicine with a CYP3A4 / P-glycoprotein inhibitor",
    detail: "Colchicine levels rise substantially, risking myopathy, neuropathy and bone-marrow toxicity.",
    action: "Avoid, or reduce the colchicine dose with specialist advice and monitor for toxicity.",
    reference: SOURCES.gout2020,
  },
  {
    id: "colchicine_statin", a: ["colchicine"], b: ["atorvastatin", "simvastatin", "rosuvastatin", "pravastatin"], level: "moderate",
    title: "Colchicine with a statin",
    detail: "Both can cause myopathy; the risk is increased when they are used together.",
    action: "Ask about muscle pain, and check creatine kinase if symptoms appear.",
    reference: SOURCES.smpc,
  },
  {
    id: "nsaid_anticoag", a: ["ibuprofen", "naproxen", "diclofenac", "celecoxib", "etoricoxib", "aspirin"], b: ["warfarin", "apixaban", "rivaroxaban", "dabigatran", "edoxaban", "clopidogrel", "ticagrelor"], level: "high",
    title: "NSAID with an anticoagulant or antiplatelet",
    detail: "Gastrointestinal bleeding risk is substantially increased.",
    action: "Prefer an alternative analgesic; if continued, document gastroprotection and bleeding-risk review.",
    reference: SOURCES.oa2019,
  },
  {
    id: "nsaid_triple", a: ["ibuprofen", "naproxen", "diclofenac", "celecoxib", "etoricoxib"], b: ["ramipril", "enalapril", "lisinopril", "losartan", "valsartan", "candesartan", "furosemide", "spironolactone", "hydrochlorothiazide"], level: "high",
    title: "NSAID with an ACE inhibitor / ARB and a diuretic",
    detail: "The combination can precipitate acute kidney injury, especially during dehydration or intercurrent illness.",
    action: "Review the need for each drug, check renal function, and give sick-day advice.",
    reference: SOURCES.smpc,
  },
  {
    id: "nsaid_levels", a: ["ibuprofen", "naproxen", "diclofenac", "celecoxib", "etoricoxib"], b: ["lithium", "digoxin"], level: "moderate",
    title: "NSAID with lithium or digoxin",
    detail: "NSAIDs raise lithium and digoxin levels and can cause toxicity.",
    action: "Monitor drug levels if the combination is needed.",
    reference: SOURCES.smpc,
  },
  {
    id: "gc_nsaid", a: ["prednisolone", "methylprednisolone"], b: ["ibuprofen", "naproxen", "diclofenac", "celecoxib", "etoricoxib", "aspirin"], level: "moderate",
    title: "Glucocorticoid with an NSAID",
    detail: "Combined use increases the risk of peptic ulceration and gastrointestinal bleeding.",
    action: "Document gastroprotection and review the need for both.",
    reference: SOURCES.giop2017,
  },
  {
    id: "hcq_qt", a: ["hydroxychloroquine"], b: ["azithromycin", "clarithromycin", "ondansetron", "haloperidol", "amiodarone", "methadone"], level: "moderate",
    title: "Hydroxychloroquine with another QT-prolonging drug",
    detail: "Additive QT prolongation is possible, particularly with cardiac disease or electrolyte disturbance.",
    action: "Review the ECG and electrolytes; avoid additional QT-prolonging drugs where possible.",
    reference: SOURCES.smpc,
  },
  {
    id: "jak_vte", a: ["tofacitinib", "baricitinib", "upadacitinib"], b: ["warfarin", "apixaban", "rivaroxaban", "dabigatran", "edoxaban", "estradiol", "ethinylestradiol"], level: "high",
    title: "JAK inhibitor with additional thrombotic risk",
    detail: "JAK inhibitors carry a dose-dependent venous thromboembolism risk, increased by other prothrombotic therapy.",
    action: "Document a thrombotic-risk assessment and the shared decision about continuing.",
    reference: SOURCES.ra2021,
  },
  {
    id: "jak_immunosuppression", a: ["tofacitinib", "baricitinib", "upadacitinib"], b: ["azathioprine", "cyclophosphamide", "mycophenolate", "tacrolimus"], level: "moderate",
    title: "JAK inhibitor with another potent immunosuppressant",
    detail: "Additive immunosuppression increases serious infection and herpes zoster risk.",
    action: "Confirm the combination is intended and document infection surveillance.",
    reference: SOURCES.ra2021,
  },
  {
    id: "dmard_narrow_index", a: ["sulfasalazine", "methotrexate"], b: ["phenytoin", "digoxin"], level: "moderate",
    title: "DMARD with a narrow-therapeutic-index drug",
    detail: "Sulfasalazine and methotrexate can alter phenytoin and digoxin availability.",
    action: "Monitor drug levels and clinical effect.",
    reference: SOURCES.smpc,
  },
];

const namesOf = (list = []) => list.map((n) => String(n || "").toLowerCase());

export function detectInteractions(drugNames = []) {
  const names = namesOf(drugNames);
  const matched = [];
  INTERACTION_RULES.forEach((rule) => {
    const hitA = names.filter((n) => rule.a.some((k) => n.indexOf(k) !== -1));
    const hitB = names.filter((n) => rule.b.some((k) => n.indexOf(k) !== -1));
    if (hitA.length && hitB.length) matched.push({ ...rule, drugs: [...new Set([...hitA, ...hitB])] });
  });
  return matched;
}

const ALLERGY_TERMS = [
  { keywords: ["nsaid", "ibuprofen", "naproxen", "diclofenac", "aspirin", "celecoxib", "etoricoxib", "mefenamic"], classes: ["nsaid"], label: "NSAID" },
  { keywords: ["sulfa", "sulphonamide", "sulfonamide", "co-trimoxazole", "cotrimoxazole"], drugs: ["sulfasalazine", "celecoxib"], label: "sulphonamide" },
  { keywords: ["methotrexate"], drugs: ["methotrexate"], label: "methotrexate" },
  { keywords: ["prednisolone", "steroid", "corticosteroid"], classes: ["glucocorticoid"], label: "corticosteroid" },
  { keywords: ["allopurinol"], drugs: ["allopurinol"], label: "allopurinol" },
  { keywords: ["codeine", "opioid", "morphine"], drugs: ["codeine", "tramadol"], label: "opioid" },
];

export function allergyConflicts(drugKeys = [], allergies = []) {
  const drugs = drugKeys.map(getDrug).filter(Boolean);
  const out = [];
  (allergies || []).forEach((a) => {
    const text = `${a.allergen || ""} ${a.reaction || ""}`.toLowerCase();
    if (!text.trim()) return;
    ALLERGY_TERMS.forEach((term) => {
      if (!term.keywords.some((k) => text.indexOf(k) !== -1)) return;
      const hits = drugs.filter((d) => (term.classes || []).indexOf(d.cls) !== -1 || (term.drugs || []).indexOf(d.key) !== -1);
      hits.forEach((d) => out.push({
        level: "high",
        title: `${d.name} with a recorded ${term.label} allergy`,
        detail: `The AMedix allergy record lists "${a.allergen}"${a.reaction ? ` with reaction: ${a.reaction}` : ""}. Patient-reported entries are confirmed by the clinician before a treatment decision.`,
        action: "Verify the allergy, record the decision and choose an alternative therapy if it is confirmed.",
        reference: "AMedix patient allergy record — clinician verification required",
      }));
    });
  });
  return out;
}