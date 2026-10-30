// Obstetrics & Gynecology clinical reference register.
//
// THE RULE THIS REGISTER FOLLOWS
//
// A reference is marked `text_verified: true` only when the wording the app
// relies on was actually read at the publisher's own site in this build. A
// reference whose title and link exist but whose recommendation text was not
// opened is `title_verified: true, text_verified: false`. A reference that could
// not be confirmed at all is `text_verified: false` with a `verify_at` link and
// an explicit note.
//
// Nothing in this app claims that a guideline has been "implemented". The notes
// record the clinician's documentation; the safety layer states what was
// documented and its time-sensitivity, and every prompt shows the reference and
// whether that reference was verified — an unverified one is labelled as such in
// the note and in the PDF.

const SITE = {
  acog: "https://www.acog.org/clinical",
  rcog: "https://www.rcog.org.uk/guidance/",
  who_maternal: "https://www.who.int/health-topics/maternal-health",
  figo: "https://www.figo.org/",
  icd: "https://icd.who.int/",
};

export const OBGYN_REFERENCES = {
  // ---- Verified in this build (text read at source, 2026-10-28) -----------
  who_pre_eclampsia_factsheet: {
    id: "who_pre_eclampsia_factsheet",
    organisation: "WHO",
    title: "Pre-eclampsia — fact sheet",
    edition: "Updated 6 October 2026",
    url: "https://www.who.int/news-room/fact-sheets/detail/pre-eclampsia",
    retrieved: "2026-10-28",
    title_verified: true,
    text_verified: true,
    scope:
      "Pre-eclampsia is diagnosed on hypertension (≥140/90 mm Hg) and proteinuria after 20 weeks of gestation; " +
      "severe pre-eclampsia may include severe headache, visual disturbances and upper abdominal pain; " +
      "magnesium sulfate in women with pre-eclampsia reduces the risk of eclampsia by more than half; " +
      "low-dose aspirin from before 20 weeks is a listed prevention measure for women at high risk.",
    verification_note:
      "Read on the WHO site on 2026-10-28. This is a WHO public fact sheet, not a guideline recommendation; it is used " +
      "to state the clinical definitions and the magnesium sulfate rationale, and it cites the guideline documents below.",
  },

  // ---- Listed by WHO on the fact sheet above; recommendation text not opened
  who_pe_eclampsia_2011: {
    id: "who_pe_eclampsia_2011",
    organisation: "WHO",
    title: "WHO recommendations for prevention and treatment of pre-eclampsia and eclampsia",
    edition: "2011",
    url: "https://www.who.int/publications/i/item/9789241548335",
    title_verified: true,
    text_verified: false,
    verification_note:
      "Title, year and link listed by WHO on the pre-eclampsia fact sheet retrieved 2026-10-28. The recommendation " +
      "wording itself was not opened in this build, so the app does not quote it.",
  },
  who_severe_hypertension_2018: {
    id: "who_severe_hypertension_2018",
    organisation: "WHO",
    title: "WHO recommendations: drug treatment for severe hypertension in pregnancy",
    edition: "2018",
    url: "https://www.who.int/publications/i/item/9789241550437",
    title_verified: true,
    text_verified: false,
    verification_note:
      "Title, year and link listed by WHO on the pre-eclampsia fact sheet retrieved 2026-10-28. Recommendation text not opened.",
  },
  who_non_severe_hypertension_2020: {
    id: "who_non_severe_hypertension_2020",
    organisation: "WHO",
    title: "WHO recommendations on drug treatment for non-severe hypertension in pregnancy",
    edition: "2020",
    url: "https://www.who.int/publications/i/item/9789240008793",
    title_verified: true,
    text_verified: false,
    verification_note:
      "Title, year and link listed by WHO on the pre-eclampsia fact sheet retrieved 2026-10-28. Recommendation text not opened.",
  },
  who_antiplatelet_2021: {
    id: "who_antiplatelet_2021",
    organisation: "WHO",
    title: "WHO recommendations on antiplatelet agents for the prevention of pre-eclampsia",
    edition: "2021",
    url: "https://www.who.int/publications/i/item/9789240037540",
    title_verified: true,
    text_verified: false,
    verification_note:
      "Title, year and link listed by WHO on the pre-eclampsia fact sheet retrieved 2026-10-28. Recommendation text not opened.",
  },
  who_anc_2016: {
    id: "who_anc_2016",
    organisation: "WHO",
    title: "WHO recommendations on antenatal care for a positive pregnancy experience",
    edition: "2016",
    url: "https://www.who.int/publications/i/item/9789241549912",
    title_verified: true,
    text_verified: false,
    verification_note:
      "Title, year and link listed by WHO on the pre-eclampsia fact sheet retrieved 2026-10-28. Recommendation text not opened.",
  },

  // ---- Not confirmed in this build — labelled, never presented as verified --
  who_pph: {
    id: "who_pph",
    organisation: "WHO",
    title: "WHO guidance on postpartum haemorrhage (prevention and treatment)",
    edition: "Edition not confirmed in this build",
    url: SITE.who_maternal,
    title_verified: false,
    text_verified: false,
    verification_note:
      "Could not be confirmed at source in this build: the WHO postpartum haemorrhage fact-sheet address returned " +
      "'page cannot be found'. The PPH prompts are therefore stated as AMedix clinical triage triggers and require " +
      "sign-off against the current WHO and FIGO PPH guidance before they are relied on.",
  },
  acog_hypertension: {
    id: "acog_hypertension",
    organisation: "ACOG",
    title: "ACOG clinical guidance on gestational hypertension and pre-eclampsia",
    edition: "Document number and year not confirmed in this build",
    url: SITE.acog,
    title_verified: false,
    text_verified: false,
    verification_note:
      "ACOG document numbers and revision dates were not confirmed at source in this build, so none is cited. " +
      "Confirm the current Practice Bulletin at acog.org/clinical before this reference is relied on.",
  },
  acog_pph: {
    id: "acog_pph",
    organisation: "ACOG",
    title: "ACOG clinical guidance on postpartum haemorrhage",
    edition: "Document number and year not confirmed in this build",
    url: SITE.acog,
    title_verified: false,
    text_verified: false,
    verification_note:
      "Document number and revision date not confirmed at source in this build. Confirm at acog.org/clinical.",
  },
  acog_ectopic: {
    id: "acog_ectopic",
    organisation: "ACOG",
    title: "ACOG clinical guidance on tubal ectopic pregnancy",
    edition: "Document number and year not confirmed in this build",
    url: SITE.acog,
    title_verified: false,
    text_verified: false,
    verification_note:
      "Document number and revision date not confirmed at source in this build. Confirm at acog.org/clinical.",
  },
  rcog_sepsis: {
    id: "rcog_sepsis",
    organisation: "RCOG",
    title: "RCOG guidance on maternal sepsis",
    edition: "Green-top number and year not confirmed in this build",
    url: SITE.rcog,
    title_verified: false,
    text_verified: false,
    verification_note:
      "Green-top Guideline number and revision date not confirmed at source in this build. Confirm at rcog.org.uk/guidance.",
  },
  rcog_vte: {
    id: "rcog_vte",
    organisation: "RCOG",
    title: "RCOG guidance on reducing the risk of venous thromboembolism during pregnancy and the puerperium",
    edition: "Green-top number and year not confirmed in this build",
    url: SITE.rcog,
    title_verified: false,
    text_verified: false,
    verification_note:
      "Green-top Guideline number and revision date not confirmed at source in this build. Confirm at rcog.org.uk/guidance.",
  },
  figo_pph: {
    id: "figo_pph",
    organisation: "FIGO",
    title: "FIGO guidance on postpartum haemorrhage",
    edition: "Edition not confirmed in this build",
    url: SITE.figo,
    title_verified: false,
    text_verified: false,
    verification_note:
      "FIGO document and edition not confirmed at source in this build. Confirm at figo.org.",
  },
  figo_wellbeing: {
    id: "figo_wellbeing",
    organisation: "FIGO",
    title: "FIGO intrapartum fetal monitoring guidance",
    edition: "Edition not confirmed in this build",
    url: SITE.figo,
    title_verified: false,
    text_verified: false,
    verification_note: "Edition not confirmed at source in this build. Confirm at figo.org.",
  },
  icd11_mms: {
    id: "icd11_mms",
    organisation: "WHO",
    title: "ICD-11 for Mortality and Morbidity Statistics",
    edition: "Release 2026-01",
    url: SITE.icd,
    title_verified: true,
    text_verified: true,
    verification_note:
      "Codes and display terms in this specialty's catalogue were read from the published 2026-01 tabulation on " +
      "2026-10-28. Inclusion and exclusion notes are not reproduced, so a residual code is never presented as " +
      "equivalent to a specific category.",
  },
  amedix_local_triage: {
    id: "amedix_local_triage",
    organisation: "AMedix",
    title: "AMedix obstetric safety trigger set (local clinical decision, not a guideline)",
    edition: "This build, 2026-10-28",
    title_verified: true,
    text_verified: true,
    verification_note:
      "Written by AMedix and awaiting obstetric sign-off. It records what was documented and its time-sensitivity; " +
      "it does not diagnose, prescribe or order anything, and it is labelled as a local trigger wherever it appears.",
  },
};

export const resolveObgynReference = (id) => OBGYN_REFERENCES[id] || null;

export const isVerifiedObgynReference = (id) => {
  const r = resolveObgynReference(id);
  return Boolean(r && r.text_verified);
};

export const obgynReferenceLine = (id) => {
  const r = resolveObgynReference(id);
  if (!r) return "";
  const state = r.text_verified
    ? "verified at source"
    : r.title_verified
      ? "title and link verified; recommendation text not opened"
      : "NOT verified in this build";
  return `${r.organisation}${r.title ? ` — ${r.title}` : ""}${r.edition ? ` (${r.edition})` : ""} · ${state}`;
};