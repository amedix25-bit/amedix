// Neurology — diagnostic-report and procedure blocks.
//
// An EEG or EMG report is an interpretation of a recording or a study, not a
// diagnosis: each report states the technical conditions, the findings, the
// interpretation and what the study cannot answer.

export const EEG_BLOCK = {
  key: "neuro_eeg",
  title: "EEG Recording & Reporting",
  note: "Recording state, montage, background, activation procedures, discharges with their location and the electrographic seizure statement are recorded separately. A report that could not answer the clinical question says so.",
  fields: [
    {
      key: "eeg_state",
      label: "Recording state",
      type: "select",
      options: ["Awake", "Drowsy", "Sleep", "Awake and sleep", "Coma", "Not documented"],
    },
    { key: "eeg_duration", label: "Recording duration", type: "number", unit: "minutes", min: 0, max: 1440 },
    { key: "eeg_electrodes", label: "Electrode set", type: "input", placeholder: "e.g. 21-channel 10-20, or reduced montage" },
    {
      key: "eeg_montage",
      label: "Montage",
      type: "select",
      options: ["Longitudinal bipolar", "Transverse bipolar", "Referential", "Average reference", "Laplacian", "Not documented"],
    },
    {
      key: "eeg_background",
      label: "Background activity",
      type: "select",
      options: [
        "Normal posterior dominant rhythm", "Generalised slowing", "Focal slowing", "Suppressed or low voltage",
        "Excessively fast", "Disorganised", "Not interpretable",
      ],
    },
    { key: "eeg_pdr", label: "Posterior dominant rhythm frequency", type: "number", unit: "Hz", min: 0, max: 30 },
    {
      key: "eeg_symmetry",
      label: "Symmetry",
      type: "select",
      options: ["Symmetric", "Asymmetric — right slower or lower amplitude", "Asymmetric — left slower or lower amplitude", "Not documented"],
    },
    { key: "eeg_hyperventilation", label: "Hyperventilation", type: "select", options: ["Performed", "Not performed", "Attempted — not completed"] },
    { key: "eeg_photic", label: "Photic stimulation", type: "select", options: ["Performed", "Not performed"] },
    { key: "eeg_activation_response", label: "Response to activation", type: "input", placeholder: "Change produced, if any" },
    {
      key: "eeg_discharges",
      label: "Discharges",
      type: "select",
      options: ["None", "Focal", "Generalised", "Multifocal", "Periodic or rhythmic patterns", "Not documented"],
    },
    {
      key: "eeg_discharge_types",
      label: "Discharge morphology",
      type: "multi",
      options: ["Spike", "Polyspike", "Spike-and-wave", "Sharp wave", "Slow wave", "Rhythmic delta", "Burst suppression", "Electrographic seizure pattern"],
    },
    { key: "eeg_discharge_location", label: "Discharge location and field", type: "input", placeholder: "e.g. left temporal, maximum T3" },
    { key: "eeg_discharge_frequency", label: "Discharge frequency and abundance", type: "input", placeholder: "e.g. 3 Hz, continuous for 40 seconds" },
    {
      key: "eeg_electrographic_seizure",
      label: "Electrographic seizure recorded",
      type: "select",
      options: ["Present", "Absent", "Equivocal — described", "Not documented"],
    },
    { key: "eeg_sleep_features", label: "Sleep features", type: "select", options: ["Normal", "Abnormal — documented", "Sleep not recorded"] },
    { key: "eeg_clinical_correlation", label: "Clinical correlation", type: "textarea", placeholder: "What the clinical events showed during the recording" },
    { key: "eeg_limitation", label: "What this recording cannot answer", type: "textarea", placeholder: "e.g. a normal interictal record does not exclude epilepsy" },
  ],
};

export const EMG_BLOCK = {
  key: "neuro_emg",
  title: "NCS / EMG Study Details",
  note: "Limb temperature, the reference values used, the measured values and the needle findings are recorded, so the interpretation can be checked against the data rather than taken on trust.",
  fields: [
    { key: "emg_temperature", label: "Limb temperature", type: "number", unit: "°C", min: 20, max: 40 },
    {
      key: "emg_limbs",
      label: "Limbs studied",
      type: "multi",
      options: ["Right arm", "Left arm", "Right leg", "Left leg", "Facial", "Paraspinal"],
    },
    { key: "emg_reference_values", label: "Reference values used", type: "input", placeholder: "Laboratory reference set or published normative values" },
    { key: "emg_motor_studies", label: "Motor conduction studies", type: "textarea", placeholder: "Nerve, stimulation site, amplitude, latency, velocity" },
    { key: "emg_sensory_studies", label: "Sensory conduction studies", type: "textarea", placeholder: "Nerve, amplitude, latency, velocity" },
    { key: "emg_fwaves", label: "F-waves", type: "select", options: ["Normal", "Abnormal — documented", "Not performed", "Not documented"] },
    { key: "emg_hreflex", label: "H-reflex", type: "select", options: ["Normal", "Abnormal — documented", "Not performed", "Not documented"] },
    {
      key: "emg_spontaneous_activity",
      label: "Needle examination — spontaneous activity",
      type: "multi",
      options: ["Fibrillation potentials", "Positive sharp waves", "Fasciculation potentials", "Myotonic discharges", "Complex repetitive discharges", "None documented"],
    },
    {
      key: "emg_muap",
      label: "Motor unit action potentials",
      type: "select",
      options: ["Normal", "Short and small", "Long and large", "Mixed", "Not documented"],
    },
    { key: "emg_recruitment", label: "Recruitment", type: "select", options: ["Normal", "Reduced", "Rapid", "Not documented"] },
    {
      key: "emg_pattern",
      label: "Documented pattern",
      type: "select",
      options: ["Normal study", "Axonal", "Demyelinating", "Mixed axonal and demyelinating", "Myopathic", "Not interpretable"],
    },
    { key: "emg_limitation", label: "Limitation of this study", type: "textarea" },
  ],
};

export const PROCEDURE_BLOCK = {
  key: "neuro_procedure",
  title: "Procedure Details",
  note: "A lumbar puncture records the opening pressure and the cerebrospinal fluid as measured. A value that was not obtained is recorded as not obtained, never left to read as normal.",
  fields: [
    {
      key: "proc_type",
      label: "Procedure performed",
      type: "select",
      options: ["Lumbar puncture", "Botulinum toxin injection", "Nerve or trigger-point block", "Other documented procedure"],
    },
    { key: "proc_position", label: "Position and approach", type: "input", placeholder: "e.g. left lateral decubitus, L4/L5" },
    { key: "proc_needle", label: "Needle and technique", type: "input" },
    { key: "proc_guidance", label: "Ultrasound or fluoroscopic guidance", type: "select", options: ["Used", "Not used", "Not applicable"] },
    {
      key: "proc_aseptic",
      label: "Aseptic technique documented",
      type: "select",
      options: ["Skin preparation and sterile drape recorded", "Partial — documented", "Not documented"],
    },
    { key: "proc_opening_pressure", label: "Opening pressure", type: "input", placeholder: "cm H₂O" },
    {
      key: "proc_csf_appearance",
      label: "Cerebrospinal fluid appearance",
      type: "select",
      options: ["Clear", "Turbid", "Purulent", "Blood-stained", "Xanthochromic", "Not applicable"],
    },
    { key: "proc_samples", label: "Samples sent", type: "multi", options: ["Cell count", "Protein", "Glucose", "Culture", "Cytology", "Oligoclonal bands", "Not applicable"] },
    {
      key: "proc_complications",
      label: "Complications during or after the procedure",
      type: "multi",
      options: ["None", "Post-dural puncture headache", "Bloody tap", "Radicular pain", "Vasovagal reaction", "Other documented"],
    },
    { key: "proc_post_observations", label: "Post-procedure observations recorded", type: "textarea", placeholder: "What was observed, by whom and when" },
    { key: "proc_patient_tolerance", label: "Patient tolerance", type: "select", options: ["Good", "Fair", "Poor — documented", "Not documented"] },
  ],
};