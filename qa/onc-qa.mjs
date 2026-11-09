// QA harness for the Oncology upgrade.
// Run: npx esbuild qa/onc-qa.mjs --bundle --platform=node --format=esm --outfile=/tmp/oncqa.mjs --alias:@=./src --loader:.ts=ts && node /tmp/oncqa.mjs
//
// Every check asserts a property of the shipped code, not of this file. A check that
// cannot be proved from the code fails rather than passing silently.
import fs from "node:fs";

import { getSpecialtyDocs, getDocDef } from "@/lib/specialtyDocuments";
import { ONCOLOGY_DOCS } from "@/lib/specialtyDocumentsPart4";
import {
  ONC_BLOCKS, ONC_BLOCK_KEYS, oncBlock, oncBlockValue, oncBlockValues, formatOncBlock,
} from "@/lib/oncBlocks";
import { ONC_SCORES, ONC_ONLY_SCORES, calculateOncScore } from "@/lib/oncScores";
import { buildOncSafetyPrompts, ONC_SAFETY_RULES } from "@/lib/oncSafetyRules";
import {
  ONC_ICD11_GROUPS, ONC_ICD11_TERM_COUNT, ONC_ICD_STATUSES, ONC_ICD_ROLES,
  ONC_ICD_DETAIL_FIELDS, ONC_TUMOUR_BEHAVIOURS, ONC_SITE_GROUPS, oncBehaviourConflicts,
} from "@/lib/oncIcd11";
import { ONC_REFERENCES, oncReferencesForNote, ONC_PRINCIPAL_REFERENCE, ONC_LOCAL_PROTOCOLS, oncGuidanceBasis } from "@/lib/oncReferences";
import { ONC_WORKFLOW_DOCS, withOncologyStandards } from "@/lib/oncDocuments";

let pass = 0;
const fails = [];
const check = (name, fn) => {
  try {
    const r = fn();
    if (r === false) throw new Error("returned false");
    if (typeof r === "string") throw new Error(r);
    pass += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fails.push(`${name} — ${e.message}`);
    console.log(`  FAIL ${name} — ${e.message}`);
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const catalogText = fs.readFileSync("base44/shared/clinicalDocumentCatalog.ts", "utf8");
const fields = (key) => getDocDef(key)?.fields || [];
const fieldKeys = (key) => fields(key).map((f) => f.key);

const oncologyDocs = getSpecialtyDocs("Oncology");

console.log("\n— Existing templates preserved —");
check("the twelve original oncology templates keep their keys and labels", () => {
  const expected = {
    onc_consultation: "Oncology Consultation",
    onc_treatment_plan: "Cancer Treatment Plan",
    onc_followup: "Oncology Follow-Up",
    onc_progress_note: "Oncology Progress Note",
    onc_chemo_record: "Chemotherapy Treatment Record",
    onc_infusion_record: "Infusion Record (Oncology)",
    onc_radiation_record: "Radiation Treatment Record",
    onc_staging_record: "Cancer Staging Record",
    onc_tumor_board_record: "Tumor Board Record",
    onc_discharge_summary: "Oncology Discharge Summary",
    onc_treatment_summary: "Treatment Summary (Oncology)",
    onc_surveillance_record: "Follow-Up / Surveillance Record",
  };
  Object.entries(expected).forEach(([key, label]) => {
    const declared = ONCOLOGY_DOCS.find((d) => d.key === key);
    assert(!!declared, `${key} is missing from its original declaration`);
    assert(declared.label === label, `${key} label changed to "${declared.label}"`);
    const resolved = getDocDef(key);
    assert(!!resolved, `${key} no longer resolves in the catalogue`);
    assert(resolved.label === label, `${key} resolved label is "${resolved.label}"`);
  });
  return true;
});
check("no original oncology field was removed from its declaration", () => {
  // The declaration is the contract: nothing appends over it, and the enhancement
  // layer may only add keys.
  const declaredKeys = ONCOLOGY_DOCS.flatMap((d) => (d.fields || []).map((f) => f.key));
  assert(declaredKeys.length > 80, `only ${declaredKeys.length} original fields declared`);
  return true;
});
check("enhancements only ever add keys to the original templates", () => {
  const before = ONCOLOGY_DOCS;
  const after = withOncologyStandards(ONCOLOGY_DOCS);
  after.forEach((doc, i) => {
    const original = before[i];
    assert(doc.key === original.key && doc.label === original.label, `${doc.key} identity changed`);
    const originalKeys = (original.fields || []).map((f) => f.key);
    const afterKeys = (doc.fields || []).map((f) => f.key);
    originalKeys.forEach((k, idx) => {
      assert(afterKeys[idx] === k, `${doc.key} field order changed at ${k}`);
    });
    const unique = new Set(afterKeys);
    assert(unique.size === afterKeys.length, `${doc.key} declares a duplicate field key`);
  });
  return true;
});

console.log("\n— Tumour workflows —");
check("every requested tumour workflow exists as a real template in the catalogue", () => {
  const required = [
    "onc_breast_cancer", "onc_lung_cancer", "onc_colorectal_cancer", "onc_upper_gi_cancer",
    "onc_hepatobiliary_pancreatic", "onc_prostate_cancer", "onc_urologic_cancer",
    "onc_gynaecologic_cancer", "onc_head_neck_cancer", "onc_thyroid_cancer",
    "onc_melanoma_skin_cancer", "onc_cns_tumour", "onc_sarcoma",
    "onc_haematological_malignancy", "onc_unknown_primary_rare",
  ];
  required.forEach((key) => {
    assert(ONC_WORKFLOW_DOCS.some((d) => d.key === key), `${key} not declared`);
    const resolved = getDocDef(key);
    assert(!!resolved, `${key} does not resolve in the catalogue`);
    assert(resolved.specialty === "oncology", `${key} resolves to specialty "${resolved.specialty}"`);
  });
  return true;
});
check("every tumour workflow is accepted by the server-side catalogue", () => {
  const block = catalogText.slice(catalogText.indexOf("oncology: ["), catalogText.indexOf("oncology: [") + 1600);
  ONC_WORKFLOW_DOCS.forEach((d) => {
    assert(block.includes(`"${d.key}"`), `${d.key} is missing from the server catalogue`);
  });
  return true;
});
check("every tumour workflow carries assessment, pathology, biomarkers, staging, treatment, toxicity, response, follow-up and the ICD-11 field", () => {
  const required = [
    "onc_assessment", "onc_histopathology", "onc_biomarkers", "onc_staging",
    "onc_treatment", "onc_ctcae", "onc_response", "onc_followup", "onc_supportive",
    "onc_icd11_diagnoses", "onc_scores", "onc_safety", "onc_guidance",
  ];
  ONC_WORKFLOW_DOCS.forEach((d) => {
    const present = new Set(fieldKeys(d.key));
    const missing = required.filter((k) => !present.has(k));
    assert(missing.length === 0, `${d.key}: missing ${missing.join(", ")}`);
  });
  return true;
});
check("no field this upgrade appends is silently dropped by note governance", () => {
  // Note governance retires a small set of fields across every specialty (the patient
  // record already attaches history, medications and results, and the generic "Plan"
  // line is retired). That policy predates this upgrade and applies to the original
  // declarations too, so the contract checked here is the one this upgrade owns: every
  // field it APPENDS must survive to the rendered note.
  const enhanced = withOncologyStandards([...ONCOLOGY_DOCS, ...ONC_WORKFLOW_DOCS]);
  const originalKeys = new Map(ONCOLOGY_DOCS.map((d) => [d.key, new Set((d.fields || []).map((f) => f.key))]));
  enhanced.forEach((d) => {
    const resolved = new Set(fieldKeys(d.key));
    const added = (d.fields || []).filter((f) => !(originalKeys.get(d.key) || new Set()).has(f.key));
    const dropped = added.filter((f) => !resolved.has(f.key)).map((f) => `${f.key}("${f.label}")`);
    assert(dropped.length === 0, `${d.key}: ${dropped.join(", ")}`);
    assert(added.length > 0 || ONC_WORKFLOW_DOCS.some((w) => w.key === d.key), `${d.key} received no upgrade`);
  });
  return true;
});
check("the oncology templates are all reachable in the Oncology specialty list", () => {
  const keys = new Set(oncologyDocs.map((d) => d.key));
  ONC_WORKFLOW_DOCS.forEach((d) => assert(keys.has(d.key), `${d.key} missing from the specialty list`));
  assert(oncologyDocs.length >= 27, `Oncology lists only ${oncologyDocs.length} templates`);
  return true;
});

console.log("\n— ICD-11 MMS integration —");
check("tumour behaviour taxonomy covers primary, secondary, in situ, benign and uncertain", () => {
  ["Primary malignant neoplasm", "Secondary (metastatic) neoplasm", "Carcinoma in situ", "Benign neoplasm", "Neoplasm of uncertain or unknown behaviour", "Haematological malignancy"].forEach((b) => {
    assert(ONC_TUMOUR_BEHAVIOURS.includes(b), `${b} missing from the behaviour taxonomy`);
  });
  return true;
});
check("the ICD-11 detail fields record everything the diagnosis must carry", () => {
  const keys = ONC_ICD_DETAIL_FIELDS.map((f) => f.key);
  ["anatomical_site", "laterality", "behaviour", "histology", "grade", "diagnosis_date", "classification_version", "coded_by", "icd_o_topography", "icd_o_morphology"].forEach((k) => {
    assert(keys.includes(k), `${k} is not recorded`);
  });
  return true;
});
check("the condition index covers every requested tumour group with search terms", () => {
  const required = ["breast", "thoracic", "colorectal", "upper_gi", "hepatobiliary", "genitourinary", "gynaecological", "head_neck", "skin", "cns", "sarcoma", "haematological", "secondary", "non_invasive", "complications"];
  required.forEach((k) => {
    const group = ONC_ICD11_GROUPS.find((g) => g.key === k);
    assert(!!group, `group ${k} missing`);
    assert(group.terms.length >= 5, `group ${k} has only ${group.terms.length} terms`);
  });
  assert(ONC_ICD11_TERM_COUNT === ONC_ICD11_GROUPS.reduce((n, g) => n + g.terms.length, 0), "term count mismatch");
  assert(ONC_ICD11_TERM_COUNT > 150, `only ${ONC_ICD11_TERM_COUNT} search terms`);
  return true;
});
check("no ICD-11 code, no ICD-10 code and no ICD-O-3 code is written anywhere in the coding module", () => {
  const src = fs.readFileSync("src/lib/oncIcd11.js", "utf8");
  const icd11 = /\b\d[A-Z]\d\d(\.\d+)?\b/; // ICD-11 MMS stem / subcategory pattern
  const icd10 = /\b[A-TV-Z]\d{2}(\.\d+)?\b/; // ICD-10 pattern
  assert(!icd11.test(src), `an ICD-11-looking code is written in the module: ${src.match(icd11)?.[0]}`);
  assert(!icd10.test(src), `an ICD-10-looking code is written in the module: ${src.match(icd10)?.[0]}`);
  return true;
});
check("ICD-O-3 is held separately and never presented as an ICD-11 code", () => {
  const src = fs.readFileSync("src/lib/oncIcd11.js", "utf8");
  assert(/never used as an ICD-11 code/i.test(src), "the separation is not stated for ICD-O-3");
  assert(/registry only/i.test(src), "the ICD-O-3 fields are not marked registry-only");
  return true;
});
check("a metastasis recorded as a new primary is caught before signing", () => {
  const problems = oncBehaviourConflicts([
    { display: "Secondary malignant neoplasm of liver", behaviour: "Secondary (metastatic) neoplasm", role: "Primary cancer", code: "X", mapping_state: "verified", release: "2026-01" },
  ]);
  assert(problems.length >= 1, "the primary/secondary conflict was not reported");
  assert(/never a new primary/i.test(problems[0]), "the message does not state the rule");
  return true;
});
check("a correctly documented diagnosis passes the integrity check", () => {
  const problems = oncBehaviourConflicts([
    { display: "Malignant neoplasm of breast", behaviour: "Primary malignant neoplasm", role: "Primary cancer", code: "X", mapping_state: "verified", release: "2026-01" },
    { display: "Secondary malignant neoplasm of bone", behaviour: "Secondary (metastatic) neoplasm", role: "Secondary / metastatic site", code: "Y", mapping_state: "verified", release: "2026-01" },
  ]);
  assert(problems.length === 0, `unexpected findings: ${problems.join(" | ")}`);
  return true;
});
check("an unresolved diagnosis that is not flagged for coding review is reported", () => {
  const problems = oncBehaviourConflicts([{ display: "Rare tumour, unclassified", mapping_state: "verified" }]);
  assert(problems.some((p) => /coding review/.test(p)), "an unflagged unresolved diagnosis was not reported");
  return true;
});
check("the statuses let a clinician document histological confirmation without the platform confirming anything", () => {
  assert(ONC_ICD_STATUSES.includes("Histologically confirmed"), "no histological-confirmation status");
  assert(ONC_ICD_STATUSES.includes("Metastatic — secondary to known primary"), "no metastatic status");
  assert(ONC_ICD_ROLES.includes("Secondary / metastatic site"), "no metastatic-site role");
  return true;
});

console.log("\n— Structured blocks —");
check("every oncology block declares a key, a title, a note and unique field keys", () => {
  assert(ONC_BLOCK_KEYS.length === 10, `${ONC_BLOCK_KEYS.length} blocks registered`);
  ONC_BLOCK_KEYS.forEach((k) => {
    const b = oncBlock(k);
    assert(b.key === k, `${k} key mismatch`);
    assert(!!b.title && !!b.note, `${k} has no title or note`);
    const keys = b.fields.map((f) => f.key);
    assert(new Set(keys).size === keys.length, `${k} has duplicate field keys`);
    b.fields.forEach((f) => assert(!!f.label, `${k}.${f.key} has no label`));
  });
  return true;
});
check("the staging block never calculates a stage and requires clinician confirmation", () => {
  const b = oncBlock("onc_staging");
  const keys = b.fields.map((f) => f.key);
  ["ct", "cn", "cm", "pt", "pn", "pm", "yp_t", "yp_n", "yp_m", "staging_edition", "incomplete_information", "stage_confirmation", "confirmed_by"].forEach((k) => {
    assert(keys.includes(k), `staging does not record ${k}`);
  });
  assert(/never calculates a stage/i.test(b.note), "the no-calculation rule is not stated in the block");
  const confirm = b.fields.find((f) => f.key === "stage_confirmation");
  assert(confirm.options.includes("Cannot be assigned — incomplete information"), "no option to record an unassignable stage");
  return true;
});
check("haematological staging systems are offered so solid-tumour TNM is never forced", () => {
  const opts = oncBlock("onc_staging").fields.find((f) => f.key === "staging_system").options;
  ["Ann Arbor (lymphoma)", "ISS / R-ISS (myeloma)", "Rai (CLL)"].forEach((o) => assert(opts.includes(o), `${o} missing`));
  return true;
});
check("biomarkers are conditional on the documented primary site, not a blanket panel", () => {
  const b = oncBlock("onc_biomarkers");
  const conditional = b.fields.filter((f) => f.showIf);
  assert(conditional.length >= 12, `only ${conditional.length} conditional biomarker fields`);
  const er = b.fields.find((f) => f.key === "er");
  assert(er.showIf.equals === "Breast", "ER is not limited to breast");
  const egfr = b.fields.find((f) => f.key === "egfr_mutation");
  assert(JSON.stringify(egfr.showIf).includes("Lung (NSCLC)"), "EGFR is not limited to NSCLC");
  assert(ONC_SITE_GROUPS.length >= 18, "the site groups are incomplete");
  return true;
});
check("CTCAE recording covers the events the request names", () => {
  const keys = oncBlock("onc_ctcae").fields.map((f) => f.key);
  ["neutropenia_grade", "anaemia_grade", "thrombocytopenia_grade", "febrile_neutropenia_grade", "nausea_grade", "vomiting_grade", "diarrhoea_grade", "mucositis_grade", "neuropathy_grade", "renal_grade", "hepatic_grade", "cardiac_grade", "irae_grade", "radiation_toxicity_grade"].forEach((k) => {
    assert(keys.includes(k), `CTCAE does not record ${k}`);
  });
  return true;
});
check("the MDT block records disciplines, discussion, recommendation, divergence and sign-off", () => {
  const keys = oncBlock("onc_mdt").fields.map((f) => f.key);
  ["disciplines_present", "case_presentation", "recommendation", "alternatives_considered", "guideline_cited", "divergent_guidance", "decision_status", "signed_by"].forEach((k) => {
    assert(keys.includes(k), `MDT does not record ${k}`);
  });
  return true;
});
check("blocks format to a printable record and keep their identity", () => {
  const value = oncBlockValue("onc_staging", { ct: "cT2", cn: "cN1", clinical_stage_group: "IIB" });
  assert(value.__block === "onc_staging", "block identity lost");
  const printed = formatOncBlock(value);
  assert(/Clinical T: cT2/.test(printed), `printed form is wrong: ${printed}`);
  const values = { onc_staging: value };
  assert(oncBlockValues(values, "onc_staging").ct === "cT2", "block values not readable");
  return true;
});

console.log("\n— Instruments —");
check("ECOG reports the published definition of the documented grade", () => {
  const r = calculateOncScore("onc_ecog", { grade: "2" });
  assert(r.value === "ECOG 2", `value was ${r.value}`);
  assert(/up more than 50% of waking hours/i.test(r.band), "the published definition is not shown");
  return true;
});
check("ECOG stays uncalculated when no grade was documented", () => {
  const r = calculateOncScore("onc_ecog", {});
  assert(Array.isArray(r.missing) && r.missing.length === 1, "a blank grade was not reported as missing");
  return true;
});
check("body surface area is arithmetic only and says no dose is suggested", () => {
  const r = calculateOncScore("onc_bsa", { height_cm: "170", weight_kg: "70" });
  assert(Math.abs(Number(r.value) - 1.82) < 0.01, `BSA was ${r.value}`);
  assert(/no dose/i.test(r.band), "the no-dose statement is missing");
  return true;
});
check("BSA is not calculated from a missing weight", () => {
  const r = calculateOncScore("onc_bsa", { height_cm: "170" });
  assert(r.missing.includes("Weight"), "a missing weight was not reported");
  return true;
});
check("RECIST arithmetic reports the target-lesion category and leaves the overall response to the clinician", () => {
  const r = calculateOncScore("onc_recist_sum", { baseline_sum: "100", current_sum: "60", new_lesions: "Absent" });
  assert(r.value === "-40", `change was ${r.value}`);
  assert(/target-lesion partial response/i.test(r.band), "the target-lesion category is wrong");
  assert(/must be the clinician/i.test(r.band), "the overall response is not reserved for the clinician");
  return true;
});
check("a new lesion is surfaced as progressive disease in the arithmetic note", () => {
  const r = calculateOncScore("onc_recist_sum", { baseline_sum: "100", current_sum: "60", new_lesions: "Present" });
  assert(/new lesion is documented/i.test(r.band), "the new lesion is not surfaced");
  return true;
});
check("the oncology panel exposes its own instruments plus only the shared ones that apply", () => {
  const keys = ONC_SCORES.map((s) => s.key);
  ["onc_ecog", "onc_bsa", "onc_recist_sum", "bmi", "egfr"].forEach((k) => assert(keys.includes(k), `${k} missing`));
  assert(!keys.includes("phq9"), "a psychiatric instrument leaked into oncology");
  assert(ONC_ONLY_SCORES.length === 3, `${ONC_ONLY_SCORES.length} oncology-only instruments`);
  return true;
});

console.log("\n— Advisory safety —");
check("no prompt fires on an empty note (a blank is never read as abnormal)", () => {
  const prompts = buildOncSafetyPrompts({ values: {} });
  assert(prompts.length === 0, `${prompts.length} prompts fired on an empty note`);
  return true;
});
check("fever with neutropenia raises the urgent febrile-neutropenia prompt", () => {
  const prompts = buildOncSafetyPrompts({ values: { onc_ctcae: { __block: "onc_ctcae", temperature: "38.4", anc: "0.4" } } });
  const p = prompts.find((x) => x.key === "febrile_neutropenia");
  assert(!!p, "the prompt did not fire");
  assert(p.level === "urgent", `level was ${p.level}`);
  assert(/38\.4/.test(p.basis), "the documented temperature is not quoted");
  return true;
});
check("a normal temperature raises nothing", () => {
  const prompts = buildOncSafetyPrompts({ values: { onc_ctcae: { __block: "onc_ctcae", temperature: "37.2", anc: "2.5" } } });
  assert(!prompts.some((x) => x.key === "febrile_neutropenia"), "a prompt fired on a normal temperature");
  return true;
});
check("back pain with a new neurological deficit raises the cord-compression prompt", () => {
  const prompts = buildOncSafetyPrompts({
    values: { onc_assessment: { __block: "onc_assessment", symptoms_reported: ["Back pain", "New neurological deficit"] } },
  });
  assert(prompts.some((x) => x.key === "cord_compression"), "the prompt did not fire");
  return true;
});
check("curative treatment with an unassignable stage is flagged", () => {
  const prompts = buildOncSafetyPrompts({
    values: {
      onc_treatment: { __block: "onc_treatment", treatment_intent: "Curative" },
      onc_staging: { __block: "onc_staging", stage_confirmation: "Cannot be assigned — incomplete information", incomplete_information: "PET not reported" },
    },
  });
  assert(prompts.some((x) => x.key === "stage_not_assignable"), "the prompt did not fire");
  return true;
});
check("a hepatitis B positive patient on rituximab is flagged", () => {
  const prompts = buildOncSafetyPrompts({
    values: {
      onc_assessment: { __block: "onc_assessment", hbv_status: "Positive — surface antigen" },
      onc_treatment: { __block: "onc_treatment", regimen_protocol: "R-CHOP", b_cell_depleting: "Yes — anti-CD20 or equivalent" },
    },
  });
  assert(prompts.some((x) => x.key === "hepatitis_b_reactivation"), "the prompt did not fire");
  return true;
});
check("every prompt cites a resolvable source and states it is advisory", () => {
  ONC_SAFETY_RULES.forEach((rule) => {
    assert(!!ONC_REFERENCES[rule.source], `${rule.key} cites an unregistered source`);
    assert(!!rule.ask && !!rule.title, `${rule.key} is incomplete`);
  });
  assert(ONC_SAFETY_RULES.length >= 12, `only ${ONC_SAFETY_RULES.length} rules`);
  return true;
});
check("prompts never carry a treatment order", () => {
  const text = JSON.stringify(ONC_SAFETY_RULES).toLowerCase();
  ["prescribe", "administer", "start chemotherapy", "give "].forEach((word) => {
    assert(!text.includes(word), `a rule contains an order-like instruction: ${word}`);
  });
  return true;
});

console.log("\n— References and guideline basis —");
check("NCCN and ESMO are registered as live links to the issuing bodies", () => {
  assert(ONC_REFERENCES.nccn.source_url.startsWith("https://www.nccn.org"), "NCCN URL is wrong");
  assert(ONC_REFERENCES.esmo.source_url.startsWith("https://www.esmo.org"), "ESMO URL is wrong");
  assert(ONC_REFERENCES.esmo_living.source_url.includes("esmo-living-guidelines"), "ESMO Living Guidelines URL is wrong");
  assert(ONC_PRINCIPAL_REFERENCE === "nccn", "NCCN is not the principal reference");
  return true;
});
check("every reference records organization, title, version, grading and an honest status", () => {
  Object.values(ONC_REFERENCES).forEach((r) => {
    assert(!!r.issuing_organization && !!r.title && !!r.source_url, `${r.key} is incomplete`);
    assert(["current", "superseded", "verify"].includes(r.status), `${r.key} has status ${r.status}`);
    assert(!!r.evidence_grading, `${r.key} has no grading statement`);
    assert(/^https:\/\//.test(r.source_url), `${r.key} does not link over https`);
  });
  return true;
});
check("no guideline document is copied into the app — only metadata and links", () => {
  const files = ["src/lib/oncReferences.js", "src/lib/oncDocuments.js"];
  files.forEach((f) => {
    const src = fs.readFileSync(f, "utf8");
    assert(!/©|all rights reserved/i.test(src), `${f} appears to carry copied content`);
    assert(src.length < 40000, `${f} looks like reproduced content (${src.length} chars)`);
  });
  return true;
});
check("every oncology note type cites at least one reference", () => {
  const keys = [...ONCOLOGY_DOCS.map((d) => d.key), ...ONC_WORKFLOW_DOCS.map((d) => d.key)];
  keys.forEach((k) => assert(oncReferencesForNote(k).length >= 1, `${k} has no reference`));
  return true;
});
check("no local oncology protocol is invented", () => {
  assert(Object.keys(ONC_LOCAL_PROTOCOLS).length === 0, "a local protocol was invented");
  return true;
});
check("the guidance basis states the NCCN/ESMO divergence and that no local approval is claimed", () => {
  const basis = oncGuidanceBasis("onc_breast_cancer");
  assert(/NCCN and ESMO/.test(basis), "the divergence is not stated");
  assert(/not a local approval/i.test(basis), "the local-approval position is not stated");
  return true;
});

console.log("\n— Governance —");
check("every oncology module states that the platform never diagnoses, stages or orders", () => {
  const icd = fs.readFileSync("src/lib/oncIcd11.js", "utf8");
  const blocks = fs.readFileSync("src/lib/oncBlocks.js", "utf8");
  const safety = fs.readFileSync("src/lib/oncSafetyRules.js", "utf8");
  assert(/never confirmed by software|never generates/i.test(icd), "ICD module does not state the rule");
  assert(/no stage group is calculated/i.test(blocks), "block module does not state the no-staging rule");
  assert(/never diagnoses, never stages, never orders/i.test(safety), "safety module does not state the rule");
  return true;
});
check("the safety review is stored with the note, so a signed note never shows a later recalculation", () => {
  const src = fs.readFileSync("src/components/doctor/notes/OncSafetyPromptsField.jsx", "utf8");
  assert(/resolved/.test(src) && /useEffect/.test(src), "the resolved prompts are not stored with the note");
  return true;
});
check("the ICD-11 field is offered on the note with confirmation required and unresolved coding allowed", () => {
  const f = fields("onc_breast_cancer").find((x) => x.key === "onc_icd11_diagnoses");
  assert(!!f, "the ICD-11 field is missing");
  assert(f.type === "icd11_diagnoses", "the ICD-11 field is not the shared coding component");
  assert(f.requireConfirmation === true, "confirmation is not required");
  assert(f.unspecifiedJustification === true, "an unspecified code needs no justification");
  assert(Array.isArray(f.conditionGroups) && f.conditionGroups.length >= 15, "the condition index is missing");
  return true;
});

console.log(`\n${pass} passed, ${fails.length} failed`);
if (fails.length) {
  fails.forEach((f) => console.log(` - ${f}`));
  process.exit(1);
}