// Neurology — presentation-specific blocks.
//
// Each block is the record a named guideline requires that presentation to carry.
// The fields ask for what was documented; they never compute a diagnosis, and a
// threshold is only stated where the cited document publishes it.

const YES_NO_NOT = ["Yes", "No", "Not documented"];

export const STROKE_BLOCK = {
  key: "neuro_stroke",
  title: "Stroke — Hyperacute Record",
  note: "The time last known well, the scan before reperfusion therapy, the contraindication review, blood pressure and glucose before therapy, and the swallow screen are recorded because each one decides whether reperfusion can proceed. The cause classification (TOAST) and the clinical syndrome (OCSP) are recorded as the clinician's assessment.",
  fields: [
    { key: "str_last_known_well", label: "Time last known well", type: "input", placeholder: "Date and time the patient was last seen at baseline" },
    {
      key: "str_onset_pattern",
      label: "Onset pattern",
      type: "select",
      options: ["Witnessed onset", "Unwitnessed onset", "Wake-up stroke", "Not documented"],
    },
    { key: "str_premorbid_mrs", label: "Pre-morbid modified Rankin grade", type: "select", options: ["0", "1", "2", "3", "4", "5", "Not documented"] },
    {
      key: "str_symptoms",
      label: "Symptoms at onset",
      type: "multi",
      options: [
        "Hemiparesis", "Facial weakness", "Aphasia", "Dysarthria", "Neglect", "Visual loss",
        "Diplopia", "Vertigo", "Ataxia", "Reduced consciousness", "Seizure at onset", "Headache", "Vomiting",
      ],
    },
    { key: "str_glucose", label: "Blood glucose before therapy", type: "input", placeholder: "mmol/L" },
    { key: "str_bp_before_therapy", label: "Blood pressure before reperfusion therapy", type: "input", placeholder: "mmHg" },
    {
      key: "str_anticoagulant",
      label: "Anticoagulant status",
      type: "select",
      options: ["None", "Warfarin", "Direct oral anticoagulant", "Antiplatelet only", "Not documented"],
    },
    {
      key: "str_anticoagulant_last_dose",
      label: "Last anticoagulant dose and time",
      type: "input",
      showIf: { key: "str_anticoagulant", in: ["Warfarin", "Direct oral anticoagulant"] },
    },
    {
      key: "str_coagulation_status",
      label: "Coagulation status documented",
      type: "select",
      options: ["Within the documented limits for therapy", "Abnormal — documented", "Not available", "Not performed"],
    },
    { key: "str_recent_surgery", label: "Surgery or trauma in the preceding period", type: "select", options: YES_NO_NOT },
    { key: "str_prior_ich", label: "Previous intracranial haemorrhage", type: "select", options: YES_NO_NOT },
    { key: "str_first_scan_time", label: "First scan performed (date and time)", type: "input" },
    {
      key: "str_first_scan_finding",
      label: "First scan finding",
      type: "select",
      options: [
        "No acute intracranial haemorrhage", "Intracerebral haemorrhage", "Subarachnoid haemorrhage",
        "Early ischaemic change", "Established infarct", "Normal", "Not performed", "Not documented",
      ],
    },
    {
      key: "str_vessel_assessment",
      label: "Vessel assessment",
      type: "select",
      options: [
        "Large vessel occlusion confirmed", "Large vessel occlusion suspected — not confirmed",
        "No large vessel occlusion", "Not performed", "Not documented",
      ],
    },
    {
      key: "str_reperfusion_decision",
      label: "Reperfusion decision",
      type: "select",
      options: [
        "Intravenous thrombolysis given", "Mechanical thrombectomy performed", "Thrombolysis and thrombectomy",
        "Considered and not given — reason documented", "Not applicable", "Not documented",
      ],
    },
    {
      key: "str_contraindication_review",
      label: "Contraindication review documented",
      type: "select",
      options: ["No contraindication identified", "Contraindication documented", "Not reviewed"],
    },
    { key: "str_time_metrics", label: "Door, needle and groin times", type: "input", placeholder: "Times as recorded" },
    {
      key: "str_swallow_screen",
      label: "Swallow screen before oral intake",
      type: "select",
      options: ["Passed", "Failed — nothing by mouth", "Not performed"],
    },
    {
      key: "str_toast",
      label: "Ischaemic stroke cause (TOAST)",
      type: "select",
      options: [
        "Large artery atherosclerosis", "Cardioembolic", "Small vessel occlusion", "Other determined cause",
        "Undetermined — two or more causes", "Undetermined — no cause found", "Not determined",
      ],
    },
    {
      key: "str_ocsp",
      label: "Clinical syndrome (OCSP)",
      type: "select",
      options: ["Total anterior circulation", "Partial anterior circulation", "Lacunar", "Posterior circulation", "Not classified"],
    },
    {
      key: "str_atrial_fibrillation",
      label: "Atrial fibrillation",
      type: "select",
      options: ["Not present", "Known before this event", "Newly detected this admission", "Not assessed"],
    },
  ],
};

export const SEIZURE_BLOCK = {
  key: "neuro_seizure",
  title: "Seizure & Epilepsy Classification (ILAE 2017)",
  note: "Classification follows the ILAE operational classification: onset first (focal, generalised or unknown), then awareness and motor/non-motor features for a focal onset, then the epilepsy type and aetiology. The record states which events are known and which are only reported.",
  fields: [
    {
      key: "szr_onset",
      label: "Seizure onset",
      type: "select",
      options: ["Focal", "Generalised", "Unknown onset", "Not classified"],
    },
    {
      key: "szr_awareness",
      label: "Awareness during the event",
      type: "select",
      options: ["Aware", "Impaired awareness", "Not applicable", "Not documented"],
      showIf: { key: "szr_onset", equals: "Focal" },
    },
    {
      key: "szr_features",
      label: "Documented features",
      type: "multi",
      options: [
        "Automotor", "Tonic", "Clonic", "Myoclonic", "Atonic", "Epileptic spasm",
        "Sensory", "Autonomic", "Emotional", "Cognitive", "Behavioural arrest",
      ],
    },
    {
      key: "szr_focal_to_bilateral",
      label: "Focal to bilateral tonic-clonic evolution",
      type: "select",
      options: YES_NO_NOT,
      showIf: { key: "szr_onset", equals: "Focal" },
    },
    { key: "szr_events_documented", label: "Which events are documented by a witness", type: "input", placeholder: "e.g. two events witnessed, one only reported by the family" },
    {
      key: "szr_epilepsy_type",
      label: "Epilepsy type",
      type: "select",
      options: ["Focal", "Generalised", "Combined focal and generalised", "Unknown", "Not established — single event"],
    },
    { key: "szr_syndrome", label: "Electroclinical syndrome, where one is established", type: "input" },
    {
      key: "szr_etiology",
      label: "Aetiology group",
      type: "multi",
      options: ["Structural", "Genetic", "Infectious", "Metabolic", "Immune", "Unknown"],
    },
    { key: "szr_etiology_detail", label: "Aetiology documented", type: "input", placeholder: "The lesion, gene, infection or metabolic cause recorded" },
    {
      key: "szr_eeg_support",
      label: "EEG contribution",
      type: "select",
      options: ["Supportive of the classification", "Non-diagnostic", "Contradictory", "Not performed", "Report awaited"],
    },
    { key: "szr_first_event_date", label: "Date of the first event", type: "input" },
    {
      key: "szr_definition_met",
      label: "Does the history meet the ILAE definition of epilepsy",
      type: "select",
      options: [
        "Yes — two unprovoked events more than 24 hours apart",
        "Yes — one unprovoked event with a documented recurrence risk of at least 60%",
        "No — single event",
        "Not assessable from this record",
      ],
    },
    { key: "szr_previous_medicines", label: "Previous antiseizure medicines and reason stopped", type: "textarea" },
    { key: "szr_safety_advice", label: "Safety advice given", type: "multi", options: ["Driving", "Water and bathing", "Heights and machinery", "Alcohol and sleep", "Pregnancy", "None documented"] },
  ],
};

export const STATUS_EPILEPTICUS_BLOCK = {
  key: "neuro_status",
  title: "Status Epilepticus Pathway",
  note: "A staged record: what was seizing and when, the first-line agent and its time, the second-line agent and its time, the airway, the cause search, and whether the episode became refractory. Times are recorded as documented — none is inferred.",
  fields: [
    { key: "se_time_last_known_seizing", label: "Time last known seizing or at baseline", type: "input" },
    { key: "se_ongoing_at_arrival", label: "Seizure ongoing at arrival", type: "select", options: YES_NO_NOT },
    {
      key: "se_type",
      label: "Episode type",
      type: "select",
      options: ["Convulsive", "Non-convulsive — EEG confirmed", "Non-convulsive — suspected", "Not classified"],
    },
    { key: "se_first_line_agent", label: "First-line agent and dose", type: "input", placeholder: "Agent, dose, route" },
    { key: "se_first_line_time", label: "First-line agent given at", type: "input" },
    { key: "se_second_line_agent", label: "Second-line agent and dose", type: "input" },
    { key: "se_second_line_time", label: "Second-line agent given at", type: "input" },
    {
      key: "se_airway",
      label: "Airway",
      type: "select",
      options: ["Patent and protected", "At risk — positioning and suction documented", "Intubated", "Not documented"],
    },
    { key: "se_glucose", label: "Blood glucose at presentation", type: "input", placeholder: "mmol/L" },
    { key: "se_temperature", label: "Temperature at presentation", type: "input", placeholder: "°C" },
    { key: "se_eeg_requested", label: "EEG requested", type: "select", options: ["Yes — time documented", "No", "Not documented"] },
    {
      key: "se_refractory",
      label: "Refractory stage",
      type: "select",
      options: ["Not reached", "Refractory — ongoing after the second-line agent", "Super-refractory — anaesthetic infusion required", "Not documented"],
    },
    {
      key: "se_cause_search",
      label: "Cause search documented",
      type: "multi",
      options: [
        "Hypoglycaemia", "Electrolyte or metabolic disturbance", "CNS infection", "Stroke",
        "Head injury", "Toxic cause or withdrawal", "Non-adherence to antiseizure medicine",
        "Structural lesion", "No cause identified",
      ],
    },
    {
      key: "se_level_of_care",
      label: "Level of care",
      type: "select",
      options: ["Ward", "High-dependency unit", "Intensive care", "Not documented"],
    },
    { key: "se_post_event_state", label: "State after the episode", type: "textarea", placeholder: "Consciousness, focal deficit, memory of the event" },
  ],
};

export const HEADACHE_BLOCK = {
  key: "neuro_headache",
  title: "Headache — ICHD-3 Pattern & Secondary Flags",
  note: "The pattern (frequency, duration, quality, associated features, aura) is recorded against ICHD-3, and the SNNOOP10 secondary-headache flags are documented whether present or absent. A red flag that is present is never left as a diagnosis of a primary headache.",
  fields: [
    { key: "hd_days_per_month", label: "Headache days per month", type: "number", min: 0, max: 31 },
    { key: "hd_attack_duration", label: "Typical attack duration", type: "input", placeholder: "e.g. 4–72 hours, or 30 minutes" },
    {
      key: "hd_quality",
      label: "Pain quality",
      type: "multi",
      options: ["Pulsating", "Pressing or tightening", "Stabbing", "Electric-shock like", "Burning", "Constant pressure"],
    },
    {
      key: "hd_location",
      label: "Location",
      type: "multi",
      options: ["Unilateral", "Bilateral", "Periorbital", "Occipital", "Holocranial", "Cervicogenic"],
    },
    { key: "hd_severity", label: "Severity", type: "select", options: ["Mild", "Moderate", "Severe", "Not documented"] },
    {
      key: "hd_associated",
      label: "Associated features",
      type: "multi",
      options: [
        "Nausea", "Vomiting", "Photophobia", "Phonophobia", "Osmophobia",
        "Lacrimation", "Conjunctival injection", "Rhinorrhoea", "Ptosis", "Miosis",
        "Visual aura", "Sensory aura", "Speech or language aura", "Motor weakness",
      ],
    },
    {
      key: "hd_aura",
      label: "Aura",
      type: "select",
      options: ["None", "Typical visual", "Typical sensory", "Speech or language", "Retinal", "Brainstem", "Not documented"],
    },
    { key: "hd_acute_medicine_days", label: "Days per month of acute headache medicine", type: "number", min: 0, max: 31 },
    {
      key: "hd_red_flags",
      label: "Secondary-headache flags (SNNOOP10)",
      type: "multi",
      options: [
        "Systemic symptoms including fever",
        "Neoplasm history",
        "Neurological deficit or seizure",
        "Sudden onset (thunderclap)",
        "Onset after 50 years",
        "Pattern change or new headache",
        "Positional headache",
        "Precipitated by Valsalva or cough",
        "Papilloedema",
        "Pregnancy or postpartum",
        "Painful eye with autonomic features",
        "Post-traumatic onset",
        "Immunosuppression",
        "Painkiller overuse",
        "None of these documented",
      ],
    },
    { key: "hd_temporal_artery", label: "Temporal artery", type: "select", options: ["Normal", "Tender or thickened", "Not assessed"] },
    { key: "hd_neck_stiffness", label: "Neck stiffness with this headache", type: "select", options: ["Absent", "Present", "Not assessed"] },
    { key: "hd_secondary_evaluation", label: "Secondary-headache evaluation documented", type: "textarea", placeholder: "What was done in response to each flag, and the result" },
    {
      key: "hd_ichd_diagnosis",
      label: "ICHD-3 pattern documented",
      type: "select",
      options: [
        "Migraine without aura", "Migraine with aura", "Chronic migraine", "Tension-type headache",
        "Cluster headache or other trigeminal autonomic cephalalgia", "Secondary headache — cause documented",
        "Criteria not fully met", "Not documented",
      ],
    },
  ],
};

export const MS_BLOCK = {
  key: "neuro_ms",
  title: "Multiple Sclerosis — Course, Activity & Therapy",
  note: "The course, the attacks in the last year, the dissemination evidence and the therapy being monitored are recorded separately. Where the diagnostic criteria are not met, the record says so instead of asserting the diagnosis.",
  fields: [
    {
      key: "ms_course",
      label: "Disease course",
      type: "select",
      options: ["Clinically isolated syndrome", "Relapsing-remitting", "Secondary progressive", "Primary progressive", "Not established"],
    },
    { key: "ms_attacks_12m", label: "Attacks in the last 12 months", type: "number", min: 0, max: 24 },
    { key: "ms_last_attack_date", label: "Date of the last attack", type: "input" },
    {
      key: "ms_recovery",
      label: "Recovery from the last attack",
      type: "select",
      options: ["Complete", "Partial", "Incomplete", "Not applicable", "Not documented"],
    },
    { key: "ms_edss", label: "Documented EDSS", type: "number", min: 0, max: 10, placeholder: "0–10, as examined" },
    {
      key: "ms_new_lesions",
      label: "New or enlarging lesions on the last scan",
      type: "select",
      options: ["No", "Yes — asymptomatic", "Yes — symptomatic", "Not assessed", "Not documented"],
    },
    {
      key: "ms_dissemination_space",
      label: "Dissemination in space (2017 McDonald criteria)",
      type: "select",
      options: ["Met", "Not met", "Not assessable"],
    },
    {
      key: "ms_dissemination_time",
      label: "Dissemination in time (2017 McDonald criteria)",
      type: "select",
      options: ["Met", "Not met", "Not assessable"],
    },
    { key: "ms_oligoclonal_bands", label: "Cerebrospinal fluid oligoclonal bands", type: "select", options: ["Positive", "Negative", "Not performed", "Not documented"] },
    { key: "ms_current_therapy", label: "Current disease-modifying therapy", type: "input", placeholder: "Agent, start date, interval" },
    { key: "ms_previous_therapy", label: "Previous therapies and reason stopped", type: "textarea" },
    {
      key: "ms_monitoring",
      label: "Therapy monitoring status",
      type: "select",
      options: ["First dose — monitoring documented", "Subsequent dose — monitoring documented", "Monitoring overdue", "Not applicable"],
    },
    { key: "ms_jcv", label: "JC virus antibody status", type: "select", options: ["Negative", "Positive — index documented", "Not tested", "Not documented"] },
    {
      key: "ms_symptoms",
      label: "Symptom burden documented",
      type: "multi",
      options: ["Fatigue", "Cognitive change", "Bladder", "Bowel", "Sexual dysfunction", "Spasticity", "Pain", "Depression", "Visual"],
    },
    {
      key: "ms_pregnancy",
      label: "Reproductive plan",
      type: "select",
      options: ["Not applicable", "Planning pregnancy", "Pregnant", "Breastfeeding", "Not discussed"],
    },
  ],
};

export const NEUROMUSCULAR_BLOCK = {
  key: "neuro_neuromuscular",
  title: "Neuromuscular Assessment",
  note: "Distribution, tempo and respiratory status are recorded with the study pattern. Respiratory symptoms and the measured vital capacity are asked for explicitly, because they — not limb power — decide whether the patient needs critical care.",
  fields: [
    {
      key: "nm_pattern",
      label: "Distribution",
      type: "select",
      options: ["No weakness documented", "Proximal", "Distal", "Asymmetric", "Bulbar", "Ocular", "Generalised"],
    },
    {
      key: "nm_tempo",
      label: "Tempo of progression",
      type: "select",
      options: ["Hours", "Days", "Weeks", "Months", "Static", "Not documented"],
    },
    {
      key: "nm_respiratory_symptoms",
      label: "Respiratory and bulbar symptoms",
      type: "multi",
      options: ["Orthopnoea", "Breathlessness at rest", "Weak cough", "Difficulty clearing secretions", "Dysphagia", "Dysarthria", "None documented"],
    },
    { key: "nm_fvc", label: "Forced vital capacity", type: "input", placeholder: "Value with unit, or % predicted" },
    {
      key: "nm_gbs_grade",
      label: "Guillain-Barré disability grade",
      type: "select",
      options: [
        "0 — Healthy", "1 — Minor symptoms", "2 — Walks unaided", "3 — Walks with aid",
        "4 — Bed or chair bound", "5 — Assisted ventilation", "Not applicable",
      ],
    },
    {
      key: "nm_mg_fatigable",
      label: "Fatigable weakness",
      type: "select",
      options: ["Not applicable", "Present", "Absent", "Not assessed"],
    },
    {
      key: "nm_mg_ocular",
      label: "Ocular involvement",
      type: "select",
      options: ["Not applicable", "Ptosis", "Diplopia", "Ptosis and diplopia", "None"],
    },
    { key: "nm_antibodies", label: "Antibody results documented", type: "input", placeholder: "e.g. anti-AChR, anti-MuSK, anti-GQ1b — with result" },
    {
      key: "nm_study_pattern",
      label: "Electrophysiological pattern documented",
      type: "select",
      options: ["Not performed", "Axonal", "Demyelinating", "Mixed", "Normal", "Report awaited"],
    },
    { key: "nm_csf_protein", label: "Cerebrospinal fluid protein", type: "input", placeholder: "g/L" },
    {
      key: "nm_albuminocytologic",
      label: "Albuminocytological dissociation",
      type: "select",
      options: ["Present", "Absent", "Not performed", "Not documentable — single sample"],
    },
    {
      key: "nm_ventilation",
      label: "Ventilatory support",
      type: "select",
      options: ["None", "Non-invasive ventilation", "Invasive ventilation", "Not documented"],
    },
  ],
};

export const COGNITIVE_BLOCK = {
  key: "neuro_cognitive",
  title: "Cognition & Function",
  note: "The instrument used and its score, the affected domains, the informant account and the functional consequence are recorded together — a score without a functional account does not describe a cognitive disorder.",
  fields: [
    {
      key: "cog_instrument",
      label: "Instrument used",
      type: "select",
      options: ["MMSE", "MoCA", "RUDAS", "Addenbrooke's Cognitive Examination", "Other documented instrument", "Not performed"],
    },
    { key: "cog_score", label: "Score", type: "input", placeholder: "Score and maximum, as administered" },
    {
      key: "cog_domains",
      label: "Affected domains",
      type: "multi",
      options: ["Memory", "Language", "Visuospatial", "Executive", "Attention", "Behavioural change"],
    },
    { key: "cog_duration", label: "Duration of the change", type: "select", options: ["Less than 6 months", "6–12 months", "1–2 years", "More than 2 years", "Not documented"] },
    {
      key: "cog_functional_impact",
      label: "Functional consequence",
      type: "select",
      options: ["Independent", "Instrumental activities affected", "Daily activities affected", "Dependent", "Not documented"],
    },
    {
      key: "cog_informant",
      label: "Informant account",
      type: "select",
      options: ["Available and corroborates", "Available and conflicts", "Unavailable", "Not documented"],
    },
    { key: "cog_delirium", label: "Delirium considered", type: "select", options: ["Excluded — documented", "Present", "Not assessed"] },
    { key: "cog_mood_screen", label: "Depression screen", type: "select", options: ["Negative", "Positive — documented", "Not performed"] },
    { key: "cog_driving", label: "Driving", type: "select", options: ["Continues", "Advised to stop", "Stopped", "Not discussed"] },
    { key: "cog_capacity", label: "Decision-making capacity", type: "select", options: ["Intact", "Impaired — documented", "Formal assessment requested", "Not assessed"] },
  ],
};

export const RAISED_ICP_BLOCK = {
  key: "neuro_icp",
  title: "Raised Intracranial Pressure & Herniation Risk",
  note: "The warning signs, the pupil and consciousness trend, the posturing and the measures actually taken are recorded. This block records risk; it never asserts that raised pressure is present.",
  fields: [
    {
      key: "icp_symptoms",
      label: "Warning symptoms documented",
      type: "multi",
      options: ["Headache worse lying flat", "Early-morning vomiting", "Transient visual obscuration", "Diplopia", "Pulsatile tinnitus", "Drowsiness", "None documented"],
    },
    { key: "icp_papilloedema", label: "Papilloedema", type: "select", options: ["Absent", "Present", "Not assessed"] },
    { key: "icp_gcs_trend", label: "Consciousness trend", type: "select", options: ["Stable", "Falling", "Improving", "Not available"] },
    {
      key: "icp_pupils",
      label: "Pupils",
      type: "select",
      options: ["Equal and reactive", "Asymmetric", "Fixed and dilated right", "Fixed and dilated left", "Bilateral fixed", "Not documented"],
    },
    { key: "icp_posturing", label: "Posturing", type: "select", options: ["None", "Decorticate", "Decerebrate", "Not documented"] },
    {
      key: "icp_cushing",
      label: "Cushing response documented",
      type: "select",
      options: ["Absent", "Present — bradycardia with hypertension", "Not assessed"],
    },
    { key: "icp_brainstem", label: "Brainstem reflexes", type: "select", options: ["Intact", "Absent — documented", "Not assessed"] },
    { key: "icp_measures", label: "Measures recorded", type: "multi", options: ["Head elevation", "Sedation", "Osmotherapy", "Ventilation target", "Cerebrospinal fluid drainage", "None documented"] },
    { key: "icp_neurosurgical", label: "Neurosurgical opinion", type: "select", options: ["Requested — time documented", "Not requested", "Not applicable"] },
  ],
};

export const CNS_INFECTION_BLOCK = {
  key: "neuro_cns_infection",
  title: "CNS Infection Assessment",
  note: "Fever, meningism, the cerebrospinal fluid as measured, the organism and the empirical therapy with its time are recorded. A lumbar puncture that was not done is documented as not done, with the reason.",
  fields: [
    { key: "inf_fever", label: "Fever", type: "select", options: ["Absent", "Present", "Not documented"] },
    { key: "inf_meningism", label: "Meningeal signs", type: "select", options: ["Absent", "Present", "Not assessed"] },
    { key: "inf_rash", label: "Rash", type: "select", options: ["Absent", "Petechial or purpuric", "Other documented", "Not documented"] },
    { key: "inf_immunosuppression", label: "Immunosuppression", type: "select", options: YES_NO_NOT },
    { key: "inf_lp_done", label: "Lumbar puncture", type: "select", options: ["Performed", "Deferred — reason documented", "Contraindicated — reason documented", "Refused", "Not documented"] },
    { key: "inf_lp_opening_pressure", label: "Opening pressure", type: "input", placeholder: "cm H₂O" },
    {
      key: "inf_csf_appearance",
      label: "Cerebrospinal fluid appearance",
      type: "select",
      options: ["Clear", "Turbid", "Purulent", "Blood-stained", "Xanthochromic", "Not performed"],
    },
    { key: "inf_csf_wcc", label: "Cerebrospinal fluid white cell count", type: "input", placeholder: "cells/µL, with differential" },
    { key: "inf_csf_protein", label: "Cerebrospinal fluid protein", type: "input", placeholder: "g/L" },
    { key: "inf_csf_glucose", label: "Cerebrospinal fluid glucose", type: "input", placeholder: "mmol/L" },
    { key: "inf_paired_glucose", label: "Paired blood glucose", type: "input", placeholder: "mmol/L" },
    { key: "inf_organism", label: "Organism identified", type: "input", placeholder: "Organism and specimen, or 'not identified'" },
    { key: "inf_empirical_therapy", label: "Empirical antimicrobial therapy", type: "input", placeholder: "Agents and doses" },
    { key: "inf_therapy_time", label: "First dose given at", type: "input" },
    { key: "inf_dexamethasone", label: "Dexamethasone", type: "select", options: ["Given — time documented", "Not given — reason documented", "Not applicable", "Not documented"] },
    { key: "inf_notification", label: "Notification", type: "select", options: ["Notifiable disease notified", "Not notifiable", "Notification outstanding", "Not documented"] },
  ],
};

export const DISCHARGE_BLOCK = {
  key: "neuro_discharge",
  title: "Status & Function at Discharge",
  note: "Disability, deficits, swallowing, mobility, driving advice and the follow-up interval are recorded against the pre-morbid level, so the change caused by this admission is visible.",
  fields: [
    { key: "dis_mrs", label: "Modified Rankin grade at discharge", type: "select", options: ["0", "1", "2", "3", "4", "5", "Not documented"] },
    {
      key: "dis_deficits",
      label: "Residual deficits",
      type: "multi",
      options: ["Motor", "Sensory", "Aphasia", "Dysarthria", "Dysphagia", "Visual", "Cognitive", "Ataxia", "Seizures controlled", "None documented"],
    },
    { key: "dis_swallow", label: "Swallowing", type: "select", options: ["Safe on normal diet", "Modified diet or thickened fluids", "Nasogastric feeding", "Not assessed"] },
    { key: "dis_mobility", label: "Mobility", type: "select", options: ["Independent", "With an aid", "With assistance", "Wheelchair", "Bedbound", "Not documented"] },
    {
      key: "dis_driving",
      label: "Driving advice",
      type: "select",
      options: ["Advised not to drive", "Advised to follow the local licensing regulation", "Not discussed", "Not applicable"],
    },
    { key: "dis_seizure_precautions", label: "Seizure precautions explained", type: "select", options: ["Yes", "Not applicable", "Not documented"] },
    { key: "dis_anticoagulation", label: "Anticoagulation or antithrombotic decision", type: "input", placeholder: "Agent, duration, and who reviews it" },
    { key: "dis_therapy_changes", label: "Changes to therapy made during this admission", type: "textarea" },
    { key: "dis_followup_interval", label: "Follow-up interval and with whom", type: "input" },
    { key: "dis_warning_signs", label: "Warning signs explained to the patient", type: "textarea" },
    {
      key: "dis_rehab",
      label: "Rehabilitation pathway",
      type: "select",
      options: ["None required", "Inpatient rehabilitation", "Outpatient therapy", "Community therapy", "Not documented"],
    },
  ],
};

export const REFERRAL_BLOCK = {
  key: "neuro_referral_question",
  title: "Handover Question & Care Transfer",
  note: "The question being asked, what has already been done and what the receiving clinician is expected to decide — so the referral adds information rather than repeating the record.",
  fields: [
    { key: "refx_question", label: "Specific question for the receiving clinician", type: "textarea" },
    { key: "refx_urgency_basis", label: "Basis for the stated urgency", type: "input" },
    {
      key: "refx_already_done",
      label: "Already documented or performed",
      type: "multi",
      options: ["Neurological examination", "Scan reviewed", "EEG", "NCS / EMG", "Cerebrospinal fluid", "Blood results reviewed", "Treatment trial", "None documented"],
    },
    { key: "refx_patient_expectation", label: "What the patient has been told", type: "textarea" },
    { key: "refx_contact", label: "Referring clinician and contact", type: "input" },
  ],
};