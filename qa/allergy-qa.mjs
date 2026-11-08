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
import {
  AGE_GROUPS,
  TREATMENT_CLASSES,
  TREATMENT_STATUSES,
  DOSING_RULE,
  emptyTreatmentEntry,
  formatAllergyTreatment,
  treatmentDocumentationGaps,
} from "../src/lib/allergyTreatment.js";
import {
  CLINICAL_REFERENCES,
  REFERENCE_BY_KEY,
  REFERENCE_STATUS,
  referenceKeysFor,
  referenceStatusLabel,
} from "../src/lib/clinicalReferences.js";

const CLINICAL_REFERENCE_KEYS = CLINICAL_REFERENCES.map((r) => r.key);

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

// 9. Every allergy note carries the treatment module exactly once.
const strengthened = withAllergyStandards(ALLERGY_DOCS);
strengthened.forEach((d) => {
  const n = d.fields.filter((f) => f.type === "allergy_treatment").length;
  ok(n === 1, `${d.key}: expected exactly one treatment module, got ${n}`);
});

// 10. Treatment documentation never carries a dose AMedix could be said to have chosen.
const treatmentJson = JSON.stringify(TREATMENT_CLASSES);
ok(!/\b\d+(\.\d+)?\s?(mg|mcg|µg|ml|g|iu)\b/i.test(treatmentJson), "a treatment class carries a numeric dose");
ok(/no calculation/i.test(DOSING_RULE), "the dosing rule statement does not state that no calculation is performed");
ok(TREATMENT_CLASSES.every((c) => c.label && Array.isArray(c.references) && c.references.length > 0), "a treatment class has no label or no reference");
ok(TREATMENT_CLASSES.every((c) => c.references.every((k) => CLINICAL_REFERENCE_KEYS.includes(k))), "a treatment class cites an unknown reference key");
ok(AGE_GROUPS.includes("Paediatric") && AGE_GROUPS.includes("Adult"), "adult and paediatric indications are not both represented");
ok(TREATMENT_STATUSES.includes("Not indicated"), "not-indicated status missing");

// 11. A blank entry prints nothing; a documented one prints its adult and paediatric plan.
const blank = emptyTreatmentEntry("antihistamines");
ok(formatAllergyTreatment([blank]) === "", "an empty treatment entry printed as a plan");
const documented = {
  ...blank,
  agent: "Agent as documented",
  indication: "Documented indication",
  adult_dose: "Documented adult dose",
  adult_frequency: "Documented frequency",
  paediatric_dose: "Documented paediatric dose",
  paediatric_age_band: "2–5 years",
  paediatric_weight_basis: "Weight documented by the clinician",
  status: "Started today",
};
const printed = formatAllergyTreatment([documented]);
ok(printed.includes("Documented adult dose") && printed.includes("Documented paediatric dose"), "adult and paediatric dosing not both printed");
ok(printed.includes("Weight documented by the clinician"), "paediatric weight basis not printed");

// 12. Documentation gaps are advisory findings, never silent.
const gaps = treatmentDocumentationGaps([documented]);
ok(gaps.some((g) => /weight basis/i.test(g.text) === false), "weight basis flagged although it was recorded");
ok(treatmentDocumentationGaps([blank]).length > 0, "an undocumented plan reported no gaps");

// 13. The references library is complete, attributable and never claims a status twice.
ok(CLINICAL_REFERENCES.length >= 16, `expected the full reference set, got ${CLINICAL_REFERENCES.length}`);
const keys = CLINICAL_REFERENCES.map((r) => r.key);
ok(new Set(keys).size === keys.length, "duplicate reference key");
CLINICAL_REFERENCES.forEach((r) => {
  ok(r.issuing_organization && r.title && r.source_url, `${r.key}: missing issuing body, title or source URL`);
  ok(r.last_verified_date, `${r.key}: no check date`);
  ok(Object.values(REFERENCE_STATUS).includes(r.status), `${r.key}: unknown status ${r.status}`);
  ok(referenceStatusLabel(r.status).length > 0, `${r.key}: status has no label`);
  if (r.status === REFERENCE_STATUS.SUPERSEDED) {
    ok(!!r.superseded_by_key, `${r.key}: superseded without naming the document that supersedes it`);
    ok(!!REFERENCE_BY_KEY[r.superseded_by_key], `${r.key}: supersedes by an unknown key`);
  }
  if (r.publication_year !== null && r.publication_year !== undefined) {
    ok(Number.isInteger(r.publication_year), `${r.key}: publication year is not a year`);
  }
});
// Every reference cited by any specialty module must exist in the library.
const citedKeys = new Set();
ALLERGY_DOCS.forEach((d) => {
  const refs = (allergyNoteBasis(d.key)?.basis || []).map((b) => b.key).filter(Boolean);
  refs.forEach((k) => citedKeys.add(k));
});
TREATMENT_CLASSES.forEach((c) => c.references.forEach((k) => citedKeys.add(k)));
[...citedKeys].forEach((k) => ok(CLINICAL_REFERENCE_KEYS.includes(k), `cited reference "${k}" is not in the library`));
ok(referenceKeysFor(["not_a_real_key"]).length === 0, "an unknown reference key resolved");

if (fail.length) {
  console.error("ALLERGY QA FAILURES:\n" + fail.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log(`Allergy QA passed — ${docs.length} notes, ${docs.reduce((n, d) => n + d.fields.length, 0)} fields.`);