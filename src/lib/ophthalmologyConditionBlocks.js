// Ophthalmology — condition, emergency, procedure and follow-up blocks.
//
// These are the blocks that make each existing note type condition-specific:
// glaucoma, cataract, cornea, retina, diabetic retinopathy, macular disease,
// neuro-ophthalmology, paediatric and strabismus, refraction, trauma, infection,
// the time-critical presentation, intravitreal injection, surgery, post-operative
// monitoring, discharge, test reporting and referral.
//
// Each block records what the cited document requires to be documented, in
// AMedix's own wording; no AAO text is reproduced. Levels and stages use the
// vocabulary of the source (ICDR levels, ICROP3 zone/stage, SUN grading), so a
// stored level means the same thing to the next clinician who reads the note.

import {
  T, I, N, S, M, WHEN, WHEN_IN, NOT_DOCUMENTED, NOT_ASSESSED, NONE_DOCUMENTED,
} from "@/lib/ophthFieldKit";

export const OPHTH_CONDITION_BLOCKS = {
  // ---- Glaucoma -----------------------------------------------------------
  ophth_glaucoma: {
    title: "Glaucoma Assessment",
    fields: [
      S("glaucoma_type", "Diagnosis", ["Glaucoma suspect", "Primary open-angle glaucoma", "Primary angle closure or angle-closure glaucoma", "Secondary open-angle glaucoma", "Secondary angle-closure glaucoma", NOT_DOCUMENTED]),
      S("glaucoma_stage", "Documented Stage", ["Suspect", "Early", "Moderate", "Advanced", "End-stage", NOT_DOCUMENTED]),
      S("staging_basis", "Staging Basis", ["Hodapp-Parrish-Anderson visual field criteria", "Optic disc appearance", "Both field and disc", NOT_DOCUMENTED], WHEN_IN("glaucoma_stage", ["Early", "Moderate", "Advanced", "End-stage"])),
      I("vf_md_right", "Visual Field Mean Deviation — Right Eye", { placeholder: "dB" }),
      I("vf_psd_right", "Visual Field Pattern Standard Deviation — Right Eye"),
      I("vf_md_left", "Visual Field Mean Deviation — Left Eye"),
      I("vf_psd_left", "Visual Field Pattern Standard Deviation — Left Eye"),
      S("vf_reliability", "Visual Field Reliability", ["Reliable", "Doubtful — documented", "Not tested", NOT_DOCUMENTED]),
      S("progression", "Progression Since Last Assessment", ["No progression", "Possible progression — documented", "Likely progression — documented", "Not assessable", NOT_DOCUMENTED]),
      S("progression_basis", "Progression Judged From", ["Serial visual fields", "Serial OCT retinal nerve fibre layer", "Serial disc photography", "Combination of tests", NOT_DOCUMENTED], WHEN_IN("progression", ["Possible progression — documented", "Likely progression — documented"])),
      S("rnfl", "Retinal Nerve Fibre Layer (OCT)", ["Within normal limits", "Thinning — documented", "Not measured", NOT_DOCUMENTED]),
      M("treatment", "Current Treatment", ["Prostaglandin analogue", "Beta-blocker", "Alpha-2 agonist", "Carbonic anhydrase inhibitor", "Fixed combination drop", "Selective laser trabeculoplasty", "Trabeculectomy", "Tube shunt", "Cyclophotocoagulation", "No treatment — documented"]),
      S("treatment_decision", "Treatment Decision at This Visit", ["Continue", "Escalate — documented", "Reduce — documented", "Change agent — documented", "Laser or surgery arranged", NOT_DOCUMENTED]),
      S("adherence", "Adherence", ["Good", "Partial — reasons documented", "Not assessed", NOT_DOCUMENTED]),
      M("adherence_detail", "Adherence — What Was Documented", ["Cost", "Side effects", "Regimen complexity", "Missed doses — patient-reported"], WHEN("adherence", "Partial — reasons documented")),
      S("glaucoma_family_history", "Family History of Glaucoma", ["No", "Yes — first-degree relative", NOT_DOCUMENTED]),
      I("next_field_review", "Next Visual Field Review"),
    ],
  },

  // ---- Lens ---------------------------------------------------------------
  ophth_cataract: {
    title: "Cataract & Lens Assessment",
    fields: [
      S("cataract_type", "Cataract Type", ["Nuclear sclerotic", "Cortical", "Posterior subcapsular", "Mixed", "Traumatic", "Diabetic", "Congenital", NOT_DOCUMENTED]),
      M("cataract_symptoms", "Visual Disability Documented", ["Reduced acuity", "Glare", "Halos", "Monocular diplopia", "Difficulty driving or reading", "Night vision difficulty", NONE_DOCUMENTED]),
      S("cataract_indication", "Surgical Indication", ["Visual disability documented", "Anisometropia", "Lens-induced disease", "Surgical access required for posterior segment", "Not established"]),
      S("biometry", "Biometry", ["Performed — intraocular lens power calculated", "Not performed", NOT_DOCUMENTED]),
      I("iol_power", "Calculated Intraocular Lens Power", WHEN("biometry", "Performed — intraocular lens power calculated")),
      S("iol_formula", "Formula Used", ["Barrett Universal II", "Kane", "SRK/T", "Hoffer Q", "Haigis", "Other — documented", NOT_DOCUMENTED], WHEN("biometry", "Performed — intraocular lens power calculated")),
      I("target_refraction", "Target Post-Operative Refraction", WHEN("biometry", "Performed — intraocular lens power calculated")),
      M("ocular_comorbidity", "Ocular Comorbidity Affecting the Plan", ["Glaucoma", "Age-related macular degeneration", "Diabetic retinopathy", "Corneal disease", "Amblyopia", "Pseudoexfoliation", "Uveitis", "High myopia", "Previous intraocular surgery", NONE_DOCUMENTED]),
      S("alpha_antagonist", "Alpha-1 Antagonist Use (intra-operative floppy iris risk)", ["None", "Tamsulosin", "Other alpha-1 antagonist", NOT_DOCUMENTED]),
      S("antithrombotic", "Antiplatelet / Anticoagulant Therapy", ["None", "Antiplatelet", "Anticoagulant", "Both", NOT_DOCUMENTED]),
      S("antithrombotic_plan", "Peri-Operative Antithrombotic Plan", ["Continued — agreed with the prescriber and documented", "Held — restart documented", NOT_DOCUMENTED], WHEN_IN("antithrombotic", ["Antiplatelet", "Anticoagulant", "Both"])),
      S("surgery_planned", "Procedure Planned", ["Phacoemulsification with intraocular lens", "Extracapsular extraction", "Combined procedure", NOT_DOCUMENTED]),
      S("second_eye", "Second Eye", ["Not applicable", "Planned after the first eye's outcome is known", "Same admission — documented", NOT_DOCUMENTED]),
    ],
  },

  // ---- Cornea and external disease ----------------------------------------
  ophth_cornea: {
    title: "Cornea & External Disease",
    fields: [
      M("cornea_problem", "Corneal / External Problem", ["Bacterial keratitis", "Fungal keratitis", "Herpes simplex keratitis", "Corneal ulcer", "Corneal abrasion", "Corneal oedema", "Keratoconus", "Pterygium", "Dry eye disease", "Blepharitis", "Exposure keratitis", "Neurotrophic keratitis", "Corneal dystrophy", NONE_DOCUMENTED]),
      I("ulcer_size", "Ulcer or Infiltrate Size", { placeholder: "e.g. 2.5 × 1.8 mm" }, WHEN_IN("cornea_problem", ["Bacterial keratitis", "Fungal keratitis", "Corneal ulcer"])),
      S("ulcer_location", "Ulcer Location", ["Central", "Paracentral", "Peripheral", NOT_DOCUMENTED], WHEN_IN("cornea_problem", ["Bacterial keratitis", "Fungal keratitis", "Corneal ulcer"])),
      S("infiltrate_depth", "Infiltrate Depth", ["Epithelial", "Anterior stromal", "Deep stromal", "Descemetocoele", NOT_DOCUMENTED], WHEN_IN("cornea_problem", ["Bacterial keratitis", "Fungal keratitis", "Corneal ulcer"])),
      S("contact_lens", "Contact Lens Wear", ["None", "Soft — daily wear", "Soft — extended wear", "Rigid gas permeable", "Orthokeratology", NOT_DOCUMENTED]),
      S("scraping", "Corneal Sampling", ["Performed — microscopy and culture sent", "Not performed — reason documented", NOT_DOCUMENTED], WHEN_IN("cornea_problem", ["Bacterial keratitis", "Fungal keratitis", "Corneal ulcer"])),
      S("steroid", "Topical Steroid", ["Not prescribed", "Prescribed — documented", "Deferred until culture result documented", NOT_DOCUMENTED]),
      S("surface_staining", "Ocular Surface Staining", ["None", "Punctate epithelial erosions", "Corneal staining — documented", "Not performed"]),
      I("tear_breakup", "Tear Break-Up Time", { unit: "seconds" }),
      I("schirmer", "Schirmer Test", { unit: "mm" }),
      S("keratoconus_stage", "Keratoconus Stage", ["Suspect", "Mild", "Moderate", "Severe", NOT_DOCUMENTED], WHEN_IN("cornea_problem", ["Keratoconus"])),
      S("cross_linking", "Corneal Cross-Linking", ["Not indicated", "Performed — documented", "Planned — documented", NOT_DOCUMENTED], WHEN_IN("cornea_problem", ["Keratoconus"])),
      S("corneal_transplant", "Corneal Transplantation", ["Not indicated", "Listed — documented", "Performed", NOT_DOCUMENTED], WHEN_IN("cornea_problem", ["Corneal oedema", "Corneal dystrophy", "Keratoconus"])),
    ],
  },

  // ---- Retina and vitreous ------------------------------------------------
  ophth_retina: {
    title: "Retina & Vitreous",
    fields: [
      M("retina_symptoms", "Presenting Symptoms", ["Flashes", "Floaters", "Curtain or shadow", "Sudden visual loss", "Visual distortion or metamorphopsia", NONE_DOCUMENTED]),
      I("symptom_onset", "Symptom Onset"),
      S("retinal_detachment", "Retinal Detachment", ["Not present", "Suspected — same-day review", "Rhegmatogenous — documented", "Tractional — documented", "Exudative — documented", NOT_ASSESSED]),
      S("retinal_break", "Retinal Break or Tear", ["None", "Lattice degeneration only", "Tear — treated", "Tear — untreated and documented", NOT_ASSESSED]),
      S("vitreous_haemorrhage", "Vitreous Haemorrhage", ["None", "Present — documented", NOT_ASSESSED]),
      S("vascular_occlusion", "Retinal Vascular Occlusion", ["Not applicable", "Central retinal artery occlusion", "Branch retinal artery occlusion", "Central retinal vein occlusion", "Branch retinal vein occlusion", NOT_DOCUMENTED]),
      M("retina_treatment", "Treatment at This Visit", ["Observation", "Laser retinopexy", "Panretinal photocoagulation", "Anti-VEGF injection", "Intravitreal steroid", "Vitrectomy", "None"]),
      S("retina_urgency", "Urgency of the Plan", ["Routine", "Expedited", "Same-day emergency", NOT_DOCUMENTED]),
      I("retina_review", "Review Interval or Date"),
    ],
  },

  // ---- Diabetic retinopathy ----------------------------------------------
  ophth_dr: {
    title: "Diabetic Retinopathy Assessment",
    fields: [
      S("dr_right", "Retinopathy Level — Right Eye (ICDR scale)", ["No apparent retinopathy", "Mild non-proliferative", "Moderate non-proliferative", "Severe non-proliferative", "Proliferative", "Not assessable"]),
      S("dr_left", "Retinopathy Level — Left Eye (ICDR scale)", ["No apparent retinopathy", "Mild non-proliferative", "Moderate non-proliferative", "Severe non-proliferative", "Proliferative", "Not assessable"]),
      S("dme_right", "Diabetic Macular Oedema — Right Eye", ["No macular oedema", "Non-centre-involving", "Centre-involving", "Not assessable"]),
      S("dme_left", "Diabetic Macular Oedema — Left Eye", ["No macular oedema", "Non-centre-involving", "Centre-involving", "Not assessable"]),
      I("hba1c", "HbA1c Documented", { placeholder: "%" }),
      S("systemic_control", "Systemic Risk Factor Review", ["Blood pressure documented as within target", "Blood pressure above target — documented", "Renal function reviewed", NOT_DOCUMENTED]),
      S("pregnancy", "Pregnancy Status", ["Not applicable", "Pregnant — shortened follow-up documented", NOT_DOCUMENTED]),
      M("dr_treatment", "Treatment at This Visit", ["Observation", "Intravitreal anti-VEGF", "Focal or grid laser", "Panretinal photocoagulation", "Vitrectomy", "None"]),
      S("dr_interval", "Documented Review Interval", ["4–6 weeks", "3 months", "6 months", "12 months", "Interval per retinopathy level", NOT_DOCUMENTED]),
      S("dr_referral", "Referral", ["Not indicated", "Referred for specialist retinal care", "Same-day referral — documented", NOT_DOCUMENTED]),
    ],
  },

  // ---- Macula -------------------------------------------------------------
  ophth_macular: {
    title: "Macular Disease",
    fields: [
      S("macular_diagnosis", "Macular Diagnosis", ["Not applicable", "Non-exudative age-related macular degeneration", "Neovascular age-related macular degeneration", "Diabetic macular oedema", "Macular oedema of another cause", "Epiretinal membrane", "Macular hole", "Central serous chorioretinopathy", "Myopic maculopathy", NOT_DOCUMENTED]),
      S("amd_category", "Age-Related Macular Degeneration Category", ["No AMD", "Early AMD", "Intermediate AMD", "Advanced AMD — non-exudative", "Advanced AMD — neovascular", NOT_DOCUMENTED]),
      M("amd_risk_factors", "Documented Risk Factors (AREDS severity scale)", ["Age 75 or older", "Large drusen", "Pigmentary change", "Current or former smoking", "Family history", "Advanced AMD in the fellow eye", NONE_DOCUMENTED], WHEN_IN("amd_category", ["Early AMD", "Intermediate AMD", "Advanced AMD — non-exudative"])),
      S("oct", "OCT at This Visit", ["Not performed", "Performed — intraretinal or subretinal fluid documented", "Performed — no fluid", NOT_DOCUMENTED]),
      S("macular_activity", "Disease Activity", ["Active neovascular disease", "Inactive — scar or dry", "Stable non-exudative disease", NOT_DOCUMENTED]),
      S("anti_vegf", "Anti-VEGF Treatment", ["Not applicable", "Initiated — loading course", "Continued — treat and extend", "Extended interval — documented", "Withheld — reason documented", NOT_DOCUMENTED]),
      N("injection_count", "Injections to Date"),
      I("last_injection", "Date of Last Injection"),
      S("amsler", "Home Monitoring", ["Amsler grid advised — documented", "Not advised", NOT_DOCUMENTED]),
      S("macular_interval", "Review Interval", ["4 weeks", "6–8 weeks", "3 months", "6 months", "12 months", NOT_DOCUMENTED]),
    ],
  },

  // ---- Neuro-ophthalmology ------------------------------------------------
  ophth_neuro: {
    title: "Neuro-Ophthalmology Assessment",
    fields: [
      M("neuro_problem", "Neuro-Ophthalmic Problem", ["Optic neuritis", "Optic disc swelling or papilloedema", "Ischaemic optic neuropathy", "Compressive optic neuropathy", "Traumatic optic neuropathy", "Third nerve palsy", "Sixth nerve palsy", "Horner syndrome", "Visual field defect", "Nystagmus", "Diplopia", NONE_DOCUMENTED]),
      S("neuro_disc", "Optic Disc", ["Normal", "Oedema — documented", "Pallor", "Atrophy", NOT_ASSESSED]),
      S("field_pattern", "Visual Field Pattern", ["Not performed", "Central scotoma", "Altitudinal defect", "Bitemporal hemianopia", "Homonymous hemianopia", "Enlarged blind spot", "Generalised depression", NOT_DOCUMENTED]),
      S("neuro_pupil", "Pupil in Neuro-Ophthalmic Context", ["Normal", "Afferent defect documented", "Pupil-involving third nerve palsy", "Pupil-sparing third nerve palsy", NOT_ASSESSED]),
      M("gca_features", "Giant Cell Arteritis Features", ["Age 50 or older", "Jaw claudication", "Scalp tenderness", "Visual loss", "Diplopia", "Polymyalgia symptoms", NONE_DOCUMENTED]),
      S("inflammatory_markers", "Inflammatory Markers", ["Taken — result documented", "Not taken", NOT_DOCUMENTED], WHEN_IN("gca_features", ["Age 50 or older"])),
      S("gca_steroid", "Corticosteroid for Suspected Giant Cell Arteritis", ["Not indicated", "Started the same day — documented", "Discussed and deferred — documented", NOT_DOCUMENTED], WHEN_IN("gca_features", ["Age 50 or older"])),
      S("neuro_imaging", "Imaging", ["Not indicated", "CT arranged", "MRI arranged — with contrast", "Already performed — result documented", NOT_DOCUMENTED]),
      S("headache", "Headache", ["None", "Present — no red flags documented", "Present — red flags documented", NOT_DOCUMENTED]),
      S("neuro_urgency", "Urgency", ["Routine", "Expedited", "Same-day emergency", NOT_DOCUMENTED]),
      I("neuro_destination", "Referred To / Discussed With"),
    ],
  },

  // ---- Paediatric and strabismus -----------------------------------------
  ophth_peds: {
    title: "Paediatric Ophthalmology & Strabismus",
    fields: [
      S("age_group", "Age Group", ["Neonate", "Infant", "Child", "Adolescent", NOT_DOCUMENTED]),
      S("fixation", "Fixation Preference", ["Central, steady and maintained", "Unsteady or not maintained", "Not assessable", NOT_ASSESSED]),
      S("red_reflex", "Red Reflex", ["Normal in both eyes", "Abnormal — documented", NOT_ASSESSED]),
      S("paediatric_vision_method", "Vision Test Used", ["Preferential looking", "Cardiff cards", "Kay pictures", "Snellen", "LogMAR", "Not testable", NOT_DOCUMENTED]),
      I("paediatric_acuity_right", "Acuity — Right Eye"),
      I("paediatric_acuity_left", "Acuity — Left Eye"),
      S("squint", "Ocular Alignment", ["No strabismus", "Esotropia", "Exotropia", "Hypertropia", "Intermittent — documented", NOT_ASSESSED]),
      S("amblyopia", "Amblyopia", ["None", "Right eye", "Left eye", "Bilateral", NOT_ASSESSED]),
      S("amblyopia_type", "Amblyopia Type", ["Refractive", "Strabismic", "Deprivation", "Mixed", NOT_DOCUMENTED], WHEN_IN("amblyopia", ["Right eye", "Left eye", "Bilateral"])),
      S("occlusion", "Amblyopia Therapy", ["Patching — hours documented", "Atropine penalisation", "Refractive correction alone", NOT_DOCUMENTED], WHEN_IN("amblyopia", ["Right eye", "Left eye", "Bilateral"])),
      S("occlusion_compliance", "Therapy Compliance", ["Good", "Partial — reasons documented", NOT_DOCUMENTED], WHEN_IN("amblyopia", ["Right eye", "Left eye", "Bilateral"])),
      S("rop_screening", "Retinopathy of Prematurity Screening", ["Not applicable — not premature", "Due — arranged", "Performed — findings documented", "Overdue — documented", "Risk factors present — screening criteria discussed", NOT_DOCUMENTED]),
      I("rop_detail", "ROP Zone, Stage, Extent and Plus Disease (ICROP3 terminology)", WHEN("rop_screening", "Performed — findings documented")),
      S("paediatric_glasses", "Refractive Correction", ["Prescribed — documented", "Not indicated", "Advised — documented", NOT_DOCUMENTED]),
      S("paediatric_referral", "Referral", ["Not indicated", "Referred — paediatric ophthalmology", "Same-day referral — documented", NOT_DOCUMENTED]),
    ],
  },

  // ---- Refraction ---------------------------------------------------------
  ophth_refractive: {
    title: "Refraction & Refractive Surgery",
    fields: [
      S("refractive_error", "Refractive Error", ["Myopia", "Hyperopia", "Astigmatism", "Presbyopia", "Mixed", NOT_DOCUMENTED]),
      S("refraction_type", "Refraction Technique", ["Manifest", "Cycloplegic — agent documented", "Retinoscopy", NOT_DOCUMENTED]),
      I("sphere_right", "Sphere — Right Eye"),
      I("sphere_left", "Sphere — Left Eye"),
      I("cylinder_right", "Cylinder — Right Eye"),
      I("cylinder_left", "Cylinder — Left Eye"),
      I("keratometry", "Keratometry"),
      N("pachymetry", "Central Corneal Thickness", { unit: "µm", min: 300, max: 900 }),
      S("topography", "Corneal Topography", ["Not performed", "Performed — regular", "Performed — irregular or ectasia suspected", NOT_DOCUMENTED]),
      S("dry_eye_screen", "Ocular Surface Assessment Before Refractive Surgery", ["Assessed — documented", "Not assessed", "Not applicable"]),
      S("refractive_surgery", "Refractive Surgery", ["Not discussed", "Discussed — counselling documented", "Contraindicated — documented", "Scheduled"]),
      S("refractive_surgery_eligibility", "Eligibility Assessment", ["Eligible", "Eligible with caution — documented", "Not eligible", NOT_DOCUMENTED], WHEN_IN("refractive_surgery", ["Discussed — counselling documented", "Scheduled"])),
      S("correction", "Current Correction", ["Spectacles", "Contact lenses", "None", NOT_DOCUMENTED]),
      I("refraction_review", "Review Arranged"),
    ],
  },

  // ---- Trauma -------------------------------------------------------------
  ophth_trauma: {
    title: "Ocular Trauma Assessment",
    fields: [
      S("trauma_mechanism", "Mechanism", ["Blunt", "Penetrating", "Perforating", "Intraocular foreign body", "Chemical", "Thermal", "Radiation", NOT_DOCUMENTED]),
      S("bett_globe", "Globe Status (Birmingham Eye Trauma Terminology)", ["Closed globe", "Open globe", NOT_DOCUMENTED]),
      S("trauma_eye", "Eye Injured", ["Right", "Left", "Bilateral", NOT_DOCUMENTED]),
      M("open_globe_signs", "Signs Assessed", ["Full-thickness wound", "Flat anterior chamber", "Peaked pupil", "Positive Seidel test", "Hypotony", "Uveal prolapse", "None of these"], WHEN("bett_globe", "Open globe")),
      S("chemical_agent", "Chemical Agent", ["Alkali", "Acid", "Other — documented"], WHEN("trauma_mechanism", "Chemical")),
      S("irrigation", "Irrigation", ["Started immediately — documented", "Started after a delay — time documented", "Not documented"], WHEN("trauma_mechanism", "Chemical")),
      S("trauma_va", "Visual Acuity at Presentation", ["6/12 or better", "6/18 to 6/60", "Counting fingers to 1/200", "Hand movements to light perception", "No light perception", NOT_ASSESSED]),
      N("trauma_iop", "Intraocular Pressure at Presentation", { unit: "mmHg", min: 0, max: 80 }),
      S("trauma_rapd", "Afferent Pupillary Defect", ["Absent", "Present", "Not assessable"]),
      S("trauma_endophthalmitis", "Signs of Infection", ["Absent", "Present — documented", NOT_ASSESSED]),
      S("tetanus", "Tetanus Prophylaxis", ["Up to date — documented", "Booster given", NOT_DOCUMENTED]),
      S("eye_shield", "Eye Protection", ["Rigid shield applied", "Not applied", "Not indicated"]),
      S("trauma_imaging", "Imaging", ["Not indicated", "CT orbits performed", "CT arranged", NOT_DOCUMENTED]),
      S("trauma_npo", "Nil by Mouth", ["Yes — from the documented time", "Not required", NOT_DOCUMENTED], WHEN("bett_globe", "Open globe")),
      S("trauma_disposition", "Disposition", ["Emergency surgery arranged", "Admitted", "Reviewed the same day", "Discharged with documented review", NOT_DOCUMENTED]),
    ],
  },

  // ---- Infection ----------------------------------------------------------
  ophth_infection: {
    title: "Ocular Infection Assessment",
    fields: [
      S("infection_site", "Site", ["Conjunctiva", "Cornea", "Anterior chamber or vitreous", "Orbit", "Eyelid", "Orbital implant or socket", NOT_DOCUMENTED]),
      S("infection_type", "Organism Category", ["Bacterial", "Viral", "Fungal", "Protozoal", "Not yet established"]),
      S("infection_contact_lens", "Contact Lens Wear", ["None", "Soft lens", "Rigid gas permeable", NOT_DOCUMENTED]),
      S("sampling", "Microbiological Sampling", ["Performed — result documented", "Performed — result pending", "Not performed — reason documented", NOT_DOCUMENTED]),
      S("antimicrobial", "Antimicrobial Treatment", ["Topical", "Intravitreal", "Systemic", "Topical and systemic", "None documented"]),
      S("infection_steroid", "Steroid Use", ["Not used", "Used — documented", "Deferred until the infection is controlled", NOT_DOCUMENTED]),
      S("sight_threatening", "Sight-Threatening", ["Yes — documented", "No — documented", NOT_DOCUMENTED]),
      S("infection_review", "Review Within", ["Same day", "24 hours", "48 hours", "1 week", NOT_DOCUMENTED]),
      S("isolation", "Infection Control Advice", ["Contact precautions advised — documented", "Not applicable", NOT_DOCUMENTED]),
      S("infection_escalation", "Escalation", ["Cornea or retina specialist informed", "Admission arranged", "Not indicated", NOT_DOCUMENTED]),
    ],
  },

  // ---- Time-critical presentation ----------------------------------------
  ophth_emergency: {
    title: "Time-Critical Ophthalmic Presentation",
    fields: [
      M("emergency_presentation", "Presentation", ["Sudden painless visual loss", "Central retinal artery occlusion", "Acute angle closure", "Retinal detachment", "Endophthalmitis", "Chemical injury", "Open globe", "Suspected giant cell arteritis", "Orbital cellulitis", "Third nerve palsy with pupil involvement", NONE_DOCUMENTED]),
      I("emergency_onset", "Time of Onset"),
      S("emergency_seen", "Time to Ophthalmological Review", ["Seen immediately", "Within 1 hour", "Within 24 hours", NOT_DOCUMENTED]),
      M("immediate_action", "Immediate Action Documented", ["Topical ocular hypotensive therapy", "Systemic ocular hypotensive therapy", "Anterior chamber paracentesis — documented", "Ocular massage — documented", "Copious irrigation", "Systemic corticosteroid started the same day", "Intravenous antibiotics", "Rigid shield and nil by mouth", "Surgical team informed", NONE_DOCUMENTED]),
      S("emergency_iv_access", "Intravenous Access", ["Obtained", "Not required", NOT_DOCUMENTED]),
      S("emergency_npo", "Nil by Mouth", ["Yes — from the documented time", "Not required", NOT_DOCUMENTED]),
      S("emergency_consent", "Consent for Emergency Intervention", ["Documented with the rationale", "Not documented"]),
      S("emergency_escalation", "Escalation", ["Consultant ophthalmologist informed", "On-call ophthalmologist informed", "Transfer arranged", NOT_DOCUMENTED]),
      I("emergency_destination", "Destination"),
      I("emergency_referral_time", "Time Referred"),
      I("emergency_followup", "Follow-Up Arranged"),
    ],
  },

  // ---- Intravitreal injection --------------------------------------------
  ophth_injection: {
    title: "Intravitreal Injection Record",
    fields: [
      S("injection_agent", "Agent", ["Aflibercept", "Ranibizumab", "Bevacizumab", "Faricimab", "Brolucizumab", "Dexamethasone implant", "Triamcinolone", "Other — documented", NOT_DOCUMENTED]),
      S("injection_eye", "Eye", ["Right", "Left", "Bilateral", NOT_DOCUMENTED]),
      S("injection_consent", "Consent", ["Written informed consent documented", NOT_DOCUMENTED]),
      S("injection_asepsis", "Asepsis", ["Topical anaesthetic, povidone-iodine and eyelid speculum documented", "Partial — documented", NOT_DOCUMENTED]),
      N("injection_iop", "Post-Injection Intraocular Pressure", { unit: "mmHg", min: 0, max: 80 }),
      S("injection_perfusion", "Optic Nerve Perfusion After Injection", ["Confirmed", NOT_DOCUMENTED]),
      S("injection_antibiotic", "Post-Injection Antibiotic", ["Not routinely given — documented", "Given — documented", NOT_DOCUMENTED]),
      S("endophthalmitis_advice", "Endophthalmitis Warning Signs Explained", ["Documented", NOT_DOCUMENTED]),
      I("injection_next", "Next Injection Due"),
      S("injection_complication", "Complication", ["None", "Immediate intraocular pressure rise", "Subconjunctival haemorrhage", "Anterior chamber reaction", "Other — documented"]),
    ],
  },

  // ---- Surgery ------------------------------------------------------------
  ophth_surgery: {
    title: "Ophthalmic Surgical Record",
    fields: [
      S("surgery_eye", "Eye Operated", ["Right — confirmed at time-out", "Left — confirmed at time-out", NOT_DOCUMENTED]),
      S("surgery_timeout", "Time-Out", ["Performed — identity, eye, procedure and consent verified", NOT_DOCUMENTED]),
      M("surgery_procedures", "Procedures Performed", ["Phacoemulsification", "Intraocular lens implantation", "Trabeculectomy", "Pars plana vitrectomy", "Scleral buckle", "Strabismus surgery", "Pterygium excision", "Corneal transplantation", "Laser — documented", "Other — documented"]),
      S("surgery_anaesthesia", "Anaesthesia", ["Topical", "Local infiltration", "Peribulbar or retrobulbar block", "General", NOT_DOCUMENTED]),
      S("iol_type", "Intraocular Lens Implanted", ["Not applicable", "Foldable — in the bag", "Foldable — sulcus", "Rigid", "Scleral fixated", NOT_DOCUMENTED]),
      I("iol_detail", "Implant Detail (model, power, serial)", WHEN_IN("iol_type", ["Foldable — in the bag", "Foldable — sulcus", "Rigid", "Scleral fixated"])),
      S("viscoelastic", "Viscoelastic Removed", ["Yes", "No — documented", NOT_DOCUMENTED]),
      M("surgery_complications", "Intra-Operative Complications", ["None", "Capsule tear", "Posterior capsule rupture", "Vitreous loss", "Dropped nucleus", "Endothelial touch", "Zonular dialysis", "Suprachoroidal haemorrhage", "Expulsive haemorrhage", "Other — documented"]),
      T("complication_management", "Complication Management", WHEN_IN("surgery_complications", ["Capsule tear", "Posterior capsule rupture", "Vitreous loss", "Dropped nucleus", "Endothelial touch", "Zonular dialysis", "Suprachoroidal haemorrhage", "Expulsive haemorrhage", "Other — documented"])),
      S("wound_closure", "Wound Closure", ["Sutureless — hydrated", "Sutured — documented", NOT_DOCUMENTED]),
      S("intracameral_antibiotic", "Intracameral Antibiotic", ["Given — documented", "Not given — documented", NOT_DOCUMENTED]),
      S("instrument_count", "Counts", ["Correct", "Discrepancy — documented", NOT_DOCUMENTED]),
      T("surgery_postop_plan", "Immediate Post-Operative Plan"),
    ],
  },

  // ---- Post-operative monitoring -----------------------------------------
  ophth_postop: {
    title: "Post-Operative Monitoring",
    fields: [
      S("postop_timepoint", "Post-Operative Timepoint", ["Day 0", "Day 1", "Week 1", "Month 1", "Month 3", "Other — documented", NOT_DOCUMENTED]),
      S("postop_eye", "Eye", ["Right", "Left", "Bilateral", NOT_DOCUMENTED]),
      S("postop_va", "Post-Operative Visual Acuity", ["6/12 or better", "6/18 to 6/60", "Counting fingers to 1/200", "Hand movements to light perception", "No light perception", NOT_ASSESSED]),
      N("postop_iop", "Post-Operative Intraocular Pressure", { unit: "mmHg", min: 0, max: 80 }),
      S("postop_wound", "Wound", ["Sealed", "Seidel positive — documented", "Wound dehiscence — documented", NOT_ASSESSED]),
      S("postop_ac", "Anterior Chamber", ["Formed and quiet", "Shallow", "Flat", "Hypopyon", "Fibrin", "Hyphaema", NOT_ASSESSED]),
      S("postop_cornea", "Cornea", ["Clear", "Oedema — documented", "Striae", NOT_ASSESSED]),
      S("postop_iol", "Intraocular Lens Position", ["Not applicable", "Centred", "Subluxated", "Dislocated", NOT_ASSESSED]),
      S("postop_retina", "Retina", ["Attached", "Detached — documented", "Not assessable", NOT_ASSESSED]),
      S("postop_drops", "Post-Operative Drops", ["Steroid and antibiotic", "Steroid only", "Fixed combination", "None documented", NOT_DOCUMENTED]),
      T("postop_taper", "Taper and Stop Dates"),
      S("postop_pain", "Pain", ["None", "Mild", "Moderate — reviewed", "Severe — reviewed the same day"]),
      S("postop_red_flags", "Warning Signs Explained", ["Documented", NOT_DOCUMENTED]),
      I("postop_review", "Next Review"),
    ],
  },

  // ---- Discharge ----------------------------------------------------------
  ophth_discharge: {
    title: "Discharge & Follow-Up Bundle",
    fields: [
      T("discharge_eye_status", "Eye Status at Discharge"),
      S("discharge_drops", "Drop Regimen", ["Documented with stop dates", "Partially documented", NOT_DOCUMENTED]),
      S("discharge_activity", "Activity Advice", ["Documented", NOT_DOCUMENTED]),
      S("discharge_driving", "Driving Advice", ["Advised not to drive — documented", "Discussed — no restriction documented", NOT_DOCUMENTED]),
      T("discharge_warning_signs", "Warning Signs Explained (return the same day)"),
      S("discharge_medication", "Medication Reconciliation", ["Documented", NOT_DOCUMENTED]),
      S("discharge_transport", "Transport and Support", ["Arranged", "Not required", NOT_DOCUMENTED]),
      I("discharge_followup_who", "Follow-Up With"),
      I("discharge_followup_when", "Follow-Up Date"),
      I("discharge_clinician", "Clinician Responsible"),
    ],
  },

  // ---- Test reporting -----------------------------------------------------
  ophth_imaging_report: {
    title: "Imaging / Diagnostic Test Report",
    fields: [
      S("test_performed", "Test Performed", ["Visual field", "OCT — macula", "OCT — retinal nerve fibre layer", "OCT — anterior segment", "Fundus photography", "Fluorescein angiography", "Indocyanine green angiography", "B-scan ultrasound", "Biometry", "Corneal topography", "Pachymetry", NOT_DOCUMENTED]),
      S("test_eye", "Eye", ["Right", "Left", "Both", NOT_DOCUMENTED]),
      S("test_reliability", "Test Reliability", ["Good", "Artefact limited — documented", "Not assessable", "Not applicable"]),
      I("test_key_measure", "Key Measurement (e.g. MD, PSD, central subfield thickness)"),
      T("test_findings", "Findings"),
      S("test_comparison", "Comparison With Previous Test", ["No previous test", "Stable compared with previous", "Progressed compared with previous", "Improved compared with previous", "Not comparable"]),
      I("test_previous_date", "Previous Test Date", WHEN_IN("test_comparison", ["Stable compared with previous", "Progressed compared with previous", "Improved compared with previous"])),
      T("test_interpretation", "Interpretation"),
      S("test_action", "Action From This Test", ["Continue monitoring", "Treatment change arranged", "Referral arranged", NOT_DOCUMENTED]),
      I("test_next", "Next Test Due"),
    ],
  },

  // ---- Referral -----------------------------------------------------------
  ophth_referral_block: {
    title: "Referral & Escalation Record",
    fields: [
      I("referral_destination", "Referred To"),
      S("referral_urgency", "Urgency", ["Routine", "Expedited", "Same-day emergency"]),
      M("sight_threatening_features", "Sight-Threatening Features Present", ["Sudden visual loss", "Suspected retinal detachment", "Suspected endophthalmitis", "Suspected giant cell arteritis", "Open globe", "Chemical injury", "Acute angle closure", "Orbital cellulitis", NONE_DOCUMENTED]),
      T("referral_question", "Clinical Question for the Receiving Service"),
      T("referral_done", "What Has Already Been Done"),
      M("referral_investigations", "Investigations Available to the Receiving Service", ["Visual acuity", "Intraocular pressure", "Dilated fundus examination", "Visual field", "OCT", "Corneal topography", "Imaging", "Microbiology specimen taken", "None"]),
      I("referral_time", "Time Referred"),
      I("referral_informed", "Clinician Informed at the Receiving Service"),
      S("referral_patient_informed", "Patient Informed of the Urgency", ["Documented", NOT_DOCUMENTED]),
    ],
  },
};

export const OPHTH_CONDITION_BLOCK_COUNT = Object.keys(OPHTH_CONDITION_BLOCKS).length;