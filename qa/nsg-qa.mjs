// Temporary QA harness for the neurosurgery documentation build.
// Run: npx esbuild qa/nsg-qa.mjs --bundle --platform=node --format=esm --outfile=/tmp/qa.mjs --alias:@=./src && node /tmp/qa.mjs
import { SPECIALTY_DOCUMENTS } from "@/lib/specialtyDocuments";
import { NEUROSURGERY_DOCS } from "@/lib/neurosurgeryDocuments";
import { NSG_EMERGENCY_PRESENTATIONS, emergencySections, formatEmergencyPathway, emergencyFlags } from "@/lib/neurosurgeryEmergency";
import { NSG_PROCEDURE_TYPES, operativeSections, formatOperativeRecord, operativeFlags } from "@/lib/neurosurgeryOperative";
import { postopSections, formatPostopMonitoring, postopFlags } from "@/lib/neurosurgeryPostop";
import { buildNeurosurgerySafetyPrompts, NSG_SAFETY_RULE_COUNT } from "@/lib/neurosurgerySafetyRules";
import { formatNeurosurgicalExam } from "@/lib/neurosurgeryExam";
import { computeIsncsci, formatIsncsci } from "@/lib/neurosurgeryIsncsci";
import { NSG_SCORES, calculateScore, indicatedScores, formatNeurosurgeryScores } from "@/lib/neurosurgeryScores";
import { formatFieldValue } from "@/lib/clinicalFieldValue";

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const walk = (doc) => {
  const out = [];
  (doc.fields || []).forEach((f) => {
    if (f && Array.isArray(f.fields)) f.fields.forEach((x) => out.push({ ...x, section: f.title || f.section }));
    else if (f) out.push(f);
  });
  return out;
};

/* 1 — Section policy keeps every structured module */
const live = new Map(SPECIALTY_DOCUMENTS.filter((d) => d.specialty === "neurosurgery").map((d) => [d.key, d]));
const EXPECTED_KEYS = ["nsg_consultation","nsg_spine","nsg_neurotrauma","nsg_cerebrovascular","nsg_hydrocephalus","nsg_neuro_oncology","nsg_cranial_operative","nsg_spinal_operative","nsg_postop_progress","nsg_discharge","nsg_aneurysm_avm","nsg_spinal_cord","nsg_spinal_tumour","nsg_functional","nsg_peripheral_nerve","nsg_paediatric","nsg_icp","nsg_emergency_cranial","nsg_emergency_spine"];
ok(NEUROSURGERY_DOCS.length === EXPECTED_KEYS.length, `note count ${NEUROSURGERY_DOCS.length}`);
EXPECTED_KEYS.forEach((k) => ok(live.has(k), `note missing after policy: ${k}`));

const STRUCTURED = ["nsg_exam", "nsg_isncsci", "nsg_emergency", "nsg_operative", "nsg_postop", "nsg_guidance", "nsg_icd11", "nsg_scores"];
NEUROSURGERY_DOCS.forEach((raw) => {
  const rawKeys = new Set(walk(raw).map((f) => f.key));
  const liveKeys = new Set(walk(live.get(raw.key) || {}).map((f) => f.key));
  STRUCTURED.forEach((k) => {
    if (rawKeys.has(k)) ok(liveKeys.has(k), `${raw.key}: policy removed structured module ${k}`);
  });
});

/* 2 — Note structure: labels, unique keys, dropdowns */
NEUROSURGERY_DOCS.forEach((raw) => {
  const fields = walk(live.get(raw.key) || raw);
  const seen = new Set();
  fields.forEach((f) => {
    if (!f.key) return;
    ok(!seen.has(f.key), `${raw.key}: duplicate field key ${f.key}`);
    seen.add(f.key);
    ok(!!String(f.label || "").trim(), `${raw.key}: field ${f.key} has no label`);
    if (f.type === "select") ok(Array.isArray(f.options) && f.options.length >= 2, `${raw.key}: select ${f.key} has ${f.options ? f.options.length : 0} options`);
  });
  ok(seen.has("nsg_guidance"), `${raw.key}: no guideline guidance block`);
  ok([...seen].some((k) => /icd11/.test(k)), `${raw.key}: no ICD-11 block`);
  ok(seen.has("nsg_exam") || seen.has("nsg_operative"), `${raw.key}: no examination or operation record`);
});

/* 3 — Emergency pathways */
ok(NSG_EMERGENCY_PRESENTATIONS.length >= 6, `emergency presentations: ${NSG_EMERGENCY_PRESENTATIONS.length}`);
NSG_EMERGENCY_PRESENTATIONS.forEach((p, i) => {
  const key = typeof p === "string" ? p : p.key;
  const s = emergencySections(key);
  ok(s.length >= 6, `pathway ${key}: only ${s.length} sections`);
  s.forEach((sec) => ok(String(sec.title || "").trim(), `pathway ${key}: untitled section`));
});
const emSample = { presentation: "Traumatic brain injury", presentation_detail: "Fall, GCS 9", herniation: "Uncal herniation suspected", airway: "", scan_timing: "", discussion_with: "", transfer_status: "", responsible_clinician: "" };
const emText = formatEmergencyPathway(emSample);
ok(emText.includes("Traumatic brain injury") && emText.split("\n").length >= 6, "emergency format incomplete");
const emFlags = emergencyFlags(emSample);
ok(
  emFlags.documented && emFlags.herniation && emFlags.no_airway && emFlags.no_scan &&
  emFlags.no_discussion && emFlags.no_transfer_decision && emFlags.no_responsible,
  `emergency flags: ${JSON.stringify(emFlags)}`
);
ok(!emergencyFlags({ presentation: "TBI", airway: "Patent", scan_timing: "Immediate", discussion_with: "Neurosurgery", transfer_status: "Accepted", responsible_clinician: "Dr A" }).no_responsible, "documented emergency flagged as missing the responsible clinician");

/* 4 — Operation record */
ok(NSG_PROCEDURE_TYPES.length >= 9, `procedure types: ${NSG_PROCEDURE_TYPES.length}`);
ok(operativeSections("full").length >= 7, `operative sections: ${operativeSections("full").length}`);
NSG_PROCEDURE_TYPES.forEach((p) => {
  const key = typeof p === "string" ? p : p.key;
  ok(operativeSections("procedure", key).length >= 2, `procedure ${key}: too few blocks`);
});
const opSample = { procedure: "Decompressive craniectomy", diagnosis: "Acute subdural haematoma", consent: "Documented, patient intubated with next of kin consent by phone", counts: "Confirmed correct", postop_neuro: "Pupils equal, GCS 7 at end of procedure" };
const opText = formatOperativeRecord(opSample);
ok(opText.includes("Decompressive craniectomy"), "operative format lost the procedure");
const opBad = operativeFlags({ ...opSample, implants: "Yes — cranioplasty plate", implant_traceability: "", consent: "", drain: "Subdural drain", drain_detail: "", postop_neuro: "", counts: "Incorrect" });
ok(
  opBad.implant_untraceable && opBad.consent_missing && opBad.counts_not_confirmed &&
  opBad.drain_without_detail && opBad.no_postop_neuro,
  `operative flags: ${JSON.stringify(opBad)}`
);
ok(!operativeFlags(opSample).consent_missing, "documented consent flagged as missing");
const legacyOp = operativeFlags({ implants: "Yes — not documented", consent: "Not documented" });
ok(legacyOp.implant_untraceable && legacyOp.consent_missing, "legacy flat operation values not read by the rules");

/* 5 — Postoperative monitoring */
ok(postopSections("monitoring").length === 2, `monitoring sections: ${postopSections("monitoring").length}`);
ok(postopSections("full").length >= 4, `postop sections: ${postopSections("full").length}`);
ok(/not documented/i.test(formatPostopMonitoring({})), "postop format on an empty record");
ok(/not documented/i.test(formatPostopMonitoring(undefined)), "postop format on an undefined record");
const poDoc = postopFlags({ obs_frequency: "Hourly neuro obs", gcs_trend: "Stable", responsible_clinician: "Dr A", criteria_met: [] });
ok(poDoc.documented && !poDoc.no_observation_interval && !poDoc.no_responsible, `documented postop flagged: ${JSON.stringify(poDoc)}`);
const poBad = postopFlags({ gcs_trend: "Deteriorating", pupil_trend: "Asymmetrical", csf: "Suspected CSF leak", bleeding: "Suspected", infection: "Meningism", drain_function: "Blocked", seizure: "First seizure", criteria_met: ["ICP > 20"], responsible_clinician: "" });
ok(
  poBad.documented && poBad.no_observation_interval && poBad.deterioration && poBad.pupil_change &&
  poBad.csf_leak && poBad.bleeding && poBad.infection && poBad.drain_problem && poBad.seizure &&
  poBad.no_responsible && poBad.criteria.length === 1,
  `postop flags: ${JSON.stringify(poBad)}`
);

/* 6 — Safety rules */
ok(NSG_SAFETY_RULE_COUNT >= 24, `rule count ${NSG_SAFETY_RULE_COUNT}`);
const promptKeys = (values) => buildNeurosurgerySafetyPrompts({ values }).map((p) => p.key);
[
  ["herniation", "herniation", { nsg_emergency: { presentation: "TBI", herniation: "Uncal herniation suspected" } }],
  ["scan not recorded", "emergency_scan_not_recorded", { nsg_emergency: { presentation: "TBI", scan_timing: "" } }],
  ["specialist discussion", "no_specialist_discussion", { nsg_emergency: { presentation: "TBI", discussion_with: "" } }],
  ["transfer decision", "transfer_decision_missing", { nsg_emergency: { presentation: "TBI", transfer_status: "" } }],
  ["consent", "consent_not_recorded", { nsg_operative: { procedure: "Craniectomy", consent: "" } }],
  ["implant traceability", "implant_traceability", { nsg_operative: { procedure: "Craniectomy", implants: "Yes — plate", implant_traceability: "" } }],
  ["observation interval", "postop_observation_interval", { nsg_postop: { gcs_trend: "Stable" } }],
  ["threshold action", "postop_threshold_without_action", { nsg_postop: { obs_frequency: "Hourly", criteria_met: ["ICP > 20"], action_taken: "" } }],
  ["responsible clinician", "no_responsible_clinician", { nsg_postop: { obs_frequency: "Hourly", responsible_clinician: "" } }],
].forEach(([label, key, values]) => {
  const keys = promptKeys(values);
  ok(keys.includes(key), `no advisory prompt ${key} for ${label} (raised: ${keys.join(", ") || "none"})`);
});
// Legacy notes: the same values at the top level must still raise the prompt.
ok(promptKeys({ presentation: "TBI", herniation: "Uncal herniation suspected" }).includes("herniation"), "legacy flat emergency values not read by the rules");
ok(promptKeys({ consent: "Not documented", procedure: "Craniectomy" }).includes("consent_not_recorded"), "legacy flat operation values not read by the rules (rules)");
// A fully documented note must stay silent.
[
  "herniation", "emergency_scan_not_recorded", "no_specialist_discussion", "transfer_decision_missing",
  "consent_not_recorded", "implant_traceability", "postop_observation_interval",
  "postop_threshold_without_action", "no_responsible_clinician",
].forEach((key) => {
  ok(!promptKeys({
    nsg_emergency: { presentation: "TBI", airway: "Patent", scan_timing: "Immediate", discussion_with: "Neurosurgery", transfer_status: "Accepted", responsible_clinician: "Dr A" },
    nsg_operative: { procedure: "Craniectomy", consent: "Documented", counts: "Confirmed correct", postop_neuro: "Pupils equal" },
    nsg_postop: { obs_frequency: "Hourly", gcs_trend: "Stable", responsible_clinician: "Dr A", criteria_met: [], action_taken: "Continued observation" },
  }).includes(key), `fully documented note still raised ${key}`);
});
ok(Array.isArray(buildNeurosurgerySafetyPrompts({ values: {} })), "rules failed on an empty note");

/* 7 — Formatters and scores on empty and filled values */
const safe = (fn, label) => { try { fn(); } catch (e) { fails.push(`${label}: ${e.message}`); } };
safe(() => formatNeurosurgicalExam({}), "exam format empty");
safe(() => formatNeurosurgicalExam({ consciousness: "Alert", pupils: "Equal and reactive", power_upper: "5/5" }), "exam format filled");
safe(() => formatIsncsci({}), "ISNCSCI format empty");
safe(() => formatNeurosurgeryScores({}), "score format empty");
safe(() => formatEmergencyPathway({}), "emergency format empty");
safe(() => formatOperativeRecord({}), "operation format empty");
safe(() => formatPostopMonitoring(undefined), "postop format undefined");
safe(() => formatFieldValue("nsg_exam", {}), "field value: structured exam");
safe(() => formatFieldValue("nsg_isncsci", {}), "field value: ISNCSCI");
safe(() => formatFieldValue("nsg_emergency", {}), "field value: emergency pathway");
safe(() => formatFieldValue("nsg_operative", {}), "field value: operation record");
safe(() => formatFieldValue("nsg_postop", {}), "field value: postop monitoring");
ok(!!computeIsncsci({ sacral_pinp: "Absent", sacral_light_touch: "Absent", sacral_motor: "Absent" }), "ISNCSCI returned nothing");
ok(NSG_SCORES.length >= 7, `score count ${NSG_SCORES.length}`);
NSG_SCORES.forEach((s) => ok(calculateScore(s.key, {}) !== undefined, `score ${s.key} returned undefined`));
ok(Array.isArray(indicatedScores({})), "indicatedScores not an array");

console.log(`notes=${NEUROSURGERY_DOCS.length} rules=${NSG_SAFETY_RULE_COUNT} scores=${NSG_SCORES.length} emergencyPresentations=${NSG_EMERGENCY_PRESENTATIONS.length} procedures=${NSG_PROCEDURE_TYPES.length}`);
if (fails.length) {
  console.log(`FAILURES (${fails.length}):`);
  fails.forEach((f) => console.log(" - " + f));
  process.exit(1);
}
console.log("ALL CHECKS PASSED");