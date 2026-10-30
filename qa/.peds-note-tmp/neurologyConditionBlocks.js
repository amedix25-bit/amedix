// Neurology — the condition-specific records the note types were missing.
//
// Movement disorders, peripheral neuropathy and dizziness are the presentations
// that most often get written as a sentence. Each is recorded here in the
// elements that change what happens next: the pattern, the symmetry, the
// distribution, the timing, the observed signs and the response to what has
// already been tried. Every field is optional and a blank stays blank — nothing
// is inferred and nothing is pre-selected.

const YES_NO_NOT = ["Yes", "No", "Not documented"];
const LATERALITY = ["Right", "Left", "Bilateral", "Asymmetric", "Not documented"];

export const MOVEMENT_BLOCK = {
  key: "neuro_movement",
  title: "Movement Disorder Record",
  note: "Tremor, bradykinesia, rigidity, postural instability and gait are recorded separately, with symmetry and the effect of what has already been tried. A movement disorder is documented by its pattern, not by a single sign, and no diagnosis is written by this panel.",
  fields: [
    {
      key: "mov_presentation",
      label: "Predominant documented feature",
      type: "multi",
      options: [
        "Rest tremor", "Postural tremor", "Kinetic / intention tremor", "Bradykinesia",
        "Rigidity", "Postural instability", "Dystonia", "Chorea", "Myoclonus",
        "Tics", "Dyskinesia", "Freezing of gait", "Not documented",
      ],
    },
    { key: "mov_laterality", label: "Distribution", type: "select", options: LATERALITY },
    { key: "mov_onset_course", label: "Onset and course", type: "select", options: ["Insidious and progressive", "Stepwise", "Fluctuating", "Sudden", "Not documented"] },
    {
      key: "mov_tremor_character",
      label: "Tremor — character and conditions",
      type: "select",
      options: ["Rest, attenuates with action", "Postural only", "Kinetic", "Intention", "Mixed", "Not applicable", "Not documented"],
    },
    { key: "mov_tremor_frequency", label: "Tremor frequency and amplitude", type: "input", placeholder: "e.g. 4–6 Hz, moderate amplitude, right hand" },
    {
      key: "mov_rigidity",
      label: "Rigidity",
      type: "select",
      options: ["None documented", "Lead-pipe", "Cogwheel", "Axial", "Asymmetric", "Not documented"],
    },
    { key: "mov_bradykinesia_test", label: "Bradykinesia — how it was demonstrated", type: "input", placeholder: "Finger taps, hand opening, heel tapping, gait" },
    {
      key: "mov_postural",
      label: "Postural stability",
      type: "select",
      options: ["Normal", "Impaired — recovers", "Impaired — falls without assistance", "Not tested"],
    },
    { key: "mov_gait_pattern", label: "Gait pattern", type: "select", options: ["Normal", "Parkinsonian", "Freezing", "Ataxic", "Dystonic", "Choreic", "Unable to walk", "Not assessed"] },
    {
      key: "mov_nonmotor",
      label: "Non-motor features documented",
      type: "multi",
      options: [
        "Hyposmia", "Constipation", "Rapid eye movement sleep behaviour disorder",
        "Depression or anxiety", "Cognitive change", "Hallucinations",
        "Orthostatic symptoms", "None of these documented",
      ],
    },
    { key: "mov_medication_effect", label: "Treatment already tried and its documented effect", type: "textarea", placeholder: "Agent, dose, duration and what changed" },
    {
      key: "mov_levodopa_response",
      label: "Levodopa response, where documented",
      type: "select",
      options: ["Sustained benefit", "Benefit with wearing off", "On–off fluctuations", "Dyskinesia with benefit", "No benefit documented", "Not applicable", "Not documented"],
    },
    {
      key: "mov_impulse_control",
      label: "Impulse control and behavioural change screened",
      type: "select",
      options: ["Screened — none reported", "Screened — reported", "Not screened — reason documented", "Not documented"],
    },
    { key: "mov_family_history", label: "Family history of a similar disorder", type: "input", placeholder: "Relationship and condition, or 'none reported'" },
    { key: "mov_observed_response", label: "Response observed during this encounter", type: "textarea", placeholder: "What was examined, before and after any dose or manoeuvre" },
    {
      key: "mov_function",
      label: "Functional consequence documented",
      type: "select",
      options: ["No impact", "Writing or fine tasks affected", "Mobility affected", "Requires help with daily activities", "Not documented"],
    },
  ],
};

export const NEUROPATHY_BLOCK = {
  key: "neuro_neuropathy",
  title: "Peripheral Neuropathy Record",
  note: "The distribution, the modalities affected and the reflexes decide whether this is length-dependent, focal or multifocal — and that decides which search is documented. A normal examination is recorded as examined, never assumed.",
  fields: [
    {
      key: "nrp_distribution",
      label: "Distribution",
      type: "select",
      options: [
        "Symmetric length-dependent (stocking and glove)",
        "Symmetric proximal",
        "Focal — single nerve",
        "Multifocal — mononeuritis multiplex",
        "Asymmetric patchy",
        "Not documented",
      ],
    },
    { key: "nrp_onset_course", label: "Onset and course", type: "select", options: ["Acute (days)", "Subacute (weeks)", "Chronic (months)", "Stepwise", "Fluctuating", "Not documented"] },
    {
      key: "nrp_modalities",
      label: "Modalities affected",
      type: "multi",
      options: ["Large fibre — vibration", "Large fibre — proprioception", "Small fibre — pinprick", "Small fibre — temperature", "Motor", "Autonomic", "None documented"],
    },
    {
      key: "nrp_pain",
      label: "Pain features",
      type: "multi",
      options: ["Burning", "Electric or shooting", "Deep aching", "Allodynia", "Hyperalgesia", "Worse at night", "No pain documented"],
    },
    { key: "nrp_reflexes", label: "Ankle reflexes", type: "select", options: ["Present and symmetric", "Absent bilaterally", "Absent one side", "Brisk", "Not tested"] },
    { key: "nrp_proximal", label: "Proximal weakness", type: "select", options: YES_NO_NOT },
    { key: "nrp_gait", label: "Gait", type: "select", options: ["Normal", "Steppage", "Ataxic", "Antalgic", "Unable to walk", "Not assessed"] },
    { key: "nrp_foot", label: "Foot examination", type: "select", options: ["Intact", "Callus or ulcer documented", "Deformity", "Not examined"] },
    {
      key: "nrp_autonomic",
      label: "Autonomic features",
      type: "multi",
      options: ["Postural dizziness", "Bladder dysfunction", "Bowel dysfunction", "Erectile dysfunction", "Sweating change", "None documented"],
    },
    {
      key: "nrp_aetiology_screen",
      label: "Aetiological screen documented",
      type: "multi",
      options: [
        "Diabetes or glucose intolerance", "Alcohol", "Vitamin B12 or folate",
        "Thyroid disease", "Renal function", "Paraprotein screen",
        "Medication exposure", "Infection screen", "Malignancy", "Hereditary — family history",
        "None of these documented",
      ],
    },
    { key: "nrp_family", label: "Family history", type: "input", placeholder: "Relatives with neuropathy, or 'none reported'" },
    {
      key: "nrp_study",
      label: "Nerve conduction study and needle EMG",
      type: "select",
      options: ["Performed — result recorded", "Requested", "Not available — reason documented", "Not documented"],
    },
    {
      key: "nrp_small_fibre",
      label: "Small-fibre assessment where large-fibre studies are normal",
      type: "select",
      options: ["Skin biopsy performed — result recorded", "Autonomic testing performed", "Not performed — reason documented", "Not applicable", "Not documented"],
    },
    { key: "nrp_treatment_response", label: "Treatment tried and its documented effect", type: "textarea", placeholder: "Agent, dose, duration, and what changed" },
    {
      key: "nrp_safety_advice",
      label: "Safety advice given",
      type: "multi",
      options: ["Foot inspection", "Footwear", "Falls prevention", "Driving advice", "Workplace safety", "None documented"],
    },
  ],
};

export const DIZZINESS_BLOCK = {
  key: "neuro_dizziness",
  title: "Dizziness & Vertigo Record",
  note: "Dizziness is recorded by its type and its timing first, then by the examination that separates a central from a peripheral cause. A vascular cause is not excluded by a peripheral-looking picture, and the reasoning behind the recorded impression is written down.",
  fields: [
    {
      key: "dz_type",
      label: "Symptom type",
      type: "select",
      options: ["Rotational vertigo", "Non-rotational dizziness", "Presyncope", "Disequilibrium or unsteadiness", "Mixed", "Not documented"],
    },
    {
      key: "dz_pattern",
      label: "Timing pattern",
      type: "select",
      options: [
        "Episodic — triggered by head position",
        "Episodic — spontaneous",
        "Continuous and prolonged (days)",
        "Chronic persistent (weeks or months)",
        "Single episode, resolved",
        "Not documented",
      ],
    },
    { key: "dz_duration", label: "Duration of an episode", type: "input", placeholder: "Seconds, minutes, hours or days" },
    { key: "dz_frequency", label: "Frequency", type: "input", placeholder: "e.g. several times a day for two weeks" },
    {
      key: "dz_triggers",
      label: "Triggers documented",
      type: "multi",
      options: ["Rolling over in bed", "Head extension", "Standing up", "Head movement", "Coughing or straining", "Loud noise", "No trigger", "Not documented"],
    },
    {
      key: "dz_associated",
      label: "Associated symptoms",
      type: "multi",
      options: [
        "Hearing loss", "Tinnitus", "Aural fullness", "Diplopia", "Dysarthria",
        "Dysphagia", "Facial numbness", "Limb weakness", "Limb sensory change",
        "Ataxia", "Headache", "Photophobia", "None of these documented",
      ],
    },
    {
      key: "dz_head_impulse",
      label: "Head impulse test",
      type: "select",
      options: ["Normal", "Abnormal — corrective saccade", "Not performed", "Not applicable"],
    },
    {
      key: "dz_nystagmus",
      label: "Nystagmus",
      type: "select",
      options: [
        "Absent", "Horizontal, direction-fixed, suppressed by fixation",
        "Direction-changing", "Vertical", "Torsional", "Gaze-evoked", "Not documented",
      ],
    },
    { key: "dz_skew", label: "Test of skew (vertical divergence)", type: "select", options: ["Absent", "Present — vertical correction", "Not performed"] },
    { key: "dz_positional", label: "Positional testing", type: "select", options: ["Dix-Hallpike positive", "Dix-Hallpike negative", "Supine roll positive", "Supine roll negative", "Not performed"] },
    { key: "dz_gait", label: "Gait and truncal stability", type: "select", options: ["Normal", "Unsteady — able to walk", "Unable to walk unaided", "Unable to stand", "Not assessed"] },
    { key: "dz_romb", label: "Romberg", type: "select", options: ["Negative", "Positive", "Not tested"] },
    { key: "dz_orthostatic", label: "Blood pressure — lying and standing", type: "input", placeholder: "Readings with the interval documented" },
    {
      key: "dz_vascular_risk",
      label: "Vascular risk documented",
      type: "multi",
      options: ["Hypertension", "Diabetes", "Atrial fibrillation", "Previous stroke or TIA", "Anticoagulant or antiplatelet", "Smoking", "None documented"],
    },
    {
      key: "dz_reasoning",
      label: "Reasoning recorded for the documented impression",
      type: "textarea",
      placeholder: "Why the examination supports a peripheral or a central explanation, and what argued against the other",
    },
    {
      key: "dz_tests",
      label: "Further testing recorded",
      type: "multi",
      options: ["Audiometry", "Vestibular function testing", "Brain imaging", "Cardiac rhythm assessment", "Orthostatic assessment", "None documented"],
    },
    { key: "dz_manoeuvre_response", label: "Response to any repositioning manoeuvre", type: "textarea", placeholder: "What was performed, and the symptom response" },
  ],
};

export const NEURO_CONDITION_BLOCKS = [MOVEMENT_BLOCK, NEUROPATHY_BLOCK, DIZZINESS_BLOCK];