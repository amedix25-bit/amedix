// Neurology — governing clinical references and the audit register.
//
// PRIMARY AUTHORITIES: the American Academy of Neurology (AAN), the International
// League Against Epilepsy (ILAE) and the American Heart Association / American
// Stroke Association (AHA/ASA) cerebrovascular guidelines, with the named
// international sources below where those bodies do not publish the pattern
// (multiple sclerosis diagnostic criteria, headache classification, Guillain-Barré
// management).
//
// WHAT IS RECORDED, AND WHAT IS NOT
//   · Only the document's identity (body, title, edition), the population it
//     covers and the link to the publisher's own page. Guideline text is
//     copyright protected and is NOT reproduced in this app.
//   · The requirements the notes ask for are AMedix's own wording of what the
//     cited document requires to be documented. They are not quotations, and no
//     threshold is attributed to a body that does not publish it.
//   · `revision_verified` states whether the edition below was confirmed as the
//     current one on the publisher's page at review time. Where it was not, the
//     guidance panel tells the reviewing clinician to confirm the revision before
//     the note is relied on as the department standard. Nothing is presented as a
//     current recommendation when its revision could not be confirmed.
//   · Where no cited body publishes a rule for a clinical question (local
//     escalation routes, monitoring intervals set by the institution), the
//     register says so and the note records it as a local decision.

export const NEURO_LAST_REVIEWED = "2026-10-30";

export const NEURO_REFERENCES = {
  // ---- AAN ------------------------------------------------------------------
  aan_ms: {
    organization: "AAN",
    title: "Practice Guideline: Multiple Sclerosis in Adults (summary of recommendations)",
    edition: "2018 guideline, published in Neurology",
    revision_verified: false,
    population: "Adults with multiple sclerosis",
    applies: "the diagnostic and treatment review a multiple sclerosis note records: disease course, relapse and disability assessment, treatment review and rehabilitation",
    type: "AAN practice guideline",
    url: "https://www.aan.com/Guidelines",
  },
  aan_polyneuropathy: {
    organization: "AAN (with AANEM)",
    title: "Comprehensive Guidelines for the Evaluation of Distal Symmetric Polyneuropathy",
    edition: "2020 guideline, published in Neurology",
    revision_verified: false,
    population: "Adults with distal symmetric polyneuropathy",
    applies: "the structured neuromuscular evaluation: distribution, examination findings, study selection and the documented aetiological search",
    type: "AAN practice guideline",
    url: "https://www.aan.com/Guidelines",
  },
  aan_bells: {
    organization: "AAN",
    title: "Clinical Practice Guideline: Bell's Palsy",
    edition: "2013 guideline, published in Neurology",
    revision_verified: false,
    population: "Adults with Bell's palsy",
    applies: "the facial-nerve record: onset, degree of weakness, eye protection, treatment window and follow-up",
    type: "AAN practice guideline",
    url: "https://www.aan.com/Guidelines",
  },
  aan_brain_death: {
    organization: "AAN",
    title: "Evidence-Based Guideline Update: Determining Brain Death in Adults",
    edition: "2010 update, published in Neurology",
    revision_verified: false,
    population: "Adults in whom brain death is being considered",
    applies: "the prerequisites, examination and apnoea documentation recorded when brain death is assessed",
    type: "AAN practice guideline",
    url: "https://www.aan.com/Guidelines",
  },

  // ---- ILAE -----------------------------------------------------------------
  ilae_seizure_2017: {
    organization: "ILAE",
    title: "Instruction Manual for the ILAE 2017 Operational Classification of Seizure Types",
    edition: "Epilepsia 2017 — operational classification",
    revision_verified: true,
    population: "People with epileptic seizures",
    applies: "the classification of every seizure recorded in the note: onset (focal / generalised / unknown), awareness, motor and non-motor features, and focal to bilateral tonic-clonic evolution",
    type: "ILAE classification",
    url: "https://www.ilae.org/guidelines/definition-and-classification",
  },
  ilae_epilepsy_2017: {
    organization: "ILAE",
    title: "ILAE Classification of the Epilepsies: Position Paper of the ILAE Commission for Classification and Terminology",
    edition: "Epilepsia 2017",
    revision_verified: true,
    population: "People with epilepsy",
    applies: "the epilepsy type, the electroclinical syndrome where one is established, and the aetiology groups (structural, genetic, infectious, metabolic, immune, unknown)",
    type: "ILAE classification",
    url: "https://www.ilae.org/guidelines/definition-and-classification",
  },
  ilae_definition_2014: {
    organization: "ILAE",
    title: "A Practical Clinical Definition of Epilepsy",
    edition: "Epilepsia 2014",
    revision_verified: true,
    population: "People with, or suspected of, epilepsy",
    applies: "whether the recorded events meet the definition of epilepsy, and therefore whether a diagnosis is documented as confirmed rather than as a first seizure",
    type: "ILAE definition",
    url: "https://www.ilae.org/guidelines/definition-and-classification",
  },
  ilae_status_2015: {
    organization: "ILAE",
    title: "A Definition and Classification of Status Epilepticus",
    edition: "Epilepsia 2015",
    revision_verified: true,
    population: "People in or near status epilepticus",
    applies: "the time point at which an ongoing seizure is treated as status epilepticus, the classification of the episode, and the refractory stage",
    type: "ILAE definition",
    url: "https://www.ilae.org/guidelines/definition-and-classification",
  },
  ilae_drug_resistant: {
    organization: "ILAE",
    title: "Definition of Drug Resistant Epilepsy",
    edition: "Epilepsia 2010 — ILAE Commission consensus",
    revision_verified: true,
    population: "People with epilepsy on antiseizure medication",
    applies: "whether the recorded treatment history meets the definition of drug-resistant epilepsy, which is a treatment fact and not a diagnosis",
    type: "ILAE definition",
    url: "https://www.ilae.org/guidelines/definition-and-classification",
  },
  ncs_status: {
    organization: "Neurocritical Care Society",
    title: "Guideline for the Evaluation and Management of Status Epilepticus",
    edition: "Neurocritical Care 2016",
    revision_verified: false,
    population: "Adults in status epilepticus",
    applies: "the staged treatment record a status epilepticus note keeps: first-line agent and time, second-line agent and time, airway and cause search, and the refractory stage",
    type: "Society guideline",
    url: "https://www.neurocriticalcare.org/",
  },

  // ---- AHA / ASA ------------------------------------------------------------
  aha_ais_2019: {
    organization: "AHA/ASA",
    title: "Guidelines for the Early Management of Patients With Acute Ischemic Stroke",
    edition: "Stroke 2019 — update to the 2018 guidelines",
    revision_verified: false,
    population: "Adults with acute ischaemic stroke",
    applies: "the hyperacute record: time last known well, imaging before reperfusion therapy, reperfusion decisions and their contraindication review, blood pressure and glucose before therapy, and the swallow screen",
    type: "AHA/ASA guideline",
    url: "https://www.ahajournals.org/journal/str",
  },
  aha_ich_2022: {
    organization: "AHA/ASA",
    title: "Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage",
    edition: "Stroke 2022",
    revision_verified: false,
    population: "Adults with spontaneous intracerebral haemorrhage",
    applies: "the haemorrhage record: anticoagulation status and reversal, blood-pressure management, neurosurgical assessment and the severity score documented beside the diagnosis",
    type: "AHA/ASA guideline",
    url: "https://www.ahajournals.org/journal/str",
  },
  aha_sah_2023: {
    organization: "AHA/ASA",
    title: "Guideline for the Management of Patients With Aneurysmal Subarachnoid Hemorrhage",
    edition: "Stroke 2023",
    revision_verified: false,
    population: "Adults with aneurysmal subarachnoid haemorrhage",
    applies: "the subarachnoid haemorrhage record: clinical grade, aneurysm securing plan, vasospasm and hydrocephalus monitoring, and nimodipine",
    type: "AHA/ASA guideline",
    url: "https://www.ahajournals.org/journal/str",
  },
  aha_secondary_prevention_2021: {
    organization: "AHA/ASA",
    title: "Guideline for the Prevention of Stroke in Patients With Stroke and Transient Ischemic Attack",
    edition: "Stroke 2021",
    revision_verified: false,
    population: "Adults after ischaemic stroke or transient ischaemic attack",
    applies: "the secondary-prevention record: antithrombotic choice, atrial fibrillation anticoagulation, lipid and blood-pressure targets, and the cause-specific plan",
    type: "AHA/ASA guideline",
    url: "https://www.ahajournals.org/journal/str",
  },
  aha_primary_prevention_2021: {
    organization: "AHA/ASA",
    title: "Guideline for the Primary Prevention of Stroke",
    edition: "Stroke 2021",
    revision_verified: false,
    population: "Adults without prior stroke",
    applies: "the risk-factor documentation a primary-prevention record carries: blood pressure, diabetes, lipids, smoking, activity and atrial fibrillation",
    type: "AHA/ASA guideline",
    url: "https://www.ahajournals.org/journal/str",
  },

  // ---- Named international sources -----------------------------------------
  mcdonald_2017: {
    organization: "International Panel on MS Diagnosis (McDonald criteria)",
    title: "Diagnosis of Multiple Sclerosis: 2017 Revisions of the McDonald Criteria",
    edition: "2017 revision, Lancet Neurology 2018",
    revision_verified: true,
    population: "Adults with a clinically isolated syndrome or suspected multiple sclerosis",
    applies: "the dissemination-in-space and dissemination-in-time record, the attack record, and the statement of what remains unproven when the criteria are not met",
    type: "Diagnostic criteria",
    url: "https://doi.org/10.1016/S1474-4422(17)30470-2",
  },
  ichd3: {
    organization: "International Headache Society",
    title: "International Classification of Headache Disorders, 3rd edition (ICHD-3)",
    edition: "Cephalalgia 2018 — 3rd edition",
    revision_verified: true,
    population: "People with headache",
    applies: "the diagnostic criteria a headache record documents: attack frequency and duration, characteristics, associated symptoms, aura and medication-overuse days",
    type: "Classification",
    url: "https://ichd-3.org/",
  },
  snnoop10: {
    organization: "Do et al.",
    title: "Red and Orange Flags for Secondary Headaches in Clinical Practice: SNNOOP10 List",
    edition: "Neurology 2019",
    revision_verified: true,
    population: "Adults presenting with headache",
    applies: "the secondary-headache red-flag screen recorded in every headache note — the flags are documented whether present or absent",
    type: "Clinical review",
    url: "https://doi.org/10.1212/WNL.0000000000006970",
  },
  ean_gbs: {
    organization: "EAN/PNS",
    title: "European Academy of Neurology / Peripheral Nerve Society Guideline on the Diagnosis and Treatment of Guillain-Barré Syndrome",
    edition: "European Journal of Neurology 2023",
    revision_verified: true,
    population: "People with Guillain-Barré syndrome",
    applies: "the Guillain-Barré record: progression, respiratory monitoring, disability grade, treatment course and the warning signs that move care to a critical-care setting",
    type: "Society guideline",
    url: "https://www.ean.org/",
  },
  local: {
    organization: "AMedix local decision",
    title: "Institution-level neurology documentation and escalation policy",
    edition: "Set by the department — not a guideline claim",
    revision_verified: false,
    population: "This institution",
    applies: "monitoring intervals, escalation routes and call criteria that vary between institutions; recorded as a local decision, never presented as a guideline recommendation",
    type: "Local policy",
    url: "",
  },
};

const ref = (key) => ({ key, ...NEURO_REFERENCES[key] });

// The basis each note type records about itself, so an exported record keeps the
// evidence base it was written from.
export const NEURO_NOTE_BASIS = {
  neuro_consultation: {
    note: "Neurology Consultation",
    states:
      "The note records the neurological history and examination in the elements the cited documents require to be documented, classifies any seizure with the ILAE operational classification and the epilepsies with the ILAE position paper, classifies headache against ICHD-3 with the SNNOOP10 secondary-headache flags documented, and records every diagnosis in WHO ICD-11 MMS with its diagnostic status.",
    basis: ["ilae_seizure_2017", "ilae_epilepsy_2017", "ichd3", "snnoop10", "aan_polyneuropathy"],
  },
  neuro_followup: {
    note: "Neurology Follow-Up",
    states:
      "The note records the interval history, the current examination, the review of results already in the record, the treatment response and the reason for any change. Where the disease is multiple sclerosis or epilepsy it carries the course, attack or seizure-frequency record the cited classifications require.",
    basis: ["ilae_epilepsy_2017", "ilae_drug_resistant", "aan_ms", "ichd3"],
  },
  neuro_admission_note: {
    note: "Neurology Admission Note",
    states:
      "The note records why the patient was admitted, the baseline neurological state including the pre-morbid functional level, the acute findings that changed management, and the diagnoses with their ICD-11 MMS coding. A stroke or status epilepticus admission carries the corresponding hyperacute or staged pathway record.",
    basis: ["aha_ais_2019", "ilae_status_2015", "ncs_status", "local"],
  },
  neuro_progress_note: {
    note: "Neurology Progress Note",
    states:
      "The note records the overnight events, the current neurological state against the previous documented state, and the trend rather than a repeated summary. Monitoring intervals and call criteria are recorded as the institution's local decision.",
    basis: ["local", "aha_ais_2019", "ilae_status_2015"],
  },
  neuro_discharge_summary: {
    note: "Neurology Discharge Summary",
    states:
      "The note records the diagnoses in WHO ICD-11 MMS, the hospital course, the neurological state and functional level at discharge against the pre-morbid level, the treatment changed during the admission, the follow-up interval and the safety advice (driving, seizure precautions, swallowing and anticoagulation where relevant).",
    basis: ["aha_secondary_prevention_2021", "ilae_epilepsy_2017", "local"],
  },
  neuro_procedure_note: {
    note: "Neurologic Procedure Note",
    states:
      "The note records the indication, consent, technique, findings, specimens and complications, and the post-procedure observations the institution requires. A lumbar puncture records the opening pressure and the cerebrospinal fluid findings as measured, never as inferred.",
    basis: ["local"],
  },
  neuro_eeg_report: {
    note: "EEG Report",
    states:
      "The report records the recording state and duration, the montage and electrode set, the background, the activation procedures, the discharges with their location and frequency, and the clinical correlation. Seizure classification follows the ILAE operational classification; the report states what the recording cannot answer.",
    basis: ["ilae_seizure_2017", "ilae_epilepsy_2017"],
  },
  neuro_emg_ncs_report: {
    note: "EMG / NCS Report",
    states:
      "The report records the nerves and muscles studied, limb temperature, the reference values used, the measured values, the needle findings and the resulting pattern (axonal, demyelinating, mixed or normal), which is an interpretation and not a diagnosis. The aetiological evaluation follows the AAN/AANEM polyneuropathy guideline.",
    basis: ["aan_polyneuropathy"],
  },
  neuro_stroke_record: {
    note: "Stroke Assessment / Record",
    states:
      "The record carries the time last known well, the severity score, the imaging before reperfusion therapy, the reperfusion decisions with their contraindication review, blood pressure and glucose before therapy, the swallow screen, and the cause-specific secondary-prevention plan. Intracerebral and subarachnoid haemorrhage records carry their own guideline's elements.",
    basis: ["aha_ais_2019", "aha_ich_2022", "aha_sah_2023", "aha_secondary_prevention_2021"],
  },
  neuro_seizure_followup: {
    note: "Seizure / Epilepsy Follow-Up",
    states:
      "The note records the seizure classification, the epilepsy type and aetiology, the seizure frequency against the previous review, the treatment history including what failed and why, the adverse effects being monitored, the safety advice and — where it applies — whether the treatment history meets the definition of drug-resistant epilepsy.",
    basis: ["ilae_seizure_2017", "ilae_epilepsy_2017", "ilae_drug_resistant"],
  },
  neuro_referral: {
    note: "Neurology Referral",
    states:
      "The referral records the question being asked, the urgency, the documented findings the receiving clinician needs, the diagnoses with their ICD-11 MMS coding, and what has already been done so the referral adds information rather than repeating it.",
    basis: ["local"],
  },
};

export const neuroNoteBasis = (noteKey) => {
  const entry = NEURO_NOTE_BASIS[noteKey];
  if (!entry) return null;
  return { ...entry, basis: entry.basis.map(ref) };
};

export const neuroGuidelineBasis = (noteKey) => {
  const entry = neuroNoteBasis(noteKey);
  if (!entry) return [];
  return entry.basis;
};

export const NEURO_REFERENCE_REGISTER = Object.values(NEURO_REFERENCES);