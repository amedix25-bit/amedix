// Clinical decision support for the Nephrology notes.
//
// Two rules govern everything below:
//   1. A prompt fires ONLY from a value the clinician documented, at a
//      threshold that is stated in the prompt itself with the guidance it
//      comes from. Nothing is inferred, estimated or averaged.
//   2. A prompt never diagnoses, prescribes, stops a drug or orders a test,
//      and never replaces clinical judgement. A prompt that does NOT fire is
//      not reassurance — the note says so explicitly.
//
// Thresholds used (all published):
//   - Hyperkalaemia: > 5.5 mmol/L is significant and needs same-day review;
//     ≥ 6.5 mmol/L is severe and needs emergency treatment (KDIGO guidance on
//     potassium in CKD; standard emergency practice).
//   - Metabolic acidosis: bicarbonate < 18 mmol/L is significant; < 12 mmol/L
//     is severe (KDIGO 2024 CKD guideline recommends treating acidosis).
//   - Oliguria: < 400 mL/24 h. AKI stage 3: KDIGO 2012 staging.
//   - Rapid progression: eGFR decline > 5 mL/min/1.73 m² per year, or a
//     documented rapid decline (KDIGO 2024 CKD guideline).
//   - eGFR < 30 mL/min/1.73 m² and G4/G5: nephrology referral (KDIGO 2024).
//   - Albuminuria A3 / UACR ≥ 30 mg/mmol: intensify kidney-protective therapy
//     (KDIGO 2024).

const num = (v) => {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const BLOCKED_STATUS = /pending|unavailable|not done|reported by/i;

// Reads a documented renal-laboratory value. A pending, unavailable or
// patient-reported row is never treated as a measured result.
const lab = (values, analyte) => {
  const rows = Array.isArray(values?.renal_labs_serum) ? values.renal_labs_serum : [];
  const row = rows.find((r) => r && r.analyte === analyte);
  if (!row || BLOCKED_STATUS.test(String(row.status || ""))) return null;
  const value = num(row.value);
  return value === null ? null : { value, units: row.units || "", date: row.specimen_date || "" };
};

const has = (v, ...list) => list.includes(v);

export const NEPH_ALERT_KEYS = ["urgent", "routine"];

export function buildNephAlerts(values = {}) {
  const alerts = [];
  const add = (key, level, label, basis) => alerts.push({ key, level, label, basis });

  const potassium = lab(values, "potassium");
  if (potassium) {
    if (potassium.value >= 6.5)
      add(
        "hyperkalaemia_severe",
        "urgent",
        `Potassium ${potassium.value} mmol/L — severe hyperkalaemia. Emergency assessment: ECG, cardiac monitoring and immediate treatment; do not delay for a repeat sample.`,
        "Threshold ≥ 6.5 mmol/L. Severe hyperkalaemia is a medical emergency; agents that raise potassium may need to be stopped at once (KDIGO guidance on potassium in CKD)."
      );
    else if (potassium.value > 5.5)
      add(
        "hyperkalaemia_significant",
        "urgent",
        `Potassium ${potassium.value} mmol/L — significant hyperkalaemia. Same-day review: repeat the sample, review potassium-raising agents and dietary potassium.`,
        "Threshold > 5.5 mmol/L (KDIGO guidance on potassium in CKD)."
      );
  }

  const bicarbonate = lab(values, "bicarbonate");
  if (bicarbonate) {
    if (bicarbonate.value < 12)
      add(
        "acidosis_severe",
        "urgent",
        `Bicarbonate ${bicarbonate.value} mmol/L — severe metabolic acidosis. Urgent assessment and treatment; check pH, potassium and the anion gap.`,
        "Threshold < 12 mmol/L."
      );
    else if (bicarbonate.value < 18)
      add(
        "acidosis_significant",
        "routine",
        `Bicarbonate ${bicarbonate.value} mmol/L — metabolic acidosis. Treat and recheck; review progression of CKD.`,
        "Threshold < 18 mmol/L (KDIGO 2024 CKD guideline recommends treating metabolic acidosis)."
      );
  }

  if (values.pulmonary_congestion === "Pulmonary oedema")
    add(
      "pulmonary_oedema",
      "urgent",
      "Pulmonary oedema documented — fluid overload requiring same-day assessment, oxygen and urgent volume management.",
      "Documented finding in this note. Volume overload with pulmonary oedema is an emergency indication for urgent assessment."
    );
  else if (values.pulmonary_congestion === "Crackles to mid-zones")
    add(
      "fluid_overload",
      "urgent",
      "Crackles to the mid-zones — significant fluid overload. Same-day review of volume status, diuretic and ultrafiltration plan.",
      "Documented finding in this note."
    );

  const urine = num(values.urine_output_24h) ?? num(values.urine_output);
  if (urine !== null && urine < 400)
    add(
      "oliguria",
      "urgent",
      `Documented urine output ${urine} mL — oliguria. Assess for obstruction, volume depletion and nephrotoxins the same day.`,
      "Threshold < 400 mL/24 h."
    );

  if (values.aki_stage === "Stage 3")
    add(
      "aki_stage3",
      "urgent",
      "KDIGO AKI stage 3 documented — urgent nephrology review; assess indications for kidney replacement therapy and the complications of severe AKI.",
      "KDIGO 2012 AKI staging."
    );
  else if (values.aki_stage === "Stage 2")
    add(
      "aki_stage2",
      "routine",
      "KDIGO AKI stage 2 documented — daily creatinine and urine output until improving; review all nephrotoxins.",
      "KDIGO 2012 AKI staging."
    );

  if (values.egfr_trend === "Rapid decline" || String(values.progression_rate || "").startsWith("> 5"))
    add(
      "rapid_progression",
      "urgent",
      "Rapidly declining kidney function documented — urgent nephrology review to look for a reversible cause, active glomerular disease or obstruction.",
      "Threshold: eGFR decline > 5 mL/min/1.73 m² per year, or a documented rapid decline (KDIGO 2024 CKD guideline)."
    );

  const obstruction =
    has(values.obstruction_risk, "Features present — see detail") ||
    has(values.obstruction_severity, "Complete", "Complete with infection") ||
    has(values.hydronephrosis, "Severe") ||
    has(values.infection_risk, "Present — emergency drainage required");
  if (obstruction)
    add(
      "obstruction",
      "urgent",
      "Suspected or documented obstruction — urgent urology assessment; an infected obstructed system requires emergency drainage.",
      "Documented finding in this note. Obstruction with infection or with AKI is an emergency."
    );

  if (has(values.access_assessment, "Signs of infection — see detail") || has(values.access_infection, "Discharge", "Abscess", "Systemic features"))
    add(
      "access_infection",
      "urgent",
      "Dialysis access infection documented — same-day access service review; catheter-related infection can progress to sepsis.",
      "Documented finding in this note."
    );
  if (has(values.access_assessment, "Thrill absent", "Bruit absent") || has(values.access_complication, "Thrombosis", "Catheter malfunction") || values.maturation_status === "Thrombosed")
    add(
      "access_failure",
      "urgent",
      "Dialysis access dysfunction — same-day vascular access review; dialysis cannot be delivered reliably and urgent intervention may be needed.",
      "Documented finding in this note."
    );

  if (values.complication_severity === "Severe — session stopped")
    add(
      "dialysis_complication",
      "urgent",
      "Severe intradialytic complication with the session stopped — assess and document the cause, and review the prescription before the next session.",
      "Documented finding in this note."
    );

  if (values.transplant_status === "Transplant with declining function" || values.creatinine_trend === "Rising — see detail")
    add(
      "transplant_decline",
      "urgent",
      "Declining transplant function — contact the transplant centre for same-day advice; consider rejection, drug toxicity, BK virus, obstruction and infection.",
      "Documented finding in this note."
    );

  if (values.volume_status === "Hypovolaemic")
    add(
      "hypovolaemia",
      "urgent",
      "Clinically significant volume depletion documented — assess perfusion and kidney function today, and review diuretics, RAS inhibitors and nephrotoxins.",
      "Documented finding in this note."
    );

  const nephrotoxin = values.nephrotoxic_exposure;
  if (nephrotoxin && !has(nephrotoxin, "None identified", "Not assessed") && ["Stage 1", "Stage 2", "Stage 3"].includes(values.aki_stage))
    add(
      "nephrotoxin",
      "routine",
      `Nephrotoxic exposure documented (${nephrotoxin}) alongside acute kidney injury — review whether it can be stopped or substituted, and record the decision.`,
      "KDIGO 2012 AKI guideline: remove or adjust nephrotoxic agents where possible."
    );

  const egfrLab = lab(values, "egfr");
  const egfr = egfrLab ? egfrLab.value : num(values.egfr_current) ?? num(values.kdigo?.egfr);
  if (egfr !== null && egfr > 0 && egfr < 30)
    add(
      "egfr_below_30",
      "routine",
      `eGFR ${egfr} mL/min/1.73 m² — nephrology referral and preparation for kidney replacement therapy (education, access planning, transplant assessment).`,
      "KDIGO 2024 CKD guideline: refer people with eGFR < 30 mL/min/1.73 m²."
    );
  if (has(values.ckd_g_category, "G4", "G5"))
    add(
      "ckd_g4_g5",
      "routine",
      "CKD G4/G5 documented — confirm nephrology follow-up, kidney replacement therapy education and cardiovascular risk management.",
      "KDIGO 2024 CKD guideline."
    );

  const uacrLab = lab(values, "uacr");
  const uacr = uacrLab ? uacrLab.value : num(values.kdigo?.uacr);
  if (values.albuminuria_category === "A3" || (uacr !== null && uacr >= 30))
    add(
      "albuminuria_a3",
      "routine",
      "Severely increased albuminuria (A3) — review RAS inhibitor at the maximally tolerated dose, SGLT2 inhibitor and blood pressure control.",
      "KDIGO 2024 CKD guideline: UACR ≥ 30 mg/mmol (A3) is high risk and warrants intensified kidney-protective therapy."
    );

  if (String(values.anaemia_status || "").startsWith("Present"))
    add(
      "anaemia",
      "routine",
      "Anaemia of CKD documented — investigate iron status and treat, with the haemoglobin target documented in the plan.",
      "KDIGO anaemia in CKD guidance."
    );
  if (values.ckd_mbd_status && !has(values.ckd_mbd_status, "Not present", "Not assessed"))
    add(
      "ckd_mbd",
      "routine",
      "CKD–mineral and bone disorder documented — review phosphate, calcium, PTH and vitamin D against the plan.",
      "KDIGO CKD–MBD guidance."
    );

  if (values.bp_control === "Above target")
    add(
      "bp_above_target",
      "routine",
      "Blood pressure documented above target — review adherence, sodium intake and therapy at the next contact.",
      "Documented finding in this note."
    );

  return alerts;
}

export const NEPH_ALERT_LEVELS = {
  urgent: "Urgent — same-day clinical decision",
  routine: "Routine follow-up reminder",
};

// Serializes the acknowledged prompts into the text stored with the note.
export function formatNephAlerts(value, values) {
  const stored = Array.isArray(value && value.resolved) ? value.resolved : null;
  const alerts = stored && stored.length > 0 ? stored : buildNephAlerts(values || {});
  const actions = (value && value.actions) || {};
  const lines = [];
  if (alerts.length === 0) {
    lines.push("No safety prompt triggered on the documented values — this is not a statement that no urgent problem exists.");
  } else {
    alerts.forEach((a) => {
      const action = String(actions[a.key] || "").trim();
      lines.push(`[${a.level === "urgent" ? "URGENT" : "ROUTINE"}] ${a.label}`);
      lines.push(`   Basis: ${a.basis}`);
      lines.push(`   Action taken: ${action || "NOT DOCUMENTED"}`);
    });
  }
  if (value && String(value.other_concern || "").trim())
    lines.push(`Other urgent concern: ${String(value.other_concern).trim()}`);
  if (value && String(value.escalation || "").trim())
    lines.push(`Escalation: ${String(value.escalation).trim()}`);
  return lines.join("\n");
}