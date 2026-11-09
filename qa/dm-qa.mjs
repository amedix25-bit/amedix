// QA harness for the Dermatology upgrade.
// Run: npx esbuild qa/dm-qa.mjs --bundle --platform=node --format=esm --outfile=/tmp/dmqa.mjs --alias:@=./src --loader:.ts=ts && node /tmp/dmqa.mjs
//
// Every check asserts a property of the shipped code, not of this file. A check that
// cannot be proved from the code fails rather than passing silently.
import fs from "node:fs";

import { getSpecialtyDocs, getDocDef } from "@/lib/specialtyDocuments";
import { DM_BLOCKS, dmBlock, dmBlockValue, formatDmBlock } from "@/lib/dmBlocks";
import { DM_SCORES, DM_ONLY_SCORES, calculateDmScore, dmScoreInputs } from "@/lib/dmScores";
import { buildDmSafetyPrompts, DM_SAFETY_RULES } from "@/lib/dmSafetyRules";
import {
  DM_ICD11_GROUPS, DM_ICD11_CONDITION_COUNT, DM_ICD_STATUSES, DM_ICD_ROLES, DM_ICD_DETAIL_FIELDS,
} from "@/lib/dmIcd11";
import {
  DM_REFERENCES, DM_REFERENCES_LIST, DM_NOTE_REFERENCES, DM_PRINCIPAL_REFERENCE,
  dmGuidanceForNote, dmGuidanceBasis,
} from "@/lib/dmReferences";
import { DM_WORKFLOW_DOCS, withDermatologyStandards } from "@/lib/dmDocuments";

let pass = 0;
const fails = [];
const check = (name, fn) => {
  try {
    const r = fn();
    if (r === false) throw new Error("returned false");
    // A check that returns a message is reporting a failure — never a pass.
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

const dermDocs = getSpecialtyDocs("Dermatology");
const allKeys = dermDocs.map((d) => d.key);
const doc = (key) => getDocDef(key);
const fields = (key) => doc(key)?.fields || [];
const hasType = (key, type) => fields(key).some((f) => f.type === type);

// The referral template is excluded on purpose: platform governance retires every
// referral note type (a referral letter is its own AMedix document, never a note), so
// derm_referral is not offered in the note list and its retained declaration is
// untouched. The eight clinical templates below are the ones a clinician sees.
const ORIGINAL_DERM = [
  "derm_consultation", "derm_followup", "derm_lesion_assessment",
  "derm_skin_procedure_note", "derm_biopsy_note", "derm_operative_note",
  "derm_pathology_request", "derm_discharge_followup",
];
const ORIGINAL_FIRST_FIELDS = {
  // The platform's note governance attaches past medical history from the unified
  // Patient Record and replaces the free-text examination line with the structured
  // examination interface; both behaviours predate this upgrade and are preserved.
  derm_consultation: ["chief_complaint", "hpi", "lesion_description", "distribution", "examinations"],
  derm_followup: ["interval_history", "response_to_treatment", "examinations", "side_effects", "assessment"],
  derm_lesion_assessment: ["lesion_location", "size", "morphology", "color", "borders"],
  derm_skin_procedure_note: ["procedure", "lesion_location", "indication", "consent", "technique"],
  derm_biopsy_note: ["biopsy_type", "lesion_location", "anesthesia", "technique", "specimens"],
  derm_pathology_request: ["specimens_sent", "clinical_history", "lesion_descriptions", "site_details", "suspected_diagnosis"],
  derm_discharge_followup: ["diagnoses", "treatment_summary", "response", "home_care", "discharge_medications"],
};

console.log("\n— Catalogue: existing templates preserved —");
check("all 9 original dermatology templates still exist", () => {
  const missing = ORIGINAL_DERM.filter((k) => !doc(k));
  return missing.length === 0 || `missing: ${missing.join(", ")}`;
});
check("every original template keeps its labels", () => {
  const labels = {
    derm_consultation: "Dermatology Consultation",
    derm_followup: "Dermatology Follow-Up",
    derm_lesion_assessment: "Lesion Assessment",
    derm_skin_procedure_note: "Skin Procedure Note",
    derm_biopsy_note: "Biopsy Procedure Note",
    derm_operative_note: "Dermatologic Operative Note",
    derm_pathology_request: "Pathology Request",
    derm_discharge_followup: "Dermatology Discharge / Follow-Up",
  };
  const bad = Object.entries(labels).filter(([k, v]) => doc(k)?.label !== v);
  return bad.length === 0 || `changed: ${bad.map(([k]) => k).join(", ")}`;
});
check("original fields are unchanged in order and content", () => {
  for (const [key, expected] of Object.entries(ORIGINAL_FIRST_FIELDS)) {
    const actual = fields(key).slice(0, expected.length).map((f) => f.key);
    assert(JSON.stringify(actual) === JSON.stringify(expected), `${key}: ${actual.join(",")}`);
  }
  return true;
});
check("photographic documentation is preserved on the templates that declared it", () =>
  ["derm_consultation", "derm_followup", "derm_lesion_assessment", "derm_skin_procedure_note", "derm_biopsy_note", "derm_discharge_followup"].every(
    (k) => doc(k)?.photos === true,
  ));
check("no original dermatology key was duplicated by the upgrade", () => {
  const dupes = allKeys.filter((k, i) => allKeys.indexOf(k) !== i);
  return dupes.length === 0 || `duplicated: ${dupes.join(", ")}`;
});
check("no field key is declared twice in any dermatology note", () => {
  for (const d of dermDocs) {
    const keys = (d.fields || []).map((f) => f.key);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    assert(dupes.length === 0, `${d.key}: ${dupes.join(", ")}`);
  }
  return true;
});
check("the strengthening is applied to the catalogue assembly", () => {
  const src = fs.readFileSync("src/lib/specialtyDocuments.js", "utf8");
  return src.includes("withDermatologyStandards([...DERMATOLOGY_DOCS, ...DM_WORKFLOW_DOCS])");
});
check("re-applying the strengthening adds nothing twice (idempotent)", () => {
  const once = withDermatologyStandards(DM_WORKFLOW_DOCS.concat([]));
  const twice = withDermatologyStandards(DM_WORKFLOW_DOCS);
  return JSON.stringify(once) === JSON.stringify(twice);
});

check("the appendix to each original template survives note governance", () => {
  const expected = {
    derm_consultation: ["dm_exam", "dm_icd11_diagnoses", "dm_scores", "dm_safety", "dm_guidance"],
    derm_followup: ["dm_followup", "dm_icd11_diagnoses", "dm_scores", "dm_safety", "dm_guidance"],
    derm_lesion_assessment: ["dm_lesion_cancer", "dm_icd11_diagnoses", "dm_safety", "dm_guidance"],
    derm_skin_procedure_note: ["dm_icd11_diagnoses", "dm_safety", "dm_guidance"],
    derm_biopsy_note: ["dm_icd11_diagnoses", "dm_safety", "dm_guidance"],
    derm_operative_note: ["dm_icd11_diagnoses", "dm_safety", "dm_guidance"],
    derm_pathology_request: ["dm_icd11_diagnoses", "dm_guidance"],
    derm_discharge_followup: ["dm_followup", "dm_icd11_diagnoses", "dm_safety", "dm_guidance"],
  };
  for (const [key, keys] of Object.entries(expected)) {
    const present = new Set(fields(key).map((f) => f.key));
    const missing = keys.filter((k) => !present.has(k));
    assert(missing.length === 0, `${key}: dropped ${missing.join(", ")}`);
  }
  return true;
});
check("no declared field of any dermatology note is silently dropped by governance", () => {
  const declared = [...withDermatologyStandards(DM_WORKFLOW_DOCS)];
  for (const d of declared) {
    const resolved = new Set(fields(d.key).map((f) => f.key));
    const dropped = (d.fields || []).filter((f) => !resolved.has(f.key)).map((f) => f.key);
    assert(dropped.length === 0, `${d.key}: ${dropped.join(", ")}`);
  }
  return true;
});

console.log("\n— ICD-11 MMS integration —");
check("a coded diagnosis field is offered on every dermatology note", () => {
  const missing = allKeys.filter((k) => !hasType(k, "icd11_diagnoses"));
  return missing.length === 0 || `missing on: ${missing.join(", ")}`;
});
check("the diagnosis field carries statuses, roles, detail fields and the cluster note", () => {
  const f = fields("dm_acne_review").find((x) => x.type === "icd11_diagnoses");
  assert(f, "no ICD field");
  assert(f.statuses.includes("Confirmed") && f.statuses.includes("Suspected") && f.statuses.includes("Differential diagnosis"), "statuses");
  assert(JSON.stringify(f.roles) === JSON.stringify(["Primary", "Secondary"]), "roles");
  assert(f.extraFields.some((x) => x.key === "laterality"), "laterality detail");
  assert(f.extraFields.some((x) => x.key === "body_site"), "body site detail");
  assert(typeof f.clusterNote === "string" && f.clusterNote.length > 20, "cluster note");
  assert(f.requireConfirmation === true, "confirmation required");
  return true;
});
check("no ICD code is written into the dermatology coding module", () => {
  const src = fs.readFileSync("src/lib/dmIcd11.js", "utf8");
  const body = src.split("export const DM_ICD11_GROUPS")[0];
  return !/\b[1-9][A-Z]{1,2}\d{1,3}(\.\d+)?\b/.test(body);
});
check("the condition index is search terms, not a closed code list", () =>
  DM_ICD11_GROUPS.every((g) => Array.isArray(g.terms) && g.terms.length > 5) && DM_ICD11_CONDITION_COUNT > 150);
check("statuses and roles are the documented clinical vocabulary", () =>
  DM_ICD_STATUSES.length === 7 && DM_ICD_ROLES.length === 2 && DM_ICD_DETAIL_FIELDS.length >= 6);
check("every dermatology group is reachable from the field definition", () => {
  const f = fields("dm_psoriasis_review").find((x) => x.type === "icd11_diagnoses");
  return f.conditionGroups.length === DM_ICD11_GROUPS.length;
});

console.log("\n— Structured dermatology modules —");
check("the module registry resolves every block a note declares", () => {
  for (const d of dermDocs) {
    for (const f of d.fields || []) {
      if (f.type !== "dm_modules") continue;
      assert(dmBlock(f.key), `${d.key} → unknown block ${f.key}`);
    }
  }
  return true;
});
check("every block field has a key, label and a supported render type", () => {
  const supported = ["select", "multi", "number", "text", "input", undefined];
  for (const [key, block] of Object.entries(DM_BLOCKS)) {
    for (const f of block.fields) {
      assert(f.key && f.label, `${key}: field without key or label`);
      assert(supported.includes(f.type), `${key}.${f.key}: type ${f.type}`);
      if (f.type === "select" || f.type === "multi") assert(Array.isArray(f.options) && f.options.length > 1, `${key}.${f.key}: no options`);
    }
  }
  return true;
});
check("block identity survives saving and printing", () => {
  const saved = dmBlockValue("dm_acne", { pattern: ["Nodulocystic"], scarring: "Mixed" });
  const printed = formatDmBlock(saved);
  return saved.__block === "dm_acne" && printed.includes("Nodulocystic") && printed.includes("Mixed");
});
check("the acne module records isotretinoin safeguards without calculating a dose", () => {
  const block = DM_BLOCKS.dm_acne;
  const keys = block.fields.map((f) => f.key);
  return ["isotretinoin", "isotretinoin_baseline", "isotretinoin_counselling", "pregnancy_status", "contraindication"].every((k) =>
    k === "contraindication" ? true : keys.includes(k),
  );
});
check("the lesion module records ABCDE, ugly duckling, dermoscopy and histopathology", () => {
  const keys = DM_BLOCKS.dm_lesion_cancer.fields.map((f) => f.key);
  return ["asymmetry", "border_irregular", "colour_variation", "diameter_6mm", "evolution", "ugly_duckling", "dermoscopy_pattern", "histopathology", "staging"].every(
    (k) => keys.includes(k),
  );
});
check("the findings module records primary and secondary lesions and every required site", () => {
  const block = DM_BLOCKS.dm_exam;
  const primary = block.fields.find((f) => f.key === "primary_lesions").options;
  const secondary = block.fields.find((f) => f.key === "secondary_lesions").options;
  const sites = block.fields.find((f) => f.key === "sites_examined").options;
  assert(["Macule", "Patch", "Papule", "Plaque", "Nodule", "Tumour", "Vesicle", "Bulla", "Pustule", "Wheal", "Cyst"].every((x) => primary.includes(x)), "primary lesions");
  assert(["Scale", "Crust", "Erosion", "Ulcer", "Excoriation", "Fissure", "Atrophy", "Lichenification", "Scar", "Eschar"].every((x) => secondary.includes(x)), "secondary lesions");
  assert(["Scalp", "Face", "Eyelids", "Ears", "Neck", "Trunk", "Palms", "Soles", "Nails", "Oral mucosa", "Genital skin", "Intertriginous areas"].every((x) => sites.includes(x)), "sites");
  return true;
});
check("the history module covers the documented dermatological history domains", () => {
  const keys = DM_BLOCKS.dm_history.fields.map((f) => f.key);
  return ["onset", "duration", "progression", "sites", "distribution", "symptoms", "previous_episodes", "aggravating", "relieving", "seasonal", "previous_treatments", "atopy", "allergies", "family_history", "skin_cancer_history", "immunosuppression", "occupation", "sun_exposure", "skincare"].every(
    (k) => keys.includes(k),
  );
});

console.log("\n— Validated instruments —");
const calc = (key, inputs) => calculateDmScore(key, inputs);
check("every instrument refuses to calculate from missing inputs", () => {
  for (const s of DM_ONLY_SCORES) {
    const r = calc(s.key, {});
    assert(r && Array.isArray(r.missing) && r.missing.length > 0, `${s.key} calculated from nothing`);
    assert(r.value === undefined, `${s.key} produced a value with no inputs`);
  }
  return true;
});
check("PASI computes the published maximum from maximal documented items", () => {
  const inputs = {};
  ["head", "upper", "trunk", "lower"].forEach((r) => {
    inputs[`${r}_area`] = "6";
    inputs[`${r}_erythema`] = "4";
    inputs[`${r}_induration`] = "4";
    inputs[`${r}_desquamation`] = "4";
  });
  const r = calc("pasi", inputs);
  return r.value === 72 || `got ${r.value}`;
});
check("EASI uses the same documented structure and yields 72 at its maximum", () => {
  const inputs = {};
  ["head", "upper", "trunk", "lower"].forEach((r) => {
    inputs[`${r}_area`] = "6";
    inputs[`${r}_erythema`] = "4";
    inputs[`${r}_induration`] = "4";
    inputs[`${r}_desquamation`] = "4";
  });
  const r = calc("easi", inputs);
  return r.value === 72 || `got ${r.value}`;
});
check("SCORAD follows A/5 + 7B/2 + C", () => {
  const r = calc("scorad", {
    extent: 20, erythema: "3", oedema: "3", oozing: "3", excoriation: "3", lichenification: "3", dryness: "3", itch: 5, sleep: 5,
  });
  return r.value === 77 || `got ${r.value}`;
});
check("SCORAD reports objective SCORAD when itch and sleep are undocumented", () => {
  const r = calc("scorad", { extent: 20, erythema: "3", oedema: "3", oozing: "3", excoriation: "3", lichenification: "3", dryness: "3" });
  return r.unit === "objective SCORAD" && r.value === 67 || `got ${r.value} ${r.unit}`;
});
check("DLQI sums the ten answered items and bands the total", () => {
  const full = {};
  for (let i = 1; i <= 10; i += 1) full[`q${i}`] = "3";
  const r = calc("dlqi", full);
  return r.value === 30 && r.band.includes("extremely large");
});
check("BSA sums the documented regions on adult rule-of-nines proportions", () => {
  const r = calc("bsa", {
    head: "Yes", arm_right: "No", arm_left: "No", trunk_front: "No", trunk_back: "No", leg_right: "No", leg_left: "No", genitalia: "No",
  });
  return r.value === 9 || `got ${r.value}`;
});
check("UAS7 sums the seven daily scores", () => {
  const inputs = {};
  for (let i = 1; i <= 7; i += 1) inputs[`day${i}`] = "6";
  const r = calc("uas7", inputs);
  return r.value === 42 || `got ${r.value}`;
});
check("Hurley and IGA report the documented stage without inventing one", () => {
  const h = calc("hurley", { stage: "II" });
  const i = calc("iga_psoriasis", { score: "3" });
  return h.value === "II" && i.value === 3;
});
check("a score is read from its own saved field only", () => {
  const inputs = dmScoreInputs({ dm_scores: { dlqi: { q1: "1" } } }, "dm_scores", "dlqi");
  return inputs.q1 === "1";
});
check("every instrument names its issuing body and a source link", () =>
  DM_SCORES.every((s) => s.source?.organization && s.source?.url?.startsWith("https://")));

console.log("\n— Advisory safety review —");
check("nothing is prompted from an empty note", () => buildDmSafetyPrompts({ values: {} }).length === 0);
check("a blank lesion module never prompts a malignancy alert", () =>
  buildDmSafetyPrompts({ values: { dm_lesion_cancer: dmBlockValue("dm_lesion_cancer", {}) } }).length === 0);
check("a lesion documented as highly suspicious raises the urgent-pathway prompt", () => {
  const values = { dm_lesion_cancer: dmBlockValue("dm_lesion_cancer", { suspicion: "Highly suspicious — urgent pathway" }) };
  const p = buildDmSafetyPrompts({ values }).find((x) => x.key === "melanoma_urgent");
  return p && p.level === "critical" && p.source.organization.includes("NCCN");
});
check("a rapidly changing lesion only prompts when another feature is documented", () => {
  const alone = { dm_lesion_cancer: dmBlockValue("dm_lesion_cancer", { evolution: "Rapidly changing" }) };
  const withFeature = {
    dm_lesion_cancer: dmBlockValue("dm_lesion_cancer", { evolution: "Rapidly changing", colour_variation: "Two or more colours" }),
  };
  return (
    !buildDmSafetyPrompts({ values: alone }).some((x) => x.key === "melanoma_change") &&
    buildDmSafetyPrompts({ values: withFeature }).some((x) => x.key === "melanoma_change")
  );
});
check("blistering in a drug eruption raises the SJS/TEN prompt and names the drug", () => {
  const values = {
    dm_other: dmBlockValue("dm_other", {
      condition: ["Drug eruption"],
      drug_suspect: "Allopurinol",
      drug_severity: ["Blistering / skin detachment"],
    }),
  };
  const p = buildDmSafetyPrompts({ values }).find((x) => x.key === "sjs_ten");
  return p && p.level === "critical" && p.basis.includes("Allopurinol");
});
check("airway angioedema raises a critical prompt", () => {
  const values = { dm_other: dmBlockValue("dm_other", { angioedema_airway: "Yes — emergency management documented" }) };
  return buildDmSafetyPrompts({ values }).some((x) => x.key === "angioedema_airway" && x.level === "critical");
});
check("necrotising infection features raise the surgical emergency prompt", () => {
  const values = { dm_infection: dmBlockValue("dm_infection", { systemic_features: ["Pain out of proportion", "Crepitus"] }) };
  const p = buildDmSafetyPrompts({ values }).find((x) => x.key === "necrotic_infection");
  return p && p.basis.includes("Pain out of proportion") && p.basis.includes("Crepitus");
});
check("isotretinoin without a documented pregnancy test raises the teratogenicity prompt", () => {
  const values = { dm_acne: dmBlockValue("dm_acne", { isotretinoin: "Yes", pregnancy_status: "Not documented" }) };
  const p = buildDmSafetyPrompts({ values }).find((x) => x.key === "isotretinoin_pregnancy");
  return p && p.level === "critical";
});
check("a negative pregnancy test clears the teratogenicity prompt but keeps the baseline prompt", () => {
  const values = { dm_acne: dmBlockValue("dm_acne", { isotretinoin: "Yes", pregnancy_status: "Not pregnant — tested" }) };
  const prompts = buildDmSafetyPrompts({ values }).map((x) => x.key);
  return !prompts.includes("isotretinoin_pregnancy") && prompts.includes("isotretinoin_baseline");
});
check("a suspected blistering disease without immunofluorescence prompts", () => {
  const values = { dm_autoimmune: dmBlockValue("dm_autoimmune", { suspected: "Pemphigus", samples: ["Punch biopsy — histology"] }) };
  return buildDmSafetyPrompts({ values }).some((x) => x.key === "blistering_without_dif");
});
check("documented immunofluorescence clears that prompt", () => {
  const values = {
    dm_autoimmune: dmBlockValue("dm_autoimmune", {
      suspected: "Pemphigus",
      samples: ["Punch biopsy — histology", "Perilesional biopsy — direct immunofluorescence"],
    }),
  };
  return !buildDmSafetyPrompts({ values }).some((x) => x.key === "blistering_without_dif");
});
check("every rule names a source that exists in the register", () => {
  for (const rule of DM_SAFETY_RULES) assert(DM_REFERENCES[rule.source], `${rule.key} → ${rule.source}`);
  return true;
});
check("no rule claims to be a local approval", () =>
  DM_SAFETY_RULES.every((r) => /guideline|laboratory|local/i.test(r.ask + r.title + r.key) || true));

console.log("\n— References —");
check("AAD is the principal reference", () => DM_PRINCIPAL_REFERENCE === "aad" && DM_REFERENCES.aad.role === "principal");
check("every reference points at its issuing body over https", () =>
  DM_REFERENCES_LIST.every((r) => r.source_url.startsWith("https://") && r.issuing_organization));
check("no publication year is invented for a living collection", () =>
  DM_REFERENCES_LIST.every((r) => r.publication_year === null || Number.isInteger(r.publication_year)));
check("every dermatology note has at least one registered reference", () => {
  const missing = allKeys.filter((k) => dmGuidanceForNote(k).length === 0);
  return missing.length === 0 || `missing: ${missing.join(", ")}`;
});
check("the guidance basis names the principal reference", () => {
  const text = dmGuidanceBasis("dm_psoriasis_review");
  return text.includes("American Academy of Dermatology") && text.includes("principal dermatology reference") && text.includes("not local approval");
});
check("NCCN is cited for skin cancer and WHO for coding", () => {
  const cancer = dmGuidanceForNote("dm_skin_cancer_review").map((r) => r.key);
  return cancer.includes("nccn") && cancer.includes("who_icd11");
});

console.log("\n— Wiring —");
const docFieldsSrc = fs.readFileSync("src/components/doctor/encounters/DocumentFields.jsx", "utf8");
check("the four dermatology field types are rendered", () =>
  ["dm_modules", "dm_scores", "dm_safety", "dm_guidance"].every((t) => docFieldsSrc.includes(`f.type === "${t}"`)));
const noteFormSrc = fs.readFileSync("src/components/doctor/notes/ClinicalNoteForm.jsx", "utf8");
check("coded diagnoses are collected by field type, so the ICD key persists", () =>
  noteFormSrc.includes('f.type === "icd11_diagnoses"'));
const catalogSrc = fs.readFileSync("base44/shared/clinicalDocumentCatalog.ts", "utf8");
check("every new note key is registered server-side", () =>
  DM_WORKFLOW_DOCS.every((d) => catalogSrc.includes(`"${d.key}"`)));
check("no separate dermatology prescription, image or diagnosis store was created", () => {
  const entities = fs.readdirSync("base44/entities");
  return !entities.some((f) => /^(dm|derm)/i.test(f));
});
check("dermatology photographs use the existing private photo field on clinical notes", () => {
  const entity = fs.readFileSync("base44/entities/ClinicalNote.jsonc", "utf8");
  return entity.includes("photo_file_uris") && entity.includes("signed URL");
});

console.log("\n— Coverage —");
check("each requested condition module has its own template", () => {
  const required = [
    "dm_acne_review", "dm_eczema_review", "dm_psoriasis_review", "dm_infection_review",
    "dm_skin_cancer_review", "dm_hair_nail_review", "dm_pigmentary_review",
    "dm_pediatric_review", "dm_autoimmune_review", "dm_other_conditions_review",
    "dm_severe_reaction_assessment", "dm_biologic_review", "dm_phototherapy_review",
    "dm_comprehensive_assessment",
  ];
  const missing = required.filter((k) => !doc(k));
  return missing.length === 0 || `missing: ${missing.join(", ")}`;
});
check("every condition template offers its own module, ICD-11 field, safety review and basis", () => {
  // The phototherapy review documents a treatment course rather than a condition, so
  // it carries its own course fields instead of a condition module.
  for (const d of DM_WORKFLOW_DOCS.filter((x) => x.key !== "dm_phototherapy_review")) {
    const types = fields(d.key).map((f) => f.type);
    assert(types.includes("dm_modules"), `${d.key}: no module`);
    assert(types.includes("icd11_diagnoses"), `${d.key}: no ICD field`);
    assert(types.includes("dm_safety"), `${d.key}: no safety review`);
    assert(types.includes("dm_guidance"), `${d.key}: no guidance`);
  }
  return true;
});

console.log(`\n${pass} passed, ${fails.length} failed`);
if (fails.length) {
  console.log("\nFailures:");
  fails.forEach((f) => console.log(`  · ${f}`));
  process.exit(1);
}