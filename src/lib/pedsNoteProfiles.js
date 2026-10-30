// Pediatrics — one clinical profile per existing note type.
//
// The eighteen pediatric notes are not one long form. Each profile states the note's
// own clinical purpose and picks only the field sets that purpose needs, then adds the
// few fields that belong to that note alone. The newborn record never asks about
// school; the well-child visit never asks about a delivery; the confidential adolescent
// note never asks a parent-reported feeding history.
//
// Generated block keys: peds_ctx_<note>, peds_exam_<note>, peds_assess_<note>,
// peds_care_<note> — one set per note, so two notes can never overwrite each other.

import { PEDS_FIELD_SETS } from "@/lib/pedsNoteFieldSets";

const SETS = PEDS_FIELD_SETS;

const fieldsFor = (setKeys = [], extras = []) => {
  const seen = new Set();
  return [...setKeys.flatMap((key) => SETS[key] || []), ...extras].filter((field) => {
    if (seen.has(field.key)) return false;
    seen.add(field.key);
    return true;
  });
};

const suffix = (noteKey) => noteKey.replace(/^peds_/, "");

export const PEDS_NOTE_PROFILES = {
  peds_consultation: {
    purpose: "A first assessment of a new pediatric problem: the story, the measurements, the examination, the differential and the decision.",
    ctx: { sets: ["identity", "nutrition", "medsAllergy", "familySocial", "acuteHistory"] },
    exam: { sets: ["measurements", "vitals", "examSystems"] },
    assess: { sets: ["assessment", "workup"] },
    care: { sets: ["medication", "monitoring", "disposition"] },
  },

  peds_followup: {
    purpose: "A review of a known problem: what changed since the last visit, whether the treatment worked, and what happens next.",
    ctx: {
      sets: ["identity", "medsAllergy", "nutrition"],
      extras: [
        { key: "nx_fu_interval", label: "Interval since the last review", type: "input", placeholder: "e.g. 2 weeks" },
        { key: "nx_fu_since", label: "Course since the last visit", type: "select", options: ["Improved", "Unchanged", "Worse", "Fluctuating", "Not documented"] },
        { key: "nx_fu_adherence", label: "Treatment taken as prescribed", type: "select", options: ["Yes", "Partially — reason documented", "Stopped — reason documented", "Not assessed", "Not documented"] },
        { key: "nx_fu_new_symptoms", label: "New symptoms since the last visit", type: "textarea", placeholder: "What is new, and when it started" },
      ],
    },
    exam: { sets: ["measurements", "vitals", "examSystems"] },
    assess: {
      sets: ["assessment", "workup"],
      extras: [{ key: "nx_fu_target", label: "Treatment target for this condition documented", type: "input", placeholder: "The goal the last review set, and whether it was met" }],
    },
    care: { sets: ["medication", "monitoring", "disposition"] },
  },

  peds_well_child: {
    purpose: "Health supervision of a well child: growth plotted, development watched, preventive care given and the family counselled.",
    ctx: {
      sets: ["identity", "nutrition", "medsAllergy", "familySocial"],
      extras: [
        { key: "nx_well_reason", label: "Reason for attendance", type: "select", options: ["Scheduled health supervision", "Parental concern", "School or nursery requirement", "Vaccination only", "Not documented"] },
        { key: "nx_well_parental_concern", label: "Parental concerns recorded", type: "textarea", placeholder: "What the caregiver raised, in their words" },
      ],
    },
    exam: {
      sets: ["measurements", "examSystems"],
      extras: [
        { key: "nx_well_vision", label: "Vision screening", type: "select", options: ["Screened — no concern documented", "Screened — concern documented, referred", "Not due at this age", "Not performed", "Not documented"] },
        { key: "nx_well_hearing", label: "Hearing screening", type: "select", options: ["Screened — no concern documented", "Screened — concern documented, referred", "Not due at this age", "Not performed", "Not documented"] },
        { key: "nx_well_teeth", label: "Oral health", type: "select", options: ["Teeth reviewed — no concern documented", "Dental caries documented, referred", "Not examined", "Not documented"] },
      ],
    },
    assess: { sets: ["assessment"] },
    care: {
      sets: ["monitoring", "disposition"],
      extras: [
        { key: "nx_well_preventive", label: "Preventive care given at this visit", type: "multi", options: ["Growth plotted on a named reference", "Development surveillance", "Development screening instrument", "Vision screening", "Hearing screening", "Anaemia screening", "Immunisation reviewed", "Anticipatory guidance", "Dental referral"] },
        { key: "nx_well_next_due", label: "Next health-supervision visit due", type: "input", placeholder: "Age or date the schedule sets" },
      ],
    },
  },

  peds_admission_note: {
    purpose: "Admission to hospital: why inpatient care is needed, the baseline measurements, the immediate orders and the monitoring set.",
    ctx: {
      sets: ["identity", "medsAllergy", "acuteHistory", "familySocial"],
      extras: [
        { key: "nx_adm_reason", label: "Reason inpatient care is required", type: "textarea", placeholder: "The findings that cannot be managed at home" },
        { key: "nx_adm_referral", label: "Referred by", type: "input" },
      ],
    },
    exam: { sets: ["measurements", "vitals", "examSystems"] },
    assess: { sets: ["assessment", "workup"] },
    care: {
      sets: ["medication", "monitoring", "disposition"],
      extras: [
        { key: "nx_adm_orders", label: "Immediate orders documented", type: "multi", options: ["Oxygen if required", "Intravenous fluids", "Antibiotics", "Antipyretic", "Blood glucose check", "Nil by mouth", "Feeds continued", "Sepsis screen", "Senior review requested"] },
        { key: "nx_adm_isolation", label: "Infection prevention measures", type: "select", options: ["Standard precautions", "Contact precautions", "Droplet precautions", "Airborne precautions", "Not documented"] },
      ],
    },
  },

  peds_daily_progress: {
    purpose: "The ward round: what happened in the last 24 hours, what the child looks like now, and what changes today.",
    ctx: {
      sets: ["identity", "acuteHistory"],
      extras: [
        { key: "nx_prog_events", label: "Events in the last 24 hours", type: "textarea", placeholder: "Fevers, feeds, seizures, procedures, results, calls to senior staff" },
        { key: "nx_prog_fluids", label: "Fluid balance", type: "input", placeholder: "Intake and output, and the balance" },
      ],
    },
    exam: { sets: ["measurements", "vitals", "examSystems"] },
    assess: {
      sets: ["assessment"],
      extras: [{ key: "nx_prog_direction", label: "Trajectory documented", type: "select", options: ["Improving", "Static", "Deteriorating", "Uncertain — awaiting results", "Not documented"] }],
    },
    care: {
      sets: ["medication", "monitoring"],
      extras: [
        { key: "nx_prog_changes", label: "Changes to management today", type: "textarea", placeholder: "What is being started, stopped or continued, and why" },
        { key: "nx_prog_discharge_ready", label: "Discharge criteria", type: "select", options: ["Not met — still requires inpatient care", "Met — discharge planned", "Met — discharge deferred for family or social reasons", "Not assessed", "Not documented"] },
      ],
    },
  },

  peds_discharge_summary: {
    purpose: "Leaving hospital: the course, the condition at discharge, the medicines to take home, the follow-up and the warning signs the family must act on.",
    ctx: {
      sets: ["identity", "medsAllergy", "familySocial"],
      extras: [
        { key: "nx_dis_admission_date", label: "Admission date", type: "date" },
        { key: "nx_dis_course", label: "Hospital course", type: "textarea", placeholder: "The sequence of the admission, the treatment given and the response" },
      ],
    },
    exam: { sets: ["measurements", "vitals"] },
    assess: { sets: ["assessment"] },
    care: {
      sets: ["medication", "monitoring", "disposition"],
      extras: [
        { key: "nx_dis_medicines", label: "Medicines to continue at home", type: "textarea", placeholder: "Medicine, dose, frequency, duration and who explained it" },
        { key: "nx_dis_outstanding", label: "Results outstanding at discharge", type: "input", placeholder: "What is pending, and who will act on it" },
        { key: "nx_dis_condition", label: "Condition at discharge", type: "select", options: ["Recovered", "Improved — treatment continuing", "Unchanged — transferred for ongoing care", "Not documented"] },
      ],
    },
  },

  peds_procedure_note: {
    purpose: "A procedure in a child: the indication, the sedation and comfort plan, what was done, and the after-care the family must follow.",
    ctx: {
      sets: ["identity", "medsAllergy"],
      extras: [{ key: "nx_proc_indication", label: "Indication for the procedure", type: "textarea", placeholder: "Why this procedure, and what was discussed with the family" }],
    },
    exam: { sets: ["vitals", "examProcedure"] },
    assess: {
      sets: ["assessment"],
      extras: [{ key: "nx_proc_specimen", label: "Specimen sent", type: "input", placeholder: "What was sent, to which laboratory, and what question it answers" }],
    },
    care: {
      sets: ["medication", "monitoring", "disposition"],
      extras: [{ key: "nx_proc_aftercare", label: "After-care instructions given", type: "multi", options: ["Wound care", "Analgesia at home", "Bathing instructions", "Activity restriction", "When to return", "Dressing review date"] }],
    },
  },

  peds_chronic_followup: {
    purpose: "A child living with a long-term condition: control, adherence, complications, growth, school and the plan for the next interval.",
    ctx: { sets: ["identity", "medsAllergy", "chronicHistory", "familySocial"] },
    exam: {
      sets: ["measurements", "vitals"],
      extras: [{ key: "nx_chr_system", label: "System examination specific to the condition", type: "textarea", placeholder: "The findings this condition requires at every review" }],
    },
    assess: {
      sets: ["assessment", "workup"],
      extras: [{ key: "nx_chr_monitoring_due", label: "Condition monitoring due at this review", type: "multi", options: ["Growth plotted", "Blood pressure", "Blood or urine monitoring test", "Organ function assessment", "Vision or hearing", "Developmental review", "Vaccination review"] }],
    },
    care: { sets: ["medication", "monitoring", "disposition"] },
  },

  peds_growth_development: {
    purpose: "Growth and development as the clinical question: the measurements on a named reference, the developmental domains, and the action a faltering line or a missed milestone requires.",
    ctx: { sets: ["identity", "nutrition", "familySocial"] },
    exam: {
      sets: ["measurements", "examSystems"],
      extras: [
        { key: "nx_gd_dev_domains", label: "Developmental domains assessed", type: "multi", options: ["Gross motor", "Fine motor", "Speech and language", "Social and play", "Cognitive", "Self-care", "Hearing and vision"] },
        { key: "nx_gd_dev_finding", label: "Developmental finding", type: "select", options: ["Age-appropriate in all domains", "Delay suspected", "Regression documented", "Not assessed", "Not documented"] },
        { key: "nx_gd_regression", label: "Loss of acquired skills", type: "select", options: ["None documented", "Yes — documented and referred", "Yes — documented, referral outstanding", "Not asked", "Not documented"] },
      ],
    },
    assess: { sets: ["assessment", "workup"] },
    care: {
      sets: ["medication", "monitoring", "disposition"],
      extras: [{ key: "nx_gd_nutrition_plan", label: "Nutrition plan documented", type: "textarea", placeholder: "Feeding changes, supplementation or referral, and who will review it" }],
    },
  },

  peds_immunization_record: {
    purpose: "The immunisation record: what was given today, how it was given, what reaction occurred and when the next dose is due.",
    ctx: {
      sets: ["identity", "medsAllergy"],
      extras: [
        { key: "nx_imm_schedule", label: "Schedule followed", type: "select", options: ["National immunisation schedule", "Catch-up schedule", "Risk-group schedule", "Not documented"] },
        { key: "nx_imm_behind", label: "Antigens overdue before today", type: "input", placeholder: "Which antigens were behind, and the catch-up plan" },
      ],
    },
    exam: { sets: ["vitals"], extras: [{ key: "nx_imm_fitness", label: "Fitness for vaccination documented", type: "select", options: ["No contraindication documented", "Acute illness — deferred", "Contraindication documented — not given", "Not assessed", "Not documented"] }] },
    assess: { sets: ["assessment"] },
    care: {
      sets: ["monitoring", "disposition"],
      extras: [
        { key: "nx_imm_given", label: "Vaccines given at this visit", type: "textarea", placeholder: "Vaccine, batch, site, route and who administered it" },
        { key: "nx_imm_reaction", label: "Reaction observed", type: "select", options: ["None observed", "Local reaction", "Fever documented", "Anaphylaxis — treated", "Other — documented below", "Not observed"] },
        { key: "nx_imm_next_due", label: "Next dose due", type: "input", placeholder: "Antigen and age or date" },
      ],
    },
  },

  peds_screening_record: {
    purpose: "A screening encounter: which screen, which instrument, what it showed and the action the result requires.",
    ctx: { sets: ["identity", "familySocial"] },
    exam: { sets: ["measurements"] },
    assess: {
      sets: ["assessment"],
      extras: [
        { key: "nx_scr_type", label: "Screen performed", type: "select", options: ["Developmental", "Autism-specific", "Vision", "Hearing", "Anaemia", "Newborn bloodspot", "Growth", "Dental", "Other — named in the reasoning"] },
        { key: "nx_scr_instrument", label: "Instrument used", type: "input", placeholder: "The named instrument, or the surveillance method" },
        { key: "nx_scr_result", label: "Result", type: "select", options: ["Negative", "Positive — action taken", "Positive — action outstanding", "Inconclusive — repeat planned", "Not documented"] },
      ],
    },
    care: {
      sets: ["monitoring", "disposition"],
      extras: [{ key: "nx_scr_action", label: "Action the result requires", type: "textarea", placeholder: "Referral, repeat screen, investigation or reassurance — and who owns it" }],
    },
  },

  peds_anticipatory_guidance: {
    purpose: "Guidance for the age and stage: what was discussed, how the family understood it, and what to do if things change.",
    ctx: {
      sets: ["identity", "familySocial", "nutrition"],
      extras: [{ key: "nx_ag_stage", label: "Age and stage the guidance was written for", type: "input", placeholder: "e.g. 4 months — weaning, sleep, safety" }],
    },
    exam: { sets: ["measurements"] },
    assess: { sets: ["assessment"] },
    care: {
      sets: ["monitoring", "disposition"],
      extras: [
        { key: "nx_ag_topics", label: "Topics covered", type: "multi", options: ["Feeding and weaning", "Sleep and safe sleep", "Injury prevention", "Vaccination schedule", "Development and play", "Toilet training", "School readiness", "Screen time", "Dental care", "Substance and risk behaviour", "Mental health"] },
        { key: "nx_ag_materials", label: "Written or visual materials given", type: "input" },
      ],
    },
  },

  peds_newborn_record: {
    purpose: "The newborn assessment: how the baby was born, how the baby is now, feeding, thermal care, prophylaxis and the danger signs screened for.",
    ctx: { sets: ["identity", "neonatalHistory", "medsAllergy"] },
    exam: { sets: ["measurements", "vitals", "examNeonate"] },
    assess: {
      sets: ["assessment", "workup"],
      extras: [{ key: "nx_nb_screening", label: "Newborn screening", type: "multi", options: ["Bloodspot screening taken", "Hearing screening performed", "Pulse oximetry screening performed", "Not yet due", "Declined — reason documented"] }],
    },
    care: {
      sets: ["medication", "monitoring"],
      extras: [
        { key: "nx_nb_thermal", label: "Thermal care documented", type: "select", options: ["Skin-to-skin and covered", "Incubator or radiant warmer", "Rooming-in with clothing and cap", "Not documented"] },
        { key: "nx_nb_prophylaxis", label: "Prophylaxis", type: "multi", options: ["Vitamin K given", "Eye prophylaxis given", "Cord care explained", "Not documented"] },
        { key: "nx_nb_discharge_criteria", label: "Discharge readiness", type: "select", options: ["Feeding established, weight and temperature stable", "Not ready — reason documented", "Not assessed", "Not documented"] },
        { key: "nx_nb_next_review", label: "Next newborn review", type: "input", placeholder: "e.g. 48–72 hours for weight and jaundice" },
      ],
    },
  },

  peds_birth_history: {
    purpose: "The birth story in detail: the pregnancy, the delivery, the resuscitation and the first days, recorded once and read by every clinician afterwards.",
    ctx: { sets: ["identity", "neonatalHistory", "familySocial"] },
    exam: { sets: ["measurements", "examNeonate"] },
    assess: {
      sets: ["assessment"],
      extras: [{ key: "nx_bh_interpretation", label: "What this birth history means for the child now", type: "textarea", placeholder: "The antenatal and perinatal factors that remain clinically relevant" }],
    },
    care: {
      sets: ["monitoring"],
      extras: [{ key: "nx_bh_followup", label: "Follow-up the birth history requires", type: "multi", options: ["Growth monitoring", "Developmental surveillance", "Hearing review", "Vision review", "Neurological review", "Immunisation catch-up", "None required"] }],
    },
  },

  peds_neonatal_progress: {
    purpose: "The neonatal daily note: feeds and weight, temperature, breathing and apnoea, bilirubin and the changes made today.",
    ctx: {
      sets: ["identity"],
      extras: [
        { key: "nx_np_day", label: "Day of life", type: "number", min: 0, max: 200 },
        { key: "nx_np_feeds", label: "Feeds in the last 24 hours", type: "input", placeholder: "Number, volume and route" },
        { key: "nx_np_events", label: "Events in the last 24 hours", type: "textarea", placeholder: "Apnoea, desaturation, bradycardia, bilirubin result, line changes" },
      ],
    },
    exam: { sets: ["measurements", "vitals", "examNeonate"] },
    assess: { sets: ["assessment", "workup"] },
    care: {
      sets: ["medication", "monitoring"],
      extras: [{ key: "nx_np_apnoea", label: "Apnoea and desaturation record", type: "textarea", placeholder: "How many episodes, what they required, and the response" }],
    },
  },

  peds_newborn_discharge_summary: {
    purpose: "Going home from the newborn unit: the course, the feeding and weight at discharge, the screening done, and the safety net for the first weeks.",
    ctx: { sets: ["identity", "neonatalHistory", "familySocial"] },
    exam: { sets: ["measurements", "vitals", "examNeonate"] },
    assess: { sets: ["assessment"] },
    care: {
      sets: ["medication", "monitoring", "disposition"],
      extras: [
        { key: "nx_nd_criteria", label: "Discharge criteria reviewed", type: "multi", options: ["Feeding established", "Weight trend documented", "Temperature stable in an open cot", "Jaundice reviewed or follow-up set", "Screening completed", "Vitamin K given", "Caregiver education completed", "Follow-up booked"] },
        { key: "nx_nd_safety_net", label: "Safety net given to the family", type: "textarea", placeholder: "The newborn findings that mean the baby must be seen the same day" },
      ],
    },
  },

  peds_adolescent_health: {
    purpose: "The adolescent assessment: growth and puberty, mental health and risk, confidentiality, and the preventive care this age needs.",
    ctx: { sets: ["identity", "adolescentHistory", "medsAllergy", "familySocial"] },
    exam: {
      sets: ["measurements", "vitals"],
      extras: [
        { key: "nx_ado_tanner", label: "Pubertal staging recorded", type: "input", placeholder: "Tanner stage documented, or the reason it was not assessed" },
        { key: "nx_ado_growth_spurt", label: "Growth spurt", type: "select", options: ["Appropriate for stage", "Early documented", "Delayed documented", "Not assessed", "Not documented"] },
      ],
    },
    assess: { sets: ["assessment", "workup"] },
    care: {
      sets: ["medication", "monitoring", "disposition"],
      extras: [
        { key: "nx_ado_preventive", label: "Preventive care at this visit", type: "multi", options: ["Vaccination catch-up", "Mental health screen", "Substance-use counselling", "Sexual health counselling", "Contraception discussed", "Sports or school participation", "Driving and safety advice"] },
        { key: "nx_ado_capacity", label: "Capacity and consent", type: "select", options: ["Assessed as competent to consent to this care", "Guardian consent documented", "Assent obtained from the adolescent", "Not assessed", "Not documented"] },
      ],
    },
  },

  peds_confidential_adolescent_note: {
    purpose: "The confidential record: the content the adolescent shared alone, the risk assessment, and the limits of confidentiality that were explained first.",
    ctx: {
      sets: ["identity", "adolescentHistory"],
      extras: [{ key: "nx_conf_disclosure", label: "What the adolescent disclosed in confidence", type: "textarea", placeholder: "Recorded only what the adolescent agreed may be recorded" }],
    },
    exam: { sets: ["vitals"] },
    assess: {
      sets: ["assessment"],
      extras: [
        { key: "nx_conf_risk", label: "Risk assessment documented", type: "multi", options: ["Risk to self assessed — no concern", "Risk to self — plan documented and action taken", "Risk from others assessed", "Risk from others — safeguarding action taken", "Risk to others assessed", "Not assessed"] },
        { key: "nx_conf_break", label: "Confidentiality limit reached", type: "select", options: ["No — nothing requiring disclosure", "Yes — disclosed with the adolescent's knowledge", "Yes — disclosed without consent, reason documented", "Not applicable", "Not documented"] },
      ],
    },
    care: {
      sets: ["monitoring", "disposition"],
      extras: [
        { key: "nx_conf_access", label: "Who may see this note", type: "select", options: ["Adolescent and treating clinician only", "Adolescent, clinician and named guardian with consent", "Institution policy applied", "Not documented"] },
        { key: "nx_conf_plan", label: "Agreed plan with the adolescent", type: "textarea", placeholder: "What was agreed, who does what, and how the adolescent will make contact" },
      ],
    },
  },
};

const BLOCK_META = {
  ctx: { section: "History & context", title: "History and clinical context" },
  exam: { section: "Measurements & examination", title: "Measurements, vital signs and examination" },
  assess: { section: "Assessment & differentials", title: "Assessment, differential and diagnostic workup" },
  care: { section: "Management & follow-up", title: "Management, medication safety, monitoring and follow-up" },
};

const buildBlock = (noteKey, part) => {
  const profile = PEDS_NOTE_PROFILES[noteKey];
  const spec = profile?.[part];
  if (!spec) return null;
  const meta = BLOCK_META[part];
  return {
    key: `peds_${part}_${suffix(noteKey)}`,
    title: meta.title,
    note: `${profile.purpose} A field left blank is reported as not documented, never as normal, and nothing is pre-selected.`,
    fields: fieldsFor(spec.sets, spec.extras),
  };
};

export const PEDS_NOTE_BLOCK_KEYS = Object.keys(PEDS_NOTE_PROFILES).flatMap((noteKey) =>
  Object.keys(BLOCK_META).map((part) => `peds_${part}_${suffix(noteKey)}`),
);

export const PEDS_NOTE_BLOCKS = Object.fromEntries(
  Object.keys(PEDS_NOTE_PROFILES).flatMap((noteKey) =>
    Object.keys(BLOCK_META)
      .map((part) => buildBlock(noteKey, part))
      .filter(Boolean)
      .map((block) => [block.key, block]),
  ),
);

export const pedsNoteBlockKey = (noteKey, part) => `peds_${part}_${suffix(noteKey)}`;