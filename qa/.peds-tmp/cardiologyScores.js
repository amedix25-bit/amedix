// Cardiology clinical scores and classifications.
//
// Every score here is a published instrument, reproduced with its own variables,
// weighting and interpretation bands, and cited to the paper that defines it.
// Three rules are absolute:
//
//  1. NOTHING IS FABRICATED. A score is calculated only from values the
//     clinician documented in this note. If a variable is missing the score is
//     NOT calculated and NOT estimated from a default — the panel states exactly
//     which variables are missing and the score stays uncalculated.
//  2. Every result carries its source, its weighting and its interpretation band,
//     so the number in the record can be audited against the original.
//  3. A score supports a decision; it never makes it. No score here withholds or
//     orders a treatment.
//
// Scores that the app does NOT recalculate are marked `external`: their published
// calculation is a proprietary nomogram/coefficient set that would have to be
// re-derived to be trusted, so the clinician records the value read from the
// published calculator together with its source. Re-deriving those weights from
// memory would risk a silently wrong number in a clinical record, which is worse
// than an honestly documented external value.

const num = (key, label, unit, extra) => ({ key, label, type: "number", unit, ...extra });
const pick = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const opt = (value, points) => ({ value, points });

const isNum = (v) => v !== "" && v !== null && v !== undefined && !Number.isNaN(Number(v));
const isSet = (v) => String(v ?? "").trim() !== "";

const pointsFor = (value, table) => {
  const n = Number(value);
  for (const row of table) if (row.max === undefined || n <= row.max) return row.points;
  return table[table.length - 1].points;
};

const bandFrom = (total, bands) => bands.find((b) => (b.max === undefined || total <= b.max)) || bands[bands.length - 1];

// ---- 1. HEART score -------------------------------------------------------
const HEART = {
  key: "heart",
  name: "HEART score",
  short: "HEART",
  purpose: "Short-term major adverse cardiac event risk in undifferentiated chest pain in the emergency department.",
  population: "Chest pain with suspected acute coronary syndrome, before a diagnosis is established.",
  source: {
    organization: "Six et al., Annals of Internal Medicine",
    title: "Chest pain in the emergency room: a multicenter validation of the HEART score",
    version: "2008",
    url: "https://www.acpjournals.org/doi/10.7326/0003-4819-149-10-200811180-00002",
  },
  max: 10,
  variables: [
    pick("history", "History — how suspicious is the presentation?", [
      opt("Highly suspicious", 0),
      opt("Moderately suspicious", 1),
      opt("Slightly suspicious", 2),
    ]),
    pick("ecg", "ECG", [
      opt("Normal", 0),
      opt("Non-specific repolarisation abnormality", 1),
      opt("Significant ST deviation", 2),
    ]),
    num("age", "Age", "years"),
    pick("risk_factors", "Risk factors", [
      opt("No risk factors known", 0),
      opt("1–2 risk factors", 1),
      opt("3 or more risk factors, or known atherosclerotic disease", 2),
    ]),
    pick("troponin", "Troponin", [
      opt("At or below the upper limit of normal", 0),
      opt("1–3 times the upper limit of normal", 1),
      opt("More than 3 times the upper limit of normal", 2),
    ]),
  ],
  compute: (v) => {
    const missing = [];
    const items = [];
    const add = (label, value, points) => items.push({ label, value, points });

    if (isSet(v.history)) add("History", v.history, pickPoints(HEART.variables[0], v.history));
    else missing.push("History");
    if (isSet(v.ecg)) add("ECG", v.ecg, pickPoints(HEART.variables[1], v.ecg));
    else missing.push("ECG");
    if (isNum(v.age)) {
      const p = pointsFor(v.age, [
        { max: 44, points: 0 },
        { max: 64, points: 1 },
        { max: undefined, points: 2 },
      ]);
      add("Age", `${v.age} years`, p);
    } else missing.push("Age");
    if (isSet(v.risk_factors)) add("Risk factors", v.risk_factors, pickPoints(HEART.variables[3], v.risk_factors));
    else missing.push("Risk factors");
    if (isSet(v.troponin)) add("Troponin", v.troponin, pickPoints(HEART.variables[4], v.troponin));
    else missing.push("Troponin");

    if (missing.length) return { missing };
    const total = items.reduce((s, i) => s + i.points, 0);
    const band = bandFrom(total, [
      { max: 3, label: "Low risk", tone: "success", note: "Approximately 1.7% 6-week major adverse cardiac event risk in the validation cohort." },
      { max: 6, label: "Intermediate risk", tone: "warning", note: "Approximately 16.6% 6-week major adverse cardiac event risk in the validation cohort." },
      { max: undefined, label: "High risk", tone: "critical", note: "Approximately 50.1% 6-week major adverse cardiac event risk in the validation cohort." },
    ]);
    return { total, items, band };
  },
  indicates: (values) => isSet(values.chest_pain_character) && !/Absent|Not assessed/i.test(values.chest_pain_character),
};

// ---- 2. GRACE (in-hospital) ----------------------------------------------
const GRACE = {
  key: "grace",
  name: "GRACE score — in-hospital mortality",
  short: "GRACE",
  purpose: "In-hospital mortality risk in acute coronary syndrome, used to guide the timing and intensity of an invasive strategy.",
  population: "Confirmed or suspected acute coronary syndrome.",
  source: {
    organization: "Granger et al., Archives of Internal Medicine (GRACE)",
    title: "Predictors of hospital mortality in the global registry of acute coronary events",
    version: "2003",
    url: "https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/216355",
  },
  max: 372,
  variables: [
    num("age", "Age", "years"),
    num("heart_rate", "Heart rate", "bpm"),
    num("systolic_bp", "Systolic blood pressure", "mmHg"),
    num("creatinine", "Creatinine", "mg/dL", { step: "0.01" }),
    pick("killip", "Killip class", [opt("I", 0), opt("II", 20), opt("III", 39), opt("IV", 59)]),
    pick("cardiac_arrest", "Cardiac arrest at admission", [opt("No", 0), opt("Yes", 39)]),
    pick("st_deviation", "ST-segment deviation", [opt("No", 0), opt("Yes", 28)]),
    pick("enzymes", "Elevated cardiac enzymes or markers", [opt("No", 0), opt("Yes", 14)]),
  ],
  compute: (v) => {
    const missing = [];
    const items = [];
    const numeric = (key, label, display, table) => {
      if (isNum(v[key])) {
        const p = pointsFor(v[key], table);
        items.push({ label, value: display(v[key]), points: p });
      } else missing.push(label);
    };
    numeric("age", "Age", (x) => `${x} years`, [
      { max: 29, points: 0 },
      { max: 39, points: 8 },
      { max: 49, points: 25 },
      { max: 59, points: 41 },
      { max: 69, points: 58 },
      { max: 79, points: 75 },
      { max: 89, points: 91 },
      { max: undefined, points: 100 },
    ]);
    numeric("heart_rate", "Heart rate", (x) => `${x} bpm`, [
      { max: 49, points: 0 },
      { max: 69, points: 3 },
      { max: 89, points: 9 },
      { max: 109, points: 15 },
      { max: 149, points: 24 },
      { max: 199, points: 38 },
      { max: undefined, points: 46 },
    ]);
    numeric("systolic_bp", "Systolic blood pressure", (x) => `${x} mmHg`, [
      { max: 79, points: 58 },
      { max: 99, points: 53 },
      { max: 119, points: 43 },
      { max: 139, points: 34 },
      { max: 159, points: 24 },
      { max: 199, points: 10 },
      { max: undefined, points: 0 },
    ]);
    numeric("creatinine", "Creatinine", (x) => `${x} mg/dL`, [
      { max: 0.39, points: 1 },
      { max: 0.79, points: 4 },
      { max: 1.19, points: 7 },
      { max: 1.59, points: 10 },
      { max: 1.99, points: 13 },
      { max: 3.99, points: 21 },
      { max: undefined, points: 28 },
    ]);
    ["killip", "cardiac_arrest", "st_deviation", "enzymes"].forEach((key, i) => {
      const def = GRACE.variables[4 + i];
      if (isSet(v[key])) items.push({ label: def.label, value: v[key], points: pickPoints(def, v[key]) });
      else missing.push(def.label);
    });

    if (missing.length) return { missing };
    const total = items.reduce((s, i) => s + i.points, 0);
    const mortality = [
      { max: 60, pct: "0.2" }, { max: 70, pct: "0.3" }, { max: 80, pct: "0.4" }, { max: 90, pct: "0.6" },
      { max: 100, pct: "0.8" }, { max: 110, pct: "1.1" }, { max: 120, pct: "1.6" }, { max: 130, pct: "2.1" },
      { max: 140, pct: "2.9" }, { max: 150, pct: "3.9" }, { max: 160, pct: "5.4" }, { max: 170, pct: "7.3" },
      { max: 180, pct: "9.8" }, { max: 190, pct: "13" }, { max: 200, pct: "18" }, { max: 210, pct: "23" },
      { max: 220, pct: "29" }, { max: 230, pct: "36" }, { max: 240, pct: "43" }, { max: 250, pct: "50" },
      { max: 260, pct: "57" }, { max: 270, pct: "65" }, { max: 280, pct: "71" }, { max: 290, pct: "76" },
      { max: 300, pct: "82" }, { max: 310, pct: "86" }, { max: 320, pct: "89" }, { max: 330, pct: "91" },
      { max: 340, pct: "93" }, { max: undefined, pct: "95" },
    ].find((r) => r.max === undefined || total <= r.max);
    const band = bandFrom(total, [
      { max: 108, label: "Low risk", tone: "success", note: "In-hospital mortality below 1% — an early invasive strategy is generally not required on risk grounds alone." },
      { max: 140, label: "Intermediate risk", tone: "warning", note: "In-hospital mortality approximately 1–3% — an invasive strategy is generally recommended within 24 hours." },
      { max: undefined, label: "High risk", tone: "critical", note: "In-hospital mortality above 3% — an invasive strategy is generally recommended within 2 hours." },
    ]);
    return { total, items, band, mortality: `${mortality.pct}%` };
  },
  indicates: (values) => /myocardial infarction|Unstable angina/i.test(values.acs_classification || ""),
};

// ---- 3. TIMI risk score for UA/NSTEMI ------------------------------------
const TIMI_NSTEMI = {
  key: "timi_nstemi",
  name: "TIMI risk score — unstable angina / non-ST-elevation myocardial infarction",
  short: "TIMI UA/NSTEMI",
  purpose: "14-day risk of death, myocardial infarction or urgent revascularisation.",
  population: "Unstable angina or non-ST-elevation myocardial infarction.",
  source: {
    organization: "Antman et al., JAMA (TIMI 11B, ESSENCE)",
    title: "The TIMI risk score for unstable angina/non-ST elevation MI",
    version: "2000",
    url: "https://jamanetwork.com/journals/jama/fullarticle/192721",
  },
  max: 7,
  variables: [
    pick("age_65", "Age 65 years or older", [opt("No", 0), opt("Yes", 1)]),
    pick("three_risk_factors", "Three or more coronary risk factors", [opt("No", 0), opt("Yes", 1)]),
    pick("known_cad", "Known coronary stenosis of 50% or more", [opt("No", 0), opt("Yes", 1)]),
    pick("aspirin_7d", "Aspirin used in the past 7 days", [opt("No", 0), opt("Yes", 1)]),
    pick("severe_angina", "Severe angina — two or more episodes in 24 hours", [opt("No", 0), opt("Yes", 1)]),
    pick("st_changes", "ST changes of 0.5 mm or more", [opt("No", 0), opt("Yes", 1)]),
    pick("marker", "Positive cardiac marker", [opt("No", 0), opt("Yes", 1)]),
  ],
  compute: (v) => computeBooleanScore(v, TIMI_NSTEMI, (total) => {
    const risk = { 0: "4.7", 1: "4.7", 2: "8.3", 3: "13.2", 4: "19.9", 5: "26.2", 6: "40.9", 7: "40.9" }[total];
    const band =
      total <= 2
        ? { label: "Low risk", tone: "success", note: `14-day event rate approximately ${risk}%.` }
        : total <= 4
        ? { label: "Intermediate risk", tone: "warning", note: `14-day event rate approximately ${risk}% — an early invasive strategy is generally favoured.` }
        : { label: "High risk", tone: "critical", note: `14-day event rate approximately ${risk}% — an early invasive strategy is generally recommended.` };
    return { band };
  }),
  indicates: (values) => /Non-ST-elevation myocardial infarction|Unstable angina/i.test(values.acs_classification || ""),
};

// ---- 4. TIMI risk score for STEMI ---------------------------------------
const TIMI_STEMI = {
  key: "timi_stemi",
  name: "TIMI risk score — ST-elevation myocardial infarction",
  short: "TIMI STEMI",
  purpose: "30-day mortality in ST-elevation myocardial infarction treated with fibrinolysis or primary percutaneous coronary intervention.",
  population: "ST-elevation myocardial infarction.",
  source: {
    organization: "Morrow et al., Circulation (InTIME II)",
    title: "TIMI risk score for ST-elevation myocardial infarction",
    version: "2000",
    url: "https://www.ahajournals.org/doi/10.1161/01.CIR.102.17.2031",
  },
  max: 14,
  variables: [
    num("age", "Age", "years"),
    pick("systolic_low", "Systolic blood pressure below 100 mmHg", [opt("No", 0), opt("Yes", 3)]),
    pick("heart_rate_high", "Heart rate above 100 bpm", [opt("No", 0), opt("Yes", 2)]),
    pick("killip_ii_iv", "Killip class II–IV", [opt("No", 0), opt("Yes", 2)]),
    pick("anterior_or_lbbb", "Anterior ST elevation or left bundle branch block", [opt("No", 0), opt("Yes", 1)]),
    pick("risk_history", "History of diabetes, hypertension or angina", [opt("No", 0), opt("Yes", 1)]),
    pick("weight_low", "Weight below 67 kg", [opt("No", 0), opt("Yes", 1)]),
    pick("time_to_treatment", "Time to treatment more than 4 hours", [opt("No", 0), opt("Yes", 1)]),
  ],
  compute: (v) => {
    const missing = [];
    const items = [];
    if (isNum(v.age)) {
      const p = pointsFor(v.age, [
        { max: 64, points: 0 },
        { max: 74, points: 2 },
        { max: undefined, points: 3 },
      ]);
      items.push({ label: "Age", value: `${v.age} years`, points: p });
    } else missing.push("Age");
    ["systolic_low", "heart_rate_high", "killip_ii_iv", "anterior_or_lbbb", "risk_history", "weight_low", "time_to_treatment"].forEach(
      (key, i) => {
        const def = TIMI_STEMI.variables[1 + i];
        if (isSet(v[key])) items.push({ label: def.label, value: v[key], points: pickPoints(def, v[key]) });
        else missing.push(def.label);
      }
    );
    if (missing.length) return { missing };
    const total = items.reduce((s, i) => s + i.points, 0);
    const risk = { 0: "0.8", 1: "1.6", 2: "2.2", 3: "4.4", 4: "7.3", 5: "12.4", 6: "16.1", 7: "23.4", 8: "26.8", 9: "32.8", 10: "35.9" }[total] || "35.9";
    const band =
      total <= 2
        ? { label: "Low risk", tone: "success", note: `30-day mortality approximately ${risk}%.` }
        : total <= 4
        ? { label: "Intermediate risk", tone: "warning", note: `30-day mortality approximately ${risk}% — closer monitoring and prompt reperfusion are indicated.` }
        : { label: "High risk", tone: "critical", note: `30-day mortality approximately ${risk}% — highest-risk group; reperfusion and intensive care planning required.` };
    return { total, items, band, mortality: `${risk}%` };
  },
  indicates: (values) => /^ST-elevation myocardial infarction/i.test(values.acs_classification || ""),
};

// ---- 5. CHA₂DS₂-VA / CHA₂DS₂-VASc ----------------------------------------
const CHA2DS2 = {
  key: "cha2ds2",
  name: "CHA₂DS₂-VA score (with CHA₂DS₂-VASc for comparison)",
  short: "CHA₂DS₂-VA",
  purpose: "Stroke risk in atrial fibrillation, used to decide anticoagulation. The ESC 2024 atrial fibrillation guideline uses CHA₂DS₂-VA — the same score with the sex category removed, because female sex is a risk modifier rather than a risk factor.",
  population: "Atrial fibrillation or atrial flutter, where anticoagulation is being considered.",
  source: {
    organization: "ESC",
    title: "ESC Guidelines for the management of atrial fibrillation (CHA₂DS₂-VA); original VASc score: Lip et al., Chest 2010",
    version: "2024",
    url: "https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/Atrial-Fibrillation",
  },
  max: 9,
  variables: [
    pick("heart_failure", "Congestive heart failure or left ventricular dysfunction", [opt("No", 0), opt("Yes", 1)]),
    pick("hypertension", "Hypertension — treated or untreated", [opt("No", 0), opt("Yes", 1)]),
    num("age", "Age", "years"),
    pick("diabetes", "Diabetes mellitus", [opt("No", 0), opt("Yes", 1)]),
    pick("stroke", "Prior stroke, transient ischaemic attack or thromboembolism", [opt("No", 0), opt("Yes", 2)]),
    pick("vascular_disease", "Vascular disease — myocardial infarction, peripheral artery disease, aortic plaque", [opt("No", 0), opt("Yes", 1)]),
    pick("sex", "Sex category (used for CHA₂DS₂-VASc only)", [opt("Male", 0), opt("Female", 1)]),
  ],
  compute: (v) => {
    const missing = [];
    const items = [];
    ["heart_failure", "hypertension", "diabetes", "stroke", "vascular_disease", "sex"].forEach((key) => {
      const def = CHA2DS2.variables.find((x) => x.key === key);
      if (isSet(v[key])) items.push({ label: def.label, value: v[key], points: pickPoints(def, v[key]) });
      else if (key !== "sex") missing.push(def.label);
    });
    if (isNum(v.age)) {
      const p = pointsFor(v.age, [
        { max: 64, points: 0 },
        { max: 74, points: 1 },
        { max: undefined, points: 2 },
      ]);
      items.push({ label: "Age", value: `${v.age} years`, points: p });
    } else missing.push("Age");
    if (missing.length) return { missing };

    const va = items.filter((i) => !/Sex category/.test(i.label)).reduce((s, i) => s + i.points, 0);
    const vasc = va + (isSet(v.sex) ? pickPoints(CHA2DS2.variables[6], v.sex) : 0);
    const band =
      va === 0
        ? { label: "Low risk", tone: "success", note: "No CHA₂DS₂-VA risk factors — anticoagulation is not recommended on stroke-risk grounds." }
        : va === 1
        ? { label: "Intermediate risk", tone: "warning", note: "One CHA₂DS₂-VA risk factor — anticoagulation should be considered, taking the bleeding risk and patient preference into account." }
        : { label: "High risk", tone: "critical", note: "Two or more CHA₂DS₂-VA risk factors — oral anticoagulation is recommended in the absence of a contraindication." };
    return {
      total: va,
      secondary: isSet(v.sex) ? { label: "CHA₂DS₂-VASc", total: vasc } : null,
      items,
      band,
      primaryLabel: "CHA₂DS₂-VA",
    };
  },
  indicates: (values) => /^Atrial fibrillation/i.test(values.rhythm_diagnosis || ""),
};

// ---- 6. HAS-BLED ---------------------------------------------------------
const HAS_BLED = {
  key: "has_bled",
  name: "HAS-BLED score",
  short: "HAS-BLED",
  purpose: "Bleeding risk on anticoagulation, used to identify and correct MODIFIABLE bleeding risk factors — not to withhold anticoagulation.",
  population: "Atrial fibrillation where anticoagulation is being considered or reviewed.",
  source: {
    organization: "Pisters et al., Chest",
    title: "A novel user-friendly score (HAS-BLED) to assess one-year risk of major bleeding",
    version: "2010",
    url: "https://journal.chestnet.org/article/S0012-3692(10)60347-9/fulltext",
  },
  max: 9,
  variables: [
    pick("hypertension", "Uncontrolled hypertension — systolic above 160 mmHg", [opt("No", 0), opt("Yes", 1)]),
    pick("renal", "Abnormal renal function", [opt("No", 0), opt("Yes", 1)]),
    pick("liver", "Abnormal liver function", [opt("No", 0), opt("Yes", 1)]),
    pick("stroke", "Prior stroke", [opt("No", 0), opt("Yes", 1)]),
    pick("bleeding", "Bleeding history or predisposition", [opt("No", 0), opt("Yes", 1)]),
    pick("labile_inr", "Labile international normalised ratio", [opt("No", 0), opt("Yes", 1)]),
    pick("elderly", "Age above 65 years", [opt("No", 0), opt("Yes", 1)]),
    pick("drugs", "Concomitant antiplatelet or non-steroidal drug use", [opt("No", 0), opt("Yes", 1)]),
    pick("alcohol", "Alcohol excess", [opt("No", 0), opt("Yes", 1)]),
  ],
  compute: (v) => computeBooleanScore(v, HAS_BLED, (total) => ({
    band:
      total <= 2
        ? { label: "Low to moderate bleeding risk", tone: "success", note: "No high bleeding risk identified by this score; modifiable factors should still be reviewed." }
        : { label: "High bleeding risk", tone: "warning", note: "Three or more — address the modifiable factors (blood pressure, concomitant antiplatelet or non-steroidal drugs, alcohol, labile INR) and review more closely. A high score is not by itself a reason to withhold anticoagulation." },
  })),
  indicates: (values) => /^Atrial fibrillation/i.test(values.rhythm_diagnosis || ""),
};

// ---- 7. DAPT score -------------------------------------------------------
const DAPT = {
  key: "dapt",
  name: "DAPT score",
  short: "DAPT",
  purpose: "Whether prolonged dual antiplatelet therapy beyond 12 months is likely to be beneficial after percutaneous coronary intervention.",
  population: "After percutaneous coronary intervention with a drug-eluting stent, deciding duration of dual antiplatelet therapy.",
  source: {
    organization: "Yeh et al., JAMA (DAPT Study)",
    title: "Development and validation of a prediction rule for benefit and harm of dual antiplatelet therapy beyond 1 year after PCI",
    version: "2016",
    url: "https://jamanetwork.com/journals/jama/fullarticle/2516160",
  },
  max: 10,
  variables: [
    num("age", "Age", "years"),
    pick("smoker", "Current smoker", [opt("No", 0), opt("Yes", 1)]),
    pick("diabetes", "Diabetes mellitus", [opt("No", 0), opt("Yes", 1)]),
    pick("mi_presentation", "Myocardial infarction at presentation", [opt("No", 0), opt("Yes", 1)]),
    pick("prior_pci_or_mi", "Prior percutaneous coronary intervention or prior myocardial infarction", [opt("No", 0), opt("Yes", 1)]),
    pick("stent_small", "Stent diameter below 3 mm", [opt("No", 0), opt("Yes", 1)]),
    pick("paclitaxel_stent", "Paclitaxel-eluting stent", [opt("No", 0), opt("Yes", 1)]),
    pick("heart_failure", "Heart failure or left ventricular ejection fraction below 30%", [opt("No", 0), opt("Yes", 2)]),
    pick("vein_graft", "Percutaneous coronary intervention of a vein graft", [opt("No", 0), opt("Yes", 2)]),
  ],
  compute: (v) => {
    const missing = [];
    const items = [];
    if (isNum(v.age)) {
      const p = pointsFor(v.age, [
        { max: 64, points: 1 },
        { max: 74, points: 0 },
        { max: undefined, points: -2 },
      ]);
      items.push({ label: "Age", value: `${v.age} years`, points: p });
    } else missing.push("Age");
    DAPT.variables.slice(1).forEach((def) => {
      if (isSet(v[def.key])) items.push({ label: def.label, value: v[def.key], points: pickPoints(def, v[def.key]) });
      else missing.push(def.label);
    });
    if (missing.length) return { missing };
    const total = items.reduce((s, i) => s + i.points, 0);
    const band =
      total >= 2
        ? { label: "Favours prolonged dual antiplatelet therapy", tone: "warning", note: "Score of 2 or more — the DAPT Study found reduced ischaemic events with continued thienopyridine beyond 12 months, at the cost of more bleeding. The decision remains individual." }
        : { label: "Favours standard duration", tone: "success", note: "Score below 2 — ischaemic benefit beyond 12 months did not outweigh bleeding risk in the DAPT Study. The decision remains individual." };
    return { total, items, band, allowsNegative: true };
  },
  indicates: (values) =>
    /Percutaneous coronary intervention/i.test(values.revascularisation_performed || "") ||
    /percutaneous/i.test(values.revascularisation_status || ""),
};

// ---- 8. PRECISE-DAPT (externally calculated) -----------------------------
const PRECISE_DAPT = {
  key: "precise_dapt",
  name: "PRECISE-DAPT score",
  short: "PRECISE-DAPT",
  purpose: "Out-of-hospital bleeding risk during dual antiplatelet therapy, used to shorten treatment duration in patients at high bleeding risk.",
  population: "After percutaneous coronary intervention, deciding duration of dual antiplatelet therapy.",
  source: {
    organization: "Costa et al., Lancet (PRECISE-DAPT)",
    title: "Derivation and validation of the predicting bleeding complications in patients undergoing stent implantation and subsequent dual antiplatelet therapy score",
    version: "2017",
    url: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(17)30397-5/fulltext",
  },
  external: true,
  externalNote:
    "The published score is a nomogram over five variables (age, creatinine clearance, haemoglobin, white cell count, prior spontaneous bleeding). AMedix records the five documented inputs and the value read from the published calculator, with its source — it does not re-derive the weighting.",
  max: undefined,
  variables: [
    num("age", "Age", "years"),
    num("creatinine_clearance", "Creatinine clearance", "mL/min"),
    num("haemoglobin", "Haemoglobin", "g/dL", { step: "0.1" }),
    num("white_cell_count", "White cell count", "×10⁹/L", { step: "0.1" }),
    pick("prior_bleeding", "Prior spontaneous bleeding", [opt("No", 0), opt("Yes", 1)]),
    num("score", "Score read from the published calculator", "points"),
    { key: "source_note", label: "Calculator or source used", type: "input" },
  ],
  compute: (v) => {
    const inputs = [
      ["age", "Age", "years"],
      ["creatinine_clearance", "Creatinine clearance", "mL/min"],
      ["haemoglobin", "Haemoglobin", "g/dL"],
      ["white_cell_count", "White cell count", "×10⁹/L"],
      ["prior_bleeding", "Prior spontaneous bleeding", ""],
    ];
    const missing = inputs.filter(([key]) => !isSet(v[key])).map(([, label]) => label);
    if (!isNum(v.score)) missing.push("Score read from the published calculator");
    if (missing.length) return { missing, external: true };
    const total = Number(v.score);
    const band =
      total >= 25
        ? { label: "High bleeding risk", tone: "critical", note: "25 or more — a shortened dual antiplatelet duration is suggested by the PRECISE-DAPT derivation; the decision remains with the treating team." }
        : { label: "Not at high bleeding risk", tone: "success", note: "Below 25 — standard duration dual antiplatelet therapy is not restricted by this score." };
    return {
      total,
      external: true,
      items: inputs
        .filter(([key]) => isSet(v[key]))
        .map(([key, label, unit]) => ({ label, value: `${v[key]} ${unit}`.trim(), points: null })),
      band,
    };
  },
  indicates: (values) => /Percutaneous coronary intervention/i.test(values.revascularisation_performed || ""),
};

// ---- 9. ACC/AHA heart failure stage (clinician-confirmed) ----------------
const HF_STAGE = {
  key: "hf_stage",
  name: "ACC/AHA heart failure stage",
  short: "ACC/AHA stage",
  purpose: "Structural staging of heart failure, from at-risk through structural disease to advanced disease. The stage is assigned by the clinician, and AMedix only shows what the documented findings support.",
  population: "Any patient with, or at risk of, heart failure.",
  source: {
    organization: "ACC/AHA/HFSA",
    title: "Guideline for the Management of Heart Failure — stages of heart failure",
    version: "2022",
    url: "https://www.acc.org/Guidelines",
  },
  max: 4,
  variables: [
    pick("structural_disease", "Structural or functional cardiac abnormality documented", [opt("No documented abnormality", 0), opt("Documented abnormality — reduced ejection fraction, hypertrophy, valve disease or raised filling pressures", 1)]),
    pick("symptoms", "Current or previous heart-failure symptoms", [opt("No symptoms of heart failure", 0), opt("Symptoms documented now or previously", 1)]),
    pick("advanced", "Advanced disease — refractory symptoms despite optimised therapy", [opt("No", 0), opt("Yes", 1)]),
  ],
  compute: (v) => {
    const missing = [];
    if (!isSet(v.structural_disease)) missing.push("Structural or functional cardiac abnormality documented");
    if (!isSet(v.symptoms)) missing.push("Current or previous heart-failure symptoms");
    if (!isSet(v.advanced)) missing.push("Advanced disease");
    if (missing.length) return { missing };

    const structural = pickPoints(HF_STAGE.variables[0], v.structural_disease) === 1;
    const symptomatic = pickPoints(HF_STAGE.variables[1], v.symptoms) === 1;
    const advanced = pickPoints(HF_STAGE.variables[2], v.advanced) === 1;
    const stage = advanced && structural && symptomatic ? "D" : structural && symptomatic ? "C" : structural ? "B" : "A";
    const note = {
      A: "At risk of heart failure — risk factors present, no structural disease and no symptoms. Risk-factor treatment is the intervention; the stage is not a diagnosis of heart failure.",
      B: "Pre-heart-failure — structural or functional abnormality documented without symptoms. Treatment aims to prevent progression.",
      C: "Symptomatic heart failure — structural disease with current or previous symptoms. Guideline-directed therapy applies.",
      D: "Advanced heart failure — refractory symptoms despite optimised therapy; specialist and advanced-therapy assessment is required.",
    }[stage];
    return {
      total: stage === "A" ? 1 : stage === "B" ? 2 : stage === "C" ? 3 : 4,
      display: `Stage ${stage}`,
      band: { label: `ACC/AHA Stage ${stage}`, tone: stage === "D" ? "critical" : stage === "C" ? "warning" : "success", note },
      clinicianConfirms: true,
    };
  },
  indicates: (values) => isSet(values.hf_phenotype) && !/Not applicable|Not assessed/i.test(values.hf_phenotype),
};

// ---- shared helpers ------------------------------------------------------
function pickPoints(def, value) {
  const found = (def.options || []).find((o) => o.value === value);
  return found ? found.points : 0;
}

function computeBooleanScore(v, def, decorate) {
  const missing = [];
  const items = [];
  def.variables.forEach((d) => {
    if (isSet(v[d.key])) items.push({ label: d.label, value: v[d.key], points: pickPoints(d, v[d.key]) });
    else missing.push(d.label);
  });
  if (missing.length) return { missing };
  const total = items.reduce((s, i) => s + i.points, 0);
  return { total, items, max: def.max, ...decorate(total) };
}

export const CARDIOLOGY_SCORES = [HEART, GRACE, TIMI_NSTEMI, TIMI_STEMI, CHA2DS2, HAS_BLED, DAPT, PRECISE_DAPT, HF_STAGE];
const BY_KEY = new Map(CARDIOLOGY_SCORES.map((s) => [s.key, s]));
export const getCardiologyScore = (key) => BY_KEY.get(key) || null;

// The scores whose population matches what has been documented in this note.
export const indicatedScores = (values = {}) =>
  CARDIOLOGY_SCORES.filter((s) => {
    try {
      return typeof s.indicates === "function" && s.indicates(values);
    } catch {
      return false;
    }
  }).map((s) => s.key);

export function calculateScore(key, vars = {}) {
  const def = getCardiologyScore(key);
  if (!def) return null;
  return def.compute(vars || {});
}

// Readable text stored with the note and printed in the PDF.
export function formatCardiologyScores(value) {
  if (!value || typeof value !== "object") return "";
  const entries = value.entries || {};
  const keys = Object.keys(entries);
  if (!keys.length) return "";
  const lines = ["Cardiology clinical scores calculated from the findings documented in this note:"];
  keys.forEach((key) => {
    const def = getCardiologyScore(key);
    if (!def) return;
    const result = calculateScore(key, entries[key]);
    if (!result) return;
    lines.push(`${def.name}`);
    if (result.missing && result.missing.length) {
      lines.push(
        `   Not calculated — insufficient documented information. Missing: ${result.missing.join(", ")}. No score is estimated.`
      );
    } else {
      const totalText = result.display || `${result.total}${def.max ? ` of ${def.max}` : ""}`;
      lines.push(`   Score: ${totalText}${result.primaryLabel ? ` (${result.primaryLabel})` : ""}`);
      if (result.secondary) lines.push(`   ${result.secondary.label}: ${result.secondary.total}`);
      (result.items || []).forEach((i) =>
        lines.push(`   · ${i.label}: ${i.value}${i.points === null || i.points === undefined ? "" : ` (${i.points > 0 ? "+" : ""}${i.points})`}`)
      );
      if (result.mortality) lines.push(`   Reported mortality for this score: ${result.mortality}`);
      if (result.band) {
        lines.push(`   Interpretation: ${result.band.label} — ${result.band.note}`);
        if (result.band.tone === "critical" || result.clinicianConfirms)
          lines.push("   Clinician confirmation of this interpretation is recorded in the assessment.");
      }
    }
    lines.push(`   Source: ${def.source.organization} — ${def.source.title}, ${def.source.version} (${def.source.url})`);
    if (def.external) lines.push(`   ${def.externalNote}`);
  });
  if (String(value.clinical_use || "").trim())
    lines.push(`How the scores informed the decision: ${String(value.clinical_use).trim()}`);
  lines.push("Scores support a clinical decision and do not make it.");
  return lines.join("\n");
}