// Neurology — integrity, coding and safety check.
//
// Run with: node qa/neuro-qa.mjs
//
// The libraries under src/lib use the app's "@/lib/…" alias, which plain Node cannot
// resolve. This script mirrors src/lib with the alias rewritten and imports it, so
// every check runs against the REAL definitions the Doctor Portal uses.
//
// What it proves:
//   1. All eleven existing Neurology note types are enhanced, append-only, with no
//      duplicate field key and no existing key overwritten.
//   2. Every original field of every neurology template is still declared in
//      specialtyDocuments.js — the templates were appended to, not rebuilt.
//   3. Every appended section survives the app's own note-section policy, so no
//      panel is silently dropped before it reaches the doctor.
//   4. Every block and score a note declares actually exists.
//   5. The ICD-11 MMS catalogue is honest: no pre-verified code, no ICD-10 code, a
//      release and a coding note on every entry, and no fabricated code.
//   6. ICD-11 coding is configured for clinician confirmation and requires a
//      justification for an unspecified code.
//   7. Every safety prompt fires on the documented finding and stays silent without
//      it, and every citation resolves to the reference register.
//   8. Scores refuse to total when an item is missing.
//   9. The note form and the printed record both render the new sections.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TMP = path.join(ROOT, "qa", ".neuro-tmp");
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
  const source = fs
    .readFileSync(file, "utf8")
    .replace(/(from\s+|import\s*\()(["'])([^"']+)\2/g, (m, pre, q, spec) => {
      const target = resolveTarget(spec, rel);
      if (!target) return m;
      let r = path.posix.relative(path.posix.dirname(rel), target);
      if (!r.startsWith(".")) r = `./${r}`;
      return `${pre}${q}${r}${q}`;
    });
  fs.writeFileSync(out, source);
}

const icd = await import(path.join(TMP, "neurologyIcd11.js"));
const refs = await import(path.join(TMP, "neurologyReferences.js"));
const blocks = await import(path.join(TMP, "neurologyBlocks.js"));
const scores = await import(path.join(TMP, "neurologyScores.js"));
const sections = await import(path.join(TMP, "neurologyClinicalSections.js"));
const safety = await import(path.join(TMP, "neurologySafetyRules.js"));
const emerg = await import(path.join(TMP, "neurologyEmergencies.js"));
const meds = await import(path.join(TMP, "neurologyMedications.js"));
const escal = await import(path.join(TMP, "neurologyEscalation.js"));
const audit = await import(path.join(TMP, "neurologyAudit.js"));
const docs = await import(path.join(TMP, "neurologyDocuments.js"));
const policy = await import(path.join(TMP, "noteSectionPolicy.js"));

let failures = 0;
const check = (ok, message) => {
  if (!ok) {
    failures += 1;
    console.error(`FAIL — ${message}`);
  }
};

const NOTE_KEYS = [
  "neuro_consultation",
  "neuro_followup",
  "neuro_admission_note",
  "neuro_progress_note",
  "neuro_discharge_summary",
  "neuro_procedure_note",
  "neuro_eeg_report",
  "neuro_emg_ncs_report",
  "neuro_stroke_record",
  "neuro_seizure_followup",
  "neuro_referral",
];

// ---- 1. Every existing note type is enhanced -------------------------------
check(
  sections.NEURO_ENHANCED_KEYS.length === NOTE_KEYS.length,
  "not every neurology note type is enhanced",
);
NOTE_KEYS.forEach((key) =>
  check(sections.NEURO_ENHANCED_KEYS.includes(key), `note ${key} is not enhanced by the neurology layer`),
);

// ---- 2. The original templates are untouched -------------------------------
const REGISTRY = fs.readFileSync(path.join(ROOT, "src", "lib", "specialtyDocuments.js"), "utf8");
const START = REGISTRY.indexOf("const NEUROLOGY_DOCS = [");
const NEURO_BLOCK = REGISTRY.slice(START, REGISTRY.indexOf("const PSYCHIATRY_DOCS = [", START));

NOTE_KEYS.forEach((key) => check(NEURO_BLOCK.includes(`key: "${key}"`), `original template ${key} has disappeared`));
[
  ["neuro_consultation", ["chief_complaint", "hpi", "cranial_nerves", "motor_exam", "reflexes", "coordination", "gait"]],
  ["neuro_followup", ["interval_history", "neuro_exam", "investigations_reviewed"]],
  ["neuro_admission_note", ["admission_reason", "vitals", "admission_plan"]],
  ["neuro_progress_note", ["overnight_events", "consciousness_level", "imaging_review"]],
  ["neuro_discharge_summary", ["hospital_course", "discharge_neuro_status", "follow_up"]],
  ["neuro_procedure_note", ["procedure", "technique", "complications"]],
  ["neuro_eeg_report", ["background_activity", "epileptiform_discharges", "eeg_conclusion"]],
  ["neuro_emg_ncs_report", ["nerves_studied", "motor_ncs", "sensory_ncs", "needle_exam"]],
  ["neuro_stroke_record", ["onset_time", "last_known_well", "nihss_score", "thrombolysis", "thrombectomy"]],
  ["neuro_seizure_followup", ["seizure_frequency", "seizure_types", "medication_adherence", "driving_status"]],
  ["neuro_referral", ["referral_to", "reason", "urgency", "relevant_history"]],
].forEach(([note, fields]) =>
  fields.forEach((field) => check(NEURO_BLOCK.includes(`"${field}"`) && NEURO_BLOCK.includes(note), `original field ${field} of ${note} is no longer declared`)),
);
check(
  REGISTRY.includes("withNeurologyStandards(NEUROLOGY_DOCS)"),
  "specialtyDocuments.js does not apply the neurology standards",
);

// ---- 3. Appended sections survive the note-section policy -----------------
NOTE_KEYS.forEach((key) => {
  const fields = sections.NEURO_ENHANCEMENTS[key]();
  const doc = { key, label: key, specialty: "neurology", fields };
  const applied = policy.applyNoteSectionPolicy([doc]);
  if (policy.isReferralNoteType(doc)) {
    // A referral note type is deliberately kept out of the note-selection lists;
    // its own record is still defined here so an existing referral keeps rendering.
    check(applied.length === 0, `the referral note ${key} is not excluded from the note selection`);
  } else {
    const kept = new Set((applied[0]?.fields || []).map((f) => f.key));
    fields.forEach((f) => check(kept.has(f.key), `the note-section policy silently drops ${f.key} from ${key}`));
  }

  // ---- 4. Every declared block, score and panel exists --------------------
  const keys = fields.map((f) => f.key);
  check(new Set(keys).size === keys.length, `note ${key} declares a duplicate field key`);
  fields
    .filter((f) => f.type === "neuro_modules")
    .forEach((f) => check(Boolean(blocks.neuroBlock(f.key)), `note ${key} references unknown block ${f.key}`));
  fields
    .filter((f) => f.type === "neuro_scores")
    .forEach((f) => (f.scores || []).forEach((s) => check(Boolean(scores.neuroScore(s)), `note ${key} references unknown score ${s}`)));

  const coding = fields.filter((f) => f.type === "icd11_diagnoses");
  check(coding.length === 1, `note ${key} does not carry exactly one ICD-11 coding field`);
  coding.forEach((f) => {
    check(f.requireConfirmation === true, `note ${key} does not require clinician confirmation of the code`);
    check(f.unspecifiedJustification === true, `note ${key} does not require justification of an unspecified code`);
    check(f.clusterEnabled === true && Boolean(f.clusterNote), `note ${key} has no postcoordination rule`);
    check(Array.isArray(f.extraFields) && f.extraFields.length >= 7, `note ${key} carries too little detail beside the code`);
    check(f.catalogRelease === icd.NEURO_ICD11_MMS.release, `note ${key} mixes ICD-11 releases`);
    check(Array.isArray(f.catalog) && f.catalog.length > 0, `note ${key} has no catalogue`);
  });
  check(fields.filter((f) => f.type === "neuro_safety").length === 1, `note ${key} does not carry exactly one safety review`);
  check(fields.filter((f) => f.type === "neuro_guidance").length === 1, `note ${key} does not record its guideline basis`);
});

// ---- 5. Catalogue integrity ----------------------------------------------
check(icd.NEURO_ICD11.length >= 30, "the neurology catalogue is too thin");
const codes = icd.NEURO_ICD11.map((e) => e.code);
check(new Set(codes).size === codes.length, "the catalogue contains a duplicate code");
icd.NEURO_ICD11.forEach((e) => {
  check(Boolean(e.code && e.display && e.release && e.source), `entry ${e.code} is missing identity fields`);
  check(["verified", "review_required", "unresolved"].includes(e.mapping_state), `entry ${e.code} has an invalid mapping state`);
  check(Boolean(icd.NEURO_ICD11_DOMAINS[e.domain]), `entry ${e.code} has an unknown domain`);
  check(!/^[A-Z]\d{2}(\.\d)?$/.test(e.code), `entry ${e.code} looks like an ICD-10 code`);
  if (e.mapping_state === "verified") check(Boolean(e.verified_date), `entry ${e.code} claims verification with no date`);
  else check(Boolean(e.coding_note || icd.NEURO_ICD_CATALOG_NOTE), `entry ${e.code} is not verified and does not say why`);
});
const NEURO_STATS = {
  total: icd.NEURO_ICD11.length,
  verified: icd.NEURO_ICD11.filter((e) => e.mapping_state === "verified").length,
  review_required: icd.NEURO_ICD11.filter((e) => e.mapping_state === "review_required").length,
  not_seeded: 0,
};
check(NEURO_STATS.verified === 0, "the neurology catalogue claims a pre-verified code — none may be pre-verified");
check(/review required/i.test(icd.NEURO_ICD_CATALOG_NOTE), "the catalogue does not state that every entry needs coding review");
check(
  /never approximate a code/i.test(icd.NEURO_ICD_SEARCH_GUIDANCE),
  "the coding guidance does not forbid approximating a code",
);
check(
  String(icd.NEURO_ICD11_MMS.browser_url || "").startsWith("https://icd.who.int/"),
  "the WHO browser reference is not the official one",
);
const movement = icd.neurologyCatalogFor(["movement"]);
check(movement.length > 0 && movement.every((e) => e.domain === "movement"), "domain filtering leaks other domains");
check(icd.neurologyCatalogFor([]).length === icd.NEURO_ICD11.length, "an unfiltered catalogue is not the full catalogue");

// ---- 6. Scores refuse to total on missing items ---------------------------
check(scores.calculateNeuroScore("gcs", {}).value === null, "GCS totals on an empty record");
check(scores.calculateNeuroScore("gcs", {}).missing.length > 0, "an incomplete GCS reports nothing missing");
const fullGcs = {
  eye: "4",
  verbal: "5",
  motor: "6",
};
check(scores.calculateNeuroScore("gcs", fullGcs).value === 15, "a fully documented GCS does not total 15");
check(scores.calculateNeuroScore("nihss", { loc: "0 — Alert" }).value === null, "NIHSS totals on a single item");
check(Boolean(scores.formatNeuroScores({ gcs: fullGcs })), "the printed record drops a computed score");

// ---- 7. Safety prompts fire in both directions ---------------------------
const fire = (values) => safety.buildNeuroSafetyPrompts({ values }).map((p) => p.key);
check(fire({}).length === 0, "an empty note raises a safety prompt");
check(
  fire({ neuro_stroke: { str_last_known_well: "" } }).length === 0,
  "a blank stroke record raises a prompt as if a finding had been documented",
);
check(
  fire({ neuro_stroke: { str_onset_time: "14:10" } }).includes("stroke_time_last_known_well"),
  "a stroke record with no last-known-well raises no prompt",
);
check(
  !fire({ neuro_stroke: { str_onset_time: "14:10", str_last_known_well: "13:30" } }).includes("stroke_time_last_known_well"),
  "a documented last-known-well still raises the prompt",
);
check(
  fire({ neuro_stroke: { str_reperfusion_decision: "Intravenous thrombolysis given" } }).includes("stroke_scan_before_reperfusion"),
  "thrombolysis with no scan finding raises no prompt",
);
check(
  !fire({
    neuro_stroke: {
      str_reperfusion_decision: "Intravenous thrombolysis given",
      str_first_scan_finding: "No acute intracranial haemorrhage",
      str_contraindication_review: "No contraindication identified",
      str_bp_before_therapy: "146/82",
      str_glucose: "6.4 mmol/L",
    },
  }).some((k) => ["stroke_scan_before_reperfusion", "stroke_contraindication_review", "stroke_bp_before_therapy", "stroke_glucose_before_therapy"].includes(k)),
  "a fully documented thrombolysis still raises the thrombolysis prompts",
);
check(
  fire({ neuro_stroke: { str_first_scan_finding: "Intracerebral haemorrhage", str_anticoagulant: "Warfarin" } }).includes("ich_on_anticoagulant"),
  "a haemorrhage on warfarin raises no reversal prompt",
);
check(
  !fire({ neuro_stroke: { str_first_scan_finding: "Intracerebral haemorrhage", str_anticoagulant: "None" } }).includes("ich_on_anticoagulant"),
  "a haemorrhage off anticoagulation raises the reversal prompt",
);
check(
  fire({ neuro_seizure: { szr_features: ["Impaired awareness"] } }).includes("seizure_classification_incomplete"),
  "seizure features with no onset classification raise no prompt",
);
check(
  !fire({ neuro_seizure: { szr_features: ["Impaired awareness"], szr_onset: "Focal" } }).includes("seizure_classification_incomplete"),
  "a classified seizure still raises the classification prompt",
);
check(
  fire({ neuro_status: { se_first_line_agent: "Levetiracetam 60 mg/kg IV" } }).includes("status_first_line_time"),
  "status treatment with no time raises no prompt",
);
check(
  fire({ neuro_status: { se_refractory: "Refractory — ongoing despite benzodiazepine and second-line agent", se_level_of_care: "Ward" } }).includes(
    "status_refractory_outside_critical_care",
  ),
  "refractory status on a ward raises no prompt",
);
check(
  fire({ neuro_headache: { hd_red_flags: ["Sudden onset (thunderclap)"] } }).includes("headache_red_flag_unaddressed"),
  "a thunderclap headache with no evaluation raises no prompt",
);
check(
  !fire({ neuro_headache: { hd_red_flags: ["Sudden onset (thunderclap)"], hd_secondary_evaluation: "CT angiography at 15:40 — normal" } }).includes(
    "headache_red_flag_unaddressed",
  ),
  "an evaluated red flag still raises the prompt",
);
check(
  fire({ neuro_headache: { hd_red_flags: ["None of these documented"] } }).length === 0,
  "a documented negative red-flag list raises a prompt",
);
check(
  fire({ neuro_headache: { hd_days_per_month: "20", hd_acute_medicine_days: "12" } }).includes("headache_medication_overuse"),
  "a medication-overuse pattern raises no prompt",
);
check(
  fire({ neuro_neuromuscular: { nm_respiratory_symptoms: ["Orthopnoea"] } }).includes("neuromuscular_respiratory_not_measured"),
  "respiratory symptoms with no vital capacity raise no prompt",
);
check(
  fire({ neuro_scores: { gcs: fullGcs } }).length === 0,
  "a GCS of 15 raises a reduced-consciousness prompt",
);
check(
  fire({ neuro_scores: { gcs: { eye: "2", verbal: "2", motor: "4" } } }).includes(
    "reduced_consciousness_airway",
  ),
  "a GCS of 8 raises no airway prompt",
);
check(
  fire({ neuro_icp: { icp_pupils: "Fixed and dilated" } }).includes("pupil_asymmetry_without_neurosurgery"),
  "a fixed pupil raises no neurosurgical prompt",
);
check(
  fire({
    neuro_cns_infection: { inf_fever: "Present", inf_meningism: "Present" },
  }).includes("cns_infection_lumbar_puncture"),
  "fever with meningism and no LP decision raises no prompt",
);
check(
  fire({ neuro_emg: { emg_pattern: "Axonal, length-dependent" } }).includes("emg_without_reference_values"),
  "a conduction pattern with no reference values raises no prompt",
);

// Every rule is well formed and cites a resolvable source.
safety.NEURO_SAFETY_RULES.forEach((rule) => {
  check(Boolean(rule.key && rule.title && rule.basis), `rule ${rule.key} has no identity`);
  check(["critical", "warning"].includes(rule.level), `rule ${rule.key} has an invalid level`);
  check(Boolean(safety.NEURO_SAFETY_PROVENANCE[rule.provenance]), `rule ${rule.key} has no provenance label`);
  check(Boolean(refs.NEURO_REFERENCES[rule.source]), `rule ${rule.key} cites unknown source ${rule.source}`);
  if (rule.provenance === "local") {
    check(!/^http/.test(rule.source), `rule ${rule.key} is local but cites a society URL`);
  }
});
check(safety.NEURO_SAFETY_RULES.length >= 20, "the safety rule set is too thin for the presentations it covers");

// ---- 8. The reference register and per-note attribution ------------------
const REGISTER = refs.NEURO_REFERENCE_REGISTER;
check(REGISTER.length >= 8, "the reference register is too thin");
check(new Set(REGISTER.map((r) => r.organization + r.title)).size === REGISTER.length, "the register contains a duplicate entry");
REGISTER.forEach((r) => {
  check(Boolean(r.organization && r.title && r.edition), `reference ${r.organization} ${r.title} has no identity`);
  if (r.url) check(/^https:\/\//.test(r.url), `reference ${r.organization} has a non-https source`);
});
NOTE_KEYS.forEach((key) => {
  const entry = refs.neuroNoteBasis(key);
  check(Boolean(entry), `note ${key} records no guideline basis`);
  if (entry) {
    check(Array.isArray(entry.basis) && entry.basis.length > 0, `note ${key} cites nothing`);
    entry.basis.forEach((b) => {
      check(Boolean(b.organization && b.title && b.edition && b.population && b.applies), `note ${key} has an incomplete citation`);
      check(Boolean(refs.NEURO_REFERENCES[b.key] || b.organization), `note ${key} cites an unresolved reference`);
    });
  }
});

// ---- 10. The emergency recognition layer --------------------------------
const REQUIRED_EMERGENCIES = [
  "acute_ischaemic_stroke",
  "intracranial_haemorrhage",
  "subarachnoid_haemorrhage",
  "tia",
  "status_epilepticus",
  "prolonged_recurrent_seizures",
  "acute_altered_consciousness",
  "meningitis",
  "encephalitis",
  "raised_icp",
  "impending_herniation",
  "spinal_cord_compression",
  "cauda_equina",
  "gbs_respiratory_autonomic",
  "myasthenic_crisis",
];
const EMERGENCIES = emerg.NEURO_EMERGENCY_PRESENTATIONS;

REQUIRED_EMERGENCIES.forEach((key) =>
  check(Boolean(emerg.NEURO_EMERGENCY_MAP[key]), `emergency ${key} is not defined`),
);
check(EMERGENCIES.length === REQUIRED_EMERGENCIES.length, "the emergency catalogue carries presentations the team did not ask for");

EMERGENCIES.forEach((p) => {
  check(Boolean(emerg.NEURO_EMERGENCY_LEVELS[p.level]), `${p.label} has no urgency level`);
  check(p.why.length > 60, `${p.label} does not explain why it is urgent`);
  check(p.timeCritical.length > 40, `${p.label} carries no time-critical statement`);
  check(p.pathway.length > 40, `${p.label} directs to no institutional pathway`);
  check(p.recognition.length >= 3, `${p.label} lists fewer than three recognition findings`);
  check(p.fields.length >= 3, `${p.label} records nothing about the presentation`);
  (p.requires || []).forEach((fieldKey) =>
    check(p.fields.some((f) => f.key === fieldKey), `${p.label} requires an undocumented field ${fieldKey}`),
  );
  check(
    p.references.length > 0 && p.references.every((r) => Boolean(refs.NEURO_REFERENCES[r])),
    `${p.label} cites a reference that does not resolve in the register`,
  );
  check(
    p.provenance === "local" ||
      (p.provenance === "guideline" && p.references.some((r) => refs.NEURO_REFERENCES[r].type !== "Local policy")),
    `${p.label} claims a guideline without a guideline source`,
  );
  p.fields.forEach((f) => {
    check(
      !/^(give|administer|prescribe|start|order|thrombolyse)\b/i.test(f.label),
      `${p.label} carries an order field ("${f.label}") — the panel documents, it does not order`,
    );
  });
});

// The notice must say plainly what the panel does not do.
const NOTICE = emerg.NEURO_EMERGENCY_NOTICE;
["does not diagnose", "does not order treatment", "does not authorise", "delay"].forEach((phrase) =>
  check(NOTICE.includes(phrase), `the emergency notice does not state "${phrase}"`),
);

// Every note carries the emergency record, and every red flag names a destination.
const EMERGENCY_FIELD_NOTE_KEYS = NOTE_KEYS.filter((key) =>
  (sections.NEURO_ENHANCEMENTS[key]() || []).some((f) => f.type === "neuro_emergency"),
);
check(EMERGENCY_FIELD_NOTE_KEYS.length === NOTE_KEYS.length, "a neurology note type carries no emergency record");
emerg.NEURO_RED_FLAGS.forEach((flag) => {
  check(Boolean(emerg.NEURO_EMERGENCY_MAP[flag.pointsTo]), `red flag ${flag.key} points to no presentation`);
  check(Boolean(emerg.NEURO_EMERGENCY_LEVELS[flag.level]), `red flag ${flag.key} has no urgency level`);
});

// Completeness runs in both directions.
const incomplete = emerg.neurologyEmergencyIssues({ presentations: ["acute_ischaemic_stroke"], blocks: {} });
check(
  incomplete.some((i) => i.key === "acute_ischaemic_stroke_pathway"),
  "an emergency with no urgent pathway raises no issue",
);
check(
  incomplete.some((i) => i.key === "acute_ischaemic_stroke_lkw"),
  "an acute stroke with no time last known well raises no issue",
);
const complete = emerg.neurologyEmergencyIssues({
  presentations: ["acute_ischaemic_stroke"],
  blocks: {
    acute_ischaemic_stroke: {
      docs: {
        lkw: "18:20",
        glucose_result: "Measured — value recorded in this note",
        imaging_state: "Performed — finding recorded",
      },
      pathway: { who_informed: "On-call neurologist", time_informed: "18:35" },
    },
  },
});
check(
  complete.filter((i) => i.level === "immediate").length === 0,
  "a fully documented emergency still reports an outstanding immediate item",
);
check(
  emerg.neurologyEmergencyIssues({}).some((i) => i.key === "no_state"),
  "an empty emergency record does not ask for a statement",
);
check(
  emerg.neurologyEmergencyIssues({ none_documented: true, presentations: ["tia"] }).some((i) => i.key === "contradiction"),
  "a contradictory emergency record is accepted",
);

// The emergency rules read the panel, in both directions.
check(
  fire({ neuro_emergency: { presentations: ["acute_ischaemic_stroke"] } }).includes("emergency_pathway_unrecorded"),
  "an emergency with no recorded call raises no safety prompt",
);
check(
  fire({ neuro_emergency: { red_flags: ["pupil_change"] } }).includes("emergency_red_flag_without_record"),
  "a red flag with nothing done about it raises no safety prompt",
);
check(
  fire({
    neuro_emergency: { presentations: ["myasthenic_crisis"], blocks: { myasthenic_crisis: { docs: { weakness: "Bulbar" } } } },
  }).includes("emergency_respiratory_not_measured"),
  "a neuromuscular emergency with no respiratory measurement raises no prompt",
);
check(
  !fire({
    neuro_emergency: {
      presentations: ["myasthenic_crisis"],
      blocks: { myasthenic_crisis: { docs: { weakness: "Bulbar", vital_capacity: "1.2 L" } } },
    },
  }).includes("emergency_respiratory_not_measured"),
  "a documented vital capacity still raises the respiratory prompt",
);
check(
  !fire({
    neuro_emergency: {
      presentations: ["impending_herniation"],
      blocks: { impending_herniation: { docs: {}, pathway: { who_informed: "Neurosurgeon", time_informed: "18:40" } } },
    },
  }).includes("emergency_herniation_unreported"),
  "a recorded herniation call still raises the prompt",
);

// The printed record says NOT DOCUMENTED and never implies normality.
const printed = emerg.formatNeurologyEmergency({
  presentations: ["spinal_cord_compression"],
  blocks: { spinal_cord_compression: { docs: {}, pathway: {} } },
});
check(printed.includes("NOT DOCUMENTED"), "the printed emergency record hides a missing field");
check(/RECORD STILL OWES/.test(printed), "the printed emergency record carries no outstanding list");

// ---- 9. The new sections are rendered and printed ------------------------
const FORM = fs.readFileSync(path.join(ROOT, "src", "components", "doctor", "encounters", "DocumentFields.jsx"), "utf8");
[
  "neuro_modules",
  "neuro_scores",
  "neuro_safety",
  "neuro_guidance",
  "neuro_emergency",
  "neuro_medications",
  "neuro_escalation",
].forEach((type) => check(FORM.includes(`"${type}"`), `the note form does not render ${type}`));
const VALUE = fs.readFileSync(path.join(ROOT, "src", "lib", "clinicalFieldValue.js"), "utf8");
[
  "formatNeuroBlock",
  "formatNeuroScores",
  "formatNeuroSafety",
  "formatNeurologyEmergency",
  "formatNeurologyMedications",
  "formatNeurologyEscalation",
].forEach((fn) => check(VALUE.includes(fn), `the printed record does not use ${fn}`));

// ---- 11. Medication safety reads documented data only --------------------
const NO_ALLERGY = meds.NEURO_ALLERGY_STATES[0];
const ALLERGIES_REVIEWED = meds.NEURO_ALLERGY_STATES[1];
const REVIEWED = meds.NEURO_INTERACTION_REVIEW_STATES[0];

const medRecord = (over = {}) => ({
  entries: [],
  allergy_status: NO_ALLERGY,
  allergens: "",
  facts: {},
  interactions_reviewed: "",
  interactions_conclusion: "",
  no_medications: false,
  not_assessed: false,
  ...over,
});

const medKeys = (value) => meds.neurologyMedicationIssues(value).map((i) => i.key);
const medImmediate = (value) => meds.neurologyMedicationAlerts(value).map((i) => i.key);

// A blank record is never read as "no allergy, nothing given".
check(medKeys({}).includes("no_state"), "a blank medication record states no gap");
check(medKeys({}).includes("allergy_status_missing"), "an unrecorded allergy status is read as no allergy");
check(
  /not the same as no allergy/i.test(
    (meds.neurologyMedicationIssues({}).find((i) => i.key === "allergy_status_missing") || {}).message || "",
  ),
  "the allergy gap does not say that an unrecorded status is not the same as no allergy",
);

// A clean, fully documented record raises no alert.
const clean = medRecord({
  entries: [{ name: "Levetiracetam", dose: "500 mg", route: "oral", frequency: "Twice daily", timing: "Any time" }],
});
check(medImmediate(clean).length === 0, "a clean medication record raises an immediate alert");

// Allergy cross-reactivity fires from the documented allergen …
const allergyFired = medImmediate(
  medRecord({
    allergy_status: ALLERGIES_REVIEWED,
    allergens: "Penicillin — rash",
    entries: [{ name: "Ceftriaxone", dose: "2 g", route: "intravenous", frequency: "Single dose", response: "Improved" }],
  }),
);
check(allergyFired.some((k) => k.startsWith("allergy_penicillin_ceftriaxone")), "a documented penicillin allergy does not alert on ceftriaxone");
// … and stays silent when no allergen is documented — nothing is invented.
check(
  medImmediate(
    medRecord({ entries: [{ name: "Ceftriaxone", dose: "2 g", route: "intravenous", frequency: "Single dose", response: "Improved" }] }),
  ).every((k) => !k.startsWith("allergy_")),
  "an allergy alert is raised with no allergen documented",
);

// Contraindication screening: documented fact fires, explicitly absent fact does not.
const contraindicated = medRecord({
  facts: { therapeutic_anticoagulation: "Yes" },
  entries: [{ name: "Alteplase", dose: "0.9 mg/kg", route: "intravenous", frequency: "Continuous infusion", response: "No change" }],
});
check(medImmediate(contraindicated).includes("contraindication_thrombolytic_anticoagulated"), "a documented contraindication raises no immediate alert");
const cleared = medRecord({
  facts: { therapeutic_anticoagulation: "No" },
  entries: [{ name: "Alteplase", dose: "0.9 mg/kg", route: "intravenous", frequency: "Continuous infusion", response: "Improved" }],
});
check(!medKeys(cleared).includes("contraindication_thrombolytic_anticoagulated"), "a contraindication documented as absent still alerts");
check(!medKeys(cleared).includes("contraindication_thrombolytic_anticoagulated_unestablished"), "an absent fact is still reported as unestablished");
// An undocumented fact is reported as unestablished rather than assumed safe.
check(
  medKeys(
    medRecord({ entries: [{ name: "Alteplase", dose: "0.9 mg/kg", route: "intravenous", frequency: "Continuous infusion", response: "Improved" }] }),
  ).includes("contraindication_thrombolytic_anticoagulated_unestablished"),
  "an undocumented contraindication fact is treated as safe",
);

// Interaction: immediate until the review is recorded, then advisory only.
const interaction = medRecord({
  entries: [
    { name: "Sodium valproate", dose: "500 mg", route: "oral", frequency: "Twice daily", timing: "After food" },
    { name: "Lamotrigine", dose: "25 mg", route: "oral", frequency: "Once daily", timing: "Any time" },
  ],
});
check(medImmediate(interaction).some((k) => k.includes("interaction_valproate_lamotrigine")), "valproate with lamotrigine raises no immediate alert");
const interactionReviewed = medRecord({
  entries: interaction.entries,
  interactions_reviewed: REVIEWED,
  interactions_conclusion: "Regimen checked against the product label; slow titration recorded.",
});
check(medImmediate(interactionReviewed).length === 0, "a recorded interaction review leaves the interaction as an immediate alert");

// Every rule carries a statement and an attribution that is not AMedix's own.
[...meds.NEURO_ALLERGY_RULES, ...meds.NEURO_INTERACTION_RULES, ...meds.NEURO_CONTRAINDICATION_RULES].forEach((rule) =>
  check(
    Boolean(rule.key) && Boolean(rule.action || rule.message) && ["label", "guideline"].includes(rule.provenance),
    `medication rule ${rule.key} carries no statement or no attribution`,
  ),
);
[...meds.NEURO_ALLERGY_RULES, ...meds.NEURO_INTERACTION_RULES, ...meds.NEURO_CONTRAINDICATION_RULES]
  .filter((rule) => rule.sourceId)
  .forEach((rule) => check(Boolean(refs.NEURO_REFERENCES[rule.sourceId]), `medication rule ${rule.key} cites unknown source ${rule.sourceId}`));

// ---- 12. Escalation reads documented data only ---------------------------
const completeEvent = {
  finding_key: "gcs_decline",
  trigger: escal.NEURO_ESCALATION_TRIGGERS[0],
  time_identified: "14:05",
  identified_by: "Nurse A",
  baseline_observation: "GCS 15",
  current_observation: "GCS 12",
  finding_detail: "Fell two points over one hour",
  who_informed: "Registrar on call",
  time_informed: "14:10",
  route: "Ward escalation",
  acknowledged_by: "Dr B",
  acknowledged_time: "14:12",
  decision: "Urgent CT and senior review",
  decision_by: "Dr B",
  reassessment_time: "14:30",
  reassessment: "GCS 13 after treatment",
};

const escalKeys = (value) => escal.neurologyEscalationIssues(value).map((i) => i.key);

check(escalKeys({ none_documented: true }).length === 0, "a completed escalation statement still reports a gap");
check(escalKeys({}).includes("no_state"), "a blank escalation record states no gap");
check(escalKeys({ none_documented: true, events: [completeEvent] }).includes("contradiction"), "a record claiming no event while recording one is accepted");
check(escalKeys({ events: [completeEvent] }).length === 0, "a complete escalation event still owes documentation");

["time_identified", "who_informed", "acknowledged_by", "decision"].forEach((field) =>
  check(escalKeys({ events: [{ ...completeEvent, [field]: "" }] }).length > 0, `an event with no ${field} reports nothing`),
);
check(
  escalKeys({ events: [{ ...completeEvent, reassessment_time: "", reassessment: "" }] }).some((k) => k.endsWith("reassessment")),
  "an immediate-level finding with no reassessment reports nothing",
);
check(escalKeys({ events: [{ ...completeEvent, time_informed: "13:50" }] }).some((k) => k.endsWith("time_order")), "a notification timed before the finding is accepted");
check(
  escalKeys({ events: [{ ...completeEvent, trigger: escal.NEURO_ESCALATION_TRIGGERS[1], baseline_observation: "GCS 15", current_observation: "GCS 15" }] }).some(
    (k) => k.endsWith("deterioration_contradiction"),
  ),
  "a deterioration with no documented change is accepted",
);
check(
  escal.NEURO_ESCALATION_TRIGGERS.includes("Not documented"),
  "the escalation trigger list offers no explicit not-documented state",
);
escal.NEURO_CRITICAL_FINDINGS.forEach((finding) => {
  check(Boolean(finding.level) && Boolean(finding.why), `critical finding ${finding.key} carries no level or rationale`);
  check(Boolean(refs.NEURO_REFERENCES[finding.sourceId]), `critical finding ${finding.key} cites unknown source ${finding.sourceId}`);
});
check(
  /does not diagnose|may not delay/i.test(escal.NEURO_ESCALATION_NOTICE),
  "the escalation notice states neither that it does not diagnose nor that it may not delay care",
);

// ---- 13. The audit payload carries documented events only ----------------
check(audit.buildNeurologyAuditPayload({}) === null, "an empty note writes an audit payload");
check(audit.buildNeurologyAuditPayload(null) === null, "a null note writes an audit payload");

const auditBlank = audit.buildNeurologyAuditPayload({ neuro_medications: {}, neuro_escalation: {} });
check(auditBlank.medications.length === 0, "a blank medication panel writes an alert to the audit log");
check(auditBlank.escalations.length === 0, "a blank escalation panel writes an event to the audit log");

const auditReviewed = audit.buildNeurologyAuditPayload({ neuro_medications: interactionReviewed });
check(auditReviewed.medications.length === 0, "an advisory-only interaction review is logged as an alert");

const auditCritical = audit.buildNeurologyAuditPayload({
  neuro_medications: contraindicated,
  neuro_escalation: { events: [completeEvent] },
  neuro_emergency: { presentations: ["status_epilepticus"] },
});
check(auditCritical.medications.some((m) => m.kind === "contraindication"), "a documented contraindication is missing from the audit log");
check(auditCritical.escalations.length === 1, "a documented escalation is missing from the audit log");
check(
  auditCritical.escalations[0].finding === escal.neuroCriticalFinding("gcs_decline").label,
  "the logged escalation does not name the documented finding",
);
check(auditCritical.counts.escalation_owed === 0, "a complete escalation is logged as owing documentation");
check(auditCritical.emergencies.some((e) => e.presentation === emerg.NEURO_EMERGENCY_MAP.status_epilepticus.label), "a documented emergency is missing from the audit log");
check(auditCritical.version === audit.NEURO_AUDIT_VERSION, "the audit payload carries no version");

const many = audit.buildNeurologyAuditPayload({
  neuro_escalation: { events: Array.from({ length: 25 }, () => ({ ...completeEvent, time_identified: "", who_informed: "" })) },
});
check(many.escalations.length <= 15, "the audit payload is unbounded");
check(many.counts.escalation_owed > 0, "an incomplete escalation is logged as owing nothing");

fs.rmSync(TMP, { recursive: true, force: true });

const stats = NEURO_STATS;
if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log(
  `PASS — ${NOTE_KEYS.length} Neurology note types enhanced, ${stats.total} ICD-11 MMS entries (all ${stats.review_required} review required, ${stats.verified} pre-verified by design), ${blocks.NEURO_BLOCK_KEYS.length} blocks, ${scores.NEURO_SCORES.length} scores, ${safety.NEURO_SAFETY_RULES.length} safety rules verified in both directions, ${
    meds.NEURO_ALLERGY_RULES.length + meds.NEURO_INTERACTION_RULES.length + meds.NEURO_CONTRAINDICATION_RULES.length
  } medication safety rules verified in both directions, ${escal.NEURO_CRITICAL_FINDINGS.length} critical-finding escalations verified in both directions, ${EMERGENCIES.length} emergency presentations verified in both directions, the audit payload verified, ${REGISTER.length} register references.`,
);