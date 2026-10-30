// Emergency Medicine clinical reference register.
//
// THE RULE THIS REGISTER FOLLOWS
//
// A reference is marked `text_verified: true` only when the wording the app
// relies on was actually read at the publisher's own page in this build. A
// reference whose title, edition and link were confirmed but whose
// recommendation text was not opened is `title_verified: true,
// text_verified: false`. Nothing is guessed, and no document number is invented.
//
// `evidence_type` keeps three different things apart, because they carry
// different weight:
//   formal_recommendation  an evidence-graded guideline or board-approved
//                          clinical policy
//   consensus_or_program   a consensus-based programme or training approach
//                          (for example the ATLS course), not a graded guideline
//   local_protocol         an AMedix local decision set — never presented as a
//                          guideline
//
// The app never claims that a guideline has been "implemented" or that the
// specialty is "compliant". The notes record what the clinician documented; the
// safety layer states what was documented and how time-sensitive it is, and
// every prompt shows its reference and that reference's verification state.

const RETRIEVED = "2026-10-28";

const SITE = {
  aha: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines",
  acep: "https://www.acep.org/patient-care/clinical-policies",
  east: "https://www.east.org/education-resources/practice-management-guidelines",
  btf: "https://braintrauma.org/coma/guidelines/severe-tbi",
  acs: "https://www.facs.org/quality-programs/trauma/education/advanced-trauma-life-support/atls-11/",
  who: "https://www.who.int/publications-detail-redirect/basic-emergency-care-approach-to-the-acutely-ill-and-injured",
  icd: "https://icd.who.int/",
};

export const EMERGENCY_REFERENCES = {
  // ---- Text read at the publisher's own page in this build ----------------
  ssc_2021: {
    id: "ssc_2021",
    organisation: "Surviving Sepsis Campaign (SCCM / ESICM)",
    title: "International Guidelines for Management of Sepsis and Septic Shock 2021",
    edition: "Evans L, Rhodes A, Alhazzani W, et al. Crit Care Med 2021;49(11):e1063–e1143",
    url: "https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-guidelines-2021",
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: true,
    scope:
      "Read on the SCCM guideline page: antimicrobials immediately, ideally within 1 hour of recognition, for possible " +
      "septic shock or high likelihood of sepsis (strong recommendation, low/very low certainty); at least 30 mL/kg IV " +
      "crystalloid within the first 3 hours for sepsis-induced hypoperfusion or septic shock (weak, low certainty); " +
      "initial target mean arterial pressure of 65 mm Hg on vasopressors (strong, moderate certainty); measure blood " +
      "lactate in suspected sepsis (weak, low certainty); sepsis and septic shock are medical emergencies and treatment " +
      "and resuscitation should begin immediately (best practice statement).",
    verification_note:
      "Recommendation wording, strength and certainty were read on the SCCM page on 2026-10-28. The app records what " +
      "the clinician documented and its timing; it never orders treatment.",
  },

  btf_severe_tbi_4: {
    id: "btf_severe_tbi_4",
    organisation: "Brain Trauma Foundation",
    title: "Guidelines for the Management of Severe Traumatic Brain Injury, 4th Edition",
    edition: "Carney N, et al. Neurosurgery 2017;80(1):6–15 (4th edition, 2016)",
    url: "https://braintrauma.org/coma/guidelines/severe-tbi",
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: true,
    scope:
      "Read on the Brain Trauma Foundation page: intracranial pressure should be monitored in all salvageable patients " +
      "with a severe traumatic brain injury (GCS 3–8 after resuscitation) and an abnormal computed tomography scan. " +
      "The app uses this only to prompt documentation of the decision — it never orders monitoring.",
    verification_note:
      "Statement read at braintrauma.org on 2026-10-28, where the 4th edition is listed as the current severe TBI " +
      "guideline. Other recommendations in the document were not opened, so they are not quoted.",
  },

  icd11_mms: {
    id: "icd11_mms",
    organisation: "WHO",
    title: "ICD-11 for Mortality and Morbidity Statistics (MMS)",
    edition: "Release 2026-01",
    url: "https://icd.who.int/browse/2026-01/mms/en",
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: true,
    scope:
      "Every code and title offered by the Emergency Medicine coding field was read from the ICD-11 MMS tabulation for " +
      "release 2026-01 as reproduced verbatim by the Find-A-Code ICD-11 MMS browser. ICD-11 is a classification, not " +
      "a treatment guideline: a code never confirms a diagnosis.",
    verification_note:
      "Chapters and blocks read on 2026-10-28: 01 (sepsis), 04 (anaphylaxis), 05 (diabetes and glucose regulation), " +
      "08 (cerebrovascular disease, status epilepticus), 11 (ischaemic heart disease), 12 (lower respiratory tract, " +
      "pleural disorders, respiratory failure), 21 (general and circulatory symptoms) and 22 (head and thoracic " +
      "injuries, harmful effects of substances).",
  },

  amedix_local_triage: {
    id: "amedix_local_triage",
    organisation: "AMedix",
    title: "Local emergency safety trigger set (not a clinical guideline)",
    edition: "This build — awaiting local emergency-department sign-off",
    url: "",
    retrieved: RETRIEVED,
    evidence_type: "local_protocol",
    title_verified: true,
    text_verified: true,
    scope:
      "The trigger levels and the documentation prompts used where no guideline text was verified: reassessment " +
      "intervals, escalation, transfer acceptance, safety-netting and the at-risk groups flagged at triage.",
    verification_note:
      "This is an AMedix clinical decision set, not a guideline. It is labelled as local in the note and the PDF, and " +
      "it is listed in EMERGENCY_SAFETY_APPROVAL_REQUIRED for sign-off by the emergency department lead.",
  },

  // ---- Title, edition and link confirmed; recommendation text not opened --
  aha_2025_cpr_ecc: {
    id: "aha_2025_cpr_ecc",
    organisation: "American Heart Association",
    title: "2025 American Heart Association Guidelines for CPR and Emergency Cardiovascular Care",
    edition: "Published in Circulation, 22 October 2025",
    url: SITE.aha,
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope:
      "The AHA confirms the 2025 Guidelines for CPR and ECC were published online in Circulation on 22 October 2025, " +
      "and lists the parts used by this app: Part 7 Adult Basic Life Support, Part 9 Adult Advanced Life Support, " +
      "Part 10 Special Circumstances of Resuscitation and Part 11 Post–Cardiac Arrest Care.",
    verify_at: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines",
    verification_note:
      "Title, publisher and publication date were read on cpr.heart.org on 2026-10-28. The recommendation statements " +
      "themselves were not opened in this build, so none is quoted — the prompts ask the clinician to document the " +
      "resuscitation elements and their times, not to follow a specific AHA instruction.",
  },

  aha_2025_als: {
    id: "aha_2025_als",
    organisation: "American Heart Association",
    title: "Part 9: Adult Advanced Life Support — 2025 AHA Guidelines for CPR and ECC",
    edition: "Circulation, doi:10.1161/CIR.0000000000001376 (2025)",
    url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001376",
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope:
      "The published abstract states that these guidelines address resuscitation and management of adults with cardiac " +
      "arrest, respiratory arrest and life-threatening cardiovascular emergencies, and cover double sequential " +
      "defibrillation, head-up CPR and point-of-care ultrasound in advanced life support.",
    verify_at: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001376",
    verification_note:
      "Only the abstract was read (via the indexed record of the article) in this build. The graded recommendations " +
      "were not opened, so the app quotes none of them.",
  },

  aha_2025_bls: {
    id: "aha_2025_bls",
    organisation: "American Heart Association",
    title: "Part 7: Adult Basic Life Support — 2025 AHA Guidelines for CPR and ECC",
    edition: "Circulation, doi:10.1161/CIR.0000000000001369 (2025)",
    url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001369",
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope:
      "The published abstract states the chapter covers recognition of cardiac arrest, activation of the emergency " +
      "response, high-quality CPR and use of an automated external defibrillator.",
    verify_at: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001369",
    verification_note: "Title and abstract read; graded recommendations not opened in this build.",
  },

  aha_2025_post_arrest: {
    id: "aha_2025_post_arrest",
    organisation: "American Heart Association",
    title: "Part 11: Post–Cardiac Arrest Care — 2025 AHA Guidelines for CPR and ECC",
    edition: "Circulation, doi:10.1161/CIR.0000000000001375 (2025)",
    url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001375",
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope:
      "Part 11 of the 2025 guidelines, covering care after return of spontaneous circulation. Referenced so the code " +
      "record prompts documentation of post-arrest care and destination.",
    verify_at: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001375",
    verification_note: "Title confirmed on the AHA guideline index; recommendation text not opened in this build.",
  },

  acep_clinical_policies: {
    id: "acep_clinical_policies",
    organisation: "American College of Emergency Physicians",
    title: "ACEP Clinical Policies (board-approved clinical policy collection)",
    edition: "Index retrieved 2026-10-28 — individual policy years are listed per policy",
    url: SITE.acep,
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope:
      "The ACEP clinical policy index lists, among others: Acute Blunt Trauma; Acute Heart Failure Syndromes; " +
      "Asymptomatic Elevated Blood Pressure; Non–ST-Elevation Acute Coronary Syndromes; Reperfusion Therapy for STEMI; " +
      "Seizure; Severe Agitation.",
    verify_at: SITE.acep,
    verification_note:
      "Titles were read on the ACEP clinical policies index on 2026-10-28. The individual policy pages require an ACEP " +
      "member sign-in and could not be opened, so no ACEP recommendation wording is quoted and no policy year is " +
      "asserted here. Confirm each policy and its year at source before relying on it.",
  },

  acep_asymptomatic_bp_2025: {
    id: "acep_asymptomatic_bp_2025",
    organisation: "American College of Emergency Physicians",
    title: "Clinical Policy: Critical Issue in the Outpatient Management of Adult Patients With Asymptomatic Elevated Blood Pressure",
    edition: "Approved by the ACEP Board of Directors 22 January 2025; published July 2025",
    url: "https://www.acep.org/patient-care/clinical-policies/asymptomatic-elevated-blood-pressure",
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope:
      "ACEP clinical policy on adults with asymptomatic elevated blood pressure in the emergency department. Used only " +
      "to prompt documentation that the asymptomatic presentation and the follow-up plan were considered.",
    verify_at: SITE.acep,
    verification_note:
      "Approval date and publication month were read from the ACEP/ACEP Now reporting on 2026-10-28; the policy text " +
      "itself was not opened, so no recommendation is quoted.",
  },

  acs_atls_11: {
    id: "acs_atls_11",
    organisation: "American College of Surgeons — Committee on Trauma",
    title: "Advanced Trauma Life Support (ATLS), 11th edition",
    edition: "ATLS 11, launched 2025",
    url: SITE.acs,
    retrieved: RETRIEVED,
    evidence_type: "consensus_or_program",
    title_verified: true,
    text_verified: false,
    scope:
      "ATLS is a trauma training programme with a structured primary and secondary survey approach. The app records a " +
      "structured primary survey and the times of its elements; it does not reproduce ATLS wording or teach the course.",
    verify_at: SITE.acs,
    verification_note:
      "The ACS page announcing ATLS 11 and its 2025 launch was read on 2026-10-28. The course content is not public, so " +
      "no ATLS instruction is quoted and no claim of ATLS compliance is made.",
  },

  east_damage_control_resuscitation: {
    id: "east_damage_control_resuscitation",
    organisation: "Eastern Association for the Surgery of Trauma",
    title: "Damage control resuscitation in patients with severe traumatic hemorrhage — practice management guideline",
    edition: "2017 (EAST PMG)",
    url: SITE.east,
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope:
      "EAST practice management guideline on damage control resuscitation in severe traumatic haemorrhage. Used only " +
      "to prompt documentation of the resuscitation strategy chosen and the times of its elements.",
    verify_at: SITE.east,
    verification_note:
      "Title and year were read on EAST's own practice management guideline index on 2026-10-28. The recommendation " +
      "text was not opened, so none is quoted.",
  },

  east_hemothorax_occult_pneumothorax: {
    id: "east_hemothorax_occult_pneumothorax",
    organisation: "Eastern Association for the Surgery of Trauma",
    title: "Management of hemothorax and occult pneumothorax — practice management guideline",
    edition: "2011 (EAST PMG)",
    url: SITE.east,
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope: "EAST practice management guideline on haemothorax and occult pneumothorax.",
    verify_at: SITE.east,
    verification_note: "Title and year read on the EAST index; recommendation text not opened in this build.",
  },

  east_ed_thoracotomy: {
    id: "east_ed_thoracotomy",
    organisation: "Eastern Association for the Surgery of Trauma",
    title: "Emergency department thoracotomy — practice management guideline",
    edition: "2015 (EAST PMG)",
    url: SITE.east,
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope: "EAST practice management guideline on emergency department thoracotomy.",
    verify_at: SITE.east,
    verification_note: "Title and year read on the EAST index; recommendation text not opened in this build.",
  },

  east_endotracheal_intubation: {
    id: "east_endotracheal_intubation",
    organisation: "Eastern Association for the Surgery of Trauma",
    title: "Endotracheal intubation following trauma — practice management guideline",
    edition: "2012 (EAST PMG)",
    url: SITE.east,
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope: "EAST practice management guideline on endotracheal intubation following trauma.",
    verify_at: SITE.east,
    verification_note: "Title and year read on the EAST index; recommendation text not opened in this build.",
  },

  east_cervical_spine_clearance: {
    id: "east_cervical_spine_clearance",
    organisation: "Eastern Association for the Surgery of Trauma",
    title: "Cervical spine collar clearance in the obtunded adult blunt trauma patient — practice management guideline",
    edition: "2015 (EAST PMG)",
    url: SITE.east,
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope: "EAST practice management guideline on cervical spine clearance in the obtunded blunt trauma patient.",
    verify_at: SITE.east,
    verification_note: "Title and year read on the EAST index; recommendation text not opened in this build.",
  },

  east_blunt_cerebrovascular_injury: {
    id: "east_blunt_cerebrovascular_injury",
    organisation: "Eastern Association for the Surgery of Trauma",
    title: "Evaluation and management of blunt cerebrovascular injury — practice management guideline",
    edition: "2020 (EAST PMG)",
    url: SITE.east,
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope: "EAST practice management guideline on blunt cerebrovascular injury.",
    verify_at: SITE.east,
    verification_note: "Title and year read on the EAST index; recommendation text not opened in this build.",
  },

  east_handoffs: {
    id: "east_handoffs",
    organisation: "Eastern Association for the Surgery of Trauma",
    title: "Handoffs and transitions of care — practice management guideline",
    edition: "2024 (EAST PMG)",
    url: SITE.east,
    retrieved: RETRIEVED,
    evidence_type: "formal_recommendation",
    title_verified: true,
    text_verified: false,
    scope: "EAST practice management guideline on handoffs and transitions of care.",
    verify_at: SITE.east,
    verification_note: "Title and year read on the EAST index; recommendation text not opened in this build.",
  },

  who_bec: {
    id: "who_bec",
    organisation: "World Health Organization / ICRC (with IFEM)",
    title: "Basic Emergency Care: approach to the acutely ill and injured",
    edition: "WHO–ICRC, 2018 — open-access training course",
    url: SITE.who,
    retrieved: RETRIEVED,
    evidence_type: "consensus_or_program",
    title_verified: true,
    text_verified: false,
    scope:
      "A WHO–ICRC open-access training course for first-contact health care providers managing acute illness and " +
      "injury with limited resources. Referenced for the structured ABCDE approach and the recognition of " +
      "time-critical presentations; it is a training course, not a graded guideline.",
    verify_at: SITE.who,
    verification_note:
      "Title, publishers and course description were read on the WHO page on 2026-10-28. The course manual's wording " +
      "was not opened, so no instruction is quoted or claimed as followed.",
  },
};

export const resolveEmergencyReference = (id) => EMERGENCY_REFERENCES[id] || null;

export const EMERGENCY_REFERENCE_LIST = Object.values(EMERGENCY_REFERENCES);

export const EMERGENCY_REFERENCE_STATS = {
  total: EMERGENCY_REFERENCE_LIST.length,
  text_verified: EMERGENCY_REFERENCE_LIST.filter((r) => r.text_verified).length,
  title_only: EMERGENCY_REFERENCE_LIST.filter((r) => !r.text_verified).length,
};