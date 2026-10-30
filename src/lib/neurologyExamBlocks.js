// Neurology — history and examination blocks.
//
// One registry for the neurological history and examination, so the note form, the
// saved record and the printed note read the same definitions. Every item is
// optional and nothing is pre-selected: a blank is "not documented", never normal.
// Conditional items appear only where the context makes them relevant.

export const HISTORY_BLOCK = {
  key: "neuro_history",
  title: "Neurological History",
  note: "Structured so the tempo and course of the illness are readable separately from the examination. Onset, course and laterality are recorded as facts — a blank is not a normal finding.",
  fields: [
    { key: "hist_onset", label: "Onset date and time", type: "input", placeholder: "Date and time symptoms began" },
    {
      key: "hist_tempo",
      label: "Tempo of onset",
      type: "select",
      options: ["Hyperacute (minutes)", "Acute (hours)", "Subacute (days)", "Chronic (weeks to months)", "Not documented"],
    },
    {
      key: "hist_course",
      label: "Course since onset",
      type: "select",
      options: ["Monophasic", "Progressive", "Stepwise", "Relapsing and remitting", "Fluctuating", "Static", "Not documented"],
    },
    { key: "hist_laterality", label: "Laterality", type: "select", options: ["Right", "Left", "Bilateral", "Midline / systemic", "Not applicable", "Not documented"] },
    { key: "hist_first_episode", label: "First episode of this problem", type: "select", options: ["Yes", "No", "Not documented"] },
    { key: "hist_episode_count", label: "Number of episodes to date", type: "input", placeholder: "e.g. 3 in the last 6 months" },
    { key: "hist_triggers", label: "Triggers and relieving factors", type: "input", placeholder: "e.g. exercise, heat, sleep deprivation, posture, Valsalva" },
    {
      key: "hist_associated",
      label: "Associated features reported",
      type: "multi",
      options: [
        "Headache", "Nausea or vomiting", "Visual disturbance", "Speech disturbance",
        "Weakness", "Sensory change", "Seizure", "Altered consciousness",
        "Fever", "Neck stiffness", "Trauma", "None of these documented",
      ],
    },
    {
      key: "hist_functional_impact",
      label: "Functional impact",
      type: "select",
      options: ["No impact", "Interferes with work or study", "Requires help with daily activities", "Bedbound", "Not documented"],
    },
    { key: "hist_prior_events", label: "Prior documented neurological events", type: "textarea", placeholder: "Previous strokes, seizures, admissions, documented diagnoses and where they were recorded" },
    { key: "hist_relatives", label: "Relatives with a similar or related condition", type: "input", placeholder: "Relationship and condition, or 'none reported'" },
    {
      key: "hist_source",
      label: "Source of the history",
      type: "select",
      options: ["Patient", "Relative or carer", "Referral letter", "Transfer from another facility", "Records reviewed", "Not documented"],
    },
    {
      key: "hist_reliability",
      label: "Reliability of the history",
      type: "select",
      options: ["Reliable", "Partial — collateral needed", "Unavailable — collateral required", "Not documented"],
    },
  ],
};

export const INTERVAL_BLOCK = {
  key: "neuro_interval",
  title: "Interval Neurological History",
  note: "What changed since the last documented review — recorded as change, not as a repeated summary of the previous note.",
  fields: [
    { key: "int_since_date", label: "Since (date of last review)", type: "input" },
    { key: "int_new_symptoms", label: "New symptoms since the last review", type: "textarea" },
    { key: "int_events", label: "Attacks, seizures or admissions since the last review", type: "textarea", placeholder: "Number, dates, duration, recovery" },
    { key: "int_function", label: "Change in function", type: "select", options: ["Improved", "Unchanged", "Declined", "Fluctuating", "Not documented"] },
    { key: "int_adherence", label: "Adherence to the documented therapy", type: "select", options: ["Taken as prescribed", "Missed doses documented", "Stopped — reason documented", "Not applicable", "Not documented"] },
    { key: "int_adverse_effects", label: "Adverse effects reported", type: "textarea" },
    { key: "int_results_reviewed", label: "Results reviewed since the last note", type: "textarea", placeholder: "Which results, date, and what they changed" },
    { key: "int_carer_concern", label: "Carer or family concern", type: "textarea" },
  ],
};

export const MENTAL_STATUS_BLOCK = {
  key: "neuro_mental_status",
  title: "Mental Status & Awareness",
  note: "Awareness, orientation, attention, language and cognition recorded as observed. A component that was not tested is documented as not tested, never left to read as normal.",
  fields: [
    {
      key: "mse_consciousness",
      label: "Level of consciousness",
      type: "select",
      options: ["Alert", "Drowsy but rousable", "Stuporose", "Comatose", "Sedated or paralysed", "Not documented"],
    },
    {
      key: "mse_orientation",
      label: "Orientation",
      type: "multi",
      options: ["Person", "Place", "Time", "Situation", "Disoriented to all domains"],
    },
    { key: "mse_attention", label: "Attention and concentration", type: "select", options: ["Normal", "Impaired", "Fluctuating", "Not tested"] },
    {
      key: "mse_language",
      label: "Language",
      type: "select",
      options: ["Normal", "Dysarthric (language intact)", "Expressive aphasia", "Receptive aphasia", "Global aphasia", "Mutism", "Not tested"],
    },
    { key: "mse_speech", label: "Speech and articulation", type: "input", placeholder: "Fluency, volume, articulation, comprehension" },
    { key: "mse_memory", label: "Memory", type: "input", placeholder: "Immediate, recent and remote recall as tested" },
    { key: "mse_executive", label: "Executive function", type: "input", placeholder: "Task switching, abstraction, planning" },
    { key: "mse_visuospatial", label: "Visuospatial function", type: "input", placeholder: "Neglect, construction, clock drawing" },
    { key: "mse_behaviour", label: "Behaviour and mood as observed", type: "input" },
    { key: "mse_insight", label: "Insight and judgement", type: "input" },
    {
      key: "mse_delirium",
      label: "Delirium screen",
      type: "select",
      options: ["Negative", "Positive — instrument and score documented", "Not performed"],
    },
  ],
};

export const CRANIAL_NERVES_BLOCK = {
  key: "neuro_cranial_nerves",
  title: "Cranial Nerves",
  note: "Each nerve group is recorded separately, so an untested nerve is visible as untested. Papilloedema and a relative afferent pupillary defect are recorded explicitly; neither is inferred from a normal visual acuity.",
  fields: [
    { key: "cn_i", label: "I — Olfaction", type: "select", options: ["Normal", "Reduced", "Absent", "Not tested"] },
    { key: "cn_ii_acuity", label: "II — Visual acuity", type: "input", placeholder: "Right and left, with correction" },
    { key: "cn_ii_fields", label: "II — Visual fields", type: "input", placeholder: "Confrontation findings, or formal field result" },
    {
      key: "cn_fundus",
      label: "Fundoscopy",
      type: "select",
      options: ["Normal", "Papilloedema", "Optic atrophy", "Other finding documented", "Not performed"],
    },
    {
      key: "cn_pupils",
      label: "Pupils",
      type: "select",
      options: ["Equal and reactive", "Anisocoria", "Fixed and dilated", "Relative afferent pupillary defect", "Not documented"],
    },
    {
      key: "cn_iii_iv_vi",
      label: "III, IV, VI — Eye movements",
      type: "select",
      options: ["Full and conjugate", "Diplopia documented", "Gaze palsy", "Internuclear ophthalmoplegia", "Nystagmus", "Not tested"],
    },
    { key: "cn_v", label: "V — Trigeminal", type: "input", placeholder: "Facial sensation and masseter power" },
    {
      key: "cn_vii",
      label: "VII — Facial nerve",
      type: "select",
      options: ["Normal", "Upper motor neurone pattern (forehead spared)", "Lower motor neurone pattern (whole side)", "Bilateral weakness", "Not tested"],
    },
    {
      key: "cn_viii",
      label: "VIII — Hearing",
      type: "select",
      options: ["Normal", "Sensorineural loss", "Conductive loss", "Tinnitus documented", "Not tested"],
    },
    {
      key: "cn_ix_x",
      label: "IX, X — Bulbar",
      type: "select",
      options: ["Normal", "Dysphagia", "Dysarthria", "Absent gag reflex", "Not tested"],
    },
    { key: "cn_xi", label: "XI — Accessory", type: "input", placeholder: "Sternocleidomastoid and trapezius power" },
    {
      key: "cn_xii",
      label: "XII — Tongue",
      type: "select",
      options: ["Normal", "Unilateral weakness", "Bilateral weakness", "Fasciculation", "Not tested"],
    },
    { key: "cn_other", label: "Other cranial nerve findings", type: "textarea" },
  ],
};

const MRC = ["5 — Normal power", "4 — Movement against resistance", "3 — Movement against gravity", "2 — Movement with gravity eliminated", "1 — Flicker only", "0 — No movement", "Not tested"];

export const MOTOR_BLOCK = {
  key: "neuro_motor",
  title: "Motor System",
  note: "Power is recorded per limb with the Medical Research Council grade, so a pattern (upper or lower motor neurone, proximal or distal, symmetric or not) is readable from the record.",
  fields: [
    {
      key: "mot_tone",
      label: "Tone",
      type: "select",
      options: ["Normal", "Increased — spasticity", "Increased — rigidity", "Decreased", "Mixed", "Not tested"],
    },
    { key: "mot_right_arm", label: "Power — right arm", type: "select", options: MRC },
    { key: "mot_left_arm", label: "Power — left arm", type: "select", options: MRC },
    { key: "mot_right_leg", label: "Power — right leg", type: "select", options: MRC },
    { key: "mot_left_leg", label: "Power — left leg", type: "select", options: MRC },
    {
      key: "mot_drift",
      label: "Pronator drift",
      type: "select",
      options: ["None", "Right", "Left", "Both", "Not tested"],
    },
    {
      key: "mot_pattern",
      label: "Pattern of weakness",
      type: "select",
      options: ["No weakness documented", "Upper motor neurone pattern", "Lower motor neurone pattern", "Proximal", "Distal", "Asymmetric", "Not documented"],
    },
    {
      key: "mot_bulk",
      label: "Bulk and spontaneous activity",
      type: "select",
      options: ["Normal", "Atrophy", "Fasciculation", "Atrophy and fasciculation", "Not documented"],
    },
    { key: "mot_functional", label: "Documented function", type: "input", placeholder: "Grip, shoulder abduction, sit-to-stand, transfers, walking" },
  ],
};

const REFLEX = ["0 — Absent", "1+ — Diminished", "2+ — Normal", "3+ — Brisk", "4+ — Clonus", "Not tested"];

export const REFLEX_BLOCK = {
  key: "neuro_reflexes",
  title: "Reflexes & Sensation",
  note: "Tendon reflexes, plantar responses, clonus and each sensory modality are recorded separately with their distribution. A sensory level is asked for explicitly when a spinal cord process is possible.",
  fields: [
    { key: "ref_biceps", label: "Biceps reflex", type: "select", options: REFLEX },
    { key: "ref_supinator", label: "Supinator reflex", type: "select", options: REFLEX },
    { key: "ref_knee", label: "Knee reflex", type: "select", options: REFLEX },
    { key: "ref_ankle", label: "Ankle reflex", type: "select", options: REFLEX },
    {
      key: "ref_plantar",
      label: "Plantar response",
      type: "select",
      options: ["Flexor both", "Extensor right", "Extensor left", "Extensor both", "Withdrawal — not interpretable", "Not tested"],
    },
    { key: "ref_clonus", label: "Clonus", type: "select", options: ["Absent", "Present right", "Present left", "Bilateral", "Not tested"] },
    {
      key: "ref_sensory_modalities",
      label: "Sensory modalities tested",
      type: "multi",
      options: ["Light touch", "Pinprick", "Temperature", "Vibration", "Proprioception", "None tested"],
    },
    {
      key: "ref_sensory_distribution",
      label: "Sensory distribution",
      type: "select",
      options: ["Normal", "Glove-and-stocking", "Dermatomal", "Spinal level", "Hemibody", "Patchy or non-anatomical", "Not documented"],
    },
    { key: "ref_sensory_level", label: "Sensory level (dermatome)", type: "input", placeholder: "e.g. T4, or 'not applicable'" },
    { key: "ref_romberg", label: "Romberg", type: "select", options: ["Negative", "Positive", "Not tested"] },
    { key: "ref_extras", label: "Other reflex or sensory findings", type: "textarea" },
  ],
};

export const COORDINATION_BLOCK = {
  key: "neuro_coordination",
  title: "Coordination, Gait & Balance",
  note: "Cerebellar and gait findings are recorded per side and as a named pattern, so an ataxic gait is not confused with a weak or antalgic one.",
  fields: [
    {
      key: "coo_finger_nose",
      label: "Finger-to-nose",
      type: "select",
      options: ["Normal", "Impaired right", "Impaired left", "Bilateral impairment", "Not tested"],
    },
    {
      key: "coo_heel_shin",
      label: "Heel-to-shin",
      type: "select",
      options: ["Normal", "Impaired right", "Impaired left", "Bilateral impairment", "Not tested"],
    },
    {
      key: "coo_dysdiadochokinesia",
      label: "Dysdiadochokinesia",
      type: "select",
      options: ["Absent", "Present right", "Present left", "Bilateral", "Not tested"],
    },
    {
      key: "coo_tremor",
      label: "Tremor",
      type: "select",
      options: ["None", "Rest tremor", "Postural tremor", "Intention tremor", "Mixed", "Not documented"],
    },
    {
      key: "coo_gait",
      label: "Gait",
      type: "select",
      options: ["Normal", "Hemiparetic", "Spastic", "Ataxic", "Parkinsonian", "Antalgic", "Unable to walk", "Not assessed"],
    },
    { key: "coo_tandem", label: "Tandem gait and balance", type: "select", options: ["Normal", "Impaired", "Unable", "Not tested"] },
    { key: "coo_pull_test", label: "Pull test (postural stability)", type: "select", options: ["Normal", "Retropulsion documented", "Falls without assistance", "Not tested"] },
  ],
};

export const MENINGEAL_BLOCK = {
  key: "neuro_meningeal",
  title: "Meningeal & Spinal Signs",
  note: "Meningeal irritation and spinal cord/root signs are recorded as examined. Cauda equina warning signs — saddle sensation, bladder and bowel function — are asked for explicitly, because a missing answer there is not a negative one.",
  fields: [
    { key: "men_neck_stiffness", label: "Neck stiffness", type: "select", options: ["Absent", "Present", "Not assessed"] },
    { key: "men_kernig", label: "Kernig sign", type: "select", options: ["Negative", "Positive", "Not tested"] },
    { key: "men_brudzinski", label: "Brudzinski sign", type: "select", options: ["Negative", "Positive", "Not tested"] },
    { key: "men_jolt", label: "Jolt accentuation of headache", type: "select", options: ["Negative", "Positive", "Not tested"] },
    { key: "men_spinal_tenderness", label: "Spinal tenderness", type: "select", options: ["Absent", "Present — level documented", "Not assessed"] },
    {
      key: "men_slr",
      label: "Straight leg raise",
      type: "select",
      options: ["Negative", "Positive right", "Positive left", "Bilateral", "Not tested"],
    },
    {
      key: "men_saddle",
      label: "Saddle sensation",
      type: "select",
      options: ["Intact", "Reduced", "Anaesthetic", "Not assessed"],
    },
    {
      key: "men_bladder",
      label: "Bladder and bowel function",
      type: "select",
      options: ["Normal", "Urinary retention", "Incontinence", "Catheterised", "Not assessed"],
    },
  ],
};