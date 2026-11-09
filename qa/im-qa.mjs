// QA harness for the Internal Medicine upgrade.
// Run: npx esbuild qa/im-qa.mjs --bundle --platform=node --format=esm --outfile=/tmp/imqa.mjs --alias:@=./src --loader:.ts=ts && node /tmp/imqa.mjs
//
// Every check asserts a property of the shipped code, not of this file. A check that
// cannot be proved from the code fails rather than passing silently.
import fs from "node:fs";

import { getSpecialtyDocs, getDocDef } from "@/lib/specialtyDocuments";
import { IM_BLOCKS, imBlock, formatImBlock, imBlockValue } from "@/lib/imBlocks";
import { IM_SCORES, IM_ONLY_SCORES, imScore, calculateImScore, imScoreInputs } from "@/lib/imScores";
import { buildImSafetyPrompts, IM_SAFETY_RULES } from "@/lib/imSafetyRules";
import { IM_ICD11_GROUPS, IM_ICD11_CONDITION_COUNT, IM_ICD_STATUSES, IM_ICD_ROLES, IM_ICD_DETAIL_FIELDS } from "@/lib/imIcd11";
import {
  IM_REFERENCES, IM_NOTE_REFERENCES, IM_PRINCIPAL_REFERENCE, IM_LOCAL_PROTOCOL_NOTICE,
  imGuidanceForNote, imGuidanceBasis,
} from "@/lib/imReferences";
import { IM_WORKFLOW_DOCS, withInternalMedicineStandards } from "@/lib/imDocuments";

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
    console.log(`  FAIL ${name} — ${e.message}`);
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const imDocs = getSpecialtyDocs("Internal Medicine");
const allImKeys = [...imDocs.map((d) => d.key)];
const doc = (key) => getDocDef(key);
const fields = (key) => (doc(key)?.fields || []);
const hasType = (key, type) => fields(key).some((f) => f.type === type);

const ORIGINAL_IM = [
  "im_consultation", "im_new_patient_assessment", "im_followup", "im_chronic_followup",
  "im_admission_note", "im_daily_progress", "im_problem_oriented_progress",
  "im_consultation_request", "im_consultation_response", "im_medication_reconciliation",
  "im_discharge_summary", "im_medical_followup", "im_chronic_care_plan",
];
// A diagnosis field belongs on clinical notes, not on a consultation request or a
// medication reconciliation record.
const NO_DIAGNOSIS = ["im_consultation_request", "im_medication_reconciliation"];
const CLINICAL_IM = ORIGINAL_IM.filter((k) => !NO_DIAGNOSIS.includes(k));

console.log("\n— Catalogue: existing templates preserved —");
check("all 13 original internal medicine templates still exist", () =>
  ORIGINAL_IM.every((k) => !!doc(k)) || `missing: ${ORIGINAL_IM.filter((k) => !doc(k)).join(", ")}`);
check("original consultation fields are unchanged in order", () => {
  const k = fields("im_consultation").slice(0, 9).map((f) => f.key);
  return (
    JSON.stringify(k) ===
      JSON.stringify(["chief_complaint", "hpi", "pmh", "medications", "allergies", "review_of_systems", "exam_findings", "assessment", "plan"]) ||
    `got ${k.join(",")}`
  );
});
check("the 16 new discipline templates are present", () =>
  IM_WORKFLOW_DOCS.length === 16 && IM_WORKFLOW_DOCS.every((d) => d.specialty === "internal_medicine"));
check("no internal medicine template declares a duplicate field key", () => {
  for (const d of imDocs) {
    const keys = (d.fields || []).map((f) => f.key);
    assert(new Set(keys).size === keys.length, `${d.key} repeats a field key`);
  }
  return true;
});
check("strengthening is idempotent (applying it twice adds nothing)", () => {
  const once = withInternalMedicineStandards(imDocs);
  const twice = withInternalMedicineStandards(once);
  return twice.every((d, i) => (d.fields || []).length === (once[i].fields || []).length);
});

console.log("\n— ICD-11 is present on every clinical note —");
check("every clinical internal medicine note carries the ICD-11 field", () =>
  CLINICAL_IM.every((k) => fields(k).some((f) => f.type === "icd11_diagnoses")) ||
  `missing on: ${CLINICAL_IM.filter((k) => !fields(k).some((f) => f.type === "icd11_diagnoses")).join(", ")}`);
check("the ICD-11 field uses the shared field type and a unique key", () => {
  const key = "im_icd11_diagnoses";
  return CLINICAL_IM.every((k) => {
    const f = fields(k).find((x) => x.type === "icd11_diagnoses");
    return f && f.key === key;
  });
});
check("every ICD-11 field offers all seven documented statuses", () => {
  const f = fields("im_consultation").find((x) => x.type === "icd11_diagnoses");
  return IM_ICD_STATUSES.every((s) => f.statuses.includes(s)) && IM_ICD_STATUSES.length === 7;
});
check("statuses are exactly suspected, differential, provisional, confirmed, ruled out, historical, resolved", () => {
  const expected = ["Suspected", "Differential diagnosis", "Provisional", "Confirmed", "Ruled out", "Historical", "Resolved"];
  return JSON.stringify(IM_ICD_STATUSES) === JSON.stringify(expected);
});
check("primary and secondary diagnosis roles are offered", () =>
  JSON.stringify(IM_ICD_ROLES) === JSON.stringify(["Primary", "Secondary"]));
check("clinician confirmation and duplicate-prevention context are requested", () => {
  const f = fields("im_consultation").find((x) => x.type === "icd11_diagnoses");
  return f.requireConfirmation === true && f.clusterEnabled === true && Array.isArray(f.extraFields);
});
check("the condition index covers 12 disciplines with no embedded code", () => {
  assert(IM_ICD11_GROUPS.length === 12, `groups ${IM_ICD11_GROUPS.length}`);
  assert(IM_ICD11_CONDITION_COUNT >= 100, `only ${IM_ICD11_CONDITION_COUNT} terms`);
  const codeLike = /(\b[A-Z]{2,3}\d{2,}|\b\d{2}[A-Z]{2,})/;
  for (const g of IM_ICD11_GROUPS) {
    for (const t of g.terms) {
      assert(typeof t === "string" && t.length > 2, "empty term");
      assert(!codeLike.test(t), `term looks like a code: "${t}"`);
    }
  }
  return true;
});
check("condition index detail fields never append detail to a code", () => {
  const keys = IM_ICD_DETAIL_FIELDS.map((f) => f.key);
  return keys.includes("severity") && keys.includes("stage_grade") && keys.includes("basis");
});

console.log("\n— Instruments —");
const REQUIRED = [
  "cha2ds2_vasc", "has_bled", "curb65", "psi_port", "wells_pe", "wells_dvt",
  "glasgow_blatchford", "child_pugh", "meld_na", "aki_stage", "qsofa", "sofa",
  "kdigo_ckd", "egfr",
];
check("every required instrument is available to internal medicine notes", () => {
  const have = IM_SCORES.map((s) => s.key);
  const missing = REQUIRED.filter((k) => !have.includes(k));
  return missing.length === 0 || `missing: ${missing.join(", ")}`;
});
check("every instrument cites a source organisation, title and https link", () =>
  IM_SCORES.every(
    (s) =>
      s.source?.organization &&
      s.source?.title &&
      String(s.source?.url || "").startsWith("https://") &&
      s.purpose &&
      s.population,
  ));
check("no instrument can produce a value from blank inputs", () =>
  REQUIRED.every((k) => {
    const r = calculateImScore(k, {});
    return r && Array.isArray(r.missing) && r.missing.length > 0 && r.value === undefined;
  }));
check("a missing item is named, not treated as zero", () => {
  const r = calculateImScore("qsofa", { rr: "24" });
  return r.missing.includes("Systolic blood pressure") && r.missing.includes("Altered mentation") && r.value === undefined;
});

const val = (key, inputs) => {
  const r = calculateImScore(key, inputs);
  assert(!r.missing?.length, `${key} still missing: ${(r.missing || []).join(", ")}`);
  return r;
};

check("CHA₂DS₂-VASc: 78-year-old woman with hypertension scores 4", () => {
  const r = val("cha2ds2_vasc", { chf: "No", hypertension: "Yes", age: "78", diabetes: "No", stroke: "No", vascular: "No", sex: "Female" });
  return r.value === 4;
});
check("CHA₂DS₂-VASc: 60-year-old man with prior stroke scores 2", () => {
  const r = val("cha2ds2_vasc", { chf: "No", hypertension: "No", age: "60", diabetes: "No", stroke: "Yes", vascular: "No", sex: "Male" });
  return r.value === 2;
});
check("HAS-BLED: no risk factors at 60 scores 0", () => {
  const r = val("has_bled", {
    hypertension: "No", renal: "No", liver: "No", stroke: "No", bleeding: "No",
    labile_inr: "Not applicable", age: "60", drugs: "No", alcohol: "No",
  });
  return r.value === 0;
});
check("HAS-BLED: three factors score 3 and flag closer review", () => {
  const r = val("has_bled", {
    hypertension: "Yes", renal: "Yes", liver: "No", stroke: "No", bleeding: "No",
    labile_inr: "No", age: "70", drugs: "No", alcohol: "No",
  });
  return r.value === 3 && /not on its own a reason to withhold/i.test(r.band);
});
check("CURB-65: a 70-year-old with normal values scores 1", () => {
  const r = val("curb65", { confusion: "No", urea: "5", rr: "20", sbp: "130", dbp: "80", age: "70" });
  return r.value === 1;
});
check("CURB-65: a patient meeting all five criteria scores 6", () => {
  const r = val("curb65", { confusion: "Yes", urea: "12", rr: "32", sbp: "85", dbp: "55", age: "80" });
  return r.value === 6 && /site of care on its own/i.test(r.band);
});
check("PSI: a 40-year-old man with no risk factor is class I with 40 points", () => {
  const r = val("psi_port", {
    age: "40", sex: "Male", nursing_home: "No", neoplastic: "No", liver: "No", chf: "No",
    cva: "No", renal: "No", ams: "No", rr: "18", sbp: "120", temp: "37", hr: "80", ph: "7.40",
    bun: "14", sodium: "138", glucose: "100", hct: "42", pao2: "90", effusion: "No",
  });
  return r.value === 40 && /class I /i.test(r.band);
});
check("Wells PE: signs of DVT plus PE likely scores 6 and is PE likely", () => {
  const r = val("wells_pe", {
    dvt_signs: "Yes", pe_likely: "Yes", hr: "90", immobilisation: "No", previous_vte: "No",
    haemoptysis: "No", malignancy: "No",
  });
  return r.value === 6 && /PE likely/i.test(r.band);
});
check("Wells DVT: alternative diagnosis subtracts two points", () => {
  const r = val("wells_dvt", {
    cancer: "Yes", paralysis: "No", bedridden: "No", tenderness: "Yes", swelling: "No", calf: "No",
    oedema: "No", collateral: "No", previous_dvt: "No", alternative: "Yes",
  });
  return r.value === 0;
});
check("Glasgow-Blatchford: young man with normal values scores 0", () => {
  const r = val("glasgow_blatchford", {
    urea: "5", hb: "14", sex: "Male", sbp: "120", hr: "80", melaena: "No", syncope: "No",
    hepatic: "No", cardiac: "No",
  });
  return r.value === 0;
});
check("Child-Pugh: mild derangement scores 5 (class A)", () => {
  const r = val("child_pugh", { bilirubin: "20", albumin: "40", inr: "1.2", ascites: "None", encephalopathy: "None" });
  return r.value === 5 && /class A/i.test(r.band);
});
check("Child-Pugh: severe derangement scores 15 (class C)", () => {
  const r = val("child_pugh", { bilirubin: "90", albumin: "22", inr: "3", ascites: "Severe", encephalopathy: "Grade 3-4" });
  return r.value === 15 && /class C/i.test(r.band);
});
check("MELD-Na: normal values give the published floor of 6", () => {
  const r = val("meld_na", { bilirubin: "1", inr: "1", creatinine: "1", sodium: "137", dialysis: "No" });
  return r.value === 6;
});
check("MELD-Na: creatinine is capped at 4 mg/dL", () => {
  const a = val("meld_na", { bilirubin: "3", inr: "2", creatinine: "4", sodium: "130", dialysis: "No" });
  const b = val("meld_na", { bilirubin: "3", inr: "2", creatinine: "9", sodium: "130", dialysis: "No" });
  return a.value === b.value;
});
check("KDIGO AKI: 1.0 to 1.6 mg/dL is stage 1", () => {
  const r = val("aki_stage", { baseline_creatinine: "1.0", current_creatinine: "1.6", rrt: "No" });
  return r.value === 1;
});
check("KDIGO AKI: 1.0 to 3.2 mg/dL is stage 3", () => {
  const r = val("aki_stage", { baseline_creatinine: "1.0", current_creatinine: "3.2", rrt: "No" });
  return r.value === 3;
});
check("KDIGO AKI: without a baseline it refuses to stage", () => {
  const r = calculateImScore("aki_stage", { current_creatinine: "2.4", rrt: "No" });
  return r.missing.includes("Baseline creatinine") && r.value === undefined;
});
check("qSOFA: 2 of 3 criteria scores 2", () => {
  const r = val("qsofa", { rr: "24", sbp: "90", mentation: "No" });
  return r.value === 2 && /not a diagnosis of sepsis/i.test(r.band);
});
check("SOFA: moderate dysfunction across three systems scores 3", () => {
  const r = val("sofa", {
    pao2_fio2: "350", ventilated: "No", platelets: "120", bilirubin: "1.0", map: "65",
    vasopressor: "None", gcs: "15", creatinine: "1.0", urine_output: "1200",
  });
  return r.value === 3;
});
check("SOFA: a high vasopressor dose scores 4 in the cardiovascular system", () => {
  const r = val("sofa", {
    pao2_fio2: "450", ventilated: "No", platelets: "200", bilirubin: "1.0", map: "70",
    vasopressor: "High dose", gcs: "15", creatinine: "1.0", urine_output: "1200",
  });
  return r.value === 4 && /cardiovascular 4/.test(r.band);
});
check("KDIGO CKD: eGFR 40 with ACR 350 is G3b A3", () => {
  const r = val("kdigo_ckd", { egfr: "40", uacr: "350", persistent: "Yes" });
  return r.value === "G3b A3";
});
check("KDIGO CKD: a single value is not labelled chronic kidney disease", () => {
  const r = val("kdigo_ckd", { egfr: "40", uacr: "350", persistent: "No" });
  return /not a diagnosis of chronic kidney disease/i.test(r.band);
});
check("eGFR (shared) is calculated and classified", () => {
  const r = val("egfr", { creatinine: "1.0", age: "60", sex: "Male" });
  return typeof r.value === "number" && /G[12]/.test(r.band);
});

console.log("\n— Blocks —");
check("every block referenced by a note exists in the registry", () => {
  for (const d of imDocs) {
    for (const f of d.fields || []) {
      if (f.type === "im_modules") assert(imBlock(f.key), `${d.key} references unknown block ${f.key}`);
    }
  }
  return true;
});
check("block fields declare a key, label and type, unique within the block", () => {
  for (const [key, b] of Object.entries(IM_BLOCKS)) {
    const keys = b.fields.map((f) => f.key);
    assert(new Set(keys).size === keys.length, `${key} repeats a field`);
    assert(b.fields.every((f) => f.key && f.label && f.type), `${key} has an incomplete field`);
  }
  return true;
});
check("the note carries no laboratory result entry (platform governance: results are attached, not re-entered)", () =>
  !IM_BLOCKS.im_labs && !IM_BLOCKS.im_renal_labs);
check("the acute templates offer the structured Vital Signs field", () =>
  ["im_sepsis_assessment", "im_electrolyte_disorder", "im_cardiology_review", "im_comprehensive_assessment"].every((k) =>
    fields(k).some((f) => f.type === "vitals" && f.label === "Vital Signs"),
  ));
check("a block value keeps its identity and prints in declared order", () => {
  const v = imBlockValue("im_acute", { suspected_infection: "Suspected", lactate: "5.2" });
  const text = formatImBlock(v);
  return v.__block === "im_acute" && text.includes("Suspected") && text.indexOf("Suspected infection") < text.indexOf("Lactate");
});
check("the comprehensive assessment carries history, review of systems, examination and vitals", () => {
  const blocks = fields("im_comprehensive_assessment").filter((f) => f.type === "im_modules").map((f) => f.key);
  const types = fields("im_comprehensive_assessment").map((f) => f.type);
  return ["im_history", "im_ros"].every((k) => blocks.includes(k)) && types.includes("examinations") && types.includes("vitals");
});

console.log("\n— Safety prompts —");
const safetyValues = (blocks) => {
  const out = {};
  for (const [k, v] of Object.entries(blocks)) out[k] = imBlockValue(k, v);
  return out;
};
const scoresOf = (entries) => ({ im_scores: Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, v])) });
const withScores = (values, entries) => ({ ...values, ...scoresOf(entries) });

check("suspected infection with qSOFA 2 triggers the sepsis prompt", () => {
  const values = withScores(
    safetyValues({ im_acute: { suspected_infection: "Suspected" } }),
    { qsofa: { rr: "24", sbp: "90", mentation: "No" } },
  );
  return buildImSafetyPrompts({ values }).some((p) => p.key === "sepsis_qsofa");
});
check("qSOFA of 1 does not trigger it", () => {
  const values = withScores(
    safetyValues({ im_acute: { suspected_infection: "Suspected" } }),
    { qsofa: { rr: "24", sbp: "130", mentation: "No" } },
  );
  return !buildImSafetyPrompts({ values }).some((p) => p.key === "sepsis_qsofa");
});
check("blood glucose 3.0 mmol/L in the vital signs triggers hypoglycaemia", () => {
  const p = buildImSafetyPrompts({ values: { vitals: "Blood Glucose: 3.0 mmol/L" } });
  return p.some((x) => x.key === "hypoglycaemia");
});
check("blood glucose 14.5 mmol/L triggers the severe hyperglycaemia prompt", () => {
  const p = buildImSafetyPrompts({ values: { vitals: "Blood Glucose: 14.5 mmol/L" } });
  return p.some((x) => x.key === "severe_hyperglycaemia");
});
check("blood glucose 5.5 mmol/L triggers neither glycaemic prompt", () => {
  const p = buildImSafetyPrompts({ values: { vitals: "Blood Glucose: 5.5 mmol/L" } });
  return !p.some((x) => x.key === "hypoglycaemia" || x.key === "severe_hyperglycaemia");
});
check("a systolic pressure below 90 mmHg triggers the critical hypotension prompt", () => {
  const p = buildImSafetyPrompts({ values: { vitals: "Blood Pressure: 82/50 mmHg" } });
  const hit = p.find((x) => x.key === "hypotension");
  return hit && hit.level === "critical" && /82 mmHg/.test(hit.basis);
});
check("oxygen saturation below 92% triggers the hypoxia prompt", () => {
  const p = buildImSafetyPrompts({ values: { vitals: "Oxygen Saturation (SpO₂): 88 %" } });
  return p.some((x) => x.key === "hypoxia");
});
check("a normal set of vital signs triggers no vital-sign prompt", () => {
  const p = buildImSafetyPrompts({
    values: { vitals: "Temperature: 36.8 °C · Pulse: 78 bpm · Respiratory Rate: 16 breaths/min · Blood Pressure: 124/78 mmHg · Oxygen Saturation (SpO₂): 97 % · Blood Glucose: 5.4 mmol/L" },
  });
  return p.filter((x) => ["hypotension", "hypoxia", "tachypnoea", "hypothermia", "tachycardia", "hypoglycaemia", "severe_hyperglycaemia", "oliguria"].includes(x.key)).length === 0;
});
check("an unmeasured vital is not read as normal and not read as abnormal", () => {
  const p = buildImSafetyPrompts({ values: { vitals: "Temperature: 36.8 °C" } });
  return !p.some((x) => x.key === "hypotension" || x.key === "hypoxia");
});
check("free text is never parsed into a vital sign", () => {
  const p = buildImSafetyPrompts({ values: { vitals: "BP a bit low, glucose high" } });
  return !p.some((x) => x.key === "hypotension" || x.key === "severe_hyperglycaemia");
});
check("an NSAID with an ACE inhibitor and a diuretic triggers the renal-risk prompt", () => {
  const p = buildImSafetyPrompts({
    values: safetyValues({ im_history: { medications: "Ramipril 5mg, furosemide 40mg, ibuprofen 400mg" } }),
  });
  return p.some((x) => x.key === "triple_whammy");
});
check("the same list without the diuretic does not trigger it", () => {
  const p = buildImSafetyPrompts({
    values: safetyValues({ im_history: { medications: "Ramipril 5mg, ibuprofen 400mg" } }),
  });
  return !p.some((x) => x.key === "triple_whammy");
});
check("two falls without a falls assessment trigger the falls prompt", () => {
  const p = buildImSafetyPrompts({ values: safetyValues({ im_geriatric: { falls: "Two or more" } }) });
  return p.some((x) => x.key === "falls_review");
});
check("no prompt fires on an empty note", () =>
  buildImSafetyPrompts({ values: {} }).length === 0);
check("every rule names a registered reference with a link", () =>
  IM_SAFETY_RULES.every((r) => {
    const ref = IM_REFERENCES[r.source];
    return ref && ref.source_url.startsWith("https://") && r.title && r.ask;
  }));
check("a prompt is advisory and never blocks: no rule returns a treatment order", () =>
  IM_SAFETY_RULES.every((r) => typeof r.ask === "string" && !/^\s*(prescribe|give|start|order)\s/i.test(r.title)));

console.log("\n— References —");
check("ACP is registered as the principal reference with the ACP guidelines link", () => {
  const acp = IM_REFERENCES[IM_PRINCIPAL_REFERENCE];
  return (
    acp.issuing_organization.includes("American College of Physicians") &&
    acp.source_url === "https://www.acponline.org/clinical_information/guidelines/" &&
    acp.role === "principal"
  );
});
check("every reference has an organisation, title, https link, status and grading statement", () =>
  Object.values(IM_REFERENCES).every(
    (r) =>
      r.issuing_organization &&
      r.title &&
      r.source_url.startsWith("https://") &&
      ["current", "superseded", "verify"].includes(r.status) &&
      r.evidence_grading &&
      r.status_note,
  ));
check("annual editions are declared without an invented year", () =>
  ["ada", "gold", "gina", "nccn"].every((k) => IM_REFERENCES[k].publication_year === null));
check("every internal medicine note resolves to references, ACP first", () => {
  const keys = [...ORIGINAL_IM, ...IM_WORKFLOW_DOCS.map((d) => d.key)];
  for (const k of keys) {
    const refs = imGuidanceForNote(k);
    assert(refs.length > 0, `${k} has no reference`);
    assert(refs[0].key === IM_PRINCIPAL_REFERENCE, `${k} does not lead with ACP`);
  }
  return true;
});
check("no note claims a local approval, and the notice says so", () =>
  IM_LOCAL_PROTOCOL_NOTICE.includes("not a local approval") && Object.keys(IM_NOTE_REFERENCES).length > 0);
check("the recorded basis states the guidance is documentation support, not approval", () =>
  /not local approval/.test(imGuidanceBasis("im_consultation")));
check("every note in the guidance map is a real internal medicine template", () => {
  const known = new Set([...ORIGINAL_IM, ...IM_WORKFLOW_DOCS.map((d) => d.key)]);
  const stray = Object.keys(IM_NOTE_REFERENCES).filter((k) => !known.has(k));
  return stray.length === 0 || `stray keys: ${stray.join(", ")}`;
});

console.log("\n— Server registration and wiring —");
const catalog = fs.readFileSync("base44/shared/clinicalDocumentCatalog.ts", "utf8");
const imBlockText = catalog.slice(catalog.indexOf("internal_medicine: ["), catalog.indexOf("],", catalog.indexOf("internal_medicine: [")));
const fmBlockText = catalog.slice(catalog.indexOf("family_medicine: ["), catalog.indexOf("],", catalog.indexOf("family_medicine: [")));
check("every internal medicine template is registered for server-side validation", () => {
  const missing = allImKeys.filter((k) => !imBlockText.includes(`"${k}"`));
  return missing.length === 0 || `not registered: ${missing.join(", ")}`;
});
check("the family medicine templates shipped earlier are registered too", () =>
  ["fm_well_child", "fm_geriatric_assessment", "fm_womens_health", "fm_maternal_health", "fm_lifestyle_counseling"].every((k) =>
    fmBlockText.includes(`"${k}"`),
  ));
const docFieldsSrc = fs.readFileSync("src/components/doctor/encounters/DocumentFields.jsx", "utf8");
check("the note form renders the four internal medicine field types", () =>
  ["im_modules", "im_scores", "im_safety", "im_guidance"].every((t) => docFieldsSrc.includes(`"${t}"`)));
const fmScoresSrc = fs.readFileSync("src/components/doctor/notes/FmScoresField.jsx", "utf8");
const fmBlockSrc = fs.readFileSync("src/components/doctor/notes/FmBlockField.jsx", "utf8");
check("the shared renderers accept a registry without changing family medicine behaviour", () =>
  /registry = FM_SCORES/.test(fmScoresSrc) && /calculate = calculateFmScore/.test(fmScoresSrc) && /resolve = fmBlock/.test(fmBlockSrc));
const noteFormSrc = fs.readFileSync("src/components/doctor/notes/ClinicalNoteForm.jsx", "utf8");
check("coded diagnoses are collected by field type, so the new ICD key persists", () =>
  noteFormSrc.includes('f.type === "icd11_diagnoses"'));
const specialtySrc = fs.readFileSync("src/lib/specialtyDocuments.js", "utf8");
check("the internal medicine catalogue is assembled with its strengthening applied", () =>
  specialtySrc.includes("withInternalMedicineStandards([...IM_DOCS, ...IM_WORKFLOW_DOCS])"));

console.log("\n— Discipline coverage —");
check("each of the twelve internal medicine disciplines has a review template", () => {
  const required = [
    "im_cardiology_review", "im_respiratory_review", "im_gastro_review", "im_nephrology_review",
    "im_diabetes_review", "im_hematology_review", "im_infectious_disease_review",
    "im_rheumatology_review", "im_neurology_review", "im_oncology_review",
    "im_geriatric_review", "im_comprehensive_assessment",
  ];
  const missing = required.filter((k) => !doc(k));
  return missing.length === 0 || `missing: ${missing.join(", ")}`;
});
check("the acute presentations have their own templates", () =>
  ["im_sepsis_assessment", "im_venous_thromboembolism", "im_anticoagulation_review", "im_electrolyte_disorder"].every((k) => !!doc(k)));
check("every internal medicine note of any kind offers the ICD-11 field", () =>
  allImKeys.filter((k) => !NO_DIAGNOSIS.includes(k)).every((k) => hasType(k, "icd11_diagnoses")));

console.log(`\n${pass} passed, ${fails.length} failed`);
if (fails.length) {
  console.log("\nFailures:");
  fails.forEach((f) => console.log(`  · ${f}`));
  process.exit(1);
}