// QA harness for the Urology portal upgrade.
// Run: npx esbuild qa/uro-qa.mjs --bundle --platform=node --format=esm --outfile=/tmp/uqa.mjs --alias:@=./src && node /tmp/uqa.mjs
//
// Every check asserts a property of the SHIPPED code, not of this file. A check
// that cannot be proved from the code fails rather than passing quietly.

import fs from "node:fs";
import path from "node:path";

import {
  URO_ICD11,
  URO_ICD11_MMS,
  URO_CONDITION_GROUPS,
  URO_CONDITION_COUNT,
  URO_ICD_STATUSES,
  URO_ICD_ROLES,
} from "@/lib/uroIcd11";
import { URO_BLOCKS, blockFields } from "@/lib/uroBlocks";
import { URO_SCORES, calculateUroScore } from "@/lib/uroScores";
import { URO_SAFETY_RULES, evaluateUroSafety } from "@/lib/uroSafetyRules";
import { URO_EXAM_GROUPS, EXAM_STATES, examStateLabel } from "@/lib/uroExamBlocks";
import { URO_CANCER_TYPES, uroStagingFields } from "@/lib/uroOncology";
import { URO_REFERENCES, guidanceForUroNote, URO_LOCAL_PROTOCOLS } from "@/lib/uroReferences";
import { URO_ENHANCEMENTS, uroIcdField } from "@/lib/uroClinicalSections";
import { URO_WORKFLOW_DOCS, URO_WORKFLOW_KEYS } from "@/lib/uroDocuments";
import { SPECIALTY_DOCUMENTS, getSpecialtyDocs, getDocDef } from "@/lib/specialtyDocuments";
import { applyNoteSectionPolicy } from "@/lib/noteSectionPolicy";
import {
  isKnownDocumentType,
  getDocumentSpecialty,
  isConfidentialDocumentType,
} from "../base44/shared/clinicalDocumentCatalog.ts";

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

// Run from the app root: the harness reads the shipped source files.
const ROOT = process.cwd();
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const docSource = read("src/lib/specialtyDocuments.js");
const fieldSource = read("src/components/doctor/encounters/DocumentFields.jsx");
const policySource = read("src/lib/noteSectionPolicy.js");

// ---- 1. The nine original templates still exist, by key and by field --------
const ORIGINAL_URO_KEYS = [
  "uro_consultation", "uro_followup", "uro_procedure_note", "uro_operative_note",
  "uro_preop_assessment", "uro_postop_note", "uro_catheter_device_record",
  "uro_discharge_summary", "uro_referral",
];

const uroBlockSrc = docSource.slice(
  docSource.indexOf("const UROLOGY_DOCS = ["),
  docSource.indexOf("const PULMONOLOGY_DOCS = ["),
);
const originalSegments = uroBlockSrc.split(/key: "(uro_[a-z_]+)"/).slice(1);
const originalDocs = [];
for (let i = 0; i < originalSegments.length; i += 2) {
  const key = originalSegments[i];
  const segment = originalSegments[i + 1] || "";
  const fields = [...segment.matchAll(/\b[INTS]\("([a-z0-9_]+)",\s*"([^"]*)"/g)].map((m) => ({ key: m[1], label: m[2], type: "input" }));
  originalDocs.push({ key, label: key, specialty: "urology", fields });
}

// The baseline is what the shipped portal DELIVERED for these templates: the
// declared fields after the pre-existing note-section policy, which already
// applied to every specialty before this upgrade. The upgrade must not remove a
// single one of them.
const baseline = Object.fromEntries(
  applyNoteSectionPolicy(originalDocs).map((d) => [d.key, (d.fields || []).map((f) => f.key)]),
);

for (const key of ORIGINAL_URO_KEYS) {
  check(originalDocs.some((d) => d.key === key), `original template parsed from source: ${key}`);
  const shipped = getDocDef(key);
  if (key === "uro_referral") {
    // Referral notes are retired from every specialty by the pre-existing policy
    // (the Referral Letter module owns that document). That behaviour is unchanged.
    check(!shipped, "the retired referral note type stays retired");
    continue;
  }
  check(Boolean(shipped), `original template still in the catalogue: ${key}`);
  if (shipped) {
    const keys = new Set((shipped.fields || []).map((f) => f.key));
    for (const fieldKey of baseline[key] || []) {
      check(keys.has(fieldKey), `${key} still declares its delivered field "${fieldKey}"`);
    }
    check(shipped.key === key, `${key} keeps its key`);
    check(shipped.specialty === "urology", `${key} keeps its specialty`);
  }
}

// ---- 2. Append-only, no duplicate field key, sections survive the policy ----
const uroDocs = getSpecialtyDocs("Urology");
check(uroDocs.length >= 8 + URO_WORKFLOW_KEYS.length, "the urology catalogue grew by every added note type");

for (const doc of uroDocs) {
  const keys = (doc.fields || []).map((f) => f.key);
  check(new Set(keys).size === keys.length, `${doc.key} declares no duplicate field key`);
}

const surviving = applyNoteSectionPolicy(uroDocs);
for (const doc of surviving) {
  const keys = new Set((doc.fields || []).map((f) => f.key));
  check(keys.has("icd11_diagnoses"), `${doc.key} carries ICD-11 coding after the note-section policy`);
  check(keys.has("uro_safety"), `${doc.key} carries the safety review after the note-section policy`);
  check(keys.has("uro_guidance"), `${doc.key} carries its guideline basis after the note-section policy`);
}
check(surviving.length === uroDocs.length, "no urology note is dropped by the note-section policy");

// ---- 3. Every referenced block, score and exam group exists -----------------
const blockKeys = new Set(Object.keys(URO_BLOCKS));
const scoreKeys = new Set(URO_SCORES.map((s) => s.key));
const examKeys = new Set(URO_EXAM_GROUPS.map((g) => g.key));

for (const doc of uroDocs) {
  for (const field of doc.fields || []) {
    if (field.type === "uro_modules") {
      check(Array.isArray(field.blocks) && field.blocks.length > 0, `${doc.key} block field declares blocks`);
      for (const b of field.blocks || []) check(blockKeys.has(b), `${doc.key} references an existing block: ${b}`);
    }
    if (field.type === "uro_scores") {
      for (const s of field.scores || []) check(scoreKeys.has(s), `${doc.key} references an existing calculation: ${s}`);
    }
    if (field.type === "uro_exam") {
      for (const g of field.groups || []) check(examKeys.has(g), `${doc.key} references an existing examination group: ${g}`);
    }
    if (field.type === "uro_staging") {
      check(Boolean(URO_CANCER_TYPES[field.cancerKey]), `${doc.key} staging panel names a real tumour type: ${field.cancerKey}`);
      check(Array.isArray(field.fields) && field.fields.length > 10, `${doc.key} staging panel carries its documentation fields`);
    }
    if (field.type === "uro_guidance") {
      check(field.noteKey === doc.key, `${doc.key} guideline basis is bound to its own note key`);
      check(guidanceForUroNote(field.noteKey).length > 0, `${doc.key} resolves at least one reference`);
    }
  }
}

for (const [key, block] of Object.entries(URO_BLOCKS)) {
  check(block.title && Array.isArray(block.fields) && block.fields.length > 0, `block ${key} is complete`);
  const fk = blockFields(key).map((f) => f.key);
  check(new Set(fk).size === fk.length, `block ${key} has no duplicate field key`);
  for (const f of blockFields(key)) {
    if (f.type === "select" || f.type === "multi") {
      check(Array.isArray(f.options) && f.options.length > 1, `block ${key} field ${f.key} carries its own options`);
    }
  }
}

// ---- 4. ICD-11: honest catalogue, coverage checklist, safe configuration ----
check(URO_ICD11.length === 3, "the bundled catalogue carries only the three workspace-verified entries");
const KNOWN_CODES = new Set(["GB70.0", "GB60", "GB61"]);
for (const entry of URO_ICD11) {
  check(KNOWN_CODES.has(entry.code), `catalogue code ${entry.code} is one of the workspace-verified entries`);
  check(entry.mapping_state === "review_required", `catalogue entry ${entry.code} is not presented as verified`);
  check(entry.verified_date === "", `catalogue entry ${entry.code} carries no invented verification date`);
  check(!/^[A-Z]\d{2}(\.\d+)?$/.test(entry.code), `catalogue entry ${entry.code} is not an ICD-10 code`);
  check(Boolean(entry.release), `catalogue entry ${entry.code} records its release`);
}
check(!/N40|C61|N20\.0|ICD-10/i.test(JSON.stringify(URO_ICD11)), "no ICD-10 code or crosswalk appears in the urology catalogue");

const REQUIRED_DOMAINS = [
  "kidney_upper_tract", "ureter", "bladder", "prostate", "urethra", "male_genital",
  "female_urology", "paediatric", "neuro_urology", "trauma", "transplant", "postoperative",
];
const groupKeys = URO_CONDITION_GROUPS.map((g) => g.key);
for (const domain of REQUIRED_DOMAINS) check(groupKeys.includes(domain), `coverage checklist includes the ${domain} domain`);
check(URO_CONDITION_COUNT >= 80, `coverage checklist holds at least 80 conditions (has ${URO_CONDITION_COUNT})`);
for (const group of URO_CONDITION_GROUPS) {
  check(group.conditions.length > 0, `group ${group.key} is not empty`);
  for (const c of group.conditions) {
    check(c.key && c.label && c.whoQuery, `condition ${c.key || "?"} has a key, a label and a WHO search query`);
    check(!/^[A-Z]\d{2}/.test(String(c.whoQuery)), `condition ${c.key} carries a search phrase, not a hardcoded code`);
  }
}

const icdField = uroIcdField();
check(icdField.type === "icd11_diagnoses", "the ICD-11 field uses the shared diagnosis field");
check(icdField.requireConfirmation === true, "ICD-11 coding requires clinician confirmation");
check(icdField.unspecifiedJustification === true, "an unspecified code requires a documented justification");
check(icdField.clusterEnabled === true, "postcoordination is available and entered as the WHO tool shows it");
check(Array.isArray(icdField.conditionGroups) && icdField.conditionGroups.length === URO_CONDITION_GROUPS.length, "every note's index covers the whole checklist");
check(URO_ICD_STATUSES.some((s) => /Differential/.test(s)) && URO_ICD_STATUSES.some((s) => /Confirmed/.test(s)), "differential and confirmed are separate statuses");
check(URO_ICD_ROLES.includes("Primary") && URO_ICD_ROLES.includes("Secondary"), "primary and secondary roles are offered");
check(Boolean(URO_ICD11_MMS.release && URO_ICD11_MMS.system_uri), "the MMS release and system URI are recorded");

// ---- 5. Safety prompts: fire on the finding, silent without it -------------
const POSITIVE = {
  obstructed_infected_kidney: { uro_stone_documentation: { stone_obstruction: "Severe", stone_infection: "Yes" } },
  urosepsis: { note: "urosepsis suspected, systolic BP 85" },
  acute_retention: { uro_luts: { post_void_residual: "420" } },
  testicular_torsion: { note: "acute scrotal pain with high-riding testis and nausea" },
  deteriorating_renal_function: { note: "creatinine rose from 90 to 220, AKI" },
  significant_haematuria: { note: "clot retention, large clot evacuated" },
  renal_trauma: { note: "blunt trauma with haematuria and hypotension" },
  priapism: { uro_priapism: { duration_hours: "5" }, note: "priapism" },
  postoperative_deterioration: { note: "post-op day 2 with fever and tachycardia" },
  suspected_malignancy: { note: "solid renal mass on CT" },
  renal_dose_review: { note: "AKI with gentamicin prescribed" },
  antimicrobial_stewardship: { note: "ciprofloxacin started" },
  pregnancy_caution: { note: "pregnant, trimethoprim prescribed" },
  duplicate_therapy: { note: "tamsulosin and silodosin both listed" },
  anticholinergic_retention: { note: "solifenacin for urgency, high residual" },
  retained_stent: { note: "ureteric stent in situ for 7 months" },
  paediatric_dose_caution: { note: "paediatric patient, antibiotic 500 mg" },
};

for (const rule of URO_SAFETY_RULES) {
  const fired = evaluateUroSafety(POSITIVE[rule.key] || {}).map((a) => a.key);
  check(fired.includes(rule.key), `safety rule ${rule.key} fires on its documented finding`);
  check(Boolean(rule.source?.organization), `safety rule ${rule.key} cites a source`);
  // What the clinician actually reads must carry no dose figure and no order.
  const firedText = evaluateUroSafety(POSITIVE[rule.key] || {})
    .map((a) => `${a.title} ${a.detail} ${a.action}`)
    .join(" ");
  // A post-void residual in mL is a measurement, not a dose: only mass/unit
  // dose forms are barred here.
  check(!/\b\d+(\.\d+)?\s?(mg|mcg|µg|microgram|milligram|grams?|units?)\b/i.test(firedText), `safety rule ${rule.key} raises no dose figure`);
  check(
    !/\b(prescribe|administer|start|stop|discontinue|withhold|give)\b\s+(the\s+)?(antibiotic|antibiotics|drug|medication|dose|therapy|agent|tamsulosin|finasteride)/i.test(firedText),
    `safety rule ${rule.key} issues no medication order`,
  );
}
const emptyNote = evaluateUroSafety({});
check(emptyNote.length === 0, "an empty note raises no prompt — silence is not a normal finding");
const negative = evaluateUroSafety({ uro_stone_documentation: { stone_size_mm: "4", stone_obstruction: "None" } });
check(negative.length === 0, "a documented normal finding raises no obstruction prompt");
for (const alert of evaluateUroSafety(POSITIVE.priapism)) {
  check(!/\bmg\b|aspirat(e|ion) should|shunt must/i.test(alert.action), "an alert never dictates a procedure or a dose");
}

// ---- 6. Calculations: uncalculated when incomplete, arithmetic when whole ---
const ipssEmpty = calculateUroScore("ipss", {});
check(ipssEmpty.value === null && ipssEmpty.missing.length > 0, "IPSS is not calculated when items are missing");
const ipssFull = calculateUroScore("ipss", { incomplete: "0", frequency: "0", intermittency: "0", urgency: "0", weak_stream: "0", straining: "0", nocturia: "0" });
check(ipssFull.value === "0/35" && /Mild/.test(ipssFull.band), "IPSS 0 totals 0/35 and reports the mild band");
const ipssSevere = calculateUroScore("ipss", { incomplete: "5", frequency: "5", intermittency: "5", urgency: "5", weak_stream: "5", straining: "5", nocturia: "5" });
check(ipssSevere.value === "35/35" && /Severe/.test(ipssSevere.band), "IPSS 35 reports the severe band");
const density = calculateUroScore("psa_density", { psa: "8", volume: "50" });
check(/0\.160/.test(density.value), "PSA density is PSA ÷ volume");
const densityMissing = calculateUroScore("psa_density", { psa: "8" });
check(densityMissing.value === null, "PSA density is not calculated without a volume");
const egfr = calculateUroScore("egfr", { creatinine: "1", age: "50", sex: "male" });
check(egfr.value && Number.parseInt(egfr.value, 10) >= 85 && Number.parseInt(egfr.value, 10) <= 100, `eGFR CKD-EPI 2021 computes a plausible value (${egfr.value})`);
const egfrChild = calculateUroScore("egfr", { creatinine: "0.5", age: "8", sex: "female" });
check(egfrChild.value === null, "the adult eGFR equation refuses a paediatric age");
const charlson = calculateUroScore("charlson", { items: ["metastatic", "chf"] });
check(charlson.value === "7", "Charlson adds the published weights (6 + 1 = 7)");
const volume = calculateUroScore("prostate_volume", { length: "4", width: "5", height: "4" });
check(volume.value && volume.value.startsWith("41.8"), "prostate volume uses the ellipsoid formula");
const efficiency = calculateUroScore("voiding_efficiency", { voided: "300", residual: "100" });
check(/75%/.test(efficiency.value), "voiding efficiency is voided ÷ total");
const kinetics = calculateUroScore("psa_kinetics", { psa1: "2", date1: "2025-01-01", psa2: "4", date2: "2026-01-01" });
check(/Velocity/.test(kinetics.value) && /Doubling/.test(kinetics.value), "PSA kinetics reports velocity and doubling time");
const kineticsMissing = calculateUroScore("psa_kinetics", { psa1: "2", psa2: "4" });
check(kineticsMissing.value === null, "PSA kinetics is not calculated without both dates");

// ---- 7. Examination states --------------------------------------------------
for (const state of ["Normal", "Abnormal", "Not performed", "Not applicable"]) {
  check(EXAM_STATES.includes(state), `examination state available: ${state}`);
}
check(examStateLabel("") === "Not documented", "an unrecorded examination element reads as not documented, never normal");
check(examStateLabel(undefined) === "Not documented", "an undefined examination state reads as not documented");
check(!EXAM_STATES.includes("Default normal"), "there is no default-normal state");

// ---- 8. Oncology documentation: categories recorded, nothing derived --------
for (const [key, cancer] of Object.entries(URO_CANCER_TYPES)) {
  for (const axis of ["T", "N", "M"]) {
    check(cancer.tnm[axis][0] === "Not documented", `${key} ${axis} list starts at not documented`);
    check(cancer.tnm[axis].length > 1, `${key} ${axis} list carries the published categories`);
  }
  const fields = uroStagingFields(key);
  check(fields.some((f) => f.key === "tnm_edition"), `${key} requires the classification edition to be stated`);
  check(fields.some((f) => f.key === "mdt_decision"), `${key} carries the tumour-board record`);
  check(fields.some((f) => f.key === "surveillance_interval_months"), `${key} carries the surveillance record`);
}
check(!/stage_group|deriveStage|computeRisk/i.test(read("src/lib/uroOncology.js")), "the oncology module derives no stage group or risk score");

// ---- 9. Server catalogue: known types, specialty, confidentiality -----------
for (const key of [...ORIGINAL_URO_KEYS, ...URO_WORKFLOW_KEYS]) {
  check(isKnownDocumentType(key), `server catalogue accepts ${key}`);
  check(getDocumentSpecialty(key) === "urology", `server catalogue resolves ${key} to urology`);
}
for (const key of ["uro_andrology_ed", "uro_andrology_infertility", "uro_andrology_peyronie", "uro_andrology_hypogonadism", "uro_andrology_priapism"]) {
  check(isConfidentialDocumentType(key), `${key} is confidential (sexual and reproductive records)`);
}
check(!isConfidentialDocumentType("uro_consultation"), "an ordinary urology note is not made confidential");

// ---- 10. References: EAU primary, nothing fabricated ------------------------
const eauRefs = Object.values(URO_REFERENCES).filter((r) => r.primary);
check(eauRefs.length >= 10, "the EAU panel set is registered as primary");
check(eauRefs.some((r) => r.key === "eau"), "EAU is registered");
for (const ref of Object.values(URO_REFERENCES)) {
  check(/^https:\/\//.test(ref.source_url || ""), `${ref.key} links to the issuing body over https`);
  check(Boolean(ref.last_verified_date), `${ref.key} records when it was checked`);
  check(ref.jurisdiction === "international", `${ref.key} is an international recommendation, not a local approval`);
  if (ref.status !== "current") {
    check(ref.publication_year === null, `${ref.key} records no publication year it could not confirm`);
    check(Boolean(ref.status_note), `${ref.key} states what remains to be confirmed`);
  }
}
check(URO_REFERENCES.who_icd11.status === "current", "WHO ICD-11 is registered as a current classification");
check(URO_LOCAL_PROTOCOLS.length === 0, "no local protocol is invented");
for (const noteKey of Object.keys(URO_ENHANCEMENTS)) {
  const refs = guidanceForUroNote(noteKey);
  check(refs.some((r) => r.primary), `${noteKey} names an EAU panel as its primary reference`);
}

// ---- 11. Wiring: the Doctor Portal renders and the policy protects --------
for (const type of ["uro_modules", "uro_exam", "uro_staging", "uro_scores", "uro_safety", "uro_guidance"]) {
  check(fieldSource.includes(`f.type === "${type}"`), `DocumentFields dispatches ${type}`);
}
for (const component of ["UroBlockField", "UroExamField", "UroStagingField", "UroScoresField", "UroSafetyPromptsField", "UroGuidanceField"]) {
  check(fieldSource.includes(`import ${component}`), `DocumentFields imports ${component}`);
  check(fs.existsSync(path.join(ROOT, `src/components/doctor/notes/${component}.jsx`)), `${component} exists`);
}
check(/STRUCTURED_EXAM_TYPES = \[[^\]]*"uro_exam"/.test(policySource), "the note-section policy keeps the urology examination panel");
check(/STRUCTURED_RECORD_TYPES = \[[^\]]*"uro_modules"[^\]]*"uro_staging"/.test(policySource), "the note-section policy keeps the urology structured records");
check(SPECIALTY_DOCUMENTS.filter((d) => d.specialty === "urology").length === uroDocs.length, "the urology catalogue is assembled into the portal");

// ---- Result ---------------------------------------------------------------
console.log(`\n${passes} checks passed, ${failures} failed.`);
if (failures) process.exit(1);