// Family Medicine — preventive screening and immunization prompts.
//
// WHAT THIS IS: the age-, sex- and risk-conditions that make a preventive service
// APPLICABLE to this patient, with the issuing body and the recommendation grade.
// WHAT THIS IS NOT: a decision, an order or a claim that a test is overdue. AMedix
// does not know what was done elsewhere, so every item is presented as "consider /
// confirm status", never as "not done".
//
// The grade recorded is the grade the issuing body publishes for that service at the
// time of writing. The current recommendation must be confirmed at the source, and
// the national programme of the country of practice takes precedence where one exists.
//
// Only values the clinician documented are read: an undocumented smoking status does
// not make the patient a non-smoker, and an unknown risk factor never adds an item.

import { asObject, num, str } from "@/lib/fmFieldKit";

const yes = (v) => v === "Yes";

// Context derived strictly from what the note recorded.
export const screeningContextFromNote = (values = {}) => {
  const v = asObject(values);
  const lifestyle = asObject(v.fm_lifestyle);
  const chronic = asObject(v.fm_chronic);
  const preventive = asObject(v.fm_preventive);
  const geriatric = asObject(v.fm_geriatric);
  const women = asObject(v.fm_women);

  const conditions = [
    ...(Array.isArray(chronic.condition_focus) ? chronic.condition_focus : []),
    str(asObject(v.fm_core).pmh),
  ]
    .join(" ")
    .toLowerCase();

  const smokingStatus = str(lifestyle.smoking_status);
  const bmi = asObject(asObject(v.fm_scores).bmi);
  let bmiValue = null;
  const w = num(bmi.weight_kg);
  const h = num(bmi.height_cm);
  if (w !== null && h !== null) bmiValue = w / Math.pow(h / 100, 2);

  return {
    smoker: smokingStatus === "Current smoker" || smokingStatus === "Waterpipe / shisha",
    exSmoker: smokingStatus === "Ex-smoker",
    smokingDocumented: Boolean(smokingStatus) && smokingStatus !== "Not documented",
    packYears: num(lifestyle.pack_years),
    bmi: bmiValue,
    alcoholUnits: num(lifestyle.alcohol_units),
    pregnant: str(women.pregnancy_status) === "Pregnant",
    diabetes: /diabet/.test(conditions),
    hypertension: /hypertens/.test(conditions),
    ckd: /kidney|renal|ckd/.test(conditions),
    establishedCvd: /ischaemic heart|coronary|heart failure|stroke|myocardial/.test(conditions),
    fallsPositive:
      num(asObject(asObject(v.fm_scores).falls_screen).fall_q1 === "Yes") !== null ||
      str(geriatric.falls_past_year) === "One" ||
      str(geriatric.falls_past_year) === "Two" ||
      str(geriatric.falls_past_year) === "Three or more",
    riskFactors: Array.isArray(preventive.risk_factors) ? preventive.risk_factors : [],
  };
};

const item = (key, label, source, grade, detail, extra = {}) => ({ key, label, source, grade, detail, ...extra });

// Applicable preventive services, by age and sex. `age` null means unknown: no
// age-dependent item is offered, because an unknown age is not an indication.
export const buildFmScreeningItems = ({ age, sex, context = {} } = {}) => {
  const ctx = asObject(context);
  const items = [];
  const a = num(age);
  const female = sex === "Female";
  const male = sex === "Male";

  if (a === null) return items;

  if (a >= 18) {
    items.push(item("blood_pressure", "Blood pressure screening", "uspstf", "Grade A", "Screen all adults for hypertension with office measurement."));
    items.push(item("tobacco", "Tobacco use — ask, advise, offer support", "uspstf", "Grade A", "Ask every adult about tobacco use and offer cessation support."));
    items.push(item("alcohol", "Unhealthy alcohol use — screening and brief counselling", "uspstf", "Grade B", "Screen adults and offer brief behavioural counselling when positive."));
    items.push(item("obesity", "Obesity — BMI measurement and offer of intensive intervention", "uspstf", "Grade B", "Measure BMI and offer intensive multicomponent behavioural intervention when raised."));
    items.push(item("depression", "Depression screening", "uspstf", "Grade B", "Screen when systems are in place to ensure accurate diagnosis, treatment and follow-up."));
    items.push(item("hepatitis_b", "Hepatitis B screening", "uspstf", "Grade A (18–59)", "Screen adults aged 18–59; risk-based for older adults."));
    items.push(item("hepatitis_c", "Hepatitis C screening", "uspstf", "Grade B", "Screen adults aged 18–79 at least once."));
    items.push(item("hiv", "HIV screening", "uspstf", "Grade A (15–65)", "Screen adolescents and adults aged 15–65 at least once, and those at ongoing risk periodically."));
    items.push(item("cvd_risk", "Cardiovascular risk assessment", "acc_aha", "Guideline recommendation", "Estimate 10-year atherosclerotic risk and discuss risk-based preventive treatment."));
  }

  if (a >= 35 && a <= 70) {
    items.push(item("diabetes", "Prediabetes and type 2 diabetes screening", "uspstf", "Grade B", "Screen adults aged 35–70 who are overweight or obese."));
  }
  if (a >= 45 && a <= 75) {
    items.push(item("colorectal", "Colorectal cancer screening", "uspstf", "Grade A/B by age band", "Screen average-risk adults aged 45–75."));
  }
  if (a >= 50 && a <= 80 && (ctx.smoker || ctx.exSmoker) && (ctx.packYears === null ? true : ctx.packYears >= 20)) {
    items.push(
      item("lung", "Lung cancer screening with annual low-dose CT", "uspstf", "Grade B", "Adults 50–80 with a 20 pack-year history who currently smoke, or quit within 15 years.", {
        riskCondition: ctx.packYears === null ? "pack-year history not documented — confirm before treating as eligible" : `${ctx.packYears} pack-years recorded`,
      }),
    );
  }
  if (female && a >= 21 && a <= 65) {
    items.push(item("cervical", "Cervical cancer screening", "uspstf", "Grade A", "Screen women aged 21–65; the interval depends on the test used."));
  }
  if (female && a >= 40 && a <= 74) {
    items.push(item("breast", "Breast cancer screening — biennial mammography", "uspstf", "Grade B", "Screen women aged 40–74 every two years."));
  }
  if (female && a >= 65) {
    items.push(item("osteoporosis", "Osteoporosis screening — bone density", "uspstf", "Grade B", "Screen women aged 65 and older."));
  }
  if (female && a <= 24) {
    items.push(item("chlamydia", "Chlamydia and gonorrhoea screening", "uspstf", "Grade B", "Screen sexually active women aged 24 years and younger."));
  }
  if (male && a >= 65 && a <= 75 && (ctx.smoker || ctx.exSmoker)) {
    items.push(item("aaa", "Abdominal aortic aneurysm — one-time ultrasound", "uspstf", "Grade B", "Men aged 65–75 who have ever smoked."));
  }
  if (male && a >= 55 && a <= 69) {
    items.push(item("prostate", "Prostate cancer — shared decision about PSA testing", "uspstf", "Grade C", "Individual decision-making; discuss benefits and harms before testing."));
  }
  if (a >= 65) {
    items.push(item("falls", "Falls prevention — exercise and multifactorial intervention", "uspstf", "Grade B", "Offer exercise interventions to prevent falls in older adults at increased risk."));
    items.push(item("anxiety", "Anxiety screening in older adults", "uspstf", "Grade B", "Screen adults aged 65 and older for anxiety disorders."));
  }
  if (a >= 18 && a <= 64) {
    items.push(item("anxiety", "Anxiety screening", "uspstf", "Grade B", "Screen adults aged 64 and younger for anxiety disorders."));
  }
  if (ctx.pregnant) {
    items.push(
      item("pregnancy_review", "Antenatal preventive review", "acog", "Guideline recommendation", "Review blood pressure, danger signs, supplements, feeding plans and perinatal mood alongside maternity care."),
    );
  }
  if (ctx.ckd) {
    items.push(
      item("ckd_monitoring", "Chronic kidney disease monitoring", "kdigo", "Guideline recommendation", "Monitor eGFR and urine albumin-to-creatinine ratio; staging requires persistence beyond three months."),
    );
  }
  if (ctx.diabetes) {
    items.push(
      item("diabetes_review", "Diabetes review — HbA1c, renal, foot and retinal surveillance", "ada", "Guideline recommendation", "Review glycaemia against the individualised target, renal function, foot examination and retinal screening."),
    );
  }
  if (ctx.hypertension) {
    items.push(item("bp_review", "Hypertension follow-up", "acc_aha", "Guideline recommendation", "Confirm control, adherence and the medicines in use at each review."));
  }
  return items;
};

// Immunizations applicable by age, with the international basis. The national
// schedule of the country of practice always takes precedence.
export const buildFmImmunizationItems = ({ age, sex, context = {} } = {}) => {
  const ctx = asObject(context);
  const a = num(age);
  if (a === null) return [];
  const items = [];

  if (a <= 18) {
    items.push(item("child_schedule", "National childhood immunization schedule", "who_immunization", "National schedule", "Check every antigen due for this age against the national schedule and the child's record."));
  }
  items.push(item("tetanus", "Tetanus and diphtheria booster", "who_immunization", "National schedule", "A booster is due every 10 years in most national schedules — confirm the interval in the national schedule."));
  items.push(item("influenza", "Annual influenza vaccination", "who_immunization", "Annual", "Recommended annually, particularly for older adults, pregnancy and chronic disease."));
  if (a >= 65) {
    items.push(item("pneumococcal", "Pneumococcal vaccination", "who_immunization", "Age-based", "Recommended for older adults and for people with chronic cardiorespiratory or renal disease."));
  }
  if (ctx.pregnant) {
    items.push(item("pregnancy_vaccines", "Vaccines in pregnancy", "who_immunization", "Pregnancy-based", "Confirm which inactivated vaccines the national schedule offers in pregnancy; live vaccines are avoided."));
  }
  if (sex === "Female" && a >= 9 && a <= 26) {
    items.push(item("hpv", "HPV vaccination", "who_immunization", "Age-based", "Recommended for girls, with catch-up where the national schedule provides it."));
  }
  if (ctx.ckd || ctx.diabetes || ctx.establishedCvd) {
    items.push(item("chronic_disease_vaccines", "Vaccines for chronic disease", "who_immunization", "Risk-based", "Chronic cardiac, respiratory, renal and metabolic disease increase the indication for influenza and pneumococcal vaccination."));
  }
  return items;
};