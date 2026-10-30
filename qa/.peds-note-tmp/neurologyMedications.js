// Neurology — medication, allergy, contraindication and interaction safety layer.
//
// WHAT THIS FILE IS
// The documentation and advisory engine behind the Neurology medication record. It
// structures what the prescriber recorded — the medicine, the dose actually given or
// prescribed, route, frequency, timing, indication, response and adverse effects —
// and compares it against the allergy review, the contraindication facts the
// clinician documented, the interactions between the recorded medicines and the
// monitoring each high-alert neurology class requires.
//
// WHAT IT DOES NOT DO
// It does not prescribe, does not calculate or adjust a dose, and does not decide
// that a medicine is safe. Every alert is advisory and names the documented values
// it read. A blank field is never read as normal: an allergy that was not
// established stays "not established" and a fact that was not documented stays
// "not documented", and both are reported as owed rather than assumed absent.
//
// PROVENANCE
//   · guideline — the requirement is stated in the cited document.
//   · label — a pharmacology or product-label check: the prescriber and pharmacist
//     verify the current label before the medicine is given. AMedix makes no
//     guideline claim for these, and no dose is quoted anywhere in this file.

import { asObject, str } from "./neurologyFieldKit.js";
import { NEURO_REFERENCES } from "./neurologyReferences.js";

export const NEURO_MEDICATION_STATE_KEY = "neuro_medications";

export const NEURO_MEDICATION_SPEC = {
  title: "Neurology medication safety record",
  note: "Records each medicine with the dose actually given or prescribed, its route, frequency and timing, the indication, the response observed and any adverse effect. Advisory only: it does not prescribe, does not calculate a dose and does not replace the prescriber or the pharmacist. Every dose, contraindication and interaction is verified against the current product label and the patient's own record before administration. A field left blank prints as NOT DOCUMENTED — it is never read as normal.",
};

export const NEURO_ROUTES = [
  "Oral",
  "Intravenous",
  "Intramuscular",
  "Subcutaneous",
  "Intranasal",
  "Buccal",
  "Rectal",
  "Enteral tube",
  "Topical",
  "Inhalation",
  "Other",
];

export const NEURO_FREQUENCIES = [
  "Single dose",
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 8 hours",
  "Every 12 hours",
  "Weekly",
  "As needed (PRN)",
  "Continuous infusion",
  "Other",
];

export const NEURO_TIMING = [
  "Time-critical — documented time given",
  "Morning",
  "With meals",
  "Before meals",
  "After meals",
  "At bedtime",
  "Not applicable",
  "Not documented",
];

export const NEURO_ALLERGY_STATES = [
  "No known allergies recorded in the patient record",
  "Allergies recorded in the patient record — reviewed before these medicines",
  "Allergy status not established — review not possible",
  "Not documented",
];

export const NEURO_INTERACTION_REVIEW_STATES = [
  "Interactions reviewed — conclusion documented below",
  "Interactions review not performed",
  "Not documented",
];

export const NEURO_ADVERSE_ACTION_STATES = [
  "Medicine stopped",
  "Dose changed by the prescriber",
  "Medicine continued with monitoring",
  "Treated and continued",
  "Escalated to a senior clinician",
  "Not documented",
];

// ---- High-alert neurology classes ---------------------------------------
// `focus` states what must be documented for the class; `monitoring` names the
// parameters that must be followed. Neither states a dose or a target.
export const NEURO_MED_CLASSES = [
  {
    key: "thrombolytic",
    label: "Reperfusion therapy (thrombolytic)",
    provenance: "guideline",
    sourceId: "aha_ais_2019",
    focus: [
      "Time last known well and the time of administration both recorded",
      "Contraindication review recorded before administration",
      "Blood pressure and glucose at the point of treatment recorded",
      "Anticoagulant status recorded, including the last dose",
      "Post-treatment neurological observations and bleeding checks recorded",
    ],
    monitoring: ["Blood pressure", "Neurological observations", "Bleeding signs", "Repeat imaging when indicated"],
  },
  {
    key: "anticoagulant_reversal",
    label: "Anticoagulant reversal",
    provenance: "guideline",
    sourceId: "aha_ich_2022",
    focus: [
      "The anticoagulant and the time of its last dose recorded",
      "The reversal agent used and the time given recorded",
      "The coagulation result used to judge reversal recorded",
      "Repeat imaging and the clinical response recorded",
    ],
    monitoring: ["Coagulation results", "Repeat imaging", "Neurological observations", "Bleeding signs"],
  },
  {
    key: "anticoagulant",
    label: "Anticoagulant therapy",
    provenance: "guideline",
    sourceId: "aha_secondary_prevention_2021",
    focus: [
      "Indication recorded (for example atrial fibrillation or venous thromboembolism)",
      "Agent and dose checked against renal function, age, weight and interacting medicines",
      "Bleeding risk documented with the reason for any deviation",
      "Adherence and the last dose before any procedure recorded",
      "Reversal plan documented for an emergency",
    ],
    monitoring: ["Renal function", "INR where a vitamin K antagonist is used", "Haemoglobin", "Bleeding signs"],
  },
  {
    key: "antiplatelet",
    label: "Antiplatelet therapy",
    provenance: "guideline",
    sourceId: "aha_secondary_prevention_2021",
    focus: [
      "Indication and planned duration documented",
      "Bleeding risk assessed and documented",
      "Gastroprotection considered where bleeding risk is high",
    ],
    monitoring: ["Bleeding signs", "Haemoglobin", "Adherence"],
  },
  {
    key: "antiseizure",
    label: "Antiseizure medicine",
    provenance: "guideline",
    sourceId: "ilae_epilepsy_2017",
    focus: [
      "Seizure type and epilepsy syndrome the medicine is chosen for documented",
      "Adherence and missed doses documented",
      "Sedation, rash, dizziness and behavioural adverse effects asked about and recorded",
      "Plasma level recorded where the medicine is one that is monitored",
      "Counselling about pregnancy and teratogenicity recorded where it applies",
    ],
    monitoring: ["Seizure frequency", "Adherence", "Adverse effects", "Plasma level where monitored"],
  },
  {
    key: "acute_seizure_rescue",
    label: "Acute seizure (rescue) medicine",
    provenance: "guideline",
    sourceId: "ilae_status_2015",
    focus: [
      "The time the medicine was given recorded against the time the seizure started",
      "Route and dose recorded as given",
      "Response at a documented time recorded, including whether the seizure continued",
      "Repeat dose and escalation decision recorded",
      "Breathing and oxygenation observed and recorded after administration",
    ],
    monitoring: ["Seizure cessation", "Airway and breathing", "Oxygenation", "Consciousness"],
  },
  {
    key: "corticosteroid_immunotherapy",
    label: "Corticosteroid or immunotherapy",
    provenance: "guideline",
    sourceId: "aan_ms",
    focus: [
      "Indication and planned course documented",
      "Weight-based dose recorded as prescribed and verified",
      "Glucose, blood pressure and infection screening recorded",
      "Response to the course and adverse effects recorded",
    ],
    monitoring: ["Glucose", "Blood pressure", "Infection signs", "Mood and sleep"],
  },
  {
    key: "migraine_acute",
    label: "Acute migraine therapy (triptan, ergot, analgesic)",
    provenance: "label",
    sourceId: "ichd3",
    focus: [
      "Cardiovascular contraindication screening recorded before a triptan or ergot",
      "Dose limit over 24 hours recorded as given",
      "Analgesic overuse documented (frequency of use per month)",
      "Pregnancy status considered where it applies",
    ],
    monitoring: ["Pain response at a documented time", "Frequency of use", "Cardiovascular symptoms"],
  },
  {
    key: "dopaminergic",
    label: "Dopaminergic therapy",
    provenance: "label",
    sourceId: "local",
    focus: [
      "Timing relative to meals and the time of dose recorded",
      "Motor response and wearing-off documented",
      "Dyskinesia and impulse-control adverse effects asked about and recorded",
      "Adherence and missed doses documented",
    ],
    monitoring: ["Motor response", "Dyskinesia", "Impulse-control symptoms", "Postural blood pressure"],
  },
  {
    key: "neuromuscular",
    label: "Neuromuscular therapy (for example pyridostigmine)",
    provenance: "label",
    sourceId: "local",
    focus: [
      "Response to the dose recorded with the time it was assessed",
      "Cholinergic adverse effects recorded (secretions, cramping, diarrhoea)",
      "Respiratory status recorded alongside the dose",
      "Dose timing recorded against symptoms",
    ],
    monitoring: ["Respiratory function", "Secretions", "Muscle strength", "Adverse effects"],
  },
];

export const NEURO_MED_CLASS_MAP = NEURO_MED_CLASSES.reduce((acc, c) => ({ ...acc, [c.key]: c }), {});

const DRUG_KEYWORDS = [
  { classKey: "thrombolytic", words: ["alteplase", "tenecteplase", "reteplase", "thrombolysis", "thrombolytic"] },
  {
    classKey: "anticoagulant",
    words: [
      "warfarin",
      "apixaban",
      "rivaroxaban",
      "dabigatran",
      "edoxaban",
      "enoxaparin",
      "dalteparin",
      "tinzaparin",
      "heparin",
      "acenocoumarol",
      "phenindione",
    ],
  },
  { classKey: "antiplatelet", words: ["aspirin", "clopidogrel", "ticagrelor", "prasugrel", "dipyridamole", "cilostazol"] },
  {
    classKey: "antiseizure",
    words: [
      "levetiracetam",
      "valproate",
      "valproic",
      "carbamazepine",
      "oxcarbazepine",
      "lamotrigine",
      "phenytoin",
      "fosphenytoin",
      "lacosamide",
      "topiramate",
      "zonisamide",
      "perampanel",
      "brivaracetam",
      "phenobarbital",
      "primidone",
      "gabapentin",
      "pregabalin",
      "clobazam",
      "ethosuximide",
    ],
  },
  { classKey: "acute_seizure_rescue", words: ["midazolam", "diazepam", "lorazepam", "clonazepam", "paraldehyde"] },
  {
    classKey: "corticosteroid_immunotherapy",
    words: ["methylprednisolone", "prednisolone", "prednisone", "dexamethasone", "hydrocortisone", "immunoglobulin", "ivig", "plasma exchange", "rituximab"],
  },
  { classKey: "migraine_acute", words: ["sumatriptan", "rizatriptan", "eletriptan", "zolmitriptan", "almotriptan", "frovatriptan", "naratriptan", "ergotamine", "dihydroergotamine"] },
  { classKey: "dopaminergic", words: ["levodopa", "carbidopa", "benserazide", "pramipexole", "ropinirole", "rotigotine", "rasagiline", "selegiline", "amantadine", "entacapone"] },
  { classKey: "neuromuscular", words: ["pyridostigmine", "neostigmine", "ambenonium"] },
];

export const classifyNeuroDrug = (name) => {
  const n = str(name).toLowerCase();
  if (!n) return null;
  const hit = DRUG_KEYWORDS.find((r) => r.words.some((w) => n.includes(w)));
  return hit ? hit.classKey : null;
};

// ---- Allergy cross-reactivity -------------------------------------------
// Fires only when the clinician recorded the allergen AND a matching medicine.
export const NEURO_ALLERGY_RULES = [
  {
    key: "aromatic_antiseizure_cross_reactivity",
    allergens: ["carbamazepine", "oxcarbazepine", "phenytoin", "fosphenytoin", "lamotrigine", "phenobarbital"],
    drugs: ["carbamazepine", "oxcarbazepine", "phenytoin", "fosphenytoin", "lamotrigine", "phenobarbital", "primidone"],
    risk: "A reaction to one aromatic antiseizure medicine is associated with cross-reactivity to the others in this group, including severe cutaneous reactions.",
    action:
      "Confirm the reaction and its severity from the record, verify the choice against the current product label, and document the reasoning for the medicine chosen.",
    provenance: "label",
  },
  {
    key: "zonisamide_sulfonamide",
    allergens: ["sulfonamide", "sulfa", "co-trimoxazole", "trimethoprim", "sulfasalazine"],
    drugs: ["zonisamide"],
    risk: "Zonisamide is a sulfonamide derivative; a documented sulfonamide reaction is relevant to the decision.",
    action: "Verify against the current product label and document the reasoning for the medicine chosen.",
    provenance: "label",
  },
  {
    key: "penicillin_ceftriaxone",
    allergens: ["penicillin", "amoxicillin", "ampicillin"],
    drugs: ["ceftriaxone", "cefotaxime", "cefepime"],
    risk: "Cephalosporins share a beta-lactam structure; cross-reactivity is possible and its likelihood depends on the documented reaction.",
    action: "Confirm the documented reaction, verify against the current product label, and record the medicine chosen and why.",
    provenance: "label",
  },
];

// ---- Interactions -------------------------------------------------------
// Pair rules between two recorded medicines. Direction-agnostic.
const ANTICOAG_WORDS = ["warfarin", "apixaban", "rivaroxaban", "dabigatran", "edoxaban", "enoxaparin", "heparin", "acenocoumarol"];
const ANTIPLATELET_WORDS = ["aspirin", "clopidogrel", "ticagrelor", "prasugrel"];
const INDUCER_WORDS = ["carbamazepine", "phenytoin", "fosphenytoin", "phenobarbital", "primidone", "rifampicin", "St John"];
const TRIPTAN_WORDS = ["sumatriptan", "rizatriptan", "eletriptan", "zolmitriptan", "almotriptan", "frovatriptan", "naratriptan"];
const SEROTONERGIC_WORDS = [
  "sertraline",
  "fluoxetine",
  "paroxetine",
  "citalopram",
  "escitalopram",
  "fluvoxamine",
  "venlafaxine",
  "duloxetine",
  "amitriptyline",
  "nortriptyline",
  "tramadol",
  "linezolid",
  "methylphenidate",
];

export const NEURO_INTERACTION_RULES = [
  {
    key: "valproate_lamotrigine",
    a: ["valproate", "valproic"],
    b: ["lamotrigine"],
    risk: "Valproate raises lamotrigine exposure; the combination is associated with a higher risk of serious rash, including Stevens-Johnson syndrome.",
    action: "Verify the prescribed regimen against the current product label before the next dose, and document the conclusion.",
    provenance: "label",
  },
  {
    key: "enzyme_inducer_anticoagulant",
    a: INDUCER_WORDS,
    b: ANTICOAG_WORDS,
    risk: "Enzyme-inducing antiseizure medicines reduce the exposure of several anticoagulants, so anticoagulant effect may be lost.",
    action: "Verify the interaction and the monitoring plan against the current product label and document the conclusion.",
    provenance: "label",
  },
  {
    key: "anticoagulant_antiplatelet",
    a: ANTICOAG_WORDS,
    b: ANTIPLATELET_WORDS,
    risk: "Combined anticoagulant and antiplatelet therapy increases bleeding risk, including intracranial bleeding.",
    action: "Record the indication for each agent, the planned duration and the bleeding-risk review.",
    provenance: "label",
  },
  {
    key: "triptan_serotonergic",
    a: TRIPTAN_WORDS,
    b: SEROTONERGIC_WORDS,
    risk: "Triptans with a serotonergic medicine carry a risk of serotonin syndrome.",
    action: "Verify against the current product label, record the symptoms the patient must report, and document the conclusion.",
    provenance: "label",
  },
  {
    key: "ergot_triptan",
    a: ["ergotamine", "dihydroergotamine"],
    b: TRIPTAN_WORDS,
    risk: "Ergot alkaloids and triptans together cause additive vasoconstriction; the combination is generally avoided within the label's interval.",
    action: "Verify the required interval against the current product label and document the conclusion.",
    provenance: "label",
  },
  {
    key: "corticosteroid_anticoagulant",
    a: ["methylprednisolone", "prednisolone", "prednisone", "dexamethasone"],
    b: ANTICOAG_WORDS,
    risk: "Corticosteroids with an anticoagulant increase gastrointestinal bleeding risk.",
    action: "Record the gastroprotection and monitoring decision.",
    provenance: "label",
  },
  {
    key: "valproate_aspirin",
    a: ["valproate", "valproic"],
    b: ["aspirin"],
    risk: "Aspirin can displace valproate and raise its free fraction.",
    action: "Verify against the current product label and document the monitoring decision.",
    provenance: "label",
  },
];

// ---- Contraindication facts ---------------------------------------------
// Only facts the clinician documented as present ("Yes") raise an alert. "Not
// documented" is reported as owed, never treated as absent.
export const NEURO_CONTRAINDICATION_FACTS = [
  { key: "therapeutic_anticoagulation", label: "Therapeutic anticoagulation at presentation" },
  { key: "recent_surgery", label: "Surgery, biopsy or invasive procedure within the documented window" },
  { key: "previous_ich", label: "Previous intracranial haemorrhage" },
  { key: "cardiac_ischaemia", label: "Ischaemic heart disease, coronary vasospasm or previous myocardial infarction" },
  { key: "uncontrolled_hypertension", label: "Uncontrolled hypertension documented" },
  { key: "pregnancy", label: "Pregnancy documented" },
  { key: "renal_impairment", label: "Renal impairment documented" },
  { key: "hepatic_impairment", label: "Hepatic impairment documented" },
];

export const NEURO_CONTRAINDICATION_RULES = [
  {
    key: "thrombolytic_anticoagulated",
    drugs: DRUG_KEYWORDS[0].words,
    fact: "therapeutic_anticoagulation",
    provenance: "guideline",
    sourceId: "aha_ais_2019",
    message:
      "A thrombolytic is recorded while therapeutic anticoagulation is documented. Reperfusion eligibility requires the contraindication review to be recorded and the decision attributed to a qualified clinician.",
  },
  {
    key: "thrombolytic_recent_surgery",
    drugs: DRUG_KEYWORDS[0].words,
    fact: "recent_surgery",
    provenance: "guideline",
    sourceId: "aha_ais_2019",
    message:
      "A thrombolytic is recorded with recent surgery or an invasive procedure documented. The contraindication review and the recorded decision must be in the note.",
  },
  {
    key: "thrombolytic_previous_ich",
    drugs: DRUG_KEYWORDS[0].words,
    fact: "previous_ich",
    provenance: "guideline",
    sourceId: "aha_ais_2019",
    message:
      "A thrombolytic is recorded with a previous intracranial haemorrhage documented. The contraindication review and the recorded decision must be in the note.",
  },
  {
    key: "anticoagulant_previous_ich",
    drugs: ANTICOAG_WORDS,
    fact: "previous_ich",
    provenance: "guideline",
    sourceId: "aha_ich_2022",
    message:
      "An anticoagulant is recorded with a previous intracranial haemorrhage documented. The indication, the bleeding-risk review and the decision must be recorded.",
  },
  {
    key: "triptan_cardiac",
    drugs: TRIPTAN_WORDS,
    fact: "cardiac_ischaemia",
    provenance: "label",
    message: "A triptan is recorded with ischaemic heart disease documented — a labelled contraindication. Verify against the current product label and record the decision.",
  },
  {
    key: "triptan_hypertension",
    drugs: TRIPTAN_WORDS,
    fact: "uncontrolled_hypertension",
    provenance: "label",
    message: "A triptan is recorded with uncontrolled hypertension documented. Verify against the current product label and record the decision.",
  },
  {
    key: "valproate_pregnancy",
    drugs: ["valproate", "valproic"],
    fact: "pregnancy",
    provenance: "label",
    message:
      "Valproate is recorded with pregnancy documented. Valproate carries a recognised teratogenic risk; the counselling given and the reasoning for the medicine chosen must be recorded.",
  },
];

// ---- State --------------------------------------------------------------
export const emptyNeurologyMedications = () => ({
  entries: [],
  allergy_status: "",
  allergens: "",
  allergy_verified_by: "",
  facts: {},
  interactions_reviewed: "",
  interactions_conclusion: "",
  class_reviews: {},
  no_medications: false,
  not_assessed: false,
});

export const neurologyMedicationsState = (value) => {
  const base = emptyNeurologyMedications();
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  return {
    ...base,
    ...value,
    entries: Array.isArray(value.entries) ? value.entries.filter((e) => e && typeof e === "object") : [],
    facts: asObject(value.facts),
    class_reviews: asObject(value.class_reviews),
  };
};

export const emptyNeuroMedicationEntry = () => ({
  name: "",
  dose: "",
  route: "",
  frequency: "",
  timing: "",
  given_datetime: "",
  indication: "",
  response: "",
  response_datetime: "",
  adverse_effect: "",
  adverse_action: "",
});

const ALERT_LEVELS = { immediate: 0, documented: 1, advisory: 2 };

const fact = (state, key) => str(state.facts[key]);

const entryClass = (entry) => classifyNeuroDrug(entry.name);

const classOfEntry = (entry) => {
  const key = entryClass(entry);
  return key ? NEURO_MED_CLASS_MAP[key] : null;
};

const requiresResponse = (entry) => {
  const cls = entryClass(entry);
  return (
    cls === "thrombolytic" ||
    cls === "acute_seizure_rescue" ||
    ["Single dose", "As needed (PRN)", "Continuous infusion"].includes(str(entry.frequency))
  );
};

// Everything the record owes, plus every advisory alert it raises. Advisory only.
export const neurologyMedicationIssues = (value) => {
  const state = neurologyMedicationsState(value);
  const issues = [];
  const entries = state.entries;

  const hasState =
    state.no_medications || state.not_assessed || entries.length > 0 || str(state.allergy_status) !== "";

  if (!hasState) {
    issues.push({
      key: "no_state",
      level: "documented",
      kind: "gap",
      message:
        "No medication statement recorded. Record the medicines given or prescribed, or state explicitly that none was given in this encounter.",
    });
  }

  if (state.no_medications && entries.length > 0) {
    issues.push({
      key: "contradiction",
      level: "documented",
      kind: "gap",
      message: "The record states that no medicine was given and also records one — resolve the contradiction.",
    });
  }

  if (!str(state.allergy_status)) {
    issues.push({
      key: "allergy_status_missing",
      level: "documented",
      kind: "allergy",
      message:
        "The allergy review is not recorded. An unrecorded allergy status is not the same as no allergy — record what the patient record states.",
    });
  } else if (state.allergy_status === NEURO_ALLERGY_STATES[1] && !str(state.allergens)) {
    issues.push({
      key: "allergens_not_listed",
      level: "documented",
      kind: "allergy",
      message: "The allergy review states that recorded allergies were reviewed but names none — list the allergens that were checked.",
    });
  } else if (state.allergy_status === NEURO_ALLERGY_STATES[0] && str(state.allergens)) {
    issues.push({
      key: "allergy_contradiction",
      level: "documented",
      kind: "allergy",
      message: "The record states that no allergy is known and also names an allergen — correct the record.",
    });
  }

  entries.forEach((entry, index) => {
    const n = index + 1;
    const name = str(entry.name);
    const label = name || `medicine ${n}`;

    if (!name) {
      issues.push({
        key: `entry_${n}_name`,
        level: "documented",
        kind: "gap",
        message: `Medicine ${n} has no name recorded.`,
      });
      return;
    }

    [
      ["dose", "dose"],
      ["route", "route"],
      ["frequency", "frequency"],
      ["timing", "timing"],
      ["indication", "indication"],
    ].forEach(([field, label4]) => {
      if (!str(entry[field])) {
        issues.push({
          key: `entry_${n}_${field}`,
          level: "documented",
          kind: "gap",
          message: `${label}: the ${label4} is not recorded.`,
        });
      }
    });

    if (requiresResponse(entry) && !str(entry.response)) {
      issues.push({
        key: `entry_${n}_response`,
        level: "documented",
        kind: "gap",
        message: `${label}: the response is not recorded — a time-critical or as-needed dose must have its effect documented.`,
      });
    }

    if (str(entry.adverse_effect) && !str(entry.adverse_action)) {
      issues.push({
        key: `entry_${n}_adverse_action`,
        level: "immediate",
        kind: "adverse",
        message: `${label}: an adverse effect is recorded with no documented action — record what was done and by whom.`,
      });
    }

    const cls = classOfEntry(entry);
    if (cls) {
      const review = asObject(state.class_reviews[cls.key]);
      if (str(review.reviewed) !== "Yes") {
        issues.push({
          key: `entry_${n}_class_${cls.key}`,
          level: "advisory",
          kind: "monitoring",
          message: `${label}: the ${cls.label.toLowerCase()} safety points and monitoring for this class are not recorded as reviewed.`,
        });
      }
    }
  });

  // Allergy cross-reactivity — only from the allergens the clinician documented.
  const allergens = str(state.allergens).toLowerCase();
  if (allergens) {
    NEURO_ALLERGY_RULES.forEach((rule) => {
      const matchedAllergen = rule.allergens.find((a) => allergens.includes(a.toLowerCase()));
      if (!matchedAllergen) return;
      entries.forEach((entry) => {
        const n = str(entry.name).toLowerCase();
        if (!n || !rule.drugs.some((d) => n.includes(d.toLowerCase()))) return;
        issues.push({
          key: `allergy_${rule.key}_${str(entry.name)}`,
          level: "immediate",
          kind: "allergy",
          message: `Allergy alert — ${entry.name}: ${rule.risk} ${rule.action}`,
          provenance: rule.provenance,
        });
      });
    });
  }

  // Contraindication screening against documented facts only.
  NEURO_CONTRAINDICATION_RULES.forEach((rule) => {
    const matching = entries.filter((e) => {
      const n = str(e.name).toLowerCase();
      return n && rule.drugs.some((d) => n.includes(d.toLowerCase()));
    });
    if (!matching.length) return;
    const value = fact(state, rule.fact);
    const factLabel = (NEURO_CONTRAINDICATION_FACTS.find((f) => f.key === rule.fact) || {}).label || rule.fact;
    if (value === "Yes") {
      issues.push({
        key: `contraindication_${rule.key}`,
        level: "immediate",
        kind: "contraindication",
        message: `${rule.message} (Documented fact: ${factLabel}.)`,
        provenance: rule.provenance,
        sourceId: rule.sourceId,
      });
    } else if (!value || value === "Not documented") {
      issues.push({
        key: `contraindication_${rule.key}_unestablished`,
        level: "documented",
        kind: "contraindication",
        message: `${matching.map((m) => m.name).join(", ")}: ${factLabel} has not been documented — it must be stated before the safety of this medicine can be confirmed.`,
      });
    }
  });

  // Interactions between the recorded medicines.
  const seenPairs = new Set();
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const a = str(entries[i].name).toLowerCase();
      const b = str(entries[j].name).toLowerCase();
      if (!a || !b) continue;
      NEURO_INTERACTION_RULES.forEach((rule) => {
        const matches = (x, y) =>
          (rule.a.some((w) => x.includes(w.toLowerCase())) && rule.b.some((w) => y.includes(w.toLowerCase()))) ||
          (rule.b.some((w) => x.includes(w.toLowerCase())) && rule.a.some((w) => y.includes(w.toLowerCase())));
        if (!matches(a, b)) return;
        const pairKey = `${rule.key}:${a}:${b}`;
        if (seenPairs.has(pairKey)) return;
        seenPairs.add(pairKey);
        const reviewed = state.interactions_reviewed === NEURO_INTERACTION_REVIEW_STATES[0];
        issues.push({
          key: `interaction_${rule.key}_${i}_${j}`,
          level: reviewed ? "advisory" : "immediate",
          kind: "interaction",
          message: `${entries[i].name} with ${entries[j].name}: ${rule.risk} ${rule.action}`,
          provenance: rule.provenance,
        });
      });
    }
  }

  if (entries.length > 1 && !str(state.interactions_reviewed)) {
    issues.push({
      key: "interaction_review_missing",
      level: "documented",
      kind: "interaction",
      message: "More than one medicine is recorded and the interaction review has no statement — record whether it was performed and its conclusion.",
    });
  }

  if (state.interactions_reviewed === NEURO_INTERACTION_REVIEW_STATES[0] && !str(state.interactions_conclusion)) {
    issues.push({
      key: "interaction_conclusion_missing",
      level: "documented",
      kind: "interaction",
      message: "The interaction review is stated as performed but carries no conclusion — record what was found and decided.",
    });
  }

  return issues.sort((x, y) => (ALERT_LEVELS[x.level] ?? 9) - (ALERT_LEVELS[y.level] ?? 9));
};

export const neurologyMedicationAlerts = (value) =>
  neurologyMedicationIssues(value).filter((i) => i.level === "immediate");

export const detectedNeuroMedicationClasses = (value) => {
  const state = neurologyMedicationsState(value);
  const keys = [...new Set(state.entries.map((e) => entryClass(e)).filter(Boolean))];
  return keys.map((k) => NEURO_MED_CLASS_MAP[k]).filter(Boolean);
};

// ---- Print --------------------------------------------------------------
const nd = (v) => (str(v) ? str(v) : "NOT DOCUMENTED");

export const formatNeurologyMedications = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const state = neurologyMedicationsState(value);
  const issues = neurologyMedicationIssues(value).filter((i) => i.key !== "no_state");
  const lines = ["MEDICATION SAFETY, ALLERGY AND INTERACTION RECORD", NEURO_MEDICATION_SPEC.note];

  if (state.not_assessed) lines.push("\nMedication review: NOT ASSESSED at the time of this note.");
  if (state.no_medications) lines.push("\nNo medicine recorded as given or prescribed in this encounter.");

  lines.push("\nAllergy review:");
  lines.push(`   Status: ${nd(state.allergy_status)}`);
  lines.push(`   Allergens documented: ${nd(state.allergens)}`);
  lines.push(`   Verified by: ${nd(state.allergy_verified_by)}`);

  const documentedFacts = NEURO_CONTRAINDICATION_FACTS.filter((f) => str(state.facts[f.key]));
  lines.push("\nContraindication screening (documented facts):");
  if (!documentedFacts.length) lines.push("   No contraindication fact was recorded — treated as not established, not as absent.");
  documentedFacts.forEach((f) => lines.push(`   ${f.label}: ${str(state.facts[f.key])}`));

  if (state.entries.length) {
    lines.push("\nMedicines:");
    state.entries.forEach((entry, index) => {
      const cls = classOfEntry(entry);
      lines.push(`\n${index + 1}. ${nd(entry.name)}${cls ? ` — ${cls.label}` : ""}`);
      lines.push(`   Dose: ${nd(entry.dose)}`);
      lines.push(`   Route: ${nd(entry.route)}`);
      lines.push(`   Frequency: ${nd(entry.frequency)}`);
      lines.push(`   Timing: ${nd(entry.timing)}`);
      lines.push(`   Time given or prescribed: ${nd(entry.given_datetime)}`);
      lines.push(`   Indication: ${nd(entry.indication)}`);
      lines.push(`   Response: ${nd(entry.response)}${str(entry.response_datetime) ? ` (assessed ${entry.response_datetime})` : ""}`);
      lines.push(`   Adverse effect: ${nd(entry.adverse_effect)}`);
      lines.push(`   Action taken: ${nd(entry.adverse_action)}`);
      if (cls) lines.push(`   Monitoring for this class: ${cls.monitoring.join(", ")}`);
    });
  }

  lines.push("\nInteraction review:");
  lines.push(`   Review: ${nd(state.interactions_reviewed)}`);
  lines.push(`   Conclusion: ${nd(state.interactions_conclusion)}`);

  const classes = detectedNeuroMedicationClasses(value);
  if (classes.length) {
    lines.push("\nClass safety points recorded as reviewed:");
    classes.forEach((cls) => {
      const review = asObject(state.class_reviews[cls.key]);
      lines.push(`   ${cls.label}: ${nd(review.reviewed)}${str(review.note) ? ` — ${str(review.note)}` : ""}`);
      if (str(review.reviewed) !== "Yes") {
        cls.focus.forEach((f) => lines.push(`      Owed: ${f}`));
      }
    });
  }

  if (issues.length) {
    lines.push("\nALERTS AND RECORD STILL OWES:");
    issues.forEach((i) => lines.push(`   [${i.level.toUpperCase()}] ${i.message}`));
  }

  lines.push(
    "\nThese alerts are advisory. They record what this note did and did not document and never decide whether a medicine is safe; the prescriber and pharmacist verify every dose, contraindication and interaction against the current product label.",
  );
  return lines.join("\n");
};

export const neurologyMedicationReference = (sourceId) => NEURO_REFERENCES[sourceId] || null;