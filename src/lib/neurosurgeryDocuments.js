// NEUROSURGERY — specialty documentation set.
//
// WHAT EXISTED BEFORE THIS MODULE
//   Neurosurgery was registered as a specialty but resolved to the General
//   Surgery key, so a neurosurgeon saw the general surgical templates and no
//   neurosurgical template existed at all. Nothing is deleted or renamed here:
//   the surgical set is untouched and every saved surgical note keeps its key
//   and its meaning. This module supplies the neurosurgical documentation that
//   was missing, on the same framework every other specialty uses.
//
// DESIGN RULES FOLLOWED (identical to the other specialties)
//   - Nothing duplicates a shared AMedix surface: vital signs, the structured
//     neurological examination, the patient's recorded history, medications and
//     allergies, laboratory and radiology results are attached by the Patient
//     Record and the shared note tabs, never re-typed here.
//   - Examination is recorded through the shared `examinations` component.
//   - GCS is the shared component: the three components as examined, never a
//     severity band chosen from a list.
//   - ICD-11 diagnosis entry is the shared field: role, status, basis and
//     mapping state travel with every entry. No code is pre-loaded or invented
//     for Neurosurgery in this build, and the note says so.
//   - Conditional fields appear only in the context that makes them relevant, so
//     a shunt note never asks for operative detail and a ward-round note never
//     asks for a mechanism of injury.
//   - Clinical decision support is advisory, sourced and never blocking.
//   - Every field is optional except a documented differential diagnosis: an
//     unanswered field is never read as normal, and "Not documented" is a real
//     answer everywhere it appears.

import { guidelineBasisLabels } from "@/lib/neurosurgeryReferences";

const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
const N = (key, label, extra) => ({ key, label, type: "number", ...extra });
const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });

const R = { required: true };
const when = (key, ...values) => ({ showIf: { key, in: values } });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

const NOT_DOCUMENTED = "Not documented";
const SIDE = ["Left", "Right", "Bilateral", "Midline", "Not applicable", NOT_DOCUMENTED];
const PUPILS = [
  "Symmetrical and reactive",
  "Asymmetrical — one pupil larger",
  "Fixed and dilated — unilateral",
  "Fixed and dilated — bilateral",
  "Unable to assess",
];

const vitalsBlock = () => sec("Observations", [{ key: "vitals", label: "Vital Signs", type: "vitals" }]);

const examBlock = () =>
  sec("Examination", [
    {
      key: "examinations",
      label: "Select Examination",
      type: "examinations",
      examinationTypes: ["neurological", "general", "musculoskeletal", "custom"],
    },
  ]);

const icdBlock = (placeholder) =>
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

const guidanceBlock = (noteKey) =>
  sec("Coding Guidance & Clinical Decision Support", [
    {
      key: "nsg_guidance",
      label: "Neurosurgical coding guidance and conditional safety prompts",
      type: "nsg_guidance",
      noteKey,
    },
  ]);

const gcsBlock = () => [
  { key: "gcs", label: "Glasgow Coma Scale (GCS) — components as examined", type: "gcs_score" },
  S("pupils", "Pupillary findings", PUPILS),
  S("neuro_deterioration", "Documented neurological deterioration during this episode", [
    "No",
    "Yes",
    "Unable to assess",
  ]),
];

// ---------------------------------------------------------------------------
// 1. Neurosurgical Consultation
// ---------------------------------------------------------------------------
const CONSULTATION = {
  key: "nsg_consultation",
  label: "Neurosurgical Consultation",
  specialty: "neurosurgery",
  fields: [
    ...sec("Presenting Problem", [
      I("referral_question", "Reason for neurosurgical opinion / clinical question asked", R),
      I("presenting_complaint", "Presenting complaint", R),
      T("hpi", "History of present illness — onset, tempo, character, and what makes it better or worse", R),
      S("symptom_duration", "Duration of symptoms", [
        "< 24 hours",
        "1–7 days",
        "1–4 weeks",
        "1–6 months",
        "> 6 months",
        NOT_DOCUMENTED,
      ]),
      N("pain_score", "Pain score (0–10)", { min: 0, max: 10 }),
      T("associated_symptoms", "Associated neurological symptoms — headache, weakness, sensory change, vision, speech, swallowing, sphincter, gait"),
      T("review_of_systems", "Review of systems"),
    ]),
    ...sec("Neurological Status", [...gcsBlock(), T("deficit", "Documented focal deficit — distribution, power (MRC), sensory level, reflexes, coordination")]),
    ...sec("Factors That Change the Surgical Decision", [
      S("functional_status", "Functional status before this episode", [
        "Independent",
        "Needs help with some activities",
        "Needs help with most activities",
        "Bed-bound",
        NOT_DOCUMENTED,
      ]),
      S("prior_neurosurgery", "Previous neurosurgery", ["No", "Yes — cranial", "Yes — spinal", "Yes — both", NOT_DOCUMENTED]),
      S("anticoag", "Anticoagulant / antiplatelet status", [
        "None",
        "Antiplatelet only",
        "Anticoagulated — reversal started",
        "Anticoagulated — not reversed",
        "Unknown",
      ]),
      T("surgical_risk_factors", "Factors that change operative risk — cardiac, respiratory, renal, diabetes, frailty, nutrition"),
      S("seizure", "Seizure history", ["No", "Yes — current encounter", "Yes — history"]),
      T("neuroradiology_reviewed", "Neuroradiology reviewed — modality, date and the findings this decision rests on"),
    ]),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — the alternatives considered and why they were kept or excluded", R),
      T("formulation", "Clinical formulation and the surgical decision-making that follows from it"),
    ]),
    ...icdBlock("Search the condition, e.g. disc herniation, meningioma, hydrocephalus"),
    ...sec("Management & Monitoring", [
      S("management", "Management decided at this consultation", [
        "Conservative — observation",
        "Medical optimisation",
        "Operative — elective",
        "Operative — urgent",
        "Operative — emergency",
        "Second opinion / MDT discussion",
        NOT_DOCUMENTED,
      ]),
      I("procedure_planned", "Procedure planned", when("management", "Operative — elective", "Operative — urgent", "Operative — emergency")),
      S("consent_status", "Consent discussion recorded", [
        "Not yet discussed",
        "Discussed — risks, benefits and alternatives documented",
        "Declined by the patient",
        "Not applicable",
      ]),
      T("monitoring_plan", "What is monitored while the decision is pending — observations, imaging, neurology review"),
    ]),
    ...sec("Follow-Up & Safety Advice", [
      S("followup_interval", "Follow-up arranged", ["< 1 week", "1–2 weeks", "4–6 weeks", "3 months", "6 months", "As needed", NOT_DOCUMENTED]),
      S("red_flags_given", "Safety-netting advice given", ["Yes — verbal", "Yes — verbal and written", "No", NOT_DOCUMENTED]),
      T("followup_detail", "Who reviews the patient, where, and what brings them back sooner"),
    ]),
    ...guidanceBlock("nsg_consultation"),
  ],
  guidelineBasis: ["NICE NG232", "NICE NG59", "AANS/CNS", "WHO ICD-11 MMS"],
};

// ---------------------------------------------------------------------------
// 2. Spine & Nerve Compression Assessment
// ---------------------------------------------------------------------------
const SPINE = {
  key: "nsg_spine",
  label: "Spine & Nerve Compression Assessment",
  specialty: "neurosurgery",
  fields: [
    ...sec("Presenting Problem", [
      I("presenting_complaint", "Presenting complaint", R),
      T("axial_pain", "Axial pain — site, character, and relation to posture, load and rest"),
      T("radicular_symptoms", "Radicular symptoms — dermatomal distribution, laterality and any cough/sneeze provocation"),
      T("motor_symptoms", "Weakness — what the patient cannot do, and its progression"),
      T("sensory_symptoms", "Sensory change — distribution and character"),
      S("bladder_bowel", "Bladder or bowel dysfunction", ["No", "New — since this episode", "Long-standing", "Unable to assess"]),
      S("saddle", "Saddle sensory change", ["No", "Yes", "Unable to assess"]),
      S("gait", "Gait", ["Normal", "Antalgic", "Wide-based / unsteady", "Unable to walk", NOT_DOCUMENTED]),
      N("pain_score", "Pain score (0–10)", { min: 0, max: 10 }),
    ]),
    ...sec("Time-Critical Screen", [
      S("cauda_equina", "Cauda equina features — saddle anaesthesia, new retention or incontinence with bilateral radicular signs", [
        "No features",
        "Features present",
        "Unable to assess",
      ]),
      S("cord_compression", "Cord compression features — myelopathy, gait change, sphincter involvement, sensory level", [
        "No features",
        "Features present",
        "Unable to assess",
      ]),
      T("red_flag_history", "Red flags documented — trauma, cancer history, fever or infection, weight loss, night pain, steroid use, drug use"),
    ]),
    ...sec("Neurological Status", [
      T("deficit", "Documented deficit — myotomes, dermatomes, reflexes, and any upper motor neurone signs"),
      S("neuro_deterioration", "Documented progression of the deficit", ["No", "Yes", "Unable to assess"]),
    ]),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Imaging & Neurophysiology Reviewed", [
      T("neuroradiology_reviewed", "Neuroradiology reviewed — modality, date, level and the findings this decision rests on"),
      S("neurophysiology", "Neurophysiology", ["Not performed", "Nerve conduction studies — reviewed", "EMG — reviewed", "Ordered — pending"]),
    ]),
    ...icdBlock("Search the condition, e.g. lumbar disc herniation, spinal stenosis, radiculopathy"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — including non-spinal causes of the pain and the deficit", R),
      T("formulation", "Clinical formulation — what is compressed, at which level, and how that explains the findings"),
    ]),
    ...sec("Management & Monitoring", [
      S("conservative_care", "Conservative care already tried and documented", [
        "Not tried",
        "Analgesia and activity advice",
        "Structured physiotherapy",
        "Epidural or nerve-root injection",
        "Multiple measures tried without benefit",
        NOT_DOCUMENTED,
      ]),
      S("surgical_indication", "Surgical indication", [
        "No indication at present",
        "Failure of conservative care with concordant imaging",
        "Progressive motor deficit",
        "Cauda equina syndrome",
        "Cord compression with myelopathy",
        "Decision pending further imaging or review",
        NOT_DOCUMENTED,
      ]),
      I("procedure_planned", "Procedure planned", when("surgical_indication", "Failure of conservative care with concordant imaging", "Progressive motor deficit", "Cauda equina syndrome", "Cord compression with myelopathy")),
      S("rehab_plan", "Rehabilitation and return-to-work plan recorded", ["Yes", "No", NOT_DOCUMENTED]),
      T("monitoring_plan", "What is monitored while the decision is pending"),
    ]),
    ...sec("Follow-Up & Safety Advice", [
      S("followup_interval", "Follow-up arranged", ["< 1 week", "1–2 weeks", "4–6 weeks", "3 months", "As needed", NOT_DOCUMENTED]),
      S("red_flags_given", "Safety-netting advice given", ["Yes — verbal", "Yes — verbal and written", "No", NOT_DOCUMENTED]),
    ]),
    ...guidanceBlock("nsg_spine"),
  ],
  guidelineBasis: ["NICE NG59", "AANS/CNS", "WHO ICD-11 MMS"],
};

// ---------------------------------------------------------------------------
// 3. Neurotrauma Admission
// ---------------------------------------------------------------------------
const NEUROTRAUMA = {
  key: "nsg_neurotrauma",
  label: "Neurotrauma Admission",
  specialty: "neurosurgery",
  fields: [
    ...sec("Injury & Mechanism", [
      S("mechanism", "Mechanism of injury", [
        "Road traffic collision",
        "Fall from standing",
        "Fall from height",
        "Assault",
        "Sport-related",
        "Penetrating injury",
        "Other",
        NOT_DOCUMENTED,
      ]),
      I("injury_time", "Time of injury"),
      S("loc_duration", "Duration of loss of consciousness", ["None", "< 5 minutes", "5–30 minutes", "> 30 minutes", "Unknown"]),
      S("pta", "Post-traumatic amnesia", ["None", "< 1 hour", "1–24 hours", "1–7 days", "> 7 days", "Unable to assess"]),
      S("seizure", "Seizure at the scene or in hospital", ["No", "Yes — current encounter", "Yes — history"]),
      S("intoxication", "Alcohol or other intoxication documented", ["No", "Suspected", "Confirmed", "Not tested"]),
      S("anticoag", "Anticoagulant / antiplatelet status", [
        "None",
        "Antiplatelet only",
        "Anticoagulated — reversal started",
        "Anticoagulated — not reversed",
        "Unknown",
      ]),
      T("reversal_detail", "Reversal given — agent, dose, time and who advised it", when("anticoag", "Anticoagulated — reversal started", "Anticoagulated — not reversed")),
    ]),
    ...sec("Neurological Status", [
      ...gcsBlock(),
      T("deficit", "Lateralising signs, cranial nerve findings and any documented deficit"),
      S("spinal_injury", "Spinal injury", ["No", "Suspected", "Yes — level and grade documented", "Not assessed"]),
      S("asia_grade", "ASIA impairment scale grade", ["A", "B", "C", "D", "E", "Not documented"], when("spinal_injury", "Yes — level and grade documented")),
      I("spinal_level", "Documented spinal level", when("spinal_injury", "Suspected", "Yes — level and grade documented")),
    ]),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Imaging Reviewed", [
      S("cranial_ct", "Cranial CT — worst documented finding", [
        "No acute intracranial abnormality",
        "Traumatic intracranial haemorrhage",
        "Mass effect or midline shift",
        "Hydrocephalus",
        "Ischaemic change",
        "Not performed / not available",
      ]),
      N("midline_shift", "Midline shift documented (mm)", { min: 0, max: 60 }, when("cranial_ct", "Mass effect or midline shift", "Traumatic intracranial haemorrhage")),
      S("repeat_scan", "Repeat imaging decision", [
        "Not indicated — reason documented",
        "Planned — time documented",
        "Performed — reviewed",
        NOT_DOCUMENTED,
      ]),
      T("imaging_detail", "Neuroradiology detail the plan rests on — fracture, contusion, extra-axial collection, cisterns"),
    ]),
    ...icdBlock("Search the injury, e.g. subdural haematoma, traumatic subarachnoid haemorrhage"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis and the injuries identified", R),
      T("formulation", "Formulation — severity, prognosis discussed, and the neurosurgical decision taken"),
    ]),
    ...sec("Management & Monitoring", [
      S("disposition", "Disposition", ["Neurosurgical ward", "ICU / high-dependency", "Theatre", "Observation unit", "Transferred to another facility", NOT_DOCUMENTED]),
      S("icp", "Intracranial pressure monitoring", [
        "Not monitored",
        "Monitored — CPP target documented",
        "Monitored — no target documented",
      ]),
      I("icp_target", "ICP and CPP targets applied", when("icp", "Monitored — CPP target documented")),
      S("steroid", "Steroid", ["Not given", "Given — documented indication", "Given — no indication documented"]),
      S("seizure_prophylaxis", "Seizure prophylaxis", ["Not started", "Started — duration documented", "Continued from pre-injury therapy", NOT_DOCUMENTED]),
      S("vte_prophylaxis", "VTE prophylaxis", ["Not started — documented reason", "Started", "Deferred — timing documented", NOT_DOCUMENTED]),
      S("repeat_neuro_obs", "Neurological observation plan", ["Every 30 minutes", "Hourly", "Every 2 hours", "Every 4 hours", NOT_DOCUMENTED]),
      T("monitoring_plan", "What is monitored, by whom, and what triggers a repeat scan or a theatre decision"),
    ]),
    ...sec("Follow-Up & Safety Advice", [
      S("followup_interval", "Follow-up arranged", ["< 1 week", "1–2 weeks", "4–6 weeks", "3 months", NOT_DOCUMENTED]),
      S("red_flags_given", "Safety-netting advice given to the patient or family", ["Yes — verbal", "Yes — verbal and written", "No", NOT_DOCUMENTED]),
    ]),
    ...guidanceBlock("nsg_neurotrauma"),
  ],
  guidelineBasis: ["NICE NG232", "AANS/CNS", "WHO ICD-11 MMS"],
};

// ---------------------------------------------------------------------------
// 4. Cerebrovascular Emergency Note
// ---------------------------------------------------------------------------
const CEREBROVASCULAR = {
  key: "nsg_cerebrovascular",
  label: "Cerebrovascular Emergency Note",
  specialty: "neurosurgery",
  fields: [
    ...sec("Onset & Presentation", [
      I("onset_time", "Time of onset (or time last seen well)", R),
      S("onset_pattern", "Onset pattern", ["Sudden — thunderclap", "Sudden — maximal at onset", "Progressive", "Unknown"]),
      N("headache_severity", "Headache severity (0–10)", { min: 0, max: 10 }),
      T("presenting_features", "Presenting features — headache, vomiting, neck stiffness, photophobia, focal deficit, seizure, loss of consciousness"),
      S("wfns", "WFNS grade at worst documented", ["1", "2", "3", "4", "5", NOT_DOCUMENTED]),
      S("fisher", "Modified Fisher grade on CT", ["1", "2", "3", "4", NOT_DOCUMENTED]),
    ]),
    ...sec("Neurological Status", [...gcsBlock(), T("deficit", "Documented focal deficit and cranial nerve findings")]),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Vascular Imaging & Findings", [
      S("cranial_ct", "Cranial CT — worst documented finding", [
        "No acute intracranial abnormality",
        "Traumatic intracranial haemorrhage",
        "Mass effect or midline shift",
        "Hydrocephalus",
        "Ischaemic change",
        "Not performed / not available",
      ]),
      S("vascular_study", "CT angiography / digital subtraction angiography", [
        "Aneurysm identified",
        "Arteriovenous malformation identified",
        "No vascular lesion identified",
        "Not performed",
        "Pending",
      ]),
      I("lesion_location", "Lesion location and size documented", when("vascular_study", "Aneurysm identified", "Arteriovenous malformation identified")),
      T("imaging_detail", "Neuroradiology detail the plan rests on — blood distribution, hydrocephalus, infarct, lesion morphology"),
    ]),
    ...icdBlock("Search the condition, e.g. subarachnoid haemorrhage, intracerebral haemorrhage"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — including mimics that were excluded", R),
      T("formulation", "Formulation — the vascular lesion, its rupture status, and the risk of rebleeding"),
    ]),
    ...sec("Management & Monitoring", [
      S("securing_plan", "Plan for securing the lesion", [
        "Endovascular coiling",
        "Surgical clipping",
        "Conservative — no target identified",
        "Decision pending MDT or transfer",
        NOT_DOCUMENTED,
      ]),
      S("bp_target", "Blood pressure target documented", ["Yes — target and agent recorded", "No", NOT_DOCUMENTED]),
      S("nimodipine", "Nimodipine", ["Started", "Not started — reason documented", NOT_DOCUMENTED]),
      S("vasospasm_monitoring", "Vasospasm surveillance", [
        "Not applicable",
        "TCD / CTA surveillance arranged",
        "Clinical vasospasm — treatment started",
        NOT_DOCUMENTED,
      ]),
      S("hydrocephalus_management", "Hydrocephalus management", [
        "No hydrocephalus",
        "External ventricular drain",
        "Lumbar drain",
        "Shunt",
        "Observed — no drainage",
        NOT_DOCUMENTED,
      ]),
      S("anticoag", "Anticoagulant / antiplatelet status", [
        "None",
        "Antiplatelet only",
        "Anticoagulated — reversal started",
        "Anticoagulated — not reversed",
        "Unknown",
      ]),
      T("monitoring_plan", "What is monitored — neurological observations, blood pressure, sodium, repeat imaging"),
    ]),
    ...sec("Outcome & Follow-Up", [
      S("followup_interval", "Follow-up arranged", ["< 1 week", "1–2 weeks", "4–6 weeks", "3 months", "6 months", NOT_DOCUMENTED]),
      T("family_communication", "Communication with the patient and family — what was explained, by whom and when"),
    ]),
    ...guidanceBlock("nsg_cerebrovascular"),
  ],
  guidelineBasis: ["AANS/CNS", "WHO ICD-11 MMS"],
};

// ---------------------------------------------------------------------------
// 5. Hydrocephalus & CSF Diversion Note
// ---------------------------------------------------------------------------
const HYDROCEPHALUS = {
  key: "nsg_hydrocephalus",
  label: "Hydrocephalus & CSF Diversion Note",
  specialty: "neurosurgery",
  fields: [
    ...sec("Presentation", [
      I("presenting_complaint", "Presenting complaint", R),
      S("aetiology", "Documented cause", [
        "Congenital",
        "Post-haemorrhagic",
        "Post-infective",
        "Tumour-related",
        "Normal-pressure hydrocephalus",
        "Unknown / not established",
      ]),
      T("nph_features", "Gait disturbance, cognitive change and urinary symptoms — the features documented, not inferred"),
      T("symptoms", "Symptoms and their time course — headache, vomiting, drowsiness, visual change, upward gaze palsy"),
    ]),
    ...sec("Neurological Status", [...gcsBlock(), T("deficit", "Documented focal deficit and cranial nerve findings")]),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Diversion Device & Imaging", [
      S("shunt_present", "CSF diversion in place", [
        "No shunt",
        "Ventriculoperitoneal shunt",
        "Ventriculoatrial shunt",
        "Lumboperitoneal shunt",
        "Endoscopic third ventriculostomy",
        "Other",
      ]),
      I("valve_setting", "Valve type and setting documented", when("shunt_present", "Ventriculoperitoneal shunt", "Ventriculoatrial shunt", "Lumboperitoneal shunt")),
      S("shunt_status", "Device status", ["Functioning", "Suspected malfunction", "Confirmed malfunction", "Not applicable"], when("shunt_present", "Ventriculoperitoneal shunt", "Ventriculoatrial shunt", "Lumboperitoneal shunt", "Endoscopic third ventriculostomy", "Other")),
      S("shunt_series",         "Shunt series / device study", [
        "Not performed",
        "Performed — continuity documented",
        "Performed — disconnection or migration",
        "Pending",
      ], when("shunt_present", "Ventriculoperitoneal shunt", "Ventriculoatrial shunt", "Lumboperitoneal shunt", "Endoscopic third ventriculostomy", "Other")),
      T("tapping_result", "Tapping / CSF result — opening pressure, appearance, protein, glucose, cells, culture"),
      S("cranial_ct", "Cranial CT or MRI — worst documented finding", [
        "No acute intracranial abnormality",
        "Hydrocephalus",
        "Mass effect or midline shift",
        "Ischaemic change",
        "Not performed / not available",
      ]),
      T("imaging_detail", "Neuroradiology detail — ventricular size, transependymal flow, catheter position, fourth ventricle"),
    ]),
    ...icdBlock("Search the condition, e.g. hydrocephalus, shunt malfunction"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — including causes other than device failure", R),
      T("formulation", "Formulation — whether the findings are explained by the hydrocephalus or the device"),
    ]),
    ...sec("Management & Monitoring", [
      S("management", "Management decided", [
        "Observation",
        "External ventricular drain",
        "Lumbar drain",
        "Shunt revision",
        "Valve setting change",
        "Endoscopic third ventriculostomy",
        "Decision pending",
        NOT_DOCUMENTED,
      ]),
      I("revision_plan", "Surgical plan documented", when("management", "Shunt revision", "Valve setting change", "Endoscopic third ventriculostomy")),
      S("steroid", "Steroid", ["Not given", "Given — documented indication", "Given — no indication documented"]),
      T("monitoring_plan", "What is monitored — observations, drainage volume, imaging, and what triggers revision"),
    ]),
    ...sec("Follow-Up & Safety Advice", [
      S("followup_interval", "Follow-up arranged", ["< 1 week", "1–2 weeks", "4–6 weeks", "3 months", "6 months", NOT_DOCUMENTED]),
      S("red_flags_given", "Device-failure safety advice given", ["Yes — verbal", "Yes — verbal and written", "No", NOT_DOCUMENTED]),
    ]),
    ...guidanceBlock("nsg_hydrocephalus"),
  ],
  guidelineBasis: ["AANS/CNS", "WHO ICD-11 MMS"],
};

// ---------------------------------------------------------------------------
// 6. Neuro-Oncology Assessment
// ---------------------------------------------------------------------------
const NEURO_ONCOLOGY = {
  key: "nsg_neuro_oncology",
  label: "Neuro-Oncology Assessment",
  specialty: "neurosurgery",
  fields: [
    ...sec("Presentation", [
      I("presenting_complaint", "Presenting complaint", R),
      T("hpi", "History of present illness — onset, progression, headache pattern, seizure, focal change"),
      S("seizure", "Seizure", ["No", "Yes — current encounter", "Yes — history"]),
      S("steroid", "Steroid at the time of this assessment", [
        "Not given",
        "Given — documented indication",
        "Given — no indication documented",
      ]),
      T("steroid_detail", "Steroid regimen — drug, dose, duration and planned taper"),
    ]),
    ...sec("Neurological Status", [...gcsBlock(), T("deficit", "Documented focal deficit and cranial nerve findings")]),
    ...sec("Functional Status", [
      S("kps", "Performance status — Karnofsky band", [
        "90–100: normal activity",
        "70–80: restricted, independent",
        "50–60: needs assistance",
        "30–40: disabled, institutional care",
        "10–20: very disabled",
        NOT_DOCUMENTED,
      ]),
      S("functional_status", "Functional status", [
        "Independent",
        "Needs help with some activities",
        "Needs help with most activities",
        "Bed-bound",
        NOT_DOCUMENTED,
      ]),
    ]),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Imaging & Tissue Diagnosis", [
      I("lesion_location", "Lesion location and laterality as documented"),
      T("imaging_characteristics", "Imaging characteristics — size, oedema, enhancement, mass effect, midline shift, number of lesions"),
      S("histology", "Tissue diagnosis", [
        "Not yet available",
        "Histology available — grade documented below",
        "Molecular markers documented below",
        "Biopsy not planned — decision documented",
      ]),
      T("histology_detail", "Histology, grade and molecular markers as reported", when("histology", "Histology available — grade documented below", "Molecular markers documented below")),
      S("resection_extent", "Resection status", [
        "Not operated",
        "Biopsy only",
        "Partial resection",
        "Subtotal resection",
        "Gross total resection",
        NOT_DOCUMENTED,
      ]),
    ]),
    ...icdBlock("Search the condition, e.g. glioma, meningioma, cerebral metastasis"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — including non-neoplastic mimics", R),
      T("formulation", "Formulation — what is established, what is presumed, and on what basis"),
    ]),
    ...sec("Management & Monitoring", [
      S("mdt", "MDT discussion", ["Not yet discussed", "Discussed — recommendation documented", "Not applicable"]),
      S("surgical_plan", "Surgical plan", [
        "No surgery planned",
        "Biopsy",
        "Resection — elective",
        "Resection — urgent because of mass effect",
        "CSF diversion",
        "Decision pending",
        NOT_DOCUMENTED,
      ]),
      I("procedure_planned", "Procedure planned", when("surgical_plan", "Biopsy", "Resection — elective", "Resection — urgent because of mass effect", "CSF diversion")),
      S("adjuvant_plan", "Adjuvant treatment plan recorded", [
        "Not applicable",
        "Referral to oncology / radiation oncology made",
        "Awaiting histology",
        NOT_DOCUMENTED,
      ]),
      T("monitoring_plan", "What is monitored — imaging interval, steroid plan, seizure cover, clinical review"),
    ]),
    ...sec("Follow-Up & Safety Advice", [
      S("followup_interval", "Follow-up arranged", ["< 1 week", "1–2 weeks", "4–6 weeks", "3 months", "6 months", NOT_DOCUMENTED]),
      S("red_flags_given", "Safety-netting advice given", ["Yes — verbal", "Yes — verbal and written", "No", NOT_DOCUMENTED]),
    ]),
    ...guidanceBlock("nsg_neuro_oncology"),
  ],
  guidelineBasis: ["AANS/CNS", "WHO ICD-11 MMS"],
};

// ---------------------------------------------------------------------------
// 7. Cranial Operative Note
// ---------------------------------------------------------------------------
const CRANIAL_OPERATIVE = {
  key: "nsg_cranial_operative",
  label: "Cranial Operative Note",
  specialty: "neurosurgery",
  fields: [
    ...sec("Procedure & Indication", [
      I("procedure", "Procedure performed", R),
      T("indication", "Indication and the diagnosis the operation treats", R),
      S("side", "Side", SIDE),
      S("urgency", "Urgency", ["Elective", "Semi-elective", "Urgent", "Emergency"]),
      S("consent_status", "Consent and site marking confirmed", [
        "Confirmed — documented",
        "Not documented",
        "Not applicable — emergency",
      ]),
    ]),
    ...sec("Anaesthesia & Positioning", [
      S("anaesthesia", "Anaesthesia", ["General", "Awake craniotomy", "Sedation", "Local"]),
      I("positioning", "Position and head fixation"),
      S("neuronavigation", "Neuronavigation", ["Used", "Not used", "Not available"]),
      S("neuromonitoring", "Intra-operative neurophysiological monitoring", [
        "Not used",
        "Motor mapping",
        "Somatosensory evoked potentials",
        "Cortical mapping — language",
        "Combined monitoring",
        "Not documented",
      ]),
      S("antibiotic_prophylaxis", "Antibiotic prophylaxis", ["Given — agent and time documented", "Not given — reason documented", NOT_DOCUMENTED]),
    ]),
    ...sec("Operative Steps", [
      S("craniotomy", "Approach / bone work", ["Craniotomy", "Craniectomy", "Burr hole", "Keyhole", "Transsphenoidal", "Other"]),
      S("dural_opening", "Dural handling", ["Opened and repaired at closure", "Opened — dural substitute used", "Not opened", "Repaired primarily"]),
      T("operative_findings", "Operative findings — pathology, anatomy, vessels, nerves, unexpected findings"),
      S("resection_extent", "Extent of resection achieved", [
        "Not applicable",
        "Biopsy only",
        "Partial",
        "Subtotal",
        "Gross total",
        NOT_DOCUMENTED,
      ]),
      S("haemostasis", "Haemostasis", ["Achieved — documented", "Achieved after additional measures", "Concern at closure"]),
      S("closure", "Closure", ["Bone flap replaced and fixed", "Craniectomy — bone stored", "Dura closed watertight", "Dura closed with graft"]),
    ]),
    ...sec("Drains, Counts & Specimens", [
      S("drain", "Drain left in place", ["None", "Subdural drain", "Wound drain", "External ventricular drain", "Lumbar drain"]),
      S("vte_prophylaxis", "VTE prophylaxis decision for after theatre", [
        "Mechanical only — pharmacological timing documented",
        "Pharmacological started",
        "Deferred — timing documented",
        NOT_DOCUMENTED,
      ]),
      N("blood_loss", "Estimated blood loss (mL)", { min: 0, max: 20000 }),
      S("implants", "Implants used", ["None", "Yes — recorded in the implant record", "Yes — not documented"]),
      S("specimens", "Specimens sent", ["None", "Histology", "Microbiology", "Histology and microbiology", NOT_DOCUMENTED]),
      S("postop_destination", "Post-operative destination", ["Neurosurgical ward", "ICU / high-dependency", "Recovery — routine observation", NOT_DOCUMENTED]),
      S("postop_scan", "Post-operative imaging decision", [
        "Not indicated — reason documented",
        "Planned within 24 hours",
        "Performed — reviewed",
        NOT_DOCUMENTED,
      ]),
    ]),
    ...icdBlock("Search the condition the operation treated"),
    ...guidanceBlock("nsg_cranial_operative"),
  ],
  guidelineBasis: ["AANS/CNS", "WHO ICD-11 MMS"],
};

// ---------------------------------------------------------------------------
// 8. Spinal Operative Note
// ---------------------------------------------------------------------------
const SPINAL_OPERATIVE = {
  key: "nsg_spinal_operative",
  label: "Spinal Operative Note",
  specialty: "neurosurgery",
  fields: [
    ...sec("Procedure & Indication", [
      I("procedure", "Procedure performed", R),
      T("indication", "Indication and the diagnosis the operation treats", R),
      I("levels", "Levels operated"),
      S("side", "Side of the decompression or approach", SIDE),
      S("urgency", "Urgency", ["Elective", "Semi-elective", "Urgent", "Emergency"]),
      S("consent_status", "Consent and site marking confirmed", ["Confirmed — documented", "Not documented"]),
    ]),
    ...sec("Anaesthesia & Positioning", [
      S("anaesthesia", "Anaesthesia", ["General", "Spinal", "Sedation"]),
      I("positioning", "Position — prone, lateral or supine, with any frames used"),
      S("neuromonitoring", "Intra-operative neurophysiological monitoring", [
        "Not used",
        "Motor evoked potentials",
        "Somatosensory evoked potentials",
        "Combined monitoring",
        "Not documented",
      ]),
      S("antibiotic_prophylaxis", "Antibiotic prophylaxis", ["Given — agent and time documented", "Not given — reason documented", NOT_DOCUMENTED]),
    ]),
    ...sec("Operative Steps", [
      S("approach", "Approach", ["Posterior", "Anterior", "Lateral", "Posterolateral", "Minimally invasive tubular", "Other"]),
      S("decompression", "Decompression performed", ["Laminectomy", "Laminotomy", "Discectomy", "Foraminotomy", "Cortical bone removal", "Not performed"]),
      S("instrumentation", "Instrumentation", ["None", "Pedicle screws and rods", "Interbody cage", "Lateral mass screws", "Anterior plate", "Other"]),
      S("graft", "Graft / fusion material", ["None", "Autograft", "Allograft", "Synthetic cage", "Bone substitute", NOT_DOCUMENTED]),
      T("operative_findings", "Operative findings — compression, disc, ligament, deformity, CSF and nerve-root observations"),
      S("dural_tear", "Dural tear", ["None", "Repaired primarily", "Repaired with patch", "Persisting CSF leak", NOT_DOCUMENTED]),
      S("closure", "Closure", ["Layered closure — documented", "Closure with drain", "Closure with graft"]),
    ]),
    ...sec("Drains, Counts & Post-Operative Status", [
      S("drain", "Drain left in place", ["None", "Wound drain", "Subfascial drain", "Lumbar drain"]),
      N("blood_loss", "Estimated blood loss (mL)", { min: 0, max: 20000 }),
      S("implants", "Implants used", ["None", "Yes — recorded in the implant record", "Yes — not documented"]),
      S("postop_neuro", "Neurological status at the end of the procedure", [
        "Unchanged",
        "Improved",
        "New deficit — documented",
        "Unable to assess",
      ]),
      S("vte_prophylaxis", "VTE prophylaxis decision for after theatre", [
        "Mechanical only — pharmacological timing documented",
        "Pharmacological started",
        "Deferred — timing documented",
        NOT_DOCUMENTED,
      ]),
      S("postop_scan", "Post-operative imaging decision", [
        "Not indicated — reason documented",
        "Planned within 24 hours",
        "Performed — reviewed",
        NOT_DOCUMENTED,
      ]),
      S("postop_destination", "Post-operative destination", ["Neurosurgical ward", "ICU / high-dependency", "Recovery — routine observation", NOT_DOCUMENTED]),
    ]),
    ...icdBlock("Search the condition the operation treated, with its level"),
    ...guidanceBlock("nsg_spinal_operative"),
  ],
  guidelineBasis: ["AANS/CNS", "WHO ICD-11 MMS"],
};

// ---------------------------------------------------------------------------
// 9. Post-Operative Neurosurgical Progress
// ---------------------------------------------------------------------------
const POSTOP_PROGRESS = {
  key: "nsg_postop_progress",
  label: "Post-Operative Neurosurgical Progress",
  specialty: "neurosurgery",
  fields: [
    ...sec("Interval", [
      N("postop_day", "Post-operative day", { min: 0, max: 120 }),
      T("interval_events", "What happened since the last entry — symptoms, events, results reviewed"),
    ]),
    ...sec("Neurological Status", [...gcsBlock(), T("deficit", "Focal deficit and cranial nerve findings today")]),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Wound, Drains & Observations", [
      S("wound_csf", "Wound and surgical site", [
        "Dry and intact",
        "CSF leak",
        "Haematoma / swelling",
        "Infection suspected",
        NOT_DOCUMENTED,
      ]),
      I("drain_output", "Drain or EVD output and settings"),
      S("seizure", "Seizure", ["No", "Yes — current encounter", "Yes — history"]),
      N("pain_score", "Pain score (0–10)", { min: 0, max: 10 }),
      S("mobility", "Mobility", ["Independent", "With assistance", "Bed-bound", NOT_DOCUMENTED]),
      S("vte_prophylaxis", "VTE prophylaxis", ["Not started — documented reason", "Started", "Deferred — timing documented", NOT_DOCUMENTED]),
    ]),
    ...sec("Course & Complication", [
      S("complication", "Complication documented", [
        "None documented",
        "Haemorrhage",
        "Infection",
        "CSF leak",
        "Seizure",
        "Hydrocephalus",
        "New neurological deficit",
        "Systemic complication",
        NOT_DOCUMENTED,
      ]),
      S("postop_scan",         "Scans since the operation", [
        "Not indicated — reason documented",
        "Performed — reviewed",
        "Ordered — pending",
        NOT_DOCUMENTED,
      ]),
      T("imaging_detail", "Scan findings and what they change"),
    ]),
    ...sec("Assessment & Next Steps", [
      T("differential", "Assessment — how the findings are explained, and the alternative explanations considered", R),
      T("next_actions", "Next 24-hour actions — observations, reviews and decisions to be made"),
      S("disposition", "Disposition", ["Continue inpatient care", "Step down to ward", "ICU escalation", "Fit for discharge planning", NOT_DOCUMENTED]),
    ]),
    ...icdBlock("Add a diagnosis only if a complication or new problem is documented"),
    ...guidanceBlock("nsg_postop_progress"),
  ],
  guidelineBasis: ["AANS/CNS", "WHO ICD-11 MMS"],
};

// ---------------------------------------------------------------------------
// 10. Neurosurgical Discharge Summary
// ---------------------------------------------------------------------------
const DISCHARGE = {
  key: "nsg_discharge",
  label: "Neurosurgical Discharge Summary",
  specialty: "neurosurgery",
  fields: [
    ...sec("Admission & Procedures", [
      T("admission_reason", "Reason for admission and the diagnosis established", R),
      T("procedures", "Procedures performed — date, procedure and surgeon"),
      T("hospital_course", "Hospital course — complications, decisions taken and the response to treatment"),
    ]),
    ...sec("Status at Discharge", [...gcsBlock(), T("deficit", "Residual deficit and functional status at discharge")]),
    ...sec("Wound & Follow-Up Care", [
      S("wound_status", "Wound status at discharge", ["Healed / dry", "Clean — sutures or staples in place", "CSF leak", "Infection — under treatment", NOT_DOCUMENTED]),
      S("shunt_status", "Device status at discharge", ["No device", "Functioning — setting recorded", "Malfunction — plan documented", NOT_DOCUMENTED]),
      T("medication_changes", "Medication changes made during this admission — started, stopped, dose changed, with the reason"),
      I("followup_appointment", "Follow-up appointment — with whom, where and when"),
      S("postop_scan",         "Scans arranged after discharge", [
        "Not arranged — reason documented",
        "Arranged — date documented",
        "Already performed — reviewed",
        NOT_DOCUMENTED,
      ]),
      S("rehab_plan", "Rehabilitation and therapy arranged", ["Not required", "Physiotherapy", "Neuro-rehabilitation", "Occupational therapy", NOT_DOCUMENTED]),
    ]),
    ...sec("Safety Advice Given", [
      S("red_flags_given", "Written safety advice given", ["Yes — verbal only", "Yes — verbal and written", "No"]),
      T("red_flag_detail", "The red flags the patient was told to return for — headache, drowsiness, weakness, wound leak, fever"),
      S("driving_advice", "Driving advice given", ["Advised not to drive — documented", "Advised on the legal restriction after seizure or craniotomy", "Not applicable", NOT_DOCUMENTED]),
      S("shunt_precautions", "Shunt or device precautions given", ["Yes", "Not applicable", NOT_DOCUMENTED], when("shunt_status", "Functioning — setting recorded", "Malfunction — plan documented")),
    ]),
    ...icdBlock("Carry the diagnoses established during this admission, with their status at discharge"),
    ...guidanceBlock("nsg_discharge"),
  ],
  guidelineBasis: ["NICE NG232", "AANS/CNS", "WHO ICD-11 MMS"],
};

// `guidelineBasis` is derived from the attribution registry rather than typed
// per template, so a note can never cite a document that is not defined — and
// every note carries the edition/date of the sources it actually follows.
export const NEUROSURGERY_DOCS = [
  CONSULTATION,
  SPINE,
  NEUROTRAUMA,
  CEREBROVASCULAR,
  HYDROCEPHALUS,
  NEURO_ONCOLOGY,
  CRANIAL_OPERATIVE,
  SPINAL_OPERATIVE,
  POSTOP_PROGRESS,
  DISCHARGE,
].map((doc) => ({ ...doc, guidelineBasis: guidelineBasisLabels(doc.key) }));

export const NEUROSURGERY_NOTE_KEYS = NEUROSURGERY_DOCS.map((d) => d.key);