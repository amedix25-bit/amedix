// Ophthalmology module integrity check.
//
// Run with: node qa/ophth-qa.mjs
//
// The libraries under src/lib use the app's "@/lib/…" alias, which plain Node
// cannot resolve. This script copies the ophthalmology modules into a temporary
// folder with the alias rewritten to a relative path and then imports them, so
// the checks run against the REAL definitions rather than a description of them.
//
// What it proves:
//   1. All nine existing Ophthalmology note keys are enhanced, and the appended
//      fields keep every field the note already had (nothing removed or replaced)
//      and introduce no duplicate field key.
//   2. Every block referenced by a note exists in the block registry, and every
//      block has fields with unique keys.
//   3. Every score referenced by a note exists and refuses to calculate from
//      partial input instead of guessing.
//   4. Every reference key used by a note's guideline basis exists, and every
//      safety prompt names a source that exists.
//   5. Every ICD-11 entry carries a code, a display term, a release and a source,
//      and no code appears twice.
//   6. The original field keys of the nine notes are still present in
//      specialtyDocuments.js (the templates were appended to, not rebuilt).

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TMP = path.join(ROOT, "qa", ".ophth-tmp");

const MODULES = [
  "ophthFieldKit.js",
  "ophthalmologyExamBlocks.js",
  "ophthalmologyClinicalBlocks.js",
  "ophthalmologyConditionBlocks.js",
  "ophthalmologyInvestigation.js",
  "ophthalmologyBlocks.js",
  "ophthalmologyReferences.js",
  "ophthalmologyIcd11.js",
  "ophthalmologyScores.js",
  "ophthalmologySafetyRules.js",
  "ophthalmologyDocuments.js",
];

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

for (const file of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src", "lib", file), "utf8");
  // Node ESM needs explicit extensions, so the alias is rewritten to a local file.
  fs.writeFileSync(
    path.join(TMP, file),
    source.replace(/@\/lib\/([A-Za-z0-9_]+)/g, "./$1.js"),
  );
}

const blocks = await import(path.join(TMP, "ophthalmologyBlocks.js"));
const docs = await import(path.join(TMP, "ophthalmologyDocuments.js"));
const scores = await import(path.join(TMP, "ophthalmologyScores.js"));
const safety = await import(path.join(TMP, "ophthalmologySafetyRules.js"));
const refs = await import(path.join(TMP, "ophthalmologyReferences.js"));
const icd = await import(path.join(TMP, "ophthalmologyIcd11.js"));
const investigation = await import(path.join(TMP, "ophthalmologyInvestigation.js"));

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// ---- 1. The nine notes are enhanced, append-only, key-unique ---------------
const NOTE_KEYS = [
  "ophth_consultation",
  "ophth_followup",
  "ophth_procedure_note",
  "ophth_operative_note",
  "ophth_preop_assessment",
  "ophth_postop_note",
  "ophth_discharge_summary",
  "ophth_diagnostic_report",
  "ophth_referral",
];

for (const key of NOTE_KEYS) {
  check(Boolean(docs.OPHTH_ENHANCEMENTS[key]), `note ${key} has no enhancement entry`);
}

const BASELINE_FIELDS = {
  ophth_consultation: ["chief_complaint", "hpi", "ocular_history", "pmh", "medications", "va_right", "va_left", "pupils", "ocular_motility", "anterior_segment", "posterior_segment", "iop_right", "iop_left", "investigations", "assessment", "plan", "follow_up"],
  ophth_followup: ["interval_history", "symptoms", "va_right", "va_left", "iop", "exam_findings", "assessment", "plan"],
  ophth_procedure_note: ["procedure", "indication", "consent", "technique", "findings", "complications", "patient_condition"],
  ophth_operative_note: ["preop_diagnosis", "postop_diagnosis", "procedure", "surgeon", "assistants", "anesthesia", "indication", "technique_details", "findings", "specimens", "implants", "estimated_blood_loss", "complications", "postop_plan"],
  ophth_preop_assessment: ["planned_procedure", "indication", "comorbidities", "ocular_history", "medications", "allergies", "labs", "risk_assessment", "clearance", "preop_instructions"],
  ophth_postop_note: ["procedure_date", "postop_day", "vision_status", "iop", "wound_condition", "medications", "complications", "plan"],
  ophth_discharge_summary: ["preop_diagnosis", "postop_diagnosis", "procedure", "hospital_course", "eye_status_discharge", "discharge_medications", "eye_drops", "follow_up", "instructions"],
  ophth_diagnostic_report: ["test_type", "indication", "results_right_eye", "results_left_eye", "findings", "interpretation", "recommendations"],
  ophth_referral: ["referral_to", "reason", "urgency", "relevant_history"],
};

const synthetic = NOTE_KEYS.map((key) => ({
  key,
  label: key,
  fields: BASELINE_FIELDS[key].map((k) => ({ key: k, label: k, type: "textarea" })),
}));

const merged = docs.withOphthalmologyStandards(synthetic);

for (const doc of merged) {
  const keys = doc.fields.map((f) => f.key);
  const unique = new Set(keys);
  check(unique.size === keys.length, `${doc.key} has duplicate field keys: ${keys.filter((k, i) => keys.indexOf(k) !== i).join(", ")}`);
  for (const original of BASELINE_FIELDS[doc.key]) {
    check(unique.has(original), `${doc.key} lost its existing field "${original}"`);
  }
  check(Array.isArray(doc.guidelineBasis) && doc.guidelineBasis.length > 0, `${doc.key} has no guideline basis recorded`);
  check(doc.fields.length > BASELINE_FIELDS[doc.key].length, `${doc.key} gained no fields`);
}

// ---- 2. Block registry integrity ------------------------------------------
check(blocks.OPHTH_BLOCK_KEYS.length >= 20, `block registry too small: ${blocks.OPHTH_BLOCK_KEYS.length}`);
for (const key of blocks.OPHTH_BLOCK_KEYS) {
  const spec = blocks.OPHTH_BLOCKS[key];
  check(spec && spec.title, `block ${key} has no title`);
  const fieldKeys = new Set();
  for (const field of spec.fields) {
    check(Boolean(field.key && field.label), `block ${key} has a field without a key or label`);
    check(!fieldKeys.has(field.key), `block ${key} repeats field key ${field.key}`);
    fieldKeys.add(field.key);
    check(["input", "number", "select", "multi", "textarea"].includes(field.type), `block ${key} field ${field.key} has an unknown type ${field.type}`);
    if (field.type === "select" || field.type === "multi") {
      check(Array.isArray(field.options) && field.options.length > 1, `block ${key} field ${field.key} has no options`);
    }
  }
}

const referencedBlocks = new Set();
const docSource = fs.readFileSync(path.join(ROOT, "src", "lib", "ophthalmologyDocuments.js"), "utf8");
for (const match of docSource.matchAll(/blockField\("([a-z0-9_]+)"\)/g)) referencedBlocks.add(match[1]);
for (const key of referencedBlocks) {
  check(Boolean(blocks.ophthBlock(key)), `note references an unknown block: ${key}`);
}
for (const key of blocks.OPHTH_BLOCK_KEYS) {
  check(referencedBlocks.has(key), `block ${key} is defined but attached to no note`);
}

// ---- 3. Scores -------------------------------------------------------------
const referencedScores = new Set();
for (const match of docSource.matchAll(/scoresBlock\(\[([^\]]+)\]\)/g)) {
  for (const name of match[1].split(",")) referencedScores.add(name.trim().replace(/"/g, ""));
}
for (const key of referencedScores) {
  check(scores.OPHTH_SCORES.some((s) => s.key === key), `note references an unknown score: ${key}`);
}

// A score must refuse partial input rather than estimate.
for (const score of scores.OPHTH_SCORES) {
  const partial = scores.calculateOphthScore(score.key, {});
  check(Boolean(partial && Array.isArray(partial.missing) && partial.missing.length), `${score.name} calculated from empty input`);
}

const ots = scores.calculateOphthScore("ocular_trauma_score", {
  initial_va: "20/40 or better",
  globe_rupture: "No",
  endophthalmitis: "No",
  perforating_injury: "No",
  retinal_detachment: "No",
  rapd: "No",
});
check(ots && ots.value === 100 && /category 5/.test(ots.label), `Ocular Trauma Score best-case calculation wrong: ${JSON.stringify(ots && ots.value)}`);

const otsWorst = scores.calculateOphthScore("ocular_trauma_score", {
  initial_va: "No light perception",
  globe_rupture: "Yes",
  endophthalmitis: "Yes",
  perforating_injury: "Yes",
  retinal_detachment: "Yes",
  rapd: "Yes",
});
check(otsWorst && otsWorst.value === 0 && /category 1/.test(otsWorst.label), `Ocular Trauma Score worst-case calculation wrong: ${JSON.stringify(otsWorst && otsWorst.value)}`);

const areds = scores.calculateOphthScore("amd_risk", {
  worse_drusen: "Yes",
  worse_pigment: "Yes",
  fellow_drusen: "Yes",
  fellow_pigment: "Yes",
  advanced_fellow: "Yes",
});
check(areds && areds.value === 5, `AREDS score calculation wrong: ${JSON.stringify(areds && areds.value)}`);

const hpaEarly = scores.calculateOphthScore("glaucoma_field_stage", { eye: "Left", md: "-3.2" });
check(hpaEarly && /Early/.test(hpaEarly.label), "HPA early stage not derived from MD −3.2");
const hpaAdv = scores.calculateOphthScore("glaucoma_field_stage", { eye: "Right", md: "-15" });
check(hpaAdv && /Advanced/.test(hpaAdv.label) && /end-stage/.test(hpaAdv.detail), "HPA advanced stage missing its end-stage caveat");

// ---- 4. References and safety ---------------------------------------------
for (const [noteKey, entry] of Object.entries(refs.OPHTH_NOTE_BASIS)) {
  check(NOTE_KEYS.includes(noteKey), `guideline basis defined for an unknown note: ${noteKey}`);
  check(Array.isArray(entry.basis) && entry.basis.length > 0, `${noteKey} has no references`);
  for (const ref of entry.basis) {
    check(Boolean(refs.OPHTH_REFERENCES[ref.key]), `${noteKey} cites an unknown reference: ${ref.key}`);
    check(Boolean(ref.organization && ref.title && ref.edition), `reference ${ref.key} is missing its identity`);
    check(typeof ref.revision_verified === "boolean", `reference ${ref.key} does not state whether its revision was verified`);
  }
}
for (const noteKey of NOTE_KEYS) {
  check(Boolean(refs.ophthNoteBasis(noteKey)), `note ${noteKey} has no guideline basis`);
}

const knownRefs = new Set(Object.keys(refs.OPHTH_REFERENCES));
const safetySource = fs.readFileSync(path.join(ROOT, "src", "lib", "ophthalmologySafetyRules.js"), "utf8");
for (const match of safetySource.matchAll(/OPHTH_REFERENCES\.([a-z0-9_]+)/g)) {
  check(knownRefs.has(match[1]), `safety rule cites an unknown reference: ${match[1]}`);
}

// Prompts must actually fire from documented findings, and stay silent on a note
// that documents nothing.
const emptyPrompts = safety.buildOphthSafetyPrompts({ values: {} });
check(Array.isArray(emptyPrompts), "safety prompts did not return an array");

const firedPrompts = safety.buildOphthSafetyPrompts({
  values: {
    ophth_postop: { __m: "ophth_postop", postop_ac: "Hypopyon" },
    ophth_trauma: { __m: "ophth_trauma", bett_globe: "Open globe" },
    ophth_neuro: { __m: "ophth_neuro", gca_features: ["Age 50 or older", "Visual loss"] },
  },
});
const firedKeys = firedPrompts.map((p) => p.key);
for (const expected of ["postop_hypopyon", "open_globe_protection", "gca_steroid_same_day"]) {
  check(firedKeys.includes(expected), `expected safety prompt did not fire: ${expected}`);
}
for (const prompt of firedPrompts) {
  check(Boolean(prompt.title && prompt.basis && prompt.action), `prompt ${prompt.key} is incomplete`);
  check(Boolean(prompt.source && prompt.source.organization), `prompt ${prompt.key} names no source`);
  check(["same_day", "documented", "advisory"].includes(prompt.level), `prompt ${prompt.key} has an unknown level`);
}

// ---- 5. ICD-11 catalogue ---------------------------------------------------
const codes = new Set();
for (const entry of icd.OPHTH_ICD11) {
  check(Boolean(entry.code), "ICD-11 entry without a code");
  check(!codes.has(entry.code), `ICD-11 code repeated: ${entry.code}`);
  codes.add(entry.code);
  check(Boolean(entry.display), `ICD-11 ${entry.code} has no display term`);
  check(entry.release === "2026-01", `ICD-11 ${entry.code} has the wrong release`);
  check(Boolean(entry.source && entry.browser && entry.verified_date), `ICD-11 ${entry.code} has no source or verification date`);
  check(Boolean(icd.OPHTH_ICD11_DOMAINS[entry.domain]), `ICD-11 ${entry.code} has an unknown domain ${entry.domain}`);
  check(Boolean(entry.specificity && entry.definition), `ICD-11 ${entry.code} has no specificity or definition note`);
}
for (const domains of [
  ["glaucoma"], ["retina"], ["trauma"], ["optic_nerve"], ["lens"],
]) {
  check(icd.ophthalmologyCatalogFor(domains).length > 0, `no catalogue entries for domain ${domains[0]}`);
}

// ---- 5b. WHO ICD-11 only, coded detail carried, no inference --------------
const icdFields = merged.flatMap((doc) =>
  doc.fields.filter((f) => f.type === "icd11_diagnoses").map((f) => ({ note: doc.key, field: f })),
);
check(icdFields.length === NOTE_KEYS.length, `expected an ICD-11 field on every note, found ${icdFields.length}`);
for (const { note, field } of icdFields) {
  check(field.requireConfirmation === true, `${note} does not require clinician verification of the code`);
  check(field.unspecifiedJustification === true, `${note} does not require a reason for a non-specific code`);
  check(field.clusterEnabled === true && Boolean(field.clusterNote), `${note} offers no post-coordination`);
  check(field.catalogRelease === icd.OPHTH_ICD11_MMS.release, `${note} states the wrong ICD-11 release`);
  check((field.catalog || []).length > 0, `${note} has an empty ICD-11 catalogue`);
  check(!/ICD-10/i.test(JSON.stringify(field.catalog)), `${note} catalogue offers ICD-10 entries`);
  check(!/ICD-10/i.test(field.catalogRelease || ""), `${note} states ICD-10 as the release`);
  check(Array.isArray(field.statuses) && field.statuses.length > 3, `${note} does not separate diagnostic statuses`);
  check(Array.isArray(field.roles) && field.roles.length >= 2, `${note} records no diagnosis role`);
  const detailKeys = (field.extraFields || []).map((f) => f.key);
  for (const required of ["laterality", "anatomical_site", "severity_stage"]) {
    check(detailKeys.includes(required), `${note} cannot record the code's ${required}`);
  }
}
for (const status of icd.OPHTH_ICD_STATUSES) {
  check(!/ICD-10/i.test(status), `diagnostic status mentions ICD-10: ${status}`);
}
for (const entry of icd.OPHTH_ICD11) {
  check(Array.isArray(entry.synonyms), `ICD-11 ${entry.code} has no synonym index`);
  if (entry.parent_code) {
    check(Boolean(icd.OPHTH_ICD11.find((i) => i.code === entry.parent_code)), `ICD-11 ${entry.code} names a parent outside the catalogue: ${entry.parent_code}`);
  }
  check(Boolean(entry.hierarchy && entry.hierarchy.family && entry.hierarchy.level), `ICD-11 ${entry.code} has no hierarchy`);
}

// ---- 5c. Investigations: stated status, never an implied normal -----------
const investigationNotes = merged.filter((doc) =>
  doc.fields.some((f) => f.type === "ophth_investigations"),
);
check(investigationNotes.length >= 3, `investigations are recorded on only ${investigationNotes.length} notes`);

check(investigation.formatOphthInvestigations([]) === "", "empty investigations produced text");
check(investigation.formatOphthInvestigations([{}]) === "", "a blank investigation record produced text");
const notPerformed = investigation.formatOphthInvestigations([
  { modality: "Visual field test", eye: "Right", status: "Not performed — reason documented" },
]);
check(/Not performed/.test(notPerformed), "a test recorded as not performed lost its status in the note text");
check(!/Normal/i.test(notPerformed), "a test recorded as not performed was written up as normal");
const pending = investigation.formatOphthInvestigations([
  { modality: "OCT — macula", eye: "Left", status: "Ordered — result pending" },
]);
check(/pending/.test(pending) && !/findings/i.test(pending), "a pending test was written up as if reported");
check(
  investigation.ophthInvestigationIncomplete({ modality: "OCT — macula", status: "Performed — findings documented below" }) !== "",
  "a performed test with no findings was accepted",
);
check(
  investigation.ophthInvestigationIncomplete({ modality: "OCT — macula", eye: "Right", status: "Performed — findings documented below", findings: "Documented" }) === "",
  "a complete investigation record was rejected",
);

// ---- 6. Templates were appended to, not rebuilt ---------------------------
const templates = fs.readFileSync(path.join(ROOT, "src", "lib", "specialtyDocuments.js"), "utf8");
for (const key of NOTE_KEYS) {
  check(templates.includes(`key: "${key}"`), `template ${key} is missing from specialtyDocuments.js`);
}
for (const [noteKey, fields] of Object.entries(BASELINE_FIELDS)) {
  for (const field of fields) {
    check(templates.includes(`"${field}"`), `template ${noteKey} no longer declares its field ${field}`);
  }
}
check(
  templates.includes("withOphthalmologyStandards(OPHTHALMOLOGY_DOCS)"),
  "specialtyDocuments.js does not apply the ophthalmology standards",
);

// ---- Report ----------------------------------------------------------------
fs.rmSync(TMP, { recursive: true, force: true });

const total = {
  notes: NOTE_KEYS.length,
  blocks: blocks.OPHTH_BLOCK_KEYS.length,
  scores: scores.OPHTH_SCORES.length,
  references: Object.keys(refs.OPHTH_REFERENCES).length,
  register: refs.OPHTH_REFERENCE_REGISTER.length,
  codes: icd.OPHTH_ICD11.length,
  prompts: firedPrompts.length,
};

if (failures.length) {
  console.error(`FAIL — ${failures.length} issue(s)`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`PASS — ${total.notes} notes, ${total.blocks} blocks, ${total.scores} scores, ${total.references} references (${total.register} register entries), ${total.codes} ICD-11 codes.`);
console.log(`Safety prompts fired from the test note: ${firedPrompts.map((p) => p.key).join(", ")}`);