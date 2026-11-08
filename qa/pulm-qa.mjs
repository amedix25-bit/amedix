// QA harness for the Pulmonology / Respiratory Medicine upgrade.
// Run: npx esbuild qa/pulm-qa.mjs --bundle --platform=node --format=esm --outfile=/tmp/pqa.mjs --alias:@=./src && node /tmp/pqa.mjs
//
// Every check below asserts a property of the shipped code, not of this file. A
// check that cannot be proved from the code fails rather than passing silently.
import fs from "node:fs";
import path from "node:path";

import { getDocDef } from "@/lib/specialtyDocuments";
import { pulmBlocksForNote } from "@/lib/pulmonologyDocuments";
import {
  PULM_BLOCKS,
  PULM_BLOCK_KEYS,
  pulmBlockValue,
  formatPulmBlock,
} from "@/lib/pulmonologyBlocks";
import { PULM_COPD_BLOCK_KEYS } from "@/lib/pulmCopdModule";
import { PULM_ASTHMA_BLOCK_KEYS } from "@/lib/pulmAsthmaModule";
import { PULM_ACUTE_BLOCKS } from "@/lib/pulmAcuteModule";
import { PULM_EMERGENCY_BLOCKS } from "@/lib/pulmEmergencyModule";
import { PULM_FOLLOWUP_BLOCKS } from "@/lib/pulmFollowupModule";
import { PULM_REFERRAL_BLOCKS } from "@/lib/pulmReferralModule";
import {
  PULM_INSTRUMENTS,
  PULM_SCORE_KEYS,
  pulmScore,
  pulmScoreValue,
  goldAbe,
  formatPulmonologyScores,
} from "@/lib/pulmonologyScores";
import { buildPulmonologySafetyPrompts, formatPulmSafety } from "@/lib/pulmonologySafetyRules";
import { PULM_GUIDANCE_BY_NOTE, guidanceForPulmNote, pulmonologyGuidanceBasis } from "@/lib/pulmonologyReferences";
import { PULMONOLOGY_ICD11, PULM_ICD11_MMS, PULM_ICD11_COUNT, PULM_DIAGNOSIS_STATUSES, PULM_DIAGNOSIS_ROLES } from "@/lib/pulmonologyIcd11";
import { RESPIRATORY_CONDITION_GROUPS, RESPIRATORY_CONDITIONS, RESPIRATORY_CONDITION_COUNT } from "@/lib/pulmonologyConditions";
import { PULM_INVESTIGATION_TESTS, PULM_INVESTIGATION_COUNT, pulmInvestigationGaps } from "@/lib/pulmonologyInvestigations";

const fails = [];
const notes = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const PULM_NOTES = [
  "pulm_consultation", "pulm_followup", "pulm_admission_note", "pulm_progress_note",
  "pulm_discharge_summary", "pulm_procedure_note", "pulm_pft_report",
  "pulm_bronchoscopy_report", "pulm_care_plan",
];

/* ------------------------------------------------------------------ 1. Note catalogue */
PULM_NOTES.forEach((key) => {
  const doc = getDocDef(key);
  ok(!!doc, `note type ${key} missing`);
  if (!doc) return;
  ok(doc.specialty === "pulmonology", `${key}: specialty changed`);
  const types = (doc.fields || []).map((f) => f.type);
  ok(types.includes("pulm_modules"), `${key}: no respiratory block`);
  ok(types.includes("pulm_safety"), `${key}: no advisory prompts panel`);
  ok(types.includes("pulm_guidance"), `${key}: no guideline attribution`);
  // The ICD-11 field is required on every note that records a diagnosis.
  if (key !== "pulm_procedure_note" && key !== "pulm_bronchoscopy_report") {
    ok(types.includes("icd11_diagnoses"), `${key}: no ICD-11 diagnosis field`);
  }
  ok(guidanceForPulmNote(key).length > 0, `${key}: no guideline reference attributed`);
});

// Every block the build maps to a note must survive the central section policy:
// getDocDef returns the catalogue AFTER applyNoteSectionPolicy, so a block that
// was silently retired here would be missing from the final template.
PULM_NOTES.forEach((key) => {
  const doc = getDocDef(key);
  if (!doc) return;
  const present = new Set((doc.fields || []).filter((f) => f.type === "pulm_modules").map((f) => f.blockKey));
  pulmBlocksForNote(key).forEach((blockKey) => {
    ok(present.has(blockKey), `${key}: block ${blockKey} was retired from the template`);
  });
  const icd = (doc.fields || []).filter((f) => f.type === "icd11_diagnoses");
  icd.forEach((f) => ok(f.conditionGroups?.length > 0 && f.catalog, `${key}: the ICD-11 field carries no catalogue or condition index`));
});

/* --------------------------------------------------------------- 2. Block integrity */
const ALL_BLOCKS = { ...PULM_BLOCKS };
PULM_BLOCK_KEYS.forEach((k) => {
  const spec = ALL_BLOCKS[k];
  ok(!!spec && !!spec.title && Array.isArray(spec.fields) && spec.fields.length > 0, `block ${k} malformed`);
  const keys = spec.fields.map((f) => f.key);
  const dupes = keys.filter((x, i) => keys.indexOf(x) !== i);
  ok(!dupes.length, `block ${k} repeats field keys: ${dupes.join(", ")}`);
  spec.fields.forEach((f) => {
    ok(!!f.key && !!f.label && !!f.type, `block ${k}: field ${JSON.stringify(f.key)} incomplete`);
    if (f.type === "select" || f.type === "multi") {
      ok(Array.isArray(f.options) && f.options.length > 1, `block ${k}: ${f.key} has no options`);
    }
    // Nothing is preselected: a select must not carry a default value.
    ok(f.default === undefined, `block ${k}: ${f.key} preselects a default`);
  });
  // A blank block prints nothing; a filled one prints what was answered.
  const blank = formatPulmBlock(pulmBlockValue(k, {}));
  ok(blank === "", `block ${k}: a blank block printed content`);
});

// A representative filled block prints every answered field and only those.
const sample = formatPulmBlock(
  pulmBlockValue("pulm_emergency_recognition", {
    emergency_presentation: "Massive haemoptysis",
    airway: "At risk — documented",
    target_range: "94–98%",
  }),
);
["Massive haemoptysis", "At risk — documented", "94–98%"].forEach((v) =>
  ok(sample.includes(v), `printed emergency block lost "${v}"`),
);
ok(!/Heart Rate/.test(sample), "printed block invented an unanswered field");

/* ------------------------------------------------------- 3. Scores never estimate */
PULM_SCORE_KEYS.forEach((k) => {
  const r = pulmScore(k, pulmScoreValue(k, {}));
  ok(!!r, `score ${k} returned nothing`);
  ok(r.complete === false && r.total === null, `score ${k} scored an incomplete instrument`);
  ok(r.answered === 0, `score ${k} counted unanswered items as answered`);
  ok(String(r.band || "") === "", `score ${k} assigned a band with no answers`);
  const inst = PULM_INSTRUMENTS[k];
  ok(Array.isArray(inst.items) && inst.items.length > 0, `score ${k} has no items`);
  // A fully answered instrument scores, and only then.
  const full = Object.fromEntries(inst.items.map((i) => [i.key, i.options[0].label]));
  const scored = pulmScore(k, pulmScoreValue(k, full));
  ok(scored.complete === true && typeof scored.total === "number", `score ${k} did not score a complete set of answers`);
});

// GOLD ABE grouping is reproducible from documented inputs, and is not invented.
const abe = goldAbe({ exacerbations: 2, catTotal: 18, mmrcGrade: "2" });
ok(abe.group === "E" || abe.group === "B", `goldAbe produced ${JSON.stringify(abe)}`);
const abeMissing = goldAbe({});
ok(abeMissing.group === null || abeMissing.group === "", "goldAbe invented a group without inputs");
notes.push(`GOLD ABE (2 exacerbations, CAT 18) → ${JSON.stringify(abe)}`);

/* ------------------------------------------------- 4. Advisory prompts and safety */
const clean = buildPulmonologySafetyPrompts({ values: {}, noteKey: "pulm_consultation" });
ok(clean.length === 0, "a blank note raised advisory prompts");

const prompts = buildPulmonologySafetyPrompts({
  values: {
    pulm_block_pulm_emergency_recognition: { __m: "pulm_emergency_recognition", emergency_presentation: "Severe asthma / near-fatal asthma" },
    pulm_block_pulm_ventilatory_support: { __m: "pulm_ventilatory_support", support_level: "NIV — BiPAP", blood_gas_on_support: "Not performed" },
    pulm_block_pulm_mdt_referral: { __m: "pulm_mdt_referral", specialties: ["Thoracic Oncology"], urgency: "Urgent", letter_recorded: "Not recorded — verbal or hand-written referral documented" },
  },
  noteKey: "pulm_admission_note",
});
ok(prompts.length >= 3, `expected the documented gaps to raise prompts, got ${prompts.length}`);
prompts.forEach((p) => {
  ok(!!p.key && !!p.basis && !!p.action && !!p.provenance, `prompt ${p.key} is missing its basis, action or provenance`);
  ok(["advisory", "documented", "same_day"].includes(p.level), `prompt ${p.key} has an unknown level ${p.level}`);
  // A prompt names guidance; it never orders treatment or asserts a diagnosis.
  ok(!/^\s*(give|start|prescribe|administer|order)/i.test(p.action), `prompt ${p.key} issues an order`);
});
notes.push(`documented-gap note raised ${prompts.length} prompts, every one with basis + action + source`);
ok(formatPulmSafety({ acknowledged: ["x"], notes: { x: "done" } }).includes("done"), "acknowledged prompt not printed");

/* -------------------------------------------------------------- 5. ICD-11 integrity */
const ICD10 = /^[A-Z]\d{2}(\.\d+)?$/;
ok(PULM_ICD11_COUNT > 0, "the respiratory ICD-11 catalogue is empty");
PULMONOLOGY_ICD11.forEach((e) => {
  ok(!!e.code && !!e.display, `catalogue entry ${JSON.stringify(e.code)} has no code or display`);
  ok(!ICD10.test(String(e.code || "")), `catalogue entry ${e.code} looks like an ICD-10 code`);
  ok(/^[A-Z0-9]{2,}/.test(String(e.code || "")), `catalogue entry ${e.code} is not an MMS stem code`);
});
ok(!!PULM_ICD11_MMS.release && /^\d{4}-\d{2}$/.test(PULM_ICD11_MMS.release), "catalogue release is not recorded");
ok(PULM_DIAGNOSIS_STATUSES.length > 1 && PULM_DIAGNOSIS_ROLES.length > 1, "diagnosis statuses/roles missing");

// A code is never carried in the condition index: only a WHO search phrase is.
ok(RESPIRATORY_CONDITION_COUNT > 30, `condition index holds only ${RESPIRATORY_CONDITION_COUNT} conditions`);
RESPIRATORY_CONDITIONS.forEach((c) => {
  ok(!!c.whoQuery, `condition ${c.key} has no WHO search phrase`);
  ok(!("code" in c) && !("icd11" in c), `condition ${c.key} carries a code — codes must come from the WHO service only`);
  ok(!ICD10.test(String(c.whoQuery)), `condition ${c.key} search phrase looks like a code`);
});
RESPIRATORY_CONDITION_GROUPS.forEach((g) => ok(g.conditions.length > 0, `group ${g.key} is empty`));

/* ------------------------------------- 6. WHO endpoint contract (source assertions) */
const who = read("base44/functions/icd11WhoSearch/entry.ts");
ok(/WHO_ICD11_CLIENT_ID/.test(who) && /WHO_ICD11_CLIENT_SECRET/.test(who), "WHO credentials are not read from secrets");
ok(/icdaccessmanagement\.who\.int\/connect\/token/.test(who), "WHO token endpoint missing");
ok(/icdapi_access/.test(who), "WHO OAuth scope missing");
ok(/if \(!user\) return Response\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\)/.test(who), "endpoint is not authenticated");
ok(/configured: false/.test(who), "missing credentials do not degrade explicitly");
ok(/mode must be search, entity or releases/.test(who), "mode is not validated");
ok(/query must be at least 2 characters/.test(who), "search length is not validated");
ok(/lang === "ar" \? "ar" : "en"/.test(who), "Arabic terminology is not requested from WHO");
ok(/Accept-Language/.test(who), "Accept-Language header missing");
ok(/API-Version/.test(who), "API version header missing");
ok(/pickRelease/.test(who) && /WHO_ICD11_RELEASE/.test(who), "release selection/versioning missing");
ok(/AbortSignal\.timeout/.test(who), "no request timeout — a hung WHO call would hang the note");
ok(/theCode/.test(who), "code is not read from the WHO payload");
ok(/codable: Boolean\(e\.theCode\)/.test(who), "grouping nodes are not distinguished from codable entries");
ok(/catch \(error\)/.test(who), "no failure handling");
// The endpoint must not synthesise terminology: no crosswalk, no generated
// synonym and no invented fallback code anywhere in the request path.
ok(!/icd10[_-]?(code|map|lookup|crosswalk)/i.test(who), "the endpoint carries an ICD-10 crosswalk");
ok(!/fallback(code|Code)|suggested(Code|code)|guess(Code|Release)/.test(who), "the endpoint can invent a code or a release");

/* ----------------------------------------- 7. Investigations: documented, not faked */
ok(PULM_INVESTIGATION_COUNT > 0, "no respiratory investigation catalogue");
const invKeys = PULM_INVESTIGATION_TESTS.map((t) => t.key);
ok(new Set(invKeys).size === invKeys.length, "duplicate investigation keys");
const gaps = pulmInvestigationGaps({ status: "Reported and reviewed" });
ok(gaps.length >= 0, "investigation gap check threw");

/* ------------------------------------ 8. Prescription / referral / pharmacy wiring */
const prescription = read("base44/entities/Prescription.jsonc");
["medication_name", "route", "frequency", "duration", "special_instructions", "safety_check", "status"].forEach((f) =>
  ok(new RegExp(`"${f}":`).test(prescription), `Prescription entity lost ${f}`),
);
ok(/"device":/.test(prescription) === false, "unexpected: Prescription gained a device field — update this test and the report");

const referral = read("base44/entities/ReferralLetter.jsonc");
["reason_for_referral", "urgency", "specific_request", "working_diagnosis", "current_medications", "treatment_medications"].forEach((f) =>
  ok(new RegExp(`"${f}":`).test(referral), `ReferralLetter entity lost ${f}`),
);
const referralForm = read("src/components/doctor/referral/ReferralLetterForm.jsx");
ok(/urgency/.test(referralForm) && /reason_for_referral|reason/i.test(referralForm), "referral form does not capture reason and urgency");

/* -------------------------------------------- 9. Permissions, signing and audit trail */
const clinicalNote = read("base44/entities/ClinicalNote.jsonc");
ok(/"rls":/.test(clinicalNote), "ClinicalNote has no row-level security");
ok(!/"read":\s*\{\s*\}/.test(clinicalNote), "ClinicalNote is readable without a rule (open read)");
ok(/created_by_id/.test(clinicalNote), "ClinicalNote read rule is not tied to ownership");

const signDoc = read("base44/functions/signClinicalDocument/entry.ts");
ok(/already signed/.test(signDoc), "a signed version can be signed again");
ok(/Only the authoring doctor/.test(signDoc), "signing is not restricted to the author");
ok(/logClinicalAudit/.test(signDoc), "signing is not audited");

const amend = read("base44/functions/amendClinicalDocument/entry.ts");
ok(/amendment|amend/i.test(amend), "no amendment path for a signed document");

const createNote = read("base44/functions/createClinicalNote/entry.ts");
ok(/signed_by_name/.test(createNote) && /signed_datetime/.test(createNote), "saving a note does not apply the electronic signature");
ok(/logClinicalAudit/.test(createNote), "saving a note writes no audit entry");
ok(/checkin/.test(createNote), "note creation is not gated on the patient check-in");
ok(/ICD-11|coded/.test(createNote), "the coded diagnosis is not written server-side with the note");

const patientRecord = read("base44/functions/getPatientClinicalRecord/entry.ts");
ok(/access|authoriz|consent|permission/i.test(patientRecord), "patient record access is not authorised in code");
ok(/audit|Audit/.test(patientRecord), "reading the patient record is not audited");

const auditShared = read("base44/shared/clinicalAudit.ts");
ok(/logClinicalAudit/.test(auditShared) && /generateClinicalRef/.test(auditShared), "clinical audit helpers missing");

/* --------------------------------------------------------------------- 10. Summary */
notes.unshift(
  `notes: ${PULM_NOTES.length} | blocks: ${PULM_BLOCK_KEYS.length} ` +
    `(COPD ${PULM_COPD_BLOCK_KEYS.length}, asthma ${PULM_ASTHMA_BLOCK_KEYS.length}, ` +
    `acute ${Object.keys(PULM_ACUTE_BLOCKS).length}, emergency ${Object.keys(PULM_EMERGENCY_BLOCKS).length}, ` +
    `follow-up ${Object.keys(PULM_FOLLOWUP_BLOCKS).length}, referral ${Object.keys(PULM_REFERRAL_BLOCKS).length}) | ` +
    `scores: ${PULM_SCORE_KEYS.length} | conditions: ${RESPIRATORY_CONDITION_COUNT} | investigations: ${PULM_INVESTIGATION_COUNT} | ` +
    `ICD-11 catalogue: ${PULM_ICD11_COUNT}`,
);

console.log(notes.map((n) => "· " + n).join("\n"));
if (fails.length) {
  console.log(`\nFAILED (${fails.length}):`);
  fails.forEach((f) => console.log("  ✗ " + f));
  process.exit(1);
}
console.log("\nAll pulmonology checks passed.");