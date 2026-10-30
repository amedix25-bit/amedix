// Structured documentation for the cardiology investigations whose findings
// drive treatment decisions: the 12-lead ECG, the echocardiogram and the
// laboratory panel.
//
// Why structured rather than free text: the ECG findings that change management
// (ST elevation, a new left bundle branch block, a prolonged QTc, a high-grade
// conduction block) and the echocardiographic measurements that set a treatment
// threshold (ejection fraction, valve severity, filling pressures) must be
// retrievable and comparable over time, not buried in a paragraph. Free-text
// fields remain alongside these for the narrative impression.
//
// Nothing is defaulted: every field is optional, every select carries an explicit
// "not assessed" or "not documented" answer, and a value that is not measured is
// left empty rather than filled with a normal.

const num = (key, label, unit, extra) => ({ key, label, type: "number", unit, ...extra });
const sel = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const txt = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const one = (key, label, extra) => ({ key, label, type: "input", ...extra });

const NOT_ASSESSED = "Not assessed";
const NOT_DOCUMENTED = "Not documented";

export const ECG_SPEC = {
  key: "cardio_ecg",
  title: "Structured 12-lead ECG documentation",
  note:
    "Record what the tracing shows. The interpretation stays with the clinician who read it — the machine reading is recorded separately and is never treated as the interpretation.",
  groups: [
    {
      label: "Rate, rhythm and axis",
      fields: [
        num("heart_rate", "Ventricular rate", "bpm"),
        sel("rhythm", "Rhythm", [
          "Sinus rhythm",
          "Sinus tachycardia",
          "Sinus bradycardia",
          "Atrial fibrillation",
          "Atrial flutter",
          "Supraventricular tachycardia / AVNRT",
          "Atrial tachycardia",
          "Junctional rhythm",
          "Ventricular tachycardia",
          "Ventricular fibrillation",
          "Paced rhythm",
          "Other documented rhythm",
          NOT_ASSESSED,
        ]),
        sel("axis", "QRS axis", [
          "Normal axis",
          "Left axis deviation",
          "Right axis deviation",
          "Extreme axis deviation",
          "Not interpretable",
          NOT_ASSESSED,
        ]),
        sel("p_wave", "P waves", [
          "Normal sinus P waves",
          "Absent P waves",
          "Fibrillatory baseline",
          "Flutter waves",
          "Ectopic atrial rhythm",
          "Not identifiable",
          NOT_ASSESSED,
        ]),
      ],
    },
    {
      label: "Intervals",
      fields: [
        num("pr_interval", "PR interval", "ms"),
        sel("pr_interpretation", "PR interpretation", [
          "Normal",
          "Borderline",
          "Short PR — pre-excitation suspected",
          "Prolonged — first-degree atrioventricular block",
          NOT_ASSESSED,
        ]),
        num("qrs_duration", "QRS duration", "ms"),
        num("qt_interval", "QT interval", "ms"),
        num("qtc", "QTc (rate corrected)", "ms"),
        sel("qtc_interpretation", "QTc interpretation", [
          "Normal for rate and sex",
          "Borderline prolongation",
          "Prolonged — review drugs and electrolytes",
          "Severely prolonged — immediate review required",
          "Not interpretable",
          NOT_ASSESSED,
        ]),
      ],
    },
    {
      label: "Ischaemia — ST segment and T waves",
      fields: [
        sel("st_elevation", "ST-segment elevation", [
          "None",
          "Anterior leads",
          "Inferior leads",
          "Lateral leads",
          "Posterior (reciprocal depression in V1–V3)",
          "Right ventricular leads",
          "Multiple territories",
          NOT_ASSESSED,
        ]),
        num("st_elevation_mm", "Maximum ST elevation", "mm", { step: "0.5" }),
        sel("st_depression", "ST-segment depression", [
          "None",
          "Horizontal",
          "Downsloping",
          "Upsloping",
          "Reciprocal to elevation elsewhere",
          NOT_ASSESSED,
        ]),
        one("st_depression_leads", "Leads with ST depression"),
        sel("t_wave", "T-wave abnormality", [
          "Normal",
          "Inversion",
          "Flattening",
          "Hyperacute",
          "Peaked",
          "Biphasic",
          NOT_ASSESSED,
        ]),
        sel("q_waves", "Q waves", ["None", "Anterior", "Inferior", "Lateral", "Multiple territories", NOT_ASSESSED]),
        sel("lvh_voltage", "Left ventricular hypertrophy by voltage criteria", [
          "Not present",
          "Present — Sokolow-Lyon criteria",
          "Present — Cornell criteria",
          "Present — other documented criteria",
          NOT_ASSESSED,
        ]),
      ],
    },
    {
      label: "Conduction abnormality",
      fields: [
        sel("conduction", "Conduction finding", [
          "Normal atrioventricular and intraventricular conduction",
          "First-degree atrioventricular block",
          "Second-degree atrioventricular block — Mobitz I",
          "Second-degree atrioventricular block — Mobitz II",
          "Third-degree (complete) atrioventricular block",
          "Right bundle branch block — incomplete",
          "Right bundle branch block — complete",
          "Left bundle branch block — incomplete",
          "Left bundle branch block — complete",
          "Left anterior fascicular block",
          "Bifascicular block",
          "Non-specific intraventricular conduction delay",
          "Pre-excitation (Wolff-Parkinson-White pattern)",
          "Paced rhythm",
          NOT_ASSESSED,
        ]),
        sel("conduction_new", "Is this conduction abnormality new?", [
          "New — not present on the previous tracing",
          "Known and unchanged",
          "No previous tracing available for comparison",
          "Not applicable",
        ]),
      ],
    },
    {
      label: "Comparison, source and communication",
      fields: [
        sel("comparison", "Comparison with the previous ECG", [
          "No previous tracing available",
          "Unchanged",
          "Improved",
          "New finding",
          "Worsening",
        ]),
        one("comparison_date", "Date of the comparison tracing"),
        sel("interpretation_source", "Interpretation source", [
          "Physician-interpreted",
          "Machine interpretation confirmed by a physician",
          "Machine interpretation only — physician review outstanding",
        ]),
        sel("critical_finding", "Critical ECG finding requiring immediate communication", [
          "None",
          "Yes — communicated immediately",
          "Yes — communication outstanding",
        ]),
        one("critical_communicated_to", "Communicated to — name, role and time"),
        txt("impression", "ECG impression in one or two lines"),
      ],
    },
  ],
};

export const ECHO_SPEC = {
  key: "cardio_echo",
  title: "Structured echocardiography documentation",
  note:
    "Record the measurements the report provides. A measurement that was not made is left empty — it is never entered as normal, and an unmeasured ejection fraction is never inferred from a description.",
  groups: [
    {
      label: "Left ventricle — size, wall thickness and systolic function",
      fields: [
        num("lvef", "Left ventricular ejection fraction", "%", { min: 1, max: 90 }),
        sel("lv_function", "Left ventricular systolic function", [
          "Normal",
          "Mildly reduced",
          "Moderately reduced",
          "Severely reduced",
          NOT_ASSESSED,
        ]),
        num("lvedd", "Left ventricular end-diastolic dimension", "mm"),
        num("lvesd", "Left ventricular end-systolic dimension", "mm"),
        num("ivs_thickness", "Interventricular septal thickness", "mm"),
        num("lvpw_thickness", "Left ventricular posterior wall thickness", "mm"),
      ],
    },
    {
      label: "Regional wall motion",
      fields: [
        sel("wall_motion", "Regional wall-motion abnormality", [
          "None documented",
          "Single territory",
          "Multiple territories",
          "Global impairment",
          "Not assessable",
          NOT_ASSESSED,
        ]),
        txt("wall_motion_territory", "Territory and severity — anterior, inferior, lateral, septal, apical; akinesia or hypokinesia"),
        sel("wall_motion_change", "Change from the previous study", [
          "Not applicable — no previous study",
          "Unchanged",
          "New abnormality",
          "Improved",
          "Worsened",
        ]),
      ],
    },
    {
      label: "Other chambers and filling",
      fields: [
        num("la_volume_index", "Left atrial volume index", "mL/m²"),
        sel("la_size", "Left atrial size", ["Normal", "Mildly dilated", "Moderately dilated", "Severely dilated", NOT_ASSESSED]),
        sel("rv_size", "Right ventricular size", ["Normal", "Mildly dilated", "Moderately dilated", "Severely dilated", NOT_ASSESSED]),
        sel("rv_function", "Right ventricular systolic function", ["Normal", "Mildly reduced", "Moderately reduced", "Severely reduced", NOT_ASSESSED]),
        sel("diastolic_function", "Diastolic function", [
          "Normal filling pressures",
          "Grade I — impaired relaxation",
          "Grade II — pseudonormal",
          "Grade III — restrictive",
          "Not interpretable",
          NOT_ASSESSED,
        ]),
        num("pasp", "Estimated pulmonary artery systolic pressure", "mmHg"),
      ],
    },
    {
      label: "Valves",
      fields: [
        sel("mitral_stenosis", "Mitral stenosis", ["None", "Mild", "Moderate", "Severe", NOT_ASSESSED]),
        sel("mitral_regurgitation", "Mitral regurgitation", ["None", "Mild", "Moderate", "Severe", NOT_ASSESSED]),
        sel("aortic_stenosis", "Aortic stenosis", ["None", "Mild", "Moderate", "Severe", "Low-flow low-gradient", NOT_ASSESSED]),
        sel("aortic_regurgitation", "Aortic regurgitation", ["None", "Mild", "Moderate", "Severe", NOT_ASSESSED]),
        sel("tricuspid_regurgitation", "Tricuspid regurgitation", ["None", "Mild", "Moderate", "Severe", NOT_ASSESSED]),
        sel("pulmonary_regurgitation", "Pulmonary regurgitation", ["None", "Mild", "Moderate", "Severe", NOT_ASSESSED]),
        sel("prosthetic_valve", "Prosthetic valve", ["None", "Aortic", "Mitral", "Tricuspid", "Pulmonary"]),
        sel("prosthetic_dysfunction", "Prosthetic valve dysfunction", [
          "Not applicable",
          "Normal function",
          "Significant stenosis",
          "Significant regurgitation",
          "Thrombus suspected",
          "Not assessable",
        ]),
      ],
    },
    {
      label: "Structure, pericardium and study quality",
      fields: [
        sel("structural_abnormality", "Structural abnormality", [
          "None documented",
          "Patent foramen ovale",
          "Atrial septal defect",
          "Ventricular septal defect",
          "Left ventricular thrombus",
          "Cardiac mass or tumour",
          "Left ventricular hypertrophy",
          "Asymmetric septal hypertrophy",
          "Other documented abnormality",
          NOT_ASSESSED,
        ]),
        sel("pericardial_effusion", "Pericardial effusion", [
          "None",
          "Small",
          "Moderate",
          "Large",
          "Tamponade physiology documented",
          NOT_ASSESSED,
        ]),
        sel("study_quality", "Study quality", ["Adequate", "Limited — documented reason", "Non-diagnostic"]),
        txt("echo_limitations", "Limitations affecting interpretation"),
        txt("echo_impression", "Echocardiography impression"),
      ],
    },
  ],
};

export const LABS_SPEC = {
  key: "cardio_labs",
  title: "Structured laboratory documentation and trends",
  note:
    "Record the values with their timing. A trend is only stated where at least two timed values exist, and a value outside the reference range is flagged rather than smoothed into a narrative.",
  groups: [
    {
      label: "Serial high-sensitivity troponin",
      fields: [
        one("troponin_assay", "Assay and upper reference limit used"),
        one("troponin_1_time", "Sample 1 — time"),
        num("troponin_1", "Sample 1 value", "ng/L"),
        one("troponin_2_time", "Sample 2 — time"),
        num("troponin_2", "Sample 2 value", "ng/L"),
        one("troponin_3_time", "Sample 3 — time"),
        num("troponin_3", "Sample 3 value", "ng/L"),
        sel("troponin_pattern", "Serial pattern", [
          "Not applicable — single sample",
          "Flat — no significant change",
          "Rising — significant delta documented",
          "Falling — significant delta documented",
          "Indeterminate — timing does not allow interpretation",
        ]),
      ],
    },
    {
      label: "Cardiac biomarkers and renal function",
      fields: [
        num("nt_probnp", "NT-proBNP", "pg/mL"),
        num("bnp", "BNP", "pg/mL"),
        num("creatinine", "Creatinine", "µmol/L"),
        num("egfr", "Estimated glomerular filtration rate", "mL/min/1.73 m²"),
        sel("renal_trend", "Renal function trend since the previous result", [
          "No previous result available",
          "Stable",
          "Improving",
          "Deteriorating — significant change",
        ]),
      ],
    },
    {
      label: "Electrolytes and haematology",
      fields: [
        num("potassium", "Potassium", "mmol/L", { step: "0.1" }),
        num("sodium", "Sodium", "mmol/L"),
        num("magnesium", "Magnesium", "mmol/L", { step: "0.01" }),
        num("haemoglobin", "Haemoglobin", "g/dL", { step: "0.1" }),
        num("white_cell_count", "White cell count", "×10⁹/L", { step: "0.1" }),
        num("platelets", "Platelet count", "×10⁹/L"),
        sel("electrolyte_flag", "Potassium or magnesium outside the range that allows safe heart-failure or antiarrhythmic therapy", [
          "No — within range",
          "Yes — therapy adjusted and documented",
          "Yes — not yet addressed",
          NOT_ASSESSED,
        ]),
      ],
    },
    {
      label: "Lipids and glycaemia",
      fields: [
        num("ldl", "LDL cholesterol", "mmol/L", { step: "0.01" }),
        num("hdl", "HDL cholesterol", "mmol/L", { step: "0.01" }),
        num("triglycerides", "Triglycerides", "mmol/L", { step: "0.01" }),
        num("total_cholesterol", "Total cholesterol", "mmol/L", { step: "0.01" }),
        num("hba1c", "HbA1c", "%", { step: "0.1" }),
        num("fasting_glucose", "Fasting glucose", "mmol/L", { step: "0.1" }),
      ],
    },
    {
      label: "Review of abnormal and critical results",
      fields: [
        sel("critical_result", "Critical result requiring immediate action", [
          "None identified",
          "Yes — acted on and documented",
          "Yes — action outstanding",
        ]),
        txt("critical_result_detail", "Critical result, action taken and who was informed"),
        txt("trend_review", "Investigation trends reviewed — what changed, in which direction, and what it means for the plan"),
        sel("results_reviewed", "Results reviewed and acknowledged by", [
          "Reviewing clinician — this note",
          "Review outstanding — flagged for the responsible clinician",
        ]),
      ],
    },
  ],
};

export const INVESTIGATION_SPECS = {
  cardio_ecg: ECG_SPEC,
  cardio_echo: ECHO_SPEC,
  cardio_labs: LABS_SPEC,
};

export const getInvestigationSpec = (type) => INVESTIGATION_SPECS[type] || null;

// Readable text stored with the note and printed in the PDF. Only documented
// values are printed — an empty field produces no line at all.
export function formatCardiologyStructured(type, value) {
  const spec = getInvestigationSpec(type);
  if (!spec || !value || typeof value !== "object") return "";
  const lines = [];
  spec.groups.forEach((group) => {
    const rows = group.fields
      .filter((f) => String(value[f.key] ?? "").trim() !== "")
      .map((f) => {
        const raw = String(value[f.key]).trim();
        return `   · ${f.label}: ${raw}${f.unit ? ` ${f.unit}` : ""}`;
      });
    if (rows.length) lines.push(group.label, ...rows);
  });
  if (!lines.length) return "";
  return `${spec.title}\n${lines.join("\n")}`;
}