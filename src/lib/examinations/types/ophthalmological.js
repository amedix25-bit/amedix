import { sel, chk, num, section } from "../shared";

export default {
  key: "ophthalmological",
  label: "Ophthalmological Examination",
  description: "Visual acuity, anterior segment, pupils, fundus and IOP",
  sections: [
    section("visual_acuity", "Visual Acuity", [
      sel("right_va", "Right eye — visual acuity", ["6/6", "6/9", "6/12", "6/18", "6/24", "6/36", "6/60", "Counting fingers", "Hand movements", "Perception of light", "No perception of light"]),
      sel("left_va", "Left eye — visual acuity", ["6/6", "6/9", "6/12", "6/18", "6/24", "6/36", "6/60", "Counting fingers", "Hand movements", "Perception of light", "No perception of light"]),
      chk("glasses", "Corrected with glasses / lenses"),
      sel("color_vision", "Colour vision", ["Normal", "Impaired", "Not tested"]),
      sel("visual_fields", "Visual fields (confrontation)", ["Full", "Constricted", "Field defect"], { detailOn: ["Field defect"], detailLaterality: true }),
    ], { mode: "free" }),
    section("external_eye", "External Eye and Adnexa", [
      sel("eyelids", "Eyelids", ["Normal", "Ptosis", "Entropion / ectropion", "Inflamed", "Lid lag"], { detailOn: ["Ptosis", "Entropion / ectropion", "Inflamed", "Lid lag"], detailLaterality: true }),
      sel("conjunctiva", "Conjunctiva", ["Normal", "Injected", "Pale", "Chemotic", "Growth / pterygium"], { bilateral: true, detailOn: ["Injected", "Pale", "Chemotic", "Growth / pterygium"] }),
      sel("sclera", "Sclera", ["White", "Icteric", "Injected", "Blue"], { bilateral: true }),
      chk("proptosis", "Proptosis", { detailLaterality: true }),
      chk("squint", "Squint / strabismus", { detailOn: true }),
    ]),
    section("pupils", "Pupils and Eye Movements", [
      num("pupil_size", "Pupil size", { unit: "mm", step: 0.5, min: 1, max: 9, bilateral: true }),
      sel("pupil_shape", "Pupil shape", ["Round", "Irregular"], { bilateral: true }),
      sel("light_reaction", "Reaction to light", ["Brisk", "Sluggish", "Fixed"], { bilateral: true }),
      sel("accommodation", "Accommodation", ["Normal", "Impaired"], { bilateral: true }),
      chk("rapd", "Relative afferent pupillary defect (RAPD)", { detailLaterality: true }),
      sel("eye_movements", "Extraocular movements", ["Full", "Restricted", "Nystagmus present", "Restricted + nystagmus"], { detailOn: ["Restricted", "Nystagmus present", "Restricted + nystagmus"], detailLaterality: true }),
    ], { mode: "free" }),
    section("anterior_segment", "Anterior Segment (Slit Lamp)", [
      sel("cornea", "Cornea", ["Clear", "Opacity", "Ulcer", "Abrasion", "Neovascularization"], { bilateral: true, detailOn: ["Opacity", "Ulcer", "Abrasion", "Neovascularization"] }),
      sel("anterior_chamber", "Anterior chamber", ["Deep and quiet", "Shallow", "Cells / flare", "Hypopyon / hyphema"], { bilateral: true, detailOn: ["Shallow", "Cells / flare", "Hypopyon / hyphema"] }),
      sel("lens", "Lens", ["Clear", "Cataract — immature", "Cataract — mature", "Aphakic / pseudophakic"], { bilateral: true }),
    ]),
    section("fundus", "Fundus (Ophthalmoscopy)", [
      sel("optic_disc", "Optic disc", ["Normal, pink and sharp", "Swollen", "Pale / atrophic", "Cupped"], { bilateral: true }),
      sel("vessels", "Retinal vessels", ["Normal", "Arteriolar narrowing", "AV nipping", "Hemorrhages", "Exudates", "Neovascularization"], { bilateral: true, detailOn: ["Arteriolar narrowing", "AV nipping", "Hemorrhages", "Exudates", "Neovascularization"] }),
      sel("macula", "Macula", ["Normal", "Degeneration", "Edema", "Scar"], { bilateral: true }),
    ]),
    section("tonometry", "Intraocular Pressure", [
      num("iop", "IOP", { unit: "mmHg", min: 0, max: 90, bilateral: true }),
      sel("method", "Method", ["Not measured", "Goldmann applanation", "Tonopen", "Digital estimate"]),
    ], { mode: "free" }),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};