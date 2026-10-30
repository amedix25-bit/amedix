// Ophthalmology — ocular medication record and medication-safety checks.
//
// What this module does: it holds the record of the medicines THIS note
// documents (eye, concentration, dose, frequency, duration, monitoring) and it
// derives advisory checks from exactly those entries plus the note's own
// findings — never from an assumed regimen and never from a population rule.
//
// What it does not do: it never changes a prescription, never blocks a save,
// never replaces the shared AMedix medication history or its interaction
// checking, and never decides therapy. Every check is clinician-supervised: it
// names what the cited guidance expects to be verified, and the clinician
// confirms it, documents it, or records why it does not apply.
//
// Wording rules applied here:
//   - A missing value is "not documented", never "normal" or "none".
//   - A concentration is recorded as written on the product; the app never
//     computes or rounds one.
//   - Laterality is a required fact for every topical medicine: a drop recorded
//     for "the eye" without an eye is not a record of what was instilled.

import { asObject, str, list } from "./ophthFieldKit.js";
import { OPHTH_REFERENCES } from "./ophthalmologyReferences.js";

// The therapy and medication-safety requirement cited by every check below.
const MED_SOURCE = OPHTH_REFERENCES.aao_comprehensive;

export const OPHTH_MED_ROUTES = [
  "Topical — eye drops",
  "Topical — ointment or gel",
  "Subconjunctival injection",
  "Intravitreal injection",
  "Periocular injection",
  "Oral",
  "Intravenous",
  "Intramuscular",
  "Other — documented",
];

export const OPHTH_MED_EYES = ["Right eye (OD)", "Left eye (OS)", "Both eyes (OU)", "Not applicable"];

export const OPHTH_MED_FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Six times daily",
  "Every 2 hours while awake",
  "Every hour while awake",
  "PRN — as directed",
  "Single dose",
  "Not applicable",
];

export const OPHTH_MED_CLASSES = [
  "Topical corticosteroid",
  "Topical antibiotic",
  "Topical antifungal",
  "Topical antiviral",
  "Antibiotic-steroid combination",
  "Prostaglandin analogue",
  "Topical beta-blocker",
  "Topical alpha-2 agonist",
  "Topical carbonic anhydrase inhibitor",
  "Fixed-combination glaucoma drop",
  "Topical NSAID",
  "Topical lubricant",
  "Mydriatic or cycloplegic",
  "Topical anaesthetic",
  "Systemic antimicrobial",
  "Systemic corticosteroid",
  "Intravitreal anti-VEGF",
  "Other — documented",
];

export const OPHTH_MONITORING_OPTIONS = [
  "Intraocular pressure",
  "Visual acuity",
  "Anterior chamber reaction",
  "Corneal surface and epithelial defect",
  "Disc and retinal nerve fibre layer",
  "Macular fluid on OCT",
  "Renal and liver function",
  "Blood glucose",
  "Not applicable",
];

export const emptyOphthMedication = () => ({
  name: "",
  drug_class: "",
  eye: "",
  concentration: "",
  route: "",
  frequency: "",
  duration: "",
  indication: "",
  monitoring: [],
  documented: "",
});

export const emptyOphthMedicationValue = () => ({ allergies: "", items: [], acknowledged: [] });

const TOPICAL = /topical|drops|ointment/i;
const STEROID = /corticosteroid|steroid/i;
const ANTIMICROBIAL = /antibiotic|antifungal|antiviral|antimicrobial|combination/i;
const GLAUCOMA = /prostaglandin|beta-blocker|alpha-2|carbonic anhydrase|glaucoma/i;
const MYDRIATIC = /mydriatic|cycloplegic|atropine|cyclopentolate|tropicamide|phenylephrine/i;
const BETA_BLOCKER = /beta-blocker|timolol|betaxolol|levobunolol|carteolol/i;
const PROSTAGLANDIN = /prostaglandin|latanoprost|travoprost|bimatoprost|tafluprost/i;

const weeks = (duration) => {
  const d = str(duration).toLowerCase();
  const n = Number((d.match(/\d+(\.\d+)?/) || [])[0]);
  if (!n) return null;
  if (/week/.test(d)) return n;
  if (/month/.test(d)) return n * 4.3;
  if (/day/.test(d)) return n / 7;
  return null;
};

export const ophthMedicationIncomplete = (item) => {
  const m = asObject(item);
  if (!str(m.name)) return "Record the medicine name.";
  if (!str(m.drug_class)) return "Record the medicine class.";
  if (TOPICAL.test(str(m.route)) && !str(m.eye)) return "Record which eye this topical medicine is for.";
  if (TOPICAL.test(str(m.route)) && !str(m.concentration)) {
    return "Record the concentration exactly as it appears on the product.";
  }
  if (!str(m.frequency)) return "Record the frequency.";
  return "";
};

export const ophthMedicationCount = (value) => {
  const v = asObject(value);
  return (Array.isArray(v.items) ? v.items : []).filter((m) => str(m?.name)).length;
};

// The text a saved note, its print view and its PDF carry.
export const formatOphthMedications = (value) => {
  const v = asObject(value);
  const items = (Array.isArray(v.items) ? v.items : []).filter((m) => str(m?.name));
  if (!items.length && !str(v.allergies)) return "";
  const lines = items.map((m) => {
    const head = [
      str(m.name),
      str(m.concentration) && `Concentration: ${str(m.concentration)}`,
      str(m.drug_class),
      str(m.eye),
      str(m.route),
    ]
      .filter(Boolean)
      .join(" · ");
    const detail = [
      str(m.frequency) && `Frequency: ${str(m.frequency)}`,
      str(m.duration) && `Duration: ${str(m.duration)}`,
      str(m.indication) && `Indication: ${str(m.indication)}`,
      list(m.monitoring).length && `Monitoring: ${list(m.monitoring).join("; ")}`,
      str(m.documented) && `Documented: ${str(m.documented)}`,
    ]
      .filter(Boolean)
      .join(" · ");
    return detail ? `${head} — ${detail}` : head;
  });
  if (str(v.allergies)) lines.unshift(`Allergies documented on this note: ${str(v.allergies)}`);
  return lines.join("\n");
};

// ---- Safety checks --------------------------------------------------------
// The context is what the note itself documents (an active corneal infection, a
// documented angle closure, a recorded systemic beta-blocker or asthma), so a
// check only ever fires on the record in front of the clinician.
const add = (alerts, level, title, basis, action, source) =>
  alerts.push({ key: `med_${alerts.length + 1}_${title.slice(0, 24).replace(/\W+/g, "_").toLowerCase()}`, level, title, basis, action, source, category: "medication_safety" });

export const buildOphthMedicationAlerts = (value, context = {}) => {
  const v = asObject(value);
  const items = (Array.isArray(v.items) ? v.items : []).filter((m) => str(m?.name));
  const alerts = [];
  const allergyText = [str(v.allergies), ...list(context.allergies)].filter(Boolean).join(" ");
  const allergyTokens = allergyText
    .split(/[;,]/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 4 && !/^(none|no known|nil|not documented)/.test(t));

  for (const m of items) {
    const cls = `${str(m.drug_class)} ${str(m.name)}`;
    const topical = TOPICAL.test(str(m.route)) || TOPICAL.test(cls);
    const name = str(m.name) || "documented medicine";

    if (allergyTokens.length) {
      const hit = allergyTokens.find((t) => cls.toLowerCase().includes(t));
      if (hit) {
        add(
          alerts,
          "same_day",
          `Recorded allergy to ${hit} — the medicine named is in that group`,
          `The note records an allergy to "${hit}" and also records ${name}. An allergy recorded on the same note takes precedence over any regimen until the prescriber has documented the decision.`,
          "Confirm the allergy against the product, stop or replace the medicine as the prescriber decides, and record the decision and the alternative used.",
          MED_SOURCE,
        );
      }
    }

    if (topical && !str(m.eye)) {
      add(
        alerts,
        "documented",
        `Laterality not recorded for ${name}`,
        "A topical medicine is instilled into a named eye. Without the eye the record cannot show what was treated, and the wrong-eye risk cannot be reviewed.",
        "Record OD, OS or OU for this entry — or document that both eyes were treated.",
        MED_SOURCE,
      );
    }

    if (topical && !str(m.concentration)) {
      add(
        alerts,
        "documented",
        `Concentration not recorded for ${name}`,
        "Ocular medicines exist in several concentrations with different risk, especially corticosteroids and antimicrobials. Without the concentration the order cannot be verified against the product.",
        "Record the concentration exactly as printed on the product.",
        MED_SOURCE,
      );
    }

    if (!str(m.frequency)) {
      add(
        alerts,
        "advisory",
        `Frequency not recorded for ${name}`,
        "Frequency is part of the order; without it the regimen cannot be followed or reviewed against the response.",
        "Record the frequency, or mark it as not applicable for a single dose.",
        MED_SOURCE,
      );
    }

    if (STEROID.test(cls)) {
      if (!str(m.duration)) {
        add(
          alerts,
          "advisory",
          `Duration not recorded for ${name}`,
          "Topical corticosteroid therapy needs a stated duration and a review point: an open-ended steroid is both an infection risk and a pressure risk.",
          "Record the planned duration and the review that will decide continuation.",
          MED_SOURCE,
        );
      }
      const w = weeks(m.duration);
      if (w && w >= 4 && list(m.monitoring).length === 0) {
        add(
          alerts,
          "advisory",
          `Steroid planned for ${m.duration} without monitoring recorded`,
          "Prolonged topical corticosteroid therapy is monitored for a pressure rise, for corneal surface problems and for infection.",
          "Record the monitoring planned (intraocular pressure, corneal surface, infection review) and the review interval.",
          MED_SOURCE,
        );
      }
      if (context.activeInfection) {
        add(
          alerts,
          "documented",
          `Corticosteroid recorded with an active corneal or intraocular infection`,
          "A corticosteroid given while an infection is uncontrolled can allow the organism to progress. The cited guidance requires the infection to be treated first, or the reason for using steroid alongside it to be recorded.",
          "Document the antimicrobial cover, the sampling taken before steroid, and the reasoning for the steroid — or defer the steroid until the infection is controlled.",
          MED_SOURCE,
        );
      }
    }

    if (ANTIMICROBIAL.test(cls) && !str(m.duration)) {
      add(
        alerts,
        "advisory",
        `Review or stop point not recorded for ${name}`,
        "An antimicrobial without a stated duration or review point is continued by default, which is how resistance and surface toxicity develop.",
        "Record the planned duration and the review that will decide continuation.",
        MED_SOURCE,
      );
    }

    if (GLAUCOMA.test(cls) && list(m.monitoring).length === 0) {
      add(
        alerts,
        "advisory",
        `No monitoring recorded for glaucoma medicine ${name}`,
        "A pressure-lowering medicine is judged by the pressure and by the disc and field it protects, so the monitoring belongs with the order.",
        "Record the intraocular pressure monitoring and the interval of the next assessment.",
        MED_SOURCE,
      );
    }

    if (PROSTAGLANDIN.test(cls) && /three|four|six|hour/i.test(str(m.frequency))) {
      add(
        alerts,
        "advisory",
        `${name} recorded more often than once daily`,
        "Prostaglandin analogues are dosed once daily; more frequent dosing is not more effective and increases side effects.",
        "Confirm the intended frequency with the prescriber and record the corrected regimen.",
        MED_SOURCE,
      );
    }

    if (BETA_BLOCKER.test(cls) && (context.asthma || context.heartBlock)) {
      add(
        alerts,
        "documented",
        `${name} recorded with a documented contraindication in the record`,
        "Topical beta-blockers are absorbed systemically; the cited guidance requires asthma, reactive airway disease, marked bradycardia and heart block to be considered before they are used.",
        "Document the cardiology or respiratory review, the alternative agent chosen, or the reasoning for continuing with the risk stated to the patient.",
        MED_SOURCE,
      );
    }

    if (MYDRIATIC.test(cls) && context.angleClosure) {
      add(
        alerts,
        "documented",
        `Mydriatic recorded with a documented narrow or closed angle`,
        "A mydriatic in an eye with a narrow or closed angle can precipitate angle closure; the cited guidance requires the risk and the decision to be recorded.",
        "Record the gonioscopy findings, the indication, and the pressure surveillance planned after instillation.",
        MED_SOURCE,
      );
    }
  }

  return alerts;
};

// The note-level summary the clinician signs against.
export const ophthMedicationReviewSummary = (value) => {
  const v = asObject(value);
  const items = (Array.isArray(v.items) ? v.items : []).filter((m) => str(m?.name));
  if (!items.length) return "";
  const acknowledged = list(v.acknowledged);
  return `${items.length} medicine(s) recorded in this note${
    str(v.allergies) ? `; allergies documented: ${str(v.allergies)}` : "; allergies not recorded on this note"
  }${acknowledged.length ? `; checks acknowledged: ${acknowledged.join("; ")}` : ""}.`;
};