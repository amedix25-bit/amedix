// QA harness for the Family Medicine upgrade.
// Run: npx esbuild qa/fm-qa.mjs --bundle --platform=node --format=esm --outfile=/tmp/fmqa.mjs --alias:@=./src && node /tmp/fmqa.mjs
//
// Every check asserts a property of the shipped code, not of this file. A check that
// cannot be proved from the code fails rather than passing silently.
import fs from "node:fs";
import path from "node:path";

import { getSpecialtyDocs, SPECIALTY_DOCUMENTS } from "@/lib/specialtyDocuments";
import { FM_BLOCKS, FM_BLOCK_KEYS, formatFmBlock, fmBlockValue } from "@/lib/fmBlocks";
import { FM_SCORES, calculateFmScore } from "@/lib/fmScores";
import { buildFmSafetyPrompts, FM_SAFETY_RULES } from "@/lib/fmSafetyRules";
import { buildFmScreeningItems, buildFmImmunizationItems, screeningContextFromNote } from "@/lib/fmScreening";
import { FM_ICD11_GROUPS, FM_ICD11_CONDITION_COUNT, FM_ICD_DETAIL_FIELDS } from "@/lib/fmIcd11";
import { FM_REFERENCES, FM_NOTE_REFERENCES, FM_LOCAL_PROTOCOL_NOTICE } from "@/lib/fmReferences";
import { FM_WORKFLOW_DOCS } from "@/lib/fmDocuments";

let pass = 0;
const fails = [];
const check = (name, fn) => {
  try {
    const r = fn();
    if (r === false) throw new Error("returned false");
    pass += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fails.push(`${name} — ${e.message}`);
    console.log(`FAIL  ${name} — ${e.message}`);
  }
};

const fmDocs = getSpecialtyDocs("Family Medicine");
const fmKeys = fmDocs.map((d) => d.key);
const doc = (k) => SPECIALTY_DOCUMENTS.find((d) => d.key === k);
const types = (k) => (doc(k)?.fields || []).map((f) => f.type || "text");

console.log("\n— Templates —");
check("family medicine resolves to its original templates plus the new workflows", () => fmDocs.length === 16);
check("the surviving original templates keep their keys", () =>
  ["fm_general_consultation", "fm_preventive_visit", "fm_chronic_followup", "fm_acute_visit", "fm_followup", "fm_procedure_note", "fm_medication_review", "fm_health_maintenance"].every((k) => fmKeys.includes(k)));
check("the referral note stays retired by the existing governance rule", () => !fmKeys.includes("fm_referral"));
check("eight new workflow templates exist", () =>
  ["fm_well_child", "fm_geriatric_assessment", "fm_womens_health", "fm_maternal_health", "fm_vaccination", "fm_mental_health", "fm_lifestyle_counseling", "fm_chronic_annual_review"].every((k) => fmKeys.includes(k)));
check("no note key or field key is duplicated", () => {
  const seen = new Set();
  fmKeys.forEach((k) => {
    if (seen.has(k)) throw new Error(`duplicate note key ${k}`);
    seen.add(k);
  });
  fmDocs.forEach((d) => {
    const keys = (d.fields || []).map((f) => f.key);
    if (new Set(keys).size !== keys.length) throw new Error(`duplicate field in ${d.key}`);
  });
  return true;
});
check("existing consultation fields survive and the retired ones stay retired", () => {
  const f = (doc("fm_general_consultation").fields || []).map((x) => x.key);
  ["chief_complaint", "hpi", "allergies", "review_of_systems", "assessment", "follow_up"].forEach((k) => {
    if (!f.includes(k)) throw new Error(`lost ${k}`);
  });
  if (f.includes("pmh") || f.includes("plan")) throw new Error("note-section governance rule changed");
  return FM_BLOCKS.fm_core.fields.some((x) => x.key === "pmh");
});
check("every family medicine note carries the ICD-11 field", () =>
  fmKeys.every((k) => (doc(k).fields || []).some((f) => f.type === "icd11_diagnoses")));
check("every family medicine note carries the safety review", () =>
  fmKeys.every((k) => (doc(k).fields || []).some((f) => f.type === "fm_safety")));
check("every family medicine note carries the guideline basis", () =>
  fmKeys.every((k) => (doc(k).fields || []).some((f) => f.type === "fm_guidance")));
check("preventive templates carry the screening field", () =>
  ["fm_preventive_visit", "fm_health_maintenance", "fm_well_child", "fm_geriatric_assessment", "fm_womens_health", "fm_maternal_health", "fm_lifestyle_counseling", "fm_chronic_annual_review"].every((k) => types(k).includes("fm_screening")));
check("no other specialty gained fm field types", () =>
  SPECIALTY_DOCUMENTS.filter((d) => d.specialty !== "family_medicine").every((d) => !(d.fields || []).some((f) => String(f.type).startsWith("fm_"))));

console.log("\n— Blocks —");
check("block registry is complete and self-consistent", () =>
  FM_BLOCK_KEYS.every((k) => FM_BLOCKS[k].fields.every((f) => f.key && f.label && ["text", "input", "number", "select", "multi"].includes(f.type))));
check("a block value keeps its own identity", () => {
  const v = fmBlockValue("fm_core", { assessment: "documented" });
  return v.__block === "fm_core" && formatFmBlock(v).includes("Assessment / clinical impression: documented");
});
check("an unanswered block prints as not documented, never as normal", () =>
  formatFmBlock(fmBlockValue("fm_core", {})).includes("not documented in this note"));

console.log("\n— Scores —");
const allMissing = calculateFmScore("phq9", {});
check("an incomplete score is not calculated and names what is missing", () => allMissing.missing.length === 9);
check("PHQ-9 sums its nine items", () => {
  const v = {};
  ["phq_interest", "phq_mood", "phq_sleep", "phq_energy", "phq_appetite", "phq_selfworth", "phq_concentration", "phq_psychomotor", "phq_selfharm"].forEach((k) => (v[k] = "1"));
  const r = calculateFmScore("phq9", v);
  return r.value === 9 && r.band.startsWith("Mild");
});
check("PHQ-9 flags a positive self-harm item", () => {
  const v = {};
  ["phq_interest", "phq_mood", "phq_sleep", "phq_energy", "phq_appetite", "phq_selfworth", "phq_concentration", "phq_psychomotor"].forEach((k) => (v[k] = "0"));
  v.phq_selfharm = "1";
  return calculateFmScore("phq9", v).flagSelfHarm === true;
});
check("BMI uses the WHO bands", () => {
  const r = calculateFmScore("bmi", { weight_kg: "100", height_cm: "170" });
  return r.value === 34.6 && r.band.startsWith("Obesity class I");
});
check("eGFR CKD-EPI 2021 is computed and staged", () => {
  const r = calculateFmScore("egfr", { creatinine: "1.2", age: "60", sex: "Male" });
  return r.value > 55 && r.value < 75 && r.band.startsWith("G2");
});
check("eGFR refuses to run without sex", () => calculateFmScore("egfr", { creatinine: "1.2", age: "60" }).missing.includes("Sex"));
check("AUDIT-C uses the sex-specific cut-off", () => {
  const base = { audit_frequency: "3", audit_amount: "0", audit_binge: "0" };
  return calculateFmScore("audit_c", { ...base, sex: "Female" }).band.startsWith("Positive") && calculateFmScore("audit_c", { ...base, sex: "Male" }).band.startsWith("Below");
});
check("GINA control tool bands 0/1-2/3-4 features", () => {
  const yes = { gina_daytime: "Yes", gina_night: "Yes", gina_reliever: "Yes", gina_activity: "Yes" };
  const no = { gina_daytime: "No", gina_night: "No", gina_reliever: "No", gina_activity: "No" };
  return calculateFmScore("asthma_control", yes).band.startsWith("Uncontrolled") && calculateFmScore("asthma_control", no).band.startsWith("Well controlled");
});
check("CAT totals eight items", () => {
  const v = {};
  ["cat_cough", "cat_phlegm", "cat_chest", "cat_breath", "cat_activity", "cat_confidence", "cat_sleep", "cat_energy"].forEach((k) => (v[k] = "3"));
  return calculateFmScore("cat", v).value === 24;
});
check("falls screen counts positive answers", () => calculateFmScore("falls_screen", { fall_q1: "Yes", fall_q2: "No", fall_q3: "No" }).value === 1);
check("documented cardiovascular risk is categorised, not computed", () => {
  const r = calculateFmScore("cvd_risk", { risk_percent: "12", risk_chart: "WHO/ISH risk chart" });
  return r.band.startsWith("Intermediate") && r.band.includes("does not compute");
});
check("HbA1c compares with the recorded target only", () => {
  const r = calculateFmScore("hba1c", { hba1c_value: "8.2", hba1c_target: "7" });
  return r.band.startsWith("Above") && r.band.includes("individualised");
});
check("child measurements never produce a percentile", () => calculateFmScore("child_bmi", { weight_kg: "20", height_cm: "115" }).band.includes("never estimates a percentile"));
check("every score names its published source", () => FM_SCORES.every((s) => s.source?.organization && s.source?.url));

console.log("\n— Safety rules —");
check("an empty note triggers no prompt", () => buildFmSafetyPrompts({ values: {} }).length === 0);
check("chest pain without ECG fires critical", () => {
  const p = buildFmSafetyPrompts({ values: { fm_acute: { red_flags_present: ["Chest pain"], disposition: "Managed at home" } } });
  return p.some((x) => x.key === "chest_pain_no_ecg" && x.level === "critical");
});
check("chest pain with ECG and escalation does not fire", () => {
  const p = buildFmSafetyPrompts({ values: { fm_acute: { red_flags_present: ["Chest pain"], point_of_care: ["ECG"], disposition: "Admitted" } } });
  return !p.some((x) => x.key === "chest_pain_no_ecg");
});
check("infant fever fires critical", () =>
  buildFmSafetyPrompts({ values: { fm_child: { child_red_flags: ["Age under 3 months with fever ≥38 °C"] } } }).some((x) => x.key === "infant_fever"));
check("a positive PHQ-9 item 9 without risk assessment fires critical", () => {
  const phq = {};
  ["phq_interest", "phq_mood", "phq_sleep", "phq_energy", "phq_appetite", "phq_selfworth", "phq_concentration", "phq_psychomotor"].forEach((k) => (phq[k] = "0"));
  phq.phq_selfharm = "2";
  return buildFmSafetyPrompts({ values: { fm_scores: { phq9: phq } } }).some((x) => x.key === "phq9_item9" && x.level === "critical");
});
check("a documented risk assessment clears that prompt", () => {
  const phq = {};
  ["phq_interest", "phq_mood", "phq_sleep", "phq_energy", "phq_appetite", "phq_selfworth", "phq_concentration", "phq_psychomotor"].forEach((k) => (phq[k] = "0"));
  phq.phq_selfharm = "2";
  return !buildFmSafetyPrompts({ values: { fm_scores: { phq9: phq }, fm_mental: { suicidal_ideation: "Denies" } } }).some((x) => x.key === "phq9_item9");
});
check("a teratogen in pregnancy fires the label check", () =>
  buildFmSafetyPrompts({ values: { fm_women: { pregnancy_status: "Pregnant" }, fm_core: { treatment_plan: "Start lisinopril 5 mg" } } }).some((x) => x.key === "teratogen_pregnancy"));
check("a teratogen with pregnancy unknown fires a warning, not a block", () => {
  const p = buildFmSafetyPrompts({ values: { fm_core: { treatment_plan: "start warfarin" } } });
  const hit = p.find((x) => x.key === "teratogen_pregnancy_unknown");
  return Boolean(hit) && hit.level === "warning";
});
check("obstetric danger sign without maternity referral fires", () =>
  buildFmSafetyPrompts({ values: { fm_maternal: { danger_signs: ["Severe headache"] } } }).some((x) => x.key === "pregnancy_danger_sign"));
check("every prompt names a source and its provenance", () =>
  FM_SAFETY_RULES.every((r) => r.source && r.basis && r.provenance));
check("a rule never throws on malformed stored values", () => {
  buildFmSafetyPrompts({ values: { fm_acute: { red_flags_present: "Chest pain" }, fm_scores: { phq9: null } } });
  return true;
});

console.log("\n— Screening —");
check("no screening is offered without an age", () => buildFmScreeningItems({ age: null, sex: "Female" }).length === 0);
check("a 50-year-old woman is offered cervical and breast screening", () => {
  const keys = buildFmScreeningItems({ age: 50, sex: "Female" }).map((i) => i.key);
  return keys.includes("cervical") && keys.includes("breast") && keys.includes("colorectal");
});
check("a 50-year-old man is not offered cervical or breast screening", () => {
  const keys = buildFmScreeningItems({ age: 50, sex: "Male" }).map((i) => i.key);
  return !keys.includes("cervical") && !keys.includes("breast");
});
check("lung screening needs a smoking history", () => {
  const nonSmoker = buildFmScreeningItems({ age: 60, sex: "Male", context: { smokingDocumented: true, smoker: false } }).map((i) => i.key);
  const smoker = buildFmScreeningItems({ age: 60, sex: "Male", context: { smoker: true, packYears: 30 } }).map((i) => i.key);
  return !nonSmoker.includes("lung") && smoker.includes("lung");
});
check("every screening item carries a source and a grade", () => {
  const items = [...buildFmScreeningItems({ age: 70, sex: "Female", context: { ckd: true, diabetes: true } }), ...buildFmImmunizationItems({ age: 70, sex: "Female" })];
  return items.length > 0 && items.every((i) => i.source && i.grade && FM_REFERENCES[i.source]);
});
check("an unknown smoking status never adds a risk item", () =>
  !buildFmScreeningItems({ age: 60, sex: "Male", context: screeningContextFromNote({ fm_lifestyle: { smoking_status: "Not documented" } }) }).some((i) => i.key === "lung"));

console.log("\n— ICD-11 —");
check("the condition index contains search terms only, never codes", () => {
  const entries = FM_ICD11_GROUPS.flatMap((g) => g.conditions);
  if (entries.length !== FM_ICD11_CONDITION_COUNT) throw new Error("count mismatch");
  return entries.every((c) => c.whoQuery && c.label && !/[A-Z0-9]{2,}\d{2}/.test(c.code || ""));
});
check("the index covers the requested domains", () => {
  const keys = FM_ICD11_GROUPS.map((g) => g.key);
  return ["acute", "infections", "cardiovascular", "respiratory", "gastrointestinal", "endocrine", "neurological", "musculoskeletal", "dermatology", "mental_health", "womens_health", "child_health", "geriatric", "preventive"].every((k) => keys.includes(k));
});
check("symptom and sign statuses exist so they are never coded as diagnoses", () => {
  const f = doc("fm_general_consultation").fields.find((x) => x.type === "icd11_diagnoses");
  return f.statuses.includes("Symptom — not a diagnosis") && f.statuses.includes("Sign — not a diagnosis") && f.clusterEnabled === true;
});
check("detail a code cannot carry is stored beside it", () => FM_ICD_DETAIL_FIELDS.some((f) => f.key === "pregnancy_context"));

console.log("\n— References —");
check("every note type cites at least one reference", () => fmKeys.every((k) => (FM_NOTE_REFERENCES[k] || []).length > 0));
check("every cited key resolves", () => Object.values(FM_NOTE_REFERENCES).flat().every((k) => FM_REFERENCES[k]));
check("every reference has an official source URL", () => Object.values(FM_REFERENCES).every((r) => /^https:\/\//.test(r.source_url)));
check("no reference claims a local approval", () => Object.values(FM_REFERENCES).every((r) => r.approving_body === undefined));
check("the local protocol notice says none is registered", () => FM_LOCAL_PROTOCOL_NOTICE.includes("No locally approved family medicine protocol is registered"));

console.log("\n— Governance —");
check("no module invents a clinical finding or a dose", () => {
  const files = ["src/lib/fmSafetyRules.js", "src/lib/fmScores.js", "src/lib/fmScreening.js"].map((p) => fs.readFileSync(path.join(process.cwd(), p), "utf8"));
  return files.every((s) => !/mg\b.*(?:start|give|prescribe)/i.test(s));
});
check("the workflow docs are registered in the catalogue", () => FM_WORKFLOW_DOCS.every((d) => SPECIALTY_DOCUMENTS.some((x) => x.key === d.key)));

console.log(`\n${pass} passed, ${fails.length} failed`);
if (fails.length) {
  console.log(fails.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}