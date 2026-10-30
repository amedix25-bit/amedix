// Ophthalmology — the core ophthalmic examination blocks.
//
// These six blocks are the structured form of the examination every
// ophthalmology note already narrates in free text: visual function, pupils,
// motility, anterior segment, intraocular pressure with gonioscopy, and the
// optic disc, macula and fundus. They attach to the existing note types without
// replacing a single existing field.
//
// Laterality rule: wherever a finding can differ between the two eyes, the block
// asks for each eye separately. A single value is never read as "both eyes".

import {
  T, I, N, S, M, WHEN, WHEN_IN, NOT_DOCUMENTED, NOT_ASSESSED, VA_GRADES,
} from "@/lib/ophthFieldKit";

export const OPHTH_EXAM_BLOCKS = {
  ophth_va: {
    title: "Visual Acuity & Refraction",
    fields: [
      S("va_method", "Acuity Method", ["Snellen", "LogMAR / ETDRS", "Kay pictures", "Cardiff cards", "Preferential looking", "Grade only — see values", NOT_DOCUMENTED]),
      S("va_right", "Distance Acuity — Right Eye", VA_GRADES),
      S("va_left", "Distance Acuity — Left Eye", VA_GRADES),
      I("va_pinhole_right", "With Pinhole — Right Eye", { placeholder: "e.g. 6/9" }),
      I("va_pinhole_left", "With Pinhole — Left Eye"),
      S("va_bcva_right", "Best Corrected Acuity — Right Eye", VA_GRADES),
      S("va_bcva_left", "Best Corrected Acuity — Left Eye", VA_GRADES),
      I("va_near_right", "Near Acuity — Right Eye"),
      I("va_near_left", "Near Acuity — Left Eye"),
      I("refraction_right", "Refraction — Right Eye", { placeholder: "e.g. −2.50 / −0.75 × 180" }),
      I("refraction_left", "Refraction — Left Eye"),
      S("va_reliability", "Acuity Reliability", ["Reliable", "Questionable — reason documented", NOT_DOCUMENTED]),
      S("colour_vision", "Colour Vision", ["Normal", "Deficient — documented", "Not tested"]),
    ],
  },

  ophth_pupils: {
    title: "Pupils & Anisocoria",
    fields: [
      S("pupil_reaction_right", "Light Reaction — Right Eye", ["Brisk", "Sluggish", "Fixed", NOT_ASSESSED]),
      S("pupil_reaction_left", "Light Reaction — Left Eye", ["Brisk", "Sluggish", "Fixed", NOT_ASSESSED]),
      S("rapd", "Relative Afferent Pupillary Defect", ["None", "Right eye", "Left eye", "Not assessable", NOT_ASSESSED]),
      S("anisocoria", "Anisocoria", ["None", "Less than 0.5 mm", "0.5 mm or greater", NOT_ASSESSED]),
      S("anisocoria_behaviour", "Anisocoria Behaviour", ["Greater in light", "Greater in the dark", "Equal in light and dark", "Not assessable", NOT_ASSESSED], WHEN_IN("anisocoria", ["Less than 0.5 mm", "0.5 mm or greater"])),
      S("dilation", "Pupil Dilation for Examination", ["Dilated — agent documented", "Undilated", "Not dilated — narrow angle or other contraindication documented", NOT_DOCUMENTED]),
      I("dilation_agent", "Dilation Agent", WHEN("dilation", "Dilated — agent documented")),
    ],
  },

  ophth_motility: {
    title: "Ocular Motility & Binocular Examination",
    fields: [
      S("alignment", "Alignment on Cover Test", ["Orthophoria", "Esotropia", "Exotropia", "Hypertropia", "Hypotropia", "Intermittent deviation — documented", "Not performed"]),
      I("deviation_distance", "Deviation at Distance (prism dioptres)"),
      I("deviation_near", "Deviation at Near (prism dioptres)"),
      S("comitance", "Comitance", ["Comitant", "Incomitant — documented", NOT_ASSESSED]),
      S("ductions", "Ductions / Versions", ["Full", "Restricted — documented", "Overaction — documented", NOT_ASSESSED]),
      S("diplopia", "Diplopia", ["None", "Horizontal", "Vertical", "Torsional", "Monocular", NOT_ASSESSED]),
      S("nystagmus", "Nystagmus", ["None", "Present — described below", NOT_ASSESSED]),
      I("nystagmus_detail", "Nystagmus Description", WHEN("nystagmus", "Present — described below")),
      S("stereopsis", "Stereopsis", ["Present", "Absent", "Not tested"]),
      S("head_posture", "Head Posture", ["Normal", "Abnormal head posture — documented", NOT_ASSESSED]),
    ],
  },

  ophth_anterior: {
    title: "Anterior Segment Examination",
    fields: [
      M("lids", "Eyelids & Lashes", ["Normal", "Blepharitis", "Chalazion or hordeolum", "Trichiasis", "Entropion", "Ectropion", "Ptosis", "Lagophthalmos", NOT_ASSESSED]),
      S("conjunctiva", "Conjunctiva", ["Quiet", "Hyperaemia", "Follicles", "Papillae", "Discharge — documented", "Subconjunctival haemorrhage", "Pterygium or pinguecula", NOT_ASSESSED]),
      M("cornea", "Cornea", ["Clear", "Abrasion", "Infiltrate", "Ulcer", "Oedema", "Scar or opacity", "Neovascularisation", "Dellen", NOT_ASSESSED]),
      S("anterior_chamber", "Anterior Chamber", ["Quiet", "Cells", "Flare", "Cells and flare", "Hypopyon", "Hyphaema", "Fibrin", NOT_ASSESSED]),
      S("ac_cells", "Anterior Chamber Cells (SUN grading)", ["0", "0.5+", "1+", "2+", "3+", "4+", NOT_ASSESSED], WHEN_IN("anterior_chamber", ["Cells", "Cells and flare"])),
      S("ac_flare", "Anterior Chamber Flare (SUN grading)", ["None", "Faint", "Moderate", "Intense", NOT_ASSESSED], WHEN_IN("anterior_chamber", ["Flare", "Cells and flare"])),
      S("iris", "Iris", ["Normal", "Nodules — documented", "Posterior synechiae", "Neovascularisation", "Iridodialysis", NOT_ASSESSED]),
      S("lens", "Lens", ["Clear", "Nuclear sclerotic cataract", "Cortical cataract", "Posterior subcapsular cataract", "Mixed cataract", "Pseudophakia", "Aphakia", NOT_ASSESSED]),
      I("lens_grade", "Lens Opacity Grade (e.g. LOCS III — N2 C2 P1)", WHEN_IN("lens", ["Nuclear sclerotic cataract", "Cortical cataract", "Posterior subcapsular cataract", "Mixed cataract"])),
      S("iol_position", "Intraocular Lens Position", ["In the bag", "Sulcus", "Anterior chamber", "Scleral fixated", "Subluxated", "Dislocated", NOT_DOCUMENTED], WHEN("lens", "Pseudophakia")),
    ],
  },

  ophth_iop: {
    title: "Intraocular Pressure & Gonioscopy",
    fields: [
      S("iop_method", "Tonometry Method", ["Goldmann applanation", "Schiøtz", "Perkins", "Icare", "Diaton", "Tono-Pen", "Non-contact", NOT_DOCUMENTED]),
      N("iop_right", "Intraocular Pressure — Right Eye", { unit: "mmHg", min: 0, max: 80 }),
      N("iop_left", "Intraocular Pressure — Left Eye", { unit: "mmHg", min: 0, max: 80 }),
      I("iop_time", "Time of Measurement"),
      N("cct_right", "Central Corneal Thickness — Right Eye", { unit: "µm", min: 300, max: 900 }),
      N("cct_left", "Central Corneal Thickness — Left Eye", { unit: "µm", min: 300, max: 900 }),
      S("gonioscopy", "Gonioscopy", ["Not performed", "Open to the scleral spur", "Narrow — documented", "Closed", "Peripheral anterior synechiae present", NOT_DOCUMENTED]),
      S("gonioscopy_eye", "Gonioscopy — Eye Examined", ["Right", "Left", "Both"], WHEN_IN("gonioscopy", ["Open to the scleral spur", "Narrow — documented", "Closed", "Peripheral anterior synechiae present"])),
      S("angle_system", "Angle Grading System", ["Shaffer", "Spaeth", "Other — documented", NOT_DOCUMENTED], WHEN_IN("gonioscopy", ["Narrow — documented", "Closed", "Peripheral anterior synechiae present"])),
      S("iop_profile", "Pressure Profile", ["Single reading", "Diurnal curve documented", "Multiple readings documented", NOT_DOCUMENTED]),
      I("iop_target_right", "Target Intraocular Pressure — Right Eye", { placeholder: "mmHg" }),
      I("iop_target_left", "Target Intraocular Pressure — Left Eye"),
    ],
  },

  ophth_fundus: {
    title: "Optic Disc, Macula & Fundus",
    fields: [
      S("disc_right", "Optic Disc — Right Eye", ["Normal", "Cupped", "Pallor", "Oedema", "Notching", "Drusen", NOT_ASSESSED]),
      S("disc_left", "Optic Disc — Left Eye", ["Normal", "Cupped", "Pallor", "Oedema", "Notching", "Drusen", NOT_ASSESSED]),
      I("cdr_right", "Cup-to-Disc Ratio — Right Eye", { placeholder: "e.g. 0.6" }),
      I("cdr_left", "Cup-to-Disc Ratio — Left Eye"),
      S("nrr", "Neuroretinal Rim", ["Intact", "Thinning — documented", NOT_ASSESSED]),
      S("disc_haemorrhage", "Disc or Nerve Fibre Layer Haemorrhage", ["None", "Present — documented", NOT_ASSESSED]),
      S("macula_right", "Macula — Right Eye", ["Normal", "Drusen", "Pigmentary change", "Oedema", "Haemorrhage", "Exudate", "Macular hole", "Epiretinal membrane", "Scar", NOT_ASSESSED]),
      S("macula_left", "Macula — Left Eye", ["Normal", "Drusen", "Pigmentary change", "Oedema", "Haemorrhage", "Exudate", "Macular hole", "Epiretinal membrane", "Scar", NOT_ASSESSED]),
      S("vessels", "Retinal Vasculature", ["Normal", "Arteriovenous nipping", "Neovascularisation — documented", "Sheathing", "Occlusion — documented", NOT_ASSESSED]),
      S("periphery", "Retinal Periphery", ["Attached", "Detachment — documented", "Lattice degeneration", "Retinal break or tear — documented", "Not visualised", NOT_ASSESSED]),
      S("vitreous_exam", "Vitreous", ["Clear", "Vitreous haemorrhage", "Syneresis or detachment", "Cells", NOT_ASSESSED]),
      S("view", "Fundus View", ["Adequate", "Limited — reason documented", NOT_DOCUMENTED]),
    ],
  },
};

export const OPHTH_EXAM_BLOCK_COUNT = Object.keys(OPHTH_EXAM_BLOCKS).length;

// Kept for the block registry: the exam blocks are the ones every comprehensive
// note uses, so the note builder can add them all in one call.
export const OPHTH_EXAM_BLOCK_KEYS = Object.keys(OPHTH_EXAM_BLOCKS);

export const examField = (key, label, extra) => ({ key, label, ...extra });