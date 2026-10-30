// Cardiology medication-safety documentation.
//
// Scope: this module structures what the prescriber documents about the
// medicines that carry the highest risk in cardiology — reconciliation,
// allergy and contraindication review, interaction review, renal dosing,
// anticoagulants, antiplatelets, antihypertensives, antiarrhythmics, statins
// and heart-failure therapy — together with the parameters that must be
// monitored. It is a documentation and advisory layer only: it does not dose,
// does not prescribe, and does not replace the prescribing clinician.
//
// No numeric threshold is quoted here that is not defined by the source named
// beside it. Where a threshold is product-label or guideline specific, the
// monitoring PARAMETER is recorded and the decision stays with the prescriber
// and the pharmacist, who verify the current label.

export const MED_SAFETY_CLASSES = [
  {
    key: "antiplatelet",
    label: "Antiplatelet therapy",
    focus: [
      "Indication and planned duration of dual therapy documented",
      "Bleeding risk assessed and documented",
      "Gastroprotection considered where bleeding risk is high",
    ],
    monitoring: ["Haemoglobin", "Bleeding signs", "Adherence"],
    sourceId: "esc_acs_2023",
  },
  {
    key: "anticoagulant",
    label: "Anticoagulant therapy",
    focus: [
      "Indication recorded (for example thromboembolic risk in atrial fibrillation, or venous thromboembolism)",
      "Agent and dose checked against renal function and age, weight and interacting drugs",
      "Bleeding risk documented with the reason for any deviation",
      "For a vitamin K antagonist, INR control documented; for a direct oral anticoagulant, adherence and renal function follow-up documented",
      "Reversal plan and the last dose before any procedure documented",
    ],
    monitoring: ["Renal function", "INR (vitamin K antagonist)", "Haemoglobin", "Bleeding signs"],
    sourceId: "acc_aha_hhs_af_2023",
  },
  {
    key: "antihypertensive",
    label: "Antihypertensive therapy",
    focus: [
      "Target blood pressure documented for this patient",
      "Postural symptoms and orthostatic drop considered",
      "Renal function and potassium rechecked after initiation or dose change",
      "Adherence and missed doses documented",
    ],
    monitoring: ["Blood pressure", "Renal function", "Potassium", "Symptoms"],
    sourceId: "esc_hypertension_2024",
  },
  {
    key: "antiarrhythmic",
    label: "Antiarrhythmic therapy",
    focus: [
      "Indication (rate or rhythm control, or ventricular arrhythmia) documented",
      "QT interval and electrolytes checked before and during therapy",
      "Proarrhythmic risk and structural heart disease considered",
      "Renal or hepatic handling considered in the dose chosen",
    ],
    monitoring: ["ECG and QTc", "Potassium and magnesium", "Renal and hepatic function"],
    sourceId: "esc_af_2024",
  },
  {
    key: "statin_lipid",
    label: "Statin and lipid-lowering therapy",
    focus: [
      "Treatment intensity matched to the documented risk category",
      "Muscle symptoms asked about and documented",
      "Interacting drugs reviewed where a dose-limited statin is used",
      "Non-statin therapy considered where the target is not reached",
    ],
    monitoring: ["Lipid profile", "Liver enzymes if symptomatic", "Muscle symptoms"],
    sourceId: "esc_ccs_2024",
  },
  {
    key: "hf_therapy",
    label: "Heart-failure therapy (the four pillars)",
    focus: [
      "Each pillar recorded as started, planned or withheld with the reason",
      "Blood pressure, renal function and potassium tolerated at the current dose",
      "Titration plan and review interval documented",
      "SGLT2 inhibitor and mineralocorticoid receptor antagonist considered where indicated",
    ],
    monitoring: ["Blood pressure", "Renal function", "Potassium", "Symptoms and weight"],
    sourceId: "esc_hf_2021",
  },
  {
    key: "diuretic",
    label: "Diuretic therapy",
    focus: [
      "Congestion findings and the response to the diuretic documented",
      "Electrolytes and renal function rechecked after intensification",
      "Over-diuresis and hypoperfusion considered",
    ],
    monitoring: ["Daily weight", "Urine output", "Renal function", "Potassium and sodium"],
    sourceId: "esc_hf_2021",
  },
  {
    key: "antianginal",
    label: "Antianginal therapy",
    focus: [
      "Symptom response documented",
      "Heart rate and blood pressure limits considered",
      "Contraindication with phosphodiesterase-5 inhibitors reviewed where relevant",
    ],
    monitoring: ["Heart rate", "Blood pressure", "Angina frequency"],
    sourceId: "esc_ccs_2024",
  },
  {
    key: "vasoactive",
    label: "Vasoactive or inotrope therapy",
    focus: [
      "Indication and the team who initiated it documented",
      "Continuous monitoring and a secure line documented",
      "Weaning plan documented",
    ],
    monitoring: ["Invasive or close blood pressure", "Heart rate and rhythm", "Perfusion and urine output"],
    sourceId: "esc_hf_2021",
  },
];

export const CLASS_BY_KEY = new Map(MED_SAFETY_CLASSES.map((c) => [c.key, c]));

export const RECONCILIATION_OPTIONS = [
  "Complete — all sources reconciled",
  "Partial — sources incomplete",
  "Not possible — patient unable to provide",
  "Not documented",
];

export const ALLERGY_REVIEW_OPTIONS = [
  "Reviewed — no known drug allergies",
  "Reviewed — allergies documented in the record",
  "Not documented",
];

export const CLASS_REVIEW_OPTIONS = [
  "Reviewed — no issue identified",
  "Issue identified — action documented",
  "Not prescribed",
  "Not reviewed",
];

export const MED_SAFETY_SPEC = {
  title: "Medication safety review",
  note: "Recorded against the patient's current medication record and allergies. This review documents the prescriber's considerations and the monitoring planned; dosing decisions follow the current product label and remain with the prescriber and pharmacist.",
  classes: MED_SAFETY_CLASSES,
};

export const emptyMedicationSafety = () => ({
  reconciliation: "",
  sources: "",
  allergy_review: "",
  contraindications: "",
  interactions: "",
  egfr: "",
  renal_review: "",
  classes: {},
  monitoring: "",
});

// Documentation gaps only. Nothing here judges whether a medicine is correct.
export const medicationSafetyGaps = (value = {}) => {
  const v = value && typeof value === "object" ? value : {};
  const gaps = [];
  const push = (level, message) => gaps.push({ level, message });

  if (!String(v.reconciliation || "").trim() || v.reconciliation === "Not documented") {
    push("warning", "Medication reconciliation is not documented for this encounter.");
  }
  if (!String(v.allergy_review || "").trim() || v.allergy_review === "Not documented") {
    push("warning", "Allergy review is not documented — check the patient record and record that it was checked.");
  }
  if (!String(v.interactions || "").trim()) {
    push("note", "No interaction review is recorded.");
  }
  Object.entries(v.classes || {}).forEach(([key, row]) => {
    const cls = CLASS_BY_KEY.get(key);
    if (!cls || !row) return;
    if (row.state === "Issue identified — action documented" && !String(row.action || "").trim()) {
      push("error", `${cls.label}: an issue was recorded without documenting the action taken.`);
    }
    if (row.state === "Not reviewed") {
      push("warning", `${cls.label} is listed as not reviewed.`);
    }
  });
  if (String(v.egfr || "").trim() && !String(v.renal_review || "").trim()) {
    push("warning", "A renal function value is recorded but no renal dose review is documented.");
  }
  if (!String(v.monitoring || "").trim()) {
    push("note", "The monitoring planned for the medicines changed in this encounter is not recorded.");
  }
  return gaps;
};

const rowLine = (cls, row) => {
  if (!row || !row.state) return "";
  const action = String(row.action || "").trim();
  return `${cls.label}: ${row.state}${action ? ` — ${action}` : ""}`;
};

export const formatMedicationSafety = (value = {}) => {
  const v = value && typeof value === "object" ? value : {};
  const out = [];
  const anyClass = Object.values(v.classes || {}).some((r) => r && r.state);
  if (
    !v.reconciliation &&
    !v.allergy_review &&
    !anyClass &&
    !v.contraindications &&
    !v.interactions &&
    !v.renal_review &&
    !v.monitoring
  ) {
    return "";
  }
  out.push("Medication safety review");
  const row = (label, val) => {
    const text = String(val || "").trim();
    if (text) out.push(`${label}: ${text}`);
  };
  row("Reconciliation", v.reconciliation);
  row("Sources checked", v.sources);
  row("Allergy review", v.allergy_review);
  row("Contraindications", v.contraindications);
  row("Interactions", v.interactions);
  row("Renal function documented", v.egfr);
  row("Renal dose review", v.renal_review);

  const lines = MED_SAFETY_CLASSES.map((c) => rowLine(c, v.classes?.[c.key])).filter(Boolean);
  if (lines.length) {
    out.push("High-alert therapy reviewed:");
    lines.forEach((l) => out.push(`   · ${l}`));
  }
  row("Monitoring planned", v.monitoring);
  out.push(
    "Documented by the treating clinician against the patient's current medication and allergy record; doses follow the current product label."
  );
  return out.join("\n");
};