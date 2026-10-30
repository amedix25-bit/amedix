// Neurosurgical clinical scores and classifications.
//
// RULES — identical to how the rest of AMedix treats validated instruments:
//   1. NOTHING IS FABRICATED. A score is calculated only from the values entered
//      against it in this note. If a variable is missing the score is NOT
//      calculated and NOT estimated from a default; the panel names what is
//      missing.
//   2. Every result carries its variables and points, its interpretation, its
//      LIMITATIONS and the publication that defines it, so the number in the
//      record can be audited.
//   3. Scores are offered for the conditions they were developed in. A score is
//      never applied outside its population and never makes a decision.
//
// Scores already recorded as note fields (GCS, WFNS, modified Fisher, Karnofsky
// band) are not duplicated here.

const pick = (key, label, options, extra) => ({ key, label, short: label, type: "select", options, ...extra });
const opt = (value, points) => ({ value, points });

const isSet = (v) => String(v ?? "").trim() !== "";
const asNum = (v) => Number(v);
const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI"];

const sumVariables = (def, vars = {}) => {
  let total = 0;
  const items = [];
  const missing = [];
  def.variables.forEach((v) => {
    const raw = vars[v.key];
    if (!isSet(raw)) {
      missing.push(v.label);
      return;
    }
    if (v.options) {
      const chosen = v.options.find((o) => o.value === raw);
      const points = chosen?.points ?? 0;
      total += points;
      items.push({ label: v.short || v.label, points });
      return;
    }
    const points = asNum(raw);
    total += points;
    items.push({ label: `${v.short || v.label} ${raw}${v.unit ? ` ${v.unit}` : ""}`, points });
  });
  return { total, items, missing };
};

const byMax = (total, bands) => bands.find((b) => b.max === undefined || total <= b.max) || bands[bands.length - 1];

// ---- 1. Hunt and Hess -----------------------------------------------------
const HUNT_HESS = {
  key: "hunt_hess",
  short: "Hunt & Hess",
  name: "Hunt and Hess grade",
  purpose: "Clinical grade of a patient with subarachnoid haemorrhage at presentation, used to describe the state at that moment.",
  population: "Adults with subarachnoid haemorrhage",
  appliesWhen: "A subarachnoid haemorrhage is documented or suspected.",
  max: 5,
  variables: [
    pick("grade", "Grade documented at presentation", [
      opt("I — Asymptomatic, or mild headache and slight nuchal rigidity", 1),
      opt("II — Moderate to severe headache, nuchal rigidity, no deficit other than cranial nerve palsy", 2),
      opt("III — Drowsiness, confusion, or mild focal deficit", 3),
      opt("IV — Stupor, moderate to severe hemiparesis, possible early decerebrate rigidity", 4),
      opt("V — Deep coma, decerebrate rigidity, moribund appearance", 5),
    ]),
  ],
  interpret: (total) => ({
    label: `Grade ${ROMAN[total] || total}`,
    tone: total <= 2 ? "success" : total === 3 ? "warning" : "critical",
    note:
      "The grade records the clinical state at the time it was assigned — it is not a treatment decision, and a grade recorded on admission is not carried forward as the current state.",
  }),
  limitations: [
    "A clinical grading of the state at one moment: it changes with the patient and must be re-documented, not carried forward.",
    "Interobserver agreement is moderate; the WFNS scale is an alternative and both are recorded only if both were actually assigned.",
    "Does not account for age, comorbidity, aneurysm anatomy or rebleed risk, and does not determine the treatment.",
  ],
  source: {
    organization: "Hunt & Hess, Journal of Neurosurgery",
    title: "Surgical risk as related to time of intervention in the repair of intracranial aneurysms",
    version: "1968",
    url: "https://thejns.org",
  },
};

// ---- 2. Spetzler–Martin ---------------------------------------------------
const SPETZLER_MARTIN = {
  key: "spetzler_martin",
  short: "Spetzler–Martin",
  name: "Spetzler–Martin AVM grade",
  purpose: "Anatomical grading of an arteriovenous malformation from its size, eloquence of adjacent brain and venous drainage.",
  population: "Patients with an arteriovenous malformation",
  appliesWhen: "An arteriovenous malformation is documented.",
  max: 5,
  variables: [
    pick("size", "Maximum nidus size", [
      opt("Small — under 3 cm", 1),
      opt("Medium — 3 to 6 cm", 2),
      opt("Large — over 6 cm", 3),
    ]),
    pick("eloquence", "Eloquence of adjacent brain", [
      opt("Non-eloquent", 0),
      opt("Eloquent — sensorimotor, language or visual cortex, hypothalamus, thalamus, brainstem, cerebellar peduncles, deep nuclei", 1),
    ]),
    pick("drainage", "Venous drainage", [opt("Superficial only", 0), opt("Deep", 1)]),
  ],
  interpret: (total) => ({
    label: `Grade ${ROMAN[total] || total}`,
    tone: total <= 2 ? "success" : total === 3 ? "warning" : "critical",
    note:
      "The grade describes the anatomical difficulty of open resection. It is not a rupture-risk estimate and it does not by itself select surgery, embolisation, radiosurgery or observation.",
  }),
  limitations: [
    "Predicts surgical morbidity, not the natural history: an unruptured low-grade AVM is not thereby an indication for surgery.",
    "Requires the size, eloquence and drainage to be documented from imaging reviewed by the treating team.",
    "Radiosurgery outcomes are described by different scales; do not use this grade to predict radiosurgical results.",
    "Paediatric and posterior fossa lesions may behave differently from the adult supratentorial cohort the grade was described in.",
  ],
  source: {
    organization: "Spetzler & Martin, Journal of Neurosurgery",
    title: "A proposed grading system for arteriovenous malformations",
    version: "1986",
    url: "https://thejns.org",
  },
};

// ---- 3. Rotterdam CT score ------------------------------------------------
const ROTTERDAM = {
  key: "rotterdam_ct",
  short: "Rotterdam CT",
  name: "Rotterdam CT score",
  purpose: "Describes the cranial CT findings after traumatic brain injury on a 1–6 scale.",
  population: "Adults with moderate to severe traumatic brain injury",
  appliesWhen: "A cranial CT after head injury has been reviewed.",
  max: 6,
  variables: [
    pick("cisterns", "Basal cisterns", [opt("Normal", 0), opt("Compressed", 1), opt("Absent", 2)]),
    pick("shift", "Midline shift", [opt("5 mm or less", 0), opt("More than 5 mm", 1)]),
    pick("epidural", "Epidural mass lesion", [opt("Absent", 0), opt("Present", 1)]),
    pick("sah", "Traumatic subarachnoid haemorrhage or intraventricular blood", [opt("Absent", 0), opt("Present", 1)]),
  ],
  interpret: (total) => ({
    label: `Score ${total} of 6`,
    tone: total <= 2 ? "success" : total <= 4 ? "warning" : "critical",
    note:
      "Higher scores were associated with higher six-month mortality in the derivation cohort (from around 0% at score 1 to around 60% at score 6). It describes the scan; it does not decide treatment.",
  }),
  limitations: [
    "A prognostic model validated at cohort level — it does not predict an individual patient's outcome and must not be used to justify or withhold treatment.",
    "Derived in adults with moderate to severe traumatic brain injury; it is not validated for children.",
    "Describes the CT at one time point and must be recalculated after a repeat scan, not carried forward.",
    "Requires the cisterns, shift and haemorrhage pattern to be documented from the images reviewed.",
  ],
  source: {
    organization: "Maas et al., Neurosurgery",
    title: "Prediction of outcome in traumatic brain injury with computed tomographic characteristics",
    version: "2005",
    url: "https://journals.lww.com/neurosurgery",
  },
};

// ---- 4. Nurick grade ------------------------------------------------------
const NURICK = {
  key: "nurick",
  short: "Nurick",
  name: "Nurick grade",
  purpose: "Functional grade of gait in cervical spondylotic myelopathy.",
  population: "Adults with cervical myelopathy",
  appliesWhen: "Cervical myelopathy is documented.",
  max: 5,
  variables: [
    pick("grade", "Grade as documented", [
      opt("0 — Signs or symptoms of cord involvement, no difficulty walking", 0),
      opt("1 — Signs of cord involvement, normal gait", 1),
      opt("2 — Mild gait difficulty not preventing employment", 2),
      opt("3 — Gait difficulty preventing employment or full-time activities, unsteady", 3),
      opt("4 — Walks only with assistance", 4),
      opt("5 — Chairbound or bedridden", 5),
    ]),
  ],
  interpret: (total) => ({
    label: `Grade ${total}`,
    tone: total <= 1 ? "success" : total <= 3 ? "warning" : "critical",
    note: "A functional grade of walking ability at the time of examination; it does not measure arm function or sphincter involvement.",
  }),
  limitations: [
    "Captures gait only — upper limb function, sensory loss and sphincter involvement are not reflected.",
    "A single functional snapshot; it is not an outcome prediction and does not by itself indicate surgery.",
    "Interobserver variation is documented; record the grade against the current examination, not an earlier note.",
  ],
  source: {
    organization: "Nurick, Brain",
    title: "The pathogenesis of the spinal cord disorder associated with cervical spondylosis",
    version: "1972",
    url: "https://academic.oup.com/brain",
  },
};

// ---- 5. Modified Japanese Orthopaedic Association score -------------------
const MJOA = {
  key: "mj_joa",
  short: "mJOA",
  name: "Modified Japanese Orthopaedic Association score",
  purpose: "Severity of cervical myelopathy across motor, sensory and sphincter function.",
  population: "Adults with cervical spondylotic myelopathy",
  appliesWhen: "Cervical myelopathy is documented.",
  max: 18,
  variables: [
    pick("upper", "Upper limb motor function", [
      opt("5 — Able to feed with chopsticks or spoon and button clothes", 5),
      opt("4 — Able to feed with spoon but not chopsticks, and unable to button", 4),
      opt("3 — Unable to feed with spoon, able to use fork", 3),
      opt("2 — Unable to use knife and fork, able to use spoon", 2),
      opt("1 — Unable to use hands", 1),
      opt("0 — Unable to move hands", 0),
    ]),
    pick("lower", "Lower limb motor function", [
      opt("7 — Able to walk normally", 7),
      opt("6 — Able to walk with slight difficulty", 6),
      opt("5 — Able to walk without assistance but with difficulty", 5),
      opt("4 — Able to walk with a cane or aid on flat ground", 4),
      opt("3 — Able to walk with a cane or aid only on stairs", 3),
      opt("2 — Able to walk only with a walker or frame", 2),
      opt("1 — Able to walk only with assistance", 1),
      opt("0 — Unable to walk", 0),
    ]),
    pick("sensory", "Sensory function of the upper extremity", [
      opt("3 — Normal", 3),
      opt("2 — Mild sensory loss", 2),
      opt("1 — Appreciable sensory loss", 1),
      opt("0 — Loss of sensation", 0),
    ]),
    pick("sphincter", "Sphincter function", [
      opt("3 — Normal", 3),
      opt("2 — Mild dysfunction (hesitancy or urgency)", 2),
      opt("1 — Severe dysfunction (retention or incontinence)", 1),
      opt("0 — Unable to void voluntarily", 0),
    ]),
  ],
  interpret: (total) => {
    const band =
      total >= 15
        ? { label: "Mild", tone: "success" }
        : total >= 12
          ? { label: "Moderate", tone: "warning" }
          : { label: "Severe", tone: "critical" };
    return {
      label: `${total} of 18 — ${band.label}`,
      tone: band.tone,
      note:
        "The severity bands above are the commonly reported ones; confirm the bands against the version used locally. The score describes severity, it does not indicate surgery.",
    };
  },
  limitations: [
    "There are several mJOA versions (18-point and 17-point); this one is the 18-point version and a score is only comparable within the same version.",
    "Designed and validated for cervical spondylotic myelopathy — not for lumbar disease, trauma or tumour.",
    "A total of 18 is normal; a normal total does not exclude myelopathy documented on examination and imaging.",
    "Scores before and after surgery are only comparable when recorded with the same version by the same observer group.",
  ],
  source: {
    organization: "Benzel et al., Journal of Spinal Disorders",
    title: "Cervical laminectomy and dentate ligament section for cervical spondylotic myelopathy",
    version: "1991",
    url: "https://journals.lww.com/jspinaldisord",
  },
};

// ---- 6. House–Brackmann --------------------------------------------------
const HOUSE_BRACKMANN = {
  key: "house_brackmann",
  short: "House–Brackmann",
  name: "House–Brackmann facial nerve grade",
  purpose: "Grades facial nerve function after facial nerve injury or surgery near the nerve.",
  population: "Patients with facial nerve palsy or after vestibular schwannoma surgery",
  appliesWhen: "Facial nerve function is documented.",
  max: 6,
  variables: [
    pick("grade", "Grade as documented", [
      opt("I — Normal", 1),
      opt("II — Slight dysfunction: slight weakness on close inspection, normal symmetry and tone", 2),
      opt("III — Moderate dysfunction: obvious but not disfiguring weakness, complete eye closure with effort", 3),
      opt("IV — Moderately severe: obvious weakness and disfiguring asymmetry, incomplete eye closure", 4),
      opt("V — Severe: only barely perceptible motion, incomplete eye closure, asymmetry at rest", 5),
      opt("VI — Total paralysis", 6),
    ]),
  ],
  interpret: (total) => ({
    label: `Grade ${ROMAN[total] || total}`,
    tone: total <= 2 ? "success" : total <= 4 ? "warning" : "critical",
    note:
      "Records facial nerve function at the time of examination. Where eye closure is incomplete, the eye-care plan is documented separately.",
  }),
  limitations: [
    "A gross six-point scale with recognised interobserver variability and limited sensitivity to synkinesis; where finer grading is needed, the institution's own instrument is recorded.",
    "Not a measure of hearing, taste or other cranial nerve function after skull base surgery.",
    "A grade recorded before surgery is not comparable with one recorded after it unless both were assigned with the same scale by the same observer group.",
  ],
  source: {
    organization: "House & Brackmann, Otolaryngology–Head and Neck Surgery",
    title: "Facial nerve grading system",
    version: "1985",
    url: "https://journals.sagepub.com/home/oto",
  },
};

// ---- 7. Modified Rankin Scale -------------------------------------------
const MODIFIED_RANKIN = {
  key: "modified_rankin",
  short: "mRS",
  name: "Modified Rankin Scale",
  purpose: "Global disability after a neurological event, recorded at a defined time point.",
  population: "Adults after stroke, subarachnoid haemorrhage or neurosurgery",
  appliesWhen: "Neurological outcome is being recorded at discharge or follow-up.",
  max: 6,
  variables: [
    pick("grade", "Grade as documented", [
      opt("0 — No symptoms at all", 0),
      opt("1 — No significant disability despite symptoms; able to carry out all usual duties", 1),
      opt("2 — Slight disability; unable to carry out all previous activities but independent", 2),
      opt("3 — Moderate disability; requires some help but walks without assistance", 3),
      opt("4 — Moderately severe disability; unable to walk without assistance and unable to attend to own bodily needs without assistance", 4),
      opt("5 — Severe disability; bedridden, incontinent, requiring constant nursing care", 5),
      opt("6 — Death", 6),
    ]),
  ],
  interpret: (total) => ({
    label: total === 6 ? "Grade 6 — death" : `Grade ${total}`,
    tone: total <= 2 ? "success" : total <= 4 ? "warning" : "critical",
    note: "An outcome measure at a stated time point; it is not an acute severity score and must record when it was assessed.",
  }),
  limitations: [
    "An outcome measure, not an acute decision tool — record the time point (discharge, 30 days, 90 days) with the grade.",
    "Recognised interobserver variability and a ceiling/floor effect; the structured interview or the mRS-9Q improves agreement.",
    "Mortality (grade 6) must be recorded as death, never inferred from a missing follow-up.",
  ],
  source: {
    organization: "van Swieten et al., Stroke",
    title: "Interobserver agreement for the assessment of handicap in stroke patients",
    version: "1988",
    url: "https://www.ahajournals.org/journal/str",
  },
};

export const NSG_SCORES = [
  HUNT_HESS,
  SPETZLER_MARTIN,
  ROTTERDAM,
  NURICK,
  MJOA,
  HOUSE_BRACKMANN,
  MODIFIED_RANKIN,
];

export const NSG_SCORE_BY_KEY = (key) => NSG_SCORES.find((s) => s.key === key) || null;

const read = (values, key) => String(values?.[key] ?? "");

// Which scores the documented findings make relevant. Only a signal that the
// condition is documented in THIS note counts — a score is never surfaced
// because it happens to exist.
export const indicatedScores = (values = {}) => {
  const blob = [
    "vascular_study",
    "differential",
    "formulation",
    "presenting_features",
    "deficit",
    "surgical_indication",
    "imaging_detail",
    "diagnosis_summary",
    "lesion_type",
  ]
    .map((k) => read(values, k))
    .join(" ")
    .toLowerCase();

  const out = [];
  if (/avm|arteriovenous/.test(blob) || /avm/i.test(read(values, "lesion_type"))) out.push("spetzler_martin");
  if (/subarachnoid|aneurysm/.test(blob) || read(values, "wfns")) out.push("hunt_hess");
  if (read(values, "cranial_ct")) out.push("rotterdam_ct");
  if (/myelopath|cord compression|cervical spondyl/.test(blob)) out.push("nurick", "mj_joa");
  if (/facial nerve|vii palsy|facial palsy/.test(blob) || /facial/i.test(read(values, "nerve_involved"))) {
    out.push("house_brackmann");
  }
  if (read(values, "functional_status") || /outcome|discharge planning/i.test(blob)) out.push("modified_rankin");
  return [...new Set(out)];
};

export const calculateScore = (key, vars = {}) => {
  const def = NSG_SCORE_BY_KEY(key);
  if (!def) return null;
  const { total, items, missing } = sumVariables(def, vars);
  if (missing.length) return { missing, items, total: null };
  const band = def.interpret(total);
  return { total, items, missing: [], band, display: `${band.label}` };
};

export const formatNeurosurgeryScores = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return String(value || "");
  const entries = value.entries && typeof value.entries === "object" ? value.entries : {};
  const keys = Object.keys(entries);
  const lines = [];
  keys.forEach((key) => {
    const def = NSG_SCORE_BY_KEY(key);
    if (!def) return;
    const vars = entries[key] || {};
    const result = calculateScore(key, vars);
    lines.push(`${def.name} — ${def.population}`);
    def.variables.forEach((v) => lines.push(`  ${v.label}: ${vars[v.key] || "not documented"}`));
    if (result?.missing?.length) {
      lines.push(`  Not calculated — missing: ${result.missing.join(", ")}. No value is estimated.`);
    } else if (result) {
      lines.push(`  Result: ${result.total}${def.max ? ` of ${def.max}` : ""} — ${result.band.label}`);
      lines.push(`  Interpretation: ${result.band.note}`);
    }
    def.limitations.forEach((l) => lines.push(`  Limitation: ${l}`));
    lines.push(`  Source: ${def.source.organization} — ${def.source.title}, ${def.source.version}`);
  });
  if (String(value.clinical_use || "").trim()) {
    lines.push(`How the score informed the decision: ${String(value.clinical_use).trim()}`);
  }
  if (!keys.length) return "";
  lines.push("A score supports a decision; it never makes it.");
  return lines.join("\n");
};