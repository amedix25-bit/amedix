// Allergy & Immunology treatment and management modules.
//
// WHAT THIS MODULE DOES
// It gives the clinician a structured place to document treatment — the agent,
// the indication, the route, the dose actually decided for an adult and for a
// child, the monitoring and the rationale — and it formats that documentation
// into the note.
//
// WHAT IT DELIBERATELY DOES NOT DO
//   · It contains NO numeric dose, no weight-based formula and no calculator.
//     AMedix never computes, suggests or infers a dose. The clinician documents
//     the dose, taking it from the product information and the patient's own
//     age, weight and comorbidity.
//   · It never places an order. Any medicine is prescribed through the existing
//     AMedix prescription flow, where the existing medication safety, allergy,
//     duplicate-therapy and contraindication checks and clinician approval apply.
//   · It never converts a treatment plan into a diagnosis, or a diagnosis into
//     an instruction.
//
// Each class names the guidance it is written against, by reference key into the
// Clinical References Library, so the plan a note records can be traced back.

import { ALLERGY_REFERENCES } from "@/lib/allergyReferences";

export const TREATMENT_NOTICE =
  "Treatment is documented here, not prescribed. AMedix never calculates a dose: the dose recorded is the dose the treating clinician decided. Every medicine is ordered through the existing AMedix prescription flow, where the existing medication safety, allergy, interaction and contraindication checks and clinician approval apply.";

// `dosing_basis` is the only dosing statement this module makes: that adult and
// paediatric decisions are separate, and that both are the clinician's.
export const DOSING_RULE =
  "Adult and paediatric dosing are documented separately. The paediatric entry records the age band and weight basis the clinician used; AMedix performs no calculation and no conversion.";

export const TREATMENT_CLASSES = [
  {
    key: "antihistamines",
    label: "Antihistamines (H1)",
    kind: "pharmacological",
    indication:
      "Symptom control in allergic rhinitis, urticaria and conjunctivitis. A second-generation agent is preferred where licensed for the patient's age; sedation and impairment are documented when a first-generation agent is used.",
    adult: "Agent, dose and frequency documented by the clinician from the product information.",
    paediatric: "Age-appropriate agent and dose documented by the clinician; the age band and weight basis are recorded.",
    monitoring: "Sedation, performance impairment, response at follow-up, need to step down.",
    cautions: "Sedating agents and driving or school performance; combination products that duplicate the antihistamine.",
    references: ["urticaria", "aria"],
  },
  {
    key: "corticosteroids",
    label: "Corticosteroids (intranasal, inhaled, topical, systemic)",
    kind: "pharmacological",
    indication:
      "Intranasal for rhinitis, inhaled for asthma, topical for atopic dermatitis, systemic for severe exacerbations where the clinician judges it indicated.",
    adult: "Route, preparation, dose and duration documented by the clinician.",
    paediatric: "Paediatric preparation and dose documented with the age band; growth monitoring recorded for inhaled or intranasal long-term use.",
    monitoring: "Local effects, growth in children on long-term inhaled or intranasal therapy, systemic effects on repeated courses.",
    cautions: "Systemic courses: cumulative exposure, glucose, blood pressure and infection risk documented; abrupt withdrawal avoided.",
    references: ["gina", "aria", "atopic_dermatitis"],
  },
  {
    key: "leukotriene_receptor_antagonists",
    label: "Leukotriene receptor antagonists",
    kind: "pharmacological",
    indication:
      "Documented add-on therapy in asthma, or where the clinician records a specific indication; the reason for use alongside or instead of inhaled corticosteroid is stated.",
    adult: "Dose and frequency documented by the clinician.",
    paediatric: "Age-appropriate preparation and dose documented with the age band.",
    monitoring: "Response, adherence, and neuropsychiatric adverse effects asked about at each review.",
    cautions: "Neuropsychiatric effects are documented and reviewed; it is not a substitute for inhaled corticosteroid in persistent asthma.",
    references: ["gina", "aria"],
  },
  {
    key: "inhaled_asthma_therapy",
    label: "Inhaled asthma therapy (ICS, ICS-LABA, reliever)",
    kind: "pharmacological",
    indication:
      "Persistent asthma, or reliever therapy as the clinician documents. The treatment step, the device and the technique check are recorded.",
    adult: "Device, preparation, dose and regimen documented by the clinician; reliever use recorded.",
    paediatric: "Device and age-appropriate dose documented, with spacer use and technique recorded.",
    monitoring: "Control, reliever use, exacerbations, adherence, technique, growth in children.",
    cautions: "Reliever-only treatment without an anti-inflammatory component is documented as a deliberate decision, not a default.",
    references: ["gina"],
  },
  {
    key: "biologics",
    label: "Biologic therapy",
    kind: "pharmacological",
    indication:
      "Severe asthma, chronic urticaria, atopic dermatitis, eosinophilic disease or another documented indication where the clinician records why a biologic is being considered and what was tried first.",
    adult: "Agent, dose and interval documented by the clinician from the product information.",
    paediatric: "Age-appropriate indication and dose documented; the licensed age is recorded.",
    monitoring: "Pre-treatment screening, response measure and review interval, injection-site reactions, infection surveillance.",
    cautions: "Screening and vaccination status documented before starting; the response measure and the stopping rule are recorded in advance.",
    references: ["gina", "urticaria", "atopic_dermatitis"],
  },
  {
    key: "adrenaline",
    label: "Epinephrine / adrenaline",
    kind: "pharmacological",
    indication:
      "First-line treatment of anaphylaxis, and the emergency plan for a patient at risk of recurrence. The route, the device and the number of doses available to the patient are recorded.",
    adult: "Intramuscular route, dose and repeat instruction documented by the clinician, with the device supplied.",
    paediatric: "Weight-appropriate device or dose documented by the clinician, with the weight basis recorded.",
    monitoring: "Observation period after administration, response, need for repeat dosing or infusion, and the setting.",
    cautions: "Delay in administration is documented when it occurred; an antihistamine or corticosteroid is never recorded as the treatment for anaphylaxis.",
    references: ["wao_anaphylaxis", "eaaci_anaphylaxis", "aaaai_anaphylaxis"],
  },
  {
    key: "allergen_immunotherapy",
    label: "Allergen immunotherapy (SCIT / SLIT)",
    kind: "pharmacological",
    indication:
      "Documented indication, the allergen and preparation, the route, and why immunotherapy is preferred over avoidance and pharmacotherapy alone.",
    adult: "Product and schedule documented as decided by the clinician; dose escalation recorded at each visit.",
    paediatric: "Age appropriateness and the licensed indication documented; consent and assent recorded.",
    monitoring: "Post-dose observation, local and systemic reactions, adherence, and the annual review of benefit.",
    cautions: "Consent, adrenaline availability and the observation period are recorded; systemic reactions and their management are documented in full.",
    references: ["eaaci_ait", "icon_ait"],
  },
  {
    key: "immunoglobulin_replacement",
    label: "Immunoglobulin replacement (when indicated)",
    kind: "pharmacological",
    indication:
      "Documented indication in a confirmed antibody deficiency or a related immunodeficiency, with the baseline immunoglobulin results and infection history recorded.",
    adult: "Route, product, dose and interval documented by the clinician, with the trough target recorded.",
    paediatric: "Weight-based dosing documented by the clinician, with the weight and the age band recorded.",
    monitoring: "Trough levels, infection frequency, infusion reactions, renal and thrombotic risk factors, and the review of continuing need.",
    cautions: "Not started without a documented indication and baseline immunology; the review date for continuing therapy is recorded.",
    references: ["aaaai_iei", "iuis_iei"],
  },
  {
    key: "allergen_avoidance",
    label: "Allergen avoidance & environmental control",
    kind: "non_pharmacological",
    indication:
      "The specific allergen or trigger, the exposure setting, and the measures agreed. Advice given without a documented trigger is recorded as such.",
    adult: "Measures agreed with the patient, and what is realistically achievable.",
    paediatric: "Measures agreed with the family and the school or carer, with the responsibilities recorded.",
    monitoring: "Exposure reduction achieved, symptoms on re-exposure, adherence at review.",
    cautions: "Avoidance advice is specific to the documented trigger; unproven or restrictive measures are recorded as not advised.",
    references: ["aaaai_food", "aria"],
  },
  {
    key: "patient_education",
    label: "Patient & family education",
    kind: "non_pharmacological",
    indication:
      "Recognition of the condition and its triggers, correct use of the device, when and how to seek help, and the written material given.",
    adult: "Topics covered, material provided and the patient's understanding checked.",
    paediatric: "Topics covered with the child and the carer, understood in an age-appropriate way; school or nursery liaison recorded.",
    monitoring: "Understanding and technique rechecked at review; adherence discussed without blame.",
    cautions: "Education is recorded as delivered only when it happened; a leaflet handed over is not documented as understanding.",
    references: ["wao_anaphylaxis", "gina"],
  },
  {
    key: "emergency_action_plan",
    label: "Emergency action plan",
    kind: "non_pharmacological",
    indication:
      "A patient at risk of anaphylaxis or severe asthma. The plan records the recognition signs, the adrenaline or reliever instruction, when to call emergency services, and who holds the plan.",
    adult: "Plan issued to the patient, with the copy held in the record.",
    paediatric: "Plan issued to the family and the school or nursery, with named recipients recorded.",
    monitoring: "Plan reviewed at each visit, and after any reaction; the device expiry is checked.",
    cautions: "A plan without a documented device or without the recipient recorded is flagged as incomplete.",
    references: ["wao_anaphylaxis", "eaaci_anaphylaxis", "gina"],
  },
];

export const TREATMENT_CLASS_MAP = Object.fromEntries(TREATMENT_CLASSES.map((c) => [c.key, c]));

export const TREATMENT_STATUSES = ["Planned", "Started", "Continuing", "Stopped", "Not indicated"];
export const AGE_GROUPS = ["Adult", "Paediatric", "Both — documented separately"];

export const emptyTreatmentEntry = (classKey = "antihistamines") => ({
  treatment_class: classKey,
  agent: "",
  indication: "",
  route: "",
  age_group: "Adult",
  adult_dose: "",
  adult_frequency: "",
  adult_duration: "",
  paediatric_dose: "",
  paediatric_age_band: "",
  paediatric_weight_basis: "",
  paediatric_frequency: "",
  paediatric_duration: "",
  monitoring: "",
  cautions: "",
  status: "Planned",
  rationale: "",
  review_date: "",
  reference_keys: [],
});

const str = (v) => String(v ?? "").trim();

const doseLine = (label, dose, frequency, duration) => {
  const parts = [str(dose), str(frequency), str(duration)].filter(Boolean);
  return parts.length ? `${label}: ${parts.join(" · ")}` : "";
};

// Prints only what was documented. An empty entry prints nothing at all — a
// blank field never becomes "none", "normal" or "not required".
export const formatAllergyTreatment = (entries) => {
  if (!Array.isArray(entries)) return "";
  return entries
    .map((e) => {
      if (!e || typeof e !== "object") return "";
      const cls = TREATMENT_CLASS_MAP[e.treatment_class];
      const head = [cls?.label || e.treatment_class, str(e.agent), str(e.status) ? `(${str(e.status)})` : ""]
        .filter(Boolean)
        .join(" — ");
      const lines = [
        head,
        str(e.indication) ? `Indication: ${str(e.indication)}` : "",
        str(e.route) ? `Route: ${str(e.route)}` : "",
        doseLine("Adult dose (as documented)", e.adult_dose, e.adult_frequency, e.adult_duration),
        doseLine("Paediatric dose (as documented)", e.paediatric_dose, e.paediatric_frequency, e.paediatric_duration),
        str(e.paediatric_age_band) ? `Paediatric age band: ${str(e.paediatric_age_band)}` : "",
        str(e.paediatric_weight_basis) ? `Weight basis documented by the clinician: ${str(e.paediatric_weight_basis)}` : "",
        str(e.monitoring) ? `Monitoring: ${str(e.monitoring)}` : "",
        str(e.cautions) ? `Cautions: ${str(e.cautions)}` : "",
        str(e.rationale) ? `Clinician rationale: ${str(e.rationale)}` : "",
        str(e.review_date) ? `Review: ${str(e.review_date)}` : "",
        (e.reference_keys || []).length
          ? `Guidance: ${(e.reference_keys || [])
              .map((k) => ALLERGY_REFERENCES[k])
              .filter(Boolean)
              .map((r) => `${r.organization} — ${r.title} (${r.edition})`)
              .join("; ")}`
          : "",
      ].filter(Boolean);
      // A row with nothing but its class selected is not a documented treatment.
      const hasContent = Boolean(str(e.agent) || str(e.indication) || str(e.adult_dose) || str(e.paediatric_dose));
      return hasContent ? lines.join("\n") : "";
    })
    .filter(Boolean)
    .join("\n\n");
};

// Advisory gaps. These are shown to the clinician and never block saving: they
// describe documentation that is missing, in the words "not documented".
export const treatmentDocumentationGaps = (entries) => {
  const list = Array.isArray(entries) ? entries.filter((e) => e && typeof e === "object") : [];
  const gaps = [];
  list.forEach((e) => {
    const label = TREATMENT_CLASS_MAP[e.treatment_class]?.label || e.treatment_class || "Treatment";
    if (!str(e.agent) && str(e.status) !== "Not indicated") {
      gaps.push({ key: `agent-${e.treatment_class}`, text: `${label}: no agent documented.` });
    }
    if (!str(e.indication)) {
      gaps.push({ key: `indication-${e.treatment_class}`, text: `${label}: the indication is not documented.` });
    }
    const paediatricUsed = str(e.paediatric_dose);
    if (paediatricUsed && !str(e.paediatric_weight_basis) && !str(e.paediatric_age_band)) {
      gaps.push({
        key: `paediatric-basis-${e.treatment_class}`,
        text: `${label}: a paediatric dose is documented without the age band or weight basis the clinician used.`,
      });
    }
    if (paediatricUsed && !/paediatr|child|both/i.test(str(e.age_group))) {
      gaps.push({
        key: `paediatric-agegroup-${e.treatment_class}`,
        text: `${label}: a paediatric dose is documented while the age group is recorded as ${str(e.age_group) || "not stated"}.`,
      });
    }
    if (str(e.adult_dose) && !/adult|both/i.test(str(e.age_group))) {
      gaps.push({
        key: `adult-agegroup-${e.treatment_class}`,
        text: `${label}: an adult dose is documented while the age group is recorded as ${str(e.age_group) || "not stated"}.`,
      });
    }
  });
  return gaps;
};