// Pediatrics — integrity, coding and safety check.
//
// Run with: node qa/peds-qa.mjs
//
// The libraries under src/lib use the app's "@/lib/…" alias, which plain Node cannot
// resolve. This script mirrors src/lib with the alias rewritten and imports it, so
// every check runs against the REAL definitions the Doctor Portal uses.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TMP = path.join(ROOT, "qa", ".peds-tmp");
const LIB = path.join(ROOT, "src", "lib");

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

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
  const out = path.join(TMP, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const src = fs
    .readFileSync(file, "utf8")
    .replace(/(from\s+|import\s*\()(["'])([^"']+)\2/g, (m, pre, q, spec) => {
      const target = resolveTarget(spec, rel);
      if (!target) return m;
      let r = path.posix.relative(path.posix.dirname(rel), target);
      if (!r.startsWith(".")) r = `./${r}`;
      return `${pre}${q}${r}${q}`;
    });
  fs.writeFileSync(out, src);
}

const icd = await import(path.join(TMP, "pedsIcd11.js"));
const refs = await import(path.join(TMP, "pedsReferences.js"));
const blocks = await import(path.join(TMP, "pedsBlocks.js"));
const sections = await import(path.join(TMP, "pedsClinicalSections.js"));
const safety = await import(path.join(TMP, "pedsSafetyRules.js"));
const docs = await import(path.join(TMP, "pedsDocuments.js"));
const sd = await import(path.join(TMP, "specialtyDocuments.js"));

let failures = 0;
const check = (ok, message) => {
  if (!ok) {
    failures += 1;
    console.error(`FAIL — ${message}`);
  }
};

const source = fs.readFileSync(path.join(LIB, "specialtyDocuments.js"), "utf8");

// ---- 1. The catalog itself ------------------------------------------------
const pedsDocs = sd.SPECIALTY_DOCUMENTS.filter((d) => d.specialty === "pediatrics");
check(pedsDocs.length >= 18, `expected at least 18 pediatric note types, found ${pedsDocs.length}`);
check(docs.PEDS_ENHANCED_KEYS.length >= 18, `expected at least 18 enhanced note types, found ${docs.PEDS_ENHANCED_KEYS.length}`);

for (const key of docs.PEDS_ENHANCED_KEYS) {
  const seen = new Set();
  for (const field of sections.PEDS_ENHANCEMENTS[key]()) {
    check(!seen.has(field.key), `${key}: duplicate appended field key ${field.key}`);
    seen.add(field.key);
  }
  check(source.includes(`key: "${key}"`), `${key}: enhancement exists but the note type is not in specialtyDocuments.js`);
}

// ---- 2. Append-only: originals preserved ----------------------------------
// The retirement rules mirrored here are the app's own (src/lib/noteSectionPolicy.js):
// a template that loses a retired section is not a template that was rebuilt.
const RETIRED =
  /^(past medical|past surgical|medical history$|surgical history$|family history|current medications?\b|medication$|medications$|medication review|medications?\s+(review|changes|plan|reconciliation)$|treatment history|previous treatments?$|treatment$|laborator|^labs?\b|investigation|plan\b|referral)/i;
const EXAM = /examination/i;

for (const key of docs.PEDS_ENHANCED_KEYS) {
  const from = source.indexOf(`key: "${key}"`);
  const arrayEnd = source.indexOf("\n];", from);
  const nextKey = source.indexOf('key: "peds_', from + 10);
  const to = nextKey !== -1 && (arrayEnd === -1 || nextKey < arrayEnd) ? nextKey : arrayEnd;
  const block = source.slice(from, to === -1 ? undefined : to);
  const original = [...block.matchAll(/[TISN]\("([a-z0-9_]+)",\s*"([^"]*)"/g)]
    .map((m) => ({ key: m[1], label: m[2] }))
    .filter((f) => !RETIRED.test(f.label) && !EXAM.test(f.label));
  const enhanced = sd.SPECIALTY_DOCUMENTS.find((d) => d.key === key);
  check(!!enhanced, `${key}: note type missing from the catalogue`);
  if (!enhanced) continue;
  const keys = new Set((enhanced.fields || []).map((f) => f.key));
  for (const field of original) {
    check(keys.has(field.key), `${key}: original field "${field.key}" (${field.label}) was lost`);
  }
}

// ---- 3. Appended sections survive the note-section policy -----------------
for (const doc of pedsDocs) {
  const types = new Set((doc.fields || []).map((f) => f.type));
  check(types.has("icd11_diagnoses"), `${doc.key}: the ICD-11 MMS coding field did not survive`);
  check(types.has("peds_safety"), `${doc.key}: the advisory safety review did not survive`);
  check(types.has("peds_guidance"), `${doc.key}: the guideline-basis record did not survive`);
  const modules = (doc.fields || []).filter((f) => f.type === "peds_modules");
  check(modules.length > 0, `${doc.key}: no structured pediatric block was attached`);
  for (const field of modules) {
    check(!!blocks.PEDS_BLOCKS[field.key], `${doc.key}: block "${field.key}" does not exist`);
  }
  for (const field of (doc.fields || []).filter((f) => f.type === "icd11_diagnoses")) {
    check(Array.isArray(field.catalog) && field.catalog.length > 0, `${doc.key}: the ICD catalogue is empty`);
    check(field.requireConfirmation === true, `${doc.key}: a coded diagnosis is not required to be confirmed`);
    check(field.unspecifiedJustification === true, `${doc.key}: an unspecified code needs no justification`);
    check(field.catalogRelease === icd.PEDS_ICD11_MMS.release, `${doc.key}: catalogue release not recorded`);
  }
}

// ---- 4. Every block is fully specified ------------------------------------
for (const [key, spec] of Object.entries(blocks.PEDS_BLOCKS)) {
  check(spec.key === key, `${key}: block declares a different key (${spec.key})`);
  check(!!spec.title, `${key}: block has no title`);
  check(!!spec.note, `${key}: block has no explanatory note`);
  const seen = new Set();
  for (const field of spec.fields || []) {
    check(!!field.key, `${key}: a field has no key`);
    check(!seen.has(field.key), `${key}: duplicate field key ${field.key}`);
    seen.add(field.key);
    check(!!field.label, `${key}.${field.key}: no label`);
    if (field.type === "select" || field.type === "multi") {
      check(Array.isArray(field.options) && field.options.length > 1, `${key}.${field.key}: no options`);
    }
  }
}

// ---- 5. ICD-11 MMS catalogue honesty --------------------------------------
const ICD10_SHAPE = /^[A-Z]\d{2}(\.[0-9A-Z]{1,4})?$/;
const codes = new Set();
for (const entry of icd.PEDS_ICD11) {
  check(!!entry.code, "an ICD-11 entry has no code");
  check(!codes.has(entry.code), `duplicate ICD-11 code ${entry.code}`);
  codes.add(entry.code);
  check(!ICD10_SHAPE.test(entry.code), `${entry.code}: looks like an ICD-10 code`);
  check(entry.mapping_state !== "verified", `${entry.code}: presented as verified without a browser confirmation`);
  check(entry.release === icd.PEDS_ICD11_MMS.release, `${entry.code}: release not recorded`);
  check(!!entry.display, `${entry.code}: no display term`);
  check(!!entry.category, `${entry.code}: no concept category`);
  check(entry.source && entry.source.includes("who.int"), `${entry.code}: source is not the WHO browser`);
}
check(icd.PEDS_ICD11.length >= 20, `the pediatric catalogue is too small (${icd.PEDS_ICD11.length} entries)`);
for (const item of icd.PEDS_ICD11_UNSEEDED) {
  check(!!item.why, `${item.term}: no instruction on what to do instead`);
  check(!("code" in item), `${item.term}: an unseeded category must not carry a code`);
}

// ---- 6. Reference register ----------------------------------------------
for (const [key, ref] of Object.entries(refs.PEDS_REFERENCES)) {
  check(!!ref.organization, `${key}: no organisation`);
  check(!!ref.title, `${key}: no title`);
  check(!!ref.edition, `${key}: no edition`);
  check(!!ref.population, `${key}: no population`);
  check(!!ref.applies, `${key}: does not state what it is applied to`);
  check(!!ref.type, `${key}: no document type (guideline or local decision)`);
}
for (const [noteKey, entry] of Object.entries(refs.PEDS_NOTE_BASIS)) {
  check(source.includes(`key: "${noteKey}"`), `${noteKey}: basis declared for a note type that does not exist`);
  check(entry.basis.length > 0, `${noteKey}: no basis recorded`);
  for (const b of entry.basis) {
    check(!!refs.PEDS_REFERENCES[b], `${noteKey}: basis "${b}" is not in the register`);
  }
}
for (const conflict of refs.PEDS_GUIDELINE_CONFLICTS) {
  check(conflict.positions.length >= 2, `${conflict.key}: a conflict needs at least two positions`);
  for (const p of conflict.positions) {
    check(!!refs.PEDS_REFERENCES[p.source], `${conflict.key}/${p.organization}: source "${p.source}" not in the register`);
  }
  check(!!conflict.resolution, `${conflict.key}: no documented resolution`);
}

// ---- 7. Safety rules ------------------------------------------------------
const LEVELS = ["critical", "warning", "advisory"];
for (const rule of safety.PEDS_SAFETY_RULES) {
  check(!!rule.key, "a safety rule has no key");
  check(LEVELS.includes(rule.level), `${rule.key}: unknown level ${rule.level}`);
  check(!!rule.title, `${rule.key}: no title`);
  check(!!rule.basis, `${rule.key}: no basis`);
  check(["guideline", "local"].includes(rule.provenance), `${rule.key}: provenance is neither guideline nor local`);
  check(!!refs.PEDS_REFERENCES[rule.source], `${rule.key}: source "${rule.source}" is not in the register`);
  check(rule.fires({}) === false, `${rule.key}: fires on an empty note`);
}

const raisedFor = (values) => safety.buildPedsSafetyPrompts({ values }).map((p) => p.key);
const firesOn = (key, values) => check(raisedFor(values).includes(key), `${key}: did not fire on the documented finding`);
const silentOn = (key, values) => check(!raisedFor(values).includes(key), `${key}: fired without the finding`);

firesOn("triage_danger_sign_no_action", {
  peds_triage: { __p: "peds_triage", tri_danger_signs: ["Convulsions"], tri_action: ["Observation only"] },
});
silentOn("triage_danger_sign_no_action", {
  peds_triage: { __p: "peds_triage", tri_danger_signs: ["Convulsions"], tri_action: ["Admitted"] },
});
firesOn("triage_fast_breathing_not_recorded", {
  peds_triage: { __p: "peds_triage", tri_age_band: "2–11 months", tri_resp_rate: "58", tri_fast_breathing: "Absent" },
});
firesOn("respiratory_hypoxaemia_no_oxygen", {
  peds_respiratory: { __p: "peds_respiratory", res_spo2: "84", res_oxygen: "Room air" },
});
silentOn("respiratory_hypoxaemia_no_oxygen", {
  peds_respiratory: { __p: "peds_respiratory", res_spo2: "84", res_oxygen: "Supplemental oxygen" },
});
firesOn("dehydration_severe_no_plan_c", {
  peds_dehydration: { __p: "peds_dehydration", deh_classification: "Severe dehydration", deh_plan: "Plan A — home care" },
});
firesOn("malnutrition_sam_no_treatment", {
  peds_malnutrition: { __p: "peds_malnutrition", mal_muac_mm: "108", mal_treatment: [] },
});
firesOn("newborn_vitamin_k_not_recorded", { peds_newborn: { __p: "peds_newborn", nb_temp_c: "36.8" } });
silentOn("newborn_vitamin_k_not_recorded", {
  peds_newborn: {
    __p: "peds_newborn",
    nb_temp_c: "36.8",
    nb_feeding_started: "Breastfeeding within 1 hour",
    nb_vitamin_k: "Given",
  },
});
firesOn("jaundice_without_bilirubin", {
  peds_newborn: { __p: "peds_newborn", nb_jaundice: "Present — onset 24 hours or later" },
});
firesOn("safeguarding_concern_no_action", {
  peds_safeguarding: { __p: "peds_safeguarding", sg_concern: "Suspicion of abuse or neglect", sg_actions: [], sg_route: "" },
});
firesOn("adolescent_risk_without_plan", {
  peds_adolescent: {
    __p: "peds_adolescent",
    ado_confidentiality: "Explained, including its limits",
    ado_seen_alone: "Yes — confidential time documented",
    ado_mood_screen: "Screen positive — further assessment",
    ado_suicide_risk: "Not assessed",
  },
});
firesOn("confirmed_diagnosis_without_code", {
  peds_icd11_diagnoses: [{ status: "Confirmed", code: "", display: "Asthma" }],
});
silentOn("confirmed_diagnosis_without_code", {
  peds_icd11_diagnoses: [{ status: "Confirmed", code: "CA23", display: "Asthma" }],
});

// ---- 8. Formatters --------------------------------------------------------
const emptyBlock = blocks.formatPedsBlock({ __p: "peds_triage" });
check(/not documented/i.test(emptyBlock), "an empty block must be reported as not documented");
const filledBlock = blocks.formatPedsBlock({ __p: "peds_triage", tri_resp_rate: "58" });
check(filledBlock.includes("58"), "a filled block must carry its value");
check(/left not documented/i.test(filledBlock), "unrecorded fields in a used block must be counted");
check(/no prompt was raised/i.test(safety.formatPedsSafety({ resolved: [] })), "an empty safety review must say so");
const withAction = safety.formatPedsSafety({
  resolved: [{ key: "k", level: "critical", levelLabel: "Safety-critical", title: "T", basis: "B", sourceLabel: "S" }],
  actions: { k: "Referred to hospital" },
});
check(/Action documented: Referred to hospital/.test(withAction), "a recorded action must reach the printed note");

// ---- 9. Wiring ------------------------------------------------------------
const fieldsSource = fs.readFileSync(
  path.join(ROOT, "src", "components", "doctor", "encounters", "DocumentFields.jsx"),
  "utf8",
);
for (const type of ["peds_modules", "peds_safety", "peds_guidance"]) {
  check(fieldsSource.includes(`"${type}"`), `the note form does not render ${type}`);
}
const valueSource = fs.readFileSync(path.join(LIB, "clinicalFieldValue.js"), "utf8");
check(valueSource.includes("formatPedsBlock"), "the printed record does not format pediatric blocks");
check(valueSource.includes("formatPedsSafety"), "the printed record does not format the safety review");
check(source.includes("withPediatricsStandards"), "the pediatric catalog is not attached to the note types");

console.log(
  failures === 0
    ? `OK — ${pedsDocs.length} pediatric note types enhanced, ${Object.keys(blocks.PEDS_BLOCKS).length} blocks, ${icd.PEDS_ICD11.length} ICD-11 entries, ${safety.PEDS_SAFETY_RULES.length} safety rules, ${Object.keys(refs.PEDS_REFERENCES).length} references`
    : `${failures} check(s) failed`,
);
process.exit(failures === 0 ? 0 : 1);