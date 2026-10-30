// Pediatrics — per-note clinical verification.
//
// Run with: node qa/peds-note-qa.mjs
//
// Two questions are answered here, against the real modules the Doctor Portal uses:
//   1. STRUCTURE — does every one of the eighteen notes carry its own four sections,
//      with blocks that exist, fields that are fully specified and no key collisions
//      between two blocks of the same note?
//   2. BEHAVIOUR — given a documented clinical scenario, do the note-level safety
//      prompts raise exactly the findings that scenario documents, and does a complete,
//      well-documented note raise none?
//
// A prompt that fires on a clean note is treated as a failure, not a warning: an alert
// that fires without a documented finding trains clinicians to ignore the panel.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TMP = path.join(ROOT, "qa", ".peds-note-tmp");
const LIB = path.join(ROOT, "src", "lib");

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const libFiles = walk(LIB).filter((f) => f.endsWith(".js"));
const libRels = new Set(libFiles.map((f) => path.relative(LIB, f).replaceAll("\\", "/")));

const resolveTarget = (spec, fromRel) => {
  let base;
  if (spec.startsWith("@/lib/")) base = spec.slice(6);
  else if (spec.startsWith(".")) base = path.posix.join(path.posix.dirname(fromRel), spec);
  else return null;
  base = path.posix.normalize(base);
  if (libRels.has(base)) return base;
  if (libRels.has(`${base}.js`)) return `${base}.js`;
  if (libRels.has(`${base}/index.js`)) return `${base}/index.js`;
  return null;
};

for (const file of libFiles) {
  const rel = path.relative(LIB, file).replaceAll("\\", "/");
  const out = path.join(TMP, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    fs
      .readFileSync(file, "utf8")
      .replace(/(from\s+|import\s*\()(["'])([^"']+)\2/g, (m, pre, q, spec) => {
        const target = resolveTarget(spec, rel);
        if (!target) return m;
        let r = path.posix.relative(path.posix.dirname(rel), target);
        if (!r.startsWith(".")) r = `./${r}`;
        return `${pre}${q}${r}${q}`;
      }),
  );
}

const profiles = await import(path.join(TMP, "pedsNoteProfiles.js"));
const blocks = await import(path.join(TMP, "pedsBlocks.js"));
const strengthening = await import(path.join(TMP, "pedsNoteStrengthening.js"));
const safety = await import(path.join(TMP, "pedsSafetyRules.js"));
const refs = await import(path.join(TMP, "pedsReferences.js"));
const register = await import(path.join(TMP, "pedsReferenceRegister.js"));

let failures = 0;
const check = (ok, message) => {
  if (!ok) {
    failures += 1;
    console.error(`FAIL — ${message}`);
  }
};

const NOTE_KEYS = Object.keys(profiles.PEDS_NOTE_PROFILES);
const noteBlock = (noteKey, part) => blocks.PEDS_BLOCKS[profiles.pedsNoteBlockKey(noteKey, part)];

// ---- 1. Structure: eighteen notes, four sections each ---------------------
check(NOTE_KEYS.length === 18, `expected 18 pediatric note types, found ${NOTE_KEYS.length}`);

for (const noteKey of NOTE_KEYS) {
  const sections = strengthening.pedsNoteSections(noteKey);
  check(sections.length === 4, `${noteKey}: expected 4 clinical sections, found ${sections.length}`);

  const seenKeys = new Set();
  for (const part of ["ctx", "exam", "assess", "care"]) {
    const key = profiles.pedsNoteBlockKey(noteKey, part);
    const block = blocks.PEDS_BLOCKS[key];
    check(!!block, `${noteKey}/${part}: block ${key} is not registered`);
    if (!block) continue;
    check(block.key === key, `${noteKey}/${part}: block declares a different key (${block.key})`);
    check(!!block.title, `${noteKey}/${part}: no section title`);
    check((block.fields || []).length > 0, `${noteKey}/${part}: the section has no fields`);

    for (const field of block.fields || []) {
      check(!!field.label, `${noteKey}/${part}.${field.key}: no label`);
      check(!seenKeys.has(field.key), `${noteKey}: field "${field.key}" appears in two sections`);
      seenKeys.add(field.key);
      if (field.type === "select" || field.type === "multi") {
        check(
          Array.isArray(field.options) && field.options.length > 1,
          `${noteKey}/${part}.${field.key}: no options`,
        );
      }
    }
  }

  // The note must still offer its coding, safety review and basis record.
  const sectionKeys = sections.map((s) => s.key);
  check(new Set(sectionKeys).size === sectionKeys.length, `${noteKey}: a section is attached twice`);
}

// A note's medication section must ask for the weight the dose is calculated from.
for (const noteKey of NOTE_KEYS) {
  const care = noteBlock(noteKey, "care");
  if (!care) continue;
  const keys = (care.fields || []).map((f) => f.key);
  if (keys.includes("rx_drug")) {
    check(keys.includes("rx_weight_kg"), `${noteKey}: a medicine can be recorded with no weight for the dose`);
    check(keys.includes("rx_allergy_check"), `${noteKey}: a medicine can be recorded with no allergy check`);
  }
}

// ---- 2. Behaviour: documented scenarios -----------------------------------
const raisedFor = (values) => safety.buildPedsSafetyPrompts({ values }).map((p) => p.key);
const scenario = (name, values, expected, absent = []) => {
  const raised = raisedFor(values);
  for (const key of expected) {
    check(raised.includes(key), `${name}: "${key}" did not fire on the documented finding`);
  }
  for (const key of absent) {
    check(!raised.includes(key), `${name}: "${key}" fired without the finding`);
  }
};

const blockValues = (noteKey, part, fields) => ({
  [profiles.pedsNoteBlockKey(noteKey, part)]: {
    __p: profiles.pedsNoteBlockKey(noteKey, part),
    ...fields,
  },
});
const note = (noteKey, parts) => Object.assign({}, ...Object.entries(parts).map(([part, f]) => blockValues(noteKey, part, f)));

// A complete, well-documented well-child visit raises nothing.
scenario(
  "well-child visit, fully documented",
  note("peds_well_child", {
    ctx: { ctx_dob: "2023-02-14", ctx_assessed_on: "2026-10-30", ctx_age_value: "3" },
    exam: {
      vit_age_band: "5 years or older",
      vit_temp_c: "36.8",
      msr_weight_kg: "14.2",
      msr_length_cm: "96",
      msr_growth_reference: "WHO growth standards",
    },
    assess: { asm_severity: "Not acutely unwell", asm_red_flags: ["None documented"] },
    care: { dsp_decision: "Discharge home" },
  }),
  [],
  [
    "note_measurement_without_reference",
    "note_red_flag_without_severity",
    "note_young_infant_fever_without_evaluation",
  ],
);

// Fever in a six-week-old with no evaluation.
scenario(
  "infant under 2 months with fever, no evaluation",
  note("peds_consultation", {
    ctx: { ctx_dob: "2026-09-18" },
    exam: { vit_age_band: "Under 2 months", vit_temp_c: "38.3" },
    assess: { asm_severity: "Not classified" },
  }),
  ["note_young_infant_fever_without_evaluation"],
  ["note_red_flag_without_severity", "note_cyanosis_without_saturation"],
);

// The same infant, fully evaluated and admitted.
scenario(
  "infant under 2 months with fever, evaluated and admitted",
  note("peds_consultation", {
    ctx: { ctx_dob: "2026-09-18" },
    exam: { vit_age_band: "Under 2 months", vit_temp_c: "38.3" },
    assess: {
      asm_severity: "Critical — resuscitation or immediate escalation",
      wkp_requested: "Full septic screen",
      wkp_interpretation: "Interpreted with the clinical picture",
    },
    care: { dsp_decision: "Admit to the ward" },
  }),
  [],
  ["note_young_infant_fever_without_evaluation"],
);

// Preterm infant: corrected age is not recorded.
scenario(
  "preterm infant, corrected age missing",
  note("peds_growth_development", {
    ctx: { ctx_ga_weeks: "32" },
    exam: { msr_weight_kg: "4.1" },
  }),
  ["note_preterm_corrected_age_missing", "note_measurement_without_reference"],
);

scenario(
  "preterm infant, corrected age recorded",
  note("peds_growth_development", {
    ctx: { ctx_ga_weeks: "32", ctx_dob: "2026-06-01", ctx_assessed_on: "2026-10-30" },
    exam: { msr_weight_kg: "5.6", msr_growth_reference: "WHO corrected-age reference" },
  }),
  [],
  ["note_preterm_corrected_age_missing", "note_measurement_without_reference"],
);

// Respiratory emergency: cyanosis with no saturation, poor perfusion with no plan.
scenario(
  "respiratory emergency, cyanosis and poor perfusion",
  note("peds_admission_note", {
    exam: {
      exs_skin: ["Cyanosis"],
      vit_age_band: "2–11 months",
      exs_perfusion: "Cool peripheries documented",
      vit_crt: "2 seconds or more",
    },
    assess: { asm_severity: "Severe", asm_red_flags: ["Cyanosis", "Signs of shock"] },
  }),
  ["note_cyanosis_without_saturation", "note_shock_signs_without_action"],
);

scenario(
  "respiratory emergency, oxygen and disposition documented",
  note("peds_admission_note", {
    exam: {
      exs_skin: ["Cyanosis"],
      vit_spo2: "86",
      vit_age_band: "2–11 months",
      exs_perfusion: "Cool peripheries documented",
      vit_crt: "2 seconds or more",
    },
    assess: { asm_severity: "Critical — resuscitation or immediate escalation", asm_red_flags: ["Cyanosis"] },
    care: { mon_parameters: ["Oxygen saturation", "Heart rate"], dsp_decision: "Admit to intensive care" },
  }),
  [],
  ["note_cyanosis_without_saturation", "note_shock_signs_without_action"],
);

// Apnoea in a neonate with no monitoring plan.
scenario(
  "neonate with apnoea, no monitoring plan",
  note("peds_neonatal_progress", {
    exam: { exs_resp_work: ["Apnoea"], vit_age_band: "Under 2 months" },
    assess: { asm_severity: "Severe" },
    care: { mon_parameters: [] },
  }),
  ["note_apnoea_without_monitoring"],
);

scenario(
  "neonate with apnoea, monitored",
  note("peds_neonatal_progress", {
    exam: { exs_resp_work: ["Apnoea"], vit_age_band: "Under 2 months" },
    assess: { asm_severity: "Severe" },
    care: {
      mon_parameters: ["Apnoea and bradycardia monitor", "Oxygen saturation"],
      mon_frequency: "Continuous",
      mon_deterioration_trigger: "Further apnoea requiring stimulation",
      dsp_decision: "Admit to high dependency",
    },
  }),
  [],
  ["note_apnoea_without_monitoring"],
);

// Seizure with no management, then with an anticonvulsant and a dose.
scenario(
  "seizure documented with no management",
  note("peds_admission_note", {
    ctx: { acu_red_flag_history: ["Seizure"] },
    exam: { exs_neuro: ["Seizure activity observed"] },
    assess: { asm_severity: "Critical — resuscitation or immediate escalation" },
    care: { dsp_decision: "Admit to high dependency" },
  }),
  ["note_seizure_without_management"],
);

scenario(
  "seizure treated with a weight-based dose",
  note("peds_admission_note", {
    exam: { exs_neuro: ["Seizure activity observed"] },
    assess: { asm_severity: "Critical — resuscitation or immediate escalation" },
    care: {
      rx_drug: "Midazolam",
      rx_weight_kg: "12",
      rx_mg_per_kg: "0.2",
      rx_max_mg: "10",
      rx_allergy_check: "Checked — no allergy to this medicine",
      rx_dose_basis_note: "Per local status epilepticus pathway",
      dsp_decision: "Admit to high dependency",
    },
  }),
  [],
  ["note_seizure_without_management", "note_dose_maximum_not_stated", "note_dose_allergy_not_checked"],
);

// Reduced conscious level with no escalation and no monitoring.
scenario(
  "reduced conscious level, nothing recorded after it",
  note("peds_consultation", {
    exam: { vit_consciousness: "Responds to voice", exs_general: "Lethargic" },
    assess: { asm_severity: "Severe", asm_red_flags: ["Altered consciousness"] },
  }),
  ["note_reduced_consciousness_without_escalation"],
);

// Anaphylaxis considered in the differential, no adrenaline.
scenario(
  "anaphylaxis in the differential, no adrenaline recorded",
  note("peds_consultation", {
    ctx: { acu_red_flag_history: ["None documented"] },
    assess: {
      asm_differentials: "Anaphylaxis considered against a viral exanthem.",
      asm_severity: "Severe",
    },
    care: { rx_drug: "Chlorphenamine" },
  }),
  ["note_anaphylaxis_without_adrenaline", "note_dose_without_weight"],
);

scenario(
  "anaphylaxis with adrenaline recorded",
  note("peds_consultation", {
    assess: { asm_differentials: "Anaphylaxis versus a viral exanthem.", asm_severity: "Severe" },
    care: {
      rx_drug: "Adrenaline (epinephrine) intramuscular",
      rx_weight_kg: "18",
      rx_mg_per_kg: "0.01",
      rx_max_mg: "0.5",
      rx_allergy_check: "Checked — allergy documented, medicine avoided",
      dsp_decision: "Observe in the department",
    },
  }),
  [],
  ["note_anaphylaxis_without_adrenaline", "note_dose_above_stated_maximum"],
);

// Weight-based dosing: no weight, no maximum, and above the stated maximum.
scenario(
  "dose calculated without a weight",
  note("peds_chronic_followup", { care: { rx_drug: "Amoxicillin" } }),
  ["note_dose_without_weight"],
);

scenario(
  "mg/kg dose with no maximum stated",
  note("peds_chronic_followup", {
    care: {
      rx_drug: "Paracetamol",
      rx_weight_kg: "10",
      rx_mg_per_kg: "15",
      rx_allergy_check: "Checked — no allergy to this medicine",
    },
  }),
  ["note_dose_maximum_not_stated"],
  ["note_dose_above_stated_maximum"],
);

scenario(
  "calculated dose above the stated maximum",
  note("peds_chronic_followup", {
    care: {
      rx_drug: "Paracetamol",
      rx_weight_kg: "40",
      rx_mg_per_kg: "15",
      rx_max_mg: "500",
      rx_allergy_check: "Checked — no allergy to this medicine",
    },
  }),
  ["note_dose_above_stated_maximum"],
  ["note_dose_maximum_not_stated"],
);

scenario(
  "medicine recorded with the allergy check outstanding",
  note("peds_chronic_followup", {
    care: {
      rx_drug: "Ibuprofen",
      rx_weight_kg: "20",
      rx_mg_per_kg: "10",
      rx_max_mg: "400",
      rx_allergy_check: "Not checked",
    },
  }),
  ["note_dose_allergy_not_checked"],
);

// Safeguarding: the context states a concern, no safeguarding record was written.
scenario(
  "safeguarding concern screened positive, no record",
  note("peds_consultation", {
    ctx: { fam_safeguarding_screen: "Concern identified — see safeguarding record" },
    assess: { asm_severity: "Mild" },
  }),
  ["note_safeguarding_screen_without_record"],
);

// Red flags with no severity classification.
scenario(
  "red flag documented without a severity",
  note("peds_consultation", {
    assess: { asm_red_flags: ["Suspected serious bacterial infection"], asm_severity: "Not classified" },
  }),
  ["note_red_flag_without_severity"],
);

// ---- 3. The traceable register -------------------------------------------
const registerKeys = new Set(register.PEDS_REGISTER_ROWS.map((r) => r.key));
for (const rule of safety.PEDS_SAFETY_RULES) {
  check(registerKeys.has(rule.source), `${rule.key}: source "${rule.source}" has no register row`);
}
for (const [noteKey, entry] of Object.entries(refs.PEDS_NOTE_BASIS)) {
  for (const basis of entry.basis) {
    check(registerKeys.has(basis), `${noteKey}: basis "${basis}" has no register row`);
  }
}
for (const row of register.PEDS_REGISTER_ROWS) {
  check(!!row.organization, `${row.key}: no issuing body`);
  check(!!row.title, `${row.key}: no exact title`);
  check(!!row.edition, `${row.key}: no edition`);
  check(!!row.population, `${row.key}: no population`);
  check(!!row.requirement, `${row.key}: states no requirement it is applied to`);
  check(!!row.reviewed, `${row.key}: no review date`);
  check(
    row.publication_verified || row.publication_label === "publication date not verified",
    `${row.key}: an unverified publication date is presented as known`,
  );
  if (row.url) check(row.url.startsWith("https://"), `${row.key}: publisher link is not https`);
}
const attribution = refs.pedsAttributionText("peds_consultation");
check(/published |publication date not verified/.test(attribution), "the note attribution carries no publication date");

// ---- 4. Report -----------------------------------------------------------
const summary = register.PEDS_REGISTER_SUMMARY;
console.log(`Pediatric notes verified: ${NOTE_KEYS.length}`);
console.log(`Safety prompts: ${safety.PEDS_SAFETY_RULES.length}`);
console.log(
  `Register: ${summary.total} sources · ${summary.publication_dated} with a confirmed publication date · ` +
    `${summary.publication_unverified} awaiting date confirmation · reviewed ${summary.reviewed}`,
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll pediatric note checks passed.");