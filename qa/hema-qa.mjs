// Hematology ICD-11 coding layer — integrity check.
//
// Run with: node qa/hema-qa.mjs
//
// The libraries under src/lib use the app's "@/lib/…" alias, which plain Node
// cannot resolve. This script copies the hematology modules into a temporary
// folder with the alias rewritten to a relative path and imports them, so the
// checks run against the REAL definitions rather than a description of them.
//
// What it proves:
//   1. All eight existing Hematology note keys are enhanced, append-only, and
//      introduce no duplicate field key.
//   2. Every original field of every Hematology note is still declared in
//      specialtyDocumentsPart4.js — the templates were appended to, not rebuilt.
//   3. Every ICD-11 entry carries a code, a WHO display term, a release, a
//      source, a valid mapping state and a known domain; no code appears twice;
//      no code looks like an ICD-10 code.
//   4. Every entry the catalogue calls verified is not flagged for review, and
//      every review-required entry says in its coding note why.
//   5. The per-note domain filter returns only entries of that note's domains,
//      and a note never offers another specialty's codes.
//   6. The field options the note receives are the specialty's own statuses,
//      roles and detail fields, with confirmation and justification enforced.
//   7. specialtyDocuments.js actually applies the hematology standards.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TMP = path.join(ROOT, "qa", ".hema-tmp");

const MODULES = [
  "hematologyFieldKit.js",
  "hematologyLabCatalogue.js",
  "hematologyAshGuidelines.js",
  "hematologyAshManagement.js",
  "hematologyClinicalBlocks.js",
  "hematologyConditionBlocks.js",
  "hematologyBlocks.js",
  "hematologyScores.js",
  "hematologyClinicalSections.js",
  "hematologyIcd11.js",
  "hematologySafetyRules.js",
  "hematologyDocuments.js",
];

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

for (const file of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src", "lib", file), "utf8");
  fs.writeFileSync(path.join(TMP, file), source.replace(/@\/lib\/([A-Za-z0-9_]+)/g, "./$1.js"));
}

const icd = await import(path.join(TMP, "hematologyIcd11.js"));
const docs = await import(path.join(TMP, "hematologyDocuments.js"));
const blocks = await import(path.join(TMP, "hematologyBlocks.js"));
const sections = await import(path.join(TMP, "hematologyClinicalSections.js"));
const safety = await import(path.join(TMP, "hematologySafetyRules.js"));
const ash = await import(path.join(TMP, "hematologyAshGuidelines.js"));
const ashMgmt = await import(path.join(TMP, "hematologyAshManagement.js"));

const PART4 = fs.readFileSync(path.join(ROOT, "src", "lib", "specialtyDocumentsPart4.js"), "utf8");
const TEMPLATES = fs.readFileSync(path.join(ROOT, "src", "lib", "specialtyDocuments.js"), "utf8");

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// ---- 1. The eight notes are enhanced, append-only, key-unique --------------
const NOTE_KEYS = [
  "hema_consultation",
  "hema_followup",
  "hema_progress_note",
  "hema_transfusion_record",
  "hema_infusion_record",
  "hema_bone_marrow_record",
  "hema_treatment_plan",
  "hema_discharge_summary",
];

for (const key of NOTE_KEYS) {
  check(Boolean(docs.HEMA_ENHANCEMENTS[key]), `note ${key} has no enhancement entry`);
}

// ---- 2. The original field keys are still declared in the templates --------
// The Hematology block of specialtyDocumentsPart4.js is read as text: every field
// key the file declares for a hema_ note must survive in the enhanced note.
const hemaBlock = PART4.slice(PART4.indexOf("const HEMATOLOGY_DOCS = ["), PART4.indexOf("const FAMILY_MEDICINE_DOCS = ["));
const noteSections = hemaBlock.split(/key: "(hema_[a-z_]+)"/).slice(1);
const baseline = {};
for (let i = 0; i < noteSections.length; i += 2) {
  const key = noteSections[i];
  const body = noteSections[i + 1] || "";
  baseline[key] = [...body.matchAll(/\b[INTS]\("([a-z0-9_]+)"/g)].map((m) => m[1]);
}

for (const key of NOTE_KEYS) {
  check(Array.isArray(baseline[key]) && baseline[key].length > 0, `no original fields found for ${key}`);
}

const enhanced = docs.withHematologyStandards(
  NOTE_KEYS.map((key) => ({ key, label: key, specialty: "hematology", fields: (baseline[key] || []).map((k) => ({ key: k, label: k, type: "input" })) })),
);

for (const doc of enhanced) {
  const keys = (doc.fields || []).map((f) => f.key);
  check(new Set(keys).size === keys.length, `${doc.key} has a duplicate field key after enhancement`);
  for (const original of baseline[doc.key] || []) {
    check(keys.includes(original), `${doc.key} lost its original field "${original}"`);
  }
  const icdFields = (doc.fields || []).filter((f) => f.type === "icd11_diagnoses");
  check(icdFields.length === 1, `${doc.key} does not carry exactly one ICD-11 diagnosis field`);
  const field = icdFields[0];
  if (!field) continue;
  check(field.key === "icd11_diagnoses", `${doc.key} ICD field has an unexpected key "${field.key}"`);
  check(Array.isArray(field.catalog) && field.catalog.length > 0, `${doc.key} ICD field has no catalogue`);
  check(field.requireConfirmation === true, `${doc.key} does not require clinician confirmation`);
  check(field.unspecifiedJustification === true, `${doc.key} does not require justification of a less specific category`);
  check(field.clusterEnabled === true, `${doc.key} does not allow a WHO postcoordinated cluster`);
  check(field.statuses === icd.HEMA_ICD_STATUSES, `${doc.key} does not use the specialty statuses`);
  check(field.roles === icd.HEMA_ICD_ROLES, `${doc.key} does not use the specialty roles`);
  check(field.extraFields === icd.HEMA_ICD_DETAIL_FIELDS, `${doc.key} does not use the specialty detail fields`);
  for (const entry of field.catalog) {
    check(NOTE_DOMAINS_OK(doc.key, entry.domain), `${doc.key} offers out-of-scope domain "${entry.domain}" (${entry.code})`);
  }
}

function NOTE_DOMAINS_OK(noteKey, domain) {
  const domains = {
    hema_consultation: null,
    hema_followup: null,
    hema_progress_note: null,
    hema_discharge_summary: null,
    hema_transfusion_record: ["erythroid", "haemolytic", "haemoglobinopathy", "marrow_failure", "platelet", "coagulation", "thrombotic"],
    hema_infusion_record: ["erythroid", "haemolytic", "haemoglobinopathy", "marrow_failure", "lymphoid_neoplasm", "plasma_cell"],
    hema_bone_marrow_record: ["marrow_failure", "erythroid", "myeloid_neoplasm", "lymphoid_neoplasm", "plasma_cell"],
    hema_treatment_plan: ["myeloid_neoplasm", "lymphoid_neoplasm", "plasma_cell", "marrow_failure", "haemoglobinopathy", "haemolytic", "coagulation", "thrombotic"],
  }[noteKey];
  return domains === null || domains === undefined || domains.includes(domain);
}

// ---- 3. Catalogue integrity ----------------------------------------------
const CATALOG = icd.HEMA_ICD11;
const codes = CATALOG.map((e) => e.code);
check(new Set(codes).size === codes.length, "the catalogue contains a duplicate ICD-11 code");
check(CATALOG.length >= 60, `the catalogue is thinner than expected (${CATALOG.length} entries)`);

const ICD10_LIKE = /^[A-Z]\d{2}(\.\d+)?$/;
for (const entry of CATALOG) {
  check(/^[0-9][A-Z][0-9A-Z]{2}(\.[0-9A-Z]+)*$/.test(entry.code), `malformed code "${entry.code}"`);
  check(!ICD10_LIKE.test(entry.code), `ICD-10-style code present: "${entry.code}"`);
  check(Boolean(entry.display), `${entry.code} has no WHO display term`);
  check(entry.release === icd.HEMA_ICD11_MMS.release, `${entry.code} does not carry the catalogue release`);
  check(Boolean(entry.source), `${entry.code} has no source`);
  check(Boolean(entry.verified_date), `${entry.code} has no verification date`);
  check(["verified", "review_required"].includes(entry.mapping_state), `${entry.code} has an invalid mapping state`);
  check(Boolean(icd.HEMA_ICD11_DOMAINS[entry.domain]), `${entry.code} has an unknown domain "${entry.domain}"`);
  check(Boolean(entry.definition), `${entry.code} has no definition text`);
  if (entry.mapping_state === "review_required") {
    check(Boolean(entry.coding_note), `${entry.code} is review-required but states no reason`);
  }
  check(entry.specificity === (entry.code.includes(".") ? "Subcategory — most specific" : "Block (stem) — select a subcategory when known"), `${entry.code} specificity does not match its level`);
}

// Parent links resolve, so the clinician sees where a subtype sits.
for (const entry of CATALOG) {
  const stem = entry.code.split(".")[0];
  if (stem !== entry.code) {
    const parent = CATALOG.find((i) => i.code === stem);
    if (parent) check(entry.hierarchy.parent.includes(parent.display), `${entry.code} parent link does not resolve`);
  }
}

// ---- 4. Domain filtering --------------------------------------------------
const transfusion = icd.hematologyCatalogFor(["platelet", "coagulation"]);
check(transfusion.length > 0, "domain filter returned nothing");
check(transfusion.every((e) => ["platelet", "coagulation"].includes(e.domain)), "domain filter leaked another domain");
check(icd.hematologyCatalogFor([]).length === CATALOG.length, "an empty domain list should return the whole catalogue");
check(
  icd.hematologyCatalogFor(["myeloid_neoplasm"]).every((e) => e.domain === "myeloid_neoplasm"),
  "myeloid filter leaked another domain",
);

// ---- 5. Deliberately uncatalogued families are declared, not silently lost -
check(icd.HEMA_NOT_IN_CATALOGUE.length >= 8, "the uncatalogued families list is incomplete");
check(
  icd.HEMA_NOT_IN_CATALOGUE.some((s) => /transfusion reaction/i.test(s)),
  "transfusion reactions are not declared as browser-only",
);

// ---- 6. The specialty actually applies the standards ----------------------
check(
  TEMPLATES.includes('from "@/lib/hematologyDocuments"'),
  "specialtyDocuments.js does not import the hematology standards",
);
check(
  TEMPLATES.includes("withHematologyStandards(HEMATOLOGY_DOCS)"),
  "specialtyDocuments.js does not apply the hematology standards",
);
check(
  !/hema_[a-z_]+", label:/.test(TEMPLATES.slice(TEMPLATES.indexOf("export const SPECIALTY_DOCUMENTS"))),
  "a Hematology note was redefined inside the aggregated list",
);

// ---- 8. ASH guideline register --------------------------------------------
const GUIDELINES = ash.HEMA_ASH_GUIDELINES;
check(GUIDELINES.length >= 10, "the ASH register is unexpectedly small");
GUIDELINES.forEach((g) => {
  check(Boolean(g.key && g.title && g.edition && g.population), `ASH guideline ${g.key} is missing identity fields`);
  check(/^https:\/\//.test(g.url), `ASH guideline ${g.key} has no https source`);
  check(Array.isArray(g.scope) && g.scope.length > 0, `ASH guideline ${g.key} declares no scope`);
  check(
    Array.isArray(g.notCovered) && g.notCovered.length > 0,
    `ASH guideline ${g.key} does not state what it does not cover`,
  );
  check(Array.isArray(g.domains) && g.domains.length > 0, `ASH guideline ${g.key} has no ICD domain mapping`);
});
const GAP_KEYS = new Set(ash.HEMA_ASH_GAPS.map((g) => g.key));
ash.HEMA_ASH_GAPS.forEach((g) => {
  check(Boolean(g.question && g.ashStatus), `gap ${g.key} does not state the question and the ASH status`);
  check(
    Boolean(g.complementary && g.complementary.organization && g.complementary.url),
    `gap ${g.key} names no complementary source`,
  );
});
Object.entries(ash.ASH_BY_GROUP).forEach(([group, entry]) => {
  entry.guidelines.forEach((k) => check(Boolean(ash.ashGuideline(k)), `group ${group} references unknown ASH key ${k}`));
  entry.gaps.forEach((k) => check(GAP_KEYS.has(k), `group ${group} references unknown gap ${k}`));
});

// ---- 9. Sections, blocks and the safety review ----------------------------
NOTE_KEYS.forEach((key) => {
  const fields = sections.HEMA_CLINICAL_SECTIONS[key]();
  const safetyFields = fields.filter((f) => f.type === "hema_safety");
  check(safetyFields.length === 1, `note ${key} does not carry exactly one safety review`);
  const keys = fields.map((f) => f.key);
  check(new Set(keys).size === keys.length, `note ${key} declares a duplicate field key`);
  fields
    .filter((f) => f.type === "hema_modules")
    .forEach((f) => {
      const spec = blocks.hemaBlock(f.key);
      check(Boolean(spec), `note ${key} uses ${f.key}, which is not in the block registry`);
      if (spec) check(Array.isArray(spec.fields) && spec.fields.length > 0, `block ${f.key} has no fields`);
    });
});

// Every ASH management block is registered, and every one is actually shown on
// at least one note type — no block is written and then orphaned.
Object.keys(ashMgmt.ASH_BLOCK_GROUP_RULES).forEach((key) =>
  check(Boolean(blocks.hemaBlock(key)), `group rule ${key} has no block`),
);
const USED_BLOCK_KEYS = new Set(
  NOTE_KEYS.flatMap((key) => sections.HEMA_CLINICAL_SECTIONS[key]().filter((f) => f.type === "hema_modules").map((f) => f.key)),
);
Object.keys(ashMgmt.ASH_MANAGEMENT_BLOCKS).forEach((key) =>
  check(USED_BLOCK_KEYS.has(key), `ASH management block ${key} is never shown on a note`),
);
const DOCUMENT_FIELDS = fs.readFileSync(
  path.join(ROOT, "src", "components", "doctor", "encounters", "DocumentFields.jsx"),
  "utf8",
);
check(DOCUMENT_FIELDS.includes('f.type === "hema_safety"'), "the note form has no renderer for the safety review");
const FIELD_VALUE = fs.readFileSync(path.join(ROOT, "src", "lib", "clinicalFieldValue.js"), "utf8");
check(FIELD_VALUE.includes('type === "hema_safety"'), "the safety review is not printed into the saved record");

// ---- 10. Safety prompts — required set, triggers, thresholds, attribution --
const REQUIRED_PROMPTS = [
  "critical_anaemia",
  "severe_thrombocytopenia",
  "active_major_bleeding",
  "suspected_acute_leukaemia",
  "febrile_neutropenia",
  "acute_thromboembolism",
  "severe_haemolysis",
  "sickle_emergency",
  "suspected_dic",
  "acute_transfusion_reaction",
];
REQUIRED_PROMPTS.forEach((k) =>
  check(
    safety.HEMA_SAFETY_CONCERNS.some((c) => c.key === k),
    `required safety concern ${k} is missing`,
  ),
);

const promptsFor = (values, thresholds) => safety.buildHemaSafetyPrompts({ values, thresholds }).map((p) => p.key);
check(promptsFor({}).length === 0, "an empty note raises a safety prompt");
check(
  promptsFor({ hema_cbc: [{ analyte: "hb", value: "68", unit: "g/L", date: "2026-10-30" }] }).includes("critical_anaemia"),
  "haemoglobin 68 g/L does not raise the critical-anaemia prompt",
);
check(
  !promptsFor({ hema_cbc: [{ analyte: "hb", value: "118", unit: "g/L" }] }).includes("critical_anaemia"),
  "a normal haemoglobin raises the critical-anaemia prompt",
);
check(
  !promptsFor({ hema_cbc: [{ analyte: "hb", value: "68" }] }, { critical_hb: "60" }).includes("critical_anaemia"),
  "a lowered local threshold is ignored",
);
check(
  promptsFor({ hema_cbc: [{ analyte: "plt", value: "12" }] }).includes("severe_thrombocytopenia"),
  "platelets 12 x10^9/L do not raise the severe-thrombocytopenia prompt",
);
check(
  promptsFor({ hema_cbc: [{ analyte: "blasts", value: "30" }] }).includes("suspected_acute_leukaemia"),
  "blasts on the differential do not raise the acute-leukaemia prompt",
);
check(
  promptsFor({ hema_presentation: { fever: "Febrile neutropenia" }, hema_cbc: [{ analyte: "neut", value: "0.2" }] }).includes(
    "febrile_neutropenia",
  ),
  "fever with neutropenia does not raise the febrile-neutropenia prompt",
);
check(
  promptsFor({ hema_emergency: { presentation: "Disseminated intravascular coagulation" } }).includes("suspected_dic"),
  "a DIC emergency presentation does not raise the DIC prompt",
);
check(
  promptsFor({ hema_transfusion_assessment: { reaction: "Anaphylaxis" } }).includes("acute_transfusion_reaction"),
  "an anaphylactic reaction does not raise the transfusion-reaction prompt",
);
check(
  !promptsFor({ hema_transfusion_assessment: { reaction: "None observed" } }).includes("acute_transfusion_reaction"),
  "a documented 'no reaction' raises the transfusion-reaction prompt",
);
check(
  promptsFor({ hema_exam: { active_bleeding: "Present", bleeding_site: "Epistaxis" } }).includes("active_major_bleeding"),
  "active bleeding documented on examination does not raise the bleeding prompt",
);

// Attribution guard: ASH is cited only where an ASH guideline covers it.
REQUIRED_PROMPTS.forEach((k) => {
  const p = safety.buildHemaSafetyPrompts({ concerns: [k] })[0];
  check(Boolean(p && p.basis && p.action), `prompt ${k} has no basis or action`);
  if (!p) return;
  check(
    Object.keys(safety.HEMA_SAFETY_PROVENANCE).includes(p.provenance),
    `prompt ${k} has an unknown provenance`,
  );
  if (p.provenance === "ash_guideline") {
    check(/^ASH/.test(p.source?.organization || ""), `prompt ${k} claims ASH but cites ${p.source?.organization}`);
  } else {
    check(!/^ASH/.test(p.source?.organization || ""), `prompt ${k} attributes a non-ASH recommendation to ASH`);
  }
});

safety.HEMA_SAFETY_THRESHOLDS.forEach((t) => {
  check(Number.isFinite(t.value), `threshold ${t.key} has no numeric default`);
  check(
    Object.keys(safety.HEMA_SAFETY_PROVENANCE).includes(t.provenance),
    `threshold ${t.key} has an unknown provenance`,
  );
  if (t.provenance !== "local") check(Boolean(t.source && t.source.url), `threshold ${t.key} names no source`);
});

// ---- Report ---------------------------------------------------------------
fs.rmSync(TMP, { recursive: true, force: true });

if (failures.length) {
  console.error(`FAIL — ${failures.length} issue(s)`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(
  `PASS — ${NOTE_KEYS.length} Hematology notes enhanced, ${CATALOG.length} ICD-11 MMS codes ` +
    `(${icd.HEMA_CATALOG_STATS.verified} verified, ${icd.HEMA_CATALOG_STATS.review_required} review required), ` +
    `${Object.keys(icd.HEMA_ICD11_DOMAINS).length} domains, ${icd.HEMA_NOT_IN_CATALOGUE.length} browser-only families declared.`,
);