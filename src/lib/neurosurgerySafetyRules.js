// Conditional decision support for the Neurosurgery notes.
//
// A prompt appears ONLY when the clinician selected the concern in this
// encounter or documented a structured finding that raises it. Nothing is
// derived from an unanswered field, and an empty panel is explicitly NOT
// reassurance. No prompt diagnoses, prescribes, orders or prioritises a
// patient, no prompt blocks saving the note, and none delays treatment.
//
// ATTRIBUTION RULES FOLLOWED HERE
//   - `source` names the specific published document a prompt's documentation
//     requirement follows, and carries that document's own population. It is
//     never a general "society says" claim.
//   - `variants` are used where the applicable source or population differs
//     (adult vs child, grading scale vs management guidance). Both are shown and
//     the clinician records which one was applied — no single recommendation is
//     presented as universal.
//   - `source: null` means the requirement is a local documentation standard
//     with no guideline attributed to it. Nothing is attached to a society to
//     make the row look sourced.

import { NSG_PROVENANCE, nsgReference } from "@/lib/neurosurgeryReferences";
import { nsgExamFlags } from "@/lib/neurosurgeryExam";

export { NSG_PROVENANCE };

export const NSG_SAFETY_CONCERNS = [
  { key: "raised_icp", label: "Raised intracranial pressure / herniation risk" },
  { key: "cord_compression", label: "Suspected spinal cord compression" },
  { key: "cauda_equina", label: "Cauda equina features" },
  { key: "anticoagulation", label: "Anticoagulant or antiplatelet before urgent surgery" },
  { key: "traumatic_haemorrhage", label: "Traumatic intracranial haemorrhage" },
  { key: "csf_leak", label: "CSF leak — cranial or spinal" },
  { key: "shunt", label: "Shunt or EVD malfunction / infection" },
  { key: "postop_haematoma", label: "Post-operative haematoma or swelling" },
  { key: "seizure", label: "Seizure — new or recurrent" },
  { key: "new_deficit", label: "New focal deficit on examination" },
  { key: "meningism", label: "Meningeal signs — infection or blood" },
  { key: "neurogenic_shock", label: "Neurogenic shock" },
  { key: "vasospasm", label: "Vasospasm after aneurysmal haemorrhage" },
  { key: "vte_timing", label: "VTE prophylaxis timing around neurosurgery" },
  { key: "steroid", label: "Steroid use — indication and taper" },
  { key: "wound", label: "Surgical site concern" },
  { key: "hydrocephalus", label: "Hydrocephalus — new or worsening" },
];

const text = (values, key) => String(values?.[key] ?? "").trim();

// GCS is stored as its three documented components; the total is only meaningful
// when all three were assessed (an intubated patient has no verbal score).
const gcsTotal = (values) => {
  const g = values?.gcs;
  if (!g || typeof g !== "object") return null;
  const part = (v) => {
    const n = parseInt(String(v || "").split(" — ")[0], 10);
    return Number.isFinite(n) ? n : null;
  };
  const e = part(g.eye);
  const v = part(g.verbal);
  const m = part(g.motor);
  if (e === null || v === null || m === null) return null;
  return e + v + m;
};

const has = (concerns, key) => (Array.isArray(concerns) ? concerns.includes(key) : false);
const isOneOf = (values, key, list) => list.includes(text(values, key));

const PUPIL_RISK = ["Asymmetrical — one pupil larger", "Fixed and dilated — unilateral", "Fixed and dilated — bilateral"];

const ALL_AGES = "Infants, children and adults";
const ADULT_TBI = "Adults with severe traumatic brain injury";

const RULES = [
  {
    key: "airway_icp",
    level: "immediate",
    title: "GCS 8 or less documented — airway and intracranial pressure risk",
    basis:
      "A total of 8 or less is the point at which airway protection and intracranial pressure management are considered. The total shown comes only from components the examiner recorded.",
    action:
      "Record who assessed the airway and consciousness, the decision taken, the time it was taken, and the observations that follow it.",
    provenance: "guideline",
    source: "nice_ng232",
    population: ALL_AGES,
    variants: [
      {
        source: "aans_tbi_4th",
        population: ADULT_TBI,
        note: "The AANS/CNS severe-TBI guideline is an adult guideline. In a child, apply the paediatric pathway and record it.",
      },
    ],
    when: (values, concerns) => (gcsTotal(values) !== null && gcsTotal(values) <= 8) || has(concerns, "raised_icp"),
  },
  {
    key: "pupils",
    level: "immediate",
    title: "Pupillary asymmetry or a fixed pupil documented",
    basis:
      "A pupil that differs from the other side, or is fixed and dilated, is a time-critical finding in head injury and in a deteriorating neurosurgical patient.",
    action:
      "Record the time the finding was identified, who was informed, the imaging arranged and the treatment given — documentation never waits for imaging.",
    provenance: "guideline",
    source: "nice_ng232",
    population: ALL_AGES,
    when: (values, concerns) => isOneOf(values, "pupils", PUPIL_RISK) || has(concerns, "raised_icp"),
  },
  {
    key: "deterioration",
    level: "immediate",
    title: "Neurological deterioration documented",
    basis:
      "A documented fall in consciousness, new focal deficit or new pupillary change requires a senior review and repeat imaging decision.",
    action:
      "Record the observation before and after, the time, the senior clinician informed, and the repeat scan decision with its time.",
    provenance: "safety",
    source: "aans_tbi_4th",
    population: ADULT_TBI,
    variants: [
      {
        source: "nice_ng232",
        population: ALL_AGES,
        note: "NICE NG232 defines the acute assessment and referral pathway for head injury at any age.",
      },
    ],
    when: (values) => text(values, "neuro_deterioration") === "Yes",
  },
  {
    key: "cord_compression",
    level: "immediate",
    title: "Suspected spinal cord compression",
    basis:
      "Cord compression with a neurological deficit is a time-critical presentation: the timing of decompression and of any steroid decision is a documented clinical decision.",
    action:
      "Record the level and grade documented, the time the deficit was recognised, imaging arranged, who was informed and the surgical decision.",
    provenance: "safety",
    source: null,
    population: "All ages — local documentation requirement; no guideline is attributed",
    when: (values, concerns) =>
      isOneOf(values, "cord_compression", ["Features present"]) || has(concerns, "cord_compression"),
  },
  {
    key: "cauda_equina",
    level: "immediate",
    title: "Cauda equina features documented",
    basis:
      "Saddle anaesthesia, new bladder or bowel dysfunction with bilateral radicular signs require urgent assessment and imaging.",
    action:
      "Record the features documented, the time, the imaging arranged and the surgical or transfer decision.",
    provenance: "guideline",
    source: "nice_ng59",
    population: "People over 16 years (NICE NG59 scope)",
    variants: [
      {
        source: null,
        population: "Children",
        note: "NICE NG59 does not cover children. Record the paediatric source applied instead of carrying the adult pathway across.",
      },
    ],
    when: (values, concerns) =>
      isOneOf(values, "cauda_equina", ["Features present"]) || has(concerns, "cauda_equina"),
  },
  {
    key: "anticoagulation",
    level: "immediate",
    title: "Anticoagulation not reversed before urgent neurosurgery",
    basis:
      "An unreversed anticoagulant in a patient needing urgent cranial or spinal surgery is a bleeding-risk decision that must be documented, including any reversal agent, dose and time.",
    action:
      "Record the agent, the last dose, what was given for reversal, the time, and the haematology or pharmacy advice taken.",
    provenance: "guideline",
    source: "nice_ng232",
    population: ALL_AGES,
    when: (values, concerns) =>
      isOneOf(values, "anticoag", ["Anticoagulated — not reversed", "Unknown"]) || has(concerns, "anticoagulation"),
  },
  {
    key: "traumatic_haemorrhage",
    level: "same_day",
    title: "Traumatic intracranial haemorrhage documented",
    basis:
      "An intracranial haemorrhage after injury requires a documented observation plan, repeat imaging decision and neurosurgical review, and the reversal plan where anticoagulated.",
    action:
      "Record the observation frequency, the repeat scan plan with its time, and the neurosurgical review taken.",
    provenance: "guideline",
    source: "nice_ng232",
    population: ALL_AGES,
    variants: [
      {
        source: "aans_tbi_4th",
        population: ADULT_TBI,
        note: "Where the adult severe-TBI evidence base is being applied, record that guideline rather than the age-inclusive pathway.",
      },
    ],
    when: (values, concerns) =>
      isOneOf(values, "cranial_ct", ["Traumatic intracranial haemorrhage", "Mass effect or midline shift"]) ||
      has(concerns, "traumatic_haemorrhage"),
  },
  {
    key: "csf_leak",
    level: "same_day",
    title: "CSF leak documented or suspected",
    basis:
      "A CSF leak carries a meningitis risk and a repair decision; a persisting leak after spinal surgery changes the mobilisation and wound plan.",
    action:
      "Record the site and character, the confirmation test used, whether antibiotics were started, and the repair or observation decision.",
    provenance: "safety",
    source: "nice_ng232",
    population: "Cranial CSF leak — infants, children and adults; a spinal leak is a local documentation requirement",
    when: (values, concerns) =>
      isOneOf(values, "csf_leak", ["Suspected", "Confirmed"]) ||
      isOneOf(values, "dural_tear", ["Persisting CSF leak"]) ||
      has(concerns, "csf_leak"),
  },
  {
    key: "shunt",
    level: "immediate",
    title: "Shunt or EVD malfunction documented or suspected",
    basis:
      "Shunt malfunction is time-critical: the imaging, the tapping result and the revision decision have to be recorded together.",
    action:
      "Record the symptoms, the imaging and shunt series, the tapping result, and the revision or observation decision with times.",
    provenance: "safety",
    source: "cns_pediatric_hydrocephalus",
    population: "Children with a shunt or CSF diversion device",
    variants: [
      {
        source: "ispn_guide",
        population: "Children",
        note: "The ISPN Guide is continuously updated expert guidance, not a graded guideline — record which source was applied.",
      },
      {
        source: null,
        population: "Adults",
        note: "Adult shunt and EVD malfunction follows the treating unit's protocol; record it.",
      },
    ],
    when: (values, concerns) =>
      isOneOf(values, "shunt_status", ["Suspected malfunction", "Confirmed malfunction"]) ||
      isOneOf(values, "hydrocephalus", ["Yes — with device malfunction"]) ||
      has(concerns, "shunt"),
  },
  {
    key: "postop_haematoma",
    level: "immediate",
    title: "Post-operative haematoma, swelling or new deficit documented",
    basis:
      "A post-operative collection or a new deficit after cranial or spinal surgery requires an immediate senior review and a repeat imaging decision.",
    action:
      "Record the time identified, the observations, who was informed, the imaging arranged and the return-to-theatre decision.",
    provenance: "safety",
    source: null,
    population: "All ages — local post-operative documentation requirement",
    when: (values, concerns) =>
      isOneOf(values, "wound_csf", ["Haematoma / swelling"]) ||
      isOneOf(values, "postop_neuro", ["New deficit — documented"]) ||
      has(concerns, "postop_haematoma"),
  },
  {
    key: "seizure",
    level: "documented",
    title: "Seizure documented",
    basis:
      "A seizure requires the semiology, the prophylaxis decision and the safety advice to be recorded; the driving and safety advice is a documented legal requirement in most jurisdictions.",
    action:
      "Record the semiology and duration, whether prophylaxis was started or continued, and the safety and driving advice given.",
    provenance: "guideline",
    source: "aans_tbi_4th",
    population: ADULT_TBI,
    variants: [
      {
        source: "nice_ng232",
        population: ALL_AGES,
        note: "Where the head-injury pathway is being applied to a child, record NICE NG232 as the source.",
      },
    ],
    when: (values, concerns) => isOneOf(values, "seizure", ["Yes — current encounter"]) || has(concerns, "seizure"),
  },
  {
    key: "vasospasm",
    level: "documented",
    title: "Vasospasm surveillance after aneurysmal haemorrhage not documented",
    basis:
      "After aneurysmal subarachnoid haemorrhage the surveillance plan for vasospasm and the nimodipine decision have to be recorded.",
    action:
      "Record the surveillance modality and frequency arranged and the nimodipine decision.",
    provenance: "guideline",
    source: "eso_eans_esmint_asah",
    population: "Adults with aneurysmal subarachnoid haemorrhage (European joint guideline)",
    variants: [
      {
        source: "wfns_sah_scale",
        population: "Adults with aneurysmal subarachnoid haemorrhage",
        note: "The WFNS scale records the clinical grade at presentation only — it sets no surveillance. Where the local protocol differs from the European guideline, record which was applied.",
      },
    ],
    when: (values, concerns) =>
      isOneOf(values, "vasospasm_monitoring", ["Not documented"]) || has(concerns, "vasospasm"),
  },
  {
    key: "vte_timing",
    level: "documented",
    title: "VTE prophylaxis timing after neurosurgery not documented",
    basis:
      "Mechanical and pharmacological prophylaxis after cranial or spinal surgery are timed against the bleeding risk; the timing decided has to be recorded.",
    action:
      "Record whether mechanical prophylaxis is in place and when pharmacological prophylaxis is planned or why it is deferred.",
    provenance: "safety",
    source: null,
    population: "All ages — local protocol; no guideline timing is attributed to this prompt",
    when: (values, concerns) =>
      isOneOf(values, "vte_prophylaxis", ["Not documented", "Started"]) || has(concerns, "vte_timing"),
  },
  {
    key: "steroid",
    level: "same_day",
    title: "Steroid given without a documented indication",
    basis:
      "Steroids are not indicated in traumatic brain injury and carry a real harm signal there; where they are given, the indication and the taper belong in the record.",
    action:
      "Record the indication, the dose, the planned taper and the review that follows.",
    provenance: "guideline",
    source: "nice_ng232",
    population: ALL_AGES,
    when: (values, concerns) =>
      isOneOf(values, "steroid", ["Given — no indication documented"]) || has(concerns, "steroid"),
  },
  {
    key: "hydrocephalus",
    level: "same_day",
    title: "Hydrocephalus documented — drainage decision required",
    basis:
      "New or worsening hydrocephalus requires a documented drainage or diversion decision and the observation plan that follows it.",
    action:
      "Record the imaging, the drainage decision (EVD, lumbar drain, shunt or observation), the time and who decided.",
    provenance: "safety",
    source: "cns_pediatric_hydrocephalus",
    population: "Children with hydrocephalus",
    variants: [
      {
        source: "ispn_guide",
        population: "Children",
        note: "Continuously updated expert guidance — record which source was applied.",
      },
      {
        source: null,
        population: "Adults, including normal-pressure hydrocephalus",
        note: "Adult hydrocephalus follows adult criteria; the source applied is recorded in this note.",
      },
    ],
    when: (values, concerns) =>
      isOneOf(values, "cranial_ct", ["Hydrocephalus"]) || has(concerns, "hydrocephalus"),
  },
  {
    key: "icp_target",
    level: "documented",
    title: "Intracranial pressure monitored without a documented target",
    basis:
      "Where ICP is monitored, the cerebral perfusion target and the treatment thresholds used are part of the record.",
    action:
      "Record the ICP and CPP targets applied and the treatment thresholds agreed with the treating team.",
    provenance: "guideline",
    source: "aans_tbi_4th",
    population: ADULT_TBI,
    when: (values) => text(values, "icp") === "Monitored — no target documented",
  },
  {
    key: "wound",
    level: "same_day",
    title: "Surgical site concern documented",
    basis:
      "Wound breakdown, infection or a CSF leak at the surgical site requires a documented review and management decision.",
    action:
      "Record the findings, the swab or imaging taken, the antibiotic decision and the review arranged.",
    provenance: "safety",
    source: null,
    population: "All ages — local surgical-site documentation requirement",
    when: (values, concerns) =>
      isOneOf(values, "wound_csf", ["CSF leak", "Infection suspected"]) || has(concerns, "wound"),
  },
  {
    key: "deteriorating_consciousness",
    level: "immediate",
    title: "Depressed or falling conscious level documented",
    basis:
      "A conscious level that is depressed, or lower than the previous observation, requires a senior review and a repeat imaging decision. The record carries the comparison, not just the number.",
    action:
      "Record the observation before and after, the time, who was informed, and the imaging or escalation decision that followed.",
    provenance: "guideline",
    source: "nice_ng232",
    population: ALL_AGES,
    variants: [
      {
        source: "aans_tbi_4th",
        population: ADULT_TBI,
        note: "Where the adult severe-TBI evidence base is applied, record that guideline as the source.",
      },
    ],
    when: (values, concerns) => {
      const consciousness = String(values?.nsg_exam?.consciousness || "");
      const depressed = [
        "Drowsy — rousable",
        "Responds to voice",
        "Responds to pain",
        "Unresponsive",
      ].includes(consciousness);
      return depressed || text(values, "conscious_trend") === "Deteriorating" || has(concerns, "new_deficit");
    },
  },
  {
    key: "fixed_pupil",
    level: "immediate",
    title: "Fixed pupil or pupillary asymmetry documented",
    basis:
      "A pupil that is fixed, or differs from the other side by a millimetre or more, is a time-critical finding in a raised-pressure or post-operative patient.",
    action:
      "Record the time the finding was identified, the observation before it, who was informed, the imaging arranged and the treatment given.",
    provenance: "guideline",
    source: "nice_ng232",
    population: ALL_AGES,
    when: (values) => {
      const flags = nsgExamFlags(values?.nsg_exam);
      return flags.fixed_pupil || flags.pupil_asymmetry;
    },
  },
  {
    key: "meningism",
    level: "same_day",
    title: "Meningeal signs documented — blood or infection in the subarachnoid space",
    basis:
      "Meningeal signs require the CT decision, the lumbar puncture decision and its timing, and — where blood is documented — the vascular study, all recorded together.",
    action:
      "Record the CT finding, the lumbar puncture decision and timing, the antibiotic or antiviral decision, and the vascular imaging arranged.",
    provenance: "guideline",
    source: "eso_eans_esmint_asah",
    population: "Adults with suspected subarachnoid haemorrhage (European joint guideline)",
    variants: [
      {
        source: null,
        population: "Suspected CNS infection",
        note: "Infection follows the local protocol; no guideline is attributed to it here.",
      },
    ],
    when: (values, concerns) => nsgExamFlags(values?.nsg_exam).meningism || has(concerns, "meningism"),
  },
  {
    key: "new_deficit",
    level: "same_day",
    title: "Focal weakness documented on examination",
    basis:
      "A documented focal deficit needs a comparison with the previous examination, a senior review and an imaging or escalation decision — the grade alone is not the record.",
    action:
      "Record the grade documented, the grade at the previous examination, the time, who reviewed the patient and the decision taken.",
    provenance: "safety",
    source: null,
    population: "All ages — local documentation requirement; no guideline is attributed to this prompt",
    when: (values, concerns) =>
      nsgExamFlags(values?.nsg_exam).weakness_recorded || has(concerns, "new_deficit"),
  },
  {
    key: "cord_syndrome",
    level: "immediate",
    title: "Spinal cord syndrome documented — level, completeness and timing",
    basis:
      "Where a cord syndrome is documented, the neurological level, the completeness and the timing of decompression are the core of the record.",
    action:
      "Record the ISNCSCI levels and AIS grade, the time the deficit was recognised, the imaging arranged, who was informed and the decompression decision.",
    provenance: "guideline",
    source: "isncsci_2019",
    population: "Adults and children with spinal cord injury",
    when: (values, concerns) =>
      Boolean(text(values, "cord_syndrome")) || has(concerns, "cord_compression"),
  },
  {
    key: "neurogenic_shock",
    level: "immediate",
    title: "Neurogenic shock documented or suspected",
    basis:
      "Bradycardia with hypotension after a cervical or high thoracic cord injury is neurogenic shock; the pressure target and the vasopressor decision belong in the record.",
    action:
      "Record the pressure target, the fluid and vasopressor decision, the time it was taken and who was informed.",
    provenance: "safety",
    source: null,
    population: "All ages — local documentation requirement; no guideline is attributed to this prompt",
    when: (values, concerns) =>
      isOneOf(values, "neurogenic_shock", ["Suspected", "Confirmed"]) || has(concerns, "neurogenic_shock"),
  },
  {
    key: "facial_nerve",
    level: "documented",
    title: "Facial nerve palsy documented — eye protection required",
    basis:
      "Incomplete eye closure carries a corneal exposure risk; the eye-care measures and the review arranged belong in the record.",
    action:
      "Record the House–Brackmann grade, the eye-care measures given, the referral made and the review arranged.",
    provenance: "guideline",
    source: "house_brackmann_1985",
    population: "Patients with facial nerve palsy",
    when: (values) => isOneOf(values, "facial_nerve", ["Involved — graded below"]),
  },
];

// A source is shown with its own population and attribution state, so a reader
// can see exactly which document and which patient group it covers.
const resolveSource = (key) => {
  const doc = nsgReference(key);
  if (!doc) return null;
  return {
    organization: doc.organization,
    version: doc.version,
    title: doc.title,
    edition: doc.edition,
    published: doc.published,
    population: doc.population,
    attribution: doc.attribution,
    url: doc.url,
  };
};

const resolveVariant = (variant) => ({
  population: variant.population,
  note: variant.note,
  source: variant.source ? resolveSource(variant.source) : null,
});

export const buildNeurosurgerySafetyPrompts = ({ concerns = [], values = {} } = {}) =>
  RULES.filter((rule) => {
    try {
      return rule.when(values || {}, concerns);
    } catch {
      return false;
    }
  }).map((rule) => {
    const evidence = [];
    if (gcsTotal(values)) evidence.push(`GCS ${gcsTotal(values)}`);
    ["pupils", "anticoag", "cranial_ct", "cord_compression", "cauda_equina", "csf_leak", "shunt_status", "wound_csf", "postop_neuro", "cord_syndrome", "neurogenic_shock", "facial_nerve", "lesion_type", "condition"].forEach(
      (key) => {
        const v = text(values, key);
        if (v && !/^(No|None|Not documented|No features|Symmetrical and reactive|None documented)$/i.test(v)) {
          evidence.push(v);
        }
      }
    );
    return {
      key: rule.key,
      level: rule.level,
      title: rule.title,
      basis: rule.basis,
      action: rule.action,
      evidence,
      provenance: rule.provenance,
      provenanceLabel: NSG_PROVENANCE[rule.provenance] || "",
      population: rule.population,
      source: resolveSource(rule.source),
      variants: (rule.variants || []).map(resolveVariant),
    };
  });

export const NSG_SAFETY_RULE_COUNT = RULES.length;