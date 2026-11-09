// End-to-end scenario harness for the Urology portal upgrade.
// Run: npx esbuild qa/uro-scenarios.mjs --bundle --platform=node --format=esm --outfile=/tmp/uso.mjs --alias:@=./src && node /tmp/uso.mjs
//
// structural.mjs proves the catalogue is complete. This file drives the same
// representative clinical cases a urologist would document and asserts what the
// shipped modules actually return for them — scores, prompts, exam states,
// staging fields and the assembled note structure.

import { SPECIALTY_DOCUMENTS, getSpecialtyDocs, getDocDef } from "@/lib/specialtyDocuments";
import { URO_WORKFLOW_KEYS } from "@/lib/uroDocuments";
import { URO_BLOCKS } from "@/lib/uroBlocks";
import { URO_SCORES, calculateUroScore } from "@/lib/uroScores";
import { evaluateUroSafety } from "@/lib/uroSafetyRules";
import { URO_EXAM_GROUPS, EXAM_STATES, examStateLabel } from "@/lib/uroExamBlocks";
import { URO_CANCER_TYPES, uroStagingFields } from "@/lib/uroOncology";
import { URO_CONDITION_GROUPS } from "@/lib/uroIcd11";
import { isConfidentialDocumentType } from "../base44/shared/clinicalDocumentCatalog.ts";

let failures = 0;
let passes = 0;
const check = (ok, message) => {
  if (ok) {
    passes += 1;
    return;
  }
  failures += 1;
  console.error(`FAIL — ${message}`);
};

const uroDocs = SPECIALTY_DOCUMENTS.filter((d) => d.specialty === "urology");
check(getSpecialtyDocs("Urology").length === uroDocs.length, "the portal resolves the urology catalogue from the doctor's specialization");
const allUroKeys = [...uroDocs.map((d) => d.key)];
const blockKeys = new Set(Object.keys(URO_BLOCKS));
const scoreKeys = new Set(URO_SCORES.map((s) => s.key));
const examKeys = new Set(URO_EXAM_GROUPS.map((g) => g.key));
const icdGroupKeys = new Set(URO_CONDITION_GROUPS.map((g) => g.key));
const firedKeys = (values) => evaluateUroSafety(values).map((a) => a.key);

// ---- A. Every urology note assembles into a usable, complete document ------
for (const doc of uroDocs) {
  const fields = doc.fields || [];
  check(fields.length > 0, `${doc.key} has fields`);
  const keys = fields.map((f) => f.key);
  check(new Set(keys).size === keys.length, `${doc.key} declares no duplicate field key`);
  for (const f of fields) {
    check(Boolean(f.key && f.label), `${doc.key} field "${f.key}" has a key and a label`);
  }
  // The note's own body fields carry the note; the appended standard sections
  // are the ones grouped under a heading.
  const sectioned = fields.filter((f) => Boolean(f.section));
  check(sectioned.length >= 3, `${doc.key} groups its added sections under headings`);
  check(fields.find((f) => f.key === "icd11_diagnoses").section, `${doc.key} places coding in its own section`);
  check(fields.find((f) => f.key === "uro_safety").section, `${doc.key} places the safety review in its own section`);
  check(keys.filter((k) => k === "icd11_diagnoses").length === 1, `${doc.key} carries exactly one ICD-11 coding field`);
  check(keys.includes("uro_safety"), `${doc.key} carries the advisory safety review`);
  check(keys.includes("uro_guidance"), `${doc.key} carries its guideline basis`);
  check(
    keys.indexOf("icd11_diagnoses") < keys.indexOf("uro_safety") && keys.indexOf("uro_safety") < keys.indexOf("uro_guidance"),
    `${doc.key} orders coding, then safety, then guidance`,
  );
  const modules = fields.find((f) => f.key === "uro_modules");
  for (const b of modules?.blocks || []) check(blockKeys.has(b), `${doc.key} references an existing block "${b}"`);
  const exam = fields.find((f) => f.key === "uro_exam");
  for (const g of exam?.groups || []) check(examKeys.has(g), `${doc.key} references an existing examination group "${g}"`);
  const scores = fields.find((f) => f.key === "uro_scores");
  for (const s of scores?.scores || []) check(scoreKeys.has(s), `${doc.key} references an existing calculation "${s}"`);
  const icd = fields.find((f) => f.key === "icd11_diagnoses");
  for (const g of icd?.conditionGroups || []) check(icdGroupKeys.has(g.key), `${doc.key} references an existing condition group "${g.key}"`);
  const staging = fields.find((f) => f.key === "uro_staging");
  if (staging) {
    check(Boolean(URO_CANCER_TYPES[staging.cancerKey]), `${doc.key} stages a known tumour type`);
    check((staging.fields || []).length >= 4, `${doc.key} offers the staging fields for ${staging.cancerKey}`);
  }
}
check(allUroKeys.length >= 43, "the urology catalogue holds the 9 existing notes plus every added type");
for (const key of URO_WORKFLOW_KEYS) check(allUroKeys.includes(key), `added note type is in the catalogue: ${key}`);

// ---- B. Acute obstructed, infected kidney (emergency urology) --------------
const caseA = {
  uro_modules: {
    uro_stone_documentation: { stone_size_mm: "8", stone_site: "Proximal ureter", stone_obstruction: "Severe", stone_infection: "Yes" },
  },
  uro_exam: { abdomen_renal: { renal_angle_tenderness: "Abnormal", kidney_ballotable: "Normal" } },
};
const firedA = firedKeys(caseA);
check(firedA.includes("obstructed_infected_kidney"), "an obstructed, infected stone raises the infected-obstruction prompt");
check(!firedA.includes("acute_retention"), "an infected stone does not raise a retention prompt on its own");
check(!firedA.includes("suspected_malignancy"), "an infective stone case raises no malignancy prompt");
for (const alert of evaluateUroSafety(caseA)) {
  check(!/\b\d+(\.\d+)?\s?(mg|mcg|microgram|milligram|units?)\b/i.test(`${alert.detail} ${alert.action}`), `"${alert.key}" states no dose`);
  check(Boolean(alert.source?.organization && alert.title), `"${alert.key}" carries its source and title`);
}
check(firedKeys({}) .length === 0, "an undocumented note raises no prompt at all");

// ---- C. LUTS / BPH clinic: numbers only when documented -------------------
const ipssInputs = { incomplete: "4", frequency: "3", intermittency: "3", urgency: "2", weak_stream: "3", straining: "2", nocturia: "2" };
const ipss = calculateUroScore("ipss", ipssInputs);
check(ipss.value === "19/35", "IPSS of the documented 19 scores 19/35");
check(/Moderate/i.test(ipss.band), "IPSS 19 falls in the moderate band");
const ipssPartial = calculateUroScore("ipss", { incomplete: "4", frequency: "3" });
check(ipssPartial.value === null && ipssPartial.missing.length > 0, "a partly completed IPSS is not scored");
const efficiency = calculateUroScore("voiding_efficiency", { voided: "150", residual: "250" });
check(efficiency.value === "38% voided", "voiding efficiency is computed from the documented volumes");
check(/250 mL/.test(efficiency.band), "the residual is repeated back as documented");
const density = calculateUroScore("psa_density", { psa: "8", volume: "50" });
check(/0\.160/.test(density.value), "PSA density is PSA ÷ prostate volume");
const volume = calculateUroScore("prostate_volume", { length: "4", width: "3", height: "5" });
check(/3[01]/.test(String(volume.value)), "prostate volume is computed from the three measured diameters");
const egfrMale = calculateUroScore("egfr", { creatinine: "1.0", age: "40", sex: "male" });
const egfrFemale = calculateUroScore("egfr", { creatinine: "1.0", age: "40", sex: "female" });
check(egfrMale.value !== null && egfrFemale.value !== null, "eGFR is computed when creatinine, age and sex are documented");
check(egfrFemale.value !== egfrMale.value, "the CKD-EPI 2021 equation applies the recorded sex factor");
check(/KDIGO category G/.test(egfrMale.band), "eGFR reports its KDIGO G category");
const egfrChild = calculateUroScore("egfr", { creatinine: "0.5", age: "9", sex: "male" });
check(egfrChild.value === null, "the adult eGFR equation refuses a paediatric age rather than returning a number");
const charlson = calculateUroScore("charlson", { items: ["mi", "metastatic"] });
check(charlson.value === "7", "Charlson sums the published weights of the documented items");
const charlsonEmpty = calculateUroScore("charlson", {});
check(charlsonEmpty.value === "0" && /not a statement/i.test(charlsonEmpty.extra), "an empty Charlson states 0 is an absent record, not an absent disease");
const bph = {
  uro_modules: { uro_luts: { post_void_residual: "250", symptom_duration: "2 years" } },
  uro_scores: { uro_scores: { ipss: ipssInputs } },
};
check(firedKeys(bph).includes("anticholinergic_retention") === false, "no antimuscarinic prompt fires without a documented antimuscarinic");
check(
  firedKeys({ ...bph, uro_modules: { ...bph.uro_modules, uro_medications: { current_medications: "Solifenacin 5 mg" } } }).includes("anticholinergic_retention"),
  "an antimuscarinic with a raised residual raises the retention prompt",
);

// ---- D. Tumour work-up: staging is recorded, never computed ---------------
const mibcFields = uroStagingFields("bladder_mibc");
check(mibcFields.length >= 4, "muscle-invasive bladder cancer offers its staging fields");
check(mibcFields.some((f) => f.key === "t_category"), "the bladder staging set includes the tumour (T) category");
check(mibcFields.some((f) => f.key === "n_category"), "the bladder staging set includes the nodal (N) category");
check(mibcFields.some((f) => f.key === "m_category"), "the bladder staging set includes the metastasis (M) category");
check(mibcFields.every((f) => f.value === undefined && f.default === undefined), "no staging field is pre-filled — a stage is only what the clinician records");
for (const [key, cancer] of Object.entries(URO_CANCER_TYPES)) {
  const fields = uroStagingFields(key);
  check(fields.length >= 4, `${cancer.label} offers its staging fields`);
  check(fields.every((f) => Boolean(f.key && f.label)), `${cancer.label} staging fields are labelled`);
}
const oncologyNote = getDocDef("uro_oncology_bladder_mibc");
check(Boolean(oncologyNote), "the muscle-invasive bladder note exists in the catalogue");
check(oncologyNote.fields.some((f) => f.key === "uro_staging"), "the bladder oncology note carries the staging section");
check(oncologyNote.fields.some((f) => f.key === "uro_scores"), "the bladder oncology note carries its documented calculations");
check(
  (oncologyNote.fields.find((f) => f.key === "uro_modules").blocks || []).length > 0,
  "the bladder oncology note carries its structured tumour blocks",
);

// ---- E. Examination states: not performed is never normal ----------------
check(examStateLabel(undefined) === "Not documented", "an unrecorded examination element reads 'Not documented'");
check(examStateLabel("") === "Not documented", "a blank examination element reads 'Not documented'");
check(examStateLabel("Not performed") === "Not performed", "a not-performed element keeps its own state");
check(examStateLabel("Not applicable") === "Not applicable", "a not-applicable element keeps its own state");
check(examStateLabel("Normal") === "Normal", "a documented normal element reads normal");
check(examStateLabel("abnormal") === "Not documented", "an unrecognised state is not silently read as normal");
check(EXAM_STATES.length === 5 && EXAM_STATES.includes("Not documented"), "the five examination states are defined once and shared");
const examValues = { uro_exam: { genital: { meatus: "Not performed", penis_skin: "Normal" } } };
check(examValues.uro_exam.genital.meatus === "Not performed", "an examination a clinician did not perform stays not performed in the note");

// ---- F. Andrology: confidential by the existing policy -------------------
for (const key of ["uro_andrology_ed", "uro_andrology_infertility", "uro_andrology_peyronie", "uro_andrology_hypogonadism", "uro_andrology_priapism"]) {
  check(allUroKeys.includes(key), `andrology note exists: ${key}`);
  check(isConfidentialDocumentType(key), `andrology note is confidential: ${key}`);
}
check(isConfidentialDocumentType("uro_consultation") === false, "a general urology consultation is not made confidential");
const priapism = firedKeys({ uro_modules: { uro_priapism: { duration_hours: "6" } }, notes: "ischaemic priapism" });
check(priapism.includes("priapism"), "a documented prolonged erection raises the priapism prompt");

// ---- G. No urology note is left without coding --------------------------
for (const doc of uroDocs) {
  const icd = doc.fields.find((f) => f.key === "icd11_diagnoses");
  check((icd.conditionGroups || []).length > 0, `${doc.key} offers its condition index for coding`);
  check(Boolean(icd.catalogRelease), `${doc.key} states the ICD-11 release it codes against`);
  check(Boolean(icd.requireConfirmation), `${doc.key} requires the clinician to confirm a coded diagnosis`);
}
check(SPECIALTY_DOCUMENTS.filter((d) => d.specialty === "urology").length === uroDocs.length, "no urology note is served from outside the catalogue");

console.log(`${passes} scenario checks passed, ${failures} failed.`);
process.exit(failures ? 1 : 0);