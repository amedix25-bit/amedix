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
const emSample = { presentation: "Herniation", stability: "Deteriorating", airway: "Not assessed", gcs_trend: "Falling GCS", herniation: "Signs present", imaging: "Not available", actions: "Mannitol given", discuss: "Not discussed", transfer: "Declined", responsible: "" };
const emText = formatEmergencyPathway(emSample);
ok(emText.includes("Herniation") && emText.split("\n").length >= 6, "emergency format incomplete");
const emFlags = emergencyFlags(emSample);
ok(emFlags.herniation && emFlags.noAirway && emFlags.fallingGcs && emFlags.noImaging && emFlags.notDiscussed, `emergency flags: ${JSON.stringify(emFlags)}`);

/* 4 — Operation record */
ok(NSG_PROCEDURE_TYPES.length >= 9, `procedure types: ${NSG_PROCEDURE_TYPES.length}`);
ok(operativeSections("full").length >= 10, `operative sections: ${operativeSections("full").length}`);
NSG_PROCEDURE_TYPES.forEach((p) => {
  const key = typeof p === "string" ? p : p.key;
  ok(operativeSections("procedure", key).length >= 2, `procedure ${key}: too few blocks`);
});
const opSample = { procedure: "Decompressive craniectomy", diagnosis: "Acute subdural haematoma", indication: "Falling GCS", consent: "Documented", team: "Consultant + registrar", anaesthesia: "General", positioning: "Supine, head turned", approach: "Trauma flap", steps: "Flap, haematoma evacuation", anatomy: "Cortical surface intact", implants: "Yes — not documented", specimens: "Not documented", blood_loss: "450 ml", drains: "Subdural drain, no output recorded", complications: "None", closure: "Layered", destination: "ICU", postop: "CT at 6 hours" };
const opText = formatOperativeRecord(opSample);
ok(opText.includes("Decompressive craniectomy"), "operative format lost the procedure");
const opFlags = operativeFlags(opSample);
ok(opFlags.untraceableImplant && !opFlags.consentMissing, `operative flags: ${JSON.stringify(opFlags)}`);
ok(operativeFlags({ ...opSample, consent: "" }).consentMissing === true, "missing consent not detected");
const legacyOp = operativeFlags({ implants: "Yes — not documented", consent: "Not documented" });
ok(legacyOp.untraceableImplant && legacyOp.consentMissing, "legacy flat operation values not read by the rules");

/* 5 — Postoperative monitoring */
ok(postopSections("monitoring").length === 2, `monitoring sections: ${postopSections("monitoring").length}`);
ok(postopSections("full").length >= 4, `postop sections: ${postopSections("full").length}`);
ok(formatPostopMonitoring({}).split("\n").length >= 4, "postop format on an empty record");
const poFlags = postopFlags({ interval: "", threshold: "ICP > 20", thresholdAction: "", responsible: "" });
ok(poFlags.noInterval && poFlags.thresholdNoAction && poFlags.noResponsible, `postop flags: ${JSON.stringify(poFlags)}`);

/* 6 — Safety rules */
ok(NSG_SAFETY_RULE_COUNT >= 24, `rule count ${NSG_SAFETY_RULE_COUNT}`);
[
  ["herniation", { nsg_emergency: { herniation: "Signs present" } }],
  ["airway", { nsg_emergency: { airway: "Not assessed" } }],
  ["specialist discussion", { nsg_emergency: { discuss: "Not discussed" } }],
  ["transfer", { nsg_emergency: { transfer: "Declined" } }],
  ["consent", { nsg_operative: { consent: "Not documented" } }],
  ["implant traceability", { nsg_operative: { implants: "Yes — not documented" } }],
  ["observation interval", { nsg_postop: { interval: "" } }],
  ["threshold action", { nsg_postop: { threshold: "ICP > 20", thresholdAction: "" } }],
  ["responsible clinician", { nsg_postop: { responsible: "" } }],
].forEach(([label, values]) => {
  ok(buildNeurosurgerySafetyPrompts({ values }).length > 0, `no advisory prompt raised for ${label}`);
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