// Urology — structured documentation blocks.
//
// Each block is a group of related fields a urologist documents together. Every
// field is optional: a blank stays blank and is reported as NOT DOCUMENTED, never
// as normal, negative or absent. Nothing is pre-filled, inferred or defaulted.
//
// The blocks carry documentation only. No block computes a stage, a grade, a dose
// or a recommendation — those belong to the cited source and to the clinician.

const I = (key, label) => ({ key, label, type: "input" });
const N = (key, label, unit, min, max) => ({ key, label, type: "number", unit, min, max });
const D = (key, label) => ({ key, label, type: "date" });
const T = (key, label) => ({ key, label, type: "textarea" });
const S = (key, label, options) => ({ key, label, type: "select", options });
const M = (key, label, options) => ({ key, label, type: "multi", options });
const YN = (key, label) => ({ key, label, type: "select", options: ["Yes", "No", "Not documented"] });

const OBSTRUCTION = ["None", "Mild", "Moderate", "Severe", "Not documented"];
const SIDE = ["Right", "Left", "Bilateral", "Midline", "Not documented"];

export const URO_BLOCKS = {
  uro_history: {
    title: "Urological history",
    note: "Recorded from the patient. A blank is not a negative answer.",
    fields: [
      T("presenting_complaint", "Presenting complaint in the patient's own words"),
      N("symptom_duration_value", "Symptom duration — value", "", 0, 1000),
      S("symptom_duration_unit", "Symptom duration — unit", ["Days", "Weeks", "Months", "Years"]),
      S("symptom_severity", "Patient-reported severity", ["Mild", "Moderate", "Severe", "Not documented"]),
      T("hpi", "History of present illness — onset, course, aggravating and relieving factors"),
      T("previous_urological_conditions", "Previous urological conditions"),
      T("previous_urological_procedures", "Previous urological procedures and operations (with dates where known)"),
      S("catheter_history", "Catheter history", ["None", "Current indwelling catheter", "Intermittent self-catheterisation", "Previous catheterisation", "Suprapubic catheter", "Nephrostomy", "Not documented"]),
      N("recurrent_uti_count_12m", "Documented urinary tract infections in the past 12 months", "", 0, 50),
      S("stone_history", "Stone history", ["No previous stone", "Previous single stone", "Recurrent stones", "Bilateral stones", "Not documented"]),
      T("stone_history_detail", "Stone history — episodes, interventions, composition where known"),
      T("relevant_family_history", "Relevant family history (urological cancer, stone disease, congenital anomaly)"),
      T("past_medical_history", "Relevant past medical history"),
      T("past_surgical_history", "Relevant surgical history"),
      T("allergies", "Allergies — agent and reaction"),
      T("current_medications", "Current medications (as documented on the record)"),
      T("social_history", "Social history — smoking, occupation, mobility, fluid intake"),
      T("sexual_and_reproductive_history", "Sexual and reproductive history — recorded only when clinically appropriate"),
      T("review_of_systems", "Review of systems"),
      YN("sexual_history_declined", "Patient declined to discuss sexual or reproductive history"),
    ],
  },

  uro_stone_documentation: {
    title: "Stone disease documentation",
    note: "One record per stone. Use the free-text summary for multiple stones.",
    fields: [
      M("stone_site", "Stone site(s)", ["Renal calyx — upper", "Renal calyx — middle", "Renal calyx — lower", "Renal pelvis", "Proximal ureter", "Mid ureter", "Distal ureter", "Vesico-ureteric junction", "Bladder", "Urethra"]),
      S("stone_laterality", "Laterality", SIDE),
      N("stone_size_mm", "Largest stone — maximum dimension (mm)", "mm", 0, 200),
      N("stone_count", "Number of stones documented", "", 0, 50),
      N("stone_density_hu", "Stone density on CT (Hounsfield units)", "HU", 0, 2000),
      S("stone_obstruction", "Obstruction", OBSTRUCTION),
      S("hydronephrosis", "Hydronephrosis", ["None", "Mild", "Moderate", "Severe", "Not documented"]),
      YN("stone_infection", "Infection documented with the stone"),
      YN("stone_aki", "Acute kidney injury documented"),
      N("creatinine_at_presentation", "Creatinine at presentation (mg/dL)", "mg/dL", 0.1, 30),
      N("egfr_at_presentation", "eGFR at presentation (mL/min/1.73 m²)", "", 0, 200),
      YN("solitary_kidney", "Solitary or single functioning kidney"),
      S("stone_composition", "Stone composition — analysed", ["Not analysed", "Calcium oxalate monohydrate", "Calcium oxalate dihydrate", "Calcium phosphate", "Uric acid", "Struvite (infection)", "Cystine", "Mixed", "Other"]),
      S("intervention_performed", "Intervention documented", ["None — observation", "Medical expulsive therapy", "ESWL", "Ureteroscopy / RIRS", "PCNL", "Stent only", "Nephrostomy", "Open / laparoscopic / robotic stone surgery", "Not documented"]),
      T("stone_summary", "Stones — free-text summary when more than one"),
    ],
  },

  uro_metabolic_stone: {
    title: "Metabolic stone evaluation",
    note: "Values as reported by the laboratory. No interpretation is generated.",
    fields: [
      N("serum_calcium", "Serum calcium (mmol/L)", "mmol/L", 1, 4),
      N("serum_phosphate", "Serum phosphate (mmol/L)", "mmol/L", 0.3, 3),
      N("serum_urate", "Serum urate (µmol/L)", "µmol/L", 50, 1200),
      N("serum_pth", "Parathyroid hormone (pmol/L)", "pmol/L", 0, 500),
      N("urine_volume_24h", "24-hour urine volume (mL)", "mL", 0, 8000),
      N("urine_calcium_24h", "24-hour urine calcium (mmol/24h)", "mmol/24h", 0, 60),
      N("urine_oxalate_24h", "24-hour urine oxalate (mmol/24h)", "mmol/24h", 0, 5),
      N("urine_citrate_24h", "24-hour urine citrate (mmol/24h)", "mmol/24h", 0, 25),
      N("urine_urate_24h", "24-hour urine urate (mmol/24h)", "mmol/24h", 0, 15),
      N("urine_ph", "Urine pH (24-hour collection)", "", 4.5, 8.5),
      YN("cystine_screen", "Cystine screening performed"),
      T("dietary_assessment", "Dietary and fluid intake assessment"),
      T("metabolic_conclusion", "Metabolic conclusion documented by the clinician"),
      S("recurrence_risk", "Recurrence risk as documented", ["Low", "Intermediate", "High", "Not documented"]),
      T("prevention_plan", "Prevention plan documented"),
    ],
  },

  uro_luts: {
    title: "Lower urinary tract symptoms (LUTS)",
    note: "Symptom pattern and voiding assessment. IPSS and residual are recorded in the calculations panel.",
    fields: [
      M("symptom_pattern", "Symptom pattern", ["Voiding — weak stream", "Voiding — hesitancy", "Voiding — straining", "Voiding — terminal dribble", "Storage — frequency", "Storage — urgency", "Storage — nocturia", "Storage — urgency incontinence", "Post-micturition dribble", "Sensation of incomplete emptying"]),
      N("nocturia_episodes", "Nocturia episodes per night", "", 0, 20),
      N("voids_per_day", "Voiding episodes per 24 hours", "", 0, 60),
      N("qmax_ml_s", "Uroflowmetry — Qmax (mL/s)", "mL/s", 0, 60),
      N("voided_volume_ml", "Uroflowmetry — voided volume (mL)", "mL", 0, 2000),
      N("post_void_residual", "Post-void residual (mL)", "mL", 0, 3000),
      S("flow_pattern", "Flow pattern as reported", ["Bell-shaped", "Plateau", "Interrupted", "Staccato", "Not documented"]),
      N("prostate_volume_cc", "Prostate volume (cc) — measured or estimated", "cc", 1, 500),
      S("prostate_consistency", "Prostate consistency on examination", ["Benign / smooth", "Firm", "Hard / nodular", "Tender", "Not examined", "Not documented"]),
      YN("retention_history", "Documented episode of retention"),
      YN("upper_tract_deterioration", "Upper tract deterioration documented (hydronephrosis, renal impairment)"),
      YN("anticoagulant_or_antiplatelet", "On an anticoagulant or antiplatelet agent"),
      S("previous_luts_treatment", "Previous LUTS treatment", ["None", "Alpha-blocker", "5-alpha-reductase inhibitor", "Antimuscarinic / beta-3 agonist", "Combination therapy", "Minimally invasive surgery", "TURP / laser prostatectomy", "Other"]),
      T("luts_plan", "Documented management plan"),
    ],
  },

  uro_urodynamics: {
    title: "Urodynamic study",
    note: "Terminology follows the ICS standardisation reports cited in the guideline basis. No automated interpretation.",
    fields: [
      D("study_date", "Study date"),
      I("study_performed_by", "Study performed by"),
      S("study_type", "Study type", ["Filling cystometry", "Pressure-flow study", "Video-urodynamics", "Ambulatory urodynamics", "Uroflowmetry only", "Other"]),
      N("capacity_ml", "Maximum cystometric capacity (mL)", "mL", 0, 2000),
      N("compliance_ml_cm_h2o", "Compliance (mL/cm H₂O)", "mL/cmH₂O", 0, 500),
      YN("detrusor_overactivity", "Detrusor overactivity documented"),
      YN("detrusor_underactivity", "Detrusor underactivity documented"),
      YN("dsd", "Detrusor sphincter dyssynergia documented"),
      N("pdet_at_qmax", "Detrusor pressure at maximum flow (cm H₂O)", "cmH₂O", 0, 250),
      N("qmax_urodynamic", "Maximum flow rate during the study (mL/s)", "mL/s", 0, 60),
      YN("leak_with_cough", "Leak demonstrated with cough"),
      N("valsalva_leak_point_pressure", "Valsalva leak point pressure (cm H₂O)", "cmH₂O", 0, 300),
      YN("vesicoureteric_reflux_on_study", "Vesicoureteric reflux demonstrated"),
      YN("upper_tract_risk_features", "Features associated with upper-tract risk documented (low compliance, high storage pressure, reflux)"),
      T("catheter_used", "Catheter used for the study"),
      T("urodynamic_conclusion", "Conclusion documented by the clinician"),
    ],
  },

  uro_bladder_diary: {
    title: "Bladder diary",
    note: "A diary summary as recorded by the patient. A missing diary is reported as not documented.",
    fields: [
      N("diary_days", "Number of days recorded", "", 0, 14),
      N("diary_voids_per_day", "Voiding episodes per 24 hours", "", 0, 60),
      N("diary_nocturia_episodes", "Nocturia episodes per night", "", 0, 20),
      N("diary_max_voided_volume", "Largest voided volume (mL)", "mL", 0, 2000),
      N("diary_mean_voided_volume", "Mean voided volume (mL)", "mL", 0, 2000),
      N("diary_leakage_episodes", "Leakage episodes per 24 hours", "", 0, 40),
      N("diary_pads_per_day", "Pads used per 24 hours", "", 0, 30),
      N("diary_fluid_intake", "Documented fluid intake per 24 hours (mL)", "mL", 0, 8000),
      S("diary_leak_context", "Leakage context recorded", ["On coughing / sneezing / effort", "With urgency", "Without warning", "During sleep", "After voiding", "Mixed", "Not documented"]),
      T("diary_notes", "Diary notes"),
    ],
  },

  uro_exam_urinary: {
    title: "Abdominal, renal and bladder examination",
    note: "Each element is recorded as normal, abnormal, not performed or not applicable. An element not performed is never recorded as normal.",
    fields: [
      T("renal_examination_detail", "Renal examination — detail (ballotable kidney, renal angle tenderness, masses)"),
      T("bladder_examination_detail", "Bladder examination — suprapubic distension, tenderness"),
      T("abdominal_scars_and_stomas", "Abdominal scars, stomas and drains"),
      T("hernia_examination", "Inguinal / hernia examination"),
    ],
  },

  uro_genital_exam: {
    title: "Genital and scrotal examination",
    note: "Recorded element by element. A declined or not-performed examination is stated, never assumed normal.",
    fields: [
      T("penis", "Penis — skin, meatus, foreskin, lesions"),
      T("testes", "Testes — size, consistency, lie, tenderness"),
      T("epididymis", "Epididymis — tenderness, swelling"),
      T("spermatic_cord", "Spermatic cord — thickening, varicocele"),
      YN("varicocele_demonstrated", "Varicocele demonstrated on examination or Valsalva"),
      S("hydrocele", "Hydrocele", ["None", "Small", "Moderate", "Large", "Not documented"]),
      S("testicular_lie", "Testicular lie", ["Normal vertical", "Horizontal", "High-riding", "Retractile", "Undescended — palpable", "Undescended — impalpable", "Not documented"]),
      YN("phimosis", "Phimosis documented"),
      YN("paraphimosis", "Paraphimosis documented"),
      YN("penile_curvature", "Penile curvature documented"),
      YN("inguinal_nodes", "Inguinal lymph nodes palpable or assessed"),
      T("genital_exam_other", "Other genital findings"),
    ],
  },

  uro_dre: {
    title: "Digital rectal examination & prostate assessment",
    note: "Recorded only when performed and consented to. A not-performed examination is never recorded as normal.",
    fields: [
      S("dre_performed", "Digital rectal examination", ["Performed", "Not performed", "Declined", "Not applicable"]),
      S("prostate_size_dre", "Prostate size on DRE", ["Normal", "Enlarged — mild", "Enlarged — moderate", "Enlarged — marked", "Not documented"]),
      S("prostate_consistency", "Consistency", ["Benign / smooth", "Firm", "Hard", "Nodular", "Tender", "Not documented"]),
      YN("prostate_nodule", "Nodule or asymmetry documented"),
      YN("median_sulcus_obliterated", "Median sulcus obliterated"),
      YN("prostate_tenderness", "Prostatic tenderness"),
      S("sphincter_tone", "Anal sphincter tone", ["Normal", "Reduced", "Absent", "Not documented"]),
      T("dre_other", "Other DRE findings (rectal mucosa, masses)"),
    ],
  },

  uro_neuro_exam: {
    title: "Neurological examination relevant to bladder and sexual function",
    note: "Recorded element by element; an element not examined stays not documented.",
    fields: [
      S("perineal_sensation", "Perineal / saddle sensation", ["Intact", "Reduced", "Absent", "Not examined", "Not documented"]),
      S("anal_tone", "Anal tone", ["Normal", "Reduced", "Absent", "Not examined", "Not documented"]),
      S("bulbocavernosus_reflex", "Bulbocavernosus reflex", ["Present", "Absent", "Not examined", "Not documented"]),
      S("lower_limb_neurology", "Lower limb power and sensation", ["Normal", "Abnormal", "Not examined", "Not documented"]),
      YN("sacral_reflexes", "Sacral reflexes documented"),
      T("neuro_exam_detail", "Neurological findings — detail"),
    ],
  },

  uro_neuro_classification: {
    title: "Neuro-urological classification",
    note: "Classified from the documented neurological lesion and the urodynamic findings — never inferred by the app.",
    fields: [
      I("neurological_lesion", "Neurological lesion / diagnosis"),
      S("lesion_level", "Lesion level", ["Suprapontine", "Spinal — cervical", "Spinal — thoracic", "Spinal — lumbar", "Spinal — sacral", "Cauda equina", "Peripheral", "Not documented"]),
      S("lesion_completeness", "Completeness", ["Complete", "Incomplete", "Not documented"]),
      S("storage_function", "Storage function documented", ["Detrusor overactivity", "Normal storage", "Poor compliance", "Reduced capacity", "Not documented"]),
      S("voiding_function", "Voiding function documented", ["Detrusor underactivity / acontractile", "Detrusor overactivity with incomplete emptying", "Detrusor sphincter dyssynergia", "Normal voiding", "Not documented"]),
      S("bladder_management", "Bladder management", ["Spontaneous voiding", "Timed voiding", "Intermittent self-catheterisation", "Indwelling urethral catheter", "Suprapubic catheter", "Condom catheter", "Sacral neuromodulation", "Not documented"]),
      YN("upper_tract_surveillance", "Upper tract surveillance documented (imaging / renal function)"),
      N("catheterisations_per_day", "Catheterisations per 24 hours", "", 0, 20),
      T("neuro_urology_plan", "Documented neuro-urological plan"),
    ],
  },

  uro_oncology_tumour: {
    title: "Tumour documentation",
    note: "Recorded from the histopathology, imaging and operative findings. Staging is documented in the staging panel, never derived by the app.",
    fields: [
      S("cancer_site", "Tumour site", ["Prostate", "Bladder", "Kidney", "Renal pelvis / ureter", "Testis", "Penis", "Urethra", "Other"]),
      S("laterality", "Laterality", SIDE),
      N("tumour_size_mm", "Maximum tumour dimension (mm)", "mm", 0, 500),
      N("tumour_count", "Number of lesions documented", "", 0, 50),
      S("histology", "Histology", ["Adenocarcinoma", "Urothelial carcinoma", "Squamous cell carcinoma", "Clear cell renal cell carcinoma", "Papillary renal cell carcinoma", "Chromophobe renal cell carcinoma", "Germ cell tumour — seminoma", "Germ cell tumour — non-seminoma", "Small cell carcinoma", "Other", "Not documented"]),
      S("grade_isup", "Grade (ISUP / WHO where applicable)", ["Grade group 1", "Grade group 2", "Grade group 3", "Grade group 4", "Grade group 5", "Low grade", "High grade", "Not applicable", "Not documented"]),
      S("invasion_depth", "Depth of invasion documented", ["Non-invasive", "Subepithelial connective tissue", "Muscle invasive", "Perivesical / periprostatic", "Adjacent organ", "Not documented"]),
      YN("lymphovascular_invasion", "Lymphovascular invasion documented"),
      YN("perineural_invasion", "Perineural invasion documented"),
      S("surgical_margins", "Margin status where resected", ["Negative", "Positive", "Close", "Not applicable", "Not documented"]),
      YN("detrusor_muscle_in_turbt", "Detrusor muscle present in the TURBT specimen"),
      S("biomarkers", "Biomarkers documented", ["None recorded", "PSA", "PSA + MRI (PI-RADS)", "PSA + PSMA PET", "Testicular tumour markers (AFP / β-hCG / LDH)", "Other"]),
      I("pirads_score", "PI-RADS score (MRI prostate), if performed"),
      T("mdt_referral", "MDT / tumour board referral documented"),
    ],
  },

  uro_oncology_treatment_history: {
    title: "Oncology treatment history & response",
    note: "The treatment recorded, the response documented against its own baseline, and the toxicity documented by the treating team.",
    fields: [
      M("treatment_modality", "Treatment modality", ["Active surveillance", "Watchful waiting", "Radical prostatectomy", "Radiotherapy", "Brachytherapy", "Androgen deprivation therapy", "TURBT", "Intravesical therapy — BCG", "Intravesical therapy — chemotherapy", "Radical cystectomy", "Partial nephrectomy", "Radical nephrectomy", "Nephroureterectomy", "Ureteroscopic ablation", "Radical orchiectomy", "Chemotherapy", "Retroperitoneal lymph node dissection", "Penectomy", "Inguinal lymph node dissection", "Systemic therapy — targeted", "Systemic therapy — immunotherapy"]),
      D("treatment_start", "Treatment start date"),
      D("treatment_end", "Treatment end date"),
      S("response", "Response as documented against its baseline", ["Complete response", "Partial response", "Stable disease", "Progressive disease", "Not yet assessed", "Not applicable", "Not documented"]),
      D("response_assessed_date", "Response assessed on"),
      S("toxicity_grade", "Highest toxicity grade documented (CTCAE)", ["None", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Not documented"]),
      T("toxicity_detail", "Toxicity detail"),
      YN("biochemical_recurrence", "Biochemical recurrence documented"),
      YN("radiological_recurrence", "Radiological recurrence documented"),
      T("next_surveillance_step", "Next surveillance step documented"),
      D("next_surveillance_date", "Next surveillance date"),
    ],
  },

  uro_andrology_sexual: {
    title: "Sexual function assessment",
    note: "Confidential clinical information. Recorded only with the patient's agreement; a declined history is recorded as declined.",
    fields: [
      S("ed_duration", "Duration of erectile difficulty", ["< 3 months", "3–12 months", "1–3 years", "> 3 years", "Not documented"]),
      S("ed_onset", "Onset", ["Sudden", "Gradual", "Not documented"]),
      S("erection_hardness", "Erection hardness documented", ["E0 — no erection", "E1 — slightly tumescent", "E2 — partially rigid", "E3 — rigid enough for penetration", "E4 — fully rigid", "Not documented"]),
      YN("nocturnal_or_morning_erections", "Nocturnal or morning erections present"),
      S("libido", "Libido", ["Normal", "Reduced", "Absent", "Increased", "Not documented"]),
      YN("ejaculatory_dysfunction", "Ejaculatory dysfunction documented"),
      YN("peyronie_disease", "Peyronie disease documented"),
      M("vascular_risk_factors", "Vascular risk factors documented", ["Diabetes", "Hypertension", "Dyslipidaemia", "Smoking", "Obesity", "Ischaemic heart disease", "Previous pelvic surgery", "Radiotherapy to the pelvis", "None documented"]),
      T("previous_ed_treatment", "Previous treatment for erectile dysfunction and the response"),
      YN("pde5_inhibitor_response", "Documented response to a PDE5 inhibitor"),
      S("partner_issue", "Partner-related factor documented", ["None documented", "Partner sexual dysfunction", "Relationship difficulty", "Not discussed"]),
      YN("psychosexual_referral", "Psychosexual referral documented"),
    ],
  },

  uro_infertility: {
    title: "Male fertility assessment",
    note: "Values as reported by the laboratory, with the reference range of the reporting laboratory recorded where known.",
    fields: [
      S("trying_to_conceive", "Duration trying to conceive", ["< 12 months", "12–24 months", "> 24 months", "Not documented"]),
      N("partner_age", "Partner age (years)", "years", 15, 60),
      YN("previous_pregnancy_with_partner", "Previous pregnancy with this partner documented"),
      YN("previous_fertility_treatment", "Previous fertility treatment documented"),
      N("semen_volume_ml", "Semen analysis — volume (mL)", "mL", 0, 20),
      N("sperm_concentration_million_ml", "Semen analysis — concentration (million/mL)", "million/mL", 0, 500),
      N("total_sperm_count_million", "Semen analysis — total sperm number (million)", "million", 0, 2000),
      N("total_motility_pct", "Semen analysis — total motility (%)", "%", 0, 100),
      N("progressive_motility_pct", "Semen analysis — progressive motility (%)", "%", 0, 100),
      N("normal_morphology_pct", "Semen analysis — normal forms (%)", "%", 0, 100),
      N("vitality_pct", "Semen analysis — vitality (%)", "%", 0, 100),
      S("semen_reference_basis", "Reference limits used by the reporting laboratory", ["WHO 6th edition limits (2021)", "WHO 5th edition limits (2010)", "Laboratory's own range", "Not stated"]),
      D("semen_analysis_date", "Semen analysis date"),
      N("fsh", "FSH (IU/L)", "IU/L", 0, 200),
      N("lh", "LH (IU/L)", "IU/L", 0, 200),
      N("total_testosterone", "Total testosterone (nmol/L)", "nmol/L", 0, 80),
      N("prolactin", "Prolactin (mIU/L or ng/mL — state unit)", "", 0, 10000),
      YN("varicocele_present", "Varicocele documented"),
      YN("karyotype_performed", "Karyotype performed"),
      YN("azoospermia", "Azoospermia documented"),
      T("fertility_plan", "Documented fertility plan"),
    ],
  },

  uro_hypogonadism: {
    title: "Testosterone deficiency assessment",
    note: "Two morning total testosterone values are the documented basis. A single value is reported as insufficient.",
    fields: [
      N("testosterone_1", "Total testosterone — value 1 (nmol/L)", "nmol/L", 0, 80),
      D("testosterone_1_date", "Value 1 — date"),
      S("testosterone_1_time", "Value 1 — time of sample", ["Morning (before 11:00)", "Afternoon", "Time not recorded"]),
      N("testosterone_2", "Total testosterone — value 2 (nmol/L)", "nmol/L", 0, 80),
      D("testosterone_2_date", "Value 2 — date"),
      S("testosterone_2_time", "Value 2 — time of sample", ["Morning (before 11:00)", "Afternoon", "Time not recorded"]),
      N("shbg", "SHBG (nmol/L)", "nmol/L", 0, 300),
      M("symptoms", "Symptoms documented", ["Low libido", "Erectile dysfunction", "Reduced morning erections", "Fatigue", "Reduced muscle mass", "Increased body fat", "Low mood", "Hot flushes", "None documented"]),
      N("haematocrit_pct", "Haematocrit (%)", "%", 20, 70),
      N("psa_baseline", "PSA at baseline (ng/mL)", "ng/mL", 0, 1000),
      YN("fertility_desired", "Fertility desired"),
      T("treatment_history", "Documented treatment history and monitoring plan"),
    ],
  },

  uro_peyronie: {
    title: "Peyronie disease assessment",
    note: "The curvature, plaque and stability as documented by the clinician; a photograph or measurement is recorded, never estimated.",
    fields: [
      S("duration", "Duration of disease", ["< 3 months", "3–12 months", "> 12 months", "Not documented"]),
      S("phase", "Phase as documented", ["Acute / inflammatory", "Stable", "Not documented"]),
      N("curvature_degrees", "Curvature measured (degrees)", "°", 0, 120),
      S("curvature_direction", "Curvature direction", ["Dorsal", "Ventral", "Lateral — right", "Lateral — left", "Complex / biplanar", "Not documented"]),
      YN("painful_erection", "Painful erections documented"),
      YN("plaque_palpable", "Palpable plaque documented"),
      N("plaque_size_mm", "Plaque size (mm)", "mm", 0, 100),
      YN("erectile_function_affected", "Erectile function affected"),
      N("penile_length_change_cm", "Documented length change (cm)", "cm", -10, 10),
      YN("difficulty_intercourse", "Difficulty with intercourse documented"),
      T("previous_treatment", "Previous treatment documented"),
      T("peyronie_plan", "Documented management plan"),
    ],
  },

  uro_priapism: {
    title: "Priapism assessment",
    note: "Duration and type decide urgency. Recorded as observed and reported.",
    fields: [
      S("priapism_type", "Type documented", ["Ischaemic (low-flow)", "Non-ischaemic (high-flow)", "Stuttering / recurrent", "Not yet classified"]),
      N("duration_hours", "Duration at assessment (hours)", "hours", 0, 240),
      YN("painful", "Painful"),
      YN("previous_episodes", "Previous episodes documented"),
      T("precipitant", "Precipitant documented (medication, trauma, sickle cell disease, other)"),
      S("corpora_involved", "Corpora involved", ["Both corpora cavernosa", "One corpus cavernosum", "Corpora cavernosa and glans", "Not documented"]),
      T("aspiration_findings", "Aspiration / blood gas findings where performed"),
      T("management_documented", "Management documented and by whom"),
    ],
  },

  uro_stricture: {
    title: "Urethral stricture assessment",
    note: "Site, length and aetiology as documented on urethrography, cystoscopy or both.",
    fields: [
      S("stricture_site", "Stricture site", ["Meatal", "Fossa navicularis", "Penile urethra", "Bulbar urethra", "Membranous urethra", "Prostatic urethra", "Panurethral", "Multiple sites", "Not documented"]),
      N("stricture_length_mm", "Stricture length (mm)", "mm", 0, 200),
      N("stricture_count", "Number of strictures", "", 0, 20),
      S("aetiology", "Aetiology documented", ["Idiopathic", "Iatrogenic — catheter", "Iatrogenic — endoscopic", "Post-radiotherapy", "Trauma", "Infection", "Lichen sclerosus", "Hypospadias-related", "Not documented"]),
      S("prior_treatment", "Previous treatment", ["None", "Dilatation", "Optical urethrotomy", "Urethroplasty", "Repeat urethroplasty", "Stent", "Not documented"]),
      N("qmax_ml_s", "Qmax (mL/s)", "mL/s", 0, 60),
      N("post_void_residual", "Post-void residual (mL)", "mL", 0, 3000),
      YN("urinary_infection_documented", "Urinary infection documented"),
      YN("retention_documented", "Retention documented"),
      T("imaging_findings", "Urethrography / cystoscopy findings"),
      T("reconstruction_plan", "Documented reconstruction plan"),
    ],
  },

  uro_female_urology: {
    title: "Female urology assessment",
    note: "Incontinence type, prolapse and obstetric history as documented. Pelvic floor examination is recorded element by element.",
    fields: [
      M("incontinence_type", "Incontinence type documented", ["Stress", "Urgency", "Mixed", "Overflow", "Continuous", "Post-micturition", "Not documented"]),
      S("incontinence_severity", "Severity as documented", ["Mild", "Moderate", "Severe", "Not documented"]),
      N("pads_per_day", "Pads per 24 hours", "", 0, 30),
      N("parity", "Parity", "", 0, 20),
      M("obstetric_history", "Obstetric factors documented", ["Vaginal delivery", "Instrumental delivery", "Caesarean section", "Third- or fourth-degree tear", "Macrosomia", "None documented"]),
      YN("pelvic_surgery_history", "Previous pelvic surgery documented"),
      S("prolapse_compartment", "Prolapse compartment documented", ["Anterior (cystocele)", "Posterior (rectocele)", "Apical (uterine / vault)", "Multiple compartments", "None documented"]),
      S("prolapse_stage", "Prolapse stage as documented", ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Not documented"]),
      YN("voiding_dysfunction", "Voiding dysfunction documented"),
      YN("recurrent_uti", "Recurrent urinary tract infection documented"),
      T("pelvic_exam_findings", "Pelvic examination findings"),
      T("female_urology_plan", "Documented management plan"),
    ],
  },

  uro_paediatric: {
    title: "Paediatric urology assessment",
    note: "Guardian and consent documentation are required for a child. No paediatric dose is calculated or suggested by AMedix.",
    fields: [
      I("guardian_name", "Parent / guardian name"),
      I("guardian_relationship", "Relationship to the child"),
      YN("guardian_consent_documented", "Guardian consent documented for the assessment"),
      N("age_years", "Age (years)", "years", 0, 18),
      N("weight_kg", "Weight (kg)", "kg", 0.4, 150),
      S("antenatal_history", "Antenatal history documented", ["Normal", "Antenatal hydronephrosis", "Oligohydramnios", "Other abnormality", "Not documented"]),
      S("birth_history", "Birth history documented", ["Normal vaginal delivery", "Caesarean section", "Premature", "Neonatal unit admission", "Not documented"]),
      S("toilet_training", "Toilet training", ["Achieved — day and night", "Achieved — day only", "Not yet achieved", "Regressed", "Not applicable for age", "Not documented"]),
      N("uti_count", "Documented urinary tract infections", "", 0, 30),
      YN("enuresis", "Nocturnal enuresis documented"),
      YN("daytime_incontinence", "Daytime incontinence documented"),
      YN("voiding_dysfunction", "Voiding dysfunction documented"),
      S("vur_grade", "Vesicoureteric reflux grade where documented", ["Grade I", "Grade II", "Grade III", "Grade IV", "Grade V", "Not documented", "Not applicable"]),
      S("meatal_position", "Meatal position (hypospadias) where documented", ["Normal", "Glanular", "Coronal", "Distal penile", "Mid penile", "Proximal penile", "Penoscrotal", "Scrotal", "Perineal", "Not applicable", "Not documented"]),
      YN("chordee", "Chordee documented"),
      S("testis_position", "Testis position where documented", ["Both scrotal", "Retractile", "Unilateral undescended", "Bilateral undescended", "Not applicable", "Not documented"]),
      YN("posterior_urethral_valves", "Posterior urethral valves documented"),
      T("paediatric_imaging", "Imaging documented (ultrasound, VCUG, DMSA, MAG3)"),
      T("paediatric_plan", "Documented plan with review interval"),
    ],
  },

  uro_transplant: {
    title: "Renal transplant — urological assessment",
    note: "Graft function and urological complications as documented by the transplant team.",
    fields: [
      D("transplant_date", "Transplant date"),
      S("donor_type", "Donor type", ["Living related", "Living unrelated", "Deceased donor", "Not documented"]),
      S("ureteric_anastomosis", "Ureteric anastomosis documented", ["Lich–Gregoir", "Leadbetter–Politano", "Ureteroureterostomy", "Ureteropyelostomy", "Not documented"]),
      N("creatinine_current", "Current creatinine (mg/dL)", "mg/dL", 0.1, 30),
      N("creatinine_baseline", "Documented baseline creatinine (mg/dL)", "mg/dL", 0.1, 30),
      N("egfr_current", "Current eGFR (mL/min/1.73 m²)", "", 0, 200),
      T("immunosuppression", "Immunosuppressive regimen documented"),
      S("urological_complication", "Urological complication documented", ["None", "Ureteric obstruction / stricture", "Ureteric leak", "Vesicoureteric reflux", "Lymphocele", "Graft stone", "Haematuria", "Bladder outlet obstruction", "Other"]),
      YN("graft_tenderness", "Graft tenderness documented"),
      N("post_void_residual", "Post-void residual (mL)", "mL", 0, 3000),
      T("transplant_plan", "Documented plan"),
    ],
  },

  uro_emergency: {
    title: "Emergency urology presentation",
    note: "The presentation, the time-critical features and the disposition recorded at the time of care.",
    fields: [
      N("onset_hours", "Hours since onset", "hours", 0, 720),
      M("presentation", "Presentation", ["Acute urinary retention", "Renal colic with obstruction", "Obstructed infected kidney", "Urosepsis", "Acute scrotum", "Testicular torsion", "Priapism", "Macroscopic haematuria with clot retention", "Urological trauma", "Acute renal failure from obstruction", "Postoperative complication"]),
      N("temperature_c", "Temperature (°C)", "°C", 30, 45),
      N("systolic_bp", "Systolic blood pressure (mmHg)", "mmHg", 40, 260),
      N("heart_rate", "Heart rate (bpm)", "bpm", 20, 220),
      N("respiratory_rate", "Respiratory rate (per minute)", "/min", 5, 60),
      N("spo2_pct", "Oxygen saturation (%)", "%", 50, 100),
      S("resuscitation", "Resuscitation documented", ["None required", "Intravenous fluids", "Oxygen", "Antibiotics — time documented", "Blood products", "Vasopressor support", "Not documented"]),
      S("decompression", "Urinary decompression documented", ["None", "Urethral catheter", "Suprapubic catheter", "Ureteric stent", "Nephrostomy", "Not documented"]),
      T("emergency_investigations", "Investigations documented at presentation"),
      S("disposition", "Disposition", ["Discharge", "Admission — ward", "Admission — HDU / ICU", "Theatre", "Transfer", "Observation", "Left against advice", "Not documented"]),
      T("emergency_plan", "Documented plan and escalation"),
    ],
  },

  uro_postop_review: {
    title: "Postoperative review",
    note: "Recorded findings only. A normal value is recorded as normal; a missing one is not documented.",
    fields: [
      N("postop_day", "Postoperative day", "", 0, 90),
      N("temperature_c", "Temperature (°C)", "°C", 30, 45),
      N("heart_rate", "Heart rate (bpm)", "bpm", 20, 220),
      N("systolic_bp", "Systolic blood pressure (mmHg)", "mmHg", 40, 260),
      N("urine_output_ml_24h", "Urine output over 24 hours (mL)", "mL", 0, 15000),
      S("catheter", "Catheter", ["None", "Urethral", "Suprapubic", "Nephrostomy", "Ureteric stent", "Stent + catheter", "Not documented"]),
      S("drain", "Drain", ["None", "In situ", "Removed", "Not documented"]),
      S("wound", "Wound", ["Clean and dry", "Haematoma", "Discharge", "Dehiscence", "Infection", "Not documented"]),
      N("haemoglobin", "Haemoglobin (g/dL)", "g/dL", 3, 20),
      N("creatinine", "Creatinine (mg/dL)", "mg/dL", 0.1, 30),
      S("complication", "Complication documented", ["None documented", "Clavien–Dindo I", "Clavien–Dindo II", "Clavien–Dindo IIIa", "Clavien–Dindo IIIb", "Clavien–Dindo IVa", "Clavien–Dindo IVb", "Clavien–Dindo V"]),
      T("complication_detail", "Complication detail and management"),
      T("postop_plan", "Documented plan"),
    ],
  },

  uro_second_opinion: {
    title: "Second opinion",
    note: "The question asked, the records reviewed, and the opinion — with what the opinion is and is not based on.",
    fields: [
      T("question_asked", "Clinical question the patient is asking"),
      T("records_reviewed", "Records and investigations reviewed, with their dates"),
      YN("original_records_available", "Original records and imaging available"),
      T("findings_summary", "Summary of findings reviewed"),
      T("opinion", "Opinion documented by the clinician"),
      M("options_discussed", "Options discussed", ["Continue current plan", "Further investigation", "Alternative treatment", "Referral to another specialist", "Multidisciplinary review", "Surveillance", "No further treatment"]),
      T("uncertainties", "Uncertainties and what would change the opinion"),
      T("patient_preference", "Patient's stated preference"),
    ],
  },
};

// Fields a block declares, with their types, so the form and the QA harness read
// the same definition.
export const blockFields = (key) => (URO_BLOCKS[key] ? URO_BLOCKS[key].fields : []);
export const URO_BLOCK_COUNT = Object.keys(URO_BLOCKS).length;