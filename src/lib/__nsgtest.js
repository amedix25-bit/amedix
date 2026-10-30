import { getSpecialtyDocs, SPECIALTY_KEYS, SPECIALTY_DOCUMENTS, getSpecialtyLabel } from "@/lib/specialtyDocuments";
import { examinationTypeKeysFor } from "@/lib/examinations/clinicalExaminations";
import { buildNeurosurgerySafetyPrompts, NSG_SAFETY_RULE_COUNT } from "@/lib/neurosurgerySafetyRules";
import { codingInstructionsFor, auditNeurosurgicalDiagnoses, formatNeurosurgeryGuidance } from "@/lib/neurosurgeryCoding";

let pass = 0;
const fails = [];
const ok = (cond, msg) => { if (cond) pass++; else fails.push(msg); };

const docs = getSpecialtyDocs("Neurosurgery");
ok(SPECIALTY_KEYS["Neurosurgery"] === "neurosurgery", "Neurosurgery resolves to its own key");
ok(getSpecialtyLabel("neurosurgery") === "Neurosurgery", "label present");
ok(docs.length === 10, `10 neurosurgery notes (got ${docs.length})`);
ok(docs.every((d) => d.specialty === "neurosurgery"), "all rows are neurosurgery");
ok(examinationTypeKeysFor("neurosurgery").includes("neurological"), "neurological examination offered");

docs.forEach((d) => {
  const keys = d.fields.map((f) => f.key);
  ok(new Set(keys).size === keys.length, `${d.key}: no duplicate field keys`);
  ok(keys.includes("icd11_diagnoses"), `${d.key}: ICD-11 field kept`);
  ok(keys.includes("nsg_guidance"), `${d.key}: guidance field kept`);
  const icd = d.fields.find((f) => f.key === "icd11_diagnoses");
  ok(icd.type === "icd11_diagnoses" && Array.isArray(icd.catalog) && icd.catalog.length === 0, `${d.key}: no invented codes preloaded`);
  ok(d.fields.length >= 18, `${d.key}: substantive (${d.fields.length} fields)`);
  ok(d.fields.every((f) => !/^plan\b/i.test(f.label || "")), `${d.key}: no retired "Plan" label`);
  ok(d.fields.every((f) => !/investigation|escalat|antimicrobial/i.test(f.label || "")), `${d.key}: no retired wording in labels`);
  ok(d.fields.every((f) => !/^imaging\b/i.test(f.label || "") && !/\bimaging$/i.test(f.label || "")), `${d.key}: no retired imaging label`);
  ok((d.guidelineBasis || []).length > 0, `${d.key}: guideline basis recorded`);
});
const gcsDocs = docs.filter((d) => d.fields.some((f) => f.key === "gcs")).map((d) => d.key);
ok(gcsDocs.length === 6, `GCS in the 6 assessment notes (got ${gcsDocs.join(",")})`);
const sections = new Set(docs.flatMap((d) => d.fields.map((f) => f.section)).filter(Boolean));
ok(sections.has("Diagnosis Classification (ICD-11)"), "ICD section kept");
ok([...sections].some((s) => /Coding Guidance/.test(s)), "guidance section kept");
const other = SPECIALTY_DOCUMENTS.filter((d) => d.specialty !== "neurosurgery" && /^nsg_/.test(d.key));
ok(other.length === 0, "no neurosurgery note leaked into another specialty");

ok(NSG_SAFETY_RULE_COUNT === 18, `18 rules (got ${NSG_SAFETY_RULE_COUNT})`);
const lowGcs = buildNeurosurgerySafetyPrompts({ values: { gcs: { eye: "1 — None", verbal: "1 — None", motor: "1 — None" } } });
ok(lowGcs.some((p) => p.key === "airway_icp" && p.level === "immediate"), "GCS 3 triggers airway prompt");
const partial = buildNeurosurgerySafetyPrompts({ values: { gcs: { eye: "1 — None", verbal: "NT — Intubated", motor: "1 — None" } } });
ok(!partial.some((p) => p.key === "airway_icp"), "incomplete GCS never triggers (no silent total)");
const pupils = buildNeurosurgerySafetyPrompts({ values: { pupils: "Fixed and dilated — unilateral" } });
ok(pupils.some((p) => p.key === "pupils"), "pupillary finding triggers");
const ac = buildNeurosurgerySafetyPrompts({ values: { anticoag: "Anticoagulated — not reversed" } });
ok(ac.some((p) => p.key === "anticoagulation"), "unreversed anticoagulant triggers");
const cord = buildNeurosurgerySafetyPrompts({ values: { cord_compression: "Features present" } });
ok(cord.some((p) => p.key === "cord_compression" && p.source?.organization === "AANS/CNS"), "cord compression triggers with source");
const cauda = buildNeurosurgerySafetyPrompts({ concerns: ["cauda_equina"] });
ok(cauda.some((p) => p.key === "cauda_equina" && p.source?.organization === "NICE"), "concern selection triggers");
const clean = buildNeurosurgerySafetyPrompts({ values: { pupils: "Symmetrical and reactive", anticoag: "None", cranial_ct: "No acute intracranial abnormality" } });
ok(clean.length === 0, "reassuring findings raise no prompt");
ok(buildNeurosurgerySafetyPrompts({}).length === 0, "empty note raises no prompt");
ok(buildNeurosurgerySafetyPrompts({ values: { icp: "Monitored — no target documented" } }).some((p) => p.key === "icp_target"), "ICP without target prompts");
ok(buildNeurosurgerySafetyPrompts({ values: { shunt_status: "Suspected malfunction" } }).some((p) => p.key === "shunt"), "shunt malfunction prompts");

ok(codingInstructionsFor("nsg_neurotrauma").length >= 4, "TBI coding instructions recorded");
ok(codingInstructionsFor("unknown_note").length === 0, "no instructions for unknown note");
const audit = auditNeurosurgicalDiagnoses([
  { code: "X", display: "Confirmed thing", status: "Confirmed", mapping_state: "verified" },
  { code: "", display: "No basis", status: "Confirmed", mapping_state: "unresolved" },
  { code: "Y", display: "Typed", status: "Suspected", mapping_state: "review_required" },
]);
ok(audit.some((a) => /without a documented clinical basis/.test(a.message)), "confirmed without basis flagged");
ok(audit.some((a) => /not yet checked/.test(a.message)), "review-required flagged");

const saved = formatNeurosurgeryGuidance({
  concerns: ["raised_icp"],
  coding: codingInstructionsFor("nsg_consultation"),
  resolved: [{ key: "airway_icp", level: "immediate", title: "GCS low", evidence: ["GCS 7"], source: { organization: "NICE", version: "NG232" } }],
  actions: { airway_icp: "Anaesthetist informed, intubated at 14:20" },
});
ok(/Coding guidance shown/.test(saved) && /GCS low/.test(saved) && /Anaesthetist informed/.test(saved), "saved text carries coding + prompts + action");
ok(/advisory/.test(saved), "saved text states it is advisory");

console.log(fails.length ? `FAILURES (${fails.length}):\n- ${fails.join("\n- ")}` : "all checks ok");
console.log(`${pass} passed, ${fails.length} failed`);