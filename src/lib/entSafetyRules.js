// Conditional clinical safety prompts for the ENT (Otolaryngology) notes.
//
// Rules that govern every prompt below:
//   1. A prompt fires ONLY from something a clinician documented — a selected
//      concern in this encounter, or a structured finding recorded in the same
//      note. An empty finding is never read as a negative finding, and
//      "Not assessed" / "Not performed" / "Not documented" never fire anything.
//   2. A prompt does not diagnose, does not prescribe, does not order a test and
//      does not label the patient stable or unstable. It states what was
//      documented, the time-sensitivity involved, and the decision the treating
//      clinician must make and record.
//   3. Documentation never delays care. Nothing here is a required field, and
//      the panel says explicitly that urgent care comes first.
//   4. No prompt firing is NOT reassurance — the panel and the saved note say so.
//
// Every prompt carries its provenance so guideline requirements, society
// recommendations, AMedix local triage decisions and plain documentation
// practice are never conflated (see src/lib/entTraceability.md, Part 3).

import { ENT_REFERENCES, ENT_REFERENCES_REVIEWED } from "@/lib/entReferences";
import { parseExaminationValue } from "@/lib/examinations/clinicalExaminations";

export const ENT_SAFETY_REVIEWED = ENT_REFERENCES_REVIEWED;

export const ENT_SAFETY_LEVELS = {
  immediate: "Act now — before finishing the note",
  same_day: "Same-day clinical decision",
  documented: "Decision to document and who owns it",
};

// Where the rule comes from. Kept separate from the clinical basis so a local
// triage choice is never presented as a guideline requirement.
export const ENT_SAFETY_PROVENANCE = {
  guideline_requirement: "Guideline requirement (documentation elements)",
  clinical_recommendation: "Society recommendation — clinician judgement applies",
  local_triage_decision: "AMedix local triage decision — needs ENT clinical approval",
  documentation_practice: "General documentation practice",
};

const LEVEL_ORDER = { immediate: 0, same_day: 1, documented: 2 };

const refOf = (id) => ENT_REFERENCES.find((r) => r.id === id) || null;

const sourceOf = (id) => {
  const r = refOf(id);
  if (!r) return null;
  return {
    id: r.id,
    organization: r.organization,
    title: r.title,
    version: r.version,
    url: r.url,
    verified: ENT_REFERENCES_REVIEWED,
    level: r.level,
  };
};

const has = (v, ...list) => list.includes(v);

// ---- Reading documented findings ------------------------------------------
const isBlank = (v) => v === undefined || v === null || v === "";

// A structured ENT examination value. A section explicitly recorded as
// "not_assessed" is never read, and an empty field returns "" — never "Normal".
const examValue = (values, sectionKey, fieldKey) => {
  const parsed = parseExaminationValue(values && values.examinations);
  const section = parsed && parsed.data ? parsed.data.ent && parsed.data.ent[sectionKey] : null;
  if (!section || section.status === "not_assessed") return "";
  const raw = (section.values || {})[fieldKey];
  if (raw === undefined || raw === null) return "";
  if (typeof raw === "object" && !Array.isArray(raw)) return raw.value || raw.side || "";
  return String(raw);
};

// Documented laterality, carried into a prompt so the record is unambiguous.
const sideOf = (values = {}) => {
  const side = values.affected_ear || values.laterality || values.side_tested;
  return side ? ` (${side})` : "";
};

const hearingSideOf = (values = {}) => {
  const v = values.hearing_loss || "";
  const m = v.match(/right|left|bilateral/i);
  return m ? ` (${m[0]})` : sideOf(values);
};

// ---- Prompts an ENT clinician selects in this encounter --------------------
// These exist because several note types (procedure, operative, discharge) have
// no dedicated structured field for the concern, and because a clinician may
// identify something the template does not ask about. Selecting one records a
// clinical concern — it is not a diagnosis.
export const ENT_SAFETY_CONCERNS = [
  {
    key: "airway_obstruction",
    label: "Stridor, noisy breathing or suspected upper-airway obstruction",
    level: "immediate",
    title: "Airway concern documented in this encounter",
    basis:
      "Stridor at rest points to narrowing of the upper airway and can deteriorate quickly. No AAO-HNS guideline in the ENT register defines an airway-escalation threshold, so the timing here is an AMedix triage decision.",
    action:
      "Arrange immediate senior ENT / anaesthetic airway assessment, keep the patient under continuous observation, and act before completing this note. Record who assessed the airway, when, and the decision made. Airway management itself is not prescribed here.",
    sourceId: null,
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  {
    key: "epistaxis_uncontrolled",
    label: "Severe or uncontrolled epistaxis",
    level: "immediate",
    title: "Severe or uncontrolled epistaxis documented in this encounter",
    basis:
      "AAO-HNS epistaxis guidance (2020) covers the documented assessment of bleeding severity, first-aid measures, packing and the patient's comorbidity; the point at which bleeding becomes an emergency is a local clinical decision.",
    action:
      "Arrange immediate senior ENT assessment and document the first-aid and packing measures already taken, the estimated blood loss, and whether a bleeding-risk factor is present. Transfusion or reversal decisions are made by the treating team and are not prescribed here.",
    sourceId: "aao_epistaxis_2020",
    provenance: "clinical_recommendation",
    approvalRequired: true,
  },
  {
    key: "sudden_hearing_loss",
    label: "Sudden hearing loss",
    level: "same_day",
    title: "Sudden hearing loss documented in this encounter",
    basis:
      "AAO-HNS sudden hearing loss guidance (2019) requires distinguishing conductive from sensorineural loss and audiometric confirmation; the time-critical pathway is an AMedix triage decision.",
    action:
      "Arrange audiometry and same-day (or next available) ENT review, and record the date and time of onset, the side and any accompanying vestibular or neurological symptoms. Treatment decisions belong to the treating clinician.",
    sourceId: "aao_sudden_hearing_loss_2019",
    provenance: "clinical_recommendation",
    approvalRequired: true,
  },
  {
    key: "facial_weakness",
    label: "New facial weakness",
    level: "same_day",
    title: "New facial weakness documented in this encounter",
    basis:
      "AAO-HNS Bell's palsy guidance (2013) covers grading of facial function and the documented assessment that excludes other causes; the urgency assigned here is an AMedix triage decision.",
    action:
      "Grade the facial nerve (House–Brackmann), record onset and progression, document eye-closure and eye-protection advice, and arrange same-day ENT review. Any treatment decision remains with the treating clinician.",
    sourceId: "aao_bells_palsy_2013",
    provenance: "clinical_recommendation",
    approvalRequired: true,
  },
  {
    key: "neurological_concern",
    label: "Concerning neurological symptoms — vision change, ophthalmoplegia, severe headache, meningism, altered consciousness",
    level: "immediate",
    title: "Concerning neurological symptoms documented in this encounter",
    basis:
      "No ENT guideline in the register covers these presentations as a group. Reading them alongside an ENT infection or a head and neck mass is an AMedix escalation prompt, not a diagnosis.",
    action:
      "Arrange immediate senior assessment and record the neurological findings, the time they were identified, who was contacted and the outcome. Do not wait to complete the note.",
    sourceId: null,
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  {
    key: "orbital_intracranial",
    label: "Suspected orbital or intracranial complication of an ENT infection",
    level: "immediate",
    title: "Orbital or intracranial complication suspected in this encounter",
    basis:
      "The AAO-HNS sinusitis guidelines address uncomplicated rhinosinusitis. Recognising a complicated infection is clinical, so the threshold and timing below are an AMedix triage decision and require ENT approval.",
    action:
      "Arrange immediate senior ENT assessment; record the clinical signs that raised the concern (periorbital swelling, proptosis, eye movement or vision change, meningism, focal deficit) and the receiving team. Imaging and antibiotic decisions are made by that team, not by this note.",
    sourceId: "aao_sinusitis_2025",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  {
    key: "neck_mass_malignancy",
    label: "Adult neck mass where malignancy cannot be excluded",
    level: "same_day",
    title: "Adult neck mass with malignancy not excluded",
    basis:
      "AAO-HNS neck mass guidance (2017) requires a documented evaluation of an adult neck mass rather than observation; the suspected-cancer pathway used here is a local decision.",
    action:
      "Record the mass site and character, the examination of the upper aerodigestive tract, the tissue-sampling plan, the pathway chosen (routine or urgent suspected-cancer) and who owns the result. This prompt does not diagnose malignancy.",
    sourceId: "aao_neck_mass_2017",
    provenance: "clinical_recommendation",
    approvalRequired: false,
  },
  {
    key: "dysphagia_aspiration",
    label: "Severe dysphagia, aspiration or inability to manage secretions",
    level: "same_day",
    title: "Dysphagia, aspiration or secretion problem documented in this encounter",
    basis:
      "Aspiration risk and the ability to manage secretions are clinical judgements; no AAO-HNS guideline in the register sets a threshold, so the timing is an AMedix triage decision.",
    action:
      "Record what is unsafe (solids, liquids, saliva), whether the airway is protected, and arrange same-day senior review with the appropriate team (ENT, speech and language therapy, respiratory). Feeding and airway decisions remain with the treating clinician.",
    sourceId: null,
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  {
    key: "postop_bleeding",
    label: "Significant post-operative bleeding or haematoma",
    level: "immediate",
    title: "Post-operative bleeding or haematoma documented in this encounter",
    basis:
      "AAO-HNS chronic rhinosinusitis surgery guidance (2025) and tympanostomy guidance (2022) treat bleeding as a recognised post-operative event; the threshold for immediate review here is an AMedix triage decision.",
    action:
      "Arrange immediate senior ENT / surgical review (a neck haematoma can obstruct the airway), record the estimated loss, the wound or pack status and who attended. Do not wait for the note to be completed.",
    sourceId: "aao_crs_surgery_2025",
    provenance: "clinical_recommendation",
    approvalRequired: true,
  },
  {
    key: "other_serious",
    label: "Other serious complication — describe below",
    level: "same_day",
    title: "Other serious complication documented in this encounter",
    basis: "Recorded by the clinician for this encounter.",
    action: "Record the concern, the assessment arranged and who was contacted.",
    sourceId: null,
    provenance: "documentation_practice",
    approvalRequired: false,
  },
];

const CONCERN_PROMPTS = ENT_SAFETY_CONCERNS.map((c) => ({
  key: c.key,
  level: c.level,
  title: c.title,
  basis: c.basis,
  action: c.action,
  source: sourceOf(c.sourceId),
  provenance: c.provenance,
  approvalRequired: c.approvalRequired,
}));

// ---- Prompts derived from structured findings in this note ------------------
// Each entry returns a prompt or null. `evidence` is the documented value that
// triggered it, quoted so the record shows exactly what was relied on.
const FROM_VALUES = [
  // Airway — the highest-priority finding in any ENT note.
  (v) =>
    has(v.red_flags, "Airway compromise / stridor")
      ? { key: "airway_obstruction", evidence: `Red flags: ${v.red_flags}` }
      : null,
  (v) =>
    has(v.airway_symptoms, "Stridor at rest")
      ? { key: "airway_obstruction", evidence: `Airway symptoms: ${v.airway_symptoms}` }
      : null,
  (v) =>
    v.airway_assessment === "Compromised airway at rest"
      ? { key: "airway_obstruction", evidence: `Airway assessment: ${v.airway_assessment}` }
      : null,
  (v) =>
    has(v.red_flags, "Stridor at rest", "Apnoea with cyanosis")
      ? { key: "airway_obstruction", evidence: `Red flags: ${v.red_flags}` }
      : null,
  (v) =>
    examValue(v, "neck", "larynx") === "Stridor"
      ? { key: "airway_obstruction", evidence: "ENT examination — larynx: Stridor" }
      : null,
  (v) =>
    examValue(v, "neck", "neck_mass").startsWith("Present")
      ? {
          key: "neck_mass_malignancy",
          evidence: `ENT examination — neck mass: ${examValue(v, "neck", "neck_mass")}`,
        }
      : null,
  (v) =>
    examValue(v, "throat", "pharynx") === "Lesion seen" || examValue(v, "nose", "nasal_endoscopy") === "Mass / lesion"
      ? {
          key: "neck_mass_malignancy",
          evidence: `ENT examination — ${examValue(v, "nose", "nasal_endoscopy") === "Mass / lesion" ? "nasal endoscopy: Mass / lesion" : "pharynx: Lesion seen"}`,
        }
      : null,

  // Airway — narrower, same-day findings.
  (v) =>
    has(v.airway_symptoms, "Exertional stridor", "Voice change with breathlessness")
      ? { key: "airway_exertional", evidence: `Airway symptoms: ${v.airway_symptoms}` }
      : null,
  (v) =>
    v.airway_assessment === "Compromised airway on exertion only"
      ? { key: "airway_exertional", evidence: `Airway assessment: ${v.airway_assessment}` }
      : null,
  (v) =>
    has(v.red_flags, "Rapidly progressive swelling")
      ? { key: "airway_exertional", evidence: `Red flags: ${v.red_flags}` }
      : null,
  (v) =>
    has(v.neck_palpation, "Laryngeal crepitus lost")
      ? { key: "airway_exertional", evidence: `Neck palpation: ${v.neck_palpation}` }
      : null,
  (v) =>
    examValue(v, "neck", "laryngeal_view") === "Vocal cord immobility"
      ? { key: "airway_exertional", evidence: "ENT examination — laryngeal view: Vocal cord immobility" }
      : null,

  // Bleeding.
  (v) =>
    has(v.red_flags, "Uncontrolled bleeding")
      ? { key: "epistaxis_uncontrolled", evidence: `Red flags: ${v.red_flags}` }
      : null,
  (v) =>
    v.epistaxis === "Severe or prolonged"
      ? { key: "epistaxis_uncontrolled", evidence: `Epistaxis: ${v.epistaxis}` }
      : null,
  (v) =>
    v.epistaxis === "Severe or prolonged" && /anticoagulant|coagulopathy|both/i.test(v.bleeding_risk || "")
      ? {
          key: "bleeding_risk_factor",
          evidence: `Epistaxis: ${v.epistaxis} · Bleeding risk factors: ${v.bleeding_risk}`,
        }
      : null,

  // Ear — sudden loss, facial nerve, vestibular red flags.
  (v) =>
    v.onset === "Sudden" && /reported/i.test(v.hearing_loss || "")
      ? {
          key: "sudden_hearing_loss",
          title: `Sudden hearing loss reported${hearingSideOf(v)}`,
          evidence: `Onset: ${v.onset} · Hearing loss: ${v.hearing_loss}`,
        }
      : null,
  (v) =>
    v.facial_weakness === "Present — new"
      ? {
          key: "facial_weakness",
          title: `New facial weakness documented${sideOf(v)}`,
          evidence: `Facial weakness: ${v.facial_weakness}`,
        }
      : null,
  (v) =>
    /^(V|VI)/.test(v.facial_nerve_grade || "")
      ? {
          key: "facial_weakness",
          title: `Facial nerve function graded ${v.facial_nerve_grade}`,
          evidence: `House–Brackmann: ${v.facial_nerve_grade}`,
        }
      : null,
  (v) => (/^VI/.test(examValue(v, "ear", "facial_nerve")) ? { key: "facial_weakness", evidence: `ENT examination — facial nerve: ${examValue(v, "ear", "facial_nerve")}` } : null),
  (v) =>
    v.tinnitus === "Present — pulsatile"
      ? {
          key: "pulsatile_tinnitus",
          evidence: `Tinnitus: ${v.tinnitus}`,
        }
      : null,

  // Neurological and infection complications.
  (v) =>
    has(v.red_flags, "Cranial nerve deficit")
      ? { key: "neurological_concern", evidence: `Red flags: ${v.red_flags}` }
      : null,
  (v) =>
    /deficit|multiple/i.test(v.cranial_nerves || "")
      ? {
          key: "neurological_concern",
          evidence: `Cranial nerves: ${v.cranial_nerves}${v.cranial_nerve_detail ? ` — ${v.cranial_nerve_detail}` : ""}`,
        }
      : null,
  (v) =>
    has(v.red_flags, "Severe systemic illness")
      ? { key: "orbital_intracranial", evidence: `Red flags: ${v.red_flags}` }
      : null,
  (v) =>
    has(v.severity, "Severe") && has(v.facial_pain, "Present — severe")
      ? {
          key: "orbital_intracranial",
          evidence: `Severity: ${v.severity} · Facial pain: ${v.facial_pain}`,
        }
      : null,
  (v) =>
    examValue(v, "nose", "nasal_endoscopy") === "Purulence" && /severe/i.test(v.severity || "")
      ? {
          key: "orbital_intracranial",
          evidence: `Nasal endoscopy: Purulence · Severity: ${v.severity}`,
        }
      : null,

  // Swallowing and airway protection.
  (v) =>
    v.dysphagia === "Solids and liquids"
      ? { key: "dysphagia_aspiration", evidence: `Dysphagia: ${v.dysphagia}` }
      : null,
  (v) =>
    has(v.aspiration, "Frequent", "With every meal")
      ? { key: "dysphagia_aspiration", evidence: `Aspiration or choking episodes: ${v.aspiration}` }
      : null,

  // Neck mass and malignancy concern.
  (v) =>
    v.provisional_nature === "Malignancy cannot be excluded" &&
    (v.sample_plan === "Not yet indicated" || !String(v.pathway || "").trim())
      ? {
          key: "neck_mass_malignancy",
          evidence: `Provisional nature: ${v.provisional_nature}${v.sample_plan === "Not yet indicated" ? " · Tissue sampling: Not yet indicated" : " · Pathway not recorded"}`,
        }
      : null,
  (v) =>
    has(v.weight_loss, "More than 10% body weight")
      ? {
          key: "neck_mass_malignancy",
          evidence: `Unintentional weight loss: ${v.weight_loss}`,
        }
      : null,
  (v) =>
    v.histology_status === "Malignant"
      ? {
          key: "histology_malignant",
          evidence: "Histology result: Malignant",
        }
      : null,

  // Paediatric-specific.
  (v) =>
    v.apnoea === "Yes — described by caregiver"
      ? {
          key: "paediatric_apnoea",
          evidence: `Witnessed apnoea or pauses in breathing: ${v.apnoea}`,
        }
      : null,
  (v) =>
    has(v.severity, "Severe — growth, development or airway affected")
      ? {
          key: "paediatric_apnoea",
          evidence: `Severity / impact: ${v.severity}`,
        }
      : null,
];

// Prompts that only the derived findings create (no equivalent checkbox).
const DERIVED_ONLY = {
  airway_exertional: {
    level: "same_day",
    title: "Airway narrowing suspected from the documented findings",
    basis:
      "Stridor only on exertion, breathlessness with voice change, rapidly progressive swelling or an immobile vocal cord. No ENT guideline in the register defines the threshold, so the timing is an AMedix triage decision.",
    action:
      "Arrange same-day senior ENT assessment with airway examination, and record who was contacted and the plan agreed. Do not wait for the note to be completed if breathing changes.",
    sourceId: null,
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
  bleeding_risk_factor: {
    level: "same_day",
    title: "Epistaxis with a documented bleeding-risk factor",
    basis:
      "AAO-HNS epistaxis guidance (2020) treats anticoagulant and coagulopathy status as part of the documented assessment; the urgency assigned here is an AMedix triage decision.",
    action:
      "Record the bleeding-control measures taken and arrange same-day ENT review. Any decision about anticoagulation belongs to the treating team and the prescribing clinician — it is not made by this note.",
    sourceId: "aao_epistaxis_2020",
    provenance: "clinical_recommendation",
    approvalRequired: true,
  },
  pulsatile_tinnitus: {
    level: "same_day",
    title: "Pulsatile tinnitus documented",
    basis:
      "Pulsatile tinnitus is distinguished from non-pulsatile tinnitus in AAO-HNS tinnitus guidance (2026) and warrants a targeted assessment; the timing below is an AMedix triage decision.",
    action:
      "Record the character, side and timing, and arrange the targeted assessment agreed with the patient. No diagnosis is made by this prompt.",
    sourceId: "aao_tinnitus_2026",
    provenance: "clinical_recommendation",
    approvalRequired: true,
  },
  histology_malignant: {
    level: "documented",
    title: "Malignant histology recorded",
    basis: "AAO-HNS neck mass guidance (2017): a neck mass requires a documented evaluation and onward pathway.",
    action:
      "Record who discussed the result with the patient, the multidisciplinary team referral and who owns the next step. Staging and treatment are not prescribed here.",
    sourceId: "aao_neck_mass_2017",
    provenance: "clinical_recommendation",
    approvalRequired: false,
  },
  paediatric_apnoea: {
    level: "same_day",
    title: "Sleep-disordered breathing with witnessed apnoea documented",
    basis:
      "AAO-HNS tympanostomy guidance (2022) distinguishes sleep-disordered breathing from isolated otitis media with effusion; the timing below is an AMedix triage decision.",
    action:
      "Record how often the pauses occur, whether cyanosis or daytime symptoms were seen, and arrange same-day senior paediatric ENT review. Treatment is not prescribed here.",
    sourceId: "aao_tympanostomy_2022",
    provenance: "local_triage_decision",
    approvalRequired: true,
  },
};

const basePrompt = (key, overrides = {}) => {
  const concern = CONCERN_PROMPTS.find((p) => p.key === key);
  const derived = DERIVED_ONLY[key];
  const spec = concern || (derived ? { key, ...derived } : null);
  if (!spec) return null;
  return {
    key,
    level: spec.level,
    title: spec.title,
    basis: spec.basis,
    action: spec.action,
    provenance: spec.provenance,
    approvalRequired: Boolean(spec.approvalRequired),
    source: spec.source || (spec.sourceId ? sourceOf(spec.sourceId) : null),
    ...overrides,
  };
};

// Builds the prompts for this encounter. `concerns` are the ones the clinician
// selected; `values` is the note being written. Nothing is inferred from an
// unanswered field.
export function buildEntSafetyPrompts({ concerns = [], values = {} } = {}) {
  const map = new Map();
  const push = (prompt, evidence) => {
    if (!prompt) return;
    const existing = map.get(prompt.key);
    if (existing) {
      if (evidence && !existing.evidence.includes(evidence)) existing.evidence.push(evidence);
      if (prompt.title) existing.title = prompt.title;
      return;
    }
    map.set(prompt.key, { ...prompt, evidence: evidence ? [evidence] : [] });
  };

  (concerns || []).forEach((key) => {
    const prompt = basePrompt(key);
    if (prompt) push(prompt, "Selected in this encounter");
  });

  FROM_VALUES.forEach((rule) => {
    const found = rule(values || {});
    if (!found) return;
    const prompt = basePrompt(found.key, found.title ? { title: found.title } : {});
    if (prompt) push(prompt, found.evidence);
  });

  return [...map.values()].sort(
    (a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9)
  );
}

// Readable text stored with the note and printed in the PDF. The prompts that
// fired are stored with the note, so the saved record shows exactly what the
// clinician was shown rather than a recalculation from later edits.
export function formatEntSafety(value) {
  if (!value || typeof value !== "object") return "";
  const stored = Array.isArray(value.resolved) ? value.resolved : [];
  const actions = value.actions || {};
  const lines = [];

  if (stored.length === 0 && !String(value.other_concern || "").trim()) {
    lines.push(
      "No safety prompt triggered by the findings documented in this note — this is not a statement that no urgent problem exists."
    );
  } else {
    lines.push(`Safety prompts documented at the time of this note (${stored.length}):`);
    stored.forEach((p) => {
      const action = String(actions[p.key] || "").trim();
      lines.push(
        `[${p.level === "immediate" ? "ACT NOW" : p.level === "same_day" ? "SAME DAY" : "DOCUMENT"}] ${p.title}`
      );
      if (p.evidence && p.evidence.length) lines.push(`   Documented: ${p.evidence.join("; ")}`);
      lines.push(`   Basis: ${p.basis}`);
      if (p.source) lines.push(`   Source: ${p.source.organization} — ${p.source.title}, ${p.source.version} (${p.source.url}; verified ${p.source.verified})`);
      if (p.provenanceLabel) lines.push(`   Rule type: ${p.provenanceLabel}`);
      lines.push(`   Action taken: ${action || "NOT DOCUMENTED"}`);
    });
  }

  if (String(value.other_concern || "").trim())
    lines.push(`Other safety concern: ${String(value.other_concern).trim()}`);
  if (String(value.triage || "").trim()) lines.push(`Decision taken: ${String(value.triage).trim()}`);
  if (String(value.escalation || "").trim())
    lines.push(`Escalation and documented action: ${String(value.escalation).trim()}`);
  lines.push(
    "Clinical judgement remains with the treating clinician. These prompts do not diagnose, prescribe or order any test."
  );
  return lines.join("\n");
}

// Rules whose wording or timing needs a qualified ENT clinician to sign off
// before they are relied on in practice.
export const ENT_SAFETY_APPROVAL_REQUIRED = [
  ...CONCERN_PROMPTS.filter((p) => p.approvalRequired).map((p) => p.key),
  ...Object.entries(DERIVED_ONLY)
    .filter(([, r]) => r.approvalRequired)
    .map(([key]) => key),
];