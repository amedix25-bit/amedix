// Ophthalmology — advisory safety prompts.
//
// Built only from what THIS note documents. A prompt never blocks saving, never
// changes a diagnosis, never orders anything and never overrides the clinician:
// it names what the cited guidance requires to be recorded, and the clinician
// marks the action documented — or records why the prompt does not apply.
//
// Levels:
//   same_day   — the documented findings describe a sight-threatening situation
//                whose stated response is missing or later than it should be.
//   documented — something the cited guidance requires to be recorded is blank.
//   advisory   — a quality or follow-up gap worth closing before the note is
//                signed, with no time-critical element.

import { OPHTH_REFERENCES } from "./ophthalmologyReferences.js";
import { ophthFind, ophthFindList } from "./ophthalmologyBlocks.js";
import { asObject, str, isBlank } from "./ophthFieldKit.js";

const has = (list, ...needles) =>
  (Array.isArray(list) ? list : []).some((item) => needles.some((n) => new RegExp(n, "i").test(str(item))));

const anyOf = (value, ...needles) => needles.some((n) => new RegExp(n, "i").test(str(value)));

export const buildOphthSafetyPrompts = ({ values } = {}) => {
  const v = values || {};
  const f = (block, key) => ophthFind(v, block, key);
  const l = (block, key) => ophthFindList(v, block, key);

  const prompts = [];
  const add = (key, level, title, basis, action, source) =>
    prompts.push({ key, level, title, basis, action, source });

  // ---- Sight-threatening infection ---------------------------------------
  const infectionInEye = anyOf(f("ophth_infection", "infection_site"), "Anterior chamber or vitreous");
  const hypopyon = anyOf(f("ophth_postop", "postop_ac"), "Hypopyon") || anyOf(f("ophth_anterior", "anterior_chamber"), "Hypopyon");
  const injectionReaction = anyOf(f("ophth_injection", "injection_complication"), "Anterior chamber reaction");
  if (infectionInEye || hypopyon || injectionReaction) {
    const escalated = anyOf(f("ophth_infection", "infection_escalation"), "specialist informed", "Admission arranged");
    const sampled = anyOf(f("ophth_infection", "sampling"), "Performed");
    add(
      "endophthalmitis_same_day",
      "same_day",
      "Possible endophthalmitis — same-day specialist assessment and sampling",
      "The documented findings (vitreous or anterior chamber infection, a hypopyon, or an anterior chamber reaction after injection) describe possible endophthalmitis, which is managed as an emergency.",
      escalated && sampled
        ? "Escalation and sampling are documented. Confirm the treatment given, the intravitreal agent and the review interval are also recorded."
        : "Record the same-day ophthalmology review, vitreous or aqueous sampling before treatment, the intravitreal antibiotic given, and who was informed.",
      OPHTH_REFERENCES.evs,
    );
  }

  // ---- Acute angle closure ------------------------------------------------
  if (has(l("ophth_emergency", "emergency_presentation"), "Acute angle closure")) {
    const lowered = has(l("ophth_emergency", "immediate_action"), "hypotensive", "paracentesis", "irrigation");
    add(
      "acute_angle_closure",
      lowered ? "documented" : "same_day",
      "Acute angle closure — immediate pressure lowering and definitive plan",
      "An acute angle-closure attack is sight-threatening while the pressure remains high; the documented actions should show the pressure-lowering treatment started, not only the diagnosis.",
      lowered
        ? "Record the fellow-eye plan (prophylactic iridotomy or observation with the reason) and the review interval."
        : "Document the topical and systemic pressure-lowering treatment, the definitive plan (laser iridotomy or surgery) and the fellow-eye decision.",
      OPHTH_REFERENCES.aao_pacg,
    );
  }

  // ---- Retinal artery occlusion ------------------------------------------
  if (has(l("ophth_emergency", "emergency_presentation"), "Central retinal artery occlusion") || anyOf(f("ophth_retina", "vascular_occlusion"), "artery occlusion")) {
    const seen = f("ophth_emergency", "emergency_seen");
    add(
      "retinal_artery_occlusion",
      anyOf(seen, "Within 24 hours") || isBlank(seen) ? "same_day" : "documented",
      "Retinal artery occlusion — time-critical pathway and systemic work-up",
      "A retinal artery occlusion is treated as an ophthalmic emergency and as a marker of systemic vascular risk, so both the timing of assessment and the systemic investigation belong in the record.",
      "Document the time of onset, the time the patient was seen, and the systemic work-up arranged (carotid and cardiac assessment, blood pressure, diabetes and lipid assessment) with who was informed.",
      OPHTH_REFERENCES.aao_retinal_occlusion,
    );
  }

  // ---- Giant cell arteritis ----------------------------------------------
  const gcaFeatures = l("ophth_neuro", "gca_features");
  const gcaConcern = has(gcaFeatures, "Age 50", "Jaw claudication", "Scalp tenderness", "Visual loss", "Diplopia");
  if (gcaConcern) {
    const steroid = f("ophth_neuro", "gca_steroid");
    add(
      "gca_steroid_same_day",
      anyOf(steroid, "Started the same day") ? "documented" : "same_day",
      "Suspected giant cell arteritis — corticosteroid the same day",
      "Where giant cell arteritis is suspected with visual symptoms, vision in the second eye is at risk until corticosteroid treatment is started; the record must show that decision and its timing.",
      anyOf(steroid, "Started the same day")
        ? "Record the inflammatory markers, the temporal artery imaging or biopsy arranged, and the follow-up of the second eye."
        : "Document whether corticosteroid was started today, at what dose and by whom — or the documented clinical reason it was not.",
      OPHTH_REFERENCES.bsr_gca,
    );
  }

  // ---- Open globe and chemical injury ------------------------------------
  if (anyOf(f("ophth_trauma", "bett_globe"), "Open globe")) {
    const shielded = anyOf(f("ophth_trauma", "eye_shield"), "Rigid shield");
    const npo = anyOf(f("ophth_trauma", "trauma_npo"), "Yes");
    const plan = !isBlank(f("ophth_trauma", "trauma_disposition"));
    add(
      "open_globe_protection",
      shielded && npo && plan ? "documented" : "same_day",
      "Open globe — protection, fasting and surgical plan",
      "An open globe is a surgical emergency: pressure on the eye, oral intake and the time to theatre all change the outcome and must be visible in the record.",
      shielded && npo && plan
        ? "Confirm the tetanus status, the antibiotic given and the time the surgical team was informed are recorded."
        : "Record the rigid shield, the nil-by-mouth instruction with its time, the antibiotic, the tetanus status and the surgical plan or transfer.",
      OPHTH_REFERENCES.bett,
    );
  }

  if (anyOf(f("ophth_trauma", "trauma_mechanism"), "Chemical")) {
    const irrigated = anyOf(f("ophth_trauma", "irrigation"), "Started immediately");
    add(
      "chemical_injury_irrigation",
      irrigated ? "documented" : "same_day",
      "Chemical injury — immediate irrigation documented",
      "In a chemical injury the volume and timing of irrigation decide the outcome; an unrecorded irrigation cannot be distinguished from one that never happened.",
      irrigated
        ? "Record the agent, the pH after irrigation, the surface findings and the review interval."
        : "Document when irrigation started, for how long it continued, the pH before and after, and the surface findings afterwards.",
      OPHTH_REFERENCES.bett,
    );
  }

  // ---- Retinal detachment -------------------------------------------------
  if (anyOf(f("ophth_retina", "retinal_detachment"), "Suspected", "Rhegmatogenous")) {
    const urgency = f("ophth_retina", "retina_urgency");
    add(
      "retinal_detachment_urgency",
      anyOf(urgency, "Same-day") ? "documented" : "same_day",
      "Retinal detachment — same-day surgical assessment",
      "A suspected or established retinal detachment threatens the macula until it is repaired, so the urgency and the referral must both be recorded.",
      anyOf(urgency, "Same-day")
        ? "Record the macula status (attached or detached), the surgical plan and the advice given to the patient."
        : "Record the macula status, the same-day referral to vitreoretinal care and the advice given while waiting.",
      OPHTH_REFERENCES.aao_pvd,
    );
  }

  // ---- Third nerve palsy --------------------------------------------------
  if (has(l("ophth_neuro", "neuro_problem"), "Third nerve palsy") && anyOf(f("ophth_neuro", "neuro_pupil"), "Pupil-involving")) {
    const imaged = anyOf(f("ophth_neuro", "neuro_imaging"), "arranged", "performed");
    add(
      "third_nerve_pupil_involved",
      imaged ? "documented" : "same_day",
      "Pupil-involving third nerve palsy — urgent imaging",
      "A pupil-involving third nerve palsy raises the possibility of a compressive lesion, including an aneurysm, and is investigated urgently rather than at routine interval.",
      imaged
        ? "Record who was informed, the imaging result when available, and the review interval."
        : "Record the urgent imaging arranged (CT or MR angiography as the receiving service advises), who was informed and when.",
      OPHTH_REFERENCES.nanos_on,
    );
  }

  // ---- Leucocoria and ROP ------------------------------------------------
  if (anyOf(f("ophth_peds", "red_reflex"), "Abnormal")) {
    add(
      "abnormal_red_reflex",
      "same_day",
      "Abnormal red reflex — urgent paediatric ophthalmology assessment",
      "An abnormal red reflex in a child requires urgent assessment for retinoblastoma and other sight- or life-threatening causes; it is never left to a routine interval.",
      "Record who was informed, the same-day or next-day referral made, and the safeguarding or family discussion documented.",
      OPHTH_REFERENCES.aao_pediatric,
    );
  }

  if (anyOf(f("ophth_peds", "rop_screening"), "Overdue")) {
    add(
      "rop_overdue",
      "documented",
      "Retinopathy of prematurity screening overdue",
      "Screening intervals in retinopathy of prematurity are set by the infant's postmenstrual age and risk, and a missed interval can allow treatable disease to progress.",
      "Record the screening now arranged, the date due, the postmenstrual age and who is responsible for attending.",
      OPHTH_REFERENCES.aao_rop,
    );
  }

  // ---- Amblyopia ----------------------------------------------------------
  const amblyopic = ["Right eye", "Left eye", "Bilateral"].includes(str(f("ophth_peds", "amblyopia")));
  if (amblyopic && isBlank(f("ophth_peds", "occlusion"))) {
    add(
      "amblyopia_no_plan",
      "documented",
      "Amblyopia — treatment and compliance plan",
      "Amblyopia treatment is only as effective as the documented regimen and the review that checks it: refractive correction, occlusion or penalisation, and the compliance plan.",
      "Record the therapy chosen with its hours or frequency, what the family was told, and the review interval.",
      OPHTH_REFERENCES.aao_amblyopia,
    );
  }

  // ---- Glaucoma -----------------------------------------------------------
  const glaucomaSet = !isBlank(f("ophth_glaucoma", "glaucoma_type"));
  if (glaucomaSet) {
    const targetR = Number(f("ophth_iop", "iop_target_right"));
    const targetL = Number(f("ophth_iop", "iop_target_left"));
    const iopR = Number(f("ophth_iop", "iop_right"));
    const iopL = Number(f("ophth_iop", "iop_left"));
    const aboveTarget = (targetR && iopR && iopR > targetR) || (targetL && iopL && iopL > targetL);
    const decision = f("ophth_glaucoma", "treatment_decision");
    if (aboveTarget && !anyOf(decision, "Escalate", "Change", "surgery", "Laser")) {
      add(
        "glaucoma_above_target",
        "documented",
        "Pressure above the documented target without a documented plan",
        "A target pressure is only useful when the measured pressure is compared with it and the response is recorded.",
        "Record whether treatment is escalated, the reason a higher pressure is accepted, or the monitoring planned.",
        OPHTH_REFERENCES.aao_poag,
      );
    }

    if (isBlank(f("ophth_glaucoma", "vf_reliability")) || anyOf(f("ophth_glaucoma", "vf_reliability"), "Not tested")) {
      add(
        "glaucoma_no_field",
        "advisory",
        "No visual field recorded for a patient with glaucoma",
        "Structural and functional assessment are both needed to stage glaucoma and to detect progression; a note with disc findings and no field cannot show either.",
        "Record the field performed, or the documented reason it is not yet indicated or not possible.",
        OPHTH_REFERENCES.aao_poag,
      );
    }

    if (anyOf(f("ophth_glaucoma", "progression"), "Possible", "Likely") && isBlank(f("ophth_glaucoma", "progression_basis"))) {
      add(
        "glaucoma_progression_basis",
        "documented",
        "Progression recorded without the evidence it was judged from",
        "A statement of progression changes treatment; it must name the tests compared and the interval they cover.",
        "Record the serial fields, OCT retinal nerve fibre layer or disc photographs compared, with their dates.",
        OPHTH_REFERENCES.aao_poag,
      );
    }

    if (anyOf(f("ophth_glaucoma", "adherence"), "Partial") && l("ophth_glaucoma", "adherence_detail").length === 0) {
      add(
        "glaucoma_adherence_detail",
        "advisory",
        "Partial adherence documented without its cause",
        "Adherence is the commonest reason a treated pressure rises; the documented cause decides whether the answer is education, simplification or a different treatment.",
        "Record the reason (cost, side effects, regimen complexity, missed doses) and what was agreed with the patient.",
        OPHTH_REFERENCES.aao_poag,
      );
    }
  }

  // ---- Cataract and surgery ----------------------------------------------
  if (anyOf(f("ophth_cataract", "cataract_indication"), "Visual disability")) {
    const biometry = f("ophth_cataract", "biometry");
    if (!anyOf(biometry, "Performed")) {
      add(
        "cataract_no_biometry",
        "documented",
        "Surgical indication recorded without biometry and lens power",
        "Cataract surgery cannot be planned without the axial length and keratometry that set the intraocular lens power, and the chosen formula and target refraction belong in the record.",
        "Record the biometry, the lens power calculated, the formula and the target refraction — or the documented reason surgery is not yet being planned.",
        OPHTH_REFERENCES.aao_cataract,
      );
    }
  }

  if (anyOf(f("ophth_cataract", "alpha_antagonist"), "Tamsulosin", "Other alpha-1")) {
    add(
      "ifis_risk",
      "documented",
      "Alpha-1 antagonist — floppy iris risk documented before surgery",
      "Alpha-1 antagonist use is associated with intra-operative floppy iris syndrome; the surgical plan should show the risk was known and how it is being managed.",
      "Record the medication, whether the surgeon and the patient were informed, and the intra-operative measures planned.",
      OPHTH_REFERENCES.aao_cataract,
    );
  }

  if (anyOf(f("ophth_cataract", "antithrombotic"), "Antiplatelet", "Anticoagulant", "Both") && isBlank(f("ophth_cataract", "antithrombotic_plan"))) {
    add(
      "cataract_antithrombotic_plan",
      "documented",
      "Antithrombotic therapy without a peri-operative plan",
      "Whether an antithrombotic is continued or held is a shared decision with the prescriber, and the decision has to be visible before the operation.",
      "Record the decision, who agreed it, and the restart instruction.",
      OPHTH_REFERENCES.aao_cataract,
    );
  }

  // ---- Cornea -------------------------------------------------------------
  if (has(l("ophth_cornea", "cornea_problem"), "Bacterial keratitis", "Fungal keratitis", "Corneal ulcer")) {
    const sampled = anyOf(f("ophth_cornea", "scraping"), "Performed");
    add(
      "corneal_ulcer_sampling",
      "documented",
      "Corneal ulcer — sampling and the antibiotic plan",
      "In a sight-threatening corneal ulcer the organism guides treatment, so sampling before treatment and the antibiotic regimen both belong in the record.",
      sampled
        ? "Confirm the antibiotic regimen, the frequency, the review within 24–48 hours and the contact-lens advice are recorded."
        : "Record the corneal sampling performed (or the documented reason it was not) and the antibiotic regimen started.",
      OPHTH_REFERENCES.aao_bacterial_ulcer,
    );

    if (!sampled && anyOf(f("ophth_cornea", "steroid"), "Prescribed")) {
      add(
        "steroid_before_culture",
        "advisory",
        "Topical steroid prescribed without corneal sampling",
        "Steroid before a specimen is taken can suppress the organism and remove the chance of identifying it.",
        "Record the clinical reasoning for the steroid, or take the specimen and document it.",
        OPHTH_REFERENCES.aao_bacterial_ulcer,
      );
    }

    if (anyOf(f("ophth_cornea", "contact_lens"), "Soft", "Rigid", "Orthokeratology")) {
      add(
        "contact_lens_ulcer",
        "advisory",
        "Contact-lens-associated corneal infection",
        "Contact lens wear changes the likely organism and requires explicit advice on lens wear, storage and replacement.",
        "Record the lens type, the wear and hygiene history, and the advice given about stopping lens wear.",
        OPHTH_REFERENCES.aao_bacterial_ulcer,
      );
    }
  }

  // ---- Diabetic retinopathy ----------------------------------------------
  const drLevels = [f("ophth_dr", "dr_right"), f("ophth_dr", "dr_left")].filter(Boolean);
  if (drLevels.length) {
    const severe = drLevels.some((level) => anyOf(level, "Severe non-proliferative", "Proliferative"));
    const referred = anyOf(f("ophth_dr", "dr_referral"), "Referred", "Same-day");
    if (severe && !referred) {
      add(
        "dr_severe_referral",
        "documented",
        "Severe or proliferative retinopathy without a documented referral",
        "Severe non-proliferative and proliferative retinopathy carry a high risk of visual loss and are managed with specialist retinal input and a defined interval.",
        "Record the referral made, or the documented retinal plan and the interval it will be reviewed at.",
        OPHTH_REFERENCES.aao_dr,
      );
    }
    if (isBlank(f("ophth_dr", "hba1c")) && isBlank(f("ophth_dr", "systemic_control"))) {
      add(
        "dr_systemic_review",
        "advisory",
        "Systemic risk factors not documented in a retinopathy review",
        "Retinopathy progression is driven by glycaemic control, blood pressure and renal function, and the eye record is where the coordination with systemic care is shown.",
        "Record the HbA1c, the blood pressure and the renal status discussed, and what was communicated to the treating physician.",
        OPHTH_REFERENCES.aao_dr,
      );
    }
    if (anyOf(f("ophth_dr", "pregnancy"), "Pregnant") && !anyOf(f("ophth_dr", "dr_interval"), "4–6 weeks", "3 months")) {
      add(
        "dr_pregnancy_interval",
        "documented",
        "Pregnancy with retinopathy — shortened review interval",
        "Retinopathy can progress during pregnancy, so the review interval is shortened and documented rather than left at the non-pregnant interval.",
        "Record the shortened interval and the discussion with the obstetric team.",
        OPHTH_REFERENCES.aao_dr,
      );
    }
  }

  // ---- Macular disease ----------------------------------------------------
  if (anyOf(f("ophth_macular", "macular_activity"), "Active neovascular")) {
    const plan = f("ophth_macular", "anti_vegf");
    if (isBlank(plan) || anyOf(plan, "Not applicable")) {
      add(
        "amd_active_no_plan",
        "documented",
        "Active neovascular disease without a documented treatment plan",
        "Active neovascular AMD loses vision while untreated; the record must show the anti-VEGF plan or the documented reason for a different course.",
        "Record the treatment given or planned, the loading or treat-and-extend schedule, and the next review date.",
        OPHTH_REFERENCES.aao_amd,
      );
    }
  }

  if (anyOf(f("ophth_macular", "amd_category"), "Intermediate", "Advanced AMD — non-exudative") && isBlank(f("ophth_macular", "amsler"))) {
    add(
      "amd_home_monitoring",
      "advisory",
      "Home monitoring not documented for AMD at risk of conversion",
      "A patient at risk of conversion to neovascular disease needs to know which symptom means return the same day, and that instruction belongs in the record.",
      "Record the Amsler monitoring advice given and the review interval.",
      OPHTH_REFERENCES.aao_amd,
    );
  }

  // ---- Trauma -------------------------------------------------------------
  if (!isBlank(f("ophth_trauma", "trauma_mechanism"))) {
    if (isBlank(f("ophth_trauma", "tetanus"))) {
      add(
        "trauma_tetanus",
        "documented",
        "Tetanus status not recorded for an eye injury",
        "An open or contaminated eye injury requires the tetanus status to be established and recorded at the first assessment.",
        "Record the tetanus status and any prophylaxis given.",
        OPHTH_REFERENCES.bett,
      );
    }
    if (anyOf(f("ophth_trauma", "trauma_mechanism"), "Intraocular foreign body", "Penetrating") && !anyOf(f("ophth_trauma", "trauma_imaging"), "CT")) {
      add(
        "trauma_imaging",
        "documented",
        "Penetrating injury or suspected intraocular foreign body without imaging documented",
        "An intraocular foreign body changes the surgical plan and the infection risk, and is excluded or located by imaging.",
        "Record the CT orbits performed or arranged, and who is acting on the result.",
        OPHTH_REFERENCES.bett,
      );
    }
  }

  // ---- Post-operative -----------------------------------------------------
  if (anyOf(f("ophth_postop", "postop_timepoint"), "Day 1") && isBlank(f("ophth_postop", "postop_iop"))) {
    add(
      "postop_day1_iop",
      "documented",
      "Day-1 review without a recorded intraocular pressure",
      "The first post-operative review exists to detect a pressure rise, a wound problem and infection before they cost vision.",
      "Record the pressure, the anterior chamber and the wound assessment.",
      OPHTH_REFERENCES.aao_cataract,
    );
  }

  if (anyOf(f("ophth_postop", "postop_ac"), "Hypopyon")) {
    add(
      "postop_hypopyon",
      "same_day",
      "Hypopyon after surgery — endophthalmitis pathway",
      "A hypopyon in the early post-operative period is endophthalmitis until proven otherwise and is managed the same day.",
      "Record the same-day specialist review, the sampling and the intravitreal treatment given.",
      OPHTH_REFERENCES.evs,
    );
  }

  if (!isBlank(f("ophth_injection", "injection_agent")) && isBlank(f("ophth_injection", "endophthalmitis_advice"))) {
    add(
      "injection_warning_signs",
      "documented",
      "Post-injection warning signs not documented",
      "The patient's ability to recognise and report the warning signs of endophthalmitis the same day is part of the safety of the procedure.",
      "Record the warning signs explained (pain, redness, reduced vision, floaters) and the route to same-day review.",
      OPHTH_REFERENCES.evs,
    );
  }

  // ---- Emergency, discharge, referral ------------------------------------
  if (l("ophth_emergency", "emergency_presentation").filter((x) => x !== "None documented").length && isBlank(f("ophth_emergency", "emergency_escalation"))) {
    add(
      "emergency_escalation",
      "documented",
      "Time-critical presentation without documented escalation",
      "For a sight-threatening presentation the record must show who was informed and when, because the next step depends on another clinician acting.",
      "Record the clinician informed, the time, and the transfer or admission arranged.",
      OPHTH_REFERENCES.aao_comprehensive,
    );
  }

  if (isBlank(f("ophth_discharge", "discharge_warning_signs"))) {
    add(
      "discharge_warning_signs",
      "advisory",
      "Warning signs not recorded at discharge",
      "A patient sent home after eye surgery or treatment needs the specific symptoms that mean return the same day, in the record as well as in the conversation.",
      "Record the warning signs explained, the drop regimen with stop dates, and the follow-up date.",
      OPHTH_REFERENCES.aao_cataract,
    );
  }

  if (isBlank(f("ophth_discharge", "discharge_followup_when"))) {
    add(
      "discharge_followup_date",
      "documented",
      "Discharge without a follow-up date",
      "A discharge without a dated follow-up leaves the next review to chance.",
      "Record who the patient will see and when, and the clinician responsible.",
      OPHTH_REFERENCES.aao_comprehensive,
    );
  }

  const sightThreat = l("ophth_referral_block", "sight_threatening_features").filter((x) => x !== "None documented");
  if (sightThreat.length && anyOf(f("ophth_referral_block", "referral_urgency"), "Routine")) {
    add(
      "referral_urgency_mismatch",
      "same_day",
      "Sight-threatening features referred as routine",
      "The urgency recorded must match the features recorded: sudden visual loss, a suspected detachment, endophthalmitis, giant cell arteritis, an open globe or a chemical injury cannot wait for a routine appointment.",
      "Change the urgency to same-day (or document why routine is appropriate) and record who was informed and when.",
      OPHTH_REFERENCES.aao_comprehensive,
    );
  }

  return prompts;
};

export const formatOphthSafety = (value) => {
  const v = asObject(value);
  const acknowledged = Array.isArray(v.acknowledged) ? v.acknowledged : [];
  const lines = [];
  if (acknowledged.length) lines.push(`Documented action recorded against: ${acknowledged.join("; ")}`);
  if (str(v.notes)) lines.push(`Clinician note: ${str(v.notes)}`);
  if (!lines.length) return "";
  return `Decision-support review (advisory — the clinician's documented plan stands)\n${lines.join("\n")}`;
};

export const OPHTH_SAFETY_LEVELS = { same_day: "Address today", documented: "Document before signing", advisory: "Advisory" };