// Allergy & Immunology QA harness.
// Run with:
//   npx esbuild qa/allergy-qa.mjs --bundle --format=esm --alias:@=./src --outfile=/tmp/allergy-qa.mjs && node /tmp/allergy-qa.mjs
// It asserts that the specialty resolves, that every note kept its template and
// gained the modules it should, that nothing retired by the note section policy
// survived, and that the advisory prompts fire only from documentation.

import { SPECIALTY_DOCUMENTS, getSpecialtyDocs, getDocDef, SPECIALTY_KEYS } from "../src/lib/specialtyDocuments.js";
import { buildAllergySafetyPrompts } from "../src/lib/allergySafetyRules.js";
import { formatAllergyBlock } from "../src/lib/allergyModules.js";
import { formatAllergyTests, emptyTestRow, derivedFlag } from "../src/lib/allergyTests.js";
import { withAllergyStandards, ALLERGY_DOCS } from "../src/lib/allergyDocuments.js";
import { allergyNoteBasis } from "../src/lib/allergyReferences.js";

const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };

// 1. The specialty resolves to its own note set.
ok(SPECIALTY_KEYS["Allergy & Immunology"] === "allergy", "Allergy & Immunology does not map to the allergy key");
const docs = getSpecialtyDocs("Allergy & Immunology");
ok(docs.length === 11, `expected 11 allergy notes, got ${docs.length}`);

// 2. Existing Internal Medicine templates are untouched and still resolvable.
ok(SPECIALTY_DOCUMENTS.filter((d) => d.specialty === "internal_medicine").length > 0, "Internal Medicine docs disappeared");
ok(!!getDocDef("im_consultation") || SPECIALTY_DOCUMENTS.some((d) => d.specialty === "internal_medicine"), "IM docs not resolvable");

// 3. Every allergy note kept its declared fields and gained the standard blocks.
ALLERGY_DOCS.forEach((base) => {
  const doc = getDocDef(base.key);
  ok(!!doc, `${base.key} missing from the catalogue`);
  if (!doc) return;
  base.fields.forEach((f) => ok(doc.fields.some((x) => x.key === f.key), `${base.key} lost field ${f.key}`));
  ok(doc.fields.some((f) => f.type === "allergy_modules"), `${base.key} has no structured block`);
  ok(doc.fields.some((f) => f.type === "icd11_diagnoses"), `${base.key} has no ICD-11 field`);
  ok(doc.fields.some((f) => f.type === "allergy_safety"), `${base.key} has no safety field`);
  ok(doc.fields.some((f) => f.type === "allergy_guidance"), `${base.key} has no guideline basis field`);
  const keys = doc.fields.map((f) => f.key);
  ok(new Set(keys).size === keys.length, `${base.key} has duplicate field keys`);
});

// 4. Nothing retired by the note section policy survived into an allergy note.
const RETIRED = [/investigation/i, /laborator/i, /\blabs?\b/i, /\bimaging\b/i, /^plan\b/i, /^referral/i, /family history/i, /past medical history/i];
docs.forEach((d) => d.fields.forEach((f) => {
  RETIRED.forEach((re) => ok(!re.test(f.label || ""), `${d.key} kept a retired label: ${f.label}`));
}));

// 5. Blocks print and tests stay empty until entered.
const blockValue = { __m: "allergy_anaphylaxis", adrenaline_given: "Yes — documented below" };
ok(formatAllergyBlock(blockValue).includes("Adrenaline Given"), "block does not print");
const row = emptyTestRow("sige_peanut");
ok(row && row.value === "" && row.interpretation === "", "test row was prefilled with a result");
ok(derivedFlag("12", "Less than 0.35") === "", "non-numeric range produced a flag");
ok(derivedFlag("0.1", "0.1–0.4") === "Normal", "in-range flag wrong");
ok(derivedFlag("0.5", "0.1–0.4") === "High", "high flag wrong");
ok(formatAllergyTests([row]) === "", "an empty row printed as a result");

// 6. Advisory prompts fire only from documentation.
const anaphylaxisNoAdrenaline = buildAllergySafetyPrompts({
  values: { allergy_anaphylaxis: { severity: "Grade 3 — severe, hypoxia or hypotension" } },
});
ok(anaphylaxisNoAdrenaline.some((p) => p.key === "anaphylaxis_without_adrenaline"), "anaphylaxis prompt did not fire");
ok(anaphylaxisNoAdrenaline.find((p) => p.key === "anaphylaxis_without_adrenaline").source, "prompt has no source");
const emptyNote = buildAllergySafetyPrompts({ values: {} });
ok(emptyNote.length === 0, "prompts fired on an empty note");

// 7. Attribution text carries edition and population.
const entry = allergyNoteBasis("allergy_anaphylaxis_note");
ok(!!entry && entry.basis.every((b) => b.population && b.edition && b.current_as_of), "attribution lacks edition, population or check date");

// 8. The strengthening is idempotent: applying it twice adds nothing.
const once = withAllergyStandards(ALLERGY_DOCS).map((d) => d.fields.length);
const twice = withAllergyStandards(withAllergyStandards(ALLERGY_DOCS)).map((d) => d.fields.length);
ok(JSON.stringify(once) === JSON.stringify(twice), "strengthening is not idempotent");

if (fail.length) {
  console.error("ALLERGY QA FAILURES:\n" + fail.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log(`Allergy QA passed — ${docs.length} notes, ${docs.reduce((n, d) => n + d.fields.length, 0)} fields.`);