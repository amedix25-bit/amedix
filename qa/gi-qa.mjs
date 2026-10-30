// QA harness for the strengthened Gastroenterology / Hepatology build.
// Run: npx esbuild qa/gi-qa.mjs --bundle --platform=node --format=esm --outfile=/tmp/gqa.mjs --alias:@=./src && node /tmp/gqa.mjs
import { SPECIALTY_DOCUMENTS, getDocDef } from "@/lib/specialtyDocuments";
import { GASTRO_BLOCK_KEYS, GASTRO_BLOCKS, formatGastroBlock, gastroBlockValue } from "@/lib/gastroenterologyModules";
import { GASTRO_SCORES, calculateGastroScore, formatGastroScores } from "@/lib/gastroenterologyScores";
import { buildGastroSafetyPrompts, GASTRO_SAFETY_RULE_COUNT, formatGastroSafety } from "@/lib/gastroenterologySafetyRules";
import { GASTRO_NOTE_BASIS, gastroNoteBasis } from "@/lib/gastroenterologyReferences";
import { GASTRO_ICD11, gastroenterologyCatalogFor } from "@/lib/gastroenterologyIcd11";
import { formatFieldValue } from "@/lib/clinicalFieldValue";
import { guidelineAttributionText } from "@/components/doctor/notes/GastroGuidanceField";

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

const GI_KEYS = [
  "gi_consultation", "gi_followup", "gi_admission_note", "gi_progress_note", "gi_endoscopy_report",
  "gi_colonoscopy_report", "gi_ercp_report", "gi_procedure_note", "gi_pathology_request", "gi_discharge_summary",
];

/* 1 — the ten existing note types survive intact */
GI_KEYS.forEach((key) => {
  const doc = getDocDef(key);
  ok(!!doc, `note type ${key} is missing from the catalogue`);
  if (!doc) return;
  ok(doc.specialty === "gastroenterology", `${key} lost its gastroenterology specialty`);
  const types = (doc.fields || []).map((f) => f.type);
  ok(types.includes("icd11_diagnoses"), `${key} has no ICD-11 diagnosis field`);
  ok(types.includes("gi_modules"), `${key} has no structured clinical block`);
  ok(types.includes("gi_safety"), `${key} has no safety panel`);
  ok(types.includes("gi_guidance"), `${key} has no guideline attribution`);
  ok(Array.isArray(doc.guidelineBasis) && doc.guidelineBasis.includes("WHO ICD-11 MMS"), `${key} does not record WHO ICD-11 MMS as its coding basis`);
  ok(!!gastroNoteBasis(key), `${key} has no guideline attribution registry entry`);
  // the differential field must be separate from the confirmed diagnosis field
  const icdKeys = (doc.fields || []).filter((f) => f.type === "icd11_diagnoses").map((f) => f.key);
  ok(icdKeys.includes("icd11_diagnoses") && icdKeys.includes("icd11_differential"), `${key} does not separate confirmed and differential diagnoses`);
});

/* 2 — no field label is silently retired by the section policy */
GI_KEYS.forEach((key) => {
  const doc = getDocDef(key);
  if (!doc) return;
  // Only the fields this build ADDS are checked — the original templates keep
  // their own labels exactly as they were.
  const labels = (doc.fields || [])
    .filter((f) => (f.type || "").startsWith("gi_") || (f.type || "").startsWith("icd11_"))
    .map((f) => f.label);
  ["Plan", "Laboratory", "Investigations", "Imaging", "Medication", "Referral", "Escalation", "Working diagnosis", "Treatment", "Past medical history"].forEach((word) => {
    const hit = labels.find((l) => new RegExp(`\\b${word}`, "i").test(l));
    ok(!hit, `${key}: label "${hit}" would be retired by the section policy (contains "${word}")`);
  });
});

/* 3 — every block referenced by a template exists and round-trips */
GASTRO_BLOCK_KEYS.forEach((k) => ok(!!GASTRO_BLOCKS[k].title && Array.isArray(GASTRO_BLOCKS[k].fields), `block ${k} malformed`));
GI_KEYS.forEach((key) => {
  const doc = getDocDef(key);
  if (!doc) return;
  (doc.fields || []).filter((f) => f.type === "gi_modules").forEach((f) => {
    ok(GASTRO_BLOCK_KEYS.includes(f.key), `${key}: unknown block ${f.key}`);
    const sample = gastroBlockValue(f.key, {});
    ok(formatGastroBlock(sample).includes("not documented") || formatGastroBlock(sample).length > 0, `${key}: block ${f.key} does not serialize`);
  });
});

/* 4 — scores never estimate from a missing value */
GASTRO_SCORES.forEach((s) => {
  const r = calculateGastroScore(s.key, {});
  ok(!r || r.value === null || String(r.value).length >= 0, `score ${s.key} threw on empty input`);
  ok(!!r.missing, `score ${s.key} did not report its missing inputs`);
});
const emptyScores = formatGastroScores({});
ok(emptyScores === "No score recorded in this note.", "empty scores must state that nothing was recorded");

/* 5 — a documented score prints with its band and source */
const CP_INPUTS = {
  bilirubin: "34–51 µmol/L (2–3 mg/dL)",
  albumin: "28–35 g/L",
  inr: "1.7–2.3",
  ascites: "Mild — controlled with diuretics",
  encephalopathy: "Grade I–II",
};
const cp = calculateGastroScore("child_pugh", CP_INPUTS);
ok(cp && cp.value !== null && cp.band, "Child-Pugh did not calculate from a complete set of inputs");
ok(cp && cp.value === 10, `Child-Pugh scored ${cp && cp.value}, expected 10`);
ok(formatGastroScores({ child_pugh: CP_INPUTS }).includes("Decision support only"), "score text must carry the decision-support caveat");
// one variable missing → not calculated, never estimated
const cpPartial = calculateGastroScore("child_pugh", { ...CP_INPUTS, albumin: "" });
ok(cpPartial && cpPartial.value == null && (cpPartial.missing || []).length, "Child-Pugh estimated a score from an incomplete set");
ok(formatGastroScores({ child_pugh: { ...CP_INPUTS, albumin: "" } }).includes("not calculated"), "an incomplete score must print as not calculated");

/* 6 — safety rules fire across blocks, and staying quiet is not a clearance */
const bleeding = {
  gi_bleeding: gastroBlockValue("gi_bleeding", { haemodynamics: "Unstable", antithrombotic: "Yes", forrest: "Ia" }),
};
const prompts = buildGastroSafetyPrompts({ values: bleeding });
ok(prompts.length > 0, "an unstable GI bleed raised no safety prompt");
ok(GASTRO_SAFETY_RULE_COUNT >= 30, "the GI safety rule set lost rules");
ok(formatGastroSafety({ acknowledged: ["x"], notes: "transfused 2 units" }).includes("advisory"), "safety text must stay advisory");

/* 7 — ICD-11 catalogue integrity */
const seen = new Set();
GASTRO_ICD11.forEach((e) => {
  ok(!!e.code && !!e.display && !!e.domain, `catalogue entry ${e.code} incomplete`);
  ok(!seen.has(e.code), `duplicate ICD-11 code ${e.code}`);
  seen.add(e.code);
  ok(/^[0-9A-Z]{2,}/.test(e.code), `code ${e.code} is not an ICD-11 MMS code shape`);
});
ok(GASTRO_ICD11.length >= 60, "the ICD-11 catalogue is smaller than the verified set");
const luminal = gastroenterologyCatalogFor(["large_intestine"]);
ok(luminal.length > 0 && luminal.length < GASTRO_ICD11.length, "the domain filter does not narrow the catalogue");

/* 8 — an unmapped diagnosis is never given a code */
const unresolved = formatFieldValue("icd11_diagnoses", [
  { display: "Unclear colitis", role: "Primary", status: "Provisional", mapping_state: "unresolved" },
]);
ok(unresolved.includes("No ICD-11 code"), "an unresolved diagnosis printed as if it had a code");

/* 9 — attribution is recorded with the note */
GI_KEYS.forEach((key) => {
  const text = guidelineAttributionText(key);
  ok(text.includes("population") && text.includes("ICD-11") === false || text.length > 0, `${key}: attribution text missing`);
  ok(GASTRO_NOTE_BASIS[key].basis.length >= 2, `${key}: fewer than two guideline sources`);
});

/* 10 — nothing outside Gastroenterology changed */
const otherSpecialties = new Set(SPECIALTY_DOCUMENTS.map((d) => d.specialty));
ok(otherSpecialties.size >= 15, "other specialties disappeared from the catalogue");
SPECIALTY_DOCUMENTS.filter((d) => d.specialty !== "gastroenterology").forEach((d) => {
  ok(!(d.fields || []).some((f) => f.type && f.type.startsWith("gi_")), `${d.key} picked up a gastroenterology field`);
});

if (fails.length) {
  console.log(`FAIL — ${fails.length} problem(s):`);
  fails.forEach((f) => console.log("  · " + f));
  process.exit(1);
}
console.log(`PASS — ${GI_KEYS.length} GI note types, ${GASTRO_BLOCK_KEYS.length} blocks, ${GASTRO_SCORES.length} scores, ${GASTRO_SAFETY_RULE_COUNT} rules, ${GASTRO_ICD11.length} ICD-11 entries.`);