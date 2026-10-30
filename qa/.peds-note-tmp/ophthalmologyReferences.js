// Ophthalmology — governing clinical references and the audit register.
//
// PRIMARY AUTHORITY: American Academy of Ophthalmology (AAO) — Preferred
// Practice Patterns (PPP), Summary Benchmarks, Clinical Statements and
// Ophthalmic Technology Assessments.
//
// IMPORTANT — what is recorded here and what is NOT:
//   * Only the guideline's identity (body, title, edition/revision), the
//     population it covers, and the link to the AAO's own page are recorded.
//     AAO content is copyright protected and is not reproduced in this app.
//   * The clinical requirements the notes ask for are AMedix's own wording of
//     what the cited document requires to be documented. They are not quotations.
//   * Every entry states `revision_verified`. Where the exact current revision
//     could not be read from the AAO listing at implementation time, the entry
//     carries `revision_verified: false` and the guidance panel tells the
//     reviewing clinician to confirm the revision on the AAO page. Nothing is
//     presented as an AAO recommendation when it could not be confirmed.
//   * Where the AAO does not publish a pattern for a clinical question (optic
//     neuritis, giant cell arteritis, ocular trauma scoring, endophthalmitis
//     after intravitreal injection, keratoconus, ROP staging), an appropriate
//     evidence-based source is named instead, and the entry says so.
//
// Review cadence: LAST_REVIEWED below. Every note records this register with the
// note itself, so an exported record keeps the evidence base it was written from.

export const OPHTH_LAST_REVIEWED = "2026-10-30";

const AAO_PPP_BROWSE = "https://www.aao.org/education/guidelines-browse";
const AAO_JOURNAL_PPP = "https://www.aaojournal.org/content/preferred-practice-pattern";

export const OPHTH_REFERENCES = {
  // ---- Core / comprehensive -------------------------------------------------
  aao_comprehensive: {
    key: "aao_comprehensive",
    organization: "AAO",
    title: "Comprehensive Adult Medical Eye Evaluation — Preferred Practice Pattern",
    edition: "PPP, revision 2020",
    revision_date: "2020",
    revision_verified: true,
    population: "Adults presenting for a comprehensive medical eye evaluation",
    applies: "the structure of the comprehensive examination: history, visual function, anterior and posterior segment, IOP and the decision on further testing",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_benchmarks: {
    key: "aao_benchmarks",
    organization: "AAO",
    title: "Summary Benchmarks for Preferred Practice Patterns",
    edition: "current edition at review",
    revision_date: "current edition",
    revision_verified: false,
    population: "All patients covered by the corresponding pattern",
    applies: "the quality indicators each note records (documented acuity, IOP, disc assessment, follow-up interval)",
    type: "Summary Benchmarks",
    url: AAO_PPP_BROWSE,
  },

  // ---- Glaucoma -------------------------------------------------------------
  aao_poag: {
    key: "aao_poag",
    organization: "AAO",
    title: "Primary Open-Angle Glaucoma — Preferred Practice Pattern",
    edition: "PPP, revision 2020",
    revision_date: "2020",
    revision_verified: true,
    population: "Adults with, or suspected of, primary open-angle glaucoma",
    applies: "IOP and target IOP, optic nerve head and retinal nerve fibre layer assessment, visual field testing, gonioscopy, adherence and treatment escalation",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_pacg: {
    key: "aao_pacg",
    organization: "AAO",
    title: "Primary Angle-Closure Disease — Preferred Practice Pattern",
    edition: "PPP, revision 2020",
    revision_date: "2020",
    revision_verified: true,
    population: "Patients with primary angle-closure suspect, angle closure or angle-closure glaucoma",
    applies: "gonioscopic grading, the acute angle-closure pathway, iridotomy and the fellow-eye decision",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },

  // ---- Lens -----------------------------------------------------------------
  aao_cataract: {
    key: "aao_cataract",
    organization: "AAO",
    title: "Cataract in the Adult Eye — Preferred Practice Pattern",
    edition: "PPP, revision 2021",
    revision_date: "2021",
    revision_verified: true,
    population: "Adults with cataract",
    applies: "indication and visual disability, pre-operative biometry and IOL power selection, surgical plan, post-operative assessment and the refraction that follows",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },

  // ---- Cornea / external ----------------------------------------------------
  aao_bacterial_ulcer: {
    key: "aao_bacterial_ulcer",
    organization: "AAO",
    title: "Bacterial Corneal Ulcer — Preferred Practice Pattern",
    edition: "PPP, revision 2018",
    revision_date: "2018",
    revision_verified: true,
    population: "Patients with suspected bacterial corneal ulcer",
    applies: "risk factors including contact lens wear, ulcer measurement, corneal sampling before treatment, antibiotic choice and the review interval",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_dry_eye: {
    key: "aao_dry_eye",
    organization: "AAO",
    title: "Dry Eye Syndrome — Preferred Practice Pattern",
    edition: "PPP, revision 2018",
    revision_date: "2018",
    revision_verified: true,
    population: "Patients with dry eye syndrome",
    applies: "symptom severity, ocular surface staining, tear film assessment and stepwise treatment",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_blepharitis: {
    key: "aao_blepharitis",
    organization: "AAO",
    title: "Blepharitis — Preferred Practice Pattern",
    edition: "PPP, revision 2018",
    revision_date: "2018",
    revision_verified: true,
    population: "Patients with blepharitis",
    applies: "lid margin findings, meibomian gland assessment, associated ocular surface disease and lid hygiene treatment",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_conjunctivitis: {
    key: "aao_conjunctivitis",
    organization: "AAO",
    title: "Conjunctivitis — Preferred Practice Pattern",
    edition: "PPP, revision 2018",
    revision_date: "2018",
    revision_verified: true,
    population: "Patients with conjunctival inflammation",
    applies: "differentiating bacterial, viral and allergic disease, the red flags that change the diagnosis, and the decision not to treat viral disease with antibiotics",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_corneal_edema: {
    key: "aao_corneal_edema",
    organization: "AAO",
    title: "Corneal Edema and Opacification — Preferred Practice Pattern",
    edition: "PPP, revision 2018",
    revision_date: "2018",
    revision_verified: true,
    population: "Patients with corneal oedema or opacification",
    applies: "endothelial assessment, corneal thickness and the decision between medical and surgical management",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  global_keratoconus: {
    key: "global_keratoconus",
    organization: "Global Consensus on Keratoconus",
    title: "Global Consensus on Keratoconus and Ectatic Diseases",
    edition: "consensus report (2015), current as reviewed",
    revision_date: "2015",
    revision_verified: true,
    population: "Patients with keratoconus or corneal ectasia",
    applies: "the diagnostic criteria, progression definition and the role of corneal cross-linking — used where the AAO does not publish a keratoconus pattern",
    type: "Consensus statement",
    url: "https://pubmed.ncbi.nlm.nih.gov/25931170/",
  },

  // ---- Retina / vitreous ----------------------------------------------------
  aao_dr: {
    key: "aao_dr",
    organization: "AAO",
    title: "Diabetic Retinopathy — Preferred Practice Pattern",
    edition: "PPP, revision 2019",
    revision_date: "2019",
    revision_verified: true,
    population: "Patients with diabetes mellitus",
    applies: "retinopathy severity grading, diabetic macular oedema, the follow-up interval by severity, referral thresholds and coordination with systemic care",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_amd: {
    key: "aao_amd",
    organization: "AAO",
    title: "Age-Related Macular Degeneration — Preferred Practice Pattern",
    edition: "PPP, revision 2019",
    revision_date: "2019",
    revision_verified: true,
    population: "Patients with, or at risk of, age-related macular degeneration",
    applies: "drusen and pigmentary change, conversion to neovascular disease, home Amsler monitoring, anti-VEGF treatment and review interval",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_pvd: {
    key: "aao_pvd",
    organization: "AAO",
    title: "Posterior Vitreous Detachment, Retinal Breaks, and Lattice Degeneration — Preferred Practice Pattern",
    edition: "PPP, revision 2020",
    revision_date: "2020",
    revision_verified: true,
    population: "Patients with flashes, floaters or predisposing retinal lesions",
    applies: "dilated fundus examination, the symptomatic posterior vitreous detachment pathway and treatment of retinal breaks",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_retinal_occlusion: {
    key: "aao_retinal_occlusion",
    organization: "AAO",
    title: "Retinal and Ophthalmic Artery Occlusions — Preferred Practice Pattern",
    edition: "PPP, revision 2019",
    revision_date: "2019",
    revision_verified: true,
    population: "Patients with retinal artery occlusion",
    applies: "the time-critical pathway, systemic stroke-risk investigation and the distinction between central and branch occlusion",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_rop: {
    key: "aao_rop",
    organization: "AAO",
    title: "Retinopathy of Prematurity — Preferred Practice Pattern",
    edition: "PPP, revision 2020",
    revision_date: "2020",
    revision_verified: true,
    population: "Premature infants meeting screening criteria",
    applies: "screening eligibility, the interval between examinations, zone and stage documentation and treatment thresholds",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  icrop3: {
    key: "icrop3",
    organization: "ICROP Committee",
    title: "International Classification of Retinopathy of Prematurity, 3rd edition",
    edition: "ICROP3 (2021)",
    revision_date: "2021",
    revision_verified: true,
    population: "Premature infants screened for retinopathy of prematurity",
    applies: "the zone, stage, extent and plus-disease terminology the ROP record uses",
    type: "Classification",
    url: "https://pubmed.ncbi.nlm.nih.gov/34451550/",
  },
  icdr: {
    key: "icdr",
    organization: "International Council of Ophthalmology",
    title: "International Clinical Diabetic Retinopathy and Diabetic Macular Edema Disease Severity Scales",
    edition: "ICDR scale (Wilkinson et al., 2003)",
    revision_date: "2003",
    revision_verified: true,
    population: "Patients with diabetes mellitus",
    applies: "the severity levels the diabetic retinopathy derivation uses — the AAO pattern acts on the same levels",
    type: "Classification",
    url: "https://pubmed.ncbi.nlm.nih.gov/12824215/",
  },
  areds2: {
    key: "areds2",
    organization: "AREDS2 Research Group",
    title: "AREDS2 and the AREDS Simplified Severity Scale for progression to advanced AMD",
    edition: "AREDS Report 18 (2005) and AREDS2 (2013)",
    revision_date: "2013",
    revision_verified: true,
    population: "Patients with non-advanced age-related macular degeneration",
    applies: "the drusen and pigment risk factors, the 5-step severity scale and the 5-year risk band the AMD block records — used where the AAO pattern does not tabulate the scale",
    type: "Evidence source",
    url: "https://pubmed.ncbi.nlm.nih.gov/23680951/",
  },

  // ---- Neuro-ophthalmology --------------------------------------------------
  nanos_on: {
    key: "nanos_on",
    organization: "NANOS",
    title: "Optic Neuritis — NANOS clinical guidance (no AAO pattern exists)",
    edition: "current guidance as reviewed",
    revision_date: "current",
    revision_verified: false,
    population: "Patients with suspected optic neuritis",
    applies: "the atypical features that change the diagnosis, MRI timing, and the serology indicated when the presentation is not typical demyelinating disease — named here because the AAO does not publish a pattern for this",
    type: "Society guidance",
    url: "https://www.nanosweb.org/",
  },
  bsr_gca: {
    key: "bsr_gca",
    organization: "BSR / EULAR",
    title: "Giant Cell Arteritis — management guidance (no AAO pattern exists)",
    edition: "current guidance as reviewed",
    revision_date: "current",
    revision_verified: false,
    population: "Patients with suspected giant cell arteritis",
    applies: "the same-day steroid rule, inflammatory markers, temporal artery ultrasound or biopsy, and the visual-loss pathway — named because the AAO does not publish a pattern for this",
    type: "Society guidance",
    url: "https://pubmed.ncbi.nlm.nih.gov/33108351/",
  },
  bett: {
    key: "bett",
    organization: "Birmingham Eye Trauma Terminology",
    title: "Birmingham Eye Trauma Terminology (BETT) and Ocular Trauma Score",
    edition: "BETT; OTS (Kuhn et al., 2002)",
    revision_date: "2002",
    revision_verified: true,
    population: "Patients with ocular or adnexal trauma",
    applies: "the closed/open globe definition the trauma block records and the OTS variables and outcome categories — named because the AAO does not publish a trauma pattern",
    type: "Classification",
    url: "https://pubmed.ncbi.nlm.nih.gov/12021970/",
  },
  evs: {
    key: "evs",
    organization: "AAO Clinical Statement / EVS",
    title: "Endophthalmitis — AAO clinical statement and the Endophthalmitis Vitrectomy Study evidence",
    edition: "AAO statement; EVS (1995)",
    revision_date: "current",
    revision_verified: false,
    population: "Patients with suspected endophthalmitis, including after intravitreal injection",
    applies: "the same-day referral rule, vitreous sampling, intravitreal antibiotic treatment and the record of a patient's post-injection warning signs",
    type: "Clinical statement",
    url: AAO_PPP_BROWSE,
  },

  // ---- Paediatric / strabismus / refraction ---------------------------------
  aao_pediatric: {
    key: "aao_pediatric",
    organization: "AAO",
    title: "Pediatric Eye Evaluations — Preferred Practice Pattern",
    edition: "PPP, current revision at review",
    revision_date: "current",
    revision_verified: false,
    population: "Infants, children and adolescents",
    applies: "the age-appropriate vision and alignment assessment, red reflex and the referral threshold for a child",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_amblyopia: {
    key: "aao_amblyopia",
    organization: "AAO",
    title: "Amblyopia — Preferred Practice Pattern",
    edition: "PPP, current revision at review",
    revision_date: "current",
    revision_verified: false,
    population: "Children and adults with amblyopia",
    applies: "the acuity deficit definition, refractive correction first, occlusion or penalisation therapy with a documented compliance plan, and the review interval",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_strabismus: {
    key: "aao_strabismus",
    organization: "AAO",
    title: "Esotropia and Exotropia — Preferred Practice Pattern",
    edition: "PPP, current revision at review",
    revision_date: "current",
    revision_verified: false,
    population: "Patients with esotropia or exotropia",
    applies: "the deviation measurement, comitance, the sensory examination and the surgical or non-surgical plan",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },
  aao_refractive: {
    key: "aao_refractive",
    organization: "AAO",
    title: "Refractive Errors and Refractive Surgery — Preferred Practice Pattern",
    edition: "PPP, current revision at review",
    revision_date: "current",
    revision_verified: false,
    population: "Patients with refractive error, including those considering refractive surgery",
    applies: "refraction and keratometry, the eligibility assessment, the counselling record and the post-operative review",
    type: "Preferred Practice Pattern",
    url: AAO_PPP_BROWSE,
  },

  // ---- Uveitis --------------------------------------------------------------
  sun_uveitis: {
    key: "sun_uveitis",
    organization: "SUN Working Group",
    title: "Standardization of Uveitis Nomenclature (SUN) — anterior uveitis grading",
    edition: "SUN criteria (2005), current as reviewed",
    revision_date: "2005",
    revision_verified: true,
    population: "Patients with uveitis",
    applies: "the anterior chamber cell and flare grading and the anatomical classification the uveitis block records",
    type: "Classification",
    url: "https://pubmed.ncbi.nlm.nih.gov/15965124/",
  },
  who_icd11: {
    key: "who_icd11",
    organization: "WHO",
    title: "ICD-11 MMS, Chapter 09 — Diseases of the visual system",
    edition: "ICD-11 MMS release 2026-01",
    revision_date: "2026-01",
    revision_verified: true,
    population: "All patients",
    applies: "the coded diagnosis every note records — a code never confirms a diagnosis",
    type: "Classification",
    url: "https://icd.who.int/browse/2026-01/mms/en",
  },
};

// Per note type: the documents its content and prompts were built from, and the
// one thing that note documents in their terms.
export const OPHTH_NOTE_BASIS = {
  ophth_consultation: {
    note: "Ophthalmology Consultation",
    basis: [
      OPHTH_REFERENCES.aao_comprehensive,
      OPHTH_REFERENCES.aao_poag,
      OPHTH_REFERENCES.aao_cataract,
      OPHTH_REFERENCES.aao_dr,
      OPHTH_REFERENCES.aao_amd,
      OPHTH_REFERENCES.who_icd11,
    ],
    states:
      "A complete ophthalmic evaluation — acuity and refraction, pupils, motility, anterior segment, intraocular pressure with gonioscopy, and optic disc, macula and fundus — followed by the condition-specific assessment, the coded diagnosis and the escalation it triggered.",
  },
  ophth_followup: {
    note: "Ophthalmology Follow-Up",
    basis: [
      OPHTH_REFERENCES.aao_poag,
      OPHTH_REFERENCES.aao_dr,
      OPHTH_REFERENCES.aao_amd,
      OPHTH_REFERENCES.aao_benchmarks,
      OPHTH_REFERENCES.who_icd11,
    ],
    states:
      "Interval course, the measured change that decides the next interval (IOP and field for glaucoma, retinopathy level for diabetes, macular activity for AMD) and the documented treatment response.",
  },
  ophth_procedure_note: {
    note: "Eye Procedure Note",
    basis: [
      OPHTH_REFERENCES.aao_cataract,
      OPHTH_REFERENCES.evs,
      OPHTH_REFERENCES.aao_benchmarks,
      OPHTH_REFERENCES.who_icd11,
    ],
    states:
      "Laterality and consent, asepsis and time-out, the procedure and agent detail, the complication check, and the post-procedure instructions with their warning signs.",
  },
  ophth_operative_note: {
    note: "Ophthalmic Operative Note",
    basis: [
      OPHTH_REFERENCES.aao_cataract,
      OPHTH_REFERENCES.aao_poag,
      OPHTH_REFERENCES.aao_pvd,
      OPHTH_REFERENCES.who_icd11,
    ],
    states:
      "The confirmed eye, the procedure performed with its implant detail, the intra-operative complications and how they were managed, and the immediate post-operative plan.",
  },
  ophth_preop_assessment: {
    note: "Pre-Operative Assessment (Ophthalmology)",
    basis: [
      OPHTH_REFERENCES.aao_cataract,
      OPHTH_REFERENCES.aao_comprehensive,
      OPHTH_REFERENCES.aao_benchmarks,
      OPHTH_REFERENCES.who_icd11,
    ],
    states:
      "Visual disability and the indication, biometry and IOL power, ocular comorbidity, the systemic medication that changes the surgical plan, and the consent and counselling record.",
  },
  ophth_postop_note: {
    note: "Post-Operative Note (Ophthalmology)",
    basis: [
      OPHTH_REFERENCES.aao_cataract,
      OPHTH_REFERENCES.evs,
      OPHTH_REFERENCES.aao_benchmarks,
      OPHTH_REFERENCES.who_icd11,
    ],
    states:
      "Post-operative acuity and IOP, wound and anterior chamber, the retina where it is at risk, the drop regimen, and the endophthalmitis warning signs the patient was given.",
  },
  ophth_discharge_summary: {
    note: "Ophthalmology Discharge Summary",
    basis: [
      OPHTH_REFERENCES.aao_cataract,
      OPHTH_REFERENCES.aao_poag,
      OPHTH_REFERENCES.evs,
      OPHTH_REFERENCES.who_icd11,
    ],
    states:
      "The eye's status at discharge, the drop taper with explicit stop dates, the activity and follow-up instructions, and the symptoms that require return the same day.",
  },
  ophth_diagnostic_report: {
    note: "Visual / Diagnostic Test Report",
    basis: [
      OPHTH_REFERENCES.aao_poag,
      OPHTH_REFERENCES.aao_dr,
      OPHTH_REFERENCES.aao_amd,
      OPHTH_REFERENCES.icdr,
      OPHTH_REFERENCES.who_icd11,
    ],
    states:
      "The test performed, its laterality and reliability, the measurement or image that answers the clinical question, and the comparison with the previous test that decides what happens next.",
  },
  ophth_referral: {
    note: "Ophthalmology Referral",
    basis: [
      OPHTH_REFERENCES.aao_comprehensive,
      OPHTH_REFERENCES.aao_retinal_occlusion,
      OPHTH_REFERENCES.bsr_gca,
      OPHTH_REFERENCES.who_icd11,
    ],
    states:
      "The reason for referral with its urgency, the sight-threatening features that set that urgency, what has already been done, and the destination that can act on it.",
  },
};

export const ophthNoteBasis = (noteKey) => OPHTH_NOTE_BASIS[noteKey] || null;

// Short labels recorded on the template itself (note header / PDF export).
export const ophthGuidelineBasis = (noteKey) => {
  const entry = OPHTH_NOTE_BASIS[noteKey];
  if (!entry) return ["AAO PPP", "WHO ICD-11 MMS"];
  const orgs = entry.basis.map((b) => (b.organization === "WHO" ? "WHO ICD-11 MMS" : b.organization));
  return Array.from(new Set(orgs));
};

// The audit register the department reviews: guideline, publication or revision
// date, the note types it governs, and when it was last reviewed here.
export const OPHTH_REFERENCE_REGISTER = Object.values(OPHTH_REFERENCES).map((ref) => ({
  key: ref.key,
  guideline: `${ref.organization} — ${ref.title}`,
  type: ref.type,
  revision: ref.revision_date,
  revision_verified: ref.revision_verified,
  applicable_notes: Object.entries(OPHTH_NOTE_BASIS)
    .filter(([, entry]) => entry.basis.some((b) => b.key === ref.key))
    .map(([noteKey, entry]) => entry.note),
  last_reviewed: OPHTH_LAST_REVIEWED,
  url: ref.url,
}));

export const OPHTH_UNVERIFIED_REVISIONS = OPHTH_REFERENCE_REGISTER.filter((r) => !r.revision_verified);