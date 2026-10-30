// Strengthening the EXISTING Ophthalmology note types.
//
// The nine templates in src/lib/specialtyDocuments.js — Ophthalmology
// Consultation, Follow-Up, Eye Procedure Note, Ophthalmic Operative Note,
// Pre-Operative Assessment, Post-Operative Note, Discharge Summary, Visual /
// Diagnostic Test Report and Ophthalmology Referral — are NOT recreated,
// renamed, replaced or reorganised. Their keys, labels and order stay exactly as
// they are and nothing already in them is removed, so every saved note keeps its
// meaning and every report that reads a note by key keeps working. This module
// only APPENDS fields.
//
// WHAT THE APPENDED CONTENT DOES
//   1. The examination becomes structured where it matters: acuity and refraction
//      per eye, pupils with the afferent defect, motility, anterior segment with
//      SUN grading, pressure with corneal thickness and gonioscopy, and the disc,
//      macula and fundus — the elements the AAO comprehensive evaluation requires
//      to be recorded.
//   2. Each note becomes condition-specific: glaucoma (stage, field, progression,
//      target pressure, adherence), cataract (visual disability, biometry, lens
//      power, floppy-iris risk), cornea (ulcer measurement, sampling, steroid),
//      retina, diabetic retinopathy by ICDR level with macular oedema, macular
//      disease with AMD category, neuro-ophthalmology including the giant cell
//      arteritis screen, paediatric and strabismus including ROP screening, and
//      refraction with the refractive-surgery eligibility record.
//   3. Time-critical presentations, ocular trauma (BETT), ocular infection,
//      intravitreal injection, the operative record, post-operative monitoring,
//      discharge and referral each carry the fields their guidance requires.
//   4. Where the AAO publishes a pattern, the block follows it; where it does not
//      (trauma, optic neuritis, giant cell arteritis, ROP staging, keratoconus),
//      the block follows the named evidence source in ophthalmologyReferences.js.
//   5. WHO ICD-11 MMS is the mandatory classification for every note: a
//      structured primary/secondary diagnosis field whose entries carry code,
//      release, source, role, status, mapping state and clinical basis. A code
//      never confirms a diagnosis; an unresolved diagnosis stores no code.
//
// AUDIT RULES APPLIED HERE
//   - Nothing duplicates a shared AMedix surface: the patient's recorded history,
//     medications, allergies, laboratory and imaging results and vital signs come
//     from the shared note tabs and the unified Patient Record.
//   - Every field is optional; a blank is read as not documented, never normal.
//   - Laterality is explicit wherever the two eyes can differ.
//   - Conditional questions appear only where the context makes them relevant.
//   - Advisory prompts never block saving and never change a diagnosis.

import { ophthalmologyCatalogFor } from "@/lib/ophthalmologyIcd11";
import { ophthGuidelineBasis } from "@/lib/ophthalmologyReferences";
import { OPHTH_BLOCKS } from "@/lib/ophthalmologyBlocks";

const blockField = (key) => ({ key, label: OPHTH_BLOCKS[key].title, type: "ophth_modules" });

const icdBlock = (domains, placeholder) => [
  {
    key: "icd11_diagnoses",
    label: "Primary & Secondary Diagnoses (ICD-11 MMS)",
    type: "icd11_diagnoses",
    catalog: ophthalmologyCatalogFor(domains),
    placeholder,
  },
];

const scoresBlock = (scores) => [
  { key: "ophth_scores", label: "Guideline-Based Calculations", type: "ophth_scores", scores },
];

const safetyBlock = () => [
  { key: "ophth_safety", label: "Advisory Safety Prompts", type: "ophth_safety" },
];

const guidanceBlock = (noteKey) => [
  { key: "ophth_guidance", label: "Guideline Basis & Reference Register", type: "ophth_guidance", noteKey },
];

const CONSULT_DOMAINS = [
  "adnexa", "conjunctiva", "cornea", "anterior_uvea", "lens",
  "retina", "macula", "glaucoma", "optic_nerve", "motility", "refraction",
];

export const OPHTH_ENHANCEMENTS = {
  ophth_consultation: () => [
    blockField("ophth_va"),
    blockField("ophth_pupils"),
    blockField("ophth_motility"),
    blockField("ophth_anterior"),
    blockField("ophth_iop"),
    blockField("ophth_fundus"),
    blockField("ophth_glaucoma"),
    blockField("ophth_cataract"),
    blockField("ophth_cornea"),
    blockField("ophth_retina"),
    blockField("ophth_dr"),
    blockField("ophth_macular"),
    blockField("ophth_neuro"),
    blockField("ophth_peds"),
    blockField("ophth_emergency"),
    ...icdBlock(CONSULT_DOMAINS, "Search ICD-11 — the diagnosis this consultation documents…"),
    ...scoresBlock(["glaucoma_field_stage", "amd_risk", "ocular_trauma_score"]),
    ...safetyBlock(),
    ...guidanceBlock("ophth_consultation"),
  ],

  ophth_followup: () => [
    blockField("ophth_va"),
    blockField("ophth_iop"),
    blockField("ophth_fundus"),
    blockField("ophth_glaucoma"),
    blockField("ophth_retina"),
    blockField("ophth_dr"),
    blockField("ophth_macular"),
    ...icdBlock(["glaucoma", "retina", "macula", "optic_nerve", "lens"], "Search ICD-11 — the diagnosis this review follows…"),
    ...scoresBlock(["glaucoma_field_stage", "amd_risk"]),
    ...safetyBlock(),
    ...guidanceBlock("ophth_followup"),
  ],

  ophth_procedure_note: () => [
    blockField("ophth_injection"),
    blockField("ophth_trauma"),
    blockField("ophth_postop"),
    ...icdBlock(["retina", "macula", "cornea", "trauma", "anterior_uvea"], "Search ICD-11 — the indication for this procedure…"),
    ...scoresBlock(["ocular_trauma_score"]),
    ...safetyBlock(),
    ...guidanceBlock("ophth_procedure_note"),
  ],

  ophth_operative_note: () => [
    blockField("ophth_surgery"),
    blockField("ophth_postop"),
    ...icdBlock(["lens", "glaucoma", "retina", "postprocedural"], "Search ICD-11 — the diagnosis operated on…"),
    ...safetyBlock(),
    ...guidanceBlock("ophth_operative_note"),
  ],

  ophth_preop_assessment: () => [
    blockField("ophth_cataract"),
    blockField("ophth_va"),
    ...icdBlock(["lens", "cornea", "retina", "glaucoma"], "Search ICD-11 — the diagnosis the operation addresses…"),
    ...safetyBlock(),
    ...guidanceBlock("ophth_preop_assessment"),
  ],

  ophth_postop_note: () => [
    blockField("ophth_postop"),
    blockField("ophth_infection"),
    ...icdBlock(["postprocedural", "lens", "anterior_uvea", "retina"], "Search ICD-11 — the post-operative diagnosis…"),
    ...safetyBlock(),
    ...guidanceBlock("ophth_postop_note"),
  ],

  ophth_discharge_summary: () => [
    blockField("ophth_discharge"),
    blockField("ophth_postop"),
    ...icdBlock(["postprocedural", "lens", "glaucoma", "retina"], "Search ICD-11 — the discharge diagnoses…"),
    ...safetyBlock(),
    ...guidanceBlock("ophth_discharge_summary"),
  ],

  ophth_diagnostic_report: () => [
    blockField("ophth_imaging_report"),
    ...icdBlock(["glaucoma", "retina", "macula", "optic_nerve"], "Search ICD-11 — the condition the test addresses…"),
    ...scoresBlock(["glaucoma_field_stage"]),
    ...guidanceBlock("ophth_diagnostic_report"),
  ],

  ophth_referral: () => [
    blockField("ophth_referral_block"),
    blockField("ophth_emergency"),
    ...icdBlock(["optic_nerve", "retina", "glaucoma", "trauma", "cornea"], "Search ICD-11 — the diagnosis being referred…"),
    ...safetyBlock(),
    ...guidanceBlock("ophth_referral"),
  ],
};

// Appends — never replaces — so a saved note keeps every field it already had.
export const withOphthalmologyStandards = (docs) =>
  docs.map((doc) => {
    const extra = OPHTH_ENHANCEMENTS[doc.key];
    if (!extra) return doc;
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = extra().filter((f) => {
      if (existing.has(f.key)) return false;
      existing.add(f.key);
      return true;
    });
    if (!additions.length) return doc;
    return {
      ...doc,
      fields: [...(doc.fields || []), ...additions],
      // The guideline basis the note's content was built from, recorded on the
      // template so the note header and its PDF state it without re-typing.
      guidelineBasis: ophthGuidelineBasis(doc.key),
    };
  });