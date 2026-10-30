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

import { guidelineBasisLabels } from "./neurosurgeryReferences.js";

// The field builders and the shared blocks live in their own module, so a new
// note type can be added without this catalogue growing for every note.
import {
  I,
  N,
  NOT_DOCUMENTED,
  PUPILS,
  R,
  S,
  SIDE,
  T,
  emergencyBlock,
  examBlock,
  examField,
  gcsBlock,
  guidanceBlock,
  icdBlock,
  isncsciBlock,
  operativeBlock,
  postopBlock,
  scoreBlock,
  sec,
  vitalsBlock,
  when,
} from "./neurosurgeryNoteBlocks.js";
import { EMERGENCY_CRANIAL, EMERGENCY_SPINE } from "./neurosurgeryEmergencyNotes.js";

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
    ...examField(),
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
    ...scoreBlock(),
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
    ...examField(),
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
    ...scoreBlock(),
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
    ...examField(),
    ...isncsciBlock({ key: "spinal_injury", in: ["Suspected", "Yes — level and grade documented"] }),
    ...vitalsBlock(),
    ...examBlock(),
    ...emergencyBlock(),
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
    ...examField(),
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
    ...scoreBlock(),
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
    ...examField(),
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
    ...examField(),
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
    ...scoreBlock(),
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
    ...operativeBlock(),
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
    ...operativeBlock(),
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
    ...examField(),
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
    ...postopBlock("monitoring"),
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
    ...examField(),
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

// ---------------------------------------------------------------------------
// 11. Aneurysm & AVM Assessment (unruptured and elective vascular work)
// ---------------------------------------------------------------------------
const ANEURYSM_AVM = {
  key: "nsg_aneurysm_avm",
  label: "Aneurysm & AVM Assessment",
  specialty: "neurosurgery",
  fields: [
    ...sec("Presentation & Vascular History", [
      I("presenting_complaint", "Presenting complaint — and the question this assessment answers", R),
      T("hpi", "History of present illness — headache pattern, sentinel bleed, seizure, focal symptoms, cranial nerve palsy, tempo", R),
      S("rupture_status", "Rupture status at this assessment", [
        "Unruptured — incidental finding",
        "Unruptured — symptomatic (mass effect or cranial nerve palsy)",
        "Ruptured — current admission",
        "Rupture status not established",
      ]),
      I("onset_time", "Time of onset when ruptured, or time last seen well", when("rupture_status", "Ruptured — current admission")),
      S("family_history", "Family history of intracranial aneurysm or subarachnoid haemorrhage", [
        "None documented",
        "First-degree relative affected",
        "Multiple relatives affected",
        "Unknown",
      ]),
      S("risk_factors", "Associated conditions and risk factors documented", [
        "None documented",
        "Hypertension",
        "Current smoking",
        "Autosomal dominant polycystic kidney disease",
        "Connective tissue disorder",
        "Multiple of the above",
        "Unknown",
      ]),
      S("previous_treatment", "Previous treatment of this or another lesion", [
        "No previous treatment",
        "Coiling",
        "Clipping",
        "Flow diversion",
        "Embolisation",
        "Radiosurgery",
        NOT_DOCUMENTED,
      ]),
      T("symptom_detail", "Symptoms and their time course — thunderclap headache, neck stiffness, photophobia, seizure, visual change, cranial nerve palsy"),
    ]),
    ...sec("Neurological Status", [
      ...gcsBlock(),
      S("wfns", "WFNS grade at worst documented", ["1", "2", "3", "4", "5", NOT_DOCUMENTED]),
      S("fisher", "Modified Fisher grade on CT", ["1", "2", "3", "4", NOT_DOCUMENTED]),
      T("deficit", "Documented focal deficit and cranial nerve findings"),
    ]),
    ...examField(),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Vascular Imaging & Lesion Detail", [
      S("vascular_study", "Vascular imaging performed", [
        "CT angiography — lesion identified",
        "MR angiography — lesion identified",
        "Digital subtraction angiography — lesion identified",
        "No lesion identified",
        "Not performed",
        "Pending",
      ]),
      S(
        "lesion_type",
        "Lesion documented",
        [
          "Saccular aneurysm",
          "Fusiform aneurysm",
          "Arteriovenous malformation",
          "Dural arteriovenous fistula",
          "Cavernous malformation",
          "Other vascular lesion",
          NOT_DOCUMENTED,
        ]
      ),
      I("lesion_location", "Location and laterality as documented"),
      N("lesion_size_mm", "Maximum lesion size documented (mm)", { min: 0, max: 100 }),
      S("multiplicity", "Multiplicity", ["Single lesion", "Multiple lesions", NOT_DOCUMENTED]),
      T("avm_features", "AVM features as documented — nidus size, feeding arteries, venous drainage, associated aneurysms", when("lesion_type", "Arteriovenous malformation")),
      T("imaging_detail", "Neuroradiology detail the plan rests on — blood distribution, hydrocephalus, infarct, mass effect, calcification"),
    ]),
    ...scoreBlock(),
    ...icdBlock("Search the lesion, e.g. cerebral aneurysm, arteriovenous malformation"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — including mimics considered and excluded", R),
      T("formulation", "Formulation — rupture status, the natural history discussed, and the treatment decision with its reasoning"),
    ]),
    ...sec("Management & Monitoring", [
      S("treatment_plan", "Plan for the lesion", [
        "Observation — risks discussed and documented",
        "Endovascular coiling",
        "Surgical clipping",
        "Flow diversion",
        "AVM resection",
        "Embolisation then resection",
        "Radiosurgery referral",
        "Decision pending MDT or transfer",
        NOT_DOCUMENTED,
      ]),
      I("procedure_planned", "Procedure planned", when("treatment_plan", "Endovascular coiling", "Surgical clipping", "Flow diversion", "AVM resection", "Embolisation then resection", "Radiosurgery referral")),
      S("consent_status", "Consent discussion recorded", [
        "Not yet discussed",
        "Discussed — risks, benefits and alternatives documented",
        "Declined by the patient",
        "Not applicable",
      ]),
      S("bp_target", "Blood pressure target documented", ["Yes — target and agent recorded", "No", NOT_DOCUMENTED], when("rupture_status", "Ruptured — current admission")),
      S("nimodipine", "Nimodipine", ["Started", "Not started — reason documented", "Not applicable", NOT_DOCUMENTED]),
      S("vasospasm_monitoring", "Vasospasm surveillance", ["Not applicable", "TCD / CTA surveillance arranged", "Clinical vasospasm — treatment started", NOT_DOCUMENTED], when("rupture_status", "Ruptured — current admission")),
      S("seizure_prophylaxis", "Seizure prophylaxis", ["Not started", "Started — duration documented", "Continued from pre-existing therapy", NOT_DOCUMENTED]),
      S("hydrocephalus_management", "Hydrocephalus management", ["No hydrocephalus", "External ventricular drain", "Lumbar drain", "Shunt", "Observed — no drainage", NOT_DOCUMENTED]),
      T("monitoring_plan", "What is monitored — observations, blood pressure, sodium, repeat imaging"),
    ]),
    ...sec("Follow-Up & Safety Advice", [
      S("followup_interval", "Follow-up arranged", ["< 1 week", "1–2 weeks", "4–6 weeks", "3 months", "6 months", NOT_DOCUMENTED]),
      S("imaging_surveillance", "Imaging surveillance arranged", ["Not applicable", "Arranged — modality and interval documented", NOT_DOCUMENTED]),
      S("red_flags_given", "Safety-netting advice given", ["Yes — verbal", "Yes — verbal and written", "No", NOT_DOCUMENTED]),
      T("family_communication", "Communication with the patient and family — what was explained, by whom and when"),
    ]),
    ...guidanceBlock("nsg_aneurysm_avm"),
  ],
  guidelineBasis: [],
};

// ---------------------------------------------------------------------------
// 12. Spinal Cord Injury & Cord Compression (ISNCSCI)
// ---------------------------------------------------------------------------
const SPINAL_CORD = {
  key: "nsg_spinal_cord",
  label: "Spinal Cord Injury & Cord Compression (ISNCSCI)",
  specialty: "neurosurgery",
  fields: [
    ...sec("Onset & Mechanism", [
      I("presenting_complaint", "Presenting complaint — and the question this assessment answers", R),
      S("cord_cause", "Cause of the cord injury or compression", [
        "Traumatic",
        "Tumour",
        "Degenerative",
        "Infection or abscess",
        "Haematoma",
        "Vascular",
        "Other",
        "Not established",
      ]),
      S("mechanism", "Mechanism when traumatic", [
        "Road traffic collision",
        "Fall from height",
        "Fall from standing",
        "Assault",
        "Sport-related",
        "Penetrating injury",
        "Other",
        NOT_DOCUMENTED,
      ], when("cord_cause", "Traumatic")),
      I("onset_time", "Time of onset or injury"),
      S("onset_pattern", "Onset", ["Sudden", "Progressive over hours", "Progressive over days", "Progressive over weeks", "Unknown"]),
      T("presenting_features", "Presenting features — weakness, sensory change, sphincter dysfunction, pain, respiratory compromise"),
      S("respiratory", "Respiratory status", ["No compromise", "Compromise — documented below", "Ventilated", "Unable to assess"]),
      S("bladder_bowel", "Bladder or bowel dysfunction", ["No", "New — since this episode", "Long-standing", "Unable to assess"]),
    ]),
    ...sec("Spinal Precautions & Transfer", [
      S("spinal_precautions", "Spinal precautions", ["Maintained — documented", "Cleared — criteria documented", "Not applicable"]),
      S("transfer_status", "Transfer status", ["Not transferred", "Accepted for transfer", "Transferred in", NOT_DOCUMENTED]),
      I("time_to_imaging", "Time imaging was performed"),
    ]),
    ...sec("Neurological Status", [...gcsBlock(), T("deficit", "Documented deficit — myotomes, dermatomes, reflexes, upper and lower motor neurone signs")]),
    ...examField(),
    ...isncsciBlock(),
    ...sec("Cord Syndrome & Physiology", [
      S("cord_syndrome", "Pattern documented", [
        "Complete cord injury",
        "Anterior cord syndrome",
        "Central cord syndrome",
        "Brown-Séquard syndrome",
        "Posterior cord syndrome",
        "Conus medullaris syndrome",
        "Cauda equina syndrome",
        "Not classifiable — documented as such",
      ]),
      S("neurogenic_shock", "Neurogenic shock", ["No", "Suspected", "Confirmed", "Unable to assess"]),
      S("spinal_shock", "Spinal shock (flaccid areflexia below the lesion)", ["Not present", "Present — documented", "Unable to assess"]),
      T("level_detail", "The level and its basis — sensory level, motor level, and what is spared below it"),
    ]),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Imaging & Injury Classification", [
      S("imaging", "Imaging reviewed", ["CT", "MRI", "CT and MRI", "Not performed / not available"]),
      S("cord_signal", "Cord signal change on MRI", [
        "No cord signal change",
        "Cord oedema",
        "Cord contusion or haemorrhage",
        "Cord compression without signal change",
        "Not documented",
      ]),
      S("canal_compromise", "Canal compromise documented", ["None", "Mild", "Moderate", "Severe", "Not documented"]),
      S("ao_spine_type", "AO Spine injury type as documented (traumatic injuries)", [
        "A — compression injury",
        "B — distraction injury",
        "C — translation injury",
        "Not applicable",
        "Not documented",
      ]),
      T("imaging_detail", "Neuroradiology detail the plan rests on — fracture, dislocation, disc, haematoma, ligamentous injury"),
      T("other_injuries", "Associated injuries documented"),
    ]),
    ...scoreBlock(),
    ...icdBlock("Search the injury or cause, e.g. spinal cord injury, cord compression"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — including non-compressive causes of the deficit", R),
      T("formulation", "Formulation — level, completeness, the mechanism or cause, and what explains the deficit"),
    ]),
    ...sec("Management & Monitoring", [
      S("decompression_plan", "Decompression decision", [
        "No surgical indication documented",
        "Decompression planned — urgent",
        "Decompression planned — elective",
        "Decision pending imaging or transfer",
        NOT_DOCUMENTED,
      ]),
      I("procedure_planned", "Procedure planned", when("decompression_plan", "Decompression planned — urgent", "Decompression planned — elective")),
      S("map_target", "Mean arterial pressure target documented", ["Yes — target recorded", "No", NOT_DOCUMENTED]),
      S("steroid_decision", "Steroid decision", [
        "Not given — reason documented",
        "Given — per local protocol with the regimen recorded",
        "Not applicable",
      ]),
      T("steroid_regimen", "Steroid regimen and who advised it", when("steroid_decision", "Given — per local protocol with the regimen recorded")),
      S("bladder_management", "Bladder management", ["Indwelling catheter", "Intermittent catheterisation", "Spontaneous voiding", "Not documented"]),
      S("vte_prophylaxis", "VTE prophylaxis", ["Not started — documented reason", "Mechanical only", "Pharmacological started", "Deferred — timing documented", NOT_DOCUMENTED]),
      S("pressure_care", "Pressure area and positioning plan documented", ["Yes", "No", NOT_DOCUMENTED]),
      T("monitoring_plan", "What is monitored — observations, respiratory function, neurology, bladder, skin"),
    ]),
    ...sec("Follow-Up & Rehabilitation", [
      S("rehab", "Rehabilitation arranged", ["Not required", "Spinal injuries unit referral", "Inpatient neuro-rehabilitation", "Outpatient physiotherapy", NOT_DOCUMENTED]),
      S("followup_interval", "Follow-up arranged", ["< 1 week", "1–2 weeks", "4–6 weeks", "3 months", NOT_DOCUMENTED]),
      S("red_flags_given", "Safety-netting advice given to the patient or family", ["Yes — verbal", "Yes — verbal and written", "No", NOT_DOCUMENTED]),
    ]),
    ...guidanceBlock("nsg_spinal_cord"),
  ],
  guidelineBasis: [],
};

// ---------------------------------------------------------------------------
// 13. Spinal Tumour Assessment
// ---------------------------------------------------------------------------
const SPINAL_TUMOUR = {
  key: "nsg_spinal_tumour",
  label: "Spinal Tumour Assessment",
  specialty: "neurosurgery",
  fields: [
    ...sec("Presentation & Oncology History", [
      I("presenting_complaint", "Presenting complaint — and the question this assessment answers", R),
      T("hpi", "History of present illness — pain character (mechanical or night/rest pain), progression, weakness, sphincter change", R),
      S("pain_pattern", "Pain pattern documented", ["Mechanical — worse on movement or load", "Night or rest pain", "Both", "No pain documented"]),
      S("known_primary", "Known primary cancer", ["No known primary", "Known primary — site documented below", "Primary not established"]),
      I("primary_site", "Primary site and histology when known", when("known_primary", "Known primary — site documented below")),
      S("steroid", "Steroid at the time of this assessment", ["Not given", "Given — documented indication", "Given — no indication documented"]),
      T("steroid_detail", "Steroid regimen — drug, dose, duration and planned taper"),
      S("functional_status", "Functional status before this episode", ["Independent", "Needs help with some activities", "Needs help with most activities", "Bed-bound", NOT_DOCUMENTED]),
      T("oncological_status", "Systemic disease status as documented by the oncology team"),
    ]),
    ...sec("Neurological Status", [...gcsBlock(), T("deficit", "Documented deficit — level, myotomes, dermatomes, reflexes")]),
    ...examField(),
    ...isncsciBlock({ key: "cord_signs", in: ["Present — documented below"] }),
    ...sec("Cord Involvement", [
      S("cord_signs", "Cord involvement on examination", ["No cord signs documented", "Present — documented below", "Unable to assess"]),
      T("cord_detail", "Cord findings — level, myelopathy, sphincter involvement, progression", when("cord_signs", "Present — documented below")),
    ]),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Imaging & Tissue Diagnosis", [
      S("imaging", "Imaging reviewed", ["MRI whole spine", "MRI segment only", "CT", "CT and MRI", "Not performed / not available"]),
      I("level", "Level(s) involved"),
      S("compartment", "Compartment documented", ["Extradural", "Intradural extramedullary", "Intramedullary", "Vertebral body only", "Not established"]),
      S("lesion_count", "Number of lesions documented", ["Single", "Multiple", "Not documented"]),
      T("imaging_detail", "Imaging characteristics — cord compression, signal change, bone involvement, pathological fracture, deformity"),
      S("histology", "Tissue diagnosis", [
        "Not yet available",
        "Histology available — documented below",
        "Biopsy not planned — decision documented",
      ]),
      T("histology_detail", "Histology and grade as reported", when("histology", "Histology available — documented below")),
    ]),
    ...scoreBlock(),
    ...icdBlock("Search the tumour, e.g. spinal metastasis, intradural tumour"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — including infection, degenerative and inflammatory mimics", R),
      T("formulation", "Formulation — what is established, what is presumed, and how the deficit is explained"),
    ]),
    ...sec("Management & Monitoring", [
      S("mdt", "MDT discussion", ["Not yet discussed", "Discussed — recommendation documented", "Not applicable"]),
      S("surgical_plan", "Surgical plan", [
        "No surgery planned",
        "Biopsy",
        "Decompression",
        "Decompression and stabilisation",
        "En bloc resection",
        "Decision pending",
        NOT_DOCUMENTED,
      ]),
      I("procedure_planned", "Procedure planned", when("surgical_plan", "Biopsy", "Decompression", "Decompression and stabilisation", "En bloc resection")),
      S("adjuvant_plan", "Adjuvant treatment plan recorded", ["Not applicable", "Oncology referral made", "Radiotherapy referral made", "Awaiting histology", NOT_DOCUMENTED]),
      S("prognosis_discussed", "Prognosis discussion documented", ["Yes — with the patient", "Yes — with the family", "Not yet", NOT_DOCUMENTED]),
      T("monitoring_plan", "What is monitored — neurology, steroid plan, imaging interval, oncological review"),
    ]),
    ...sec("Follow-Up & Safety Advice", [
      S("followup_interval", "Follow-up arranged", ["< 1 week", "1–2 weeks", "4–6 weeks", "3 months", NOT_DOCUMENTED]),
      S("red_flags_given", "Safety-netting advice given", ["Yes — verbal", "Yes — verbal and written", "No", NOT_DOCUMENTED]),
    ]),
    ...guidanceBlock("nsg_spinal_tumour"),
  ],
  guidelineBasis: [],
};

// ---------------------------------------------------------------------------
// 14. Functional, Epilepsy & Stereotactic Note
// ---------------------------------------------------------------------------
const FUNCTIONAL = {
  key: "nsg_functional",
  label: "Functional, Epilepsy & Stereotactic Note",
  specialty: "neurosurgery",
  fields: [
    ...sec("Referral & Condition", [
      I("referral_question", "Clinical question this assessment answers", R),
      S("condition", "Condition under assessment", [
        "Parkinson disease",
        "Essential tremor",
        "Dystonia",
        "Drug-resistant epilepsy",
        "Trigeminal neuralgia",
        "Chronic neuropathic pain",
        "Spasticity",
        "Other movement disorder",
        NOT_DOCUMENTED,
      ]),
      T("hpi", "History of present illness — onset, course, treatment trials, functional impact", R),
      S("medication_trials", "Medical treatment already tried documented", ["Yes — documented below", "No", NOT_DOCUMENTED]),
      T("medication_detail", "Drugs, doses, durations and response", when("medication_trials", "Yes — documented below")),
    ]),
    ...sec("Seizure Assessment", [
      S("seizure_type", "Seizure type documented", ["Focal aware", "Focal impaired awareness", "Focal to bilateral tonic-clonic", "Generalised tonic-clonic", "Absence", "Multiple types", "Not documented"], when("condition", "Drug-resistant epilepsy")),
      I("seizure_frequency", "Seizure frequency (as documented)", when("condition", "Drug-resistant epilepsy")),
      T("semiology", "Semiology as documented by the patient or witnesses — aura, automatisms, lateralising signs, duration, recovery", when("condition", "Drug-resistant epilepsy")),
      S("seizure_injury", "Injury or status epilepticus documented", ["No", "Yes", "Not documented"], when("condition", "Drug-resistant epilepsy")),
      T("aed_regimen", "Anti-seizure medications — drugs, doses, adherence and side effects", when("condition", "Drug-resistant epilepsy")),
    ]),
    ...sec("Neurological & Cognitive Status", [
      T("deficit", "Documented neurological findings — tremor, rigidity, bradykinesia, dystonia, gait, cranial nerves"),
      S("cognition", "Cognitive assessment documented", ["No concern documented", "Concern documented — neuropsychology referred", "Neuropsychology completed", "Not documented"]),
      S("mood", "Mood or psychiatric history documented", ["No concern documented", "Concern documented", "Not documented"]),
    ]),
    ...examField(),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Workup & Targeting", [
      T("imaging_detail", "MRI findings relevant to targeting — atrophy, vascular burden, lesion, hippocampal changes"),
      S("eeg", "Electroencephalography", ["Not performed", "Routine EEG — reviewed", "Video-EEG telemetry — reviewed", "Pending"]),
      S("stereotactic_planning", "Stereotactic planning documented", ["Not yet planned", "Planned — targeting and trajectory documented", "Frame-based", "Frameless"]),
      I("target", "Target or planned resection documented"),
      S("neuropsychology", "Neuropsychological assessment", ["Not required", "Referred", "Completed — reviewed", NOT_DOCUMENTED]),
    ]),
    ...scoreBlock(),
    ...icdBlock("Search the condition, e.g. Parkinson disease, drug-resistant epilepsy"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — including non-surgical mimics and psychiatric contributors", R),
      T("formulation", "Formulation — whether the patient meets the criteria for the proposed procedure, and why"),
    ]),
    ...sec("Management & Monitoring", [
      S("management", "Management decided", [
        "Continue medical management",
        "Refer for MDT or case discussion",
        "Deep brain stimulation — implantation",
        "Lesioning procedure",
        "Resective epilepsy surgery",
        "Vagus nerve stimulation",
        "Pain procedure",
        "Decision pending",
        NOT_DOCUMENTED,
      ]),
      I("procedure_planned", "Procedure planned", when("management", "Deep brain stimulation — implantation", "Lesioning procedure", "Resective epilepsy surgery", "Vagus nerve stimulation", "Pain procedure")),
      S("consent_status", "Consent and expectations discussion documented", [
        "Not yet discussed",
        "Discussed — benefits, risks, alternatives and programming burden documented",
        "Declined by the patient",
        "Not applicable",
      ]),
      T("programming_plan", "Programming / follow-up plan for the device or procedure"),
      T("monitoring_plan", "What is monitored — seizure diary, medication changes, device checks, mood and cognition"),
    ]),
    ...sec("Follow-Up & Safety Advice", [
      S("followup_interval", "Follow-up arranged", ["< 1 week", "1–2 weeks", "4–6 weeks", "3 months", "6 months", NOT_DOCUMENTED]),
      S("driving_advice", "Driving advice given", ["Advised on the legal restriction — documented", "Not applicable", NOT_DOCUMENTED]),
      S("red_flags_given", "Safety-netting advice given", ["Yes — verbal", "Yes — verbal and written", "No", NOT_DOCUMENTED]),
    ]),
    ...guidanceBlock("nsg_functional"),
  ],
  guidelineBasis: [],
};

// ---------------------------------------------------------------------------
// 15. Peripheral Nerve & Plexus Assessment
// ---------------------------------------------------------------------------
const PERIPHERAL_NERVE = {
  key: "nsg_peripheral_nerve",
  label: "Peripheral Nerve & Plexus Assessment",
  specialty: "neurosurgery",
  fields: [
    ...sec("Presentation & Mechanism", [
      I("presenting_complaint", "Presenting complaint — and the question this assessment answers", R),
      S("mechanism", "Mechanism", ["Compression", "Laceration", "Traction or stretch", "Injection injury", "Fracture-related", "Tumour", "Iatrogenic", "Unknown"]),
      I("onset_time", "Time of onset or injury"),
      T("distribution", "Distribution of symptoms — which nerve or plexus territory, and its boundaries"),
      S("laterality", "Side", SIDE),
      T("weakness_detail", "Weakness — what the patient cannot do, and its progression"),
      T("sensory_detail", "Sensory change — distribution and character"),
      N("pain_score", "Pain score (0–10)", { min: 0, max: 10 }),
      S("tinel", "Tinel sign", ["Absent", "Present at the documented point", "Not examined"]),
    ]),
    ...sec("Neurological Status", [
      I("nerve_involved", "Nerve or plexus involved as documented"),
      T("deficit", "Documented deficit — power by muscle, sensory loss, reflexes"),
      S("facial_nerve", "Facial nerve function (when the facial nerve is involved)", ["Not involved", "Involved — graded below", "Not examined"]),
    ]),
    ...examField(),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Neurophysiology & Imaging", [
      S("neurophysiology", "Neurophysiology", ["Not performed", "Nerve conduction studies — reviewed", "EMG — reviewed", "Both reviewed", "Ordered — pending"]),
      T("neurophysiology_detail", "Neurophysiology findings as reported — axonal or demyelinating, severity, denervation"),
      S("imaging", "Imaging reviewed", ["Not performed", "Ultrasound — reviewed", "MRI plexus — reviewed", "MRI and ultrasound — reviewed"]),
      T("imaging_detail", "Imaging findings — neuroma, entrapment point, mass, continuity"),
    ]),
    ...scoreBlock(),
    ...icdBlock("Search the condition, e.g. carpal tunnel syndrome, ulnar neuropathy, brachial plexus injury"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — including radiculopathy, plexopathy and systemic causes", R),
      T("formulation", "Formulation — the level of the lesion, its severity and whether it is likely to recover"),
    ]),
    ...sec("Management & Monitoring", [
      S("management", "Management decided", [
        "Conservative — observation and therapy",
        "Nerve conduction studies first",
        "Decompression — planned",
        "Repair — planned",
        "Graft or transfer — planned",
        "Tumour or neuroma excision",
        "Decision pending",
        NOT_DOCUMENTED,
      ]),
      I("procedure_planned", "Procedure planned", when("management", "Decompression — planned", "Repair — planned", "Graft or transfer — planned", "Tumour or neuroma excision")),
      S("therapy", "Therapy and splinting arranged", ["Yes", "No", NOT_DOCUMENTED]),
      T("monitoring_plan", "What is monitored — serial power testing, sensory recovery, Tinel progression, therapy review"),
    ]),
    ...sec("Follow-Up & Safety Advice", [
      S("followup_interval", "Follow-up arranged", ["1–2 weeks", "4–6 weeks", "3 months", "6 months", NOT_DOCUMENTED]),
      S("red_flags_given", "Safety-netting advice given", ["Yes — verbal", "Yes — verbal and written", "No", NOT_DOCUMENTED]),
    ]),
    ...guidanceBlock("nsg_peripheral_nerve"),
  ],
  guidelineBasis: [],
};

// ---------------------------------------------------------------------------
// 16. Paediatric Neurosurgery Note (congenital and developmental)
// ---------------------------------------------------------------------------
const PAEDIATRIC = {
  key: "nsg_paediatric",
  label: "Paediatric Neurosurgery Note",
  specialty: "neurosurgery",
  fields: [
    ...sec("Presentation & Developmental History", [
      I("presenting_complaint", "Presenting complaint — and the question this assessment answers", R),
      S("age_group", "Age group", ["Neonate (0–28 days)", "Infant (1–12 months)", "Child (1–5 years)", "Child (6–12 years)", "Adolescent (13–18 years)"]),
      T("birth_history", "Birth history — gestation, delivery, birth weight, neonatal course, prior surgery"),
      T("developmental_history", "Developmental history — milestones achieved, regression, school function"),
      S("congenital_condition", "Congenital or developmental condition documented", [
        "Myelomeningocele",
        "Tethered cord",
        "Chiari malformation",
        "Craniosynostosis",
        "Encephalocele",
        "Arachnoid cyst",
        "Congenital hydrocephalus",
        "Other congenital condition",
        "None documented",
      ]),
      T("symptoms", "Symptoms and their time course — vomiting, irritability, regression, seizure, head shape, back lesion, gait"),
      S("feeding", "Feeding and growth documented", ["Normal for age", "Concern documented", "Not documented"]),
    ]),
    ...sec("Neurological Status", [
      T("deficit", "Neurological findings — tone, power, cranial nerves, reflexes; note that infant scales differ from adult scales"),
      S("fontanelle", "Fontanelle", ["Soft and flat", "Bulging", "Sunken", "Closed", "Not applicable"]),
      S("head_circumference", "Head circumference", ["Within expected range for age", "Above expected range", "Below expected range", "Not documented"]),
      S("consciousness_child", "Conscious level as documented for age", ["Alert and interactive", "Irritable but consolable", "Lethargic", "Unresponsive", "Sedated", "Not documented"]),
    ]),
    ...examField(),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Imaging & Findings", [
      S("imaging", "Imaging reviewed", ["Cranial ultrasound", "CT", "MRI", "CT and MRI", "Not performed / not available"]),
      T("imaging_detail", "Imaging findings — ventricular size, extra-axial fluid, hindbrain position, cord tethering, suture fusion"),
      S("hydrocephalus", "Hydrocephalus documented", ["No", "Yes — new", "Yes — known and stable", "Yes — with device malfunction"]),
    ]),
    ...icdBlock("Search the condition, e.g. congenital hydrocephalus, myelomeningocele, craniosynostosis"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — including non-surgical causes of the presentation", R),
      T("formulation", "Formulation — what is established, the timing of intervention, and the developmental considerations"),
    ]),
    ...sec("Management & Monitoring", [
      S("management", "Management decided", [
        "Observation and developmental follow-up",
        "Further imaging",
        "CSF diversion",
        "Shunt revision",
        "Cranial remodelling",
        "Tethered cord release",
        "Myelomeningocele closure",
        "Chiari decompression",
        "Referral to another centre",
        "Decision pending",
        NOT_DOCUMENTED,
      ]),
      I("procedure_planned", "Procedure planned", when("management", "CSF diversion", "Shunt revision", "Cranial remodelling", "Tethered cord release", "Myelomeningocele closure", "Chiari decompression")),
      S("anaesthetic_review", "Anaesthetic and airway review documented", ["Yes", "Referral made", "Not yet", "Not applicable"]),
      S("safeguarding", "Safeguarding or social concerns documented", ["None documented", "Concern documented — referred", "Not documented"]),
      T("monitoring_plan", "What is monitored — head circumference, fontanelle, development, shunt function, wound"),
    ]),
    ...sec("Follow-Up & Family Communication", [
      S("followup_interval", "Follow-up arranged", ["1–2 weeks", "4–6 weeks", "3 months", "6 months", "12 months", NOT_DOCUMENTED]),
      T("family_communication", "What was explained to the family, by whom and when"),
      S("red_flags_given", "Safety-netting advice given to the family", ["Yes — verbal", "Yes — verbal and written", "No", NOT_DOCUMENTED]),
    ]),
    ...guidanceBlock("nsg_paediatric"),
  ],
  guidelineBasis: [],
};

// ---------------------------------------------------------------------------
// 17. Raised ICP & Cerebral Oedema Note
// ---------------------------------------------------------------------------
const RAISED_ICP = {
  key: "nsg_icp",
  label: "Raised ICP & Cerebral Oedema Note",
  specialty: "neurosurgery",
  fields: [
    ...sec("Presentation & Cause", [
      I("presenting_complaint", "Presenting complaint — and the question this assessment answers", R),
      S("cause", "Cause of the raised pressure or oedema", [
        "Tumour with oedema",
        "Intracranial haemorrhage",
        "Traumatic brain injury",
        "Large territory infarct with oedema",
        "CNS infection",
        "Hepatic or metabolic encephalopathy",
        "Idiopathic intracranial hypertension",
        "Post-operative swelling",
        "Other",
        "Not established",
      ]),
      I("onset_time", "Time of onset"),
      T("symptoms", "Symptoms — headache, vomiting, visual obscurations, drowsiness, seizure, focal change"),
      S("seizure", "Seizure", ["No", "Yes — current encounter", "Yes — history"]),
      S("anticoag", "Anticoagulant / antiplatelet status", [
        "None",
        "Antiplatelet only",
        "Anticoagulated — reversal started",
        "Anticoagulated — not reversed",
        "Unknown",
      ]),
      T("oncological_or_medical", "Relevant background — oncological treatment, steroid use, anticoagulation, comorbidity"),
    ]),
    ...sec("Neurological Status", [
      ...gcsBlock(),
      S("conscious_trend", "Conscious level trend since the previous observation", ["Improved", "Unchanged", "Deteriorating", "Not documented"]),
      T("deficit", "Documented focal deficit and cranial nerve findings"),
      S("herniation_signs", "Signs documented", [
        "None documented",
        "Uncal herniation signs",
        "Central transtentorial signs",
        "Tonsillar herniation signs",
        "Unable to assess",
      ]),
    ]),
    ...examField(),
    ...vitalsBlock(),
    ...examBlock(),
    ...sec("Monitoring & Imaging", [
      S("icp_monitor", "Intracranial pressure monitoring", ["Not monitored", "External ventricular drain", "Intraparenchymal monitor", "Monitored — modality not documented"]),
      N("icp_value", "Latest ICP documented (mmHg)", { min: 0, max: 120 }),
      N("cpp_value", "Latest cerebral perfusion pressure (mmHg)", { min: 0, max: 200 }),
      N("midline_shift", "Midline shift documented (mm)", { min: 0, max: 60 }),
      S("imaging", "Imaging reviewed", ["CT", "MRI", "CT and MRI", "Not performed / not available"]),
      T("imaging_detail", "Imaging findings — oedema, effacement, cisterns, herniation, ventricular size, territory involved"),
      S("tier", "Therapy tier documented", ["Tier 0 — general measures", "Tier 1 — osmotic therapy", "Tier 2 — sedation and controlled ventilation", "Tier 3 — decompressive surgery", "Not documented"]),
    ]),
    ...scoreBlock(),
    ...icdBlock("Search the cause, e.g. cerebral oedema, intracranial hypertension"),
    ...sec("Assessment & Differential Diagnosis", [
      T("differential", "Differential diagnosis — including causes of a depressed conscious level other than raised pressure", R),
      T("formulation", "Formulation — the cause, the trend, and what the documented values are explained by"),
    ]),
    ...sec("Management & Monitoring", [
      S("osmotherapy", "Osmotic therapy", ["Not given", "Mannitol given — regimen documented", "Hypertonic saline given — regimen documented", "Given — regimen not documented"]),
      S("sedation", "Sedation and ventilation", ["Not required", "Sedated — target documented", "Sedated and paralysed", "Not documented"]),
      S("steroid", "Steroid", ["Not given", "Given — documented indication", "Given — no indication documented"]),
      S("surgical", "Surgical decompression", ["Not indicated", "Decompressive craniectomy performed", "Decompressive craniectomy planned", "Tumour resection planned", "Decision pending"]),
      I("sodium_target", "Sodium and osmolality targets documented"),
      S("nursing", "Nursing position and precautions documented", ["Head up 30 degrees — documented", "Not documented"]),
      T("monitoring_plan", "What is monitored, by whom, and what triggers escalation or imaging"),
    ]),
    ...sec("Communication & Follow-Up", [
      T("family_communication", "Communication with the patient and family — what was explained, by whom and when"),
      S("followup_interval", "Review arranged", ["Continuing critical care review", "< 1 week", "1–2 weeks", "4–6 weeks", NOT_DOCUMENTED]),
    ]),
    ...guidanceBlock("nsg_icp"),
  ],
  guidelineBasis: [],
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
  ANEURYSM_AVM,
  SPINAL_CORD,
  SPINAL_TUMOUR,
  FUNCTIONAL,
  PERIPHERAL_NERVE,
  PAEDIATRIC,
  RAISED_ICP,
  EMERGENCY_CRANIAL,
  EMERGENCY_SPINE,
].map((doc) => ({ ...doc, guidelineBasis: guidelineBasisLabels(doc.key) }));

export const NEUROSURGERY_NOTE_KEYS = NEUROSURGERY_DOCS.map((d) => d.key);