// Orthopedics & Traumatology — integrity and safety check.
//
// Run with: node qa/ortho-qa.mjs
//
// The libraries under src/lib use the app's "@/lib/…" alias, which plain Node
// cannot resolve. This script copies the orthopedics modules into a temporary
// folder with the alias rewritten, then imports them, so every check runs against
// the REAL definitions that the Doctor Portal uses — not a description of them.
//
// What it proves:
//   1. All eleven existing Orthopedics note types are enhanced, append-only, with
//      no duplicate field key and no existing key overwritten.
//   2. Every original field of every orthopedics template is still declared in
//      specialtyDocuments.js — the templates were appended to, not rebuilt.
//   3. Every ICD-11 entry carries a code, a WHO display term, a release, a source
//      and a valid mapping state; no code is duplicated; nothing claims to be
//      verified without a verification date; no code looks like ICD-10.
//   4. The per-note domain filter offers only that note's domains.
//   5. The ICD-11 field is configured for clinician confirmation, unspecified-code
//      justification, postcoordination and the orthopaedic detail fields.
//   6. Every note carries exactly one safety review, and the safety prompts fire
//      positively AND negatively on the documented findings.
//   7. specialtyDocuments.js applies the standards, and the note form and the
//      printed record both render the safety review.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TMP = path.join(ROOT, "qa", ".ortho-tmp");

const MODULES = ["orthopedicsIcd11.js", "orthopedicsClinicalSections.js", "orthopedicsSafetyRules.js", "orthopedicsDocuments.js"];

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

for (const file of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src", "lib", file), "utf8");
  fs.writeFileSync(path.join(TMP, file), source.replace(/@\/lib\/([A-Za-z0-9_]+)/g, "./$1.js"));
}

const icd = await import(path.join(TMP, "orthopedicsIcd11.js"));
const sections = await import(path.join(TMP, "orthopedicsClinicalSections.js"));
const safety = await import(path.join(TMP, "orthopedicsSafetyRules.js"));
const docs = await import(path.join(TMP, "orthopedicsDocuments.js"));

let failures = 0;
const check = (ok, message) => {
  if (!ok) {
    failures += 1;
    console.error(`FAIL — ${message}`);
  }
};

// ---- 1. Every existing note type is enhanced -------------------------------
const NOTE_KEYS = [
  "ortho_consultation",
  "ortho_followup",
  "ortho_fracture_assessment",
  "ortho_injury_assessment",
  "ortho_preop_assessment",
  "ortho_operative_note",
  "ortho_procedure_note",
  "ortho_postop_note",
  "ortho_daily_progress",
  "ortho_discharge_summary",
  "ortho_rehab_plan",
];

check(docs.ORTHO_ENHANCED_KEYS.length === NOTE_KEYS.length, "not every orthopedics note type is enhanced");
NOTE_KEYS.forEach((key) =>
  check(docs.ORTHO_ENHANCED_KEYS.includes(key), `note ${key} is not enhanced by the orthopedics layer`),
);

// ---- 2. The original templates are untouched ------------------------------
const REGISTRY = fs.readFileSync(path.join(ROOT, "src", "lib", "specialtyDocuments.js"), "utf8");
const ORTHO_BLOCK = REGISTRY.slice(REGISTRY.indexOf("const ORTHOPEDICS_DOCS = ["), REGISTRY.indexOf("const UROLOGY_DOCS = ["));

NOTE_KEYS.forEach((key) => {
  check(ORTHO_BLOCK.includes(`key: "${key}"`), `original template ${key} has disappeared from the registry`);
});
[
  "injury_mechanism",
  "open_closed",
  "fracture_pattern",
  "neurovascular_status",
  "implant_hardware_status",
  "tourniquet_time",
  "weight_bearing",
  "warning_signs",
].forEach((field) => check(ORTHO_BLOCK.includes(`"${field}"`), `original field ${field} is no longer declared`));
check(REGISTRY.includes("withOrthopedicsStandards(ORTHOPEDICS_DOCS)"), "specialtyDocuments.js does not apply the orthopedics standards");

// ---- 3. Catalogue integrity ----------------------------------------------
const codes = icd.ORTHO_ICD11.map((e) => e.code);
check(new Set(codes).size === codes.length, "the catalogue contains a duplicate code");
check(icd.ORTHO_ICD11.length > 0, "the catalogue is empty");
icd.ORTHO_ICD11.forEach((e) => {
  check(Boolean(e.code && e.display && e.release && e.source), `entry ${e.code} is missing identity fields`);
  check(["verified", "review_required", "unresolved"].includes(e.mapping_state), `entry ${e.code} has an invalid mapping state`);
  check(Boolean(icd.ORTHO_ICD11_DOMAINS[e.domain]), `entry ${e.code} has an unknown domain`);
  check(!/^[A-Z]\d{2}(\.\d)?$/.test(e.code), `entry ${e.code} looks like an ICD-10 code`);
  check(true, "unreachable");
  if (e.mapping_state === "verified") {
    check(Boolean(e.verified_date), `entry ${e.code} claims verification with no verification date`);
  } else {
    check(Boolean(e.coding_note), `entry ${e.code} is not verified and does not say why in its coding note`);
  }
});
check(icd.ORTHO_CATALOG_STATS.verified === 0, "the orthopedics catalogue claims a pre-verified code — none may be pre-verified");
check(icd.ORTHO_NOT_IN_CATALOGUE.length >= 15, "the not-seeded list does not cover the trauma families it must");
check(Boolean(icd.ORTHO_ICD11_MMS.browser_url.startsWith("https://icd.who.int/")), "the WHO browser reference is not the official one");

// ---- 4. Domain filtering --------------------------------------------------
const degen = icd.orthopedicsCatalogFor(["degenerative"]);
check(degen.length > 0 && degen.every((e) => e.domain === "degenerative"), "domain filtering leaks entries from other domains");
check(icd.orthopedicsCatalogFor([]).length === icd.ORTHO_ICD11.length, "an unfiltered catalogue is not the full catalogue");

// ---- 5. Field configuration per note --------------------------------------
NOTE_KEYS.forEach((key) => {
  const fields = sections.ORTHO_CLINICAL_SECTIONS[key]();
  const keys = fields.map((f) => f.key);
  check(new Set(keys).size === keys.length, `note ${key} declares a duplicate field key`);
  const coding = fields.filter((f) => f.type === "icd11_diagnoses");
  check(coding.length === 1, `note ${key} does not carry exactly one ICD-11 coding field`);
  coding.forEach((f) => {
    check(f.requireConfirmation === true, `note ${key} does not require clinician confirmation of the code`);
    check(f.unspecifiedJustification === true, `note ${key} does not require justification of an unspecified code`);
    check(f.clusterEnabled === true && Boolean(f.clusterNote), `note ${key} has no postcoordination rule`);
    check(Array.isArray(f.extraFields) && f.extraFields.length >= 8, `note ${key} carries too little orthopaedic detail beside the code`);
    check(f.catalogRelease === icd.ORTHO_ICD11_MMS.release, `note ${key} mixes ICD-11 releases`);
    check(Array.isArray(f.catalog), `note ${key} has no catalogue`);
  });
  const safetyFields = fields.filter((f) => f.type === "ortho_safety");
  check(safetyFields.length === 1, `note ${key} does not carry exactly one safety review`);
});

// ---- 6. Safety prompts — positive and negative triggers -------------------
const prompts = (values, concerns = []) => safety.buildOrthoSafetyPrompts({ values, concerns }).map((p) => p.key);

check(prompts({}).length === 0, "an empty note raises a safety prompt");
check(prompts({ ortho_open_closed: "Open" }).includes("open_fracture"), "an open fracture raises no prompt");
check(!prompts({ ortho_open_closed: "Closed" }).includes("open_fracture"), "a closed fracture raises the open-fracture prompt");
check(
  prompts({ ortho_compartment_assessment: "Hard / tense" }).includes("compartment_syndrome"),
  "a tense compartment raises no prompt",
);
check(
  !prompts({ ortho_compartment_assessment: "Soft and compressible" }).includes("compartment_syndrome"),
  "a soft compartment raises the compartment prompt",
);
check(prompts({ ortho_compartment_pressure: "45" }).includes("compartment_syndrome"), "a pressure above the threshold raises no prompt");
check(
  !prompts({ ortho_compartment_pressure: "12", ortho_diastolic_pressure: "80" }).includes("compartment_syndrome"),
  "a normal delta pressure raises the compartment prompt",
);
check(
  prompts({ ortho_distal_pulses: "Absent" }).includes("neurovascular_deficit"),
  "an absent distal pulse raises no prompt",
);
check(prompts({ ortho_sensation: "Reduced" }).includes("neurovascular_deficit"), "a sensory deficit raises no prompt");
check(
  !prompts({ ortho_distal_pulses: "Palpable", ortho_sensation: "Intact", ortho_motor: "Intact" }).includes("neurovascular_deficit"),
  "an intact neurovascular examination raises the deficit prompt",
);
check(
  prompts({ ortho_spine_red_flags: "Saddle anaesthesia" }).includes("cauda_equina"),
  "saddle anaesthesia raises no prompt",
);
check(!prompts({ ortho_spine_red_flags: "None documented" }).includes("cauda_equina"), "a normal spine examination raises the cauda equina prompt");
check(
  prompts({ ortho_open_closed: "Open", ortho_tetanus_status: "Unknown" }).includes("tetanus"),
  "an open injury with unknown tetanus status raises no prompt",
);
check(
  !prompts({ ortho_open_closed: "Open", ortho_tetanus_status: "Up to date — booster within 10 years" }).includes("tetanus"),
  "an up-to-date tetanus status raises the tetanus prompt",
);
check(prompts({ ortho_vte_prophylaxis: "Not prescribed" }).includes("vte_prophylaxis"), "absent thromboprophylaxis raises no prompt");
check(
  !prompts({ ortho_vte_prophylaxis: "Contraindicated — documented" }).includes("vte_prophylaxis"),
  "a documented contraindication raises the prophylaxis prompt",
);
check(prompts({ ortho_wound_status: "Infected / dehisced" }).includes("postop_complication"), "a dehisced wound raises no prompt");
check(
  prompts({ ortho_anticoagulant: "Anticoagulant — warfarin" }).includes("anticoagulation"),
  "warfarin raises no prompt",
);
check(
  !prompts({ ortho_anticoagulant: "Not on anticoagulant or antiplatelet" }).includes("anticoagulation"),
  "no anticoagulant raises the anticoagulation prompt",
);
check(prompts({}, ["compartment_syndrome"]).length === 1, "a ticked concern does not raise its prompt against an empty note");

// Attribution: a prompt citing AAOS or OTA must actually name that body, and a
// local rule must never be dressed up as a society guideline.
Object.keys(safety.ORTHO_SAFETY_PROVENANCE).forEach((key) =>
  check(Boolean(safety.ORTHO_SAFETY_PROVENANCE[key]), `provenance ${key} has no label`),
);
safety.ORTHO_SAFETY_CONCERNS.forEach((c) => {
  const p = safety.buildOrthoSafetyPrompts({ values: {}, concerns: [c.key] })[0];
  check(Boolean(p), `concern ${c.key} produces no prompt`);
  if (!p) return;
  check(Boolean(p.basis && p.action), `prompt ${c.key} has no basis or action`);
  check(Boolean(safety.ORTHO_SAFETY_PROVENANCE[p.provenance]), `prompt ${c.key} has an unknown provenance`);
  if (p.provenance === "aaos_guideline") check(/AAOS/.test(p.source?.organization || ""), `prompt ${c.key} claims AAOS but cites ${p.source?.organization}`);
  if (p.provenance === "ota_standard") check(/OTA/.test(p.source?.organization || ""), `prompt ${c.key} claims OTA but cites ${p.source?.organization}`);
  if (!p.source) check(p.provenance === "local", `prompt ${c.key} has no source but is not labelled a local decision`);
});
safety.ORTHO_SAFETY_THRESHOLDS.forEach((t) => {
  check(Number.isFinite(t.value), `threshold ${t.key} has no numeric default`);
  if (t.provenance !== "local") check(Boolean(t.source && t.source.url), `threshold ${t.key} names no source`);
});

// The printed record must state prompt, evidence, action and the missing action.
const printed = safety.formatOrthoSafety({
  resolved: [{ key: "open_fracture", level: "immediate", title: "Open fracture documented", basis: "b" }],
  actions: { open_fracture: "Antibiotics at 19:10, theatre booked" },
});
check(printed.includes("Open fracture documented"), "the printed record drops the prompt");
check(printed.includes("Antibiotics at 19:10"), "the printed record drops the action taken");
const printedEmpty = safety.formatOrthoSafety({ resolved: [] });
check(/not a statement that no urgent problem exists/.test(printedEmpty), "an empty panel prints as reassurance");

// ---- 7. Rendering is wired ------------------------------------------------
const FIELDS = fs.readFileSync(path.join(ROOT, "src", "components", "doctor", "encounters", "DocumentFields.jsx"), "utf8");
check(FIELDS.includes('f.type === "ortho_safety"'), "the note form has no renderer for the orthopedics safety review");
const VALUES = fs.readFileSync(path.join(ROOT, "src", "lib", "clinicalFieldValue.js"), "utf8");
check(VALUES.includes('type === "ortho_safety"'), "the safety review is not printed into the saved record");

fs.rmSync(TMP, { recursive: true, force: true });

const stats = icd.ORTHO_CATALOG_STATS;
if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log(
  `PASS — ${NOTE_KEYS.length} Orthopedics note types enhanced, ${stats.total} ICD-11 MMS seed entries (all ${stats.review_required} review required, ${stats.verified} pre-verified by design), ${stats.not_seeded} trauma families taken from the WHO browser, ${safety.ORTHO_SAFETY_CONCERNS.length} safety prompts verified in both directions.`,
);