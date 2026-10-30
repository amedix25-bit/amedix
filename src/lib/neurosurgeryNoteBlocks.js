// NEUROSURGERY — the shared note-field builders.
//
// Every neurosurgical note is composed from these, so a block means the same
// thing in every note that uses it: the vital signs block is the shared vitals
// component, the examination block is the shared structured examination, the
// diagnosis block is the shared ICD-11 field, and the emergency, operation and
// post-operative blocks are the three structured records added with the
// emergency and operative scope.
//
// Extracted from the catalogue so a new note type can be added in its own
// module without the catalogue file growing for every note.

export const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
export const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
export const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
export const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });

export const R = { required: true };
export const when = (key, ...values) => ({ showIf: { key, in: values } });
export const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

export const NOT_DOCUMENTED = "Not documented";
export const SIDE = ["Left", "Right", "Bilateral", "Midline", "Not applicable", NOT_DOCUMENTED];
export const PUPILS = [
  "Symmetrical and reactive",
  "Asymmetrical — one pupil larger",
  "Fixed and dilated — unilateral",
  "Fixed and dilated — bilateral",
  "Unable to assess",
];

export const vitalsBlock = () =>
  sec("Observations", [{ key: "vitals", label: "Vital Signs", type: "vitals" }]);

export const examBlock = () =>
  sec("Examination", [
    {
      key: "examinations",
      label: "Select Examination",
      type: "examinations",
      examinationTypes: ["neurological", "general", "musculoskeletal", "custom"],
    },
  ]);

export const icdBlock = (placeholder) =>
  sec("Diagnosis Classification (ICD-11)", [
    {
      key: "icd11_diagnoses",
      label: "Neurosurgical Diagnoses (ICD-11 MMS) — role, status and clinical basis",
      type: "icd11_diagnoses",
      catalog: [],
      searchPlaceholder: placeholder,
      catalogNote:
        "Neurosurgery has no verified code subset bundled in this build. Enter the code and official term from the WHO ICD-11 browser — the entry is stored as review required until it is checked.",
    },
  ]);

export const guidanceBlock = (noteKey) =>
  sec("Coding Guidance & Clinical Decision Support", [
    {
      key: "nsg_guidance",
      label: "Neurosurgical coding guidance and conditional safety prompts",
      type: "nsg_guidance",
      noteKey,
    },
  ]);

export const gcsBlock = () => [
  { key: "gcs", label: "Glasgow Coma Scale (GCS) — components as examined", type: "gcs_score" },
  S("pupils", "Pupillary findings", PUPILS),
  S("neuro_deterioration", "Documented neurological deterioration during this episode", [
    "No",
    "Yes",
    "Unable to assess",
  ]),
];

export const examField = () =>
  sec("Neurological Examination", [
    {
      key: "nsg_exam",
      label:
        "Structured neurosurgical examination — conscious level and orientation, pupils, cranial nerves, MRC power, sensory level and modality, reflexes with plantar response and clonus, coordination and cerebellar signs, gait, meningeal signs, spinal column with dermatomal and myotomal level",
      type: "nsg_exam",
    },
  ]);

export const isncsciBlock = (showIf) =>
  sec("ISNCSCI / ASIA Examination", [
    {
      key: "nsg_isncsci",
      label: "ISNCSCI / ASIA examination — key muscles, dermatomes, sacral examination, levels and AIS grade",
      type: "nsg_isncsci",
      ...(showIf ? { showIf } : {}),
    },
  ]);

export const scoreBlock = () =>
  sec("Validated Scores & Classifications", [
    {
      key: "nsg_scores",
      label: "Scores and classifications that apply to this condition — calculated only from documented values",
      type: "nsg_scores",
    },
  ]);

// The time-critical pathway: presentation, stability, red flags, the actions
// taken with their times, the specialist discussion, the transfer decision and
// who is responsible. Nothing here blocks treatment.
export const emergencyBlock = () =>
  sec("Emergency Assessment & Time-Critical Pathway", [
    {
      key: "nsg_emergency",
      label:
        "Emergency presentation and timing, airway / breathing / circulation, neurological status and red flags, time-critical actions, specialist discussion, transfer decision, deterioration response and the responsible clinician",
      type: "nsg_emergency",
    },
  ]);

// The operation record: everything an operation note has to carry, plus the
// procedure-specific block for the procedure performed.
export const operativeBlock = () =>
  sec("Operation Record", [
    {
      key: "nsg_operative",
      label:
        "Operation record — pre-operative diagnosis and indication, consent, surgical team, anaesthesia, positioning and approach, operative steps, findings and anatomy, implants and traceability, specimens, blood loss, drains, complications, closure, destination and the immediate post-operative record",
      type: "nsg_operative",
    },
  ]);

// Post-operative monitoring. "monitoring" is the reduced form used by the
// progress note, whose wound, drain and complication fields already exist: it
// adds the observation interval, the neurological trend and the documented
// thresholds for calling for help, without asking the same thing twice.
export const postopBlock = (variant = "full") =>
  sec("Post-Operative Monitoring", [
    {
      key: "nsg_postop",
      label:
        "Post-operative observation interval and neurological trend, wound and drain, bleeding, infection, CSF leak and pressure concerns, the documented thresholds for calling for help, the action taken, the responsible clinician and the review plan",
      type: "nsg_postop",
      variant,
    },
  ]);