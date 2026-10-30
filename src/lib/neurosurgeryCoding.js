// Neurosurgery coding guidance.
//
// WHAT THIS MODULE DOES — AND DELIBERATELY DOES NOT DO
//   It carries the coding INSTRUCTIONS for neurosurgical diagnoses: which entry
//   records the event, what has to be coded in addition (external cause,
//   organism, device), what must not be coded twice, and when a broad term must
//   not be used for a specific injury.
//
//   It ships NO ICD-11 codes. Neurosurgery has no verified code subset bundled
//   in this build, so the diagnosis field asks the clinician for the code taken
//   from the WHO ICD-11 browser and stores it as review-required until it is
//   checked. Inventing, completing or guessing a code is never acceptable, and
//   the app does not do it.
//
//   Diagnosis STATUS semantics are not re-declared here: the shared ICD-11 field
//   already records role, status, basis and mapping state for every entry, and
//   the meaning of each status is identical across specialties.

export const NSG_CODING_PRINCIPLES = [
  "Every code is copied from the WHO ICD-11 MMS browser and stored with the release and source it was checked against. AMedix never generates, completes or substitutes a code.",
  "A code never confirms a diagnosis — the clinician's documented status and clinical basis do.",
  "The specific injury, tumour or degeneration is coded; a broad head, spine or pain term is not used when a specific entry is documented.",
  "External causes (injury mechanism, device or implant complication) are coded from their own chapter, in addition to the clinical condition.",
  "Postcoordination detail (site, laterality, temporal course) is recorded in the note's own structured fields; the app does not build a cluster.",
  "Confirm inclusions, exclusions and postcoordination in the WHO browser before the code is treated as final.",
];

// Per note type: what this note's coding has to capture.
export const NSG_CODING_INSTRUCTIONS = {
  nsg_consultation: [
    "Code the condition that explains the presentation, not the symptom alone, once it is established.",
    "Where the diagnosis is still differential, record the differential entries and leave the primary entry's status as documented — a suspected entry is never coded as confirmed.",
    "Record the mechanism chapter entry only where the presentation is injury-related.",
  ],
  nsg_spine: [
    "Code the specific spinal degenerative or disc entry with its level; 'back pain' alone is not a substitute for a documented nerve-root or canal diagnosis.",
    "Radiculopathy and myelopathy are coded as documented — neither is inferred from a scan report.",
    "Record the level and laterality in the note's structured fields; the app does not build a postcoordinated cluster.",
  ],
  nsg_neurotrauma: [
    "Code the specific intracranial injury (each haemorrhage type, contusion, diffuse injury) rather than a broad head-injury term.",
    "Code the external cause of injury from its own chapter, in addition to the intracranial injury.",
    "A skull fracture, if present, is recorded as its own entry — it is not the same thing as the brain injury.",
    "Do not code a coma or consciousness entry as the primary diagnosis when the underlying injury is documented.",
    "Where anticoagulation contributed, record it in the note's structured fields; it is not a diagnosis code.",
  ],
  nsg_cerebrovascular: [
    "Code the haemorrhage or infarct itself; the underlying aneurysm or vascular malformation is coded as its own entry when documented.",
    "Subarachnoid and intracerebral haemorrhage are coded separately when both are present.",
    "Clinical grading (WFNS, Fisher) is recorded in the note's own fields and is never a code.",
    "A vasospasm or hydrocephalus complication is coded in addition when it is documented, not inferred.",
  ],
  nsg_hydrocephalus: [
    "Code the hydrocephalus with its documented cause where one is established; a shunt or EVD complication is coded as its own entry.",
    "Device presence, malfunction and infection are separate entries from the hydrocephalus itself.",
    "Normal-pressure hydrocephalus is coded only when the documented criteria are recorded — the imaging appearance alone does not establish it.",
  ],
  nsg_neuro_oncology: [
    "Code the tumour by its documented site and behaviour; the histological grade and molecular markers are recorded in the note's own fields and, where the classification requires them, as the classification directs.",
    "A metastasis is coded as metastatic disease, with the primary site coded additionally when it is known.",
    "Do not code a radiological impression as a confirmed neoplasm before histology — the status field records what is actually established.",
  ],
  nsg_cranial_operative: [
    "Code the condition the operation treated, not the operation itself; procedures belong in the procedure record.",
    "A complication that occurred in theatre is coded as its own entry when documented.",
  ],
  nsg_spinal_operative: [
    "Code the condition the operation treated at its documented level and laterality.",
    "An intra-operative dural tear with repair is recorded in the operative fields; code it as a complication only when it is documented as one.",
  ],
  nsg_postop_progress: [
    "Code only the complications that are documented — a normal post-operative day adds no diagnosis entry.",
    "A new deficit is recorded as its own entry with its clinical basis, never folded into the operation code.",
  ],
  nsg_discharge: [
    "The discharge summary carries the diagnoses that were established during the admission, with their status at discharge.",
    "A resolved complication stays recorded as such — it is not deleted because the patient recovered.",
  ],
};

export const codingInstructionsFor = (noteKey) => NSG_CODING_INSTRUCTIONS[noteKey] || [];

const code = (entry) => String(entry?.code || "").trim();
const status = (entry) => String(entry?.status || "").trim();
const state = (entry) => String(entry?.mapping_state || "").trim();

// Consistency prompts over the coded entries. Advisory: nothing is changed,
// removed or reworded, and the clinician's documented diagnosis stands.
export const auditNeurosurgicalDiagnoses = (entries = []) => {
  const list = Array.isArray(entries) ? entries : [];
  const out = [];
  const push = (level, message) => out.push({ level, message });

  list.forEach((e) => {
    const label = `${code(e) || "no code"} — ${e?.display || "undocumented"}`;
    if (state(e) === "unresolved" && code(e)) {
      push("error", `${label}: recorded as unresolved but carries a code. An unresolved entry stores the clinical term and no code.`);
    }
    if (state(e) === "review_required") {
      push("warning", `${label}: code entered from the browser and not yet checked — keep it as review required until it is verified.`);
    }
    if (status(e) === "Confirmed" && !String(e?.basis || "").trim()) {
      push("error", `${label}: confirmed without a documented clinical basis.`);
    }
    if (status(e) === "Differential" && state(e) === "verified") {
      push("note", `${label}: a differential carries a verified code. A verified code does not make it established — the status stands as differential.`);
    }
    if (status(e) === "Historical" && state(e) === "unresolved") {
      push("note", `${label}: historical diagnosis without a code. Acceptable — record that no code was assigned.`);
    }
  });

  const seen = new Map();
  list.forEach((e) => {
    const k = `${code(e)}|${String(e?.role || "")}`;
    if (!code(e)) return;
    seen.set(k, (seen.get(k) || 0) + 1);
  });
  seen.forEach((count, k) => {
    if (count > 1) push("warning", `${k.split("|")[0]}: recorded more than once in the same role.`);
  });

  return out;
};

export const formatNeurosurgicalAudit = (issues = []) =>
  (issues || [])
    .map((i) => `${i.level === "error" ? "!" : i.level === "warning" ? "▲" : "·"} ${i.message}`)
    .join("\n");

// The saved note / PDF keeps what the clinician was shown: the coding
// instructions for that note type, and every prompt with the action recorded
// against it — including the prompts left without one.
export const formatNeurosurgeryGuidance = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return String(value || "");
  const lines = [];
  const sources = Array.isArray(value.sources) ? value.sources : [];
  if (sources.length) {
    lines.push("Guideline attribution shown for this note:");
    sources.forEach((s) =>
      lines.push(
        `- ${s.organization} — ${s.title}${s.edition ? ` (${s.edition})` : ""}${
          s.published ? `, ${s.published}` : ", publication date to be confirmed at local review"
        } · population: ${s.population}`
      )
    );
    lines.push("");
  }
  if (value.icd11?.release) {
    lines.push(
      `ICD-11: ${value.icd11.system || "ICD-11-MMS"} release ${value.icd11.release} — codes are copied from the WHO browser and never generated by AMedix.`,
      ""
    );
  }
  const appliedSource = String(value.attribution?.guideline_applied || "").trim();
  if (appliedSource) {
    const appliedPopulation = String(value.attribution?.population_applied || "").trim();
    lines.push(`Guideline applied: ${appliedSource}${appliedPopulation ? ` · ${appliedPopulation}` : ""}`, "");
  }
  if (value.review?.label) lines.push(`Review status: ${value.review.label}`, "");
  const coding = Array.isArray(value.coding) ? value.coding : [];
  if (coding.length) {
    lines.push("Coding guidance shown for this note:");
    coding.forEach((line) => lines.push(`- ${line}`));
  }
  const prompts = Array.isArray(value.resolved) ? value.resolved : [];
  if (!prompts.length) {
    if (lines.length) lines.push("");
    lines.push("No clinical decision-support prompt was triggered by the documented findings.");
    return lines.join("\n");
  }
  const actions = value.actions || {};
  const notApplicable = value.not_applicable || {};
  const concerns = Array.isArray(value.concerns) ? value.concerns : [];
  if (concerns.length) {
    lines.push("", `Concerns recorded: ${concerns.join(", ")}.`);
  }
  lines.push("", "Decision-support prompts shown (advisory — not a diagnosis, order or decision):");
  prompts.forEach((p) => {
    const action = String(actions[p.key] || "").trim();
    const na = String(notApplicable[p.key] || "").trim();
    lines.push(`- [${String(p.level || "").replace("_", " ")}] ${p.title}`);
    if (Array.isArray(p.evidence) && p.evidence.length) lines.push(`  Documented: ${p.evidence.join("; ")}`);
    if (p.population) lines.push(`  Population: ${p.population}`);
    (Array.isArray(p.variants) ? p.variants : []).forEach((v) => {
      const who = v.source?.organization ? `${v.source.organization} — ${v.source.title}` : "No guideline attributed";
      lines.push(`  Where it differs — ${who} · ${v.population}: ${v.note}`);
    });
    lines.push(`  Action: ${action || "not documented"}`);
    if (na) lines.push(`  Not applicable: ${na}`);
    if (p.source?.organization)
      lines.push(`  Source: ${p.source.organization} — ${p.source.version}${p.source.published ? ` (${p.source.published})` : ""}`);
  });
  return lines.join("\n");
};