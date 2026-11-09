// Internal Medicine — validated instruments and bedside calculations.
//
// Every score is computed ONLY from values documented in the note. A missing item
// leaves the score uncalculated and names exactly what is missing: nothing is
// estimated, defaulted or inferred, and a blank is never read as zero or as normal.
//
// The item wording and weights belong to the published instrument named beside each
// score. Only the score and its published interpretation bands are produced — no
// probability, prognosis or treatment recommendation is invented, and a score is a
// documented observation, never a diagnosis.

import { asObject, num } from "@/lib/fmFieldKit";
import { FM_SCORES, fmScore, calculateFmScore } from "@/lib/fmScores";

const YN = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const SEX = [
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
];

// A documented flag: returns 1/0, or marks the item missing when it was not answered.
const flag = (v, key, label, points = 1, missing) => {
  if (v === "Yes") return points;
  if (v === "No") return 0;
  missing.push(label);
  return 0;
};

const band = (value, bands, fallback) => {
  for (const b of bands) if (value <= b.max) return b.label;
  return fallback;
};

// ---------------------------------------------------------------- registry
export const IM_ONLY_SCORES = [
  {
    key: "cha2ds2_vasc",
    name: "CHA₂DS₂-VASc — stroke risk in atrial fibrillation",
    purpose: "Stroke risk factors in non-valvular atrial fibrillation, as published",
    population: "Adults with atrial fibrillation; not a bleeding score and not a treatment decision",
    source: {
      organization: "AHA/ACC and ESC atrial fibrillation guidance",
      title: "CHA₂DS₂-VASc stroke risk scheme",
      url: "https://www.acc.org/Guidelines",
    },
    variables: [
      { key: "chf", label: "Congestive heart failure", type: "select", options: YN },
      { key: "hypertension", label: "Hypertension", type: "select", options: YN },
      { key: "age", label: "Age", type: "number", unit: "years", min: 18, max: 120 },
      { key: "diabetes", label: "Diabetes mellitus", type: "select", options: YN },
      { key: "stroke", label: "Previous stroke, TIA or thromboembolism", type: "select", options: YN },
      { key: "vascular", label: "Vascular disease (MI, PAD, aortic plaque)", type: "select", options: YN },
      { key: "sex", label: "Sex", type: "select", options: SEX },
    ],
    calculate: (v) => {
      const missing = [];
      const age = num(v.age);
      let points = 0;
      points += flag(v.chf, "chf", "Congestive heart failure", 1, missing);
      points += flag(v.hypertension, "hypertension", "Hypertension", 1, missing);
      points += flag(v.diabetes, "diabetes", "Diabetes mellitus", 1, missing);
      points += flag(v.stroke, "stroke", "Previous stroke, TIA or thromboembolism", 2, missing);
      points += flag(v.vascular, "vascular", "Vascular disease", 1, missing);
      if (age === null) missing.push("Age");
      else if (age >= 75) points += 2;
      else if (age >= 65) points += 1;
      if (v.sex === "Female") points += 1;
      else if (v.sex !== "Male") missing.push("Sex");
      if (missing.length) return { missing };
      return {
        value: points,
        unit: "points",
        band: `CHA₂DS₂-VASc ${points} — the stroke risk rises with the score. The cited guideline states the score at which anticoagulation should be considered; the decision, and the reason for it, belong in the record.`,
        missing,
      };
    },
  },
  {
    key: "has_bled",
    name: "HAS-BLED — bleeding risk on anticoagulation",
    purpose: "Major bleeding risk factors in atrial fibrillation, as published",
    population: "Adults being considered for or taking anticoagulation",
    source: {
      organization: "ESC and AHA/ACC atrial fibrillation guidance",
      title: "HAS-BLED bleeding risk scheme",
      url: "https://www.escardio.org/Guidelines",
    },
    variables: [
      { key: "hypertension", label: "Uncontrolled hypertension (systolic >160 mmHg)", type: "select", options: YN },
      { key: "renal", label: "Abnormal renal function", type: "select", options: YN },
      { key: "liver", label: "Abnormal liver function", type: "select", options: YN },
      { key: "stroke", label: "Previous stroke", type: "select", options: YN },
      { key: "bleeding", label: "Previous major bleeding or predisposition", type: "select", options: YN },
      { key: "labile_inr", label: "Labile INR (if on a vitamin K antagonist)", type: "select", options: [...YN, { value: "Not applicable", label: "Not applicable — not on a vitamin K antagonist" }] },
      { key: "age", label: "Age", type: "number", unit: "years", min: 18, max: 120 },
      { key: "drugs", label: "Concomitant antiplatelet or NSAID use", type: "select", options: YN },
      { key: "alcohol", label: "Alcohol excess (≥8 units/week)", type: "select", options: YN },
    ],
    calculate: (v) => {
      const missing = [];
      let points = 0;
      points += flag(v.hypertension, "hypertension", "Uncontrolled hypertension", 1, missing);
      points += flag(v.renal, "renal", "Abnormal renal function", 1, missing);
      points += flag(v.liver, "liver", "Abnormal liver function", 1, missing);
      points += flag(v.stroke, "stroke", "Previous stroke", 1, missing);
      points += flag(v.bleeding, "bleeding", "Previous major bleeding", 1, missing);
      if (v.labile_inr === "Yes") points += 1;
      else if (v.labile_inr !== "No" && v.labile_inr !== "Not applicable") missing.push("Labile INR");
      const age = num(v.age);
      if (age === null) missing.push("Age");
      else if (age > 65) points += 1;
      points += flag(v.drugs, "drugs", "Concomitant antiplatelet or NSAID use", 1, missing);
      points += flag(v.alcohol, "alcohol", "Alcohol excess", 1, missing);
      if (missing.length) return { missing };
      return {
        value: points,
        unit: "points",
        band:
          points >= 3
            ? `HAS-BLED ${points} — a higher bleeding risk. The cited guideline advises addressing the modifiable factors and reviewing more often; a high score is not on its own a reason to withhold anticoagulation.`
            : `HAS-BLED ${points} — the cited guideline advises reviewing the modifiable bleeding-risk factors at each review.`,
        missing,
      };
    },
  },
  {
    key: "curb65",
    name: "CURB-65 — pneumonia severity",
    purpose: "Severity of community-acquired pneumonia at first assessment",
    population: "Adults with community-acquired pneumonia",
    source: {
      organization: "ATS / BTS and NICE pneumonia guidance",
      title: "CURB-65 severity assessment",
      url: "https://www.nice.org.uk/guidance",
    },
    variables: [
      { key: "confusion", label: "New confusion", type: "select", options: YN },
      { key: "urea", label: "Blood urea", type: "number", unit: "mmol/L", min: 0.5, max: 60 },
      { key: "rr", label: "Respiratory rate", type: "number", unit: "/min", min: 4, max: 70 },
      { key: "sbp", label: "Systolic blood pressure", type: "number", unit: "mmHg", min: 40, max: 260 },
      { key: "dbp", label: "Diastolic blood pressure", type: "number", unit: "mmHg", min: 20, max: 160 },
      { key: "age", label: "Age", type: "number", unit: "years", min: 18, max: 120 },
    ],
    calculate: (v) => {
      const missing = [];
      let points = 0;
      points += flag(v.confusion, "confusion", "New confusion", 1, missing);
      const urea = num(v.urea);
      const rr = num(v.rr);
      const sbp = num(v.sbp);
      const dbp = num(v.dbp);
      const age = num(v.age);
      if (urea === null) missing.push("Blood urea");
      else if (urea > 7) points += 1;
      if (rr === null) missing.push("Respiratory rate");
      else if (rr >= 30) points += 1;
      if (sbp === null) missing.push("Systolic blood pressure");
      else if (sbp < 90) points += 1;
      if (dbp === null) missing.push("Diastolic blood pressure");
      else if (dbp <= 60) points += 1;
      if (age === null) missing.push("Age");
      else if (age >= 65) points += 1;
      if (missing.length) return { missing };
      const label =
        points <= 1
          ? "lower severity — the cited guidance considers home treatment where the clinical picture allows"
          : points === 2
            ? "moderate severity — the cited guidance considers supervised treatment"
            : "high severity — the cited guidance considers inpatient assessment and review for critical care";
      return {
        value: points,
        unit: "points",
        band: `CURB-65 ${points} — ${label}. The score describes severity; it does not decide the site of care on its own.`,
        missing,
      };
    },
  },
  {
    key: "psi_port",
    name: "PSI / PORT — pneumonia severity index",
    purpose: "30-day mortality risk class in community-acquired pneumonia",
    population: "Adults with community-acquired pneumonia",
    source: {
      organization: "ATS and NICE pneumonia guidance",
      title: "Pneumonia Severity Index (Fine criteria)",
      url: "https://www.thoracic.org/statements/",
    },
    variables: [
      { key: "age", label: "Age", type: "number", unit: "years", min: 18, max: 120 },
      { key: "sex", label: "Sex", type: "select", options: SEX },
      { key: "nursing_home", label: "Nursing home resident", type: "select", options: YN },
      { key: "neoplastic", label: "Neoplastic disease", type: "select", options: YN },
      { key: "liver", label: "Liver disease", type: "select", options: YN },
      { key: "chf", label: "Congestive heart failure", type: "select", options: YN },
      { key: "cva", label: "Cerebrovascular disease", type: "select", options: YN },
      { key: "renal", label: "Renal disease", type: "select", options: YN },
      { key: "ams", label: "Altered mental status", type: "select", options: YN },
      { key: "rr", label: "Respiratory rate", type: "number", unit: "/min", min: 4, max: 70 },
      { key: "sbp", label: "Systolic blood pressure", type: "number", unit: "mmHg", min: 40, max: 260 },
      { key: "temp", label: "Temperature", type: "number", unit: "°C", min: 30, max: 44 },
      { key: "hr", label: "Heart rate", type: "number", unit: "/min", min: 20, max: 240 },
      { key: "ph", label: "Arterial pH", type: "number", min: 6.5, max: 7.8 },
      { key: "bun", label: "Blood urea nitrogen", type: "number", unit: "mg/dL", min: 1, max: 250 },
      { key: "sodium", label: "Sodium", type: "number", unit: "mmol/L", min: 90, max: 190 },
      { key: "glucose", label: "Glucose", type: "number", unit: "mg/dL", min: 10, max: 900 },
      { key: "hct", label: "Haematocrit", type: "number", unit: "%", min: 10, max: 70 },
      { key: "pao2", label: "PaO₂", type: "number", unit: "mmHg", min: 20, max: 600 },
      { key: "effusion", label: "Pleural effusion on imaging", type: "select", options: YN },
    ],
    calculate: (v) => {
      const missing = [];
      const age = num(v.age);
      if (age === null) missing.push("Age");
      if (v.sex !== "Female" && v.sex !== "Male") missing.push("Sex");
      let points = 0;
      if (age !== null) points += v.sex === "Female" ? Math.max(age - 10, 0) : age;
      points += flag(v.nursing_home, "nursing_home", "Nursing home resident", 10, missing);
      points += flag(v.neoplastic, "neoplastic", "Neoplastic disease", 30, missing);
      points += flag(v.liver, "liver", "Liver disease", 20, missing);
      points += flag(v.chf, "chf", "Congestive heart failure", 10, missing);
      points += flag(v.cva, "cva", "Cerebrovascular disease", 10, missing);
      points += flag(v.renal, "renal", "Renal disease", 10, missing);
      points += flag(v.ams, "ams", "Altered mental status", 20, missing);
      const rr = num(v.rr);
      const sbp = num(v.sbp);
      const temp = num(v.temp);
      const hr = num(v.hr);
      const ph = num(v.ph);
      const bun = num(v.bun);
      const sodium = num(v.sodium);
      const glucose = num(v.glucose);
      const hct = num(v.hct);
      const pao2 = num(v.pao2);
      if (rr === null) missing.push("Respiratory rate");
      else if (rr >= 30) points += 20;
      if (sbp === null) missing.push("Systolic blood pressure");
      else if (sbp < 90) points += 20;
      if (temp === null) missing.push("Temperature");
      else if (temp < 35 || temp >= 40) points += 15;
      if (hr === null) missing.push("Heart rate");
      else if (hr >= 125) points += 10;
      if (ph === null) missing.push("Arterial pH");
      else if (ph < 7.35) points += 30;
      if (bun === null) missing.push("Blood urea nitrogen");
      else if (bun >= 30) points += 20;
      if (sodium === null) missing.push("Sodium");
      else if (sodium < 130) points += 20;
      if (glucose === null) missing.push("Glucose");
      else if (glucose >= 250) points += 10;
      if (hct === null) missing.push("Haematocrit");
      else if (hct < 30) points += 10;
      if (pao2 === null) missing.push("PaO₂");
      else if (pao2 < 60) points += 10;
      points += flag(v.effusion, "effusion", "Pleural effusion", 10, missing);
      if (missing.length) return { missing };
      const noPredictors = points === (v.sex === "Female" ? Math.max(age - 10, 0) : age);
      let cls = "V";
      if (age <= 50 && noPredictors) cls = "I";
      else if (points <= 70) cls = "II";
      else if (points <= 90) cls = "III";
      else if (points <= 130) cls = "IV";
      return {
        value: points,
        unit: "points",
        band: `PSI class ${cls} (${points} points) — the class describes 30-day mortality risk as published. The cited guidance weighs it with the clinical picture and social circumstances; it does not admit or discharge the patient.`,
        missing,
      };
    },
  },
  {
    key: "wells_pe",
    name: "Wells score — pulmonary embolism",
    purpose: "Clinical probability of pulmonary embolism",
    population: "Adults with suspected pulmonary embolism",
    source: {
      organization: "CHEST / AHA and NICE venous thromboembolism guidance",
      title: "Wells score for pulmonary embolism",
      url: "https://www.chestnet.org/Guidelines-and-Resources/Guidelines-and-Consensus-Statements",
    },
    variables: [
      { key: "dvt_signs", label: "Clinical signs of DVT", type: "select", options: YN },
      { key: "pe_likely", label: "PE more likely than an alternative diagnosis", type: "select", options: YN },
      { key: "hr", label: "Heart rate", type: "number", unit: "/min", min: 20, max: 240 },
      { key: "immobilisation", label: "Immobilisation ≥3 days or surgery in the previous 4 weeks", type: "select", options: YN },
      { key: "previous_vte", label: "Previous DVT or PE", type: "select", options: YN },
      { key: "haemoptysis", label: "Haemoptysis", type: "select", options: YN },
      { key: "malignancy", label: "Active malignancy", type: "select", options: YN },
    ],
    calculate: (v) => {
      const missing = [];
      let points = 0;
      points += flag(v.dvt_signs, "dvt_signs", "Clinical signs of DVT", 3, missing);
      points += flag(v.pe_likely, "pe_likely", "PE more likely than an alternative diagnosis", 3, missing);
      const hr = num(v.hr);
      if (hr === null) missing.push("Heart rate");
      else if (hr > 100) points += 1.5;
      points += flag(v.immobilisation, "immobilisation", "Immobilisation or recent surgery", 1.5, missing);
      points += flag(v.previous_vte, "previous_vte", "Previous DVT or PE", 1.5, missing);
      points += flag(v.haemoptysis, "haemoptysis", "Haemoptysis", 1, missing);
      points += flag(v.malignancy, "malignancy", "Active malignancy", 1, missing);
      if (missing.length) return { missing };
      return {
        value: points,
        unit: "points",
        band:
          points > 4
            ? `Wells ${points} — PE likely in the two-tier scheme. The cited pathway states the next diagnostic step; it does not confirm or exclude PE.`
            : `Wells ${points} — PE unlikely in the two-tier scheme. The cited pathway applies the D-dimer rule to this group; it does not exclude PE on its own.`,
        missing,
      };
    },
  },
  {
    key: "wells_dvt",
    name: "Wells score — deep vein thrombosis",
    purpose: "Clinical probability of lower-limb deep vein thrombosis",
    population: "Adults with suspected DVT",
    source: {
      organization: "NICE and CHEST venous thromboembolism guidance",
      title: "Wells score for deep vein thrombosis",
      url: "https://www.nice.org.uk/guidance",
    },
    variables: [
      { key: "cancer", label: "Active cancer", type: "select", options: YN },
      { key: "paralysis", label: "Paralysis, paresis or recent plaster immobilisation", type: "select", options: YN },
      { key: "bedridden", label: "Bedridden >3 days or major surgery within 12 weeks", type: "select", options: YN },
      { key: "tenderness", label: "Tenderness along the deep venous system", type: "select", options: YN },
      { key: "swelling", label: "Entire leg swollen", type: "select", options: YN },
      { key: "calf", label: "Calf swelling >3 cm compared with the other leg", type: "select", options: YN },
      { key: "oedema", label: "Pitting oedema confined to the symptomatic leg", type: "select", options: YN },
      { key: "collateral", label: "Collateral superficial veins", type: "select", options: YN },
      { key: "previous_dvt", label: "Previously documented DVT", type: "select", options: YN },
      { key: "alternative", label: "An alternative diagnosis is at least as likely", type: "select", options: YN },
    ],
    calculate: (v) => {
      const missing = [];
      let points = 0;
      points += flag(v.cancer, "cancer", "Active cancer", 1, missing);
      points += flag(v.paralysis, "paralysis", "Paralysis, paresis or plaster immobilisation", 1, missing);
      points += flag(v.bedridden, "bedridden", "Bedridden or recent major surgery", 1, missing);
      points += flag(v.tenderness, "tenderness", "Tenderness along the deep venous system", 1, missing);
      points += flag(v.swelling, "swelling", "Entire leg swollen", 1, missing);
      points += flag(v.calf, "calf", "Calf swelling >3 cm", 1, missing);
      points += flag(v.oedema, "oedema", "Pitting oedema", 1, missing);
      points += flag(v.collateral, "collateral", "Collateral superficial veins", 1, missing);
      points += flag(v.previous_dvt, "previous_dvt", "Previously documented DVT", 1, missing);
      points += flag(v.alternative, "alternative", "Alternative diagnosis at least as likely", -2, missing);
      if (missing.length) return { missing };
      return {
        value: points,
        unit: "points",
        band:
          points >= 2
            ? `Wells ${points} — DVT likely. The cited pathway states the next imaging step; the score does not confirm DVT.`
            : `Wells ${points} — DVT unlikely. The cited pathway applies the D-dimer rule to this group; the score does not exclude DVT.`,
        missing,
      };
    },
  },
  {
    key: "glasgow_blatchford",
    name: "Glasgow-Blatchford — upper GI bleeding",
    purpose: "Need for intervention in upper gastrointestinal bleeding",
    population: "Adults with suspected upper GI bleeding; not validated in children",
    source: {
      organization: "ACG and NICE upper gastrointestinal bleeding guidance",
      title: "Glasgow-Blatchford score",
      url: "https://gi.org/clinical-guidelines/",
    },
    variables: [
      { key: "urea", label: "Blood urea", type: "number", unit: "mmol/L", min: 0.5, max: 60, hint: "If reported as BUN in mg/dL, divide by 2.8." },
      { key: "hb", label: "Haemoglobin", type: "number", unit: "g/dL", min: 2, max: 22 },
      { key: "sex", label: "Sex", type: "select", options: SEX },
      { key: "sbp", label: "Systolic blood pressure", type: "number", unit: "mmHg", min: 40, max: 260 },
      { key: "hr", label: "Heart rate", type: "number", unit: "/min", min: 20, max: 240 },
      { key: "melaena", label: "Melaena", type: "select", options: YN },
      { key: "syncope", label: "Syncope", type: "select", options: YN },
      { key: "hepatic", label: "Known hepatic disease", type: "select", options: YN },
      { key: "cardiac", label: "Known cardiac failure", type: "select", options: YN },
    ],
    calculate: (v) => {
      const missing = [];
      let points = 0;
      const urea = num(v.urea);
      const hb = num(v.hb);
      const sbp = num(v.sbp);
      const hr = num(v.hr);
      if (urea === null) missing.push("Blood urea");
      else if (urea >= 25) points += 6;
      else if (urea >= 10) points += 4;
      else if (urea >= 8) points += 3;
      else if (urea >= 6.5) points += 2;
      if (v.sex !== "Female" && v.sex !== "Male") missing.push("Sex");
      if (hb === null) missing.push("Haemoglobin");
      else if (v.sex === "Male") {
        if (hb < 10) points += 6;
        else if (hb < 12) points += 3;
        else if (hb < 13) points += 1;
      } else if (v.sex === "Female") {
        if (hb < 10) points += 6;
        else if (hb < 12) points += 1;
      }
      if (sbp === null) missing.push("Systolic blood pressure");
      else if (sbp < 90) points += 3;
      else if (sbp < 100) points += 2;
      else if (sbp < 110) points += 1;
      if (hr === null) missing.push("Heart rate");
      else if (hr >= 100) points += 1;
      points += flag(v.melaena, "melaena", "Melaena", 1, missing);
      points += flag(v.syncope, "syncope", "Syncope", 2, missing);
      points += flag(v.hepatic, "hepatic", "Known hepatic disease", 2, missing);
      points += flag(v.cardiac, "cardiac", "Known cardiac failure", 2, missing);
      if (missing.length) return { missing };
      return {
        value: points,
        unit: "points",
        band:
          points === 0
            ? "Glasgow-Blatchford 0 — the cited guidance considers this group at low risk of needing intervention; the decision remains clinical."
            : `Glasgow-Blatchford ${points} — a higher score indicates a greater need for intervention as published. The cited guidance addresses endoscopy timing and resuscitation; the score does not replace the clinical assessment.`,
        missing,
      };
    },
  },
  {
    key: "child_pugh",
    name: "Child-Pugh — cirrhosis severity",
    purpose: "Severity of cirrhosis and its prognosis as published",
    population: "Adults with cirrhosis",
    source: {
      organization: "AASLD and ACG cirrhosis guidance",
      title: "Child-Pugh classification",
      url: "https://www.aasld.org/practice-guidelines",
    },
    variables: [
      { key: "bilirubin", label: "Bilirubin", type: "number", unit: "µmol/L", min: 1, max: 900 },
      { key: "albumin", label: "Albumin", type: "number", unit: "g/L", min: 5, max: 60 },
      { key: "inr", label: "INR", type: "number", min: 0.5, max: 10 },
      {
        key: "ascites",
        label: "Ascites",
        type: "select",
        options: [
          { value: "None", label: "None" },
          { value: "Mild to moderate", label: "Mild to moderate (controlled medically)" },
          { value: "Severe", label: "Severe (refractory)" },
        ],
      },
      {
        key: "encephalopathy",
        label: "Hepatic encephalopathy",
        type: "select",
        options: [
          { value: "None", label: "None" },
          { value: "Grade 1-2", label: "Grade 1–2" },
          { value: "Grade 3-4", label: "Grade 3–4" },
        ],
      },
    ],
    calculate: (v) => {
      const missing = [];
      let points = 0;
      const bili = num(v.bilirubin);
      const alb = num(v.albumin);
      const inr = num(v.inr);
      if (bili === null) missing.push("Bilirubin");
      else if (bili > 50) points += 3;
      else if (bili >= 34) points += 2;
      else points += 1;
      if (alb === null) missing.push("Albumin");
      else if (alb < 28) points += 3;
      else if (alb <= 35) points += 2;
      else points += 1;
      if (inr === null) missing.push("INR");
      else if (inr > 2.3) points += 3;
      else if (inr >= 1.7) points += 2;
      else points += 1;
      if (!v.ascites) missing.push("Ascites");
      else points += v.ascites === "Severe" ? 3 : v.ascites === "Mild to moderate" ? 2 : 1;
      if (!v.encephalopathy) missing.push("Hepatic encephalopathy");
      else points += v.encephalopathy === "Grade 3-4" ? 3 : v.encephalopathy === "Grade 1-2" ? 2 : 1;
      if (missing.length) return { missing };
      const cls = points <= 6 ? "A" : points <= 9 ? "B" : "C";
      return {
        value: points,
        unit: "points",
        band: `Child-Pugh class ${cls} (${points}) — the class describes severity and prognosis as published. It does not by itself direct treatment, and decompensation must still be documented and managed.`,
        missing,
      };
    },
  },
  {
    key: "meld_na",
    name: "MELD-Na — cirrhosis short-term severity",
    purpose: "Short-term mortality risk in cirrhosis as published",
    population: "Adults ≥12 years with cirrhosis",
    source: {
      organization: "AASLD / UNOS liver allocation guidance",
      title: "MELD-Na score",
      url: "https://www.aasld.org/practice-guidelines",
    },
    variables: [
      { key: "bilirubin", label: "Bilirubin", type: "number", unit: "mg/dL", min: 0.1, max: 60 },
      { key: "inr", label: "INR", type: "number", min: 0.5, max: 10 },
      { key: "creatinine", label: "Creatinine", type: "number", unit: "mg/dL", min: 0.1, max: 20 },
      { key: "sodium", label: "Sodium", type: "number", unit: "mmol/L", min: 100, max: 170 },
      { key: "dialysis", label: "On dialysis at least twice in the past week", type: "select", options: YN },
    ],
    calculate: (v) => {
      const missing = [];
      const bili = num(v.bilirubin);
      const inr = num(v.inr);
      const cr = num(v.creatinine);
      const na = num(v.sodium);
      if (bili === null) missing.push("Bilirubin");
      if (inr === null) missing.push("INR");
      if (cr === null) missing.push("Creatinine");
      if (na === null) missing.push("Sodium");
      if (v.dialysis !== "Yes" && v.dialysis !== "No") missing.push("Dialysis status");
      if (missing.length) return { missing };
      // Published bounds: bilirubin and INR ≥1, creatinine 1–4 (4 if dialysed),
      // sodium 125–137 mmol/L.
      const b = Math.max(bili, 1);
      const i = Math.max(inr, 1);
      const c = v.dialysis === "Yes" ? 4 : Math.min(Math.max(cr, 1), 4);
      const meld = 3.78 * Math.log(b) + 11.2 * Math.log(i) + 9.57 * Math.log(c) + 6.43;
      const naBounded = Math.min(Math.max(na, 125), 137);
      let value = meld + 1.32 * (137 - naBounded) - 0.033 * meld * (137 - naBounded);
      value = Math.round(Math.min(Math.max(value, 6), 40));
      return {
        value,
        unit: "points",
        band: `MELD-Na ${value} — a higher score indicates greater short-term mortality risk as published. Allocation rules differ by jurisdiction; the score is not a transplant decision and does not replace specialist assessment.`,
        missing,
      };
    },
  },
  {
    key: "aki_stage",
    name: "KDIGO — acute kidney injury stage",
    purpose: "Stage of acute kidney injury from a documented baseline",
    population: "Adults and children ≥3 months; requires a baseline creatinine",
    source: {
      organization: "KDIGO",
      title: "KDIGO Clinical Practice Guideline for Acute Kidney Injury — staging",
      url: "https://kdigo.org/guidelines/",
    },
    variables: [
      { key: "baseline_creatinine", label: "Baseline creatinine", type: "number", unit: "mg/dL", min: 0.1, max: 20 },
      { key: "current_creatinine", label: "Current creatinine", type: "number", unit: "mg/dL", min: 0.1, max: 25 },
      { key: "urine_output", label: "Urine output (lowest documented)", type: "number", unit: "mL/kg/h", min: 0, max: 10 },
      { key: "oliguria_hours", label: "Duration of oliguria", type: "number", unit: "hours", min: 0, max: 240 },
      { key: "anuria_hours", label: "Duration of anuria", type: "number", unit: "hours", min: 0, max: 240 },
      { key: "rrt", label: "Renal replacement therapy started", type: "select", options: YN },
    ],
    calculate: (v) => {
      const missing = [];
      const base = num(v.baseline_creatinine);
      const now = num(v.current_creatinine);
      if (base === null) missing.push("Baseline creatinine");
      if (now === null) missing.push("Current creatinine");
      if (v.rrt !== "Yes" && v.rrt !== "No") missing.push("Renal replacement therapy status");
      if (missing.length) return { missing };
      const ratio = now / base;
      const delta = now - base;
      let stage = 0;
      let criterion = "";
      if (ratio >= 3 || now >= 4 || v.rrt === "Yes") {
        stage = 3;
        criterion = ratio >= 3 ? "creatinine ≥3.0× baseline" : now >= 4 ? "creatinine ≥4.0 mg/dL" : "renal replacement therapy started";
      } else if (ratio >= 2) {
        stage = 2;
        criterion = "creatinine 2.0–2.9× baseline";
      } else if (ratio >= 1.5 || delta >= 0.3) {
        stage = 1;
        criterion = ratio >= 1.5 ? "creatinine 1.5–1.9× baseline" : "rise ≥0.3 mg/dL";
      }
      const uo = num(v.urine_output);
      const hours = num(v.oliguria_hours);
      const anuria = num(v.anuria_hours);
      let urineStage = 0;
      if (uo !== null && uo < 0.3 && anuria !== null && anuria >= 12) urineStage = 3;
      else if (uo !== null && uo < 0.3 && hours !== null && hours >= 24) urineStage = 3;
      else if (uo !== null && uo < 0.5 && hours !== null && hours >= 12) urineStage = 2;
      else if (uo !== null && uo < 0.5 && hours !== null && hours >= 6) urineStage = 1;
      const finalStage = Math.max(stage, urineStage);
      if (!finalStage) {
        return {
          value: 0,
          unit: "stage",
          band:
            "No KDIGO AKI definition is met by the values documented (creatinine rise below 1.5× and below 0.3 mg/dL, and no documented oliguria meeting a stage). This is a statement about the documented values only — it does not exclude AKI.",
          missing,
        };
      }
      return {
        value: finalStage,
        unit: "stage",
        band: `KDIGO AKI stage ${finalStage} — ${criterion || "urine-output criterion met"}. The cited guideline addresses removing nephrotoxins, volume status, monitoring and medication review; the stage describes the injury and does not direct treatment by itself.`,
        missing,
      };
    },
  },
  {
    key: "qsofa",
    name: "qSOFA — suspected infection",
    purpose: "Bedside risk markers in a patient with suspected infection",
    population: "Adults with suspected infection (not a stand-alone sepsis screen)",
    source: {
      organization: "IDSA and Surviving Sepsis Campaign guidance",
      title: "qSOFA criteria",
      url: "https://www.idsociety.org/practice-guideline/practice-guidelines/",
    },
    variables: [
      { key: "rr", label: "Respiratory rate", type: "number", unit: "/min", min: 4, max: 70 },
      { key: "sbp", label: "Systolic blood pressure", type: "number", unit: "mmHg", min: 40, max: 260 },
      { key: "mentation", label: "Altered mentation (GCS <15)", type: "select", options: YN },
    ],
    calculate: (v) => {
      const missing = [];
      let points = 0;
      const rr = num(v.rr);
      const sbp = num(v.sbp);
      if (rr === null) missing.push("Respiratory rate");
      else if (rr >= 22) points += 1;
      if (sbp === null) missing.push("Systolic blood pressure");
      else if (sbp <= 100) points += 1;
      points += flag(v.mentation, "mentation", "Altered mentation", 1, missing);
      if (missing.length) return { missing };
      return {
        value: points,
        unit: "points",
        band:
          points >= 2
            ? `qSOFA ${points} — the cited guidance identifies this as a higher risk of poor outcome in suspected infection, prompting urgent senior review. It is not a diagnosis of sepsis and a score below 2 does not exclude it.`
            : `qSOFA ${points} — below the published threshold. A score below 2 does not exclude sepsis when there is clinical concern.`,
        missing,
      };
    },
  },
  {
    key: "sofa",
    name: "SOFA — sequential organ failure assessment",
    purpose: "Organ dysfunction across six systems, as published",
    population: "Adults in acute care; the trend carries more information than a single value",
    source: {
      organization: "Surviving Sepsis Campaign / IDSA critical care guidance",
      title: "Sequential Organ Failure Assessment (SOFA)",
      url: "https://www.idsociety.org/practice-guideline/practice-guidelines/",
    },
    variables: [
      { key: "pao2_fio2", label: "PaO₂ / FiO₂ ratio", type: "number", min: 20, max: 700 },
      { key: "ventilated", label: "Receiving invasive or non-invasive ventilation", type: "select", options: YN },
      { key: "platelets", label: "Platelets", type: "number", unit: "×10³/µL", min: 1, max: 900 },
      { key: "bilirubin", label: "Bilirubin", type: "number", unit: "mg/dL", min: 0.1, max: 60 },
      { key: "map", label: "Mean arterial pressure", type: "number", unit: "mmHg", min: 20, max: 200 },
      {
        key: "vasopressor",
        label: "Vasopressor support documented",
        type: "select",
        options: [
          { value: "None", label: "None" },
          { value: "Low dose", label: "Dopamine ≤5 or any dobutamine" },
          { value: "Medium dose", label: "Dopamine >5 or adrenaline/noradrenaline ≤0.1 µg/kg/min" },
          { value: "High dose", label: "Dopamine >15 or adrenaline/noradrenaline >0.1 µg/kg/min" },
        ],
      },
      { key: "gcs", label: "Glasgow Coma Scale", type: "number", unit: "3–15", min: 3, max: 15 },
      { key: "creatinine", label: "Creatinine", type: "number", unit: "mg/dL", min: 0.1, max: 25 },
      { key: "urine_output", label: "Urine output over 24 hours", type: "number", unit: "mL/day", min: 0, max: 12000 },
    ],
    calculate: (v) => {
      const missing = [];
      const pf = num(v.pao2_fio2);
      const plt = num(v.platelets);
      const bili = num(v.bilirubin);
      const map = num(v.map);
      const gcs = num(v.gcs);
      const cr = num(v.creatinine);
      const uo = num(v.urine_output);
      if (pf === null) missing.push("PaO₂ / FiO₂ ratio");
      if (v.ventilated !== "Yes" && v.ventilated !== "No") missing.push("Ventilation status");
      if (plt === null) missing.push("Platelets");
      if (bili === null) missing.push("Bilirubin");
      if (map === null) missing.push("Mean arterial pressure");
      if (!v.vasopressor) missing.push("Vasopressor support");
      if (gcs === null) missing.push("Glasgow Coma Scale");
      if (cr === null && uo === null) missing.push("Creatinine or 24-hour urine output");
      if (missing.length) return { missing };

      const resp = pf >= 400 ? 0 : pf >= 300 ? 1 : pf >= 200 ? 2 : v.ventilated === "Yes" && pf >= 100 ? 3 : v.ventilated === "Yes" ? 4 : 2;
      const coag = plt >= 150 ? 0 : plt >= 100 ? 1 : plt >= 50 ? 2 : plt >= 20 ? 3 : 4;
      const liver = bili < 1.2 ? 0 : bili < 2 ? 1 : bili < 6 ? 2 : bili < 12 ? 3 : 4;
      let cardio;
      if (v.vasopressor === "High dose") cardio = 4;
      else if (v.vasopressor === "Medium dose") cardio = 3;
      else if (v.vasopressor === "Low dose") cardio = 2;
      else cardio = map < 70 ? 1 : 0;
      const cns = gcs >= 15 ? 0 : gcs >= 13 ? 1 : gcs >= 10 ? 2 : gcs >= 6 ? 3 : 4;
      let renal;
      if (cr !== null && cr >= 5) renal = 4;
      else if (uo !== null && uo < 200) renal = 4;
      else if (cr !== null && cr >= 3.5) renal = 3;
      else if (uo !== null && uo < 500) renal = 3;
      else if (cr !== null && cr >= 2) renal = 2;
      else if (cr !== null && cr >= 1.2) renal = 1;
      else renal = 0;

      const total = resp + coag + liver + cardio + cns + renal;
      return {
        value: total,
        unit: "points",
        band: `SOFA ${total} (respiratory ${resp}, coagulation ${coag}, liver ${liver}, cardiovascular ${cardio}, CNS ${cns}, renal ${renal}) — the cited guidance uses a rise of ≥2 points in the context of infection. The trend matters more than one value; the score describes organ dysfunction and does not replace clinical assessment.`,
        missing,
      };
    },
  },
  {
    key: "kdigo_ckd",
    name: "KDIGO — chronic kidney disease G/A staging",
    purpose: "GFR and albuminuria category with the published risk heat-map",
    population: "Adults with a persistent reduction in kidney function or albuminuria",
    source: {
      organization: "KDIGO",
      title: "KDIGO CKD classification by GFR and albuminuria (G/A categories)",
      url: "https://kdigo.org/guidelines/",
    },
    variables: [
      { key: "egfr", label: "eGFR", type: "number", unit: "mL/min/1.73 m²", min: 1, max: 200 },
      { key: "uacr", label: "Urine albumin-to-creatinine ratio", type: "number", unit: "mg/g", min: 0, max: 10000 },
      { key: "persistent", label: "Abnormality documented for more than 3 months", type: "select", options: [...YN, { value: "Not documented", label: "Not documented" }] },
    ],
    calculate: (v) => {
      const missing = [];
      const egfr = num(v.egfr);
      if (egfr === null) missing.push("eGFR");
      if (v.persistent !== "Yes" && v.persistent !== "No") missing.push("Duration (>3 months)");
      if (missing.length) return { missing };
      const g = egfr >= 90 ? "G1" : egfr >= 60 ? "G2" : egfr >= 45 ? "G3a" : egfr >= 30 ? "G3b" : egfr >= 15 ? "G4" : "G5";
      const uacr = num(v.uacr);
      let a = null;
      if (uacr !== null) a = uacr < 30 ? "A1" : uacr <= 300 ? "A2" : "A3";
      const label = `${g}${a ? ` ${a}` : ""}`;
      const highRisk = ["G4", "G5"].includes(g) || g === "G3b" || (a === "A3" && ["G3a", "G3b", "G4"].includes(g));
      const ckd = v.persistent === "Yes";
      return {
        value: label,
        unit: "G/A",
        band: ckd
          ? `KDIGO ${label} — chronic kidney disease${highRisk ? " in a higher-risk category; the cited guideline advises closer monitoring and attention to complications and medication dosing" : ""}${a ? "" : ". Albuminuria was not documented, so the A category cannot be assigned"}.`
          : `KDIGO ${label} on this measurement, but the abnormality is not documented as persisting beyond 3 months — a single value is not a diagnosis of chronic kidney disease.`,
        missing,
      };
    },
  },
];

// The IM panel offers the IM instruments plus the shared calculations that are
// equally used in internal medicine (eGFR, BMI, HbA1c, asthma control, CAT, mMRC).
const SHARED_KEYS = ["egfr", "bmi", "hba1c", "asthma_control", "cat", "mmrc"];

export const IM_SHARED_SCORES = FM_SCORES.filter((s) => SHARED_KEYS.includes(s.key));

export const IM_SCORES = [...IM_ONLY_SCORES, ...IM_SHARED_SCORES];

export const imScore = (key) => IM_ONLY_SCORES.find((s) => s.key === key) || fmScore(key);

// The one calculation entry point for IM notes. Returns null for an unknown key and
// an object with `missing` when the documented items are not yet complete.
export const calculateImScore = (key, inputs) => {
  const score = imScore(key);
  if (!score) return null;
  return score.calculate(asObject(inputs));
};

export const imScoreInputs = (values, fieldKey, scoreKey) =>
  asObject(asObject(asObject(values)[fieldKey])[scoreKey]);