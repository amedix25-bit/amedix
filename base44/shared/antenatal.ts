// Shared antenatal care engine: gestational age calculation, the default
// WHO / Libyan-protocol schedule structure (first through post-dates
// pregnancy), the schedule evaluation and the automation rules used by the
// antenatalCare backend function. Pure helpers — no SDK access.

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

// The default schedule structure — WHO recommendations across the whole
// pregnancy. Exact eligibility, timing and repeat intervals are configurable
// through the AntenatalScheduleConfig entity.
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
    key: "second_early",
    label: "Second trimester (13-20 weeks)",
    weeks_from: 13,
    weeks_to: 20,
    contact_no: 2,
    items: [
      { key: "maternal_history_update_13_20", label: "Maternal history updates and blood pressure measurement", category: "screening" },
      { key: "previous_results_review", label: "Review of previous screening results", category: "assessment" },
      { key: "anemia_followup_13_20", label: "Follow-up of anemia or other identified conditions", category: "assessment" },
      { key: "medications_review_second", label: "Review of medications and supplementation", category: "assessment" },
      { key: "fetal_assessment_second", label: "Fetal assessment as clinically indicated", category: "assessment", optional: true },
      { key: "additional_testing_second", label: "Additional screening or diagnostic testing when indicated by history, risk factors or previous findings", category: "screening", optional: true },
    ],
  },
  {
    key: "anomaly_scan",
    label: "Fetal anomaly ultrasound (18-22 weeks)",
    weeks_from: 18,
    weeks_to: 22,
    contact_no: 2,
    highlight: true,
    items: [
      { key: "anomaly_ultrasound", label: "Fetal anomaly (anatomy) ultrasound, 18-22 weeks", category: "imaging" },
    ],
  },
  {
    key: "second_late",
    label: "Second trimester (21-27 weeks)",
    weeks_from: 21,
    weeks_to: 27,
    contact_no: 3,
    items: [
      { key: "bp_symptoms_21_27", label: "Blood pressure and relevant symptom assessment", category: "screening" },
      { key: "fetal_growth_review_21_27", label: "Review of fetal growth and ultrasound findings", category: "assessment" },
      { key: "fetal_movement_21_27", label: "Assessment of fetal movement when appropriate", category: "assessment" },
      { key: "hematologic_repeat_21_27", label: "Repeat hematologic assessment when recommended or clinically indicated", category: "laboratory", optional: true },
      { key: "blood_group_rh_review", label: "Review of blood group, Rh status and any required preventive management", category: "assessment" },
      { key: "outstanding_review_21_27", label: "Review of outstanding investigations and abnormal findings", category: "assessment", optional: true },
    ],
  },
  {
    key: "gdm_testing",
    label: "Gestational diabetes screening (24-28 weeks)",
    weeks_from: 24,
    weeks_to: 28,
    contact_no: 3,
    items: [
      { key: "gdm_screen", label: "Gestational diabetes screening (75g OGTT or per applicable protocol)", category: "laboratory" },
      { key: "cbc_gdm", label: "Repeat hematologic assessment (per protocol)", category: "laboratory", optional: true },
    ],
  },
  {
    key: "third_early",
    label: "Third trimester (28-32 weeks)",
    weeks_from: 28,
    weeks_to: 32,
    contact_no: 4,
    items: [
      { key: "bp_preec_28_32", label: "Blood pressure and assessment for symptoms of pre-eclampsia", category: "screening" },
      { key: "fetal_growth_wellbeing_28_32", label: "Review of fetal growth and well-being", category: "assessment" },
      { key: "gdm_results_review", label: "Review of gestational diabetes results and management", category: "assessment" },
      { key: "anemia_followup_28_32", label: "Follow-up of anemia and other identified conditions", category: "assessment" },
      { key: "rh_anti_d_review", label: "Review of Rh status and anti-D prophylaxis when indicated", category: "prevention" },
      { key: "immunization_review_third", label: "Review of immunization requirements", category: "screening", optional: true },
      { key: "additional_labs_28_32", label: "Additional laboratory investigations when indicated", category: "laboratory", optional: true },
      { key: "fetal_movement_28_32", label: "Assessment of fetal movement", category: "assessment" },
      { key: "prior_abnormal_review", label: "Follow-up of previous abnormal findings", category: "assessment", optional: true },
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
    key: "third_late",
    label: "Third trimester (33-36 weeks)",
    weeks_from: 33,
    weeks_to: 36,
    contact_no: 5,
    items: [
      { key: "bp_symptoms_33_36", label: "Blood pressure and symptom assessment", category: "screening" },
      { key: "growth_presentation_33_36", label: "Fetal growth and presentation assessment when appropriate", category: "assessment" },
      { key: "fetal_movement_33_36", label: "Fetal movement assessment", category: "assessment" },
      { key: "risk_review_33_36", label: "Review of current maternal and fetal risk factors", category: "assessment" },
      { key: "prev_complications_review", label: "Review of previous pregnancy complications", category: "assessment", optional: true },
      { key: "birth_planning", label: "Birth planning and delivery-related risk assessment", category: "education" },
      { key: "outstanding_review_33_36", label: "Review of outstanding investigations and referrals", category: "assessment", optional: true },
    ],
  },
  {
    key: "gbs_screening",
    label: "Group B streptococcus screening (35-37 weeks)",
    weeks_from: 35,
    weeks_to: 37,
    contact_no: 6,
    institution_dependent: true,
    items: [
      { key: "gbs_screen", label: "Group B streptococcus screening", category: "laboratory" },
    ],
  },
  {
    key: "term_contact",
    label: "Term pregnancy (37-40 weeks)",
    weeks_from: 37,
    weeks_to: 40,
    contact_no: 7,
    checklist: true,
    items: [
      { key: "bp_preec_term", label: "Blood pressure and assessment for pre-eclampsia", category: "screening" },
      { key: "fetal_movement_term", label: "Fetal movement assessment", category: "assessment" },
      { key: "presentation_exam_term", label: "Fetal presentation and relevant clinical examination", category: "assessment" },
      { key: "labor_signs_edu", label: "Review of labor symptoms and warning signs", category: "education" },
      { key: "delivery_plan_review", label: "Birth planning and intended delivery location", category: "education" },
      { key: "risk_review_term", label: "Review of maternal and fetal risk factors", category: "assessment" },
      { key: "monitoring_referral_term", label: "Assessment of the need for additional monitoring or referral", category: "assessment", optional: true },
    ],
  },
  {
    key: "post_dates",
    label: "Beyond 40 weeks (post-dates)",
    weeks_from: 40,
    weeks_to: 44,
    contact_no: 8,
    items: [
      { key: "maternal_fetal_assessment_post", label: "Maternal and fetal assessment", category: "assessment" },
      { key: "movement_warning_review_post", label: "Fetal movement and warning symptom review", category: "assessment" },
      { key: "fetal_surveillance_post", label: "Appropriate fetal surveillance according to the locally approved protocol", category: "screening", optional: true },
      { key: "delivery_planning_review_post", label: "Review of delivery planning", category: "education" },
      { key: "indication_assessment_post", label: "Assessment of indications and timing for induction of labor", category: "assessment" },
      { key: "escalation_review_post", label: "Referral or escalation when clinically indicated", category: "assessment", optional: true },
    ],
  },
];

// Normalizes the institution-level protocol settings stored on the schedule
// configuration. The Group B streptococcus strategy is institution-dependent:
// nothing is assumed about which strategy an institution follows.
export function normalizeSettings(settings) {
  const s = settings && typeof settings === "object" ? settings : {};
  return {
    gbs_strategy_enabled: s.gbs_strategy_enabled === true,
    gbs_weeks_from: Number.isFinite(s.gbs_weeks_from) ? s.gbs_weeks_from : 35,
    gbs_weeks_to: Number.isFinite(s.gbs_weeks_to) ? s.gbs_weeks_to : 37,
    post_dates_pathway: String(s.post_dates_pathway || "").trim(),
  };
}

// Applies the institutional settings to the window list: the Group B
// streptococcus window only exists when the strategy is configured, and uses
// the institution's configured gestational-age window.
export function applySettings(windows, settings) {
  const s = normalizeSettings(settings);
  return (windows || [])
    .filter((w) => w.key !== "gbs_screening" || s.gbs_strategy_enabled)
    .map((w) => {
      if (w.key === "gbs_screening") {
        return {
          ...w,
          weeks_from: s.gbs_weeks_from,
          weeks_to: s.gbs_weeks_to,
          label: `Group B streptococcus screening (${s.gbs_weeks_from}-${s.gbs_weeks_to} weeks)`,
        };
      }
      return w;
    });
}

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
              outcome: rec.outcome || "",
              followup_plan: rec.followup_plan || "",
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
      highlight: w.highlight === true,
      checklist: w.checklist === true,
      state: wState,
      open_count: open.length,
      items,
    };
  });
}

// Automation rules for the second and third trimesters and the post-dates
// period. Automations highlight, remind and flag only — they never diagnose,
// never auto-order investigations and never recommend induction or cesarean
// delivery: those stay clinical decisions.
export function evaluateAutomations(dating, pregnancy, schedule, itemRecords, settings, today) {
  const out = [];
  const findItem = (key) => {
    for (const w of schedule || []) {
      const it = (w.items || []).find((i) => i.key === key);
      if (it) return { window: w, item: it };
    }
    return null;
  };
  const ga = dating && dating.complete ? dating.gestational_age_days : null;
  const s = normalizeSettings(settings);

  // Anomaly ultrasound window (18-22 weeks) — highlighted, with the imaging
  // request and final report linked through the existing radiology workflow.
  const anomaly = findItem("anomaly_ultrasound");
  if (anomaly) {
    if (["due", "approaching", "overdue"].includes(anomaly.item.state) && anomaly.item.state !== "completed") {
      out.push({
        key: "anomaly_window",
        tone: "highlight",
        title: "Recommended fetal anomaly ultrasound window (18-22 weeks)",
        message:
          anomaly.item.state === "overdue"
            ? "The recommended anomaly ultrasound window (18-22 weeks) has passed without a documented scan. Order it through the imaging workflow and link it to this pregnancy record."
            : "Order the anomaly ultrasound through the existing imaging workflow and link it to this pregnancy record so the request and the final report flow back here.",
        item_key: "anomaly_ultrasound",
        window_key: anomaly.window.key,
      });
    } else if (anomaly.item.state === "ordered") {
      const link = anomaly.item.img_link || anomaly.item.lab_link;
      if (link && link.state === "results_available") {
        out.push({
          key: "anomaly_report",
          tone: "info",
          title: "Anomaly ultrasound report available",
          message: `The final report for imaging request ${link.request_id} is linked to this pregnancy record.`,
          item_key: "anomaly_ultrasound",
        });
      } else {
        out.push({
          key: "anomaly_link",
          tone: "info",
          title: "Anomaly ultrasound ordered",
          message: link ? `Imaging request ${link.request_id} is linked to this pregnancy record and is awaiting the final report.` : "The anomaly ultrasound is recorded as ordered. Link the imaging request to this pregnancy record so the final report flows back.",
          item_key: "anomaly_ultrasound",
        });
      }
    }
  }

  // Gestational diabetes screening: reminder at ~24 weeks, outstanding flag
  // after the configured window. Screening findings are never treated as a
  // confirmed diagnosis without clinical assessment.
  const gdm = findItem("gdm_screen");
  if (gdm && dating && dating.complete) {
    if (ga >= 168 && ["approaching", "due", "awaiting_dating"].includes(gdm.item.state)) {
      out.push({
        key: "gdm_reminder",
        tone: "reminder",
        title: "Gestational diabetes screening due (24-28 weeks)",
        message: "The gestational diabetes screening window has been reached. Screen when clinically indicated — a risk factor alone is never a diagnosis.",
        item_key: "gdm_screen",
        window_key: gdm.window.key,
      });
    }
    if (ga > 28 * 7 + 6 && ["overdue", "due", "approaching", "awaiting_dating"].includes(gdm.item.state)) {
      out.push({
        key: "gdm_outstanding",
        tone: "alert",
        title: "Gestational diabetes screening outstanding",
        message: "The screening window (24-28 weeks) has passed without a documented result. Flagged for clinician review — do not diagnose gestational diabetes from risk factors or an unverified result.",
        item_key: "gdm_screen",
        window_key: gdm.window.key,
      });
    }
  }

  // Outstanding third-trimester assessments: highlighted, and any abnormal
  // finding requires a documented management or follow-up plan.
  const thirdOverdue = [];
  (schedule || []).forEach((w) => {
    if (w.weeks_from >= 28 && ["overdue"].includes(w.state)) {
      (w.items || []).forEach((it) => {
        if (it.state === "overdue") thirdOverdue.push(it);
      });
    }
  });
  if (thirdOverdue.length > 0) {
    out.push({
      key: "outstanding_third_trimester",
      tone: "alert",
      title: "Outstanding third-trimester assessments",
      message: `${thirdOverdue.length} third-trimester assessment${thirdOverdue.length === 1 ? "" : "s"} still open: ${thirdOverdue.slice(0, 5).map((i) => i.label).join("; ")}${thirdOverdue.length > 5 ? "; …" : ""}. Any abnormal finding requires a documented management or follow-up plan.`,
    });
  }
  (itemRecords || []).forEach((r) => {
    if (r.outcome === "abnormal" && !String(r.followup_plan || "").trim()) {
      out.push({
        key: "plan_missing_" + r.item_key,
        tone: "alert",
        title: "Management plan required",
        message: `The item "${r.item_label || r.item_key}" was recorded with an abnormal outcome but has no documented management or follow-up plan. Document the plan for clinician review.`,
        item_key: r.item_key,
      });
    }
  });

  // Group B streptococcus strategy — institution-dependent. Nothing is
  // assumed about which strategy an institution follows.
  const gbsWindow = (schedule || []).find((w) => w.key === "gbs_screening");
  if (s.gbs_strategy_enabled && gbsWindow) {
    out.push({
      key: "gbs_window",
      tone: "info",
      title: `Group B streptococcus screening window (${s.gbs_weeks_from}-${s.gbs_weeks_to} weeks)`,
      message: "This institution uses a Group B streptococcus screening strategy — the screening item appears in the schedule for the configured window.",
    });
  } else if (ga !== null && ga >= 33 * 7) {
    out.push({
      key: "gbs_not_configured",
      tone: "info",
      title: "No Group B streptococcus screening strategy configured",
      message: "This institution has not configured a Group B streptococcus screening strategy. Confirm and record the locally adopted protocol — screening strategies differ between countries and institutions.",
    });
  }

  // Delivery-planning checklist from 37 weeks, highlighting unresolved
  // clinical concerns. Induction and cesarean are never auto-recommended.
  if (ga !== null && ga >= 37 * 7) {
    const unresolved = [];
    (schedule || []).forEach((w) => {
      if (w.key === "term_contact" || w.key === "post_dates") {
        (w.items || []).forEach((it) => {
          if (["due", "overdue", "ordered"].includes(it.state)) unresolved.push(it);
        });
      }
    });
    if (unresolved.length > 0) {
      out.push({
        key: "delivery_checklist",
        tone: "highlight",
        title: "Delivery-planning checklist — unresolved concerns",
        message: `${unresolved.length} term/post-dates concern${unresolved.length === 1 ? "" : "s"} still open: ${unresolved.slice(0, 5).map((i) => i.label).join("; ")}${unresolved.length > 5 ? "; …" : ""}. Additional monitoring or referral remains a clinical decision.`,
      });
    } else {
      out.push({
        key: "delivery_checklist",
        tone: "info",
        title: "Delivery-planning checklist",
        message: "Term assessments are addressed. Review birth planning, the intended delivery location and labor warning signs with the patient.",
      });
    }
  }

  // Past the EDD: alert with the configured post-dates pathway. The system
  // never decides when to induce labor.
  if (dating && dating.complete && dating.edd && today >= dating.edd) {
    out.push({
      key: "past_edd",
      tone: "alert",
      title: "Pregnancy at or beyond the estimated due date",
      message: `The pregnancy has reached the EDD (${dating.edd}). Post-dates management pathway${s.post_dates_pathway ? ": " + s.post_dates_pathway : ": display the configured pathway for this institution."} Assessment of indications and timing for induction of labor remains a clinical decision — the system does not decide induction timing.`,
    });
  }

  return out;
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