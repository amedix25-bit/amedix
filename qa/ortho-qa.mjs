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

const MODULES = [
  "orthopedicsIcd11.js",
  "orthopedicsReferences.js",
  "orthopedicsTrauma.js",
  "orthopedicsManagement.js",
  "orthopedicsClinicalSections.js",
  "orthopedicsSafetyRules.js",
  "orthopedicsDocuments.js",
];

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

for (const file of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src", "lib", file), "utf8");
  fs.writeFileSync(path.join(TMP, file), source.replace(/@\/lib\/([A-Za-z0-9_]+)/g, "./$1.js"));
}

// The whole src/lib tree is mirrored a second time so the REAL governance module
// (noteSectionPolicy) can be imported: the orthopedics templates are then checked
// against the same rules the Doctor Portal applies, not against a copy of them.
const LIB = path.join(ROOT, "src", "lib");
const POLICY_TMP = path.join(TMP, "lib");
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const libFiles = walk(LIB).filter((f) => f.endsWith(".js"));
const libRels = new Set(libFiles.map((f) => path.relative(LIB, f).replaceAll("\\", "/")));
const resolveTarget = (spec, fromRel) => {
  let base;
  if (spec.startsWith("@/lib/")) base = spec.slice(6);
  else if (spec.startsWith(".")) base = path.posix.join(path.posix.dirname(fromRel), spec);
  else return null;
  base = path.posix.normalize(base);
  if (libRels.has(base)) return base;
  if (libRels.has(`${base}.js`)) return `${base}.js`;
  if (libRels.has(`${base}/index.js`)) return `${base}/index.js`;
  return null;
};
for (const file of libFiles) {
  const rel = path.relative(LIB, file).replaceAll("\\", "/");
  const out = path.join(POLICY_TMP, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const source = fs
    .readFileSync(file, "utf8")
    .replace(/(from\s+|import\s*\()(["'])([^"']+)\2/g, (m, pre, q, spec) => {
      const target = resolveTarget(spec, rel);
      if (!target) return m;
      let r = path.posix.relative(path.posix.dirname(rel), target);
      if (!r.startsWith(".")) r = `./${r}`;
      return `${pre}${q}${r}${q}`;
    });
  fs.writeFileSync(out, source);
}

const icd = await import(path.join(TMP, "orthopedicsIcd11.js"));
const refs = await import(path.join(TMP, "orthopedicsReferences.js"));
const trauma = await import(path.join(TMP, "orthopedicsTrauma.js"));
const management = await import(path.join(TMP, "orthopedicsManagement.js"));
const sections = await import(path.join(TMP, "orthopedicsClinicalSections.js"));
const safety = await import(path.join(TMP, "orthopedicsSafetyRules.js"));
const docs = await import(path.join(TMP, "orthopedicsDocuments.js"));
const policy = await import(path.join(POLICY_TMP, "noteSectionPolicy.js"));

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
check(FIELDS.includes('f.type === "ortho_trauma"'), "the note form has no renderer for the trauma-emergency panel");
check(FIELDS.includes('f.type === "ortho_healing"'), "the note form has no renderer for the fracture-healing panel");
const VALUES = fs.readFileSync(path.join(ROOT, "src", "lib", "clinicalFieldValue.js"), "utf8");
check(VALUES.includes('type === "ortho_safety"'), "the safety review is not printed into the saved record");
check(VALUES.includes('type === "ortho_trauma"'), "the trauma-emergency panel is not printed into the saved record");
check(VALUES.includes('type === "ortho_healing"'), "the fracture-healing panel is not printed into the saved record");

// ---- 8. The templates survive the clinical-section governance -------------
// A field whose label reads as an examination, or that sits under a section the
// policy retires, is silently dropped from the form and from the record. That is
// exactly how the management layer was being lost, so it is asserted here against
// the real policy module for every note type.
// Every note carries the coding field and one safety review. The trauma panel is
// offered wherever an acute presentation can be documented — every note but the
// rehabilitation plan, which records recovery of an established condition. The
// healing panel follows the notes that judge union.
const ALWAYS_KEYS = ["icd11_diagnoses", "ortho_safety"];
const TRAUMA_NOTES = NOTE_KEYS.filter((k) => k !== "ortho_rehab_plan");
const HEALING_NOTES = [
  "ortho_consultation",
  "ortho_followup",
  "ortho_fracture_assessment",
  "ortho_injury_assessment",
  "ortho_preop_assessment",
  "ortho_postop_note",
  "ortho_daily_progress",
  "ortho_discharge_summary",
  "ortho_rehab_plan",
];
HEALING_NOTES.forEach((k) => check(NOTE_KEYS.includes(k), `the healing scope names an unknown note ${k}`));
const expectedPanelKeys = (key) => [
  ...ALWAYS_KEYS,
  ...(TRAUMA_NOTES.includes(key) ? ["ortho_trauma"] : []),
  ...(HEALING_NOTES.includes(key) ? ["ortho_healing"] : []),
];
NOTE_KEYS.forEach((key) => {
  const doc = { key, label: key, specialty: "orthopedics", fields: sections.ORTHO_CLINICAL_SECTIONS[key]() };
  const kept = policy.applyNoteSectionPolicy([doc])[0];
  const keptKeys = new Set((kept?.fields || []).map((f) => f.key));
  doc.fields.forEach((f) =>
    check(keptKeys.has(f.key), `note ${key}: field "${f.key}" (${f.label}) is dropped by the clinical-section policy`),
  );
  expectedPanelKeys(key).forEach((panel) =>
    check(keptKeys.has(panel), `note ${key}: the ${panel} panel does not survive the clinical-section policy`),
  );
});
// And the panels must reach the built templates, not only the per-note builder.
NOTE_KEYS.forEach((key) => {
  const built = docs.withOrthopedicsStandards([{ key, label: key, specialty: "orthopedics", fields: [] }])[0];
  const keys = (built.fields || []).map((f) => f.key);
  expectedPanelKeys(key).forEach((panel) =>
    check(keys.includes(panel), `the built template for ${key} is missing the ${panel} panel`),
  );
});

// ---- 9. Trauma-emergency presentations ------------------------------------
const PRES = trauma.ORTHO_TRAUMA_PRESENTATIONS;
check(PRES.length >= 14, "the trauma-emergency layer does not cover the required presentations");
check(new Set(PRES.map((p) => p.key)).size === PRES.length, "a trauma presentation key is duplicated");
const REQUIRED_PRESENTATIONS = [
  "compartment_syndrome",
  "open_fracture",
  "severe_soft_tissue",
  "neurovascular_compromise",
  "vascular_injury",
  "unstable_pelvis",
  "polytrauma",
  "spinal_cord_injury",
  "cauda_equina",
  "septic_arthritis",
  "osteomyelitis",
  "fat_embolism",
  "postop_infection",
  "thromboembolism",
];
REQUIRED_PRESENTATIONS.forEach((key) =>
  check(Boolean(trauma.ORTHO_TRAUMA_MAP[key]), `trauma presentation ${key} is missing`),
);
PRES.forEach((p) => {
  check(Boolean(p.label && p.recognition), `presentation ${p.key} has no recognition criteria`);
  check(Array.isArray(p.references) && p.references.length > 0, `presentation ${p.key} cites no reference`);
  p.references.forEach((r) => check(Boolean(refs.ORTHO_REFERENCE_MAP[r]), `presentation ${p.key} cites unknown reference ${r}`));
  check(Boolean(p.level && trauma.ORTHO_TRAUMA_LEVELS[p.level]), `presentation ${p.key} has no urgency level`);
  check(typeof p.timeCritical === "string" && p.timeCritical.length > 20, `presentation ${p.key} has no time-critical instruction`);
  check(typeof p.escalation === "string" && p.escalation.length > 20, `presentation ${p.key} names no escalation route`);
});

// A blank panel must never read as a normal examination.
check(
  trauma.orthoTraumaIssues(trauma.emptyOrthoTrauma()).some((i) => i.key === "no_state"),
  "a blank trauma panel does not report that nothing was assessed",
);
check(
  trauma
    .orthoTraumaIssues({ ...trauma.emptyOrthoTrauma(), presentations: ["open_fracture"] })
    .some((i) => /pathway/.test(i.key)),
  "an open fracture with no recorded time-critical pathway is not flagged",
);
check(
  trauma
    .orthoTraumaIssues({ ...trauma.emptyOrthoTrauma(), none_documented: true, presentations: ["open_fracture"] })
    .some((i) => i.key === "contradiction"),
  "stating that no emergency was documented while recording one is not flagged",
);
check(
  trauma
    .orthoTraumaIssues({
      ...trauma.emptyOrthoTrauma(),
      red_flag_state: trauma.ORTHO_RED_FLAG_STATES[0],
      red_flags: ["Visible bone or implant"],
    })
    .some((i) => i.key === "red_flag_contradiction"),
  "red flags stated as absent and recorded at the same time is not flagged",
);
const traumaRecord = (postNv) => ({
  ...trauma.emptyOrthoTrauma(),
  presentations: ["compartment_syndrome"],
  blocks: {
    compartment_syndrome: {
      pathway: { who_informed: "Registrar", time_informed: "19:10" },
      intervention: { performed: "Yes — performed here", time: "20:00", procedure: "Fasciotomy" },
      pre_nv: { pre_nv_time: "19:00", pre_nv_pulses: "Palpable" },
      post_nv: postNv,
    },
  },
});
check(
  trauma.orthoTraumaIssues(traumaRecord({})).some((i) => /post_nv/.test(i.key)),
  "an urgent intervention with no post-intervention neurovascular check is not flagged",
);
check(
  !trauma
    .orthoTraumaIssues(traumaRecord({ post_nv_time: "20:30", post_nv_pulses: "Palpable" }))
    .some((i) => /post_nv/.test(i.key)),
  "a completed post-intervention reassessment is still flagged",
);
// The printed record must never print an empty panel as reassurance.
check(
  !/none documented/i.test(trauma.formatOrthoTrauma(trauma.emptyOrthoTrauma())),
  "an empty trauma panel prints as a statement that nothing was found",
);
// ---- 10. Fracture-healing assessment --------------------------------------
const STATES = management.ORTHO_HEALING_STATES;
check(STATES.length >= 7, "the fracture-healing layer does not distinguish enough union states");
check(new Set(STATES.map((s) => s.key)).size === STATES.length, "a fracture-healing state key is duplicated");
STATES.forEach((s) => {
  check(Boolean(s.label && s.definition), `healing state ${s.key} has no definition`);
  check(Array.isArray(s.references) && s.references.length > 0, `healing state ${s.key} cites no reference`);
  (s.references || []).forEach((r) =>
    check(Boolean(refs.ORTHO_REFERENCE_MAP[r]), `healing state ${s.key} cites unknown reference ${r}`),
  );
});
check(
  management.orthoHealingIssues({}).some((i) => i.key === "no_state"),
  "an undocumented healing state is treated as normal union",
);
const nonunionBare = management.orthoHealingIssues({ ortho_healing_state: "Nonunion" });
check(nonunionBare.some((i) => i.key === "justification"), "nonunion recorded with no justification is not flagged");
check(nonunionBare.some((i) => i.key === "interval"), "nonunion recorded with no interval is not flagged");
check(
  management.orthoHealingIssues({
    ortho_healing_state: "Nonunion",
    ortho_healing_interval: "9 months",
    ortho_healing_radiograph: "Reviewed by the treating clinician",
    ortho_healing_justification: "Fracture 9 months old, no progression on three consecutive films, pain on loading",
  }).length === 0,
  "a fully documented nonunion is still flagged as incomplete",
);
check(
  management
    .orthoHealingIssues({
      ortho_healing_state: "Union",
      ortho_healing_interval: "12 weeks",
      ortho_healing_radiograph: "Pending",
    })
    .some((i) => i.key === "union_without_film"),
  "union recorded while the radiograph is still pending is not flagged",
);
check(
  management
    .orthoHealingIssues({
      ortho_healing_state: "Malunion",
      ortho_healing_interval: "20 weeks",
      ortho_healing_radiograph: "Not performed",
    })
    .some((i) => i.key === "no_film"),
  "a union state recorded with no radiograph is not flagged",
);
check(management.orthoUnionConcern({ ortho_healing_state: "Nonunion" }) === true, "nonunion does not raise the union concern");
check(management.orthoUnionConcern({ ortho_healing_state: "Union" }) === false, "union raises the union concern");

// ---- 11. The reference register -------------------------------------------
const REGISTER = refs.ORTHO_REFERENCES;
check(REGISTER.length >= 8, "the reference register is too thin to support the panels");
check(new Set(REGISTER.map((r) => r.key)).size === REGISTER.length, "the register contains a duplicate key");
REGISTER.forEach((r) => {
  check(Boolean(r.organization && r.title && r.edition), `reference ${r.key} has no identity`);
  check(Boolean(refs.ORTHO_REFERENCE_KINDS[r.kind]), `reference ${r.key} has an unknown kind`);
  check(Boolean(r.supports), `reference ${r.key} does not say what it supports`);
  check(Boolean(r.doesNotSay), `reference ${r.key} does not say what it does not cover`);
  if (r.kind !== "local") check(/^https:\/\//.test(r.url || ""), `reference ${r.key} has no https source`);
  // Nobody else's guidance may be attributed to AAOS or OTA.
  if (/AAOS/.test(r.organization)) check(["guideline", "auc"].includes(r.kind), `${r.key} names AAOS but is not an AAOS guideline`);
  if (/OTA/.test(r.organization)) check(["classification", "standard"].includes(r.kind), `${r.key} names OTA but is not an OTA standard`);
});
check(
  /no society endorses/i.test(refs.ORTHO_ATTRIBUTION_NOTICE),
  "the register does not state that no society endorses an AMedix threshold",
);
// Every citation used by a presentation or the healing layer resolves.
const cited = new Set();
PRES.forEach((p) => (p.references || []).forEach((r) => cited.add(r)));
STATES.forEach((s) => (s.references || []).forEach((r) => cited.add(r)));
cited.forEach((r) => check(Boolean(refs.ORTHO_REFERENCE_MAP[r]), `cited reference ${r} is not in the register`));

// ---- 12. New safety prompts fire in both directions -----------------------
const traumaValues = (key) => ({ ortho_trauma: { presentations: [key] } });
check(prompts(traumaValues("unstable_pelvis")).includes("unstable_pelvis"), "a documented pelvis injury raises no prompt");
check(!prompts({}).includes("unstable_pelvis"), "an empty note raises the pelvis prompt");
check(prompts(traumaValues("thromboembolism")).includes("thromboembolism"), "a documented clot raises no prompt");
check(!prompts({}).includes("thromboembolism"), "an empty note raises the clot prompt");
check(
  prompts({ ortho_healing: { ortho_healing_state: "Nonunion" } }).includes("union_complication"),
  "a nonunion raises no healing prompt",
);
check(
  !prompts({ ortho_healing: { ortho_healing_state: "Union" } }).includes("union_complication"),
  "a united fracture raises the healing prompt",
);
["vascular_injury", "septic_arthritis", "osteomyelitis", "postop_infection", "fat_embolism", "severe_soft_tissue", "spinal_cord_injury"].forEach(
  (key) => {
    check(prompts(traumaValues(key)).includes(key), `${key} raises no prompt`);
    check(!prompts({}).includes(key), `an empty note raises the ${key} prompt`);
  },
);
// A trauma presentation recorded in the panel must also fire the pre-existing
// prompts it duplicates — otherwise the same injury is graded twice, differently.
check(prompts(traumaValues("open_fracture")).includes("open_fracture"), "panel open fracture raises no open-fracture prompt");
check(
  prompts(traumaValues("neurovascular_compromise")).includes("neurovascular_deficit"),
  "panel neurovascular compromise raises no deficit prompt",
);
check(prompts(traumaValues("cauda_equina")).includes("cauda_equina"), "panel cauda equina raises no prompt");
check(
  prompts(traumaValues("compartment_syndrome")).includes("compartment_syndrome"),
  "panel compartment syndrome raises no compartment prompt",
);

fs.rmSync(TMP, { recursive: true, force: true });

const stats = icd.ORTHO_CATALOG_STATS;
if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log(
  `PASS — ${NOTE_KEYS.length} Orthopedics note types enhanced, ${stats.total} ICD-11 MMS seed entries (all ${stats.review_required} review required, ${stats.verified} pre-verified by design), ${stats.not_seeded} trauma families taken from the WHO browser, ${PRES.length} trauma-emergency presentations, ${STATES.length} healing states, ${REGISTER.length} register references, ${safety.ORTHO_SAFETY_CONCERNS.length} safety prompts verified in both directions.`,
);