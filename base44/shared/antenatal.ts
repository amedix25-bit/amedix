// Shared antenatal care engine: gestational age calculation, the default
// WHO / Libyan-protocol schedule structure and the schedule evaluation used by
// the antenatalCare backend function. Pure helpers — no SDK access.

export const MS_DAY = 86400000;
export const GESTATION_DAYS = 280; // 40 weeks + 0 days (Naegele)

// WHO-recommended antenatal contact weeks (8 contacts) — the anchor for
// "current contact" display; the detailed windows are configurable per record.
export const WHO_CONTACT_WEEKS = [12, 20, 26, 30, 34, 36, 38, 40];

function parseDate(dateStr) {
  return new Date(String(dateStr).slice(0, 10) + "T00:00:00Z").getTime();
}

function isoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(dateStr, days) {
  return isoDate(parseDate(dateStr) + days * MS_DAY);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Computes the current gestational age from the documented dating information.
// A recorded ultrasound dating measurement overrides the LMP estimate.
// Returns null fields when dating is incomplete — missing information is
// NEVER assumed to be normal.
export function computeDating(pregnancy, today) {
  const p = pregnancy || {};
  let lmp = p.lmp_date ? String(p.lmp_date).slice(0, 10) : "";
  let edd = p.edd_date ? String(p.edd_date).slice(0, 10) : "";
  let method = p.dating_method || "lmp";
  const usDays =
    Number.isFinite(p.ultrasound_dating_weeks) && p.ultrasound_dating_date
      ? p.ultrasound_dating_weeks * 7 + (Number.isFinite(p.ultrasound_dating_days) ? p.ultrasound_dating_days : 0)
      : null;

  if (usDays !== null) {
    edd = addDays(p.ultrasound_dating_date, GESTATION_DAYS - usDays);
    lmp = addDays(edd, -GESTATION_DAYS);
    method = "ultrasound";
  } else if (method === "ultrasound") {
    method = "lmp"; // ultrasound measurement incomplete — fall back to LMP
  }
  if (edd && !lmp) lmp = addDays(edd, -GESTATION_DAYS);
  if (lmp && !edd) edd = addDays(lmp, GESTATION_DAYS);
  if (!lmp || !edd) {
    return { complete: false, lmp, edd, dating_method: method };
  }
  const gaDays = Math.floor((parseDate(today) - parseDate(lmp)) / MS_DAY);
  if (gaDays < 0) {
    return { complete: false, lmp, edd, dating_method: method, future_dating: true };
  }
  const weeks = Math.floor(gaDays / 7);
  const days = gaDays % 7;
  const trimester = weeks < 13 ? 1 : weeks < 28 ? 2 : 3;
  const stageKey = weeks < 13 ? "early" : weeks < 28 ? "mid" : weeks < 37 ? "late" : "term";
  const stageLabel = stageKey === "early" ? "Early pregnancy" : stageKey === "mid" ? "Mid pregnancy" : stageKey === "late" ? "Late pregnancy" : "Term";
  const contact = nextContact(gaDays);
  return {
    complete: true,
    lmp,
    edd,
    dating_method: method,
    gestational_age_days: gaDays,
    weeks,
    days,
    label: `${weeks} weeks + ${days} days`,
    trimester,
    trimester_label: trimester === 1 ? "First" : trimester === 2 ? "Second" : "Third",
    stage: stageLabel,
    stage_key: stageKey,
    contact,
  };
}

// The current / next antenatal contact based on the WHO contact weeks.
export function nextContact(gaDays) {
  const weeks = Math.floor(gaDays / 7);
  for (let i = 0; i < WHO_CONTACT_WEEKS.length; i++) {
    if (weeks < WHO_CONTACT_WEEKS[i]) {
      const diffWeeks = WHO_CONTACT_WEEKS[i] - weeks;
      return {
        contact_no: i + 1,
        week: WHO_CONTACT_WEEKS[i],
        label: `Contact ${i + 1} — ${WHO_CONTACT_WEEKS[i]} weeks (${diffWeeks} week${diffWeeks === 1 ? "" : "s"} away)`,
        current: false,
      };
    }
    if (weeks === WHO_CONTACT_WEEKS[i]) {
      return { contact_no: i + 1, week: WHO_CONTACT_WEEKS[i], label: `Contact ${i + 1} — now (${WHO_CONTACT_WEEKS[i]} weeks)`, current: true };
    }
  }
  return { contact_no: null, week: null, label: "Past the scheduled contact schedule — post-term follow-up", current: false };
}

// The default schedule structure — WHO recommendations with the first
// trimester as specified. Exact eligibility, timing and repeat intervals are
// configurable through the AntenatalScheduleConfig entity.
export const DEFAULT_WINDOWS = [
  {
    key: "first_trimester",
    label: "First trimester (0-12 weeks)",
    weeks_from: 0,
    weeks_to: 12,
    contact_no: 1,
    items: [
      { key: "confirm_pregnancy_dating", label: "Confirm pregnancy and establish gestational age (LMP, EDD, dating method)", category: "assessment" },
      { key: "obstetric_history", label: "Obstetric history: gravidity, parity, previous outcomes, cesarean and complications", category: "assessment" },
      { key: "medical_surgical_history", label: "Review medical and surgical history", category: "assessment" },
      { key: "medications_allergies", label: "Review current medications and allergies", category: "assessment" },
      { key: "family_history", label: "Record relevant family history", category: "assessment" },
      { key: "risk_history_review", label: "Assess previous pre-eclampsia, gestational diabetes, preterm birth and fetal growth restriction", category: "assessment" },
      { key: "lifestyle_psychosocial", label: "Assess lifestyle, nutritional and psychosocial factors", category: "assessment" },
      { key: "blood_pressure", label: "Blood pressure measurement", category: "screening" },
      { key: "weight_bmi", label: "Weight and BMI measurement", category: "screening", optional: true },
      { key: "cbc_hemoglobin", label: "Full blood count / hemoglobin assessment", category: "laboratory" },
      { key: "blood_group_rh", label: "Blood group and Rh status", category: "laboratory" },
      { key: "red_cell_antibodies", label: "Red-cell antibody screening (per applicable protocol)", category: "laboratory", optional: true },
      { key: "hiv_screen", label: "HIV screening", category: "laboratory" },
      { key: "syphilis_screen", label: "Syphilis screening", category: "laboratory" },
      { key: "hepatitis_b_screen", label: "Hepatitis B screening (per applicable protocol)", category: "laboratory" },
      { key: "urine_testing", label: "Urine testing and culture (per applicable protocol)", category: "laboratory", optional: true },
      { key: "diabetes_assessment", label: "Assessment of pre-existing diabetes and indications for early diabetes testing", category: "screening" },
      { key: "immunization_review", label: "Review of immunization status", category: "screening", optional: true },
      { key: "supplementation_review", label: "Review of nutritional supplementation (folic acid, iron)", category: "prevention" },
      { key: "dating_viability_ultrasound", label: "First-trimester ultrasound: pregnancy location, viability and number of fetuses (when indicated)", category: "imaging", optional: true },
      { key: "aneuploidy_options", label: "Display applicable aneuploidy screening options", category: "screening", optional: true },
      { key: "findings_review", label: "Record any findings requiring additional assessment", category: "assessment", optional: true },
      { key: "nutrition_education", label: "Education: nutrition and supplementation", category: "education", optional: true },
      { key: "medication_safety_edu", label: "Education: medication safety", category: "education", optional: true },
      { key: "smoking_substance_edu", label: "Education: smoking and substance exposure", category: "education", optional: true },
      { key: "warning_signs_edu", label: "Education: pregnancy warning signs", category: "education", optional: true },
      { key: "followup_plan_edu", label: "Education: antenatal follow-up plan", category: "education", optional: true },
    ],
  },
  {
    key: "anomaly_scan",
    label: "Fetal anomaly ultrasound (18-22 weeks)",
    weeks_from: 18,
    weeks_to: 22,
    contact_no: 2,
    items: [
      { key: "anomaly_ultrasound", label: "Fetal anomaly (anatomy) ultrasound, 18-22 weeks", category: "imaging" },
    ],
  },
  {
    key: "second_contact",
    label: "Second trimester contact (20-26 weeks)",
    weeks_from: 20,
    weeks_to: 26,
    contact_no: 2,
    items: [
      { key: "bp_second", label: "Blood pressure measurement", category: "screening" },
      { key: "weight_second", label: "Weight measurement", category: "screening", optional: true },
      { key: "symptom_review_second", label: "Review symptoms, fetal movements and warning signs", category: "assessment" },
      { key: "supplementation_second", label: "Review nutritional supplementation", category: "prevention", optional: true },
    ],
  },
  {
    key: "gdm_testing",
    label: "Gestational diabetes testing (24-28 weeks)",
    weeks_from: 24,
    weeks_to: 28,
    contact_no: 3,
    items: [
      { key: "gdm_screen", label: "Gestational diabetes testing (75g OGTT or per applicable protocol)", category: "laboratory" },
      { key: "cbc_gdm", label: "Repeat hemoglobin / full blood count (per protocol)", category: "laboratory", optional: true },
    ],
  },
  {
    key: "third_contact",
    label: "Third trimester contact (28-34 weeks)",
    weeks_from: 28,
    weeks_to: 34,
    contact_no: 4,
    items: [
      { key: "bp_third", label: "Blood pressure measurement", category: "screening" },
      { key: "hb_repeat_third", label: "Repeat hemoglobin assessment (per protocol)", category: "laboratory", optional: true },
      { key: "anti_d_rh", label: "Anti-D immunoglobulin for Rh-negative patients (28 weeks, per protocol)", category: "prevention", optional: true },
      { key: "fetal_growth_third", label: "Assess fetal growth (fundal height / clinical assessment)", category: "assessment" },
    ],
  },
  {
    key: "growth_scan",
    label: "Third trimester growth ultrasound (28-32 weeks)",
    weeks_from: 28,
    weeks_to: 32,
    contact_no: 4,
    items: [
      { key: "growth_ultrasound", label: "Third trimester growth and wellbeing ultrasound (when indicated)", category: "imaging", optional: true },
    ],
  },
  {
    key: "late_contact",
    label: "Late preterm contact (36-38 weeks)",
    weeks_from: 36,
    weeks_to: 38,
    contact_no: 6,
    items: [
      { key: "bp_late", label: "Blood pressure measurement", category: "screening" },
      { key: "presentation_check", label: "Assess fetal presentation and position", category: "assessment" },
      { key: "gbs_screen", label: "Group B streptococcus screening (per applicable protocol)", category: "laboratory", optional: true },
      { key: "birth_plan_edu", label: "Education: birth plan and danger signs review", category: "education", optional: true },
    ],
  },
  {
    key: "term_contact",
    label: "Term and post-term contact (40-42 weeks)",
    weeks_from: 40,
    weeks_to: 42,
    contact_no: 8,
    items: [
      { key: "bp_term", label: "Blood pressure measurement", category: "screening" },
      { key: "fetal_wellbeing_term", label: "Fetal wellbeing assessment (movements, CTG or ultrasound per protocol)", category: "assessment" },
      { key: "postterm_plan", label: "Post-term management plan discussion", category: "education", optional: true },
    ],
  },
];

// Item state per item key, evaluated against the current gestational age and
// the recorded item history. Dating changes re-evaluate the schedule but never
// touch recorded items — completed investigations are not repeated.
export function evaluateSchedule(dating, windows, itemRecords) {
  const ga = dating && dating.complete ? dating.gestational_age_days : null;
  return (windows || []).map((w) => {
    const items = (w.items || []).map((it) => {
      const rec = (itemRecords || []).find((r) => r.item_key === it.key) || null;
      let state;
      if (rec && rec.status === "completed") state = "completed";
      else if (rec && rec.status === "skipped") state = "skipped";
      else if (rec && rec.status === "ordered") state = "ordered";
      else if (ga === null) state = "awaiting_dating";
      else if (ga >= w.weeks_from * 7 && ga <= w.weeks_to * 7 + 6) state = "due";
      else if (ga > w.weeks_to * 7 + 6) state = "overdue";
      else if (w.weeks_from * 7 - ga <= 14) state = "approaching";
      else state = "upcoming";
      return {
        key: it.key,
        label: it.label,
        category: it.category,
        optional: !!it.optional,
        state,
        record: rec
          ? {
              id: rec.id,
              notes: rec.notes || "",
              recorded_datetime: rec.recorded_datetime || "",
              recorded_by_name: rec.recorded_by_name || "",
              linked_lab_request_id: rec.linked_lab_request_id || "",
              linked_imaging_request_id: rec.linked_imaging_request_id || "",
            }
          : null,
      };
    });
    const open = items.filter((i) => ["due", "overdue", "approaching", "ordered", "awaiting_dating"].includes(i.state));
    let wState;
    if (ga === null) wState = "awaiting_dating";
    else if (ga > w.weeks_to * 7 + 6) wState = open.length > 0 ? "overdue" : "passed";
    else if (ga >= w.weeks_from * 7) wState = "due";
    else if (w.weeks_from * 7 - ga <= 14) wState = "approaching";
    else wState = "upcoming";
    return {
      key: w.key,
      label: w.label,
      weeks_from: w.weeks_from,
      weeks_to: w.weeks_to,
      contact_no: w.contact_no || null,
      state: wState,
      open_count: open.length,
      items,
    };
  });
}

// Computed flags. Risk is never auto-classified: missing information produces
// a flag, not a low-risk assumption.
export function evaluateFlags(dating, pregnancy, patient, conditionNames) {
  const flags = [];
  const computed_risk_flags = [];
  if (!dating || !dating.complete) {
    flags.push({
      key: "dating_incomplete",
      severity: "high",
      message: "Pregnancy dating is incomplete — gestational age cannot be calculated. Record the LMP, EDD or ultrasound dating.",
    });
  }
  if (dating && dating.complete && dating.gestational_age_days >= 84 && !(pregnancy && pregnancy.initial_assessment_done)) {
    flags.push({
      key: "initial_assessment_outstanding",
      severity: "high",
      message: "The patient has reached 12 weeks without a documented initial antenatal assessment — the outstanding assessments are flagged for clinician review.",
    });
  }
  const p = pregnancy || {};
  if (p.previous_preeclampsia) computed_risk_flags.push({ key: "prev_preeclampsia", message: "Previous pre-eclampsia — risk of hypertensive disorders" });
  if (p.previous_gestational_diabetes) computed_risk_flags.push({ key: "prev_gdm", message: "Previous gestational diabetes" });
  if (p.previous_preterm_birth) computed_risk_flags.push({ key: "prev_preterm", message: "Previous preterm birth" });
  if (p.previous_fgr) computed_risk_flags.push({ key: "prev_fgr", message: "Previous fetal growth restriction" });
  if (p.previous_cesarean) computed_risk_flags.push({ key: "prev_cesarean", message: "Previous cesarean delivery" });
  const dob = patient && patient.date_of_birth ? String(patient.date_of_birth).slice(0, 10) : "";
  if (dob) {
    const age = Math.floor((parseDate(todayStr()) - parseDate(dob)) / (MS_DAY * 365.25));
    if (age >= 35) computed_risk_flags.push({ key: "maternal_age", message: `Maternal age ${age} years — advanced maternal age` });
  }
  const risky = /hypertens|diabet|renal|kidney|cardiac|heart|autoimmune|lupus|thyroid|epilep|asthma|sickle|thromb/i;
  (conditionNames || []).forEach((name) => {
    if (risky.test(String(name || ""))) computed_risk_flags.push({ key: "condition_" + name, message: `Known condition: ${name}` });
  });
  if (Array.isArray(p.risk_factors)) {
    p.risk_factors.forEach((rf, i) => {
      if (rf && rf.detail) computed_risk_flags.push({ key: "factor_" + i, message: `${rf.category ? rf.category + ": " : ""}${rf.detail}` });
    });
  }
  return { flags, computed_risk_flags };
}